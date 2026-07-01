---
read_when:
    - Gateway WebSocket クライアントの実装または更新
    - デバッグプロトコルの不一致または接続失敗
    - プロトコルスキーマ/モデルの再生成
summary: 'Gateway WebSocket プロトコル: ハンドシェイク、フレーム、バージョン管理'
title: Gateway プロトコル
x-i18n:
    generated_at: "2026-07-01T02:59:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fbfc5db0169f7ac2eacdb882d2afe08c80d5b8d669b6a1cfb2ffd0edbf71d16
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS プロトコルは、OpenClaw の**単一のコントロールプレーン + ノードトランスポート**です。すべてのクライアント（CLI、Web UI、macOS アプリ、iOS/Android ノード、ヘッドレスノード）は WebSocket 経由で接続し、ハンドシェイク時に自身の**ロール** + **スコープ**を宣言します。

## トランスポート

- WebSocket、JSON ペイロードを含むテキストフレーム。
- 最初のフレームは `connect` リクエストでなければなりません。
- 接続前フレームは 64 KiB に制限されます。ハンドシェイクが成功した後、クライアントは `hello-ok.policy.maxPayload` と `hello-ok.policy.maxBufferedBytes` の制限に従う必要があります。診断が有効な場合、Gateway が該当フレームを閉じる、または破棄する前に、サイズ超過の受信フレームと遅い送信バッファーは `payload.large` イベントを発行します。これらのイベントはサイズ、制限、サーフェス、安全な理由コードを保持します。メッセージ本文、添付ファイルの内容、生フレーム本文、トークン、Cookie、シークレット値は保持しません。

## ハンドシェイク（connect）

Gateway → クライアント（接続前チャレンジ）:

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

クライアント → Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
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

Gateway → クライアント:

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

Gateway がまだ起動時 sidecar の完了処理中の場合、`connect` リクエストは再試行可能な `UNAVAILABLE` エラーを返すことがあります。このとき `details.reason` は `"startup-sidecars"` に設定され、`retryAfterMs` が含まれます。クライアントはこれを最終的なハンドシェイク失敗として表示するのではなく、全体の接続予算内で再試行する必要があります。

`server`、`features`、`snapshot`、`policy` はすべてスキーマ（`packages/gateway-protocol/src/schema/frames.ts`）で必須です。`auth` も必須で、ネゴシエートされたロール/スコープを報告します。`pluginSurfaceUrls` は任意で、`canvas` などの Plugin サーフェス名をスコープ付きホスト URL にマップします。

スコープ付き Plugin サーフェス URL は期限切れになることがあります。ノードは `node.pluginSurface.refresh` を `{ "surface": "canvas" }` で呼び出し、`pluginSurfaceUrls` の新しいエントリを受け取れます。実験的な Canvas Plugin リファクタリングは、非推奨の `canvasHostUrl`、`canvasCapability`、`node.canvas.capability.refresh` 互換パスをサポートしません。現在のネイティブクライアントと Gateway は Plugin サーフェスを使用する必要があります。

デバイストークンが発行されない場合、`hello-ok.auth` はトークンフィールドなしで、ネゴシエートされた権限を報告します。

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

信頼された同一プロセスのバックエンドクライアント（`client.id: "gateway-client"`、`client.mode: "backend"`）は、共有 Gateway トークン/パスワードで認証する直接 loopback 接続では `device` を省略できます。このパスは内部コントロールプレーン RPC 用に予約されており、古い CLI/デバイスのペアリングベースラインがサブエージェントセッション更新などのローカルバックエンド作業を妨げないようにします。リモートクライアント、ブラウザーオリジンのクライアント、ノードクライアント、明示的なデバイストークン/デバイス ID クライアントは、通常のペアリングおよびスコープ昇格チェックを引き続き使用します。

デバイストークンが発行される場合、`hello-ok` には次も含まれます。

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

組み込みの QR/セットアップコードブートストラップは、新しいモバイル引き渡しパスです。ベースラインのセットアップコード connect が成功すると、プライマリノードトークンと、境界付けされた 1 つのオペレータートークンが返されます。

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

オペレーター引き渡しは意図的に制限されており、QR オンボーディングが `operator.admin` や `operator.pairing` を付与せずにモバイルオペレーターループを開始できるようにしています。ブートストラップ後にネイティブクライアントが必要とする Talk 設定を読み取れるよう、`operator.talk.secrets` は含まれます。より広い管理者スコープとペアリングスコープには、別途承認されたオペレーターペアリングまたはトークンフローが必要です。クライアントは、`wss://` や loopback/local ペアリングなどの信頼されたトランスポート上でブートストラップ認証を使用して connect した場合にのみ、`hello-ok.auth.deviceTokens` を永続化する必要があります。

### ノードの例

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
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

## フレーミング

- **リクエスト**: `{type:"req", id, method, params}`
- **レスポンス**: `{type:"res", id, ok, payload|error}`
- **イベント**: `{type:"event", event, payload, seq?, stateVersion?}`

副作用を伴うメソッドには**冪等性キー**が必要です（スキーマを参照）。

## ロール + スコープ

完全なオペレータースコープモデル、承認時チェック、共有シークレットのセマンティクスについては、[オペレータースコープ](/ja-JP/gateway/operator-scopes)を参照してください。

### ロール

- `operator` = コントロールプレーンクライアント（CLI/UI/自動化）。
- `node` = 機能ホスト（camera/screen/canvas/system.run）。

### スコープ（オペレーター）

