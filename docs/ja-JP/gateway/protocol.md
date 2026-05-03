---
read_when:
    - Gateway WS クライアントの実装または更新
    - プロトコル不一致または接続失敗のデバッグ
    - プロトコルスキーマ/モデルの再生成
summary: 'Gateway WebSocket プロトコル: ハンドシェイク、フレーム、バージョニング'
title: Gateway プロトコル
x-i18n:
    generated_at: "2026-05-03T21:33:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 238706fcecd8ca96394402714cde5b01fb296de8e7b5a5867b1b3cf5b7940689
    source_path: gateway/protocol.md
    workflow: 16
---

The Gateway WS プロトコルは、OpenClaw の**単一のコントロールプレーン + ノードトランスポート**です。すべてのクライアント（CLI、Web UI、macOS アプリ、iOS/Android ノード、ヘッドレスノード）は WebSocket 経由で接続し、ハンドシェイク時に自身の**ロール** + **スコープ**を宣言します。

## トランスポート

- WebSocket、JSON ペイロードを持つテキストフレーム。
- 最初のフレームは**必ず** `connect` リクエストでなければなりません。
- 接続前フレームは 64 KiB に制限されます。ハンドシェイク成功後、クライアントは `hello-ok.policy.maxPayload` と `hello-ok.policy.maxBufferedBytes` の制限に従う必要があります。診断が有効な場合、Gateway が影響を受けたフレームを閉じる、または破棄する前に、過大な受信フレームと遅い送信バッファーは `payload.large` イベントを発行します。これらのイベントはサイズ、制限、サーフェス、安全な理由コードを保持します。メッセージ本文、添付内容、生フレーム本文、トークン、Cookie、秘密値は保持しません。

## ハンドシェイク (connect)

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

Gateway が起動時のサイドカー完了処理をまだ行っている間、`connect` リクエストは `details.reason` が `"startup-sidecars"` に設定され、`retryAfterMs` を含む、再試行可能な `UNAVAILABLE` エラーを返すことがあります。クライアントはこのレスポンスを最終的なハンドシェイク失敗として表示するのではなく、全体の接続予算内で再試行する必要があります。

`server`、`features`、`snapshot`、`policy` はすべてスキーマ（`src/gateway/protocol/schema/frames.ts`）で必須です。`auth` も必須で、ネゴシエートされたロール/スコープを報告します。`canvasHostUrl` は任意です。

デバイストークンが発行されない場合、`hello-ok.auth` はトークンフィールドなしで、ネゴシエートされた権限を報告します。

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

信頼された同一プロセスのバックエンドクライアント（`client.id: "gateway-client"`、`client.mode: "backend"`）は、共有 Gateway トークン/パスワードで認証する場合、直接のループバック接続で `device` を省略できます。この経路は内部コントロールプレーン RPC 用に予約されており、古い CLI/デバイスペアリングのベースラインが、サブエージェントセッション更新などのローカルバックエンド作業をブロックしないようにします。リモートクライアント、ブラウザーオリジンのクライアント、ノードクライアント、明示的なデバイストークン/デバイス ID クライアントは、引き続き通常のペアリングとスコープ昇格チェックを使用します。

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

信頼されたブートストラップ引き渡し中、`hello-ok.auth` には `deviceTokens` に追加の境界付きロールエントリが含まれることもあります。

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

組み込みのノード/オペレーターブートストラップフローでは、プライマリノードトークンは `scopes: []` のままで、引き渡されたオペレータートークンはブートストラップオペレーター許可リスト（`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`）に制限されます。ブートストラップスコープチェックはロール接頭辞付きのままです。オペレーターエントリはオペレーターリクエストのみを満たし、非オペレーターロールには引き続き自身のロール接頭辞配下のスコープが必要です。

### ノード例

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

Plugin 登録 Gateway RPC メソッドは独自のオペレータースコープを要求できますが、予約済みのコア管理接頭辞（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は常に `operator.admin` に解決されます。

メソッドスコープは最初のゲートにすぎません。`chat.send` を通じて到達する一部のスラッシュコマンドでは、その上により厳格なコマンドレベルチェックが適用されます。たとえば、永続的な `/config set` と `/config unset` の書き込みには `operator.admin` が必要です。

`node.pair.approve` には、基本メソッドスコープに加えて、承認時の追加スコープチェックもあります。

- コマンドなしリクエスト: `operator.pairing`
- 非 exec ノードコマンドを持つリクエスト: `operator.pairing` + `operator.write`
- `system.run`、`system.run.prepare`、または `system.which` を含むリクエスト: `operator.pairing` + `operator.admin`

### Caps/commands/permissions（ノード）

ノードは接続時に機能クレームを宣言します。

