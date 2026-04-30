---
read_when:
    - Gateway WS クライアントの実装または更新
    - プロトコルの不一致や接続失敗のデバッグ
    - プロトコルスキーマ/モデルの再生成
summary: 'Gateway WebSocketプロトコル: ハンドシェイク、フレーム、バージョン管理'
title: Gateway プロトコル
x-i18n:
    generated_at: "2026-04-30T05:15:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0d922e9b4b778c333873e551498b905461f30f944e809555b45669ae2f5c404
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS プロトコルは、OpenClaw の**単一のコントロールプレーン + ノードトランスポート**です。すべてのクライアント（CLI、Web UI、macOS アプリ、iOS/Android ノード、ヘッドレスノード）は WebSocket 経由で接続し、ハンドシェイク時に自身の**ロール** + **スコープ**を宣言します。

## トランスポート

- WebSocket、JSON ペイロードを持つテキストフレーム。
- 最初のフレームは**必ず** `connect` リクエストでなければなりません。
- 接続前フレームは 64 KiB に制限されます。ハンドシェイクが成功した後、クライアントは `hello-ok.policy.maxPayload` と `hello-ok.policy.maxBufferedBytes` の制限に従う必要があります。診断が有効な場合、過大な受信フレームと遅い送信バッファーは、gateway が対象フレームを閉じるか破棄する前に `payload.large` イベントを発行します。これらのイベントは、サイズ、制限、サーフェス、安全な理由コードを保持します。メッセージ本文、添付ファイルの内容、生フレーム本文、トークン、Cookie、秘密値は保持しません。

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

Gateway がまだ起動サイドカーの完了処理中の場合、`connect` リクエストは、`details.reason` が `"startup-sidecars"` に設定され、`retryAfterMs` を含む、再試行可能な `UNAVAILABLE` エラーを返すことがあります。クライアントは、その応答を最終的なハンドシェイク失敗として表面化させるのではなく、全体の接続予算内で再試行する必要があります。

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

信頼された同一プロセスのバックエンドクライアント（`client.id: "gateway-client"`、`client.mode: "backend"`）は、共有 gateway トークン/パスワードで認証する場合、直接ループバック接続で `device` を省略できます。この経路は内部コントロールプレーン RPC 用に予約されており、古い CLI/デバイスペアリングのベースラインが、サブエージェントセッション更新などのローカルバックエンド作業をブロックしないようにします。リモートクライアント、ブラウザーオリジンのクライアント、ノードクライアント、および明示的なデバイストークン/デバイス ID クライアントは、引き続き通常のペアリングとスコープアップグレードのチェックを使用します。

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

信頼されたブートストラップ引き渡し中、`hello-ok.auth` には `deviceTokens` に追加の境界付きロールエントリが含まれる場合もあります。

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

組み込みのノード/オペレーターブートストラップフローでは、プライマリノードトークンは `scopes: []` のままで、引き渡されたオペレータートークンはブートストラップオペレーターの許可リスト（`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`）に境界付けられたままです。ブートストラップスコープチェックはロールプレフィックス付きのままです。operator エントリは operator リクエストのみを満たし、operator 以外のロールは引き続き自身のロールプレフィックス配下のスコープを必要とします。

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

副作用のあるメソッドには**冪等性キー**が必要です（スキーマを参照）。

## ロール + スコープ

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

`includeSecrets: true` を指定した `talk.config` には `operator.talk.secrets`（または `operator.admin`）が必要です。

Plugin 登録の gateway RPC メソッドは独自の operator スコープを要求できますが、予約済みのコア管理プレフィックス（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は常に `operator.admin` に解決されます。

メソッドスコープは最初のゲートにすぎません。`chat.send` を通じて到達する一部のスラッシュコマンドでは、その上により厳格なコマンドレベルのチェックが適用されます。たとえば、永続的な `/config set` と `/config unset` の書き込みには `operator.admin` が必要です。

`node.pair.approve` には、基本メソッドスコープに加えて、承認時の追加スコープチェックもあります。

- コマンドなしリクエスト: `operator.pairing`
- exec 以外のノードコマンドを含むリクエスト: `operator.pairing` + `operator.write`
- `system.run`、`system.run.prepare`、または `system.which` を含むリクエスト:
  `operator.pairing` + `operator.admin`

### caps/commands/permissions（node）

ノードは接続時に機能要求を宣言します。

- `caps`: 高レベルの機能カテゴリ。
- `commands`: invoke のコマンド許可リスト。
- `permissions`: 詳細な切り替え（例: `screen.record`、`camera.capture`）。

