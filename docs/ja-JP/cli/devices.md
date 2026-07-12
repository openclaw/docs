---
read_when:
    - デバイスのペアリング要求を承認しています
    - デバイストークンをローテーションまたは失効させる必要がある場合
summary: '`openclaw devices` の CLI リファレンス（デバイスのペアリング + トークンのローテーション/失効）'
title: デバイス
x-i18n:
    generated_at: "2026-07-11T22:02:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fb10f7a484fec06bfa5e53ae50181b12a9724746176bbace330ec468235494
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

デバイスのペアリング要求とデバイス単位のトークンを管理します。

## 共通オプション

- `--url <url>`: Gateway WebSocket URL（設定されている場合、デフォルトは `gateway.remote.url`）
- `--token <token>`: Gateway トークン（必要な場合）
- `--password <password>`: Gateway パスワード（パスワード認証）
- `--timeout <ms>`: RPC タイムアウト
- `--json`: JSON 出力（スクリプトでの使用を推奨）

<Warning>
`--url` を設定すると、CLI は設定または環境の認証情報にフォールバックしません。`--token` または `--password` を明示的に渡してください。渡さない場合、コマンドはエラーになります。
</Warning>

## コマンド

### `openclaw devices list`

保留中のペアリング要求とペアリング済みデバイスを一覧表示します。

```bash
openclaw devices list
openclaw devices list --json
```

すでにペアリング済みのデバイスから保留中の要求がある場合、出力ではデバイスの現在承認済みアクセスの横に要求されたアクセスが表示されるため、ペアリングが失われたように見えるのではなく、スコープやロールのアップグレードを確認できます。

ペアリング済みデバイスの表示名には、オペレーターラベル（`devices rename` の `operatorLabel`）、クライアントの `displayName`、`clientId`、`deviceId` の順で優先順位が適用されます。

### `openclaw devices approve [requestId] [--latest]`

正確な `requestId` を指定して、保留中のペアリング要求を承認します。`requestId` を省略するか `--latest` を渡すと、最新の保留中要求をプレビューするだけで終了します（終了コード 1）。承認するには、正確な要求 ID を指定して再実行してください。

```bash
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

<Note>
デバイスが認証情報（ロール、スコープ、または公開鍵）を変更してペアリングを再試行すると、OpenClaw は以前の保留中エントリを新しい `requestId` で置き換えます。承認の直前に `openclaw devices list` を実行して、現在の ID を取得してください。
</Note>

承認の動作:

- デバイスがすでにペアリング済みで、より広いスコープまたはロールを要求した場合、OpenClaw は既存の承認を維持し、新しい保留中のアップグレード要求を作成します。承認する前に、`openclaw devices list` の `Requested` と `Approved` を比較するか、`--latest` でプレビューしてください。
- `node` ロールまたはその他の非オペレーターロールを承認するには、`operator.admin` が必要です。オペレーターデバイスの承認には `operator.pairing` で十分ですが、要求されたオペレータースコープが呼び出し元自身のスコープ内に収まる場合に限ります。[オペレータースコープ](/ja-JP/gateway/operator-scopes)を参照してください。
- `gateway.nodes.pairing.autoApproveCidrs` が設定されている場合、一致するクライアント IP からの初回の `role: node` 要求は、この一覧に表示される前に自動承認されることがあります。デフォルトでは無効で、オペレーター／ブラウザクライアントまたはアップグレード要求には適用されません。
- `gateway.nodes.pairing.sshVerify`（デフォルトで有効）は、Gateway が SSH 経由で Node ホストのデバイス鍵を検証した場合、初回の `role: node` 要求を自動承認します。そのため、要求は表示された直後に承認済みになることがあります。SSH 検証を無効にするには `sshVerify: false` を設定してください。これは `autoApproveCidrs` とは独立しているため、手動のみのペアリングにするには、そちらも未設定にしてください。

### `openclaw devices reject <requestId>`

保留中のデバイスペアリング要求を拒否します。

```bash
openclaw devices reject <requestId>
```

### `openclaw devices remove <deviceId>`

ペアリング済みデバイスのエントリを 1 件削除します。

```bash
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

ペアリング済みデバイストークンで認証された呼び出し元は、**自身の**デバイスエントリのみ削除できます。別のデバイスを削除するには `operator.admin` が必要です。

### `openclaw devices rename --device <id> --name <label>`

ペアリング済みデバイスにオペレーターラベルを割り当てます。ラベルは所有者側の状態です。ペアリングの修復やロールの再承認後も維持され、安定した `deviceId` は変更されません。

```bash
openclaw devices rename --device <deviceId> --name "Kitchen Mac"
openclaw devices rename --device <deviceId> --name "Kitchen Mac" --json
```

- `--name` は必須で、前後の空白が除去され、空でない必要があり、最大 64 文字です。
- 表示画面（CLI 一覧、Control UI インベントリ）では、クライアントが報告した表示名よりもオペレーターラベルが優先されます。
- 管理者でないペアリング済みデバイスの呼び出し元は、**自身の**デバイスのみ名前を変更できます。別のデバイスの名前を変更するには `operator.admin` が必要です。

### `openclaw devices clear --yes [--pending]`

ペアリング済みデバイスを一括消去します。`--yes` による確認が必要です。

```bash
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

`--pending` を指定すると、保留中のすべてのペアリング要求も拒否します。

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

ロールのデバイストークンをローテーションし、必要に応じてスコープを更新します。

```bash
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

