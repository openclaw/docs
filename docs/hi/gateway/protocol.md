---
read_when:
    - Gateway WS क्लाइंट लागू करना या अपडेट करना
    - प्रोटोकॉल असंगतियों या कनेक्शन विफलताओं की डीबगिंग
    - प्रोटोकॉल स्कीमा/मॉडल फिर से जनरेट किए जा रहे हैं
summary: 'Gateway WebSocket प्रोटोकॉल: हैंडशेक, फ्रेम, संस्करणीकरण'
title: Gateway प्रोटोकॉल
x-i18n:
    generated_at: "2026-07-01T08:03:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fbfc5db0169f7ac2eacdb882d2afe08c80d5b8d669b6a1cfb2ffd0edbf71d16
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS प्रोटोकॉल OpenClaw के लिए **एकल control plane + node transport** है।
सभी क्लाइंट (CLI, वेब UI, macOS ऐप, iOS/Android nodes, headless nodes)
WebSocket पर कनेक्ट होते हैं और handshake समय पर अपनी **role** + **scope**
घोषित करते हैं।

## Transport

- WebSocket, JSON payloads वाले text frames।
- पहला frame **अनिवार्य रूप से** `connect` request होना चाहिए।
- Pre-connect frames की सीमा 64 KiB है। सफल handshake के बाद, clients को
  `hello-ok.policy.maxPayload` और `hello-ok.policy.maxBufferedBytes` सीमाओं का
  पालन करना चाहिए। diagnostics सक्षम होने पर, बहुत बड़े inbound frames और
  धीमे outbound buffers gateway के प्रभावित frame को बंद करने या drop करने से
  पहले `payload.large` events emit करते हैं। ये events sizes, limits,
  surfaces, और safe reason codes रखते हैं। वे message body, attachment
  contents, raw frame body, tokens, cookies, या secret values नहीं रखते।

## Handshake (connect)

Gateway → Client (pre-connect challenge):

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

Gateway → Client:

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

जब Gateway अभी भी startup sidecars पूरा कर रहा होता है, `connect` request
`details.reason` को `"startup-sidecars"` और `retryAfterMs` के साथ retryable
`UNAVAILABLE` error लौटा सकता है। Clients को इसे terminal handshake failure के
रूप में दिखाने के बजाय अपने overall connection budget के भीतर उस response को
retry करना चाहिए।

`server`, `features`, `snapshot`, और `policy` सभी schema
(`packages/gateway-protocol/src/schema/frames.ts`) द्वारा required हैं। `auth`
भी required है और negotiated role/scopes रिपोर्ट करता है। `pluginSurfaceUrls`
optional है और `canvas` जैसे plugin surface names को scoped hosted URLs से map
करता है।

Scoped plugin surface URLs expire हो सकते हैं। Nodes
`node.pluginSurface.refresh` को `{ "surface": "canvas" }` के साथ call करके
`pluginSurfaceUrls` में fresh entry पा सकते हैं। experimental Canvas plugin
refactor deprecated `canvasHostUrl`, `canvasCapability`, या
`node.canvas.capability.refresh` compatibility path को support नहीं करता; मौजूदा
native clients और gateways को plugin surfaces का उपयोग करना चाहिए।

जब कोई device token issue नहीं किया जाता, `hello-ok.auth` token fields के बिना
negotiated permissions रिपोर्ट करता है:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Trusted same-process backend clients (`client.id: "gateway-client"`,
`client.mode: "backend"`) direct loopback connections पर shared gateway
token/password से authenticate करते समय `device` छोड़ सकते हैं। यह path internal
control-plane RPCs के लिए reserved है और stale CLI/device pairing baselines को
subagent session updates जैसे local backend work को block करने से बचाता है।
Remote clients, browser-origin clients, node clients, और explicit
device-token/device-identity clients अब भी normal pairing और scope-upgrade checks
का उपयोग करते हैं।

जब device token issue किया जाता है, `hello-ok` में यह भी शामिल होता है:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Built-in QR/setup-code bootstrap एक fresh mobile handoff path है। सफल baseline
setup-code connect primary node token और एक bounded operator token लौटाता है:

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

operator handoff जानबूझकर bounded है ताकि QR onboarding mobile operator loop को
`operator.admin` या `operator.pairing` दिए बिना start कर सके। इसमें
`operator.talk.secrets` शामिल है ताकि native client bootstrap के बाद आवश्यक Talk
configuration पढ़ सके। व्यापक admin और pairing scopes के लिए अलग approved
operator pairing या token flow चाहिए। Clients को `hello-ok.auth.deviceTokens`
केवल तब persist करना चाहिए जब connect ने `wss://` या loopback/local pairing जैसे
trusted transport पर bootstrap auth का उपयोग किया हो।

### Node उदाहरण

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

## Framing

- **Request**: `{type:"req", id, method, params}`
- **Response**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

Side-effecting methods के लिए **idempotency keys** required हैं (schema देखें)।

## Roles + scopes

पूर्ण operator scope model, approval-time checks, और shared-secret semantics के
लिए, [Operator scopes](/hi/gateway/operator-scopes) देखें।

### Roles

- `operator` = control plane client (CLI/UI/automation)।
- `node` = capability host (camera/screen/canvas/system.run)।

### Scopes (operator)

Common scopes:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` में `includeSecrets: true` के लिए `operator.talk.secrets` (या
`operator.admin`) required है।
जब secrets शामिल हों, clients को active Talk provider credential
`talk.resolved.config.apiKey` से पढ़ना चाहिए; `talk.providers.<id>.apiKey`
source-shaped रहता है और SecretRef object या redacted string हो सकता है।

Plugin-registered gateway RPC methods अपना operator scope request कर सकते हैं,
लेकिन reserved core admin prefixes (`config.*`, `exec.approvals.*`,
`wizard.*`, `update.*`) हमेशा `operator.admin` में resolve होते हैं।

Method scope केवल पहला gate है। `chat.send` से पहुँचे कुछ slash commands ऊपर से
stricter command-level checks apply करते हैं। उदाहरण के लिए, persistent
`/config set` और `/config unset` writes के लिए `operator.admin` required है।

`node.pair.approve` में base method scope के ऊपर extra approval-time scope check
भी होता है:

- commandless requests: `operator.pairing`
- non-exec node commands वाले requests: `operator.pairing` + `operator.write`
- ऐसे requests जिनमें `system.run`, `system.run.prepare`, या `system.which`
  शामिल हैं: `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nodes connect time पर capability claims declare करते हैं:

- `caps`: high-level capability categories जैसे `camera`, `canvas`, `screen`,
  `location`, `voice`, और `talk`।
- `commands`: invoke के लिए command allowlist।
- `permissions`: granular toggles (जैसे `screen.record`, `camera.capture`)।

Gateway इन्हें **claims** मानता है और server-side allowlists enforce करता है।

## Presence

