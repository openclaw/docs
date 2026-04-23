---
read_when:
    - OpenClawでMistralモデルを使いたい場合
    - Voice Call向けにVoxtralリアルタイム文字起こしを使いたい場合
    - Mistral APIキーのオンボーディングとモデル参照が必要な場合
summary: OpenClawでMistralモデルとVoxtral文字起こしを使用する
title: Mistral
x-i18n:
    generated_at: "2026-04-23T14:07:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: cbf2f8926a1e8c877a12ea395e96622ff3b337ffa1368277c03abbfb881b18cf
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClawは、テキスト/画像モデルルーティング（`mistral/...`）と、
メディア理解におけるVoxtralによる音声文字起こしの両方でMistralをサポートします。
Mistralはメモリ埋め込みにも使用できます（`memorySearch.provider = "mistral"`）。

- Provider: `mistral`
- Auth: `MISTRAL_API_KEY`
- API: Mistral Chat Completions（`https://api.mistral.ai/v1`）

## はじめに

<Steps>
  <Step title="APIキーを取得する">
    [Mistral Console](https://console.mistral.ai/) でAPIキーを作成します。
  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    または、キーを直接渡します:

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

## 組み込みLLMカタログ

OpenClawには現在、次のMistralカタログがバンドルされています:

| Model ref                        | Input       | Context | Max output | Notes                                                            |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | text, image | 262,144 | 16,384     | デフォルトモデル                                                 |
| `mistral/mistral-medium-2508`    | text, image | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | text, image | 128,000 | 16,384     | Mistral Small 4; API `reasoning_effort` による推論調整が可能     |
| `mistral/pixtral-large-latest`   | text, image | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | text        | 256,000 | 4,096      | コーディング                                                     |
| `mistral/devstral-medium-latest` | text        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | text        | 128,000 | 40,000     | 推論対応                                                         |

## 音声文字起こし（Voxtral）

メディア理解パイプラインを通じたバッチ音声文字起こしにVoxtralを使用します。

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
メディア文字起こしパスは `/v1/audio/transcriptions` を使用します。Mistralのデフォルト音声モデルは `voxtral-mini-latest` です。
</Tip>

## Voice CallストリーミングSTT

バンドル済みの `mistral` Pluginは、Voice Call向けストリーミングSTTプロバイダーとしてVoxtral Realtimeを登録します。

| Setting      | Config path                                                            | Default                                 |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| API key      | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | `MISTRAL_API_KEY` へフォールバック      |
| Model        | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| Encoding     | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| Sample rate  | `...mistral.sampleRate`                                                | `8000`                                  |
| Target delay | `...mistral.targetStreamingDelayMs`                                    | `800`                                   |

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
OpenClawは、Voice CallがTwilioメディアフレームを直接転送できるよう、MistralリアルタイムSTTのデフォルトを8 kHzの `pcm_mulaw` に設定しています。上流ストリームがすでに生PCMである場合にのみ、`encoding: "pcm_s16le"` とそれに一致する `sampleRate` を使用してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="調整可能な推論（mistral-small-latest）">
    `mistral/mistral-small-latest` はMistral Small 4に対応し、Chat Completions APIで `reasoning_effort` を通じた[調整可能な推論](https://docs.mistral.ai/capabilities/reasoning/adjustable) をサポートします（`none` は出力内の追加思考を最小化し、`high` は最終回答の前に完全な思考トレースを表示します）。

    OpenClawは、セッションの **thinking** レベルをMistral APIへ次のように対応付けます:

    | OpenClaw thinking level                          | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    他のバンドル済みMistralカタログモデルはこのパラメーターを使用しません。Mistral本来の推論優先動作が必要な場合は、引き続き `magistral-*` モデルを使用してください。
    </Note>

  </Accordion>

  <Accordion title="メモリ埋め込み">
    Mistralは `/v1/embeddings` を通じてメモリ埋め込みを提供できます（デフォルトモデル: `mistral-embed`）。

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="認証とbase URL">
    - Mistral認証には `MISTRAL_API_KEY` を使用します。
    - プロバイダーのbase URLのデフォルトは `https://api.mistral.ai/v1` です。
    - オンボーディング時のデフォルトモデルは `mistral/mistral-large-latest` です。
    - Z.AIはAPIキーによるBearer認証を使用します。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、model ref、フェイルオーバー動作の選び方。
  </Card>
  <Card title="メディア理解" href="/ja-JP/nodes/media-understanding" icon="microphone">
    音声文字起こしの設定とプロバイダー選択。
  </Card>
</CardGroup>
