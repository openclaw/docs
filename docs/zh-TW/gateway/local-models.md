---
read_when:
    - 你想從自己的 GPU 主機提供模型服務
    - 你正在連接 LM Studio 或 OpenAI 相容代理
    - 您需要最安全的本機模型指南
summary: 在本機 LLM 上執行 OpenClaw（LM Studio、vLLM、LiteLLM、自訂 OpenAI 端點）
title: 本機模型
x-i18n:
    generated_at: "2026-05-10T19:36:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83a5667aa5bef697a890b0d8b6b8f5e4de56fa3cdcdfe5a5dbb826a62b64fbcf
    source_path: gateway/local-models.md
    workflow: 16
---

本機模型是可行的。它們也會提高硬體、脈絡大小和提示注入防禦的門檻 — 小型或激進量化的顯卡會截斷脈絡並降低安全性。本頁是針對較高階本機堆疊和自訂 OpenAI 相容本機伺服器的立場明確指南。若要最低阻力的入門流程，請從 [LM Studio](/zh-TW/providers/lmstudio) 或 [Ollama](/zh-TW/providers/ollama) 和 `openclaw onboard` 開始。

對於只應在所選模型需要時才啟動的本機伺服器，請參閱
[本機模型服務](/zh-TW/gateway/local-model-services)。

## 硬體底線

目標要高：**≥2 台頂規 Mac Studio 或等效 GPU 機器（約 $30k+）**，才能有舒適的 agent 迴圈。單張 **24 GB** GPU 只適合較輕量的提示，且延遲較高。請一律執行**你能承載的最大 / 完整大小變體**；小型或高度量化的 checkpoint 會提高提示注入風險（請參閱[安全性](/zh-TW/gateway/security)）。

## 選擇後端

| 後端                                                 | 使用時機                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [LM Studio](/zh-TW/providers/lmstudio)                     | 首次本機設定、GUI 載入器、原生 Responses API                                |
| [Ollama](/zh-TW/providers/ollama)                          | CLI 工作流程、模型程式庫、免看管的 systemd 服務                              |
| MLX / vLLM / SGLang                                  | 透過 OpenAI 相容 HTTP 端點進行高吞吐量自託管服務                             |
| LiteLLM / OAI-proxy / 自訂 OpenAI 相容代理           | 你在另一個模型 API 前面做代理，且需要 OpenClaw 將它視為 OpenAI               |

