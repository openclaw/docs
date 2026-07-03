---
read_when:
    - Gateway WS クライアントの実装または更新
    - プロトコル不一致または接続失敗のデバッグ
    - プロトコルスキーマ/モデルを再生成
summary: 'Gateway WebSocket プロトコル: ハンドシェイク、フレーム、バージョン管理'
title: Gateway プロトコル
x-i18n:
    generated_at: "2026-07-03T13:16:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 815ac729824587579d112d665df2060d84d2894b4d46235e210804ca8a07082d
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS プロトコルは、OpenClaw の**単一の制御プレーン + ノードトランスポート**です。すべてのクライアント（CLI、Web UI、macOS アプリ、iOS/Android ノード、ヘッドレスノード）は WebSocket 経由で接続し、ハンドシェイク時に自身の**ロール** + **スコープ**を宣言します。

## トランスポート

- WebSocket、JSON ペイロードを含むテキストフレーム。
- 最初のフレームは `connect` リクエストで**なければなりません**。
- 接続前フレームは 64 KiB に制限されます。ハンドシェイクが成功した後、クライアントは `hello-ok.policy.maxPayload` と `hello-ok.policy.maxBufferedBytes` の制限に従う必要があります。診断が有効な場合、過大な受信フレームと遅い送信バッファーは、Gateway が該当フレームを閉じるか破棄する前に `payload.large` イベントを発行します。これらのイベントは、サイズ、制限、サーフェス、安全な理由コードを保持します。メッセージ本文、添付コンテンツ、生フレーム本文、トークン、Cookie、シークレット値は保持しません。

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

Gateway がまだ起動サイドカーの完了中の場合、`connect` リクエストは再試行可能な `UNAVAILABLE` エラーを返すことがあります。このとき `details.reason` は `"startup-sidecars"` に設定され、`retryAfterMs` が含まれます。クライアントは、これを終端的なハンドシェイク失敗として表示するのではなく、全体の接続予算内でそのレスポンスを再試行する必要があります。

`server`、`features`、`snapshot`、`policy` はすべてスキーマ（`packages/gateway-protocol/src/schema/frames.ts`）で必須です。`auth` も必須で、ネゴシエートされたロール/スコープを報告します。`pluginSurfaceUrls` は任意で、`canvas` などの Plugin サーフェス名を、スコープ付きのホスト URL にマッピングします。

スコープ付き Plugin サーフェス URL は期限切れになる場合があります。ノードは `node.pluginSurface.refresh` を `{ "surface": "canvas" }` とともに呼び出し、`pluginSurfaceUrls` に新しいエントリを受け取ることができます。実験的な Canvas Plugin リファクターは、非推奨の `canvasHostUrl`、`canvasCapability`、または `node.canvas.capability.refresh` 互換パスをサポートしません。現在のネイティブクライアントと Gateway は Plugin サーフェスを使用する必要があります。

デバイストークンが発行されない場合、`hello-ok.auth` はトークンフィールドなしで、ネゴシエートされた権限を報告します。

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

信頼済みの同一プロセスバックエンドクライアント（`client.id: "gateway-client"`、`client.mode: "backend"`）は、共有 Gateway トークン/パスワードで認証する場合、直接ループバック接続で `device` を省略できます。このパスは内部制御プレーン RPC 用に予約されており、古い CLI/デバイスペアリングのベースラインが、サブエージェントセッション更新などのローカルバックエンド作業を妨げないようにします。リモートクライアント、ブラウザーオリジンのクライアント、ノードクライアント、明示的なデバイストークン/デバイス ID クライアントは、引き続き通常のペアリングとスコープアップグレードチェックを使用します。

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

組み込み QR/セットアップコードブートストラップは、新しいモバイル引き渡しパスです。ベースラインセットアップコード接続に成功すると、プライマリノードトークンに加えて、範囲が限定されたオペレータートークンが 1 つ返されます。

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

QR オンボーディングが、ペアリング変更スコープや `operator.admin` を付与せずに、モバイルオペレーターループを開始してネイティブセットアップを完了できるよう、オペレーター引き渡しは意図的に制限されています。ネイティブクライアントがブートストラップ後に必要な Talk 設定を読み取れるよう、`operator.talk.secrets` が含まれます。より広範なペアリングと管理者アクセスには、別途承認済みのオペレーターペアリングまたはトークンフローが必要です。クライアントは、`wss://` やループバック/local pairing などの信頼済みトランスポートでブートストラップ認証を使用して接続した場合にのみ、`hello-ok.auth.deviceTokens` を永続化する必要があります。

### Node の例

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

副作用のあるメソッドには**冪等性キー**が必要です（スキーマを参照）。

## ロール + スコープ

完全なオペレータースコープモデル、承認時チェック、共有シークレットのセマンティクスについては、[オペレータースコープ](/ja-JP/gateway/operator-scopes)を参照してください。

### ロール

- `operator` = 制御プレーンクライアント（CLI/UI/自動化）。
- `node` = ケイパビリティホスト（camera/screen/canvas/system.run）。

### スコープ（operator）

一般的なスコープ:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` を指定した `talk.config` には、`operator.talk.secrets`（または `operator.admin`）が必要です。
シークレットが含まれる場合、クライアントは有効な Talk プロバイダー認証情報を `talk.resolved.config.apiKey` から読み取る必要があります。`talk.providers.<id>.apiKey` はソース形状のままであり、SecretRef オブジェクトまたは墨消し済み文字列の場合があります。

Plugin 登録済み Gateway RPC メソッドは独自のオペレータースコープを要求できますが、予約済みのコア管理プレフィックス（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は常に `operator.admin` に解決されます。

メソッドスコープは最初のゲートにすぎません。`chat.send` 経由で到達する一部のスラッシュコマンドは、その上により厳格なコマンドレベルのチェックを適用します。たとえば、永続的な `/config set` と `/config unset` の書き込みには `operator.admin` が必要です。

`node.pair.approve` には、基本メソッドスコープに加えて、承認時の追加スコープチェックもあります。

- コマンドなしのリクエスト: `operator.pairing`
- exec 以外のノードコマンドを含むリクエスト: `operator.pairing` + `operator.write`
- `system.run`、`system.run.prepare`、または `system.which` を含むリクエスト: `operator.pairing` + `operator.admin`

### ケイパビリティ/コマンド/権限（node）

ノードは接続時にケイパビリティの主張を宣言します。

- `caps`: `camera`、`canvas`、`screen`、`location`、`voice`、`talk` などの高レベルケイパビリティカテゴリ。
- `commands`: invoke 用のコマンド許可リスト。
- `permissions`: 粒度の細かいトグル（例: `screen.record`、`camera.capture`）。

Gateway はこれらを**主張**として扱い、サーバー側の許可リストを強制します。

## プレゼンス

- `system-presence` は、デバイス ID をキーにしたエントリを返します。
- プレゼンスエントリには `deviceId`、`roles`、`scopes` が含まれるため、UI は同じデバイスが**オペレーター**と**ノード**の両方として接続している場合でも、デバイスごとに単一の行を表示できます。
- `node.list` には任意の `lastSeenAtMs` と `lastSeenReason` フィールドが含まれます。接続中のノードは、現在の接続時刻を理由 `connect` の `lastSeenAtMs` として報告します。ペアリング済みノードは、信頼済みノードイベントがペアリングメタデータを更新した場合、永続的なバックグラウンドプレゼンスも報告できます。

### ノードのバックグラウンド生存イベント

ノードは `node.event` を `event: "node.presence.alive"` とともに呼び出し、ペアリング済みノードがバックグラウンドウェイク中に生存していたことを、接続中としてマークせずに記録できます。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` は閉じた列挙型です: `background`、`silent_push`、`bg_app_refresh`、`significant_location`、`manual`、または `connect`。未知のトリガー文字列は、永続化の前に Gateway によって `background` に正規化されます。このイベントは、認証済みノードデバイスセッションでのみ永続的です。デバイスなしまたは未ペアリングのセッションは `handled: false` を返します。

