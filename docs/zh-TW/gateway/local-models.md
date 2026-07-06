---
read_when:
    - 你想要從自己的 GPU 主機提供模型服務
    - 你正在連接 LM Studio 或 OpenAI 相容的代理處理器
    - 你需要最安全的本機模型指南
summary: 在本機 LLM 上執行 OpenClaw（LM Studio、vLLM、LiteLLM、自訂 OpenAI 端點）
title: 本機模型
x-i18n:
    generated_at: "2026-07-06T10:49:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0cb81958fb70660a6eee290171102d68b520a0498bd3f3333cf646c9aea00f41
    source_path: gateway/local-models.md
    workflow: 16
---

本機模型可運作，但它們對硬體、脈絡大小和提示注入防禦提出更高要求：小型或激進量化的模型會截斷脈絡，並略過供應商端的安全篩選器。本頁涵蓋較高階的本機堆疊和自訂 OpenAI 相容伺服器。若要走阻力最低的路徑，請從 [LM Studio](/zh-TW/providers/lmstudio) 或 [Ollama](/zh-TW/providers/ollama) 以及 `openclaw onboard` 開始。

對於只應在選取的模型需要時才啟動的本機伺服器，請參閱[本機模型服務](/zh-TW/gateway/local-model-services)。

## 硬體下限

建議使用 **2 台以上滿配 Mac Studio，或等效的 GPU 設備（約 $30k 以上）**，以獲得順暢的代理迴圈。單張 **24 GB** GPU 只能以較高延遲處理較輕量的提示。務必執行**你能託管的最大／完整尺寸變體** - 小型或高度量化的檢查點會提高提示注入風險（請參閱[安全性](/zh-TW/gateway/security)）。

## 選擇後端

| 後端                                                 | 適用情境                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [ds4](/zh-TW/providers/ds4)                                | 在 macOS Metal 上執行本機 DeepSeek V4 Flash，並支援 OpenAI 相容工具呼叫    |
| [LM Studio](/zh-TW/providers/lmstudio)                     | 首次本機設定、GUI 載入器、原生 Responses API                               |
| LiteLLM / OAI-proxy / 自訂 OpenAI 相容代理           | 你在另一個模型 API 前端，且需要 OpenClaw 將其視為 OpenAI                   |
| MLX / vLLM / SGLang                                  | 透過 OpenAI 相容 HTTP 端點進行高吞吐量自託管服務                           |
| [Ollama](/zh-TW/providers/ollama)                          | 命令列介面工作流程、模型庫、免管理的 systemd 服務                          |

