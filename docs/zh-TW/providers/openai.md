---
read_when:
    - 您想在 OpenClaw 中使用 OpenAI 模型
    - 你想使用 Codex 訂閱驗證，而不是 API 金鑰
    - 您需要更嚴格的 GPT-5 代理執行行為
summary: 在 OpenClaw 中透過 API 金鑰或 Codex 訂閱使用 OpenAI
title: OpenAI
x-i18n:
    generated_at: "2026-05-02T02:58:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7e98179f5a7d90289ed6cdad1c4dd03834f42e3fcc747d24c7d29a47e103392
    source_path: providers/openai.md
    workflow: 16
---

OpenAI 為 GPT 模型提供開發者 API，而 Codex 也可透過 OpenAI 的 Codex 用戶端，作為 ChatGPT 方案的程式撰寫代理使用。OpenClaw 會將這些介面分開，讓設定維持可預測。

OpenClaw 支援三種 OpenAI 系列路由。大多數想要 Codex 行為的 ChatGPT/Codex 訂閱者應使用原生 Codex app-server 執行階段。模型前綴會選擇提供者/模型名稱；另一個執行階段設定會選擇由誰執行嵌入式代理迴圈：

- **API 金鑰** - 直接使用按用量計費的 OpenAI Platform 存取權（`openai/*` 模型）
- **搭配原生 Codex 執行階段的 Codex 訂閱** - ChatGPT/Codex 登入加上 Codex app-server 執行（`openai/*` 模型加上 `agents.defaults.agentRuntime.id: "codex"`）
- **透過 PI 的 Codex 訂閱** - 使用一般 OpenClaw PI runner 的 ChatGPT/Codex 登入（`openai-codex/*` 模型）

OpenAI 明確支援在 OpenClaw 這類外部工具和工作流程中使用訂閱 OAuth。

提供者、模型、執行階段和頻道是分開的層。如果這些標籤混在一起，請先閱讀 [代理執行階段](/zh-TW/concepts/agent-runtimes)，再變更設定。

## 快速選擇

| 目標                                                 | 使用                                             | 備註                                                                     |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| 搭配原生 Codex 執行階段的 ChatGPT/Codex 訂閱 | `openai/gpt-5.5` 加上 `agentRuntime.id: "codex"` | 建議多數使用者採用的 Codex 設定。使用 `openai-codex` 驗證登入。 |
| 直接 API 金鑰計費                               | `openai/gpt-5.5`                                 | 設定 `OPENAI_API_KEY` 或執行 OpenAI API 金鑰導引。                    |
| 透過 PI 的 ChatGPT/Codex 訂閱驗證           | `openai-codex/gpt-5.5`                           | 僅在你刻意想使用一般 PI runner 時使用。                |
| 影像生成或編輯                          | `openai/gpt-image-2`                             | 可搭配 `OPENAI_API_KEY` 或 OpenAI Codex OAuth 使用。                 |
| 透明背景影像                        | `openai/gpt-image-1.5`                           | 使用 `outputFormat=png` 或 `webp`，以及 `openai.background=transparent`。     |

## 命名對照

這些名稱相似，但不可互換：

| 你看到的名稱                       | 層級             | 意義                                                                                           |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | 提供者前綴   | 直接 OpenAI Platform API 路由。                                                                 |
| `openai-codex`                     | 提供者前綴   | 透過一般 OpenClaw PI runner 的 OpenAI Codex OAuth/訂閱路由。                      |
| `codex` plugin                     | Plugin            | 內建的 OpenClaw Plugin，提供原生 Codex app-server 執行階段和 `/codex` 聊天控制。 |
| `agentRuntime.id: codex`           | 代理執行階段     | 強制嵌入式回合使用原生 Codex app-server harness。                                     |
| `/codex ...`                       | 聊天命令集  | 從對話中繫結/控制 Codex app-server 執行緒。                                        |
| `runtime: "acp", agentId: "codex"` | ACP 工作階段路由 | 透過 ACP/acpx 執行 Codex 的明確後援路徑。                                          |

這表示一個設定可以刻意同時包含 `openai-codex/*` 和 `codex` plugin。當你想要透過 PI 使用 Codex OAuth，同時也想提供原生 `/codex` 聊天控制時，這是有效的。`openclaw doctor` 會針對這種組合提出警告，讓你確認這是刻意設定；它不會重寫設定。

