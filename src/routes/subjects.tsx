import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "~/lib/supabase";

export const Route = createFileRoute("/subjects")({ component: Subjects });

function Subjects() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate({ to: "/login" }); return; }
      loadData();
    });
  }, []);

  const loadData = async () => {
    const [s, n, e] = await Promise.all([
      supabase.from("subjects").select("*").order("name"),
      supabase.from("notes").select("subject_id"),
      supabase.from("exams").select("*, notes(subject_id)"),
    ]);
    setSubjects(s.data || []);
    setNotes(n.data || []);
    setExams(e.data || []);
    setLoading(false);
  };

  const addSubject = async () => {
    if (!newName.trim()) return;
    await supabase.from("subjects").insert({ name: newName.trim(), color: newColor });
    setNewName(""); setShowAdd(false);
    loadData();
  };

  const deleteSubject = async (id: string) => {
    if (!confirm("Delete this subject?")) return;
    await supabase.from("subjects").delete().eq("id", id);
    loadData();
  };

  const colors = ["#6366f1", "#ef4444", "#10b981", "#f59e0b", "#06b6d4", "#8b5cf6", "#ec4899", "#14b8a6"];

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div><h1 className="text-2xl font-bold text-gray-900">Subjects</h1><p className="text-gray-500 mt-1">{subjects.length} subject{subjects.length !== 1 ? "s" : ""}</p></div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add Subject</button>
      </div>
      {showAdd && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">New Subject</h3>
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Mathematics" autoFocus className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 mb-4" />
            <div className="flex gap-2 mb-4">{colors.map(c => (<button key={c} onClick={() => setNewColor(c)} className={`w-7 h-7 rounded-full transition-all ${newColor === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''}`} style={{ backgroundColor: c }} />))}</div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700">Cancel</button>
              <button onClick={addSubject} className="px-4 py-2 rounded-lg gradient-brand text-white text-sm">Add</button>
            </div>
          </div>
        </div>
      )}
      {subjects.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-gray-400">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 1 4 19.5Z" /><path d="M9 9h6" /><path d="M9 13h6" /><path d="M9 17h4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No subjects yet</h3>
          <p className="text-sm text-gray-500 mb-4">Add your first subject to organize your notes!</p>
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium">Add Subject</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject, i) => {
            const noteCount = notes.filter((n: any) => n.subject_id === subject.id).length;
            const examCount = exams.filter((e: any) => e.notes?.subject_id === subject.id).length;
            return (
              <div key={subject.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 group animate-slide-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="h-2" style={{ backgroundColor: subject.color }} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div><h3 className="font-semibold text-gray-900">{subject.name}</h3></div>
                    <button onClick={() => deleteSubject(subject.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                      {noteCount} notes
                    </span>
                    <span className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M9 15l2 2 4-4" /></svg>
                      {examCount} exams
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
