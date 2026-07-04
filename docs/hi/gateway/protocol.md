---
read_when:
    - Gateway WS क्लाइंट लागू करना या अपडेट करना
    - प्रोटोकॉल असंगतियों या कनेक्शन विफलताओं की डीबगिंग
    - प्रोटोकॉल स्कीमा/मॉडल को फिर से जनरेट करना
summary: 'Gateway WebSocket प्रोटोकॉल: हैंडशेक, फ़्रेम, वर्शनिंग'
title: Gateway प्रोटोकॉल
x-i18n:
    generated_at: "2026-07-04T17:59:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 763dd5cba2f1aa0de95243a4996b4da1b4aa32c5c1a4b5b6c112d605e677bd70
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS प्रोटोकॉल OpenClaw के लिए **एकमात्र कंट्रोल प्लेन + नोड ट्रांसपोर्ट** है। सभी क्लाइंट (CLI, वेब UI, macOS ऐप, iOS/Android नोड, हेडलेस नोड) WebSocket पर कनेक्ट होते हैं और हैंडशेक समय पर अपनी **भूमिका** + **स्कोप** घोषित करते हैं।

## ट्रांसपोर्ट

- WebSocket, JSON पेलोड वाले टेक्स्ट फ्रेम।
- पहला फ्रेम **अनिवार्य रूप से** `connect` अनुरोध होना चाहिए।
- प्री-कनेक्ट फ्रेम 64 KiB तक सीमित हैं। सफल हैंडशेक के बाद, क्लाइंट को `hello-ok.policy.maxPayload` और `hello-ok.policy.maxBufferedBytes` सीमाओं का पालन करना चाहिए। डायग्नॉस्टिक्स सक्षम होने पर, बहुत बड़े इनबाउंड फ्रेम और धीमे आउटबाउंड बफर gateway के प्रभावित फ्रेम को बंद करने या छोड़ने से पहले `payload.large` इवेंट उत्सर्जित करते हैं। ये इवेंट आकार, सीमाएँ, सतहें, और सुरक्षित कारण कोड रखते हैं। वे संदेश बॉडी, अटैचमेंट सामग्री, रॉ फ्रेम बॉडी, टोकन, कुकीज़, या गुप्त मान नहीं रखते।

## हैंडशेक (connect)

Gateway → क्लाइंट (प्री-कनेक्ट चुनौती):

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

जब Gateway अभी भी स्टार्टअप साइडकार पूरा कर रहा हो, तो `connect` अनुरोध `details.reason` को `"startup-sidecars"` और `retryAfterMs` पर सेट किए हुए पुनः प्रयास योग्य `UNAVAILABLE` त्रुटि लौटा सकता है। क्लाइंट को इसे अंतिम हैंडशेक विफलता के रूप में दिखाने के बजाय अपने कुल कनेक्शन बजट के भीतर उस प्रतिक्रिया का पुनः प्रयास करना चाहिए।

`server`, `features`, `snapshot`, और `policy` सभी स्कीमा (`packages/gateway-protocol/src/schema/frames.ts`) द्वारा आवश्यक हैं। `auth` भी आवश्यक है और नेगोशिएट की गई भूमिका/स्कोप रिपोर्ट करता है। `pluginSurfaceUrls` वैकल्पिक है और `canvas` जैसे Plugin सतह नामों को स्कोप किए गए होस्टेड URL से मैप करता है।

स्कोप किए गए Plugin सतह URL समाप्त हो सकते हैं। नोड `{ "surface": "canvas" }` के साथ `node.pluginSurface.refresh` कॉल करके `pluginSurfaceUrls` में नया एंट्री प्राप्त कर सकते हैं। प्रायोगिक Canvas Plugin रिफैक्टर बहिष्कृत `canvasHostUrl`, `canvasCapability`, या `node.canvas.capability.refresh` संगतता पथ का समर्थन नहीं करता; वर्तमान नेटिव क्लाइंट और gateway को Plugin सतहों का उपयोग करना चाहिए।

जब कोई डिवाइस टोकन जारी नहीं होता, तो `hello-ok.auth` टोकन फ़ील्ड के बिना नेगोशिएट की गई अनुमतियाँ रिपोर्ट करता है:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

विश्वसनीय समान-प्रक्रिया बैकएंड क्लाइंट (`client.id: "gateway-client"`, `client.mode: "backend"`) साझा gateway टोकन/पासवर्ड से प्रमाणीकरण करने पर सीधे loopback कनेक्शन पर `device` छोड़ सकते हैं। यह पथ आंतरिक कंट्रोल-प्लेन RPCs के लिए आरक्षित है और पुराने CLI/डिवाइस पेयरिंग बेसलाइन को सबएजेंट सेशन अपडेट जैसे स्थानीय बैकएंड कार्य को ब्लॉक करने से रोकता है। रिमोट क्लाइंट, ब्राउज़र-ओरिजिन क्लाइंट, नोड क्लाइंट, और स्पष्ट डिवाइस-टोकन/डिवाइस-आइडेंटिटी क्लाइंट अभी भी सामान्य पेयरिंग और स्कोप-अपग्रेड जांचों का उपयोग करते हैं।

जब डिवाइस टोकन जारी होता है, तो `hello-ok` में यह भी शामिल होता है:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

बिल्ट-इन QR/setup-code बूटस्ट्रैप एक नया मोबाइल हैंडऑफ पथ है। सफल बेसलाइन setup-code connect एक प्राथमिक नोड टोकन और एक सीमित operator टोकन लौटाता है:

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

operator हैंडऑफ जानबूझकर सीमित है ताकि QR ऑनबोर्डिंग मोबाइल operator लूप शुरू कर सके और पेयरिंग म्यूटेशन स्कोप या `operator.admin` दिए बिना नेटिव सेटअप पूरा कर सके। इसमें `operator.talk.secrets` शामिल है ताकि नेटिव क्लाइंट बूटस्ट्रैप के बाद आवश्यक Talk कॉन्फ़िगरेशन पढ़ सके। व्यापक पेयरिंग और एडमिन एक्सेस के लिए अलग स्वीकृत operator पेयरिंग या टोकन फ़्लो चाहिए। क्लाइंट को `hello-ok.auth.deviceTokens` केवल तब स्थायी रखना चाहिए जब connect ने `wss://` या loopback/local pairing जैसे विश्वसनीय ट्रांसपोर्ट पर बूटस्ट्रैप auth का उपयोग किया हो।

### नोड उदाहरण

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

- **अनुरोध**: `{type:"req", id, method, params}`
- **प्रतिक्रिया**: `{type:"res", id, ok, payload|error}`
- **इवेंट**: `{type:"event", event, payload, seq?, stateVersion?}`

साइड-इफ़ेक्ट करने वाली विधियों के लिए **idempotency keys** आवश्यक हैं (स्कीमा देखें)।

## भूमिकाएँ + स्कोप

पूर्ण operator स्कोप मॉडल, approval-time जांचों, और shared-secret अर्थों के लिए, [Operator scopes](/hi/gateway/operator-scopes) देखें।

### भूमिकाएँ

- `operator` = कंट्रोल प्लेन क्लाइंट (CLI/UI/ऑटोमेशन)।
- `node` = क्षमता होस्ट (camera/screen/canvas/system.run)।

### स्कोप (operator)

