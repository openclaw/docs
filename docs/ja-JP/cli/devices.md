---
read_when:
    - デバイスのペアリングリクエストを承認しています
    - デバイストークンをローテーションまたは失効させる必要があります
summary: '`openclaw devices` の CLI リファレンス（デバイスペアリング + トークンのローテーション/失効）'
title: デバイス
x-i18n:
    generated_at: "2026-05-11T20:26:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: b38caf47697d5fd6c630285c53919f3a5eaf704b1992e57adb1902e20e2a0fc0
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

保留中の要求の出力では、デバイスがすでにペアリング済みの場合、要求されたアクセス権がデバイスの現在承認済みのアクセス権の横に表示されます。これにより、スコープ/ロールのアップグレードが、ペアリングが失われたように見えるのではなく、明示的に示されます。

### `openclaw devices remove <deviceId>`

ペアリング済みデバイスのエントリを1つ削除します。

ペアリング済みデバイストークンで認証されている場合、管理者でない呼び出し元は**自分自身の**デバイスエントリのみ削除できます。別のデバイスを削除するには `operator.admin` が必要です。

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

正確な `requestId` で保留中のデバイスペアリング要求を承認します。`requestId` が省略された場合、または `--latest` が渡された場合、OpenClaw は選択された保留中の要求だけを表示して終了します。詳細を確認した後、正確な要求 ID で承認を再実行してください。

<Note>
デバイスが認証の詳細（ロール、スコープ、または公開鍵）を変更してペアリングを再試行した場合、OpenClaw は以前の保留中エントリを置き換え、新しい `requestId` を発行します。承認直前に `openclaw devices list` を実行して、現在の ID を使用してください。
</Note>

デバイスがすでにペアリング済みで、より広いスコープまたはより広いロールを要求した場合、OpenClaw は既存の承認を維持し、新しい保留中のアップグレード要求を作成します。`openclaw devices list` の `Requested` 列と `Approved` 列を確認するか、`openclaw devices approve --latest` を使用して、承認前に正確なアップグレード内容をプレビューしてください。

Gateway が `gateway.nodes.pairing.autoApproveCidrs` で明示的に構成されている場合、一致するクライアント IP からの初回の `role: node` 要求は、この一覧に表示される前に承認されることがあります。このポリシーはデフォルトでは無効であり、オペレーター/ブラウザークライアントやアップグレード要求には適用されません。

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

特定のロールのデバイストークンをローテーションします（必要に応じてスコープも更新します）。
対象ロールは、そのデバイスの承認済みペアリング契約内にすでに存在している必要があります。ローテーションで未承認の新しいロールを発行することはできません。
`--scope` を省略した場合、保存されたローテーション済みトークンで後から再接続すると、そのトークンのキャッシュ済み承認スコープが再利用されます。明示的な `--scope` 値を渡した場合、それらが今後のキャッシュ済みトークン再接続で保存されるスコープセットになります。
管理者でないペアリング済みデバイスの呼び出し元は、**自分自身の**デバイストークンのみローテーションできます。
対象トークンのスコープセットは、呼び出し元セッション自身のオペレータースコープ内に収まっている必要があります。ローテーションによって、呼び出し元がすでに持っているものより広いオペレータートークンを発行または保持することはできません。

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

ローテーションのメタデータを JSON として返します。呼び出し元がそのデバイストークンで認証された状態で自分自身のトークンをローテーションしている場合、レスポンスには置き換え用トークンも含まれるため、クライアントは再接続前にそれを永続化できます。共有/管理者によるローテーションではベアラートークンは返されません。

### `openclaw devices revoke --device <id> --role <role>`

特定のロールのデバイストークンを取り消します。

管理者でないペアリング済みデバイスの呼び出し元は、**自分自身の**デバイストークンのみ取り消せます。
別のデバイスのトークンを取り消すには `operator.admin` が必要です。
対象トークンのスコープセットも、呼び出し元セッション自身のオペレータースコープ内に収まっている必要があります。ペアリングのみの呼び出し元は、管理者/書き込みオペレータートークンを取り消せません。

