import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import CrudModule from "@/components/business/CrudModule";
import { getBusinessResource } from "@/lib/api";
import { QuickBankAccountModal, QuickExpenseCategoryModal } from "@/components/quick-masters";

const DEFAULT_CATEGORIES = [
  "Electricity",
  "Water",
  "Rent",
  "Maintenance",
  "Diesel / Fuel",
  "Machinery Repair",
  "Office Expenses",
  "Chemicals / Cleaning Supplies",
  "Tea & Refreshments",
  "Miscellaneous",
];

export default function ExpensesPage() {
  const router = useRouter();
  const [bankOptions, setBankOptions] = useState<{ value: string; label: string }[]>([]);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState("");

  const [categoryOptions, setCategoryOptions] = useState<{ value: string; label: string }[]>(
    DEFAULT_CATEGORIES.map((c) => ({ value: c, label: c }))
  );
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");

  const [externalValues, setExternalValues] = useState<Record<string, string | number>>({});
  const setFieldValueRef = useRef<((fieldName: string, value: string | number) => void) | null>(null);
  const openCreateRef = useRef<(() => void) | null>(null);

  function loadCategories() {
    getBusinessResource<Record<string, unknown>>("expense-categories", { limit: 100 })
      .then((res) => {
        const list = "items" in res ? res.items : [];
        if (list.length > 0) {
          const opts = list
            .filter((c) => c.status !== "inactive")
            .map((c) => ({
              value: String(c.name),
              label: String(c.name),
            }));
          setCategoryOptions(opts);
        }
      })
      .catch(() => { });
  }

  function loadBankAccounts() {
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
      .catch(() => { });
  }

  useEffect(() => {
    loadCategories();
    loadBankAccounts();
  }, []);

  useEffect(() => {
    if (router.query.action === "new") {
      openCreateRef.current?.();
    }
  }, [router.query.action]);

  function handleCategoryCreated(created: Record<string, unknown>) {
    const newName = String(created.name || "").trim();
    if (!newName) return;
    const newOpt = { value: newName, label: newName };
    setCategoryOptions((prev) => [newOpt, ...prev.filter((o) => o.value !== newName)]);
    setExternalValues((prev) => ({ ...prev, category: newName }));
    setFieldValueRef.current?.("category", newName);
  }

  function handleBankCreated(created: Record<string, unknown>) {
    const newId = String(created._id || (created as { id?: string }).id || "");
    if (!newId) return;
    const newOpt = {
      value: newId,
      label: `${String(created.bankName)} - ${String(created.accountName)}`,
    };
    setBankOptions((prev) => [newOpt, ...prev.filter((o) => o.value !== newId)]);
    setExternalValues((prev) => ({ ...prev, accountId: newId }));
    setFieldValueRef.current?.("accountId", newId);
  }

  return (
    <>
      <CrudModule
        title="Expense Management"
        description="Record and categorize daily and monthly tanker wash business operating expenses."
        path="expenses"
        externalValues={externalValues}
        registerSetValue={(setter) => {
          setFieldValueRef.current = setter;
        }}
        registerOpenCreate={(opener) => {
          openCreateRef.current = opener;
        }}
        fields={[
          { name: "expenseDate", label: "Expense Date", type: "date", required: true },
          {
            name: "category",
            label: "Category",
            required: true,
            options: categoryOptions,
            onAddNew: (query) => {
              setCategorySearchQuery(query || "");
              setIsCategoryModalOpen(true);
            },
            addNewLabel: "Add New Category",
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
            onAddNew: (query) => {
              setBankSearchQuery(query || "");
              setIsBankModalOpen(true);
            },
            addNewLabel: "Add Bank Account",
          },
        ]}
      />

      <QuickExpenseCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={handleCategoryCreated}
        initialName={categorySearchQuery}
      />

      <QuickBankAccountModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        onSuccess={handleBankCreated}
        initialName={bankSearchQuery}
      />
    </>
  );
}
