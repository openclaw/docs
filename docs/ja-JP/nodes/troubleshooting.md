---
read_when:
    - Node は接続されているのに camera/canvas/screen/exec ツールが失敗する場合
    - Node のペアリングと承認の違いを理解する必要がある場合
summary: Node のペアリング、フォアグラウンド要件、権限、ツール障害をトラブルシュートする
title: Node のトラブルシューティング
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T05:06:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59c7367d02945e972094b47832164d95573a2aab1122e8ccf6feb80bcfcd95be
    source_path: nodes/troubleshooting.md
    workflow: 15
---

Node が status では見えているのに Node ツールが失敗する場合は、このページを使ってください。

## コマンドラダー

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

次に Node 固有のチェックを実行します。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

正常なシグナル:

- Node が接続されており、role `node` としてペアリング済みである。
- `nodes describe` に、呼び出そうとしている capability が含まれている。
- Exec approvals に、期待する mode/allowlist が表示されている。

## フォアグラウンド要件

`canvas.*`、`camera.*`、`screen.*` は iOS/Android Node ではフォアグラウンド専用です。

簡易チェックと修正:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

`NODE_BACKGROUND_UNAVAILABLE` が出た場合は、Node アプリをフォアグラウンドにして再試行してください。

## 権限マトリクス

| Capability                   | iOS                                     | Android                                      | macOS Node アプリ                | 典型的な失敗コード           |
| ---------------------------- | --------------------------------------- | -------------------------------------------- | ----------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | Camera（clip 音声用に mic も）           | Camera（clip 音声用に mic も）                | Camera（clip 音声用に mic も） | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | Screen Recording（mic は任意）       | Screen capture プロンプト（mic は任意）       | Screen Recording              | `*_PERMISSION_REQUIRED`        |
| `location.get`               | While Using または Always（mode に依存） | mode に応じた Foreground/Background location | Location permission           | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | n/a（Node ホスト経路）                    | n/a（Node ホスト経路）                         | Exec approvals が必要       | `SYSTEM_RUN_DENIED`            |

## ペアリング vs 承認

これらは別のゲートです。

1. **デバイスペアリング**: この Node は gateway に接続できるか？
2. **Gateway Node コマンドポリシー**: RPC コマンド ID は `gateway.nodes.allowCommands` / `denyCommands` とプラットフォームデフォルトで許可されているか？
3. **Exec approvals**: この Node は特定のシェルコマンドをローカル実行できるか？

簡易チェック:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

ペアリングが欠けている場合は、まず Node デバイスの承認を行ってください。
`nodes describe` にコマンドがない場合は、gateway Node コマンドポリシーと、Node が接続時にそのコマンドを実際に宣言したかを確認してください。
ペアリングが正常なのに `system.run` が失敗する場合は、その Node の exec approvals/allowlist を修正してください。

Node ペアリングは identity/trust ゲートであり、コマンドごとの承認サーフェスではありません。`system.run` の Node ごとのポリシーは、その Node の exec approvals file（`openclaw approvals get --node ...`）にあり、gateway のペアリング記録にはありません。

承認に支えられた `host=node` 実行では、gateway は実行を
準備済みの正規 `systemRunPlan` にも結び付けます。承認済み実行が転送される前に、
後続の呼び出し元が command/cwd やセッションメタデータを変更した場合、gateway は
編集済みペイロードを信頼する代わりに approval mismatch として拒否します。

## よくある Node エラーコード

- `NODE_BACKGROUND_UNAVAILABLE` → アプリがバックグラウンドです。フォアグラウンドにしてください。
- `CAMERA_DISABLED` → Node 設定で camera トグルが無効です。
- `*_PERMISSION_REQUIRED` → OS 権限がない/拒否されています。
- `LOCATION_DISABLED` → location mode がオフです。
- `LOCATION_PERMISSION_REQUIRED` → 要求された location mode が付与されていません。
- `LOCATION_BACKGROUND_UNAVAILABLE` → アプリがバックグラウンドですが、While Using 権限しかありません。
- `SYSTEM_RUN_DENIED: approval required` → exec リクエストには明示的承認が必要です。
- `SYSTEM_RUN_DENIED: allowlist miss` → コマンドが allowlist mode によってブロックされました。
  Windows Node ホストでは、`cmd.exe /c ...` のような shell-wrapper 形式は、
  allowlist mode では ask フローで承認されない限り allowlist miss として扱われます。

## 高速復旧ループ

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

それでも詰まる場合:

- デバイスペアリングを再承認する。
- Node アプリを再オープンする（フォアグラウンド）。
- OS 権限を再付与する。
- Exec approval ポリシーを再作成/調整する。

関連:

- [/nodes/index](/ja-JP/nodes/index)
- [/nodes/camera](/ja-JP/nodes/camera)
- [/nodes/location-command](/ja-JP/nodes/location-command)
- [/tools/exec-approvals](/ja-JP/tools/exec-approvals)
- [/gateway/pairing](/ja-JP/gateway/pairing)

## 関連

- [Nodes overview](/ja-JP/nodes)
- [Gateway troubleshooting](/ja-JP/gateway/troubleshooting)
- [Channel troubleshooting](/ja-JP/channels/troubleshooting)
