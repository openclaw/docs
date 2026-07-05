---
read_when:
    - デバイスのペアリング要求を承認しています
    - デバイストークンをローテーションまたは取り消す必要がある
summary: '`openclaw devices` のCLIリファレンス（デバイスペアリング + トークンのローテーション/失効）'
title: デバイス
x-i18n:
    generated_at: "2026-07-05T11:07:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d6233acac966b3fd83618935e732366a40650503cb2e21b347e93be3e1ce5d5
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

デバイスのペアリングリクエストとデバイススコープのトークンを管理します。

## 共通オプション

- `--url <url>`: Gateway WebSocket URL（設定されている場合はデフォルトで `gateway.remote.url`）
- `--token <token>`: Gateway トークン（必要な場合）
- `--password <password>`: Gateway パスワード（パスワード認証）
- `--timeout <ms>`: RPC タイムアウト
- `--json`: JSON 出力（スクリプトでは推奨）

<Warning>
`--url` を設定すると、CLI は設定や環境の認証情報にフォールバックしません。`--token` または `--password` を明示的に渡してください。渡さない場合、コマンドはエラーになります。
</Warning>

## コマンド

### `openclaw devices list`

保留中のペアリングリクエストとペアリング済みデバイスを一覧表示します。

```bash
openclaw devices list
openclaw devices list --json
```

すでにペアリング済みのデバイスに対する保留中リクエストでは、出力に要求されたアクセスがデバイスの現在承認済みアクセスの横に表示されるため、スコープ/ロールのアップグレードが、ペアリングの消失のように見えずに確認できます。

### `openclaw devices approve [requestId] [--latest]`

正確な `requestId` で保留中のペアリングリクエストを承認します。`requestId` を省略するか、`--latest` を渡した場合は、最新の保留中リクエストをプレビューするだけで終了します（コード 1）。承認するには、正確なリクエスト ID を指定して再実行してください。

```bash
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

<Note>
デバイスが変更された認証詳細（ロール、スコープ、または公開鍵）でペアリングを再試行すると、OpenClaw は以前の保留中エントリを新しい `requestId` で置き換えます。承認の直前に `openclaw devices list` を実行し、現在の id を取得してください。
</Note>

承認の動作:

- デバイスがすでにペアリング済みで、より広いスコープまたはロールを要求している場合、OpenClaw は既存の承認を保持し、新しい保留中アップグレードリクエストを作成します。承認前に、`openclaw devices list` の `Requested` と `Approved` を比較するか、`--latest` でプレビューしてください。
- `node` ロールまたはその他の非オペレーターロールを承認するには `operator.admin` が必要です。オペレーターデバイスの承認には `operator.pairing` で十分ですが、要求されたオペレータースコープが呼び出し元自身のスコープ内に収まる場合に限ります。[オペレータースコープ](/ja-JP/gateway/operator-scopes)を参照してください。
- `gateway.nodes.pairing.autoApproveCidrs` が設定されている場合、一致するクライアント IP からの初回の `role: node` リクエストは、この一覧に表示される前に自動承認されることがあります。デフォルトでは無効です。オペレーター/ブラウザクライアントやアップグレードリクエストには適用されません。

### `openclaw devices reject <requestId>`

保留中のデバイスペアリングリクエストを拒否します。

```bash
openclaw devices reject <requestId>
```

### `openclaw devices remove <deviceId>`

ペアリング済みデバイスのエントリを 1 件削除します。

```bash
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

ペアリング済みデバイストークンで認証された呼び出し元は、**自分自身の**デバイスエントリのみ削除できます。別のデバイスを削除するには `operator.admin` が必要です。

### `openclaw devices clear --yes [--pending]`

ペアリング済みデバイスを一括でクリアします。`--yes` によって保護されています。

```bash
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

`--pending` は、保留中のすべてのペアリングリクエストも拒否します。

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

ロールのデバイストークンをローテーションし、必要に応じてスコープを更新します。

```bash
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

- 対象ロールは、そのデバイスの承認済みペアリング契約にすでに存在している必要があります。ローテーションで未承認の新しいロールを発行することはできません。
- `--scope` を省略すると、以降の再接続で保存済みトークンのキャッシュされた承認済みスコープが再利用されます。明示的な `--scope` 値を渡すと、今後のキャッシュ済みトークン再接続で使用される保存済みスコープセットが置き換えられます。
- 管理者ではないペアリング済みデバイスの呼び出し元は、**自分自身の**デバイストークンのみローテーションできます。また、対象スコープセットは呼び出し元自身のオペレータースコープ内に収まる必要があります。ローテーションで、呼び出し元がすでに持っている範囲より広いトークンを発行または保持することはできません。