一般的なスコープ:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` を指定した `talk.config` には `operator.talk.secrets`（または `operator.admin`）が必要です。
シークレットが含まれる場合、クライアントは有効な Talk プロバイダー認証情報を `talk.resolved.config.apiKey` から読み取る必要があります。`talk.providers.<id>.apiKey` はソース形状のままで、SecretRef オブジェクトまたはマスクされた文字列である可能性があります。

Plugin 登録済みの Gateway RPC メソッドは独自のオペレータースコープを要求できますが、予約済みのコア管理プレフィックス（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は常に `operator.admin` に解決されます。

メソッドスコープは最初のゲートにすぎません。`chat.send` を通じて到達する一部のスラッシュコマンドは、その上により厳格なコマンドレベルのチェックを適用します。たとえば、永続的な `/config set` と `/config unset` の書き込みには `operator.admin` が必要です。

`node.pair.approve` には、ベースメソッドスコープに加えて、承認時の追加スコープチェックもあります。

- コマンドなしリクエスト: `operator.pairing`
- exec 以外のノードコマンドを含むリクエスト: `operator.pairing` + `operator.write`
- `system.run`、`system.run.prepare`、または `system.which` を含むリクエスト:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions（ノード）

ノードは接続時に機能クレームを宣言します。

- `caps`: `camera`、`canvas`、`screen`、`location`、`voice`、`talk` などの高レベル機能カテゴリ。
- `commands`: invoke 用コマンド許可リスト。
- `permissions`: 粒度の細かいトグル（例: `screen.record`、`camera.capture`）。

Gateway はこれらを**クレーム**として扱い、サーバー側の許可リストを適用します。

## プレゼンス

- `system-presence` はデバイス ID をキーにしたエントリを返します。
- プレゼンスエントリには `deviceId`、`roles`、`scopes` が含まれるため、UI は同じデバイスが**オペレーター**と**ノード**の両方として接続している場合でも、デバイスごとに 1 行で表示できます。
- `node.list` には任意の `lastSeenAtMs` と `lastSeenReason` フィールドが含まれます。接続中のノードは、理由 `connect` とともに現在の接続時刻を `lastSeenAtMs` として報告します。ペアリング済みノードは、信頼されたノードイベントがペアリングメタデータを更新したときに、永続的なバックグラウンドプレゼンスも報告できます。

### ノードのバックグラウンド alive イベント

ノードは `event: "node.presence.alive"` を指定して `node.event` を呼び出し、ペアリング済みノードが接続済みとしてマークされることなく、バックグラウンドウェイク中に alive だったことを記録できます。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` は閉じた enum です: `background`、`silent_push`、`bg_app_refresh`、`significant_location`、`manual`、または `connect`。未知の trigger 文字列は、永続化前に Gateway によって `background` に正規化されます。このイベントは、認証済みノードデバイスセッションに対してのみ永続化されます。デバイスなしまたは未ペアリングのセッションは `handled: false` を返します。

成功した Gateway は構造化された結果を返します。

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

古い Gateway は `node.event` に対してまだ `{ "ok": true }` を返す場合があります。クライアントはこれを、永続的なプレゼンスの保存ではなく、確認済み RPC として扱う必要があります。

## ブロードキャストイベントのスコープ制御

サーバーからプッシュされる WebSocket ブロードキャストイベントはスコープでゲートされるため、ペアリング専用またはノード専用セッションがセッション内容を受動的に受信することはありません。

- **チャット、エージェント、ツール結果フレーム**（ストリーミングされた `agent` イベントとツール呼び出し結果を含む）には、少なくとも `operator.read` が必要です。`operator.read` のないセッションは、これらのフレームを完全にスキップします。
- **Plugin 定義の `plugin.*` ブロードキャスト**は、Plugin の登録方法に応じて `operator.write` または `operator.admin` でゲートされます。
- **ステータスおよびトランスポートイベント**（`heartbeat`、`presence`、`tick`、接続/切断ライフサイクルなど）は制限されないままです。これにより、すべての認証済みセッションがトランスポートの健全性を観測できます。
- **未知のブロードキャストイベントファミリー**は、登録済みハンドラーが明示的に緩和しない限り、デフォルトでスコープゲートされます（fail-closed）。

各クライアント接続は独自のクライアント別シーケンス番号を保持するため、異なるクライアントがイベントストリームの異なるスコープフィルター済みサブセットを見ている場合でも、ブロードキャストはそのソケット上で単調な順序を保持します。

## 一般的な RPC メソッドファミリー

