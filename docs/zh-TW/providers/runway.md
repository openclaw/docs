---
read_when:
    - 你想在 OpenClaw 中使用 Runway 影片生成
    - 你需要 Runway API 金鑰/環境設定
    - 你想將 Runway 設為預設影片提供者
summary: OpenClaw 中的 Runway 影片生成設定
title: 跑道
x-i18n:
    generated_at: "2026-07-05T11:39:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7aa2a802323857bf7c839ebfab56853dc79d656a25bbc194a431959a48bbd64b
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw 隨附內建的 `runway` 提供者，用於託管影片生成，預設啟用，並註冊到 `videoGenerationProviders` 合約。

| 屬性            | 值                                                                |
| --------------- | ----------------------------------------------------------------- |
| 提供者 id       | `runway`                                                          |
| 外掛            | 內建，`enabledByDefault: true`                                    |
| 驗證環境變數    | `RUNWAYML_API_SECRET`（標準）或 `RUNWAY_API_KEY`                  |
| 入門設定旗標    | `--auth-choice runway-api-key`                                    |
| 直接命令列介面旗標 | `--runway-api-key <key>`                                       |
| 應用程式介面    | Runway 以任務為基礎的影片生成（`GET /v1/tasks/{id}` 輪詢）        |
| 預設模型        | `runway/gen4.5`                                                   |

## 開始使用

<Steps>
  <Step title="Set the API key">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Set Runway as the default video provider">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Generate a video">
    要求代理程式生成影片。Runway 會自動使用。
  </Step>
</Steps>

## 支援的模式與模型

此提供者公開七個 Runway 模型，分為三種模式。同一個模型 id 可以服務多個模式（例如 `gen4.5` 同時適用於文字轉影片與圖片轉影片）。

| 模式           | 模型                                                                   | 參照輸入                |
| -------------- | ---------------------------------------------------------------------- | ----------------------- |
| 文字轉影片     | `gen4.5`（預設）、`veo3.1`、`veo3.1_fast`、`veo3`                    | 無                      |
| 圖片轉影片     | `gen4.5`、`gen4_turbo`、`gen3a_turbo`、`veo3.1`、`veo3.1_fast`、`veo3` | 1 個本機或遠端圖片      |
| 影片轉影片     | `gen4_aleph`                                                           | 1 個本機或遠端影片      |

本機圖片與影片參照支援透過資料 URI 使用。

| 長寬比              | 允許值                                      |
| ------------------- | ------------------------------------------- |
| 文字轉影片          | `16:9`、`9:16`                              |
| 圖片與影片編輯      | `1:1`、`16:9`、`9:16`、`3:4`、`4:3`、`21:9` |

<Warning>
  影片轉影片目前需要 `runway/gen4_aleph`。其他 Runway 模型 id 會拒絕影片參照輸入。
</Warning>

<Note>
  從錯誤欄位選取 Runway 模型 id，會在應用程式介面請求離開 OpenClaw 前產生明確錯誤。此提供者會在 `extensions/runway/video-generation-provider.ts` 中依據模式的允許清單（`TEXT_ONLY_MODELS`、`IMAGE_MODELS`、`VIDEO_MODELS`）驗證 `model`。
</Note>

## 設定

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## 進階設定

<AccordionGroup>
  <Accordion title="Environment variable aliases">
    OpenClaw 可識別 `RUNWAYML_API_SECRET`（標準）與 `RUNWAY_API_KEY`。
    任一變數都可驗證 Runway 提供者。
  </Accordion>

  <Accordion title="Task polling">
    Runway 使用以任務為基礎的應用程式介面。送出生成請求後，OpenClaw
    會輪詢 `GET /v1/tasks/{id}`，直到影片準備完成。輪詢行為不需要額外
    設定。
  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="Video generation" href="/zh-TW/tools/video-generation" icon="video">
    共用工具參數、提供者選擇與非同步行為。
  </Card>
  <Card title="Configuration reference" href="/zh-TW/gateway/config-agents#agent-defaults" icon="gear">
    代理程式預設設定，包含影片生成模型。
  </Card>
</CardGroup>
