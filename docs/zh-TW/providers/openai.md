---
read_when:
    - 你想在 OpenClaw 中使用 OpenAI 模型
    - 您想使用 Codex 訂閱身分驗證，而不是 API 金鑰
    - 你需要更嚴格的 GPT-5 代理執行行為
summary: 在 OpenClaw 中透過 API 金鑰或 Codex 訂閱使用 OpenAI
title: OpenAI
x-i18n:
    generated_at: "2026-05-07T13:25:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a37c0b2c227674b6762aea70ce6d640d49044117c9244377058032ade561d6b
    source_path: providers/openai.md
    workflow: 16
---

OpenAI 提供 GPT 模型的開發者 API，而 Codex 也可透過 OpenAI 的 Codex 用戶端，作為
ChatGPT 方案的程式碼代理程式使用。OpenClaw 會將這些介面分開，讓設定保持可預測。

OpenClaw 使用 `openai/*` 作為標準 OpenAI 模型路由。OpenAI 模型上的內嵌代理程式
回合預設會透過原生 Codex app-server 執行環境執行；直接 OpenAI API 金鑰驗證仍可用於
非代理程式 OpenAI 介面，例如圖片、嵌入、語音和即時功能。

- **代理程式模型** - 透過 Codex 執行環境使用 `openai/*` 模型；若要使用 ChatGPT/Codex 訂閱，請以
  `openai-codex` 驗證登入，或在你有意使用 API 金鑰驗證時設定
  `openai-codex` API 金鑰設定檔。
- **非代理程式 OpenAI API** - 透過 `OPENAI_API_KEY` 或 OpenAI API 金鑰導引設定，直接使用 OpenAI Platform 並採用用量計費。
- **舊版設定** - `openai-codex/*` 模型參照會由
  `openclaw doctor --fix` 修復為 `openai/*` 加上 Codex 執行環境。

OpenAI 明確支援在 OpenClaw 這類外部工具和工作流程中使用訂閱 OAuth。

提供者、模型、執行環境和通道是不同層級。如果這些標籤被混在一起，請先閱讀 [代理程式執行環境](/zh-TW/concepts/agent-runtimes)，再變更設定。

## 快速選擇

| 目標                                                 | 使用                                                     | 備註                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| 以原生 Codex 執行環境使用 ChatGPT/Codex 訂閱 | `openai/gpt-5.5`                                        | 預設 OpenAI 代理程式設定。以 `openai-codex` 驗證登入。         |
| 代理程式模型的直接 API 金鑰計費              | `openai/gpt-5.5` 加上一個 `openai-codex` API 金鑰設定檔 | 使用 `auth.order.openai-codex` 以優先使用該設定檔。                 |
| 透過明確 PI 使用直接 API 金鑰計費           | `openai/gpt-5.5` 加上 `agentRuntime.id: "pi"`           | 選取一般的 `openai` API 金鑰設定檔。                             |
| 最新 ChatGPT Instant API 別名                     | `openai/chat-latest`                                    | 僅限直接 API 金鑰。用於實驗的浮動別名，不是預設值。   |
| 透過明確 PI 使用 ChatGPT/Codex 訂閱驗證  | `openai/gpt-5.5` 加上 `agentRuntime.id: "pi"`           | 為相容性路由選取一個 `openai-codex` 驗證設定檔。    |
| 圖片產生或編輯                          | `openai/gpt-image-2`                                    | 可搭配 `OPENAI_API_KEY` 或 OpenAI Codex OAuth 使用。             |
| 透明背景圖片                        | `openai/gpt-image-1.5`                                  | 使用 `outputFormat=png` 或 `webp`，以及 `openai.background=transparent`。 |

## 命名對照表

這些名稱相似，但不可互換：

| 你看到的名稱                       | 層級               | 意義                                                                                           |
| ---------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | 提供者前綴     | 標準 OpenAI 模型路由；代理程式回合會使用 Codex 執行環境。                                  |
| `openai-codex`                     | 驗證/設定檔前綴 | OpenAI Codex OAuth/訂閱驗證設定檔提供者。                                            |
| `codex` Plugin                     | Plugin              | 內建 OpenClaw Plugin，提供原生 Codex app-server 執行環境和 `/codex` 聊天控制。 |
| `agentRuntime.id: codex`           | 代理程式執行環境       | 強制內嵌回合使用原生 Codex app-server harness。                                     |
| `/codex ...`                       | 聊天命令集    | 從對話綁定/控制 Codex app-server 執行緒。                                        |
| `runtime: "acp", agentId: "codex"` | ACP 工作階段路由   | 透過 ACP/acpx 執行 Codex 的明確備援路徑。                                          |

