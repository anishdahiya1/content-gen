import os, re

def refactor(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original = content

    # Navigation / Headers
    content = content.replace('bg-black border-b border-zinc-900', 'bg-black/40 backdrop-blur-md border-b border-white/[0.05]')
    
    # Cards / Panels (replacing flat zinc backgrounds with glass-panel)
    content = content.replace('bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl', 'glass-panel p-6')
    content = content.replace('bg-zinc-950 border border-zinc-800 rounded-2xl p-6', 'glass-panel p-6')
    content = content.replace('bg-zinc-950 border border-zinc-800 rounded-xl', 'glass-panel')
    content = content.replace('bg-black border border-zinc-800 rounded-3xl p-8', 'glass-panel p-8')
    content = content.replace('bg-zinc-950 rounded-3xl border border-zinc-800 p-6 shadow-2xl', 'glass-panel p-6')
    
    # Smaller cards/panels
    content = content.replace('bg-zinc-950 border border-zinc-800', 'glass-panel')
    content = content.replace('bg-black border border-zinc-800 rounded-2xl', 'glass-panel')
    content = content.replace('bg-black border border-zinc-800 rounded-xl', 'glass-panel')
    
    # Inner elements (subtle differences)
    content = content.replace('bg-zinc-900 border border-zinc-800', 'bg-white/[0.03] border border-white/[0.05]')
    content = content.replace('bg-zinc-900 px-3 py-1', 'bg-white/[0.03] border border-white/[0.05] px-3 py-1')

    # Update app wrappers
    content = content.replace('bg-black text-zinc-200', 'premium-bg text-zinc-200')
    content = content.replace('bg-black text-zinc-100', 'premium-bg text-zinc-100')
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
            print(f"Refactored {filepath}")

for root, _, files in os.walk('c:/Users/Anish/Desktop/content/frontend/app'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            refactor(os.path.join(root, file))
