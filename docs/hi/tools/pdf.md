---
read_when:
    - आप एजेंटों से प्राप्त PDFs का विश्लेषण करना चाहते हैं
    - आपको सटीक pdf टूल पैरामीटर और सीमाएँ चाहिए
    - आप नेटिव PDF मोड बनाम निष्कर्षण फ़ॉलबैक को डीबग कर रहे हैं
summary: Native प्रदाता समर्थन और निष्कर्षण fallback के साथ एक या अधिक PDF दस्तावेज़ों का विश्लेषण करें
title: PDF उपकरण
x-i18n:
    generated_at: "2026-06-29T00:22:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6cce4328a7457f30b8c64abdcfa94b6a5d5649c2bcdfde3187288b11a0e154b1
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` एक या अधिक PDF दस्तावेज़ों का विश्लेषण करता है और टेक्स्ट लौटाता है।

त्वरित व्यवहार:

- Anthropic और Google मॉडल प्रदाताओं के लिए नेटिव प्रदाता मोड।
- अन्य प्रदाताओं के लिए निष्कर्षण फ़ॉलबैक मोड (पहले टेक्स्ट निकालता है, फिर ज़रूरत होने पर पेज इमेज)।
- एकल (`pdf`) या बहु (`pdfs`) इनपुट का समर्थन करता है, प्रति कॉल अधिकतम 10 PDF।

## उपलब्धता

यह टूल केवल तब रजिस्टर होता है जब OpenClaw एजेंट के लिए PDF-सक्षम मॉडल कॉन्फ़िग हल कर सके:

1. `agents.defaults.pdfModel`
2. `agents.defaults.imageModel` पर फ़ॉलबैक
3. एजेंट के हल किए गए सेशन/डिफ़ॉल्ट मॉडल पर फ़ॉलबैक
4. यदि नेटिव-PDF प्रदाता auth-समर्थित हैं, तो उन्हें सामान्य इमेज फ़ॉलबैक उम्मीदवारों से पहले प्राथमिकता दें

यदि कोई उपयोगी मॉडल हल नहीं किया जा सकता, तो `pdf` टूल उपलब्ध नहीं कराया जाता।

उपलब्धता नोट्स:

- फ़ॉलबैक श्रृंखला auth-सचेत है। कॉन्फ़िगर किया गया `provider/model` केवल तभी गिना जाता है जब
  OpenClaw वास्तव में उस प्रदाता के लिए एजेंट को प्रमाणित कर सके।
- नेटिव PDF प्रदाता वर्तमान में **Anthropic** और **Google** हैं।
- यदि हल किए गए सेशन/डिफ़ॉल्ट प्रदाता के पास पहले से कॉन्फ़िगर किया गया vision/PDF
  मॉडल है, तो PDF टूल अन्य auth-समर्थित
  प्रदाताओं पर फ़ॉलबैक करने से पहले उसी का दोबारा उपयोग करता है।

## इनपुट संदर्भ

<ParamField path="pdf" type="string">
एक PDF पथ या URL।
</ParamField>

<ParamField path="pdfs" type="string[]">
कई PDF पथ या URL, कुल मिलाकर 10 तक।
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
विश्लेषण प्रॉम्प्ट।
</ParamField>

<ParamField path="pages" type="string">
`1-5` या `1,3,7-9` जैसा पेज फ़िल्टर।
</ParamField>

<ParamField path="password" type="string">
निष्कर्षण फ़ॉलबैक मोड में एन्क्रिप्टेड PDF के लिए पासवर्ड।
</ParamField>

<ParamField path="model" type="string">
`provider/model` रूप में वैकल्पिक मॉडल ओवरराइड।
</ParamField>

<ParamField path="maxBytesMb" type="number">
प्रति-PDF आकार सीमा MB में। डिफ़ॉल्ट `agents.defaults.pdfMaxBytesMb` या `10` है।
</ParamField>

इनपुट नोट्स:

- लोड करने से पहले `pdf` और `pdfs` को मर्ज और डिडुप्लिकेट किया जाता है।
- यदि कोई PDF इनपुट नहीं दिया गया है, तो टूल त्रुटि देता है।
- `pages` को 1-आधारित पेज नंबरों के रूप में पार्स किया जाता है, डिडुप्लिकेट, सॉर्ट, और कॉन्फ़िगर किए गए अधिकतम पेजों तक सीमित किया जाता है।
- `password` अनुरोध में हर PDF पर लागू होता है और केवल निष्कर्षण फ़ॉलबैक मोड द्वारा उपयोग किया जाता है।
- `maxBytesMb` का डिफ़ॉल्ट `agents.defaults.pdfMaxBytesMb` या `10` है।

## समर्थित PDF संदर्भ

- स्थानीय फ़ाइल पथ (`~` विस्तार सहित)
- `file://` URL
- `http://` और `https://` URL
- OpenClaw-प्रबंधित इनबाउंड रेफ़, जैसे `media://inbound/<id>`

संदर्भ नोट्स:

