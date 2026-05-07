---
read_when:
    - Gateway WS クライアントの実装または更新
    - プロトコルの不一致や接続失敗のデバッグ
    - プロトコルスキーマ/モデルの再生成
summary: 'Gateway WebSocket プロトコル: ハンドシェイク、フレーム、バージョニング'
title: Gateway プロトコル
x-i18n:
    generated_at: "2026-05-07T13:18:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75580b3ad8b2a511cf53975b8d734d18db88bcbfe33bd62c360c24333d65d1c6
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS プロトコルは、OpenClaw の**単一のコントロールプレーン + ノードトランスポート**です。すべてのクライアント（CLI、Web UI、macOS アプリ、iOS/Android ノード、ヘッドレスノード）は WebSocket で接続し、ハンドシェイク時に自身の**ロール** + **スコープ**を宣言します。

## トランスポート

- WebSocket、JSON ペイロードを含むテキストフレーム。
- 最初のフレームは**必ず** `connect` リクエストである必要があります。
- 接続前フレームは 64 KiB に制限されます。ハンドシェイクが成功した後、クライアントは `hello-ok.policy.maxPayload` と `hello-ok.policy.maxBufferedBytes` の制限に従う必要があります。診断が有効な場合、サイズ超過の受信フレームと遅い送信バッファは、gateway が閉じるか対象フレームを破棄する前に `payload.large` イベントを送出します。これらのイベントは、サイズ、制限、サーフェス、安全な理由コードを保持します。メッセージ本文、添付ファイルの内容、生フレーム本文、トークン、Cookie、秘密値は保持しません。

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

Gateway がまだ起動時サイドカーの完了処理中の場合、`connect` リクエストは `details.reason` が `"startup-sidecars"` に設定され、`retryAfterMs` を含む、再試行可能な `UNAVAILABLE` エラーを返すことがあります。クライアントはこれを終端的なハンドシェイク失敗として表示するのではなく、自身の全体的な接続予算内で再試行する必要があります。

`server`、`features`、`snapshot`、`policy` はすべてスキーマ（`src/gateway/protocol/schema/frames.ts`）で必須です。`auth` も必須で、ネゴシエートされたロール/スコープを報告します。`pluginSurfaceUrls` は任意で、`canvas` などの plugin サーフェス名を、スコープ付きのホスト URL にマッピングします。

スコープ付き Plugin サーフェス URL は期限切れになることがあります。ノードは `node.pluginSurface.refresh` を `{ "surface": "canvas" }` とともに呼び出し、`pluginSurfaceUrls` の新しいエントリを受け取れます。実験的な Canvas Plugin リファクタリングは、非推奨の `canvasHostUrl`、`canvasCapability`、または `node.canvas.capability.refresh` 互換パスをサポートしません。現在のネイティブクライアントと gateways は Plugin サーフェスを使用する必要があります。

デバイストークンが発行されない場合、`hello-ok.auth` はトークンフィールドなしで、ネゴシエートされた権限を報告します。

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

信頼された同一プロセスのバックエンドクライアント（`client.id: "gateway-client"`、`client.mode: "backend"`）は、共有 gateway トークン/パスワードで認証する直接ループバック接続では `device` を省略できます。このパスは内部コントロールプレーン RPC 用に予約されており、古い CLI/デバイスペアリングのベースラインが、サブエージェントセッション更新などのローカルバックエンド作業を妨げないようにします。リモートクライアント、ブラウザ由来クライアント、ノードクライアント、明示的なデバイストークン/デバイス ID クライアントは、引き続き通常のペアリングとスコープアップグレードチェックを使用します。

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

信頼されたブートストラップのハンドオフ中、`hello-ok.auth` には `deviceTokens` 内に追加の境界付きロールエントリが含まれることもあります。

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

組み込みのノード/operator ブートストラップフローでは、プライマリノードトークンは `scopes: []` のままで、ハンドオフされた operator トークンはブートストラップ operator の許可リスト（`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`）に制限されたままです。ブートストラップスコープチェックはロール接頭辞付きのままです。operator エントリは operator リクエストだけを満たし、operator 以外のロールには引き続き自身のロール接頭辞配下のスコープが必要です。

### ノード例

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

## フレーミング

- **リクエスト**: `{type:"req", id, method, params}`
- **レスポンス**: `{type:"res", id, ok, payload|error}`
- **イベント**: `{type:"event", event, payload, seq?, stateVersion?}`

副作用を持つメソッドには**冪等性キー**が必要です（スキーマを参照）。

## ロール + スコープ

operator スコープモデル全体、承認時チェック、共有シークレットのセマンティクスについては、[operator スコープ](/ja-JP/gateway/operator-scopes)を参照してください。

### ロール

- `operator` = コントロールプレーンクライアント（CLI/UI/自動化）。
- `node` = ケイパビリティホスト（camera/screen/canvas/system.run）。

### スコープ（operator）