सामान्य स्कोप:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` के साथ `talk.config` के लिए `operator.talk.secrets` (या `operator.admin`) आवश्यक है।
जब सीक्रेट शामिल हों, तो क्लाइंट को सक्रिय Talk provider credential `talk.resolved.config.apiKey` से पढ़ना चाहिए; `talk.providers.<id>.apiKey` स्रोत-आकार में रहता है और SecretRef ऑब्जेक्ट या संपादित स्ट्रिंग हो सकता है।

Plugin-registered gateway RPC विधियाँ अपना operator स्कोप मांग सकती हैं, लेकिन आरक्षित core admin prefixes (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) हमेशा `operator.admin` में रिज़ॉल्व होते हैं।

विधि स्कोप केवल पहला गेट है। `chat.send` के माध्यम से पहुँचे कुछ slash commands इसके ऊपर अधिक कड़ी command-level जांच लागू करते हैं। उदाहरण के लिए, स्थायी `/config set` और `/config unset` writes के लिए `operator.admin` आवश्यक है।

`node.pair.approve` में base method scope के ऊपर अतिरिक्त approval-time scope check भी है:

- कमांड-रहित अनुरोध: `operator.pairing`
- non-exec node commands वाले अनुरोध: `operator.pairing` + `operator.write`
- ऐसे अनुरोध जिनमें `system.run`, `system.run.prepare`, या `system.which` शामिल हो:
  `operator.pairing` + `operator.admin`

### कैप्स/कमांड/अनुमतियाँ (नोड)

नोड connect समय पर capability claims घोषित करते हैं:

- `caps`: उच्च-स्तरीय capability categories जैसे `camera`, `canvas`, `screen`, `location`, `voice`, और `talk`।
- `commands`: invoke के लिए command allowlist।
- `permissions`: सूक्ष्म toggles (जैसे `screen.record`, `camera.capture`)।

Gateway इन्हें **claims** मानता है और server-side allowlists लागू करता है।

## उपस्थिति

- `system-presence` डिवाइस पहचान द्वारा keyed entries लौटाता है।
- उपस्थिति entries में `deviceId`, `roles`, और `scopes` शामिल होते हैं ताकि UI प्रति डिवाइस एक ही row दिखा सकें, भले ही वह **operator** और **node** दोनों के रूप में कनेक्ट हो।
- `node.list` में वैकल्पिक `lastSeenAtMs` और `lastSeenReason` फ़ील्ड शामिल हैं। कनेक्टेड नोड अपने वर्तमान कनेक्शन समय को `connect` कारण के साथ `lastSeenAtMs` के रूप में रिपोर्ट करते हैं; paired nodes विश्वसनीय नोड इवेंट द्वारा उनकी pairing metadata अपडेट किए जाने पर durable background presence भी रिपोर्ट कर सकते हैं।

### नोड बैकग्राउंड alive इवेंट

नोड `event: "node.presence.alive"` के साथ `node.event` कॉल कर सकते हैं ताकि रिकॉर्ड हो कि paired node background wake के दौरान connected चिह्नित हुए बिना alive था।

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` एक बंद enum है: `background`, `silent_push`, `bg_app_refresh`, `significant_location`, `manual`, या `connect`। अज्ञात trigger strings को persistence से पहले gateway द्वारा `background` में normalized किया जाता है। इवेंट केवल authenticated node device sessions के लिए durable है; device-less या unpaired sessions `handled: false` लौटाते हैं।

सफल gateway structured result लौटाते हैं:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

पुराने gateway `node.event` के लिए अभी भी `{ "ok": true }` लौटा सकते हैं; क्लाइंट को इसे acknowledged RPC मानना चाहिए, durable presence persistence नहीं।

## ब्रॉडकास्ट इवेंट स्कोपिंग

Server-pushed WebSocket broadcast events scope-gated होते हैं ताकि pairing-scoped या node-only sessions निष्क्रिय रूप से session content प्राप्त न करें।

- **Chat, agent, और tool-result frames** (streamed `agent` events और tool call results सहित) के लिए कम से कम `operator.read` आवश्यक है। `operator.read` के बिना sessions इन frames को पूरी तरह छोड़ देते हैं।
- **Plugin-defined `plugin.*` broadcasts** `operator.write` या `operator.admin` तक gated होते हैं, यह इस पर निर्भर करता है कि plugin ने उन्हें कैसे registered किया है।
- **Status और transport events** (`heartbeat`, `presence`, `tick`, connect/disconnect lifecycle, आदि) unrestricted रहते हैं ताकि transport health हर authenticated session के लिए observable रहे।
- **Unknown broadcast event families** डिफ़ॉल्ट रूप से scope-gated होते हैं (fail-closed), जब तक कोई registered handler उन्हें स्पष्ट रूप से relax न करे।

हर client connection अपना per-client sequence number रखता है ताकि broadcasts उस socket पर monotonic ordering बनाए रखें, भले ही अलग-अलग clients event stream के अलग-अलग scope-filtered subsets देखें।

## सामान्य RPC method families

