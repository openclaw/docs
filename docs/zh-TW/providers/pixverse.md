---
read_when:
    - 你想要在 OpenClaw 中使用 PixVerse 影片生成功能
    - 你需要設定 PixVerse API 金鑰／環境變數
    - 你想將 PixVerse 設為預設影片供應商
summary: OpenClaw 中的 PixVerse 影片生成設定
title: PixVerse
x-i18n:
    generated_at: "2026-07-11T21:44:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 50204c771deb315e7336325f2852e4b65dfba4264bbe288b819d44b8def1ce82
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw 提供 `pixverse` 作為官方外部外掛，用於託管式 PixVerse 影片生成。此外掛會依照 `videoGenerationProviders` 合約註冊 `pixverse` 提供者。

| 屬性               | 值                                                                   |
| ------------------ | -------------------------------------------------------------------- |
| 提供者 ID          | `pixverse`                                                           |
| 外掛套件           | `@openclaw/pixverse-provider`                                        |
| 驗證環境變數       | `PIXVERSE_API_KEY`                                                   |
| 初始設定旗標       | `--auth-choice pixverse-api-key`                                     |
| 直接命令列介面旗標 | `--pixverse-api-key <key>`                                           |
| API                | PixVerse Platform API v2（提交 `video_id` 並輪詢結果）               |
| 預設模型           | `pixverse/v6`                                                        |
| 預設 API 區域      | 國際版                                                               |

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

    精靈會先提示選擇國際版或中國版端點（請參閱下方的 API 區域），再將 `region` 和 `baseUrl` 寫入提供者設定。
    非互動式執行（透過 `--pixverse-api-key` 或 `PIXVERSE_API_KEY` 提供金鑰）
    預設使用國際版。

    若尚未設定預設影片模型，初始設定也會將
    `agents.defaults.videoGenerationModel.primary` 設為
    `pixverse/v6`。

  </Step>
  <Step title="切換現有的預設影片提供者（選用）">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="生成影片">
    要求代理生成影片。系統會自動使用 PixVerse。
  </Step>
</Steps>

## 支援的模式與模型

此提供者透過 OpenClaw 的共用影片工具提供 PixVerse 生成模型。

| 模式       | 模型                 | 參考輸入                |
| ---------- | -------------------- | ----------------------- |
| 文字轉影片 | `v6`（預設）、`c1`   | 無                      |
| 圖片轉影片 | `v6`（預設）、`c1`   | 1 張本機或遠端圖片      |

圖片轉影片請求發出前，系統會先將本機圖片參照上傳至 PixVerse。遠端圖片 URL 則會以 `image_url` 傳遞至 PixVerse 圖片上傳端點。

| 選項       | 支援的值                                                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 時長       | 1 至 15 秒（預設 5 秒）                                                                                                           |
| 解析度     | `360P`、`540P`、`720P`、`1080P`（預設 `540P`；`480P` 請求會對應至 `540P`）                                                        |
| 長寬比     | `16:9`（預設）、`4:3`、`1:1`、`3:4`、`9:16`、`2:3`、`3:2`、`21:9`；僅適用於文字轉影片，圖片轉影片會沿用來源圖片 |
| 生成音訊   | `audio: true`                                                                                                                     |

<Note>
目前尚未透過 `image_generate` 提供 PixVerse 圖片範本生成功能。該 API 由範本 ID 驅動，而 OpenClaw 的共用圖片生成合約目前沒有 PixVerse 專用的具型別選項集合。
</Note>

## 提供者選項

影片提供者接受下列選用的提供者專用鍵：

| 選項                                 | 類型   | 效果                                          |
| ------------------------------------ | ------ | --------------------------------------------- |
| `seed`                               | 數字   | 決定性種子，範圍為 0 至 2147483647           |
| `negativePrompt` / `negative_prompt` | 字串   | 負面提示詞                                    |
| `quality`                            | 字串   | PixVerse 畫質，例如 `720p`                    |
| `motionMode` / `motion_mode`         | 字串   | 圖片轉影片的動態模式（預設為 `normal`）       |
| `cameraMovement` / `camera_movement` | 字串   | PixVerse 攝影機運鏡預設                       |
| `templateId` / `template_id`         | 數字   | 已啟用的 PixVerse 範本 ID                     |

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
    | 區域值          | PixVerse API 基礎 URL                          |
    | --------------- | --------------------------------------------- |
    | `international` | `https://app-api.pixverse.ai/openapi/v2`      |
    | `cn`            | `https://app-api.pixverseai.cn/openapi/v2`    |

    當您的金鑰屬於特定 PixVerse 平台區域時，請手動設定
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

  <Accordion title="自訂基礎 URL">
    僅在透過受信任且相容的 Proxy 路由時，才設定 `models.providers.pixverse.baseUrl`。
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
    PixVerse 會從生成請求傳回 `video_id`。OpenClaw 每 5 秒輪詢一次
    `/openapi/v2/video/result/{video_id}`，直到任務成功、失敗或達到逾時限制
    （預設為 5 分鐘；可使用 `agents.defaults.videoGenerationModel.timeoutMs`
    覆寫）。
  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用工具參數、提供者選擇與非同步行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/config-agents#agent-defaults" icon="gear">
    代理的預設設定，包括影片生成模型。
  </Card>
</CardGroup>
