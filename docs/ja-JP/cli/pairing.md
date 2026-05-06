---
read_when:
    - ペアリングモードのダイレクトメッセージを使用しており、送信者を承認する必要があります
summary: '`openclaw pairing` の CLI リファレンス（ペアリングリクエストの承認/一覧表示）'
title: ペアリング
x-i18n:
    generated_at: "2026-05-06T17:53:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 022018239ab1134b18986be42b8e019f412a1a730a9671f422979909c4a31dc5
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

DM ペアリングリクエストを承認または確認します（ペアリングに対応するチャネル向け）。

関連:

- ペアリングフロー: [ペアリング](/ja-JP/channels/pairing)

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

1 つのチャネルの保留中のペアリングリクエストを一覧表示します。

オプション:

- `[channel]`: 位置引数のチャネル ID
- `--channel <channel>`: 明示的なチャネル ID
- `--account <accountId>`: マルチアカウントチャネル用のアカウント ID
- `--json`: 機械可読な出力

注記:

- ペアリング対応チャネルが複数設定されている場合は、位置引数または `--channel` でチャネルを指定する必要があります。
- 拡張チャネルは、チャネル ID が有効であれば使用できます。

## `pairing approve`

保留中のペアリングコードを承認し、その送信者を許可します。

使用方法:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- ペアリング対応チャネルが 1 つだけ設定されている場合は `openclaw pairing approve <code>`

オプション:

- `--channel <channel>`: 明示的なチャネル ID
- `--account <accountId>`: マルチアカウントチャネル用のアカウント ID
- `--notify`: 同じチャネルでリクエスト元に確認を送り返します

オーナーのブートストラップ:

- ペアリングコードを承認した時点で `commands.ownerAllowFrom` が空の場合、OpenClaw は承認済みの送信者もコマンドオーナーとして記録し、`telegram:123456789` のようなチャネルスコープのエントリを使用します。
- これは最初のオーナーだけをブートストラップします。以降のペアリング承認では `commands.ownerAllowFrom` を置き換えたり拡張したりしません。
- コマンドオーナーは、オーナー専用コマンドを実行し、`/diagnostics`、`/export-trajectory`、`/config`、exec 承認などの危険な操作を承認できる人間のオペレーターアカウントです。

## 注記

- チャネル入力: 位置引数（`pairing list telegram`）または `--channel <channel>` で渡します。
- `pairing list` は、マルチアカウントチャネル向けに `--account <accountId>` をサポートします。
- `pairing approve` は `--account <accountId>` と `--notify` をサポートします。
- ペアリング対応チャネルが 1 つだけ設定されている場合は、`pairing approve <code>` を使用できます。
- このブートストラップが存在する前に送信者を承認していた場合は、`openclaw doctor` を実行してください。コマンドオーナーが設定されていないと警告し、修正用の `openclaw config set commands.ownerAllowFrom ...` コマンドを表示します。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [チャネルペアリング](/ja-JP/channels/pairing)
