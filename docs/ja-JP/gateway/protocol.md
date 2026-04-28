---
read_when:
    - gateway WSクライアントの実装または更新
    - プロトコル不一致または接続失敗のデバッグ
    - プロトコルschema/modelの再生成
summary: 'Gateway WebSocketプロトコル: ハンドシェイク、フレーム、バージョニング'
title: Gatewayプロトコル
x-i18n:
    generated_at: "2026-04-26T11:31:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01f873c7051f2a462cbefb50331e04edfdcedadeda8b3d7b7320ceb2462edccc
    source_path: gateway/protocol.md
    workflow: 15
---

Gateway WSプロトコルは、OpenClawの**単一のcontrol plane + node transport** です。すべてのクライアント（CLI、web UI、macOS app、iOS/Android node、headless node）はWebSocket経由で接続し、ハンドシェイク時に自分の**role** + **scope** を宣言します。

## Transport

- WebSocket、JSON payloadを持つtext frame。
- 最初のframeは**必ず** `connect` requestでなければなりません。
- 接続前frameは64 KiBに制限されます。ハンドシェイク成功後、クライアントは `hello-ok.policy.maxPayload` と `hello-ok.policy.maxBufferedBytes` の制限に従う必要があります。diagnosticsが有効な場合、巨大すぎる受信frameや遅い送信bufferは、gatewayが対象frameを閉じるまたは破棄する前に `payload.large` eventを出します。これらのeventは、サイズ、制限、surface、安全なreason codeを保持します。message body、attachment内容、生frame body、token、cookie、secret値は保持しません。

## ハンドシェイク（connect）

Gateway → Client（接続前challenge）:

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

`server`、`features`、`snapshot`、`policy` はすべてschema（`src/gateway/protocol/schema/frames.ts`）で必須です。`canvasHostUrl` は任意です。`auth` は利用可能な場合にネゴシエートされたrole/scopesを報告し、gatewayが発行した場合は `deviceToken` も含みます。

device tokenが発行されない場合でも、`hello-ok.auth` はネゴシエートされた権限を報告できます:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

信頼された同一process内backend client（`client.id: "gateway-client"`、`client.mode: "backend"`）は、共有gateway token/passwordで認証する直接loopback接続では `device` を省略できます。この経路は内部control-plane RPC専用であり、古いCLI/device pairing baselineがsubagent session更新のようなローカルbackend作業を妨げないようにします。リモートclient、browser由来client、node client、明示的なdevice-token/device-identity clientは、引き続き通常のpairingおよびscope-upgradeチェックを使います。

device tokenが発行される場合、`hello-ok` にはさらに次が含まれます:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

信頼されたbootstrap handoff中、`hello-ok.auth` には `deviceTokens` に追加の上限制御されたrole entryが含まれる場合もあります:

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

組み込みのnode/operator bootstrap flowでは、主たるnode tokenは `scopes: []` のままで、handoffされるoperator tokenはbootstrap operator allowlist（`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`）に制限されたままです。bootstrap scopeチェックはrole接頭辞付きのままです。operator entryはoperator requestにしか使えず、非operator roleは引き続き自分のrole接頭辞配下のscopeが必要です。

### Nodeの例

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

副作用を持つmethodには**idempotency key** が必要です（schemaを参照）。

## role + scope

### role

- `operator` = control plane client（CLI/UI/automation）。
- `node` = capability host（camera/screen/canvas/system.run）。

### scope（operator）