- `system-presence` device identity द्वारा keyed entries लौटाता है।
- Presence entries में `deviceId`, `roles`, और `scopes` शामिल होते हैं ताकि UIs
  प्रति device एक ही row दिखा सकें, भले ही वह **operator** और **node** दोनों के
  रूप में connect हो।
- `node.list` में optional `lastSeenAtMs` और `lastSeenReason` fields शामिल होते
  हैं। Connected nodes अपनी current connection time को reason `connect` के साथ
  `lastSeenAtMs` के रूप में report करते हैं; paired nodes तब durable background
  presence भी report कर सकते हैं जब कोई trusted node event उनकी pairing metadata
  update करता है।

### Node background alive event

Nodes `node.event` को `event: "node.presence.alive"` के साथ call करके record कर
सकते हैं कि paired node background wake के दौरान connected mark किए बिना alive
था।

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` एक closed enum है: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual`, या `connect`। Unknown trigger strings को
persistence से पहले gateway द्वारा `background` में normalize किया जाता है।
Event केवल authenticated node device sessions के लिए durable है; device-less या
unpaired sessions `handled: false` लौटाते हैं।

Successful gateways structured result लौटाते हैं:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

पुराने gateways अब भी `node.event` के लिए `{ "ok": true }` लौटा सकते हैं;
clients को इसे acknowledged RPC मानना चाहिए, durable presence persistence नहीं।

## Broadcast event scoping

Server-pushed WebSocket broadcast events scope-gated होते हैं ताकि pairing-scoped
या node-only sessions निष्क्रिय रूप से session content receive न करें।

- **Chat, agent, और tool-result frames** (streamed `agent` events और tool call
  results सहित) के लिए कम से कम `operator.read` required है। `operator.read`
  के बिना sessions इन frames को पूरी तरह skip करते हैं।
- **Plugin-defined `plugin.*` broadcasts** plugin द्वारा उनके registration के
  तरीके के आधार पर `operator.write` या `operator.admin` तक gated होते हैं।
- **Status और transport events** (`heartbeat`, `presence`, `tick`,
  connect/disconnect lifecycle, आदि) unrestricted रहते हैं ताकि हर authenticated
  session को transport health observable रहे।
- **Unknown broadcast event families** default रूप से scope-gated होते हैं
  (fail-closed), जब तक registered handler उन्हें explicitly relax न करे।

हर client connection अपना per-client sequence number रखता है, ताकि अलग-अलग
clients event stream के अलग-अलग scope-filtered subsets देखें तब भी broadcasts
उस socket पर monotonic ordering बनाए रखें।

## Common RPC method families

