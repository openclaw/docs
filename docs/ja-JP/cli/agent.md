---
read_when:
    - スクリプトからエージェントの1ターンを実行したい場合（必要に応じて返信も配信）
summary: Gateway経由で`openclaw agent`のCLIリファレンス（エージェントの1ターンを送信）
title: エージェント
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-25T13:43:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: e06681ffbed56cb5be05c7758141e784eac8307ed3c6fc973f71534238b407e1
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Gateway経由でエージェントの1ターンを実行します（埋め込み実行には`--local`を使用）。
設定済みのエージェントを直接対象にするには`--agent <id>`を使用します。

少なくとも1つのセッションセレクターを渡してください。

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

関連:

- Agent送信ツール: [Agent send](/ja-JP/tools/agent-send)

## オプション

- `-m, --message <text>`: 必須のメッセージ本文
- `-t, --to <dest>`: セッションキーの導出に使用される受信先
- `--session-id <id>`: 明示的なセッションid
- `--agent <id>`: エージェントid。ルーティングバインディングを上書きします
- `--thinking <level>`: エージェントの思考レベル（`off`、`minimal`、`low`、`medium`、`high`、および`xhigh`、`adaptive`、`max`などプロバイダー対応のカスタムレベル）
- `--verbose <on|off>`: セッションのverboseレベルを永続化します
- `--channel <channel>`: 配信チャネル。省略するとメインセッションチャネルを使用します
- `--reply-to <target>`: 配信ターゲットの上書き
- `--reply-channel <channel>`: 配信チャネルの上書き
- `--reply-account <id>`: 配信アカウントの上書き
- `--local`: 埋め込みエージェントを直接実行します（Pluginレジストリの事前読み込み後）
- `--deliver`: 選択したチャネル/ターゲットに返信を送り返します
- `--timeout <seconds>`: エージェントのタイムアウトを上書きします（デフォルトは600または設定値）
- `--json`: JSONを出力します

## 例

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## 注意

- Gatewayモードでは、Gatewayリクエストが失敗すると埋め込みエージェントにフォールバックします。最初から埋め込み実行を強制するには`--local`を使用してください。
- `--local`でも先にPluginレジストリを事前読み込みするため、Plugin提供のプロバイダー、ツール、チャネルは埋め込み実行中も利用可能です。
- 各`openclaw agent`呼び出しはワンショット実行として扱われます。その実行で開かれたバンドル済みまたはユーザー設定のMCPサーバーは、コマンドがGateway経路を使う場合でも返信後に終了するため、stdio MCP子プロセスはスクリプト呼び出しの間で生き続けません。
- `--channel`、`--reply-channel`、`--reply-account`は返信配信に影響し、セッションルーティングには影響しません。
- `--json`を使うと、stdoutはJSONレスポンス専用に保たれます。Gateway、Plugin、埋め込みフォールバックの診断情報はstderrへ出力されるため、スクリプトはstdoutを直接パースできます。
- このコマンドが`models.json`の再生成をトリガーした場合、SecretRef管理のプロバイダー認証情報は、解決済みの秘密の平文ではなく、非シークレットのマーカー（たとえば環境変数名、`secretref-env:ENV_VAR_NAME`、または`secretref-managed`）として永続化されます。
- マーカーの書き込みはソースを正とします。OpenClawは、解決済みのランタイム秘密値ではなく、アクティブなソース設定スナップショットからマーカーを永続化します。

## 関連

- [CLI reference](/ja-JP/cli)
- [Agent runtime](/ja-JP/concepts/agent)
