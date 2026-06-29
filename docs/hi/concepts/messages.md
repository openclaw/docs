---
read_when:
    - यह समझाना कि इनबाउंड संदेश जवाब कैसे बनते हैं
    - सत्रों, कतारबद्ध करने के मोड, या स्ट्रीमिंग व्यवहार को स्पष्ट करना
    - रीज़निंग दृश्यता और उपयोग संबंधी निहितार्थों का दस्तावेज़ीकरण
summary: संदेश प्रवाह, सत्र, कतारबद्धता, और तर्क की दृश्यता
title: संदेश
x-i18n:
    generated_at: "2026-06-28T22:59:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5585ae95fc65cb64240e4bf5d0bbe2eb54f55461b9fa4ee331d4d703d62e76f
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw इनबाउंड संदेशों को सेशन समाधान, क्यूइंग, स्ट्रीमिंग, टूल निष्पादन, और रीजनिंग दृश्यता की पाइपलाइन के ज़रिए संभालता है। यह पेज इनबाउंड संदेश से जवाब तक का पथ दिखाता है।

## संदेश प्रवाह (उच्च स्तर)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

मुख्य नियंत्रण कॉन्फ़िगरेशन में होते हैं:

- `messages.*` प्रीफ़िक्स, क्यूइंग, और समूह व्यवहार के लिए।
- `agents.defaults.*` ब्लॉक स्ट्रीमिंग और चंकिंग डिफ़ॉल्ट्स के लिए।
- चैनल ओवरराइड (`channels.whatsapp.*`, `channels.telegram.*`, आदि) कैप्स और स्ट्रीमिंग टॉगल के लिए।

पूरे स्कीमा के लिए [कॉन्फ़िगरेशन](/hi/gateway/configuration) देखें।

## इनबाउंड डीडुप्लीकेशन

रीकनेक्ट के बाद चैनल वही संदेश दोबारा डिलीवर कर सकते हैं। OpenClaw चैनल/अकाउंट/पीयर/सेशन/मैसेज id से keyed एक कम अवधि वाला कैश रखता है ताकि डुप्लिकेट डिलीवरी कोई दूसरा एजेंट रन शुरू न करें।

## इनबाउंड डिबाउंसिंग

**उसी भेजने वाले** से तेज़ी से आए लगातार संदेशों को `messages.inbound` के ज़रिए एक ही एजेंट टर्न में बैच किया जा सकता है। डिबाउंसिंग प्रति चैनल + बातचीत के दायरे में होती है और reply threading/IDs के लिए सबसे हालिया संदेश का उपयोग करती है।

कॉन्फ़िगरेशन (ग्लोबल डिफ़ॉल्ट + प्रति-चैनल ओवरराइड):

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

नोट्स:

- डिबाउंस केवल **टेक्स्ट-ओनली** संदेशों पर लागू होता है; मीडिया/अटैचमेंट तुरंत फ्लश हो जाते हैं।
- कंट्रोल कमांड डिबाउंसिंग को बायपास करते हैं ताकि वे अलग रहें। जो चैनल same-sender DM coalescing में स्पष्ट रूप से opt in करते हैं, वे DM कमांड को debounce window के अंदर रख सकते हैं ताकि split-send payload उसी एजेंट टर्न में जुड़ सके।

## सेशन और डिवाइस

सेशन Gateway के स्वामित्व में होते हैं, क्लाइंट के नहीं।

- डायरेक्ट चैट एजेंट मुख्य सेशन key में सिमट जाते हैं।
- समूह/चैनल को अपनी सेशन keys मिलती हैं।
- सेशन store और transcripts Gateway host पर रहते हैं।

कई डिवाइस/चैनल एक ही सेशन पर मैप हो सकते हैं, लेकिन history हर क्लाइंट पर पूरी तरह सिंक नहीं होती। सुझाव: लंबे संवादों के लिए एक primary device का उपयोग करें ताकि context अलग-अलग न हो। Control UI और TUI हमेशा Gateway-backed session transcript दिखाते हैं, इसलिए वे source of truth हैं।