- `caps`: 高レベルの機能カテゴリ。
- `commands`: invoke 用のコマンド許可リスト。
- `permissions`: 粒度の細かい切り替え（例: `screen.record`、`camera.capture`）。

Gateway はこれらを**クレーム**として扱い、サーバー側の許可リストを適用します。

## プレゼンス

- `system-presence` はデバイス ID をキーにしたエントリを返します。
- プレゼンスエントリには `deviceId`、`roles`、`scopes` が含まれるため、UI はデバイスが**オペレーター**と**ノード**の両方として接続している場合でも、デバイスごとに 1 行で表示できます。
- `node.list` には任意の `lastSeenAtMs` と `lastSeenReason` フィールドが含まれます。接続中のノードは現在の接続時刻を `lastSeenAtMs` として報告し、理由は `connect` になります。ペアリング済みノードは、信頼されたノードイベントがペアリングメタデータを更新した場合に、永続的なバックグラウンドプレゼンスも報告できます。

### ノードバックグラウンド生存イベント

ノードは `event: "node.presence.alive"` を指定して `node.event` を呼び出し、ペアリング済みノードがバックグラウンドウェイク中に生存していたことを、接続済みとしてマークせずに記録できます。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` は閉じた enum です: `background`、`silent_push`、`bg_app_refresh`、`significant_location`、`manual`、または `connect`。不明なトリガー文字列は、永続化前に Gateway によって `background` に正規化されます。このイベントは、認証済みノードデバイスセッションでのみ永続化されます。デバイスなしまたは未ペアリングのセッションは `handled: false` を返します。

成功した Gateway は構造化された結果を返します。

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

古い Gateway は `node.event` に対して引き続き `{ "ok": true }` を返す場合があります。クライアントはこれを永続的なプレゼンス永続化ではなく、確認済み RPC として扱う必要があります。

## ブロードキャストイベントのスコープ設定

サーバーからプッシュされる WebSocket ブロードキャストイベントはスコープで制御されるため、ペアリングスコープのみ、またはノードのみのセッションがセッション内容を受動的に受け取ることはありません。

- **チャット、エージェント、ツール結果フレーム**（ストリーミングされた `agent` イベントとツール呼び出し結果を含む）には少なくとも `operator.read` が必要です。`operator.read` を持たないセッションは、これらのフレームを完全にスキップします。
- **Plugin 定義の `plugin.*` ブロードキャスト**は、Plugin が登録した方法に応じて `operator.write` または `operator.admin` によってゲートされます。
- **ステータスとトランスポートイベント**（`heartbeat`、`presence`、`tick`、接続/切断ライフサイクルなど）は、すべての認証済みセッションがトランスポート状態を観測できるよう、制限されないままです。
- **不明なブロードキャストイベントファミリー**は、登録済みハンドラーが明示的に緩和しない限り、デフォルトでスコープゲートされます（フェイルクローズ）。

各クライアント接続はクライアントごとの独自のシーケンス番号を保持するため、異なるクライアントがイベントストリームの異なるスコープフィルター済みサブセットを見る場合でも、そのソケット上でブロードキャストの単調な順序が保たれます。

## 一般的な RPC メソッドファミリー

公開 WS サーフェスは、上記のハンドシェイク/認証例よりも広範です。これは生成されたダンプではありません。`hello-ok.features.methods` は、`src/gateway/server-methods-list.ts` と、読み込まれた Plugin/チャンネルメソッドのエクスポートから構築される保守的な検出リストです。これは機能検出として扱い、`src/gateway/server-methods/*.ts` の完全な列挙とは見なさないでください。

<AccordionGroup>
  <Accordion title="システムと ID">
    - `health` はキャッシュ済みまたは新しくプローブした Gateway ヘルススナップショットを返します。
    - `diagnostics.stability` は最近の境界付き診断安定性レコーダーを返します。イベント名、件数、バイトサイズ、メモリ読み取り値、キュー/セッション状態、チャンネル/Plugin 名、セッション ID などの運用メタデータを保持します。チャットテキスト、Webhook 本文、ツール出力、生のリクエストまたはレスポンス本文、トークン、Cookie、秘密値は保持しません。オペレーター読み取りスコープが必要です。
    - `status` は `/status` スタイルの Gateway サマリーを返します。機密フィールドは管理者スコープのオペレータークライアントにのみ含まれます。
    - `gateway.identity.get` はリレーとペアリングフローで使用される Gateway デバイス ID を返します。
    - `system-presence` は接続中のオペレーター/ノードデバイスの現在のプレゼンススナップショットを返します。
    - `system-event` はシステムイベントを追加し、プレゼンスコンテキストを更新/ブロードキャストできます。
    - `last-heartbeat` は永続化された最新の Heartbeat イベントを返します。
    - `set-heartbeats` は Gateway 上の Heartbeat 処理を切り替えます。

  </Accordion>

  <Accordion title="モデルと使用状況">
    - `models.list` は、ランタイムで許可されたモデルカタログを返します。ピッカーサイズの設定済みモデル（`agents.defaults.models` が先、次に `models.providers.*.models`）には `{ "view": "configured" }` を渡し、完全なカタログには `{ "view": "all" }` を渡します。
    - `usage.status` は、プロバイダーの使用状況ウィンドウと残りクォータの要約を返します。
    - `usage.cost` は、日付範囲に対する集計済みコスト使用状況の要約を返します。
    - `doctor.memory.status` は、アクティブなデフォルトエージェントワークスペースのベクトルメモリ / キャッシュ済み埋め込みの準備状態を返します。呼び出し元がライブ埋め込みプロバイダーの ping を明示的に求める場合にのみ、`{ "probe": true }` または `{ "deep": true }` を渡します。
    - `doctor.memory.remHarness` は、リモート制御プレーンクライアント向けに、境界付きの読み取り専用 REM ハーネスプレビューを返します。ワークスペースパス、メモリスニペット、レンダリング済みの根拠付き Markdown、深い昇格候補を含む場合があるため、呼び出し元には `operator.read` が必要です。
    - `sessions.usage` は、セッションごとの使用状況要約を返します。
    - `sessions.usage.timeseries` は、1 つのセッションの時系列使用状況を返します。
    - `sessions.usage.logs` は、1 つのセッションの使用状況ログエントリを返します。

  </Accordion>

  <Accordion title="チャネルとログインヘルパー">
    - `channels.status` は、組み込み + バンドル済みチャネル / Plugin のステータス要約を返します。
    - `channels.logout` は、チャネルがログアウトをサポートしている場合に、特定のチャネル / アカウントをログアウトします。
    - `web.login.start` は、現在の QR 対応 Web チャネルプロバイダーの QR / Web ログインフローを開始します。
    - `web.login.wait` は、その QR / Web ログインフローの完了を待機し、成功時にチャネルを開始します。
    - `push.test` は、登録済みの iOS ノードにテスト APNs プッシュを送信します。
    - `voicewake.get` は、保存済みのウェイクワードトリガーを返します。
    - `voicewake.set` は、ウェイクワードトリガーを更新し、変更をブロードキャストします。

  </Accordion>

  <Accordion title="メッセージングとログ">
    - `send` は、チャットランナー外でチャネル / アカウント / スレッドを対象に送信するための直接アウトバウンド配信 RPC です。
    - `logs.tail` は、カーソル / 制限と最大バイト数の制御付きで、設定済み Gateway ファイルログの末尾を返します。

  </Accordion>

  <Accordion title="Talk と TTS">
    - `talk.config` は、有効な Talk 設定ペイロードを返します。`includeSecrets` には `operator.talk.secrets`（または `operator.admin`）が必要です。
    - `talk.mode` は、WebChat / Control UI クライアント向けに、現在の Talk モード状態を設定 / ブロードキャストします。
    - `talk.speak` は、アクティブな Talk 音声プロバイダーを通じて音声を合成します。
    - `tts.status` は、TTS の有効状態、アクティブなプロバイダー、フォールバックプロバイダー、プロバイダー設定状態を返します。
    - `tts.providers` は、表示可能な TTS プロバイダーの一覧を返します。
    - `tts.enable` と `tts.disable` は、TTS 設定状態を切り替えます。
    - `tts.setProvider` は、優先 TTS プロバイダーを更新します。
    - `tts.convert` は、単発のテキスト読み上げ変換を実行します。

  </Accordion>

  <Accordion title="シークレット、設定、更新、ウィザード">
    - `secrets.reload` は、アクティブな SecretRefs を再解決し、完全に成功した場合にのみランタイムシークレット状態を差し替えます。
    - `secrets.resolve` は、特定のコマンド / ターゲットセットのコマンド対象シークレット割り当てを解決します。
    - `config.get` は、現在の設定スナップショットとハッシュを返します。
    - `config.set` は、検証済みの設定ペイロードを書き込みます。
    - `config.patch` は、部分的な設定更新をマージします。
    - `config.apply` は、完全な設定ペイロードを検証して置き換えます。
    - `config.schema` は、Control UI と CLI ツールで使用されるライブ設定スキーマペイロードを返します。スキーマ、`uiHints`、バージョン、生成メタデータに加え、ランタイムが読み込める場合は Plugin + チャネルのスキーマメタデータも含みます。このスキーマには、UI で使用されるものと同じラベルおよびヘルプテキストから派生したフィールド `title` / `description` メタデータが含まれ、対応するフィールドドキュメントが存在する場合は、ネストされたオブジェクト、ワイルドカード、配列項目、`anyOf` / `oneOf` / `allOf` の合成ブランチも含まれます。
    - `config.schema.lookup` は、1 つの設定パスに対するパススコープのルックアップペイロードを返します。正規化済みパス、浅いスキーマノード、一致したヒント + `hintPath`、UI / CLI のドリルダウン用の直下の子要約が含まれます。ルックアップスキーマノードは、ユーザー向けドキュメントと共通の検証フィールド（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、数値 / 文字列 / 配列 / オブジェクトの境界、`additionalProperties`、`deprecated`、`readOnly`、`writeOnly` などのフラグ）を保持します。子要約は、`key`、正規化済み `path`、`type`、`required`、`hasChildren`、および一致した `hint` / `hintPath` を公開します。
    - `update.run` は Gateway 更新フローを実行し、更新自体が成功した場合にのみ再起動をスケジュールします。セッションを持つ呼び出し元は `continuationMessage` を含めることができ、起動時に再起動継続キューを通じて後続のエージェントターンが 1 回再開されます。パッケージマネージャーによる更新では、パッケージ差し替え後に遅延なし・クールダウンなしの更新再起動を強制し、古い Gateway プロセスが置き換えられた `dist` ツリーから遅延読み込みを続けないようにします。
    - `update.status` は、利用可能な場合は再起動後に実行中のバージョンを含む、最新のキャッシュ済み更新再起動センチネルを返します。
    - `wizard.start`、`wizard.next`、`wizard.status`、`wizard.cancel` は、オンボーディングウィザードを WS RPC 経由で公開します。

  </Accordion>

  <Accordion title="エージェントとワークスペースヘルパー">
    - `agents.list` は、設定済みのエージェントエントリを返します。有効なモデルとランタイムメタデータも含まれます。
    - `agents.create`、`agents.update`、`agents.delete` は、エージェントレコードとワークスペースの配線を管理します。
    - `agents.files.list`、`agents.files.get`、`agents.files.set` は、エージェント向けに公開されるブートストラップワークスペースファイルを管理します。
    - `artifacts.list`、`artifacts.get`、`artifacts.download` は、明示的な `sessionKey`、`runId`、または `taskId` スコープに対して、トランスクリプト由来の成果物要約とダウンロードを公開します。実行とタスクのクエリは、所有するセッションをサーバー側で解決し、一致する出所を持つトランスクリプトメディアのみを返します。安全でない URL またはローカル URL ソースは、サーバー側で取得せずに未対応のダウンロードを返します。
    - `agent.identity.get` は、エージェントまたはセッションの有効なアシスタント ID を返します。
    - `agent.wait` は、実行の完了を待機し、利用可能な場合は終了時のスナップショットを返します。

  </Accordion>

  <Accordion title="セッション制御">
    - `sessions.list` は、現在のセッションインデックスを返します。エージェントランタイムバックエンドが設定されている場合は、行ごとの `agentRuntime` メタデータも含まれます。
    - `sessions.subscribe` と `sessions.unsubscribe` は、現在の WS クライアントに対するセッション変更イベント購読を切り替えます。
    - `sessions.messages.subscribe` と `sessions.messages.unsubscribe` は、1 つのセッションに対するトランスクリプト / メッセージイベント購読を切り替えます。
    - `sessions.preview` は、特定のセッションキーに対する境界付きトランスクリプトプレビューを返します。
    - `sessions.describe` は、正確なセッションキーに対する 1 つの Gateway セッション行を返します。
    - `sessions.resolve` は、セッションターゲットを解決または正規化します。
    - `sessions.create` は、新しいセッションエントリを作成します。
    - `sessions.send` は、既存のセッションにメッセージを送信します。
    - `sessions.steer` は、アクティブなセッション向けの割り込みおよび誘導バリアントです。
    - `sessions.abort` は、セッションのアクティブな作業を中止します。呼び出し元は `key` と任意の `runId` を渡すことも、Gateway がセッションに解決できるアクティブな実行については `runId` のみを渡すこともできます。
    - `sessions.patch` は、セッションメタデータ / オーバーライドを更新し、解決済みの正規モデルと有効な `agentRuntime` を報告します。
    - `sessions.reset`、`sessions.delete`、`sessions.compact` は、セッションメンテナンスを実行します。
    - `sessions.get` は、保存済みの完全なセッション行を返します。
    - チャット実行では引き続き `chat.history`、`chat.send`、`chat.abort`、`chat.inject` を使用します。`chat.history` は UI クライアント向けに表示正規化されます。インラインディレクティブタグは表示テキストから除去され、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）と漏出した ASCII / 全角モデル制御トークンは除去され、正確な `NO_REPLY` / `no_reply` のような純粋なサイレントトークンのアシスタント行は省略され、サイズ超過の行はプレースホルダーに置き換えられる場合があります。

  </Accordion>

  <Accordion title="デバイスペアリングとデバイストークン">
    - `device.pair.list` は、保留中および承認済みのペアリング済みデバイスを返します。
    - `device.pair.approve`、`device.pair.reject`、`device.pair.remove` は、デバイスペアリングレコードを管理します。
    - `device.token.rotate` は、承認済みロールと呼び出し元のスコープ境界内で、ペアリング済みデバイストークンをローテーションします。
    - `device.token.revoke` は、承認済みロールと呼び出し元のスコープ境界内で、ペアリング済みデバイストークンを取り消します。

  </Accordion>

  <Accordion title="ノードペアリング、呼び出し、保留中の作業">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove`、`node.pair.verify` は、ノードペアリングとブートストラップ検証を扱います。
    - `node.list` と `node.describe` は、既知 / 接続済みノードの状態を返します。
    - `node.rename` は、ペアリング済みノードのラベルを更新します。
    - `node.invoke` は、接続済みノードにコマンドを転送します。
    - `node.invoke.result` は、呼び出しリクエストの結果を返します。
    - `node.event` は、ノード発のイベントを Gateway に戻します。
    - `node.canvas.capability.refresh` は、スコープ付きキャンバス機能トークンを更新します。
    - `node.pending.pull` と `node.pending.ack` は、接続済みノードキュー API です。
    - `node.pending.enqueue` と `node.pending.drain` は、オフライン / 切断済みノード向けの永続的な保留中作業を管理します。

  </Accordion>

  <Accordion title="承認ファミリー">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list`、`exec.approval.resolve` は、単発の exec 承認リクエストと、保留中の承認の検索 / 再生を扱います。
    - `exec.approval.waitDecision` は、1 つの保留中 exec 承認を待機し、最終決定（またはタイムアウト時は `null`）を返します。
    - `exec.approvals.get` と `exec.approvals.set` は、Gateway exec 承認ポリシースナップショットを管理します。
    - `exec.approvals.node.get` と `exec.approvals.node.set` は、ノードリレーコマンド経由でノードローカルの exec 承認ポリシーを管理します。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision`、`plugin.approval.resolve` は、Plugin 定義の承認フローを扱います。

  </Accordion>

  <Accordion title="自動化、Skills、ツール">
    - 自動化: `wake` は、即時または次の Heartbeat でのウェイクテキスト注入をスケジュールします。`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` は、スケジュール済み作業を管理します。
    - Skills とツール: `commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。

  </Accordion>
</AccordionGroup>

### 共通イベントファミリー

- `chat`: `chat.inject` などの UI チャット更新、およびその他のトランスクリプト専用チャット
  イベント。
- `session.message` と `session.tool`: 購読済みセッションのトランスクリプト / イベントストリーム
  更新。
- `sessions.changed`: セッションインデックスまたはメタデータが変更されました。
- `presence`: システムプレゼンススナップショット更新。
- `tick`: 定期的な keepalive / 生存確認イベント。
- `health`: Gateway ヘルススナップショット更新。
- `heartbeat`: Heartbeat イベントストリーム更新。
- `cron`: Cron 実行 / ジョブ変更イベント。
- `shutdown`: Gateway シャットダウン通知。
- `node.pair.requested` / `node.pair.resolved`: ノードペアリングライフサイクル。
- `node.invoke.request`: ノード呼び出しリクエストのブロードキャスト。
- `device.pair.requested` / `device.pair.resolved`: ペアリング済みデバイスのライフサイクル。
- `voicewake.changed`: ウェイクワードトリガー設定が変更されました。
- `exec.approval.requested` / `exec.approval.resolved`: exec 承認
  ライフサイクル。
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin 承認
  ライフサイクル。

### ノードヘルパーメソッド

- ノードは、自動許可チェック用に現在のスキル実行可能ファイル一覧を取得するために、`skills.bins` を呼び出すことができます。

### オペレーターヘルパーメソッド

- オペレーターは `commands.list`（`operator.read`）を呼び出して、エージェントのランタイム
  コマンド一覧を取得できます。
  - `agentId` は任意です。省略するとデフォルトのエージェントワークスペースを読み取ります。
  - `scope` は、主 `name` が対象にするサーフェスを制御します。
    - `text` は先頭の `/` なしで主テキストコマンドトークンを返します
    - `native` とデフォルトの `both` パスは、利用可能な場合にプロバイダー対応のネイティブ名を返します
  - `textAliases` は `/model` や `/m` などの完全一致スラッシュエイリアスを保持します。
  - `nativeName` は、存在する場合にプロバイダー対応のネイティブコマンド名を保持します。
  - `provider` は任意で、ネイティブ命名とネイティブ Plugin
    コマンドの可用性にのみ影響します。
  - `includeArgs=false` は、シリアライズされた引数メタデータをレスポンスから省略します。
- オペレーターは `tools.catalog`（`operator.read`）を呼び出して、エージェントのランタイムツールカタログを取得できます。レスポンスにはグループ化されたツールと来歴メタデータが含まれます。
  - `source`: `core` または `plugin`
  - `pluginId`: `source="plugin"` の場合の Plugin 所有者
  - `optional`: Plugin ツールが任意かどうか
- オペレーターは `tools.effective`（`operator.read`）を呼び出して、セッションでランタイム上有効なツール
  一覧を取得できます。
  - `sessionKey` は必須です。
  - Gateway は、呼び出し元が指定した認証や配信コンテキストを受け入れる代わりに、
    セッションから信頼済みランタイムコンテキストをサーバー側で導出します。
  - レスポンスはセッションスコープであり、コア、Plugin、チャネルツールを含め、
    アクティブな会話が現時点で使用できるものを反映します。
- オペレーターは `tools.invoke`（`operator.write`）を呼び出して、
  `/tools/invoke` と同じ Gateway ポリシーパスを通じて、利用可能なツールを1つ呼び出せます。
  - `name` は必須です。`args`、`sessionKey`、`agentId`、`confirm`、および
    `idempotencyKey` は任意です。
  - `sessionKey` と `agentId` の両方が存在する場合、解決されたセッションエージェントは
    `agentId` と一致する必要があります。
  - レスポンスは SDK 向けエンベロープで、`ok`、`toolName`、任意の `output`、および型付きの
    `error` フィールドを持ちます。承認またはポリシー拒否は、Gateway のツールポリシーパイプラインを
    迂回せず、ペイロード内で `ok:false` を返します。
- オペレーターは `skills.status`（`operator.read`）を呼び出して、エージェントに表示される
  Skill 一覧を取得できます。
  - `agentId` は任意です。省略するとデフォルトのエージェントワークスペースを読み取ります。
  - レスポンスには、適格性、不足している要件、設定チェック、および
    生のシークレット値を公開しないサニタイズ済みインストールオプションが含まれます。
- オペレーターは、ClawHub 検出メタデータ用に `skills.search` と `skills.detail`（`operator.read`）を呼び出せます。
- オペレーターは `skills.install`（`operator.admin`）を2つのモードで呼び出せます。
  - ClawHub モード: `{ source: "clawhub", slug, version?, force? }` は、
    Skill フォルダーをデフォルトのエージェントワークスペースの `skills/` ディレクトリにインストールします。
  - Gateway インストーラーモード: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` は、
    Gateway ホスト上で宣言済みの `metadata.openclaw.install` アクションを実行します。
- オペレーターは `skills.update`（`operator.admin`）を2つのモードで呼び出せます。
  - ClawHub モードは、追跡中の slug 1つ、またはデフォルトのエージェントワークスペース内にある追跡中の
    ClawHub インストールすべてを更新します。
  - 設定モードは、`enabled`、
    `apiKey`、`env` などの `skills.entries.<skillKey>` 値にパッチを適用します。

### `models.list` ビュー

`models.list` は任意の `view` パラメーターを受け付けます。

- 省略または `"default"`: 現在のランタイム動作。`agents.defaults.models` が設定されている場合、レスポンスは許可されたカタログになります。それ以外の場合、レスポンスは完全な Gateway カタログになります。
- `"configured"`: ピッカー向けサイズの動作。`agents.defaults.models` が設定されている場合は引き続きそれが優先されます。それ以外の場合、レスポンスは明示的な `models.providers.*.models` エントリを使用し、設定済みモデル行が存在しない場合のみ完全なカタログにフォールバックします。
- `"all"`: 完全な Gateway カタログで、`agents.defaults.models` を迂回します。通常のモデルピッカーではなく、診断と検出 UI に使用してください。

## 実行承認

- exec リクエストに承認が必要な場合、Gateway は `exec.approval.requested` をブロードキャストします。
- オペレータークライアントは `exec.approval.resolve` を呼び出して解決します（`operator.approvals` スコープが必要）。
- `host=node` の場合、`exec.approval.request` には `systemRunPlan`（正規の `argv`/`cwd`/`rawCommand`/セッションメタデータ）を含める必要があります。`systemRunPlan` がないリクエストは拒否されます。
- 承認後、転送された `node.invoke system.run` 呼び出しは、その正規の
  `systemRunPlan` を権威あるコマンド/cwd/セッションコンテキストとして再利用します。
- 呼び出し元が準備から最終承認済み `system.run` 転送までの間に、`command`、`rawCommand`、`cwd`、`agentId`、または
  `sessionKey` を変更した場合、Gateway は変更されたペイロードを信頼せず、
  実行を拒否します。

## エージェント配信フォールバック

- `agent` リクエストには、アウトバウンド配信を要求するために `deliver=true` を含められます。
- `bestEffortDeliver=false` は厳格な動作を維持します。解決不能または内部専用の配信先は `INVALID_REQUEST` を返します。
- `bestEffortDeliver=true` は、外部に配信可能なルートを解決できない場合（たとえば内部/webchat セッションや曖昧なマルチチャネル設定）、セッションのみの実行へのフォールバックを許可します。

## バージョニング

- `PROTOCOL_VERSION` は `src/gateway/protocol/schema/protocol-schemas.ts` にあります。
- クライアントは `minProtocol` + `maxProtocol` を送信します。サーバーは不一致を拒否します。
- スキーマとモデルは TypeBox 定義から生成されます。
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### クライアント定数

`src/gateway/client.ts` のリファレンスクライアントは、これらのデフォルトを使用します。値は
プロトコル v3 全体で安定しており、サードパーティクライアントの想定ベースラインです。

| 定数                                      | デフォルト                                            | ソース                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| リクエストタイムアウト（RPC ごと）        | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| 事前認証 / 接続チャレンジタイムアウト     | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts`（config/env でペアのサーバー/クライアント予算を増やせます） |
| 初期再接続バックオフ                      | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| 最大再接続バックオフ                      | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| device-token クローズ後の高速リトライ上限 | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` 前の強制停止猶予            | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` のデフォルトタイムアウト   | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| デフォルト tick 間隔（`hello-ok` 前）      | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| tick タイムアウトによるクローズ            | 無音が `tickIntervalMs * 2` を超えた場合は code `4000` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

サーバーは有効な `policy.tickIntervalMs`、`policy.maxPayload`、
および `policy.maxBufferedBytes` を `hello-ok` で通知します。クライアントは
ハンドシェイク前のデフォルトではなく、これらの値に従う必要があります。

## 認証

- 共有シークレット Gateway 認証では、設定された認証モードに応じて `connect.params.auth.token` または
  `connect.params.auth.password` を使用します。
- Tailscale Serve
  (`gateway.auth.allowTailscale: true`) や非ループバックの
  `gateway.auth.mode: "trusted-proxy"` など、ID を伴うモードでは、
  `connect.params.auth.*` ではなくリクエストヘッダーから connect 認証チェックを満たします。
- プライベート ingress の `gateway.auth.mode: "none"` は、共有シークレットの connect 認証を
  完全にスキップします。このモードを公開または信頼できない ingress に公開しないでください。
- ペアリング後、Gateway は接続ロール + スコープに限定された **デバイストークン** を発行します。
  これは `hello-ok.auth.deviceToken` で返され、今後の接続のためにクライアントで永続化する必要があります。
- クライアントは、接続に成功するたびに主要な `hello-ok.auth.deviceToken` を永続化する必要があります。
- その **保存済み** デバイストークンで再接続する場合は、そのトークン用に保存された
  承認済みスコープセットも再利用する必要があります。これにより、すでに許可された
  読み取り/プローブ/ステータスアクセスが保持され、再接続が暗黙の admin 専用スコープへ
  気付かないうちに狭められることを避けられます。
- クライアント側の connect 認証組み立て (`src/gateway/client.ts` の `selectConnectAuth`):
  - `auth.password` は直交しており、設定されている場合は常に転送されます。
  - `auth.token` は優先順位に従って設定されます。まず明示的な共有トークン、
    次に明示的な `deviceToken`、最後に保存済みのデバイス単位トークン (`deviceId` + `role` をキーにする) です。
  - `auth.bootstrapToken` は、上記のいずれでも `auth.token` が解決されなかった場合にのみ送信されます。
    共有トークンまたは解決済みのデバイストークンがある場合は送信されません。
  - 1 回限りの `AUTH_TOKEN_MISMATCH` リトライで保存済みデバイストークンを自動昇格する処理は、
    **信頼済みエンドポイントのみ** に制限されています。つまり、ループバック、または
    固定された `tlsFingerprint` を持つ `wss://` です。ピン留めのない公開 `wss://` は対象外です。
- 追加の `hello-ok.auth.deviceTokens` エントリは、ブートストラップ引き継ぎトークンです。
  `wss://` やループバック/local ペアリングなど、信頼済みトランスポート上でブートストラップ認証を使って
  connect した場合にのみ永続化してください。
- クライアントが **明示的な** `deviceToken` または明示的な `scopes` を指定した場合、
  その呼び出し元が要求したスコープセットが引き続き正となります。キャッシュ済みスコープは、
  クライアントが保存済みのデバイス単位トークンを再利用する場合にのみ再利用されます。
- デバイストークンは `device.token.rotate` と
  `device.token.revoke` でローテーション/失効できます (`operator.pairing` スコープが必要)。
- `device.token.rotate` はローテーションメタデータを返します。置き換え用 bearer トークンは、
  そのデバイストークンですでに認証されている同一デバイスからの呼び出しの場合にのみ返すため、
  トークンのみのクライアントは再接続前に置き換えトークンを永続化できます。共有/admin ローテーションでは
  bearer トークンは返されません。
- トークンの発行、ローテーション、失効は、そのデバイスのペアリングエントリに記録された
  承認済みロールセットの範囲に限定されます。トークン変更によって、ペアリング承認で許可されていない
  デバイスロールへ拡張したり、それを対象にしたりすることはできません。
- ペアリング済みデバイストークンセッションでは、呼び出し元が `operator.admin` も持っていない限り、
  デバイス管理は自己スコープに限定されます。非 admin 呼び出し元は **自分自身の** デバイスエントリのみを
  削除/失効/ローテーションできます。
- `device.token.rotate` と `device.token.revoke` は、対象 operator
  トークンのスコープセットも呼び出し元の現在のセッションスコープと照合します。非 admin 呼び出し元は、
  自分がすでに保持しているものより広い operator トークンをローテーションまたは失効できません。
- 認証失敗には `error.details.code` と復旧ヒントが含まれます。
  - `error.details.canRetryWithDeviceToken` (ブール値)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` に対するクライアントの動作:
  - 信頼済みクライアントは、キャッシュ済みのデバイス単位トークンを使って、境界付きのリトライを 1 回試行できます。
  - そのリトライが失敗した場合、クライアントは自動再接続ループを停止し、operator の対応ガイダンスを表示する必要があります。

## デバイス ID + ペアリング

- ノードは、キーペアフィンガープリントから派生した安定したデバイス ID (`device.id`) を含める必要があります。
- Gateway はデバイス + ロールごとにトークンを発行します。
- local 自動承認が有効でない限り、新しいデバイス ID にはペアリング承認が必要です。
- ペアリングの自動承認は、直接の local loopback 接続を中心にしています。
- OpenClaw には、信頼済み共有シークレット補助フロー向けに、狭い backend/container-local 自己接続パスもあります。
- 同一ホストの tailnet または LAN 接続も、ペアリング上は引き続き remote として扱われ、
  承認が必要です。
- WS クライアントは通常、`connect` 中に `device` ID を含めます (operator +
  node)。デバイスなしの operator 例外は、明示的な信頼パスのみです。
  - localhost のみの非セキュア HTTP 互換性のための `gateway.controlUi.allowInsecureAuth=true`。
  - 成功した `gateway.auth.mode: "trusted-proxy"` operator Control UI 認証。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (緊急回避用、重大なセキュリティ低下)。
  - 共有 Gateway トークン/パスワードで認証された direct-loopback `gateway-client` backend RPC。
- すべての接続は、サーバーが提供する `connect.challenge` nonce に署名する必要があります。

### デバイス認証移行診断

challenge 署名前の旧動作をまだ使用しているレガシークライアントに対して、`connect` は現在、
安定した `error.details.reason` とともに `error.details.code` 配下で
`DEVICE_AUTH_*` 詳細コードを返します。

一般的な移行失敗:

| メッセージ                  | details.code                     | details.reason           | 意味                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | クライアントが `device.nonce` を省略した (または空で送信した)。 |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | クライアントが古い/誤った nonce で署名した。       |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 署名ペイロードが v2 ペイロードと一致しない。       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 署名済みタイムスタンプが許容 skew の範囲外。       |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` が公開鍵フィンガープリントと一致しない。 |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開鍵の形式/正規化に失敗した。                   |

移行先:

- 必ず `connect.challenge` を待ちます。
- サーバー nonce を含む v2 ペイロードに署名します。
- 同じ nonce を `connect.params.device.nonce` で送信します。
- 推奨される署名ペイロードは `v3` で、device/client/role/scopes/token/nonce フィールドに加えて
  `platform` と `deviceFamily` をバインドします。
- レガシー `v2` 署名は互換性のため引き続き受け入れられますが、ペアリング済みデバイスの
  メタデータピン留めが、再接続時のコマンドポリシーを引き続き制御します。

## TLS + ピン留め

- TLS は WS 接続でサポートされています。
- クライアントは任意で Gateway 証明書フィンガープリントをピン留めできます
  (`gateway.tls` 設定に加えて、`gateway.remote.tlsFingerprint` または CLI `--tls-fingerprint` を参照)。

## スコープ

このプロトコルは **完全な Gateway API** (status、channels、models、chat、
agent、sessions、nodes、approvals など) を公開します。正確なサーフェスは
`src/gateway/protocol/schema.ts` の TypeBox スキーマで定義されています。

## 関連

- [ブリッジプロトコル](/ja-JP/gateway/bridge-protocol)
- [Gateway ランブック](/ja-JP/gateway)