成功した Gateway は構造化された結果を返します。

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

古い Gateway は `node.event` に対してまだ `{ "ok": true }` を返す場合があります。クライアントはそれを永続的なプレゼンス永続化ではなく、承認された RPC として扱う必要があります。

## ブロードキャストイベントのスコープ設定

サーバーからプッシュされる WebSocket ブロードキャストイベントは、ペアリングスコープ付きセッションやノード専用セッションがセッションコンテンツを受動的に受信しないよう、スコープでゲートされます。

- **チャット、エージェント、ツール結果フレーム**（ストリーミングされた `agent` イベントとツール呼び出し結果を含む）には、少なくとも `operator.read` が必要です。`operator.read` のないセッションは、これらのフレームを完全にスキップします。
- **Plugin 定義の `plugin.*` ブロードキャスト**は、Plugin が登録した方法に応じて `operator.write` または `operator.admin` にゲートされます。
- **ステータスとトランスポートイベント**（`heartbeat`、`presence`、`tick`、接続/切断ライフサイクルなど）は、トランスポート健全性をすべての認証済みセッションで観測できるよう、制限なしのままです。
- **未知のブロードキャストイベントファミリー**は、登録済みハンドラーが明示的に緩和しない限り、デフォルトでスコープゲートされます（フェイルクローズ）。

各クライアント接続は独自のクライアントごとのシーケンス番号を保持するため、異なるクライアントがイベントストリームの異なるスコープフィルター済みサブセットを見る場合でも、そのソケット上ではブロードキャストの単調順序が保持されます。

## 一般的な RPC メソッドファミリー

