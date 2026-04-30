---
read_when:
    - デバイスのペアリング要求を承認しています
    - デバイストークンをローテーションまたは失効させる必要がある
summary: '`openclaw devices` の CLI リファレンス（デバイスペアリング + トークンのローテーション/失効）'
title: デバイス
x-i18n:
    generated_at: "2026-04-30T05:04:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: df105135a12ec733e45a67792e8447628f1538fc2536a008d615d46d1eaff5c8
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

保留中の要求の出力では、デバイスがすでにペアリング済みの場合、要求されたアクセスがデバイスの現在の承認済みアクセスの隣に表示されます。これにより、ペアリングが失われたように見えるのではなく、スコープ/ロールのアップグレードが明示されます。

### `openclaw devices remove <deviceId>`

ペアリング済みデバイスのエントリを 1 つ削除します。

ペアリング済みデバイストークンで認証している場合、非管理者の呼び出し元は**自分の**デバイスエントリだけを削除できます。他のデバイスを削除するには `operator.admin` が必要です。

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

正確な `requestId` で、保留中のデバイスペアリング要求を承認します。`requestId` を省略した場合、または `--latest` を渡した場合、OpenClaw は選択された保留中の要求だけを表示して終了します。詳細を確認した後、正確な要求 ID で承認を再実行してください。

<Note>
デバイスが変更された認証詳細（ロール、スコープ、または公開鍵）でペアリングを再試行した場合、OpenClaw は以前の保留中エントリを置き換え、新しい `requestId` を発行します。承認の直前に `openclaw devices list` を実行し、現在の ID を使用してください。
</Note>

デバイスがすでにペアリング済みで、より広いスコープやより広いロールを要求した場合、OpenClaw は既存の承認を維持し、新しい保留中アップグレード要求を作成します。`openclaw devices list` の `Requested` 列と `Approved` 列を確認するか、`openclaw devices approve --latest` を使用して、承認前に正確なアップグレード内容をプレビューしてください。

Gateway が明示的に `gateway.nodes.pairing.autoApproveCidrs` で構成されている場合、一致するクライアント IP からの初回の `role: node` 要求は、この一覧に表示される前に承認されることがあります。このポリシーはデフォルトで無効であり、operator/browser クライアントやアップグレード要求には適用されません。

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

特定のロールのデバイストークンをローテーションします（必要に応じてスコープも更新します）。対象ロールは、そのデバイスの承認済みペアリング契約にすでに存在している必要があります。ローテーションで未承認の新しいロールを発行することはできません。
`--scope` を省略した場合、保存されたローテーション済みトークンで後から再接続すると、そのトークンにキャッシュされた承認済みスコープが再利用されます。明示的な `--scope` 値を渡した場合、それらが将来のキャッシュトークン再接続用に保存されるスコープセットになります。
非管理者のペアリング済みデバイス呼び出し元は、**自分の**デバイストークンだけをローテーションできます。
対象トークンのスコープセットは、呼び出し元セッション自身の operator スコープ内に収まっている必要があります。ローテーションで、呼び出し元がすでに持っているよりも広い operator トークンを発行したり維持したりすることはできません。

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

ローテーションのメタデータを JSON として返します。呼び出し元がそのデバイストークンで認証しながら自分のトークンをローテーションしている場合、レスポンスには置換トークンも含まれるため、クライアントは再接続前にそれを永続化できます。共有/管理者によるローテーションではベアラートークンはエコーされません。

### `openclaw devices revoke --device <id> --role <role>`

特定のロールのデバイストークンを取り消します。

非管理者のペアリング済みデバイス呼び出し元は、**自分の**デバイストークンだけを取り消せます。他のデバイスのトークンを取り消すには `operator.admin` が必要です。
対象トークンのスコープセットも、呼び出し元セッション自身の operator スコープ内に収まっている必要があります。ペアリング専用の呼び出し元は、admin/write operator トークンを取り消せません。

```
openclaw devices revoke --device <deviceId> --role node
```

取り消し結果を JSON として返します。

## 共通オプション

- `--url <url>`: Gateway WebSocket URL（構成されている場合、デフォルトは `gateway.remote.url`）。
- `--token <token>`: Gateway トークン（必要な場合）。
- `--password <password>`: Gateway パスワード（パスワード認証）。
- `--timeout <ms>`: RPC タイムアウト。
- `--json`: JSON 出力（スクリプトでは推奨）。

<Warning>
`--url` を設定すると、CLI は構成や環境の認証情報にフォールバックしません。`--token` または `--password` を明示的に渡してください。明示的な認証情報がない場合はエラーです。
</Warning>

## 注記

- トークンのローテーションは新しいトークン（機密情報）を返します。シークレットとして扱ってください。
- これらのコマンドには `operator.pairing`（または `operator.admin`）スコープが必要です。
- `gateway.nodes.pairing.autoApproveCidrs` は、新しい node デバイスのペアリング専用のオプトイン Gateway ポリシーです。CLI の承認権限は変更しません。
- トークンのローテーションと取り消しは、そのデバイスの承認済みペアリングロールセットと承認済みスコープベースラインの内側に留まります。迷子のキャッシュ済みトークンエントリが、トークン管理の対象を付与することはありません。
- ペアリング済みデバイストークンセッションでは、デバイスをまたいだ管理は管理者専用です。呼び出し元が `operator.admin` を持っていない限り、`remove`、`rotate`、`revoke` は自分自身に対してのみ実行できます。
- トークンの変更も、呼び出し元のスコープ内に制限されます。ペアリング専用セッションは、現在 `operator.admin` または `operator.write` を保持しているトークンをローテーションまたは取り消しできません。
- `devices clear` は意図的に `--yes` で保護されています。
- local loopback でペアリングスコープが利用できない場合（かつ明示的な `--url` が渡されていない場合）、list/approve はローカルペアリングフォールバックを使用できます。
- `devices approve` は、トークンを発行する前に明示的な要求 ID を必要とします。`requestId` を省略するか `--latest` を渡すと、最新の保留中要求をプレビューするだけです。

## トークンドリフト復旧チェックリスト

Control UI や他のクライアントが `AUTH_TOKEN_MISMATCH` または `AUTH_DEVICE_TOKEN_MISMATCH` で失敗し続ける場合に使用します。

1. 現在の gateway トークンソースを確認します。

```bash
openclaw config get gateway.auth.token
```

2. ペアリング済みデバイスを一覧表示し、影響を受けるデバイス ID を特定します。

```bash
openclaw devices list
```

3. 影響を受けるデバイスの operator トークンをローテーションします。

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. ローテーションで不十分な場合、古いペアリングを削除して再度承認します。

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. 現在の共有トークン/パスワードでクライアント接続を再試行します。

注記:

- 通常の再接続認証の優先順位は、明示的な共有トークン/パスワード、明示的な `deviceToken`、保存済みデバイストークン、ブートストラップトークンの順です。
- 信頼された `AUTH_TOKEN_MISMATCH` 復旧では、1 回の制限付き再試行のために、共有トークンと保存済みデバイストークンの両方を一時的にまとめて送信できます。

関連:

- [ダッシュボード認証のトラブルシューティング](/ja-JP/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#dashboard-control-ui-connectivity)

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [ノード](/ja-JP/nodes)
