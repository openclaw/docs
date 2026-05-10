---
read_when:
    - Gateway WS クライアントの実装または更新
    - プロトコルの不一致または接続失敗のデバッグ
    - プロトコルスキーマ/モデルの再生成
summary: 'Gateway WebSocket プロトコル: ハンドシェイク、フレーム、バージョニング'
title: Gateway プロトコル
x-i18n:
    generated_at: "2026-05-10T19:36:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8bca116f2b05387e3c045f94137dff4eafba281ea5f2eabb65e75469cba8e8e
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS プロトコルは、OpenClaw の**単一のコントロールプレーン + ノードトランスポート**です。すべてのクライアント（CLI、Web UI、macOS アプリ、iOS/Android ノード、ヘッドレスノード）は WebSocket で接続し、ハンドシェイク時に自身の**ロール** + **スコープ**を宣言します。

## トランスポート

- WebSocket、JSON ペイロードを持つテキストフレーム。
- 最初のフレームは**必ず** `connect` リクエストである必要があります。
- 接続前フレームは 64 KiB に制限されます。ハンドシェイクが成功した後、クライアントは
  `hello-ok.policy.maxPayload` と
  `hello-ok.policy.maxBufferedBytes` の制限に従う必要があります。診断が有効な場合、
  過大な受信フレームと遅い送信バッファは、Gateway が影響を受けるフレームを閉じるか破棄する前に
  `payload.large` イベントを発行します。これらのイベントは、サイズ、制限、サーフェス、安全な理由コードを保持します。メッセージ本文、添付ファイルの内容、生フレーム本文、トークン、Cookie、シークレット値は保持しません。

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

Gateway がまだ起動時サイドカーの完了中の場合、`connect` リクエストは、
`details.reason` が `"startup-sidecars"` に設定され、`retryAfterMs` を含む再試行可能な
`UNAVAILABLE` エラーを返すことがあります。クライアントは、そのレスポンスを最終的なハンドシェイク失敗として表示するのではなく、全体の接続予算内で再試行する必要があります。

`server`、`features`、`snapshot`、`policy` はすべてスキーマ
（`src/gateway/protocol/schema/frames.ts`）で必須です。`auth` も必須で、ネゴシエートされたロール/スコープを報告します。`pluginSurfaceUrls` は任意で、`canvas` などの Plugin サーフェス名を、スコープ付きのホスト済み URL にマッピングします。

スコープ付き Plugin サーフェス URL は期限切れになることがあります。ノードは
`node.pluginSurface.refresh` を `{ "surface": "canvas" }` で呼び出して、`pluginSurfaceUrls` に新しいエントリを受け取れます。実験的な Canvas Plugin リファクターは、非推奨の `canvasHostUrl`、`canvasCapability`、または
`node.canvas.capability.refresh` 互換パスをサポートしていません。現在のネイティブクライアントと Gateway は Plugin サーフェスを使用する必要があります。

デバイストークンが発行されない場合、`hello-ok.auth` はトークンフィールドなしで、ネゴシエートされた権限を報告します。

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

信頼された同一プロセスのバックエンドクライアント（`client.id: "gateway-client"`、
`client.mode: "backend"`）は、共有 Gateway トークン/パスワードで認証する直接 loopback 接続では
`device` を省略できます。このパスは内部コントロールプレーン RPC 用に予約されており、古い CLI/デバイスペアリングのベースラインが、サブエージェントセッション更新などのローカルバックエンド作業をブロックしないようにします。リモートクライアント、ブラウザーオリジンクライアント、ノードクライアント、および明示的なデバイストークン/デバイス ID クライアントは、引き続き通常のペアリングとスコープアップグレードのチェックを使用します。

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

信頼されたブートストラップの引き渡し中、`hello-ok.auth` には `deviceTokens` に追加の制限付きロールエントリが含まれることもあります。

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

組み込みのノード/operator ブートストラップフローでは、プライマリノードトークンは
`scopes: []` のままで、引き渡された operator トークンはブートストラップ operator の allowlist
（`operator.approvals`、`operator.read`、
`operator.talk.secrets`、`operator.write`）に制限されたままです。ブートストラップのスコープチェックはロールプレフィックス付きのままです。operator エントリは operator リクエストだけを満たし、operator 以外のロールは引き続き自身のロールプレフィックス配下のスコープを必要とします。

### ノードの例

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

副作用のあるメソッドには**冪等性キー**が必要です（スキーマを参照）。

## ロール + スコープ

完全な operator スコープモデル、承認時チェック、共有シークレットのセマンティクスについては、[Operator scopes](/ja-JP/gateway/operator-scopes) を参照してください。

### ロール

- `operator` = コントロールプレーンクライアント（CLI/UI/自動化）。
- `node` = 機能ホスト（camera/screen/canvas/system.run）。

### スコープ（operator）

