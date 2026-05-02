---
read_when:
    - 您想在 OpenClaw 中使用 MiniMax 模型
    - 你需要 MiniMax 設定指南
summary: 在 OpenClaw 中使用 MiniMax 模型
title: MiniMax
x-i18n:
    generated_at: "2026-05-02T21:02:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c7aea4d9656d6ffddab7c43b06940e58bdd119a03b62000e689a3348f7df5a2
    source_path: providers/minimax.md
    workflow: 16
---

OpenClaw 的 MiniMax 提供者預設使用 **MiniMax M2.7**。

MiniMax 也提供：

- 透過 T2A v2 捆綁的語音合成
- 透過 `MiniMax-VL-01` 捆綁的影像理解
- 透過 `music-2.6` 捆綁的音樂生成
- 透過 MiniMax Token Plan 搜尋 API 捆綁的 `web_search`

提供者區分：

| Provider ID      | Auth    | Capabilities                                                                                        |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | API key | 文字、影像生成、音樂生成、影片生成、影像理解、語音、網頁搜尋 |
| `minimax-portal` | OAuth   | 文字、影像生成、音樂生成、影片生成、影像理解、語音             |

## 內建目錄

| Model                    | Type             | Description                              |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | 聊天（推理） | 預設託管推理模型           |
| `MiniMax-M2.7-highspeed` | 聊天（推理） | 更快的 M2.7 推理層級               |
| `MiniMax-VL-01`          | 視覺           | 影像理解模型                |
| `image-01`               | 影像生成 | 文字轉影像與影像轉影像編輯 |
| `music-2.6`              | 音樂生成 | 預設音樂模型                      |
| `music-2.5`              | 音樂生成 | 前一代音樂生成層級           |
| `music-2.0`              | 音樂生成 | 舊版音樂生成層級             |
| `MiniMax-Hailuo-2.3`     | 影片生成 | 文字轉影片與影像參照流程  |

## 開始使用

