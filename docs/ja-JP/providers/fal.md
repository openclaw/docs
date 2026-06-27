---
read_when:
    - OpenClaw で fal 画像生成を使用したい
    - FAL_KEY 認証フローが必要です
    - image_generate、video_generate、または music_generate の fal デフォルトを使用したい
summary: OpenClaw での fal 画像、動画、音楽生成のセットアップ
title: Fal
x-i18n:
    generated_at: "2026-06-27T12:42:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af294939a39673fb32cb68c882708dbe69b64ca5e5d13f5504de9d1d8715e3bd
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw には、ホスト型の画像、動画、音楽生成向けにバンドルされた `fal` プロバイダーが同梱されています。

| プロパティ | 値                                                            |
| ---------- | ------------------------------------------------------------- |
| プロバイダー | `fal`                                                         |
| 認証       | `FAL_KEY` (正規; `FAL_API_KEY` もフォールバックとして動作) |
| API        | fal モデルエンドポイント                                      |

## はじめに

<Steps>
  <Step title="API キーを設定する">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="デフォルト画像モデルを設定する">
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

バンドルされた `fal` 画像生成プロバイダーのデフォルトは
`fal/fal-ai/flux/dev` です。

| ケイパビリティ | 値                                                                 |
| -------------- | ------------------------------------------------------------------ |
| 最大画像数     | リクエストあたり 4 枚; Krea 2: リクエストあたり 1 枚              |
| 編集モード     | Flux: 参照画像 1 枚; GPT Image 2: 10; Nano Banana 2: 14           |
| スタイル参照   | Krea 2: `image` / `images` 経由で最大 10 個のスタイル参照         |
| サイズ上書き   | サポートあり                                                       |
| アスペクト比   | 生成、Krea 2、GPT Image 2/Nano Banana 2 編集でサポートあり        |
| 解像度         | サポートあり                                                       |
| 出力形式       | `png` または `jpeg`                                                |

<Warning>
Flux の画像から画像へのリクエストは `aspectRatio` の上書きを**サポートしません**。GPT
Image 2 と Nano Banana 2 の編集リクエストは fal の `/edit` エンドポイントを使用し、
アスペクト比のヒントを受け付けます。Nano Banana 2 は `4:1`、`1:4`、`8:1`、`1:8`
などの追加ネイティブな横長/縦長比率も受け付けます。Krea 2 は独自のより小さい
アスペクト比サブセットを検証します。
</Warning>

Krea 2 モデルは fal のネイティブな Krea ペイロードスキーマを使用します。OpenClaw は、
Flux で使用される汎用の `image_size` / 編集エンドポイントのペイロードではなく、
`aspect_ratio`、`creativity`、`image_style_references` を送信します。モデル参照は次のとおりです。

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

より高速な表現的イラスト、アニメ、ペインティング、芸術的なスタイルには Medium を使用します。
より低速なフォトリアル、生の質感、フィルムグレイン、詳細な見た目には Large を使用します。
Krea のデフォルトは `fal.creativity: "medium"` です。サポートされる値は
`raw`、`low`、`medium`、`high` です。

Krea 2 は fal のリクエストスキーマで `image_size` ではなくアスペクト比を公開します。
`aspectRatio` を優先してください。OpenClaw は `size` を最も近いサポート済み Krea アスペクト比にマッピングし、
Krea では `resolution` を無視するのではなく拒否します。

`output_format` を公開する fal モデルから PNG 出力を得たい場合は、
`outputFormat: "png"` を使用します。fal は OpenClaw で明示的な透明背景コントロールを宣言していないため、
`background: "transparent"` は fal モデルでは無視された上書きとして報告されます。
Krea 2 エンドポイントは fal 経由で `output_format` リクエストフィールドを公開しないため、
OpenClaw は Krea リクエストに対する `outputFormat` の上書きを拒否します。

fal をデフォルト画像プロバイダーとして使用するには:

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

Krea 2 Medium を使用するには:

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

バンドルされた `fal` 動画生成プロバイダーのデフォルトは
`fal/fal-ai/minimax/video-01-live` です。

| ケイパビリティ | 値                                                                 |
| ---------- | ------------------------------------------------------------------ |
| モード     | テキストから動画、単一画像参照、Seedance 参照から動画             |
| ランタイム | 長時間実行ジョブ向けのキューを使用した送信/ステータス/結果フロー |

<AccordionGroup>
  <Accordion title="利用可能な動画モデル">
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

  <Accordion title="Seedance 2.0 設定例">
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

  <Accordion title="Seedance 2.0 参照から動画の設定例">
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

    参照から動画は、共有 `video_generate` の `images`、`videos`、`audioRefs`
    パラメーターを通じて最大 9 枚の画像、3 本の動画、3 件の音声参照を受け付け、
    参照ファイルは合計で最大 12 件です。

  </Accordion>

  <Accordion title="HeyGen video-agent 設定例">
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

バンドルされた `fal` Plugin は、共有 `music_generate` ツール向けの音楽生成プロバイダーも登録します。

| ケイパビリティ | 値                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| デフォルトモデル | `fal/fal-ai/minimax-music/v2.6`                                                                        |
| モデル        | `fal-ai/minimax-music/v2.6`, `fal-ai/ace-step/prompt-to-audio`, `fal-ai/stable-audio-25/text-to-audio` |
| ランタイム    | 同期リクエストと生成された音声のダウンロード                                                          |

fal をデフォルト音楽プロバイダーとして使用します:

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

`fal-ai/minimax-music/v2.6` は明示的な歌詞とインストゥルメンタルモードをサポートします。
ACE-Step と Stable Audio はプロンプトから音声へのエンドポイントです。これらのモデルファミリーを使いたい場合は、
`model` 上書きで選択します。

<Tip>
利用可能な fal モデルの完全な一覧を確認するには、`openclaw models list --provider fal` を使用します。
最近追加されたエントリーも含まれます。
</Tip>

## 関連

<CardGroup cols={2}>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共有画像ツールのパラメーターとプロバイダー選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールのパラメーターとプロバイダー選択。
  </Card>
  <Card title="音楽生成" href="/ja-JP/tools/music-generation" icon="music">
    共有音楽ツールのパラメーターとプロバイダー選択。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/config-agents#agent-defaults" icon="gear">
    画像、動画、音楽モデル選択を含むエージェントのデフォルト。
  </Card>
</CardGroup>
