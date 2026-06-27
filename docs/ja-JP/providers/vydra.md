---
read_when:
    - OpenClawでVydraメディア生成を使いたい
    - Vydra API キーの設定ガイダンスが必要です
summary: OpenClaw で Vydra の画像、動画、音声を使用する
title: Vydra
x-i18n:
    generated_at: "2026-06-27T12:52:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb1128d877e06a274fe07c42282a7990c322e4d88d4232a1cac78e54deaf163
    source_path: providers/vydra.md
    workflow: 16
---

同梱の Vydra Plugin は次を追加します。

- `vydra/grok-imagine` による画像生成
- `vydra/veo3` と `vydra/kling` による動画生成
- Vydra の ElevenLabs バック TTS ルートによる音声合成

OpenClaw は 3 つの機能すべてに同じ `VYDRA_API_KEY` を使用します。

| プロパティ        | 値                                                                     |
| --------------- | ------------------------------------------------------------------------- |
| プロバイダー id     | `vydra`                                                                   |
| Plugin          | 同梱、`enabledByDefault: true`                                         |
| 認証環境変数    | `VYDRA_API_KEY`                                                           |
| オンボーディングフラグ | `--auth-choice vydra-api-key`                                             |
| 直接 CLI フラグ | `--vydra-api-key <key>`                                                   |
| コントラクト       | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| ベース URL        | `https://www.vydra.ai/api/v1`（`www` ホストを使用）                        |

<Warning>
  ベース URL には `https://www.vydra.ai/api/v1` を使用してください。Vydra の apex ホスト（`https://vydra.ai/api/v1`）は現在 `www` にリダイレクトします。一部の HTTP クライアントは、そのクロスホストリダイレクトで `Authorization` を削除するため、有効な API キーが誤解を招く認証失敗になります。同梱 Plugin はそれを避けるため、`www` ベース URL を直接使用します。
</Warning>

## セットアップ

<Steps>
  <Step title="対話型オンボーディングを実行">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    または環境変数を直接設定します。

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="デフォルト機能を選択">
    下記の機能（画像、動画、音声）のうち 1 つ以上を選び、対応する設定を適用します。
  </Step>
</Steps>

## 機能

<AccordionGroup>
  <Accordion title="画像生成">
    デフォルト画像モデル:

    - `vydra/grok-imagine`

    デフォルト画像プロバイダーとして設定します。

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

    現在の同梱サポートはテキストから画像のみです。Vydra のホスト型編集ルートはリモート画像 URL を想定しており、OpenClaw は同梱 Plugin ではまだ Vydra 固有のアップロードブリッジを追加していません。

    <Note>
    共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[画像生成](/ja-JP/tools/image-generation) を参照してください。
    </Note>

  </Accordion>

  <Accordion title="動画生成">
    登録済み動画モデル:

    - テキストから動画には `vydra/veo3`
    - 画像から動画には `vydra/kling`

    Vydra をデフォルト動画プロバイダーとして設定します。

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

    注意:

    - `vydra/veo3` はテキストから動画専用として同梱されています。
    - `vydra/kling` は現在、リモート画像 URL 参照を必要とします。ローカルファイルアップロードは事前に拒否されます。
    - Vydra の現在の `kling` HTTP ルートは、`image_url` と `video_url` のどちらを必要とするかが一貫していません。同梱プロバイダーは同じリモート画像 URL を両方のフィールドにマップします。
    - 同梱 Plugin は保守的に動作し、アスペクト比、解像度、ウォーターマーク、生成音声などの未文書化スタイルノブを転送しません。

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

    同梱 Vydra ライブファイルは現在、次をカバーしています。

    - `vydra/veo3` のテキストから動画
    - リモート画像 URL を使用する `vydra/kling` の画像から動画

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
              speakerVoiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    デフォルト:

    - モデル: `elevenlabs/tts`
    - 音声 id: `21m00Tcm4TlvDq8ikWAM`

    同梱 Plugin は現在、動作確認済みのデフォルト音声を 1 つ公開し、MP3 音声ファイルを返します。

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
    エージェントデフォルトとモデル設定。
  </Card>
</CardGroup>