<Note>
GPT-5.5 可透過直接 OpenAI Platform API 金鑰存取和訂閱/OAuth 路由使用。若要使用 ChatGPT/Codex 訂閱加上原生 Codex 執行，請使用 `openai/gpt-5.5` 搭配 `agentRuntime.id: "codex"`。只有在透過 PI 使用 Codex OAuth 時才使用 `openai-codex/gpt-5.5`；若是直接 `OPENAI_API_KEY` 流量，則使用沒有 Codex 執行階段覆寫的 `openai/gpt-5.5`。
</Note>

<Note>
啟用 OpenAI plugin，或選取 `openai-codex/*` 模型，不會啟用內建的 Codex app-server plugin。OpenClaw 只會在你明確使用 `agentRuntime.id: "codex"` 選取原生 Codex harness，或使用舊版 `codex/*` 模型參照時，才啟用該 Plugin。
如果內建 `codex` plugin 已啟用，但 `openai-codex/*` 仍透過 PI 解析，`openclaw doctor` 會提出警告並保持路由不變。
</Note>

## OpenClaw 功能涵蓋範圍

| OpenAI 能力         | OpenClaw 介面                                           | 狀態                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| 聊天 / Responses          | `openai/<model>` 模型提供者                            | 是                                                    |
| Codex 訂閱模型 | `openai-codex/<model>` 搭配 `openai-codex` OAuth           | 是                                                    |
| Codex app-server harness  | `openai/<model>` 搭配 `agentRuntime.id: codex`             | 是                                                    |
| 伺服器端網頁搜尋    | 原生 OpenAI Responses 工具                               | 是，當網頁搜尋已啟用且未固定提供者時 |
| 影像                    | `image_generate`                                           | 是                                                    |
| 影片                    | `video_generate`                                           | 是                                                    |
| 文字轉語音            | `messages.tts.provider: "openai"` / `tts`                  | 是                                                    |
| 批次語音轉文字      | `tools.media.audio` / 媒體理解                  | 是                                                    |
| 串流語音轉文字  | Voice Call `streaming.provider: "openai"`                  | 是                                                    |
| 即時語音            | Voice Call `realtime.provider: "openai"` / Control UI Talk | 是                                                    |
| 嵌入                | 記憶嵌入提供者                                  | 是                                                    |

## 記憶嵌入

OpenClaw 可以使用 OpenAI，或相容 OpenAI 的嵌入端點，來進行 `memory_search` 索引和查詢嵌入：

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

