---
read_when:
    - Gateway WSクライアントの実装または更新
    - プロトコルの不一致または接続失敗のデバッグ
    - プロトコルスキーマ/モデルの再生成
summary: 'Gateway WebSocket プロトコル: ハンドシェイク、フレーム、バージョニング'
title: Gateway プロトコル
x-i18n:
    generated_at: "2026-05-06T05:06:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a5eb7a84dbe0664fd78271408686a643dbc0579de5b5402fd1a8d33fd59221d
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS プロトコルは、OpenClaw の**単一コントロールプレーン + Node トランスポート**です。すべてのクライアント（CLI、Web UI、macOS アプリ、iOS/Android Node、ヘッドレス Node）は WebSocket で接続し、ハンドシェイク時に**ロール** + **スコープ**を宣言します。

## トランスポート

- WebSocket、JSON ペイロードを持つテキストフレーム。
- 最初のフレームは**必ず** `connect` リクエストでなければなりません。
- 接続前フレームの上限は 64 KiB です。ハンドシェイクが成功した後、クライアントは `hello-ok.policy.maxPayload` と `hello-ok.policy.maxBufferedBytes` の制限に従う必要があります。診断が有効な場合、過大な受信フレームと低速な送信バッファーは、Gateway が影響を受けたフレームを閉じるまたは破棄する前に `payload.large` イベントを発行します。これらのイベントはサイズ、制限、サーフェス、安全な理由コードを保持します。メッセージ本文、添付内容、生フレーム本文、トークン、Cookie、シークレット値は保持しません。

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
    "maxProtocol": 3,
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
    "protocol": 3,
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

Gateway がまだ起動時サイドカーの完了中である間、`connect` リクエストは `details.reason` が `"startup-sidecars"` に設定され、`retryAfterMs` を含む再試行可能な `UNAVAILABLE` エラーを返すことがあります。クライアントは、その応答を最終的なハンドシェイク失敗として表示するのではなく、全体の接続予算内で再試行する必要があります。

`server`、`features`、`snapshot`、`policy` はすべてスキーマ（`src/gateway/protocol/schema/frames.ts`）で必須です。`auth` も必須で、ネゴシエートされたロール/スコープを報告します。`canvasHostUrl` は任意です。

デバイストークンが発行されない場合、`hello-ok.auth` はトークンフィールドなしでネゴシエートされた権限を報告します。

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

信頼された同一プロセスのバックエンドクライアント（`client.id: "gateway-client"`、`client.mode: "backend"`）は、共有 Gateway トークン/パスワードで認証する場合、直接ループバック接続で `device` を省略できます。この経路は内部コントロールプレーン RPC 用に予約されており、古い CLI/デバイスのペアリング基準が、サブエージェントセッション更新などのローカルバックエンド作業を妨げないようにします。リモートクライアント、ブラウザー起点クライアント、Node クライアント、明示的なデバイストークン/デバイス ID クライアントは、引き続き通常のペアリングとスコープアップグレード確認を使用します。

デバイストークンが発行されると、`hello-ok` には次も含まれます。

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

組み込みの Node/operator ブートストラップフローでは、プライマリ Node トークンは `scopes: []` のままで、引き渡された operator トークンはブートストラップ operator 許可リスト（`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`）に境界付けられたままです。ブートストラップのスコープ確認はロール接頭辞付きのままです。operator エントリは operator リクエストのみを満たし、operator 以外のロールは引き続き自身のロール接頭辞配下のスコープを必要とします。

### Node の例

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
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

完全な operator スコープモデル、承認時の確認、共有シークレットのセマンティクスについては、[operator スコープ](/ja-JP/gateway/operator-scopes)を参照してください。

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

`includeSecrets: true` を指定した `talk.config` には、`operator.talk.secrets`（または `operator.admin`）が必要です。

Plugin が登録した Gateway RPC メソッドは独自の operator スコープを要求できますが、予約済みのコア管理者接頭辞（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は常に `operator.admin` に解決されます。

メソッドスコープは最初のゲートにすぎません。`chat.send` 経由で到達する一部のスラッシュコマンドは、その上により厳密なコマンドレベルの確認を適用します。たとえば、永続的な `/config set` と `/config unset` の書き込みには `operator.admin` が必要です。

`node.pair.approve` には、基本メソッドスコープに加えて承認時の追加スコープ確認もあります。

- コマンドなしリクエスト: `operator.pairing`
- 非 exec Node コマンドを含むリクエスト: `operator.pairing` + `operator.write`
- `system.run`、`system.run.prepare`、または `system.which` を含むリクエスト: `operator.pairing` + `operator.admin`

### 機能/コマンド/権限（Node）

Node は接続時に機能クレームを宣言します。

- `caps`: `camera`、`canvas`、`screen`、`location`、`voice`、`talk` などの高レベル機能カテゴリ。
- `commands`: invoke 用のコマンド許可リスト。
- `permissions`: 粒度の細かいトグル（例: `screen.record`、`camera.capture`）。

