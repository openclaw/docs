---
read_when:
    - 你想在 OpenClaw 中使用 Runway 影片生成功能
    - 你需要設定 Runway API 金鑰／環境變數
    - 你想將 Runway 設為預設影片供應商
summary: OpenClaw 中的 Runway 影片生成設定
title: Runway
x-i18n:
    generated_at: "2026-07-22T10:44:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6a56e768893e327b56d70e8b8c2d426123a861b3cf05c0107d98104e2cee856c
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw 內建隨附的 `runway` 供應商，用於託管式影片生成；此供應商預設啟用，並依 `videoGenerationProviders` 合約註冊。

| 屬性            | 值                                                                |
| --------------- | ----------------------------------------------------------------- |
| 供應商 ID       | `runway`                                                |
| 外掛            | 內建，`enabledByDefault: true`                                         |
| 驗證環境變數    | `RUNWAYML_API_SECRET`（標準）或 `RUNWAY_API_KEY`                   |
| 新手設定旗標    | `--auth-choice runway-api-key`                                                |
| 直接命令列旗標  | `--runway-api-key <key>`                                                |
| API             | Runway 工作型影片生成（`GET /v1/tasks/{id}` 輪詢）                  |
| 預設模型        | `runway/gen4.5`                                                |

## 開始使用

<Steps>
  <Step title="設定 API 金鑰">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="將 Runway 設為預設影片供應商">
    ```bash
    openclaw config set agents.defaults.mediaModels.video.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="生成影片">
    要求代理程式生成影片。系統會自動使用 Runway。
  </Step>
</Steps>

## 支援的模式與模型

此供應商提供七個 Runway 模型，分為三種模式。同一個模型 ID 可用於多種模式（例如 `gen4.5` 同時適用於文字轉影片和圖片轉影片）。

| 模式           | 模型                                                                   | 參考輸入                |
| -------------- | ---------------------------------------------------------------------- | ----------------------- |
| 文字轉影片     | `gen4.5`（預設）、`veo3.1`、`veo3.1_fast`、`veo3`                    | 無                      |
| 圖片轉影片     | `gen4.5`、`gen4_turbo`、`gen3a_turbo`、`veo3.1`、`veo3.1_fast`、`veo3` | 1 張本機或遠端圖片      |
| 影片轉影片     | `gen4_aleph`                                                    | 1 部本機或遠端影片      |

支援透過資料 URI 使用本機圖片和影片參考。

| 長寬比           | 允許的值                                    |
| ---------------- | ------------------------------------------- |
| 文字轉影片       | `16:9`、`9:16`     |
| 圖片與影片編輯   | `1:1`、`16:9`、`9:16`、`3:4`、`4:3`、`21:9` |

<Warning>
  影片轉影片目前需要 `runway/gen4_aleph`。其他 Runway 模型 ID 會拒絕影片參考輸入。
</Warning>

<Note>
  從錯誤欄位選取 Runway 模型 ID 時，系統會在 API 請求離開 OpenClaw 前產生明確錯誤。供應商會在 `extensions/runway/video-generation-provider.ts` 中，依模式的允許清單（`TEXT_ONLY_MODELS`、`IMAGE_MODELS`、`VIDEO_MODELS`）驗證 `model`。
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
    OpenClaw 同時識別 `RUNWAYML_API_SECRET`（標準）和 `RUNWAY_API_KEY`。
    任一變數皆可用於驗證 Runway 供應商。
  </Accordion>

  <Accordion title="工作輪詢">
    Runway 使用工作型 API。提交生成請求後，OpenClaw
    會輪詢 `GET /v1/tasks/{id}`，直到影片準備完成。此輪詢行為
    不需要額外設定。
  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用工具參數、供應商選擇與非同步行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/config-agents#agent-defaults" icon="gear">
    代理程式預設設定，包括影片生成模型。
  </Card>
</CardGroup>