विवरण: [सेशन प्रबंधन](/hi/concepts/session)।

## टूल परिणाम metadata

टूल परिणाम `content` मॉडल-दृश्य परिणाम है। टूल परिणाम `details` UI rendering, diagnostics, media delivery, और Plugins के लिए runtime metadata है।

OpenClaw इस सीमा को स्पष्ट रखता है:

- `toolResult.details` को provider replay और compaction input से पहले हटा दिया जाता है।
- Persisted session transcripts केवल bounded `details` रखते हैं; बहुत बड़े metadata को `persistedDetailsTruncated: true` चिह्नित compact summary से बदल दिया जाता है।
- Plugins और tools को वह text जिसे model को पढ़ना चाहिए `content` में रखना चाहिए, केवल `details` में नहीं।

## इनबाउंड bodies और history context

OpenClaw **prompt body** को **command body** से अलग करता है:

- `BodyForAgent`: वर्तमान संदेश के लिए primary model-facing text। चैनल Plugins को इसे भेजने वाले के वर्तमान prompt-bearing text पर केंद्रित रखना चाहिए।
- `Body`: legacy prompt fallback। इसमें channel envelopes और optional history wrappers शामिल हो सकते हैं, लेकिन current channels को `BodyForAgent` उपलब्ध होने पर primary model input के रूप में इस पर निर्भर नहीं रहना चाहिए।
- `CommandBody`: directive/command parsing के लिए raw user text।
- `RawBody`: `CommandBody` का legacy alias (compatibility के लिए रखा गया)।

जब कोई चैनल history देता है, तो वह shared wrapper का उपयोग करता है:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

**non-direct chats** (groups/channels/rooms) के लिए, **current message body** में sender label prefix किया जाता है (history entries के लिए इस्तेमाल होने वाली same style)। इससे real-time और queued/history messages एजेंट prompt में consistent रहते हैं।

History buffers **pending-only** होते हैं: इनमें वे group messages शामिल होते हैं जिन्होंने run trigger _नहीं_ किया (उदाहरण के लिए, mention-gated messages) और session transcript में पहले से मौजूद messages **exclude** होते हैं।

Directive stripping केवल **current message** section पर लागू होती है ताकि history intact रहे। History wrap करने वाले channels को `CommandBody` (या `RawBody`) को original message text पर set करना चाहिए और `Body` को combined prompt के रूप में रखना चाहिए। Structured history, reply, forwarded, और channel metadata prompt assembly के दौरान user-role untrusted context blocks के रूप में render किए जाते हैं।
History buffers `messages.groupChat.historyLimit` (global default) और per-channel overrides जैसे `channels.slack.historyLimit` या `channels.telegram.accounts.<id>.historyLimit` (`0` set करने पर disable) के ज़रिए configurable हैं।

## क्यूइंग और followups

अगर कोई run पहले से active है, तो inbound messages default रूप से current run में steer किए जाते हैं। `messages.queue` चुनता है कि active-run messages steer हों, बाद के लिए queue हों, एक later turn में collect हों, या active run को interrupt करें।

- `messages.queue` (और `messages.queue.byChannel`) के ज़रिए configure करें।
- Default mode `steer` है, Codex steering batches और followup/collect queues के लिए 500ms debounce के साथ।
- Modes: `steer`, `followup`, `collect`, और `interrupt`।

विवरण: [Command queue](/hi/concepts/queue) और [Steering queue](/hi/concepts/queue-steering)।

## चैनल run ownership

चैनल Plugins session queue में message enter होने से पहले ordering preserve कर सकते हैं, input debounce कर सकते हैं, और transport backpressure apply कर सकते हैं। उन्हें agent turn के चारों ओर अलग timeout impose नहीं करना चाहिए। जब message किसी session पर route हो जाता है, तो long-running work session, tool, और runtime lifecycle से governed होता है ताकि सभी channels slow turns को consistently report और recover करें।