- अन्य URI स्कीम (उदाहरण के लिए `ftp://`) `unsupported_pdf_reference` के साथ अस्वीकार की जाती हैं।
- सैंडबॉक्स मोड में, रिमोट `http(s)` URL अस्वीकार किए जाते हैं।
- workspace-only फ़ाइल नीति सक्षम होने पर, अनुमत रूट्स के बाहर स्थानीय फ़ाइल पथ अस्वीकार किए जाते हैं।
- OpenClaw के इनबाउंड मीडिया स्टोर के अंतर्गत प्रबंधित इनबाउंड रेफ़ और रीप्ले किए गए पथ workspace-only फ़ाइल नीति के साथ अनुमत हैं।

## निष्पादन मोड

### नेटिव प्रदाता मोड

नेटिव मोड प्रदाता `anthropic` और `google` के लिए उपयोग किया जाता है।
टूल कच्चे PDF बाइट्स सीधे प्रदाता APIs को भेजता है।

नेटिव मोड सीमाएँ:

- `pages` समर्थित नहीं है। यदि सेट किया गया, तो टूल त्रुटि लौटाता है।
- `password` समर्थित नहीं है। एन्क्रिप्टेड PDF का विश्लेषण करने के लिए non-native मॉडल का उपयोग करें।
- बहु-PDF इनपुट समर्थित है; प्रत्येक PDF को प्रॉम्प्ट से पहले नेटिव दस्तावेज़ ब्लॉक /
  इनलाइन PDF भाग के रूप में भेजा जाता है।

### निष्कर्षण फ़ॉलबैक मोड

फ़ॉलबैक मोड non-native प्रदाताओं के लिए उपयोग किया जाता है।

प्रवाह:

1. चुने गए पेजों से टेक्स्ट निकालें (`agents.defaults.pdfMaxPages` तक, डिफ़ॉल्ट `20`)।
2. यदि निकाले गए टेक्स्ट की लंबाई `200` वर्णों से कम है, तो चुने गए पेजों को PNG इमेज में रेंडर करें और उन्हें शामिल करें।
3. निकाली गई सामग्री और प्रॉम्प्ट को चुने गए मॉडल को भेजें।

फ़ॉलबैक विवरण:

- पेज इमेज निष्कर्षण `4,000,000` के पिक्सेल बजट का उपयोग करता है।
- एन्क्रिप्टेड PDF को शीर्ष-स्तरीय `password` पैरामीटर के साथ खोला जा सकता है।
- यदि लक्ष्य मॉडल इमेज इनपुट का समर्थन नहीं करता और निकालने योग्य टेक्स्ट नहीं है, तो टूल त्रुटि देता है।
- यदि टेक्स्ट निष्कर्षण सफल होता है लेकिन इमेज निष्कर्षण के लिए केवल-टेक्स्ट मॉडल पर vision की आवश्यकता होगी, तो OpenClaw रेंडर की गई इमेज हटा देता है और
  निकाले गए टेक्स्ट के साथ जारी रखता है।
- निष्कर्षण फ़ॉलबैक bundled `document-extract` Plugin का उपयोग करता है। Plugin
  `clawpdf` का स्वामी है, जो PDFium
  WebAssembly के माध्यम से टेक्स्ट निष्कर्षण और इमेज रेंडरिंग प्रदान करता है।

## कॉन्फ़िग

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

पूर्ण फ़ील्ड विवरण के लिए [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference) देखें।

## आउटपुट विवरण

टूल `content[0].text` में टेक्स्ट और `details` में संरचित मेटाडेटा लौटाता है।

सामान्य `details` फ़ील्ड:

- `model`: हल किया गया मॉडल रेफ़ (`provider/model`)
- `native`: नेटिव प्रदाता मोड के लिए `true`, फ़ॉलबैक के लिए `false`
- `attempts`: सफलता से पहले विफल हुए फ़ॉलबैक प्रयास

पथ फ़ील्ड:

- एकल PDF इनपुट: `details.pdf`
- बहु PDF इनपुट: `pdf` प्रविष्टियों के साथ `details.pdfs[]`
- सैंडबॉक्स पथ पुनर्लेखन मेटाडेटा (जब लागू हो): `rewrittenFrom`

## त्रुटि व्यवहार

- PDF इनपुट गुम: `pdf required: provide a path or URL to a PDF document` फेंकता है
- बहुत अधिक PDF: `details.error = "too_many_pdfs"` में संरचित त्रुटि लौटाता है
- असमर्थित संदर्भ स्कीम: `details.error = "unsupported_pdf_reference"` लौटाता है
- `pages` के साथ नेटिव मोड: स्पष्ट `pages is not supported with native PDF providers` त्रुटि फेंकता है

## उदाहरण

एकल PDF:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

कई PDF:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

पेज-फ़िल्टर किया गया फ़ॉलबैक मॉडल:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

निष्कर्षण फ़ॉलबैक के साथ एन्क्रिप्टेड PDF:

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Summarize this contract"
}
```

## संबंधित

- [टूल्स अवलोकन](/hi/tools) - सभी उपलब्ध एजेंट टूल
- [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/config-agents#agent-defaults) - pdfMaxBytesMb और pdfMaxPages कॉन्फ़िग