公開 WS サーフェスは、上記のハンドシェイク/認証例よりも広範です。これは生成されたダンプではありません。`hello-ok.features.methods` は、`src/gateway/server-methods-list.ts` と読み込まれた Plugin/チャネルメソッドのエクスポートから構築された保守的な検出リストです。これは機能検出として扱い、`src/gateway/server-methods/*.ts` の完全な列挙として扱わないでください。

  <AccordionGroup>
  <Accordion title="System and identity">
    - `health` は、キャッシュ済みまたは新たにプローブした Gateway ヘルススナップショットを返します。
    - `diagnostics.stability` は、最近の範囲制限された診断安定性レコーダーを返します。イベント名、件数、バイトサイズ、メモリ読み取り値、キュー/セッション状態、チャンネル/Plugin 名、セッション ID などの運用メタデータを保持します。チャット本文、Webhook 本文、ツール出力、生のリクエストまたはレスポンス本文、トークン、Cookie、シークレット値は保持しません。オペレーター読み取りスコープが必要です。
    - `status` は、`/status` 形式の Gateway サマリーを返します。機密フィールドは、管理者スコープのオペレータークライアントにのみ含まれます。
    - `gateway.identity.get` は、リレーおよびペアリングフローで使用される Gateway デバイス ID を返します。
    - `system-presence` は、接続済みのオペレーター/Node デバイスの現在のプレゼンススナップショットを返します。
    - `system-event` は、システムイベントを追加し、プレゼンスコンテキストを更新/ブロードキャストできます。
    - `last-heartbeat` は、最後に永続化された heartbeat イベントを返します。
    - `set-heartbeats` は、Gateway 上の heartbeat 処理を切り替えます。

  </Accordion>

  <Accordion title="Models and usage">
    - `models.list` は、ランタイムで許可されたモデルカタログを返します。ピッカー向けサイズの設定済みモデル（`agents.defaults.models` が先、次に `models.providers.*.models`）には `{ "view": "configured" }` を渡し、完全なカタログには `{ "view": "all" }` を渡します。
    - `usage.status` は、プロバイダーの使用量ウィンドウ/残りクォータのサマリーを返します。
    - `usage.cost` は、日付範囲の集計済みコスト使用量サマリーを返します。
      1 つのエージェントには `agentId` を渡し、設定済みエージェントを集計するには `agentScope: "all"` を渡します。
    - `doctor.memory.status` は、アクティブなデフォルトエージェントワークスペースのベクターメモリ/キャッシュ済み埋め込みの準備状態を返します。呼び出し元がライブ埋め込みプロバイダーへの ping を明示的に求める場合にのみ、`{ "probe": true }` または `{ "deep": true }` を渡します。Dreaming 対応クライアントは、Dreaming ストア統計を選択したエージェントワークスペースにスコープするために `{ "agentId": "agent-id" }` も渡せます。`agentId` を省略すると、デフォルトエージェントのフォールバックを維持し、設定済み Dreaming ワークスペースを集計します。
    - `doctor.memory.dreamDiary`、`doctor.memory.backfillDreamDiary`、`doctor.memory.resetDreamDiary`、`doctor.memory.resetGroundedShortTerm`、`doctor.memory.repairDreamingArtifacts`、`doctor.memory.dedupeDreamDiary` は、選択エージェントの Dreaming ビュー/アクション用に任意の `{ "agentId": "agent-id" }` パラメーターを受け入れます。`agentId` が省略された場合、設定済みのデフォルトエージェントワークスペースに対して動作します。
    - `doctor.memory.remHarness` は、リモートのコントロールプレーンクライアント向けに、範囲制限された読み取り専用の REM ハーネスプレビューを返します。ワークスペースパス、メモリスニペット、レンダリング済みの grounded Markdown、deep promotion 候補を含む場合があるため、呼び出し元には `operator.read` が必要です。
    - `sessions.usage` は、セッションごとの使用量サマリーを返します。1 つの
      エージェントには `agentId` を渡し、設定済みエージェントをまとめて一覧表示するには `agentScope: "all"` を渡します。
    - `sessions.usage.timeseries` は、1 つのセッションの時系列使用量を返します。
    - `sessions.usage.logs` は、1 つのセッションの使用量ログエントリを返します。

  </Accordion>

  <Accordion title="Channels and login helpers">
    - `channels.status` は、組み込み + バンドル済みチャンネル/Plugin のステータスサマリーを返します。
    - `channels.logout` は、チャンネルがログアウトをサポートしている場合に、特定のチャンネル/アカウントをログアウトします。
    - `web.login.start` は、現在の QR 対応 Web チャンネルプロバイダーの QR/Web ログインフローを開始します。
    - `web.login.wait` は、その QR/Web ログインフローの完了を待ち、成功時にチャンネルを開始します。
    - `push.test` は、登録済み iOS Node にテスト APNs プッシュを送信します。
    - `voicewake.get` は、保存済みのウェイクワードトリガーを返します。
    - `voicewake.set` は、ウェイクワードトリガーを更新し、変更をブロードキャストします。

  </Accordion>

  <Accordion title="メッセージングとログ">
    - `send` は、チャットランナー外でチャネル、アカウント、スレッドターゲットを指定して送信するための直接のアウトバウンド配信 RPC です。
    - `logs.tail` は、カーソル/上限と最大バイト数の制御付きで、設定済みの Gateway ファイルログの末尾を返します。

  </Accordion>

  <Accordion title="Talk と TTS">
    - `talk.catalog` は、音声、ストリーミング文字起こし、リアルタイム音声向けの読み取り専用 Talk プロバイダーカタログを返します。プロバイダー ID、ラベル、設定状態、公開されているモデル/音声 ID、正規モード、トランスポート、brain 戦略、リアルタイム音声/機能フラグを含み、プロバイダーシークレットの返却やグローバル設定の変更は行いません。
    - `talk.config` は有効な Talk 設定ペイロードを返します。`includeSecrets` には `operator.talk.secrets`（または `operator.admin`）が必要です。
    - `talk.session.create` は、`realtime/gateway-relay`、`transcription/gateway-relay`、または `stt-tts/managed-room` 用に Gateway 所有の Talk セッションを作成します。`stt-tts/managed-room` では、`sessionKey` を渡す `operator.write` 呼び出し元は、スコープ付きセッションキー可視性のために `spawnedBy` も渡す必要があります。スコープなしの `sessionKey` 作成と `brain: "direct-tools"` には `operator.admin` が必要です。
    - `talk.session.join` は managed-room セッショントークンを検証し、必要に応じて `session.ready` または `session.replaced` イベントを発行し、平文トークンや保存済みトークンハッシュを含めずに、ルーム/セッションのメタデータと最近の Talk イベントを返します。
    - `talk.session.appendAudio` は、Gateway 所有のリアルタイムリレーおよび文字起こしセッションに base64 PCM 入力音声を追加します。
    - `talk.session.startTurn`、`talk.session.endTurn`、`talk.session.cancelTurn` は、状態がクリアされる前に古いターンを拒否しつつ、managed-room のターンライフサイクルを駆動します。
    - `talk.session.cancelOutput` はアシスタント音声出力を停止します。主に Gateway リレーセッションでの VAD ゲート付き割り込みに使用します。
    - `talk.session.submitToolResult` は、Gateway 所有のリアルタイムリレーセッションによって発行されたプロバイダーツール呼び出しを完了します。最終結果が後続する暫定的なツール出力には `options: { willContinue: true }` を渡し、別のリアルタイムアシスタント応答を開始せずにツール結果でプロバイダー呼び出しを満たす必要がある場合は `options: { suppressResponse: true }` を渡します。
    - `talk.session.steer` は、Gateway 所有のエージェント支援 Talk セッションへアクティブ実行の音声制御を送信します。`{ sessionId, text, mode? }` を受け付けます。ここで `mode` は `status`、`steer`、`cancel`、または `followup` です。省略されたモードは発話テキストから分類されます。
    - `talk.session.close` は、Gateway 所有のリレー、文字起こし、または managed-room セッションを閉じ、終端 Talk イベントを発行します。
    - `talk.mode` は、WebChat/Control UI クライアント向けに現在の Talk モード状態を設定/ブロードキャストします。
    - `talk.client.create` は、Gateway が設定、認証情報、指示、ツールポリシーを所有したまま、`webrtc` または `provider-websocket` を使用してクライアント所有のリアルタイムプロバイダーセッションを作成します。
    - `talk.client.toolCall` は、クライアント所有のリアルタイムトランスポートがプロバイダーツール呼び出しを Gateway ポリシーへ転送できるようにします。最初にサポートされるツールは `openclaw_agent_consult` です。クライアントは実行 ID を受け取り、プロバイダー固有のツール結果を送信する前に通常のチャットライフサイクルイベントを待ちます。
    - `talk.client.steer` は、クライアント所有のリアルタイムトランスポート向けにアクティブ実行の音声制御を送信します。Gateway は `sessionKey` からアクティブな埋め込み実行を解決し、ステアリングを黙って破棄する代わりに、構造化された accepted/rejected 結果を返します。
    - `talk.event` は、リアルタイム、文字起こし、STT/TTS、managed-room、電話、会議アダプター向けの単一の Talk イベントチャネルです。
    - `talk.speak` は、アクティブな Talk 音声プロバイダーを通じて音声を合成します。
    - `tts.status` は、TTS の有効化状態、アクティブプロバイダー、フォールバックプロバイダー、プロバイダー設定状態を返します。
    - `tts.providers` は、表示可能な TTS プロバイダーインベントリを返します。
    - `tts.enable` と `tts.disable` は、TTS 設定状態を切り替えます。
    - `tts.setProvider` は、優先 TTS プロバイダーを更新します。
    - `tts.convert` は、単発のテキスト読み上げ変換を実行します。

  </Accordion>

  <Accordion title="シークレット、設定、更新、ウィザード">
    - `secrets.reload` は、アクティブな SecretRef を再解決し、完全に成功した場合にのみランタイムシークレット状態を差し替えます。
    - `secrets.resolve` は、特定のコマンド/ターゲットセットに対するコマンドターゲットのシークレット割り当てを解決します。
    - `config.get` は、現在の設定スナップショットとハッシュを返します。
    - `config.set` は、検証済みの設定ペイロードを書き込みます。
    - `config.patch` は、部分的な設定更新をマージします。破壊的な配列
      置換には、影響を受けるパスを `replacePaths` に含める必要があります。配列エントリ
      配下のネストされた配列には、`agents.list[].skills` のような `[]` パスを使用します。
    - `config.apply` は、完全な設定ペイロードを検証して置換します。
    - `config.schema` は、Control UI と CLI ツールで使用されるライブ設定スキーマペイロードを返します。これには schema、`uiHints`、version、生成メタデータが含まれ、ランタイムが読み込める場合は Plugin + チャネルのスキーマメタデータも含まれます。このスキーマには、UI で使用されるものと同じラベルおよびヘルプテキストから派生したフィールド `title` / `description` メタデータが含まれます。該当するフィールドドキュメントが存在する場合は、ネストされたオブジェクト、ワイルドカード、配列項目、`anyOf` / `oneOf` / `allOf` の合成分岐も含まれます。
    - `config.schema.lookup` は、1 つの設定パスに対するパススコープの lookup ペイロードを返します。正規化済みパス、浅いスキーマノード、一致したヒント + `hintPath`、任意の `reloadKind`、および UI/CLI ドリルダウン用の直近の子サマリーが含まれます。`reloadKind` は `restart`、`hot`、または `none` のいずれかで、要求されたパスに対する Gateway 設定リロードプランナーを反映します。lookup スキーマノードは、ユーザー向けドキュメントと一般的な検証フィールド（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、数値/文字列/配列/オブジェクトの境界、`additionalProperties`、`deprecated`、`readOnly`、`writeOnly` などのフラグ）を保持します。子サマリーは、`key`、正規化済み `path`、`type`、`required`、`hasChildren`、任意の `reloadKind`、さらに一致した `hint` / `hintPath` を公開します。
    - `update.run` は Gateway 更新フローを実行し、更新自体が成功した場合にのみ再起動をスケジュールします。セッションを持つ呼び出し元は `continuationMessage` を含めることができるため、起動時に再起動継続キューを通じて 1 回の後続エージェントターンが再開されます。コントロールプレーンからのパッケージマネージャー更新と監視付き git-checkout 更新は、ライブ Gateway 内でパッケージツリーを置換したり checkout/build 出力を変更したりする代わりに、切り離された managed-service ハンドオフを使用します。開始済みのハンドオフは、`result.reason: "managed-service-handoff-started"` および `handoff.status: "started"` とともに `ok: true` を返します。利用不可または失敗したハンドオフは、`managed-service-handoff-unavailable` または `managed-service-handoff-failed` とともに `ok: false` を返し、手動シェル更新が必要な場合は `handoff.command` も返します。利用不可のハンドオフは、OpenClaw に systemd 用の `OPENCLAW_SYSTEMD_UNIT` のような安全な supervisor 境界または永続的なサービス ID がないことを意味します。開始済みハンドオフ中は、再起動 sentinel が一時的に `stats.reason: "restart-health-pending"` を報告する場合があります。CLI が再起動後の Gateway を検証して最終的な `ok` sentinel を書き込むまで、継続は遅延されます。
    - `update.status` は、利用可能な場合は再起動後に実行中のバージョンを含め、最新の更新再起動 sentinel を更新して返します。
    - `wizard.start`、`wizard.next`、`wizard.status`、`wizard.cancel` は、オンボーディングウィザードを WS RPC 経由で公開します。

  </Accordion>

  <Accordion title="エージェントとワークスペースのヘルパー">
    - `agents.list` は、有効なモデルとランタイムメタデータを含む、設定済みのエージェントエントリを返します。
    - `agents.create`、`agents.update`、`agents.delete` は、エージェントレコードとワークスペースの配線を管理します。
    - `agents.files.list`、`agents.files.get`、`agents.files.set` は、エージェントに公開されるブートストラップワークスペースファイルを管理します。
    - `tasks.list`、`tasks.get`、`tasks.cancel` は、Gateway タスク台帳を SDK クライアントとオペレータークライアントに公開します。
    - `artifacts.list`、`artifacts.get`、`artifacts.download` は、明示的な `sessionKey`、`runId`、または `taskId` スコープに対して、トランスクリプト由来のアーティファクト概要とダウンロードを公開します。実行クエリとタスククエリは所有セッションをサーバー側で解決し、由来が一致するトランスクリプトメディアのみを返します。安全でない URL ソースまたはローカル URL ソースは、サーバー側で取得する代わりに、サポート対象外のダウンロードを返します。
    - `environments.list` と `environments.status` は、SDK クライアント向けに読み取り専用の Gateway ローカル環境とノード環境の検出を公開します。
    - `agent.identity.get` は、エージェントまたはセッションに対して有効なアシスタント ID を返します。
    - `agent.wait` は、実行が完了するまで待機し、利用可能な場合は終端スナップショットを返します。

  </Accordion>

  <Accordion title="セッション制御">
    - `sessions.list` は現在のセッションインデックスを返します。エージェントランタイムバックエンドが設定されている場合は、行ごとの `agentRuntime` メタデータも含まれます。
    - `sessions.subscribe` と `sessions.unsubscribe` は、現在の WS クライアントに対するセッション変更イベント購読を切り替えます。
    - `sessions.messages.subscribe` と `sessions.messages.unsubscribe` は、1 つのセッションに対するトランスクリプト/メッセージイベント購読を切り替えます。
    - `sessions.preview` は、特定のセッションキーに対して範囲制限付きのトランスクリプトプレビューを返します。
    - `sessions.describe` は、完全一致するセッションキーに対して 1 つの Gateway セッション行を返します。
    - `sessions.resolve` は、セッションターゲットを解決または正規化します。
    - `sessions.create` は、新しいセッションエントリを作成します。
    - `sessions.send` は、既存のセッションにメッセージを送信します。
    - `sessions.steer` は、アクティブなセッション向けの中断して誘導するバリアントです。
    - `sessions.abort` は、セッションのアクティブな作業を中止します。呼び出し元は `key` に加えて任意の `runId` を渡すことも、Gateway がセッションへ解決できるアクティブな実行に対して `runId` のみを渡すこともできます。
    - `sessions.patch` は、セッションメタデータ/オーバーライドを更新し、解決済みの正規モデルと有効な `agentRuntime` を報告します。
    - `sessions.reset`、`sessions.delete`、`sessions.compact` は、セッションメンテナンスを実行します。
    - `sessions.get` は、保存済みの完全なセッション行を返します。
    - チャット実行では、引き続き `chat.history`、`chat.send`、`chat.abort`、`chat.inject` を使用します。`chat.history` は UI クライアント向けに表示正規化されます。インラインディレクティブタグは表示テキストから除去され、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）と、漏えいした ASCII/全角のモデル制御トークンは除去され、正確な `NO_REPLY` / `no_reply` などの純粋なサイレントトークンのアシスタント行は省略され、過大な行はプレースホルダーに置き換えられる場合があります。
    - `chat.message.get` は、単一の表示可能なトランスクリプトエントリ向けに追加された、範囲制限付きの完全メッセージリーダーです。クライアントは `sessionKey`、セッション選択がエージェントスコープの場合は任意の `agentId`、さらに以前に `chat.history` を通じて公開されたトランスクリプト `messageId` を渡します。保存済みエントリがまだ利用可能で過大でない場合、Gateway は軽量履歴の切り詰め上限なしで、同じ表示正規化済みプロジェクションを返します。
    - `chat.send` は、1 ターンの `fastMode: "auto"` を受け入れ、自動カットオフ前に開始されたモデル呼び出しには高速モードを使用し、その後の再試行、フォールバック、ツール結果、または継続呼び出しは高速モードなしで開始します。カットオフの既定値は 60 秒で、`agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` を使用してモデルごとに設定できます。`chat.send` の呼び出し元は、1 ターンの `fastAutoOnSeconds` を渡して、そのリクエストのカットオフを上書きできます。

  </Accordion>

  <Accordion title="デバイスペアリングとデバイストークン">
    - `device.pair.list` は、保留中および承認済みのペアリング済みデバイスを返します。
    - `device.pair.approve`、`device.pair.reject`、`device.pair.remove` は、デバイスペアリングレコードを管理します。
    - `device.token.rotate` は、承認済みロールと呼び出し元スコープの範囲内で、ペアリング済みデバイストークンをローテーションします。
    - `device.token.revoke` は、承認済みロールと呼び出し元スコープの範囲内で、ペアリング済みデバイストークンを取り消します。

  </Accordion>

  <Accordion title="ノードペアリング、呼び出し、保留中の作業">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove`、`node.pair.verify` は、ノードペアリングとブートストラップ検証を扱います。
    - `node.list` と `node.describe` は、既知/接続済みのノード状態を返します。
    - `node.rename` は、ペアリング済みノードのラベルを更新します。
    - `node.invoke` は、接続済みノードへコマンドを転送します。
    - `node.invoke.result` は、呼び出しリクエストの結果を返します。
    - `node.event` は、ノード起点のイベントを Gateway に戻します。
    - `node.pending.pull` と `node.pending.ack` は、接続済みノードのキュー API です。
    - `node.pending.enqueue` と `node.pending.drain` は、オフライン/切断済みノード向けの永続的な保留作業を管理します。

  </Accordion>

  <Accordion title="承認ファミリー">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list`、`exec.approval.resolve` は、ワンショットの exec 承認リクエストと、保留中の承認の検索/再生を扱います。
    - `exec.approval.waitDecision` は、保留中の exec 承認 1 件を待機し、最終判断（またはタイムアウト時は `null`）を返します。
    - `exec.approvals.get` と `exec.approvals.set` は、Gateway の exec 承認ポリシースナップショットを管理します。
    - `exec.approvals.node.get` と `exec.approvals.node.set` は、ノードリレーコマンドを介してノードローカルの exec 承認ポリシーを管理します。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision`、`plugin.approval.resolve` は、プラグイン定義の承認フローを扱います。

  </Accordion>

  <Accordion title="自動化、Skills、ツール">
    - 自動化: `wake` は即時または次回 Heartbeat での起動テキスト注入をスケジュールします。`cron.get`、`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` はスケジュール済み作業を管理します。
    - `cron.run` は、手動実行向けのエンキュースタイル RPC のままです。完了セマンティクスが必要なクライアントは、返された `runId` を読み取り、`cron.runs` をポーリングする必要があります。
    - `cron.runs` は、任意の空でない `runId` フィルターを受け入れるため、クライアントは同じジョブの他の履歴エントリと競合することなく、キューに入った 1 つの手動実行を追跡できます。
    - Skills とツール: `commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。

  </Accordion>
