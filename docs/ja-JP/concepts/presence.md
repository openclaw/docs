---
read_when:
    - 「インスタンス」タブのデバッグ
    - 重複または古いインスタンス行の調査
    - Gateway の WS 接続または system-event ビーコンの変更
summary: OpenClawのプレゼンスエントリが生成、マージ、表示される仕組み
title: プレゼンス
x-i18n:
    generated_at: "2026-05-06T05:02:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ab76e81fc1842c747b0a33da8cf9874e3537c5ab023450ee1a6a314453e7263
    source_path: concepts/presence.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw の「プレゼンス」は、以下を軽量かつベストエフォートで表示するビューです。

- **Gateway** 自体、および
- **Gateway に接続しているクライアント**（mac アプリ、WebChat、CLI など）

プレゼンスは主に、macOS アプリの **Instances** タブを表示し、
オペレーターが素早く状況を把握できるようにするために使われます。

## プレゼンスのフィールド（表示される内容）

プレゼンスエントリは、次のようなフィールドを持つ構造化オブジェクトです。

- `instanceId`（任意だが強く推奨）: 安定したクライアント ID（通常は `connect.client.instanceId`）
- `host`: 人間が読みやすいホスト名
- `ip`: ベストエフォートの IP アドレス
- `version`: クライアントのバージョン文字列
- `deviceFamily` / `modelIdentifier`: ハードウェアのヒント
- `mode`: `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds`: 「最後のユーザー入力からの秒数」（分かる場合）
- `reason`: `self`, `connect`, `node-connected`, `periodic`, ...
- `ts`: 最終更新タイムスタンプ（エポックからのミリ秒）

## 生成元（プレゼンスの由来）

プレゼンスエントリは複数のソースから生成され、**マージ**されます。

### 1) Gateway 自身のエントリ

Gateway は起動時に常に「self」エントリを初期登録するため、クライアントが接続する前でも UI にゲートウェイホストが表示されます。

### 2) WebSocket 接続

すべての WS クライアントは `connect` リクエストから開始します。ハンドシェイクが成功すると、Gateway はその接続のプレゼンスエントリを upsert します。

#### 単発の CLI コマンドが表示されない理由

CLI は短時間の単発コマンドのために接続することがよくあります。Instances リストが過剰に増えるのを避けるため、`client.mode === "cli"` はプレゼンスエントリに**変換されません**。

### 3) `system-event` ビーコン

クライアントは `system-event` メソッドを使って、より詳細な定期ビーコンを送信できます。mac アプリはこれを使って、ホスト名、IP、`lastInputSeconds` を報告します。

### 4) ノード接続（role: node）

ノードが `role: node` で Gateway WebSocket 経由で接続すると、Gateway はそのノードのプレゼンスエントリを upsert します（他の WS クライアントと同じ流れ）。

## マージと重複排除のルール（`instanceId` が重要な理由）

プレゼンスエントリは、単一のメモリ内マップに保存されます。

- エントリは**プレゼンスキー**でキー付けされます。
- 最適なキーは、再起動後も維持される安定した `instanceId`（`connect.client.instanceId` 由来）です。
- キーは大文字と小文字を区別しません。

クライアントが安定した `instanceId` なしで再接続すると、**重複**行として表示されることがあります。

## TTL とサイズ上限

プレゼンスは意図的に一時的なものです。

- **TTL:** 5 分より古いエントリは削除されます
- **最大エントリ数:** 200（最も古いものから削除）

これによりリストを新鮮に保ち、メモリ使用量が無制限に増えるのを避けます。

## リモート/トンネルの注意点（ループバック IP）

クライアントが SSH トンネル / ローカルポートフォワード経由で接続すると、Gateway にはリモートアドレスが `127.0.0.1` として見えることがあります。クライアントが報告した適切な IP を上書きしないよう、ループバックのリモートアドレスは無視されます。

## 利用側

### macOS Instances タブ

macOS アプリは `system-presence` の出力を表示し、最終更新からの経過時間に基づいて小さなステータスインジケーター（Active/Idle/Stale）を適用します。

## デバッグのヒント

- 生のリストを見るには、Gateway に対して `system-presence` を呼び出します。
- 重複が表示される場合:
  - クライアントがハンドシェイクで安定した `client.instanceId` を送信していることを確認します
  - 定期ビーコンが同じ `instanceId` を使用していることを確認します
  - 接続由来のエントリに `instanceId` が欠けていないか確認します（この場合、重複は想定どおりです）

## 関連

<CardGroup cols={2}>
  <Card title="Typing indicators" href="/ja-JP/concepts/typing-indicators" icon="ellipsis">
    入力インジケーターが送信されるタイミングと、その調整方法。
  </Card>
  <Card title="Streaming and chunking" href="/ja-JP/concepts/streaming" icon="bars-staggered">
    送信ストリーミング、チャンク化、チャネルごとのフォーマット。
  </Card>
  <Card title="Gateway architecture" href="/ja-JP/concepts/architecture" icon="diagram-project">
    Gateway コンポーネントと、プレゼンス更新を駆動する WebSocket プロトコル。
  </Card>
  <Card title="Gateway protocol" href="/ja-JP/gateway/protocol" icon="plug">
    `connect`、`system-event`、`system-presence` のワイヤプロトコル。
  </Card>
</CardGroup>
