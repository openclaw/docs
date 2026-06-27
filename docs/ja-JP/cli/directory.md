---
read_when:
    - チャンネルの連絡先/グループ/自分の ID を調べたい場合
    - チャネルディレクトリアダプターを開発している場合
summary: '`openclaw directory` のCLIリファレンス (自分、ピア、グループ)'
title: ディレクトリ
x-i18n:
    generated_at: "2026-05-06T17:52:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 855f9312790134f2d1da53ffbb106167c190155510a7bdef212b5d38c2fba0b3
    source_path: cli/directory.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw directory`

対応しているチャネル向けのディレクトリ検索（連絡先/ピア、グループ、および "me"）。

## 共通フラグ

- `--channel <name>`: チャネル ID/エイリアス（複数のチャネルが設定されている場合は必須。1 つだけ設定されている場合は自動）
- `--account <id>`: アカウント ID（デフォルト: チャネルのデフォルト）
- `--json`: JSON を出力

## 注記

- `directory` は、他のコマンド（特に `openclaw message send --target ...`）に貼り付けられる ID を見つけるためのものです。
- 多くのチャネルでは、結果はライブのプロバイダーディレクトリではなく、設定ベース（許可リスト / 設定済みグループ）です。
- インストール済みのチャネルプラグインでもディレクトリ対応を省略できます。その場合、コマンドはプラグインを再インストールするのではなく、未対応のディレクトリ操作を報告します。
- デフォルト出力は、タブで区切られた `id`（場合によっては `name` も）です。スクリプト用途には `--json` を使用してください。

## `message send` で結果を使用する

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## ID 形式（チャネル別）

- WhatsApp: `+15551234567`（DM）、`1234567890-1234567890@g.us`（グループ）、`120363123456789@newsletter`（チャネル/ニュースレターの送信先ターゲット）
- Telegram: `@username` または数値チャット ID。グループは数値 ID
- Slack: `user:U…` と `channel:C…`
- Discord: `user:<id>` と `channel:<id>`
- Matrix（Plugin）: `user:@user:server`、`room:!roomId:server`、または `#alias:server`
- Microsoft Teams（Plugin）: `user:<id>` と `conversation:<id>`
- Zalo（Plugin）: ユーザー ID（Bot API）
- Zalo Personal / `zalouser`（Plugin）: `zca` からのスレッド ID（DM/グループ）（`me`、`friend list`、`group list`）

## 自分（"me"）

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

- [CLI リファレンス](/ja-JP/cli)
