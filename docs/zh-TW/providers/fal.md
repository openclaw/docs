---
read_when:
    - 你想在 OpenClaw 中使用 fal 圖像生成
    - 你需要 `FAL_KEY` 驗證流程
    - 你想要為 image_generate、video_generate 或 music_generate 設定 fal 預設值
summary: OpenClaw 中的 fal 圖像、影片與音樂生成設定
title: Fal
x-i18n:
    generated_at: "2026-07-11T21:42:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bd868aaf6771f6fa38bb8e2a83133460d150e2a5aa9e5b888e221c07f29e0ad
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw 內建隨附 `fal` 提供者，可用於託管式圖片、影片與音樂生成。

| 屬性     | 值                                                                              |
| -------- | ------------------------------------------------------------------------------- |
| 提供者   | `fal`                                                                           |
| 驗證     | `FAL_KEY`（標準；也可使用 `FAL_API_KEY` 作為備援）                              |
| API      | fal 模型端點（`https://fal.run`；影片工作使用 `https://queue.fal.run`）          |
| 基礎 URL | 使用 `models.providers.fal.baseUrl` 覆寫                                        |

## 開始使用

<Steps>
  <Step title="設定 API 金鑰">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```

    非互動式設定可以傳入 `--fal-api-key <key>`，或匯出 `FAL_KEY`。
    若尚未設定預設圖片模型，初始設定也會將 `fal/fal-ai/flux/dev`
    設為預設圖片模型。

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

內建的 `fal` 圖片生成提供者預設使用
`fal/fal-ai/flux/dev`。

| 功能         | 值                                                                 |
| ------------ | ------------------------------------------------------------------ |
| 圖片數上限   | 每次請求 4 張；Krea 2：每次請求 1 張                              |
| 尺寸覆寫     | `1024x1024`、`1024x1536`、`1536x1024`、`1024x1792`、`1792x1024`    |
| 長寬比       | 除 Flux 圖片轉圖片外皆支援                                         |
| 解析度       | `1K`、`2K`、`4K`（各模型限制如下）                                 |
| 輸出格式     | `png`（預設）或 `jpeg`；Krea 2 會拒絕 `outputFormat` 覆寫          |

編輯請求（透過共用的 `image`／`images` 參數提供參考圖片）
會依模型路由至對應的編輯端點，且各模型有不同的參考圖片數量限制：

| 模型系列                  | `fal/` 後的模型參照                    | 編輯端點          | 參考圖片數上限 |
| ------------------------- | -------------------------------------- | ----------------- | -------------- |
| Flux 與其他 fal 模型      | `fal-ai/flux/dev`（預設）              | `/image-to-image` | 1              |
| GPT Image                 | `openai/gpt-image-*`                   | `/edit`           | 10             |
| Grok Imagine              | `xai/grok-imagine-image`               | `/edit`           | 3              |
| Nano Banana（舊版）       | `fal-ai/nano-banana`                   | `/edit`           | 3              |
| Nano Banana 2             | `fal-ai/nano-banana-*`                 | `/edit`           | 14             |
| Nano Banana 2 Lite        | `google/nano-banana-2-lite`            | `/edit`           | 14             |
| Krea 2                    | `krea/v2/{medium,large}/text-to-image` | 無（風格參照）    | 10 個風格參照  |

<Warning>
Flux 圖片轉圖片請求**不**支援 `aspectRatio` 覆寫。GPT Image
與 Nano Banana 2 編輯請求使用 fal 的 `/edit` 端點，並接受長寬比提示。
Nano Banana 2 也接受額外的原生超寬／超高比例，例如 `4:1`、`1:4`、
`8:1` 與 `1:8`；Krea 2 會驗證自身較小的長寬比子集。Grok Imagine
有自己的比例清單（包括 `2:1`、`20:9`、`19.5:9` 及其反向比例），
且僅接受 `1K`／`2K` 解析度；舊版 Nano Banana 與 Nano Banana 2 Lite
會拒絕 `resolution` 覆寫。
</Warning>

Krea 2 模型使用 fal 原生的 Krea 承載資料結構描述。OpenClaw 傳送
`aspect_ratio`、`creativity` 與 `image_style_references`，而非 Flux
所使用的通用 `image_size`／編輯端點承載資料。模型參照如下：

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

需要較快速且富有表現力的插畫、動畫、繪畫與藝術風格時，請使用 Medium。
需要較慢但具備寫實效果、原始紋理、膠片顆粒與精細外觀時，請使用 Large。
Krea 預設為 `fal.creativity: "medium"`；支援的值為
`raw`、`low`、`medium` 與 `high`。

在 fal 的請求結構描述中，Krea 2 提供長寬比而非 `image_size`。
請優先使用 `aspectRatio`；OpenClaw 會將 `size` 對應至最接近且受支援的
Krea 長寬比，並會拒絕 Krea 的 `resolution`，而非直接忽略。

若希望從公開 `output_format` 的 fal 模型取得 PNG 輸出，請使用
`outputFormat: "png"`。fal 未在 OpenClaw 中宣告明確的透明背景控制項，
因此對 fal 模型設定 `background: "transparent"` 時，會回報為已忽略的覆寫。
Krea 2 端點未透過 fal 公開 `output_format` 請求欄位，因此 OpenClaw
會拒絕 Krea 請求的 `outputFormat` 覆寫。

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

| 功能     | 值                                                               |
| -------- | ---------------------------------------------------------------- |
| 模式     | 文字轉影片、單張圖片參照、Seedance 參照轉影片                    |
| 執行方式 | 針對長時間工作的佇列式提交／狀態／結果流程                       |
| 逾時     | 每項工作預設 20 分鐘；每 5 秒輪詢一次狀態                        |

<AccordionGroup>
  <Accordion title="可用的影片模型">
    **MiniMax（預設）：**

    - `fal/fal-ai/minimax/video-01-live`

    **HeyGen 影片代理：**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Kling 與 Wan：**

    - `fal/fal-ai/kling-video/v2.1/master/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/image-to-video`

    **Seedance 2.0：**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

    MiniMax Live 與 HeyGen 請求只會傳送提示詞，以及一張可選的參考圖片；
    其他覆寫不會轉送。Seedance 模型接受 `aspectRatio`、`size`、`resolution`、
    4 至 15 秒的持續時間，以及音訊切換選項。

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

  <Accordion title="Seedance 2.0 參照轉影片設定範例">
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

    參照轉影片可透過共用 `video_generate` 的 `images`、`videos` 與
    `audioRefs` 參數，接受最多 9 張圖片、3 部影片與 3 個音訊參照，
    參照檔案總數最多為 12 個。音訊參照要求同一請求中至少包含一個
    圖片或影片參照。

  </Accordion>

  <Accordion title="HeyGen 影片代理設定範例">
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

內建的 `fal` 外掛也會為共用的 `music_generate` 工具註冊音樂生成提供者。

| 功能       | 值                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| 預設模型   | `fal/fal-ai/minimax-music/v2.6`                                                                                          |
| 模型       | `fal-ai/minimax-music/v2.6`（mp3）、`fal-ai/ace-step/prompt-to-audio`（wav）、`fal-ai/stable-audio-25/text-to-audio`（wav） |
| 最長時間   | 240 秒                                                                                                                   |
| 執行方式   | 同步請求並下載生成的音訊                                                                                                 |

將 fal 設為預設音樂提供者：

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

`fal-ai/minimax-music/v2.6` 支援明確指定歌詞與純音樂模式，
但同一請求中不能同時使用兩者。ACE-Step 與 Stable Audio 是
提示詞轉音訊端點；需要使用這些模型系列時，請透過 `model` 覆寫選擇。
ACE-Step 會拒絕明確指定的歌詞；Stable Audio 會同時拒絕歌詞與純音樂模式。

<Tip>
上述表格與摺疊區段涵蓋內建 fal 提供者會特殊處理的模型系列。
其他 fal 圖片端點識別碼仍可選為圖片模型；它們會比照 Flux 處理
（使用通用 `image_size` 承載資料，並透過 `/image-to-image`
提供一張參考圖片）。
</Tip>

## 相關內容

<CardGroup cols={2}>
  <Card title="圖片生成" href="/zh-TW/tools/image-generation" icon="image">
    共用圖片工具參數與提供者選擇。
  </Card>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用影片工具參數與提供者選擇。
  </Card>
  <Card title="音樂生成" href="/zh-TW/tools/music-generation" icon="music">
    共用音樂工具參數與提供者選擇。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/config-agents#agent-defaults" icon="gear">
    代理預設值，包括圖片、影片與音樂模型選擇。
  </Card>
</CardGroup>
