---
read_when:
    - pairing モードの DM を使っていて送信者を承認する必要がある場合
summary: '`openclaw pairing` の CLI リファレンス（ペアリングリクエストの承認/一覧表示）'
title: ペアリング
x-i18n:
    generated_at: "2026-04-24T04:51:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e81dc407138e958e41d565b0addb600ad1ba5187627bb219f0b85b92bd112d1
    source_path: cli/pairing.md
    workflow: 15
---

# `openclaw pairing`

DM ペアリングリクエストを承認または確認します（ペアリングをサポートするチャネル向け）。

関連:

- ペアリングフロー: [Pairing](/ja-JP/channels/pairing)

## コマンド

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve <code>
openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## `pairing list`

1 つのチャネルの保留中ペアリングリクエストを一覧表示します。

オプション:

- `[channel]`: 位置引数のチャネル ID
- `--channel <channel>`: 明示的なチャネル ID
- `--account <accountId>`: マルチアカウントチャネル用のアカウント ID
- `--json`: 機械可読出力

注記:

- ペアリング可能なチャネルが複数設定されている場合は、位置引数または `--channel` でチャネルを指定する必要があります。
- チャネル ID が有効である限り、拡張チャネルも利用できます。

## `pairing approve`

保留中のペアリングコードを承認し、その送信者を許可します。

使用方法:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- ペアリング可能なチャネルがちょうど 1 つだけ設定されている場合は `openclaw pairing approve <code>`

オプション:

- `--channel <channel>`: 明示的なチャネル ID
- `--account <accountId>`: マルチアカウントチャネル用のアカウント ID
- `--notify`: 同じチャネル上でリクエスターに確認メッセージを返送する

## 注記

- チャネル入力は、位置引数（`pairing list telegram`）または `--channel <channel>` で渡します。
- `pairing list` は、マルチアカウントチャネル向けに `--account <accountId>` をサポートします。
- `pairing approve` は `--account <accountId>` と `--notify` をサポートします。
- ペアリング可能なチャネルが 1 つだけ設定されている場合は、`pairing approve <code>` を使えます。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [チャネルペアリング](/ja-JP/channels/pairing)
