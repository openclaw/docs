---
read_when:
    - Gateway WS クライアントを実装または更新しています
    - プロトコル不一致または接続失敗をデバッグしています
    - プロトコルスキーマ/モデルを再生成しています
summary: 'Gateway WebSocket プロトコル: ハンドシェイク、フレーム、バージョニング'
title: Gateway プロトコル
x-i18n:
    generated_at: "2026-04-24T04:59:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf6710cb1c620dc03b75421cab7953c412cb85e68c52fa9b504ea89b7302efb8
    source_path: gateway/protocol.md
    workflow: 15
---

# Gateway プロトコル（WebSocket）

Gateway WS プロトコルは、OpenClaw の **単一の control plane + node transport** です。
すべてのクライアント（CLI、web UI、macOS アプリ、iOS/Android node、ヘッドレス
node）は WebSocket 経由で接続し、ハンドシェイク時に自分の **role** と **scope** を
宣言します。

## トランスポート

- WebSocket、JSON ペイロードを持つテキストフレーム。
- 最初のフレームは **必ず** `connect` リクエストでなければなりません。
- 接続前フレームの上限は 64 KiB です。ハンドシェイク成功後、クライアントは
  `hello-ok.policy.maxPayload` と
  `hello-ok.policy.maxBufferedBytes` の制限に従う必要があります。診断が有効な場合、
  過大な受信フレームと遅い送信バッファは、Gateway が該当フレームを閉じるまたは破棄する前に
  `payload.large` イベントを発行します。これらのイベントはサイズ、制限、サーフェス、
  安全な理由コードを保持します。メッセージ本文、添付内容、生のフレーム本文、
  トークン、Cookie、シークレット値は保持しません。

## ハンドシェイク（connect）

Gateway → Client（接続前 challenge）:

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Client → Gateway:

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

Gateway → Client:

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
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`、`features`、`snapshot`、`policy` はすべてスキーマ
（`src/gateway/protocol/schema/frames.ts`）で必須です。`canvasHostUrl` は任意です。`auth` は、
利用可能な場合に交渉済みの role/scopes を報告し、Gateway が発行した場合は
`deviceToken` を含みます。

device token が発行されない場合でも、`hello-ok.auth` は交渉済みの
権限を報告できます。

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

device token が発行される場合、`hello-ok` には次も含まれます。

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

trusted bootstrap handoff 中は、`hello-ok.auth` は追加の制限付き
role エントリーを `deviceTokens` に含むこともあります。

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

組み込みの node/operator bootstrap フローでは、主 node token は
`scopes: []` のままで、handoff された operator token は bootstrap
operator allowlist（`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`）に制限されたままです。bootstrap の scope チェックは
引き続き role プレフィックス付きのままです。operator エントリーは operator リクエストにのみ
適合し、operator 以外の role は引き続き自分の role プレフィックス配下の scope を必要とします。

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

- **Request**: `{type:"req", id, method, params}`
- **Response**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

副作用を持つメソッドには **idempotency keys** が必要です（スキーマ参照）。

## roles + scopes

### roles

- `operator` = control plane クライアント（CLI/UI/automation）
- `node` = capability host（camera/screen/canvas/system.run）

### scopes（operator）

一般的な scopes:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` を伴う `talk.config` には `operator.talk.secrets`
（または `operator.admin`）が必要です。

Plugin 登録された Gateway RPC メソッドは独自の operator scope を要求できますが、
予約済みのコア管理プレフィックス（`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`）は常に `operator.admin` に解決されます。

メソッド scope は最初のゲートにすぎません。`chat.send` を経由して到達する一部のスラッシュコマンドは、
その上にさらに厳格なコマンドレベルチェックを適用します。たとえば、永続的な
`/config set` と `/config unset` の書き込みには `operator.admin` が必要です。

`node.pair.approve` にも、ベースメソッド scope に加えて追加の承認時 scope チェックがあります。

