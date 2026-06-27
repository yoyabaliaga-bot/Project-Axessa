import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "~/lib/supabase";

export const Route = createFileRoute("/notes")({ component: NotesPage });

function NotesPage() {
  const [user, setUser] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [grammarScore, setGrammarScore] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate({ to: "/login" }); return; }
      setUser(session.user);
      const [n, s] = await Promise.all([
        supabase.from("notes").select("*, subjects(name, color)").order("updated_at", { ascending: false }),
        supabase.from("subjects").select("*").order("name"),
      ]);
      setNotes(n.data || []);
      setSubjects(s.data || []);
      setLoading(false);
    });
  }, []);

  const checkGrammar = () => {
    const mistakes = ["i ", "dont ", "didnt ", "wont ", "couldnt ", "wouldnt ", "shouldnt ", "alot ", "seperate ", "recieve "];
    let found = 0;
    const lower = content.toLowerCase();
    mistakes.forEach(m => { if (lower.includes(m)) found += (lower.split(m).length - 1); });
    const total = content.split(/\s+/).filter(Boolean).length;
    setGrammarScore(total === 0 ? 100 : Math.max(0, Math.round(100 - (found / total) * 100)));
  };

  const saveNote = async () => {
    if (!title.trim()) return;
    const payload = { title: title.trim(), content, subject_id: subjectId || null };
    if (editId) await supabase.from("notes").update(payload).eq("id", editId);
    else await supabase.from("notes").insert(payload);
    setTitle(""); setContent(""); setSubjectId(""); setEditId(null); setGrammarScore(null);
    const { data } = await supabase.from("notes").select("*, subjects(name, color)").order("updated_at", { ascending: false });
    setNotes(data || []);
  };

  const editNote = (note: any) => {
    setTitle(note.title); setContent(note.content); setSubjectId(note.subject_id || ""); setEditId(note.id);
  };

  const deleteNote = async (id: string) => {
    if (!confirm("Delete note?")) return;
    await supabase.from("notes").delete().eq("id", id);
    const { data } = await supabase.from("notes").select("*, subjects(name, color)").order("updated_at", { ascending: false });
    setNotes(data || []);
  };

  const generateReviewer = async (noteId: string) => {
    await fetch("/api/generate/reviewer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note_id: noteId, user_id: user?.id }) });
    alert("✅ Reviewer generated! Check the Reviewer page.");
  };

  const generateMockExam = async (noteId: string) => {
    await fetch("/api/generate/mock-exam", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note_id: noteId, user_id: user?.id }) });
    alert("✅ Mock exam generated! Check the Reviewer page.");
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  const grammarColor = grammarScore !== null ? (grammarScore >= 80 ? "text-green-600 bg-green-50" : grammarScore >= 60 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50") : "";

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Notes</h1><p className="text-gray-500 mt-1">{notes.length} note{notes.length !== 1 ? "s" : ""}</p></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{editId ? "✏️ Edit Note" : "📝 New Note"}</h2>
          <div className="space-y-3">
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Note title..." className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
              <option value="">📂 No subject</option>
              {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <textarea value={content} onChange={e => { setContent(e.target.value); setGrammarScore(null); }} placeholder="Write your notes here..." rows={10} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono resize-y" />
            {grammarScore !== null && (
              <div className={`p-3 rounded-lg text-sm font-medium ${grammarColor}`}>
                Grammar Score: {grammarScore}% {grammarScore >= 80 ? "✅ Looks great!" : grammarScore >= 60 ? "⚠️ Could use some polish" : "❌ Needs revision"}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={checkGrammar} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">🔍 Check Grammar</button>
              <button onClick={saveNote} className="flex-1 py-2.5 rounded-lg gradient-brand text-white text-sm font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200">{editId ? "💾 Update" : "💾 Save Note"}</button>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {notes.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7 text-gray-400"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
              </div>
              <p className="text-gray-500 font-medium">No notes yet</p>
              <p className="text-gray-400 text-sm mt-1">Create your first study note!</p>
            </div>
          ) : (
            notes.map((note: any) => (
              <div key={note.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">{note.title}</h3>
                    <p className="text-xs text-gray-500">{note.subjects?.name || "General"} • {new Date(note.updated_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => editNote(note)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></button>
                    <button onClick={() => deleteNote(note.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg></button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2 mb-3">{note.content?.substring(0, 120)}...</p>
                <div className="flex gap-2">
                  <button onClick={() => generateReviewer(note.id)} className="text-xs px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors font-medium">📖 Generate Reviewer</button>
                  <button onClick={() => generateMockExam(note.id)} className="text-xs px-3 py-1.5 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors font-medium">📝 Generate Mock Exam</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