一般的なスコープ:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` を指定した `talk.config` には `operator.talk.secrets`
（または `operator.admin`）が必要です。

Plugin が登録した Gateway RPC メソッドは独自の operator スコープを要求できますが、
予約済みのコア管理プレフィックス（`config.*`、`exec.approvals.*`、`wizard.*`、
`update.*`）は常に `operator.admin` に解決されます。

メソッドスコープは最初のゲートにすぎません。`chat.send` 経由で到達する一部のスラッシュコマンドは、その上により厳格なコマンドレベルのチェックを適用します。たとえば、永続的な
`/config set` と `/config unset` の書き込みには `operator.admin` が必要です。

`node.pair.approve` には、ベースのメソッドスコープに加えて、承認時の追加スコープチェックもあります。

- コマンドなしのリクエスト: `operator.pairing`
- exec 以外のノードコマンドを持つリクエスト: `operator.pairing` + `operator.write`
- `system.run`、`system.run.prepare`、または `system.which` を含むリクエスト:
  `operator.pairing` + `operator.admin`

### caps/commands/permissions（ノード）

ノードは接続時に機能クレームを宣言します。

- `caps`: `camera`、`canvas`、`screen`、
  `location`、`voice`、`talk` などの高レベル機能カテゴリ。
- `commands`: invoke 用のコマンド allowlist。
- `permissions`: 細かなトグル（例: `screen.record`、`camera.capture`）。

Gateway はこれらを**クレーム**として扱い、サーバー側 allowlist を適用します。

## プレゼンス

- `system-presence` はデバイス ID をキーにしたエントリを返します。
- プレゼンスエントリには `deviceId`、`roles`、`scopes` が含まれるため、UI は、同じデバイスが
  **operator** と **node** の両方として接続している場合でも、デバイスごとに 1 行を表示できます。
- `node.list` には任意の `lastSeenAtMs` と `lastSeenReason` フィールドが含まれます。接続中のノードは
  現在の接続時刻を `lastSeenAtMs` として、理由 `connect` とともに報告します。ペアリング済みノードは、信頼されたノードイベントがペアリングメタデータを更新すると、永続的なバックグラウンドプレゼンスも報告できます。

### ノードのバックグラウンド生存イベント

ノードは `node.event` を `event: "node.presence.alive"` で呼び出し、ペアリング済みノードがバックグラウンド wake 中に
接続済みとしてマークされることなく生存していたことを記録できます。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` は閉じた enum です: `background`、`silent_push`、`bg_app_refresh`、
`significant_location`、`manual`、または `connect`。未知のトリガー文字列は、永続化前に Gateway によって
`background` に正規化されます。このイベントが永続化されるのは、認証済みノードのデバイスセッションに対してのみです。デバイスなしまたは未ペアリングのセッションは `handled: false` を返します。

成功した Gateway は構造化された結果を返します。

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

古い Gateway は `node.event` に対してまだ `{ "ok": true }` を返すことがあります。クライアントはそれを、永続的なプレゼンス永続化ではなく、
確認済み RPC として扱う必要があります。

## ブロードキャストイベントのスコープ制御

サーバーからプッシュされる WebSocket ブロードキャストイベントはスコープで制御されるため、ペアリングスコープ付きセッションやノード専用セッションがセッション内容を受動的に受信することはありません。

- **チャット、エージェント、ツール結果フレーム**（ストリーミングされた `agent` イベントとツール呼び出し結果を含む）には、少なくとも `operator.read` が必要です。`operator.read` を持たないセッションは、これらのフレームを完全にスキップします。
- **Plugin 定義の `plugin.*` ブロードキャスト**は、Plugin がどのように登録したかに応じて、`operator.write` または `operator.admin` に制限されます。
- **ステータスおよびトランスポートイベント**（`heartbeat`、`presence`、`tick`、接続/切断ライフサイクルなど）は、すべての認証済みセッションでトランスポートの健全性を観測できるよう、制限されないままです。
- **未知のブロードキャストイベントファミリー**は、登録済みハンドラーが明示的に緩和しない限り、デフォルトでスコープ制御されます（fail-closed）。

各クライアント接続は、クライアントごとの独自のシーケンス番号を保持するため、異なるクライアントがイベントストリームの異なるスコープフィルター済みサブセットを見る場合でも、ブロードキャストはそのソケット上で単調な順序を保持します。

## 一般的な RPC メソッドファミリー

