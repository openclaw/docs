---
read_when:
    - आप GitHub Copilot को मॉडल प्रदाता के रूप में उपयोग करना चाहते हैं
    - आपको `openclaw models auth login-github-copilot` प्रवाह की आवश्यकता है
    - आप बिल्ट-इन Copilot provider, Copilot SDK harness, और Copilot Proxy के बीच चयन कर रहे हैं
summary: डिवाइस फ़्लो या गैर-इंटरैक्टिव टोकन इम्पोर्ट का उपयोग करके OpenClaw से GitHub Copilot में साइन इन करें
title: GitHub Copilot
x-i18n:
    generated_at: "2026-06-28T23:58:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0cd7103ec880592b1f4506ed844abe788f53040f3751e7034daf9aafedc2f94
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot, GitHub का AI कोडिंग सहायक है। यह आपके GitHub खाते और प्लान के लिए Copilot
मॉडलों तक पहुंच देता है। OpenClaw, Copilot को मॉडल
प्रदाता या एजेंट रनटाइम के रूप में तीन अलग-अलग तरीकों से इस्तेमाल कर सकता है।

## OpenClaw में Copilot इस्तेमाल करने के तीन तरीके

<Tabs>
  <Tab title="अंतर्निहित प्रदाता (github-copilot)">
    GitHub टोकन पाने के लिए मूल डिवाइस-लॉगिन प्रवाह इस्तेमाल करें, फिर OpenClaw चलने पर उसे
    Copilot API टोकनों से एक्सचेंज करें। यह **डिफ़ॉल्ट** और सबसे सरल रास्ता है
    क्योंकि इसके लिए VS Code की जरूरत नहीं होती।

    <Steps>
      <Step title="लॉगिन कमांड चलाएं">
        ```bash
        openclaw models auth login-github-copilot
        ```

        आपको एक URL पर जाने और एक बार इस्तेमाल होने वाला कोड दर्ज करने के लिए कहा जाएगा। पूरा होने तक
        टर्मिनल खुला रखें।
      </Step>
      <Step title="डिफ़ॉल्ट मॉडल सेट करें">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        या कॉन्फिग में:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Copilot SDK हार्नेस Plugin (copilot)">
    जब आप चुनिंदा `github-copilot/*` मॉडलों के लिए निम्न-स्तरीय एजेंट लूप का स्वामित्व GitHub के
    Copilot CLI और SDK को देना चाहते हैं, तो बाहरी `@openclaw/copilot` Plugin इंस्टॉल करें।

    ```bash
    openclaw plugins install clawhub:@openclaw/copilot
    ```

    फिर किसी मॉडल या प्रदाता को रनटाइम में शामिल करें:

    ```json5
    {
      agents: {
        defaults: {
          model: "github-copilot/gpt-5.5",
          models: {
            "github-copilot/gpt-5.5": {
              agentRuntime: { id: "copilot" },
            },
          },
        },
      },
    }
    ```

    इसे तब चुनें जब आप उन एजेंट टर्न के लिए मूल Copilot CLI सेशन, SDK-प्रबंधित थ्रेड
    स्थिति, और Copilot-स्वामित्व वाली Compaction चाहते हों। पूरे रनटाइम अनुबंध के लिए
    [Copilot SDK हार्नेस](/hi/plugins/copilot) देखें।

  </Tab>

  <Tab title="Copilot Proxy Plugin (copilot-proxy)">
    **Copilot Proxy** VS Code एक्सटेंशन को स्थानीय ब्रिज के रूप में इस्तेमाल करें। OpenClaw
    प्रॉक्सी के `/v1` एंडपॉइंट से बात करता है और वहां कॉन्फिगर की गई मॉडल सूची इस्तेमाल करता है।

    <Note>
    इसे तब चुनें जब आप पहले से VS Code में Copilot Proxy चला रहे हों या उसके माध्यम से रूट करना
    जरूरी हो। आपको Plugin सक्षम करना होगा और VS Code एक्सटेंशन चालू रखना होगा।
    </Note>

  </Tab>
</Tabs>

## वैकल्पिक फ्लैग

| फ्लैग           | विवरण                                               |
| --------------- | --------------------------------------------------- |
| `--yes`         | पुष्टि प्रॉम्प्ट छोड़ें                             |
| `--set-default` | प्रदाता का सुझाया गया डिफ़ॉल्ट मॉडल भी लागू करें    |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## गैर-इंटरैक्टिव ऑनबोर्डिंग