सार्वजनिक WS surface ऊपर दिए handshake/auth examples से व्यापक है। यह generated dump नहीं है — `hello-ok.features.methods` `src/gateway/server-methods-list.ts` और loaded plugin/channel method exports से बनी conservative discovery list है। इसे feature discovery मानें, `src/gateway/server-methods/*.ts` की full enumeration नहीं।

  <AccordionGroup>
  <Accordion title="सिस्टम और पहचान">
    - `health` कैश किया हुआ या नए सिरे से जांचा गया gateway health snapshot लौटाता है।
    - `diagnostics.stability` हाल का सीमित diagnostic stability recorder लौटाता है। यह event names, counts, byte sizes, memory readings, queue/session state, channel/plugin names, और session ids जैसी परिचालन metadata रखता है। यह chat text, webhook bodies, tool outputs, raw request या response bodies, tokens, cookies, या secret values नहीं रखता। Operator read scope आवश्यक है।
    - `status` `/status`-शैली का gateway सारांश लौटाता है; संवेदनशील फ़ील्ड केवल admin-scoped operator clients के लिए शामिल किए जाते हैं।
    - `gateway.identity.get` relay और pairing flows द्वारा उपयोग की जाने वाली gateway device identity लौटाता है।
    - `system-presence` connected operator/node devices के लिए वर्तमान presence snapshot लौटाता है।
    - `system-event` एक system event जोड़ता है और presence context को update/broadcast कर सकता है।
    - `last-heartbeat` नवीनतम persisted heartbeat event लौटाता है।
    - `set-heartbeats` Gateway पर heartbeat processing को toggle करता है।

  </Accordion>

  <Accordion title="Models और उपयोग">
    - `models.list` runtime-allowed model catalog लौटाता है। picker-sized configured models (`agents.defaults.models` पहले, फिर `models.providers.*.models`) के लिए `{ "view": "configured" }` पास करें, या पूरे catalog के लिए `{ "view": "all" }` पास करें।
    - `usage.status` provider usage windows/remaining quota summaries लौटाता है।
    - `usage.cost` date range के लिए aggregated cost usage summaries लौटाता है।
      एक agent के लिए `agentId` पास करें, या configured agents को aggregate करने के लिए `agentScope: "all"` पास करें।
    - `doctor.memory.status` active default agent workspace के लिए vector-memory / cached embedding readiness लौटाता है। `{ "probe": true }` या `{ "deep": true }` केवल तब पास करें जब caller स्पष्ट रूप से live embedding provider ping चाहता हो। Dreaming-aware clients चयनित agent workspace तक Dreaming store stats को scope करने के लिए `{ "agentId": "agent-id" }` भी पास कर सकते हैं; `agentId` छोड़ने पर default-agent fallback बना रहता है और configured Dreaming workspaces aggregate होते हैं।
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts`, और `doctor.memory.dedupeDreamDiary` चयनित-agent Dreaming views/actions के लिए वैकल्पिक `{ "agentId": "agent-id" }` params स्वीकार करते हैं। जब `agentId` छोड़ा जाता है, वे configured default agent workspace पर काम करते हैं।
    - `doctor.memory.remHarness` remote control-plane clients के लिए bounded, read-only REM harness preview लौटाता है। इसमें workspace paths, memory snippets, rendered grounded markdown, और deep promotion candidates शामिल हो सकते हैं, इसलिए callers को `operator.read` चाहिए।
    - `sessions.usage` per-session usage summaries लौटाता है। एक
      agent के लिए `agentId` पास करें, या configured agents को साथ में list करने के लिए `agentScope: "all"` पास करें।
    - `sessions.usage.timeseries` एक session के लिए timeseries usage लौटाता है।
    - `sessions.usage.logs` एक session के लिए usage log entries लौटाता है।

  </Accordion>

  <Accordion title="Channels और login helpers">
    - `channels.status` built-in + bundled channel/plugin status summaries लौटाता है।
    - `channels.logout` उस specific channel/account को log out करता है जहां channel logout support करता है।
    - `web.login.start` वर्तमान QR-capable web channel provider के लिए QR/web login flow शुरू करता है।
    - `web.login.wait` उस QR/web login flow के complete होने की प्रतीक्षा करता है और success पर channel शुरू करता है।
    - `push.test` registered iOS node को test APNs push भेजता है।
    - `voicewake.get` stored wake-word triggers लौटाता है।
    - `voicewake.set` wake-word triggers update करता है और change broadcast करता है।

  </Accordion>

  <Accordion title="Messaging और logs">
    - `send` chat runner के बाहर channel/account/thread-targeted sends के लिए direct outbound-delivery RPC है।
    - `logs.tail` cursor/limit और max-byte controls के साथ configured gateway file-log tail लौटाता है।

  </Accordion>

  <Accordion title="Talk और TTS">
    - `talk.catalog` speech, streaming transcription, और realtime voice के लिए read-only Talk provider catalog लौटाता है। इसमें provider secrets लौटाए बिना या global config mutate किए बिना canonical provider ids, registry aliases, labels, configured state, optional group-level `ready` result, exposed model/voice ids, canonical modes, transports, brain strategies, और realtime audio/capability flags शामिल होते हैं। Current Gateways runtime provider selection apply करने के बाद `ready` set करते हैं; clients को older Gateways के साथ compatibility के लिए इसकी अनुपस्थिति को unverified मानना चाहिए।
    - `talk.config` effective Talk config payload लौटाता है; `includeSecrets` के लिए `operator.talk.secrets` (या `operator.admin`) आवश्यक है।
    - `talk.session.create` `realtime/gateway-relay`, `transcription/gateway-relay`, या `stt-tts/managed-room` के लिए Gateway-owned Talk session बनाता है। `stt-tts/managed-room` के लिए, `sessionKey` पास करने वाले `operator.write` callers को scoped session-key visibility के लिए `spawnedBy` भी पास करना होगा; unscoped `sessionKey` creation और `brain: "direct-tools"` के लिए `operator.admin` आवश्यक है।
    - `talk.session.join` managed-room session token validate करता है, जरूरत के अनुसार `session.ready` या `session.replaced` events emit करता है, और plaintext token या stored token hash के बिना room/session metadata plus recent Talk events लौटाता है।
    - `talk.session.appendAudio` Gateway-owned realtime relay और transcription sessions में base64 PCM input audio append करता है।
    - `talk.session.startTurn`, `talk.session.endTurn`, और `talk.session.cancelTurn` state clear होने से पहले stale-turn rejection के साथ managed-room turn lifecycle चलाते हैं।
    - `talk.session.cancelOutput` assistant audio output रोकता है, मुख्य रूप से Gateway relay sessions में VAD-gated barge-in के लिए।
    - `talk.session.submitToolResult` Gateway-owned realtime relay session द्वारा emitted provider tool call complete करता है। interim tool output के लिए `options: { willContinue: true }` पास करें जब final result बाद में आएगा, या `options: { suppressResponse: true }` पास करें जब tool result को दूसरी realtime assistant response शुरू किए बिना provider call satisfy करनी चाहिए।
    - `talk.session.steer` Gateway-owned agent-backed Talk session में active-run voice control भेजता है। यह `{ sessionId, text, mode? }` स्वीकार करता है, जहां `mode` `status`, `steer`, `cancel`, या `followup` है; छोड़ा गया mode spoken text से classified होता है।
    - `talk.session.close` Gateway-owned relay, transcription, या managed-room session बंद करता है और terminal Talk events emit करता है।
    - `talk.mode` WebChat/Control UI clients के लिए वर्तमान Talk mode state set/broadcast करता है।
    - `talk.client.create` `webrtc` या `provider-websocket` का उपयोग करके client-owned realtime provider session बनाता है, जबकि Gateway config, credentials, instructions, और tool policy own करता है।
    - `talk.client.toolCall` client-owned realtime transports को provider tool calls Gateway policy तक forward करने देता है। पहला supported tool `openclaw_agent_consult` है; provider-specific tool result submit करने से पहले clients को run id मिलता है और वे normal chat lifecycle events की प्रतीक्षा करते हैं।
    - `talk.client.steer` client-owned realtime transports के लिए active-run voice control भेजता है। Gateway `sessionKey` से active embedded run resolve करता है और steering को चुपचाप drop करने के बजाय structured accepted/rejected result लौटाता है।
    - `talk.event` realtime, transcription, STT/TTS, managed-room, telephony, और meeting adapters के लिए single Talk event channel है।
    - `talk.speak` active Talk speech provider के माध्यम से speech synthesize करता है।
    - `tts.status` TTS enabled state, active provider, fallback providers, और provider config state लौटाता है।
    - `tts.providers` visible TTS provider inventory लौटाता है।
    - `tts.enable` और `tts.disable` TTS prefs state toggle करते हैं।
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
    - `config.schema` Control UI और CLI tooling द्वारा उपयोग किया जाने वाला live config schema payload लौटाता है: schema, `uiHints`, version, और generation metadata, जिसमें plugin + channel schema metadata शामिल होता है जब runtime उसे load कर सकता है। schema में UI द्वारा उपयोग किए गए समान labels और help text से derived field `title` / `description` metadata शामिल होता है, जिसमें matching field documentation मौजूद होने पर nested object, wildcard, array-item, और `anyOf` / `oneOf` / `allOf` composition branches भी शामिल होते हैं।
    - `config.schema.lookup` एक config path के लिए path-scoped lookup payload लौटाता है: normalized path, shallow schema node, matched hint + `hintPath`, optional `reloadKind`, और UI/CLI drill-down के लिए immediate child summaries। `reloadKind` `restart`, `hot`, या `none` में से एक है और requested path के लिए Gateway config reload planner को mirror करता है। Lookup schema nodes user-facing docs और common validation fields (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numeric/string/array/object bounds, और `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` जैसे flags) रखते हैं। Child summaries `key`, normalized `path`, `type`, `required`, `hasChildren`, optional `reloadKind`, plus matched `hint` / `hintPath` expose करते हैं।
    - `update.run` gateway update flow चलाता है और restart केवल तब schedule करता है जब update स्वयं succeed हुआ हो; session वाले callers `continuationMessage` शामिल कर सकते हैं ताकि startup restart continuation queue के माध्यम से एक follow-up agent turn resume करे। control plane से package-manager updates और supervised git-checkout updates live Gateway के अंदर package tree replace करने या checkout/build output mutate करने के बजाय detached managed-service handoff का उपयोग करते हैं। शुरू किया गया handoff `result.reason: "managed-service-handoff-started"` और `handoff.status: "started"` के साथ `ok: true` लौटाता है; unavailable या failed handoffs `managed-service-handoff-unavailable` या `managed-service-handoff-failed` के साथ `ok: false` लौटाते हैं, plus manual shell update आवश्यक होने पर `handoff.command`। unavailable handoff का अर्थ है कि OpenClaw के पास safe supervisor boundary या durable service identity नहीं है, जैसे systemd के लिए `OPENCLAW_SYSTEMD_UNIT`। शुरू किए गए handoff के दौरान, restart sentinel briefly `stats.reason: "restart-health-pending"` report कर सकता है; continuation तब तक delay होती है जब तक CLI restarted Gateway verify करके final `ok` sentinel नहीं लिख देता।
    - `update.status` latest update restart sentinel refresh और return करता है, जिसमें उपलब्ध होने पर post-restart running version शामिल होता है।
    - `wizard.start`, `wizard.next`, `wizard.status`, और `wizard.cancel` WS RPC पर onboarding wizard expose करते हैं।

  </Accordion>

  <Accordion title="एजेंट और वर्कस्पेस हेल्पर">
    - `agents.list` कॉन्फ़िगर की गई एजेंट प्रविष्टियाँ लौटाता है, जिनमें प्रभावी मॉडल और रनटाइम मेटाडेटा शामिल होता है।
    - `agents.create`, `agents.update`, और `agents.delete` एजेंट रिकॉर्ड और वर्कस्पेस वायरिंग प्रबंधित करते हैं।
    - `agents.files.list`, `agents.files.get`, और `agents.files.set` किसी एजेंट के लिए उजागर की गई बूटस्ट्रैप वर्कस्पेस फ़ाइलें प्रबंधित करते हैं।
    - `tasks.list`, `tasks.get`, और `tasks.cancel` SDK और ऑपरेटर क्लाइंट के लिए Gateway टास्क लेजर उजागर करते हैं।
    - `artifacts.list`, `artifacts.get`, और `artifacts.download` किसी स्पष्ट `sessionKey`, `runId`, या `taskId` स्कोप के लिए ट्रांसक्रिप्ट-व्युत्पन्न आर्टिफ़ैक्ट सारांश और डाउनलोड उजागर करते हैं। रन और टास्क क्वेरी सर्वर-साइड स्वामी सेशन का समाधान करती हैं और केवल मेल खाते उद्गम वाले ट्रांसक्रिप्ट मीडिया लौटाती हैं; असुरक्षित या स्थानीय URL स्रोत सर्वर-साइड फ़ेच करने के बजाय असमर्थित डाउनलोड लौटाते हैं।
    - `environments.list` और `environments.status` SDK क्लाइंट के लिए केवल-पढ़ने योग्य Gateway-स्थानीय और नोड परिवेश खोज उजागर करते हैं।
    - `agent.identity.get` किसी एजेंट या सेशन के लिए प्रभावी असिस्टेंट पहचान लौटाता है।
    - `agent.wait` किसी रन के समाप्त होने की प्रतीक्षा करता है और उपलब्ध होने पर टर्मिनल स्नैपशॉट लौटाता है।

  </Accordion>

  <Accordion title="सेशन नियंत्रण">
    - `sessions.list` वर्तमान सेशन इंडेक्स लौटाता है, जिसमें एजेंट रनटाइम बैकएंड कॉन्फ़िगर होने पर प्रति-पंक्ति `agentRuntime` मेटाडेटा शामिल होता है।
    - `sessions.subscribe` और `sessions.unsubscribe` वर्तमान WS क्लाइंट के लिए सेशन परिवर्तन इवेंट सदस्यताएँ टॉगल करते हैं।
    - `sessions.messages.subscribe` और `sessions.messages.unsubscribe` एक सेशन के लिए ट्रांसक्रिप्ट/संदेश इवेंट सदस्यताएँ टॉगल करते हैं।
    - `sessions.preview` विशिष्ट सेशन कुंजियों के लिए सीमित ट्रांसक्रिप्ट पूर्वावलोकन लौटाता है।
    - `sessions.describe` किसी सटीक सेशन कुंजी के लिए एक Gateway सेशन पंक्ति लौटाता है।
    - `sessions.resolve` सेशन लक्ष्य का समाधान या कैननिकलाइज़ करता है।
    - `sessions.create` नई सेशन प्रविष्टि बनाता है।
    - `sessions.send` किसी मौजूदा सेशन में संदेश भेजता है।
    - `sessions.steer` सक्रिय सेशन के लिए इंटरप्ट-और-स्टीयर वैरिएंट है।
    - `sessions.abort` किसी सेशन के लिए सक्रिय कार्य रोकता है। कॉलर `key` के साथ वैकल्पिक `runId` पास कर सकता है, या उन सक्रिय रन के लिए केवल `runId` पास कर सकता है जिन्हें Gateway किसी सेशन से जोड़ सकता है।
    - `sessions.patch` सेशन मेटाडेटा/ओवरराइड अपडेट करता है और हल किए गए कैननिकल मॉडल के साथ प्रभावी `agentRuntime` रिपोर्ट करता है।
    - `sessions.reset`, `sessions.delete`, और `sessions.compact` सेशन रखरखाव करते हैं।
    - `sessions.get` पूरी संग्रहीत सेशन पंक्ति लौटाता है।
    - चैट निष्पादन अब भी `chat.history`, `chat.send`, `chat.abort`, और `chat.inject` का उपयोग करता है। `chat.history` UI क्लाइंट के लिए डिस्प्ले-सामान्यीकृत है: इनलाइन निर्देश टैग दृश्यमान टेक्स्ट से हटाए जाते हैं, सादा-पाठ टूल-कॉल XML पेलोड (जिसमें `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, और काटे गए टूल-कॉल ब्लॉक शामिल हैं) और लीक हुए ASCII/फुल-विथ मॉडल कंट्रोल टोकन हटाए जाते हैं, सटीक `NO_REPLY` / `no_reply` जैसी शुद्ध साइलेंट-टोकन असिस्टेंट पंक्तियाँ छोड़ी जाती हैं, और अत्यधिक बड़ी पंक्तियों को प्लेसहोल्डर से बदला जा सकता है।
    - `chat.message.get` एकल दृश्यमान ट्रांसक्रिप्ट प्रविष्टि के लिए additive सीमित पूर्ण-संदेश रीडर है। क्लाइंट `sessionKey`, सेशन चयन एजेंट-स्कोप्ड होने पर वैकल्पिक `agentId`, और `chat.history` के माध्यम से पहले उजागर किया गया ट्रांसक्रिप्ट `messageId` पास करते हैं, और Gateway वही डिस्प्ले-सामान्यीकृत प्रोजेक्शन हल्के इतिहास काटने की सीमा के बिना लौटाता है, जब संग्रहीत प्रविष्टि अब भी उपलब्ध हो और अत्यधिक बड़ी न हो।
    - `chat.send` ऑटो कटऑफ़ से पहले शुरू हुई मॉडल कॉल के लिए फास्ट मोड का उपयोग करने हेतु एक-टर्न `fastMode: "auto"` स्वीकार करता है, फिर बाद की रीट्राई, फॉलबैक, टूल-रिज़ल्ट, या कंटिन्युएशन कॉल फास्ट मोड के बिना शुरू करता है। कटऑफ़ डिफ़ॉल्ट रूप से 60 सेकंड है और इसे प्रति मॉडल `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` से कॉन्फ़िगर किया जा सकता है। `chat.send` कॉलर उस अनुरोध के लिए कटऑफ़ ओवरराइड करने हेतु एक-टर्न `fastAutoOnSeconds` पास कर सकता है।

  </Accordion>

  <Accordion title="डिवाइस पेयरिंग और डिवाइस टोकन">
    - `device.pair.list` लंबित और स्वीकृत पेयर्ड डिवाइस लौटाता है।
    - `device.pair.setupCode` मोबाइल सेटअप कोड और, डिफ़ॉल्ट रूप से, PNG QR डेटा URL बनाता है। इसके लिए `operator.admin` आवश्यक है और इसे जानबूझकर विज्ञापित खोज से बाहर रखा गया है। परिणाम में `setupCode`, वैकल्पिक `qrDataUrl`, `gatewayUrl`, गैर-गोपनीय `auth` लेबल, और `urlSource` शामिल होते हैं।
    - `device.pair.approve`, `device.pair.reject`, और `device.pair.remove` डिवाइस-पेयरिंग रिकॉर्ड प्रबंधित करते हैं।
    - `device.token.rotate` किसी पेयर्ड डिवाइस टोकन को उसकी स्वीकृत भूमिका और कॉलर स्कोप सीमाओं के भीतर रोटेट करता है।
    - `device.token.revoke` किसी पेयर्ड डिवाइस टोकन को उसकी स्वीकृत भूमिका और कॉलर स्कोप सीमाओं के भीतर निरस्त करता है।

    सेटअप कोड में अल्पकालिक बूटस्ट्रैप क्रेडेंशियल एम्बेड होता है। क्लाइंट को इसे पेयरिंग फ़्लो से आगे
    लॉग या स्थायी नहीं रखना चाहिए।

  </Accordion>

  <Accordion title="Node पेयरिंग, इनवोक, और लंबित कार्य">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, और `node.pair.verify` नोड पेयरिंग और बूटस्ट्रैप सत्यापन कवर करते हैं।
    - `node.list` और `node.describe` ज्ञात/कनेक्टेड नोड स्थिति लौटाते हैं।
    - `node.rename` पेयर्ड नोड लेबल अपडेट करता है।
    - `node.invoke` किसी कनेक्टेड नोड को कमांड अग्रेषित करता है।
    - `node.invoke.result` इनवोक अनुरोध का परिणाम लौटाता है।
    - `node.event` नोड-उत्पन्न इवेंट को वापस Gateway में ले जाता है।
    - `node.pending.pull` और `node.pending.ack` कनेक्टेड-नोड क्यू API हैं।
    - `node.pending.enqueue` और `node.pending.drain` ऑफ़लाइन/डिस्कनेक्टेड नोड के लिए टिकाऊ लंबित कार्य प्रबंधित करते हैं।

  </Accordion>

  <Accordion title="स्वीकृति परिवार">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, और `exec.approval.resolve` वन-शॉट exec स्वीकृति अनुरोधों के साथ लंबित स्वीकृति लुकअप/रीप्ले कवर करते हैं।
    - `exec.approval.waitDecision` एक लंबित exec स्वीकृति पर प्रतीक्षा करता है और अंतिम निर्णय लौटाता है (या टाइमआउट पर `null`)।
    - `exec.approvals.get` और `exec.approvals.set` gateway exec स्वीकृति नीति स्नैपशॉट प्रबंधित करते हैं।
    - `exec.approvals.node.get` और `exec.approvals.node.set` नोड रिले कमांड के माध्यम से नोड-स्थानीय exec स्वीकृति नीति प्रबंधित करते हैं।
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, और `plugin.approval.resolve` plugin-परिभाषित स्वीकृति फ़्लो कवर करते हैं।

  </Accordion>

  <Accordion title="ऑटोमेशन, Skills, और टूल">
    - ऑटोमेशन: `wake` तत्काल या अगले-Heartbeat वेक टेक्स्ट इंजेक्शन को शेड्यूल करता है; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` शेड्यूल किए गए कार्य प्रबंधित करते हैं।
    - `cron.run` मैनुअल रन के लिए एनक्यू-शैली RPC बना रहता है। जिन क्लाइंट को पूर्णता सिमेंटिक्स चाहिए, उन्हें लौटाया गया `runId` पढ़ना चाहिए और `cron.runs` पोल करना चाहिए।
    - `cron.runs` वैकल्पिक गैर-खाली `runId` फ़िल्टर स्वीकार करता है ताकि क्लाइंट उसी जॉब के अन्य इतिहास प्रविष्टियों से रेस किए बिना एक क्यू किए गए मैनुअल रन का अनुसरण कर सकें।
    - Skills और टूल: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### सामान्य इवेंट परिवार

- `chat`: UI चैट अपडेट जैसे `chat.inject` और अन्य केवल-ट्रांसक्रिप्ट चैट
  इवेंट। प्रोटोकॉल v4 में, डेल्टा पेलोड `deltaText` रखते हैं; `message`
  संचयी असिस्टेंट स्नैपशॉट बना रहता है। गैर-प्रीफ़िक्स प्रतिस्थापन `replace=true`
  सेट करते हैं और `deltaText` को प्रतिस्थापन टेक्स्ट के रूप में उपयोग करते हैं।
- `session.message`, `session.operation`, और `session.tool`: सब्सक्राइब किए गए
  सेशन के लिए ट्रांसक्रिप्ट, इन-फ़्लाइट सेशन ऑपरेशन, और इवेंट-स्ट्रीम अपडेट।
- `sessions.changed`: सेशन इंडेक्स या मेटाडेटा बदला।
- `presence`: सिस्टम प्रेज़ेंस स्नैपशॉट अपडेट।
- `tick`: आवधिक keepalive / liveness इवेंट।
- `health`: gateway स्वास्थ्य स्नैपशॉट अपडेट।
- `heartbeat`: heartbeat इवेंट स्ट्रीम अपडेट।
- `cron`: cron रन/जॉब परिवर्तन इवेंट।
- `shutdown`: gateway शटडाउन सूचना।
- `node.pair.requested` / `node.pair.resolved`: नोड पेयरिंग जीवनचक्र।
- `node.invoke.request`: नोड इनवोक अनुरोध प्रसारण।
- `device.pair.requested` / `device.pair.resolved`: पेयर्ड-डिवाइस जीवनचक्र।
- `voicewake.changed`: वेक-वर्ड ट्रिगर कॉन्फ़िग बदला।
- `exec.approval.requested` / `exec.approval.resolved`: exec स्वीकृति
  जीवनचक्र।
- `plugin.approval.requested` / `plugin.approval.resolved`: plugin स्वीकृति
  जीवनचक्र।

### नोड हेल्पर विधियाँ

- नोड ऑटो-अलाउ जाँचों के लिए कौशल निष्पाद्य फ़ाइलों की वर्तमान सूची पाने हेतु `skills.bins` कॉल कर सकते हैं।

### टास्क लेजर RPC

ऑपरेटर क्लाइंट टास्क लेजर RPC के माध्यम से Gateway बैकग्राउंड टास्क रिकॉर्ड का निरीक्षण और रद्द कर सकते हैं। ये विधियाँ स्वच्छ किए गए टास्क सारांश लौटाती हैं, कच्ची रनटाइम स्थिति नहीं।

- `tasks.list` के लिए `operator.read` आवश्यक है।
  - पैरामीटर: वैकल्पिक `status` (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"`, या `"timed_out"`) या उन स्थितियों की सरणी,
    वैकल्पिक `agentId`, वैकल्पिक `sessionKey`, वैकल्पिक `limit` `1` से
    `500` तक, और वैकल्पिक स्ट्रिंग `cursor`।
  - परिणाम: `{ "tasks": TaskSummary[], "nextCursor"?: string }`।