公開 WS サーフェスは、上記のハンドシェイク/認証例よりも広範です。これは生成されたダンプではありません。`hello-ok.features.methods` は、
`src/gateway/server-methods-list.ts` に、ロード済みの Plugin/チャネルメソッドエクスポートを加えて構築された保守的なディスカバリーリストです。完全な
`src/gateway/server-methods/*.ts` の列挙ではなく、機能ディスカバリーとして扱ってください。

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` は、キャッシュ済みまたは新しくプローブされた Gateway の健全性スナップショットを返します。
    - `diagnostics.stability` は、直近の制限付き診断安定性レコーダーを返します。イベント名、件数、バイトサイズ、メモリ読み取り値、キュー/セッション状態、チャネル/Plugin 名、セッション ID などの運用メタデータを保持します。チャット本文、Webhook 本文、ツール出力、生のリクエストまたはレスポンス本文、トークン、Cookie、シークレット値は保持しません。operator read スコープが必要です。
    - `status` は `/status` 形式の Gateway 概要を返します。機密フィールドは admin スコープ付き operator クライアントにのみ含まれます。
    - `gateway.identity.get` は、リレーおよびペアリングフローで使用される Gateway デバイス ID を返します。
    - `system-presence` は、接続中の operator/ノードデバイスの現在のプレゼンススナップショットを返します。
    - `system-event` はシステムイベントを追加し、プレゼンスコンテキストを更新/ブロードキャストできます。
    - `last-heartbeat` は、最後に永続化された heartbeat イベントを返します。
    - `set-heartbeats` は、Gateway 上の heartbeat 処理を切り替えます。

  </Accordion>

  <Accordion title="モデルと使用状況">
    - `models.list` は、ランタイムで許可されているモデルカタログを返します。ピッカー向けサイズの構成済みモデル（まず `agents.defaults.models`、次に `models.providers.*.models`）には `{ "view": "configured" }` を渡し、完全なカタログには `{ "view": "all" }` を渡します。
    - `usage.status` は、プロバイダーの使用量ウィンドウと残りクォータの要約を返します。
    - `usage.cost` は、日付範囲の集計済みコスト使用量要約を返します。
    - `doctor.memory.status` は、アクティブなデフォルトエージェントワークスペースのベクトルメモリ / キャッシュ済み埋め込みの準備状態を返します。呼び出し元がライブ埋め込みプロバイダーへの ping を明示的に必要としている場合にのみ、`{ "probe": true }` または `{ "deep": true }` を渡します。
    - `doctor.memory.remHarness` は、リモート制御プレーンのクライアント向けに、範囲が制限された読み取り専用の REM ハーネスプレビューを返します。ワークスペースパス、メモリスニペット、レンダリング済みの根拠付き Markdown、深い昇格候補を含めることができるため、呼び出し元には `operator.read` が必要です。
    - `sessions.usage` は、セッションごとの使用状況要約を返します。
    - `sessions.usage.timeseries` は、1 つのセッションの時系列使用状況を返します。
    - `sessions.usage.logs` は、1 つのセッションの使用状況ログエントリを返します。

  </Accordion>

  <Accordion title="チャンネルとログインヘルパー">
    - `channels.status` は、組み込み + 同梱チャンネル/Plugin のステータス要約を返します。
    - `channels.logout` は、チャンネルがログアウトをサポートしている場合に、特定のチャンネル/アカウントからログアウトします。
    - `web.login.start` は、現在の QR 対応 Web チャンネルプロバイダー向けの QR/Web ログインフローを開始します。
    - `web.login.wait` は、その QR/Web ログインフローの完了を待機し、成功時にチャンネルを開始します。
    - `push.test` は、登録済み iOS ノードにテスト APNs プッシュを送信します。
    - `voicewake.get` は、保存済みのウェイクワードトリガーを返します。
    - `voicewake.set` は、ウェイクワードトリガーを更新し、その変更をブロードキャストします。

  </Accordion>

  <Accordion title="メッセージングとログ">
    - `send` は、チャットランナーの外部でチャンネル/アカウント/スレッドを対象に送信するための、直接のアウトバウンド配信 RPC です。
    - `logs.tail` は、カーソル/リミットと最大バイト数制御付きで、構成済み Gateway ファイルログの末尾を返します。

  </Accordion>

  <Accordion title="Talk と TTS">
    - `talk.catalog` は、音声合成、ストリーミング文字起こし、リアルタイム音声向けの読み取り専用 Talk プロバイダーカタログを返します。プロバイダー ID、ラベル、構成状態、公開されているモデル/音声 ID、正規モード、トランスポート、ブレイン戦略、リアルタイム音声/機能フラグを含みますが、プロバイダーシークレットを返したりグローバル構成を変更したりしません。
    - `talk.config` は、有効な Talk 構成ペイロードを返します。`includeSecrets` には `operator.talk.secrets`（または `operator.admin`）が必要です。
    - `talk.session.create` は、`realtime/gateway-relay`、`transcription/gateway-relay`、または `stt-tts/managed-room` のために Gateway 所有の Talk セッションを作成します。`brain: "direct-tools"` には `operator.admin` が必要です。
    - `talk.session.join` は、管理ルームセッショントークンを検証し、必要に応じて `session.ready` または `session.replaced` イベントを発行し、平文トークンや保存済みトークンハッシュを含めずに、ルーム/セッションのメタデータと最近の Talk イベントを返します。
    - `talk.session.appendAudio` は、base64 PCM 入力音声を Gateway 所有のリアルタイムリレーおよび文字起こしセッションに追加します。
    - `talk.session.startTurn`、`talk.session.endTurn`、`talk.session.cancelTurn` は、状態がクリアされる前に古いターンを拒否しつつ、管理ルームのターンライフサイクルを駆動します。
    - `talk.session.cancelOutput` は、主に Gateway リレーセッションで VAD 制御の割り込みに使用するため、アシスタント音声出力を停止します。
    - `talk.session.submitToolResult` は、Gateway 所有のリアルタイムリレーセッションによって発行されたプロバイダーツール呼び出しを完了します。最終結果が後続する場合の中間ツール出力には `options: { willContinue: true }` を渡し、別のリアルタイムアシスタント応答を開始せずにツール結果でプロバイダー呼び出しを満たす場合は `options: { suppressResponse: true }` を渡します。
    - `talk.session.close` は、Gateway 所有のリレー、文字起こし、または管理ルームセッションを閉じ、終了 Talk イベントを発行します。
    - `talk.mode` は、WebChat/Control UI クライアント向けに現在の Talk モード状態を設定/ブロードキャストします。
    - `talk.client.create` は、Gateway が構成、資格情報、指示、ツールポリシーを所有したまま、`webrtc` または `provider-websocket` を使用してクライアント所有のリアルタイムプロバイダーセッションを作成します。
    - `talk.client.toolCall` は、クライアント所有のリアルタイムトランスポートがプロバイダーツール呼び出しを Gateway ポリシーに転送できるようにします。最初にサポートされるツールは `openclaw_agent_consult` です。クライアントは実行 ID を受け取り、プロバイダー固有のツール結果を送信する前に通常のチャットライフサイクルイベントを待機します。
    - `talk.event` は、リアルタイム、文字起こし、STT/TTS、管理ルーム、テレフォニー、会議アダプター向けの単一の Talk イベントチャンネルです。
    - `talk.speak` は、アクティブな Talk 音声合成プロバイダーを通じて音声を合成します。
    - `tts.status` は、TTS の有効状態、アクティブプロバイダー、フォールバックプロバイダー、プロバイダー構成状態を返します。
    - `tts.providers` は、表示可能な TTS プロバイダーインベントリを返します。
    - `tts.enable` と `tts.disable` は、TTS 設定状態を切り替えます。
    - `tts.setProvider` は、優先 TTS プロバイダーを更新します。
    - `tts.convert` は、単発のテキスト読み上げ変換を実行します。

  </Accordion>

  <Accordion title="シークレット、構成、更新、ウィザード">
    - `secrets.reload` は、アクティブな SecretRefs を再解決し、完全に成功した場合にのみランタイムシークレット状態を入れ替えます。
    - `secrets.resolve` は、特定のコマンド/ターゲットセットについて、コマンド対象のシークレット割り当てを解決します。
    - `config.get` は、現在の構成スナップショットとハッシュを返します。
    - `config.set` は、検証済みの構成ペイロードを書き込みます。
    - `config.patch` は、部分的な構成更新をマージします。
    - `config.apply` は、完全な構成ペイロードを検証して置き換えます。
    - `config.schema` は、Control UI と CLI ツールで使用されるライブ構成スキーマペイロードを返します。スキーマ、`uiHints`、バージョン、生成メタデータに加え、ランタイムが読み込める場合は Plugin + チャンネルのスキーマメタデータも含まれます。このスキーマには、UI で使われるものと同じラベルおよびヘルプテキストから派生したフィールド `title` / `description` メタデータが含まれ、対応するフィールドドキュメントが存在する場合は、ネストされたオブジェクト、ワイルドカード、配列項目、`anyOf` / `oneOf` / `allOf` の合成ブランチも含まれます。
    - `config.schema.lookup` は、1 つの構成パスについて、パススコープのルックアップペイロードを返します。正規化済みパス、浅いスキーマノード、一致したヒント + `hintPath`、UI/CLI ドリルダウン向けの直下の子要約が含まれます。ルックアップスキーマノードは、ユーザー向けドキュメントと一般的な検証フィールド（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、数値/文字列/配列/オブジェクトの境界、`additionalProperties`、`deprecated`、`readOnly`、`writeOnly` などのフラグ）を保持します。子要約は、`key`、正規化済み `path`、`type`、`required`、`hasChildren` に加えて、一致した `hint` / `hintPath` を公開します。
    - `update.run` は、Gateway 更新フローを実行し、更新自体が成功した場合にのみ再起動をスケジュールします。セッションを持つ呼び出し元は `continuationMessage` を含めることができるため、起動時に再起動継続キューを通じて 1 回の後続エージェントターンが再開されます。パッケージマネージャーによる更新では、パッケージ入れ替え後に、延期なし・クールダウンなしの更新再起動を強制します。これにより、古い Gateway プロセスが置き換え済みの `dist` ツリーから遅延読み込みを続けないようにします。
    - `update.status` は、利用可能な場合は再起動後に実行中のバージョンを含め、最新のキャッシュ済み更新再起動センチネルを返します。
    - `wizard.start`、`wizard.next`、`wizard.status`、`wizard.cancel` は、WS RPC 経由でオンボーディングウィザードを公開します。

  </Accordion>

  <Accordion title="エージェントとワークスペースヘルパー">
    - `agents.list` は、有効なモデルとランタイムメタデータを含む、構成済みエージェントエントリを返します。
    - `agents.create`、`agents.update`、`agents.delete` は、エージェントレコードとワークスペース接続を管理します。
    - `agents.files.list`、`agents.files.get`、`agents.files.set` は、エージェント向けに公開されるブートストラップワークスペースファイルを管理します。
    - `tasks.list`、`tasks.get`、`tasks.cancel` は、Gateway タスク台帳を SDK およびオペレータークライアントに公開します。
    - `artifacts.list`、`artifacts.get`、`artifacts.download` は、明示的な `sessionKey`、`runId`、または `taskId` スコープについて、トランスクリプト由来のアーティファクト要約とダウンロードを公開します。実行およびタスクのクエリは、所有セッションをサーバー側で解決し、一致する来歴を持つトランスクリプトメディアのみを返します。安全でない URL ソースやローカル URL ソースは、サーバー側で取得する代わりに未対応のダウンロードを返します。
    - `environments.list` と `environments.status` は、SDK クライアント向けに、読み取り専用の Gateway ローカルおよびノード環境検出を公開します。
    - `agent.identity.get` は、エージェントまたはセッションの有効なアシスタント ID を返します。
    - `agent.wait` は、実行の完了を待機し、利用可能な場合は終了スナップショットを返します。

  </Accordion>

  <Accordion title="セッション制御">
    - `sessions.list` は、エージェントランタイムバックエンドが構成されている場合に行ごとの `agentRuntime` メタデータを含む、現在のセッションインデックスを返します。
    - `sessions.subscribe` と `sessions.unsubscribe` は、現在の WS クライアントのセッション変更イベント購読を切り替えます。
    - `sessions.messages.subscribe` と `sessions.messages.unsubscribe` は、1 つのセッションのトランスクリプト/メッセージイベント購読を切り替えます。
    - `sessions.preview` は、特定のセッションキーについて範囲制限付きのトランスクリプトプレビューを返します。
    - `sessions.describe` は、完全一致のセッションキーについて 1 つの Gateway セッション行を返します。
    - `sessions.resolve` は、セッションターゲットを解決または正規化します。
    - `sessions.create` は、新しいセッションエントリを作成します。
    - `sessions.send` は、既存のセッションにメッセージを送信します。
    - `sessions.steer` は、アクティブなセッション向けの中断して誘導するバリアントです。
    - `sessions.abort` は、セッションのアクティブな作業を中止します。呼び出し元は、`key` と任意の `runId` を渡すか、Gateway がセッションに解決できるアクティブな実行について `runId` のみを渡すことができます。
    - `sessions.patch` は、セッションメタデータ/オーバーライドを更新し、解決済みの正規モデルと有効な `agentRuntime` を報告します。
    - `sessions.reset`、`sessions.delete`、`sessions.compact` は、セッションメンテナンスを実行します。
    - `sessions.get` は、保存済みの完全なセッション行を返します。
    - チャット実行では引き続き `chat.history`、`chat.send`、`chat.abort`、`chat.inject` を使用します。`chat.history` は UI クライアント向けに表示正規化されています。インラインディレクティブタグは表示テキストから削除され、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、切り詰められたツール呼び出しブロックを含む）と、漏れた ASCII/全角モデル制御トークンは削除され、正確な `NO_REPLY` / `no_reply` のような純粋なサイレントトークンのアシスタント行は省略され、過大な行はプレースホルダーに置き換えられることがあります。

  </Accordion>

  <Accordion title="デバイスペアリングとデバイストークン">
    - `device.pair.list` は、保留中および承認済みのペアリング済みデバイスを返します。
    - `device.pair.approve`、`device.pair.reject`、`device.pair.remove` は、デバイスペアリングレコードを管理します。
    - `device.token.rotate` は、承認済みロールと呼び出し元スコープの範囲内で、ペアリング済みデバイストークンをローテーションします。
    - `device.token.revoke` は、承認済みロールと呼び出し元スコープの範囲内で、ペアリング済みデバイストークンを失効させます。

  </Accordion>

  <Accordion title="ノードペアリング、呼び出し、保留中の作業">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove`、`node.pair.verify` は、ノードペアリングとブートストラップ検証を扱います。
    - `node.list` と `node.describe` は、既知/接続済みノードの状態を返します。
    - `node.rename` は、ペアリング済みノードのラベルを更新します。
    - `node.invoke` は、接続済みノードにコマンドを転送します。
    - `node.invoke.result` は、呼び出しリクエストの結果を返します。
    - `node.event` は、ノード発のイベントを Gateway に戻します。
    - `node.pending.pull` と `node.pending.ack` は、接続済みノードのキュー API です。
    - `node.pending.enqueue` と `node.pending.drain` は、オフライン/切断済みノード向けの永続的な保留作業を管理します。

  </Accordion>

  <Accordion title="承認ファミリー">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list`、`exec.approval.resolve` は、単発の exec 承認リクエストと、保留中の承認の検索/再実行を扱います。
    - `exec.approval.waitDecision` は、保留中の exec 承認を 1 件待機し、最終決定を返します（タイムアウト時は `null`）。
    - `exec.approvals.get` と `exec.approvals.set` は、Gateway の exec 承認ポリシースナップショットを管理します。
    - `exec.approvals.node.get` と `exec.approvals.node.set` は、Node リレーコマンド経由で Node ローカルの exec 承認ポリシーを管理します。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision`、`plugin.approval.resolve` は、Plugin 定義の承認フローを扱います。

  </Accordion>

  <Accordion title="自動化、Skills、ツール">
    - 自動化: `wake` は即時または次回 Heartbeat での wake テキスト注入をスケジュールします。`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` はスケジュール済み作業を管理します。
    - Skills とツール: `commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。

  </Accordion>
</AccordionGroup>

### 一般的なイベントファミリー

- `chat`: `chat.inject` やその他のトランスクリプトのみのチャットイベントなど、UI チャット更新。
- `session.message` と `session.tool`: 購読中セッションのトランスクリプト/イベントストリーム更新。
- `sessions.changed`: セッションインデックスまたはメタデータが変更されました。
- `presence`: システムプレゼンスのスナップショット更新。
- `tick`: 定期的な keepalive / liveness イベント。
- `health`: Gateway ヘルススナップショット更新。
- `heartbeat`: Heartbeat イベントストリーム更新。
- `cron`: Cron 実行/ジョブ変更イベント。
- `shutdown`: Gateway シャットダウン通知。
- `node.pair.requested` / `node.pair.resolved`: Node ペアリングライフサイクル。
- `node.invoke.request`: Node invoke リクエストブロードキャスト。
- `device.pair.requested` / `device.pair.resolved`: ペアリング済みデバイスのライフサイクル。
- `voicewake.changed`: ウェイクワードトリガー設定が変更されました。
- `exec.approval.requested` / `exec.approval.resolved`: exec 承認ライフサイクル。
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin 承認ライフサイクル。

### Node ヘルパーメソッド

- Node は、自動許可チェック用に現在のスキル実行可能ファイル一覧を取得するために `skills.bins` を呼び出せます。

### タスク台帳 RPC

オペレータークライアントは、タスク台帳 RPC を通じて Gateway バックグラウンドタスクレコードを検査およびキャンセルできます。これらのメソッドは、生のランタイム状態ではなく、サニタイズされたタスクサマリーを返します。

- `tasks.list` には `operator.read` が必要です。
  - パラメーター: 任意の `status`（`"queued"`、`"running"`、`"completed"`、`"failed"`、`"cancelled"`、または `"timed_out"`）またはそれらのステータスの配列、任意の `agentId`、任意の `sessionKey`、`1` から `500` までの任意の `limit`、および任意の文字列 `cursor`。
  - 結果: `{ "tasks": TaskSummary[], "nextCursor"?: string }`。
- `tasks.get` には `operator.read` が必要です。
  - パラメーター: `{ "taskId": string }`。
  - 結果: `{ "task": TaskSummary }`。
  - 存在しないタスク ID は、Gateway の not-found エラー形式を返します。
- `tasks.cancel` には `operator.write` が必要です。
  - パラメーター: `{ "taskId": string, "reason"?: string }`。
  - 結果:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`。
  - `found` は、台帳に一致するタスクがあったかどうかを報告します。`cancelled` は、ランタイムがキャンセルを受け入れたか、記録したかを報告します。

