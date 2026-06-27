---
read_when:
    - Gateway WS クライアントの実装または更新
    - プロトコル不一致や接続失敗のデバッグ
    - プロトコルのスキーマ/モデルの再生成
summary: 'Gateway WebSocket プロトコル: ハンドシェイク、フレーム、バージョニング'
title: Gateway プロトコル
x-i18n:
    generated_at: "2026-06-27T11:33:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df37fcb4f6a52ef3f6044840a4c1fb1a59bf1d2b880b9f3752490c6eb8a2135f
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS プロトコルは、OpenClaw の**単一の制御プレーン + ノードトランスポート**です。すべてのクライアント (CLI、Web UI、macOS アプリ、iOS/Android ノード、ヘッドレスノード) は WebSocket 経由で接続し、ハンドシェイク時に自身の**ロール** + **スコープ**を宣言します。

## トランスポート

- WebSocket、JSON ペイロードを含むテキストフレーム。
- 最初のフレームは**必ず** `connect` リクエストである必要があります。
- 接続前フレームの上限は 64 KiB です。ハンドシェイクが成功した後、クライアントは `hello-ok.policy.maxPayload` と `hello-ok.policy.maxBufferedBytes` の制限に従う必要があります。診断が有効な場合、過大な受信フレームと遅い送信バッファーは、gateway が影響を受けたフレームを閉じるか破棄する前に `payload.large` イベントを発行します。これらのイベントはサイズ、制限、サーフェス、安全な理由コードを保持します。メッセージ本文、添付ファイルの内容、生フレーム本文、トークン、Cookie、シークレット値は保持しません。

## ハンドシェイク (connect)

Gateway → クライアント (接続前チャレンジ):

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

Gateway がまだ起動サイドカーの完了中の場合、`connect` リクエストは、`details.reason` が `"startup-sidecars"` に設定され、`retryAfterMs` を含む、再試行可能な `UNAVAILABLE` エラーを返すことがあります。クライアントは、それを終端的なハンドシェイク失敗として表示するのではなく、全体の接続予算内でその応答を再試行する必要があります。

`server`、`features`、`snapshot`、`policy` はすべてスキーマ (`packages/gateway-protocol/src/schema/frames.ts`) で必須です。`auth` も必須で、ネゴシエートされたロール/スコープを報告します。`pluginSurfaceUrls` は任意で、`canvas` などの Plugin サーフェス名を、スコープ付きのホスト URL にマッピングします。

スコープ付き Plugin サーフェス URL は期限切れになる場合があります。ノードは `node.pluginSurface.refresh` を `{ "surface": "canvas" }` で呼び出し、`pluginSurfaceUrls` 内の新しいエントリを受け取れます。実験的な Canvas Plugin リファクターは、非推奨の `canvasHostUrl`、`canvasCapability`、または `node.canvas.capability.refresh` 互換パスをサポートしません。現在のネイティブクライアントと gateway は Plugin サーフェスを使用する必要があります。

デバイストークンが発行されない場合、`hello-ok.auth` はトークンフィールドなしで、ネゴシエートされた権限を報告します。

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

信頼された同一プロセスのバックエンドクライアント (`client.id: "gateway-client"`、`client.mode: "backend"`) は、共有 Gateway トークン/パスワードで認証する場合、直接 loopback 接続で `device` を省略できます。このパスは内部制御プレーン RPC 用に予約されており、古い CLI/デバイスペアリングのベースラインがサブエージェントセッション更新などのローカルバックエンド作業を妨げないようにします。リモートクライアント、ブラウザーオリジンのクライアント、ノードクライアント、および明示的なデバイストークン/デバイスアイデンティティのクライアントは、引き続き通常のペアリングとスコープアップグレードチェックを使用します。

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

組み込みの QR/セットアップコードブートストラップは、新しいモバイル引き渡しパスです。ベースラインのセットアップコード接続が成功すると、プライマリノードトークンと 1 つの制限付きオペレータートークンが返されます。

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

オペレーター引き渡しは意図的に制限されているため、QR オンボーディングは `operator.admin` または `operator.pairing` を付与せずにモバイルオペレーターループを開始できます。ネイティブクライアントがブートストラップ後に必要な Talk 設定を読み取れるように、`operator.talk.secrets` は含まれます。より広範な管理者スコープとペアリングスコープには、別の承認済みオペレーターペアリングまたはトークンフローが必要です。クライアントは、接続が `wss://` や loopback/local ペアリングなどの信頼されたトランスポート上でブートストラップ認証を使用した場合にのみ、`hello-ok.auth.deviceTokens` を永続化する必要があります。

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

副作用のあるメソッドには**冪等性キー**が必要です (スキーマを参照)。

## ロール + スコープ

完全なオペレータースコープモデル、承認時チェック、共有シークレットのセマンティクスについては、[オペレータースコープ](/ja-JP/gateway/operator-scopes) を参照してください。

### ロール

- `operator` = 制御プレーンクライアント (CLI/UI/自動化)。
- `node` = capability ホスト (camera/screen/canvas/system.run)。

### スコープ (operator)

一般的なスコープ:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` を伴う `talk.config` には `operator.talk.secrets` (または `operator.admin`) が必要です。

Plugin 登録済みの gateway RPC メソッドは独自のオペレータースコープを要求できますが、予約済みのコア管理者プレフィックス (`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`) は常に `operator.admin` に解決されます。

メソッドスコープは最初のゲートにすぎません。`chat.send` 経由で到達する一部のスラッシュコマンドは、さらに厳格なコマンドレベルチェックを適用します。たとえば、永続的な `/config set` と `/config unset` の書き込みには `operator.admin` が必要です。

`node.pair.approve` には、ベースメソッドスコープに加えて、承認時の追加スコープチェックもあります。

- コマンドなしリクエスト: `operator.pairing`
- exec 以外のノードコマンドを含むリクエスト: `operator.pairing` + `operator.write`
- `system.run`、`system.run.prepare`、または `system.which` を含むリクエスト: `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

ノードは接続時に capability の主張を宣言します。

- `caps`: `camera`、`canvas`、`screen`、`location`、`voice`、`talk` などの高レベル capability カテゴリ。
- `commands`: invoke 用のコマンド許可リスト。
- `permissions`: 細かな切り替え (例: `screen.record`、`camera.capture`)。

Gateway はこれらを**主張**として扱い、サーバー側の許可リストを適用します。

## プレゼンス

