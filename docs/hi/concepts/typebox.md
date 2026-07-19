---
read_when:
    - प्रोटोकॉल स्कीमा या कोड जनरेशन को अपडेट करना
summary: Gateway प्रोटोकॉल के लिए सत्य के एकमात्र स्रोत के रूप में TypeBox स्कीमा
title: TypeBox
x-i18n:
    generated_at: "2026-07-19T08:32:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 24490edf0d73e918f834e9dd53d09ba0e5183b2bc126ee981a94f8099e76283b
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox एक TypeScript-प्रथम स्कीमा लाइब्रेरी है। OpenClaw इसका उपयोग **Gateway WebSocket प्रोटोकॉल** (हैंडशेक, अनुरोध/प्रतिक्रिया, सर्वर इवेंट) को परिभाषित करने के लिए करता है। वे स्कीमा **रनटाइम सत्यापन** (AJV), **JSON Schema निर्यात**, और macOS ऐप के लिए **Swift कोड जनरेशन** संचालित करते हैं। सत्य का एक स्रोत है; बाकी सब कुछ जनरेट किया जाता है।

उच्च-स्तरीय प्रोटोकॉल संदर्भ के लिए, [Gateway आर्किटेक्चर](/hi/concepts/architecture) से शुरू करें।

## मानसिक मॉडल (30 सेकंड)

हर Gateway WS संदेश तीन फ़्रेमों में से एक होता है:

- **अनुरोध**: `{ type: "req", id, method, params }`
- **प्रतिक्रिया**: `{ type: "res", id, ok, payload | error }`
- **इवेंट**: `{ type: "event", event, payload, seq?, stateVersion? }`

पहला फ़्रेम **अनिवार्य रूप से** एक `connect` अनुरोध होना चाहिए। उसके बाद, क्लाइंट विधियों को कॉल करते हैं (जैसे `health`, `send`, `chat.send`) और इवेंट की सदस्यता लेते हैं (जैसे `presence`, `tick`, `agent`)।

कनेक्शन प्रवाह (न्यूनतम):

```text
क्लाइंट                   Gateway
  |---- अनुरोध:connect ------>|
  |<---- प्रतिक्रिया:hello-ok -|
  |<---- इवेंट:tick ----------|
  |---- अनुरोध:health -------->|
  |<---- प्रतिक्रिया:health ---|
```

सामान्य विधियाँ और इवेंट:

| श्रेणी     | उदाहरण                                                    | टिप्पणियाँ                                          |
| ---------- | ---------------------------------------------------------- | --------------------------------------------------- |
| मूल        | `connect`, `health`, `status`                              | `connect` पहले होना चाहिए                          |
| संदेश सेवा | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | दुष्प्रभाव वाली विधियों को `idempotencyKey` चाहिए |
| चैट        | `chat.history`, `chat.send`, `chat.abort`                  | WebChat इनका उपयोग करता है                         |
| सत्र       | `sessions.list`, `sessions.patch`, `sessions.delete`       | सत्र प्रशासन                                        |
| स्वचालन    | `wake`, `cron.list`, `cron.run`, `cron.runs`               | वेक और Cron नियंत्रण                                |
| Node       | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS और Node क्रियाएँ                         |
| इवेंट      | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | सर्वर पुश                                           |

प्रामाणिक रूप से विज्ञापित **डिस्कवरी** सूची `src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`) में रहती है।

## स्कीमा कहाँ रहते हैं

- स्रोत बैरल: `packages/gateway-protocol/src/schema.ts`, `packages/gateway-protocol/src/schema/*.ts` के अंतर्गत डोमेन मॉड्यूल को पुनः निर्यात करता है (शीर्ष-स्तरीय एनवेलप और हैंडशेक के लिए `frames.ts`, तथा प्रत्येक सुविधा क्षेत्र के लिए `agent.ts`, `sessions.ts`, `cron.ts` आदि)। `protocol-schemas.ts` केंद्रीय `ProtocolSchemas` रजिस्ट्री है, जो स्कीमा नामों को उनकी TypeBox परिभाषाओं से मैप करती है।
- रनटाइम सत्यापक (AJV): `packages/gateway-protocol/src/index.ts`
- विज्ञापित सुविधा/डिस्कवरी रजिस्ट्री: `src/gateway/server-methods-list.ts`
- सर्वर हैंडशेक और विधि डिस्पैच: `src/gateway/server.impl.ts`
- Node क्लाइंट: `src/gateway/client.ts`
- जनरेट किया गया JSON Schema: `dist/protocol.schema.json` (बिल्ड आउटपुट, कमिट नहीं किया गया)
- जनरेट किए गए Swift मॉडल: `apps/shared/OpenClawKit/Sources/OpenClawProtocol/GatewayModels.swift`

