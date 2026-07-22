---
read_when:
    - 你想在 OpenClaw 中使用 PixVerse 影片生成功能
    - 你需要設定 PixVerse API 金鑰／環境變數
    - 你想將 PixVerse 設為預設影片供應商
summary: OpenClaw 中的 PixVerse 影片生成設定
title: PixVerse
x-i18n:
    generated_at: "2026-07-22T10:47:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3dba881e877e3da4677a40dff736cb46de114337a1e0338ef8220dcd8e616f46
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw 提供 `pixverse`，作為用於託管 PixVerse 影片生成的官方外部外掛。此外掛會依照 `videoGenerationProviders` 合約註冊 `pixverse` 提供者。

| 屬性               | 值                                                                   |
| ------------------ | -------------------------------------------------------------------- |
| 提供者 ID          | `pixverse`                                                   |
| 外掛套件           | `@openclaw/pixverse-provider`                                                   |
| 驗證環境變數       | `PIXVERSE_API_KEY`                                                   |
| 初始設定旗標       | `--auth-choice pixverse-api-key`                                                   |
| 直接命令列介面旗標 | `--pixverse-api-key <key>`                                                   |
| API                | PixVerse Platform API v2（`video_id` 提交加上結果輪詢）      |
| 預設模型           | `pixverse/v6`                                                   |
| 預設 API 區域      | International                                                        |

## 開始使用

<Steps>
  <Step title="安裝外掛">
    ```bash
    openclaw plugins install @openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="設定 API 金鑰">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    精靈會先提示選擇 International 或 CN 端點（請參閱下方的 API 區域），
    然後再將 `region` 和 `baseUrl` 寫入提供者設定。
    非互動式執行（從 `--pixverse-api-key` 或 `PIXVERSE_API_KEY` 取得金鑰）
    預設使用 International。

    如果尚未設定預設影片模型，初始設定也會將 `agents.defaults.mediaModels.video.primary`
    設為 `pixverse/v6`。

  </Step>
  <Step title="切換現有的預設影片提供者（選用）">
    ```bash
    openclaw config set agents.defaults.mediaModels.video.primary "pixverse/v6"
    ```
  </Step>
  <Step title="生成影片">
    要求代理程式生成影片。系統會自動使用 PixVerse。
  </Step>
</Steps>

## 支援的模式與模型

此提供者透過 OpenClaw 的共用影片工具提供 PixVerse 生成模型。

| 模式         | 模型                                      | 參考輸入             |
| ------------ | ----------------------------------------- | -------------------- |
| 文字轉影片   | `v6`（預設）、`c1` | 無                   |
| 圖片轉影片   | `v6`（預設）、`c1` | 1 張本機或遠端圖片   |

在提出圖片轉影片要求前，本機圖片參考會先上傳至 PixVerse。遠端圖片 URL 則會以 `image_url` 傳遞至 PixVerse 圖片上傳端點。

| 選項         | 支援的值                                                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| 時長         | 1-15 秒（預設 5）                                                                                                                |
| 解析度       | `360P`、`540P`、`720P`、`1080P`（預設 `540P`；`480P` 要求會對應至 `540P`） |
| 長寬比       | `16:9`（預設）、`4:3`、`1:1`、`3:4`、`9:16`、`2:3`、`3:2`、`21:9`；僅適用於文字轉影片，圖片轉影片會遵循來源圖片 |
| 生成的音訊   | `audio: true`                                                                                                               |

<Note>
PixVerse 圖片範本生成尚未透過 `image_generate` 提供。該 API 由範本 ID 驅動，而 OpenClaw 的共用圖片生成合約目前沒有 PixVerse 專用的具型別選項集合。
</Note>

## 提供者選項

影片提供者接受下列選用的提供者專屬鍵：

| 選項                                 | 類型   | 效果                                          |
| ------------------------------------ | ------ | --------------------------------------------- |
| `seed`                   | 數字   | 決定性種子，0 至 2147483647                   |
| `negativePrompt` / `negative_prompt` | 字串   | 負面提示詞                                    |
| `quality`                   | 字串   | PixVerse 品質，例如 `720p`        |
| `motionMode` / `motion_mode` | 字串   | 圖片轉影片動態模式（預設 `normal`） |
| `cameraMovement` / `camera_movement` | 字串   | PixVerse 攝影機移動預設                       |
| `templateId` / `template_id` | 數字   | 已啟用的 PixVerse 範本 ID                     |

## 設定

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "pixverse/v6",
      },
    },
  },
}
```

## 進階設定

<AccordionGroup>
  <Accordion title="API 區域">
    | 區域值            | PixVerse API 基底 URL                          |
    | ----------------- | --------------------------------------------- |
    | `international` | `https://app-api.pixverse.ai/openapi/v2`                            |
    | `cn` | `https://app-api.pixverseai.cn/openapi/v2`                            |

    如果你的金鑰屬於特定的 PixVerse 平台區域，請手動設定
    `models.providers.pixverse.region`，或執行
    `openclaw onboard --auth-choice pixverse-api-key`，在設定精靈中選擇區域：

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            region: "cn", // "international" 或 "cn"
            baseUrl: "https://app-api.pixverseai.cn/openapi/v2",
            models: [],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="自訂基底 URL">
    只有透過受信任且相容的 Proxy 路由時，才設定 `models.providers.pixverse.baseUrl`。
    `baseUrl` 的優先順序高於 `region`。

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            baseUrl: "https://app-api.pixverse.ai/openapi/v2",
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="任務輪詢">
    PixVerse 會從生成要求傳回 `video_id`。OpenClaw 每 5 秒輪詢一次
    `/openapi/v2/video/result/{video_id}`，直到任務成功、失敗或達到逾時時間
    （預設 5 分鐘；可使用 `agents.defaults.mediaModels.video.timeoutMs` 覆寫）。
  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用工具參數、提供者選擇與非同步行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/config-agents#agent-defaults" icon="gear">
    代理程式預設設定，包括影片生成模型。
  </Card>
</CardGroup>
