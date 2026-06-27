---
read_when:
    - 你想在 OpenClaw 中使用 MiniMax 模型
    - 你需要 MiniMax 設定指引
summary: 在 OpenClaw 中使用 MiniMax 模型
title: MiniMax
x-i18n:
    generated_at: "2026-06-27T19:55:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fe606178d7d15383e56c026b02ba7be751ead706adc097c776c0a6a92aa2a2
    source_path: providers/minimax.md
    workflow: 16
---

OpenClaw 的 MiniMax 提供者預設使用 **MiniMax M3**。

MiniMax 也提供：

- 透過 T2A v2 內建語音合成
- 透過 `MiniMax-VL-01` 內建影像理解
- 透過 `music-2.6` 內建音樂生成
- 透過 MiniMax Token Plan 搜尋 API 內建 `web_search`

提供者分流：

| 提供者 ID      | 驗證    | 能力                                                                                        |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | API 金鑰 | 文字、影像生成、音樂生成、影片生成、影像理解、語音、網路搜尋 |
| `minimax-portal` | OAuth   | 文字、影像生成、音樂生成、影片生成、影像理解、語音             |

## 內建目錄

| 模型                    | 類型             | 說明                              |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M3`             | 聊天（推理） | 預設託管推理模型           |
| `MiniMax-M2.7`           | 聊天（推理） | 前一代託管推理模型          |
| `MiniMax-M2.7-highspeed` | 聊天（推理） | 更快的 M2.7 推理層級               |
| `MiniMax-VL-01`          | 視覺           | 影像理解模型                |
| `image-01`               | 影像生成 | 文字轉影像與影像轉影像編輯 |
| `music-2.6`              | 音樂生成 | 預設音樂模型                      |
| `music-2.5`              | 音樂生成 | 前一代音樂生成層級           |
| `music-2.0`              | 音樂生成 | 舊版音樂生成層級             |
| `MiniMax-Hailuo-2.3`     | 影片生成 | 文字轉影片與影像參考流程  |

## 開始使用

選擇偏好的驗證方式並依照設定步驟操作。

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **最適合：**透過 OAuth 快速設定 MiniMax Coding Plan，不需要 API 金鑰。

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            這會向 `api.minimax.io` 進行驗證。
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            這會向 `api.minimaxi.com` 進行驗證。
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    OAuth 設定使用 `minimax-portal` 提供者 ID。模型參照遵循 `minimax-portal/MiniMax-M3` 形式。
    </Note>

    <Tip>
    MiniMax Coding Plan 推薦連結（9 折）：[MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **最適合：**使用 Anthropic 相容 API 的託管 MiniMax。

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            這會將 `api.minimax.io` 設定為基底 URL。
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            這會將 `api.minimaxi.com` 設定為基底 URL。
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### 設定範例

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M3" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    在 Anthropic 相容串流路徑上，除非你明確自行設定 `thinking`，否則 OpenClaw 預設會停用 MiniMax M2.x thinking。M2.x 的串流端點會以 OpenAI 風格的 delta 區塊送出 `reasoning_content`，而不是原生 Anthropic thinking 區塊；若隱含啟用，可能會將內部推理洩漏到可見輸出中。MiniMax-M3（以及向前相容的 M3.x）不受此預設影響：M3 會送出正確的 Anthropic thinking 區塊，且需要啟用 thinking 才能產生可見內容，因此 OpenClaw 會讓 M3 保持在提供者的省略／自適應 thinking 路徑上。
    </Warning>

    <Note>
    API 金鑰設定使用 `minimax` 提供者 ID。模型參照遵循 `minimax/MiniMax-M3` 形式。
    </Note>

  </Tab>
</Tabs>

## 透過 `openclaw configure` 設定

使用互動式設定精靈設定 MiniMax，不需要編輯 JSON：

<Steps>
  <Step title="Launch the wizard">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Select Model/auth">
    從選單選擇 **Model/auth**。
  </Step>
  <Step title="Choose a MiniMax auth option">
    選擇其中一個可用的 MiniMax 選項：

    | 驗證選項 | 說明 |
    | --- | --- |
    | `minimax-global-oauth` | 國際 OAuth（Coding Plan） |
    | `minimax-cn-oauth` | 中國 OAuth（Coding Plan） |
    | `minimax-global-api` | 國際 API 金鑰 |
    | `minimax-cn-api` | 中國 API 金鑰 |

  </Step>
  <Step title="Pick your default model">
    在提示時選取你的預設模型。
  </Step>
</Steps>

## 能力

### 影像生成

MiniMax 外掛會為 `image_generate` 工具註冊 `image-01` 模型。它支援：

- **文字轉影像生成**，並可控制長寬比
- **影像轉影像編輯**（主體參考），並可控制長寬比
- 每個請求最多 **9 張輸出影像**
- 每個編輯請求最多 **1 張參考影像**
- 支援的長寬比：`1:1`、`16:9`、`4:3`、`3:2`、`2:3`、`3:4`、`9:16`、`21:9`

若要使用 MiniMax 進行影像生成，請將它設定為影像生成提供者：

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

此外掛使用與文字模型相同的 `MINIMAX_API_KEY` 或 OAuth 驗證。如果 MiniMax 已設定完成，則不需要額外設定。

`minimax` 和 `minimax-portal` 都會以相同的
`image-01` 模型註冊 `image_generate`。API 金鑰設定使用 `MINIMAX_API_KEY`；OAuth 設定則可改用
內建的 `minimax-portal` 驗證路徑。

影像生成一律使用 MiniMax 專用的影像端點
(`/v1/image_generation`)，並忽略 `models.providers.minimax.baseUrl`，
因為該欄位會設定聊天／Anthropic 相容的基底 URL。設定
`MINIMAX_API_HOST=https://api.minimaxi.com` 可將影像生成
路由至中國端點；預設的全球端點為
`https://api.minimax.io`。

