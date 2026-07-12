---
read_when:
    - ペアリングモードのDMを使用しており、送信者を承認する必要があります
summary: '`openclaw pairing` の CLI リファレンス（ペアリング要求の承認/一覧表示）'
title: ペアリング
x-i18n:
    generated_at: "2026-07-11T22:03:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca83ad9d9e55cfffd49301cb529b28df370c2dcff03484880f7cfc85ec2d6440
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

ペアリングに対応するチャンネルの DM ペアリングリクエストを承認または確認します（チャット DM のみ。Node/デバイスのペアリングには `openclaw devices` を使用します）。

関連項目: [ペアリングフロー](/ja-JP/channels/pairing)

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

1 つのチャンネルについて、保留中のペアリングリクエストを一覧表示します。

| オプション                | 説明                                       |
| ------------------------- | ------------------------------------------ |
| `[channel]`               | 位置引数で指定するチャンネル ID            |
| `--channel <channel>`     | 明示的に指定するチャンネル ID              |
| `--account <accountId>`   | 複数アカウント対応チャンネルのアカウント ID |
| `--json`                  | 機械可読形式の出力                         |

ペアリングに対応するチャンネルが複数設定されている場合は、位置引数または `--channel` でチャンネルを指定します。チャンネル ID が有効であれば、拡張チャンネルも使用できます。

## `pairing approve`

保留中のペアリングコードを承認し、その送信者を許可します。

使用方法:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- ペアリングに対応するチャンネルが 1 つだけ設定されている場合は `openclaw pairing approve <code>`

オプション: `--channel <channel>`、`--account <accountId>`、`--notify`（同じチャンネルでリクエスト元へ確認メッセージを送信します）。

### 所有者の初期設定

ペアリングコードを承認した時点で `commands.ownerAllowFrom` が空の場合、OpenClaw は承認した送信者をコマンド所有者としても記録し、`telegram:123456789` のようなチャンネルスコープのエントリを使用します。これは最初の所有者のみを初期設定します。以降のペアリング承認によって `commands.ownerAllowFrom` が置き換えられたり、拡張されたりすることはありません。

コマンド所有者とは、所有者専用コマンドを実行し、`/diagnostics`、`/export-trajectory`、`/config`、exec の承認などの危険な操作を承認できる人間のオペレーターアカウントです。ペアリングで許可されるのは、送信者がエージェントと会話することだけです。この 1 回限りの初期設定を除き、ペアリング自体によって所有者権限が付与されることはありません。

この初期設定が導入される前に送信者を承認していた場合は、`openclaw doctor` を実行してください。コマンド所有者が設定されていない場合に警告が表示され、修正に必要な `openclaw config set commands.ownerAllowFrom ...` コマンドが正確に示されます。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [チャンネルのペアリング](/ja-JP/channels/pairing)
