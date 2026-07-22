---
read_when:
    - 你想在 OpenClaw 中使用 MiniMax 模型
    - 你需要 MiniMax 設定指南
summary: 在 OpenClaw 中使用 MiniMax 模型
title: MiniMax
x-i18n:
    generated_at: "2026-07-22T10:45:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6d3e95cf9836fd0bc30ac91649422a1d0ed8e7b2908a42e241106c1ea783cbbc
    source_path: providers/minimax.md
    workflow: 16
---

隨附的 `minimax` 外掛註冊了兩個提供者及五項功能：聊天、圖片生成、音樂生成、影片生成、圖片理解、語音（T2A v2）和網路搜尋。

| 提供者 ID      | 驗證    | 功能                                                                                        |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | API 金鑰 | 文字、圖片生成、音樂生成、影片生成、圖片理解、語音、網路搜尋 |
| `minimax-portal` | OAuth   | 文字、圖片生成、音樂生成、影片生成、圖片理解、語音             |

<Tip>
MiniMax Coding Plan 推薦連結（九折優惠）：[MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

## 內建目錄

| 模型                    | 類型             | 說明                              |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M3`             | 聊天（推理） | 預設的託管推理模型           |
| `MiniMax-M2.7`           | 聊天（推理） | 前一版託管推理模型          |
| `MiniMax-M2.7-highspeed` | 聊天（推理） | 較快的 M2.7 推理層級               |
| `MiniMax-VL-01`          | 視覺           | 圖片理解模型                |
| `image-01`               | 圖片生成 | 文字轉圖片與圖片轉圖片編輯 |
| `music-2.6`              | 音樂生成 | 預設音樂模型                      |
| `MiniMax-Hailuo-2.3`     | 影片生成 | 文字轉影片與圖片轉影片流程   |

模型參照會依循驗證路徑：API 金鑰設定使用 `minimax/<model>`，OAuth 設定使用 `minimax-portal/<model>`。

## 開始使用

<Tabs>
  <Tab title="OAuth（Coding Plan）">
    **最適合：**透過 OAuth 快速設定 MiniMax Coding Plan，無須 API 金鑰。

    <Tabs>
      <Tab title="國際">
        <Steps>
          <Step title="執行初始設定">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            產生的提供者基底 URL：`api.minimax.io`。
          </Step>
          <Step title="確認模型可用">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="中國">
        <Steps>
          <Step title="執行初始設定">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            產生的提供者基底 URL：`api.minimaxi.com`。
          </Step>
          <Step title="確認模型可用">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    OAuth 設定使用 `minimax-portal` 提供者 ID。模型參照採用 `minimax-portal/MiniMax-M3` 格式。
    </Note>

  </Tab>

  <Tab title="API 金鑰">
    **最適合：**使用 Anthropic 相容 API 的託管 MiniMax。

    <Tabs>
      <Tab title="國際">
        <Steps>
          <Step title="執行初始設定">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            這會將 `api.minimax.io` 設為基底 URL。
          </Step>
          <Step title="確認模型可用">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="中國">
        <Steps>
          <Step title="執行初始設定">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            這會將 `api.minimaxi.com` 設為基底 URL。
          </Step>
          <Step title="確認模型可用">
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
    MiniMax-M2.x 的 Anthropic 相容串流端點會在 OpenAI 樣式的差異區塊中發出 `reasoning_content`，而非原生 Anthropic 思考區塊；若思考功能處於隱含啟用狀態，這會使內部推理洩漏至可見輸出。除非你自行明確設定 `thinking`，否則 OpenClaw 預設會停用 M2.x 的思考功能。MiniMax-M3（及向前相容的 M3.x）不受此限制：M3 會發出正確的 Anthropic 思考區塊，且必須啟用思考功能才能產生可見內容，因此 OpenClaw 會讓 M3 繼續採用提供者的自適應思考路徑。請參閱下方「進階設定」中的「思考功能預設值」一節。
    </Warning>

    <Note>
    API 金鑰設定使用 `minimax` 提供者 ID。模型參照採用 `minimax/MiniMax-M3` 格式。
    </Note>

  </Tab>
</Tabs>

## 透過 `openclaw configure` 設定

<Steps>
  <Step title="啟動精靈">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="選取 Model/auth">
    從選單中選擇 **Model/auth**。
  </Step>
  <Step title="選擇 MiniMax 驗證選項">
    | 驗證選項            | 說明                        |
    | ----------------------- | ----------------------------------- |
    | `minimax-global-oauth` | 國際 OAuth（Coding Plan）  |
    | `minimax-cn-oauth`     | 中國 OAuth（Coding Plan）          |
    | `minimax-global-api`   | 國際 API 金鑰              |
    | `minimax-cn-api`       | 中國 API 金鑰                      |
  </Step>
  <Step title="選取預設模型">
    出現提示時，選取你的預設模型。
  </Step>
</Steps>

## 功能

### 圖片生成

MiniMax 外掛會在 `minimax` 和 `minimax-portal` 上為 `image_generate` 工具註冊 `image-01` 模型，並重複使用文字模型所使用的 `MINIMAX_API_KEY` 或 OAuth 驗證。

- 文字轉圖片生成與圖片轉圖片編輯（主體參照），兩者皆支援長寬比控制
- 每個請求最多輸出 9 張圖片，每個編輯請求可使用 1 張參照圖片
- 支援的長寬比：`1:1`、`16:9`、`4:3`、`3:2`、`2:3`、`3:4`、`9:16`、`21:9`

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

圖片生成一律使用 MiniMax 的專用圖片端點（`/v1/image_generation`），並忽略 `models.providers.minimax.baseUrl`，因為該欄位設定的是聊天／Anthropic 相容的基底 URL。設定 `MINIMAX_API_HOST=https://api.minimaxi.com` 可將圖片生成路由至中國端點；預設的全球端點為 `https://api.minimax.io`。

<Note>
請參閱[圖片生成](/zh-TW/tools/image-generation)，了解共用工具參數、提供者選取和容錯移轉行為。
</Note>

### 文字轉語音

隨附的 `minimax` 外掛會將 MiniMax T2A v2 註冊為 `tts` 的語音提供者。

- 預設 TTS 模型：`speech-2.8-hd`
- 預設語音：`English_expressive_narrator`
- 隨附的模型 ID：`speech-2.8-hd`、`speech-2.8-turbo`、`speech-2.6-hd`、`speech-2.6-turbo`、`speech-02-hd`、`speech-02-turbo`、`speech-01-hd`、`speech-01-turbo`
- 驗證解析順序：`tts.providers.minimax.apiKey`，接著是 `minimax-portal` OAuth／權杖驗證設定檔，再來是 Token Plan 環境金鑰（`MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`），最後是 `MINIMAX_API_KEY`
- 若未設定 TTS 主機，OpenClaw 會重複使用已設定的 `minimax-portal` OAuth 主機，並移除 `/anthropic` 等 Anthropic 相容路徑尾碼
- 一般音訊附件會維持 MP3 格式。語音訊息目標（Feishu、Telegram，以及其他要求語音訊息相容附件的頻道）會使用 `ffmpeg` 將 MiniMax MP3 轉碼為 48kHz Opus，因為例如 Feishu/Lark 檔案 API 的原生音訊訊息只接受 `file_type: "opus"`
- MiniMax T2A 的 `speed` 和 `vol` 接受小數值，但 `pitch` 會以整數傳送；OpenClaw 會在 API 請求前截斷 `pitch` 的小數值

| 設定                         | 環境變數                | 預設值                       | 說明                      |
| ------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | MiniMax T2A API 主機。            |
| `tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | TTS 模型 ID。                    |
| `tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | 用於語音輸出的語音 ID。 |
| `tts.providers.minimax.speed`   |                        | `1.0`                         | 播放速度，`0.5..2.0`。      |
| `tts.providers.minimax.vol`     |                        | `1.0`                         | 音量，`(0, 10]`。               |
| `tts.providers.minimax.pitch`   |                        | `0`                           | 整數音高偏移，`-12..12`。  |

### 音樂生成

隨附的 MiniMax 外掛會透過共用的 `music_generate` 工具，為 `minimax` 和 `minimax-portal` 註冊音樂生成功能。

- 預設音樂模型：`minimax/music-2.6`（OAuth：`minimax-portal/music-2.6`）
- 亦支援 `music-2.6-free`、`music-cover` 和 `music-cover-free`
- 提示詞控制：`lyrics`、`instrumental`
- 輸出格式：`mp3`
- 以工作階段為基礎的執行會透過共用的工作／狀態流程分離，包括 `action: "status"`

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: { primary: "minimax/music-2.6" },
    },
  },
}
```

<Note>
請參閱[音樂生成](/zh-TW/tools/music-generation)，了解共用工具參數、提供者選取和容錯移轉行為。
</Note>

### 影片生成

隨附的 MiniMax 外掛會透過共用的 `video_generate` 工具，為 `minimax` 和 `minimax-portal` 註冊影片生成功能。

- 預設影片模型：`minimax/MiniMax-Hailuo-2.3`（OAuth：`minimax-portal/MiniMax-Hailuo-2.3`）
- 也支援 `MiniMax-Hailuo-2.3-Fast`、`MiniMax-Hailuo-02`、`I2V-01-Director`、`I2V-01-live` 和 `I2V-01`
- 模式：文字轉影片和單一圖片參考流程
- 支援 `resolution`（在 Hailuo 2.3/02 模型上為 `768P` 或 `1080P`）；不支援 `aspectRatio`，且會予以忽略

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "minimax/MiniMax-Hailuo-2.3" },
    },
  },
}
```

