---
read_when:
    - Gateway WS クライアントの実装または更新
    - プロトコル不一致や接続失敗のデバッグ
    - プロトコルスキーマ/モデルの再生成
summary: 'Gateway WebSocket プロトコル: ハンドシェイク、フレーム、バージョニング'
title: Gateway プロトコル
x-i18n:
    generated_at: "2026-05-11T20:30:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8db92a8ea464fa3ca1fdc6cc32fdcd7d981c186c9900bb8dc2eeaf1a2d2be05d
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS プロトコルは、OpenClaw の**単一の制御プレーン + ノードトランスポート**です。すべてのクライアント（CLI、Web UI、macOS アプリ、iOS/Android ノード、ヘッドレスノード）は WebSocket 経由で接続し、ハンドシェイク時に**ロール** + **スコープ**を宣言します。

## トランスポート

- WebSocket、JSON ペイロードを含むテキストフレーム。
- 最初のフレームは**必ず** `connect` リクエストでなければなりません。
- 接続前フレームは 64 KiB に制限されます。ハンドシェイク成功後、クライアントは `hello-ok.policy.maxPayload` と `hello-ok.policy.maxBufferedBytes` の制限に従う必要があります。診断が有効な場合、過大な受信フレームと低速な送信バッファーは、Gateway が影響を受けるフレームを閉じる、または破棄する前に `payload.large` イベントを発行します。これらのイベントは、サイズ、制限、サーフェス、安全な理由コードを保持します。メッセージ本文、添付内容、未加工のフレーム本文、トークン、Cookie、シークレット値は保持しません。

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

Gateway がまだ起動サイドカーの完了中である間、`connect` リクエストは `details.reason` が `"startup-sidecars"` に設定され、`retryAfterMs` を伴う再試行可能な `UNAVAILABLE` エラーを返すことがあります。クライアントはそのレスポンスを終端的なハンドシェイク失敗として表示するのではなく、全体の接続予算内で再試行する必要があります。

`server`、`features`、`snapshot`、`policy` はすべてスキーマ（`src/gateway/protocol/schema/frames.ts`）で必須です。`auth` も必須で、ネゴシエートされたロール/スコープを報告します。`pluginSurfaceUrls` は任意で、`canvas` などの Plugin サーフェス名を、スコープ付きホスト URL にマップします。

スコープ付き Plugin サーフェス URL は期限切れになることがあります。ノードは `node.pluginSurface.refresh` を `{ "surface": "canvas" }` とともに呼び出して、`pluginSurfaceUrls` の新しいエントリを受け取れます。実験的な Canvas Plugin リファクタリングは、非推奨の `canvasHostUrl`、`canvasCapability`、`node.canvas.capability.refresh` 互換パスをサポートしません。現在のネイティブクライアントと Gateway は Plugin サーフェスを使用する必要があります。

デバイストークンが発行されない場合、`hello-ok.auth` はトークンフィールドなしでネゴシエートされた権限を報告します。

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

信頼された同一プロセスのバックエンドクライアント（`client.id: "gateway-client"`、`client.mode: "backend"`）は、共有 Gateway トークン/パスワードで認証する場合、直接のループバック接続で `device` を省略できます。このパスは内部制御プレーン RPC 用に予約されており、古い CLI/デバイスペアリングのベースラインが、サブエージェントセッション更新などのローカルバックエンド作業を妨げないようにします。リモートクライアント、ブラウザーオリジンのクライアント、ノードクライアント、明示的なデバイストークン/デバイスアイデンティティのクライアントは、引き続き通常のペアリングとスコープアップグレードチェックを使用します。

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

信頼されたブートストラップ引き渡し中、`hello-ok.auth` には `deviceTokens` 内に追加の境界付きロールエントリが含まれることもあります。

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

組み込みのノード/オペレーターブートストラップフローでは、プライマリノードトークンは `scopes: []` のままで、引き渡されたオペレータートークンはブートストラップオペレーターの許可リスト（`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`）に制限されたままです。ブートストラップスコープチェックはロール接頭辞付きのままです。オペレーターエントリはオペレーターリクエストのみを満たし、非オペレーターロールには引き続き自身のロール接頭辞配下のスコープが必要です。

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

完全なオペレータースコープモデル、承認時チェック、共有シークレットのセマンティクスについては、[オペレータースコープ](/ja-JP/gateway/operator-scopes) を参照してください。

### ロール

- `operator` = コントロールプレーンクライアント（CLI/UI/自動化）。
- `node` = capability ホスト（camera/screen/canvas/system.run）。

### スコープ（operator）

