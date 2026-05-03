---
read_when:
    - Gateway WS クライアントの実装または更新
    - プロトコル不一致や接続失敗のデバッグ
    - プロトコルスキーマ/モデルの再生成
summary: 'Gateway WebSocket プロトコル: ハンドシェイク、フレーム、バージョニング'
title: Gateway プロトコル
x-i18n:
    generated_at: "2026-05-03T04:59:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 06f6e1f2188860362bff481e646bd1c4bae4cf8f9a9ccae4fbd5ceea434d2247
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS プロトコルは、OpenClaw の**単一の制御プレーン + node トランスポート**です。すべてのクライアント (CLI、Web UI、macOS アプリ、iOS/Android node、ヘッドレス node) は WebSocket 経由で接続し、ハンドシェイク時に自身の**ロール** + **スコープ**を宣言します。

## トランスポート

- WebSocket、JSON ペイロードを含むテキストフレーム。
- 最初のフレームは**必ず** `connect` リクエストである必要があります。
- 接続前フレームは 64 KiB に制限されます。ハンドシェイクが成功した後、クライアントは `hello-ok.policy.maxPayload` と `hello-ok.policy.maxBufferedBytes` の制限に従う必要があります。診断が有効な場合、過大な受信フレームと低速な送信バッファは、gateway が該当フレームを閉じるか破棄する前に `payload.large` イベントを出します。これらのイベントは、サイズ、制限、サーフェス、安全な理由コードを保持します。メッセージ本文、添付ファイルの内容、生フレーム本文、トークン、Cookie、シークレット値は保持しません。

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

Gateway がまだ起動時のサイドカー処理を完了している途中の場合、`connect` リクエストは `details.reason` が `"startup-sidecars"` に設定され、`retryAfterMs` を含む、再試行可能な `UNAVAILABLE` エラーを返すことがあります。クライアントはそれを終端的なハンドシェイク失敗として表示するのではなく、全体の接続予算内でそのレスポンスを再試行する必要があります。

`server`、`features`、`snapshot`、`policy` はすべてスキーマ (`src/gateway/protocol/schema/frames.ts`) で必須です。`auth` も必須で、ネゴシエートされたロール/スコープを報告します。`canvasHostUrl` は任意です。

デバイストークンが発行されない場合、`hello-ok.auth` はトークンフィールドなしでネゴシエートされた権限を報告します。

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

信頼された同一プロセスのバックエンドクライアント (`client.id: "gateway-client"`、`client.mode: "backend"`) は、共有 gateway トークン/パスワードで認証する場合、直接 loopback 接続では `device` を省略できます。この経路は内部の制御プレーン RPC 用に予約されており、古い CLI/デバイスのペアリング基準が、サブエージェントセッション更新などのローカルバックエンド作業を妨げないようにします。リモートクライアント、ブラウザ origin クライアント、node クライアント、および明示的なデバイストークン/デバイス ID クライアントは、引き続き通常のペアリングとスコープアップグレードのチェックを使用します。

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

信頼されたブートストラップの引き継ぎ中、`hello-ok.auth` は `deviceTokens` に追加の制限付きロールエントリを含むこともあります。

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

組み込みの node/operator ブートストラップフローでは、プライマリ node トークンは `scopes: []` のままで、引き継がれた operator トークンはブートストラップ operator 許可リスト (`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`) に制限されたままになります。ブートストラップのスコープチェックはロール接頭辞付きのままです。operator エントリは operator リクエストだけを満たし、operator 以外のロールは引き続きそれぞれのロール接頭辞配下のスコープを必要とします。

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

副作用のあるメソッドには**冪等性キー**が必要です (スキーマを参照)。

## ロール + スコープ

完全な operator スコープモデル、承認時チェック、共有シークレットのセマンティクスについては、[operator スコープ](/ja-JP/gateway/operator-scopes)を参照してください。

### ロール

- `operator` = 制御プレーンのクライアント (CLI/UI/自動化)。
- `node` = 機能ホスト (camera/screen/canvas/system.run)。

### スコープ (operator)