<Note>
共用工具參數、供應商選擇和容錯移轉行為請參閱[影片生成](/zh-TW/tools/video-generation)。
</Note>

### 圖片理解

MiniMax 外掛會將圖片理解與文字目錄分開註冊：

| 供應商 ID      | 預設圖片模型 | PDF 文字擷取 |
| ---------------- | ------------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     | `MiniMax-M2.7`      |
| `minimax-portal` | `MiniMax-VL-01`     | `MiniMax-M2.7`      |

因此，即使內建的文字供應商目錄也包含支援圖片的 M3 聊天參照，自動媒體路由仍可使用 MiniMax 圖片理解。PDF 理解僅使用 `MiniMax-M2.7` 擷取文字；MiniMax 不會註冊 PDF 轉圖片的轉換路徑。

### 網頁搜尋

MiniMax 外掛也會透過 MiniMax Token Plan 搜尋 API（`/v1/coding_plan/search`）註冊 `web_search`。

- 供應商 ID：`minimax`
- 結構化結果：標題、URL、摘要、相關查詢
- 建議的環境變數：`MINIMAX_CODE_PLAN_KEY`
- 接受的環境變數別名：`MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN`
- 相容性備援：當 `MINIMAX_API_KEY` 已指向 Token Plan 認證資訊時使用
- 區域重用：依序使用 `plugins.entries.minimax.config.webSearch.region`、`MINIMAX_API_HOST`，再使用 MiniMax 供應商基底 URL
- 搜尋會維持使用供應商 ID `minimax`；OAuth 中國／全球設定可透過 `models.providers.minimax-portal.baseUrl` 間接引導區域，並可透過 `MINIMAX_OAUTH_TOKEN` 提供 Bearer 驗證

