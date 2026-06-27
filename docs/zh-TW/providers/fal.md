---
read_when:
    - 你想在 OpenClaw 中使用 fal 圖像生成
    - 你需要 `FAL_KEY` 驗證流程
    - 你想要 `image_generate`、`video_generate` 或 `music_generate` 的 fal 預設值
summary: OpenClaw 中的 fal 影像、影片與音樂生成設定
title: Fal
x-i18n:
    generated_at: "2026-06-27T19:54:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af294939a39673fb32cb68c882708dbe69b64ca5e5d13f5504de9d1d8715e3bd
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw 隨附一個內建的 `fal` 提供者，用於託管式影像、影片和音樂
生成。

| 屬性 | 值                                                         |
| -------- | ------------------------------------------------------------- |
| 提供者 | `fal`                                                         |
| 驗證     | `FAL_KEY`（標準；`FAL_API_KEY` 也可作為備援） |
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

## 影像生成

內建的 `fal` 影像生成提供者預設使用
`fal/fal-ai/flux/dev`。

| 功能     | 值                                                              |
| -------------- | ------------------------------------------------------------------ |
| 最大影像數     | 每次請求 4 張；Krea 2：每次請求 1 張                               |
| 編輯模式      | Flux：1 張參照影像；GPT Image 2：10；Nano Banana 2：14        |
| 風格參照     | Krea 2：透過 `image` / `images` 最多 10 個風格參照           |
| 尺寸覆寫 | 支援                                                          |
| 長寬比   | 支援生成、Krea 2，以及 GPT Image 2/Nano Banana 2 編輯 |
| 解析度     | 支援                                                          |
| 輸出格式  | `png` 或 `jpeg`                                                    |

<Warning>
Flux 以圖生圖請求**不**支援 `aspectRatio` 覆寫。GPT
Image 2 和 Nano Banana 2 編輯請求使用 fal 的 `/edit` 端點，並接受
長寬比提示。Nano Banana 2 也接受額外的原生寬版/高版比例，
例如 `4:1`、`1:4`、`8:1` 和 `1:8`；Krea 2 會驗證其較小的
長寬比子集。
</Warning>

Krea 2 模型使用 fal 的原生 Krea 酬載結構描述。OpenClaw 會傳送
`aspect_ratio`、`creativity` 和 `image_style_references`，而不是 Flux 使用的
通用 `image_size` / 編輯端點酬載。模型參照為：

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

需要更快的表現型插畫、動漫、繪畫和藝術風格時，請使用 Medium。
需要較慢的寫實、原始質感、電影顆粒和細緻外觀時，請使用 Large。
Krea 預設為 `fal.creativity: "medium"`；支援的值為
`raw`、`low`、`medium` 和 `high`。

Krea 2 在 fal 的請求結構描述中公開的是長寬比，而不是 `image_size`。請優先使用
`aspectRatio`；OpenClaw 會將 `size` 對應到最接近且受支援的 Krea 長寬比，
並會拒絕 Krea 的 `resolution`，而不是將其丟棄。

當你希望支援 `output_format` 的 fal 模型輸出 PNG 時，請使用
`outputFormat: "png"`。fal 在 OpenClaw 中未宣告明確的透明背景
控制項，因此 `background: "transparent"` 會被回報為 fal 模型中已忽略的
覆寫。
Krea 2 端點未透過 fal 公開 `output_format` 請求欄位，因此
OpenClaw 會拒絕 Krea 請求的 `outputFormat` 覆寫。

若要將 fal 作為預設影像提供者：

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

若要使用 Krea 2 Medium：

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/krea/v2/medium/text-to-image",
      },
    },
  },
}
```

## 影片生成

內建的 `fal` 影片生成提供者預設使用
`fal/fal-ai/minimax/video-01-live`。

| 功能 | 值                                                              |
| ---------- | ------------------------------------------------------------------ |
| 模式      | 文字轉影片、單一影像參照、Seedance 參照轉影片 |
| 執行階段    | 由佇列支援的提交/狀態/結果流程，用於長時間執行的工作       |

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

    參照轉影片透過共用的 `video_generate` `images`、`videos` 和 `audioRefs`
    參數，接受最多 9 張影像、3 支影片和 3 個音訊參照，
    參照檔案總數最多 12 個。

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

## 音樂生成

內建的 `fal` 外掛也會為共用的 `music_generate` 工具註冊一個音樂生成提供者。

| 功能    | 值                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| 預設模型 | `fal/fal-ai/minimax-music/v2.6`                                                                        |
| 模型        | `fal-ai/minimax-music/v2.6`、`fal-ai/ace-step/prompt-to-audio`、`fal-ai/stable-audio-25/text-to-audio` |
| 執行階段       | 同步請求加上產生的音訊下載                                                      |

將 fal 作為預設音樂提供者：

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "fal/fal-ai/minimax-music/v2.6",
      },
    },
  },
}
```

`fal-ai/minimax-music/v2.6` 支援明確歌詞和純音樂模式。
ACE-Step 和 Stable Audio 是提示轉音訊端點；當你需要這些模型系列時，請使用
`model` 覆寫來選擇它們。

<Tip>
使用 `openclaw models list --provider fal` 查看可用 fal
模型的完整清單，包括任何最近新增的項目。
</Tip>

## 相關

<CardGroup cols={2}>
  <Card title="Image generation" href="/zh-TW/tools/image-generation" icon="image">
    共用影像工具參數和提供者選擇。
  </Card>
  <Card title="Video generation" href="/zh-TW/tools/video-generation" icon="video">
    共用影片工具參數和提供者選擇。
  </Card>
  <Card title="Music generation" href="/zh-TW/tools/music-generation" icon="music">
    共用音樂工具參數和提供者選擇。
  </Card>
  <Card title="Configuration reference" href="/zh-TW/gateway/config-agents#agent-defaults" icon="gear">
    代理預設值，包括影像、影片和音樂模型選擇。
  </Card>
</CardGroup>
