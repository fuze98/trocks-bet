"use client";

import { useState } from "react";
import { createMarketFromTemplate } from "@/app/admin/actions";

type Template = {
  id: string;
  name: string;
  type: string;
  outcomesFormat: string[];
};

type Match = {
  id: string;
  homeTeam: { name: string } | null;
  awayTeam: { name: string } | null;
};

export function AddMarketFromTemplate({ templates, match }: { templates: Template[], match: Match }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [line, setLine] = useState("");
  const [player, setPlayer] = useState("");

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const formatStr = selectedTemplate?.outcomesFormat.join("") || "";

  const needsLine = formatStr.includes("{line}");
  const needsPlayer = formatStr.includes("{player}");

  return (
    <form action={createMarketFromTemplate} className="space-y-4">
      <input type="hidden" name="matchId" value={match.id} />

      <div>
        <label className="block text-sm text-zinc-400 mb-1">Select Template</label>
        <select
          name="templateId"
          required
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
          className="w-full rounded-md border-0 bg-zinc-900 py-2 px-3 text-white focus:ring-1 focus:ring-green-500"
        >
          <option value="">Choose a template...</option>
          {templates.map(t => (
            <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
          ))}
        </select>
      </div>

      {selectedTemplate && (
        <div className="space-y-3 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
          {needsLine && (
             <div>
               <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase">Line (e.g. -5.5 or 220.5)</label>
               <input
                 type="number"
                 step="0.5"
                 name="line"
                 required
                 value={line}
                 onChange={(e) => setLine(e.target.value)}
                 className="w-full rounded border border-zinc-700 bg-zinc-900 py-1.5 px-2 text-sm text-white focus:ring-1 focus:ring-green-500"
               />
             </div>
          )}
          {needsPlayer && (
             <div>
               <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase">Player Name</label>
               <input
                 type="text"
                 name="player"
                 required
                 value={player}
                 onChange={(e) => setPlayer(e.target.value)}
                 className="w-full rounded border border-zinc-700 bg-zinc-900 py-1.5 px-2 text-sm text-white focus:ring-1 focus:ring-green-500"
               />
             </div>
          )}

          <div className="pt-2">
            <span className="text-xs text-zinc-500 block mb-1">Preview Outcomes:</span>
            <div className="flex flex-wrap gap-2">
              {selectedTemplate.outcomesFormat.map((fmt, i) => {
                let text = fmt;
                text = text.replace("{home}", match.homeTeam?.name || "Home Team");
                text = text.replace("{away}", match.awayTeam?.name || "Away Team");

                const lineNum = Number(line);
                const isSpread = selectedTemplate.name.toLowerCase().includes("spread");

                let lineStr = "{line}";
                if (line) {
                  lineStr = (lineNum > 0 && isSpread) ? `+${lineNum}` : `${lineNum}`;
                }

                let inverseLineStr = "{inverse_line}";
                if (line) {
                  const invLineNum = lineNum * -1;
                  inverseLineStr = (invLineNum > 0) ? `+${invLineNum}` : `${invLineNum}`;
                }

                text = text.replace(/{line}/g, lineStr);
                text = text.replace(/{inverse_line}/g, inverseLineStr);
                text = text.replace(/{player}/g, player || "{player}");

                return (
                  <span key={i} className="text-[10px] font-mono bg-zinc-800 px-2 py-1 rounded text-green-400 border border-zinc-700">{text}</span>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <button type="submit" disabled={!selectedTemplate} className="w-full bg-green-600/20 hover:bg-green-600/30 text-green-500 border border-green-500/50 px-4 py-2 rounded-md text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        Generate Market
      </button>
    </form>
  );
}