公開 WS サーフェスは、上記のハンドシェイク/認証の例よりも広範です。これは生成されたダンプではありません。`hello-ok.features.methods` は、`src/gateway/server-methods-list.ts` に読み込まれた Plugin/チャネルメソッドエクスポートを加えて構築される保守的なディスカバリーリストです。`src/gateway/server-methods/*.ts` の完全な列挙ではなく、機能ディスカバリーとして扱ってください。

  <AccordionGroup>
  <Accordion title="システムとアイデンティティ">
    - `health` は、キャッシュ済みまたは新たにプローブされた Gateway ヘルススナップショットを返します。
    - `diagnostics.stability` は、最近の境界付き診断安定性レコーダーを返します。イベント名、件数、バイトサイズ、メモリ読み取り値、キュー/セッション状態、チャネル/Plugin 名、セッション ID などの運用メタデータを保持します。チャット本文、Webhook 本文、ツール出力、生のリクエストまたはレスポンス本文、トークン、Cookie、秘密値は保持しません。オペレーター読み取りスコープが必要です。
    - `status` は、`/status` 形式の Gateway サマリーを返します。機密フィールドは、admin スコープのオペレータークライアントにのみ含まれます。
    - `gateway.identity.get` は、リレーおよびペアリングフローで使用される Gateway デバイスアイデンティティを返します。
    - `system-presence` は、接続中のオペレーター/Node デバイスの現在のプレゼンススナップショットを返します。
    - `system-event` はシステムイベントを追加し、プレゼンスコンテキストを更新/ブロードキャストできます。
    - `last-heartbeat` は、永続化された最新の Heartbeat イベントを返します。
    - `set-heartbeats` は、Gateway 上の Heartbeat 処理を切り替えます。

  </Accordion>

  <Accordion title="モデルと使用量">
    - `models.list` は、ランタイムで許可されたモデルカタログを返します。ピッカー向けサイズの構成済みモデルには `{ "view": "configured" }`（まず `agents.defaults.models`、次に `models.providers.*.models`）を渡し、完全なカタログには `{ "view": "all" }` を渡します。
    - `usage.status` は、プロバイダーの使用量ウィンドウ/残りクォータのサマリーを返します。
    - `usage.cost` は、日付範囲の集計コスト使用量サマリーを返します。
      1 つのエージェントには `agentId` を渡すか、構成済みエージェントを集計するには `agentScope: "all"` を渡します。
    - `doctor.memory.status` は、アクティブなデフォルトエージェントワークスペースのベクターメモリ/キャッシュ済み埋め込みの準備状況を返します。呼び出し元がライブ埋め込みプロバイダー ping を明示的に求める場合にのみ、`{ "probe": true }` または `{ "deep": true }` を渡します。Dreaming 対応クライアントは、Dreaming ストア統計を選択したエージェントワークスペースにスコープするために `{ "agentId": "agent-id" }` も渡せます。`agentId` を省略すると、デフォルトエージェントフォールバックが維持され、構成済み Dreaming ワークスペースが集計されます。
    - `doctor.memory.dreamDiary`、`doctor.memory.backfillDreamDiary`、`doctor.memory.resetDreamDiary`、`doctor.memory.resetGroundedShortTerm`、`doctor.memory.repairDreamingArtifacts`、および `doctor.memory.dedupeDreamDiary` は、選択エージェントの Dreaming ビュー/アクション向けに任意の `{ "agentId": "agent-id" }` パラメーターを受け付けます。`agentId` が省略された場合、構成済みのデフォルトエージェントワークスペースに対して動作します。
    - `doctor.memory.remHarness` は、リモートコントロールプレーンのクライアント向けに、境界付きの読み取り専用 REM ハーネスプレビューを返します。ワークスペースパス、メモリスニペット、レンダリング済みの根拠付き Markdown、深い昇格候補を含む場合があるため、呼び出し元には `operator.read` が必要です。
    - `sessions.usage` は、セッションごとの使用量サマリーを返します。1 つの
      エージェントには `agentId` を渡すか、構成済みエージェントをまとめて一覧表示するには `agentScope: "all"` を渡します。
    - `sessions.usage.timeseries` は、1 つのセッションの時系列使用量を返します。
    - `sessions.usage.logs` は、1 つのセッションの使用ログエントリを返します。

  </Accordion>

  <Accordion title="チャネルとログインヘルパー">
    - `channels.status` は、組み込み + バンドル済みチャネル/Plugin の状態サマリーを返します。
    - `channels.logout` は、チャネルがログアウトをサポートしている場合に、特定のチャネル/アカウントをログアウトします。
    - `web.login.start` は、現在の QR 対応 Web チャネルプロバイダーの QR/Web ログインフローを開始します。
    - `web.login.wait` は、その QR/Web ログインフローの完了を待ち、成功時にチャネルを開始します。
    - `push.test` は、登録済み iOS Node にテスト APNs プッシュを送信します。
    - `voicewake.get` は、保存済みウェイクワードトリガーを返します。
    - `voicewake.set` は、ウェイクワードトリガーを更新し、変更をブロードキャストします。

  </Accordion>

  <Accordion title="メッセージングとログ">
    - `send` は、チャットランナー外でチャネル/アカウント/スレッドを対象に送信するための、直接アウトバウンド配信 RPC です。
    - `logs.tail` は、カーソル/制限および最大バイト制御付きで、構成済み Gateway ファイルログ末尾を返します。

  </Accordion>

  <Accordion title="Talk と TTS">
    - `talk.catalog` は、音声、ストリーミング文字起こし、リアルタイム音声向けの読み取り専用 Talk プロバイダーカタログを返します。正規プロバイダー ID、レジストリエイリアス、ラベル、構成状態、任意のグループレベル `ready` 結果、公開されたモデル/音声 ID、正規モード、トランスポート、ブレイン戦略、リアルタイム音声/機能フラグを含みますが、プロバイダーシークレットの返却やグローバル構成の変更は行いません。現在の Gateway はランタイムプロバイダー選択を適用した後に `ready` を設定します。クライアントは、古い Gateway との互換性のために、これが存在しない場合は未検証として扱う必要があります。
    - `talk.config` は、有効な Talk 構成ペイロードを返します。`includeSecrets` には `operator.talk.secrets`（または `operator.admin`）が必要です。
    - `talk.session.create` は、`realtime/gateway-relay`、`transcription/gateway-relay`、または `stt-tts/managed-room` 向けに Gateway 所有の Talk セッションを作成します。`stt-tts/managed-room` では、`sessionKey` を渡す `operator.write` 呼び出し元は、スコープ付きセッションキー可視性のために `spawnedBy` も渡す必要があります。スコープなしの `sessionKey` 作成と `brain: "direct-tools"` には `operator.admin` が必要です。
    - `talk.session.join` は、管理ルームセッショントークンを検証し、必要に応じて `session.ready` または `session.replaced` イベントを発行し、平文トークンや保存済みトークンハッシュを含めずに、ルーム/セッションメタデータと最近の Talk イベントを返します。
    - `talk.session.appendAudio` は、Gateway 所有のリアルタイムリレーおよび文字起こしセッションに base64 PCM 入力音声を追加します。
    - `talk.session.startTurn`、`talk.session.endTurn`、および `talk.session.cancelTurn` は、状態がクリアされる前に古いターンを拒否しつつ、管理ルームのターンライフサイクルを駆動します。
    - `talk.session.cancelOutput` は、主に Gateway リレーセッションで VAD 制御の割り込みを行うために、アシスタント音声出力を停止します。
    - `talk.session.submitToolResult` は、Gateway 所有のリアルタイムリレーセッションによって発行されたプロバイダーツール呼び出しを完了します。最終結果が後続する場合の暫定ツール出力には `options: { willContinue: true }` を渡し、ツール結果が別のリアルタイムアシスタント応答を開始せずにプロバイダー呼び出しを満たすべき場合は `options: { suppressResponse: true }` を渡します。
    - `talk.session.steer` は、Gateway 所有のエージェント支援 Talk セッションにアクティブ実行の音声制御を送信します。`{ sessionId, text, mode? }` を受け付けます。ここで `mode` は `status`、`steer`、`cancel`、または `followup` です。省略されたモードは、発話テキストから分類されます。
    - `talk.session.close` は、Gateway 所有のリレー、文字起こし、または管理ルームセッションを閉じ、終端 Talk イベントを発行します。
    - `talk.mode` は、WebChat/Control UI クライアント向けに現在の Talk モード状態を設定/ブロードキャストします。
    - `talk.client.create` は、Gateway が構成、認証情報、指示、ツールポリシーを所有したまま、`webrtc` または `provider-websocket` を使用してクライアント所有のリアルタイムプロバイダーセッションを作成します。
    - `talk.client.toolCall` により、クライアント所有のリアルタイムトランスポートは、プロバイダーツール呼び出しを Gateway ポリシーに転送できます。最初にサポートされるツールは `openclaw_agent_consult` です。クライアントは実行 ID を受け取り、プロバイダー固有のツール結果を送信する前に通常のチャットライフサイクルイベントを待ちます。
    - `talk.client.steer` は、クライアント所有のリアルタイムトランスポート向けにアクティブ実行の音声制御を送信します。Gateway は `sessionKey` からアクティブな埋め込み実行を解決し、ステアリングを黙って破棄する代わりに、構造化された受理/拒否結果を返します。
    - `talk.event` は、リアルタイム、文字起こし、STT/TTS、管理ルーム、電話、ミーティングアダプター向けの単一 Talk イベントチャネルです。
    - `talk.speak` は、アクティブな Talk 音声プロバイダーを通じて音声を合成します。
    - `tts.status` は、TTS 有効状態、アクティブプロバイダー、フォールバックプロバイダー、およびプロバイダー構成状態を返します。
    - `tts.providers` は、表示可能な TTS プロバイダーインベントリを返します。
    - `tts.enable` と `tts.disable` は、TTS 設定状態を切り替えます。
    - `tts.setProvider` は、優先 TTS プロバイダーを更新します。
    - `tts.convert` は、単発のテキスト読み上げ変換を実行します。

  </Accordion>

  <Accordion title="シークレット、構成、更新、ウィザード">
    - `secrets.reload` は、アクティブな SecretRef を再解決し、完全に成功した場合にのみランタイムシークレット状態を入れ替えます。
    - `secrets.resolve` は、特定のコマンド/ターゲットセットに対するコマンド対象シークレット割り当てを解決します。
    - `config.get` は、現在の構成スナップショットとハッシュを返します。
    - `config.set` は、検証済みの構成ペイロードを書き込みます。
    - `config.patch` は、部分的な構成更新をマージします。破壊的な配列
      置換には、影響を受けるパスを `replacePaths` に含める必要があります。配列エントリ
      配下のネストされた配列は、`agents.list[].skills` のような `[]` パスを使用します。
    - `config.apply` は、完全な構成ペイロードを検証 + 置換します。
    - `config.schema` は、Control UI および CLI ツールで使用されるライブ構成スキーマペイロードを返します。スキーマ、`uiHints`、バージョン、生成メタデータに加え、ランタイムが読み込める場合は Plugin + チャネルスキーマメタデータも含まれます。このスキーマには、UI で使用されるものと同じラベルおよびヘルプテキストから派生したフィールド `title` / `description` メタデータが含まれ、対応するフィールドドキュメントが存在する場合は、ネストされたオブジェクト、ワイルドカード、配列項目、`anyOf` / `oneOf` / `allOf` 合成ブランチも含まれます。
    - `config.schema.lookup` は、1 つの構成パスに対するパススコープのルックアップペイロードを返します。正規化パス、浅いスキーマノード、一致したヒント + `hintPath`、任意の `reloadKind`、および UI/CLI ドリルダウン用の直下の子サマリーを含みます。`reloadKind` は `restart`、`hot`、または `none` のいずれかで、要求されたパスに対する Gateway 構成リロードプランナーを反映します。ルックアップスキーマノードは、ユーザー向けドキュメントと共通の検証フィールド（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、数値/文字列/配列/オブジェクトの境界、および `additionalProperties`、`deprecated`、`readOnly`、`writeOnly` などのフラグ）を保持します。子サマリーは、`key`、正規化された `path`、`type`、`required`、`hasChildren`、任意の `reloadKind`、および一致した `hint` / `hintPath` を公開します。
    - `update.run` は Gateway 更新フローを実行し、更新自体が成功した場合にのみ再起動をスケジュールします。セッションを持つ呼び出し元は `continuationMessage` を含めることができ、起動時に再起動継続キューを通じて 1 回の後続エージェントターンを再開できます。コントロールプレーンからのパッケージマネージャー更新および監督付き git チェックアウト更新は、ライブ Gateway 内でパッケージツリーを置換したりチェックアウト/ビルド出力を変更したりする代わりに、切り離された管理サービスへの引き渡しを使用します。開始された引き渡しは `ok: true`、`result.reason: "managed-service-handoff-started"`、および `handoff.status: "started"` を返します。利用不可または失敗した引き渡しは `ok: false`、`managed-service-handoff-unavailable` または `managed-service-handoff-failed`、さらに手動シェル更新が必要な場合は `handoff.command` を返します。引き渡しが利用不可とは、OpenClaw に systemd の `OPENCLAW_SYSTEMD_UNIT` など、安全なスーパーバイザー境界または永続的なサービスアイデンティティがないことを意味します。開始された引き渡し中、再起動センチネルは一時的に `stats.reason: "restart-health-pending"` を報告する場合があります。CLI が再起動後の Gateway を検証し、最終的な `ok` センチネルを書き込むまで、継続は遅延されます。
    - `update.status` は、利用可能な場合は再起動後に実行中のバージョンを含め、最新の更新再起動センチネルを更新して返します。
    - `wizard.start`、`wizard.next`、`wizard.status`、および `wizard.cancel` は、オンボーディングウィザードを WS RPC 経由で公開します。

  </Accordion>

  <Accordion title="エージェントとワークスペースのヘルパー">
    - `agents.list` は、有効なモデルとランタイムメタデータを含む、設定済みエージェントエントリを返します。
    - `agents.create`、`agents.update`、`agents.delete` は、エージェントレコードとワークスペース配線を管理します。
    - `agents.files.list`、`agents.files.get`、`agents.files.set` は、エージェントに公開されるブートストラップワークスペースファイルを管理します。
    - `tasks.list`、`tasks.get`、`tasks.cancel` は、Gateway タスク台帳を SDK クライアントとオペレータークライアントに公開します。
    - `artifacts.list`、`artifacts.get`、`artifacts.download` は、明示的な `sessionKey`、`runId`、または `taskId` スコープに対して、トランスクリプト由来のアーティファクト概要とダウンロードを公開します。実行とタスクのクエリは所有セッションをサーバー側で解決し、来歴が一致するトランスクリプトメディアのみを返します。安全でない URL ソースやローカル URL ソースは、サーバー側で取得する代わりにサポート対象外のダウンロードを返します。
    - `environments.list` と `environments.status` は、SDK クライアント向けに、読み取り専用の Gateway ローカルおよびノード環境検出を公開します。
    - `agent.identity.get` は、エージェントまたはセッションに対する有効なアシスタント ID を返します。
    - `agent.wait` は実行の完了を待機し、利用可能な場合は終端スナップショットを返します。

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
    - `sessions.abort` は、セッションのアクティブな作業を中止します。呼び出し元は `key` と任意の `runId` を渡すか、Gateway がセッションに解決できるアクティブな実行については `runId` のみを渡せます。
    - `sessions.patch` は、セッションメタデータ/オーバーライドを更新し、解決済みの正規モデルと有効な `agentRuntime` を報告します。
    - `sessions.reset`、`sessions.delete`、`sessions.compact` は、セッションメンテナンスを実行します。
    - `sessions.get` は、保存済みの完全なセッション行を返します。
    - チャット実行では、引き続き `chat.history`、`chat.send`、`chat.abort`、`chat.inject` を使用します。`chat.history` は UI クライアント向けに表示正規化されます。インラインディレクティブタグは表示テキストから除去され、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）と、漏れた ASCII/全角のモデル制御トークンは除去され、正確な `NO_REPLY` / `no_reply` のような純粋なサイレントトークンのアシスタント行は省略され、過大な行はプレースホルダーに置き換えられる場合があります。
    - `chat.message.get` は、単一の可視トランスクリプトエントリ向けの追加的な範囲制限付き全文メッセージリーダーです。クライアントは `sessionKey`、セッション選択がエージェントスコープの場合は任意の `agentId`、さらに以前に `chat.history` を通じて公開されたトランスクリプト `messageId` を渡します。Gateway は、保存済みエントリがまだ利用可能で過大でない場合、軽量履歴の切り詰め上限なしで、同じ表示正規化済みプロジェクションを返します。
    - `chat.send` は、1 ターンの `fastMode: "auto"` を受け付け、自動カットオフ前に開始されたモデル呼び出しには高速モードを使用し、その後の再試行、フォールバック、ツール結果、または継続呼び出しは高速モードなしで開始します。カットオフのデフォルトは 60 秒で、`agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` によりモデルごとに設定できます。`chat.send` の呼び出し元は、そのリクエストのカットオフを上書きするために 1 ターンの `fastAutoOnSeconds` を渡せます。

  </Accordion>

  <Accordion title="デバイスペアリングとデバイストークン">
    - `device.pair.list` は、保留中および承認済みのペアリング済みデバイスを返します。
    - `device.pair.approve`、`device.pair.reject`、`device.pair.remove` は、デバイスペアリングレコードを管理します。
    - `device.token.rotate` は、承認済みロールと呼び出し元スコープの範囲内で、ペアリング済みデバイストークンをローテーションします。
    - `device.token.revoke` は、承認済みロールと呼び出し元スコープの範囲内で、ペアリング済みデバイストークンを取り消します。

  </Accordion>

  <Accordion title="ノードペアリング、呼び出し、保留中の作業">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove`、`node.pair.verify` は、ノードペアリングとブートストラップ検証を扱います。
    - `node.list` と `node.describe` は、既知/接続済みノードの状態を返します。
    - `node.rename` は、ペアリング済みノードのラベルを更新します。
    - `node.invoke` は、接続済みノードにコマンドを転送します。
    - `node.invoke.result` は、呼び出しリクエストの結果を返します。
    - `node.event` は、ノード発のイベントを gateway に戻します。
    - `node.pending.pull` と `node.pending.ack` は、接続済みノードのキュー API です。
    - `node.pending.enqueue` と `node.pending.drain` は、オフライン/切断済みノード向けの永続的な保留作業を管理します。

  </Accordion>

  <Accordion title="承認ファミリー">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list`、`exec.approval.resolve` は、ワンショットの exec 承認リクエストと、保留中承認の検索/再生を扱います。
    - `exec.approval.waitDecision` は、保留中の 1 つの exec 承認を待機し、最終決定（またはタイムアウト時は `null`）を返します。
    - `exec.approvals.get` と `exec.approvals.set` は、Gateway exec 承認ポリシースナップショットを管理します。
    - `exec.approvals.node.get` と `exec.approvals.node.set` は、ノードリレーコマンドを介してノードローカルの exec 承認ポリシーを管理します。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision`、`plugin.approval.resolve` は、Plugin 定義の承認フローを扱います。

  </Accordion>

  <Accordion title="自動化、Skills、ツール">
    - 自動化: `wake` は即時または次回 Heartbeat の wake テキスト注入をスケジュールします。`cron.get`、`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` はスケジュール済み作業を管理します。
    - `cron.run` は、手動実行向けのキュー投入型 RPC のままです。完了セマンティクスが必要なクライアントは、返された `runId` を読み取り、`cron.runs` をポーリングする必要があります。
    - `cron.runs` は任意の空でない `runId` フィルターを受け付けるため、クライアントは同じジョブの他の履歴エントリと競合せずに、キューに入った 1 つの手動実行を追跡できます。
    - Skills とツール: `commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。

  </Accordion>
