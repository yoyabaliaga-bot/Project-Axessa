import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "~/lib/supabase";

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate({ to: "/login" }); return; }
      setUser(session.user);
      const [s, n, sch, e] = await Promise.all([
        supabase.from("subjects").select("*").order("created_at", { ascending: false }),
        supabase.from("notes").select("*, subjects(name, color)").order("updated_at", { ascending: false }),
        supabase.from("schedules").select("*, subjects(name, color)").order("due_date", { ascending: true }),
        supabase.from("exams").select("*, notes(title)").order("created_at", { ascending: false }),
      ]);
      setSubjects(s.data || []);
      setNotes(n.data || []);
      setSchedules(sch.data || []);
      setExams(e.data || []);
      setLoading(false);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const todaySchedules = schedules.filter(s =>
    s.due_date && new Date(s.due_date).toDateString() === new Date().toDateString()
  );
  const recentNotes = notes.slice(0, 4);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}!
          </p>
        </div>
        <button onClick={handleSignOut}
          className="text-sm text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Subjects", value: subjects.length, change: `${subjects.length} active`, color: "from-indigo-500 to-blue-600" },
          { label: "Study Notes", value: notes.length, change: `${notes.filter(n => new Date(n.updated_at) > new Date(Date.now() - 86400000)).length} updated today`, color: "from-violet-500 to-purple-600" },
          { label: "Mock Exams", value: exams.length, change: exams.filter(e => e.type === "mock_exam").length + " available", color: "from-blue-500 to-cyan-600" },
          { label: "Study Streak", value: schedules.filter(s => s.completed).length + " done", change: schedules.filter(s => !s.completed).length + " pending", color: "from-purple-500 to-pink-600" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Notes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Notes</h2>
            <a href="/notes" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View all</a>
          </div>
          {recentNotes.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-gray-400">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">No notes yet</p>
              <p className="text-xs text-gray-400 mt-1">Create your first study note!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentNotes.map((note: any) => (
                <div key={note.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className={`w-10 h-10 rounded-lg ${note.subjects?.color ? `bg-${note.subjects.color}` : 'bg-indigo-100'} flex items-center justify-center flex-shrink-0`}
                    style={{ backgroundColor: note.subjects?.color || '#6366f1' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{note.title}</p>
                    <p className="text-xs text-gray-500">{note.subjects?.name || "General"} • {new Date(note.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Schedule */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
            <a href="/schedule" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View all</a>
          </div>
          {schedules.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-gray-400">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">No schedule yet</p>
              <p className="text-xs text-gray-400 mt-1">Add study sessions to your schedule!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {schedules.slice(0, 4).map((s: any) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-1 h-8 rounded-full" style={{ backgroundColor: s.subjects?.color || '#6366f1' }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{s.title}</p>
                    <p className="text-xs text-gray-500">{s.subjects?.name || "General"}{s.due_date ? ` • ${new Date(s.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ""}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${s.completed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {s.completed ? "Done" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-gradient-brand-subtle rounded-xl border border-indigo-100 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "New Note", href: "/notes", color: "from-indigo-500 to-blue-600" },
            { label: "Subjects", href: "/subjects", color: "from-violet-500 to-purple-600" },
            { label: "Take Exam", href: "/reviewer", color: "from-blue-500 to-cyan-600" },
            { label: "Schedule", href: "/schedule", color: "from-purple-500 to-pink-600" },
          ].map((action, i) => (
            <a key={i} href={action.href}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md hover:border-indigo-200 transition-all duration-200 group">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-700">{action.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
