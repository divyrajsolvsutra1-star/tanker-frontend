import CrudModule from "@/components/business/CrudModule";

export default function ExpenseCategoriesPage() {
  return (
    <CrudModule
      title="Expense Categories"
      description="Manage operating expense categories for classifying business spending, repairs, and utilities."
      path="expense-categories"
      fields={[
        {
          name: "name",
          label: "Category Name",
          required: true,
          validationMessage: "Category Name is required.",
        },
        {
          name: "description",
          label: "Description / Notes",
        },
        {
          name: "status",
          label: "Status",
          options: [
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ],
        },
      ]}
    />
  );
}
