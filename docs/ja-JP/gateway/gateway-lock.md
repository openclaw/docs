---
read_when:
    - Gateway プロセスを実行またはデバッグしています
    - 単一インスタンス強制を調査しています
summary: WebSocket リスナー bind を使用した Gateway シングルトンガード
title: Gateway ロック
x-i18n:
    generated_at: "2026-04-24T04:57:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f52405d1891470592cb2f9328421dc910c15f4fdc4d34d57c1fec8b322c753f
    source_path: gateway/gateway-lock.md
    workflow: 15
---

## 理由

- 同じホスト上で、同じベースポートごとに実行される Gateway インスタンスを 1 つだけにする。追加の Gateway は、分離されたプロファイルと一意のポートを使う必要があります。
- クラッシュや SIGKILL が発生しても、古いロックファイルを残さずに済むようにする。
- 制御ポートがすでに使用中のときに、明確なエラーで即座に失敗する。

## 仕組み

- Gateway は起動直後に、排他的な TCP リスナーを使って WebSocket リスナー（デフォルト `ws://127.0.0.1:18789`）を bind します。
- bind が `EADDRINUSE` で失敗した場合、起動時に `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")` を投げます。
- OS は、クラッシュや SIGKILL を含むどのプロセス終了時でも自動的にリスナーを解放するため、別個のロックファイルやクリーンアップ手順は不要です。
- シャットダウン時には、Gateway は WebSocket サーバーと基盤の HTTP サーバーを閉じて、ポートを速やかに解放します。

## エラーサーフェス

- 別のプロセスがそのポートを保持している場合、起動時に `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")` を投げます。
- その他の bind 失敗は `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")` として表面化します。

## 運用上の注意

- そのポートを _別の_ プロセスが使用している場合でも、エラーは同じです。そのポートを解放するか、`openclaw gateway --port <port>` で別のポートを選んでください。
- macOS アプリは、Gateway を起動する前に独自の軽量な PID ガードを引き続き維持しますが、ランタイムロックは WebSocket bind によって強制されます。

## 関連

- [Multiple Gateways](/ja-JP/gateway/multiple-gateways) — 一意のポートで複数インスタンスを実行する
- [Troubleshooting](/ja-JP/gateway/troubleshooting) — `EADDRINUSE` とポート競合の診断
