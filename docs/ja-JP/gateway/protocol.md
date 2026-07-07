---
read_when:
    - Gateway WS クライアントの実装または更新
    - プロトコル不一致や接続失敗のデバッグ
    - プロトコルスキーマ/モデルの再生成
summary: 'Gateway WebSocket プロトコル: ハンドシェイク、フレーム、バージョニング'
title: Gateway プロトコル
x-i18n:
    generated_at: "2026-07-06T21:48:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15e0635d1b96e8ceabc98cfcececebde873b901de7b4bae2048b4d5cd4909c9d
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS プロトコルは、OpenClaw の単一のコントロールプレーンおよびノードトランスポートです。すべてのクライアント（CLI、Web UI、macOS アプリ、iOS/Android ノード、ヘッドレスノード）は WebSocket で接続し、ハンドシェイク時に **role** と **scope** を宣言します。

## トランスポートとフレーミング

- WebSocket、テキストフレーム、JSON ペイロード。
- 最初のフレームは **必ず** `connect` リクエストである必要があります。
- 接続前フレームは 64 KiB（`MAX_PREAUTH_PAYLOAD_BYTES`）に制限されます。ハンドシェイク後は `hello-ok.policy.maxPayload` と `hello-ok.policy.maxBufferedBytes` に従います。診断が有効な場合、過大な受信フレームと低速な送信バッファは、Gateway がフレームを閉じるかドロップする前に `payload.large` イベントを発行します。これらのイベントには `surface`、バイトサイズ、制限、安全な理由コードが含まれますが、メッセージ本文、添付ファイルの内容、生フレームバイト、トークン、Cookie、シークレットは含まれません。

フレーム形状:

- リクエスト: `{type:"req", id, method, params}`
- レスポンス: `{type:"res", id, ok, payload|error}`
- イベント: `{type:"event", event, payload, seq?, stateVersion?}`

副作用を伴うメソッドには冪等性キーが必要です（スキーマを参照）。

## ハンドシェイク

Gateway は接続前チャレンジを送信します:

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

クライアントは `connect` で応答します:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 4,
    "maxProtocol": 4,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway は `hello-ok` で応答します:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 4,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "auth": {
      "role": "operator",
      "scopes": ["operator.read", "operator.write"]
    },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`、`features`、`snapshot`、`policy`、`auth` はすべて `HelloOkSchema`（`packages/gateway-protocol/src/schema/frames.ts`）で必須です。`auth` は、デバイストークンが発行されない場合でも、ネゴシエートされた role/scopes を報告します（上記の形状）。`pluginSurfaceUrls` は任意で、Plugin サーフェス名（例: `canvas`）をスコープ付きホスト URL にマッピングします。有効期限が切れる場合があるため、ノードは新しいエントリを取得するために `{ "surface": "canvas" }` で `node.pluginSurface.refresh` を呼び出します。非推奨の `canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh` パスはサポートされていません。Plugin サーフェスを使用してください。

Gateway がまだ起動サイドカーの完了中である場合、`connect` は `details.reason: "startup-sidecars"` と `retryAfterMs` を伴う再試行可能な `UNAVAILABLE` エラーを返すことがあります。これを終端的なハンドシェイク失敗として扱うのではなく、接続予算内で再試行してください。

デバイストークンが発行されると、`hello-ok.auth` に追加されます:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

組み込みの QR/セットアップコードのブートストラップはモバイル引き渡しパスです。成功したベースラインセットアップコード接続は、プライマリノードトークンと、境界付けられたオペレータートークンを 1 つ返します:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": [],
    "deviceTokens": [
      {
        "deviceToken": "…",
        "role": "operator",
        "scopes": ["operator.approvals", "operator.read", "operator.talk.secrets", "operator.write"]
      }
    ]
  }
}
```

このオペレーター引き渡しは意図的に境界付けられています。Talk 設定の読み取り用の `operator.talk.secrets` を含め、モバイルオペレーターループとネイティブセットアップを開始するには十分ですが、ペアリング変更スコープや `operator.admin` は含まれません。より広いペアリング/管理アクセスには、別途承認済みのペアリングまたはトークンフローが必要です。`hello-ok.auth.deviceTokens` は、ブートストラップ認証が信頼済みトランスポート（`wss://` または loopback/local pairing）上で実行された場合にのみ永続化してください。

信頼済みの同一プロセスバックエンドクライアント（`client.id: "gateway-client"`、`client.mode: "backend"`）は、共有 Gateway トークン/パスワードで認証する直接 loopback 接続では `device` を省略できます。このパスは内部コントロールプレーン RPC（例: サブエージェントセッション更新）用に予約されており、古い CLI/デバイスペアリングベースラインがローカルバックエンド作業をブロックすることを避けます。リモート、ブラウザー由来、ノード、明示的なデバイストークン/デバイス ID クライアントは、通常のペアリングとスコープアップグレードチェックを引き続き通過します。

### ノード接続の例

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 4,
    "maxProtocol": 4,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

ノードは接続時に capability claim を宣言します:

- `caps`: `camera`、`canvas`、`screen`、`location`、`voice`、`talk` などの高レベルカテゴリ。
- `commands`: invoke 用のコマンド許可リスト。
- `permissions`: きめ細かなトグル（例: `screen.record`、`camera.capture`）。

Gateway はこれらを claim として扱い、サーバー側の許可リストを適用します。

## ロールとスコープ

完全なオペレータースコープモデル、承認時チェック、共有シークレットのセマンティクスについては、[オペレータースコープ](/ja-JP/gateway/operator-scopes) を参照してください。

ロール:

- `operator`: コントロールプレーンクライアント（CLI/UI/自動化）。
- `node`: capability ホスト（camera/screen/canvas/system.run）。

オペレータースコープ（`src/gateway/operator-scopes.ts`）、完全な閉集合:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` を伴う `talk.config` には `operator.talk.secrets`（または `operator.admin`）が必要です。シークレットが含まれる場合は、アクティブな Talk プロバイダー認証情報を `talk.resolved.config.apiKey` から読み取ります。`talk.providers.<id>.apiKey` はソース形状のままであり、SecretRef オブジェクトまたは墨消し済み文字列である場合があります。

Plugin 登録済みの Gateway RPC メソッドは独自のオペレータースコープを要求できますが、これらの予約済みコアプレフィックスは常に `operator.admin`（`src/shared/gateway-method-policy.ts`）に解決されます: `config.*`、`exec.approvals.*`、`wizard.*`、`update.*`。

メソッドスコープは最初のゲートにすぎません。`chat.send` 経由で到達する一部のスラッシュコマンドは、より厳格なコマンドレベルチェックを適用します。永続的な `/config set` と `/config unset` の書き込みには、すでに低いオペレータースコープを保持している Gateway クライアントであっても `operator.admin` が必要です。

`node.pair.approve` には、ベースメソッドスコープ（`operator.pairing`）に加えて、保留中リクエストで宣言された `commands`（`src/infra/node-pairing-authz.ts`）に基づく追加の承認時スコープチェックがあります:

| 宣言されたコマンド                                             | 必要なスコープ                        |
| -------------------------------------------------------------- | ------------------------------------- |
| なし                                                           | `operator.pairing`                    |
| 非 exec コマンド                                               | `operator.pairing` + `operator.write` |
| `system.run`、`system.run.prepare`、または `system.which` を含む | `operator.pairing` + `operator.admin` |

## Presence

- `system-presence` は、`deviceId`、`roles`、`scopes` を含む、デバイス ID をキーにしたエントリを返します。そのため UI は、デバイスが operator と node の両方として接続している場合でも、デバイスごとに 1 行を表示できます。
- `node.list` には任意の `lastSeenAtMs` と `lastSeenReason` が含まれます。接続中のノードは理由 `connect` で現在の接続時刻を報告します。ペアリング済みノードは、信頼済みノードイベント経由で永続的なバックグラウンド presence も報告できます。

### ノードバックグラウンド alive イベント

ノードは `event: "node.presence.alive"` を伴う `node.event` を呼び出し、ペアリング済みノードがバックグラウンド wake 中に生存していたことを、接続中としてマークせずに記録します:

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` は閉じた enum です: `background`、`silent_push`、`bg_app_refresh`、`significant_location`、`manual`、`connect`。不明な値は `background`（`src/shared/node-presence.ts`）に正規化されます。このイベントは、認証済みノードデバイスセッションに対してのみ永続化されます。デバイスなしまたは未ペアリングのセッションは `handled: false` を返します。

