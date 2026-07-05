---
read_when:
    - Gateway WS クライアントの実装または更新
    - プロトコル不一致や接続失敗のデバッグ
    - プロトコルスキーマ/モデルの再生成
summary: 'Gateway WebSocket プロトコル: ハンドシェイク、フレーム、バージョニング'
title: Gateway プロトコル
x-i18n:
    generated_at: "2026-07-05T01:57:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed4f3faff8575be8a4d11c2a1b20421dab961391935e5adc8e9f1c9ceb5fec61
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS プロトコルは、OpenClaw の**単一の制御プレーン + ノードトランスポート**です。すべてのクライアント（CLI、Web UI、macOS アプリ、iOS/Android ノード、ヘッドレスノード）は WebSocket で接続し、ハンドシェイク時に自身の**ロール** + **スコープ**を宣言します。

## トランスポート

- WebSocket、JSON ペイロードを含むテキストフレーム。
- 最初のフレームは**必ず** `connect` リクエストである必要があります。
- 接続前フレームは 64 KiB に制限されます。ハンドシェイク成功後、クライアントは `hello-ok.policy.maxPayload` と `hello-ok.policy.maxBufferedBytes` の制限に従う必要があります。診断が有効な場合、過大な受信フレームと低速な送信バッファーは、Gateway が対象フレームを閉じるか破棄する前に `payload.large` イベントを発行します。これらのイベントはサイズ、制限、サーフェス、安全な理由コードを保持します。メッセージ本文、添付内容、生フレーム本文、トークン、Cookie、シークレット値は保持しません。

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

Gateway がまだ起動サイドカーの完了処理中の場合、`connect` リクエストは `details.reason` が `"startup-sidecars"` に設定され、`retryAfterMs` を含む、再試行可能な `UNAVAILABLE` エラーを返すことがあります。クライアントは、そのレスポンスを終端的なハンドシェイク失敗として表示するのではなく、全体の接続予算内で再試行する必要があります。

`server`、`features`、`snapshot`、`policy` はすべてスキーマ（`packages/gateway-protocol/src/schema/frames.ts`）で必須です。`auth` も必須で、ネゴシエートされたロール/スコープを報告します。`pluginSurfaceUrls` は任意で、`canvas` などの Plugin サーフェス名をスコープ付きホスト URL にマッピングします。

スコープ付き Plugin サーフェス URL は期限切れになることがあります。ノードは `node.pluginSurface.refresh` を `{ "surface": "canvas" }` とともに呼び出して、`pluginSurfaceUrls` 内の新しいエントリを受け取れます。実験的な Canvas Plugin リファクタリングは、非推奨の `canvasHostUrl`、`canvasCapability`、または `node.canvas.capability.refresh` 互換パスをサポートしません。現在のネイティブクライアントとゲートウェイは Plugin サーフェスを使用する必要があります。

デバイストークンが発行されない場合、`hello-ok.auth` はトークンフィールドなしで、ネゴシエートされた権限を報告します。

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

信頼された同一プロセスのバックエンドクライアント（`client.id: "gateway-client"`、`client.mode: "backend"`）は、共有 Gateway トークン/パスワードで認証する直接ループバック接続では `device` を省略できます。このパスは内部制御プレーン RPC 用に予約されており、古い CLI/デバイスペアリングベースラインによって、サブエージェントセッション更新などのローカルバックエンド作業がブロックされないようにします。リモートクライアント、ブラウザーオリジンのクライアント、ノードクライアント、明示的なデバイストークン/デバイス ID クライアントは、引き続き通常のペアリングとスコープ昇格チェックを使用します。

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

組み込みの QR/セットアップコードブートストラップは、新しいモバイル引き渡しパスです。ベースラインのセットアップコード接続が成功すると、プライマリノードトークンに加えて、範囲が限定されたオペレータートークンが 1 つ返されます。

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

オペレーターの引き渡しは意図的に範囲が限定されているため、QR オンボーディングはペアリング変更スコープや `operator.admin` を付与せずに、モバイルオペレーターループを開始し、ネイティブセットアップを完了できます。これには `operator.talk.secrets` が含まれるため、ネイティブクライアントはブートストラップ後に必要な Talk 設定を読み取れます。より広いペアリング権限と管理者アクセスには、別途承認されたオペレーターペアリングまたはトークンフローが必要です。クライアントは、接続が `wss://` やループバック/local ペアリングなどの信頼されたトランスポート上でブートストラップ認証を使用した場合にのみ、`hello-ok.auth.deviceTokens` を永続化する必要があります。

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

副作用を伴うメソッドには**冪等性キー**が必要です（スキーマを参照）。

## ロール + スコープ

完全なオペレータースコープモデル、承認時チェック、共有シークレットのセマンティクスについては、[オペレータースコープ](/ja-JP/gateway/operator-scopes) を参照してください。

### ロール

- `operator` = 制御プレーンクライアント（CLI/UI/自動化）。
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
シークレットが含まれる場合、クライアントはアクティブな Talk プロバイダー認証情報を `talk.resolved.config.apiKey` から読み取る必要があります。`talk.providers.<id>.apiKey` はソース形状のままで、SecretRef オブジェクトまたは編集済み文字列である可能性があります。

Plugin 登録の Gateway RPC メソッドは独自のオペレータースコープを要求できますが、予約済みのコア管理プレフィックス（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は常に `operator.admin` に解決されます。

メソッドスコープは最初のゲートにすぎません。`chat.send` 経由で到達する一部のスラッシュコマンドは、その上でより厳格なコマンドレベルのチェックを適用します。たとえば、永続的な `/config set` と `/config unset` の書き込みには `operator.admin` が必要です。

`node.pair.approve` には、基本メソッドスコープに加えて、承認時の追加スコープチェックもあります。

- コマンドなしリクエスト: `operator.pairing`
- 非 exec ノードコマンドを含むリクエスト: `operator.pairing` + `operator.write`
- `system.run`、`system.run.prepare`、または `system.which` を含むリクエスト:
  `operator.pairing` + `operator.admin`

### 機能/コマンド/権限（ノード）

ノードは接続時に機能要求を宣言します。

- `caps`: `camera`、`canvas`、`screen`、`location`、`voice`、`talk` などの高レベル機能カテゴリ。
- `commands`: invoke 用のコマンド許可リスト。
- `permissions`: 細かなトグル（例: `screen.record`、`camera.capture`）。

Gateway はこれらを**要求**として扱い、サーバー側の許可リストを適用します。

## プレゼンス

- `system-presence` はデバイス ID をキーとするエントリを返します。
- プレゼンスエントリには `deviceId`、`roles`、`scopes` が含まれるため、UI はデバイスが**オペレーター**と**ノード**の両方として接続している場合でも、デバイスごとに 1 行を表示できます。
- `node.list` には任意の `lastSeenAtMs` と `lastSeenReason` フィールドが含まれます。接続中のノードは現在の接続時刻を `lastSeenAtMs` として、理由 `connect` とともに報告します。ペアリング済みノードは、信頼されたノードイベントがペアリングメタデータを更新した場合、永続的なバックグラウンドプレゼンスも報告できます。

