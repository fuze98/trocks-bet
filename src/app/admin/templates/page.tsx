import { prisma } from "@/lib/prisma";
import { createMarketTemplate, deleteMarketTemplate } from "../actions";

export default async function TemplatesAdmin() {
  const templates = await prisma.marketTemplate.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-6">Market Templates</h1>
        <p className="text-zinc-400 mb-8">
          Create templates for common markets (like Moneyline or Spreads) to quickly add them to matches with default limits.
        </p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-4">Create New Template</h2>
          <form action={createMarketTemplate} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-zinc-400 mb-1">Template Name (e.g. NBA Spread)</label>
              <input type="text" name="name" required className="w-full rounded-md border-0 bg-zinc-950 py-2 px-3 text-white focus:ring-1 focus:ring-green-500" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-zinc-400 mb-1">Market Type Grouping</label>
              <select name="type" required className="w-full rounded-md border-0 bg-zinc-950 py-2 px-3 text-white focus:ring-1 focus:ring-green-500">
                <option value="Moneyline">Moneyline</option>
                <option value="Spread">Spread</option>
                <option value="Total (Over/Under)">Total (Over/Under)</option>
                <option value="Props">Props</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-zinc-400 mb-1">Default User Limit ($)</label>
              <input type="number" step="0.01" name="defaultUserLimit" placeholder="Optional" className="w-full rounded-md border-0 bg-zinc-950 py-2 px-3 text-white focus:ring-1 focus:ring-green-500" />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-zinc-400 mb-1">Default Total Limit ($)</label>
              <input type="number" step="0.01" name="defaultTotalLimit" placeholder="Optional" className="w-full rounded-md border-0 bg-zinc-950 py-2 px-3 text-white focus:ring-1 focus:ring-green-500" />
            </div>
            <div className="flex items-center gap-2 mb-2 w-full md:w-auto">
              <input type="checkbox" id="singles" name="allowOnlySingles" className="rounded bg-zinc-950 border-zinc-700 text-green-500 focus:ring-green-500" />
              <label htmlFor="singles" className="text-sm text-zinc-300 whitespace-nowrap">Singles Only</label>
            </div>
            <button type="submit" className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-md font-bold h-[40px] transition-colors">
              Create
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <div key={template.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{template.name}</h3>
                  <span className="inline-block bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded mt-1">{template.type}</span>
                </div>
                <form action={deleteMarketTemplate.bind(null, template.id)}>
                  <button type="submit" className="text-red-500 hover:text-red-400 p-1 bg-red-500/10 rounded transition-colors" title="Delete Template">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </form>
              </div>

              <div className="space-y-2 mt-4 pt-4 border-t border-zinc-800/50">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Default User Limit:</span>
                  <span className="text-zinc-300 font-mono">{template.defaultUserLimit ? `$${template.defaultUserLimit}` : 'None'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Default Total Limit:</span>
                  <span className="text-zinc-300 font-mono">{template.defaultTotalLimit ? `$${template.defaultTotalLimit}` : 'None'}</span>
                </div>
                {template.allowOnlySingles && (
                  <div className="inline-block bg-yellow-500/20 text-yellow-500 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-bold mt-2">
                    Singles Only
                  </div>
                )}
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <div className="col-span-full text-center p-8 bg-zinc-900 border border-zinc-800 rounded-xl">
              <p className="text-zinc-500">No templates created yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
