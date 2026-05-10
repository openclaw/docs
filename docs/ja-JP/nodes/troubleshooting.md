---
read_when:
    - Node は接続されているが、camera/canvas/screen/exec ツールが失敗する
    - ノードペアリングと承認の違いを理解するメンタルモデルが必要です
summary: ノードのペアリング、フォアグラウンド要件、権限、ツールの失敗のトラブルシューティング
title: Node のトラブルシューティング
x-i18n:
    generated_at: "2026-05-10T19:41:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: d53f06367b63125f04b4b542c322e6e50e1f33153e0fbdd09e7a38772c69a438
    source_path: nodes/troubleshooting.md
    workflow: 16
---

表示にはノードがあるのにノードツールが失敗する場合は、このページを使用します。

## コマンド手順

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

次にノード固有のチェックを実行します。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

正常なシグナル:

- Node は接続済みで、ロール `node` としてペアリングされています。
- `nodes describe` に呼び出しているケイパビリティが含まれています。
- Exec 承認に期待されるモード/許可リストが表示されています。

## フォアグラウンド要件

`canvas.*`、`camera.*`、`screen.*` は iOS/Android ノードではフォアグラウンドでのみ使用できます。

クイックチェックと修正:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

`NODE_BACKGROUND_UNAVAILABLE` が表示された場合は、ノードアプリをフォアグラウンドにして再試行してください。

## 権限マトリクス

| ケイパビリティ             | iOS                                           | Android                                              | macOS ノードアプリ                    | 典型的な失敗コード             |
| ---------------------------- | --------------------------------------- | -------------------------------------------- | ----------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | カメラ（クリップ音声用のマイクも）      | カメラ（クリップ音声用のマイクも）           | カメラ（クリップ音声用のマイクも）    | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | 画面収録（マイクは任意）                | 画面キャプチャプロンプト（マイクは任意）     | 画面収録                              | `*_PERMISSION_REQUIRED`        |
| `location.get`               | 使用中または常に許可（モードによる）    | モードに基づくフォアグラウンド/バックグラウンド位置情報 | 位置情報権限                 | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | 該当なし（ノードホストパス）            | 該当なし（ノードホストパス）                 | Exec 承認が必要                      | `SYSTEM_RUN_DENIED`            |

## ペアリングと承認の違い

これらは異なるゲートです。

1. **デバイスのペアリング**: このノードは Gateway に接続できますか？
2. **Gateway ノードコマンドポリシー**: RPC コマンド ID は `gateway.nodes.allowCommands` / `denyCommands` とプラットフォームのデフォルトで許可されていますか？
3. **Exec 承認**: このノードは特定のシェルコマンドをローカルで実行できますか？

クイックチェック:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

ペアリングがない場合は、まずノードデバイスを承認してください。
`nodes describe` にコマンドがない場合は、Gateway ノードコマンドポリシーと、そのノードが接続時に実際にそのコマンドを宣言したかを確認してください。
ペアリングに問題がないのに `system.run` が失敗する場合は、そのノードの Exec 承認/許可リストを修正してください。

ノードのペアリングは ID/信頼のゲートであり、コマンドごとの承認サーフェスではありません。`system.run` の場合、ノードごとのポリシーは Gateway のペアリングレコードではなく、そのノードの Exec 承認ファイル（`openclaw approvals get --node ...`）にあります。

承認に基づく `host=node` 実行では、Gateway は実行を準備済みの正規 `systemRunPlan` にもバインドします。承認済みの実行が転送される前に、後続の呼び出し元が command/cwd またはセッションメタデータを変更した場合、Gateway は編集済みペイロードを信頼せず、承認の不一致として実行を拒否します。

## よくあるノードエラーコード

- `NODE_BACKGROUND_UNAVAILABLE` → アプリがバックグラウンドにあります。フォアグラウンドにしてください。
- `CAMERA_DISABLED` → ノード設定でカメラトグルが無効です。
- `*_PERMISSION_REQUIRED` → OS 権限がないか拒否されています。
- `LOCATION_DISABLED` → 位置情報モードがオフです。
- `LOCATION_PERMISSION_REQUIRED` → 要求された位置情報モードが許可されていません。
- `LOCATION_BACKGROUND_UNAVAILABLE` → アプリはバックグラウンドにありますが、使用中のみの権限しかありません。
- `SYSTEM_RUN_DENIED: approval required` → Exec リクエストには明示的な承認が必要です。
- `SYSTEM_RUN_DENIED: allowlist miss` → コマンドが許可リストモードによってブロックされています。
  Windows ノードホストでは、`cmd.exe /c ...` のようなシェルラッパー形式は、ask フローで承認されていない限り、許可リストモードで許可リストミスとして扱われます。

## 高速リカバリループ

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

まだ詰まっている場合:

- デバイスのペアリングを再承認します。
- ノードアプリを再度開きます（フォアグラウンド）。
- OS 権限を再付与します。
- Exec 承認ポリシーを再作成/調整します。

## 関連

- [ノード概要](/ja-JP/nodes)
- [カメラノード](/ja-JP/nodes/camera)
- [位置情報コマンド](/ja-JP/nodes/location-command)
- [Exec 承認](/ja-JP/tools/exec-approvals)
- [Gateway ペアリング](/ja-JP/gateway/pairing)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)
- [チャネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
