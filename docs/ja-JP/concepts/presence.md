---
read_when:
    - Instances タブのデバッグ
    - 重複または古いインスタンス行の調査
    - Gateway WS 接続またはシステムイベントビーコンの変更
summary: OpenClaw のプレゼンスエントリが生成、マージ、表示される仕組み
title: プレゼンス
x-i18n:
    generated_at: "2026-07-05T11:20:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2b8a2bf688fd94bd7145ca511fec259b9c868ea9bcbe75b12587f747dfaadf4d
    source_path: concepts/presence.md
    workflow: 16
---

OpenClaw の「プレゼンス」は、次を軽量かつベストエフォートで示すビューです。

- **Gateway** 自体、および
- **Gateway に接続しているクライアント**（mac アプリ、WebChat、CLI など）

プレゼンスは主に、macOS アプリの **Instances** タブを表示し、
オペレーターがすばやく状況を把握できるようにするために使われます。

## プレゼンスフィールド（表示される内容）

プレゼンスエントリは、次のようなフィールドを持つ構造化オブジェクトです。

- `instanceId`（任意だが強く推奨）: 安定したクライアント識別子（通常は `connect.client.instanceId`）
- `host`: 人間が読みやすいホスト名
- `ip`: ベストエフォートの IP アドレス
- `version`: クライアントバージョン文字列
- `deviceFamily` / `modelIdentifier`: ハードウェアのヒント
- `mode`: `ui`, `webchat`, `cli`, `backend`, `node`, `probe`, `test`
- `lastInputSeconds`: 既知の場合、最後のユーザー入力からの秒数
- `reason`: クライアントが提供する自由形式の文字列。Gateway 自体は `self`, `connect`, `disconnect` のみを発行します
- `deviceId`, `roles`, `scopes`: 接続ハンドシェイクから得られるデバイス識別子とロール/スコープのヒント
- `ts`: 最終更新タイムスタンプ（エポックからのミリ秒）

## 生成元（プレゼンスの取得元）

プレゼンスエントリは複数のソースによって生成され、**マージ**されます。

### 1) Gateway 自身のエントリ

Gateway は起動時に常に「self」エントリを初期投入するため、クライアントが接続する前でも UI にゲートウェイホストが表示されます。

### 2) WebSocket 接続

すべての WS クライアントは `connect` リクエストから開始します。ハンドシェイクに成功すると、Gateway はその接続のプレゼンスエントリを upsert します。

#### 1 回限りの CLI コマンドが表示されない理由

CLI は短時間の 1 回限りのコマンドのために接続することがよくあります。Instances リストを大量の項目で埋めないようにするため、`client.mode === "cli"` はプレゼンスエントリに**変換されません**。

### 3) `system-event` ビーコン

クライアントは `system-event` メソッドを使って、より詳細な定期ビーコンを送信できます。mac アプリはこれを使ってホスト名、IP、`lastInputSeconds` を報告します。

### 4) Node 接続（role: node）

ノードが `role: node` で Gateway WebSocket 経由で接続すると、Gateway はそのノードのプレゼンスエントリを upsert します（他の WS クライアントと同じフロー）。

## マージと重複排除のルール（`instanceId` が重要な理由）

プレゼンスエントリは単一のインメモリマップに保存され、大文字小文字を区別せずに、次のうち最初に利用可能なものをキーにします。ペアリング済みデバイス ID、`connect.client.instanceId`、最後の手段として接続ごとの ID。

CLI クライアントは追跡対象から完全に除外されるため（上記参照）、その接続 ID がキーになることはありません。それ以外のすべてのクライアントでは、接続 ID へのフォールバックにより、安定した `instanceId` なしで再接続するクライアントは**重複**行として表示されます。

## TTL と上限サイズ

プレゼンスは意図的に一時的なものです。

- **TTL:** 5 分より古いエントリは剪定されます
- **最大エントリ数:** 200（古いものから先に削除）

これにより、リストを最新に保ち、メモリ使用量が無制限に増えることを避けられます。

## リモート/トンネルの注意点（ループバック IP）

クライアントが SSH トンネル / ローカルポートフォワード経由で接続すると、Gateway はリモートアドレスを `127.0.0.1` として認識する場合があります。そのトンネルアドレスをクライアントの IP として記録しないように、接続処理では、検出されたローカル（ループバック）クライアントについて、ループバックアドレスをエントリに書き込むのではなく、`ip` を完全に省略します。

## 利用側

### macOS Instances タブ

macOS アプリは `system-presence` の出力を表示し、最終更新からの経過時間に基づいて小さなステータスインジケーター（Active/Idle/Stale）を適用します。

## デバッグのヒント

- 生のリストを見るには、Gateway に対して `system-presence` を呼び出します。
- 重複が表示される場合:
  - クライアントがハンドシェイクで安定した `client.instanceId` を送信していることを確認します
  - 定期ビーコンが同じ `instanceId` を使っていることを確認します
  - 接続由来のエントリに `instanceId` がないか確認します（重複は想定どおりです）

## 関連

<CardGroup cols={2}>
  <Card title="Typing indicators" href="/ja-JP/concepts/typing-indicators" icon="ellipsis">
    入力中インジケーターが送信されるタイミングと、その調整方法。
  </Card>
  <Card title="Streaming and chunking" href="/ja-JP/concepts/streaming" icon="bars-staggered">
    送信ストリーミング、チャンク化、チャネルごとのフォーマット。
  </Card>
  <Card title="Gateway architecture" href="/ja-JP/concepts/architecture" icon="diagram-project">
    プレゼンス更新を駆動する Gateway コンポーネントと WebSocket プロトコル。
  </Card>
  <Card title="Gateway protocol" href="/ja-JP/gateway/protocol" icon="plug">
    `connect`、`system-event`、`system-presence` のワイヤープロトコル。
  </Card>
</CardGroup>
