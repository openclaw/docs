---
summary: OpenClaw अंतर्निहित एजेंट रनटाइम, प्रदाताओं, सत्रों, टूल और एक्सटेंशन को कैसे चलाता है।
title: एजेंट रनटाइम आर्किटेक्चर
x-i18n:
    generated_at: "2026-06-28T22:32:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd0ca61b10a4f7029590da8566b22cc44cf801af162e5f2c00c9561fe46e39e3
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw अंतर्निहित एजेंट रनटाइम का सीधे स्वामित्व रखता है। रनटाइम कोड `src/agents/` के अंतर्गत रहता है, मॉडल/प्रदाता हेल्पर `src/llm/` के अंतर्गत रहते हैं, और Plugin-सामने वाले अनुबंध `openclaw/plugin-sdk/*` बैरल के माध्यम से उजागर किए जाते हैं।

## रनटाइम लेआउट

- `src/agents/embedded-agent-runner/`: अंतर्निहित एजेंट प्रयास लूप, प्रदाता स्ट्रीम एडाप्टर, Compaction, मॉडल चयन, और सेशन वायरिंग।
- `src/agents/sessions/`: सेशन स्थायित्व, एक्सटेंशन लोडिंग, संसाधन खोज, Skills, प्रॉम्प्ट, थीम, और TUI-समर्थित टूल रेंडरर।
- `packages/agent-core/`: पुन: उपयोग योग्य एजेंट कोर, निचले-स्तर के हार्नेस प्रकार, संदेश, Compaction हेल्पर, प्रॉम्प्ट टेम्पलेट, और टूल/सेशन अनुबंध।
- `src/agents/runtime/`: `@openclaw/agent-core` के लिए OpenClaw facade और स्थानीय प्रॉक्सी उपयोगिताएं।
- `src/agents/agent-tools*.ts`: OpenClaw-स्वामित्व वाली टूल परिभाषाएं, स्कीमा, नीति, before/after hook एडाप्टर, और होस्ट एडिट समर्थन।
- `src/agents/agent-hooks/`: अंतर्निहित रनटाइम हुक जैसे Compaction सुरक्षा उपाय और संदर्भ छंटाई।
- `src/llm/`: मॉडल/प्रदाता रजिस्ट्री, ट्रांसपोर्ट हेल्पर, और प्रदाता-विशिष्ट स्ट्रीम कार्यान्वयन।

## सीमाएं

कोर कोड अंतर्निहित रनटाइम को OpenClaw मॉड्यूल और SDK बैरल के माध्यम से कॉल करता है, पुराने बाहरी एजेंट पैकेजों के माध्यम से नहीं। Plugins दस्तावेजीकृत `openclaw/plugin-sdk/*` एंट्रीपॉइंट का उपयोग करते हैं और `src/**` internals इंपोर्ट नहीं करते।

`@earendil-works/pi-tui` एक तृतीय-पक्ष TUI निर्भरता बनी रहती है। इसे स्थानीय TUI और सेशन रेंडरर द्वारा टर्मिनल कंपोनेंट टूलकिट के रूप में उपयोग किया जाता है; इसे आंतरिक बनाना एक अलग vendoring प्रयास होगा।

## मैनिफेस्ट

संसाधन पैकेज पैकेज मेटाडेटा में OpenClaw संसाधन घोषित करते हैं:

```json
{
  "openclaw": {
    "extensions": ["extensions/index.ts"],
    "skills": ["skills/*.md"],
    "prompts": ["prompts/*.md"],
    "themes": ["themes/*.json"]
  }
}
```

पैकेज मैनेजर पारंपरिक `extensions/`, `skills/`, `prompts/`, और `themes/` डायरेक्टरी भी खोजता है।

## रनटाइम चयन

डिफ़ॉल्ट अंतर्निहित रनटाइम id `openclaw` है। Plugin हार्नेस अतिरिक्त रनटाइम id रजिस्टर कर सकते हैं। `auto` जब कोई सहायक Plugin हार्नेस मौजूद होता है तो उसे चुनता है, और अन्यथा अंतर्निहित OpenClaw रनटाइम का उपयोग करता है।

## संबंधित

- [OpenClaw एजेंट रनटाइम वर्कफ़्लो](/hi/openclaw-agent-runtime)
- [एजेंट रनटाइम](/hi/concepts/agent-runtimes)
