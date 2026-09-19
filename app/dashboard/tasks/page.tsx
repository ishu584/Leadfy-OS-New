"use client";

import React, { useState, useEffect } from "react";
import { Plus, CheckSquare, Clock, AlertTriangle, Filter, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState("");

  // Create Task Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigneeId: "",
    priority: "MEDIUM",
    deadline: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, [priorityFilter]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const q = priorityFilter ? `?priority=${priorityFilter}` : "";
      const res = await fetch(`/api/tasks${q}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    } catch {
      // ignore
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ title: "", description: "", assigneeId: "", priority: "MEDIUM", deadline: "" });
        fetchTasks();
      }
    } catch {
      // ignore
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "DONE" ? "TO_DO" : currentStatus === "TO_DO" ? "IN_PROGRESS" : "DONE";
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchTasks();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Agency Task Management</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Operational action items, priority tags, employee assignment, and deadline tracking.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Task
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        <span className="text-xs font-mono text-zinc-500">{tasks.length} tasks</span>
      </div>

      {/* Kanban / Tasks Column Groups */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { key: "TO_DO", label: "To Do", badgeVariant: "neutral" },
          { key: "IN_PROGRESS", label: "In Progress", badgeVariant: "amber" },
          { key: "DONE", label: "Completed", badgeVariant: "success" },
        ].map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-xs font-semibold text-zinc-200">{col.label}</span>
                <Badge variant={col.badgeVariant as any}>{colTasks.length}</Badge>
              </div>

              <div className="space-y-3 min-h-[400px] p-2 bg-zinc-950/40 rounded-xl border border-zinc-900">
                {colTasks.length === 0 ? (
                  <p className="py-8 text-center text-zinc-600 text-xs">No tasks</p>
                ) : (
                  colTasks.map((t) => (
                    <Card key={t.id} className="p-3.5 space-y-2 hover:border-zinc-700 transition">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-xs text-zinc-200 leading-snug">{t.title}</h4>
                        <Badge variant={t.priority === "URGENT" ? "danger" : t.priority === "HIGH" ? "warning" : "neutral"}>
                          {t.priority}
                        </Badge>
                      </div>

                      {t.description && (
                        <p className="text-[11px] text-zinc-400 line-clamp-2">{t.description}</p>
                      )}

                      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                        <span>{t.assignee?.name || "Unassigned"}</span>
                        <span>{formatDate(t.deadline)}</span>
                      </div>

                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={() => handleToggleStatus(t.id, t.status)}
                          className="text-[10px] text-amber-400 hover:underline font-medium"
                        >
                          Advance Status →
                        </button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Internal Task"
        maxWidth="md"
      >
        <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-zinc-400 mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Verify video color balance with Lumina brand guidelines"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Details and instructions..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Assignee</label>
              <select
                value={formData.assigneeId}
                onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                <option value="">Unassigned</option>
                {employees.map((emp) => (
                  <option key={emp.userId} value={emp.userId}>
                    {emp.user?.name} ({emp.roleType})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Deadline</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              Create Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