- `tasks.get` के लिए `operator.read` आवश्यक है।
  - पैरामीटर: `{ "taskId": string }`।
  - परिणाम: `{ "task": TaskSummary }`।
  - अनुपस्थित टास्क id Gateway not-found त्रुटि आकार लौटाते हैं।
- `tasks.cancel` के लिए `operator.write` आवश्यक है।
  - पैरामीटर: `{ "taskId": string, "reason"?: string }`।
  - परिणाम:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`।
  - `found` रिपोर्ट करता है कि लेजर में मेल खाता टास्क था या नहीं। `cancelled`
    रिपोर्ट करता है कि रनटाइम ने रद्दीकरण स्वीकार किया या रिकॉर्ड किया या नहीं।

`TaskSummary` में `id`, `status`, और वैकल्पिक मेटाडेटा शामिल हैं, जैसे `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, टाइमस्टैम्प, प्रगति,
टर्मिनल सारांश, और स्वच्छ किया गया त्रुटि टेक्स्ट। `agentId` टास्क निष्पादित
कर रहे एजेंट की पहचान करता है; `sessionKey` और `ownerKey` अनुरोधकर्ता और नियंत्रण
संदर्भ को सुरक्षित रखते हैं।

### ऑपरेटर हेल्पर विधियाँ

