---
read_when:
    - आप वर्तमान सत्र के बारे में एक छोटा-सा अतिरिक्त प्रश्न पूछना चाहते हैं
    - आप क्लाइंट्स में BTW व्यवहार लागू कर रहे हैं या डीबग कर रहे हैं
summary: /btw के साथ अस्थायी सहायक प्रश्न
title: वैसे, अन्य प्रश्न
x-i18n:
    generated_at: "2026-06-29T00:17:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf97c17fb02c2464b1d1b31cfec652d52c60be6ce0cad25eaf32a9c080843ef2
    source_path: tools/btw.md
    workflow: 16
---

`/btw` आपको **वर्तमान सत्र** के बारे में एक त्वरित अतिरिक्त प्रश्न पूछने देता है, बिना
उस प्रश्न को सामान्य बातचीत इतिहास में बदले। `/side` इसका alias है।

यह Claude Code के `/btw` व्यवहार पर आधारित है, लेकिन OpenClaw के
Gateway और मल्टी-चैनल आर्किटेक्चर के लिए अनुकूलित है।

## यह क्या करता है

जब आप भेजते हैं:

```text
/btw what changed?
```

OpenClaw:

1. वर्तमान सत्र संदर्भ का snapshot लेता है,
2. एक अलग क्षणिक अतिरिक्त क्वेरी चलाता है,
3. केवल अतिरिक्त प्रश्न का उत्तर देता है,
4. मुख्य रन को अलग छोड़ देता है,
5. BTW प्रश्न या उत्तर को सत्र इतिहास में **नहीं** लिखता,
6. उत्तर को सामान्य assistant संदेश के बजाय **लाइव side result** के रूप में emit करता है।

महत्वपूर्ण मानसिक मॉडल है:

- वही सत्र संदर्भ
- अलग one-shot अतिरिक्त क्वेरी
- जब सत्र native harness का उपयोग करता है, वही native harness transport
- भविष्य के संदर्भ में कोई प्रदूषण नहीं
- transcript persistence नहीं

Codex harness सत्रों के लिए, BTW सक्रिय
app-server thread को क्षणिक side thread के रूप में fork करके Codex के अंदर रहता है। इससे Codex OAuth और native
thread व्यवहार सही रहता है, और साथ ही side answer को parent
transcript से अलग रखा जाता है। Codex `/side` की तरह, side thread वर्तमान Codex
permissions और native tool surface को बनाए रखता है, guardrails के साथ जो model को बताते हैं कि
विरासत में मिले parent-thread काम को सक्रिय निर्देशों की तरह न माने।

CLI runtime aliases के लिए, BTW direct provider call पर fallback करने के बजाय
owning CLI backend को side-question mode में उपयोग करता है। OpenClaw sanitized
conversation context को एक नए one-shot CLI invocation में seed करता है, उस invocation के लिए OpenClaw MCP
tool bundling और reusable CLI session state को disable करता है, और
backend को समर्थित कोई भी CLI-native no-resume या no-tools flags जोड़ने देता है। Direct
non-CLI runtimes direct one-shot path रखते हैं।

## यह क्या नहीं करता

`/btw` यह **नहीं** करता:

- नया durable सत्र बनाना,
- अधूरे मुख्य task को जारी रखना,
- BTW question/answer data को transcript history में लिखना,
- `chat.history` में दिखाई देना,
- reload के बाद बने रहना।

यह जानबूझकर **क्षणिक** है।

## Context कैसे काम करता है

BTW वर्तमान सत्र को केवल **background context** के रूप में उपयोग करता है।

अगर मुख्य रन वर्तमान में सक्रिय है, तो OpenClaw वर्तमान message
state का snapshot लेता है और in-flight main prompt को background context के रूप में शामिल करता है, साथ ही
model को स्पष्ट रूप से बताता है:

- केवल अतिरिक्त प्रश्न का उत्तर दें,
- अधूरे मुख्य task को resume या complete न करें,
- parent conversation को steer न करें।

इससे BTW मुख्य रन से अलग रहता है, फिर भी उसे पता रहता है कि
सत्र किस बारे में है।

## Delivery model

BTW सामान्य assistant transcript message के रूप में deliver **नहीं** होता।

Gateway protocol स्तर पर:

- सामान्य assistant chat `chat` event का उपयोग करता है
- BTW `chat.side_result` event का उपयोग करता है

यह separation जानबूझकर है। अगर BTW सामान्य `chat` event path को reuse करता,
तो clients इसे नियमित conversation history की तरह मानते।

क्योंकि BTW अलग live event का उपयोग करता है और
`chat.history` से replay नहीं होता, यह reload के बाद गायब हो जाता है।

## Surface behavior

### TUI

TUI में, BTW वर्तमान session view में inline render होता है, लेकिन यह
क्षणिक रहता है:

- सामान्य assistant reply से स्पष्ट रूप से अलग
- `Enter` या `Esc` से dismissible
- reload पर replay नहीं होता

### External channels

Telegram, WhatsApp, और Discord जैसे channels पर, BTW को
स्पष्ट रूप से labeled one-off reply के रूप में deliver किया जाता है क्योंकि इन surfaces में local
ephemeral overlay concept नहीं होता।

उत्तर को अभी भी side result माना जाता है, सामान्य session history नहीं।

### Control UI / web

Gateway BTW को सही ढंग से `chat.side_result` के रूप में emit करता है, और BTW
`chat.history` में शामिल नहीं होता, इसलिए persistence contract web के लिए पहले से सही है।

वर्तमान Control UI को अभी भी browser में BTW को live render करने के लिए dedicated `chat.side_result` consumer की जरूरत है। जब तक वह client-side support नहीं आता, BTW
पूर्ण TUI और external-channel behavior के साथ Gateway-level feature है, लेकिन अभी
complete browser UX नहीं है।

## BTW कब उपयोग करें

`/btw` का उपयोग करें जब आप चाहते हैं:

- वर्तमान काम के बारे में त्वरित clarification,
- लंबे रन के अभी भी प्रगति में रहने के दौरान factual side answer,
- temporary answer जो भविष्य के session context का हिस्सा नहीं बनना चाहिए।

Examples:

```text
/btw what file are we editing?
/side what changed while the main run continued?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## BTW कब उपयोग न करें

जब आप चाहते हैं कि उत्तर session के
future working context का हिस्सा बने, तब `/btw` का उपयोग न करें।

ऐसे मामले में, BTW का उपयोग करने के बजाय main session में सामान्य रूप से पूछें।

## Related

<CardGroup cols={2}>
  <Card title="Slash commands" href="/hi/tools/slash-commands" icon="terminal">
    Native command catalog और chat directives.
  </Card>
  <Card title="Thinking levels" href="/hi/tools/thinking" icon="brain">
    side-question model call के लिए reasoning effort levels.
  </Card>
  <Card title="Session" href="/hi/concepts/session" icon="comments">
    Session keys, history, और persistence semantics.
  </Card>
  <Card title="Steer command" href="/hi/tools/steer" icon="arrow-right">
    active run में steering message inject करें, उसे खत्म किए बिना।
  </Card>
</CardGroup>