共通スコープ:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` を指定した `talk.config` には `operator.talk.secrets`
（または `operator.admin`）が必要です。

Plugin が登録した gateway RPC メソッドは独自の operator スコープを要求できますが、
予約済みの core 管理プレフィックス（`config.*`、`exec.approvals.*`、`wizard.*`、
`update.*`）は常に `operator.admin` に解決されます。

メソッドスコープは最初のゲートにすぎません。`chat.send` 経由で到達する一部のスラッシュコマンドでは、
その上により厳格なコマンドレベルのチェックが適用されます。たとえば、永続的な
`/config set` と `/config unset` の書き込みには `operator.admin` が必要です。

`node.pair.approve` には、基本メソッドスコープに加えて、承認時の追加スコープチェックもあります:

- コマンドなしのリクエスト: `operator.pairing`
- 非 exec node コマンドを含むリクエスト: `operator.pairing` + `operator.write`
- `system.run`、`system.run.prepare`、または `system.which` を含むリクエスト:
  `operator.pairing` + `operator.admin`

### caps/commands/permissions（node）

node は接続時に capability クレームを宣言します:

- `caps`: `camera`、`canvas`、`screen`、
  `location`、`voice`、`talk` などの高レベル capability カテゴリ。
- `commands`: invoke 用のコマンド許可リスト。
- `permissions`: 粒度の細かい切り替え（例: `screen.record`、`camera.capture`）。

Gateway はこれらを**クレーム**として扱い、サーバー側の許可リストを強制します。

## プレゼンス

- `system-presence` はデバイス ID でキー付けされたエントリを返します。
- プレゼンスエントリには `deviceId`、`roles`、`scopes` が含まれるため、UI はデバイスごとに 1 行だけ表示できます。
  **operator** と **node** の両方として接続している場合でも同様です。
- `node.list` には任意の `lastSeenAtMs` と `lastSeenReason` フィールドが含まれます。接続中の node は
  現在の接続時刻を `lastSeenAtMs` として報告し、理由は `connect` です。ペアリング済み node は、信頼済み node イベントがペアリングメタデータを更新したときに、
  永続的なバックグラウンドプレゼンスも報告できます。

### node バックグラウンド生存イベント

node は `event: "node.presence.alive"` を指定して `node.event` を呼び出し、ペアリング済み node が
バックグラウンド wake 中に生存していたことを、接続済みとしてマークせずに記録できます。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` は閉じた enum です: `background`、`silent_push`、`bg_app_refresh`、
`significant_location`、`manual`、または `connect`。不明な trigger 文字列は、永続化前に gateway によって
`background` に正規化されます。このイベントが永続化されるのは、認証済み node
デバイスセッションの場合だけです。デバイスなし、または未ペアリングのセッションは `handled: false` を返します。

成功した gateway は構造化された結果を返します:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

古い gateway では、`node.event` に対してまだ `{ "ok": true }` を返す場合があります。クライアントはそれを、
永続的なプレゼンス保存ではなく、承認済み RPC として扱う必要があります。

## ブロードキャストイベントのスコープ設定

サーバーからプッシュされる WebSocket ブロードキャストイベントはスコープでゲートされるため、pairing スコープまたは node 専用セッションがセッション内容を受動的に受信することはありません。

- **チャット、agent、ツール結果フレーム**（ストリーミングされる `agent` イベントとツール呼び出し結果を含む）には、少なくとも `operator.read` が必要です。`operator.read` のないセッションでは、これらのフレームは完全にスキップされます。
- **Plugin 定義の `plugin.*` ブロードキャスト**は、Plugin が登録した方法に応じて、`operator.write` または `operator.admin` にゲートされます。
- **ステータスイベントとトランスポートイベント**（`heartbeat`、`presence`、`tick`、connect/disconnect ライフサイクルなど）は制限されないままです。これにより、すべての認証済みセッションからトランスポートの健全性を観測できます。
- **不明なブロードキャストイベントファミリ**は、登録済みハンドラが明示的に緩和しない限り、デフォルトでスコープゲートされます（fail-closed）。

各クライアント接続は、クライアントごとの独自のシーケンス番号を保持するため、異なるクライアントがイベントストリームの異なるスコープフィルタ済みサブセットを見る場合でも、そのソケット上ではブロードキャストの単調順序が維持されます。

## 一般的な RPC メソッドファミリ

公開 WS サーフェスは、上記の handshake/auth の例よりも広範です。これは
生成されたダンプではありません。`hello-ok.features.methods` は、`src/gateway/server-methods-list.ts` と読み込まれた
Plugin/channel メソッドエクスポートから構築された保守的な
検出リストです。`src/gateway/server-methods/*.ts` の完全な
列挙ではなく、機能検出として扱ってください。

