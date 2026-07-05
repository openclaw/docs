---
read_when:
    - OpenClaw で fal 画像生成を使用する
    - FAL_KEY 認証フローが必要です
    - image_generate、video_generate、または music_generate に fal のデフォルトを使いたい
summary: OpenClaw での fal 画像、動画、音楽生成セットアップ
title: Fal
x-i18n:
    generated_at: "2026-07-05T11:44:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bd868aaf6771f6fa38bb8e2a83133460d150e2a5aa9e5b888e221c07f29e0ad
    source_path: providers/fal.md
    workflow: 16
---

OpenClawには、ホスト型の画像、動画、音楽生成向けにバンドル済みの`fal`プロバイダーが同梱されています。

| プロパティ | 値                                                                              |
| ---------- | ------------------------------------------------------------------------------- |
| プロバイダー | `fal`                                                                           |
| 認証       | `FAL_KEY`（標準。`FAL_API_KEY`もフォールバックとして動作）                     |
| API        | falモデルエンドポイント（`https://fal.run`。動画ジョブは`https://queue.fal.run`を使用） |
| ベースURL  | `models.providers.fal.baseUrl`で上書き                                          |

## はじめに

<Steps>
  <Step title="Set the API key">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```

    非対話セットアップでは`--fal-api-key <key>`を渡すか、`FAL_KEY`をエクスポートできます。
    オンボーディングでは、何も設定されていない場合に`fal/fal-ai/flux/dev`もデフォルトの画像モデルとして設定します。

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

バンドル済みの`fal`画像生成プロバイダーは、デフォルトで
`fal/fal-ai/flux/dev`を使用します。

| 機能           | 値                                                                 |
| -------------- | ------------------------------------------------------------------ |
| 最大画像数     | リクエストあたり4枚。Krea 2: リクエストあたり1枚                  |
| サイズ上書き   | `1024x1024`, `1024x1536`, `1536x1024`, `1024x1792`, `1792x1024`    |
| アスペクト比   | Flux image-to-imageを除くすべてでサポート                          |
| 解像度         | `1K`, `2K`, `4K`（モデルごとの制限は下記）                         |
| 出力形式       | `png`（デフォルト）または`jpeg`。Krea 2は`outputFormat`の上書きを拒否 |

編集リクエスト（共有の`image` / `images`パラメーター経由の参照画像）は、モデルごとの参照上限を持つモデル別の編集エンドポイントにルーティングされます。

| モデルファミリー          | `fal/`以降のモデルref                    | 編集エンドポイント | 最大参照画像数       |
| ------------------------- | ---------------------------------------- | ------------------ | -------------------- |
| Fluxおよびその他のfalモデル | `fal-ai/flux/dev`（デフォルト）          | `/image-to-image`  | 1                    |
| GPT Image                 | `openai/gpt-image-*`                     | `/edit`            | 10                   |
| Grok Imagine              | `xai/grok-imagine-image`                 | `/edit`            | 3                    |
| Nano Banana（レガシー）   | `fal-ai/nano-banana`                     | `/edit`            | 3                    |
| Nano Banana 2             | `fal-ai/nano-banana-*`                   | `/edit`            | 14                   |
| Nano Banana 2 Lite        | `google/nano-banana-2-lite`              | `/edit`            | 14                   |
| Krea 2                    | `krea/v2/{medium,large}/text-to-image`   | なし（スタイル参照） | 10個のスタイル参照  |

<Warning>
Flux image-to-imageリクエストは`aspectRatio`の上書きを**サポートしません**。GPT
ImageとNano Banana 2の編集リクエストはfalの`/edit`エンドポイントを使用し、アスペクト比のヒントを受け付けます。Nano Banana 2は`4:1`、`1:4`、`8:1`、`1:8`など、追加のネイティブな横長/縦長比率も受け付けます。Krea 2は独自のより小さいアスペクト比サブセットを検証します。Grok Imagineには独自の比率リスト（`2:1`、`20:9`、`19.5:9`、およびそれらの逆比を含む）があり、`1K`/`2K`解像度のみを受け付けます。レガシーNano BananaとNano Banana 2 Liteは`resolution`の上書きを拒否します。
</Warning>

Krea 2モデルはfalのネイティブKreaペイロードスキーマを使用します。OpenClawは、Fluxで使う汎用の`image_size` / 編集エンドポイント用ペイロードの代わりに、`aspect_ratio`、`creativity`、`image_style_references`を送信します。モデルrefは次のとおりです。

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

高速で表現力のあるイラスト、アニメ、絵画、アーティスティックなスタイルにはMediumを使用します。より低速なフォトリアル、未加工の質感、フィルムグレイン、細部まで作り込んだ見た目にはLargeを使用します。Kreaのデフォルトは`fal.creativity: "medium"`です。サポートされる値は`raw`、`low`、`medium`、`high`です。

Krea 2はfalのリクエストスキーマで`image_size`ではなくアスペクト比を公開します。`aspectRatio`を優先してください。OpenClawは`size`を最も近いサポート済みKreaアスペクト比にマッピングし、Kreaでは`resolution`を破棄するのではなく拒否します。

`output_format`を公開しているfalモデルからPNG出力が必要な場合は、`outputFormat: "png"`を使用します。falはOpenClawで明示的な透明背景コントロールを宣言していないため、falモデルでは`background: "transparent"`は無視された上書きとして報告されます。
Krea 2エンドポイントはfal経由で`output_format`リクエストフィールドを公開しないため、OpenClawはKreaリクエストでの`outputFormat`上書きを拒否します。

Krea 2 Mediumを使用するには:

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

バンドル済みの`fal`動画生成プロバイダーは、デフォルトで
`fal/fal-ai/minimax/video-01-live`を使用します。

| 機能       | 値                                                                 |
| ---------- | ------------------------------------------------------------------ |
| モード     | Text-to-video、単一画像参照、Seedance reference-to-video          |
| ランタイム | 長時間実行ジョブ向けのキュー利用の送信/ステータス/結果フロー      |
| タイムアウト | デフォルトでジョブあたり20分。ステータスは5秒ごとにポーリング    |

<AccordionGroup>
  <Accordion title="Available video models">
    **MiniMax（デフォルト）:**

    - `fal/fal-ai/minimax/video-01-live`

    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **KlingとWan:**

    - `fal/fal-ai/kling-video/v2.1/master/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/image-to-video`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

    MiniMax LiveとHeyGenのリクエストは、プロンプトと任意の単一参照画像のみを送信します。その他の上書きは転送されません。Seedanceモデルは`aspectRatio`、`size`、`resolution`、4-15秒の長さ、音声トグルを受け付けます。

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

    Reference-to-videoは、共有の`video_generate`の`images`、`videos`、`audioRefs`パラメーターを通じて、最大9枚の画像、3本の動画、3件の音声参照を受け付け、参照ファイルは合計で最大12件までです。音声参照には、同じリクエスト内に少なくとも1つの画像または動画参照が必要です。

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

## 音楽生成

バンドル済みの`fal` Pluginは、共有の`music_generate`ツール向けの音楽生成プロバイダーも登録します。

| 機能             | 値                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| デフォルトモデル | `fal/fal-ai/minimax-music/v2.6`                                                                                          |
| モデル           | `fal-ai/minimax-music/v2.6`（mp3）、`fal-ai/ace-step/prompt-to-audio`（wav）、`fal-ai/stable-audio-25/text-to-audio`（wav） |
| 最大長           | 240秒                                                                                                                    |
| ランタイム       | 同期リクエストと生成された音声のダウンロード                                                                             |

falをデフォルトの音楽プロバイダーとして使用します。

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

`fal-ai/minimax-music/v2.6`は明示的な歌詞とインストゥルメンタルモードをサポートしますが、同じリクエストで両方を使用することはできません。ACE-StepとStable Audioはprompt-to-audioエンドポイントです。これらのモデルファミリーを使いたい場合は、`model`上書きで選択してください。ACE-Stepは明示的な歌詞を拒否します。Stable Audioは歌詞とインストゥルメンタルモードの両方を拒否します。

<Tip>
上記の表とアコーディオンは、バンドル済みfalプロバイダーが特別扱いするモデルファミリーを対象としています。その他のfal画像エンドポイントIDも画像モデルとして選択できます。それらはFluxと同様に扱われます（汎用`image_size`ペイロード、`/image-to-image`経由の参照画像1枚）。
</Tip>

## 関連

<CardGroup cols={2}>
  <Card title="Image generation" href="/ja-JP/tools/image-generation" icon="image">
    共有画像ツールのパラメーターとプロバイダー選択。
  </Card>
  <Card title="Video generation" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールのパラメーターとプロバイダー選択。
  </Card>
  <Card title="Music generation" href="/ja-JP/tools/music-generation" icon="music">
    共有音楽ツールのパラメーターとプロバイダー選択。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/config-agents#agent-defaults" icon="gear">
    画像、動画、音楽モデル選択を含むエージェントのデフォルト。
  </Card>
</CardGroup>