當 onboarding 或 API 金鑰設定寫入明確的 `models.providers.minimax`
項目時，OpenClaw 會將 `MiniMax-M3`、`MiniMax-M2.7` 和
`MiniMax-M2.7-highspeed` 實體化為聊天模型。M3 會宣告支援文字與影像輸入；
影像理解仍透過外掛擁有的
`MiniMax-VL-01` 媒體提供者另行公開。

<Note>
請參閱 [影像生成](/zh-TW/tools/image-generation)，了解共享工具參數、提供者選擇與容錯移轉行為。
</Note>

### 文字轉語音

內建的 `minimax` 外掛會將 MiniMax T2A v2 註冊為
`messages.tts` 的語音提供者。

- 預設 TTS 模型：`speech-2.8-hd`
- 預設聲音：`English_expressive_narrator`
- 支援的內建模型 ID 包含 `speech-2.8-hd`、`speech-2.8-turbo`、
  `speech-2.6-hd`、`speech-2.6-turbo`、`speech-02-hd`、
  `speech-02-turbo`、`speech-01-hd` 和 `speech-01-turbo`。
- 驗證解析順序為 `messages.tts.providers.minimax.apiKey`，接著是
  `minimax-portal` OAuth／權杖驗證設定檔，接著是 Token Plan 環境
  金鑰（`MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY`、
  `MINIMAX_CODING_API_KEY`），最後是 `MINIMAX_API_KEY`。
- 如果未設定 TTS 主機，OpenClaw 會重用已設定的
  `minimax-portal` OAuth 主機，並移除 Anthropic 相容路徑尾碼，
  例如 `/anthropic`。
- 一般音訊附件會保持 MP3。
- Feishu 和 Telegram 等語音訊息目標會使用 `ffmpeg`，將 MiniMax
  MP3 轉碼為 48kHz Opus，因為 Feishu/Lark 檔案 API 對原生音訊訊息
  只接受 `file_type: "opus"`。
- MiniMax T2A 接受小數 `speed` 和 `vol`，但 `pitch` 會以
  整數送出；OpenClaw 會在 API 請求前截斷小數 `pitch` 值。

| 設定                                         | 環境變數                | 預設值                       | 說明                      |
| ----------------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl`        | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | MiniMax T2A API 主機。            |
| `messages.tts.providers.minimax.model`          | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | TTS 模型 ID。                    |
| `messages.tts.providers.minimax.speakerVoiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | 用於語音輸出的聲音 ID。 |
| `messages.tts.providers.minimax.speed`          |                        | `1.0`                         | 播放速度，`0.5..2.0`。      |
| `messages.tts.providers.minimax.vol`            |                        | `1.0`                         | 音量，`(0, 10]`。               |
| `messages.tts.providers.minimax.pitch`          |                        | `0`                           | 整數音高位移，`-12..12`。  |

### 音樂生成

內建的 MiniMax 外掛會透過共享的
`music_generate` 工具，為 `minimax` 和 `minimax-portal` 註冊音樂生成。

