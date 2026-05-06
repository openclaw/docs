---
read_when:
    - 你想從自己的 GPU 主機提供模型服務
    - 你正在連接 LM Studio 或 OpenAI 相容代理
    - 你需要最安全的本機模型指引
summary: 在本機 LLM 上執行 OpenClaw（LM Studio、vLLM、LiteLLM、自訂 OpenAI 端點）
title: 本機模型
x-i18n:
    generated_at: "2026-05-06T09:09:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: cf0a1f960c5d0bd93eebb49e10db1066c305b2bc64401eb5000bf559f7e62349
    source_path: gateway/local-models.md
    workflow: 16
---

本機模型是可行的。它們也提高了硬體、上下文大小與提示注入防禦的門檻；小型或激進量化的卡會截斷上下文並造成安全性外洩。本頁是針對較高階本機堆疊與自訂 OpenAI 相容本機伺服器的主觀指南。若要最低摩擦的入門流程，請從 [LM Studio](/zh-TW/providers/lmstudio) 或 [Ollama](/zh-TW/providers/ollama) 與 `openclaw onboard` 開始。

## 硬體下限

目標要高：**≥2 台滿配 Mac Studios 或等效的 GPU 裝置（約 $30k+）**，才能有舒適的代理迴圈。單張 **24 GB** GPU 只適用於較輕量的提示，且延遲較高。務必執行**你能託管的最大／完整大小變體**；小型或高度量化的檢查點會提高提示注入風險（請參閱[安全性](/zh-TW/gateway/security)）。

## 選擇後端

| 後端                                                 | 適用情境                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [LM Studio](/zh-TW/providers/lmstudio)                     | 首次本機設定、GUI 載入器、原生 Responses API                                |
| [Ollama](/zh-TW/providers/ollama)                          | CLI 工作流程、模型庫、免維護的 systemd 服務                                  |
| MLX / vLLM / SGLang                                  | 具備 OpenAI 相容 HTTP 端點的高吞吐量自託管服務                               |
| LiteLLM / OAI-proxy / 自訂 OpenAI 相容代理           | 你在另一個模型 API 前方做代理，且需要 OpenClaw 將它視為 OpenAI               |