一般的なスコープ:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` を伴う `talk.config` には `operator.talk.secrets`（または `operator.admin`）が必要です。

Plugin 登録の gateway RPC メソッドは独自の operator スコープを要求できますが、予約済みのコア管理接頭辞（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は常に `operator.admin` に解決されます。

メソッドスコープは最初のゲートにすぎません。`chat.send` を通じて到達する一部のスラッシュコマンドは、その上により厳格なコマンドレベルチェックを適用します。たとえば、永続的な `/config set` と `/config unset` の書き込みには `operator.admin` が必要です。

`node.pair.approve` には、基本メソッドスコープに加えて、承認時の追加スコープチェックもあります。

- コマンドなしリクエスト: `operator.pairing`
- 非 exec ノードコマンドを含むリクエスト: `operator.pairing` + `operator.write`
- `system.run`、`system.run.prepare`、または `system.which` を含むリクエスト: `operator.pairing` + `operator.admin`

### ケイパビリティ/コマンド/権限（ノード）

ノードは接続時にケイパビリティ要求を宣言します。

- `caps`: `camera`、`canvas`、`screen`、`location`、`voice`、`talk` などの高レベルなケイパビリティカテゴリ。
- `commands`: invoke 用のコマンド許可リスト。
- `permissions`: 細かなトグル（例: `screen.record`、`camera.capture`）。

Gateway はこれらを**要求**として扱い、サーバー側の許可リストを強制します。

## プレゼンス

- `system-presence` はデバイス ID をキーにしたエントリを返します。
- プレゼンスエントリには `deviceId`、`roles`、`scopes` が含まれるため、UI は同じデバイスが **operator** と **node** の両方として接続している場合でも、デバイスごとに単一の行を表示できます。
- `node.list` には任意の `lastSeenAtMs` と `lastSeenReason` フィールドが含まれます。接続中のノードは、現在の接続時刻を `lastSeenAtMs` として、理由 `connect` とともに報告します。ペアリング済みノードは、信頼されたノードイベントがペアリングメタデータを更新した場合、永続的なバックグラウンドプレゼンスも報告できます。

### ノードバックグラウンド alive イベント

ノードは `event: "node.presence.alive"` とともに `node.event` を呼び出し、ペアリング済みノードが接続済みとしてマークされることなく、バックグラウンドウェイク中に alive だったことを記録できます。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` は閉じた列挙型です: `background`、`silent_push`、`bg_app_refresh`、`significant_location`、`manual`、または `connect`。未知の trigger 文字列は、永続化の前に gateway によって `background` に正規化されます。このイベントは、認証済みノードデバイスセッションに対してのみ永続的です。デバイスなし、または未ペアリングのセッションは `handled: false` を返します。

成功した gateways は構造化された結果を返します。

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

古い gateways は `node.event` に対して `{ "ok": true }` を返す場合があります。クライアントはこれを永続的なプレゼンス永続化ではなく、確認済み RPC として扱う必要があります。

## ブロードキャストイベントのスコープ制御

サーバーからプッシュされる WebSocket ブロードキャストイベントはスコープでゲートされるため、ペアリングスコープのみ、またはノード専用のセッションがセッション内容を受動的に受信することはありません。

- **チャット、エージェント、ツール結果フレーム**（ストリーミングされた `agent` イベントやツール呼び出し結果を含む）には少なくとも `operator.read` が必要です。`operator.read` のないセッションは、これらのフレームを完全にスキップします。
- **Plugin 定義の `plugin.*` ブロードキャスト**は、Plugin がそれらをどのように登録したかに応じて、`operator.write` または `operator.admin` にゲートされます。
- **ステータスとトランスポートイベント**（`heartbeat`、`presence`、`tick`、接続/切断ライフサイクルなど）は、トランスポートの健全性をすべての認証済みセッションが観測できるよう、制限なしのままです。
- **未知のブロードキャストイベントファミリー**は、登録済みハンドラーが明示的に緩和しない限り、デフォルトでスコープゲートされます（フェイルクローズ）。

各クライアント接続は自身のクライアントごとのシーケンス番号を保持するため、異なるクライアントがイベントストリームのスコープフィルター済みサブセットを見ている場合でも、ブロードキャストはそのソケット上で単調な順序を維持します。

## 一般的な RPC メソッドファミリー