ローテーションメタデータを JSON として返します。呼び出し元がそのデバイストークンで認証された状態で自分自身のトークンをローテーションした場合、レスポンスには置き換え用トークンが含まれるため、クライアントは再接続前にそれを保存できます。共有/管理者によるローテーションでは、ベアラートークンは返されません。

### `openclaw devices revoke --device <id> --role <role>`

ロールのデバイストークンを取り消します。

```bash
openclaw devices revoke --device <deviceId> --role node
```

管理者ではないペアリング済みデバイスの呼び出し元は、**自分自身の**デバイストークンのみ取り消せます。別のデバイスのトークンを取り消すには `operator.admin` が必要です。対象スコープセットも呼び出し元自身のオペレータースコープ内に収まる必要があります。ペアリング専用の呼び出し元は、管理者/書き込みオペレータートークンを取り消すことはできません。

## メモ

- これらのコマンドには `operator.pairing`（または `operator.admin`）スコープが必要です。非オペレーターデバイスロールには常に `operator.admin` が必要です。[オペレータースコープ](/ja-JP/gateway/operator-scopes)を参照してください。
- トークンのローテーションと取り消しは、デバイスの承認済みペアリングロールセットとスコープベースラインの範囲内にとどまります。無関係なキャッシュ済みトークンエントリによって、トークン管理の対象が付与されることはありません。
- ペアリング済みデバイストークンセッションでは、クロスデバイス管理（`remove`、`rotate`、`revoke`）は、呼び出し元が `operator.admin` を持たない限り自分自身のみです。
- トークンのローテーションは新しいトークン（機密情報）を返します。シークレットとして扱ってください。
- local loopback でペアリングスコープを利用できず、明示的な `--url` が渡されていない場合、`list`/`approve` はローカルのペアリング状態にフォールバックできます。

## トークンドリフト復旧チェックリスト

Control UI やその他のクライアントが `AUTH_TOKEN_MISMATCH`、`AUTH_DEVICE_TOKEN_MISMATCH`、または `AUTH_SCOPE_MISMATCH` で失敗し続ける場合に使用します。

1. 現在の Gateway トークンソースを確認します。

   ```bash
   openclaw config get gateway.auth.token
   ```

2. ペアリング済みデバイスを一覧表示し、影響を受けているデバイス id を特定します。

   ```bash
   openclaw devices list
   ```

3. 影響を受けているデバイスのオペレータートークンをローテーションします。

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

メモ:

- 通常の再接続認証の優先順位: 明示的な共有トークン/パスワード、次に明示的な `deviceToken`、次に保存済みデバイストークン、次にブートストラップトークン。
- 信頼済みの `AUTH_TOKEN_MISMATCH` 復旧では、1 回の限定的な再試行のために共有トークンと保存済みデバイストークンの両方を一時的に同時送信できます。
- `AUTH_SCOPE_MISMATCH` は、デバイストークンは認識されたものの、要求されたスコープセットを持っていないことを意味します。共有 Gateway 認証を変更する前に、ペアリング/スコープ承認契約を修正してください。

関連:

- [Dashboard 認証のトラブルシューティング](/ja-JP/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Paperclip / `openclaw_gateway` 初回実行時の承認

`openclaw_gateway` アダプターを通じて接続する Paperclip エージェントは、他の新しいクライアントと同じ初回実行時のデバイスペアリング承認を行います。Paperclip が `openclaw_gateway_pairing_required` を報告した場合は、保留中のデバイスを承認して再試行してください。

```bash
openclaw devices approve --latest
```

プレビューには、正確な `openclaw devices approve <requestId>` コマンドが出力されます。詳細を確認し、その後リクエスト ID を指定してそのコマンドを再実行し、承認してください。リモート Gateway または明示的な認証情報を使用する場合は、プレビュー時と承認時に同じオプションを渡します。

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

再起動のたびに再承認することを避けるには、実行ごとに新しい一時デバイス ID を生成させるのではなく、Paperclip で永続的な `adapterConfig.devicePrivateKeyPem` を設定します。

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

承認が失敗し続ける場合は、まず `openclaw devices list` を実行して保留中リクエストが存在することを確認してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Nodes](/ja-JP/nodes)