一般的なスコープ:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` を指定した `talk.config` には `operator.talk.secrets` (または `operator.admin`) が必要です。

Plugin が登録した gateway RPC メソッドは独自の operator スコープを要求できますが、予約済みのコア管理接頭辞 (`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`) は常に `operator.admin` に解決されます。

メソッドスコープは最初のゲートにすぎません。`chat.send` 経由で到達する一部のスラッシュコマンドには、その上により厳格なコマンドレベルのチェックが適用されます。たとえば、永続的な `/config set` と `/config unset` の書き込みには `operator.admin` が必要です。

`node.pair.approve` には、基底メソッドスコープに加えて、承認時の追加スコープチェックもあります。

- コマンドなしのリクエスト: `operator.pairing`
- exec 以外の node コマンドを含むリクエスト: `operator.pairing` + `operator.write`
- `system.run`、`system.run.prepare`、または `system.which` を含むリクエスト: `operator.pairing` + `operator.admin`

### caps/commands/permissions (node)

node は接続時に機能要求を宣言します。

- `caps`: 高レベルの機能カテゴリ。
- `commands`: invoke 用のコマンド許可リスト。
- `permissions`: 細かなトグル (例: `screen.record`、`camera.capture`)。

Gateway はこれらを**要求**として扱い、サーバー側の許可リストを適用します。

## プレゼンス

- `system-presence` はデバイス ID をキーにしたエントリを返します。
- プレゼンスエントリには `deviceId`、`roles`、`scopes` が含まれるため、UI は同じデバイスが **operator** と **node** の両方として接続している場合でも、デバイスごとに 1 行を表示できます。
- `node.list` には任意の `lastSeenAtMs` と `lastSeenReason` フィールドが含まれます。接続中の node は現在の接続時刻を `lastSeenAtMs`、理由を `connect` として報告します。ペアリング済み node は、信頼された node イベントがペアリングメタデータを更新したときに、永続的なバックグラウンドプレゼンスも報告できます。

### Node バックグラウンド alive イベント

node は `event: "node.presence.alive"` を指定して `node.event` を呼び出し、ペアリング済み node がバックグラウンド wake 中に生存していたことを、接続済みとしてマークせずに記録できます。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` は閉じた enum です: `background`、`silent_push`、`bg_app_refresh`、`significant_location`、`manual`、または `connect`。不明な trigger 文字列は、永続化前に gateway によって `background` に正規化されます。このイベントは、認証済み node デバイスセッションの場合にのみ永続化されます。デバイスなし、または未ペアリングのセッションは `handled: false` を返します。

成功した gateway は構造化された結果を返します。

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

古い gateway は `node.event` に対してまだ `{ "ok": true }` を返す場合があります。クライアントはそれを永続的なプレゼンスの永続化としてではなく、RPC が確認されたものとして扱う必要があります。

## ブロードキャストイベントのスコープ設定

サーバーからプッシュされる WebSocket ブロードキャストイベントはスコープで制御され、ペアリングスコープのみ、または node 専用のセッションがセッション内容を受動的に受信しないようにします。

- **チャット、エージェント、ツール結果フレーム** (ストリーミングされた `agent` イベントとツール呼び出し結果を含む) には、少なくとも `operator.read` が必要です。`operator.read` を持たないセッションは、これらのフレームを完全にスキップします。
- **Plugin 定義の `plugin.*` ブロードキャスト** は、Plugin がそれらをどのように登録したかに応じて、`operator.write` または `operator.admin` で制御されます。
- **ステータスおよびトランスポートイベント** (`heartbeat`、`presence`、`tick`、接続/切断ライフサイクルなど) は、すべての認証済みセッションがトランスポート健全性を観測できるように、制限されません。
- **不明なブロードキャストイベントファミリー** は、登録済みハンドラーが明示的に緩和しない限り、デフォルトでスコープ制御されます (フェイルクローズ)。

各クライアント接続は自身のクライアントごとのシーケンス番号を保持するため、異なるクライアントがイベントストリームの異なるスコープフィルタ済みサブセットを見る場合でも、そのソケット上ではブロードキャストの単調な順序が維持されます。

## 一般的な RPC メソッドファミリー

公開 WS サーフェスは、上記のハンドシェイク/認証の例よりも広範です。これは生成されたダンプではありません。`hello-ok.features.methods` は、`src/gateway/server-methods-list.ts` と読み込まれた plugin/channel メソッドエクスポートから構築された保守的な検出リストです。これは機能検出として扱い、`src/gateway/server-methods/*.ts` の完全な列挙として扱わないでください。

