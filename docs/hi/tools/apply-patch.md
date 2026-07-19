---
read_when:
    - आपको कई फ़ाइलों में संरचित संपादन करने हैं
    - आप पैच-आधारित संपादनों का दस्तावेज़ीकरण या डीबग करना चाहते हैं
summary: apply_patch टूल से बहु-फ़ाइल पैच लागू करें
title: apply_patch टूल
x-i18n:
    generated_at: "2026-07-19T09:34:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1c0422550ea8d9b0cb6b0ea22d7dcaecc462426f9600003f70c177746f30a3d9
    source_path: tools/apply-patch.md
    workflow: 16
---

संरचित पैच प्रारूप का उपयोग करके फ़ाइल परिवर्तन लागू करें। यह बहु-फ़ाइल
या बहु-हंक संपादनों के लिए आदर्श है, जहाँ एकल `edit` कॉल अस्थिर होगी।

यह टूल एकल `input` स्ट्रिंग स्वीकार करता है, जिसमें एक या अधिक फ़ाइल ऑपरेशन होते हैं:

```text
*** Begin Patch
*** Add File: path/to/file.txt
+पंक्ति 1
+पंक्ति 2
*** Update File: src/app.ts
@@ वैकल्पिक परिवर्तन संदर्भ
-पुरानी पंक्ति
+नई पंक्ति
*** Delete File: obsolete.txt
*** End Patch
```

## पैरामीटर

- `input` (आवश्यक): `*** Begin Patch` और `*** End Patch` सहित पैच की पूरी सामग्री।

## टिप्पणियाँ

- पैच पथ सापेक्ष पथों (कार्यस्थान निर्देशिका से) और निरपेक्ष पथों का समर्थन करते हैं।
- `tools.exec.applyPatch.workspaceOnly` का डिफ़ॉल्ट मान `true` (कार्यस्थान के भीतर सीमित) है। इसे केवल तभी `false` पर सेट करें, जब आप जानबूझकर `apply_patch` को कार्यस्थान निर्देशिका के बाहर लिखने/हटाने देना चाहते हों।
- फ़ाइलों का नाम बदलने के लिए `*** Update File:` हंक के भीतर `*** Move to:` का उपयोग करें।
- आवश्यकता होने पर `*** End of File` केवल EOF पर प्रविष्टि को चिह्नित करता है।
- प्रत्येक मॉडल के लिए डिफ़ॉल्ट रूप से सक्षम। इसे अक्षम करने के लिए `tools.exec.applyPatch.enabled: false`
  सेट करें, या `tools.exec.applyPatch.allowModels` के साथ इसे विशिष्ट मॉडलों तक सीमित करें
  (यह `gpt-5.4` जैसी मूल आईडी या `openai/gpt-5.4` जैसी पूर्ण
  आईडी स्वीकार करता है)।
- कॉन्फ़िगरेशन `tools.exec.applyPatch.*` के अंतर्गत रहता है।

## उदाहरण

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## संबंधित

<CardGroup cols={2}>
  <Card title="अंतर" href="/hi/tools/diffs" icon="code-compare">
    परिवर्तन प्रस्तुत करने के लिए केवल-पढ़ने योग्य अंतर दर्शक।
  </Card>
  <Card title="Exec टूल" href="/hi/tools/exec" icon="terminal">
    एजेंट से शेल कमांड का निष्पादन।
  </Card>
  <Card title="कोड निष्पादन" href="/hi/tools/code-execution" icon="square-code">
    xAI के साथ सैंडबॉक्सयुक्त रिमोट Python विश्लेषण।
  </Card>
</CardGroup>
