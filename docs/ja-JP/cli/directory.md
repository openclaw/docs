---
read_when:
    - チャネルの連絡先/グループ/自分の ID を調べたい
    - チャネルディレクトリアダプターを開発しています
summary: '`openclaw directory` の CLI リファレンス（self、peers、groups）'
title: ディレクトリ
x-i18n:
    generated_at: "2026-05-02T20:43:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 011f762d6f53605a37bd12b31c767594c0efa5681da4b2aabe7fb358751b1542
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

対応しているチャンネル向けのディレクトリ検索（連絡先/ピア、グループ、および「me」）。

## 共通フラグ

- `--channel <name>`: チャンネルID/エイリアス（複数のチャンネルが設定されている場合は必須。1つだけ設定されている場合は自動）
- `--account <id>`: アカウントID（デフォルト: チャンネルのデフォルト）
- `--json`: JSONを出力

## 注意

- `directory` は、他のコマンド（特に `openclaw message send --target ...`）に貼り付けられるIDを見つけるためのものです。
- 多くのチャンネルでは、結果はライブのプロバイダーディレクトリではなく、設定に基づきます（許可リスト / 設定済みグループ）。
- インストール済みのチャンネルPluginでもディレクトリ対応を省略できます。その場合、コマンドはPluginを再インストールするのではなく、未対応のディレクトリ操作を報告します。
- デフォルト出力はタブ区切りの `id`（場合によっては `name`）です。スクリプト用途には `--json` を使用してください。

## `message send` で結果を使用する

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## ID形式（チャンネル別）

- WhatsApp: `+15551234567`（DM）、`1234567890-1234567890@g.us`（グループ）、`120363123456789@newsletter`（チャンネル/ニュースレターの送信先ターゲット）
- Telegram: `@username` または数値チャットID。グループは数値IDです
- Slack: `user:U…` と `channel:C…`
- Discord: `user:<id>` と `channel:<id>`
- Matrix（Plugin）: `user:@user:server`、`room:!roomId:server`、または `#alias:server`
- Microsoft Teams（Plugin）: `user:<id>` と `conversation:<id>`
- Zalo（Plugin）: ユーザーID（Bot API）
- Zalo Personal / `zalouser`（Plugin）: `zca`（`me`、`friend list`、`group list`）からのスレッドID（DM/グループ）

## 自分（「me」）

```bash
openclaw directory self --channel zalouser
```

## ピア（連絡先/ユーザー）

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## グループ

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```

## 関連

- [CLIリファレンス](/ja-JP/cli)