<AccordionGroup>
  <Accordion title="システムと ID">
    - `health` はキャッシュ済み、または新しくプローブされた gateway ヘルススナップショットを返します。
    - `diagnostics.stability` は、最近の制限付き診断安定性レコーダーを返します。イベント名、件数、バイトサイズ、メモリ読み取り値、キュー/セッション状態、channel/plugin 名、セッション ID などの運用メタデータを保持します。チャットテキスト、webhook 本文、ツール出力、生のリクエスト本文またはレスポンス本文、トークン、Cookie、シークレット値は保持しません。operator read スコープが必要です。
    - `status` は `/status` 形式の gateway サマリーを返します。機密フィールドは admin スコープの operator クライアントにのみ含まれます。
    - `gateway.identity.get` は relay とペアリングフローで使用される gateway デバイス ID を返します。
    - `system-presence` は接続中の operator/node デバイスの現在のプレゼンススナップショットを返します。
    - `system-event` はシステムイベントを追加し、プレゼンスコンテキストを更新/ブロードキャストできます。
    - `last-heartbeat` は永続化された最新の heartbeat イベントを返します。
    - `set-heartbeats` は gateway 上の heartbeat 処理を切り替えます。

  </Accordion>

  <Accordion title="モデルと使用状況">
    - `models.list` は、ランタイムで許可されたモデルカタログを返します。ピッカー向けの構成済みモデル（先に `agents.defaults.models`、次に `models.providers.*.models`）には `{ "view": "configured" }` を、完全なカタログには `{ "view": "all" }` を渡します。
    - `usage.status` は、プロバイダーの使用状況ウィンドウ/残りクォータの概要を返します。
    - `usage.cost` は、日付範囲の集計されたコスト使用状況の概要を返します。
    - `doctor.memory.status` は、アクティブな既定エージェントワークスペースのベクトルメモリ/キャッシュ済み埋め込みの準備状態を返します。呼び出し元がライブの埋め込みプロバイダー ping を明示的に求める場合にのみ、`{ "probe": true }` または `{ "deep": true }` を渡します。
    - `doctor.memory.remHarness` は、リモートコントロールプレーンクライアント向けに、境界付きの読み取り専用 REM ハーネスプレビューを返します。ワークスペースパス、メモリスニペット、レンダリング済みの根拠付き markdown、深い昇格候補を含められるため、呼び出し元には `operator.read` が必要です。
    - `sessions.usage` は、セッションごとの使用状況の概要を返します。
    - `sessions.usage.timeseries` は、1 つのセッションの時系列使用状況を返します。
    - `sessions.usage.logs` は、1 つのセッションの使用状況ログエントリを返します。

  </Accordion>

  <Accordion title="チャネルとログインヘルパー">
    - `channels.status` は、組み込み + 同梱チャネル/Plugin のステータス概要を返します。
    - `channels.logout` は、チャネルがログアウトをサポートしている場合に、特定のチャネル/アカウントからログアウトします。
    - `web.login.start` は、現在の QR 対応 Web チャネルプロバイダーの QR/Web ログインフローを開始します。
    - `web.login.wait` は、その QR/Web ログインフローの完了を待ち、成功時にチャネルを開始します。
    - `push.test` は、登録済み iOS ノードへテスト APNs push を送信します。
    - `voicewake.get` は、保存済みのウェイクワードトリガーを返します。
    - `voicewake.set` は、ウェイクワードトリガーを更新し、変更をブロードキャストします。

  </Accordion>

  <Accordion title="メッセージングとログ">
    - `send` は、チャットランナー外でチャネル/アカウント/スレッドを対象に送信するための、直接アウトバウンド配信 RPC です。
    - `logs.tail` は、カーソル/制限と最大バイト制御付きで、構成済み Gateway ファイルログの末尾を返します。

  </Accordion>

  <Accordion title="Talk と TTS">
    - `talk.config` は、有効な Talk 構成ペイロードを返します。`includeSecrets` には `operator.talk.secrets`（または `operator.admin`）が必要です。
    - `talk.mode` は、WebChat/Control UI クライアント向けに現在の Talk モード状態を設定/ブロードキャストします。
    - `talk.speak` は、アクティブな Talk 音声プロバイダーを通じて音声を合成します。
    - `tts.status` は、TTS の有効状態、アクティブなプロバイダー、フォールバックプロバイダー、プロバイダー構成状態を返します。
    - `tts.providers` は、表示可能な TTS プロバイダーインベントリを返します。
    - `tts.enable` と `tts.disable` は、TTS 設定状態を切り替えます。
    - `tts.setProvider` は、優先 TTS プロバイダーを更新します。
    - `tts.convert` は、1 回限りのテキスト読み上げ変換を実行します。

  </Accordion>

  <Accordion title="シークレット、構成、更新、ウィザード">
    - `secrets.reload` は、アクティブな SecretRefs を再解決し、完全に成功した場合にのみランタイムシークレット状態を差し替えます。
    - `secrets.resolve` は、特定のコマンド/ターゲットセットに対するコマンド対象シークレット割り当てを解決します。
    - `config.get` は、現在の構成スナップショットとハッシュを返します。
    - `config.set` は、検証済みの構成ペイロードを書き込みます。
    - `config.patch` は、部分的な構成更新をマージします。
    - `config.apply` は、完全な構成ペイロードを検証して置き換えます。
    - `config.schema` は、Control UI と CLI ツールで使用されるライブ構成スキーマペイロードを返します。これには、スキーマ、`uiHints`、バージョン、生成メタデータが含まれ、ランタイムが読み込める場合は Plugin + チャネルスキーマメタデータも含まれます。このスキーマには、UI で使われるものと同じラベルとヘルプテキストから派生したフィールド `title` / `description` メタデータが含まれ、対応するフィールドドキュメントが存在する場合は、ネストされたオブジェクト、ワイルドカード、配列項目、`anyOf` / `oneOf` / `allOf` 構成ブランチも含まれます。
    - `config.schema.lookup` は、1 つの構成パスに対してパススコープの lookup ペイロードを返します。正規化済みパス、浅いスキーマノード、一致したヒント + `hintPath`、UI/CLI ドリルダウン用の直接の子サマリーが含まれます。lookup スキーマノードは、ユーザー向けドキュメントと一般的な検証フィールド（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、数値/文字列/配列/オブジェクトの境界、`additionalProperties`、`deprecated`、`readOnly`、`writeOnly` などのフラグ）を保持します。子サマリーは、`key`、正規化済み `path`、`type`、`required`、`hasChildren` に加え、一致した `hint` / `hintPath` を公開します。
    - `update.run` は Gateway 更新フローを実行し、更新自体が成功した場合にのみ再起動をスケジュールします。パッケージマネージャー更新では、パッケージ差し替え後に非遅延かつクールダウンなしの更新再起動を強制するため、古い Gateway プロセスが置き換えられた `dist` ツリーから遅延読み込みを続けることはありません。
    - `update.status` は、利用可能な場合は再起動後の実行中バージョンを含め、最新のキャッシュ済み更新再起動 sentinel を返します。
    - `wizard.start`、`wizard.next`、`wizard.status`、`wizard.cancel` は、WS RPC 経由でオンボーディングウィザードを公開します。

  </Accordion>

  <Accordion title="エージェントとワークスペースヘルパー">
    - `agents.list` は、有効なモデルとランタイムメタデータを含む、構成済みエージェントエントリを返します。
    - `agents.create`、`agents.update`、`agents.delete` は、エージェントレコードとワークスペース配線を管理します。
    - `agents.files.list`、`agents.files.get`、`agents.files.set` は、エージェント向けに公開されるブートストラップワークスペースファイルを管理します。
    - `artifacts.list`、`artifacts.get`、`artifacts.download` は、明示的な `sessionKey`、`runId`、または `taskId` スコープに対して、トランスクリプト由来のアーティファクト概要とダウンロードを公開します。run と task のクエリは、所有するセッションをサーバー側で解決し、一致する来歴を持つトランスクリプトメディアのみを返します。安全でない URL ソースやローカル URL ソースは、サーバー側で取得する代わりに、サポート対象外のダウンロードを返します。
    - `agent.identity.get` は、エージェントまたはセッションの有効なアシスタント ID を返します。
    - `agent.wait` は、run の完了を待ち、利用可能な場合は終了時点のスナップショットを返します。

  </Accordion>

  <Accordion title="セッション制御">
    - `sessions.list` は、エージェントランタイムバックエンドが構成されている場合に行ごとの `agentRuntime` メタデータを含め、現在のセッションインデックスを返します。
    - `sessions.subscribe` と `sessions.unsubscribe` は、現在の WS クライアントに対するセッション変更イベント購読を切り替えます。
    - `sessions.messages.subscribe` と `sessions.messages.unsubscribe` は、1 つのセッションに対するトランスクリプト/メッセージイベント購読を切り替えます。
    - `sessions.preview` は、特定のセッションキーに対して境界付きのトランスクリプトプレビューを返します。
    - `sessions.describe` は、完全一致するセッションキーについて 1 つの Gateway セッション行を返します。
    - `sessions.resolve` は、セッションターゲットを解決または正規化します。
    - `sessions.create` は、新しいセッションエントリを作成します。
    - `sessions.send` は、既存のセッションへメッセージを送信します。
    - `sessions.steer` は、アクティブなセッション向けの中断して誘導するバリアントです。
    - `sessions.abort` は、セッションのアクティブな作業を中止します。呼び出し元は `key` と任意の `runId` を渡すか、Gateway がセッションへ解決できるアクティブな run については `runId` のみを渡せます。
    - `sessions.patch` は、セッションメタデータ/上書きを更新し、解決済みの正規モデルと有効な `agentRuntime` を報告します。
    - `sessions.reset`、`sessions.delete`、`sessions.compact` は、セッションメンテナンスを実行します。
    - `sessions.get` は、保存されている完全なセッション行を返します。
    - チャット実行では引き続き `chat.history`、`chat.send`、`chat.abort`、`chat.inject` を使用します。`chat.history` は UI クライアント向けに表示正規化されます。インラインディレクティブタグは表示テキストから削除され、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、切り詰められたツール呼び出しブロックを含む）と漏出した ASCII/全角モデル制御トークンは削除され、完全一致の `NO_REPLY` / `no_reply` などの純粋な silent-token アシスタント行は省略され、大きすぎる行はプレースホルダーに置き換えられることがあります。

  </Accordion>

  <Accordion title="デバイスペアリングとデバイストークン">
    - `device.pair.list` は、保留中および承認済みのペアリング済みデバイスを返します。
    - `device.pair.approve`、`device.pair.reject`、`device.pair.remove` は、デバイスペアリングレコードを管理します。
    - `device.token.rotate` は、承認済みロールと呼び出し元スコープの範囲内で、ペアリング済みデバイストークンをローテートします。
    - `device.token.revoke` は、承認済みロールと呼び出し元スコープの範囲内で、ペアリング済みデバイストークンを取り消します。

  </Accordion>

  <Accordion title="ノードペアリング、invoke、保留中作業">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove`、`node.pair.verify` は、ノードペアリングとブートストラップ検証を扱います。
    - `node.list` と `node.describe` は、既知/接続済みノードの状態を返します。
    - `node.rename` は、ペアリング済みノードのラベルを更新します。
    - `node.invoke` は、接続済みノードへコマンドを転送します。
    - `node.invoke.result` は、invoke リクエストの結果を返します。
    - `node.event` は、ノード由来イベントを Gateway へ戻します。
    - `node.canvas.capability.refresh` は、スコープ付き canvas-capability トークンを更新します。
    - `node.pending.pull` と `node.pending.ack` は、接続済みノードのキュー API です。
    - `node.pending.enqueue` と `node.pending.drain` は、オフライン/切断済みノード向けの永続的な保留中作業を管理します。

  </Accordion>

  <Accordion title="承認ファミリー">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list`、`exec.approval.resolve` は、1 回限りの exec 承認リクエストと保留中承認の検索/再生を扱います。
    - `exec.approval.waitDecision` は、1 つの保留中 exec 承認を待ち、最終決定（またはタイムアウト時は `null`）を返します。
    - `exec.approvals.get` と `exec.approvals.set` は、Gateway exec 承認ポリシースナップショットを管理します。
    - `exec.approvals.node.get` と `exec.approvals.node.set` は、ノードリレーコマンド経由でノードローカルの exec 承認ポリシーを管理します。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision`、`plugin.approval.resolve` は、Plugin 定義の承認フローを扱います。

  </Accordion>

  <Accordion title="自動化、Skills、ツール">
    - 自動化: `wake` は即時または次回 Heartbeat でのウェイクテキスト注入をスケジュールします。`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` はスケジュール済み作業を管理します。
    - Skills とツール: `commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。

  </Accordion>
