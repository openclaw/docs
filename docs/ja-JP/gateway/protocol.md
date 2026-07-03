---
read_when:
    - Gateway WS クライアントの実装または更新
    - デバッグプロトコルの不一致または接続失敗
    - プロトコルスキーマ/モデルの再生成
summary: 'Gateway WebSocket プロトコル: ハンドシェイク、フレーム、バージョニング'
title: Gateway プロトコル
x-i18n:
    generated_at: "2026-07-03T09:23:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b58ef44b15e7359ca919e487bcf94c86601f508500ece000aafd8d1a90fb1cf1
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WSプロトコルは、OpenClawの**単一コントロールプレーン + ノードトランスポート**です。すべてのクライアント（CLI、Web UI、macOSアプリ、iOS/Androidノード、ヘッドレスノード）はWebSocket経由で接続し、ハンドシェイク時に自身の**ロール** + **スコープ**を宣言します。

## トランスポート

- WebSocket、JSONペイロードのテキストフレーム。
- 最初のフレームは**必ず** `connect` リクエストである必要があります。
- 接続前フレームは64 KiBに制限されます。ハンドシェイクが成功した後、クライアントは
  `hello-ok.policy.maxPayload` と
  `hello-ok.policy.maxBufferedBytes` の制限に従う必要があります。診断が有効な場合、
  過大な受信フレームと低速な送信バッファは、gatewayが影響を受けたフレームを閉じるか破棄する前に `payload.large` イベントを発行します。これらのイベントは
  サイズ、制限、サーフェス、安全な理由コードを保持します。メッセージ本文、
  添付コンテンツ、生フレーム本文、トークン、Cookie、シークレット値は保持しません。

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

Gatewayがまだ起動時サイドカーの完了処理中の場合、`connect` リクエストは
`details.reason` が `"startup-sidecars"` に設定され、`retryAfterMs` を含む、再試行可能な `UNAVAILABLE` エラーを返すことがあります。クライアントは、その応答を最終的なハンドシェイク失敗として表示するのではなく、全体の接続予算内で再試行する必要があります。

`server`、`features`、`snapshot`、`policy` はすべてスキーマ
（`packages/gateway-protocol/src/schema/frames.ts`）で必須です。`auth` も必須で、ネゴシエートされたロール/スコープを報告します。`pluginSurfaceUrls` は任意で、`canvas` などのPluginサーフェス名を、スコープ付きホストURLにマップします。

スコープ付きPluginサーフェスURLは期限切れになる場合があります。ノードは
`node.pluginSurface.refresh` を `{ "surface": "canvas" }` で呼び出して、
`pluginSurfaceUrls` 内の新しいエントリを受け取れます。実験的なCanvas Pluginリファクタリングは、非推奨の `canvasHostUrl`、`canvasCapability`、または
`node.canvas.capability.refresh` 互換パスをサポートしません。現在のネイティブクライアントとgatewayはPluginサーフェスを使用する必要があります。

デバイストークンが発行されない場合、`hello-ok.auth` はトークンフィールドなしでネゴシエートされた権限を報告します。

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

信頼された同一プロセスのバックエンドクライアント（`client.id: "gateway-client"`、
`client.mode: "backend"`）は、共有gatewayトークン/パスワードで認証する場合、直接loopback接続で `device` を省略できます。このパスは内部コントロールプレーンRPC用に予約されており、古いCLI/デバイスペアリングベースラインが、サブエージェントセッション更新などのローカルバックエンド作業をブロックしないようにします。リモートクライアント、ブラウザーオリジンのクライアント、ノードクライアント、明示的なデバイストークン/デバイスIDクライアントは、引き続き通常のペアリングとスコープアップグレードチェックを使用します。

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

組み込みのQR/セットアップコードブートストラップは、新しいモバイル引き継ぎパスです。成功したベースラインセットアップコード接続は、プライマリノードトークンに加えて、1つの制限付きオペレータートークンを返します。

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

オペレーター引き継ぎは意図的に制限されているため、QRオンボーディングは
`operator.admin` や `operator.pairing` を付与せずにモバイルオペレーターループを開始できます。
ネイティブクライアントがブートストラップ後に必要なTalk設定を読み取れるように、
`operator.talk.secrets` は含まれます。より広範なadminスコープとペアリングスコープには、別途承認済みのオペレーターペアリングまたはトークンフローが必要です。クライアントは、`wss://` やloopback/localペアリングなどの信頼されたトランスポートでブートストラップ認証を使って接続した場合にのみ、
`hello-ok.auth.deviceTokens` を永続化する必要があります。

### ノード例

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

`includeSecrets: true` を指定した `talk.config` には `operator.talk.secrets`
（または `operator.admin`）が必要です。
シークレットが含まれる場合、クライアントはアクティブなTalkプロバイダー認証情報を
`talk.resolved.config.apiKey` から読み取る必要があります。`talk.providers.<id>.apiKey`
はソース形状のままであり、SecretRefオブジェクトまたはマスクされた文字列の場合があります。

Plugin登録済みのgateway RPCメソッドは独自のオペレータースコープを要求できますが、予約済みのコアadminプレフィックス（`config.*`、`exec.approvals.*`、`wizard.*`、
`update.*`）は常に `operator.admin` に解決されます。

メソッドスコープは最初のゲートにすぎません。`chat.send` 経由で到達する一部のスラッシュコマンドは、その上でさらに厳格なコマンドレベルチェックを適用します。たとえば、永続的な
`/config set` と `/config unset` の書き込みには `operator.admin` が必要です。

`node.pair.approve` には、基本メソッドスコープに加えて、承認時の追加スコープチェックもあります。

- コマンドなしリクエスト: `operator.pairing`
- 非execノードコマンドを含むリクエスト: `operator.pairing` + `operator.write`
- `system.run`、`system.run.prepare`、または `system.which` を含むリクエスト:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions（ノード）

ノードは接続時に機能要求を宣言します。

- `caps`: `camera`、`canvas`、`screen`、
  `location`、`voice`、`talk` などの高レベル機能カテゴリ。
- `commands`: invoke用のコマンド許可リスト。
- `permissions`: 粒度の細かい切り替え（例: `screen.record`、`camera.capture`）。

Gatewayはこれらを**要求**として扱い、サーバー側の許可リストを適用します。

## プレゼンス

- `system-presence` はデバイスIDをキーにしたエントリを返します。
- プレゼンスエントリには `deviceId`、`roles`、`scopes` が含まれるため、UIは同じデバイスが**オペレーター**と**ノード**の両方として接続している場合でも、デバイスごとに1行で表示できます。
- `node.list` には任意の `lastSeenAtMs` と `lastSeenReason` フィールドが含まれます。接続中のノードは、現在の接続時刻を `lastSeenAtMs` として、理由 `connect` とともに報告します。ペアリング済みノードは、信頼されたノードイベントがペアリングメタデータを更新した場合、永続的なバックグラウンドプレゼンスも報告できます。