<AccordionGroup>
  <Accordion title="システムと ID">
    - `health` は、キャッシュ済みまたは新たにプローブされた gateway 健全性スナップショットを返します。
    - `diagnostics.stability` は、最近の有界な診断安定性レコーダーを返します。これはイベント名、件数、バイトサイズ、メモリ読み取り値、キュー/セッション状態、channel/Plugin 名、セッション ID などの運用メタデータを保持します。チャットテキスト、webhook 本文、ツール出力、生のリクエストまたはレスポンス本文、トークン、Cookie、シークレット値は保持しません。operator read スコープが必要です。
    - `status` は `/status` 形式の gateway サマリーを返します。機密フィールドは、admin スコープの operator クライアントにのみ含まれます。
    - `gateway.identity.get` は、relay と pairing フローで使用される gateway デバイス ID を返します。
    - `system-presence` は、接続中の operator/node デバイスの現在のプレゼンススナップショットを返します。
    - `system-event` はシステムイベントを追加し、プレゼンスコンテキストを更新/ブロードキャストできます。
    - `last-heartbeat` は、永続化された最新の heartbeat イベントを返します。
    - `set-heartbeats` は、gateway 上の heartbeat 処理を切り替えます。

  </Accordion>

  <Accordion title="モデルと使用状況">
    - `models.list` は、ランタイムで許可されているモデルカタログを返します。ピッカー向けサイズの構成済みモデル（最初に `agents.defaults.models`、次に `models.providers.*.models`）には `{ "view": "configured" }` を渡し、完全なカタログには `{ "view": "all" }` を渡します。
    - `usage.status` は、プロバイダーの使用状況ウィンドウ/残りクォータのサマリーを返します。
    - `usage.cost` は、日付範囲の集計済みコスト使用状況サマリーを返します。
    - `doctor.memory.status` は、アクティブなデフォルトエージェントワークスペースのベクトルメモリ/キャッシュ済み埋め込みの準備状況を返します。呼び出し元がライブ埋め込みプロバイダーへの ping を明示的に求める場合にのみ、`{ "probe": true }` または `{ "deep": true }` を渡します。
    - `doctor.memory.remHarness` は、リモートコントロールプレーンのクライアント向けに、境界付けられた読み取り専用の REM ハーネスプレビューを返します。ワークスペースパス、メモリスニペット、レンダリング済みの根拠付き Markdown、深い昇格候補を含められるため、呼び出し元には `operator.read` が必要です。
    - `sessions.usage` は、セッションごとの使用状況サマリーを返します。
    - `sessions.usage.timeseries` は、1 つのセッションの時系列使用状況を返します。
    - `sessions.usage.logs` は、1 つのセッションの使用状況ログエントリを返します。

  </Accordion>

  <Accordion title="チャネルとログインヘルパー">
    - `channels.status` は、組み込み + バンドル済みのチャネル/Plugin 状態サマリーを返します。
    - `channels.logout` は、チャネルがログアウトをサポートする場合に、特定のチャネル/アカウントからログアウトします。
    - `web.login.start` は、現在の QR 対応 Web チャネルプロバイダーの QR/Web ログインフローを開始します。
    - `web.login.wait` は、その QR/Web ログインフローの完了を待機し、成功時にチャネルを開始します。
    - `push.test` は、登録済みの iOS ノードにテスト用 APNs プッシュを送信します。
    - `voicewake.get` は、保存済みのウェイクワードトリガーを返します。
    - `voicewake.set` は、ウェイクワードトリガーを更新し、その変更をブロードキャストします。

  </Accordion>

  <Accordion title="メッセージングとログ">
    - `send` は、チャットランナー外でチャネル/アカウント/スレッドを対象に送信するための直接アウトバウンド配信 RPC です。
    - `logs.tail` は、設定済みの Gateway ファイルログ末尾を、カーソル/制限および最大バイト制御付きで返します。

  </Accordion>

  <Accordion title="Talk と TTS">
    - `talk.catalog` は、音声合成、ストリーミング文字起こし、リアルタイム音声向けの読み取り専用 Talk プロバイダーカタログを返します。プロバイダー ID、ラベル、構成済み状態、公開されているモデル/音声 ID、正規モード、トランスポート、ブレイン戦略、リアルタイム音声/ケイパビリティフラグを含みますが、プロバイダーシークレットの返却やグローバル設定の変更は行いません。
    - `talk.config` は、有効な Talk 設定ペイロードを返します。`includeSecrets` には `operator.talk.secrets`（または `operator.admin`）が必要です。
    - `talk.session.create` は、`realtime/gateway-relay`、`transcription/gateway-relay`、または `stt-tts/managed-room` の Gateway 所有 Talk セッションを作成します。`brain: "direct-tools"` には `operator.admin` が必要です。
    - `talk.session.join` は、managed-room セッショントークンを検証し、必要に応じて `session.ready` または `session.replaced` イベントを送出し、平文トークンや保存済みトークンハッシュを含めずに、ルーム/セッションのメタデータと最近の Talk イベントを返します。
    - `talk.session.appendAudio` は、Gateway 所有のリアルタイムリレーおよび文字起こしセッションに base64 PCM 入力音声を追加します。
    - `talk.session.startTurn`、`talk.session.endTurn`、`talk.session.cancelTurn` は、状態がクリアされる前に古いターンを拒否しながら、managed-room のターンライフサイクルを駆動します。
    - `talk.session.cancelOutput` は、主に Gateway リレーセッションで VAD 制御の割り込みに使うため、アシスタント音声出力を停止します。
    - `talk.session.submitToolResult` は、Gateway 所有のリアルタイムリレーセッションから送出されたプロバイダーツール呼び出しを完了します。最終結果が後続する中間ツール出力には `options: { willContinue: true }` を渡し、別のリアルタイムアシスタント応答を開始せずにツール結果でプロバイダー呼び出しを満たす必要がある場合は `options: { suppressResponse: true }` を渡します。
    - `talk.session.close` は、Gateway 所有のリレー、文字起こし、または managed-room セッションを閉じ、終端 Talk イベントを送出します。
    - `talk.mode` は、WebChat/Control UI クライアント向けに現在の Talk モード状態を設定/ブロードキャストします。
    - `talk.client.create` は、Gateway が設定、認証情報、指示、ツールポリシーを所有したまま、`webrtc` または `provider-websocket` を使ってクライアント所有のリアルタイムプロバイダーセッションを作成します。
    - `talk.client.toolCall` により、クライアント所有のリアルタイムトランスポートは、プロバイダーツール呼び出しを Gateway ポリシーへ転送できます。最初にサポートされるツールは `openclaw_agent_consult` です。クライアントは実行 ID を受け取り、プロバイダー固有のツール結果を送信する前に、通常のチャットライフサイクルイベントを待機します。
    - `talk.event` は、リアルタイム、文字起こし、STT/TTS、managed-room、テレフォニー、ミーティングアダプター向けの単一 Talk イベントチャネルです。
    - `talk.speak` は、アクティブな Talk 音声合成プロバイダーを通じて音声を合成します。
    - `tts.status` は、TTS の有効状態、アクティブプロバイダー、フォールバックプロバイダー、プロバイダー設定状態を返します。
    - `tts.providers` は、表示可能な TTS プロバイダーインベントリを返します。
    - `tts.enable` と `tts.disable` は、TTS 設定状態を切り替えます。
    - `tts.setProvider` は、優先 TTS プロバイダーを更新します。
    - `tts.convert` は、単発のテキスト読み上げ変換を実行します。

  </Accordion>

  <Accordion title="シークレット、設定、更新、ウィザード">
    - `secrets.reload` は、アクティブな SecretRef を再解決し、完全に成功した場合にのみランタイムシークレット状態を差し替えます。
    - `secrets.resolve` は、特定のコマンド/ターゲットセットに対する、コマンド対象のシークレット割り当てを解決します。
    - `config.get` は、現在の設定スナップショットとハッシュを返します。
    - `config.set` は、検証済みの設定ペイロードを書き込みます。
    - `config.patch` は、部分的な設定更新をマージします。
    - `config.apply` は、完全な設定ペイロードを検証して置き換えます。
    - `config.schema` は、Control UI と CLI ツールで使用されるライブ設定スキーマペイロードを返します。スキーマ、`uiHints`、バージョン、生成メタデータを含み、ランタイムが読み込める場合は Plugin + チャネルのスキーマメタデータも含みます。このスキーマには、UI で使われるものと同じラベルおよびヘルプテキストから派生したフィールド `title` / `description` メタデータが含まれます。フィールドドキュメントが一致する場合は、ネストしたオブジェクト、ワイルドカード、配列項目、`anyOf` / `oneOf` / `allOf` の合成ブランチも含まれます。
    - `config.schema.lookup` は、1 つの設定パスに対してパススコープの検索ペイロードを返します。正規化済みパス、浅いスキーマノード、一致したヒント + `hintPath`、UI/CLI ドリルダウン向けの直下の子サマリーを含みます。検索スキーマノードは、ユーザー向けドキュメントと一般的な検証フィールド（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、数値/文字列/配列/オブジェクトの境界、`additionalProperties`、`deprecated`、`readOnly`、`writeOnly` などのフラグ）を保持します。子サマリーは、`key`、正規化済み `path`、`type`、`required`、`hasChildren`、および一致した `hint` / `hintPath` を公開します。
    - `update.run` は Gateway 更新フローを実行し、更新自体が成功した場合にのみ再起動をスケジュールします。セッションを持つ呼び出し元は `continuationMessage` を含められるため、起動時に再起動継続キューを通じて後続のエージェントターンを 1 つ再開できます。パッケージマネージャーによる更新では、パッケージ差し替え後に、遅延なし、クールダウンなしの更新再起動を強制します。これにより、古い Gateway プロセスが置き換え済みの `dist` ツリーから遅延読み込みを続けないようにします。
    - `update.status` は、利用可能な場合は再起動後に実行中のバージョンを含め、最新のキャッシュ済み更新再起動センチネルを返します。
    - `wizard.start`、`wizard.next`、`wizard.status`、`wizard.cancel` は、WS RPC 経由でオンボーディングウィザードを公開します。

  </Accordion>

  <Accordion title="エージェントとワークスペースのヘルパー">
    - `agents.list` は、有効なモデルとランタイムメタデータを含む、構成済みのエージェントエントリを返します。
    - `agents.create`、`agents.update`、`agents.delete` は、エージェントレコードとワークスペース配線を管理します。
    - `agents.files.list`、`agents.files.get`、`agents.files.set` は、エージェント向けに公開されるブートストラップワークスペースファイルを管理します。
    - `tasks.list`、`tasks.get`、`tasks.cancel` は、Gateway タスク台帳を SDK およびオペレータークライアントに公開します。
    - `artifacts.list`、`artifacts.get`、`artifacts.download` は、明示的な `sessionKey`、`runId`、または `taskId` スコープについて、トランスクリプト由来の成果物サマリーとダウンロードを公開します。実行クエリとタスククエリは、所有セッションをサーバー側で解決し、一致する来歴を持つトランスクリプトメディアのみを返します。安全でない URL ソースまたはローカル URL ソースは、サーバー側で取得する代わりに未サポートのダウンロードを返します。
    - `environments.list` と `environments.status` は、SDK クライアント向けに読み取り専用の Gateway ローカルおよびノード環境検出を公開します。
    - `agent.identity.get` は、エージェントまたはセッションに対する有効なアシスタント ID を返します。
    - `agent.wait` は、実行の完了を待機し、利用可能な場合は終端スナップショットを返します。

  </Accordion>

  <Accordion title="セッション制御">
    - `sessions.list` は、現在のセッションインデックスを返します。エージェントランタイムバックエンドが構成されている場合は、行ごとの `agentRuntime` メタデータも含まれます。
    - `sessions.subscribe` と `sessions.unsubscribe` は、現在の WS クライアントに対するセッション変更イベントのサブスクリプションを切り替えます。
    - `sessions.messages.subscribe` と `sessions.messages.unsubscribe` は、1 つのセッションに対するトランスクリプト/メッセージイベントのサブスクリプションを切り替えます。
    - `sessions.preview` は、特定のセッションキーに対して境界付けられたトランスクリプトプレビューを返します。
    - `sessions.describe` は、完全一致するセッションキーについて 1 つの Gateway セッション行を返します。
    - `sessions.resolve` は、セッションターゲットを解決または正規化します。
    - `sessions.create` は、新しいセッションエントリを作成します。
    - `sessions.send` は、既存のセッションへメッセージを送信します。
    - `sessions.steer` は、アクティブなセッション向けの interrupt-and-steer バリアントです。
    - `sessions.abort` は、セッションのアクティブな作業を中止します。呼び出し元は `key` と任意の `runId` を渡すことも、Gateway がセッションへ解決できるアクティブな実行について `runId` のみを渡すこともできます。
    - `sessions.patch` は、セッションメタデータ/オーバーライドを更新し、解決済みの正規モデルと有効な `agentRuntime` を報告します。
    - `sessions.reset`、`sessions.delete`、`sessions.compact` は、セッションメンテナンスを実行します。
    - `sessions.get` は、保存済みの完全なセッション行を返します。
    - チャット実行は引き続き `chat.history`、`chat.send`、`chat.abort`、`chat.inject` を使用します。`chat.history` は UI クライアント向けに表示用に正規化されています。インラインディレクティブタグは表示テキストから削除され、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、切り詰められたツール呼び出しブロックを含む）および漏出した ASCII/全角のモデル制御トークンは削除され、正確な `NO_REPLY` / `no_reply` などの純粋なサイレントークンのアシスタント行は省略され、過大な行はプレースホルダーに置き換えられることがあります。

  </Accordion>

  <Accordion title="デバイスペアリングとデバイストークン">
    - `device.pair.list` は、保留中および承認済みのペアリング済みデバイスを返します。
    - `device.pair.approve`、`device.pair.reject`、`device.pair.remove` は、デバイスペアリングレコードを管理します。
    - `device.token.rotate` は、承認済みロールと呼び出し元スコープの境界内で、ペアリング済みデバイストークンをローテーションします。
    - `device.token.revoke` は、承認済みロールと呼び出し元スコープの境界内で、ペアリング済みデバイストークンを取り消します。

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
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list`、`exec.approval.resolve` は、単発の exec 承認リクエストと、保留中の承認の検索/再生を扱います。
    - `exec.approval.waitDecision` は、保留中の exec 承認 1 件を待機し、最終判断を返します（タイムアウト時は `null`）。
    - `exec.approvals.get` と `exec.approvals.set` は、gateway の exec 承認ポリシーのスナップショットを管理します。
    - `exec.approvals.node.get` と `exec.approvals.node.set` は、node relay コマンドを介して node ローカルの exec 承認ポリシーを管理します。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision`、`plugin.approval.resolve` は、plugin 定義の承認フローを扱います。

  </Accordion>

  <Accordion title="自動化、Skills、ツール">
    - 自動化: `wake` は、即時または次回 Heartbeat での wake テキスト注入をスケジュールします。`cron.get`、`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` はスケジュール済み作業を管理します。
    - Skills とツール: `commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。

  </Accordion>
</AccordionGroup>

### 共通イベントファミリー

- `chat`: `chat.inject` などの UI チャット更新、および transcript 専用のその他のチャットイベント。
- `session.message` と `session.tool`: 購読中の session 向けの transcript/event-stream 更新。
- `sessions.changed`: session index またはメタデータが変更されました。
- `presence`: システム presence スナップショット更新。
- `tick`: 定期的な keepalive / liveness イベント。
- `health`: gateway health スナップショット更新。
- `heartbeat`: Heartbeat イベントストリーム更新。
- `cron`: Cron 実行/job 変更イベント。
- `shutdown`: gateway shutdown 通知。
- `node.pair.requested` / `node.pair.resolved`: node pairing ライフサイクル。
- `node.invoke.request`: node invoke request broadcast。
- `device.pair.requested` / `device.pair.resolved`: paired-device ライフサイクル。
- `voicewake.changed`: wake-word trigger config が変更されました。
- `exec.approval.requested` / `exec.approval.resolved`: exec 承認ライフサイクル。
- `plugin.approval.requested` / `plugin.approval.resolved`: plugin 承認ライフサイクル。

### Node ヘルパーメソッド

- Nodes は、自動許可チェック用に skill 実行可能ファイルの現在の一覧を取得するため、`skills.bins` を呼び出すことができます。

### タスク台帳 RPC

Operator クライアントは、タスク台帳 RPC を通じて Gateway バックグラウンドタスク記録を検査およびキャンセルできます。これらのメソッドは、生の runtime state ではなく、サニタイズ済みのタスク概要を返します。

- `tasks.list` には `operator.read` が必要です。
  - Params: 省略可能な `status`（`"queued"`、`"running"`、`"completed"`、`"failed"`、`"cancelled"`、`"timed_out"`）、またはそれらの status の配列、省略可能な `agentId`、省略可能な `sessionKey`、`1` から `500` までの省略可能な `limit`、および省略可能な文字列 `cursor`。
  - Result: `{ "tasks": TaskSummary[], "nextCursor"?: string }`。
- `tasks.get` には `operator.read` が必要です。
  - Params: `{ "taskId": string }`。
  - Result: `{ "task": TaskSummary }`。
  - 存在しない task id は、Gateway の not-found error shape を返します。
- `tasks.cancel` には `operator.write` が必要です。
  - Params: `{ "taskId": string, "reason"?: string }`。
  - Result:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`。
  - `found` は、台帳に一致するタスクがあったかどうかを報告します。`cancelled` は、runtime がキャンセルを受け入れたか、または記録したかどうかを報告します。