- 預設音樂模型：`minimax/music-2.6`
- OAuth 音樂模型：`minimax-portal/music-2.6`
- 也支援 `minimax/music-2.5` 與 `minimax/music-2.0`
- 提示控制：`lyrics`、`instrumental`
- 輸出格式：`mp3`
- 由工作階段支援的執行會透過共用的任務/狀態流程分離，包括 `action: "status"`

若要使用 MiniMax 作為預設音樂提供者：

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.6",
      },
    },
  },
}
```

<Note>
請參閱[音樂生成](/zh-TW/tools/music-generation)，了解共用工具參數、提供者選擇與容錯移轉行為。
</Note>

### 影片生成

內建的 MiniMax 外掛會透過共用的 `video_generate` 工具，為 `minimax` 與 `minimax-portal` 註冊影片生成。

- 預設影片模型：`minimax/MiniMax-Hailuo-2.3`
- OAuth 影片模型：`minimax-portal/MiniMax-Hailuo-2.3`
- 模式：文字轉影片與單張圖片參考流程
- 支援 `aspectRatio` 與 `resolution`

若要使用 MiniMax 作為預設影片提供者：

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
請參閱[影片生成](/zh-TW/tools/video-generation)，了解共用工具參數、提供者選擇與容錯移轉行為。
</Note>

### 圖片理解

MiniMax 外掛會將圖片理解與文字目錄分開註冊：

| 提供者 ID        | 預設圖片模型        |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

這就是為什麼即使內建文字提供者目錄也包含具備圖片能力的 M3 聊天參照，自動媒體路由仍可使用 MiniMax 圖片理解。

### 網頁搜尋

MiniMax 外掛也會透過 MiniMax Token Plan 搜尋 API 註冊 `web_search`。

- 提供者 ID：`minimax`
- 結構化結果：標題、URL、摘要、相關查詢
- 建議的環境變數：`MINIMAX_CODE_PLAN_KEY`
- 接受的環境別名：`MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN`
- 相容性備援：當 `MINIMAX_API_KEY` 已指向 token-plan 認證時使用
- 區域重用：`plugins.entries.minimax.config.webSearch.region`，接著是 `MINIMAX_API_HOST`，再接著是 MiniMax 提供者基底 URL
- 搜尋會保留在提供者 ID `minimax`；OAuth CN/global 設定可透過 `models.providers.minimax-portal.baseUrl` 間接引導區域，並可透過 `MINIMAX_OAUTH_TOKEN` 提供 bearer 驗證

設定位於 `plugins.entries.minimax.config.webSearch.*` 之下。

<Note>
請參閱 [MiniMax Search](/zh-TW/tools/minimax-search)，了解完整網頁搜尋設定與用法。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="設定選項">
    | 選項 | 說明 |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | 建議使用 `https://api.minimax.io/anthropic`（Anthropic 相容）；`https://api.minimax.io/v1` 可選用於 OpenAI 相容酬載 |
    | `models.providers.minimax.api` | 建議使用 `anthropic-messages`；`openai-completions` 可選用於 OpenAI 相容酬載 |
    | `models.providers.minimax.apiKey` | MiniMax API 金鑰（`MINIMAX_API_KEY`） |
    | `models.providers.minimax.models` | 定義 `id`、`name`、`reasoning`、`contextWindow`、`maxTokens`、`cost` |
    | `agents.defaults.models` | 為你想放入允許清單的模型設定別名 |
    | `models.mode` | 若你想在內建項目旁加入 MiniMax，請保留 `merge` |
  </Accordion>

  <Accordion title="思考預設值">
    在 `api: "anthropic-messages"` 上，除非已在參數/設定中明確設定 thinking，否則 OpenClaw 會為 MiniMax M2.x 模型注入 `thinking: { type: "disabled" }`。

    這可防止 M2.x 的串流端點在 OpenAI 風格的 delta 區塊中發出 `reasoning_content`，避免內部推理洩漏到可見輸出。

    MiniMax-M3（以及 M3.x）不受此限制：M3 會發出正確的 Anthropic thinking 區塊，且在停用 thinking 時回傳空的 `content` 陣列並帶有 `stop_reason: "end_turn"`，因此包裝器會讓 M3 保持在提供者省略/自適應 thinking 路徑上。

  </Accordion>

  <Accordion title="快速模式">
    `/fast on` 或 `params.fastMode: true` 會在 Anthropic 相容串流路徑上將 `MiniMax-M2.7` 重寫為 `MiniMax-M2.7-highspeed`。
  </Accordion>

  <Accordion title="備援範例">
    **最適合：** 將你最強的最新世代模型保留為主要模型，並容錯移轉到 MiniMax M2.7。下方範例使用 Opus 作為具體主要模型；請替換成你偏好的最新世代主要模型。

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Coding Plan 使用細節">
    - Coding Plan 用量 API：`https://api.minimaxi.com/v1/token_plan/remains` 或 `https://api.minimax.io/v1/token_plan/remains`（需要 coding plan 金鑰）。
    - 用量輪詢會在已設定時從 `models.providers.minimax-portal.baseUrl` 或 `models.providers.minimax.baseUrl` 推導主機，因此使用 `https://api.minimax.io/anthropic` 的 global 設定會輪詢 `api.minimax.io`。缺少或格式錯誤的基底 URL 會保留 CN 備援以維持相容性。
    - OpenClaw 會將 MiniMax coding-plan 用量正規化為其他提供者使用的相同「剩餘 %」顯示。MiniMax 原始的 `usage_percent` / `usagePercent` 欄位代表剩餘額度，而非已消耗額度，因此 OpenClaw 會將其反轉。若存在以計數為基礎的欄位，則優先使用。
    - 當 API 回傳 `model_remains` 時，OpenClaw 會優先使用聊天模型項目，必要時從 `start_time` / `end_time` 推導視窗標籤，並在方案標籤中包含所選模型名稱，讓 coding-plan 視窗更容易區分。
    - 用量快照會將 `minimax`、`minimax-cn` 與 `minimax-portal` 視為相同的 MiniMax 額度表面，並優先使用已儲存的 MiniMax OAuth，再退回到 Coding Plan 金鑰環境變數。

  </Accordion>
