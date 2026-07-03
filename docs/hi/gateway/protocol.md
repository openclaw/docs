---
read_when:
    - Gateway WS क्लाइंट लागू करना या अपडेट करना
    - Debugging प्रोटोकॉल असंगतियों या कनेक्ट विफलताओं
    - Protocol schema/models को फिर से जनरेट करना
summary: 'Gateway वेबसॉकेट प्रोटोकॉल: हैंडशेक, फ़्रेम, वर्ज़निंग'
title: Gateway प्रोटोकॉल
x-i18n:
    generated_at: "2026-07-03T13:29:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 815ac729824587579d112d665df2060d84d2894b4d46235e210804ca8a07082d
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS प्रोटोकॉल OpenClaw के लिए **एकल नियंत्रण प्लेन + नोड ट्रांसपोर्ट** है। सभी क्लाइंट (CLI, वेब UI, macOS ऐप, iOS/Android नोड, हेडलेस नोड) WebSocket पर कनेक्ट होते हैं और हैंडशेक के समय अपनी **भूमिका** + **स्कोप** घोषित करते हैं।

## ट्रांसपोर्ट

- WebSocket, JSON पेलोड वाले टेक्स्ट फ़्रेम।
- पहला फ़्रेम **ज़रूर** `connect` अनुरोध होना चाहिए।
- प्री-कनेक्ट फ़्रेम 64 KiB तक सीमित हैं। सफल हैंडशेक के बाद, क्लाइंट को `hello-ok.policy.maxPayload` और `hello-ok.policy.maxBufferedBytes` सीमाओं का पालन करना चाहिए। डायग्नोस्टिक्स सक्षम होने पर, बहुत बड़े इनबाउंड फ़्रेम और धीमे आउटबाउंड बफ़र Gateway द्वारा प्रभावित फ़्रेम बंद या ड्रॉप करने से पहले `payload.large` ईवेंट उत्सर्जित करते हैं। ये ईवेंट आकार, सीमाएं, सतहें, और सुरक्षित कारण कोड रखते हैं। ये संदेश बॉडी, अटैचमेंट सामग्री, कच्ची फ़्रेम बॉडी, टोकन, कुकी, या गुप्त मान नहीं रखते।

## हैंडशेक (कनेक्ट)

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

जब Gateway अभी भी स्टार्टअप साइडकार पूरा कर रहा होता है, तो `connect` अनुरोध `details.reason` को `"startup-sidecars"` और `retryAfterMs` पर सेट करके पुनः प्रयास योग्य `UNAVAILABLE` त्रुटि लौटा सकता है। क्लाइंट को इसे अंतिम हैंडशेक विफलता के रूप में दिखाने के बजाय अपने कुल कनेक्शन बजट के भीतर उस प्रतिक्रिया को पुनः प्रयास करना चाहिए।

`server`, `features`, `snapshot`, और `policy` सभी स्कीमा (`packages/gateway-protocol/src/schema/frames.ts`) द्वारा आवश्यक हैं। `auth` भी आवश्यक है और नेगोशिएट की गई भूमिका/स्कोप रिपोर्ट करता है। `pluginSurfaceUrls` वैकल्पिक है और `canvas` जैसी Plugin सतहों के नामों को स्कोप्ड होस्टेड URL से मैप करता है।

स्कोप्ड Plugin सतह URL समाप्त हो सकते हैं। नोड `pluginSurfaceUrls` में नया एंट्री पाने के लिए `{ "surface": "canvas" }` के साथ `node.pluginSurface.refresh` कॉल कर सकते हैं। प्रयोगात्मक Canvas Plugin रिफैक्टर अप्रचलित `canvasHostUrl`, `canvasCapability`, या `node.canvas.capability.refresh` संगतता पथ का समर्थन नहीं करता; मौजूदा नेटिव क्लाइंट और gateways को Plugin सतहों का उपयोग करना होगा।

जब कोई डिवाइस टोकन जारी नहीं किया जाता, तो `hello-ok.auth` टोकन फ़ील्ड के बिना नेगोशिएट की गई अनुमतियां रिपोर्ट करता है:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

विश्वसनीय समान-प्रक्रिया बैकएंड क्लाइंट (`client.id: "gateway-client"`, `client.mode: "backend"`) साझा Gateway टोकन/पासवर्ड से प्रमाणीकरण करते समय सीधे loopback कनेक्शन पर `device` छोड़ सकते हैं। यह पथ आंतरिक नियंत्रण-प्लेन RPCs के लिए आरक्षित है और पुराने CLI/डिवाइस पेयरिंग बेसलाइन को सबएजेंट सेशन अपडेट जैसे स्थानीय बैकएंड काम को रोकने से बचाता है। रिमोट क्लाइंट, ब्राउज़र-ओरिजिन क्लाइंट, नोड क्लाइंट, और स्पष्ट डिवाइस-टोकन/डिवाइस-आइडेंटिटी क्लाइंट अभी भी सामान्य पेयरिंग और स्कोप-अपग्रेड जांचों का उपयोग करते हैं।

जब डिवाइस टोकन जारी किया जाता है, तो `hello-ok` में यह भी शामिल होता है:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

बिल्ट-इन QR/setup-code बूटस्ट्रैप एक नया मोबाइल हैंडऑफ़ पथ है। सफल बेसलाइन setup-code कनेक्ट एक प्राथमिक नोड टोकन और एक सीमित ऑपरेटर टोकन लौटाता है:

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

ऑपरेटर हैंडऑफ़ जानबूझकर सीमित है ताकि QR ऑनबोर्डिंग मोबाइल ऑपरेटर लूप शुरू कर सके और पेयरिंग म्यूटेशन स्कोप या `operator.admin` दिए बिना नेटिव सेटअप पूरा कर सके। इसमें `operator.talk.secrets` शामिल है ताकि नेटिव क्लाइंट बूटस्ट्रैप के बाद अपनी आवश्यक Talk कॉन्फ़िगरेशन पढ़ सके। व्यापक पेयरिंग और एडमिन एक्सेस के लिए अलग से अनुमोदित ऑपरेटर पेयरिंग या टोकन फ़्लो चाहिए। क्लाइंट को `hello-ok.auth.deviceTokens` केवल तब स्थायी रखना चाहिए जब कनेक्ट ने `wss://` या loopback/local पेयरिंग जैसे विश्वसनीय ट्रांसपोर्ट पर बूटस्ट्रैप ऑथ का उपयोग किया हो।

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

## फ़्रेमिंग

- **अनुरोध**: `{type:"req", id, method, params}`
- **प्रतिक्रिया**: `{type:"res", id, ok, payload|error}`
- **ईवेंट**: `{type:"event", event, payload, seq?, stateVersion?}`

साइड-इफ़ेक्ट करने वाली विधियों को **idempotency keys** चाहिए (स्कीमा देखें)।

## भूमिकाएं + स्कोप

पूर्ण ऑपरेटर स्कोप मॉडल, अनुमोदन-समय जांचों, और साझा-सीक्रेट सेमांटिक्स के लिए, [ऑपरेटर स्कोप](/hi/gateway/operator-scopes) देखें।

### भूमिकाएं