公開 WS サーフェスは、上記のハンドシェイク/認証例よりも広範です。これは生成されたダンプではありません。`hello-ok.features.methods` は、`src/gateway/server-methods-list.ts` に加え、ロード済みの Plugin/channel メソッドエクスポートから構築される保守的な検出リストです。これは機能検出として扱い、`src/gateway/server-methods/*.ts` の完全な列挙として扱わないでください。

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` はキャッシュ済みまたは新しくプローブした gateway ヘルススナップショットを返します。
    - `diagnostics.stability` は、最近の境界付き診断安定性レコーダーを返します。イベント名、カウント、バイトサイズ、メモリ読み取り値、キュー/セッション状態、channel/Plugin 名、セッション ID などの運用メタデータを保持します。チャットテキスト、webhook 本文、ツール出力、生のリクエストまたはレスポンス本文、トークン、Cookie、秘密値は保持しません。operator read スコープが必要です。
    - `status` は `/status` 形式の gateway サマリーを返します。機密フィールドは admin スコープの operator クライアントにのみ含まれます。
    - `gateway.identity.get` は、relay とペアリングフローで使用される gateway デバイス ID を返します。
    - `system-presence` は、接続中の operator/node デバイスの現在のプレゼンススナップショットを返します。
    - `system-event` はシステムイベントを追加し、プレゼンスコンテキストを更新/ブロードキャストできます。
    - `last-heartbeat` は、永続化された最新の Heartbeat イベントを返します。
    - `set-heartbeats` は gateway 上の Heartbeat 処理を切り替えます。

  </Accordion>

  <Accordion title="モデルと使用状況">
    - `models.list` は、ランタイムで許可されたモデルカタログを返します。ピッカー向けサイズの設定済みモデル（最初に `agents.defaults.models`、次に `models.providers.*.models`）には `{ "view": "configured" }` を渡し、完全なカタログには `{ "view": "all" }` を渡します。
    - `usage.status` は、プロバイダーの使用状況ウィンドウと残りクォータの要約を返します。
    - `usage.cost` は、日付範囲に対する集計済みコスト使用状況の要約を返します。
    - `doctor.memory.status` は、アクティブな既定エージェントワークスペースのベクトルメモリ / キャッシュ済み埋め込みの準備状態を返します。呼び出し元がライブ埋め込みプロバイダーへの ping を明示的に必要としている場合にのみ、`{ "probe": true }` または `{ "deep": true }` を渡します。
    - `doctor.memory.remHarness` は、リモート制御プレーンのクライアント向けに、境界付きの読み取り専用 REM ハーネスプレビューを返します。ワークスペースパス、メモリスニペット、レンダリング済みの根拠付き Markdown、深い昇格候補を含められるため、呼び出し元には `operator.read` が必要です。
    - `sessions.usage` は、セッションごとの使用状況要約を返します。
    - `sessions.usage.timeseries` は、1 つのセッションの時系列使用状況を返します。
    - `sessions.usage.logs` は、1 つのセッションの使用状況ログエントリを返します。

  </Accordion>

  <Accordion title="チャンネルとログインヘルパー">
    - `channels.status` は、組み込み + バンドルされたチャンネル/Plugin のステータス要約を返します。
    - `channels.logout` は、チャンネルがログアウトに対応している場合に、特定のチャンネル/アカウントをログアウトします。
    - `web.login.start` は、現在の QR 対応 Web チャンネルプロバイダー用の QR/Web ログインフローを開始します。
    - `web.login.wait` は、その QR/Web ログインフローが完了するのを待ち、成功時にチャンネルを開始します。
    - `push.test` は、登録済み iOS ノードにテスト APNs プッシュを送信します。
    - `voicewake.get` は、保存されたウェイクワードトリガーを返します。
    - `voicewake.set` は、ウェイクワードトリガーを更新し、その変更をブロードキャストします。

  </Accordion>

  <Accordion title="メッセージングとログ">
    - `send` は、チャットランナーの外部で、チャンネル/アカウント/スレッドを対象に送信するための直接アウトバウンド配信 RPC です。
    - `logs.tail` は、カーソル/制限と最大バイト制御付きで、設定済み Gateway ファイルログの末尾を返します。

  </Accordion>

  <Accordion title="Talk と TTS">
    - `talk.catalog` は、音声、ストリーミング文字起こし、リアルタイム音声向けの読み取り専用 Talk プロバイダーカタログを返します。プロバイダー ID、ラベル、設定状態、公開されているモデル/音声 ID、正規モード、トランスポート、ブレイン戦略、リアルタイムオーディオ/機能フラグを含みますが、プロバイダーシークレットを返したりグローバル設定を変更したりはしません。
    - `talk.config` は、有効な Talk 設定ペイロードを返します。`includeSecrets` には `operator.talk.secrets`（または `operator.admin`）が必要です。
    - `talk.session.create` は、`realtime/gateway-relay`、`transcription/gateway-relay`、または `stt-tts/managed-room` 用に Gateway 所有の Talk セッションを作成します。`brain: "direct-tools"` には `operator.admin` が必要です。
    - `talk.session.join` は、管理ルームのセッショントークンを検証し、必要に応じて `session.ready` または `session.replaced` イベントを発行し、平文トークンや保存済みトークンハッシュを含めずに、ルーム/セッションのメタデータと最近の Talk イベントを返します。
    - `talk.session.appendAudio` は、Gateway 所有のリアルタイムリレーおよび文字起こしセッションに base64 PCM 入力音声を追加します。
    - `talk.session.startTurn`、`talk.session.endTurn`、`talk.session.cancelTurn` は、状態がクリアされる前に古いターンを拒否しながら、管理ルームのターンライフサイクルを駆動します。
    - `talk.session.cancelOutput` は、主に Gateway リレーセッションで VAD により制御される割り込みのために、アシスタント音声出力を停止します。
    - `talk.session.submitToolResult` は、Gateway 所有のリアルタイムリレーセッションから発行されたプロバイダーツール呼び出しを完了します。
    - `talk.session.close` は、Gateway 所有のリレー、文字起こし、または管理ルームのセッションを閉じ、終端 Talk イベントを発行します。
    - `talk.mode` は、WebChat/Control UI クライアント向けに現在の Talk モード状態を設定/ブロードキャストします。
    - `talk.client.create` は、Gateway が設定、認証情報、指示、ツールポリシーを所有したまま、`webrtc` または `provider-websocket` を使用してクライアント所有のリアルタイムプロバイダーセッションを作成します。
    - `talk.client.toolCall` は、クライアント所有のリアルタイムトランスポートが、プロバイダーツール呼び出しを Gateway ポリシーへ転送できるようにします。最初に対応するツールは `openclaw_agent_consult` です。クライアントは run ID を受け取り、プロバイダー固有のツール結果を送信する前に通常のチャットライフサイクルイベントを待ちます。
    - `talk.event` は、リアルタイム、文字起こし、STT/TTS、管理ルーム、テレフォニー、会議アダプターのための単一の Talk イベントチャンネルです。
    - `talk.speak` は、アクティブな Talk 音声プロバイダーを通じて音声を合成します。
    - `tts.status` は、TTS の有効状態、アクティブプロバイダー、フォールバックプロバイダー、プロバイダー設定状態を返します。
    - `tts.providers` は、表示可能な TTS プロバイダー一覧を返します。
    - `tts.enable` と `tts.disable` は、TTS 設定状態を切り替えます。
    - `tts.setProvider` は、優先 TTS プロバイダーを更新します。
    - `tts.convert` は、単発のテキスト読み上げ変換を実行します。

  </Accordion>

  <Accordion title="シークレット、設定、更新、ウィザード">
    - `secrets.reload` は、アクティブな SecretRef を再解決し、完全に成功した場合にのみランタイムのシークレット状態を入れ替えます。
    - `secrets.resolve` は、特定のコマンド/ターゲットセットに対するコマンド対象のシークレット割り当てを解決します。
    - `config.get` は、現在の設定スナップショットとハッシュを返します。
    - `config.set` は、検証済みの設定ペイロードを書き込みます。
    - `config.patch` は、部分的な設定更新をマージします。
    - `config.apply` は、完全な設定ペイロードを検証して置き換えます。
    - `config.schema` は、Control UI と CLI ツールが使用するライブ設定スキーマペイロードを返します。スキーマ、`uiHints`、バージョン、生成メタデータに加え、ランタイムが読み込める場合は Plugin + チャンネルのスキーマメタデータを含みます。このスキーマには、UI で使用される同じラベルとヘルプテキストから派生したフィールド `title` / `description` メタデータが含まれます。対応するフィールドドキュメントが存在する場合、ネストしたオブジェクト、ワイルドカード、配列項目、`anyOf` / `oneOf` / `allOf` 構成ブランチも含まれます。
    - `config.schema.lookup` は、1 つの設定パスに対するパススコープの検索ペイロードを返します。正規化パス、浅いスキーマノード、一致したヒント + `hintPath`、UI/CLI ドリルダウン用の直下の子要約を含みます。検索スキーマノードは、ユーザー向けドキュメントと一般的な検証フィールド（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、数値/文字列/配列/オブジェクトの境界、および `additionalProperties`、`deprecated`、`readOnly`、`writeOnly` などのフラグ）を保持します。子要約は、`key`、正規化済み `path`、`type`、`required`、`hasChildren` に加え、一致した `hint` / `hintPath` を公開します。
    - `update.run` は、Gateway 更新フローを実行し、更新自体が成功した場合にのみ再起動をスケジュールします。セッションを持つ呼び出し元は `continuationMessage` を含められるため、起動後に再起動継続キューを通じて 1 回の後続エージェントターンを再開できます。パッケージマネージャーによる更新では、パッケージ入れ替え後に非延期かつクールダウンなしの更新再起動を強制し、古い Gateway プロセスが置き換え済みの `dist` ツリーから遅延読み込みを続けないようにします。
    - `update.status` は、利用可能な場合は再起動後に実行中のバージョンを含め、最新のキャッシュ済み更新再起動センチネルを返します。
    - `wizard.start`、`wizard.next`、`wizard.status`、`wizard.cancel` は、オンボーディングウィザードを WS RPC 経由で公開します。

  </Accordion>

  <Accordion title="エージェントとワークスペースのヘルパー">
    - `agents.list` は、有効なモデルとランタイムメタデータを含む、設定済みエージェントエントリを返します。
    - `agents.create`、`agents.update`、`agents.delete` は、エージェントレコードとワークスペース配線を管理します。
    - `agents.files.list`、`agents.files.get`、`agents.files.set` は、エージェント向けに公開されるブートストラップワークスペースファイルを管理します。
    - `artifacts.list`、`artifacts.get`、`artifacts.download` は、明示的な `sessionKey`、`runId`、または `taskId` スコープに対する、トランスクリプト由来のアーティファクト要約とダウンロードを公開します。Run とタスクのクエリは、所有セッションをサーバー側で解決し、一致する来歴を持つトランスクリプトメディアのみを返します。安全でない URL ソースやローカル URL ソースは、サーバー側で取得せず、未対応のダウンロードを返します。
    - `environments.list` と `environments.status` は、SDK クライアント向けに、読み取り専用の Gateway ローカルおよびノード環境検出を公開します。
    - `agent.identity.get` は、エージェントまたはセッションの有効なアシスタント ID を返します。
    - `agent.wait` は、run が終了するまで待ち、利用可能な場合は終端スナップショットを返します。

  </Accordion>

  <Accordion title="セッション制御">
    - `sessions.list` は、現在のセッションインデックスを返します。エージェントランタイムバックエンドが設定されている場合は、行ごとの `agentRuntime` メタデータを含みます。
    - `sessions.subscribe` と `sessions.unsubscribe` は、現在の WS クライアントのセッション変更イベント購読を切り替えます。
    - `sessions.messages.subscribe` と `sessions.messages.unsubscribe` は、1 つのセッションのトランスクリプト/メッセージイベント購読を切り替えます。
    - `sessions.preview` は、特定のセッションキーに対する境界付きトランスクリプトプレビューを返します。
    - `sessions.describe` は、完全一致のセッションキーに対する 1 つの Gateway セッション行を返します。
    - `sessions.resolve` は、セッションターゲットを解決または正規化します。
    - `sessions.create` は、新しいセッションエントリを作成します。
    - `sessions.send` は、既存のセッションにメッセージを送信します。
    - `sessions.steer` は、アクティブなセッション向けの割り込みおよび誘導バリアントです。
    - `sessions.abort` は、セッションのアクティブな作業を中止します。呼び出し元は `key` と任意の `runId` を渡すことも、Gateway がセッションに解決できるアクティブな run について `runId` のみを渡すこともできます。
    - `sessions.patch` は、セッションのメタデータ/オーバーライドを更新し、解決済みの正規モデルと有効な `agentRuntime` を報告します。
    - `sessions.reset`、`sessions.delete`、`sessions.compact` は、セッションメンテナンスを実行します。
    - `sessions.get` は、保存済みセッション行全体を返します。
    - チャット実行では、引き続き `chat.history`、`chat.send`、`chat.abort`、`chat.inject` を使用します。`chat.history` は UI クライアント向けに表示正規化されています。インラインディレクティブタグは表示テキストから削除され、平文のツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）と漏えいした ASCII/全角モデル制御トークンは削除され、完全一致の `NO_REPLY` / `no_reply` など純粋なサイレントトークンのアシスタント行は省略され、大きすぎる行はプレースホルダーに置き換えられる場合があります。

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
    - `node.event` は、ノード由来のイベントを Gateway に戻します。
    - `node.pending.pull` と `node.pending.ack` は、接続済みノードのキュー API です。
    - `node.pending.enqueue` と `node.pending.drain` は、オフライン/切断済みノード向けの永続的な保留作業を管理します。

  </Accordion>

  <Accordion title="承認ファミリー">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list`、`exec.approval.resolve` は、単発の exec 承認リクエストと保留中の承認の検索/再実行を扱います。
    - `exec.approval.waitDecision` は、保留中の exec 承認を 1 件待機し、最終判断を返します（タイムアウト時は `null`）。
    - `exec.approvals.get` と `exec.approvals.set` は、Gateway の exec 承認ポリシースナップショットを管理します。
    - `exec.approvals.node.get` と `exec.approvals.node.set` は、ノードリレーコマンドを介してノードローカルの exec 承認ポリシーを管理します。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision`、`plugin.approval.resolve` は、plugin 定義の承認フローを扱います。

  </Accordion>

  <Accordion title="自動化、Skills、ツール">
    - 自動化: `wake` は即時または次回 Heartbeat の起床テキスト注入をスケジュールします。`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` はスケジュール済み作業を管理します。
    - Skills とツール: `commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。

  </Accordion>