</AccordionGroup>

### 一般的なイベントファミリー

- `chat`: `chat.inject` などの UI チャット更新、およびその他のトランスクリプト専用チャット
  イベント。
- `session.message` と `session.tool`: 購読中セッションのトランスクリプト/イベントストリーム更新。
- `sessions.changed`: セッションインデックスまたはメタデータが変更されました。
- `presence`: システムプレゼンススナップショット更新。
- `tick`: 定期的な keepalive / liveness イベント。
- `health`: Gateway ヘルススナップショット更新。
- `heartbeat`: Heartbeat イベントストリーム更新。
- `cron`: Cron run/job 変更イベント。
- `shutdown`: Gateway シャットダウン通知。
- `node.pair.requested` / `node.pair.resolved`: ノードペアリングのライフサイクル。
- `node.invoke.request`: ノード invoke リクエストのブロードキャスト。
- `device.pair.requested` / `device.pair.resolved`: ペアリング済みデバイスのライフサイクル。
- `voicewake.changed`: ウェイクワードトリガー構成が変更されました。
- `exec.approval.requested` / `exec.approval.resolved`: exec 承認
  ライフサイクル。
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin 承認
  ライフサイクル。

### ノードヘルパーメソッド

- ノードは `skills.bins` を呼び出して、自動許可チェック用の現在の skill 実行可能ファイル一覧を取得できます。

