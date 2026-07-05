---
read_when:
    - Gateway WS クライアントの実装または更新
    - プロトコル不一致または接続失敗のデバッグ
    - プロトコルスキーマ/モデルの再生成
summary: 'Gateway WebSocket プロトコル: ハンドシェイク、フレーム、バージョニング'
title: Gateway プロトコル
x-i18n:
    generated_at: "2026-07-05T11:26:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0d9df5dd7d7c09d5293d6cebf19ddec23976dd0f6af062d81b93e4947cc3a61b
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS プロトコルは、OpenClaw の単一のコントロールプレーン兼ノードトランスポートです。すべてのクライアント（CLI、Web UI、macOS アプリ、iOS/Android ノード、ヘッドレスノード）は WebSocket 経由で接続し、ハンドシェイク時に **role** と **scope** を宣言します。

## トランスポートとフレーミング

- WebSocket、テキストフレーム、JSON ペイロード。
- 最初のフレームは **必ず** `connect` リクエストである必要があります。
- 接続前フレームは 64 KiB（`MAX_PREAUTH_PAYLOAD_BYTES`）に制限されます。ハンドシェイク後は、`hello-ok.policy.maxPayload` と `hello-ok.policy.maxBufferedBytes` に従います。診断が有効な場合、過大な受信フレームや遅い送信バッファは、gateway がフレームを閉じるか破棄する前に `payload.large` イベントを発行します。これらのイベントには `surface`、バイトサイズ、上限、安全な理由コードが含まれますが、メッセージ本文、添付内容、生フレームバイト、トークン、Cookie、シークレットは含まれません。

フレーム形状:

- リクエスト: `{type:"req", id, method, params}`
- レスポンス: `{type:"res", id, ok, payload|error}`
- イベント: `{type:"event", event, payload, seq?, stateVersion?}`

副作用を持つメソッドには冪等性キーが必要です（スキーマを参照）。

## ハンドシェイク

Gateway は接続前チャレンジを送信します。

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

クライアントは `connect` で応答します。

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

Gateway は `hello-ok` で応答します。

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

`server`、`features`、`snapshot`、`policy`、`auth` はすべて `HelloOkSchema`（`packages/gateway-protocol/src/schema/frames.ts`）で必須です。`auth` は、デバイストークンが発行されない場合でも、ネゴシエートされた role/scopes を報告します（上記の形状）。`pluginSurfaceUrls` は任意で、Plugin サーフェス名（例: `canvas`）をスコープ付きホスト URL にマップします。有効期限が切れる可能性があるため、ノードは新しいエントリを取得するために `{ "surface": "canvas" }` で `node.pluginSurface.refresh` を呼び出します。非推奨の `canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh` パスはサポートされません。Plugin サーフェスを使用してください。

gateway がまだ起動サイドカーの完了中の場合、`connect` は `details.reason: "startup-sidecars"` と `retryAfterMs` を伴う再試行可能な `UNAVAILABLE` エラーを返すことがあります。これを終端的なハンドシェイク失敗として扱うのではなく、接続予算内で再試行してください。

デバイストークンが発行されると、`hello-ok.auth` に追加されます。

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

組み込みの QR/セットアップコードブートストラップは、モバイル引き継ぎパスです。成功したベースラインのセットアップコード接続は、プライマリノードトークンに加えて、境界付けされたオペレータートークンを 1 つ返します。

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

このオペレーター引き継ぎは意図的に境界付けされています。モバイルオペレーターループとネイティブセットアップを開始するには十分で、Talk 設定読み取り用の `operator.talk.secrets` も含まれますが、ペアリング変更スコープや `operator.admin` は含まれません。より広いペアリング/管理アクセスには、別途承認済みのペアリングまたはトークンフローが必要です。`hello-ok.auth.deviceTokens` は、ブートストラップ認証が信頼済みトランスポート（`wss://` またはループバック/local pairing）で実行された場合にのみ永続化してください。

信頼済みの同一プロセスバックエンドクライアント（`client.id: "gateway-client"`、`client.mode: "backend"`）は、共有 gateway トークン/パスワードで認証する直接ループバック接続では `device` を省略できます。このパスは内部コントロールプレーン RPC（例: サブエージェントセッション更新）のために予約されており、古い CLI/デバイスペアリングベースラインがローカルバックエンド作業を妨げることを避けます。リモート、ブラウザーオリジン、ノード、明示的なデバイストークン/デバイスアイデンティティクライアントは、引き続き通常のペアリングおよびスコープアップグレードチェックを通ります。

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

ノードは接続時に能力クレームを宣言します。

- `caps`: `camera`、`canvas`、`screen`、`location`、`voice`、`talk` などの高レベルカテゴリ。
- `commands`: invoke 用のコマンド許可リスト。
- `permissions`: 詳細な切り替え（例: `screen.record`、`camera.capture`）。

gateway はこれらをクレームとして扱い、サーバー側の許可リストを適用します。

## ロールとスコープ

完全なオペレータースコープモデル、承認時チェック、共有シークレットのセマンティクスについては、[オペレータースコープ](/ja-JP/gateway/operator-scopes)を参照してください。

ロール:

- `operator`: コントロールプレーンクライアント（CLI/UI/自動化）。
- `node`: 能力ホスト（camera/screen/canvas/system.run）。

オペレータースコープ（`src/gateway/operator-scopes.ts`）、完全な閉集合:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` を指定した `talk.config` には `operator.talk.secrets`（または `operator.admin`）が必要です。シークレットが含まれる場合、有効な Talk プロバイダー認証情報を `talk.resolved.config.apiKey` から読み取ります。`talk.providers.<id>.apiKey` はソース形状のままであり、SecretRef オブジェクトまたは伏せ字文字列である可能性があります。

Plugin 登録済みの gateway RPC メソッドは独自のオペレータースコープを要求できますが、これらの予約済みコアプレフィックスは常に `operator.admin`（`src/shared/gateway-method-policy.ts`）に解決されます: `config.*`、`exec.approvals.*`、`wizard.*`、`update.*`。

メソッドスコープは最初のゲートにすぎません。`chat.send` 経由で到達する一部のスラッシュコマンドには、より厳格なコマンドレベルチェックが適用されます。永続的な `/config set` と `/config unset` の書き込みには、すでに低いオペレータースコープを持つ gateway クライアントであっても `operator.admin` が必要です。

`node.pair.approve` には、基本メソッドスコープ（`operator.pairing`）に加えて、保留中リクエストで宣言された `commands`（`src/infra/node-pairing-authz.ts`）に基づく追加の承認時スコープチェックがあります。

| 宣言されたコマンド                                             | 必要なスコープ                        |
| -------------------------------------------------------------- | ------------------------------------- |
| なし                                                           | `operator.pairing`                    |
| 非 exec コマンド                                               | `operator.pairing` + `operator.write` |
| `system.run`、`system.run.prepare`、または `system.which` を含む | `operator.pairing` + `operator.admin` |

## プレゼンス

- `system-presence` はデバイスアイデンティティをキーにしたエントリを返し、`deviceId`、`roles`、`scopes` を含みます。これにより、UI は同じデバイスが operator と node の両方として接続している場合でも、デバイスごとに 1 行を表示できます。
- `node.list` には任意の `lastSeenAtMs` と `lastSeenReason` が含まれます。接続中のノードは理由 `connect` とともに現在の接続時刻を報告します。ペアリング済みノードは、信頼済みノードイベントを通じて永続的なバックグラウンドプレゼンスも報告できます。

### ノードバックグラウンド alive イベント

ノードは `event: "node.presence.alive"` を指定して `node.event` を呼び出し、ペアリング済みノードがバックグラウンド wake 中に alive だったことを、接続中としてマークせずに記録します。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` は閉じた enum です: `background`、`silent_push`、`bg_app_refresh`、`significant_location`、`manual`、`connect`。不明な値は `background`（`src/shared/node-presence.ts`）に正規化されます。このイベントは認証済みノードデバイスセッションでのみ永続化されます。デバイスなしまたは未ペアリングのセッションは `handled: false` を返します。

