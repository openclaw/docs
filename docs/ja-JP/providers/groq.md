---
read_when:
    - OpenClaw で Groq を使用したい場合
    - API キーの環境変数または CLI 認証の選択が必要です
summary: Groq のセットアップ（認証 + モデル選択）
title: Groq
x-i18n:
    generated_at: "2026-05-02T05:03:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2cf6678047581a438906420894b250bafb68d71254fbaf30ea5dfcfc4799eac7
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) は、カスタム LPU ハードウェアを使用して、オープンソースモデル
（Llama、Gemma、Mistral など）で超高速推論を提供します。OpenClaw は
OpenAI互換 API を通じて Groq に接続します。

| プロパティ | 値             |
| -------- | ----------------- |
| プロバイダー | `groq`            |
| 認証     | `GROQ_API_KEY`    |
| API      | OpenAI互換 |

## はじめに

<Steps>
  <Step title="API キーを取得する">
    [console.groq.com/keys](https://console.groq.com/keys) で API キーを作成します。
  </Step>
  <Step title="API キーを設定する">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
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

OpenClaw には、プロバイダーでフィルタリングしたモデル一覧を高速に表示するための、マニフェストベースの Groq カタログが同梱されています。
同梱されている行を確認するには `openclaw models list --all --provider groq` を実行するか、
[console.groq.com/docs/models](https://console.groq.com/docs/models) を確認してください。

| モデル                       | 備考                              |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | 汎用、大きなコンテキスト     |
| **Llama 3.1 8B Instant**    | 高速、軽量                  |
| **Gemma 2 9B**              | コンパクト、効率的                 |
| **Mixtral 8x7B**            | MoE アーキテクチャ、強力な推論 |

<Tip>
この OpenClaw バージョンが認識しているマニフェストベースの Groq 行を確認するには、`openclaw models list --all --provider groq` を使用してください。
</Tip>

## 推論モデル

OpenClaw は共有の `/think` レベルを、Groq のモデル固有の
`reasoning_effort` 値にマッピングします。`qwen/qwen3-32b` では、思考を無効にすると
`none` が送信され、有効にすると `default` が送信されます。Groq GPT-OSS 推論モデルでは、
OpenClaw は `low`、`medium`、または `high` を送信します。思考を無効にした場合は、
これらのモデルが無効値をサポートしていないため `reasoning_effort` を省略します。

## 音声文字起こし

Groq は高速な Whisper ベースの音声文字起こしも提供しています。
メディア理解プロバイダーとして設定されている場合、OpenClaw は Groq の
`whisper-large-v3-turbo` モデルを使用し、共有の `tools.media.audio`
サーフェスを通じて音声メッセージを文字起こしします。

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
  <Accordion title="音声文字起こしの詳細">
    | プロパティ | 値 |
    |----------|-------|
    | 共有設定パス | `tools.media.audio` |
    | デフォルトのベース URL   | `https://api.groq.com/openai/v1` |
    | デフォルトモデル      | `whisper-large-v3-turbo` |
    | API エンドポイント       | OpenAI互換 `/audio/transcriptions` |
  </Accordion>

  <Accordion title="環境に関する注記">
    Gateway がデーモン（launchd/systemd）として実行されている場合は、`GROQ_API_KEY` が
    そのプロセスで利用可能であることを確認してください（たとえば、`~/.openclaw/.env` 内、または
    `env.shellEnv` 経由）。

    <Warning>
    対話型シェルでのみ設定されたキーは、デーモン管理の Gateway プロセスからは見えません。
    永続的に利用できるようにするには、`~/.openclaw/.env` または `env.shellEnv` 設定を使用してください。
    </Warning>

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダーと音声設定を含む完全な設定スキーマ。
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq ダッシュボード、API ドキュメント、価格。
  </Card>
  <Card title="Groq モデル一覧" href="https://console.groq.com/docs/models" icon="list">
    公式の Groq モデルカタログ。
  </Card>
</CardGroup>
