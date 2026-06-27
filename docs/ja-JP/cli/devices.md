---
read_when:
    - デバイスのペアリングリクエストを承認しています
    - デバイストークンをローテーションまたは取り消す必要があります
summary: '`openclaw devices` の CLI リファレンス（デバイスペアリング + トークンのローテーション/失効）'
title: デバイス
x-i18n:
    generated_at: "2026-06-27T10:54:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08d6945af4fa2403a97dfec94af7bbd0dc746efe90d3e5b4c9f5c5d6d27d70a4
    source_path: cli/devices.md
    workflow: 16
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

保留中の要求の出力では、デバイスがすでにペアリング済みの場合、要求されたアクセスがデバイスの現在の承認済みアクセスの横に表示されます。これにより、スコープ/ロールのアップグレードが、ペアリングが失われたように見えるのではなく明示されます。

### `openclaw devices remove <deviceId>`

ペアリング済みデバイスエントリを 1 つ削除します。

ペアリング済みデバイストークンで認証している場合、非管理者の呼び出し元が削除できるのは**自分自身の**デバイスエントリだけです。別のデバイスを削除するには `operator.admin` が必要です。

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

ペアリング済みデバイスを一括でクリアします。

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

正確な `requestId` で、保留中のデバイスペアリング要求を承認します。`requestId` が省略された場合、または `--latest` が渡された場合、OpenClaw は選択された保留中の要求を表示して終了するだけです。詳細を確認した後、正確な要求 ID で承認を再実行してください。

<Note>
デバイスが変更された認証詳細（ロール、スコープ、または公開鍵）でペアリングを再試行すると、OpenClaw は以前の保留中エントリを置き換え、新しい `requestId` を発行します。承認の直前に `openclaw devices list` を実行して、現在の ID を使用してください。
</Note>

デバイスがすでにペアリング済みで、より広いスコープまたはより広いロールを要求する場合、OpenClaw は既存の承認を維持し、新しい保留中のアップグレード要求を作成します。承認前に、`openclaw devices list` の `Requested` と `Approved` の列を確認するか、`openclaw devices approve --latest` を使用して正確なアップグレードをプレビューしてください。

Gateway に `gateway.nodes.pairing.autoApproveCidrs` が明示的に設定されている場合、一致するクライアント IP からの初回 `role: node` 要求は、この一覧に表示される前に承認されることがあります。このポリシーはデフォルトで無効であり、operator/browser クライアントやアップグレード要求には適用されません。

Node またはその他の非 operator デバイスロールを承認するには `operator.admin` が必要です。`operator.pairing` は、要求された operator スコープが呼び出し元自身のスコープ内に収まる場合にのみ、operator デバイスの承認に十分です。承認時のチェックについては、[Operator スコープ](/ja-JP/gateway/operator-scopes)を参照してください。

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

## Paperclip / `openclaw_gateway` の初回実行時の承認

新しい Paperclip エージェントが初めて `openclaw_gateway` アダプター経由で接続する場合、Gateway は実行を成功させる前に 1 回限りのデバイスペアリング承認を要求することがあります。Paperclip が `openclaw_gateway_pairing_required` を報告した場合は、保留中のデバイスを承認してから再試行してください。

ローカル Gateway の場合は、最新の保留中要求をプレビューします。

```bash
openclaw devices approve --latest
```

プレビューには、正確な `openclaw devices approve <requestId>` コマンドが表示されます。要求の詳細を確認してから、要求 ID を指定してそのコマンドを再実行し、承認します。

リモート Gateway または明示的な認証情報の場合は、プレビューと承認の両方で同じオプションを渡します。

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

再起動後の再承認を避けるには、実行ごとに新しい一時 ID を生成するのではなく、Paperclip アダプター設定に永続的なデバイスキーを保持します。

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

承認が失敗し続ける場合は、まず `openclaw devices list` を実行して、保留中の要求が存在することを確認してください。

### `openclaw devices reject <requestId>`

保留中のデバイスペアリング要求を拒否します。

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

特定のロールのデバイストークンをローテーションします（必要に応じてスコープも更新します）。
対象ロールは、そのデバイスの承認済みペアリング契約にすでに存在している必要があります。ローテーションで未承認の新しいロールを発行することはできません。
`--scope` を省略した場合、保存されたローテーション後トークンで後から再接続すると、そのトークンのキャッシュ済み承認スコープが再利用されます。明示的な `--scope` 値を渡した場合、それらが将来のキャッシュトークン再接続で保存されるスコープセットになります。
非管理者のペアリング済みデバイス呼び出し元がローテーションできるのは、**自分自身の**デバイストークンだけです。
対象トークンのスコープセットは、呼び出し元セッション自身の operator スコープ内に収まる必要があります。ローテーションで、呼び出し元がすでに持つものより広い operator トークンを発行または維持することはできません。

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

