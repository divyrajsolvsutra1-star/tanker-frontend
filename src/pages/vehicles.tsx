import { useEffect, useRef, useState } from "react";
import CrudModule from "@/components/business/CrudModule";
import { getBusinessResource } from "@/lib/api";
import { QuickCustomerModal } from "@/components/quick-masters";

export default function VehiclesPage() {
  const [customerOptions, setCustomerOptions] = useState<{ value: string; label: string }[]>([]);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [externalValues, setExternalValues] = useState<Record<string, string | number>>({});
  const setFieldValueRef = useRef<((fieldName: string, value: string | number) => void) | null>(null);

  function loadCustomers() {
    getBusinessResource<Record<string, unknown>>("customers", { limit: 100 })
      .then((res) => {
        const list = "items" in res ? res.items : [];
        setCustomerOptions(
          list.map((c) => ({
            value: String(c._id),
            label: c.customerType
              ? `${String(c.name)} (${String(c.customerType)})`
              : String(c.name),
          }))
        );
      })
      .catch(() => { });
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  function handleCustomerCreated(created: Record<string, unknown>) {
    const newId = String(created._id || (created as { id?: string }).id || "");
    if (!newId) return;
    const newOpt = {
      value: newId,
      label: created.customerType
        ? `${String(created.name)} (${String(created.customerType)})`
        : String(created.name),
    };
    // Add to options immediately
    setCustomerOptions((prev) => [newOpt, ...prev.filter((o) => o.value !== newId)]);
    // Update CrudModule form state via both declarative externalValues & ref setter
    setExternalValues({ customerId: newId });
    setFieldValueRef.current?.("customerId", newId);
  }

  return (
    <>
      <CrudModule
        title="Tanker Vehicle Registration"
        description="Register tanker vehicles, link to customer company, and maintain driver records."
        path="vehicles"
        externalValues={externalValues}
        registerSetValue={(setter) => {
          setFieldValueRef.current = setter;
        }}
        fields={[
          {
            name: "vehicleNumber",
            label: "Vehicle / Tanker Number",
            required: true,
            validate: (val, _form, items, editingId) => {
              const raw = String(val || "").trim();
              if (!raw) return "Vehicle / Tanker Number is required.";
              const clean = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
              if (clean.length < 5) {
                return "Enter a valid vehicle plate (e.g. GJ-05-MH-2005).";
              }
              const duplicate = items.find((item) => {
                if (editingId && String(item._id) === String(editingId)) return false;
                const itemClean = String(item.vehicleNumber || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
                return itemClean === clean;
              });
              if (duplicate) {
                const cust = duplicate.customerId as { name?: string } | undefined;
                const custName = cust?.name || "another customer";
                return `Vehicle plate '${duplicate.vehicleNumber}' is already registered with customer '${custName}'. Duplicate plates are not permitted.`;
              }
              return null;
            },
          },
          {
            name: "customerId",
            label: "Customer / Company Owner",
            required: true,
            options: customerOptions.length ? customerOptions : undefined,
            onAddNew: (query) => {
              setCustomerSearchQuery(query || "");
              setIsCustomerModalOpen(true);
            },
            addNewLabel: "Add New Customer",
          },
          { name: "driverName", label: "Driver Name" },
          {
            name: "driverMobileNumber",
            label: "Driver Mobile Number",
            type: "tel",
            inputMode: "numeric",
            maxLength: 10,
            pattern: "[6-9][0-9]{9}",
            validationMessage: "Enter a valid 10-digit mobile number (starting 6-9).",
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

      <QuickCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSuccess={handleCustomerCreated}
        initialName={customerSearchQuery}
      />
    </>
  );
}