- command なしリクエスト: `operator.pairing`
- exec 以外の node command を含むリクエスト: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare`, `system.which` を含むリクエスト:
  `operator.pairing` + `operator.admin`

### caps/commands/permissions（node）

node は接続時に capability claim を宣言します。

- `caps`: 高レベル capability カテゴリー
- `commands`: invoke 用 command allowlist
- `permissions`: 細かなトグル（例: `screen.record`, `camera.capture`）

Gateway はこれらを **claim** として扱い、サーバー側 allowlist を強制します。

## Presence

- `system-presence` は device identity をキーとするエントリーを返します。
- Presence エントリーには `deviceId`、`roles`、`scopes` が含まれるため、UI は
  同一デバイスが **operator** と **node** の両方で接続している場合でも 1 行で表示できます。

## ブロードキャストイベントのスコープ

サーバーから push される WebSocket ブロードキャストイベントは、pairing スコープや node 専用セッションが
セッション内容を受動的に受け取らないよう、scope ゲートされています。

- **Chat、agent、tool-result フレーム**（ストリーミングされた `agent` イベントやツール呼び出し結果を含む）には、少なくとも `operator.read` が必要です。`operator.read` を持たないセッションは、これらのフレームを完全にスキップします。
- **Plugin 定義の `plugin.*` ブロードキャスト**は、Plugin の登録方法に応じて `operator.write` または `operator.admin` にゲートされます。
- **Status と transport イベント**（`heartbeat`, `presence`, `tick`, connect/disconnect ライフサイクルなど）は、transport の健全性をすべての認証済みセッションから観測可能に保つため、制限されません。
- **未知のブロードキャストイベントファミリー**は、登録済みハンドラーが明示的に緩和しない限り、デフォルトで scope ゲートされます（fail-closed）。

各クライアント接続は独自のクライアントごとの sequence number を保持するため、異なるクライアントが
scope でフィルタされた異なるイベントサブセットを見る場合でも、そのソケット上ではブロードキャストの単調順序が保たれます。

## 一般的な RPC メソッドファミリー

公開 WS サーフェスは、上記のハンドシェイク/認証例より広範です。これは
生成ダンプではありません。`hello-ok.features.methods` は、
`src/gateway/server-methods-list.ts` と読み込まれた
plugin/channel メソッド export から構築された保守的な
検出リストです。これは機能検出として扱い、`src/gateway/server-methods/*.ts` の完全な
列挙とはみなさないでください。

<AccordionGroup>
  <Accordion title="システムと ID">
    - `health` は、キャッシュ済みまたは新しくプローブされた Gateway ヘルススナップショットを返します。
    - `diagnostics.stability` は、最近の制限付き診断安定性 recorder を返します。イベント名、件数、バイトサイズ、メモリ測定値、キュー/セッション状態、チャンネル/Plugin 名、session ID などの運用メタデータは保持します。チャットテキスト、Webhook 本文、ツール出力、生のリクエストまたはレスポンス本文、トークン、Cookie、シークレット値は保持しません。`operator.read` scope が必要です。
    - `status` は `/status` 形式の Gateway サマリーを返します。機密フィールドは admin scope を持つ operator クライアントにのみ含まれます。
    - `gateway.identity.get` は、relay と pairing フローで使用される Gateway device identity を返します。
    - `system-presence` は、接続中の operator/node デバイスの現在の presence スナップショットを返します。
    - `system-event` は、system event を追記し、presence コンテキストを更新/ブロードキャストできます。
    - `last-heartbeat` は、最新の永続化された Heartbeat event を返します。
    - `set-heartbeats` は、Gateway 上の Heartbeat 処理を切り替えます。
  </Accordion>

  <Accordion title="モデルと使用量">
    - `models.list` は、ランタイムで許可されたモデルカタログを返します。
    - `usage.status` は、プロバイダー使用期間ウィンドウ/残りクォータのサマリーを返します。
    - `usage.cost` は、日付範囲の集計済みコスト使用量サマリーを返します。
    - `doctor.memory.status` は、アクティブなデフォルトエージェントワークスペースの vector-memory / embedding 準備状況を返します。
    - `sessions.usage` は、セッションごとの使用量サマリーを返します。
    - `sessions.usage.timeseries` は、1 つのセッションの timeseries 使用量を返します。
    - `sessions.usage.logs` は、1 つのセッションの使用量ログエントリーを返します。
  </Accordion>

  <Accordion title="チャンネルとログインヘルパー">
    - `channels.status` は、内蔵 + バンドル済みチャンネル/Plugin のステータスサマリーを返します。
    - `channels.logout` は、そのチャンネルが logout をサポートしている場合、特定のチャンネル/アカウントを logout します。
    - `web.login.start` は、現在の QR 対応 web チャンネルプロバイダーに対して QR/web ログインフローを開始します。
    - `web.login.wait` は、その QR/web ログインフローの完了を待ち、成功時にチャンネルを開始します。
    - `push.test` は、登録済み iOS node にテスト APNs push を送信します。
    - `voicewake.get` は、保存済み wake-word trigger を返します。
    - `voicewake.set` は、wake-word trigger を更新し、その変更をブロードキャストします。
  </Accordion>

  <Accordion title="メッセージングとログ">
    - `send` は、chat runner 外でのチャンネル/アカウント/スレッド対象送信のための直接送信 RPC です。
    - `logs.tail` は、設定済み Gateway ファイルログの tail を、cursor/limit と max-byte 制御付きで返します。
  </Accordion>

  <Accordion title="Talk と TTS">
    - `talk.config` は、有効な Talk config ペイロードを返します。`includeSecrets` には `operator.talk.secrets`（または `operator.admin`）が必要です。
    - `talk.mode` は、WebChat/Control UI クライアント向けの現在の Talk mode 状態を設定/ブロードキャストします。
    - `talk.speak` は、アクティブな Talk speech プロバイダーを通じて音声合成します。
    - `tts.status` は、TTS の有効状態、アクティブプロバイダー、フォールバックプロバイダー、プロバイダー config 状態を返します。
    - `tts.providers` は、可視な TTS プロバイダー一覧を返します。
    - `tts.enable` と `tts.disable` は、TTS prefs 状態を切り替えます。
    - `tts.setProvider` は、優先 TTS プロバイダーを更新します。
    - `tts.convert` は、ワンショットの text-to-speech 変換を実行します。
  </Accordion>

  <Accordion title="シークレット、config、update、wizard">
    - `secrets.reload` は、アクティブな SecretRef を再解決し、完全成功時にのみランタイムの secret 状態を入れ替えます。
    - `secrets.resolve` は、特定の command/target セットに対して command 対象の secret 割り当てを解決します。
    - `config.get` は、現在の config スナップショットとハッシュを返します。
    - `config.set` は、検証済み config ペイロードを書き込みます。
    - `config.patch` は、部分的な config 更新をマージします。
    - `config.apply` は、完全な config ペイロードを検証して置き換えます。
    - `config.schema` は、Control UI と CLI tooling が使うライブ config schema ペイロードを返します: schema、`uiHints`、version、生成メタデータ。ランタイムで読み込める場合は plugin + channel schema メタデータも含みます。この schema には、UI で使われる同じラベルとヘルプテキストから派生した field `title` / `description` メタデータが含まれます。対応する field ドキュメントが存在する場合は、ネストされた object、wildcard、array-item、`anyOf` / `oneOf` / `allOf` の構成分岐も含みます。
    - `config.schema.lookup` は、1 つの config path に対する path スコープ付き lookup ペイロードを返します: 正規化された path、浅い schema node、対応する hint + `hintPath`、および UI/CLI drill-down 用の直下 child サマリー。lookup schema node は、ユーザー向けドキュメントと一般的なバリデーションフィールド（`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, 数値/文字列/配列/object の境界、および `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` のようなフラグ）を保持します。child サマリーは `key`、正規化された `path`、`type`、`required`、`hasChildren`、および一致した `hint` / `hintPath` を公開します。
    - `update.run` は Gateway update フローを実行し、update 自体が成功した場合にのみ再起動をスケジュールします。
    - `wizard.start`, `wizard.next`, `wizard.status`, `wizard.cancel` は、オンボーディングウィザードを WS RPC 経由で公開します。
  </Accordion>

  <Accordion title="エージェントとワークスペースのヘルパー">
    - `agents.list` は、設定済みエージェントエントリーを返します。
    - `agents.create`, `agents.update`, `agents.delete` は、エージェントレコードとワークスペース接続を管理します。
    - `agents.files.list`, `agents.files.get`, `agents.files.set` は、エージェント向けに公開される bootstrap ワークスペースファイルを管理します。
    - `agent.identity.get` は、エージェントまたはセッションに対する有効な assistant identity を返します。
    - `agent.wait` は、実行完了を待ち、利用可能な場合は終端スナップショットを返します。
  </Accordion>

  <Accordion title="セッション制御">
    - `sessions.list` は、現在のセッションインデックスを返します。
    - `sessions.subscribe` と `sessions.unsubscribe` は、現在の WS クライアント向けのセッション変更イベント購読を切り替えます。
    - `sessions.messages.subscribe` と `sessions.messages.unsubscribe` は、1 つのセッションに対するトランスクリプト/メッセージイベント購読を切り替えます。
    - `sessions.preview` は、特定セッションキーに対する制限付きトランスクリプトプレビューを返します。
    - `sessions.resolve` は、セッションターゲットを解決または正規化します。
    - `sessions.create` は、新しいセッションエントリーを作成します。
    - `sessions.send` は、既存セッションにメッセージを送信します。
    - `sessions.steer` は、アクティブなセッションに対する interrupt-and-steer バリアントです。
    - `sessions.abort` は、セッションのアクティブな作業を abort します。
    - `sessions.patch` は、セッションメタデータ/上書きを更新します。
    - `sessions.reset`, `sessions.delete`, `sessions.compact` は、セッションメンテナンスを実行します。
    - `sessions.get` は、保存されている完全なセッション行を返します。
    - chat 実行は引き続き `chat.history`, `chat.send`, `chat.abort`, `chat.inject` を使用します。`chat.history` は UI クライアント向けに表示正規化されています: visible text からインライン directive tag が削除され、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）と、漏えいした ASCII/全角 model control token が削除され、完全一致の `NO_REPLY` / `no_reply` のような純粋な silent-token assistant 行は省略され、過大な行はプレースホルダーに置き換えられることがあります。
  </Accordion>

  <Accordion title="デバイスペアリングと device token">
    - `device.pair.list` は、保留中および承認済みのペア済みデバイスを返します。
    - `device.pair.approve`, `device.pair.reject`, `device.pair.remove` は、デバイスペアリング記録を管理します。
    - `device.token.rotate` は、承認された role と scope の範囲内でペア済みデバイス token をローテーションします。
    - `device.token.revoke` は、ペア済みデバイス token を失効させます。
  </Accordion>

  <Accordion title="Node のペアリング、invoke、保留中作業">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.verify` は、node ペアリングと bootstrap 検証を扱います。
    - `node.list` と `node.describe` は、既知/接続中の node 状態を返します。
    - `node.rename` は、ペア済み node ラベルを更新します。
    - `node.invoke` は、接続中の node へ command を転送します。
    - `node.invoke.result` は、invoke リクエストの結果を返します。
    - `node.event` は、node 起点イベントを Gateway に戻します。
    - `node.canvas.capability.refresh` は、スコープ付き canvas-capability token を更新します。
    - `node.pending.pull` と `node.pending.ack` は、接続中 node のキュー API です。
    - `node.pending.enqueue` と `node.pending.drain` は、オフライン/切断中 node 向けの永続的な保留作業を管理します。
  </Accordion>

  <Accordion title="承認ファミリー">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, `exec.approval.resolve` は、ワンショットの exec 承認リクエストと、保留中承認の lookup/replay を扱います。
    - `exec.approval.waitDecision` は、1 つの保留中 exec 承認を待機し、最終判断を返します（タイムアウト時は `null`）。
    - `exec.approvals.get` と `exec.approvals.set` は、Gateway exec 承認ポリシースナップショットを管理します。
    - `exec.approvals.node.get` と `exec.approvals.node.set` は、node relay command 経由で node ローカル exec 承認ポリシーを管理します。
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, `plugin.approval.resolve` は、Plugin 定義の承認フローを扱います。
  </Accordion>

  <Accordion title="Automation、Skills、ツール">
    - Automation: `wake` は即時または次の Heartbeat で wake テキスト注入をスケジュールします。`cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` はスケジュール済み作業を管理します。
    - Skills とツール: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`。
  </Accordion>
</AccordionGroup>

### 一般的なイベントファミリー

- `chat`: `chat.inject` やその他のトランスクリプト専用 chat
  イベントなどの UI chat 更新。
- `session.message` と `session.tool`: 購読中セッション向けの
  トランスクリプト/イベントストリーム更新。
- `sessions.changed`: セッションインデックスまたはメタデータが変更された。
- `presence`: システム presence スナップショット更新。
- `tick`: 定期的な keepalive / liveness イベント。
- `health`: Gateway ヘルススナップショット更新。
- `heartbeat`: Heartbeat イベントストリーム更新。
- `cron`: Cron 実行/ジョブ変更イベント。
- `shutdown`: Gateway シャットダウン通知。
- `node.pair.requested` / `node.pair.resolved`: node ペアリングライフサイクル。
- `node.invoke.request`: node invoke request ブロードキャスト。
- `device.pair.requested` / `device.pair.resolved`: ペア済みデバイスライフサイクル。
- `voicewake.changed`: wake-word trigger config が変更された。
- `exec.approval.requested` / `exec.approval.resolved`: exec 承認
  ライフサイクル。
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin 承認
  ライフサイクル。

### Node ヘルパーメソッド

- node は、自動許可チェック用に現在の skill 実行ファイル一覧を取得するため
  `skills.bins` を呼び出せます。

### Operator ヘルパーメソッド

- operator は、エージェント用のランタイム
  command インベントリ取得に `commands.list`（`operator.read`）を呼び出せます。
  - `agentId` は任意です。省略するとデフォルトエージェントワークスペースを読み取ります。
  - `scope` は、主 `name` がどのサーフェスを対象にするかを制御します:
    - `text` は、先頭の `/` を除いた主 text command token を返します
    - `native` とデフォルトの `both` パスは、利用可能な場合に provider-aware な native 名を返します
  - `textAliases` は、`/model` や `/m` のような正確な slash alias を保持します。
  - `nativeName` は、存在する場合に provider-aware な native command 名を保持します。
  - `provider` は任意で、native naming と native Plugin
    command 可用性にのみ影響します。
  - `includeArgs=false` は、レスポンスからシリアライズ済み引数メタデータを省略します。
- operator は、エージェント用のランタイムツールカタログ取得に `tools.catalog`（`operator.read`）を呼び出せます。レスポンスには、グループ化されたツールと provenance メタデータが含まれます:
  - `source`: `core` または `plugin`
  - `pluginId`: `source="plugin"` の場合の Plugin オーナー
  - `optional`: Plugin ツールが任意かどうか
- operator は、セッション用のランタイムで有効なツール
  インベントリ取得に `tools.effective`（`operator.read`）を呼び出せます。
  - `sessionKey` は必須です。
  - Gateway は、呼び出し元が supplied した auth や delivery context を受け入れる代わりに、
    trusted なランタイムコンテキストをサーバー側でセッションから導出します。
  - レスポンスはセッションスコープであり、現在アクティブな会話が実際に使えるものを反映します。
    core、Plugin、channel ツールを含みます。
- operator は、エージェント用の可視
  skill インベントリ取得に `skills.status`（`operator.read`）を呼び出せます。
  - `agentId` は任意です。省略するとデフォルトエージェントワークスペースを読み取ります。
  - レスポンスには、適格性、欠けている要件、config チェック、および
    生のシークレット値を公開しないサニタイズ済み install options が含まれます。
- operator は、ClawHub 検出メタデータのために `skills.search` と `skills.detail`（`operator.read`）を呼び出せます。
- operator は、`skills.install`（`operator.admin`）を 2 つのモードで呼び出せます:
  - ClawHub モード: `{ source: "clawhub", slug, version?, force? }` は、
    デフォルトエージェントワークスペースの `skills/` ディレクトリに skill フォルダーをインストールします。
  - Gateway installer モード: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    は、Gateway ホスト上で宣言済み `metadata.openclaw.install` アクションを実行します。
- operator は、`skills.update`（`operator.admin`）を 2 つのモードで呼び出せます:
  - ClawHub モードは、1 つの追跡中 slug またはデフォルトエージェントワークスペース内の
    すべての追跡中 ClawHub インストールを更新します。
  - Config モードは、`enabled`,
    `apiKey`, `env` などの `skills.entries.<skillKey>` 値を patch します。

## Exec 承認

- exec リクエストに承認が必要な場合、Gateway は `exec.approval.requested` をブロードキャストします。
- operator クライアントは `exec.approval.resolve` を呼び出して解決します（`operator.approvals` scope が必要）。
- `host=node` の場合、`exec.approval.request` は `systemRunPlan`（正規化された `argv`/`cwd`/`rawCommand`/session メタデータ）を含まなければなりません。`systemRunPlan` が欠けたリクエストは拒否されます。
- 承認後、転送された `node.invoke system.run` 呼び出しは、その正規化された
  `systemRunPlan` を正式な command/cwd/session コンテキストとして再利用します。
- 呼び出し元が prepare と最終承認済み `system.run` 転送の間で `command`, `rawCommand`, `cwd`, `agentId`, または
  `sessionKey` を変更した場合、Gateway はその変更後のペイロードを信用せず、
  実行を拒否します。

## エージェント配信フォールバック

- `agent` リクエストには、送信配信を要求するため `deliver=true` を含められます。
- `bestEffortDeliver=false` は厳格動作を維持します: 解決不能または内部専用の配信ターゲットは `INVALID_REQUEST` を返します。
- `bestEffortDeliver=true` は、外部に配信可能なルートを解決できない場合（例: internal/webchat セッションや曖昧なマルチチャンネル設定）に、セッション専用実行へのフォールバックを許可します。

## バージョニング

- `PROTOCOL_VERSION` は `src/gateway/protocol/schema/protocol-schemas.ts` にあります。
- クライアントは `minProtocol` + `maxProtocol` を送信し、サーバーは不一致を拒否します。
- スキーマ + モデルは TypeBox 定義から生成されます:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### クライアント定数

`src/gateway/client.ts` のリファレンスクライアントはこれらのデフォルト値を使用します。値は
プロトコル v3 全体で安定しており、サードパーティクライアントにとって期待されるベースラインです。

| 定数 | デフォルト | ソース |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| リクエストタイムアウト（RPC ごと） | `30_000` ms | `src/gateway/client.ts` (`requestTimeoutMs`) |
| preauth / connect-challenge タイムアウト | `10_000` ms | `src/gateway/handshake-timeouts.ts`（クランプ `250`–`10_000`） |
| 初期再接続バックオフ | `1_000` ms | `src/gateway/client.ts` (`backoffMs`) |
| 最大再接続バックオフ | `30_000` ms | `src/gateway/client.ts` (`scheduleReconnect`) |
| device-token close 後の高速リトライクランプ | `250` ms | `src/gateway/client.ts` |
| `terminate()` 前の強制停止猶予 | `250` ms | `FORCE_STOP_TERMINATE_GRACE_MS` |
| `stopAndWait()` のデフォルトタイムアウト | `1_000` ms | `STOP_AND_WAIT_TIMEOUT_MS` |
| デフォルト tick interval（`hello-ok` 前） | `30_000` ms | `src/gateway/client.ts` |
| tick-timeout close | 無通信が `tickIntervalMs * 2` を超えたとき code `4000` | `src/gateway/client.ts` |
| `MAX_PAYLOAD_BYTES` | `25 * 1024 * 1024`（25 MB） | `src/gateway/server-constants.ts` |

サーバーは `hello-ok` 内で有効な `policy.tickIntervalMs`、`policy.maxPayload`、
`policy.maxBufferedBytes` を通知します。クライアントは接続前デフォルトではなく、
それらの値を尊重する必要があります。

## 認証

- 共有シークレット Gateway 認証は、設定された認証モードに応じて `connect.params.auth.token` または
  `connect.params.auth.password` を使用します。
- Tailscale Serve
  （`gateway.auth.allowTailscale: true`）や non-loopback
  `gateway.auth.mode: "trusted-proxy"` のような ID 付きモードでは、connect 認証チェックは
  `connect.params.auth.*` ではなくリクエストヘッダーから満たされます。
- private-ingress の `gateway.auth.mode: "none"` は、共有シークレット connect 認証を
  完全にスキップします。このモードを公開/非信頼 ingress にさらさないでください。
- ペアリング後、Gateway は接続の
  role + scopes にスコープされた **device token** を発行します。これは `hello-ok.auth.deviceToken` で返され、
  クライアントは今後の接続のために永続化する必要があります。
- クライアントは、成功した接続ごとに主 `hello-ok.auth.deviceToken` を永続化する必要があります。
- その **保存済み** device token で再接続する場合、対応する保存済みの
  承認済み scope セットも再利用する必要があります。これにより、すでに付与されていた
  read/probe/status アクセスが保持され、再接続時に暗黙の admin-only scope へ静かに縮小されるのを防げます。
- クライアント側の connect 認証組み立て（
  `src/gateway/client.ts` の `selectConnectAuth`）:
  - `auth.password` は独立しており、設定されていれば常に転送されます。
  - `auth.token` は優先順位順に設定されます: 明示的な共有 token が最優先、
    次に明示的な `deviceToken`、その次に保存済みのデバイスごとの token（
    `deviceId` + `role` でキー付け）。
  - `auth.bootstrapToken` は、上記のいずれでも `auth.token` が解決されなかった場合にのみ送信されます。
    共有 token または解決済み device token があると、これを抑制します。
  - 保存済み device token のワンショット
    `AUTH_TOKEN_MISMATCH` リトライ時の自動昇格は、**信頼済み endpoint のみ** に制限されます —
    loopback、またはピン留め済み `tlsFingerprint` を伴う `wss://`。
    ピン留めのない公開 `wss://` は対象になりません。
- 追加の `hello-ok.auth.deviceTokens` エントリーは bootstrap handoff token です。
  これらを永続化するのは、接続が
  `wss://` または loopback/local pairing のような信頼済みトランスポートで bootstrap auth を使用した場合のみにしてください。
- クライアントが **明示的な** `deviceToken` または明示的な `scopes` を指定した場合、
  その呼び出し元要求の scope セットが正式なものとして扱われます。キャッシュ済み scope が
  再利用されるのは、クライアントが保存済みのデバイスごとの token を再利用している場合のみです。
- device token は `device.token.rotate` と
  `device.token.revoke` でローテーション/失効できます（`operator.pairing` scope が必要）。
- token 発行/ローテーションは、その
  デバイスのペアリングエントリーに記録された承認済み role セットの範囲内に制限されます。token をローテーションしても、
  ペアリング承認が一度も許可していない role へデバイスを拡張することはできません。
- paired-device token セッションでは、呼び出し元がさらに `operator.admin` を持たない限り、
  デバイス管理は自己スコープです。非 admin 呼び出し元は **自分自身の** デバイスエントリーのみを remove/revoke/rotate できます。
- `device.token.rotate` は、要求された operator scope セットを、
  呼び出し元の現在のセッション scope に対してもチェックします。非 admin 呼び出し元は、現在保持しているより広い operator scope セットへ token をローテーションできません。
- 認証失敗には `error.details.code` と回復ヒントが含まれます:
  - `error.details.canRetryWithDeviceToken`（真偽値）
  - `error.details.recommendedNextStep`（`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`）
- `AUTH_TOKEN_MISMATCH` に対するクライアント動作:
  - 信頼済みクライアントは、キャッシュ済みのデバイスごとの token で 1 回だけ制限付きリトライを試みることができます。
  - そのリトライが失敗した場合、クライアントは自動再接続ループを停止し、operator アクションガイダンスを表示する必要があります。

## デバイス ID + ペアリング

- node は、キーペア fingerprint から導出された安定した device identity（`device.id`）を含める必要があります。
- Gateway は、デバイス + role ごとに token を発行します。
- ローカル自動承認が有効でない限り、新しい device ID にはペアリング承認が必要です。
- ペアリング自動承認は、直接のローカル loopback 接続を中心に設計されています。
- OpenClaw には、信頼済み共有シークレット helper フロー向けの狭い backend/container-local self-connect パスもあります。
- 同一ホスト tailnet や LAN 接続は、依然としてペアリング上は remote として扱われ、
  承認が必要です。
- すべての WS クライアントは、`connect` 中に `device` identity を含めなければなりません（operator + node）。
  Control UI がそれを省略できるのは、次の場合のみです:
  - localhost 専用の insecure HTTP 互換向け `gateway.controlUi.allowInsecureAuth=true`
  - 成功した `gateway.auth.mode: "trusted-proxy"` operator Control UI 認証
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（緊急用、重大なセキュリティ低下）
- すべての接続は、サーバー提供の `connect.challenge` nonce に署名しなければなりません。

### device 認証移行診断

旧式の challenge 前署名動作をまだ使っているレガシークライアント向けに、`connect` は現在
`error.details.reason` とともに `error.details.code` 配下で `DEVICE_AUTH_*` 詳細コードを返します。

一般的な移行失敗:

| メッセージ | details.code | details.reason | 意味 |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | クライアントが `device.nonce` を省略した（または空を送った）。 |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | クライアントが古い/誤った nonce で署名した。 |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 署名ペイロードが v2 ペイロードと一致しない。 |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 署名済みタイムスタンプが許容 skew の範囲外。 |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` が公開鍵 fingerprint と一致しない。 |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開鍵形式/正規化に失敗した。 |

移行先:

- 常に `connect.challenge` を待つ。
- サーバー nonce を含む v2 ペイロードに署名する。
- 同じ nonce を `connect.params.device.nonce` に送る。
- 推奨署名ペイロードは `v3` で、device/client/role/scopes/token/nonce フィールドに加えて `platform` と `deviceFamily` を束縛します。
- 互換性のためレガシー `v2` 署名も引き続き受け付けられますが、ペア済みデバイスの
  メタデータ pinning は、再接続時の command policy を引き続き制御します。

## TLS + ピン留め

- WS 接続では TLS がサポートされます。
- クライアントは、必要に応じて Gateway 証明書 fingerprint をピン留めできます（
  `gateway.tls` config と `gateway.remote.tlsFingerprint` または CLI `--tls-fingerprint` を参照）。

## スコープ

このプロトコルは、**完全な Gateway API**（status、channels、models、chat、
agent、sessions、nodes、approvals など）を公開します。正確なサーフェスは
`src/gateway/protocol/schema.ts` の TypeBox スキーマで定義されます。

## 関連

- [Bridge protocol](/ja-JP/gateway/bridge-protocol)
- [Gateway runbook](/ja-JP/gateway)
