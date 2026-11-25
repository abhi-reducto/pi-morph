/**
 * Single-line colored footer component for Pi when a Morph model is active.
 *
 * Matches the styling of pi-better-devin-auth: colored cwd/branch/session line
 * followed by a single stats row with colored token counts, cache hit rate,
 * session cost, context usage, and model / thinking level.
 */

import { homedir } from "node:os";
import { isAbsolute, relative, resolve, sep } from "node:path";
import type { AssistantMessage } from "@earendil-works/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

type StatusColor =
  | "accent"
  | "dim"
  | "muted"
  | "text"
  | "success"
  | "warning"
  | "error"
  | "syntaxKeyword"
  | "syntaxFunction"
  | "syntaxNumber"
  | "syntaxString"
  | "thinkingOff"
  | "thinkingMinimal"
  | "thinkingLow"
  | "thinkingMedium"
  | "thinkingHigh"
  | "thinkingXhigh"
  | "thinkingMax";

interface StatusTheme {
  fg(color: StatusColor, text: string): string;
  bold(text: string): string;
}

interface SessionFooterStats {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  cost: number;
  latestCacheHitRate?: number;
  contextPercent: number | null;
  contextWindow: number;
}

interface FooterRightMeta {
  provider?: string;
  modelId: string;
  thinkingLevel?: string;
  showProvider: boolean;
}

const THINKING_COLOR: Readonly<Record<string, StatusColor>> = {
  off: "thinkingOff",
  minimal: "thinkingMinimal",
  low: "thinkingLow",
  medium: "thinkingMedium",
  high: "thinkingHigh",
  xhigh: "thinkingXhigh",
  max: "thinkingMax",
};

function formatTokens(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 10_000) return `${(count / 1000).toFixed(1)}k`;
  if (count < 1_000_000) return `${Math.round(count / 1000)}k`;
  if (count < 10_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  return `${Math.round(count / 1_000_000)}M`;
}

function contextTone(usedPercent: number): "success" | "warning" | "error" {
  if (usedPercent > 85) return "error";
  if (usedPercent > 65) return "warning";
  return "success";
}

function formatCwd(cwd: string): string {
  const home = process.env.HOME || process.env.USERPROFILE || homedir();
  if (!home) return cwd;
  const resolvedCwd = resolve(cwd);
  const resolvedHome = resolve(home);
  const rel = relative(resolvedHome, resolvedCwd);
  const inside = rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
  if (!inside) return cwd;
  return rel === "" ? "~" : `~${sep}${rel}`;
}

function sanitizeStatus(text: string): string {
  return text.replace(/[\r\n\t]/g, " ").replace(/ +/g, " ").trim();
}

function collectSessionStats(ctx: ExtensionContext): SessionFooterStats {
  let input = 0;
  let output = 0;
  let cacheRead = 0;
  let cacheWrite = 0;
  let cost = 0;
  let latestCacheHitRate: number | undefined;

  for (const entry of ctx.sessionManager.getEntries()) {
    if (entry.type !== "message" || entry.message.role !== "assistant") continue;
    const msg = entry.message as AssistantMessage;
    const u = msg.usage;
    if (!u) continue;
    input += u.input ?? 0;
    output += u.output ?? 0;
    cacheRead += u.cacheRead ?? 0;
    cacheWrite += u.cacheWrite ?? 0;
    cost += u.cost?.total ?? 0;

    const promptTotal = (u.input ?? 0) + (u.cacheRead ?? 0) + (u.cacheWrite ?? 0);
    if (promptTotal > 0 && ((u.cacheRead ?? 0) > 0 || (u.cacheWrite ?? 0) > 0)) {
      latestCacheHitRate = ((u.cacheRead ?? 0) / promptTotal) * 100;
    }
  }

  const contextUsage = ctx.getContextUsage();
  const contextWindow = contextUsage?.contextWindow ?? ctx.model?.contextWindow ?? 0;
  const contextPercent = contextUsage?.percent ?? null;

  return {
    input,
    output,
    cacheRead,
    cacheWrite,
    cost,
    latestCacheHitRate,
    contextPercent,
    contextWindow,
  };
}