## वर्तमान पाइपलाइन

- `pnpm protocol:gen`, JSON Schema (draft-07) को `dist/protocol.schema.json` में लिखता है।
- `pnpm protocol:gen:swift`, Swift Gateway मॉडल जनरेट करता है।
- `pnpm protocol:check`, दोनों जनरेटर चलाता है और सत्यापित करता है कि Swift आउटपुट कमिट किया गया है (JSON Schema आउटपुट gitignore किया गया बिल्ड आर्टिफ़ैक्ट है)।

## रनटाइम पर स्कीमा का उपयोग कैसे होता है

- **सर्वर पक्ष**: हर इनबाउंड फ़्रेम को AJV से सत्यापित किया जाता है। हैंडशेक केवल ऐसा `connect` अनुरोध स्वीकार करता है, जिसके पैरामीटर `ConnectParams` से मेल खाते हों।
- **क्लाइंट पक्ष**: JS क्लाइंट इवेंट और प्रतिक्रिया फ़्रेमों का उपयोग करने से पहले उन्हें सत्यापित करता है।
- **सुविधा डिस्कवरी**: Gateway, `hello-ok` में `listGatewayMethods()` और `GATEWAY_EVENTS` से एक सीमित `features.methods` और `features.events` सूची भेजता है।
- वह डिस्कवरी सूची `coreGatewayHandlers` के हर कॉल-योग्य सहायक का जनरेट किया हुआ डंप नहीं है; कुछ सहायक RPC, विज्ञापित सुविधा सूची में गिनाए बिना `src/gateway/server-methods/*.ts` में कार्यान्वित किए गए हैं।

## उदाहरण फ़्रेम

कनेक्ट (पहला संदेश):

```json
{
  "type": "req",
  "id": "c1",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 4,
    "client": {
      "id": "openclaw-macos",
      "displayName": "macos",
      "version": "1.0.0",
      "platform": "macos 15.1",
      "mode": "ui",
      "instanceId": "A1B2"
    }
  }
}
```

Hello-ok प्रतिक्रिया:

```json
{
  "type": "res",
  "id": "c1",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 4,
    "server": { "version": "dev", "connId": "ws-1" },
    "features": { "methods": ["health"], "events": ["tick"] },
    "snapshot": {
      "presence": [],
      "health": {},
      "stateVersion": { "presence": 0, "health": 0 },
      "uptimeMs": 0
    },
    "auth": { "role": "operator", "scopes": ["operator.read"] },
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

अनुरोध और प्रतिक्रिया:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

इवेंट:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## न्यूनतम क्लाइंट (Node.js)

सबसे छोटा उपयोगी प्रवाह: कनेक्ट + स्वास्थ्य जाँच।

```ts
import { WebSocket } from "ws";

const ws = new WebSocket("ws://127.0.0.1:18789");

ws.on("open", () => {
  ws.send(
    JSON.stringify({
      type: "req",
      id: "c1",
      method: "connect",
      params: {
        minProtocol: 4,
        maxProtocol: 4,
        client: {
          id: "cli",
          displayName: "example",
          version: "dev",
          platform: "node",
          mode: "cli",
        },
      },
    }),
  );
});

ws.on("message", (data) => {
  const msg = JSON.parse(String(data));
  if (msg.type === "res" && msg.id === "c1" && msg.ok) {
    ws.send(JSON.stringify({ type: "req", id: "h1", method: "health" }));
  }
  if (msg.type === "res" && msg.id === "h1") {
    console.log("health:", msg.payload);
    ws.close();
  }
});
```

## व्यावहारिक उदाहरण: किसी विधि को शुरू से अंत तक जोड़ना

उदाहरण: एक नया `system.echo` अनुरोध जोड़ें, जो `{ ok: true, text }` लौटाता है।

1. **स्कीमा (सत्य का स्रोत)**

`packages/gateway-protocol/src/schema/system.ts` (या सबसे निकट मेल खाने वाले सुविधा मॉड्यूल) में जोड़ें:

```ts
export const SystemEchoParamsSchema = Type.Object(
  { text: NonEmptyString },
  { additionalProperties: false },
);

