---
read_when:
    - ペアリングモードのDMを使用しており、送信者を承認する必要があります
summary: '`openclaw pairing` の CLI リファレンス（ペアリング要求の承認/一覧表示）'
title: ペアリング
x-i18n:
    generated_at: "2026-07-05T11:12:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca83ad9d9e55cfffd49301cb529b28df370c2dcff03484880f7cfc85ec2d6440
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

ペアリングをサポートするチャネルの DM ペアリング要求を承認または確認します（チャット DM のみ - ノード/デバイスのペアリングには `openclaw devices` を使用します）。

関連: [ペアリングフロー](/ja-JP/channels/pairing)

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

| オプション              | 説明                                  |
| ----------------------- | ------------------------------------- |
| `[channel]`             | 位置引数のチャネル ID                 |
| `--channel <channel>`   | 明示的なチャネル ID                   |
| `--account <accountId>` | 複数アカウントチャネル用のアカウント ID |
| `--json`                | 機械可読な出力                        |

ペアリング対応チャネルが複数設定されている場合は、チャネルを位置引数または `--channel` で渡します。拡張チャネルは、チャネル ID が有効であれば動作します。

## `pairing approve`

保留中のペアリングコードを承認し、その送信者を許可します。

使用方法:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- ペアリング対応チャネルがちょうど 1 つ設定されている場合は `openclaw pairing approve <code>`

オプション: `--channel <channel>`、`--account <accountId>`、`--notify`（同じチャネルで要求者に確認を送り返します）。

### 所有者のブートストラップ

ペアリングコードを承認した時点で `commands.ownerAllowFrom` が空の場合、OpenClaw は承認された送信者もコマンド所有者として記録します。たとえば `telegram:123456789` のようなチャネルスコープのエントリを使用します。これは最初の所有者だけをブートストラップします。以降のペアリング承認が `commands.ownerAllowFrom` を置き換えたり拡張したりすることはありません。

コマンド所有者は、所有者専用コマンドを実行し、`/diagnostics`、`/export-trajectory`、`/config`、exec 承認などの危険な操作を承認できる人間のオペレーターアカウントです。ペアリングは送信者がエージェントと会話できるようにするだけであり、この 1 回限りのブートストラップを超えて、それ自体が所有者権限を付与することはありません。

このブートストラップが存在する前に送信者を承認していた場合は、`openclaw doctor` を実行してください。コマンド所有者が設定されていない場合に警告し、修正に必要な正確な `openclaw config set commands.ownerAllowFrom ...` コマンドを表示します。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [チャネルペアリング](/ja-JP/channels/pairing)