成功した gateway は構造化された結果を返します。

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

古い gateway は `node.event` に対して `{ "ok": true }` のみを返す場合があります。これは永続的なプレゼンス永続化ではなく、確認済み RPC として扱ってください。

## ブロードキャストイベントのスコープ設定

サーバーからプッシュされるブロードキャストイベントはスコープでゲートされ、ペアリングスコープのみまたはノードのみのセッションがセッション内容を受動的に受信しないようになっています（`src/gateway/server-broadcast.ts`）。

- Chat、エージェント、ツール結果フレーム（ストリーミングされる `agent` イベント、ツール結果イベント）には少なくとも `operator.read` が必要です。これを持たないセッションは、これらのフレームを完全にスキップします。
- Plugin 定義の `plugin.*` ブロードキャストは、デフォルトで `operator.write` または `operator.admin` にゲートされます。`plugin.approval.requested` / `plugin.approval.resolved` などの明示的なエントリは、代わりに `operator.approvals` を使用します。
- ステータス/トランスポートイベント（`heartbeat`、`presence`、`tick`、接続/切断ライフサイクル）は、すべての認証済みセッションがトランスポート健全性を観測できるように無制限のままです。
- 不明なブロードキャストイベントファミリーは、登録済みハンドラーが明示的に緩和しない限り、デフォルトでスコープゲートされます（fail-closed）。

各クライアント接続は独自のクライアント別シーケンス番号を保持するため、異なるクライアントがイベントストリームの異なるスコープフィルター済みサブセットを見る場合でも、ブロードキャストはそのソケット上で単調順序を維持します。

## RPC メソッドファミリー