</AccordionGroup>

### 一般的なイベントファミリー

- `chat`: `chat.inject` などの UI チャット更新、およびその他のトランスクリプト専用チャットイベント。
- `session.message` と `session.tool`: サブスクライブ済みセッションのトランスクリプト/イベントストリーム更新。
- `sessions.changed`: セッションインデックスまたはメタデータが変更されました。
- `presence`: システムプレゼンススナップショットの更新。
- `tick`: 定期的な keepalive / liveness イベント。
- `health`: Gateway ヘルススナップショットの更新。
- `heartbeat`: Heartbeat イベントストリームの更新。
- `cron`: Cron 実行/ジョブ変更イベント。
- `shutdown`: Gateway シャットダウン通知。
- `node.pair.requested` / `node.pair.resolved`: ノードペアリングのライフサイクル。
- `node.invoke.request`: ノード呼び出しリクエストのブロードキャスト。
- `device.pair.requested` / `device.pair.resolved`: ペアリング済みデバイスのライフサイクル。
- `voicewake.changed`: ウェイクワードトリガー設定が変更されました。
- `exec.approval.requested` / `exec.approval.resolved`: exec 承認のライフサイクル。
- `plugin.approval.requested` / `plugin.approval.resolved`: plugin 承認のライフサイクル。