- `operator` = नियंत्रण प्लेन क्लाइंट (CLI/UI/ऑटोमेशन)।
- `node` = क्षमता होस्ट (camera/screen/canvas/system.run)।

### स्कोप (ऑपरेटर)

सामान्य स्कोप:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` के साथ `talk.config` को `operator.talk.secrets` (या `operator.admin`) चाहिए।
जब सीक्रेट शामिल हों, तो क्लाइंट को सक्रिय Talk प्रदाता क्रेडेंशियल `talk.resolved.config.apiKey` से पढ़ना चाहिए; `talk.providers.<id>.apiKey` स्रोत-आकार में रहता है और SecretRef ऑब्जेक्ट या रिडैक्टेड स्ट्रिंग हो सकता है।

Plugin-पंजीकृत Gateway RPC विधियां अपना ऑपरेटर स्कोप मांग सकती हैं, लेकिन आरक्षित कोर एडमिन प्रीफ़िक्स (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) हमेशा `operator.admin` में रिज़ॉल्व होते हैं।

विधि स्कोप केवल पहला गेट है। `chat.send` के माध्यम से पहुंची कुछ स्लैश कमांड इसके ऊपर अधिक सख्त कमांड-स्तरीय जांचें लागू करती हैं। उदाहरण के लिए, स्थायी `/config set` और `/config unset` लिखने के लिए `operator.admin` चाहिए।

`node.pair.approve` में बेस विधि स्कोप के ऊपर अतिरिक्त अनुमोदन-समय स्कोप जांच भी होती है:

- कमांड रहित अनुरोध: `operator.pairing`
- गैर-exec नोड कमांड वाले अनुरोध: `operator.pairing` + `operator.write`
- वे अनुरोध जिनमें `system.run`, `system.run.prepare`, या `system.which` शामिल हैं:
  `operator.pairing` + `operator.admin`

### क्षमताएं/कमांड/अनुमतियां (नोड)

नोड कनेक्ट समय पर क्षमता दावे घोषित करते हैं:

- `caps`: उच्च-स्तरीय क्षमता श्रेणियां जैसे `camera`, `canvas`, `screen`, `location`, `voice`, और `talk`।
- `commands`: invoke के लिए कमांड allowlist।
- `permissions`: सूक्ष्म टॉगल (जैसे `screen.record`, `camera.capture`)।

Gateway इन्हें **दावे** मानता है और सर्वर-साइड allowlist लागू करता है।

## उपस्थिति

- `system-presence` डिवाइस पहचान द्वारा keyed एंट्री लौटाता है।
- उपस्थिति एंट्री में `deviceId`, `roles`, और `scopes` शामिल होते हैं ताकि UIs प्रति डिवाइस एक ही पंक्ति दिखा सकें, भले ही वह **operator** और **node** दोनों के रूप में कनेक्ट हो।
- `node.list` में वैकल्पिक `lastSeenAtMs` और `lastSeenReason` फ़ील्ड शामिल हैं। कनेक्टेड नोड अपना वर्तमान कनेक्शन समय `lastSeenAtMs` के रूप में और कारण `connect` के साथ रिपोर्ट करते हैं; पेयर्ड नोड विश्वसनीय नोड ईवेंट द्वारा उनकी पेयरिंग मेटाडेटा अपडेट करने पर टिकाऊ पृष्ठभूमि उपस्थिति भी रिपोर्ट कर सकते हैं।

### Node पृष्ठभूमि जीवित ईवेंट

नोड `event: "node.presence.alive"` के साथ `node.event` कॉल कर सकते हैं ताकि यह रिकॉर्ड हो सके कि पेयर्ड नोड पृष्ठभूमि वेक के दौरान जीवित था, बिना उसे कनेक्टेड चिह्नित किए।

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` एक बंद enum है: `background`, `silent_push`, `bg_app_refresh`, `significant_location`, `manual`, या `connect`। अज्ञात trigger स्ट्रिंग्स को स्थायीकरण से पहले Gateway द्वारा `background` में सामान्यीकृत किया जाता है। ईवेंट केवल प्रमाणित नोड डिवाइस सेशनों के लिए टिकाऊ है; डिवाइस-रहित या अनपेयर सेशन `handled: false` लौटाते हैं।

सफल gateways संरचित परिणाम लौटाते हैं:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

पुराने gateways `node.event` के लिए अभी भी `{ "ok": true }` लौटा सकते हैं; क्लाइंट को इसे एक स्वीकृत RPC मानना चाहिए, टिकाऊ उपस्थिति स्थायीकरण नहीं।

## ब्रॉडकास्ट ईवेंट स्कोपिंग

सर्वर-पुश WebSocket ब्रॉडकास्ट ईवेंट स्कोप-गेटेड होते हैं ताकि पेयरिंग-स्कोप्ड या केवल-नोड सेशन निष्क्रिय रूप से सेशन सामग्री प्राप्त न करें।

- **चैट, एजेंट, और टूल-रिज़ल्ट फ़्रेम** (स्ट्रीम किए गए `agent` ईवेंट और टूल कॉल परिणाम सहित) के लिए कम से कम `operator.read` चाहिए। `operator.read` के बिना सेशन इन फ़्रेमों को पूरी तरह छोड़ देते हैं।
- **Plugin-परिभाषित `plugin.*` ब्रॉडकास्ट** को `operator.write` या `operator.admin` पर गेट किया जाता है, इस पर निर्भर करते हुए कि Plugin ने उन्हें कैसे पंजीकृत किया है।
- **स्थिति और ट्रांसपोर्ट ईवेंट** (`heartbeat`, `presence`, `tick`, कनेक्ट/डिस्कनेक्ट जीवनचक्र, आदि) अप्रतिबंधित रहते हैं ताकि हर प्रमाणित सेशन के लिए ट्रांसपोर्ट स्वास्थ्य दिखाई देता रहे।
- **अज्ञात ब्रॉडकास्ट ईवेंट परिवार** डिफ़ॉल्ट रूप से स्कोप-गेटेड होते हैं (fail-closed), जब तक कोई पंजीकृत हैंडलर उन्हें स्पष्ट रूप से ढीला न करे।

प्रत्येक क्लाइंट कनेक्शन अपना प्रति-क्लाइंट सीक्वेंस नंबर रखता है ताकि ब्रॉडकास्ट उस सॉकेट पर मोनोटोनिक क्रम बनाए रखें, भले ही अलग-अलग क्लाइंट ईवेंट स्ट्रीम के अलग-अलग स्कोप-फ़िल्टर्ड उपसमुच्चय देखें।

## सामान्य RPC विधि परिवार

