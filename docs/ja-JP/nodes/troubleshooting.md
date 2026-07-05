---
read_when:
    - Node は接続されていますが、camera/canvas/screen/exec ツールが失敗します
    - ノードのペアリングと承認の考え方を理解する必要があります
summary: ノードのペアリング、フォアグラウンド要件、権限、ツール失敗をトラブルシュートする
title: Node のトラブルシューティング
x-i18n:
    generated_at: "2026-07-05T11:34:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f7b98658f1090e48d4a6f4b02788f570458fa5e1d76daa1c4a43e26ffc099e9
    source_path: nodes/troubleshooting.md
    workflow: 16
---

ステータスにノードが表示されているのにノードツールが失敗する場合は、このページを使用してください。

## コマンドの段階的確認

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

次に、ノード固有の確認を実行します。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

正常なシグナル:

- ノードが接続され、ロール `node` としてペアリングされている。
- `nodes describe` に呼び出そうとしている機能が含まれている。
- 実行承認に、想定されるモード/許可リストが表示されている。

## フォアグラウンド要件

`canvas.*`、`camera.*`、`screen.*` は、iOS/Android ノードではフォアグラウンド専用です。

簡単な確認と修正:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

`NODE_BACKGROUND_UNAVAILABLE` が表示された場合は、ノードアプリをフォアグラウンドにして再試行してください。

## 権限マトリクス

| 機能                         | iOS                                     | Android                                      | macOS ノードアプリ            | 一般的な失敗コード             |
| ---------------------------- | --------------------------------------- | -------------------------------------------- | ----------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | カメラ（クリップ音声にはマイクも必要）  | カメラ（クリップ音声にはマイクも必要）       | カメラ（クリップ音声にはマイクも必要） | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | 画面収録（マイクは任意）                | 画面キャプチャプロンプト（マイクは任意）     | 画面収録                      | `*_PERMISSION_REQUIRED`        |
| `location.get`               | 使用中のみ、または常に許可（モードによる） | モードに基づくフォアグラウンド/バックグラウンド位置情報 | 位置情報権限                  | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | 該当なし（ノードホストパス）            | 該当なし（ノードホストパス）                 | 実行承認が必要                | `SYSTEM_RUN_DENIED`            |

## ペアリングと承認

ノードコマンドが成功するかどうかは、3 つの別々のゲートで制御されます。

1. **デバイスペアリング**: このノードは Gateway に接続できるか？
2. **Gateway ノードコマンドポリシー**: RPC コマンド ID は `gateway.nodes.allowCommands` / `denyCommands` とプラットフォーム既定値で許可されているか？
3. **実行承認**: このノードは特定のシェルコマンドをローカルで実行できるか？

ノードペアリングは、コマンドごとの承認サーフェスではなく、ID/信頼のゲートです。`system.run` では、ノードごとのポリシーは Gateway のペアリングレコードではなく、そのノードの実行承認ファイル（`openclaw approvals get --node ...`）にあります。

簡単な確認:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

- ペアリングがない: まずノードデバイスを承認します。
- `nodes describe` にコマンドがない: Gateway ノードコマンドポリシーと、接続時にノードが実際にそのコマンドを宣言したかを確認します。
- ペアリングは正常だが `system.run` が失敗する: そのノードの実行承認/許可リストを修正します。

承認に基づく `host=node` 実行では、Gateway は実行を準備済みの正規 `systemRunPlan` にもバインドします。承認済みの実行が転送される前に、後続の呼び出し元がコマンド、cwd、またはセッションメタデータを変更した場合、Gateway は編集済みペイロードを信頼する代わりに、承認の不一致としてその実行を拒否します。

## 一般的なノードエラーコード

| コード                                 | 意味                                                                                                                                                                                    |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_BACKGROUND_UNAVAILABLE`          | アプリがバックグラウンドにあります。フォアグラウンドにしてください。                                                                                                                   |
| `CAMERA_DISABLED`                      | ノード設定でカメラトグルが無効になっています。                                                                                                                                          |
| `*_PERMISSION_REQUIRED`                | OS 権限がない、または拒否されています。                                                                                                                                                 |
| `LOCATION_DISABLED`                    | 位置情報モードがオフです。                                                                                                                                                              |
| `LOCATION_PERMISSION_REQUIRED`         | 要求された位置情報モードが許可されていません。                                                                                                                                          |
| `LOCATION_BACKGROUND_UNAVAILABLE`      | アプリがバックグラウンドにありますが、「使用中のみ」の権限しかありません。                                                                                                             |
| `SYSTEM_RUN_DENIED: approval required` | 実行リクエストには明示的な承認が必要です。                                                                                                                                              |
| `SYSTEM_RUN_DENIED: allowlist miss`    | コマンドが許可リストモードでブロックされています。Windows ノードホストでは、`cmd.exe /c ...` のようなシェルラッパー形式は、ask フローで承認されない限り、許可リストモードで許可リストミスとして扱われます。 |

## 高速復旧ループ

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

それでも行き詰まる場合:

- デバイスペアリングを再承認します。
- ノードアプリを再度開きます（フォアグラウンド）。
- OS 権限を再付与します。
- 実行承認ポリシーを再作成/調整します。

## 関連

- [ノード概要](/ja-JP/nodes)
- [カメラノード](/ja-JP/nodes/camera)
- [位置情報コマンド](/ja-JP/nodes/location-command)
- [実行承認](/ja-JP/tools/exec-approvals)
- [Gateway ペアリング](/ja-JP/gateway/pairing)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)
- [チャネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
