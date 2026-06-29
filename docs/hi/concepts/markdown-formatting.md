---
read_when:
    - आप आउटबाउंड चैनलों के लिए Markdown फ़ॉर्मैटिंग या चंकिंग बदल रहे हैं
    - आप नया चैनल formatter या style mapping जोड़ रहे हैं
    - आप सभी चैनलों में फ़ॉर्मैटिंग रिग्रेशन डीबग कर रहे हैं
summary: आउटबाउंड चैनलों के लिए Markdown फ़ॉर्मैटिंग पाइपलाइन
title: Markdown स्वरूपण
x-i18n:
    generated_at: "2026-06-28T22:58:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8db92aaf1063ebcbd8630dfcb8ca0a4e9eeb1c64f5b8868bf11c836777180515
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw आउटबाउंड Markdown को चैनल-विशिष्ट आउटपुट रेंडर करने से पहले एक साझा मध्यवर्ती
प्रतिनिधित्व (IR) में बदलकर फॉर्मैट करता है। IR स्रोत टेक्स्ट को अक्षुण्ण रखता है
और साथ में शैली/लिंक स्पैन रखता है, ताकि chunking और rendering चैनलों में
सुसंगत रह सकें।

## लक्ष्य

- **संगति:** एक parse चरण, कई renderers।
- **सुरक्षित chunking:** rendering से पहले टेक्स्ट को विभाजित करें ताकि inline formatting कभी
  chunks के बीच न टूटे।
- **चैनल अनुकूलता:** उसी IR को Markdown दोबारा parse किए बिना Slack mrkdwn, Telegram HTML, और Signal
  style ranges में मैप करें।

## Pipeline

1. **Markdown parse करें -> IR**
   - IR plain text और style spans (bold/italic/strike/code/spoiler) तथा link spans है।
   - Offsets UTF-16 code units हैं ताकि Signal style ranges उसके API के साथ संरेखित रहें।
   - Tables केवल तब parse की जाती हैं जब कोई चैनल table conversion चुनता है।
2. **IR chunk करें (format-first)**
   - Chunking rendering से पहले IR text पर होती है।
   - Inline formatting chunks के बीच split नहीं होती; spans हर chunk के अनुसार slice किए जाते हैं।
3. **प्रति चैनल render करें**
   - **Slack:** mrkdwn tokens (bold/italic/strike/code), links `<url|label>` के रूप में।
   - **Telegram:** HTML tags (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`)।
   - **Signal:** plain text + `text-style` ranges; label अलग होने पर links `label (url)` बन जाते हैं।

## IR उदाहरण

Input Markdown:

```markdown
Hello **world** - see [docs](https://docs.openclaw.ai).
```

IR (schematic):

```json
{
  "text": "Hello world - see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## यह कहाँ उपयोग होता है

- Slack, Telegram, और Signal आउटबाउंड adapters IR से render करते हैं।
- अन्य चैनल (WhatsApp, iMessage, Microsoft Teams, Discord) अभी भी plain text या
  अपने formatting rules का उपयोग करते हैं, और enabled होने पर chunking से पहले
  Markdown table conversion लागू होता है।

## Table handling

Markdown tables सभी chat clients में समान रूप से समर्थित नहीं हैं। प्रति चैनल (और प्रति account)
conversion नियंत्रित करने के लिए `markdown.tables` का उपयोग करें।

- `code`: tables को code blocks के रूप में render करें (अधिकांश चैनलों के लिए default)।
- `bullets`: हर row को bullet points में बदलें (Matrix, Signal, और WhatsApp के लिए default)।
- `off`: table parsing और conversion बंद करें; raw table text वैसा ही गुजरता है।

Config keys:

```yaml
channels:
  discord:
    markdown:
      tables: code
    accounts:
      work:
        markdown:
          tables: off
```

## Chunking rules

- Chunk limits channel adapters/config से आते हैं और IR text पर लागू होते हैं।
- Code fences को trailing newline के साथ single block के रूप में संरक्षित रखा जाता है ताकि चैनल
  उन्हें सही ढंग से render करें।
- List prefixes और blockquote prefixes IR text का हिस्सा हैं, इसलिए chunking
  mid-prefix split नहीं करती।
- Inline styles (bold/italic/strike/inline-code/spoiler) chunks के बीच कभी split नहीं होतीं;
  renderer हर chunk के अंदर styles दोबारा खोलता है।

अगर आपको चैनलों में chunking behavior पर और जानकारी चाहिए, तो
[Streaming + chunking](/hi/concepts/streaming) देखें।

## Link policy

- **Slack:** `[label](url)` -> `<url|label>`; bare URLs bare ही रहते हैं। Double-linking से बचने के लिए parse के दौरान Autolink
  disabled रहता है।
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (HTML parse mode)।
- **Signal:** `[label](url)` -> `label (url)` जब तक label URL से match न करे।

## Spoilers

Spoiler markers (`||spoiler||`) केवल Signal के लिए parse किए जाते हैं, जहाँ वे
SPOILER style ranges में map होते हैं। अन्य चैनल उन्हें plain text मानते हैं।

## Channel formatter कैसे जोड़ें या update करें

1. **एक बार parse करें:** channel-appropriate
   options (autolink, heading style, blockquote prefix) के साथ साझा `markdownToIR(...)` helper का उपयोग करें।
2. **Render करें:** `renderMarkdownWithMarkers(...)` और
   style marker map (या Signal style ranges) के साथ renderer implement करें।
3. **Chunk करें:** rendering से पहले `chunkMarkdownIR(...)` call करें; हर chunk को render करें।
4. **Adapter wire करें:** नए chunker
   और renderer का उपयोग करने के लिए channel outbound adapter update करें।
5. **Test करें:** अगर चैनल chunking का उपयोग करता है तो format tests और outbound delivery test add या update करें।

## Common gotchas

- Slack angle-bracket tokens (`<@U123>`, `<#C123>`, `<https://...>`) को
  संरक्षित रखना चाहिए; raw HTML को सुरक्षित रूप से escape करें।
- Telegram HTML में broken markup से बचने के लिए tags के बाहर text escape करना आवश्यक है।
- Signal style ranges UTF-16 offsets पर निर्भर करती हैं; code point offsets का उपयोग न करें।
- Fenced code blocks के लिए trailing newlines संरक्षित रखें ताकि closing markers
  अपनी ही line पर रहें।

## Related

<CardGroup cols={2}>
  <Card title="Streaming and chunking" href="/hi/concepts/streaming" icon="bars-staggered">
    आउटबाउंड streaming behavior, chunk boundaries, और channel-specific delivery।
  </Card>
  <Card title="System prompt" href="/hi/concepts/system-prompt" icon="message-lines">
    Conversation से पहले model क्या देखता है, जिसमें injected workspace files शामिल हैं।
  </Card>
</CardGroup>