</AccordionGroup>

### 一般的なイベントファミリー

- `chat`: `chat.inject` などの UI チャット更新、およびその他のトランスクリプト専用チャット
  イベント。プロトコル v4 では、デルタペイロードは `deltaText` を保持し、`message` は累積された
  アシスタントスナップショットのままです。非プレフィックス置換は `replace=true` を設定し、
  `deltaText` を置換テキストとして使用します。
- `session.message`、`session.operation`、`session.tool`: 購読済み
  セッションに対するトランスクリプト、進行中のセッション操作、およびイベントストリーム更新。
- `sessions.changed`: セッションインデックスまたはメタデータが変更されました。
- `presence`: システムプレゼンススナップショット更新。
- `tick`: 定期的な keepalive / liveness イベント。
- `health`: gateway ヘルススナップショット更新。
- `heartbeat`: Heartbeat イベントストリーム更新。
- `cron`: cron 実行/ジョブ変更イベント。
- `shutdown`: gateway シャットダウン通知。
- `node.pair.requested` / `node.pair.resolved`: ノードペアリングのライフサイクル。
- `node.invoke.request`: ノード呼び出しリクエストのブロードキャスト。
- `device.pair.requested` / `device.pair.resolved`: ペアリング済みデバイスのライフサイクル。
- `voicewake.changed`: ウェイクワードトリガー設定が変更されました。
- `exec.approval.requested` / `exec.approval.resolved`: exec 承認
  ライフサイクル。
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin 承認
  ライフサイクル。

