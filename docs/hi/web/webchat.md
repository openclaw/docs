---
read_when:
    - WebChat पहुँच को डीबग या कॉन्फ़िगर करना
summary: चैट UI के लिए Loopback WebChat स्टैटिक होस्ट और Gateway WS उपयोग
title: वेब चैट
x-i18n:
    generated_at: "2026-06-29T00:27:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 108dd98f975a2d2e980921bd0f486c3683c18ba6eb37111163af87929a9d7973
    source_path: web/webchat.md
    workflow: 16
---

स्थिति: macOS/iOS SwiftUI चैट UI सीधे Gateway WebSocket से बात करता है।

## यह क्या है

- Gateway के लिए एक नेटिव चैट UI (कोई एम्बेडेड ब्राउज़र और कोई स्थानीय स्थैतिक सर्वर नहीं)।
- अन्य चैनलों जैसे ही सत्र और रूटिंग नियमों का उपयोग करता है।
- निर्धारक रूटिंग: उत्तर हमेशा WebChat पर वापस जाते हैं।

## त्वरित शुरुआत

1. Gateway शुरू करें।
2. WebChat UI (macOS/iOS ऐप) या Control UI चैट टैब खोलें।
3. सुनिश्चित करें कि एक वैध Gateway प्रमाणीकरण पथ कॉन्फ़िगर है (डिफ़ॉल्ट रूप से shared-secret,
   loopback पर भी)।

## यह कैसे काम करता है (व्यवहार)

