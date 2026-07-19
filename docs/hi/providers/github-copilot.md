---
read_when:
    - आप GitHub Copilot को मॉडल प्रदाता के रूप में उपयोग करना चाहते हैं
    - आपको `openclaw models auth login-github-copilot` प्रवाह की आवश्यकता है
    - आप बिल्ट-इन Copilot प्रदाता, Copilot SDK हार्नेस और Copilot Proxy में से चुन रहे हैं
summary: डिवाइस प्रवाह या गैर-संवादात्मक टोकन आयात का उपयोग करके OpenClaw से GitHub Copilot में साइन इन करें
title: GitHub Copilot
x-i18n:
    generated_at: "2026-07-19T09:31:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e731d46dd387bbecb0219c4ec3e319fb8d07fd4017da8035561f110501587ad4
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot, GitHub का AI कोडिंग सहायक है। यह आपके GitHub खाते और योजना के लिए Copilot
मॉडल तक पहुँच प्रदान करता है। OpenClaw, Copilot को मॉडल
प्रदाता या एजेंट रनटाइम के रूप में तीन अलग-अलग तरीकों से उपयोग कर सकता है।

## OpenClaw में Copilot का उपयोग करने के तीन तरीके

<Tabs>
  <Tab title="अंतर्निहित प्रदाता (github-copilot)">
    GitHub टोकन प्राप्त करने के लिए मूल डिवाइस-लॉगिन प्रवाह का उपयोग करें, फिर OpenClaw के चलने पर
    उसे Copilot API टोकन से बदलें। यह **डिफ़ॉल्ट** और सबसे सरल तरीका है
    क्योंकि इसके लिए VS Code की आवश्यकता नहीं होती।

    <Steps>
      <Step title="लॉगिन कमांड चलाएँ">
        ```bash
        openclaw models auth login-github-copilot
        ```

        आपको एक URL पर जाने और एक बार उपयोग होने वाला कोड दर्ज करने के लिए कहा जाएगा।
        प्रक्रिया पूरी होने तक टर्मिनल खुला रखें।
      </Step>
      <Step title="डिफ़ॉल्ट मॉडल सेट करें">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        या कॉन्फ़िगरेशन में:

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

  <Tab title="Copilot SDK हार्नेस plugin (copilot)">
    जब आप चाहते हैं कि चुने गए `github-copilot/*` मॉडल के निम्न-स्तरीय एजेंट लूप का
    स्वामित्व GitHub के Copilot CLI और SDK के पास हो, तब बाहरी
    `@openclaw/copilot` plugin इंस्टॉल करें।

    ```bash
    openclaw plugins install @openclaw/copilot
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

    इसका चयन तब करें, जब आप उन एजेंट टर्न के लिए मूल Copilot CLI सत्र,
    SDK-प्रबंधित थ्रेड स्थिति और Copilot के स्वामित्व वाला Compaction चाहते हों। स्पष्ट
    `agentRuntime` सहमति के बिना, `github-copilot/*` मॉडल
    अंतर्निहित प्रदाता का उपयोग जारी रखते हैं। पूर्ण रनटाइम अनुबंध के लिए
    [Copilot SDK हार्नेस](/hi/plugins/copilot) देखें।

  </Tab>

  <Tab title="Copilot Proxy plugin (copilot-proxy)">
    स्थानीय ब्रिज के रूप में **Copilot Proxy** VS Code एक्सटेंशन का उपयोग करें। OpenClaw,
    प्रॉक्सी के `/v1` एंडपॉइंट (डिफ़ॉल्ट `http://localhost:3000/v1`) से संचार करता है और आपके द्वारा
    कॉन्फ़िगर की गई मॉडल सूची का उपयोग करता है।

    `copilot-proxy` plugin, OpenClaw के साथ आता है और डिफ़ॉल्ट रूप से सक्षम होता है।
    बेस URL और मॉडल ID को इससे कॉन्फ़िगर करें:

    ```bash
    openclaw models auth login --provider copilot-proxy --set-default
    ```

    <Note>
    इसका चयन तब करें, जब आप पहले से VS Code में Copilot Proxy चला रहे हों या उसके माध्यम से
    रूटिंग करने की आवश्यकता हो। VS Code एक्सटेंशन का चलते रहना आवश्यक है।
    </Note>

  </Tab>
</Tabs>

## GitHub Enterprise (डेटा निवास)

यदि आपका संगठन डेटा-निवास वाले GitHub Enterprise टेनेंट का उपयोग करता है (जैसे
`your-org.ghe.com` जैसा कोई `*.ghe.com` होस्ट), तो Copilot सार्वजनिक
`github.com` के बजाय टेनेंट-स्थानीय एंडपॉइंट पर रहता है। OpenClaw इसे
प्रथम-श्रेणी के प्रमाणीकरण विकल्प के रूप में उपलब्ध कराता है, इसलिए आपको URL हाथ से संपादित करने की आवश्यकता नहीं होती।

<Steps>
  <Step title="Enterprise प्रमाणीकरण विकल्प चुनें">
    ऑनबोर्डिंग या `openclaw models auth` में,
    **GitHub Copilot (Enterprise / डेटा निवास)** चुनें। आपसे आपका
    Enterprise डोमेन (उदाहरण के लिए `your-org.ghe.com`) पूछा जाएगा, फिर डिवाइस
    लॉगिन उस टेनेंट के विरुद्ध चलेगा।

    केवल टेनेंट रूट (`your-org.ghe.com`) दर्ज करें। `api.your-org.ghe.com` या
    `copilot-api.your-org.ghe.com` जैसे व्युत्पन्न सेवा होस्ट स्वीकार नहीं किए जाते;
    OpenClaw उन एंडपॉइंट को टेनेंट रूट से स्वचालित रूप से प्राप्त करता है।

    ```bash
    openclaw models auth login --provider github-copilot --method device-enterprise
    ```

  </Step>
  <Step title="डोमेन कॉन्फ़िगरेशन में सहेजा जाता है">
    चुना गया होस्ट प्रदाता पैरामीटर के अंतर्गत संग्रहीत होता है, ताकि बाद के टोकन रीफ़्रेश
    और कम्प्लीशन स्वचालित रूप से टेनेंट को लक्षित करें:

    ```json5
    {
      models: {
        providers: {
          "github-copilot": { params: { githubDomain: "your-org.ghe.com" } },
        },
      },
    }
    ```

  </Step>
</Steps>

डिवाइस प्रवाह, टोकन विनिमय और कम्प्लीशन क्रमशः
`https://your-org.ghe.com/login/device/code`,
`https://api.your-org.ghe.com/copilot_internal/v2/token` और
`https://copilot-api.your-org.ghe.com` पर रिज़ॉल्व होते हैं। डेटा-निवास टोकन में
टेनेंट स्टैम्प होता है और कोई प्रॉक्सी संकेत नहीं होता, इसलिए कम्प्लीशन बेस URL सार्वजनिक एंडपॉइंट के बजाय
टेनेंट Copilot होस्ट पर फ़ॉलबैक करता है।

<Note>
डोमेन बदलने पर डिवाइस लॉगिन हमेशा दोबारा चलता है। यदि आपके पास पहले से संग्रहीत
Copilot टोकन है और आप कोई अलग डोमेन चुनते हैं (सार्वजनिक `github.com` ↔ कोई `*.ghe.com`
टेनेंट, या एक टेनेंट से दूसरे टेनेंट पर), तो OpenClaw मौजूदा टोकन का पुनः उपयोग नहीं करेगा —
यह नया लॉगिन अनिवार्य करता है, ताकि टोकन उस डोमेन तक सीमित हो जिसे
कॉन्फ़िगरेशन में लिखा जा रहा है। *उसी* डोमेन के लिए लॉगिन दोबारा चलाने पर मौजूदा
टोकन के पुनः उपयोग का विकल्प अभी भी मिलता है। सार्वजनिक `github.com` पर वापस जाने से संग्रहीत
`githubDomain` साफ़ हो जाता है, ताकि कॉन्फ़िगरेशन डिफ़ॉल्ट स्थिति में लौट आए।
</Note>

<Note>
`COPILOT_GITHUB_DOMAIN` पर्यावरण चर, इसे रिज़ॉल्व करने वाले प्रत्येक Copilot पथ के लिए
रिज़ॉल्व किए गए डोमेन को ओवरराइड करता है — Enterprise डिवाइस लॉगिन
(`--method device-enterprise`), स्वतंत्र
`openclaw models auth login-github-copilot` शॉर्टकट, टोकन रीफ़्रेश, एम्बेडिंग
और कम्प्लीशन। पूरी तरह हेडलेस या CI सेटअप के लिए इसे अपने `*.ghe.com` होस्ट पर सेट करें।
सार्वजनिक `github.com` का उपयोग करने के लिए इसे सेट न करें (और कॉन्फ़िगरेशन पैरामीटर भी अनुपस्थित रखें)।
लॉगिन उस डोमेन को सहेजते हैं जिसके लिए उन्होंने टोकन बनाया था (और सार्वजनिक
`github.com` के विरुद्ध लॉगिन करते समय उसे साफ़ कर देते हैं), इसलिए पर्यावरण चर हटाए जाने के बाद भी
रूटिंग सही रहती है।
</Note>

## वैकल्पिक फ़्लैग

| कमांड                                                                | फ़्लैग            | विवरण                                          |
| ---------------------------------------------------------------------- | --------------- | ---------------------------------------------------- |
| `openclaw models auth login-github-copilot`                            | `--yes`         | बिना पूछे मौजूदा प्रमाणीकरण प्रोफ़ाइल को ओवरराइट करें |
| `openclaw models auth login --provider github-copilot --method device` | `--set-default` | प्रदाता का अनुशंसित डिफ़ॉल्ट मॉडल भी लागू करें  |

```bash
# दोबारा लॉगिन की पुष्टि छोड़ें
openclaw models auth login-github-copilot --yes

# एक ही चरण में लॉगिन करें और डिफ़ॉल्ट मॉडल सेट करें
openclaw models auth login --provider github-copilot --method device --set-default
```

## गैर-इंटरैक्टिव ऑनबोर्डिंग

डिवाइस-लॉगिन प्रवाह के लिए इंटरैक्टिव TTY आवश्यक है। हेडलेस सेटअप के लिए,
`openclaw onboard --non-interactive` के साथ मौजूदा GitHub OAuth एक्सेस टोकन आयात करें:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

आप `--auth-choice` को छोड़ भी सकते हैं; `--github-copilot-token` देने पर
GitHub Copilot प्रदाता का प्रमाणीकरण विकल्प स्वचालित रूप से निर्धारित हो जाता है। यदि फ़्लैग छोड़ दिया जाता है, तो ऑनबोर्डिंग
`COPILOT_GITHUB_TOKEN`, फिर `GH_TOKEN`, और फिर `GITHUB_TOKEN` पर फ़ॉलबैक करती है।
`auth-profiles.json` में सामान्य पाठ के बजाय पर्यावरण-समर्थित
`tokenRef` संग्रहीत करने के लिए `COPILOT_GITHUB_TOKEN` सेट करके
`--secret-input-mode ref` का उपयोग करें।

<AccordionGroup>
  <Accordion title="इंटरैक्टिव TTY आवश्यक है">
    डिवाइस-लॉगिन प्रवाह के लिए इंटरैक्टिव TTY आवश्यक है। इसे किसी गैर-इंटरैक्टिव स्क्रिप्ट या
    CI पाइपलाइन में नहीं, बल्कि सीधे टर्मिनल में चलाएँ।
  </Accordion>

  <Accordion title="मॉडल की उपलब्धता आपकी योजना पर निर्भर करती है">
    Copilot मॉडल की उपलब्धता आपकी GitHub योजना पर निर्भर करती है। यदि कोई मॉडल
    अस्वीकार हो जाता है, तो कोई अन्य ID आज़माएँ (उदाहरण के लिए `github-copilot/gpt-5.5`)। मौजूदा मॉडल सूची के लिए
    GitHub की [प्रत्येक Copilot योजना के लिए समर्थित मॉडल](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)
    देखें।
  </Accordion>

  <Accordion title="Copilot API से लाइव कैटलॉग रीफ़्रेश">
    डिवाइस-लॉगिन (या पर्यावरण-चर) प्रमाणीकरण पथ द्वारा GitHub टोकन रिज़ॉल्व कर लिए जाने के बाद,
    OpenClaw माँग पर `${baseUrl}/models` से मॉडल कैटलॉग रीफ़्रेश करता है
    (वही एंडपॉइंट जिसका उपयोग VS Code Copilot करता है), ताकि रनटाइम
    मेनिफ़ेस्ट में बार-बार बदलाव किए बिना प्रत्येक खाते की पात्रता और सटीक कॉन्टेक्स्ट विंडो को ट्रैक करे।
    नए प्रकाशित Copilot मॉडल OpenClaw अपग्रेड के बिना दिखाई देने लगते हैं,
    और कॉन्टेक्स्ट विंडो वास्तविक प्रति-मॉडल सीमाएँ दर्शाती हैं
    (उदाहरण के लिए gpt-5.x शृंखला के लिए 400k और आंतरिक
    `claude-opus-*-1m` वेरिएंट के लिए 1M)।

    जब डिस्कवरी अक्षम हो, उपयोगकर्ता के पास कोई GitHub प्रमाणीकरण प्रोफ़ाइल न हो, टोकन-विनिमय
    विफल हो जाए या `/models` HTTPS कॉल में त्रुटि आए, तब बंडल किया गया स्थिर कैटलॉग
    दृश्यमान फ़ॉलबैक बना रहता है। इससे बाहर निकलकर पूरी तरह
    स्थिर मेनिफ़ेस्ट कैटलॉग पर निर्भर रहने के लिए (ऑफ़लाइन / एयर-गैप्ड परिदृश्य):

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
    Claude मॉडल ID स्वचालित रूप से Anthropic Messages ट्रांसपोर्ट का उपयोग करते हैं।
    Gemini मॉडल OpenAI Chat Completions ट्रांसपोर्ट का उपयोग करते हैं; GPT और o-series
    मॉडल OpenAI Responses ट्रांसपोर्ट का उपयोग जारी रखते हैं। OpenClaw मॉडल रेफ़रेंस के आधार पर
    सही ट्रांसपोर्ट चुनता है।
  </Accordion>

  <Accordion title="अनुरोध संगतता">
    OpenClaw, Copilot ट्रांसपोर्ट पर Copilot IDE-शैली के अनुरोध हेडर भेजता है
    (VS Code संपादक/plugin संस्करण और `vscode-chat` एकीकरण ID),
    टूल-परिणाम के फ़ॉलो-अप टर्न को एजेंट द्वारा आरंभ किए गए के रूप में चिह्नित करता है, और किसी टर्न में
    इमेज इनपुट होने पर Copilot विज़न हेडर सेट करता है।
  </Accordion>

  <Accordion title="पर्यावरण चर रिज़ॉल्यूशन क्रम">
    OpenClaw निम्न प्राथमिकता क्रम में पर्यावरण चरों से Copilot प्रमाणीकरण
    रिज़ॉल्व करता है:

    | प्राथमिकता | चर              | टिप्पणियाँ                            |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | सर्वोच्च प्राथमिकता, Copilot-विशिष्ट |
    | 2        | `GH_TOKEN`            | GitHub CLI टोकन (फ़ॉलबैक)      |
    | 3        | `GITHUB_TOKEN`        | मानक GitHub टोकन (सबसे कम)   |

    जब एक से अधिक चर सेट हों, तो OpenClaw सर्वोच्च प्राथमिकता वाले चर का उपयोग करता है।
    डिवाइस-लॉगिन प्रवाह (`openclaw models auth login-github-copilot`) अपना टोकन
    प्रमाणीकरण प्रोफ़ाइल स्टोर में संग्रहीत करता है और सभी पर्यावरण चरों पर प्राथमिकता रखता है।

  </Accordion>

  <Accordion title="टोकन संग्रहण">
    लॉगिन, प्रमाणीकरण प्रोफ़ाइल स्टोर में GitHub टोकन संग्रहीत करता है (प्रोफ़ाइल ID
    `github-copilot:github`) और OpenClaw के चलने पर उसे अल्पकालिक Copilot API
    टोकन से बदलता है। आपको टोकन को मैन्युअल रूप से प्रबंधित करने की आवश्यकता नहीं है।
  </Accordion>
</AccordionGroup>

## मेमोरी खोज एम्बेडिंग

GitHub Copilot, [मेमोरी खोज](/hi/concepts/memory-search) के लिए एम्बेडिंग प्रदाता के रूप में भी
कार्य कर सकता है। यदि आपके पास Copilot सदस्यता है और आपने लॉगिन किया हुआ है, तो OpenClaw
अलग API कुंजी के बिना एम्बेडिंग के लिए इसका उपयोग कर सकता है।

### कॉन्फ़िगरेशन

GitHub Copilot एम्बेडिंग का उपयोग करने के लिए `memorySearch.provider` स्पष्ट रूप से सेट करें। यदि
GitHub टोकन उपलब्ध है, तो OpenClaw Copilot API से उपलब्ध एम्बेडिंग मॉडल खोजता है
और स्वचालित रूप से सबसे अच्छा मॉडल चुनता है।

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // वैकल्पिक: स्वचालित रूप से खोजे गए मॉडल को ओवरराइड करें
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### यह कैसे काम करता है

1. OpenClaw आपके GitHub टोकन को रिज़ॉल्व करता है (पर्यावरण चरों या प्रमाणीकरण प्रोफ़ाइल से)।
2. इसे अल्पकालिक Copilot API टोकन से बदलता है।
3. उपलब्ध एम्बेडिंग मॉडल खोजने के लिए Copilot के `/models` एंडपॉइंट को क्वेरी करता है।
4. सबसे अच्छा मॉडल चुनता है (वरीयता क्रम: `text-embedding-3-small`,
   `text-embedding-3-large`, `text-embedding-ada-002`)।
5. Copilot के `/embeddings` एंडपॉइंट पर एम्बेडिंग अनुरोध भेजता है।

मॉडल की उपलब्धता आपकी GitHub योजना पर निर्भर करती है। यदि कोई एम्बेडिंग मॉडल
उपलब्ध नहीं है, तो OpenClaw Copilot को छोड़कर अगले प्रदाता को आज़माता है।

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल संदर्भों और फ़ेलओवर व्यवहार का चयन।
  </Card>
  <Card title="OAuth और प्रमाणीकरण" href="/hi/gateway/authentication" icon="key">
    प्रमाणीकरण विवरण और क्रेडेंशियल के पुनः उपयोग के नियम।
  </Card>
</CardGroup>
