---
read_when:
    - OpenClaw で Vydra メディア生成を使いたい
    - Vydra API キーの設定ガイダンスが必要です
summary: OpenClaw で Vydra の画像、動画、音声を使用する
title: Vydra
x-i18n:
    generated_at: "2026-07-05T11:47:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e775bdd6f4ec7d1f5189910af450b92d8d6e831c17c338271afee962636ba69f
    source_path: providers/vydra.md
    workflow: 16
---

バンドルされた Vydra Plugin は以下を追加します。

- `vydra/grok-imagine` による画像生成
- `vydra/veo3`（テキストから動画）と `vydra/kling`（画像から動画）による動画生成
- Vydra の ElevenLabs バックエンド TTS ルートによる音声合成

OpenClaw は 3 つの機能すべてに同じ `VYDRA_API_KEY` を使用します。

| プロパティ        | 値                                                                     |
| --------------- | ------------------------------------------------------------------------- |
| プロバイダー ID     | `vydra`                                                                   |
| Plugin          | バンドル済み、`enabledByDefault: true`                                         |
| 認証環境変数    | `VYDRA_API_KEY`                                                           |
| オンボーディングフラグ | `--auth-choice vydra-api-key`                                             |
| 直接 CLI フラグ | `--vydra-api-key <key>`                                                   |
| コントラクト       | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| ベース URL        | `https://www.vydra.ai/api/v1`（`www` ホストを使用）                        |

<Warning>
ベース URL として `https://www.vydra.ai/api/v1` を使用してください。Vydra の apex ホスト（`https://vydra.ai/api/v1`）は現在 `www` にリダイレクトします。一部の HTTP クライアントは、このクロスホストリダイレクトで `Authorization` を削除するため、有効な API キーが誤解を招く認証失敗になります。バンドルされた Plugin は、設定された `vydra.ai` ベース URL を `www.vydra.ai` に正規化してこれを回避します。
</Warning>

## セットアップ

<Steps>
  <Step title="対話式オンボーディングを実行">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    または環境変数を直接設定します。

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="デフォルト機能を選択">
    以下の機能（画像、動画、または音声）の 1 つ以上を選び、対応する設定を適用します。
  </Step>
</Steps>

## 機能

<AccordionGroup>
  <Accordion title="画像生成">
    デフォルトかつ唯一のバンドル画像モデル:

    - `vydra/grok-imagine`

    これをデフォルトの画像プロバイダーとして設定します。

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

    バンドルされたサポートはテキストから画像のみで、リクエストあたり最大 1 枚の画像です。Vydra のホストされた編集ルートはリモート画像 URL を想定しており、バンドルされた Plugin は Vydra 固有のアップロードブリッジを追加しません。

    <Note>
    共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[画像生成](/ja-JP/tools/image-generation) を参照してください。
    </Note>

  </Accordion>

  <Accordion title="動画生成">
    登録済みの動画モデル:

    - `vydra/veo3`: テキストから動画（画像参照入力を拒否）
    - `vydra/kling`: 画像から動画（リモート画像 URL が正確に 1 つ必要）

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

    注記:

    - `vydra/kling` はローカルファイルのアップロードを事前に拒否します。機能するのはリモート画像 URL 参照のみです。
    - Vydra の `kling` HTTP ルートは、`image_url` が必要なのか `video_url` が必要なのかについて一貫していません。バンドルされたプロバイダーは、同じリモート画像 URL を両方のフィールドに送信します。
    - バンドルされた Plugin は保守的なままで、アスペクト比、解像度、透かし、生成音声などの未文書化のスタイル調整値を転送しません。

    <Note>
    共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[動画生成](/ja-JP/tools/video-generation) を参照してください。
    </Note>

  </Accordion>

  <Accordion title="動画ライブテスト">
    プロバイダー固有のライブカバレッジ:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    バンドルされた Vydra のライブファイルは以下をカバーします。

    - `vydra/veo3` テキストから動画
    - リモート画像 URL を使用した `vydra/kling` 画像から動画

    必要に応じてリモート画像フィクスチャを上書きします。

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

    デフォルト:

    - モデル: `elevenlabs/tts`
    - 音声 ID: `21m00Tcm4TlvDq8ikWAM`（「Rachel」）

    バンドルされた Plugin は、この 1 つの既知の良好なデフォルト音声を公開し、MP3 音声ファイルを返します。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="プロバイダーディレクトリ" href="/ja-JP/providers/index" icon="list">
    利用可能なすべてのプロバイダーを参照します。
  </Card>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共有画像ツールパラメーターとプロバイダー選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールパラメーターとプロバイダー選択。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/config-agents#agent-defaults" icon="gear">
    エージェントのデフォルトとモデル設定。
  </Card>
</CardGroup>
