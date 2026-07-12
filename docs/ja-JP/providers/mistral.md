---
read_when:
    - OpenClaw で Mistral モデルを使用する場合
    - Voice CallでVoxtralリアルタイム文字起こしを使用する場合
    - Mistral API キーのオンボーディングとモデル参照が必要です
summary: OpenClaw で Mistral モデルと Voxtral 文字起こしを使用する
title: Mistral
x-i18n:
    generated_at: "2026-07-12T14:51:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 58f27b9917d2e7144a64cad559de4fe26a5a1101703bbe21c04252717df801cd
    source_path: providers/mistral.md
    workflow: 16
---

バンドルされている `mistral` Plugin は、チャット補完、メディア理解（Voxtral バッチ文字起こし）、Voice Call 用リアルタイム STT（Voxtral Realtime）、メモリ埋め込み（`mistral-embed`）という 4 つのコントラクトを登録します。

| プロパティ       | 値                                          |
| ---------------- | ------------------------------------------- |
| プロバイダー ID  | `mistral`                                   |
| Plugin           | バンドル済み、デフォルトで有効              |
| 認証環境変数     | `MISTRAL_API_KEY`                           |
| オンボーディングフラグ | `--auth-choice mistral-api-key`        |
| 直接指定する CLI フラグ | `--mistral-api-key <key>`              |
| API              | OpenAI 互換（`openai-completions`）         |
| ベース URL       | `https://api.mistral.ai/v1`                 |
| デフォルトモデル | `mistral/mistral-large-latest`              |
| 埋め込みモデル   | `mistral-embed`                             |
| Voxtral バッチ   | `voxtral-mini-latest`（音声文字起こし）     |
| Voxtral リアルタイム | `voxtral-mini-transcribe-realtime-2602` |

## はじめに

<Steps>
  <Step title="API キーを取得する">
    [Mistral Console](https://console.mistral.ai/) で API キーを作成します。
  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    または、キーを直接渡します。

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

| モデル参照                       | 入力             | コンテキスト | 最大出力 | 備考                                                    |
| -------------------------------- | ---------------- | ------------ | -------- | ------------------------------------------------------- |
| `mistral/mistral-large-latest`   | テキスト、画像   | 262,144      | 16,384   | デフォルトモデル                                        |
| `mistral/mistral-medium-2508`    | テキスト、画像   | 262,144      | 8,192    | Mistral Medium 3.1                                      |
| `mistral/mistral-medium-3-5`     | テキスト、画像   | 262,144      | 8,192    | Mistral Medium 3.5、調整可能な推論                      |
| `mistral/mistral-small-latest`   | テキスト、画像   | 262,144      | 16,384   | 最新の Mistral Small 4、`reasoning_effort` を調整可能   |
| `mistral/mistral-small-2603`     | テキスト、画像   | 262,144      | 16,384   | バージョン固定の Mistral Small 4、`reasoning_effort` を調整可能 |
| `mistral/pixtral-large-latest`   | テキスト、画像   | 128,000      | 32,768   | Pixtral                                                 |
| `mistral/codestral-latest`       | テキスト         | 256,000      | 4,096    | コーディング                                            |
| `mistral/devstral-medium-latest` | テキスト         | 262,144      | 32,768   | Devstral 2                                              |
| `mistral/magistral-small`        | テキスト         | 128,000      | 40,000   | 推論対応                                                |

設定を変更する前に、バンドルされたカタログの行を確認してください。

```bash
openclaw models list --all --provider mistral --plain
```

Gateway を起動せずにモデルのスモークテストを行います。

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

## 音声文字起こし（Voxtral）

メディア理解パイプライン経由のバッチ音声文字起こしには Voxtral を使用します。

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

バンドルされている `mistral` Plugin は、Voxtral Realtime を Voice Call ストリーミング STT プロバイダーとして登録します。

| 設定         | 設定パス                                                               | デフォルト                              |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| API キー     | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | `MISTRAL_API_KEY` にフォールバック      |
| モデル       | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| エンコーディング | `...mistral.encoding`                                              | `pcm_mulaw`                             |
| サンプルレート | `...mistral.sampleRate`                                              | `8000`                                  |
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
OpenClaw は Mistral リアルタイム STT のデフォルトを 8 kHz の `pcm_mulaw` に設定し、Voice Call が Twilio メディアフレームを直接転送できるようにします。上流のストリームがすでに未加工 PCM である場合に限り、`encoding: "pcm_s16le"` と対応する `sampleRate` を使用してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="調整可能な推論">
    `mistral/mistral-small-latest`、`mistral/mistral-small-2603`、`mistral/mistral-medium-3-5` は、Chat Completions API で `reasoning_effort` を介した[調整可能な推論](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable)をサポートします（`none` は出力内の追加思考を最小限に抑え、`high` は最終回答の前に完全な思考トレースを表示します）。

    OpenClaw はセッションの **thinking** レベルを Mistral の API に次のようにマッピングします。

    | OpenClaw の thinking レベル                                           | Mistral `reasoning_effort` |
    | --------------------------------------------------------------------- | -------------------------- |
    | **off** / **minimal**                                                 | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`                     |

    <Warning>
    Medium 3.5 の推論モードと `temperature: 0` の併用は避けてください。Mistral HTTP API は、`reasoning_effort="high"` と `temperature: 0` の組み合わせを 400 レスポンスで拒否することが報告されています。低い temperature を設定する前に、temperature を未設定のままにするか、thinking を off/minimal にして OpenClaw が `reasoning_effort: "none"` を送信するようにしてください。
    </Warning>

    Medium 3.5 の推論用モデルスコープ設定例：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "mistral/mistral-medium-3-5" },
          models: {
            "mistral/mistral-medium-3-5": {
              params: { thinking: "high" },
            },
          },
        },
      },
    }
    ```

    <Note>
    その他のバンドル済み Mistral カタログモデルでは、このパラメーターを使用しません。Mistral のネイティブな推論優先動作が必要な場合は、引き続き `magistral-*` モデルを使用してください。
    </Note>

  </Accordion>

  <Accordion title="メモリ埋め込み">
    Mistral は `/v1/embeddings` を介してメモリ埋め込みを提供できます（デフォルトモデル：`mistral-embed`）。

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "mistral" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="認証とベース URL">
    - Mistral の認証では `MISTRAL_API_KEY`（Bearer ヘッダー）を使用します。
    - プロバイダーのベース URL はデフォルトで `https://api.mistral.ai/v1` となり、標準の OpenAI 互換チャット補完リクエスト形式を受け付けます。
    - オンボーディングのデフォルトモデルは `mistral/mistral-large-latest` です。
    - Mistral が必要なリージョンエンドポイントを明示的に公開している場合に限り、`models.providers.mistral.baseUrl` でベース URL を上書きしてください。

  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルの選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="メディア理解" href="/ja-JP/nodes/media-understanding" icon="microphone">
    音声文字起こしの設定とプロバイダーの選択。
  </Card>
</CardGroup>
