---
read_when:
    - OpenClaw で Groq を使用したい場合
    - APIキーの環境変数またはCLI認証の選択が必要です
    - Groq で Whisper 音声文字起こしを設定しています
summary: Groq のセットアップ (認証 + モデル選択 + Whisper 文字起こし)
title: Groq
x-i18n:
    generated_at: "2026-05-06T05:16:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53ce6d702eb1e0abba0cf1efd3e86c766444f5e7cbf26c312b94a74fa410b700
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) は、カスタム LPU ハードウェアを使用して、オープンウェイトモデル (Llama、Gemma、Kimi、Qwen、GPT OSS など) で超高速推論を提供します。OpenClaw には、OpenAI 互換のチャットプロバイダーと音声メディア理解プロバイダーの両方を登録する、バンドル済みの Groq Plugin が含まれています。

| プロパティ           | 値                                       |
| ---------------------- | ---------------------------------------- |
| プロバイダー ID        | `groq`                                   |
| Plugin                 | バンドル済み、`enabledByDefault: true`   |
| 認証環境変数           | `GROQ_API_KEY`                           |
| オンボーディングフラグ | `--auth-choice groq-api-key`             |
| API                    | OpenAI 互換 (`openai-completions`)       |
| ベース URL             | `https://api.groq.com/openai/v1`         |
| 音声文字起こし         | `whisper-large-v3-turbo` (デフォルト)    |
| 推奨チャットデフォルト | `groq/llama-3.3-70b-versatile`           |

## はじめに

