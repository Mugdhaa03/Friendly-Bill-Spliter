import { Hono } from "hono";
import { cors } from "hono/cors";
import { equalSplitCents, majorUnitsToCents } from "./lib/money";

type Bindings = { DB: D1Database };
const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "/api/*",
  cors({ origin: "*", allowMethods: ["GET", "POST", "PATCH"] }),
);
app.onError((error, context) => {
  console.error(error);
  return context.json({ error: "Internal server error" }, 500);
});

app.get("/api/health", (context) => context.json({ ok: true }));

app.post("/api/homes", async (context) => {
  const body = await context.req.json<{ name: string }>();
  const name = body.name?.trim();
  if (!name || name.length > 80)
    return context.json({ error: "Home name is required" }, 400);

  const id = crypto.randomUUID();
  const inviteCode = crypto.randomUUID().slice(0, 8).toUpperCase();
  await context.env.DB.prepare(
    "INSERT INTO homes (id, name, invite_code) VALUES (?, ?, ?)",
  )
    .bind(id, name, inviteCode)
    .run();
  return context.json({ id, name, inviteCode }, 201);
});

app.post("/api/homes/:homeId/members", async (context) => {
  const body = await context.req.json<{ name: string; email?: string }>();
  const name = body.name?.trim();
  if (!name || name.length > 80)
    return context.json({ error: "Member name is required" }, 400);
  const id = crypto.randomUUID();
  try {
    await context.env.DB.prepare(
      "INSERT INTO members (id, home_id, name, email) VALUES (?, ?, ?, ?)",
    )
      .bind(id, context.req.param("homeId"), name, body.email?.trim() || null)
      .run();
  } catch {
    return context.json({ error: "Member could not be added" }, 409);
  }
  return context.json({ id, name, email: body.email || null }, 201);
});

app.post("/api/homes/:homeId/expenses", async (context) => {
  const body = await context.req.json<{
    title: string;
    category?: string;
    amount: number;
    paidBy: string;
    date?: string;
  }>();
  const title = body.title?.trim();
  if (!title || !body.paidBy)
    return context.json({ error: "Title and payer are required" }, 400);

  let amountCents: number;
  try {
    amountCents = majorUnitsToCents(body.amount);
  } catch (error) {
    return context.json(
      { error: error instanceof Error ? error.message : "Invalid amount" },
      400,
    );
  }

  const homeId = context.req.param("homeId");
  const members = await context.env.DB.prepare(
    "SELECT id FROM members WHERE home_id = ? ORDER BY created_at, id",
  )
    .bind(homeId)
    .all<{ id: string }>();
  if (!members.results.length)
    return context.json({ error: "Add at least one member first" }, 400);

  const payerExists = members.results.some(
    (member) => member.id === body.paidBy,
  );
  if (!payerExists)
    return context.json({ error: "Payer must belong to this home" }, 400);

  const expenseId = crypto.randomUUID();
  const shares = equalSplitCents(amountCents, members.results.length);
  const statements = [
    context.env.DB.prepare(
      "INSERT INTO expenses (id, home_id, paid_by, title, category, amount_cents, expense_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).bind(
      expenseId,
      homeId,
      body.paidBy,
      title,
      body.category || "Other",
      amountCents,
      body.date || new Date().toISOString().slice(0, 10),
    ),
    ...members.results.map((member, index) =>
      context.env.DB.prepare(
        "INSERT INTO expense_shares (id, expense_id, member_id, amount_cents) VALUES (?, ?, ?, ?)",
      ).bind(crypto.randomUUID(), expenseId, member.id, shares[index]),
    ),
  ];
  await context.env.DB.batch(statements);
  return context.json({ id: expenseId, amountCents, shares }, 201);
});

app.post("/api/shares/:shareId/payments", async (context) => {
  const idempotencyKey = context.req.header("Idempotency-Key");
  if (!idempotencyKey || idempotencyKey.length > 100) {
    return context.json({ error: "Idempotency-Key header is required" }, 400);
  }

  const body = await context.req.json<{ amount: number }>();
  let amountCents: number;
  try {
    amountCents = majorUnitsToCents(body.amount);
  } catch (error) {
    return context.json(
      { error: error instanceof Error ? error.message : "Invalid amount" },
      400,
    );
  }

  const existing = await context.env.DB.prepare(
    "SELECT id, amount_cents, status FROM payments WHERE idempotency_key = ?",
  )
    .bind(idempotencyKey)
    .first<{ id: string; amount_cents: number; status: string }>();
  if (existing)
    return context.json(
      { id: existing.id, status: existing.status, duplicate: true },
      200,
    );

  const shareId = context.req.param("shareId");
  const share = await context.env.DB.prepare(`
    SELECT es.id, es.amount_cents, es.paid_cents, es.member_id, es.expense_id,
           e.home_id
    FROM expense_shares es JOIN expenses e ON e.id = es.expense_id
    WHERE es.id = ?
  `)
    .bind(shareId)
    .first<{
      id: string;
      amount_cents: number;
      paid_cents: number;
      member_id: string;
      expense_id: string;
      home_id: string;
    }>();
  if (!share) return context.json({ error: "Share not found" }, 404);
  if (share.paid_cents + amountCents > share.amount_cents) {
    return context.json({ error: "Payment exceeds remaining balance" }, 409);
  }

  const paymentId = crypto.randomUUID();
  await context.env.DB.batch([
    context.env.DB.prepare(`
      UPDATE expense_shares SET paid_cents = paid_cents + ?
      WHERE id = ? AND paid_cents + ? <= amount_cents
    `).bind(amountCents, shareId, amountCents),
    context.env.DB.prepare(`
      INSERT INTO payments (id, home_id, expense_id, share_id, member_id, amount_cents, idempotency_key)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      paymentId,
      share.home_id,
      share.expense_id,
      shareId,
      share.member_id,
      amountCents,
      idempotencyKey,
    ),
  ]);
  return context.json({ id: paymentId, status: "completed" }, 201);
});

app.get("/api/homes/:homeId/dashboard", async (context) => {
  const homeId = context.req.param("homeId");
  const home = await context.env.DB.prepare("SELECT * FROM homes WHERE id = ?")
    .bind(homeId)
    .first();
  if (!home) return context.json({ error: "Home not found" }, 404);
  const members = await context.env.DB.prepare(
    "SELECT * FROM members WHERE home_id = ?",
  )
    .bind(homeId)
    .all();
  const expenses = await context.env.DB.prepare(`
    SELECT e.*, COALESCE(SUM(es.paid_cents), 0) AS paid_cents, COUNT(es.id) AS share_count
    FROM expenses e LEFT JOIN expense_shares es ON es.expense_id = e.id
    WHERE e.home_id = ? GROUP BY e.id ORDER BY e.expense_date DESC
  `)
    .bind(homeId)
    .all();
  return context.json({
    home,
    members: members.results,
    expenses: expenses.results,
  });
});

export default app;
