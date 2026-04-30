---
read_when:
    - 您想在 OpenClaw 中使用 fal 圖片生成
    - 你需要 FAL_KEY 驗證流程
    - 你想要 image_generate 或 video_generate 的 fal 預設值
summary: OpenClaw 中的 fal 圖片與影片生成設定
title: Fal
x-i18n:
    generated_at: "2026-04-30T03:30:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6789f0fa1140cf76f0206c7384a79ee8b96de4af9e1dfedc00e5a3382f742bb
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw 內建隨附 `fal` 提供者，用於託管式圖片與影片生成。

| 屬性 | 值                                                         |
| -------- | ------------------------------------------------------------- |
| 提供者 | `fal`                                                         |
| 驗證     | `FAL_KEY`（標準；`FAL_API_KEY` 也可作為備援使用） |
| API      | fal 模型端點                                           |

## 開始使用

<Steps>
  <Step title="Set the API key">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Set a default image model">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/fal-ai/flux/dev",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

## 圖片生成

內建隨附的 `fal` 圖片生成提供者預設使用
`fal/fal-ai/flux/dev`。

| 功能     | 值                      |
| -------------- | -------------------------- |
| 圖片數量上限     | 每次請求 4 張              |
| 編輯模式      | 已啟用，1 張參考圖片 |
| 尺寸覆寫 | 支援                  |
| 長寬比   | 支援                  |
| 解析度     | 支援                  |
| 輸出格式  | `png` 或 `jpeg`            |

<Warning>
fal 圖片編輯端點**不**支援 `aspectRatio` 覆寫。
</Warning>

若要輸出 PNG，請使用 `outputFormat: "png"`。fal 未在 OpenClaw 中宣告明確的透明背景控制項，因此對於 fal 模型，`background:
"transparent"` 會回報為已忽略的覆寫。

若要將 fal 作為預設圖片提供者：

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

## 影片生成

內建隨附的 `fal` 影片生成提供者預設使用
`fal/fal-ai/minimax/video-01-live`。

| 功能 | 值                                                              |
| ---------- | ------------------------------------------------------------------ |
| 模式      | 文字轉影片、單張圖片參考、Seedance 參考轉影片 |
| 執行階段    | 適用於長時間執行工作的佇列式提交/狀態/結果流程       |

<AccordionGroup>
  <Accordion title="Available video models">
    **HeyGen video-agent：**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0：**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

  </Accordion>

  <Accordion title="Seedance 2.0 config example">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Seedance 2.0 reference-to-video config example">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/reference-to-video",
          },
        },
      },
    }
    ```

    參考轉影片最多接受 9 張圖片、3 支影片，以及 3 個音訊參考，
    透過共用的 `video_generate` `images`、`videos` 與 `audioRefs`
    參數傳入，且參考檔案總數最多為 12 個。

  </Accordion>

  <Accordion title="HeyGen video-agent config example">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/fal-ai/heygen/v2/video-agent",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

<Tip>
使用 `openclaw models list --provider fal` 查看可用 fal 模型的完整清單，
包含任何最近新增的項目。
</Tip>

## 相關

<CardGroup cols={2}>
  <Card title="Image generation" href="/zh-TW/tools/image-generation" icon="image">
    共用圖片工具參數與提供者選擇。
  </Card>
  <Card title="Video generation" href="/zh-TW/tools/video-generation" icon="video">
    共用影片工具參數與提供者選擇。
  </Card>
  <Card title="Configuration reference" href="/zh-TW/gateway/config-agents#agent-defaults" icon="gear">
    Agent 預設值，包含圖片與影片模型選擇。
  </Card>
</CardGroup>