一般的なscope:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` を伴う `talk.config` には `operator.talk.secrets`（または `operator.admin`）が必要です。

Plugin登録のgateway RPC methodは独自のoperator scopeを要求できますが、予約済みcore admin prefix（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は常に `operator.admin` に解決されます。

method scopeは最初のゲートにすぎません。`chat.send` 経由で到達する一部のslash commandは、その上にさらに厳しいcommand-levelチェックを適用します。たとえば、永続的な `/config set` と `/config unset` の書き込みには `operator.admin` が必要です。

`node.pair.approve` にも、基本method scopeの上に追加の承認時scopeチェックがあります:

- commandなしrequest: `operator.pairing`
- exec以外のnode commandを含むrequest: `operator.pairing` + `operator.write`
- `system.run`、`system.run.prepare`、`system.which` を含むrequest: `operator.pairing` + `operator.admin`

### caps/commands/permissions（node）

nodeは接続時にcapability claimを宣言します:

- `caps`: 高水準のcapabilityカテゴリ。
- `commands`: invoke用のcommand allowlist。
- `permissions`: 細かいトグル（例: `screen.record`、`camera.capture`）。

Gatewayはこれらを**claim** として扱い、server側allowlistを強制します。

## Presence

- `system-presence` はdevice identityをキーにしたentryを返します。
- Presence entryには `deviceId`、`roles`、`scopes` が含まれるため、UIは同じdeviceが **operator** と **node** の両方で接続していても1行で表示できます。

## broadcast eventのスコープ制御

server pushのWebSocket broadcast eventは、pairing scopeだけのsessionやnode専用sessionが受動的にsession contentを受け取らないように、scopeで制御されます。

- **Chat、agent、tool-result frame**（ストリーミングされた `agent` eventやtool call resultを含む）には少なくとも `operator.read` が必要です。`operator.read` を持たないsessionはこれらのframeを完全にスキップします。
- **Plugin定義の `plugin.*` broadcast** は、Plugin登録時の設定に応じて `operator.write` または `operator.admin` で制御されます。
- **Statusおよびtransport event**（`heartbeat`、`presence`、`tick`、connect/disconnect lifecycleなど）は、transport healthがすべての認証済みsessionから観測できるよう、制限されません。
- **未知のbroadcast event family** は、登録handlerが明示的に緩和しない限り、デフォルトでscope制御されます（fail-closed）。

各クライアント接続は独自のper-client sequence番号を保持するため、異なるclientがscopeでフィルタされた異なるevent subsetを見る場合でも、そのsocket上ではbroadcastの単調順序が維持されます。

## よくあるRPC methodファミリー

公開WS surfaceは、上記のhandshake/auth例より広範です。これは生成済みdumpではありません。`hello-ok.features.methods` は、`src/gateway/server-methods-list.ts` と読み込まれたplugin/channel method exportから構築された保守的なdiscovery listです。これはfeature discoveryとして扱い、`src/gateway/server-methods/*.ts` の完全列挙とは見なさないでください。

<AccordionGroup>
  <Accordion title="Systemとidentity">
    - `health` は、キャッシュ済みまたは新規probeしたgateway health snapshotを返します。
    - `diagnostics.stability` は、最近の上限制御されたdiagnostic stability recorderを返します。event名、件数、byteサイズ、memory reading、queue/session state、channel/plugin名、session idなどの運用metadataを保持します。チャットテキスト、Webhook body、tool出力、生のrequestまたはresponse body、token、cookie、secret値は保持しません。operator read scopeが必要です。
    - `status` は `/status` 形式のgateway summaryを返します。機密フィールドはadmin scopeを持つoperator clientにのみ含まれます。
    - `gateway.identity.get` は、relayおよびpairing flowで使われるgateway device identityを返します。
    - `system-presence` は、接続中のoperator/node deviceの現在のpresence snapshotを返します。
    - `system-event` はsystem eventを追加し、presence contextを更新/配信できます。
    - `last-heartbeat` は最新の永続化heartbeat eventを返します。
    - `set-heartbeats` はgateway上のHeartbeat処理を切り替えます。

  </Accordion>

  <Accordion title="modelとusage">
    - `models.list` はruntimeで許可されたmodel catalogを返します。
    - `usage.status` はprovider usage window/残りquota summaryを返します。
    - `usage.cost` は日付範囲の集約cost usage summaryを返します。
    - `doctor.memory.status` は、アクティブなデフォルトagent workspace向けのvector-memory / embedding readinessを返します。
    - `sessions.usage` はsessionごとのusage summaryを返します。
    - `sessions.usage.timeseries` は1つのsessionのtimeseries usageを返します。
    - `sessions.usage.logs` は1つのsessionのusage log entryを返します。

  </Accordion>

  <Accordion title="チャンネルとlogin helper">
    - `channels.status` は組み込み + 同梱channel/Pluginのstatus summaryを返します。
    - `channels.logout` は、logout対応のchannelで特定のchannel/accountをlogoutします。
    - `web.login.start` は、現在のQR対応web channel providerのQR/web login flowを開始します。
    - `web.login.wait` は、そのQR/web login flowの完了を待ち、成功時にchannelを開始します。
    - `push.test` は、登録済みiOS nodeにテストAPNs pushを送ります。
    - `voicewake.get` は、保存済みwake-word triggerを返します。
    - `voicewake.set` は、wake-word triggerを更新し、変更をbroadcastします。

  </Accordion>

  <Accordion title="メッセージングとlogs">
    - `send` は、chat runnerの外でchannel/account/thread指定送信を行う直接の送信配信RPCです。
    - `logs.tail` は、cursor/limitとmax-byte制御付きで設定済みgateway file-log tailを返します。

  </Accordion>

  <Accordion title="TalkとTTS">
    - `talk.config` は有効なTalk config payloadを返します。`includeSecrets` には `operator.talk.secrets`（または `operator.admin`）が必要です。
    - `talk.mode` は、WebChat/Control UI client向けの現在のTalk mode stateを設定/配信します。
    - `talk.speak` は、アクティブなTalk speech providerを通じて音声合成します。
    - `tts.status` は、TTS有効状態、アクティブprovider、fallback provider、provider config stateを返します。
    - `tts.providers` は、可視なTTS provider inventoryを返します。
    - `tts.enable` と `tts.disable` は、TTS設定状態を切り替えます。
    - `tts.setProvider` は、優先TTS providerを更新します。
    - `tts.convert` は、one-shotのtext-to-speech変換を実行します。

  </Accordion>

  <Accordion title="Secret、config、update、wizard">
    - `secrets.reload` は、アクティブなSecretRefを再解決し、完全成功時にのみruntimeのsecret stateを差し替えます。
    - `secrets.resolve` は、特定のcommand/targetセットに対するcommand-target secret assignmentを解決します。
    - `config.get` は、現在のconfig snapshotとhashを返します。
    - `config.set` は、検証済みconfig payloadを書き込みます。
    - `config.patch` は、部分的なconfig更新をマージします。
    - `config.apply` は、完全なconfig payloadを検証して置き換えます。
    - `config.schema` は、Control UIとCLI toolingが使うライブconfig schema payloadを返します。schema、`uiHints`、version、generation metadataに加え、runtimeが読み込める場合はPlugin + channel schema metadataも含みます。schemaには、同じUIラベルとhelp textから導出されたfield `title` / `description` metadataが含まれ、該当field documentationが存在する場合は入れ子object、wildcard、array-item、`anyOf` / `oneOf` / `allOf` の構成branchも含まれます。
    - `config.schema.lookup` は、1つのconfig pathに対するpathスコープlookup payloadを返します。正規化済みpath、浅いschema node、一致したhint + `hintPath`、UI/CLI drill-down用の直接のchild summaryが含まれます。lookup schema nodeには、ユーザー向けdocsと一般的な検証field（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、数値/文字列/配列/objectの境界、および `additionalProperties`、`deprecated`、`readOnly`、`writeOnly` のようなflag）が保持されます。child summaryには `key`、正規化済み `path`、`type`、`required`、`hasChildren`、および一致した `hint` / `hintPath` が含まれます。
    - `update.run` はgateway update flowを実行し、update自体が成功した場合にのみrestartをスケジュールします。
    - `wizard.start`、`wizard.next`、`wizard.status`、`wizard.cancel` は、オンボーディングウィザードをWS RPC経由で公開します。

  </Accordion>

  <Accordion title="agentとworkspace helper">
    - `agents.list` は、設定済みagent entryを返します。
    - `agents.create`、`agents.update`、`agents.delete` は、agent recordとworkspace wiringを管理します。
    - `agents.files.list`、`agents.files.get`、`agents.files.set` は、agent向けに公開されるbootstrap workspace fileを管理します。
    - `agent.identity.get` は、agentまたはsessionに対する有効なassistant identityを返します。
    - `agent.wait` は、実行完了を待ち、利用可能な場合は終了snapshotを返します。

  </Accordion>

  <Accordion title="session制御">
    - `sessions.list` は、現在のsession indexを返します。
    - `sessions.subscribe` と `sessions.unsubscribe` は、現在のWS clientに対するsession change event subscriptionを切り替えます。
    - `sessions.messages.subscribe` と `sessions.messages.unsubscribe` は、1つのsessionに対するtranscript/message event subscriptionを切り替えます。
    - `sessions.preview` は、特定session keyに対する上限制御されたtranscript previewを返します。
    - `sessions.resolve` は、session targetを解決または正規化します。
    - `sessions.create` は、新しいsession entryを作成します。
    - `sessions.send` は、既存sessionへmessageを送信します。
    - `sessions.steer` は、アクティブsession向けのinterrupt-and-steer版です。
    - `sessions.abort` は、sessionのアクティブ作業を中断します。
    - `sessions.patch` は、session metadata/overrideを更新します。
    - `sessions.reset`、`sessions.delete`、`sessions.compact` は、session maintenanceを行います。
    - `sessions.get` は、保存済みの完全なsession rowを返します。
    - chat実行は引き続き `chat.history`、`chat.send`、`chat.abort`、`chat.inject` を使います。`chat.history` はUI client向けに表示正規化されています。visible textからinline directive tagを除去し、plain-textのtool-call XML payload（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、切り詰められたtool-call blockを含む）と漏れたASCII/全角model control tokenを除去し、正確な `NO_REPLY` / `no_reply` のような純粋なsilent-token assistant rowを省略し、大きすぎるrowはplaceholderに置き換えられることがあります。

  </Accordion>

  <Accordion title="device pairingとdevice token">
    - `device.pair.list` は、保留中および承認済みのpaired deviceを返します。
    - `device.pair.approve`、`device.pair.reject`、`device.pair.remove` は、device-pairing recordを管理します。
    - `device.token.rotate` は、承認済みroleと呼び出し元scopeの境界内でpaired device tokenをローテーションします。
    - `device.token.revoke` は、承認済みroleと呼び出し元scopeの境界内でpaired device tokenを失効させます。

  </Accordion>

  <Accordion title="node pairing、invoke、pending work">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.verify` は、node pairingとbootstrap verificationを扱います。
    - `node.list` と `node.describe` は、既知/接続済みnode stateを返します。
    - `node.rename` は、paired node labelを更新します。
    - `node.invoke` は、connected nodeへcommandを転送します。
    - `node.invoke.result` は、invoke requestの結果を返します。
    - `node.event` は、node発のeventをgatewayへ戻します。
    - `node.canvas.capability.refresh` は、スコープ付きcanvas-capability tokenを更新します。
    - `node.pending.pull` と `node.pending.ack` は、connected-node queue APIです。
    - `node.pending.enqueue` と `node.pending.drain` は、offline/disconnected node向けの永続pending workを管理します。

  </Accordion>

  <Accordion title="承認ファミリー">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list`、`exec.approval.resolve` は、one-shot exec承認requestと、保留中承認のlookup/replayを扱います。
    - `exec.approval.waitDecision` は、1つの保留中exec承認を待ち、最終決定を返します（timeout時は `null`）。
    - `exec.approvals.get` と `exec.approvals.set` は、gateway exec承認policy snapshotを管理します。
    - `exec.approvals.node.get` と `exec.approvals.node.set` は、node relay command経由でnodeローカルのexec承認policyを管理します。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision`、`plugin.approval.resolve` は、Plugin定義の承認flowを扱います。

  </Accordion>

  <Accordion title="Automation、Skills、tools">
    - Automation: `wake` は、即時または次Heartbeatのwake text injectionをスケジュールします。`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` は、スケジュール作業を管理します。
    - Skillsとtools: `commands.list`、`skills.*`、`tools.catalog`、`tools.effective`。

  </Accordion>
</AccordionGroup>

### よくあるeventファミリー

- `chat`: `chat.inject` などの、UI chat更新やその他transcript専用chat event。
- `session.message` と `session.tool`: subscribe済みsession向けのtranscript/event-stream更新。
- `sessions.changed`: session indexまたはmetadataが変更された。
- `presence`: system presence snapshot更新。
- `tick`: 定期的なkeepalive / liveness event。
- `health`: gateway health snapshot更新。
- `heartbeat`: Heartbeat event stream更新。
- `cron`: cron実行/job変更event。
- `shutdown`: gateway shutdown通知。
- `node.pair.requested` / `node.pair.resolved`: node pairingライフサイクル。
- `node.invoke.request`: node invoke request broadcast。
- `device.pair.requested` / `device.pair.resolved`: paired-deviceライフサイクル。
- `voicewake.changed`: wake-word trigger configが変更された。
- `exec.approval.requested` / `exec.approval.resolved`: exec承認ライフサイクル。
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin承認ライフサイクル。

### Node helper method

- Nodeは `skills.bins` を呼び出して、自動許可チェック用の現在のskill executable一覧を取得できます。

### Operator helper method

- Operatorは、agent向けのruntime command inventoryを取得するために `commands.list`（`operator.read`）を呼び出せます。
  - `agentId` は任意です。省略するとデフォルトagent workspaceを読みます。
  - `scope` は、primary `name` がどのsurfaceを対象にするかを制御します:
    - `text` は、先頭 `/` を除いたprimary text command tokenを返します
    - `native` およびデフォルトの `both` 経路では、利用可能な場合はprovider対応のnative名を返します
  - `textAliases` は、`/model` や `/m` のような正確なslash aliasを保持します。
  - `nativeName` は、存在する場合にprovider対応のnative command名を保持します。
  - `provider` は任意で、native namingとnative Plugin command可用性にのみ影響します。
  - `includeArgs=false` は、responseからserialize済み引数metadataを省略します。
- Operatorは、agent向けのruntime tool catalogを取得するために `tools.catalog`（`operator.read`）を呼び出せます。responseには、グループ化されたtoolsとprovenance metadataが含まれます:
  - `source`: `core` または `plugin`
  - `pluginId`: `source="plugin"` の場合のPlugin所有者
  - `optional`: Plugin toolが任意かどうか
- Operatorは、session向けのruntime有効tool inventoryを取得するために `tools.effective`（`operator.read`）を呼び出せます。
  - `sessionKey` は必須です。
  - gatewayは、呼び出し元から与えられたauthやdelivery contextを受け取る代わりに、信頼できるruntime contextをsessionからserver側で導出します。
  - responseはsessionスコープで、現在そのアクティブ会話が使えるものを反映します。core、Plugin、channel toolを含みます。
- Operatorは、agent向けの可視なskill inventoryを取得するために `skills.status`（`operator.read`）を呼び出せます。
  - `agentId` は任意です。省略するとデフォルトagent workspaceを読みます。
  - responseには、対象可否、欠けている要件、config check、secretの生値を露出しないサニタイズ済みinstall optionが含まれます。
- Operatorは、ClawHub discovery metadata用に `skills.search` と `skills.detail`（`operator.read`）を呼び出せます。
- Operatorは、2つのモードで `skills.install`（`operator.admin`）を呼び出せます:
  - ClawHubモード: `{ source: "clawhub", slug, version?, force? }` は、skill folderをデフォルトagent workspaceの `skills/` ディレクトリーにインストールします。
  - Gateway installerモード: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` は、gateway host上で宣言済み `metadata.openclaw.install` actionを実行します。
- Operatorは、2つのモードで `skills.update`（`operator.admin`）を呼び出せます:
  - ClawHubモードでは、1つの追跡中slug、またはデフォルトagent workspace内のすべての追跡中ClawHub installを更新します。
  - Configモードでは、`skills.entries.<skillKey>` の `enabled`、`apiKey`、`env` のような値をpatchします。

## exec承認

- exec requestが承認を必要とする場合、gatewayは `exec.approval.requested` をbroadcastします。
- Operator clientは `exec.approval.resolve` を呼び出して解決します（`operator.approvals` scopeが必要）。
- `host=node` の場合、`exec.approval.request` には `systemRunPlan`（正規化済み `argv` / `cwd` / `rawCommand` / session metadata）を含めなければなりません。`systemRunPlan` が欠けているrequestは拒否されます。
- 承認後、転送された `node.invoke system.run` 呼び出しは、その正規化済み `systemRunPlan` を権威あるcommand/cwd/session contextとして再利用します。
- 呼び出し元がprepareから最終承認済み `system.run` 転送までの間に `command`、`rawCommand`、`cwd`、`agentId`、`sessionKey` を変更した場合、gatewayは変更後payloadを信頼せず、その実行を拒否します。

## agent配信fallback

- `agent` requestには、送信配信を要求するために `deliver=true` を含められます。
- `bestEffortDeliver=false` は厳密動作を維持します。未解決または内部専用の配信ターゲットは `INVALID_REQUEST` を返します。
- `bestEffortDeliver=true` は、外部の配信可能ルートが解決できない場合に、session専用実行へのfallbackを許可します（たとえば内部/webchat sessionや曖昧な複数チャンネル設定）。

## バージョニング

- `PROTOCOL_VERSION` は `src/gateway/protocol/schema/protocol-schemas.ts` にあります。
- Clientは `minProtocol` + `maxProtocol` を送信し、serverは不一致を拒否します。
- schema + modelはTypeBox定義から生成されます:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### クライアント定数

`src/gateway/client.ts` のreference clientは、これらのデフォルトを使います。値はprotocol v3全体で安定しており、サードパーティclientにとって期待されるbaselineです。

| 定数                                      | デフォルト                                            | ソース                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Request timeout（RPCごと）                | `30_000` ms                                           | `src/gateway/client.ts`（`requestTimeoutMs`）              |
| 認証前 / connect-challenge timeout        | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts`（clamp `250`–`10_000`） |
| 初期reconnect backoff                     | `1_000` ms                                            | `src/gateway/client.ts`（`backoffMs`）                     |
| 最大reconnect backoff                     | `30_000` ms                                           | `src/gateway/client.ts`（`scheduleReconnect`）             |
| device-token close後のfast-retry clamp    | `250` ms                                              | `src/gateway/client.ts`                                    |
| `terminate()` 前のforce-stop猶予           | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| `stopAndWait()` のデフォルトtimeout       | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| デフォルトtick interval（`hello-ok` 前）  | `30_000` ms                                           | `src/gateway/client.ts`                                    |
| Tick-timeout close                        | 無音が `tickIntervalMs * 2` を超えたとき code `4000`  | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024`（25 MB）                           | `src/gateway/server-constants.ts`                          |

serverは、有効な `policy.tickIntervalMs`、`policy.maxPayload`、
`policy.maxBufferedBytes` を `hello-ok` で通知します。クライアントは、
ハンドシェイク前のデフォルト値ではなく、それらの値に従う必要があります。

## 認証

- 共有secretによるgateway認証では、設定された認証モードに応じて `connect.params.auth.token` または `connect.params.auth.password` を使います。
- Tailscale Serve（`gateway.auth.allowTailscale: true`）や、非loopbackの `gateway.auth.mode: "trusted-proxy"` のようなidentityを持つモードでは、`connect.params.auth.*` ではなくrequest headerからconnect認証チェックを満たします。
- private-ingressの `gateway.auth.mode: "none"` では、共有secretによるconnect認証を完全にスキップします。このモードを公開/信頼できないingressへ公開しないでください。
- pairing後、Gatewayは接続のrole + scopeにスコープされた**device token** を発行します。これは `hello-ok.auth.deviceToken` で返され、クライアントは今後の接続のためにこれを永続化する必要があります。
- クライアントは、接続成功時には常にprimaryの `hello-ok.auth.deviceToken` を永続化する必要があります。
- その**保存済み** device tokenで再接続する場合は、そのtoken向けに保存された承認済みscope setも再利用する必要があります。これにより、すでに許可されているread/probe/status accessが保持され、再接続時に暗黙のより狭いadmin専用scopeへ黙って縮退するのを防げます。
- クライアント側のconnect認証組み立て（`src/gateway/client.ts` の `selectConnectAuth`）:
  - `auth.password` は独立しており、設定されていれば常に転送されます。
  - `auth.token` は次の優先順位で設定されます: 明示的な共有tokenが最優先、次に明示的な `deviceToken`、最後に保存済みのper-device token（`deviceId` + `role` でキー付け）。
  - `auth.bootstrapToken` は、上記のいずれでも `auth.token` が解決されなかった場合にのみ送信されます。共有tokenまたは解決済みdevice tokenがある場合は抑制されます。
  - one-shotの `AUTH_TOKEN_MISMATCH` 再試行で保存済みdevice tokenを自動昇格する処理は、**信頼されたendpointだけ** に制限されます。loopback、または固定された `tlsFingerprint` を持つ `wss://` が該当します。pinningなしの公開 `wss://` は該当しません。
- 追加の `hello-ok.auth.deviceTokens` entryはbootstrap handoff tokenです。これらは、接続がbootstrap authを使い、`wss://` やloopback/local pairingのような信頼できるtransportだった場合にのみ永続化してください。
- クライアントが**明示的な** `deviceToken` または明示的な `scopes` を指定した場合、その呼び出し元要求のscope setが優先され続けます。cached scopeが再利用されるのは、クライアントが保存済みper-device tokenを再利用している場合だけです。
- device tokenは `device.token.rotate` と `device.token.revoke` でローテーション/失効できます（`operator.pairing` scopeが必要）。
- tokenの発行、ローテーション、失効は、そのdeviceのpairing entryに記録された承認済みrole setの範囲内に制限されます。token変更で、pairing承認が一度も許可していないdevice roleへ拡張したり、そこを対象にしたりはできません。
- paired-device token sessionでは、device管理は呼び出し元が `operator.admin` も持っていない限りself-scopeです。非adminの呼び出し元は、自分**自身** のdevice entryしかremove/revoke/rotateできません。
- `device.token.rotate` と `device.token.revoke` は、対象operator tokenのscope setも呼び出し元の現在session scopeに照らして確認します。非adminの呼び出し元は、自分がすでに持っているより広いoperator tokenをローテーションまたは失効できません。
- 認証失敗には `error.details.code` と回復ヒントが含まれます:
  - `error.details.canRetryWithDeviceToken`（boolean）
  - `error.details.recommendedNextStep`（`retry_with_device_token`、`update_auth_configuration`、`update_auth_credentials`、`wait_then_retry`、`review_auth_configuration`）
- `AUTH_TOKEN_MISMATCH` に対するクライアント動作:
  - 信頼されたクライアントは、cached per-device tokenで1回だけ上限制御された再試行を行えます。
  - その再試行も失敗した場合、クライアントは自動reconnect loopを停止し、operator action guidanceを表示する必要があります。

## device identity + pairing

- Nodeは、keypair fingerprintから導出された安定したdevice identity（`device.id`）を含める必要があります。
- Gatewayは、device + roleごとにtokenを発行します。
- 新しいdevice IDには、ローカル自動承認が有効でない限りpairing承認が必要です。
- pairing自動承認は、直接のローカルloopback接続を中心にしています。
- OpenClawには、信頼された共有secret helper flow向けの狭いbackend/containerローカルself-connect経路もあります。
- 同一hostのtailnetやLAN接続も、pairing上は引き続きremoteとして扱われ、承認が必要です。
- WS clientは通常、`connect` 中に `device` identityを含めます（operator + node）。deviceなしのoperator例外は明示的な信頼経路だけです:
  - localhost専用の非安全HTTP互換向け `gateway.controlUi.allowInsecureAuth=true`。
  - 成功した `gateway.auth.mode: "trusted-proxy"` のoperator Control UI認証。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（緊急回避、重大なセキュリティ低下）。
  - 共有gateway token/passwordで認証された、直接loopbackの `gateway-client` backend RPC。
- すべての接続は、server提供の `connect.challenge` nonceに署名しなければなりません。

### device認証移行diagnostics

従来のchallenge前署名動作をまだ使っているlegacy client向けに、`connect` は現在 `error.details.code` の下に `DEVICE_AUTH_*` 詳細コードと、安定した `error.details.reason` を返します。

よくある移行失敗:

| メッセージ                    | details.code                     | details.reason           | 意味                                               |
| ----------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`       | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | クライアントが `device.nonce` を省略した（または空を送った）。 |
| `device nonce mismatch`       | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | クライアントが古い/誤ったnonceで署名した。         |
| `device signature invalid`    | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 署名payloadがv2 payloadと一致しない。              |
| `device signature expired`    | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 署名timestampが許容skew外にある。                  |
| `device identity mismatch`    | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` が公開鍵fingerprintと一致しない。      |
| `device public key invalid`   | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開鍵形式/正規化に失敗した。                      |

移行目標:

- 必ず `connect.challenge` を待つ。
- server nonceを含むv2 payloadに署名する。
- 同じnonceを `connect.params.device.nonce` に送る。
- 推奨署名payloadは `v3` で、device/client/role/scopes/token/nonce fieldに加えて `platform` と `deviceFamily` も束縛します。
- 互換性のためlegacyの `v2` 署名も引き続き受け入れられますが、paired-device metadata pinningは再接続時のcommand policyを引き続き制御します。

## TLS + pinning

- WS接続でTLSをサポートしています。
- クライアントは、任意でgateway証明書fingerprintをpinできます（`gateway.tls` config、および `gateway.remote.tlsFingerprint` またはCLIの `--tls-fingerprint` を参照）。

## スコープ

このプロトコルは、**完全なgateway API**（status、channels、models、chat、
agent、sessions、nodes、approvalsなど）を公開します。正確なsurfaceは `src/gateway/protocol/schema.ts` のTypeBox schemaで定義されています。

## 関連

- [Bridge protocol](/ja-JP/gateway/bridge-protocol)
- [Gateway runbook](/ja-JP/gateway)