`TaskSummary` には、`id`、`status`、および `kind`、`runtime`、`title`、`agentId`、`sessionKey`、`childSessionKey`、`ownerKey`、`runId`、`taskId`、`flowId`、`parentTaskId`、`sourceId`、タイムスタンプ、進捗、終端サマリー、サニタイズされたエラーテキストなどの任意のメタデータが含まれます。

### オペレーターヘルパーメソッド

- オペレーターは、エージェントのランタイムコマンドインベントリを取得するために `commands.list`（`operator.read`）を呼び出せます。
  - `agentId` は任意です。省略すると、デフォルトのエージェントワークスペースを読み取ります。
  - `scope` は、プライマリ `name` が対象にするサーフェスを制御します。
    - `text` は、先頭の `/` を除いたプライマリテキストコマンドトークンを返します
    - `native` とデフォルトの `both` パスは、利用可能な場合にプロバイダー対応のネイティブ名を返します
  - `textAliases` は、`/model` や `/m` などの完全一致スラッシュエイリアスを保持します。
  - `nativeName` は、存在する場合にプロバイダー対応のネイティブコマンド名を保持します。
  - `provider` は任意で、ネイティブ命名とネイティブ Plugin コマンドの可用性にのみ影響します。
  - `includeArgs=false` は、シリアライズ済み引数メタデータをレスポンスから省略します。