Gateway はこれらを**要求**として扱い、サーバー側の許可リストを強制します。

## プレゼンス

- `system-presence` はデバイス ID をキーにしたエントリを返します。
- プレゼンスエントリには `deviceId`、`roles`、`scopes` が含まれるため、UI は同じデバイスが **operator** と **node** の両方として接続している場合でも、デバイスごとに 1 行で表示できます。
- `node.list` には任意の `lastSeenAtMs` と `lastSeenReason` フィールドが含まれます。接続中のノードは、現在の接続時刻を理由 `connect` とともに `lastSeenAtMs` として報告します。ペアリング済みノードは、信頼されたノードイベントがペアリングメタデータを更新したときに、永続的なバックグラウンドプレゼンスも報告できます。

### ノードバックグラウンド生存イベント

ノードは `event: "node.presence.alive"` を指定して `node.event` を呼び出し、ペアリング済みノードがバックグラウンドウェイク中に生存していたことを、接続済みとしてマークせずに記録できます。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` は閉じた列挙型です: `background`、`silent_push`、`bg_app_refresh`、`significant_location`、`manual`、または `connect`。未知のトリガー文字列は、永続化前に gateway によって `background` に正規化されます。このイベントは認証済みノードデバイスセッションでのみ永続化されます。デバイスなし、または未ペアリングのセッションは `handled: false` を返します。

成功した gateway は構造化された結果を返します。

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

古い gateway は `node.event` に対してまだ `{ "ok": true }` を返す場合があります。クライアントはそれを、永続的なプレゼンス永続化ではなく、承認済み RPC として扱う必要があります。

## ブロードキャストイベントのスコープ設定

サーバーからプッシュされる WebSocket ブロードキャストイベントはスコープでゲートされるため、ペアリングスコープまたはノード専用セッションがセッション内容を受動的に受け取ることはありません。

- **チャット、エージェント、ツール結果フレーム**（ストリーミングされた `agent` イベントとツール呼び出し結果を含む）には、少なくとも `operator.read` が必要です。`operator.read` を持たないセッションは、これらのフレームを完全にスキップします。
- **Plugin 定義の `plugin.*` ブロードキャスト**は、Plugin が登録した方法に応じて `operator.write` または `operator.admin` にゲートされます。
- **ステータスおよびトランスポートイベント**（`heartbeat`、`presence`、`tick`、接続/切断ライフサイクルなど）は、すべての認証済みセッションがトランスポートの健全性を観測できるように、制限なしのままです。
- **未知のブロードキャストイベントファミリー**は、登録済みハンドラーが明示的に緩和しない限り、デフォルトでスコープゲートされます（フェイルクローズ）。

各クライアント接続はクライアントごとの独自のシーケンス番号を保持するため、異なるクライアントがイベントストリームの異なるスコープフィルター済みサブセットを見る場合でも、ブロードキャストはそのソケット上で単調な順序を維持します。

## 一般的な RPC メソッドファミリー

公開 WS サーフェスは、上記のハンドシェイク/認証例よりも広範です。これは生成されたダンプではありません。`hello-ok.features.methods` は、`src/gateway/server-methods-list.ts` と読み込まれた Plugin/チャネルメソッドエクスポートから構築される保守的な検出リストです。`src/gateway/server-methods/*.ts` の完全な列挙ではなく、機能検出として扱ってください。

<AccordionGroup>
  <Accordion title="システムと ID">
    - `health` はキャッシュ済み、または新たにプローブされた gateway ヘルススナップショットを返します。
    - `diagnostics.stability` は、最近の境界付き診断安定性レコーダーを返します。イベント名、件数、バイトサイズ、メモリ読み取り値、キュー/セッション状態、チャネル/Plugin 名、セッション ID などの運用メタデータを保持します。チャットテキスト、webhook 本文、ツール出力、生のリクエスト本文またはレスポンス本文、トークン、Cookie、秘密値は保持しません。operator read スコープが必要です。
    - `status` は `/status` スタイルの gateway サマリーを返します。機密フィールドは admin スコープの operator クライアントにのみ含まれます。
    - `gateway.identity.get` は、リレーおよびペアリングフローで使用される gateway デバイス ID を返します。
    - `system-presence` は、接続中の operator/node デバイスの現在のプレゼンススナップショットを返します。
    - `system-event` はシステムイベントを追加し、プレゼンスコンテキストを更新/ブロードキャストできます。
    - `last-heartbeat` は最新の永続化された Heartbeat イベントを返します。
    - `set-heartbeats` は gateway 上の Heartbeat 処理を切り替えます。

  </Accordion>

  <Accordion title="モデルと使用状況">
    - `models.list` は、ランタイムで許可されたモデルカタログを返します。ピッカー向けサイズの構成済みモデル（まず `agents.defaults.models`、次に `models.providers.*.models`）には `{ "view": "configured" }` を渡し、完全なカタログには `{ "view": "all" }` を渡します。
    - `usage.status` は、プロバイダーの使用状況ウィンドウ/残りクォータの概要を返します。
    - `usage.cost` は、日付範囲に対する集計済みコスト使用状況の概要を返します。
    - `doctor.memory.status` は、アクティブなデフォルトエージェントワークスペースのベクトルメモリ / キャッシュ済み埋め込みの準備状態を返します。呼び出し元がライブ埋め込みプロバイダーへの ping を明示的に要求する場合のみ、`{ "probe": true }` または `{ "deep": true }` を渡します。
    - `doctor.memory.remHarness` は、リモート制御プレーンのクライアント向けに、範囲制限された読み取り専用の REM ハーネスプレビューを返します。ワークスペースパス、メモリスニペット、レンダリング済みの根拠付きマークダウン、深いプロモーション候補を含むことがあるため、呼び出し元には `operator.read` が必要です。
    - `sessions.usage` は、セッションごとの使用状況の概要を返します。
    - `sessions.usage.timeseries` は、1つのセッションの時系列使用状況を返します。
    - `sessions.usage.logs` は、1つのセッションの使用状況ログエントリを返します。

  </Accordion>

  <Accordion title="チャネルとログインヘルパー">
    - `channels.status` は、組み込み + バンドル済みチャネル/Plugin のステータス概要を返します。
    - `channels.logout` は、チャネルがログアウトをサポートしている場合に、特定のチャネル/アカウントをログアウトします。
    - `web.login.start` は、現在の QR 対応 Web チャネルプロバイダーの QR/Web ログインフローを開始します。
    - `web.login.wait` は、その QR/Web ログインフローの完了を待機し、成功時にチャネルを開始します。
    - `push.test` は、登録済み iOS ノードにテスト APNs プッシュを送信します。
    - `voicewake.get` は、保存済みのウェイクワードトリガーを返します。
    - `voicewake.set` は、ウェイクワードトリガーを更新し、変更をブロードキャストします。

  </Accordion>

  <Accordion title="メッセージングとログ">
    - `send` は、チャットランナー外でチャネル/アカウント/スレッドを対象に送信するための、直接アウトバウンド配信 RPC です。
    - `logs.tail` は、カーソル/リミットと最大バイト数の制御を備えた、構成済み Gateway ファイルログの末尾を返します。

  </Accordion>

  <Accordion title="Talk と TTS">
    - `talk.config` は、有効な Talk 設定ペイロードを返します。`includeSecrets` には `operator.talk.secrets`（または `operator.admin`）が必要です。
    - `talk.mode` は、WebChat/Control UI クライアント向けに現在の Talk モード状態を設定/ブロードキャストします。
    - `talk.speak` は、アクティブな Talk 音声プロバイダーを通じて音声を合成します。
    - `tts.status` は、TTS の有効状態、アクティブなプロバイダー、フォールバックプロバイダー、プロバイダー設定状態を返します。
    - `tts.providers` は、表示可能な TTS プロバイダーインベントリを返します。
    - `tts.enable` と `tts.disable` は、TTS 設定状態を切り替えます。
    - `tts.setProvider` は、優先 TTS プロバイダーを更新します。
    - `tts.convert` は、1回限りのテキスト読み上げ変換を実行します。

  </Accordion>

  <Accordion title="シークレット、設定、更新、ウィザード">
    - `secrets.reload` は、アクティブな SecretRefs を再解決し、完全に成功した場合のみランタイムのシークレット状態を差し替えます。
    - `secrets.resolve` は、特定のコマンド/ターゲットセットに対するコマンド対象のシークレット割り当てを解決します。
    - `config.get` は、現在の設定スナップショットとハッシュを返します。
    - `config.set` は、検証済みの設定ペイロードを書き込みます。
    - `config.patch` は、部分的な設定更新をマージします。
    - `config.apply` は、完全な設定ペイロードを検証して置き換えます。
    - `config.schema` は、Control UI と CLI ツールが使用するライブ設定スキーマペイロードを返します。スキーマ、`uiHints`、バージョン、生成メタデータに加えて、ランタイムが読み込める場合は Plugin + チャネルのスキーマメタデータも含みます。このスキーマには、UI で使用される同じラベルとヘルプテキストから派生したフィールドの `title` / `description` メタデータが含まれます。対応するフィールドドキュメントが存在する場合は、ネストされたオブジェクト、ワイルドカード、配列項目、`anyOf` / `oneOf` / `allOf` の合成ブランチも含まれます。
    - `config.schema.lookup` は、1つの設定パスに対するパススコープのルックアップペイロードを返します。正規化されたパス、浅いスキーマノード、一致したヒント + `hintPath`、UI/CLI のドリルダウン向けの直接の子要素概要を含みます。ルックアップスキーマノードは、ユーザー向けドキュメントと共通の検証フィールド（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、数値/文字列/配列/オブジェクトの境界、および `additionalProperties`、`deprecated`、`readOnly`、`writeOnly` などのフラグ）を保持します。子要素概要は、`key`、正規化された `path`、`type`、`required`、`hasChildren`、および一致した `hint` / `hintPath` を公開します。
    - `update.run` は、Gateway 更新フローを実行し、更新自体が成功した場合のみ再起動をスケジュールします。
    - `update.status` は、利用可能な場合は再起動後に稼働中のバージョンを含め、最新のキャッシュ済み更新再起動センチネルを返します。
    - `wizard.start`、`wizard.next`、`wizard.status`、`wizard.cancel` は、オンボーディングウィザードを WS RPC 経由で公開します。

  </Accordion>

  <Accordion title="エージェントとワークスペースのヘルパー">
    - `agents.list` は、有効なモデルとランタイムメタデータを含む、構成済みエージェントエントリを返します。
    - `agents.create`、`agents.update`、`agents.delete` は、エージェントレコードとワークスペースの配線を管理します。
    - `agents.files.list`、`agents.files.get`、`agents.files.set` は、エージェント向けに公開されるブートストラップワークスペースファイルを管理します。
    - `agent.identity.get` は、エージェントまたはセッションに対する有効なアシスタント ID を返します。
    - `agent.wait` は、実行の終了を待機し、利用可能な場合は終了時のスナップショットを返します。

  </Accordion>

  <Accordion title="セッション制御">
    - `sessions.list` は、現在のセッションインデックスを返します。エージェントランタイムバックエンドが構成されている場合は、各行の `agentRuntime` メタデータも含みます。
    - `sessions.subscribe` と `sessions.unsubscribe` は、現在の WS クライアントに対するセッション変更イベント購読を切り替えます。
    - `sessions.messages.subscribe` と `sessions.messages.unsubscribe` は、1つのセッションに対するトランスクリプト/メッセージイベント購読を切り替えます。
    - `sessions.preview` は、特定のセッションキーに対する範囲制限されたトランスクリプトプレビューを返します。
    - `sessions.resolve` は、セッションターゲットを解決または正規化します。
    - `sessions.create` は、新しいセッションエントリを作成します。
    - `sessions.send` は、既存のセッションにメッセージを送信します。
    - `sessions.steer` は、アクティブなセッション向けの中断して誘導するバリアントです。
    - `sessions.abort` は、セッションのアクティブな作業を中止します。呼び出し元は `key` と任意の `runId` を渡すか、Gateway がセッションへ解決できるアクティブな実行については `runId` のみを渡すことができます。
    - `sessions.patch` は、セッションのメタデータ/オーバーライドを更新し、解決済みの正規モデルと有効な `agentRuntime` を報告します。
    - `sessions.reset`、`sessions.delete`、`sessions.compact` は、セッションのメンテナンスを実行します。
    - `sessions.get` は、保存済みの完全なセッション行を返します。
    - チャット実行では引き続き `chat.history`、`chat.send`、`chat.abort`、`chat.inject` を使用します。`chat.history` は UI クライアント向けに表示正規化されます。インラインディレクティブタグは表示テキストから取り除かれ、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、切り詰められたツール呼び出しブロックを含む）と漏れた ASCII/全角のモデル制御トークンは取り除かれ、正確に `NO_REPLY` / `no_reply` であるような純粋なサイレントトークンのアシスタント行は省略され、過大な行はプレースホルダーで置き換えられることがあります。

  </Accordion>

  <Accordion title="デバイスペアリングとデバイストークン">
    - `device.pair.list` は、保留中および承認済みのペアリング済みデバイスを返します。
    - `device.pair.approve`、`device.pair.reject`、`device.pair.remove` は、デバイスペアリングレコードを管理します。
    - `device.token.rotate` は、承認済みロールと呼び出し元のスコープ境界内で、ペアリング済みデバイストークンをローテーションします。
    - `device.token.revoke` は、承認済みロールと呼び出し元のスコープ境界内で、ペアリング済みデバイストークンを取り消します。

  </Accordion>

  <Accordion title="ノードペアリング、呼び出し、保留中の作業">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove`、`node.pair.verify` は、ノードペアリングとブートストラップ検証を扱います。
    - `node.list` と `node.describe` は、既知/接続済みノードの状態を返します。
    - `node.rename` は、ペアリング済みノードのラベルを更新します。
    - `node.invoke` は、接続済みノードにコマンドを転送します。
    - `node.invoke.result` は、呼び出しリクエストの結果を返します。
    - `node.event` は、ノード起点のイベントを Gateway に戻します。
    - `node.canvas.capability.refresh` は、スコープ付きキャンバス機能トークンを更新します。
    - `node.pending.pull` と `node.pending.ack` は、接続済みノードのキュー API です。
    - `node.pending.enqueue` と `node.pending.drain` は、オフライン/切断済みノード向けの永続的な保留中作業を管理します。

  </Accordion>

  <Accordion title="承認ファミリー">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list`、`exec.approval.resolve` は、1回限りの exec 承認リクエストと、保留中の承認の検索/再生を扱います。
    - `exec.approval.waitDecision` は、1つの保留中 exec 承認を待機し、最終決定（またはタイムアウト時は `null`）を返します。
    - `exec.approvals.get` と `exec.approvals.set` は、Gateway exec 承認ポリシースナップショットを管理します。
    - `exec.approvals.node.get` と `exec.approvals.node.set` は、ノードリレーコマンドを介してノードローカル exec 承認ポリシーを管理します。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision`、`plugin.approval.resolve` は、Plugin 定義の承認フローを扱います。

  </Accordion>

  <Accordion title="自動化、Skills、ツール">
    - 自動化: `wake` は、即時または次回 Heartbeat のウェイクテキスト挿入をスケジュールします。`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` は、スケジュール済み作業を管理します。
    - Skills とツール: `commands.list`、`skills.*`、`tools.catalog`、`tools.effective`。

  </Accordion>
</AccordionGroup>

### 共通イベントファミリー

- `chat`: `chat.inject` などの UI チャット更新、およびその他のトランスクリプト専用チャットイベント。
- `session.message` と `session.tool`: 購読済みセッションのトランスクリプト/イベントストリーム更新。
- `sessions.changed`: セッションインデックスまたはメタデータが変更されました。
- `presence`: システムプレゼンススナップショット更新。
- `tick`: 定期的な keepalive / 生存確認イベント。
- `health`: Gateway ヘルススナップショット更新。
- `heartbeat`: Heartbeat イベントストリーム更新。
- `cron`: Cron 実行/ジョブ変更イベント。
- `shutdown`: Gateway シャットダウン通知。
- `node.pair.requested` / `node.pair.resolved`: ノードペアリングのライフサイクル。
- `node.invoke.request`: ノード呼び出しリクエストのブロードキャスト。
- `device.pair.requested` / `device.pair.resolved`: ペアリング済みデバイスのライフサイクル。
- `voicewake.changed`: ウェイクワードトリガー設定が変更されました。
- `exec.approval.requested` / `exec.approval.resolved`: exec 承認のライフサイクル。
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin 承認のライフサイクル。

### ノードヘルパーメソッド

- ノードは、自動許可チェック向けに現在の Skills 実行可能ファイル一覧を取得するため、`skills.bins` を呼び出すことができます。

### オペレーターヘルパーメソッド

- オペレーターは `commands.list`（`operator.read`）を呼び出して、エージェントのランタイム
  コマンドインベントリを取得できます。
  - `agentId` は任意です。デフォルトのエージェントワークスペースを読み取るには省略します。
  - `scope` は、主 `name` が対象にするサーフェスを制御します。
    - `text` は、先頭の `/` を除いた主テキストコマンドトークンを返します
    - `native` とデフォルトの `both` パスは、利用可能な場合にプロバイダー対応のネイティブ名を返します
  - `textAliases` は `/model` や `/m` などの正確なスラッシュエイリアスを保持します。
  - `nativeName` は、存在する場合にプロバイダー対応のネイティブコマンド名を保持します。
  - `provider` は任意で、ネイティブ命名とネイティブ Plugin
    コマンドの利用可否にのみ影響します。
  - `includeArgs=false` は、シリアライズされた引数メタデータをレスポンスから省略します。
- オペレーターは `tools.catalog`（`operator.read`）を呼び出して、エージェントのランタイムツールカタログを取得できます。レスポンスには、グループ化されたツールと来歴メタデータが含まれます。
  - `source`: `core` または `plugin`
  - `pluginId`: `source="plugin"` の場合の Plugin 所有者
  - `optional`: Plugin ツールが任意かどうか
- オペレーターは `tools.effective`（`operator.read`）を呼び出して、セッションでランタイム上有効なツール
  インベントリを取得できます。
  - `sessionKey` は必須です。
  - Gateway は、呼び出し元から提供された認証または配信コンテキストを受け入れる代わりに、セッションから信頼済みランタイムコンテキストをサーバー側で導出します。
  - レスポンスはセッションスコープであり、コア、Plugin、チャネルツールを含め、アクティブな会話が現時点で使用できるものを反映します。
- オペレーターは `skills.status`（`operator.read`）を呼び出して、エージェントで表示可能な
  スキルインベントリを取得できます。
  - `agentId` は任意です。デフォルトのエージェントワークスペースを読み取るには省略します。
  - レスポンスには、適格性、不足している要件、設定チェック、および
    生のシークレット値を公開しないサニタイズ済みインストールオプションが含まれます。
- オペレーターは ClawHub の検出メタデータ用に `skills.search` と `skills.detail`（`operator.read`）を呼び出せます。
- オペレーターは `skills.install`（`operator.admin`）を 2 つのモードで呼び出せます。
  - ClawHub モード: `{ source: "clawhub", slug, version?, force? }` は、
    デフォルトのエージェントワークスペースの `skills/` ディレクトリにスキルフォルダーをインストールします。
  - Gateway インストーラーモード: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    は、Gateway ホスト上で宣言済みの `metadata.openclaw.install` アクションを実行します。
- オペレーターは `skills.update`（`operator.admin`）を 2 つのモードで呼び出せます。
  - ClawHub モードは、デフォルトのエージェントワークスペース内で、追跡対象の 1 つの slug または追跡対象のすべての ClawHub インストールを更新します。
  - 設定モードは、`enabled`、`apiKey`、`env` などの `skills.entries.<skillKey>` 値にパッチを適用します。

### `models.list` ビュー

`models.list` は任意の `view` パラメーターを受け付けます。

- 省略または `"default"`: 現在のランタイム動作です。`agents.defaults.models` が設定されている場合、レスポンスは許可されたカタログになります。それ以外の場合、レスポンスは完全な Gateway カタログになります。
- `"configured"`: ピッカー向けサイズの動作です。`agents.defaults.models` が設定されている場合は、引き続きそれが優先されます。それ以外の場合、レスポンスは明示的な `models.providers.*.models` エントリを使用し、設定済みモデル行が存在しない場合にのみ完全なカタログへフォールバックします。
- `"all"`: 完全な Gateway カタログで、`agents.defaults.models` をバイパスします。通常のモデルピッカーではなく、診断および検出 UI に使用してください。

## 実行承認

- exec リクエストが承認を必要とする場合、Gateway は `exec.approval.requested` をブロードキャストします。
- オペレータークライアントは `exec.approval.resolve`（`operator.approvals` スコープが必要）を呼び出して解決します。
- `host=node` の場合、`exec.approval.request` には `systemRunPlan`（正規の `argv`/`cwd`/`rawCommand`/セッションメタデータ）を含める必要があります。`systemRunPlan` がないリクエストは拒否されます。
- 承認後、転送された `node.invoke system.run` 呼び出しは、その正規の
  `systemRunPlan` を信頼できるコマンド/cwd/セッションコンテキストとして再利用します。
- 呼び出し元が prepare と最終的な承認済み `system.run` 転送の間に `command`、`rawCommand`、`cwd`、`agentId`、または
  `sessionKey` を変更した場合、Gateway は変更されたペイロードを信頼せず、実行を拒否します。

## エージェント配信フォールバック

- `agent` リクエストには、アウトバウンド配信を要求するために `deliver=true` を含めることができます。
- `bestEffortDeliver=false` は厳格な動作を維持します。解決できない配信先または内部専用の配信先は `INVALID_REQUEST` を返します。
- `bestEffortDeliver=true` は、外部へ配信可能なルートを解決できない場合（たとえば内部/webchat セッションや曖昧なマルチチャネル設定）、セッションのみの実行へのフォールバックを許可します。

## バージョニング

- `PROTOCOL_VERSION` は `src/gateway/protocol/schema/protocol-schemas.ts` にあります。
- クライアントは `minProtocol` + `maxProtocol` を送信し、サーバーは不一致を拒否します。
- スキーマ + モデルは TypeBox 定義から生成されます。
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### クライアント定数

`src/gateway/client.ts` のリファレンスクライアントは、これらのデフォルトを使用します。値は
protocol v3 全体で安定しており、サードパーティクライアントの想定ベースラインです。

| 定数                                      | デフォルト                                            | ソース                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| リクエストタイムアウト（RPC ごと）        | `30_000` ms                                           | `src/gateway/client.ts`（`requestTimeoutMs`）                                              |
| 事前認証 / 接続チャレンジタイムアウト     | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts`（config/env でサーバー/クライアントの組み合わせ予算を引き上げ可能） |
| 初回再接続バックオフ                      | `1_000` ms                                            | `src/gateway/client.ts`（`backoffMs`）                                                     |
| 最大再接続バックオフ                      | `30_000` ms                                           | `src/gateway/client.ts`（`scheduleReconnect`）                                             |
| デバイストークン close 後の高速リトライ上限 | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` 前の強制停止猶予            | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` デフォルトタイムアウト    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| デフォルト tick 間隔（`hello-ok` 前）      | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| tick タイムアウト close                   | 無通信が `tickIntervalMs * 2` を超えると code `4000`  | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024`（25 MB）                           | `src/gateway/server-constants.ts`                                                          |

サーバーは有効な `policy.tickIntervalMs`、`policy.maxPayload`、
`policy.maxBufferedBytes` を `hello-ok` で通知します。クライアントは
ハンドシェイク前のデフォルトではなく、それらの値に従う必要があります。

## 認証

- 共有シークレット Gateway 認証は、設定済みの認証モードに応じて `connect.params.auth.token` または
  `connect.params.auth.password` を使用します。
- Tailscale Serve
  （`gateway.auth.allowTailscale: true`）や非ループバックの
  `gateway.auth.mode: "trusted-proxy"` など、アイデンティティを持つモードは、
  `connect.params.auth.*` ではなくリクエストヘッダーから接続認証チェックを満たします。
- プライベート入口の `gateway.auth.mode: "none"` は、共有シークレット接続認証を
  完全にスキップします。このモードを公開/信頼できない入口で公開しないでください。
- ペアリング後、Gateway は接続ロール + スコープに限定された **デバイストークン** を発行します。これは `hello-ok.auth.deviceToken` で返され、クライアントが今後の接続用に永続化する必要があります。
- クライアントは、接続に成功するたびに主 `hello-ok.auth.deviceToken` を永続化する必要があります。
- その **保存済み** デバイストークンで再接続する場合は、そのトークンに対して保存された承認済みスコープセットも再利用する必要があります。これにより、すでに付与された read/probe/status アクセスが維持され、再接続がより狭い暗黙の admin のみのスコープへ静かに縮小されることを避けられます。
- クライアント側の接続認証組み立て（`src/gateway/client.ts` の `selectConnectAuth`）:
  - `auth.password` は独立しており、設定されている場合は常に転送されます。
  - `auth.token` は優先順位に従って設定されます。最初に明示的な共有トークン、次に明示的な `deviceToken`、次に保存済みのデバイスごとのトークン（`deviceId` + `role` をキーにする）です。
  - `auth.bootstrapToken` は、上記のいずれも `auth.token` を解決しなかった場合にのみ送信されます。共有トークンまたは解決済みデバイストークンはこれを抑制します。
  - ワンショットの `AUTH_TOKEN_MISMATCH` リトライで、保存済みデバイストークンを自動昇格する処理は、**信頼済みエンドポイントのみ** に制限されます。
    つまり、ループバック、またはピン留めされた `tlsFingerprint` を持つ `wss://` です。ピン留めのない公開 `wss://`
    は該当しません。
- 追加の `hello-ok.auth.deviceTokens` エントリは、ブートストラップの引き渡しトークンです。
  `wss://` やループバック/local ペアリングなど、信頼済みトランスポート上でブートストラップ認証を使用した接続の場合にのみ永続化してください。
- クライアントが **明示的な** `deviceToken` または明示的な `scopes` を提供した場合、
  呼び出し元が要求したそのスコープセットが引き続き信頼できる値になります。キャッシュ済みスコープは、クライアントが保存済みのデバイスごとのトークンを再利用している場合にのみ再利用されます。
- デバイストークンは `device.token.rotate` と
  `device.token.revoke`（`operator.pairing` スコープが必要）でローテーション/失効できます。
- `device.token.rotate` はローテーションメタデータを返します。置換用ベアラートークンは、そのデバイストークンですでに認証されている同一デバイスの呼び出しに対してのみエコーするため、トークンのみのクライアントは再接続前に置換トークンを永続化できます。共有/admin ローテーションではベアラートークンはエコーされません。
- トークンの発行、ローテーション、失効は、そのデバイスのペアリングエントリに記録された承認済みロールセットに限定されます。トークン変更によって、ペアリング承認で付与されていないデバイスロールへ拡張したり、それを対象にしたりすることはできません。
- ペアリング済みデバイストークンセッションでは、呼び出し元が `operator.admin` も持つ場合を除き、デバイス管理は自己スコープです。非 admin 呼び出し元は **自分自身の** デバイスエントリのみを削除/失効/ローテーションできます。
- `device.token.rotate` と `device.token.revoke` は、対象オペレータートークンのスコープセットを、呼び出し元の現在のセッションスコープとも照合します。非 admin 呼び出し元は、自分がすでに保持しているものより広いオペレータートークンをローテーションまたは失効できません。
- 認証失敗には、`error.details.code` と復旧ヒントが含まれます。
  - `error.details.canRetryWithDeviceToken`（boolean）
  - `error.details.recommendedNextStep`（`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`）
- `AUTH_TOKEN_MISMATCH` に対するクライアント動作:
  - 信頼済みクライアントは、キャッシュ済みのデバイスごとのトークンで、制限された 1 回のリトライを試行できます。
  - そのリトライが失敗した場合、クライアントは自動再接続ループを停止し、オペレーターの対応ガイダンスを表示する必要があります。

## デバイス ID + ペアリング

- Node には、キーペアのフィンガープリントから導出された安定したデバイス ID（`device.id`）を含める必要がある。
- Gateway はデバイス + ロールごとにトークンを発行する。
- local 自動承認が有効でない限り、新しいデバイス ID にはペアリング承認が必要。
- ペアリングの自動承認は、直接の local loopback 接続を中心にしている。
- OpenClaw には、信頼済み共有シークレットのヘルパーフロー向けに、限定的なバックエンド/コンテナ内 self-connect パスもある。
- 同一ホストの tailnet または LAN 接続も、ペアリングでは引き続きリモートとして扱われ、承認が必要。
- WS クライアントは通常、`connect` 時に `device` identity を含める（operator + node）。デバイスなしの operator 例外は、明示的な trust パスのみ。
  - localhost 専用の安全でない HTTP 互換性のための `gateway.controlUi.allowInsecureAuth=true`。
  - 成功した `gateway.auth.mode: "trusted-proxy"` operator Control UI 認証。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（緊急回避、重大なセキュリティ低下）。
  - 共有 gateway トークン/パスワードで認証された、direct-loopback の `gateway-client` バックエンド RPC。
- すべての接続は、サーバーから提供された `connect.challenge` nonce に署名する必要がある。

### デバイス認証移行診断

pre-challenge 署名動作をまだ使用しているレガシークライアントでは、`connect` は安定した `error.details.reason` とともに、`error.details.code` に `DEVICE_AUTH_*` 詳細コードを返すようになった。

一般的な移行失敗:

| メッセージ                  | details.code                     | details.reason           | 意味                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | クライアントが `device.nonce` を省略した（または空で送信した）。 |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | クライアントが古い/誤った nonce で署名した。      |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 署名ペイロードが v2 ペイロードと一致しない。      |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 署名済みタイムスタンプが許容 skew の範囲外。      |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` が公開鍵フィンガープリントと一致しない。 |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開鍵の形式/正規化に失敗した。                   |

移行先:

- 常に `connect.challenge` を待つ。
- サーバー nonce を含む v2 ペイロードに署名する。
- 同じ nonce を `connect.params.device.nonce` で送信する。
- 推奨される署名ペイロードは `v3`。これは device/client/role/scopes/token/nonce フィールドに加えて、`platform` と `deviceFamily` を束縛する。
- レガシー `v2` 署名は互換性のため引き続き受け入れられるが、再接続時のコマンドポリシーは paired-device メタデータのピン留めによって引き続き制御される。

## TLS + ピン留め

- TLS は WS 接続でサポートされる。
- クライアントは必要に応じて gateway 証明書フィンガープリントをピン留めできる（`gateway.tls` config に加えて、`gateway.remote.tlsFingerprint` または CLI `--tls-fingerprint` を参照）。

## スコープ

このプロトコルは **完全な gateway API**（status、channels、models、chat、agent、sessions、nodes、approvals など）を公開する。正確なサーフェスは `src/gateway/protocol/schema.ts` の TypeBox schemas で定義される。

## 関連

- [Bridge protocol](/ja-JP/gateway/bridge-protocol)
- [Gateway runbook](/ja-JP/gateway)