`hello-ok.features.methods` は、`src/gateway/server-methods-list.ts` とロード済み Plugin/チャネルメソッドエクスポートから構築される保守的なディスカバリーリストです。すべてのメソッドを生成してダンプしたものではなく、たとえば `push.test`、`web.login.start`、`web.login.wait`、`sessions.usage` のような一部のメソッドは、実在し呼び出し可能なメソッドであっても意図的にディスカバリーから除外されています。これは `src/gateway/server-methods/*.ts` の完全な列挙ではなく、機能ディスカバリーとして扱ってください。

  <AccordionGroup>
  <Accordion title="システムとアイデンティティ">
    - `health` は、キャッシュ済みまたは新しくプローブされた gateway のヘルススナップショットを返します。
    - `diagnostics.stability` は、直近の境界付き診断安定性レコーダーを返します: イベント名、カウント、バイトサイズ、メモリ読み取り値、キュー/セッション状態、チャネル/Plugin 名、セッション ID。チャット本文、webhook 本文、ツール出力、生のリクエスト/レスポンス本文、トークン、Cookie、シークレットは含まれません。`operator.read` が必要です。
    - `status` は `/status` 形式の gateway サマリーを返します。機密フィールドは admin スコープの operator クライアントのみに返されます。
    - `gateway.identity.get` は、relay とペアリングフローで使われる gateway デバイスアイデンティティを返します。
    - `system-presence` は、接続済み operator/node デバイスの現在のプレゼンススナップショットを返します。
    - `system-event` はシステムイベントを追加し、プレゼンスコンテキストを更新/ブロードキャストできます。
    - `last-heartbeat` は、永続化された最新の Heartbeat イベントを返します。
    - `set-heartbeats` は、gateway での Heartbeat 処理を切り替えます。

  </Accordion>

  <Accordion title="モデルと使用量">
    - `models.list` は、ランタイムで許可されたモデルカタログを返します。下記の「`models.list` ビュー」を参照してください。
    - `usage.status` は、プロバイダーの使用量ウィンドウ/残りクォータのサマリーを返します。
    - `usage.cost` は、日付範囲の集計コスト使用量サマリーを返します。1 つのエージェントには `agentId` を渡すか、構成済みエージェントを集計するには `agentScope: "all"` を渡します。
    - `doctor.memory.status` は、アクティブなデフォルトエージェントワークスペースの vector-memory / キャッシュ済み embedding の準備状態を返します。明示的なライブ embedding プロバイダー ping の場合にのみ `{ "probe": true }` または `{ "deep": true }` を渡します。Dreaming ストア統計を 1 つのエージェントワークスペースにスコープするには `{ "agentId": "agent-id" }` を渡します。省略すると、構成済み Dreaming ワークスペースを集計します。
    - `doctor.memory.dreamDiary`、`doctor.memory.backfillDreamDiary`、`doctor.memory.resetDreamDiary`、`doctor.memory.resetGroundedShortTerm`、`doctor.memory.repairDreamingArtifacts`、`doctor.memory.dedupeDreamDiary` は、任意の `{ "agentId": "agent-id" }` を受け付けます。省略すると、構成済みのデフォルトエージェントワークスペースに対して動作します。
    - `doctor.memory.remHarness` は、リモート control-plane クライアント向けに、境界付きの読み取り専用 REM ハーネスプレビューを返します。ワークスペースパス、メモリスニペット、レンダリング済み grounded markdown、deep promotion 候補が含まれます。`operator.read` が必要です。
    - `sessions.usage` は、セッションごとの使用量サマリーを返します。1 つのエージェントには `agentId` を渡すか、構成済みエージェントをまとめて一覧表示するには `agentScope: "all"` を渡します。
    - `sessions.usage.timeseries` は、1 つのセッションの時系列使用量を返します。
    - `sessions.usage.logs` は、1 つのセッションの使用量ログエントリを返します。

  </Accordion>

  <Accordion title="チャネルとログインヘルパー">
    - `channels.status` は、組み込み + バンドル済みチャネル/Plugin のステータスサマリーを返します。
    - `channels.logout` は、チャネルが対応している場合に特定のチャネル/アカウントからログアウトします。
    - `web.login.start` は、現在の QR 対応 web チャネルプロバイダーの QR/web ログインフローを開始します。
    - `web.login.wait` は、そのフローの完了を待ち、成功時にチャネルを開始します。
    - `push.test` は、登録済み iOS node にテスト APNs push を送信します。
    - `voicewake.get` は、保存済み wake-word トリガーを返します。
    - `voicewake.set` は、wake-word トリガーを更新し、変更をブロードキャストします。

  </Accordion>

  <Accordion title="メッセージングとログ">
    - `send` は、chat runner 外でチャネル/アカウント/スレッドを対象に送信するための直接 outbound-delivery RPC です。
    - `logs.tail` は、カーソル/制限と最大バイト制御付きで、構成済み gateway ファイルログの tail を返します。

  </Accordion>

  <Accordion title="operator ターミナル">
    - `terminal.open` は、明示的な `agentId` またはデフォルトエージェントの host PTY を開始し、解決済みエージェント、作業ディレクトリ、シェル、閉じ込め状態を返します。
    - `terminal.input`、`terminal.resize`、`terminal.close` は、呼び出し元接続が所有するセッションに対してのみ動作します。
    - `terminal.data` と `terminal.exit` イベントは、セッションを所有する接続にのみストリームされます。
    - 接続が切断されたセッションは kill されず、detached になります。直近の出力が境界付きサーバー側バッファに蓄積される間、`gateway.terminal.detachedSessionTimeoutSeconds`（デフォルト 300。`0` で切断時 kill に戻る）の間は再接続可能なままです。
    - `terminal.list` は attach 可能なセッションを返します。`terminal.attach` は live または detached セッションを呼び出し元接続に再バインドし、replay バッファを返します（tmux 形式の take-over — 以前の live owner は reason `detached` の `terminal.exit` を受け取ります）。`terminal.text` は attach せずにバッファをプレーンテキストとして読み取ります。
    - すべてのターミナルメソッドには `operator.admin` が必要です。`gateway.terminal.enabled` は明示的に true である必要があります。完全にサンドボックス化されたエージェントは拒否され、エージェントポリシーの変更により、既存および処理中の PTY は detached のものも含めて閉じられます。

  </Accordion>

  <Accordion title="Talk と TTS">
    - `talk.catalog` は、音声、ストリーミング文字起こし、リアルタイム音声用の読み取り専用 Talk プロバイダーカタログを返します。正規プロバイダー ID、レジストリエイリアス、ラベル、構成済み状態、任意のグループレベル `ready` 結果、公開されたモデル/音声 ID、正規モード、トランスポート、brain strategies、リアルタイム音声/ケイパビリティフラグが含まれますが、プロバイダーシークレットの返却やグローバル構成の変更は行いません。現在の gateway は、ランタイムプロバイダー選択を適用した後に `ready` を設定します。古い gateway で存在しない場合は未検証として扱ってください。
    - `talk.config` は、有効な Talk 構成ペイロードを返します。`includeSecrets` には `operator.talk.secrets`（または `operator.admin`）が必要です。
    - `talk.session.create` は、`realtime/gateway-relay`、`transcription/gateway-relay`、または `stt-tts/managed-room` の gateway 所有 Talk セッションを作成します。`stt-tts/managed-room` では、`sessionKey` を渡す `operator.write` 呼び出し元は、スコープ付き session-key 可視性のために `spawnedBy` も渡す必要があります。スコープなしの `sessionKey` 作成と `brain: "direct-tools"` には `operator.admin` が必要です。
    - `talk.session.join` は managed-room セッショントークンを検証し、必要に応じて `session.ready` または `session.replaced` を発行し、room/session メタデータと直近の Talk イベントを返しますが、平文トークンまたはそのハッシュは返しません。
    - `talk.session.appendAudio` は、gateway 所有の realtime relay と transcription セッションに base64 PCM 入力音声を追加します。
    - `talk.session.startTurn`、`talk.session.endTurn`、`talk.session.cancelTurn` は、状態がクリアされる前に stale-turn を拒否しつつ、managed-room turn ライフサイクルを駆動します。
    - `talk.session.cancelOutput` は、主に gateway relay セッションでの VAD-gated barge-in のために、assistant 音声出力を停止します。
    - `talk.session.submitToolResult` は、gateway 所有の realtime relay セッションが発行したプロバイダーツール呼び出しを完了します。最終結果が後続する中間ツール出力には `options: { willContinue: true }` を渡し、別の realtime レスポンスを開始せずにツール結果でプロバイダー呼び出しを満たす場合は `options: { suppressResponse: true }` を渡します。
    - `talk.session.steer` は、gateway 所有のエージェント支援 Talk セッションに active-run 音声制御を送ります: `{ sessionId, text, mode? }`。ここで `mode` は `status`、`steer`、`cancel`、または `followup` です。省略された mode は発話テキストから分類されます。
    - `talk.session.close` は、gateway 所有の relay、transcription、または managed-room セッションを閉じ、終端 Talk イベントを発行します。
    - `talk.mode` は、WebChat/Control UI クライアント向けに現在の Talk モード状態を設定/ブロードキャストします。
    - `talk.client.create` は、gateway が構成、認証情報、instructions、ツールポリシーを所有したまま、`webrtc` または `provider-websocket` を使ってクライアント所有の realtime プロバイダーセッションを作成します。
    - `talk.client.toolCall` により、クライアント所有の realtime トランスポートはプロバイダーツール呼び出しを gateway ポリシーへ転送できます。最初にサポートされるツールは `openclaw_agent_consult` です。クライアントは run id を取得し、プロバイダー固有のツール結果を送信する前に通常の chat ライフサイクルイベントを待ちます。
    - `talk.client.steer` は、クライアント所有の realtime トランスポート向けに active-run 音声制御を送ります。gateway は `sessionKey` からアクティブな埋め込み run を解決し、steering を黙って破棄する代わりに、構造化された accepted/rejected 結果を返します。
    - `talk.event` は、realtime、transcription、STT/TTS、managed-room、telephony、meeting アダプター用の単一の Talk イベントチャネルです。
    - `talk.speak` は、アクティブな Talk 音声プロバイダーを通じて音声を合成します。
    - `tts.status` は、TTS の有効状態、アクティブプロバイダー、フォールバックプロバイダー、プロバイダー構成状態を返します。
    - `tts.providers` は、表示可能な TTS プロバイダーインベントリを返します。
    - `tts.enable` と `tts.disable` は、TTS prefs 状態を切り替えます。
    - `tts.setProvider` は、優先 TTS プロバイダーを更新します。
    - `tts.convert` は、単発の text-to-speech 変換を実行します。

  </Accordion>

  <Accordion title="シークレット、構成、更新、ウィザード">
    - `secrets.reload` は、アクティブな SecretRefs を再解決し、完全に成功した場合にのみランタイムシークレット状態を入れ替えます。
    - `secrets.resolve` は、特定のコマンド/ターゲットセットに対する command-target シークレット割り当てを解決します。
    - `config.get` は、現在の構成スナップショットとハッシュを返します。
    - `config.set` は、検証済みの構成ペイロードを書き込みます。
    - `config.patch` は、部分的な構成更新をマージします。破壊的な配列置換には、影響を受けるパスを `replacePaths` に指定する必要があります。配列エントリ配下のネストされた配列は、`agents.list[].skills` のような `[]` パスを使います。
    - `config.apply` は、完全な構成ペイロードを検証して置き換えます。
    - `config.schema` は、Control UI と CLI ツールで使われるライブ構成スキーマペイロードを返します: schema、`uiHints`、version、生成メタデータ、読み込み可能な場合は Plugin + チャネルスキーマメタデータ。UI と同じ labels/help text 由来の `title` / `description` メタデータが含まれます。これには、一致するフィールドドキュメントが存在する場合の、ネストされたオブジェクト、ワイルドカード、配列アイテム、`anyOf` / `oneOf` / `allOf` 構成ブランチも含まれます。
    - `config.schema.lookup` は、1 つの構成パスに対するパススコープの lookup ペイロードを返します: 正規化済みパス、浅いスキーマノード、一致した hint + `hintPath`、任意の `reloadKind`、UI/CLI drill-down 用の直接の子サマリー。`reloadKind` は `restart`、`hot`、`none`（`src/config/schema.ts`）のいずれかで、要求されたパスに対する gateway 構成 reload planner を反映します。Lookup スキーマノードは、ユーザー向け docs と共通の検証フィールド（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、数値/文字列/配列/オブジェクトの境界、`additionalProperties`、`deprecated`、`readOnly`、`writeOnly`）を保持します。子サマリーは、`key`、正規化済み `path`、`type`、`required`、`hasChildren`、任意の `reloadKind`、さらに一致した `hint` / `hintPath` を公開します。
    - `update.run` は gateway 更新フローを実行し、更新が成功した場合にのみ再起動をスケジュールします。セッションを持つ呼び出し元は `continuationMessage` を含めることができ、startup は restart continuation queue を通じて 1 回の後続エージェント turn を再開します。control plane からの package-manager 更新と supervised git-checkout 更新は、稼働中の gateway 内で package tree を置き換えたり checkout/build output を変更したりする代わりに、detached managed-service handoff を使います。開始済み handoff は `ok: true` と `result.reason: "managed-service-handoff-started"`、`handoff.status: "started"` を返します。利用不能または失敗した handoff は `ok: false` と `managed-service-handoff-unavailable` または `managed-service-handoff-failed` を返し、手動 shell 更新が必要な場合は `handoff.command` も返します。利用不能とは、OpenClaw に安全な supervisor 境界または durable service identity がないことを意味します。たとえば systemd の `OPENCLAW_SYSTEMD_UNIT` です。開始済み handoff 中、restart sentinel は一時的に `stats.reason: "restart-health-pending"` を報告することがあります。CLI が再起動後の gateway を検証し、最終的な `ok` sentinel を書き込むまで continuation は遅延されます。
    - `update.status` は、利用可能な場合は再起動後の実行中 version を含め、最新の update restart sentinel を更新して返します。
    - `wizard.start`、`wizard.next`、`wizard.status`、`wizard.cancel` は、WS RPC 経由でオンボーディングウィザードを公開します。

  </Accordion>

  <Accordion title="エージェントとワークスペースの補助機能">
    - `agents.list` は、実効モデルとランタイムメタデータを含む、設定済みエージェントエントリを返します。
    - `agents.create`、`agents.update`、`agents.delete` は、エージェントレコードとワークスペース接続を管理します。
    - `agents.files.list`、`agents.files.get`、`agents.files.set` は、エージェントに公開されるブートストラップワークスペースファイルを管理します。
    - `tasks.list`、`tasks.get`、`tasks.cancel` は、Gateway タスク台帳を SDK クライアントとオペレータークライアントに公開します。下記の [タスク台帳 RPC](#task-ledger-rpcs) を参照してください。
    - `artifacts.list`、`artifacts.get`、`artifacts.download` は、明示的な `sessionKey`、`runId`、または `taskId` スコープに対して、トランスクリプト由来のアーティファクト要約とダウンロードを公開します。実行クエリとタスククエリは、所有セッションをサーバー側で解決し、一致する由来を持つトランスクリプトメディアのみを返します。安全でない URL ソースやローカル URL ソースは、サーバー側で取得する代わりに未対応のダウンロードを返します。
    - `environments.list` と `environments.status` は、SDK クライアント向けに読み取り専用の Gateway ローカルおよびノード環境検出を公開します。
    - `agent.identity.get` は、エージェントまたはセッションの実効アシスタント ID を返します。
    - `agent.wait` は、実行の完了を待機し、利用可能な場合は終端スナップショットを返します。

  </Accordion>

  <Accordion title="セッション制御">
    - `sessions.list` は、エージェントランタイムバックエンドが設定されている場合、行ごとの `agentRuntime` メタデータを含む現在のセッションインデックスを返します。
    - `sessions.subscribe` と `sessions.unsubscribe` は、現在の WS クライアントのセッション変更イベント購読を切り替えます。
    - `sessions.messages.subscribe` と `sessions.messages.unsubscribe` は、1 つのセッションに対するトランスクリプト/メッセージイベント購読を切り替えます。
    - `sessions.preview` は、特定のセッションキーに対する制限付きトランスクリプトプレビューを返します。
    - `sessions.describe` は、完全一致するセッションキーに対して 1 つの Gateway セッション行を返します。
    - `sessions.resolve` は、セッションターゲットを解決または正規化します。
    - `sessions.create` は、新しいセッションエントリを作成します。
    - `sessions.send` は、既存のセッションにメッセージを送信します。
    - `sessions.steer` は、アクティブなセッション向けの割り込みおよび操舵バリアントです。
    - `sessions.abort` は、セッションのアクティブな作業を中止します。`key` と任意の `runId` を渡すか、Gateway がセッションに解決できるアクティブな実行については `runId` のみを渡します。
    - `sessions.patch` は、セッションメタデータ/オーバーライドを更新し、解決された正規モデルと実効 `agentRuntime` を報告します。
    - `sessions.reset`、`sessions.delete`、`sessions.compact` は、セッションメンテナンスを実行します。
    - `sessions.get` は、保存されている完全なセッション行を返します。
    - チャット実行は引き続き `chat.history`、`chat.send`、`chat.abort`、`chat.inject` を使用します。`chat.history` は UI クライアント向けに表示正規化されます。インラインディレクティブタグは表示テキストから取り除かれ、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロック）と漏出した ASCII/全角モデル制御トークンは取り除かれ、純粋な無音トークンのアシスタント行（正確な `NO_REPLY` / `no_reply`）は省略され、サイズが大きすぎる行はプレースホルダーに置き換えられることがあります。
    - `chat.message.get` は、単一の可視トランスクリプトエントリに対する追加型の制限付き全文メッセージリーダーです。`sessionKey`、セッション選択がエージェントスコープの場合は任意の `agentId`、および以前に `chat.history` を通じて公開されたトランスクリプト `messageId` を渡します。保存済みエントリがまだ利用可能で、サイズ超過でない場合、Gateway は軽量履歴の切り詰め上限なしで同じ表示正規化済み投影を返します。
    - `chat.send` は、1 ターンの `fastMode: "auto"` を受け付け、自動カットオフ前に開始されたモデル呼び出しには高速モードを使用し、その後に開始されるリトライ、フォールバック、ツール結果、または継続呼び出しには高速モードを使用しません。カットオフの既定値は 60 秒（`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`）で、`agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` によりモデルごとに設定できます。`chat.send` の呼び出し元は、1 ターンの `fastAutoOnSeconds` を渡して、そのリクエストのカットオフを上書きできます。

  </Accordion>

  <Accordion title="デバイスペアリングとデバイストークン">
    - `device.pair.list` は、保留中および承認済みのペアリング済みデバイスを返します。
    - `device.pair.setupCode` は、モバイルセットアップコードと、既定では PNG QR データ URL を作成します。`operator.admin` が必要で、意図的に公開される検出情報からは省略されています。結果には `setupCode`、任意の `qrDataUrl`、`gatewayUrl`、非シークレットの `auth` ラベル、`urlSource` が含まれます。
    - `device.pair.approve`、`device.pair.reject`、`device.pair.remove` は、デバイスペアリングレコードを管理します。
    - `device.token.rotate` は、承認済みロールと呼び出し元スコープの範囲内で、ペアリング済みデバイストークンをローテーションします。
    - `device.token.revoke` は、承認済みロールと呼び出し元スコープの範囲内で、ペアリング済みデバイストークンを取り消します。

    セットアップコードには、短時間だけ有効なブートストラップ認証情報が埋め込まれます。クライアントは、ペアリングフローを超えてこれをログに記録したり永続化したりしてはなりません。

  </Accordion>

  <Accordion title="ノードペアリング、invoke、保留中の作業">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove`、`node.pair.verify` は、ノードペアリングとブートストラップ検証を扱います。
    - `node.list` と `node.describe` は、既知/接続済みノードの状態を返します。
    - `node.rename` は、ペアリング済みノードラベルを更新します。
    - `node.invoke` は、接続済みノードにコマンドを転送します。
    - `node.invoke.result` は、invoke リクエストの結果を返します。
    - `node.event` は、ノード由来のイベントを Gateway に戻します。
    - `node.pending.pull` と `node.pending.ack` は、接続済みノードキュー API です。
    - `node.pending.enqueue` と `node.pending.drain` は、オフライン/切断済みノードの永続的な保留中作業を管理します。

  </Accordion>

  <Accordion title="承認ファミリー">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list`、`exec.approval.resolve` は、単発の exec 承認リクエストと保留中承認の検索/再生を扱います。
    - `exec.approval.waitDecision` は、1 つの保留中 exec 承認を待機し、最終決定（またはタイムアウト時は `null`）を返します。
    - `exec.approvals.get` と `exec.approvals.set` は、Gateway exec 承認ポリシースナップショットを管理します。
    - `exec.approvals.node.get` と `exec.approvals.node.set` は、ノードリレーコマンドを介してノードローカルの exec 承認ポリシーを管理します。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision`、`plugin.approval.resolve` は、Plugin 定義の承認フローを扱います。

  </Accordion>

  <Accordion title="自動化、Skills、ツール">
    - 自動化: `wake` は即時または次回 Heartbeat の wake テキスト挿入をスケジュールします。`cron.get`、`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` は、スケジュール済み作業を管理します。
    - `cron.run` は、手動実行向けのエンキュー形式 RPC のままです。完了セマンティクスが必要なクライアントは、返された `runId` を読み取り、`cron.runs` をポーリングする必要があります。
    - `cron.runs` は、任意の空でない `runId` フィルターを受け付けるため、クライアントは同じジョブの他の履歴エントリと競合せずに、キューに入った 1 つの手動実行を追跡できます。
    - Skills とツール: `commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。下記の [オペレーター補助メソッド](#operator-helper-methods) を参照してください。

  </Accordion>
</AccordionGroup>

### 共通イベントファミリー

- `chat`: `chat.inject` などの UI チャット更新と、その他のトランスクリプト専用チャットイベント。プロトコル v4 では、差分ペイロードは `deltaText` を持ち、`message` は累積されたアシスタントスナップショットのままです。非プレフィックス置換は `replace=true` を設定し、`deltaText` を置換テキストとして使用します。
- `session.message`、`session.operation`、`session.tool`: 購読済みセッションのトランスクリプト、進行中のセッション操作、およびイベントストリーム更新。
- `sessions.changed`: セッションインデックスまたはメタデータが変更されました。
- `presence`: システムプレゼンススナップショット更新。
- `tick`: 定期的な keepalive/liveness イベント。
- `health`: Gateway ヘルススナップショット更新。
- `heartbeat`: Heartbeat イベントストリーム更新。
- `cron`: cron 実行/ジョブ変更イベント。
- `shutdown`: Gateway シャットダウン通知。
- `node.pair.requested` / `node.pair.resolved`: ノードペアリングのライフサイクル。
- `node.invoke.request`: ノード invoke リクエストのブロードキャスト。
- `device.pair.requested` / `device.pair.resolved`: ペアリング済みデバイスのライフサイクル。
- `voicewake.changed`: ウェイクワードトリガー設定が変更されました。
- `exec.approval.requested` / `exec.approval.resolved`: exec 承認ライフサイクル。
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin 承認ライフサイクル。

### ノード補助メソッド

ノードは、自動許可チェック用に現在のスキル実行可能ファイル一覧を取得するため、`skills.bins` を呼び出すことができます。

## タスク台帳 RPC

オペレータークライアントは、タスク台帳 RPC（`packages/gateway-protocol/src/schema/tasks.ts`）を通じて、Gateway バックグラウンドタスクレコードを検査およびキャンセルします。これらは、生のランタイム状態ではなく、サニタイズ済みのタスク要約を返します。

- `tasks.list` には `operator.read` が必要です。
  - パラメーター: 任意の `status`（`"queued"`、`"running"`、`"completed"`、`"failed"`、`"cancelled"`、または `"timed_out"`）またはそれらのステータスの配列、任意の `agentId`、任意の `sessionKey`、`1` から `500` までの任意の `limit`、および任意の文字列 `cursor`。
  - 結果: `{ "tasks": TaskSummary[], "nextCursor"?: string }`。
- `tasks.get` には `operator.read` が必要です。
  - パラメーター: `{ "taskId": string }`。
  - 結果: `{ "task": TaskSummary }`。
  - 存在しないタスク ID は、Gateway の not-found エラー形状を返します。
- `tasks.cancel` には `operator.write` が必要です。
  - パラメーター: `{ "taskId": string, "reason"?: string }`。
  - 結果: `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`。
  - `found` は、台帳に一致するタスクがあったかどうかを報告します。`cancelled` は、ランタイムがキャンセルを受け入れたか、または記録したかを報告します。

`TaskSummary` には、`id`、`status`、および任意のメタデータである `kind`、`runtime`、`title`、`agentId`、`sessionKey`、`childSessionKey`、`ownerKey`、`runId`、`taskId`、`flowId`、`parentTaskId`、`sourceId`、タイムスタンプ、進捗、終端要約、サニタイズ済みエラーテキストが含まれます。`agentId` はタスクを実行しているエージェントを識別します。`sessionKey` と `ownerKey` は、リクエスト元と制御コンテキストを保持します。

## オペレーター補助メソッド

- `commands.list` (`operator.read`) は、エージェントのランタイムコマンドインベントリを取得します。
  - `agentId` は省略可能です。デフォルトのエージェントワークスペースを読み取る場合は省略します。
  - `scope` は、主 `name` が対象にするサーフェスを制御します。`text` は先頭の `/` なしで主テキストコマンドトークンを返し、`native` とデフォルトの `both` パスは、利用可能な場合にプロバイダー対応のネイティブ名を返します。
  - `textAliases` は `/model` や `/m` などの正確なスラッシュエイリアスを保持します。
  - `nativeName` は、存在する場合にプロバイダー対応のネイティブコマンド名を保持します。
  - `provider` は省略可能で、ネイティブ命名とネイティブPluginコマンドの可用性にのみ影響します。
  - `includeArgs=false` は、シリアライズされた引数メタデータをレスポンスから省略します。
- `tools.catalog` (`operator.read`) は、エージェントのランタイムツールカタログを取得します。レスポンスには、グループ化されたツールと由来メタデータが含まれます。
  - `source`: `core` または `plugin`
  - `pluginId`: `source="plugin"` の場合のPlugin所有者
  - `optional`: Pluginツールが省略可能かどうか
- `tools.effective` (`operator.read`) は、セッションでランタイム有効なツールインベントリを取得します。
  - `sessionKey` は必須です。
  - Gateway は、呼び出し元が指定した認証または配信コンテキストを受け入れる代わりに、セッションからサーバー側で信頼済みランタイムコンテキストを導出します。
  - レスポンスは、コア、Plugin、チャネル、すでに検出済みの MCP サーバーツールを含む、アクティブインベントリのセッションスコープのサーバー導出プロジェクションです。
  - `tools.effective` は MCP に対して読み取り専用です。ウォームなセッション MCP カタログを最終ツールポリシー経由で投影する場合がありますが、MCP ランタイムの作成、トランスポート接続、`tools/list` の発行は行いません。一致するウォームカタログが存在しない場合、レスポンスには `mcp-not-yet-connected`、`mcp-not-yet-listed`、または `mcp-stale-catalog` などの通知が含まれることがあります。
  - 有効なツールエントリは `source="core"`、`source="plugin"`、`source="channel"`、または `source="mcp"` を使用します。
- `tools.invoke` (`operator.write`) は、`/tools/invoke` と同じ Gateway ポリシーパスを通じて、利用可能なツールを1つ呼び出します。
  - `name` は必須です。`args`、`sessionKey`、`agentId`、`confirm`、`idempotencyKey` は省略可能です。
  - `sessionKey` と `agentId` の両方が存在する場合、解決されたセッションエージェントは `agentId` と一致する必要があります。
  - `cron`、`gateway`、`nodes` などの所有者専用コアラッパーは、`tools.invoke` 自体が `operator.write` であっても、所有者/管理者 ID (`operator.admin`) を必要とします。
  - レスポンスは、`ok`、`toolName`、任意の `output`、型付き `error` フィールドを持つ SDK 向けエンベロープです。承認またはポリシー拒否は、Gateway ツールポリシーパイプラインを迂回するのではなく、ペイロード内で `ok:false` を返します。
- `skills.status` (`operator.read`) は、エージェントに表示されるスキルインベントリを取得します。
  - `agentId` は省略可能です。デフォルトのエージェントワークスペースを読み取る場合は省略します。
  - レスポンスには、適格性、不足している要件、設定チェック、生のシークレット値を公開しないサニタイズ済みインストールオプションが含まれます。
- `skills.search` と `skills.detail` (`operator.read`) は ClawHub 検出メタデータを返します。
- `skills.upload.begin`、`skills.upload.chunk`、`skills.upload.commit` (`operator.admin`) は、インストール前にプライベートスキルアーカイブをステージングします。これは信頼済みクライアント向けの別個の管理者アップロードパスであり、通常の ClawHub スキルインストールフローではありません。また、`skills.install.allowUploadedArchives` が有効でない限りデフォルトで無効です。
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })` は、その slug と force 値に紐づくアップロードを作成します。
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` は、正確なデコード済みオフセットにバイトを追加します。
  - `skills.upload.commit({ uploadId, sha256? })` は、最終サイズと SHA-256 を検証します。commit はアップロードを確定するだけで、スキルをインストールしません。
  - アップロードされたスキルアーカイブは、ルートに `SKILL.md` を含む zip アーカイブです。アーカイブ内部のディレクトリ名がインストール先を選択することはありません。