- ऑपरेटर किसी एजेंट के लिए रनटाइम कमांड इन्वेंटरी लाने हेतु `commands.list` (`operator.read`) कॉल कर सकते हैं।
  - `agentId` वैकल्पिक है; डिफ़ॉल्ट एजेंट कार्यस्थान पढ़ने के लिए इसे छोड़ दें।
  - `scope` नियंत्रित करता है कि प्राथमिक `name` किस सतह को लक्षित करता है:
    - `text` अग्रणी `/` के बिना प्राथमिक टेक्स्ट कमांड टोकन लौटाता है
    - `native` और डिफ़ॉल्ट `both` पथ उपलब्ध होने पर प्रदाता-सचेत नेटिव नाम लौटाते हैं
  - `textAliases` `/model` और `/m` जैसे सटीक स्लैश उपनाम रखता है।
  - `nativeName` प्रदाता-सचेत नेटिव कमांड नाम रखता है, जब कोई मौजूद हो।
  - `provider` वैकल्पिक है और केवल नेटिव नामकरण तथा नेटिव Plugin कमांड उपलब्धता को प्रभावित करता है।
  - `includeArgs=false` प्रतिक्रिया से क्रमबद्ध आर्ग्युमेंट मेटाडेटा हटा देता है।
- ऑपरेटर किसी एजेंट के लिए रनटाइम टूल कैटलॉग लाने हेतु `tools.catalog` (`operator.read`) कॉल कर सकते हैं। प्रतिक्रिया में समूहबद्ध टूल और उत्पत्ति मेटाडेटा शामिल होते हैं:
  - `source`: `core` या `plugin`
  - `pluginId`: `source="plugin"` होने पर Plugin स्वामी
  - `optional`: क्या कोई Plugin टूल वैकल्पिक है
