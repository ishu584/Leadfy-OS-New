"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Filter, Building, Mail, Phone, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Add Client Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company_name: "", // canonical representation
    email: "",
    phone: "",
    whatsapp: "",
    brandName: "",
    industry: "",
    taxId: "",
    source: "Inbound",
    status: "LEAD",
    assets: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, [search, statusFilter, page]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
        status: statusFilter,
      });
      const res = await fetch(`/api/clients?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to create client");
      }

      setIsModalOpen(false);
      setFormData({
        name: "",
        company_name: "",
        email: "",
        phone: "",
        whatsapp: "",
        brandName: "",
        industry: "",
        taxId: "",
        source: "Inbound",
        status: "LEAD",
        assets: "",
      });
      fetchClients();
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="success">Active</Badge>;
      case "NEW":
      case "ONBOARDING":
        return <Badge variant="amber">{status}</Badge>;
      case "ON_HOLD":
        return <Badge variant="warning">On Hold</Badge>;
      case "COMPLETED":
        return <Badge variant="info">Completed</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Clients & Accounts Directory</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage agency brand accounts, onboarding pipelines, and client hub records.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add New Client
        </Button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by client name, company, email, brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-950/70 border border-zinc-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-950/70 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Statuses</option>
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

      {/* Clients Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/70 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Company & Client</th>
                <th className="py-3.5 px-4">Brand & Industry</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Orders / Videos</th>
                <th className="py-3.5 px-4">Created</th>
                <th className="py-3.5 px-4 text-right">Hub Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    Loading clients...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    No clients found matching your search.
                  </td>
                </tr>
              ) : (
                clients.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-100 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-amber-400" />
                        {c.companyName}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">{c.name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-zinc-200 font-medium">{c.brandName}</div>
                      <div className="text-[11px] text-zinc-500">{c.industry}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-zinc-300">
                        <Mail className="w-3 h-3 text-zinc-500" /> {c.email}
                      </div>
                      <div className="flex items-center gap-1 text-zinc-500 text-[11px] mt-0.5">
                        <Phone className="w-3 h-3 text-zinc-500" /> {c.phone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(c.status)}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-300">
                      {c._count?.orders ?? 0} orders • {c._count?.videos ?? 0} videos
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/dashboard/clients/${c.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-amber-500 hover:text-charcoal text-zinc-300 transition font-medium text-[11px]"
                      >
                        Profile Hub <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-950/40 flex items-center justify-between text-xs text-zinc-400">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Add Client Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Client Account"
        description="Register a new agency client. Both 'company_name' and 'company' are supported."
        maxWidth="lg"
      >
        {formError && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {formError}
          </div>
        )}
        <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="e.g. Apex Media Labs LLC"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Contact Person Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Jessica Miller"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@brand.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Brand Name *</label>
              <input
                type="text"
                required
                value={formData.brandName}
                onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                placeholder="e.g. Apex Glow"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Industry *</label>
              <input
                type="text"
                required
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="e.g. Beauty / D2C / SaaS"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">GST / Tax ID</label>
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="Optional Tax ID"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">WhatsApp</label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="WhatsApp number"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Initial Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                <option value="LEAD">Lead</option>
                <option value="NEW">New</option>
                <option value="ONBOARDING">Onboarding</option>
                <option value="ACTIVE">Active</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Brand Kit & Assets Drive Link</label>
            <input
              type="text"
              value={formData.assets}
              onChange={(e) => setFormData({ ...formData, assets: e.target.value })}
              placeholder="https://drive.google.com/..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              Save Client Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
