---
read_when:
    - OpenAI 互換ツールで Claude Max サブスクリプションを使用したい場合
    - Claude Code CLI をラップするローカル API サーバーが必要な場合
    - サブスクリプションベースと API キーベースの Anthropic アクセスを比較評価したい場合
summary: Claude のサブスクリプション認証情報を OpenAI 互換エンドポイントとして公開するコミュニティプロキシ
title: Claude Max API プロキシ
x-i18n:
    generated_at: "2026-07-11T22:36:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d0d9a70e14d7d444e57e9bcf169816fec4013a2680dfc9b1761e6ab32109e9f
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** はコミュニティ製の npm パッケージ（OpenClaw plugin ではありません）であり、Claude Max/Pro サブスクリプションを OpenAI 互換 API エンドポイントとして公開します。これにより、Anthropic API キーの代わりに、任意の OpenAI 互換ツールからサブスクリプションを利用できます。

<Warning>
技術的に互換性があるだけで、公式に認可された方法ではありません。Anthropic は過去に Claude Code 外での一部のサブスクリプション利用をブロックしたことがあります。これに依存する前に、Anthropic の現在の課金ルールを確認してください。

Anthropic の Claude Code ドキュメントでは、`claude -p` を Agent SDK／プログラムによる利用として説明しています。Anthropic による 2026 年 6 月 15 日のサポート情報更新時点では、Claude Agent SDK、`claude -p`、およびサードパーティ製アプリの利用は、サインイン中のサブスクリプションの使用量上限に算入されます（以前発表された Agent SDK 専用クレジットプランは一時停止されています）。Anthropic の [Agent SDK プランの記事](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)、[Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan) および [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan) のプラン記事と、OpenClaw 独自の Claude CLI 課金に関する注意事項については [Anthropic プロバイダー](/ja-JP/providers/anthropic)を参照してください。
</Warning>

## これを使用する理由

| 方式                      | 課金経路                                        | 最適な用途                                 |
| ------------------------- | ----------------------------------------------- | ------------------------------------------ |
| Anthropic API キー        | Claude Console を通じたトークン単位の従量課金  | 本番アプリ、共有自動化、大量利用           |
| Claude サブスクリプションプロキシ | Claude Code／`claude -p` のプランおよびクレジットルール | 互換ツールを使った個人的な実験             |

このプロキシを使用すると、Claude Max または Pro サブスクリプションを OpenAI 互換ツールで利用できます。無制限の定額制ではなく、Claude Code の使用量上限を継承します。本番環境での利用には、API キーのほうが課金経路が明確です。

## 仕組み

```text
アプリ -> claude-max-api-proxy -> Claude Code CLI / claude -p -> Anthropic
        (OpenAI 形式)               (形式を変換)                   (ログイン情報を使用)
```

プロキシはリクエストごとに Claude Code CLI をサブプロセスとして起動し、OpenAI 形式のチャットリクエストを CLI プロンプトに変換して、レスポンスを OpenAI 形式でストリーミング（または一括返却）します。

## はじめに

<Steps>
  <Step title="プロキシをインストールする">
    Node.js 20 以降と、認証済みの Claude Code CLI が必要です。

    ```bash
    npm install -g claude-max-api-proxy

    # Claude CLI が認証済みであることを確認
    claude --version
    claude auth login   # まだ認証していない場合
    ```

  </Step>
  <Step title="サーバーを起動する">
    ```bash
    claude-max-api
    # サーバーは http://localhost:3456 で稼働
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
    OpenClaw がカスタム OpenAI 互換エンドポイントとしてプロキシを参照するように設定します。

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
以下のモデル ID はプロキシ独自のカタログであり、OpenClaw の Anthropic モデル参照ではありません。各 ID は Claude Code CLI のモデルエイリアス（`opus`、`sonnet`、`haiku`）に対応しているため、Anthropic が CLI 内のエイリアスを更新するたびに、基盤となるモデルも変わります。特定の対応関係に依存する前に、プロキシの最新の README を確認してください。
</Note>

| モデル ID         | CLI エイリアス | 現在の対応モデル |
| ----------------- | -------------- | ---------------- |
| `claude-opus-4`   | `opus`         | Claude Opus 4.5  |
| `claude-sonnet-4` | `sonnet`       | Claude Sonnet 4  |
| `claude-haiku-4`  | `haiku`        | Claude Haiku 4   |

## 高度な設定

<AccordionGroup>
  <Accordion title="プロキシ形式の OpenAI 互換に関する注意事項">
    これは OpenClaw の汎用カスタム `/v1` OpenAI 互換ルートを使用します。他のセルフホスト型 OpenAI 互換バックエンドと同じ経路です。

    - OpenAI ネイティブ専用のリクエスト整形は適用されません。
    - `/fast` と `service_tier` は `api.anthropic.com` への直接トラフィックにのみ適用されます。プロキシルートでは `service_tier` を変更しません（[Anthropic プロバイダーの高速モード](/ja-JP/providers/anthropic#advanced-configuration)を参照）。
    - Responses の `store`、プロンプトキャッシュのヒント、OpenAI の推論互換ペイロード整形はありません。
    - OpenClaw の OpenAI/Codex 帰属ヘッダー（`originator`、`version`、`User-Agent`）は、ネイティブな `api.openai.com` OAuth トラフィックでのみ送信され、このプロキシのようなカスタム `OPENAI_BASE_URL` の宛先には送信されません。

  </Accordion>

  <Accordion title="LaunchAgent を使用して macOS で自動起動する">
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

## 注意事項

- Claude Code の `claude -p` における課金、使用クレジット、およびレート制限の動作を継承します。
- `127.0.0.1` のみにバインドされます。CLI 自体による Anthropic への呼び出しを除き、サードパーティのサーバーにデータを送信しません。
- ストリーミングレスポンスに対応しています。
- 認証失敗は起動時には確認されず、チャットリクエストが実際に実行された時点で初めて表面化します。CLI が未認証の場合、サーバーが起動を拒否するのではなく、最初のリクエストが失敗します。

<Note>
Claude CLI または API キーを使用したネイティブな Anthropic 統合については、[Anthropic プロバイダー](/ja-JP/providers/anthropic)を参照してください。OpenAI/Codex サブスクリプションについては、[OpenAI プロバイダー](/ja-JP/providers/openai)を参照してください。
</Note>

## 関連項目

<CardGroup cols={2}>
  <Card title="Anthropic プロバイダー" href="/ja-JP/providers/anthropic" icon="bolt">
    Claude CLI または API キーを使用した OpenClaw のネイティブ統合。
  </Card>
  <Card title="OpenAI プロバイダー" href="/ja-JP/providers/openai" icon="robot">
    OpenAI/Codex サブスクリプション向け。
  </Card>
  <Card title="モデルの選択" href="/ja-JP/concepts/model-providers" icon="layers">
    すべてのプロバイダー、モデル参照、およびフェイルオーバー動作の概要。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration" icon="gear">
    完全な設定リファレンス。
  </Card>
</CardGroup>
