---
read_when:
    - 你想要從自己的 GPU 主機提供模型服務
    - 你正在連接 LM Studio 或 OpenAI 相容代理
    - 你需要最安全的本機模型指引
summary: 在本機 LLM 上執行 OpenClaw（LM Studio、vLLM、LiteLLM、自訂 OpenAI 端點）
title: 本機模型
x-i18n:
    generated_at: "2026-07-05T11:21:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 850bbd6db1cf3da8719edec37cc271d9ea36dd5adf3722a555ded0823ec022ea
    source_path: gateway/local-models.md
    workflow: 16
---

本機模型可運作，但會提高對硬體、情境大小與提示注入防禦的要求：小型或激進量化的模型會截斷情境，並跳過提供者端的安全篩選。此頁涵蓋較高階的本機堆疊與自訂 OpenAI 相容伺服器。若要使用阻力最低的路徑，請從 [LM Studio](/zh-TW/providers/lmstudio) 或 [Ollama](/zh-TW/providers/ollama) 與 `openclaw onboard` 開始。

若本機伺服器只應在選取的模型需要時啟動，請參閱[本機模型服務](/zh-TW/gateway/local-model-services)。

## 硬體下限

建議使用 **2 台以上滿配 Mac Studio，或同等級 GPU 設備（約 $30k+）**，以獲得舒適的代理迴圈體驗。單張 **24 GB** GPU 只能以較高延遲處理較輕量的提示。請一律執行你能託管的**最大／完整尺寸變體** - 小型或重度量化的 checkpoint 會提高提示注入風險（請參閱[安全性](/zh-TW/gateway/security)）。

## 選擇後端

| 後端                                                 | 適用時機                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [ds4](/zh-TW/providers/ds4)                                | 在 macOS Metal 上使用具備 OpenAI 相容工具呼叫的本機 DeepSeek V4 Flash       |
| [LM Studio](/zh-TW/providers/lmstudio)                     | 首次本機設定、GUI 載入器、原生 Responses API                               |
| LiteLLM / OAI-proxy / custom OpenAI-compatible proxy | 你代理另一個模型 API，且需要 OpenClaw 將其視為 OpenAI                      |
| MLX / vLLM / SGLang                                  | 透過 OpenAI 相容 HTTP 端點提供高吞吐量自託管服務                           |
| [Ollama](/zh-TW/providers/ollama)                          | 命令列介面工作流程、模型庫、免管理的 systemd 服務                          |

