---
read_when:
    - Gateway WebSocketクライアントの実装または更新
    - プロトコルの不一致や接続エラーのデバッグ
    - プロトコルスキーマ/モデルの再生成
summary: Gateway WebSocket プロトコル：ハンドシェイク、フレーム、バージョニング
title: Gateway プロトコル
x-i18n:
    generated_at: "2026-07-12T14:30:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d71b75d49bf8a1ea2d835b1d8e532b1d01e87e8b64d6ab7dcb00f28791d3b8ac
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS プロトコルは、OpenClaw の単一のコントロールプレーン兼 Node トランスポートです。オペレーターおよび Node クライアント（CLI、Web UI、macOS アプリ、iOS/Android Node、ヘッドレス Node）は WebSocket 経由で接続し、ハンドシェイク時に **ロール** と **スコープ** を宣言します。

## トランスポートとフレーミング

- WebSocket、テキストフレーム、JSON ペイロード。
- 最初のフレームは `connect` リクエストでなければなりません。
- 接続前のフレームは 64 KiB（`MAX_PREAUTH_PAYLOAD_BYTES`）に制限されます。ハンドシェイク後は、`hello-ok.policy.maxPayload` と `hello-ok.policy.maxBufferedBytes` に従います。診断が有効な場合、サイズ超過の受信フレームや低速な送信バッファについて、Gateway がフレームを閉じるか破棄する前に `payload.large` イベントが発行されます。これらのイベントには `surface`、バイトサイズ、制限値、安全な理由コードが含まれますが、メッセージ本文、添付ファイルの内容、生のフレームバイト、トークン、Cookie、シークレットは決して含まれません。

フレーム形式:

- リクエスト: `{type:"req", id, method, params}`
- レスポンス: `{type:"res", id, ok, payload|error}`
- イベント: `{type:"event", event, payload, seq?, stateVersion?}`

副作用を伴うメソッドには冪等性キーが必要です（スキーマを参照）。

## ハンドシェイク

Gateway は接続前チャレンジを送信します。

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

クライアントは `connect` で応答します。

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

Gateway は `hello-ok` で応答します。

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

`server`、`features`、`snapshot`、`policy`、`auth` は、すべて `HelloOkSchema`（`packages/gateway-protocol/src/schema/frames.ts`）で必須です。デバイストークンが発行されない場合でも、`auth` はネゴシエートされたロールとスコープを報告します（上記の形式）。`pluginSurfaceUrls` は任意であり、Plugin サーフェス名（例: `canvas`）をスコープ付きのホスト URL にマッピングします。有効期限が切れる可能性があるため、Node は新しいエントリを取得するために `{ "surface": "canvas" }` を指定して `node.pluginSurface.refresh` を呼び出します。非推奨の `canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh` パスはサポートされていません。Plugin サーフェスを使用してください。

Gateway が起動時のサイドカー処理をまだ完了している途中では、`connect` が `details.reason: "startup-sidecars"` と `retryAfterMs` を伴う再試行可能な `UNAVAILABLE` エラーを返すことがあります。これを終端的なハンドシェイク失敗として扱わず、接続の時間制限内で再試行してください。

デバイストークンが発行されると、`hello-ok.auth` に追加されます。

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

組み込みの QR/セットアップコードによるブートストラップは、モバイルへの引き継ぎパスです。基本セットアップコードでの接続が成功すると、プライマリ Node トークンと、制限されたオペレータートークンが 1 つ返されます。

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

このオペレーターへの引き継ぎは意図的に制限されています。Talk 設定の読み取り用の `operator.talk.secrets` を含め、モバイルオペレーターのループとネイティブセットアップを開始するには十分ですが、ペアリング変更スコープと `operator.admin` は含まれません。より広範なペアリング/管理アクセスには、別途承認されたペアリングまたはトークンフローが必要です。ブートストラップ認証が信頼できるトランスポート（`wss://` またはループバック/ローカルペアリング）上で実行された場合にのみ、`hello-ok.auth.deviceTokens` を永続化してください。

信頼された同一プロセスのバックエンドクライアント（`client.id: "gateway-client"`、`client.mode: "backend"`）は、共有 Gateway トークン/パスワードで認証する場合、直接ループバック接続で `device` を省略できます。このパスは内部コントロールプレーン RPC（例: サブエージェントのセッション更新）のために予約されており、古い CLI/デバイスペアリングのベースラインによってローカルバックエンド処理が妨げられることを回避します。リモート、ブラウザオリジン、Node、および明示的なデバイストークン/デバイス ID を使用するクライアントは、引き続き通常のペアリングおよびスコープ昇格チェックを通過します。

### ワーカーロールと閉じたプロトコル

クラウドワーカーは、Gateway が所有しホストキーを固定した SSH トンネルを経由する専用のループバック受信口を使用します。この受信口はワーカー ID のみを受け入れ、一般認証、Node イベント、オペレーター RPC、Plugin メソッドを決してディスパッチしません。厳格な `connect` は、環境、バンドルハッシュ、所有者エポック、RPC セットバージョン、有効期限、1 つの nullable セッションに紐付けられた、保存時にハッシュ化された短寿命の資格情報を検証します。また、現在のバージョンと機能セットも個別に確認します。成功すると最小限の `worker-hello-ok` が返されます。機能ネゴシエーションは一般プロトコルのバージョンとは独立しています。フレームは 64 KiB 未満に維持されます。閉じた許可リストには `worker.heartbeat`、`worker.transcript.commit`、`worker.live-event` が含まれます。トランスクリプトのコミットでは、所有者エポックによるフェンシング、Gateway が所有するセッションバインディング、ベースリーフの compare-and-swap、永続的なシーケンス再生を使用します。Gateway は通常のセッションライターを通じて、トランスクリプトエントリ ID と親 ID を生成します。所有権と有効期限は各 RPC で再確認されます。

### クライアント機能

オペレータークライアントは、`connect.params.caps` で任意の機能を通知できます。

- `tool-events`: 構造化されたツールライフサイクルイベントを受け入れます。
- `inline-widgets`: ホストされたインラインウィジェットのツール結果をレンダリングできます。

クライアント機能は接続中のクライアントを表すものであり、認可を表すものではありません。エージェントツールは必要な機能を宣言できます。送信元クライアントの `caps` にすべての要件が含まれていない限り、Gateway はそれらのツールを除外します。チャネルから開始された実行には Gateway クライアント機能がないため、ツールポリシーで明示的に許可されている場合でも、機能によって制限されたツールは使用できません。

### Node 接続の例

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

Node は接続時に機能の要求を宣言します。

- `caps`: `camera`、`canvas`、`screen`、`location`、`voice`、`talk` などの上位カテゴリ。
- `commands`: 呼び出し用のコマンド許可リスト。
- `permissions`: 詳細な切り替え（例: `screen.record`、`camera.capture`）。

Gateway はこれらを要求として扱い、サーバー側の許可リストを適用します。

## ロールとスコープ

オペレータースコープの完全なモデル、承認時のチェック、共有シークレットのセマンティクスについては、[オペレータースコープ](/ja-JP/gateway/operator-scopes)を参照してください。

ロール:

- `operator`: コントロールプレーンクライアント（CLI/UI/自動化）。
- `node`: 機能ホスト（camera/screen/canvas/system.run）。
- `worker`: 専用の閉じたワーカープロトコル上のクラウド実行ホスト。

オペレータースコープ（`src/gateway/operator-scopes.ts`）の完全な閉集合:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` を指定した `talk.config` には `operator.talk.secrets`（または `operator.admin`）が必要です。シークレットが含まれている場合は、`talk.resolved.config.apiKey` からアクティブな Talk プロバイダーの資格情報を読み取ります。`talk.providers.<id>.apiKey` はソースの形式を維持し、SecretRef オブジェクトまたは編集済み文字列である可能性があります。

Plugin が登録した Gateway RPC メソッドは独自のオペレータースコープを要求できますが、次の予約済みコアプレフィックスは常に `operator.admin` に解決されます（`src/shared/gateway-method-policy.ts`）: `config.*`、`exec.approvals.*`、`wizard.*`、`update.*`。

メソッドスコープは最初のゲートにすぎません。`chat.send` 経由で到達する一部のスラッシュコマンドには、より厳格なコマンドレベルのチェックが適用されます。永続的な `/config set` および `/config unset` の書き込みには、より低いオペレータースコープをすでに保持している Gateway クライアントであっても、`operator.admin` が必要です。

`node.pair.approve` には、基本メソッドスコープ（`operator.pairing`）に加えて、保留中のリクエストで宣言された `commands` に基づく追加の承認時スコープチェックがあります（`src/infra/node-pairing-authz.ts`）。

| 宣言されたコマンド                                             | 必要なスコープ                        |
| -------------------------------------------------------------- | ------------------------------------- |
| なし                                                           | `operator.pairing`                    |
| 非実行コマンド                                                 | `operator.pairing` + `operator.write` |
| `system.run`、`system.run.prepare`、`system.which` のいずれかを含む | `operator.pairing` + `operator.admin` |

### Caps/commands/permissions（Node）

Node は接続時に機能の要求を宣言します。

- `caps`: `camera`、`canvas`、`screen`、`location`、`voice`、`talk` などの上位機能カテゴリ。
- `commands`: 呼び出し用のコマンド許可リスト。
- `permissions`: 詳細な切り替え（例: `screen.record`、`camera.capture`）。

Gateway はこれらを **要求** として扱い、サーバー側の許可リストを適用します。接続済みの Node は、接続または再接続に成功した後、`node.pluginTools.update` を使用して、エージェントに公開可能な任意の Plugin または MCP ツール記述子を発行できます。ヘッドレス Node ホストは、宣言的な MCP インベントリの変更を適用するために再起動します。この更新メソッドが唯一の発行パスであり、Plugin ツール記述子は `connect` パラメーターでは受け付けられません。各記述子は、プロバイダーで安全に使用できるツール `name` を使用し、Node の現在のコマンド許可リストにある `command` を指定する必要があります。Gateway はペアリング済み Node からの記述子メタデータを信頼し、承認されたコマンド範囲外の記述子を除外し、Node の切断時にそれらを削除し、別の Node のカタログを変更しようとするオペレーターの試みを拒否します。Node が発行した記述子を無視するには、`gateway.nodes.pluginTools.enabled: false` を設定します。

接続済みの Node ホストは、完全な Skills 置換カタログを `node.skills.update` で発行します。この Node ロールのメソッドが Node Skills の唯一の発行パスであり、Skills は `connect` パラメーターでは受け付けられません。各記述子には、安全な名前、説明、およびサイズ制限された `SKILL.md` の内容が含まれます。Gateway は通常の Skills ローダーでその内容を解析し、Node が接続されている間はエージェントの Skills スナップショットに含め、切断時に削除します。Node が発行した Skills を無視するには、`gateway.nodes.skills.enabled: false` を設定します。

## プレゼンス

- `system-presence` は、デバイス ID をキーとし、`deviceId`、`roles`、`scopes` を含むエントリを返します。これにより、オペレーターと Node の両方として接続されている場合でも、UI はデバイスごとに 1 行を表示できます。
- `node.list` には、任意の `lastSeenAtMs` と `lastSeenReason` が含まれます。接続済みの Node は理由 `connect` とともに現在の接続時刻を報告します。ペアリング済みの Node は、信頼された Node イベントを通じて永続的なバックグラウンドプレゼンスを報告することもできます。

ネイティブ macOS Node は、入力アイドル時間を上限付きで含む、認証済みの `node.presence.activity` イベントも送信できます。Gateway は自身のクロックに基づいてアクティビティのタイムスタンプを導出し、`node.list` と `node.describe` を通じて接続中の最新の Mac を公開し、読み取りスコープを持つクライアントに `node.presence` 更新をブロードキャストします。選択、プライバシー、モデルコンテキスト、通知ルーティングの動作については、[アクティブなコンピューターのプレゼンス](/nodes/presence)を参照してください。

### Node のバックグラウンド生存イベント

Node は `event: "node.presence.alive"` を指定して `node.event` を呼び出し、バックグラウンドウェイク中にペアリング済み Node が稼働していたことを、接続済みとしてマークせずに記録します。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` は閉じた列挙型です：`background`、`silent_push`、`bg_app_refresh`、`significant_location`、`manual`、`connect`。不明な値は `background` に正規化されます（`src/shared/node-presence.ts`）。このイベントが永続化されるのは、認証済みの Node デバイスセッションに対してのみです。デバイスがないセッションまたはペアリングされていないセッションは `handled: false` を返します。

