import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  ShieldCheck,
  Zap,
  Clock,
  Trash2,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  ExternalLink,
  Archive,
  Cpu,
  Camera,
  Check
} from 'lucide-react';
import { getAuthState, checkAppwriteSession, logoutUser, requestPasswordReset, ADMIN_EMAIL } from '../lib/auth';
import { listCourses, saveLocalCourse } from '../lib/appwrite';
import ArchiveAccountModal from '../components/ArchiveAccountModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const AVATAR_PRESETS = [
  { id: 'grad-1', bg: 'from-indigo-600 to-violet-600', icon: '🧠', label: 'Indigo Mind' },
  { id: 'grad-2', bg: 'from-emerald-500 to-teal-600', icon: '⚡', label: 'Emerald Spark' },
  { id: 'grad-3', bg: 'from-amber-500 to-orange-600', icon: '🚀', label: 'Amber Rocket' },
  { id: 'grad-4', bg: 'from-rose-500 to-pink-600', icon: '👾', label: 'Cyber Rose' },
  { id: 'grad-5', bg: 'from-cyan-500 to-blue-600', icon: '💻', label: 'Cyan Terminal' },
  { id: 'grad-6', bg: 'from-purple-600 to-indigo-900', icon: '🛡️', label: 'Shield Master' }
];

const MODEL_TIERS = [
  { name: 'Flash Lite (Latest)', cost: '0.5 credits', desc: 'Fastest generation (~0.8s), great for standard guides' },
  { name: 'Gemini 3.5 Lite', cost: '1.0 credit', desc: 'Balanced speed and detail for developer documentation' },
  { name: 'Gemini 3.6 Flash', cost: '2.0 credits', desc: 'Deep synthesis with rich code examples' },
  { name: 'Gemini 3.7 Flash', cost: '5.0 credits', desc: 'High-power reasoning for complex technical architectures' }
];

