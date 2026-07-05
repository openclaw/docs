---
read_when:
    - ローカルの ComfyUI ワークフローを OpenClaw で使いたい
    - Comfy Cloud を画像、動画、または音楽のワークフローで使いたい
    - バンドルされた comfy plugin の設定キーが必要です
summary: OpenClaw での ComfyUI ワークフロー画像、動画、音楽生成セットアップ
title: ComfyUI
x-i18n:
    generated_at: "2026-07-05T11:43:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0602dcad22ed36e8cbf5b04f5098f613d48fcd6af55b0e13804cfeb4533d0247
    source_path: providers/comfy.md
    workflow: 16
---

OpenClaw は、ワークフロー駆動の ComfyUI 実行向けにバンドルされた `comfy` Plugin を同梱しています。この
Plugin は完全にワークフロー駆動です。OpenClaw は汎用の `size`、
`aspectRatio`、`resolution`、`durationSeconds`、または TTS スタイルのコントロールを
グラフに対応付けません。

| プロパティ | 詳細                                                                                  |
| ---------- | ------------------------------------------------------------------------------------- |
| Provider   | `comfy`                                                                               |
| Model      | `comfy/workflow`                                                                      |
| 共有ツール | `image_generate`, `video_generate`, `music_generate`                                  |
| 認証       | ローカル ComfyUI では不要。Comfy Cloud では `COMFY_API_KEY` または `COMFY_CLOUD_API_KEY` |
| API        | ComfyUI `/prompt` / `/history` / `/view`; Comfy Cloud `/api/*`                        |

## 対応していること

