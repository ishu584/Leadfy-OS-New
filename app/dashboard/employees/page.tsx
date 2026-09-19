"use client";

import React, { useState, useEffect } from "react";
import { Plus, Users, Shield, DollarSign, Calendar, Mail, Briefcase } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Employee Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "Password123!",
    employeeCode: "EMP-" + Math.floor(1000 + Math.random() * 9000),
    roleType: "SALES",
    salary: 60000,
    department: "Sales & Client Acquisition",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          salary: Number(formData.salary),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to create employee");
      }

      setIsModalOpen(false);
      fetchEmployees();
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Agency Employee Directory</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Internal team roles (Sales, Scriptwriters, Shoot Managers, Editors) with confidential salary access protection.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Onboard Employee
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <p className="col-span-3 text-center py-12 text-zinc-500 text-xs">Loading employee directory...</p>
        ) : (
          employees.map((emp) => (
            <Card key={emp.id} className="space-y-4 hover:border-amber-500/40 transition">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
                    {emp.user?.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-100">{emp.user?.name}</h3>
                    <p className="text-[11px] text-zinc-500 font-mono">{emp.employeeCode}</p>
                  </div>
                </div>
                <Badge variant="amber">{emp.roleType}</Badge>
              </div>

              <div className="space-y-1 text-xs text-zinc-400">
                <p className="flex items-center gap-1.5 text-zinc-300">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" /> {emp.user?.email}
                </p>
                <p className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-zinc-500" /> {emp.department}
                </p>
                <p className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" /> Joined {formatDate(emp.joiningDate)}
                </p>
              </div>

              {/* Confidential Salary Strip */}
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-amber-400" /> Compensation:
                </span>
                {emp.salary !== undefined ? (
                  <span className="font-bold text-emerald-400">{formatCurrency(emp.salary)} / yr</span>
                ) : (
                  <span className="text-zinc-600 italic text-[11px]">Confidential (Restricted)</span>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Onboard Agency Staff Member"
        maxWidth="md"
      >
        {formError && (
          <div className="mb-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {formError}
          </div>
        )}
        <form onSubmit={handleCreateEmployee} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-zinc-400 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Liam Vance"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@leadyfy.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Employee Code</label>
              <input
                type="text"
                required
                value={formData.employeeCode}
                onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Role Type *</label>
              <select
                value={formData.roleType}
                onChange={(e) => setFormData({ ...formData, roleType: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                <option value="SALES">Sales</option>
                <option value="SCRIPT_WRITER">Scriptwriter</option>
                <option value="SHOOT_MANAGER">Shoot Manager</option>
                <option value="EDITOR">Video Editor</option>
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Salary ($ / yr) *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Department</label>
            <input
              type="text"
              required
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              Register Employee
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
