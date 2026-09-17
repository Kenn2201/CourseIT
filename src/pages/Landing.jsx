import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  Terminal,
  CheckCircle2,
  Zap,
  Layers,
  ShieldCheck,
  Cpu,
  FileText,
  Code2,
  Scan,
  ArrowUpRight,
  Play,
  Gamepad2,
  Radio,
  Check,
  ExternalLink,
  ChevronRight,
  Boxes,
  Container,
  Flame,
  BrainCircuit,
  Sun,
  Moon
} from 'lucide-react';
import ShapeGrid from '../components/reactbits/ShapeGrid';
import SpotlightCard from '../components/reactbits/SpotlightCard';
import AntiFluffDiff from '../components/AntiFluffDiff';
import Footer from '../components/Footer';
import ChangelogModal from '../components/ChangelogModal';
import AdminModal from '../components/AdminModal';
import CourseTutor from '../components/CourseTutor';
import { STARTER_COURSES } from '../data/starterCourses';
import { getAuthState } from '../lib/auth';
import { CURRENT_VERSION_LABEL } from '../constants/version';

const CURATED_DEMOS = [
  {
    id: 'react-server-components',
    title: 'React 19 Server Components & Actions',
    category: 'React / Next.js',
    badge: 'Official Docs',
    steps: 5,
    time: '~25 min',
    summary: 'Master async server transitions, useActionState, and zero-bundle-size server execution paths.',
    url: 'https://react.dev/reference/rsc/server-components',
    icon: Boxes
  },
  {
    id: 'godot-using-signals',
    title: 'Using Signals to Decouple Game Objects',
    category: 'Godot Engine',
    badge: 'Official Docs',
    steps: 4,
    time: '~30 min',
    summary: 'Emit custom signals, connect buttons and timers, and architect clean node communication without direct references.',
    url: 'https://docs.godotengine.org/en/stable/getting_started/step_by_step/signals.html',
    icon: Radio
  },
  {
    id: 'rust-ownership-borrowing',
    title: 'Rust Ownership, References & Borrow Checker',
    category: 'Rust Lang',
    badge: 'Official Book',
    steps: 5,
    time: '~35 min',
    summary: 'Conquer the borrow checker: understand stack vs heap allocation, mutable references, and lifetime scopes.',
    url: 'https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html',
    icon: Flame
  },
  {
    id: 'docker-multi-stage-builds',
    title: 'Docker Multi-Stage Production Builds',
    category: 'Docker / DevOps',
    badge: 'Official Docs',
    steps: 4,
    time: '~20 min',
    summary: 'Slash container sizes by 85%: separate build environments from runtime artifacts with clean Dockerfile stages.',
    url: 'https://docs.docker.com/build/building/multi-stage/',
    icon: Container
  }
];

const MODEL_PRICING = [
  {
    tier: 'Flash Lite (Fastest)',
    cost: '0.5 Credits',
    desc: 'Instant synthesis for standard API pages & simple guides. Free for public guest sandbox.',
    badge: 'Guest 3/3 & Beta',
    trialLabel: 'Included in Guest 3/3 Trial & Beta',
    speed: '~0.8s'
  },
  {
    tier: 'Gemini 3.5 Lite',
    cost: '1.0 Credit',
    desc: 'Balanced reasoning with detailed implementation instructions and test commands.',
    badge: 'Beta Required',
    trialLabel: 'Approved Beta Account Required',
    speed: '~1.5s'
  },
  {
    tier: 'Gemini 3.6 Flash',
    cost: '2.0 Credits',
    desc: 'Deep multi-step structuring with verified code syntax and architectural notes.',
    badge: 'Beta Required',
    trialLabel: 'Approved Beta Account Required',
    speed: '~2.2s'
  },
  {
    tier: 'Gemini 3.7 Flash',
    cost: '5.0 Credits',
    desc: 'Maximum technical depth for intricate framework specs and complex scans.',
    badge: 'Pro Beta',
    trialLabel: 'Approved Beta Account Required',
    speed: '~3.5s'
  }
];