</AccordionGroup>

### 共通イベントファミリー

- `chat`: `chat.inject` などの UI チャット更新、およびその他のトランスクリプトのみのチャット
  イベントです。プロトコル v4 では、差分ペイロードは `deltaText` を保持し、`message` は
  累積アシスタントスナップショットのままです。非プレフィックス置換は `replace=true` を設定し、
  `deltaText` を置換テキストとして使用します。
- `session.message`、`session.operation`、`session.tool`: 購読済み
  セッションのトランスクリプト、進行中のセッション操作、およびイベントストリーム更新です。
- `sessions.changed`: セッションインデックスまたはメタデータが変更されました。
- `presence`: システムプレゼンススナップショットの更新です。
- `tick`: 定期的な keepalive / liveness イベントです。
- `health`: Gateway ヘルススナップショットの更新です。
- `heartbeat`: Heartbeat イベントストリームの更新です。
- `cron`: cron 実行/ジョブ変更イベントです。
- `shutdown`: Gateway シャットダウン通知です。
- `node.pair.requested` / `node.pair.resolved`: ノードペアリングライフサイクルです。
- `node.invoke.request`: ノード呼び出しリクエストのブロードキャストです。
- `device.pair.requested` / `device.pair.resolved`: ペアリング済みデバイスのライフサイクルです。
- `voicewake.changed`: ウェイクワードトリガー設定が変更されました。
- `exec.approval.requested` / `exec.approval.resolved`: exec 承認
  ライフサイクルです。