### オペレーターヘルパーメソッド

- オペレーターは `commands.list` (`operator.read`) を呼び出して、エージェントのランタイム
  コマンドインベントリを取得できます。
  - `agentId` は任意です。既定のエージェントワークスペースを読み取るには省略します。
  - `scope` は、主 `name` が対象にするサーフェスを制御します。
    - `text` は先頭の `/` を除いた主テキストコマンドトークンを返します
    - `native` と既定の `both` パスは、利用可能な場合にプロバイダー対応のネイティブ名を返します
  - `textAliases` は `/model` や `/m` などの正確なスラッシュエイリアスを保持します。
  - `nativeName` は、存在する場合にプロバイダー対応のネイティブコマンド名を保持します。
  - `provider` は任意で、ネイティブ名とネイティブPlugin
    コマンドの可用性にのみ影響します。
  - `includeArgs=false` は、シリアライズされた引数メタデータをレスポンスから省略します。
- オペレーターは `tools.catalog` (`operator.read`) を呼び出して、エージェントのランタイムツールカタログを取得できます。レスポンスには、グループ化されたツールと来歴メタデータが含まれます。
  - `source`: `core` または `plugin`
  - `pluginId`: `source="plugin"` の場合のplugin所有者
  - `optional`: pluginツールが任意かどうか
