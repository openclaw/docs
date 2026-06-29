---
read_when:
    - आप OpenClaw में छोटे `exec` या `bash` टूल परिणाम चाहते हैं
    - आप Tokenjuice Plugin को इंस्टॉल या सक्षम करना चाहते हैं
    - आपको समझना होगा कि tokenjuice क्या बदलता है और क्या कच्चा छोड़ता है
summary: वैकल्पिक Tokenjuice plugin के साथ शोरयुक्त exec और bash टूल परिणामों को संक्षिप्त करें
title: Tokenjuice
x-i18n:
    generated_at: "2026-06-29T00:25:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 183ab08d2a1150b446245514423b893cff9a85581980c15600cc16aec10eeae7
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` एक वैकल्पिक बाहरी Plugin है, जो कमांड पहले ही चल जाने के बाद शोरगुल वाले `exec` और `bash`
टूल परिणामों को संकुचित करता है।

यह लौटाए गए `tool_result` को बदलता है, कमांड को नहीं। Tokenjuice शेल इनपुट को
दोबारा नहीं लिखता, कमांड दोबारा नहीं चलाता, या निकास कोड नहीं बदलता।

आज यह Codex ऐप-सर्वर हार्नेस में OpenClaw एम्बेडेड रन और OpenClaw डायनामिक टूल पर लागू होता है। Tokenjuice OpenClaw के टूल-रिज़ल्ट मिडलवेयर में हुक करता है और
आउटपुट को सक्रिय हार्नेस सत्र में वापस जाने से पहले काट-छांट देता है।

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

## tokenjuice क्या बदलता है

- शोरगुल वाले `exec` और `bash` परिणामों को सत्र में वापस भेजे जाने से पहले संकुचित करता है।
- मूल कमांड निष्पादन को अनछुआ रखता है।
- सटीक फ़ाइल-सामग्री रीड और अन्य कमांड को सुरक्षित रखता है जिन्हें tokenjuice को कच्चा छोड़ना चाहिए।
- ऑप्ट-इन रहता है: यदि आप हर जगह शब्दशः आउटपुट चाहते हैं, तो Plugin अक्षम करें।

## सत्यापित करें कि यह काम कर रहा है

1. Plugin सक्षम करें।
2. ऐसा सत्र शुरू करें जो `exec` कॉल कर सके।
3. `git status` जैसी शोरगुल वाली कमांड चलाएँ।
4. जाँचें कि लौटाया गया टूल परिणाम कच्चे शेल आउटपुट से छोटा और अधिक संरचित है।

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
- [सोच स्तर](/hi/tools/thinking)
- [संदर्भ इंजन](/hi/concepts/context-engine)
