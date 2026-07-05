---
read_when:
    - OpenClawでGroqを使用する
    - APIキーの環境変数またはCLI認証の選択が必要です
    - Groq で Whisper 音声文字起こしを設定しています
summary: Groq セットアップ（認証 + モデル選択 + Whisper 文字起こし）
title: Groq
x-i18n:
    generated_at: "2026-07-05T11:44:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f04f9365127c72aa2f976f453e5d11657b19d6b4a57de1179b88924744db1dc1
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) は、カスタム LPU ハードウェアを使用して、オープンウェイトモデル（Llama、Gemma、Kimi、Qwen、GPT OSS など）で超高速推論を提供します。Groq Plugin は、OpenAI 互換のチャットプロバイダーと音声メディア理解プロバイダーの両方を登録します。

| プロパティ           | 値                                       |
| ---------------------- | ---------------------------------------- |
| プロバイダーID       | `groq`                                   |
| Plugin                 | 公式外部パッケージ                       |
| 認証 env var           | `GROQ_API_KEY`                           |
| API                    | OpenAI 互換（`openai-completions`）      |
| ベースURL              | `https://api.groq.com/openai/v1`         |
| 音声文字起こし        | `whisper-large-v3-turbo`（デフォルト）   |
| 推奨チャットデフォルト | `groq/llama-3.3-70b-versatile`           |

## Plugin をインストール

公式 Plugin をインストールしてから、Gateway を再起動します。

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## はじめに

<Steps>
  <Step title="API キーを取得">
    [console.groq.com/keys](https://console.groq.com/keys) で API キーを作成します。
  </Step>
  <Step title="API キーを設定">
    ```bash
export GROQ_API_KEY=gsk_...
```
  </Step>
  <Step title="デフォルトモデルを設定">
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
  <Step title="カタログに到達できることを確認">
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

OpenClaw は、推論ありと推論なしのエントリを含む、manifest ベースの Groq カタログを同梱しています。インストール済みバージョンの静的な行を確認するには `openclaw models list --provider groq` を実行し、Groq の公式リストを確認するには [console.groq.com/docs/models](https://console.groq.com/docs/models) を参照してください。

| モデル参照                                       | 名前                    | 推論 | 入力         | コンテキスト |
| ------------------------------------------------ | ----------------------- | --------- | ------------ | ------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | なし      | テキスト     | 131,072 |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | なし      | テキスト     | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | なし      | テキスト + 画像 | 131,072 |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | あり      | テキスト     | 131,072 |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | あり      | テキスト     | 131,072 |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | あり      | テキスト     | 131,072 |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | あり      | テキスト     | 131,072 |
| `groq/groq/compound`                             | Compound                | あり      | テキスト     | 131,072 |
| `groq/groq/compound-mini`                        | Compound Mini           | あり      | テキスト     | 131,072 |

<Tip>
  カタログは OpenClaw の各リリースで進化します。`openclaw models list --provider groq` は、インストール済みバージョンが認識している行を表示します。新しく追加されたモデルや非推奨になったモデルについては、[console.groq.com/docs/models](https://console.groq.com/docs/models) と照合してください。
</Tip>

## 推論モデル

Groq の推論モデル（上の表で `reasoning: true`）は、OpenClaw の共有 `/think` レベルを `low`、`medium`、`high` の `reasoning_effort` 値にマッピングします。`/think off` または `/think none` は、無効化された値を送信するのではなく、リクエストから `reasoning_effort` を省略します。

共有 `/think` レベルと、OpenClaw がプロバイダーごとにそれらを変換する方法については、[思考モード](/ja-JP/tools/thinking) を参照してください。

## 音声文字起こし

Groq の Plugin は、音声メッセージを共有 `tools.media.audio` サーフェス経由で文字起こしできるようにするため、**音声メディア理解プロバイダー**も登録します。

| プロパティ       | 値                                        |
| ------------------ | ----------------------------------------- |
| 共有設定パス     | `tools.media.audio`                       |
| デフォルトベースURL | `https://api.groq.com/openai/v1`          |
| デフォルトモデル | `whisper-large-v3-turbo`                  |
| 自動優先度       | 20                                        |
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
    Gateway が管理サービス（launchd、systemd、Docker）として実行される場合、`GROQ_API_KEY` は対話型シェルだけでなく、そのプロセスからも見えている必要があります。

    <Warning>
      対話型シェルでのみ export されたキーは、その環境もそこに取り込まれていない限り、launchd または systemd デーモンには役立ちません。gateway プロセスから読み取れるようにするには、`~/.openclaw/.env` または `env.shellEnv` 経由でキーを設定してください。
    </Warning>

  </Accordion>

  <Accordion title="カスタム Groq モデル ID">
    OpenClaw は実行時に任意の Groq モデル ID を受け入れます。Groq が示す正確な ID を使用し、`groq/` を前置してください。静的カタログは一般的なケースをカバーします。カタログにない ID は、デフォルトの OpenAI 互換テンプレートにフォールスルーします。

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
