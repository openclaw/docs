---
read_when:
    - OpenClaw で DeepSeek を使用する場合
    - API キーの環境変数または CLI 認証の選択が必要です
summary: DeepSeek のセットアップ（認証 + モデル選択）
title: DeepSeek
x-i18n:
    generated_at: "2026-07-11T22:36:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77e074756d593205d7d05f499da93b9bd3c63acdce7092b42fb5562023577925
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) は、OpenAI 互換 API を備えた高性能な AI モデルを提供します。

| プロパティ | 値                         |
| ---------- | -------------------------- |
| プロバイダー | `deepseek`                 |
| 認証       | `DEEPSEEK_API_KEY`         |
| API        | OpenAI 互換                |
| ベース URL | `https://api.deepseek.com` |

## Plugin のインストール

公式 Plugin をインストールしてから、Gateway を再起動します。

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## はじめに

<Steps>
  <Step title="API キーを取得する">
    [platform.deepseek.com](https://platform.deepseek.com/api_keys) で API キーを作成します。
  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    API キーの入力を求め、`deepseek/deepseek-v4-flash` をデフォルトモデルとして設定します。

  </Step>
  <Step title="モデルが利用可能であることを確認する">
    ```bash
    openclaw models list --provider deepseek
    ```

    Gateway を実行せずに Plugin の静的カタログを確認するには、次を実行します。

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="非対話型セットアップ">
    スクリプトによるインストールやヘッドレス環境でのインストールでは、すべてのフラグを直接渡します。

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Gateway をデーモン（launchd/systemd）として実行する場合は、`DEEPSEEK_API_KEY` を
そのプロセスから利用できるようにしてください（たとえば、`~/.openclaw/.env` または
`env.shellEnv` を使用します）。
</Warning>

## 組み込みカタログ

| モデル参照                   | 名前              | 入力   | コンテキスト | 最大出力 | 注記                                               |
| ---------------------------- | ----------------- | ------ | ------------ | -------- | -------------------------------------------------- |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | テキスト | 1,000,000    | 384,000  | デフォルトモデル。V4 の思考対応サーフェス          |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | テキスト | 1,000,000    | 384,000  | V4 の思考対応サーフェス                            |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | テキスト | 1,000,000    | 384,000  | 非推奨の V4 Flash 非思考互換名                     |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | テキスト | 1,000,000    | 384,000  | 非推奨の V4 Flash 思考互換名                       |

<Warning>
DeepSeek は、2026 年 7 月 24 日 15:59 UTC に `deepseek-chat` と
`deepseek-reasoner` の提供を終了します。現在、これらはそれぞれ非思考モードと
思考モードで DeepSeek V4 Flash にルーティングされます。期限までに、設定済みの
モデル参照を `deepseek/deepseek-v4-flash` または
`deepseek/deepseek-v4-pro` に移行してください。
</Warning>

OpenClaw のローカルコスト見積もりは、DeepSeek が公開しているキャッシュヒット、
キャッシュミス、出力の料金に準拠します。DeepSeek はこれらの料金を変更する可能性があり、
請求については [モデルと料金](https://api-docs.deepseek.com/quick_start/pricing/)
ページが正式な情報源です。

<Tip>
V4 モデルは、DeepSeek の `thinking` 制御をサポートします。OpenClaw は後続ターンで
DeepSeek の `reasoning_content` も再送するため、ツール呼び出しを含む思考セッションを
継続できます。
DeepSeek V4 モデルで DeepSeek の最大 `reasoning_effort` を要求するには、`/think xhigh`
または `/think max` を使用します。どちらも `"max"` にマッピングされます。
</Tip>

## 思考とツール

DeepSeek V4 の思考セッションでは、思考が有効なターンから再送されるアシスタントメッセージに、
後続リクエストで `reasoning_content` を含める必要があります。OpenClaw の DeepSeek Plugin は
このフィールドを自動的に補完するため、履歴が別の OpenAI 互換プロバイダー
（ネイティブの `reasoning_content` なし）または通常のアシスタントメッセージからのものであっても、
`deepseek/deepseek-v4-flash` と `deepseek/deepseek-v4-pro` で通常の複数ターンの
ツール使用が機能します。セッション途中でプロバイダーを切り替えた後も `/new` は不要です。

思考が無効な場合（UI の **None** 選択を含む）、OpenClaw は
`thinking: { type: "disabled" }` を送信し、送信履歴から再送される
`reasoning_content` を削除して、セッションを DeepSeek の非思考経路に維持します。

デフォルトの高速経路には `deepseek/deepseek-v4-flash` を使用します。コストやレイテンシーの
増加を許容でき、より高性能なモデルが必要な場合は `deepseek/deepseek-v4-pro` を使用します。

## ライブテスト

最新のモデルライブスイートから DeepSeek V4 の直接モデルチェックのみを実行するには、次を使用します。

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

両方の V4 モデルが処理を完了すること、および思考やツールを使用する後続ターンで、
DeepSeek が必要とする再送ペイロードが維持されることを検証します。

## 設定例

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルの選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択方法。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    エージェント、モデル、プロバイダーに関する完全な設定リファレンス。
  </Card>
</CardGroup>
