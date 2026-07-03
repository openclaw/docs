---
read_when:
    - チャンネルの連絡先/グループ/自分自身のIDを調べたい
    - あなたはチャネルディレクトリアダプターを開発しています
summary: '`openclaw directory` の CLI リファレンス（自分、ピア、グループ）'
title: ディレクトリ
x-i18n:
    generated_at: "2026-07-03T15:19:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d17f545ce0bbe23a6c1ba74e4d1b44b103cc985b52affe4b25fbc6a6d1121045
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

対応しているチャンネル向けのディレクトリ検索（連絡先/ピア、グループ、および「me」）。

## 共通フラグ

- `--channel <name>`: チャンネル ID/エイリアス（複数のチャンネルが設定されている場合は必須。1 つだけ設定されている場合は自動）
- `--account <id>`: アカウント ID（デフォルト: チャンネルのデフォルト）
- `--json`: JSON を出力

## 注記

- `directory` は、他のコマンド（特に `openclaw message send --target ...`）に貼り付けられる ID を見つけるためのものです。
- 多くのチャンネルでは、結果はライブプロバイダーディレクトリではなく、設定ベース（許可リスト / 設定済みグループ）です。
- インストール済みのチャンネル Plugin は、ディレクトリ対応を省略している場合があります。その場合、コマンドは Plugin を再インストールするのではなく、未対応のディレクトリ操作を報告します。
- デフォルト出力は、タブ区切りの `id`（場合によっては `name`）です。スクリプト用途には `--json` を使用してください。

## 結果を `message send` で使用する

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## ID 形式（チャンネル別）

- WhatsApp: `+15551234567`（DM）、`1234567890-1234567890@g.us`（グループ）、`120363123456789@newsletter`（Channel/Newsletter の送信先ターゲット）
- Signal: 設定済みエイリアスは、E.164/UUID の DM ターゲット、または `group:<id>` グループターゲットに解決されます
- Telegram: `@username` または数値のチャット ID。グループは数値 ID です
- Slack: `user:U…` と `channel:C…`
- Discord: `user:<id>` と `channel:<id>`
- Matrix（Plugin）: `user:@user:server`、`room:!roomId:server`、または `#alias:server`
- Microsoft Teams（Plugin）: `user:<id>` と `conversation:<id>`
- Zalo（Plugin）: ユーザー ID（Bot API）
- Zalo Personal / `zalouser`（Plugin）: `zca` からのスレッド ID（DM/グループ）（`me`、`friend list`、`group list`）

## 自分自身（「me」）

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
