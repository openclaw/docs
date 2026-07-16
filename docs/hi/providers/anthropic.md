---
read_when:
    - आप OpenClaw में Anthropic मॉडल का उपयोग करना चाहते हैं
    - आप युग्मित कंप्यूटरों पर Claude CLI या Claude Desktop सत्र ब्राउज़ करना चाहते हैं
summary: OpenClaw में API कुंजियों या Claude CLI के माध्यम से Anthropic Claude का उपयोग करें
title: Anthropic
x-i18n:
    generated_at: "2026-07-16T16:31:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a61b4585092586727df48f7b809be73d80b0a9f1400294e76aea1b48313a216
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic **Claude** मॉडल परिवार बनाता है। OpenClaw दो प्रमाणीकरण मार्गों का समर्थन करता है:

- **API कुंजी** - उपयोग-आधारित बिलिंग के साथ Anthropic API तक सीधी पहुँच (`anthropic/*` मॉडल)
- **Claude CLI** - उसी होस्ट पर मौजूदा Claude Code लॉगिन का पुनः उपयोग

## उपयोग और लागत की ट्रैकिंग

OpenClaw उपलब्ध Anthropic क्रेडेंशियल का पता लगाता है और उससे मेल खाने वाला उपयोग इंटरफ़ेस चुनता है:

- Claude सदस्यता/सेटअप क्रेडेंशियल कोटा अवधियाँ और वैकल्पिक अतिरिक्त-उपयोग बजट दिखाते हैं।
- `ANTHROPIC_ADMIN_KEY` या `ANTHROPIC_ADMIN_API_KEY` Control UI के **उपयोग** में प्रदाता द्वारा रिपोर्ट की गई संगठन की 30 दिनों की लागत और Messages API उपयोग दिखाता है, जिसमें दैनिक खर्च, टोकन/कैश योग, शीर्ष मॉडल और लागत श्रेणियाँ शामिल हैं।
- Anthropic प्रदाता प्रोफ़ाइल में संग्रहीत `sk-ant-admin...` क्रेडेंशियल को स्वचालित रूप से Admin API कुंजी के रूप में पहचाना जाता है।