Public WS surface ऊपर दिए handshake/auth examples से व्यापक है। यह generated
dump नहीं है — `hello-ok.features.methods` `src/gateway/server-methods-list.ts`
और loaded plugin/channel method exports से बनी conservative discovery list है।
इसे feature discovery मानें, `src/gateway/server-methods/*.ts` की पूरी
enumeration नहीं।

  <AccordionGroup>
  <Accordion title="सिस्टम और पहचान">
    - `health` कैश किया गया या ताजा जांचा गया gateway health snapshot लौटाता है।
    - `diagnostics.stability` हाल का सीमित diagnostic stability recorder लौटाता है। यह event names, counts, byte sizes, memory readings, queue/session state, channel/plugin names, और session ids जैसे परिचालन metadata रखता है। यह chat text, webhook bodies, tool outputs, raw request या response bodies, tokens, cookies, या secret values नहीं रखता। Operator read scope आवश्यक है।
    - `status` `/status`-style Gateway सारांश लौटाता है; संवेदनशील fields केवल admin-scoped operator clients के लिए शामिल किए जाते हैं।
    - `gateway.identity.get` relay और pairing flows में उपयोग की जाने वाली Gateway device identity लौटाता है।
    - `system-presence` connected operator/node devices के लिए मौजूदा presence snapshot लौटाता है।
    - `system-event` एक system event जोड़ता है और presence context को update/broadcast कर सकता है।
    - `last-heartbeat` सबसे नया persisted heartbeat event लौटाता है।
    - `set-heartbeats` Gateway पर heartbeat processing को toggle करता है।

  </Accordion>

  <Accordion title="मॉडल और उपयोग">
    - `models.list` runtime-allowed model catalog लौटाता है। picker-sized configured models के लिए `{ "view": "configured" }` pass करें (`agents.defaults.models` पहले, फिर `models.providers.*.models`), या पूरे catalog के लिए `{ "view": "all" }`।
    - `usage.status` provider usage windows/remaining quota summaries लौटाता है।
    - `usage.cost` date range के लिए aggregated cost usage summaries लौटाता है।
      एक agent के लिए `agentId` pass करें, या configured agents को aggregate करने के लिए `agentScope: "all"`।
    - `doctor.memory.status` active default agent workspace के लिए vector-memory / cached embedding readiness लौटाता है। `{ "probe": true }` या `{ "deep": true }` केवल तब pass करें जब caller स्पष्ट रूप से live embedding provider ping चाहता हो। Dreaming-aware clients selected agent workspace तक Dreaming store stats को scope करने के लिए `{ "agentId": "agent-id" }` भी pass कर सकते हैं; `agentId` छोड़ने पर default-agent fallback बना रहता है और configured Dreaming workspaces aggregate होते हैं।
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts`, और `doctor.memory.dedupeDreamDiary` selected-agent Dreaming views/actions के लिए optional `{ "agentId": "agent-id" }` params स्वीकार करते हैं। जब `agentId` छोड़ा जाता है, वे configured default agent workspace पर operate करते हैं।
    - `doctor.memory.remHarness` remote control-plane clients के लिए bounded, read-only REM harness preview लौटाता है। इसमें workspace paths, memory snippets, rendered grounded markdown, और deep promotion candidates शामिल हो सकते हैं, इसलिए callers को `operator.read` चाहिए।
    - `sessions.usage` per-session usage summaries लौटाता है। एक
      agent के लिए `agentId` pass करें, या configured agents को साथ list करने के लिए `agentScope: "all"`।
    - `sessions.usage.timeseries` एक session के लिए timeseries usage लौटाता है।
    - `sessions.usage.logs` एक session के लिए usage log entries लौटाता है।

  </Accordion>

  <Accordion title="चैनल और लॉगिन सहायक">
    - `channels.status` built-in + bundled channel/Plugin status summaries लौटाता है।
    - `channels.logout` उस specific channel/account को log out करता है जहां channel logout support करता है।
    - `web.login.start` मौजूदा QR-capable web channel provider के लिए QR/web login flow शुरू करता है।
    - `web.login.wait` उस QR/web login flow के पूरा होने की प्रतीक्षा करता है और सफलता पर channel शुरू करता है।
    - `push.test` registered iOS node को test APNs push भेजता है।
    - `voicewake.get` stored wake-word triggers लौटाता है।
    - `voicewake.set` wake-word triggers update करता है और change broadcast करता है।

  </Accordion>

  <Accordion title="मैसेजिंग और लॉग">
    - `send` chat runner के बाहर channel/account/thread-targeted sends के लिए direct outbound-delivery RPC है।
    - `logs.tail` cursor/limit और max-byte controls के साथ configured Gateway file-log tail लौटाता है।

  </Accordion>

  <Accordion title="Talk और TTS">
    - `talk.catalog` speech, streaming transcription, और realtime voice के लिए read-only Talk provider catalog लौटाता है। इसमें provider secrets लौटाए या global config mutate किए बिना provider ids, labels, configured state, exposed model/voice ids, canonical modes, transports, brain strategies, और realtime audio/capability flags शामिल होते हैं।
    - `talk.config` effective Talk config payload लौटाता है; `includeSecrets` के लिए `operator.talk.secrets` (या `operator.admin`) आवश्यक है।
    - `talk.session.create` `realtime/gateway-relay`, `transcription/gateway-relay`, या `stt-tts/managed-room` के लिए Gateway-owned Talk session बनाता है। `stt-tts/managed-room` के लिए, `operator.write` callers जो `sessionKey` pass करते हैं उन्हें scoped session-key visibility के लिए `spawnedBy` भी pass करना होगा; unscoped `sessionKey` creation और `brain: "direct-tools"` के लिए `operator.admin` आवश्यक है।
    - `talk.session.join` managed-room session token validate करता है, जरूरत के अनुसार `session.ready` या `session.replaced` events emit करता है, और plaintext token या stored token hash के बिना room/session metadata तथा recent Talk events लौटाता है।
    - `talk.session.appendAudio` Gateway-owned realtime relay और transcription sessions में base64 PCM input audio जोड़ता है।
    - `talk.session.startTurn`, `talk.session.endTurn`, और `talk.session.cancelTurn` state clear होने से पहले stale-turn rejection के साथ managed-room turn lifecycle चलाते हैं।
    - `talk.session.cancelOutput` assistant audio output रोकता है, मुख्य रूप से Gateway relay sessions में VAD-gated barge-in के लिए।
    - `talk.session.submitToolResult` Gateway-owned realtime relay session द्वारा emitted provider tool call पूरा करता है। अंतरिम tool output के लिए `options: { willContinue: true }` pass करें जब final result आगे आएगा, या `options: { suppressResponse: true }` जब tool result को another realtime assistant response शुरू किए बिना provider call satisfy करनी चाहिए।
    - `talk.session.steer` Gateway-owned agent-backed Talk session में active-run voice control भेजता है। यह `{ sessionId, text, mode? }` स्वीकार करता है, जहां `mode` `status`, `steer`, `cancel`, या `followup` है; omitted mode spoken text से classify किया जाता है।
    - `talk.session.close` Gateway-owned relay, transcription, या managed-room session बंद करता है और terminal Talk events emit करता है।
    - `talk.mode` WebChat/Control UI clients के लिए current Talk mode state set/broadcast करता है।
    - `talk.client.create` `webrtc` या `provider-websocket` का उपयोग करके client-owned realtime provider session बनाता है, जबकि Gateway config, credentials, instructions, और tool policy own करता है।
    - `talk.client.toolCall` client-owned realtime transports को provider tool calls Gateway policy को forward करने देता है। पहला supported tool `openclaw_agent_consult` है; provider-specific tool result submit करने से पहले clients एक run id receive करते हैं और normal chat lifecycle events की प्रतीक्षा करते हैं।
    - `talk.client.steer` client-owned realtime transports के लिए active-run voice control भेजता है। Gateway `sessionKey` से active embedded run resolve करता है और steering को silently drop करने के बजाय structured accepted/rejected result लौटाता है।
    - `talk.event` realtime, transcription, STT/TTS, managed-room, telephony, और meeting adapters के लिए single Talk event channel है।
    - `talk.speak` active Talk speech provider के माध्यम से speech synthesize करता है।
    - `tts.status` TTS enabled state, active provider, fallback providers, और provider config state लौटाता है।
    - `tts.providers` visible TTS provider inventory लौटाता है।
    - `tts.enable` और `tts.disable` TTS prefs state को toggle करते हैं।
    - `tts.setProvider` preferred TTS provider update करता है।
    - `tts.convert` one-shot text-to-speech conversion चलाता है।

  </Accordion>

  <Accordion title="Secrets, config, update, और wizard">
    - `secrets.reload` active SecretRefs को फिर से resolve करता है और केवल full success पर runtime secret state swap करता है।
    - `secrets.resolve` specific command/target set के लिए command-target secret assignments resolve करता है।
    - `config.get` current config snapshot और hash लौटाता है।
    - `config.set` validated config payload लिखता है।
    - `config.patch` partial config update merge करता है। Destructive array
      replacement के लिए affected path `replacePaths` में होना आवश्यक है; array entries के नीचे nested arrays `agents.list[].skills` जैसे `[]` paths का उपयोग करते हैं।
    - `config.apply` full config payload validate + replace करता है।
    - `config.schema` Control UI और CLI tooling द्वारा उपयोग किया जाने वाला live config schema payload लौटाता है: schema, `uiHints`, version, और generation metadata, जिसमें runtime द्वारा load किए जा सकने पर plugin + channel schema metadata भी शामिल होता है। schema में UI द्वारा उपयोग किए गए उन्हीं labels और help text से derived field `title` / `description` metadata शामिल है, जिसमें matching field documentation मौजूद होने पर nested object, wildcard, array-item, और `anyOf` / `oneOf` / `allOf` composition branches शामिल हैं।
    - `config.schema.lookup` एक config path के लिए path-scoped lookup payload लौटाता है: normalized path, shallow schema node, matched hint + `hintPath`, optional `reloadKind`, और UI/CLI drill-down के लिए immediate child summaries। `reloadKind` `restart`, `hot`, या `none` में से एक है और requested path के लिए Gateway config reload planner को mirror करता है। Lookup schema nodes user-facing docs और common validation fields (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numeric/string/array/object bounds, और `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` जैसे flags) रखते हैं। Child summaries `key`, normalized `path`, `type`, `required`, `hasChildren`, optional `reloadKind`, साथ ही matched `hint` / `hintPath` expose करते हैं।
    - `update.run` Gateway update flow चलाता है और restart केवल तब schedule करता है जब update स्वयं सफल हो; session वाले callers `continuationMessage` शामिल कर सकते हैं ताकि startup restart continuation queue के माध्यम से एक follow-up agent turn resume करे। Control plane से package-manager updates और supervised git-checkout updates live Gateway के भीतर package tree replace करने या checkout/build output mutate करने के बजाय detached managed-service handoff का उपयोग करते हैं। Started handoff `ok: true` को `result.reason: "managed-service-handoff-started"` और `handoff.status: "started"` के साथ लौटाता है; unavailable या failed handoffs `ok: false` को `managed-service-handoff-unavailable` या `managed-service-handoff-failed` के साथ लौटाते हैं, साथ ही manual shell update आवश्यक होने पर `handoff.command` भी। Unavailable handoff का अर्थ है कि OpenClaw में safe supervisor boundary या durable service identity नहीं है, जैसे systemd के लिए `OPENCLAW_SYSTEMD_UNIT`। Started handoff के दौरान, restart sentinel थोड़ी देर के लिए `stats.reason: "restart-health-pending"` report कर सकता है; continuation तब तक delay होती है जब तक CLI restarted Gateway verify करके final `ok` sentinel नहीं लिखता।
    - `update.status` latest update restart sentinel refresh करके लौटाता है, जिसमें उपलब्ध होने पर post-restart running version भी शामिल होता है।
    - `wizard.start`, `wizard.next`, `wizard.status`, और `wizard.cancel` WS RPC पर onboarding wizard expose करते हैं।

  </Accordion>

  <Accordion title="एजेंट और workspace helpers">
    - `agents.list` कॉन्फ़िगर की गई एजेंट प्रविष्टियां लौटाता है, जिसमें प्रभावी मॉडल और रनटाइम मेटाडेटा शामिल होता है।
    - `agents.create`, `agents.update`, और `agents.delete` एजेंट रिकॉर्ड और workspace वायरिंग प्रबंधित करते हैं।
    - `agents.files.list`, `agents.files.get`, और `agents.files.set` किसी एजेंट के लिए उजागर की गई bootstrap workspace फ़ाइलों को प्रबंधित करते हैं।
    - `tasks.list`, `tasks.get`, और `tasks.cancel` SDK और ऑपरेटर क्लाइंट के लिए Gateway task ledger उजागर करते हैं।
    - `artifacts.list`, `artifacts.get`, और `artifacts.download` किसी स्पष्ट `sessionKey`, `runId`, या `taskId` scope के लिए transcript से प्राप्त artifact सारांश और डाउनलोड उजागर करते हैं। रन और task क्वेरी स्वामी session को server-side resolve करती हैं और केवल मेल खाती provenance वाला transcript media लौटाती हैं; असुरक्षित या स्थानीय URL स्रोत server-side fetch करने के बजाय unsupported downloads लौटाते हैं।
    - `environments.list` और `environments.status` SDK क्लाइंट के लिए read-only Gateway-local और node environment discovery उजागर करते हैं।
    - `agent.identity.get` किसी एजेंट या session के लिए प्रभावी assistant identity लौटाता है।
    - `agent.wait` किसी रन के समाप्त होने तक प्रतीक्षा करता है और उपलब्ध होने पर terminal snapshot लौटाता है।

  </Accordion>

  <Accordion title="Session नियंत्रण">
    - `sessions.list` वर्तमान session index लौटाता है, जिसमें agent runtime backend कॉन्फ़िगर होने पर हर पंक्ति का `agentRuntime` मेटाडेटा शामिल होता है।
    - `sessions.subscribe` और `sessions.unsubscribe` वर्तमान WS client के लिए session change event subscriptions toggle करते हैं।
    - `sessions.messages.subscribe` और `sessions.messages.unsubscribe` एक session के लिए transcript/message event subscriptions toggle करते हैं।
    - `sessions.preview` विशिष्ट session keys के लिए सीमित transcript previews लौटाता है।
    - `sessions.describe` सटीक session key के लिए एक Gateway session row लौटाता है।
    - `sessions.resolve` किसी session target को resolve या canonicalize करता है।
    - `sessions.create` नई session entry बनाता है।
    - `sessions.send` मौजूदा session में संदेश भेजता है।
    - `sessions.steer` सक्रिय session के लिए interrupt-and-steer variant है।
    - `sessions.abort` किसी session के लिए सक्रिय कार्य abort करता है। Caller वैकल्पिक `runId` के साथ `key` पास कर सकता है, या उन सक्रिय runs के लिए केवल `runId` पास कर सकता है जिन्हें Gateway किसी session तक resolve कर सकता है।
    - `sessions.patch` session metadata/overrides अपडेट करता है और resolved canonical model तथा प्रभावी `agentRuntime` रिपोर्ट करता है।
    - `sessions.reset`, `sessions.delete`, और `sessions.compact` session maintenance करते हैं।
    - `sessions.get` पूरी stored session row लौटाता है।
    - Chat execution अब भी `chat.history`, `chat.send`, `chat.abort`, और `chat.inject` का उपयोग करता है। UI clients के लिए `chat.history` display-normalized है: inline directive tags visible text से हटा दिए जाते हैं, plain-text tool-call XML payloads (जिसमें `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, और truncated tool-call blocks शामिल हैं) और leaked ASCII/full-width model control tokens हटा दिए जाते हैं, exact `NO_REPLY` / `no_reply` जैसे pure silent-token assistant rows छोड़ दिए जाते हैं, और बहुत बड़े rows को placeholders से बदला जा सकता है।
    - `chat.message.get` एक single visible transcript entry के लिए additive bounded full-message reader है। Clients `sessionKey`, session selection agent-scoped होने पर वैकल्पिक `agentId`, और पहले `chat.history` के माध्यम से surfaced transcript `messageId` पास करते हैं, और Gateway वही display-normalized projection लौटाता है, lightweight history truncation cap के बिना, जब stored entry अब भी उपलब्ध हो और oversized न हो।
    - `chat.send` auto cutoff से पहले शुरू हुई model calls के लिए fast mode उपयोग करने, फिर बाद की retry, fallback, tool-result, या continuation calls को fast mode के बिना शुरू करने के लिए one-turn `fastMode: "auto"` स्वीकार करता है। Cutoff default रूप से 60 seconds है और इसे प्रति model `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` से कॉन्फ़िगर किया जा सकता है। `chat.send` caller उस request के लिए cutoff override करने हेतु one-turn `fastAutoOnSeconds` पास कर सकता है।

  </Accordion>

  <Accordion title="Device pairing और device tokens">
    - `device.pair.list` लंबित और स्वीकृत paired devices लौटाता है।
    - `device.pair.approve`, `device.pair.reject`, और `device.pair.remove` device-pairing records प्रबंधित करते हैं।
    - `device.token.rotate` paired device token को उसके स्वीकृत role और caller scope bounds के भीतर rotate करता है।
    - `device.token.revoke` paired device token को उसके स्वीकृत role और caller scope bounds के भीतर revoke करता है।

  </Accordion>

  <Accordion title="Node pairing, invoke, और pending work">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, और `node.pair.verify` node pairing और bootstrap verification cover करते हैं।
    - `node.list` और `node.describe` ज्ञात/connected node state लौटाते हैं।
    - `node.rename` paired node label अपडेट करता है।
    - `node.invoke` connected node को command forward करता है।
    - `node.invoke.result` invoke request का result लौटाता है।
    - `node.event` node-originated events को gateway में वापस ले जाता है।
    - `node.pending.pull` और `node.pending.ack` connected-node queue APIs हैं।
    - `node.pending.enqueue` और `node.pending.drain` offline/disconnected nodes के लिए durable pending work प्रबंधित करते हैं।

  </Accordion>

  <Accordion title="Approval families">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, और `exec.approval.resolve` one-shot exec approval requests के साथ pending approval lookup/replay cover करते हैं।
    - `exec.approval.waitDecision` एक pending exec approval पर प्रतीक्षा करता है और अंतिम decision लौटाता है (या timeout पर `null`)।
    - `exec.approvals.get` और `exec.approvals.set` gateway exec approval policy snapshots प्रबंधित करते हैं।
    - `exec.approvals.node.get` और `exec.approvals.node.set` node relay commands के माध्यम से node-local exec approval policy प्रबंधित करते हैं।
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, और `plugin.approval.resolve` plugin-defined approval flows cover करते हैं।

  </Accordion>

  <Accordion title="Automation, skills, और tools">
    - Automation: `wake` immediate या next-heartbeat wake text injection schedule करता है; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` scheduled work प्रबंधित करते हैं।
    - `cron.run` manual runs के लिए enqueue-style RPC बना रहता है। जिन clients को completion semantics चाहिए, उन्हें लौटाया गया `runId` पढ़ना चाहिए और `cron.runs` poll करना चाहिए।
    - `cron.runs` वैकल्पिक non-empty `runId` filter स्वीकार करता है ताकि clients समान job की अन्य history entries के विरुद्ध race किए बिना एक queued manual run follow कर सकें।
    - Skills और tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### सामान्य event families

- `chat`: UI chat updates जैसे `chat.inject` और अन्य transcript-only chat
  events। protocol v4 में, delta payloads `deltaText` रखते हैं; `message`
  cumulative assistant snapshot बना रहता है। Non-prefix replacements `replace=true`
  set करते हैं और `deltaText` को replacement text के रूप में उपयोग करते हैं।
- `session.message`, `session.operation`, और `session.tool`: subscribed
  session के लिए transcript, in-flight session operation, और event-stream updates।
- `sessions.changed`: session index या metadata बदला।
- `presence`: system presence snapshot updates।
- `tick`: periodic keepalive / liveness event।
- `health`: gateway health snapshot update।
- `heartbeat`: Heartbeat event stream update।
- `cron`: Cron run/job change event।
- `shutdown`: gateway shutdown notification।
- `node.pair.requested` / `node.pair.resolved`: node pairing lifecycle।
- `node.invoke.request`: node invoke request broadcast।
- `device.pair.requested` / `device.pair.resolved`: paired-device lifecycle।
- `voicewake.changed`: wake-word trigger config बदला।
- `exec.approval.requested` / `exec.approval.resolved`: exec approval
  lifecycle।
- `plugin.approval.requested` / `plugin.approval.resolved`: plugin approval
  lifecycle।

### Node helper methods

- Nodes auto-allow checks के लिए skill executables की वर्तमान सूची fetch करने हेतु `skills.bins` call कर सकते हैं।

### Task ledger RPCs

Operator clients task ledger RPCs के माध्यम से Gateway background task records inspect और cancel कर सकते हैं। ये methods raw runtime state नहीं, बल्कि sanitized task summaries लौटाते हैं।

- `tasks.list` के लिए `operator.read` आवश्यक है।
  - Params: वैकल्पिक `status` (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"`, या `"timed_out"`) या उन statuses की array,
    वैकल्पिक `agentId`, वैकल्पिक `sessionKey`, वैकल्पिक `limit` `1` से
    `500` तक, और वैकल्पिक string `cursor`।
  - Result: `{ "tasks": TaskSummary[], "nextCursor"?: string }`।