設定位於 `plugins.entries.minimax.config.webSearch.*` 下。

<Note>
完整的網頁搜尋設定與用法請參閱 [MiniMax 搜尋](/zh-TW/tools/minimax-search)。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="設定選項">
    | 選項 | 說明 |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | 優先使用 `https://api.minimax.io/anthropic`（與 Anthropic 相容）；若使用與 OpenAI 相容的酬載，可選擇性設定 `https://api.minimax.io/v1` |
    | `models.providers.minimax.api` | 優先使用 `anthropic-messages`；若使用與 OpenAI 相容的酬載，可選擇性設定 `openai-completions` |
    | `models.providers.minimax.apiKey` | MiniMax API 金鑰（`MINIMAX_API_KEY`） |
    | `models.providers.minimax.models` | 定義 `id`、`name`、`reasoning`、`contextWindow`、`maxTokens`、`cost` |
    | `agents.defaults.models` | 各模型的別名、參數和中繼資料 |
    | `agents.defaults.modelPolicy.allow` | 選用的明確模型允許清單 |
    | `models.mode` | 若要在內建項目之外新增 MiniMax，請保留 `merge` |
  </Accordion>

  <Accordion title="思考預設值">
    在 `api: "anthropic-messages"` 上，除非先前的包裝器已在酬載中設定 `thinking` 欄位，否則 OpenClaw 會為 MiniMax M2.x 模型注入 `thinking: { type: "disabled" }`。這可避免 M2.x 的串流端點在 OpenAI 樣式的差異區塊中發出 `reasoning_content`，以免內部推理洩漏至可見輸出。

    MiniMax-M3（以及 M3.x）不受此限制：停用思考時，M3 會傳回包含 `stop_reason: "end_turn"` 的空 `content` 陣列，因此 OpenClaw 會移除 M3 隱含的停用預設值；設定思考層級時，則會強制改用 `thinking: { type: "adaptive" }`。

    各模型系列可用的思考層級：

    | 模型系列   | 層級                                   | 預設值    |
    | -------------- | ----------------------------------------- | ---------- |
    | `MiniMax-M3`   | `off`、`adaptive`                        | `adaptive` |
    | `MiniMax-M2.x` | `off`、`minimal`、`low`、`medium`、`high` | `off`      |

  </Accordion>

  <Accordion title="快速模式">
    `/fast on` 或 `params.fastMode: true` 會在與 Anthropic 相容的串流路徑（`api: "anthropic-messages"`，供應商為 `minimax` 或 `minimax-portal`）上，將 `MiniMax-M2.7` 改寫為 `MiniMax-M2.7-highspeed`。
  </Accordion>

  <Accordion title="備援範例">
    **最適合：**將最強的最新世代模型保持為主要模型，並在失敗時容錯移轉至 MiniMax M2.7。下方範例使用 Opus 作為具體的主要模型；請替換成你偏好的最新世代主要模型。

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

  <Accordion title="Coding Plan 用量詳細資訊">
    - Coding Plan 用量 API：`https://api.minimaxi.com/v1/token_plan/remains` 或 `https://api.minimax.io/v1/token_plan/remains`（需要 Coding Plan 金鑰）。
    - 設定後，用量輪詢會從 `models.providers.minimax-portal.baseUrl` 或 `models.providers.minimax.baseUrl` 推導主機，因此使用 `https://api.minimax.io/anthropic` 的全球設定會輪詢 `api.minimax.io`。若基底 URL 遺失或格式錯誤，則會保留中國區備援以維持相容性。
    - OpenClaw 會將 MiniMax Coding Plan 用量正規化為其他供應商使用的相同 `% left` 顯示格式。MiniMax 的原始 `usage_percent`／`usagePercent` 欄位代表剩餘配額，而非已用配額，因此 OpenClaw 會將其反轉。若存在以計數為基礎的欄位，則優先採用。
    - 當 API 傳回 `model_remains` 時，OpenClaw 會優先採用聊天模型項目，並視需要從 `start_time`／`end_time` 推導時間範圍標籤，且會在方案標籤中包含所選模型名稱，讓 Coding Plan 的時間範圍更容易區分。
    - 用量快照會將 `minimax`、`minimax-cn`、`minimax-portal` 和 `minimax-portal-cn` 視為相同的 MiniMax 配額介面，並優先使用已儲存的 MiniMax OAuth，之後才備援至 Coding Plan 金鑰環境變數。

  </Accordion>