export default function Landing({ onLaunchApp }) {
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState('signup');
  const [theme, setTheme] = useState('dark');
  const authState = getAuthState();

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('courseit_theme') || 'dark';
      setTheme(savedTheme);
    } catch {}

    const handleThemeChange = () => {
      const current = localStorage.getItem('courseit_theme') || 'dark';
      setTheme(current);
    };

    window.addEventListener('courseit_theme_changed', handleThemeChange);
    return () => window.removeEventListener('courseit_theme_changed', handleThemeChange);
  }, []);

  const handleToggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    const updateDom = () => {
      if (newTheme === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.setAttribute('data-theme', 'dark');
      }
      setTheme(newTheme);
      try {
        localStorage.setItem('courseit_theme', newTheme);
        window.dispatchEvent(new Event('courseit_theme_changed'));
      } catch {}
    };

    if (typeof document !== 'undefined' && document.startViewTransition) {
      document.startViewTransition(() => updateDom());
    } else {
      updateDom();
    }
  };

  const handleOpenAuth = (mode = 'signup') => {
    setAuthInitialMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="landing-root min-h-screen bg-[#070913] text-slate-100 overflow-hidden relative selection:bg-indigo-500 selection:text-white animate-page-load transition-colors duration-300">
      {/* ReactBits ShapeGrid Interactive Canvas Background */}
      <div className="absolute inset-0 z-0 opacity-45 pointer-events-auto h-[720px]">
        <ShapeGrid
          direction="diagonal"
          speed={0.4}
          squareSize={48}
          shape="square"
          borderColor="#171b30"
          hoverFillColor="#272757"
          hoverTrailAmount={2}
        />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-16 sm:pt-24 sm:pb-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Release & ADHD Focus Pill */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIsChangelogOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-mono shadow-lg shadow-indigo-500/10 hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>CourseIT {CURRENT_VERSION_LABEL} • Zero-AI-Fluff Action Engine</span>
          </button>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
            Turn dense docs & scans into{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-300 to-emerald-400">
              action-first courses.
            </span>
          </h1>

          {/* ADHD / Attention Span Slogan */}
          <div className="space-y-3 max-w-2xl mx-auto">
            <p className="text-base sm:text-lg font-medium text-indigo-200">
              ⚡ Built for developers with ADHD, documentation fatigue, or low attention spans. Zero AI fluff.
            </p>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Developers spend 40% of their time decoding 40-page API documentation. CourseIT distills documentation URLs and tutorial scans into progressive numbered steps with clean code snippets (TypeScript, GDScript, Rust, Python) and zero-fluff pro-tips.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-4">
            {authState?.isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  if (onLaunchApp) onLaunchApp();
                  else navigate('/app');
                }}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-indigo-400/30"
              >
                <Terminal className="w-4 h-4" />
                <span>Go to Studio / Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleOpenAuth('signup')}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-indigo-400/30"
                >
                  <span>Get Started Free (250 Credits)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onLaunchApp) onLaunchApp();
                    else navigate('/app');
                  }}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white transition-all cursor-pointer shadow-lg"
                >
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span>Launch App Generator</span>
                </button>
              </>
            )}
          </div>

          {/* Guarantee / Value Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              250 Free Credits on Approval
            </span>
            <span className="flex items-center gap-1.5">
              <Scan className="w-4 h-4 text-indigo-400" />
              Client-Side Document OCR
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-violet-400" />
              Multi-Tier Models (0.5 – 5.0 cr)
            </span>
          </div>
        </div>
      </section>

      {/* Interactive Anti-Fluff Diff Comparison Section */}
      <section className="relative z-10 px-4 sm:px-6">
        <AntiFluffDiff />
      </section>

      {/* "What is CourseIT?" Section */}
      <section className="relative z-10 py-16 border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 text-xs font-mono mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>The Problem We Solve</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Why Action-First Learning?
            </h2>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Traditional documentation is designed as an exhaustive reference archive, not a learning path. CourseIT flips the model: learn by building.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Traditional Docs Box */}
            <div className="p-6 rounded-3xl bg-slate-950 border border-rose-500/20 space-y-4">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Traditional Docs & Wordy AI Chatbots</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">&times;</span>
                  <span>Endless conversational fluff ("Great question!", "Let me think...") wasting working memory.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">&times;</span>
                  <span>40-page API documentation with buried setup commands.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">&times;</span>
                  <span>Passive reading leads to tutorial hell without retention.</span>
                </li>
              </ul>
            </div>

            {/* CourseIT Action-First Box */}
            <div className="p-6 rounded-3xl bg-indigo-950/20 border border-indigo-500/30 space-y-4 shadow-lg shadow-indigo-950/30">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>CourseIT Action-First Curriculum</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Sequential, numbered implementation steps with badges.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Direct terminal commands (npm install, cargo add, godot --headless).</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Embedded Technical Companion for instant explanations & quizzes.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (3 Steps) with Spotlight Cards */}
      <section className="relative z-10 py-16 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 text-xs font-mono mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>Workflow Pipeline</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How CourseIT Synthesizes Learning
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SpotlightCard className="space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold font-mono text-sm">
              01
            </div>
            <h3 className="text-base font-bold text-white">Input Any Doc or Scan</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Paste a documentation URL from React, Next.js, Rust, Docker, Godot, PyTorch, or any web framework. Or drop an architectural diagram or scanned tutorial page for client-side OCR extraction.
            </p>
          </SpotlightCard>

          <SpotlightCard className="space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-bold font-mono text-sm">
              02
            </div>
            <h3 className="text-base font-bold text-white">Action Extraction</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our multi-tier models filter out introductory fluff, extract core concepts, and construct sequential 5–10 minute bite-sized tasks with time estimates.
            </p>
          </SpotlightCard>

          <SpotlightCard className="space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold font-mono text-sm">
              03
            </div>
            <h3 className="text-base font-bold text-white">Practice & Master</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Follow clean numbered instructions, 1-click copy code examples, track your progress with an interactive checklist, and consult the Scripted Technical Companion.
            </p>
          </SpotlightCard>
        </div>
      </section>

      {/* Multi-Ecosystem Docs Showcase Section */}
      <section className="relative z-10 py-16 border-t border-slate-800/80 bg-slate-950/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 text-xs font-mono mb-2">
                <Boxes className="w-3.5 h-3.5" />
                <span>Multi-Framework Documentation Showcase</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Curated Starter Courses Across Any Ecosystem
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Explore real action-first courses generated from official developer documentation:
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onLaunchApp) onLaunchApp();
                else navigate('/app');
              }}
              className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <span>Explore All in Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {CURATED_DEMOS.map((demo) => {
              const Icon = demo.icon;
              return (
                <div
                  key={demo.id}
                  className="glass-panel p-6 rounded-3xl border border-slate-800/90 hover:border-indigo-500/40 transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 group-hover:scale-105 transition-transform">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">{demo.category}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {demo.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-indigo-200 transition-colors">
                      {demo.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {demo.summary}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-3">
                      <span>{demo.steps} action steps</span>
                      <span>&bull;</span>
                      <span>{demo.time}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (onLaunchApp) onLaunchApp();
                        else navigate('/app');
                      }}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Try Generator</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Model Pricing Tiers */}
      <section className="relative z-10 py-16 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 text-xs font-mono mb-3">
            <Cpu className="w-3.5 h-3.5" />
            <span>Transparent Credit Economy</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            250 Free Credits on Admin Approval
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            Pick the exact reasoning tier you need for each task. Unauthenticated guests can generate 3 free courses with Flash Lite. Approved beta testers unlock all tiers with 250 free credits.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MODEL_PRICING.map((m) => (
            <div
              key={m.tier}
              className="glass-panel p-5 rounded-3xl border border-slate-800/90 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {m.badge}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">{m.speed}</span>
                </div>
                <h4 className="text-sm font-bold text-white">{m.tier}</h4>
                <div className="text-lg font-mono font-extrabold text-indigo-400 my-1">
                  {m.cost}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{m.desc}</p>
              </div>

              <div className={`pt-3 border-t border-slate-800/80 text-[11px] font-mono ${
                m.tier.includes('Flash Lite') ? 'text-emerald-400' : 'text-slate-500'
              }`}>
                {m.trialLabel}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative z-10 py-16 border-t border-slate-800/80 bg-slate-950/80 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Ready to experience action-first documentation?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Create an account today to request 250 free credits upon admin approval, save your generated curricula, and access client-side document OCR.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleOpenAuth('signup')}
              className="px-6 py-3 rounded-2xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              Request Beta Access (250 Credits) &rarr;
            </button>
            <button
              type="button"
              onClick={() => handleOpenAuth('login')}
              className="px-6 py-3 rounded-2xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all cursor-pointer"
            >
              Existing User Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Full Developer Portfolio Footer */}
      <Footer onOpenChangelog={() => setIsChangelogOpen(true)} />

      {/* Modals */}
      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
      />

      <AdminModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        authState={authState}
        onAuthChange={() => {
          setIsAuthModalOpen(false);
          window.location.reload();
        }}
      />

      {/* Interactive Companion Tutor for Public Landing Page */}
      <CourseTutor course={STARTER_COURSES[0]} mode="landing" />

      {/* Accessible Landing Theme Toggle Widget */}
      <button
        type="button"
        onClick={handleToggleTheme}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-xl backdrop-blur-md text-xs font-semibold transition-all cursor-pointer group"
        title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
      >
        {theme === 'light' ? (
          <Sun className="w-4 h-4 text-amber-500" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-400" />
        )}
        <span>Theme: {theme === 'light' ? 'Light' : 'Dark'}</span>
      </button>
    </div>
  );
}