- `tasks.get` के लिए `operator.read` आवश्यक है।
  - Params: `{ "taskId": string }`।
  - Result: `{ "task": TaskSummary }`।
  - Missing task ids Gateway not-found error shape लौटाते हैं।
- `tasks.cancel` के लिए `operator.write` आवश्यक है।
  - Params: `{ "taskId": string, "reason"?: string }`।
  - Result:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`।
  - `found` रिपोर्ट करता है कि ledger में matching task था या नहीं। `cancelled`
    रिपोर्ट करता है कि runtime ने cancellation स्वीकार या record किया या नहीं।

`TaskSummary` में `id`, `status`, और वैकल्पिक metadata जैसे `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, timestamps, progress,
terminal summary, और sanitized error text शामिल हैं। `agentId` task execute करने वाले agent
को identify करता है; `sessionKey` और `ownerKey` requester और control
context preserve करते हैं।

### Operator helper methods

- ऑपरेटर किसी एजेंट के लिए रनटाइम कमांड इन्वेंटरी लाने हेतु `commands.list` (`operator.read`) को कॉल कर सकते हैं।
  - `agentId` वैकल्पिक है; डिफ़ॉल्ट एजेंट वर्कस्पेस पढ़ने के लिए इसे छोड़ दें।
  - `scope` नियंत्रित करता है कि प्राथमिक `name` किस सतह को लक्षित करता है:
    - `text` शुरुआती `/` के बिना प्राथमिक टेक्स्ट कमांड टोकन लौटाता है
    - `native` और डिफ़ॉल्ट `both` पथ उपलब्ध होने पर प्रदाता-सचेत नेटिव नाम लौटाते हैं
  - `textAliases` `/model` और `/m` जैसे सटीक स्लैश उपनाम रखता है।
  - `nativeName` प्रदाता-सचेत नेटिव कमांड नाम रखता है, जब कोई मौजूद हो।
  - `provider` वैकल्पिक है और केवल नेटिव नामकरण तथा नेटिव Plugin कमांड उपलब्धता को प्रभावित करता है।
  - `includeArgs=false` प्रतिक्रिया से क्रमबद्ध आर्ग्युमेंट मेटाडेटा हटाता है।
