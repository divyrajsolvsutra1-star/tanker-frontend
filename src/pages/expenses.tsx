import { useEffect, useState } from "react";
import CrudModule from "@/components/business/CrudModule";
import { getBusinessResource } from "@/lib/api";

export default function ExpensesPage() {
  const [bankOptions, setBankOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    getBusinessResource<Record<string, unknown>>("bank-accounts", { limit: 100 })
      .then((res) => {
        const list = "items" in res ? res.items : [];
        setBankOptions(
          list.map((b) => ({
            value: String(b._id),
            label: `${String(b.bankName)} - ${String(b.accountName)}`,
          }))
        );
      })
      .catch(() => {});
  }, []);

  return (
    <CrudModule
      title="Expense Management"
      description="Record and categorize daily and monthly tanker wash business operating expenses."
      path="expenses"
      fields={[
        { name: "expenseDate", label: "Expense Date", type: "date", required: true },
        {
          name: "category",
          label: "Category",
          required: true,
          options: [
            "Electricity",
            "Water",
            "Rent",
            "Maintenance",
            "Diesel / Fuel",
            "Machinery Repair",
            "Office Expenses",
            "Other Expenses",
          ].map((v) => ({ value: v, label: v })),
        },
        { name: "description", label: "Description / Particulars" },
        { name: "amount", label: "Amount (₹)", type: "number", required: true, min: 0 },
        {
          name: "paymentMode",
          label: "Payment Mode",
          required: true,
          options: [
            { value: "cash", label: "Cash" },
            { value: "upi", label: "UPI" },
            { value: "bank", label: "Bank" },
          ],
        },
        {
          name: "accountId",
          label: "Paid From Bank Account",
          options: bankOptions.length ? bankOptions : undefined,
        },
      ]}
    />
  );
}
