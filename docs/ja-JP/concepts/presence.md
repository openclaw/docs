---
read_when:
    - Instances タブをデバッグしている場合
    - 重複または古いインスタンス行を調査している場合
    - gateway WS 接続または system-event ビーコンを変更している場合
summary: OpenClaw の presence エントリがどのように生成、マージ、表示されるか
title: Presence
x-i18n:
    generated_at: "2026-04-24T04:54:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f33a7d4a3d5e5555c68a7503b3a4f75c12db94d260e5546cfc26ca8a12de0f9
    source_path: concepts/presence.md
    workflow: 15
---

OpenClaw の「presence」は、次を軽量かつベストエフォートで表示するものです:

- **Gateway** 自体
- **Gateway に接続されているクライアント**（mac アプリ、WebChat、CLI など）

presence は主に macOS アプリの **Instances** タブを描画するため、および
オペレーターにすばやい可視性を提供するために使われます。

## Presence フィールド（表示されるもの）

presence エントリは、次のようなフィールドを持つ構造化オブジェクトです:

- `instanceId`（任意ですが強く推奨）: 安定したクライアント ID（通常は `connect.client.instanceId`）
- `host`: 人が読みやすいホスト名
- `ip`: ベストエフォートの IP アドレス
- `version`: クライアントのバージョン文字列
- `deviceFamily` / `modelIdentifier`: ハードウェアのヒント
- `mode`: `ui`、`webchat`、`cli`、`backend`、`probe`、`test`、`node`、...
- `lastInputSeconds`: 「最後のユーザー入力からの経過秒数」（分かる場合）
- `reason`: `self`、`connect`、`node-connected`、`periodic`、...
- `ts`: 最終更新タイムスタンプ（epoch ミリ秒）

## Producer（presence の発生元）

presence エントリは複数のソースから生成され、**マージ** されます。

### 1) Gateway 自身のエントリ

Gateway は起動時に必ず「self」エントリをシードするため、クライアントがまだ接続していなくても UI には gateway ホストが表示されます。

### 2) WebSocket 接続

すべての WS クライアントは `connect` リクエストから始まります。ハンドシェイクが成功すると、
Gateway はその接続用の presence エントリを upsert します。

#### 単発の CLI コマンドが表示されない理由

CLI は短時間の単発コマンドのために接続することがよくあります。Instances 一覧が
あふれるのを避けるため、`client.mode === "cli"` は **presence エントリには変換されません**。

### 3) `system-event` ビーコン

クライアントは `system-event` メソッドを通じて、より情報量の多い定期ビーコンを送信できます。mac
アプリはこれを使ってホスト名、IP、`lastInputSeconds` を報告します。

### 4) Node 接続（role: node）

node が `role: node` で Gateway WebSocket に接続すると、Gateway はその node 用の
presence エントリを upsert します（他の WS クライアントと同じフローです）。

## マージ + 重複排除ルール（なぜ `instanceId` が重要なのか）

presence エントリは、単一のインメモリマップに保存されます:

- エントリは **presence key** によってキー付けされます。
- 最適なキーは、再起動後も維持される安定した `instanceId`（`connect.client.instanceId` 由来）です。
- キーは大文字小文字を区別しません。

クライアントが安定した `instanceId` なしで再接続すると、**重複した** 行として表示されることがあります。

## TTL とサイズ上限

presence は意図的に一時的です:

- **TTL:** 5 分より古いエントリは削除されます
- **最大エントリ数:** 200（最も古いものから削除）

これにより一覧を新鮮に保ち、メモリ使用量の無制限な増加を防ぎます。

## リモート/トンネル時の注意点（loopback IP）

クライアントが SSH トンネル / ローカルポートフォワード経由で接続すると、Gateway は
リモートアドレスを `127.0.0.1` として認識することがあります。適切なクライアント報告 IP を
上書きしないよう、loopback のリモートアドレスは無視されます。

## Consumer

### macOS Instances タブ

macOS アプリは `system-presence` の出力を描画し、最終更新の経過時間に基づいて
小さなステータスインジケーター（Active/Idle/Stale）を適用します。

## デバッグのヒント

- 生の一覧を見るには、Gateway に対して `system-presence` を呼び出してください。
- 重複が見える場合:
  - クライアントがハンドシェイクで安定した `client.instanceId` を送っていることを確認してください
  - 定期ビーコンが同じ `instanceId` を使っていることを確認してください
  - 接続由来のエントリに `instanceId` が欠けていないか確認してください（重複は想定内です）

## 関連

- [Typing indicators](/ja-JP/concepts/typing-indicators)
- [Streaming and chunking](/ja-JP/concepts/streaming)