export const SystemEchoResultSchema = Type.Object(
  { ok: Type.Boolean(), text: NonEmptyString },
  { additionalProperties: false },
);
```

दोनों को `packages/gateway-protocol/src/schema/protocol-schemas.ts` में आयात करें, उन्हें `ProtocolSchemas` रजिस्ट्री में जोड़ें, और व्युत्पन्न प्रकार निर्यात करें:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **सत्यापन**

`packages/gateway-protocol/src/index.ts` में, एक AJV सत्यापक निर्यात करें:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **सर्वर व्यवहार**

`src/gateway/server-methods/system.ts` में एक हैंडलर जोड़ें:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

इसे `src/gateway/server-methods.ts` में पंजीकृत करें (यह पहले से `systemHandlers` को मर्ज करता है), फिर `src/gateway/server-methods-list.ts` में `listGatewayMethods` इनपुट में `"system.echo"` जोड़ें।

यदि विधि को ऑपरेटर या Node क्लाइंट कॉल कर सकते हैं, तो इसे `src/gateway/method-scopes.ts` में भी वर्गीकृत करें, ताकि स्कोप प्रवर्तन और `hello-ok` सुविधा विज्ञापन समन्वित रहें।

4. **पुनः जनरेट करें**

```bash
pnpm protocol:check
```

5. **परीक्षण और दस्तावेज़**

`src/gateway/server.*.test.ts` में एक सर्वर परीक्षण जोड़ें और दस्तावेज़ों में विधि का उल्लेख करें।

## Swift कोड जनरेशन का व्यवहार

Swift जनरेटर निम्नलिखित उत्सर्जित करता है:

- `req`, `res`, `event`, और `unknown` केस वाला एक `GatewayFrame` enum
- दृढ़ता से टाइप किए गए पेलोड struct/enum
- `ErrorCode` मान, `GATEWAY_PROTOCOL_VERSION`, और `GATEWAY_MIN_PROTOCOL_VERSION`

फ़ॉरवर्ड संगतता के लिए अज्ञात फ़्रेम प्रकारों को रॉ पेलोड के रूप में सुरक्षित रखा जाता है।

## संस्करण निर्धारण और संगतता

- `PROTOCOL_VERSION`, `packages/gateway-protocol/src/version.ts` में रहता है (वर्तमान मान: `4`)।
- क्लाइंट `minProtocol` और `maxProtocol` भेजते हैं; सर्वर उन सीमाओं को अस्वीकार करता है जिनमें उसका वर्तमान प्रोटोकॉल शामिल नहीं है।
- पुराने क्लाइंट को टूटने से बचाने के लिए Swift मॉडल अज्ञात फ़्रेम प्रकारों को सुरक्षित रखते हैं।

## स्कीमा पैटर्न और परंपराएँ

- अधिकांश ऑब्जेक्ट सख़्त पेलोड के लिए `additionalProperties: false` का उपयोग करते हैं।
- `NonEmptyString` (`Type.String({ minLength: 1 })`), ID और विधि/इवेंट नामों के लिए डिफ़ॉल्ट है।
- शीर्ष-स्तरीय `GatewayFrame`, `type` पर एक **डिस्क्रिमिनेटर** का उपयोग करता है।
- दुष्प्रभाव वाली विधियों को सामान्यतः पैरामीटर में एक `idempotencyKey` की आवश्यकता होती है (उदाहरण: `send`, `poll`, `agent`, `chat.send`)।
- `agent`, रनटाइम द्वारा जनरेट किए गए ऑर्केस्ट्रेशन संदर्भ के लिए वैकल्पिक `internalEvents` स्वीकार करता है (उदाहरण के लिए सबएजेंट/Cron कार्य पूर्ण होने का हैंडऑफ़); इसे आंतरिक API सतह मानें।

## लाइव स्कीमा JSON

जनरेट किया गया JSON Schema एक बिल्ड आर्टिफ़ैक्ट है, रिपॉज़िटरी में कमिट नहीं किया जाता। प्रकाशित रॉ फ़ाइल सामान्यतः यहाँ उपलब्ध होती है:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## स्कीमा बदलते समय

1. स्वामी `packages/gateway-protocol/src/schema/*.ts` मॉड्यूल में TypeBox स्कीमा अपडेट करें और उन्हें `protocol-schemas.ts` में पंजीकृत करें।
2. विधि/इवेंट को `src/gateway/server-methods-list.ts` में पंजीकृत करें।
3. जब नए RPC को ऑपरेटर या Node स्कोप वर्गीकरण की आवश्यकता हो, तब `src/gateway/method-scopes.ts` अपडेट करें।
4. `pnpm protocol:check` चलाएँ।
5. पुनः जनरेट किए गए Swift मॉडल कमिट करें।

## संबंधित

- [रिच आउटपुट प्रोटोकॉल](/hi/reference/rich-output-protocol)
- [RPC अडैप्टर](/hi/reference/rpc)
