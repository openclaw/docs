---
read_when:
    - OpenClawでVydraのメディア生成を使いたい
    - Vydra API keyのセットアップガイダンスが必要です
summary: OpenClawでVydraの画像、動画、音声を使う
title: Vydra
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T05:17:32Z"
  model: gpt-5.4
  provider: openai
  source_hash: 85420c3f337c13313bf571d5ee92c1f1988ff8119d401e7ec0ea0db1e74d9b69
  source_path: providers/vydra.md
  workflow: 15
---

バンドル済みのVydra Pluginは次を追加します:

- `vydra/grok-imagine` による画像生成
- `vydra/veo3` と `vydra/kling` による動画生成
- VydraのElevenLabsバックエンドTTSルートによる音声合成

OpenClawは、この3つのcapabilityすべてに同じ `VYDRA_API_KEY` を使います。

<Warning>
base URLには `https://www.vydra.ai/api/v1` を使ってください。

Vydraのapex host（`https://vydra.ai/api/v1`）は現在 `www` にリダイレクトします。一部のHTTPクライアントは、そのクロスホストリダイレクトで `Authorization` を落としてしまうため、有効なAPI keyが誤解を招くauth failureに変わります。バンドル済みPluginは、これを避けるために `www` のbase URLを直接使います。
</Warning>

## セットアップ

<Steps>
  <Step title="対話型オンボーディングを実行する">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    または、env varを直接設定します:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="デフォルトcapabilityを選ぶ">
    以下のcapability（画像、動画、または音声）から1つ以上を選び、一致する設定を適用してください。
  </Step>
</Steps>

## Capability

<AccordionGroup>
  <Accordion title="画像生成">
    デフォルト画像モデル:

    - `vydra/grok-imagine`

    デフォルト画像プロバイダとして設定します:

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

    現在のバンドル済みサポートは text-to-image のみです。Vydraのホスト型edit routeはリモート画像URLを期待しており、OpenClawはまだバンドル済みPlugin内にVydra固有のupload bridgeを追加していません。

    <Note>
    共有ツールパラメータ、プロバイダ選択、フェイルオーバー動作については [画像生成](/ja-JP/tools/image-generation) を参照してください。
    </Note>

  </Accordion>

  <Accordion title="動画生成">
    登録済み動画モデル:

    - text-to-video 用の `vydra/veo3`
    - image-to-video 用の `vydra/kling`

    Vydraをデフォルト動画プロバイダとして設定します:

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

    - `vydra/veo3` は、バンドル済みでは text-to-video のみです。
    - `vydra/kling` は現在、リモート画像URL参照を必要とします。ローカルファイルuploadは事前に拒否されます。
    - Vydraの現在の `kling` HTTP routeは、`image_url` と `video_url` のどちらを要求するかが一貫していません。バンドル済みプロバイダは、同じリモート画像URLを両方のフィールドにマッピングします。
    - バンドル済みPluginは保守的に振る舞い、アスペクト比、解像度、ウォーターマーク、生成音声のような未文書化スタイルノブは転送しません。

    <Note>
    共有ツールパラメータ、プロバイダ選択、フェイルオーバー動作については [動画生成](/ja-JP/tools/video-generation) を参照してください。
    </Note>

  </Accordion>

  <Accordion title="動画ライブテスト">
    プロバイダ固有のライブカバレッジ:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    バンドル済みVydraライブファイルは現在、次をカバーします:

    - `vydra/veo3` の text-to-video
    - リモート画像URLを使う `vydra/kling` の image-to-video

    必要に応じて、リモート画像fixtureを上書きします:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="音声合成">
    音声プロバイダとしてVydraを設定します:

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
    - Voice id: `21m00Tcm4TlvDq8ikWAM`

    バンドル済みPluginは現在、1つの既知の正常動作するデフォルトvoiceを公開し、MP3音声ファイルを返します。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="プロバイダディレクトリ" href="/ja-JP/providers/index" icon="list">
    利用可能なすべてのプロバイダを参照する。
  </Card>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共有画像ツールパラメータとプロバイダ選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールパラメータとプロバイダ選択。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/config-agents#agent-defaults" icon="gear">
    エージェントデフォルトとモデル設定。
  </Card>
</CardGroup>