成功した Gateway は構造化された結果を返します:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

古い Gateway は `node.event` に対して `{ "ok": true }` のみを返す場合があります。それは永続的な presence 永続化ではなく、RPC が確認応答されたものとして扱ってください。

## ブロードキャストイベントのスコープ設定

サーバーからプッシュされるブロードキャストイベントはスコープでゲートされるため、ペアリングスコープのみ、またはノードのみのセッションがセッション内容を受動的に受信することはありません（`src/gateway/server-broadcast.ts`）:

- チャット、エージェント、ツール結果フレーム（ストリーミングされた `agent` イベント、ツール結果イベント）には少なくとも `operator.read` が必要です。それを持たないセッションは、これらのフレームを完全にスキップします。
- Plugin 定義の `plugin.*` ブロードキャストは、デフォルトで `operator.write` または `operator.admin` にゲートされます。`plugin.approval.requested` / `plugin.approval.resolved` などの明示的なエントリは、代わりに `operator.approvals` を使用します。
- ステータス/トランスポートイベント（`heartbeat`、`presence`、`tick`、接続/切断ライフサイクル）は制限なしのままなので、すべての認証済みセッションがトランスポートの健全性を観測できます。
- 不明なブロードキャストイベントファミリーは、登録済みハンドラーが明示的に緩和しない限り、デフォルトでスコープゲートされます（fail-closed）。

各クライアント接続は独自のクライアントごとのシーケンス番号を保持するため、クライアントごとにスコープでフィルタされたイベントストリームの異なるサブセットを見る場合でも、そのソケット上のブロードキャストは単調に順序付けられます。

## RPC メソッドファミリー

