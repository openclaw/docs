---
read_when:
    - अनुपलब्ध __name हेल्पर का उल्लेख करने वाले tsx/esbuild लोडर क्रैश की जाँच करना
summary: ऐतिहासिक Node + tsx "__name is not a function" क्रैश और उसका कारण
title: Node + tsx क्रैश
x-i18n:
    generated_at: "2026-07-16T14:40:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 97d2f62d24860cee65753027ba84c14c8d4ffb910ee17bb0032cf0409c427589
    source_path: debug/node-issue.md
    workflow: 16
---

# Node + tsx "\_\_name is not a function" क्रैश

## स्थिति

समाधान हो चुका है। यह क्रैश
`package.json` (`4.22.3`) में पिन किए गए मौजूदा `tsx` संस्करण या मौजूदा Node रिलीज़ पर पुनरुत्पादित नहीं होता। इसे यहाँ इसलिए रखा गया है, ताकि भविष्य में
`tsx`/esbuild अपग्रेड द्वारा इसे फिर से उत्पन्न किए जाने पर संदर्भ उपलब्ध रहे।

## मूल लक्षण

`tsx` के माध्यम से OpenClaw डेवलपमेंट स्क्रिप्ट चलाना स्टार्टअप पर इस त्रुटि के साथ विफल हुआ:

```text
[openclaw] CLI शुरू करने में विफल: TypeError: __name कोई फ़ंक्शन नहीं है
    createSubsystemLogger पर (src/logging/subsystem.ts)
    <caller> पर (src/agents/auth-profiles/constants.ts)
```

पंक्ति संख्याएँ छोड़ दी गई हैं; मूल क्रैश के बाद से दोनों फ़ाइलें बदल चुकी हैं
और विशिष्ट पंक्तियाँ अब मेल नहीं खातीं।

यह समस्या डेवलपमेंट स्क्रिप्ट द्वारा Bun को वैकल्पिक बनाने के लिए Bun से `tsx` (`2871657e`,
2026-01-06) पर स्विच किए जाने के बाद दिखाई दी। समकक्ष Bun-आधारित पथ क्रैश नहीं हुआ।
यह मूल रूप से macOS पर Node v25.3.0 में देखी गई थी; Node 25 चलाने वाले अन्य प्लेटफ़ॉर्म के भी
प्रभावित होने की संभावना मानी गई थी।

## कारण

`tsx`, अपने ट्रांसफ़ॉर्म विकल्पों में `keepNames: true` को हार्डकोड करके esbuild के माध्यम से TS/ESM को ट्रांसफ़ॉर्म करता है। यह सेटिंग esbuild से नामित फ़ंक्शन/क्लास
घोषणाओं को `__name` सहायक के कॉल में रैप करवाती है, ताकि `fn.name` मिनिफ़िकेशन
और बंडलिंग के बाद भी बना रहे। क्रैश का अर्थ है कि प्रभावित `tsx`/Node संयोजन में उस मॉड्यूल के कॉल
स्थल पर सहायक अनुपस्थित था या किसी अन्य परिभाषा से छिप गया था, इसलिए `__name(...)` ने रैप किया गया मान लौटाने के बजाय
त्रुटि फेंकी।

## वर्तमान पुनरुत्पादन जाँच

```bash
node --version
pnpm install
node --import tsx src/entry.ts status
```

न्यूनतम पृथक पुनरुत्पादन (मूल स्टैक ट्रेस से केवल मॉड्यूल लोड करता है):

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

दोनों कमांड वर्तमान में बिना त्रुटि के समाप्त होते हैं। यदि कोई भी फिर से `__name is not a
function` फेंकता है, तो अपस्ट्रीम में रिपोर्ट दर्ज करने से पहले सटीक Node संस्करण, `tsx` संस्करण
(`node_modules/tsx/package.json`) और पूरा स्टैक ट्रेस कैप्चर करें।

## वैकल्पिक उपाय (यदि क्रैश वापस आता है)

- डेवलपमेंट स्क्रिप्ट को `node --import tsx` के बजाय Bun के साथ चलाएँ।
- टाइप जाँच के लिए `pnpm tsgo` चलाएँ, फिर `tsx` के माध्यम से स्रोत चलाने के बजाय
  निर्मित आउटपुट चलाएँ:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- किसी अलग `tsx` संस्करण को आज़माएँ (`pnpm add -D tsx@<version>` एक निर्भरता
  परिवर्तन है और रिपॉज़िटरी नीति के अनुसार अनुमोदन आवश्यक है), ताकि यह विभाजित करके पता लगाया जा सके कि उसके द्वारा बंडल किए गए esbuild
  संस्करण ने बग को फिर से उत्पन्न किया है या नहीं।
- किसी अलग Node मेजर/माइनर संस्करण पर परीक्षण करके देखें कि विफलता किसी विशिष्ट संस्करण
  तक सीमित है या नहीं।

## संदर्भ

- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## संबंधित

- [Node.js इंस्टॉल करना](/hi/install/node)
- [Gateway समस्या निवारण](/hi/gateway/troubleshooting)
