"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, UserCheck, MapPin, Phone, Mail, DollarSign, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatCurrency } from "@/lib/utils";

export default function CreatorsPage() {
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");

  // Add Creator Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    gender: "Female",
    ageGroup: "22-28",
    languages: "English",
    location: "Mumbai, MH",
    niches: "Skincare, Beauty, D2C",
    phone: "",
    email: "",
    rates: 250,
    bankDetails: "",
    portfolioLinks: "",
    availabilityStatus: "AVAILABLE",
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchCreators();
  }, [search, availabilityFilter]);

  const fetchCreators = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        search,
        availability: availabilityFilter,
      });
      const res = await fetch(`/api/creators?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCreators(data.creators || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCreator = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await fetch("/api/creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          rates: Number(formData.rates),
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchCreators();
      }
    } catch {
      // ignore
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">UGC Creator Roster & Workload</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Vetted talent directory, contracted per-video rates, availability states, and double-booking protection.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Creator Talent
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search creator name, location, niche, language..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Availability</option>
            <option value="AVAILABLE">Available</option>
            <option value="BOOKED">Booked</option>
            <option value="UNAVAILABLE">Unavailable</option>
            <option value="ON_HOLD">On Hold</option>
          </select>
        </div>
      </div>

      {/* Creators Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <p className="col-span-3 text-center py-12 text-zinc-500 text-xs">Loading creator directory...</p>
        ) : creators.length === 0 ? (
          <p className="col-span-3 text-center py-12 text-zinc-500 text-xs">No creators matching filter.</p>
        ) : (
          creators.map((c) => (
            <Card key={c.id} className="space-y-4 hover:border-amber-500/40 transition">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-400 font-bold text-base shrink-0">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-100">{c.name}</h3>
                    <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-zinc-500" /> {c.location}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    c.availabilityStatus === "AVAILABLE"
                      ? "success"
                      : c.availabilityStatus === "BOOKED"
                      ? "amber"
                      : "neutral"
                  }
                >
                  {c.availabilityStatus}
                </Badge>
              </div>

              {/* Niches & Tags */}
              <div className="space-y-1.5">
                <div className="text-[11px] text-zinc-300 font-medium">
                  {c.niches}
                </div>
                <div className="text-[10px] text-zinc-500 flex gap-2">
                  <span>Languages: {c.languages}</span>
                  <span>•</span>
                  <span>Age: {c.ageGroup}</span>
                </div>
              </div>

              {/* Rates & Workload Strip */}
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Rate / Video</span>
                  <span className="font-bold text-amber-400">{formatCurrency(c.rates)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 uppercase block">Active Shoots</span>
                  <span className="text-zinc-200">{c.shoots?.length || 0} scheduled</span>
                </div>
              </div>

              {/* Contact and Links */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800/60 text-zinc-400">
                <span className="truncate flex items-center gap-1">
                  <Phone className="w-3 h-3 text-zinc-500" /> {c.phone}
                </span>
                {c.portfolioLinks && (
                  <a
                    href={c.portfolioLinks}
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    Portfolio <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Creator Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New UGC Creator"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateCreator} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Location *</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Gender</label>
              <input
                type="text"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Age Group</label>
              <input
                type="text"
                value={formData.ageGroup}
                onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Contract Rate ($) *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.rates}
                onChange={(e) => setFormData({ ...formData, rates: Number(e.target.value) })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Niches / Specialties *</label>
            <input
              type="text"
              required
              value={formData.niches}
              onChange={(e) => setFormData({ ...formData, niches: e.target.value })}
              placeholder="e.g. Skincare, Tech, Fashion, Wellness"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              Save Creator Profile
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