## स्ट्रीमिंग, चंकिंग, और बैचिंग

Block streaming partial replies भेजती है जैसे-जैसे model text blocks produce करता है।
Chunking channel text limits का सम्मान करती है और fenced code को split करने से बचती है।

मुख्य settings:

- `agents.defaults.blockStreamingDefault` (`on|off`, default off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (idle-based batching)
- `agents.defaults.humanDelay` (block replies के बीच human-like pause)
- चैनल overrides: `*.blockStreaming` और `*.blockStreamingCoalesce` (non-Telegram channels को explicit `*.blockStreaming: true` चाहिए)

विवरण: [स्ट्रीमिंग + चंकिंग](/hi/concepts/streaming)।

## रीजनिंग दृश्यता और tokens

OpenClaw model reasoning को expose या hide कर सकता है:

- `/reasoning on|off|stream` दृश्यता नियंत्रित करता है।
- Reasoning content, model द्वारा produce होने पर, token usage में फिर भी count होता है।
- Telegram transient draft bubble में reasoning stream support करता है जिसे final delivery के बाद delete कर दिया जाता है; persistent reasoning output के लिए `/reasoning on` का उपयोग करें।

विवरण: [Thinking + reasoning directives](/hi/tools/thinking) और [Token use](/hi/reference/token-use)।

## प्रीफ़िक्स, threading, और replies

Outbound message formatting `messages` में centralized है:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix`, और `channels.<channel>.accounts.<id>.responsePrefix` (outbound prefix cascade), साथ ही `channels.whatsapp.messagePrefix` (WhatsApp inbound prefix)
- `replyToMode` और per-channel defaults के ज़रिए reply threading

विवरण: [कॉन्फ़िगरेशन](/hi/gateway/config-agents#messages) और channel docs।

## silent replies

सटीक silent token `NO_REPLY` / `no_reply` का अर्थ है "user-visible reply deliver न करें"।
जब किसी turn में pending tool media भी हो, जैसे generated TTS audio, OpenClaw silent text को strip करता है लेकिन media attachment फिर भी deliver करता है।
OpenClaw इस behavior को conversation type के आधार पर resolve करता है:

- Direct conversations को कभी `NO_REPLY` prompt guidance नहीं मिलती। अगर कोई direct run गलती से bare silent token return करता है, तो OpenClaw उसे rewrite या deliver करने के बजाय suppress करता है।
- Groups/channels default रूप से केवल automatic group replies के लिए silence allow करते हैं। `message_tool` visible-reply mode में, silence का अर्थ है कि model `message(action=send)` call नहीं करता।
- Internal orchestration default रूप से silence allow करता है।

OpenClaw non-direct chats में generic internal runner failures के लिए भी silent replies का उपयोग करता है, ताकि groups/channels को gateway error boilerplate न दिखे।
Missing auth, rate-limit, या overload notices जैसी user-facing recovery copy वाली classified failures फिर भी deliver की जा सकती हैं। Direct chats default रूप से compact failure copy दिखाते हैं; raw runner details केवल `/verbose full` enabled होने पर दिखते हैं।

Defaults `agents.defaults.silentReply` के अंतर्गत रहते हैं; `surfaces.<id>.silentReply` प्रति surface group/internal policy को override कर सकता है।

Bare silent replies सभी surfaces पर drop कर दी जाती हैं, ताकि parent sessions fallback chatter में sentinel text rewrite करने के बजाय शांत रहें।

## संबंधित

- [Message lifecycle refactor](/hi/concepts/message-lifecycle-refactor) - टिकाऊ send और receive design का लक्ष्य
- [स्ट्रीमिंग](/hi/concepts/streaming) — real-time message delivery
- [Retry](/hi/concepts/retry) — message delivery retry behavior
- [Queue](/hi/concepts/queue) — message processing queue
- [Channels](/hi/channels) — messaging platform integrations
