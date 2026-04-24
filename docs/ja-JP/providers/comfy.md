---
read_when:
    - OpenClaw でローカル ComfyUI ワークフローを使いたい場合
    - 画像、動画、または音楽ワークフローで Comfy Cloud を使いたい場合
    - 同梱 comfy Plugin の config キーが必要な場合
summary: OpenClaw での ComfyUI ワークフローによる画像、動画、音楽生成のセットアップ
title: ComfyUI
x-i18n:
    generated_at: "2026-04-24T05:14:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8b39c49df3ad23018372b481681ce89deac3271da5dbdf94580712ace7fef7f
    source_path: providers/comfy.md
    workflow: 15
---

OpenClaw には、ワークフロー駆動の ComfyUI 実行向けに同梱の `comfy` Plugin が含まれています。この Plugin は完全にワークフロー駆動なので、OpenClaw は汎用的な `size`、`aspectRatio`、`resolution`、`durationSeconds`、または TTS 風の制御をグラフにマッピングしようとはしません。

| Property | 詳細 |
| --------------- | -------------------------------------------------------------------------------- |
| Provider | `comfy` |
| Models | `comfy/workflow` |
| 共有サーフェス | `image_generate`, `video_generate`, `music_generate` |
| 認証 | ローカル ComfyUI では不要。Comfy Cloud では `COMFY_API_KEY` または `COMFY_CLOUD_API_KEY` |
| API | ComfyUI の `/prompt` / `/history` / `/view` と Comfy Cloud の `/api/*` |

## サポート内容

- ワークフロー JSON からの画像生成
- アップロードされた 1 枚の参照画像を使った画像編集
- ワークフロー JSON からの動画生成
- アップロードされた 1 枚の参照画像を使った動画生成
- 共有 `music_generate` tool を通じた音楽または音声生成
- 設定済みノード、または一致するすべての出力ノードからの出力ダウンロード

## はじめに

自分のマシン上で ComfyUI を実行するか、Comfy Cloud を使うかを選んでください。