### ノードヘルパーメソッド

- ノードは `skills.bins` を呼び出して、自動許可チェック向けの現在のスキル実行可能ファイル一覧を
  取得できます。

### タスク台帳 RPC

オペレータークライアントは、タスク台帳 RPC を通じて Gateway バックグラウンドタスクレコードを
検査およびキャンセルできます。これらのメソッドは、生のランタイム状態ではなく、サニタイズ済みのタスク概要を返します。

- `tasks.list` には `operator.read` が必要です。
  - パラメーター: 任意の `status`（`"queued"`、`"running"`、`"completed"`、
    `"failed"`、`"cancelled"`、または `"timed_out"`）またはそれらのステータス配列、
    任意の `agentId`、任意の `sessionKey`、`1` から
    `500` までの任意の `limit`、および任意の文字列 `cursor`。
  - 結果: `{ "tasks": TaskSummary[], "nextCursor"?: string }`。
- `tasks.get` には `operator.read` が必要です。
  - パラメーター: `{ "taskId": string }`。
  - 結果: `{ "task": TaskSummary }`。
  - 存在しないタスク ID は、Gateway の not-found エラー形状を返します。
- `tasks.cancel` には `operator.write` が必要です。
  - パラメーター: `{ "taskId": string, "reason"?: string }`。
  - 結果:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`。
  - `found` は、台帳に一致するタスクがあったかどうかを報告します。`cancelled`
    は、ランタイムがキャンセルを受け入れたか、または記録したかを報告します。

`TaskSummary` には、`id`、`status`、および `kind`、
`runtime`、`title`、`agentId`、`sessionKey`、`childSessionKey`、`ownerKey`、
`runId`、`taskId`、`flowId`、`parentTaskId`、`sourceId`、タイムスタンプ、進捗、
終端概要、サニタイズ済みエラーテキストなどの任意メタデータが含まれます。`agentId` はタスクを
実行しているエージェントを識別します。`sessionKey` と `ownerKey` は、リクエスト元と制御
コンテキストを保持します。

### オペレーターヘルパーメソッド

- オペレーターは `commands.list`（`operator.read`）を呼び出して、エージェントのランタイム
  コマンドインベントリを取得できます。
  - `agentId` は任意です。デフォルトのエージェントワークスペースを読み取るには省略します。
  - `scope` は、主 `name` が対象にするサーフェスを制御します。
    - `text` は、先頭の `/` を含まない主テキストコマンドトークンを返します
    - `native` とデフォルトの `both` パスは、利用可能な場合にプロバイダー対応のネイティブ名を返します
  - `textAliases` は、`/model` や `/m` などの正確なスラッシュエイリアスを保持します。
  - `nativeName` は、存在する場合にプロバイダー対応のネイティブコマンド名を保持します。
  - `provider` は任意で、ネイティブ命名とネイティブプラグインコマンドの可用性にのみ影響します。
  - `includeArgs=false` は、シリアライズされた引数メタデータをレスポンスから省略します。
- オペレーターは `tools.catalog`（`operator.read`）を呼び出して、エージェントのランタイムツールカタログを取得できます。レスポンスには、グループ化されたツールと来歴メタデータが含まれます。
  - `source`: `core` または `plugin`
  - `pluginId`: `source="plugin"` の場合のプラグイン所有者
  - `optional`: プラグインツールが任意かどうか
- オペレーターは `tools.effective`（`operator.read`）を呼び出して、セッションのランタイム有効ツールインベントリを取得できます。
  - `sessionKey` は必須です。
  - Gateway は、呼び出し元が指定した認証コンテキストや配信コンテキストを受け入れる代わりに、セッションから信頼済みランタイムコンテキストをサーバー側で導出します。
  - レスポンスは、アクティブインベントリのセッションスコープかつサーバー導出の投影であり、コア、プラグイン、チャネル、すでに検出済みの MCP サーバーツールを含みます。
  - `tools.effective` は MCP に対して読み取り専用です。ウォームなセッション MCP カタログを最終ツールポリシー経由で投影する場合がありますが、MCP ランタイムの作成、トランスポート接続、`tools/list` の発行は行いません。一致するウォームカタログが存在しない場合、レスポンスには `mcp-not-yet-connected`、`mcp-not-yet-listed`、`mcp-stale-catalog` などの通知が含まれることがあります。
  - 有効ツールエントリは、`source="core"`、`source="plugin"`、`source="channel"`、または
    `source="mcp"` を使用します。
- オペレーターは `tools.invoke`（`operator.write`）を呼び出して、`/tools/invoke` と同じ Gateway ポリシーパスを通じて、利用可能なツールを 1 つ呼び出せます。
  - `name` は必須です。`args`、`sessionKey`、`agentId`、`confirm`、および
    `idempotencyKey` は任意です。
  - `sessionKey` と `agentId` の両方が存在する場合、解決されたセッションエージェントは
    `agentId` と一致する必要があります。
  - `cron`、`gateway`、`nodes` などの所有者専用コアラッパーは、`tools.invoke`
    メソッド自体が `operator.write` であっても、所有者/管理者 ID（`operator.admin`）を必要とします。
  - レスポンスは SDK 向けのエンベロープで、`ok`、`toolName`、任意の `output`、および型付き
    `error` フィールドを含みます。承認またはポリシー拒否は、Gateway ツールポリシーパイプラインを迂回するのではなく、ペイロード内で `ok:false` を返します。
- オペレーターは `skills.status`（`operator.read`）を呼び出して、エージェントの可視
  Skills インベントリを取得できます。
  - `agentId` は任意です。デフォルトのエージェントワークスペースを読み取るには省略します。
  - レスポンスには、適格性、不足している要件、設定チェック、および
    生のシークレット値を公開しないサニタイズ済みインストールオプションが含まれます。
- オペレーターは `skills.search` と `skills.detail`（`operator.read`）を呼び出して、
  ClawHub 検出メタデータを取得できます。
- オペレーターは `skills.upload.begin`、`skills.upload.chunk`、および
  `skills.upload.commit`（`operator.admin`）を呼び出して、インストール前に非公開 Skills アーカイブをステージングできます。これは信頼済みクライアント向けの別個の管理者アップロードパスであり、通常の ClawHub Skills インストールフローではありません。また、`skills.install.allowUploadedArchives` が有効でない限り、デフォルトでは無効です。
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    は、その slug と force 値に紐づくアップロードを作成します。
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` は、正確なデコード済みオフセット位置にバイトを追加します。
  - `skills.upload.commit({ uploadId, sha256? })` は、最終サイズと SHA-256 を検証します。コミットはアップロードを確定するだけで、Skills はインストールしません。
  - アップロードされた Skills アーカイブは、ルートに `SKILL.md` を含む zip アーカイブです。アーカイブ内部のディレクトリ名がインストール先を選択することはありません。
