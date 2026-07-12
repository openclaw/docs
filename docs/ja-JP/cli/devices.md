---
read_when:
    - デバイスのペアリング要求を承認しています
    - デバイストークンをローテーションまたは失効させる必要があります
summary: '`openclaw devices` の CLI リファレンス（デバイスのペアリング + トークンのローテーション/失効）'
title: デバイス
x-i18n:
    generated_at: "2026-07-12T14:21:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 83fb10f7a484fec06bfa5e53ae50181b12a9724746176bbace330ec468235494
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

デバイスのペアリング要求とデバイス単位のトークンを管理します。

## 共通オプション

- `--url <url>`: Gateway WebSocket URL（設定されている場合はデフォルトで `gateway.remote.url`）
- `--token <token>`: Gateway トークン（必要な場合）
- `--password <password>`: Gateway パスワード（パスワード認証）
- `--timeout <ms>`: RPC タイムアウト
- `--json`: JSON 出力（スクリプトでの利用を推奨）

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

すでにペアリング済みのデバイスに対する保留中の要求では、出力に要求されたアクセス権がデバイスで現在承認されているアクセス権と並んで表示されます。そのため、スコープやロールのアップグレードを、ペアリングが失われたように見誤ることなく確認できます。

ペアリング済みデバイスの表示名には、次の優先順位が適用されます。オペレーターラベル（`devices rename` の `operatorLabel`）、クライアントの `displayName`、`clientId`、`deviceId` の順です。

### `openclaw devices approve [requestId] [--latest]`

正確な `requestId` を指定して、保留中のペアリング要求を承認します。`requestId` を省略するか `--latest` を渡した場合、最新の保留中要求をプレビューするだけで終了します（終了コード 1）。承認するには、正確な要求 ID を指定して再実行してください。