- ऑपरेटर किसी सत्र के लिए रनटाइम-प्रभावी टूल इन्वेंटरी लाने हेतु `tools.effective` (`operator.read`) कॉल कर सकते हैं।
  - `sessionKey` आवश्यक है।
  - Gateway कॉलर-आपूर्ति किए गए ऑथ या डिलीवरी संदर्भ को स्वीकार करने के बजाय सत्र से सर्वर-साइड विश्वसनीय रनटाइम संदर्भ निकालता है।
  - प्रतिक्रिया सक्रिय इन्वेंटरी का सत्र-स्कोप, सर्वर-व्युत्पन्न प्रोजेक्शन है, जिसमें core, Plugin, चैनल, और पहले से खोजे गए MCP सर्वर टूल शामिल हैं।
  - `tools.effective` MCP के लिए केवल-पठन है: यह अंतिम टूल नीति के माध्यम से गर्म सत्र MCP कैटलॉग को प्रोजेक्ट कर सकता है, लेकिन यह MCP रनटाइम नहीं बनाता, ट्रांसपोर्ट कनेक्ट नहीं करता, या `tools/list` जारी नहीं करता। यदि कोई मिलान वाला गर्म कैटलॉग मौजूद नहीं है, तो प्रतिक्रिया में `mcp-not-yet-connected`, `mcp-not-yet-listed`, या `mcp-stale-catalog` जैसी सूचना शामिल हो सकती है।
  - प्रभावी टूल प्रविष्टियां `source="core"`, `source="plugin"`, `source="channel"`, या `source="mcp"` का उपयोग करती हैं।
- ऑपरेटर `/tools/invoke` जैसे ही Gateway नीति पथ के माध्यम से एक उपलब्ध टूल लागू करने के लिए `tools.invoke` (`operator.write`) कॉल कर सकते हैं।
  - `name` आवश्यक है। `args`, `sessionKey`, `agentId`, `confirm`, और `idempotencyKey` वैकल्पिक हैं।
  - यदि `sessionKey` और `agentId` दोनों मौजूद हैं, तो हल किए गए सत्र एजेंट को `agentId` से मेल खाना चाहिए।
  - `cron`, `gateway`, और `nodes` जैसे केवल-स्वामी core wrappers को स्वामी/एडमिन पहचान (`operator.admin`) चाहिए, भले ही `tools.invoke` विधि स्वयं `operator.write` हो।
  - प्रतिक्रिया `ok`, `toolName`, वैकल्पिक `output`, और टाइप किए गए `error` फ़ील्ड के साथ SDK-सामना करने वाला एनवेलप है। अनुमोदन या नीति अस्वीकार Gateway टूल नीति पाइपलाइन को बायपास करने के बजाय पेलोड में `ok:false` लौटाते हैं।
- ऑपरेटर किसी एजेंट के लिए दृश्यमान Skills इन्वेंटरी लाने हेतु `skills.status` (`operator.read`) कॉल कर सकते हैं।
  - `agentId` वैकल्पिक है; डिफ़ॉल्ट एजेंट कार्यस्थान पढ़ने के लिए इसे छोड़ दें।
  - प्रतिक्रिया में कच्चे सीक्रेट मानों को उजागर किए बिना पात्रता, अनुपलब्ध आवश्यकताएं, कॉन्फ़िग जांच, और स्वच्छ किए गए इंस्टॉल विकल्प शामिल होते हैं।
- ऑपरेटर ClawHub खोज मेटाडेटा के लिए `skills.search` और `skills.detail` (`operator.read`) कॉल कर सकते हैं।
- ऑपरेटर किसी निजी स्किल आर्काइव को इंस्टॉल करने से पहले स्टेज करने के लिए `skills.upload.begin`, `skills.upload.chunk`, और `skills.upload.commit` (`operator.admin`) कॉल कर सकते हैं। यह विश्वसनीय क्लाइंट के लिए अलग एडमिन अपलोड पथ है, सामान्य ClawHub स्किल इंस्टॉल प्रवाह नहीं, और `skills.install.allowUploadedArchives` सक्षम न होने तक डिफ़ॉल्ट रूप से अक्षम रहता है।
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })` उस slug और force मान से बंधा अपलोड बनाता है।
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` सटीक डिकोडेड ऑफ़सेट पर बाइट्स जोड़ता है।
  - `skills.upload.commit({ uploadId, sha256? })` अंतिम आकार और SHA-256 सत्यापित करता है। कमिट केवल अपलोड को अंतिम रूप देता है; यह स्किल इंस्टॉल नहीं करता।
  - अपलोड किए गए स्किल आर्काइव zip आर्काइव होते हैं जिनमें `SKILL.md` रूट होता है। आर्काइव का आंतरिक डायरेक्टरी नाम कभी इंस्टॉल लक्ष्य नहीं चुनता।