<Tabs>
  <Tab title="Local">
    **最適な用途:** 自分のマシンまたは LAN 上で独自の ComfyUI インスタンスを実行する場合。

    <Steps>
      <Step title="ComfyUI をローカルで起動する">
        ローカルの ComfyUI インスタンスが動作していることを確認してください（デフォルトは `http://127.0.0.1:8188`）。
      </Step>
      <Step title="ワークフロー JSON を準備する">
        ComfyUI のワークフロー JSON ファイルをエクスポートまたは作成します。prompt 入力ノードと、OpenClaw に読み取らせたい出力ノードの node ID を控えてください。
      </Step>
      <Step title="プロバイダーを設定する">
        `mode: "local"` を設定し、ワークフローファイルを指定します。以下は最小の画像生成例です。

        ```json5
        {
          models: {
            providers: {
              comfy: {
                mode: "local",
                baseUrl: "http://127.0.0.1:8188",
                image: {
                  workflowPath: "./workflows/flux-api.json",
                  promptNodeId: "6",
                  outputNodeId: "9",
                },
              },
            },
          },
        }
        ```
      </Step>
      <Step title="デフォルトモデルを設定する">
        設定した capability に対して、OpenClaw を `comfy/workflow` モデルに向けます。

        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="確認する">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **最適な用途:** ローカル GPU リソースを管理せずに Comfy Cloud 上でワークフローを実行したい場合。

    <Steps>
      <Step title="API key を取得する">
        [comfy.org](https://comfy.org) で登録し、アカウントダッシュボードから API key を生成します。
      </Step>
      <Step title="API key を設定する">
        次のいずれかの方法で key を指定します。

        ```bash
        # 環境変数（推奨）
        export COMFY_API_KEY="your-key"

        # 代替環境変数
        export COMFY_CLOUD_API_KEY="your-key"

        # または config に直接
        openclaw config set models.providers.comfy.apiKey "your-key"
        ```
      </Step>
      <Step title="ワークフロー JSON を準備する">
        ComfyUI のワークフロー JSON ファイルをエクスポートまたは作成します。prompt 入力ノードと出力ノードの node ID を控えてください。
      </Step>
      <Step title="プロバイダーを設定する">
        `mode: "cloud"` を設定し、ワークフローファイルを指定します。

        ```json5
        {
          models: {
            providers: {
              comfy: {
                mode: "cloud",
                image: {
                  workflowPath: "./workflows/flux-api.json",
                  promptNodeId: "6",
                  outputNodeId: "9",
                },
              },
            },
          },
        }
        ```

        <Tip>
        cloud mode の `baseUrl` はデフォルトで `https://cloud.comfy.org` です。custom cloud endpoint を使う場合にのみ `baseUrl` を設定してください。
        </Tip>
      </Step>
      <Step title="デフォルトモデルを設定する">
        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="確認する">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 設定

Comfy は、共有トップレベル接続設定と、capability ごとのワークフローセクション（`image`, `video`, `music`）をサポートします。

```json5
{
  models: {
    providers: {
      comfy: {
        mode: "local",
        baseUrl: "http://127.0.0.1:8188",
        image: {
          workflowPath: "./workflows/flux-api.json",
          promptNodeId: "6",
          outputNodeId: "9",
        },
        video: {
          workflowPath: "./workflows/video-api.json",
          promptNodeId: "12",
          outputNodeId: "21",
        },
        music: {
          workflowPath: "./workflows/music-api.json",
          promptNodeId: "3",
          outputNodeId: "18",
        },
      },
    },
  },
}
```

### 共有キー

| Key | Type | 説明 |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `mode` | `"local"` または `"cloud"` | 接続モード。 |
| `baseUrl` | string | local ではデフォルト `http://127.0.0.1:8188`、cloud では `https://cloud.comfy.org`。 |
| `apiKey` | string | 任意の inline key。`COMFY_API_KEY` / `COMFY_CLOUD_API_KEY` env var の代替。 |
| `allowPrivateNetwork` | boolean | cloud mode で private/LAN の `baseUrl` を許可。 |

### capability ごとのキー

これらのキーは `image`, `video`, `music` セクションの内部で適用されます。

| Key | 必須 | デフォルト | 説明 |
| ---------------------------- | -------- | -------- | ---------------------------------------------------------------------------- |
| `workflow` または `workflowPath` | はい | -- | ComfyUI ワークフロー JSON ファイルのパス。 |
| `promptNodeId` | はい | -- | テキスト prompt を受け取る node ID。 |
| `promptInputName` | いいえ | `"text"` | prompt node 上の入力名。 |
| `outputNodeId` | いいえ | -- | 出力を読み取る node ID。省略時は、一致するすべての出力 node を使用。 |
| `pollIntervalMs` | いいえ | -- | ジョブ完了までの polling 間隔（ミリ秒）。 |
| `timeoutMs` | いいえ | -- | ワークフロー実行の timeout（ミリ秒）。 |

`image` と `video` セクションはさらに次をサポートします。

| Key | 必須 | デフォルト | 説明 |
| --------------------- | ------------------------------------ | --------- | --------------------------------------------------- |
| `inputImageNodeId` | はい（参照画像を渡す場合） | -- | アップロードされた参照画像を受け取る node ID。 |
| `inputImageInputName` | いいえ | `"image"` | 画像 node 上の入力名。 |

## ワークフロー詳細

<AccordionGroup>
  <Accordion title="画像ワークフロー">
    デフォルトの画像モデルを `comfy/workflow` に設定します。

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    **参照画像編集の例:**

    アップロードした参照画像を使った画像編集を有効にするには、画像 config に `inputImageNodeId` を追加します。

    ```json5
    {
      models: {
        providers: {
          comfy: {
            image: {
              workflowPath: "./workflows/edit-api.json",
              promptNodeId: "6",
              inputImageNodeId: "7",
              inputImageInputName: "image",
              outputNodeId: "9",
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="動画ワークフロー">
    デフォルトの動画モデルを `comfy/workflow` に設定します。

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    Comfy の動画ワークフローは、設定されたグラフを通じて text-to-video と image-to-video をサポートします。

    <Note>
    OpenClaw は入力動画を Comfy ワークフローに渡しません。入力としてサポートされるのは、テキスト prompt と単一の参照画像のみです。
    </Note>

  </Accordion>

  <Accordion title="音楽ワークフロー">
    同梱 Plugin は、ワークフロー定義の音声または音楽出力向けに音楽生成プロバイダーを登録し、共有 `music_generate` tool を通じて公開します。

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    `music` config セクションを使って、音声ワークフロー JSON と出力 node を指定してください。

  </Accordion>

  <Accordion title="後方互換性">
    既存のトップレベル画像 config（ネストした `image` セクションなし）も引き続き動作します。

    ```json5
    {
      models: {
        providers: {
          comfy: {
            workflowPath: "./workflows/flux-api.json",
            promptNodeId: "6",
            outputNodeId: "9",
          },
        },
      },
    }
    ```

    OpenClaw はこの旧式形状を画像ワークフロー config として扱います。すぐに移行する必要はありませんが、新しいセットアップではネストされた `image` / `video` / `music` セクションを推奨します。

    <Tip>
    画像生成だけを使う場合、旧式のフラット config と新しいネストされた `image` セクションは機能的に同等です。
    </Tip>

  </Accordion>

  <Accordion title="ライブテスト">
    同梱 Plugin には、オプトインの live coverage があります。

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    一致する Comfy ワークフローセクションが設定されていない限り、live test は画像、動画、音楽の各ケースを個別にスキップします。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Image Generation" href="/ja-JP/tools/image-generation" icon="image">
    画像生成 tool の設定と使い方。
  </Card>
  <Card title="Video Generation" href="/ja-JP/tools/video-generation" icon="video">
    動画生成 tool の設定と使い方。
  </Card>
  <Card title="Music Generation" href="/ja-JP/tools/music-generation" icon="music">
    音楽および音声生成 tool のセットアップ。
  </Card>
  <Card title="Provider Directory" href="/ja-JP/providers/index" icon="layers">
    すべてのプロバイダーと model ref の概要。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/config-agents#agent-defaults" icon="gear">
    エージェントデフォルトを含む完全な config リファレンス。
  </Card>
</CardGroup>
