---
read_when:
    - OpenClaw でローカルの ComfyUI ワークフローを使用したい場合
    - 画像、動画、音楽のワークフローで Comfy Cloud を使用したい場合
    - バンドル版 comfy Plugin の設定キーが必要です
summary: OpenClawでのComfyUIワークフローによる画像、動画、音楽生成のセットアップ
title: ComfyUI
x-i18n:
    generated_at: "2026-07-11T22:36:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74150d202a422de8e0f4b2b82d5d12bd42eb46991e8ef688832208e1a2ff7793
    source_path: providers/comfy.md
    workflow: 16
---

OpenClaw には、ワークフロー駆動の ComfyUI 実行用 `comfy` Plugin が同梱されています。この
Plugin は完全にワークフロー駆動です。OpenClaw は、汎用的な `size`、
`aspectRatio`、`resolution`、`durationSeconds`、または TTS 形式の制御を
グラフに対応付けません。

| プロパティ     | 詳細                                                                           |
| ------------ | -------------------------------------------------------------------------------- |
| プロバイダー     | `comfy`                                                                          |
| モデル        | `comfy/workflow`                                                                 |
| 共有ツール | `image_generate`、`video_generate`、`music_generate`                             |
| 認証         | ローカルの ComfyUI では不要。Comfy Cloud では `COMFY_API_KEY` または `COMFY_CLOUD_API_KEY` |
| API          | ComfyUI `/prompt` / `/history` / `/view`、Comfy Cloud `/api/*`                   |

## 対応機能

- ワークフロー JSON による画像の生成と編集（編集ではアップロードした参照画像を1枚使用）
- ワークフロー JSON による動画生成。テキストから動画、または画像から動画（参照画像1枚）
- 共有 `music_generate` ツールによる音楽・音声生成。任意で参照画像を1枚使用可能
- 設定したノードから出力をダウンロード。ノードを設定していない場合は、一致するすべての出力ノードからダウンロード

## はじめに

自分のマシンで ComfyUI を実行するか、Comfy Cloud を使用するかを選択します。

<Tabs>
  <Tab title="ローカル">
    **最適な用途:** 自分のマシンまたは LAN 上で ComfyUI インスタンスを実行する場合。

    <Steps>
      <Step title="ComfyUI をローカルで起動する">
        ローカルの ComfyUI インスタンスが実行中であることを確認します（デフォルトは `http://127.0.0.1:8188`）。
      </Step>
      <Step title="ワークフロー JSON を準備する">
        ComfyUI ワークフロー JSON ファイルをエクスポートまたは作成します。プロンプト入力ノードと、OpenClaw が読み取る出力ノードのノード ID を確認します。
      </Step>
      <Step title="プロバイダーを設定する">
        `mode: "local"` を設定し、ワークフローファイルを指定します。最小限の画像設定例:

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
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
          },
        }
        ```
      </Step>
      <Step title="デフォルトモデルを設定する">
        設定した機能について、OpenClaw が `comfy/workflow` モデルを使用するよう指定します:

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
    **最適な用途:** ローカルの GPU リソースを管理せずに Comfy Cloud でワークフローを実行する場合。

    <Steps>
      <Step title="API キーを取得する">
        [comfy.org](https://comfy.org) で登録し、アカウントのダッシュボードから API キーを生成します。
      </Step>
      <Step title="API キーを設定する">
        次のいずれかの方法でキーを指定します:

        ```bash
        # Onboarding flag
        openclaw onboard --comfy-api-key "your-key"

        # Environment variable (preferred for daemons)
        export COMFY_API_KEY="your-key"

        # Alternative environment variable
        export COMFY_CLOUD_API_KEY="your-key"

        # Or inline in config
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="ワークフロー JSON を準備する">
        ComfyUI ワークフロー JSON ファイルをエクスポートまたは作成します。プロンプト入力ノードと出力ノードのノード ID を確認します。
      </Step>
      <Step title="プロバイダーを設定する">
        `mode: "cloud"` を設定し、ワークフローファイルを指定します:

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "cloud",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```

        <Tip>
        クラウドモードでは、`baseUrl` のデフォルトは `https://cloud.comfy.org` です。カスタムのクラウドエンドポイントを使用する場合にのみ `baseUrl` を設定してください。
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

Comfy は、共有の最上位接続設定と、機能ごとのワークフローセクション（`image`、`video`、`music`）に対応しています:

```json5
{
  plugins: {
    entries: {
      comfy: {
        config: {
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
  },
}
```

### 共有キー

| キー                   | 型                   | 説明                                                                           |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `mode`                | `"local"` または `"cloud"` | 接続モード。デフォルトは `"local"`。                                               |
| `baseUrl`             | 文字列                 | ローカルではデフォルトが `http://127.0.0.1:8188`、クラウドでは `https://cloud.comfy.org`。 |
| `apiKey`              | 文字列                 | 任意のインラインキー。環境変数 `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY` の代替。 |
| `allowPrivateNetwork` | 真偽値                | クラウドモードでプライベート/LAN の `baseUrl`、またはローカルのプライベート DNS FQDN を許可。              |

