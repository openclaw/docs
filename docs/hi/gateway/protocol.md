---
read_when:
    - Gateway WS क्लाइंट लागू करना या अपडेट करना
    - प्रोटोकॉल असंगतियों या कनेक्शन विफलताओं को डीबग करना
    - प्रोटोकॉल स्कीमा/मॉडल फिर से जनरेट करना
summary: 'Gateway WebSocket प्रोटोकॉल: हैंडशेक, फ़्रेम, संस्करण प्रबंधन'
title: Gateway प्रोटोकॉल
x-i18n:
    generated_at: "2026-07-03T09:39:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b58ef44b15e7359ca919e487bcf94c86601f508500ece000aafd8d1a90fb1cf1
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS प्रोटोकॉल OpenClaw के लिए **एकल नियंत्रण तल + नोड ट्रांसपोर्ट** है। सभी क्लाइंट (CLI, वेब UI, macOS ऐप, iOS/Android नोड, हेडलेस
नोड) WebSocket से कनेक्ट होते हैं और हैंडशेक समय पर अपना **role** + **scope** घोषित करते हैं.

## ट्रांसपोर्ट

- WebSocket, JSON पेलोड वाले टेक्स्ट फ्रेम.
- पहला फ्रेम **अनिवार्य रूप से** एक `connect` अनुरोध होना चाहिए.
- प्री-कनेक्ट फ्रेम 64 KiB तक सीमित हैं। सफल हैंडशेक के बाद, क्लाइंटों को
  `hello-ok.policy.maxPayload` और
  `hello-ok.policy.maxBufferedBytes` सीमाओं का पालन करना चाहिए। डायग्नॉस्टिक्स सक्षम होने पर,
  बहुत बड़े इनबाउंड फ्रेम और धीमे आउटबाउंड बफर, gateway द्वारा प्रभावित फ्रेम बंद या ड्रॉप करने से पहले `payload.large` इवेंट उत्सर्जित करते हैं। ये इवेंट
  आकार, सीमाएं, सतहें, और सुरक्षित कारण कोड रखते हैं। ये संदेश
  बॉडी, अटैचमेंट सामग्री, कच्चा फ्रेम बॉडी, टोकन, कुकी, या सीक्रेट मान नहीं रखते.

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

जब Gateway अभी भी स्टार्टअप साइडकार पूरा कर रहा हो, `connect` अनुरोध
`details.reason` को `"startup-sidecars"` और `retryAfterMs` पर सेट करके पुनः प्रयास योग्य `UNAVAILABLE` त्रुटि लौटा सकता है। क्लाइंटों को इसे अंतिम
हैंडशेक विफलता के रूप में दिखाने के बजाय अपने कुल कनेक्शन बजट के भीतर उस प्रतिक्रिया को पुनः प्रयास करना चाहिए.

`server`, `features`, `snapshot`, और `policy` सभी स्कीमा
(`packages/gateway-protocol/src/schema/frames.ts`) द्वारा आवश्यक हैं। `auth` भी आवश्यक है और
बातचीत से तय role/scopes रिपोर्ट करता है। `pluginSurfaceUrls` वैकल्पिक है और `canvas` जैसे plugin
सतह नामों को स्कोप्ड होस्टेड URL से मैप करता है.

स्कोप्ड plugin सतह URL समाप्त हो सकते हैं। नोड
`node.pluginSurface.refresh` को `{ "surface": "canvas" }` के साथ कॉल करके
`pluginSurfaceUrls` में ताजा एंट्री प्राप्त कर सकते हैं। प्रयोगात्मक Canvas plugin refactor अप्रचलित `canvasHostUrl`, `canvasCapability`, या
`node.canvas.capability.refresh` संगतता पथ का समर्थन नहीं करता; वर्तमान नेटिव क्लाइंटों और
gateways को plugin सतहों का उपयोग करना होगा.

जब कोई डिवाइस टोकन जारी नहीं होता, `hello-ok.auth` टोकन फील्ड के बिना बातचीत से तय
अनुमतियां रिपोर्ट करता है:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

विश्वसनीय समान-प्रक्रिया बैकएंड क्लाइंट (`client.id: "gateway-client"`,
`client.mode: "backend"`) साझा gateway token/password से प्रमाणित होने पर direct loopback कनेक्शन पर `device` छोड़ सकते हैं। यह पथ आंतरिक control-plane RPCs के लिए आरक्षित है और पुराने CLI/device pairing baselines को subagent session updates जैसे local backend work को रोकने से बचाता है। Remote clients,
browser-origin clients, node clients, और explicit device-token/device-identity
clients अभी भी सामान्य pairing और scope-upgrade checks का उपयोग करते हैं.

जब कोई डिवाइस टोकन जारी होता है, `hello-ok` में यह भी शामिल होता है:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

बिल्ट-इन QR/setup-code bootstrap एक ताजा मोबाइल handoff path है। सफल
baseline setup-code connect एक primary node token और एक bounded
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
अलग approved operator pairing या token flow आवश्यक है। क्लाइंटों को
`hello-ok.auth.deviceTokens` केवल
तब persist करना चाहिए जब connect ने `wss://` या
loopback/local pairing जैसे trusted transport पर bootstrap auth उपयोग किया हो.

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

- **अनुरोध**: `{type:"req", id, method, params}`
- **प्रतिक्रिया**: `{type:"res", id, ok, payload|error}`
- **इवेंट**: `{type:"event", event, payload, seq?, stateVersion?}`

साइड-इफेक्ट करने वाली विधियों के लिए **idempotency keys** आवश्यक हैं (स्कीमा देखें).

## भूमिकाएं + scopes

पूरे operator scope model, approval-time checks, और shared-secret
semantics के लिए, [Operator scopes](/hi/gateway/operator-scopes) देखें.

### भूमिकाएं

- `operator` = control plane client (CLI/UI/automation).
- `node` = capability host (camera/screen/canvas/system.run).

### Scopes (operator)