- `plugin.approval.requested` / `plugin.approval.resolved`: プラグイン承認
  ライフサイクルです。

### ノードヘルパーメソッド

- ノードは `skills.bins` を呼び出して、自動許可チェック向けの現在のスキル実行ファイル一覧を
  取得できます。

### タスク台帳 RPC

オペレータークライアントは、タスク台帳 RPC を通じて Gateway のバックグラウンドタスクレコードを
検査およびキャンセルできます。これらのメソッドは、生のランタイム状態ではなく、サニタイズ済みのタスク概要を返します。

- `tasks.list` には `operator.read` が必要です。
  - パラメーター: 任意の `status`（`"queued"`、`"running"`、`"completed"`、
    `"failed"`、`"cancelled"`、または `"timed_out"`）またはそれらのステータスの配列、
    任意の `agentId`、任意の `sessionKey`、`1` から
    `500` までの任意の `limit`、および任意の文字列 `cursor`。
  - 結果: `{ "tasks": TaskSummary[], "nextCursor"?: string }`。
- `tasks.get` には `operator.read` が必要です。
  - パラメーター: `{ "taskId": string }`。
  - 結果: `{ "task": TaskSummary }`。
  - 欠落しているタスク ID は、Gateway の not-found エラー形状を返します。
- `tasks.cancel` には `operator.write` が必要です。
  - パラメーター: `{ "taskId": string, "reason"?: string }`。
  - 結果:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`。
  - `found` は、台帳に一致するタスクがあったかどうかを報告します。`cancelled`
    は、ランタイムがキャンセルを受け入れたか、または記録したかを報告します。

`TaskSummary` には `id`、`status`、および `kind`、
`runtime`、`title`、`agentId`、`sessionKey`、`childSessionKey`、`ownerKey`、
`runId`、`taskId`、`flowId`、`parentTaskId`、`sourceId`、タイムスタンプ、進捗、
終端概要、サニタイズ済みエラーテキストなどの任意のメタデータが含まれます。`agentId` はタスクを実行しているエージェントを識別します。
`sessionKey` と `ownerKey` は、リクエスト元と制御
コンテキストを保持します。

### オペレーターヘルパーメソッド

- オペレーターは、エージェントのランタイムコマンドインベントリを取得するために
  `commands.list` (`operator.read`) を呼び出せます。
  - `agentId` は任意です。デフォルトのエージェントワークスペースを読む場合は省略します。
  - `scope` は、プライマリの `name` が対象にするサーフェスを制御します:
    - `text` は先頭の `/` を除いたプライマリテキストコマンドトークンを返します
    - `native` とデフォルトの `both` パスは、利用可能な場合にプロバイダー対応のネイティブ名を返します
  - `textAliases` は `/model` や `/m` などの正確なスラッシュエイリアスを保持します。
  - `nativeName` は、存在する場合にプロバイダー対応のネイティブコマンド名を保持します。
  - `provider` は任意で、ネイティブ名とネイティブPluginコマンドの可用性にのみ影響します。
  - `includeArgs=false` は、シリアライズされた引数メタデータをレスポンスから省略します。
- オペレーターは、エージェントのランタイムツールカタログを取得するために
  `tools.catalog` (`operator.read`) を呼び出せます。レスポンスには、グループ化されたツールと来歴メタデータが含まれます:
  - `source`: `core` または `plugin`
  - `pluginId`: `source="plugin"` の場合のPlugin所有者
  - `optional`: Pluginツールが任意かどうか
- オペレーターは、セッションのランタイム有効ツールインベントリを取得するために
  `tools.effective` (`operator.read`) を呼び出せます。
  - `sessionKey` は必須です。
  - Gatewayは、呼び出し元が指定した認証または配信コンテキストを受け入れる代わりに、セッションから信頼済みランタイムコンテキストをサーバー側で導出します。
  - レスポンスは、コア、Plugin、チャネル、すでに検出済みのMCPサーバーツールを含む、セッションスコープのサーバー導出アクティブインベントリ投影です。
  - `tools.effective` はMCPに対して読み取り専用です。ウォームセッションのMCPカタログを最終ツールポリシー経由で投影することはありますが、MCPランタイムを作成したり、トランスポートに接続したり、`tools/list` を発行したりはしません。一致するウォームカタログが存在しない場合、レスポンスには `mcp-not-yet-connected`、`mcp-not-yet-listed`、または `mcp-stale-catalog` などの通知が含まれることがあります。
  - 有効ツールエントリは `source="core"`、`source="plugin"`、`source="channel"`、または
    `source="mcp"` を使用します。
- オペレーターは、`/tools/invoke` と同じGatewayポリシーパスを通じて利用可能なツールを呼び出すために
  `tools.invoke` (`operator.write`) を呼び出せます。
  - `name` は必須です。`args`、`sessionKey`、`agentId`、`confirm`、および
    `idempotencyKey` は任意です。
  - `sessionKey` と `agentId` の両方が存在する場合、解決されたセッションエージェントは
    `agentId` と一致する必要があります。
  - `cron`、`gateway`、`nodes` などの所有者専用コアラッパーは、
    `tools.invoke` メソッド自体が `operator.write` であっても、所有者/管理者ID (`operator.admin`) を必要とします。
  - レスポンスは、`ok`、`toolName`、任意の `output`、および型付きの
    `error` フィールドを持つSDK向けエンベロープです。承認またはポリシー拒否は、Gatewayツールポリシーパイプラインを迂回するのではなく、ペイロード内で `ok:false` を返します。
- オペレーターは、エージェントの可視スキルインベントリを取得するために
  `skills.status` (`operator.read`) を呼び出せます。
  - `agentId` は任意です。デフォルトのエージェントワークスペースを読む場合は省略します。
  - レスポンスには、適格性、欠落している要件、設定チェック、および生のシークレット値を公開しないサニタイズ済みインストールオプションが含まれます。
- オペレーターは、ClawHub検出メタデータのために
  `skills.search` と `skills.detail` (`operator.read`) を呼び出せます。
- オペレーターは、インストール前にプライベートスキルアーカイブをステージングするために
  `skills.upload.begin`、`skills.upload.chunk`、および
  `skills.upload.commit` (`operator.admin`) を呼び出せます。これは信頼済みクライアント用の別個の管理者アップロードパスであり、通常のClawHubスキルインストールフローではありません。また、`skills.install.allowUploadedArchives` が有効でない限り、デフォルトでは無効です。
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    は、そのslugとforce値にバインドされたアップロードを作成します。
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` は、正確なデコード済みオフセットにバイトを追加します。
  - `skills.upload.commit({ uploadId, sha256? })` は、最終サイズと
    SHA-256を検証します。コミットはアップロードを確定するだけで、スキルをインストールしません。
  - アップロードされたスキルアーカイブは、`SKILL.md` ルートを含むzipアーカイブです。アーカイブ内部のディレクトリ名がインストール先を選択することはありません。