सार्वजनिक WS सतह ऊपर दिए गए हैंडशेक/ऑथ उदाहरणों से अधिक व्यापक है। यह जनरेट किया गया डंप नहीं है — `hello-ok.features.methods` `src/gateway/server-methods-list.ts` और लोड किए गए Plugin/चैनल विधि एक्सपोर्ट से बनी एक रूढ़िवादी खोज सूची है। इसे फीचर खोज मानें, `src/gateway/server-methods/*.ts` की पूर्ण गणना नहीं।

  <AccordionGroup>
  <Accordion title="सिस्टम और पहचान">
    - `health` कैश किया हुआ या अभी-अभी जांचा गया gateway स्वास्थ्य स्नैपशॉट लौटाता है।
    - `diagnostics.stability` हालिया सीमित डायग्नोस्टिक स्थिरता रिकॉर्डर लौटाता है। यह इवेंट नाम, गिनती, बाइट आकार, मेमोरी रीडिंग, queue/session स्थिति, channel/plugin नाम, और session ids जैसे संचालनात्मक metadata रखता है। यह chat text, webhook bodies, tool outputs, raw request या response bodies, tokens, cookies, या secret values नहीं रखता। ऑपरेटर read scope आवश्यक है।
    - `status` `/status`-शैली का gateway सारांश लौटाता है; संवेदनशील फ़ील्ड केवल admin-scoped ऑपरेटर clients के लिए शामिल होते हैं।
    - `gateway.identity.get` relay और pairing flows द्वारा उपयोग की जाने वाली gateway device identity लौटाता है।
    - `system-presence` जुड़े हुए ऑपरेटर/Node devices के लिए वर्तमान presence snapshot लौटाता है।
    - `system-event` एक system event जोड़ता है और presence context को update/broadcast कर सकता है।
    - `last-heartbeat` सबसे नया persisted Heartbeat event लौटाता है।
    - `set-heartbeats` Gateway पर Heartbeat processing को toggle करता है।

  </Accordion>

  <Accordion title="मॉडल और उपयोग">
    - `models.list` runtime-allowed model catalog लौटाता है। picker-sized configured models (`agents.defaults.models` पहले, फिर `models.providers.*.models`) के लिए `{ "view": "configured" }` पास करें, या पूरे catalog के लिए `{ "view": "all" }` पास करें।
    - `usage.status` provider usage windows/remaining quota summaries लौटाता है।
    - `usage.cost` किसी date range के लिए aggregated cost usage summaries लौटाता है।
      एक agent के लिए `agentId` पास करें, या configured agents को aggregate करने के लिए `agentScope: "all"` पास करें।
    - `doctor.memory.status` active default agent workspace के लिए vector-memory / cached embedding readiness लौटाता है। `{ "probe": true }` या `{ "deep": true }` केवल तब पास करें जब caller स्पष्ट रूप से live embedding provider ping चाहता हो। Dreaming-aware clients selected agent workspace तक Dreaming store stats को scope करने के लिए `{ "agentId": "agent-id" }` भी पास कर सकते हैं; `agentId` छोड़ने पर default-agent fallback बना रहता है और configured Dreaming workspaces aggregate होते हैं।
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts`, और `doctor.memory.dedupeDreamDiary` selected-agent Dreaming views/actions के लिए वैकल्पिक `{ "agentId": "agent-id" }` params स्वीकार करते हैं। जब `agentId` छोड़ा जाता है, वे configured default agent workspace पर काम करते हैं।
    - `doctor.memory.remHarness` remote control-plane clients के लिए सीमित, read-only REM harness preview लौटाता है। इसमें workspace paths, memory snippets, rendered grounded markdown, और deep promotion candidates शामिल हो सकते हैं, इसलिए callers को `operator.read` चाहिए।
    - `sessions.usage` per-session usage summaries लौटाता है। एक
      agent के लिए `agentId` पास करें, या configured agents को साथ में सूचीबद्ध करने के लिए `agentScope: "all"` पास करें।
    - `sessions.usage.timeseries` एक session के लिए timeseries usage लौटाता है।
    - `sessions.usage.logs` एक session के लिए usage log entries लौटाता है।

  </Accordion>

  <Accordion title="चैनल और लॉगिन सहायक">
    - `channels.status` built-in + bundled channel/plugin status summaries लौटाता है।
    - `channels.logout` किसी विशिष्ट channel/account से logout करता है जहां channel logout का समर्थन करता है।
    - `web.login.start` वर्तमान QR-capable web channel provider के लिए QR/web login flow शुरू करता है।
    - `web.login.wait` उस QR/web login flow के पूरा होने की प्रतीक्षा करता है और सफलता पर channel शुरू करता है।
    - `push.test` registered iOS Node को test APNs push भेजता है।
    - `voicewake.get` stored wake-word triggers लौटाता है।
    - `voicewake.set` wake-word triggers को update करता है और change broadcast करता है।

  </Accordion>

  <Accordion title="मैसेजिंग और लॉग">
    - `send` chat runner के बाहर channel/account/thread-targeted sends के लिए direct outbound-delivery RPC है।
    - `logs.tail` cursor/limit और max-byte controls के साथ configured Gateway file-log tail लौटाता है।

  </Accordion>

  <Accordion title="Talk और TTS">
    - `talk.catalog` speech, streaming transcription, और realtime voice के लिए read-only Talk provider catalog लौटाता है। इसमें canonical provider ids, registry aliases, labels, configured state, वैकल्पिक group-level `ready` result, exposed model/voice ids, canonical modes, transports, brain strategies, और realtime audio/capability flags शामिल होते हैं, provider secrets लौटाए बिना या global config बदले बिना। वर्तमान Gateways runtime provider selection लागू करने के बाद `ready` set करते हैं; clients को पुराने Gateways के साथ compatibility के लिए इसकी अनुपस्थिति को unverified मानना चाहिए।
    - `talk.config` effective Talk config payload लौटाता है; `includeSecrets` के लिए `operator.talk.secrets` (या `operator.admin`) आवश्यक है।
    - `talk.session.create` `realtime/gateway-relay`, `transcription/gateway-relay`, या `stt-tts/managed-room` के लिए Gateway-owned Talk session बनाता है। `stt-tts/managed-room` के लिए, `operator.write` callers जो `sessionKey` पास करते हैं उन्हें scoped session-key visibility के लिए `spawnedBy` भी पास करना होगा; unscoped `sessionKey` creation और `brain: "direct-tools"` के लिए `operator.admin` आवश्यक है।
    - `talk.session.join` managed-room session token को validate करता है, आवश्यकता अनुसार `session.ready` या `session.replaced` events emit करता है, और plaintext token या stored token hash के बिना room/session metadata plus recent Talk events लौटाता है।
    - `talk.session.appendAudio` Gateway-owned realtime relay और transcription sessions में base64 PCM input audio जोड़ता है।
    - `talk.session.startTurn`, `talk.session.endTurn`, और `talk.session.cancelTurn` state साफ होने से पहले stale-turn rejection के साथ managed-room turn lifecycle चलाते हैं।
    - `talk.session.cancelOutput` assistant audio output रोकता है, मुख्य रूप से Gateway relay sessions में VAD-gated barge-in के लिए।
    - `talk.session.submitToolResult` Gateway-owned realtime relay session द्वारा emitted provider tool call को पूरा करता है। अंतरिम tool output के लिए `options: { willContinue: true }` पास करें जब final result बाद में आएगा, या `options: { suppressResponse: true }` जब tool result को provider call संतुष्ट करना चाहिए बिना दूसरा realtime assistant response शुरू किए।
    - `talk.session.steer` Gateway-owned agent-backed Talk session में active-run voice control भेजता है। यह `{ sessionId, text, mode? }` स्वीकार करता है, जहां `mode` `status`, `steer`, `cancel`, या `followup` है; छोड़ा गया mode spoken text से classify किया जाता है।
    - `talk.session.close` Gateway-owned relay, transcription, या managed-room session बंद करता है और terminal Talk events emit करता है।
    - `talk.mode` WebChat/Control UI clients के लिए वर्तमान Talk mode state set/broadcast करता है।
    - `talk.client.create` `webrtc` या `provider-websocket` का उपयोग करके client-owned realtime provider session बनाता है, जबकि Gateway config, credentials, instructions, और tool policy own करता है।
    - `talk.client.toolCall` client-owned realtime transports को provider tool calls Gateway policy तक forward करने देता है। पहला supported tool `openclaw_agent_consult` है; clients run id प्राप्त करते हैं और provider-specific tool result submit करने से पहले सामान्य chat lifecycle events की प्रतीक्षा करते हैं।
    - `talk.client.steer` client-owned realtime transports के लिए active-run voice control भेजता है। Gateway `sessionKey` से active embedded run resolve करता है और steering को चुपचाप drop करने के बजाय structured accepted/rejected result लौटाता है।
    - `talk.event` realtime, transcription, STT/TTS, managed-room, telephony, और meeting adapters के लिए single Talk event channel है।
    - `talk.speak` active Talk speech provider के माध्यम से speech synthesize करता है।
    - `tts.status` TTS enabled state, active provider, fallback providers, और provider config state लौटाता है।
    - `tts.providers` visible TTS provider inventory लौटाता है।
    - `tts.enable` और `tts.disable` TTS prefs state toggle करते हैं।
    - `tts.setProvider` preferred TTS provider update करता है।
    - `tts.convert` one-shot text-to-speech conversion चलाता है।

  </Accordion>

  <Accordion title="सीक्रेट्स, कॉन्फ़िग, अपडेट, और विज़ार्ड">
    - `secrets.reload` active SecretRefs को फिर से resolve करता है और runtime secret state केवल full success पर swap करता है।
    - `secrets.resolve` किसी specific command/target set के लिए command-target secret assignments resolve करता है।
    - `config.get` वर्तमान config snapshot और hash लौटाता है।
    - `config.set` validated config payload लिखता है।
    - `config.patch` partial config update merge करता है। Destructive array
      replacement के लिए affected path `replacePaths` में आवश्यक है; array entries
      के तहत nested arrays `agents.list[].skills` जैसे `[]` paths का उपयोग करते हैं।
    - `config.apply` full config payload को validate + replace करता है।
    - `config.schema` Control UI और CLI tooling द्वारा उपयोग किया गया live config schema payload लौटाता है: schema, `uiHints`, version, और generation metadata, जिसमें runtime द्वारा load किए जा सकने पर plugin + channel schema metadata शामिल है। schema में उसी labels और help text से derived field `title` / `description` metadata शामिल है जिसका UI उपयोग करता है, जिसमें matching field documentation मौजूद होने पर nested object, wildcard, array-item, और `anyOf` / `oneOf` / `allOf` composition branches शामिल हैं।
    - `config.schema.lookup` एक config path के लिए path-scoped lookup payload लौटाता है: normalized path, shallow schema node, matched hint + `hintPath`, optional `reloadKind`, और UI/CLI drill-down के लिए immediate child summaries। `reloadKind` `restart`, `hot`, या `none` में से एक है और requested path के लिए Gateway config reload planner को mirror करता है। Lookup schema nodes user-facing docs और common validation fields (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numeric/string/array/object bounds, और `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` जैसे flags) रखते हैं। Child summaries `key`, normalized `path`, `type`, `required`, `hasChildren`, optional `reloadKind`, plus matched `hint` / `hintPath` expose करते हैं।
    - `update.run` Gateway update flow चलाता है और restart केवल तब schedule करता है जब update स्वयं सफल हो; session वाले callers `continuationMessage` शामिल कर सकते हैं ताकि startup restart continuation queue के माध्यम से one follow-up agent turn resume करे। control plane से package-manager updates और supervised git-checkout updates live Gateway के भीतर package tree replace करने या checkout/build output mutate करने के बजाय detached managed-service handoff का उपयोग करते हैं। शुरू किया गया handoff `result.reason: "managed-service-handoff-started"` और `handoff.status: "started"` के साथ `ok: true` लौटाता है; unavailable या failed handoffs `managed-service-handoff-unavailable` या `managed-service-handoff-failed` के साथ `ok: false` लौटाते हैं, साथ में `handoff.command` जब manual shell update आवश्यक हो। unavailable handoff का अर्थ है कि OpenClaw में safe supervisor boundary या durable service identity नहीं है, जैसे systemd के लिए `OPENCLAW_SYSTEMD_UNIT`। शुरू किए गए handoff के दौरान, restart sentinel थोड़े समय के लिए `stats.reason: "restart-health-pending"` report कर सकता है; continuation तब तक delay होता है जब तक CLI restarted Gateway verify नहीं करता और final `ok` sentinel नहीं लिखता।
    - `update.status` latest update restart sentinel refresh करके लौटाता है, उपलब्ध होने पर post-restart running version सहित।
    - `wizard.start`, `wizard.next`, `wizard.status`, और `wizard.cancel` onboarding wizard को WS RPC पर expose करते हैं।

  </Accordion>

  <Accordion title="एजेंट और कार्यक्षेत्र सहायक">
    - `agents.list` कॉन्फ़िगर की गई एजेंट प्रविष्टियाँ लौटाता है, जिनमें प्रभावी मॉडल और runtime metadata शामिल हैं।
    - `agents.create`, `agents.update`, और `agents.delete` एजेंट रिकॉर्ड और कार्यक्षेत्र wiring प्रबंधित करते हैं।
    - `agents.files.list`, `agents.files.get`, और `agents.files.set` किसी एजेंट के लिए उजागर bootstrap कार्यक्षेत्र फ़ाइलों को प्रबंधित करते हैं।
    - `tasks.list`, `tasks.get`, और `tasks.cancel` SDK और ऑपरेटर clients के लिए Gateway task ledger उजागर करते हैं।
    - `artifacts.list`, `artifacts.get`, और `artifacts.download` किसी स्पष्ट `sessionKey`, `runId`, या `taskId` scope के लिए transcript-derived artifact summaries और downloads उजागर करते हैं। Run और task queries owning session को server-side resolve करती हैं और केवल matching provenance वाला transcript media लौटाती हैं; unsafe या local URL sources server-side fetch करने के बजाय unsupported downloads लौटाते हैं।
    - `environments.list` और `environments.status` SDK clients के लिए read-only Gateway-local और Node environment discovery उजागर करते हैं।
    - `agent.identity.get` किसी एजेंट या session के लिए प्रभावी assistant identity लौटाता है।
    - `agent.wait` किसी run के समाप्त होने की प्रतीक्षा करता है और उपलब्ध होने पर terminal snapshot लौटाता है।

  </Accordion>

  <Accordion title="Session नियंत्रण">
    - `sessions.list` वर्तमान session index लौटाता है, जिसमें agent runtime backend कॉन्फ़िगर होने पर per-row `agentRuntime` metadata शामिल होता है।
    - `sessions.subscribe` और `sessions.unsubscribe` वर्तमान WS client के लिए session change event subscriptions toggle करते हैं।
    - `sessions.messages.subscribe` और `sessions.messages.unsubscribe` एक session के लिए transcript/message event subscriptions toggle करते हैं।
    - `sessions.preview` विशिष्ट session keys के लिए bounded transcript previews लौटाता है।
    - `sessions.describe` exact session key के लिए एक Gateway session row लौटाता है।
    - `sessions.resolve` किसी session target को resolve या canonicalize करता है।
    - `sessions.create` नई session entry बनाता है।
    - `sessions.send` मौजूदा session में message भेजता है।
    - `sessions.steer` active session के लिए interrupt-and-steer variant है।
    - `sessions.abort` किसी session के लिए active work abort करता है। Caller `key` और optional `runId` pass कर सकता है, या active runs के लिए केवल `runId` pass कर सकता है जिन्हें Gateway किसी session में resolve कर सकता है।
    - `sessions.patch` session metadata/overrides update करता है और resolved canonical model तथा effective `agentRuntime` report करता है।
    - `sessions.reset`, `sessions.delete`, और `sessions.compact` session maintenance करते हैं।
    - `sessions.get` पूरी stored session row लौटाता है।
    - Chat execution अभी भी `chat.history`, `chat.send`, `chat.abort`, और `chat.inject` का उपयोग करता है। `chat.history` UI clients के लिए display-normalized है: inline directive tags visible text से हटाए जाते हैं, plain-text tool-call XML payloads (जिनमें `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, और truncated tool-call blocks शामिल हैं) तथा leaked ASCII/full-width model control tokens हटाए जाते हैं, exact `NO_REPLY` / `no_reply` जैसी pure silent-token assistant rows छोड़ी जाती हैं, और oversized rows को placeholders से बदला जा सकता है।
    - `chat.message.get` एक single visible transcript entry के लिए additive bounded full-message reader है। Clients `sessionKey`, session selection agent-scoped होने पर optional `agentId`, और पहले `chat.history` के माध्यम से surfaced transcript `messageId` pass करते हैं, और Gateway वही display-normalized projection lightweight history truncation cap के बिना लौटाता है जब stored entry अभी भी उपलब्ध हो और oversized न हो।
    - `chat.send` auto cutoff से पहले शुरू की गई model calls के लिए fast mode उपयोग करने के लिए one-turn `fastMode: "auto"` स्वीकार करता है, फिर बाद की retry, fallback, tool-result, या continuation calls fast mode के बिना शुरू करता है। Cutoff default 60 seconds है और प्रति model `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` से configured किया जा सकता है। `chat.send` caller उस request के लिए cutoff override करने हेतु one-turn `fastAutoOnSeconds` pass कर सकता है।

  </Accordion>

  <Accordion title="Device pairing और device tokens">
    - `device.pair.list` pending और approved paired devices लौटाता है।
    - `device.pair.approve`, `device.pair.reject`, और `device.pair.remove` device-pairing records प्रबंधित करते हैं।
    - `device.token.rotate` किसी paired device token को उसके approved role और caller scope bounds के भीतर rotate करता है।
    - `device.token.revoke` किसी paired device token को उसके approved role और caller scope bounds के भीतर revoke करता है।

  </Accordion>

  <Accordion title="Node pairing, invoke, और pending work">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, और `node.pair.verify` Node pairing और bootstrap verification cover करते हैं।
    - `node.list` और `node.describe` known/connected Node state लौटाते हैं।
    - `node.rename` paired Node label update करता है।
    - `node.invoke` किसी connected Node को command forward करता है।
    - `node.invoke.result` invoke request के लिए result लौटाता है।
    - `node.event` Node-originated events को gateway में वापस ले जाता है।
    - `node.pending.pull` और `node.pending.ack` connected-node queue APIs हैं।
    - `node.pending.enqueue` और `node.pending.drain` offline/disconnected nodes के लिए durable pending work प्रबंधित करते हैं।

  </Accordion>

  <Accordion title="Approval families">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, और `exec.approval.resolve` one-shot exec approval requests तथा pending approval lookup/replay cover करते हैं।
    - `exec.approval.waitDecision` एक pending exec approval पर प्रतीक्षा करता है और final decision लौटाता है (या timeout पर `null`)।
    - `exec.approvals.get` और `exec.approvals.set` gateway exec approval policy snapshots प्रबंधित करते हैं।
    - `exec.approvals.node.get` और `exec.approvals.node.set` Node relay commands के माध्यम से node-local exec approval policy प्रबंधित करते हैं।
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, और `plugin.approval.resolve` Plugin-defined approval flows cover करते हैं।

  </Accordion>

  <Accordion title="Automation, Skills, और tools">
    - Automation: `wake` immediate या next-Heartbeat wake text injection schedule करता है; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` scheduled work प्रबंधित करते हैं।
    - `cron.run` manual runs के लिए enqueue-style RPC बना रहता है। जिन clients को completion semantics चाहिए, उन्हें लौटाया गया `runId` पढ़ना चाहिए और `cron.runs` poll करना चाहिए।
    - `cron.runs` optional non-empty `runId` filter स्वीकार करता है ताकि clients same job की अन्य history entries से race किए बिना एक queued manual run follow कर सकें।
    - Skills और tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Common event families

- `chat`: UI chat updates जैसे `chat.inject` और अन्य transcript-only chat
  events। Protocol v4 में, delta payloads `deltaText` carry करते हैं; `message`
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
- `node.pair.requested` / `node.pair.resolved`: Node pairing lifecycle।
- `node.invoke.request`: Node invoke request broadcast।
- `device.pair.requested` / `device.pair.resolved`: paired-device lifecycle।
- `voicewake.changed`: wake-word trigger config बदला।
- `exec.approval.requested` / `exec.approval.resolved`: exec approval
  lifecycle।
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin approval
  lifecycle।

### Node helper methods

- Nodes auto-allow checks के लिए skill executables की वर्तमान list fetch करने हेतु
  `skills.bins` call कर सकते हैं।

### Task ledger RPCs

Operator clients task ledger RPCs के माध्यम से Gateway background task records को
inspect और cancel कर सकते हैं। ये methods raw runtime state नहीं, बल्कि sanitized
task summaries लौटाते हैं।

- `tasks.list` को `operator.read` चाहिए।
  - Params: optional `status` (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"`, या `"timed_out"`) या उन statuses की array,
    optional `agentId`, optional `sessionKey`, optional `limit` `1` से
    `500` तक, और optional string `cursor`।
  - Result: `{ "tasks": TaskSummary[], "nextCursor"?: string }`।
