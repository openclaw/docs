---
read_when:
    - OpenAI 互換ツールで Claude Max サブスクリプションを使用したい
    - Claude Code CLI をラップするローカル API サーバーが必要です
    - サブスクリプションベースと API キーベースの Anthropic アクセスを評価したい場合
summary: Claude サブスクリプション認証情報を OpenAI 互換エンドポイントとして公開するコミュニティプロキシ
title: Claude Max API プロキシ
x-i18n:
    generated_at: "2026-07-05T11:39:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d0d9a70e14d7d444e57e9bcf169816fec4013a2680dfc9b1761e6ab32109e9f
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** はコミュニティ製の npm パッケージ（OpenClaw Plugin ではありません）で、
Claude Max/Pro サブスクリプションを OpenAI 互換 API エンドポイントとして公開するため、
Anthropic API キーの代わりに、任意の OpenAI 互換ツールを自分のサブスクリプションへ向けられます。

<Warning>
技術的な互換性のみであり、公式に認可された経路ではありません。Anthropic は過去に
Claude Code 以外での一部のサブスクリプション利用をブロックしたことがあります。これに依存する前に、
Anthropic の現在の請求ルールを確認してください。

Anthropic の Claude Code ドキュメントでは、`claude -p` は Agent SDK/プログラムからの
利用として説明されています。Anthropic の 2026 年 6 月 15 日のサポート更新時点では、Claude Agent SDK、
`claude -p`、およびサードパーティアプリの利用は、サインイン中のサブスクリプションの
利用上限から消費されます（以前発表されていた別個の Agent SDK クレジットプランは
一時停止されています）。Anthropic の [Agent SDK プラン
記事](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)、
[Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
および [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
プラン記事、ならびに OpenClaw 独自の Claude CLI 請求に関する注記については
[Anthropic プロバイダー](/ja-JP/providers/anthropic)を参照してください。
</Warning>

## これを使う理由

| アプローチ                  | コスト経路                                      | 最適な用途                                   |
| ------------------------- | ----------------------------------------------- | ------------------------------------------ |
| Anthropic API キー         | Claude Console 経由でトークンごとに支払い            | 本番アプリ、共有自動化、大量利用 |
| Claude サブスクリプションプロキシ | Claude Code / `claude -p` のプランおよびクレジットルール | 互換ツールでの個人的な実験 |

このプロキシにより、Claude Max または Pro サブスクリプションを OpenAI 互換
ツールで利用できます。これは無制限の定額経路ではありません。Claude Code の利用
上限を継承します。本番利用では、API キーのほうが請求経路として明確です。

## 仕組み

```text
Your App -> claude-max-api-proxy -> Claude Code CLI / claude -p -> Anthropic
     (OpenAI format)                (converts format)              (uses your login)
```

このプロキシはリクエストごとに Claude Code CLI をサブプロセスとして起動し、
OpenAI 形式のチャットリクエストを CLI プロンプトへ変換し、レスポンスを
OpenAI 形式でストリーミング（または返却）します。

## はじめに

<Steps>
  <Step title="プロキシをインストールする">
    Node.js 20+ と、認証済みの Claude Code CLI が必要です。

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    claude auth login   # if not already authenticated
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
    curl http://localhost:3456/health
    curl http://localhost:3456/v1/models

    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="OpenClaw を設定する">
    カスタム OpenAI 互換エンドポイントとして、OpenClaw をプロキシに向けます。

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

<Note>
下記のモデル ID は、OpenClaw の Anthropic モデル参照ではなく、このプロキシ独自のカタログです。
各 ID は Claude Code CLI のモデルエイリアス（`opus`、`sonnet`、
`haiku`）に対応しているため、Anthropic が CLI 内のそのエイリアスを更新するたびに、
基盤となるモデルは変わります。特定の対応関係に依存する前に、プロキシの現在の README を確認してください。
</Note>

| モデル ID          | CLI エイリアス | 現在の対応 |
| ----------------- | --------- | --------------- |
| `claude-opus-4`   | `opus`    | Claude Opus 4.5 |
| `claude-sonnet-4` | `sonnet`  | Claude Sonnet 4 |
| `claude-haiku-4`  | `haiku`   | Claude Haiku 4  |

## 高度な設定

<AccordionGroup>
  <Accordion title="プロキシ形式の OpenAI 互換に関する注記">
    これは OpenClaw の汎用カスタム `/v1` OpenAI 互換ルートを使用します。これは他の
    セルフホスト OpenAI 互換バックエンドと同じ経路です。

    - ネイティブ OpenAI 専用のリクエスト整形は適用されません。
    - `/fast` と `service_tier` は、直接の `api.anthropic.com`
      トラフィックにのみ適用されます。プロキシルートでは `service_tier` は変更されません（
      [Anthropic プロバイダーの高速モード](/ja-JP/providers/anthropic#advanced-configuration)を参照）。
    - Responses の `store`、プロンプトキャッシュのヒント、OpenAI reasoning 互換の
      ペイロード整形はありません。
    - OpenClaw の OpenAI/Codex 帰属ヘッダー（`originator`、`version`、
      `User-Agent`）は、ネイティブの `api.openai.com` OAuth トラフィックでのみ送信され、このプロキシのような
      カスタム `OPENAI_BASE_URL` ターゲットには送信されません。

  </Accordion>

  <Accordion title="LaunchAgent で macOS 起動時に自動起動する">
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

- Claude Code の `claude -p` の請求、利用クレジット、レート制限の挙動を継承します。
- `127.0.0.1` のみにバインドします。CLI 自身が Anthropic に行う呼び出し以外に、サードパーティサーバーへデータを送信しません。
- ストリーミングレスポンスに対応しています。
- 認証失敗は起動時にはチェックされず、チャットリクエストが実際に実行された時点でのみ表面化します。CLI が未認証の場合、サーバーが起動を拒否するのではなく、最初のリクエストが失敗すると想定してください。

<Note>
Claude CLI または API キーを使ったネイティブ Anthropic 連携については、[Anthropic プロバイダー](/ja-JP/providers/anthropic)を参照してください。OpenAI/Codex サブスクリプションについては、[OpenAI プロバイダー](/ja-JP/providers/openai)を参照してください。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="Anthropic プロバイダー" href="/ja-JP/providers/anthropic" icon="bolt">
    Claude CLI または API キーを使ったネイティブ OpenClaw 連携。
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