</AccordionGroup>

## 注意事項

- 模型參照會遵循驗證路徑：
  - API 金鑰設定：`minimax/<model>`
  - OAuth 設定：`minimax-portal/<model>`
- 預設聊天模型：`MiniMax-M3`
- 替代聊天模型：`MiniMax-M2.7`、`MiniMax-M2.7-highspeed`
- 入門設定與直接 API 金鑰設定會為 M3 與兩個 M2.7 變體寫入模型定義
- 圖片理解使用外掛擁有的 `MiniMax-VL-01` 媒體提供者
- 若需要精確成本追蹤，請更新 `models.json` 中的價格值
- 使用 `openclaw models list` 確認目前的提供者 ID，然後透過 `openclaw models set minimax/MiniMax-M3` 或 `openclaw models set minimax-portal/MiniMax-M3` 切換

<Tip>
MiniMax Coding Plan 推薦連結（9 折）：[MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
請參閱[模型提供者](/zh-TW/concepts/model-providers)，了解提供者規則。
</Note>

## 疑難排解

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M3"'>
    這通常表示 **MiniMax 提供者尚未設定**（找不到相符的提供者項目，也找不到 MiniMax 驗證設定檔/環境金鑰）。此偵測的修正已包含在 **2026.1.12**。修正方式：

    - 升級到 **2026.1.12**（或從原始碼 `main` 執行），然後重新啟動閘道。
    - 執行 `openclaw configure` 並選取 **MiniMax** 驗證選項，或
    - 手動加入相符的 `models.providers.minimax` 或 `models.providers.minimax-portal` 區塊，或
    - 設定 `MINIMAX_API_KEY`、`MINIMAX_OAUTH_TOKEN`，或 MiniMax 驗證設定檔，讓相符的提供者可被注入。

    請確認模型 ID **區分大小寫**：

    - API 金鑰路徑：`minimax/MiniMax-M3`、`minimax/MiniMax-M2.7` 或 `minimax/MiniMax-M2.7-highspeed`
    - OAuth 路徑：`minimax-portal/MiniMax-M3`、`minimax-portal/MiniMax-M2.7` 或 `minimax-portal/MiniMax-M2.7-highspeed`

    然後使用下列命令重新檢查：

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
更多協助：[疑難排解](/zh-TW/help/troubleshooting)與[常見問題](/zh-TW/help/faq)。
</Note>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照與容錯移轉行為。
  </Card>
  <Card title="圖片生成" href="/zh-TW/tools/image-generation" icon="image">
    共用圖片工具參數與提供者選擇。
  </Card>
  <Card title="音樂生成" href="/zh-TW/tools/music-generation" icon="music">
    共用音樂工具參數與提供者選擇。
  </Card>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用影片工具參數與提供者選擇。
  </Card>
  <Card title="MiniMax Search" href="/zh-TW/tools/minimax-search" icon="magnifying-glass">
    透過 MiniMax Token Plan 進行網頁搜尋設定。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    一般疑難排解與常見問題。
  </Card>
</CardGroup>
