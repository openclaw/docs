---
read_when:
    - OpenClaw で Mistral モデルを使いたい
    - 音声通話でVoxtralのリアルタイム文字起こしを使用したい
    - Mistral APIキーのオンボーディングとモデル参照が必要です
summary: OpenClaw で Mistral モデルと Voxtral 文字起こしを使用する
title: Mistral
x-i18n:
    generated_at: "2026-04-30T05:31:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fdba72a5a526bed78ef3a6ea633839634efca3f9d2e96b305315d534d115122
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw はテキスト/画像モデルルーティング（`mistral/...`）と、メディア理解における Voxtral による
音声文字起こしの両方で Mistral をサポートしています。
Mistral はメモリ埋め込み（`memorySearch.provider = "mistral"`）にも使用できます。

- プロバイダー: `mistral`
- 認証: `MISTRAL_API_KEY`
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

    またはキーを直接渡します。

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
  <Step title="モデルが利用可能であることを確認する">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## 組み込み LLM カタログ

OpenClaw には現在、この Mistral カタログが同梱されています。

| モデル参照                       | 入力        | コンテキスト | 最大出力   | 注記                                                             |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | テキスト, 画像 | 262,144 | 16,384     | デフォルトモデル                                                 |
| `mistral/mistral-medium-2508`    | テキスト, 画像 | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | テキスト, 画像 | 128,000 | 16,384     | Mistral Small 4、API `reasoning_effort` による調整可能な推論 |
| `mistral/pixtral-large-latest`   | テキスト, 画像 | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | テキスト        | 256,000 | 4,096      | コーディング                                                     |
| `mistral/devstral-medium-latest` | テキスト        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | テキスト        | 128,000 | 40,000     | 推論対応                                                         |

## 音声文字起こし（Voxtral）

メディア理解パイプラインを通じたバッチ音声文字起こしには Voxtral を使用します。

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
メディア文字起こしパスは `/v1/audio/transcriptions` を使用します。Mistral のデフォルト音声モデルは `voxtral-mini-latest` です。
</Tip>

## Voice Call ストリーミング STT

同梱の `mistral` plugin は、Voxtral Realtime を Voice Call
ストリーミング STT プロバイダーとして登録します。

| 設定         | 設定パス                                                               | デフォルト                              |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| API キー     | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | `MISTRAL_API_KEY` にフォールバック      |
| モデル       | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| エンコーディング | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| サンプルレート | `...mistral.sampleRate`                                                | `8000`                                  |
| 目標遅延     | `...mistral.targetStreamingDelayMs`                                    | `800`                                   |

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
OpenClaw は、Voice Call が Twilio メディアフレームを直接転送できるように、Mistral リアルタイム STT のデフォルトを 8 kHz の `pcm_mulaw` に設定します。上流ストリームがすでに生 PCM の場合にのみ、`encoding: "pcm_s16le"` と一致する `sampleRate` を使用してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="調整可能な推論（mistral-small-latest）">
    `mistral/mistral-small-latest` は Mistral Small 4 にマッピングされ、Chat Completions API 上で `reasoning_effort` を介した [調整可能な推論](https://docs.mistral.ai/capabilities/reasoning/adjustable) をサポートします（`none` は出力内の追加思考を最小化し、`high` は最終回答の前に完全な思考トレースを表示します）。

    OpenClaw はセッションの **thinking** レベルを Mistral の API にマッピングします。

    | OpenClaw thinking レベル                         | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    他の同梱 Mistral カタログモデルはこのパラメーターを使用しません。Mistral のネイティブな推論優先の動作が必要な場合は、引き続き `magistral-*` モデルを使用してください。
    </Note>

  </Accordion>

  <Accordion title="メモリ埋め込み">
    Mistral は `/v1/embeddings` を介してメモリ埋め込みを提供できます（デフォルトモデル: `mistral-embed`）。

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="認証とベース URL">
    - Mistral 認証は `MISTRAL_API_KEY` を使用します。
    - プロバイダーのベース URL はデフォルトで `https://api.mistral.ai/v1` です。
    - オンボーディングのデフォルトモデルは `mistral/mistral-large-latest` です。
    - Z.AI は API キーによる Bearer 認証を使用します。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="メディア理解" href="/ja-JP/nodes/media-understanding" icon="microphone">
    音声文字起こしの設定とプロバイダー選択。
  </Card>
</CardGroup>
