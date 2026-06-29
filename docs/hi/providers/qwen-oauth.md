---
read_when:
    - आप qwen-oauth प्रदाता आईडी कॉन्फ़िगर करना चाहते हैं
    - आपने पहले Qwen Portal OAuth क्रेडेंशियल्स का उपयोग किया था
    - आपको Qwen Portal एंडपॉइंट या माइग्रेशन मार्गदर्शन की आवश्यकता है
summary: OpenClaw के साथ Qwen Portal प्रदाता आईडी का उपयोग करें
title: Qwen OAuth / पोर्टल
x-i18n:
    generated_at: "2026-06-29T00:02:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 46f147e3730024bf63e99827f666e2be791318723eace98941ca067c440dddd0
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` Qwen Portal प्रदाता आईडी है। यह Qwen Portal एंडपॉइंट को लक्षित करता है
और पुराने Qwen OAuth / पोर्टल सेटअप को एक अलग प्रदाता आईडी के माध्यम से
संबोधित करने योग्य रखता है।

इस प्रदाता का उपयोग तब करें जब आपके पास विशेष रूप से
`https://portal.qwen.ai/v1` के लिए वर्तमान Qwen Portal टोकन हो, या जब आप किसी पुराने Qwen Portal /
Qwen CLI सेटअप को माइग्रेट कर रहे हों और उन क्रेडेंशियल्स को कैनॉनिकल
Qwen Cloud प्रदाता से अलग रखना चाहते हों। यह नए Qwen उपयोगकर्ताओं के लिए अनुशंसित पहली पसंद नहीं है।

नए Qwen Cloud सेटअप के लिए, जब तक आपके पास विशेष रूप से वर्तमान Qwen Portal टोकन न हो,
Standard ModelStudio एंडपॉइंट के साथ [Qwen](/hi/providers/qwen) को प्राथमिकता दें।

## सेटअप

ऑनबोर्डिंग के माध्यम से अपना पोर्टल टोकन दें:

```bash
openclaw onboard --auth-choice qwen-oauth
```

या सेट करें:

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

## डिफ़ॉल्ट

- प्रदाता: `qwen-oauth`
- उपनाम: `qwen-portal`, `qwen-cli`
- बेस URL: `https://portal.qwen.ai/v1`
- एन्व var: `QWEN_API_KEY`
- API शैली: OpenAI-संगत
- डिफ़ॉल्ट मॉडल: `qwen-oauth/qwen3.5-plus`

## यह Qwen से कैसे अलग है

OpenClaw में दो Qwen-सामना करने वाली प्रदाता आईडी हैं:

| प्रदाता      | एंडपॉइंट परिवार                                      | इसके लिए सर्वोत्तम                                                                     |
| ------------ | ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `qwen`       | Qwen Cloud / Alibaba DashScope और Coding Plan एंडपॉइंट | नए API-कुंजी सेटअप, Standard पे-ऐज़-यू-गो, Coding Plan, मल्टीमॉडल DashScope सुविधाएँ |
| `qwen-oauth` | `portal.qwen.ai/v1` पर Qwen Portal एंडपॉइंट            | मौजूदा Qwen Portal टोकन और पुराने Qwen OAuth / CLI सेटअप                              |

दोनों प्रदाता OpenAI-संगत अनुरोध आकारों का उपयोग करते हैं, लेकिन वे अलग auth
सतहें हैं। `qwen-oauth` के लिए संग्रहीत टोकन को DashScope
या ModelStudio कुंजी के रूप में नहीं माना जाना चाहिए, और नई DashScope कुंजी को इसके बजाय कैनॉनिकल `qwen`
प्रदाता का उपयोग करना चाहिए।

## Qwen OAuth / Portal कब चुनें

- आपके पास पहले से काम कर रहा Qwen Portal टोकन है।
- आप OpenClaw के प्रदाता मॉडल पर जाते समय पुराने Qwen OAuth या Qwen CLI वर्कफ़्लो को संरक्षित कर रहे हैं।
- आपको विशेष रूप से Qwen Portal एंडपॉइंट के साथ संगतता परीक्षण करनी है।

नए सेटअप, व्यापक एंडपॉइंट विकल्पों, Standard
ModelStudio, Coding Plan, और पूरे Qwen Plugin कैटलॉग के लिए [Qwen](/hi/providers/qwen) चुनें।

## मॉडल

Qwen Plugin कैटलॉग Qwen Portal डिफ़ॉल्ट को सीड करता है:

- `qwen-oauth/qwen3.5-plus`

उपलब्धता वर्तमान Qwen Portal खाते और टोकन पर निर्भर करती है। यदि आपका
खाता इसके बजाय ModelStudio / DashScope API कुंजियों का उपयोग करता है, तो कैनॉनिकल
`qwen` प्रदाता कॉन्फ़िगर करें:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## माइग्रेशन

पुरानी Qwen Portal OAuth प्रोफ़ाइलें रिफ़्रेश करने योग्य नहीं हो सकतीं। यदि कोई पोर्टल प्रोफ़ाइल
काम करना बंद कर देती है, तो वर्तमान टोकन से फिर से authenticate करें या Standard
Qwen प्रदाता पर स्विच करें:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

Standard वैश्विक ModelStudio उपयोग करता है:

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## समस्या निवारण

- पोर्टल OAuth रिफ़्रेश विफलताएँ: पुरानी Qwen Portal OAuth प्रोफ़ाइलें
  रिफ़्रेश करने योग्य नहीं हो सकतीं। वर्तमान टोकन के साथ ऑनबोर्डिंग फिर से चलाएँ।
- गलत एंडपॉइंट त्रुटियाँ: पोर्टल टोकन का उपयोग करते समय पुष्टि करें कि मॉडल ref `qwen-oauth/` से शुरू होता है।
  कैनॉनिकल Qwen प्रदाता के लिए ही `qwen/` refs का उपयोग करें।
- `QWEN_API_KEY` भ्रम: दोनों Qwen पेज इस env var का उल्लेख करते हैं, लेकिन ऑनबोर्डिंग
  चयनित प्रदाता आईडी के अंतर्गत क्रेडेंशियल्स संग्रहीत करती है। जब आप
  एक ही मशीन पर `qwen` और `qwen-oauth` दोनों उपलब्ध रखते हैं, तो ऑनबोर्डिंग को प्राथमिकता दें।

## संबंधित

- [Qwen](/hi/providers/qwen)
- [Alibaba Model Studio](/hi/providers/alibaba)
- [मॉडल प्रदाता](/hi/concepts/model-providers)
- [सभी प्रदाता](/hi/providers/index)