- UI Gateway WebSocket से कनेक्ट होता है और `chat.history`, `chat.send`, और `chat.inject` का उपयोग करता है।
- स्थिरता के लिए `chat.history` सीमित है: Gateway लंबे टेक्स्ट फ़ील्ड काट सकता है, भारी मेटाडेटा छोड़ सकता है, और बहुत बड़ी प्रविष्टियों को `[chat.history omitted: message too large]` से बदल सकता है।
- जब `chat.history` में कोई दृश्यमान assistant संदेश काट दिया गया हो, तो Control UI एक साइड रीडर खोल सकता है और डिफ़ॉल्ट इतिहास पेलोड बढ़ाए बिना `chat.message.get` के ज़रिए मांग पर पूरी डिस्प्ले-सामान्यीकृत प्रविष्टि ला सकता है।
- आधुनिक केवल-जोड़ने वाली सत्र फ़ाइलों के लिए `chat.history` सक्रिय ट्रांसक्रिप्ट शाखा का पालन करता है, इसलिए छोड़ी गई rewrite शाखाएँ और प्रतिस्थापित prompt प्रतियाँ WebChat में रेंडर नहीं होतीं।
- Compaction प्रविष्टियाँ स्पष्ट संकुचित-इतिहास विभाजक के रूप में रेंडर होती हैं। विभाजक समझाता है कि संकुचित ट्रांसक्रिप्ट checkpoint के रूप में संरक्षित है और Sessions checkpoint नियंत्रणों से लिंक करता है, जहाँ ऑपरेटर अपनी अनुमतियाँ होने पर उस संकुचित दृश्य से शाखा बना सकते हैं या restore कर सकते हैं।
- Control UI `chat.history` द्वारा लौटाए गए आधारभूत Gateway `sessionId` को याद रखता है और उसे आगे की `chat.send` कॉलों में शामिल करता है, इसलिए reconnect और पेज refresh वही संग्रहीत बातचीत जारी रखते हैं, जब तक कि उपयोगकर्ता कोई सत्र शुरू या reset न करे।
- Control UI नई `chat.send` run id बनाने से पहले उसी सत्र, संदेश, और attachments के लिए डुप्लिकेट in-flight submits को coalesce करता है; Gateway अब भी उसी idempotency key का दोबारा उपयोग करने वाले दोहराए गए अनुरोधों को dedupe करता है।
- Workspace startup फ़ाइलें और लंबित `BOOTSTRAP.md` निर्देश agent system prompt के Project Context के ज़रिए दिए जाते हैं, WebChat उपयोगकर्ता संदेश में कॉपी नहीं किए जाते। Bootstrap truncation केवल संक्षिप्त system-prompt recovery notice जोड़ता है; विस्तृत counts और config knobs diagnostic surfaces पर रहते हैं।
- `chat.history` भी display-normalized है: runtime-only OpenClaw context,
  inbound envelope wrappers, inline delivery directive tags
  जैसे `[[reply_to_*]]` और `[[audio_as_voice]]`, plain-text tool-call XML
  payloads (जिसमें `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, और काटे गए tool-call blocks शामिल हैं), और
  लीक हुए ASCII/full-width model control tokens दृश्यमान टेक्स्ट से हटा दिए जाते हैं,
  और ऐसी assistant प्रविष्टियाँ जिनका पूरा दृश्यमान टेक्स्ट केवल exact silent
  token `NO_REPLY` / `no_reply` होता है, छोड़ दी जाती हैं।
- Reasoning-flagged reply payloads (`isReasoning: true`) WebChat assistant content, transcript replay text, और audio content blocks से बाहर रखे जाते हैं, इसलिए केवल-सोच वाले payloads दृश्यमान assistant संदेशों या चलाए जा सकने वाले audio के रूप में सतह पर नहीं आते।
- `chat.inject` transcript में सीधे एक assistant note जोड़ता है और उसे UI पर broadcast करता है (कोई agent run नहीं)।
- रोके गए runs UI में partial assistant output दृश्यमान रख सकते हैं।
- buffered output मौजूद होने पर Gateway रोके गए partial assistant text को transcript history में persist करता है, और उन प्रविष्टियों को abort metadata से चिह्नित करता है।
- History हमेशा Gateway से fetch की जाती है (कोई स्थानीय फ़ाइल watching नहीं)।
- यदि Gateway पहुँच योग्य नहीं है, तो WebChat read-only होता है।

### Transcript और delivery model

WebChat में दो अलग-अलग data paths हैं:

- session JSONL फ़ाइल durable model/runtime transcript है। सामान्य agent runs के लिए, embedded OpenClaw runtime अपने session manager के ज़रिए model-visible `user`, `assistant`, और `toolResult` संदेशों को persist करता है। WebChat उस transcript में मनमाना delivery, status, या helper text नहीं लिखता।
- Gateway `ReplyPayload` events live delivery projection हैं। उन्हें WebChat/channel display, block streaming, directive tags, media embedding, TTS/audio flags, और UI fallback behavior के लिए normalize किया जा सकता है। वे स्वयं canonical session log नहीं हैं।
- जिन harnesses को `tools.message` के ज़रिए दृश्यमान replies चाहिए, वे अब भी WebChat को current-run internal source reply sink के रूप में उपयोग करते हैं। उस सक्रिय WebChat run से targetless `message.send` उसी चैट में project होता है और session transcript में mirror होता है; WebChat reusable outbound channel नहीं बनता और कभी `lastChannel` inherit नहीं करता।
- WebChat assistant transcript entries केवल तब inject करता है जब Gateway सामान्य embedded agent turn के बाहर displayed message का मालिक हो: `chat.inject`, non-agent command replies, aborted partial output, और WebChat-managed media transcript supplements।
- `chat.history` stored session transcript पढ़ता है और WebChat display projection लागू करता है। यदि किसी run के दौरान live assistant text दिखाई देता है लेकिन history reload के बाद गायब हो जाता है, तो पहले जाँचें कि raw JSONL में assistant text है या नहीं, फिर कि `chat.history` projection ने उसे stripped किया या नहीं, फिर कि Control UI optimistic-tail merge ने local delivery state को persisted snapshot से बदल दिया या नहीं।
- `chat.message.get` `chat.history` जैसे ही transcript branch और display projection rules का उपयोग करता है, जिसमें active-agent scoping शामिल है, लेकिन `messageId` द्वारा एक transcript entry को target करता है और जब पूरा content अब लौटाया नहीं जा सकता, तो ईमानदार unavailable reason लौटाता है।

सामान्य agent-run final answers durable होने चाहिए क्योंकि embedded runtime assistant `message_end` लिखता है। delivered final payload को transcript में mirror करने वाले किसी भी fallback को पहले ऐसे assistant turn को duplicate करने से बचना होगा जिसे embedded runtime पहले ही लिख चुका है।

## Control UI agents tools panel

- Control UI `/agents` Tools panel में दो अलग-अलग views हैं:
  - **अभी उपलब्ध** `tools.effective(sessionKey=...)` का उपयोग करता है और current session inventory का server-derived
    read-only projection दिखाता है, जिसमें core, Plugin, channel-owned,
    और पहले से खोजे गए MCP server tools शामिल हैं।
  - **Tool Configuration** `tools.catalog` का उपयोग करता है और profiles, overrides, और
    catalog semantics पर केंद्रित रहता है।
- Runtime availability session-scoped है। उसी agent पर sessions बदलने से
  **अभी उपलब्ध** सूची बदल सकती है। यदि configured MCP servers connect नहीं हुए हैं या
  last discovery के बाद बदले गए हैं, तो panel read path से चुपचाप MCP transports
  शुरू करने के बजाय notice दिखाता है।
- config editor runtime availability का संकेत नहीं देता; effective access अब भी policy
  precedence (`allow`/`deny`, per-agent और provider/channel overrides) का पालन करता है।

## दूरस्थ उपयोग

- Remote mode Gateway WebSocket को SSH/Tailscale पर tunnel करता है।
- आपको अलग WebChat server चलाने की आवश्यकता नहीं है।

## Configuration reference (WebChat)

पूरी configuration: [Configuration](/hi/gateway/configuration)

WebChat में कोई persisted config section नहीं है। Gateway built-in `chat.history` display limit का उपयोग करता है; API clients किसी एक `chat.history` call के लिए उसे override करने हेतु per-request `maxChars` भेज सकते हैं। Legacy `channels.webchat` और `gateway.webchat` config retire हो चुका है; इसे हटाने के लिए `openclaw doctor --fix` चलाएँ।

संबंधित global options:

- `gateway.port`, `gateway.bind`: WebSocket host/port।
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  shared-secret WebSocket auth।
- `gateway.auth.allowTailscale`: सक्षम होने पर browser Control UI chat tab Tailscale
  Serve identity headers का उपयोग कर सकता है।
- `gateway.auth.mode: "trusted-proxy"`: identity-aware **non-loopback** proxy source के पीछे browser clients के लिए reverse-proxy auth ([Trusted Proxy Auth](/hi/gateway/trusted-proxy-auth) देखें)।
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: remote Gateway target।
- `session.*`: session storage और main key defaults।

## संबंधित

- [Control UI](/hi/web/control-ui)
- [Dashboard](/hi/web/dashboard)