</AccordionGroup>

## 注意事項

- 預設聊天模型：`MiniMax-M3`。替代聊天模型：`MiniMax-M2.7`、`MiniMax-M2.7-highspeed`
- 新手引導和直接 API 金鑰設定會為 M3 和兩種 M2.7 變體寫入模型定義
- 圖片理解使用由外掛擁有的 `MiniMax-VL-01` 媒體供應商
- 若需要精確追蹤成本，請更新 `models.json` 中的定價值
- 使用 `openclaw models list` 確認目前的供應商 ID，然後使用 `openclaw models set minimax/MiniMax-M3` 或 `openclaw models set minimax-portal/MiniMax-M3` 切換

<Note>
供應商規則請參閱[模型供應商](/zh-TW/concepts/model-providers)。
</Note>

## 疑難排解

<AccordionGroup>
  <Accordion title='"未知模型：minimax/MiniMax-M3"'>
    這通常表示 **MiniMax 供應商尚未設定**（找不到相符的供應商項目，也找不到 MiniMax 驗證設定檔／環境變數金鑰）。修正方式如下：

    - 執行 `openclaw configure` 並選取 **MiniMax** 驗證選項，或
    - 手動新增相符的 `models.providers.minimax` 或 `models.providers.minimax-portal` 區塊，或
    - 設定 `MINIMAX_API_KEY`、`MINIMAX_OAUTH_TOKEN` 或 MiniMax 驗證設定檔，讓相符的供應商得以注入。

    請確認模型 ID **區分大小寫**：

    - API 金鑰路徑：`minimax/MiniMax-M3`、`minimax/MiniMax-M2.7` 或 `minimax/MiniMax-M2.7-highspeed`
    - OAuth 路徑：`minimax-portal/MiniMax-M3`、`minimax-portal/MiniMax-M2.7` 或 `minimax-portal/MiniMax-M2.7-highspeed`

    接著使用以下命令重新檢查：

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
更多協助：[疑難排解](/zh-TW/help/troubleshooting)和[常見問題](/zh-TW/help/faq)。
</Note>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照和容錯移轉行為。
  </Card>
  <Card title="圖片生成" href="/zh-TW/tools/image-generation" icon="image">
    共用圖片工具參數和供應商選擇。
  </Card>
  <Card title="音樂生成" href="/zh-TW/tools/music-generation" icon="music">
    共用音樂工具參數和供應商選擇。
  </Card>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用影片工具參數和供應商選擇。
  </Card>
  <Card title="MiniMax 搜尋" href="/zh-TW/tools/minimax-search" icon="magnifying-glass">
    透過 MiniMax Token Plan 設定網頁搜尋。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    一般疑難排解和常見問題。
  </Card>
</CardGroup>
