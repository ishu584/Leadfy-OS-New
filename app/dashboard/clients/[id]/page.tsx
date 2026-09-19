"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Building,
  Mail,
  Phone,
  Package,
  FileText,
  Calendar,
  Video,
  CreditCard,
  LifeBuoy,
  History,
  Edit2,
  ExternalLink,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export default function ClientHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"orders" | "scripts" | "shoots" | "videos" | "payments" | "tickets" | "activity">("orders");

  // Edit Client Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchClient();
  }, [id]);

  const fetchClient = async () => {
    try {
      const res = await fetch(`/api/clients/${id}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setEditForm({
          name: json.client.name,
          company_name: json.client.companyName,
          email: json.client.email,
          phone: json.client.phone,
          brandName: json.client.brandName,
          industry: json.client.industry,
          taxId: json.client.taxId || "",
          status: json.client.status,
          assets: json.client.assets || "",
        });
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setIsEditOpen(false);
        fetchClient();
      }
    } catch {
      // ignore
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!data?.client) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-zinc-400">Client profile not found.</p>
        <Link href="/dashboard/clients" className="text-xs text-amber-400 underline">
          Return to Clients List
        </Link>
      </div>
    );
  }

  const { client, activityLogs } = data;

  return (
    <div className="space-y-6 select-none">
      {/* Back Button */}
      <Link
        href="/dashboard/clients"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Clients
      </Link>

      {/* Client Profile Header Hub Card */}
      <Card className="border-zinc-800 bg-zinc-900/90">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xl shrink-0">
              {client.companyName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-zinc-100">{client.companyName}</h2>
                <Badge variant="amber">{client.status}</Badge>
              </div>
              <p className="text-xs text-zinc-400 mt-1 flex items-center gap-3">
                <span>Brand: <strong className="text-zinc-200">{client.brandName}</strong></span>
                <span>•</span>
                <span>Industry: {client.industry}</span>
                {client.taxId && (
                  <>
                    <span>•</span>
                    <span className="font-mono">GST/Tax: {client.taxId}</span>
                  </>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-zinc-400">
                <span className="flex items-center gap-1 text-zinc-300">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" /> {client.email}
                </span>
                <span className="flex items-center gap-1 text-zinc-300">
                  <Phone className="w-3.5 h-3.5 text-zinc-500" /> {client.phone}
                </span>
                {client.assets && (
                  <a
                    href={client.assets}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-amber-400 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" /> Brand Assets
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)} className="gap-1.5">
              <Edit2 className="w-3.5 h-3.5" /> Edit Profile
            </Button>
            <Link
              href={`/dashboard/orders?newOrderFor=${client.id}`}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-charcoal shadow-sm transition"
            >
              + Create Order
            </Link>
          </div>
        </div>
      </Card>

      {/* Operational Hub Tabs */}
      <div className="flex border-b border-zinc-800 gap-2 text-xs overflow-x-auto">
        {[
          { key: "orders", label: `Orders (${client.orders?.length || 0})`, icon: Package },
          { key: "scripts", label: `Scripts (${client.scripts?.length || 0})`, icon: FileText },
          { key: "shoots", label: `Shoots (${client.shoots?.length || 0})`, icon: Calendar },
          { key: "videos", label: `Videos (${client.videos?.length || 0})`, icon: Video },
          { key: "payments", label: `Invoices & Payments (${client.payments?.length || 0})`, icon: CreditCard },
          { key: "tickets", label: `Tickets (${client.supportTickets?.length || 0})`, icon: LifeBuoy },
          { key: "activity", label: `Activity Trail (${activityLogs?.length || 0})`, icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium transition shrink-0 ${
                isActive
                  ? "border-amber-500 text-amber-400 bg-amber-500/5 font-semibold"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === "orders" && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Package</th>
                <th className="py-3 px-4">Videos Quota</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Balance</th>
                <th className="py-3 px-4">Timeline</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {client.orders?.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-zinc-500">No orders created yet.</td></tr>
              ) : (
                client.orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4 font-semibold text-zinc-100">{o.packageName}</td>
                    <td className="py-3 px-4 font-mono">{o.contractedVideoCount} videos</td>
                    <td className="py-3 px-4 font-mono font-medium">{formatCurrency(o.totalAmount)}</td>
                    <td className="py-3 px-4 font-mono text-yellow-400">{formatCurrency(o.outstandingBalance)}</td>
                    <td className="py-3 px-4 text-zinc-400 text-[11px]">
                      {formatDate(o.startDate)} – {formatDate(o.dueDate)}
                    </td>
                    <td className="py-3 px-4"><Badge variant="amber">{o.status}</Badge></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === "scripts" && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Video #</th>
                <th className="py-3 px-4">Language</th>
                <th className="py-3 px-4">Writer</th>
                <th className="py-3 px-4">Revisions</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {client.scripts?.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-zinc-500">No scripts created yet.</td></tr>
              ) : (
                client.scripts.map((s: any) => (
                  <tr key={s.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4 font-bold text-amber-400 font-mono">#{s.videoNumber}</td>
                    <td className="py-3 px-4 text-zinc-300">{s.language}</td>
                    <td className="py-3 px-4 text-zinc-300">{s.writer?.name || "Unassigned"}</td>
                    <td className="py-3 px-4 font-mono">{s.revisionCount}</td>
                    <td className="py-3 px-4"><Badge variant={s.status === "APPROVED" ? "success" : "amber"}>{s.status}</Badge></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === "shoots" && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Shoot Date & Time</th>
                <th className="py-3 px-4">Creator</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {client.shoots?.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-zinc-500">No shoots recorded yet.</td></tr>
              ) : (
                client.shoots.map((sh: any) => (
                  <tr key={sh.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4 font-semibold text-zinc-200">
                      {formatDate(sh.shootDate)} • {sh.shootTime}
                    </td>
                    <td className="py-3 px-4 text-amber-400">{sh.creator?.name}</td>
                    <td className="py-3 px-4 text-zinc-400">{sh.location}</td>
                    <td className="py-3 px-4"><Badge variant="amber">{sh.status}</Badge></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === "videos" && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Video ID</th>
                <th className="py-3 px-4">Assigned Editor</th>
                <th className="py-3 px-4">Revision Count</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Links</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {client.videos?.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-zinc-500">No videos in production yet.</td></tr>
              ) : (
                client.videos.map((v: any) => (
                  <tr key={v.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4 font-mono font-medium text-zinc-300">VID-{v.id.slice(-6)}</td>
                    <td className="py-3 px-4 text-zinc-300">{v.assignedEditor?.name || "Unassigned"}</td>
                    <td className="py-3 px-4 font-mono">{v.revisionCount}</td>
                    <td className="py-3 px-4"><Badge variant="amber">{v.status}</Badge></td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {v.editDraftUrl && (
                        <a href={v.editDraftUrl} target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">
                          Draft Cut
                        </a>
                      )}
                      {v.finalDeliveryUrl && (
                        <a href={v.finalDeliveryUrl} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline font-bold">
                          Final Master
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === "payments" && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Invoice Amount</th>
                <th className="py-3 px-4">Amount Received</th>
                <th className="py-3 px-4">Balance</th>
                <th className="py-3 px-4">Method & Ref</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {client.payments?.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-zinc-500">No payment records found.</td></tr>
              ) : (
                client.payments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4 font-mono">{formatCurrency(p.invoiceAmount)}</td>
                    <td className="py-3 px-4 font-mono text-emerald-400">{formatCurrency(p.amountReceived)}</td>
                    <td className="py-3 px-4 font-mono text-yellow-400">{formatCurrency(p.pendingBalance)}</td>
                    <td className="py-3 px-4 text-zinc-400">{p.paymentMethod} {p.transactionRef && `(${p.transactionRef})`}</td>
                    <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">{formatDate(p.paymentDate)}</td>
                    <td className="py-3 px-4"><Badge variant={p.status === "PAID" ? "success" : "warning"}>{p.status}</Badge></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === "tickets" && (
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-zinc-800/60">
            {client.supportTickets?.length === 0 ? (
              <p className="py-8 text-center text-zinc-500 text-xs">No support tickets filed.</p>
            ) : (
              client.supportTickets.map((t: any) => (
                <div key={t.id} className="p-4 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">{t.subject}</span>
                    <Badge variant={t.status === "RESOLVED" ? "success" : "warning"}>{t.status}</Badge>
                  </div>
                  <p className="text-zinc-400 leading-relaxed">{t.message}</p>
                  <p className="text-[10px] text-zinc-500 font-mono">{formatDateTime(t.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {activeTab === "activity" && (
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-zinc-800/60">
            {(!activityLogs || activityLogs.length === 0) ? (
              <p className="py-8 text-center text-zinc-500 text-xs">No activity logs recorded.</p>
            ) : (
              activityLogs.map((log: any) => (
                <div key={log.id} className="p-3 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-zinc-300">{log.actorName}</span>
                    <span className="text-zinc-400 ml-2 font-mono text-[11px]">{log.action}</span>
                    {log.metadata && <span className="text-zinc-500 ml-2 text-[10px]">{log.metadata}</span>}
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">{formatDateTime(log.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Edit Client Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Client Profile"
        maxWidth="lg"
      >
        <form onSubmit={handleUpdateClient} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Company Name</label>
              <input
                type="text"
                required
                value={editForm.company_name || ""}
                onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Contact Name</label>
              <input
                type="text"
                required
                value={editForm.name || ""}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Brand Name</label>
              <input
                type="text"
                required
                value={editForm.brandName || ""}
                onChange={(e) => setEditForm({ ...editForm, brandName: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Status</label>
              <select
                value={editForm.status || "ACTIVE"}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                <option value="LEAD">Lead</option>
                <option value="NEW">New</option>
                <option value="ONBOARDING">Onboarding</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button variant="secondary" type="button" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={editLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
