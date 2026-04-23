---
read_when:
    - デバイスのペアリング要求を承認している。
    - デバイストークンをローテーションまたは失効する必要がある。
summary: '`openclaw devices` のCLIリファレンス（デバイスのペアリング + トークンのローテーション/失効）'
title: devices
x-i18n:
    generated_at: "2026-04-23T14:01:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e58d2dff7fc22a11ff372f4937907977dab0ffa9f971b9c0bffeb3e347caf66
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

デバイスのペアリング要求とデバイススコープのトークンを管理します。

## コマンド

### `openclaw devices list`

保留中のペアリング要求とペアリング済みデバイスを一覧表示します。

```
openclaw devices list
openclaw devices list --json
```

保留中の要求の出力では、そのデバイスがすでにペアリング済みである場合、デバイスの現在の承認済みアクセスの横に要求されたアクセスが表示されます。これにより、スコープ/ロールのアップグレードが、ペアリングが失われたようには見えず、明示的になります。

### `openclaw devices remove <deviceId>`

1つのペアリング済みデバイスエントリーを削除します。

ペアリング済みデバイストークンで認証されている場合、非管理者の呼び出し元は**自分自身の**デバイスエントリーのみ削除できます。別のデバイスを削除するには `operator.admin` が必要です。

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

ペアリング済みデバイスを一括で消去します。

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

正確な `requestId` を指定して保留中のデバイスペアリング要求を承認します。`requestId`
を省略した場合、または `--latest` を渡した場合、OpenClawは選択された保留中の
要求を表示して終了するだけです。詳細を確認した後、正確な要求IDを指定して再度承認を実行してください。

注意: デバイスが変更された認証詳細（ロール/スコープ/公開鍵）でペアリングを再試行した場合、
OpenClawは以前の保留中エントリーを置き換え、新しい
`requestId` を発行します。現在のIDを使うために、承認直前に `openclaw devices list` を実行してください。

デバイスがすでにペアリング済みで、より広いスコープまたはより広いロールを要求した場合、
OpenClawは既存の承認を維持したまま、新しい保留中のアップグレード
要求を作成します。承認前に正確なアップグレード内容を確認するには、`openclaw devices list`
の `Requested` 列と `Approved` 列を確認するか、`openclaw devices approve --latest` を使用してください。

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

特定のロールに対してデバイストークンをローテーションします（必要に応じてスコープも更新します）。
対象ロールは、そのデバイスの承認済みペアリング契約内にすでに存在している必要があります。
ローテーションで新しい未承認ロールを発行することはできません。
`--scope` を省略した場合、保存されたローテーション済みトークンで後から再接続すると、その
トークンにキャッシュされている承認済みスコープが再利用されます。明示的な `--scope` 値を渡した場合、
それらが将来のキャッシュ済みトークン再接続用の保存済みスコープセットになります。
非管理者のペアリング済みデバイス呼び出し元は、**自分自身の**デバイストークンのみローテーションできます。
また、明示的な `--scope` 値は、呼び出し元セッション自身の
operatorスコープ内に収まっている必要があります。ローテーションで、呼び出し元がすでに持っているよりも広いoperatorトークンを発行することはできません。

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

新しいトークンpayloadをJSONで返します。

### `openclaw devices revoke --device <id> --role <role>`

特定のロールのデバイストークンを失効します。

非管理者のペアリング済みデバイス呼び出し元は、**自分自身の**デバイストークンのみ失効できます。
別のデバイスのトークンを失効するには `operator.admin` が必要です。

```
openclaw devices revoke --device <deviceId> --role node
```

失効結果をJSONで返します。

## 共通オプション

- `--url <url>`: Gateway WebSocket URL（設定されている場合は `gateway.remote.url` がデフォルト）。
- `--token <token>`: Gatewayトークン（必要な場合）。
- `--password <password>`: Gatewayパスワード（パスワード認証）。
- `--timeout <ms>`: RPCタイムアウト。
- `--json`: JSON出力（スクリプト用途に推奨）。

注意: `--url` を設定すると、CLIはconfigや環境変数の認証情報にフォールバックしません。
`--token` または `--password` を明示的に渡してください。明示的な認証情報がない場合はエラーになります。

## 注記

- トークンローテーションは新しいトークンを返します（機微情報）。シークレットとして扱ってください。
- これらのコマンドには `operator.pairing`（または `operator.admin`）スコープが必要です。
- トークンローテーションは、そのデバイスに対して承認済みのペアリングロールセットおよび承認済みスコープ
  ベースラインの範囲内に留まります。紛れ込んだキャッシュ済みトークンエントリーが新しい
  ローテーション対象を付与することはありません。
- ペアリング済みデバイストークンセッションでは、デバイスをまたぐ管理は管理者専用です:
  呼び出し元が `operator.admin` を持たない限り、`remove`、`rotate`、`revoke` は
  自分自身に対してのみ実行できます。
- `devices clear` は意図的に `--yes` で保護されています。
- local loopback でペアリングスコープが利用できない場合（かつ明示的な `--url` が渡されていない場合）、list/approve はローカルペアリングフォールバックを使用できます。
- `devices approve` では、トークンを発行する前に明示的な要求IDが必要です。`requestId` を省略するか `--latest` を渡した場合は、最新の保留中要求をプレビューするだけです。

## トークンドリフト復旧チェックリスト

Control UIやその他のクライアントが `AUTH_TOKEN_MISMATCH` または `AUTH_DEVICE_TOKEN_MISMATCH` で失敗し続ける場合は、これを使用してください。

1. 現在のGatewayトークンソースを確認します:

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

- 通常の再接続認証の優先順位は、明示的な共有トークン/パスワードが先で、その後に明示的な `deviceToken`、保存済みデバイストークン、bootstrap token の順です。
- 信頼された `AUTH_TOKEN_MISMATCH` 復旧では、1回の制限付き再試行に限り、共有トークンと保存済みデバイストークンの両方を一時的に一緒に送信できます。

関連:

- [Dashboard auth troubleshooting](/ja-JP/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway troubleshooting](/ja-JP/gateway/troubleshooting#dashboard-control-ui-connectivity)
