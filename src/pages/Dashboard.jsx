import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Sparkles, Search, Layers, AlertCircle, RefreshCw } from 'lucide-react';
import UrlInputForm from '../components/UrlInputForm';
import LoadingPipeline from '../components/LoadingPipeline';
import CourseCard from '../components/CourseCard';
import { listCourses, saveLocalCourse } from '../lib/appwrite';

export default function Dashboard() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [generateError, setGenerateError] = useState('');

  const loadCourses = async () => {
    setLoadingCourses(true);
    try {
      const data = await listCourses();
      setCourses(data);
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleGenerate = async (url, model) => {
    setIsGenerating(true);
    setGenerateError('');

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, model })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate course.');
      }

      const newCourse = data.course;
      // Save to local fallback cache as well
      saveLocalCourse(newCourse);

      // Refresh list and navigate to the newly generated course
      await loadCourses();
      navigate(`/course/${newCourse.$id}`);
    } catch (err) {
      console.error('Generation failed:', err);
      setGenerateError(err.message || 'An unexpected error occurred while processing the documentation.');
      setIsGenerating(false);
    }
  };

  const filteredCourses = courses.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      (c.title || '').toLowerCase().includes(q) ||
      (c.source_url || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Header */}
      <section className="relative pt-12 pb-8 sm:pt-16 sm:pb-12 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono mb-6">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Not a chat UI • Structured step-by-step paths</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
              Turn dense documentation into{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-300 to-emerald-400">
                action-first learning paths.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Built specifically for smaller attention spans. Paste any docs page to extract clean content with Mozilla Readability and generate numbered, fluff-free steps.
            </p>
          </div>

          {/* Generator Input or Live Loading Pipeline */}
          <div className="mt-10 max-w-3xl mx-auto">
            {isGenerating ? (
              <LoadingPipeline />
            ) : (
              <UrlInputForm onSubmit={handleGenerate} isLoading={isGenerating} />
            )}

            {generateError && (
              <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-sm">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Generation Failed</p>
                  <p className="text-rose-400/90 text-xs mt-0.5">{generateError}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Courses Dashboard Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Generated Courses
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {courses.length} learning {courses.length === 1 ? 'path' : 'paths'} available
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={loadCourses}
              disabled={loadingCourses}
              title="Refresh courses"
              className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loadingCourses ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="mt-8">
          {loadingCourses && courses.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-panel rounded-2xl p-6 h-48 animate-pulse border border-slate-800" />
              ))}
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <CourseCard key={course.$id} course={course} />
              ))}
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800 max-w-lg mx-auto">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white">No courses found</h3>
              <p className="text-sm text-slate-400 mt-1 mb-6">
                {searchQuery
                  ? 'No learning paths matched your search query.'
                  : 'Paste a documentation URL above to generate your first structured learning path.'}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
