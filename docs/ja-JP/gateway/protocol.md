---
read_when:
    - Gateway WebSocket クライアントの実装または更新
    - プロトコルの不一致や接続エラーのデバッグ
    - プロトコルスキーマ／モデルの再生成
summary: Gateway WebSocket プロトコル：ハンドシェイク、フレーム、バージョニング
title: Gateway プロトコル
x-i18n:
    generated_at: "2026-07-16T11:48:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4cc92cfed4cf1bcc7b9499d90eef9f9225a89c0e6a71bb6230bb416f8f6884b5
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS プロトコルは、OpenClaw の単一のコントロールプレーン兼 Node トランスポートです。オペレーターおよび Node クライアント（CLI、Web UI、macOS アプリ、iOS/Android Node、ヘッドレス Node）は WebSocket 経由で接続し、ハンドシェイク時に **ロール** と **スコープ** を宣言します。

## トランスポートとフレーミング

- WebSocket、テキストフレーム、JSON ペイロード。
- 最初のフレームは `connect` リクエストでなければなりません。
- 接続前のフレームは 64 KiB（`MAX_PREAUTH_PAYLOAD_BYTES`）に制限されます。ハンドシェイク後は、
  `hello-ok.policy.maxPayload` および
  `hello-ok.policy.maxBufferedBytes` に従います。診断が有効な場合、サイズ超過の
  受信フレームや低速な送信バッファでは、Gateway がフレームを閉じるか破棄する前に
  `payload.large` イベントが発行されます。これらのイベントには `surface`、バイト
  サイズ、上限、安全な理由コードが含まれますが、メッセージ本文、添付ファイルの
  内容、生のフレームバイト、トークン、Cookie、シークレットは決して含まれません。

フレーム形式：

- リクエスト：`{type:"req", id, method, params}`
- レスポンス：`{type:"res", id, ok, payload|error}`
- イベント：`{type:"event", event, payload, seq?, stateVersion?}`

副作用を伴うメソッドには冪等性キーが必要です（スキーマを参照）。

## ハンドシェイク

Gateway は接続前チャレンジを送信します：

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

クライアントは `connect` で応答します：

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

Gateway は `hello-ok` で応答します：

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

`server`、`features`、`snapshot`、`policy`、`auth` はすべて
`HelloOkSchema`（`packages/gateway-protocol/src/schema/frames.ts`）で必須です。`auth` は、
デバイストークンが発行されない場合でも、ネゴシエートされたロール／スコープを報告します（上記の形式）。
`pluginSurfaceUrls` は任意であり、Plugin サーフェス名（例：
`canvas`）をスコープ付きホスト URL にマッピングします。期限切れになる可能性があるため、Node は
新しいエントリを取得するために `{ "surface": "canvas" }` を指定して `node.pluginSurface.refresh` を呼び出します。
非推奨の `canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh`
パスはサポートされていません。Plugin サーフェスを使用してください。
スナップショットの任意の `appliedConfigHash` は、アクティブな Gateway ランタイムが受け入れた
解決済みソース設定のリビジョンです。クライアントはこれを
`config.get.configRevisionHash` と比較して、より新しく保存された設定にまだ
再起動が必要かどうかを判断できます。`config.get.hash` は、設定書き込みの競合ガードで使用される
生のルートファイルリビジョンのままです。

Gateway が起動時のサイドカーの完了処理中である間、`connect` は
`details.reason: "startup-sidecars"` および `retryAfterMs` を伴う、再試行可能な
`UNAVAILABLE` エラーを返すことがあります。これを終端的なハンドシェイク失敗として扱うのではなく、
接続予算内で再試行してください。

デバイストークンが発行される場合、`hello-ok.auth` に追加されます：

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

組み込みの QR／セットアップコードによるブートストラップは、モバイルへの引き継ぎパスです。
ベースラインのセットアップコードによる接続に成功すると、プライマリ Node トークンと、制限された
オペレータートークンが 1 つ返されます：

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

このオペレーターへの引き継ぎは意図的に制限されています。モバイルの
オペレーターループとネイティブセットアップを開始するには十分であり、Talk の
設定読み取り用の `operator.talk.secrets` も含まれますが、ペアリング変更スコープや `operator.admin` は含まれません。より広範な
ペアリング／管理者アクセスには、別途承認されたペアリングまたはトークンフローが必要です。
ブートストラップ認証が信頼されたトランスポート
（`wss://` またはループバック／ローカルペアリング）を経由した場合にのみ、
`hello-ok.auth.deviceTokens` を永続化してください。

信頼された同一プロセスのバックエンドクライアント（`client.id: "gateway-client"`、
`client.mode: "backend"`）は、共有 Gateway トークン／パスワードで認証する場合、直接ループバック接続で
`device` を省略できます。このパスは
内部コントロールプレーン RPC（例：サブエージェントのセッション更新）専用であり、
古い CLI／デバイスのペアリングベースラインによってローカルバックエンド処理が妨げられることを回避します。リモート、
ブラウザオリジン、Node、および明示的なデバイストークン／デバイス ID のクライアントには、引き続き
通常のペアリングとスコープ昇格チェックが適用されます。

### ワーカーロールと閉鎖型プロトコル

クラウドワーカーは、Gateway が所有し、ホストキーが固定された SSH トンネルを経由する
専用のループバックイングレスを使用します。このイングレスはワーカー ID のみを受け入れ、
汎用認証、Node イベント、オペレーター RPC、Plugin メソッドを決してディスパッチしません。厳格な `connect` は、
環境、バンドルハッシュ、所有者エポック、RPC セットバージョン、有効期限、および null 許容の 1 セッションに
紐付けられた、保存時ハッシュ化済みの短期認証情報を検証します。また、現在のバージョンと機能セットを
個別に確認します。成功すると最小限の `worker-hello-ok` が返されます。機能ネゴシエーションは
汎用プロトコルバージョンから独立しています。フレームは 64 KiB 未満に維持されますが、ネゴシエートされた
`worker.inference.start` フレームに限り、最大 25 MiB まで許可されます。閉鎖型許可リストには `worker.heartbeat`、
`worker.transcript.commit`、`worker.live-event`、`worker.inference.start`、
`worker.inference.cancel` が含まれます。

トランスクリプトのコミットでは、所有者エポックによるフェンシング、Gateway 所有のセッションバインディング、
ベースリーフの compare-and-swap、および永続的なシーケンス再生を使用します。Gateway は通常のセッションライターを通じて、
トランスクリプトエントリ ID と親 ID を生成します。各 RPC で所有権と
有効期限が再確認されます。

### クライアント機能

オペレータークライアントは、`connect.params.caps` で任意の機能を通知できます：

- `tool-events`：構造化されたツールライフサイクルイベントを受け入れます。
- `inline-widgets`：ホストされたインラインウィジェットのツール結果をレンダリングできます。

クライアント機能は接続されたクライアントについて記述するものであり、認可ではありません。エージェントツールは必要な機能を宣言できます。元のクライアントの `caps` にすべての要件が含まれていない限り、Gateway はそれらのツールを除外します。チャネル起点の実行には Gateway クライアント機能がないため、ツールポリシーで明示的に許可されていても、機能ゲート付きツールは使用できません。

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

Node は接続時に機能クレームを宣言します：

- `caps`：`camera`、`canvas`、`screen`、
  `location`、`voice`、`talk` などの上位カテゴリ。
- `commands`：呼び出し用のコマンド許可リスト。
- `permissions`：きめ細かな切り替え（例：`screen.record`、`camera.capture`）。

Gateway はこれらをクレームとして扱い、サーバー側の許可リストを適用します。

## ロールとスコープ

オペレータースコープの完全なモデル、承認時のチェック、共有シークレットの
セマンティクスについては、[オペレータースコープ](/ja-JP/gateway/operator-scopes)を参照してください。

ロール：

- `operator`：コントロールプレーンクライアント（CLI／UI／自動化）。
- `node`：機能ホスト（camera／screen／canvas／system.run）。
- `worker`：専用の閉鎖型ワーカープロトコル上のクラウド実行ホスト。

オペレータースコープ（`src/gateway/operator-scopes.ts`）、閉じた完全なセット：

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` を指定した `talk.config` には、`operator.talk.secrets`（または
`operator.admin`）が必要です。シークレットが含まれる場合、アクティブな Talk プロバイダーの
認証情報を `talk.resolved.config.apiKey` から読み取ります。`talk.providers.<id>.apiKey` は
ソース形式のままであり、SecretRef オブジェクトまたは墨消し済み文字列の場合があります。

Plugin が登録した Gateway RPC メソッドは独自のオペレータースコープを要求できますが、
次の予約済みコアプレフィックスは常に `operator.admin`
（`src/shared/gateway-method-policy.ts`）に解決されます：`config.*`、`exec.approvals.*`、
`wizard.*`、`update.*`。

メソッドスコープは最初のゲートにすぎません。`chat.send` を通じて到達する一部のスラッシュコマンドには、
より厳格なコマンドレベルのチェックが適用されます。永続的な `/config set` および
`/config unset` の書き込みには、より低いオペレータースコープをすでに保持している Gateway クライアントでも
`operator.admin` が必要です。

`node.pair.approve` には、保留中のリクエストで宣言された
`commands`（`src/infra/node-pairing-authz.ts`）に基づき、基本メソッドスコープ
（`operator.pairing`）に加えて承認時のスコープチェックがあります：

| 宣言されたコマンド                                                                                                            | 必要なスコープ                        |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| なし                                                                                                                          | `operator.pairing`                    |
| 通常のコマンド                                                                                                                | `operator.pairing` + `operator.write` |
| `system.run`、`system.run.prepare`、`system.which`、`browser.proxy`、`fs.listDir`、または `system.execApprovals.get/set` を含む | `operator.pairing` + `operator.admin` |

### Caps／コマンド／権限（Node）

Node は接続時に機能クレームを宣言します：

- `caps`：`camera`、`canvas`、`screen`、
  `location`、`voice`、`talk` などの上位機能カテゴリ。
- `commands`：呼び出し用のコマンド許可リスト。
- `permissions`：きめ細かな切り替え（例：`screen.record`、`camera.capture`）。

Gateway はこれらを**クレーム**として扱い、サーバー側の許可リストを適用します。
接続された Node は、接続または再接続に成功した後、`node.pluginTools.update` を使用して、エージェントから参照可能な任意の Plugin または MCP ツールの
記述子を公開できます。ヘッドレス Node ホストは、宣言的な MCP インベントリの
変更を適用するために再起動します。この更新メソッドが唯一の公開経路であり、Plugin ツール記述子は
`connect` のパラメーターでは受け付けられません。各記述子では、プロバイダーで安全に使用できるツール `name` を使用し、Node の現在のコマンド許可リストに含まれる
`command` を指定する必要があります。Gateway はペアリング済み Node からの記述子
メタデータを信頼し、承認済みコマンド
サーフェス外の記述子を除外し、Node の切断時に削除し、別の Node のカタログを変更しようとする
オペレーターの操作を拒否します。Node が公開した記述子を無視するには、`gateway.nodes.pluginTools.enabled: false`
を設定します。

接続された Node ホストは、完全なスキル置換カタログを
`node.skills.update` で公開します。この Node ロールのメソッドが Node のスキルを公開する唯一の
経路であり、スキルは `connect` のパラメーターでは受け付けられません。各記述子には、
安全な名前、説明、およびサイズ制限付きの `SKILL.md` コンテンツが含まれます。Gateway はその
コンテンツを通常の Skills ローダーで解析し、Node の接続中はエージェントのスキルスナップショットに
含め、切断時に削除します。Node が公開した Skills を無視するには、
`gateway.nodes.skills.enabled: false` を設定します。

## プレゼンス

- `system-presence` は、デバイス ID をキーとするエントリを返します。これには
  `deviceId`、`roles`、`scopes` が含まれるため、オペレーターと Node の両方として
  接続している場合でも、UI はデバイスごとに 1 行を表示できます。
- `node.list` には、任意の `lastSeenAtMs` と `lastSeenReason` が含まれます。接続中の
  Node は、理由 `connect` とともに現在の接続時刻を報告します。ペアリング済み Node は、
  信頼済み Node イベントを介して、永続的なバックグラウンドプレゼンスも報告できます。

ネイティブ macOS Node は、制限付きの入力アイドル時間を含む、認証済みの `node.presence.activity` イベントも
送信できます。Gateway は自身のクロックを使用してアクティビティのタイムスタンプを導出し、
最近接続された Mac を `node.list` および
`node.describe` を通じて公開し、読み取りスコープを持つクライアントに `node.presence` の更新をブロードキャストします。
選択、プライバシー、モデル
コンテキスト、通知ルーティングの動作については、[アクティブなコンピューターのプレゼンス](/ja-JP/nodes/presence)を参照してください。

### Node のバックグラウンド生存イベント

Node は、バックグラウンドウェイク中にペアリング済み Node が
生存していたことを、接続済みとしてマークせずに記録するため、`event: "node.presence.alive"` を指定して `node.event` を呼び出します。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` は閉じた列挙型です：`background`、`silent_push`、`bg_app_refresh`、
`significant_location`、`manual`、`connect`。不明な値は
`background`（`src/shared/node-presence.ts`）に正規化されます。このイベントが永続化されるのは、
認証済み Node デバイスセッションの場合のみです。デバイスなし、またはペアリングされていないセッションは
`handled: false` を返します。

