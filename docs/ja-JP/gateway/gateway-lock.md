---
read_when:
    - Gateway プロセスの実行またはデバッグ
    - 単一インスタンス強制を調査中
summary: WebSocket リスナーのバインドを使用した Gateway シングルトンガード
title: Gateway ロック
x-i18n:
    generated_at: "2026-04-30T05:12:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe61ff81106554e98de1ca04c213b76d230265cdf3e81b70897d2de00f6a0179
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## 理由

- 同じホスト上の同じベースポートでは、Gateway インスタンスを 1 つだけ実行するようにする。追加の Gateway では、分離されたプロファイルと一意のポートを使用する必要がある。
- クラッシュや SIGKILL が発生しても、古いロックファイルを残さずに復旧する。
- 制御ポートがすでに使用中の場合は、明確なエラーですばやく失敗する。

## 仕組み

- Gateway はまず、状態ロックディレクトリ配下で設定ごとのロックファイルを取得し、設定されたポートに既存のリスナーがあるかを調べる。
- 記録されたロック所有者が存在しない、ポートが空いている、またはロックが古い場合、起動処理はロックを再取得して続行する。
- その後 Gateway は、排他的な TCP リスナーを使用して HTTP/WebSocket リスナー（デフォルトは `ws://127.0.0.1:18789`）をバインドする。
- バインドが `EADDRINUSE` で失敗した場合、起動処理は `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")` をスローする。
- シャットダウン時に、Gateway は HTTP/WebSocket サーバーを閉じ、ロックファイルを削除する。

## エラーの表示

- 別のプロセスがポートを保持している場合、起動処理は `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")` をスローする。
- その他のバインド失敗は、`GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")` として表示される。

## 運用上の注意

- ポートが_別の_プロセスによって使用中の場合も、エラーは同じである。ポートを解放するか、`openclaw gateway --port <port>` で別のポートを選択する。
- サービススーパーバイザー配下では、新しい Gateway プロセスが既存の正常な `/healthz` 応答を検出すると、正常終了し、その既存プロセスに制御を残す。既存プロセスが正常状態にならない場合、リトライは制限され、起動処理は無限ループするのではなく、明確なロックエラーで失敗する。
- macOS アプリは、Gateway を起動する前に引き続き独自の軽量な PID ガードを維持する。実行時ロックは、ロックファイルと HTTP/WebSocket バインドによって強制される。

## 関連情報

- [複数の Gateway](/ja-JP/gateway/multiple-gateways) — 一意のポートで複数のインスタンスを実行する
- [トラブルシューティング](/ja-JP/gateway/troubleshooting) — `EADDRINUSE` とポート競合を診断する