function formatStatsLeft(stats: SessionFooterStats, theme: StatusTheme): string {
  const parts: string[] = [];

  if (stats.input) parts.push(theme.fg("syntaxFunction", `↑${formatTokens(stats.input)}`));
  if (stats.output) parts.push(theme.fg("syntaxKeyword", `↓${formatTokens(stats.output)}`));
  if (stats.cacheRead) parts.push(theme.fg("accent", `R${formatTokens(stats.cacheRead)}`));
  if (stats.cacheWrite) parts.push(theme.fg("warning", `W${formatTokens(stats.cacheWrite)}`));

  if ((stats.cacheRead > 0 || stats.cacheWrite > 0) && stats.latestCacheHitRate !== undefined) {
    const chTone: StatusColor =
      stats.latestCacheHitRate >= 80 ? "success" : stats.latestCacheHitRate >= 50 ? "warning" : "muted";
    parts.push(theme.fg(chTone, `CH${stats.latestCacheHitRate.toFixed(1)}%`));
  }

  if (stats.cost > 0) {
    parts.push(theme.fg("syntaxNumber", `$${stats.cost.toFixed(3)}`));
  }

  const ctxLabel =
    stats.contextPercent !== null
      ? `${stats.contextPercent.toFixed(1)}%/${formatTokens(stats.contextWindow)}`
      : `?/${formatTokens(stats.contextWindow)}`;
  const ctxColor: StatusColor = stats.contextPercent !== null ? contextTone(stats.contextPercent) : "muted";
  parts.push(theme.fg(ctxColor, ctxLabel));

  return parts.join(" ");
}

function formatModelRight(meta: FooterRightMeta, theme: StatusTheme): string {
  const pieces: string[] = [];
  if (meta.showProvider && meta.provider) {
    pieces.push(theme.fg("muted", `(${meta.provider})`));
  }
  pieces.push(theme.bold(theme.fg("accent", meta.modelId)));
  if (meta.thinkingLevel) {
    const color = THINKING_COLOR[meta.thinkingLevel] ?? "muted";
    const label = meta.thinkingLevel === "off" ? "thinking off" : meta.thinkingLevel;
    pieces.push(theme.fg("dim", "•"));
    pieces.push(theme.fg(color, label));
  }
  return pieces.join(" ");
}

export function installMorphFooter(
  pi: ExtensionAPI,
  ctx: ExtensionContext,
): { requestRender: () => void } {
  let rerender: (() => void) | undefined;

  ctx.ui.setFooter((tui, theme, footerData) => {
    rerender = () => tui.requestRender();
    const unsub = footerData.onBranchChange(() => tui.requestRender());
    const statusTheme = theme as unknown as StatusTheme;

    return {
      dispose() {
        unsub();
        rerender = undefined;
      },
      invalidate() {},
      render(width: number): string[] {
        // Line 1: cwd + git branch + session name
        const branch = footerData.getGitBranch();
        const sessionName = ctx.sessionManager.getSessionName();
        const headerParts = [statusTheme.fg("muted", formatCwd(ctx.cwd))];
        if (branch) headerParts.push(statusTheme.fg("syntaxKeyword", `(${branch})`));
        if (sessionName) {
          headerParts.push(statusTheme.fg("dim", "•"));
          headerParts.push(statusTheme.fg("accent", sessionName));
        }
        const pwdLine = truncateToWidth(headerParts.join(" "), width, statusTheme.fg("dim", "..."));

        // Line 2: colored token stats + model/thinking on one line
        const stats = collectSessionStats(ctx);
        const thinkingLevel = ctx.model?.reasoning ? pi.getThinkingLevel() : undefined;
        const showProvider = footerData.getAvailableProviderCount() > 1 && Boolean(ctx.model);
        const rightMeta: FooterRightMeta = {
          provider: ctx.model?.provider,
          modelId: ctx.model?.id || "no-model",
          thinkingLevel,
          showProvider,
        };

        const minPadding = 2;
        const left = formatStatsLeft(stats, statusTheme);
        let right = formatModelRight(rightMeta, statusTheme);

        if (showProvider && visibleWidth(left) + minPadding + visibleWidth(right) > width) {
          right = formatModelRight({ ...rightMeta, showProvider: false }, statusTheme);
        }

        const leftWidth = visibleWidth(left);
        const rightWidth = visibleWidth(right);
        let statsLine: string;

        if (leftWidth + minPadding + rightWidth <= width) {
          const pad = " ".repeat(width - leftWidth - rightWidth);
          statsLine = left + pad + right;
        } else {
          const availRight = width - leftWidth - minPadding;
          if (availRight > 0) {
            const truncRight = truncateToWidth(right, availRight, "");
            const pad = " ".repeat(Math.max(0, width - leftWidth - visibleWidth(truncRight)));
            statsLine = left + pad + truncRight;
          } else {
            statsLine = truncateToWidth(left, width, statusTheme.fg("dim", "..."));
          }
        }

        const lines = [pwdLine, statsLine];

        // Preserve any other extensions' setStatus() entries
        const extStatuses = footerData.getExtensionStatuses();
        if (extStatuses.size > 0) {
          const joined = Array.from(extStatuses.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, text]) => sanitizeStatus(text))
            .filter(Boolean)
            .join(" ");
          if (joined) lines.push(truncateToWidth(joined, width, statusTheme.fg("dim", "...")));
        }

        return lines;
      },
    };
  });

  return {
    requestRender: () => rerender?.(),
  };
}
