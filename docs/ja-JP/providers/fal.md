---
read_when:
    - OpenClaw で fal の画像生成を使用したい
    - FAL_KEY 認証フローが必要です
    - image_generate または video_generate で fal のデフォルト値を使用したい場合
summary: OpenClaw での fal による画像および動画生成のセットアップ
title: Fal
x-i18n:
    generated_at: "2026-05-11T20:35:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f074629e5274154b7a17686264a8b137d61df321d791d6e47c9d8abe67ad273
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw には、ホスト型の画像および動画生成用の同梱 `fal` プロバイダーが付属しています。

| プロパティ | 値                                                         |
| -------- | ------------------------------------------------------------- |
| プロバイダー | `fal`                                                         |
| 認証     | `FAL_KEY`（標準。`FAL_API_KEY` もフォールバックとして機能） |
| API      | fal モデルエンドポイント                                           |

## はじめに

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

## 画像生成

同梱の `fal` 画像生成プロバイダーのデフォルトは
`fal/fal-ai/flux/dev` です。

| 機能     | 値                                                       |
| -------------- | ----------------------------------------------------------- |
| 最大画像数     | リクエストあたり 4                                               |
| 編集モード      | Flux: 参照画像 1 枚、GPT Image 2: 10、Nano Banana 2: 14 |
| サイズ上書き | サポート                                                   |
| アスペクト比   | 生成、および GPT Image 2/Nano Banana 2 編集でサポート   |
| 解像度     | サポート                                                   |
| 出力形式  | `png` または `jpeg`                                             |

<Warning>
Flux の image-to-image リクエストは、`aspectRatio` の上書きを**サポートしていません**。GPT
Image 2 および Nano Banana 2 の編集リクエストは fal の `/edit` エンドポイントを使用し、
アスペクト比のヒントを受け付けます。
</Warning>

PNG 出力が必要な場合は `outputFormat: "png"` を使用します。fal は OpenClaw で
明示的な透明背景制御を宣言していないため、fal モデルでは `background:
"transparent"` は無視された上書きとして報告されます。

fal をデフォルトの画像プロバイダーとして使用するには:

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

## 動画生成

同梱の `fal` 動画生成プロバイダーのデフォルトは
`fal/fal-ai/minimax/video-01-live` です。

| 機能 | 値                                                              |
| ---------- | ------------------------------------------------------------------ |
| モード      | テキストから動画、単一画像参照、Seedance 参照から動画 |
| ランタイム    | 長時間実行ジョブ向けのキューベースの送信/ステータス/結果フロー       |

<AccordionGroup>
  <Accordion title="Available video models">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

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

    Reference-to-video は、共有の `video_generate` の `images`、`videos`、`audioRefs`
    パラメーターを通じて、最大 9 個の画像、3 個の動画、3 個の音声参照を受け付け、
    参照ファイルは合計で最大 12 個です。

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
利用可能な fal モデルの完全な一覧（最近追加されたエントリを含む）を確認するには、
`openclaw models list --provider fal` を使用します。
</Tip>

## 関連

<CardGroup cols={2}>
  <Card title="Image generation" href="/ja-JP/tools/image-generation" icon="image">
    共有画像ツールのパラメーターとプロバイダー選択。
  </Card>
  <Card title="Video generation" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールのパラメーターとプロバイダー選択。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/config-agents#agent-defaults" icon="gear">
    画像および動画モデルの選択を含むエージェントデフォルト。
  </Card>
</CardGroup>
