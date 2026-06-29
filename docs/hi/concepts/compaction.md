---
read_when:
    - आप स्वतः-Compaction और /compact को समझना चाहते हैं
    - आप संदर्भ सीमाओं तक पहुँचने वाले लंबे सत्रों को डीबग कर रहे हैं
summary: OpenClaw लंबी बातचीतों को मॉडल सीमाओं के भीतर रहने के लिए कैसे सारांशित करता है
title: Compaction
x-i18n:
    generated_at: "2026-06-28T22:57:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 71c1665055574622926a4f13ee82b97f1c45e679a895db78da983919c0a5458f
    source_path: concepts/compaction.md
    workflow: 16
---

हर मॉडल की एक संदर्भ विंडो होती है: टोकन की अधिकतम संख्या जिसे वह संसाधित कर सकता है। जब कोई बातचीत उस सीमा के करीब पहुंचती है, तो OpenClaw पुराने संदेशों को एक सारांश में **compact** करता है ताकि चैट जारी रह सके।

## यह कैसे काम करता है

1. पुराने बातचीत टर्न को एक compact प्रविष्टि में सारांशित किया जाता है।
2. सारांश को सत्र ट्रांसक्रिप्ट में सहेजा जाता है।
3. हाल के संदेशों को जस का तस रखा जाता है।

जब OpenClaw इतिहास को Compaction खंडों में विभाजित करता है, तो यह असिस्टेंट टूल कॉल को उनकी मेल खाती `toolResult` प्रविष्टियों के साथ जोड़े रखता है। यदि कोई विभाजन बिंदु किसी टूल ब्लॉक के भीतर आता है, तो OpenClaw सीमा को खिसका देता है ताकि जोड़ा साथ रहे और वर्तमान असारांशित अंतिम भाग सुरक्षित रहे।

पूरे बातचीत इतिहास को डिस्क पर रखा जाता है। Compaction केवल यह बदलता है कि अगले टर्न में मॉडल क्या देखता है।

## स्वचालित Compaction

स्वचालित Compaction डिफ़ॉल्ट रूप से चालू होता है। यह तब चलता है जब सत्र संदर्भ सीमा के करीब पहुंचता है, या जब मॉडल context-overflow त्रुटि लौटाता है (ऐसी स्थिति में OpenClaw compact करता है और पुनः प्रयास करता है)।

आप देखेंगे:

- सामान्य Gateway लॉग में `embedded run auto-compaction start` / `complete`।
- verbose मोड में `🧹 Auto-compaction complete`।
- `/status` में `🧹 Compactions: <count>`।

<Info>
compact करने से पहले, OpenClaw एजेंट को महत्वपूर्ण नोट्स [memory](/hi/concepts/memory) फ़ाइलों में सहेजने की याद अपने आप दिलाता है। इससे संदर्भ हानि रुकती है।
</Info>

<AccordionGroup>
  <Accordion title="पहचाने गए overflow signatures">
    OpenClaw इन प्रदाता त्रुटि पैटर्न से context overflow पहचानता है:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## मैनुअल Compaction

किसी भी चैट में Compaction को बाध्य करने के लिए `/compact` टाइप करें। सारांश को निर्देशित करने के लिए निर्देश जोड़ें:

```
/compact Focus on the API design decisions
```

जब `agents.defaults.compaction.keepRecentTokens` सेट हो, तो मैनुअल Compaction उस OpenClaw cut-point का सम्मान करता है और rebuilt संदर्भ में हाल का अंतिम भाग रखता है। स्पष्ट keep budget के बिना, मैनुअल Compaction एक hard checkpoint की तरह व्यवहार करता है और केवल नए सारांश से जारी रहता है।

## कॉन्फ़िगरेशन

अपने `openclaw.json` में `agents.defaults.compaction` के अंतर्गत Compaction कॉन्फ़िगर करें। सबसे सामान्य knobs नीचे सूचीबद्ध हैं; पूरी reference के लिए, [Session management deep dive](/hi/reference/session-management-compaction) देखें।

### अलग मॉडल का उपयोग करना

डिफ़ॉल्ट रूप से, Compaction एजेंट के प्राथमिक मॉडल का उपयोग करता है। सारांशण को किसी अधिक सक्षम या विशिष्ट मॉडल को सौंपने के लिए `agents.defaults.compaction.model` सेट करें। override एक `provider/model-id` स्ट्रिंग या `agents.defaults.models` के अंतर्गत कॉन्फ़िगर किया गया bare alias स्वीकार करता है:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

Bare configured aliases Compaction शुरू होने से पहले अपने canonical provider और model में resolve होते हैं। यदि कोई bare value किसी alias और configured literal model ID दोनों से मेल खाती है, तो literal model ID जीतता है। unmatched bare value active provider पर model ID बनी रहती है।

यह local models के साथ भी काम करता है, उदाहरण के लिए सारांशण को समर्पित दूसरा Ollama मॉडल:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

unset होने पर, Compaction सक्रिय सत्र मॉडल से शुरू होता है। यदि सारांशण model-fallback-eligible provider error के साथ विफल होता है, तो OpenClaw उस Compaction प्रयास को सत्र की मौजूदा model fallback chain के माध्यम से फिर से आज़माता है। fallback choice अस्थायी होती है और session state में वापस नहीं लिखी जाती। स्पष्ट `agents.defaults.compaction.model` override exact रहता है और session fallback chain को inherit नहीं करता।