- オペレーターは `skills.install`（`operator.admin`）を 3 つのモードで呼び出せます。
  - ClawHub モード: `{ source: "clawhub", slug, version?, force? }` は、Skills フォルダーをデフォルトのエージェントワークスペースの `skills/` ディレクトリにインストールします。
  - アップロードモード: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    は、コミット済みアップロードをデフォルトのエージェントワークスペースの `skills/<slug>`
    ディレクトリにインストールします。slug と force 値は、元の
    `skills.upload.begin` リクエストと一致する必要があります。このモードは
    `skills.install.allowUploadedArchives` が有効でない限り拒否されます。この設定は
    ClawHub インストールには影響しません。
  - Gateway インストーラーモード: `{ name, installId, timeoutMs? }`
    は、Gateway ホスト上で宣言済みの `metadata.openclaw.install` アクションを実行します。
    古いクライアントは引き続き `dangerouslyForceUnsafeInstall` を送信する場合があります。このフィールドは非推奨で、プロトコル互換性のためにのみ受け入れられ、無視されます。オペレーター所有のインストール判断には
    `security.installPolicy` を使用してください。
- オペレーターは `skills.update`（`operator.admin`）を 2 つのモードで呼び出せます。
  - ClawHub モードは、デフォルトのエージェントワークスペース内で、追跡中の 1 つの slug または追跡中のすべての ClawHub インストールを更新します。
  - 設定モードは、`enabled`、`apiKey`、`env` などの `skills.entries.<skillKey>` 値にパッチを適用します。

### `models.list` ビュー

`models.list` は任意の `view` パラメーターを受け入れます。

