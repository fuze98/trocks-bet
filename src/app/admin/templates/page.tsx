import { prisma } from "@/lib/prisma";
import { createTemplate, deleteTemplate } from "./actions";

export default async function TemplatesAdmin() {
  const templates = await prisma.marketTemplate.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Market Templates</h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Create Template</h2>
        <form action={createTemplate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Template Name (e.g., Spread)</label>
              <input name="name" required className="w-full rounded bg-zinc-800 border-0 text-white p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Market Type (e.g., Spread, Total, Moneyline)</label>
              <input name="type" required className="w-full rounded bg-zinc-800 border-0 text-white p-2" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Outcomes Format (Comma separated)
            </label>
            <p className="text-xs text-zinc-500 mb-2">Available placeholders: {"{home}"}, {"{away}"}, {"{player}"}, {"{line}"}, {"{inverse_line}"}</p>
            <input
              name="outcomesFormat"
              required
              placeholder="{home} {line}, {away} {inverse_line}"
              className="w-full rounded bg-zinc-800 border-0 text-white p-2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Default User Limit ($)</label>
              <input name="defaultUserLimit" type="number" step="0.01" className="w-full rounded bg-zinc-800 border-0 text-white p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Default Total Market Limit ($)</label>
              <input name="defaultTotalLimit" type="number" step="0.01" className="w-full rounded bg-zinc-800 border-0 text-white p-2" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" name="allowOnlySingles" id="allowOnlySingles" className="bg-zinc-800 border-zinc-700 rounded text-green-500" />
            <label htmlFor="allowOnlySingles" className="text-sm font-medium text-zinc-400">Allow Only Singles (No Parlays)</label>
          </div>

          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white rounded px-4 py-2 font-medium text-sm">
            Save Template
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {templates.map(template => (
          <div key={template.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-white text-lg">{template.name} <span className="text-sm font-normal text-zinc-500">({template.type})</span></h3>
              <div className="text-sm text-zinc-400 mt-1">
                Outcomes: {template.outcomesFormat.join(" | ")}
              </div>
              <div className="flex gap-4 mt-2 text-xs text-zinc-500 font-mono">
                {template.defaultUserLimit && <span>User Max: ${template.defaultUserLimit}</span>}
                {template.defaultTotalLimit && <span>Market Max: ${template.defaultTotalLimit}</span>}
                {template.allowOnlySingles && <span className="text-yellow-500 uppercase">Singles Only</span>}
              </div>
            </div>
            <form action={deleteTemplate.bind(null, template.id)}>
              <button type="submit" className="text-red-500 hover:text-red-400 text-sm">Delete</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
