---
read_when:
    - आप OpenClaw में `exec` या `bash` टूल के छोटे परिणाम चाहते हैं
    - आप Tokenjuice Plugin इंस्टॉल या सक्षम करना चाहते हैं
    - आपको समझना होगा कि Tokenjuice क्या बदलता है और किसे अपरिष्कृत छोड़ देता है
summary: वैकल्पिक Tokenjuice Plugin के साथ शोरयुक्त exec और bash टूल परिणामों को संक्षिप्त करें
title: Tokenjuice
x-i18n:
    generated_at: "2026-07-16T17:56:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 96b110563a2600429dd9f0d38997cf7cc5ae4952b7f146a6ab64c96f2f202440
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` एक वैकल्पिक बाहरी Plugin है, जो कमांड के पहले ही चल जाने के बाद शोरपूर्ण `exec` और `bash`
टूल परिणामों को संक्षिप्त करता है।

यह लौटाए गए `tool_result` को बदलता है, कमांड को नहीं। Tokenjuice शेल इनपुट को
दोबारा नहीं लिखता, कमांड फिर से नहीं चलाता और एग्ज़िट कोड नहीं बदलता।

वर्तमान में यह Codex ऐप-सर्वर हार्नेस में OpenClaw एम्बेडेड रन और OpenClaw डायनेमिक टूल पर लागू होता है।
Tokenjuice, OpenClaw के टूल-परिणाम मिडलवेयर से जुड़ता है और आउटपुट के सक्रिय हार्नेस सत्र में
वापस जाने से पहले उसे छोटा करता है।

## Plugin सक्षम करें

एक बार इंस्टॉल करें:

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

फिर इसे सक्षम करें:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

समतुल्य:

```bash
openclaw plugins enable tokenjuice
```

यदि आप सीधे कॉन्फ़िग संपादित करना पसंद करते हैं:

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## Tokenjuice क्या बदलता है

- शोरपूर्ण `exec` और `bash` परिणामों को सत्र में वापस भेजे जाने से पहले संक्षिप्त करता है।
- मूल कमांड निष्पादन को अपरिवर्तित रखता है।
- सुरक्षित-इन्वेंट्री नीति लागू करता है: फ़ाइल की सटीक सामग्री पढ़ने के परिणाम अपरिवर्तित रहते हैं, स्वतंत्र रिपॉज़िटरी-इन्वेंट्री कमांड संक्षिप्त हो सकते हैं और असुरक्षित मिश्रित कमांड अनुक्रम अपरिवर्तित रहते हैं।
- यह वैकल्पिक रूप से सक्षम रहता है: यदि आप हर जगह शब्दशः आउटपुट चाहते हैं, तो Plugin अक्षम करें।

## सत्यापित करें कि यह काम कर रहा है

1. Plugin सक्षम करें।
2. ऐसा सत्र शुरू करें जो `exec` को कॉल कर सके।
3. `git status` जैसी शोरपूर्ण कमांड चलाएँ।
4. जाँचें कि लौटाया गया टूल परिणाम कच्चे शेल आउटपुट की तुलना में छोटा और अधिक संरचित है।

## Plugin अक्षम करें

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

या:

```bash
openclaw plugins disable tokenjuice
```

## संबंधित

- [Exec टूल](/hi/tools/exec)
- [चिंतन स्तर](/hi/tools/thinking)
- [कॉन्टेक्स्ट इंजन](/hi/concepts/context-engine)
