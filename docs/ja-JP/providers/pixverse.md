---
read_when:
    - OpenClawでPixVerseの動画生成を使用する場合
    - PixVerse API キーと環境変数の設定が必要です
    - PixVerse をデフォルトの動画プロバイダーにする場合
summary: OpenClawでのPixVerse動画生成のセットアップ
title: PixVerse
x-i18n:
    generated_at: "2026-07-11T22:38:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 50204c771deb315e7336325f2852e4b65dfba4264bbe288b819d44b8def1ce82
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw は、ホスト型 PixVerse 動画生成向けの公式外部 Plugin として `pixverse` を提供します。この Plugin は、`videoGenerationProviders` コントラクトに `pixverse` プロバイダーを登録します。

| プロパティ             | 値                                                                   |
| ---------------------- | -------------------------------------------------------------------- |
| プロバイダー ID        | `pixverse`                                                           |
| Plugin パッケージ      | `@openclaw/pixverse-provider`                                        |
| 認証環境変数           | `PIXVERSE_API_KEY`                                                   |
| オンボーディングフラグ | `--auth-choice pixverse-api-key`                                     |
| 直接指定 CLI フラグ    | `--pixverse-api-key <key>`                                           |
| API                    | PixVerse Platform API v2（`video_id` の送信と結果のポーリング）      |
| デフォルトモデル       | `pixverse/v6`                                                        |
| デフォルト API リージョン | 国際版                                                            |

## はじめに

<Steps>
  <Step title="Plugin をインストールする">
    ```bash
    openclaw plugins install @openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="API キーを設定する">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    ウィザードは、プロバイダー設定に `region` と `baseUrl` を書き込む前に、国際版または中国版のエンドポイント（下記の API リージョンを参照）を選択するよう求めます。
    非対話実行（`--pixverse-api-key` または `PIXVERSE_API_KEY` からキーを取得する場合）では、デフォルトで国際版が使用されます。

    オンボーディングでは、デフォルトの動画モデルがまだ設定されていない場合、`agents.defaults.videoGenerationModel.primary` も `pixverse/v6` に設定されます。

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

## 対応モードとモデル

このプロバイダーは、OpenClaw の共有動画ツールを通じて PixVerse の生成モデルを公開します。

| モード         | モデル               | 参照入力                     |
| -------------- | -------------------- | ---------------------------- |
| テキストから動画 | `v6`（デフォルト）、`c1` | なし                       |
| 画像から動画   | `v6`（デフォルト）、`c1` | ローカルまたはリモート画像 1 枚 |

ローカル画像の参照は、画像から動画への変換リクエストの前に PixVerse へアップロードされます。リモート画像の URL は、`image_url` として PixVerse の画像アップロードエンドポイントに渡されます。

| オプション     | 対応値                                                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 長さ           | 1～15 秒（デフォルトは 5 秒）                                                                                                |
| 解像度         | `360P`、`540P`、`720P`、`1080P`（デフォルトは `540P`。`480P` のリクエストは `540P` にマッピング）                           |
| アスペクト比   | `16:9`（デフォルト）、`4:3`、`1:1`、`3:4`、`9:16`、`2:3`、`3:2`、`21:9`。テキストから動画の場合のみ。画像から動画では元画像に従う |
| 生成音声       | `audio: true`                                                                                                                |

<Note>
PixVerse の画像テンプレート生成は、まだ `image_generate` を通じて公開されていません。この API はテンプレート ID に基づいて動作しますが、OpenClaw の共有画像生成コントラクトには現在、PixVerse 固有の型付きオプション群がありません。
</Note>

## プロバイダーオプション

動画プロバイダーは、次のプロバイダー固有のキーを任意で受け付けます。

| オプション                           | 型     | 効果                                              |
| ------------------------------------ | ------ | ------------------------------------------------- |
| `seed`                               | 数値   | 決定論的シード（0～2147483647）                   |
| `negativePrompt` / `negative_prompt` | 文字列 | ネガティブプロンプト                              |
| `quality`                            | 文字列 | `720p` などの PixVerse 品質                       |
| `motionMode` / `motion_mode`         | 文字列 | 画像から動画へのモーションモード（デフォルトは `normal`） |
| `cameraMovement` / `camera_movement` | 文字列 | PixVerse のカメラ移動プリセット                   |
| `templateId` / `template_id`         | 数値   | 有効化する PixVerse テンプレート ID               |

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

## 詳細設定

<AccordionGroup>
  <Accordion title="API リージョン">
    | リージョン値    | PixVerse API ベース URL                       |
    | --------------- | --------------------------------------------- |
    | `international` | `https://app-api.pixverse.ai/openapi/v2`      |
    | `cn`            | `https://app-api.pixverseai.cn/openapi/v2`    |

    キーが特定の PixVerse プラットフォームリージョンに属している場合は、`models.providers.pixverse.region` を手動で設定します。または、`openclaw onboard --auth-choice pixverse-api-key` を実行し、セットアップウィザードでリージョンを選択します。

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
    信頼できる互換プロキシを経由してルーティングする場合に限り、`models.providers.pixverse.baseUrl` を設定します。
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

  <Accordion title="タスクのポーリング">
    PixVerse は、生成リクエストから `video_id` を返します。OpenClaw は、タスクが成功、失敗、またはタイムアウトに達するまで、5 秒ごとに `/openapi/v2/video/result/{video_id}` をポーリングします（デフォルトは 5 分。`agents.defaults.videoGenerationModel.timeoutMs` で上書きできます）。
  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有ツールのパラメーター、プロバイダーの選択、非同期動作。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/config-agents#agent-defaults" icon="gear">
    動画生成モデルを含むエージェントのデフォルト設定。
  </Card>
</CardGroup>