`hello-ok.features.methods` は、`src/gateway/server-methods-list.ts` に読み込まれた Plugin/チャネルメソッドエクスポートを加えて構築される保守的な discovery リストです。すべてのメソッドを生成してダンプしたものではなく、一部のメソッド（例: `push.test`、`web.login.start`、`web.login.wait`、`sessions.usage`）は、実在して呼び出し可能なメソッドであっても意図的に discovery から除外されています。これは `src/gateway/server-methods/*.ts` の完全な列挙ではなく、機能 discovery として扱ってください。

  <AccordionGroup>
  <Accordion title="システムとアイデンティティ">
    - `health` は、キャッシュ済みまたは新しくプローブされた Gateway のヘルススナップショットを返します。
    - `diagnostics.stability` は、最近の境界付き診断安定性レコーダーを返します: イベント名、件数、バイトサイズ、メモリ読み取り値、キュー/セッション状態、チャンネル/Plugin 名、セッション ID。チャットテキスト、Webhook 本文、ツール出力、生のリクエスト/レスポンス本文、トークン、Cookie、シークレットは含まれません。`operator.read` が必要です。
    - `status` は、`/status` 形式の Gateway サマリーを返します。機密フィールドは、admin スコープのオペレータークライアントにのみ返されます。
    - `gateway.identity.get` は、リレーとペアリングフローで使用される Gateway デバイスアイデンティティを返します。
    - `system-presence` は、接続中のオペレーター/Node デバイスの現在のプレゼンススナップショットを返します。
    - `system-event` はシステムイベントを追加し、プレゼンスコンテキストを更新/ブロードキャストできます。
    - `last-heartbeat` は、最新の永続化済みハートビートイベントを返します。
    - `set-heartbeats` は、Gateway 上のハートビート処理を切り替えます。

  </Accordion>

  <Accordion title="モデルと使用量">
    - `models.list` は、ランタイムで許可されたモデルカタログを返します。下記の「`models.list` ビュー」を参照してください。
    - `usage.status` は、プロバイダーの使用量ウィンドウ/残りクォータのサマリーを返します。
    - `usage.cost` は、日付範囲の集計済みコスト使用量サマリーを返します。1 つのエージェントには `agentId` を渡し、設定済みエージェントを集計するには `agentScope: "all"` を渡します。
    - `doctor.memory.status` は、アクティブなデフォルトエージェントワークスペースのベクトルメモリ/キャッシュ済み埋め込みの準備状態を返します。明示的にライブ埋め込みプロバイダーへ ping する場合にのみ、`{ "probe": true }` または `{ "deep": true }` を渡します。Dreaming ストア統計を 1 つのエージェントワークスペースに限定するには `{ "agentId": "agent-id" }` を渡します。省略すると、設定済みの Dreaming ワークスペースが集計されます。
    - `doctor.memory.dreamDiary`、`doctor.memory.backfillDreamDiary`、`doctor.memory.resetDreamDiary`、`doctor.memory.resetGroundedShortTerm`、`doctor.memory.repairDreamingArtifacts`、`doctor.memory.dedupeDreamDiary` は、任意で `{ "agentId": "agent-id" }` を受け取ります。省略すると、設定済みのデフォルトエージェントワークスペースを操作します。
    - `doctor.memory.remHarness` は、リモートコントロールプレーンのクライアント向けに、境界付きの読み取り専用 REM ハーネスプレビューを返します。これには、ワークスペースパス、メモリスニペット、レンダリング済みの根拠付き Markdown、深い昇格候補が含まれます。`operator.read` が必要です。
    - `sessions.usage` は、セッションごとの使用量サマリーを返します。1 つのエージェントには `agentId` を渡し、設定済みエージェントをまとめて一覧表示するには `agentScope: "all"` を渡します。
    - `sessions.usage.timeseries` は、1 つのセッションの時系列使用量を返します。
    - `sessions.usage.logs` は、1 つのセッションの使用量ログエントリを返します。

  </Accordion>

  <Accordion title="チャンネルとログインヘルパー">
    - `channels.status` は、組み込み + バンドル済みチャンネル/Plugin のステータスサマリーを返します。
    - `channels.logout` は、チャンネルが対応している場合に、特定のチャンネル/アカウントからログアウトします。
    - `web.login.start` は、現在の QR 対応 Web チャンネルプロバイダーの QR/Web ログインフローを開始します。
    - `web.login.wait` は、そのフローの完了を待ち、成功時にチャンネルを開始します。
    - `push.test` は、登録済み iOS Node にテスト用 APNs プッシュを送信します。
    - `voicewake.get` は、保存済みのウェイクワードトリガーを返します。
    - `voicewake.set` は、ウェイクワードトリガーを更新し、変更をブロードキャストします。

  </Accordion>

  <Accordion title="メッセージングとログ">
    - `send` は、チャットランナー外でチャネル/アカウント/スレッドを対象に送信するための、直接のアウトバウンド配信 RPC です。
    - `logs.tail` は、カーソル/制限と最大バイト制御付きで、構成済みの Gateway ファイルログ末尾を返します。

  </Accordion>

  <Accordion title="オペレーター端末">
    - `terminal.open` は、明示的な `agentId` またはデフォルトエージェントのホスト PTY を開始し、解決されたエージェント、作業ディレクトリ、シェル、閉じ込め状態を返します。
    - `terminal.input`、`terminal.resize`、`terminal.close` は、呼び出し元接続が所有するセッションに対してのみ動作します。
    - `terminal.data` および `terminal.exit` イベントは、セッションを所有する接続にのみストリーミングされます。
    - 接続が切断されたセッションは終了されず、デタッチされます。最近の出力は境界付きのサーバー側バッファに蓄積され、その間 `gateway.terminal.detachedSessionTimeoutSeconds`（デフォルト 300。`0` は切断時に終了する動作を復元）だけ再アタッチ可能なままになります。
    - `terminal.list` はアタッチ可能なセッションを返します。`terminal.attach` はライブまたはデタッチ済みセッションを呼び出し元接続に再バインドし、再生バッファを返します（tmux 方式のテイクオーバー — 以前のライブ所有者は理由 `detached` の `terminal.exit` を受け取ります）。`terminal.text` はアタッチせずにバッファをプレーンテキストとして読み取ります。
    - すべての端末メソッドには `operator.admin` が必要です。`gateway.terminal.enabled` は明示的に true でなければなりません。完全にサンドボックス化されたエージェントは拒否され、エージェントポリシー変更により、既存および処理中の PTY はデタッチ済みのものを含めて閉じられます。

  </Accordion>

  <Accordion title="Talk と TTS">
    - `talk.catalog` は、音声合成、ストリーミング文字起こし、リアルタイム音声向けの読み取り専用 Talk プロバイダーカタログを返します。正規プロバイダー ID、レジストリエイリアス、ラベル、構成状態、省略可能なグループレベルの `ready` 結果、公開モデル/音声 ID、正規モード、トランスポート、ブレイン戦略、リアルタイム音声/機能フラグを含み、プロバイダーシークレットを返したりグローバル構成を変更したりしません。現在の Gateway は実行時プロバイダー選択の適用後に `ready` を設定します。古い Gateway で存在しない場合は未検証として扱ってください。
    - `talk.config` は有効な Talk 構成ペイロードを返します。`includeSecrets` には `operator.talk.secrets`（または `operator.admin`）が必要です。
    - `talk.session.create` は、`realtime/gateway-relay`、`transcription/gateway-relay`、または `stt-tts/managed-room` 用に Gateway 所有の Talk セッションを作成します。`stt-tts/managed-room` では、`sessionKey` を渡す `operator.write` 呼び出し元は、スコープ付きセッションキー可視性のために `spawnedBy` も渡す必要があります。スコープなしの `sessionKey` 作成と `brain: "direct-tools"` には `operator.admin` が必要です。
    - `talk.session.join` は managed-room セッショントークンを検証し、必要に応じて `session.ready` または `session.replaced` を発行し、ルーム/セッションメタデータと最近の Talk イベントを返します。平文トークンやそのハッシュは返しません。
    - `talk.session.appendAudio` は、base64 PCM 入力音声を Gateway 所有のリアルタイムリレーおよび文字起こしセッションに追加します。
    - `talk.session.startTurn`、`talk.session.endTurn`、`talk.session.cancelTurn` は、状態がクリアされる前に古いターンを拒否しながら、managed-room のターンライフサイクルを駆動します。
    - `talk.session.cancelOutput` はアシスタント音声出力を停止します。主に Gateway リレーセッションで VAD によって制御される割り込みに使用します。
    - `talk.session.submitToolResult` は、Gateway 所有のリアルタイムリレーセッションが発行したプロバイダーツール呼び出しを完了します。最終結果が後続する中間ツール出力には `options: { willContinue: true }` を渡し、別のリアルタイム応答を開始せずにツール結果でプロバイダー呼び出しを満たす場合は `options: { suppressResponse: true }` を渡します。
    - `talk.session.steer` は、Gateway 所有のエージェント支援 Talk セッションにアクティブ実行の音声制御を送信します: `{ sessionId, text, mode? }`。ここで `mode` は `status`、`steer`、`cancel`、または `followup` です。省略したモードは発話テキストから分類されます。
    - `talk.session.close` は、Gateway 所有のリレー、文字起こし、または managed-room セッションを閉じ、終端 Talk イベントを発行します。
    - `talk.mode` は、WebChat/Control UI クライアント向けに現在の Talk モード状態を設定/ブロードキャストします。
    - `talk.client.create` は、Gateway が構成、認証情報、指示、ツールポリシーを所有したまま、`webrtc` または `provider-websocket` を使ってクライアント所有のリアルタイムプロバイダーセッションを作成します。
    - `talk.client.toolCall` は、クライアント所有のリアルタイムトランスポートがプロバイダーツール呼び出しを Gateway ポリシーに転送できるようにします。最初にサポートされるツールは `openclaw_agent_consult` です。クライアントは実行 ID を受け取り、通常のチャットライフサイクルイベントを待ってから、プロバイダー固有のツール結果を送信します。
    - `talk.client.steer` は、クライアント所有のリアルタイムトランスポート向けにアクティブ実行の音声制御を送信します。Gateway は `sessionKey` からアクティブな埋め込み実行を解決し、ステアリングを黙って破棄する代わりに、構造化された受理/拒否結果を返します。
    - `talk.event` は、リアルタイム、文字起こし、STT/TTS、managed-room、テレフォニー、会議アダプター向けの単一の Talk イベントチャネルです。
    - `talk.speak` は、アクティブな Talk 音声合成プロバイダーを通じて音声を合成します。
    - `tts.status` は、TTS の有効状態、アクティブプロバイダー、フォールバックプロバイダー、プロバイダー構成状態を返します。
    - `tts.providers` は、可視の TTS プロバイダーインベントリを返します。
    - `tts.enable` と `tts.disable` は TTS 設定状態を切り替えます。
    - `tts.setProvider` は優先 TTS プロバイダーを更新します。
    - `tts.convert` は単発のテキスト読み上げ変換を実行します。
    - `tts.speak`（`operator.write`）は、構成済みの汎用 TTS プロバイダーチェーンで空でない `text` をレンダリングし、`audioBase64` として 1 つの完全なクリップをインラインで返します。あわせて `provider` と、省略可能な `outputFormat`、`mimeType`、`fileExtension` メタデータも返します。`tts.convert` とは異なり、Gateway ローカルパスを返しません。`talk.speak` とは異なり、Talk プロバイダーを必要としません。`messages.tts.maxTextLength` を超えるテキストは `INVALID_REQUEST` を返し、合成失敗は `UNAVAILABLE` を返します。

  </Accordion>

  <Accordion title="シークレット、設定、更新、ウィザード">
    - `secrets.reload` はアクティブな SecretRefs を再解決し、完全に成功した場合にのみランタイムのシークレット状態を差し替えます。
    - `secrets.resolve` は、特定のコマンド/ターゲットセットに対するコマンドターゲットのシークレット割り当てを解決します。
    - `config.get` は現在の設定スナップショットとハッシュを返します。
    - `config.set` は検証済みの設定ペイロードを書き込みます。
    - `config.patch` は部分的な設定更新をマージします。破壊的な配列置換には、影響を受けるパスを `replacePaths` に含める必要があります。配列エントリ配下のネストした配列には、`agents.list[].skills` のような `[]` パスを使用します。
    - `config.apply` は完全な設定ペイロードを検証して置き換えます。
    - `config.schema` は、Control UI と CLI ツールで使用されるライブ設定スキーマペイロードを返します。これには、スキーマ、`uiHints`、バージョン、生成メタデータ、読み込み可能な場合は Plugin + チャンネルスキーマメタデータが含まれます。UI と同じラベル/ヘルプテキスト由来の `title` / `description` メタデータも含まれ、対応するフィールドドキュメントが存在する場合は、ネストしたオブジェクト、ワイルドカード、配列アイテム、`anyOf` / `oneOf` / `allOf` の合成分岐も対象になります。
    - `config.schema.lookup` は、1 つの設定パスに対するパススコープのルックアップペイロードを返します。正規化済みパス、浅いスキーマノード、一致したヒント + `hintPath`、任意の `reloadKind`、UI/CLI の掘り下げ用の直下の子要約が含まれます。`reloadKind` は `restart`、`hot`、`none` のいずれか（`src/config/schema.ts`）で、要求されたパスに対する Gateway 設定リロードプランナーを反映します。ルックアップスキーマノードは、ユーザー向けドキュメントと一般的な検証フィールド（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、数値/文字列/配列/オブジェクトの境界、`additionalProperties`、`deprecated`、`readOnly`、`writeOnly`）を保持します。子要約は、`key`、正規化済みの `path`、`type`、`required`、`hasChildren`、任意の `reloadKind`、さらに一致した `hint` / `hintPath` を公開します。
    - `update.run` は Gateway の更新フローを実行し、更新が成功した場合にのみ再起動をスケジュールします。セッションを持つ呼び出し元は `continuationMessage` を含めることができ、起動時に再起動継続キューを通じて後続のエージェントターンを 1 回再開できます。パッケージマネージャー更新と、コントロールプレーンからの監督付き git チェックアウト更新は、ライブ Gateway 内でパッケージツリーを置き換えたりチェックアウト/ビルド出力を変更したりする代わりに、デタッチされたマネージドサービスへのハンドオフを使用します。開始されたハンドオフは `ok: true`、`result.reason: "managed-service-handoff-started"`、`handoff.status: "started"` を返します。利用不能または失敗したハンドオフは `ok: false` と `managed-service-handoff-unavailable` または `managed-service-handoff-failed` を返し、手動のシェル更新が必要な場合は `handoff.command` も返します。利用不能とは、systemd 向けの `OPENCLAW_SYSTEMD_UNIT` など、OpenClaw に安全なスーパーバイザー境界または永続的なサービス ID がないことを意味します。開始済みのハンドオフ中は、再起動センチネルが一時的に `stats.reason: "restart-health-pending"` を報告する場合があります。CLI が再起動後の Gateway を検証し、最終的な `ok` センチネルを書き込むまで、継続は遅延されます。
    - `update.status` は最新の更新再起動センチネルを更新して返します。利用可能な場合は、再起動後に稼働中のバージョンも含まれます。
    - `wizard.start`、`wizard.next`、`wizard.status`、`wizard.cancel` は、オンボーディングウィザードを WS RPC 経由で公開します。

  </Accordion>

  <Accordion title="エージェントとワークスペースのヘルパー">
    - `agents.list` は、実効モデルとランタイムメタデータを含む、設定済みのエージェントエントリを返します。
    - `agents.create`、`agents.update`、`agents.delete` は、エージェントレコードとワークスペースの接続を管理します。
    - `agents.files.list`、`agents.files.get`、`agents.files.set` は、エージェントに公開されるブートストラップワークスペースファイルを管理します。
    - `audit.list` は、エージェント実行とツールアクションイベントの、境界付きでメタデータのみの台帳を返します。
    - `agents.workspace.list` と `agents.workspace.get`（`operator.read`）は、[オペレータースコープ](/ja-JP/gateway/operator-scopes)で説明されている信頼済みオペレータードメイン内のクライアントに対し、エージェントのワークスペースディレクトリを読み取り専用かつページ分割で参照できるようにします。リクエストはワークスペース相対パスのみを受け付けます。読み取りは realpath 化されたワークスペースルート内に制限され（シンボリックリンクとハードリンクによる脱出は拒否）、サイズ上限があり、UTF-8 テキストと一般的な画像タイプ（base64）に限定されます。レスポンスはホスト上のワークスペースパスを公開しません。この名前空間には書き込み操作はありません。
    - `tasks.list`、`tasks.get`、`tasks.cancel` は、Gateway タスク台帳を SDK とオペレータークライアントに公開します。下記の[タスク台帳 RPC](#task-ledger-rpcs)を参照してください。
    - `artifacts.list`、`artifacts.get`、`artifacts.download` は、明示的な `sessionKey`、`runId`、または `taskId` スコープに対して、トランスクリプト由来のアーティファクト要約とダウンロードを公開します。実行クエリとタスククエリは、所有するセッションをサーバー側で解決し、一致する来歴を持つトランスクリプトメディアのみを返します。安全でない、またはローカル URL のソースは、サーバー側で取得せず、未対応のダウンロードを返します。
    - `environments.list` と `environments.status` は、SDK クライアント向けに、読み取り専用の Gateway ローカル環境とノード環境の検出を公開します。
    - `agent.identity.get` は、エージェントまたはセッションの実効アシスタント ID を返します。
    - `agent.wait` は、実行の完了を待機し、利用可能な場合は終端スナップショットを返します。

  </Accordion>

  <Accordion title="セッション制御">
    - `sessions.list` は現在のセッションインデックスを返します。エージェントランタイムバックエンドが設定されている場合は、行ごとの `agentRuntime` メタデータも含まれます。
    - `sessions.subscribe` と `sessions.unsubscribe` は、現在の WS クライアントに対するセッション変更イベント購読を切り替えます。
    - `sessions.messages.subscribe` と `sessions.messages.unsubscribe` は、1 つのセッションに対するトランスクリプト/メッセージイベント購読を切り替えます。
    - `sessions.preview` は、特定のセッションキーに対する境界付きのトランスクリプトプレビューを返します。
    - `sessions.describe` は、正確なセッションキーに対する 1 つの Gateway セッション行を返します。
    - `sessions.resolve` は、セッションターゲットを解決または正規化します。
    - `sessions.create` は、新しいセッションエントリを作成します。
    - `sessions.send` は、既存のセッションにメッセージを送信します。
    - `sessions.steer` は、アクティブなセッションに対する割り込みおよび誘導バリアントです。
    - `sessions.abort` は、セッションのアクティブな作業を中止します。`key` と任意の `runId` を渡すか、Gateway がセッションへ解決できるアクティブな実行については `runId` のみを渡します。
    - `sessions.patch` は、セッションメタデータ/オーバーライドを更新し、解決された正規モデルと実効 `agentRuntime` を報告します。
    - `sessions.reset`、`sessions.delete`、`sessions.compact` は、セッションメンテナンスを実行します。
    - `sessions.get` は、保存済みの完全なセッション行を返します。
    - チャット実行では、引き続き `chat.history`、`chat.send`、`chat.abort`、`chat.inject` を使用します。`chat.history` は UI クライアント向けに表示正規化されます。インラインディレクティブタグは表示テキストから削除され、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロック）と漏れた ASCII/全角のモデル制御トークンは削除され、純粋なサイレントトークンのアシスタント行（完全一致の `NO_REPLY` / `no_reply`）は省略され、過大な行はプレースホルダーで置き換えられる場合があります。
    - `chat.message.get` は、1 つの可視トランスクリプトエントリに対する追加的な境界付き全文メッセージリーダーです。`sessionKey`、セッション選択がエージェントスコープの場合は任意の `agentId`、および以前に `chat.history` を通じて公開されたトランスクリプト `messageId` を渡します。保存済みエントリがまだ利用可能で過大でない場合、Gateway は軽量履歴の切り詰め上限なしで、同じ表示正規化済み投影を返します。
    - `chat.send` は、1 ターンの `fastMode: "auto"` を受け付け、自動カットオフ前に開始されたモデル呼び出しには高速モードを使用し、その後に開始される再試行、フォールバック、ツール結果、または継続呼び出しは高速モードなしで開始します。カットオフの既定値は 60 秒（`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`）で、`agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` によりモデルごとに設定できます。`chat.send` の呼び出し元は、そのリクエストのカットオフを上書きするために、1 ターンの `fastAutoOnSeconds` を渡すことができます。

  </Accordion>

  <Accordion title="デバイスペアリングとデバイストークン">
    - `device.pair.list` は、保留中および承認済みのペアリング済みデバイスを返します。
    - `device.pair.setupCode` は、モバイルセットアップコードと、既定では PNG QR データ URL を作成します。`operator.admin` が必要で、広告される検出からは意図的に除外されています。結果には `setupCode`、任意の `qrDataUrl`、`gatewayUrl`、シークレットではない `auth` ラベル、`urlSource` が含まれます。
    - `device.pair.approve`、`device.pair.reject`、`device.pair.remove` は、デバイスペアリングレコードを管理します。
    - `device.token.rotate` は、承認済みロールと呼び出し元スコープの境界内で、ペアリング済みデバイストークンをローテーションします。
    - `device.token.revoke` は、承認済みロールと呼び出し元スコープの境界内で、ペアリング済みデバイストークンを取り消します。

    セットアップコードには、有効期間の短いブートストラップ認証情報が埋め込まれます。クライアントは、ペアリングフローを超えて
    それをログに記録したり永続化したりしてはなりません。

  </Accordion>

  <Accordion title="ノードペアリング、呼び出し、保留中の作業">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove`、`node.pair.verify` は、ノードペアリングとブートストラップ検証を扱います。
    - `node.list` と `node.describe` は、既知/接続済みノードの状態を返します。
    - `node.rename` は、ペアリング済みノードのラベルを更新します。
    - `node.invoke` は、接続済みノードへコマンドを転送します。
    - `node.invoke.result` は、呼び出しリクエストの結果を返します。
    - `node.event` は、ノード発のイベントを Gateway に戻します。
    - `node.pending.pull` と `node.pending.ack` は、接続済みノードキュー API です。
    - `node.pending.enqueue` と `node.pending.drain` は、オフライン/切断済みノード向けの永続的な保留作業を管理します。

  </Accordion>

  <Accordion title="承認ファミリー">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list`、`exec.approval.resolve` は、ワンショットの exec 承認リクエストと、保留中の承認の検索/再生を扱います。
    - `exec.approval.waitDecision` は、保留中の 1 つの exec 承認を待機し、最終判断（またはタイムアウト時は `null`）を返します。
    - `exec.approvals.get` と `exec.approvals.set` は、Gateway の exec 承認ポリシースナップショットを管理します。
    - `exec.approvals.node.get` と `exec.approvals.node.set` は、ノードリレーコマンドを介してノードローカルの exec 承認ポリシーを管理します。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision`、`plugin.approval.resolve` は、Plugin 定義の承認フローを扱います。

  </Accordion>

  <Accordion title="自動化、Skills、ツール">
    - 自動化: `wake` は即時または次の Heartbeat でのウェイクテキスト注入をスケジュールします。`cron.get`、`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` はスケジュール済み作業を管理します。
    - `cron.run` は、手動実行用のエンキュー型 RPC のままです。完了セマンティクスが必要なクライアントは、返された `runId` を読み取り、`cron.runs` をポーリングする必要があります。
    - `cron.runs` は、任意の空でない `runId` フィルターを受け付けるため、クライアントは同じジョブの他の履歴エントリと競合せずに、キューに入った 1 つの手動実行を追跡できます。
    - Skills とツール: `commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。下記の[オペレーターヘルパーメソッド](#operator-helper-methods)を参照してください。

  </Accordion>
</AccordionGroup>

### 共通イベントファミリー

- `chat`: `chat.inject` などの UI チャット更新、およびトランスクリプト専用のその他のチャット
  イベント。プロトコル v4 では、差分ペイロードは `deltaText` を運び、`message` は
  累積されたアシスタントのスナップショットのままです。非プレフィックス置換は
  `replace=true` を設定し、`deltaText` を置換テキストとして使用します。
- `session.message`、`session.operation`、`session.tool`: 購読中セッションのトランスクリプト、進行中の
  セッション操作、およびイベントストリーム更新。
- `sessions.changed`: セッションインデックスまたはメタデータが変更されました。
- `presence`: システムプレゼンスのスナップショット更新。
- `tick`: 定期的なキープアライブ/生存確認イベント。
- `health`: Gateway ヘルススナップショット更新。
- `heartbeat`: Heartbeat イベントストリーム更新。
- `cron`: Cron 実行/ジョブ変更イベント。
- `shutdown`: Gateway シャットダウン通知。
- `node.pair.requested` / `node.pair.resolved`: Node ペアリングライフサイクル。
- `node.invoke.request`: Node 呼び出しリクエストのブロードキャスト。
- `device.pair.requested` / `device.pair.resolved`: ペアリング済みデバイスのライフサイクル。
- `voicewake.changed`: ウェイクワードトリガー設定が変更されました。
- `exec.approval.requested` / `exec.approval.resolved`: exec 承認
  ライフサイクル。
- `plugin.approval.requested` / `plugin.approval.resolved`: plugin 承認
  ライフサイクル。

### Node ヘルパーメソッド

Node は、自動許可チェック用に現在のスキル実行ファイル一覧を取得するために
`skills.bins` を呼び出せます。

## 監査台帳 RPC

`audit.list` は、オペレータークライアントに、エージェント実行と
ツールアクションメタデータの安定した新しい順ビューを提供します。これには
`operator.read` が必要です。クエリは 30 日より古いレコードを除外し、共有 SQLite 台帳は 100,000 レコードに制限されます。
期限切れの行は、Gateway 起動時、1 時間ごとのメンテナンス時、および以後の
書き込み時に削除されます。

- パラメータ: 任意の完全一致 `agentId`、`sessionKey`、または `runId`; 任意の `kind`
  (`"agent_run"` または `"tool_action"`); 任意の `status` (`"started"`、
  `"succeeded"`、`"failed"`、`"cancelled"`、`"timed_out"`、`"blocked"`、または
  `"unknown"`); 任意の包含的な `after` / `before` Unix ミリ秒境界;
  `1` から `500` までの任意の `limit`; および前ページからの任意の文字列 `cursor`。
- 結果: `{ "events": AuditEvent[], "nextCursor"?: string }`。

各イベントには、安定したイベント ID、単調増加する台帳シーケンス、ソースイベント
シーケンス、タイムスタンプ、アクター、エージェント/セッション/実行の由来、アクション、ステータス、および該当する場合は
正規化されたエラーコードが含まれます。ツールイベントには、ツール呼び出し ID と
ツール名が含まれる場合があります。`redaction` フィールドは常に `"metadata_only"` です。台帳は
プロンプト、メッセージ、ツール引数、ツール結果、コマンド出力、または
生のエラーテキストを保存しません。

記録はデフォルトで有効で、
[`audit.enabled`](/ja-JP/gateway/configuration-reference#audit) によって制御されます。無効にした場合も、
`audit.list` は以前に書き込まれたレコードが期限切れになるまで提供し続けます。

テキストクエリと上限付き JSON エクスポートには [`openclaw audit`](/cli/audit) を使用します。

## タスク台帳 RPC

オペレータークライアントは、タスク台帳 RPC
(`packages/gateway-protocol/src/schema/tasks.ts`) を通じて Gateway バックグラウンドタスクレコードを確認およびキャンセルします。これらは
生のランタイム状態ではなく、サニタイズ済みタスク要約を返します。

- `tasks.list` には `operator.read` が必要です。
  - パラメータ: 任意の `status` (`"queued"`、`"running"`、`"completed"`、
    `"failed"`、`"cancelled"`、または `"timed_out"`) またはそれらのステータスの配列、
    任意の `agentId`、任意の `sessionKey`、`1` から
    `500` までの任意の `limit`、および任意の文字列 `cursor`。
  - 結果: `{ "tasks": TaskSummary[], "nextCursor"?: string }`。
- `tasks.get` には `operator.read` が必要です。
  - パラメータ: `{ "taskId": string }`。
  - 結果: `{ "task": TaskSummary }`。
  - 存在しないタスク ID は、Gateway の not-found エラー形状を返します。
- `tasks.cancel` には `operator.write` が必要です。
  - パラメータ: `{ "taskId": string, "reason"?: string }`。
  - 結果: `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`。
  - `found` は、台帳に一致するタスクがあったかどうかを報告します。`cancelled` は、
    ランタイムがキャンセルを受け入れたか、または記録したかを報告します。

`TaskSummary` には `id`、`status`、および任意のメタデータが含まれます: `kind`、
`runtime`、`title`、`agentId`、`sessionKey`、`childSessionKey`、`ownerKey`、
`runId`、`taskId`、`flowId`、`parentTaskId`、`sourceId`、タイムスタンプ、進捗、
終端要約、およびサニタイズ済みエラーテキスト。`agentId` はタスクを実行しているエージェントを
識別します。`sessionKey` と `ownerKey` は、リクエスターと制御
コンテキストを保持します。

## オペレーターヘルパーメソッド

- `commands.list` (`operator.read`) は、エージェントのランタイムコマンドインベントリを
  取得します。
  - `agentId` は任意です。省略するとデフォルトのエージェントワークスペースを読み取ります。
  - `scope` は、プライマリ `name` が対象とするサーフェスを制御します。`text` は
    先頭の `/` なしのプライマリテキストコマンドトークンを返します。`native` と
    デフォルトの `both` パスは、利用可能な場合、プロバイダー対応のネイティブ名を返します。
  - `textAliases` は `/model` や `/m` などの完全一致スラッシュエイリアスを運びます。
  - `nativeName` は、存在する場合にプロバイダー対応のネイティブコマンド名を運びます。
  - `provider` は任意で、ネイティブ命名とネイティブ plugin
    コマンドの可用性にのみ影響します。
  - `includeArgs=false` は、シリアライズ済み引数メタデータをレスポンスから省略します。
- `tools.catalog` (`operator.read`) は、エージェントのランタイムツールカタログを
  取得します。レスポンスには、グループ化されたツールと由来メタデータが含まれます:
  - `source`: `core` または `plugin`
  - `pluginId`: `source="plugin"` の場合の plugin 所有者
  - `optional`: plugin ツールが任意かどうか
- `tools.effective` (`operator.read`) は、セッションのランタイム有効ツール
  インベントリを取得します。
  - `sessionKey` は必須です。
  - Gateway は、呼び出し元が提供する認証や配信コンテキストを受け入れるのではなく、
    サーバー側のセッションから信頼済みランタイムコンテキストを導出します。
  - レスポンスは、アクティブなインベントリのセッションスコープのサーバー導出プロジェクションであり、
    core、plugin、channel、およびすでに検出済みの MCP
    サーバーツールを含みます。
  - `tools.effective` は MCP に対して読み取り専用です。ウォームセッション MCP
    カタログを最終ツールポリシー経由で投影することはありますが、MCP ランタイムの作成、
    トランスポート接続、または `tools/list` の発行は行いません。一致するウォームカタログが
    存在しない場合、レスポンスには `mcp-not-yet-connected`、
    `mcp-not-yet-listed`、または `mcp-stale-catalog` などの通知が含まれる場合があります。
  - 有効なツールエントリは `source="core"`、`source="plugin"`、
    `source="channel"`、または `source="mcp"` を使用します。
- `tools.invoke` (`operator.write`) は、`/tools/invoke` と同じ
  Gateway ポリシーパスを通じて、利用可能なツールを 1 つ呼び出します。
  - `name` は必須です。`args`、`sessionKey`、`agentId`、`confirm`、および
    `idempotencyKey` は任意です。
  - `sessionKey` と `agentId` の両方が存在する場合、解決されたセッションエージェントは
    `agentId` と一致する必要があります。
  - `cron`、`gateway`、`nodes` などの owner 専用 core ラッパーには、
    `tools.invoke` 自体は `operator.write` であっても、owner/admin ID (`operator.admin`) が必要です。
  - レスポンスは SDK 向けエンベロープで、`ok`、`toolName`、任意の
    `output`、および型付き `error` フィールドを含みます。承認またはポリシー拒否は、
    Gateway ツールポリシーパイプラインを迂回せず、ペイロード内の
    `ok:false` として返されます。
- `skills.status` (`operator.read`) は、エージェントに表示されるスキルインベントリを
  取得します。
  - `agentId` は任意です。省略するとデフォルトのエージェントワークスペースを読み取ります。
  - レスポンスには、適格性、不足している要件、設定チェック、
    および生のシークレット値を公開しないサニタイズ済みインストールオプションが含まれます。
- `skills.search` と `skills.detail` (`operator.read`) は ClawHub
  検出メタデータを返します。
- `skills.upload.begin`、`skills.upload.chunk`、および `skills.upload.commit`
  (`operator.admin`) は、インストール前にプライベートスキルアーカイブをステージングします。これは
  信頼済みクライアント向けの別個の admin アップロードパスであり、通常の ClawHub
  スキルインストールフローではありません。また、
  `skills.install.allowUploadedArchives` が有効でない限りデフォルトで無効です。
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    は、その slug と force 値に紐づいたアップロードを作成します。
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` は、正確なデコード済みオフセットに
    バイトを追加します。
  - `skills.upload.commit({ uploadId, sha256? })` は、最終サイズと
    SHA-256 を検証します。commit はアップロードを完了するだけで、スキルはインストールしません。
  - アップロードされたスキルアーカイブは、ルート `SKILL.md` を含む zip アーカイブです。アーカイブの
    内部ディレクトリ名がインストール先を選択することはありません。
- `skills.install` (`operator.admin`) には 3 つのモードがあります:
  - ClawHub モード: `{ source: "clawhub", slug, version?, force? }` は、
    スキルフォルダーをデフォルトのエージェントワークスペースの `skills/` ディレクトリにインストールします。
  - アップロードモード: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    は、コミット済みアップロードをデフォルトのエージェントワークスペースの
    `skills/<slug>` ディレクトリにインストールします。slug と force 値は、
    元の `skills.upload.begin` リクエストと一致する必要があります。
    `skills.install.allowUploadedArchives` が有効でない限り拒否されます。この設定は
    ClawHub インストールには影響しません。
  - Gateway インストーラーモード: `{ name, installId, timeoutMs? }` は、
    Gateway ホスト上で宣言済みの `metadata.openclaw.install` アクションを実行します。古いクライアントは
    まだ `dangerouslyForceUnsafeInstall` を送信する場合があります。このフィールドは非推奨で、
    プロトコル互換性のためにのみ受け入れられ、無視されます。オペレーター所有のインストール判断には
    `security.installPolicy` を使用してください。
- `skills.update` (`operator.admin`) には 2 つのモードがあります:
  - ClawHub モードは、デフォルトのエージェントワークスペース内の追跡対象 slug 1 つ、または追跡対象のすべての ClawHub インストールを更新します。
  - 設定モードは、`enabled`、
    `apiKey`、`env` などの `skills.entries.<skillKey>` 値にパッチを適用します。

### `models.list` ビュー

`models.list` は任意の `view` パラメータを受け入れます
(`src/agents/model-catalog-visibility.ts`):

- 省略または `"default"`: `agents.defaults.models` が設定されている場合、
  レスポンスは許可済みカタログになり、`provider/*` エントリについて
  動的に検出されたモデルを含みます。それ以外の場合、レスポンスは Gateway
  カタログ全体です。
- `"configured"`: ピッカーサイズの挙動です。`agents.defaults.models` が
  設定されている場合、`provider/*` エントリのプロバイダースコープ検出を含め、
  それが引き続き優先されます。許可リストがない場合、レスポンスは明示的な
  `models.providers.<provider>.models` エントリを使用し、設定済みモデル行が存在しない場合にのみ
  カタログ全体にフォールバックします。
- `"all"`: `agents.defaults.models` を迂回する Gateway カタログ全体。通常のモデルピッカーではなく、
  診断/検出 UI に使用します。

## Exec 承認

- exec リクエストに承認が必要な場合、Gateway は
  `exec.approval.requested` をブロードキャストします。
- オペレータークライアントは、`exec.approval.resolve` を呼び出して解決します (`operator.approvals` が必要)。
- `host=node` の場合、`exec.approval.request` には `systemRunPlan`
  (正規の `argv`/`cwd`/`rawCommand`/セッションメタデータ) を含める必要があります。
  `systemRunPlan` がないリクエストは拒否されます。
- 承認後、転送された `node.invoke system.run` 呼び出しは、その
  正規の `systemRunPlan` を、信頼できる command/cwd/session コンテキストとして再利用します。
- 呼び出し元が prepare と最終承認済み `system.run` 転送の間に
  `command`、`rawCommand`、`cwd`、`agentId`、または
  `sessionKey` を変更した場合、Gateway は変更されたペイロードを信頼せず、実行を拒否します。

## エージェント配信フォールバック

- `agent` リクエストには、外部配信を要求するために `deliver=true` を含められます。
- `bestEffortDeliver=false` (デフォルト) は厳格な挙動を維持します。解決不能または
  内部専用の配信先は `INVALID_REQUEST` を返します。
- `bestEffortDeliver=true` は、外部に配信可能なルートを解決できない場合
  (たとえば internal/webchat セッションやあいまいなマルチチャンネル設定) に、
  セッション専用実行へのフォールバックを許可します。
- 最終的な `agent` 結果には、配信が要求された場合に `result.deliveryStatus` が含まれる場合があり、
  [`openclaw agent --json --deliver`](/ja-JP/cli/agent#json-delivery-status) で文書化されているものと同じ
  `sent`、`suppressed`、`partial_failed`、および
  `failed` ステータスを使用します。

## バージョニング

- `PROTOCOL_VERSION`、`MIN_CLIENT_PROTOCOL_VERSION`、
  `MIN_NODE_PROTOCOL_VERSION`、`MIN_PROBE_PROTOCOL_VERSION` は
  `packages/gateway-protocol/src/version.ts` にあります。
- クライアントは `minProtocol` + `maxProtocol` を送信します。オペレーターおよび UI クライアントは
  その範囲に現在のプロトコルを含める必要があります。現在のクライアントとサーバーは
  プロトコル v4 で動作します。
- `role: "node"` と `client.mode: "node"` の両方を持つ認証済みクライアントは、
  N-1 ノードプロトコル（現在は v3）を使用できます。軽量な再起動プローブは
  同じ N-1 ウィンドウを使用します。デバイス認証、ペアリング、スコープ、コマンドポリシー、exec
  承認は、この互換性ウィンドウによって変更されません。Plugin 所有のノード
  機能とコマンドは、そのホスト面が N-1 コントラクトの一部ではないため、ノードが現在の
  プロトコルへアップグレードされるまで保留されます。
- スキーマとモデルは TypeBox 定義から生成されます:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### クライアント定数

リファレンスクライアント実装は `packages/gateway-client/src/` にあります
（OpenClaw は薄い `src/gateway/client.ts` ファサード経由でこれをラップします）。これらの
デフォルトはプロトコル v4 全体で安定しており、サードパーティクライアントに期待される
ベースラインです。

| 定数                                      | デフォルト                                            | ソース                                                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_NODE_PROTOCOL_VERSION`               | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_PROBE_PROTOCOL_VERSION`              | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| リクエストタイムアウト（RPC あたり）      | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`requestTimeoutMs`)                                                              |
| 事前認証 / connect-challenge タイムアウト | `15_000` ms                                           | `packages/gateway-client/src/timeouts.ts` (`OPENCLAW_HANDSHAKE_TIMEOUT_MS` env はペアのサーバー/クライアント予算を引き上げ可能) |
| 初期再接続バックオフ                      | `1_000` ms                                            | `packages/gateway-client/src/client.ts` (`backoffMs`)                                                                     |
| 最大再接続バックオフ                      | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`scheduleReconnect`)                                                             |
| デバイストークン close 後の高速リトライ上限 | `250` ms                                            | `packages/gateway-client/src/client.ts`                                                                                   |
| `terminate()` 前の強制停止猶予            | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                           |
| `stopAndWait()` デフォルトタイムアウト    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                |
| デフォルト tick 間隔（`hello-ok` 前）      | `30_000` ms                                           | `packages/gateway-client/src/client.ts`                                                                                   |
| tick タイムアウト close                   | 無音が `tickIntervalMs * 2` を超えた場合は code `4000` | `packages/gateway-client/src/client.ts`                                                                                   |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                                                         |

サーバーは有効な `policy.tickIntervalMs`、
`policy.maxPayload`、`policy.maxBufferedBytes` を `hello-ok` で通知します。クライアントは
ハンドシェイク前のデフォルトではなく、これらの値に従う必要があります。

## 認証

- 共有シークレットの Gateway 認証は、設定された
  `gateway.auth.mode` (`"none" | "token" | "password" | "trusted-proxy"`) に応じて、
  `connect.params.auth.token` または `connect.params.auth.password` を使用します。
- Tailscale Serve (`gateway.auth.allowTailscale: true`) や
  非ループバックの `gateway.auth.mode: "trusted-proxy"` などの ID 付きモードは、
  `connect.params.auth.*` ではなくリクエストヘッダーから connect
  認証チェックを満たします。
- プライベートイングレスの `gateway.auth.mode: "none"` は、共有シークレットの connect 認証を
  完全にスキップします。そのモードを公開/信頼されていないイングレスで公開しないでください。
- ペアリング後、Gateway は接続ロール + スコープに限定されたデバイストークンを発行し、
  `hello-ok.auth.deviceToken` で返します。クライアントは
  connect が成功したら必ずこれを永続化する必要があります。
- 保存済みのそのデバイストークンで再接続する場合は、そのトークンに対して保存済みの
  承認済みスコープセットも再利用する必要があります。これにより、すでに付与された
  読み取り/プローブ/ステータスアクセスが維持され、再接続が暗黙の管理者専用スコープへ
  黙って狭められることを避けられます。
- クライアント側の connect 認証組み立て（
  `packages/gateway-client/src/client.ts` の `selectConnectAuth`）:
  - `auth.password` は直交しており、設定されている場合は常に転送されます。
  - `auth.token` は優先順位に従って設定されます。まず明示的な共有トークン、
    次に明示的な `deviceToken`、最後に保存済みのデバイス別トークン（
    `deviceId` + `role` でキー付け）です。
  - `auth.bootstrapToken` は、上記のどれも
    `auth.token` を解決しなかった場合にのみ送信されます。共有トークンまたは解決済みのデバイストークンがあれば
    これを抑制します。
  - 1 回限りの `AUTH_TOKEN_MISMATCH` リトライで保存済みデバイストークンを自動昇格する処理は、
    信頼済みエンドポイントのみに制限されます。つまりループバック、
    または固定された `tlsFingerprint` を持つ `wss://` です。固定なしの公開 `wss://` は
    条件を満たしません。
- 組み込みのセットアップコードブートストラップは、主要ノードの
  `hello-ok.auth.deviceToken` に加えて、信頼済みモバイル引き渡し用の限定オペレータートークンを
  `hello-ok.auth.deviceTokens` で返します。オペレータートークンには
  ネイティブ Talk 設定読み取り用の `operator.talk.secrets` が含まれますが、
  ペアリング変更スコープと `operator.admin` は除外されます。
- 非ベースラインのセットアップコードブートストラップが承認待ちの間、
  `PAIRING_REQUIRED` 詳細には `recommendedNextStep: "wait_then_retry"`、
  `retryable: true`、`pauseReconnect: false` が含まれます。リクエストが承認されるか
  トークンが無効になるまで、同じブートストラップトークンで再接続を続けてください。
- `hello-ok.auth.deviceTokens` は、connect が `wss://` やループバック/local ペアリングなどの
  信頼済みトランスポート上でブートストラップ認証を使用した場合にのみ永続化してください。
- クライアントが明示的な `deviceToken` または明示的な `scopes` を提供した場合、
  その呼び出し元が要求したスコープセットが引き続き権威になります。キャッシュされたスコープは、
  クライアントが保存済みのデバイス別トークンを再利用している場合にのみ再利用されます。
- デバイストークンは `device.token.rotate` と
  `device.token.revoke` でローテーション/失効できます（`operator.pairing` が必要）。ノードまたはその他の
  非オペレーターロールのローテーションまたは失効には、`operator.admin` も必要です。
- `device.token.rotate` はローテーションメタデータを返します。同じデバイストークンで
  すでに認証済みの同一デバイス呼び出しにのみ、置換用 bearer トークンをエコーします。これにより、
  トークンのみのクライアントは再接続前に置換トークンを永続化できます。共有/管理者ローテーションは
  bearer トークンをエコーしません。
- トークンの発行、ローテーション、失効は、そのデバイスのペアリングエントリに記録された
  承認済みロールセットに限定されます。トークン変更は、ペアリング承認が付与していない
  デバイスロールを拡張したり対象にしたりできません。
- ペアリング済みデバイストークンセッションでは、呼び出し元が `operator.admin` も持たない限り、
  デバイス管理は自身のスコープに限定されます。非管理者の呼び出し元が管理できるのは、
  自分自身のデバイスエントリのオペレータートークンのみです。ノードおよびその他の非オペレータートークン管理は、
  呼び出し元自身のデバイスであっても管理者専用です。
- `device.token.rotate` と `device.token.revoke` は、対象の
  オペレータートークンスコープセットも、呼び出し元の現在のセッションスコープに照らしてチェックします。
  非管理者の呼び出し元は、自分がすでに保持している範囲より広いオペレータートークンを
  ローテーションまたは失効できません。
- 認証失敗には `error.details.code` と復旧ヒントが含まれます:
  - `error.details.canRetryWithDeviceToken`（boolean）
  - `error.details.recommendedNextStep`: `retry_with_device_token`、
    `update_auth_configuration`、`update_auth_credentials`、
    `wait_then_retry`、`review_auth_configuration` のいずれか
    （`packages/gateway-protocol/src/connect-error-details.ts`）。
- `AUTH_TOKEN_MISMATCH` に対するクライアント動作:
  - 信頼済みクライアントは、キャッシュされたデバイス別
    トークンで 1 回の限定リトライを試行できます。
  - そのリトライが失敗した場合、自動再接続ループを停止し、オペレーター向けの
    対処ガイダンスを表示します。
- `AUTH_SCOPE_MISMATCH` は、デバイストークンは認識されたが、要求されたロール/スコープを
  カバーしていないことを意味します。これを不正なトークンとして提示しないでください。オペレーターに
  再ペアリングするか、より狭い/広いスコープコントラクトを承認するよう促してください。

## デバイス ID とペアリング

- ノードは、キーペアフィンガープリントから派生した安定したデバイス ID（`device.id`）を
  含める必要があります。
- Gateway はデバイス + ロールごとにトークンを発行します。
- local 自動承認が有効でない限り、新しいデバイス ID にはペアリング承認が必要です。
- ペアリング自動承認は、直接の local loopback connect を中心にしています。
- OpenClaw には、信頼済み共有シークレットヘルパーフロー向けの狭いバックエンド/コンテナローカル
  自己接続パスもあります。
- 同一ホストの tailnet または LAN connect も、ペアリングでは引き続きリモートとして扱われ、
  承認が必要です。
- WS クライアントは通常、`connect` 時に `device` ID を含めます（オペレーター +
  ノード）。デバイスなしのオペレーター例外は、明示的な信頼パスのみです:
  - localhost 専用の安全でない
    HTTP 互換性のための `gateway.controlUi.allowInsecureAuth=true`。
  - 成功した `gateway.auth.mode: "trusted-proxy"` オペレーター Control UI 認証。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（緊急回避、重大な
    セキュリティ低下）。
  - 予約済み内部ヘルパーパス上の direct-loopback `gateway-client` バックエンド RPC。
- デバイス ID を省略するとスコープに影響します。デバイスなしの
  オペレーター接続が明示的な信頼パスを通じて許可された場合でも、OpenClaw は
  そのパスに名前付きのスコープ保持例外がない限り、自己宣言スコープを空セットにクリアします。
  その後、スコープで保護されたメソッドは `missing scope` で失敗します。
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` は、Control UI の
  緊急回避スコープ保持パスです。任意のカスタムバックエンドまたは CLI 形状の WebSocket クライアントに
  スコープを付与するものではありません。
- 予約済みの direct-loopback `gateway-client` バックエンドヘルパーパスは、
  内部 local コントロールプレーン RPC にのみスコープを保持します。カスタムバックエンド ID は
  この例外を受けません。
- すべての接続は、サーバー提供の `connect.challenge` nonce に署名する必要があります。

### デバイス認証移行診断

チャレンジ前の署名動作をまだ使用しているレガシークライアントの場合、`connect` は
安定した `error.details.reason` とともに、`error.details.code` の下で
`DEVICE_AUTH_*` 詳細コードを返します。

一般的な移行失敗:

| メッセージ                  | details.code                     | details.reason           | 意味                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | クライアントが `device.nonce` を省略した（または空で送信した）。 |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | クライアントが古い、または誤った nonce で署名した。 |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 署名ペイロードが v2 ペイロードと一致しない。       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 署名済みタイムスタンプが許容スキューの範囲外。     |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` が公開鍵フィンガープリントと一致しない。 |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開鍵の形式または正規化に失敗した。               |

移行ターゲット:

- 常に `connect.challenge` を待つ。
- サーバー nonce を含む v2 ペイロードに署名する。
- 同じ nonce を `connect.params.device.nonce` で送信する。
- 推奨される署名ペイロードは `v3`
  （`packages/gateway-client/src/device-auth.ts` の `buildDeviceAuthPayloadV3`）で、
  device/client/role/scopes/token/nonce フィールドに加えて
  `platform` と `deviceFamily` をバインドする。
- レガシー `v2` 署名は互換性のため引き続き受け入れられるが、ペアリング済みデバイスの
  メタデータピン留めは再接続時のコマンドポリシーを引き続き制御する。

## TLS とピン留め

- WS 接続では TLS がサポートされる（`gateway.tls` 設定）。
- クライアントは任意で、`gateway.remote.tlsFingerprint` または CLI `--tls-fingerprint` によって Gateway 証明書フィンガープリントをピン留めできる。

## 範囲

このプロトコルは Gateway API 全体を公開する: status、channels、models、chat、
agent、sessions、nodes、approvals など。正確なサーフェスは
`packages/gateway-protocol/src/schema.ts` から再エクスポートされる TypeBox スキーマによって定義される。

## 関連

- [ブリッジプロトコル](/ja-JP/gateway/bridge-protocol)
- [Gateway ランブック](/ja-JP/gateway)