- 省略または `"default"`: 現在のランタイム動作です。`agents.defaults.models` が設定されている場合、レスポンスは許可済みカタログになり、`provider/*` エントリに対して動的に検出されたモデルも含みます。それ以外の場合、レスポンスは完全な Gateway カタログです。
- `"configured"`: ピッカー向けサイズの動作です。`agents.defaults.models` が設定されている場合は、`provider/*` エントリに対するプロバイダースコープの検出を含め、引き続きそれが優先されます。許可リストがない場合、レスポンスは明示的な `models.providers.*.models` エントリを使用し、設定済みモデル行が存在しない場合にのみ完全なカタログへフォールバックします。
- `"all"`: 完全な Gateway カタログで、`agents.defaults.models` を迂回します。通常のモデルピッカーではなく、診断および検出 UI に使用してください。

## Exec 承認

- exec リクエストに承認が必要な場合、Gateway は `exec.approval.requested` をブロードキャストします。
- オペレータークライアントは `exec.approval.resolve` を呼び出して解決します（`operator.approvals` スコープが必要）。
- `host=node` の場合、`exec.approval.request` は `systemRunPlan`（正規の `argv`/`cwd`/`rawCommand`/セッションメタデータ）を含む必要があります。`systemRunPlan` がないリクエストは拒否されます。
- 承認後、転送された `node.invoke system.run` 呼び出しは、その正規の
  `systemRunPlan` を権威あるコマンド/cwd/セッションコンテキストとして再利用します。
- 呼び出し元が prepare と最終承認済みの `system.run` 転送の間に `command`、`rawCommand`、`cwd`、`agentId`、または
  `sessionKey` を変更した場合、Gateway は変更されたペイロードを信頼せず、実行を拒否します。

## Agent 配信フォールバック