`TaskSummary` には、`id`、`status`、および `kind`、`runtime`、`title`、`agentId`、`sessionKey`、`childSessionKey`、`ownerKey`、`runId`、`taskId`、`flowId`、`parentTaskId`、`sourceId`、タイムスタンプ、進捗、terminal summary、サニタイズ済みエラーテキストなどの省略可能なメタデータが含まれます。

### Operator ヘルパーメソッド

- Operators は、agent の runtime command inventory を取得するため、`commands.list`（`operator.read`）を呼び出すことができます。
  - `agentId` は省略可能です。default agent workspace を読み取るには省略します。
  - `scope` は、primary `name` がどの surface を対象にするかを制御します。
    - `text` は先頭の `/` なしで primary text command token を返します
    - `native` と default の `both` path は、利用可能な場合 provider-aware native names を返します
  - `textAliases` は `/model` や `/m` などの正確な slash aliases を保持します。
  - `nativeName` は、存在する場合に provider-aware native command name を保持します。
  - `provider` は省略可能で、native naming と native plugin command availability にのみ影響します。
  - `includeArgs=false` は、レスポンスから serialized argument metadata を省略します。
- Operators は、agent の runtime tool catalog を取得するため、`tools.catalog`（`operator.read`）を呼び出すことができます。レスポンスには grouped tools と provenance metadata が含まれます。
  - `source`: `core` または `plugin`
  - `pluginId`: `source="plugin"` の場合の plugin owner
  - `optional`: plugin tool が optional かどうか
