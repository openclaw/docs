---
read_when:
    - OpenClaw で Vydra のメディア生成を使いたい
    - Vydra APIキーのセットアップ手順が必要です
summary: OpenClaw で Vydra の画像、動画、音声を使用する
title: Vydra
x-i18n:
    generated_at: "2026-05-06T05:17:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e73121300fc3121124d15ecd285603032644c7d3886703776adc58c7115401a
    source_path: providers/vydra.md
    workflow: 16
---

バンドルされた Vydra plugin は次を追加します。

- `vydra/grok-imagine` による画像生成
- `vydra/veo3` と `vydra/kling` による動画生成
- Vydra の ElevenLabs backed TTS ルートによる音声合成

OpenClaw は 3 つの機能すべてに同じ `VYDRA_API_KEY` を使用します。

| プロパティ      | 値                                                                        |
| --------------- | ------------------------------------------------------------------------- |
| プロバイダー ID | `vydra`                                                                   |
| Plugin          | バンドル済み、`enabledByDefault: true`                                    |
| 認証 env var    | `VYDRA_API_KEY`                                                           |
| オンボーディングフラグ | `--auth-choice vydra-api-key`                                      |
| 直接 CLI フラグ | `--vydra-api-key <key>`                                                   |
| コントラクト    | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| ベース URL      | `https://www.vydra.ai/api/v1`（`www` ホストを使用）                       |

<Warning>
  ベース URL として `https://www.vydra.ai/api/v1` を使用してください。Vydra の apex ホスト（`https://vydra.ai/api/v1`）は現在 `www` にリダイレクトします。一部の HTTP クライアントは、このクロスホストリダイレクトで `Authorization` を削除するため、有効な API キーが紛らわしい認証失敗になります。バンドルされた plugin は、それを避けるために `www` ベース URL を直接使用します。
</Warning>

## セットアップ

<Steps>
  <Step title="対話型オンボーディングを実行する">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    または env var を直接設定します。

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="デフォルト機能を選択する">
    以下の機能（画像、動画、音声）の 1 つ以上を選び、対応する設定を適用します。
  </Step>
</Steps>

## 機能

<AccordionGroup>
  <Accordion title="画像生成">
    デフォルトの画像モデル:

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

    現在バンドルされているサポートは text-to-image のみです。Vydra のホスト型編集ルートはリモート画像 URL を想定しており、OpenClaw はバンドルされた plugin ではまだ Vydra 固有のアップロードブリッジを追加していません。

    <Note>
    共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[画像生成](/ja-JP/tools/image-generation)を参照してください。
    </Note>

  </Accordion>

  <Accordion title="動画生成">
    登録済み動画モデル:

    - text-to-video 用の `vydra/veo3`
    - image-to-video 用の `vydra/kling`

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

    注意:

    - `vydra/veo3` は text-to-video のみとしてバンドルされています。
    - `vydra/kling` は現在、リモート画像 URL 参照を必要とします。ローカルファイルのアップロードは事前に拒否されます。
    - Vydra の現在の `kling` HTTP ルートは、`image_url` と `video_url` のどちらを必要とするかについて一貫していません。バンドルされたプロバイダーは、同じリモート画像 URL を両方のフィールドにマッピングします。
    - バンドルされた plugin は保守的なままで、アスペクト比、解像度、ウォーターマーク、生成音声などの未文書化のスタイル調整項目を転送しません。

    <Note>
    共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[動画生成](/ja-JP/tools/video-generation)を参照してください。
    </Note>

  </Accordion>

  <Accordion title="動画ライブテスト">
    プロバイダー固有のライブカバレッジ:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    バンドルされた Vydra ライブファイルは現在、次をカバーしています。

    - `vydra/veo3` text-to-video
    - リモート画像 URL を使用する `vydra/kling` image-to-video

    必要に応じてリモート画像 fixture を上書きします。

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
    - ボイス ID: `21m00Tcm4TlvDq8ikWAM`

    バンドルされた plugin は現在、動作確認済みのデフォルトボイスを 1 つ公開し、MP3 音声ファイルを返します。

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
