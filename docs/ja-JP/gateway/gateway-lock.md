---
read_when:
    - Gateway プロセスの実行またはデバッグ
    - 単一インスタンスの強制を調査する
summary: Gateway のシングルトンガード：ファイルロックと WebSocket/HTTP バインド
title: Gateway ロック
x-i18n:
    generated_at: "2026-07-11T22:15:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c3ba4e8c12d6aadd089cb05722444eaa99d4b573553ac52a21c5c91e5ce1c09
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## 理由

- 1 台のホスト上で、特定の設定 + ポートを所有する Gateway プロセスは 1 つだけにする必要があります。追加の Gateway は、分離されたプロファイルと一意のポートを使用して実行します。
- 古いロックファイルを残さずに、クラッシュや SIGKILL に耐えます。
- 別の Gateway がすでにポートを所有している場合、明確なエラーですぐに失敗します。

## 2 つのレイヤー

起動時には、次の 2 つの独立した手順を順番に実行し、単一インスタンスによる所有を強制します。

1. **ファイルロック**は、状態ロックディレクトリ内にある設定ごとのロックファイルを取得します。取得処理の一環として、設定済みポートに稼働中のリスナーがあるか調査し、古い（クラッシュした）ロック所有者を検出します。
2. **ソケットのバインド**は、HTTP/WebSocket リスナー（デフォルトは `ws://127.0.0.1:18789`）を排他的な TCP リスナーとしてバインドします。

各レイヤーは個別に失敗する可能性があり、それぞれ独自の `GatewayLockError` をスローします。

### ファイルロック

- ロックファイルが存在しない場合、記録された所有者プロセスが終了している場合、または所有者のポート調査で稼働中のリスナーが見つからない場合、起動処理はロックを再取得して続行します。
- ロックが現在保持されており、上記のどれにも該当しない場合、起動処理は断念するまで最大 5 秒間（デフォルト）再試行します。

  ```text
  GatewayLockError("gateway already running (pid <pid>); lock timeout after <ms>ms")
  ```

### ソケットのバインド

- `EADDRINUSE` の場合、直前に終了したプロセスによる `TIME_WAIT` 期間が終わるまで待つため、起動処理は 500 ミリ秒間隔で最大 20 回（合計約 10 秒）バインドを再試行します。
- 再試行後もポートが使用中の場合:

  ```text
  GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")
  ```

- その他のバインド失敗:

  ```text
  GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: <cause>")
  ```

シャットダウン時に、Gateway は HTTP/WebSocket サーバーを閉じ、ロックファイルを削除します。

## 運用上の注意

- 別の Gateway 以外のプロセスがポートを占有している場合も、エラーは同じです。ポートを解放するか、`openclaw gateway --port <port>` で別のポートを選択してください。
- サービススーパーバイザーの管理下では、上記いずれかのエラーが発生した新しい Gateway プロセスは、まず既存プロセスの `/healthz` を調査します。そのプロセスが正常であれば、新しいプロセスは失敗せず、既存プロセスに制御を委ねます。systemd では終了コード `78` で終了し、ユニットの `RestartPreventExitStatus=78` によって、ロックまたは `EADDRINUSE` の競合時に `Restart=always` が再起動を繰り返すのを防ぎます。既存プロセスが正常にならない場合、ヘルス調査の再試行は一定時間で打ち切られ、永久にループする代わりに、起動処理は上記のロックエラーで失敗します。
- macOS アプリは Gateway を起動する前に独自の軽量な PID ガードを維持しますが、実行時に実際の強制を行うのは、上記のファイルロックとソケットのバインドです。

## 関連項目

- [複数の Gateway](/ja-JP/gateway/multiple-gateways) - 一意のポートで複数のインスタンスを実行する方法
- [トラブルシューティング](/ja-JP/gateway/troubleshooting) - `EADDRINUSE` とポート競合の診断方法
