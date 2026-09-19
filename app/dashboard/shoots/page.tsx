"use client";

import React, { useState, useEffect } from "react";
import { Plus, Calendar as CalendarIcon, Clock, MapPin, User, CheckSquare, AlertTriangle, Video } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";

export default function ShootsPage() {
  const [shoots, setShoots] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // Selected Shoot for checklist modal
  const [selectedShoot, setSelectedShoot] = useState<any | null>(null);
  const [checklistLoading, setChecklistLoading] = useState(false);

  // Schedule Shoot Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientId: "",
    orderId: "",
    creatorId: "",
    shootDate: new Date().toISOString().slice(0, 10),
    shootTime: "10:00 AM - 2:00 PM",
    location: "Studio 4A, Bandra West, Mumbai",
    specialNotes: "",
    status: "SCHEDULED",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchShoots();
    loadRelations();
  }, []);

  const fetchShoots = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shoots");
      if (res.ok) {
        const data = await res.json();
        setShoots(data.shoots || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const loadRelations = async () => {
    try {
      const [cRes, clRes, oRes] = await Promise.all([
        fetch("/api/creators"),
        fetch("/api/clients?limit=100"),
        fetch("/api/orders"),
      ]);
      if (cRes.ok && clRes.ok && oRes.ok) {
        const cData = await cRes.json();
        const clData = await clRes.json();
        const oData = await oRes.json();
        setCreators(cData.creators || []);
        setClients(clData.clients || []);
        setOrders(oData.orders || []);
        if (cData.creators?.length > 0 && clData.clients?.length > 0 && oData.orders?.length > 0) {
          setFormData((prev) => ({
            ...prev,
            creatorId: cData.creators[0].id,
            clientId: clData.clients[0].id,
            orderId: oData.orders[0].id,
          }));
        }
      }
    } catch {
      // ignore
    }
  };

  const handleScheduleShoot = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const res = await fetch("/api/shoots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to schedule shoot");
      }

      setIsModalOpen(false);
      fetchShoots();
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleChecklist = async (shootId: string, itemKey: string, currentVal: boolean) => {
    setChecklistLoading(true);
    try {
      const updatedChecklist = { [itemKey]: !currentVal };
      const res = await fetch(`/api/shoots/${shootId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preShootChecklist: updatedChecklist }),
      });
      if (res.ok) {
        const json = await res.json();
        setSelectedShoot(json.shoot);
        fetchShoots();
      }
    } catch {
      // ignore
    } finally {
      setChecklistLoading(false);
    }
  };

  const handleToggleVerification = async (shootId: string, itemKey: string, currentVal: boolean) => {
    setChecklistLoading(true);
    try {
      const updatedPost = { [itemKey]: !currentVal };
      const res = await fetch(`/api/shoots/${shootId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postShootVerification: updatedPost }),
      });
      if (res.ok) {
        const json = await res.json();
        setSelectedShoot(json.shoot);
        fetchShoots();
      }
    } catch {
      // ignore
    } finally {
      setChecklistLoading(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Shoot Production Management</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Production schedules, creator double-booking protection, pre-shoot checklists & post-shoot verification.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                viewMode === "list" ? "bg-amber-500 text-charcoal font-bold" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                viewMode === "calendar" ? "bg-amber-500 text-charcoal font-bold" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Calendar Schedule
            </button>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Schedule New Shoot
          </Button>
        </div>
      </div>

      {/* Shoots Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <p className="col-span-3 text-center py-12 text-zinc-500 text-xs">Loading shoot schedule...</p>
        ) : shoots.length === 0 ? (
          <p className="col-span-3 text-center py-12 text-zinc-500 text-xs">No shoots scheduled.</p>
        ) : (
          shoots.map((sh) => {
            const preCheck = JSON.parse(sh.preShootChecklist || "{}");
            const postCheck = JSON.parse(sh.postShootVerification || "{}");
            const totalPre = Object.keys(preCheck).length;
            const completedPre = Object.values(preCheck).filter(Boolean).length;

            return (
              <Card key={sh.id} className="space-y-3.5 hover:border-purple-500/40 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-purple-400 font-semibold flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5" /> {formatDate(sh.shootDate)}
                    </span>
                    <h3 className="font-bold text-sm text-zinc-100 mt-1">{sh.creator?.name}</h3>
                  </div>
                  <Badge variant="amber">{sh.status}</Badge>
                </div>

                <div className="space-y-1 text-xs text-zinc-400">
                  <p className="flex items-center gap-1.5 text-zinc-300 font-medium">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" /> {sh.shootTime}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500" /> {sh.location}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Client: {sh.client?.companyName} • {sh.order?.packageName}
                  </p>
                </div>

                {/* Pre-shoot Checklist Summary */}
                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                    <span>Checklist: {completedPre}/{totalPre || 5} Ready</span>
                  </div>
                  <button
                    onClick={() => setSelectedShoot({
                      ...sh,
                      preShootChecklist: preCheck,
                      postShootVerification: postCheck,
                    })}
                    className="text-[11px] text-amber-400 hover:underline font-medium"
                  >
                    Inspect Checklist →
                  </button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Schedule Shoot Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Production Shoot"
        description="Double-booking conflict verification is automatically enforced on the creator's schedule."
        maxWidth="lg"
      >
        {formError && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleScheduleShoot} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Creator *</label>
              <select
                required
                value={formData.creatorId}
                onChange={(e) => setFormData({ ...formData, creatorId: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                {creators.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.location})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Client Account *</label>
              <select
                required
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Shoot Date *</label>
              <input
                type="date"
                required
                value={formData.shootDate}
                onChange={(e) => setFormData({ ...formData, shootDate: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Shoot Time Window *</label>
              <input
                type="text"
                required
                value={formData.shootTime}
                onChange={(e) => setFormData({ ...formData, shootTime: e.target.value })}
                placeholder="e.g. 10:00 AM - 2:00 PM"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Location / Studio Address *</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Special Production Notes</label>
            <textarea
              rows={3}
              value={formData.specialNotes}
              onChange={(e) => setFormData({ ...formData, specialNotes: e.target.value })}
              placeholder="Lighting requirements, props, sample arrival confirmation..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              Confirm & Book Shoot
            </Button>
          </div>
        </form>
      </Modal>

      {/* Pre-Shoot & Post-Shoot Inspection Modal */}
      {selectedShoot && (
        <Modal
          isOpen={!!selectedShoot}
          onClose={() => setSelectedShoot(null)}
          title={`Shoot Verification — ${selectedShoot.creator?.name}`}
          maxWidth="lg"
        >
          <div className="space-y-5 text-xs">
            {/* Pre-shoot checklist */}
            <div>
              <h4 className="font-semibold text-zinc-200 uppercase tracking-wider text-[11px] mb-2.5">
                Pre-Shoot Readiness Checklist:
              </h4>
              <div className="space-y-2 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                {[
                  { key: "scriptApproval", label: "Script fully approved by client" },
                  { key: "creatorConfirmation", label: "Creator booking confirmed & briefed" },
                  { key: "locationPermissions", label: "Location access and studio booked" },
                  { key: "clientProductReceipt", label: "Client physical products received & checked" },
                  { key: "teamBriefing", label: "Cameraman & assistant team briefed" },
                ].map((item) => {
                  const isChecked = !!selectedShoot.preShootChecklist?.[item.key];
                  return (
                    <label
                      key={item.key}
                      className="flex items-center gap-2.5 cursor-pointer hover:text-zinc-200 text-zinc-400"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={checklistLoading}
                        onChange={() => handleToggleChecklist(selectedShoot.id, item.key, isChecked)}
                        className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500"
                      />
                      <span>{item.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Post-shoot verification */}
            <div>
              <h4 className="font-semibold text-zinc-200 uppercase tracking-wider text-[11px] mb-2.5">
                Post-Shoot Footage Verification:
              </h4>
              <div className="space-y-2 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                {[
                  { key: "footageUploaded", label: "Raw video footage uploaded to Drive folder" },
                  { key: "rawFileIntegrity", label: "Raw file integrity & 4K 60fps audio/video verified" },
                  { key: "reshootFlag", label: "Reshoot required flag (uncheck if all good)" },
                ].map((item) => {
                  const isChecked = !!selectedShoot.postShootVerification?.[item.key];
                  return (
                    <label
                      key={item.key}
                      className="flex items-center gap-2.5 cursor-pointer hover:text-zinc-200 text-zinc-400"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={checklistLoading}
                        onChange={() => handleToggleVerification(selectedShoot.id, item.key, isChecked)}
                        className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500"
                      />
                      <span>{item.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-800">
              <Button size="sm" variant="secondary" onClick={() => setSelectedShoot(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
