import React, { useState } from 'react';

interface AddRepoFormProps {
  onAdd: (owner: string, name: string) => Promise<void>;
}

export function AddRepoForm({ onAdd }: AddRepoFormProps) {
  const [owner, setOwner] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!owner.trim() || !name.trim()) return;
    
    setLoading(true);
    try {
      await onAdd(owner.trim(), name.trim());
      setOwner('');
      setName('');
    } catch (error) {
      alert(`Failed to add repo: ${error}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Add Repository</h2>
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Owner (e.g., octocat)"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          className="flex-1 px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <input
          type="text"
          placeholder="Repository name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add'}
        </button>
      </div>
    </form>
  );
}
