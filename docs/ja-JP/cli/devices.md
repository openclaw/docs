---
read_when:
    - デバイスペアリング要求を承認している
    - デバイストークンをローテーションまたは失効する必要がある
summary: '`openclaw devices` のCLIリファレンス（デバイスペアリング + トークンローテーション/失効）'
title: デバイス
x-i18n:
    generated_at: "2026-04-24T04:50:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4ae835807ba4b0aea1073b9a84410a10fa0394d7d34e49d645071108cea6a35
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

デバイスペアリング要求とデバイススコープ付きトークンを管理します。

## コマンド

### `openclaw devices list`

保留中のペアリング要求と、ペアリング済みデバイスを一覧表示します。

```
openclaw devices list
openclaw devices list --json
```

保留中要求の出力では、そのデバイスがすでにペアリング済みの場合、デバイスの現在承認済みアクセスの横に要求されたアクセスが表示されます。これにより、スコープ/roleのアップグレードが、ペアリングが失われたように見えるのではなく、明示的になります。

### `openclaw devices remove <deviceId>`

1つのペアリング済みデバイスエントリを削除します。

ペアリング済みデバイストークンで認証されている場合、非管理者の呼び出し元は**自分自身の**デバイスエントリのみ削除できます。他のデバイスを削除するには `operator.admin` が必要です。

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

ペアリング済みデバイスを一括削除します。

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

正確な `requestId` を指定して、保留中のデバイスペアリング要求を承認します。`requestId` を省略した場合、または `--latest` を渡した場合、OpenClawは選択された保留中要求を表示して終了するだけです。詳細を確認した後、正確な要求IDを指定して承認を再実行してください。

注記: デバイスが変更された認証詳細（role/scopes/public key）でペアリングを再試行した場合、OpenClawは以前の保留中エントリを置き換え、新しい `requestId` を発行します。現在のIDを使うため、承認直前に `openclaw devices list` を実行してください。

デバイスがすでにペアリング済みで、より広いscopesまたはより広いroleを要求した場合、OpenClawは既存の承認を維持したまま、新しい保留中アップグレード要求を作成します。承認前に、`openclaw devices list` の `Requested` 列と `Approved` 列を確認するか、`openclaw devices approve --latest` を使って正確なアップグレード内容をプレビューしてください。

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

保留中のデバイスペアリング要求を拒否します。

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

特定のroleに対してデバイストークンをローテーションします（必要に応じてscopesも更新します）。
対象roleは、そのデバイスの承認済みペアリング契約にすでに存在している必要があります。ローテーションで新しい未承認roleを発行することはできません。
`--scope` を省略した場合、保存済みのローテーション後トークンを使う後続の再接続では、そのトークンのキャッシュ済み承認scopesが再利用されます。明示的な `--scope` 値を渡した場合、それらが将来のキャッシュ済みトークン再接続用の保存scopeセットになります。
非管理者のペアリング済みデバイス呼び出し元は、**自分自身の**デバイストークンのみローテーションできます。また、明示的な `--scope` 値は、呼び出し元セッション自身のoperator scopes内に収まっていなければなりません。ローテーションで、呼び出し元がすでに持っているより広いoperatorトークンを発行することはできません。

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

新しいトークンペイロードをJSONで返します。

### `openclaw devices revoke --device <id> --role <role>`

特定のroleのデバイストークンを失効させます。

非管理者のペアリング済みデバイス呼び出し元は、**自分自身の**デバイストークンのみ失効できます。他のデバイスのトークンを失効するには `operator.admin` が必要です。

```
openclaw devices revoke --device <deviceId> --role node
```

失効結果をJSONで返します。

## 共通オプション

- `--url <url>`: Gateway WebSocket URL（設定されている場合はデフォルトで `gateway.remote.url`）。
- `--token <token>`: Gatewayトークン（必要な場合）。
- `--password <password>`: Gatewayパスワード（パスワード認証）。
- `--timeout <ms>`: RPCタイムアウト。
- `--json`: JSON出力（スクリプト利用に推奨）。

注記: `--url` を設定した場合、CLIは設定または環境変数の認証情報にフォールバックしません。`--token` または `--password` を明示的に渡してください。明示的な認証情報がない場合はエラーです。

## 注記

- トークンローテーションは新しいトークンを返します（機密情報）。シークレットとして扱ってください。
- これらのコマンドには `operator.pairing`（または `operator.admin`）scopeが必要です。
- トークンローテーションは、そのデバイスに対する承認済みペアリングroleセットと承認済みscopeベースラインの範囲内にとどまります。迷い込んだキャッシュ済みトークンエントリによって、新しいローテーション対象が付与されることはありません。
- ペアリング済みデバイストークンセッションでは、デバイスをまたいだ管理は管理者専用です: 呼び出し元が `operator.admin` を持たない限り、`remove`、`rotate`、`revoke` は自分自身のみ対象です。
- `devices clear` は意図的に `--yes` で保護されています。
- local loopbackでペアリングscopeが利用できない場合（かつ明示的な `--url` が渡されていない場合）、list/approve はローカルのペアリングフォールバックを使用できます。
- `devices approve` は、トークンを発行する前に明示的な要求IDを必要とします。`requestId` を省略した場合、または `--latest` を渡した場合は、最新の保留中要求をプレビューするだけです。

## トークンドリフト復旧チェックリスト

Control UIや他のクライアントが `AUTH_TOKEN_MISMATCH` または `AUTH_DEVICE_TOKEN_MISMATCH` で失敗し続ける場合に使います。

1. 現在のgatewayトークンソースを確認します:

```bash
openclaw config get gateway.auth.token
```

2. ペアリング済みデバイスを一覧表示し、影響を受けているdevice idを特定します:

```bash
openclaw devices list
```

3. 影響を受けているデバイスのoperatorトークンをローテーションします:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. ローテーションだけでは不十分な場合は、古いペアリングを削除して再承認します:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. 現在の共有トークン/パスワードでクライアント接続を再試行します。

注記:

- 通常の再接続認証の優先順位は、まず明示的な共有トークン/パスワード、次に明示的な `deviceToken`、次に保存済みデバイストークン、最後にブートストラップトークンです。
- 信頼できる `AUTH_TOKEN_MISMATCH` 復旧では、1回に限った制限付き再試行のため、一時的に共有トークンと保存済みデバイストークンの両方を一緒に送信できます。

関連:

- [Dashboard認証のトラブルシューティング](/ja-JP/web/dashboard#if-you-see-unauthorized-1008)
- [Gatewayトラブルシューティング](/ja-JP/gateway/troubleshooting#dashboard-control-ui-connectivity)

## 関連

- [CLIリファレンス](/ja-JP/cli)
- [Nodes](/ja-JP/nodes)
