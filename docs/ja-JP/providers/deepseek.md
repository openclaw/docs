---
read_when:
    - OpenClaw で DeepSeek を使用する場合
    - API キーの環境変数または CLI 認証の選択が必要です
summary: DeepSeek のセットアップ（認証 + モデル選択）
title: DeepSeek
x-i18n:
    generated_at: "2026-07-12T14:47:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
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
Gateway をデーモン（launchd/systemd）として実行する場合は、
`DEEPSEEK_API_KEY` をそのプロセスから利用できるようにしてください（たとえば、
`~/.openclaw/.env` または `env.shellEnv` を使用します）。
</Warning>

## 組み込みカタログ

| モデル参照                   | 名前              | 入力   | コンテキスト | 最大出力 | 注記                                                   |
| ---------------------------- | ----------------- | ------ | ------------ | -------- | ------------------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | テキスト | 1,000,000    | 384,000  | デフォルトモデル。V4 の思考対応インターフェース         |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | テキスト | 1,000,000    | 384,000  | V4 の思考対応インターフェース                           |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | テキスト | 1,000,000    | 384,000  | 非推奨の V4 Flash 非思考モード互換名                    |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | テキスト | 1,000,000    | 384,000  | 非推奨の V4 Flash 思考モード互換名                      |

<Warning>
DeepSeek は、2026 年 7 月 24 日 15:59 UTC に `deepseek-chat` と
`deepseek-reasoner` の提供を終了します。現在、これらはそれぞれ非思考モードと
思考モードの DeepSeek V4 Flash にルーティングされます。期限までに、設定済みのモデル参照を
`deepseek/deepseek-v4-flash` または `deepseek/deepseek-v4-pro` に移行してください。
</Warning>

OpenClaw のローカルコスト見積もりは、DeepSeek が公開しているキャッシュヒット、
キャッシュミス、および出力の料金に従います。DeepSeek はこれらの料金を変更する可能性があります。
請求については、DeepSeek の
[モデルと料金](https://api-docs.deepseek.com/quick_start/pricing/)ページが
正式な情報源です。

<Tip>
V4 モデルは DeepSeek の `thinking` 制御をサポートします。また OpenClaw は、
ツール呼び出しを伴う思考セッションを継続できるよう、後続ターンで DeepSeek の
`reasoning_content` を再送します。
DeepSeek V4 モデルで DeepSeek の最大 `reasoning_effort` を要求するには、
`/think xhigh` または `/think max` を使用します。どちらも `"max"` にマッピングされます。
</Tip>

## 思考とツール

DeepSeek V4 の思考セッションでは、後続リクエストに含める思考有効ターンの
アシスタントメッセージに、再送された `reasoning_content` が必要です。
OpenClaw の DeepSeek Plugin はこのフィールドを自動的に補完するため、履歴が別の
OpenAI 互換プロバイダー（ネイティブの `reasoning_content` なし）または通常の
アシスタントメッセージから取得された場合でも、`deepseek/deepseek-v4-flash` と
`deepseek/deepseek-v4-pro` で通常の複数ターンのツール使用が機能します。
セッション途中でプロバイダーを切り替えた後も、`/new` は不要です。

思考が無効な場合（UI で **None** を選択した場合を含む）、OpenClaw は
`thinking: { type: "disabled" }` を送信し、送信する履歴から再送された
`reasoning_content` を除去して、セッションを DeepSeek の非思考パスに維持します。

デフォルトの高速パスには `deepseek/deepseek-v4-flash` を使用します。
コストまたはレイテンシーの増加を許容でき、より高性能なモデルが必要な場合は、
`deepseek/deepseek-v4-pro` を使用します。

## ライブテスト

最新のモデルライブスイートから DeepSeek V4 の直接モデルチェックのみを実行するには、次を実行します。

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

両方の V4 モデルが完了すること、および思考やツールの後続ターンで
DeepSeek が必要とする再送ペイロードが保持されることを検証します。

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
    エージェント、モデル、プロバイダーの完全な設定リファレンス。
  </Card>
</CardGroup>