- Operators は、session の runtime-effective tool inventory を取得するため、`tools.effective`（`operator.read`）を呼び出すことができます。
  - `sessionKey` は必須です。
  - gateway は、caller-supplied auth または delivery context を受け入れるのではなく、session server-side から trusted runtime context を導出します。
  - レスポンスは session-scoped であり、core、plugin、channel tools を含め、active conversation が今使用できるものを反映します。
- Operators は、`/tools/invoke` と同じ gateway policy path を通じて利用可能なツール 1 つを呼び出すため、`tools.invoke`（`operator.write`）を呼び出すことができます。
  - `name` は必須です。`args`、`sessionKey`、`agentId`、`confirm`、`idempotencyKey` は省略可能です。
  - `sessionKey` と `agentId` の両方が存在する場合、解決された session agent は `agentId` と一致する必要があります。
  - レスポンスは SDK-facing envelope で、`ok`、`toolName`、省略可能な `output`、および型付きの `error` fields を含みます。Approval または policy refusals は、gateway tool policy pipeline をバイパスするのではなく、payload 内で `ok:false` を返します。
- Operators は、agent の visible skill inventory を取得するため、`skills.status`（`operator.read`）を呼び出すことができます。
  - `agentId` は省略可能です。default agent workspace を読み取るには省略します。
  - レスポンスには eligibility、missing requirements、config checks、および raw secret values を公開しない sanitized install options が含まれます。
