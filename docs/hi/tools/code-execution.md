---
read_when:
    - आप `code_execution` को सक्षम या कॉन्फ़िगर करना चाहते हैं
    - आप स्थानीय शेल एक्सेस के बिना रिमोट विश्लेषण चाहते हैं
    - आप x_search या web_search को रिमोट Python विश्लेषण के साथ संयोजित करना चाहते हैं
summary: 'code_execution: xAI के साथ सैंडबॉक्सयुक्त रिमोट Python विश्लेषण चलाएँ'
title: कोड निष्पादन
x-i18n:
    generated_at: "2026-07-19T09:55:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1ab391daed9154f113535e6d241c45d5c08c22abdc012148a9f0f2ae5ec548b3
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` xAI के Responses API पर सैंडबॉक्स किए गए रिमोट Python विश्लेषण चलाता है
(`https://api.x.ai/v1/responses`, वही एंडपॉइंट जिसका उपयोग `x_search` करता है)। इसे
बंडल किए गए `xai` Plugin द्वारा `tools` अनुबंध के अंतर्गत पंजीकृत किया जाता है।

<Warning>
  `code_execution` xAI के सर्वरों पर चलता है। xAI प्रति 1,000 टूल कॉल के लिए $5,
  साथ ही मॉडल के इनपुट और आउटपुट टोकन का शुल्क लेता है।
</Warning>

| गुण                | मान                                                                               |
| ------------------ | --------------------------------------------------------------------------------- |
| टूल का नाम         | `code_execution`                                                                  |
| प्रदाता Plugin     | `xai` (बंडल किया गया, `enabledByDefault: true`)                                         |
| प्रमाणीकरण         | xAI प्रमाणीकरण प्रोफ़ाइल, `XAI_API_KEY`, या `plugins.entries.xai.config.webSearch.apiKey` |
| डिफ़ॉल्ट मॉडल      | `grok-4.3`                                                                        |
| डिफ़ॉल्ट टाइमआउट   | 30 सेकंड                                                                         |
| डिफ़ॉल्ट `maxTurns` | सेट नहीं (xAI अपनी आंतरिक सीमा लागू करता है)                                    |

