---
read_when:
    - チャネルの連絡先、グループ、自分自身の ID を検索する場合
    - チャネルディレクトリアダプターを開発しています
summary: '`openclaw directory`（自分、ピア、グループ）の CLI リファレンス'
title: ディレクトリ
x-i18n:
    generated_at: "2026-07-11T22:07:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e1a952525f79dcb6eedb87eb433be7cb378fa19de5f252521e287d2c52275c
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

対応するチャネルのディレクトリ検索：連絡先/ピア、グループ、および「自分」（本人）。

結果は、特に `openclaw message send --target ...` など、ほかのコマンドに貼り付けて使用することを想定しています。

## 共通フラグ

- `--channel <name>`：チャネル ID/エイリアス（複数のチャネルが設定されている場合は必須。1 つだけ設定されている場合は自動選択）
- `--account <id>`：アカウント ID（デフォルト：チャネルのデフォルト）
- `--json`：JSON を出力

デフォルト（非 JSON）の出力は、`id`（場合によっては `name` も）をタブで区切った形式です。

## 注意事項

- 多くのチャネルでは、結果はプロバイダーのライブディレクトリではなく、設定（許可リスト/設定済みグループ）に基づきます。
- インストール済みのチャネル Plugin がディレクトリをサポートしていない場合があります。その場合、コマンドは未対応の操作として報告します。サポートを追加するために Plugin の再インストールやアップグレードを試みることはありません。

## `message send` で結果を使用する

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## チャネル別の ID 形式

| チャネル                            | ターゲット ID の形式                                                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| WhatsApp                            | `+15551234567`（DM）、`1234567890-1234567890@g.us`（グループ）、`120363123456789@newsletter`（チャネル/ニュースレター、送信専用） |
| Signal                              | 設定済みエイリアスは、E.164/UUID の DM ターゲットまたは `group:<id>` のグループターゲットに解決されます                |
| Telegram                            | `@username` または数値のチャット ID。グループには数値 ID を使用します                                                  |
| Slack                               | `user:U…` および `channel:C…`                                                                                           |
| Discord                             | `user:<id>` および `channel:<id>`                                                                                       |
| Matrix（Plugin）                    | `user:@user:server`、`room:!roomId:server`、または `#alias:server`                                                      |
| Microsoft Teams（Plugin）           | `user:<id>` および `conversation:<id>`                                                                                  |
| Zalo（Plugin）                      | ユーザー ID（Bot API）                                                                                                  |
| Zalo Personal / `zalouser`（Plugin） | `zca`（`me`、`friend list`、`group list`）から取得したスレッド ID（DM/グループ）                                       |

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

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
