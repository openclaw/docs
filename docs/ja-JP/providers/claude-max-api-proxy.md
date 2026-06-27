---
read_when:
    - OpenAI互換ツールで Claude Max サブスクリプションを使いたい場合
    - ローカル API サーバーで Claude Code CLI をラップしたい
    - サブスクリプションベースと API キーベースの Anthropic アクセスを評価したい場合
summary: Claude サブスクリプションの認証情報を OpenAI 互換エンドポイントとして公開するコミュニティプロキシ
title: Claude Max APIプロキシ
x-i18n:
    generated_at: "2026-06-27T12:41:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24bd2b4b56e4b8829e67f248d0e0a6bad53ccbd9ce98ee288bfa4de93508ef27
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** は、Claude Max/Pro サブスクリプションを OpenAI 互換 API エンドポイントとして公開するコミュニティツールです。これにより、OpenAI API 形式をサポートする任意のツールでサブスクリプションを使用できます。

<Warning>
この経路は技術的な互換性のみを目的としています。Anthropic は過去に Claude Code 以外での一部のサブスクリプション利用をブロックしたことがあります。これを使用するかどうかは自分で判断し、依存する前に Anthropic の現在の課金ルールを確認する必要があります。

Anthropic の現在のサポートドキュメントでは、`claude -p` は Agent SDK/プログラム的な使用とされています。2026 年 6 月 15 日以降、サブスクリプションプランでの `claude -p` 使用は、まず別枠の月次 Agent SDK クレジットから消費され、その後、使用クレジットが有効な場合は標準 API レートで使用クレジットから消費されます。
</Warning>

## なぜこれを使うのか？

| アプローチ                  | コスト経路                                      | 最適な用途                                   |
| ------------------------- | ----------------------------------------------- | ------------------------------------------ |
| Anthropic API             | Claude Console またはクラウド経由でトークンごとに支払い   | 本番アプリ、共有オートメーション、大量利用 |
| Claude サブスクリプションプロキシ | Claude Code / `claude -p` プランとクレジットルール | 互換ツールを使った個人実験 |

Claude Max または Pro サブスクリプションがあり、OpenAI 互換ツールでそれを使いたい場合、このプロキシは一部の個人ワークフローに合う可能性があります。これは無制限の定額経路ではありません。本番利用では、API キーのほうがポリシーと課金の経路として明確です。

## 仕組み

```
Your App → claude-max-api-proxy → Claude Code CLI / claude -p → Anthropic
     (OpenAI format)              (converts format)          (uses your login)
```

このプロキシは次を行います。

1. `http://localhost:3456/v1/chat/completions` で OpenAI 形式のリクエストを受け付ける
2. それらを Claude Code CLI コマンドに変換する
3. OpenAI 形式でレスポンスを返す（ストリーミング対応）

## はじめに

<Steps>
  <Step title="プロキシをインストールする">
    Node.js 22+ と Claude Code CLI が必要です。

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    ```

  </Step>
  <Step title="サーバーを起動する">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="プロキシをテストする">
    ```bash
    # Health check
    curl http://localhost:3456/health

    # List models
    curl http://localhost:3456/v1/models

    # Chat completion
    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="OpenClaw を設定する">
    OpenClaw がカスタム OpenAI 互換エンドポイントとしてこのプロキシを指すようにします。

    ```json5
    {
      env: {
        OPENAI_API_KEY: "not-needed",
        OPENAI_BASE_URL: "http://localhost:3456/v1",
      },
      agents: {
        defaults: {
          model: { primary: "openai/claude-opus-4" },
        },
      },
    }
    ```

  </Step>
</Steps>

## 組み込みカタログ

| モデル ID          | マップ先         |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## 高度な設定

<AccordionGroup>
  <Accordion title="プロキシ形式の OpenAI 互換に関する注意">
    この経路は、他のカスタム `/v1` バックエンドと同じプロキシ形式の OpenAI 互換ルートを使用します。

    - ネイティブの OpenAI 専用リクエスト整形は適用されません
    - `service_tier`、Responses `store`、プロンプトキャッシュヒント、OpenAI reasoning 互換ペイロード整形はありません
    - 隠し OpenClaw 帰属ヘッダー（`originator`、`version`、`User-Agent`）はプロキシ URL には注入されません

  </Accordion>

  <Accordion title="LaunchAgent で macOS 起動時に自動起動する">
    プロキシを自動実行する LaunchAgent を作成します。

    ```bash
    cat > ~/Library/LaunchAgents/com.claude-max-api.plist << 'EOF'
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
      <key>Label</key>
      <string>com.claude-max-api</string>
      <key>RunAtLoad</key>
      <true/>
      <key>KeepAlive</key>
      <true/>
      <key>ProgramArguments</key>
      <array>
        <string>/usr/local/bin/node</string>
        <string>/usr/local/lib/node_modules/claude-max-api-proxy/dist/server/standalone.js</string>
      </array>
      <key>EnvironmentVariables</key>
      <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/opt/homebrew/bin:~/.local/bin:/usr/bin:/bin</string>
      </dict>
    </dict>
    </plist>
    EOF

    launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude-max-api.plist
    ```

  </Accordion>
</AccordionGroup>

## 注記

- これは **コミュニティツール** であり、Anthropic または OpenClaw によって公式にサポートされているものではありません
- Claude Code CLI で認証済みの有効な Claude Max/Pro サブスクリプションが必要です
- Claude Code `claude -p` の課金、使用クレジット、レート制限の動作を継承します
- プロキシはローカルで実行され、データをサードパーティサーバーに送信しません
- ストリーミングレスポンスは完全にサポートされています

<Note>
Claude CLI または API キーを使ったネイティブ Anthropic 統合については、[Anthropic プロバイダー](/ja-JP/providers/anthropic)を参照してください。OpenAI/Codex サブスクリプションについては、[OpenAI プロバイダー](/ja-JP/providers/openai)を参照してください。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="Anthropic プロバイダー" href="/ja-JP/providers/anthropic" icon="bolt">
    Claude CLI または API キーを使ったネイティブ OpenClaw 統合。
  </Card>
  <Card title="OpenAI プロバイダー" href="/ja-JP/providers/openai" icon="robot">
    OpenAI/Codex サブスクリプション向け。
  </Card>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    すべてのプロバイダー、モデル参照、フェイルオーバー動作の概要。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration" icon="gear">
    完全な設定リファレンス。
  </Card>
</CardGroup>
