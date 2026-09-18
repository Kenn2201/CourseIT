import React, { useEffect, useState } from 'react';
import { authenticatedFetch } from '../lib/auth';

export default function SourceImagePreview({ course }) {
  const [objectUrl, setObjectUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => () => { if (objectUrl) URL.revokeObjectURL(objectUrl); }, [objectUrl]);
  if (!course?.source_file_id) return null;

  const loadImage = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authenticatedFetch(`/api/courses/${encodeURIComponent(course.$id)}/source`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Original image is unavailable.');
      }
      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) throw new Error('The source response was not an image.');
      setObjectUrl(URL.createObjectURL(blob));
    } catch (err) { setError(err.message || 'Could not load the original image.'); }
    finally { setLoading(false); }
  };

  return <div className="space-y-2 text-xs text-slate-400">
    <p>Original source image: {course.source_filename || 'Uploaded scan'}</p>
    {!objectUrl && <button type="button" disabled={loading} onClick={loadImage}
      className="rounded-lg border border-indigo-500/40 px-3 py-1.5 text-indigo-300 hover:bg-indigo-500/10 disabled:opacity-50">
      {loading ? 'Loading image…' : 'Preview original image'}
    </button>}
    {error && <p role="alert" className="text-rose-300">{error}</p>}
    {objectUrl && <div><img src={objectUrl} alt={`Original source for ${course.title}`} className="max-h-80 max-w-full rounded-xl border border-slate-700 object-contain" />
      <button type="button" onClick={() => setObjectUrl(null)} className="mt-2 text-slate-400 hover:text-white">Hide image</button></div>}
  </div>;
}
