'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Users, 
  Edit3, 
  LayoutGrid, 
  Plus, 
  Trash2, 
  RefreshCw 
} from 'lucide-react';

const SUPABASE_URL = 'https://tptxwvggixjnvcqoxgmu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwdHh3dmdnaXhqbnZjcW94Z211Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NTE1MjYsImV4cCI6MjEwNjAyNzUyNn0.f04IFwag5I4mwljFDP2qBAOHNW2uMuxMm4MzumzfL4g';

function KittyMascot({ size = 32, className = '' }) {
  return (
    <svg width={size} height={size * 0.85} viewBox="0 0 100 85" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <ellipse cx="50" cy="50" rx="38" ry="30" fill="#FFFFFF" stroke="#4A5568" strokeWidth="4"/>
      <path d="M 22 28 Q 15 8 28 14 Z" fill="#FFFFFF" stroke="#4A5568" strokeWidth="4" strokeLinejoin="round"/>
      <path d="M 72 14 Q 85 8 78 28 Z" fill="#FFFFFF" stroke="#4A5568" strokeWidth="4" strokeLinejoin="round"/>
      <circle cx="72" cy="22" r="6" fill="#F43F5E" stroke="#4A5568" strokeWidth="3"/>
      <ellipse cx="62" cy="18" rx="8" ry="6" transform="rotate(-20 62 18)" fill="#FB7185" stroke="#4A5568" strokeWidth="3"/>
      <ellipse cx="82" cy="26" rx="8" ry="6" transform="rotate(-20 82 26)" fill="#FB7185" stroke="#4A5568" strokeWidth="3"/>
      <ellipse cx="38" cy="50" rx="3.5" ry="5" fill="#1F2937"/>
      <ellipse cx="62" cy="50" rx="3.5" ry="5" fill="#1F2937"/>
      <ellipse cx="50" cy="56" rx="4" ry="2.5" fill="#FBBF24"/>
      <line x1="12" y1="48" x2="26" y2="50" stroke="#4A5568" strokeWidth="3" strokeLinecap="round"/>
      <line x1="14" y1="56" x2="27" y2="55" stroke="#4A5568" strokeWidth="3" strokeLinecap="round"/>
      <line x1="74" y1="50" x2="88" y2="48" stroke="#4A5568" strokeWidth="3" strokeLinecap="round"/>
      <line x1="73" y1="55" x2="86" y2="56" stroke="#4A5568" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

export default function NovelStudio() {
  const [supabase, setSupabase] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [activeScene, setActiveScene] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [selectedChar, setSelectedChar] = useState(null);
  
  const [viewMode, setViewMode] = useState('write');
  const [newCharName, setNewCharName] = useState('');
  const [renameTarget, setRenameTarget] = useState('');
  const [renameNotice, setRenameNotice] = useState('');

  useEffect(() => {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    setSupabase(client);

    async function loadData() {
      const { data: scenesData } = await client
        .from('scenes')
        .select('*')
        .order('order_index', { ascending: true });

      const { data: charsData } = await client
        .from('characters')
        .select('*')
        .order('created_at', { ascending: true });

      if (scenesData && scenesData.length > 0) {
        setScenes(scenesData);
        setActiveScene(scenesData[0]);
      }
      if (charsData) {
        setCharacters(charsData);
        if (charsData.length > 0) {
          setSelectedChar(charsData[0]);
          setRenameTarget(charsData[0].name);
        }
      }
    }

    loadData();
  }, []);

  const totalWords = useMemo(() => {
    return scenes.reduce((acc, scene) => {
      const words = (scene.content || '').trim().split(/\s+/).filter(Boolean).length;
      return acc + words;
    }, 0);
  }, [scenes]);

  const currentSceneWords = useMemo(() => {
    if (!activeScene) return 0;
    return (activeScene.content || '').trim().split(/\s+/).filter(Boolean).length;
  }, [activeScene]);

  async function handleSceneUpdate(fields) {
    if (!activeScene || !supabase) return;
    const updated = { ...activeScene, ...fields };
    setActiveScene(updated);
    setScenes(scenes.map((s) => (s.id === updated.id ? updated : s)));

    await supabase
      .from('scenes')
      .update(fields)
      .eq('id', updated.id);
  }

  async function createScene() {
    if (!supabase) return;
    const newSceneTemplate = {
      title: `Szene ${scenes.length + 1} 🌸`,
      act: 'Akt I',
      content: '',
      status: 'writing',
      notes: '',
      order_index: scenes.length + 1,
    };

    const { data } = await supabase.from('scenes').insert([newSceneTemplate]).select();
    if (data && data[0]) {
      setScenes([...scenes, data[0]]);
      setActiveScene(data[0]);
    }
  }

  async function deleteCurrentScene() {
    if (!activeScene || !supabase) return;
    await supabase.from('scenes').delete().eq('id', activeScene.id);
    const remaining = scenes.filter((s) => s.id !== activeScene.id);
    setScenes(remaining);
    setActiveScene(remaining.length > 0 ? remaining[0] : null);
  }

  async function addCharacter() {
    if (!newCharName.trim() || !supabase) return;
    const newEntry = {
      name: newCharName.trim(),
      role: 'Nebenfigur',
      description: '',
    };

    const { data } = await supabase.from('characters').insert([newEntry]).select();
    if (data && data[0]) {
      setCharacters([...characters, data[0]]);
      setSelectedChar(data[0]);
      setRenameTarget(data[0].name);
      setNewCharName('');
    }
  }

  async function performGlobalRename() {
    if (!selectedChar || !renameTarget.trim() || !supabase) return;
    const oldName = selectedChar.name;
    const newName = renameTarget.trim();

    if (oldName === newName) return;

    const regex = new RegExp(`\\b${oldName}\\b`, 'g');

    const updatedScenes = scenes.map((scene) => {
      const updatedContent = (scene.content || '').replace(regex, newName);
      const updatedTitle = (scene.title || '').replace(regex, newName);
      return { ...scene, content: updatedContent, title: updatedTitle };
    });

    setScenes(updatedScenes);
    if (activeScene) {
      setActiveScene({
        ...activeScene,
        content: (activeScene.content || '').replace(regex, newName),
        title: (activeScene.title || '').replace(regex, newName),
      });
    }

    for (const scene of updatedScenes) {
      await supabase
        .from('scenes')
        .update({ content: scene.content, title: scene.title })
        .eq('id', scene.id);
    }

    await supabase
      .from('characters')
      .update({ name: newName })
      .eq('id', selectedChar.id);

    const updatedChars = characters.map((c) =>
      c.id === selectedChar.id ? { ...c, name: newName } : c
    );
    setCharacters(updatedChars);
    setSelectedChar({ ...selectedChar, name: newName });

    setRenameNotice(`„${oldName}“ überall durch „${newName}“ ersetzt.`);
    setTimeout(() => setRenameNotice(''), 4000);
  }

  const characterSnippets = useMemo(() => {
    if (!selectedChar || !activeScene?.content) return [];
    const name = selectedChar.name;
    const sentences = activeScene.content.split(/[.!?]+/);
    return sentences
      .filter((s) => new RegExp(`\\b${name}\\b`, 'i').test(s))
      .map((s) => s.trim())
      .filter(Boolean);
  }, [selectedChar, activeScene]);

  return (
    <div className="studio-container">
      {/* 1. Linke Leiste: Manuskript-Gliederung */}
      <aside className="sidebar-left">
        <div className="brand-header">
          <KittyMascot size={34} />
          <div>
            <div className="brand-title">Novel Studio</div>
            <div style={{ fontSize: '0.75rem', color: '#be185d' }}>Autoren-Suite 🎀</div>
          </div>
        </div>

        <div className="progress-box">
          <div className="progress-text">
            <span>🎯 Fortschritt</span>
            <span>{totalWords.toLocaleString('de-DE')} / 50.000</span>
          </div>
          <div className="progress-bar-bg">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${Math.min(100, (totalWords / 50000) * 100)}%` }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#9d174d' }}>📖 MANUSKRIPT</span>
          <button 
            onClick={createScene}
            style={{ background: 'none', border: 'none', color: '#db2777', cursor: 'pointer', padding: '2px' }}
            title="Szene anlegen"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="scenes-tree">
          {scenes.map((scene, idx) => (
            <div
              key={scene.id}
              className={`scene-item ${activeScene?.id === scene.id ? 'active' : ''}`}
              onClick={() => setActiveScene(scene)}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {scene.title || `Szene ${idx + 1}`}
              </span>
              <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                {(scene.content || '').trim().split(/\s+/).filter(Boolean).length} W.
              </span>
            </div>
          ))}
        </div>
      </aside>

      {/* 2. Mittlere Leiste: Editor / Plot-Board */}
      <main className="editor-center">
        <div className="editor-toolbar">
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'write' ? 'active' : ''}`}
              onClick={() => setViewMode('write')}
            >
              <Edit3 size={15} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
              Schreiben
            </button>
            <button
              className={`toggle-btn ${viewMode === 'plot' ? 'active' : ''}`}
              onClick={() => setViewMode('plot')}
            >
              <LayoutGrid size={15} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
              Plot-Board
            </button>
          </div>

          {activeScene && (
            <button 
              onClick={deleteCurrentScene}
              style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' }}
              title="Szene löschen"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>

        {viewMode === 'write' ? (
          activeScene ? (
            <>
              <input
                type="text"
                className="scene-title-input"
                value={activeScene.title || ''}
                onChange={(e) => handleSceneUpdate({ title: e.target.value })}
                placeholder="Szenentitel..."
              />
              <textarea
                className="writing-area"
                value={activeScene.content || ''}
                onChange={(e) => handleSceneUpdate({ content: e.target.value })}
                placeholder="Hier beginnt Ihre Geschichte... ✨"
              />
              <div className="watermark">
                <KittyMascot size={120} />
              </div>
              <div className="editor-status-bar">
                <span>⏱️ Lesezeit: ~{Math.ceil(currentSceneWords / 200)} Min.</span>
                <span>📊 {currentSceneWords} Wörter in dieser Szene</span>
              </div>
            </>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', color: '#9ca3af' }}>
              <KittyMascot size={64} style={{ marginBottom: '8px' }} />
              <p>Wählen Sie links eine Szene aus oder erstellen Sie eine neue.</p>
            </div>
          )
        ) : (
          <div className="board-grid">
            {scenes.map((s, i) => (
              <div 
                key={s.id} 
                className={`board-card ${activeScene?.id === s.id ? 'active' : ''}`}
                onClick={() => { setActiveScene(s); setViewMode('write'); }}
              >
                <div style={{ fontWeight: '700', color: '#be185d' }}>{s.title || `Szene ${i + 1}`}</div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  {s.content ? `${s.content.slice(0, 90)}...` : 'Noch kein Inhalt verfasst.'}
                </div>
                <div style={{ marginTop: 'auto', fontSize: '0.75rem', color: '#db2777', fontWeight: '600' }}>
                  {(s.content || '').trim().split(/\s+/).filter(Boolean).length} Wörter
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 3. Rechte Leiste: Charakter-Zentrale & Refactoring */}
      <aside className="sidebar-right">
        <div className="section-title">
          <Users size={18} />
          Charakter-Zentrale 🐱
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            type="text"
            className="input-sm"
            placeholder="Neuer Name..."
            value={newCharName}
            onChange={(e) => setNewCharName(e.target.value)}
          />
          <button className="btn-pink" onClick={addCharacter}>
            <Plus size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {characters.map((char) => {
            const occurrences = activeScene?.content
              ? (activeScene.content.match(new RegExp(`\\b${char.name}\\b`, 'gi')) || []).length
              : 0;

            return (
              <div
                key={char.id}
                className="character-card"
                style={{
                  border: selectedChar?.id === char.id ? '2px solid #ec4899' : '1px solid #fce7f3',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setSelectedChar(char);
                  setRenameTarget(char.name);
                }}
              >
                <div className="character-header">
                  <span style={{ fontWeight: '700', color: '#374151' }}>{char.name}</span>
                  <span className="badge-occurrences">
                    {occurrences} in Szene
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {selectedChar && (
          <div className="rename-box">
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#9d174d' }}>
              🎀 Global umbenennen:
            </div>
            <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>
              Ersetzt <strong>{selectedChar.name}</strong> im gesamten Buch.
            </div>
            <input
              type="text"
              className="input-sm"
              value={renameTarget}
              onChange={(e) => setRenameTarget(e.target.value)}
              placeholder="Neuer Name..."
            />
            <button className="btn-pink" onClick={performGlobalRename}>
              <RefreshCw size={14} /> Namen überall ersetzen
            </button>
            {renameNotice && (
              <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '600' }}>
                {renameNotice}
              </div>
            )}
          </div>
        )}

        {selectedChar && characterSnippets.length > 0 && (
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#9d174d', marginBottom: '6px' }}>
              🔍 Zitate in dieser Szene:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {characterSnippets.map((snippet, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #fce7f3',
                    padding: '8px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    color: '#4b5563',
                    fontStyle: 'italic',
                  }}
                >
                  „{snippet}“
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