選擇你偏好的驗證方式，並按照設定步驟操作。

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **最適合：** 透過 OAuth 快速設定 MiniMax Coding Plan，不需要 API key。

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            這會針對 `api.minimax.io` 進行驗證。
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

            這會針對 `api.minimaxi.com` 進行驗證。
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
    OAuth 設定使用 `minimax-portal` 提供者 id。模型參照格式為 `minimax-portal/MiniMax-M2.7`。
    </Note>

    <Tip>
    MiniMax Coding Plan 推薦連結（九折）：[MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **最適合：** 使用相容 Anthropic API 的託管 MiniMax。

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
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
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
    在相容 Anthropic 的串流路徑上，OpenClaw 預設會停用 MiniMax thinking，除非你明確自行設定 `thinking`。MiniMax 的串流端點會以 OpenAI 風格的 delta chunks 發出 `reasoning_content`，而不是原生 Anthropic thinking blocks；若讓它隱式啟用，可能會把內部推理洩漏到可見輸出中。
    </Warning>

    <Note>
    API-key 設定使用 `minimax` 提供者 id。模型參照格式為 `minimax/MiniMax-M2.7`。
    </Note>

  </Tab>
</Tabs>

## 透過 `openclaw configure` 設定

使用互動式設定精靈來設定 MiniMax，而不需要編輯 JSON：

<Steps>
  <Step title="啟動精靈">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="選取模型/驗證">
    從選單選擇 **模型/驗證**。
  </Step>
  <Step title="選擇 MiniMax 驗證選項">
    選取其中一個可用的 MiniMax 選項：

    | 驗證選項 | 說明 |
    | --- | --- |
    | `minimax-global-oauth` | 國際 OAuth（Coding Plan） |
    | `minimax-cn-oauth` | 中國 OAuth（Coding Plan） |
    | `minimax-global-api` | 國際 API 金鑰 |
    | `minimax-cn-api` | 中國 API 金鑰 |

  </Step>
  <Step title="選取預設模型">
    出現提示時，選取你的預設模型。
  </Step>
</Steps>

## 功能

### 圖像生成

MiniMax Plugin 會為 `image_generate` 工具註冊 `image-01` 模型。它支援：

- 具備長寬比控制的**文字轉圖像生成**
- 具備長寬比控制的**圖像轉圖像編輯**（主體參考）
- 每個請求最多 **9 張輸出圖像**
- 每個編輯請求最多 **1 張參考圖像**
- 支援的長寬比：`1:1`、`16:9`、`4:3`、`3:2`、`2:3`、`3:4`、`9:16`、`21:9`

若要使用 MiniMax 進行圖像生成，請將它設為圖像生成提供者：

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

此外掛程式會使用與文字模型相同的 `MINIMAX_API_KEY` 或 OAuth 驗證。如果已設定 MiniMax，則不需要額外設定。

`minimax` 和 `minimax-portal` 都會以相同的 `image-01` 模型註冊 `image_generate`。API 金鑰設定會使用 `MINIMAX_API_KEY`；OAuth 設定則可改用內建的 `minimax-portal` 驗證路徑。

圖像生成一律使用 MiniMax 的專用圖像端點（`/v1/image_generation`），並忽略 `models.providers.minimax.baseUrl`，因為該欄位會設定聊天/Anthropic 相容的基底 URL。設定 `MINIMAX_API_HOST=https://api.minimaxi.com` 可將圖像生成導向 CN 端點；預設的全球端點為 `https://api.minimax.io`。

當入門導引或 API 金鑰設定寫入明確的 `models.providers.minimax` 項目時，OpenClaw 會將 `MiniMax-M2.7` 和 `MiniMax-M2.7-highspeed` 具體化為純文字聊天模型。圖像理解會透過此外掛程式擁有的 `MiniMax-VL-01` 媒體提供者另行公開。

<Note>
請參閱[圖像生成](/zh-TW/tools/image-generation)，了解共用工具參數、提供者選擇和容錯移轉行為。
</Note>

### 文字轉語音

內建的 `minimax` Plugin 會將 MiniMax T2A v2 註冊為 `messages.tts` 的語音提供者。

- 預設 TTS 模型：`speech-2.8-hd`
- 預設語音：`English_expressive_narrator`
- 支援的內建模型 ID 包含 `speech-2.8-hd`、`speech-2.8-turbo`、`speech-2.6-hd`、`speech-2.6-turbo`、`speech-02-hd`、`speech-02-turbo`、`speech-01-hd` 和 `speech-01-turbo`。
- 驗證解析順序為 `messages.tts.providers.minimax.apiKey`，接著是 `minimax-portal` OAuth/token 驗證設定檔，接著是 Token Plan 環境金鑰（`MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`），最後是 `MINIMAX_API_KEY`。
- 如果未設定 TTS 主機，OpenClaw 會重用已設定的 `minimax-portal` OAuth 主機，並移除 Anthropic 相容的路徑尾碼，例如 `/anthropic`。
- 一般音訊附件會保持 MP3。
- Feishu 和 Telegram 等語音訊息目標會使用 `ffmpeg` 將 MiniMax MP3 轉碼為 48kHz Opus，因為 Feishu/Lark 檔案 API 只接受 `file_type: "opus"` 作為原生音訊訊息。
- MiniMax T2A 接受小數 `speed` 和 `vol`，但 `pitch` 會以整數傳送；OpenClaw 會在 API 請求前截斷小數 `pitch` 值。

| 設定                                     | 環境變數               | 預設值                        | 說明                             |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | MiniMax T2A API 主機。           |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | TTS 模型 ID。                    |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | 用於語音輸出的語音 ID。          |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | 播放速度，`0.5..2.0`。           |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | 音量，`(0, 10]`。                |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | 整數音高偏移，`-12..12`。        |

### 音樂生成

內建 MiniMax Plugin 會透過共用的 `music_generate` 工具，為 `minimax` 和 `minimax-portal` 註冊音樂生成。

- 預設音樂模型：`minimax/music-2.6`
- OAuth 音樂模型：`minimax-portal/music-2.6`
- 也支援 `minimax/music-2.5` 和 `minimax/music-2.0`
- 提示控制項：`lyrics`、`instrumental`、`durationSeconds`
- 輸出格式：`mp3`
- 以工作階段為基礎的執行會透過共用的工作/狀態流程分離，包括 `action: "status"`

若要將 MiniMax 作為預設音樂提供者：

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
請參閱[音樂生成](/zh-TW/tools/music-generation)，了解共用工具參數、提供者選擇和容錯移轉行為。
</Note>

### 影片生成

內建 MiniMax Plugin 會透過共用的 `video_generate` 工具，為 `minimax` 和 `minimax-portal` 註冊影片生成。

- 預設影片模型：`minimax/MiniMax-Hailuo-2.3`
- OAuth 影片模型：`minimax-portal/MiniMax-Hailuo-2.3`
- 模式：文字轉影片和單張圖像參考流程
- 支援 `aspectRatio` 和 `resolution`

若要將 MiniMax 作為預設影片提供者：

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
請參閱[影片生成](/zh-TW/tools/video-generation)，了解共用工具參數、供應商選擇與容錯移轉行為。
</Note>

### 圖像理解

MiniMax Plugin 會將圖像理解與文字目錄分開註冊：

| 供應商 ID       | 預設圖像模型        |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

這就是為什麼即使內建文字供應商目錄仍顯示僅限文字的 M2.7 聊天參照，自動媒體路由仍可使用 MiniMax 圖像理解。

### 網頁搜尋

MiniMax Plugin 也會透過 MiniMax Token Plan 搜尋 API 註冊 `web_search`。

- 供應商 id：`minimax`
- 結構化結果：標題、URL、摘要、相關查詢
- 偏好的環境變數：`MINIMAX_CODE_PLAN_KEY`
- 接受的環境別名：`MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN`
- 相容性後援：當 `MINIMAX_API_KEY` 已指向 token-plan 憑證時使用
- 區域重用：`plugins.entries.minimax.config.webSearch.region`，接著是 `MINIMAX_API_HOST`，再接著是 MiniMax 供應商基底 URL
- 搜尋維持在供應商 id `minimax`；OAuth CN/global 設定可透過 `models.providers.minimax-portal.baseUrl` 間接引導區域，並可透過 `MINIMAX_OAUTH_TOKEN` 提供 bearer 驗證

設定位於 `plugins.entries.minimax.config.webSearch.*` 底下。

<Note>
請參閱 [MiniMax Search](/zh-TW/tools/minimax-search)，了解完整的網頁搜尋設定與用法。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="設定選項">
    | 選項 | 說明 |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | 偏好 `https://api.minimax.io/anthropic`（Anthropic 相容）；`https://api.minimax.io/v1` 可選用於 OpenAI 相容 payload |
    | `models.providers.minimax.api` | 偏好 `anthropic-messages`；`openai-completions` 可選用於 OpenAI 相容 payload |
    | `models.providers.minimax.apiKey` | MiniMax API 金鑰（`MINIMAX_API_KEY`） |
    | `models.providers.minimax.models` | 定義 `id`、`name`、`reasoning`、`contextWindow`、`maxTokens`、`cost` |
    | `agents.defaults.models` | 為你想放入允許清單的模型設定別名 |
    | `models.mode` | 如果你想在內建項目旁加入 MiniMax，請保留 `merge` |
  </Accordion>

  <Accordion title="思考預設值">
    在 `api: "anthropic-messages"` 上，除非已在 params/config 中明確設定思考，否則 OpenClaw 會注入 `thinking: { type: "disabled" }`。

    這會防止 MiniMax 的串流端點在 OpenAI 風格的 delta 區塊中發出 `reasoning_content`，避免內部推理洩漏到可見輸出中。

  </Accordion>

  <Accordion title="快速模式">
    `/fast on` 或 `params.fastMode: true` 會在 Anthropic 相容串流路徑上將 `MiniMax-M2.7` 改寫為 `MiniMax-M2.7-highspeed`。
  </Accordion>

  <Accordion title="後援範例">
    **最適合：**將你最強的最新世代模型作為主要模型，並容錯移轉至 MiniMax M2.7。以下範例使用 Opus 作為具體主要模型；請替換為你偏好的最新世代主要模型。

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

  <Accordion title="Coding Plan 用法詳細資訊">
    - Coding Plan 用量 API：`https://api.minimaxi.com/v1/token_plan/remains` 或 `https://api.minimax.io/v1/token_plan/remains`（需要 coding plan 金鑰）。
    - 設定後，用量輪詢會從 `models.providers.minimax-portal.baseUrl` 或 `models.providers.minimax.baseUrl` 衍生主機，因此使用 `https://api.minimax.io/anthropic` 的 global 設定會輪詢 `api.minimax.io`。缺少或格式錯誤的基底 URL 會保留 CN 後援以維持相容性。
    - OpenClaw 會將 MiniMax coding-plan 用量正規化為其他供應商使用的相同 `% left` 顯示。MiniMax 原始的 `usage_percent` / `usagePercent` 欄位代表剩餘配額，而不是已消耗配額，因此 OpenClaw 會將其反轉。存在以計數為基礎的欄位時，會優先採用。
    - 當 API 回傳 `model_remains` 時，OpenClaw 會偏好聊天模型項目，在需要時從 `start_time` / `end_time` 衍生視窗標籤，並在方案標籤中包含所選模型名稱，讓 coding-plan 視窗更容易區分。
    - 用量快照會將 `minimax`、`minimax-cn` 與 `minimax-portal` 視為相同的 MiniMax 配額介面，並優先使用已儲存的 MiniMax OAuth，再後援至 Coding Plan 金鑰環境變數。

  </Accordion>
</AccordionGroup>

## 備註

- 模型參照會遵循驗證路徑：
  - API 金鑰設定：`minimax/<model>`
  - OAuth 設定：`minimax-portal/<model>`
- 預設聊天模型：`MiniMax-M2.7`
- 替代聊天模型：`MiniMax-M2.7-highspeed`
- 入門設定與直接 API 金鑰設定會為兩個 M2.7 變體寫入僅限文字的模型定義
- 圖像理解使用 Plugin 擁有的 `MiniMax-VL-01` 媒體供應商
- 如果你需要精確的成本追蹤，請更新 `models.json` 中的定價值
- 使用 `openclaw models list` 確認目前的供應商 id，然後用 `openclaw models set minimax/MiniMax-M2.7` 或 `openclaw models set minimax-portal/MiniMax-M2.7` 切換

<Tip>
MiniMax Coding Plan 推薦連結（九折）：[MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
請參閱[模型供應商](/zh-TW/concepts/model-providers)，了解供應商規則。
</Note>

## 疑難排解

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    這通常表示 **MiniMax 供應商尚未設定**（找不到相符的供應商項目，也找不到 MiniMax 驗證設定檔/環境金鑰）。此偵測修正已包含在 **2026.1.12**。修正方式：

    - 升級至 **2026.1.12**（或從原始碼 `main` 執行），然後重新啟動 gateway。
    - 執行 `openclaw configure` 並選取 **MiniMax** 驗證選項，或
    - 手動加入相符的 `models.providers.minimax` 或 `models.providers.minimax-portal` 區塊，或
    - 設定 `MINIMAX_API_KEY`、`MINIMAX_OAUTH_TOKEN`，或 MiniMax 驗證設定檔，讓相符的供應商可被注入。

    請確認模型 id **區分大小寫**：

    - API 金鑰路徑：`minimax/MiniMax-M2.7` 或 `minimax/MiniMax-M2.7-highspeed`
    - OAuth 路徑：`minimax-portal/MiniMax-M2.7` 或 `minimax-portal/MiniMax-M2.7-highspeed`

    然後重新檢查：

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
更多協助：[疑難排解](/zh-TW/help/troubleshooting)與[常見問題](/zh-TW/help/faq)。
</Note>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照與容錯移轉行為。
  </Card>
  <Card title="圖像生成" href="/zh-TW/tools/image-generation" icon="image">
    共用圖像工具參數與供應商選擇。
  </Card>
  <Card title="音樂生成" href="/zh-TW/tools/music-generation" icon="music">
    共用音樂工具參數與供應商選擇。
  </Card>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用影片工具參數與供應商選擇。
  </Card>
  <Card title="MiniMax Search" href="/zh-TW/tools/minimax-search" icon="magnifying-glass">
    透過 MiniMax Token Plan 設定網頁搜尋。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    一般疑難排解與常見問題。
  </Card>
</CardGroup>