### Identifier संरक्षण

Compaction सारांशण opaque identifiers को डिफ़ॉल्ट रूप से सुरक्षित रखता है (`identifierPolicy: "strict"`). अक्षम करने के लिए `identifierPolicy: "off"` से override करें, या custom guidance के लिए `identifierPolicy: "custom"` के साथ `identifierInstructions` का उपयोग करें।

### Active transcript byte guard

जब `agents.defaults.compaction.maxActiveTranscriptBytes` सेट हो, तो OpenClaw run से पहले सामान्य local Compaction trigger करता है यदि active JSONL उस आकार तक पहुंच जाता है। यह लंबे समय तक चलने वाले सत्रों के लिए उपयोगी है, जहां provider-side context management मॉडल संदर्भ को स्वस्थ रख सकता है जबकि local transcript बढ़ता रहता है। यह raw JSONL bytes को split नहीं करता; यह सामान्य Compaction pipeline से semantic summary बनाने को कहता है।

<Warning>
byte guard के लिए `truncateAfterCompaction: true` आवश्यक है। transcript rotation के बिना, active file छोटी नहीं होगी और guard inactive रहेगा।
</Warning>

### Successor transcripts

जब `agents.defaults.compaction.truncateAfterCompaction` enabled हो, तो OpenClaw मौजूदा transcript को उसी जगह rewrite नहीं करता। यह Compaction summary, preserved state, और unsummarized tail से नया active successor transcript बनाता है, फिर checkpoint metadata record करता है जो branch/restore flows को उस compacted successor की ओर point करता है।
Successor transcripts छोटे retry window के भीतर आने वाले exact duplicate long user turns को भी drop करते हैं, ताकि channel retry storms को Compaction के बाद अगले active transcript में न ले जाया जाए।

OpenClaw नए Compactions के लिए अब अलग `.checkpoint.*.jsonl` copies नहीं लिखता। मौजूदा legacy checkpoint files referenced होने तक अब भी उपयोग की जा सकती हैं और normal session cleanup द्वारा prune की जाती हैं।

### Compaction notices

डिफ़ॉल्ट रूप से, Compaction चुपचाप चलता है। Compaction शुरू और पूरा होने पर संक्षिप्त status messages दिखाने के लिए `notifyUser` सेट करें:

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

### Memory flush

Compaction से पहले, OpenClaw durable notes को disk पर store करने के लिए एक **silent memory flush** turn चला सकता है। जब यह housekeeping turn active conversation model के बजाय local model का उपयोग करे, तब `agents.defaults.compaction.memoryFlush.model` सेट करें:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

memory-flush model override exact होता है और active session fallback chain को inherit नहीं करता। विवरण और config के लिए [Memory](/hi/concepts/memory) देखें।

## Pluggable Compaction providers

Plugins, Plugin API पर `registerCompactionProvider()` के माध्यम से custom Compaction provider register कर सकते हैं। जब कोई provider registered और configured हो, तो OpenClaw built-in LLM pipeline के बजाय सारांशण उसे delegate करता है।

registered provider का उपयोग करने के लिए, अपने config में उसका id सेट करें:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "provider": "my-provider"
      }
    }
  }
}
```

`provider` सेट करना अपने आप `mode: "safeguard"` को force करता है। Providers को built-in path जैसे ही Compaction instructions और identifier-preservation policy मिलती है, और OpenClaw provider output के बाद भी recent-turn और split-turn suffix context को preserve करता है।

<Note>
यदि provider विफल होता है या empty result लौटाता है, तो OpenClaw built-in LLM summarization पर fallback करता है।
</Note>

## Compaction बनाम pruning

|                  | Compaction                    | Pruning                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **यह क्या करता है** | पुरानी बातचीत को सारांशित करता है | पुराने tool results को trim करता है |
| **सहेजा गया?**       | हां (session transcript में)   | नहीं (केवल in-memory, प्रति request) |
| **Scope**        | पूरी बातचीत           | केवल tool results                |

[Session pruning](/hi/concepts/session-pruning) एक हल्का complement है जो सारांशित किए बिना tool output को trim करता है।

## Troubleshooting

**बहुत बार compact हो रहा है?** मॉडल की context window छोटी हो सकती है, या tool outputs बड़े हो सकते हैं। [session pruning](/hi/concepts/session-pruning) enabled करने का प्रयास करें।

**Compaction के बाद context stale लगता है?** सारांश को guide करने के लिए `/compact Focus on <topic>` का उपयोग करें, या [memory flush](/hi/concepts/memory) enabled करें ताकि notes बने रहें।

**clean slate चाहिए?** `/new` compact किए बिना fresh session शुरू करता है।

advanced configuration (reserve tokens, identifier preservation, custom context engines, OpenAI server-side compaction) के लिए, [Session management deep dive](/hi/reference/session-management-compaction) देखें।

## संबंधित

- [Session](/hi/concepts/session): session management और lifecycle।
- [Session pruning](/hi/concepts/session-pruning): tool results को trim करना।
- [Context](/hi/concepts/context): agent turns के लिए context कैसे बनाया जाता है।
- [Hooks](/hi/automation/hooks): Compaction lifecycle hooks (`before_compaction`, `after_compaction`)।