- オペレーターは、エージェントのランタイムツールカタログを取得するために `tools.catalog`（`operator.read`）を呼び出せます。レスポンスには、グループ化されたツールと来歴メタデータが含まれます。
  - `source`: `core` または `plugin`
  - `pluginId`: `source="plugin"` の場合の Plugin 所有者
  - `optional`: Plugin ツールが任意かどうか
- オペレーターは、セッションのランタイム有効なツールインベントリを取得するために `tools.effective`（`operator.read`）を呼び出せます。
  - `sessionKey` は必須です。
  - Gateway は、呼び出し元が指定した認証または配信コンテキストを受け入れる代わりに、信頼済みランタイムコンテキストをサーバー側のセッションから導出します。
  - レスポンスはセッションスコープであり、コア、Plugin、チャネルツールを含め、アクティブな会話が今すぐ使用できるものを反映します。
- オペレーターは、`/tools/invoke` と同じ Gateway ポリシーパスを通じて利用可能なツールを 1 つ呼び出すために `tools.invoke`（`operator.write`）を呼び出せます。
  - `name` は必須です。`args`、`sessionKey`、`agentId`、`confirm`、`idempotencyKey` は任意です。
  - `sessionKey` と `agentId` の両方が存在する場合、解決されたセッションエージェントは `agentId` と一致している必要があります。
  - レスポンスは SDK 向けのエンベロープで、`ok`、`toolName`、任意の `output`、および型付きの `error` フィールドを含みます。承認またはポリシー拒否は、Gateway ツールポリシーパイプラインをバイパスするのではなく、ペイロード内で `ok:false` を返します。