- `skills.install` (`operator.admin`) には3つのモードがあります。
  - ClawHub モード: `{ source: "clawhub", slug, version?, force? }` は、デフォルトエージェントワークスペースの `skills/` ディレクトリにスキルフォルダーをインストールします。
  - アップロードモード: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }` は、コミット済みアップロードをデフォルトエージェントワークスペースの `skills/<slug>` ディレクトリにインストールします。slug と force 値は元の `skills.upload.begin` リクエストと一致する必要があります。`skills.install.allowUploadedArchives` が有効でない限り拒否されます。この設定は ClawHub インストールには影響しません。
  - Gateway インストーラーモード: `{ name, installId, timeoutMs? }` は、Gateway ホスト上で宣言済みの `metadata.openclaw.install` アクションを実行します。古いクライアントはまだ `dangerouslyForceUnsafeInstall` を送信する場合があります。このフィールドは非推奨で、プロトコル互換性のためにのみ受け入れられ、無視されます。オペレーター所有のインストール判断には `security.installPolicy` を使用します。
- `skills.update` (`operator.admin`) には2つのモードがあります。
  - ClawHub モードは、デフォルトエージェントワークスペース内の追跡対象 slug 1つ、または追跡対象のすべての ClawHub インストールを更新します。
  - 設定モードは、`enabled`、`apiKey`、`env` などの `skills.entries.<skillKey>` 値にパッチを適用します。

### `models.list` ビュー

`models.list` は任意の `view` パラメーターを受け入れます
(`src/agents/model-catalog-visibility.ts`)。

- 省略または `"default"`: `agents.defaults.models` が設定されている場合、レスポンスは許可済みカタログになり、`provider/*` エントリ向けに動的に検出されたモデルも含まれます。それ以外の場合、レスポンスは完全な Gateway カタログになります。
- `"configured"`: ピッカー向けサイズの挙動です。`agents.defaults.models` が設定されている場合は、`provider/*` エントリ向けのプロバイダースコープ検出を含め、引き続きそれが優先されます。許可リストがない場合、レスポンスは明示的な `models.providers.<provider>.models` エントリを使用し、設定済みモデル行が存在しない場合にのみ完全なカタログへフォールバックします。
- `"all"`: `agents.defaults.models` を迂回する完全な Gateway カタログです。通常のモデルピッカーではなく、診断/検出 UI に使用します。

## Exec 承認

- exec リクエストが承認を必要とする場合、Gateway は `exec.approval.requested` をブロードキャストします。
- オペレータークライアントは `exec.approval.resolve` を呼び出して解決します（`operator.approvals` が必要）。
- `host=node` の場合、`exec.approval.request` には `systemRunPlan`（正規の `argv`/`cwd`/`rawCommand`/セッションメタデータ）を含める必要があります。`systemRunPlan` がないリクエストは拒否されます。
- 承認後、転送された `node.invoke system.run` 呼び出しは、その正規の `systemRunPlan` を権威あるコマンド/cwd/セッションコンテキストとして再利用します。
- 呼び出し元が prepare と最終承認済み `system.run` 転送の間に `command`、`rawCommand`、`cwd`、`agentId`、または `sessionKey` を変更した場合、Gateway は変更されたペイロードを信頼せず、実行を拒否します。

## エージェント配信フォールバック

- `agent` リクエストには、アウトバウンド配信を要求するために `deliver=true` を含めることができます。
- `bestEffortDeliver=false`（デフォルト）は厳格な挙動を維持します。解決できない配信先、または内部専用の配信先は `INVALID_REQUEST` を返します。
- `bestEffortDeliver=true` は、外部に配信可能なルートを解決できない場合（たとえば内部/webchat セッションや曖昧なマルチチャネル設定）、セッションのみの実行へのフォールバックを許可します。
- 配信が要求された場合、最終的な `agent` 結果には `result.deliveryStatus` が含まれることがあり、[`openclaw agent --json --deliver`](/ja-JP/cli/agent#json-delivery-status) に記載されているものと同じ `sent`、`suppressed`、`partial_failed`、`failed` ステータスを使用します。

## バージョニング

- `PROTOCOL_VERSION` と `MIN_CLIENT_PROTOCOL_VERSION` は `packages/gateway-protocol/src/version.ts` にあります。どちらも現在は `4` です。
- クライアントは `minProtocol` + `maxProtocol` を送信します。Gateway は `maxProtocol >= PROTOCOL_VERSION && minProtocol <= PROTOCOL_VERSION` の場合に接続を受け入れます
  (`src/gateway/server/ws-connection/message-handler.ts`)。現在のクライアントとサーバーはどちらもプロトコル v4 を実行します。
- スキーマとモデルは TypeBox 定義から生成されます。
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### クライアント定数

参照クライアント実装は `packages/gateway-client/src/` にあります
（OpenClaw は薄い `src/gateway/client.ts` ファサード経由でこれをラップします）。これらのデフォルトはプロトコル v4 全体で安定しており、サードパーティクライアントの期待されるベースラインです。

| 定数                                      | デフォルト                                            | ソース                                                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| リクエストタイムアウト（RPC ごと）        | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`requestTimeoutMs`)                                                              |
| 事前認証 / 接続チャレンジタイムアウト     | `15_000` ms                                           | `packages/gateway-client/src/timeouts.ts` (`OPENCLAW_HANDSHAKE_TIMEOUT_MS` env can raise the paired server/client budget) |
| 初期再接続バックオフ                      | `1_000` ms                                            | `packages/gateway-client/src/client.ts` (`backoffMs`)                                                                     |
| 最大再接続バックオフ                      | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`scheduleReconnect`)                                                             |
| デバイストークン切断後の高速リトライ制限  | `250` ms                                              | `packages/gateway-client/src/client.ts`                                                                                   |
| `terminate()` 前の強制停止猶予            | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                           |
| `stopAndWait()` デフォルトタイムアウト     | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                |
| デフォルト tick 間隔（`hello-ok` 前）      | `30_000` ms                                           | `packages/gateway-client/src/client.ts`                                                                                   |
| tick タイムアウトによる切断               | 無音が `tickIntervalMs * 2` を超えた場合は code `4000` | `packages/gateway-client/src/client.ts`                                                                                   |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                                                         |

サーバーは、有効な `policy.tickIntervalMs`、`policy.maxPayload`、`policy.maxBufferedBytes` を `hello-ok` で通知します。クライアントはハンドシェイク前のデフォルトではなく、それらの値に従う必要があります。

## 認証

- 共有シークレットの Gateway 認証は、設定された
  `gateway.auth.mode` (`"none" | "token" | "password" | "trusted-proxy"`) に応じて、
  `connect.params.auth.token` または
  `connect.params.auth.password` を使用します。
- Tailscale Serve (`gateway.auth.allowTailscale: true`) や非ループバックの
  `gateway.auth.mode: "trusted-proxy"` など、ID を伴うモードでは、
  `connect.params.auth.*` の代わりにリクエストヘッダーから connect 認証チェックを満たします。
- プライベート ingress の `gateway.auth.mode: "none"` は共有シークレットの connect 認証を
  完全にスキップします。このモードを公開または信頼されていない ingress に公開しないでください。
- ペアリング後、gateway は接続ロール + スコープに限定されたデバイストークンを発行し、
  `hello-ok.auth.deviceToken` で返します。クライアントは connect が成功するたびに
  それを永続化する必要があります。
- 保存済みのデバイストークンで再接続する場合は、そのトークンに対して保存済みの
  承認済みスコープセットも再利用する必要があります。これにより、すでに付与された
  読み取り/プローブ/ステータスアクセスが保持され、再接続がより狭い暗黙の
  admin のみのスコープへ密かに縮小されることを避けられます。
- クライアント側の connect 認証組み立て
  (`packages/gateway-client/src/client.ts` の `selectConnectAuth`):
  - `auth.password` は直交しており、設定されている場合は常に転送されます。
  - `auth.token` は優先順位に従って設定されます。明示的な共有トークンが最優先で、
    次に明示的な `deviceToken`、その次に保存済みのデバイスごとのトークン
    (`deviceId` + `role` をキーにしたもの) です。
  - `auth.bootstrapToken` は、上記のいずれでも `auth.token` が解決されなかった場合にのみ送信されます。
    共有トークンまたは解決済みのデバイストークンがある場合は送信されません。
  - 1 回限りの `AUTH_TOKEN_MISMATCH` リトライで保存済みデバイストークンを自動昇格する処理は、
    信頼済みエンドポイントにのみ制限されます。対象はループバック、または固定された
    `tlsFingerprint` を持つ `wss://` です。ピン留めなしの公開 `wss://` は対象外です。
- 組み込みセットアップコードのブートストラップは、信頼済みモバイル引き継ぎ用に、
  主要 Node の `hello-ok.auth.deviceToken` と、制限付き operator トークンを
  `hello-ok.auth.deviceTokens` で返します。operator トークンにはネイティブ Talk
  設定読み取り用の `operator.talk.secrets` が含まれますが、ペアリング変更スコープと
  `operator.admin` は除外されます。
- 非ベースラインのセットアップコードブートストラップが承認待ちの間、
  `PAIRING_REQUIRED` の詳細には `recommendedNextStep: "wait_then_retry"`、
  `retryable: true`、`pauseReconnect: false` が含まれます。リクエストが承認されるか
  トークンが無効になるまで、同じブートストラップトークンで再接続を続けてください。
- `hello-ok.auth.deviceTokens` は、connect が `wss://` やループバック/ローカルペアリングなどの
  信頼済み transport 上でブートストラップ認証を使用した場合にのみ永続化してください。
- クライアントが明示的な `deviceToken` または明示的な `scopes` を指定した場合、
  その呼び出し元が要求したスコープセットが引き続き authoritative です。キャッシュされたスコープは、
  クライアントが保存済みのデバイスごとのトークンを再利用している場合にのみ再利用されます。
- デバイストークンは `device.token.rotate` と
  `device.token.revoke` でローテーション/失効できます (`operator.pairing` が必要)。
  Node またはその他の非 operator ロールをローテーションまたは失効する場合は、
  `operator.admin` も必要です。
- `device.token.rotate` はローテーションメタデータを返します。置き換え後の bearer トークンは、
  そのデバイストークンですでに認証済みの同一デバイス呼び出しに対してのみエコーされます。
  これにより、トークンのみのクライアントは再接続前に置き換え後のトークンを永続化できます。
  共有/admin ローテーションでは bearer トークンはエコーされません。
- トークンの発行、ローテーション、失効は、そのデバイスのペアリングエントリに記録された
  承認済みロールセットの範囲内に制限されます。トークン変更によって、ペアリング承認で
  付与されていないデバイスロールを拡張したり対象にしたりすることはできません。
- ペアリング済みデバイストークンセッションでは、呼び出し元が `operator.admin` も持っていない限り、
  デバイス管理は自己スコープに制限されます。非 admin 呼び出し元が管理できるのは、
  自身のデバイスエントリの operator トークンのみです。Node およびその他の非 operator トークン管理は、
  呼び出し元自身のデバイスであっても admin のみです。
- `device.token.rotate` と `device.token.revoke` は、対象の
  operator トークンのスコープセットも、呼び出し元の現在のセッションスコープに照らしてチェックします。
  非 admin 呼び出し元は、自身がすでに保持している範囲より広い operator トークンを
  ローテーションまたは失効できません。
- 認証失敗には `error.details.code` と復旧ヒントが含まれます。
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep`: `retry_with_device_token`、
    `update_auth_configuration`、`update_auth_credentials`、
    `wait_then_retry`、`review_auth_configuration` のいずれか
    (`packages/gateway-protocol/src/connect-error-details.ts`)。
- `AUTH_TOKEN_MISMATCH` に対するクライアントの動作:
  - 信頼済みクライアントは、キャッシュされたデバイスごとのトークンで制限付きのリトライを 1 回試行できます。
  - そのリトライが失敗した場合は、自動再接続ループを停止し、operator の対応ガイダンスを提示します。
- `AUTH_SCOPE_MISMATCH` は、デバイストークンは認識されたものの、要求されたロール/スコープを
  カバーしていないことを意味します。これを不正なトークンとして提示しないでください。
  operator に再ペアリング、またはより狭い/広いスコープ契約の承認を促してください。

## デバイス ID とペアリング

- Node はキーペア fingerprint から導出された安定したデバイス ID (`device.id`) を含める必要があります。
- Gateway はデバイス + ロールごとにトークンを発行します。
- ローカル自動承認が有効でない限り、新しいデバイス ID にはペアリング承認が必要です。
- ペアリングの自動承認は、直接 local loopback connect を中心にしています。
- OpenClaw には、信頼済み共有シークレットヘルパーフロー用の狭い backend/container-local
  自己接続パスもあります。
- 同一ホストの tailnet または LAN connect も、ペアリングでは引き続きリモートとして扱われ、
  承認が必要です。
- WS クライアントは通常、`connect` 中に `device` ID を含めます (operator +
  node)。デバイスなしの operator 例外は、明示的な信頼パスのみです。
  - localhost のみの安全でない HTTP 互換性のための `gateway.controlUi.allowInsecureAuth=true`。
  - `gateway.auth.mode: "trusted-proxy"` の operator Control UI 認証が成功した場合。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass、重大なセキュリティ低下)。
  - 予約済み内部ヘルパーパス上の直接ループバック `gateway-client` backend RPC。
- デバイス ID を省略するとスコープに影響します。デバイスなしの operator 接続が明示的な信頼パスを通じて許可される場合でも、
  OpenClaw は、そのパスに名前付きのスコープ保持例外がない限り、自己宣言スコープを空セットにクリアします。
  その後、スコープで保護されたメソッドは `missing scope` で失敗します。
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` は、Control UI の
  break-glass スコープ保持パスです。任意のカスタム backend または CLI 形式の
  WebSocket クライアントにスコープを付与するものではありません。
- 予約済みの直接ループバック `gateway-client` backend ヘルパーパスは、
  内部ローカル control-plane RPC に対してのみスコープを保持します。カスタム backend ID は
  この例外を受けません。
- すべての接続は、サーバーが提供する `connect.challenge` nonce に署名する必要があります。

### デバイス認証移行診断

challenge 前の署名動作をまだ使用しているレガシークライアントに対して、`connect` は
`error.details.code` の下に `DEVICE_AUTH_*` 詳細コードを返し、安定した
`error.details.reason` を含めます。

一般的な移行失敗:

| メッセージ                     | details.code                     | details.reason           | 意味                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | クライアントが `device.nonce` を省略しました (または空で送信しました)。     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | クライアントが古い/誤った nonce で署名しました。            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 署名ペイロードが v2 ペイロードと一致しません。       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 署名済み timestamp が許容 skew の範囲外です。          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` が公開鍵 fingerprint と一致しません。 |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開鍵の形式/正規化に失敗しました。         |

移行先:

- 常に `connect.challenge` を待ってください。
- サーバー nonce を含む v2 ペイロードに署名してください。
- 同じ nonce を `connect.params.device.nonce` で送信してください。
- 推奨される署名ペイロードは `v3`
  (`packages/gateway-client/src/device-auth.ts` の `buildDeviceAuthPayloadV3`) で、
  device/client/role/scopes/token/nonce フィールドに加えて `platform` と `deviceFamily`
  もバインドします。
- レガシー `v2` 署名は互換性のために引き続き受け入れられますが、ペアリング済みデバイスの
  メタデータピン留めが、再接続時のコマンドポリシーを引き続き制御します。

## TLS とピン留め

- TLS は WS 接続でサポートされています (`gateway.tls` 設定)。
- クライアントは任意で、`gateway.remote.tlsFingerprint` または CLI `--tls-fingerprint` を使って
  gateway 証明書 fingerprint をピン留めできます。

## スコープ

このプロトコルは、ステータス、チャンネル、モデル、チャット、エージェント、セッション、Node、承認など、
gateway API 全体を公開します。正確な surface は、
`packages/gateway-protocol/src/schema.ts` から再エクスポートされる TypeBox スキーマで定義されます。

## 関連

- [ブリッジプロトコル](/ja-JP/gateway/bridge-protocol)
- [Gateway ランブック](/ja-JP/gateway)