成功した Gateway は構造化された結果を返します。

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

古い Gateway は `node.event` に対して `{ "ok": true }` のみを返す場合があります。これは確認応答済みの RPC として扱い、プレゼンスが永続化されたとは見なさないでください。

## ブロードキャストイベントのスコープ制御

サーバーからプッシュされるブロードキャストイベントはスコープによって制限されるため、ペアリングスコープまたは Node 専用のセッションがセッション内容を受動的に受信することはありません（`src/gateway/server-broadcast.ts`）。

- チャット、エージェント、ツール結果のフレーム（ストリーミングされる `agent` イベント、ツール結果イベント）には、少なくとも `operator.read` が必要です。これを持たないセッションでは、これらのフレームが完全にスキップされます。
- Plugin が定義する `plugin.*` ブロードキャストは、デフォルトで `operator.write` または `operator.admin` に制限されます。`plugin.approval.requested` / `plugin.approval.resolved` などの明示的なエントリでは、代わりに `operator.approvals` が使用されます。
- ステータス／トランスポートイベント（`heartbeat`、`presence`、`tick`、接続／切断のライフサイクル）は制限されないため、すべての認証済みセッションからトランスポートの健全性を確認できます。
- 不明なブロードキャストイベントファミリーは、登録済みハンドラーが明示的に制限を緩和しない限り、デフォルトでスコープ制限されます（フェイルクローズ）。

各クライアント接続はクライアントごとに独自のシーケンス番号を保持するため、異なるクライアントがイベントストリームの異なるスコープフィルタ済みサブセットを受信する場合でも、そのソケット上ではブロードキャストが単調増加順に保たれます。

## RPC メソッドファミリー

`hello-ok.features.methods` は、`src/gateway/server-methods-list.ts` と、読み込まれた Plugin／チャンネルのメソッドエクスポートから構築される保守的な検出リストです。すべてのメソッドを自動生成して列挙したものではなく、一部のメソッド（たとえば `push.test`、`web.login.start`、`web.login.wait`、`sessions.usage`）は実在し呼び出し可能であっても、意図的に検出対象から除外されています。これは機能検出として扱い、`src/gateway/server-methods/*.ts` の完全な列挙とは見なさないでください。