Admin API लागत इतिहास Anthropic के [उपयोग और लागत API](https://platform.claude.com/docs/en/manage-claude/usage-cost-api) से आता है। यह प्रदाता की वास्तविक बिलिंग है और OpenClaw की सत्र-व्युत्पन्न अनुमानित लागत से अलग है।

<Warning>
OpenClaw का Claude CLI बैकएंड इंस्टॉल किए गए Claude Code CLI को
गैर-संवादात्मक प्रिंट मोड (`claude -p`) में चलाता है। Anthropic के वर्तमान Claude Code दस्तावेज़
इस मोड को Agent SDK/प्रोग्रामेटिक उपयोग बताते हैं। Anthropic के 15 जून, 2026 के
समर्थन अपडेट ने अलग Agent SDK बिलिंग के घोषित बदलाव को रोक दिया: Claude
Agent SDK, `claude -p`, और तृतीय-पक्ष ऐप का उपयोग अब भी साइन-इन की गई
सदस्यता की उपयोग सीमाओं से लिया जाता है, और पहले घोषित मासिक Agent SDK
क्रेडिट तब तक उपलब्ध नहीं है, जब तक Anthropic उस योजना को संशोधित कर रहा है।

संवादात्मक Claude Code अब भी साइन-इन किए गए Claude प्लान की सीमाओं से उपयोग करता है।
API कुंजी प्रमाणीकरण प्रत्यक्ष उपयोगानुसार-भुगतान बिलिंग है और उस प्लान पर निर्भर नहीं करता।
लंबे समय तक चलने वाले Gateway होस्ट, साझा स्वचालन और अनुमानित उत्पादन
खर्च के लिए Anthropic API कुंजी का उपयोग करें।

Anthropic के वर्तमान सहायता लेख OpenClaw
रिलीज़ के बिना इस व्यवहार को बदल सकते हैं:

- [Claude Code CLI संदर्भ](https://code.claude.com/docs/en/cli-usage)
- [अपने Claude प्लान के साथ Claude Agent SDK का उपयोग करें](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [अपने Pro या Max प्लान के साथ Claude Code का उपयोग करें](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [अपने Team या Enterprise प्लान के साथ Claude Code का उपयोग करें](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Claude Code की लागत प्रबंधित करें](https://code.claude.com/docs/en/costs)

</Warning>

## आरंभ करना

<Tabs>
  <Tab title="API कुंजी">
    **इसके लिए सर्वोत्तम:** मानक API पहुँच और उपयोग-आधारित बिलिंग।

    <Steps>
      <Step title="अपनी API कुंजी प्राप्त करें">
        [Anthropic Console](https://console.anthropic.com/) में एक API कुंजी बनाएँ।
      </Step>
      <Step title="ऑनबोर्डिंग चलाएँ">
        ```bash
        openclaw onboard
        # चुनें: Anthropic API कुंजी
        ```

        या कुंजी सीधे दें:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="सत्यापित करें कि मॉडल उपलब्ध है">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### कॉन्फ़िग उदाहरण

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **इसके लिए सर्वोत्तम:** अलग API कुंजी के बिना मौजूदा Claude CLI लॉगिन का पुनः उपयोग।

    <Steps>
      <Step title="सुनिश्चित करें कि Claude CLI इंस्टॉल है और उसमें लॉगिन किया गया है">
        इससे सत्यापित करें:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="ऑनबोर्डिंग चलाएँ">
        ```bash
        openclaw onboard
        # चुनें: Claude CLI
        ```

        OpenClaw मौजूदा Claude CLI क्रेडेंशियल का पता लगाकर उनका पुनः उपयोग करता है।
      </Step>
      <Step title="सत्यापित करें कि मॉडल उपलब्ध है">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude CLI बैकएंड के सेटअप और रनटाइम विवरण [CLI बैकएंड](/hi/gateway/cli-backends) में हैं।
    </Note>

    <Warning>
    Claude CLI के पुनः उपयोग के लिए OpenClaw प्रक्रिया का उसी होस्ट पर चलना आवश्यक है, जिस पर
    Claude CLI लॉगिन है। Docker इंस्टॉलेशन कंटेनर होम को स्थायी रख सकते हैं और
    वहाँ Claude Code में लॉगिन कर सकते हैं; देखें
    [Docker में Claude CLI बैकएंड](/hi/install/docker#claude-cli-backend-in-docker)।
    [Podman](/hi/install/podman) जैसे अन्य कंटेनर इंस्टॉलेशन सेटअप या रनटाइम में होस्ट के
    `~/.claude` को माउंट नहीं करते; वहाँ Anthropic API कुंजी का उपयोग करें या
    OpenClaw-प्रबंधित OAuth वाला कोई प्रदाता चुनें, जैसे
    [OpenAI Codex](/hi/providers/openai)।
    </Warning>

    ### सेटअप टोकन प्राप्त करें

    Claude Code इंस्टॉल वाली किसी भी मशीन पर `claude setup-token` चलाएँ। यह
    `sk-ant-oat01-` से शुरू होने वाला दीर्घकालिक टोकन प्रिंट करता है।

    ऑनबोर्डिंग के दौरान macOS ऐप में **Connect with an API key or token** के अंतर्गत
    **Anthropic setup-token** चुनकर टोकन पेस्ट करें, या इसका उपयोग करें:

    ```bash
    openclaw models auth login --provider anthropic --method setup-token
    ```

    ### कॉन्फ़िग उदाहरण

    CLI रनटाइम ओवरराइड के साथ मानक Anthropic मॉडल संदर्भ को प्राथमिकता दें:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    संगतता के लिए पुराने `claude-cli/claude-opus-4-7` मॉडल संदर्भ अब भी काम करते हैं,
    लेकिन नए कॉन्फ़िग में प्रदाता/मॉडल चयन को
    `anthropic/*` के रूप में रखना चाहिए और निष्पादन बैकएंड को प्रदाता/मॉडल रनटाइम नीति में रखना चाहिए।

    ### बिलिंग और `claude -p`

    OpenClaw Claude CLI रन के लिए Claude Code के गैर-संवादात्मक `claude -p` पथ का
    उपयोग करता है। Anthropic वर्तमान में उस पथ को Agent SDK/प्रोग्रामेटिक उपयोग मानता है:

    - Anthropic के 15 जून, 2026 के समर्थन अपडेट ने पहले घोषित
      अलग Agent SDK क्रेडिट योजना को रोक दिया।
    - सदस्यता-प्लान वाले Claude Agent SDK, `claude -p`, और तृतीय-पक्ष ऐप का उपयोग
      अब भी साइन-इन की गई सदस्यता की उपयोग सीमाओं से लिया जाता है।
    - पहले घोषित मासिक Agent SDK क्रेडिट तब तक उपलब्ध नहीं है, जब तक
      Anthropic उस योजना को संशोधित कर रहा है।
    - Console/API-कुंजी लॉगिन उपयोगानुसार-भुगतान API बिलिंग का उपयोग करते हैं और उन्हें
      सदस्यता वाला Agent SDK क्रेडिट नहीं मिलता।

रोक की सूचना के लिए Anthropic का [Agent SDK प्लान
    लेख](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    और सदस्यता व्यवहार के लिए Claude Code प्लान संबंधी
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    तथा
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
    लेख देखें।

    Anthropic OpenClaw रिलीज़ के बिना Claude Code की बिलिंग और दर-सीमा व्यवहार को
    बदल सकता है। जब बिलिंग की पूर्वानुमेयता महत्वपूर्ण हो, तो `claude auth status`, `/status`, और
    Anthropic के लिंक किए गए दस्तावेज़ देखें।

    <Tip>
    साझा उत्पादन स्वचालन के लिए Claude CLI के बजाय Anthropic API कुंजी का उपयोग करें।
    OpenClaw
    [OpenAI Codex](/hi/providers/openai), [Qwen Cloud](/hi/providers/qwen),
    [MiniMax](/hi/providers/minimax), और [Z.AI / GLM](/hi/providers/zai) के
    सदस्यता-शैली विकल्पों का भी समर्थन करता है।
    </Tip>

  </Tab>
</Tabs>

## विभिन्न कंप्यूटरों पर Claude सत्र

बंडल किया गया Anthropic Plugin सामान्य सत्र
साइडबार में **Claude Code** समूह जोड़ता है। पंक्तियाँ सामान्य चैट फलक में खुलती हैं। यह Gateway और कनेक्ट किए गए Node होस्ट पर
गैर-अभिलेखित Claude Code सत्रों का पता लगाता है:

- Claude CLI सत्र मान्य प्रोजेक्ट-इंडेक्स रिकॉर्ड और वर्तमान JSONL
  फ़ाइलों से आते हैं, जिनका सीमित मेटाडेटा उपसर्ग `~/.claude/projects/` के अंतर्गत किसी गैर-साइडचेन `sdk-cli`
  सत्र की पहचान करता है।
- जब Claude Desktop का मेटाडेटा उसी Claude Code सत्र ID की ओर इंगित करता है, तो उसके सत्र Desktop शीर्षक, गतिविधि समय और
  अभिलेख स्थिति का उपयोग करते हैं।
- केवल-CLI सत्र में अभिलेख फ़्लैग नहीं होता, इसलिए उसकी
  ट्रांसक्रिप्ट मौजूद रहने तक वह दिखाई देता है।

खोज के लिए किसी अतिरिक्त OpenClaw कॉन्फ़िग की आवश्यकता नहीं है। Anthropic Plugin
बंडल किया गया है और डिफ़ॉल्ट रूप से सक्षम है; जब स्थानीय `~/.claude/projects/` डायरेक्टरी मौजूद होती है, तो मूल macOS Node केवल-पढ़ने योग्य
Claude सत्र कमांड उपलब्ध होने की सूचना देता है।
वे कमांड पहली बार दिखाई देने पर Node पेयरिंग अपग्रेड को स्वीकृति दें।

साइडबार पंक्तियों को उनके Gateway या पेयर किए गए Node होस्ट के अनुसार समूहित करता है, प्रत्येक होस्ट के
नवीनतम सीमित पृष्ठ से शुरू करता है और सामान्य 30-सेकंड
अंतराल पर रीफ़्रेश करता है। अधिक इतिहास वाले प्रत्येक होस्ट के लिए अगला पृष्ठ जोड़ने हेतु कैटलॉग समूह के नीचे **और सत्र लोड करें** का उपयोग करें;
जोड़ी गई पंक्तियाँ दिखाई देती रहती हैं और रीफ़्रेश के दौरान उसी गहराई तक
दोबारा प्राप्त की जाती हैं। कैटलॉग क्लाइंट
`sessions.catalog.list` का उपयोग करते हैं; पंक्ति खोलने में `sessions.catalog.read` का उपयोग होता है।

टर्मिनल नियंत्रण ग्रहण करना, सेवा/डेमन PATH से पहले स्वामी होस्ट उपयोगकर्ता के लॉगिन-शेल
PATH से `claude` को हल करता है। इससे ऐप द्वारा आरंभ किए गए सत्र उसी
Claude CLI के अनुरूप रहते हैं, जो ऑपरेटर को सामान्य टर्मिनल में मिलता है।

किसी पंक्ति को चुनने पर पहले ट्रांसक्रिप्ट का नवीनतम पृष्ठ पढ़ा जाता है। **ट्रांसक्रिप्ट के पुराने
आइटम लोड करें** एक अपारदर्शी बाइट कर्सर का अनुसरण करता है और पूरा इतिहास लोड करने के बजाय
JSONL फ़ाइल का एक और सीमित अनुभाग पढ़ता है। सामान्य उपयोगकर्ता, सहायक,
रीज़निंग, टूल-कॉल और टूल-परिणाम सामग्री संरक्षित रहती है। Node/Gateway की सुरक्षा सीमा से
बड़ा कोई व्यक्तिगत आइटम स्पष्ट रूप से काटा हुआ चिह्नित किया जाता है।

Gateway-स्थानीय `claude-cli` पंक्ति के लिए सामान्य कंपोज़र में टाइप करने पर
`sessions.catalog.continue` कॉल होता है। OpenClaw स्थानीय कैटलॉग रिकॉर्ड को फिर से हल करता है,
मॉडल-लॉक मूल सत्र बनाता है या उसका पुनः उपयोग करता है, अधिकतम 200 दृश्यमान
आइटम या 512 KiB आयात करता है और Claude CLI बाइंडिंग को आरंभिक डेटा देता है। पहला टर्न
`--fork-session` के साथ फिर से शुरू होता है; Claude फ़ोर्क को एक नया सत्र ID देता है, इसलिए बाद के टर्न
फ़ोर्क का उपयोग करते हैं और स्रोत सत्र अछूता रहता है।

हेडलेस Node होस्ट भी नीचे दी गई Node-स्थानीय सेटिंग को सक्षम करके और Node होस्ट को पुनः आरंभ करके
अपनी Claude CLI पंक्तियों को जारी रखने योग्य बना सकता है:

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

Node केवल तभी `agent.cli.claude.run.v1` उपलब्ध होने की सूचना देता है, जब सेटिंग सक्षम हो
और उसका स्थानीय `claude` एक्ज़ीक्यूटेबल हल हो जाए। OpenClaw उस Node पर कैटलॉग
रिकॉर्ड को फिर से हल करता है, वही सीमित इतिहास आयात करता है और अपनाए गए
सत्र को Node तथा कैटलॉग द्वारा रिपोर्ट की गई कार्यशील डायरेक्टरी से बाँधता है। प्रत्येक टर्न उस Node की Claude फ़ाइलों और लॉगिन का उपयोग करते हुए
Node की वास्तविक `claude -p` प्रक्रिया चलाता है। Node की exec स्वीकृति नीति अब भी लागू होती है;
Gateway इस वैकल्पिक सक्षमकरण को बाध्य नहीं कर सकता।

Node निरंतरता v1 केवल एक बार के लिए है। इसमें Gateway लूपबैक MCP कॉन्फ़िग और
Gateway Skills Plugin आर्ग्युमेंट शामिल नहीं होते, यह Gateway ट्रांसक्रिप्ट से फिर से आरंभिक डेटा नहीं लेता और
अटैचमेंट तथा इमेज अस्वीकार करता है। Claude Desktop पंक्तियाँ केवल देखने योग्य रहती हैं। मूल
macOS ऐप Node भी तब तक केवल देखने योग्य रहते हैं, जब तक ऐप रन कमांड उपलब्ध होने की सूचना नहीं देता।

<Note>
पेयर किए गए Node के Claude सत्र तब तक केवल-पढ़ने योग्य रहते हैं, जब तक हेडलेस Node स्पष्ट रूप से
`agent.cli.claude.run.v1` उपलब्ध होने की सूचना नहीं देता। OpenClaw कभी भी Claude Desktop
मेटाडेटा को संशोधित नहीं करता या Claude सत्रों को अभिलेखित नहीं करता। पृष्ठ के लिए लेखन स्कोप वाला ऑपरेटर कनेक्शन
आवश्यक है, क्योंकि यह प्रमाणित `node.invoke` का उपयोग करता है; सूची और पठन
निरंतरता-सक्षम Node पर भी केवल-पढ़ने योग्य रहते हैं।
</Note>

Node कमांड और सुरक्षा सीमा के लिए [Node: Claude सत्र और ट्रांसक्रिप्ट](/hi/nodes#claude-sessions-and-transcripts)
देखें।

## चिंतन के डिफ़ॉल्ट (Claude Sonnet 5, Mythos 5, Fable 5, 4.8, और 4.6)

`anthropic/claude-sonnet-5` डिफ़ॉल्ट रूप से `high` प्रयास स्तर पर अनुकूली चिंतन का उपयोग करता है।
चिंतन अक्षम करने के लिए `/think off`, या मॉडल के
उच्चतर मूल प्रयास स्तरों के लिए `/think xhigh|max` का उपयोग करें। OpenClaw Sonnet 5 के लिए मैन्युअल चिंतन बजट, कस्टम
सैंपलिंग पैरामीटर, सहायक प्रीफ़िल और Priority Tier को छोड़ देता है, क्योंकि
Anthropic इस मॉडल पर इन अनुरोध सुविधाओं का समर्थन नहीं करता।
कैटलॉग 31 अगस्त, 2026 तक Anthropic की आरंभिक `$2/$10` इनपुट/आउटपुट कीमत का उपयोग करता है;
मानक `$3/$15` कीमत 1 सितंबर, 2026 से शुरू होती है।

`anthropic/claude-fable-5` हमेशा अनुकूली चिंतन का उपयोग करता है और डिफ़ॉल्ट रूप से `high`
प्रयास स्तर का उपयोग करता है। Anthropic इस मॉडल के लिए चिंतन अक्षम करने की अनुमति नहीं देता, इसलिए
`/think off` और `/think minimal` इसके बजाय `low` प्रयास स्तर से मैप होते हैं। OpenClaw
Fable 5 अनुरोधों के लिए कस्टम तापमान मान भी छोड़ देता है, क्योंकि Anthropic
चिंतन-सक्षम किसी भी अनुरोध पर तापमान ओवरराइड अस्वीकार करता है।

`anthropic/claude-mythos-5` सीमित पहुँच वाला मॉडल है, जिसमें वही हमेशा-सक्रिय
अनुकूली-चिंतन अनुबंध है। OpenClaw डिफ़ॉल्ट रूप से `high` का उपयोग करता है, `/think off` और
`/think minimal` को `low` से मैप करता है, और कॉलर द्वारा चुने गए सैंपलिंग पैरामीटर छोड़ देता है।
कैटलॉग इसकी 1,000,000-टोकन कॉन्टेक्स्ट विंडो, 128,000-टोकन आउटपुट
सीमा, इमेज इनपुट और `$10/$50` इनपुट/आउटपुट कीमत प्रकाशित करता है।

OpenClaw में Claude Opus 4.8 डिफ़ॉल्ट रूप से चिंतन बंद रखता है। जब आप
`/think high|xhigh|max` से अनुकूली चिंतन स्पष्ट रूप से सक्षम करते हैं, तो OpenClaw
Anthropic के Opus 4.8 प्रयास मान भेजता है; Claude 4.6 मॉडल (Opus 4.6 और Sonnet 4.6)
डिफ़ॉल्ट रूप से `adaptive` का उपयोग करते हैं।

प्रत्येक संदेश के लिए `/think:<level>` से या मॉडल पैरामीटर में ओवरराइड करें:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
संबंधित Anthropic दस्तावेज़:
- [अनुकूली चिंतन](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [विस्तारित चिंतन](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## सुरक्षा अस्वीकृति फ़ॉलबैक (Claude Fable 5)

<Warning>
Claude Fable 5 का उपयोग करने का अर्थ Claude Opus 4.8 का भी उपयोग करना है। Fable 5 में
ऐसे सुरक्षा क्लासिफ़ायर शामिल हैं जो किसी अनुरोध को अस्वीकार कर सकते हैं, और Anthropic द्वारा स्वीकृत
रिकवरी विधि उस टर्न को `claude-opus-4-8` से पूरा करवाना है। OpenClaw सीधे API-कुंजी अनुरोधों के लिए
इसे स्वचालित रूप से सक्षम करता है, इसलिए Fable के कुछ टर्न का उत्तर
Claude Opus 4.8 देता है और उनका बिल भी उसी के रूप में बनता है। यदि आपकी नीति या बजट
Opus द्वारा पूरे किए गए टर्न स्वीकार नहीं कर सकता, तो `anthropic/claude-fable-5` न चुनें।
</Warning>

### यह क्यों मौजूद है

Fable 5 के क्लासिफ़ायर प्रतिबंधित डोमेन के अनुरोधों पर `stop_reason: "refusal"`
लौटाते हैं, और वे हानिरहित कार्यों से मिलते-जुलते काम पर भी गलत सकारात्मक परिणाम देते हैं (सुरक्षा
टूलिंग, जीवन विज्ञान, या मॉडल से उसका अपरिष्कृत तर्क दोहराने के लिए कहना भी)।
फ़ॉलबैक के बिना, टर्न त्रुटि के साथ समाप्त हो जाता है, भले ही
कोई दूसरा Claude मॉडल उसे आसानी से पूरा कर सकता हो - Anthropic का अपना अस्वीकृति संदेश
API इंटीग्रेटरों को फ़ॉलबैक मॉडल कॉन्फ़िगर करने के लिए कहता है।

### यह कैसे काम करता है

1. `anthropic/claude-fable-5` को भेजे जाने वाले प्रत्येक सीधे API-कुंजी अनुरोध के लिए, OpenClaw
   Anthropic की सर्वर-साइड फ़ॉलबैक सहमति भेजता है: 
   `server-side-fallback-2026-06-01` बीटा हेडर और
   `fallbacks: [{"model": "claude-opus-4-8"}]`। Claude Opus 4.8 ही एकमात्र
   फ़ॉलबैक लक्ष्य है जिसकी Anthropic Fable 5 के लिए अनुमति देता है।
2. केवल सुरक्षा-क्लासिफ़ायर द्वारा अस्वीकृति से फ़ॉलबैक ट्रिगर होता है। दर सीमाएँ,
   ओवरलोड और सर्वर त्रुटियाँ पहले की तरह ही व्यवहार करती हैं और
   OpenClaw के सामान्य [मॉडल फ़ेलओवर](/hi/concepts/model-failover) से होकर गुजरती हैं।
3. रिकवरी उसी कॉल के भीतर होती है। किसी भी आउटपुट से पहले हुई अस्वीकृति
   विलंबता के अतिरिक्त दिखाई नहीं देती; पूरा उत्तर Opus 4.8 से आता है। स्ट्रीम के
   बीच में अस्वीकृति होने पर आंशिक टेक्स्ट उस उपसर्ग के रूप में रखा जाता है जहाँ से फ़ॉलबैक
   मॉडल आगे जारी रखता है, जबकि अस्वीकृत मॉडल का तर्क और टूल कॉल
   Anthropic के रीप्ले नियमों के अनुसार हटा दिए जाते हैं (उन्हें वापस प्रतिध्वनित या
   निष्पादित नहीं किया जाना चाहिए)।
4. यदि Claude Opus 4.8 भी अस्वीकार करता है, तो टर्न अस्वीकृति को
   त्रुटि के रूप में दिखाता है, ठीक वैसे ही जैसे इस सुविधा से पहले होता था।

फ़ॉलबैक Anthropic API स्तर पर होता है, इसलिए `claude-opus-4-8` को
आपकी कॉन्फ़िगर की गई मॉडल सूची या फ़ॉलबैक शृंखला में होने की आवश्यकता नहीं है - Fable-सक्षम
API कुंजी हमेशा Opus का उपयोग कर सकती है।

### प्रेक्षणीयता और बिलिंग

- फ़ॉलबैक द्वारा पूरे किए गए टर्न में सहायक संदेश पर `provider_fallback` डायग्नोस्टिक दर्ज होता है,
  जिसमें `fromModel` और `toModel` का नाम होता है, और संदेश का
  `responseModel`, `claude-opus-4-8` रिपोर्ट करता है।
- Anthropic प्रत्येक प्रयास के अनुसार बिल करता है: आउटपुट से पहले हुई अस्वीकृति निःशुल्क होती है और रिकवरी
  का बिल Claude Opus 4.8 की दरों पर बनता है (वर्तमान में Fable 5 की दरों का आधा)। मिलान बनाए रखने के लिए OpenClaw का
  प्रति-टर्न लागत अनुमान फ़ॉलबैक द्वारा पूरे किए गए टर्न की कीमत Opus की दरों पर लगाता है।
- स्ट्रीम के बीच में हुई अस्वीकृति पर Anthropic पहले से स्ट्रीम किए गए Fable के आंशिक आउटपुट का
  अतिरिक्त बिल भी बनाता है; वह भाग API के प्रति-प्रयास
  उपयोग में रिपोर्ट होता है, लेकिन OpenClaw के प्रति-टर्न अनुमान में शामिल नहीं किया जाता।

### दायरा

यह `api.anthropic.com` के विरुद्ध API-कुंजी प्रमाणीकरण वाले
`anthropic/claude-fable-5` पर लागू होता है। OAuth (Claude CLI सदस्यता का पुनः उपयोग), प्रॉक्सी बेस URL,
Bedrock, Vertex और Foundry अनुरोध अपरिवर्तित रहते हैं और वहाँ
अस्वीकृतियों को अब भी त्रुटियों के रूप में दिखाते हैं।

लाइव सत्यापित: Fable 5 से उसका अपरिष्कृत विचार-क्रम दोहराने के लिए कहने वाला एक हानिरहित प्रॉम्प्ट
फ़ॉलबैक के बिना भेजे जाने पर `category: "reasoning_extraction"` के साथ अस्वीकार होता है,
और OpenClaw के माध्यम से वही प्रॉम्प्ट संलग्न `provider_fallback` डायग्नोस्टिक के साथ
Opus द्वारा दिया गया सामान्य उत्तर लौटाता है।

मूलभूत व्यवहार के लिए Anthropic की [अस्वीकृतियाँ और फ़ॉलबैक
मार्गदर्शिका](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback) देखें।

## प्रॉम्प्ट कैशिंग

OpenClaw API-कुंजी प्रमाणीकरण के लिए Anthropic की प्रॉम्प्ट कैशिंग सुविधा का समर्थन करता है।

| मान               | कैश अवधि | विवरण                            |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (डिफ़ॉल्ट) | 5 मिनट      | API-कुंजी प्रमाणीकरण के लिए स्वचालित रूप से लागू |
| `"long"`            | 1 घंटा         | विस्तारित कैश                         |
| `"none"`            | कोई कैशिंग नहीं     | प्रॉम्प्ट कैशिंग अक्षम करें                 |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="प्रति-एजेंट कैश ओवरराइड">
    मॉडल-स्तरीय पैरामीटर को आधाररेखा के रूप में उपयोग करें, फिर `agents.list[].params` के माध्यम से विशिष्ट एजेंटों को ओवरराइड करें:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    कॉन्फ़िग मर्ज क्रम:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (मिलान करने वाला `id`, कुंजी के अनुसार ओवरराइड करता है)

    इससे एक एजेंट लंबे समय तक बने रहने वाला कैश रख सकता है, जबकि उसी मॉडल पर दूसरा एजेंट अचानक बढ़ने वाले/कम पुनः उपयोग वाले ट्रैफ़िक के लिए कैशिंग अक्षम कर सकता है।

  </Accordion>

  <Accordion title="Bedrock Claude संबंधी टिप्पणियाँ">
    - Bedrock (`amazon-bedrock/*anthropic.claude*`) पर Anthropic Claude मॉडल कॉन्फ़िगर किए जाने पर `cacheRetention` पास-थ्रू स्वीकार करते हैं।
    - गैर-Anthropic Bedrock मॉडल को रनटाइम पर अनिवार्य रूप से `cacheRetention: "none"` पर सेट किया जाता है।
    - कोई स्पष्ट मान सेट न होने पर API-कुंजी के स्मार्ट डिफ़ॉल्ट Claude-on-Bedrock संदर्भों के लिए `cacheRetention: "short"` भी आरंभिक रूप से सेट करते हैं।

  </Accordion>
</AccordionGroup>

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="तेज़ मोड">
    OpenClaw का साझा `/fast` टॉगल API-कुंजी के सीधे ट्रैफ़िक के लिए Anthropic के `service_tier` फ़ील्ड को `api.anthropic.com` पर सेट करता है।

    | कमांड | इसमें मैप होता है |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - केवल API कुंजी से किए गए सीधे `api.anthropic.com` अनुरोधों पर लागू होता है। OAuth/सब्सक्रिप्शन-टोकन अनुरोधों और प्रॉक्सी रूटों को कभी भी `service_tier` फ़ील्ड नहीं मिलता।
    - दोनों सेट होने पर स्पष्ट `serviceTier` या `service_tier` पैरामीटर `/fast` को ओवरराइड करते हैं।
    - Priority Tier क्षमता के बिना खातों पर `service_tier: "auto"`, `standard` में परिणत हो सकता है।

    </Note>

  </Accordion>

  <Accordion title="मीडिया की समझ (चित्र और PDF)">
    बंडल किया गया Anthropic Plugin चित्र और PDF की समझ पंजीकृत करता है। OpenClaw
    कॉन्फ़िगर किए गए Anthropic प्रमाणीकरण से मीडिया क्षमताओं को स्वतः निर्धारित करता है; किसी
    अतिरिक्त कॉन्फ़िगरेशन की आवश्यकता नहीं है।

    | गुण             | मान                   |
    | --------------- | --------------------- |
    | डिफ़ॉल्ट मॉडल   | `claude-opus-4-8`     |
    | समर्थित इनपुट   | चित्र, PDF दस्तावेज़ |

    किसी वार्तालाप में चित्र या PDF संलग्न होने पर OpenClaw उसे स्वचालित रूप से
    Anthropic मीडिया-समझ प्रदाता के माध्यम से रूट करता है।

  </Accordion>

  <Accordion title="1M कॉन्टेक्स्ट विंडो">
    Claude Sonnet 5, Mythos 5 और Fable 5 में ठीक 1,000,000-टोकन की इनपुट
    विंडो है और ये अधिकतम 128,000 आउटपुट टोकन का समर्थन करते हैं। Anthropic की 1M कॉन्टेक्स्ट
    विंडो अनुकूली चिंतन वाले Claude 4.x मॉडलों पर भी GA है: Opus 4.8,
    Opus 4.7, Opus 4.6 और Sonnet 4.6। OpenClaw इन मॉडलों का आकार
    स्वचालित रूप से निर्धारित करता है, `params.context1m` की आवश्यकता नहीं है:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-5": {},
            "anthropic/claude-mythos-5": {},
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    पुराने कॉन्फ़िग `params.context1m: true` बनाए रख सकते हैं; इन मॉडलों के लिए इसका
    कोई प्रभाव नहीं पड़ता और OpenClaw अब निष्क्रिय किए गए
    `context-1m-2025-08-07` बीटा हेडर को किसी भी स्थिति में नहीं भेजता। उस मान वाली पुरानी `anthropicBeta` कॉन्फ़िग
    प्रविष्टियाँ अनुरोध हेडर निर्धारित करते समय हटा दी जाती हैं और
    असमर्थित पुराने Claude मॉडल अपनी सामान्य कॉन्टेक्स्ट विंडो पर बने रहते हैं।

    Claude CLI बैकएंड
    (`claude-cli/*`) के लिए `params.context1m: true` भी इसी प्रकार व्यवहार करता है: योग्य GA-समर्थ Opus और Sonnet मॉडलों को पहले से ही
    1M विंडो स्वचालित रूप से मिलती है, इसलिए वहाँ भी यह पैरामीटर वैकल्पिक है।

    <Warning>
    आपके Anthropic क्रेडेंशियल पर लंबे कॉन्टेक्स्ट की पहुँच आवश्यक है। OAuth/सब्सक्रिप्शन टोकन प्रमाणीकरण अपने आवश्यक Anthropic बीटा हेडर बनाए रखता है, लेकिन पुराने कॉन्फ़िग में निष्क्रिय किया गया 1M बीटा हेडर रह जाने पर OpenClaw उसे हटा देता है।
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 का 1M कॉन्टेक्स्ट">
    `anthropic/claude-opus-4-8` और इसके `claude-cli` वैरिएंट में डिफ़ॉल्ट रूप से 1M कॉन्टेक्स्ट
    विंडो होती है; `params.context1m: true` की आवश्यकता नहीं है।
  </Accordion>
</AccordionGroup>

## समस्या निवारण

<AccordionGroup>
  <Accordion title="401 त्रुटियाँ / टोकन अचानक अमान्य">
    Anthropic टोकन प्रमाणीकरण की समय-सीमा समाप्त होती है और इसे निरस्त किया जा सकता है। नए सेटअप के लिए इसके बजाय Anthropic API कुंजी का उपयोग करें।
  </Accordion>

  <Accordion title='प्रदाता "anthropic" के लिए कोई API कुंजी नहीं मिली'>
    Anthropic प्रमाणीकरण **प्रति एजेंट** होता है; नए एजेंट मुख्य एजेंट की कुंजियाँ इनहेरिट नहीं करते। उस एजेंट के लिए ऑनबोर्डिंग दोबारा चलाएँ (या Gateway होस्ट पर API कुंजी कॉन्फ़िगर करें), फिर `openclaw models status` से सत्यापित करें।
  </Accordion>

  <Accordion title='प्रोफ़ाइल "anthropic:default" के लिए कोई क्रेडेंशियल नहीं मिला'>
    कौन-सी प्रमाणीकरण प्रोफ़ाइल सक्रिय है, यह देखने के लिए `openclaw models status` चलाएँ। ऑनबोर्डिंग दोबारा चलाएँ या उस प्रोफ़ाइल पथ के लिए API कुंजी कॉन्फ़िगर करें।
  </Accordion>

  <Accordion title="कोई उपलब्ध प्रमाणीकरण प्रोफ़ाइल नहीं (सभी कूलडाउन में हैं)">
    `auth.unusableProfiles` के लिए `openclaw models status --json` जाँचें। Anthropic की दर-सीमा वाले कूलडाउन मॉडल-विशिष्ट हो सकते हैं, इसलिए उसी समूह का कोई अन्य Anthropic मॉडल अब भी उपयोग योग्य हो सकता है। कोई अन्य Anthropic प्रोफ़ाइल जोड़ें या कूलडाउन समाप्त होने की प्रतीक्षा करें।
  </Accordion>
</AccordionGroup>

<Note>
अधिक सहायता: [समस्या निवारण](/hi/help/troubleshooting) और [अक्सर पूछे जाने वाले प्रश्न](/hi/help/faq)।
</Note>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल संदर्भों और फ़ेलओवर व्यवहार का चयन।
  </Card>
  <Card title="CLI बैकएंड" href="/hi/gateway/cli-backends" icon="terminal">
    Claude CLI बैकएंड का सेटअप और रनटाइम विवरण।
  </Card>
  <Card title="प्रॉम्प्ट कैशिंग" href="/hi/reference/prompt-caching" icon="database">
    विभिन्न प्रदाताओं में प्रॉम्प्ट कैशिंग कैसे काम करती है।
  </Card>
  <Card title="OAuth और प्रमाणीकरण" href="/hi/gateway/authentication" icon="key">
    प्रमाणीकरण विवरण और क्रेडेंशियल के पुनः उपयोग के नियम।
  </Card>
</CardGroup>