इसका उपयोग गणनाओं, सारणीकरण, त्वरित सांख्यिकी और चार्ट-शैली के
विश्लेषण के लिए करें, जिसमें `x_search` या `web_search` द्वारा लौटाया गया डेटा भी शामिल है। इसे
स्थानीय फ़ाइलों, आपके शेल, आपके रिपॉज़िटरी या युग्मित डिवाइसों तक कोई
पहुँच नहीं है और यह कॉल के बीच स्थिति को बनाए नहीं रखता, इसलिए प्रत्येक कॉल को
नोटबुक सत्र नहीं, बल्कि अल्पकालिक विश्लेषण मानें। नवीनतम X डेटा के लिए, पहले
[`x_search`](/hi/tools/web#x_search) चलाएँ और परिणाम इसमें पाइप करें।

स्थानीय निष्पादन के लिए, इसके बजाय [`exec`](/hi/tools/exec) का उपयोग करें।

## सेटअप

<Steps>
  <Step title="xAI क्रेडेंशियल प्रदान करें">
    OAuth के लिए पात्र SuperGrok या X Premium सदस्यता आवश्यक है
    (डिवाइस-कोड सत्यापन, इसलिए यह लोकलहोस्ट कॉलबैक के बिना रिमोट होस्ट से
    काम करता है):

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    नए इंस्टॉलेशन के दौरान, यही विकल्प ऑनबोर्डिंग में उपलब्ध होता है:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    या API कुंजी:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

    या कॉन्फ़िगरेशन के माध्यम से:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              webSearch: {
                apiKey: "xai-...",
              },
            },
          },
        },
      },
    }
    ```

    इन तीनों में से कोई भी `x_search` और Grok `web_search` को भी सक्षम करता है।

  </Step>

  <Step title="code_execution सक्षम और समायोजित करें">
    `enabled` को छोड़ दिए जाने पर, `code_execution` केवल तभी उपलब्ध कराया जाता है जब सक्रिय
    मॉडल का प्रदाता `xai` हो और xAI क्रेडेंशियल मिल जाएँ। ज्ञात गैर-xAI प्रदाता
    वाले सक्रिय मॉडल के लिए, विभिन्न प्रदाताओं के बीच उपयोग को सक्षम करने हेतु
    `plugins.entries.xai.config.codeExecution.enabled` को `true` पर सेट करें।
    यदि सक्रिय मॉडल प्रदाता अनुपस्थित या अनिर्धारित है,
    तो टूल छिपा रहता है। इसे प्रत्येक प्रदाता के लिए अक्षम करने हेतु `enabled` को
    `false` पर सेट करें। xAI क्रेडेंशियल हमेशा आवश्यक होते हैं।

    मॉडल, टर्न सीमा या टाइमआउट को ओवरराइड करने के लिए इसी ब्लॉक का उपयोग करें:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true, // ज्ञात गैर-xAI मॉडल प्रदाता के लिए आवश्यक
                model: "grok-4.3", // डिफ़ॉल्ट xAI कोड-निष्पादन मॉडल को ओवरराइड करें
                maxTurns: 2,            // आंतरिक टूल टर्न की वैकल्पिक सीमा
                timeoutSeconds: 30,     // अनुरोध टाइमआउट (डिफ़ॉल्ट: 30)
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Gateway पुनः आरंभ करें">
    ```bash
    openclaw gateway restart
    ```

    xAI Plugin के दोबारा पंजीकृत होने और ऊपर दिए गए प्रदाता, सक्षमता तथा प्रमाणीकरण
    जाँचों के सफल होने के बाद `code_execution` एजेंट की टूल सूची में दिखाई देता है।

  </Step>
</Steps>

## इसका उपयोग कैसे करें

विश्लेषण का उद्देश्य स्पष्ट करें; टूल केवल एक `task` पैरामीटर लेता है,
इसलिए पूरा अनुरोध और कोई भी इनलाइन डेटा एक ही प्रॉम्प्ट में भेजें:

```text
इन संख्याओं के लिए 7-दिवसीय चल औसत की गणना करने हेतु code_execution का उपयोग करें: ...
```

```text
इस सप्ताह OpenClaw का उल्लेख करने वाली पोस्ट खोजने के लिए x_search का उपयोग करें, फिर उन्हें दिन के अनुसार गिनने के लिए code_execution का उपयोग करें।
```

```text
नवीनतम AI बेंचमार्क संख्याएँ एकत्र करने के लिए web_search का उपयोग करें, फिर प्रतिशत परिवर्तनों की तुलना करने के लिए code_execution का उपयोग करें।
```

## त्रुटियाँ

प्रमाणीकरण के बिना, टूल एक संरचित JSON त्रुटि लौटाता है (थ्रो किया गया
अपवाद नहीं), ताकि एजेंट स्वयं सुधार कर सके:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution के लिए xAI क्रेडेंशियल आवश्यक हैं। Grok से साइन इन करने के लिए `openclaw onboard --auth-choice xai-oauth` चलाएँ, `openclaw onboard --auth-choice xai-api-key` चलाएँ, Gateway परिवेश में `XAI_API_KEY` सेट करें, या `plugins.entries.xai.config.webSearch.apiKey` कॉन्फ़िगर करें।",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## संबंधित

<CardGroup cols={2}>
  <Card title="Exec टूल" href="/hi/tools/exec" icon="terminal">
    आपकी मशीन या युग्मित Node पर स्थानीय शेल निष्पादन।
  </Card>
  <Card title="Exec अनुमोदन" href="/hi/tools/exec-approvals" icon="shield">
    शेल निष्पादन के लिए अनुमति/अस्वीकृति नीति।
  </Card>
  <Card title="वेब टूल" href="/hi/tools/web" icon="globe">
    `web_search`, `x_search`, और `web_fetch`।
  </Card>
  <Card title="xAI प्रदाता" href="/hi/providers/xai" icon="microchip">
    Grok मॉडल, वेब/X खोज और कोड निष्पादन कॉन्फ़िगरेशन।
  </Card>
</CardGroup>