- ऑपरेटर किसी एजेंट के लिए रनटाइम टूल कैटलॉग लाने हेतु `tools.catalog` (`operator.read`) को कॉल कर सकते हैं। प्रतिक्रिया में समूहबद्ध टूल और उद्गम मेटाडेटा शामिल होता है:
  - `source`: `core` या `plugin`
  - `pluginId`: जब `source="plugin"` हो, तब Plugin स्वामी
  - `optional`: क्या कोई Plugin टूल वैकल्पिक है
- ऑपरेटर किसी सत्र के लिए रनटाइम-प्रभावी टूल इन्वेंटरी लाने हेतु `tools.effective` (`operator.read`) को कॉल कर सकते हैं।
  - `sessionKey` आवश्यक है।
  - Gateway कॉलर-द्वारा दिए गए प्रमाणीकरण या डिलीवरी संदर्भ को स्वीकार करने के बजाय सत्र से सर्वर-साइड विश्वसनीय रनटाइम संदर्भ निकालता है।
  - प्रतिक्रिया सक्रिय इन्वेंटरी का सत्र-स्कोप वाला सर्वर-व्युत्पन्न प्रोजेक्शन है, जिसमें कोर, Plugin, चैनल, और पहले से खोजे गए MCP सर्वर टूल शामिल हैं।
  - MCP के लिए `tools.effective` केवल-पठन है: यह गर्म सत्र MCP कैटलॉग को अंतिम टूल नीति के माध्यम से प्रोजेक्ट कर सकता है, लेकिन यह MCP रनटाइम नहीं बनाता, ट्रांसपोर्ट कनेक्ट नहीं करता, या `tools/list` जारी नहीं करता। यदि कोई मेल खाता गर्म कैटलॉग मौजूद नहीं है, तो प्रतिक्रिया में `mcp-not-yet-connected`, `mcp-not-yet-listed`, या `mcp-stale-catalog` जैसी सूचना शामिल हो सकती है।
  - प्रभावी टूल प्रविष्टियाँ `source="core"`, `source="plugin"`, `source="channel"`, या `source="mcp"` का उपयोग करती हैं।