ローテーションメタデータを JSON として返します。呼び出し元がそのデバイストークンで認証した状態で自分自身のトークンをローテーションしている場合、応答には置換トークンも含まれるため、クライアントは再接続前にそれを永続化できます。共有/管理者によるローテーションでは bearer token はエコーされません。

### `openclaw devices revoke --device <id> --role <role>`

特定のロールのデバイストークンを取り消します。

非管理者のペアリング済みデバイス呼び出し元が取り消せるのは、**自分自身の**デバイストークンだけです。
別のデバイスのトークンを取り消すには `operator.admin` が必要です。
対象トークンのスコープセットも、呼び出し元セッション自身の operator スコープ内に収まる必要があります。ペアリング専用の呼び出し元は、admin/write operator トークンを取り消せません。

```
openclaw devices revoke --device <deviceId> --role node
```

取り消し結果を JSON として返します。

## 共通オプション

- `--url <url>`: Gateway WebSocket URL（設定されている場合、デフォルトは `gateway.remote.url`）。
- `--token <token>`: Gateway トークン（必要な場合）。
- `--password <password>`: Gateway パスワード（パスワード認証）。
- `--timeout <ms>`: RPC タイムアウト。
- `--json`: JSON 出力（スクリプト用途に推奨）。

<Warning>
`--url` を設定した場合、CLI は設定または環境の認証情報にフォールバックしません。`--token` または `--password` を明示的に渡してください。明示的な認証情報がない場合はエラーです。
</Warning>

## 注記

- トークンのローテーションは新しいトークン（機密情報）を返します。シークレットとして扱ってください。
- これらのコマンドには `operator.pairing`（または `operator.admin`）スコープが必要です。一部の承認では、対象デバイスが発行または継承する operator スコープを、呼び出し元が保持していることも必要です。非 operator デバイスロールには `operator.admin` が必要です。[Operator スコープ](/ja-JP/gateway/operator-scopes)を参照してください。
- `gateway.nodes.pairing.autoApproveCidrs` は、新規 Node デバイスペアリング専用のオプトイン Gateway ポリシーです。CLI の承認権限は変更しません。
- トークンのローテーションと取り消しは、そのデバイスの承認済みペアリングロールセットと承認済みスコープベースラインの範囲内に留まります。孤立したキャッシュ済みトークンエントリは、トークン管理の対象権限を付与しません。
- ペアリング済みデバイストークンセッションでは、デバイスをまたぐ管理は管理者専用です。呼び出し元が `operator.admin` を持たない限り、`remove`、`rotate`、`revoke` は自分自身のみが対象です。
- トークン変更も呼び出し元スコープ内に制限されます。ペアリング専用セッションは、現在 `operator.admin` または `operator.write` を持つトークンをローテーションまたは取り消しできません。
- `devices clear` は意図的に `--yes` でガードされています。
- local loopback でペアリングスコープが利用できない場合（かつ明示的な `--url` が渡されていない場合）、list/approve はローカルペアリングフォールバックを使用できます。
- `devices approve` は、トークンを発行する前に明示的な要求 ID を必要とします。`requestId` を省略するか `--latest` を渡すと、最新の保留中要求をプレビューするだけです。

## トークンドリフト復旧チェックリスト

Control UI または他のクライアントが `AUTH_TOKEN_MISMATCH`、`AUTH_DEVICE_TOKEN_MISMATCH`、または `AUTH_SCOPE_MISMATCH` で失敗し続ける場合に使用します。

1. 現在の Gateway トークンソースを確認します。

```bash
openclaw config get gateway.auth.token
```

2. ペアリング済みデバイスを一覧表示し、影響を受けているデバイス ID を特定します。

```bash
openclaw devices list
```

3. 影響を受けているデバイスの operator トークンをローテーションします。

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. ローテーションだけでは不十分な場合は、古いペアリングを削除して再度承認します。

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. 現在の共有トークン/パスワードでクライアント接続を再試行します。

注記:

- 通常の再接続認証の優先順位は、明示的な共有トークン/パスワードが最初、次に明示的な `deviceToken`、次に保存済みデバイストークン、最後にブートストラップトークンです。
- 信頼できる `AUTH_TOKEN_MISMATCH` 復旧では、1 回の範囲限定再試行のために、共有トークンと保存済みデバイストークンの両方を一時的に一緒に送信できます。
- `AUTH_SCOPE_MISMATCH` は、デバイストークンは認識されたものの、要求されたスコープセットを持っていないことを意味します。共有 Gateway 認証を変更する前に、ペアリング/スコープ承認契約を修正してください。

関連:

- [Dashboard 認証のトラブルシューティング](/ja-JP/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#dashboard-control-ui-connectivity)

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Nodes](/ja-JP/nodes)
