import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Search,
  Mail,
  Zap,
  Lock,
  PlusCircle,
  Trash2,
  Database,
  ExternalLink,
  MessageSquare,
  Star,
  Archive,
  RotateCcw,
  Check,
  Info,
  Cpu,
  FileDown,
  Copy,
  CheckCheck,
  Sparkles,
  Link2,
  UploadCloud
} from 'lucide-react';
import { getAuthState, checkAppwriteSession, authenticatedFetch, ADMIN_EMAIL } from '../lib/auth';
import { useAuth } from '../context/AuthContext';
import { CURRENT_VERSION_LABEL } from '../constants/version';
import { listCourses } from '../lib/appwrite';
import AdminModal from '../components/AdminModal';
import UserDetailsModal from '../components/UserDetailsModal';

export default function Admin() {
  const { user, isAdmin, isAuthenticated, loading: authLoading } = useAuth();
  const [authState, setAuthState] = useState(getAuthState());
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'archived' | 'courses' | 'feedback' | 'emails' | 'tokens'
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [tokenMetrics, setTokenMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [toppingUpId, setToppingUpId] = useState(null);
  const [deletingCourseId, setDeletingCourseId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved'
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [courseFilterType, setCourseFilterType] = useState('all'); // 'all' | 'url' | 'document'
  const [notification, setNotification] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isTestingEmails, setIsTestingEmails] = useState(false);
  const [copiedFeedbackId, setCopiedFeedbackId] = useState(null);

  // Custom Email Composer State
  const [customRecipientType, setCustomRecipientType] = useState('broadcast'); // 'broadcast' | 'single'
  const [customRecipientEmail, setCustomRecipientEmail] = useState('');
  const [customEmailSubject, setCustomEmailSubject] = useState('Welcome to CourseIT Beta!');
  const [customEmailBody, setCustomEmailBody] = useState('Hi Beta Tester,\n\nThanks for participating in the CourseIT Beta! You now have access to high-speed documentation synthesis, client-side OCR, and 250 test credits.\n\nEnjoy testing!\n- Kenn & The CourseIT Team');
  const [isSendingCustomEmail, setIsSendingCustomEmail] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    setAuthState({ isAuthenticated, isAdmin, user });
    if (isAdmin || user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      fetchUsers();
      fetchCourses();
      fetchFeedbacks();
      fetchTokenMetrics();
    } else {
      setLoading(false);
    }
  }, [authLoading, isAdmin, user, isAuthenticated]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await authenticatedFetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const list = await listCourses(user?.id || user?.$id, true);
      setCourses(list || []);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const res = await authenticatedFetch('/api/feedback');
      const data = await res.json();
      if (data.success) {
        setFeedbacks(data.feedbacks || []);
      }
    } catch (err) {
      console.error('Failed to fetch feedback:', err);
    }
  };

  const handleApprove = async (userId, customEmail) => {
    setApprovingId(userId);
    setNotification(null);

    try {
      const res = await authenticatedFetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email: customEmail })
      });

      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          message: `Approved ${customEmail || userId}! 250 course credits granted and confirmation email dispatched.`
        });
        await fetchUsers();
        if (selectedUser) setSelectedUser(null);
      } else {
        throw new Error(data.error || 'Approval failed');
      }
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setApprovingId(null);
    }
  };

  const handleTopUp = async (userId, amount = 250) => {
    setToppingUpId(userId);
    setNotification(null);

    try {
      const res = await authenticatedFetch('/api/admin/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount })
      });

      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          message: `Granted +${amount} credits to user!`
        });
        await fetchUsers();
        if (selectedUser) {
          setSelectedUser(prev => prev ? { ...prev, quota_remaining: (prev.quota_remaining || 0) + amount } : null);
        }
      } else {
        throw new Error(data.error || 'Top-up failed');
      }
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setToppingUpId(null);
    }
  };

  const handleReactivate = async (userId) => {
    try {
      await authenticatedFetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      setNotification({
        type: 'success',
        message: `Account reactivated and status set to approved!`
      });
      await fetchUsers();
      setSelectedUser(null);
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Delete this course from database permanently?')) return;
    setDeletingCourseId(courseId);

    try {
      const res = await authenticatedFetch('/api/courses/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId })
      });
      const data = await res.json();
      if (data.success) {
        setCourses(prev => prev.filter(c => c.$id !== courseId));
        setNotification({ type: 'success', message: 'Course deleted permanently from Appwrite.' });
      } else {
        throw new Error(data.error || 'Failed to delete course.');
      }
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to delete course.' });
    } finally {
      setDeletingCourseId(null);
    }
  };

  const handleFeedbackStatus = async (feedbackId, status) => {
    try {
      const res = await authenticatedFetch('/api/admin/feedbacks/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackId, status })
      });
      const data = await res.json();
      if (data.success) {
        setFeedbacks(prev => prev.map(f => f.id === feedbackId ? { ...f, status } : f));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestAllEmails = async () => {
    setIsTestingEmails(true);
    setNotification(null);

    try {
      const res = await authenticatedFetch('/api/admin/test-all-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: ADMIN_EMAIL })
      });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          message: `All 5 email templates successfully dispatched to ${ADMIN_EMAIL} via hello@courseit.kenncode.me!`
        });
      } else {
        throw new Error(data.error || 'Failed to dispatch test emails');
      }
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsTestingEmails(false);
    }
  };

  const fetchTokenMetrics = async () => {
    setLoadingTokens(true);
    try {
      const res = await authenticatedFetch('/api/admin/token-metrics');
      const data = await res.json();
      if (data.success) {
        setTokenMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to fetch token metrics:', err);
    } finally {
      setLoadingTokens(false);
    }
  };

  const handleExportAllFeedbackMd = () => {
    if (!feedbacks || feedbacks.length === 0) return;
    let md = `# CourseIT Beta Tester Feedback Export\n\n`;
    md += `*Exported on: ${new Date().toLocaleString()}*\n`;
    md += `*Total Submissions: ${feedbacks.length}*\n\n`;
    md += `| User | Email | Category | Rating | Date |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    feedbacks.forEach(f => {
      md += `| ${f.name || 'Anonymous'} | ${f.email || 'N/A'} | ${f.category || 'General'} | ${f.rating}/5 | ${new Date(f.createdAt).toLocaleDateString()} |\n`;
    });
    md += `\n---\n\n## Feedback Submissions\n\n`;
    feedbacks.forEach((f, idx) => {
      md += `### ${idx + 1}. ${f.category || 'General'} — ${'★'.repeat(f.rating || 5)} (${f.name || 'Anonymous'})\n\n`;
      md += `- **Author**: ${f.name || 'Anonymous'} (${f.email || 'N/A'})\n`;
      md += `- **Date**: ${new Date(f.createdAt).toLocaleString()}\n`;
      md += `- **Status**: ${f.status || 'new'}\n\n`;
      md += `> "${(f.feedback || '').replace(/\n/g, '\n> ')}"\n\n`;
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `courseit_beta_feedback_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setNotification({ type: 'success', message: 'Exported feedback to Markdown successfully!' });
  };

  const handleCopyFeedbackMd = (f) => {
    const md = `### Beta Feedback: ${f.category || 'General'} (${'★'.repeat(f.rating || 5)})\n**Author**: ${f.name || 'Anonymous'} (${f.email})\n**Date**: ${new Date(f.createdAt).toLocaleDateString()}\n\n> "${f.feedback}"`;
    navigator.clipboard.writeText(md);
    setCopiedFeedbackId(f.id);
    setTimeout(() => setCopiedFeedbackId(null), 2000);
    setNotification({ type: 'success', message: 'Feedback entry copied as Markdown!' });
  };

  const handleSendCustomEmail = async (e) => {
    e.preventDefault();
    setIsSendingCustomEmail(true);
    setNotification(null);

    try {
      const isBroadcast = customRecipientType === 'broadcast';
      const to = isBroadcast ? null : customRecipientEmail.trim();

      if (!isBroadcast && !to) {
        throw new Error('Please specify a recipient email address.');
      }

      const res = await authenticatedFetch('/api/admin/send-custom-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject: customEmailSubject.trim(),
          message: customEmailBody.trim(),
          isBroadcast
        })
      });

      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          message: isBroadcast
            ? `Broadcast email successfully dispatched to ${data.count || 'all'} approved beta testers!`
            : `Email successfully delivered to ${to} via hello@courseit.kenncode.me!`
        });
      } else {
        throw new Error(data.error || 'Failed to dispatch email');
      }
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsSendingCustomEmail(false);
    }
  };

  const isUserAdmin = Boolean(isAdmin || user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() || authState.isAdmin || authState.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  if (!isUserAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center animate-in fade-in">
        <div className="glass-panel p-8 rounded-3xl border border-rose-500/30 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Access Restricted</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            This dashboard is restricted to the master administrator (<strong className="text-slate-200">{ADMIN_EMAIL}</strong>).
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="btn-primary py-2.5 rounded-xl font-semibold text-xs text-white"
            >
              Sign In as Administrator
            </button>
            <Link to="/" className="py-2.5 rounded-xl text-xs text-slate-400 hover:text-white transition-colors">
              &larr; Return to Dashboard
            </Link>
          </div>
        </div>

        <AdminModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          authState={authState}
          onAuthChange={(newState) => {
            setAuthState(newState);
            if (newState.isAdmin) {
              fetchUsers();
              fetchCourses();
              fetchFeedbacks();
            }
          }}
        />
      </div>
    );
  }

  // Filter active vs archived
  const activeUsers = users.filter(u => u.status !== 'archived');
  const archivedUsers = users.filter(u => u.status === 'archived');

  const filteredUsers = activeUsers.filter((u) => {
    const matchesSearch =
      (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && u.status === statusFilter;
  });

  const pendingCount = users.filter(u => u.status === 'pending').length;
  const approvedCount = users.filter(u => u.status === 'approved').length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              to="/"
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Courses</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">Admin & Beta Operations</h1>
                <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-mono text-[10px] font-semibold border border-violet-500/30">
                  Master
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manage user approvals, review beta feedback, audit archived accounts, and test email delivery.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchUsers(); fetchCourses(); fetchFeedbacks(); }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-slate-200 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-indigo-500/20 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Registered Accounts</p>
            <p className="text-2xl font-bold text-white mt-1">{users.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-amber-500/20 flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-400 font-medium">Pending Approvals</p>
            <p className="text-2xl font-bold text-white mt-1">{pendingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-400 font-medium">Beta Feedback</p>
            <p className="text-2xl font-bold text-white mt-1">{feedbacks.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-violet-500/20 flex items-center justify-between">
          <div>
            <p className="text-xs text-violet-400 font-medium">Archived Users</p>
            <p className="text-2xl font-bold text-white mt-1">{archivedUsers.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Archive className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Tabs Switcher */}
      <div className="flex flex-wrap p-1.5 rounded-2xl bg-slate-900 border border-slate-800 w-fit gap-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Active Users ({activeUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('feedback')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'feedback'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Beta Feedback ({feedbacks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('archived')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'archived'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Archived ({archivedUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('courses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'courses'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Courses ({courses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('emails')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'emails'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Email Suite</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('tokens');
            fetchTokenMetrics();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'tokens'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>API & Tokens</span>
        </button>
      </div>

      {/* Notification Toast */}
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
          <span className="text-xs sm:text-sm font-medium leading-relaxed">{notification.message}</span>
        </div>
      )}

      {/* Tab 1: User Management */}
      {activeTab === 'users' && (
        <div className="glass-panel rounded-3xl border border-indigo-500/20 overflow-hidden shadow-2xl">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/50">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search user name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              {['all', 'pending', 'approved'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1 rounded-lg font-medium capitalize transition-all cursor-pointer ${
                    statusFilter === filter
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Quota Remaining</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-slate-500">
                      No matching users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isUserApproved = u.status === 'approved';
                    const isUserPending = u.status === 'pending';
                    const isMasterAdmin = u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

                    return (
                      <tr
                        key={u.user_id}
                        onClick={() => setSelectedUser(u)}
                        className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-bold text-white group-hover:scale-105 transition-transform">
                              {u.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-white truncate flex items-center gap-1.5">
                                <span>{u.name || 'Anonymous'}</span>
                                {isMasterAdmin && (
                                  <span className="text-[10px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded font-mono">
                                    Admin
                                  </span>
                                )}
                              </p>
                              <p className="text-slate-500 font-mono text-[11px] truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                              isUserApproved
                                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 font-mono font-bold text-slate-200">
                          {u.quota_remaining ?? 250} credits
                        </td>

                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {isUserPending && (
                              <button
                                onClick={() => handleApprove(u.user_id, u.email)}
                                disabled={approvingId === u.user_id}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all cursor-pointer disabled:opacity-50"
                              >
                                {approvingId === u.user_id ? (
                                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                                <span>{approvingId === u.user_id ? 'Approving...' : 'Approve'}</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleTopUp(u.user_id, 250)}
                              disabled={toppingUpId === u.user_id}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-all cursor-pointer font-mono disabled:opacity-50"
                              title="Add +250 credits"
                            >
                              {toppingUpId === u.user_id ? (
                                <div className="w-3.5 h-3.5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                              ) : (
                                <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
                              )}
                              <span>{toppingUpId === u.user_id ? 'Adding...' : '+250'}</span>
                            </button>

                            <button
                              onClick={() => setSelectedUser(u)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              title="View Details"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Beta Feedback Management */}
      {activeTab === 'feedback' && (
        <div className="glass-panel rounded-3xl border border-indigo-500/20 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">Beta Tester Feedback ({feedbacks.length})</h3>
              <p className="text-xs text-slate-400">Live submissions from logged-in beta testers</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportAllFeedbackMd}
                disabled={feedbacks.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
                title="Export all feedback to Markdown file"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Export All (.md)</span>
              </button>
              <button
                onClick={fetchFeedbacks}
                className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {feedbacks.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No feedback submitted yet. Users can click the "Beta Feedback" button anytime.
            </div>
          ) : (
            <div className="space-y-3">
              {feedbacks.map((f) => (
                <div
                  key={f.id}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2 hover:border-indigo-500/30 transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-xs">{f.name}</span>
                      <span className="text-slate-500 text-[11px] font-mono">({f.email})</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                        {f.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-amber-400 text-xs font-bold font-mono">
                        {'★'.repeat(f.rating)} ({f.rating}/5)
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(f.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800/60 font-sans">
                    {f.message}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span className="truncate max-w-[280px] font-mono">
                      Page: {f.pageUrl || 'Dashboard'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyFeedbackMd(f)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                        title="Copy this feedback as Markdown"
                      >
                        {copiedFeedbackId === f.id ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-mono text-[11px]">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[11px]">Copy .md</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleFeedbackStatus(f.id, f.status === 'reviewed' ? 'resolved' : 'reviewed')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                          f.status === 'resolved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        Status: {f.status}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Archived Accounts */}
      {activeTab === 'archived' && (
        <div className="glass-panel rounded-3xl border border-indigo-500/20 p-6 space-y-4">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white">Archived Accounts ({archivedUsers.length})</h3>
            <p className="text-xs text-slate-400">Users who chose to pause or archive their accounts</p>
          </div>

          {archivedUsers.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No archived accounts on record.
            </div>
          ) : (
            <div className="space-y-3">
              {archivedUsers.map((u) => (
                <div
                  key={u.user_id}
                  onClick={() => setSelectedUser(u)}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4 cursor-pointer hover:border-amber-500/40 transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{u.name || 'User'}</span>
                      <span className="text-slate-500 font-mono text-xs">({u.email})</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono">
                        Archived
                      </span>
                    </div>
                    {u.archive_reason && (
                      <p className="text-xs text-slate-400 mt-1">
                        <strong className="text-slate-300">Reason:</strong> {u.archive_reason}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReactivate(u.user_id);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-600/30 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reactivate</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Courses & Generation History Management */}
      {activeTab === 'courses' && (() => {
        const filteredCourseList = courses.filter((c) => {
          const isDoc = Boolean(c.source_url?.startsWith('upload://') || c.source_url?.includes('ocr'));
          if (courseFilterType === 'url' && isDoc) return false;
          if (courseFilterType === 'document' && !isDoc) return false;

          const q = courseSearchTerm.toLowerCase();
          return (
            (c.title || '').toLowerCase().includes(q) ||
            (c.source_url || '').toLowerCase().includes(q) ||
            (c.creator_email || '').toLowerCase().includes(q) ||
            (c.creator_name || '').toLowerCase().includes(q)
          );
        });

        return (
          <div className="glass-panel rounded-3xl border border-indigo-500/20 p-6 space-y-5">
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-mono mb-1.5">
                  <Database className="w-3 h-3" />
                  <span>Appwrite Collections Storage</span>
                </div>
                <h3 className="text-base font-bold text-white">All User Generations & Upload History ({courses.length})</h3>
                <p className="text-xs text-slate-400">
                  Inspect and manage all courses, extracted web documentation, and OCR scans stored in Appwrite.
                </p>
              </div>
              <button
                onClick={fetchCourses}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-slate-200 text-xs font-semibold transition-all cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {/* Search & Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter by title, author email, or URL..."
                  value={courseSearchTerm}
                  onChange={(e) => setCourseSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                {[
                  { id: 'all', label: `All (${courses.length})` },
                  { id: 'url', label: 'Web URLs' },
                  { id: 'document', label: 'OCR Uploads' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setCourseFilterType(f.id)}
                    className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      courseFilterType === f.id
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Course List */}
            {filteredCourseList.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No generation records found matching criteria.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {filteredCourseList.map((c) => {
                  const isDoc = Boolean(c.source_url?.startsWith('upload://') || c.source_url?.includes('ocr'));
                  const isStarter = Boolean(c.is_curated || c.$id?.startsWith('starter-'));
                  const author = c.creator_email || c.creator_name || (isStarter ? 'CourseIT Team' : 'Guest User');

                  return (
                    <div key={c.$id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-slate-850/40 rounded-xl px-2 transition-colors">
                      <div className="min-w-0 flex-1 flex items-start gap-3">
                        <div className={`p-2 rounded-xl shrink-0 mt-0.5 border ${
                          isDoc
                            ? 'bg-violet-500/10 border-violet-500/20 text-violet-400'
                            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                        }`}>
                          {isDoc ? <UploadCloud className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[10px] font-mono font-semibold px-2 py-0.2 rounded-full border ${
                              isDoc
                                ? 'bg-violet-500/10 text-violet-300 border-violet-500/20'
                                : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                            }`}>
                              {isDoc ? 'OCR Doc' : 'URL Doc'}
                            </span>

                            <span className="text-[11px] font-mono text-slate-400">
                              By: <strong className="text-slate-300">{author}</strong>
                            </span>

                            {c.$createdAt && (
                              <span className="text-[10px] font-mono text-slate-500">
                                &bull; {new Date(c.$createdAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          <p className="text-xs font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                            {c.title || 'Untitled'}
                          </p>

                          <p className="text-[11px] text-slate-500 font-mono truncate max-w-xl">
                            {c.source_url}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Link
                          to={`/course/${c.$id}`}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                          title="Open Course"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View</span>
                        </Link>

                        <button
                          onClick={() => handleDeleteCourse(c.$id)}
                          disabled={deletingCourseId === c.$id}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete from Appwrite database"
                        >
                          {deletingCourseId === c.$id ? (
                            <div className="w-3.5 h-3.5 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* Tab 5: Email Suite & Tester Broadcast */}
      {activeTab === 'emails' && (
        <div className="space-y-6">
          {/* Section A: Live Tester Composer */}
          <div className="glass-panel rounded-3xl border border-indigo-500/20 p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-400" />
                <span>Tester Email Composer</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Dispatch direct messages or broadcast announcements to approved beta testers from{' '}
                <span className="text-indigo-400 font-mono font-semibold">CourseIT &lt;hello@courseit.kenncode.me&gt;</span>
              </p>
            </div>

            <form onSubmit={handleSendCustomEmail} className="space-y-4">
              {/* Recipient Mode */}
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="recipientType"
                    checked={customRecipientType === 'broadcast'}
                    onChange={() => setCustomRecipientType('broadcast')}
                    className="accent-indigo-600"
                  />
                  <span>Broadcast to All Approved Beta Testers ({activeUsers.length})</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="recipientType"
                    checked={customRecipientType === 'single'}
                    onChange={() => setCustomRecipientType('single')}
                    className="accent-indigo-600"
                  />
                  <span>Direct to Specific Tester</span>
                </label>
              </div>

              {customRecipientType === 'single' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-mono">
                    Recipient Email:
                  </label>
                  <input
                    type="email"
                    placeholder="tester@example.com"
                    value={customRecipientEmail}
                    onChange={(e) => setCustomRecipientEmail(e.target.value)}
                    required={customRecipientType === 'single'}
                    className="w-full py-2.5 px-4 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              )}

              {/* Email Presets */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-mono text-slate-400">Presets:</span>
                <button
                  type="button"
                  onClick={() => {
                    setCustomEmailSubject('Welcome to CourseIT Beta!');
                    setCustomEmailBody('Hi Beta Tester,\n\nThanks for participating in the CourseIT Beta! You now have access to high-speed documentation synthesis, client-side OCR, and 250 test credits.\n\nEnjoy testing!\n- Kenn & The CourseIT Team');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono cursor-pointer transition-colors"
                >
                  Welcome
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomEmailSubject('CourseIT - New Features & Model Tiers Deployed');
                    setCustomEmailBody(`Hi Beta Tester,\n\nWe just deployed ${CURRENT_VERSION_LABEL} with Gemini 3.5, 3.6, and 3.7 model tiers, export to PDF/DOCX, and a companion tutor on the dashboard.\n\nTake it for a spin and let us know what you think!\n- Kenn & The CourseIT Team`);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono cursor-pointer transition-colors"
                >
                  Feature Drop
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomEmailSubject('CourseIT - Extra 250 Credits Added to Your Account');
                    setCustomEmailBody('Hi Beta Tester,\n\nWe added +250 extra generation credits to your account so you can continue testing complex documentation and OCR scans!\n\nHappy learning,\n- CourseIT Team');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono cursor-pointer transition-colors"
                >
                  Credit Top-Up
                </button>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-mono">
                  Subject Line:
                </label>
                <input
                  type="text"
                  value={customEmailSubject}
                  onChange={(e) => setCustomEmailSubject(e.target.value)}
                  required
                  className="w-full py-2.5 px-4 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              {/* Message Body */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-mono">
                  Message Content:
                </label>
                <textarea
                  rows={5}
                  value={customEmailBody}
                  onChange={(e) => setCustomEmailBody(e.target.value)}
                  required
                  className="w-full p-4 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-200 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-sans"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500 font-mono">
                  Dispatched in real-time via Resend API
                </span>

                <button
                  type="submit"
                  disabled={isSendingCustomEmail}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSendingCustomEmail ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending Email...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{customRecipientType === 'broadcast' ? 'Broadcast Email' : 'Send Direct Email'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Section B: Automated Template Diagnostic Suite */}
          <div className="glass-panel rounded-3xl border border-indigo-500/20 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Automated Template Diagnostics</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Test and inspect all 5 system email templates delivered to your admin mailbox.
                </p>
              </div>

              <button
                onClick={handleTestAllEmails}
                disabled={isTestingEmails}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className={`w-3.5 h-3.5 ${isTestingEmails ? 'animate-spin' : ''}`} />
                <span>{isTestingEmails ? 'Dispatching Batch...' : 'Send Test Batch (kenn.nacario12@gmail.com)'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: '1. Access Request Received', subject: 'CourseIT - Access Request Received', purpose: 'Sent to users right after email/password signup.' },
                { name: '2. Account Approved', subject: 'Your CourseIT account is approved!', purpose: 'Sent when admin grants 250 credits and approves account.' },
                { name: '3. Password Reset', subject: 'CourseIT - Password Reset Request', purpose: 'Contains one-time 8-character security code.' },
                { name: '4. Account Archived', subject: 'CourseIT - Your account has been archived', purpose: 'Sent upon user request with reason & reactivation notes.' },
                { name: '5. Beta Feedback Alert', subject: '[CourseIT Beta Feedback] Rating & Details', purpose: 'Dispatched to admin whenever a user submits beta feedback.' }
              ].map((t) => (
                <div key={t.name} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                  <span className="text-xs font-bold text-white">{t.name}</span>
                  <p className="text-[11px] font-mono text-indigo-400">Subject: {t.subject}</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{t.purpose}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: API & Token Usage Monitor */}
      {activeTab === 'tokens' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl border border-indigo-500/20 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-400" />
                  <span>Google Gemini API & Token Usage Monitor</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Live token consumption, model tier breakdown, and cost estimation.
                </p>
              </div>

              <button
                onClick={fetchTokenMetrics}
                disabled={loadingTokens}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-slate-200 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingTokens ? 'animate-spin' : ''}`} />
                <span>Refresh Metrics</span>
              </button>
            </div>

            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/20 space-y-1">
                <span className="text-xs text-slate-400 font-mono">Total Tokens</span>
                <p className="text-xl sm:text-2xl font-bold text-white font-mono">
                  {tokenMetrics?.totalTokens ? tokenMetrics.totalTokens.toLocaleString() : '0'}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">Prompt + Candidates</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/20 space-y-1">
                <span className="text-xs text-emerald-400 font-mono">Est. Gemini Cost</span>
                <p className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono">
                  ${(tokenMetrics?.estimatedCostUsd || 0).toFixed(4)}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">USD Blended Rates</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/20 space-y-1">
                <span className="text-xs text-amber-400 font-mono">Generations</span>
                <p className="text-xl sm:text-2xl font-bold text-white font-mono">
                  {tokenMetrics?.totalGenerations || 0}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">Courses Produced</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-violet-500/20 space-y-1">
                <span className="text-xs text-violet-400 font-mono">Prompt vs Output</span>
                <p className="text-xs text-slate-300 font-mono mt-1">
                  Prompt: <strong className="text-white">{tokenMetrics?.promptTokens ? tokenMetrics.promptTokens.toLocaleString() : '0'}</strong>
                </p>
                <p className="text-xs text-slate-300 font-mono">
                  Output: <strong className="text-white">{tokenMetrics?.candidateTokens ? tokenMetrics.candidateTokens.toLocaleString() : '0'}</strong>
                </p>
              </div>
            </div>

            {/* Per-User Consumption Table */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                User Consumption Breakdown
              </h4>
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3">User Identifier</th>
                      <th className="px-5 py-3">Total Tokens</th>
                      <th className="px-5 py-3">Generations</th>
                      <th className="px-5 py-3">Estimated Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {!tokenMetrics?.perUser || Object.keys(tokenMetrics.perUser).length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-6 text-slate-500">
                          No token usage recorded yet. Generate courses to view live metrics.
                        </td>
                      </tr>
                    ) : (
                      Object.entries(tokenMetrics.perUser).map(([uKey, stats]) => (
                        <tr key={uKey} className="hover:bg-slate-800/30">
                          <td className="px-5 py-3 font-mono text-slate-300">{uKey}</td>
                          <td className="px-5 py-3 font-mono font-bold text-white">
                            {stats.totalTokens?.toLocaleString()}
                          </td>
                          <td className="px-5 py-3 font-mono text-slate-300">{stats.generations}</td>
                          <td className="px-5 py-3 font-mono text-emerald-400">
                            ${(stats.estimatedCostUsd || 0).toFixed(4)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Generation Log */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                Recent Generation Audit Log
              </h4>
              <div className="space-y-2">
                {!tokenMetrics?.history || tokenMetrics.history.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No recent course generations logged.</p>
                ) : (
                  tokenMetrics.history.slice(0, 10).map((h, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">{h.courseTitle}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {h.model} &bull; {new Date(h.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 font-mono text-xs">
                        <span className="text-slate-400">
                          P: <strong className="text-slate-200">{h.promptTokens}</strong> / C:{' '}
                          <strong className="text-slate-200">{h.candidateTokens}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                          {h.totalTokens} tokens
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      <UserDetailsModal
        isOpen={Boolean(selectedUser)}
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onTopUp={handleTopUp}
        onApprove={handleApprove}
        onReactivate={handleReactivate}
      />
    </div>
  );
}