- オペレーターは `tools.effective` (`operator.read`) を呼び出して、セッションのランタイムで有効なツール
  インベントリを取得できます。
  - `sessionKey` は必須です。
  - Gateway は、呼び出し元から提供された認証または配信コンテキストを受け入れるのではなく、サーバー側のセッションから信頼済みランタイムコンテキストを導出します。
  - レスポンスはセッションスコープであり、コア、plugin、チャンネルツールを含め、アクティブな会話が現在使用できるものを反映します。
- オペレーターは `tools.invoke` (`operator.write`) を呼び出して、`/tools/invoke` と同じ
  Gateway ポリシーパスを通じて利用可能なツールを1つ呼び出せます。
  - `name` は必須です。`args`、`sessionKey`、`agentId`、`confirm`、および
    `idempotencyKey` は任意です。
  - `sessionKey` と `agentId` の両方が存在する場合、解決されたセッションエージェントは
    `agentId` と一致する必要があります。
  - レスポンスはSDK向けのエンベロープで、`ok`、`toolName`、任意の `output`、および型付き
    `error` フィールドを含みます。承認またはポリシーによる拒否は、Gateway ツールポリシーパイプラインを迂回するのではなく、ペイロード内で `ok:false` として返されます。
- オペレーターは `skills.status` (`operator.read`) を呼び出して、エージェントの可視
  skillインベントリを取得できます。
  - `agentId` は任意です。既定のエージェントワークスペースを読み取るには省略します。
  - レスポンスには、適格性、不足している要件、設定チェック、および
    生のシークレット値を公開しないサニタイズ済みインストールオプションが含まれます。
- オペレーターは ClawHub の発見メタデータ用に `skills.search` と `skills.detail` (`operator.read`) を呼び出せます。
- オペレーターは `skills.install` (`operator.admin`) を2つのモードで呼び出せます。
  - ClawHub モード: `{ source: "clawhub", slug, version?, force? }` は、
    skillフォルダーを既定のエージェントワークスペースの `skills/` ディレクトリにインストールします。
  - Gateway インストーラーモード: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` は、
    宣言された `metadata.openclaw.install` アクションをGatewayホスト上で実行します。
- オペレーターは `skills.update` (`operator.admin`) を2つのモードで呼び出せます。
  - ClawHub モードは、追跡対象のslugを1つ、または既定のエージェントワークスペース内の
    すべての追跡対象ClawHubインストールを更新します。
  - 設定モードは、`enabled`、`apiKey`、`env` などの `skills.entries.<skillKey>` 値にパッチを適用します。

### `models.list` ビュー

`models.list` は任意の `view` パラメーターを受け入れます。

- 省略または `"default"`: 現在のランタイム動作です。`agents.defaults.models` が設定されている場合、レスポンスは許可されたカタログになります。それ以外の場合、レスポンスは完全なGatewayカタログになります。
- `"configured"`: ピッカー向けサイズの動作です。`agents.defaults.models` が設定されている場合、それが引き続き優先されます。それ以外の場合、レスポンスは明示的な `models.providers.*.models` エントリを使用し、設定済みモデル行が存在しない場合にのみ完全なカタログへフォールバックします。
- `"all"`: 完全なGatewayカタログで、`agents.defaults.models` を迂回します。通常のモデルピッカーではなく、診断と発見UIに使用します。

## Exec 承認

- execリクエストに承認が必要な場合、Gateway は `exec.approval.requested` をブロードキャストします。
- オペレータークライアントは `exec.approval.resolve` を呼び出して解決します（`operator.approvals` スコープが必要）。
- `host=node` の場合、`exec.approval.request` には `systemRunPlan`（正規の `argv`/`cwd`/`rawCommand`/セッションメタデータ）を含める必要があります。`systemRunPlan` がないリクエストは拒否されます。
- 承認後、転送された `node.invoke system.run` 呼び出しは、その正規の
  `systemRunPlan` を権威あるコマンド/cwd/セッションコンテキストとして再利用します。
- 呼び出し元が準備から最終承認済み `system.run` 転送までの間に `command`、`rawCommand`、`cwd`、`agentId`、または
  `sessionKey` を変更した場合、Gateway は変更されたペイロードを信頼せず、その実行を拒否します。

## エージェント配信フォールバック

- `agent` リクエストには、アウトバウンド配信を要求するために `deliver=true` を含めることができます。
- `bestEffortDeliver=false` は厳密な動作を維持します。解決できない配信ターゲットまたは内部専用の配信ターゲットは `INVALID_REQUEST` を返します。
- `bestEffortDeliver=true` は、外部配信可能なルートを解決できない場合（たとえば、内部/webchatセッションまたは曖昧なマルチチャンネル設定）、セッションのみの実行へのフォールバックを許可します。

## バージョニング

- `PROTOCOL_VERSION` は `src/gateway/protocol/schema/protocol-schemas.ts` にあります。
- クライアントは `minProtocol` + `maxProtocol` を送信し、サーバーは不一致を拒否します。
- スキーマとモデルはTypeBox定義から生成されます。
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### クライアント定数

`src/gateway/client.ts` のリファレンスクライアントはこれらの既定値を使用します。値は
プロトコル v3 全体で安定しており、サードパーティクライアントの想定ベースラインです。

| 定数                                      | 既定値                                                | ソース                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| リクエストタイムアウト（RPCごと）         | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| 事前認証 / 接続チャレンジタイムアウト     | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts`（config/env により、対応するサーバー/クライアント予算を引き上げ可能） |
| 初期再接続バックオフ                      | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| 最大再接続バックオフ                      | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| デバイストークン切断後の高速リトライ上限 | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` 前の強制停止猶予            | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` 既定タイムアウト          | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| 既定tick間隔（`hello-ok` 前）             | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| tickタイムアウト切断                      | 無音が `tickIntervalMs * 2` を超えた場合のcode `4000` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

