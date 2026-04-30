---
read_when:
    - 你想從自己的 GPU 主機提供模型服務
    - 你正在串接 LM Studio 或 OpenAI 相容的代理伺服器
    - 你需要最安全的本機模型指引
summary: 在本機大型語言模型上執行 OpenClaw（LM Studio、vLLM、LiteLLM、自訂 OpenAI 端點）
title: 本機模型
x-i18n:
    generated_at: "2026-04-30T09:35:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 283da11a7896c670d3a249eeb957a252cbda7f7457bd814bb0796f3ca9956723
    source_path: gateway/local-models.md
    workflow: 16
---

本機可行，但 OpenClaw 預期需要大型上下文，以及強力的提示注入防護。小型顯示卡會截斷上下文並削弱安全性。目標拉高：**≥2 台滿配 Mac Studio 或同等 GPU 設備（約 $30k+）**。單張 **24 GB** GPU 只適合較輕量提示，且延遲較高。請使用**你能執行的最大型／完整尺寸模型變體**；高度量化或「小型」檢查點會提高提示注入風險（請參閱[安全性](/zh-TW/gateway/security)）。

如果你想要最省事的本機設定，請從 [LM Studio](/zh-TW/providers/lmstudio) 或 [Ollama](/zh-TW/providers/ollama) 和 `openclaw onboard` 開始。本頁是針對較高階本機堆疊與自訂 OpenAI 相容本機伺服器的主觀指南。

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA 使用者：** 官方 Ollama Linux 安裝程式會啟用帶有 `Restart=always` 的 systemd 服務。在 WSL2 GPU 設定中，自動啟動可能會在開機期間重新載入上一個模型，並佔住主機記憶體。如果你的 WSL2 VM 在啟用 Ollama 後反覆重新啟動，請參閱 [WSL2 當機循環](/zh-TW/providers/ollama#wsl2-crash-loop-repeated-reboots)。
</Warning>

## 建議：LM Studio + 大型本機模型（Responses API）

目前最佳的本機堆疊。在 LM Studio 中載入大型模型（例如完整尺寸的 Qwen、DeepSeek 或 Llama 建置），啟用本機伺服器（預設 `http://127.0.0.1:1234`），並使用 Responses API，讓推理與最終文字分離。

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
- 在 LM Studio 中，下載**可用的最大模型建置**（避免「小型」／重度量化變體），啟動伺服器，確認 `http://127.0.0.1:1234/v1/models` 會列出它。
- 將 `my-local-model` 替換為 LM Studio 中顯示的實際模型 ID。
- 讓模型保持載入；冷載入會增加啟動延遲。
- 如果你的 LM Studio 建置不同，請調整 `contextWindow`/`maxTokens`。
- 對 WhatsApp，請維持使用 Responses API，這樣只會傳送最終文字。

即使執行本機模型，也請保持託管模型設定；使用 `models.mode: "merge"` 讓備援保持可用。

### 混合設定：託管為主要，本機為備援

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

### 本機優先並搭配託管安全網

交換主要與備援順序；保留相同的 providers 區塊和 `models.mode: "merge"`，這樣當本機機器停機時，就能備援到 Sonnet 或 Opus。

### 區域託管／資料路由

- 託管的 MiniMax/Kimi/GLM 變體也存在於 OpenRouter，並提供區域釘選端點（例如美國託管）。在那裡選擇區域變體，可將流量保留在你選擇的司法管轄區內，同時仍使用 `models.mode: "merge"` 作為 Anthropic/OpenAI 的備援。
- 純本機仍是最強的隱私路徑；當你需要供應商功能但想控制資料流時，託管區域路由是折衷選擇。

## 其他 OpenAI 相容本機代理

MLX (`mlx_lm.server`)、vLLM、SGLang、LiteLLM、OAI-proxy 或自訂
gateways 都可運作，只要它們公開 OpenAI 風格的 `/v1/chat/completions`
端點即可。除非後端明確記錄支援 `/v1/responses`，否則請使用 Chat Completions 配接器。將上方的 provider 區塊替換為你的
端點與模型 ID：

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

如果在帶有 `baseUrl` 的自訂 provider 上省略 `api`，OpenClaw 會預設為
`openai-completions`。像 `127.0.0.1` 這類 local loopback 端點會自動受到信任；LAN、tailnet 和私人 DNS 端點仍需要
`request.allowPrivateNetwork: true`。

`models.providers.<id>.models[].id` 值是 provider 本機範圍。請勿在那裡
包含 provider 前綴。例如，以
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` 啟動的 MLX 伺服器應使用此
目錄 ID 與模型參照：

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

在本機或代理的視覺模型上設定 `input: ["text", "image"]`，讓圖片
附件被注入 agent 回合。互動式自訂 provider
onboarding 會推斷常見視覺模型 ID，並只詢問未知名稱。
非互動式 onboarding 使用相同推斷；未知視覺 ID 請使用 `--custom-image-input`，
或當看起來已知的模型在你的端點後方其實僅支援文字時，使用 `--custom-text-input`。

保持 `models.mode: "merge"`，讓託管模型維持可作為備援。
對較慢的本機或遠端模型伺服器，請先使用 `models.providers.<id>.timeoutSeconds`，再提高 `agents.defaults.timeoutSeconds`。provider 逾時
只套用於模型 HTTP 請求，包括連線、標頭、主體串流，
以及總 guarded-fetch 中止。

<Note>
對於自訂 OpenAI 相容 providers，當 `baseUrl` 解析到 local loopback、私人 LAN、`.local` 或裸主機名稱時，允許保存像 `apiKey: "ollama-local"` 這類非秘密本機標記。OpenClaw 會將它視為有效的本機憑證，而不是回報缺少金鑰。對任何接受公開主機名稱的 provider，請使用真實值。
</Note>

本機／代理 `/v1` 後端的行為備註：

- OpenClaw 會將這些視為代理風格的 OpenAI 相容路由，而非原生
  OpenAI 端點
- 原生 OpenAI 專用請求塑形不會在此套用：沒有
  `service_tier`、沒有 Responses `store`、沒有 OpenAI 推理相容酬載
  塑形，也沒有提示快取提示
- 隱藏的 OpenClaw 歸因標頭（`originator`、`version`、`User-Agent`）
  不會注入這些自訂代理 URL

較嚴格 OpenAI 相容後端的相容性備註：

- 有些伺服器在 Chat Completions 上只接受字串 `messages[].content`，
  不接受結構化 content-part 陣列。對這些
  端點設定 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
- 有些本機模型會以文字形式發出獨立的括號工具請求，例如
  `[tool_name]` 後接 JSON 和 `[END_TOOL_REQUEST]`。只有當名稱精確符合該回合註冊的
  工具時，OpenClaw 才會將它們提升為真正的工具呼叫；否則該區塊會被視為不受支援文字，並從使用者可見回覆中隱藏。
- 如果模型發出看起來像工具呼叫的 JSON、XML 或 ReAct 風格文字，
  但 provider 沒有發出結構化呼叫，OpenClaw 會將它保留為
  文字，並記錄警告，包含 run id、provider/model、偵測到的模式，以及
  可用時的工具名稱。請將它視為 provider/model 工具呼叫
  不相容，而不是已完成的工具執行。
- 如果工具以 assistant 文字形式出現而不是執行，例如原始 JSON、
  XML、ReAct 語法，或 provider 回應中的空 `tool_calls` 陣列，
  請先確認伺服器使用的是支援工具呼叫的聊天範本／剖析器。對於
  剖析器只有在強制使用工具時才可運作的 OpenAI 相容 Chat Completions 後端，請設定每模型請求覆寫，而不是依賴文字
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

  僅在每個一般回合都應呼叫工具的模型／工作階段中使用此設定。
  它會覆寫 OpenClaw 預設代理值 `tool_choice: "auto"`。
  將 `local/my-local-model` 替換為
  `openclaw models list` 顯示的精確 provider/model 參照。

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- 如果自訂 OpenAI 相容模型接受超出內建設定檔的 OpenAI 推理強度，
  請在模型 compat 區塊中宣告它們。在此加入 `"xhigh"`
  會讓 `/think xhigh`、工作階段選擇器、Gateway 驗證和 `llm-task`
  驗證針對該已設定的 provider/model 參照公開此層級：

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

- 某些較小或較嚴格的本機後端在 OpenClaw 的完整
  agent-runtime 提示形狀下不穩定，尤其是包含工具 schema 時。請先
  使用精簡本機探測來驗證 provider 路徑：

  ```bash
  openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  若要在不使用完整 agent 提示形狀的情況下驗證 Gateway 路由，請改用
  Gateway 模型探測：

  ```bash
  openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  本機和 Gateway 模型探測都只會傳送提供的提示。Gateway
  探測仍會驗證 Gateway 路由、驗證和 provider 選擇，
  但它會刻意略過先前的工作階段逐字稿、AGENTS/bootstrap 上下文、
  context-engine 組裝、工具和隨附的 MCP 伺服器。

  如果成功但一般 OpenClaw 代理程式輪次失敗，請先嘗試
  `agents.defaults.experimental.localModelLean: true`，以移除重量級
  預設工具，例如 `browser`、`cron` 和 `message`；這是實驗性
  旗標，不是穩定的預設模式設定。請參閱
  [實驗性功能](/zh-TW/concepts/experimental-features)。如果仍然失敗，請嘗試
  `models.providers.<provider>.models[].compat.supportsTools: false`。

- 如果後端仍然只在較大型的 OpenClaw 執行中失敗，剩下的問題
  通常是上游模型/伺服器容量或後端錯誤，而不是 OpenClaw 的
  傳輸層。

## 疑難排解

- Gateway 能連到代理嗎？`curl http://127.0.0.1:1234/v1/models`。
- LM Studio 模型未載入？重新載入；冷啟動是常見的「卡住」原因。
- 本機伺服器顯示 `terminated`、`ECONNRESET`，或在輪次中途關閉串流？
  OpenClaw 會在診斷中記錄低基數的 `model.call.error.failureKind`，以及
  OpenClaw 行程的 RSS/heap 快照。對於 LM Studio/Ollama
  記憶體壓力，請將該時間戳與伺服器日誌或 macOS 當機 /
  jetsam 日誌比對，以確認模型伺服器是否遭到終止。
- OpenClaw 會從偵測到的模型視窗，或在 `agents.defaults.contextTokens` 降低有效視窗時從未設上限的模型視窗，推導 context-window 前置檢查閾值。低於 20% 時會警告，且設有 **8k** 下限。硬性阻擋使用 10% 閾值，且設有 **4k** 下限，並以有效內容脈絡視窗為上限，因此過大的模型中繼資料不會拒絕原本有效的使用者上限。如果觸發該前置檢查，請提高伺服器/模型內容脈絡限制，或選擇較大的模型。
- 內容脈絡錯誤？降低 `contextWindow` 或提高伺服器限制。
- OpenAI 相容伺服器回傳 `messages[].content ... expected a string`？
  在該模型項目加入 `compat.requiresStringContent: true`。
- 直接的小型 `/v1/chat/completions` 呼叫可運作，但 `openclaw infer model run --local`
  在 Gemma 或其他本機模型上失敗？請先檢查供應商 URL、模型參照、驗證
  標記和伺服器日誌；本機 `model run` 不包含代理程式工具。
  如果本機 `model run` 成功但較大型的代理程式輪次失敗，請使用
  `localModelLean` 或 `compat.supportsTools: false` 減少代理程式
  工具表面。
- 工具呼叫顯示為原始 JSON/XML/ReAct 文字，或供應商回傳
  空的 `tool_calls` 陣列？不要加入會盲目把助理
  文字轉成工具執行的代理。請先修正伺服器聊天範本/解析器。如果
  模型只有在強制使用工具時才能運作，請加入上述每個模型的
  `params.extra_body.tool_choice: "required"` 覆寫，並且只在預期每個輪次都會呼叫工具的工作階段中使用該模型
  項目。
- 安全性：本機模型會略過供應商端篩選器；請保持代理程式範圍狹窄並啟用 Compaction，以限制提示注入的影響範圍。

## 相關

- [設定參考](/zh-TW/gateway/configuration-reference)
- [模型容錯移轉](/zh-TW/concepts/model-failover)