- オペレーターは、`skills.install` (`operator.admin`) を3つのモードで呼び出せます:
  - ClawHubモード: `{ source: "clawhub", slug, version?, force? }` は、デフォルトのエージェントワークスペースの `skills/` ディレクトリにスキルフォルダーをインストールします。
  - アップロードモード: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    は、コミット済みアップロードをデフォルトのエージェントワークスペースの `skills/<slug>`
    ディレクトリにインストールします。slugとforce値は元の
    `skills.upload.begin` リクエストと一致する必要があります。このモードは
    `skills.install.allowUploadedArchives` が有効でない限り拒否されます。この設定は
    ClawHubインストールには影響しません。
  - Gatewayインストーラーモード: `{ name, installId, timeoutMs? }`
    は、Gatewayホスト上で宣言済みの `metadata.openclaw.install` アクションを実行します。
    古いクライアントはまだ `dangerouslyForceUnsafeInstall` を送信する場合があります。このフィールドは非推奨で、プロトコル互換性のためにのみ受け入れられ、無視されます。オペレーター所有のインストール判断には
    `security.installPolicy` を使用します。
- オペレーターは、`skills.update` (`operator.admin`) を2つのモードで呼び出せます:
  - ClawHubモードは、デフォルトのエージェントワークスペース内の追跡対象slug 1つ、または追跡対象のすべてのClawHubインストールを更新します。
  - 設定モードは、`enabled`、`apiKey`、`env` などの `skills.entries.<skillKey>` 値にパッチを適用します。

### `models.list` ビュー

