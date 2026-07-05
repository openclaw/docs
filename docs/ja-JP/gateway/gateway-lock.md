---
read_when:
    - Gateway プロセスの実行またはデバッグ
    - 単一インスタンス適用の調査
summary: 'Gateway シングルトンガード: ファイルロックと WebSocket/HTTP バインド'
title: Gateway ロック
x-i18n:
    generated_at: "2026-07-05T11:24:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c3ba4e8c12d6aadd089cb05722444eaa99d4b573553ac52a21c5c91e5ce1c09
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## 理由

- ホスト上では、特定の config + port を所有する Gateway プロセスは1つだけにする必要があります。追加の Gateway は、分離されたプロファイルと一意のポートで実行します。
- クラッシュや SIGKILL が発生しても、古いロックファイルを残さずに復旧します。
- 別の Gateway がすでにポートを所有している場合は、明確なエラーで即座に失敗します。

## 2つのレイヤー

起動時は、単一インスタンスの所有権を2つの独立した手順で順番に強制します。

1. **ファイルロック** は、状態ロックディレクトリ配下で config ごとのロックファイルを取得します。取得の一環として、設定されたポートに稼働中のリスナーがあるかを調べ、古い（クラッシュした）ロック所有者を検出します。
2. **ソケットバインド** は、HTTP/WebSocket リスナー（デフォルトは `ws://127.0.0.1:18789`）を排他的な TCP リスナーとしてバインドします。

各レイヤーは独立して失敗する可能性があり、それぞれ独自の `GatewayLockError` をスローします。

### ファイルロック

- ロックファイルが存在しない、記録された所有者プロセスが終了している、または所有者のポートプローブで稼働中のリスナーが見つからない場合、起動処理はロックを回収して続行します。
- ロックがアクティブに保持されていて、上記のいずれにも該当しない場合、起動処理は諦める前に最大5秒（デフォルト）再試行します。

  ```text
  GatewayLockError("gateway already running (pid <pid>); lock timeout after <ms>ms")
  ```

### ソケットバインド

- `EADDRINUSE` では、最近終了したプロセスの後に残る `TIME_WAIT` ウィンドウを乗り切るため、起動処理は500ms間隔で最大20回（合計およそ10秒）バインドを再試行します。
- 再試行後もポートがまだ使用中の場合:

  ```text
  GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")
  ```

- その他のバインド失敗:

  ```text
  GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: <cause>")
  ```

シャットダウン時、Gateway は HTTP/WebSocket サーバーを閉じ、ロックファイルを削除します。

## 運用上の注意

- ポートが別の非 Gateway プロセスに占有されている場合も、エラーは同じです。ポートを解放するか、`openclaw gateway --port <port>` で別のポートを選択してください。
- サービススーパーバイザー配下では、上記いずれかのエラーに遭遇した新しい Gateway プロセスは、まず既存プロセスの `/healthz` をプローブします。そのプロセスが正常な場合、新しいプロセスは失敗する代わりに、既存プロセスに制御を残します。systemd では、終了コード `78` で終了します。ユニットの `RestartPreventExitStatus=78` により、ロックまたは `EADDRINUSE` の競合で `Restart=always` がループしなくなります。既存プロセスが正常にならない場合、ヘルスプローブの再試行は時間制限され、その後、起動処理は永久にループする代わりに上記のロックエラーで失敗します。
- macOS アプリは Gateway を起動する前に独自の軽量な PID ガードを保持します。上記のファイルロックとソケットバインドが、実際のランタイム強制です。

## 関連

- [複数の Gateway](/ja-JP/gateway/multiple-gateways) - 一意のポートで複数のインスタンスを実行する
- [トラブルシューティング](/ja-JP/gateway/troubleshooting) - `EADDRINUSE` とポート競合を診断する