對於需要非對稱嵌入標籤的 OpenAI 相容端點，請在 `memorySearch` 下設定 `queryInputType` 和 `documentInputType`。OpenClaw 會將這些轉送為提供者專屬的 `input_type` 請求欄位：查詢嵌入使用 `queryInputType`；已索引的記憶片段和批次索引使用 `documentInputType`。完整範例請參閱[記憶設定參考](/zh-TW/reference/memory-config#provider-specific-config)。

## 開始使用

選擇偏好的驗證方法，並依照設定步驟操作。

<Tabs>
  <Tab title="API 金鑰 (OpenAI Platform)">
    **最適合：** 直接 API 存取與按用量計費。

    <Steps>
      <Step title="取得你的 API 金鑰">
        從 [OpenAI Platform dashboard](https://platform.openai.com/api-keys) 建立或複製 API 金鑰。
      </Step>
      <Step title="執行導引">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        或直接傳入金鑰：

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="驗證模型可用">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### 路由摘要

    | 模型參照              | 執行階段設定             | 路由                       | 驗證             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | omitted / `agentRuntime.id: "pi"`    | 直接 OpenAI Platform API  | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | omitted / `agentRuntime.id: "pi"`    | 直接 OpenAI Platform API  | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Codex app-server harness    | Codex app-server |

    <Note>
    除非你明確強制使用 Codex app-server harness，否則 `openai/*` 是直接 OpenAI API 金鑰路由。若要透過預設 PI runner 使用 Codex OAuth，請使用 `openai-codex/*`；若要原生 Codex app-server 執行，請使用 `openai/gpt-5.5` 搭配 `agentRuntime.id: "codex"`。
    </Note>

    ### 設定範例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw 不會公開 `openai/gpt-5.3-codex-spark`。即時 OpenAI API 請求會拒絕該模型，而且目前的 Codex 型錄也未公開它。
    </Warning>

  </Tab>

  <Tab title="Codex 訂閱">
    **最適合：** 使用你的 ChatGPT/Codex 訂閱搭配原生 Codex app-server 執行，而不是另一組 API 金鑰。Codex cloud 需要 ChatGPT 登入。

    <Steps>
      <Step title="執行 Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        或直接執行 OAuth：

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        對於無介面或不利回呼的設定，加入 `--device-code`，即可使用 ChatGPT 裝置代碼流程登入，而不是 localhost 瀏覽器回呼：

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="使用原生 Codex 執行階段">
        ```bash
        openclaw config set plugins.entries.codex '{ enabled: true }' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{ id: "codex", fallback: "none" }' --strict-json
        ```
      </Step>
      <Step title="驗證 Codex 驗證可用">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Gateway 執行後，在聊天中傳送 `/codex status` 或 `/codex models`，以驗證原生 app-server 執行階段。
      </Step>
    </Steps>

    ### 路由摘要

    | 模型參照 | 執行階段設定 | 路由 | 驗證 |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | 原生 Codex app-server harness | Codex 登入或選取的 `openai-codex` 設定檔 |
    | `openai-codex/gpt-5.5` | omitted / `runtime: "pi"` | 透過 PI 的 ChatGPT/Codex OAuth | Codex 登入 |
    | `openai-codex/gpt-5.4-mini` | omitted / `runtime: "pi"` | 透過 PI 的 ChatGPT/Codex OAuth | Codex 登入 |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | 除非 Plugin 明確宣告 `openai-codex`，否則仍為 PI | Codex 登入 |

    <Note>
    持續使用 `openai-codex` provider id 進行 auth/profile 命令。`openai-codex/*` 模型前綴也是 Codex OAuth 的明確 PI 路由。它不會選取或自動啟用內建 Codex app-server harness。對於常見的訂閱加原生執行階段設定，請使用 `openai-codex` 登入，但將模型參照保持為 `openai/gpt-5.5`，並設定 `agentRuntime.id: "codex"`。
    </Note>

    ### 設定範例

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex", fallback: "none" },
        },
      },
    }
    ```

    若要改為讓 Codex OAuth 保持在一般 PI runner 上，請使用 `openai-codex/gpt-5.5`，並省略 Codex 執行階段覆寫。

    <Note>
    Onboarding 不再從 `~/.codex` 匯入 OAuth 材料。請使用瀏覽器 OAuth（預設）或上方的裝置碼流程登入；OpenClaw 會在自己的 agent auth store 中管理產生的憑證。
    </Note>

    ### 狀態指示器

    Chat `/status` 會顯示目前工作階段正在使用哪個模型執行階段。預設 PI harness 會顯示為 `Runtime: OpenClaw Pi Default`。選取內建 Codex app-server harness 時，`/status` 會顯示 `Runtime: OpenAI Codex`。既有工作階段會保留其記錄的 harness id，因此若你希望 `/status` 反映新的 PI/Codex 選擇，請在變更 `agentRuntime` 後使用 `/new` 或 `/reset`。

    ### Doctor 警告

    如果啟用了內建 `codex` Plugin，同時選取了 `openai-codex/*` 路由，`openclaw doctor` 會警告模型仍會透過 PI 解析。只有在該 PI 訂閱驗證路由是刻意設定時，才保持設定不變。若你想要原生 Codex app-server 執行，請切換到 `openai/<model>` 加上 `agentRuntime.id: "codex"`。

    ### 內容視窗上限

    OpenClaw 將模型中繼資料和執行階段內容上限視為不同值。

    對於透過 Codex OAuth 的 `openai-codex/gpt-5.5`：

    - 原生 `contextWindow`：`1000000`
    - 預設執行階段 `contextTokens` 上限：`272000`

    較小的預設上限在實務上具有較佳的延遲與品質特性。可用 `contextTokens` 覆寫：

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    使用 `contextWindow` 宣告原生模型中繼資料。使用 `contextTokens` 限制執行階段內容預算。
    </Note>

    ### 型錄復原

    當上游 Codex 型錄中繼資料中存在 `gpt-5.5` 時，OpenClaw 會使用它。如果即時 Codex 探索在帳戶已驗證時省略 `openai-codex/gpt-5.5` 列，OpenClaw 會合成該 OAuth 模型列，讓 cron、sub-agent 和已設定的預設模型執行不會因 `Unknown model` 而失敗。

  </Tab>
</Tabs>

## 原生 Codex app-server 驗證

原生 Codex app-server harness 使用 `openai/*` 模型參照加上 `agentRuntime.id: "codex"`，但其驗證仍以帳戶為基礎。OpenClaw 會依此順序選取驗證：

1. 明確繫結至 agent 的 OpenClaw `openai-codex` auth profile。
2. app-server 的既有帳戶，例如本機 Codex CLI ChatGPT 登入。
3. 僅適用於本機 stdio app-server 啟動，當 app-server 回報沒有帳戶且仍需要 OpenAI 驗證時，使用 `CODEX_API_KEY`，再使用 `OPENAI_API_KEY`。

這表示本機 ChatGPT/Codex 訂閱登入不會只因 Gateway 程序同時有供直接 OpenAI 模型或 embeddings 使用的 `OPENAI_API_KEY` 而被取代。Env API-key fallback 只適用於本機 stdio 無帳戶路徑；它不會傳送到 WebSocket app-server 連線。當選取訂閱樣式的 Codex profile 時，OpenClaw 也會避免將 `CODEX_API_KEY` 和 `OPENAI_API_KEY` 放入衍生的 stdio app-server 子程序，並透過 app-server login RPC 傳送所選憑證。

## 圖像生成

內建 `openai` Plugin 透過 `image_generate` 工具註冊圖像生成。它透過相同的 `openai/gpt-image-2` 模型參照，同時支援 OpenAI API-key 圖像生成和 Codex OAuth 圖像生成。

| 能力                      | OpenAI API 金鑰                   | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| 模型參照                  | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 驗證                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth 登入              |
| 傳輸                      | OpenAI Images API                  | Codex Responses 後端                 |
| 每個請求的最大圖像數      | 4                                  | 4                                    |
| 編輯模式                  | 已啟用（最多 5 張參考圖像）       | 已啟用（最多 5 張參考圖像）         |
| 尺寸覆寫                  | 支援，包括 2K/4K 尺寸             | 支援，包括 2K/4K 尺寸               |
| 長寬比 / 解析度           | 不會轉送至 OpenAI Images API       | 安全時會對應至支援的尺寸            |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
請參閱[圖像生成](/zh-TW/tools/image-generation)，了解共用工具參數、provider 選取與 failover 行為。
</Note>

`gpt-image-2` 是 OpenAI 文字轉圖像生成與圖像編輯的預設值。`gpt-image-1.5`、`gpt-image-1` 和 `gpt-image-1-mini` 仍可作為明確模型覆寫使用。若要輸出透明背景 PNG/WebP，請使用 `openai/gpt-image-1.5`；目前的 `gpt-image-2` API 會拒絕 `background: "transparent"`。

對於透明背景請求，agents 應使用 `model: "openai/gpt-image-1.5"`、`outputFormat: "png"` 或 `"webp"`，以及 `background: "transparent"` 呼叫 `image_generate`；較舊的 `openai.background` provider 選項仍可接受。OpenClaw 也會保護公開 OpenAI 和 OpenAI Codex OAuth 路由，將預設 `openai/gpt-image-2` 透明請求改寫為 `gpt-image-1.5`；Azure 和自訂 OpenAI 相容端點會保留其已設定的部署/模型名稱。

相同設定也公開給 headless CLI 執行使用：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

從輸入檔案開始時，請搭配 `openclaw infer image edit` 使用相同的 `--output-format` 和 `--background` 旗標。`--openai-background` 仍可作為 OpenAI 專用別名使用。

對於 Codex OAuth 安裝，請保持相同的 `openai/gpt-image-2` 參照。設定 `openai-codex` OAuth profile 後，OpenClaw 會解析該儲存的 OAuth access token，並透過 Codex Responses 後端傳送圖像請求。它不會先嘗試 `OPENAI_API_KEY`，也不會針對該請求默默 fallback 到 API 金鑰。當你想改用直接 OpenAI Images API 路由時，請使用 API 金鑰、自訂 base URL 或 Azure 端點明確設定 `models.providers.openai`。
如果該自訂圖像端點位於受信任的 LAN/私人位址，也請設定 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`；除非存在此 opt-in，OpenClaw 會持續封鎖私人/內部 OpenAI 相容圖像端點。

生成：

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

生成透明 PNG：

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

編輯：

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## 影片生成

內建 `openai` Plugin 透過 `video_generate` 工具註冊影片生成。

| 能力       | 值                                                                                |
| ---------- | --------------------------------------------------------------------------------- |
| 預設模型   | `openai/sora-2`                                                                   |
| 模式       | 文字轉影片、圖像轉影片、單一影片編輯                                             |
| 參考輸入   | 1 張圖像或 1 部影片                                                               |
| 尺寸覆寫   | 支援                                                                              |
| 其他覆寫   | `aspectRatio`、`resolution`、`audio`、`watermark` 會被忽略並顯示工具警告          |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
請參閱[影片生成](/zh-TW/tools/video-generation)，了解共用工具參數、provider 選取與 failover 行為。
</Note>

## GPT-5 prompt 貢獻

OpenClaw 會為跨 providers 的 GPT-5 系列執行新增共用 GPT-5 prompt 貢獻。它依模型 id 套用，因此 `openai-codex/gpt-5.5`、`openai/gpt-5.5`、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5` 和其他相容的 GPT-5 refs 都會收到相同的 overlay。較舊的 GPT-4.x 模型不會收到。

內建原生 Codex harness 會透過 Codex app-server developer instructions 使用相同的 GPT-5 行為與 heartbeat overlay，因此透過 `agentRuntime.id: "codex"` 強制執行的 `openai/gpt-5.x` 工作階段，即使 Codex 擁有其餘 harness prompt，仍會保留相同的 follow-through 和主動 Heartbeat 指引。

GPT-5 貢獻會新增一個標記的行為合約，涵蓋 persona 持續性、執行安全、工具紀律、輸出形狀、完成檢查與驗證。特定通道回覆和靜默訊息行為會保留在共用 OpenClaw 系統 prompt 和 outbound delivery policy 中。符合模型的 GPT-5 指引永遠啟用。友善互動風格層是獨立且可設定的。

| 值                     | 效果                         |
| ---------------------- | ---------------------------- |
| `"friendly"`（預設）   | 啟用友善互動風格層           |
| `"on"`                 | `"friendly"` 的別名          |
| `"off"`                | 僅停用友善風格層             |

<Tabs>
  <Tab title="設定">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
值在執行階段不區分大小寫，因此 `"Off"` 和 `"off"` 都會停用友善風格層。
</Tip>

<Note>
當未設定共用 `agents.defaults.promptOverlays.gpt5.personality` 設定時，仍會讀取舊版 `plugins.entries.openai.config.personality` 作為相容 fallback。
</Note>

## 語音與語音輸出

<AccordionGroup>
  <Accordion title="語音合成 (TTS)">
    內建 `openai` Plugin 會為 `messages.tts` surface 註冊語音合成。

    | 設定 | 設定路徑 | 預設值 |
    |---------|------------|---------|
    | 模型 | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 語音 | `messages.tts.providers.openai.voice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` | (未設定) |
    | 指示 | `messages.tts.providers.openai.instructions` | (未設定，僅限 `gpt-4o-mini-tts`) |
    | 格式 | `messages.tts.providers.openai.responseFormat` | 語音記事為 `opus`，檔案為 `mp3` |
    | API 金鑰 | `messages.tts.providers.openai.apiKey` | 回退至 `OPENAI_API_KEY` |
    | 基底 URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | 額外主體 | `messages.tts.providers.openai.extraBody` / `extra_body` | (未設定) |

    可用模型：`gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。可用語音：`alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、`marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    `extraBody` 會在 OpenClaw 產生的欄位之後合併到 `/audio/speech` 請求 JSON，因此可將它用於需要額外鍵（例如 `lang`）的 OpenAI 相容端點。原型鍵會被忽略。

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    設定 `OPENAI_TTS_BASE_URL` 可覆寫 TTS 基底 URL，而不影響聊天 API 端點。
    </Note>

  </Accordion>

  <Accordion title="語音轉文字">
    內建的 `openai` Plugin 會透過
    OpenClaw 的媒體理解轉錄介面註冊批次語音轉文字。

    - 預設模型：`gpt-4o-transcribe`
    - 端點：OpenAI REST `/v1/audio/transcriptions`
    - 輸入路徑：multipart 音訊檔案上傳
    - OpenClaw 在任何輸入音訊轉錄使用
      `tools.media.audio` 的地方都支援，包括 Discord 語音頻道片段和頻道
      音訊附件

    若要強制對輸入音訊轉錄使用 OpenAI：

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    當共用音訊媒體設定或每次呼叫的轉錄請求提供語言和提示提示時，這些資訊會轉送給 OpenAI。

  </Accordion>

  <Accordion title="即時轉錄">
    內建的 `openai` Plugin 會為 Voice Call Plugin 註冊即時轉錄。

    | 設定 | 設定路徑 | 預設值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 語言 | `...openai.language` | (未設定) |
    | 提示 | `...openai.prompt` | (未設定) |
    | 靜音持續時間 | `...openai.silenceDurationMs` | `800` |
    | VAD 閾值 | `...openai.vadThreshold` | `0.5` |
    | API 金鑰 | `...openai.apiKey` | 回退至 `OPENAI_API_KEY` |

    <Note>
    使用 WebSocket 連線至 `wss://api.openai.com/v1/realtime`，並使用 G.711 u-law (`g711_ulaw` / `audio/pcmu`) 音訊。此串流提供者用於 Voice Call 的即時轉錄路徑；Discord 語音目前會錄製短片段，並改用批次 `tools.media.audio` 轉錄路徑。
    </Note>

  </Accordion>

  <Accordion title="即時語音">
    內建的 `openai` Plugin 會為 Voice Call Plugin 註冊即時語音。

    | 設定 | 設定路徑 | 預設值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | 語音 | `...openai.voice` | `alloy` |
    | 溫度 | `...openai.temperature` | `0.8` |
    | VAD 閾值 | `...openai.vadThreshold` | `0.5` |
    | 靜音持續時間 | `...openai.silenceDurationMs` | `500` |
    | API 金鑰 | `...openai.apiKey` | 回退至 `OPENAI_API_KEY` |

    <Note>
    透過 `azureEndpoint` 和 `azureDeployment` 設定鍵支援 Azure OpenAI，以供後端即時橋接使用。支援雙向工具呼叫。使用 G.711 u-law 音訊格式。
    </Note>

    <Note>
    Control UI Talk 使用 OpenAI 瀏覽器即時工作階段，搭配 Gateway 簽發的
    暫時性用戶端密鑰，並直接對
    OpenAI Realtime API 進行瀏覽器 WebRTC SDP 交換。維護者可使用
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
    進行即時驗證；
    OpenAI 端會在 Node 中簽發用戶端密鑰，使用假麥克風媒體產生瀏覽器 SDP offer，
    將其發送到 OpenAI，並套用 SDP answer，
    且不記錄密鑰。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI 端點

內建的 `openai` 提供者可透過覆寫基底 URL，將影像
產生指向 Azure OpenAI 資源。在影像產生路徑上，OpenClaw
會偵測 `models.providers.openai.baseUrl` 上的 Azure 主機名稱，並自動切換至
Azure 的請求形狀。

<Note>
即時語音使用獨立的設定路徑
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)，
且不受 `models.providers.openai.baseUrl` 影響。請參閱 [語音和語音處理](#voice-and-speech) 下的**即時
語音**摺疊區塊，以了解其 Azure
設定。
</Note>

在以下情況使用 Azure OpenAI：

- 你已擁有 Azure OpenAI 訂閱、配額或企業協議
- 你需要 Azure 提供的區域資料落地或合規控制
- 你想將流量維持在既有 Azure 租用戶內

### 設定

若要透過內建的 `openai` 提供者進行 Azure 影像產生，請將
`models.providers.openai.baseUrl` 指向你的 Azure 資源，並將 `apiKey` 設為
Azure OpenAI 金鑰（不是 OpenAI Platform 金鑰）：

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw 會辨識下列 Azure 主機尾碼，以用於 Azure 影像產生
路由：

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

對於辨識出的 Azure 主機上的影像產生請求，OpenClaw 會：

- 傳送 `api-key` 標頭，而不是 `Authorization: Bearer`
- 使用部署範圍路徑 (`/openai/deployments/{deployment}/...`)
- 將 `?api-version=...` 附加到每個請求
- 對 Azure 影像產生呼叫使用 600 秒的預設請求逾時。
  每次呼叫的 `timeoutMs` 值仍會覆寫此預設值。

其他基底 URL（公開 OpenAI、OpenAI 相容代理）會保留標準
OpenAI 影像請求形狀。

<Note>
`openai` 提供者影像產生路徑的 Azure 路由需要
OpenClaw 2026.4.22 或更新版本。較早版本會將任何自訂
`openai.baseUrl` 視為公開 OpenAI 端點，並會在 Azure
影像部署上失敗。
</Note>

### API 版本

設定 `AZURE_OPENAI_API_VERSION` 可為 Azure 影像產生路徑固定特定的 Azure 預覽版或 GA 版本：

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

變數未設定時，預設值為 `2024-12-01-preview`。

### 模型名稱就是部署名稱

Azure OpenAI 會將模型繫結到部署。對於透過內建 `openai` 提供者
路由的 Azure 影像產生請求，OpenClaw 中的 `model` 欄位
必須是你在 Azure 入口網站中設定的 **Azure 部署名稱**，
而不是公開 OpenAI 模型 ID。

如果你建立一個名為 `gpt-image-2-prod` 且提供 `gpt-image-2` 服務的部署：

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

相同的部署名稱規則適用於透過
內建 `openai` 提供者路由的影像產生呼叫。

### 區域可用性

Azure 影像產生目前僅在部分區域
可用（例如 `eastus2`、`swedencentral`、`polandcentral`、`westus3`、
`uaenorth`）。建立
部署前，請查看 Microsoft 目前的區域清單，並確認你的區域提供該特定模型。

### 參數差異

Azure OpenAI 和公開 OpenAI 不一定接受相同的影像參數。
Azure 可能會拒絕公開 OpenAI 允許的選項（例如
`gpt-image-2` 上的某些 `background` 值），或只在特定模型
版本上公開它們。這些差異來自 Azure 和底層模型，而不是
OpenClaw。如果 Azure 請求因驗證錯誤而失敗，請在
Azure 入口網站中查看你的特定部署和 API 版本支援的
參數集。

<Note>
Azure OpenAI 使用原生傳輸和相容行為，但不會接收
OpenClaw 的隱藏歸因標頭 — 請參閱 [進階設定](#advanced-configuration) 下的**原生與 OpenAI 相容
路由**摺疊區塊。

對於 Azure 上的聊天或 Responses 流量（影像產生之外），請使用
上線流程或專用 Azure 提供者設定 — 單獨使用 `openai.baseUrl`
不會採用 Azure API/驗證形狀。另有一個獨立的
`azure-openai-responses/*` 提供者；請參閱下方的伺服器端 Compaction 摺疊區塊。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="傳輸（WebSocket 與 SSE）">
    OpenClaw 對 `openai/*` 和 `openai-codex/*` 都採用 WebSocket 優先，並以 SSE 後備 (`"auto"`)。

    在 `"auto"` 模式中，OpenClaw：
    - 會在回退至 SSE 前重試一次早期 WebSocket 失敗
    - 失敗後，將 WebSocket 標記為降級約 60 秒，並在冷卻期間使用 SSE
    - 為重試和重新連線附加穩定的工作階段和回合身分標頭
    - 在傳輸變體之間正規化使用量計數器 (`input_tokens` / `prompt_tokens`)

    | 值 | 行為 |
    |-------|----------|
    | `"auto"`（預設） | WebSocket 優先，SSE 後備 |
    | `"sse"` | 僅強制使用 SSE |
    | `"websocket"` | 僅強制使用 WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    相關 OpenAI 文件：
    - [使用 WebSocket 的 Realtime API](https://platform.openai.com/docs/guides/realtime-websocket)
    - [串流 API 回應 (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket 預熱">
    OpenClaw 預設會為 `openai/*` 和 `openai-codex/*` 啟用 WebSocket 預熱，以降低第一回合延遲。

    ```json5
    // 停用預熱
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="快速模式">
    OpenClaw 為 `openai/*` 和 `openai-codex/*` 公開共用的快速模式切換：

    - **聊天/UI：** `/fast status|on|off`
    - **設定：** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    啟用後，OpenClaw 會將快速模式對應至 OpenAI 優先處理 (`service_tier = "priority"`)。既有的 `service_tier` 值會保留，且快速模式不會改寫 `reasoning` 或 `text.verbosity`。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    工作階段覆寫優先於設定。在 Sessions UI 中清除工作階段覆寫，會讓工作階段回到設定的預設值。
    </Note>

  </Accordion>

  <Accordion title="優先處理 (service_tier)">
    OpenAI 的 API 透過 `service_tier` 公開優先處理。可在 OpenClaw 中按模型設定：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    支援的值：`auto`、`default`、`flex`、`priority`。

    <Warning>
    `serviceTier` 只會轉送到原生 OpenAI 端點（`api.openai.com`）和原生 Codex 端點（`chatgpt.com/backend-api`）。如果你透過代理路由任一提供者，OpenClaw 會保持 `service_tier` 不變。
    </Warning>

  </Accordion>

  <Accordion title="伺服器端 Compaction（Responses API）">
    對於直接 OpenAI Responses 模型（`openai/*` 於 `api.openai.com`），OpenAI Plugin 的 Pi harness 串流包裝器會自動啟用伺服器端 Compaction：

    - 強制 `store: true`（除非模型相容性設定 `supportsStore: false`）
    - 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - 預設 `compact_threshold`：`contextWindow` 的 70%（無法取得時為 `80000`）

    這會套用到內建 Pi harness 路徑，以及嵌入式執行使用的 OpenAI 提供者 hooks。原生 Codex 應用伺服器 harness 透過 Codex 管理自己的內容脈絡，並以 `agents.defaults.agentRuntime.id` 分開設定。

    <Tabs>
      <Tab title="明確啟用">
        適用於 Azure OpenAI Responses 等相容端點：

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="自訂閾值">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="停用">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` 只控制 `context_management` 注入。直接 OpenAI Responses 模型仍會強制 `store: true`，除非相容性設定 `supportsStore: false`。
    </Note>

  </Accordion>

  <Accordion title="嚴格代理式 GPT 模式">
    對於 `openai/*` 上的 GPT-5 系列執行，OpenClaw 可以使用更嚴格的嵌入式執行合約：

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    使用 `strict-agentic` 時，OpenClaw 會：
    - 當工具動作可用時，不再將僅有計畫的回合視為成功進展
    - 以立即執行導向重試該回合
    - 對實質工作自動啟用 `update_plan`
    - 如果模型持續只規劃而不行動，顯示明確的受阻狀態

    <Note>
    僅限於 OpenAI 和 Codex GPT-5 系列執行。其他提供者和較舊模型系列會保留預設行為。
    </Note>

  </Accordion>

  <Accordion title="原生與 OpenAI 相容路由">
    OpenClaw 會以不同方式處理直接 OpenAI、Codex 和 Azure OpenAI 端點，以及通用 OpenAI 相容 `/v1` 代理：

    **原生路由**（`openai/*`、Azure OpenAI）：
    - 僅對支援 OpenAI `none` effort 的模型保留 `reasoning: { effort: "none" }`
    - 對於會拒絕 `reasoning.effort: "none"` 的模型或代理，省略停用的 reasoning
    - 預設將工具 schema 設為嚴格模式
    - 只在已驗證的原生主機上附加隱藏歸因標頭
    - 保留 OpenAI 專用請求成形（`service_tier`、`store`、reasoning 相容性、prompt-cache 提示）

    **代理／相容路由：**
    - 使用較寬鬆的相容行為
    - 從非原生 `openai-completions` payload 移除 Completions `store`
    - 接受進階 `params.extra_body`/`params.extraBody` 透傳 JSON，用於 OpenAI 相容 Completions 代理
    - 接受 `params.chat_template_kwargs`，用於 vLLM 等 OpenAI 相容 Completions 代理
    - 不強制使用嚴格工具 schema 或僅限原生的標頭

    Azure OpenAI 使用原生傳輸和相容行為，但不會接收隱藏歸因標頭。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型 refs 和容錯移轉行為。
  </Card>
  <Card title="圖片生成" href="/zh-TW/tools/image-generation" icon="image">
    共用圖片工具參數和提供者選擇。
  </Card>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用影片工具參數和提供者選擇。
  </Card>
  <Card title="OAuth 與驗證" href="/zh-TW/gateway/authentication" icon="key">
    驗證詳細資料和憑證重用規則。
  </Card>
</CardGroup>
