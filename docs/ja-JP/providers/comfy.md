---
read_when:
    - ローカルComfyUI workflowをOpenClawで使いたい場合
    - 画像、動画、または音楽workflowでComfy Cloudを使いたい場合
    - 同梱のcomfyプラグイン設定キーが必要です
summary: OpenClawでのComfyUI workflowによる画像、動画、音楽生成セットアップ
title: ComfyUI
x-i18n:
    generated_at: "2026-04-25T13:56:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 41dda4be24d5b2c283fa499a345cf9f38747ec19b4010163ceffd998307ca086
    source_path: providers/comfy.md
    workflow: 15
    postprocess_version: locale-links-v1
---

OpenClaw には、ワークフロー駆動の ComfyUI 実行向けに、`comfy` プラグインが同梱されています。このプラグインは完全にワークフロー駆動であるため、OpenClaw は汎用的な `size`、`aspectRatio`、`resolution`、`durationSeconds`、または TTS 形式のコントロールをグラフにマッピングしようとはしません。

| プロパティ | 詳細 |
| --------------- | -------------------------------------------------------------------------------- |
| Provider | `comfy` |
| Models | `comfy/workflow` |
| 共有サーフェス | `image_generate`, `video_generate`, `music_generate` |
| 認証 | ローカル ComfyUI では不要。Comfy Cloud では `COMFY_API_KEY` または `COMFY_CLOUD_API_KEY` |
| API | ComfyUI の `/prompt` / `/history` / `/view` と Comfy Cloud の `/api/*` |

## サポート内容

- ワークフロー JSON からの画像生成
- アップロードした参照画像 1 枚を使った画像編集
- ワークフロー JSON からの動画生成
- アップロードした参照画像 1 枚を使った動画生成
- 共有 `music_generate` ツールによる音楽または音声生成
- 設定済みノード、または一致するすべての出力ノードからの出力ダウンロード

## はじめに

自分のマシンで ComfyUI を実行するか、Comfy Cloud を使うかを選択します。

