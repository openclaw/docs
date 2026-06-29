---
read_when:
    - Gateway WS क्लाइंट लागू करना या अपडेट करना
    - डिबगिंग प्रोटोकॉल बेमेल या कनेक्ट विफलताएँ
    - प्रोटोकॉल स्कीमा/मॉडल फिर से जनरेट करना
summary: 'Gateway WebSocket प्रोटोकॉल: हैंडशेक, फ़्रेम, वर्शनिंग'
title: Gateway प्रोटोकॉल
x-i18n:
    generated_at: "2026-06-28T23:12:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df37fcb4f6a52ef3f6044840a4c1fb1a59bf1d2b880b9f3752490c6eb8a2135f
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS प्रोटोकॉल OpenClaw के लिए **एकल कंट्रोल प्लेन + Node ट्रांसपोर्ट** है।
सभी क्लाइंट (CLI, वेब UI, macOS ऐप, iOS/Android Nodes, हेडलेस
Nodes) WebSocket पर कनेक्ट होते हैं और हैंडशेक समय पर अपनी **role** + **scope**
घोषित करते हैं।

## ट्रांसपोर्ट

- WebSocket, JSON पेलोड वाले टेक्स्ट फ्रेम।
- पहला फ्रेम **अवश्य** `connect` अनुरोध होना चाहिए।
- प्री-कनेक्ट फ्रेम 64 KiB तक सीमित हैं। सफल हैंडशेक के बाद, क्लाइंट को
  `hello-ok.policy.maxPayload` और
  `hello-ok.policy.maxBufferedBytes` सीमाओं का पालन करना चाहिए। डायग्नॉस्टिक्स सक्षम होने पर,
  बहुत बड़े इनबाउंड फ्रेम और धीमे आउटबाउंड बफर Gateway के प्रभावित फ्रेम को बंद या ड्रॉप करने से पहले
  `payload.large` इवेंट उत्सर्जित करते हैं। ये इवेंट
  आकार, सीमाएं, सतहें, और सुरक्षित कारण कोड रखते हैं। वे संदेश
  बॉडी, अटैचमेंट सामग्री, कच्ची फ्रेम बॉडी, टोकन, कुकी, या गुप्त मान नहीं रखते।

## हैंडशेक (connect)

Gateway → क्लाइंट (प्री-कनेक्ट चैलेंज):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

क्लाइंट → Gateway:

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

Gateway → क्लाइंट:

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

जब Gateway अभी भी स्टार्टअप साइडकार पूरे कर रहा हो, तो `connect` अनुरोध
`details.reason` को `"startup-sidecars"` और `retryAfterMs` पर सेट करके retryable
`UNAVAILABLE` त्रुटि लौटा सकता है। क्लाइंट को इसे टर्मिनल
हैंडशेक विफलता के रूप में दिखाने के बजाय अपने कुल कनेक्शन बजट के भीतर उस प्रतिक्रिया को फिर से आजमाना चाहिए।

`server`, `features`, `snapshot`, और `policy` सभी स्कीमा
(`packages/gateway-protocol/src/schema/frames.ts`) द्वारा आवश्यक हैं। `auth` भी आवश्यक है और
negotiated role/scopes रिपोर्ट करता है। `pluginSurfaceUrls` वैकल्पिक है और `canvas` जैसे Plugin
सतह नामों को scoped hosted URLs से मैप करता है।

Scoped Plugin सतह URL समाप्त हो सकते हैं। Nodes
`pluginSurfaceUrls` में ताजा प्रविष्टि पाने के लिए
`node.pluginSurface.refresh` को `{ "surface": "canvas" }` के साथ कॉल कर सकते हैं। प्रयोगात्मक Canvas Plugin refactor deprecated
`canvasHostUrl`, `canvasCapability`, या
`node.canvas.capability.refresh` compatibility path का समर्थन नहीं करता; वर्तमान native clients और
gateways को Plugin सतहों का उपयोग करना चाहिए।

जब कोई डिवाइस टोकन जारी नहीं किया जाता, तो `hello-ok.auth` negotiated
permissions को token fields के बिना रिपोर्ट करता है:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

विश्वसनीय same-process backend clients (`client.id: "gateway-client"`,
`client.mode: "backend"`) direct loopback connections पर `device` छोड़ सकते हैं जब
वे shared gateway token/password से authenticate करते हैं। यह path internal control-plane RPCs के लिए आरक्षित है और stale CLI/device pairing baselines को
subagent session updates जैसे local backend work को block करने से रोकता है। Remote clients,
browser-origin clients, node clients, और explicit device-token/device-identity
clients अभी भी normal pairing और scope-upgrade checks का उपयोग करते हैं।

जब device token जारी किया जाता है, तो `hello-ok` में यह भी शामिल होता है:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Built-in QR/setup-code bootstrap एक नया mobile handoff path है। सफल
baseline setup-code connect primary node token और एक bounded
operator token लौटाता है:

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

operator handoff जानबूझकर bounded है ताकि QR onboarding
`operator.admin` या `operator.pairing` दिए बिना mobile operator loop शुरू कर सके।
इसमें `operator.talk.secrets` शामिल है ताकि native client bootstrap के बाद आवश्यक Talk
configuration पढ़ सके। व्यापक admin और pairing scopes के लिए
अलग approved operator pairing या token flow आवश्यक है। क्लाइंट को
`hello-ok.auth.deviceTokens` केवल तब persist करना चाहिए
जब connect ने `wss://` या loopback/local pairing जैसे trusted transport पर bootstrap auth का उपयोग किया हो।

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

## फ्रेमिंग

- **Request**: `{type:"req", id, method, params}`
- **Response**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

Side-effecting methods के लिए **idempotency keys** आवश्यक हैं (स्कीमा देखें)।

## Roles + scopes

पूरे operator scope model, approval-time checks, और shared-secret
semantics के लिए, [Operator scopes](/hi/gateway/operator-scopes) देखें।

### Roles

- `operator` = control plane client (CLI/UI/automation)।
- `node` = capability host (camera/screen/canvas/system.run)।

### Scopes (operator)

