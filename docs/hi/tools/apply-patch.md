---
read_when:
    - आपको कई फ़ाइलों में संरचित संपादन करने होंगे
    - आप patch-आधारित संपादनों का दस्तावेज़ीकरण या डीबग करना चाहते हैं
summary: apply_patch टूल से बहु-फ़ाइल पैच लागू करें
title: apply_patch टूल
x-i18n:
    generated_at: "2026-06-29T00:16:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ff2f8e6ecd55ff1bdc553619ab3d590d0967efe7a9a90a31946ad15fd89a1dc
    source_path: tools/apply-patch.md
    workflow: 16
---

संरचित पैच फ़ॉर्मैट का उपयोग करके फ़ाइल बदलाव लागू करें। यह बहु-फ़ाइल
या बहु-हंक संपादनों के लिए आदर्श है, जहाँ एक अकेला `edit` कॉल नाज़ुक हो सकता है।

टूल एक अकेली `input` स्ट्रिंग स्वीकार करता है, जो एक या अधिक फ़ाइल ऑपरेशन को लपेटती है:

```
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## पैरामीटर

- `input` (आवश्यक): `*** Begin Patch` और `*** End Patch` सहित पूरे पैच की सामग्री।

## नोट्स

- पैच पाथ सापेक्ष पाथ (वर्कस्पेस डायरेक्टरी से) और निरपेक्ष पाथ का समर्थन करते हैं।
- `tools.exec.applyPatch.workspaceOnly` का डिफ़ॉल्ट `true` (वर्कस्पेस-सीमित) होता है। इसे `false` पर केवल तभी सेट करें जब आप जानबूझकर `apply_patch` से वर्कस्पेस डायरेक्टरी के बाहर लिखना/हटाना चाहते हों।
- फ़ाइलों का नाम बदलने के लिए `*** Update File:` हंक के भीतर `*** Move to:` का उपयोग करें।
- आवश्यकता होने पर `*** End of File` केवल-EOF इंसर्ट को चिह्नित करता है।
- OpenAI और OpenAI Codex मॉडलों के लिए डिफ़ॉल्ट रूप से उपलब्ध। इसे अक्षम करने के लिए
  `tools.exec.applyPatch.enabled: false` सेट करें।
- वैकल्पिक रूप से मॉडल के अनुसार गेट करने के लिए
  `tools.exec.applyPatch.allowModels` का उपयोग करें।
- कॉन्फ़िग केवल `tools.exec` के अंतर्गत होता है।

## उदाहरण

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## संबंधित

<CardGroup cols={2}>
  <Card title="Diffs" href="/hi/tools/diffs" icon="code-compare">
    बदलाव प्रस्तुति के लिए केवल-पढ़ने वाला diff viewer।
  </Card>
  <Card title="Exec tool" href="/hi/tools/exec" icon="terminal">
    agent से Shell कमांड निष्पादन।
  </Card>
  <Card title="Code execution" href="/hi/tools/code-execution" icon="square-code">
    xAI के साथ sandboxed remote Python विश्लेषण।
  </Card>
</CardGroup>