成功した Gateway は、構造化された結果を返します。

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

古い Gateway は、`node.event` に対して `{ "ok": true }` のみを返す場合があります。これは、
永続的なプレゼンスの保存ではなく、RPC が受領されたものとして扱ってください。

## ブロードキャストイベントのスコープ

サーバーからプッシュされるブロードキャストイベントはスコープによって制限されるため、ペアリングスコープまたは Node 専用の
セッションがセッションコンテンツを受動的に受信することはありません
（`src/gateway/server-broadcast.ts`）。

- チャット、エージェント、およびツール結果のフレーム（ストリーミングされる `agent` イベント、ツール結果
  イベント）には、少なくとも `operator.read` が必要です。これを持たないセッションでは、これらの
  フレームは完全にスキップされます。
- Plugin が定義した `plugin.*` ブロードキャストは、デフォルトでは `operator.write` または
  `operator.admin` に制限されます。`plugin.approval.requested` /
  `plugin.approval.resolved` のような明示的なエントリでは、代わりに
  `operator.approvals` が使用されます。
- ステータス/トランスポートイベント（`heartbeat`、`presence`、`tick`、接続/切断の
  ライフサイクル）は制限されないため、認証済みのすべての
  セッションからトランスポートの健全性を確認できます。
- 不明なブロードキャストイベントファミリーは、登録済みハンドラーによって明示的に制限が緩和されない限り、
  デフォルトでスコープ制限されます（フェイルクローズ）。

各クライアント接続はクライアントごとに独自のシーケンス番号を保持するため、異なるクライアントが
イベントストリームの異なるスコープフィルター済みサブセットを参照する場合でも、ブロードキャストは
そのソケット上で単調な順序を維持します。

## RPC メソッドファミリー

`hello-ok.features.methods` は、
`src/gateway/server-methods-list.ts` と、読み込まれた Plugin/チャンネルメソッドの
エクスポートから構築される保守的な検出リストです。すべてのメソッドを生成して列挙したものではなく、一部のメソッド（たとえば
`push.test`、`web.login.start`、`web.login.wait`、`sessions.usage`）は、
実在し呼び出し可能なメソッドであっても、意図的に検出対象から除外されています。これは
`src/gateway/server-methods/*.ts` の完全な列挙ではなく、機能検出として扱ってください。