Gateway はこれらを**クレーム**として扱い、サーバー側の許可リストを強制します。

## プレゼンス

- `system-presence` はデバイス ID をキーとするエントリを返します。
- プレゼンスエントリには `deviceId`、`roles`、`scopes` が含まれるため、UI はデバイスが **operator** と **node** の両方として接続している場合でも、デバイスごとに 1 行で表示できます。
- `node.list` には任意の `lastSeenAtMs` と `lastSeenReason` フィールドが含まれます。接続中の Node は現在の接続時刻を理由 `connect` とともに `lastSeenAtMs` として報告し、ペアリング済み Node は、信頼された Node イベントがペアリングメタデータを更新したときに、永続的なバックグラウンドプレゼンスも報告できます。

### Node のバックグラウンド alive イベント

Node は `event: "node.presence.alive"` を指定して `node.event` を呼び出し、ペアリング済み Node がバックグラウンド起床中に alive だったことを、接続済みとマークせずに記録できます。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` は閉じた列挙型です: `background`、`silent_push`、`bg_app_refresh`、`significant_location`、`manual`、または `connect`。不明な trigger 文字列は、永続化前に Gateway によって `background` に正規化されます。このイベントが永続的になるのは、認証済み Node デバイスセッションのみです。デバイスなしまたは未ペアリングのセッションは `handled: false` を返します。

成功した Gateway は構造化された結果を返します。

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

古い Gateway は `node.event` に対して引き続き `{ "ok": true }` を返すことがあります。クライアントはこれを、永続的なプレゼンス永続化ではなく、承認済み RPC として扱う必要があります。

## ブロードキャストイベントのスコープ指定

サーバーからプッシュされる WebSocket ブロードキャストイベントはスコープでゲートされるため、pairing スコープまたは Node 専用のセッションがセッション内容を受動的に受信することはありません。

- **チャット、エージェント、ツール結果フレーム**（ストリーミングされた `agent` イベントとツール呼び出し結果を含む）には、少なくとも `operator.read` が必要です。`operator.read` のないセッションはこれらのフレームを完全にスキップします。
- **Plugin 定義の `plugin.*` ブロードキャスト**は、Plugin が登録した方法に応じて `operator.write` または `operator.admin` にゲートされます。
- **ステータスとトランスポートイベント**（`heartbeat`、`presence`、`tick`、接続/切断ライフサイクルなど）は、トランスポートの健全性をすべての認証済みセッションから観測できるよう、制限なしのままです。
- **不明なブロードキャストイベントファミリー**は、登録済みハンドラーが明示的に緩和しない限り、デフォルトでスコープゲートされます（フェイルクローズ）。

各クライアント接続は自身のクライアント単位シーケンス番号を保持するため、異なるクライアントがイベントストリームの異なるスコープフィルター済みサブセットを見る場合でも、そのソケット上でブロードキャストは単調な順序を保ちます。

## 一般的な RPC メソッドファミリー

公開 WS サーフェスは、上記のハンドシェイク/認証の例よりも広範です。これは生成されたダンプではありません。`hello-ok.features.methods` は、`src/gateway/server-methods-list.ts` と読み込まれた Plugin/channel メソッドエクスポートから構築された保守的な探索リストです。`src/gateway/server-methods/*.ts` の完全な列挙ではなく、機能探索として扱ってください。

<AccordionGroup>
  <Accordion title="システムと ID">
    - `health` は、キャッシュ済みまたは新たにプローブされた Gateway 健全性スナップショットを返します。
    - `diagnostics.stability` は、直近の境界付き診断安定性レコーダーを返します。これは、イベント名、カウント、バイトサイズ、メモリ読み取り値、キュー/セッション状態、channel/Plugin 名、セッション ID などの運用メタデータを保持します。チャットテキスト、Webhook 本文、ツール出力、生リクエスト本文またはレスポンス本文、トークン、Cookie、シークレット値は保持しません。operator 読み取りスコープが必要です。
    - `status` は `/status` 形式の Gateway サマリーを返します。機密フィールドは admin スコープの operator クライアントにのみ含まれます。
    - `gateway.identity.get` は relay とペアリングフローで使用される Gateway デバイス ID を返します。
    - `system-presence` は、接続中の operator/Node デバイスの現在のプレゼンススナップショットを返します。
    - `system-event` はシステムイベントを追加し、プレゼンスコンテキストを更新/ブロードキャストできます。
    - `last-heartbeat` は最新の永続化済み Heartbeat イベントを返します。
    - `set-heartbeats` は Gateway 上の Heartbeat 処理を切り替えます。

  </Accordion>

  <Accordion title="モデルと使用状況">
    - `models.list` はランタイムで許可されたモデルカタログを返します。ピッカーサイズの設定済みモデル（まず `agents.defaults.models`、次に `models.providers.*.models`）には `{ "view": "configured" }` を渡し、完全なカタログには `{ "view": "all" }` を渡します。
    - `usage.status` はプロバイダーの使用状況ウィンドウ/残りクォータの概要を返します。
    - `usage.cost` は日付範囲の集計済みコスト使用状況概要を返します。
    - `doctor.memory.status` は、アクティブなデフォルトエージェントワークスペースのベクトルメモリ/キャッシュ済み埋め込みの準備状況を返します。呼び出し元がライブの埋め込みプロバイダー ping を明示的に求める場合にのみ、`{ "probe": true }` または `{ "deep": true }` を渡します。
    - `doctor.memory.remHarness` は、リモート制御プレーンのクライアント向けに、範囲制限された読み取り専用の REM ハーネスプレビューを返します。ワークスペースパス、メモリスニペット、レンダリング済みの根拠付き Markdown、深い昇格候補を含められるため、呼び出し元には `operator.read` が必要です。
    - `sessions.usage` はセッションごとの使用状況概要を返します。
    - `sessions.usage.timeseries` は 1 つのセッションの時系列使用状況を返します。
    - `sessions.usage.logs` は 1 つのセッションの使用状況ログエントリを返します。

  </Accordion>

  <Accordion title="チャンネルとログインヘルパー">
    - `channels.status` は組み込み + バンドル済みチャンネル/Plugin のステータス概要を返します。
    - `channels.logout` は、チャンネルがログアウトをサポートしている場合に、特定のチャンネル/アカウントからログアウトします。
    - `web.login.start` は、現在の QR 対応 Web チャンネルプロバイダーの QR/Web ログインフローを開始します。
    - `web.login.wait` は、その QR/Web ログインフローの完了を待ち、成功時にチャンネルを開始します。
    - `push.test` は、登録済み iOS ノードにテスト APNs プッシュを送信します。
    - `voicewake.get` は、保存済みのウェイクワードトリガーを返します。
    - `voicewake.set` は、ウェイクワードトリガーを更新し、変更をブロードキャストします。

  </Accordion>

  <Accordion title="メッセージングとログ">
    - `send` は、チャットランナー外でチャンネル/アカウント/スレッドを対象に送信するための直接アウトバウンド配信 RPC です。
    - `logs.tail` は、カーソル/制限と最大バイト制御を含む、設定済み Gateway ファイルログの末尾を返します。

  </Accordion>

  <Accordion title="Talk と TTS">
    - `talk.catalog` は、音声、ストリーミング文字起こし、リアルタイム音声用の読み取り専用 Talk プロバイダーカタログを返します。プロバイダー ID、ラベル、設定済み状態、公開されたモデル/音声 ID、正規モード、トランスポート、ブレイン戦略、リアルタイム音声/機能フラグを含みますが、プロバイダーシークレットを返したりグローバル設定を変更したりしません。
    - `talk.config` は有効な Talk 設定ペイロードを返します。`includeSecrets` には `operator.talk.secrets`（または `operator.admin`）が必要です。
    - `talk.session.create` は、`realtime/gateway-relay`、`transcription/gateway-relay`、または `stt-tts/managed-room` 用に Gateway 所有の Talk セッションを作成します。`brain: "direct-tools"` には `operator.admin` が必要です。
    - `talk.session.join` は、管理ルームのセッショントークンを検証し、必要に応じて `session.ready` または `session.replaced` イベントを発行し、平文トークンや保存済みトークンハッシュを含めずに、ルーム/セッションメタデータと最近の Talk イベントを返します。
    - `talk.session.appendAudio` は、Base64 PCM 入力音声を Gateway 所有のリアルタイムリレーおよび文字起こしセッションに追加します。
    - `talk.session.startTurn`、`talk.session.endTurn`、`talk.session.cancelTurn` は、状態がクリアされる前に古いターンを拒否しながら、管理ルームのターンライフサイクルを駆動します。
    - `talk.session.cancelOutput` は、主に Gateway リレーセッションで VAD によってゲートされた割り込み用に、アシスタント音声出力を停止します。
    - `talk.session.submitToolResult` は、Gateway 所有のリアルタイムリレーセッションによって発行されたプロバイダーツール呼び出しを完了します。
    - `talk.session.close` は、Gateway 所有のリレー、文字起こし、または管理ルームセッションを閉じ、終端 Talk イベントを発行します。
    - `talk.mode` は、WebChat/Control UI クライアント向けに現在の Talk モード状態を設定/ブロードキャストします。
    - `talk.client.create` は、Gateway が設定、認証情報、指示、ツールポリシーを所有したまま、`webrtc` または `provider-websocket` を使用してクライアント所有のリアルタイムプロバイダーセッションを作成します。
    - `talk.client.toolCall` は、クライアント所有のリアルタイムトランスポートがプロバイダーツール呼び出しを Gateway ポリシーに転送できるようにします。最初にサポートされるツールは `openclaw_agent_consult` です。クライアントは実行 ID を受け取り、プロバイダー固有のツール結果を送信する前に通常のチャットライフサイクルイベントを待ちます。
    - `talk.event` は、リアルタイム、文字起こし、STT/TTS、管理ルーム、電話、会議アダプター向けの単一 Talk イベントチャンネルです。
    - `talk.speak` は、アクティブな Talk 音声プロバイダーを通じて音声を合成します。
    - `tts.status` は、TTS の有効状態、アクティブプロバイダー、フォールバックプロバイダー、プロバイダー設定状態を返します。
    - `tts.providers` は、表示可能な TTS プロバイダー一覧を返します。
    - `tts.enable` と `tts.disable` は、TTS 設定状態を切り替えます。
    - `tts.setProvider` は、優先 TTS プロバイダーを更新します。
    - `tts.convert` は、単発のテキスト読み上げ変換を実行します。

  </Accordion>

  <Accordion title="シークレット、設定、更新、ウィザード">
    - `secrets.reload` は、アクティブな SecretRef を再解決し、完全に成功した場合にのみランタイムシークレット状態を差し替えます。
    - `secrets.resolve` は、特定のコマンド/ターゲットセットに対するコマンド対象シークレット割り当てを解決します。
    - `config.get` は、現在の設定スナップショットとハッシュを返します。
    - `config.set` は、検証済みの設定ペイロードを書き込みます。
    - `config.patch` は、部分的な設定更新をマージします。
    - `config.apply` は、検証してから完全な設定ペイロードを置き換えます。
    - `config.schema` は、Control UI と CLI ツールで使用されるライブ設定スキーマペイロードを返します。スキーマ、`uiHints`、バージョン、生成メタデータが含まれ、ランタイムが読み込める場合は Plugin + チャンネルのスキーマメタデータも含まれます。このスキーマには、UI で使用されるものと同じラベルおよびヘルプテキストから派生したフィールド `title` / `description` メタデータが含まれます。一致するフィールドドキュメントが存在する場合は、ネストされたオブジェクト、ワイルドカード、配列項目、`anyOf` / `oneOf` / `allOf` 合成ブランチも含まれます。
    - `config.schema.lookup` は、1 つの設定パスについて、パス範囲のルックアップペイロードを返します。正規化されたパス、浅いスキーマノード、一致したヒント + `hintPath`、UI/CLI ドリルダウン用の直下の子要約を含みます。ルックアップスキーマノードは、ユーザー向けドキュメントと一般的な検証フィールド（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、数値/文字列/配列/オブジェクト境界、`additionalProperties`、`deprecated`、`readOnly`、`writeOnly` などのフラグ）を保持します。子要約は、`key`、正規化された `path`、`type`、`required`、`hasChildren` に加え、一致した `hint` / `hintPath` を公開します。
    - `update.run` は Gateway 更新フローを実行し、更新自体が成功した場合にのみ再起動をスケジュールします。セッションを持つ呼び出し元は `continuationMessage` を含めることができ、起動時に再起動継続キューを通じて 1 回のフォローアップエージェントターンが再開されます。パッケージマネージャーによる更新では、パッケージ差し替え後に遅延なし、クールダウンなしの更新再起動が強制されるため、古い Gateway プロセスが置き換え済みの `dist` ツリーから遅延読み込みを続けることはありません。
    - `update.status` は、利用可能な場合は再起動後の実行中バージョンを含め、最新のキャッシュ済み更新再起動センチネルを返します。
    - `wizard.start`、`wizard.next`、`wizard.status`、`wizard.cancel` は、WS RPC 経由でオンボーディングウィザードを公開します。

  </Accordion>

  <Accordion title="エージェントとワークスペースのヘルパー">
    - `agents.list` は、有効なモデルとランタイムメタデータを含む、設定済みエージェントエントリを返します。
    - `agents.create`、`agents.update`、`agents.delete` は、エージェントレコードとワークスペース配線を管理します。
    - `agents.files.list`、`agents.files.get`、`agents.files.set` は、エージェント向けに公開されるブートストラップワークスペースファイルを管理します。
    - `artifacts.list`、`artifacts.get`、`artifacts.download` は、明示的な `sessionKey`、`runId`、または `taskId` 範囲について、トランスクリプト由来のアーティファクト概要とダウンロードを公開します。実行およびタスクのクエリは、所有セッションをサーバー側で解決し、一致する来歴を持つトランスクリプトメディアのみを返します。安全でない URL ソースまたはローカル URL ソースは、サーバー側で取得する代わりに、サポートされていないダウンロードを返します。
    - `environments.list` と `environments.status` は、SDK クライアント向けに読み取り専用の Gateway ローカル環境およびノード環境検出を公開します。
    - `agent.identity.get` は、エージェントまたはセッションの有効なアシスタント ID を返します。
    - `agent.wait` は、実行の完了を待ち、利用可能な場合は終端スナップショットを返します。

  </Accordion>

  <Accordion title="セッション制御">
    - `sessions.list` は、エージェントランタイムバックエンドが設定されている場合は各行の `agentRuntime` メタデータを含め、現在のセッションインデックスを返します。
    - `sessions.subscribe` と `sessions.unsubscribe` は、現在の WS クライアントに対するセッション変更イベント購読を切り替えます。
    - `sessions.messages.subscribe` と `sessions.messages.unsubscribe` は、1 つのセッションに対するトランスクリプト/メッセージイベント購読を切り替えます。
    - `sessions.preview` は、特定のセッションキーに対して範囲制限されたトランスクリプトプレビューを返します。
    - `sessions.describe` は、正確なセッションキーに対して 1 つの Gateway セッション行を返します。
    - `sessions.resolve` は、セッションターゲットを解決または正規化します。
    - `sessions.create` は、新しいセッションエントリを作成します。
    - `sessions.send` は、既存のセッションにメッセージを送信します。
    - `sessions.steer` は、アクティブなセッション向けの中断して方向付けるバリアントです。
    - `sessions.abort` は、セッションのアクティブな作業を中止します。呼び出し元は `key` と任意の `runId` を渡すか、Gateway がセッションへ解決できるアクティブ実行については `runId` だけを渡すことができます。
    - `sessions.patch` は、セッションメタデータ/オーバーライドを更新し、解決済みの正規モデルと有効な `agentRuntime` を報告します。
    - `sessions.reset`、`sessions.delete`、`sessions.compact` は、セッションメンテナンスを実行します。
    - `sessions.get` は、保存済みの完全なセッション行を返します。
    - チャット実行では引き続き `chat.history`、`chat.send`、`chat.abort`、`chat.inject` を使用します。`chat.history` は UI クライアント向けに表示用に正規化されます。インラインディレクティブタグは表示テキストから除去され、平文のツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）と漏出した ASCII/全角モデル制御トークンは除去され、正確な `NO_REPLY` / `no_reply` のような純粋なサイレントトークンのアシスタント行は省略され、過大な行はプレースホルダーに置き換えられることがあります。

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
    - `node.event` は、ノード発のイベントを Gateway に戻します。
    - `node.canvas.capability.refresh` は、範囲指定されたキャンバス機能トークンを更新します。
    - `node.pending.pull` と `node.pending.ack` は、接続済みノードキュー API です。
    - `node.pending.enqueue` と `node.pending.drain` は、オフライン/切断済みノード向けの永続的な保留作業を管理します。

  </Accordion>

  <Accordion title="承認ファミリー">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list`、`exec.approval.resolve` は、単発の exec 承認リクエストと、保留中の承認の検索/再実行を扱います。
    - `exec.approval.waitDecision` は、保留中の exec 承認を 1 件待機し、最終決定を返します（タイムアウト時は `null`）。
    - `exec.approvals.get` と `exec.approvals.set` は、gateway exec 承認ポリシーのスナップショットを管理します。
    - `exec.approvals.node.get` と `exec.approvals.node.set` は、node relay コマンドを介してノードローカルの exec 承認ポリシーを管理します。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision`、`plugin.approval.resolve` は、plugin 定義の承認フローを扱います。

  </Accordion>

  <Accordion title="自動化、Skills、ツール">
    - 自動化: `wake` は即時または次回 Heartbeat での wake テキスト注入をスケジュールします。`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` はスケジュールされた作業を管理します。
    - Skills とツール: `commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。

  </Accordion>
</AccordionGroup>

### 一般的なイベントファミリー

- `chat`: `chat.inject` などの UI チャット更新と、その他のトランスクリプト専用チャット
  イベント。
- `session.message` と `session.tool`: サブスクライブ中のセッションに対する
  トランスクリプト/イベントストリーム更新。
- `sessions.changed`: セッションインデックスまたはメタデータが変更されました。
- `presence`: システムプレゼンスのスナップショット更新。
- `tick`: 定期的な keepalive / liveness イベント。
- `health`: Gateway ヘルススナップショットの更新。
- `heartbeat`: Heartbeat イベントストリーム更新。
- `cron`: Cron 実行/ジョブ変更イベント。
- `shutdown`: Gateway シャットダウン通知。
- `node.pair.requested` / `node.pair.resolved`: ノードペアリングのライフサイクル。
- `node.invoke.request`: ノード呼び出しリクエストのブロードキャスト。
- `device.pair.requested` / `device.pair.resolved`: ペアリング済みデバイスのライフサイクル。
- `voicewake.changed`: wake-word トリガー設定が変更されました。
- `exec.approval.requested` / `exec.approval.resolved`: exec 承認
  ライフサイクル。
- `plugin.approval.requested` / `plugin.approval.resolved`: plugin 承認
  ライフサイクル。

### Node ヘルパーメソッド

- ノードは `skills.bins` を呼び出して、自動許可チェック用の現在の skill 実行可能ファイル一覧を
  取得できます。

### オペレーターヘルパーメソッド

- オペレーターは `commands.list`（`operator.read`）を呼び出して、agent のランタイム
  コマンドインベントリを取得できます。
  - `agentId` は任意です。省略すると、デフォルトの agent ワークスペースを読み取ります。
  - `scope` は、プライマリ `name` が対象にするサーフェスを制御します:
    - `text` は、先頭の `/` を含まないプライマリテキストコマンドトークンを返します
    - `native` とデフォルトの `both` パスは、利用可能な場合にプロバイダー対応のネイティブ名を返します
  - `textAliases` は、`/model` や `/m` などの正確なスラッシュエイリアスを保持します。
  - `nativeName` は、存在する場合にプロバイダー対応のネイティブコマンド名を保持します。
  - `provider` は任意で、ネイティブ名とネイティブ plugin
    コマンドの可用性にのみ影響します。
  - `includeArgs=false` は、シリアライズされた引数メタデータをレスポンスから省略します。
- オペレーターは `tools.catalog`（`operator.read`）を呼び出して、agent のランタイムツールカタログを
  取得できます。レスポンスには、グループ化されたツールと来歴メタデータが含まれます:
  - `source`: `core` または `plugin`
  - `pluginId`: `source="plugin"` の場合の plugin オーナー
  - `optional`: plugin ツールが任意かどうか
- オペレーターは `tools.effective`（`operator.read`）を呼び出して、セッションのランタイムで有効なツール
  インベントリを取得できます。
  - `sessionKey` は必須です。
  - Gateway は、呼び出し元が指定した認証または配信コンテキストを受け入れる代わりに、信頼されたランタイムコンテキストをサーバー側でセッションから導出します。
  - レスポンスはセッションスコープであり、core、plugin、channel ツールを含め、アクティブな会話が現在使用できるものを反映します。
- オペレーターは `tools.invoke`（`operator.write`）を呼び出して、`/tools/invoke` と同じ
  Gateway ポリシーパスを通じて、利用可能なツールを 1 つ呼び出せます。
  - `name` は必須です。`args`、`sessionKey`、`agentId`、`confirm`、`idempotencyKey` は任意です。
  - `sessionKey` と `agentId` の両方が存在する場合、解決されたセッション agent は
    `agentId` と一致する必要があります。
  - レスポンスは SDK 向けのエンベロープで、`ok`、`toolName`、任意の `output`、型付きの
    `error` フィールドを持ちます。承認またはポリシーによる拒否は、Gateway ツールポリシーパイプラインを
    迂回するのではなく、ペイロード内で `ok:false` を返します。
- オペレーターは `skills.status`（`operator.read`）を呼び出して、agent の表示可能な
  skill インベントリを取得できます。
  - `agentId` は任意です。省略すると、デフォルトの agent ワークスペースを読み取ります。
  - レスポンスには、適格性、不足している要件、設定チェック、生のシークレット値を公開しない
    サニタイズ済みインストールオプションが含まれます。
- オペレーターは ClawHub ディスカバリメタデータのために `skills.search` と `skills.detail`（`operator.read`）を呼び出せます。
- オペレーターは `skills.install`（`operator.admin`）を 2 つのモードで呼び出せます:
  - ClawHub モード: `{ source: "clawhub", slug, version?, force? }` は、skill フォルダーをデフォルト agent ワークスペースの `skills/` ディレクトリにインストールします。
  - Gateway インストーラーモード: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` は、
    宣言された `metadata.openclaw.install` アクションを Gateway ホストで実行します。
- オペレーターは `skills.update`（`operator.admin`）を 2 つのモードで呼び出せます:
  - ClawHub モードは、追跡中の slug 1 件、またはデフォルト agent ワークスペース内の追跡中 ClawHub インストールすべてを更新します。
  - 設定モードは、`enabled`、`apiKey`、`env` などの `skills.entries.<skillKey>` 値にパッチを適用します。

### `models.list` ビュー

`models.list` は任意の `view` パラメーターを受け付けます:

- 省略または `"default"`: 現在のランタイム動作です。`agents.defaults.models` が設定されている場合、レスポンスは許可されたカタログになります。それ以外の場合、レスポンスは Gateway カタログ全体になります。
- `"configured"`: ピッカー向けのサイズの動作です。`agents.defaults.models` が設定されている場合は、引き続きそれが優先されます。それ以外の場合、レスポンスは明示的な `models.providers.*.models` エントリを使用し、設定済みモデル行が存在しない場合にのみカタログ全体へフォールバックします。
- `"all"`: Gateway カタログ全体で、`agents.defaults.models` を迂回します。通常のモデルピッカーではなく、診断とディスカバリ UI に使用してください。

## Exec 承認

- exec リクエストに承認が必要な場合、Gateway は `exec.approval.requested` をブロードキャストします。
- オペレータークライアントは `exec.approval.resolve` を呼び出して解決します（`operator.approvals` スコープが必要）。
- `host=node` の場合、`exec.approval.request` には `systemRunPlan`（正規の `argv`/`cwd`/`rawCommand`/セッションメタデータ）を含める必要があります。`systemRunPlan` がないリクエストは拒否されます。
- 承認後、転送された `node.invoke system.run` 呼び出しは、その正規の
  `systemRunPlan` を権威あるコマンド/cwd/セッションコンテキストとして再利用します。
- 呼び出し元が準備と最終的に承認された `system.run` 転送の間に `command`、`rawCommand`、`cwd`、`agentId`、または
  `sessionKey` を変更した場合、Gateway は変更されたペイロードを信頼せずに実行を拒否します。

## Agent 配信フォールバック

- `agent` リクエストには、アウトバウンド配信を要求するために `deliver=true` を含めることができます。
- `bestEffortDeliver=false` は厳格な動作を維持します。解決不能または内部専用の配信ターゲットは `INVALID_REQUEST` を返します。
- `bestEffortDeliver=true` は、外部に配信可能なルートを解決できない場合（たとえば internal/webchat セッションや曖昧なマルチチャネル設定）に、セッション専用実行へのフォールバックを許可します。

## バージョニング

- `PROTOCOL_VERSION` は `src/gateway/protocol/schema/protocol-schemas.ts` にあります。
- クライアントは `minProtocol` + `maxProtocol` を送信し、サーバーは不一致を拒否します。
- スキーマ + モデルは TypeBox 定義から生成されます:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### クライアント定数

`src/gateway/client.ts` の参照クライアントは、これらのデフォルトを使用します。値は
protocol v3 全体で安定しており、サードパーティクライアントに期待されるベースラインです。

| 定数                                      | デフォルト                                            | ソース                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| リクエストタイムアウト（RPC ごと）        | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| 事前認証 / connect-challenge タイムアウト | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts`（config/env でペアリング済み server/client の予算を増やせます） |
| 初回再接続バックオフ                      | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| 最大再接続バックオフ                      | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| device-token close 後の fast-retry clamp  | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` 前の強制停止猶予            | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` デフォルトタイムアウト    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| デフォルト tick 間隔（`hello-ok` 前）      | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Tick タイムアウト close                   | 無音が `tickIntervalMs * 2` を超えた場合の code `4000` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

サーバーは有効な `policy.tickIntervalMs`、`policy.maxPayload`、
`policy.maxBufferedBytes` を `hello-ok` で広告します。クライアントはハンドシェイク前のデフォルトではなく、
それらの値に従う必要があります。

## 認証

- 共有シークレットの Gateway 認証は、設定された認証モードに応じて `connect.params.auth.token` または
  `connect.params.auth.password` を使用します。
- Tailscale Serve（`gateway.auth.allowTailscale: true`）や non-loopback
  `gateway.auth.mode: "trusted-proxy"` などの ID を持つモードは、
  `connect.params.auth.*` ではなくリクエストヘッダーから connect 認証チェックを満たします。
- プライベート ingress の `gateway.auth.mode: "none"` は、共有シークレットの connect 認証を
  完全にスキップします。このモードを公開または信頼されていない ingress に公開しないでください。
- ペアリング後、Gateway は接続ロール + スコープに限定された **デバイストークン** を発行します。
  これは `hello-ok.auth.deviceToken` で返され、今後の接続のためにクライアントで永続化する必要があります。
- クライアントは、成功した connect の後に primary `hello-ok.auth.deviceToken` を永続化する必要があります。
- その **保存済み** デバイストークンで再接続する場合は、そのトークンに対応する保存済みの
  承認済みスコープセットも再利用する必要があります。これにより、すでに許可された読み取り/プローブ/ステータスアクセスが保持され、
  再接続がより狭い暗黙の admin 専用スコープに静かに縮小されるのを避けられます。
- クライアント側の connect 認証組み立て（`src/gateway/client.ts` の `selectConnectAuth`）:
  - `auth.password` は直交しており、設定されている場合は常に転送されます。
  - `auth.token` は優先順位に従って設定されます。明示的な共有トークンが最優先、
    次に明示的な `deviceToken`、次に保存済みのデバイス単位トークン（`deviceId` + `role` をキーにする）です。
  - `auth.bootstrapToken` は、上記のいずれでも `auth.token` が解決されなかった場合にのみ送信されます。
    共有トークンまたは解決済みのデバイストークンがある場合は抑止されます。
  - 1 回限りの `AUTH_TOKEN_MISMATCH` 再試行での保存済みデバイストークンの自動昇格は、
    **信頼済みエンドポイントのみ** に制限されます。loopback、またはピン留めされた `tlsFingerprint` を持つ `wss://` です。
    ピン留めのない公開 `wss://` は対象になりません。
- 追加の `hello-ok.auth.deviceTokens` エントリは bootstrap ハンドオフトークンです。
  connect が `wss://` や loopback/local ペアリングなどの信頼済みトランスポート上で bootstrap 認証を使用した場合にのみ永続化してください。
- クライアントが **明示的な** `deviceToken` または明示的な `scopes` を指定した場合、
  その呼び出し元が要求したスコープセットが引き続き権威を持ちます。キャッシュ済みスコープは、
  クライアントが保存済みのデバイス単位トークンを再利用している場合にのみ再利用されます。
- デバイストークンは `device.token.rotate` と
  `device.token.revoke`（`operator.pairing` スコープが必要）でローテーション/取り消しできます。
- `device.token.rotate` はローテーションメタデータを返します。置換用 bearer トークンは、
  そのデバイストークンですでに認証されている同一デバイスからの呼び出しにのみ echo されるため、
  トークンのみのクライアントは再接続前に置換トークンを永続化できます。共有/admin のローテーションでは bearer トークンは echo されません。
- トークンの発行、ローテーション、取り消しは、そのデバイスのペアリングエントリに記録された
  承認済みロールセットの範囲内に留まります。トークン変更によって、ペアリング承認で許可されていないデバイスロールを
  拡張したり対象にしたりすることはできません。
- ペアリング済みデバイストークンセッションでは、呼び出し元が `operator.admin` も持っていない限り、
  デバイス管理は自己スコープになります。非 admin の呼び出し元が削除/取り消し/ローテーションできるのは、
  **自分自身の** デバイスエントリのみです。
- `device.token.rotate` と `device.token.revoke` は、対象 operator
  トークンのスコープセットも呼び出し元の現在のセッションスコープと照合します。非 admin の呼び出し元は、
  自分がすでに保持しているものより広い operator トークンをローテーションまたは取り消しできません。
- 認証失敗には `error.details.code` と復旧ヒントが含まれます:
  - `error.details.canRetryWithDeviceToken`（boolean）
  - `error.details.recommendedNextStep`（`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`）
- `AUTH_TOKEN_MISMATCH` に対するクライアントの動作:
  - 信頼済みクライアントは、キャッシュ済みのデバイス単位トークンで 1 回だけ制限付き再試行を試みることができます。
  - その再試行が失敗した場合、クライアントは自動再接続ループを停止し、operator の対応ガイダンスを表示する必要があります。

## デバイス ID + ペアリング

- Node は、キーペアフィンガープリントから派生した安定したデバイス ID（`device.id`）を含める必要があります。
- Gateway はデバイス + ロールごとにトークンを発行します。
- local 自動承認が有効でない限り、新しいデバイス ID にはペアリング承認が必要です。
- ペアリングの自動承認は、直接 local loopback connect を中心にしています。
- OpenClaw には、信頼済みの共有シークレット helper フロー向けに、狭い backend/container-local self-connect パスもあります。
- 同一ホストの tailnet または LAN connect も、ペアリングでは remote として扱われ、承認が必要です。
- WS クライアントは通常、`connect` 中に `device` ID を含めます（operator +
  node）。デバイスなしの operator 例外は、明示的な信頼パスのみです:
  - localhost 限定の insecure HTTP 互換性のための `gateway.controlUi.allowInsecureAuth=true`。
  - 成功した `gateway.auth.mode: "trusted-proxy"` operator Control UI 認証。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（break-glass、重大なセキュリティ低下）。
  - 共有 gateway token/password で認証された direct-loopback `gateway-client` backend RPC。
- すべての接続は、サーバーが提供する `connect.challenge` nonce に署名する必要があります。

### デバイス認証移行診断

pre-challenge 署名動作をまだ使用しているレガシークライアントの場合、`connect` は現在、
安定した `error.details.reason` とともに `error.details.code` の下で `DEVICE_AUTH_*` 詳細コードを返します。

一般的な移行失敗:

| メッセージ                  | details.code                     | details.reason           | 意味                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | クライアントが `device.nonce` を省略した（または空を送信した）。 |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | クライアントが古い/誤った nonce で署名した。       |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 署名 payload が v2 payload と一致しない。          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 署名されたタイムスタンプが許容 skew の範囲外。     |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` が公開鍵フィンガープリントと一致しない。 |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開鍵の形式/正規化に失敗した。                   |

移行ターゲット:

- 必ず `connect.challenge` を待ちます。
- サーバー nonce を含む v2 payload に署名します。
- 同じ nonce を `connect.params.device.nonce` で送信します。
- 推奨される署名 payload は `v3` で、device/client/role/scopes/token/nonce フィールドに加えて
  `platform` と `deviceFamily` をバインドします。
- レガシー `v2` 署名は互換性のために引き続き受け入れられますが、再接続時のコマンドポリシーは
  paired-device メタデータのピン留めによって引き続き制御されます。

## TLS + ピン留め

- TLS は WS 接続でサポートされています。
- クライアントは任意で gateway 証明書フィンガープリントをピン留めできます（`gateway.tls`
  設定と `gateway.remote.tlsFingerprint`、または CLI `--tls-fingerprint` を参照）。

## スコープ

このプロトコルは **完全な gateway API**（status、channels、models、chat、
agent、sessions、nodes、approvals など）を公開します。正確な surface は
`src/gateway/protocol/schema.ts` の TypeBox スキーマで定義されています。

## 関連

- [Bridge protocol](/ja-JP/gateway/bridge-protocol)
- [Gateway runbook](/ja-JP/gateway)
