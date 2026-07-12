---
read_when:
    - OpenClawでfal画像生成を使用したい場合
    - FAL_KEY 認証フローが必要です
    - image_generate、video_generate、または music_generate に fal のデフォルト設定を使用したい場合
summary: OpenClaw での fal 画像・動画・音楽生成のセットアップ
title: Fal
x-i18n:
    generated_at: "2026-07-11T22:36:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bd868aaf6771f6fa38bb8e2a83133460d150e2a5aa9e5b888e221c07f29e0ad
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw には、ホスト型の画像、動画、音楽生成用の `fal` プロバイダーが同梱されています。

| プロパティ | 値                                                                                           |
| ---------- | -------------------------------------------------------------------------------------------- |
| プロバイダー | `fal`                                                                                        |
| 認証       | `FAL_KEY`（標準。フォールバックとして `FAL_API_KEY` も使用可能）                             |
| API        | fal モデルエンドポイント（`https://fal.run`。動画ジョブは `https://queue.fal.run` を使用）   |
| ベース URL | `models.providers.fal.baseUrl` で上書き                                                      |

## はじめに

<Steps>
  <Step title="API キーを設定する">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```

    非対話型セットアップでは、`--fal-api-key <key>` を渡すか、`FAL_KEY` をエクスポートできます。
    オンボーディングでは、画像モデルが設定されていない場合、
    `fal/fal-ai/flux/dev` もデフォルトの画像モデルとして設定されます。

  </Step>
  <Step title="デフォルトの画像モデルを設定する">
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

同梱の `fal` 画像生成プロバイダーは、デフォルトで
`fal/fal-ai/flux/dev` を使用します。

| 機能             | 値                                                                 |
| ---------------- | ------------------------------------------------------------------ |
| 最大画像数       | 1 リクエストあたり 4 枚。Krea 2 は 1 リクエストあたり 1 枚         |
| サイズの上書き   | `1024x1024`、`1024x1536`、`1536x1024`、`1024x1792`、`1792x1024`    |
| アスペクト比     | Flux の画像から画像への変換を除くすべてで対応                      |
| 解像度           | `1K`、`2K`、`4K`（モデルごとの制限は以下を参照）                   |
| 出力形式         | `png`（デフォルト）または `jpeg`。Krea 2 は `outputFormat` の上書きを拒否 |

編集リクエスト（共通の `image` / `images` パラメーターによる参照画像）は、
モデルごとの参照数制限が設定された、各モデル専用の編集エンドポイントにルーティングされます。

| モデルファミリー        | `fal/` 以降のモデル参照                  | 編集エンドポイント | 最大参照画像数 |
| ----------------------- | ---------------------------------------- | ------------------ | -------------- |
| Flux およびその他の fal モデル | `fal-ai/flux/dev`（デフォルト）          | `/image-to-image`  | 1              |
| GPT Image               | `openai/gpt-image-*`                     | `/edit`            | 10             |
| Grok Imagine            | `xai/grok-imagine-image`                 | `/edit`            | 3              |
| Nano Banana（レガシー） | `fal-ai/nano-banana`                     | `/edit`            | 3              |
| Nano Banana 2           | `fal-ai/nano-banana-*`                   | `/edit`            | 14             |
| Nano Banana 2 Lite      | `google/nano-banana-2-lite`              | `/edit`            | 14             |
| Krea 2                  | `krea/v2/{medium,large}/text-to-image`   | なし（スタイル参照） | 10 件のスタイル参照 |

<Warning>
Flux の画像から画像への変換リクエストは、`aspectRatio` の上書きに**対応していません**。GPT
Image と Nano Banana 2 の編集リクエストは、fal の `/edit` エンドポイントを使用し、
アスペクト比のヒントを受け付けます。Nano Banana 2 は、`4:1`、`1:4`、`8:1`、
`1:8` など、ネイティブの追加の横長・縦長比率も受け付けます。Krea 2 は、
独自のより限定されたアスペクト比のサブセットを検証します。Grok Imagine には独自の比率一覧
（`2:1`、`20:9`、`19.5:9` と、それぞれの逆比率を含む）があり、受け付ける解像度は
`1K` / `2K` のみです。レガシー Nano Banana と Nano Banana 2 Lite は、
`resolution` の上書きを拒否します。
</Warning>

Krea 2 モデルは、fal ネイティブの Krea ペイロードスキーマを使用します。OpenClaw は、
Flux で使用する汎用の `image_size` / 編集エンドポイント用ペイロードではなく、
`aspect_ratio`、`creativity`、`image_style_references` を送信します。モデル参照は次のとおりです。

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

表現力のあるイラスト、アニメ、絵画、芸術的なスタイルを高速に生成する場合は Medium を使用します。
より低速でも、写実的な表現、生の質感、フィルムグレイン、細部まで作り込まれた外観が必要な場合は
Large を使用します。Krea のデフォルトは `fal.creativity: "medium"` です。対応する値は
`raw`、`low`、`medium`、`high` です。

Krea 2 の fal リクエストスキーマでは、`image_size` ではなくアスペクト比が公開されています。
`aspectRatio` を優先してください。OpenClaw は `size` を最も近い対応済みの Krea アスペクト比に
マッピングし、Krea では `resolution` を無視せず拒否します。

`output_format` を公開している fal モデルから PNG を出力する場合は、
`outputFormat: "png"` を使用します。fal は OpenClaw で明示的な透明背景制御を宣言していないため、
`background: "transparent"` は fal モデルで無視された上書きとして報告されます。
Krea 2 エンドポイントは fal 経由で `output_format` リクエストフィールドを公開していないため、
OpenClaw は Krea リクエストの `outputFormat` 上書きを拒否します。

Krea 2 Medium を使用するには、次のように設定します。

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

## 動画生成

同梱の `fal` 動画生成プロバイダーは、デフォルトで
`fal/fal-ai/minimax/video-01-live` を使用します。

| 機能           | 値                                                                 |
| -------------- | ------------------------------------------------------------------ |
| モード         | テキストから動画、単一画像参照、Seedance の参照から動画            |
| 実行方式       | 長時間実行ジョブ向けのキューを使用した送信・状態・結果フロー       |
| タイムアウト   | デフォルトでジョブあたり 20 分。5 秒ごとに状態をポーリング         |

<AccordionGroup>
  <Accordion title="利用可能な動画モデル">
    **MiniMax（デフォルト）：**

    - `fal/fal-ai/minimax/video-01-live`

    **HeyGen video-agent：**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Kling と Wan：**

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

    MiniMax Live と HeyGen のリクエストでは、プロンプトと省略可能な単一の参照画像のみを送信し、
    その他の上書きは転送されません。Seedance モデルは、`aspectRatio`、`size`、`resolution`、
    4～15 秒の長さ、音声の切り替えを受け付けます。

  </Accordion>

  <Accordion title="Seedance 2.0 の設定例">
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

  <Accordion title="Seedance 2.0 の参照から動画への変換の設定例">
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

    参照から動画への変換では、共通の `video_generate` の `images`、`videos`、`audioRefs`
    パラメーターを通じて、最大 9 枚の画像、3 本の動画、3 件の音声参照を受け付けます。
    参照ファイルの合計は最大 12 件です。音声参照を使用する場合は、同じリクエストに
    少なくとも 1 件の画像参照または動画参照が必要です。

  </Accordion>

  <Accordion title="HeyGen video-agent の設定例">
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

## 音楽生成

同梱の `fal` Plugin は、共通の `music_generate` ツール用の音楽生成プロバイダーも登録します。

| 機能             | 値                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| デフォルトモデル | `fal/fal-ai/minimax-music/v2.6`                                                                                          |
| モデル           | `fal-ai/minimax-music/v2.6`（mp3）、`fal-ai/ace-step/prompt-to-audio`（wav）、`fal-ai/stable-audio-25/text-to-audio`（wav） |
| 最大時間         | 240 秒                                                                                                                   |
| 実行方式         | 同期リクエストと、生成された音声のダウンロード                                                                           |

fal をデフォルトの音楽プロバイダーとして使用するには、次のように設定します。

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

`fal-ai/minimax-music/v2.6` は、明示的な歌詞とインストゥルメンタルモードに対応していますが、
同じリクエストで両方を指定することはできません。ACE-Step と Stable Audio は、
プロンプトから音声を生成するエンドポイントです。これらのモデルファミリーを使用する場合は、
`model` の上書きで選択してください。ACE-Step は明示的な歌詞を拒否し、Stable Audio は
歌詞とインストゥルメンタルモードの両方を拒否します。

<Tip>
上記の表とアコーディオンでは、同梱の fal プロバイダーが特別処理するモデルファミリーを説明しています。
その他の fal 画像エンドポイント ID も画像モデルとして選択できます。その場合は Flux と同様に扱われます
（汎用の `image_size` ペイロード、`/image-to-image` 経由の参照画像 1 枚）。
</Tip>

## 関連項目

<CardGroup cols={2}>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共通の画像ツールパラメーターとプロバイダーの選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共通の動画ツールパラメーターとプロバイダーの選択。
  </Card>
  <Card title="音楽生成" href="/ja-JP/tools/music-generation" icon="music">
    共通の音楽ツールパラメーターとプロバイダーの選択。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/config-agents#agent-defaults" icon="gear">
    画像、動画、音楽のモデル選択を含むエージェントのデフォルト設定。
  </Card>
</CardGroup>