- 対象ロールは、そのデバイスの承認済みペアリング契約にすでに存在している必要があります。ローテーションによって未承認の新しいロールを発行することはできません。
- `--scope` を省略すると、以降の再接続時に、保存されたトークンのキャッシュ済み承認スコープが再利用されます。明示的な `--scope` 値を渡すと、今後のキャッシュ済みトークンによる再接続で使用される保存済みスコープセットが置き換えられます。
- 管理者でないペアリング済みデバイスの呼び出し元は、**自身の**デバイストークンのみローテーションでき、対象スコープセットは呼び出し元自身のオペレータースコープ内に収まる必要があります。ローテーションによって、呼び出し元がすでに持つトークンより広いトークンを発行または維持することはできません。

ローテーションのメタデータを JSON として返します。呼び出し元がそのデバイストークンで認証中に自身のトークンをローテーションした場合、クライアントが再接続前に保存できるよう、応答には置換後のトークンが含まれます。共有トークンまたは管理者によるローテーションでは、Bearer トークンが応答に含まれることはありません。

### `openclaw devices revoke --device <id> --role <role>`

ロールのデバイストークンを失効させます。

```bash
openclaw devices revoke --device <deviceId> --role node
```

管理者でないペアリング済みデバイスの呼び出し元は、**自身の**デバイストークンのみ失効させることができます。別のデバイスのトークンを失効させるには `operator.admin` が必要です。対象スコープセットも、呼び出し元自身のオペレータースコープ内に収まる必要があります。ペアリング専用の呼び出し元は、管理者／書き込みオペレータートークンを失効させることはできません。

## 注記

- これらのコマンドには `operator.pairing`（または `operator.admin`）スコープが必要です。非オペレーターのデバイスロールには常に `operator.admin` が必要です。[オペレータースコープ](/ja-JP/gateway/operator-scopes)を参照してください。
- トークンのローテーションと失効は、デバイスの承認済みペアリングロールセットおよびスコープ基準内に限定されます。無関係なキャッシュ済みトークンエントリによって、トークン管理の対象が追加されることはありません。
- ペアリング済みデバイストークンのセッションでは、デバイスをまたぐ管理（`remove`、`rename`、`rotate`、`revoke`）は、呼び出し元が `operator.admin` を持たない限り自身のデバイスに限定されます。
- トークンのローテーションでは新しいトークン（機密情報）が返されます。シークレットとして扱ってください。
- local loopback でペアリングスコープを使用できず、明示的な `--url` が渡されていない場合、`list`／`approve` はローカルのペアリング状態にフォールバックできます。

## トークン不整合の復旧チェックリスト

Control UI またはその他のクライアントで `AUTH_TOKEN_MISMATCH`、`AUTH_DEVICE_TOKEN_MISMATCH`、または `AUTH_SCOPE_MISMATCH` が繰り返し発生する場合に使用してください。

1. 現在の Gateway トークンの取得元を確認します。

   ```bash
   openclaw config get gateway.auth.token
   ```

2. ペアリング済みデバイスを一覧表示し、影響を受けるデバイス ID を特定します。

   ```bash
   openclaw devices list
   ```

3. 影響を受けるデバイスのオペレータートークンをローテーションします。

   ```bash
   openclaw devices rotate --device <deviceId> --role operator
   ```

4. ローテーションだけでは不十分な場合は、古いペアリングを削除して再度承認します。

   ```bash
   openclaw devices remove <deviceId>
   openclaw devices list
   openclaw devices approve <requestId>
   ```

5. 現在の共有トークン／パスワードを使用してクライアント接続を再試行します。

注記:

- 通常の再接続時の認証優先順位は、明示的な共有トークン／パスワード、明示的な `deviceToken`、保存済みデバイストークン、ブートストラップトークンの順です。
- 信頼できる `AUTH_TOKEN_MISMATCH` の復旧では、回数を限定した 1 回の再試行で、共有トークンと保存済みデバイストークンの両方を一時的に同時送信できます。
- `AUTH_SCOPE_MISMATCH` は、デバイストークンは認識されたものの、要求されたスコープセットを保持していないことを意味します。共有 Gateway 認証を変更する前に、ペアリング／スコープ承認契約を修正してください。

関連項目:

- [ダッシュボード認証のトラブルシューティング](/ja-JP/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway のトラブルシューティング](/ja-JP/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Paperclip／`openclaw_gateway` の初回実行時承認

`openclaw_gateway` アダプター経由で接続する Paperclip エージェントは、他の新規クライアントと同じ初回実行時のデバイスペアリング承認を経ます。Paperclip が `openclaw_gateway_pairing_required` を報告した場合は、保留中のデバイスを承認して再試行してください。

```bash
openclaw devices approve --latest
```

プレビューには、正確な `openclaw devices approve <requestId>` コマンドが表示されます。詳細を確認してから、要求 ID を指定してそのコマンドを再実行し、承認してください。リモート Gateway または明示的な認証情報を使用する場合は、プレビュー時と承認時に同じオプションを渡してください。

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

再起動のたびに再承認する必要がないようにするには、Paperclip が実行ごとに新しい一時的なデバイス ID を生成するのではなく、永続的な `adapterConfig.devicePrivateKeyPem` を設定してください。

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

承認が繰り返し失敗する場合は、まず `openclaw devices list` を実行して、保留中の要求が存在することを確認してください。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [Node](/ja-JP/nodes)
