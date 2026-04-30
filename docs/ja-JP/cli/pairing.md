---
read_when:
    - ペアリングモードのダイレクトメッセージを使用しており、送信者を承認する必要があります
summary: '`openclaw pairing` の CLI リファレンス（ペアリングリクエストの承認/一覧表示）'
title: ペアリング
x-i18n:
    generated_at: "2026-04-30T05:05:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: bffc70a8c08e298f42c8fbc2238fce06993572e72f333e87ad18dea3cf33fab5
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

DM ペアリング要求を承認または確認します（ペアリングをサポートするチャネル向け）。

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

1 つのチャネルの保留中のペアリング要求を一覧表示します。

オプション:

- `[channel]`: 位置指定のチャネル ID
- `--channel <channel>`: 明示的なチャネル ID
- `--account <accountId>`: 複数アカウント対応チャネルのアカウント ID
- `--json`: 機械可読出力

注:

- 複数のペアリング対応チャネルが設定されている場合は、位置指定または `--channel` でチャネルを指定する必要があります。
- チャネル ID が有効であれば、拡張チャネルも使用できます。

## `pairing approve`

保留中のペアリングコードを承認し、その送信者を許可します。

使用法:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- ペアリング対応チャネルが 1 つだけ設定されている場合は `openclaw pairing approve <code>`

オプション:

- `--channel <channel>`: 明示的なチャネル ID
- `--account <accountId>`: 複数アカウント対応チャネルのアカウント ID
- `--notify`: 同じチャネルで要求者に確認を返送します

所有者のブートストラップ:

- ペアリングコードを承認したときに `commands.ownerAllowFrom` が空の場合、OpenClaw は承認された送信者もコマンド所有者として記録します。その際、`telegram:123456789` のようなチャネルスコープのエントリを使用します。
- これは最初の所有者だけをブートストラップします。以降のペアリング承認で `commands.ownerAllowFrom` が置き換えられたり拡張されたりすることはありません。
- コマンド所有者とは、所有者専用コマンドを実行し、`/diagnostics`、`/export-trajectory`、`/config`、exec 承認などの危険な操作を承認できる人間のオペレーターアカウントです。

## 注

- チャネル入力: 位置指定（`pairing list telegram`）または `--channel <channel>` で渡します。
- `pairing list` は、複数アカウント対応チャネル向けに `--account <accountId>` をサポートしています。
- `pairing approve` は `--account <accountId>` と `--notify` をサポートしています。
- ペアリング対応チャネルが 1 つだけ設定されている場合は、`pairing approve <code>` を使用できます。
- このブートストラップが存在する前に送信者を承認した場合は、`openclaw doctor` を実行してください。コマンド所有者が設定されていない場合に警告し、修正用の `openclaw config set commands.ownerAllowFrom ...` コマンドを表示します。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [チャネルペアリング](/ja-JP/channels/pairing)