- オペレーターは、エージェントの可視スキルインベントリを取得するために `skills.status`（`operator.read`）を呼び出せます。
  - `agentId` は任意です。省略すると、デフォルトのエージェントワークスペースを読み取ります。
  - レスポンスには、適格性、未充足要件、設定チェック、および生のシークレット値を公開しないサニタイズ済みインストールオプションが含まれます。
- オペレーターは、ClawHub 検出メタデータのために `skills.search` と `skills.detail`（`operator.read`）を呼び出せます。
- オペレーターは、インストール前にプライベートスキルアーカイブをステージングするために、`skills.upload.begin`、`skills.upload.chunk`、`skills.upload.commit`（`operator.admin`）を呼び出せます。これは信頼済みクライアント向けの別個の管理者アップロードパスであり、通常の ClawHub スキルインストールフローではありません。`skills.install.allowUploadedArchives` が有効でない限り、デフォルトでは無効です。
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })` は、その slug と force 値に紐づくアップロードを作成します。
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` は、正確なデコード済みオフセットにバイト列を追加します。
  - `skills.upload.commit({ uploadId, sha256? })` は、最終サイズと SHA-256 を検証します。コミットはアップロードを確定するだけで、スキルはインストールしません。
  - アップロードされたスキルアーカイブは、ルートに `SKILL.md` を含む zip アーカイブです。アーカイブ内部のディレクトリ名がインストール先を選択することはありません。
- オペレーターは、3 つのモードで `skills.install`（`operator.admin`）を呼び出せます。
  - ClawHub モード: `{ source: "clawhub", slug, version?, force? }` は、デフォルトのエージェントワークスペースの `skills/` ディレクトリにスキルフォルダーをインストールします。
  - アップロードモード: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }` は、コミット済みアップロードをデフォルトのエージェントワークスペースの `skills/<slug>` ディレクトリにインストールします。slug と force 値は、元の `skills.upload.begin` リクエストと一致している必要があります。このモードは、`skills.install.allowUploadedArchives` が有効でない限り拒否されます。この設定は ClawHub インストールには影響しません。
  - Gateway インストーラーモード: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` は、Gateway ホスト上で宣言済みの `metadata.openclaw.install` アクションを実行します。
- オペレーターは、2 つのモードで `skills.update`（`operator.admin`）を呼び出せます。
  - ClawHub モードは、デフォルトのエージェントワークスペース内の追跡対象 slug 1 件、または追跡対象のすべての ClawHub インストールを更新します。
  - 設定モードは、`enabled`、`apiKey`、`env` などの `skills.entries.<skillKey>` 値にパッチを適用します。

### `models.list` ビュー

`models.list` は任意の `view` パラメーターを受け取ります。

