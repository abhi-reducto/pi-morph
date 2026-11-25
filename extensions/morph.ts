/**
 * Morph provider extension — enables `/login morph` and registers Morph's
 * OpenAI-compatible chat models.
 */

import { createProvider, envApiKeyAuth, openAICompletionsApi } from "@earendil-works/pi-ai/compat";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const THINKING_LEVEL_MAP = {
  off: "none",
  minimal: "low",
  low: "low",
  medium: "high",
  high: "xhigh",
  xhigh: "max",
  max: "max",
} as const;

function chat(model: {
  id: string;
  name: string;
  input: ("text" | "image")[];
  contextWindow: number;
  maxTokens: number;
  cost: { input: number; output: number; cacheRead: number };
  reasoning?: boolean;
}) {
  return {
    id: model.id,
    name: model.name,
    provider: "morph",
    api: "openai-completions" as const,
    baseUrl: "https://api.morphllm.com/v1",
    reasoning: model.reasoning ?? true,
    input: model.input,
    contextWindow: model.contextWindow,
    maxTokens: model.maxTokens,
    cost: {
      input: model.cost.input,
      output: model.cost.output,
      cacheRead: model.cost.cacheRead,
      cacheWrite: 0,
    },
    thinkingLevelMap: THINKING_LEVEL_MAP,
    compat: {
      supportsStore: false,
      supportsReasoningEffort: true,
      maxTokensField: "max_tokens" as const,
    },
  };
}

export default function (pi: ExtensionAPI) {
  pi.registerProvider(
    createProvider({
      id: "morph",
      name: "Morph",
      baseUrl: "https://api.morphllm.com/v1",
      auth: {
        apiKey: envApiKeyAuth("Morph API key", ["MORPH_API_KEY"]),
      },
      models: [
        chat({
          id: "morph-kimik3-abliterated",
          name: "Morph Kimi K3.1 Pro Abliterated",
          input: ["text"],
          contextWindow: 1048576,
          maxTokens: 131072,
          cost: { input: 5, output: 28, cacheRead: 0.58 },
        }),
        chat({
          id: "morph-dsv41flash-abliterated",
          name: "Morph DeepSeek V4.1 Flash Abliterated",
          input: ["text", "image"],
          contextWindow: 1048576,
          maxTokens: 131072,
          cost: { input: 0.3, output: 1.2, cacheRead: 0.03 },
        }),
        chat({
          id: "morph-kimik31",
          name: "Morph Kimi K3.1 Pro",
          input: ["text", "image"],
          contextWindow: 1048576,
          maxTokens: 131072,
          cost: { input: 2.5, output: 14, cacheRead: 0.29 },
        }),
        chat({
          id: "morph-kimik3",
          name: "Morph Kimi K3",
          input: ["text", "image"],
          contextWindow: 1048576,
          maxTokens: 131072,
          cost: { input: 2.5, output: 14, cacheRead: 0.29 },
        }),
        chat({
          id: "morph-glm53-744b",
          name: "Morph GLM-5.3 744B",
          input: ["text"],
          contextWindow: 1048576,
          maxTokens: 131072,
          cost: { input: 1.19, output: 6, cacheRead: 0.1955 },
        }),
        chat({
          id: "morph-glm52-744b",
          name: "Morph GLM-5.2 744B",
          input: ["text"],
          contextWindow: 1048576,
          maxTokens: 131072,
          cost: { input: 1.19, output: 6, cacheRead: 0.1955 },
        }),
        chat({
          id: "morph-glm53flash",
          name: "Morph GLM-5.3-Flash",
          input: ["text", "image"],
          contextWindow: 1048576,
          maxTokens: 131072,
          cost: { input: 0.2, output: 0.7, cacheRead: 0.04 },
        }),
        chat({
          id: "morph-dsv41flash",
          name: "Morph DeepSeek V4.1 Flash",
          input: ["text", "image"],
          contextWindow: 1048576,
          maxTokens: 131072,
          cost: { input: 0.12, output: 0.8, cacheRead: 0.008 },
        }),
        chat({
          id: "morph-dsv41flash-1017",
          name: "Morph DeepSeek V4.1 Flash 1017",
          input: ["text", "image"],
          contextWindow: 1048576,
          maxTokens: 131072,
          cost: { input: 0.12, output: 0.8, cacheRead: 0.008 },
        }),
        chat({
          id: "morph-dsv4flash",
          name: "Morph DeepSeek V4 Flash",
          input: ["text"],
          contextWindow: 1048576,
          maxTokens: 131072,
          cost: { input: 0.141953125, output: 0.399625, cacheRead: 0.0359375 },
        }),
        chat({
          id: "morph-kimik3-fast",
          name: "Morph Kimi K3 Fast",
          input: ["text", "image"],
          contextWindow: 1048576,
          maxTokens: 131072,
          cost: { input: 6, output: 22.5, cacheRead: 0.6 },
        }),
      ],
      api: openAICompletionsApi(),
    }),
  );
}
