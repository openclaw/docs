---
read_when:
    - 你想要從自己的 GPU 主機提供模型服務
    - 你正在連接 LM Studio 或 OpenAI 相容的代理
    - 你需要最安全的本機模型指引
summary: 在本機 LLM 上執行 OpenClaw（LM Studio、vLLM、LiteLLM、自訂 OpenAI 端點）
title: 本機模型
x-i18n:
    generated_at: "2026-06-27T19:19:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 671c92d78fa29c778fd34b6df027cc8f9e7ad507c9d446700d97cd789becd041
    source_path: gateway/local-models.md
    workflow: 16
---

本機模型是可行的。它們也提高了硬體、上下文大小和提示注入防禦的門檻——小型或激進量化的卡會截斷上下文並造成安全性外洩。本頁是針對較高階本機堆疊和自訂 OpenAI 相容本機伺服器的主觀指南。若要最順暢地開始設定，請從 [LM Studio](/zh-TW/providers/lmstudio) 或 [Ollama](/zh-TW/providers/ollama) 與 `openclaw onboard` 開始。

若本機伺服器應該只在選定模型需要它們時才啟動，請參閱
[本機模型服務](/zh-TW/gateway/local-model-services)。

## 硬體下限

目標要高：**≥2 台滿配 Mac Studio 或等效 GPU 設備（約 $30k+）**，才能有舒適的代理迴圈。單張 **24 GB** GPU 只適合較輕量提示，且延遲較高。請一律執行**你能託管的最大／完整大小變體**；小型或高度量化的檢查點會提高提示注入風險（請參閱[安全性](/zh-TW/gateway/security)）。

## 選擇後端

| 後端                                                 | 適用情境                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [ds4](/zh-TW/providers/ds4)                                | 在 macOS Metal 上執行本機 DeepSeek V4 Flash，並支援 OpenAI 相容工具呼叫    |
| [LM Studio](/zh-TW/providers/lmstudio)                     | 首次本機設定、GUI 載入器、原生 Responses API                               |
| LiteLLM / OAI-proxy / custom OpenAI-compatible proxy | 你在另一個模型 API 前端代理，且需要 OpenClaw 將其視為 OpenAI               |
| MLX / vLLM / SGLang                                  | 透過 OpenAI 相容 HTTP 端點進行高吞吐量自託管服務                           |
| [Ollama](/zh-TW/providers/ollama)                          | 命令列介面工作流程、模型函式庫、免操作 systemd 服務                        |