### ノードバックグラウンド alive イベント

ノードは `event: "node.presence.alive"` を指定して `node.event` を呼び出し、ペアリング済みノードがバックグラウンドウェイク中に生存していたことを、接続済みとしてマークせずに記録できます。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` は閉じた enum です: `background`、`silent_push`、`bg_app_refresh`、`significant_location`、`manual`、または `connect`。不明な trigger 文字列は、永続化前にゲートウェイによって `background` に正規化されます。このイベントは認証済みノードデバイスセッションでのみ永続化されます。デバイスなしまたは未ペアリングのセッションは `handled: false` を返します。

成功したゲートウェイは構造化された結果を返します。

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

古いゲートウェイは `node.event` に対してまだ `{ "ok": true }` を返すことがあります。クライアントはそれを永続的なプレゼンス永続化としてではなく、承認済み RPC として扱う必要があります。

## ブロードキャストイベントのスコープ制御

サーバーからプッシュされる WebSocket ブロードキャストイベントはスコープでゲートされるため、ペアリングスコープのセッションやノード専用セッションがセッション内容を受動的に受信することはありません。

- **チャット、エージェント、ツール結果フレーム**（ストリーミングされた `agent` イベントとツール呼び出し結果を含む）には、少なくとも `operator.read` が必要です。`operator.read` のないセッションは、これらのフレームを完全にスキップします。
- **Plugin 定義の `plugin.*` ブロードキャスト**は、Plugin が登録した方法に応じて `operator.write` または `operator.admin` にゲートされます。
- **ステータスおよびトランスポートイベント**（`heartbeat`、`presence`、`tick`、接続/切断ライフサイクルなど）は、すべての認証済みセッションがトランスポートの健全性を観測できるように、制限なしのままです。
- **不明なブロードキャストイベントファミリー**は、登録済みハンドラーが明示的に緩和しない限り、デフォルトでスコープゲートされます（fail-closed）。

各クライアント接続は独自のクライアントごとのシーケンス番号を保持するため、異なるクライアントがイベントストリームの異なるスコープフィルター済みサブセットを見る場合でも、ブロードキャストはそのソケット上で単調順序を維持します。

## 一般的な RPC メソッドファミリー

公開 WS サーフェスは、上記のハンドシェイク/認証例よりも広範です。これは生成されたダンプではありません。`hello-ok.features.methods` は、`src/gateway/server-methods-list.ts` と、読み込まれた Plugin/チャネルメソッドエクスポートから構築された保守的な検出リストです。`src/gateway/server-methods/*.ts` の完全な列挙ではなく、機能検出として扱ってください。

  <AccordionGroup>
  <Accordion title="システムとアイデンティティ">
    - `health` は、キャッシュ済みまたは新たにプローブされた Gateway ヘルススナップショットを返します。
    - `diagnostics.stability` は、最近の上限付き診断安定性レコーダーを返します。イベント名、回数、バイトサイズ、メモリ読み取り値、キュー/セッション状態、チャンネル/Plugin 名、セッション ID などの運用メタデータを保持します。チャット本文、Webhook 本文、ツール出力、生のリクエスト本文またはレスポンス本文、トークン、Cookie、シークレット値は保持しません。オペレーター読み取りスコープが必要です。
    - `status` は、`/status` 形式の Gateway サマリーを返します。機密フィールドは、管理者スコープのオペレータークライアントにのみ含まれます。
    - `gateway.identity.get` は、リレーおよびペアリングフローで使用される Gateway デバイス ID を返します。
    - `system-presence` は、接続済みオペレーター/ノードデバイスの現在のプレゼンススナップショットを返します。
    - `system-event` は、システムイベントを追加し、プレゼンスコンテキストを更新/ブロードキャストできます。
    - `last-heartbeat` は、最後に永続化された Heartbeat イベントを返します。
    - `set-heartbeats` は、Gateway 上の Heartbeat 処理を切り替えます。

  </Accordion>

  <Accordion title="モデルと使用量">
    - `models.list` は、ランタイムで許可されているモデルカタログを返します。ピッカー向けの構成済みモデル（最初に `agents.defaults.models`、次に `models.providers.*.models`）には `{ "view": "configured" }` を渡し、完全なカタログには `{ "view": "all" }` を渡します。
    - `usage.status` は、プロバイダー使用量ウィンドウ/残りクォータのサマリーを返します。
    - `usage.cost` は、日付範囲の集計コスト使用量サマリーを返します。
      1 つのエージェントには `agentId` を渡し、構成済みエージェントを集計するには `agentScope: "all"` を渡します。
    - `doctor.memory.status` は、アクティブなデフォルトエージェントワークスペースのベクトルメモリ/キャッシュ済み埋め込みの準備状態を返します。呼び出し元がライブ埋め込みプロバイダーの ping を明示的に必要としている場合にのみ、`{ "probe": true }` または `{ "deep": true }` を渡します。Dreaming 対応クライアントは、Dreaming ストア統計を選択したエージェントワークスペースにスコープするために `{ "agentId": "agent-id" }` も渡せます。`agentId` を省略すると、デフォルトエージェントのフォールバックが維持され、構成済み Dreaming ワークスペースが集計されます。
    - `doctor.memory.dreamDiary`、`doctor.memory.backfillDreamDiary`、`doctor.memory.resetDreamDiary`、`doctor.memory.resetGroundedShortTerm`、`doctor.memory.repairDreamingArtifacts`、`doctor.memory.dedupeDreamDiary` は、選択したエージェントの Dreaming ビュー/アクション向けに任意の `{ "agentId": "agent-id" }` パラメーターを受け付けます。`agentId` が省略された場合、構成済みのデフォルトエージェントワークスペースで動作します。
    - `doctor.memory.remHarness` は、リモート制御プレーンクライアント向けに、上限付きの読み取り専用 REM ハーネスプレビューを返します。ワークスペースパス、メモリスニペット、レンダリング済みの根拠付き Markdown、深いプロモーション候補を含められるため、呼び出し元には `operator.read` が必要です。
    - `sessions.usage` は、セッションごとの使用量サマリーを返します。1 つの
      エージェントには `agentId` を渡し、構成済みエージェントをまとめて一覧表示するには `agentScope: "all"` を渡します。
    - `sessions.usage.timeseries` は、1 セッションの時系列使用量を返します。
    - `sessions.usage.logs` は、1 セッションの使用量ログエントリを返します。

  </Accordion>

  <Accordion title="チャンネルとログインヘルパー">
    - `channels.status` は、組み込み + バンドル済みチャンネル/Plugin の状態サマリーを返します。
    - `channels.logout` は、チャンネルがログアウトに対応している場合、特定のチャンネル/アカウントからログアウトします。
    - `web.login.start` は、現在の QR 対応 Web チャンネルプロバイダーの QR/Web ログインフローを開始します。
    - `web.login.wait` は、その QR/Web ログインフローの完了を待ち、成功時にチャンネルを開始します。
    - `push.test` は、登録済み iOS ノードにテスト APNs プッシュを送信します。
    - `voicewake.get` は、保存済みのウェイクワードトリガーを返します。
    - `voicewake.set` は、ウェイクワードトリガーを更新し、変更をブロードキャストします。

  </Accordion>

  <Accordion title="メッセージングとログ">
    - `send` は、チャットランナー外でのチャンネル/アカウント/スレッド指定送信用の直接アウトバウンド配信 RPC です。
    - `logs.tail` は、カーソル/上限および最大バイト数制御付きで、構成済み Gateway ファイルログの末尾を返します。

  </Accordion>

  <Accordion title="オペレーターターミナル">
    - `terminal.open` は、明示的な `agentId` またはデフォルトエージェント用にホスト PTY を開始し、解決済みエージェント、作業ディレクトリ、シェル、閉じ込め状態を返します。
    - `terminal.input`、`terminal.resize`、`terminal.close` は、呼び出し元接続が所有するセッションに対してのみ動作します。
    - `terminal.data` および `terminal.exit` イベントは、セッションを所有する接続にのみストリーミングされます。
    - 接続が切断されたセッションは強制終了されず、デタッチされます。`gateway.terminal.detachedSessionTimeoutSeconds`（デフォルト 300、`0` で切断時強制終了を復元）の間は再アタッチ可能なままで、最近の出力は上限付きサーバー側バッファに蓄積されます。
    - `terminal.list` はアタッチ可能なセッションを返します。`terminal.attach` は、ライブまたはデタッチ済みセッションを呼び出し元接続に再バインドし、リプレイバッファを返します（tmux 形式の引き継ぎ — 以前のライブ所有者は理由 `detached` の `terminal.exit` を受け取ります）。`terminal.text` は、アタッチせずにバッファをプレーンテキストとして読み取ります。
    - すべてのターミナルメソッドには `operator.admin` が必要です。`gateway.terminal.enabled` は明示的に true である必要があります。完全にサンドボックス化されたエージェントは拒否され、エージェントポリシーの変更により、既存および進行中の PTY が、デタッチ済みのものも含めて閉じられます。

  </Accordion>

  <Accordion title="Talk と TTS">
    - `talk.catalog` は、音声、ストリーミング文字起こし、リアルタイム音声向けの読み取り専用 Talk プロバイダーカタログを返します。正規プロバイダー ID、レジストリエイリアス、ラベル、構成状態、任意のグループレベル `ready` 結果、公開モデル/音声 ID、正規モード、トランスポート、ブレイン戦略、リアルタイム音声/機能フラグを含みますが、プロバイダーシークレットを返したりグローバル設定を変更したりしません。現在の Gateway は、ランタイムプロバイダー選択の適用後に `ready` を設定します。クライアントは、古い Gateway との互換性のため、それが存在しない場合は未検証として扱う必要があります。
    - `talk.config` は、有効な Talk 設定ペイロードを返します。`includeSecrets` には `operator.talk.secrets`（または `operator.admin`）が必要です。
    - `talk.session.create` は、`realtime/gateway-relay`、`transcription/gateway-relay`、または `stt-tts/managed-room` 用に Gateway 所有の Talk セッションを作成します。`stt-tts/managed-room` では、`sessionKey` を渡す `operator.write` 呼び出し元は、スコープ付きセッションキー可視性のために `spawnedBy` も渡す必要があります。スコープなしの `sessionKey` 作成および `brain: "direct-tools"` には `operator.admin` が必要です。
    - `talk.session.join` は、管理ルームセッショントークンを検証し、必要に応じて `session.ready` または `session.replaced` イベントを発行し、プレーンテキストトークンや保存済みトークンハッシュを含めずにルーム/セッションメタデータと最近の Talk イベントを返します。
    - `talk.session.appendAudio` は、Gateway 所有のリアルタイムリレーおよび文字起こしセッションに base64 PCM 入力音声を追加します。
    - `talk.session.startTurn`、`talk.session.endTurn`、`talk.session.cancelTurn` は、状態がクリアされる前に古いターンを拒否しながら、管理ルームのターンライフサイクルを駆動します。
    - `talk.session.cancelOutput` は、主に Gateway リレーセッションでの VAD ゲート付き割り込み用に、アシスタント音声出力を停止します。
    - `talk.session.submitToolResult` は、Gateway 所有のリアルタイムリレーセッションによって発行されたプロバイダーツール呼び出しを完了します。最終結果が後続する中間ツール出力には `options: { willContinue: true }` を渡し、別のリアルタイムアシスタント応答を開始せずにツール結果でプロバイダー呼び出しを満たす場合は `options: { suppressResponse: true }` を渡します。
    - `talk.session.steer` は、Gateway 所有のエージェント支援 Talk セッションにアクティブ実行の音声制御を送信します。`{ sessionId, text, mode? }` を受け付けます。ここで `mode` は `status`、`steer`、`cancel`、または `followup` です。省略されたモードは発話テキストから分類されます。
    - `talk.session.close` は、Gateway 所有のリレー、文字起こし、または管理ルームセッションを閉じ、終端 Talk イベントを発行します。
    - `talk.mode` は、WebChat/Control UI クライアント向けに現在の Talk モード状態を設定/ブロードキャストします。
    - `talk.client.create` は、Gateway が設定、認証情報、指示、ツールポリシーを所有したまま、`webrtc` または `provider-websocket` を使用してクライアント所有のリアルタイムプロバイダーセッションを作成します。
    - `talk.client.toolCall` により、クライアント所有のリアルタイムトランスポートは、プロバイダーツール呼び出しを Gateway ポリシーに転送できます。最初に対応するツールは `openclaw_agent_consult` です。クライアントは実行 ID を受け取り、プロバイダー固有のツール結果を送信する前に通常のチャットライフサイクルイベントを待ちます。
    - `talk.client.steer` は、クライアント所有のリアルタイムトランスポート向けにアクティブ実行の音声制御を送信します。Gateway は `sessionKey` からアクティブな埋め込み実行を解決し、ステアリングを黙って破棄する代わりに、構造化された承認/拒否結果を返します。
    - `talk.event` は、リアルタイム、文字起こし、STT/TTS、管理ルーム、電話、会議アダプター向けの単一の Talk イベントチャンネルです。
    - `talk.speak` は、アクティブな Talk 音声プロバイダーを通じて音声を合成します。
    - `tts.status` は、TTS の有効状態、アクティブプロバイダー、フォールバックプロバイダー、プロバイダー設定状態を返します。
    - `tts.providers` は、表示可能な TTS プロバイダーインベントリを返します。
    - `tts.enable` および `tts.disable` は、TTS 設定状態を切り替えます。
    - `tts.setProvider` は、優先 TTS プロバイダーを更新します。
    - `tts.convert` は、単発のテキスト読み上げ変換を実行します。

  </Accordion>

  <Accordion title="シークレット、設定、更新、ウィザード">
    - `secrets.reload` はアクティブな SecretRef を再解決し、完全に成功した場合にのみランタイムのシークレット状態を差し替えます。
    - `secrets.resolve` は、特定のコマンド/ターゲットセットに対するコマンド対象のシークレット割り当てを解決します。
    - `config.get` は現在の設定スナップショットとハッシュを返します。
    - `config.set` は検証済みの設定ペイロードを書き込みます。
    - `config.patch` は部分的な設定更新をマージします。破壊的な配列
      置換には、影響を受けるパスを `replacePaths` に含める必要があります。配列エントリ
      配下のネストされた配列は、`agents.list[].skills` のような `[]` パスを使用します。
    - `config.apply` は完全な設定ペイロードを検証して置き換えます。
    - `config.schema` は Control UI と CLI ツールで使用されるライブ設定スキーマペイロードを返します。内容は、スキーマ、`uiHints`、バージョン、生成メタデータで、ランタイムが読み込める場合は Plugin + チャンネルのスキーマメタデータも含みます。このスキーマには、UI で使用されるものと同じラベルおよびヘルプテキストから派生したフィールド `title` / `description` メタデータが含まれます。該当するフィールドドキュメントが存在する場合は、ネストされたオブジェクト、ワイルドカード、配列項目、`anyOf` / `oneOf` / `allOf` の合成ブランチも含まれます。
    - `config.schema.lookup` は、1 つの設定パスに対するパススコープのルックアップペイロードを返します。内容は、正規化済みパス、浅いスキーマノード、一致したヒント + `hintPath`、任意の `reloadKind`、および UI/CLI のドリルダウン用の直近の子サマリーです。`reloadKind` は `restart`、`hot`、`none` のいずれかで、要求されたパスに対する Gateway 設定リロードプランナーを反映します。ルックアップスキーマノードは、ユーザー向けドキュメントと一般的な検証フィールド（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、数値/文字列/配列/オブジェクトの境界、および `additionalProperties`、`deprecated`、`readOnly`、`writeOnly` のようなフラグ）を保持します。子サマリーは、`key`、正規化済み `path`、`type`、`required`、`hasChildren`、任意の `reloadKind`、さらに一致した `hint` / `hintPath` を公開します。
    - `update.run` は Gateway 更新フローを実行し、更新自体が成功した場合にのみ再起動をスケジュールします。セッションを持つ呼び出し元は `continuationMessage` を含めることができ、起動時に再起動継続キューを通じて後続のエージェントターンを 1 回再開できます。制御プレーンからのパッケージマネージャー更新と監督付き git チェックアウト更新は、ライブ Gateway 内でパッケージツリーを置き換えたりチェックアウト/ビルド出力を変更したりする代わりに、切り離された管理サービスへの引き渡しを使用します。開始された引き渡しは、`result.reason: "managed-service-handoff-started"` および `handoff.status: "started"` とともに `ok: true` を返します。利用不可または失敗した引き渡しは、`managed-service-handoff-unavailable` または `managed-service-handoff-failed` とともに `ok: false` を返し、手動のシェル更新が必要な場合は `handoff.command` も返します。引き渡しが利用不可であるとは、OpenClaw に安全なスーパーバイザー境界または永続的なサービス ID がないことを意味します。たとえば systemd 向けの `OPENCLAW_SYSTEMD_UNIT` です。開始された引き渡しの間、再起動センチネルは一時的に `stats.reason: "restart-health-pending"` を報告する場合があります。継続は、CLI が再起動後の Gateway を検証し、最終的な `ok` センチネルを書き込むまで遅延されます。
    - `update.status` は、利用可能な場合は再起動後の実行中バージョンを含め、最新の更新再起動センチネルを更新して返します。
    - `wizard.start`、`wizard.next`、`wizard.status`、`wizard.cancel` は、WS RPC 経由でオンボーディングウィザードを公開します。

  </Accordion>

  <Accordion title="エージェントとワークスペースのヘルパー">
    - `agents.list` は、実効モデルとランタイムメタデータを含む、設定済みのエージェントエントリを返します。
    - `agents.create`、`agents.update`、`agents.delete` は、エージェントレコードとワークスペース配線を管理します。
    - `agents.files.list`、`agents.files.get`、`agents.files.set` は、エージェントに公開されるブートストラップワークスペースファイルを管理します。
    - `tasks.list`、`tasks.get`、`tasks.cancel` は、Gateway タスク台帳を SDK とオペレータークライアントに公開します。
    - `artifacts.list`、`artifacts.get`、`artifacts.download` は、明示的な `sessionKey`、`runId`、または `taskId` スコープに対して、トランスクリプト由来のアーティファクトサマリーとダウンロードを公開します。実行クエリとタスククエリは、所有セッションをサーバー側で解決し、一致する来歴を持つトランスクリプトメディアのみを返します。安全でない URL ソースやローカル URL ソースは、サーバー側で取得する代わりに未サポートのダウンロードを返します。
    - `environments.list` と `environments.status` は、SDK クライアント向けに読み取り専用の Gateway ローカル環境とノード環境の検出を公開します。
    - `agent.identity.get` は、エージェントまたはセッションに対する実効アシスタント ID を返します。
    - `agent.wait` は実行の完了を待機し、利用可能な場合は終端スナップショットを返します。

  </Accordion>

  <Accordion title="セッション制御">
    - `sessions.list` は現在のセッションインデックスを返します。エージェントランタイムバックエンドが設定されている場合は、行ごとの `agentRuntime` メタデータも含まれます。
    - `sessions.subscribe` と `sessions.unsubscribe` は、現在の WS クライアントに対するセッション変更イベントのサブスクリプションを切り替えます。
    - `sessions.messages.subscribe` と `sessions.messages.unsubscribe` は、1 つのセッションに対するトランスクリプト/メッセージイベントのサブスクリプションを切り替えます。
    - `sessions.preview` は、特定のセッションキーに対する境界付きトランスクリプトプレビューを返します。
    - `sessions.describe` は、完全一致のセッションキーに対する 1 つの Gateway セッション行を返します。
    - `sessions.resolve` は、セッションターゲットを解決または正準化します。
    - `sessions.create` は新しいセッションエントリを作成します。
    - `sessions.send` は既存のセッションにメッセージを送信します。
    - `sessions.steer` は、アクティブなセッション向けの割り込みおよび操舵バリアントです。
    - `sessions.abort` は、セッションのアクティブな作業を中止します。呼び出し元は、`key` と任意の `runId` を渡すことも、Gateway がセッションに解決できるアクティブな実行について `runId` だけを渡すこともできます。
    - `sessions.patch` はセッションメタデータ/オーバーライドを更新し、解決された正準モデルと実効 `agentRuntime` を報告します。
    - `sessions.reset`、`sessions.delete`、`sessions.compact` はセッション保守を実行します。
    - `sessions.get` は、保存されている完全なセッション行を返します。
    - チャット実行は引き続き `chat.history`、`chat.send`、`chat.abort`、`chat.inject` を使用します。`chat.history` は UI クライアント向けに表示正規化されます。インラインディレクティブタグは可視テキストから除去され、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）と、漏出した ASCII/全角のモデル制御トークンは除去されます。正確な `NO_REPLY` / `no_reply` のような純粋なサイレントトークンのアシスタント行は省略され、過大な行はプレースホルダーに置き換えられる場合があります。
    - `chat.message.get` は、単一の可視トランスクリプトエントリ向けに追加された、境界付きの完全メッセージリーダーです。クライアントは `sessionKey`、セッション選択がエージェントスコープの場合は任意の `agentId`、さらに `chat.history` で以前に表面化されたトランスクリプト `messageId` を渡します。Gateway は、保存済みエントリがまだ利用可能で過大でない場合、軽量履歴の切り詰め上限なしで、同じ表示正規化済み投影を返します。
    - `chat.send` は、1 ターンの `fastMode: "auto"` を受け付け、自動カットオフ前に開始されたモデル呼び出しには高速モードを使用し、その後のリトライ、フォールバック、ツール結果、または継続呼び出しは高速モードなしで開始します。カットオフの既定値は 60 秒で、`agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` によりモデルごとに設定できます。`chat.send` の呼び出し元は、1 ターンの `fastAutoOnSeconds` を渡して、そのリクエストのカットオフを上書きできます。

  </Accordion>

  <Accordion title="デバイスペアリングとデバイストークン">
    - `device.pair.list` は、保留中および承認済みのペアリング済みデバイスを返します。
    - `device.pair.setupCode` は、モバイルセットアップコードと、既定では PNG QR データ URL を作成します。`operator.admin` が必要で、広告される検出からは意図的に省略されています。結果には、`setupCode`、任意の `qrDataUrl`、`gatewayUrl`、シークレットではない `auth` ラベル、`urlSource` が含まれます。
    - `device.pair.approve`、`device.pair.reject`、`device.pair.remove` は、デバイスペアリングレコードを管理します。
    - `device.token.rotate` は、承認済みロールと呼び出し元スコープの境界内で、ペアリング済みデバイストークンをローテーションします。
    - `device.token.revoke` は、承認済みロールと呼び出し元スコープの境界内で、ペアリング済みデバイストークンを取り消します。

    セットアップコードには、短命のブートストラップ資格情報が埋め込まれています。クライアントは、ペアリングフローを超えて
    それをログに記録したり永続化したりしてはなりません。

  </Accordion>

  <Accordion title="ノードペアリング、呼び出し、保留中の作業">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove`、`node.pair.verify` は、ノードペアリングとブートストラップ検証を扱います。
    - `node.list` と `node.describe` は、既知/接続済みノードの状態を返します。
    - `node.rename` は、ペアリング済みノードのラベルを更新します。
    - `node.invoke` は、接続済みノードにコマンドを転送します。
    - `node.invoke.result` は、呼び出しリクエストの結果を返します。
    - `node.event` は、ノード発のイベントを Gateway に戻します。
    - `node.pending.pull` と `node.pending.ack` は、接続済みノードキュー API です。
    - `node.pending.enqueue` と `node.pending.drain` は、オフライン/切断済みノード向けの永続的な保留作業を管理します。

  </Accordion>

  <Accordion title="承認ファミリー">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list`、`exec.approval.resolve` は、単発の exec 承認リクエストと保留中承認の検索/再生を扱います。
    - `exec.approval.waitDecision` は、1 つの保留中 exec 承認を待機し、最終判断（またはタイムアウト時に `null`）を返します。
    - `exec.approvals.get` と `exec.approvals.set` は、Gateway の exec 承認ポリシースナップショットを管理します。
    - `exec.approvals.node.get` と `exec.approvals.node.set` は、ノードリレーコマンド経由でノードローカルの exec 承認ポリシーを管理します。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision`、`plugin.approval.resolve` は、Pluginで定義された承認フローを扱います。

  </Accordion>

  <Accordion title="自動化、Skills、ツール">
    - 自動化: `wake` は即時または次回 Heartbeat のウェイクテキスト注入をスケジュールします。`cron.get`、`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` はスケジュール済み作業を管理します。
    - `cron.run` は、手動実行向けのキュー投入型 RPC のままです。完了セマンティクスが必要なクライアントは、返された `runId` を読み取り、`cron.runs` をポーリングする必要があります。
    - `cron.runs` は、任意の空でない `runId` フィルターを受け付けます。これにより、クライアントは同じジョブの他の履歴エントリと競合せずに、1 つのキュー投入済み手動実行を追跡できます。
    - Skills とツール: `commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。

  </Accordion>
</AccordionGroup>

### 一般的なイベントファミリー

- `chat`: `chat.inject` などの UI チャット更新、およびその他のトランスクリプト専用チャット
  イベントです。プロトコル v4 では、デルタペイロードは `deltaText` を保持し、`message` は累積の
  アシスタントスナップショットのままです。非プレフィックス置換は `replace=true` を設定し、
  `deltaText` を置換テキストとして使用します。
- `session.message`、`session.operation`、`session.tool`: サブスクライブ済み
  セッションのトランスクリプト、実行中セッション操作、イベントストリーム更新です。
- `sessions.changed`: セッションインデックスまたはメタデータが変更されました。
- `presence`: システムプレゼンススナップショット更新です。
- `tick`: 定期的なキープアライブ / ライブネスイベントです。
- `health`: Gateway ヘルススナップショット更新です。
- `heartbeat`: Heartbeat イベントストリーム更新です。
- `cron`: Cron 実行/ジョブ変更イベントです。
- `shutdown`: Gateway シャットダウン通知です。
- `node.pair.requested` / `node.pair.resolved`: ノードペアリングのライフサイクルです。
- `node.invoke.request`: ノード呼び出しリクエストのブロードキャストです。
- `device.pair.requested` / `device.pair.resolved`: ペアリング済みデバイスのライフサイクルです。
- `voicewake.changed`: ウェイクワードトリガー設定が変更されました。
- `exec.approval.requested` / `exec.approval.resolved`: exec 承認
  ライフサイクルです。
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin 承認
  ライフサイクルです。

### ノードヘルパーメソッド

- ノードは、自動許可チェック用のスキル実行ファイルの現在の一覧を取得するために、
  `skills.bins` を呼び出せます。

### タスク台帳 RPCs

オペレータークライアントは、タスク台帳 RPC を通じて Gateway のバックグラウンドタスクレコードを検査し、キャンセルできます。これらのメソッドは、生のランタイム状態ではなく、サニタイズ済みのタスク要約を返します。

- `tasks.list` には `operator.read` が必要です。
  - パラメーター: 任意の `status` (`"queued"`、`"running"`、`"completed"`、
    `"failed"`、`"cancelled"`、または `"timed_out"`) またはそれらのステータスの配列、
    任意の `agentId`、任意の `sessionKey`、`1` から `500` までの任意の `limit`、
    および任意の文字列 `cursor`。
  - 結果: `{ "tasks": TaskSummary[], "nextCursor"?: string }`。
- `tasks.get` には `operator.read` が必要です。
  - パラメーター: `{ "taskId": string }`。
  - 結果: `{ "task": TaskSummary }`。
  - 存在しないタスク ID は、Gateway の not-found エラー形式を返します。
- `tasks.cancel` には `operator.write` が必要です。
  - パラメーター: `{ "taskId": string, "reason"?: string }`。
  - 結果:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`。
  - `found` は、台帳に一致するタスクがあったかどうかを示します。`cancelled`
    は、ランタイムがキャンセルを受け入れたか、または記録したかどうかを示します。

`TaskSummary` には、`id`、`status`、および `kind`、`runtime`、`title`、`agentId`、`sessionKey`、`childSessionKey`、`ownerKey`、`runId`、`taskId`、`flowId`、`parentTaskId`、`sourceId`、タイムスタンプ、進捗、終端要約、サニタイズ済みエラーテキストなどの任意のメタデータが含まれます。`agentId` はタスクを実行しているエージェントを識別します。`sessionKey` と `ownerKey` は、要求元と制御コンテキストを保持します。

### オペレーターヘルパーメソッド

- オペレーターは `commands.list` (`operator.read`) を呼び出して、エージェントのランタイムコマンドインベントリを取得できます。
  - `agentId` は任意です。既定のエージェントワークスペースを読み取るには省略します。
  - `scope` は、プライマリ `name` が対象とするサーフェスを制御します。
    - `text` は、先頭の `/` を除いたプライマリテキストコマンドトークンを返します
    - `native` と既定の `both` パスは、利用可能な場合にプロバイダー対応のネイティブ名を返します
  - `textAliases` は、`/model` や `/m` などの正確なスラッシュエイリアスを保持します。
  - `nativeName` は、存在する場合にプロバイダー対応のネイティブコマンド名を保持します。
  - `provider` は任意で、ネイティブ名付けとネイティブ Plugin コマンドの可用性にのみ影響します。
  - `includeArgs=false` は、シリアライズ済みの引数メタデータをレスポンスから省略します。
- オペレーターは `tools.catalog` (`operator.read`) を呼び出して、エージェントのランタイムツールカタログを取得できます。レスポンスには、グループ化されたツールと来歴メタデータが含まれます。
  - `source`: `core` または `plugin`
  - `pluginId`: `source="plugin"` の場合の Plugin 所有者
  - `optional`: Plugin ツールが任意かどうか
- オペレーターは `tools.effective` (`operator.read`) を呼び出して、セッションのランタイム有効ツールインベントリを取得できます。
  - `sessionKey` は必須です。
  - Gateway は、呼び出し元から提供された認証または配信コンテキストを受け入れる代わりに、セッションから信頼済みランタイムコンテキストをサーバー側で導出します。
  - レスポンスは、アクティブなインベントリのセッションスコープのサーバー導出プロジェクションであり、コア、Plugin、チャネル、およびすでに検出済みの MCP サーバーツールを含みます。
  - `tools.effective` は MCP に対して読み取り専用です。ウォームセッションの MCP カタログを最終ツールポリシーを通じて投影する場合がありますが、MCP ランタイムを作成したり、トランスポートに接続したり、`tools/list` を発行したりはしません。一致するウォームカタログが存在しない場合、レスポンスには `mcp-not-yet-connected`、`mcp-not-yet-listed`、または `mcp-stale-catalog` などの通知が含まれることがあります。
  - 有効ツールエントリは、`source="core"`、`source="plugin"`、`source="channel"`、または `source="mcp"` を使用します。
- オペレーターは `tools.invoke` (`operator.write`) を呼び出して、`/tools/invoke` と同じ Gateway ポリシーパスを通じて、利用可能なツールを 1 つ起動できます。
  - `name` は必須です。`args`、`sessionKey`、`agentId`、`confirm`、および `idempotencyKey` は任意です。
  - `sessionKey` と `agentId` の両方が存在する場合、解決されたセッションエージェントは `agentId` と一致している必要があります。
  - `cron`、`gateway`、`nodes` などの所有者専用コアラッパーには、`tools.invoke` メソッド自体が `operator.write` であっても、所有者/管理者 ID (`operator.admin`) が必要です。
  - レスポンスは、`ok`、`toolName`、任意の `output`、および型付きの `error` フィールドを持つ SDK 向けエンベロープです。承認またはポリシーによる拒否は、Gateway ツールポリシーパイプラインをバイパスするのではなく、ペイロード内で `ok:false` を返します。
- オペレーターは `skills.status` (`operator.read`) を呼び出して、エージェントに表示される Skills インベントリを取得できます。
  - `agentId` は任意です。既定のエージェントワークスペースを読み取るには省略します。
  - レスポンスには、適格性、不足している要件、設定チェック、および生のシークレット値を公開しないサニタイズ済みインストールオプションが含まれます。
- オペレーターは `skills.search` と `skills.detail` (`operator.read`) を呼び出して、ClawHub 検出メタデータを取得できます。
- オペレーターは `skills.upload.begin`、`skills.upload.chunk`、および `skills.upload.commit` (`operator.admin`) を呼び出して、インストール前にプライベートスキルアーカイブをステージングできます。これは信頼済みクライアント向けの別個の管理者アップロードパスであり、通常の ClawHub スキルインストールフローではありません。また、`skills.install.allowUploadedArchives` が有効でない限り、既定では無効です。
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    は、その slug と force 値に紐付いたアップロードを作成します。
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` は、正確なデコード済みオフセットにバイトを追加します。
  - `skills.upload.commit({ uploadId, sha256? })` は、最終サイズと SHA-256 を検証します。コミットはアップロードを確定するだけで、スキルはインストールしません。
  - アップロードされたスキルアーカイブは、ルートに `SKILL.md` を含む zip アーカイブです。アーカイブ内部のディレクトリ名がインストール先を選択することはありません。
- オペレーターは `skills.install` (`operator.admin`) を 3 つのモードで呼び出せます。
  - ClawHub モード: `{ source: "clawhub", slug, version?, force? }` は、スキルフォルダーを既定のエージェントワークスペースの `skills/` ディレクトリにインストールします。
  - アップロードモード: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    は、コミット済みアップロードを既定のエージェントワークスペースの `skills/<slug>`
    ディレクトリにインストールします。slug と force 値は、元の `skills.upload.begin` 要求と一致している必要があります。このモードは、`skills.install.allowUploadedArchives` が有効でない限り拒否されます。この設定は ClawHub インストールには影響しません。
  - Gateway インストーラーモード: `{ name, installId, timeoutMs? }`
    は、Gateway ホスト上で宣言済みの `metadata.openclaw.install` アクションを実行します。古いクライアントはまだ `dangerouslyForceUnsafeInstall` を送信する場合があります。このフィールドは非推奨で、プロトコル互換性のためにのみ受け入れられ、無視されます。オペレーター所有のインストール判断には `security.installPolicy` を使用します。
- オペレーターは `skills.update` (`operator.admin`) を 2 つのモードで呼び出せます。
  - ClawHub モードは、既定のエージェントワークスペース内の追跡対象 slug 1 つ、または追跡対象のすべての ClawHub インストールを更新します。
  - 設定モードは、`enabled`、`apiKey`、`env` などの `skills.entries.<skillKey>` 値にパッチを適用します。

### `models.list` ビュー

`models.list` は任意の `view` パラメーターを受け入れます。

- 省略または `"default"`: 現在のランタイム動作です。`agents.defaults.models` が設定されている場合、レスポンスは許可されたカタログになり、`provider/*` エントリ用に動的に検出されたモデルも含まれます。それ以外の場合、レスポンスは完全な Gateway カタログです。
- `"configured"`: ピッカー向けサイズの動作です。`agents.defaults.models` が設定されている場合、`provider/*` エントリ用のプロバイダースコープ検出を含め、それが引き続き優先されます。許可リストがない場合、レスポンスは明示的な `models.providers.*.models` エントリを使用し、設定済みモデル行が存在しない場合にのみ完全なカタログへフォールバックします。
- `"all"`: `agents.defaults.models` をバイパスした完全な Gateway カタログです。通常のモデルピッカーではなく、診断および検出 UI に使用します。

## Exec 承認

- exec 要求に承認が必要な場合、Gateway は `exec.approval.requested` をブロードキャストします。
- オペレータークライアントは `exec.approval.resolve` を呼び出して解決します (`operator.approvals` スコープが必要です)。
- `host=node` の場合、`exec.approval.request` には `systemRunPlan` (正規の `argv`/`cwd`/`rawCommand`/セッションメタデータ) を含める必要があります。`systemRunPlan` がない要求は拒否されます。
- 承認後、転送される `node.invoke system.run` 呼び出しは、その正規の `systemRunPlan` を信頼できる command/cwd/セッションコンテキストとして再利用します。
- 呼び出し元が準備から最終承認済みの `system.run` 転送までの間に `command`、`rawCommand`、`cwd`、`agentId`、または `sessionKey` を変更した場合、Gateway は変更されたペイロードを信頼せず、その実行を拒否します。

## エージェント配信フォールバック

- `agent` 要求には、アウトバウンド配信を要求するために `deliver=true` を含めることができます。
- `bestEffortDeliver=false` は厳格な動作を維持します。解決できない、または内部専用の配信先は `INVALID_REQUEST` を返します。
- `bestEffortDeliver=true` は、外部に配信可能なルートを解決できない場合に、セッションのみの実行へのフォールバックを許可します (たとえば内部/webchat セッションや曖昧なマルチチャネル設定)。
- 最終的な `agent` 結果には、配信が要求された場合に `result.deliveryStatus` が含まれることがあります。これは [`openclaw agent --json --deliver`](/ja-JP/cli/agent#json-delivery-status) で文書化されているものと同じ `sent`、`suppressed`、`partial_failed`、および `failed` ステータスを使用します。

## バージョニング

- `PROTOCOL_VERSION` は `packages/gateway-protocol/src/version.ts` にあります。
- クライアントは `minProtocol` + `maxProtocol` を送信します。サーバーは、現在のプロトコルを含まない範囲を拒否します。現在のクライアントとサーバーはプロトコル v4 を必要とします。
- スキーマとモデルは TypeBox 定義から生成されます。
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### クライアント定数

`src/gateway/client.ts` のリファレンスクライアントはこれらの既定値を使用します。値はプロトコル v4 全体で安定しており、サードパーティクライアントに期待されるベースラインです。

| 定数                                      | デフォルト                                           | ソース                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| リクエストタイムアウト（RPC ごと）        | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| 事前認証 / 接続チャレンジのタイムアウト  | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts`（config/env で対応するサーバー/クライアントの予算を引き上げ可能） |
| 初回再接続バックオフ                      | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| 最大再接続バックオフ                      | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| デバイストークンによるクローズ後の高速リトライの上限 | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` 前の強制停止猶予            | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` のデフォルトタイムアウト  | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| デフォルトの tick 間隔（`hello-ok` 前）   | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| tick タイムアウトによるクローズ           | 無音状態が `tickIntervalMs * 2` を超えると code `4000` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

サーバーは有効な `policy.tickIntervalMs`、`policy.maxPayload`、
`policy.maxBufferedBytes` を `hello-ok` で通知します。クライアントは
ハンドシェイク前のデフォルトではなく、それらの値に従う必要があります。

## 認証

- 共有シークレットの Gateway 認証は、設定された認証モードに応じて
  `connect.params.auth.token` または `connect.params.auth.password` を使用します。
- Tailscale Serve（`gateway.auth.allowTailscale: true`）や非ループバックの
  `gateway.auth.mode: "trusted-proxy"` などの ID を持つモードでは、
  `connect.params.auth.*` ではなくリクエストヘッダーから接続認証チェックを満たします。
- プライベート入口の `gateway.auth.mode: "none"` は、共有シークレットの接続認証を
  完全にスキップします。このモードを公開または信頼できない入口に公開しないでください。
- ペアリング後、Gateway は接続ロール + スコープに限定された**デバイストークン**を発行します。
  これは `hello-ok.auth.deviceToken` で返され、クライアントは将来の接続のために永続化する必要があります。
- クライアントは、接続が成功するたびに主要な `hello-ok.auth.deviceToken` を永続化する必要があります。
- その**保存済み**デバイストークンで再接続する場合、そのトークン用に保存された
  承認済みスコープセットも再利用する必要があります。これにより、すでに付与された
  読み取り/プローブ/ステータスアクセスが保持され、再接続が暗黙の admin のみの
  より狭いスコープへ静かに縮退することを避けられます。
- クライアント側の接続認証組み立て（`src/gateway/client.ts` の `selectConnectAuth`）:
  - `auth.password` は独立しており、設定されている場合は常に転送されます。
  - `auth.token` は優先順位に従って設定されます。明示的な共有トークンが最優先で、
    次に明示的な `deviceToken`、その次に保存済みのデバイス別トークン（`deviceId` + `role` でキー化）です。
  - `auth.bootstrapToken` は、上記のいずれでも `auth.token` が解決されなかった場合にのみ送信されます。
    共有トークンまたは解決済みの任意のデバイストークンがある場合は抑制されます。
  - ワンショットの `AUTH_TOKEN_MISMATCH` リトライで保存済みデバイストークンを自動昇格する処理は、
    **信頼済みエンドポイントのみ**に制限されます。つまり、ループバック、または固定された
    `tlsFingerprint` を持つ `wss://` です。ピン留めされていない公開 `wss://` は該当しません。
- 組み込みのセットアップコードブートストラップは、主要ノードの
  `hello-ok.auth.deviceToken` と、信頼済みモバイル引き継ぎ用の範囲限定 operator トークンを
  `hello-ok.auth.deviceTokens` で返します。operator トークンにはネイティブ Talk 設定読み取り用の
  `operator.talk.secrets` が含まれますが、ペアリング変更スコープと `operator.admin` は除外されます。
- 非ベースラインのセットアップコードブートストラップが承認を待っている間、`PAIRING_REQUIRED`
  の details には `recommendedNextStep: "wait_then_retry"`、`retryable: true`、
  `pauseReconnect: false` が含まれます。クライアントは、リクエストが承認されるかトークンが無効になるまで、
  同じブートストラップトークンで再接続を続ける必要があります。
- `hello-ok.auth.deviceTokens` は、接続が `wss://` やループバック/local ペアリングなどの
  信頼済みトランスポートでブートストラップ認証を使用した場合にのみ永続化してください。
- クライアントが**明示的な** `deviceToken` または明示的な `scopes` を指定した場合、
  その呼び出し元が要求したスコープセットが引き続き権威を持ちます。キャッシュ済みスコープは、
  クライアントが保存済みのデバイス別トークンを再利用している場合にのみ再利用されます。
- デバイストークンは `device.token.rotate` と `device.token.revoke` でローテーション/失効できます
  （`operator.pairing` スコープが必要）。ノードまたはその他の非 operator ロールをローテーションまたは
  失効するには、`operator.admin` も必要です。
- `device.token.rotate` はローテーションメタデータを返します。置換後の bearer トークンをエコーするのは、
  そのデバイストークンですでに認証済みの同一デバイス呼び出しの場合のみです。これにより、トークンのみの
  クライアントは再接続前に置換トークンを永続化できます。共有/admin ローテーションでは bearer トークンをエコーしません。
- トークンの発行、ローテーション、失効は、そのデバイスのペアリングエントリに記録された承認済みロールセットに
  制限されます。トークン変更によって、ペアリング承認で付与されていないデバイスロールへ拡張したり対象化したりすることはできません。
- ペア済みデバイストークンセッションでは、呼び出し元が `operator.admin` も持っていない限り、
  デバイス管理は自己スコープになります。非 admin の呼び出し元が管理できるのは、
  **自分自身の**デバイスエントリの operator トークンのみです。ノードやその他の非 operator トークン管理は、
  呼び出し元自身のデバイスであっても admin のみです。
- `device.token.rotate` と `device.token.revoke` は、対象 operator トークンのスコープセットも
  呼び出し元の現在のセッションスコープと照合します。非 admin の呼び出し元は、自身がすでに持っているものより
  広い operator トークンをローテーションまたは失効できません。
- 認証失敗には、`error.details.code` と復旧ヒントが含まれます:
  - `error.details.canRetryWithDeviceToken`（boolean）
  - `error.details.recommendedNextStep`（`retry_with_device_token`、`update_auth_configuration`、`update_auth_credentials`、`wait_then_retry`、`review_auth_configuration`）
- `AUTH_TOKEN_MISMATCH` に対するクライアントの動作:
  - 信頼済みクライアントは、キャッシュ済みのデバイス別トークンで 1 回だけ範囲限定リトライを試行できます。
  - そのリトライが失敗した場合、クライアントは自動再接続ループを停止し、operator の対応ガイダンスを表示する必要があります。
- `AUTH_SCOPE_MISMATCH` は、デバイストークンは認識されたものの、要求されたロール/スコープを
  カバーしていないことを意味します。クライアントはこれを不正なトークンとして提示せず、
  operator に再ペアリング、またはより狭い/広いスコープ契約の承認を促す必要があります。

## デバイス ID + ペアリング

- ノードは、キーペアのフィンガープリントから導出した安定したデバイス ID（`device.id`）を含める必要があります。
- Gateway はデバイス + ロールごとにトークンを発行します。
- local 自動承認が有効でない限り、新しいデバイス ID にはペアリング承認が必要です。
- ペアリングの自動承認は、直接の local loopback 接続を中心にしています。
- OpenClaw には、信頼済み共有シークレットのヘルパーフロー向けに、狭いバックエンド/コンテナ local 自己接続パスもあります。
- 同一ホストの tailnet または LAN 接続も、ペアリングでは引き続きリモートとして扱われ、承認が必要です。
- WS クライアントは通常、`connect` 中に `device` ID（operator + ノード）を含めます。
  デバイスなしの operator 例外は、明示的な信頼パスのみです:
  - localhost のみの安全でない HTTP 互換性のための `gateway.controlUi.allowInsecureAuth=true`。
  - 成功した `gateway.auth.mode: "trusted-proxy"` operator Control UI 認証。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（緊急避難、重大なセキュリティ低下）。
  - 予約済み内部ヘルパーパス上の direct-loopback `gateway-client` バックエンド RPC。
- デバイス ID を省略すると、スコープに影響があります。デバイスなしの operator 接続が明示的な信頼パスで許可された場合でも、
  OpenClaw は、そのパスに名前付きのスコープ保持例外がない限り、自己申告されたスコープを空セットにクリアします。
  その後、スコープで保護されたメソッドは `missing scope` で失敗します。
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` は、Control UI の緊急避難用スコープ保持パスです。
  任意のカスタムバックエンドや CLI 形式の WebSocket クライアントにスコープを付与するものではありません。
- 予約済み direct-loopback `gateway-client` バックエンドヘルパーパスは、内部 local コントロールプレーン RPC に対してのみ
  スコープを保持します。カスタムバックエンド ID はこの例外を受け取りません。
- すべての接続は、サーバーから提供された `connect.challenge` nonce に署名する必要があります。

### デバイス認証移行診断

チャレンジ前署名の動作をまだ使用しているレガシークライアント向けに、`connect` は現在、
安定した `error.details.reason` とともに `error.details.code` の下で `DEVICE_AUTH_*` detail code を返します。

一般的な移行失敗:

| メッセージ                | details.code                     | details.reason           | 意味                                               |
| ------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`   | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | クライアントが `device.nonce` を省略した（または空で送信した）。 |
| `device nonce mismatch`   | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | クライアントが古い/誤った nonce で署名した。       |
| `device signature invalid` | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 署名ペイロードが v2 ペイロードと一致しない。      |
| `device signature expired` | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 署名済みタイムスタンプが許容 skew の範囲外。      |
| `device identity mismatch` | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` が公開鍵フィンガープリントと一致しない。 |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開鍵の形式/正規化に失敗した。                   |

移行先:

- 必ず `connect.challenge` を待ちます。
- サーバー nonce を含む v2 ペイロードに署名します。
- 同じ nonce を `connect.params.device.nonce` で送信します。
- 推奨される署名ペイロードは `v3` です。これは、device/client/role/scopes/token/nonce フィールドに加えて
  `platform` と `deviceFamily` をバインドします。
- レガシー `v2` 署名は互換性のために引き続き受け入れられますが、再接続時のコマンドポリシーは
  ペア済みデバイスメタデータのピン留めによって引き続き制御されます。

## TLS + ピン留め

- WS 接続では TLS がサポートされています。
- クライアントは必要に応じて Gateway 証明書フィンガープリントをピン留めできます
  （`gateway.tls` config と `gateway.remote.tlsFingerprint`、または CLI `--tls-fingerprint` を参照）。

## スコープ

このプロトコルは、**完全な Gateway API**（ステータス、チャンネル、モデル、チャット、
エージェント、セッション、ノード、承認など）を公開します。正確なサーフェスは
`packages/gateway-protocol/src/schema.ts` の TypeBox スキーマで定義されています。

## 関連

- [ブリッジプロトコル](/ja-JP/gateway/bridge-protocol)
- [Gateway ランブック](/ja-JP/gateway)
