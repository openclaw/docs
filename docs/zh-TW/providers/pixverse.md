---
read_when:
    - 你想在 OpenClaw 中使用 PixVerse 影片生成
    - 你需要 PixVerse API 金鑰/環境變數設定
    - 你想要將 PixVerse 設為預設影片提供者
summary: OpenClaw 中的 PixVerse 影片生成設定
title: PixVerse
x-i18n:
    generated_at: "2026-06-27T19:57:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9967ec20f7a9db3413db12ed75f836ae0bee6610e765f049720988b43494d37b
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw 提供 `pixverse` 作為官方外部外掛，用於託管的 PixVerse 影片生成。此外掛會依據 `videoGenerationProviders` 合約註冊 `pixverse` 提供者。

| 屬性               | 值                                                                   |
| ------------------ | -------------------------------------------------------------------- |
| 提供者 ID          | `pixverse`                                                           |
| 外掛套件           | `@openclaw/pixverse-provider`                                        |
| 驗證環境變數       | `PIXVERSE_API_KEY`                                                   |
| 導覽設定旗標       | `--auth-choice pixverse-api-key`                                     |
| 直接命令列介面旗標 | `--pixverse-api-key <key>`                                           |
| API                | PixVerse Platform API v2（`video_id` 提交加上結果輪詢）              |
| 預設模型           | `pixverse/v6`                                                        |
| 預設 API 區域      | 國際                                                                 |

## 開始使用

<Steps>
  <Step title="安裝外掛">
    ```bash
    openclaw plugins install clawhub:@openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="設定 API 金鑰">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    精靈會先詢問要使用國際端點
    (`https://app-api.pixverse.ai/openapi/v2`) 或 CN 端點
    (`https://app-api.pixverseai.cn/openapi/v2`)，再將 `region` 和
    `baseUrl` 寫入提供者設定。

  </Step>
  <Step title="將 PixVerse 設為預設影片提供者">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="生成影片">
    要求代理生成影片。PixVerse 會自動被使用。
  </Step>
</Steps>

## 支援的模式與模型

提供者會透過 OpenClaw 的共用影片工具公開 PixVerse 生成模型。

| 模式       | 模型                 | 參考輸入             |
| ---------- | -------------------- | -------------------- |
| 文字轉影片 | `v6`（預設）、`c1`   | 無                   |
| 圖片轉影片 | `v6`（預設）、`c1`   | 1 張本機或遠端圖片   |

本機圖片參考會先上傳到 PixVerse，再發出圖片轉影片請求。遠端圖片 URL 會透過 PixVerse 圖片上傳端點以 `image_url` 傳遞。

| 選項     | 支援的值                                                                    |
| -------- | --------------------------------------------------------------------------- |
| 時長     | 1-15 秒                                                                     |
| 解析度   | `360P`, `540P`, `720P`, `1080P`                                             |
| 長寬比   | `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9`，用於文字轉影片 |
| 生成音訊 | `audio: true`                                                               |

<Note>
PixVerse 圖片範本生成尚未透過 `image_generate` 公開。該 API 由範本 ID 驅動，而 OpenClaw 的共用圖片生成合約目前沒有 PixVerse 專屬的型別化選項包。
</Note>

## 提供者選項

影片提供者接受以下選用的提供者專屬鍵：

| 選項                                 | 型別   | 效果                         |
| ------------------------------------ | ------ | ---------------------------- |
| `seed`                               | number | 支援時使用的確定性種子       |
| `negativePrompt` / `negative_prompt` | string | 負面提示詞                   |
| `quality`                            | string | PixVerse 畫質，例如 `720p`   |
| `motionMode` / `motion_mode`         | string | 圖片轉影片動作模式           |
| `cameraMovement` / `camera_movement` | string | PixVerse 鏡頭運動預設        |
| `templateId` / `template_id`         | number | 已啟用的 PixVerse 範本 ID    |

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
    OpenClaw 預設使用國際 PixVerse API。當你的金鑰屬於特定 PixVerse 平台區域時，請手動設定 `models.providers.pixverse.region`，或使用
    `openclaw onboard --auth-choice pixverse-api-key` 在設定精靈中選擇：

    | 區域值          | PixVerse API 基底 URL                     |
    | --------------- | --------------------------------------------- |
    | `international` | `https://app-api.pixverse.ai/openapi/v2`      |
    | `cn`            | `https://app-api.pixverseai.cn/openapi/v2`    |

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
    只有在透過可信任的相容代理路由時，才設定 `models.providers.pixverse.baseUrl`。
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
    PixVerse 會從生成請求回傳 `video_id`。OpenClaw 會輪詢
    `/openapi/v2/video/result/{video_id}`，直到任務成功、失敗或逾時。
  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用工具參數、提供者選擇與非同步行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/config-agents#agent-defaults" icon="gear">
    代理預設設定，包括影片生成模型。
  </Card>
</CardGroup>