後端支援時請使用 Responses API（`api: "openai-responses"`）（LM Studio 支援）。否則請維持使用 Chat Completions（`api: "openai-completions"`）。

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA 使用者：**官方 Ollama Linux 安裝程式會啟用帶有 `Restart=always` 的 systemd 服務。在 WSL2 GPU 設定中，自動啟動可能會在開機時重新載入上一個模型並占住主機記憶體。如果你的 WSL2 VM 在啟用 Ollama 後反覆重新啟動，請參閱 [WSL2 當機迴圈](/zh-TW/providers/ollama#wsl2-crash-loop-repeated-reboots)。
</Warning>

## 建議：LM Studio + 大型本機模型（Responses API）

目前最佳的本機堆疊。在 LM Studio 中載入大型模型（例如完整大小的 Qwen、DeepSeek 或 Llama 建置），啟用本機伺服器（預設 `http://127.0.0.1:1234`），並使用 Responses API 將推理與最終文字分開。

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
- 在 LM Studio 中下載**可用的最大模型建置**（避免「small」／高度量化變體）、啟動伺服器，確認 `http://127.0.0.1:1234/v1/models` 會列出它。
- 將 `my-local-model` 替換為 LM Studio 顯示的實際模型 ID。
- 保持模型已載入；冷載入會增加啟動延遲。
- 如果你的 LM Studio 建置不同，請調整 `contextWindow`/`maxTokens`。
- 對 WhatsApp，請維持使用 Responses API，讓只有最終文字會被傳送。

即使執行本機模型，也請保留託管模型設定；使用 `models.mode: "merge"`，讓備援仍可使用。

### 混合設定：託管主要模型、本機備援

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

### 本機優先並保留託管安全網

交換主要模型與備援的順序；保留相同的 providers 區塊與 `models.mode: "merge"`，讓你在本機機器停機時可以備援到 Sonnet 或 Opus。

### 區域託管／資料路由

- 託管的 MiniMax/Kimi/GLM 變體也存在於 OpenRouter，並提供區域固定端點（例如託管於美國）。在那裡選擇區域變體，即可在仍使用 `models.mode: "merge"` 取得 Anthropic/OpenAI 備援的同時，讓流量留在你選定的司法管轄區。
- 純本機仍是最強的隱私路徑；當你需要供應商功能但又想控制資料流時，託管區域路由是折衷方案。

## 其他 OpenAI 相容本機代理

MLX（`mlx_lm.server`）、vLLM、SGLang、LiteLLM、OAI-proxy 或自訂
閘道都可以運作，只要它們公開 OpenAI 風格的 `/v1/chat/completions`
端點。除非後端明確記錄支援 `/v1/responses`，否則請使用 Chat Completions
配接器。將上方的 provider 區塊替換為你的端點和模型 ID：

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
`openai-completions`。自訂／本機 provider 項目會信任其精確設定的
`baseUrl` 來源，以處理受保護的模型請求，包括回送、LAN、tailnet
和私人 DNS 主機。傳送到其他私人來源的請求仍需要
`request.allowPrivateNetwork: true`；metadata/link-local 來源在沒有明確選擇加入時仍會被封鎖。將它設為 `false` 可選擇退出精確來源信任。

`models.providers.<id>.models[].id` 值是 provider 本機的。不要在那裡
包含 provider 前綴。例如，使用
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` 啟動的 MLX 伺服器，應使用此
目錄 ID 和模型參照：

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

在本機或代理的視覺模型上設定 `input: ["text", "image"]`，讓圖片
附件注入代理回合。互動式自訂 provider
onboarding 會推斷常見視覺模型 ID，且只詢問未知名稱。
非互動式 onboarding 使用相同推斷；未知視覺 ID 請使用 `--custom-image-input`，
而當看似已知的模型在你的端點後方實際上僅支援文字時，請使用 `--custom-text-input`。

保留 `models.mode: "merge"`，讓託管模型可作為備援使用。
對緩慢的本機或遠端模型伺服器，請先使用 `models.providers.<id>.timeoutSeconds`，
再提高 `agents.defaults.timeoutSeconds`。provider 逾時
只套用於模型 HTTP 請求，包括連線、標頭、主體串流，
以及整體受保護擷取中止。如果代理或執行逾時更低，也請提高
該上限，因為 provider 逾時無法延長整個代理執行。

<Note>
對於自訂 OpenAI 相容 provider，當 `baseUrl` 解析為回送、私人 LAN、`.local` 或裸主機名稱時，允許持久化非機密本機標記，例如 `apiKey: "ollama-local"`。OpenClaw 會將其視為有效的本機憑證，而不是回報金鑰遺失。任何接受公開主機名稱的 provider 都應使用真實值。
</Note>

本機／代理 `/v1` 後端的行為備註：

- OpenClaw 會將這些視為代理風格的 OpenAI 相容路由，而不是原生
  OpenAI 端點
- 原生 OpenAI 專用請求塑形不適用於此處：沒有
  `service_tier`、沒有 Responses `store`、沒有 OpenAI 推理相容承載
  塑形，也沒有提示快取提示
- 隱藏的 OpenClaw 歸因標頭（`originator`、`version`、`User-Agent`）
  不會注入這些自訂代理 URL

更嚴格 OpenAI 相容後端的相容性備註：

- 有些伺服器在 Chat Completions 上只接受字串 `messages[].content`，不接受
  結構化 content-part 陣列。對這些端點請設定
  `models.providers.<provider>.models[].compat.requiresStringContent: true`。
- 有些本機模型會以文字輸出獨立的括號工具請求，例如
  `[tool_name]` 後接 JSON 與 `[END_TOOL_REQUEST]`。只有當名稱完全符合該回合中已註冊的
  工具時，OpenClaw 才會將其提升為真正的工具呼叫；否則該區塊會被視為不支援的文字，並
  從使用者可見回覆中隱藏。
- 如果模型輸出看似工具呼叫的 JSON、XML 或 ReAct 風格文字，
  但 provider 未輸出結構化叫用，OpenClaw 會將其保留為
  文字，並在可用時記錄警告，包含執行 ID、provider/model、偵測到的模式與
  工具名稱。請將其視為 provider/model 工具呼叫
  不相容，而不是已完成的工具執行。
- 如果工具以助理文字形式出現而不是執行，例如原始 JSON、
  XML、ReAct 語法，或 provider 回應中有空的 `tool_calls` 陣列，
  請先確認伺服器正在使用支援工具呼叫的聊天樣板／剖析器。對於
  其剖析器只有在強制使用工具時才運作的 OpenAI 相容 Chat Completions 後端，
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

  只在每個一般回合都應呼叫工具的模型／工作階段中使用此設定。
  它會覆寫 OpenClaw 的預設代理值 `tool_choice: "auto"`。
  將 `local/my-local-model` 替換為
  `openclaw models list` 顯示的精確 provider/model 參照。

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- 如果自訂 OpenAI 相容模型接受內建設定檔以外的 OpenAI reasoning efforts，
  請在模型 compat 區塊上宣告它們。在此處加入 `"xhigh"`
  會讓 `/think xhigh`、工作階段選擇器、閘道驗證與 `llm-task`
  驗證對該已設定的 provider/model 參照公開此等級：

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

如果模型載入正常，但完整的代理回合行為異常，請由上而下處理：先確認傳輸，再縮小問題範圍。

1. **確認本機模型本身會回應。** 不使用工具、不使用代理上下文：

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **確認閘道路由。** 只傳送提供的提示詞：略過逐字記錄、AGENTS 啟動程序、上下文引擎組裝、工具與內建 MCP 伺服器，但仍會測試閘道路由、驗證與提供者選擇：

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **嘗試精簡模式。** 如果兩個探測都通過，但實際代理回合因工具呼叫格式錯誤或提示詞過大而失敗，請啟用 `agents.defaults.experimental.localModelLean: true`。它會移除三個最重的預設工具（`browser`、`cron`、`message`），並將較大的工具目錄預設放在結構化工具搜尋控制之後，但必須保留直接 `message` 傳遞語意的執行除外。完整說明、使用時機與確認啟用方式，請參閱[實驗性功能 → 本機模型精簡模式](/zh-TW/concepts/experimental-features#local-model-lean-mode)。

4. **最後手段是完全停用工具。** 如果精簡模式仍不足，請為該模型項目設定 `models.providers.<provider>.models[].compat.supportsTools: false`。代理接著會在該模型上不使用工具呼叫運作。

5. **再往後，瓶頸就在上游。** 如果後端在精簡模式與 `supportsTools: false` 後，仍只在較大的 OpenClaw 執行中失敗，剩餘問題通常是上游模型或伺服器容量：上下文視窗、GPU 記憶體、kv-cache 驅逐，或後端錯誤。到那個階段就不是 OpenClaw 的傳輸層問題。

## 疑難排解

- 閘道能連到代理嗎？`curl http://127.0.0.1:1234/v1/models`。
- LM Studio 模型未載入？重新載入；冷啟動是常見的「卡住」原因。
- 本機伺服器顯示 `terminated`、`ECONNRESET`，或在回合中途關閉串流？
  OpenClaw 會在診斷中記錄低基數的 `model.call.error.failureKind`，以及
  OpenClaw 程序 RSS/heap 快照。對於 LM Studio/Ollama
  記憶體壓力，請將該時間戳與伺服器記錄或 macOS 當機 /
  jetsam 記錄比對，以確認模型伺服器是否被終止。
- OpenClaw 會從偵測到的模型視窗推導上下文視窗預檢閾值；若 `agents.defaults.contextTokens` 降低有效視窗，則從未封頂的模型視窗推導。低於 20% 時會警告，且下限為 **8k**。硬性阻擋使用 10% 閾值，且下限為 **4k**，並封頂到有效上下文視窗，避免過大的模型中繼資料拒絕原本有效的使用者上限。如果遇到該預檢，請提高伺服器/模型上下文限制，或選擇更大的模型。
- 上下文錯誤？降低 `contextWindow` 或提高你的伺服器限制。
- OpenAI 相容伺服器回傳 `messages[].content ... expected a string`？
  在該模型項目上加入 `compat.requiresStringContent: true`。
- OpenAI 相容伺服器回傳 `validation.keys`，或表示訊息項目只允許 `role` 和 `content`？
  在該模型項目上加入 `compat.strictMessageKeys: true`。
- 直接的小型 `/v1/chat/completions` 呼叫可用，但 `openclaw infer model run --local`
  在 Gemma 或其他本機模型上失敗？請先檢查提供者 URL、模型參照、驗證
  標記與伺服器記錄；本機 `model run` 不包含代理工具。
  如果本機 `model run` 成功，但較大的代理回合失敗，請使用
  `localModelLean` 或 `compat.supportsTools: false` 減少代理
  工具範圍。
- 工具呼叫以原始 JSON/XML/ReAct 文字顯示，或提供者回傳
  空的 `tool_calls` 陣列？不要加入會盲目將助理
  文字轉換為工具執行的代理。請先修正伺服器聊天範本/剖析器。如果
  模型只有在強制使用工具時才可運作，請加入上方逐模型的
  `params.extra_body.tool_choice: "required"` 覆寫，並只在每個回合都預期有工具呼叫的工作階段中使用該模型
  項目。
- 安全性：本機模型會略過提供者端篩選器；請讓代理範圍保持狹窄並啟用壓縮，以限制提示詞注入的影響範圍。

## 相關

- [設定參考](/zh-TW/gateway/configuration-reference)
- [模型容錯移轉](/zh-TW/concepts/model-failover)
