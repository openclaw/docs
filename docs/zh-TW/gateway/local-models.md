---
read_when:
    - 你想要從自己的 GPU 主機提供模型服務
    - 你正在連接 LM Studio 或 OpenAI 相容的 Proxy 伺服器
    - 你需要最安全的本機模型指引
summary: 在本機 LLM 上執行 OpenClaw（LM Studio、vLLM、LiteLLM、自訂 OpenAI 端點）
title: 本機模型
x-i18n:
    generated_at: "2026-07-22T10:34:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: af76c9e97bd1d3c9665c347944511b4f466f0b620bb8af7b5f95b1e9145aadec
    source_path: gateway/local-models.md
    workflow: 16
---

本機模型可以運作，但對硬體、上下文大小及提示注入防護的要求更高：小型或大幅量化的模型會截斷上下文，並略過供應商端的安全篩選機制。本頁涵蓋較高階的本機技術堆疊與自訂 OpenAI 相容伺服器。若要採用最省事的方式，請從 [LM Studio](/zh-TW/providers/lmstudio) 或 [Ollama](/zh-TW/providers/ollama) 開始，並 `openclaw onboard`。

若本機伺服器應僅在選取的模型需要時啟動，請參閱[本機模型服務](/zh-TW/gateway/local-model-services)。

## 硬體最低需求

若要順暢執行代理程式迴圈，建議使用 **2 台以上配備頂規規格的 Mac Studio，或同等級的 GPU 裝置（約 $30k 以上）**。單張 **24 GB** GPU 只能以較高延遲處理較輕量的提示。請一律執行**你能承載的最大型／完整尺寸版本**——小型或高度量化的檢查點會提高提示注入風險（請參閱[安全性](/zh-TW/gateway/security)）。

## 選擇後端

| 後端                                                 | 適用情境                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [ds4](/zh-TW/providers/ds4)                                | 在 macOS Metal 上執行本機 DeepSeek V4 Flash，並使用 OpenAI 相容的工具呼叫   |
| [LM Studio](/zh-TW/providers/lmstudio)                     | 首次設定本機環境、GUI 載入器、原生 Responses API                            |
| LiteLLM / OAI-proxy / 自訂 OpenAI 相容代理           | 你在另一個模型 API 前方設定代理，並需要 OpenClaw 將其視為 OpenAI            |
| MLX / vLLM / SGLang                                  | 透過 OpenAI 相容 HTTP 端點提供高吞吐量的自行託管服務                        |
| [Ollama](/zh-TW/providers/ollama)                          | 命令列介面工作流程、模型庫、無須人工介入的 systemd 服務                     |

