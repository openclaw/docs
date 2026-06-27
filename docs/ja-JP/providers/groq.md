---
read_when:
    - OpenClaw で Groq を使用する
    - APIキー環境変数またはCLI認証の選択肢が必要です
    - Groq で Whisper 音声文字起こしを設定しています
summary: Groq のセットアップ（認証 + モデル選択 + Whisper 文字起こし）
title: Groq
x-i18n:
    generated_at: "2026-06-27T12:44:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1133f2b1fa09e2e854b5762e189233597e86e8ccb2df8d619e891b4dc9c8d82
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) は、カスタム LPU ハードウェアを使用して、オープンウェイトモデル（Llama、Gemma、Kimi、Qwen、GPT OSS など）で超高速推論を提供します。Groq Plugin は、OpenAI 互換チャットプロバイダーと音声メディア理解プロバイダーの両方を登録します。

| プロパティ               | 値                                    |
| ---------------------- | ---------------------------------------- |
| プロバイダー id            | `groq`                                   |
| Plugin                 | 公式外部パッケージ                |
| 認証環境変数           | `GROQ_API_KEY`                           |
| API                    | OpenAI 互換（`openai-completions`） |
| ベース URL               | `https://api.groq.com/openai/v1`         |
| 音声文字起こし    | `whisper-large-v3-turbo`（デフォルト）       |
| 推奨チャットデフォルト | `groq/llama-3.3-70b-versatile`           |

## Pluginをインストール

公式 Plugin をインストールしてから、Gateway を再起動します。

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## はじめに

<Steps>
  <Step title="Get an API key">
    [console.groq.com/keys](https://console.groq.com/keys) で API キーを作成します。
  </Step>
  <Step title="Set the API key">
    ```bash
export GROQ_API_KEY=gsk_...
```
  </Step>
  <Step title="Set a default model">
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
  <Step title="Verify the catalog is reachable">
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

OpenClaw には、推論エントリと非推論エントリの両方を含む、マニフェストに基づく Groq カタログが同梱されています。インストール済みバージョンの静的行を確認するには `openclaw models list --provider groq` を実行し、Groq の正規リストについては [console.groq.com/docs/models](https://console.groq.com/docs/models) を確認してください。

| モデル参照                                        | 名前                    | 推論 | 入力        | コンテキスト |
| ------------------------------------------------ | ----------------------- | --------- | ------------ | ------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | いいえ        | テキスト         | 131,072 |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | いいえ        | テキスト         | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | いいえ        | テキスト + 画像 | 131,072 |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | はい       | テキスト         | 131,072 |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | はい       | テキスト         | 131,072 |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | はい       | テキスト         | 131,072 |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | はい       | テキスト         | 131,072 |
| `groq/groq/compound`                             | Compound                | はい       | テキスト         | 131,072 |
| `groq/groq/compound-mini`                        | Compound Mini           | はい       | テキスト         | 131,072 |

<Tip>
  カタログは OpenClaw の各リリースに合わせて進化します。`openclaw models list --provider groq` は、インストール済みバージョンが把握している行を表示します。新しく追加されたモデルや非推奨になったモデルについては、[console.groq.com/docs/models](https://console.groq.com/docs/models) と照合してください。
</Tip>

## 推論モデル

OpenClaw は、共有の `/think` レベルを Groq のモデル固有の `reasoning_effort` 値にマッピングします。

- `qwen/qwen3-32b` では、思考を無効にすると `none` を送信し、思考を有効にすると `default` を送信します。
- Groq GPT OSS 推論モデル（`openai/gpt-oss-*`）では、OpenClaw は `/think` レベルに基づいて `low`、`medium`、または `high` を送信します。これらのモデルは無効値をサポートしないため、思考を無効にした場合は `reasoning_effort` を省略します。
- DeepSeek R1 Distill、Qwen QwQ、Compound は Groq のネイティブ推論サーフェスを使用します。`/think` は可視性を制御しますが、モデルは常に推論します。

共有の `/think` レベルと、OpenClaw がプロバイダーごとにそれらを変換する方法については、[思考モード](/ja-JP/tools/thinking) を参照してください。

## 音声文字起こし

Groq の Plugin は **音声メディア理解プロバイダー** も登録するため、音声メッセージを共有の `tools.media.audio` サーフェスを通じて文字起こしできます。

| プロパティ           | 値                                     |
| ------------------ | ----------------------------------------- |
| 共有設定パス | `tools.media.audio`                       |
| デフォルトベース URL   | `https://api.groq.com/openai/v1`          |
| デフォルトモデル      | `whisper-large-v3-turbo`                  |
| 自動優先度      | 20                                        |
| API エンドポイント       | OpenAI 互換 `/audio/transcriptions` |

Groq をデフォルトの音声バックエンドにするには、次のようにします。

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
  <Accordion title="Environment availability for the daemon">
    Gateway が管理対象サービス（launchd、systemd、Docker）として実行される場合、`GROQ_API_KEY` はそのプロセスから見える必要があります。対話型シェルだけから見えても不十分です。

    <Warning>
      対話型シェルでのみエクスポートされたキーは、その環境もそこにインポートされていない限り、launchd や systemd のデーモンには役立ちません。gateway プロセスから読み取れるようにするには、`~/.openclaw/.env` または `env.shellEnv` 経由でキーを設定してください。
    </Warning>

  </Accordion>

  <Accordion title="Custom Groq model ids">
    OpenClaw は実行時に任意の Groq モデル id を受け付けます。Groq に表示される正確な id を使用し、`groq/` を接頭辞として付けてください。静的カタログは一般的なケースを対象とします。カタログにない id は、デフォルトの OpenAI 互換テンプレートにフォールスルーします。

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
  <Card title="Model providers" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作を選択します。
  </Card>
  <Card title="Thinking modes" href="/ja-JP/tools/thinking" icon="brain">
    推論エフォートレベルとプロバイダーポリシーの相互作用。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダーと音声設定を含む完全な設定スキーマ。
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq ダッシュボード、API ドキュメント、料金。
  </Card>
</CardGroup>
