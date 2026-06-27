import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "~/lib/supabase";

export const Route = createFileRoute("/reviewer")({ component: Reviewer });

function Reviewer() {
  const [exams, setExams] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "take">("list");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate({ to: "/login" }); return; }
      loadData();
    });
  }, []);

  const loadData = async () => {
    const [e, n] = await Promise.all([
      supabase.from("exams").select("*, notes(title, subjects(name))").order("created_at", { ascending: false }),
      supabase.from("notes").select("*, subjects(name, color)").order("updated_at", { ascending: false }),
    ]);
    setExams(e.data || []);
    setNotes(n.data || []);
    setLoading(false);
  };

  const startExam = (exam: any) => {
    setSelectedExam(exam);
    setAnswers({});
    setShowResults(false);
    setViewMode("take");
  };

  const submitExam = () => {
    setShowResults(true);
  };

  const deleteExam = async (id: string) => {
    if (!confirm("Delete this exam?")) return;
    await supabase.from("exams").delete().eq("id", id);
    loadData();
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  if (viewMode === "take" && selectedExam) {
    const content = typeof selectedExam.content === 'string' ? JSON.parse(selectedExam.content) : selectedExam.content;
    const questions = content?.questions || [];

    if (showResults) {
      let correct = 0;
      questions.forEach((q: any, i: number) => {
        if (answers[`q${i}`]?.toLowerCase().trim() === q.answer?.toLowerCase().trim()) correct++;
      });
      const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;

      return (
        <div className="animate-fade-in max-w-2xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
              <div className={`text-3xl font-bold ${score >= 70 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{score}%</div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Exam Complete!</h2>
            <p className="text-gray-500 mb-6">You scored {correct} out of {questions.length}</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setViewMode("list")} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Back to List</button>
              <button onClick={() => startExam(selectedExam)} className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium">Try Again</button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="animate-fade-in max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-xl font-bold text-gray-900">{selectedExam.title}</h1><p className="text-sm text-gray-500">{content?.subject || "General"}</p></div>
          <button onClick={() => setViewMode("list")} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
        </div>
        {questions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">No questions available for this exam.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q: any, i: number) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start gap-3 mb-3">
                  <span className="w-7 h-7 rounded-full gradient-brand text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <p className="font-medium text-gray-900 text-sm">{q.question}</p>
                </div>
                {q.type === "true_false" ? (
                  <div className="flex gap-3 ml-10">
                    {["True", "False"].map(opt => (
                      <button key={opt} onClick={() => setAnswers({ ...answers, [`q${i}`]: opt })}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${answers[`q${i}`] === opt ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-indigo-200'}`}>{opt}</button>
                    ))}
                  </div>
                ) : (
                  <textarea value={answers[`q${i}`] || ""} onChange={e => setAnswers({ ...answers, [`q${i}`]: e.target.value })}
                    placeholder="Type your answer..." rows={2}
                    className="ml-10 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                )}
              </div>
            ))}
            <button onClick={submitExam} className="w-full py-3 rounded-xl bg-green-600 text-white font-medium text-sm hover:bg-green-700 transition-all">Submit Exam</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-gray-900">Reviewer & Exams</h1><p className="text-gray-500 mt-1">{exams.length} exam{exams.length !== 1 ? "s" : ""} generated</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {exams.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7 text-gray-400"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M9 15l2 2 4-4" /></svg>
              </div>
              <p className="text-gray-500 font-medium">No exams yet</p>
              <p className="text-gray-400 text-sm mt-1">Go to Notes and generate a reviewer or mock exam from your notes!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {exams.map((exam: any) => {
                const content = typeof exam.content === 'string' ? JSON.parse(exam.content) : exam.content;
                return (
                  <div key={exam.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all duration-200 group">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${exam.type === 'reviewer' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>
                        {exam.type === 'reviewer' ? '📖 Reviewer' : '📝 Mock Exam'}
                      </span>
                      <button onClick={() => deleteExam(exam.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg></button>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">{exam.title}</h3>
                    <p className="text-xs text-gray-500 mb-3">{exam.notes?.title || "From your notes"}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{new Date(exam.created_at).toLocaleDateString()}</span>
                      <button onClick={() => startExam(exam)} className="text-xs px-3 py-1.5 rounded-full gradient-brand text-white font-medium hover:shadow-lg transition-all">
                        {exam.type === 'reviewer' ? 'View' : 'Take Exam'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="bg-gradient-brand-subtle rounded-xl border border-indigo-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">How it works</h3>
          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex gap-3"><span className="w-6 h-6 rounded-full gradient-brand text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
              <p>Create notes in the <strong>Notes</strong> page</p></div>
            <div className="flex gap-3"><span className="w-6 h-6 rounded-full gradient-brand text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
              <p>Click <strong>"Generate Reviewer"</strong> or <strong>"Generate Mock Exam"</strong> on any note</p></div>
            <div className="flex gap-3"><span className="w-6 h-6 rounded-full gradient-brand text-white text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
              <p>Come here to <strong>view reviewers</strong> or <strong>take mock exams</strong></p></div>
          </div>
          {notes.length > 0 && (
            <div className="mt-4 pt-4 border-t border-indigo-100">
              <p className="text-xs text-gray-500 mb-2">Quick generate from recent notes:</p>
              {notes.slice(0, 3).map((note: any) => (
                <div key={note.id} className="text-xs py-1.5 text-indigo-600 hover:text-indigo-800 cursor-pointer truncate">{note.title}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