सामान्य scopes:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` वाला `talk.config` `operator.talk.secrets`
(या `operator.admin`) मांगता है।

Plugin-registered gateway RPC methods अपने operator scope का अनुरोध कर सकते हैं, लेकिन
reserved core admin prefixes (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) हमेशा `operator.admin` पर resolve होते हैं।

Method scope केवल पहला gate है। `chat.send` के माध्यम से पहुंचे कुछ slash commands
इसके ऊपर stricter command-level checks लागू करते हैं। उदाहरण के लिए, persistent
`/config set` और `/config unset` writes के लिए `operator.admin` आवश्यक है।

`node.pair.approve` में base method scope के ऊपर एक अतिरिक्त approval-time scope check भी होता है:

- commandless requests: `operator.pairing`
- non-exec node commands वाले requests: `operator.pairing` + `operator.write`
- वे requests जिनमें `system.run`, `system.run.prepare`, या `system.which` शामिल हैं:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nodes connect time पर capability claims घोषित करते हैं:

- `caps`: `camera`, `canvas`, `screen`,
  `location`, `voice`, और `talk` जैसी high-level capability categories।
- `commands`: invoke के लिए command allowlist।
- `permissions`: granular toggles (जैसे `screen.record`, `camera.capture`)।

Gateway इन्हें **claims** मानता है और server-side allowlists लागू करता है।

## Presence

- `system-presence` device identity से keyed entries लौटाता है।
- Presence entries में `deviceId`, `roles`, और `scopes` शामिल होते हैं ताकि UIs प्रति device एक ही row दिखा सकें
  भले ही वह **operator** और **node** दोनों के रूप में connect हो।
- `node.list` में वैकल्पिक `lastSeenAtMs` और `lastSeenReason` fields शामिल हैं। Connected nodes
  अपना current connection time `lastSeenAtMs` के रूप में reason `connect` के साथ report करते हैं; paired nodes तब durable background presence भी report कर सकते हैं
  जब trusted node event उनकी pairing metadata update करता है।

### Node background alive event

Nodes `event: "node.presence.alive"` के साथ `node.event` कॉल कर सकते हैं ताकि record हो सके कि paired node
background wake के दौरान alive था, बिना उसे connected mark किए।

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` एक closed enum है: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual`, या `connect`। Unknown trigger strings को persistence से पहले gateway द्वारा
`background` में normalize किया जाता है। यह event केवल authenticated node
device sessions के लिए durable है; device-less या unpaired sessions `handled: false` लौटाते हैं।

सफल gateways structured result लौटाते हैं:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

पुराने gateways `node.event` के लिए अब भी `{ "ok": true }` लौटा सकते हैं; clients को इसे
acknowledged RPC के रूप में मानना चाहिए, durable presence persistence के रूप में नहीं।

## Broadcast event scoping

Server-pushed WebSocket broadcast events scope-gated होते हैं ताकि pairing-scoped या node-only sessions निष्क्रिय रूप से session content प्राप्त न करें।

- **Chat, agent, और tool-result frames** (streamed `agent` events और tool call results सहित) के लिए कम से कम `operator.read` आवश्यक है। `operator.read` के बिना sessions इन frames को पूरी तरह skip करते हैं।
- **Plugin-defined `plugin.*` broadcasts** Plugin ने उन्हें कैसे register किया है, इसके आधार पर `operator.write` या `operator.admin` तक gated होते हैं।
- **Status और transport events** (`heartbeat`, `presence`, `tick`, connect/disconnect lifecycle, आदि) unrestricted रहते हैं ताकि transport health हर authenticated session को observable रहे।
- **Unknown broadcast event families** default रूप से scope-gated (fail-closed) होते हैं जब तक कोई registered handler उन्हें explicitly relax न करे।

हर client connection अपना per-client sequence number रखता है ताकि broadcasts उस socket पर monotonic ordering बनाए रखें, भले ही अलग-अलग clients event stream के अलग-अलग scope-filtered subsets देखें।

## सामान्य RPC method families

Public WS surface ऊपर दिए handshake/auth examples से व्यापक है। यह
generated dump नहीं है — `hello-ok.features.methods` एक conservative
discovery list है जो `src/gateway/server-methods-list.ts` और loaded
plugin/channel method exports से बनी है। इसे feature discovery मानें, `src/gateway/server-methods/*.ts` की full
enumeration नहीं।

  <AccordionGroup>
  <Accordion title="सिस्टम और पहचान">
    - `health` कैश किया हुआ या नए सिरे से जांचा गया Gateway स्वास्थ्य स्नैपशॉट लौटाता है।
    - `diagnostics.stability` हाल का सीमित डायग्नोस्टिक स्थिरता रिकॉर्डर लौटाता है। यह इवेंट नाम, गणना, बाइट आकार, मेमरी रीडिंग, क्यू/सेशन स्थिति, चैनल/Plugin नाम, और सेशन id जैसे परिचालन मेटाडेटा रखता है। यह चैट टेक्स्ट, Webhook बॉडी, टूल आउटपुट, कच्ची अनुरोध या प्रतिक्रिया बॉडी, टोकन, कुकी, या गुप्त मान नहीं रखता। ऑपरेटर रीड स्कोप आवश्यक है।
    - `status` `/status`-शैली का Gateway सारांश लौटाता है; संवेदनशील फील्ड केवल admin-स्कोप वाले ऑपरेटर क्लाइंट के लिए शामिल किए जाते हैं।
    - `gateway.identity.get` relay और pairing फ्लो में उपयोग की जाने वाली Gateway डिवाइस पहचान लौटाता है।
    - `system-presence` कनेक्टेड ऑपरेटर/node डिवाइसों के लिए वर्तमान presence स्नैपशॉट लौटाता है।
    - `system-event` एक सिस्टम इवेंट जोड़ता है और presence context को अपडेट/ब्रॉडकास्ट कर सकता है।
    - `last-heartbeat` नवीनतम सहेजा गया Heartbeat इवेंट लौटाता है।
    - `set-heartbeats` Gateway पर Heartbeat प्रोसेसिंग को टॉगल करता है।

  </Accordion>

  <Accordion title="मॉडल और उपयोग">
    - `models.list` runtime-अनुमत मॉडल कैटलॉग लौटाता है। पिकर-आकार के configured मॉडल (`agents.defaults.models` पहले, फिर `models.providers.*.models`) के लिए `{ "view": "configured" }` पास करें, या पूरे कैटलॉग के लिए `{ "view": "all" }` पास करें।
    - `usage.status` provider उपयोग विंडो/शेष quota सारांश लौटाता है।
    - `usage.cost` किसी date range के लिए aggregated cost usage सारांश लौटाता है।
      एक agent के लिए `agentId` पास करें, या configured agents को aggregate करने के लिए `agentScope: "all"` पास करें।
    - `doctor.memory.status` active default agent workspace के लिए vector-memory / cached embedding readiness लौटाता है। `{ "probe": true }` या `{ "deep": true }` केवल तब पास करें जब caller स्पष्ट रूप से live embedding provider ping चाहता हो। Dreaming-aware clients चयनित agent workspace तक Dreaming store stats को scope करने के लिए `{ "agentId": "agent-id" }` भी पास कर सकते हैं; `agentId` छोड़ने पर default-agent fallback बना रहता है और configured Dreaming workspaces aggregate होते हैं।
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts`, और `doctor.memory.dedupeDreamDiary` चयनित-agent Dreaming views/actions के लिए वैकल्पिक `{ "agentId": "agent-id" }` params स्वीकार करते हैं। जब `agentId` छोड़ा जाता है, वे configured default agent workspace पर काम करते हैं।
    - `doctor.memory.remHarness` remote control-plane clients के लिए सीमित, read-only REM harness preview लौटाता है। इसमें workspace paths, memory snippets, rendered grounded markdown, और deep promotion candidates शामिल हो सकते हैं, इसलिए callers को `operator.read` चाहिए।
    - `sessions.usage` प्रति-session usage सारांश लौटाता है। एक
      agent के लिए `agentId` पास करें, या configured agents को साथ सूचीबद्ध करने के लिए `agentScope: "all"` पास करें।
    - `sessions.usage.timeseries` एक session के लिए timeseries usage लौटाता है।
    - `sessions.usage.logs` एक session के लिए usage log entries लौटाता है।

  </Accordion>

  <Accordion title="चैनल और login helpers">
    - `channels.status` built-in + bundled channel/Plugin status सारांश लौटाता है।
    - `channels.logout` ऐसे specific channel/account को logout करता है जहां channel logout support करता है।
    - `web.login.start` वर्तमान QR-capable web channel provider के लिए QR/web login flow शुरू करता है।
    - `web.login.wait` उस QR/web login flow के complete होने की प्रतीक्षा करता है और सफलता पर channel शुरू करता है।
    - `push.test` registered iOS node को test APNs push भेजता है।
    - `voicewake.get` stored wake-word triggers लौटाता है।
    - `voicewake.set` wake-word triggers अपडेट करता है और बदलाव broadcast करता है।

  </Accordion>

  <Accordion title="Messaging और logs">
    - `send` chat runner के बाहर channel/account/thread-targeted sends के लिए direct outbound-delivery RPC है।
    - `logs.tail` cursor/limit और max-byte controls के साथ configured Gateway file-log tail लौटाता है।

  </Accordion>

  <Accordion title="Talk और TTS">
    - `talk.catalog` speech, streaming transcription, और realtime voice के लिए read-only Talk provider catalog लौटाता है। इसमें provider ids, labels, configured state, exposed model/voice ids, canonical modes, transports, brain strategies, और realtime audio/capability flags शामिल होते हैं, बिना provider secrets लौटाए या global config mutate किए।
    - `talk.config` effective Talk config payload लौटाता है; `includeSecrets` के लिए `operator.talk.secrets` (या `operator.admin`) आवश्यक है।
    - `talk.session.create` `realtime/gateway-relay`, `transcription/gateway-relay`, या `stt-tts/managed-room` के लिए Gateway-owned Talk session बनाता है। `stt-tts/managed-room` के लिए, `operator.write` callers जो `sessionKey` पास करते हैं उन्हें scoped session-key visibility के लिए `spawnedBy` भी पास करना होगा; unscoped `sessionKey` creation और `brain: "direct-tools"` के लिए `operator.admin` आवश्यक है।
    - `talk.session.join` managed-room session token validate करता है, जरूरत के अनुसार `session.ready` या `session.replaced` events emit करता है, और plaintext token या stored token hash के बिना room/session metadata और recent Talk events लौटाता है।
    - `talk.session.appendAudio` Gateway-owned realtime relay और transcription sessions में base64 PCM input audio जोड़ता है।
    - `talk.session.startTurn`, `talk.session.endTurn`, और `talk.session.cancelTurn` state clear होने से पहले stale-turn rejection के साथ managed-room turn lifecycle चलाते हैं।
    - `talk.session.cancelOutput` assistant audio output रोकता है, मुख्य रूप से Gateway relay sessions में VAD-gated barge-in के लिए।
    - `talk.session.submitToolResult` Gateway-owned realtime relay session द्वारा emit की गई provider tool call complete करता है। interim tool output के लिए `options: { willContinue: true }` पास करें जब final result बाद में आएगा, या `options: { suppressResponse: true }` जब tool result को दूसरा realtime assistant response शुरू किए बिना provider call satisfy करनी चाहिए।
    - `talk.session.steer` Gateway-owned agent-backed Talk session में active-run voice control भेजता है। यह `{ sessionId, text, mode? }` स्वीकार करता है, जहां `mode` `status`, `steer`, `cancel`, या `followup` है; छोड़ा गया mode बोले गए text से classify किया जाता है।
    - `talk.session.close` Gateway-owned relay, transcription, या managed-room session बंद करता है और terminal Talk events emit करता है।
    - `talk.mode` WebChat/Control UI clients के लिए current Talk mode state set/broadcast करता है।
    - `talk.client.create` `webrtc` या `provider-websocket` का उपयोग करके client-owned realtime provider session बनाता है, जबकि Gateway config, credentials, instructions, और tool policy own करता है।
    - `talk.client.toolCall` client-owned realtime transports को provider tool calls Gateway policy तक forward करने देता है। पहला supported tool `openclaw_agent_consult` है; clients को run id मिलता है और provider-specific tool result submit करने से पहले वे normal chat lifecycle events की प्रतीक्षा करते हैं।
    - `talk.client.steer` client-owned realtime transports के लिए active-run voice control भेजता है। Gateway `sessionKey` से active embedded run resolve करता है और steering को चुपचाप drop करने के बजाय structured accepted/rejected result लौटाता है।
    - `talk.event` realtime, transcription, STT/TTS, managed-room, telephony, और meeting adapters के लिए single Talk event channel है।
    - `talk.speak` active Talk speech provider के माध्यम से speech synthesize करता है।
    - `tts.status` TTS enabled state, active provider, fallback providers, और provider config state लौटाता है।
    - `tts.providers` visible TTS provider inventory लौटाता है।
    - `tts.enable` और `tts.disable` TTS prefs state टॉगल करते हैं।
    - `tts.setProvider` preferred TTS provider अपडेट करता है।
    - `tts.convert` one-shot text-to-speech conversion चलाता है।

  </Accordion>

  <Accordion title="Secrets, config, update, और wizard">
    - `secrets.reload` active SecretRefs को फिर से resolve करता है और केवल full success पर runtime secret state swap करता है।
    - `secrets.resolve` specific command/target set के लिए command-target secret assignments resolve करता है।
    - `config.get` current config snapshot और hash लौटाता है।
    - `config.set` validated config payload लिखता है।
    - `config.patch` partial config update merge करता है। Destructive array
      replacement के लिए affected path का `replacePaths` में होना आवश्यक है; array entries के तहत nested arrays `agents.list[].skills` जैसे `[]` paths उपयोग करते हैं।
    - `config.apply` full config payload को validate + replace करता है।
    - `config.schema` Control UI और CLI tooling द्वारा उपयोग किया गया live config schema payload लौटाता है: schema, `uiHints`, version, और generation metadata, जिसमें runtime द्वारा load किए जा सकने पर plugin + channel schema metadata शामिल है। schema में UI द्वारा उपयोग किए गए उन्हीं labels और help text से derived field `title` / `description` metadata शामिल है, जिसमें matching field documentation मौजूद होने पर nested object, wildcard, array-item, और `anyOf` / `oneOf` / `allOf` composition branches शामिल हैं।
    - `config.schema.lookup` एक config path के लिए path-scoped lookup payload लौटाता है: normalized path, shallow schema node, matched hint + `hintPath`, optional `reloadKind`, और UI/CLI drill-down के लिए immediate child summaries। `reloadKind` `restart`, `hot`, या `none` में से एक है और requested path के लिए Gateway config reload planner को mirror करता है। Lookup schema nodes user-facing docs और common validation fields (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numeric/string/array/object bounds, और `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` जैसे flags) रखते हैं। Child summaries `key`, normalized `path`, `type`, `required`, `hasChildren`, optional `reloadKind`, साथ ही matched `hint` / `hintPath` expose करते हैं।
    - `update.run` Gateway update flow चलाता है और restart केवल तब schedule करता है जब update स्वयं सफल हो; session वाले callers `continuationMessage` शामिल कर सकते हैं ताकि startup restart continuation queue के माध्यम से एक follow-up agent turn resume करे। control plane से package-manager updates और supervised git-checkout updates live Gateway के अंदर package tree replace करने या checkout/build output mutate करने के बजाय detached managed-service handoff का उपयोग करते हैं। शुरू किया गया handoff `result.reason: "managed-service-handoff-started"` और `handoff.status: "started"` के साथ `ok: true` लौटाता है; unavailable या failed handoffs `managed-service-handoff-unavailable` या `managed-service-handoff-failed` के साथ `ok: false` लौटाते हैं, साथ में manual shell update आवश्यक होने पर `handoff.command` भी। unavailable handoff का अर्थ है कि OpenClaw के पास safe supervisor boundary या durable service identity नहीं है, जैसे systemd के लिए `OPENCLAW_SYSTEMD_UNIT`। शुरू किए गए handoff के दौरान, restart sentinel थोड़े समय के लिए `stats.reason: "restart-health-pending"` report कर सकता है; continuation तब तक delay होता है जब तक CLI restarted Gateway verify नहीं करता और final `ok` sentinel नहीं लिखता।
    - `update.status` latest update restart sentinel refresh करके लौटाता है, उपलब्ध होने पर post-restart running version सहित।
    - `wizard.start`, `wizard.next`, `wizard.status`, और `wizard.cancel` WS RPC पर onboarding wizard expose करते हैं।

  </Accordion>

  <Accordion title="एजेंट और कार्यस्थान सहायक">
    - `agents.list` प्रभावी मॉडल और रनटाइम मेटाडेटा सहित कॉन्फ़िगर की गई एजेंट प्रविष्टियां लौटाता है।
    - `agents.create`, `agents.update`, और `agents.delete` एजेंट रिकॉर्ड और कार्यस्थान वायरिंग का प्रबंधन करते हैं।
    - `agents.files.list`, `agents.files.get`, और `agents.files.set` किसी एजेंट के लिए उजागर की गई बूटस्ट्रैप कार्यस्थान फ़ाइलों का प्रबंधन करते हैं।
    - `tasks.list`, `tasks.get`, और `tasks.cancel` SDK और ऑपरेटर क्लाइंट के लिए Gateway टास्क लेजर उजागर करते हैं।
    - `artifacts.list`, `artifacts.get`, और `artifacts.download` स्पष्ट `sessionKey`, `runId`, या `taskId` स्कोप के लिए ट्रांसक्रिप्ट-व्युत्पन्न आर्टिफैक्ट सारांश और डाउनलोड उजागर करते हैं। रन और टास्क क्वेरी सर्वर-साइड स्वामी सत्र को रिज़ॉल्व करती हैं और केवल मेल खाते उद्गम वाली ट्रांसक्रिप्ट मीडिया लौटाती हैं; असुरक्षित या स्थानीय URL स्रोत सर्वर-साइड फ़ेच करने के बजाय असमर्थित डाउनलोड लौटाते हैं।
    - `environments.list` और `environments.status` SDK क्लाइंट के लिए केवल-पठन Gateway-स्थानीय और नोड परिवेश खोज उजागर करते हैं।
    - `agent.identity.get` किसी एजेंट या सत्र के लिए प्रभावी असिस्टेंट पहचान लौटाता है।
    - `agent.wait` किसी रन के समाप्त होने की प्रतीक्षा करता है और उपलब्ध होने पर टर्मिनल स्नैपशॉट लौटाता है।

  </Accordion>

  <Accordion title="सत्र नियंत्रण">
    - `sessions.list` वर्तमान सत्र इंडेक्स लौटाता है, जिसमें एजेंट रनटाइम बैकएंड कॉन्फ़िगर होने पर प्रति-पंक्ति `agentRuntime` मेटाडेटा शामिल होता है।
    - `sessions.subscribe` और `sessions.unsubscribe` वर्तमान WS क्लाइंट के लिए सत्र परिवर्तन इवेंट सदस्यताएं टॉगल करते हैं।
    - `sessions.messages.subscribe` और `sessions.messages.unsubscribe` एक सत्र के लिए ट्रांसक्रिप्ट/संदेश इवेंट सदस्यताएं टॉगल करते हैं।
    - `sessions.preview` विशिष्ट सत्र कुंजियों के लिए सीमित ट्रांसक्रिप्ट पूर्वावलोकन लौटाता है।
    - `sessions.describe` सटीक सत्र कुंजी के लिए एक Gateway सत्र पंक्ति लौटाता है।
    - `sessions.resolve` किसी सत्र लक्ष्य को रिज़ॉल्व या कैननिकलाइज़ करता है।
    - `sessions.create` नई सत्र प्रविष्टि बनाता है।
    - `sessions.send` मौजूदा सत्र में संदेश भेजता है।
    - `sessions.steer` सक्रिय सत्र के लिए interrupt-and-steer वैरिएंट है।
    - `sessions.abort` किसी सत्र के लिए सक्रिय कार्य को रोकता है। कॉलर `key` के साथ वैकल्पिक `runId` पास कर सकता है, या सक्रिय रनों के लिए केवल `runId` पास कर सकता है जिन्हें Gateway किसी सत्र में रिज़ॉल्व कर सकता है।
    - `sessions.patch` सत्र मेटाडेटा/ओवरराइड अपडेट करता है और रिज़ॉल्व किया गया कैननिकल मॉडल तथा प्रभावी `agentRuntime` रिपोर्ट करता है।
    - `sessions.reset`, `sessions.delete`, और `sessions.compact` सत्र रखरखाव करते हैं।
    - `sessions.get` पूरी संग्रहित सत्र पंक्ति लौटाता है।
    - चैट निष्पादन अब भी `chat.history`, `chat.send`, `chat.abort`, और `chat.inject` का उपयोग करता है। UI क्लाइंट के लिए `chat.history` प्रदर्शन-सामान्यीकृत है: इनलाइन निर्देश टैग दृश्य पाठ से हटाए जाते हैं, प्लेन-टेक्स्ट टूल-कॉल XML पेलोड (जिसमें `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, और कटे हुए टूल-कॉल ब्लॉक शामिल हैं) और लीक हुए ASCII/पूर्ण-चौड़ाई मॉडल नियंत्रण टोकन हटाए जाते हैं, शुद्ध मौन-टोकन असिस्टेंट पंक्तियां जैसे सटीक `NO_REPLY` / `no_reply` छोड़ी जाती हैं, और बहुत बड़ी पंक्तियों को प्लेसहोल्डर से बदला जा सकता है।
    - `chat.message.get` एकल दृश्य ट्रांसक्रिप्ट प्रविष्टि के लिए additive सीमित पूर्ण-संदेश रीडर है। क्लाइंट `sessionKey`, सत्र चयन एजेंट-स्कोप्ड होने पर वैकल्पिक `agentId`, साथ ही पहले `chat.history` के माध्यम से सतह पर आए ट्रांसक्रिप्ट `messageId` पास करते हैं, और Gateway वही प्रदर्शन-सामान्यीकृत प्रोजेक्शन लौटाता है, हल्के history truncation cap के बिना, जब संग्रहित प्रविष्टि अब भी उपलब्ध हो और बहुत बड़ी न हो।
    - `chat.send` ऑटो कटऑफ से पहले शुरू किए गए मॉडल कॉल के लिए fast mode का उपयोग करने हेतु one-turn `fastMode: "auto"` स्वीकार करता है, फिर बाद के retry, fallback, tool-result, या continuation कॉल fast mode के बिना शुरू करता है। कटऑफ डिफ़ॉल्ट रूप से 60 सेकंड है और प्रति मॉडल `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` से कॉन्फ़िगर किया जा सकता है। `chat.send` कॉलर उस अनुरोध के लिए कटऑफ ओवरराइड करने हेतु one-turn `fastAutoOnSeconds` पास कर सकता है।

  </Accordion>

  <Accordion title="डिवाइस पेयरिंग और डिवाइस टोकन">
    - `device.pair.list` लंबित और स्वीकृत पेयर किए गए डिवाइस लौटाता है।
    - `device.pair.approve`, `device.pair.reject`, और `device.pair.remove` डिवाइस-पेयरिंग रिकॉर्ड का प्रबंधन करते हैं।
    - `device.token.rotate` पेयर किए गए डिवाइस टोकन को उसकी स्वीकृत भूमिका और कॉलर स्कोप सीमाओं के भीतर रोटेट करता है।
    - `device.token.revoke` पेयर किए गए डिवाइस टोकन को उसकी स्वीकृत भूमिका और कॉलर स्कोप सीमाओं के भीतर निरस्त करता है।

  </Accordion>

  <Accordion title="नोड पेयरिंग, invoke, और लंबित कार्य">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, और `node.pair.verify` नोड पेयरिंग और बूटस्ट्रैप सत्यापन को कवर करते हैं।
    - `node.list` और `node.describe` ज्ञात/कनेक्टेड नोड स्थिति लौटाते हैं।
    - `node.rename` पेयर किए गए नोड लेबल को अपडेट करता है।
    - `node.invoke` कनेक्टेड नोड को कमांड अग्रेषित करता है।
    - `node.invoke.result` invoke अनुरोध के लिए परिणाम लौटाता है।
    - `node.event` नोड-जनित इवेंट को gateway में वापस ले जाता है।
    - `node.pending.pull` और `node.pending.ack` कनेक्टेड-नोड queue APIs हैं।
    - `node.pending.enqueue` और `node.pending.drain` ऑफ़लाइन/डिस्कनेक्टेड नोड के लिए durable pending work का प्रबंधन करते हैं।

  </Accordion>

  <Accordion title="स्वीकृति परिवार">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, और `exec.approval.resolve` one-shot exec स्वीकृति अनुरोधों के साथ लंबित स्वीकृति lookup/replay को कवर करते हैं।
    - `exec.approval.waitDecision` एक लंबित exec स्वीकृति की प्रतीक्षा करता है और अंतिम निर्णय लौटाता है (या timeout पर `null`)।
    - `exec.approvals.get` और `exec.approvals.set` gateway exec स्वीकृति नीति snapshots का प्रबंधन करते हैं।
    - `exec.approvals.node.get` और `exec.approvals.node.set` node relay commands के माध्यम से node-local exec स्वीकृति नीति का प्रबंधन करते हैं।
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, और `plugin.approval.resolve` plugin-defined स्वीकृति flows को कवर करते हैं।

  </Accordion>

  <Accordion title="ऑटोमेशन, skills, और टूल">
    - ऑटोमेशन: `wake` तत्काल या अगले-heartbeat wake text injection शेड्यूल करता है; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` निर्धारित कार्य का प्रबंधन करते हैं।
    - `cron.run` मैनुअल runs के लिए enqueue-style RPC बना रहता है। जिन क्लाइंट को completion semantics चाहिए, उन्हें लौटाया गया `runId` पढ़ना चाहिए और `cron.runs` poll करना चाहिए।
    - `cron.runs` वैकल्पिक non-empty `runId` फ़िल्टर स्वीकार करता है ताकि क्लाइंट उसी job के अन्य history entries से race किए बिना एक queued manual run को follow कर सकें।
    - Skills और टूल: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### सामान्य इवेंट परिवार

- `chat`: UI चैट अपडेट जैसे `chat.inject` और अन्य केवल-ट्रांसक्रिप्ट चैट
  इवेंट। protocol v4 में, delta payloads `deltaText` ले जाते हैं; `message`
  cumulative assistant snapshot बना रहता है। Non-prefix replacements `replace=true`
  सेट करते हैं और `deltaText` को replacement text के रूप में उपयोग करते हैं।
- `session.message`, `session.operation`, और `session.tool`: subscribed
  session के लिए transcript, in-flight session operation, और event-stream
  updates।
- `sessions.changed`: सत्र इंडेक्स या मेटाडेटा बदला।
- `presence`: सिस्टम उपस्थिति snapshot updates।
- `tick`: periodic keepalive / liveness event।
- `health`: gateway health snapshot update।
- `heartbeat`: heartbeat event stream update।
- `cron`: cron run/job change event।
- `shutdown`: gateway shutdown notification।
- `node.pair.requested` / `node.pair.resolved`: नोड पेयरिंग lifecycle।
- `node.invoke.request`: node invoke request broadcast।
- `device.pair.requested` / `device.pair.resolved`: paired-device lifecycle।
- `voicewake.changed`: wake-word trigger config changed।
- `exec.approval.requested` / `exec.approval.resolved`: exec approval
  lifecycle।
- `plugin.approval.requested` / `plugin.approval.resolved`: plugin approval
  lifecycle।

### नोड सहायक विधियां

- नोड auto-allow checks के लिए skill executables की वर्तमान सूची फ़ेच करने हेतु `skills.bins` कॉल कर सकते हैं।

### टास्क लेजर RPCs

ऑपरेटर क्लाइंट task ledger RPCs के माध्यम से Gateway background task records का निरीक्षण और रद्द कर सकते हैं। ये विधियां raw runtime state नहीं, बल्कि sanitized task summaries लौटाती हैं।

- `tasks.list` के लिए `operator.read` आवश्यक है।
  - Params: वैकल्पिक `status` (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"`, या `"timed_out"`) या उन statuses की array,
    वैकल्पिक `agentId`, वैकल्पिक `sessionKey`, वैकल्पिक `limit` `1` से
    `500` तक, और वैकल्पिक string `cursor`।
  - Result: `{ "tasks": TaskSummary[], "nextCursor"?: string }`।
- `tasks.get` के लिए `operator.read` आवश्यक है।
  - Params: `{ "taskId": string }`।
  - Result: `{ "task": TaskSummary }`।
  - गुम task ids Gateway not-found error shape लौटाते हैं।
- `tasks.cancel` के लिए `operator.write` आवश्यक है।
  - Params: `{ "taskId": string, "reason"?: string }`।
  - Result:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`।
  - `found` रिपोर्ट करता है कि ledger में matching task था या नहीं। `cancelled`
    रिपोर्ट करता है कि runtime ने cancellation स्वीकार या record किया या नहीं।

`TaskSummary` में `id`, `status`, और वैकल्पिक मेटाडेटा जैसे `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, timestamps, progress,
terminal summary, और sanitized error text शामिल होते हैं। `agentId` task
execute करने वाले agent की पहचान करता है; `sessionKey` और `ownerKey` requester और control
context को preserve करते हैं।

### ऑपरेटर सहायक विधियां

- ऑपरेटर किसी एजेंट के लिए runtime command inventory प्राप्त करने हेतु `commands.list` (`operator.read`) कॉल कर सकते हैं।
  - `agentId` वैकल्पिक है; default agent workspace पढ़ने के लिए इसे छोड़ दें।
  - `scope` नियंत्रित करता है कि primary `name` किस सतह को target करता है:
    - `text` leading `/` के बिना primary text command token लौटाता है
    - `native` और default `both` path उपलब्ध होने पर provider-aware native names लौटाते हैं
  - `textAliases` `/model` और `/m` जैसे exact slash aliases रखता है।
  - `nativeName` provider-aware native command name रखता है जब कोई मौजूद हो।
  - `provider` वैकल्पिक है और केवल native naming तथा native Plugin command availability को प्रभावित करता है।
  - `includeArgs=false` response से serialized argument metadata हटा देता है।
- ऑपरेटर किसी एजेंट के लिए runtime tool catalog प्राप्त करने हेतु `tools.catalog` (`operator.read`) कॉल कर सकते हैं। response में grouped tools और provenance metadata शामिल होते हैं:
  - `source`: `core` या `plugin`
  - `pluginId`: Plugin owner जब `source="plugin"`
  - `optional`: क्या कोई Plugin tool optional है
- ऑपरेटर किसी session के लिए runtime-effective tool inventory प्राप्त करने हेतु `tools.effective` (`operator.read`) कॉल कर सकते हैं।
  - `sessionKey` आवश्यक है।
  - Gateway caller-supplied auth या delivery context स्वीकार करने के बजाय session server-side से trusted runtime context निकालता है।
  - response active inventory का session-scoped server-derived projection है, जिसमें core, Plugin, channel, और पहले से discovered MCP server tools शामिल हैं।
  - `tools.effective` MCP के लिए read-only है: यह warm session MCP catalog को final tool policy के जरिए project कर सकता है, लेकिन MCP runtimes नहीं बनाता, transports connect नहीं करता, या `tools/list` issue नहीं करता। यदि कोई matching warm catalog मौजूद नहीं है, तो response में `mcp-not-yet-connected`, `mcp-not-yet-listed`, या `mcp-stale-catalog` जैसा notice शामिल हो सकता है।
  - Effective tool entries `source="core"`, `source="plugin"`, `source="channel"`, या `source="mcp"` का उपयोग करती हैं।
- ऑपरेटर `/tools/invoke` जैसे ही Gateway policy path के जरिए एक उपलब्ध tool invoke करने हेतु `tools.invoke` (`operator.write`) कॉल कर सकते हैं।
  - `name` आवश्यक है। `args`, `sessionKey`, `agentId`, `confirm`, और `idempotencyKey` वैकल्पिक हैं।
  - यदि `sessionKey` और `agentId` दोनों मौजूद हैं, तो resolved session agent को `agentId` से match करना होगा।
  - `cron`, `gateway`, और `nodes` जैसे owner-only core wrappers को owner/admin identity (`operator.admin`) चाहिए, भले ही `tools.invoke` method स्वयं `operator.write` हो।
  - response SDK-facing envelope है जिसमें `ok`, `toolName`, optional `output`, और typed `error` fields होते हैं। Approval या policy refusals Gateway tool policy pipeline को bypass करने के बजाय payload में `ok:false` लौटाते हैं।
- ऑपरेटर किसी एजेंट के लिए visible skill inventory प्राप्त करने हेतु `skills.status` (`operator.read`) कॉल कर सकते हैं।
  - `agentId` वैकल्पिक है; default agent workspace पढ़ने के लिए इसे छोड़ दें।
  - response में eligibility, missing requirements, config checks, और raw secret values उजागर किए बिना sanitized install options शामिल होते हैं।
- ऑपरेटर ClawHub discovery metadata के लिए `skills.search` और `skills.detail` (`operator.read`) कॉल कर सकते हैं।
- ऑपरेटर install करने से पहले private skill archive stage करने हेतु `skills.upload.begin`, `skills.upload.chunk`, और `skills.upload.commit` (`operator.admin`) कॉल कर सकते हैं। यह trusted clients के लिए अलग admin upload path है, सामान्य ClawHub skill install flow नहीं, और default रूप से disabled रहता है जब तक `skills.install.allowUploadedArchives` enabled न हो।
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })` उस slug और force value से bound upload बनाता है।
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` exact decoded offset पर bytes append करता है।
  - `skills.upload.commit({ uploadId, sha256? })` final size और SHA-256 verify करता है। Commit केवल upload को finalize करता है; यह skill install नहीं करता।
  - Uploaded skill archives ऐसे zip archives हैं जिनमें `SKILL.md` root होता है। archive का internal directory name कभी install target select नहीं करता।
- ऑपरेटर तीन modes में `skills.install` (`operator.admin`) कॉल कर सकते हैं:
  - ClawHub mode: `{ source: "clawhub", slug, version?, force? }` default agent workspace `skills/` directory में skill folder install करता है।
  - Upload mode: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }` committed upload को default agent workspace `skills/<slug>` directory में install करता है। slug और force value को original `skills.upload.begin` request से match करना होगा। यह mode तब तक rejected रहता है जब तक `skills.install.allowUploadedArchives` enabled न हो। setting ClawHub installs को प्रभावित नहीं करती।
  - Gateway installer mode: `{ name, installId, timeoutMs? }` Gateway host पर declared `metadata.openclaw.install` action चलाता है। पुराने clients अभी भी `dangerouslyForceUnsafeInstall` भेज सकते हैं; यह field deprecated है, केवल protocol compatibility के लिए accepted है, और ignored है। operator-owned install decisions के लिए `security.installPolicy` का उपयोग करें।
- ऑपरेटर दो modes में `skills.update` (`operator.admin`) कॉल कर सकते हैं:
  - ClawHub mode default agent workspace में एक tracked slug या सभी tracked ClawHub installs update करता है।
  - Config mode `skills.entries.<skillKey>` values जैसे `enabled`, `apiKey`, और `env` patch करता है।

### `models.list` views

`models.list` वैकल्पिक `view` parameter स्वीकार करता है:

- Omitted या `"default"`: current runtime behavior. यदि `agents.defaults.models` configured है, तो response allowed catalog है, जिसमें `provider/*` entries के लिए dynamically discovered models शामिल हैं। अन्यथा response full Gateway catalog है।
- `"configured"`: picker-sized behavior. यदि `agents.defaults.models` configured है, तो वही प्राथमिक रहता है, जिसमें `provider/*` entries के लिए provider-scoped discovery शामिल है। allowlist के बिना, response explicit `models.providers.*.models` entries का उपयोग करता है, और full catalog पर केवल तभी fallback करता है जब कोई configured model rows मौजूद न हों।
- `"all"`: full Gateway catalog, `agents.defaults.models` को bypass करते हुए। इसका उपयोग diagnostics और discovery UIs के लिए करें, normal model pickers के लिए नहीं।

## Exec approvals

- जब किसी exec request को approval चाहिए, Gateway `exec.approval.requested` broadcast करता है।
- Operator clients `exec.approval.resolve` कॉल करके resolve करते हैं (`operator.approvals` scope आवश्यक है)।
- `host=node` के लिए, `exec.approval.request` में `systemRunPlan` (canonical `argv`/`cwd`/`rawCommand`/session metadata) शामिल होना चाहिए। `systemRunPlan` missing वाली requests rejected होती हैं।
- approval के बाद, forwarded `node.invoke system.run` calls उसी canonical `systemRunPlan` को authoritative command/cwd/session context के रूप में reuse करते हैं।
- यदि कोई caller prepare और final approved `system.run` forward के बीच `command`, `rawCommand`, `cwd`, `agentId`, या `sessionKey` mutate करता है, तो Gateway mutated payload पर trust करने के बजाय run reject करता है।

## Agent delivery fallback

- `agent` requests outbound delivery request करने के लिए `deliver=true` शामिल कर सकती हैं।
- `bestEffortDeliver=false` strict behavior रखता है: unresolved या internal-only delivery targets `INVALID_REQUEST` लौटाते हैं।
- `bestEffortDeliver=true` तब session-only execution पर fallback की अनुमति देता है जब कोई external deliverable route resolve नहीं हो सकता (उदाहरण के लिए internal/webchat sessions या ambiguous multi-channel configs)।
- Final `agent` results में delivery requested होने पर `result.deliveryStatus` शामिल हो सकता है, जो [`openclaw agent --json --deliver`](/hi/cli/agent#json-delivery-status) के लिए documented समान `sent`, `suppressed`, `partial_failed`, और `failed` statuses का उपयोग करता है।

## Versioning

- `PROTOCOL_VERSION` `packages/gateway-protocol/src/version.ts` में रहता है।
- Clients `minProtocol` + `maxProtocol` भेजते हैं; server उन ranges को reject करता है जिनमें उसका current protocol शामिल नहीं है। current clients और servers को protocol v4 चाहिए।
- Schemas + models TypeBox definitions से generated होते हैं:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Client constants

`src/gateway/client.ts` में reference client ये defaults उपयोग करता है। Values protocol v4 में stable हैं और third-party clients के लिए expected baseline हैं।

| Constant                                  | Default                                               | Source                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| Request timeout (प्रति RPC)               | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Preauth / connect-challenge timeout       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env paired server/client budget बढ़ा सकता है) |
| Initial reconnect backoff                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Max reconnect backoff                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Fast-retry clamp after device-token close | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| Force-stop grace before `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` default timeout           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Default tick interval (pre `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Tick-timeout close                        | code `4000` when silence exceeds `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

server effective `policy.tickIntervalMs`, `policy.maxPayload`, और `policy.maxBufferedBytes` को `hello-ok` में advertise करता है; clients को pre-handshake defaults के बजाय उन values का honor करना चाहिए।

## Auth

- Shared-secret Gateway auth कॉन्फ़िगर किए गए auth मोड के आधार पर `connect.params.auth.token` या
  `connect.params.auth.password` का उपयोग करता है।
- Tailscale Serve जैसे पहचान-धारी मोड
  (`gateway.auth.allowTailscale: true`) या non-loopback
  `gateway.auth.mode: "trusted-proxy"` `connect.params.auth.*` के बजाय
  request headers से connect auth जांच पूरी करते हैं।
- Private-ingress `gateway.auth.mode: "none"` shared-secret connect auth को
  पूरी तरह छोड़ देता है; इस मोड को public/untrusted ingress पर expose न करें।
- pairing के बाद, Gateway connection role + scopes तक सीमित **device token** जारी करता है।
  यह `hello-ok.auth.deviceToken` में लौटाया जाता है और client को future connects के लिए
  persist करना चाहिए।
- Clients को किसी भी सफल connect के बाद primary `hello-ok.auth.deviceToken` persist करना चाहिए।
- उस **stored** device token के साथ reconnect करने पर उस token के लिए stored
  approved scope set भी reuse होना चाहिए। यह पहले से granted read/probe/status access को
  सुरक्षित रखता है और reconnects को चुपचाप संकरे implicit admin-only scope तक घटने से बचाता है।
- Client-side connect auth assembly (`src/gateway/client.ts` में `selectConnectAuth`):
  - `auth.password` orthogonal है और set होने पर हमेशा forward किया जाता है।
  - `auth.token` priority order में populate होता है: पहले explicit shared token,
    फिर explicit `deviceToken`, फिर stored per-device token (`deviceId` + `role` से keyed)।
  - `auth.bootstrapToken` केवल तब भेजा जाता है जब ऊपर में से किसी ने भी
    `auth.token` resolve न किया हो। shared token या कोई भी resolved device token इसे suppress कर देता है।
  - one-shot `AUTH_TOKEN_MISMATCH` retry पर stored device token की auto-promotion
    **केवल trusted endpoints** तक gated है —
    loopback, या pinned `tlsFingerprint` वाला `wss://`। Pinning के बिना public `wss://`
    qualify नहीं करता।
- Built-in setup-code bootstrap primary node
  `hello-ok.auth.deviceToken` और trusted mobile handoff के लिए
  `hello-ok.auth.deviceTokens` में bounded operator token लौटाता है। operator token में
  native Talk configuration reads के लिए `operator.talk.secrets` शामिल है और
  `operator.admin` तथा `operator.pairing` शामिल नहीं हैं।
- जब non-baseline setup-code bootstrap approval की प्रतीक्षा कर रहा हो, `PAIRING_REQUIRED`
  details में `recommendedNextStep: "wait_then_retry"`, `retryable: true`,
  और `pauseReconnect: false` शामिल होते हैं। Clients को उसी bootstrap token के साथ reconnect करते रहना चाहिए
  जब तक request approved न हो जाए या token invalid न हो जाए।
- `hello-ok.auth.deviceTokens` को केवल तब persist करें जब connect ने
  trusted transport जैसे `wss://` या loopback/local pairing पर bootstrap auth का उपयोग किया हो।
- यदि कोई client **explicit** `deviceToken` या explicit `scopes` supply करता है, तो वह
  caller-requested scope set authoritative रहता है; cached scopes केवल तब
  reuse होते हैं जब client stored per-device token reuse कर रहा हो।
- Device tokens को `device.token.rotate` और
  `device.token.revoke` के जरिए rotate/revoke किया जा सकता है (`operator.pairing` scope आवश्यक)। node या किसी अन्य non-operator role को rotate या
  revoke करने के लिए `operator.admin` भी आवश्यक है।
- `device.token.rotate` rotation metadata लौटाता है। यह replacement
  bearer token को केवल same-device calls के लिए echo करता है जो पहले से
  उस device token से authenticated हों, ताकि token-only clients reconnect करने से पहले
  अपना replacement persist कर सकें। Shared/admin rotations bearer token echo नहीं करते।
- Token issuance, rotation, और revocation उस approved role set तक bounded रहते हैं
  जो उस device की pairing entry में recorded है; token mutation pairing approval द्वारा कभी grant न किए गए
  device role को expand या target नहीं कर सकता।
- Paired-device token sessions के लिए, device management self-scoped होता है जब तक
  caller के पास `operator.admin` भी न हो: non-admin callers केवल अपने **स्वयं के** device entry के
  operator token को manage कर सकते हैं। Node और अन्य non-operator
  token management admin-only है, caller के अपने device के लिए भी।
- `device.token.rotate` और `device.token.revoke` target operator
  token scope set को caller के current session scopes के विरुद्ध भी check करते हैं। Non-admin callers
  अपने पास मौजूद scope से broader operator token को rotate या revoke नहीं कर सकते।
- Auth failures में `error.details.code` और recovery hints शामिल होते हैं:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` के लिए client behavior:
  - Trusted clients cached per-device token के साथ एक bounded retry attempt कर सकते हैं।
  - यदि वह retry fail हो जाए, clients को automatic reconnect loops रोककर operator action guidance दिखानी चाहिए।
- `AUTH_SCOPE_MISMATCH` का अर्थ है कि device token recognized था लेकिन requested role/scopes को
  cover नहीं करता। Clients को इसे bad token के रूप में present नहीं करना चाहिए;
  operator को re-pair करने या संकरे/व्यापक scope contract को approve करने के लिए prompt करें।

## Device identity + pairing

- Nodes को keypair fingerprint से derived stable device identity (`device.id`) शामिल करनी चाहिए।
- Gateways प्रति device + role tokens जारी करते हैं।
- नई device IDs के लिए pairing approvals आवश्यक हैं, जब तक local auto-approval
  enabled न हो।
- Pairing auto-approval direct local loopback connects पर centered है।
- OpenClaw में trusted shared-secret helper flows के लिए narrow backend/container-local self-connect path भी है।
- Same-host tailnet या LAN connects को pairing के लिए अब भी remote माना जाता है और
  approval आवश्यक होता है।
- WS clients आम तौर पर `connect` के दौरान `device` identity शामिल करते हैं (operator +
  node)। केवल device-less operator exceptions explicit trust paths हैं:
  - localhost-only insecure HTTP compatibility के लिए `gateway.controlUi.allowInsecureAuth=true`।
  - सफल `gateway.auth.mode: "trusted-proxy"` operator Control UI auth।
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, गंभीर security downgrade)।
  - reserved internal helper path पर direct-loopback `gateway-client` backend RPCs।
- Device identity omit करने के scope consequences होते हैं। जब device-less operator
  connection किसी explicit trust path से allowed हो, OpenClaw फिर भी
  self-declared scopes को empty set तक clear कर देता है जब तक उस path में named
  scope-preservation exception न हो। Scope-gated methods फिर
  `missing scope` के साथ fail होते हैं।
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` एक Control UI
  break-glass scope-preservation path है। यह arbitrary
  custom backend या CLI-shaped WebSocket clients को scopes grant नहीं करता।
- Reserved direct-loopback `gateway-client` backend helper path scopes को
  केवल internal local control-plane RPCs के लिए preserve करता है; custom backend IDs को
  यह exception नहीं मिलता।
- सभी connections को server-provided `connect.challenge` nonce sign करना होगा।

### Device auth migration diagnostics

legacy clients के लिए जो अभी भी pre-challenge signing behavior उपयोग करते हैं, `connect` अब
`error.details.code` के अंतर्गत stable `error.details.reason` के साथ
`DEVICE_AUTH_*` detail codes लौटाता है।

Common migration failures:

| Message                     | details.code                     | details.reason           | Meaning                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client ने `device.nonce` omit किया (या blank भेजा)। |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client ने stale/wrong nonce से sign किया।          |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Signature payload v2 payload से match नहीं करता।  |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Signed timestamp allowed skew से बाहर है।          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` public key fingerprint से match नहीं करता। |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Public key format/canonicalization fail हुई।       |

Migration target:

- हमेशा `connect.challenge` की प्रतीक्षा करें।
- server nonce शामिल करने वाले v2 payload को sign करें।
- वही nonce `connect.params.device.nonce` में भेजें।
- Preferred signature payload `v3` है, जो device/client/role/scopes/token/nonce fields के अलावा
  `platform` और `deviceFamily` को bind करता है।
- Legacy `v2` signatures compatibility के लिए accepted रहती हैं, लेकिन paired-device
  metadata pinning reconnect पर command policy को अब भी control करती है।

## TLS + pinning

- WS connections के लिए TLS supported है।
- Clients वैकल्पिक रूप से gateway cert fingerprint pin कर सकते हैं (`gateway.tls`
  config और `gateway.remote.tlsFingerprint` या CLI `--tls-fingerprint` देखें)।

## Scope

यह protocol **full Gateway API** (status, channels, models, chat,
agent, sessions, nodes, approvals, आदि) expose करता है। Exact surface
`packages/gateway-protocol/src/schema.ts` में TypeBox schemas द्वारा defined है।

## Related

- [Bridge protocol](/hi/gateway/bridge-protocol)
- [Gateway runbook](/hi/gateway)
