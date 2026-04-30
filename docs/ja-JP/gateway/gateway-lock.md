---
read_when:
    - Gateway プロセスの実行またはデバッグ
    - 単一インスタンス強制を調査中
summary: WebSocket リスナーのバインドを使用した Gateway シングルトンガード
title: Gateway ロック
x-i18n:
    generated_at: "2026-04-30T16:29:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85a1cb55f08d47d36fde25900e4247ef01c9a6800bf017fbff44a337f299ce13
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## 理由

- 同じホスト上の同じベースポートでは Gateway インスタンスが 1 つだけ実行されるようにする。追加の Gateway は、分離されたプロファイルと一意のポートを使用する必要がある。
- クラッシュや SIGKILL が発生しても、古いロックファイルを残さずに復旧する。
- 制御ポートがすでに使用中の場合、明確なエラーですばやく失敗する。

## 仕組み

- Gateway はまず、状態ロックディレクトリ配下の設定ごとのロックファイルを取得し、設定されたポートに既存のリスナーがあるかを調べる。
- 記録されたロック所有者が存在しない、ポートが空いている、またはロックが古い場合、起動処理はロックを再取得して続行する。
- 次に Gateway は、排他的な TCP リスナーを使用して HTTP/WebSocket リスナー（既定値 `ws://127.0.0.1:18789`）をバインドする。
- バインドが `EADDRINUSE` で失敗した場合、起動処理は `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")` をスローする。
- シャットダウン時に、Gateway は HTTP/WebSocket サーバーを閉じ、ロックファイルを削除する。

## エラーの表面

- 別のプロセスがポートを保持している場合、起動処理は `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")` をスローする。
- その他のバインド失敗は、`GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")` として表面化する。

## 運用上の注意

- ポートが_別の_プロセスによって占有されている場合、エラーは同じになる。ポートを解放するか、`openclaw gateway --port <port>` で別のポートを選択する。
- サービススーパーバイザー配下では、既存の正常な `/healthz` 応答元を検出した新しい Gateway プロセスは、そのプロセスに制御を残す。systemd では、重複した起動元はコード 78 で終了するため、既定の `RestartPreventExitStatus=78` により、ロックまたは `EADDRINUSE` の競合で `Restart=always` がループするのを防ぐ。既存のプロセスが正常にならない場合、再試行は制限され、起動処理は永久にループする代わりに明確なロックエラーで失敗する。
- macOS アプリは、Gateway を生成する前に引き続き独自の軽量な PID ガードを維持する。ランタイムロックは、ロックファイルと HTTP/WebSocket バインドによって強制される。

## 関連

- [複数の Gateway](/ja-JP/gateway/multiple-gateways) — 一意のポートで複数のインスタンスを実行する
- [トラブルシューティング](/ja-JP/gateway/troubleshooting) — `EADDRINUSE` とポート競合を診断する