- Operators は、ClawHub discovery metadata のために `skills.search` と `skills.detail`（`operator.read`）を呼び出すことができます。
- Operators は、private skill archive をインストール前に stage するため、`skills.upload.begin`、`skills.upload.chunk`、`skills.upload.commit`（`operator.admin`）を呼び出すことができます。これは trusted clients 向けの独立した admin upload path であり、通常の ClawHub skill install flow ではありません。`skills.install.allowUploadedArchives` が有効でない限り、デフォルトで無効です。
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    は、その slug と force value に紐づく upload を作成します。
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` は、正確な decoded offset に bytes を追加します。
  - `skills.upload.commit({ uploadId, sha256? })` は、final size と SHA-256 を検証します。Commit は upload を finalizes するだけで、skill はインストールしません。
  - Uploaded skill archives は、`SKILL.md` root を含む zip archives です。archive の internal directory name が install target を選択することはありません。
- Operators は、3 つのモードで `skills.install`（`operator.admin`）を呼び出すことができます。
  - ClawHub mode: `{ source: "clawhub", slug, version?, force? }` は、skill folder を default agent workspace の `skills/` directory にインストールします。
  - Upload mode: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    は、committed upload を default agent workspace の `skills/<slug>`
    directory にインストールします。slug と force value は、元の
    `skills.upload.begin` request と一致する必要があります。このモードは、
    `skills.install.allowUploadedArchives` が有効でない限り拒否されます。この設定は
    ClawHub installs には影響しません。
  - Gateway installer mode: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    は、gateway host 上で宣言済みの `metadata.openclaw.install` action を実行します。
- Operators は、2 つのモードで `skills.update`（`operator.admin`）を呼び出すことができます。
  - ClawHub mode は、default agent workspace 内の tracked slug 1 つ、または tracked ClawHub installs すべてを更新します。
  - Config mode は、`enabled`、`apiKey`、`env` などの `skills.entries.<skillKey>` values に patch を適用します。

### `models.list` views

`models.list` は、省略可能な `view` parameter を受け入れます。

- 省略または `"default"`: 現在の runtime behavior。`agents.defaults.models` が設定されている場合、レスポンスは allowed catalog になり、`provider/*` entries に対して dynamically discovered models も含まれます。それ以外の場合、レスポンスは full Gateway catalog です。
- `"configured"`: picker-sized behavior。`agents.defaults.models` が設定されている場合は引き続き優先され、`provider/*` entries に対する provider-scoped discovery も含まれます。allowlist がない場合、レスポンスは explicit `models.providers.*.models` entries を使用し、configured model rows が存在しない場合にのみ full catalog にフォールバックします。
- `"all"`: full Gateway catalog。`agents.defaults.models` をバイパスします。通常の model pickers ではなく、diagnostics と discovery UIs に使用してください。

## Exec 承認

- exec request に承認が必要な場合、gateway は `exec.approval.requested` を broadcast します。
- Operator clients は、`exec.approval.resolve` を呼び出して解決します（`operator.approvals` scope が必要）。
- `host=node` の場合、`exec.approval.request` は `systemRunPlan`（canonical `argv`/`cwd`/`rawCommand`/session metadata）を含む必要があります。`systemRunPlan` がない request は拒否されます。
- 承認後、forwarded `node.invoke system.run` calls は、その canonical
  `systemRunPlan` を authoritative command/cwd/session context として再利用します。
- caller が prepare と最終的な承認済み `system.run` forward の間で `command`、`rawCommand`、`cwd`、`agentId`、または
  `sessionKey` を変更した場合、gateway は mutated payload を信頼せず、run を拒否します。

## Agent delivery fallback

- `agent` requests は、outbound delivery を要求するために `deliver=true` を含めることができます。
- `bestEffortDeliver=false` は strict behavior を維持します。未解決または internal-only delivery targets は `INVALID_REQUEST` を返します。
- `bestEffortDeliver=true` は、external deliverable route が解決できない場合（たとえば internal/webchat sessions や ambiguous multi-channel configs）に session-only execution への fallback を許可します。
- Final `agent` results は、delivery が request されていた場合に `result.deliveryStatus` を含むことがあります。これは [`openclaw agent --json --deliver`](/ja-JP/cli/agent#json-delivery-status) で文書化されているものと同じ `sent`、`suppressed`、`partial_failed`、`failed`
  statuses を使用します。

## バージョニング

- `PROTOCOL_VERSION` は `src/gateway/protocol/version.ts` にあります。
- Clients は `minProtocol` + `maxProtocol` を送信します。server は、現在の protocol を含まない ranges を拒否します。Native clients は v3 lower bound を使用するため、additive v4 clients は v3 gateways にも到達できます。
- Schemas + models は TypeBox definitions から生成されます。
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Client constants

`src/gateway/client.ts` の reference client はこれらの defaults を使用します。Values は protocol v4 全体で stable であり、third-party clients に期待される baseline です。

| 定数                                      | デフォルト                                            | ソース                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `3`                                                   | `src/gateway/protocol/version.ts`                                                          |
| リクエストタイムアウト（RPC ごと）        | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| 事前認証 / connect-challenge タイムアウト | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts`（config/env でペアのサーバー/クライアント予算を引き上げ可能） |
| 初回再接続バックオフ                      | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| 最大再接続バックオフ                      | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| device-token クローズ後の高速再試行クランプ | `250` ms                                            | `src/gateway/client.ts`                                                                    |
| `terminate()` 前の強制停止猶予            | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` のデフォルトタイムアウト  | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| デフォルト tick 間隔（`hello-ok` 前）     | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| tick タイムアウト時のクローズ             | 無通信が `tickIntervalMs * 2` を超えると code `4000` | `src/gateway/client.ts`                                                                    |
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
- プライベートイングレスの `gateway.auth.mode: "none"` は共有シークレットの接続認証を
  完全にスキップします。このモードを公開または信頼されていないイングレスに公開しないでください。
- ペアリング後、Gateway は接続 role + scopes にスコープされた **device token** を発行します。
  これは `hello-ok.auth.deviceToken` で返され、今後の接続のために
  クライアントで永続化する必要があります。
- クライアントは、接続が成功するたびに主要な `hello-ok.auth.deviceToken` を永続化する必要があります。
- その**保存済み** device token で再接続する場合は、その token に対して保存済みの
  承認済み scope セットも再利用する必要があります。これにより、すでに許可された
  read/probe/status アクセスが維持され、再接続が暗黙の admin-only scope だけに
  静かに縮小されることを避けられます。
- クライアント側の接続認証の組み立て（`src/gateway/client.ts` の `selectConnectAuth`）:
  - `auth.password` は独立しており、設定されている場合は常に転送されます。
  - `auth.token` は優先順位に従って設定されます。明示的な共有 token が最初、
    次に明示的な `deviceToken`、次に保存済みのデバイスごとの token（`deviceId` + `role` でキー付け）です。
  - `auth.bootstrapToken` は、上記のいずれも `auth.token` に解決されなかった場合にのみ送信されます。
    共有 token または解決済みの device token がある場合は抑制されます。
  - ワンショットの `AUTH_TOKEN_MISMATCH` 再試行で保存済み device token を自動昇格する処理は、
    **信頼済みエンドポイントのみ** に制限されます。つまり、ループバック、または
    固定された `tlsFingerprint` を持つ `wss://` です。ピン留めなしの公開 `wss://` は該当しません。
- 追加の `hello-ok.auth.deviceTokens` エントリは bootstrap 引き渡し token です。
  接続が `wss://` やループバック/local ペアリングなどの信頼済み transport 上で
  bootstrap 認証を使用した場合にのみ永続化してください。
- クライアントが**明示的な** `deviceToken` または明示的な `scopes` を指定した場合、
  その呼び出し元が要求した scope セットが権威を持ちます。キャッシュされた scopes は、
  クライアントが保存済みのデバイスごとの token を再利用する場合にのみ再利用されます。
- Device tokens は `device.token.rotate` と `device.token.revoke` でローテート/失効できます
  （`operator.pairing` scope が必要）。
- `device.token.rotate` はローテーションメタデータを返します。置換後の bearer token は、
  その device token ですでに認証されている同一デバイスからの呼び出しの場合にのみ
  エコーします。これにより、token-only クライアントは再接続前に置換 token を永続化できます。
  共有/admin ローテーションでは bearer token をエコーしません。
- token の発行、ローテーション、失効は、そのデバイスのペアリングエントリに記録された
  承認済み role セットに制限されます。token の変更によって、ペアリング承認で許可されていない
  デバイス role を拡張したり対象にしたりすることはできません。
- ペアリング済みデバイスの token セッションでは、呼び出し元が `operator.admin` も持つ場合を除き、
  デバイス管理は自己スコープです。admin ではない呼び出し元は、**自分自身の**
  デバイスエントリだけを削除/失効/ローテートできます。
- `device.token.rotate` と `device.token.revoke` は、対象 operator token の scope セットも
  呼び出し元の現在のセッション scopes と照合します。admin ではない呼び出し元は、
  自分がすでに保持しているものより広い operator token をローテートまたは失効できません。
- 認証失敗には `error.details.code` と復旧ヒントが含まれます:
  - `error.details.canRetryWithDeviceToken`（boolean）
  - `error.details.recommendedNextStep`（`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`）
- `AUTH_TOKEN_MISMATCH` に対するクライアント動作:
  - 信頼済みクライアントは、キャッシュされたデバイスごとの token で 1 回だけ上限付き再試行を試みることができます。
  - その再試行が失敗した場合、クライアントは自動再接続ループを停止し、operator の対応ガイダンスを表示する必要があります。
- `AUTH_SCOPE_MISMATCH` は、device token は認識されたものの、要求された role/scopes をカバーしていないことを意味します。
  クライアントはこれを不正な token として提示しないでください。
  operator に再ペアリングするか、より狭い/広い scope 契約を承認するよう促してください。

## デバイス ID + ペアリング

- Node は、キーペアのフィンガープリントから派生した安定したデバイス ID（`device.id`）を含める必要があります。
- Gateways はデバイス + role ごとに tokens を発行します。
- local 自動承認が有効でない限り、新しいデバイス ID にはペアリング承認が必要です。
- ペアリングの自動承認は、直接の local loopback 接続を中心にしています。
- OpenClaw には、信頼済みの共有シークレットヘルパーフロー向けに、
  狭い backend/container-local の自己接続パスもあります。
- 同一ホストの tailnet または LAN 接続も、ペアリングでは引き続きリモートとして扱われ、
  承認が必要です。
- WS クライアントは通常、`connect` 中に `device` ID を含めます（operator +
  node）。デバイスなしの operator 例外は、明示的な信頼パスだけです:
  - localhost-only の安全でない HTTP 互換性のための `gateway.controlUi.allowInsecureAuth=true`。
  - 成功した `gateway.auth.mode: "trusted-proxy"` operator Control UI 認証。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（緊急回避用、重大なセキュリティ低下）。
  - 共有 gateway token/password で認証された、直接ループバックの `gateway-client` backend RPC。
- すべての接続は、サーバーから提供された `connect.challenge` nonce に署名する必要があります。

### デバイス認証移行診断

チャレンジ前の署名動作をまだ使用しているレガシークライアント向けに、`connect` は現在、
安定した `error.details.reason` とともに `error.details.code` の下で
`DEVICE_AUTH_*` 詳細コードを返します。

一般的な移行失敗:

| メッセージ                  | details.code                     | details.reason           | 意味                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | クライアントが `device.nonce` を省略した（または空で送信した）。 |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | クライアントが古い/誤った nonce で署名した。       |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 署名ペイロードが v2 ペイロードと一致しない。       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 署名されたタイムスタンプが許容 skew の範囲外。     |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` が公開鍵フィンガープリントと一致しない。 |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開鍵の形式/正規化に失敗した。                   |

移行先:

- 常に `connect.challenge` を待ちます。
- サーバー nonce を含む v2 ペイロードに署名します。
- 同じ nonce を `connect.params.device.nonce` で送信します。
- 推奨される署名ペイロードは `v3` で、device/client/role/scopes/token/nonce フィールドに加えて
  `platform` と `deviceFamily` をバインドします。
- 互換性のためにレガシー `v2` 署名は引き続き受け入れられますが、
  ペアリング済みデバイスのメタデータピン留めが再接続時のコマンドポリシーを引き続き制御します。

## TLS + ピン留め

- TLS は WS 接続でサポートされています。
- クライアントは任意で gateway 証明書フィンガープリントをピン留めできます
  （`gateway.tls` config に加えて `gateway.remote.tlsFingerprint` または CLI `--tls-fingerprint` を参照）。

## スコープ

このプロトコルは、**完全な gateway API**（status、channels、models、chat、
agent、sessions、nodes、approvals など）を公開します。正確なサーフェスは
`src/gateway/protocol/schema.ts` の TypeBox スキーマで定義されています。

## 関連

- [Bridge プロトコル](/ja-JP/gateway/bridge-protocol)
- [Gateway runbook](/ja-JP/gateway)
