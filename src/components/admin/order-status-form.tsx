"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { updateOrderStatus } from "@/lib/actions/orders";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

const STATUSES = [
  "PENDING",
  "PAID",
  "FULFILLED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

export function OrderStatusForm({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const result = await updateOrderStatus(orderId, status);
      if (result && "error" in result) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Unexpected error — please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto">
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>
      <Button size="sm" onClick={handleSave} disabled={saving || status === currentStatus}>
        {saving ? "Saving…" : "Update Status"}
      </Button>
      {saved && status === currentStatus && (
        <span className="text-xs text-emerald-600">Saved.</span>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