### ノードヘルパーメソッド

- ノードは `skills.bins` を呼び出して、自動許可チェック用の現在のスキル実行可能ファイル一覧を取得できます。

### オペレーターヘルパーメソッド

- オペレーターは `commands.list`（`operator.read`）を呼び出して、エージェントのランタイムコマンドインベントリを取得できます。
  - `agentId` は任意です。デフォルトのエージェントワークスペースを読み取るには省略します。
  - `scope` は、プライマリ `name` が対象にするサーフェスを制御します。
    - `text` は先頭の `/` なしでプライマリテキストコマンドトークンを返します
    - `native` とデフォルトの `both` パスは、利用可能な場合にプロバイダー対応のネイティブ名を返します
  - `textAliases` は `/model` や `/m` などの正確なスラッシュエイリアスを保持します。
  - `nativeName` は、存在する場合にプロバイダー対応のネイティブコマンド名を保持します。
  - `provider` は任意で、ネイティブ名付けとネイティブ plugin コマンドの可用性にのみ影響します。
  - `includeArgs=false` は、レスポンスからシリアライズ済み引数メタデータを省略します。
- オペレーターは `tools.catalog`（`operator.read`）を呼び出して、エージェントのランタイムツールカタログを取得できます。レスポンスにはグループ化されたツールと来歴メタデータが含まれます。
  - `source`: `core` または `plugin`
  - `pluginId`: `source="plugin"` の場合の plugin オーナー
  - `optional`: plugin ツールが任意かどうか
