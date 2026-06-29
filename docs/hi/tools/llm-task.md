---
read_when:
    - आप वर्कफ़्लो के अंदर केवल-JSON LLM चरण चाहते हैं
    - स्वचालन के लिए आपको स्कीमा-मान्यीकृत LLM आउटपुट चाहिए
summary: वर्कफ़्लो के लिए केवल-JSON LLM कार्य (वैकल्पिक Plugin टूल)
title: LLM कार्य
x-i18n:
    generated_at: "2026-06-29T00:20:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab83202bd0954a948c933c80de17385eb385573b8e3974dba41ff876f91c3ddb
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` एक **वैकल्पिक plugin टूल** है जो JSON-only LLM कार्य चलाता है और
संरचित आउटपुट लौटाता है (वैकल्पिक रूप से JSON Schema के विरुद्ध सत्यापित)।

यह Lobster जैसे वर्कफ़्लो इंजन के लिए आदर्श है: आप हर वर्कफ़्लो के लिए कस्टम OpenClaw कोड लिखे बिना
एक LLM चरण जोड़ सकते हैं।

## Plugin सक्षम करें

1. Plugin सक्षम करें:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. वैकल्पिक टूल की अनुमति दें:

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

`tools.allow` का उपयोग केवल तब करें जब आप प्रतिबंधात्मक allowlist मोड चाहते हों।

## कॉन्फ़िग (वैकल्पिक)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai",
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.5"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels`, `provider/model` स्ट्रिंग्स की allowlist है। यदि सेट हो, तो सूची के
बाहर का कोई भी अनुरोध अस्वीकार कर दिया जाता है।

## टूल पैरामीटर

- `prompt` (string, आवश्यक)
- `input` (any, वैकल्पिक)
- `schema` (object, वैकल्पिक JSON Schema)
- `provider` (string, वैकल्पिक)
- `model` (string, वैकल्पिक)
- `thinking` (string, वैकल्पिक)
- `authProfileId` (string, वैकल्पिक)
- `temperature` (number, वैकल्पिक)
- `maxTokens` (number, वैकल्पिक)
- `timeoutMs` (number, वैकल्पिक)

`thinking` मानक OpenClaw reasoning presets स्वीकार करता है, जैसे `low` या `medium`।

## आउटपुट

`details.json` लौटाता है, जिसमें पार्स किया गया JSON होता है (और प्रदान किए जाने पर
`schema` के विरुद्ध सत्यापित करता है)।

## उदाहरण: Lobster वर्कफ़्लो चरण

### महत्वपूर्ण सीमा

नीचे दिया गया उदाहरण मानता है कि **standalone Lobster CLI** ऐसे वातावरण में चल रहा है जहाँ `openclaw.invoke` के पास पहले से सही gateway URL/auth context है।

OpenClaw के अंदर बंडल किए गए **embedded** Lobster runner के लिए, यह nested CLI पैटर्न **वर्तमान में विश्वसनीय नहीं है**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

जब तक embedded Lobster में इस प्रवाह के लिए समर्थित bridge नहीं होता, इनमें से किसी एक को प्राथमिकता दें:

- Lobster के बाहर सीधे `llm-task` टूल कॉल, या
- ऐसे Lobster चरण जो nested `openclaw.invoke` कॉल पर निर्भर नहीं होते।

Standalone Lobster CLI उदाहरण:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": {
    "subject": "Hello",
    "body": "Can you help?"
  },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

## सुरक्षा नोट्स

- यह टूल **JSON-only** है और मॉडल को केवल JSON आउटपुट करने का निर्देश देता है (कोई
  कोड fence नहीं, कोई commentary नहीं)।
- इस run के लिए मॉडल को कोई टूल उजागर नहीं किया जाता।
- जब तक आप `schema` से सत्यापित न करें, आउटपुट को अविश्वसनीय मानें।
- किसी भी side-effecting चरण (send, post, exec) से पहले approvals रखें।

## संबंधित

- [Thinking स्तर](/hi/tools/thinking)
- [Sub-agents](/hi/tools/subagents)
- [Slash commands](/hi/tools/slash-commands)