後端支援時請使用 Responses API（`api: "openai-responses"`）（LM Studio 支援）。否則請維持使用 Chat Completions（`api: "openai-completions"`）。

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA 使用者：** 官方 Ollama Linux 安裝程式會啟用帶有 `Restart=always` 的 systemd 服務。在 WSL2 GPU 設定中，自動啟動可能會在開機期間重新載入上一個模型並占住主機記憶體。如果你的 WSL2 VM 在啟用 Ollama 後反覆重新啟動，請參閱 [WSL2 當機迴圈](/zh-TW/providers/ollama#wsl2-crash-loop-repeated-reboots)。
</Warning>

## 建議：LM Studio + 大型本機模型（Responses API）

目前最佳的本機堆疊。在 LM Studio 中載入大型模型（例如完整大小的 Qwen、DeepSeek 或 Llama 建置），啟用本機伺服器（預設 `http://127.0.0.1:1234`），並使用 Responses API 將推理與最終文字分離。

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/my-local-model": { alias: "Local" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**設定檢查清單**

- 安裝 LM Studio：[https://lmstudio.ai](https://lmstudio.ai)
- 在 LM Studio 中下載**可用的最大模型建置**（避免「small」/高度量化變體），啟動伺服器，確認 `http://127.0.0.1:1234/v1/models` 會列出它。
- 將 `my-local-model` 替換成 LM Studio 中顯示的實際模型 ID。
- 保持模型已載入；冷載入會增加啟動延遲。
- 如果你的 LM Studio 建置不同，請調整 `contextWindow`/`maxTokens`。
- 對 WhatsApp，請維持使用 Responses API，這樣只會送出最終文字。

即使執行本機模型，也請保留託管模型設定；使用 `models.mode: "merge"`，讓 fallback 保持可用。

### 混合設定：託管模型為主，本機為 fallback

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### 本機優先，託管模型作為安全網

交換 primary 和 fallback 的順序；保留相同的 providers 區塊和 `models.mode: "merge"`，這樣當本機機器離線時，你可以 fallback 到 Sonnet 或 Opus。

### 區域託管 / 資料路由

- 託管的 MiniMax/Kimi/GLM 變體也存在於 OpenRouter，並提供區域釘選端點（例如美國託管）。在那裡選擇區域變體，即可在仍使用 `models.mode: "merge"` 取得 Anthropic/OpenAI fallback 的同時，將流量保留在你選擇的司法管轄區。
- 純本機仍是隱私性最強的路徑；當你需要供應商功能但想控制資料流時，託管區域路由是折衷方案。

## 其他 OpenAI 相容本機代理

MLX（`mlx_lm.server`）、vLLM、SGLang、LiteLLM、OAI-proxy 或自訂
Gateway 只要公開 OpenAI 風格的 `/v1/chat/completions`
端點即可運作。除非後端明確記載支援 `/v1/responses`，
否則請使用 Chat Completions adapter。將上方 provider 區塊替換為你的
端點和模型 ID：

```json5
{
  agents: {
    defaults: {
      model: { primary: "local/my-local-model" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

如果在帶有 `baseUrl` 的自訂 provider 上省略 `api`，OpenClaw 預設使用
`openai-completions`。像 `127.0.0.1` 這類 loopback 端點會自動受信任；
LAN、tailnet 和 private DNS 端點仍需要
`request.allowPrivateNetwork: true`。

`models.providers.<id>.models[].id` 值是 provider 本機範圍。請勿
在此包含 provider 前綴。例如，以
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` 啟動的 MLX 伺服器應使用以下
catalog id 和模型 ref：

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

在本機或代理的視覺模型上設定 `input: ["text", "image"]`，讓圖片
附件能注入 agent turn。互動式自訂 provider
onboarding 會推斷常見的視覺模型 ID，並只詢問未知名稱。
非互動式 onboarding 使用相同推斷；未知視覺 ID 請使用 `--custom-image-input`，
已知外觀但在你的端點後方僅支援文字的模型則使用 `--custom-text-input`。

保留 `models.mode: "merge"`，讓託管模型仍可作為 fallback。
在提高 `agents.defaults.timeoutSeconds` 前，請先針對緩慢的本機或遠端模型
伺服器使用 `models.providers.<id>.timeoutSeconds`。provider timeout
只套用於模型 HTTP 請求，包含連線、標頭、body 串流，
以及總體 guarded-fetch 中止。

<Note>
對於自訂 OpenAI 相容 provider，當 `baseUrl` 解析為 loopback、private LAN、`.local` 或裸 hostname 時，允許保存非機密的本機標記，例如 `apiKey: "ollama-local"`。OpenClaw 會將它視為有效的本機憑證，而不是回報缺少金鑰。任何接受公開 hostname 的 provider 都請使用真實值。
</Note>

本機/代理 `/v1` 後端的行為注意事項：

- OpenClaw 會將這些視為代理風格的 OpenAI 相容路由，而不是原生
  OpenAI 端點
- 原生 OpenAI 專用請求塑形不會套用於此：沒有
  `service_tier`、沒有 Responses `store`、沒有 OpenAI 推理相容 payload
  塑形，也沒有 prompt-cache 提示
- 隱藏的 OpenClaw attribution 標頭（`originator`、`version`、`User-Agent`）
  不會注入到這些自訂代理 URL

較嚴格 OpenAI 相容後端的相容性注意事項：

- 有些伺服器在 Chat Completions 上只接受字串 `messages[].content`，
  不接受結構化 content-part 陣列。對這些端點設定
  `models.providers.<provider>.models[].compat.requiresStringContent: true`。
- 有些本機模型會以文字輸出獨立的方括號工具請求，例如
  `[tool_name]` 後接 JSON 和 `[END_TOOL_REQUEST]`。OpenClaw 只有在名稱完全符合該 turn
  已註冊工具時，才會將它們提升為真正的工具呼叫；否則該區塊會被視為不支援的文字，並且
  從使用者可見的回覆中隱藏。
- 如果模型輸出看起來像工具呼叫的 JSON、XML 或 ReAct 風格文字，
  但 provider 沒有輸出結構化 invocation，OpenClaw 會將它保留為
  文字，並在可用時以 run id、provider/model、偵測到的模式和
  工具名稱記錄警告。請將其視為 provider/model 工具呼叫
  不相容，而不是已完成的工具執行。
- 如果工具以 assistant 文字形式出現而不是執行，例如原始 JSON、
  XML、ReAct 語法，或 provider 回應中的空 `tool_calls` 陣列，
  請先確認伺服器正在使用支援工具呼叫的聊天範本/剖析器。對於
  剖析器只有在強制工具使用時才有效的 OpenAI 相容 Chat Completions 後端，
  請設定每模型請求覆寫，而不是依賴文字
  剖析：

  ```json5
  {
    agents: {
      defaults: {
        models: {
          "local/my-local-model": {
            params: {
              extra_body: {
                tool_choice: "required",
              },
            },
          },
        },
      },
    },
  }
  ```

  只在每個一般 turn 都應呼叫工具的模型/工作階段中使用此設定。
  它會覆寫 OpenClaw 預設代理值 `tool_choice: "auto"`。
  將 `local/my-local-model` 替換為
  `openclaw models list` 顯示的確切 provider/model ref。

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- 如果自訂 OpenAI 相容模型接受超出
  內建 profile 的 OpenAI 推理強度，請在模型 compat 區塊上宣告它們。在這裡加入 `"xhigh"`
  會讓 `/think xhigh`、工作階段選擇器、Gateway 驗證和 `llm-task`
  驗證為該已設定的 provider/model ref 公開此層級：

  ```json5
  {
    models: {
      providers: {
        local: {
          baseUrl: "http://127.0.0.1:8000/v1",
          apiKey: "sk-local",
          api: "openai-responses",
          models: [
            {
              id: "gpt-5.4",
              name: "GPT 5.4 via local proxy",
              reasoning: true,
              input: ["text"],
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
              contextWindow: 196608,
              maxTokens: 8192,
              compat: {
                supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
                reasoningEffortMap: { xhigh: "xhigh" },
              },
            },
          ],
        },
      },
    },
  }
  ```

## 較小或較嚴格的後端

如果模型能正常載入，但完整代理回合表現異常，請由上而下處理 — 先確認傳輸，再縮小範圍。

1. **確認本機模型本身會回應。** 不使用工具，不帶代理內容：

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **確認 Gateway 路由。** 只傳送提供的提示 — 跳過轉錄、AGENTS 啟動程序、內容引擎組裝、工具，以及內建 MCP 伺服器，但仍會測試 Gateway 路由、驗證與提供者選擇：

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **嘗試精簡模式。** 如果兩個探測都通過，但實際代理回合因工具呼叫格式錯誤或提示過大而失敗，請啟用 `agents.defaults.experimental.localModelLean: true`。這會移除三個最重的預設工具（`browser`、`cron`、`message`），讓提示形狀更小且較不脆弱。完整說明、適用時機，以及如何確認它已開啟，請參閱[實驗性功能 → 本機模型精簡模式](/zh-TW/concepts/experimental-features#local-model-lean-mode)。

4. **最後手段是完全停用工具。** 如果精簡模式仍不足，請為該模型項目設定 `models.providers.<provider>.models[].compat.supportsTools: false`。之後代理會在該模型上不使用工具呼叫運作。

5. **再往後，瓶頸就在上游。** 如果後端在精簡模式和 `supportsTools: false` 之後，仍只會在較大型的 OpenClaw 執行中失敗，剩下的問題通常是上游模型或伺服器容量 — 內容視窗、GPU 記憶體、kv-cache 淘汰，或後端錯誤。到這一步時，問題已不是 OpenClaw 的傳輸層。

## 疑難排解

- Gateway 能連到代理嗎？`curl http://127.0.0.1:1234/v1/models`。
- LM Studio 模型已卸載？請重新載入；冷啟動是常見的「卡住」原因。
- 本機伺服器顯示 `terminated`、`ECONNRESET`，或在回合中途關閉串流？
  OpenClaw 會在診斷中記錄低基數的 `model.call.error.failureKind`，以及
  OpenClaw 程序的 RSS/heap 快照。對於 LM Studio/Ollama
  記憶體壓力，請將該時間戳與伺服器記錄或 macOS crash /
  jetsam 記錄比對，以確認模型伺服器是否被終止。
- OpenClaw 會根據偵測到的模型視窗推導內容視窗預檢閾值；若 `agents.defaults.contextTokens` 降低了有效視窗，則會根據未設上限的模型視窗推導。低於 20% 且以 **8k** 為下限時會發出警告。硬性阻擋使用 10% 閾值，且以 **4k** 為下限，並限制在有效內容視窗內，避免過大的模型中繼資料拒絕原本有效的使用者上限。如果遇到該預檢，請提高伺服器/模型內容限制，或選擇更大的模型。
- 內容錯誤？降低 `contextWindow`，或提高你的伺服器限制。
- OpenAI 相容伺服器回傳 `messages[].content ... expected a string`？
  請在該模型項目加入 `compat.requiresStringContent: true`。
- OpenAI 相容伺服器回傳 `validation.keys`，或表示訊息項目只允許 `role` 和 `content`？
  請在該模型項目加入 `compat.strictMessageKeys: true`。
- 直接的小型 `/v1/chat/completions` 呼叫可運作，但 `openclaw infer model run --local`
  在 Gemma 或其他本機模型上失敗？請先檢查提供者 URL、模型參照、驗證
  標記，以及伺服器記錄；本機 `model run` 不包含代理工具。
  如果本機 `model run` 成功，但較大的代理回合失敗，請使用
  `localModelLean` 或 `compat.supportsTools: false` 縮減代理
  工具範圍。
- 工具呼叫顯示為原始 JSON/XML/ReAct 文字，或提供者回傳
  空的 `tool_calls` 陣列？不要加入會盲目將助理
  文字轉成工具執行的代理。請先修正伺服器聊天範本/剖析器。如果
  模型只有在強制使用工具時才可運作，請加入上方的逐模型
  `params.extra_body.tool_choice: "required"` 覆寫，並且只在預期每個回合都會有工具呼叫的工作階段使用該模型
  項目。
- 安全性：本機模型會跳過提供者端篩選；請保持代理範圍精簡並開啟 Compaction，以限制提示注入的影響範圍。

## 相關

- [設定參考](/zh-TW/gateway/configuration-reference)
- [模型容錯移轉](/zh-TW/concepts/model-failover)
