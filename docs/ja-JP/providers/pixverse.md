---
read_when:
    - OpenClawでPixVerseの動画生成を使用したい場合
    - PixVerse API キー/env の設定が必要です
    - PixVerse をデフォルトの動画プロバイダーにしたい
summary: OpenClawでのPixVerse動画生成セットアップ
title: PixVerse
x-i18n:
    generated_at: "2026-07-05T11:45:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 50204c771deb315e7336325f2852e4b65dfba4264bbe288b819d44b8def1ce82
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw は、ホスト型 PixVerse 動画生成用の公式外部Pluginとして `pixverse` を提供します。このPluginは、`videoGenerationProviders` コントラクトに対して `pixverse` プロバイダーを登録します。

| プロパティ       | 値                                                                   |
| ------------------ | -------------------------------------------------------------------- |
| プロバイダーID        | `pixverse`                                                           |
| Plugin パッケージ     | `@openclaw/pixverse-provider`                                        |
| 認証環境変数       | `PIXVERSE_API_KEY`                                                   |
| オンボーディングフラグ    | `--auth-choice pixverse-api-key`                                     |
| 直接 CLI フラグ    | `--pixverse-api-key <key>`                                           |
| API                | PixVerse Platform API v2（`video_id` 送信と結果ポーリング） |
| デフォルトモデル      | `pixverse/v6`                                                        |
| デフォルト API リージョン | International                                                        |

## はじめに

<Steps>
  <Step title="Pluginをインストールする">
    ```bash
    openclaw plugins install @openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="API キーを設定する">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    ウィザードは、プロバイダー設定に `region` と `baseUrl` を書き込む前に、International または CN エンドポイント（下記の API リージョンを参照）を確認します。
    非対話実行（`--pixverse-api-key` または `PIXVERSE_API_KEY` からキーを指定）は、デフォルトで International になります。

    オンボーディングは、デフォルトの動画モデルがまだ設定されていない場合、`agents.defaults.videoGenerationModel.primary` も `pixverse/v6` に設定します。

  </Step>
  <Step title="既存のデフォルト動画プロバイダーを切り替える（任意）">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="動画を生成する">
    エージェントに動画の生成を依頼します。PixVerse が自動的に使用されます。
  </Step>
</Steps>

## サポートされるモードとモデル

このプロバイダーは、OpenClaw の共有動画ツールを通じて PixVerse 生成モデルを公開します。

| モード           | モデル               | 参照入力         |
| -------------- | -------------------- | ----------------------- |
| テキストから動画  | `v6`（デフォルト）、`c1` | なし                    |
| 画像から動画 | `v6`（デフォルト）、`c1` | ローカルまたはリモート画像 1 件 |

ローカル画像参照は、画像から動画へのリクエストの前に PixVerse へアップロードされます。リモート画像 URL は、PixVerse の画像アップロードエンドポイントに `image_url` として渡されます。

| オプション          | サポートされる値                                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 長さ        | 1〜15 秒（デフォルト 5）                                                                                                         |
| 解像度      | `360P`、`540P`、`720P`、`1080P`（デフォルト `540P`。`480P` リクエストは `540P` にマッピングされます）                                                  |
| アスペクト比    | `16:9`（デフォルト）、`4:3`、`1:1`、`3:4`、`9:16`、`2:3`、`3:2`、`21:9`。テキストから動画のみ。画像から動画では元画像に従います |
| 生成音声 | `audio: true`                                                                                                                    |

<Note>
PixVerse 画像テンプレート生成は、まだ `image_generate` を通じて公開されていません。この API はテンプレート ID 駆動ですが、OpenClaw の共有画像生成コントラクトには現在 PixVerse 固有の型付きオプションバッグがありません。
</Note>

## プロバイダーオプション

動画プロバイダーは、以下の任意のプロバイダー固有キーを受け付けます。

| オプション                               | 型   | 効果                                        |
| ------------------------------------ | ------ | --------------------------------------------- |
| `seed`                               | number | 決定論的シード、0 から 2147483647           |
| `negativePrompt` / `negative_prompt` | string | ネガティブプロンプト                               |
| `quality`                            | string | `720p` などの PixVerse 品質               |
| `motionMode` / `motion_mode`         | string | 画像から動画へのモーションモード（デフォルト `normal`） |
| `cameraMovement` / `camera_movement` | string | PixVerse カメラ移動プリセット               |
| `templateId` / `template_id`         | number | 有効化された PixVerse テンプレート ID                |

## 設定

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "pixverse/v6",
      },
    },
  },
}
```

## 高度な設定

<AccordionGroup>
  <Accordion title="API リージョン">
    | リージョン値    | PixVerse API ベース URL                         |
    | --------------- | --------------------------------------------- |
    | `international` | `https://app-api.pixverse.ai/openapi/v2`      |
    | `cn`            | `https://app-api.pixverseai.cn/openapi/v2`    |

    キーが特定の PixVerse プラットフォームリージョンに属している場合は、`models.providers.pixverse.region` を手動で設定します。または、セットアップウィザードで選択するために `openclaw onboard --auth-choice pixverse-api-key` を実行します。

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            region: "cn", // "international" or "cn"
            baseUrl: "https://app-api.pixverseai.cn/openapi/v2",
            models: [],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="カスタムベース URL">
    信頼できる互換プロキシ経由でルーティングする場合にのみ、`models.providers.pixverse.baseUrl` を設定します。
    `baseUrl` は `region` より優先されます。

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            baseUrl: "https://app-api.pixverse.ai/openapi/v2",
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="タスクポーリング">
    PixVerse は生成リクエストから `video_id` を返します。OpenClaw は、タスクが成功、失敗、またはタイムアウト（デフォルト 5 分。`agents.defaults.videoGenerationModel.timeoutMs` で上書き可能）に達するまで、5 秒ごとに `/openapi/v2/video/result/{video_id}` をポーリングします。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有ツールのパラメーター、プロバイダー選択、非同期動作。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/config-agents#agent-defaults" icon="gear">
    動画生成モデルを含むエージェントのデフォルト設定。
  </Card>
</CardGroup>
