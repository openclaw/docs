---
read_when:
    - चैनलों पर स्ट्रीमिंग या चंकिंग कैसे काम करती है, इसकी व्याख्या करना
    - ब्लॉक स्ट्रीमिंग या चैनल चंकिंग व्यवहार बदलना
    - डुप्लिकेट/प्रारंभिक ब्लॉक जवाबों या चैनल प्रीव्यू स्ट्रीमिंग की डिबगिंग
summary: स्ट्रीमिंग + चंकिंग व्यवहार (ब्लॉक उत्तर, चैनल पूर्वावलोकन स्ट्रीमिंग, मोड मैपिंग)
title: स्ट्रीमिंग और खंडों में विभाजन
x-i18n:
    generated_at: "2026-06-28T23:03:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6667e95a1ed89e6bd8990a1b8784edb73885c59c7a3905eabc14184270efcfe1
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw में दो अलग-अलग streaming परतें हैं:

- **Block streaming (channels):** assistant के लिखते समय पूर्ण **blocks** emit करें। ये सामान्य channel messages हैं (token deltas नहीं)।
- **Preview streaming (Telegram/Discord/Slack):** generate करते समय एक अस्थायी **preview message** update करें।

आज channel messages में **वास्तविक token-delta streaming नहीं** है। Preview streaming message-based है (send + edits/appends).

## Block streaming (channel messages)

Block streaming assistant output को उपलब्ध होते ही मोटे chunks में भेजती है।

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

Legend:

- `text_delta/events`: model stream events (non-streaming models के लिए sparse हो सकते हैं)।
- `chunker`: `EmbeddedBlockChunker` min/max bounds + break preference लागू करता है।
- `channel send`: वास्तविक outbound messages (block replies)।

