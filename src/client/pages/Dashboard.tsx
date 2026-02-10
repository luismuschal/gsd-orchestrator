import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { RepoCard } from '../components/RepoCard';
import { AddRepoForm } from '../components/AddRepoForm';

interface Repo {
  id: string;
  owner: string;
  name: string;
  addedAt: number;
  lastPolledAt?: number;
}

export default function Dashboard() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  
  const loadRepos = async () => {
    try {
      const data = await api.getRepos();
      setRepos(data);
    } catch (error) {
      console.error('Failed to load repos:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadRepos();
  }, []);
  
  const handleAddRepo = async (owner: string, name: string) => {
    await api.addRepo(owner, name);
    await loadRepos();
  };
  
  const handleRemoveRepo = async (id: string) => {
    if (!confirm(`Remove ${id}?`)) return;
    await api.removeRepo(id);
    await loadRepos();
  };
  
  return (
    <div>
      <AddRepoForm onAdd={handleAddRepo} />
      
      {loading ? (
        <p className="text-gray-600">Loading repositories...</p>
      ) : repos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No repositories tracked yet</p>
          <p className="text-gray-500 text-sm mt-2">Add a repository above to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {repos.map((repo) => (
            <RepoCard
              key={repo.id}
              repo={repo}
              onRemove={() => handleRemoveRepo(repo.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