這表示設定可以有意同時包含 `openai/*` 模型參照和
`openai-codex` 驗證設定檔。`openclaw doctor --fix` 會將舊版
`openai-codex/*` 模型參照改寫為標準 OpenAI 模型路由。

<Note>
GPT-5.5 可透過直接 OpenAI Platform API 金鑰存取和
訂閱/OAuth 路由使用。若要以 ChatGPT/Codex 訂閱加上原生 Codex
執行，請使用 `openai/gpt-5.5`；現在未設定執行環境時，OpenAI 代理程式回合會選取 Codex
harness。只有在你想要對 OpenAI 代理程式模型使用
直接 API 金鑰驗證時，才使用 OpenAI API 金鑰設定檔。
</Note>

<Note>
OpenAI 代理程式模型回合需要內建的 Codex app-server Plugin。明確的
PI 執行環境設定仍可作為選用的相容性路由。當 PI 搭配 `openai-codex` 驗證設定檔被
明確選取時，OpenClaw 會將公開模型參照保留為 `openai/*`，並在內部透過舊版
Codex 驗證傳輸路由 PI。執行 `openclaw doctor --fix` 以修復過時的
`openai-codex/*` 模型參照，或並非來自
明確執行環境設定的舊 PI 工作階段固定設定。
</Note>

## OpenClaw 功能涵蓋範圍

| OpenAI 能力         | OpenClaw 介面                                                  | 狀態                                                 |
| ------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| 聊天 / Responses          | `openai/<model>` 模型提供者                                   | 是                                                    |
| Codex 訂閱模型 | 使用 `openai-codex` OAuth 的 `openai/<model>`                        | 是                                                    |
| 舊版 Codex 模型參照   | `openai-codex/<model>`                                            | 由 doctor 修復為 `openai/<model>`                 |
| Codex app-server harness  | 省略執行環境或使用 `agentRuntime.id: codex` 的 `openai/<model>` | 是                                                    |
| 伺服器端網頁搜尋    | 原生 OpenAI Responses 工具                                      | 是，當網頁搜尋已啟用且未固定提供者時 |
| 圖片                    | `image_generate`                                                  | 是                                                    |
| 影片                    | `video_generate`                                                  | 是                                                    |
| 文字轉語音            | `messages.tts.provider: "openai"` / `tts`                         | 是                                                    |
| 批次語音轉文字      | `tools.media.audio` / 媒體理解                         | 是                                                    |
| 串流語音轉文字  | 語音通話 `streaming.provider: "openai"`                         | 是                                                    |
| 即時語音            | 語音通話 `realtime.provider: "openai"` / 控制 UI 對話        | 是                                                    |
| 嵌入                | 記憶嵌入提供者                                         | 是                                                    |

## 記憶嵌入

OpenClaw 可以使用 OpenAI，或 OpenAI 相容的嵌入端點，來進行
`memory_search` 索引和查詢嵌入：

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

