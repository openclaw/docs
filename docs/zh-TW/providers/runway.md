---
read_when:
    - 你想在 OpenClaw 中使用 Runway 影片生成
    - 你需要 Runway API 金鑰／環境變數設定
    - 你想將 Runway 設為預設的影片提供者
summary: OpenClaw 中的 Runway 影片生成設定
title: 跑道
x-i18n:
    generated_at: "2026-04-30T03:34:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9648ca4403283cd23bf899d697f35a6b63986e8860227628c0d5789fceee3ce8
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw 內建 `runway` 提供者，用於託管式影片生成。

| 屬性        | 值                                                                |
| ----------- | ----------------------------------------------------------------- |
| 提供者 ID   | `runway`                                                          |
| 驗證        | `RUNWAYML_API_SECRET`（標準）或 `RUNWAY_API_KEY`                  |
| API         | Runway 以任務為基礎的影片生成（`GET /v1/tasks/{id}` 輪詢）       |

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
    要求代理生成影片。Runway 會自動被使用。
  </Step>
</Steps>

## 支援的模式

| 模式           | 模型               | 參考輸入                 |
| -------------- | ------------------ | ------------------------ |
| 文字轉影片     | `gen4.5`（預設）   | 無                       |
| 圖片轉影片     | `gen4.5`           | 1 個本機或遠端圖片       |
| 影片轉影片     | `gen4_aleph`       | 1 個本機或遠端影片       |

<Note>
本機圖片與影片參考可透過資料 URI 支援。純文字執行目前提供 `16:9` 與 `9:16` 長寬比。
</Note>

<Warning>
影片轉影片目前明確需要 `runway/gen4_aleph`。
</Warning>

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
    OpenClaw 會辨識 `RUNWAYML_API_SECRET`（標準）與 `RUNWAY_API_KEY`。
    任一變數都能驗證 Runway 提供者。
  </Accordion>

  <Accordion title="任務輪詢">
    Runway 使用以任務為基礎的 API。提交生成請求後，OpenClaw
    會輪詢 `GET /v1/tasks/{id}`，直到影片準備完成。輪詢行為不需要額外設定。
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