सामान्य scopes:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` के साथ `talk.config` के लिए `operator.talk.secrets`
(या `operator.admin`) आवश्यक है।
जब secrets शामिल हों, क्लाइंटों को सक्रिय Talk provider
credential `talk.resolved.config.apiKey` से पढ़ना चाहिए; `talk.providers.<id>.apiKey`
source-shaped रहता है और SecretRef object या redacted string हो सकता है.

Plugin-registered gateway RPC methods अपनी operator scope मांग सकते हैं, लेकिन
reserved core admin prefixes (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) हमेशा `operator.admin` में resolve होते हैं.

Method scope केवल पहला gate है। `chat.send` के माध्यम से पहुंची कुछ slash commands
ऊपर से अधिक सख्त command-level checks लागू करती हैं। उदाहरण के लिए, persistent
`/config set` और `/config unset` writes के लिए `operator.admin` आवश्यक है.

`node.pair.approve` में base method scope के ऊपर एक अतिरिक्त approval-time scope check भी है:

- commandless requests: `operator.pairing`
- non-exec node commands वाले requests: `operator.pairing` + `operator.write`
- ऐसे requests जिनमें `system.run`, `system.run.prepare`, या `system.which` शामिल हैं:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

नोड connect time पर capability claims घोषित करते हैं:

- `caps`: उच्च-स्तरीय capability categories जैसे `camera`, `canvas`, `screen`,
  `location`, `voice`, और `talk`.
- `commands`: invoke के लिए command allowlist.
- `permissions`: granular toggles (जैसे `screen.record`, `camera.capture`).

Gateway इन्हें **claims** के रूप में मानता है और server-side allowlists लागू करता है.

## Presence

- `system-presence` device identity द्वारा keyed entries लौटाता है.
- Presence entries में `deviceId`, `roles`, और `scopes` शामिल हैं ताकि UIs प्रति device एक single row दिखा सकें,
  भले ही वह **operator** और **node** दोनों के रूप में connect करे.
- `node.list` में वैकल्पिक `lastSeenAtMs` और `lastSeenReason` fields शामिल हैं। Connected nodes
  reason `connect` के साथ अपना current connection time `lastSeenAtMs` के रूप में report करते हैं; paired nodes तब durable background presence भी report कर सकते हैं
  जब कोई trusted node event उनकी pairing metadata अपडेट करता है.

### Node background alive event

नोड `event: "node.presence.alive"` के साथ `node.event` कॉल कर सकते हैं ताकि यह record हो कि paired node
background wake के दौरान alive था, उसे connected marked किए बिना.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` एक closed enum है: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual`, या `connect`. Unknown trigger strings को persistence से पहले gateway द्वारा
`background` में normalized किया जाता है। यह event केवल authenticated node
device sessions के लिए durable है; device-less या unpaired sessions `handled: false` लौटाते हैं.

सफल gateways structured result लौटाते हैं:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

पुराने gateways अभी भी `node.event` के लिए `{ "ok": true }` लौटा सकते हैं; क्लाइंटों को इसे
acknowledged RPC के रूप में मानना चाहिए, durable presence persistence के रूप में नहीं.

## Broadcast event scoping

Server-pushed WebSocket broadcast events scope-gated होते हैं ताकि pairing-scoped या node-only sessions निष्क्रिय रूप से session content प्राप्त न करें.

- **Chat, agent, और tool-result frames** (streamed `agent` events और tool call results सहित) के लिए कम से कम `operator.read` आवश्यक है। `operator.read` के बिना sessions इन frames को पूरी तरह छोड़ देते हैं.
- **Plugin-defined `plugin.*` broadcasts** `operator.write` या `operator.admin` पर gated होते हैं, यह इस पर निर्भर करता है कि plugin ने उन्हें कैसे registered किया.
- **Status और transport events** (`heartbeat`, `presence`, `tick`, connect/disconnect lifecycle, आदि) unrestricted रहते हैं ताकि transport health हर authenticated session के लिए observable रहे.
- **Unknown broadcast event families** default रूप से scope-gated (fail-closed) होते हैं, जब तक कोई registered handler उन्हें स्पष्ट रूप से relax न करे.

हर client connection अपना per-client sequence number रखता है ताकि broadcasts उस socket पर monotonic ordering बनाए रखें, भले ही अलग-अलग clients event stream के अलग-अलग scope-filtered subsets देखें.

## सामान्य RPC method families

public WS surface ऊपर दिए handshake/auth examples से व्यापक है। यह
generated dump नहीं है — `hello-ok.features.methods` एक conservative
discovery list है जो `src/gateway/server-methods-list.ts` और loaded
plugin/channel method exports से बनी है। इसे feature discovery मानें, `src/gateway/server-methods/*.ts` की पूर्ण
enumeration नहीं.

  <AccordionGroup>
  <Accordion title="सिस्टम और पहचान">
    - `health` कैश किया हुआ या नए सिरे से जांचा गया Gateway स्वास्थ्य स्नैपशॉट लौटाता है।
    - `diagnostics.stability` हाल का सीमित डायग्नोस्टिक स्थिरता रिकॉर्डर लौटाता है। यह इवेंट नाम, गणनाएं, बाइट आकार, मेमोरी रीडिंग, क्यू/सेशन स्थिति, चैनल/Plugin नाम और सेशन आईडी जैसे परिचालन मेटाडेटा रखता है। यह चैट टेक्स्ट, Webhook बॉडी, टूल आउटपुट, कच्ची अनुरोध या प्रतिक्रिया बॉडी, टोकन, कुकीज़ या गुप्त मान नहीं रखता। ऑपरेटर रीड स्कोप आवश्यक है।
    - `status` `/status`-शैली का Gateway सारांश लौटाता है; संवेदनशील फील्ड केवल एडमिन-स्कोप वाले ऑपरेटर क्लाइंट के लिए शामिल किए जाते हैं।
    - `gateway.identity.get` रिले और पेयरिंग फ्लो द्वारा उपयोग की जाने वाली Gateway डिवाइस पहचान लौटाता है।
    - `system-presence` जुड़े हुए ऑपरेटर/Node डिवाइसों के लिए वर्तमान उपस्थिति स्नैपशॉट लौटाता है।
    - `system-event` एक सिस्टम इवेंट जोड़ता है और उपस्थिति संदर्भ को अपडेट/ब्रॉडकास्ट कर सकता है।
    - `last-heartbeat` नवीनतम स्थायी Heartbeat इवेंट लौटाता है।
    - `set-heartbeats` Gateway पर Heartbeat प्रोसेसिंग को टॉगल करता है।

  </Accordion>

  <Accordion title="मॉडल और उपयोग">
    - `models.list` रनटाइम-अनुमत मॉडल कैटलॉग लौटाता है। पिकर-आकार के कॉन्फिगर किए गए मॉडल के लिए `{ "view": "configured" }` पास करें (`agents.defaults.models` पहले, फिर `models.providers.*.models`), या पूरे कैटलॉग के लिए `{ "view": "all" }` पास करें।
    - `usage.status` प्रदाता उपयोग विंडो/शेष कोटा सारांश लौटाता है।
    - `usage.cost` किसी तारीख सीमा के लिए संकलित लागत उपयोग सारांश लौटाता है।
      एक एजेंट के लिए `agentId` पास करें, या कॉन्फिगर किए गए एजेंटों को संकलित करने के लिए `agentScope: "all"` पास करें।
    - `doctor.memory.status` सक्रिय डिफॉल्ट एजेंट वर्कस्पेस के लिए वेक्टर-मेमोरी / कैश की गई एम्बेडिंग तैयारी लौटाता है। `{ "probe": true }` या `{ "deep": true }` केवल तब पास करें जब कॉलर स्पष्ट रूप से लाइव एम्बेडिंग प्रदाता पिंग चाहता हो। Dreaming-सचेत क्लाइंट चुने गए एजेंट वर्कस्पेस तक Dreaming स्टोर आंकड़ों को सीमित करने के लिए `{ "agentId": "agent-id" }` भी पास कर सकते हैं; `agentId` छोड़ने पर डिफॉल्ट-एजेंट फॉलबैक रहता है और कॉन्फिगर किए गए Dreaming वर्कस्पेस संकलित होते हैं।
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts`, और `doctor.memory.dedupeDreamDiary` चुने गए एजेंट Dreaming व्यू/एक्शन के लिए वैकल्पिक `{ "agentId": "agent-id" }` पैरामीटर स्वीकार करते हैं। जब `agentId` छोड़ा जाता है, तो वे कॉन्फिगर किए गए डिफॉल्ट एजेंट वर्कस्पेस पर काम करते हैं।
    - `doctor.memory.remHarness` रिमोट कंट्रोल-प्लेन क्लाइंट के लिए सीमित, रीड-ओनली REM हार्नेस प्रीव्यू लौटाता है। इसमें वर्कस्पेस पथ, मेमोरी स्निपेट, रेंडर किया गया ग्राउंडेड मार्कडाउन, और डीप प्रमोशन उम्मीदवार शामिल हो सकते हैं, इसलिए कॉलर को `operator.read` चाहिए।
    - `sessions.usage` प्रति-सेशन उपयोग सारांश लौटाता है। एक
      एजेंट के लिए `agentId` पास करें, या कॉन्फिगर किए गए एजेंटों को साथ सूचीबद्ध करने के लिए `agentScope: "all"` पास करें।
    - `sessions.usage.timeseries` एक सेशन के लिए टाइमसीरीज़ उपयोग लौटाता है।
    - `sessions.usage.logs` एक सेशन के लिए उपयोग लॉग प्रविष्टियां लौटाता है।

  </Accordion>

  <Accordion title="चैनल और लॉगिन सहायक">
    - `channels.status` बिल्ट-इन + बंडल किए गए चैनल/Plugin स्थिति सारांश लौटाता है।
    - `channels.logout` उस विशिष्ट चैनल/अकाउंट को लॉग आउट करता है जहां चैनल लॉगआउट का समर्थन करता है।
    - `web.login.start` वर्तमान QR-सक्षम वेब चैनल प्रदाता के लिए QR/वेब लॉगिन फ्लो शुरू करता है।
    - `web.login.wait` उस QR/वेब लॉगिन फ्लो के पूरा होने की प्रतीक्षा करता है और सफलता पर चैनल शुरू करता है।
    - `push.test` पंजीकृत iOS Node को परीक्षण APNs पुश भेजता है।
    - `voicewake.get` संग्रहित वेक-वर्ड ट्रिगर लौटाता है।
    - `voicewake.set` वेक-वर्ड ट्रिगर अपडेट करता है और बदलाव ब्रॉडकास्ट करता है।

  </Accordion>

  <Accordion title="मैसेजिंग और लॉग">
    - `send` चैट रनर के बाहर चैनल/अकाउंट/थ्रेड-लक्षित भेजने के लिए प्रत्यक्ष आउटबाउंड-डिलीवरी RPC है।
    - `logs.tail` कर्सर/सीमा और अधिकतम-बाइट नियंत्रणों के साथ कॉन्फिगर किया गया Gateway फाइल-लॉग टेल लौटाता है।

  </Accordion>

  <Accordion title="Talk और TTS">
    - `talk.catalog` स्पीच, स्ट्रीमिंग ट्रांसक्रिप्शन, और रियलटाइम वॉइस के लिए रीड-ओनली Talk प्रदाता कैटलॉग लौटाता है। इसमें प्रदाता सीक्रेट लौटाए या वैश्विक कॉन्फिग बदले बिना कैनॉनिकल प्रदाता आईडी, रजिस्ट्री एलियस, लेबल, कॉन्फिगर की गई स्थिति, वैकल्पिक ग्रुप-लेवल `ready` परिणाम, प्रदर्शित मॉडल/वॉइस आईडी, कैनॉनिकल मोड, ट्रांसपोर्ट, ब्रेन रणनीतियां, और रियलटाइम ऑडियो/क्षमता फ्लैग शामिल होते हैं। वर्तमान Gateways रनटाइम प्रदाता चयन लागू करने के बाद `ready` सेट करते हैं; पुराने Gateways के साथ संगतता के लिए क्लाइंट को इसकी अनुपस्थिति को अप्रमाणित मानना चाहिए।
    - `talk.config` प्रभावी Talk कॉन्फिग पेलोड लौटाता है; `includeSecrets` के लिए `operator.talk.secrets` (या `operator.admin`) आवश्यक है।
    - `talk.session.create` `realtime/gateway-relay`, `transcription/gateway-relay`, या `stt-tts/managed-room` के लिए Gateway-स्वामित्व वाला Talk सेशन बनाता है। `stt-tts/managed-room` के लिए, `sessionKey` पास करने वाले `operator.write` कॉलर को स्कोप्ड सेशन-की दृश्यता के लिए `spawnedBy` भी पास करना होगा; अनस्कोप्ड `sessionKey` बनाना और `brain: "direct-tools"` के लिए `operator.admin` आवश्यक है।
    - `talk.session.join` मैनेज्ड-रूम सेशन टोकन को वैध करता है, जरूरत के अनुसार `session.ready` या `session.replaced` इवेंट उत्सर्जित करता है, और प्लेनटेक्स्ट टोकन या संग्रहित टोकन हैश के बिना रूम/सेशन मेटाडेटा तथा हाल के Talk इवेंट लौटाता है।
    - `talk.session.appendAudio` Gateway-स्वामित्व वाले रियलटाइम रिले और ट्रांसक्रिप्शन सेशन में base64 PCM इनपुट ऑडियो जोड़ता है।
    - `talk.session.startTurn`, `talk.session.endTurn`, और `talk.session.cancelTurn` स्थिति साफ होने से पहले स्टेल-टर्न अस्वीकृति के साथ मैनेज्ड-रूम टर्न लाइफसाइकल चलाते हैं।
    - `talk.session.cancelOutput` असिस्टेंट ऑडियो आउटपुट रोकता है, मुख्य रूप से Gateway रिले सेशन में VAD-गेटेड बार्ज-इन के लिए।
    - `talk.session.submitToolResult` Gateway-स्वामित्व वाले रियलटाइम रिले सेशन द्वारा उत्सर्जित प्रदाता टूल कॉल पूरा करता है। अंतरिम टूल आउटपुट के लिए `options: { willContinue: true }` पास करें जब अंतिम परिणाम बाद में आएगा, या `options: { suppressResponse: true }` तब पास करें जब टूल परिणाम को दूसरी रियलटाइम असिस्टेंट प्रतिक्रिया शुरू किए बिना प्रदाता कॉल पूरा करना चाहिए।
    - `talk.session.steer` Gateway-स्वामित्व वाले एजेंट-समर्थित Talk सेशन में सक्रिय-रन वॉइस नियंत्रण भेजता है। यह `{ sessionId, text, mode? }` स्वीकार करता है, जहां `mode` `status`, `steer`, `cancel`, या `followup` है; छोड़ा गया मोड बोले गए टेक्स्ट से वर्गीकृत होता है।
    - `talk.session.close` Gateway-स्वामित्व वाले रिले, ट्रांसक्रिप्शन, या मैनेज्ड-रूम सेशन को बंद करता है और अंतिम Talk इवेंट उत्सर्जित करता है।
    - `talk.mode` WebChat/Control UI क्लाइंट के लिए वर्तमान Talk मोड स्थिति सेट/ब्रॉडकास्ट करता है।
    - `talk.client.create` `webrtc` या `provider-websocket` का उपयोग करके क्लाइंट-स्वामित्व वाला रियलटाइम प्रदाता सेशन बनाता है, जबकि Gateway कॉन्फिग, क्रेडेंशियल, निर्देश और टूल नीति का स्वामी रहता है।
    - `talk.client.toolCall` क्लाइंट-स्वामित्व वाले रियलटाइम ट्रांसपोर्ट को प्रदाता टूल कॉल Gateway नीति को फॉरवर्ड करने देता है। पहला समर्थित टूल `openclaw_agent_consult` है; क्लाइंट को रन आईडी मिलती है और वे प्रदाता-विशिष्ट टूल परिणाम सबमिट करने से पहले सामान्य चैट लाइफसाइकल इवेंट की प्रतीक्षा करते हैं।
    - `talk.client.steer` क्लाइंट-स्वामित्व वाले रियलटाइम ट्रांसपोर्ट के लिए सक्रिय-रन वॉइस नियंत्रण भेजता है। Gateway `sessionKey` से सक्रिय एम्बेडेड रन हल करता है और स्टीयरिंग को चुपचाप छोड़ने के बजाय संरचित स्वीकार/अस्वीकार परिणाम लौटाता है।
    - `talk.event` रियलटाइम, ट्रांसक्रिप्शन, STT/TTS, मैनेज्ड-रूम, टेलीफोनी, और मीटिंग अडैप्टर के लिए एकल Talk इवेंट चैनल है।
    - `talk.speak` सक्रिय Talk स्पीच प्रदाता के माध्यम से स्पीच सिंथेसाइज करता है।
    - `tts.status` TTS सक्षम स्थिति, सक्रिय प्रदाता, फॉलबैक प्रदाता, और प्रदाता कॉन्फिग स्थिति लौटाता है।
    - `tts.providers` दृश्यमान TTS प्रदाता इन्वेंटरी लौटाता है।
    - `tts.enable` और `tts.disable` TTS प्राथमिकता स्थिति को टॉगल करते हैं।
    - `tts.setProvider` पसंदीदा TTS प्रदाता अपडेट करता है।
    - `tts.convert` वन-शॉट टेक्स्ट-टू-स्पीच रूपांतरण चलाता है।

  </Accordion>

  <Accordion title="सीक्रेट, कॉन्फिग, अपडेट, और विजार्ड">
    - `secrets.reload` सक्रिय SecretRefs को फिर से हल करता है और केवल पूर्ण सफलता पर रनटाइम सीक्रेट स्थिति बदलता है।
    - `secrets.resolve` किसी विशिष्ट कमांड/टार्गेट सेट के लिए कमांड-लक्षित सीक्रेट असाइनमेंट हल करता है।
    - `config.get` वर्तमान कॉन्फिग स्नैपशॉट और हैश लौटाता है।
    - `config.set` वैध किया गया कॉन्फिग पेलोड लिखता है।
    - `config.patch` आंशिक कॉन्फिग अपडेट मर्ज करता है। विनाशकारी ऐरे
      प्रतिस्थापन के लिए प्रभावित पथ `replacePaths` में होना आवश्यक है; ऐरे प्रविष्टियों
      के अंतर्गत नेस्टेड ऐरे `[]` पथों का उपयोग करते हैं, जैसे `agents.list[].skills`।
    - `config.apply` पूर्ण कॉन्फिग पेलोड को वैध करता है + प्रतिस्थापित करता है।
    - `config.schema` Control UI और CLI टूलिंग द्वारा उपयोग किया गया लाइव कॉन्फिग स्कीमा पेलोड लौटाता है: स्कीमा, `uiHints`, संस्करण, और जनरेशन मेटाडेटा, जिसमें रनटाइम द्वारा लोड किए जा सकने पर Plugin + चैनल स्कीमा मेटाडेटा भी शामिल है। स्कीमा में उसी लेबल और सहायता टेक्स्ट से निकला फील्ड `title` / `description` मेटाडेटा शामिल है जिसका उपयोग UI करता है, जिसमें नेस्टेड ऑब्जेक्ट, वाइल्डकार्ड, ऐरे-आइटम, और `anyOf` / `oneOf` / `allOf` कंपोजिशन शाखाएं शामिल हैं जब मेल खाता फील्ड दस्तावेज मौजूद हो।
    - `config.schema.lookup` एक कॉन्फिग पथ के लिए पथ-स्कोप्ड लुकअप पेलोड लौटाता है: सामान्यीकृत पथ, सतही स्कीमा नोड, मेल खाता संकेत + `hintPath`, वैकल्पिक `reloadKind`, और UI/CLI ड्रिल-डाउन के लिए तत्काल चाइल्ड सारांश। `reloadKind` `restart`, `hot`, या `none` में से एक है और अनुरोधित पथ के लिए Gateway कॉन्फिग रीलोड प्लानर को प्रतिबिंबित करता है। लुकअप स्कीमा नोड उपयोगकर्ता-सामना दस्तावेज और सामान्य वैलिडेशन फील्ड (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, संख्यात्मक/स्ट्रिंग/ऐरे/ऑब्जेक्ट सीमाएं, और `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` जैसे फ्लैग) रखते हैं। चाइल्ड सारांश `key`, सामान्यीकृत `path`, `type`, `required`, `hasChildren`, वैकल्पिक `reloadKind`, साथ ही मेल खाता `hint` / `hintPath` प्रदर्शित करते हैं।
    - `update.run` Gateway अपडेट फ्लो चलाता है और केवल तब रीस्टार्ट शेड्यूल करता है जब अपडेट स्वयं सफल हुआ हो; सेशन वाले कॉलर `continuationMessage` शामिल कर सकते हैं ताकि स्टार्टअप रीस्टार्ट कंटिन्यूएशन क्यू के माध्यम से एक फॉलो-अप एजेंट टर्न फिर शुरू करे। कंट्रोल प्लेन से पैकेज-मैनेजर अपडेट और सुपरवाइज्ड git-checkout अपडेट लाइव Gateway के अंदर पैकेज ट्री बदलने या checkout/build आउटपुट बदलने के बजाय डिटैच्ड मैनेज्ड-सर्विस हैंडऑफ का उपयोग करते हैं। शुरू किया गया हैंडऑफ `ok: true` के साथ `result.reason: "managed-service-handoff-started"` और `handoff.status: "started"` लौटाता है; अनुपलब्ध या असफल हैंडऑफ `managed-service-handoff-unavailable` या `managed-service-handoff-failed` के साथ `ok: false` लौटाते हैं, साथ ही जब मैनुअल शेल अपडेट आवश्यक हो तो `handoff.command` भी। अनुपलब्ध हैंडऑफ का अर्थ है कि OpenClaw के पास सुरक्षित सुपरवाइजर सीमा या टिकाऊ सेवा पहचान नहीं है, जैसे systemd के लिए `OPENCLAW_SYSTEMD_UNIT`। शुरू किए गए हैंडऑफ के दौरान, रीस्टार्ट सेंटिनल थोड़े समय के लिए `stats.reason: "restart-health-pending"` रिपोर्ट कर सकता है; कंटिन्यूएशन तब तक विलंबित रहता है जब तक CLI रीस्टार्ट किए गए Gateway को सत्यापित करके अंतिम `ok` सेंटिनल नहीं लिख देता।
    - `update.status` नवीनतम अपडेट रीस्टार्ट सेंटिनल को रीफ्रेश करके लौटाता है, उपलब्ध होने पर पोस्ट-रीस्टार्ट चल रहा संस्करण सहित।
    - `wizard.start`, `wizard.next`, `wizard.status`, और `wizard.cancel` WS RPC पर ऑनबोर्डिंग विजार्ड प्रदर्शित करते हैं।

  </Accordion>

  <Accordion title="एजेंट और कार्यस्थान सहायक">
    - `agents.list` कॉन्फ़िगर की गई एजेंट प्रविष्टियां लौटाता है, जिनमें प्रभावी मॉडल और रनटाइम मेटाडेटा शामिल होते हैं।
    - `agents.create`, `agents.update`, और `agents.delete` एजेंट रिकॉर्ड और कार्यस्थान वायरिंग प्रबंधित करते हैं।
    - `agents.files.list`, `agents.files.get`, और `agents.files.set` किसी एजेंट के लिए उजागर की गई बूटस्ट्रैप कार्यस्थान फ़ाइलों को प्रबंधित करते हैं।
    - `tasks.list`, `tasks.get`, और `tasks.cancel` Gateway टास्क लेजर को SDK और ऑपरेटर क्लाइंट के लिए उजागर करते हैं।
    - `artifacts.list`, `artifacts.get`, और `artifacts.download` स्पष्ट `sessionKey`, `runId`, या `taskId` स्कोप के लिए ट्रांसक्रिप्ट-व्युत्पन्न आर्टिफैक्ट सारांश और डाउनलोड उजागर करते हैं। रन और टास्क क्वेरी सर्वर-साइड पर स्वामी सत्र का समाधान करती हैं और केवल मेल खाते उद्गम वाला ट्रांसक्रिप्ट मीडिया लौटाती हैं; असुरक्षित या स्थानीय URL स्रोत सर्वर-साइड से फ़ेच करने के बजाय असमर्थित डाउनलोड लौटाते हैं।
    - `environments.list` और `environments.status` SDK क्लाइंट के लिए रीड-ओनली Gateway-स्थानीय और Node पर्यावरण खोज उजागर करते हैं।
    - `agent.identity.get` किसी एजेंट या सत्र के लिए प्रभावी सहायक पहचान लौटाता है।
    - `agent.wait` किसी रन के समाप्त होने की प्रतीक्षा करता है और उपलब्ध होने पर टर्मिनल स्नैपशॉट लौटाता है।

  </Accordion>

  <Accordion title="सत्र नियंत्रण">
    - `sessions.list` वर्तमान सत्र इंडेक्स लौटाता है, जिसमें एजेंट रनटाइम बैकएंड कॉन्फ़िगर होने पर प्रति-पंक्ति `agentRuntime` मेटाडेटा शामिल होता है।
    - `sessions.subscribe` और `sessions.unsubscribe` वर्तमान WS क्लाइंट के लिए सत्र परिवर्तन इवेंट सदस्यताएं टॉगल करते हैं।
    - `sessions.messages.subscribe` और `sessions.messages.unsubscribe` एक सत्र के लिए ट्रांसक्रिप्ट/संदेश इवेंट सदस्यताएं टॉगल करते हैं।
    - `sessions.preview` विशिष्ट सत्र कुंजियों के लिए सीमित ट्रांसक्रिप्ट पूर्वावलोकन लौटाता है।
    - `sessions.describe` सटीक सत्र कुंजी के लिए एक Gateway सत्र पंक्ति लौटाता है।
    - `sessions.resolve` किसी सत्र लक्ष्य को हल या कैनोनिकलाइज़ करता है।
    - `sessions.create` एक नई सत्र प्रविष्टि बनाता है।
    - `sessions.send` मौजूदा सत्र में संदेश भेजता है।
    - `sessions.steer` सक्रिय सत्र के लिए इंटरप्ट-और-स्टीयर वैरिएंट है।
    - `sessions.abort` किसी सत्र के लिए सक्रिय काम को निरस्त करता है। कॉलर `key` के साथ वैकल्पिक `runId` पास कर सकता है, या उन सक्रिय रन के लिए केवल `runId` पास कर सकता है जिन्हें Gateway किसी सत्र में हल कर सकता है।
    - `sessions.patch` सत्र मेटाडेटा/ओवरराइड अपडेट करता है और हल किए गए कैनोनिकल मॉडल के साथ प्रभावी `agentRuntime` की रिपोर्ट करता है।
    - `sessions.reset`, `sessions.delete`, और `sessions.compact` सत्र रखरखाव करते हैं।
    - `sessions.get` पूरी संग्रहीत सत्र पंक्ति लौटाता है।
    - चैट निष्पादन अब भी `chat.history`, `chat.send`, `chat.abort`, और `chat.inject` का उपयोग करता है। `chat.history` UI क्लाइंट के लिए डिस्प्ले-सामान्यीकृत है: इनलाइन निर्देश टैग दृश्यमान टेक्स्ट से हटाए जाते हैं, प्लेन-टेक्स्ट टूल-कॉल XML पेलोड (जिसमें `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, और काटे गए टूल-कॉल ब्लॉक शामिल हैं) और लीक हुए ASCII/फुल-विथ मॉडल नियंत्रण टोकन हटाए जाते हैं, सटीक `NO_REPLY` / `no_reply` जैसी शुद्ध साइलेंट-टोकन असिस्टेंट पंक्तियां छोड़ी जाती हैं, और बहुत बड़ी पंक्तियों को प्लेसहोल्डर से बदला जा सकता है।
    - `chat.message.get` एकल दृश्यमान ट्रांसक्रिप्ट प्रविष्टि के लिए एडिटिव सीमित पूर्ण-संदेश रीडर है। क्लाइंट `sessionKey`, सत्र चयन एजेंट-स्कोप्ड होने पर वैकल्पिक `agentId`, साथ ही पहले `chat.history` के माध्यम से सतह पर आया ट्रांसक्रिप्ट `messageId` पास करते हैं, और Gateway वही डिस्प्ले-सामान्यीकृत प्रोजेक्शन हल्के इतिहास ट्रंकेशन कैप के बिना लौटाता है, जब संग्रहीत प्रविष्टि अब भी उपलब्ध हो और अत्यधिक बड़ी न हो।
    - `chat.send` ऑटो कटऑफ से पहले शुरू किए गए मॉडल कॉल के लिए फास्ट मोड उपयोग करने हेतु एक-टर्न `fastMode: "auto"` स्वीकार करता है, फिर बाद की पुनः कोशिश, fallback, टूल-रिज़ल्ट, या निरंतरता कॉल को फास्ट मोड के बिना शुरू करता है। कटऑफ डिफ़ॉल्ट रूप से 60 सेकंड है और इसे प्रति मॉडल `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` से कॉन्फ़िगर किया जा सकता है। `chat.send` कॉलर उस अनुरोध के लिए कटऑफ ओवरराइड करने हेतु एक-टर्न `fastAutoOnSeconds` पास कर सकता है।

  </Accordion>

  <Accordion title="डिवाइस पेयरिंग और डिवाइस टोकन">
    - `device.pair.list` लंबित और स्वीकृत पेयर किए गए डिवाइस लौटाता है।
    - `device.pair.approve`, `device.pair.reject`, और `device.pair.remove` डिवाइस-पेयरिंग रिकॉर्ड प्रबंधित करते हैं।
    - `device.token.rotate` किसी पेयर किए गए डिवाइस टोकन को उसकी स्वीकृत भूमिका और कॉलर स्कोप सीमाओं के भीतर रोटेट करता है।
    - `device.token.revoke` किसी पेयर किए गए डिवाइस टोकन को उसकी स्वीकृत भूमिका और कॉलर स्कोप सीमाओं के भीतर निरस्त करता है।

  </Accordion>

  <Accordion title="Node पेयरिंग, इनवोक, और लंबित काम">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, और `node.pair.verify` Node पेयरिंग और बूटस्ट्रैप सत्यापन कवर करते हैं।
    - `node.list` और `node.describe` ज्ञात/कनेक्टेड Node स्थिति लौटाते हैं।
    - `node.rename` पेयर किए गए Node लेबल को अपडेट करता है।
    - `node.invoke` कनेक्टेड Node को कमांड अग्रेषित करता है।
    - `node.invoke.result` इनवोक अनुरोध का परिणाम लौटाता है।
    - `node.event` Node-उत्पन्न इवेंट को वापस Gateway में ले जाता है।
    - `node.pending.pull` और `node.pending.ack` कनेक्टेड-Node कतार APIs हैं।
    - `node.pending.enqueue` और `node.pending.drain` ऑफलाइन/डिस्कनेक्टेड Node के लिए टिकाऊ लंबित काम प्रबंधित करते हैं।

  </Accordion>

  <Accordion title="अनुमोदन परिवार">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, और `exec.approval.resolve` वन-शॉट exec अनुमोदन अनुरोधों के साथ लंबित अनुमोदन लुकअप/रीप्ले कवर करते हैं।
    - `exec.approval.waitDecision` एक लंबित exec अनुमोदन की प्रतीक्षा करता है और अंतिम निर्णय लौटाता है (या टाइमआउट पर `null`)।
    - `exec.approvals.get` और `exec.approvals.set` Gateway exec अनुमोदन नीति स्नैपशॉट प्रबंधित करते हैं।
    - `exec.approvals.node.get` और `exec.approvals.node.set` Node रिले कमांड के माध्यम से Node-स्थानीय exec अनुमोदन नीति प्रबंधित करते हैं।
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, और `plugin.approval.resolve` plugin-परिभाषित अनुमोदन फ्लो कवर करते हैं।

  </Accordion>

  <Accordion title="ऑटोमेशन, Skills, और टूल">
    - ऑटोमेशन: `wake` तत्काल या अगले-Heartbeat वेक टेक्स्ट इंजेक्शन को शेड्यूल करता है; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` शेड्यूल किए गए काम प्रबंधित करते हैं।
    - `cron.run` मैनुअल रन के लिए enqueue-शैली RPC बना रहता है। जिन क्लाइंट को पूर्णता सेमांटिक्स चाहिए, उन्हें लौटे हुए `runId` को पढ़ना चाहिए और `cron.runs` को पोल करना चाहिए।
    - `cron.runs` वैकल्पिक गैर-रिक्त `runId` फ़िल्टर स्वीकार करता है ताकि क्लाइंट उसी जॉब के लिए अन्य इतिहास प्रविष्टियों से रेस किए बिना एक कतारबद्ध मैनुअल रन का अनुसरण कर सकें।
    - Skills और टूल: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### सामान्य इवेंट परिवार

- `chat`: UI चैट अपडेट जैसे `chat.inject` और अन्य केवल-ट्रांसक्रिप्ट चैट
  इवेंट। प्रोटोकॉल v4 में, डेल्टा पेलोड `deltaText` रखते हैं; `message`
  संचयी असिस्टेंट स्नैपशॉट बना रहता है। नॉन-प्रीफ़िक्स प्रतिस्थापन `replace=true`
  सेट करते हैं और `deltaText` को प्रतिस्थापन टेक्स्ट के रूप में उपयोग करते हैं।
- `session.message`, `session.operation`, और `session.tool`: सदस्यता लिए गए
  सत्र के लिए ट्रांसक्रिप्ट, इन-फ्लाइट सत्र ऑपरेशन, और इवेंट-स्ट्रीम अपडेट।
- `sessions.changed`: सत्र इंडेक्स या मेटाडेटा बदला।
- `presence`: सिस्टम उपस्थिति स्नैपशॉट अपडेट।
- `tick`: आवधिक keepalive / liveness इवेंट।
- `health`: Gateway स्वास्थ्य स्नैपशॉट अपडेट।
- `heartbeat`: Heartbeat इवेंट स्ट्रीम अपडेट।
- `cron`: Cron रन/जॉब परिवर्तन इवेंट।
- `shutdown`: Gateway शटडाउन सूचना।
- `node.pair.requested` / `node.pair.resolved`: Node पेयरिंग lifecycle।
- `node.invoke.request`: Node इनवोक अनुरोध ब्रॉडकास्ट।
- `device.pair.requested` / `device.pair.resolved`: पेयर किए गए-डिवाइस lifecycle।
- `voicewake.changed`: वेक-वर्ड ट्रिगर कॉन्फ़िग बदला।
- `exec.approval.requested` / `exec.approval.resolved`: exec अनुमोदन
  lifecycle।
- `plugin.approval.requested` / `plugin.approval.resolved`: plugin अनुमोदन
  lifecycle।

### Node सहायक मेथड

- Nodes ऑटो-अलाउ जांचों के लिए कौशल निष्पादनयोग्य की वर्तमान सूची फ़ेच करने हेतु `skills.bins` कॉल कर सकते हैं।

### टास्क लेजर RPCs

ऑपरेटर क्लाइंट Gateway बैकग्राउंड टास्क रिकॉर्ड को टास्क लेजर RPCs के माध्यम से
जांच और रद्द कर सकते हैं। ये मेथड साफ़ किए गए टास्क सारांश लौटाते हैं, कच्ची
रनटाइम स्थिति नहीं।

- `tasks.list` के लिए `operator.read` आवश्यक है।
  - Params: वैकल्पिक `status` (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"`, या `"timed_out"`) या उन स्थितियों की array,
    वैकल्पिक `agentId`, वैकल्पिक `sessionKey`, वैकल्पिक `limit` `1` से
    `500` तक, और वैकल्पिक string `cursor`।
  - Result: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` के लिए `operator.read` आवश्यक है।
  - Params: `{ "taskId": string }`.
  - Result: `{ "task": TaskSummary }`.
  - गायब टास्क ids Gateway not-found error shape लौटाते हैं।
- `tasks.cancel` के लिए `operator.write` आवश्यक है।
  - Params: `{ "taskId": string, "reason"?: string }`.
  - Result:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` बताता है कि लेजर में मेल खाता टास्क था या नहीं। `cancelled`
    बताता है कि रनटाइम ने रद्दीकरण स्वीकार किया या रिकॉर्ड किया।

`TaskSummary` में `id`, `status`, और वैकल्पिक मेटाडेटा जैसे `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, टाइमस्टैम्प, प्रगति,
टर्मिनल सारांश, और साफ़ किया गया त्रुटि टेक्स्ट शामिल हैं। `agentId` टास्क
निष्पादित कर रहे एजेंट की पहचान करता है; `sessionKey` और `ownerKey` अनुरोधकर्ता और नियंत्रण
संदर्भ सुरक्षित रखते हैं।

### ऑपरेटर सहायक मेथड

- ऑपरेटर किसी एजेंट के लिए रनटाइम कमांड इन्वेंटरी लाने के लिए `commands.list` (`operator.read`) कॉल कर सकते हैं।
  - `agentId` वैकल्पिक है; डिफ़ॉल्ट एजेंट वर्कस्पेस पढ़ने के लिए इसे छोड़ दें।
  - `scope` नियंत्रित करता है कि प्राथमिक `name` किस सतह को लक्षित करता है:
    - `text` अग्रणी `/` के बिना प्राथमिक टेक्स्ट कमांड टोकन लौटाता है
    - `native` और डिफ़ॉल्ट `both` पाथ उपलब्ध होने पर प्रदाता-सचेत नेटिव नाम लौटाते हैं
  - `textAliases` `/model` और `/m` जैसे सटीक स्लैश उपनाम रखता है।
  - `nativeName` उपलब्ध होने पर प्रदाता-सचेत नेटिव कमांड नाम रखता है।
  - `provider` वैकल्पिक है और केवल नेटिव नामकरण और नेटिव Plugin कमांड उपलब्धता को प्रभावित करता है।
  - `includeArgs=false` प्रतिक्रिया से सीरियलाइज़ किए गए आर्ग्युमेंट मेटाडेटा को छोड़ देता है।
- ऑपरेटर किसी एजेंट के लिए रनटाइम टूल कैटलॉग लाने के लिए `tools.catalog` (`operator.read`) कॉल कर सकते हैं। प्रतिक्रिया में समूहित टूल और उत्पत्ति मेटाडेटा शामिल होता है:
  - `source`: `core` या `plugin`
  - `pluginId`: जब `source="plugin"` हो, तो plugin स्वामी
  - `optional`: कोई plugin टूल वैकल्पिक है या नहीं
- ऑपरेटर किसी सत्र के लिए रनटाइम-प्रभावी टूल इन्वेंटरी लाने के लिए `tools.effective` (`operator.read`) कॉल कर सकते हैं।
  - `sessionKey` आवश्यक है।
  - Gateway कॉलर द्वारा दिए गए ऑथ या डिलीवरी संदर्भ को स्वीकार करने के बजाय सत्र से सर्वर-साइड विश्वसनीय रनटाइम संदर्भ निकालता है।
  - प्रतिक्रिया सक्रिय इन्वेंटरी का सत्र-स्कोप वाला, सर्वर-व्युत्पन्न प्रोजेक्शन है, जिसमें core, plugin, channel, और पहले से खोजे गए MCP सर्वर टूल शामिल हैं।
  - `tools.effective` MCP के लिए रीड-ओनली है: यह अंतिम टूल नीति के माध्यम से गर्म सत्र MCP कैटलॉग को प्रोजेक्ट कर सकता है, लेकिन यह MCP रनटाइम नहीं बनाता, ट्रांसपोर्ट कनेक्ट नहीं करता, या `tools/list` जारी नहीं करता। यदि कोई मेल खाता गर्म कैटलॉग मौजूद नहीं है, तो प्रतिक्रिया में `mcp-not-yet-connected`, `mcp-not-yet-listed`, या `mcp-stale-catalog` जैसा नोटिस शामिल हो सकता है।
  - प्रभावी टूल प्रविष्टियां `source="core"`, `source="plugin"`, `source="channel"`, या `source="mcp"` का उपयोग करती हैं।
- ऑपरेटर `/tools/invoke` जैसे ही Gateway नीति पाथ के माध्यम से उपलब्ध टूल को invoke करने के लिए `tools.invoke` (`operator.write`) कॉल कर सकते हैं।
  - `name` आवश्यक है। `args`, `sessionKey`, `agentId`, `confirm`, और `idempotencyKey` वैकल्पिक हैं।
  - यदि `sessionKey` और `agentId` दोनों मौजूद हैं, तो resolved सत्र एजेंट को `agentId` से मेल खाना चाहिए।
  - `cron`, `gateway`, और `nodes` जैसे केवल-स्वामी core wrappers को स्वामी/admin पहचान (`operator.admin`) की आवश्यकता होती है, भले ही `tools.invoke` विधि स्वयं `operator.write` हो।
  - प्रतिक्रिया SDK-सामने वाला envelope है जिसमें `ok`, `toolName`, वैकल्पिक `output`, और typed `error` फ़ील्ड होते हैं। Approval या नीति अस्वीकृतियां Gateway टूल नीति पाइपलाइन को बायपास करने के बजाय payload में `ok:false` लौटाती हैं।
- ऑपरेटर किसी एजेंट के लिए दिखाई देने वाली skill इन्वेंटरी लाने के लिए `skills.status` (`operator.read`) कॉल कर सकते हैं।
  - `agentId` वैकल्पिक है; डिफ़ॉल्ट एजेंट वर्कस्पेस पढ़ने के लिए इसे छोड़ दें।
  - प्रतिक्रिया में eligibility, missing requirements, config checks, और sanitized install options शामिल होते हैं, बिना raw secret values उजागर किए।
- ऑपरेटर ClawHub discovery metadata के लिए `skills.search` और `skills.detail` (`operator.read`) कॉल कर सकते हैं।
- ऑपरेटर इंस्टॉल करने से पहले किसी निजी skill archive को stage करने के लिए `skills.upload.begin`, `skills.upload.chunk`, और `skills.upload.commit` (`operator.admin`) कॉल कर सकते हैं। यह trusted clients के लिए एक अलग admin upload path है, सामान्य ClawHub skill install flow नहीं, और डिफ़ॉल्ट रूप से disabled रहता है जब तक `skills.install.allowUploadedArchives` enabled न हो।
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    उस slug और force value से बंधा upload बनाता है।
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` सटीक decoded offset पर bytes जोड़ता है।
  - `skills.upload.commit({ uploadId, sha256? })` final size और SHA-256 सत्यापित करता है। Commit केवल upload को finalizes करता है; यह skill इंस्टॉल नहीं करता।
  - Uploaded skill archives ऐसे zip archives होते हैं जिनमें `SKILL.md` root होता है। archive का internal directory name कभी install target नहीं चुनता।
- ऑपरेटर तीन modes में `skills.install` (`operator.admin`) कॉल कर सकते हैं:
  - ClawHub mode: `{ source: "clawhub", slug, version?, force? }` डिफ़ॉल्ट एजेंट वर्कस्पेस `skills/` directory में skill folder इंस्टॉल करता है।
  - Upload mode: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    committed upload को डिफ़ॉल्ट एजेंट वर्कस्पेस `skills/<slug>`
    directory में इंस्टॉल करता है। slug और force value को मूल
    `skills.upload.begin` request से मेल खाना चाहिए। यह mode तब तक reject होता है जब तक
    `skills.install.allowUploadedArchives` enabled न हो। setting ClawHub installs को प्रभावित नहीं करती।
  - Gateway installer mode: `{ name, installId, timeoutMs? }`
    gateway host पर declared `metadata.openclaw.install` action चलाता है।
    पुराने clients अब भी `dangerouslyForceUnsafeInstall` भेज सकते हैं; यह field deprecated है, केवल protocol compatibility के लिए स्वीकार होती है, और ignored होती है। operator-owned install decisions के लिए
    `security.installPolicy` का उपयोग करें।
- ऑपरेटर दो modes में `skills.update` (`operator.admin`) कॉल कर सकते हैं:
  - ClawHub mode डिफ़ॉल्ट एजेंट वर्कस्पेस में एक tracked slug या सभी tracked ClawHub installs को update करता है।
  - Config mode `skills.entries.<skillKey>` values जैसे `enabled`, `apiKey`, और `env` को patch करता है।

### `models.list` views

`models.list` एक वैकल्पिक `view` parameter स्वीकार करता है:

- छोड़ा गया या `"default"`: वर्तमान रनटाइम व्यवहार। यदि `agents.defaults.models` configured है, तो प्रतिक्रिया allowed catalog होती है, जिसमें `provider/*` entries के लिए dynamically discovered models शामिल होते हैं। अन्यथा प्रतिक्रिया पूर्ण Gateway catalog होती है।
- `"configured"`: picker-sized व्यवहार। यदि `agents.defaults.models` configured है, तो वह फिर भी प्रभावी रहता है, जिसमें `provider/*` entries के लिए provider-scoped discovery शामिल होती है। allowlist के बिना, प्रतिक्रिया explicit `models.providers.*.models` entries का उपयोग करती है, और केवल तब full catalog पर fallback करती है जब कोई configured model rows मौजूद न हों।
- `"all"`: full Gateway catalog, `agents.defaults.models` को bypass करते हुए। इसका उपयोग diagnostics और discovery UIs के लिए करें, सामान्य model pickers के लिए नहीं।

## Exec approvals

- जब किसी exec request को approval चाहिए, तो gateway `exec.approval.requested` broadcast करता है।
- Operator clients `exec.approval.resolve` कॉल करके resolve करते हैं (`operator.approvals` scope आवश्यक है)।
- `host=node` के लिए, `exec.approval.request` में `systemRunPlan` (canonical `argv`/`cwd`/`rawCommand`/session metadata) शामिल होना चाहिए। `systemRunPlan` के बिना requests reject की जाती हैं।
- approval के बाद, forwarded `node.invoke system.run` calls उसी canonical
  `systemRunPlan` को authoritative command/cwd/session context के रूप में reuse करते हैं।
- यदि कोई caller prepare और final approved `system.run` forward के बीच `command`, `rawCommand`, `cwd`, `agentId`, या
  `sessionKey` mutate करता है, तो gateway mutated payload पर भरोसा करने के बजाय run reject कर देता है।

## Agent delivery fallback

- `agent` requests outbound delivery request करने के लिए `deliver=true` शामिल कर सकती हैं।
- `bestEffortDeliver=false` strict behavior बनाए रखता है: unresolved या internal-only delivery targets `INVALID_REQUEST` लौटाते हैं।
- `bestEffortDeliver=true` तब session-only execution पर fallback की अनुमति देता है जब कोई external deliverable route resolve नहीं हो पाता (उदाहरण के लिए internal/webchat sessions या ambiguous multi-channel configs)।
- अंतिम `agent` results में delivery requested होने पर `result.deliveryStatus` शामिल हो सकता है, जो [`openclaw agent --json --deliver`](/hi/cli/agent#json-delivery-status) के लिए documented वही `sent`, `suppressed`, `partial_failed`, और `failed` statuses उपयोग करता है।

## Versioning

- `PROTOCOL_VERSION` `packages/gateway-protocol/src/version.ts` में रहता है।
- Clients `minProtocol` + `maxProtocol` भेजते हैं; server उन ranges को reject करता है जिनमें उसका current protocol शामिल नहीं होता। Current clients और servers को protocol v4 चाहिए।
- Schemas + models TypeBox definitions से generated हैं:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Client constants

`src/gateway/client.ts` में reference client ये defaults उपयोग करता है। Values protocol v4 में stable हैं और third-party clients के लिए expected baseline हैं।

| Constant                                  | Default                                               | Source                                                                                     |
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
| Tick-timeout close                        | code `4000` when silence exceeds `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Server effective `policy.tickIntervalMs`, `policy.maxPayload`,
और `policy.maxBufferedBytes` को `hello-ok` में advertise करता है; clients को pre-handshake defaults के बजाय उन values का सम्मान करना चाहिए।

## Auth

- Shared-secret Gateway auth कॉन्फ़िगर किए गए auth mode के आधार पर `connect.params.auth.token` या
  `connect.params.auth.password` का उपयोग करता है।
- Tailscale Serve जैसे पहचान-वहन करने वाले mode
  (`gateway.auth.allowTailscale: true`) या non-loopback
  `gateway.auth.mode: "trusted-proxy"` `connect.params.auth.*` के बजाय
  request headers से connect auth check को संतुष्ट करते हैं।
- Private-ingress `gateway.auth.mode: "none"` shared-secret connect auth को
  पूरी तरह छोड़ देता है; इस mode को public/untrusted ingress पर expose न करें।
- pairing के बाद, Gateway connection
  role + scopes तक सीमित **डिवाइस टोकन** जारी करता है। यह
  `hello-ok.auth.deviceToken` में लौटाया जाता है और future connects के लिए
  client द्वारा persist किया जाना चाहिए।
- Clients को किसी भी सफल connect के बाद primary `hello-ok.auth.deviceToken`
  persist करना चाहिए।
- उस **stored** device token से reconnect करने पर उस token के लिए stored
  approved scope set भी reuse होना चाहिए। इससे पहले से granted read/probe/status access
  सुरक्षित रहता है और reconnects चुपचाप narrower implicit admin-only scope तक
  collapse होने से बचते हैं।
- Client-side connect auth assembly (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` स्वतंत्र है और set होने पर हमेशा forward किया जाता है।
  - `auth.token` priority order में populate होता है: पहले explicit shared token,
    फिर explicit `deviceToken`, फिर stored per-device token (`deviceId` + `role`
    से keyed)।
  - `auth.bootstrapToken` केवल तब भेजा जाता है जब ऊपर में से किसी ने भी
    `auth.token` resolve न किया हो। Shared token या कोई भी resolved device token
    इसे suppress करता है।
  - one-shot `AUTH_TOKEN_MISMATCH` retry पर stored device token का auto-promotion
    **केवल trusted endpoints** तक gated है —
    loopback, या pinned `tlsFingerprint` के साथ `wss://`। Pinning के बिना
    public `wss://` qualify नहीं करता।
- Built-in setup-code bootstrap primary नोड
  `hello-ok.auth.deviceToken` और trusted mobile handoff के लिए
  `hello-ok.auth.deviceTokens` में bounded operator token लौटाता है। Operator token
  native Talk configuration reads के लिए `operator.talk.secrets` शामिल करता है और
  `operator.admin` तथा `operator.pairing` को exclude करता है।
- जब non-baseline setup-code bootstrap approval की प्रतीक्षा कर रहा हो, `PAIRING_REQUIRED`
  details में `recommendedNextStep: "wait_then_retry"`, `retryable: true`,
  और `pauseReconnect: false` शामिल होते हैं। Clients को request approve होने या
  token invalid होने तक उसी bootstrap token से reconnect करते रहना चाहिए।
- `hello-ok.auth.deviceTokens` केवल तब persist करें जब connect ने
  `wss://` या loopback/local pairing जैसे trusted transport पर bootstrap auth का उपयोग किया हो।
- यदि client **explicit** `deviceToken` या explicit `scopes` देता है, तो वह
  caller-requested scope set authoritative रहता है; cached scopes केवल तब
  reuse होते हैं जब client stored per-device token reuse कर रहा हो।
- Device tokens को `device.token.rotate` और
  `device.token.revoke` के ज़रिए rotate/revoke किया जा सकता है (`operator.pairing` scope आवश्यक)। नोड या
  अन्य non-operator role को rotate या revoke करने के लिए `operator.admin` भी आवश्यक है।
- `device.token.rotate` rotation metadata लौटाता है। यह replacement
  bearer token केवल same-device calls के लिए echo करता है जो पहले से
  उसी device token से authenticated हों, ताकि token-only clients reconnect करने से पहले
  अपना replacement persist कर सकें। Shared/admin rotations bearer token echo नहीं करते।
- Token issuance, rotation, और revocation उस approved role set तक bounded रहते हैं
  जो उस device की pairing entry में recorded है; token mutation किसी device role को
  expand या target नहीं कर सकता जिसे pairing approval ने कभी grant न किया हो।
- Paired-device token sessions के लिए, device management self-scoped होता है जब तक
  caller के पास `operator.admin` भी न हो: non-admin callers केवल अपनी **own**
  device entry के operator token को manage कर सकते हैं। Node और अन्य non-operator
  token management admin-only है, caller के अपने device के लिए भी।
- `device.token.rotate` और `device.token.revoke` target operator
  token scope set को caller के current session scopes के विरुद्ध भी check करते हैं। Non-admin callers
  अपने पास मौजूद scope से broader operator token को rotate या revoke नहीं कर सकते।
- Auth failures में `error.details.code` और recovery hints शामिल होते हैं:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` के लिए client behavior:
  - Trusted clients cached per-device token के साथ एक bounded retry attempt कर सकते हैं।
  - यदि वह retry fail हो जाए, clients को automatic reconnect loops रोकने चाहिए और operator action guidance दिखानी चाहिए।
- `AUTH_SCOPE_MISMATCH` का अर्थ है कि device token पहचाना गया था लेकिन requested
  role/scopes को cover नहीं करता। Clients को इसे bad token के रूप में present नहीं करना चाहिए;
  operator को re-pair करने या narrower/broader scope contract approve करने के लिए prompt करें।

## Device identity + pairing

- Nodes को keypair fingerprint से derived stable device identity (`device.id`)
  शामिल करनी चाहिए।
- Gateways device + role के अनुसार tokens issue करते हैं।
- नए device IDs के लिए pairing approvals आवश्यक हैं, जब तक local auto-approval
  enabled न हो।
- Pairing auto-approval direct local loopback connects पर केंद्रित है।
- OpenClaw में trusted shared-secret helper flows के लिए एक narrow backend/container-local
  self-connect path भी है।
- Same-host tailnet या LAN connects अभी भी pairing के लिए remote माने जाते हैं और
  approval की आवश्यकता होती है।
- WS clients सामान्यतः `connect` के दौरान `device` identity शामिल करते हैं (operator +
  node)। केवल device-less operator exceptions explicit trust paths हैं:
  - localhost-only insecure HTTP compatibility के लिए `gateway.controlUi.allowInsecureAuth=true`।
  - successful `gateway.auth.mode: "trusted-proxy"` operator Control UI auth।
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, गंभीर security downgrade)।
  - reserved internal helper path पर direct-loopback `gateway-client` backend RPCs।
- Device identity omit करने के scope consequences होते हैं। जब device-less operator
  connection explicit trust path से allow होता है, OpenClaw फिर भी
  self-declared scopes को empty set में clear करता है, जब तक उस path के पास named
  scope-preservation exception न हो। Scope-gated methods तब
  `missing scope` के साथ fail होते हैं।
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` एक Control UI
  break-glass scope-preservation path है। यह arbitrary custom backend या CLI-shaped
  WebSocket clients को scopes grant नहीं करता।
- Reserved direct-loopback `gateway-client` backend helper path
  केवल internal local control-plane RPCs के लिए scopes preserve करता है; custom backend IDs को
  यह exception नहीं मिलता।
- सभी connections को server-provided `connect.challenge` nonce sign करना होगा।

### Device auth migration diagnostics

Legacy clients के लिए जो अब भी pre-challenge signing behavior उपयोग करते हैं, `connect` अब
stable `error.details.reason` के साथ `error.details.code` के अंतर्गत
`DEVICE_AUTH_*` detail codes लौटाता है।

Common migration failures:

| Message                     | details.code                     | details.reason           | अर्थ                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client ने `device.nonce` omit किया (या blank भेजा)। |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client ने stale/wrong nonce से sign किया।          |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Signature payload v2 payload से match नहीं करता।   |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Signed timestamp allowed skew से बाहर है।          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` public key fingerprint से match नहीं करता। |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Public key format/canonicalization fail हुआ।       |

Migration target:

- हमेशा `connect.challenge` की प्रतीक्षा करें।
- Server nonce शामिल करने वाले v2 payload को sign करें।
- वही nonce `connect.params.device.nonce` में भेजें।
- Preferred signature payload `v3` है, जो device/client/role/scopes/token/nonce fields के अलावा
  `platform` और `deviceFamily` को bind करता है।
- Legacy `v2` signatures compatibility के लिए accepted रहते हैं, लेकिन paired-device
  metadata pinning reconnect पर command policy को अभी भी control करता है।

## TLS + pinning

- WS connections के लिए TLS supported है।
- Clients वैकल्पिक रूप से gateway cert fingerprint pin कर सकते हैं (`gateway.tls`
  config और `gateway.remote.tlsFingerprint` या CLI `--tls-fingerprint` देखें)।

## Scope

यह protocol **full gateway API** expose करता है (status, channels, models, chat,
agent, sessions, nodes, approvals, आदि)। Exact surface
`packages/gateway-protocol/src/schema.ts` में TypeBox schemas द्वारा defined है।

## संबंधित

- [Bridge protocol](/hi/gateway/bridge-protocol)
- [Gateway runbook](/hi/gateway)
