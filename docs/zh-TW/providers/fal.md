---
read_when:
    - 你想在 OpenClaw 中使用 fal 圖像生成功能
    - 您需要 FAL_KEY 驗證流程
    - 你想要 image_generate 或 video_generate 的 fal 預設值
summary: OpenClaw 中的 fal 影像與影片生成設定
title: Fal
x-i18n:
    generated_at: "2026-05-11T20:34:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f074629e5274154b7a17686264a8b137d61df321d791d6e47c9d8abe67ad273
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw 隨附內建的 `fal` provider，用於託管式圖片與影片生成。

| 屬性 | 值                                                         |
| -------- | ------------------------------------------------------------- |
| Provider | `fal`                                                         |
| 驗證     | `FAL_KEY`（標準；`FAL_API_KEY` 也可作為備援） |
| API      | fal 模型端點                                           |

## 開始使用

<Steps>
  <Step title="設定 API 金鑰">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="設定預設圖片模型">
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

內建的 `fal` 圖片生成 provider 預設為
`fal/fal-ai/flux/dev`。

| 功能     | 值                                                       |
| -------------- | ----------------------------------------------------------- |
| 最大圖片數     | 每個請求 4 張                                               |
| 編輯模式      | Flux：1 張參考圖片；GPT Image 2：10；Nano Banana 2：14 |
| 尺寸覆寫 | 支援                                                   |
| 長寬比   | 支援生成與 GPT Image 2/Nano Banana 2 編輯   |
| 解析度     | 支援                                                   |
| 輸出格式  | `png` 或 `jpeg`                                             |

<Warning>
Flux 圖片轉圖片請求**不**支援 `aspectRatio` 覆寫。GPT
Image 2 與 Nano Banana 2 編輯請求使用 fal 的 `/edit` 端點，並接受
長寬比提示。
</Warning>

當你想要 PNG 輸出時，請使用 `outputFormat: "png"`。fal 未在 OpenClaw 中宣告
明確的透明背景控制，因此對 fal 模型而言，`background:
"transparent"` 會被回報為已忽略的覆寫。

若要使用 fal 作為預設圖片 provider：

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

內建的 `fal` 影片生成 provider 預設為
`fal/fal-ai/minimax/video-01-live`。

| 功能 | 值                                                              |
| ---------- | ------------------------------------------------------------------ |
| 模式      | 文字轉影片、單張圖片參考、Seedance 參考轉影片 |
| 執行階段    | 適用於長時間執行工作的佇列式提交/狀態/結果流程       |

<AccordionGroup>
  <Accordion title="可用的影片模型">
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

  <Accordion title="Seedance 2.0 設定範例">
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

  <Accordion title="Seedance 2.0 參考轉影片設定範例">
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

    參考轉影片可透過共用的 `video_generate` `images`、`videos` 與 `audioRefs`
    參數接受最多 9 張圖片、3 支影片與 3 個音訊參考，
    總參考檔案數最多為 12 個。

  </Accordion>

  <Accordion title="HeyGen video-agent 設定範例">
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
使用 `openclaw models list --provider fal` 查看可用 fal
模型的完整清單，包括任何最近新增的項目。
</Tip>

## 相關

<CardGroup cols={2}>
  <Card title="圖片生成" href="/zh-TW/tools/image-generation" icon="image">
    共用圖片工具參數與 provider 選擇。
  </Card>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用影片工具參數與 provider 選擇。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/config-agents#agent-defaults" icon="gear">
    Agent 預設值，包括圖片與影片模型選擇。
  </Card>
</CardGroup>
