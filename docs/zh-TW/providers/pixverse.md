---
read_when:
    - 你想在 OpenClaw 中使用 PixVerse 影片生成
    - 你需要 PixVerse API 金鑰／環境變數設定
    - 你想將 PixVerse 設為預設影片提供者
summary: OpenClaw 中的 PixVerse 影片生成設定
title: PixVerse
x-i18n:
    generated_at: "2026-07-05T11:43:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 50204c771deb315e7336325f2852e4b65dfba4264bbe288b819d44b8def1ce82
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw 提供 `pixverse` 作為官方外部外掛，用於託管的 PixVerse 影片生成。此外掛會依據 `videoGenerationProviders` 合約註冊 `pixverse` 提供者。

| 屬性               | 值                                                                   |
| ------------------ | -------------------------------------------------------------------- |
| 提供者 id          | `pixverse`                                                           |
| 外掛套件           | `@openclaw/pixverse-provider`                                        |
| 驗證環境變數       | `PIXVERSE_API_KEY`                                                   |
| 初始設定旗標       | `--auth-choice pixverse-api-key`                                     |
| 直接命令列介面旗標 | `--pixverse-api-key <key>`                                           |
| API                | PixVerse Platform API v2（`video_id` 提交加上結果輪詢）              |
| 預設模型           | `pixverse/v6`                                                        |
| 預設 API 區域      | 國際                                                                 |

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

    精靈會先提示選擇國際或中國端點（請參閱下方的 API 區域），
    然後將 `region` 和 `baseUrl` 寫入提供者設定。
    非互動式執行（金鑰來自 `--pixverse-api-key` 或 `PIXVERSE_API_KEY`）
    預設使用國際。

    初始設定也會在尚未設定預設影片模型時，將 `agents.defaults.videoGenerationModel.primary` 設為
    `pixverse/v6`。

  </Step>
  <Step title="切換現有的預設影片提供者（選用）">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="生成影片">
    要求代理程式生成影片。PixVerse 會自動被使用。
  </Step>
</Steps>

## 支援的模式和模型

提供者會透過 OpenClaw 的共用影片工具公開 PixVerse 生成模型。

| 模式       | 模型                 | 參考輸入             |
| ---------- | -------------------- | -------------------- |
| 文字轉影片 | `v6`（預設）、`c1`   | 無                   |
| 圖片轉影片 | `v6`（預設）、`c1`   | 1 張本機或遠端圖片   |

本機圖片參照會先上傳到 PixVerse，然後才送出圖片轉影片請求。遠端圖片 URL 會透過 PixVerse 圖片上傳端點以 `image_url` 傳遞。

| 選項       | 支援的值                                                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 時長       | 1-15 秒（預設 5）                                                                                                                |
| 解析度     | `360P`、`540P`、`720P`、`1080P`（預設 `540P`；`480P` 請求會對應到 `540P`）                                                       |
| 長寬比     | `16:9`（預設）、`4:3`、`1:1`、`3:4`、`9:16`、`2:3`、`3:2`、`21:9`；僅限文字轉影片，圖片轉影片會沿用來源圖片 |
| 生成音訊   | `audio: true`                                                                                                                    |

<Note>
PixVerse 圖片範本生成尚未透過 `image_generate` 公開。該 API 由範本 id 驅動，而 OpenClaw 的共用圖片生成合約目前沒有 PixVerse 專用的型別化選項包。
</Note>

## 提供者選項

影片提供者接受以下選用的提供者專屬鍵：

| 選項                                 | 型別   | 效果                                      |
| ------------------------------------ | ------ | ----------------------------------------- |
| `seed`                               | number | 決定性種子，0 到 2147483647              |
| `negativePrompt` / `negative_prompt` | string | 負向提示詞                                |
| `quality`                            | string | PixVerse 品質，例如 `720p`                |
| `motionMode` / `motion_mode`         | string | 圖片轉影片動作模式（預設 `normal`）       |
| `cameraMovement` / `camera_movement` | string | PixVerse 攝影機移動預設                   |
| `templateId` / `template_id`         | number | 已啟用的 PixVerse 範本 id                 |

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
    | 區域值          | PixVerse API 基底 URL                       |
    | --------------- | --------------------------------------------- |
    | `international` | `https://app-api.pixverse.ai/openapi/v2`      |
    | `cn`            | `https://app-api.pixverseai.cn/openapi/v2`    |

    當你的金鑰屬於特定 PixVerse 平台區域時，請手動設定 `models.providers.pixverse.region`，
    或執行
    `openclaw onboard --auth-choice pixverse-api-key`，在
    設定精靈中選擇區域：

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            region: "cn", // "international" or "cn"
            baseUrl: "https://app-api.pixverseai.cn/openapi/v2",
            models: [],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="自訂基底 URL">
    只有在透過受信任的相容代理路由時，才設定 `models.providers.pixverse.baseUrl`。
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
    `/openapi/v2/video/result/{video_id}`，直到任務
    成功、失敗或達到逾時（預設 5 分鐘；可用
    `agents.defaults.videoGenerationModel.timeoutMs` 覆寫）。
  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用工具參數、提供者選擇和非同步行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/config-agents#agent-defaults" icon="gear">
    代理程式預設設定，包括影片生成模型。
  </Card>
</CardGroup>