サーバーは有効な `policy.tickIntervalMs`、`policy.maxPayload`、
および `policy.maxBufferedBytes` を `hello-ok` で通知します。クライアントは
ハンドシェイク前の既定値ではなく、これらの値に従う必要があります。

## 認証

- 共有シークレット Gateway 認証は、構成された認証モードに応じて `connect.params.auth.token` または
  `connect.params.auth.password` を使用します。
- Tailscale Serve
  (`gateway.auth.allowTailscale: true`) や非ループバックの
  `gateway.auth.mode: "trusted-proxy"` など、ID を持つモードは、
  `connect.params.auth.*` ではなくリクエストヘッダーから接続認証チェックを満たします。
- プライベート入口の `gateway.auth.mode: "none"` は、共有シークレット接続認証を
  完全にスキップします。このモードを公開または信頼されていない入口で公開しないでください。
- ペアリング後、Gateway は接続のロール + スコープに限定された **デバイストークン** を発行します。
  これは `hello-ok.auth.deviceToken` で返され、将来の接続のためにクライアントで
  永続化する必要があります。
- クライアントは、成功した接続の後に必ず主要な `hello-ok.auth.deviceToken` を永続化する必要があります。
- その **保存済み** デバイストークンで再接続する場合、そのトークン用に保存された
  承認済みスコープセットも再利用する必要があります。これにより、すでに許可されていた
  読み取り/プローブ/ステータスアクセスが保持され、再接続が暗黙の admin 専用スコープへ
  知らないうちに狭められることを防ぎます。
- クライアント側の接続認証組み立て (`src/gateway/client.ts` の
  `selectConnectAuth`):
  - `auth.password` は直交しており、設定されている場合は常に転送されます。
  - `auth.token` は優先順位に従って設定されます。明示的な共有トークンが最優先で、
    次に明示的な `deviceToken`、その次に保存済みのデバイス単位トークン
    (`deviceId` + `role` によるキー) です。
  - `auth.bootstrapToken` は、上記のいずれでも `auth.token` が解決されなかった場合にのみ送信されます。
    共有トークンまたは解決済みの任意のデバイストークンがある場合、これは抑制されます。
  - 一度きりの `AUTH_TOKEN_MISMATCH` 再試行で保存済みデバイストークンを自動昇格する処理は、
    **信頼済みエンドポイントのみ** に限定されます。
    つまり、ループバック、または固定された `tlsFingerprint` を持つ `wss://` です。ピン留めのない公開 `wss://`
    は該当しません。
- 追加の `hello-ok.auth.deviceTokens` エントリは、ブートストラップ引き渡しトークンです。
  接続でブートストラップ認証が使用され、`wss://` やループバック/ローカルペアリングなどの
  信頼済みトランスポート上にある場合にのみ永続化してください。
- クライアントが **明示的な** `deviceToken` または明示的な `scopes` を提供した場合、
  その呼び出し元が要求したスコープセットが権威を持ちます。キャッシュされたスコープは、
  クライアントが保存済みのデバイス単位トークンを再利用している場合にのみ再利用されます。
- デバイストークンは `device.token.rotate` と
  `device.token.revoke` でローテーション/失効できます (`operator.pairing` スコープが必要)。