- オペレーターは `tools.effective`（`operator.read`）を呼び出して、セッションのランタイムで有効なツールインベントリを取得できます。
  - `sessionKey` は必須です。
  - Gateway は、呼び出し元が指定した認証または配信コンテキストを受け入れる代わりに、セッションサーバー側から信頼済みランタイムコンテキストを導出します。
  - レスポンスはセッションスコープで、core、plugin、チャンネルツールを含め、アクティブな会話が現在使用できるものを反映します。
- オペレーターは `tools.invoke`（`operator.write`）を呼び出して、`/tools/invoke` と同じ Gateway ポリシーパスを介して、利用可能なツールを 1 つ呼び出せます。
  - `name` は必須です。`args`、`sessionKey`、`agentId`、`confirm`、`idempotencyKey` は任意です。
  - `sessionKey` と `agentId` の両方が存在する場合、解決されたセッションエージェントは `agentId` と一致する必要があります。
  - レスポンスは SDK 向けエンベロープで、`ok`、`toolName`、任意の `output`、型付きの `error` フィールドを含みます。承認またはポリシー拒否は、Gateway ツールポリシーパイプラインを迂回するのではなく、ペイロード内で `ok:false` を返します。
- オペレーターは `skills.status`（`operator.read`）を呼び出して、エージェントに表示されるスキルインベントリを取得できます。
  - `agentId` は任意です。デフォルトのエージェントワークスペースを読み取るには省略します。
  - レスポンスには、適格性、不足している要件、設定チェック、生のシークレット値を公開しないサニタイズ済みインストールオプションが含まれます。
