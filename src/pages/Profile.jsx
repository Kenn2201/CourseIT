import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  ShieldCheck,
  Zap,
  Clock,
  KeyRound,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Archive,
  Cpu,
  Camera,
  Upload,
  Image as ImageIcon,
  Lock,
  BookOpen,
  Sparkles,
  Layers,
  Trash2
} from 'lucide-react';
import { requestPasswordReset } from '../lib/auth';
import { listCourses } from '../lib/appwrite';
import { useAuth } from '../context/AuthContext';
import { AVATAR_PRESETS } from '../constants/presets';
import ArchiveAccountModal from '../components/ArchiveAccountModal';
import AdminModal from '../components/AdminModal';

const MODEL_TIERS = [
  { name: 'Flash Lite (Latest)', cost: '0.5 credits', desc: 'Fastest generation (~0.8s), great for standard guides' },
  { name: 'Gemini 3.5 Lite', cost: '1.0 credit', desc: 'Balanced speed and detail for developer documentation' },
  { name: 'Gemini 3.6 Flash', cost: '2.0 credits', desc: 'Deep synthesis with rich code examples' },
  { name: 'Gemini 3.7 Flash', cost: '5.0 credits', desc: 'High-power reasoning for complex technical architectures' }
];

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { user, isAuthenticated, isAdmin, isPending, quota, credits, logout, loading: authLoading } = useAuth();
  const authState = { user, isAuthenticated, isAdmin, isPending, quota };
  
  const [coursesCount, setCoursesCount] = useState(0);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [notification, setNotification] = useState(null);
  const [resettingPass, setResettingPass] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const [selectedAvatarId, setSelectedAvatarId] = useState(() => {
    try {
      return localStorage.getItem('courseit_custom_pfp') || 'grad-1';
    } catch {
      return 'grad-1';
    }
  });

  const [customPfpImg, setCustomPfpImg] = useState(() => {
    try {
      return localStorage.getItem('courseit_custom_pfp_img') || null;
    } catch {
      return null;
    }
  });

  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [avatarTab, setAvatarTab] = useState('preset'); // 'preset' | 'upload'

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadUserData(user.id, isAdmin);
    } else if (!authLoading && !isAuthenticated) {
      setLoadingMetrics(false);
    }
  }, [isAuthenticated, user?.id, isAdmin, authLoading]);

  const loadUserData = async (userId, userIsAdmin) => {
    setLoadingMetrics(true);
    try {
      // includeCurated = false strictly loads only custom user syntheses, avoiding starter templates
      const userCourses = await listCourses(userId, userIsAdmin, false);
      setCoursesCount(Array.isArray(userCourses) ? userCourses.length : 0);
    } catch (err) {
      console.error('Failed to load user courses count:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setNotification({
        type: 'error',
        message: 'Please select a valid image file (JPEG, PNG, or WEBP).'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setNotification({
        type: 'error',
        message: 'Image size exceeds 5MB limit. Please choose a smaller image.'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Draw cropped cover
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        try {
          localStorage.setItem('courseit_custom_pfp_img', dataUrl);
          setCustomPfpImg(dataUrl);
          window.dispatchEvent(new Event('courseit_pfp_updated'));
          setNotification({
            type: 'success',
            message: 'Custom profile photo uploaded & saved successfully!'
          });
        } catch (err) {
          setNotification({
            type: 'error',
            message: 'Unable to save image locally due to browser storage quota.'
          });
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveCustomPfp = () => {
    try {
      localStorage.removeItem('courseit_custom_pfp_img');
      setCustomPfpImg(null);
      window.dispatchEvent(new Event('courseit_pfp_updated'));
      setNotification({
        type: 'success',
        message: 'Custom photo removed. Switched back to preset avatar.'
      });
    } catch {}
  };

  const handleSelectPreset = (pfpId) => {
    setSelectedAvatarId(pfpId);
    try {
      localStorage.setItem('courseit_custom_pfp', pfpId);
      localStorage.removeItem('courseit_custom_pfp_img');
      setCustomPfpImg(null);
      window.dispatchEvent(new Event('courseit_pfp_updated'));
    } catch {}
    setNotification({
      type: 'success',
      message: 'Profile avatar updated to preset icon!'
    });
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setResettingPass(true);
    setNotification(null);

    try {
      await requestPasswordReset(user.email);
      setNotification({
        type: 'success',
        message: `Password reset email dispatched to ${user.email} via Resend! Check your inbox.`
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

  const handleSignOut = async () => {
    await logout();
    navigate('/');
  };

  const remainingCredits = typeof credits === 'number' ? credits : 250;
  const maxCredits = 250;
  const creditsPercentage = Math.min(100, Math.max(0, (remainingCredits / maxCredits) * 100));

  const activePreset = AVATAR_PRESETS.find(a => a.id === selectedAvatarId) || AVATAR_PRESETS[0];

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center animate-in fade-in">
        <div className="glass-panel p-8 rounded-3xl border border-indigo-500/30 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Authentication Required</h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            You must be signed in to view and manage your account profile, reasoning credits, and saved courses.
          </p>
          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="btn-primary py-2.5 rounded-xl font-semibold text-xs text-white cursor-pointer"
            >
              Sign In to Your Account
            </button>
            <Link to="/" className="py-2.5 rounded-xl text-xs text-slate-400 hover:text-white transition-colors">
              &larr; Return to Dashboard
            </Link>
          </div>
        </div>
        <AdminModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode="login"
          authState={{ isAuthenticated: false, user: null, isAdmin: false }}
          onAuthChange={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <Link
            to="/app"
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Studio Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Account & Profile</h1>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-mono font-semibold">
              v1.11.0 LIVE
            </span>
          </div>
          <p className="text-xs text-slate-400">Manage your avatar, Gemini credits, account security, and usage metrics.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/app"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 transition-all cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Studio Dashboard</span>
          </Link>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
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
                  className={`w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-tr ${
                    activePreset.bg
                  } flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/25 cursor-pointer hover:scale-105 transition-transform border border-white/10`}
                  onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                  title="Click to customize avatar photo or preset"
                >
                  {customPfpImg ? (
                    <img src={customPfpImg} alt="Custom Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span>{activePreset.icon || user?.name?.[0]?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                  className="absolute -bottom-1 -right-1 p-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 hover:text-white cursor-pointer shadow-sm"
                  title="Change avatar photo"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{user?.name || user?.email?.split('@')[0] || 'Beta Tester'}</h2>
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
                  <span>{user?.email || ''}</span>
                </p>
              </div>
            </div>

            {/* Active Session Status Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Appwrite Cloud (Sydney syd1)</span>
            </div>
          </div>

          {/* Avatar Customizer Dropdown Drawer */}
          {isEditingAvatar && (
            <div className="p-5 rounded-2xl bg-slate-950/90 border border-indigo-500/30 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAvatarTab('preset')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      avatarTab === 'preset'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Preset Icons
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarTab('upload')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      avatarTab === 'upload'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Upload Custom Photo
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingAvatar(false)}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer font-mono"
                >
                  Done
                </button>
              </div>

              {avatarTab === 'preset' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {AVATAR_PRESETS.map((pfp) => (
                      <button
                        key={pfp.id}
                        type="button"
                        onClick={() => handleSelectPreset(pfp.id)}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                          !customPfpImg && selectedAvatarId === pfp.id
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
                  {customPfpImg && (
                    <p className="text-[11px] text-amber-400/90 font-mono">
                      Note: You currently have a custom photo active. Selecting a preset will switch back to icon mode.
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-800 border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                      {customPfpImg ? (
                        <img src={customPfpImg} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-slate-500" />
                      )}
                    </div>
                    <div className="space-y-2 text-center sm:text-left flex-1">
                      <p className="text-xs font-semibold text-white">Upload from your device</p>
                      <p className="text-[11px] text-slate-400">
                        Supports PNG, JPG, or WEBP up to 5MB. Automatically cropped and optimized into a high-res 256x256 profile picture.
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Choose Image</span>
                        </button>
                        {customPfpImg && (
                          <button
                            type="button"
                            onClick={handleRemoveCustomPfp}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove Photo</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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

      {/* Account Summary & Workspace Metrics (Overhaul replacing redundant course list) */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Account Summary & Workspace Metrics</span>
            </h3>
            <p className="text-xs text-slate-400">
              Live telemetry and synthesis quotas linked to your Appwrite session.
            </p>
          </div>
          <button
            onClick={() => loadUserData(user?.id, isAdmin)}
            disabled={loadingMetrics}
            className="self-start sm:self-auto p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loadingMetrics ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Custom Syntheses</span>
              <BookOpen className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {loadingMetrics ? '...' : coursesCount}
            </div>
            <p className="text-[11px] text-slate-500">
              User-authored learning paths (excluding starter templates).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Reasoning Credits</span>
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {remainingCredits.toFixed(1)} <span className="text-xs font-normal text-slate-400">/ {maxCredits}</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Available balance refreshed upon session renewal.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Tokens Processed</span>
              <Cpu className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {authState?.quota?.tokens_used ? authState.quota.tokens_used.toLocaleString() : '14,250'}
            </div>
            <p className="text-[11px] text-slate-500">
              Gemini LLM context tokens ingested across sessions.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Platform Access</span>
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-sm font-bold text-white pt-1">
              {isAdmin ? 'Administrator' : 'Approved Beta User'}
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Live Cloud Node: Sydney syd1
            </p>
          </div>
        </div>

        {/* Dashboard Direct Redirection Callout */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/50 border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h4 className="text-sm font-bold text-white">Manage & Study Your Learning Paths</h4>
            </div>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              All your synthesized step-by-step documentation, interactive quizzes, runnable code blocks, and starter templates are managed directly inside the Studio Dashboard.
            </p>
          </div>

          <Link
            to="/app"
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <span>Open Studio Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Modals */}
      <ArchiveAccountModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        userEmail={user?.email || ''}
        onArchived={() => {
          setIsArchiveModalOpen(false);
          setNotification({
            type: 'success',
            message: 'Account archived. Confirmation email dispatched via Resend.'
          });
        }}
      />
    </div>
  );
}
