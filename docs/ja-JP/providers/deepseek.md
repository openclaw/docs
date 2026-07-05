---
read_when:
    - OpenClaw で DeepSeek を使用したい
    - API キーの環境変数または CLI 認証の選択が必要です
summary: DeepSeek のセットアップ（認証 + モデル選択）
title: DeepSeek
x-i18n:
    generated_at: "2026-07-05T11:43:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0a66574c1977e835823d3d5f9fea073889267d6336a15533dd25645621e70dc
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) は、OpenAI互換APIを備えた強力なAIモデルを提供します。

| プロパティ | 値                         |
| ---------- | -------------------------- |
| プロバイダー | `deepseek`                 |
| 認証       | `DEEPSEEK_API_KEY`         |
| API        | OpenAI互換                 |
| Base URL   | `https://api.deepseek.com` |

## Pluginをインストール

公式Pluginをインストールしてから、Gatewayを再起動します。

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## はじめに

<Steps>
  <Step title="APIキーを取得">
    [platform.deepseek.com](https://platform.deepseek.com/api_keys) でAPIキーを作成します。
  </Step>
  <Step title="オンボーディングを実行">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    APIキーの入力を求め、`deepseek/deepseek-v4-flash` をデフォルトモデルとして設定します。

  </Step>
  <Step title="モデルが利用可能であることを確認">
    ```bash
    openclaw models list --provider deepseek
    ```

    実行中のGatewayなしでPluginの静的カタログを確認するには:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="非対話セットアップ">
    スクリプト化されたインストールやヘッドレスインストールでは、すべてのフラグを直接渡します。

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
Gatewayがデーモン（launchd/systemd）として実行される場合は、`DEEPSEEK_API_KEY` が
そのプロセスで利用可能であることを確認してください（たとえば、`~/.openclaw/.env` または
`env.shellEnv` 経由）。
</Warning>

## 組み込みカタログ

| モデル参照                   | 名前              | 入力 | コンテキスト | 最大出力   | 注記                                       |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text  | 1,000,000 | 384,000    | デフォルトモデル。V4 thinking対応サーフェス |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text  | 1,000,000 | 384,000    | V4 thinking対応サーフェス                  |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072   | 8,192      | DeepSeek V3.2非thinkingサーフェス          |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072   | 65,536     | Reasoning対応V3.2サーフェス                |

<Tip>
V4モデルはDeepSeekの `thinking` 制御をサポートします。OpenClawはフォローアップターンで
DeepSeek `reasoning_content` も再生するため、ツール呼び出しを含むthinkingセッションを
継続できます。
DeepSeek V4モデルでDeepSeekの最大 `reasoning_effort` を要求するには、
`/think xhigh` または `/think max` を使用します。どちらも `"max"` にマップされます。
</Tip>

## Thinkingとツール

DeepSeek V4のthinkingセッションでは、thinking有効ターンから再生されるassistantメッセージに、
フォローアップリクエストで `reasoning_content` が含まれている必要があります。
OpenClawのDeepSeek Pluginはそのフィールドを自動的にバックフィルするため、通常の
複数ターンのツール使用は、履歴が別のOpenAI互換プロバイダー（ネイティブの
`reasoning_content` なし）や通常のassistantメッセージから来た場合でも、
`deepseek/deepseek-v4-flash` と
`deepseek/deepseek-v4-pro` で機能します。セッション途中でプロバイダーを切り替えた後に
`/new` は不要です。

thinkingが無効（UIの **None** 選択を含む）の場合、OpenClawは
`thinking: { type: "disabled" }` を送信し、送信履歴から再生された `reasoning_content` を
取り除いて、セッションを非thinkingのDeepSeekパスに保ちます。

デフォルトの高速パスには `deepseek/deepseek-v4-flash` を使用します。
コストやレイテンシの増加を許容できる場合は、より強力なモデルとして
`deepseek/deepseek-v4-pro` を使用します。

## ライブテスト

最新モデルライブスイートからDeepSeek V4の直接モデルチェックのみを実行するには:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

両方のV4モデルが完了すること、およびthinking/ツールのフォローアップターンで
DeepSeekが必要とする再生ペイロードが保持されることを検証します。

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

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作を選択します。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    エージェント、モデル、プロバイダーの完全な設定リファレンスです。
  </Card>
</CardGroup>
