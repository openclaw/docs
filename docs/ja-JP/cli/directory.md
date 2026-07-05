---
read_when:
    - チャンネルの連絡先、グループ、自分の ID を調べたい
    - チャンネルディレクトリアダプターを開発しています
summary: '`openclaw directory`（自分、ピア、グループ）の CLI リファレンス'
title: ディレクトリ
x-i18n:
    generated_at: "2026-07-05T11:11:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e1a952525f79dcb6eedb87eb433be7cb378fa19de5f252521e287d2c52275c
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

対応しているチャンネル向けのディレクトリ検索: 連絡先/ピア、グループ、および「me」（自分）。

結果は他のコマンド、特に `openclaw message send --target ...` に貼り付けて使うことを想定しています。

## 共通フラグ

- `--channel <name>`: チャンネル ID/エイリアス（複数のチャンネルが設定されている場合は必須。1 つだけ設定されている場合は自動選択）
- `--account <id>`: アカウント ID（デフォルト: チャンネルのデフォルト）
- `--json`: JSON を出力

デフォルト（非 JSON）の出力は、タブで区切られた `id`（および場合によっては `name`）です。

## 注記

- 多くのチャンネルでは、結果はライブのプロバイダーディレクトリではなく、設定に基づくもの（許可リスト/設定済みグループ）です。
- すでにインストール済みのチャンネル Plugin がディレクトリサポートを持たない場合があります。その場合、コマンドはサポートされていない操作として報告します。サポートを追加するために Plugin の再インストールやアップグレードを試みることはありません。

## `message send` で結果を使う

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## チャンネル別 ID 形式

| チャンネル                          | ターゲット ID 形式                                                                                                          |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| WhatsApp                            | `+15551234567`（DM）、`1234567890-1234567890@g.us`（グループ）、`120363123456789@newsletter`（チャンネル/ニュースレター、送信のみ） |
| Signal                              | 設定済みエイリアスは E.164/UUID の DM ターゲット、または `group:<id>` のグループターゲットに解決されます                    |
| Telegram                            | `@username` または数値のチャット ID。グループは数値 ID を使います                                                          |
| Slack                               | `user:U…` と `channel:C…`                                                                                                  |
| Discord                             | `user:<id>` と `channel:<id>`                                                                                              |
| Matrix（Plugin）                    | `user:@user:server`、`room:!roomId:server`、または `#alias:server`                                                         |
| Microsoft Teams（Plugin）           | `user:<id>` と `conversation:<id>`                                                                                         |
| Zalo（Plugin）                      | ユーザー ID（Bot API）                                                                                                     |
| Zalo Personal / `zalouser`（Plugin） | `zca`（`me`、`friend list`、`group list`）からのスレッド ID（DM/グループ）                                                   |

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

- [CLI リファレンス](/ja-JP/cli)
