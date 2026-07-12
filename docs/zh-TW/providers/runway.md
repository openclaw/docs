---
read_when:
    - 你想在 OpenClaw 中使用 Runway 影片生成功能
    - 你需要設定 Runway API 金鑰／環境變數
    - 您想將 Runway 設為預設影片提供者
summary: 在 OpenClaw 中設定 Runway 影片生成
title: 發展空間
x-i18n:
    generated_at: "2026-07-11T21:43:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7aa2a802323857bf7c839ebfab56853dc79d656a25bbc194a431959a48bbd64b
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw 內建隨附的 `runway` 託管影片生成提供者，預設為啟用，並依據 `videoGenerationProviders` 合約註冊。

| 屬性              | 值                                                                |
| ----------------- | ----------------------------------------------------------------- |
| 提供者 ID         | `runway`                                                          |
| 外掛              | 內建，`enabledByDefault: true`                                    |
| 驗證環境變數      | `RUNWAYML_API_SECRET`（標準）或 `RUNWAY_API_KEY`                  |
| 初始設定旗標      | `--auth-choice runway-api-key`                                    |
| 直接命令列介面旗標 | `--runway-api-key <key>`                                          |
| API               | Runway 工作型影片生成（輪詢 `GET /v1/tasks/{id}`）                |
| 預設模型          | `runway/gen4.5`                                                   |

## 開始使用

<Steps>
  <Step title="設定 API 金鑰">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="將 Runway 設為預設影片提供者">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="生成影片">
    要求代理程式生成影片，系統將自動使用 Runway。
  </Step>
</Steps>

## 支援的模式與模型

此提供者提供七個 Runway 模型，分為三種模式。同一個模型 ID 可以支援多種模式（例如 `gen4.5` 同時支援文字轉影片與圖片轉影片）。

| 模式         | 模型                                                                   | 參考輸入                |
| ------------ | ---------------------------------------------------------------------- | ----------------------- |
| 文字轉影片   | `gen4.5`（預設）、`veo3.1`、`veo3.1_fast`、`veo3`                     | 無                      |
| 圖片轉影片   | `gen4.5`、`gen4_turbo`、`gen3a_turbo`、`veo3.1`、`veo3.1_fast`、`veo3` | 1 張本機或遠端圖片      |
| 影片轉影片   | `gen4_aleph`                                                           | 1 部本機或遠端影片      |

可透過資料 URI 使用本機圖片與影片作為參考。

| 長寬比             | 允許的值                                    |
| ------------------ | ------------------------------------------- |
| 文字轉影片         | `16:9`、`9:16`                              |
| 圖片與影片編輯     | `1:1`、`16:9`、`9:16`、`3:4`、`4:3`、`21:9` |

<Warning>
  影片轉影片目前需要使用 `runway/gen4_aleph`。其他 Runway 模型 ID 會拒絕影片參考輸入。
</Warning>

<Note>
  若從錯誤的欄位選取 Runway 模型 ID，API 請求尚未離開 OpenClaw 前便會產生明確錯誤。此提供者會在 `extensions/runway/video-generation-provider.ts` 中，根據該模式的允許清單（`TEXT_ONLY_MODELS`、`IMAGE_MODELS`、`VIDEO_MODELS`）驗證 `model`。
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
  <Accordion title="環境變數別名">
    OpenClaw 同時支援 `RUNWAYML_API_SECRET`（標準）與 `RUNWAY_API_KEY`。
    任一變數皆可驗證 Runway 提供者。
  </Accordion>

  <Accordion title="工作輪詢">
    Runway 使用工作型 API。提交生成請求後，OpenClaw
    會輪詢 `GET /v1/tasks/{id}`，直到影片準備完成。此輪詢行為
    不需要其他設定。
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