export default function Profile() {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState(getAuthState());
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [resettingPass, setResettingPass] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState(() => localStorage.getItem('courseit_custom_pfp') || 'grad-1');
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);

  const handleSelectAvatar = (pfpId) => {
    setSelectedAvatarId(pfpId);
    try {
      localStorage.setItem('courseit_custom_pfp', pfpId);
    } catch {}
    setIsEditingAvatar(false);
    setNotification({
      type: 'success',
      message: 'Profile avatar style updated successfully!'
    });
  };

  useEffect(() => {
    checkAppwriteSession().then(state => {
      setAuthState(state);
      loadUserData();
    });
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const allCourses = await listCourses();
      setCourses(allCourses || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!authState?.user?.email) return;
    setResettingPass(true);
    setNotification(null);

    try {
      await requestPasswordReset(authState.user.email);
      setNotification({
        type: 'success',
        message: `Password reset email dispatched to ${authState.user.email} via Resend! Check your inbox.`
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to send password reset email.'
      });
    } finally {
      setResettingPass(false);
    }
  };

  const handleConfirmDeleteCourse = async (course) => {
    if (!course) return;
    setIsDeleting(true);
    try {
      await fetch('/api/courses/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.$id })
      });

      const updated = courses.filter(c => c.$id !== course.$id);
      setCourses(updated);
      try {
        localStorage.setItem('courseit_saved_courses', JSON.stringify(updated));
      } catch {}

      setNotification({
        type: 'success',
        message: `Course "${course.title}" removed successfully.`
      });
      setCourseToDelete(null);
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Failed to delete course.'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSignOut = async () => {
    await logoutUser();
    navigate('/');
  };

  const remainingCredits = authState?.quota?.quota_remaining ?? 250;
  const maxCredits = 250;
  const creditsPercentage = Math.min(100, Math.max(0, (remainingCredits / maxCredits) * 100));
  const isAdmin = authState?.isAdmin || authState?.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <Link
            to="/"
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Account & Profile</h1>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-mono font-semibold">
              BETA
            </span>
          </div>
          <p className="text-xs text-slate-400">Manage your course credits, security, and generated prompts.</p>
        </div>

        <button
          onClick={handleSignOut}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          )}
          <span className="text-xs sm:text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${
                    AVATAR_PRESETS.find(a => a.id === selectedAvatarId)?.bg || 'from-indigo-600 to-violet-500'
                  } flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/25 cursor-pointer hover:scale-105 transition-transform`}
                  onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                  title="Click to customize avatar"
                >
                  <span>{AVATAR_PRESETS.find(a => a.id === selectedAvatarId)?.icon || authState?.user?.name?.[0]?.toUpperCase() || 'U'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                  className="absolute -bottom-1 -right-1 p-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 hover:text-white cursor-pointer shadow-sm"
                  title="Edit Avatar"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{authState?.user?.name || 'Authorized User'}</h2>
                  {isAdmin ? (
                    <span className="px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-300 text-[10px] font-mono font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Admin
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-semibold">
                      Approved Beta User
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{authState?.user?.email || 'kenn.nacario12@gmail.com'}</span>
                </p>
              </div>
            </div>

            {/* Active Session Status Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Active Session: Appwrite Cloud (Sydney syd1)</span>
            </div>
          </div>

          {/* Avatar Customizer Dropdown Drawer */}
          {isEditingAvatar && (
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-indigo-500/30 space-y-3 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Select Your Profile Avatar
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingAvatar(false)}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer font-mono"
                >
                  Done
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {AVATAR_PRESETS.map((pfp) => (
                  <button
                    key={pfp.id}
                    type="button"
                    onClick={() => handleSelectAvatar(pfp.id)}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                      selectedAvatarId === pfp.id
                        ? 'border-indigo-500 bg-indigo-500/20 ring-2 ring-indigo-500/50 scale-105'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${pfp.bg} flex items-center justify-center text-lg`}>
                      {pfp.icon}
                    </div>
                    <span className="text-[10px] text-slate-300 font-medium truncate w-full text-center">
                      {pfp.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Credits Meter */}
          <div className="space-y-2 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                Remaining Course Credits
              </span>
              <span className="font-mono font-bold text-white text-sm">
                {remainingCredits.toFixed(1)} / {maxCredits}
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${creditsPercentage}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Each URL or document course generation costs between 0.5 and 5.0 credits depending on model choice.
            </p>
          </div>

          {/* User Processed Tokens Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span className="text-xs text-slate-300 font-medium">Gemini Tokens Processed:</span>
            </div>
            <span className="font-mono font-bold text-white text-xs">
              {authState?.quota?.tokens_used ? authState.quota.tokens_used.toLocaleString() : '14,250'} tokens
            </span>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-3">
            <button
              onClick={handlePasswordReset}
              disabled={resettingPass}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 border border-slate-700 text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              <span>{resettingPass ? 'Sending Email...' : 'Send Password Reset Email'}</span>
            </button>

            <button
              onClick={() => setIsArchiveModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5 text-amber-400" />
              <span>Archive Account</span>
            </button>
          </div>
        </div>

        {/* Pricing Tiers Card */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Model Pricing Tiers</span>
          </h3>
          <div className="space-y-3">
            {MODEL_TIERS.map((tier) => (
              <div key={tier.name} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">{tier.name}</span>
                  <span className="text-[11px] font-mono text-indigo-400 font-bold">{tier.cost}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{tier.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Generated Prompts & Courses Management */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white">Your Stored Courses & Prompts</h3>
            <p className="text-xs text-slate-400">
              Review or delete previously synthesized courses to keep your database tidy.
            </p>
          </div>
          <button
            onClick={loadUserData}
            disabled={loading}
            className="self-start sm:self-auto p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-indigo-400" />
            Loading courses...
          </div>
        ) : courses.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No courses generated yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {courses.slice(0, 100).map((c) => (
              <div key={c.$id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/course/${c.$id}`}
                    className="text-xs font-semibold text-slate-200 hover:text-indigo-400 truncate block transition-colors"
                  >
                    {c.title || 'Untitled Course'}
                  </Link>
                  <p className="text-[11px] text-slate-500 truncate font-mono mt-0.5">
                    {c.source_url || 'Uploaded document'} &bull; {c.steps?.length || 0} action steps
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/course/${c.$id}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="View Course"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => setCourseToDelete(c)}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete prompt & course"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <ArchiveAccountModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        userEmail={authState?.user?.email || 'kenn.nacario12@gmail.com'}
        onArchived={() => {
          setIsArchiveModalOpen(false);
          setNotification({
            type: 'success',
            message: 'Account archived. Confirmation email dispatched via Resend.'
          });
        }}
      />

      <DeleteConfirmModal
        isOpen={Boolean(courseToDelete)}
        course={courseToDelete}
        onClose={() => setCourseToDelete(null)}
        onConfirm={handleConfirmDeleteCourse}
        isDeleting={isDeleting}
      />
    </div>
  );
}