- `tasks.get` को `operator.read` चाहिए।
  - Params: `{ "taskId": string }`।
  - Result: `{ "task": TaskSummary }`।
  - Missing task ids Gateway not-found error shape लौटाते हैं।
- `tasks.cancel` को `operator.write` चाहिए।
  - Params: `{ "taskId": string, "reason"?: string }`।
  - Result:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`।
  - `found` report करता है कि ledger में matching task था या नहीं। `cancelled`
    report करता है कि runtime ने cancellation accept या record किया या नहीं।

`TaskSummary` में `id`, `status`, और optional metadata जैसे `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, timestamps, progress,
terminal summary, और sanitized error text शामिल हैं। `agentId` task execute करने
वाले agent की पहचान करता है; `sessionKey` और `ownerKey` requester और control
context preserve करते हैं।

### Operator helper methods

- ऑपरेटर किसी एजेंट के लिए रनटाइम कमांड इन्वेंटरी लाने हेतु `commands.list` (`operator.read`) कॉल कर सकते हैं।
  - `agentId` वैकल्पिक है; डिफ़ॉल्ट एजेंट वर्कस्पेस पढ़ने के लिए इसे छोड़ दें।
  - `scope` नियंत्रित करता है कि प्राथमिक `name` किस सतह को लक्षित करता है:
    - `text` अग्रणी `/` के बिना प्राथमिक टेक्स्ट कमांड टोकन लौटाता है
    - `native` और डिफ़ॉल्ट `both` पाथ उपलब्ध होने पर प्रोवाइडर-सचेत नेटिव नाम लौटाते हैं
  - `textAliases` `/model` और `/m` जैसे सटीक स्लैश उपनाम रखता है।
  - `nativeName` मौजूद होने पर प्रोवाइडर-सचेत नेटिव कमांड नाम रखता है।
  - `provider` वैकल्पिक है और केवल नेटिव नामकरण तथा नेटिव plugin कमांड उपलब्धता को प्रभावित करता है।
  - `includeArgs=false` प्रतिक्रिया से सीरियलाइज़ किया गया आर्ग्युमेंट मेटाडेटा हटा देता है।