<Note>
`local` モードでは、ループバック/プライベート IP リテラルと、`http://comfyui:8188` のような単一ラベルのサービス名は、`allowPrivateNetwork` なしで機能します。`https://comfy.local.example.com` のように公開アドレスに見えるプライベート DNS FQDN には、`allowPrivateNetwork: true` が必要です。プライベートオリジンへの信頼は、設定されたスキーム、ホスト名、ポートのみに限定されます。ローカルのリダイレクトは設定されたホスト名から外れることができません。一方、公開 CDN へのクラウドリダイレクトは、デフォルトの SSRF ポリシーで検査されます。
</Note>

### 機能ごとのキー

これらのキーは、`image`、`video`、または `music` セクション内で使用します:

| キー                          | 必須 | デフォルト  | 説明                                                                  |
| ---------------------------- | -------- | -------- | ---------------------------------------------------------------------------- |
| `workflow` または `workflowPath` | はい      | --       | インラインのワークフロー JSON、または ComfyUI ワークフロー JSON ファイルへのパス。             |
| `promptNodeId`               | はい      | --       | テキストプロンプトを受け取るノード ID。                                       |
| `promptInputName`            | いいえ       | `"text"` | プロンプトノード上の入力名。                                               |
| `outputNodeId`               | いいえ       | --       | 出力を読み取るノード ID。省略した場合は、一致するすべての出力ノードを使用。 |
| `pollIntervalMs`             | いいえ       | `1500`   | ジョブの完了を確認するポーリング間隔（ミリ秒）。                         |
| `timeoutMs`                  | いいえ       | `300000` | ワークフロー実行のタイムアウト（ミリ秒）。                                |

`image` セクションと `video` セクションは、参照画像の入力ノードにも対応しています:

| キー                   | 必須                             | デフォルト   | 説明                                         |
| --------------------- | ------------------------------------ | --------- | --------------------------------------------------- |
| `inputImageNodeId`    | はい（参照画像を渡す場合） | --        | アップロードした参照画像を受け取るノード ID。 |
| `inputImageInputName` | いいえ                                   | `"image"` | 画像ノード上の入力名。                       |

`apiKey` には、リテラル文字列または[シークレット参照](/ja-JP/gateway/configuration-reference#secrets)オブジェクトを指定できます。

## ワークフローの詳細

<AccordionGroup>
  <Accordion title="画像ワークフロー">
    デフォルトの画像モデルを `comfy/workflow` に設定します:

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

    **参照画像を使用した編集例:**

    アップロードした参照画像による画像編集を有効にするには、画像設定に `inputImageNodeId` を追加します:

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
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
      },
    }
    ```

  </Accordion>

  <Accordion title="動画ワークフロー">
    デフォルトの動画モデルを `comfy/workflow` に設定します:

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

    Comfy の動画ワークフローは、設定されたグラフを通じてテキストから動画、および画像から動画への生成に対応します。

    <Note>
    OpenClaw は入力動画を Comfy ワークフローに渡しません。入力として対応しているのは、テキストプロンプトと1枚の参照画像のみです。
    </Note>

  </Accordion>

  <Accordion title="音楽ワークフロー">
    同梱 Plugin は、ワークフローで定義された音声または音楽出力用の音楽生成プロバイダーを登録し、共有 `music_generate` ツールを通じて提供します。任意の参照画像を受け付けます（最大1枚）:

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    `music` 設定セクションで、音声ワークフロー JSON と出力ノードを指定します。

  </Accordion>

  <Accordion title="後方互換性">
    既存の最上位画像設定（ネストされた `image` セクションを使用しない形式）も引き続き機能します:

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              workflowPath: "./workflows/flux-api.json",
              promptNodeId: "6",
              outputNodeId: "9",
            },
          },
        },
      },
    }
    ```

    OpenClaw は、このレガシー形式を画像ワークフロー設定として扱います。すぐに移行する必要はありませんが、新規設定ではネストされた `image` / `video` / `music` セクションを推奨します。画像生成のみを使用する場合、レガシーのフラット設定と新しいネストされた `image` セクションは機能的に同等です。

  </Accordion>

  <Accordion title="ライブテスト">
    同梱 Plugin には、オプトインのライブテスト範囲があります:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    ライブテストでは、対応する Comfy ワークフローのセクションが設定されていない場合、個別の画像、動画、音楽のケースをスキップします。

  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    画像生成ツールの設定と使用方法。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    動画生成ツールの設定と使用方法。
  </Card>
  <Card title="音楽生成" href="/ja-JP/tools/music-generation" icon="music">
    音楽および音声生成ツールのセットアップ。
  </Card>
  <Card title="プロバイダーディレクトリ" href="/ja-JP/providers/index" icon="layers">
    すべてのプロバイダーとモデル参照の概要。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/config-agents#agent-defaults" icon="gear">
    エージェントのデフォルトを含む完全な設定リファレンス。
  </Card>
</CardGroup>
