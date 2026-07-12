---
read_when:
    - Node は接続されていますが、カメラ/キャンバス/画面/実行ツールが失敗する
    - Nodeのペアリングと承認の違いに関するメンタルモデルを理解する必要があります
summary: Node のペアリング、フォアグラウンド要件、権限、ツール障害のトラブルシューティング
title: Node のトラブルシューティング
x-i18n:
    generated_at: "2026-07-12T14:37:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 53d082dcd2f4bb022eb683d72d193dbb6800b5a81a8f5ab9506d82feaa0dbc49
    source_path: nodes/troubleshooting.md
    workflow: 16
---

ステータスには Node が表示されているのに、Node ツールが失敗する場合は、このページを参照してください。

## コマンド手順

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

次に、Node 固有のチェックを実行します。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

正常であることを示す状態：

- Node が接続され、ロール `node` としてペアリングされている。
- `nodes describe` に、呼び出そうとしている機能が含まれている。
- 実行承認に、想定したモードと許可リストが表示されている。

## フォアグラウンド要件

iOS/Android Node では、`canvas.*`、`camera.*`、`screen.*` はフォアグラウンドでのみ使用できます。

簡単な確認と修正：

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

`NODE_BACKGROUND_UNAVAILABLE` が表示された場合は、Node アプリをフォアグラウンドに移して再試行してください。

## 権限マトリックス

| 機能                         | iOS                                           | Android                                                 | macOS Node アプリ                         | 一般的なエラーコード                          |
| ---------------------------- | --------------------------------------------- | ------------------------------------------------------- | ----------------------------------------- | --------------------------------------------- |
| `camera.snap`, `camera.clip` | カメラ（クリップ音声にはマイクも必要）        | カメラ（クリップ音声にはマイクも必要）                  | カメラ（クリップ音声にはマイクも必要）    | `*_PERMISSION_REQUIRED`                       |
| `screen.record`              | 画面収録（マイクは任意）                      | 画面キャプチャのプロンプト（マイクは任意）              | 画面収録                                  | `*_PERMISSION_REQUIRED`                       |
| `computer.act`               | 該当なし                                      | 該当なし                                                | アクセシビリティ + 画面収録               | `COMPUTER_DISABLED`, `ACCESSIBILITY_REQUIRED` |
| `location.get`               | 使用中のみ、または常時（モードによる）        | モードに応じたフォアグラウンド/バックグラウンド位置情報 | 位置情報の権限                            | `LOCATION_PERMISSION_REQUIRED`                |
| `system.run`                 | 該当なし（Node ホストのパス）                 | 該当なし（Node ホストのパス）                           | 実行承認が必要                            | `SYSTEM_RUN_DENIED`                           |

## ペアリングと承認の違い

Node コマンドが成功するかどうかは、次の 3 つの独立したゲートによって制御されます。

1. **デバイスのペアリング**：この Node は Gateway に接続できるか？
2. **Gateway の Node コマンドポリシー**：RPC コマンド ID は、`gateway.nodes.allowCommands` / `denyCommands` およびプラットフォームのデフォルトで許可されているか？
3. **実行承認**：この Node は特定のシェルコマンドをローカルで実行できるか？

Node のペアリングは ID と信頼性を確認するゲートであり、コマンドごとの承認を行う仕組みではありません。`system.run` の Node ごとのポリシーは、Gateway のペアリングレコードではなく、その Node の実行承認ファイル（`openclaw approvals get --node ...`）にあります。

簡単な確認：

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

- ペアリングがない：まず Node デバイスを承認します。
- `nodes describe` にコマンドがない：Gateway の Node コマンドポリシーと、接続時に Node がそのコマンドを実際に宣言したかどうかを確認します。
- ペアリングに問題はないが `system.run` が失敗する：その Node の実行承認または許可リストを修正します。

承認を伴う `host=node` の実行では、Gateway は準備済みの正規 `systemRunPlan` にも実行を関連付けます。承認済みの実行が転送される前に、後続の呼び出し元がコマンド、cwd、またはセッションメタデータを変更した場合、Gateway は編集されたペイロードを信頼せず、承認の不一致として実行を拒否します。

## 一般的な Node エラーコード

| コード                                 | 意味                                                                                                                                                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_BACKGROUND_UNAVAILABLE`          | アプリがバックグラウンドにあります。フォアグラウンドに移してください。                                                                                                                               |
| `CAMERA_DISABLED`                      | Node 設定でカメラの切り替えが無効になっています。                                                                                                                                                    |
| `*_PERMISSION_REQUIRED`                | OS の権限がないか、拒否されています。                                                                                                                                                                |
| `LOCATION_DISABLED`                    | 位置情報モードがオフになっています。                                                                                                                                                                 |
| `LOCATION_PERMISSION_REQUIRED`         | 要求された位置情報モードが許可されていません。                                                                                                                                                       |
| `LOCATION_BACKGROUND_UNAVAILABLE`      | アプリがバックグラウンドにありますが、「使用中のみ」の権限しかありません。                                                                                                                           |
| `COMPUTER_DISABLED`                    | macOS アプリで **コンピュータ制御を許可** を有効にしてから、ペアリングの更新を承認してください。                                                                                                     |
| `ACCESSIBILITY_REQUIRED`               | macOS のシステム設定で、現在の OpenClaw アプリバンドルにアクセシビリティ権限を付与してください。                                                                                                     |
| `SYSTEM_RUN_DENIED: approval required` | 実行リクエストには明示的な承認が必要です。                                                                                                                                                           |
| `SYSTEM_RUN_DENIED: allowlist miss`    | コマンドが許可リストモードによってブロックされています。Windows Node ホストでは、`cmd.exe /c ...` のようなシェルラッパー形式は、確認フローで承認されない限り、許可リストモードでは許可リスト不一致として扱われます。 |

## 迅速な復旧手順

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

それでも解決しない場合：

- デバイスのペアリングを再承認します。
- Node アプリを再度開きます（フォアグラウンド）。
- OS の権限を再付与します。
- 実行承認ポリシーを再作成または調整します。

コンピュータ制御については、ビジョン対応エージェントが `computer` ツールを公開していること、画面収録の権限がある状態で `screen.snapshot` が成功すること、および `/phone status` に意図した一時的または永続的な Gateway 認可が表示されることも確認してください。`gateway.nodes.denyCommands` のエントリは常に `allowCommands` より優先されます。

## 関連項目

- [Node の概要](/ja-JP/nodes)
- [カメラ Node](/ja-JP/nodes/camera)
- [位置情報コマンド](/ja-JP/nodes/location-command)
- [コンピュータ操作](/nodes/computer-use)
- [実行承認](/ja-JP/tools/exec-approvals)
- [Gateway のペアリング](/ja-JP/gateway/pairing)
- [Gateway のトラブルシューティング](/ja-JP/gateway/troubleshooting)
- [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
