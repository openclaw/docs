---
read_when:
    - スクリプトから agent の 1 ターンを実行したい（必要に応じて reply を配信）
summary: '`openclaw agent` の CLI リファレンス（Gateway 経由で agent の 1 ターンを送信）'
title: agent
x-i18n:
    generated_at: "2026-04-23T14:00:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ba3181d74e9a8d6d607ee62b18e1e6fd693e64e7789e6b29b7f7b1ccb7b69d0
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Gateway 経由で agent のターンを実行します（組み込み実行には `--local` を使用）。
設定済みの agent を直接指定するには `--agent <id>` を使用します。

少なくとも 1 つの session selector を渡してください。

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

関連:

- Agent send tool: [Agent send](/ja-JP/tools/agent-send)

## オプション

- `-m, --message <text>`: 必須のメッセージ本文
- `-t, --to <dest>`: session key の導出に使われる recipient
- `--session-id <id>`: 明示的な session id
- `--agent <id>`: agent id。routing bindings を上書きします
- `--thinking <level>`: agent の thinking level（`off`, `minimal`, `low`, `medium`, `high`、および `xhigh`, `adaptive`, `max` など provider がサポートするカスタム levels）
- `--verbose <on|off>`: session の verbose level を永続化します
- `--channel <channel>`: 配信 channel。main session channel を使う場合は省略します
- `--reply-to <target>`: 配信 target の上書き
- `--reply-channel <channel>`: 配信 channel の上書き
- `--reply-account <id>`: 配信 account の上書き
- `--local`: 組み込み agent を直接実行します（plugin registry の preload 後）
- `--deliver`: reply を選択した channel/target に送り返します
- `--timeout <seconds>`: agent timeout を上書きします（デフォルトは 600 または config 値）
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

## 注記

- Gateway モードでは、Gateway request が失敗すると組み込み agent にフォールバックします。最初から組み込み実行を強制するには `--local` を使用してください。
- `--local` でも最初に plugin registry を preload するため、plugin 提供の providers、tools、channels は組み込み実行中も引き続き利用できます。
- `--channel`、`--reply-channel`、`--reply-account` は、session routing ではなく reply 配信に影響します。
- このコマンドが `models.json` の再生成をトリガーした場合、SecretRef 管理の provider credentials は、解決済みの secret 平文ではなく、非シークレットの markers（たとえば env var 名、`secretref-env:ENV_VAR_NAME`、または `secretref-managed`）として永続化されます。
- marker の書き込みは source-authoritative です。OpenClaw は、解決済みランタイム secret 値からではなく、アクティブな source config snapshot から markers を永続化します。
