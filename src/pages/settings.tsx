import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import ErpPageHeader from "@/components/common/ErpPageHeader";
import Button from "@/components/common/Button";
import { CheckCircleIcon } from "@/components/common/Icons";
import { apiRequest } from "@/lib/api";

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiRequest<{ items: Record<string, unknown>[] }>("settings")
      .then((r) => {
        const setting = r.items.find((v) => v.key === "business");
        if (setting) {
          const value = setting.value as {
            businessName?: string;
            address?: string;
            phone?: string;
          };
          setBusinessName(value.businessName || "");
          setAddress(value.address || "");
          setPhone(value.phone || "");
        }
      })
      .catch(() => {});
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaved("");
    setLoading(true);
    try {
      await apiRequest("settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "business",
          value: { businessName, address, phone },
        }),
      });
      setSaved("Business profile and operational settings saved.");
    } catch {
      setSaved("Error saving settings.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="erp-module">
      <ErpPageHeader
        title="Business Profile & Settings"
        description="Configure enterprise company name, operational terminal address, invoice headers and contact details."
      />

      {saved && (
        <div className="erp-alert erp-alert--success" role="status" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircleIcon size={18} color="#0f766e" />
          <span>{saved}</span>
        </div>
      )}

      <div className="erp-card" style={{ maxWidth: "680px", padding: "28px" }}>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div className="erp-field-group">
            <label htmlFor="setting-bname">Business / Company Name*</label>
            <input
              id="setting-bname"
              required
              className="erp-input"
              value={businessName}
              placeholder="e.g. Tanker Wash Management Pvt Ltd"
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>

          <div className="erp-field-group">
            <label htmlFor="setting-addr">Terminal & Wash Hub Address*</label>
            <textarea
              id="setting-addr"
              rows={3}
              required
              className="erp-input"
              value={address}
              placeholder="Enter complete facility address..."
              onChange={(e) => setAddress(e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          <div className="erp-field-group">
            <label htmlFor="setting-phone">Support / Reception Phone Number</label>
            <input
              id="setting-phone"
              type="tel"
              className="erp-input"
              value={phone}
              placeholder="+91 98765 43210"
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div style={{ marginTop: "12px" }}>
            <Button type="submit" disabled={loading} className="erp-btn erp-btn--primary">
              {loading ? "Saving..." : "Save Business Settings"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