- `agent` リクエストは、アウトバウンド配信を要求するために `deliver=true` を含めることができます。
- `bestEffortDeliver=false` は厳格な動作を維持します。解決不能または内部専用の配信対象は `INVALID_REQUEST` を返します。
- `bestEffortDeliver=true` は、外部に配信可能なルートを解決できない場合に、セッションのみの実行へのフォールバックを許可します（たとえば、内部/webchat セッションや曖昧なマルチチャネル設定）。
- 最終的な `agent` 結果には、配信が要求された場合に `result.deliveryStatus` が含まれることがあります。これは、[`openclaw agent --json --deliver`](/ja-JP/cli/agent#json-delivery-status) で文書化されているものと同じ `sent`、`suppressed`、`partial_failed`、`failed`
  ステータスを使用します。

## バージョニング

- `PROTOCOL_VERSION` は `packages/gateway-protocol/src/version.ts` にあります。
- クライアントは `minProtocol` + `maxProtocol` を送信します。サーバーは、現在のプロトコルを含まない範囲を拒否します。現在のクライアントとサーバーは protocol v4 を必要とします。
- スキーマ + モデルは TypeBox 定義から生成されます。
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### クライアント定数

`src/gateway/client.ts` のリファレンスクライアントは、これらのデフォルトを使用します。値は
protocol v4 全体で安定しており、サードパーティクライアントに期待されるベースラインです。

| 定数                                      | デフォルト                                          | ソース                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| リクエストタイムアウト（RPC ごと）        | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| 事前認証 / 接続チャレンジタイムアウト     | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts`（config/env はペアのサーバー/クライアント予算を引き上げ可能） |
| 初期再接続バックオフ                      | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| 最大再接続バックオフ                      | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| デバイストークンクローズ後の高速リトライクランプ | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` 前の強制停止猶予            | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` デフォルトタイムアウト     | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| デフォルト tick 間隔（`hello-ok` 前）      | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| tick タイムアウトクローズ                 | 無通信が `tickIntervalMs * 2` を超えた場合は code `4000` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

サーバーは有効な `policy.tickIntervalMs`、`policy.maxPayload`、
`policy.maxBufferedBytes` を `hello-ok` で通知します。クライアントは、ハンドシェイク前のデフォルトではなく、それらの値に従う必要があります。

## 認証

- 共有シークレットの Gateway 認証は、構成された認証モードに応じて `connect.params.auth.token` または
  `connect.params.auth.password` を使用します。
- Tailscale Serve
  (`gateway.auth.allowTailscale: true`) や非ループバックの
  `gateway.auth.mode: "trusted-proxy"` などの ID を持つモードは、`connect.params.auth.*` ではなく
  リクエストヘッダーから接続認証チェックを満たします。
- プライベートイングレスの `gateway.auth.mode: "none"` は、共有シークレットの接続認証を
  完全にスキップします。このモードを公開または信頼できないイングレスに公開しないでください。
- ペアリング後、Gateway は接続のロール + スコープに限定された **デバイストークン** を発行します。
  これは `hello-ok.auth.deviceToken` で返され、クライアントは今後の接続のために
  永続化する必要があります。
- クライアントは、成功した接続の後にプライマリ `hello-ok.auth.deviceToken` を永続化する必要があります。
- その **保存済み** デバイストークンで再接続する場合は、そのトークンに対して保存済みの
  承認済みスコープセットも再利用する必要があります。これにより、すでに付与された read/probe/status アクセスが
  維持され、再接続がより狭い暗黙の管理者専用スコープへ静かに縮小されることを避けられます。
- クライアント側の接続認証組み立て (`src/gateway/client.ts` の `selectConnectAuth`):
  - `auth.password` は直交しており、設定されている場合は常に転送されます。
  - `auth.token` は優先順で設定されます。明示的な共有トークンが最優先で、
    次に明示的な `deviceToken`、その次に保存済みのデバイス別トークン (`deviceId` + `role` でキー付け) です。
  - `auth.bootstrapToken` は、上記のいずれも `auth.token` に解決されなかった場合にのみ送信されます。
    共有トークンまたは解決済みのデバイストークンがあれば送信は抑制されます。
  - ワンショットの
    `AUTH_TOKEN_MISMATCH` 再試行で保存済みデバイストークンを自動昇格する処理は、
    **信頼済みエンドポイントのみ** に制限されます。つまり、ループバック、または固定された `tlsFingerprint` を持つ
    `wss://` です。ピン留めのない公開 `wss://` は該当しません。
- 組み込みのセットアップコードブートストラップは、プライマリノードの
  `hello-ok.auth.deviceToken` に加えて、信頼済みモバイル引き継ぎ用の制限付きオペレータートークンを
  `hello-ok.auth.deviceTokens` で返します。オペレータートークンにはネイティブ Talk 構成の読み取り用に
  `operator.talk.secrets` が含まれますが、ペアリング変更スコープと `operator.admin` は除外されます。
- 非ベースラインのセットアップコードブートストラップが承認待ちの間、`PAIRING_REQUIRED`
  の詳細には `recommendedNextStep: "wait_then_retry"`、`retryable: true`、
  `pauseReconnect: false` が含まれます。クライアントは、リクエストが承認されるかトークンが無効になるまで、
  同じブートストラップトークンで再接続を続ける必要があります。
- `hello-ok.auth.deviceTokens` は、`wss://` やループバック/local ペアリングなどの信頼済みトランスポートで
  ブートストラップ認証を使用して接続した場合にのみ永続化してください。
- クライアントが **明示的な** `deviceToken` または明示的な `scopes` を指定した場合、
  その呼び出し元が要求したスコープセットが引き続き権威を持ちます。キャッシュされたスコープは、
  クライアントが保存済みのデバイス別トークンを再利用している場合にのみ再利用されます。
- デバイストークンは `device.token.rotate` と
  `device.token.revoke` でローテーションまたは失効できます (`operator.pairing` スコープが必要)。
  ノードまたはその他の非オペレーターロールをローテーションまたは失効するには、`operator.admin` も必要です。
- `device.token.rotate` はローテーションメタデータを返します。置換用のベアラートークンをエコーするのは、
  同じデバイストークンですでに認証済みの同一デバイス呼び出しの場合のみです。これにより、
  トークンのみのクライアントは再接続前に置換トークンを永続化できます。共有または管理者による
  ローテーションではベアラートークンはエコーされません。
- トークンの発行、ローテーション、失効は、そのデバイスのペアリングエントリに記録された承認済みロールセットに
  制限されたままです。トークン変更によって、ペアリング承認で一度も付与されていないデバイスロールへ
  拡張したり、それを対象にしたりすることはできません。
- ペアリング済みデバイストークンセッションでは、呼び出し元が `operator.admin` も持っていない限り、
  デバイス管理は自己スコープに限定されます。非管理者の呼び出し元が管理できるのは、
  **自分自身の** デバイスエントリのオペレータートークンのみです。ノードおよびその他の非オペレータートークン管理は、
  呼び出し元自身のデバイスであっても管理者専用です。
- `device.token.rotate` と `device.token.revoke` は、対象のオペレータートークンのスコープセットも、
  呼び出し元の現在のセッションスコープと照合します。非管理者の呼び出し元は、自分がすでに保持しているよりも
  広いオペレータートークンをローテーションまたは失効できません。
- 認証失敗には `error.details.code` と復旧ヒントが含まれます。
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` に対するクライアントの動作:
  - 信頼済みクライアントは、キャッシュ済みのデバイス別トークンで制限付きの再試行を 1 回試みることができます。
  - その再試行が失敗した場合、クライアントは自動再接続ループを停止し、オペレーター操作のガイダンスを表示する必要があります。
- `AUTH_SCOPE_MISMATCH` は、デバイストークンは認識されたものの、要求されたロール/スコープを
  カバーしていないことを意味します。クライアントはこれを不正なトークンとして表示しないでください。
  オペレーターに再ペアリング、またはより狭い/広いスコープ契約の承認を促してください。

## デバイス ID + ペアリング

- ノードは、キーペアのフィンガープリントから導出された安定したデバイス ID (`device.id`) を
  含める必要があります。
- Gateway はデバイス + ロールごとにトークンを発行します。
- local 自動承認が有効でない限り、新しいデバイス ID にはペアリング承認が必要です。
- ペアリングの自動承認は、直接の local loopback 接続を中心にしています。
- OpenClaw には、信頼済み共有シークレットヘルパーフロー向けの狭いバックエンド/コンテナ local 自己接続パスもあります。
- 同一ホストの tailnet または LAN 接続も、ペアリング上は引き続きリモートとして扱われ、
  承認が必要です。
- WS クライアントは通常、`connect` 中に `device` ID を含めます (オペレーター +
  ノード)。デバイスなしのオペレーター例外は、明示的な信頼パスのみです。
  - localhost 専用の安全でない HTTP 互換性のための `gateway.controlUi.allowInsecureAuth=true`。
  - 成功した `gateway.auth.mode: "trusted-proxy"` オペレーター Control UI 認証。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (緊急用、重大なセキュリティ低下)。
  - 予約済みの内部
    ヘルパーパス上の直接ループバック `gateway-client` バックエンド RPC。
- デバイス ID を省略するとスコープに影響します。デバイスなしのオペレーター接続が
  明示的な信頼パスを通じて許可された場合でも、OpenClaw はそのパスに名前付きの
  スコープ保持例外がない限り、自己宣言スコープを空セットにクリアします。その後、スコープで制限されたメソッドは
  `missing scope` で失敗します。
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` は Control UI の
  緊急用スコープ保持パスです。任意のカスタムバックエンドや CLI 形式の WebSocket クライアントに
  スコープを付与するものではありません。
- 予約済みの直接ループバック `gateway-client` バックエンドヘルパーパスは、
  内部 local コントロールプレーン RPC に対してのみスコープを保持します。カスタムバックエンド ID は
  この例外を受けません。
- すべての接続は、サーバー提供の `connect.challenge` nonce に署名する必要があります。

### デバイス認証移行診断

チャレンジ前の署名動作をまだ使用しているレガシークライアントに対して、`connect` は現在、
安定した `error.details.reason` とともに `error.details.code` の下で
`DEVICE_AUTH_*` 詳細コードを返します。

一般的な移行失敗:

| メッセージ                     | details.code                     | details.reason           | 意味                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | クライアントが `device.nonce` を省略した (または空白を送信した)。     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | クライアントが古い/誤った nonce で署名した。            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 署名ペイロードが v2 ペイロードと一致しない。       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 署名済みタイムスタンプが許容スキューの範囲外。          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` が公開鍵フィンガープリントと一致しない。 |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開鍵の形式/正規化に失敗した。         |

移行先:

- 常に `connect.challenge` を待つ。
- サーバー nonce を含む v2 ペイロードに署名する。
- 同じ nonce を `connect.params.device.nonce` で送信する。
- 推奨される署名ペイロードは `v3` です。これは device/client/role/scopes/token/nonce フィールドに加えて、
  `platform` と `deviceFamily` をバインドします。
- 互換性のためにレガシー `v2` 署名は引き続き受け入れられますが、ペアリング済みデバイスの
  メタデータピン留めは再接続時のコマンドポリシーを引き続き制御します。

## TLS + ピン留め

- TLS は WS 接続でサポートされています。
- クライアントは任意で Gateway 証明書フィンガープリントをピン留めできます (`gateway.tls`
  構成に加え、`gateway.remote.tlsFingerprint` または CLI `--tls-fingerprint` を参照)。

## スコープ

このプロトコルは **完全な Gateway API** (status、channels、models、chat、
agent、sessions、nodes、approvals など) を公開します。正確なサーフェスは
`packages/gateway-protocol/src/schema.ts` の TypeBox スキーマで定義されています。

## 関連

- [Bridge プロトコル](/ja-JP/gateway/bridge-protocol)
- [Gateway ランブック](/ja-JP/gateway)
