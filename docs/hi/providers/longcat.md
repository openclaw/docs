---
read_when:
    - आप OpenClaw के साथ LongCat-2.0 का उपयोग करना चाहते हैं
    - आपको LongCat API कुंजी या मॉडल सीमाओं की आवश्यकता है
summary: LongCat-2.0 के लिए LongCat API सेटअप
title: LongCat
x-i18n:
    generated_at: "2026-07-19T09:16:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7c447f9c42e6547a69d2124debcb685c32fe59de29bfc551e18e791d9f280584
    source_path: providers/longcat.md
    workflow: 16
---

[LongCat](https://longcat.ai) LongCat-2.0 के लिए एक होस्टेड API प्रदान करता है, जो
कोडिंग और एजेंटिक कार्यभारों के लिए बनाया गया एक रीजनिंग मॉडल है। OpenClaw, LongCat के
OpenAI-संगत एंडपॉइंट के लिए आधिकारिक `longcat` Plugin प्रदान करता है।

| गुण        | मान                                |
| ---------- | ---------------------------------- |
| प्रदाता    | `longcat`                 |
| प्रमाणीकरण | `LONGCAT_API_KEY`                 |
| API        | OpenAI-संगत Chat Completions       |
| आधार URL   | `https://api.longcat.chat/openai`                 |
| मॉडल       | `longcat/LongCat-2.0`                 |
| कॉन्टेक्स्ट | 1,048,576 टोकन                    |
| अधिकतम आउटपुट | 131,072 टोकन                   |
| इनपुट      | टेक्स्ट                            |

## Plugin इंस्टॉल करें

आधिकारिक पैकेज इंस्टॉल करें, फिर Gateway को पुनः आरंभ करें:

```bash
openclaw plugins install @openclaw/longcat-provider
openclaw gateway restart
```

## शुरुआत करना

<Steps>
  <Step title="API कुंजी बनाएँ">
    [LongCat API Platform](https://longcat.chat/platform/) में साइन इन करें और
    [API Keys](https://longcat.chat/platform/api_keys)
    पेज पर एक कुंजी बनाएँ।
  </Step>
  <Step title="ऑनबोर्डिंग चलाएँ">
    ```bash
    openclaw onboard --auth-choice longcat-api-key
    ```
  </Step>
  <Step title="मॉडल सत्यापित करें">
    ```bash
    openclaw models list --provider longcat
    ```
  </Step>
</Steps>

यदि कोई प्राथमिक मॉडल पहले से कॉन्फ़िगर नहीं है, तो ऑनबोर्डिंग होस्टेड कैटलॉग जोड़ता है और
`longcat/LongCat-2.0` चुनता है।

### गैर-इंटरैक्टिव सेटअप

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice longcat-api-key \
  --longcat-api-key "$LONGCAT_API_KEY"
```

## रीजनिंग व्यवहार

LongCat बाइनरी थिंकिंग नियंत्रण उपलब्ध कराता है। OpenClaw सक्षम थिंकिंग स्तरों को
`thinking: { type: "enabled" }` और `/think off` को
`thinking: { type: "disabled" }` से मैप करता है। LongCat वर्तमान में
`reasoning_effort` का दस्तावेज़ीकरण नहीं करता, इसलिए OpenClaw इसे नहीं भेजता।

LongCat, `reasoning_content` में रीजनिंग लौटाता है। असिस्टेंट के टूल-कॉल टर्न को दोबारा चलाते समय
OpenClaw उस फ़ील्ड को बनाए रखता है, ताकि बहु-टर्न एजेंट सत्रों में
प्रदाता द्वारा अपेक्षित संदेश संरचना बनी रहे।

## मूल्य निर्धारण

बिल्ट-इन कैटलॉग प्रति दस लाख टोकन के लिए LongCat की उपयोगानुसार-भुगतान सूची कीमतों का उपयोग करता है:
बिना कैश वाला इनपुट $0.75, कैश वाला इनपुट $0.015 और आउटपुट $2.95। LongCat
अस्थायी छूट दे सकता है; [मूल्य निर्धारण पेज](https://longcat.chat/platform/docs/Pricing/LongCat-2.0.html)
और आपके बिलिंग रिकॉर्ड प्रामाणिक स्रोत हैं।

## स्वयं होस्ट किया गया LongCat-2.0

`longcat` प्रदाता LongCat के होस्टेड API को लक्षित करता है। [Hugging Face](https://huggingface.co/meituan-longcat/LongCat-2.0)
पर उपलब्ध ओपन वेट्स के लिए, मॉडल को OpenAI-संगत रनटाइम के माध्यम से सर्व करें और इसके बजाय
OpenClaw के मौजूदा [vLLM](/hi/providers/vllm) या [SGLang](/hi/providers/sglang) प्रदाता का उपयोग करें।

स्वयं होस्ट किए गए प्रदाता कैटलॉग में रनटाइम का सटीक मॉडल पहचानकर्ता बनाए रखें;
स्थानीय डिप्लॉयमेंट को `longcat/LongCat-2.0` के माध्यम से रूट न करें।

## समस्या निवारण

<AccordionGroup>
  <Accordion title="कुंजी शेल में काम करती है, लेकिन Gateway में नहीं">
    डेमन द्वारा प्रबंधित Gateway प्रक्रियाएँ प्रत्येक इंटरैक्टिव शेल
    वेरिएबल को इनहेरिट नहीं करतीं। `LONGCAT_API_KEY` को `~/.openclaw/.env` में रखें, इसे
    ऑनबोर्डिंग के माध्यम से कॉन्फ़िगर करें या अनुमोदित सीक्रेट संदर्भ का उपयोग करें।
  </Accordion>

  <Accordion title="अनुरोध 402 या 429 के साथ विफल होते हैं">
    `402` का अर्थ है कि खाते में पर्याप्त टोकन कोटा नहीं है। `429` का अर्थ है कि API
    कुंजी ने दर सीमा पार कर ली है। [LongCat उपयोग](https://longcat.chat/platform/usage)
    जाँचें और प्रदाता की बैकऑफ़ अवधि के बाद दर-सीमित अनुरोधों का पुनः प्रयास करें।
  </Accordion>

  <Accordion title="मॉडल दिखाई नहीं देता">
    `openclaw plugins list` चलाएँ और पुष्टि करें कि `longcat` Plugin
    सक्षम है, फिर `openclaw models list --provider longcat` चलाएँ।
  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल प्रदाता" href="/hi/concepts/model-providers" icon="layers">
    प्रदाता कॉन्फ़िगरेशन, मॉडल संदर्भ और फ़ेलओवर व्यवहार।
  </Card>
  <Card title="LongCat API दस्तावेज़" href="https://longcat.chat/platform/docs/" icon="arrow-up-right-from-square">
    होस्टेड API एंडपॉइंट, प्रमाणीकरण, सीमाएँ और उदाहरण।
  </Card>
  <Card title="LongCat-2.0 मॉडल कार्ड" href="https://huggingface.co/meituan-longcat/LongCat-2.0" icon="arrow-up-right-from-square">
    आर्किटेक्चर, डिप्लॉयमेंट मार्गदर्शन और मॉडल विवरण।
  </Card>
  <Card title="सीक्रेट" href="/hi/gateway/secrets" icon="key">
    कॉन्फ़िगरेशन में प्लेनटेक्स्ट एम्बेड किए बिना प्रदाता क्रेडेंशियल संग्रहित करें।
  </Card>
</CardGroup>
