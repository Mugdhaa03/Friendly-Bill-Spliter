import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

type Member = { id: string; name: string; initials: string; color: string };
type Expense = {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  paidBy: string;
  paid: number;
};

const membersSeed: Member[] = [
  { id: "alex", name: "Alex Kim", initials: "AK", color: "#d9a47b" },
  { id: "jordan", name: "Jordan Lee", initials: "JL", color: "#809aa4" },
  { id: "morgan", name: "Morgan Chen", initials: "MC", color: "#b3a6c7" },
  { id: "sam", name: "Sam Rivera", initials: "SR", color: "#d3b46d" },
];

const expensesSeed: Expense[] = [
  {
    id: "1",
    title: "Electricity Bill",
    category: "Utilities",
    amount: 124.8,
    date: "Nov 5",
    paidBy: "alex",
    paid: 124.8,
  },
  {
    id: "2",
    title: "Weekly Groceries",
    category: "Groceries",
    amount: 96.42,
    date: "Nov 3",
    paidBy: "jordan",
    paid: 72.32,
  },
  {
    id: "3",
    title: "Internet",
    category: "Utilities",
    amount: 79.99,
    date: "Nov 1",
    paidBy: "morgan",
    paid: 79.99,
  },
  {
    id: "4",
    title: "Cleaning Supplies",
    category: "Household",
    amount: 38.5,
    date: "Oct 29",
    paidBy: "sam",
    paid: 38.5,
  },
];

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(value);
}

function Dashboard() {
  const [members, setMembers] = useState(membersSeed);
  const [expenses, setExpenses] = useState(expensesSeed);
  const [showExpense, setShowExpense] = useState(false);
  const [showMember, setShowMember] = useState(false);
  const [toast, setToast] = useState("");

  const totals = useMemo(() => {
    const total = expenses.reduce((sum, item) => sum + item.amount, 0);
    const paid = expenses.reduce((sum, item) => sum + item.paid, 0);
    return { total, paid, outstanding: total - paid };
  }, [expenses]);

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">MAPLE HOUSE</p>
          <h1>Good morning, Alex</h1>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => setShowExpense(true)}
        >
          <span>+</span> Add expense
        </button>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-icon purple">₹</div>
          <div>
            <span>Total shared</span>
            <strong>{money(totals.total)}</strong>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon green">✓</div>
          <div>
            <span>Paid</span>
            <strong>{money(totals.paid)}</strong>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon amber">!</div>
          <div>
            <span>Outstanding</span>
            <strong>{money(totals.outstanding)}</strong>
          </div>
        </article>
      </section>

      <section className="content-grid">
        <div className="expenses-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">RECENT ACTIVITY</p>
              <h2>Shared expenses</h2>
            </div>
            <button type="button" className="text-button">
              View all
            </button>
          </div>
          <div className="expense-list">
            {expenses.map((expense) => {
              const payer =
                members.find((member) => member.id === expense.paidBy) ??
                members[0];
              const complete = expense.paid >= expense.amount;
              return (
                <article className="expense-row" key={expense.id}>
                  <div
                    className={`category-icon category-${expense.category.toLowerCase()}`}
                  >
                    {expense.category === "Utilities"
                      ? "⌁"
                      : expense.category === "Groceries"
                        ? "◒"
                        : "▦"}
                  </div>
                  <div className="expense-main">
                    <strong>{expense.title}</strong>
                    <span>
                      {expense.category} · {expense.date}
                    </span>
                  </div>
                  <div className="paid-by">
                    <span>Paid by</span>
                    <div>
                      <i style={{ background: payer.color }}>
                        {payer.initials}
                      </i>
                      {payer.name}
                    </div>
                  </div>
                  <div className="amount">
                    <strong>{money(expense.amount)}</strong>
                    <span
                      className={complete ? "status paid" : "status unpaid"}
                    >
                      {complete
                        ? "✓ Paid in full"
                        : `${money(expense.amount - expense.paid)} left`}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="members-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">HOUSEHOLD</p>
              <h2>Members</h2>
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={() => setShowMember(true)}
            >
              +
            </button>
          </div>
          <div className="members-list">
            {members.map((member) => (
              <div className="member-row" key={member.id}>
                <i style={{ background: member.color }}>{member.initials}</i>
                <strong>{member.name}</strong>
                <span>{member.id === "alex" ? "You" : "Member"}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {showExpense && (
        <ExpenseModal
          members={members}
          onClose={() => setShowExpense(false)}
          onSave={(expense) => {
            setExpenses((current) => [expense, ...current]);
            setShowExpense(false);
            setToast("Expense added and split equally");
            window.setTimeout(() => setToast(""), 2600);
          }}
        />
      )}
      {showMember && (
        <MemberModal
          onClose={() => setShowMember(false)}
          onSave={(name) => {
            const initials = name
              .split(/\s+/)
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            setMembers((current) => [
              ...current,
              { id: crypto.randomUUID(), name, initials, color: "#7c9b78" },
            ]);
            setShowMember(false);
            setToast(`${name} added to the home`);
            window.setTimeout(() => setToast(""), 2600);
          }}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

function ExpenseModal({
  members,
  onClose,
  onSave,
}: {
  members: Member[];
  onClose: () => void;
  onSave: (expense: Expense) => void;
}) {
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amount = Number(form.get("amount"));
    if (!Number.isFinite(amount) || amount <= 0) return;
    onSave({
      id: crypto.randomUUID(),
      title: String(form.get("title")),
      category: String(form.get("category")),
      amount,
      date: "Today",
      paidBy: String(form.get("paidBy")),
      paid: 0,
    });
  }
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form
        className="modal"
        onSubmit={submit}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-heading">
          <h2>Add shared expense</h2>
          <button type="button" onClick={onClose}>
            ×
          </button>
        </div>
        <label>
          Expense name
          <input name="title" required placeholder="e.g. Water bill" />
        </label>
        <label>
          Amount
          <div className="money-input">
            <span>₹</span>
            <input
              name="amount"
              required
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
            />
          </div>
        </label>
        <label>
          Category
          <select name="category">
            <option>Utilities</option>
            <option>Groceries</option>
            <option>Household</option>
            <option>Other</option>
          </select>
        </label>
        <label>
          Paid by
          <select name="paidBy">
            {members.map((member) => (
              <option value={member.id} key={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
        <button className="primary-button wide" type="submit">
          Add expense
        </button>
      </form>
    </div>
  );
}

function MemberModal({
  onClose,
  onSave,
}: { onClose: () => void; onSave: (name: string) => void }) {
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name")).trim();
    if (name) onSave(name);
  }
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form
        className="modal small"
        onSubmit={submit}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-heading">
          <h2>Add a member</h2>
          <button type="button" onClick={onClose}>
            ×
          </button>
        </div>
        <label>
          Name
          <input name="name" required placeholder="Full name" />
        </label>
        <label>
          Email
          <input name="email" type="email" placeholder="optional@email.com" />
        </label>
        <button className="primary-button wide" type="submit">
          Send invite
        </button>
      </form>
    </div>
  );
}
