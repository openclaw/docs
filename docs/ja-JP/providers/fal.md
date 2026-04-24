---
read_when:
    - OpenClaw で fal 画像生成を使いたい場合
    - '`FAL_KEY` 認証フローが必要な場合'
    - '`image_generate` または `video_generate` 向けの fal デフォルト設定が必要な場合'
summary: OpenClaw での fal 画像・動画生成セットアップ
title: Fal
x-i18n:
    generated_at: "2026-04-24T05:14:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: d23d2d0d27e5f60f9dacb4a6a7e4c07248cf45ccd80bfabaf6bb99f5f78946b2
    source_path: providers/fal.md
    workflow: 15
---

OpenClaw には、ホスト型の画像生成と動画生成向けに同梱の `fal` プロバイダがあります。

| 項目       | 値                                                              |
| ---------- | --------------------------------------------------------------- |
| プロバイダ | `fal`                                                           |
| 認証       | `FAL_KEY`（正式。`FAL_API_KEY` もフォールバックとして動作）     |
| API        | fal モデルエンドポイント                                        |

## はじめに

<Steps>
  <Step title="API キーを設定">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="デフォルト画像モデルを設定">
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

同梱の `fal` 画像生成プロバイダのデフォルトは
`fal/fal-ai/flux/dev` です。

| 機能             | 値                         |
| ---------------- | -------------------------- |
| 最大画像数       | リクエストあたり 4         |
| 編集モード       | 有効、参照画像 1 枚        |
| サイズ上書き     | サポート                   |
| アスペクト比     | サポート                   |
| 解像度           | サポート                   |

<Warning>
fal の画像編集エンドポイントは `aspectRatio` 上書きを **サポートしません**。
</Warning>

fal をデフォルト画像プロバイダとして使うには:

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

同梱の `fal` 動画生成プロバイダのデフォルトは
`fal/fal-ai/minimax/video-01-live` です。

| 機能       | 値                                                             |
| ---------- | -------------------------------------------------------------- |
| モード     | テキストから動画、単一画像参照                                 |
| ランタイム | 長時間実行ジョブ向けの、キュー型 submit / status / result フロー |

<AccordionGroup>
  <Accordion title="利用可能な動画モデル">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`

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

<Tip>
利用可能な fal
モデルの完全一覧（最近追加されたエントリを含む）を見るには `openclaw models list --provider fal` を使ってください。
</Tip>

## 関連

<CardGroup cols={2}>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共通画像ツールパラメータとプロバイダ選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共通動画ツールパラメータとプロバイダ選択。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/config-agents#agent-defaults" icon="gear">
    画像 / 動画モデル選択を含むエージェントデフォルト。
  </Card>
</CardGroup>