- ワークフロー JSON からの画像生成と編集（編集ではアップロード済みの参照画像を 1 つ使用）
- ワークフロー JSON からの動画生成、text-to-video または image-to-video（参照画像 1 つ）
- 共有 `music_generate` ツールを通じた音楽/音声生成。任意で参照画像を 1 つ使用可能
- 設定済みノードからの出力ダウンロード、または未設定の場合は一致するすべての出力ノードからのダウンロード

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
        ComfyUI ワークフロー JSON ファイルをエクスポートまたは作成します。プロンプト入力ノードと、OpenClaw に読み取らせたい出力ノードのノード ID を控えておきます。
      </Step>
      <Step title="Provider を設定する">
        `mode: "local"` を設定し、ワークフローファイルを指定します。最小限の画像例:

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
        設定した機能について、OpenClaw が `comfy/workflow` モデルを参照するようにします:

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
      <Step title="検証する">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **最適な用途:** ローカル GPU リソースを管理せずに Comfy Cloud でワークフローを実行する場合。

    <Steps>
      <Step title="API キーを取得する">
        [comfy.org](https://comfy.org) でサインアップし、アカウントダッシュボードから API キーを生成します。
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
        ComfyUI ワークフロー JSON ファイルをエクスポートまたは作成します。プロンプト入力ノードと出力ノードのノード ID を控えておきます。
      </Step>
      <Step title="Provider を設定する">
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
        クラウドモードでは `baseUrl` のデフォルトは `https://cloud.comfy.org` です。カスタムクラウドエンドポイントを使う場合のみ `baseUrl` を設定します。
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
      <Step title="検証する">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 設定

Comfy は、共有のトップレベル接続設定に加えて、機能ごとのワークフローセクション（`image`、`video`、`music`）に対応しています:

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

| キー                  | 型                     | 説明                                                                                  |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `mode`                | `"local"` または `"cloud"` | 接続モード。デフォルトは `"local"`。                                                  |
| `baseUrl`             | string                 | ローカルでは `http://127.0.0.1:8188`、クラウドでは `https://cloud.comfy.org` がデフォルト。 |
| `apiKey`              | string                 | 任意のインラインキー。`COMFY_API_KEY` / `COMFY_CLOUD_API_KEY` 環境変数の代替。        |
| `allowPrivateNetwork` | boolean                | クラウドモードでプライベート/LAN の `baseUrl` を許可する。                            |

### 機能ごとのキー

これらのキーは `image`、`video`、または `music` セクション内に適用されます:

| キー                         | 必須 | デフォルト | 説明                                                                 |
| ---------------------------- | ---- | ---------- | -------------------------------------------------------------------- |
| `workflow` or `workflowPath` | はい | --         | インラインのワークフロー JSON、または ComfyUI ワークフロー JSON ファイルへのパス。 |
| `promptNodeId`               | はい | --         | テキストプロンプトを受け取るノード ID。                              |
| `promptInputName`            | いいえ | `"text"` | プロンプトノード上の入力名。                                         |
| `outputNodeId`               | いいえ | --       | 出力を読み取るノード ID。省略した場合、一致するすべての出力ノードが使用されます。 |
| `pollIntervalMs`             | いいえ | `1500`   | ジョブ完了を確認するポーリング間隔（ミリ秒）。                       |
| `timeoutMs`                  | いいえ | `300000` | ワークフロー実行のタイムアウト（ミリ秒）。                           |

`image` セクションと `video` セクションは、参照画像の入力ノードにも対応しています:

| キー                  | 必須                                 | デフォルト | 説明                                           |
| --------------------- | ------------------------------------ | ---------- | ---------------------------------------------- |
| `inputImageNodeId`    | はい（参照画像を渡す場合）           | --         | アップロード済み参照画像を受け取るノード ID。 |
| `inputImageInputName` | いいえ                               | `"image"`  | 画像ノード上の入力名。                         |

`apiKey` は、リテラル文字列または [シークレット参照](/ja-JP/gateway/configuration-reference#secrets) オブジェクトのいずれかを受け付けます。

## ワークフローの詳細

<AccordionGroup>
  <Accordion title="画像ワークフロー">
    デフォルト画像モデルを `comfy/workflow` に設定します:

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

    アップロード済み参照画像を使った画像編集を有効にするには、画像設定に `inputImageNodeId` を追加します:

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
    デフォルト動画モデルを `comfy/workflow` に設定します:

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

    Comfy の動画ワークフローは、設定されたグラフを通じて text-to-video と image-to-video に対応しています。

    <Note>
    OpenClaw は入力動画を Comfy ワークフローに渡しません。入力として対応しているのは、テキストプロンプトと単一の参照画像のみです。
    </Note>

  </Accordion>

  <Accordion title="音楽ワークフロー">
    バンドルされた Plugin は、ワークフローで定義された音声または音楽出力向けの音楽生成 Provider を登録し、共有 `music_generate` ツールを通じて公開します。任意の参照画像（最大 1 つ）を受け付けます:

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    `music` 設定セクションを使用して、音声ワークフロー JSON と出力ノードを指定します。

  </Accordion>

  <Accordion title="後方互換性">
    ネストされた `image` セクションを使わない既存のトップレベル画像設定も引き続き機能します:

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

    OpenClaw はそのレガシー形状を画像ワークフロー設定として扱います。すぐに移行する必要はありませんが、新しいセットアップにはネストされた `image` / `video` / `music` セクションを推奨します。画像生成のみを使用する場合、レガシーのフラット設定と新しいネストされた `image` セクションは機能的に同等です。

  </Accordion>

  <Accordion title="ライブテスト">
    バンドルされた Plugin には、オプトインのライブカバレッジがあります:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    ライブテストは、一致する Comfy ワークフローセクションが設定されていない限り、個別の画像、動画、または音楽ケースをスキップします。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    画像生成ツールの設定と使用方法。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    動画生成ツールの設定と使用方法。
  </Card>
  <Card title="音楽生成" href="/ja-JP/tools/music-generation" icon="music">
    音楽と音声生成ツールのセットアップ。
  </Card>
  <Card title="プロバイダーディレクトリ" href="/ja-JP/providers/index" icon="layers">
    すべてのプロバイダーとモデル参照の概要。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/config-agents#agent-defaults" icon="gear">
    エージェントのデフォルトを含む完全な設定リファレンス。
  </Card>
</CardGroup>