```bash
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

<Note>
デバイスが認証の詳細（ロール、スコープ、または公開鍵）を変更してペアリングを再試行すると、OpenClaw は以前の保留中エントリを新しい `requestId` で置き換えます。承認の直前に `openclaw devices list` を実行して、現在の ID を取得してください。
</Note>

承認の動作:

- デバイスがすでにペアリング済みで、より広いスコープまたはロールを要求した場合、OpenClaw は既存の承認を維持し、新しい保留中のアップグレード要求を作成します。承認する前に、`openclaw devices list` で `Requested` と `Approved` を比較するか、`--latest` でプレビューしてください。
- `node` ロールまたはその他の非オペレーターロールを承認するには、`operator.admin` が必要です。オペレーターデバイスの承認には `operator.pairing` で十分ですが、要求されたオペレータースコープが呼び出し元自身のスコープ内に収まる場合に限ります。[オペレータースコープ](/ja-JP/gateway/operator-scopes)を参照してください。
- `gateway.nodes.pairing.autoApproveCidrs` が設定されている場合、一致するクライアント IP からの初回の `role: node` 要求は、この一覧に表示される前に自動承認されることがあります。デフォルトでは無効です。オペレーター／ブラウザークライアントやアップグレード要求には適用されません。
- `gateway.nodes.pairing.sshVerify`（デフォルトで有効）は、Gateway が SSH 経由でノードホストのデバイスキーを検証した場合、初回の `role: node` 要求を自動承認します。そのため、要求が表示された直後に承認済みになることがあります。SSH 検証を無効にするには `sshVerify: false` を設定します。これは `autoApproveCidrs` とは独立しているため、手動のみのペアリングにするには、そちらも未設定にしてください。

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

- `--name` は必須です。前後の空白が除去され、空ではない必要があり、最大 64 文字です。
- 表示箇所（CLI の一覧、Control UI のインベントリ）では、クライアントが報告した表示名よりもオペレーターラベルが優先されます。
- 管理者ではないペアリング済みデバイスの呼び出し元は、**自身の**デバイスのみ名前を変更できます。別のデバイスの名前を変更するには `operator.admin` が必要です。

### `openclaw devices clear --yes [--pending]`

ペアリング済みデバイスを一括で消去します。`--yes` による確認が必要です。

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

- 対象ロールは、そのデバイスで承認済みのペアリング契約にすでに存在している必要があります。ローテーションによって、未承認の新しいロールを発行することはできません。
- `--scope` を省略すると、以降の再接続時に、保存されたトークンでキャッシュされている承認済みスコープが再利用されます。明示的な `--scope` 値を渡すと、以降のキャッシュ済みトークンによる再接続で使用される、保存済みのスコープセットが置き換えられます。
- 管理者ではないペアリング済みデバイスの呼び出し元は、**自身の**デバイストークンのみローテーションできます。また、対象スコープセットは呼び出し元自身のオペレータースコープ内に収まる必要があります。ローテーションによって、呼び出し元がすでに持っているものより広いトークンを発行または維持することはできません。

ローテーションのメタデータを JSON として返します。呼び出し元がそのデバイストークンで認証中に自身のトークンをローテーションした場合、レスポンスには代替トークンが含まれるため、クライアントは再接続前にそれを保存できます。共有／管理者によるローテーションでは、ベアラートークンは返されません。

### `openclaw devices revoke --device <id> --role <role>`

ロールのデバイストークンを取り消します。

```bash
openclaw devices revoke --device <deviceId> --role node
```

管理者ではないペアリング済みデバイスの呼び出し元は、**自身の**デバイストークンのみ取り消せます。別のデバイスのトークンを取り消すには `operator.admin` が必要です。対象スコープセットも、呼び出し元自身のオペレータースコープ内に収まる必要があります。ペアリング専用の呼び出し元は、管理者／書き込みオペレータートークンを取り消せません。

## 注意事項

- これらのコマンドには `operator.pairing`（または `operator.admin`）スコープが必要です。非オペレーターのデバイスロールには、常に `operator.admin` が必要です。[オペレータースコープ](/ja-JP/gateway/operator-scopes)を参照してください。
- トークンのローテーションと取り消しは、デバイスで承認済みのペアリングロールセットとスコープの基準内に限定されます。孤立したキャッシュ済みトークンエントリによって、トークン管理の対象が付与されることはありません。
- ペアリング済みデバイストークンのセッションでは、デバイスをまたぐ管理（`remove`、`rename`、`rotate`、`revoke`）は、呼び出し元が `operator.admin` を持たない限り自身のデバイスのみに限定されます。
- トークンのローテーションでは新しいトークン（機密情報）が返されます。シークレットとして扱ってください。
- local loopback でペアリングスコープを利用できず、明示的な `--url` が渡されていない場合、`list`／`approve` はローカルのペアリング状態にフォールバックできます。

## トークンずれの復旧チェックリスト

Control UI またはその他のクライアントで `AUTH_TOKEN_MISMATCH`、`AUTH_DEVICE_TOKEN_MISMATCH`、または `AUTH_SCOPE_MISMATCH` が繰り返し発生する場合に使用してください。

1. 現在の Gateway トークンのソースを確認します。

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

4. ローテーションで解決しない場合は、古いペアリングを削除して再承認します。

   ```bash
   openclaw devices remove <deviceId>
   openclaw devices list
   openclaw devices approve <requestId>
   ```

5. 現在の共有トークン／パスワードを使用して、クライアント接続を再試行します。

注意事項:

- 通常の再接続時の認証優先順位は、明示的な共有トークン／パスワード、明示的な `deviceToken`、保存済みデバイストークン、ブートストラップトークンの順です。
- 信頼済みの `AUTH_TOKEN_MISMATCH` 復旧では、1 回の限定的な再試行のために、共有トークンと保存済みデバイストークンの両方を一時的に同時送信できます。
- `AUTH_SCOPE_MISMATCH` は、デバイストークンは認識されたものの、要求されたスコープセットを持っていないことを意味します。共有 Gateway 認証を変更する前に、ペアリング／スコープの承認契約を修正してください。

関連項目:

- [ダッシュボード認証のトラブルシューティング](/ja-JP/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway のトラブルシューティング](/ja-JP/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Paperclip／`openclaw_gateway` の初回実行時の承認

`openclaw_gateway` アダプターを介して接続する Paperclip エージェントは、他の新規クライアントと同じ初回実行時のデバイスペアリング承認を受けます。Paperclip が `openclaw_gateway_pairing_required` を報告した場合は、保留中のデバイスを承認して再試行してください。

```bash
openclaw devices approve --latest
```

プレビューには、正確な `openclaw devices approve <requestId>` コマンドが表示されます。詳細を確認してから、要求 ID を指定してそのコマンドを再実行し、承認してください。リモート Gateway または明示的な認証情報を使用する場合は、プレビュー時と承認時に同じオプションを渡します。

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

再起動のたびに再承認することを避けるには、実行ごとに新しい一時的なデバイス ID を生成させるのではなく、Paperclip で永続的な `adapterConfig.devicePrivateKeyPem` を設定します。

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