- ऑपरेटर किसी एजेंट के लिए रनटाइम टूल कैटलॉग लाने हेतु `tools.catalog` (`operator.read`) कॉल कर सकते हैं। प्रतिक्रिया में समूहित टूल और प्रोवेनेंस मेटाडेटा शामिल होते हैं:
  - `source`: `core` या `plugin`
  - `pluginId`: `source="plugin"` होने पर plugin मालिक
  - `optional`: क्या कोई plugin टूल वैकल्पिक है
- ऑपरेटर किसी सत्र के लिए रनटाइम-प्रभावी टूल इन्वेंटरी लाने हेतु `tools.effective` (`operator.read`) कॉल कर सकते हैं।
  - `sessionKey` आवश्यक है।
  - Gateway कॉलर-प्रदत्त auth या delivery संदर्भ स्वीकार करने के बजाय सत्र से सर्वर-साइड भरोसेमंद रनटाइम संदर्भ निकालता है।
  - प्रतिक्रिया सक्रिय इन्वेंटरी का सत्र-स्कोप वाला सर्वर-व्युत्पन्न प्रोजेक्शन है, जिसमें core, plugin, channel, और पहले से खोजे गए MCP सर्वर टूल शामिल हैं।
  - `tools.effective` MCP के लिए केवल-पढ़ने योग्य है: यह गरम सत्र MCP कैटलॉग को अंतिम टूल नीति के माध्यम से प्रोजेक्ट कर सकता है, लेकिन यह MCP रनटाइम नहीं बनाता, ट्रांसपोर्ट कनेक्ट नहीं करता, या `tools/list` जारी नहीं करता। यदि कोई मेल खाता गरम कैटलॉग मौजूद नहीं है, तो प्रतिक्रिया में `mcp-not-yet-connected`, `mcp-not-yet-listed`, या `mcp-stale-catalog` जैसा नोटिस शामिल हो सकता है।
  - प्रभावी टूल प्रविष्टियाँ `source="core"`, `source="plugin"`, `source="channel"`, या `source="mcp"` का उपयोग करती हैं।