- ऑपरेटर `/tools/invoke` जैसे ही Gateway नीति पथ के माध्यम से एक उपलब्ध टूल चलाने हेतु `tools.invoke` (`operator.write`) को कॉल कर सकते हैं।
  - `name` आवश्यक है। `args`, `sessionKey`, `agentId`, `confirm`, और `idempotencyKey` वैकल्पिक हैं।
  - यदि `sessionKey` और `agentId` दोनों मौजूद हैं, तो हल किए गए सत्र एजेंट को `agentId` से मेल खाना चाहिए।
  - `cron`, `gateway`, और `nodes` जैसे केवल-स्वामी कोर रैपर को स्वामी/एडमिन पहचान (`operator.admin`) चाहिए, भले ही `tools.invoke` विधि स्वयं `operator.write` हो।
  - प्रतिक्रिया `ok`, `toolName`, वैकल्पिक `output`, और टाइप किए गए `error` फ़ील्ड वाला SDK-उन्मुख एनवेलप है। अनुमोदन या नीति अस्वीकृतियाँ Gateway टूल नीति पाइपलाइन को बाइपास करने के बजाय पेलोड में `ok:false` लौटाती हैं।
- ऑपरेटर किसी एजेंट के लिए दृश्य skill इन्वेंटरी लाने हेतु `skills.status` (`operator.read`) को कॉल कर सकते हैं।
  - `agentId` वैकल्पिक है; डिफ़ॉल्ट एजेंट वर्कस्पेस पढ़ने के लिए इसे छोड़ दें।
  - प्रतिक्रिया में पात्रता, अनुपलब्ध आवश्यकताएँ, कॉन्फ़िग जाँच, और कच्चे गुप्त मान उजागर किए बिना स्वच्छ किए गए इंस्टॉल विकल्प शामिल होते हैं।