अगर आपके पास Copilot के लिए पहले से GitHub OAuth एक्सेस टोकन है, तो
हेडलैस सेटअप के दौरान इसे `openclaw onboard --non-interactive` के साथ इम्पोर्ट करें:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

आप `--auth-choice` छोड़ भी सकते हैं; `--github-copilot-token` पास करने से
GitHub Copilot प्रदाता प्रमाणीकरण विकल्प अनुमानित हो जाता है। अगर फ्लैग छोड़ा गया है, तो ऑनबोर्डिंग
`COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, फिर `GITHUB_TOKEN` पर वापस जाती है। `auth-profiles.json` में प्लेनटेक्स्ट के बजाय env-आधारित
`tokenRef` संग्रहीत करने के लिए `COPILOT_GITHUB_TOKEN` सेट करके
`--secret-input-mode ref` इस्तेमाल करें।

<AccordionGroup>
  <Accordion title="इंटरैक्टिव TTY जरूरी है">
    डिवाइस-लॉगिन प्रवाह के लिए इंटरैक्टिव TTY जरूरी है। इसे गैर-इंटरैक्टिव स्क्रिप्ट या CI पाइपलाइन में नहीं,
    सीधे टर्मिनल में चलाएं।
  </Accordion>

  <Accordion title="मॉडल उपलब्धता आपके प्लान पर निर्भर करती है">
    Copilot मॉडल उपलब्धता आपके GitHub प्लान पर निर्भर करती है। अगर कोई मॉडल
    अस्वीकार हो जाता है, तो दूसरा ID आजमाएं (उदाहरण के लिए `github-copilot/gpt-5.5`)। मौजूदा मॉडल सूची के लिए
    GitHub के [हर Copilot प्लान के समर्थित मॉडल](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)
    देखें।
  </Accordion>

  <Accordion title="Copilot API से लाइव कैटलॉग रिफ्रेश">
    जब डिवाइस-लॉगिन (या env-var) प्रमाणीकरण पथ GitHub टोकन हल कर लेता है,
    OpenClaw मांग पर `${baseUrl}/models` से मॉडल कैटलॉग रिफ्रेश करता है
    (वही एंडपॉइंट जिसे VS Code Copilot इस्तेमाल करता है), ताकि रनटाइम
    प्रति-खाता अधिकार और सटीक कॉन्टेक्स्ट विंडो को मैनिफेस्ट
    बदलाव के बिना ट्रैक करे। नए प्रकाशित Copilot मॉडल OpenClaw
    अपग्रेड के बिना दिखाई देने लगते हैं, और कॉन्टेक्स्ट विंडो वास्तविक प्रति-मॉडल सीमाओं को दर्शाती हैं
    (जैसे gpt-5.x शृंखला के लिए 400k, आंतरिक
    `claude-opus-*-1m` वैरिएंट के लिए 1M)।

    जब डिस्कवरी अक्षम हो, उपयोगकर्ता के पास GitHub प्रमाणीकरण प्रोफ़ाइल न हो, टोकन-एक्सचेंज
    विफल हो, या `/models` HTTPS कॉल में त्रुटि आए, तो बंडल किया गया स्थिर कैटलॉग दिखाई देने वाला फ़ॉलबैक बना रहता है। इससे बाहर निकलने और पूरी तरह
    स्थिर मैनिफेस्ट कैटलॉग पर निर्भर रहने के लिए (ऑफ़लाइन / एयर-गैप्ड परिदृश्य):

    ```json5
    {
      plugins: {
        entries: {
          "github-copilot": {
            config: { discovery: { enabled: false } },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="ट्रांसपोर्ट चयन">
    Claude मॉडल ID अपने-आप Anthropic Messages ट्रांसपोर्ट इस्तेमाल करते हैं। GPT,
    o-series, और Gemini मॉडल OpenAI Responses ट्रांसपोर्ट बनाए रखते हैं। OpenClaw
    मॉडल रेफ के आधार पर सही ट्रांसपोर्ट चुनता है।
  </Accordion>

  <Accordion title="अनुरोध संगतता">
    OpenClaw, Copilot ट्रांसपोर्ट पर Copilot IDE-शैली अनुरोध हेडर भेजता है,
    जिनमें अंतर्निहित Compaction, टूल-परिणाम, और इमेज फ़ॉलो-अप टर्न शामिल हैं। यह
    Copilot के लिए प्रदाता-स्तर Responses कंटिन्यूएशन सक्षम नहीं करता, जब तक
    उस व्यवहार को Copilot के API के विरुद्ध सत्यापित न किया गया हो।
  </Accordion>

  <Accordion title="पर्यावरण चर समाधान क्रम">
    OpenClaw निम्नलिखित प्राथमिकता क्रम में पर्यावरण चरों से Copilot प्रमाणीकरण हल करता है:

    | प्राथमिकता | चर                   | नोट्स                            |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | सर्वोच्च प्राथमिकता, Copilot-विशिष्ट |
    | 2        | `GH_TOKEN`            | GitHub CLI टोकन (फ़ॉलबैक)        |
    | 3        | `GITHUB_TOKEN`        | मानक GitHub टोकन (न्यूनतम)       |

    जब कई चर सेट हों, OpenClaw सर्वोच्च-प्राथमिकता वाले चर का इस्तेमाल करता है।
    डिवाइस-लॉगिन प्रवाह (`openclaw models auth login-github-copilot`) अपना
    टोकन प्रमाणीकरण प्रोफ़ाइल स्टोर में संग्रहीत करता है और सभी पर्यावरण
    चरों पर प्राथमिकता लेता है।

  </Accordion>

  <Accordion title="टोकन संग्रहण">
    लॉगिन एक GitHub टोकन को प्रमाणीकरण प्रोफ़ाइल स्टोर में संग्रहीत करता है और OpenClaw चलने पर उसे
    Copilot API टोकन से एक्सचेंज करता है। आपको टोकन को
    मैन्युअल रूप से प्रबंधित करने की जरूरत नहीं है।
  </Accordion>
</AccordionGroup>

<Warning>
डिवाइस-लॉगिन कमांड के लिए इंटरैक्टिव TTY जरूरी है। जब आपको हेडलैस सेटअप चाहिए हो, तो गैर-इंटरैक्टिव
ऑनबोर्डिंग इस्तेमाल करें।
</Warning>

## मेमोरी खोज एम्बेडिंग

GitHub Copilot, [मेमोरी खोज](/hi/concepts/memory-search) के लिए एम्बेडिंग प्रदाता के रूप में भी काम कर सकता है। अगर आपके पास Copilot सदस्यता है और
आपने लॉग इन किया हुआ है, तो OpenClaw अलग API कुंजी के बिना एम्बेडिंग के लिए इसका इस्तेमाल कर सकता है।

### कॉन्फिग

GitHub Copilot एम्बेडिंग इस्तेमाल करने के लिए `memorySearch.provider` को स्पष्ट रूप से सेट करें। अगर
GitHub टोकन उपलब्ध है, तो OpenClaw Copilot API से उपलब्ध एम्बेडिंग मॉडल खोजता है और
सबसे अच्छा मॉडल अपने-आप चुनता है।

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Optional: override the auto-discovered model
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### यह कैसे काम करता है

1. OpenClaw आपका GitHub टोकन हल करता है (env vars या प्रमाणीकरण प्रोफ़ाइल से)।
2. इसे अल्प-आयु Copilot API टोकन से एक्सचेंज करता है।
3. उपलब्ध एम्बेडिंग मॉडल खोजने के लिए Copilot `/models` एंडपॉइंट क्वेरी करता है।
4. सबसे अच्छा मॉडल चुनता है (`text-embedding-3-small` को प्राथमिकता देता है)।
5. एम्बेडिंग अनुरोध Copilot `/embeddings` एंडपॉइंट को भेजता है।

मॉडल उपलब्धता आपके GitHub प्लान पर निर्भर करती है। अगर कोई एम्बेडिंग मॉडल
उपलब्ध नहीं है, तो OpenClaw Copilot को छोड़कर अगले प्रदाता को आजमाता है।

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाता, मॉडल रेफ, और फेलओवर व्यवहार चुनना।
  </Card>
  <Card title="OAuth और प्रमाणीकरण" href="/hi/gateway/authentication" icon="key">
    प्रमाणीकरण विवरण और क्रेडेंशियल पुनः इस्तेमाल के नियम।
  </Card>
</CardGroup>