### ノードバックグラウンドaliveイベント

ノードは `event: "node.presence.alive"` を指定して `node.event` を呼び出し、ペアリング済みノードがバックグラウンドウェイク中に生存していたことを、接続中とマークせずに記録できます。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` は閉じたenumです: `background`、`silent_push`、`bg_app_refresh`、
`significant_location`、`manual`、または `connect`。不明なtrigger文字列は、永続化前にgatewayによって `background` に正規化されます。このイベントは認証済みノードデバイスセッションに対してのみ永続化されます。デバイスなし、または未ペアリングのセッションは `handled: false` を返します。

成功したgatewayは構造化された結果を返します。

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

古いgatewayは `node.event` に対して引き続き `{ "ok": true }` を返す場合があります。クライアントはそれを永続的なプレゼンス永続化ではなく、確認済みRPCとして扱う必要があります。

## ブロードキャストイベントのスコープ設定

サーバーからプッシュされるWebSocketブロードキャストイベントはスコープでゲートされるため、ペアリングスコープのセッションやノード専用セッションがセッションコンテンツを受動的に受信することはありません。

- **チャット、エージェント、ツール結果フレーム**（ストリーミングされた `agent` イベントとツール呼び出し結果を含む）には、少なくとも `operator.read` が必要です。`operator.read` を持たないセッションは、これらのフレームを完全にスキップします。
- **Plugin定義の `plugin.*` ブロードキャスト**は、Pluginがどのように登録したかに応じて、`operator.write` または `operator.admin` にゲートされます。
- **ステータスおよびトランスポートイベント**（`heartbeat`、`presence`、`tick`、接続/切断ライフサイクルなど）は制限されないままなので、すべての認証済みセッションからトランスポートの健全性を観測できます。
- **不明なブロードキャストイベントファミリー**は、登録済みハンドラーが明示的に緩和しない限り、デフォルトでスコープによりゲートされます（fail-closed）。

各クライアント接続は自身のクライアント別シーケンス番号を保持するため、異なるクライアントがイベントストリームの異なるスコープフィルター済みサブセットを見る場合でも、そのソケット上ではブロードキャストの単調順序が維持されます。

## 一般的なRPCメソッドファミリー

公開WSサーフェスは、上記のハンドシェイク/認証例よりも広範です。これは生成されたダンプではありません。`hello-ok.features.methods` は、
`src/gateway/server-methods-list.ts` と読み込まれたPlugin/チャネルメソッドエクスポートから構築された保守的なディスカバリーリストです。`src/gateway/server-methods/*.ts` の完全な列挙ではなく、機能ディスカバリーとして扱ってください。

  <AccordionGroup>
  <Accordion title="システムと ID">
    - `health` は、キャッシュ済みまたは新しくプローブされたGatewayのヘルススナップショットを返します。
    - `diagnostics.stability` は、直近の制限付き診断安定性レコーダーを返します。イベント名、件数、バイトサイズ、メモリ読み取り値、キュー/セッション状態、チャネル/Plugin名、セッション ID などの運用メタデータを保持します。チャット本文、Webhook本文、ツール出力、生のリクエストまたはレスポンス本文、トークン、Cookie、シークレット値は保持しません。オペレーターの読み取りスコープが必要です。
    - `status` は、`/status` 形式のGatewayサマリーを返します。機密フィールドは、管理者スコープのオペレータークライアントにのみ含まれます。
    - `gateway.identity.get` は、リレーとペアリングフローで使用されるGatewayデバイス ID を返します。
    - `system-presence` は、接続済みのオペレーター/ノードデバイスの現在のプレゼンススナップショットを返します。
    - `system-event` は、システムイベントを追加し、プレゼンスコンテキストを更新/ブロードキャストできます。
    - `last-heartbeat` は、最後に永続化されたHeartbeatイベントを返します。
    - `set-heartbeats` は、GatewayでのHeartbeat処理を切り替えます。

  </Accordion>

  <Accordion title="モデルと使用状況">
    - `models.list` は、ランタイムで許可されたモデルカタログを返します。ピッカー向けサイズの構成済みモデル（最初に `agents.defaults.models`、次に `models.providers.*.models`）には `{ "view": "configured" }` を渡し、完全なカタログには `{ "view": "all" }` を渡します。
    - `usage.status` は、プロバイダーの使用状況ウィンドウ/残りクォータのサマリーを返します。
    - `usage.cost` は、日付範囲の集計コスト使用状況サマリーを返します。
      1 つのエージェントには `agentId` を渡し、構成済みエージェントを集計するには `agentScope: "all"` を渡します。
    - `doctor.memory.status` は、アクティブなデフォルトエージェントワークスペースのベクトルメモリ/キャッシュ済み埋め込みの準備状態を返します。呼び出し元がライブ埋め込みプロバイダーへの ping を明示的に求める場合にのみ、`{ "probe": true }` または `{ "deep": true }` を渡します。Dreaming対応クライアントは、Dreamingストア統計を選択したエージェントワークスペースにスコープするために `{ "agentId": "agent-id" }` も渡せます。`agentId` を省略すると、デフォルトエージェントへのフォールバックが維持され、構成済みのDreamingワークスペースが集計されます。
    - `doctor.memory.dreamDiary`、`doctor.memory.backfillDreamDiary`、`doctor.memory.resetDreamDiary`、`doctor.memory.resetGroundedShortTerm`、`doctor.memory.repairDreamingArtifacts`、`doctor.memory.dedupeDreamDiary` は、選択したエージェントのDreamingビュー/アクション用に任意の `{ "agentId": "agent-id" }` パラメーターを受け付けます。`agentId` を省略すると、構成済みのデフォルトエージェントワークスペースで動作します。
    - `doctor.memory.remHarness` は、リモートコントロールプレーンクライアント向けに、制限付きの読み取り専用 REM ハーネスプレビューを返します。ワークスペースパス、メモリスニペット、レンダリング済みの根拠付き Markdown、深い昇格候補を含められるため、呼び出し元には `operator.read` が必要です。
    - `sessions.usage` は、セッションごとの使用状況サマリーを返します。1 つの
      エージェントには `agentId` を渡し、構成済みエージェントをまとめて一覧表示するには `agentScope: "all"` を渡します。
    - `sessions.usage.timeseries` は、1 つのセッションの時系列使用状況を返します。
    - `sessions.usage.logs` は、1 つのセッションの使用状況ログエントリを返します。

  </Accordion>

  <Accordion title="チャネルとログインヘルパー">
    - `channels.status` は、組み込み + バンドル済みチャネル/Pluginのステータスサマリーを返します。
    - `channels.logout` は、チャネルがログアウトをサポートしている場合に、特定のチャネル/アカウントをログアウトします。
    - `web.login.start` は、現在の QR 対応 Web チャネルプロバイダーの QR/Web ログインフローを開始します。
    - `web.login.wait` は、その QR/Web ログインフローの完了を待ち、成功時にチャネルを開始します。
    - `push.test` は、登録済み iOS ノードにテスト APNs プッシュを送信します。
    - `voicewake.get` は、保存済みのウェイクワードトリガーを返します。
    - `voicewake.set` は、ウェイクワードトリガーを更新し、変更をブロードキャストします。

  </Accordion>

  <Accordion title="メッセージングとログ">
    - `send` は、チャットランナー外でチャネル/アカウント/スレッドを対象に送信するための直接アウトバウンド配信 RPC です。
    - `logs.tail` は、構成済みGatewayファイルログの末尾を、カーソル/上限および最大バイト数の制御付きで返します。

  </Accordion>

  <Accordion title="Talkと TTS">
    - `talk.catalog` は、音声、ストリーミング文字起こし、リアルタイム音声向けの読み取り専用Talkプロバイダーカタログを返します。正規プロバイダー ID、レジストリエイリアス、ラベル、構成済み状態、任意のグループレベル `ready` 結果、公開モデル/音声 ID、正規モード、トランスポート、ブレイン戦略、リアルタイム音声/機能フラグを含みますが、プロバイダーシークレットを返したりグローバル構成を変更したりしません。現在のGatewayは、ランタイムプロバイダー選択の適用後に `ready` を設定します。古いGatewayとの互換性のため、クライアントはこれが存在しない場合は未検証として扱う必要があります。
    - `talk.config` は、有効なTalk構成ペイロードを返します。`includeSecrets` には `operator.talk.secrets`（または `operator.admin`）が必要です。
    - `talk.session.create` は、`realtime/gateway-relay`、`transcription/gateway-relay`、または `stt-tts/managed-room` 向けにGateway所有のTalkセッションを作成します。`stt-tts/managed-room` の場合、`sessionKey` を渡す `operator.write` 呼び出し元は、スコープ付きセッションキー可視性のために `spawnedBy` も渡す必要があります。スコープなしの `sessionKey` 作成と `brain: "direct-tools"` には `operator.admin` が必要です。
    - `talk.session.join` は、managed-roomセッショントークンを検証し、必要に応じて `session.ready` または `session.replaced` イベントを発行し、プレーンテキストトークンや保存済みトークンハッシュを含めずにルーム/セッションメタデータと最近のTalkイベントを返します。
    - `talk.session.appendAudio` は、base64 PCM 入力音声をGateway所有のリアルタイムリレーおよび文字起こしセッションに追加します。
    - `talk.session.startTurn`、`talk.session.endTurn`、`talk.session.cancelTurn` は、状態がクリアされる前に古いターンを拒否しながら、managed-roomのターンライフサイクルを駆動します。
    - `talk.session.cancelOutput` は、主にGatewayリレーセッションでの VAD ゲート付き割り込みのために、アシスタント音声出力を停止します。
    - `talk.session.submitToolResult` は、Gateway所有のリアルタイムリレーセッションによって発行されたプロバイダーツール呼び出しを完了します。最終結果が後続する中間ツール出力には `options: { willContinue: true }` を渡し、別のリアルタイムアシスタント応答を開始せずにツール結果でプロバイダー呼び出しを満たす必要がある場合は `options: { suppressResponse: true }` を渡します。
    - `talk.session.steer` は、Gateway所有のエージェント backed Talkセッションにアクティブラン音声制御を送信します。`{ sessionId, text, mode? }` を受け付けます。ここで `mode` は `status`、`steer`、`cancel`、または `followup` です。省略されたモードは発話テキストから分類されます。
    - `talk.session.close` は、Gateway所有のリレー、文字起こし、または managed-roomセッションを閉じ、終端Talkイベントを発行します。
    - `talk.mode` は、WebChat/Control UI クライアント向けに現在のTalkモード状態を設定/ブロードキャストします。
    - `talk.client.create` は、Gatewayが構成、認証情報、指示、ツールポリシーを所有したまま、`webrtc` または `provider-websocket` を使用するクライアント所有のリアルタイムプロバイダーセッションを作成します。
    - `talk.client.toolCall` は、クライアント所有のリアルタイムトランスポートがプロバイダーツール呼び出しをGatewayポリシーへ転送できるようにします。最初にサポートされるツールは `openclaw_agent_consult` です。クライアントは実行 ID を受け取り、プロバイダー固有のツール結果を送信する前に通常のチャットライフサイクルイベントを待ちます。
    - `talk.client.steer` は、クライアント所有のリアルタイムトランスポート向けにアクティブラン音声制御を送信します。Gatewayは `sessionKey` からアクティブな埋め込み実行を解決し、ステアリングを黙って破棄する代わりに、構造化された受理/拒否結果を返します。
    - `talk.event` は、リアルタイム、文字起こし、STT/TTS、managed-room、テレフォニー、会議アダプター向けの単一のTalkイベントチャネルです。
    - `talk.speak` は、アクティブなTalk音声プロバイダーを通じて音声を合成します。
    - `tts.status` は、TTS の有効状態、アクティブプロバイダー、フォールバックプロバイダー、プロバイダー構成状態を返します。
    - `tts.providers` は、可視の TTS プロバイダーインベントリを返します。
    - `tts.enable` と `tts.disable` は、TTS 設定状態を切り替えます。
    - `tts.setProvider` は、優先 TTS プロバイダーを更新します。
    - `tts.convert` は、1 回限りのテキスト読み上げ変換を実行します。

  </Accordion>

  <Accordion title="シークレット、構成、更新、ウィザード">
    - `secrets.reload` は、アクティブな SecretRef を再解決し、完全に成功した場合にのみランタイムシークレット状態を入れ替えます。
    - `secrets.resolve` は、特定のコマンド/ターゲットセットに対するコマンド対象シークレット割り当てを解決します。
    - `config.get` は、現在の構成スナップショットとハッシュを返します。
    - `config.set` は、検証済みの構成ペイロードを書き込みます。
    - `config.patch` は、部分的な構成更新をマージします。破壊的な配列
      置換には、影響を受けるパスを `replacePaths` に含める必要があります。配列エントリ配下のネストされた配列は、`agents.list[].skills` のような `[]` パスを使用します。
    - `config.apply` は、完全な構成ペイロードを検証して置き換えます。
    - `config.schema` は、Control UI と CLI ツールで使用されるライブ構成スキーマペイロードを返します。スキーマ、`uiHints`、バージョン、生成メタデータが含まれ、ランタイムが読み込める場合は Plugin + チャネルスキーマメタデータも含まれます。このスキーマには、同じラベルと UI で使われるヘルプテキストから派生したフィールド `title` / `description` メタデータが含まれます。該当するフィールドドキュメントが存在する場合は、ネストされたオブジェクト、ワイルドカード、配列アイテム、`anyOf` / `oneOf` / `allOf` 合成ブランチも含まれます。
    - `config.schema.lookup` は、1 つの構成パスに対するパススコープのルックアップペイロードを返します。正規化されたパス、浅いスキーマノード、一致したヒント + `hintPath`、任意の `reloadKind`、UI/CLI ドリルダウン向けの直下の子サマリーを含みます。`reloadKind` は `restart`、`hot`、または `none` のいずれかで、要求されたパスに対するGateway構成リロードプランナーを反映します。ルックアップスキーマノードは、ユーザー向けドキュメントと一般的な検証フィールド（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、数値/文字列/配列/オブジェクトの境界、`additionalProperties`、`deprecated`、`readOnly`、`writeOnly` などのフラグ）を保持します。子サマリーは、`key`、正規化された `path`、`type`、`required`、`hasChildren`、任意の `reloadKind`、さらに一致した `hint` / `hintPath` を公開します。
    - `update.run` は、Gateway更新フローを実行し、更新自体が成功した場合にのみ再起動をスケジュールします。セッションを持つ呼び出し元は `continuationMessage` を含められるため、起動時に再起動継続キューを通じてフォローアップのエージェントターンを 1 回再開できます。コントロールプレーンからのパッケージマネージャー更新と監督付き git チェックアウト更新は、稼働中のGateway内でパッケージツリーを置き換えたりチェックアウト/ビルド出力を変更したりする代わりに、切り離された管理サービスへのハンドオフを使用します。開始されたハンドオフは、`result.reason: "managed-service-handoff-started"` と `handoff.status: "started"` を伴う `ok: true` を返します。利用できない、または失敗したハンドオフは、`managed-service-handoff-unavailable` または `managed-service-handoff-failed` を伴う `ok: false` を返し、手動シェル更新が必要な場合は `handoff.command` も返します。ハンドオフが利用できないとは、OpenClawに安全なスーパーバイザー境界または永続的なサービス ID がないことを意味します。たとえば systemd の `OPENCLAW_SYSTEMD_UNIT` などです。開始されたハンドオフ中、再起動センチネルは一時的に `stats.reason: "restart-health-pending"` を報告することがあります。CLI が再起動後のGatewayを検証し、最終的な `ok` センチネルを書き込むまで、継続は遅延されます。
    - `update.status` は、利用可能な場合は再起動後に実行中のバージョンを含め、最新の更新再起動センチネルを更新して返します。
    - `wizard.start`、`wizard.next`、`wizard.status`、`wizard.cancel` は、オンボーディングウィザードを WS RPC 経由で公開します。

  </Accordion>

  <Accordion title="エージェントとワークスペースのヘルパー">
    - `agents.list` は、実効モデルとランタイムメタデータを含む、設定済みのエージェントエントリを返します。
    - `agents.create`、`agents.update`、`agents.delete` は、エージェントレコードとワークスペースの配線を管理します。
    - `agents.files.list`、`agents.files.get`、`agents.files.set` は、エージェント向けに公開されるブートストラップ用ワークスペースファイルを管理します。
    - `tasks.list`、`tasks.get`、`tasks.cancel` は、Gateway のタスク台帳を SDK クライアントとオペレータークライアントに公開します。
    - `artifacts.list`、`artifacts.get`、`artifacts.download` は、明示的な `sessionKey`、`runId`、または `taskId` のスコープに対して、トランスクリプト由来のアーティファクト概要とダウンロードを公開します。実行クエリとタスククエリは、所有するセッションをサーバー側で解決し、出所が一致するトランスクリプトメディアのみを返します。安全でない URL ソースやローカル URL ソースは、サーバー側で取得する代わりに、未サポートのダウンロードを返します。
    - `environments.list` と `environments.status` は、SDK クライアント向けに読み取り専用の Gateway ローカル環境とノード環境の検出を公開します。
    - `agent.identity.get` は、エージェントまたはセッションに対する実効アシスタント ID を返します。
    - `agent.wait` は、実行が完了するまで待機し、利用可能な場合は終端スナップショットを返します。

  </Accordion>

  <Accordion title="セッション制御">
    - `sessions.list` は、エージェントランタイムバックエンドが設定されている場合、行ごとの `agentRuntime` メタデータを含む現在のセッションインデックスを返します。
    - `sessions.subscribe` と `sessions.unsubscribe` は、現在の WS クライアントに対するセッション変更イベントの購読を切り替えます。
    - `sessions.messages.subscribe` と `sessions.messages.unsubscribe` は、1 つのセッションに対するトランスクリプト/メッセージイベントの購読を切り替えます。
    - `sessions.preview` は、特定のセッションキーに対して範囲制限されたトランスクリプトプレビューを返します。
    - `sessions.describe` は、完全一致するセッションキーに対して 1 つの Gateway セッション行を返します。
    - `sessions.resolve` は、セッションターゲットを解決または正規化します。
    - `sessions.create` は、新しいセッションエントリを作成します。
    - `sessions.send` は、既存のセッションにメッセージを送信します。
    - `sessions.steer` は、アクティブなセッション向けの割り込みおよび誘導バリアントです。
    - `sessions.abort` は、セッションのアクティブな作業を中止します。呼び出し元は `key` と任意の `runId` を渡すか、Gateway がセッションに解決できるアクティブな実行については `runId` のみを渡せます。
    - `sessions.patch` は、セッションメタデータ/オーバーライドを更新し、解決された正規モデルと実効 `agentRuntime` を報告します。
    - `sessions.reset`、`sessions.delete`、`sessions.compact` は、セッションメンテナンスを実行します。
    - `sessions.get` は、保存済みの完全なセッション行を返します。
    - チャット実行では引き続き `chat.history`、`chat.send`、`chat.abort`、`chat.inject` を使用します。`chat.history` は UI クライアント向けに表示正規化されます。インラインディレクティブタグは表示テキストから除去され、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、切り詰められたツール呼び出しブロックを含む）と、漏えいした ASCII/全角のモデル制御トークンは除去され、正確な `NO_REPLY` / `no_reply` などの純粋なサイレントトークンのアシスタント行は省略され、大きすぎる行はプレースホルダーに置き換えられる場合があります。
    - `chat.message.get` は、1 つの表示可能なトランスクリプトエントリに対する追加型の範囲制限付きフルメッセージリーダーです。クライアントは `sessionKey`、セッション選択がエージェントスコープの場合は任意の `agentId`、さらに以前に `chat.history` で公開されたトランスクリプト `messageId` を渡します。Gateway は、保存済みエントリがまだ利用可能で大きすぎない場合、軽量履歴の切り詰め上限なしで、同じ表示正規化済み投影を返します。
    - `chat.send` は、1 ターンの `fastMode: "auto"` を受け付け、自動カットオフ前に開始されたモデル呼び出しには高速モードを使用し、その後のリトライ、フォールバック、ツール結果、または継続呼び出しは高速モードなしで開始します。カットオフの既定値は 60 秒で、`agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` を使ってモデルごとに設定できます。`chat.send` の呼び出し元は、1 ターンの `fastAutoOnSeconds` を渡して、そのリクエストのカットオフを上書きできます。

  </Accordion>

  <Accordion title="デバイスペアリングとデバイストークン">
    - `device.pair.list` は、保留中および承認済みのペアリング済みデバイスを返します。
    - `device.pair.approve`、`device.pair.reject`、`device.pair.remove` は、デバイスペアリングレコードを管理します。
    - `device.token.rotate` は、承認済みロールと呼び出し元スコープの境界内で、ペアリング済みデバイストークンをローテーションします。
    - `device.token.revoke` は、承認済みロールと呼び出し元スコープの境界内で、ペアリング済みデバイストークンを失効させます。

  </Accordion>

  <Accordion title="ノードペアリング、呼び出し、保留中の作業">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove`、`node.pair.verify` は、ノードペアリングとブートストラップ検証を扱います。
    - `node.list` と `node.describe` は、既知/接続済みノードの状態を返します。
    - `node.rename` は、ペアリング済みノードのラベルを更新します。
    - `node.invoke` は、接続済みノードにコマンドを転送します。
    - `node.invoke.result` は、呼び出しリクエストの結果を返します。
    - `node.event` は、ノード由来のイベントを Gateway に戻します。
    - `node.pending.pull` と `node.pending.ack` は、接続済みノードキュー API です。
    - `node.pending.enqueue` と `node.pending.drain` は、オフライン/切断済みノード向けの永続的な保留作業を管理します。

  </Accordion>

  <Accordion title="承認ファミリー">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list`、`exec.approval.resolve` は、ワンショットの exec 承認リクエストと保留中の承認の検索/再生を扱います。
    - `exec.approval.waitDecision` は、1 つの保留中の exec 承認を待機し、最終決定（またはタイムアウト時は `null`）を返します。
    - `exec.approvals.get` と `exec.approvals.set` は、gateway の exec 承認ポリシースナップショットを管理します。
    - `exec.approvals.node.get` と `exec.approvals.node.set` は、ノードリレーコマンド経由でノードローカルの exec 承認ポリシーを管理します。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision`、`plugin.approval.resolve` は、Plugin 定義の承認フローを扱います。

  </Accordion>

  <Accordion title="自動化、Skills、ツール">
    - 自動化: `wake` は即時または次の Heartbeat でのウェイクテキスト注入をスケジュールします。`cron.get`、`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` は、スケジュール済み作業を管理します。
    - `cron.run` は、手動実行向けのエンキュー型 RPC のままです。完了セマンティクスが必要なクライアントは、返された `runId` を読み取り、`cron.runs` をポーリングする必要があります。
    - `cron.runs` は、任意の空でない `runId` フィルターを受け付けるため、クライアントは同じジョブの他の履歴エントリと競合せずに、キューに入った 1 つの手動実行を追跡できます。
    - Skills とツール: `commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。

  </Accordion>
</AccordionGroup>

### 共通イベントファミリー

- `chat`: `chat.inject` やその他のトランスクリプト専用チャットイベントなどの UI チャット更新です。プロトコル v4 では、差分ペイロードは `deltaText` を運び、`message` は累積アシスタントスナップショットのままです。非プレフィックス置換は `replace=true` を設定し、`deltaText` を置換テキストとして使用します。
- `session.message`、`session.operation`、`session.tool`: 購読済みセッションに対する、トランスクリプト、進行中のセッション操作、イベントストリーム更新です。
- `sessions.changed`: セッションインデックスまたはメタデータが変更されました。
- `presence`: システムプレゼンススナップショットの更新です。
- `tick`: 定期的な keepalive / liveness イベントです。
- `health`: gateway ヘルススナップショットの更新です。
- `heartbeat`: Heartbeat イベントストリームの更新です。
- `cron`: Cron の実行/ジョブ変更イベントです。
- `shutdown`: gateway シャットダウン通知です。
- `node.pair.requested` / `node.pair.resolved`: ノードペアリングのライフサイクルです。
- `node.invoke.request`: ノード呼び出しリクエストのブロードキャストです。
- `device.pair.requested` / `device.pair.resolved`: ペアリング済みデバイスのライフサイクルです。
- `voicewake.changed`: ウェイクワードトリガー設定が変更されました。
- `exec.approval.requested` / `exec.approval.resolved`: exec 承認のライフサイクルです。
- `plugin.approval.requested` / `plugin.approval.resolved`: plugin 承認のライフサイクルです。

### ノードヘルパーメソッド

- ノードは、自動許可チェック向けに現在のスキル実行可能ファイル一覧を取得するため、`skills.bins` を呼び出せます。

### タスク台帳 RPC

オペレータークライアントは、タスク台帳 RPC を通じて Gateway のバックグラウンドタスクレコードを検査およびキャンセルできます。これらのメソッドは、生のランタイム状態ではなく、サニタイズ済みのタスク概要を返します。

- `tasks.list` には `operator.read` が必要です。
  - パラメーター: 任意の `status`（`"queued"`、`"running"`、`"completed"`、`"failed"`、`"cancelled"`、または `"timed_out"`）またはそれらのステータスの配列、任意の `agentId`、任意の `sessionKey`、`1` から `500` までの任意の `limit`、任意の文字列 `cursor`。
  - 結果: `{ "tasks": TaskSummary[], "nextCursor"?: string }`。
- `tasks.get` には `operator.read` が必要です。
  - パラメーター: `{ "taskId": string }`。
  - 結果: `{ "task": TaskSummary }`。
  - 存在しないタスク ID は、Gateway の not-found エラー形状を返します。
- `tasks.cancel` には `operator.write` が必要です。
  - パラメーター: `{ "taskId": string, "reason"?: string }`。
  - 結果:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`。
  - `found` は、台帳に一致するタスクがあったかどうかを報告します。`cancelled` は、ランタイムがキャンセルを受け入れたか記録したかを報告します。

`TaskSummary` には `id`、`status`、および `kind`、`runtime`、`title`、`agentId`、`sessionKey`、`childSessionKey`、`ownerKey`、`runId`、`taskId`、`flowId`、`parentTaskId`、`sourceId`、タイムスタンプ、進捗、終端概要、サニタイズ済みエラーテキストなどの任意メタデータが含まれます。`agentId` はタスクを実行しているエージェントを識別します。`sessionKey` と `ownerKey` は、リクエスト元と制御コンテキストを保持します。

### オペレーターヘルパーメソッド

- オペレーターは `commands.list` (`operator.read`) を呼び出して、エージェントのランタイム
  コマンドインベントリを取得できます。
  - `agentId` は任意です。省略するとデフォルトのエージェントワークスペースを読み取ります。
  - `scope` はプライマリ `name` が対象にするサーフェスを制御します。
    - `text` は先頭の `/` を除いたプライマリテキストコマンドトークンを返します
    - `native` とデフォルトの `both` パスは、利用可能な場合にプロバイダー対応のネイティブ名を返します
  - `textAliases` は `/model` や `/m` などの正確なスラッシュエイリアスを保持します。
  - `nativeName` は、存在する場合にプロバイダー対応のネイティブコマンド名を保持します。
  - `provider` は任意で、ネイティブ命名とネイティブPlugin
    コマンドの可用性にのみ影響します。
  - `includeArgs=false` は、レスポンスからシリアライズ済み引数メタデータを省略します。
- オペレーターは `tools.catalog` (`operator.read`) を呼び出して、エージェントのランタイムツールカタログを取得できます。レスポンスには、グループ化されたツールと出所メタデータが含まれます。
  - `source`: `core` または `plugin`
  - `pluginId`: `source="plugin"` の場合のPlugin所有者
  - `optional`: Pluginツールが任意かどうか
- オペレーターは `tools.effective` (`operator.read`) を呼び出して、セッションでランタイム有効なツール
  インベントリを取得できます。
  - `sessionKey` は必須です。
  - Gatewayは、呼び出し元が指定した認証または配信コンテキストを受け入れるのではなく、セッションから信頼済みランタイムコンテキストをサーバー側で導出します。
  - レスポンスは、core、Plugin、チャネル、すでに検出済みのMCPサーバーツールを含む、アクティブインベントリのセッションスコープのサーバー導出プロジェクションです。
  - `tools.effective` はMCPに対して読み取り専用です。ウォーム状態のセッションMCPカタログを最終ツールポリシー経由で投影することはありますが、MCPランタイムの作成、トランスポートの接続、または
    `tools/list` の発行は行いません。一致するウォームカタログが存在しない場合、レスポンスには
    `mcp-not-yet-connected`、`mcp-not-yet-listed`、または `mcp-stale-catalog` などの通知が含まれることがあります。
  - 有効なツールエントリは `source="core"`、`source="plugin"`、`source="channel"`、または
    `source="mcp"` を使用します。
- オペレーターは `tools.invoke` (`operator.write`) を呼び出して、`/tools/invoke` と同じGatewayポリシーパス経由で、利用可能なツールを1つ実行できます。
  - `name` は必須です。`args`、`sessionKey`、`agentId`、`confirm`、および
    `idempotencyKey` は任意です。
  - `sessionKey` と `agentId` の両方が存在する場合、解決されたセッションエージェントは
    `agentId` と一致する必要があります。
  - `cron`、`gateway`、`nodes` などの所有者専用coreラッパーは、
    `tools.invoke` メソッド自体が `operator.write` であっても、所有者/admin ID (`operator.admin`) を必要とします。
  - レスポンスはSDK向けのエンベロープで、`ok`、`toolName`、任意の `output`、および型付きの
    `error` フィールドを含みます。承認またはポリシー拒否は、Gatewayツールポリシーパイプラインを迂回するのではなく、ペイロード内で `ok:false` を返します。
- オペレーターは `skills.status` (`operator.read`) を呼び出して、エージェントに表示される
  スキルインベントリを取得できます。
  - `agentId` は任意です。省略するとデフォルトのエージェントワークスペースを読み取ります。
  - レスポンスには、適格性、不足している要件、設定チェック、および生のシークレット値を公開しないサニタイズ済みインストールオプションが含まれます。
- オペレーターは `skills.search` と `skills.detail` (`operator.read`) を呼び出して、
  ClawHubの検出メタデータを取得できます。
- オペレーターは `skills.upload.begin`、`skills.upload.chunk`、および
  `skills.upload.commit` (`operator.admin`) を呼び出して、インストール前にプライベートスキルアーカイブをステージできます。これは信頼済みクライアント向けの別個のadminアップロードパスであり、
  通常のClawHubスキルインストールフローではありません。また、`skills.install.allowUploadedArchives` が有効でない限りデフォルトで無効です。
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    は、そのslugとforce値にバインドされたアップロードを作成します。
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` は、正確なデコード済みオフセットにバイトを追加します。
  - `skills.upload.commit({ uploadId, sha256? })` は、最終サイズとSHA-256を検証します。commitはアップロードを確定するだけで、スキルはインストールしません。
  - アップロードされたスキルアーカイブは、`SKILL.md` ルートを含むzipアーカイブです。アーカイブ内部のディレクトリ名がインストール先を選択することはありません。
- オペレーターは `skills.install` (`operator.admin`) を3つのモードで呼び出せます。
  - ClawHubモード: `{ source: "clawhub", slug, version?, force? }` は、
    スキルフォルダーをデフォルトのエージェントワークスペースの `skills/` ディレクトリにインストールします。
  - アップロードモード: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    は、commit済みのアップロードをデフォルトのエージェントワークスペースの `skills/<slug>`
    ディレクトリにインストールします。slugとforce値は、元の
    `skills.upload.begin` リクエストと一致する必要があります。このモードは
    `skills.install.allowUploadedArchives` が有効でない限り拒否されます。この設定は
    ClawHubインストールには影響しません。
  - Gatewayインストーラーモード: `{ name, installId, timeoutMs? }`
    は、Gatewayホスト上で宣言済みの `metadata.openclaw.install` アクションを実行します。
    古いクライアントは引き続き `dangerouslyForceUnsafeInstall` を送信する場合があります。このフィールドは非推奨で、プロトコル互換性のためにのみ受け入れられ、無視されます。オペレーター所有のインストール判断には
    `security.installPolicy` を使用してください。
- オペレーターは `skills.update` (`operator.admin`) を2つのモードで呼び出せます。
  - ClawHubモードは、デフォルトのエージェントワークスペース内で追跡されている1つのslug、または追跡されているすべてのClawHubインストールを更新します。
  - 設定モードは、`enabled`、`apiKey`、`env` などの `skills.entries.<skillKey>` 値にパッチを適用します。

### `models.list` ビュー

`models.list` は任意の `view` パラメーターを受け入れます。

- 省略または `"default"`: 現在のランタイム動作です。`agents.defaults.models` が設定されている場合、レスポンスは許可カタログになり、`provider/*` エントリ向けに動的に検出されたモデルも含まれます。それ以外の場合、レスポンスは完全なGatewayカタログです。
- `"configured"`: ピッカー向けサイズの動作です。`agents.defaults.models` が設定されている場合は、`provider/*` エントリ向けのプロバイダースコープの検出を含め、それが引き続き優先されます。許可リストがない場合、レスポンスは明示的な `models.providers.*.models` エントリを使用し、設定済みモデル行が存在しない場合にのみ完全なカタログにフォールバックします。
- `"all"`: 完全なGatewayカタログで、`agents.defaults.models` を迂回します。通常のモデルピッカーではなく、診断と検出UIに使用してください。

## Exec承認

- execリクエストに承認が必要な場合、Gatewayは `exec.approval.requested` をブロードキャストします。
- オペレータークライアントは `exec.approval.resolve` を呼び出して解決します（`operator.approvals` スコープが必要）。
- `host=node` の場合、`exec.approval.request` には `systemRunPlan`（正規の `argv`/`cwd`/`rawCommand`/セッションメタデータ）を含める必要があります。`systemRunPlan` がないリクエストは拒否されます。
- 承認後、転送された `node.invoke system.run` 呼び出しは、その正規の
  `systemRunPlan` を権威あるコマンド/cwd/セッションコンテキストとして再利用します。
- 呼び出し元がprepareと最終的に承認された `system.run` 転送の間に `command`、`rawCommand`、`cwd`、`agentId`、または
  `sessionKey` を変更した場合、Gatewayは変更されたペイロードを信頼せずに実行を拒否します。

## エージェント配信フォールバック

- `agent` リクエストには、アウトバウンド配信を要求するために `deliver=true` を含めることができます。
- `bestEffortDeliver=false` は厳密な動作を維持します。解決不能または内部専用の配信先は `INVALID_REQUEST` を返します。
- `bestEffortDeliver=true` は、外部に配信可能なルートを解決できない場合（たとえば内部/webchatセッションや曖昧なマルチチャネル設定）、セッションのみの実行へのフォールバックを許可します。
- 最終的な `agent` 結果には、配信が要求された場合に `result.deliveryStatus` が含まれることがあります。これは [`openclaw agent --json --deliver`](/ja-JP/cli/agent#json-delivery-status) で文書化されているものと同じ `sent`、`suppressed`、`partial_failed`、`failed`
  ステータスを使用します。

## バージョニング

- `PROTOCOL_VERSION` は `packages/gateway-protocol/src/version.ts` にあります。
- クライアントは `minProtocol` + `maxProtocol` を送信します。サーバーは、現在のプロトコルを含まない範囲を拒否します。現在のクライアントとサーバーはプロトコルv4を必要とします。
- スキーマとモデルはTypeBox定義から生成されます。
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### クライアント定数

`src/gateway/client.ts` のリファレンスクライアントは、これらのデフォルトを使用します。値は
プロトコルv4全体で安定しており、サードパーティクライアントに期待されるベースラインです。

| 定数                                      | デフォルト                                            | ソース                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| リクエストタイムアウト（RPCごと）         | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| 事前認証 / connect-challengeタイムアウト  | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts`（config/envでペアのサーバー/クライアント予算を増やせます） |
| 初期再接続バックオフ                      | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| 最大再接続バックオフ                      | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| device-tokenクローズ後の高速リトライクランプ | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` 前の強制停止猶予            | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` デフォルトタイムアウト    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| デフォルトtick間隔（`hello-ok` 前）       | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| tickタイムアウトによるクローズ            | 無音が `tickIntervalMs * 2` を超えた場合はcode `4000` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

サーバーは、有効な `policy.tickIntervalMs`、`policy.maxPayload`、
および `policy.maxBufferedBytes` を `hello-ok` で通知します。クライアントは、
ハンドシェイク前のデフォルトではなく、これらの値に従うべきです。

## 認証

- 共有シークレット Gateway 認証は、設定された認証モードに応じて `connect.params.auth.token` または
  `connect.params.auth.password` を使用します。
- Tailscale Serve（`gateway.auth.allowTailscale: true`）や非ループバックの
  `gateway.auth.mode: "trusted-proxy"` など、識別情報を持つモードでは、
  `connect.params.auth.*` ではなくリクエストヘッダーから接続認証チェックを満たします。
- プライベート入口の `gateway.auth.mode: "none"` は、共有シークレットの接続認証を
  完全にスキップします。このモードを公開または信頼できない入口に公開しないでください。
- ペアリング後、Gateway は接続ロール + スコープに限定された **デバイストークン** を発行します。
  これは `hello-ok.auth.deviceToken` で返され、今後の接続のためにクライアントで
  永続化する必要があります。
- クライアントは、接続が成功するたびにプライマリの `hello-ok.auth.deviceToken` を
  永続化する必要があります。
- その **保存済み** デバイストークンで再接続する場合は、そのトークン用に保存された
  承認済みスコープセットも再利用する必要があります。これにより、すでに付与された
  読み取り/プローブ/ステータスアクセスが保持され、再接続が暗黙の管理者専用スコープへ
  気づかないうちに狭められることを避けられます。
- クライアント側の接続認証組み立て（`src/gateway/client.ts` の `selectConnectAuth`）:
  - `auth.password` は直交しており、設定されている場合は常に転送されます。
  - `auth.token` は優先順で設定されます。明示的な共有トークンが最優先、次に明示的な
    `deviceToken`、最後に保存済みのデバイスごとのトークン（`deviceId` + `role` でキー化）です。
  - `auth.bootstrapToken` は、上記のいずれでも `auth.token` が解決されなかった場合にのみ送信されます。
    共有トークンまたは解決済みの任意のデバイストークンがある場合は抑制されます。
  - 1 回限りの `AUTH_TOKEN_MISMATCH` 再試行で保存済みデバイストークンを自動昇格する処理は、
    **信頼済みエンドポイントのみ** に制限されます。対象はループバック、または固定された
    `tlsFingerprint` を持つ `wss://` です。ピン留めのない公開 `wss://` は対象外です。
- 組み込みのセットアップコードによるブートストラップは、信頼済みモバイル引き継ぎ用に、
  プライマリノードの `hello-ok.auth.deviceToken` と、制限付きオペレータートークンを
  `hello-ok.auth.deviceTokens` で返します。オペレータートークンにはネイティブ Talk 設定読み取り用の
  `operator.talk.secrets` が含まれ、`operator.admin` と `operator.pairing` は除外されます。
- 非ベースラインのセットアップコードによるブートストラップが承認待ちの間、`PAIRING_REQUIRED`
  の詳細には `recommendedNextStep: "wait_then_retry"`、`retryable: true`、
  `pauseReconnect: false` が含まれます。クライアントは、リクエストが承認されるか
  トークンが無効になるまで、同じブートストラップトークンで再接続を続ける必要があります。
- `hello-ok.auth.deviceTokens` は、接続が `wss://` やループバック/local ペアリングなどの
  信頼済みトランスポート上でブートストラップ認証を使用した場合にのみ永続化してください。
- クライアントが **明示的な** `deviceToken` または明示的な `scopes` を指定した場合、
  その呼び出し元が要求したスコープセットが引き続き権威を持ちます。キャッシュ済みスコープは、
  クライアントが保存済みのデバイスごとのトークンを再利用している場合にのみ再利用されます。
- デバイストークンは `device.token.rotate` と `device.token.revoke` でローテーション/失効できます
  （`operator.pairing` スコープが必要）。ノードまたはその他の非オペレーターロールを
  ローテーションまたは失効するには、`operator.admin` も必要です。
- `device.token.rotate` はローテーションメタデータを返します。置換後の bearer トークンは、
  そのデバイストークンで既に認証されている同一デバイスからの呼び出しに限ってエコーします。
  これにより、トークンのみを使うクライアントは再接続前に置換トークンを永続化できます。
  共有/管理者によるローテーションでは bearer トークンをエコーしません。
- トークンの発行、ローテーション、失効は、そのデバイスのペアリングエントリに記録された
  承認済みロールセットに限定されます。トークンの変更によって、ペアリング承認で付与されていない
  デバイスロールへ拡張したり、それを対象にしたりすることはできません。
- ペアリング済みデバイストークンセッションでは、呼び出し元が `operator.admin` も持つ場合を除き、
  デバイス管理は自己スコープに限定されます。非管理者の呼び出し元が管理できるのは、
  **自分自身の** デバイスエントリのオペレータートークンのみです。ノードおよびその他の
  非オペレータートークン管理は、呼び出し元自身のデバイスであっても管理者専用です。
- `device.token.rotate` と `device.token.revoke` は、対象オペレータートークンのスコープセットも
  呼び出し元の現在のセッションスコープと照合します。非管理者の呼び出し元は、自分が既に持っている
  範囲より広いオペレータートークンをローテーションまたは失効できません。
- 認証失敗には `error.details.code` と復旧ヒントが含まれます:
  - `error.details.canRetryWithDeviceToken`（boolean）
  - `error.details.recommendedNextStep`（`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`）
- `AUTH_TOKEN_MISMATCH` に対するクライアントの動作:
  - 信頼済みクライアントは、キャッシュ済みのデバイスごとのトークンで 1 回だけ制限付き再試行を試みることができます。
  - その再試行が失敗した場合、クライアントは自動再接続ループを停止し、オペレーターの対応ガイダンスを表示する必要があります。
- `AUTH_SCOPE_MISMATCH` は、デバイストークンは認識されたものの、要求されたロール/スコープを
  カバーしていないことを意味します。クライアントはこれを不正なトークンとして表示せず、
  オペレーターに再ペアリング、またはより狭い/広いスコープ契約の承認を促す必要があります。

## デバイス識別情報 + ペアリング

- ノードは、鍵ペアのフィンガープリントから導出された安定したデバイス識別情報（`device.id`）を含める必要があります。
- Gateway はデバイス + ロールごとにトークンを発行します。
- local 自動承認が有効な場合を除き、新しいデバイス ID にはペアリング承認が必要です。
- ペアリング自動承認は、直接の local loopback 接続を中心にしています。
- OpenClaw には、信頼済み共有シークレットヘルパーフロー用に、狭いバックエンド/コンテナ local 自己接続パスもあります。
- 同一ホストの tailnet または LAN 接続も、ペアリング上は引き続きリモートとして扱われ、承認が必要です。
- WS クライアントは通常、`connect` 中に `device` 識別情報を含めます（オペレーター + ノード）。
  デバイスなしのオペレーター例外は、明示的な信頼パスのみです:
  - localhost 専用の安全でない HTTP 互換性のための `gateway.controlUi.allowInsecureAuth=true`。
  - `gateway.auth.mode: "trusted-proxy"` のオペレーター Control UI 認証に成功した場合。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（緊急避難用、重大なセキュリティ低下）。
  - 予約済み内部ヘルパーパス上の直接ループバック `gateway-client` バックエンド RPC。
- デバイス識別情報を省略すると、スコープ上の影響があります。デバイスなしのオペレーター接続が
  明示的な信頼パスを通じて許可される場合でも、OpenClaw は、そのパスに名前付きの
  スコープ保持例外がない限り、自己宣言スコープを空セットにクリアします。その後、
  スコープで制限されたメソッドは `missing scope` で失敗します。
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` は、Control UI の緊急避難用スコープ保持パスです。
  任意のカスタムバックエンドや CLI 風 WebSocket クライアントにスコープを付与するものではありません。
- 予約済み直接ループバック `gateway-client` バックエンドヘルパーパスは、内部 local
  コントロールプレーン RPC に限ってスコープを保持します。カスタムバックエンド ID にはこの例外は適用されません。
- すべての接続は、サーバーが提供する `connect.challenge` nonce に署名する必要があります。

### デバイス認証移行診断

チャレンジ前署名の動作をまだ使用しているレガシークライアントに対して、`connect` は現在、
`error.details.code` の下に `DEVICE_AUTH_*` 詳細コードを、安定した `error.details.reason` とともに返します。

一般的な移行失敗:

| メッセージ                  | details.code                     | details.reason           | 意味                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | クライアントが `device.nonce` を省略した（または空で送信した）。 |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | クライアントが古い/誤った nonce で署名した。       |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 署名ペイロードが v2 ペイロードと一致しない。       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 署名済みタイムスタンプが許容スキュー外である。     |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` が公開鍵フィンガープリントと一致しない。 |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開鍵の形式/正規化に失敗した。                    |

移行先:

- 常に `connect.challenge` を待ちます。
- サーバー nonce を含む v2 ペイロードに署名します。
- 同じ nonce を `connect.params.device.nonce` で送信します。
- 推奨される署名ペイロードは `v3` です。これは device/client/role/scopes/token/nonce フィールドに加えて
  `platform` と `deviceFamily` を結び付けます。
- レガシー `v2` 署名は互換性のため引き続き受け入れられますが、再接続時のコマンドポリシーは
  ペアリング済みデバイスのメタデータピン留めによって引き続き制御されます。

## TLS + ピン留め

- TLS は WS 接続でサポートされています。
- クライアントは、必要に応じて gateway 証明書フィンガープリントをピン留めできます
  （`gateway.tls` 設定に加えて `gateway.remote.tlsFingerprint` または CLI `--tls-fingerprint` を参照）。

## スコープ

このプロトコルは **完全な gateway API**（ステータス、チャンネル、モデル、チャット、
エージェント、セッション、ノード、承認など）を公開します。正確なサーフェスは
`packages/gateway-protocol/src/schema.ts` の TypeBox スキーマで定義されています。

## 関連

- [ブリッジプロトコル](/ja-JP/gateway/bridge-protocol)
- [Gateway ランブック](/ja-JP/gateway)