後端支援時請使用 Responses API（`api: "openai-responses"`）（LM Studio 支援）。否則請沿用 Chat Completions（`api: "openai-completions"`）。

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA 使用者：**官方 Ollama Linux 安裝程式會啟用帶有 `Restart=always` 的 systemd 服務。在 WSL2 GPU 設定中，自動啟動可能會在開機期間重新載入上一個模型並占住主機記憶體。如果你的 WSL2 VM 在啟用 Ollama 後反覆重新啟動，請參閱 [WSL2 當機循環](/zh-TW/providers/ollama#wsl2-crash-loop-repeated-reboots)。
</Warning>

## 建議：LM Studio + 大型本機模型（Responses API）

目前最佳的本機堆疊。在 LM Studio 載入大型模型（例如完整大小的 Qwen、DeepSeek 或 Llama 建置），啟用本機伺服器（預設 `http://127.0.0.1:1234`），並使用 Responses API 將推理與最終文字分開。

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
- 在 LM Studio 中下載**可用的最大模型建置**（避免「small」／高度量化的變體），啟動伺服器，確認 `http://127.0.0.1:1234/v1/models` 會列出它。
- 將 `my-local-model` 替換為 LM Studio 中顯示的實際模型 ID。
- 保持模型已載入；冷載入會增加啟動延遲。
- 如果你的 LM Studio 建置不同，請調整 `contextWindow`/`maxTokens`。
- 對於 WhatsApp，請沿用 Responses API，這樣只會傳送最終文字。

即使執行本機模型，也請保留託管模型設定；使用 `models.mode: "merge"`，讓備援保持可用。

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

### 本機優先，搭配託管安全網

交換主要與備援順序；保留相同的 providers 區塊與 `models.mode: "merge"`，這樣當本機機器停機時，你仍可退回 Sonnet 或 Opus。

### 區域託管／資料路由

- 託管的 MiniMax/Kimi/GLM 變體也存在於 OpenRouter，並提供區域固定端點（例如美國託管）。在那裡選擇區域變體，即可將流量保留在你選定的司法管轄區，同時仍使用 `models.mode: "merge"` 作為 Anthropic/OpenAI 備援。
- 純本機仍是最強的隱私路徑；當你需要提供者功能但想控制資料流時，託管區域路由是折衷方案。

## 其他 OpenAI 相容本機代理

如果 MLX（`mlx_lm.server`）、vLLM、SGLang、LiteLLM、OAI-proxy 或自訂
Gateway 暴露 OpenAI 風格的 `/v1/chat/completions`
端點，它們就能運作。除非後端明確
記錄支援 `/v1/responses`，否則請使用 Chat Completions 配接器。將上方 provider 區塊替換為你的
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

如果在具有 `baseUrl` 的自訂 provider 上省略 `api`，OpenClaw 預設為
`openai-completions`。像 `127.0.0.1` 這樣的 loopback 端點會自動受信任；
LAN、tailnet 與私人 DNS 端點仍需要
`request.allowPrivateNetwork: true`。

`models.providers.<id>.models[].id` 值是 provider 本機的值。不要
在那裡包含 provider 前綴。例如，使用
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` 啟動的 MLX 伺服器應使用這個
目錄 ID 與模型參照：

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

在本機或代理的視覺模型上設定 `input: ["text", "image"]`，讓圖片
附件注入代理回合。互動式自訂 provider
入門流程會推斷常見視覺模型 ID，且只會針對未知名稱提問。
非互動式入門流程使用相同推斷；對於未知視覺 ID 請使用 `--custom-image-input`，
當看似已知的模型在你的端點後方其實僅支援文字時，請使用 `--custom-text-input`。

保留 `models.mode: "merge"`，讓託管模型保持可作為備援。
對於緩慢的本機或遠端模型
伺服器，請先使用 `models.providers.<id>.timeoutSeconds`，再提高 `agents.defaults.timeoutSeconds`。provider 逾時
只套用於模型 HTTP 請求，包括連線、標頭、主體串流，
以及受保護 fetch 中止的總時間。

<Note>
對於自訂 OpenAI 相容 provider，當 `baseUrl` 解析為 loopback、私人 LAN、`.local` 或裸主機名稱時，允許保存非秘密的本機標記，例如 `apiKey: "ollama-local"`。OpenClaw 會將它視為有效的本機憑證，而不是回報遺失金鑰。任何接受公開主機名稱的 provider 都應使用真實值。
</Note>

本機／代理 `/v1` 後端的行為注意事項：

- OpenClaw 會將這些視為代理風格的 OpenAI 相容路由，而不是原生
  OpenAI 端點
- 原生 OpenAI 專用的請求塑形不會套用在這裡：沒有
  `service_tier`、沒有 Responses `store`、沒有 OpenAI 推理相容酬載
  塑形，也沒有提示快取提示
- 隱藏的 OpenClaw 歸因標頭（`originator`、`version`、`User-Agent`）
  不會注入這些自訂代理 URL

較嚴格 OpenAI 相容後端的相容性注意事項：

- 有些伺服器在 Chat Completions 上只接受字串 `messages[].content`，不接受
  結構化內容片段陣列。請為
  這些端點設定 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
- 有些本機模型會以文字形式發出獨立的括號工具請求，例如
  `[tool_name]` 後面接 JSON 與 `[END_TOOL_REQUEST]`。OpenClaw 只有在名稱完全符合該回合已註冊的
  工具時，才會將它們提升為真正的工具呼叫；否則該區塊會被視為不支援的文字，並且
  對使用者可見回覆隱藏。
- 如果模型發出看起來像工具呼叫的 JSON、XML 或 ReAct 風格文字，
  但 provider 沒有發出結構化叫用，OpenClaw 會將它保留為
  文字，並在可用時記錄警告，包含執行 ID、provider/model、偵測到的模式與
  工具名稱。請將其視為 provider/model 工具呼叫
  不相容，而不是已完成的工具執行。
- 如果工具以助理文字形式出現而不是執行，例如原始 JSON、
  XML、ReAct 語法，或 provider 回應中的空 `tool_calls` 陣列，
  請先確認伺服器正在使用支援工具呼叫的聊天範本／剖析器。對於
  剖析器只有在強制使用工具時才運作的 OpenAI 相容 Chat Completions 後端，
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

  只在每個正常回合都應呼叫工具的模型／工作階段使用此設定。
  它會覆寫 OpenClaw 預設代理值 `tool_choice: "auto"`。
  將 `local/my-local-model` 替換為
  `openclaw models list` 顯示的確切 provider/model 參照。

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- 如果自訂 OpenAI 相容模型接受內建設定檔以外的 OpenAI 推理強度，
  請在模型 compat 區塊上宣告它們。在這裡加入 `"xhigh"`
  會讓 `/think xhigh`、工作階段選擇器、Gateway 驗證與 `llm-task`
  驗證針對該已設定的 provider/model 參照公開此等級：

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

如果模型能乾淨載入，但完整代理回合行為異常，請由上而下處理：先確認傳輸，再縮小表面。

1. **確認本機模型本身會回應。** 無工具、無代理程式內容：

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **確認 Gateway 路由。** 只傳送提供的提示詞 — 略過 transcript、AGENTS bootstrap、context-engine assembly、工具和 bundled MCP 伺服器，但仍會演練 Gateway 路由、驗證與提供者選擇：

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **嘗試 lean mode。** 如果兩個探測都通過，但實際代理程式回合因工具呼叫格式錯誤或提示詞過大而失敗，請啟用 `agents.defaults.experimental.localModelLean: true`。它會移除三個最重的預設工具（`browser`、`cron`、`message`），讓提示詞形狀更小且較不脆弱。完整說明、適用時機，以及如何確認已啟用，請參閱 [Experimental Features → Local model lean mode](/zh-TW/concepts/experimental-features#local-model-lean-mode)。

4. **作為最後手段，完全停用工具。** 如果 lean mode 還不夠，請為該模型項目設定 `models.providers.<provider>.models[].compat.supportsTools: false`。接著代理程式會在該模型上不使用工具呼叫來運作。

5. **再往後，瓶頸就在上游。** 如果在 lean mode 和 `supportsTools: false` 之後，後端仍然只在較大的 OpenClaw 執行中失敗，剩下的問題通常是上游模型或伺服器容量 — context window、GPU 記憶體、kv-cache eviction，或後端 bug。此時就不是 OpenClaw 的傳輸層問題。

## 疑難排解

- Gateway 可以連到 proxy 嗎？`curl http://127.0.0.1:1234/v1/models`。
- LM Studio 模型未載入？重新載入；冷啟動是常見的「卡住」原因。
- 本機伺服器顯示 `terminated`、`ECONNRESET`，或在回合中途關閉串流？
  OpenClaw 會在診斷中記錄低基數的 `model.call.error.failureKind`，以及
  OpenClaw 程序 RSS/heap snapshot。對於 LM Studio/Ollama
  記憶體壓力，請將該時間戳與伺服器日誌或 macOS crash /
  jetsam 日誌比對，以確認模型伺服器是否被終止。
- OpenClaw 會從偵測到的模型視窗推導 context-window preflight 臨界值，或在 `agents.defaults.contextTokens` 降低有效視窗時，從未加上限的模型視窗推導。低於 20% 時會以 **8k** 下限警告。硬性阻擋使用 10% 臨界值並採 **4k** 下限，且會限制在有效 context window 內，避免過大的模型 metadata 拒絕原本有效的使用者上限。如果遇到該 preflight，請提高伺服器/模型 context 限制，或選擇更大的模型。
- Context 錯誤？降低 `contextWindow` 或提高伺服器限制。
- OpenAI-compatible 伺服器回傳 `messages[].content ... expected a string`？
  請在該模型項目上新增 `compat.requiresStringContent: true`。
- 直接的小型 `/v1/chat/completions` 呼叫可運作，但 `openclaw infer model run --local`
  在 Gemma 或其他本機模型上失敗？請先檢查提供者 URL、模型 ref、驗證
  標記和伺服器日誌；本機 `model run` 不包含代理程式工具。
  如果本機 `model run` 成功，但較大的代理程式回合失敗，請使用 `localModelLean` 或 `compat.supportsTools: false` 減少代理程式
  工具表面。
- 工具呼叫顯示為原始 JSON/XML/ReAct 文字，或提供者回傳
  空的 `tool_calls` 陣列？不要加入會盲目把 assistant
  文字轉換成工具執行的 proxy。請先修正伺服器 chat template/parser。如果
  模型只有在強制使用工具時才可運作，請加入上方的個別模型
  `params.extra_body.tool_choice: "required"` 覆寫，並且只在每個回合都預期會有工具呼叫的 session 中使用該模型
  項目。
- 安全性：本機模型會略過提供者端篩選；請讓代理程式範圍保持狹窄並開啟 compaction，以限制 prompt injection 的影響範圍。

## 相關

- [Configuration reference](/zh-TW/gateway/configuration-reference)
- [Model failover](/zh-TW/concepts/model-failover)