<AccordionGroup>
  <Accordion title="システムとアイデンティティ">
    - `health` は、キャッシュ済みまたは新たにプローブされた Gateway の健全性スナップショットを返します。
    - `diagnostics.stability` は、最近の上限付き診断安定性レコーダーを返します。内容はイベント名、件数、バイトサイズ、メモリ測定値、キュー／セッション状態、チャンネル／Plugin 名、セッション ID です。チャットテキスト、Webhook 本文、ツール出力、生のリクエスト／レスポンス本文、トークン、Cookie、シークレットは含まれません。`operator.read` が必要です。
    - `status` は `/status` 形式の Gateway サマリーを返します。機密フィールドは管理者スコープを持つオペレータークライアントにのみ返されます。
    - `gateway.identity.get` は、リレーおよびペアリングフローで使用される Gateway デバイスアイデンティティを返します。
    - `system-presence` は、接続中のオペレーター／Node デバイスについて、現在のプレゼンススナップショットを返します。
    - `system-event` はシステムイベントを追加し、プレゼンスコンテキストを更新／ブロードキャストできます。
    - `last-heartbeat` は、最新の永続化済み Heartbeat イベントを返します。
    - `set-heartbeats` は、Gateway 上の Heartbeat 処理を切り替えます。
    - `gateway.suspend.prepare` は、追跡対象の Gateway 処理がアイドル状態の場合にのみ、短時間の協調サスペンドリースを作成します。`gateway.suspend.status` はそのリースを確認し、`gateway.suspend.resume` は復帰後またはホスト操作の中止後にリースを解放します。

  </Accordion>

  <Accordion title="モデルと使用量">
    - `models.list` は、ランタイムで許可されたモデルカタログを返します。下記の「`models.list` ビュー」を参照してください。
    - `usage.status` は、プロバイダーの使用量ウィンドウ／残りクォータのサマリーを返します。
    - `usage.cost` は、指定した日付範囲の集計コスト使用量サマリーを返します。1 つのエージェントを対象にするには `agentId` を渡し、設定済みエージェントを集計するには `agentScope: "all"` を渡します。
    - `doctor.memory.status` は、アクティブなデフォルトエージェントワークスペースについて、ベクトルメモリ／キャッシュ済み埋め込みの準備状態を返します。明示的に埋め込みプロバイダーへライブ ping する場合にのみ、`{ "probe": true }` または `{ "deep": true }` を渡します。Dreaming ストアの統計を 1 つのエージェントワークスペースに限定するには `{ "agentId": "agent-id" }` を渡します。省略すると、設定済みの Dreaming ワークスペースが集計されます。
    - `doctor.memory.dreamDiary`、`doctor.memory.backfillDreamDiary`、`doctor.memory.resetDreamDiary`、`doctor.memory.resetGroundedShortTerm`、`doctor.memory.repairDreamingArtifacts`、`doctor.memory.dedupeDreamDiary` は、任意で `{ "agentId": "agent-id" }` を受け取ります。省略すると、設定済みのデフォルトエージェントワークスペースを対象に処理します。
    - `doctor.memory.remHarness` は、リモートのコントロールプレーンクライアント向けに、上限付きの読み取り専用 REM ハーネスプレビューを返します。これにはワークスペースパス、メモリスニペット、レンダリング済みのグラウンデッド Markdown、深層昇格候補が含まれます。`operator.read` が必要です。
    - `sessions.usage` は、セッションごとの使用量サマリーを返します。1 つのエージェントを対象にするには `agentId` を渡し、設定済みエージェントをまとめて一覧表示するには `agentScope: "all"` を渡します。
      どちらの使用量メソッドも、IANA `timeZone` とともに `mode: "specific"` を受け入れ、夏時間を考慮した暦日境界とバケットを使用できます。`utcOffset` は古いクライアント向け、および Gateway ランタイムが要求されたゾーンを認識しない場合のフォールバックとして、引き続きサポートされます。
    - `sessions.usage.timeseries` は、1 つのセッションの時系列使用量を返します。
    - `sessions.usage.logs` は、1 つのセッションの使用量ログエントリを返します。

  </Accordion>

  <Accordion title="チャンネルとログインヘルパー">
    - `channels.status` は、組み込みおよびバンドル済みのチャンネル／Plugin ステータスサマリーを返します。
    - `channels.logout` は、チャンネルが対応している場合、指定したチャンネル／アカウントからログアウトします。
    - `web.login.start` は、現在の QR 対応 Web チャンネルプロバイダーの QR／Web ログインフローを開始します。
    - `web.login.wait` は、そのフローの完了を待ち、成功するとチャンネルを開始します。
    - `push.test` は、登録済みの iOS Node にテスト用 APNs プッシュを送信します。
    - `voicewake.get` は、保存済みのウェイクワードトリガーを返します。
    - `voicewake.set` は、ウェイクワードトリガーを更新し、その変更をブロードキャストします。

  </Accordion>

  <Accordion title="Plugin 管理">
    - `plugins.list`（`operator.read`）は、インストール済み Plugin のインベントリに加え、ローカルで選定された公式候補、診断情報、および現在のインストールモードで変更が許可されているかどうかを返します。
    - `plugins.search`（`operator.read`）は、インストール可能な ClawHub コード Plugin およびバンドル Plugin ファミリーを検索します。空でない `query` と、任意で 1 から 100 までの `limit` を渡します。
    - `plugins.install`（`operator.admin`）は、`{ source: "official", pluginId }` を指定した公式カタログエントリ、または `{ source: "clawhub", packageName, version?, acknowledgeClawHubRisk? }` を指定した ClawHub パッケージのいずれかをインストールします。ClawHub のインストールでは、Gateway の信頼性、整合性、インストールポリシーのチェックが維持されます。インストールが成功した場合は Gateway の再起動が必要です。
    - `plugins.setEnabled`（`operator.admin`）は、`{ pluginId, enabled }` を指定して、インストール済みの 1 つの Plugin の有効化ポリシーを変更します。レスポンスには、更新済みのカタログエントリ、再起動メタデータ、およびスロット選択に関する警告が含まれます。
    - `plugins.uninstall`（`operator.admin`）は、`{ pluginId }` を指定して、外部インストールされた 1 つの Plugin を削除します。削除対象は設定参照、インストールレコード、管理対象ファイルです。バンドル済み Plugin はアンインストールできず、無効化のみ可能です。レスポンスには削除アクションが一覧表示され、常に Gateway の再起動が必要です。

  </Accordion>

  <Accordion title="メッセージングとログ">
    - `send` は、チャットランナー外でチャンネル／アカウント／スレッドを対象に送信するための、直接のアウトバウンド配信 RPC です。
    - `logs.tail` は、カーソル／件数上限および最大バイト数の制御付きで、設定済み Gateway ファイルログの末尾を返します。

  </Accordion>

  <Accordion title="オペレーターターミナル">
    - `terminal.open` は、明示的な `agentId` またはデフォルトエージェントに対してホスト PTY を開始し、解決されたエージェント、作業ディレクトリ、シェル、制限状態を返します。
    - `terminal.input`、`terminal.resize`、`terminal.close` は、呼び出し元の接続が所有するセッションに対してのみ動作します。
    - `terminal.data` および `terminal.exit` イベントは、セッションを所有する接続にのみストリーミングされます。
    - 接続が切断されたセッションは終了されず、デタッチされます。最近の出力が上限付きのサーバー側バッファに蓄積される間、`gateway.terminal.detachedSessionTimeoutSeconds`（デフォルト 300、`0` で切断時終了を復元）の期間は再アタッチ可能な状態に保たれます。
    - `terminal.list` はアタッチ可能なセッションを返します。`terminal.attach` は稼働中またはデタッチ済みのセッションを呼び出し元の接続に再バインドし、再生バッファを返します（tmux 形式の引き継ぎで、以前の稼働中オーナーは理由 `detached` の `terminal.exit` を受信します）。`terminal.text` は、アタッチせずにバッファをプレーンテキストとして読み取ります。
    - すべてのターミナルメソッドには `operator.admin` が必要で、`gateway.terminal.enabled` を明示的に true にする必要があります。完全にサンドボックス化されたエージェントは拒否され、エージェントポリシーが変更されると、デタッチ済みのものを含む既存および処理中の PTY が終了されます。

  </Accordion>

  <Accordion title="Talk と TTS">
    - `talk.catalog` は、音声合成、ストリーミング文字起こし、リアルタイム音声向けの読み取り専用 Talk プロバイダーカタログを返します。これには、正規プロバイダー ID、レジストリエイリアス、ラベル、設定状態、オプションのグループレベルの `ready` 結果、公開されているモデル／音声 ID、正規モード、トランスポート、ブレイン戦略、リアルタイム音声／ケイパビリティフラグが含まれますが、プロバイダーのシークレットを返したり、グローバル設定を変更したりすることはありません。現在の Gateway は、ランタイムのプロバイダー選択を適用した後に `ready` を設定します。古い Gateway でこれが存在しない場合は、未検証として扱ってください。
    - `talk.config` は、有効な Talk 設定ペイロードを返します。`includeSecrets` には `operator.talk.secrets`（または `operator.admin`）が必要です。
    - `talk.session.create` は、`realtime/gateway-relay`、`transcription/gateway-relay`、または `stt-tts/managed-room` 用に Gateway が所有する Talk セッションを作成します。`stt-tts/managed-room` では、`sessionKey` を渡す `operator.write` 呼び出し元は、スコープ付きセッションキーの可視性を確保するために `spawnedBy` も渡す必要があります。スコープなしの `sessionKey` 作成と `brain: "direct-tools"` には `operator.admin` が必要です。
    - `talk.session.join` は、マネージドルームのセッショントークンを検証し、必要に応じて `session.ready` または `session.replaced` を発行し、ルーム／セッションのメタデータと最近の Talk イベントを返します。平文トークンやそのハッシュを返すことはありません。
    - `talk.session.appendAudio` は、Gateway が所有するリアルタイムリレーおよび文字起こしセッションに、base64 PCM 入力音声を追加します。
    - `talk.session.startTurn`、`talk.session.endTurn`、`talk.session.cancelTurn` は、状態をクリアする前に古いターンを拒否しながら、マネージドルームのターンライフサイクルを制御します。
    - `talk.session.cancelOutput` は、主に Gateway リレーセッションで VAD により制御される割り込みのために、アシスタントの音声出力を停止します。
    - `talk.session.submitToolResult` は、Gateway が所有するリアルタイムリレーセッションから発行されたプロバイダーのツール呼び出しを完了します。リクエストは、プロバイダーブリッジが公開する非同期完了シグナルがある場合、その完了を待ちます。送信に失敗した場合、リンクされた実行はアクティブなままとなり、成功したツール結果イベントは発行されません。中間ツール出力には `options: { willContinue: true }` を渡します。プロバイダーブリッジが抑制サポートを通知しており、結果から別の応答を開始すべきでない場合は、`options: { suppressResponse: true }` を渡します。
    - `talk.session.steer` は、Gateway が所有するエージェントバックエンドの Talk セッションに、アクティブ実行の音声制御を送信します。形式は `{ sessionId, text, mode? }` で、`mode` は `status`、`steer`、`cancel`、`followup` のいずれかです。モードを省略すると、発話テキストから分類されます。
    - `talk.session.close` は、Gateway が所有するリレー、文字起こし、またはマネージドルームのセッションを閉じ、終端 Talk イベントを発行します。
    - `talk.mode` は、WebChat／Control UI クライアント向けに現在の Talk モード状態を設定／ブロードキャストします。
    - `talk.client.create` は、Gateway が設定、認証情報、指示、ツールポリシーを所有したまま、`webrtc` または `provider-websocket` を使用してクライアント所有のリアルタイムプロバイダーセッションを作成します。
    - `talk.client.toolCall` を使用すると、クライアント所有のリアルタイムトランスポートからプロバイダーのツール呼び出しを Gateway ポリシーへ転送できます。最初にサポートされるツールは `openclaw_agent_consult` です。クライアントは実行 ID を受け取り、通常のチャットライフサイクルイベントを待ってから、プロバイダー固有のツール結果を送信します。
    - `talk.client.steer` は、クライアント所有のリアルタイムトランスポート向けに、アクティブ実行の音声制御を送信します。Gateway は `sessionKey` からアクティブな埋め込み実行を解決し、制御を黙って破棄するのではなく、構造化された承認／拒否結果を返します。
    - `talk.event` は、リアルタイム、文字起こし、STT/TTS、マネージドルーム、電話、会議アダプター用の単一 Talk イベントチャネルです。
    - `talk.speak` は、アクティブな Talk 音声プロバイダーを通じて音声を合成します。
    - `tts.status` は、TTS の有効状態、アクティブプロバイダー、フォールバックプロバイダー、プロバイダー設定状態を返します。
    - `tts.providers` は、可視の TTS プロバイダー一覧を返します。
    - `tts.enable` と `tts.disable` は、TTS 設定状態を切り替えます。
    - `tts.setProvider` は、優先 TTS プロバイダーを更新します。
    - `tts.convert` は、単発のテキスト読み上げ変換を実行します。
    - `tts.speak`（`operator.write`）は、設定された汎用 TTS プロバイダーチェーンで空でない `text` をレンダリングし、1 つの完全なクリップを `audioBase64` としてインラインで返します。さらに、`provider` と、オプションの `outputFormat`、`mimeType`、`fileExtension` メタデータも返します。`tts.convert` とは異なり、Gateway ローカルのパスは返しません。`talk.speak` とは異なり、Talk プロバイダーは必要ありません。`messages.tts.maxTextLength` を超えるテキストは `INVALID_REQUEST` を返し、合成の失敗は `UNAVAILABLE` を返します。

  </Accordion>

  <Accordion title="シークレット、設定、更新、ウィザード">
    - `secrets.reload` は、アクティブな SecretRef を再解決し、すべて成功した場合にのみランタイムのシークレット状態を入れ替えます。
    - `secrets.resolve` は、特定のコマンド／ターゲットセットに対するコマンドターゲットのシークレット割り当てを解決します。
    - `config.get` は、現在の設定スナップショットとハッシュを返します。
    - `config.set` は、検証済みの設定ペイロードを書き込みます。
    - `config.patch` は、部分的な設定更新をマージします。破壊的な配列置換では、影響を受けるパスを `replacePaths` に含める必要があります。配列エントリ配下のネストされた配列には、`agents.list[].skills` のような `[]` パスを使用します。
    - `config.apply` は、設定ペイロード全体を検証して置き換えます。
    - `config.schema` は、Control UI と CLI ツールで使用されるライブ設定スキーマペイロードを返します。これには、スキーマ、`uiHints`、バージョン、生成メタデータ、および読み込み可能な場合は Plugin とチャネルのスキーマメタデータが含まれます。UI と同じラベル／ヘルプテキストから取得した `title`／`description` メタデータも含まれます。対応するフィールドドキュメントが存在する場合は、ネストされたオブジェクト、ワイルドカード、配列項目、`anyOf`／`oneOf`／`allOf` の合成ブランチも対象です。
    - `config.schema.lookup` は、1 つの設定パスに対するパススコープの検索ペイロードを返します。これには、正規化されたパス、浅いスキーマノード、一致したヒントと `hintPath`、オプションの `reloadKind`、UI／CLI のドリルダウン用の直接の子要素サマリーが含まれます。`reloadKind` は `restart`、`hot`、`none`（`src/config/schema.ts`）のいずれかで、要求されたパスに対する Gateway 設定再読み込みプランナーを反映します。検索スキーマノードには、ユーザー向けドキュメントと一般的な検証フィールド（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、数値／文字列／配列／オブジェクトの境界、`additionalProperties`、`deprecated`、`readOnly`、`writeOnly`）が保持されます。子要素サマリーでは、`key`、正規化された `path`、`type`、`required`、`hasChildren`、オプションの `reloadKind`、および一致した `hint`／`hintPath` が公開されます。
    - `update.run` は Gateway の更新フローを実行し、更新が成功した場合にのみ再起動をスケジュールします。セッションを持つ呼び出し元は `continuationMessage` を含めることで、起動時に再起動継続キューを通じて後続のエージェントターンを 1 回再開できます。コントロールプレーンからのパッケージマネージャー更新および監視下の Git チェックアウト更新では、稼働中の Gateway 内でパッケージツリーを置き換えたり、チェックアウト／ビルド出力を変更したりする代わりに、分離されたマネージドサービスへの引き継ぎを使用します。開始された引き継ぎは、`result.reason: "managed-service-handoff-started"` および `handoff.status: "started"` とともに `ok: true` を返します。利用不能または失敗した引き継ぎは、`managed-service-handoff-unavailable` または `managed-service-handoff-failed` とともに `ok: false` を返し、手動のシェル更新が必要な場合は `handoff.command` も返します。利用不能とは、systemd の `OPENCLAW_SYSTEMD_UNIT` など、OpenClaw に安全なスーパーバイザー境界または永続的なサービス ID がないことを意味します。引き継ぎの開始中、再起動センチネルは一時的に `stats.reason: "restart-health-pending"` を報告する場合があります。継続処理は、CLI が再起動後の Gateway を検証し、最終的な `ok` センチネルを書き込むまで遅延します。
    - `update.status` は、最新の更新再起動センチネルを更新して返します。利用可能な場合は、再起動後に実行中のバージョンも含まれます。
    - `wizard.start`、`wizard.next`、`wizard.status`、`wizard.cancel` は、WS RPC 経由でオンボーディングウィザードを公開します。

  </Accordion>

  <Accordion title="エージェントとワークスペースのヘルパー">
    - `agents.list` は、有効なモデルとランタイムメタデータを含む、設定済みエージェントエントリを返します。
    - `agents.create`、`agents.update`、`agents.delete` は、エージェントレコードとワークスペースの接続を管理します。
    - `agents.files.list`、`agents.files.get`、`agents.files.set` は、エージェントに公開されるブートストラップワークスペースファイルを管理します。
    - `audit.activity.list` は、バージョン管理されたメタデータのみのアクティビティ台帳を返します。`audit.list` は、互換性を維持した実行／ツール RPC として引き続き使用できます。
    - `agents.workspace.list` と `agents.workspace.get`（`operator.read`）は、[オペレータースコープ](/ja-JP/gateway/operator-scopes)で説明されている信頼済みオペレータードメイン内のクライアントに対して、エージェントのワークスペースディレクトリを読み取り専用かつページ分割で閲覧できるようにします。リクエストではワークスペース相対パスのみを受け付けます。読み取りは realpath で解決されたワークスペースルート内に限定され（シンボリックリンクおよびハードリンクによる脱出は拒否）、サイズ上限が適用され、UTF-8 テキストと一般的な画像形式（base64）に限定されます。レスポンスでホストのワークスペースパスが公開されることはありません。この名前空間には書き込み操作はありません。
    - `tasks.list`、`tasks.get`、`tasks.cancel` は、Gateway のタスク台帳を SDK およびオペレータークライアントに公開します。下記の[タスク台帳 RPC](#task-ledger-rpcs)を参照してください。
    - `artifacts.list`、`artifacts.get`、`artifacts.download` は、明示的な `sessionKey`、`runId`、または `taskId` スコープについて、トランスクリプトから派生したアーティファクトのサマリーとダウンロードを公開します。実行およびタスクのクエリは、所有するセッションをサーバー側で解決し、来歴が一致するトランスクリプトメディアのみを返します。安全でない URL またはローカル URL のソースは、サーバー側で取得する代わりに、サポートされていないダウンロードとして返されます。
    - `environments.list` と `environments.status` は、Gateway ローカルおよび Node 環境の検出を維持します。設定済みのクラウドワーカーと、以前のプロファイルによって残された永続レコードには、`providerId`、オプションの `leaseId`、`state`、`ageMs`、オプションの `idleMs`、`attachedSessionIds` を持つ `worker` メタデータが追加されます。ワーカーのライフサイクル状態は、`requested`、`provisioning`、`bootstrapping`、`ready`、`attached`、`idle`、`draining`、`destroying`、`destroyed`、`failed`、`orphaned` です。
    - `environments.create`（`{ profileId, idempotencyKey }`）は、設定済みの Plugin プロバイダープロファイルからワーカーをプロビジョニングします。同じキーで再試行すると、永続化された操作が再利用されます。`environments.destroy`（`{ environmentId }`）は、永続ワーカー環境の冪等な破棄を要求します。どちらも `operator.admin` が必要なコントロールプレーン書き込みであり、ステータスレスポンスと同じ環境サマリー形式を返します。
    - `agent.identity.get` は、エージェントまたはセッションに対する有効なアシスタント ID を返します。
    - `agent.wait` は、実行の完了を待機し、利用可能な場合は終端スナップショットを返します。

  </Accordion>

  <Accordion title="セッション制御">
    - `sessions.list` は現在のセッションインデックスを返します。エージェントランタイムバックエンドが構成されている場合は、行ごとの `agentRuntime` メタデータも含まれます。
    - `sessions.subscribe` と `sessions.unsubscribe` は、現在の WS クライアントに対するセッション変更イベントの購読を切り替えます。
    - `sessions.messages.subscribe` と `sessions.messages.unsubscribe` は、1 つのセッションに対するトランスクリプト／メッセージイベントの購読を切り替えます。`includeApprovals: true` を渡すと、永続化された対象範囲にその正確なセッションが含まれ、かつレビュアーのバインディングによって購読クライアントが承認されている承認について、サニタイズされた `session.approval` ライフサイクルイベントも受信します。その場合、購読レスポンスには上限付きの保留中 `approvalReplay` が含まれ、`truncated` が false のときはそれが信頼できる情報源となります。このオプトインは購読呼び出しごとに適用され、保持されません。同じセッションを `includeApprovals: true` なしで再購読すると、既存の承認購読が削除されます。通常のセッション読み取り権限に加えて、このオプトインには `operator.admin`、またはペアリング済みデバイス上の `operator.approvals` が必要です。
    - `sessions.preview` は、指定したセッションキーの上限付きトランスクリプトプレビューを返します。
    - `sessions.describe` は、正確なセッションキーに対応する 1 つの Gateway セッション行を返します。
    - `sessions.resolve` は、セッションターゲットを解決または正規化します。
    - `sessions.create` は新しいセッションエントリを作成します。`worktree: true` は管理対象の worktree をプロビジョニングします。任意の `worktreeBaseRef`／`worktreeName` でベース ref とブランチ名を選択し、`execNode`（`operator.admin`）でセッションの exec を Node ホストにバインドします。作成された worktree は結果にも返され、セッション行に永続化されます（`worktree: { id, branch, repoRoot }`）。エントリは作成されたものの、ネストされた最初の `chat.send` が拒否された場合、成功結果には `runStarted: false` と `runError` が含まれます。クライアントはプロンプトを保持し、返されたセッションキーに対して再試行できます。
    - `sessions.groups.list`、`sessions.groups.put`、`sessions.groups.rename`、`sessions.groups.delete` は、Gateway が所有するカスタムセッショングループカタログ（名前と表示順）を管理します。所属情報は各セッションの `category` フィールドに保持され、名前変更と削除ではメンバーセッションがサーバー側で更新されます。
    - `sessions.send` は既存のセッションにメッセージを送信します。
    - `sessions.steer` は、アクティブなセッション向けの割り込みおよび誘導バリアントです。
    - `sessions.abort` は、セッションのアクティブな処理を中止します。`key` と任意の `runId` を渡すか、Gateway がセッションに解決できるアクティブな実行の場合は `runId` のみを渡します。
    - `sessions.patch` はセッションのメタデータ／オーバーライドを更新し、解決済みの正規モデルと有効な `agentRuntime` を報告します。
    - `sessions.reset`、`sessions.delete`、`sessions.compact` はセッションのメンテナンスを実行します。
    - `sessions.get` は保存されている完全なセッション行を返します。
    - チャットの実行では、引き続き `chat.history`、`chat.send`、`chat.abort`、`chat.inject` を使用します。`chat.history` は UI クライアント向けに表示用に正規化されます。インラインディレクティブタグは表示テキストから除去され、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および途中で切れたツール呼び出しブロック）と漏出した ASCII／全角のモデル制御トークンも除去されます。純粋なサイレントトークンのアシスタント行（正確に `NO_REPLY`／`no_reply`）は省略され、サイズ超過の行はプレースホルダーに置き換えられる場合があります。
    - `chat.message.get` は、表示可能な単一のトランスクリプトエントリに対する追加的な上限付き完全メッセージリーダーです。`sessionKey`、セッション選択がエージェントスコープの場合は任意の `agentId`、および以前に `chat.history` で公開されたトランスクリプトの `messageId` を渡します。保存されたエントリがまだ利用可能でサイズ超過でない場合、Gateway は軽量な履歴切り詰め上限を適用せず、同じ表示用正規化済みプロジェクションを返します。
    - `chat.toolTitles` は、Control UI に表示されるツール呼び出しの短い目的タイトルを返します（バッチ処理、上限付き入力で最大 24 項目）。この機能は `gateway.controlUi.toolTitles`（デフォルトはオフ）によるオプトインです。無効な Gateway はモデルを呼び出さずに `{ titles: {}, disabled: true }` を返すため、クライアントは問い合わせを停止できます。有効な場合、タイトルには標準のユーティリティモデルルーティングが使用されます。明示的に構成された `utilityModel`（すべてのユーティリティタスクと同様に、選択したプロバイダーへ上限付きのタスク内容を送信する可能性がある、オペレーターによる決定）を使用し、それがなければセッションプロバイダーが宣言した小規模モデルのデフォルトを使用するため、新しい送信先が暗黙的に追加されることはありません。空の `utilityModel` を指定すると完全に無効になります。タイトルがプライマリモデルにフォールバックすることはありません。結果はツール名と入力をキーとしてエージェントごとの状態データベースにキャッシュされるため、同じ呼び出しを繰り返し表示しても再課金されません。
    - `chat.send` は、1 ターン限りの `fastMode: "auto"` を受け付けます。これにより、自動カットオフより前に開始されたモデル呼び出しには高速モードを使用し、その後の再試行、フォールバック、ツール結果、または継続の呼び出しは高速モードなしで開始します。カットオフのデフォルトは 60 秒（`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`）で、モデルごとに `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` を使用して構成できます。`chat.send` の呼び出し元は、1 ターン限りの `fastAutoOnSeconds` を渡して、そのリクエストのカットオフをオーバーライドできます。

  </Accordion>

  <Accordion title="デバイスのペアリングとデバイストークン">
    - `device.pair.list` は、保留中および承認済みのペアリング済みデバイスを返します。
    - `device.pair.setupCode` は、モバイルセットアップコードと、デフォルトでは PNG QR データ URL を作成します。これには `operator.admin` が必要であり、公開される検出情報から意図的に除外されています。結果には `setupCode`、任意の `qrDataUrl`、`gatewayUrl`、機密情報ではない `auth` ラベル、および `urlSource` が含まれます。
    - `device.pair.approve`、`device.pair.reject`、`device.pair.remove` はデバイスペアリングレコードを管理します。
    - `device.pair.rename` はオペレーターラベル（`{ deviceId, label }`）を割り当てます。このラベルはクライアントから報告された表示名より優先され、デバイスの修復や再承認後も保持されます。
    - `device.token.rotate` は、承認済みのロールおよび呼び出し元のスコープ範囲内で、ペアリング済みデバイスのトークンをローテーションします。
    - `device.token.revoke` は、承認済みのロールおよび呼び出し元のスコープ範囲内で、ペアリング済みデバイスのトークンを失効させます。

    セットアップコードには、有効期間の短いブートストラップ認証情報が埋め込まれています。クライアントは、ペアリングフローを超えて
    それをログに記録したり永続化したりしてはなりません。

  </Accordion>

  <Accordion title="Node のペアリング、呼び出し、保留中の処理">
    - `node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove` は、Node のケイパビリティ承認を扱います。`node.pair.request` と `node.pair.verify` は、独立した Node ペアリングストアとともに 2026.7 で削除されました。保留中のリクエストは、Node の接続時に Gateway によって作成されます。
    - `node.list` と `node.describe` は、既知／接続済みの Node の状態を返します。
    - `node.rename` は、ペアリング済み Node のラベルを更新します。
    - `node.invoke` は、接続済み Node にコマンドを転送します。
    - `node.invoke.result` は、呼び出しリクエストの結果を返します。
    - `mcp.tools.call.v1` は、構成済みの Node ローカル MCP ツールを呼び出すための、ヘッドレス Node ホストコマンドです。これは `node.invoke` を通じて伝送され、Node がそのコマンドを宣言している必要があり、引き続きペアリング承認と `gateway.nodes.denyCommands` の対象となります。
    - `node.event` は、Node から発生したイベントを Gateway に戻します。
    - `node.pluginTools.update` は、接続済み Node のエージェントに表示される Plugin／MCP ツール記述子を置き換えるための唯一の公開経路です。`connect` パラメーターにはこれらは含まれません。
    - `node.pending.pull` と `node.pending.ack` は、接続済み Node のキュー API です。
    - `node.pending.enqueue` と `node.pending.drain` は、オフライン／切断中の Node に対する永続的な保留中処理を管理します。

  </Accordion>

  <Accordion title="承認ファミリー">
    - `approval.get` と `approval.resolve` は、種類に依存しない永続的な承認メソッドです（スコープ `operator.approvals`）。`approval.get` は、安定した `urlPath` を持つ、サニタイズされた保留中または保持済みの終端プロジェクションを返します。`approval.resolve` は、正規の承認 ID、明示的な `kind`、および決定を受け取り、最初の回答を優先する解決を適用し、記録された正規の結果を常に返します。
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list`、`exec.approval.resolve` は、単発の exec 承認リクエストと、保留中の承認の検索／再生を扱います。これらは、同じ永続的な承認レジストリ上のプロトコル境界アダプターです。
    - `exec.approval.waitDecision` は、1 件の保留中 exec 承認を待機し、最終決定を返します（タイムアウト時は `null`）。
    - `exec.approvals.get` と `exec.approvals.set` は、Gateway の exec 承認ポリシーのスナップショットを管理します。
    - `exec.approvals.node.get` と `exec.approvals.node.set` は、Node リレーコマンドを介して Node ローカルの exec 承認ポリシーを管理します。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision`、`plugin.approval.resolve` は、Plugin で定義された承認フローを扱います。

  </Accordion>

  <Accordion title="自動化、Skills、ツール">
    - 自動化：`wake` は、即時または次の Heartbeat でのウェイクテキスト注入をスケジュールします。`cron.get`、`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` はスケジュールされた処理を管理します。
    - `cron.run` は、手動実行向けのエンキュー形式 RPC のままです。完了セマンティクスが必要なクライアントは、返された `runId` を読み取り、`cron.runs` をポーリングする必要があります。
    - `cron.runs` は任意の空でない `runId` フィルターを受け付けるため、クライアントは同じジョブの他の履歴エントリと競合せずに、キューに入った 1 件の手動実行を追跡できます。
    - Skills とツール：`commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。以下の[オペレーター向けヘルパーメソッド](#operator-helper-methods)を参照してください。

  </Accordion>
</AccordionGroup>

### 一般的なイベントファミリー

- `chat`：`chat.inject` などの UI チャット更新、およびトランスクリプトのみに関するその他のチャット
  イベントです。プロトコル v4 では、差分ペイロードは `deltaText` を含み、`message` は引き続き
  アシスタントの累積スナップショットです。プレフィックスではない置換では
  `replace=true` を設定し、`deltaText` を置換テキストとして使用します。
- `session.message`、`session.operation`、`session.tool`：購読中のセッションに関するトランスクリプト、進行中の
  セッション操作、およびイベントストリームの更新です。
- `session.approval`：明示的にオプトインした正確なセッションの購読者に対する、サニタイズされた保留中および終端の承認情報です。
  子承認は永続化された祖先の対象範囲を使用します。イベントがトランスクリプトを変更したり、エージェントを起動したりすることはありません。
- `sessions.changed`：セッションインデックスまたはメタデータが変更されました。
- `presence`：システムプレゼンスのスナップショット更新です。
- `tick`：定期的なキープアライブ／生存確認イベントです。
- `health`：Gateway のヘルススナップショット更新です。
- `heartbeat`：Heartbeat イベントストリームの更新です。
- `cron`：Cron の実行／ジョブ変更イベントです。
- `shutdown`：Gateway のシャットダウン通知です。
- `node.pair.requested` / `node.pair.resolved`：Node のペアリングライフサイクルです。
- `node.invoke.request`：Node 呼び出しリクエストのブロードキャストです。
- `device.pair.requested` / `device.pair.resolved`：ペアリング済みデバイスのライフサイクルです。
- `voicewake.changed`：ウェイクワードトリガーの構成が変更されました。
- `exec.approval.requested` / `exec.approval.resolved`：exec 承認の
  ライフサイクルです。
- `plugin.approval.requested` / `plugin.approval.resolved`：Plugin 承認の
  ライフサイクルです。

### Node ヘルパーメソッド

Node は、自動許可チェック用の Skills 実行可能ファイルの現在の一覧を取得するために、
`skills.bins` を呼び出せます。

## 監査台帳 RPC

`audit.activity.list` は、エージェントの実行、ツールアクション、およびオプトインのメッセージライフサイクルメタデータについて、最新のものを先頭にした安定したビューをオペレータークライアントに提供します。これには
`operator.read` が必要です。クエリでは 30 日より古いレコードが除外され、共有
SQLite 台帳の上限は 100,000 レコードです。期限切れの行は、
Gateway の起動時、1 時間ごとのメンテナンス時、およびその後の書き込み時に削除されます。データモデルとプライバシーセマンティクスについては、
[監査履歴](/gateway/audit)を参照してください。

- パラメーター: 完全一致する省略可能な `agentId`、`sessionKey`、または `runId`、省略可能な `kind`
  (`"agent_run"`、`"tool_action"`、または `"message"`)、省略可能な `status`
  (`"started"`、`"succeeded"`、`"failed"`、`"cancelled"`、`"timed_out"`、
  `"blocked"`、または `"unknown"`)、省略可能なメッセージの `direction` (`"inbound"` または
  `"outbound"`) と完全一致する `channel`、省略可能な両端を含む `after` / `before`
  Unix ミリ秒境界、省略可能な `1` から `500` までの `limit`、および前のページから取得した
  省略可能な文字列 `cursor`。
- 結果: `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`。

名前付きの V1 結果ユニオンには、エージェント実行、ツールアクション、受信メッセージ、
送信メッセージごとに個別のスキーマがあります。`eventType` 判別子はそれぞれ
`agent_run`、`tool_action`、`inbound_message`、または `outbound_message` です。`kind` と
メッセージの `direction` は、フィルタリングと表示のために引き続き使用できます。すべてのイベントには
整数の `schemaVersion: 1` があります。メッセージの識別情報参照では、正確に
`hmac-sha256:v1:<32 hex key id>:<64 hex digest>` 形式を使用します。チャネル送信者のアクター
ID も同じ形式を使用します。

すべてのバリアントで `eventType`、`schemaVersion`、`eventId`、`sequence`、
`sourceSequence`、`occurredAt`、`kind`、`action`、`status`、`actor`、および
`redaction` が必須です。バリアント固有のフィールドは次のとおりです。

| `eventType`        | 必須フィールド                                                    | 省略可能なフィールド                                                                                                            |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `agent_run`        | `agentId`、`runId`; `kind: "agent_run"`                           | `sessionKey`、`sessionId`、`errorCode`                                                                                          |
| `tool_action`      | `agentId`、`runId`; `kind: "tool_action"`                         | `sessionKey`、`sessionId`、`toolCallId`、`toolName`、`errorCode`                                                                |
| `inbound_message`  | `direction: "inbound"`、`channel`、`conversationKind`、`outcome`  | `agentId`、`runId`、`durationMs`、`resultCount`、識別情報参照、`reasonCode`、`errorCode`                                         |
| `outbound_message` | `direction: "outbound"`、`channel`、`conversationKind`、`outcome` | `agentId`、`runId`、`durationMs`、`resultCount`、識別情報参照、`reasonCode`、`deliveryKind`、`failureStage`、`errorCode`          |

メッセージの閉じた列挙型は次のとおりです。

- `conversationKind`: `direct`、`group`、`channel`、または `unknown`。
- 受信の `outcome`: `completed`、`skipped`、または `failed`。省略可能な
  `reasonCode`: `duplicate`、`reply_operation_active`、
  `reply_operation_aborted`、`fast_abort`、`plugin_bound_handled`、
  `plugin_bound_unavailable`、`plugin_bound_declined`、`plugin_bound_error`、
  `before_dispatch_handled`、`acp_dispatch_completed`、`acp_dispatch_failed`、
  `acp_dispatch_empty`、または `acp_dispatch_aborted`。
- 送信の `outcome`: `sent`、`suppressed`、`failed`、または `unknown`。省略可能な
  `reasonCode`: `cancelled_by_message_sending_hook`、
  `cancelled_by_reply_payload_sending_hook`、
  `empty_after_message_sending_hook`、`empty_after_reply_payload_sending_hook`、
  または `no_visible_payload`。プラットフォームの識別情報を返さないアダプターは
  `unknown` です。外部で副作用が発生していないことを証明できないためです。
- `deliveryKind`: `text`、`media`、または `other`。`failureStage`:
  `platform_send`、`queue`、または `unknown`。

終端フィールドは相互に関連しており、個別に省略可能なわけではありません。

| バリアント       | 終端マッピング                                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| エージェント実行 | `started` には `errorCode` がありません。成功以外の各完了ステータスには、対応する `run_*` コードが必要です。                                                      |
| ツールアクション | `started` と成功には `errorCode` がありません。それ以外の各完了ステータスには、対応する `tool_*` コードが必要です。                                               |
| 受信メッセージ   | succeeded = `completed`、blocked = `skipped`、failed = `failed` に `message_processing_failed` を追加。`reasonCode` がある場合、その終端ファミリーに属する必要があります。 |
| 送信メッセージ   | succeeded = `sent`、blocked = `suppressed` に `reasonCode` を追加、failed = `failed` に `errorCode` と `failureStage` を追加、unknown = `unknown` に `failureStage` を追加。 |

各アクティビティイベントには、安定したイベント ID、単調増加する台帳シーケンス、
ソースイベントシーケンス、タイムスタンプ、アクター、アクション、ステータス、整数の
`schemaVersion: 1`、および `redaction: "metadata_only"` が含まれます。実行レコードとツールレコードには
エージェントと実行の来歴が必要で、セッションの来歴を含めることもできます。メッセージ
レコードにはエージェント ID と実行 ID を含めることができますが、意図的に
`sessionKey` または `sessionId` は含まれません。そのため、`sessionKey` クエリフィルターは
実行行とツール行にのみ適用されます。ツールイベントには、ツール呼び出し ID とツール名を含めることができます。

メッセージレコードは `message.inbound.processed` または
`message.outbound.finished` を使用し、方向、チャネル、会話種別、
正規化された結果、および省略可能な配信種別、失敗段階、所要時間、
結果数、理由コード、さらにインストール環境内に限定された鍵付きの
アカウント、会話、メッセージ、ターゲットの仮名を追加します。これらの仮名は
相関に役立ちますが、匿名化ではありません。状態データベースにはそれらの鍵が含まれますが、
RPC および CLI のエクスポートには含まれません。台帳には、プロンプト、メッセージ本文、
ツール引数、ツール結果、コマンド出力、または生のエラーテキストは保存されません。
実行およびツールの `sessionKey` 値は生の相関メタデータとして保持され、
プラットフォームのアカウント ID またはピア ID を含む場合があります。メッセージレコードではセッションキーを省略します。

受信行では、`durationMs` はコアディスパッチからその終了状態までの時間を測定し、
`resultCount` は確定したキュー内のツール、ブロック、および返信ペイロードの数を示します。送信行では、
`durationMs` は配信の所有開始から確認応答、デッドレター化、または照合まで
（キューでの待機時間を含む）の期間を示し、`resultCount`
は識別された物理プラットフォームへの送信回数を示します。`deliveryKind` が存在する場合は、
フックとレンダリング後の実効ペイロードを表します。抑制された行、または
クラッシュにより結果が曖昧な行では省略されます。

現在のメッセージ対象範囲には、コアの重複／終了結果を含め、コア
ディスパッチに到達した受理済みの受信メッセージが含まれます。送信の対象範囲では、共有の永続的な
配信に到達した元の論理返信ペイロードごとに、終了行が1行書き込まれます。チャンク化と
アダプターのファンアウトは `resultCount` に集約されます。再試行可能なキュー内送信、または
結果が曖昧な送信は、確認応答、デッドレター化、または照合の後にのみ記録されます。それらの
共有境界を迂回する Plugin ローカルおよび直接送信の経路は、まだ対象外です。上限付きワーカーキューはベストエフォートであり、
障害時または飽和時に記録が失われる可能性があるため、このサーフェスは
欠損のないコンプライアンスアーカイブではありません。

記録はデフォルトで有効になっており、
[`audit.enabled`](/ja-JP/gateway/configuration-reference#audit) で制御されます。メッセージの記録は
`audit.messages` で個別に制御され、デフォルトは `"off"` です。
記録が無効になっている場合でも、`audit.activity.list` は以前に書き込まれたレコードが
期限切れになるまで提供し続けます。

出荷済みの `audit.list` のリクエスト、結果、および `AuditEvent` スキーマは
変更されておらず、エージェント実行とツールアクションのレコードのみを返します。新しいオペレーター
クライアントは、Gateway が `audit.activity.list` を通知している場合、それを呼び出す必要があります。古い
Gateway は、`unknown method: audit.activity.list` を報告する場合があります。また、出荷済みバージョンでは
メソッド検索より先に認可が行われていたため、読み取りスコープのリクエストに対して `missing scope:
operator.admin` を報告する場合もあります。後者は、そのメソッドが通知されていなかった場合に限り、
メソッドが存在しないものとして扱ってください。その後、クライアントは、フィルターがメッセージ種別、方向、
またはチャネルのサポートを必要としない場合に限り、`audit.list` を再試行できます。

テキストクエリと上限付きの JSON エクスポートには、[`openclaw audit`](/ja-JP/cli/audit) を使用してください。

## タスク台帳 RPC

オペレータークライアントは、タスク台帳 RPC（`packages/gateway-protocol/src/schema/tasks.ts`）を通じて、Gateway のバックグラウンドタスクレコードを確認およびキャンセルします。これらは生のランタイム状態ではなく、サニタイズされたタスク概要を返します。

- `tasks.list` には `operator.read` が必要です。
  - パラメーター: 省略可能な `status`（`"queued"`、`"running"`、`"completed"`、`"failed"`、`"cancelled"`、または `"timed_out"`）またはこれらのステータスの配列、省略可能な `agentId`、省略可能な `sessionKey`、`1` から `500` までの省略可能な `limit`、および省略可能な文字列 `cursor`。
  - 結果: `{ "tasks": TaskSummary[], "nextCursor"?: string }`。
- `tasks.get` には `operator.read` が必要です。
  - パラメーター: `{ "taskId": string }`。
  - 結果: `{ "task": TaskSummary }`。
  - 存在しないタスク ID に対しては、Gateway の not-found エラー形式が返されます。
- `tasks.cancel` には `operator.write` が必要です。
  - パラメーター: `{ "taskId": string, "reason"?: string }`。
  - 結果: `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`。
  - `found` は、台帳に一致するタスクがあったかどうかを示します。`cancelled` は、ランタイムがキャンセルを受け入れたか、またはキャンセルを記録したかどうかを示します。

`TaskSummary` には `id`、`status`、および省略可能なメタデータ（`kind`、`runtime`、`title`、`agentId`、`sessionKey`、`childSessionKey`、`ownerKey`、`runId`、`taskId`、`flowId`、`parentTaskId`、`sourceId`、タイムスタンプ、進行状況、終了時の概要、サニタイズされたエラーテキスト）が含まれます。`agentId` はタスクを実行するエージェントを識別し、`sessionKey` と `ownerKey` はリクエスターと制御のコンテキストを保持します。

## オペレーター用ヘルパーメソッド

- `commands.list`（`operator.read`）は、エージェントのランタイムコマンド一覧を取得します。
  - `agentId` は省略可能です。省略すると、デフォルトのエージェントワークスペースを読み取ります。
  - `scope` は、主要な `name` が対象とするサーフェスを制御します。`text` は、先頭の `/` を含まない主要なテキストコマンドトークンを返します。`native` とデフォルトの `both` パスは、利用可能な場合にプロバイダー対応のネイティブ名を返します。
  - `textAliases` には、`/model` や `/m` などの完全なスラッシュエイリアスが格納されます。
  - `nativeName` には、存在する場合にプロバイダー対応のネイティブコマンド名が格納されます。
  - `provider` は省略可能で、ネイティブの命名とネイティブPluginコマンドの可用性にのみ影響します。
  - `includeArgs=false` を指定すると、シリアライズされた引数メタデータがレスポンスから除外されます。
- `tools.catalog`（`operator.read`）は、エージェントのランタイムツールカタログを取得します。レスポンスには、グループ化されたツールと出自メタデータが含まれます。
  - `source`: `core` または `plugin`
  - `pluginId`: `source="plugin"` の場合のPlugin所有者
  - `optional`: Pluginツールが省略可能かどうか
- `tools.effective`（`operator.read`）は、セッションで実際に有効なランタイムツール一覧を取得します。
  - `sessionKey` は必須です。
  - Gatewayは、呼び出し元から提供された認証または配信コンテキストを受け入れる代わりに、サーバー側のセッションから信頼できるランタイムコンテキストを導出します。
  - レスポンスは、アクティブな一覧をセッション単位でサーバーが導出したプロジェクションであり、コア、Plugin、チャネル、および検出済みのMCPサーバーツールが含まれます。
  - `tools.effective` はMCPに対して読み取り専用です。ウォームなセッションのMCPカタログを最終的なツールポリシーに通して投影できますが、MCPランタイムの作成、トランスポートへの接続、`tools/list` の発行は行いません。一致するウォームカタログが存在しない場合、レスポンスには `mcp-not-yet-connected`、`mcp-not-yet-listed`、`mcp-stale-catalog` などの通知が含まれることがあります。
  - 有効なツールの各エントリでは、`source="core"`、`source="plugin"`、`source="channel"`、または `source="mcp"` を使用します。
- `tools.invoke`（`operator.write`）は、`/tools/invoke` と同じGatewayポリシーパスを介して、利用可能なツールを1つ呼び出します。
  - `name` は必須です。`args`、`sessionKey`、`agentId`、`confirm`、`idempotencyKey` は省略可能です。
  - `sessionKey` と `agentId` の両方が指定されている場合、解決されたセッションのエージェントは `agentId` と一致する必要があります。
  - `cron`、`gateway`、`nodes` などの所有者専用コアラッパーは、`tools.invoke` 自体が `operator.write` であっても、所有者/管理者ID（`operator.admin`）を必要とします。
  - レスポンスはSDK向けのエンベロープで、`ok`、`toolName`、省略可能な `output`、および型付きの `error` フィールドを含みます。承認またはポリシーによる拒否では、Gatewayのツールポリシーパイプラインを迂回せず、ペイロード内で `ok:false` が返されます。
- `skills.status`（`operator.read`）は、エージェントから参照可能なSkills一覧を取得します。
  - `agentId` は省略可能です。省略すると、デフォルトのエージェントワークスペースを読み取ります。
  - レスポンスには、生のシークレット値を公開することなく、適格性、不足している要件、設定チェック、サニタイズされたインストールオプションが含まれます。
- `skills.search` と `skills.detail`（`operator.read`）は、ClawHubの検出メタデータを返します。
- `skills.upload.begin`、`skills.upload.chunk`、`skills.upload.commit`（`operator.admin`）は、プライベートなskillアーカイブをインストール前にステージングします。これは信頼済みクライアント向けの独立した管理者アップロードパスであり、通常のClawHub skillインストールフローではありません。また、`skills.install.allowUploadedArchives` が有効でない限り、デフォルトでは無効です。
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })` は、そのslugとforce値に紐付けられたアップロードを作成します。
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` は、デコード後の正確なオフセットにバイト列を追加します。
  - `skills.upload.commit({ uploadId, sha256? })` は、最終的なサイズとSHA-256を検証します。コミットはアップロードを確定するだけで、skillはインストールしません。
  - アップロードされるskillアーカイブは、ルートに `SKILL.md` を含むzipアーカイブです。アーカイブ内部のディレクトリ名によってインストール先が選択されることはありません。
- `skills.install`（`operator.admin`）には3つのモードがあります。
  - ClawHubモード: `{ source: "clawhub", slug, version?, force? }` は、デフォルトのエージェントワークスペースの `skills/` ディレクトリにskillフォルダーをインストールします。
  - アップロードモード: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }` は、コミット済みのアップロードをデフォルトのエージェントワークスペースの `skills/<slug>` ディレクトリにインストールします。slugとforce値は、元の `skills.upload.begin` リクエストと一致する必要があります。`skills.install.allowUploadedArchives` が有効でない限り拒否されます。この設定はClawHubからのインストールには影響しません。
  - Gatewayインストーラーモード: `{ name, installId, timeoutMs? }` は、Gatewayホスト上で宣言済みの `metadata.openclaw.install` アクションを実行します。古いクライアントは引き続き `dangerouslyForceUnsafeInstall` を送信する場合があります。このフィールドは非推奨であり、プロトコル互換性のためにのみ受け入れられ、無視されます。オペレーターが管理するインストール判断には `security.installPolicy` を使用してください。
- `skills.update`（`operator.admin`）には2つのモードがあります。
  - ClawHubモードは、デフォルトのエージェントワークスペース内の追跡対象slugを1つ、または追跡対象のすべてのClawHubインストールを更新します。
  - 設定モードは、`enabled`、`apiKey`、`env` などの `skills.entries.<skillKey>` 値にパッチを適用します。

### `models.list` のビュー

`models.list` は、省略可能な `view` パラメーターを受け入れます
（`src/agents/model-catalog-visibility.ts`）。

- 省略または `"default"`: `agents.defaults.models` が設定されている場合、レスポンスは許可済みカタログとなり、`provider/*` エントリについて動的に検出されたモデルも含まれます。それ以外の場合、レスポンスはGatewayの完全なカタログとなります。
- `"configured"`: ピッカー向けの動作です。`agents.defaults.models` が設定されている場合は引き続きそれが優先され、`provider/*` エントリに対するプロバイダー単位の検出も含まれます。許可リストがない場合、レスポンスは明示的な `models.providers.<provider>.models` エントリを使用し、設定済みのモデル行が存在しない場合にのみ完全なカタログへフォールバックします。
- `"provider-config"`: ピッカーの許可リストとは独立した、ソースで定義された `models.providers.*.models` 一覧です。各行には公開モデルの機能とルート対応の可用性が含まれますが、プロバイダーのエンドポイント、認証情報、ランタイムリクエスト設定は除外されます。
- `"all"`: `agents.defaults.models` を迂回するGatewayの完全なカタログです。通常のモデルピッカーではなく、診断/検出UIに使用してください。

## Execの承認

- execリクエストに承認が必要な場合、Gatewayは `exec.approval.requested` をブロードキャストします。
- オペレータークライアントは `exec.approval.resolve` を呼び出して解決します（`operator.approvals` が必要です）。
- `host=node` の場合、`exec.approval.request` には `systemRunPlan`（正規化された `argv`/`cwd`/`rawCommand`/セッションメタデータ）を含める必要があります。`systemRunPlan` がないリクエストは拒否されます。
- 承認後、転送された `node.invoke system.run` 呼び出しは、その正規化された `systemRunPlan` を権威あるコマンド/cwd/セッションコンテキストとして再利用します。
- 呼び出し元が準備時から最終的に承認された `system.run` の転送までの間に `command`、`rawCommand`、`cwd`、`agentId`、または `sessionKey` を変更した場合、Gatewayは変更後のペイロードを信頼せず、実行を拒否します。

## エージェント配信のフォールバック

- `agent` リクエストには、外部配信を要求するために `deliver=true` を含めることができます。
- `bestEffortDeliver=false`（デフォルト）は厳格な動作を維持します。解決できない配信先または内部専用の配信先は `INVALID_REQUEST` を返します。
- `bestEffortDeliver=true` は、外部に配信可能なルートを解決できない場合（たとえば、内部/webchatセッションや複数チャネルの設定が曖昧な場合）に、セッション内のみの実行へのフォールバックを許可します。
- 配信が要求された場合、最終的な `agent` の結果には `result.deliveryStatus` が含まれることがあります。使用されるステータスは、[`openclaw agent --json --deliver`](/ja-JP/cli/agent#json-delivery-status) に記載されているものと同じ `sent`、`suppressed`、`partial_failed`、`failed` です。

## バージョニング

- `PROTOCOL_VERSION`、`MIN_CLIENT_PROTOCOL_VERSION`、`MIN_NODE_PROTOCOL_VERSION`、`MIN_PROBE_PROTOCOL_VERSION` は `packages/gateway-protocol/src/version.ts` にあります。
- クライアントは `minProtocol` + `maxProtocol` を送信します。オペレーターおよびUIクライアントは、その範囲に現在のプロトコルを含める必要があります。現在のクライアントとサーバーはプロトコルv4で動作します。
- `role: "node"` と `client.mode: "node"` の両方を持つ認証済みクライアントは、N-1のNodeプロトコル（現在はv3）を使用できます。軽量な再起動プローブも同じN-1の範囲を使用します。この互換性範囲によって、デバイス認証、ペアリング、スコープ、コマンドポリシー、exec承認が変更されることはありません。Pluginが所有するNodeの機能とコマンドは、そのホスト対象サーフェスがN-1契約に含まれないため、Nodeが現在のプロトコルにアップグレードされるまで提供されません。
- スキーマとモデルはTypeBox定義から生成されます。
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### クライアント定数

リファレンスクライアント実装は `packages/gateway-client/src/` にあります
（OpenClawは薄い `src/gateway/client.ts` ファサードを介してこれをラップします）。これらのデフォルト値はプロトコルv4全体で安定しており、サードパーティークライアントに期待される基準値です。

| 定数                                      | デフォルト                                            | ソース                                                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_NODE_PROTOCOL_VERSION`               | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_PROBE_PROTOCOL_VERSION`              | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| リクエストタイムアウト（RPC ごと）        | `30_000` ms                                           | `packages/gateway-client/src/client.ts`（`requestTimeoutMs`）                                                             |
| 事前認証／接続チャレンジのタイムアウト    | `15_000` ms                                           | `packages/gateway-client/src/timeouts.ts`（`OPENCLAW_HANDSHAKE_TIMEOUT_MS` 環境変数で、対応するサーバー／クライアントの時間枠を延長可能） |
| 初回再接続バックオフ                      | `1_000` ms                                            | `packages/gateway-client/src/client.ts`（`backoffMs`）                                                                    |
| 最大再接続バックオフ                      | `30_000` ms                                           | `packages/gateway-client/src/client.ts`（`scheduleReconnect`）                                                            |
| デバイストークンによる切断後の高速再試行の上限 | `250` ms                                         | `packages/gateway-client/src/client.ts`                                                                                   |
| `terminate()` 実行前の強制停止猶予        | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                           |
| `stopAndWait()` のデフォルトタイムアウト  | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                |
| デフォルトの tick 間隔（`hello-ok` 前）   | `30_000` ms                                           | `packages/gateway-client/src/client.ts`                                                                                   |
| tick タイムアウトによる切断               | 無通信時間が `tickIntervalMs * 2` を超えた場合、コード `4000` | `packages/gateway-client/src/client.ts`                                                                          |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                                                         |

サーバーは `hello-ok` で、有効な `policy.tickIntervalMs`、
`policy.maxPayload`、`policy.maxBufferedBytes` を通知します。クライアントは、
ハンドシェイク前のデフォルト値ではなく、これらの値に従う必要があります。

参照クライアントでは、保留中のすべてのリクエストに期限が設定されている場合、
有限時間のリクエストは設定された期限を使用します。有限の
`timeoutMs` がない `expectFinal` リクエスト、`timeoutMs: null` のリクエスト、
または有限時間と無制限のリクエストが混在する場合は、tick ウォッチドッグが
有効なままになります。受信イベントとレスポンスが tick タイムアウトの
しきい値を超えても到着しない場合、クライアントはコード `4000` でソケットを
閉じ、保留中のすべてのリクエストを拒否して再接続します。再接続後に、拒否された
リクエストを再実行することはありません。

## 認証

- 共有シークレットによる Gateway 認証では、設定された
  `gateway.auth.mode`（`"none" | "token" | "password" | "trusted-proxy"`）に応じて、
  `connect.params.auth.token` または `connect.params.auth.password` を使用します。
- Tailscale Serve（`gateway.auth.allowTailscale: true`）や、非ループバックの
  `gateway.auth.mode: "trusted-proxy"` など、ID 情報を伴うモードでは、
  `connect.params.auth.*` の代わりにリクエストヘッダーから接続認証チェックを
  満たします。
- プライベートイングレスでの `gateway.auth.mode: "none"` は、
  共有シークレットによる接続認証を完全にスキップします。このモードを
  パブリックまたは信頼されていないイングレスで公開しないでください。
- ペアリング後、Gateway は接続のロールとスコープに限定されたデバイストークンを
  発行し、`hello-ok.auth.deviceToken` で返します。クライアントは接続に
  成功するたびに、このトークンを永続化する必要があります。
- 保存されたデバイストークンで再接続する場合は、そのトークンについて保存された
  承認済みスコープセットも再利用する必要があります。これにより、すでに付与された
  読み取り／プローブ／ステータスアクセスを維持し、再接続時に暗黙の管理者専用
  スコープへ意図せず縮小されることを防ぎます。
- クライアント側の接続認証の組み立て（
  `packages/gateway-client/src/client.ts` の `selectConnectAuth`）：
  - `auth.password` は独立しており、設定されている場合は常に転送されます。
  - `auth.token` は次の優先順位で設定されます。最初に明示的な共有トークン、
    次に明示的な `deviceToken`、最後に保存済みのデバイスごとのトークン
    （`deviceId` と `role` をキーとする）です。
  - `auth.bootstrapToken` は、上記のいずれでも `auth.token` が解決されなかった
    場合にのみ送信されます。共有トークンまたは解決済みのデバイストークンが
    ある場合は送信されません。
  - 1 回限りの `AUTH_TOKEN_MISMATCH` 再試行で保存済みデバイストークンを自動昇格
    できるのは、信頼されたエンドポイントに限られます。対象はループバック、
    または `tlsFingerprint` がピン留めされた `wss://` です。ピン留めされていない
    パブリックな `wss://` は対象外です。
- 組み込みのセットアップコードによるブートストラップは、プライマリ Node の
  `hello-ok.auth.deviceToken` に加えて、信頼されたモバイル引き継ぎ用の
  制限付きオペレータートークンを `hello-ok.auth.deviceTokens` で返します。
  オペレータートークンにはネイティブ Talk 設定の読み取り用として
  `operator.talk.secrets` が含まれますが、ペアリング変更スコープと
  `operator.admin` は含まれません。
- ベースライン以外のセットアップコードによるブートストラップが承認を待っている間、
  `PAIRING_REQUIRED` の詳細には `recommendedNextStep: "wait_then_retry"`、
  `retryable: true`、`pauseReconnect: false` が含まれます。リクエストが承認されるか、
  トークンが無効になるまで、同じブートストラップトークンで再接続を続けてください。
- `hello-ok.auth.deviceTokens` を永続化するのは、`wss://` やループバック／ローカル
  ペアリングなどの信頼されたトランスポート上で、接続にブートストラップ認証を
  使用した場合に限ります。
- クライアントが明示的な `deviceToken` または明示的な `scopes` を指定した場合、
  呼び出し元が要求したスコープセットが引き続き優先されます。キャッシュ済みスコープは、
  クライアントが保存済みのデバイスごとのトークンを再利用する場合にのみ再利用されます。
- デバイストークンは `device.token.rotate` および `device.token.revoke` で
  ローテーション／失効できます（`operator.pairing` が必要）。Node またはその他の
  非オペレーターロールのローテーションや失効には、`operator.admin` も必要です。
- `device.token.rotate` はローテーションのメタデータを返します。置換後の
  Bearer トークンを返すのは、同じデバイストークンですでに認証された同一デバイスからの
  呼び出しに限られます。これにより、トークンのみを使用するクライアントは再接続前に
  置換トークンを永続化できます。共有トークン／管理者によるローテーションでは、
  Bearer トークンを返しません。
- トークンの発行、ローテーション、失効は、そのデバイスのペアリングエントリに記録された
  承認済みロールセットの範囲内に制限されます。トークンの変更によって、ペアリング承認で
  付与されていないデバイスロールへ範囲を拡大したり、そのロールを対象にしたりすることは
  できません。
- ペアリング済みデバイスのトークンセッションでは、呼び出し元が `operator.admin` も
  持っていない限り、デバイス管理は自己スコープに限定されます。管理者以外の呼び出し元が
  管理できるのは、自身のデバイスエントリのオペレータートークンのみです。Node および
  その他の非オペレータートークンの管理は、呼び出し元自身のデバイスであっても
  管理者専用です。
- `device.token.rotate` と `device.token.revoke` は、対象のオペレータートークンの
  スコープセットを、呼び出し元の現在のセッションスコープとも照合します。管理者以外の
  呼び出し元は、自身が現在保持しているものより広いスコープのオペレータートークンを
  ローテーションまたは失効できません。
- 認証失敗には、`error.details.code` と復旧のヒントが含まれます：
  - `error.details.canRetryWithDeviceToken`（真偽値）
  - `error.details.recommendedNextStep`：`retry_with_device_token`、
    `update_auth_configuration`、`update_auth_credentials`、
    `wait_then_retry`、`review_auth_configuration` のいずれか
    （`packages/gateway-protocol/src/connect-error-details.ts`）。
- `AUTH_TOKEN_MISMATCH` に対するクライアントの動作：
  - 信頼されたクライアントは、キャッシュ済みのデバイスごとのトークンを使用して、
    1 回に限った再試行を実行できます。
  - その再試行も失敗した場合は、自動再接続ループを停止し、オペレーターが実行すべき
    対応のガイダンスを表示します。
- `AUTH_SCOPE_MISMATCH` は、デバイストークンは認識されたものの、要求された
  ロール／スコープをカバーしていないことを意味します。これを不正なトークンとして
  表示しないでください。オペレーターに、再ペアリングするか、より狭い／広い
  スコープ契約を承認するよう促してください。

## デバイス ID とペアリング

- Node は、キーペアのフィンガープリントから導出した安定したデバイス ID
  （`device.id`）を含める必要があります。
- Gateway はデバイスとロールの組み合わせごとにトークンを発行します。
- ローカル自動承認が有効でない限り、新しいデバイス ID にはペアリング承認が必要です。
- ペアリングの自動承認は、直接の local loopback 接続を中心に行われます。
- OpenClaw には、信頼された共有シークレットのヘルパーフロー向けに、
  バックエンド／コンテナローカルの限定的な自己接続パスもあります。
- 同一ホストの tailnet または LAN 接続も、ペアリングでは引き続きリモートとして扱われ、
  承認が必要です。
- WS クライアントは通常、`connect` 時に `device` ID を含めます
  （オペレーターと Node）。デバイスなしのオペレーター接続が許可されるのは、
  次の明示的な信頼パスに限られます：
  - localhost 専用の非セキュア HTTP 互換性のための
    `gateway.controlUi.allowInsecureAuth=true`。
  - 成功した `gateway.auth.mode: "trusted-proxy"` によるオペレーター Control UI 認証。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
    （緊急用であり、セキュリティを大幅に低下させます）。
  - 予約済みの内部ヘルパーパス上で行う、直接ループバックの `gateway-client`
    バックエンド RPC。
- デバイス ID を省略すると、スコープに影響があります。明示的な信頼パスを介して
  デバイスなしのオペレーター接続が許可された場合でも、そのパスに名前付きの
  スコープ保持例外がない限り、OpenClaw は自己申告されたスコープを空のセットに
  クリアします。その後、スコープで保護されたメソッドは `missing scope` で失敗します。
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` は、Control UI の緊急用
  スコープ保持パスです。任意のカスタムバックエンドや CLI 形式の WebSocket
  クライアントにスコープを付与するものではありません。
- 予約済みの直接ループバック `gateway-client` バックエンドヘルパーパスがスコープを
  保持するのは、内部のローカルコントロールプレーン RPC に限られます。カスタム
  バックエンド ID には、この例外は適用されません。
- すべての接続は、サーバーが提供する `connect.challenge` nonce に署名する必要があります。

### デバイス認証の移行診断

チャレンジ導入前の署名動作をまだ使用しているレガシークライアントに対して、
`connect` は安定した `error.details.reason` とともに、`error.details.code` の下に
`DEVICE_AUTH_*` 詳細コードを返します。

一般的な移行失敗：

| メッセージ                  | details.code                     | details.reason           | 意味                                                         |
| --------------------------- | -------------------------------- | ------------------------ | ------------------------------------------------------------ |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | クライアントが `device.nonce` を省略した（または空で送信した）。 |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | クライアントが古い、または誤った nonce で署名した。          |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 署名ペイロードが v2 ペイロードと一致しない。                 |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 署名済みタイムスタンプが許容される時刻ずれの範囲外にある。   |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` が公開鍵のフィンガープリントと一致しない。        |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開鍵の形式または正規化に失敗した。                         |

移行先:

- 必ず `connect.challenge` を待つ。
- サーバーの nonce を含む v2 ペイロードに署名する。
- 同じ nonce を `connect.params.device.nonce` で送信する。
- 推奨される署名ペイロードは `v3`
  （`packages/gateway-client/src/device-auth.ts` の `buildDeviceAuthPayloadV3`）
  であり、device/client/role/scopes/token/nonce フィールドに加えて
  `platform` と `deviceFamily` もバインドする。
- 互換性のため、従来の `v2` 署名も引き続き受け入れられるが、再接続時の
  コマンドポリシーは、ペアリング済みデバイスのメタデータ固定によって引き続き制御される。

## TLS と証明書ピンニング

- WS 接続では TLS がサポートされる（`gateway.tls` 設定）。
- クライアントは必要に応じて、`gateway.remote.tlsFingerprint` または CLI の
  `--tls-fingerprint` を使用して Gateway 証明書のフィンガープリントを固定できる。

## スコープ

このプロトコルは、ステータス、チャンネル、モデル、チャット、
エージェント、セッション、ノード、承認など、Gateway API 全体を公開する。
正確な公開範囲は、`packages/gateway-protocol/src/schema.ts` から再エクスポートされる
TypeBox スキーマによって定義される。

## 関連項目

- [ブリッジプロトコル](/ja-JP/gateway/bridge-protocol)
- [Gateway 運用手順書](/ja-JP/gateway)