後端支援時請使用 `api: "openai-responses"`（LM Studio 支援）。否則請使用 `api: "openai-completions"`。若自訂供應商具有 `baseUrl`，但省略 `api`，OpenClaw 會預設使用 `openai-completions`。

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA：**Ollama 官方 Linux 安裝程式會啟用使用 `Restart=always` 的 systemd 服務。在 WSL2 GPU 環境中，自動啟動可能會在開機期間重新載入上一個模型並占用主機記憶體，導致虛擬機器反覆重新啟動。請參閱 [WSL2 當機迴圈](/zh-TW/providers/ollama#troubleshooting)。
</Warning>

## LM Studio + 大型本機模型（Responses API）

這是目前最佳的本機技術堆疊。在 LM Studio 中載入大型模型（完整尺寸的 Qwen、DeepSeek 或 Llama 組建版本），啟用本機伺服器（預設為 `http://127.0.0.1:1234`），並使用 Responses API 將推理與最終文字分開。

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
- 下載**可用的最大型模型組建版本**（避免「small」／高度量化的變體），啟動伺服器，並確認 `http://127.0.0.1:1234/v1/models` 有列出該模型。
- 將 `my-local-model` 替換為 LM Studio 中顯示的實際模型 ID。
- 保持模型已載入；冷載入會增加啟動延遲。
- 如果你的 LM Studio 組建版本不同，請調整 `contextWindow`/`maxTokens`。
- 若使用 WhatsApp，請持續使用 Responses API，確保只傳送最終文字。
- 保留 `models.mode: "merge"`，讓託管模型仍可作為備援。

### 混合設定：託管模型為主要模型，本機模型為備援

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

若要以本機模型為優先，並以託管模型作為安全備援，請對調 `primary`/`fallbacks` 的順序，並保留相同的 `providers` 區塊及 `models.mode: "merge"`。

### 區域託管／資料路由

OpenRouter 上也提供託管的 MiniMax/Kimi/GLM 變體及鎖定區域的端點（例如在美國託管）。選擇區域變體，可在保留 `models.mode: "merge"` 作為 Anthropic/OpenAI 備援的同時，讓流量留在你選擇的司法管轄區內。純本機仍是隱私保護最強的方式；需要供應商功能但又希望控制資料流時，託管區域路由則是折衷方案。

## 其他 OpenAI 相容的本機代理

只要公開 OpenAI 風格的 `/v1/chat/completions` 端點，MLX（`mlx_lm.server`）、vLLM、SGLang、LiteLLM、OAI-proxy 或任何自訂閘道皆可運作。除非後端明確記載支援 `/v1/responses`，否則請使用 `openai-completions`。

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

自訂／本機供應商項目會針對受防護的模型要求，信任其設定的確切 `baseUrl` 來源，包括迴路、LAN、tailnet 及私人 DNS 主機。無論如何，中繼資料／連結本機來源一律會遭到封鎖。傳送至其他私人來源的要求仍需要 `models.providers.<id>.request.allowPrivateNetwork: true`；將信任旗標設為 `false`，即可選擇停用確切來源信任。

`models.providers.<id>.models[].id` 是供應商本機值——請勿包含供應商前置詞。若 MLX 伺服器是使用 `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` 啟動：

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

請在本機或經代理的視覺模型上設定 `input: ["text", "image"]`，讓影像附件注入代理程式回合。互動式自訂供應商初始設定會推斷常見的視覺模型 ID，並且只詢問未知名稱；非互動式初始設定會使用相同的推斷方式，並可透過 `--custom-image-input` / `--custom-text-input` 覆寫。

對於速度較慢的本機／遠端模型伺服器，請先使用 `models.providers.<id>.timeoutSeconds`，再提高 `agents.defaults.timeoutSeconds`。供應商逾時只涵蓋模型 HTTP 要求的連線、標頭、主體串流，以及整體受防護擷取的中止時間——若代理程式／執行逾時較短，也請一併提高，因為供應商逾時無法延長整個執行時間。

<Note>
對於自訂 OpenAI 相容供應商，當 `baseUrl` 解析為迴路、私人 LAN、`.local` 或裸主機名稱時，可接受像 `apiKey: "ollama-local"` 這類非機密的本機標記——OpenClaw 會將其視為有效的本機認證資訊，而不會回報金鑰遺失。對於任何接受公用主機名稱的供應商，請使用真實值。
</Note>

本機／經代理的 `/v1` 後端行為注意事項：

- OpenClaw 會將這些後端視為代理式 OpenAI 相容路由，而不是原生 OpenAI 端點。
- 僅適用於原生 OpenAI 的要求塑形不會套用：沒有 `service_tier`、沒有 Responses `store`、沒有 OpenAI 推理相容承載資料塑形，也沒有提示快取提示。
- 不會在自訂代理 URL 上注入隱藏的 OpenClaw 歸屬標頭（`originator`、`version`、`User-Agent`）。

相容性宣告只適用於此供應商資料列所描述的自訂端點。目錄已知路由會改用供應商擁有的能力；請參閱[自訂供應商能力指南](/zh-TW/gateway/config-tools#custom-provider-capability-declarations)。

針對限制較嚴格的 OpenAI 相容後端所提供的相容性覆寫：

- **僅限字串內容**：部分伺服器只接受字串 `messages[].content`，不接受結構化的內容部分陣列。請設定 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
- **嚴格的訊息鍵**：若伺服器拒絕含有 `role`/`content` 以外項目的訊息項目，請設定 `compat.strictMessageKeys: true`。
- **括號式工具文字**：部分本機模型會將獨立的括號式工具要求輸出為文字，例如 `[tool_name]`，後接 JSON 及 `[END_TOOL_REQUEST]`。只有當名稱與該回合已註冊的工具完全相符時，OpenClaw 才會將其提升為真正的工具呼叫；否則會保留為隱藏且不受支援的文字。
- **看似工具呼叫的非結構化文字**：若模型輸出看似工具呼叫但並非結構化叫用的 JSON/XML/ReAct 風格文字，OpenClaw 會將其保留為文字，並記錄包含執行 ID、供應商／模型、偵測到的模式，以及可取得時的工具名稱之警告。這是供應商／模型不相容，而不是已完成的工具執行。
- **強制使用工具**：若工具顯示為助理文字（原始 JSON/XML/ReAct，或空的 `tool_calls` 陣列），請先確認伺服器的聊天範本／剖析器支援工具呼叫。若剖析器只在強制使用工具時運作，請針對各模型覆寫預設代理值 `tool_choice: "auto"`：

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

  只有當每個一般回合都應呼叫工具時，才使用此設定。請將 `local/my-local-model` 替換為 `openclaw models list` 中的確切參照，或透過命令列介面設定：

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- **額外推理強度**：若自訂 OpenAI 相容模型接受內建設定檔以外的 OpenAI 推理強度，請在模型的相容性區塊中宣告。新增 `"xhigh"` 後，該模型參照便可在 `/think xhigh`、工作階段選擇器、閘道驗證及 `llm-task` 驗證中使用：

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
              name: "透過本機 Proxy 使用 GPT 5.4",
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

## 較小型或限制較嚴格的後端

如果模型能正常載入，但完整的代理回合運作異常，請由上而下進行：先確認傳輸，再縮小使用範圍。

1. **確認本機模型有回應**——不使用工具，也不載入代理情境：

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **確認閘道路由**——僅傳送提示詞，略過逐字稿、AGENTS 啟動程序、情境引擎組裝、工具和內建 MCP 伺服器，但仍會測試閘道路由、驗證和供應商選擇：

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. 如果兩項探測都通過，但實際代理回合仍因工具呼叫格式錯誤或提示詞過大而失敗，請**嘗試精簡模式**：設定 `agents.defaults.experimental.localModelLean: true`。除非明確需要，否則此模式會移除重量級的瀏覽器、排程、訊息、媒體生成、語音和 PDF 工具，並預設將較大的工具目錄置於結構化工具搜尋控制項之後，同時讓 `exec` 維持直接可見。詳情及如何確認此模式已啟用，請參閱[實驗性功能 -> 本機模型精簡模式](/zh-TW/concepts/experimental-features#local-model-lean-mode)。

4. 最後手段是設定該模型的 `models.providers.<provider>.models[].compat.supportsTools: false`，以**完全停用工具**——之後代理執行時不會呼叫工具。

5. **若仍無法解決，瓶頸就在上游。** 如果啟用精簡模式和 `supportsTools: false` 後，後端仍只在較大型的 OpenClaw 執行中失敗，剩餘問題通常出在模型或伺服器本身——例如情境視窗、GPU 記憶體、kv-cache 淘汰或後端錯誤——而非 OpenClaw 的傳輸層。

## 疑難排解

- **閘道無法連上 Proxy？** `curl http://127.0.0.1:1234/v1/models`。
- **LM Studio 模型已卸載？** 請重新載入；冷啟動是常見的「卡住」原因。
- **本機伺服器顯示 `terminated`、`ECONNRESET`，或在回合進行途中關閉串流？** OpenClaw 會在診斷資訊中記錄低基數的 `model.call.error.failureKind`，以及 OpenClaw 程序的 RSS/堆積快照。若 LM Studio/Ollama 發生記憶體壓力，請將該時間戳記與伺服器記錄或 macOS 當機/jetsam 記錄比對，以確認模型伺服器是否遭到終止。
- **發生情境錯誤？** OpenClaw 會根據偵測到的模型視窗推導情境視窗預檢門檻（若 `agents.defaults.contextTokens` 將其降低，則使用設有上限的視窗）：低於 20% 時發出警告，最低門檻為 **8k**；低於 10% 時強制阻擋，最低門檻為 **4k**（門檻會以有效情境視窗為上限，避免過大的模型中繼資料拒絕有效的使用者上限）。請降低 `contextWindow`，或提高伺服器/模型的情境限制。
- **`messages[].content ... expected a string`？** 請在該模型項目中新增 `compat.requiresStringContent: true`。
- **`validation.keys`，或「訊息項目只允許 `role` 和 `content`」？** 請在該模型項目中新增 `compat.strictMessageKeys: true`。
- **直接呼叫 `/v1/chat/completions` 可正常運作，但 `openclaw infer model run --local` 在 Gemma 或其他本機模型上失敗？** 請先檢查供應商 URL、模型參照、驗證標記和伺服器記錄——`model run` 會完全略過代理工具。如果 `model run` 成功，但較大型的代理回合失敗，請使用 `localModelLean` 或 `compat.supportsTools: false` 縮減工具範圍。
- **工具呼叫顯示為原始 JSON/XML/ReAct 文字，或供應商傳回空的 `tool_calls` 陣列？** 請勿新增會盲目將助理文字轉換成工具執行的 Proxy——請先修正伺服器的聊天範本/剖析器。如果模型只在強制使用工具時才能運作，請新增上述 `params.extra_body.tool_choice: "required"` 覆寫，並僅將該模型項目用於預期每個回合都會呼叫工具的工作階段。
- **安全性**：本機模型會略過供應商端的篩選器。請限縮代理範圍並啟用壓縮，以限制提示詞注入的影響範圍。

## 相關內容

- [設定參考](/zh-TW/gateway/configuration-reference)
- [模型容錯移轉](/zh-TW/concepts/model-failover)