- オペレーターは `skills.search` と `skills.detail`（`operator.read`）を呼び出して、ClawHub 検出メタデータを取得できます。
- オペレーターは `skills.install`（`operator.admin`）を 2 つのモードで呼び出せます。
  - ClawHub モード: `{ source: "clawhub", slug, version?, force? }` は、デフォルトのエージェントワークスペースの `skills/` ディレクトリにスキルフォルダーをインストールします。
  - Gateway インストーラーモード: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` は、Gateway ホスト上で宣言済みの `metadata.openclaw.install` アクションを実行します。
- オペレーターは `skills.update`（`operator.admin`）を 2 つのモードで呼び出せます。
  - ClawHub モードは、デフォルトのエージェントワークスペース内の、追跡中の slug 1 つまたは追跡中のすべての ClawHub インストールを更新します。
  - Config モードは、`enabled`、`apiKey`、`env` などの `skills.entries.<skillKey>` 値にパッチを適用します。

### `models.list` ビュー

`models.list` は任意の `view` パラメーターを受け入れます。

- 省略または `"default"`: 現在のランタイム動作です。`agents.defaults.models` が設定されている場合、レスポンスは許可済みカタログになります。そうでない場合、レスポンスは完全な Gateway カタログになります。
- `"configured"`: ピッカー向けサイズの動作です。`agents.defaults.models` が設定されている場合は引き続き優先されます。そうでない場合、レスポンスは明示的な `models.providers.*.models` エントリを使用し、設定済みモデル行が存在しない場合にのみ完全なカタログにフォールバックします。
- `"all"`: 完全な Gateway カタログで、`agents.defaults.models` をバイパスします。通常のモデルピッカーではなく、診断と検出 UI に使用してください。

## Exec 承認

- exec リクエストに承認が必要な場合、Gateway は `exec.approval.requested` をブロードキャストします。
- オペレータークライアントは `exec.approval.resolve` を呼び出して解決します（`operator.approvals` スコープが必要）。
- `host=node` の場合、`exec.approval.request` には `systemRunPlan`（正規の `argv`/`cwd`/`rawCommand`/セッションメタデータ）を含める必要があります。`systemRunPlan` がないリクエストは拒否されます。
- 承認後、転送される `node.invoke system.run` 呼び出しは、その正規の `systemRunPlan` を権威ある command/cwd/session コンテキストとして再利用します。
- 呼び出し元が準備から最終承認済み `system.run` 転送までの間に `command`、`rawCommand`、`cwd`、`agentId`、または `sessionKey` を変更した場合、Gateway は変更されたペイロードを信頼せず、その実行を拒否します。

## エージェント配信フォールバック

- `agent` リクエストには、アウトバウンド配信を要求するために `deliver=true` を含めることができます。
- `bestEffortDeliver=false` は厳格な動作を維持します。解決できない配信ターゲットまたは内部専用配信ターゲットは `INVALID_REQUEST` を返します。
- `bestEffortDeliver=true` は、外部配信可能ルートを解決できない場合（例: 内部/webchat セッションや曖昧なマルチチャンネル設定）に、セッション専用実行へのフォールバックを許可します。

## バージョニング

- `PROTOCOL_VERSION` は `src/gateway/protocol/version.ts` にあります。
- クライアントは `minProtocol` + `maxProtocol` を送信します。サーバーは不一致を拒否します。
- スキーマ + モデルは TypeBox 定義から生成されます。
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### クライアント定数

`src/gateway/client.ts` のリファレンスクライアントは、これらのデフォルトを使用します。値はプロトコル v4 全体で安定しており、サードパーティクライアントの想定ベースラインです。

| 定数                                      | デフォルト                                            | ソース                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| リクエストタイムアウト（RPC ごと）        | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| 事前認証 / 接続チャレンジタイムアウト     | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts`（config/env でペアリング済みサーバー/クライアントの予算を引き上げ可能） |
| 初期再接続バックオフ                      | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| 最大再接続バックオフ                      | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| デバイストークンクローズ後の高速リトライクランプ | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` 前の強制停止猶予            | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` のデフォルトタイムアウト  | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| デフォルト tick 間隔（`hello-ok` 前）      | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| tick タイムアウトクローズ                  | 無音が `tickIntervalMs * 2` を超えた場合の code `4000` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

サーバーは有効な `policy.tickIntervalMs`、`policy.maxPayload`、`policy.maxBufferedBytes` を `hello-ok` で広告します。クライアントはハンドシェイク前のデフォルトではなく、これらの値に従う必要があります。

## 認証

- 共有シークレットの Gateway 認証は、設定された認証モードに応じて `connect.params.auth.token` または
  `connect.params.auth.password` を使用します。
- Tailscale Serve
  (`gateway.auth.allowTailscale: true`) や非ループバックの
  `gateway.auth.mode: "trusted-proxy"` など、ID を持つモードでは、
  `connect.params.auth.*` ではなくリクエストヘッダーから connect 認証チェックを満たします。
- プライベート入力の `gateway.auth.mode: "none"` は、共有シークレットの connect 認証を
  完全にスキップします。このモードを公開または信頼できない入力に公開しないでください。
- ペアリング後、Gateway は接続ロール + スコープに限定された **デバイストークン** を発行します。
  これは `hello-ok.auth.deviceToken` で返され、今後の接続のためにクライアントが
  永続化する必要があります。
- クライアントは、成功した接続の後にプライマリ `hello-ok.auth.deviceToken` を永続化する必要があります。
- その **保存済み** デバイストークンで再接続する場合、そのトークンに対して保存済みの
  承認済みスコープセットも再利用する必要があります。これにより、すでに許可された
  読み取り/プローブ/ステータスアクセスが保持され、再接続が暗黙の管理者専用スコープへ
  黙って狭められることを避けられます。
