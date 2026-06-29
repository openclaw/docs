---
read_when:
    - Node क्लाइंट बनाना या डीबग करना (iOS/Android/macOS Node मोड)
    - पेयरिंग या ब्रिज प्रमाणीकरण विफलताओं की जांच करना
    - Gateway द्वारा उजागर की गई Node सतह का ऑडिट करना
summary: 'ऐतिहासिक ब्रिज प्रोटोकॉल (लेगेसी नोड्स): TCP JSONL, पेयरिंग, स्कोप्ड RPC'
title: ब्रिज प्रोटोकॉल
x-i18n:
    generated_at: "2026-06-28T23:05:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 485d18f94b731018c6e0df493068b0b6aceff9afba6bebf1350db63c04cee98c
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
TCP ब्रिज **हटा दिया गया है**। मौजूदा OpenClaw बिल्ड ब्रिज listener शिप नहीं करते और `bridge.*` config keys अब schema में नहीं हैं। यह पेज केवल ऐतिहासिक संदर्भ के लिए रखा गया है। सभी node/operator clients के लिए [Gateway Protocol](/hi/gateway/protocol) का उपयोग करें।
</Warning>

## यह क्यों मौजूद था

- **सुरक्षा सीमा**: ब्रिज पूरे gateway API surface के बजाय एक छोटी allowlist उजागर करता है।
- **Pairing + नोड पहचान**: नोड admission gateway के स्वामित्व में होता है और per-node token से जुड़ा होता है।
- **Discovery UX**: नोड LAN पर Bonjour के जरिए gateway खोज सकते हैं, या सीधे tailnet पर connect कर सकते हैं।
- **Loopback WS**: पूरा WS control plane SSH के जरिए tunnel किए जाने तक local रहता है।

## Transport

- TCP, प्रति लाइन एक JSON object (JSONL)।
- वैकल्पिक TLS (जब `bridge.tls.enabled` true हो)।
- ऐतिहासिक default listener port `18790` था (मौजूदा बिल्ड TCP ब्रिज शुरू नहीं करते)।

जब TLS enabled होता है, discovery TXT records में non-secret hint के रूप में `bridgeTls=1` और `bridgeTlsSha256` शामिल होते हैं। ध्यान दें कि Bonjour/mDNS TXT records unauthenticated होते हैं; clients को विज्ञापित fingerprint को explicit user intent या अन्य out-of-band verification के बिना authoritative pin नहीं मानना चाहिए।

## Handshake + pairing

1. Client node metadata + token (यदि पहले से paired है) के साथ `hello` भेजता है।
2. यदि paired नहीं है, तो gateway `error` (`NOT_PAIRED`/`UNAUTHORIZED`) लौटाता है।
3. Client `pair-request` भेजता है।
4. Gateway approval की प्रतीक्षा करता है, फिर `pair-ok` और `hello-ok` भेजता है।

ऐतिहासिक रूप से, `hello-ok` `serverName` लौटाता था; hosted Plugin surfaces अब `pluginSurfaceUrls` के जरिए advertised होते हैं। Canvas/A2UI `pluginSurfaceUrls.canvas` का उपयोग करता है; deprecated `canvasHostUrl` alias refactored protocol का हिस्सा नहीं है।

## Frames

Client → Gateway:

- `req` / `res`: scoped gateway RPC (chat, sessions, config, health, voicewake, skills.bins)
- `event`: node signals (voice transcript, agent request, chat subscribe, exec lifecycle)

Gateway → Client:

- `invoke` / `invoke-res`: node commands (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: subscribed sessions के लिए chat updates
- `ping` / `pong`: keepalive

Legacy allowlist enforcement `src/gateway/server-bridge.ts` में था (हटा दिया गया)।

## Exec lifecycle events

Nodes पूरी हो चुकी `system.run` activity दिखाने के लिए `exec.finished` events emit कर सकते हैं। इन्हें gateway में system events में map किया जाता है। (Legacy nodes अब भी `exec.started` emit कर सकते हैं।)
Nodes denied `system.run` attempts के लिए `exec.denied` emit कर सकते हैं; gateway event को terminal denial के रूप में स्वीकार करता है और system event enqueue नहीं करता या agent work को wake नहीं करता।

Payload fields (जब तक उल्लेख न हो, सभी optional):

- `sessionKey` (required): event correlation के लिए और, `exec.finished` के लिए, system event delivery के लिए agent session।
- `runId`: grouping के लिए unique exec id।
- `command`: raw या formatted command string।
- `exitCode`, `timedOut`, `success`, `output`: completion details (केवल finished)।
- `reason`: denial reason (केवल denied)।

## Historical tailnet usage

- ब्रिज को tailnet IP से bind करें: `~/.openclaw/openclaw.json` में `bridge.bind: "tailnet"` (केवल ऐतिहासिक; `bridge.*` अब valid नहीं है)।
- Clients MagicDNS name या tailnet IP के जरिए connect करते हैं।
- Bonjour networks के पार नहीं जाता; आवश्यकता होने पर manual host/port या wide-area DNS-SD का उपयोग करें।

## Versioning

ब्रिज **implicit v1** था (कोई min/max negotiation नहीं)। यह section केवल ऐतिहासिक संदर्भ है; मौजूदा node/operator clients WebSocket [Gateway Protocol](/hi/gateway/protocol) का उपयोग करते हैं।

## संबंधित

- [Gateway protocol](/hi/gateway/protocol)
- [Nodes](/hi/nodes)
