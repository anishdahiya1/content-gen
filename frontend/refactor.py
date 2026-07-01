import re

def refactor_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace arbitrary hex colors with tailwind zinc equivalents
    content = content.replace('bg-[#070a12]', 'bg-black')
    content = content.replace('bg-[#0a0d14]', 'bg-zinc-950')
    content = content.replace('bg-[#0b0e17]', 'bg-zinc-950')
    content = content.replace('bg-[#080b12]', 'bg-black')
    content = content.replace('bg-[#131825]', 'bg-zinc-900')
    content = content.replace('bg-[#04060b]', 'bg-black')
    content = content.replace('bg-[#0d121f]', 'bg-zinc-900')
    
    # Replace slate colors with zinc colors
    content = re.sub(r'slate-(\d+)', r'zinc-\1', content)
    content = content.replace('zinc-850', 'zinc-800')

    # Replace sky/cyan/blue gradients and backgrounds with white/black/zinc
    content = re.sub(r'bg-gradient-to-[a-z]+\s+from-sky-[0-9]+\s+via-cyan-[0-9]+\s+to-blue-[0-9]+', 'bg-white', content)
    content = re.sub(r'bg-gradient-to-[a-z]+\s+from-indigo-[0-9]+\s+to-violet-[0-9]+', 'bg-zinc-900', content)
    content = content.replace('bg-sky-600', 'bg-white')
    content = content.replace('text-sky-400', 'text-white')
    content = content.replace('text-sky-300', 'text-zinc-300')
    content = content.replace('text-cyan-400', 'text-white')
    content = content.replace('text-indigo-400', 'text-white')
    content = content.replace('text-indigo-300', 'text-zinc-300')
    content = content.replace('text-indigo-500', 'text-zinc-400')
    content = content.replace('bg-indigo-600', 'bg-white')
    content = content.replace('bg-indigo-500', 'bg-zinc-200')
    
    # Text colors
    content = content.replace('text-white', 'text-white')
    
    # Remove animate-float
    content = content.replace('animate-float', '')
    
    # Update button classes
    content = content.replace('hover:bg-sky-500', 'hover:bg-zinc-200 text-black')
    content = content.replace('hover:bg-indigo-500', 'hover:bg-zinc-200 text-black')
    
    # Update some specific borders
    content = content.replace('border-sky-500/50', 'border-zinc-500/50')
    content = content.replace('border-indigo-500/50', 'border-zinc-500/50')
    
    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

refactor_file('c:\\Users\\Anish\\Desktop\\content\\frontend\\app\\workspace\\page.tsx')
