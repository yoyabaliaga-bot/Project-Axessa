import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "~/lib/supabase";

export const Route = createFileRoute("/schedule")({ component: Schedule });

function Schedule() {
  const [user, setUser] = useState<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate({ to: "/login" }); return; }
      setUser(session.user);
      loadData();
    });
  }, []);

  const loadData = async () => {
    const [s, sub] = await Promise.all([
      supabase.from("schedules").select("*, subjects(name, color)").order("due_date", { ascending: true }),
      supabase.from("subjects").select("*").order("name"),
    ]);
    setSchedules(s.data || []);
    setSubjects(sub.data || []);
    setLoading(false);
  };

  const addSchedule = async () => {
    if (!title.trim() || !dueDate) return;
    const dueDateTime = dueTime ? `${dueDate}T${dueTime}:00` : `${dueDate}T23:59:00`;
    await supabase.from("schedules").insert({
      title: title.trim(), description, subject_id: subjectId || null,
      due_date: dueDateTime, reminder_time: dueDateTime,
    });
    setTitle(""); setDescription(""); setDueDate(""); setDueTime(""); setSubjectId(""); setShowAdd(false);
    loadData();
  };

  const toggleComplete = async (id: string, completed: boolean) => {
    await supabase.from("schedules").update({ completed: !completed }).eq("id", id);
    loadData();
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm("Delete this schedule?")) return;
    await supabase.from("schedules").delete().eq("id", id);
    loadData();
  };

  const today = new Date().toDateString();
  const todayItems = schedules.filter(s => s.due_date && new Date(s.due_date).toDateString() === today);
  const upcoming = schedules.filter(s => s.due_date && new Date(s.due_date) > new Date() && !s.completed);
  const past = schedules.filter(s => s.completed);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div><h1 className="text-2xl font-bold text-gray-900">Schedule</h1><p className="text-gray-500 mt-1">{schedules.length} task{schedules.length !== 1 ? "s" : ""}</p></div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add Task</button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">New Task</h3>
            <div className="space-y-3">
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                <option value="">No subject</option>
                {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-xs text-gray-500 mb-1">Date</label><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Time</label><input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" /></div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700">Cancel</button>
              <button onClick={addSchedule} className="px-4 py-2 rounded-lg gradient-brand text-white text-sm">Add Task</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">📅 Today</h2>
          {todayItems.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-gray-400"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              </div>
              <p className="text-gray-500 font-medium">No tasks for today</p>
              <p className="text-gray-400 text-xs mt-1">Enjoy your day or add a new task!</p>
            </div>
          ) : (
            todayItems.map((item: any) => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all">
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleComplete(item.id, item.completed)} className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${item.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-indigo-400'}`}>
                    {item.completed && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3 h-3"><polyline points="20 6 9 17 4 12" /></svg>}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className={`font-medium ${item.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{item.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{item.subjects?.name || "General"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{item.due_date ? new Date(item.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                        <button onClick={() => deleteSchedule(item.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg></button>
                      </div>
                    </div>
                    {item.description && <p className="text-xs text-gray-400 mt-1">{item.description}</p>}
                  </div>
                </div>
              </div>
            ))
          )}

          <h2 className="text-lg font-semibold text-gray-900 mt-6">📋 Upcoming</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">No upcoming tasks</p>
          ) : (
            upcoming.map((item: any) => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all">
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleComplete(item.id, item.completed)} className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${item.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-indigo-400'}`}>
                    {item.completed && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3 h-3"><polyline points="20 6 9 17 4 12" /></svg>}
                  </button>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{item.subjects?.name || "General"} • {item.due_date ? new Date(item.due_date).toLocaleDateString() : ''} {item.due_date ? new Date(item.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                  </div>
                  <button onClick={() => deleteSchedule(item.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-brand-subtle rounded-xl border border-indigo-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">📊 Summary</h3>
            <div className="space-y-3">
              {[
                { label: "Total Tasks", value: schedules.length, color: "text-indigo-600" },
                { label: "Today", value: todayItems.length, color: "text-blue-600" },
                { label: "Completed", value: past.length, color: "text-green-600" },
                { label: "Pending", value: schedules.filter(s => !s.completed).length, color: "text-amber-600" },
              ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{stat.label}</span>
                  <span className={`text-lg font-bold ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">✅ Completed</h3>
            {past.length === 0 ? (
              <p className="text-sm text-gray-400">No completed tasks yet</p>
            ) : (
              past.slice(0, 5).map((item: any) => (
                <div key={item.id} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-green-500"><polyline points="20 6 9 17 4 12" /></svg>
                  <span className="text-sm text-gray-500 line-through">{item.title}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
