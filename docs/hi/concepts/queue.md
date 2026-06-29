---
read_when:
    - स्वतः-उत्तर निष्पादन या concurrency बदलना
    - /queue मोड या संदेश निर्देशन व्यवहार समझाना
summary: ऑटो-रिप्लाई कतार मोड, डिफ़ॉल्ट, और प्रति-सत्र ओवरराइड
title: कमांड कतार
x-i18n:
    generated_at: "2026-06-28T23:02:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e518b018a85ddbc7afa3925180cc2329eb1d249316d81907ba51cfb3c692375
    source_path: concepts/queue.md
    workflow: 16
---

हम इनबाउंड स्वचालित-उत्तर रन (सभी चैनल) को एक छोटी इन-प्रोसेस कतार के माध्यम से क्रमबद्ध करते हैं, ताकि कई एजेंट रन आपस में टकराएँ नहीं, जबकि सत्रों के बीच सुरक्षित समानांतरता फिर भी बनी रहे।

## क्यों

- स्वचालित-उत्तर रन महंगे हो सकते हैं (LLM कॉल) और जब कई इनबाउंड संदेश पास-पास आते हैं तो वे टकरा सकते हैं।
- क्रमबद्ध करने से साझा संसाधनों (सत्र फ़ाइलें, लॉग, CLI stdin) के लिए प्रतिस्पर्धा से बचा जाता है और अपस्ट्रीम रेट लिमिट की संभावना कम होती है।

## यह कैसे काम करता है

- एक लेन-सचेत FIFO कतार प्रत्येक लेन को कॉन्फ़िगर करने योग्य concurrency सीमा के साथ खाली करती है (अकॉन्फ़िगर लेन के लिए डिफ़ॉल्ट 1; main डिफ़ॉल्ट 4, subagent 8)।
- `runEmbeddedAgent` **सत्र कुंजी** (लेन `session:<key>`) के आधार पर कतार में डालता है, ताकि प्रति सत्र केवल एक सक्रिय रन की गारंटी रहे।
- फिर प्रत्येक सत्र रन को एक **वैश्विक लेन** (डिफ़ॉल्ट रूप से `main`) में कतारबद्ध किया जाता है, ताकि कुल समानांतरता `agents.defaults.maxConcurrent` से सीमित रहे।
- जब verbose logging सक्षम होती है, कतारबद्ध रन शुरू होने से पहले ~2s से अधिक प्रतीक्षा करने पर एक छोटा नोटिस उत्सर्जित करते हैं।
- टाइपिंग संकेतक enqueue होते ही तुरंत सक्रिय हो जाते हैं (जब चैनल द्वारा समर्थित हों), इसलिए अपनी बारी का इंतज़ार करते समय उपयोगकर्ता अनुभव अपरिवर्तित रहता है।

## डिफ़ॉल्ट

सेट न होने पर, सभी इनबाउंड चैनल सतहें इसका उपयोग करती हैं:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

Same-turn steering डिफ़ॉल्ट है। बीच रन में आने वाला prompt सक्रिय runtime में inject किया जाता है जब रन steering स्वीकार कर सकता है, इसलिए दूसरा सत्र रन शुरू नहीं होता। अगर सक्रिय रन steering स्वीकार नहीं कर सकता, तो OpenClaw prompt शुरू करने से पहले सक्रिय रन के समाप्त होने की प्रतीक्षा करता है।

## कतार मोड

`/queue` यह नियंत्रित करता है कि जब किसी सत्र में पहले से सक्रिय रन हो तो सामान्य इनबाउंड संदेश क्या करें:

- `steer`: संदेशों को सक्रिय runtime में inject करें। OpenClaw सभी लंबित steering संदेशों को **मौजूदा assistant turn के tool calls निष्पादित कर लेने के बाद**, अगले LLM call से पहले डिलीवर करता है; Codex app-server को एक batched `turn/steer` मिलता है। अगर रन सक्रिय रूप से streaming नहीं कर रहा है या steering उपलब्ध नहीं है, तो OpenClaw prompt शुरू करने से पहले सक्रिय रन समाप्त होने तक प्रतीक्षा करता है।
- `followup`: steer न करें। मौजूदा रन समाप्त होने के बाद प्रत्येक संदेश को बाद के agent turn के लिए enqueue करें।
- `collect`: steer न करें। quiet window के बाद कतारबद्ध संदेशों को एक **एकल** followup turn में coalesce करें। अगर संदेश अलग-अलग चैनल/thread को target करते हैं, तो routing सुरक्षित रखने के लिए वे अलग-अलग drain होते हैं।
- `interrupt`: उस सत्र के सक्रिय रन को abort करें, फिर सबसे नया संदेश चलाएँ।

Runtime-विशिष्ट timing और dependency व्यवहार के लिए,
[Steering कतार](/hi/concepts/queue-steering) देखें। स्पष्ट `/steer <message>`
command के लिए, [Steer](/hi/tools/steer) देखें।

`messages.queue` के माध्यम से globally या प्रति चैनल configure करें:

```json5
{
  messages: {
    queue: {
      mode: "steer",
      debounceMs: 500,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## कतार विकल्प

विकल्प कतारबद्ध delivery पर लागू होते हैं। `debounceMs`, `steer` mode में Codex steering quiet window भी सेट करता है:

- `debounceMs`: कतारबद्ध followups या collect batches को drain करने से पहले quiet window; Codex `steer` mode में, batched `turn/steer` भेजने से पहले quiet window। Bare numbers milliseconds होते हैं; units `ms`, `s`, `m`, `h`, और `d` `/queue` options द्वारा स्वीकार किए जाते हैं।
- `cap`: प्रति सत्र अधिकतम कतारबद्ध संदेश। `1` से कम values अनदेखी की जाती हैं।
- `drop: "summarize"`: डिफ़ॉल्ट। आवश्यकता अनुसार सबसे पुरानी कतारबद्ध entries drop करें, compact summaries रखें, और उन्हें synthetic followup prompt के रूप में inject करें।
- `drop: "old"`: आवश्यकता अनुसार सबसे पुरानी कतारबद्ध entries drop करें, summaries सुरक्षित रखे बिना।
- `drop: "new"`: जब कतार पहले से भरी हो तो सबसे नए संदेश को reject करें।

डिफ़ॉल्ट: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Steer और streaming

जब चैनल streaming `partial` या `block` हो, steering सक्रिय रन के runtime boundaries तक पहुँचते समय कई छोटे visible replies जैसा दिख सकता है:

- `partial`: preview जल्दी finalize हो सकता है, फिर steering स्वीकार होने के बाद नया preview शुरू होता है।
- `block`: draft-sized blocks वही sequential appearance बना सकते हैं।
- streaming के बिना, जब runtime same-turn steering स्वीकार नहीं कर सकता, तो सक्रिय रन के बाद steering followup पर fallback करता है।

`steer` in-flight tools को abort नहीं करता। जब सबसे नए संदेश को मौजूदा रन abort करना चाहिए, तो `/queue interrupt` का उपयोग करें।

## प्राथमिकता

Mode चयन के लिए, OpenClaw इसे resolve करता है:

1. Inline या stored per-session `/queue` override.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. डिफ़ॉल्ट `steer`.

Options के लिए, inline या stored `/queue` options config पर प्राथमिकता रखते हैं। फिर channel-specific debounce (`messages.queue.debounceMsByChannel`), plugin debounce defaults, global `messages.queue` options, और built-in defaults लागू होते हैं। `cap` और `drop` global/session options हैं, per-channel config keys नहीं।

## प्रति-सत्र overrides

- मौजूदा सत्र के लिए queue mode store करने हेतु `/queue <steer|followup|collect|interrupt>` को standalone command के रूप में भेजें।
- Options को combine किया जा सकता है: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` या `/queue reset` session override साफ़ करता है।

## Scope और guarantees

- उन सभी inbound channels के auto-reply agent runs पर लागू होता है जो gateway reply pipeline का उपयोग करते हैं (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, आदि)।
- डिफ़ॉल्ट लेन (`main`) inbound + मुख्य Heartbeat के लिए process-wide है; कई सत्रों को parallel चलाने के लिए `agents.defaults.maxConcurrent` सेट करें।
- अतिरिक्त लेन मौजूद हो सकती हैं (जैसे `cron`, `cron-nested`, `nested`, `subagent`) ताकि background jobs inbound replies को block किए बिना parallel चल सकें। Isolated cron agent turns अपने inner agent execution के लिए `cron-nested` का उपयोग करते हुए `cron` slot रखते हैं; दोनों `cron.maxConcurrentRuns` का उपयोग करते हैं। Shared non-cron `nested` flows अपना lane behavior रखते हैं। ये detached runs [background tasks](/hi/automation/tasks) के रूप में track किए जाते हैं।
- Per-session lanes गारंटी देती हैं कि एक समय में किसी दिए गए सत्र को केवल एक agent run छुए।
- कोई external dependencies या background worker threads नहीं; शुद्ध TypeScript + promises.

## समस्या निवारण

- अगर commands अटके हुए लगें, तो verbose logs सक्षम करें और queue drain हो रही है या नहीं यह पुष्टि करने के लिए "queued for ...ms" lines देखें।
- अगर आपको queue depth चाहिए, तो verbose logs सक्षम करें और queue timing lines देखें।
- Codex app-server runs जो turn स्वीकार करते हैं और फिर progress emit करना बंद कर देते हैं, Codex adapter द्वारा interrupted होते हैं ताकि active session lane outer run timeout की प्रतीक्षा करने के बजाय release हो सके।
- जब diagnostics सक्षम हों, तो वे sessions जो `processing` में `diagnostics.stuckSessionWarnMs` से अधिक समय तक रहते हैं और जिनमें कोई observed reply, tool, status, block, या ACP progress नहीं है, current activity द्वारा classified होते हैं। Active work `session.long_running` के रूप में log होता है; owned silent model calls भी `diagnostics.stuckSessionAbortMs` तक `session.long_running` बने रहते हैं ताकि slow या non-streaming providers को बहुत जल्दी stalled न बताया जाए। हाल की progress के बिना active work `session.stalled` के रूप में log होता है; owned model calls abort threshold पर या उसके बाद `session.stalled` में switch होते हैं, और ownerless stale model/tool activity को long-running के रूप में hidden नहीं किया जाता। `session.stuck` recoverable stale session bookkeeping के लिए reserved है, जिसमें stale ownerless model/tool activity वाले idle queued sessions शामिल हैं, और केवल वही path affected session lane को release कर सकता है ताकि queued work drain हो। Repeated `session.stuck` diagnostics तब तक back off करते हैं जब तक session unchanged रहता है।

## संबंधित

- [सत्र प्रबंधन](/hi/concepts/session)
- [Steering कतार](/hi/concepts/queue-steering)
- [Steer](/hi/tools/steer)
- [Retry policy](/hi/concepts/retry)
