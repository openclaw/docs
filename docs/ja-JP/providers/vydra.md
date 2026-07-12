---
read_when:
    - OpenClaw で Vydra メディア生成を利用したい場合
    - Vydra APIキーの設定ガイダンスが必要です
summary: OpenClaw で Vydra の画像、動画、音声を使用する
title: Vydra
x-i18n:
    generated_at: "2026-07-11T22:39:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e775bdd6f4ec7d1f5189910af450b92d8d6e831c17c338271afee962636ba69f
    source_path: providers/vydra.md
    workflow: 16
---

バンドル済みの Vydra Plugin は次の機能を追加します。

- `vydra/grok-imagine` による画像生成
- `vydra/veo3`（テキストから動画）および `vydra/kling`（画像から動画）による動画生成
- Vydra の ElevenLabs ベースの TTS ルートによる音声合成

OpenClaw は、3 つの機能すべてに同じ `VYDRA_API_KEY` を使用します。

| プロパティ             | 値                                                                        |
| ---------------------- | ------------------------------------------------------------------------- |
| プロバイダー ID        | `vydra`                                                                   |
| Plugin                 | バンドル済み、`enabledByDefault: true`                                    |
| 認証環境変数           | `VYDRA_API_KEY`                                                           |
| オンボーディングフラグ | `--auth-choice vydra-api-key`                                             |
| 直接指定する CLI フラグ | `--vydra-api-key <key>`                                                   |
| コントラクト           | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| ベース URL             | `https://www.vydra.ai/api/v1`（`www` ホストを使用）                       |

<Warning>
ベース URL には `https://www.vydra.ai/api/v1` を使用してください。Vydra の apex ホスト（`https://vydra.ai/api/v1`）は現在 `www` にリダイレクトされます。一部の HTTP クライアントは、このホストをまたぐリダイレクト時に `Authorization` を削除するため、有効な API キーでも誤解を招く認証エラーになります。これを回避するため、バンドル済み Plugin は、設定された `vydra.ai` のベース URL を `www.vydra.ai` に正規化します。
</Warning>

## セットアップ

<Steps>
  <Step title="対話形式のオンボーディングを実行する">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    または、環境変数を直接設定します。

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="デフォルトの機能を選択する">
    以下の機能（画像、動画、音声）から 1 つ以上を選び、対応する設定を適用します。
  </Step>
</Steps>

## 機能

<AccordionGroup>
  <Accordion title="画像生成">
    デフォルトかつ唯一のバンドル済み画像モデル：

    - `vydra/grok-imagine`

    デフォルトの画像プロバイダーとして設定します。

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "vydra/grok-imagine",
          },
        },
      },
    }
    ```

    バンドル済みのサポートはテキストから画像への生成のみで、リクエストごとに最大 1 枚の画像を生成します。Vydra のホスト型編集ルートではリモート画像 URL が必要であり、バンドル済み Plugin は Vydra 固有のアップロードブリッジを追加しません。

    <Note>
    共通のツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[画像生成](/ja-JP/tools/image-generation)を参照してください。
    </Note>

  </Accordion>

  <Accordion title="動画生成">
    登録済みの動画モデル：

    - テキストから動画を生成する `vydra/veo3`（画像参照入力は拒否）
    - 画像から動画を生成する `vydra/kling`（リモート画像 URL が 1 つだけ必要）

    Vydra をデフォルトの動画プロバイダーとして設定します。

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "vydra/veo3",
          },
        },
      },
    }
    ```

    注記：

    - `vydra/kling` はローカルファイルのアップロードを事前に拒否します。使用できるのはリモート画像 URL 参照のみです。
    - Vydra の `kling` HTTP ルートでは、`image_url` と `video_url` のどちらが必須かについて一貫性がないため、バンドル済みプロバイダーは両方のフィールドに同じリモート画像 URL を送信します。
    - バンドル済み Plugin は保守的な動作を維持し、アスペクト比、解像度、透かし、生成音声など、文書化されていないスタイル調整項目を転送しません。

    <Note>
    共通のツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[動画生成](/ja-JP/tools/video-generation)を参照してください。
    </Note>

  </Accordion>

  <Accordion title="動画のライブテスト">
    プロバイダー固有のライブテスト範囲：

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    バンドル済みの Vydra ライブテストファイルでは、次の内容を検証します。

    - `vydra/veo3` によるテキストから動画への生成
    - リモート画像 URL を使用した `vydra/kling` による画像から動画への生成

    必要に応じて、リモート画像のフィクスチャを上書きします。

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="音声合成">
    Vydra を音声プロバイダーとして設定します。

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              voiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    デフォルト：

    - モデル：`elevenlabs/tts`
    - 音声 ID：`21m00Tcm4TlvDq8ikWAM`（「Rachel」）

    バンドル済み Plugin は、正常動作が確認されているこの 1 つのデフォルト音声を公開し、MP3 音声ファイルを返します。

  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="プロバイダーディレクトリ" href="/ja-JP/providers/index" icon="list">
    利用可能なすべてのプロバイダーを確認します。
  </Card>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共通の画像ツールパラメーターとプロバイダー選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共通の動画ツールパラメーターとプロバイダー選択。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/config-agents#agent-defaults" icon="gear">
    エージェントのデフォルト設定とモデル設定。
  </Card>
</CardGroup>