- ऑपरेटर तीन मोड में `skills.install` (`operator.admin`) कॉल कर सकते हैं:
  - ClawHub मोड: `{ source: "clawhub", slug, version?, force? }` डिफ़ॉल्ट एजेंट कार्यस्थान की `skills/` डायरेक्टरी में स्किल फ़ोल्डर इंस्टॉल करता है।
  - अपलोड मोड: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }` कमिट किए गए अपलोड को डिफ़ॉल्ट एजेंट कार्यस्थान की `skills/<slug>` डायरेक्टरी में इंस्टॉल करता है। slug और force मान को मूल `skills.upload.begin` अनुरोध से मेल खाना चाहिए। यह मोड तब तक अस्वीकृत रहता है जब तक `skills.install.allowUploadedArchives` सक्षम न हो। यह सेटिंग ClawHub इंस्टॉल को प्रभावित नहीं करती।
  - Gateway इंस्टॉलर मोड: `{ name, installId, timeoutMs? }` Gateway होस्ट पर घोषित `metadata.openclaw.install` कार्रवाई चलाता है। पुराने क्लाइंट अब भी `dangerouslyForceUnsafeInstall` भेज सकते हैं; यह फ़ील्ड अप्रचलित है, केवल प्रोटोकॉल संगतता के लिए स्वीकार किया जाता है, और अनदेखा किया जाता है। ऑपरेटर-स्वामित्व वाले इंस्टॉल निर्णयों के लिए `security.installPolicy` का उपयोग करें।
- ऑपरेटर दो मोड में `skills.update` (`operator.admin`) कॉल कर सकते हैं:
  - ClawHub मोड डिफ़ॉल्ट एजेंट कार्यस्थान में एक ट्रैक किए गए slug या सभी ट्रैक किए गए ClawHub इंस्टॉल अपडेट करता है।
  - कॉन्फ़िग मोड `skills.entries.<skillKey>` मानों जैसे `enabled`, `apiKey`, और `env` को पैच करता है।

### `models.list` दृश्य

`models.list` एक वैकल्पिक `view` पैरामीटर स्वीकार करता है:

- छोड़ा गया या `"default"`: वर्तमान रनटाइम व्यवहार। यदि `agents.defaults.models` कॉन्फ़िगर किया गया है, तो प्रतिक्रिया अनुमत कैटलॉग होती है, जिसमें `provider/*` प्रविष्टियों के लिए गतिशील रूप से खोजे गए मॉडल शामिल होते हैं। अन्यथा प्रतिक्रिया पूरा Gateway कैटलॉग होती है।
- `"configured"`: पिकर-आकार का व्यवहार। यदि `agents.defaults.models` कॉन्फ़िगर किया गया है, तो यह फिर भी प्राथमिक रहता है, जिसमें `provider/*` प्रविष्टियों के लिए प्रदाता-स्कोप खोज शामिल है। allowlist के बिना, प्रतिक्रिया स्पष्ट `models.providers.*.models` प्रविष्टियों का उपयोग करती है, और केवल तब पूरे कैटलॉग पर लौटती है जब कोई कॉन्फ़िगर की गई मॉडल पंक्तियां मौजूद नहीं होतीं।
- `"all"`: पूरा Gateway कैटलॉग, `agents.defaults.models` को बायपास करते हुए। इसे निदान और खोज UI के लिए उपयोग करें, सामान्य मॉडल पिकर के लिए नहीं।

## Exec अनुमोदन

- जब किसी exec अनुरोध को अनुमोदन चाहिए, तो Gateway `exec.approval.requested` प्रसारित करता है।
- ऑपरेटर क्लाइंट `exec.approval.resolve` कॉल करके समाधान करते हैं (`operator.approvals` स्कोप आवश्यक)।
- `host=node` के लिए, `exec.approval.request` में `systemRunPlan` (कैननिकल `argv`/`cwd`/`rawCommand`/सत्र मेटाडेटा) शामिल होना चाहिए। `systemRunPlan` रहित अनुरोध अस्वीकृत किए जाते हैं।
- अनुमोदन के बाद, आगे भेजे गए `node.invoke system.run` कॉल उस कैननिकल `systemRunPlan` को प्रामाणिक कमांड/cwd/सत्र संदर्भ के रूप में पुनः उपयोग करते हैं।
- यदि कोई कॉलर prepare और अंतिम अनुमोदित `system.run` forward के बीच `command`, `rawCommand`, `cwd`, `agentId`, या `sessionKey` बदलता है, तो Gateway बदले हुए पेलोड पर भरोसा करने के बजाय रन अस्वीकृत करता है।

## एजेंट डिलीवरी fallback

- `agent` अनुरोध आउटबाउंड डिलीवरी मांगने के लिए `deliver=true` शामिल कर सकते हैं।
- `bestEffortDeliver=false` सख्त व्यवहार रखता है: अनसुलझे या केवल-आंतरिक डिलीवरी लक्ष्य `INVALID_REQUEST` लौटाते हैं।
- `bestEffortDeliver=true` तब सत्र-केवल निष्पादन पर fallback की अनुमति देता है जब कोई बाहरी डिलीवर योग्य रूट हल नहीं किया जा सकता (उदाहरण के लिए आंतरिक/webchat सत्र या अस्पष्ट बहु-चैनल कॉन्फ़िग)।
- अंतिम `agent` परिणामों में डिलीवरी मांगी जाने पर `result.deliveryStatus` शामिल हो सकता है, जो [`openclaw agent --json --deliver`](/hi/cli/agent#json-delivery-status) के लिए दस्तावेज़ित समान `sent`, `suppressed`, `partial_failed`, और `failed` स्थितियों का उपयोग करता है।

## संस्करणीकरण

- `PROTOCOL_VERSION` `packages/gateway-protocol/src/version.ts` में रहता है।
- क्लाइंट `minProtocol` + `maxProtocol` भेजते हैं; सर्वर उन रेंज को अस्वीकृत करता है जिनमें उसका वर्तमान प्रोटोकॉल शामिल नहीं होता। वर्तमान क्लाइंट और सर्वर को प्रोटोकॉल v4 चाहिए।
- स्कीमा + मॉडल TypeBox परिभाषाओं से जनरेट किए जाते हैं:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### क्लाइंट कॉन्स्टेंट

`src/gateway/client.ts` में संदर्भ क्लाइंट ये डिफ़ॉल्ट उपयोग करता है। मान प्रोटोकॉल v4 में स्थिर हैं और तृतीय-पक्ष क्लाइंट के लिए अपेक्षित आधाररेखा हैं।

| कॉन्स्टेंट | डिफ़ॉल्ट | स्रोत |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| अनुरोध टाइमआउट (प्रति RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| प्रीऑथ / connect-challenge टाइमआउट       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env युग्मित सर्वर/क्लाइंट बजट बढ़ा सकते हैं) |
| प्रारंभिक reconnect backoff                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| अधिकतम reconnect backoff                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| device-token close के बाद तेज़-retry clamp | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` से पहले force-stop grace     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` डिफ़ॉल्ट टाइमआउट           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| डिफ़ॉल्ट tick अंतराल (pre `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Tick-timeout close                        | silence `tickIntervalMs * 2` से अधिक होने पर code `4000` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

सर्वर `hello-ok` में प्रभावी `policy.tickIntervalMs`, `policy.maxPayload`, और `policy.maxBufferedBytes` प्रकाशित करता है; क्लाइंट को pre-handshake डिफ़ॉल्ट के बजाय उन मानों का सम्मान करना चाहिए।

## Auth

- Shared-secret Gateway auth कॉन्फ़िगर किए गए auth mode के आधार पर `connect.params.auth.token` या
  `connect.params.auth.password` का उपयोग करता है।
- Tailscale Serve जैसे identity-bearing modes
  (`gateway.auth.allowTailscale: true`) या non-loopback
  `gateway.auth.mode: "trusted-proxy"` connect auth check को
  `connect.params.auth.*` के बजाय request headers से पूरा करते हैं।
- Private-ingress `gateway.auth.mode: "none"` shared-secret connect auth को
  पूरी तरह छोड़ देता है; उस mode को public/untrusted ingress पर expose न करें।
- Pairing के बाद, Gateway connection
  role + scopes तक सीमित एक **device token** जारी करता है। यह
  `hello-ok.auth.deviceToken` में लौटाया जाता है और client को future connects के लिए
  persist करना चाहिए।
- Clients को किसी भी
  successful connect के बाद primary `hello-ok.auth.deviceToken` persist करना चाहिए।
- उस **stored** device token से reconnect करने पर उस token के लिए stored
  approved scope set भी reuse होना चाहिए। इससे पहले से granted read/probe/status access
  preserved रहता है और reconnects को चुपचाप narrower implicit admin-only scope में
  collapse होने से बचाया जाता है।
- Client-side connect auth assembly (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` orthogonal है और set होने पर हमेशा forward किया जाता है।
  - `auth.token` priority order में populate होता है: पहले explicit shared token,
    फिर explicit `deviceToken`, फिर stored per-device token (`deviceId` + `role` से keyed)।
  - `auth.bootstrapToken` केवल तब भेजा जाता है जब ऊपर में से किसी ने भी
    `auth.token` resolve न किया हो। Shared token या कोई भी resolved device token इसे suppress करता है।
  - One-shot `AUTH_TOKEN_MISMATCH` retry पर stored device token का auto-promotion
    केवल **trusted endpoints** तक gated है —
    loopback, या pinned `tlsFingerprint` के साथ `wss://`। Pinning के बिना public `wss://`
    qualify नहीं करता।
- Built-in setup-code bootstrap primary node
  `hello-ok.auth.deviceToken` और trusted mobile handoff के लिए
  `hello-ok.auth.deviceTokens` में bounded operator token लौटाता है। Operator token
  native Talk configuration reads के लिए `operator.talk.secrets` शामिल करता है, लेकिन
  pairing mutation scopes और `operator.admin` को exclude करता है।
- जब non-baseline setup-code bootstrap approval का इंतज़ार कर रहा हो, `PAIRING_REQUIRED`
  details में `recommendedNextStep: "wait_then_retry"`, `retryable: true`,
  और `pauseReconnect: false` शामिल होते हैं। Clients को request approve होने या token invalid होने तक उसी
  bootstrap token से reconnect करते रहना चाहिए।
- `hello-ok.auth.deviceTokens` को केवल तब persist करें जब connect ने bootstrap auth का उपयोग
  `wss://` या loopback/local pairing जैसे trusted transport पर किया हो।
- यदि कोई client **explicit** `deviceToken` या explicit `scopes` देता है, तो वह
  caller-requested scope set authoritative रहता है; cached scopes केवल तब
  reuse होते हैं जब client stored per-device token reuse कर रहा हो।
- Device tokens को `device.token.rotate` और
  `device.token.revoke` के ज़रिए rotate/revoke किया जा सकता है (`operator.pairing` scope आवश्यक)। Node या
  अन्य non-operator role को rotate या revoke करने के लिए `operator.admin` भी आवश्यक है।
- `device.token.rotate` rotation metadata लौटाता है। यह replacement
  bearer token केवल same-device calls के लिए echo करता है जो पहले से
  उस device token से authenticated हों, ताकि token-only clients reconnect करने से पहले
  अपना replacement persist कर सकें। Shared/admin rotations bearer token echo नहीं करते।
- Token issuance, rotation, और revocation उस device की pairing entry में recorded
  approved role set तक bounded रहते हैं; token mutation किसी device role को expand या
  target नहीं कर सकता जिसे pairing approval ने कभी grant नहीं किया।
- Paired-device token sessions के लिए, device management self-scoped होता है जब तक
  caller के पास `operator.admin` भी न हो: non-admin callers केवल अपने **own** device entry के
  operator token को manage कर सकते हैं। Node और अन्य non-operator
  token management admin-only है, caller के अपने device के लिए भी।
- `device.token.rotate` और `device.token.revoke` target operator
  token scope set को caller के current session scopes के विरुद्ध भी check करते हैं। Non-admin callers
  अपने पास पहले से मौजूद scope से broader operator token को rotate या revoke नहीं कर सकते।
- Auth failures में `error.details.code` और recovery hints शामिल होते हैं:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` के लिए client behavior:
  - Trusted clients cached per-device token के साथ एक bounded retry attempt कर सकते हैं।
  - यदि वह retry fail हो, तो clients को automatic reconnect loops रोकने चाहिए और operator action guidance surface करनी चाहिए।
- `AUTH_SCOPE_MISMATCH` का मतलब है कि device token recognized था लेकिन requested role/scopes
  cover नहीं करता। Clients को इसे bad token के रूप में present नहीं करना चाहिए;
  operator से re-pair करने या narrower/broader scope contract approve करने को prompt करें।

## Device identity + pairing

- Nodes को keypair fingerprint से derived stable device identity (`device.id`) शामिल करनी चाहिए।
- Gateways per device + role tokens issue करते हैं।
- नए device IDs के लिए pairing approvals आवश्यक हैं, जब तक local auto-approval
  enabled न हो।
- Pairing auto-approval direct local loopback connects पर centered है।
- OpenClaw में trusted shared-secret helper flows के लिए एक narrow backend/container-local self-connect path भी है।
- Same-host tailnet या LAN connects को pairing के लिए अभी भी remote माना जाता है और
  approval आवश्यक होता है।
- WS clients आम तौर पर `connect` के दौरान `device` identity शामिल करते हैं (operator +
  node)। केवल device-less operator exceptions explicit trust paths हैं:
  - localhost-only insecure HTTP compatibility के लिए `gateway.controlUi.allowInsecureAuth=true`।
  - successful `gateway.auth.mode: "trusted-proxy"` operator Control UI auth।
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, severe security downgrade)।
  - reserved internal
    helper path पर direct-loopback `gateway-client` backend RPCs।
- Device identity omit करने के scope consequences होते हैं। जब device-less operator
  connection explicit trust path के ज़रिए allowed हो, OpenClaw फिर भी
  self-declared scopes को empty set पर clear करता है, जब तक उस path में named
  scope-preservation exception न हो। Scope-gated methods फिर
  `missing scope` के साथ fail होते हैं।
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` Control UI
  break-glass scope-preservation path है। यह arbitrary
  custom backend या CLI-shaped WebSocket clients को scopes grant नहीं करता।
- Reserved direct-loopback `gateway-client` backend helper path
  scopes केवल internal local control-plane RPCs के लिए preserve करता है; custom backend IDs को
  यह exception नहीं मिलता।
- सभी connections को server-provided `connect.challenge` nonce sign करना होगा।

### Device auth migration diagnostics

Legacy clients के लिए जो अभी भी pre-challenge signing behavior का उपयोग करते हैं, `connect` अब
`error.details.code` के अंतर्गत `DEVICE_AUTH_*` detail codes और stable `error.details.reason` लौटाता है।

Common migration failures:

| Message                     | details.code                     | details.reason           | Meaning                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client ने `device.nonce` omit किया (या blank भेजा)। |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client ने stale/wrong nonce से sign किया।          |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Signature payload v2 payload से match नहीं करता।  |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Signed timestamp allowed skew के बाहर है।         |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` public key fingerprint से match नहीं करता। |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Public key format/canonicalization fail हुआ।      |

Migration target:

- हमेशा `connect.challenge` का इंतज़ार करें।
- Server nonce शामिल करने वाले v2 payload को sign करें।
- वही nonce `connect.params.device.nonce` में भेजें।
- Preferred signature payload `v3` है, जो device/client/role/scopes/token/nonce fields के अलावा
  `platform` और `deviceFamily` को bind करता है।
- Legacy `v2` signatures compatibility के लिए accepted रहते हैं, लेकिन paired-device
  metadata pinning reconnect पर command policy को अभी भी control करती है।

## TLS + pinning

- WS connections के लिए TLS supported है।
- Clients optionally gateway cert fingerprint pin कर सकते हैं (देखें `gateway.tls`
  config plus `gateway.remote.tlsFingerprint` या CLI `--tls-fingerprint`)।

## Scope

यह protocol **full Gateway API** expose करता है (status, channels, models, chat,
agent, sessions, nodes, approvals, etc.)। Exact surface
`packages/gateway-protocol/src/schema.ts` में TypeBox schemas द्वारा defined है।

## संबंधित

- [Bridge protocol](/hi/gateway/bridge-protocol)
- [Gateway runbook](/hi/gateway)
