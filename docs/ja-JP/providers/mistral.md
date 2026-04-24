---
read_when:
    - OpenClaw で Mistral モデルを使いたい場合
    - Voice Call 向けに Voxtral realtime transcription を使いたい場合
    - Mistral API キーのオンボーディングと model ref が必要です
summary: OpenClaw で Mistral モデルと Voxtral transcription を使う
title: Mistral
x-i18n:
    generated_at: "2026-04-24T05:15:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63e1eb462f836f5ddc1afd0d01954080eee461230924368d77e2e57fef12caf1
    source_path: providers/mistral.md
    workflow: 15
---

OpenClaw は、テキスト/画像モデルルーティング（`mistral/...`）と、
media understanding における Voxtral 音声 transcription の両方で Mistral をサポートしています。
Mistral は memory embeddings（`memorySearch.provider = "mistral"`）にも使用できます。

- Provider: `mistral`
- Auth: `MISTRAL_API_KEY`
- API: Mistral Chat Completions（`https://api.mistral.ai/v1`）

## はじめに

<Steps>
  <Step title="API キーを取得する">
    [Mistral Console](https://console.mistral.ai/) で API キーを作成します。
  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    またはキーを直接渡します:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="デフォルトモデルを設定する">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="モデルが利用可能か確認する">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## 組み込み LLM カタログ

OpenClaw は現在、次のバンドル済み Mistral カタログを同梱しています。

| Model ref | Input | Context | Max output | Notes |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | text, image | 262,144 | 16,384     | デフォルトモデル |
| `mistral/mistral-medium-2508`    | text, image | 262,144 | 8,192      | Mistral Medium 3.1 |
| `mistral/mistral-small-latest`   | text, image | 128,000 | 16,384     | Mistral Small 4。API の `reasoning_effort` による adjustable reasoning をサポート |
| `mistral/pixtral-large-latest`   | text, image | 128,000 | 32,768     | Pixtral |
| `mistral/codestral-latest`       | text        | 256,000 | 4,096      | Coding |
| `mistral/devstral-medium-latest` | text        | 262,144 | 32,768     | Devstral 2 |
| `mistral/magistral-small`        | text        | 128,000 | 40,000     | reasoning 対応 |

## 音声 transcription（Voxtral）

media understanding
パイプライン経由のバッチ音声 transcription に Voxtral を使用します。

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
media transcription 経路は `/v1/audio/transcriptions` を使用します。Mistral のデフォルト音声モデルは `voxtral-mini-latest` です。
</Tip>

## Voice Call ストリーミング STT

バンドル済み `mistral` Plugin は、Voxtral Realtime を Voice Call
ストリーミング STT プロバイダーとして登録します。

| Setting | Config path | Default |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| API key | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | `MISTRAL_API_KEY` にフォールバック |
| Model | `...mistral.model` | `voxtral-mini-transcribe-realtime-2602` |
| Encoding | `...mistral.encoding` | `pcm_mulaw` |
| Sample rate | `...mistral.sampleRate` | `8000` |
| Target delay | `...mistral.targetStreamingDelayMs` | `800` |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "mistral",
            providers: {
              mistral: {
                apiKey: "${MISTRAL_API_KEY}",
                targetStreamingDelayMs: 800,
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
OpenClaw は、Voice Call が Twilio media frame を直接転送できるように、
Mistral realtime STT のデフォルトを 8 kHz の `pcm_mulaw` にしています。上流ストリームがすでに raw PCM の場合にのみ、
`encoding: "pcm_s16le"` と一致する `sampleRate` を使用してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="Adjustable reasoning（mistral-small-latest）">
    `mistral/mistral-small-latest` は Mistral Small 4 に対応し、Chat Completions API で
    `reasoning_effort` を介した [adjustable reasoning](https://docs.mistral.ai/capabilities/reasoning/adjustable) をサポートします（`none` は出力内の追加 thinking を最小化し、`high` は最終回答前に完全な thinking trace を表面化します）。

    OpenClaw は、セッションの **thinking** レベルを Mistral の API にマップします:

    | OpenClaw thinking level | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal** | `none` |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high` |

    <Note>
    その他のバンドル済み Mistral カタログモデルはこのパラメーターを使用しません。Mistral のネイティブな reasoning-first 挙動が欲しい場合は、引き続き `magistral-*` モデルを使用してください。
    </Note>

  </Accordion>

  <Accordion title="memory embeddings">
    Mistral は `/v1/embeddings` 経由で memory embeddings を提供できます（デフォルトモデル: `mistral-embed`）。

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="認証と base URL">
    - Mistral 認証は `MISTRAL_API_KEY` を使用します。
    - Provider base URL のデフォルトは `https://api.mistral.ai/v1` です。
    - オンボーディングのデフォルトモデルは `mistral/mistral-large-latest` です。
    - Z.AI は API キーによる Bearer 認証を使用します。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、model ref、フェイルオーバー挙動の選び方。
  </Card>
  <Card title="メディア理解" href="/ja-JP/nodes/media-understanding" icon="microphone">
    音声 transcription のセットアップとプロバイダー選択。
  </Card>
</CardGroup>
