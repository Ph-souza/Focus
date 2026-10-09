const fs = require('fs');
const filepath = 'c:/Users/phillipe.pimenta/.gemini/antigravity-ide/scratch/Focus/src/components/TabProjetos.tsx';
let content = fs.readFileSync(filepath, 'utf8');
let lines = content.split('\n');

const startTag = '<section className="hidden lg:grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">';
const endTag = '        </aside>';

let startIdx = lines.findIndex(l => l.includes(startTag));
let endIdx = lines.findIndex((l, i) => i > startIdx && l.includes(endTag)) + 1;

if (startIdx === -1 || endIdx === 0) {
  console.error('Could not find section 5 bounds');
  process.exit(1);
}

let detailsLines = lines.slice(startIdx, endIdx + 1);

detailsLines[0] = '      <section className={`${isMobile ? "flex flex-col gap-4 scale-[0.97] origin-top p-1" : "hidden lg:grid grid-cols-1 lg:grid-cols-12 gap-6"} pt-2`}>';

for (let i=0; i<detailsLines.length; i++) {
  if (detailsLines[i].includes('<article className="lg:col-span-8 glass-card p-5 sm:p-6 flex flex-col justify-between shadow-sm min-h-[550px]">')) {
    detailsLines[i] = detailsLines[i].replace(
      '<article className="lg:col-span-8 glass-card p-5 sm:p-6 flex flex-col justify-between shadow-sm min-h-[550px]">',
      '<article className={`${isMobile ? "p-4" : "lg:col-span-8 p-5 sm:p-6"} glass-card flex flex-col justify-between shadow-sm min-h-[550px]`}>'
    );
  }
  if (detailsLines[i].includes('<aside className="lg:col-span-4 flex flex-col gap-4">')) {
    detailsLines[i] = detailsLines[i].replace(
      '<aside className="lg:col-span-4 flex flex-col gap-4">',
      '<aside className={`${isMobile ? "flex flex-col gap-3" : "lg:col-span-4 flex flex-col gap-4"}`}>'
    );
  }
}

let detailsJSX = '  const renderProjectDetails = (isMobile = false) => (\n' + detailsLines.join('\n') + '\n  );\n';

lines.splice(startIdx, (endIdx + 1) - startIdx, '      {/* Desktop view now uses the function */}\n      {renderProjectDetails(false)}');

let returnIdx = lines.findIndex(l => l.trim() === 'return (');
lines.splice(returnIdx, 0, detailsJSX);

let accStart = lines.findIndex(l => l.includes('<div className="p-4 mt-2 mb-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-blue-500/30 shadow-inner">'));
let accEnd = lines.findIndex((l, i) => i > accStart && l.includes('</motion.div>')) - 1;

if (accStart !== -1) {
  lines.splice(accStart, (accEnd + 1) - accStart, '                  <div className="mt-2 mb-4 overflow-hidden rounded-2xl border border-blue-500/20 bg-slate-50/50 dark:bg-slate-900/30 shadow-inner">\n                    {renderProjectDetails(true)}\n                  </div>');
}

fs.writeFileSync(filepath, lines.join('\n'), 'utf8');
console.log('Refactoring complete!');
