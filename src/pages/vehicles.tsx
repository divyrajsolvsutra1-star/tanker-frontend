import { useEffect, useState } from "react";
import CrudModule from "@/components/business/CrudModule";
import { getBusinessResource } from "@/lib/api";

export default function VehiclesPage() {
  const [customerOptions, setCustomerOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    getBusinessResource<Record<string, unknown>>("customers", { limit: 100 })
      .then((res) => {
        const list = "items" in res ? res.items : [];
        setCustomerOptions(
          list.map((c) => ({
            value: String(c._id),
            label: `${String(c.name)} (${String(c.customerType || "Account")})`,
          }))
        );
      })
      .catch(() => {});
  }, []);

  return (
    <CrudModule
      title="Tanker Vehicle Registration"
      description="Register tanker vehicles, link to customer company, and maintain driver records."
      path="vehicles"
      fields={[
        { name: "vehicleNumber", label: "Vehicle / Tanker Number", required: true },
        {
          name: "customerId",
          label: "Customer / Company Owner",
          required: true,
          options: customerOptions.length ? customerOptions : undefined,
        },
        { name: "driverName", label: "Driver Name" },
        { name: "driverMobileNumber", label: "Driver Mobile Number" },
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