當後端支援時，使用 `api: "openai-responses"`（LM Studio 支援）。否則使用 `api: "openai-completions"`。如果在含有 `baseUrl` 的自訂供應商上省略 `api`，OpenClaw 會預設使用 `openai-completions`。

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA：**官方 Ollama Linux 安裝程式會啟用帶有 `Restart=always` 的 systemd 服務。在 WSL2 GPU 設定中，自動啟動可能會在開機期間重新載入上一個模型並佔住主機記憶體，導致 VM 反覆重新啟動。請參閱 [WSL2 當機迴圈](/zh-TW/providers/ollama#troubleshooting)。
</Warning>

## LM Studio + 大型本機模型（Responses API）

這是目前最佳的本機堆疊。在 LM Studio 中載入大型模型（完整尺寸的 Qwen、DeepSeek 或 Llama 建置），啟用本機伺服器（預設 `http://127.0.0.1:1234`），並使用 Responses API 將推理與最終文字分開。

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

設定檢查清單：

- 安裝 LM Studio：[https://lmstudio.ai](https://lmstudio.ai)
- 下載**可用的最大模型建置**（避免「small」/高度量化變體）、啟動伺服器，確認 `http://127.0.0.1:1234/v1/models` 列出它。
- 將 `my-local-model` 替換為 LM Studio 中顯示的實際模型 ID。
- 保持模型已載入；冷載入會增加啟動延遲。
- 如果你的 LM Studio 建置不同，請調整 `contextWindow`/`maxTokens`。
- 對 WhatsApp，請維持使用 Responses API，讓系統只傳送最終文字。
- 保持 `models.mode: "merge"`，讓託管模型仍可作為備援使用。

### 混合設定：託管主要模型，本機備援

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

若要本機優先並以託管模型作為安全網，請交換 `primary`/`fallbacks` 的順序，並保留相同的 `providers` 區塊和 `models.mode: "merge"`。

### 區域託管／資料路由

託管的 MiniMax/Kimi/GLM 變體也存在於 OpenRouter 上，並提供區域固定端點（例如美國託管）。選擇區域變體，讓流量保留在你選定的司法管轄區，同時保持 `models.mode: "merge"` 以使用 Anthropic/OpenAI 備援。純本機仍是隱私性最強的路徑；當你需要供應商功能但也想控制資料流時，託管區域路由是折衷方案。

## 其他 OpenAI 相容本機代理

如果 MLX（`mlx_lm.server`）、vLLM、SGLang、LiteLLM、OAI-proxy 或任何自訂閘道公開 OpenAI 風格的 `/v1/chat/completions` 端點，就可以使用。除非後端明確記載支援 `/v1/responses`，否則請使用 `openai-completions`。

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

自訂／本機供應商項目會信任其精確設定的 `baseUrl` 來源，用於受防護的模型請求，包括 loopback、LAN、tailnet 和私有 DNS 主機。無論如何，metadata/link-local 來源一律會被封鎖。對其他私有來源的請求仍需要 `models.providers.<id>.request.allowPrivateNetwork: true`；將信任旗標設為 `false` 可選擇退出精確來源信任。

`models.providers.<id>.models[].id` 是供應商本機的 - 不要包含供應商前綴。對於以 `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` 啟動的 MLX 伺服器：

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

在本機或代理的視覺模型上設定 `input: ["text", "image"]`，讓圖片附件注入代理回合。互動式自訂供應商引導會推斷常見視覺模型 ID，且只詢問未知名稱；非互動式引導使用相同推斷，並可用 `--custom-image-input` / `--custom-text-input` 覆寫。

對緩慢的本機／遠端模型伺服器，請先使用 `models.providers.<id>.timeoutSeconds`，再提高 `agents.defaults.timeoutSeconds`。供應商逾時僅涵蓋模型 HTTP 請求的連線、標頭、主體串流，以及整體受防護 fetch 中止 - 如果代理／執行逾時較低，也要提高它，因為供應商逾時無法延長整個執行。

<Note>
對於自訂 OpenAI 相容供應商，當 `baseUrl` 解析到 loopback、私有 LAN、`.local` 或裸主機名稱時，可接受例如 `apiKey: "ollama-local"` 這類非秘密本機標記 - OpenClaw 會將其視為有效的本機憑證，而不是回報缺少金鑰。對任何接受公開主機名稱的供應商，請使用真實值。
</Note>

本機／代理 `/v1` 後端的行為注意事項：

- OpenClaw 會將這些視為代理風格的 OpenAI 相容路由，而不是原生 OpenAI 端點。
- 不會套用僅限原生 OpenAI 的請求塑形：沒有 `service_tier`、沒有 Responses `store`、沒有 OpenAI 推理相容酬載塑形、沒有提示快取提示。
- 隱藏的 OpenClaw 歸因標頭（`originator`、`version`、`User-Agent`）不會注入自訂代理 URL。

較嚴格 OpenAI 相容後端的相容性覆寫：

- **僅字串內容**：有些伺服器只接受字串 `messages[].content`，不接受結構化內容部分陣列。設定 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
- **嚴格訊息鍵**：如果伺服器拒絕含有超過 `role`/`content` 的訊息項目，請設定 `compat.strictMessageKeys: true`。
- **括號工具文字**：有些本機模型會將獨立的括號工具請求輸出為文字，例如 `[tool_name]` 後接 JSON 和 `[END_TOOL_REQUEST]`。只有當名稱與該回合註冊工具完全相符時，OpenClaw 才會將其提升為真正的工具呼叫；否則它會保留為隱藏且不支援的文字。
- **看似工具呼叫的非結構化文字**：如果模型輸出看似工具呼叫、但不是結構化呼叫的 JSON/XML/ReAct 風格文字，OpenClaw 會將其保留為文字，並在可用時記錄一則警告，包含執行 ID、供應商／模型、偵測到的模式和工具名稱。這是供應商／模型不相容，不是已完成的工具執行。
- **強制使用工具**：如果工具以助理文字形式出現（原始 JSON/XML/ReAct，或空的 `tool_calls` 陣列），請先確認伺服器的聊天範本／解析器支援工具呼叫。如果解析器只有在強制使用工具時才運作，請針對每個模型覆寫預設代理值 `tool_choice: "auto"`：

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

  只有在每個正常回合都應呼叫工具時才使用此設定。將 `local/my-local-model` 替換為 `openclaw models list` 中的精確參照，或透過命令列介面設定：

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- **額外推理努力層級**：如果自訂 OpenAI 相容模型接受內建設定檔以外的 OpenAI 推理努力層級，請在模型的 compat 區塊中宣告它們。加入 `"xhigh"` 會在 `/think xhigh`、工作階段選擇器、閘道驗證和 `llm-task` 驗證中，為該模型參照公開它：

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

如果模型能順利載入，但完整代理回合行為異常，請由上而下處理：先確認傳輸，再縮小範圍。

1. **確認本機模型有回應** - 不含工具、不含代理脈絡：

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **確認閘道路由** - 只傳送提示，跳過對話記錄、AGENTS 啟動程序、context-engine 組裝、工具和內建 MCP 伺服器，但仍會驗證閘道路由、驗證和提供者選擇：

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **嘗試精簡模式**，如果兩個探測都通過，但實際代理回合因工具呼叫格式錯誤或提示過大而失敗：設定 `agents.defaults.experimental.localModelLean: true`。除非明確需要，否則它會移除重量級的瀏覽器、排程、訊息、媒體生成、語音和 PDF 工具，並預設將較大的工具目錄放在結構化的工具搜尋控制項後方。詳情以及如何確認已啟用，請參閱[實驗性功能 -> 本機模型精簡模式](/zh-TW/concepts/experimental-features#local-model-lean-mode)。

4. **最後手段是完全停用工具**，方法是為該模型設定 `models.providers.<provider>.models[].compat.supportsTools: false` - 之後代理會在沒有工具呼叫的情況下執行。

5. **再往後，瓶頸就在上游。** 如果後端在精簡模式和 `supportsTools: false` 之後仍然只在較大的 OpenClaw 執行中失敗，剩下的問題通常是模型或伺服器本身 - 例如上下文視窗、GPU 記憶體、kv-cache 淘汰，或後端錯誤 - 而不是 OpenClaw 的傳輸層。

## 疑難排解

- **閘道無法連到 Proxy？** `curl http://127.0.0.1:1234/v1/models`。
- **LM Studio 模型已卸載？** 重新載入；冷啟動是常見的「卡住」原因。
- **本機伺服器顯示 `terminated`、`ECONNRESET`，或在回合中途關閉串流？** OpenClaw 會在診斷中記錄低基數的 `model.call.error.failureKind`，以及 OpenClaw 程序的 RSS/heap 快照。對於 LM Studio/Ollama 的記憶體壓力，請將該時間戳與伺服器日誌或 macOS crash/jetsam 日誌比對，以確認模型伺服器是否被終止。
- **上下文錯誤？** OpenClaw 會從偵測到的模型視窗（或當 `agents.defaults.contextTokens` 將其降低時的上限視窗）推導上下文視窗預檢閾值；低於 20% 時警告，且有 **8k** 下限；低於 10% 時硬性封鎖，且有 **4k** 下限（會限制在有效上下文視窗內，避免過大的模型中繼資料拒絕有效的使用者上限）。降低 `contextWindow`，或提高伺服器/模型的上下文限制。
- **`messages[].content ... expected a string`？** 在該模型項目上加入 `compat.requiresStringContent: true`。
- **`validation.keys`，或「message entries only allow `role` and `content`」？** 在該模型項目上加入 `compat.strictMessageKeys: true`。
- **直接呼叫 `/v1/chat/completions` 可運作，但 `openclaw infer model run --local` 在 Gemma 或其他本機模型上失敗？** 請先檢查提供者 URL、模型 ref、auth 標記和伺服器日誌 - `model run` 會完全略過代理工具。如果 `model run` 成功但較大的代理回合失敗，請用 `localModelLean` 或 `compat.supportsTools: false` 減少工具表面。
- **工具呼叫顯示為原始 JSON/XML/ReAct 文字，或提供者回傳空的 `tool_calls` 陣列？** 不要加入會盲目將 assistant 文字轉換成工具執行的 Proxy - 請先修正伺服器的聊天樣板/解析器。如果模型只有在強制使用工具時才能運作，請加入上述的 `params.extra_body.tool_choice: "required"` 覆寫，且只在預期每個回合都會有工具呼叫的工作階段使用該模型項目。
- **安全性**：本機模型會略過提供者端的篩選器。請保持代理範圍狹窄，並開啟壓縮，以限制 prompt-injection 的影響範圍。

## 相關

- [設定參考](/zh-TW/gateway/configuration-reference)
- [模型容錯移轉](/zh-TW/concepts/model-failover)