<Tabs>
  <Tab title="Local">
    **最適な用途:** 自分のマシンまたは LAN 上で自身の ComfyUI インスタンスを実行する場合。

    <Steps>
      <Step title="ComfyUI をローカルで起動する">
        ローカルの ComfyUI インスタンスが実行中であることを確認してください（デフォルトは `http://127.0.0.1:8188`）。
      </Step>
      <Step title="ワークフロー JSON を準備する">
        ComfyUI のワークフロー JSON ファイルをエクスポートまたは作成します。プロンプト入力ノードと、OpenClaw が読み取る出力ノードのノード ID を控えておいてください。
      </Step>
      <Step title="Provider を設定する">
        `mode: "local"` を設定し、ワークフローファイルを指定します。以下は最小構成の画像例です。

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
        設定した機能の `comfy/workflow` モデルを OpenClaw に指定します。

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
    **最適な用途:** ローカル GPU リソースを管理せずに Comfy Cloud 上でワークフローを実行する場合。

    <Steps>
      <Step title="API キーを取得する">
        [comfy.org](https://comfy.org) で登録し、アカウントダッシュボードから API キーを生成します。
      </Step>
      <Step title="API キーを設定する">
        次のいずれかの方法でキーを指定します。

        ```bash
        # 環境変数（推奨）
        export COMFY_API_KEY="your-key"

        # 代替の環境変数
        export COMFY_CLOUD_API_KEY="your-key"

        # または設定に直接記述
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="ワークフロー JSON を準備する">
        ComfyUI のワークフロー JSON ファイルをエクスポートまたは作成します。プロンプト入力ノードと出力ノードのノード ID を控えておいてください。
      </Step>
      <Step title="Provider を設定する">
        `mode: "cloud"` を設定し、ワークフローファイルを指定します。

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
        cloud モードでは `baseUrl` のデフォルトは `https://cloud.comfy.org` です。カスタムのクラウドエンドポイントを使う場合にのみ `baseUrl` を設定する必要があります。
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

Comfy は、共有のトップレベル接続設定と、機能ごとのワークフローセクション（`image`、`video`、`music`）をサポートします。

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

| キー | 型 | 説明 |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `mode` | `"local"` or `"cloud"` | 接続モード。 |
| `baseUrl` | string | local ではデフォルトで `http://127.0.0.1:8188`、cloud では `https://cloud.comfy.org`。 |
| `apiKey` | string | 任意のインラインキー。`COMFY_API_KEY` / `COMFY_CLOUD_API_KEY` 環境変数の代替です。 |
| `allowPrivateNetwork` | boolean | cloud モードでプライベート / LAN の `baseUrl` を許可します。 |

### 機能ごとのキー

これらのキーは `image`、`video`、または `music` セクション内で適用されます。

| キー | 必須 | デフォルト | 説明 |
| ---------------------------- | -------- | -------- | ---------------------------------------------------------------------------- |
| `workflow` or `workflowPath` | Yes | -- | ComfyUI ワークフロー JSON ファイルへのパス。 |
| `promptNodeId` | Yes | -- | テキストプロンプトを受け取るノード ID。 |
| `promptInputName` | No | `"text"` | プロンプトノード上の入力名。 |
| `outputNodeId` | No | -- | 出力を読み取るノード ID。省略した場合、一致するすべての出力ノードが使われます。 |
| `pollIntervalMs` | No | -- | ジョブ完了を確認するためのポーリング間隔（ミリ秒）。 |
| `timeoutMs` | No | -- | ワークフロー実行のタイムアウト（ミリ秒）。 |

`image` および `video` セクションでは、以下もサポートされます。

| キー | 必須 | デフォルト | 説明 |
| --------------------- | ------------------------------------ | --------- | --------------------------------------------------- |
| `inputImageNodeId` | Yes (when passing a reference image) | -- | アップロードした参照画像を受け取るノード ID。 |
| `inputImageInputName` | No | `"image"` | 画像ノード上の入力名。 |

## ワークフローの詳細

<AccordionGroup>
  <Accordion title="Image workflows">
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

    アップロードした参照画像を使った画像編集を有効にするには、画像設定に `inputImageNodeId` を追加します。

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

  <Accordion title="Video workflows">
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
    OpenClaw は入力動画を Comfy ワークフローに渡しません。入力としてサポートされるのは、テキストプロンプトと単一の参照画像のみです。
    </Note>

  </Accordion>

  <Accordion title="Music workflows">
    同梱プラグインは、ワークフローで定義された音声または音楽出力向けの音楽生成 Provider を登録し、共有 `music_generate` ツールを通じて公開します。

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    `music` 設定セクションを使って、音声ワークフロー JSON と出力ノードを指定します。

  </Accordion>

  <Accordion title="Backward compatibility">
    既存のトップレベル画像設定（ネストされた `image` セクションなし）も引き続き動作します。

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

    OpenClaw はこのレガシー形式を画像ワークフロー設定として扱います。すぐに移行する必要はありませんが、新しいセットアップではネストされた `image` / `video` / `music` セクションを推奨します。

    <Tip>
    画像生成のみを使う場合、従来のフラット設定と新しいネストされた `image` セクションは機能的に同等です。
    </Tip>

  </Accordion>

  <Accordion title="ライブテスト">
    同梱プラグインにはオプトインのライブカバレッジがあります。

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    対応する Comfy ワークフローセクションが設定されていない限り、ライブテストは個々の画像、動画、または音楽のケースをスキップします。

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
    音楽および音声生成ツールのセットアップ。
  </Card>
  <Card title="Provider ディレクトリ" href="/ja-JP/providers/index" icon="layers">
    すべての Provider とモデル参照の概要。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/config-agents#agent-defaults" icon="gear">
    エージェントのデフォルト設定を含む完全な設定リファレンス。
  </Card>
</CardGroup>