**Controls:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (default off)।
- Channel overrides: `*.blockStreaming` (और per-account variants) प्रति channel `"on"`/`"off"` force करने के लिए।
- `agents.defaults.blockStreamingBreak`: `"text_end"` या `"message_end"`।
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`।
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (send से पहले streamed blocks merge करें)।
- Channel hard cap: `*.textChunkLimit` (जैसे, `channels.whatsapp.textChunkLimit`)।
- Channel chunk mode: `*.chunkMode` (`length` default, `newline` length chunking से पहले blank lines (paragraph boundaries) पर split करता है)।
- Discord soft cap: `channels.discord.maxLinesPerMessage` (default 17) UI clipping से बचने के लिए लंबे replies split करता है।

**Boundary semantics:**

- `text_end`: chunker के emit करते ही blocks stream करें; हर `text_end` पर flush करें।
- `message_end`: assistant message खत्म होने तक प्रतीक्षा करें, फिर buffered output flush करें।

यदि buffered text `maxChars` से अधिक है, तो `message_end` अभी भी chunker का उपयोग करता है, इसलिए यह अंत में कई chunks emit कर सकता है।

### Block streaming के साथ media delivery

Streaming media को `mediaUrl` या
`mediaUrls` जैसे structured payload fields का उपयोग करना चाहिए; streamed text को attachment command के रूप में parse नहीं किया जाता। जब block
streaming media जल्दी भेजती है, OpenClaw उस turn के लिए delivery याद रखता है। यदि
final assistant payload वही media URL दोहराता है, तो final delivery
attachment फिर से भेजने के बजाय duplicate media हटा देती है।

बिल्कुल duplicate final payloads suppress किए जाते हैं। यदि final payload पहले से streamed media के आसपास
अलग text जोड़ता है, तो OpenClaw media को single-delivery रखते हुए
नया text फिर भी भेजता है। इससे Telegram जैसे channels पर duplicate voice
notes या files रुकती हैं।

## Chunking algorithm (low/high bounds)

Block chunking `EmbeddedBlockChunker` द्वारा implement की जाती है:

- **Low bound:** buffer >= `minChars` होने तक emit न करें (जब तक forced न हो)।
- **High bound:** `maxChars` से पहले splits prefer करें; यदि forced हो, तो `maxChars` पर split करें।
- **Break preference:** `paragraph` → `newline` → `sentence` → `whitespace` → hard break।
- **Code fences:** fences के अंदर कभी split न करें; `maxChars` पर forced होने पर, Markdown valid रखने के लिए fence close + reopen करें।

`maxChars` को channel `textChunkLimit` तक clamp किया जाता है, इसलिए आप per-channel caps से अधिक नहीं जा सकते।

## Coalescing (streamed blocks merge करना)

जब block streaming enabled होती है, OpenClaw consecutive block chunks को send करने से पहले **merge** कर सकता है। इससे "single-line spam" कम होता है, फिर भी
progressive output मिलता रहता है।

- Coalescing flush करने से पहले **idle gaps** (`idleMs`) की प्रतीक्षा करती है।
- Buffers `maxChars` से capped होते हैं और उससे अधिक होने पर flush होंगे।
- `minChars` tiny fragments को पर्याप्त text जमा होने तक send होने से रोकता है
  (final flush हमेशा बचा हुआ text भेजता है)।
- Joiner `blockStreamingChunk.breakPreference` से derive होता है
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → space)।
- Channel overrides `*.blockStreamingCoalesce` के जरिए उपलब्ध हैं (per-account configs सहित)।
- Default coalesce `minChars` Signal/Slack/Discord के लिए 1500 तक bump होता है, जब तक override न किया गया हो।

## Blocks के बीच human-like pacing

जब block streaming enabled होती है, तो आप block replies के बीच (पहले block के बाद) **randomized pause** जोड़ सकते हैं। इससे multi-bubble responses अधिक natural लगते हैं।

- Config: `agents.defaults.humanDelay` (प्रति agent `agents.list[].humanDelay` के जरिए override करें)।
- Modes: `off` (default), `natural` (800-2500ms), `custom` (`minMs`/`maxMs`)।
- केवल **block replies** पर लागू होता है, final replies या tool summaries पर नहीं।

## "Stream chunks or everything"

यह इनसे map होता है:

- **Stream chunks:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (जैसे-जैसे output आए emit करें)। Non-Telegram channels को `*.blockStreaming: true` भी चाहिए।
- **Stream everything at end:** `blockStreamingBreak: "message_end"` (एक बार flush करें, बहुत लंबा हो तो संभवतः कई chunks)।
- **No block streaming:** `blockStreamingDefault: "off"` (केवल final reply)।

**Channel note:** Block streaming **off रहती है जब तक**
`*.blockStreaming` को स्पष्ट रूप से `true` पर set न किया जाए। Channels block replies के बिना live preview
(`channels.<channel>.streaming`) stream कर सकते हैं।

Config location reminder: `blockStreaming*` defaults
`agents.defaults` के अंतर्गत रहते हैं, root config में नहीं।

## Preview streaming modes

Canonical key: `channels.<channel>.streaming`

Modes:

- `off`: preview streaming disable करें।
- `partial`: single preview जिसे latest text से replace किया जाता है।
- `block`: chunked/appended steps में preview updates।
- `progress`: generation के दौरान progress/status preview, completion पर final answer।

`streaming.mode: "block"` Discord और Telegram जैसे edit-capable channels के लिए एक preview-streaming mode है। यह वहाँ channel block delivery enable नहीं करता।
जब आपको normal block replies चाहिए हों, तो `streaming.block.enabled` या legacy `blockStreaming` channel key का उपयोग करें। Microsoft Teams exception है: इसमें
draft-preview block transport नहीं है, इसलिए `streaming.mode: "block"` native partial/progress streaming के बजाय Teams block
delivery पर map होता है।

### Channel mapping

| Channel    | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | editable progress draft |
| Discord    | ✅    | ✅        | ✅      | editable progress draft |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | native progress stream  |

केवल Slack:

- `channels.slack.streaming.nativeTransport` Slack native streaming API calls को toggle करता है जब `channels.slack.streaming.mode="partial"` (default: `true`) हो।
- Slack native streaming और Slack assistant thread status के लिए reply thread target चाहिए। Top-level DMs वह thread-style preview नहीं दिखाते, लेकिन वे अभी भी Slack draft preview posts और edits का उपयोग कर सकते हैं।

Legacy key migration:

- Telegram: legacy `streamMode` और scalar/boolean `streaming` values detect की जाती हैं और doctor/config compatibility paths द्वारा `streaming.mode` में migrate की जाती हैं।
- Discord: `streamMode` + boolean `streaming`, `streaming` enum के runtime aliases बने रहते हैं; persisted config rewrite करने के लिए `openclaw doctor --fix` चलाएँ।
- Slack: `streamMode`, `streaming.mode` का runtime alias बना रहता है; boolean `streaming`, `streaming.mode` plus `streaming.nativeTransport` का runtime alias बना रहता है; legacy `nativeStreaming`, `streaming.nativeTransport` का runtime alias बना रहता है। persisted config rewrite करने के लिए `openclaw doctor --fix` चलाएँ।

### Runtime behavior

Telegram:

- DMs और group/topics में `sendMessage` + `editMessageText` preview updates का उपयोग करता है।
- Short initial previews अभी भी push-notification UX के लिए debounced होते हैं, लेकिन Telegram अब उन्हें bounded delay के बाद materialize करता है ताकि active runs visually silent न रहें।
- Final text active preview को place में edit करता है; long finals पहले chunk के लिए उस message को reuse करते हैं और केवल बाकी chunks भेजते हैं।
- `block` mode preview को `streaming.preview.chunk.maxChars` (default 800, Telegram की 4096 edit limit तक capped) पर new message में rotate करता है; अन्य modes एक preview को 4096 characters तक grow करते हैं।
- `progress` mode tool progress को editable status draft में रखता है, answer streaming active हो लेकिन अभी कोई tool line उपलब्ध न हो तो status label materialize करता है, completion पर वह draft clear करता है, और final answer normal delivery के जरिए भेजता है।
- यदि completed text confirm होने से पहले final edit fail हो जाए, तो OpenClaw normal final delivery का उपयोग करता है और stale preview clean up करता है।
- Telegram block streaming explicit रूप से enabled होने पर Preview streaming skipped होती है (double-streaming से बचने के लिए)।
- `/reasoning stream` reasoning को transient preview में लिख सकता है जिसे final delivery के बाद delete किया जाता है।

Discord:

- Send + edit preview messages का उपयोग करता है।
- `block` mode draft chunking (`draftChunk`) का उपयोग करता है।
- Discord block streaming explicit रूप से enabled होने पर Preview streaming skipped होती है।
- Final media, error, और explicit-reply payloads pending previews को new draft flush किए बिना cancel करते हैं, फिर normal delivery का उपयोग करते हैं।

Slack:

- `partial` उपलब्ध होने पर Slack native streaming (`chat.startStream`/`append`/`stop`) का उपयोग कर सकता है।
- `block` append-style draft previews का उपयोग करता है।
- `progress` status preview text का उपयोग करता है, फिर final answer।
- Reply thread के बिना top-level DMs Slack native streaming के बजाय draft preview posts और edits का उपयोग करते हैं।
- Native और draft preview streaming उस turn के लिए block replies suppress करते हैं, ताकि Slack reply केवल एक delivery path से stream हो।
- Final media/error payloads और progress finals throwaway draft messages नहीं बनाते; केवल text/block finals जो preview edit कर सकते हैं, pending draft text flush करते हैं।

Mattermost:

- Thinking, tool activity, और partial reply text को single draft preview post में stream करता है, जो final answer send करने के लिए safe होने पर place में finalize होता है।
- यदि preview post delete हो गया था या finalize time पर otherwise unavailable है, तो fresh final post भेजने पर fallback करता है।
- Final media/error payloads normal delivery से पहले pending preview updates cancel करते हैं, temporary preview post flush नहीं करते।

Matrix:

- जब final text preview event reuse कर सकता है, तो Draft previews place में finalize होते हैं।
- Media-only, error, और reply-target-mismatch finals normal delivery से पहले pending preview updates cancel करते हैं; already-visible stale preview redact किया जाता है।

### Tool-progress preview updates

Preview streaming में **tool-progress** updates भी शामिल हो सकते हैं - "searching the web", "reading file", या "calling tool" जैसी short status lines - जो tools चलने के दौरान final reply से पहले उसी preview message में दिखाई देती हैं। Codex app-server mode में, Codex preamble/commentary messages इसी preview path का उपयोग करते हैं, इसलिए short "I am checking..." progress notes editable draft में stream हो सकते हैं, final answer का हिस्सा बने बिना। इससे multi-step tool turns पहले thinking preview और final answer के बीच silent रहने के बजाय visually alive रहते हैं।

Long-running tools return करने से पहले typed progress emit कर सकते हैं। उदाहरण के लिए,
`web_fetch` शुरू होने पर five-second timer arm करता है: यदि fetch अभी भी
pending है, तो preview `Fetching page content...` दिखा सकता है; यदि fetch उससे पहले finish
या cancel हो जाता है, तो कोई progress line emit नहीं होती। बाद वाला final tool
result अभी भी model को normal रूप से delivered होता है।

Supported surfaces:

- पूर्वावलोकन स्ट्रीमिंग सक्रिय होने पर **Discord**, **Slack**, **Telegram**, और **Matrix** डिफ़ॉल्ट रूप से टूल-प्रगति और Codex प्रस्तावना अपडेट को लाइव पूर्वावलोकन संपादन में स्ट्रीम करते हैं। Microsoft Teams व्यक्तिगत चैट में अपनी नेटिव प्रगति स्ट्रीम का उपयोग करता है।
- Telegram में `v2026.4.22` से टूल-प्रगति पूर्वावलोकन अपडेट सक्षम होकर शिप हुए हैं; उन्हें सक्षम रखना उस जारी किए गए व्यवहार को संरक्षित करता है।
- **Mattermost** पहले से ही टूल गतिविधि को अपनी एकल ड्राफ्ट पूर्वावलोकन पोस्ट में समेटता है (ऊपर देखें)।
- टूल-प्रगति संपादन सक्रिय पूर्वावलोकन स्ट्रीमिंग मोड का पालन करते हैं; जब पूर्वावलोकन स्ट्रीमिंग `off` हो या जब ब्लॉक स्ट्रीमिंग ने संदेश को अपने नियंत्रण में ले लिया हो, तो उन्हें छोड़ दिया जाता है। Telegram पर, `streaming.mode: "off"` केवल-अंतिम है: सामान्य प्रगति बातचीत को स्टैंडअलोन स्थिति संदेशों के रूप में भेजने के बजाय दबा दिया जाता है, जबकि अनुमोदन प्रॉम्प्ट, मीडिया पेलोड, और त्रुटियां अभी भी सामान्य रूप से रूट होती हैं।
- पूर्वावलोकन स्ट्रीमिंग बनाए रखने लेकिन टूल-प्रगति पंक्तियां छिपाने के लिए, उस चैनल के लिए `streaming.preview.toolProgress` को `false` पर सेट करें। कमांड/exec टेक्स्ट छिपाते हुए टूल-प्रगति पंक्तियां दृश्यमान रखने के लिए, `streaming.preview.commandText` को `"status"` या `streaming.progress.commandText` को `"status"` पर सेट करें; जारी किए गए व्यवहार को संरक्षित करने के लिए डिफ़ॉल्ट `"raw"` है। यह नीति उन ड्राफ्ट/प्रगति चैनलों द्वारा साझा की जाती है जो OpenClaw के कॉम्पैक्ट प्रगति रेंडरर का उपयोग करते हैं, जिनमें Discord, Matrix, Microsoft Teams, Mattermost, Slack ड्राफ्ट पूर्वावलोकन, और Telegram शामिल हैं। पूर्वावलोकन संपादन पूरी तरह अक्षम करने के लिए, `streaming.mode` को `off` पर सेट करें।
- Telegram चयनित उद्धरण उत्तर एक अपवाद हैं: जब `replyToMode` `"off"` नहीं है और चयनित उद्धरण टेक्स्ट मौजूद है, तो OpenClaw उस टर्न के लिए उत्तर पूर्वावलोकन स्ट्रीम छोड़ देता है ताकि टूल-प्रगति पूर्वावलोकन पंक्तियां रेंडर न हो सकें। चयनित उद्धरण टेक्स्ट के बिना वर्तमान-संदेश उत्तर अभी भी पूर्वावलोकन स्ट्रीमिंग बनाए रखते हैं। विवरण के लिए [Telegram चैनल दस्तावेज़](/hi/channels/telegram) देखें।

प्रगति पंक्तियां दृश्यमान रखें लेकिन कच्चा कमांड/exec टेक्स्ट छिपाएं:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

उसी आकार का उपयोग किसी अन्य कॉम्पैक्ट प्रगति चैनल कुंजी के अंतर्गत करें, उदाहरण के लिए `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost`, या Slack ड्राफ्ट पूर्वावलोकन। प्रगति-ड्राफ्ट मोड के लिए, वही नीति `streaming.progress` के अंतर्गत रखें:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

## संबंधित

- [संदेश जीवनचक्र रिफैक्टर](/hi/concepts/message-lifecycle-refactor) - साझा पूर्वावलोकन, संपादन, स्ट्रीम, और अंतिमकरण डिज़ाइन को लक्षित करें
- [प्रगति ड्राफ्ट](/hi/concepts/progress-drafts) - दृश्यमान कार्य-प्रगति संदेश जो लंबे टर्न के दौरान अपडेट होते हैं
- [संदेश](/hi/concepts/messages) - संदेश जीवनचक्र और डिलीवरी
- [पुनः प्रयास](/hi/concepts/retry) - डिलीवरी विफलता पर पुनः प्रयास व्यवहार
- [चैनल](/hi/channels) - प्रति-चैनल स्ट्रीमिंग समर्थन