- ऑपरेटर `/tools/invoke` वाले समान Gateway नीति पाथ के माध्यम से एक उपलब्ध टूल चलाने के लिए `tools.invoke` (`operator.write`) कॉल कर सकते हैं।
  - `name` आवश्यक है। `args`, `sessionKey`, `agentId`, `confirm`, और `idempotencyKey` वैकल्पिक हैं।
  - यदि `sessionKey` और `agentId` दोनों मौजूद हैं, तो रिज़ॉल्व किए गए सत्र एजेंट को `agentId` से मेल खाना होगा।
  - `cron`, `gateway`, और `nodes` जैसे केवल-मालिक core wrappers को मालिक/admin पहचान (`operator.admin`) चाहिए, भले ही `tools.invoke` मेथड स्वयं `operator.write` हो।
  - प्रतिक्रिया `ok`, `toolName`, वैकल्पिक `output`, और typed `error` फ़ील्ड वाला SDK-उन्मुख envelope है। स्वीकृति या नीति अस्वीकृतियाँ Gateway टूल नीति पाइपलाइन को बायपास करने के बजाय पेलोड में `ok:false` लौटाती हैं।
- ऑपरेटर किसी एजेंट के लिए दिखने वाली skill इन्वेंटरी लाने हेतु `skills.status` (`operator.read`) कॉल कर सकते हैं।
  - `agentId` वैकल्पिक है; डिफ़ॉल्ट एजेंट वर्कस्पेस पढ़ने के लिए इसे छोड़ दें।
  - प्रतिक्रिया में पात्रता, गुम आवश्यकताएँ, कॉन्फ़िग जाँचें, और कच्चे secret मान उजागर किए बिना sanitized इंस्टॉल विकल्प शामिल होते हैं।
- ऑपरेटर ClawHub खोज मेटाडेटा के लिए `skills.search` और `skills.detail` (`operator.read`) कॉल कर सकते हैं।
- ऑपरेटर किसी निजी skill archive को इंस्टॉल करने से पहले stage करने के लिए `skills.upload.begin`, `skills.upload.chunk`, और `skills.upload.commit` (`operator.admin`) कॉल कर सकते हैं। यह भरोसेमंद क्लाइंट्स के लिए अलग admin upload पाथ है, सामान्य ClawHub skill install flow नहीं, और डिफ़ॉल्ट रूप से बंद रहता है जब तक `skills.install.allowUploadedArchives` सक्षम न हो।
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })` उस slug और force मान से बंधा upload बनाता है।
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` सटीक decoded offset पर bytes जोड़ता है।
  - `skills.upload.commit({ uploadId, sha256? })` अंतिम size और SHA-256 सत्यापित करता है। Commit केवल upload को finalizes करता है; यह skill इंस्टॉल नहीं करता।
  - Uploaded skill archives zip archives होते हैं जिनमें `SKILL.md` root होता है। archive का आंतरिक directory name कभी install target नहीं चुनता।