- ऑपरेटर ClawHub खोज मेटाडेटा के लिए `skills.search` और `skills.detail` (`operator.read`) को कॉल कर सकते हैं।
- ऑपरेटर किसी निजी skill आर्काइव को इंस्टॉल करने से पहले स्टेज करने हेतु `skills.upload.begin`, `skills.upload.chunk`, और `skills.upload.commit` (`operator.admin`) को कॉल कर सकते हैं। यह विश्वसनीय क्लाइंटों के लिए अलग एडमिन अपलोड पथ है, सामान्य ClawHub skill इंस्टॉल प्रवाह नहीं, और जब तक `skills.install.allowUploadedArchives` सक्षम न हो, डिफ़ॉल्ट रूप से अक्षम रहता है।
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    उस स्लग और force मान से बंधा अपलोड बनाता है।
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` सटीक डिकोड किए गए ऑफ़सेट पर बाइट्स जोड़ता है।
  - `skills.upload.commit({ uploadId, sha256? })` अंतिम आकार और SHA-256 सत्यापित करता है। Commit केवल अपलोड को अंतिम रूप देता है; यह skill इंस्टॉल नहीं करता।
  - अपलोड किए गए skill आर्काइव ऐसे zip आर्काइव होते हैं जिनमें `SKILL.md` रूट होता है। आर्काइव का आंतरिक डायरेक्टरी नाम कभी भी इंस्टॉल लक्ष्य नहीं चुनता।
- ऑपरेटर `skills.install` (`operator.admin`) को तीन मोड में कॉल कर सकते हैं:
  - ClawHub मोड: `{ source: "clawhub", slug, version?, force? }` डिफ़ॉल्ट एजेंट वर्कस्पेस `skills/` डायरेक्टरी में skill फ़ोल्डर इंस्टॉल करता है।
  - अपलोड मोड: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    एक commit किए गए अपलोड को डिफ़ॉल्ट एजेंट वर्कस्पेस `skills/<slug>`
    डायरेक्टरी में इंस्टॉल करता है। स्लग और force मान मूल `skills.upload.begin` अनुरोध से मेल खाने चाहिए। यह मोड तब तक अस्वीकार किया जाता है जब तक `skills.install.allowUploadedArchives` सक्षम न हो। यह सेटिंग ClawHub इंस्टॉल को प्रभावित नहीं करती।
  - Gateway इंस्टॉलर मोड: `{ name, installId, timeoutMs? }`
    Gateway होस्ट पर घोषित `metadata.openclaw.install` क्रिया चलाता है।
    पुराने क्लाइंट अभी भी `dangerouslyForceUnsafeInstall` भेज सकते हैं; यह फ़ील्ड अप्रचलित है, केवल प्रोटोकॉल संगतता के लिए स्वीकार किया जाता है, और अनदेखा किया जाता है। ऑपरेटर-स्वामित्व वाले इंस्टॉल निर्णयों के लिए `security.installPolicy` का उपयोग करें।
- ऑपरेटर `skills.update` (`operator.admin`) को दो मोड में कॉल कर सकते हैं:
  - ClawHub मोड डिफ़ॉल्ट एजेंट वर्कस्पेस में एक ट्रैक किए गए स्लग या सभी ट्रैक किए गए ClawHub इंस्टॉल अपडेट करता है।
  - कॉन्फ़िग मोड `skills.entries.<skillKey>` मानों जैसे `enabled`, `apiKey`, और `env` को पैच करता है।

### `models.list` दृश्य

`models.list` वैकल्पिक `view` पैरामीटर स्वीकार करता है:

- छोड़ा गया या `"default"`: वर्तमान रनटाइम व्यवहार। यदि `agents.defaults.models` कॉन्फ़िग किया गया है, तो प्रतिक्रिया अनुमत कैटलॉग होती है, जिसमें `provider/*` प्रविष्टियों के लिए गतिशील रूप से खोजे गए मॉडल शामिल हैं। अन्यथा प्रतिक्रिया पूरा Gateway कैटलॉग होती है।
- `"configured"`: पिकर-आकार का व्यवहार। यदि `agents.defaults.models` कॉन्फ़िग किया गया है, तो वही अभी भी प्रभावी रहता है, जिसमें `provider/*` प्रविष्टियों के लिए प्रदाता-स्कोप खोज शामिल है। allowlist के बिना, प्रतिक्रिया स्पष्ट `models.providers.*.models` प्रविष्टियों का उपयोग करती है, और केवल तब पूरे कैटलॉग पर वापस जाती है जब कोई कॉन्फ़िग किया गया मॉडल रो मौजूद न हो।
- `"all"`: पूरा Gateway कैटलॉग, `agents.defaults.models` को बाइपास करते हुए। इसका उपयोग डायग्नॉस्टिक्स और खोज UI के लिए करें, सामान्य मॉडल पिकर के लिए नहीं।

## Exec अनुमोदन

- जब किसी exec अनुरोध को अनुमोदन चाहिए, Gateway `exec.approval.requested` प्रसारित करता है।
- ऑपरेटर क्लाइंट `exec.approval.resolve` को कॉल करके समाधान करते हैं (`operator.approvals` स्कोप आवश्यक है)।
- `host=node` के लिए, `exec.approval.request` में `systemRunPlan` शामिल होना चाहिए (कैनोनिकल `argv`/`cwd`/`rawCommand`/सत्र मेटाडेटा)। `systemRunPlan` के बिना अनुरोध अस्वीकार किए जाते हैं।
- अनुमोदन के बाद, अग्रेषित `node.invoke system.run` कॉल उसी कैनोनिकल `systemRunPlan` को आधिकारिक कमांड/cwd/सत्र संदर्भ के रूप में फिर से उपयोग करते हैं।
- यदि कोई कॉलर prepare और अंतिम अनुमोदित `system.run` अग्रेषण के बीच `command`, `rawCommand`, `cwd`, `agentId`, या `sessionKey` बदलता है, तो Gateway बदले हुए पेलोड पर भरोसा करने के बजाय रन अस्वीकार कर देता है।

## एजेंट डिलीवरी वैकल्पिक वापसी

- `agent` अनुरोध आउटबाउंड डिलीवरी माँगने के लिए `deliver=true` शामिल कर सकते हैं।
- `bestEffortDeliver=false` सख्त व्यवहार बनाए रखता है: अनसुलझे या केवल-आंतरिक डिलीवरी लक्ष्य `INVALID_REQUEST` लौटाते हैं।
- `bestEffortDeliver=true` तब सत्र-केवल निष्पादन पर वैकल्पिक वापसी की अनुमति देता है जब कोई बाहरी रूप से डिलीवर योग्य रूट हल नहीं किया जा सकता (उदाहरण के लिए आंतरिक/webchat सत्र या अस्पष्ट बहु-चैनल कॉन्फ़िग)।
- अंतिम `agent` परिणामों में, जब डिलीवरी का अनुरोध किया गया हो, `result.deliveryStatus` शामिल हो सकता है, जो [`openclaw agent --json --deliver`](/hi/cli/agent#json-delivery-status) के लिए दस्तावेज़ किए गए समान `sent`, `suppressed`, `partial_failed`, और `failed` स्टेटस का उपयोग करता है।

## संस्करणीकरण

- `PROTOCOL_VERSION` `packages/gateway-protocol/src/version.ts` में रहता है।
- क्लाइंट `minProtocol` + `maxProtocol` भेजते हैं; सर्वर उन रेंजों को अस्वीकार करता है जिनमें उसका वर्तमान प्रोटोकॉल शामिल नहीं है। वर्तमान क्लाइंट और सर्वर को प्रोटोकॉल v4 चाहिए।
- स्कीमा + मॉडल TypeBox परिभाषाओं से जनरेट होते हैं:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### क्लाइंट कॉन्स्टेंट

`src/gateway/client.ts` में संदर्भ क्लाइंट ये डिफ़ॉल्ट उपयोग करता है। मान प्रोटोकॉल v4 में स्थिर हैं और तृतीय-पक्ष क्लाइंटों के लिए अपेक्षित बेसलाइन हैं।

| कॉन्स्टेंट                                  | डिफ़ॉल्ट                                               | स्रोत                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| अनुरोध टाइमआउट (प्रति RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Preauth / connect-challenge टाइमआउट       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env युग्मित सर्वर/क्लाइंट बजट बढ़ा सकते हैं) |
| प्रारंभिक रीकनेक्ट बैकऑफ़                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| अधिकतम रीकनेक्ट बैकऑफ़                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| डिवाइस-टोकन बंद होने के बाद तेज़-रीट्राई क्लैम्प | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` से पहले फ़ोर्स-स्टॉप ग्रेस     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` डिफ़ॉल्ट टाइमआउट           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| डिफ़ॉल्ट टिक अंतराल (pre `hello-ok`)        | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| टिक-टाइमआउट बंद                            | कोड `4000` जब मौन `tickIntervalMs * 2` से अधिक हो      | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

सर्वर `hello-ok` में प्रभावी `policy.tickIntervalMs`, `policy.maxPayload`, और `policy.maxBufferedBytes` विज्ञापित करता है; क्लाइंटों को pre-handshake डिफ़ॉल्ट के बजाय उन मानों का सम्मान करना चाहिए।

## Auth

- Shared-secret Gateway auth कॉन्फ़िगर किए गए auth mode के आधार पर `connect.params.auth.token` या
  `connect.params.auth.password` का उपयोग करता है।
- Tailscale Serve जैसे identity-bearing mode
  (`gateway.auth.allowTailscale: true`) या non-loopback
  `gateway.auth.mode: "trusted-proxy"` `connect.params.auth.*` के बजाय
  request headers से connect auth check पूरा करते हैं।
- Private-ingress `gateway.auth.mode: "none"` shared-secret connect auth को
  पूरी तरह छोड़ देता है; इस mode को public/untrusted ingress पर expose न करें।
- Pairing के बाद, Gateway connection
  role + scopes तक scoped एक **device token** जारी करता है। यह
  `hello-ok.auth.deviceToken` में लौटाया जाता है और future connects के लिए
  client द्वारा persist किया जाना चाहिए।
- Clients को किसी भी successful connect के बाद primary `hello-ok.auth.deviceToken`
  persist करना चाहिए।
- उस **stored** device token से reconnect करने पर उस token के लिए stored
  approved scope set भी reuse होना चाहिए। इससे पहले से granted read/probe/status
  access सुरक्षित रहता है और reconnects चुपचाप एक narrower implicit admin-only
  scope में collapse नहीं होते।
- Client-side connect auth assembly (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` orthogonal है और set होने पर हमेशा forward किया जाता है।
  - `auth.token` priority order में populate होता है: पहले explicit shared token,
    फिर explicit `deviceToken`, फिर stored per-device token (`deviceId` + `role`
    से keyed)।
  - `auth.bootstrapToken` केवल तब भेजा जाता है जब ऊपर दिए गए किसी भी विकल्प से
    `auth.token` resolve नहीं हुआ हो। Shared token या कोई भी resolved device token
    इसे suppress करता है।
  - One-shot `AUTH_TOKEN_MISMATCH` retry पर stored device token की auto-promotion
    **केवल trusted endpoints** तक gated है — loopback, या pinned
    `tlsFingerprint` के साथ `wss://`। Pinning के बिना public `wss://`
    qualify नहीं करता।
- Built-in setup-code bootstrap primary node
  `hello-ok.auth.deviceToken` के साथ trusted mobile handoff के लिए
  `hello-ok.auth.deviceTokens` में bounded operator token लौटाता है। Operator token
  native Talk configuration reads के लिए `operator.talk.secrets` शामिल करता है और
  `operator.admin` तथा `operator.pairing` को exclude करता है।
- जब non-baseline setup-code bootstrap approval की प्रतीक्षा कर रहा हो, तो `PAIRING_REQUIRED`
  details में `recommendedNextStep: "wait_then_retry"`, `retryable: true`,
  और `pauseReconnect: false` शामिल होते हैं। Clients को request approve होने या
  token invalid हो जाने तक उसी bootstrap token से reconnect करते रहना चाहिए।
- `hello-ok.auth.deviceTokens` को केवल तब persist करें जब connect ने `wss://`
  या loopback/local pairing जैसे trusted transport पर bootstrap auth का उपयोग किया हो।
- यदि कोई client **explicit** `deviceToken` या explicit `scopes` देता है, तो वह
  caller-requested scope set authoritative रहता है; cached scopes केवल तब reuse
  होते हैं जब client stored per-device token को reuse कर रहा हो।
- Device tokens को `device.token.rotate` और
  `device.token.revoke` के जरिए rotate/revoke किया जा सकता है (`operator.pairing` scope आवश्यक)। Node या अन्य non-operator role को rotate या
  revoke करने के लिए `operator.admin` भी आवश्यक है।
- `device.token.rotate` rotation metadata लौटाता है। यह replacement
  bearer token केवल same-device calls के लिए echo करता है जो पहले से उस device token
  से authenticated हैं, ताकि token-only clients reconnect करने से पहले अपना replacement
  persist कर सकें। Shared/admin rotations bearer token echo नहीं करते।
- Token issuance, rotation, और revocation उस device की pairing entry में recorded
  approved role set तक bounded रहते हैं; token mutation किसी device role को expand
  या target नहीं कर सकता जिसे pairing approval ने कभी grant नहीं किया।
- Paired-device token sessions के लिए, device management self-scoped होता है जब तक
  caller के पास `operator.admin` भी न हो: non-admin callers केवल अपने **own**
  device entry के operator token को manage कर सकते हैं। Node और अन्य non-operator
  token management admin-only है, caller के अपने device के लिए भी।
- `device.token.rotate` और `device.token.revoke` target operator
  token scope set को caller के current session scopes के विरुद्ध भी check करते हैं। Non-admin callers
  अपने पास पहले से मौजूद operator token से broader operator token को rotate या revoke
  नहीं कर सकते।
- Auth failures में recovery hints के साथ `error.details.code` शामिल होता है:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` के लिए client behavior:
  - Trusted clients cached per-device token के साथ एक bounded retry attempt कर सकते हैं।
  - यदि वह retry fail हो जाए, तो clients को automatic reconnect loops रोककर operator action guidance surface करनी चाहिए।
- `AUTH_SCOPE_MISMATCH` का अर्थ है कि device token recognized था लेकिन requested
  role/scopes को cover नहीं करता। Clients को इसे bad token के रूप में present नहीं करना चाहिए;
  operator को re-pair करने या narrower/broader scope contract approve करने के लिए prompt करें।

## Device identity + pairing

- Nodes को keypair fingerprint से derived stable device identity (`device.id`)
  शामिल करनी चाहिए।
- Gateways per device + role tokens जारी करते हैं।
- नए device IDs के लिए pairing approvals आवश्यक हैं, जब तक local auto-approval
  enabled न हो।
- Pairing auto-approval direct local loopback connects पर centered है।
- OpenClaw में trusted shared-secret helper flows के लिए एक narrow backend/container-local
  self-connect path भी है।
- Same-host tailnet या LAN connects को pairing के लिए अभी भी remote माना जाता है और
  approval आवश्यक होता है।
- WS clients सामान्यतः `connect` के दौरान `device` identity शामिल करते हैं (operator +
  node)। केवल device-less operator exceptions explicit trust paths हैं:
  - localhost-only insecure HTTP compatibility के लिए `gateway.controlUi.allowInsecureAuth=true`।
  - successful `gateway.auth.mode: "trusted-proxy"` operator Control UI auth।
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, गंभीर security downgrade)।
  - reserved internal helper path पर direct-loopback `gateway-client` backend RPCs।
- Device identity omit करने के scope consequences होते हैं। जब device-less operator
  connection explicit trust path के जरिए allowed हो, OpenClaw फिर भी self-declared
  scopes को empty set में clear करता है, जब तक उस path के पास named
  scope-preservation exception न हो। Scope-gated methods फिर
  `missing scope` के साथ fail होते हैं।
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` एक Control UI
  break-glass scope-preservation path है। यह arbitrary
  custom backend या CLI-shaped WebSocket clients को scopes grant नहीं करता।
- Reserved direct-loopback `gateway-client` backend helper path केवल internal local
  control-plane RPCs के लिए scopes preserve करता है; custom backend IDs को
  यह exception नहीं मिलता।
- सभी connections को server-provided `connect.challenge` nonce sign करना होगा।

### Device auth migration diagnostics

Legacy clients के लिए जो अभी भी pre-challenge signing behavior का उपयोग करते हैं, `connect` अब
stable `error.details.reason` के साथ `error.details.code` के अंतर्गत
`DEVICE_AUTH_*` detail codes लौटाता है।

Common migration failures:

| Message                     | details.code                     | details.reason           | अर्थ                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client ने `device.nonce` omit किया (या blank भेजा)। |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client ने stale/wrong nonce से sign किया।          |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Signature payload v2 payload से match नहीं करता।   |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Signed timestamp allowed skew के बाहर है।          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` public key fingerprint से match नहीं करता। |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Public key format/canonicalization fail हुआ।       |

Migration target:

- हमेशा `connect.challenge` की प्रतीक्षा करें।
- Server nonce शामिल करने वाले v2 payload को sign करें।
- वही nonce `connect.params.device.nonce` में भेजें।
- Preferred signature payload `v3` है, जो device/client/role/scopes/token/nonce fields
  के अतिरिक्त `platform` और `deviceFamily` को bind करता है।
- Legacy `v2` signatures compatibility के लिए accepted रहती हैं, लेकिन paired-device
  metadata pinning अभी भी reconnect पर command policy control करती है।

## TLS + pinning

- WS connections के लिए TLS supported है।
- Clients वैकल्पिक रूप से Gateway cert fingerprint pin कर सकते हैं (`gateway.tls`
  config और `gateway.remote.tlsFingerprint` या CLI `--tls-fingerprint` देखें)।

## Scope

यह protocol **full Gateway API** expose करता है (status, channels, models, chat,
agent, sessions, nodes, approvals, आदि)। Exact surface
`packages/gateway-protocol/src/schema.ts` में TypeBox schemas द्वारा defined है।

## Related

- [Bridge protocol](/hi/gateway/bridge-protocol)
- [Gateway runbook](/hi/gateway)