當後端支援時（LM Studio 支援），使用 `api: "openai-responses"`。否則使用 `api: "openai-completions"`。如果具備 `baseUrl` 的自訂提供者省略 `api`，OpenClaw 預設為 `openai-completions`。

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA：**官方 Ollama Linux 安裝程式會啟用 `Restart=always` 的 systemd 服務。在 WSL2 GPU 設定中，自動啟動可能會在開機期間重新載入上一個模型並佔住主機記憶體，導致 VM 反覆重新啟動。請參閱 [WSL2 crash loop](/zh-TW/providers/ollama#troubleshooting)。
</Warning>

## LM Studio + 大型本機模型（Responses API）

這是目前最佳的本機堆疊。在 LM Studio 載入大型模型（完整尺寸的 Qwen、DeepSeek 或 Llama build），啟用本機伺服器（預設 `http://127.0.0.1:1234`），並使用 Responses API 讓推理與最終文字分離。

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
- 下載**可用的最大模型 build**（避免「small」/重度量化變體），啟動伺服器，確認 `http://127.0.0.1:1234/v1/models` 會列出它。
- 將 `my-local-model` 替換為 LM Studio 中顯示的實際模型 ID。
- 保持模型已載入；冷載入會增加啟動延遲。
- 如果你的 LM Studio build 不同，請調整 `contextWindow`/`maxTokens`。
- 對於 WhatsApp，請維持使用 Responses API，讓系統只傳送最終文字。
- 保持 `models.mode: "merge"`，讓託管模型仍可作為 fallback 使用。

### 混合設定：託管主要模型、本機 fallback

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

若要本機優先並以託管模型作為安全網，請交換 `primary`/`fallbacks` 的順序，並保留相同的 `providers` 區塊與 `models.mode: "merge"`。

### 區域託管／資料路由

OpenRouter 上也有託管的 MiniMax/Kimi/GLM 變體，並提供區域固定端點（例如在美國託管）。選擇區域變體，即可讓流量留在你選定的司法管轄區，同時保留 `models.mode: "merge"` 以使用 Anthropic/OpenAI fallback。僅使用本機仍是最強的隱私路徑；當你需要提供者功能但想控制資料流時，託管區域路由是折衷方案。

## 其他 OpenAI 相容本機代理

只要公開 OpenAI 風格的 `/v1/chat/completions` 端點，MLX（`mlx_lm.server`）、vLLM、SGLang、LiteLLM、OAI-proxy 或任何自訂閘道都可運作。除非後端明確文件化支援 `/v1/responses`，否則使用 `openai-completions`。

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

自訂／本機提供者項目會信任其精確設定的 `baseUrl` 來源，用於受保護的模型請求，包括 loopback、LAN、tailnet 與私有 DNS 主機。無論如何，一律封鎖 metadata/link-local 來源。對其他私有來源的請求仍需要 `models.providers.<id>.request.allowPrivateNetwork: true`；將信任旗標設為 `false` 可選擇退出精確來源信任。

`models.providers.<id>.models[].id` 是提供者本機的 ID - 不要包含提供者前綴。對於使用 `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` 啟動的 MLX 伺服器：

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

在本機或代理的視覺模型上設定 `input: ["text", "image"]`，讓圖片附件注入代理回合。互動式自訂提供者 onboarding 會推斷常見視覺模型 ID，且只詢問未知名稱；非互動式 onboarding 使用相同推斷，並可用 `--custom-image-input` / `--custom-text-input` 覆寫。

對緩慢的本機／遠端模型伺服器，請先使用 `models.providers.<id>.timeoutSeconds`，再提高 `agents.defaults.timeoutSeconds`。提供者逾時只涵蓋模型 HTTP 請求的連線、標頭、本文串流，以及整體受保護 fetch 中止 - 如果代理／執行逾時更低，也要提高該值，因為提供者逾時無法延長整個執行。

<Note>
對於自訂 OpenAI 相容提供者，當 `baseUrl` 解析為 loopback、私有 LAN、`.local` 或裸主機名稱時，會接受像 `apiKey: "ollama-local"` 這類非機密本機標記 - OpenClaw 會將其視為有效的本機憑證，而不是回報缺少金鑰。對任何接受公開主機名稱的提供者，請使用真實值。
</Note>

本機／代理 `/v1` 後端的行為注意事項：

- OpenClaw 會將這些視為代理風格的 OpenAI 相容路由，而非原生 OpenAI 端點。
- 不會套用僅限原生 OpenAI 的請求塑形：沒有 `service_tier`、沒有 Responses `store`、沒有 OpenAI 推理相容 payload 塑形、沒有提示快取提示。
- 隱藏的 OpenClaw 歸因標頭（`originator`、`version`、`User-Agent`）不會注入自訂代理 URL。

較嚴格 OpenAI 相容後端的相容性覆寫：

- **僅字串內容**：某些伺服器只接受字串 `messages[].content`，不接受結構化內容片段陣列。設定 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
- **嚴格訊息鍵**：如果伺服器拒絕包含超過 `role`/`content` 的訊息項目，請設定 `compat.strictMessageKeys: true`。
- **括號工具文字**：某些本機模型會將獨立的括號工具請求作為文字輸出，例如 `[tool_name]` 後接 JSON 與 `[END_TOOL_REQUEST]`。只有當名稱與該回合註冊的工具完全相符時，OpenClaw 才會將其提升為真正的工具呼叫；否則它會維持為隱藏且不支援的文字。
- **看似工具呼叫的非結構化文字**：如果模型輸出看似工具呼叫但不是結構化 invocation 的 JSON/XML/ReAct 風格文字，OpenClaw 會將其保留為文字，並在可用時記錄一則警告，包含執行 ID、提供者／模型、偵測到的模式與工具名稱。那是提供者／模型不相容，不是已完成的工具執行。
- **強制使用工具**：如果工具顯示為助理文字（原始 JSON/XML/ReAct，或空的 `tool_calls` 陣列），請先確認伺服器的 chat template/parser 支援工具呼叫。如果 parser 只在強制使用工具時才運作，請依模型覆寫預設代理值 `tool_choice: "auto"`：

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

  只在每個一般回合都應呼叫工具的地方使用此設定。將 `local/my-local-model` 替換為 `openclaw models list` 中的精確 ref，或透過命令列介面設定：

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- **額外推理強度**：如果自訂 OpenAI 相容模型接受內建設定檔以外的 OpenAI 推理強度，請在模型的 compat 區塊中宣告它們。加入 `"xhigh"` 會為該模型 ref 在 `/think xhigh`、session 選擇器、閘道驗證與 `llm-task` 驗證中公開它：

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

如果模型能乾淨載入，但完整代理回合行為異常，請由上而下處理：先確認傳輸，再縮小範圍。

1. **確認本機模型有回應** - 不使用工具、不使用代理情境：

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **確認閘道路由** - 只傳送提示，略過逐字稿、AGENTS 啟動程序、情境引擎組裝、工具和內建 MCP 伺服器，但仍會驗證閘道路由、驗證和提供者選擇：

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **嘗試精簡模式**，如果兩個探測都通過，但實際代理回合因工具呼叫格式錯誤或提示過大而失敗：設定 `agents.defaults.experimental.localModelLean: true`。它會移除三個最重的預設工具（`browser`、`cron`、`message` - 除非某次執行必須保留直接 `message` 傳遞語意），並將較大的工具目錄預設放在結構化工具搜尋控制之後。詳情與確認啟用方式，請參閱[實驗功能 -> 本機模型精簡模式](/zh-TW/concepts/experimental-features#local-model-lean-mode)。

4. **最後手段是完全停用工具**，方法是為該模型設定 `models.providers.<provider>.models[].compat.supportsTools: false` - 代理接著會在沒有工具呼叫的情況下執行。

5. **超過這一點後，瓶頸在上游。** 如果後端在精簡模式和 `supportsTools: false` 之後，仍然只會在較大的 OpenClaw 執行中失敗，剩下的問題通常是模型或伺服器本身，也就是情境視窗、GPU 記憶體、kv-cache 淘汰，或後端錯誤，而不是 OpenClaw 的傳輸層。

## 疑難排解

- **閘道無法連到代理？** `curl http://127.0.0.1:1234/v1/models`。
- **LM Studio 模型已卸載？** 重新載入；冷啟動是常見的「卡住」原因。
- **本機伺服器顯示 `terminated`、`ECONNRESET`，或在回合中途關閉串流？** OpenClaw 會在診斷中記錄低基數的 `model.call.error.failureKind`，以及 OpenClaw 程序的 RSS/heap 快照。對於 LM Studio/Ollama 記憶體壓力，請將該時間戳與伺服器日誌或 macOS 崩潰/jetsam 日誌比對，以確認模型伺服器是否被終止。
- **情境錯誤？** OpenClaw 會從偵測到的模型視窗（或當 `agents.defaults.contextTokens` 降低時的上限視窗）推導情境視窗預檢閾值，在低於 20% 且下限為 **8k** 時警告，並在低於 10% 且下限為 **4k** 時硬性封鎖（受有效情境視窗限制，因此過大的模型中繼資料不會拒絕有效的使用者上限）。降低 `contextWindow`，或提高伺服器/模型情境限制。
- **`messages[].content ... expected a string`？** 在該模型項目上加入 `compat.requiresStringContent: true`。
- **`validation.keys`，或「message entries only allow `role` and `content`」？** 在該模型項目上加入 `compat.strictMessageKeys: true`。
- **直接呼叫 `/v1/chat/completions` 可行，但 `openclaw infer model run --local` 在 Gemma 或其他本機模型上失敗？** 請先檢查供應商 URL、模型參照、驗證標記和伺服器日誌，`model run` 會完全略過代理工具。如果 `model run` 成功但較大的代理回合失敗，請使用 `localModelLean` 或 `compat.supportsTools: false` 縮減工具表面。
- **工具呼叫顯示為原始 JSON/XML/ReAct 文字，或供應商回傳空的 `tool_calls` 陣列？** 不要加入會盲目將助理文字轉換成工具執行的代理，請先修正伺服器的聊天範本/剖析器。如果模型只有在強制使用工具時才可運作，請加入上方的 `params.extra_body.tool_choice: "required"` 覆寫，並且只在預期每回合都有工具呼叫的工作階段中使用該模型項目。
- **安全性**：本機模型會略過供應商端篩選器。讓代理範圍保持狹窄並開啟壓縮，以限制提示注入的影響範圍。

## 相關

- [設定參考](/zh-TW/gateway/configuration-reference)
- [模型容錯移轉](/zh-TW/concepts/model-failover)