- 省略または `"default"`: 現在のランタイム動作。`agents.defaults.models` が設定されている場合、レスポンスは許可済みカタログになり、`provider/*` エントリーに対して動的に検出されたモデルも含まれます。それ以外の場合、レスポンスは完全な Gateway カタログです。
- `"configured"`: ピッカー向けサイズの動作。`agents.defaults.models` が設定されている場合は引き続き優先され、`provider/*` エントリーに対するプロバイダースコープの検出も含まれます。許可リストがない場合、レスポンスは明示的な `models.providers.*.models` エントリーを使用し、設定済みモデル行が存在しない場合にのみ完全なカタログへフォールバックします。
- `"all"`: `agents.defaults.models` をバイパスする完全な Gateway カタログ。通常のモデルピッカーではなく、診断や検出 UI に使用します。

## Exec 承認

- exec リクエストに承認が必要な場合、Gateway は `exec.approval.requested` をブロードキャストします。
- オペレータークライアントは、`exec.approval.resolve`（`operator.approvals` スコープが必要）を呼び出して解決します。
- `host=node` の場合、`exec.approval.request` には `systemRunPlan`（正規の `argv`/`cwd`/`rawCommand`/セッションメタデータ）を含める必要があります。`systemRunPlan` がないリクエストは拒否されます。
- 承認後、転送された `node.invoke system.run` 呼び出しは、その正規の `systemRunPlan` を信頼できる command/cwd/session コンテキストとして再利用します。
- 呼び出し元が prepare から最終承認済みの `system.run` 転送までの間に、`command`、`rawCommand`、`cwd`、`agentId`、または `sessionKey` を変更した場合、Gateway は変更後のペイロードを信頼せず、その実行を拒否します。

## エージェント配信フォールバック

- `agent` リクエストには、アウトバウンド配信を要求するために `deliver=true` を含めることができます。
- `bestEffortDeliver=false` は厳格な動作を維持します。未解決または内部専用の配信先は `INVALID_REQUEST` を返します。
- `bestEffortDeliver=true` は、外部配信可能なルートを解決できない場合（たとえば、内部/webchat セッションや曖昧なマルチチャネル設定）、セッションのみの実行へのフォールバックを許可します。
- 最終的な `agent` 結果には、配信が要求された場合に `result.deliveryStatus` が含まれることがあり、[`openclaw agent --json --deliver`](/ja-JP/cli/agent#json-delivery-status) で文書化されているものと同じ `sent`、`suppressed`、`partial_failed`、`failed` ステータスを使用します。

## バージョニング

- `PROTOCOL_VERSION` は `src/gateway/protocol/version.ts` にあります。
- クライアントは `minProtocol` + `maxProtocol` を送信し、サーバーは不一致を拒否します。
- スキーマとモデルは TypeBox 定義から生成されます。
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### クライアント定数

`src/gateway/client.ts` のリファレンスクライアントは、これらのデフォルトを使用します。値は protocol v4 全体で安定しており、サードパーティクライアントに期待されるベースラインです。

| 定数                                      | 既定値                                                | ソース                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| リクエストタイムアウト (RPC ごと)         | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| 事前認証 / connect-challenge タイムアウト | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env で対応するサーバー/クライアント予算を増やせる) |
| 初回再接続バックオフ                      | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| 最大再接続バックオフ                      | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| device-token クローズ後の高速再試行クランプ | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` 前の強制停止猶予            | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` の既定タイムアウト        | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| 既定の tick 間隔 (`hello-ok` 前)          | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| tick タイムアウトによるクローズ           | 無通信が `tickIntervalMs * 2` を超えた場合は code `4000` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

サーバーは有効な `policy.tickIntervalMs`、`policy.maxPayload`、
および `policy.maxBufferedBytes` を `hello-ok` で通知する。クライアントは
ハンドシェイク前の既定値ではなく、これらの値に従う必要がある。

## 認証

- 共有シークレット Gateway 認証は、設定された認証モードに応じて
  `connect.params.auth.token` または `connect.params.auth.password` を使用する。
- Tailscale Serve (`gateway.auth.allowTailscale: true`) や non-loopback
  `gateway.auth.mode: "trusted-proxy"` など、アイデンティティを持つモードは、
  `connect.params.auth.*` ではなくリクエストヘッダーから接続認証チェックを満たす。
- プライベートイングレスの `gateway.auth.mode: "none"` は、共有シークレットの接続認証を
  完全にスキップする。このモードをパブリックまたは信頼できないイングレスに公開してはならない。
- ペアリング後、Gateway は接続ロール + スコープに限定された **device token** を発行する。
  これは `hello-ok.auth.deviceToken` で返され、クライアントは今後の接続のために
  永続化する必要がある。
- クライアントは、成功した接続の後に主 `hello-ok.auth.deviceToken` を永続化する必要がある。
- その **保存済み** device token で再接続する場合、そのトークン用に保存済みの
  承認済みスコープセットも再利用する必要がある。これにより、すでに許可された
  read/probe/status アクセスが保持され、再接続がより狭い暗黙の admin-only スコープへ
  静かに縮小されることを避けられる。
- クライアント側の接続認証組み立て (`src/gateway/client.ts` の `selectConnectAuth`):
  - `auth.password` は直交しており、設定されている場合は常に転送される。
  - `auth.token` は優先順位に従って設定される。明示的な共有トークンが最初、
    次に明示的な `deviceToken`、最後に保存済みのデバイス別トークン (`deviceId` + `role` でキー指定)。
  - `auth.bootstrapToken` は、上記のいずれも `auth.token` を解決しなかった場合にのみ送信される。
    共有トークンまたは解決済み device token がある場合は抑制される。
  - 単発の `AUTH_TOKEN_MISMATCH` 再試行で保存済み device token を自動昇格する処理は、
    **信頼済みエンドポイントのみ** に制限される。対象は loopback、または
    ピン留めされた `tlsFingerprint` を持つ `wss://`。ピン留めのないパブリック `wss://`
    は該当しない。