- `device.token.rotate` はローテーションメタデータを返します。同じデバイストークンで
  すでに認証されている同一デバイス呼び出しの場合にのみ、置き換え用の bearer token をエコーします。
  これにより、トークンのみのクライアントは再接続前に置き換えを永続化できます。
  共有/admin ローテーションでは bearer token はエコーされません。
- トークンの発行、ローテーション、失効は、そのデバイスのペアリングエントリに記録された
  承認済みロールセットの範囲内に保たれます。トークン変更によって、ペアリング承認で
  許可されていないデバイスロールへ拡張したり、それを対象にしたりすることはできません。
- ペアリング済みデバイストークンセッションでは、呼び出し元が `operator.admin` も持つ場合を除き、
  デバイス管理は自己スコープです。非 admin 呼び出し元が削除/失効/ローテーションできるのは、
  **自分自身の** デバイスエントリのみです。
- `device.token.rotate` と `device.token.revoke` は、対象の operator
  トークンスコープセットを呼び出し元の現在のセッションスコープとも照合します。非 admin 呼び出し元は、
  自分がすでに保持しているものより広い operator トークンをローテーションまたは失効できません。
- 認証失敗には `error.details.code` と復旧ヒントが含まれます。
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` に対するクライアント動作:
  - 信頼済みクライアントは、キャッシュ済みのデバイス単位トークンで上限付きの再試行を 1 回試みることができます。
  - その再試行が失敗した場合、クライアントは自動再接続ループを停止し、operator の対応ガイダンスを表示する必要があります。

## デバイス ID + ペアリング

- ノードは、キーペア fingerprint から派生した安定したデバイス ID (`device.id`) を含める必要があります。
- Gateway はデバイス + ロールごとにトークンを発行します。
- ローカル自動承認が有効でない限り、新しいデバイス ID にはペアリング承認が必要です。
- ペアリングの自動承認は、直接の local loopback 接続を中心にしています。
- OpenClaw には、信頼済み共有シークレットヘルパーフロー向けの、狭いバックエンド/コンテナローカル自己接続パスもあります。
- 同一ホストの tailnet または LAN 接続も、ペアリングでは引き続きリモートとして扱われ、
  承認が必要です。
- WS クライアントは通常、`connect` 中に `device` ID を含めます (operator +
  ノード)。デバイスなしの operator 例外は、明示的な信頼パスのみです。
  - localhost 専用の安全でない HTTP 互換性のための `gateway.controlUi.allowInsecureAuth=true`。
  - 成功した `gateway.auth.mode: "trusted-proxy"` operator Control UI 認証。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (緊急回避、重大なセキュリティ低下)。
  - 共有 Gateway トークン/パスワードで認証された、直接ループバックの `gateway-client` バックエンド RPC。
- すべての接続は、サーバーが提供する `connect.challenge` nonce に署名する必要があります。

### デバイス認証移行診断

チャレンジ前の署名動作をまだ使用しているレガシークライアント向けに、`connect` は現在、
安定した `error.details.reason` とともに `error.details.code` 配下で
`DEVICE_AUTH_*` detail code を返します。

一般的な移行失敗:

| メッセージ                  | details.code                     | details.reason           | 意味                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | クライアントが `device.nonce` を省略した (または空で送信した)。 |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | クライアントが古い/誤った nonce で署名した。       |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 署名ペイロードが v2 ペイロードと一致しない。       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 署名済みタイムスタンプが許容 skew の範囲外です。   |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` が公開鍵 fingerprint と一致しない。    |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開鍵の形式/正規化に失敗した。                   |

移行先:

- 常に `connect.challenge` を待ちます。
- サーバー nonce を含む v2 ペイロードに署名します。
- 同じ nonce を `connect.params.device.nonce` で送信します。
- 推奨される署名ペイロードは `v3` で、device/client/role/scopes/token/nonce フィールドに加えて
  `platform` と `deviceFamily` もバインドします。
- 互換性のためレガシー `v2` 署名は引き続き受け付けられますが、再接続時のコマンドポリシーは
  ペアリング済みデバイスのメタデータピン留めによって引き続き制御されます。

## TLS + ピン留め

- TLS は WS 接続でサポートされています。
- クライアントは任意で Gateway 証明書 fingerprint をピン留めできます (`gateway.tls`
  設定に加えて `gateway.remote.tlsFingerprint` または CLI `--tls-fingerprint` を参照)。

## スコープ

このプロトコルは **完全な Gateway API** (ステータス、チャンネル、モデル、チャット、
エージェント、セッション、ノード、承認など) を公開します。正確な表面は
`src/gateway/protocol/schema.ts` の TypeBox スキーマで定義されています。

## 関連

- [ブリッジプロトコル](/ja-JP/gateway/bridge-protocol)
- [Gateway ランブック](/ja-JP/gateway)
