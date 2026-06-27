import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

function Settings() {
  const [name, setName] = useState("Student User");
  const [email, setEmail] = useState("student@example.com");
  const [notifications, setNotifications] = useState(true);
  const [studyReminders, setStudyReminders] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [plan, setPlan] = useState("free");
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1500);
  };

  const settingRow = (
    label: string,
    description: string,
    value: boolean,
    onChange: (v: boolean) => void
  ) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`
          relative w-10 h-5 rounded-full transition-colors duration-200
          ${value ? 'bg-indigo-600' : 'bg-gray-300'}
        `}
      >
        <div
          className={`
            absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200
            ${value ? 'translate-x-5' : 'translate-x-0.5'}
          `}
        />
      </button>
    </div>
  );

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and application preferences.</p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h2>
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => setPlan("free")}
              className={`
                p-4 rounded-lg border cursor-pointer transition-all duration-200
                ${plan === "free" ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200'}
              `}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`
                  w-4 h-4 rounded-full border-2 flex items-center justify-center
                  ${plan === "free" ? 'border-indigo-600' : 'border-gray-300'}
                `}>
                  {plan === "free" && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                </div>
                <span className="font-medium text-sm text-gray-900">Free</span>
              </div>
              <p className="text-xs text-gray-500">Basic note-taking & scheduling</p>
              <p className="text-xs text-gray-400 mt-1">$0 / month</p>
            </div>
            <div
              onClick={() => setPlan("premium")}
              className={`
                p-4 rounded-lg border cursor-pointer transition-all duration-200 relative
                ${plan === "premium" ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200'}
              `}
            >
              <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[10px] font-bold">
                POPULAR
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className={`
                  w-4 h-4 rounded-full border-2 flex items-center justify-center
                  ${plan === "premium" ? 'border-indigo-600' : 'border-gray-300'}
                `}>
                  {plan === "premium" && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                </div>
                <span className="font-medium text-sm text-gray-900">Premium</span>
              </div>
              <p className="text-xs text-gray-500">Unlimited AI notes, exams & exports</p>
              <p className="text-xs font-medium text-indigo-600 mt-1">$6.99 / month</p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h2>
          <div className="divide-y divide-gray-100">
            {settingRow(
              "Push Notifications",
              "Receive notifications for study reminders and updates",
              notifications,
              setNotifications
            )}
            {settingRow(
              "Study Reminders",
              "Get reminded about upcoming study sessions and exams",
              studyReminders,
              setStudyReminders
            )}
            {settingRow(
              "Dark Mode",
              "Use dark theme for the application",
              darkMode,
              setDarkMode
            )}
            {settingRow(
              "Auto-Save Notes",
              "Automatically save your notes as you type",
              autoSave,
              setAutoSave
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3">
          <button className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-lg gradient-brand text-white text-sm font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 disabled:opacity-70"
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}