```
openclaw devices revoke --device <deviceId> --role node
```

取り消し結果を JSON として返します。

## 共通オプション

- `--url <url>`: Gateway WebSocket URL（構成されている場合はデフォルトで `gateway.remote.url`）。
- `--token <token>`: Gateway トークン（必要な場合）。
- `--password <password>`: Gateway パスワード（パスワード認証）。
- `--timeout <ms>`: RPC タイムアウト。
- `--json`: JSON 出力（スクリプト用途に推奨）。

<Warning>
`--url` を設定した場合、CLI は構成や環境の認証情報にフォールバックしません。`--token` または `--password` を明示的に渡してください。明示的な認証情報がない場合はエラーです。
</Warning>

## 注記

- トークンローテーションは新しいトークン（機密）を返します。シークレットとして扱ってください。
- これらのコマンドには `operator.pairing`（または `operator.admin`）スコープが必要です。一部の承認では、対象デバイスが発行または継承するオペレータースコープを呼び出し元が保持していることも必要です。[オペレータースコープ](/ja-JP/gateway/operator-scopes)を参照してください。
- `gateway.nodes.pairing.autoApproveCidrs` は、新規 Node デバイスペアリング専用のオプトイン Gateway ポリシーです。CLI の承認権限は変更しません。
- トークンのローテーションと取り消しは、そのデバイスの承認済みペアリングロールセットおよび承認済みスコープベースラインの内側に留まります。迷い込んだキャッシュ済みトークンエントリによって、トークン管理対象が付与されることはありません。
- ペアリング済みデバイストークンのセッションでは、デバイスをまたいだ管理は管理者専用です。呼び出し元が `operator.admin` を持っていない限り、`remove`、`rotate`、`revoke` は自分自身のみが対象です。
- トークン変更も呼び出し元スコープ内に制限されます。ペアリングのみのセッションでは、現在 `operator.admin` または `operator.write` を持つトークンをローテーションまたは取り消しできません。
- `devices clear` は意図的に `--yes` で保護されています。
- local loopback でペアリングスコープが利用できない場合（かつ明示的な `--url` が渡されていない場合）、list/approve はローカルのペアリングフォールバックを使用できます。
- `devices approve` は、トークンを発行する前に明示的な要求 ID を必要とします。`requestId` を省略するか `--latest` を渡した場合は、最新の保留中要求をプレビューするだけです。

## トークンドリフト復旧チェックリスト

Control UI やその他のクライアントが `AUTH_TOKEN_MISMATCH`、`AUTH_DEVICE_TOKEN_MISMATCH`、または `AUTH_SCOPE_MISMATCH` で失敗し続ける場合に使用します。

1. 現在の Gateway トークンソースを確認します。

```bash
openclaw config get gateway.auth.token
```

2. ペアリング済みデバイスを一覧表示し、影響を受けているデバイス ID を特定します。

```bash
openclaw devices list
```

3. 影響を受けているデバイスのオペレータートークンをローテーションします。

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. ローテーションで十分でない場合は、古いペアリングを削除して再度承認します。

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. 現在の共有トークン/パスワードでクライアント接続を再試行します。

注記:

- 通常の再接続時の認証優先順位は、明示的な共有トークン/パスワード、明示的な `deviceToken`、保存済みデバイストークン、ブートストラップトークンの順です。
- 信頼済みの `AUTH_TOKEN_MISMATCH` 復旧では、1回の限定された再試行のために、共有トークンと保存済みデバイストークンの両方を一時的にまとめて送信できます。
- `AUTH_SCOPE_MISMATCH` は、デバイストークンは認識されたものの、要求されたスコープセットを持っていないことを意味します。共有 Gateway 認証を変更する前に、ペアリング/スコープ承認契約を修正してください。

関連:

- [Dashboard 認証のトラブルシューティング](/ja-JP/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway のトラブルシューティング](/ja-JP/gateway/troubleshooting#dashboard-control-ui-connectivity)

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Node](/ja-JP/nodes)