對於需要非對稱嵌入標籤的 OpenAI 相容端點，請在
`memorySearch` 下設定 `queryInputType` 和 `documentInputType`。OpenClaw 會將
這些作為提供者專屬的 `input_type` 請求欄位轉送：查詢嵌入使用
`queryInputType`；已索引的記憶片段和批次索引使用
`documentInputType`。完整範例請參閱[記憶設定參考](/zh-TW/reference/memory-config#provider-specific-config)。

## 開始使用

選擇你偏好的驗證方法，並依照設定步驟操作。

<Tabs>
  <Tab title="API 金鑰（OpenAI Platform）">
    **最適合：** 直接 API 存取和用量計費。

    <Steps>
      <Step title="取得你的 API 金鑰">
        從 [OpenAI Platform 儀表板](https://platform.openai.com/api-keys)建立或複製 API 金鑰。
      </Step>
      <Step title="執行導引設定">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        或直接傳入金鑰：

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="確認模型可用">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### 路由摘要

    | 模型參照              | 執行環境設定             | 路由                       | 驗證             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | omitted / `agentRuntime.id: "codex"` | Codex app-server harness | `openai-codex` 設定檔 |
    | `openai/gpt-5.4-mini` | omitted / `agentRuntime.id: "codex"` | Codex app-server harness | `openai-codex` 設定檔 |
    | `openai/gpt-5.5`      | `agentRuntime.id: "pi"`              | PI 內嵌執行環境      | `openai` 設定檔或選取的 `openai-codex` 設定檔 |

    <Note>
    `openai/*` 代理程式模型使用 Codex app-server harness。若要對代理程式模型使用 API 金鑰
    驗證，請建立 `openai-codex` API 金鑰設定檔，並使用
    `auth.order.openai-codex` 排序；`OPENAI_API_KEY` 仍是非代理程式 OpenAI API 介面的直接
    備援。
    </Note>

    ### 設定範例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    若要從 OpenAI API 試用 ChatGPT 目前的 Instant 模型，請將模型
    設為 `openai/chat-latest`：

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` 是浮動別名。OpenAI 將其文件化為 ChatGPT 中使用的最新 Instant
    模型，並建議在正式環境 API 用途中使用 `gpt-5.5`，因此
    除非你明確想要該別名行為，否則請將 `openai/gpt-5.5` 保留為穩定預設值。該別名目前僅接受 `medium` 文字詳細程度，因此
    OpenClaw 會為此模型正規化不相容的 OpenAI 文字詳細程度覆寫。

    <Warning>
    OpenClaw **不**公開 `openai/gpt-5.3-codex-spark`。即時 OpenAI API 請求會拒絕該模型，目前的 Codex 型錄也沒有公開它。
    </Warning>

  </Tab>

  <Tab title="Codex 訂閱">
    **最適合：** 使用你的 ChatGPT/Codex 訂閱搭配原生 Codex app-server 執行，而不是使用個別 API 金鑰。Codex 雲端需要 ChatGPT 登入。

    <Steps>
      <Step title="執行 Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        或直接執行 OAuth：

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        對於無頭或不適合回呼的設定，請加入 `--device-code`，改用 ChatGPT 裝置代碼流程登入，而不是 localhost 瀏覽器回呼：

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="使用標準 OpenAI 模型路由">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        預設路徑不需要執行階段設定。OpenAI agent 回合會自動選擇原生 Codex app-server 執行階段，而 OpenClaw 會在選擇此路由時安裝或修復隨附的 Codex plugin。
      </Step>
      <Step title="確認 Codex 驗證可用">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Gateway 執行後，在聊天中傳送 `/codex status` 或 `/codex models`，以確認原生 app-server 執行階段。
      </Step>
    </Steps>

    ### 路由摘要

    | 模型參照 | 執行階段設定 | 路由 | 驗證 |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | 省略 / `agentRuntime.id: "codex"` | 原生 Codex app-server 控管器 | Codex 登入或選取的 `openai-codex` profile |
    | `openai/gpt-5.5` | `agentRuntime.id: "pi"` | 具內部 Codex 驗證傳輸的 PI 嵌入式執行階段 | 選取的 `openai-codex` profile |
    | `openai-codex/gpt-5.5` | 由 doctor 修復 | 舊版路由改寫為 `openai/gpt-5.5` | 既有 `openai-codex` profile |

    <Warning>
    請勿設定較舊的 `openai-codex/gpt-5.1*`、`openai-codex/gpt-5.2*` 或 `openai-codex/gpt-5.3*` 模型參照。ChatGPT/Codex OAuth 帳戶現在會拒絕這些模型。請使用 `openai/gpt-5.5`；OpenAI agent 回合現在預設會選擇 Codex 執行階段。
    </Warning>

    <Note>
    請繼續使用 `openai-codex` provider id 進行驗證/profile 命令。`openai-codex/*` 模型前綴是由 doctor 修復的舊版設定。對於常見的訂閱加原生執行階段設定，請使用 `openai-codex` 登入，但將模型參照保持為 `openai/gpt-5.5`。
    </Note>

    ### 設定範例

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex" },
        },
      },
    }
    ```

    <Note>
    Onboarding 不再從 `~/.codex` 匯入 OAuth 資料。請使用瀏覽器 OAuth（預設）或上述 device-code flow 登入 — OpenClaw 會在自己的 agent 驗證儲存區中管理產生的認證。
    </Note>

    ### 檢查並復原 Codex OAuth 路由

    使用這些命令查看你的預設 agent 使用哪個模型、執行階段與驗證路由：

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get agents.defaults.agentRuntime --json
    ```

    若要查看特定 agent，請加入 `--agent <id>`：

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    如果較舊的設定仍有 `openai-codex/gpt-*`，或沒有明確執行階段設定的過期 OpenAI PI session pin，請修復：

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    如果 `models auth list --provider openai-codex` 顯示沒有可用的 profile，請重新登入：

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex` 仍是驗證/profile provider id。`openai/*` 是透過 Codex 進行 OpenAI agent 回合的模型路由。

    ### 狀態指示器

    聊天 `/status` 會顯示目前 session 使用中的模型執行階段。針對 OpenAI agent 模型回合，隨附的 Codex app-server 控管器會顯示為 `Runtime: OpenAI Codex`。過期的 PI session pin 會修復為 Codex，除非設定明確釘選 PI。

    ### Doctor 警告

    如果 `openai-codex/*` 路由或過期的 OpenAI PI pin 仍留在設定或 session 狀態中，`openclaw doctor --fix` 會將其改寫為搭配 Codex 執行階段的 `openai/*`，除非已明確設定 PI。

    ### context window 上限

    OpenClaw 會將模型 metadata 與執行階段 context 上限視為不同的值。

    對於透過 Codex OAuth catalog 使用的 `openai/gpt-5.5`：

    - 原生 `contextWindow`：`1000000`
    - 預設執行階段 `contextTokens` 上限：`272000`

    較小的預設上限在實務上具有更好的延遲與品質特性。可用 `contextTokens` 覆寫：

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
    使用 `contextWindow` 宣告原生模型 metadata。使用 `contextTokens` 限制執行階段 context 預算。
    </Note>

    ### Catalog 復原

    OpenClaw 會在 `gpt-5.5` 存在時使用上游 Codex catalog metadata。如果 live Codex discovery 在帳戶已驗證時省略 `gpt-5.5` 列，OpenClaw 會合成該 OAuth 模型列，讓 cron、sub-agent 與已設定 default-model 的執行不會因 `Unknown model` 失敗。

  </Tab>
</Tabs>

## 原生 Codex app-server 驗證

原生 Codex app-server 控管器使用 `openai/*` 模型參照加上省略的執行階段設定或 `agentRuntime.id: "codex"`，但其驗證仍以帳戶為基礎。OpenClaw 會依此順序選擇驗證：

1. 綁定到 agent 的明確 OpenClaw `openai-codex` 驗證 profile。
2. app-server 的既有帳戶，例如本機 Codex CLI ChatGPT 登入。
3. 僅限本機 stdio app-server 啟動，當 app-server 回報沒有帳戶且仍需要 OpenAI 驗證時，使用 `CODEX_API_KEY`，然後 `OPENAI_API_KEY`。

這表示本機 ChatGPT/Codex 訂閱登入不會只因為 gateway 程序也有用於直接 OpenAI 模型或 embeddings 的 `OPENAI_API_KEY` 就被取代。Env API-key fallback 只適用於本機 stdio 無帳戶路徑；不會傳送到 WebSocket app-server 連線。選取訂閱式 Codex profile 時，OpenClaw 也會讓 `CODEX_API_KEY` 和 `OPENAI_API_KEY` 不進入產生的 stdio app-server child，並透過 app-server login RPC 傳送所選認證。

## 影像生成

隨附的 `openai` plugin 會透過 `image_generate` 工具註冊影像生成。
它透過相同的 `openai/gpt-image-2` 模型參照，同時支援 OpenAI API-key 影像生成與 Codex OAuth 影像生成。

| 功能 | OpenAI API key | Codex OAuth |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| 模型參照 | `openai/gpt-image-2` | `openai/gpt-image-2` |
| 驗證 | `OPENAI_API_KEY` | OpenAI Codex OAuth 登入 |
| 傳輸 | OpenAI Images API | Codex Responses backend |
| 每次請求的最大影像數 | 4 | 4 |
| 編輯模式 | 已啟用（最多 5 張參考影像） | 已啟用（最多 5 張參考影像） |
| 尺寸覆寫 | 支援，包含 2K/4K 尺寸 | 支援，包含 2K/4K 尺寸 |
| 長寬比 / 解析度 | 不轉送到 OpenAI Images API | 安全時對應到支援的尺寸 |

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
請參閱[影像生成](/zh-TW/tools/image-generation)，了解共用工具參數、provider 選擇與 failover 行為。
</Note>

`gpt-image-2` 是 OpenAI text-to-image 生成與影像編輯兩者的預設值。`gpt-image-1.5`、`gpt-image-1` 和 `gpt-image-1-mini` 仍可作為明確模型覆寫使用。若要輸出透明背景 PNG/WebP，請使用 `openai/gpt-image-1.5`；目前的 `gpt-image-2` API 會拒絕 `background: "transparent"`。

對於透明背景請求，agent 應以 `model: "openai/gpt-image-1.5"`、`outputFormat: "png"` 或 `"webp"`，以及 `background: "transparent"` 呼叫 `image_generate`；較舊的 `openai.background` provider option 仍會被接受。OpenClaw 也會保護公開 OpenAI 與 OpenAI Codex OAuth 路由，將預設 `openai/gpt-image-2` 透明請求改寫為 `gpt-image-1.5`；Azure 與自訂 OpenAI-compatible endpoints 則保留其已設定的 deployment/model 名稱。

相同設定也會暴露給 headless CLI 執行：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

從輸入檔開始時，請將相同的 `--output-format` 與 `--background` flags 搭配 `openclaw infer image edit` 使用。
`--openai-background` 仍可作為 OpenAI-specific alias 使用。

對於 Codex OAuth 安裝，請保留相同的 `openai/gpt-image-2` 參照。設定 `openai-codex` OAuth profile 時，OpenClaw 會解析該已儲存的 OAuth access token，並透過 Codex Responses backend 傳送影像請求。它不會先嘗試 `OPENAI_API_KEY`，也不會針對該請求無聲 fallback 到 API key。當你想改用直接 OpenAI Images API 路由時，請明確設定 `models.providers.openai` 搭配 API key、自訂 base URL 或 Azure endpoint。
如果該自訂影像 endpoint 位於受信任的 LAN/private address，也請設定 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`；除非存在此 opt-in，否則 OpenClaw 會持續封鎖 private/internal OpenAI-compatible image endpoints。

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

隨附的 `openai` plugin 會透過 `video_generate` 工具註冊影片生成。

| 功能 | 值 |
| ---------------- | --------------------------------------------------------------------------------- |
| 預設模型 | `openai/sora-2` |
| 模式 | Text-to-video、image-to-video、single-video edit |
| 參考輸入 | 1 張影像或 1 部影片 |
| 尺寸覆寫 | 支援 |
| 其他覆寫 | `aspectRatio`、`resolution`、`audio`、`watermark` 會被忽略並附帶工具警告 |

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
請參閱[影片生成](/zh-TW/tools/video-generation)，了解共用工具參數、provider 選擇與 failover 行為。
</Note>

## GPT-5 prompt contribution

OpenClaw 會為跨 provider 的 GPT-5-family 執行加入共用 GPT-5 prompt contribution。它會依 model id 套用，因此 `openai/gpt-5.5`、舊版修復前參照例如 `openai-codex/gpt-5.5`、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5`，以及其他相容 GPT-5 參照，都會收到相同的 overlay。較舊的 GPT-4.x 模型則不會。

隨附的原生 Codex 控管器會透過 Codex app-server developer instructions 使用相同的 GPT-5 行為與 Heartbeat overlay，因此強制透過 `agentRuntime.id: "codex"` 的 `openai/gpt-5.x` session 仍會保留相同的 follow-through 與主動 Heartbeat 指引，即使 Codex 擁有控管器 prompt 的其餘部分。

GPT-5 貢獻新增了一組帶標籤的行為合約，涵蓋 persona 持久性、執行安全性、工具紀律、輸出形態、完成檢查與驗證。特定通道的回覆與靜默訊息行為仍保留在共用的 OpenClaw 系統提示與外送政策中。GPT-5 指引一律會針對相符模型啟用。友善互動風格層是獨立且可設定的。

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
當共用的 `agents.defaults.promptOverlays.gpt5.personality` 設定未設定時，仍會讀取舊版 `plugins.entries.openai.config.personality` 作為相容性後備。
</Note>

## 語音與語音辨識

<AccordionGroup>
  <Accordion title="語音合成 (TTS)">
    內建的 `openai` Plugin 會為 `messages.tts` 介面註冊語音合成。

    | 設定 | 設定路徑 | 預設值 |
    |---------|------------|---------|
    | 模型 | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 聲音 | `messages.tts.providers.openai.voice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` |（未設定）|
    | 指令 | `messages.tts.providers.openai.instructions` |（未設定，僅限 `gpt-4o-mini-tts`）|
    | 格式 | `messages.tts.providers.openai.responseFormat` | 語音記事為 `opus`，檔案為 `mp3` |
    | API 金鑰 | `messages.tts.providers.openai.apiKey` | 後備使用 `OPENAI_API_KEY` |
    | 基礎 URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | 額外 body | `messages.tts.providers.openai.extraBody` / `extra_body` |（未設定）|

    可用模型：`gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。可用聲音：`alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、`marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    `extraBody` 會在 OpenClaw 產生的欄位之後合併到 `/audio/speech` 請求 JSON，因此可用於需要額外鍵（例如 `lang`）的 OpenAI 相容端點。原型鍵會被忽略。

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
    設定 `OPENAI_TTS_BASE_URL` 可覆寫 TTS 基礎 URL，而不影響聊天 API 端點。
    </Note>

  </Accordion>

  <Accordion title="語音轉文字">
    內建的 `openai` Plugin 會透過 OpenClaw 的媒體理解轉錄介面註冊批次語音轉文字。

    - 預設模型：`gpt-4o-transcribe`
    - 端點：OpenAI REST `/v1/audio/transcriptions`
    - 輸入路徑：multipart 音訊檔案上傳
    - 在 OpenClaw 中，凡是入站音訊轉錄使用 `tools.media.audio` 的地方皆受支援，包括 Discord 語音頻道片段與通道音訊附件

    若要強制入站音訊轉錄使用 OpenAI：

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

    語言與提示提示會在共用音訊媒體設定或逐次呼叫轉錄請求提供時轉送給 OpenAI。

  </Accordion>

  <Accordion title="即時轉錄">
    內建的 `openai` Plugin 會為 Voice Call Plugin 註冊即時轉錄。

    | 設定 | 設定路徑 | 預設值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 語言 | `...openai.language` |（未設定）|
    | 提示 | `...openai.prompt` |（未設定）|
    | 靜音持續時間 | `...openai.silenceDurationMs` | `800` |
    | VAD 閾值 | `...openai.vadThreshold` | `0.5` |
    | API 金鑰 | `...openai.apiKey` | 後備使用 `OPENAI_API_KEY` |

    <Note>
    使用 WebSocket 連線到 `wss://api.openai.com/v1/realtime`，搭配 G.711 u-law（`g711_ulaw` / `audio/pcmu`）音訊。此串流提供者用於 Voice Call 的即時轉錄路徑；Discord 語音目前會錄製短片段，並改用批次 `tools.media.audio` 轉錄路徑。
    </Note>

  </Accordion>

  <Accordion title="即時語音">
    內建的 `openai` Plugin 會為 Voice Call Plugin 註冊即時語音。

    | 設定 | 設定路徑 | 預設值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | 聲音 | `...openai.voice` | `alloy` |
    | 溫度 | `...openai.temperature` | `0.8` |
    | VAD 閾值 | `...openai.vadThreshold` | `0.5` |
    | 靜音持續時間 | `...openai.silenceDurationMs` | `500` |
    | API 金鑰 | `...openai.apiKey` | 後備使用 `OPENAI_API_KEY` |

    <Note>
    支援透過 `azureEndpoint` 與 `azureDeployment` 設定鍵，為後端即時橋接使用 Azure OpenAI。支援雙向工具呼叫。使用 G.711 u-law 音訊格式。
    </Note>

    <Note>
    Control UI Talk 使用 OpenAI 瀏覽器即時工作階段，搭配 Gateway 鑄造的暫時用戶端密鑰，並直接透過瀏覽器 WebRTC SDP 與 OpenAI Realtime API 交換。維護者可使用 `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 進行即時驗證；OpenAI 階段會在 Node 中鑄造用戶端密鑰，使用假麥克風媒體產生瀏覽器 SDP offer，將其發送到 OpenAI，並套用 SDP answer，且不記錄密鑰。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI 端點

內建的 `openai` 提供者可透過覆寫基礎 URL，將影像生成目標指向 Azure OpenAI 資源。在影像生成路徑上，OpenClaw 會偵測 `models.providers.openai.baseUrl` 上的 Azure 主機名稱，並自動切換到 Azure 的請求形態。

<Note>
即時語音使用獨立的設定路徑（`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`），不受 `models.providers.openai.baseUrl` 影響。其 Azure 設定請參閱 [語音與語音辨識](#voice-and-speech) 下方的 **即時語音** 摺疊區。
</Note>

在以下情況使用 Azure OpenAI：

- 你已經有 Azure OpenAI 訂閱、配額或企業合約
- 你需要 Azure 提供的區域資料駐留或合規控制
- 你想讓流量保留在現有 Azure 租用戶內

### 設定

若要透過內建的 `openai` 提供者使用 Azure 影像生成，請將 `models.providers.openai.baseUrl` 指向你的 Azure 資源，並將 `apiKey` 設為 Azure OpenAI 金鑰（不是 OpenAI Platform 金鑰）：

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

OpenClaw 會為 Azure 影像生成路由辨識以下 Azure 主機尾碼：

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

對於已辨識 Azure 主機上的影像生成請求，OpenClaw 會：

- 傳送 `api-key` 標頭，而非 `Authorization: Bearer`
- 使用部署範圍路徑（`/openai/deployments/{deployment}/...`）
- 將 `?api-version=...` 附加到每個請求
- 對 Azure 影像生成呼叫使用 600 秒的預設請求逾時。逐次呼叫的 `timeoutMs` 值仍會覆寫此預設值。

其他基礎 URL（公開 OpenAI、OpenAI 相容代理）會保留標準 OpenAI 影像請求形態。

<Note>
`openai` 提供者影像生成路徑的 Azure 路由需要 OpenClaw 2026.4.22 或更新版本。較早版本會將任何自訂 `openai.baseUrl` 視為公開 OpenAI 端點，並在對 Azure 影像部署發送請求時失敗。
</Note>

### API 版本

設定 `AZURE_OPENAI_API_VERSION`，即可為 Azure 影像生成路徑釘選特定 Azure preview 或 GA 版本：

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

當變數未設定時，預設值為 `2024-12-01-preview`。

### 模型名稱就是部署名稱

Azure OpenAI 會將模型繫結到部署。對於透過內建 `openai` 提供者路由的 Azure 影像生成請求，OpenClaw 中的 `model` 欄位必須是你在 Azure 入口網站中設定的 **Azure 部署名稱**，而不是公開 OpenAI 模型 ID。

如果你建立了一個名為 `gpt-image-2-prod`、供應 `gpt-image-2` 的部署：

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

相同的部署名稱規則也適用於透過內建 `openai` 提供者路由的影像生成呼叫。

### 區域可用性

Azure 影像生成目前僅在部分區域可用（例如 `eastus2`、`swedencentral`、`polandcentral`、`westus3`、`uaenorth`）。建立部署前，請檢查 Microsoft 目前的區域清單，並確認你的區域提供該特定模型。

### 參數差異

Azure OpenAI 與公開 OpenAI 不一定接受相同的影像參數。Azure 可能會拒絕公開 OpenAI 允許的選項（例如 `gpt-image-2` 上的某些 `background` 值），或只在特定模型版本上公開這些選項。這些差異來自 Azure 與底層模型，而不是 OpenClaw。如果 Azure 請求因驗證錯誤而失敗，請在 Azure 入口網站中檢查你的特定部署與 API 版本支援的參數集。

<Note>
Azure OpenAI 使用原生傳輸與相容行為，但不會收到 OpenClaw 的隱藏歸因標頭 — 請參閱 [進階設定](#advanced-configuration) 下方的 **原生與 OpenAI 相容路由** 摺疊區。

對於 Azure 上的聊天或 Responses 流量（超出影像生成範圍），請使用入門流程或專用 Azure 提供者設定 — 單靠 `openai.baseUrl` 不會套用 Azure API/auth 形態。另有一個 `azure-openai-responses/*` 提供者；請參閱下方的伺服器端 Compaction 摺疊區。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="傳輸（WebSocket 與 SSE）">
    OpenClaw 對 `openai/*` 採用 WebSocket 優先，並以 SSE 後備（`"auto"`）。

    在 `"auto"` 模式中，OpenClaw 會：
    - 在後備到 SSE 前，重試一次早期 WebSocket 失敗
    - 失敗後，將 WebSocket 標記為降級約 60 秒，並在冷卻期間使用 SSE
    - 為重試與重新連線附加穩定的工作階段與 turn 身分標頭
    - 在不同傳輸變體間標準化用量計數器（`input_tokens` / `prompt_tokens`）

    | 值 | 行為 |
    |-------|----------|
    | `"auto"`（預設） | WebSocket 優先，SSE 後備 |
    | `"sse"` | 強制僅使用 SSE |
    | `"websocket"` | 強制僅使用 WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
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
    OpenClaw 預設會為 `openai/*` 啟用 WebSocket 預熱，以降低第一輪延遲。

    ```json5
    // Disable warm-up
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
    OpenClaw 為 `openai/*` 提供共用的快速模式切換：

    - **聊天/UI：** `/fast status|on|off`
    - **設定：** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    啟用後，OpenClaw 會將快速模式對應到 OpenAI 優先處理（`service_tier = "priority"`）。既有的 `service_tier` 值會保留，且快速模式不會改寫 `reasoning` 或 `text.verbosity`。

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
    工作階段覆寫優先於設定。在工作階段 UI 中清除工作階段覆寫，會讓該工作階段回到設定的預設值。
    </Note>

  </Accordion>

  <Accordion title="優先處理 (service_tier)">
    OpenAI 的 API 透過 `service_tier` 提供優先處理。在 OpenClaw 中針對每個模型設定：

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
    `serviceTier` 只會轉送到原生 OpenAI 端點（`api.openai.com`）和原生 Codex 端點（`chatgpt.com/backend-api`）。如果你透過代理路由任一 provider，OpenClaw 會讓 `service_tier` 保持原樣。
    </Warning>

  </Accordion>

  <Accordion title="伺服器端 Compaction（Responses API）">
    對於直接 OpenAI Responses 模型（`api.openai.com` 上的 `openai/*`），OpenAI Plugin 的 Pi-harness 串流包裝器會自動啟用伺服器端 Compaction：

    - 強制使用 `store: true`（除非模型相容性設定 `supportsStore: false`）
    - 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - 預設 `compact_threshold`：`contextWindow` 的 70%（無法取得時為 `80000`）

    這會套用到內建的 Pi harness 路徑，以及嵌入式執行使用的 OpenAI provider hooks。原生 Codex app-server harness 會透過 Codex 管理自己的情境，並使用 `agents.defaults.agentRuntime.id` 另外設定。

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
    `responsesServerCompaction` 只控制 `context_management` 注入。直接 OpenAI Responses 模型仍會強制使用 `store: true`，除非相容性設定 `supportsStore: false`。
    </Note>

  </Accordion>

  <Accordion title="嚴格 agentic GPT 模式">
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
    - 當工具動作可用時，不再把只有計畫的回合視為成功進展
    - 使用立即執行的導向重試該回合
    - 對實質工作自動啟用 `update_plan`
    - 如果模型持續只規劃而不執行，顯示明確的受阻狀態

    <Note>
    僅限 OpenAI 和 Codex GPT-5 系列執行。其他 providers 和較舊模型系列會維持預設行為。
    </Note>

  </Accordion>

  <Accordion title="原生與 OpenAI 相容路由">
    OpenClaw 會以不同方式處理直接 OpenAI、Codex 和 Azure OpenAI 端點，以及一般 OpenAI 相容 `/v1` 代理：

    **原生路由**（`openai/*`、Azure OpenAI）：
    - 只對支援 OpenAI `none` effort 的模型保留 `reasoning: { effort: "none" }`
    - 對拒絕 `reasoning.effort: "none"` 的模型或代理省略停用的 reasoning
    - 預設使用嚴格模式的工具 schema
    - 只在已驗證的原生主機上附加隱藏歸因標頭
    - 保留僅限 OpenAI 的請求塑形（`service_tier`、`store`、reasoning 相容性、prompt-cache 提示）

    **代理/相容路由：**
    - 使用較寬鬆的相容行為
    - 從非原生 `openai-completions` payload 中移除 Completions `store`
    - 接受進階的 `params.extra_body`/`params.extraBody` pass-through JSON，用於 OpenAI 相容的 Completions 代理
    - 接受 `params.chat_template_kwargs`，用於 vLLM 等 OpenAI 相容的 Completions 代理
    - 不強制使用嚴格工具 schema 或僅限原生的標頭

    Azure OpenAI 使用原生傳輸和相容行為，但不會接收隱藏歸因標頭。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇 providers、模型 ref 和容錯移轉行為。
  </Card>
  <Card title="圖片生成" href="/zh-TW/tools/image-generation" icon="image">
    共用的圖片工具參數和 provider 選擇。
  </Card>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用的影片工具參數和 provider 選擇。
  </Card>
  <Card title="OAuth 和驗證" href="/zh-TW/gateway/authentication" icon="key">
    驗證詳細資訊和憑證重用規則。
  </Card>
</CardGroup>