- ऑपरेटर `skills.install` (`operator.admin`) को तीन मोड में कॉल कर सकते हैं:
  - ClawHub मोड: `{ source: "clawhub", slug, version?, force? }` डिफ़ॉल्ट एजेंट वर्कस्पेस की `skills/` directory में skill folder इंस्टॉल करता है।
  - Upload मोड: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }` committed upload को डिफ़ॉल्ट एजेंट वर्कस्पेस की `skills/<slug>` directory में इंस्टॉल करता है। slug और force मान मूल `skills.upload.begin` अनुरोध से मेल खाने चाहिए। यह मोड तब तक अस्वीकार किया जाता है जब तक `skills.install.allowUploadedArchives` सक्षम न हो। यह setting ClawHub installs को प्रभावित नहीं करती।
  - Gateway installer मोड: `{ name, installId, timeoutMs? }` Gateway host पर घोषित `metadata.openclaw.install` action चलाता है। पुराने clients अभी भी `dangerouslyForceUnsafeInstall` भेज सकते हैं; यह फ़ील्ड deprecated है, केवल protocol compatibility के लिए स्वीकार किया जाता है, और अनदेखा किया जाता है। ऑपरेटर-स्वामित्व वाले install decisions के लिए `security.installPolicy` का उपयोग करें।
- ऑपरेटर `skills.update` (`operator.admin`) को दो मोड में कॉल कर सकते हैं:
  - ClawHub मोड डिफ़ॉल्ट एजेंट वर्कस्पेस में एक tracked slug या सभी tracked ClawHub installs अपडेट करता है।
  - Config मोड `skills.entries.<skillKey>` मानों जैसे `enabled`, `apiKey`, और `env` को patch करता है।

### `models.list` views

`models.list` एक वैकल्पिक `view` पैरामीटर स्वीकार करता है:

- छोड़ा गया या `"default"`: वर्तमान रनटाइम व्यवहार। यदि `agents.defaults.models` कॉन्फ़िगर किया गया है, तो प्रतिक्रिया allowed catalog होती है, जिसमें `provider/*` entries के लिए dynamically discovered models शामिल हैं। अन्यथा प्रतिक्रिया पूर्ण Gateway catalog होती है।
- `"configured"`: picker-sized व्यवहार। यदि `agents.defaults.models` कॉन्फ़िगर किया गया है, तो वह अभी भी प्रभावी रहता है, जिसमें `provider/*` entries के लिए provider-scoped discovery शामिल है। allowlist के बिना, प्रतिक्रिया explicit `models.providers.*.models` entries का उपयोग करती है, और केवल तब full catalog पर fallback करती है जब कोई configured model rows मौजूद नहीं होतीं।
- `"all"`: पूर्ण Gateway catalog, `agents.defaults.models` को bypass करते हुए। इसका उपयोग diagnostics और discovery UIs के लिए करें, सामान्य model pickers के लिए नहीं।

## Exec approvals

- जब किसी exec request को approval चाहिए, तो Gateway `exec.approval.requested` broadcast करता है।
- Operator clients `exec.approval.resolve` कॉल करके resolve करते हैं (`operator.approvals` scope आवश्यक)।
- `host=node` के लिए, `exec.approval.request` में `systemRunPlan` (canonical `argv`/`cwd`/`rawCommand`/session metadata) शामिल होना चाहिए। `systemRunPlan` के बिना requests अस्वीकार की जाती हैं।
- Approval के बाद, forwarded `node.invoke system.run` calls उसी canonical `systemRunPlan` को authoritative command/cwd/session context के रूप में फिर से उपयोग करती हैं।
- यदि कोई caller prepare और final approved `system.run` forward के बीच `command`, `rawCommand`, `cwd`, `agentId`, या `sessionKey` बदलता है, तो Gateway बदले हुए payload पर भरोसा करने के बजाय run को अस्वीकार करता है।

## Agent delivery fallback

- `agent` requests outbound delivery का अनुरोध करने के लिए `deliver=true` शामिल कर सकते हैं।
- `bestEffortDeliver=false` strict behavior बनाए रखता है: unresolved या internal-only delivery targets `INVALID_REQUEST` लौटाते हैं।
- `bestEffortDeliver=true` तब session-only execution पर fallback की अनुमति देता है जब कोई external deliverable route resolve नहीं हो पाता (उदाहरण के लिए internal/webchat sessions या ambiguous multi-channel configs)।
- Final `agent` results में delivery requested होने पर `result.deliveryStatus` शामिल हो सकता है, जो [`openclaw agent --json --deliver`](/hi/cli/agent#json-delivery-status) के लिए documented समान `sent`, `suppressed`, `partial_failed`, और `failed` statuses का उपयोग करता है।

## Versioning

- `PROTOCOL_VERSION` `packages/gateway-protocol/src/version.ts` में रहता है।
- Clients `minProtocol` + `maxProtocol` भेजते हैं; server उन ranges को reject करता है जिनमें उसका current protocol शामिल नहीं होता। Current clients और servers को protocol v4 चाहिए।
- Schemas + models TypeBox definitions से generate होते हैं:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Client constants

`src/gateway/client.ts` में reference client इन defaults का उपयोग करता है। Values protocol v4 में stable हैं और third-party clients के लिए expected baseline हैं।

| स्थिरांक                                  | डिफ़ॉल्ट                                               | स्रोत                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| Request timeout (per RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Preauth / connect-challenge timeout       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env paired server/client budget बढ़ा सकते हैं) |
| Initial reconnect backoff                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Max reconnect backoff                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Fast-retry clamp after device-token close | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| Force-stop grace before `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` default timeout           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Default tick interval (pre `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Tick-timeout close                        | silence `tickIntervalMs * 2` से अधिक होने पर code `4000` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Server effective `policy.tickIntervalMs`, `policy.maxPayload`, और `policy.maxBufferedBytes` को `hello-ok` में advertise करता है; clients को pre-handshake defaults के बजाय उन values का सम्मान करना चाहिए।

## Auth

- Shared-secret Gateway auth कॉन्फ़िगर किए गए auth mode के आधार पर `connect.params.auth.token` या
  `connect.params.auth.password` का उपयोग करता है।
- Tailscale Serve जैसे identity-bearing modes
  (`gateway.auth.allowTailscale: true`) या non-loopback
  `gateway.auth.mode: "trusted-proxy"` `connect.params.auth.*` के बजाय
  request headers से connect auth check पूरा करते हैं।
- Private-ingress `gateway.auth.mode: "none"` shared-secret connect auth को
  पूरी तरह छोड़ देता है; इस mode को public/untrusted ingress पर expose न करें।
- Pairing के बाद, Gateway connection
  role + scopes तक सीमित **device token** जारी करता है। यह `hello-ok.auth.deviceToken` में लौटाया जाता है और भविष्य के connects के लिए
  client द्वारा persist किया जाना चाहिए।
- Clients को किसी भी सफल connect के बाद primary `hello-ok.auth.deviceToken` persist करना चाहिए।
- उस **stored** device token से reconnect करने पर उस token के लिए stored
  approved scope set भी reuse होना चाहिए। इससे पहले से granted read/probe/status access
  बनी रहती है और reconnects को चुपचाप narrower implicit admin-only scope में
  collapse होने से बचाया जाता है।
- Client-side connect auth assembly (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` orthogonal है और set होने पर हमेशा forward किया जाता है।
  - `auth.token` priority order में populate होता है: पहले explicit shared token,
    फिर explicit `deviceToken`, फिर stored per-device token (`deviceId` + `role` से keyed)।
  - `auth.bootstrapToken` केवल तब भेजा जाता है जब ऊपर दिए गए किसी भी विकल्प ने
    `auth.token` resolve न किया हो। Shared token या कोई भी resolved device token इसे suppress करता है।
  - One-shot `AUTH_TOKEN_MISMATCH` retry पर stored device token का auto-promotion
    केवल **trusted endpoints** तक gated है —
    loopback, या pinned `tlsFingerprint` वाला `wss://`। बिना pinning वाला public `wss://`
    qualify नहीं करता।
- Built-in setup-code bootstrap primary node
  `hello-ok.auth.deviceToken` के साथ trusted mobile handoff के लिए
  `hello-ok.auth.deviceTokens` में bounded operator token लौटाता है। Operator token
  native Talk configuration reads के लिए `operator.talk.secrets` शामिल करता है, लेकिन
  pairing mutation scopes और `operator.admin` exclude करता है।
- जब non-baseline setup-code bootstrap approval की प्रतीक्षा कर रहा हो, `PAIRING_REQUIRED`
  details में `recommendedNextStep: "wait_then_retry"`, `retryable: true`,
  और `pauseReconnect: false` शामिल होते हैं। Clients को वही
  bootstrap token लेकर reconnect करते रहना चाहिए जब तक request approve न हो जाए या token invalid न हो जाए।
- `hello-ok.auth.deviceTokens` को केवल तब persist करें जब connect ने `wss://` या loopback/local pairing जैसे trusted transport पर bootstrap auth का उपयोग किया हो।
- यदि client कोई **explicit** `deviceToken` या explicit `scopes` देता है, तो वह
  caller-requested scope set authoritative रहता है; cached scopes केवल तब
  reuse होते हैं जब client stored per-device token reuse कर रहा हो।
- Device tokens को `device.token.rotate` और
  `device.token.revoke` के जरिए rotate/revoke किया जा सकता है (`operator.pairing` scope आवश्यक)। Node या अन्य non-operator role को rotate या
  revoke करने के लिए `operator.admin` भी आवश्यक है।
- `device.token.rotate` rotation metadata लौटाता है। यह replacement
  bearer token केवल same-device calls के लिए echo करता है जो पहले से
  उस device token से authenticated हैं, ताकि token-only clients reconnect करने से पहले
  अपना replacement persist कर सकें। Shared/admin rotations bearer token echo नहीं करते।
- Token issuance, rotation, और revocation उस device की pairing entry में recorded approved role set तक bounded रहते हैं; token mutation कभी भी ऐसा device role expand या
  target नहीं कर सकता जिसे pairing approval ने grant नहीं किया।
- Paired-device token sessions के लिए, device management self-scoped है जब तक
  caller के पास `operator.admin` भी न हो: non-admin callers केवल अपने **own** device entry के
  operator token को manage कर सकते हैं। Node और अन्य non-operator
  token management admin-only है, caller के अपने device के लिए भी।
- `device.token.rotate` और `device.token.revoke` target operator
  token scope set को caller के current session scopes के विरुद्ध भी check करते हैं। Non-admin callers
  अपने पास पहले से मौजूद scope से broader operator token rotate या revoke नहीं कर सकते।
- Auth failures में `error.details.code` और recovery hints शामिल होते हैं:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` के लिए client behavior:
  - Trusted clients cached per-device token के साथ एक bounded retry attempt कर सकते हैं।
  - यदि वह retry fail हो जाए, clients को automatic reconnect loops रोकने चाहिए और operator action guidance surface करनी चाहिए।
- `AUTH_SCOPE_MISMATCH` का मतलब है कि device token recognized था लेकिन requested role/scopes को cover नहीं करता।
  Clients को इसे bad token के रूप में present नहीं करना चाहिए;
  operator को re-pair करने या narrower/broader scope contract approve करने के लिए prompt करें।

## Device identity + pairing

- Nodes को keypair fingerprint से derived stable device identity (`device.id`) शामिल करनी चाहिए।
- Gateways प्रति device + role tokens issue करते हैं।
- नए device IDs के लिए pairing approvals आवश्यक हैं, जब तक local auto-approval
  enabled न हो।
- Pairing auto-approval direct local loopback connects पर centered है।
- OpenClaw में trusted shared-secret helper flows के लिए एक narrow backend/container-local self-connect path भी है।
- Same-host tailnet या LAN connects को pairing के लिए अब भी remote माना जाता है और
  approval आवश्यक होता है।
- WS clients सामान्यतः `connect` (operator +
  node) के दौरान `device` identity शामिल करते हैं। केवल device-less operator exceptions explicit trust paths हैं:
  - `gateway.controlUi.allowInsecureAuth=true` localhost-only insecure HTTP compatibility के लिए।
  - successful `gateway.auth.mode: "trusted-proxy"` operator Control UI auth।
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, severe security downgrade)।
  - reserved internal helper path पर direct-loopback `gateway-client` backend RPCs।
- Device identity omit करने के scope consequences होते हैं। जब device-less operator
  connection किसी explicit trust path के जरिए allowed हो, OpenClaw फिर भी
  self-declared scopes को empty set पर clear कर देता है, जब तक उस path में named
  scope-preservation exception न हो। Scope-gated methods फिर
  `missing scope` के साथ fail होते हैं।
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` एक Control UI
  break-glass scope-preservation path है। यह arbitrary
  custom backend या CLI-shaped WebSocket clients को scopes grant नहीं करता।
- Reserved direct-loopback `gateway-client` backend helper path केवल internal local control-plane RPCs के लिए
  scopes preserve करता है; custom backend IDs को यह exception नहीं मिलता।
- सभी connections को server-provided `connect.challenge` nonce sign करना होगा।

### Device auth migration diagnostics

Legacy clients के लिए जो अभी भी pre-challenge signing behavior का उपयोग करते हैं, `connect` अब
stable `error.details.reason` के साथ `error.details.code` के अंतर्गत
`DEVICE_AUTH_*` detail codes लौटाता है।

Common migration failures:

| Message                     | details.code                     | details.reason           | Meaning                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client ने `device.nonce` omit किया (या blank भेजा)। |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client ने stale/wrong nonce से sign किया।          |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Signature payload v2 payload से match नहीं करता।  |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Signed timestamp allowed skew के बाहर है।          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` public key fingerprint से match नहीं करता। |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Public key format/canonicalization fail हुआ।       |

Migration target:

- हमेशा `connect.challenge` की प्रतीक्षा करें।
- Server nonce शामिल करने वाले v2 payload को sign करें।
- वही nonce `connect.params.device.nonce` में भेजें।
- Preferred signature payload `v3` है, जो device/client/role/scopes/token/nonce fields के अलावा `platform` और `deviceFamily` को bind करता है।
- Legacy `v2` signatures compatibility के लिए accepted रहती हैं, लेकिन paired-device
  metadata pinning फिर भी reconnect पर command policy control करती है।

## TLS + pinning

- TLS, WS connections के लिए supported है।
- Clients वैकल्पिक रूप से gateway cert fingerprint pin कर सकते हैं (`gateway.tls`
  config और `gateway.remote.tlsFingerprint` या CLI `--tls-fingerprint` देखें)।

## Scope

यह protocol **full gateway API** (status, channels, models, chat,
agent, sessions, nodes, approvals, आदि) expose करता है। Exact surface
`packages/gateway-protocol/src/schema.ts` में TypeBox schemas द्वारा defined है।

## Related

- [Bridge protocol](/hi/gateway/bridge-protocol)
- [Gateway runbook](/hi/gateway)