`models.list` は任意の `view` パラメーターを受け付けます:

- 省略または `"default"`: 現在のランタイム動作です。`agents.defaults.models` が設定されている場合、レスポンスは許可済みカタログになり、`provider/*` エントリの動的に検出されたモデルも含まれます。それ以外の場合、レスポンスは完全なGatewayカタログです。
- `"configured"`: ピッカーサイズの動作です。`agents.defaults.models` が設定されている場合は、`provider/*` エントリのプロバイダースコープ検出を含めて引き続き優先されます。許可リストがない場合、レスポンスは明示的な `models.providers.*.models` エントリを使用し、設定済みモデル行が存在しない場合にのみ完全なカタログへフォールバックします。
- `"all"`: 完全なGatewayカタログで、`agents.defaults.models` を迂回します。通常のモデルピッカーではなく、診断と検出UIに使用します。

## Exec承認

- execリクエストに承認が必要な場合、Gatewayは `exec.approval.requested` をブロードキャストします。
- オペレータークライアントは `exec.approval.resolve` を呼び出して解決します（`operator.approvals` スコープが必要）。
- `host=node` の場合、`exec.approval.request` は `systemRunPlan`（正規の `argv`/`cwd`/`rawCommand`/セッションメタデータ）を含む必要があります。`systemRunPlan` がないリクエストは拒否されます。
- 承認後、転送された `node.invoke system.run` 呼び出しは、その正規の
  `systemRunPlan` を権威あるコマンド/cwd/セッションコンテキストとして再利用します。
- 呼び出し元がprepareと最終承認済み `system.run` 転送の間に `command`、`rawCommand`、`cwd`、`agentId`、または
  `sessionKey` を変更した場合、Gatewayは変更されたペイロードを信頼する代わりに実行を拒否します。

## エージェント配信フォールバック

