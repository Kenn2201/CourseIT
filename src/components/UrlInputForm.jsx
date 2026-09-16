import React, { useState } from 'react';
import { Sparkles, ArrowRight, Link2, Gamepad2, Layers, Radio, Code2 } from 'lucide-react';

const GODOT_PRESETS = [
  {
    name: 'Your First 2D Game',
    url: 'https://docs.godotengine.org/en/stable/getting_started/first_2d_game/index.html',
    icon: Gamepad2
  },
  {
    name: 'Nodes and Scenes',
    url: 'https://docs.godotengine.org/en/stable/getting_started/step_by_step/nodes_and_scenes.html',
    icon: Layers
  },
  {
    name: 'Signals',
    url: 'https://docs.godotengine.org/en/stable/getting_started/step_by_step/signals.html',
    icon: Radio
  },
  {
    name: 'Scripting Languages',
    url: 'https://docs.godotengine.org/en/stable/getting_started/step_by_step/scripting_languages.html',
    icon: Code2
  }
];

const MODEL_OPTIONS = [
  { id: 'gemini-flash-lite-latest', label: 'Flash Lite (Fastest)', badge: '~0.8s' },
  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Lite', badge: '~0.9s' },
  { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash', badge: 'Balanced' },
  { id: 'gemini-3.7-flash', label: 'Gemini 3.7 Flash', badge: 'High Power' }
];

export default function UrlInputForm({ onSubmit, isLoading }) {
  const [url, setUrl] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-flash-lite-latest');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please enter a documentation URL.');
      return;
    }

    try {
      new URL(trimmed);
    } catch {
      setError('Please enter a valid URL including https://');
      return;
    }

    onSubmit(trimmed, selectedModel);
  };

  const handleSelectPreset = (presetUrl) => {
    setUrl(presetUrl);
    setError('');
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-slate-800">
      <div className="absolute -right-20 -top-20 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label htmlFor="doc-url" className="block text-sm font-medium text-slate-300">
              Paste any documentation URL to convert into actionable steps:
            </label>
            
            {/* Model Selector */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <span className="text-xs text-slate-400 font-mono">Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isLoading}
                className="bg-slate-900 border border-slate-700/80 rounded-lg text-xs font-mono text-indigo-300 px-2.5 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {MODEL_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-slate-900 text-slate-200">
                    {opt.label} ({opt.badge})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Link2 className="w-5 h-5" />
              </div>
              <input
                id="doc-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://docs.godotengine.org/en/stable/..."
                disabled={isLoading}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-indigo-600/40 active:scale-[0.98] cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Course</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {error && (
            <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
        </form>

        {/* Quick-load Godot 4 Presets */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-3">
            <Gamepad2 className="w-4 h-4 text-indigo-400" />
            <span>Try with Godot 4 Documentation Presets:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {GODOT_PRESETS.map((preset) => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectPreset(preset.url)}
                  disabled={isLoading}
                  className="flex items-center gap-2 text-xs py-1.5 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/40 hover:bg-slate-850 transition-colors cursor-pointer"
                >
                  <Icon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
