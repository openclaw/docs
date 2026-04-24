---
read_when:
    - チャネルの連絡先/グループ/self IDを調べたい場合
    - チャネルディレクトリアダプターを開発している場合
summary: '`openclaw directory` のCLIリファレンス（self、peers、groups）'
title: ディレクトリ
x-i18n:
    generated_at: "2026-04-24T04:50:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: f63ed92469738501ae1f8f08aec3edf01d1f0f46008571ed38ccd9c77e5ba15e
    source_path: cli/directory.md
    workflow: 15
---

# `openclaw directory`

対応しているチャネル向けのディレクトリ検索（連絡先/peer、グループ、および「自分」）。

## 共通フラグ

- `--channel <name>`: チャネルID/エイリアス（複数のチャネルが設定されている場合は必須。1つだけ設定されている場合は自動判定）
- `--account <id>`: アカウントID（デフォルト: チャネルのデフォルト）
- `--json`: JSONで出力

## 注意

- `directory`は、他のコマンドに貼り付けられるIDを見つけるのに役立つことを目的としています（特に`openclaw message send --target ...`）。
- 多くのチャネルでは、結果はライブのプロバイダーディレクトリではなく、設定に基づくものです（許可リスト / 設定済みグループ）。
- デフォルト出力はタブ区切りの`id`（場合によっては`name`も）です。スクリプト用には`--json`を使用してください。

## `message send`で結果を使う

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## ID形式（チャネル別）

- WhatsApp: `+15551234567`（DM）、`1234567890-1234567890@g.us`（グループ）
- Telegram: `@username`または数値chat ID。グループは数値ID
- Slack: `user:U…`および`channel:C…`
- Discord: `user:<id>`および`channel:<id>`
- Matrix（Plugin）: `user:@user:server`、`room:!roomId:server`、または`#alias:server`
- Microsoft Teams（Plugin）: `user:<id>`および`conversation:<id>`
- Zalo（Plugin）: ユーザーID（Bot API）
- Zalo Personal / `zalouser`（Plugin）: `zca`からのスレッドID（DM/グループ）（`me`、`friend list`、`group list`）

## self（「自分」）

```bash
openclaw directory self --channel zalouser
```

## peers（連絡先/ユーザー）

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## groups

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```

## 関連

- [CLI reference](/ja-JP/cli)