- 追加の `hello-ok.auth.deviceTokens` エントリは bootstrap 引き渡しトークンである。
  `wss://` や loopback/local ペアリングなど、信頼済みトランスポート上で
  bootstrap 認証を使って接続した場合にのみ永続化する。
- クライアントが **明示的な** `deviceToken` または明示的な `scopes` を指定した場合、
  その呼び出し元が要求したスコープセットが引き続き権威を持つ。キャッシュされたスコープは、
  クライアントが保存済みのデバイス別トークンを再利用している場合にのみ再利用される。
- Device token は `device.token.rotate` および `device.token.revoke` でローテーション/失効できる
  (`operator.pairing` スコープが必要)。
- `device.token.rotate` はローテーションメタデータを返す。置換用 bearer token は、
  その device token ですでに認証されている同一デバイス呼び出しの場合にのみエコーするため、
  token-only クライアントは再接続前に置換トークンを永続化できる。共有/admin ローテーションでは
  bearer token はエコーされない。
- トークンの発行、ローテーション、失効は、そのデバイスのペアリングエントリに記録された
  承認済みロールセットに制限される。トークン変更で、ペアリング承認が付与していない
  デバイスロールへ拡張したり、対象にしたりすることはできない。
- ペアリング済みデバイストークンセッションでは、呼び出し元が `operator.admin` も持つ場合を除き、
  デバイス管理は自己スコープに限定される。非 admin 呼び出し元が削除/失効/ローテーションできるのは、
  **自分自身の** デバイスエントリのみである。
- `device.token.rotate` と `device.token.revoke` は、対象の operator token スコープセットも
  呼び出し元の現在のセッションスコープと照合する。非 admin 呼び出し元は、自分がすでに保持しているものより
  広い operator token をローテーションまたは失効できない。
- 認証失敗には `error.details.code` と復旧ヒントが含まれる。
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` に対するクライアント動作:
  - 信頼済みクライアントは、キャッシュされたデバイス別トークンで制限付きの再試行を 1 回試みてもよい。
  - その再試行が失敗した場合、クライアントは自動再接続ループを停止し、operator の対応ガイダンスを表示する必要がある。

## デバイスアイデンティティ + ペアリング

- Node は、鍵ペアフィンガープリントから導出された安定したデバイスアイデンティティ (`device.id`) を含める必要がある。
- Gateway はデバイス + ロールごとにトークンを発行する。
- local 自動承認が有効でない限り、新しいデバイス ID にはペアリング承認が必要である。
- ペアリングの自動承認は、直接の local loopback 接続を中心にしている。
- OpenClaw には、信頼済み共有シークレットヘルパーフロー向けの、狭い backend/container-local 自己接続パスもある。
- 同一ホストの tailnet または LAN 接続も、ペアリングでは引き続きリモートとして扱われ、
  承認が必要である。
- WS クライアントは通常、`connect` 中に `device` アイデンティティを含める (operator + node)。
  デバイスなしの operator 例外は、明示的な信頼パスのみである。
  - localhost-only の安全でない HTTP 互換性向けの `gateway.controlUi.allowInsecureAuth=true`。
  - 成功した `gateway.auth.mode: "trusted-proxy"` operator Control UI 認証。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass、重大なセキュリティ低下)。
  - 共有 Gateway トークン/パスワードで認証された direct-loopback `gateway-client` backend RPC。
- すべての接続は、サーバーが提供する `connect.challenge` nonce に署名する必要がある。

### デバイス認証移行診断

challenge 前の署名動作をまだ使用しているレガシークライアント向けに、`connect` は現在、
安定した `error.details.reason` とともに `error.details.code` の下で
`DEVICE_AUTH_*` 詳細コードを返す。

一般的な移行失敗:

| メッセージ                | details.code                     | details.reason           | 意味                                               |
| ------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`   | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | クライアントが `device.nonce` を省略した (または空白を送信した)。 |
| `device nonce mismatch`   | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | クライアントが古い/誤った nonce で署名した。       |
| `device signature invalid` | `DEVICE_AUTH_SIGNATURE_INVALID` | `device-signature`       | 署名ペイロードが v2 ペイロードと一致しない。       |
| `device signature expired` | `DEVICE_AUTH_SIGNATURE_EXPIRED` | `device-signature-stale` | 署名されたタイムスタンプが許容 skew の範囲外である。 |
| `device identity mismatch` | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` が公開鍵フィンガープリントと一致しない。 |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開鍵の形式/正規化に失敗した。                   |

移行先:

- 常に `connect.challenge` を待つ。
- サーバー nonce を含む v2 ペイロードに署名する。
- 同じ nonce を `connect.params.device.nonce` で送信する。
- 推奨される署名ペイロードは `v3` であり、device/client/role/scopes/token/nonce フィールドに加えて
  `platform` と `deviceFamily` をバインドする。
- レガシー `v2` 署名は互換性のため引き続き受け入れられるが、ペアリング済みデバイスの
  メタデータピン留めが再接続時のコマンドポリシーを引き続き制御する。

## TLS + ピン留め

- TLS は WS 接続でサポートされる。
- クライアントは必要に応じて Gateway 証明書フィンガープリントをピン留めできる
  (`gateway.tls` 設定に加え、`gateway.remote.tlsFingerprint` または CLI `--tls-fingerprint` を参照)。

## スコープ

このプロトコルは **完全な Gateway API** (status、channels、models、chat、
agent、sessions、nodes、approvals など) を公開する。正確な表面は
`src/gateway/protocol/schema.ts` の TypeBox スキーマで定義される。

## 関連

- [Bridge プロトコル](/ja-JP/gateway/bridge-protocol)
- [Gateway ランブック](/ja-JP/gateway)
