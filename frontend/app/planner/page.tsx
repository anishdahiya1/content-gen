"use client";

import { useState, useEffect } from 'react';
import { LayoutDashboardIcon, PlusIcon, TrashIcon, VideoIcon, SparklesIcon, Loader2Icon } from '../components/Icons';

type ColumnType = 'ideas' | 'scripting' | 'ready' | 'published';

interface Card {
  id: string;
  title: string;
  column: ColumnType;
}

export default function PlannerPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBrainstorming, setIsBrainstorming] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('kanban_cards');
    if (saved) {
      setCards(JSON.parse(saved));
    } else {
      // Default demo cards
      setCards([
        { id: '1', title: 'Hidden iPhone Tricks #Shorts', column: 'published' },
        { id: '2', title: 'Why I left Big Tech', column: 'ready' },
        { id: '3', title: 'Day in the life of a Creator', column: 'scripting' },
        { id: '4', title: 'Top 5 AI Tools (Trends)', column: 'ideas' },
      ]);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('kanban_cards', JSON.stringify(cards));
    }
  }, [cards, isLoaded]);

  const addCard = (column: ColumnType) => {
    const title = prompt("Enter content idea:");
    if (!title) return;
    const newCard: Card = { id: Date.now().toString(), title, column };
    setCards([...cards, newCard]);
  };

  const handleMagicBrainstorm = async () => {
    setIsBrainstorming(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/trends/analyze?region=Global&niche=Content Creation');
      if (res.ok) {
        const data = await res.json();
        const newCards = data.trends.map((t: any, i: number) => ({
          id: Date.now().toString() + i,
          title: t.topic,
          column: 'ideas' as ColumnType
        }));
        setCards([...cards, ...newCards]);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to brainstorm ideas");
    } finally {
      setIsBrainstorming(false);
    }
  };

  const deleteCard = (id: string) => {
    if(confirm("Delete this card?")) {
      setCards(cards.filter(c => c.id !== id));
    }
  };

  // Drag and Drop handlers
  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('card_id', id);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // allow drop
  };

  const onDrop = (e: React.DragEvent, column: ColumnType) => {
    const id = e.dataTransfer.getData('card_id');
    setCards(cards.map(c => c.id === id ? { ...c, column } : c));
  };

  const columns: { id: ColumnType, title: string, color: string }[] = [
    { id: 'ideas', title: 'Content Ideas', color: 'bg-[var(--background)] border-zinc-900' },
    { id: 'scripting', title: 'Scripting', color: 'bg-[var(--panel)] border-[var(--border)]' },
    { id: 'ready', title: 'Ready to Publish', color: 'bg-[var(--panel)]/80 border-zinc-700' },
    { id: 'published', title: 'Published', color: 'bg-white/5 border-zinc-600' },
  ];

  if (!isLoaded) return null;

  return (
    <div className="flex flex-col h-full bg-[var(--background)] text-zinc-200">
      <header className="h-16 shrink-0 bg-black/40 backdrop-blur-md border-b border-white/[0.05] flex items-center px-6 gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
          <LayoutDashboardIcon className="w-4 h-4 text-[var(--foreground)]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[var(--foreground)] tracking-tight">Social Media Content Planner</h1>
          <p className="text-[11px] text-[var(--muted)] font-medium">Kanban Workflow</p>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-x-auto">
        <div className="flex gap-6 h-full min-w-max">
          
          {columns.map(col => (
            <div 
              key={col.id}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, col.id)}
              className={`w-80 flex flex-col rounded-2xl border ${col.color} overflow-hidden`}
            >
              <div className="p-4 border-b border-inherit bg-black/40 flex justify-between items-center">
                <h3 className="font-bold text-zinc-100 text-sm">{col.title}</h3>
                <span className="bg-white/10 text-xs font-bold px-2 py-0.5 rounded-full text-zinc-300">
                  {cards.filter(c => c.column === col.id).length}
                </span>
              </div>
              
              <div className="flex-1 p-3 overflow-y-auto space-y-3">
                {cards.filter(c => c.column === col.id).map(card => (
                  <div 
                    key={card.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, card.id)}
                    className="bg-black border border-[var(--border)]/80 p-4 rounded-xl shadow-lg cursor-grab active:cursor-grabbing hover:border-zinc-500 transition-colors group"
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium text-[var(--foreground)]">{card.title}</p>
                      <button onClick={() => deleteCard(card.id)} className="opacity-0 group-hover:opacity-100 text-[var(--muted)] hover:text-red-400 transition-opacity">
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] text-[var(--muted)] font-medium uppercase tracking-wider">
                      <VideoIcon className="w-3 h-3" /> Short Form
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-black/40 flex flex-col gap-2">
                <button 
                  onClick={() => addCard(col.id)}
                  className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-[var(--border)]"
                >
                  <PlusIcon className="w-4 h-4" /> Add Idea
                </button>
                {col.id === 'ideas' && (
                  <button 
                    onClick={handleMagicBrainstorm}
                    disabled={isBrainstorming}
                    className="w-full py-2 flex items-center justify-center gap-2 text-sm font-bold text-black bg-white hover:bg-zinc-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isBrainstorming ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <SparklesIcon className="w-4 h-4" />}
                    Magic Brainstorm
                  </button>
                )}
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}