- `system-presence` はデバイスアイデンティティをキーにしたエントリを返します。
- プレゼンスエントリには `deviceId`、`roles`、`scopes` が含まれるため、UI はデバイスが**オペレーター**と**ノード**の両方として接続する場合でも、デバイスごとに 1 行で表示できます。
- `node.list` には任意の `lastSeenAtMs` と `lastSeenReason` フィールドが含まれます。接続中のノードは現在の接続時刻を理由 `connect` とともに `lastSeenAtMs` として報告します。ペアリング済みノードは、信頼されたノードイベントがペアリングメタデータを更新した場合、永続的なバックグラウンドプレゼンスも報告できます。

### ノードバックグラウンド alive イベント

ノードは `event: "node.presence.alive"` で `node.event` を呼び出し、ペアリング済みノードがバックグラウンド wake 中に alive だったことを、接続中としてマークせずに記録できます。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` は閉じた enum です: `background`、`silent_push`、`bg_app_refresh`、`significant_location`、`manual`、または `connect`。不明な trigger 文字列は、永続化前に gateway によって `background` に正規化されます。このイベントは、認証済みノードデバイスセッションに対してのみ永続化されます。デバイスなしまたは未ペアリングのセッションは `handled: false` を返します。

成功した gateway は構造化された結果を返します。

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

古い gateway は `node.event` に対してまだ `{ "ok": true }` を返す場合があります。クライアントはこれを、永続的なプレゼンス永続化ではなく、承認済み RPC として扱う必要があります。

## ブロードキャストイベントのスコープ設定

サーバーからプッシュされる WebSocket ブロードキャストイベントはスコープでゲートされ、ペアリングスコープまたはノード専用セッションがセッション内容を受動的に受信しないようにします。

- **チャット、エージェント、ツール結果フレーム** (ストリーミングされた `agent` イベントとツール呼び出し結果を含む) には、少なくとも `operator.read` が必要です。`operator.read` のないセッションは、これらのフレームを完全にスキップします。
- **Plugin 定義の `plugin.*` ブロードキャスト**は、Plugin がどのように登録したかに応じて、`operator.write` または `operator.admin` にゲートされます。
- **ステータスイベントとトランスポートイベント** (`heartbeat`、`presence`、`tick`、接続/切断ライフサイクルなど) は、トランスポートヘルスをすべての認証済みセッションで観測できるよう、制限されないままです。
- **不明なブロードキャストイベントファミリー**は、登録済みハンドラーが明示的に緩和しない限り、デフォルトでスコープゲートされます (fail-closed)。

各クライアント接続は独自のクライアントごとのシーケンス番号を保持するため、異なるクライアントがイベントストリームの異なるスコープフィルター済みサブセットを見る場合でも、ブロードキャストはそのソケット上で単調順序を維持します。

## 一般的な RPC メソッドファミリー

公開 WS サーフェスは、上記のハンドシェイク/認証例よりも広範です。これは生成されたダンプではありません。`hello-ok.features.methods` は、`src/gateway/server-methods-list.ts` と読み込まれた Plugin/チャネルメソッドエクスポートから構築される保守的なディスカバリーリストです。`src/gateway/server-methods/*.ts` の完全な列挙ではなく、機能ディスカバリーとして扱ってください。

  <AccordionGroup>
  <Accordion title="システムと ID">
    - `health` は、キャッシュ済みまたは新たにプローブされた Gateway ヘルススナップショットを返します。
    - `diagnostics.stability` は、最近の範囲制限付き診断安定性レコーダーを返します。イベント名、件数、バイトサイズ、メモリ読み取り値、キュー/セッション状態、チャネル/Plugin 名、セッション ID などの運用メタデータを保持します。チャット本文、Webhook 本文、ツール出力、生のリクエストまたはレスポンス本文、トークン、Cookie、シークレット値は保持しません。オペレーターの読み取りスコープが必要です。
    - `status` は、`/status` 形式の Gateway サマリーを返します。機密フィールドは、管理者スコープのオペレータークライアントにのみ含まれます。
    - `gateway.identity.get` は、リレーおよびペアリングフローで使われる Gateway デバイス ID を返します。
    - `system-presence` は、接続中のオペレーター/Node デバイスの現在のプレゼンススナップショットを返します。
    - `system-event` は、システムイベントを追加し、プレゼンスコンテキストを更新/ブロードキャストできます。
    - `last-heartbeat` は、永続化された最新の Heartbeat イベントを返します。
    - `set-heartbeats` は、Gateway 上の Heartbeat 処理を切り替えます。

  </Accordion>

  <Accordion title="モデルと使用状況">
    - `models.list` は、ランタイムで許可されたモデルカタログを返します。ピッカー向けサイズの設定済みモデル（まず `agents.defaults.models`、次に `models.providers.*.models`）には `{ "view": "configured" }` を渡し、完全なカタログには `{ "view": "all" }` を渡します。
    - `usage.status` は、プロバイダー使用状況ウィンドウ/残りクォータのサマリーを返します。
    - `usage.cost` は、日付範囲の集計コスト使用状況サマリーを返します。
      1 つのエージェントには `agentId` を渡し、設定済みエージェントを集計するには `agentScope: "all"` を渡します。
    - `doctor.memory.status` は、アクティブなデフォルトエージェントワークスペースのベクトルメモリ / キャッシュ済み埋め込みの準備状態を返します。呼び出し元がライブの埋め込みプロバイダー ping を明示的に求める場合にのみ、`{ "probe": true }` または `{ "deep": true }` を渡します。Dreaming 対応クライアントは、選択したエージェントワークスペースに Dreaming ストア統計をスコープするために `{ "agentId": "agent-id" }` も渡せます。`agentId` を省略すると、デフォルトエージェントのフォールバックを維持し、設定済み Dreaming ワークスペースを集計します。
    - `doctor.memory.dreamDiary`、`doctor.memory.backfillDreamDiary`、`doctor.memory.resetDreamDiary`、`doctor.memory.resetGroundedShortTerm`、`doctor.memory.repairDreamingArtifacts`、および `doctor.memory.dedupeDreamDiary` は、選択エージェントの Dreaming ビュー/アクション向けに任意の `{ "agentId": "agent-id" }` パラメーターを受け取ります。`agentId` が省略された場合、設定済みのデフォルトエージェントワークスペースに対して動作します。
    - `doctor.memory.remHarness` は、リモート制御プレーンのクライアント向けに、範囲制限付きの読み取り専用 REM ハーネスプレビューを返します。ワークスペースパス、メモリスニペット、レンダリング済みの grounded Markdown、深いプロモーション候補を含められるため、呼び出し元には `operator.read` が必要です。
    - `sessions.usage` は、セッションごとの使用状況サマリーを返します。1 つの
      エージェントには `agentId` を渡し、設定済みエージェントをまとめて一覧するには `agentScope: "all"` を渡します。
    - `sessions.usage.timeseries` は、1 つのセッションの時系列使用状況を返します。
    - `sessions.usage.logs` は、1 つのセッションの使用状況ログエントリを返します。

  </Accordion>

  <Accordion title="チャネルとログインヘルパー">
    - `channels.status` は、組み込み + バンドル済みチャネル/Plugin の状態サマリーを返します。
    - `channels.logout` は、チャネルがログアウトに対応している場合に、特定のチャネル/アカウントからログアウトします。
    - `web.login.start` は、現在の QR 対応 Web チャネルプロバイダーの QR/Web ログインフローを開始します。
    - `web.login.wait` は、その QR/Web ログインフローの完了を待ち、成功時にチャネルを開始します。
    - `push.test` は、登録済み iOS Node にテスト APNs プッシュを送信します。
    - `voicewake.get` は、保存済みのウェイクワードトリガーを返します。
    - `voicewake.set` は、ウェイクワードトリガーを更新し、変更をブロードキャストします。

  </Accordion>

  <Accordion title="メッセージングとログ">
    - `send` は、チャットランナー外でのチャネル/アカウント/スレッドを対象にした送信向けの直接アウトバウンド配信 RPC です。
    - `logs.tail` は、設定済み Gateway ファイルログの末尾を、カーソル/リミットおよび最大バイト制御付きで返します。

  </Accordion>

  <Accordion title="Talk と TTS">
    - `talk.catalog` は、音声、ストリーミング文字起こし、リアルタイム音声向けの読み取り専用 Talk プロバイダーカタログを返します。プロバイダー ID、ラベル、設定状態、公開モデル/音声 ID、正規モード、トランスポート、ブレイン戦略、リアルタイム音声/ケイパビリティフラグを含みますが、プロバイダーシークレットの返却やグローバル設定の変更は行いません。
    - `talk.config` は、有効な Talk 設定ペイロードを返します。`includeSecrets` には `operator.talk.secrets`（または `operator.admin`）が必要です。
    - `talk.session.create` は、`realtime/gateway-relay`、`transcription/gateway-relay`、または `stt-tts/managed-room` の Gateway 所有 Talk セッションを作成します。`stt-tts/managed-room` では、`sessionKey` を渡す `operator.write` 呼び出し元は、スコープ付きセッションキー可視性のために `spawnedBy` も渡す必要があります。スコープなしの `sessionKey` 作成と `brain: "direct-tools"` には `operator.admin` が必要です。
    - `talk.session.join` は、managed-room セッショントークンを検証し、必要に応じて `session.ready` または `session.replaced` イベントを発行し、プレーンテキストトークンや保存済みトークンハッシュを含めずにルーム/セッションメタデータと最近の Talk イベントを返します。
    - `talk.session.appendAudio` は、base64 PCM 入力音声を Gateway 所有のリアルタイムリレーおよび文字起こしセッションに追加します。
    - `talk.session.startTurn`、`talk.session.endTurn`、および `talk.session.cancelTurn` は、状態がクリアされる前に古いターンを拒否しつつ、managed-room のターンライフサイクルを駆動します。
    - `talk.session.cancelOutput` は、主に Gateway リレーセッションでの VAD 制御の割り込み用に、アシスタントの音声出力を停止します。
    - `talk.session.submitToolResult` は、Gateway 所有のリアルタイムリレーセッションによって発行されたプロバイダーツール呼び出しを完了します。最終結果が後続する暫定ツール出力には `options: { willContinue: true }` を渡し、ツール結果が別のリアルタイムアシスタント応答を開始せずにプロバイダー呼び出しを満たす必要がある場合は `options: { suppressResponse: true }` を渡します。
    - `talk.session.steer` は、Gateway 所有のエージェント連携 Talk セッションにアクティブ実行の音声制御を送信します。`{ sessionId, text, mode? }` を受け取り、`mode` は `status`、`steer`、`cancel`、または `followup` です。省略されたモードは発話テキストから分類されます。
    - `talk.session.close` は、Gateway 所有のリレー、文字起こし、または managed-room セッションを閉じ、終端 Talk イベントを発行します。
    - `talk.mode` は、WebChat/Control UI クライアント向けに現在の Talk モード状態を設定/ブロードキャストします。
    - `talk.client.create` は、Gateway が設定、認証情報、指示、ツールポリシーを所有したまま、`webrtc` または `provider-websocket` を使ってクライアント所有のリアルタイムプロバイダーセッションを作成します。
    - `talk.client.toolCall` は、クライアント所有のリアルタイムトランスポートがプロバイダーツール呼び出しを Gateway ポリシーに転送できるようにします。最初に対応するツールは `openclaw_agent_consult` です。クライアントは実行 ID を受け取り、プロバイダー固有のツール結果を送信する前に通常のチャットライフサイクルイベントを待ちます。
    - `talk.client.steer` は、クライアント所有のリアルタイムトランスポート向けにアクティブ実行の音声制御を送信します。Gateway は `sessionKey` からアクティブな埋め込み実行を解決し、ステアリングを黙って破棄するのではなく、構造化された accepted/rejected 結果を返します。
    - `talk.event` は、リアルタイム、文字起こし、STT/TTS、managed-room、電話、会議アダプターの単一 Talk イベントチャネルです。
    - `talk.speak` は、アクティブな Talk 音声プロバイダーを通じて音声を合成します。
    - `tts.status` は、TTS の有効状態、アクティブプロバイダー、フォールバックプロバイダー、プロバイダー設定状態を返します。
    - `tts.providers` は、表示可能な TTS プロバイダー一覧を返します。
    - `tts.enable` と `tts.disable` は、TTS 設定状態を切り替えます。
    - `tts.setProvider` は、優先 TTS プロバイダーを更新します。
    - `tts.convert` は、単発のテキスト読み上げ変換を実行します。

  </Accordion>

  <Accordion title="シークレット、設定、更新、ウィザード">
    - `secrets.reload` は、アクティブな SecretRefs を再解決し、完全に成功した場合にのみランタイムシークレット状態を入れ替えます。
    - `secrets.resolve` は、特定のコマンド/ターゲットセット向けのコマンド対象シークレット割り当てを解決します。
    - `config.get` は、現在の設定スナップショットとハッシュを返します。
    - `config.set` は、検証済みの設定ペイロードを書き込みます。
    - `config.patch` は、部分的な設定更新をマージします。破壊的な配列
      置換には、影響を受けるパスを `replacePaths` に含める必要があります。配列エントリ
      配下のネストされた配列は、`agents.list[].skills` のような `[]` パスを使います。
    - `config.apply` は、完全な設定ペイロードを検証 + 置換します。
    - `config.schema` は、Control UI と CLI ツールで使われるライブ設定スキーマペイロードを返します。スキーマ、`uiHints`、バージョン、生成メタデータを含み、ランタイムが読み込める場合は Plugin + チャネルスキーマメタデータも含みます。スキーマには、UI で使われる同じラベルとヘルプテキストから派生したフィールド `title` / `description` メタデータが含まれ、対応するフィールドドキュメントが存在する場合は、ネストされたオブジェクト、ワイルドカード、配列アイテム、`anyOf` / `oneOf` / `allOf` の合成ブランチも含まれます。
    - `config.schema.lookup` は、1 つの設定パスに対するパススコープのルックアップペイロードを返します。正規化済みパス、浅いスキーマノード、マッチしたヒント + `hintPath`、任意の `reloadKind`、UI/CLI ドリルダウン向けの直下子サマリーを含みます。`reloadKind` は `restart`、`hot`、または `none` のいずれかで、要求されたパスに対する Gateway 設定リロードプランナーを反映します。ルックアップスキーマノードは、ユーザー向けドキュメントと一般的な検証フィールド（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、数値/文字列/配列/オブジェクトの境界、`additionalProperties`、`deprecated`、`readOnly`、`writeOnly` などのフラグ）を保持します。子サマリーは、`key`、正規化済み `path`、`type`、`required`、`hasChildren`、任意の `reloadKind`、およびマッチした `hint` / `hintPath` を公開します。
    - `update.run` は、Gateway 更新フローを実行し、更新自体が成功した場合にのみ再起動をスケジュールします。セッションを持つ呼び出し元は `continuationMessage` を含めることで、起動時に再起動継続キューを通じて 1 回の後続エージェントターンを再開できます。制御プレーンからのパッケージマネージャー更新および管理対象 git チェックアウト更新は、ライブ Gateway 内でパッケージツリーを置き換えたりチェックアウト/ビルド出力を変更したりする代わりに、分離された管理サービスへのハンドオフを使います。開始済みハンドオフは `ok: true` と `result.reason: "managed-service-handoff-started"` および `handoff.status: "started"` を返します。利用不可または失敗したハンドオフは、`ok: false` と `managed-service-handoff-unavailable` または `managed-service-handoff-failed` を返し、手動シェル更新が必要な場合は `handoff.command` も含みます。利用不可のハンドオフは、OpenClaw に安全なスーパーバイザー境界または永続的なサービス ID がないことを意味します。たとえば systemd 向けの `OPENCLAW_SYSTEMD_UNIT` などです。開始済みハンドオフ中、再起動センチネルは一時的に `stats.reason: "restart-health-pending"` を報告することがあります。CLI が再起動済み Gateway を検証して最終 `ok` センチネルを書き込むまで、継続は遅延されます。
    - `update.status` は、利用可能な場合は再起動後の実行中バージョンを含め、最新の更新再起動センチネルを更新して返します。
    - `wizard.start`、`wizard.next`、`wizard.status`、および `wizard.cancel` は、WS RPC 経由でオンボーディングウィザードを公開します。

  </Accordion>

  <Accordion title="エージェントとワークスペースのヘルパー">
    - `agents.list` は、有効なモデルとランタイムメタデータを含む、設定済みエージェントエントリを返します。
    - `agents.create`、`agents.update`、`agents.delete` は、エージェントレコードとワークスペースの配線を管理します。
    - `agents.files.list`、`agents.files.get`、`agents.files.set` は、エージェントに公開されるブートストラップ用ワークスペースファイルを管理します。
    - `tasks.list`、`tasks.get`、`tasks.cancel` は、Gateway のタスク台帳を SDK とオペレータークライアントに公開します。
    - `artifacts.list`、`artifacts.get`、`artifacts.download` は、明示的な `sessionKey`、`runId`、または `taskId` スコープに対して、トランスクリプト由来のアーティファクト要約とダウンロードを公開します。実行とタスクのクエリは、所有するセッションをサーバー側で解決し、一致する由来を持つトランスクリプトメディアだけを返します。安全でない URL ソースやローカル URL ソースは、サーバー側で取得する代わりに未対応のダウンロードを返します。
    - `environments.list` と `environments.status` は、SDK クライアント向けに読み取り専用の Gateway ローカルおよび Node 環境検出を公開します。
    - `agent.identity.get` は、エージェントまたはセッションの有効なアシスタント ID を返します。
    - `agent.wait` は実行が完了するまで待機し、利用可能な場合は終端スナップショットを返します。

  </Accordion>

  <Accordion title="セッション制御">
    - `sessions.list` は現在のセッションインデックスを返します。エージェントランタイムバックエンドが設定されている場合は、行ごとの `agentRuntime` メタデータを含みます。
    - `sessions.subscribe` と `sessions.unsubscribe` は、現在の WS クライアントのセッション変更イベント購読を切り替えます。
    - `sessions.messages.subscribe` と `sessions.messages.unsubscribe` は、1 つのセッションのトランスクリプト/メッセージイベント購読を切り替えます。
    - `sessions.preview` は、特定のセッションキーの範囲付きトランスクリプトプレビューを返します。
    - `sessions.describe` は、正確なセッションキーに対して 1 行の Gateway セッションを返します。
    - `sessions.resolve` は、セッションターゲットを解決または正規化します。
    - `sessions.create` は、新しいセッションエントリを作成します。
    - `sessions.send` は、既存のセッションにメッセージを送信します。
    - `sessions.steer` は、アクティブなセッション向けの中断して誘導するバリアントです。
    - `sessions.abort` は、セッションのアクティブな作業を中止します。呼び出し元は `key` と任意の `runId` を渡すか、Gateway がセッションへ解決できるアクティブな実行については `runId` だけを渡すことができます。
    - `sessions.patch` は、セッションのメタデータ/オーバーライドを更新し、解決済みの正規モデルと有効な `agentRuntime` を報告します。
    - `sessions.reset`、`sessions.delete`、`sessions.compact` は、セッションメンテナンスを実行します。
    - `sessions.get` は、保存済みの完全なセッション行を返します。
    - チャット実行は引き続き `chat.history`、`chat.send`、`chat.abort`、`chat.inject` を使用します。`chat.history` は UI クライアント向けに表示正規化されています。インラインディレクティブタグは表示テキストから取り除かれ、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）と漏えいした ASCII/全角のモデル制御トークンは取り除かれ、正確な `NO_REPLY` / `no_reply` などの純粋なサイレントトークンのアシスタント行は省略され、過大な行はプレースホルダーに置き換えられることがあります。
    - `chat.message.get` は、単一の表示可能なトランスクリプトエントリ向けに追加された範囲付き完全メッセージリーダーです。クライアントは `sessionKey`、セッション選択がエージェントスコープの場合は任意の `agentId`、さらに以前に `chat.history` を通じて公開されたトランスクリプトの `messageId` を渡します。Gateway は、保存済みエントリがまだ利用可能で過大でない場合、軽量な履歴切り詰め上限なしで、同じ表示正規化済み投影を返します。
    - `chat.send` は、1 ターンの `fastMode: "auto"` を受け付け、自動カットオフ前に開始されたモデル呼び出しには高速モードを使用し、その後の再試行、フォールバック、ツール結果、または継続呼び出しは高速モードなしで開始します。カットオフの既定値は 60 秒で、モデルごとに `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` で設定できます。`chat.send` の呼び出し元は、そのリクエストのカットオフを上書きするために 1 ターンの `fastAutoOnSeconds` を渡すことができます。

  </Accordion>

  <Accordion title="デバイスペアリングとデバイストークン">
    - `device.pair.list` は、保留中および承認済みのペアリング済みデバイスを返します。
    - `device.pair.approve`、`device.pair.reject`、`device.pair.remove` は、デバイスペアリングレコードを管理します。
    - `device.token.rotate` は、承認済みロールと呼び出し元スコープの範囲内で、ペアリング済みデバイストークンをローテーションします。
    - `device.token.revoke` は、承認済みロールと呼び出し元スコープの範囲内で、ペアリング済みデバイストークンを取り消します。

  </Accordion>

  <Accordion title="Node ペアリング、呼び出し、保留中の作業">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove`、`node.pair.verify` は、Node ペアリングとブートストラップ検証を扱います。
    - `node.list` と `node.describe` は、既知/接続済みの Node 状態を返します。
    - `node.rename` は、ペアリング済み Node のラベルを更新します。
    - `node.invoke` は、接続済み Node にコマンドを転送します。
    - `node.invoke.result` は、呼び出しリクエストの結果を返します。
    - `node.event` は、Node 発のイベントを gateway に戻します。
    - `node.pending.pull` と `node.pending.ack` は、接続済み Node キュー API です。
    - `node.pending.enqueue` と `node.pending.drain` は、オフライン/切断済み Node 向けの永続的な保留中作業を管理します。

  </Accordion>

  <Accordion title="承認ファミリー">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list`、`exec.approval.resolve` は、単発の exec 承認リクエストと保留中承認の検索/再生を扱います。
    - `exec.approval.waitDecision` は、1 つの保留中 exec 承認を待機し、最終決定（またはタイムアウト時は `null`）を返します。
    - `exec.approvals.get` と `exec.approvals.set` は、gateway exec 承認ポリシースナップショットを管理します。
    - `exec.approvals.node.get` と `exec.approvals.node.set` は、Node リレーコマンド経由で Node ローカルの exec 承認ポリシーを管理します。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision`、`plugin.approval.resolve` は、プラグイン定義の承認フローを扱います。

  </Accordion>

  <Accordion title="自動化、Skills、ツール">
    - 自動化: `wake` は、即時または次回 Heartbeat の wake テキスト注入をスケジュールします。`cron.get`、`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` は、スケジュール済み作業を管理します。
    - `cron.run` は、手動実行向けのエンキュー型 RPC のままです。完了セマンティクスが必要なクライアントは、返された `runId` を読み取り、`cron.runs` をポーリングする必要があります。
    - `cron.runs` は、任意の空でない `runId` フィルターを受け付けるため、クライアントは同じジョブの他の履歴エントリと競合せずに、キューに入った 1 つの手動実行を追跡できます。
    - Skills とツール: `commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。

  </Accordion>
</AccordionGroup>

### 共通イベントファミリー

- `chat`: `chat.inject` などの UI チャット更新と、その他のトランスクリプト専用チャット
  イベント。プロトコル v4 では、差分ペイロードは `deltaText` を運びます。`message` は累積された
  アシスタントスナップショットのままです。非プレフィックス置換は `replace=true` を設定し、
  `deltaText` を置換テキストとして使用します。
- `session.message`、`session.operation`、`session.tool`: 購読済み
  セッションのトランスクリプト、進行中のセッション操作、イベントストリーム更新。
- `sessions.changed`: セッションインデックスまたはメタデータが変更されました。
- `presence`: システムプレゼンススナップショット更新。
- `tick`: 定期的な keepalive / liveness イベント。
- `health`: gateway ヘルススナップショット更新。
- `heartbeat`: heartbeat イベントストリーム更新。
- `cron`: cron 実行/ジョブ変更イベント。
- `shutdown`: gateway シャットダウン通知。
- `node.pair.requested` / `node.pair.resolved`: Node ペアリングライフサイクル。
- `node.invoke.request`: Node 呼び出しリクエストのブロードキャスト。
- `device.pair.requested` / `device.pair.resolved`: ペアリング済みデバイスのライフサイクル。
- `voicewake.changed`: wake-word トリガー設定が変更されました。
- `exec.approval.requested` / `exec.approval.resolved`: exec 承認
  ライフサイクル。
- `plugin.approval.requested` / `plugin.approval.resolved`: プラグイン承認
  ライフサイクル。

### Node ヘルパーメソッド

- Node は、自動許可チェック向けに現在の Skills 実行ファイルリストを取得するために
  `skills.bins` を呼び出すことができます。

### タスク台帳 RPC

オペレータークライアントは、タスク台帳 RPC を通じて Gateway バックグラウンドタスクレコードを
検査およびキャンセルできます。これらのメソッドは、生のランタイム状態ではなく、
サニタイズ済みタスク要約を返します。

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
    は、ランタイムがキャンセルを受け入れた、または記録したかどうかを報告します。

`TaskSummary` には `id`、`status`、および `kind`、`runtime`、`title`、`agentId`、`sessionKey`、`childSessionKey`、`ownerKey`、
`runId`、`taskId`、`flowId`、`parentTaskId`、`sourceId`、タイムスタンプ、進捗、
終端要約、サニタイズ済みエラーテキストなどの任意のメタデータが含まれます。`agentId` は、タスクを実行しているエージェントを識別します。`sessionKey` と `ownerKey` は、リクエスト元と制御
コンテキストを保持します。

### オペレーターヘルパーメソッド

- オペレーターは `commands.list` (`operator.read`) を呼び出して、エージェントのランタイム
  コマンドインベントリを取得できる。
  - `agentId` は任意。省略するとデフォルトのエージェントワークスペースを読み取る。
  - `scope` は、プライマリ `name` が対象にするサーフェスを制御する:
    - `text` は先頭の `/` を含まないプライマリテキストコマンドトークンを返す
    - `native` とデフォルトの `both` パスは、利用可能な場合にプロバイダー対応のネイティブ名を返す
  - `textAliases` は `/model` や `/m` などの正確なスラッシュエイリアスを保持する。
  - `nativeName` は、存在する場合にプロバイダー対応のネイティブコマンド名を保持する。
  - `provider` は任意で、ネイティブ命名とネイティブPluginコマンドの可用性にのみ影響する。
  - `includeArgs=false` は、シリアライズされた引数メタデータをレスポンスから省略する。
- オペレーターは `tools.catalog` (`operator.read`) を呼び出して、エージェントのランタイムツールカタログを取得できる。レスポンスには、グループ化されたツールと出所メタデータが含まれる:
  - `source`: `core` または `plugin`
  - `pluginId`: `source="plugin"` の場合のPlugin所有者
  - `optional`: Pluginツールが任意かどうか
- オペレーターは `tools.effective` (`operator.read`) を呼び出して、セッションのランタイム有効ツールインベントリを取得できる。
  - `sessionKey` は必須。
  - Gateway は、呼び出し元が指定した認証または配信コンテキストを受け入れる代わりに、信頼済みランタイムコンテキストをセッションからサーバー側で導出する。
  - レスポンスは、コア、Plugin、チャネル、すでに検出済みの MCP サーバーツールを含む、アクティブインベントリのセッションスコープのサーバー導出プロジェクション。
  - `tools.effective` は MCP に対して読み取り専用: ウォームセッションの MCP カタログを最終ツールポリシーを通して投影することはあるが、MCP ランタイムの作成、トランスポートの接続、または `tools/list` の発行は行わない。一致するウォームカタログが存在しない場合、レスポンスには `mcp-not-yet-connected`、`mcp-not-yet-listed`、または `mcp-stale-catalog` などの通知が含まれることがある。
  - 有効ツールエントリは `source="core"`、`source="plugin"`、`source="channel"`、または `source="mcp"` を使用する。
- オペレーターは `tools.invoke` (`operator.write`) を呼び出して、`/tools/invoke` と同じGatewayポリシーパスを通じて、利用可能なツールを1つ実行できる。
  - `name` は必須。`args`、`sessionKey`、`agentId`、`confirm`、`idempotencyKey` は任意。
  - `sessionKey` と `agentId` の両方が存在する場合、解決されたセッションエージェントは `agentId` と一致する必要がある。
  - `cron`、`gateway`、`nodes` などの所有者専用コアラッパーは、`tools.invoke` メソッド自体が `operator.write` であっても、所有者/管理者ID (`operator.admin`) を必要とする。
  - レスポンスは SDK 向けのエンベロープで、`ok`、`toolName`、任意の `output`、型付きの `error` フィールドを含む。承認またはポリシー拒否は、Gatewayツールポリシーパイプラインをバイパスするのではなく、ペイロード内で `ok:false` を返す。
- オペレーターは `skills.status` (`operator.read`) を呼び出して、エージェントに表示される
  Skills インベントリを取得できる。
  - `agentId` は任意。省略するとデフォルトのエージェントワークスペースを読み取る。
  - レスポンスには、適格性、不足している要件、設定チェック、生のシークレット値を公開しないサニタイズ済みインストールオプションが含まれる。
- オペレーターは `skills.search` と `skills.detail` (`operator.read`) を呼び出して、
  ClawHub 検出メタデータを取得できる。
- オペレーターは `skills.upload.begin`、`skills.upload.chunk`、`skills.upload.commit` (`operator.admin`) を呼び出して、インストール前にプライベートSkillアーカイブをステージングできる。これは信頼済みクライアント向けの個別の管理者アップロードパスであり、通常のClawHub Skillインストールフローではなく、`skills.install.allowUploadedArchives` が有効でない限りデフォルトで無効。
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    は、その slug と force 値に紐づいたアップロードを作成する。
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` は、正確なデコード済みオフセットにバイトを追加する。
  - `skills.upload.commit({ uploadId, sha256? })` は、最終サイズと SHA-256 を検証する。コミットはアップロードを確定するだけで、Skillはインストールしない。
  - アップロードされたSkillアーカイブは、ルートに `SKILL.md` を含む zip アーカイブ。アーカイブ内部のディレクトリ名がインストール先を選択することはない。
- オペレーターは `skills.install` (`operator.admin`) を3つのモードで呼び出せる:
  - ClawHub モード: `{ source: "clawhub", slug, version?, force? }` は、
    デフォルトエージェントワークスペースの `skills/` ディレクトリにSkillフォルダーをインストールする。
  - アップロードモード: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    は、コミット済みアップロードをデフォルトエージェントワークスペースの `skills/<slug>` ディレクトリにインストールする。slug と force 値は元の `skills.upload.begin` リクエストと一致する必要がある。このモードは `skills.install.allowUploadedArchives` が有効でない限り拒否される。この設定はClawHubインストールには影響しない。
  - Gateway インストーラーモード: `{ name, installId, timeoutMs? }`
    は、Gatewayホスト上で宣言済みの `metadata.openclaw.install` アクションを実行する。
    古いクライアントは引き続き `dangerouslyForceUnsafeInstall` を送信する場合がある。このフィールドは非推奨で、プロトコル互換性のためにのみ受け入れられ、無視される。オペレーター所有のインストール判断には `security.installPolicy` を使用する。
- オペレーターは `skills.update` (`operator.admin`) を2つのモードで呼び出せる:
  - ClawHub モードは、デフォルトエージェントワークスペース内の追跡対象 slug 1件またはすべての追跡対象 ClawHub インストールを更新する。
  - 設定モードは、`enabled`、`apiKey`、`env` などの `skills.entries.<skillKey>` 値にパッチを適用する。

### `models.list` ビュー

`models.list` は任意の `view` パラメーターを受け入れる:

- 省略または `"default"`: 現在のランタイム動作。`agents.defaults.models` が設定されている場合、レスポンスは許可されたカタログとなり、`provider/*` エントリ向けに動的に検出されたモデルも含まれる。それ以外の場合、レスポンスは完全なGatewayカタログとなる。
- `"configured"`: ピッカーサイズの動作。`agents.defaults.models` が設定されている場合は、`provider/*` エントリ向けのプロバイダースコープ検出を含め、それが引き続き優先される。許可リストがない場合、レスポンスは明示的な `models.providers.*.models` エントリを使用し、設定済みモデル行が存在しない場合にのみ完全なカタログへフォールバックする。
- `"all"`: `agents.defaults.models` をバイパスする完全なGatewayカタログ。通常のモデルピッカーではなく、診断と検出UIに使用する。

## Exec 承認

- exec リクエストに承認が必要な場合、Gateway は `exec.approval.requested` をブロードキャストする。
- オペレータークライアントは `exec.approval.resolve` を呼び出して解決する（`operator.approvals` スコープが必要）。
- `host=node` の場合、`exec.approval.request` には `systemRunPlan`（正規の `argv`/`cwd`/`rawCommand`/セッションメタデータ）を含める必要がある。`systemRunPlan` がないリクエストは拒否される。
- 承認後、転送された `node.invoke system.run` 呼び出しは、その正規の `systemRunPlan` を権威あるコマンド/cwd/セッションコンテキストとして再利用する。
- 呼び出し元が prepare と最終承認済み `system.run` 転送の間に `command`、`rawCommand`、`cwd`、`agentId`、または `sessionKey` を変更した場合、Gateway は変更されたペイロードを信頼せず、その実行を拒否する。

## エージェント配信フォールバック

- `agent` リクエストには、アウトバウンド配信をリクエストするために `deliver=true` を含められる。
- `bestEffortDeliver=false` は厳格な動作を維持する: 解決不能または内部専用の配信先は `INVALID_REQUEST` を返す。
- `bestEffortDeliver=true` は、外部に配信可能なルートを解決できない場合（たとえば内部/webchat セッションや曖昧なマルチチャネル設定）、セッションのみの実行へのフォールバックを許可する。
- 最終的な `agent` 結果には、配信がリクエストされた場合に `result.deliveryStatus` が含まれることがあり、[`openclaw agent --json --deliver`](/ja-JP/cli/agent#json-delivery-status) で文書化されているものと同じ `sent`、`suppressed`、`partial_failed`、`failed` ステータスを使用する。

## バージョニング

- `PROTOCOL_VERSION` は `packages/gateway-protocol/src/version.ts` にある。
- クライアントは `minProtocol` + `maxProtocol` を送信する。サーバーは、現在のプロトコルを含まない範囲を拒否する。現在のクライアントとサーバーはプロトコル v4 を必要とする。
- スキーマとモデルは TypeBox 定義から生成される:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### クライアント定数

`src/gateway/client.ts` のリファレンスクライアントは、これらのデフォルトを使用する。値は
プロトコル v4 全体で安定しており、サードパーティクライアントの想定ベースライン。

| 定数                                      | デフォルト                                            | ソース                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| リクエストタイムアウト（RPCごと）         | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| 事前認証 / 接続チャレンジタイムアウト     | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts`（config/env はペアのサーバー/クライアント予算を引き上げ可能） |
| 初期再接続バックオフ                      | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| 最大再接続バックオフ                      | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| デバイストークンクローズ後の高速リトライ上限 | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` 前の強制停止猶予            | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` デフォルトタイムアウト     | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| デフォルト tick 間隔（`hello-ok` 前）      | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| tick タイムアウトクローズ                 | 無通信が `tickIntervalMs * 2` を超えた場合は code `4000` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

サーバーは有効な `policy.tickIntervalMs`、`policy.maxPayload`、
`policy.maxBufferedBytes` を `hello-ok` で通知する。クライアントはハンドシェイク前のデフォルトではなく、これらの値を尊重する必要がある。

## 認証

- 共有シークレットの Gateway 認証は、設定された認証モードに応じて `connect.params.auth.token` または
  `connect.params.auth.password` を使用します。
- Tailscale Serve
  (`gateway.auth.allowTailscale: true`) や非ループバックの
  `gateway.auth.mode: "trusted-proxy"` など、ID を伴うモードでは、
  `connect.params.auth.*` ではなくリクエストヘッダーから接続認証チェックを満たします。
- プライベートイングレスの `gateway.auth.mode: "none"` は、共有シークレットの接続認証を
  完全にスキップします。このモードを公開または信頼できないイングレスに公開しないでください。
- ペアリング後、Gateway は接続のロール + スコープに限定された**デバイストークン**を発行します。
  これは `hello-ok.auth.deviceToken` で返され、今後の接続のためにクライアントで永続化する必要があります。
- クライアントは、接続が成功するたびに主要な `hello-ok.auth.deviceToken` を永続化する必要があります。
- その**保存済み**デバイストークンで再接続する場合は、そのトークン用に保存された
  承認済みスコープセットも再利用する必要があります。これにより、すでに付与された
  読み取り/プローブ/ステータスアクセスが保持され、再接続が暗黙の管理者専用スコープへ
  静かに狭められることを防ぎます。
- クライアント側の接続認証の組み立て（`src/gateway/client.ts` の
  `selectConnectAuth`）:
  - `auth.password` は直交しており、設定されている場合は常に転送されます。
  - `auth.token` は優先順で設定されます。明示的な共有トークンが最優先で、
    次に明示的な `deviceToken`、その次に保存済みのデバイス別トークン
    （`deviceId` + `role` でキー付け）です。
  - `auth.bootstrapToken` は、上記のいずれも `auth.token` を解決しなかった場合にのみ送信されます。
    共有トークンまたは解決済みのデバイストークンがある場合は抑制されます。
  - 1 回限りの `AUTH_TOKEN_MISMATCH` 再試行で保存済みデバイストークンを自動昇格する処理は、
    **信頼済みエンドポイントのみ**に制限されます。つまり、ループバック、または
    ピン留めされた `tlsFingerprint` を持つ `wss://` です。ピン留めのない公開 `wss://` は
    対象外です。
- 組み込みセットアップコードのブートストラップは、主要ノードの
  `hello-ok.auth.deviceToken` に加え、信頼済みモバイル引き継ぎ用の制限付きオペレータートークンを
  `hello-ok.auth.deviceTokens` で返します。オペレータートークンにはネイティブ Talk 設定読み取り用の
  `operator.talk.secrets` が含まれ、`operator.admin` と `operator.pairing` は除外されます。
- 非ベースラインのセットアップコードブートストラップが承認待ちの間、`PAIRING_REQUIRED`
  の詳細には `recommendedNextStep: "wait_then_retry"`、`retryable: true`、
  `pauseReconnect: false` が含まれます。クライアントは、リクエストが承認されるか
  トークンが無効になるまで、同じブートストラップトークンで再接続を続ける必要があります。
- `hello-ok.auth.deviceTokens` は、接続が `wss://` やループバック/local ペアリングなどの
  信頼済みトランスポート上でブートストラップ認証を使用した場合にのみ永続化してください。
- クライアントが**明示的な** `deviceToken` または明示的な `scopes` を指定した場合、
  その呼び出し元が要求したスコープセットが引き続き権威になります。キャッシュされたスコープは、
  クライアントが保存済みのデバイス別トークンを再利用している場合にのみ再利用されます。
- デバイストークンは `device.token.rotate` と
  `device.token.revoke` でローテーション/失効できます（`operator.pairing` スコープが必要）。
  ノードまたはその他の非オペレーターロールをローテーションまたは失効する場合は、
  `operator.admin` も必要です。
- `device.token.rotate` はローテーションメタデータを返します。置換用ベアラートークンは、
  そのデバイストークンですでに認証済みの同一デバイス呼び出しに対してのみエコーされるため、
  トークンのみのクライアントは再接続前に置換トークンを永続化できます。
  共有/管理者によるローテーションではベアラートークンはエコーされません。
- トークンの発行、ローテーション、失効は、そのデバイスのペアリングエントリに記録された
  承認済みロールセットに制限されます。トークン変更で、ペアリング承認が付与していない
  デバイスロールへ拡張したり対象にしたりすることはできません。
- ペア済みデバイスのトークンセッションでは、呼び出し元が `operator.admin` も持っていない限り、
  デバイス管理は自己スコープに限定されます。非管理者の呼び出し元が管理できるのは、
  **自分の**デバイスエントリのオペレータートークンのみです。ノードおよびその他の
  非オペレータートークンの管理は、呼び出し元自身のデバイスであっても管理者専用です。
- `device.token.rotate` と `device.token.revoke` は、対象オペレータートークンの
  スコープセットを呼び出し元の現在のセッションスコープとも照合します。非管理者の呼び出し元は、
  自分がすでに保持しているより広いオペレータートークンをローテーションまたは失効できません。
- 認証失敗には `error.details.code` と復旧ヒントが含まれます:
  - `error.details.canRetryWithDeviceToken`（boolean）
  - `error.details.recommendedNextStep`（`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`）
- `AUTH_TOKEN_MISMATCH` に対するクライアント動作:
  - 信頼済みクライアントは、キャッシュされたデバイス別トークンで 1 回だけ制限付き再試行を試みることができます。
  - その再試行が失敗した場合、クライアントは自動再接続ループを停止し、オペレーター向けの対応ガイダンスを表示する必要があります。
- `AUTH_SCOPE_MISMATCH` は、デバイストークンは認識されたものの、要求されたロール/スコープを
  カバーしていないことを意味します。クライアントはこれを不正なトークンとして提示せず、
  オペレーターに再ペアリングまたはより狭い/広いスコープ契約の承認を促す必要があります。

## デバイス ID + ペアリング

- ノードは、キーペアのフィンガープリントから派生した安定したデバイス ID（`device.id`）を含める必要があります。
- Gateway はデバイス + ロールごとにトークンを発行します。
- ローカル自動承認が有効でない限り、新しいデバイス ID にはペアリング承認が必要です。
- ペアリングの自動承認は、直接の local loopback 接続を中心にしています。
- OpenClaw には、信頼済み共有シークレットヘルパーフロー用の限定的なバックエンド/コンテナローカル自己接続パスもあります。
- 同一ホストの tailnet または LAN 接続も、ペアリング上は引き続きリモートとして扱われ、
  承認が必要です。
- WS クライアントは通常、`connect` 中に `device` ID を含めます（オペレーター +
  ノード）。デバイスなしのオペレーター例外は、明示的な信頼パスのみです:
  - localhost 専用の安全でない HTTP 互換性のための `gateway.controlUi.allowInsecureAuth=true`。
  - 成功した `gateway.auth.mode: "trusted-proxy"` オペレーター Control UI 認証。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（緊急回避、重大なセキュリティ低下）。
  - 予約済み内部ヘルパーパス上の直接ループバック `gateway-client` バックエンド RPC。
- デバイス ID を省略すると、スコープに影響があります。デバイスなしのオペレーター接続が
  明示的な信頼パスを通じて許可された場合でも、OpenClaw は、そのパスに名前付きの
  スコープ保持例外がない限り、自己申告されたスコープを空セットにクリアします。
  その後、スコープで制限されたメソッドは `missing scope` で失敗します。
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` は、Control UI の
  緊急回避用スコープ保持パスです。任意のカスタムバックエンドや CLI 形式の
  WebSocket クライアントにスコープを付与するものではありません。
- 予約済みの直接ループバック `gateway-client` バックエンドヘルパーパスは、
  内部ローカル制御プレーン RPC に対してのみスコープを保持します。カスタムバックエンド ID は
  この例外を受けません。
- すべての接続は、サーバーが提供する `connect.challenge` nonce に署名する必要があります。

### デバイス認証移行診断

チャレンジ前の署名動作をまだ使用しているレガシークライアントでは、`connect` は現在、
`error.details.code` 配下に `DEVICE_AUTH_*` 詳細コードを、安定した `error.details.reason` とともに返します。

一般的な移行失敗:

| メッセージ                  | details.code                     | details.reason           | 意味                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | クライアントが `device.nonce` を省略しました（または空白を送信しました）。 |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | クライアントが古い/誤った nonce で署名しました。 |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 署名ペイロードが v2 ペイロードと一致しません。 |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 署名済みタイムスタンプが許容スキュー外です。 |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` が公開鍵フィンガープリントと一致しません。 |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開鍵の形式/正規化に失敗しました。 |

移行先:

- 常に `connect.challenge` を待ちます。
- サーバー nonce を含む v2 ペイロードに署名します。
- 同じ nonce を `connect.params.device.nonce` で送信します。
- 推奨される署名ペイロードは `v3` です。これは device/client/role/scopes/token/nonce
  フィールドに加えて、`platform` と `deviceFamily` もバインドします。
- レガシー `v2` 署名は互換性のため引き続き受け入れられますが、再接続時のコマンドポリシーは
  ペア済みデバイスメタデータのピン留めによって引き続き制御されます。

## TLS + ピン留め

- TLS は WS 接続でサポートされています。
- クライアントは任意で gateway 証明書フィンガープリントをピン留めできます（`gateway.tls`
  設定と `gateway.remote.tlsFingerprint` または CLI `--tls-fingerprint` を参照）。

## スコープ

このプロトコルは、**完全な gateway API**（ステータス、チャネル、モデル、チャット、
エージェント、セッション、ノード、承認など）を公開します。正確なサーフェスは
`packages/gateway-protocol/src/schema.ts` の TypeBox スキーマで定義されています。

## 関連

- [ブリッジプロトコル](/ja-JP/gateway/bridge-protocol)
- [Gateway ランブック](/ja-JP/gateway)