<AccordionGroup>
  <Accordion title="システムと ID">
    - `health` は、キャッシュ済みまたは新たにプローブした Gateway の健全性スナップショットを返します。
    - `diagnostics.stability` は、最近の制限付き診断安定性レコーダーを返します。これには、イベント名、件数、バイトサイズ、メモリ測定値、キュー/セッション状態、チャンネル/Plugin 名、セッション ID が含まれます。チャットテキスト、Webhook 本文、ツール出力、生のリクエスト/レスポンス本文、トークン、Cookie、シークレットは含まれません。`operator.read` が必要です。
    - `status` は、`/status` 形式の Gateway サマリーを返します。機密フィールドは管理者スコープを持つオペレータークライアントにのみ返されます。
    - `gateway.identity.get` は、リレーおよびペアリングフローで使用される Gateway デバイス ID を返します。
    - `system-presence` は、接続中のオペレーター/Node デバイスの現在のプレゼンススナップショットを返します。
    - `system-event` はシステムイベントを追加し、プレゼンスコンテキストを更新またはブロードキャストできます。
    - `last-heartbeat` は、永続化された最新の Heartbeat イベントを返します。
    - `set-heartbeats` は、Gateway での Heartbeat 処理を切り替えます。
    - `gateway.suspend.prepare` は、追跡対象の Gateway 作業がアイドル状態の場合にのみ、短時間の協調的サスペンドリースを作成します。`gateway.suspend.status` はそのリースを確認し、`gateway.suspend.resume` は復帰後または中止されたホスト操作の後にリースを解放します。

  </Accordion>

  <Accordion title="モデルと使用量">
    - `models.list` は、ランタイムで許可されているモデルカタログを返します。以下の「`models.list` ビュー」を参照してください。
    - `usage.status` は、プロバイダーの使用期間/残りクォータのサマリーを返します。
    - `usage.cost` は、日付範囲に対する集計済みコスト使用量サマリーを返します。1 つのエージェントには `agentId` を渡し、設定済みエージェントを集計するには `agentScope: "all"` を渡します。
    - `doctor.memory.status` は、アクティブなデフォルトエージェントワークスペースのベクトルメモリ/キャッシュ済み埋め込みの準備状態を返します。明示的にライブ埋め込みプロバイダーへ ping する場合にのみ、`{ "probe": true }` または `{ "deep": true }` を渡します。Dreaming ストアの統計を 1 つのエージェントワークスペースに限定するには `{ "agentId": "agent-id" }` を渡します。省略すると、設定済みの Dreaming ワークスペースが集計されます。
    - `doctor.memory.dreamDiary`、`doctor.memory.backfillDreamDiary`、`doctor.memory.resetDreamDiary`、`doctor.memory.resetGroundedShortTerm`、`doctor.memory.repairDreamingArtifacts`、`doctor.memory.dedupeDreamDiary` は、任意の `{ "agentId": "agent-id" }` を受け付けます。省略した場合、設定済みのデフォルトエージェントワークスペースを対象に動作します。
    - `doctor.memory.remHarness` は、リモートのコントロールプレーンクライアント向けに、制限付きの読み取り専用 REM ハーネスプレビューを返します。これには、ワークスペースパス、メモリスニペット、レンダリング済みの根拠付き Markdown、詳細な昇格候補が含まれます。`operator.read` が必要です。
    - `sessions.usage` は、セッションごとの使用量サマリーを返します。1 つのエージェントには `agentId` を渡し、設定済みエージェントをまとめて一覧表示するには `agentScope: "all"` を渡します。
      どちらの使用量メソッドも、夏時間を考慮した暦日の境界とバケットのために、IANA `timeZone` を指定した `mode: "specific"` を受け付けます。`utcOffset` は、古いクライアント向け、および Gateway ランタイムが要求されたゾーンを認識しない場合のフォールバックとして、引き続きサポートされます。
    - `sessions.usage.timeseries` は、1 つのセッションの時系列使用量を返します。
    - `sessions.usage.logs` は、1 つのセッションの使用量ログエントリを返します。

  </Accordion>

  <Accordion title="チャンネルとログインヘルパー">
    - `channels.status` は、組み込みおよびバンドル済みのチャンネル/Plugin ステータスサマリーを返します。
    - `channels.logout` は、チャンネルが対応している場合、指定したチャンネル/アカウントからログアウトします。
    - `web.login.start` は、現在の QR 対応 Web チャンネルプロバイダーの QR/Web ログインフローを開始します。
    - `web.login.wait` は、そのフローの完了を待機し、成功するとチャンネルを開始します。
    - `push.test` は、登録済み iOS Node にテスト用 APNs プッシュを送信します。
    - `voicewake.get` は、保存されているウェイクワードトリガーを返します。
    - `voicewake.set` は、ウェイクワードトリガーを更新し、変更をブロードキャストします。

  </Accordion>

  <Accordion title="Plugin 管理">
    - `plugins.list`（`operator.read`）は、インストール済み Plugin のインベントリに加えて、ローカルで選定された公式候補、診断情報、および現在のインストールモードで変更が許可されているかどうかを返します。
    - `plugins.search`（`operator.read`）は、インストール可能な ClawHub コード Plugin およびバンドル Plugin のファミリーを検索します。空でない `query` と、任意の 1～100 の `limit` を渡します。
    - `plugins.install`（`operator.admin`）は、`{ source: "official", pluginId }` を指定した公式カタログエントリ、または `{ source: "clawhub", packageName, version?, acknowledgeClawHubRisk? }` を指定した ClawHub パッケージのいずれかをインストールします。ClawHub のインストールでは、Gateway の信頼性、整合性、インストールポリシーのチェックが維持されます。インストールに成功した場合、Gateway の再起動が必要です。
    - `plugins.setEnabled`（`operator.admin`）は、`{ pluginId, enabled }` を使用して、インストール済み Plugin 1 つの有効化ポリシーを変更します。レスポンスには、更新されたカタログエントリ、再起動メタデータ、およびスロット選択に関する警告が含まれます。
    - `plugins.uninstall`（`operator.admin`）は、`{ pluginId }` を使用して、外部からインストールされた Plugin 1 つを削除します。対象は、設定参照、インストール記録、管理対象ファイルです。バンドル済み Plugin はアンインストールできず、無効化のみ可能です。レスポンスには削除アクションが一覧表示され、常に Gateway の再起動が必要です。

  </Accordion>

  <Accordion title="メッセージングとログ">
    - `send` は、チャットランナー外でチャンネル/アカウント/スレッドを対象として送信するための、直接のアウトバウンド配信 RPC です。
    - `logs.tail` は、カーソル/上限および最大バイト数の制御とともに、設定済み Gateway ファイルログの末尾を返します。

  </Accordion>

  <Accordion title="オペレーター端末">
    - `terminal.open` は、明示的な `agentId` またはデフォルトのエージェント用にホスト PTY を起動し、解決済みのエージェント、作業ディレクトリ、シェル、制限状態を返します。
    - `terminal.input`、`terminal.resize`、`terminal.close` は、呼び出し元の接続が所有するセッションに対してのみ動作します。
    - `terminal.upload` は最大 16 MiB の base64 ファイルを 1 つ受け取り、セッションの Gateway またはペアリング済み Node ホスト上にある非公開の 24 時間一時ディレクトリへ配置し、絶対パスを返します。呼び出し元は、そのパスを引き続き貼り付けるなどして使用する必要があります。RPC が端末入力を書き込んだり、コマンドを実行したりすることはありません。
    - `terminal.data` および `terminal.exit` イベントは、セッションを所有する接続にのみストリーミングされます。
    - 接続が切断されたセッションは終了されず、デタッチされます。最近の出力が容量制限付きのサーバー側バッファに蓄積される間、`gateway.terminal.detachedSessionTimeoutSeconds`（デフォルトは 300。`0` は切断時の終了を復元します）にわたって再アタッチ可能な状態を維持します。
    - `terminal.list` はアタッチ可能なセッションを返します。`terminal.attach` は実行中またはデタッチ済みのセッションを呼び出し元の接続に再バインドし、リプレイバッファを返します（tmux 方式の引き継ぎです。以前の実行中の所有者は、理由 `detached` とともに `terminal.exit` を受信します）。`terminal.text` はアタッチせずにバッファをプレーンテキストとして読み取ります。
    - すべての端末メソッドには `operator.admin` が必要です。`gateway.terminal.enabled` は明示的に true にする必要があります。完全にサンドボックス化されたエージェントは拒否され、エージェントポリシーが変更されると、デタッチ済みのものを含む既存および処理中の PTY が閉じられます。

  </Accordion>

  <Accordion title="Talk と TTS">
    - `talk.catalog` は、音声、ストリーミング文字起こし、リアルタイム音声用の読み取り専用 Talk プロバイダーカタログを返します。これには、正規プロバイダー ID、レジストリエイリアス、ラベル、設定状態、オプションのグループレベル `ready` 結果、公開されたモデル／音声 ID、正規モード、トランスポート、ブレイン戦略、リアルタイム音声／機能フラグが含まれますが、プロバイダーのシークレットを返したり、グローバル設定を変更したりすることはありません。現在の Gateway は、ランタイムプロバイダーの選択を適用した後に `ready` を設定します。古い Gateway でこれが存在しない場合は、未検証として扱ってください。
    - `talk.config` は有効な Talk 設定ペイロードを返します。`includeSecrets` には `operator.talk.secrets`（または `operator.admin`）が必要です。
    - `talk.session.create` は、`realtime/gateway-relay`、`transcription/gateway-relay`、または `stt-tts/managed-room` 用に Gateway 所有の Talk セッションを作成します。`stt-tts/managed-room` の場合、`sessionKey` を渡す `operator.write` 呼び出し元は、スコープ付きセッションキーの可視性を得るために `spawnedBy` も渡す必要があります。スコープなしの `sessionKey` の作成および `brain: "direct-tools"` には `operator.admin` が必要です。
    - `talk.session.join` は管理対象ルームのセッショントークンを検証し、必要に応じて `session.ready` または `session.replaced` を発行して、ルーム／セッションのメタデータと最近の Talk イベントを返します。平文トークンやそのハッシュを返すことはありません。
    - `talk.session.appendAudio` は、base64 PCM 入力音声を Gateway 所有のリアルタイムリレーおよび文字起こしセッションに追加します。
    - `talk.session.startTurn`、`talk.session.endTurn`、`talk.session.cancelTurn` は、状態をクリアする前に古いターンを拒否しながら、管理対象ルームのターンライフサイクルを制御します。
    - `talk.session.cancelOutput` はアシスタントの音声出力を停止します。主に Gateway リレーセッションで、VAD によって制御される割り込みに使用されます。
    - `talk.session.submitToolResult` は、Gateway 所有のリアルタイムリレーセッションによって発行されたプロバイダーツール呼び出しを完了します。リクエストは、プロバイダーブリッジが公開する非同期完了シグナルがあれば、それを待機します。送信に失敗した場合、リンクされた実行はアクティブなままとなり、成功を示すツール結果イベントは発行されません。中間ツール出力には `options: { willContinue: true }` を渡します。プロバイダーブリッジが抑制サポートを通知しており、結果によって別の応答を開始すべきでない場合は `options: { suppressResponse: true }` を渡します。
    - `talk.session.steer` は、Gateway 所有のエージェントバックエンド Talk セッションに、アクティブな実行の音声制御を送信します：`{ sessionId, text, mode? }`。ここで `mode` は `status`、`steer`、`cancel`、または `followup` です。モードを省略すると、発話テキストから分類されます。
    - `talk.session.close` は、Gateway 所有のリレー、文字起こし、または管理対象ルームのセッションを閉じ、終了 Talk イベントを発行します。
    - `talk.mode` は、WebChat／Control UI クライアント向けに現在の Talk モード状態を設定／ブロードキャストします。
    - `talk.client.create` は、Gateway が設定、認証情報、指示、ツールポリシーを所有する一方で、`webrtc` または `provider-websocket` を使用してクライアント所有のリアルタイムプロバイダーセッションを作成します。
    - `talk.client.toolCall` により、クライアント所有のリアルタイムトランスポートは、プロバイダーツール呼び出しを Gateway ポリシーへ転送できます。最初にサポートされるツールは `openclaw_agent_consult` です。クライアントは実行 ID を取得し、通常のチャットライフサイクルイベントを待ってから、プロバイダー固有のツール結果を送信します。
    - `talk.client.steer` は、クライアント所有のリアルタイムトランスポート向けに、アクティブな実行の音声制御を送信します。Gateway は `sessionKey` からアクティブな埋め込み実行を解決し、誘導を黙って破棄する代わりに、受理／拒否を示す構造化された結果を返します。
    - `talk.event` は、リアルタイム、文字起こし、STT／TTS、管理対象ルーム、電話、会議アダプターに共通する単一の Talk イベントチャネルです。
    - `talk.speak` は、アクティブな Talk 音声プロバイダーを通じて音声を合成します。
    - `tts.status` は、TTS の有効状態、アクティブなプロバイダー、フォールバックプロバイダー、プロバイダー設定状態を返します。
    - `tts.providers` は、表示可能な TTS プロバイダー一覧を返します。
    - `tts.enable` および `tts.disable` は、TTS 設定状態を切り替えます。
    - `tts.setProvider` は、優先 TTS プロバイダーを更新します。
    - `tts.convert` は、1 回限りのテキスト読み上げ変換を実行します。
    - `tts.speak`（`operator.write`）は、空でない `text` を設定済みの汎用 TTS プロバイダーチェーンでレンダリングし、クリップ全体を `audioBase64` としてインラインで返します。さらに `provider` と、オプションの `outputFormat`、`mimeType`、`fileExtension` メタデータも返します。`tts.convert` とは異なり、Gateway ローカルのパスは返しません。`talk.speak` とは異なり、Talk プロバイダーは必要ありません。`messages.tts.maxTextLength` を超えるテキストでは `INVALID_REQUEST` が返され、合成に失敗すると `UNAVAILABLE` が返されます。

  </Accordion>

  <Accordion title="シークレット、設定、更新、ウィザード">
    - `secrets.reload` はアクティブな SecretRef を再解決し、すべて成功した場合にのみランタイムのシークレット状態を入れ替えます。
    - `secrets.resolve` は、特定のコマンド／ターゲットセットに対するコマンドターゲットのシークレット割り当てを解決します。
    - `config.get` は、現在のディスク上の設定スナップショット、ルートファイルの生の `hash`、解決済みの `configRevisionHash`、およびアクティブな Gateway ランタイムが受理した解決済みリビジョンのオプションの `appliedConfigHash` を返します。
    - `config.set` は、検証済みの設定ペイロードを書き込みます。
    - `config.patch` は、部分的な設定更新をマージします。破壊的な配列置換では、影響を受けるパスを `replacePaths` に含める必要があります。配列要素内のネストされた配列では、`agents.list[].skills` のような `[]` パスを使用します。
    - `config.apply` は、設定ペイロード全体を検証して置換します。
    - `config.schema` は、Control UI および CLI ツールが使用するライブ設定スキーマペイロードを返します。これには、スキーマ、`uiHints`、バージョン、生成メタデータ、読み込み可能な場合は Plugin とチャネルのスキーマメタデータが含まれます。また、フィールドのドキュメントが一致する場合、UI と同じラベル／ヘルプテキストから取得した `title`／`description` メタデータも含まれ、ネストされたオブジェクト、ワイルドカード、配列要素、`anyOf`／`oneOf`／`allOf` の合成分岐にも対応します。
    - `config.schema.lookup` は、1 つの設定パスに対するパススコープの検索ペイロードを返します。これには、正規化されたパス、浅いスキーマノード、一致したヒントと `hintPath`、オプションの `reloadKind`、UI／CLI のドリルダウン用の直下の子要素概要が含まれます。`reloadKind` は `restart`、`hot`、または `none`（`src/config/schema.ts`）のいずれかであり、要求されたパスに対する Gateway 設定リロードプランナーを反映します。検索スキーマノードは、ユーザー向けドキュメントと共通の検証フィールド（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、数値／文字列／配列／オブジェクトの境界、`additionalProperties`、`deprecated`、`readOnly`、`writeOnly`）を保持します。子要素の概要では、`key`、正規化された `path`、`type`、`required`、`hasChildren`、オプションの `reloadKind`、さらに一致した `hint`／`hintPath` を公開します。
    - `update.run` は Gateway の更新フローを実行し、更新に成功した場合にのみ再起動をスケジュールします。セッションを持つ呼び出し元は `continuationMessage` を含めることができ、起動時に再起動継続キューを通じて後続のエージェントターンを 1 回再開できます。コントロールプレーンからのパッケージマネージャー更新および監視対象の Git チェックアウト更新では、稼働中の Gateway 内でパッケージツリーを置換したり、チェックアウト／ビルド出力を変更したりせず、デタッチされた管理対象サービスへの引き継ぎを使用します。開始された引き継ぎは、`result.reason: "managed-service-handoff-started"` および `handoff.status: "started"` とともに `ok: true` を返します。利用できない、または失敗した引き継ぎは、`managed-service-handoff-unavailable` または `managed-service-handoff-failed` とともに `ok: false` を返し、手動のシェル更新が必要な場合は `handoff.command` も返します。「利用できない」とは、systemd の `OPENCLAW_SYSTEMD_UNIT` など、OpenClaw に安全なスーパーバイザー境界または永続的なサービス ID がないことを意味します。開始された引き継ぎの間、再起動センチネルは一時的に `stats.reason: "restart-health-pending"` を報告する場合があります。継続処理は、CLI が再起動後の Gateway を検証し、最終的な `ok` センチネルを書き込むまで遅延されます。
    - `update.status` は最新の更新再起動センチネルを更新して返します。利用可能な場合は、再起動後に実行中のバージョンも含まれます。
    - `wizard.start`、`wizard.next`、`wizard.status`、`wizard.cancel` は、WS RPC 経由でオンボーディングウィザードを公開します。

  </Accordion>

  <Accordion title="エージェントとワークスペースのヘルパー">
    - `agents.list` は、有効なモデルとランタイムのメタデータを含む、設定済みのエージェントエントリを返します。
    - `agents.create`、`agents.update`、および `agents.delete` は、エージェントレコードとワークスペースの接続を管理します。
    - `agents.files.list`、`agents.files.get`、および `agents.files.set` は、エージェントに公開されるブートストラップワークスペースファイルを管理します。
    - `audit.activity.list` は、バージョン管理されたメタデータのみのアクティビティ台帳を返します。`audit.list` は、引き続き互換性を安全に維持する実行／ツール RPC です。
    - `agents.workspace.list` および `agents.workspace.get`（`operator.read`）は、[オペレーターのスコープ](/ja-JP/gateway/operator-scopes)で説明されている信頼済みオペレータードメイン内のクライアントに対し、エージェントのワークスペースディレクトリを読み取り専用かつページ分割して閲覧できるようにします。リクエストではワークスペース相対パスのみを受け付けます。読み取りは実体パスを解決したワークスペースルート内に限定され（シンボリックリンクおよびハードリンクによる脱出は拒否されます）、サイズ上限が適用され、UTF-8 テキストと一般的な画像形式（base64）のみに制限されます。レスポンスでホスト上のワークスペースパスが公開されることはありません。この名前空間に書き込み操作はありません。
    - `tasks.list`、`tasks.get`、および `tasks.cancel` は、SDK とオペレータークライアントに Gateway のタスク台帳を公開します。以下の[タスク台帳 RPC](#task-ledger-rpcs)を参照してください。
    - `artifacts.list`、`artifacts.get`、および `artifacts.download` は、明示的な `sessionKey`、`runId`、または `taskId` スコープについて、トランスクリプトから生成されたアーティファクトの概要とダウンロードを公開します。実行およびタスクのクエリでは、所有するセッションがサーバー側で解決され、来歴が一致するトランスクリプトメディアのみが返されます。安全でない URL またはローカル URL のソースについては、サーバー側で取得せず、サポート対象外のダウンロードとして返します。
    - `environments.list` および `environments.status` は、Gateway ローカル環境と Node 環境の検出を維持します。設定済みのクラウドワーカーと、以前のプロファイルが残した永続レコードには、`providerId`、省略可能な `leaseId`、`state`、`ageMs`、省略可能な `idleMs`、および `attachedSessionIds` を含む `worker` メタデータが追加されます。ワーカーのライフサイクル状態は、`requested`、`provisioning`、`bootstrapping`、`ready`、`attached`、`idle`、`draining`、`destroying`、`destroyed`、`failed`、および `orphaned` です。
    - `environments.create`（`{ profileId, idempotencyKey }`）は、設定済みの Plugin プロバイダープロファイルからワーカーをプロビジョニングします。同じキーで再試行すると、永続化された操作が再利用されます。`environments.destroy`（`{ environmentId }`）は、永続ワーカー環境のべき等な破棄をリクエストします。どちらも `operator.admin` を必要とするコントロールプレーンの書き込みであり、ステータスレスポンスと同じ形式の環境概要を返します。
    - `agent.identity.get` は、エージェントまたはセッションに対して有効なアシスタント ID を返します。
    - `agent.wait` は、実行の終了を待機し、利用可能な場合は終了時のスナップショットを返します。

  </Accordion>

  <Accordion title="セッション制御">
    - `sessions.list` は、エージェントランタイムバックエンドが設定されている場合の行ごとの `agentRuntime` メタデータを含む、現在のセッションインデックスを返します。クラウドワーカー配置が有効な場合、または永続的な復旧状態が存在する場合、セッション行にはクローズされた `placement` 状態（`local`、`requested`、`provisioning`、`syncing`、`starting`、`active`、`draining`、`reconciling`、`reclaimed`、または `failed`）に加え、状態固有の環境、所有者エポック、ワークスペース、バンドル、ACK カーソル、または復旧フィールドも含まれます。
    - `sessions.subscribe` および `sessions.unsubscribe` は、現在の WS クライアントに対するセッション変更イベントの購読を切り替えます。
    - `sessions.messages.subscribe` および `sessions.messages.unsubscribe` は、1 つのセッションに対するトランスクリプト／メッセージイベントの購読を切り替えます。`includeApprovals: true` を渡すと、永続化された対象にそのセッションが正確に含まれ、かつレビュー担当者のバインディングによって購読クライアントが承認されている承認について、サニタイズ済みの `session.approval` ライフサイクルイベントも受信します。その場合、購読レスポンスには上限付きの保留中 `approvalReplay` が含まれ、`truncated` が false のときはこれが信頼できる情報源となります。オプトインは購読呼び出しごとに適用され、維持されません。同じセッションを `includeApprovals: true` なしで再購読すると、既存の承認購読が削除されます。通常のセッション読み取り権限に加えて、このオプトインには `operator.admin`、またはペアリング済みデバイス上の `operator.approvals` が必要です。
    - `sessions.preview` は、指定されたセッションキーに対する上限付きのトランスクリプトプレビューを返します。
    - `sessions.describe` は、完全に一致するセッションキーに対して 1 つの Gateway セッション行を返します。
    - `sessions.resolve` は、セッションターゲットを解決または正規化します。
    - `sessions.create` は、新しいセッションエントリを作成します。省略可能な `model` および `thinkingLevel` の値は、初期モデルと推論のオーバーライドをアトミックに永続化します。`worktree: true` は管理対象ワークツリーをプロビジョニングします。省略可能な `worktreeBaseRef`/`worktreeName` でベース参照とブランチ名を選択し、`execNode`（`operator.admin`）でセッションの実行を Node ホストにバインドします。作成されたワークツリーは結果に反映され、セッション行（`worktree: { id, branch, repoRoot }`）に永続化されます。エントリは作成されたものの、ネストされた初期 `chat.send` が拒否された場合、成功結果には `runStarted: false` と `runError` が含まれます。クライアントはプロンプトを保持し、返されたセッションキーに対して再試行できます。
    - `sessions.dispatch`（`operator.admin`）は、セッション所有の管理対象ワークツリーを持つ既存のローカル OpenClaw セッションを、設定済みのクラウドワーカープロファイルへ移動します。`{ key, profileId, agentId? }` を渡します。ワーカープロファイルが設定されていない場合、このメソッドは存在しません。アクティブな作業をドレインする前にローカルターンの受付を停止し、配置が `active` のワーカー所有状態に到達した後にのみ返ります。ディスパッチは一方向であり、ワーカーからローカルへの引き戻しはこの RPC に含まれません。
    - `sessions.groups.list`、`sessions.groups.put`、`sessions.groups.rename`、および `sessions.groups.delete` は、Gateway が所有するカスタムセッショングループのカタログ（名前と表示順）を管理します。所属情報は各セッションの `category` フィールドに保持されます。名前変更と削除では、メンバーセッションがサーバー側で更新されます。
    - `sessions.send` は、既存のセッションにメッセージを送信します。
    - `sessions.steer` は、アクティブなセッションに対する中断および方向修正のバリアントです。
    - `sessions.abort` は、セッションのアクティブな作業を中止します。`key` と省略可能な `runId`、または Gateway がセッションに解決できるアクティブな実行の場合は `runId` のみを渡します。
    - `sessions.patch` は、セッションのメタデータ／オーバーライドを更新し、解決された正規モデルと有効な `agentRuntime` を報告します。
    - `sessions.reset`、`sessions.delete`、および `sessions.compact` は、セッションのメンテナンスを実行します。
    - `sessions.get` は、保存されている完全なセッション行を返します。
    - チャットの実行では、引き続き `chat.history`、`chat.send`、`chat.abort`、および `chat.inject` を使用します。`chat.history` は UI クライアント向けに表示用正規化が行われます。インラインディレクティブタグは表示テキストから除去され、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロック）と漏洩した ASCII／全角のモデル制御トークンは除去され、無音トークンのみのアシスタント行（`NO_REPLY` / `no_reply` と完全に一致）は省略され、サイズ超過の行はプレースホルダーに置き換えられる場合があります。
    - `chat.message.get` は、表示可能な単一のトランスクリプトエントリに対する、追加的な上限付き完全メッセージリーダーです。`sessionKey`、セッション選択がエージェントスコープの場合は省略可能な `agentId`、および以前に `chat.history` を通じて公開されたトランスクリプトの `messageId` を渡します。保存されたエントリが引き続き利用可能でサイズ超過でない場合、Gateway は軽量な履歴切り詰め上限を適用せず、同じ表示用正規化済みプロジェクションを返します。
    - `chat.toolTitles` は、Control UI に表示されるツール呼び出しの短い目的タイトルを返します（バッチ処理、入力に上限を設けた最大 24 項目）。この機能は `gateway.controlUi.toolTitles`（デフォルトはオフ）でオプトインします。無効化された Gateway はモデルを呼び出さずに `{ titles: {}, disabled: true }` と応答するため、クライアントは問い合わせを停止します。有効な場合、タイトルは標準のユーティリティモデルルーティングを使用します。明示的に設定された `utilityModel`（すべてのユーティリティタスクと同様に、上限付きのタスク内容を選択したプロバイダーへ送信する可能性があるオペレーター判断）があればそれを使用し、なければセッションプロバイダーが宣言した小規模モデルのデフォルトを使用するため、新しい送信先が暗黙に追加されることはありません。空の `utilityModel` を指定すると完全に無効になります。タイトルがプライマリモデルへフォールバックすることはありません。結果はツール名と入力をキーとしてエージェントごとの状態データベースにキャッシュされるため、同じ表示を繰り返しても同一の呼び出しに再課金されることはありません。
    - `chat.send` は、1 ターン限りの `fastMode: "auto"` を受け付け、自動カットオフ前に開始されたモデル呼び出しでは高速モードを使用し、その後に開始される再試行、フォールバック、ツール結果、または継続の呼び出しでは高速モードを使用しません。カットオフはデフォルトで 60 秒（`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`）であり、`agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` を使用してモデルごとに設定できます。`chat.send` の呼び出し元は、1 ターン限りの `fastAutoOnSeconds` を渡して、そのリクエストのカットオフをオーバーライドできます。`queueMode`（`steer`、`followup`、`collect`、または `interrupt`）を渡すと、このリクエストに限り保存済みのキューモードをオーバーライドできます。明示的な Control UI の方向修正アクションでは `queueMode: "steer"` を使用します。

  </Accordion>

  <Accordion title="デバイスのペアリングとデバイストークン">
    - `device.pair.list` は、保留中および承認済みのペアリング済みデバイスを返します。
    - `device.pair.setupCode` は、モバイルセットアップコードと、デフォルトでは PNG QR データ URL を作成します。これには `operator.admin` が必要であり、意図的に公開される検出情報から除外されています。結果には、`setupCode`、省略可能な `qrDataUrl`、`gatewayUrl`、秘密情報ではない `auth` ラベル、および `urlSource` が含まれます。
    - `device.pair.approve`、`device.pair.reject`、および `device.pair.remove` は、デバイスペアリングレコードを管理します。
    - `device.pair.rename` は、クライアントから報告された表示名より優先され、デバイスの修復または再承認後も維持されるオペレーターラベル（`{ deviceId, label }`）を割り当てます。
    - `device.token.rotate` は、承認済みのロールと呼び出し元のスコープ範囲内で、ペアリング済みデバイスのトークンをローテーションします。
    - `device.token.revoke` は、承認済みのロールと呼び出し元のスコープ範囲内で、ペアリング済みデバイスのトークンを失効させます。

    セットアップコードには、有効期間の短いブートストラップ認証情報が埋め込まれています。クライアントは、
    ペアリングフローを超えてこれをログに記録したり永続化したりしてはなりません。

  </Accordion>

  <Accordion title="Node のペアリング、呼び出し、保留中の作業">
    - `node.pair.list`、`node.pair.approve`、`node.pair.reject`、および `node.pair.remove` は、Node のケイパビリティ承認を扱います。`node.pair.request` と `node.pair.verify` は、スタンドアロンの Node ペアリングストアとともに 2026.7 で削除されました。保留中のリクエストは、Node の接続時に Gateway によって作成されます。
    - `node.list` と `node.describe` は、既知または接続済みの Node の状態を返します。
    - `node.rename` は、ペアリング済み Node のラベルを更新します。
    - `node.invoke` は、接続済み Node にコマンドを転送します。
    - `node.invoke.result` は、呼び出しリクエストの結果を返します。
    - `mcp.tools.call.v1` は、設定済みの Node ローカル MCP ツールを呼び出すためのヘッドレス Node ホストコマンドです。これは `node.invoke` を介して伝送され、Node がそのコマンドを宣言している必要があり、引き続きペアリング承認と `gateway.nodes.denyCommands` の対象となります。
    - `node.event` は、Node から発生したイベントを Gateway に戻します。
    - `node.pluginTools.update` は、接続済み Node のエージェントから参照可能な Plugin/MCP ツール記述子を置き換える唯一の公開経路です。`connect` のパラメータにはこれらは含まれません。
    - `node.pending.pull` と `node.pending.ack` は、接続済み Node のキュー API です。
    - `node.pending.enqueue` と `node.pending.drain` は、オフラインまたは切断済みの Node に対する永続的な保留中作業を管理します。

  </Accordion>

  <Accordion title="承認ファミリー">
    - `approval.get` と `approval.resolve` は、種類に依存しない永続的な承認メソッドです（スコープは `operator.approvals`）。`approval.get` は、安定した `urlPath` を持つ、サニタイズ済みの保留中または保持された終端プロジェクションを返します。`approval.resolve` は、正規の承認 ID、明示的な `kind`、および決定を受け取り、最初の回答を優先する解決を適用し、記録された正規の結果を常に返します。
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list`、および `exec.approval.resolve` は、単発の exec 承認リクエストと、保留中の承認の検索および再生を扱います。これらは、同じ永続的な承認レジストリに対するプロトコル境界アダプターです。
    - `exec.approval.waitDecision` は、1 件の保留中の exec 承認を待機し、最終決定を返します（タイムアウト時は `null`）。
    - `exec.approvals.get` と `exec.approvals.set` は、Gateway の exec 承認ポリシーのスナップショットを管理します。
    - `exec.approvals.node.get` と `exec.approvals.node.set` は、Node リレーコマンドを介して Node ローカルの exec 承認ポリシーを管理します。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision`、および `plugin.approval.resolve` は、Plugin 定義の承認フローを扱います。

  </Accordion>

  <Accordion title="自動化、Skills、ツール">
    - 自動化: `wake` は、即時または次回の Heartbeat でウェイクテキストを挿入するようスケジュールします。`cron.get`、`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` は、スケジュールされた作業を管理します。
    - `cron.run` は、手動実行用のエンキュー形式 RPC として引き続き使用されます。完了セマンティクスが必要なクライアントは、返された `runId` を読み取り、`cron.runs` をポーリングする必要があります。
    - `cron.runs` は、省略可能な空でない `runId` フィルターを受け取ります。これにより、クライアントは同じジョブの他の履歴エントリと競合することなく、キューに入れられた 1 件の手動実行を追跡できます。
    - Skills とツール: `commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。以下の[オペレーター用ヘルパーメソッド](#operator-helper-methods)を参照してください。

  </Accordion>
</AccordionGroup>

### 共通イベントファミリー

- `chat`: `chat.inject` などの UI チャット更新、およびトランスクリプト専用のその他のチャット
  イベント。プロトコル v4 では、差分ペイロードに `deltaText` が含まれます。`message` は引き続き
  累積的なアシスタントスナップショットです。接頭辞ではない置換では
  `replace=true` が設定され、置換テキストとして `deltaText` が使用されます。
- `session.message`、`session.operation`、`session.tool`: 購読中のセッションに対するトランスクリプト、実行中の
  セッション操作、およびイベントストリームの更新。
- `session.approval`: 明示的にオプトインした完全一致セッションの購読者に対する、サニタイズ済みの保留中および
  終端の承認情報。子承認では、永続化された祖先のオーディエンスを使用します。イベントが
  トランスクリプトを変更したり、エージェントを起動したりすることはありません。
- `sessions.changed`: セッションのインデックスまたはメタデータが変更されました。
- `presence`: システムのプレゼンススナップショットの更新。
- `tick`: 定期的なキープアライブ/生存確認イベント。
- `health`: Gateway の健全性スナップショットの更新。
- `heartbeat`: Heartbeat イベントストリームの更新。
- `cron`: Cron 実行/ジョブ変更イベント。
- `shutdown`: Gateway のシャットダウン通知。
- `node.pair.requested` / `node.pair.resolved`: Node ペアリングのライフサイクル。
- `node.invoke.request`: Node 呼び出しリクエストのブロードキャスト。
- `device.pair.requested` / `device.pair.resolved`: ペアリング済みデバイスのライフサイクル。
- `voicewake.changed`: ウェイクワードトリガー設定が変更されました。
- `exec.approval.requested` / `exec.approval.resolved`: exec 承認の
  ライフサイクル。
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin 承認の
  ライフサイクル。

### Node ヘルパーメソッド

Node は `skills.bins` を呼び出して、自動許可チェック用の現在の Skill 実行可能ファイル一覧を
取得できます。

## 監査台帳 RPC

`audit.activity.list` は、エージェント実行、ツールアクション、およびオプトインされたメッセージのライフサイクルメタデータについて、
新しいものから順に安定して表示できるビューをオペレータークライアントに提供します。これには
`operator.read` が必要です。クエリでは 30 日より古いレコードが除外され、共有
SQLite 台帳の上限は 100,000 レコードです。期限切れの行は、
Gateway の起動時、1 時間ごとのメンテナンス時、およびその後の書き込み時に削除されます。データモデルとプライバシーのセマンティクスについては、
[監査履歴](/ja-JP/gateway/audit)を参照してください。

- パラメータ: 省略可能な完全一致の `agentId`、`sessionKey`、または `runId`。省略可能な `kind`
  （`"agent_run"`、`"tool_action"`、または `"message"`）。省略可能な `status`
  （`"started"`、`"succeeded"`、`"failed"`、`"cancelled"`、`"timed_out"`、
  `"blocked"`、または `"unknown"`）。省略可能なメッセージ `direction`（`"inbound"` または
  `"outbound"`）および完全一致の `channel`。省略可能な包括的 `after` / `before`
  Unix ミリ秒境界。`1` から `500` までの省略可能な `limit`。および前のページから取得した省略可能な
  文字列 `cursor`。
- 結果: `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`。

名前付きの V1 結果ユニオンには、エージェント実行、ツールアクション、受信メッセージ、
送信メッセージ用の個別のスキーマがあります。`eventType` 判別子は、それぞれ
`agent_run`、`tool_action`、`inbound_message`、または `outbound_message` です。`kind` と
メッセージ `direction` は、フィルタリングと表示に引き続き使用できます。すべてのイベントには
整数の `schemaVersion: 1` があります。メッセージ ID の参照では、正確な
`hmac-sha256:v1:<32 hex key id>:<64 hex digest>` 形式を使用します。チャネル送信者のアクター
ID も同じ形式を使用します。

すべてのバリアントで、`eventType`、`schemaVersion`、`eventId`、`sequence`、
`sourceSequence`、`occurredAt`、`kind`、`action`、`status`、`actor`、および
`redaction` が必須です。バリアントのフィールドは次のとおりです。

| `eventType`        | 必須フィールド                                                   | 省略可能なフィールド                                                                                                                 |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `agent_run`        | `agentId`、`runId`; `kind: "agent_run"`                           | `sessionKey`、`sessionId`、`errorCode`                                                                                          |
| `tool_action`      | `agentId`、`runId`; `kind: "tool_action"`                         | `sessionKey`、`sessionId`、`toolCallId`、`toolName`、`errorCode`                                                                |
| `inbound_message`  | `direction: "inbound"`、`channel`、`conversationKind`、`outcome`  | `agentId`、`runId`、`durationMs`、`resultCount`、ID 参照、`reasonCode`、`errorCode`                                 |
| `outbound_message` | `direction: "outbound"`、`channel`、`conversationKind`、`outcome` | `agentId`、`runId`、`durationMs`、`resultCount`、ID 参照、`reasonCode`、`deliveryKind`、`failureStage`、`errorCode` |

閉じたメッセージ列挙型は次のとおりです。

- `conversationKind`: `direct`、`group`、`channel`、または `unknown`。
- 受信 `outcome`: `completed`、`skipped`、または `failed`。省略可能な
  `reasonCode`: `duplicate`、`reply_operation_active`、
  `reply_operation_aborted`、`fast_abort`、`plugin_bound_handled`、
  `plugin_bound_unavailable`、`plugin_bound_declined`、`plugin_bound_error`、
  `before_dispatch_handled`、`acp_dispatch_completed`、`acp_dispatch_failed`、
  `acp_dispatch_empty`、または `acp_dispatch_aborted`。
- 送信 `outcome`: `sent`、`suppressed`、`failed`、または `unknown`。省略可能な
  `reasonCode`: `cancelled_by_message_sending_hook`、
  `cancelled_by_reply_payload_sending_hook`、
  `empty_after_message_sending_hook`、`empty_after_reply_payload_sending_hook`、
  または `no_visible_payload`。プラットフォーム ID を返さないアダプターは
  `unknown` です。これは、外部での副作用がなかったことを証明できないためです。
- `deliveryKind`: `text`、`media`、または `other`。`failureStage`:
  `platform_send`、`queue`、または `unknown`。

終端フィールドには相関関係があり、それぞれ独立して省略可能ではありません。

| バリアント          | 終端マッピング                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| エージェント実行        | `started` には `errorCode` がありません。成功以外の各完了ステータスには、それに対応する `run_*` コードが必要です。                                                                 |
| ツールアクション      | `started` および成功には `errorCode` がありません。それ以外の各完了ステータスには、それに対応する `tool_*` コードが必要です。                                                       |
| 受信メッセージ  | 成功 = `completed`。ブロック = `skipped`。失敗 = `failed` と `message_processing_failed`。`reasonCode` が存在する場合、その終端ファミリーに属している必要があります。 |
| 送信メッセージ | 成功 = `sent`。ブロック = `suppressed` と `reasonCode`。失敗 = `failed`、`errorCode`、および `failureStage`。不明 = `unknown` と `failureStage`。      |

各アクティビティイベントには、安定したイベント ID、単調増加する台帳シーケンス、
ソースイベントシーケンス、タイムスタンプ、アクター、アクション、ステータス、整数の
`schemaVersion: 1`、および `redaction: "metadata_only"` が含まれます。実行レコードとツールレコードには
エージェントおよび実行の来歴が必要であり、セッションの来歴が含まれる場合もあります。メッセージ
レコードにはエージェント ID と実行 ID が含まれる場合がありますが、意図的に
`sessionKey` または `sessionId` が含まれることはありません。そのため、`sessionKey` クエリフィルターは
実行行とツール行にのみ適用されます。ツールイベントには、ツール呼び出し ID とツール名が含まれる場合があります。

メッセージレコードは `message.inbound.processed` または
`message.outbound.finished` を使用し、方向、チャネル、会話種別、
正規化された結果、および任意で配信種別、失敗段階、所要時間、
結果数、理由コード、インストール環境固有のキーによる
アカウント／会話／メッセージ／送信先の仮名を追加します。これらの仮名は
相関分析に役立ちますが、匿名化ではありません。状態データベースにはそのキーが
含まれますが、RPC および CLI のエクスポートには含まれません。台帳には、プロンプト、メッセージ
本文、ツール引数、ツール結果、コマンド出力、または生のエラーテキストは保存されません。
実行／ツールの `sessionKey` 値は生の相関メタデータのままであり、
プラットフォームのアカウント ID またはピア ID が埋め込まれる可能性があります。メッセージレコードではセッションキーが省略されます。

受信行では、`durationMs` はコアディスパッチからその終端までを測定し、
`resultCount` は確定したキュー内のツール、ブロック、および返信ペイロードを数えます。
送信行では、`durationMs` は配信の所有開始から確認応答、
デッドレター、または調整まで（キュー内の待機時間を含む）の範囲を表し、`resultCount` は
識別された物理的なプラットフォーム送信数を数えます。`deliveryKind` が存在する場合は、
フックとレンダリング後の実効ペイロードを記述します。抑制された行または
クラッシュにより曖昧な行では省略されます。

現在のメッセージ対象範囲には、コアの重複／終端結果を含め、
コアディスパッチに到達した受理済み受信メッセージが含まれます。送信の対象範囲では、
共有の永続的配信に到達した元の論理返信ペイロードごとに
1 つの終端行を書き込みます。チャンク分割とアダプターのファンアウトは `resultCount` に集約されます。キューに入れられた
再試行可能または曖昧な送信は、確認応答、デッドレター、または
調整の後にのみ記録されます。これらの共有境界を迂回する
Plugin ローカルおよび直接送信の経路は、まだ対象外です。制限付きワーカーキューはベストエフォートであり、
障害または飽和時にレコードが破棄される可能性があるため、このサーフェスは
損失のないコンプライアンスアーカイブではありません。

記録はデフォルトで有効であり、
[`audit.enabled`](/ja-JP/gateway/configuration-reference#audit) で制御されます。メッセージ記録は
`audit.messages` で個別に制御され、デフォルトは `"off"` です。
記録が無効な場合でも、`audit.activity.list` は以前に書き込まれたレコードを
期限切れになるまで提供し続けます。

リリース済みの `audit.list` リクエスト、結果、および `AuditEvent` スキーマは
変更されておらず、エージェント実行およびツールアクションのレコードのみを返します。新しいオペレーター
クライアントは、Gateway が通知している場合に `audit.activity.list` を呼び出す必要があります。古い
Gateway は、読み取りスコープのリクエストに対し、`unknown method: audit.activity.list`、または
リリース済みバージョンでは認可がメソッド検索より先に行われていたため、`missing scope:
operator.admin` のいずれかを報告する場合があります。後者をメソッドが存在しないものとして
扱うのは、そのメソッドが通知されていなかった場合に限ります。その後、クライアントは、フィルターが
メッセージ種別、方向、またはチャネルのサポートを必要としない場合に限り、`audit.list` を再試行できます。

テキストクエリと制限付き JSON エクスポートには [`openclaw audit`](/ja-JP/cli/audit) を使用します。

## タスク台帳 RPC

オペレータークライアントは、タスク台帳 RPC（`packages/gateway-protocol/src/schema/tasks.ts`）を通じて
Gateway のバックグラウンドタスクレコードを検査およびキャンセルします。これらは
生のランタイム状態ではなく、サニタイズ済みのタスク概要を返します。

- `tasks.list` には `operator.read` が必要です。
  - パラメーター: 任意の `status`（`"queued"`、`"running"`、`"completed"`、
    `"failed"`、`"cancelled"`、または `"timed_out"`）もしくはこれらのステータスの配列、
    任意の `agentId`、任意の `sessionKey`、`1` から
    `500` までの任意の `limit`、および任意の文字列 `cursor`。
  - 結果: `{ "tasks": TaskSummary[], "nextCursor"?: string }`。
- `tasks.get` には `operator.read` が必要です。
  - パラメーター: `{ "taskId": string }`。
  - 結果: `{ "task": TaskSummary }`。
  - 存在しないタスク ID に対しては、Gateway の未検出エラー形式が返されます。
- `tasks.cancel` には `operator.write` が必要です。
  - パラメーター: `{ "taskId": string, "reason"?: string }`。
  - 結果: `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`。
  - `found` は、台帳に一致するタスクがあったかどうかを示します。`cancelled` は、
    ランタイムがキャンセルを受理または記録したかどうかを示します。

`TaskSummary` には、`id`、`status`、および任意のメタデータである `kind`、
`runtime`、`title`、`agentId`、`sessionKey`、`childSessionKey`、`ownerKey`、
`runId`、`taskId`、`flowId`、`parentTaskId`、`sourceId`、タイムスタンプ、進捗、
終端概要、およびサニタイズ済みのエラーテキストが含まれます。`agentId` はタスクを
実行するエージェントを識別します。`sessionKey` と `ownerKey` は、リクエスト元および制御の
コンテキストを保持します。

## オペレーター向けヘルパーメソッド

- `commands.list`（`operator.read`）は、エージェントのランタイムコマンド一覧を
  取得します。
  - `agentId` は任意です。デフォルトのエージェントワークスペースを読み取る場合は省略します。
  - `scope` は、プライマリ `name` が対象とするサーフェスを制御します。`text` は
    先頭の `/` を除いたプライマリテキストコマンドトークンを返します。`native` と
    デフォルトの `both` 経路は、利用可能な場合にプロバイダー対応のネイティブ名を返します。
  - `textAliases` は、`/model` や `/m` などの正確なスラッシュエイリアスを保持します。
  - `nativeName` は、存在する場合にプロバイダー対応のネイティブコマンド名を保持します。
  - `provider` は任意であり、ネイティブ命名とネイティブ Plugin
    コマンドの可用性にのみ影響します。
  - `includeArgs=false` は、シリアル化された引数メタデータをレスポンスから省略します。
- `tools.catalog`（`operator.read`）は、エージェントのランタイムツールカタログを
  取得します。レスポンスには、グループ化されたツールと来歴メタデータが含まれます。
  - `source`: `core` または `plugin`
  - `pluginId`: `source="plugin"` の場合の Plugin 所有者
  - `optional`: Plugin ツールが任意かどうか
- `tools.effective`（`operator.read`）は、セッションのランタイムで有効なツール
  一覧を取得します。
  - `sessionKey` は必須です。
  - Gateway は、呼び出し元が提供した認証または配信コンテキストを受け入れるのではなく、
    サーバー側のセッションから信頼済みランタイムコンテキストを導出します。
  - レスポンスは、アクティブな一覧をサーバー側で導出したセッションスコープの
    プロジェクションであり、コア、Plugin、チャネル、および検出済みの MCP
    サーバーツールが含まれます。
  - `tools.effective` は MCP に対して読み取り専用です。ウォーム状態のセッション MCP
    カタログを最終的なツールポリシーを通じて投影する場合がありますが、MCP ランタイムの作成、
    トランスポートへの接続、または `tools/list` の発行は行いません。一致するウォーム状態のカタログが
    存在しない場合、レスポンスに `mcp-not-yet-connected`、
    `mcp-not-yet-listed`、または `mcp-stale-catalog` などの通知が含まれる場合があります。
  - 実効ツールエントリは、`source="core"`、`source="plugin"`、
    `source="channel"`、または `source="mcp"` を使用します。
- `tools.invoke`（`operator.write`）は、`/tools/invoke` と同じ
  Gateway ポリシー経路を通じて、利用可能なツールを 1 つ呼び出します。
  - `name` は必須です。`args`、`sessionKey`、`agentId`、`confirm`、および
    `idempotencyKey` は任意です。
  - `sessionKey` と `agentId` の両方が存在する場合、解決されたセッションエージェントは
    `agentId` と一致する必要があります。
  - `cron`、`gateway`、`nodes` などの所有者専用コアラッパーには、
    `tools.invoke` 自体が `operator.write` であっても、
    所有者／管理者のアイデンティティ（`operator.admin`）が必要です。
  - レスポンスは、`ok`、`toolName`、任意の
    `output`、および型付き `error` フィールドを持つ SDK 向けエンベロープです。承認またはポリシーによる拒否は、
    Gateway のツールポリシーパイプラインを迂回せず、ペイロード内で
    `ok:false` を返します。
- `skills.status`（`operator.read`）は、エージェントに表示される Skills 一覧を
  取得します。
  - `agentId` は任意です。デフォルトのエージェントワークスペースを読み取る場合は省略します。
  - レスポンスには、生のシークレット値を公開することなく、適格性、不足している要件、設定チェック、
    およびサニタイズ済みのインストールオプションが含まれます。
- `skills.search` と `skills.detail`（`operator.read`）は、ClawHub の
  検出メタデータを返します。
- `skills.upload.begin`、`skills.upload.chunk`、および `skills.upload.commit`
  （`operator.admin`）は、インストール前に非公開 Skills アーカイブをステージングします。これは
  信頼済みクライアント向けの独立した管理者アップロード経路であり、通常の ClawHub
  Skills インストールフローではありません。また、
  `skills.install.allowUploadedArchives` が有効でない限り、デフォルトで無効です。
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    は、そのスラッグと強制値に紐づくアップロードを作成します。
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` は、
    デコード後の正確なオフセットにバイトを追加します。
  - `skills.upload.commit({ uploadId, sha256? })` は、最終サイズと
    SHA-256 を検証します。コミットはアップロードを確定するだけで、Skills をインストールしません。
  - アップロードされる Skills アーカイブは、`SKILL.md` ルートを含む zip アーカイブです。
    アーカイブ内のディレクトリ名によってインストール先が選択されることはありません。
- `skills.install`（`operator.admin`）には 3 つのモードがあります。
  - ClawHub モード: `{ source: "clawhub", slug, version?, force? }` は、
    Skills フォルダーをデフォルトのエージェントワークスペースの `skills/` ディレクトリにインストールします。
  - アップロードモード: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    は、コミット済みのアップロードをデフォルトのエージェントワークスペースの
    `skills/<slug>` ディレクトリにインストールします。スラッグと強制値は、
    元の `skills.upload.begin` リクエストと一致する必要があります。
    `skills.install.allowUploadedArchives` が有効でない限り拒否されます。この設定は
    ClawHub のインストールには影響しません。
  - Gateway インストーラーモード: `{ name, installId, timeoutMs? }` は、Gateway ホスト上で宣言済みの
    `metadata.openclaw.install` アクションを実行します。古いクライアントは
    引き続き `dangerouslyForceUnsafeInstall` を送信する場合があります。このフィールドは非推奨であり、
    プロトコル互換性のためにのみ受け入れられ、無視されます。
    オペレーターが所有するインストール判断には `security.installPolicy` を使用します。
- `skills.update`（`operator.admin`）には 2 つのモードがあります。
  - ClawHub モードは、デフォルトのエージェントワークスペースにある追跡対象の 1 つのスラッグ、
    または追跡対象のすべての ClawHub インストールを更新します。
  - 設定モードは、`enabled`、
    `apiKey`、`env` などの `skills.entries.<skillKey>` 値にパッチを適用します。

### `models.list` ビュー

`models.list` は任意の `view` パラメーター
（`src/agents/model-catalog-visibility.ts`）を受け入れます。

- 省略時または `"default"`：`agents.defaults.models` が設定されている場合、
  応答は許可されたカタログとなり、`provider/*` エントリについて
  動的に検出されたモデルも含まれます。それ以外の場合、応答は Gateway の
  完全なカタログとなります。
- `"configured"`：ピッカー向けの動作です。`agents.defaults.models` が
  設定されている場合は引き続きそちらが優先され、`provider/*` エントリの
  プロバイダー単位の検出も含まれます。許可リストがない場合、応答は明示的な
  `models.providers.<provider>.models` エントリを使用し、設定済みのモデル行が
  1 件も存在しない場合にのみ完全なカタログへフォールバックします。
- `"provider-config"`：ソースで定義された `models.providers.*.models` インベントリであり、
  ピッカーの許可リストから独立しています。各行には公開モデルの機能と
  ルートを考慮した可用性が含まれますが、プロバイダーのエンドポイント、認証情報、
  およびランタイムのリクエスト設定は含まれません。
- `"all"`：`agents.defaults.models` を迂回する、Gateway の完全なカタログです。
  通常のモデルピッカーではなく、診断／検出 UI に使用します。

## Exec の承認

- Exec リクエストに承認が必要な場合、Gateway は
  `exec.approval.requested` をブロードキャストします。
- オペレータークライアントは `exec.approval.resolve` を呼び出して解決します
  （`operator.approvals` が必要です）。
- `host=node` の場合、`exec.approval.request` には `systemRunPlan`
  （正規の `argv`/`cwd`/`rawCommand`/セッションメタデータ）を含める必要があります。
  `systemRunPlan` がないリクエストは拒否されます。
- 承認後、転送される `node.invoke system.run` 呼び出しでは、その正規の
  `systemRunPlan` が信頼できるコマンド／cwd／セッションコンテキストとして再利用されます。
- 準備から最終的に承認された `system.run` の転送までの間に、
  呼び出し元が `command`、`rawCommand`、`cwd`、`agentId`、または
  `sessionKey` を変更した場合、Gateway は変更されたペイロードを信頼せず、
  実行を拒否します。

## エージェント配信のフォールバック

- `agent` リクエストには、外部への配信を要求する `deliver=true` を含められます。
- `bestEffortDeliver=false`（デフォルト）は厳格な動作を維持します。解決できない配信先、または
  内部専用の配信先の場合は `INVALID_REQUEST` を返します。
- `bestEffortDeliver=true` を使用すると、外部に配信可能なルートを解決できない場合
  （たとえば、内部／Web チャットセッションや、複数チャネルの設定が曖昧な場合）に、
  セッション内のみの実行へフォールバックできます。
- 配信が要求された場合、最終的な `agent` の結果には `result.deliveryStatus` が
  含まれることがあります。このとき、[`openclaw agent --json --deliver`](/ja-JP/cli/agent#json-delivery-status) に
  記載されているものと同じ `sent`、`suppressed`、`partial_failed`、
  および `failed` のステータスが使用されます。

## バージョニング

- `PROTOCOL_VERSION`、`MIN_CLIENT_PROTOCOL_VERSION`、
  `MIN_NODE_PROTOCOL_VERSION`、および `MIN_PROBE_PROTOCOL_VERSION` は
  `packages/gateway-protocol/src/version.ts` にあります。
- クライアントは `minProtocol` と `maxProtocol` を送信します。オペレーターおよび UI クライアントは、
  その範囲に現在のプロトコルを含める必要があります。現在のクライアントとサーバーは
  プロトコル v4 で動作します。
- `role: "node"` と `client.mode: "node"` の両方を持つ認証済みクライアントは、
  N-1 Node プロトコル（現在は v3）を使用できます。軽量な再起動プローブも
  同じ N-1 の範囲を使用します。この互換性範囲によって、デバイス認証、ペアリング、
  スコープ、コマンドポリシー、および Exec の承認が変更されることはありません。Plugin が所有する
  Node の機能とコマンドは、そのホスト対象サーフェスが N-1 契約の一部ではないため、
  Node が現在のプロトコルにアップグレードされるまで提供されません。
- スキーマとモデルは TypeBox 定義から生成されます：
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### クライアント定数

リファレンスクライアントの実装は `packages/gateway-client/src/` にあります
（OpenClaw は薄い `src/gateway/client.ts` ファサードを介してこれをラップします）。これらの
デフォルト値はプロトコル v4 を通じて安定しており、サードパーティークライアントに
想定されるベースラインです。

| 定数                                      | デフォルト                                            | ソース                                                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_NODE_PROTOCOL_VERSION`               | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_PROBE_PROTOCOL_VERSION`              | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| リクエストタイムアウト（RPC ごと）        | `30_000` ms                                           | `packages/gateway-client/src/client.ts`（`requestTimeoutMs`）                                                              |
| 事前認証／接続チャレンジのタイムアウト    | `15_000` ms                                           | `packages/gateway-client/src/timeouts.ts`（`OPENCLAW_HANDSHAKE_TIMEOUT_MS` 環境変数で、ペアリングされたサーバー／クライアントの時間枠を延長可能） |
| 再接続の初期バックオフ                    | `1_000` ms                                            | `packages/gateway-client/src/client.ts`（`GATEWAY_RECONNECT_POLICY`）                                                      |
| 再接続の最大バックオフ                    | `30_000` ms                                           | `packages/gateway-client/src/client.ts`（`GATEWAY_RECONNECT_POLICY`）                                                      |
| デバイストークンによる切断後の高速再試行上限 | `250` ms                                              | `packages/gateway-client/src/client.ts`                                                                                   |
| `terminate()` 前の強制停止猶予       | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                           |
| `stopAndWait()` のデフォルトタイムアウト | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                |
| デフォルトの Tick 間隔（`hello-ok` 前） | `30_000` ms                                           | `packages/gateway-client/src/client.ts`                                                                                   |
| Tick タイムアウトによる切断               | 無通信時間が `tickIntervalMs * 2` を超えるとコード `4000` | `packages/gateway-client/src/client.ts`                                                                                   |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024`（25 MB）                            | `src/gateway/server-constants.ts`                                                                                         |

サーバーは実効値の `policy.tickIntervalMs`、
`policy.maxPayload`、および `policy.maxBufferedBytes` を `hello-ok` で通知します。クライアントは
ハンドシェイク前のデフォルト値ではなく、これらの値に従う必要があります。

リファレンスクライアントでは、保留中のすべてのリクエストに期限が設定されている場合、
有限のリクエストが設定済みの期限を自身で管理します。有限の
`timeoutMs` がない `expectFinal` リクエスト、`timeoutMs: null` を持つリクエスト、
または有限リクエストと無期限リクエストの混在がある場合、Tick ウォッチドッグは有効なままとなります。
受信イベントと応答が Tick タイムアウトのしきい値を超えても途絶えたままの場合、クライアントは
コード `4000` でソケットを切断し、保留中のすべてのリクエストを拒否して再接続します。
再接続後に拒否されたリクエストを再実行することはありません。

## 認証

- 共有シークレットによる Gateway 認証では、設定された
  `gateway.auth.mode`（`"none" | "token" | "password" | "trusted-proxy"`）に応じて、`connect.params.auth.token` または
  `connect.params.auth.password` を使用します。
- Tailscale Serve（`gateway.auth.allowTailscale: true`）や非ループバックの `gateway.auth.mode: "trusted-proxy"`
  など、アイデンティティを伴うモードでは、`connect.params.auth.*` の代わりにリクエストヘッダーから
  接続認証チェックを満たします。
- プライベートイングレスの `gateway.auth.mode: "none"` では、共有シークレットによる接続認証を
  完全にスキップします。このモードを公開または信頼できないイングレスに公開しないでください。
- ペアリング後、Gateway は接続のロールとスコープに限定されたデバイストークンを発行し、
  `hello-ok.auth.deviceToken` で返します。クライアントは接続に成功するたびに
  このトークンを永続化する必要があります。
- 保存済みのデバイストークンで再接続する場合は、そのトークンについて保存された
  承認済みスコープセットも再利用する必要があります。これにより、すでに付与された読み取り、
  プローブ、ステータスへのアクセスが維持され、再接続時に暗黙の管理者専用スコープへ
  知らないうちに狭められることを防ぎます。
- クライアント側の接続認証の構成（`packages/gateway-client/src/client.ts` の
  `selectConnectAuth`）：
  - `auth.password` は独立しており、設定されている場合は常に転送されます。
  - `auth.token` は次の優先順位で設定されます。まず明示的な共有トークン、
    次に明示的な `deviceToken`、その後にデバイスごとに保存されたトークン
    （`deviceId` と `role` をキーとする）の順です。
  - `auth.bootstrapToken` は、上記のいずれによっても `auth.token` が
    解決されなかった場合にのみ送信されます。共有トークンまたは解決済みのデバイストークンが
    ある場合は送信されません。
  - 単発の `AUTH_TOKEN_MISMATCH` 再試行で保存済みデバイストークンを自動昇格できるのは、
    信頼できるエンドポイントに限られます。具体的にはループバック、または
    `tlsFingerprint` がピン留めされた `wss://` です。ピン留めされていない公開
    `wss://` は該当しません。
- 組み込みのセットアップコードによるブートストラップは、信頼できるモバイル引き継ぎのために、
  プライマリ Node の `hello-ok.auth.deviceToken` と、範囲が制限されたオペレータートークンを
  `hello-ok.auth.deviceTokens` で返します。オペレータートークンにはネイティブ Talk の設定読み取り用の
  `operator.talk.secrets` が含まれますが、ペアリング変更スコープと
  `operator.admin` は除外されます。
- 非ベースラインのセットアップコードによるブートストラップが承認を待っている間、
  `PAIRING_REQUIRED` の詳細には `recommendedNextStep: "wait_then_retry"`、
  `retryable: true`、および `pauseReconnect: false` が含まれます。リクエストが承認されるか、
  トークンが無効になるまで、同じブートストラップトークンで再接続を続けてください。
- 接続で、`wss://` やループバック／ローカルペアリングなどの
  信頼できるトランスポート上のブートストラップ認証を使用した場合にのみ、
  `hello-ok.auth.deviceTokens` を永続化してください。
- クライアントが明示的な `deviceToken` または明示的な `scopes` を指定した場合、
  呼び出し元が要求したそのスコープセットが引き続き優先されます。キャッシュされたスコープは、
  クライアントが保存済みのデバイスごとのトークンを再利用している場合にのみ再利用されます。
- デバイストークンは `device.token.rotate` および
  `device.token.revoke`（`operator.pairing` が必要）を使用してローテーションまたは失効できます。
  Node やその他の非オペレーターロールをローテーションまたは失効するには、
  `operator.admin` も必要です。
- `device.token.rotate` はローテーションのメタデータを返します。置換後の
  ベアラートークンを返すのは、そのデバイストークンですでに認証された同一デバイスからの呼び出しに限られます。
  これにより、トークンのみを使用するクライアントは、再接続前に置換後のトークンを永続化できます。
  共有／管理者によるローテーションでは、ベアラートークンは返されません。
- トークンの発行、ローテーション、失効は、そのデバイスのペアリングエントリに記録された
  承認済みロールセットの範囲内に制限されます。トークンの変更によって、ペアリング承認で一度も
  付与されていないデバイスロールを追加または対象にすることはできません。
- ペアリング済みデバイスのトークンセッションでは、呼び出し元が
  `operator.admin` も持っていない限り、デバイス管理は自身の範囲に限定されます。
  管理者以外の呼び出し元が管理できるのは、自身のデバイスエントリのオペレータートークンのみです。
  Node およびその他の非オペレータートークンの管理は、呼び出し元自身のデバイスであっても管理者専用です。
- `device.token.rotate` と `device.token.revoke` は、対象の
  オペレータートークンのスコープセットを、呼び出し元の現在のセッションスコープとも照合します。
  管理者以外の呼び出し元は、自身が現在保持しているものより広いオペレータートークンを
  ローテーションまたは失効できません。
- 認証エラーには、`error.details.code` と復旧のヒントが含まれます：
  - `error.details.canRetryWithDeviceToken`（ブール値）
  - `error.details.recommendedNextStep`：`retry_with_device_token`、
    `update_auth_configuration`、`update_auth_credentials`、
    `wait_then_retry`、`review_auth_configuration`
    のいずれか（`packages/gateway-protocol/src/connect-error-details.ts`）。
- `AUTH_TOKEN_MISMATCH` に対するクライアントの動作：
  - 信頼できるクライアントは、キャッシュされたデバイスごとのトークンを使用して、
    制限された再試行を 1 回行うことができます。
  - その再試行が失敗した場合は、自動再接続ループを停止し、オペレーターが取るべき
    対応のガイダンスを表示してください。
- `AUTH_SCOPE_MISMATCH` は、デバイストークンは認識されたものの、要求されたロール／スコープを
  網羅していないことを意味します。これを不正なトークンとして表示しないでください。オペレーターに、
  再ペアリングするか、より狭い／広いスコープ契約を承認するよう促してください。

## デバイスアイデンティティとペアリング

- Node は、キーペアのフィンガープリントから導出した安定したデバイスアイデンティティ
  （`device.id`）を含める必要があります。
- Gateway は、デバイスとロールの組み合わせごとにトークンを発行します。
- ローカルでの自動承認が有効でない限り、新しいデバイス ID には
  ペアリングの承認が必要です。
- ペアリングの自動承認は、直接の local loopback 接続を中心に行われます。
- OpenClaw には、信頼できる共有シークレットのヘルパーフロー用として、
  バックエンド／コンテナ内から自身へ接続する限定的なローカルパスもあります。
- 同一ホストの tailnet または LAN からの接続も、ペアリングではリモートとして扱われ、
  承認が必要です。
- WS クライアントは通常、`connect` 中に `device` アイデンティティを含めます
  （オペレーターと Node）。デバイスを持たないオペレーターに対する唯一の例外は、
  次の明示的な信頼パスです：
  - localhost 専用の安全でない HTTP 互換性のための
    `gateway.controlUi.allowInsecureAuth=true`。
  - `gateway.auth.mode: "trusted-proxy"` によるオペレーター Control UI 認証の成功。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（緊急用であり、
    セキュリティを大幅に低下させます）。
  - 予約済みの内部ヘルパーパス上で行われる、直接ループバックの
    `gateway-client` バックエンド RPC。
- デバイスアイデンティティを省略すると、スコープに影響します。明示的な信頼パスを介して
  デバイスを持たないオペレーター接続が許可された場合でも、そのパスに名前付きのスコープ保持例外が
  ない限り、OpenClaw は自己申告されたスコープを空のセットにクリアします。スコープ制限のある
  メソッドは、その後 `missing scope` で失敗します。
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` は、Control UI の
  緊急用スコープ保持パスです。任意のカスタムバックエンドや CLI 形式の WebSocket クライアントに
  スコープを付与するものではありません。
- 予約済みの直接ループバック `gateway-client` バックエンドヘルパーパスがスコープを保持するのは、
  内部のローカルコントロールプレーン RPC に限られます。カスタムバックエンド ID には
  この例外は適用されません。
- すべての接続は、サーバーから提供された `connect.challenge` nonce に署名する必要があります。

### デバイス認証移行の診断

チャレンジ導入前の署名動作を引き続き使用しているレガシークライアントでは、`connect` は、
安定した `error.details.reason` とともに、`error.details.code` 配下の `DEVICE_AUTH_*`
詳細コードを返します。

一般的な移行エラー：

| メッセージ                  | details.code                     | details.reason           | 意味                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | クライアントが `device.nonce` を省略しました（または空で送信しました）。 |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | クライアントが古い、または誤った nonce で署名しました。 |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 署名ペイロードが v2 ペイロードと一致しません。    |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 署名されたタイムスタンプが許容されるずれの範囲外です。 |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` が公開鍵のフィンガープリントと一致しません。 |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開鍵の形式／正規化に失敗しました。               |

移行先：

- 常に `connect.challenge` を待機してください。
- サーバーの nonce を含む v2 ペイロードに署名してください。
- `connect.params.device.nonce` で同じ nonce を送信してください。
- 推奨される署名ペイロードは `v3`
  （`packages/gateway-client/src/device-auth.ts` の `buildDeviceAuthPayloadV3`）です。
  これは、デバイス／クライアント／ロール／スコープ／トークン／nonce の各フィールドに加えて、
  `platform` と `deviceFamily` を結び付けます。
- 互換性のため、レガシーの `v2` 署名も引き続き受け入れられますが、
  再接続時のコマンドポリシーは、ペアリング済みデバイスのメタデータのピン留めによって引き続き制御されます。

## TLS とピン留め

- WS 接続では TLS がサポートされています（`gateway.tls` 設定）。
- クライアントは、`gateway.remote.tlsFingerprint` または CLI の `--tls-fingerprint` を使用して、
  Gateway 証明書のフィンガープリントを任意でピン留めできます。

## スコープ

このプロトコルは、ステータス、チャンネル、モデル、チャット、
エージェント、セッション、Node、承認など、Gateway API の全機能を公開します。正確な範囲は、
`packages/gateway-protocol/src/schema.ts` から再エクスポートされる TypeBox スキーマによって定義されます。

## 関連項目

- [ブリッジプロトコル](/ja-JP/gateway/bridge-protocol)
- [Gateway 運用手順書](/ja-JP/gateway)