- クライアント側の connect 認証組み立て (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` は直交しており、設定されている場合は常に転送されます。
  - `auth.token` は優先順位に従って設定されます。明示的な共有トークンが最優先で、
    次に明示的な `deviceToken`、その次に保存済みのデバイス単位トークン
    (`deviceId` + `role` をキーにしたもの) です。
  - `auth.bootstrapToken` は、上記のいずれも `auth.token` を解決しなかった場合にのみ
    送信されます。共有トークン、または解決された任意のデバイストークンがある場合は抑制されます。
  - 1 回限りの `AUTH_TOKEN_MISMATCH` リトライで保存済みデバイストークンを自動昇格する処理は、
    **信頼済みエンドポイントのみ** に制限されます。つまり、ループバック、または
    ピン留めされた `tlsFingerprint` を持つ `wss://` です。ピン留めのない公開 `wss://`
    は該当しません。
- 追加の `hello-ok.auth.deviceTokens` エントリは、ブートストラップ引き渡しトークンです。
  `wss://` やループバック/local ペアリングなど、信頼済みトランスポート上でブートストラップ認証を
  使用して接続した場合にのみ永続化してください。
- クライアントが **明示的な** `deviceToken` または明示的な `scopes` を指定した場合、
  その呼び出し元が要求したスコープセットが引き続き authoritative です。キャッシュされたスコープは、
  クライアントが保存済みのデバイス単位トークンを再利用している場合にのみ再利用されます。
- デバイストークンは `device.token.rotate` と
  `device.token.revoke` (`operator.pairing` スコープが必要) でローテーション/失効できます。
- `device.token.rotate` はローテーションメタデータを返します。同じデバイストークンですでに認証されている
  同一デバイスからの呼び出しの場合にのみ、置換用ベアラートークンをエコーします。これにより、
  トークンのみのクライアントは再接続前に置換トークンを永続化できます。共有/管理者ローテーションでは
  ベアラートークンはエコーされません。
- トークンの発行、ローテーション、失効は、そのデバイスのペアリングエントリに記録された
  承認済みロールセットの範囲内に保たれます。トークン変更によって、ペアリング承認で付与されていない
  デバイスロールへ拡張したり、それを対象にしたりすることはできません。
- ペアリング済みデバイストークンセッションでは、呼び出し元が `operator.admin` も持っていない限り、
  デバイス管理は自己スコープに限定されます。非管理者の呼び出し元は、**自分自身の** デバイスエントリだけを
  削除/失効/ローテーションできます。
- `device.token.rotate` と `device.token.revoke` は、対象 operator トークンのスコープセットも、
  呼び出し元の現在のセッションスコープと照合します。非管理者の呼び出し元は、自分がすでに保持しているものより
  広い operator トークンをローテーションまたは失効できません。
- 認証失敗には `error.details.code` と復旧ヒントが含まれます。
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` に対するクライアント動作:
  - 信頼済みクライアントは、キャッシュされたデバイス単位トークンで 1 回だけ制限付きリトライを試みることができます。
  - そのリトライが失敗した場合、クライアントは自動再接続ループを停止し、operator の対応ガイダンスを表示する必要があります。

## デバイス ID + ペアリング

- ノードは、鍵ペアのフィンガープリントから導出された安定したデバイス ID (`device.id`) を含める必要があります。
- Gateway はデバイス + ロールごとにトークンを発行します。
- ローカル自動承認が有効でない限り、新しいデバイス ID にはペアリング承認が必要です。
- ペアリングの自動承認は、直接の local loopback 接続を中心とします。
- OpenClaw には、信頼済み共有シークレットのヘルパーフロー向けに、狭いバックエンド/コンテナローカルの自己接続パスもあります。
- 同一ホストの tailnet または LAN 接続も、ペアリングでは引き続きリモートとして扱われ、
  承認が必要です。
- WS クライアントは通常、`connect` 中に `device` ID を含めます (operator +
  ノード)。デバイスなしの operator 例外は、明示的な信頼パスのみです。
  - localhost 専用の安全でない HTTP 互換性のための `gateway.controlUi.allowInsecureAuth=true`。
  - 成功した `gateway.auth.mode: "trusted-proxy"` operator Control UI 認証。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (緊急時用、重大なセキュリティ低下)。
  - 共有 Gateway トークン/パスワードで認証された、direct-loopback の `gateway-client` バックエンド RPC。
- すべての接続は、サーバーが提供した `connect.challenge` nonce に署名する必要があります。

### デバイス認証移行診断

チャレンジ前署名の挙動をまだ使用しているレガシークライアント向けに、`connect` は現在、
安定した `error.details.reason` とともに、`error.details.code` の下で
`DEVICE_AUTH_*` 詳細コードを返します。

一般的な移行失敗:

| メッセージ                  | details.code                     | details.reason           | 意味                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | クライアントが `device.nonce` を省略しました (または空で送信しました)。 |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | クライアントが古い/誤った nonce で署名しました。  |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 署名ペイロードが v2 ペイロードと一致しません。    |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 署名済みタイムスタンプが許可されたずれの範囲外です。 |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` が公開鍵フィンガープリントと一致しません。 |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開鍵の形式/正規化に失敗しました。               |

移行先:

- 常に `connect.challenge` を待ちます。
- サーバー nonce を含む v2 ペイロードに署名します。
- 同じ nonce を `connect.params.device.nonce` で送信します。
- 推奨される署名ペイロードは `v3` です。これは、デバイス/クライアント/ロール/スコープ/トークン/nonce フィールドに加えて、
  `platform` と `deviceFamily` をバインドします。
- 互換性のためレガシー `v2` 署名は引き続き受け入れられますが、ペアリング済みデバイスの
  メタデータピン留めが、再接続時のコマンドポリシーを引き続き制御します。

## TLS + ピン留め

- TLS は WS 接続でサポートされています。
- クライアントは任意で Gateway 証明書フィンガープリントをピン留めできます
  (`gateway.tls` 設定に加えて `gateway.remote.tlsFingerprint` または CLI `--tls-fingerprint` を参照)。

## スコープ

このプロトコルは **完全な Gateway API** (ステータス、チャネル、モデル、チャット、
エージェント、セッション、ノード、承認など) を公開します。正確な対象範囲は
`src/gateway/protocol/schema.ts` の TypeBox スキーマで定義されています。

## 関連

- [ブリッジプロトコル](/ja-JP/gateway/bridge-protocol)
- [Gateway ランブック](/ja-JP/gateway)
