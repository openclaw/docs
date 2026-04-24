---
read_when:
    - スクリプトから 1 回のエージェントターンを実行したい場合（必要に応じて返信も配信）
summary: '`openclaw agent` の CLI リファレンス（Gateway 経由で 1 回のエージェントターンを送信）'
title: エージェント
x-i18n:
    generated_at: "2026-04-24T04:49:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4d57b8e368891a0010b053a7504d6313ad2233b5f5f43b34be1f9aa92caa86c
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Gateway 経由でエージェントターンを実行します（埋め込み実行には `--local` を使用します）。
設定済みのエージェントを直接対象にするには `--agent <id>` を使用します。

少なくとも 1 つのセッションセレクターを指定してください。

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

関連:

- エージェント送信ツール: [Agent send](/ja-JP/tools/agent-send)

## オプション

- `-m, --message <text>`: 必須のメッセージ本文
- `-t, --to <dest>`: セッションキーの導出に使われる受信先
- `--session-id <id>`: 明示的なセッション ID
- `--agent <id>`: エージェント ID。ルーティングバインディングを上書きします
- `--thinking <level>`: エージェントの思考レベル（`off`、`minimal`、`low`、`medium`、`high`、および `xhigh`、`adaptive`、`max` などプロバイダー対応のカスタムレベル）
- `--verbose <on|off>`: セッションの verbose レベルを永続化します
- `--channel <channel>`: 配信チャンネル。省略するとメインセッションチャンネルを使用します
- `--reply-to <target>`: 配信先ターゲットの上書き
- `--reply-channel <channel>`: 配信チャンネルの上書き
- `--reply-account <id>`: 配信アカウントの上書き
- `--local`: 埋め込みエージェントを直接実行します（Plugin レジストリの事前読み込み後）
- `--deliver`: 選択したチャンネル/ターゲットに返信を送り返します
- `--timeout <seconds>`: エージェントのタイムアウトを上書きします（デフォルトは 600 または設定値）
- `--json`: JSON を出力します

## 例

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## 注

- Gateway モードでは、Gateway リクエストが失敗すると埋め込みエージェントにフォールバックします。最初から埋め込み実行を強制するには `--local` を使用してください。
- `--local` でも最初に Plugin レジストリを事前読み込みするため、Plugin 提供のプロバイダー、ツール、チャンネルは埋め込み実行中でも利用可能です。
- `--channel`、`--reply-channel`、`--reply-account` は返信の配信に影響し、セッションルーティングには影響しません。
- このコマンドが `models.json` の再生成をトリガーした場合、SecretRef 管理のプロバイダー認証情報は、解決済みの平文シークレットではなく、非シークレットのマーカー（たとえば環境変数名、`secretref-env:ENV_VAR_NAME`、または `secretref-managed`）として永続化されます。
- マーカー書き込みはソースを正とします。OpenClaw は、解決済みランタイムシークレット値からではなく、アクティブなソース設定スナップショットからマーカーを永続化します。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [エージェントランタイム](/ja-JP/concepts/agent)