<Steps>
  <Step title="API キーを取得する">
    [console.groq.com/keys](https://console.groq.com/keys) で API キーを作成します。
  </Step>
  <Step title="API キーを設定する">
    <CodeGroup>

```bash オンボーディング
openclaw onboard --auth-choice groq-api-key
```

```bash 環境変数のみ
export GROQ_API_KEY=gsk_...
```

    </CodeGroup>

  </Step>
  <Step title="デフォルトモデルを設定する">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
  <Step title="カタログに到達できることを確認する">
    ```bash
    openclaw models list --provider groq
    ```
  </Step>
</Steps>

### 設定ファイルの例

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## 組み込みカタログ

OpenClaw は、推論ありと推論なしの両方の項目を含む、マニフェストに基づく Groq カタログを同梱しています。インストール済みバージョンにバンドルされている行を確認するには `openclaw models list --provider groq` を実行し、Groq の正式な一覧については [console.groq.com/docs/models](https://console.groq.com/docs/models) を確認してください。

| モデル参照                                           | 名前                          | 推論 | 入力         | コンテキスト |
| ---------------------------------------------------- | ----------------------------- | ---- | ------------ | ------------ |
| `groq/llama-3.3-70b-versatile`                       | Llama 3.3 70B Versatile       | なし | text         | 131,072      |
| `groq/llama-3.1-8b-instant`                          | Llama 3.1 8B Instant          | なし | text         | 131,072      |
| `groq/meta-llama/llama-4-maverick-17b-128e-instruct` | Llama 4 Maverick 17B          | なし | text + image | 131,072      |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct`     | Llama 4 Scout 17B             | なし | text + image | 131,072      |
| `groq/llama3-70b-8192`                               | Llama 3 70B                   | なし | text         | 8,192        |
| `groq/llama3-8b-8192`                                | Llama 3 8B                    | なし | text         | 8,192        |
| `groq/gemma2-9b-it`                                  | Gemma 2 9B                    | なし | text         | 8,192        |
| `groq/mistral-saba-24b`                              | Mistral Saba 24B              | なし | text         | 32,768       |
| `groq/moonshotai/kimi-k2-instruct`                   | Kimi K2 Instruct              | なし | text         | 131,072      |
| `groq/moonshotai/kimi-k2-instruct-0905`              | Kimi K2 Instruct 0905         | なし | text         | 262,144      |
| `groq/openai/gpt-oss-120b`                           | GPT OSS 120B                  | あり | text         | 131,072      |
| `groq/openai/gpt-oss-20b`                            | GPT OSS 20B                   | あり | text         | 131,072      |
| `groq/openai/gpt-oss-safeguard-20b`                  | Safety GPT OSS 20B            | あり | text         | 131,072      |
| `groq/qwen-qwq-32b`                                  | Qwen QwQ 32B                  | あり | text         | 131,072      |
| `groq/qwen/qwen3-32b`                                | Qwen3 32B                     | あり | text         | 131,072      |
| `groq/deepseek-r1-distill-llama-70b`                 | DeepSeek R1 Distill Llama 70B | あり | text         | 131,072      |
| `groq/groq/compound`                                 | Compound                      | あり | text         | 131,072      |
| `groq/groq/compound-mini`                            | Compound Mini                 | あり | text         | 131,072      |

<Tip>
  カタログは OpenClaw の各リリースに合わせて進化します。`openclaw models list --provider groq` は、インストール済みバージョンが認識している行を表示します。新しく追加されたモデルや非推奨になったモデルについては [console.groq.com/docs/models](https://console.groq.com/docs/models) と照合してください。
</Tip>

## 推論モデル

OpenClaw は共有の `/think` レベルを Groq のモデル固有の `reasoning_effort` 値にマッピングします。

- `qwen/qwen3-32b` では、思考を無効にすると `none` を送信し、思考を有効にすると `default` を送信します。
- Groq GPT OSS 推論モデル (`openai/gpt-oss-*`) では、OpenClaw は `/think` レベルに基づいて `low`、`medium`、または `high` を送信します。これらのモデルは無効値をサポートしないため、思考を無効にすると `reasoning_effort` は省略されます。
- DeepSeek R1 Distill、Qwen QwQ、Compound は Groq のネイティブな推論サーフェスを使用します。`/think` は可視性を制御しますが、モデルは常に推論します。

共有の `/think` レベルと、OpenClaw がプロバイダーごとにそれらをどのように変換するかについては、[思考モード](/ja-JP/tools/thinking) を参照してください。

## 音声文字起こし

Groq のバンドル済み Plugin は **音声メディア理解プロバイダー** も登録するため、音声メッセージを共有の `tools.media.audio` サーフェス経由で文字起こしできます。

| プロパティ       | 値                                        |
| ------------------ | ----------------------------------------- |
| 共有設定パス       | `tools.media.audio`                       |
| デフォルトベース URL | `https://api.groq.com/openai/v1`          |
| デフォルトモデル   | `whisper-large-v3-turbo`                  |
| 自動優先度         | 20                                        |
| API エンドポイント | OpenAI 互換 `/audio/transcriptions`       |

Groq をデフォルトの音声バックエンドにするには:

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="デーモンでの環境の可用性">
    Gateway が管理サービス (launchd、systemd、Docker) として実行される場合、`GROQ_API_KEY` は対話型シェルだけでなく、そのプロセスから見える必要があります。

    <Warning>
      `~/.profile` にのみ置かれたキーは、その環境がそこにもインポートされていない限り、launchd や systemd デーモンには役立ちません。Gateway プロセスから読み取れるようにするには、キーを `~/.openclaw/.env` または `env.shellEnv` 経由で設定してください。
    </Warning>

  </Accordion>

  <Accordion title="カスタム Groq モデル ID">
    OpenClaw は実行時に任意の Groq モデル ID を受け入れます。Groq が表示する正確な ID を使用し、先頭に `groq/` を付けてください。バンドル済みカタログは一般的なケースをカバーします。カタログにない ID はデフォルトの OpenAI 互換テンプレートにフォールスルーします。

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/<your-model-id>" },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="思考モード" href="/ja-JP/tools/thinking" icon="brain">
    推論エフォートレベルとプロバイダーポリシーの相互作用。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダーと音声設定を含む完全な設定スキーマ。
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq ダッシュボード、API ドキュメント、価格。
  </Card>
</CardGroup>