- `agent` リクエストは、アウトバウンド配信を要求するために `deliver=true` を含めることができます。
- `bestEffortDeliver=false` は厳格な動作を維持します。解決できない、または内部専用の配信ターゲットは `INVALID_REQUEST` を返します。
- `bestEffortDeliver=true` は、外部に配信可能なルートを解決できない場合（たとえば内部/webchatセッションや曖昧なマルチチャネル設定）、セッションのみの実行へのフォールバックを許可します。
- 最終的な `agent` 結果には、配信が要求された場合に `result.deliveryStatus` が含まれることがあり、[`openclaw agent --json --deliver`](/ja-JP/cli/agent#json-delivery-status) に記載されているものと同じ `sent`、`suppressed`、`partial_failed`、および `failed`
  ステータスを使用します。

## バージョニング

- `PROTOCOL_VERSION` は `packages/gateway-protocol/src/version.ts` にあります。
- クライアントは `minProtocol` + `maxProtocol` を送信します。サーバーは、現在のプロトコルを含まない範囲を拒否します。現在のクライアントとサーバーはプロトコルv4を必要とします。
- スキーマとモデルはTypeBox定義から生成されます:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### クライアント定数

`src/gateway/client.ts` のリファレンスクライアントは、これらのデフォルトを使用します。値はプロトコルv4全体で安定しており、サードパーティクライアントに期待されるベースラインです。

| 定数                                      | デフォルト                                            | ソース                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| リクエストタイムアウト（RPCごと）         | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| 事前認証 / 接続チャレンジタイムアウト     | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts`（config/envでペアのサーバー/クライアント予算を引き上げ可能） |
| 初回再接続バックオフ                      | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| 最大再接続バックオフ                      | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| デバイストークンクローズ後の高速リトライ上限 | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` 前の強制停止猶予            | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` デフォルトタイムアウト    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| デフォルトtick間隔（`hello-ok` 前）        | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| tickタイムアウトクローズ                  | 無音が `tickIntervalMs * 2` を超えた場合のcode `4000` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

サーバーは、有効な `policy.tickIntervalMs`、`policy.maxPayload`、
および `policy.maxBufferedBytes` を `hello-ok` で広告します。クライアントはハンドシェイク前のデフォルトではなく、これらの値を尊重する必要があります。

## 認証

- 共有シークレット Gateway 認証は、構成された認証モードに応じて `connect.params.auth.token` または
  `connect.params.auth.password` を使用します。
- Tailscale Serve
  (`gateway.auth.allowTailscale: true`) や非ループバック
  `gateway.auth.mode: "trusted-proxy"` などの ID を伴うモードは、
  `connect.params.auth.*` ではなくリクエストヘッダーから connect 認証チェックを満たします。
- プライベート ingress の `gateway.auth.mode: "none"` は共有シークレット connect 認証を
  完全にスキップします。このモードを公開または信頼できない ingress に公開しないでください。
- ペアリング後、Gateway は接続ロール + スコープに限定された **デバイストークン** を発行します。
  これは `hello-ok.auth.deviceToken` で返され、今後の接続のためにクライアントが永続化する必要があります。
- クライアントは、成功した connect の後には必ず主要な `hello-ok.auth.deviceToken` を永続化する必要があります。
- その **保存済み** デバイストークンで再接続するときは、そのトークン用に保存済みの承認済みスコープセットも再利用する必要があります。
  これにより、すでに付与された read/probe/status アクセスが維持され、再接続が暗黙の admin 専用の狭いスコープへ静かに縮小されることを避けられます。
- クライアント側の connect 認証組み立て（`src/gateway/client.ts` の `selectConnectAuth`）:
  - `auth.password` は直交しており、設定されている場合は常に転送されます。
  - `auth.token` は優先順位に従って設定されます。最初に明示的な共有トークン、次に明示的な `deviceToken`、その次に保存済みのデバイス単位トークン（`deviceId` + `role` をキーにする）です。
  - `auth.bootstrapToken` は、上記のいずれでも `auth.token` が解決されなかった場合にのみ送信されます。共有トークンまたは解決済みの任意のデバイストークンがある場合は抑制されます。
  - 1 回限りの `AUTH_TOKEN_MISMATCH` 再試行で保存済みデバイストークンを自動昇格する処理は、**信頼済みエンドポイントのみ** に制限されます —
    ループバック、またはピン留めされた `tlsFingerprint` を持つ `wss://` です。ピン留めのない公開 `wss://` は該当しません。
- 組み込みのセットアップコード bootstrap は、主要ノードの
  `hello-ok.auth.deviceToken` に加え、信頼済みモバイル引き継ぎ用の境界付き operator トークンを
  `hello-ok.auth.deviceTokens` で返します。operator トークンにはネイティブ Talk 構成読み取り用の
  `operator.talk.secrets` が含まれ、`operator.admin` と `operator.pairing` は除外されます。
- 非 baseline セットアップコード bootstrap が承認待ちの間、`PAIRING_REQUIRED`
  詳細には `recommendedNextStep: "wait_then_retry"`、`retryable: true`、
  `pauseReconnect: false` が含まれます。クライアントは、リクエストが承認されるかトークンが無効になるまで、
  同じ bootstrap トークンで再接続を続ける必要があります。
- connect が `wss://` やループバック/local ペアリングなどの信頼済みトランスポート上で
  bootstrap 認証を使用した場合にのみ、`hello-ok.auth.deviceTokens` を永続化してください。
- クライアントが **明示的な** `deviceToken` または明示的な `scopes` を指定した場合、
  その呼び出し元が要求したスコープセットが引き続き権威を持ちます。キャッシュされたスコープは、
  クライアントが保存済みのデバイス単位トークンを再利用している場合にのみ再利用されます。
- デバイストークンは `device.token.rotate` と
  `device.token.revoke` でローテーション/失効できます（`operator.pairing` スコープが必要）。
  ノードまたはその他の非 operator ロールをローテーションまたは失効するには、`operator.admin` も必要です。
- `device.token.rotate` はローテーションメタデータを返します。置換用 bearer トークンをエコーするのは、
  そのデバイストークンですでに認証されている同一デバイスの呼び出しに限られるため、トークンのみのクライアントは再接続前に置換トークンを永続化できます。
  共有/admin ローテーションでは bearer トークンはエコーされません。
- トークンの発行、ローテーション、失効は、そのデバイスのペアリングエントリに記録された承認済みロールセット内に制限されます。
  トークンの変更では、ペアリング承認で付与されていないデバイスロールへ拡張したり、それを対象にしたりすることはできません。
- ペアリング済みデバイストークンセッションでは、呼び出し元が `operator.admin` も持っていない限り、デバイス管理は自己スコープです。
  非 admin 呼び出し元は、**自分自身の** デバイスエントリの operator トークンのみ管理できます。ノードおよびその他の非 operator トークン管理は、呼び出し元自身のデバイスであっても admin 専用です。
- `device.token.rotate` と `device.token.revoke` は、対象の operator
  トークンスコープセットも呼び出し元の現在のセッションスコープと照合します。非 admin 呼び出し元は、
  自分がすでに保持しているものより広い operator トークンをローテーションまたは失効できません。
- 認証失敗には `error.details.code` と復旧ヒントが含まれます:
  - `error.details.canRetryWithDeviceToken`（boolean）
  - `error.details.recommendedNextStep`（`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`）
- `AUTH_TOKEN_MISMATCH` に対するクライアント動作:
  - 信頼済みクライアントは、キャッシュ済みのデバイス単位トークンを使って 1 回だけ境界付き再試行を試みることができます。
  - その再試行が失敗した場合、クライアントは自動再接続ループを停止し、operator の対応ガイダンスを表示する必要があります。
- `AUTH_SCOPE_MISMATCH` は、デバイストークンは認識されたものの、要求されたロール/スコープをカバーしていないことを意味します。
  クライアントはこれを不正なトークンとして提示しないでください。operator に再ペアリングするか、より狭い/広いスコープ契約を承認するよう促してください。

## デバイス ID + ペアリング

- ノードは、キーペアのフィンガープリントから導出された安定したデバイス ID（`device.id`）を含める必要があります。
- Gateway はデバイス + ロールごとにトークンを発行します。
- local 自動承認が有効でない限り、新しいデバイス ID にはペアリング承認が必要です。
- ペアリング自動承認は、直接の local loopback connect を中心にしています。
- OpenClaw には、信頼済み共有シークレットのヘルパーフロー用に、狭い backend/container-local の自己 connect パスもあります。
- 同一ホストの tailnet または LAN connect もペアリングでは remote として扱われ、承認が必要です。
- WS クライアントは通常、`connect` 中に `device` ID を含めます（operator +
  ノード）。device なし operator の例外は、明示的な信頼パスに限られます:
  - localhost 専用の insecure HTTP 互換性のための `gateway.controlUi.allowInsecureAuth=true`。
  - 成功した `gateway.auth.mode: "trusted-proxy"` operator Control UI 認証。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（break-glass、深刻なセキュリティ低下）。
  - 予約済み内部ヘルパーパス上の direct-loopback `gateway-client` backend RPC。
- device ID を省略するとスコープ上の影響があります。明示的な信頼パスを通じて device なし operator
  接続が許可された場合でも、OpenClaw は、そのパスに名前付きのスコープ保持例外がない限り、自己宣言スコープを空セットにクリアします。
  スコープで制限されたメソッドはその後 `missing scope` で失敗します。
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` は Control UI の
  break-glass スコープ保持パスです。任意のカスタム backend または CLI 形状の WebSocket クライアントにスコープを付与するものではありません。
- 予約済みの direct-loopback `gateway-client` backend ヘルパーパスは、
  内部 local control-plane RPC に対してのみスコープを保持します。カスタム backend ID はこの例外を受け取りません。
- すべての接続は、サーバーが提供する `connect.challenge` nonce に署名する必要があります。

### デバイス認証移行診断

challenge 以前の署名動作をまだ使用しているレガシークライアントに対して、`connect` は現在、
`error.details.code` の下に `DEVICE_AUTH_*` 詳細コードと、安定した `error.details.reason` を返します。

一般的な移行失敗:

| メッセージ                     | details.code                     | details.reason           | 意味                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | クライアントが `device.nonce` を省略した（または空で送信した）。     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | クライアントが古い/誤った nonce で署名した。            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 署名ペイロードが v2 ペイロードと一致しない。       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 署名済みタイムスタンプが許容 skew の範囲外です。          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` が公開鍵フィンガープリントと一致しない。 |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開鍵形式/正規化に失敗した。         |

移行先:

- 必ず `connect.challenge` を待機します。
- サーバー nonce を含む v2 ペイロードに署名します。
- 同じ nonce を `connect.params.device.nonce` で送信します。
- 推奨される署名ペイロードは `v3` で、device/client/role/scopes/token/nonce フィールドに加えて
  `platform` と `deviceFamily` をバインドします。
- レガシー `v2` 署名は互換性のため引き続き受け入れられますが、ペアリング済みデバイスの
  メタデータピン留めが再接続時のコマンドポリシーを引き続き制御します。

## TLS + ピン留め

- WS 接続では TLS がサポートされます。
- クライアントは任意で gateway 証明書フィンガープリントをピン留めできます（`gateway.tls`
  config と `gateway.remote.tlsFingerprint` または CLI `--tls-fingerprint` を参照）。

## スコープ

このプロトコルは **完全な gateway API**（status、channels、models、chat、
agent、sessions、nodes、approvals など）を公開します。正確な surface は
`packages/gateway-protocol/src/schema.ts` の TypeBox スキーマで定義されています。

## 関連

- [ブリッジプロトコル](/ja-JP/gateway/bridge-protocol)
- [Gateway runbook](/ja-JP/gateway)
