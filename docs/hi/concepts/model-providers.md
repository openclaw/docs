---
read_when:
    - आपको हर प्रदाता के लिए मॉडल सेटअप संदर्भ चाहिए
    - आप मॉडल प्रदाताओं के लिए उदाहरण कॉन्फ़िगरेशन या CLI ऑनबोर्डिंग कमांड चाहते हैं
sidebarTitle: Model providers
summary: उदाहरण कॉन्फ़िगरेशन और CLI प्रवाहों सहित मॉडल प्रदाता का अवलोकन
title: मॉडल प्रदाता
x-i18n:
    generated_at: "2026-07-19T09:18:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4c0240811ced123bb58c862b08bb91110d211bc74074f7a48acb5bb87295838d
    source_path: concepts/model-providers.md
    workflow: 16
---

**LLM/मॉडल प्रदाताओं** के लिए संदर्भ (WhatsApp/Telegram जैसे चैट चैनलों के लिए नहीं)। मॉडल चयन के नियमों के लिए, [मॉडल](/hi/concepts/models) देखें।

## त्वरित नियम

<AccordionGroup>
  <Accordion title="मॉडल संदर्भ और CLI सहायक">
    - मॉडल संदर्भ `provider/model` का उपयोग करते हैं (उदाहरण: `opencode/claude-opus-4-6`)।
    - `agents.defaults.models` उपनाम और प्रत्येक मॉडल की सेटिंग संग्रहीत करता है; `agents.defaults.modelPolicy.allow` वैकल्पिक स्पष्ट ओवरराइड अनुमति-सूची है।
    - CLI सहायक: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`।
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` प्रदाता-स्तरीय डिफ़ॉल्ट निर्धारित करते हैं; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` प्रत्येक मॉडल के लिए उन्हें ओवरराइड करते हैं।
    - फ़ॉलबैक नियम, कूलडाउन जाँच और सत्र-ओवरराइड स्थायित्व: [मॉडल फ़ेलओवर](/hi/concepts/model-failover)।

  </Accordion>
  <Accordion title="प्रदाता प्रमाणीकरण जोड़ने से आपका प्राथमिक मॉडल नहीं बदलता">
    जब आप किसी प्रदाता को जोड़ते हैं या दोबारा प्रमाणित करते हैं, तो `openclaw configure` मौजूदा `agents.defaults.model.primary` को बनाए रखता है। जब तक आप `--set-default` नहीं देते, `openclaw models auth login` भी ऐसा ही करता है। प्रदाता Plugin अब भी अपने प्रमाणीकरण कॉन्फ़िगरेशन पैच में अनुशंसित डिफ़ॉल्ट मॉडल लौटा सकते हैं, लेकिन यदि कोई प्राथमिक मॉडल पहले से मौजूद है, तो OpenClaw इसे "इस मॉडल को उपलब्ध कराएँ" मानता है, न कि "वर्तमान प्राथमिक मॉडल को बदलें।"

    डिफ़ॉल्ट मॉडल को जानबूझकर बदलने के लिए, `openclaw models set <provider/model>` या `openclaw models auth login --provider <id> --set-default` का उपयोग करें।

  </Accordion>
  <Accordion title="OpenAI प्रदाता/रनटाइम विभाजन">
    OpenAI मॉडल संदर्भ और एजेंट रनटाइम अलग-अलग हैं:

    - `openai/<model>` प्रामाणिक OpenAI प्रदाता और मॉडल चुनता है। केवल उपसर्ग कभी भी Codex नहीं चुनता।
    - प्रदाता/मॉडल रनटाइम नीति अनिर्धारित या `auto` होने पर, OpenAI केवल ऐसी सटीक आधिकारिक HTTPS Platform Responses या ChatGPT Responses रूट के लिए Codex को अंतर्निहित रूप से चुन सकता है जिसमें कोई लिखित अनुरोध ओवरराइड न हो।
    - लिखित Completions अडैप्टर, कस्टम एंडपॉइंट और लिखित अनुरोध व्यवहार वाले रूट OpenClaw पर ही रहते हैं। आधिकारिक प्लेनटेक्स्ट HTTP एंडपॉइंट अस्वीकार किए जाते हैं।
    - पुराने Codex मॉडल संदर्भ पुराने कॉन्फ़िगरेशन हैं जिन्हें doctor `openai/<model>` में दोबारा लिखता है।
    - प्रदाता/मॉडल `agentRuntime.id: "openclaw"` किसी अन्यथा योग्य रूट को स्पष्ट रूप से OpenClaw पर रखता है। `agentRuntime.id: "codex"` को Codex की आवश्यकता होती है और प्रभावी रूट के Codex-संगत न होने पर वह बंद होकर विफल होता है।

    [OpenAI अंतर्निहित एजेंट रनटाइम](/hi/providers/openai#implicit-agent-runtime) और [Codex हार्नेस](/hi/plugins/codex-harness) देखें। यदि प्रदाता/रनटाइम विभाजन भ्रमित करने वाला है, तो पहले [एजेंट रनटाइम](/hi/concepts/agent-runtimes) पढ़ें।

    Plugin का स्वतः सक्षम होना भी इसी सीमा का पालन करता है: अंतर्निहित रूप से Codex-संगत प्रभावी रूट Codex Plugin को सक्षम कर सकता है, जबकि स्पष्ट प्रदाता/मॉडल `agentRuntime.id: "codex"` या पुराने `codex/<model>` संदर्भों को इसकी आवश्यकता होती है। केवल `openai/*` उपसर्ग से ऐसा नहीं होता।

    नया OpenAI सेटअप रूट-विशिष्ट GPT-5.6 संदर्भ का उपयोग करता है: API-कुंजी सेटअप
    `openai/gpt-5.6` चुनता है (साधारण प्रत्यक्ष-API आईडी Sol में रिज़ॉल्व होती है), जबकि
    ChatGPT/Codex OAuth मूल Codex
    कैटलॉग के लिए सटीक `openai/gpt-5.6-sol` चुनता है। OpenAI प्रमाणीकरण जोड़े या रीफ़्रेश किए जाने पर `openai/gpt-5.5` सहित मौजूदा स्पष्ट प्राथमिक मॉडल
    बनाए रखे जाते हैं। GPT-5.6 की पहुँच न रखने वाले खातों के लिए GPT-5.5
    किसी भी रनटाइम के माध्यम से स्पष्ट पुनर्प्राप्ति विकल्प के रूप में उपलब्ध रहता है।

  </Accordion>
  <Accordion title="CLI रनटाइम">
    CLI रनटाइम भी इसी विभाजन का उपयोग करते हैं: `anthropic/claude-*` या `google/gemini-*` जैसे प्रामाणिक मॉडल संदर्भ चुनें, फिर स्थानीय CLI बैकएंड चाहने पर प्रदाता/मॉडल रनटाइम नीति को `claude-cli` या `google-gemini-cli` पर सेट करें।

    पुराने `claude-cli/*` और `google-gemini-cli/*` संदर्भ अलग से दर्ज रनटाइम के साथ वापस प्रामाणिक प्रदाता संदर्भों में माइग्रेट होते हैं। पुराने `codex-cli/*` संदर्भ `openai/*` में माइग्रेट होते हैं और Codex ऐप-सर्वर रूट का उपयोग करते हैं; OpenClaw अब बंडल किया हुआ Codex CLI बैकएंड नहीं रखता।

  </Accordion>
</AccordionGroup>

## Control UI में प्रदाताओं को कॉन्फ़िगर करें

`models.providers.<id>.apiKey` में संग्रहीत प्रदाता API कुंजियाँ जोड़ने, बदलने या हटाने के लिए Control UI में **Settings → Model Providers** खोलें। पृष्ठ क्रेडेंशियल प्रदर्शित किए बिना बताता है कि प्रत्येक API कुंजी OpenClaw कॉन्फ़िगरेशन से आती है या किसी एनवायरनमेंट वेरिएबल से। एनवायरनमेंट से दी गई कुंजियाँ Gateway प्रक्रिया के एनवायरनमेंट द्वारा प्रबंधित रहती हैं।

लाइव प्रदाता जाँच चलाने और विलंबता या वर्गीकृत प्रमाणीकरण, दर-सीमा, बिलिंग, टाइमआउट या प्रतिक्रिया त्रुटि देखने के लिए **Test connection** का उपयोग करें। जाँच एक वास्तविक प्रदाता अनुरोध करती है और थोड़ी संख्या में टोकन का उपयोग कर सकती है। OAuth और टोकन प्रोफ़ाइल से प्रदाता कार्ड द्वारा लॉग आउट भी किया जा सकता है।

**Default models** कार्ड कॉन्फ़िगर किए गए मॉडल कैटलॉग से प्राथमिक मॉडल, क्रमबद्ध फ़ॉलबैक और उपयोगिता मॉडल प्रबंधित करता है। मॉडल चुनें, फिर उन्हें मौजूदा `agents.defaults.model` और `agents.defaults.utilityModel` सेटिंग में एक साथ सहेजें। उपयोगिता मॉडल के लिए, **Automatic** सेटिंग को अनिर्धारित छोड़ता है और **Disabled** उपयोगिता रूटिंग बंद करने हेतु एक खाली स्ट्रिंग संग्रहीत करता है।

## Plugin-स्वामित्व वाला प्रदाता व्यवहार

अधिकांश प्रदाता-विशिष्ट लॉजिक प्रदाता Plugin (`registerProvider(...)`) में रहता है, जबकि OpenClaw सामान्य इनफ़रेंस लूप रखता है। Plugin ऑनबोर्डिंग, मॉडल कैटलॉग, प्रमाणीकरण एनवायरनमेंट-वेरिएबल मैपिंग, ट्रांसपोर्ट/कॉन्फ़िगरेशन सामान्यीकरण, टूल-स्कीमा सफ़ाई, फ़ेलओवर वर्गीकरण, OAuth रीफ़्रेश, उपयोग रिपोर्टिंग, चिंतन/तर्क प्रोफ़ाइल आदि के स्वामी होते हैं।

प्रदाता-SDK हुक और बंडल किए गए Plugin उदाहरणों की पूरी सूची [प्रदाता Plugin](/hi/plugins/sdk-provider-plugins) में उपलब्ध है। पूरी तरह कस्टम अनुरोध निष्पादक की आवश्यकता वाला प्रदाता एक अलग, अधिक गहरा एक्सटेंशन सरफ़ेस है।

<Note>
प्रदाता-स्वामित्व वाला रनर व्यवहार रीप्ले नीति, टूल-स्कीमा सामान्यीकरण, स्ट्रीम रैपिंग और ट्रांसपोर्ट/अनुरोध सहायकों जैसे स्पष्ट प्रदाता हुक पर रहता है। पुराना `ProviderPlugin.capabilities` स्थिर संग्रह केवल संगतता के लिए है और अब साझा रनर लॉजिक द्वारा पढ़ा नहीं जाता।
</Note>

## API कुंजी रोटेशन

<AccordionGroup>
  <Accordion title="कुंजी स्रोत और प्राथमिकता">
    एकाधिक कुंजियाँ इनके माध्यम से कॉन्फ़िगर करें:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (एकल लाइव ओवरराइड, सर्वोच्च प्राथमिकता)
    - `<PROVIDER>_API_KEYS` (अल्पविराम या अर्धविराम से अलग की गई सूची)
    - `<PROVIDER>_API_KEY` (प्राथमिक कुंजी)
    - `<PROVIDER>_API_KEY_*` (क्रमांकित सूची, जैसे `<PROVIDER>_API_KEY_1`)

    Google प्रदाताओं के लिए, `GOOGLE_API_KEY` भी फ़ॉलबैक के रूप में शामिल होता है। कुंजी चयन क्रम प्राथमिकता बनाए रखता है और डुप्लिकेट मान हटाता है।

  </Accordion>
  <Accordion title="रोटेशन कब सक्रिय होता है">
    - अनुरोधों को अगली कुंजी के साथ केवल दर-सीमा प्रतिक्रियाओं पर दोबारा आज़माया जाता है (उदाहरण के लिए `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` या आवधिक उपयोग-सीमा संदेश)।
    - दर-सीमा से असंबंधित विफलताएँ तुरंत विफल हो जाती हैं; कुंजी रोटेशन का प्रयास नहीं किया जाता।
    - सभी उम्मीदवार कुंजियों के विफल होने पर, अंतिम प्रयास की त्रुटि लौटाई जाती है।

  </Accordion>
</AccordionGroup>

## आधिकारिक प्रदाता Plugin

आधिकारिक प्रदाता Plugin अपनी मॉडल कैटलॉग पंक्तियाँ प्रकाशित करते हैं। इन प्रदाताओं को `models.providers` मॉडल प्रविष्टियों की **कोई** आवश्यकता नहीं होती; प्रदाता Plugin सक्षम करें, प्रमाणीकरण सेट करें और कोई मॉडल चुनें। `models.providers` का उपयोग केवल स्पष्ट कस्टम प्रदाताओं या टाइमआउट जैसी सीमित अनुरोध सेटिंग के लिए करें।

### OpenAI

- प्रदाता: `openai`
- प्रमाणीकरण: `OPENAI_API_KEY`
- वैकल्पिक रोटेशन: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, साथ में `OPENCLAW_LIVE_OPENAI_KEY` (एकल ओवरराइड)
- नए सेटअप का डिफ़ॉल्ट: `openai/gpt-5.6`; प्रत्यक्ष API पर, साधारण आईडी Sol में रिज़ॉल्व होती है।
- उदाहरण मॉडल: `openai/gpt-5.6`, `openai/gpt-5.6-terra`, `openai/gpt-5.6-luna`, `openai/gpt-5.5`
- यदि कोई विशिष्ट इंस्टॉल या API कुंजी अलग तरह से व्यवहार करती है, तो `openclaw models list --provider openai` से खाते/मॉडल की उपलब्धता सत्यापित करें।
- CLI: `openclaw onboard --auth-choice openai-api-key`
- डिफ़ॉल्ट ट्रांसपोर्ट `auto` है; OpenClaw ट्रांसपोर्ट चयन को साझा मॉडल रनटाइम तक पहुँचाता है।
- प्रत्येक मॉडल के लिए `agents.defaults.models["openai/<model>"].params.transport` द्वारा ओवरराइड करें (`"sse"`, `"websocket"` या `"auto"`)
- OpenAI प्राथमिकता प्रोसेसिंग को `agents.defaults.models["openai/<model>"].params.serviceTier` द्वारा सक्षम किया जा सकता है
- `/fast` और `params.fastMode`, `openai/*` के प्रत्यक्ष Responses अनुरोधों को `api.openai.com` पर `service_tier=priority` में मैप करते हैं
- साझा `/fast` टॉगल के बजाय स्पष्ट टियर चाहने पर `params.serviceTier` का उपयोग करें
- छिपे हुए OpenClaw एट्रिब्यूशन हेडर (`originator`, `version`, `User-Agent`) केवल `api.openai.com` के मूल OpenAI ट्रैफ़िक पर लागू होते हैं, सामान्य OpenAI-संगत प्रॉक्सी पर नहीं
- मूल OpenAI रूट Responses `store`, प्रॉम्प्ट-कैश संकेत और OpenAI तर्क-संगतता पेलोड आकार देना भी बनाए रखते हैं; प्रॉक्सी रूट ऐसा नहीं करते
- `openai/gpt-5.3-codex-spark` केवल ChatGPT/Codex OAuth के माध्यम से उपलब्ध है; प्रत्यक्ष OpenAI API-कुंजी और Azure API-कुंजी रूट इसे अस्वीकार करते हैं

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
}
```

यदि API संगठन GPT-5.6 उपलब्ध नहीं कराता, तो
`openai/gpt-5.5` को स्पष्ट रूप से सेट करें। सामान्य ऑनबोर्डिंग और पुनः प्रमाणीकरण
मौजूदा स्पष्ट प्राथमिक मॉडल को बनाए रखते हैं; `models auth login --set-default` और
`models set` जानबूझकर बदलने के मार्ग हैं।

### Anthropic

- प्रदाता: `anthropic`
- प्रमाणीकरण: `ANTHROPIC_API_KEY`
- वैकल्पिक रोटेशन: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, साथ में `OPENCLAW_LIVE_ANTHROPIC_KEY` (एकल ओवरराइड)
- उदाहरण मॉडल: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- प्रत्यक्ष सार्वजनिक Anthropic अनुरोध साझा `/fast` टॉगल और `params.fastMode` का समर्थन करते हैं, जिसमें `api.anthropic.com` को भेजा गया API-कुंजी और OAuth-प्रमाणित ट्रैफ़िक शामिल है; OpenClaw इसे Anthropic `service_tier` (`auto` बनाम `standard_only`) में मैप करता है
- पसंदीदा Claude CLI कॉन्फ़िगरेशन मॉडल संदर्भ को प्रामाणिक रखता है और CLI
  बैकएंड को अलग से चुनता है: मॉडल-स्कोप वाले
  `agentRuntime.id: "claude-cli"` के साथ `anthropic/claude-opus-4-8`। पुराने
  `claude-cli/claude-opus-4-7` संदर्भ संगतता के लिए अब भी काम करते हैं।

<Note>
Claude CLI का पुनः उपयोग (`claude -p`) OpenClaw का स्वीकृत एकीकरण मार्ग है। Anthropic सेटअप-टोकन प्रमाणीकरण समर्थित रहता है, लेकिन उपलब्ध होने पर OpenClaw Claude CLI के पुनः उपयोग को प्राथमिकता देता है।
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI ChatGPT/Codex OAuth

- प्रदाता: `openai`
- प्रमाणीकरण: OAuth (ChatGPT)
- नया नेटिव Codex app-server हार्नेस संदर्भ: `openai/gpt-5.6-sol`
- नेटिव Codex app-server हार्नेस दस्तावेज़: [Codex हार्नेस](/hi/plugins/codex-harness)
- लेगेसी मॉडल संदर्भ: `codex/gpt-*`, `openai-codex/gpt-*`
- Plugin सीमा: `openai/*` OpenAI Plugin लोड करता है; स्पष्ट रनटाइम नीति या प्रदाता-स्वामित्व वाला प्रभावी रूट तय करता है कि नेटिव Codex app-server Plugin चुना जाए या नहीं।
- CLI: `openclaw onboard --auth-choice openai` या `openclaw models auth login --provider openai`
- OpenClaw का एम्बेडेड ChatGPT Responses ट्रांसपोर्ट डिफ़ॉल्ट रूप से `auto` (पहले WebSocket, फ़ॉलबैक के रूप में SSE) का उपयोग करता है।
- `agents.defaults.models["openai/<model>"].params.transport`, `params.serviceTier`, और `params.fastMode` लेखित एम्बेडेड-अनुरोध सेटिंग हैं। ये अंतर्निहित रनटाइम चयन को OpenClaw के अधीन रखती हैं; नेटिव Codex अपने app-server ट्रांसपोर्ट और सेवा स्तर का स्वामी है।
- छिपे हुए OpenClaw एट्रिब्यूशन हेडर (`originator`, `version`, `User-Agent`) केवल `chatgpt.com/backend-api` पर जाने वाले नेटिव Codex ट्रैफ़िक में जोड़े जाते हैं, सामान्य OpenAI-संगत प्रॉक्सी में नहीं
- साझा `/fast` टॉगल रनटाइम नियंत्रण के रूप में उपलब्ध रहता है; यह लेखित मॉडल पैरामीटर से अलग है।
- नेटिव Codex कैटलॉग खाते की पहुँच के अनुसार सटीक `openai/gpt-5.6-sol`, `openai/gpt-5.6-terra`, और `openai/gpt-5.6-luna` संदर्भ उपलब्ध करा सकता है। यह डायरेक्ट API के केवल `gpt-5.6` एलियास को क्लाइंट-साइड पर लागू नहीं करता।
- `openai/gpt-5.5` Codex कैटलॉग के नेटिव `contextWindow = 400000` और डिफ़ॉल्ट रनटाइम `contextTokens = 272000` का उपयोग करता है; रनटाइम सीमा को `models.providers.openai.models[].contextTokens` से ओवरराइड करें
- `openai` प्रमाणीकरण से साइन इन करें और सदस्यता-समर्थित नया सेटअप बनाने के लिए `openai/gpt-5.6-sol` का उपयोग करें। यदि उस Codex वर्कस्पेस में GPT-5.6 उपलब्ध नहीं है, तो स्पष्ट रूप से `openai/gpt-5.5` चुनें।
- अन्यथा योग्य रूट को बिल्ट-इन रनटाइम पर बनाए रखने के लिए प्रदाता/मॉडल `agentRuntime.id: "openclaw"` का उपयोग करें। रनटाइम अनिर्धारित या `auto` होने पर, बिना किसी लेखित अनुरोध ओवरराइड वाला केवल सटीक आधिकारिक HTTPS Responses/ChatGPT-संगत रूट ही Codex को अंतर्निहित रूप से चुन सकता है।
- लेगेसी Codex GPT संदर्भ लेगेसी स्थिति हैं, कोई सक्रिय प्रदाता रूट नहीं। नए एजेंट कॉन्फ़िगरेशन के लिए कैनोनिकल `openai/*` संदर्भों का उपयोग करें, और मॉडल-स्कोप वाले `agentRuntime.id: "codex"` के साथ उनके नेटिव Codex अर्थ को बनाए रखते हुए `codex/*` तथा `openai-codex/*` संदर्भ माइग्रेट करने के लिए `openclaw doctor --fix` चलाएँ। मौजूदा स्पष्ट कैनोनिकल `openai/gpt-5.5` चयनों को अपग्रेड नहीं किया जाता।

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.6-sol" },
    },
  },
}
```

```json5
{
  models: {
    providers: {
      openai: {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### अन्य सदस्यता-शैली के होस्टेड विकल्प

<CardGroup cols={3}>
  <Card title="MiniMax" href="/hi/providers/minimax">
    MiniMax Coding Plan OAuth या API कुंजी पहुँच।
  </Card>
  <Card title="Qwen Cloud" href="/hi/providers/qwen">
    Qwen Cloud प्रदाता सतह के साथ Alibaba DashScope और Coding Plan एंडपॉइंट मैपिंग।
  </Card>
  <Card title="Z.AI (GLM)" href="/hi/providers/zai">
    Z.AI Coding Plan या सामान्य API एंडपॉइंट।
  </Card>
</CardGroup>

### OpenCode

- प्रमाणीकरण: `OPENCODE_API_KEY` (या `OPENCODE_ZEN_API_KEY`)
- Zen रनटाइम प्रदाता: `opencode`
- Go रनटाइम प्रदाता: `opencode-go`
- उदाहरण मॉडल: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` या `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API कुंजी)

- प्रदाता: `google`
- प्रमाणीकरण: `GEMINI_API_KEY`
- वैकल्पिक रोटेशन: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` फ़ॉलबैक, और `OPENCLAW_LIVE_GEMINI_KEY` (एकल ओवरराइड)
- उदाहरण मॉडल: `google/gemini-3.1-pro-preview`, `google/gemini-3.5-flash`
- संगतता: `google/gemini-3.1-flash-preview` का उपयोग करने वाला लेगेसी OpenClaw कॉन्फ़िगरेशन `google/gemini-3-flash-preview` में नॉर्मलाइज़ किया जाता है
- एलियास: `google/gemini-3.1-pro` स्वीकार किया जाता है और Google के सक्रिय Gemini API आईडी, `google/gemini-3.1-pro-preview`, में नॉर्मलाइज़ किया जाता है
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- चिंतन: `/think adaptive` Google के डायनेमिक चिंतन का उपयोग करता है। Gemini 3/3.1 नियत `thinkingLevel` को छोड़ देते हैं; Gemini 2.5 `thinkingBudget: -1` भेजता है।
- प्रत्यक्ष Gemini रन प्रदाता-नेटिव `cachedContents/...` हैंडल अग्रेषित करने के लिए `agents.defaults.models["google/<model>"].params.cachedContent` (या लेगेसी `cached_content`) को भी स्वीकार करते हैं; Gemini कैश हिट OpenClaw `cacheRead` के रूप में दिखाई देते हैं

### Google Vertex और Gemini CLI

- प्रदाता: `google-vertex`, `google-gemini-cli`
- प्रमाणीकरण: Vertex gcloud ADC का उपयोग करता है; Gemini CLI अपने OAuth प्रवाह का उपयोग करता है

<Warning>
OpenClaw में Gemini CLI OAuth एक अनाधिकारिक एकीकरण है। कुछ उपयोगकर्ताओं ने तृतीय-पक्ष क्लाइंट का उपयोग करने के बाद Google खाते पर प्रतिबंध लगने की सूचना दी है। यदि आप आगे बढ़ना चुनते हैं, तो Google की शर्तों की समीक्षा करें और किसी गैर-महत्वपूर्ण खाते का उपयोग करें।
</Warning>

Gemini CLI OAuth बंडल किए गए `google` Plugin के भाग के रूप में उपलब्ध कराया जाता है।

<Steps>
  <Step title="Gemini CLI इंस्टॉल करें">
    <Tabs>
      <Tab title="brew">
        ```bash
        brew install gemini-cli
        ```
      </Tab>
      <Tab title="npm">
        ```bash
        npm install -g @google/gemini-cli
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="Plugin सक्षम करें">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="लॉग इन करें">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    डिफ़ॉल्ट मॉडल: `google-gemini-cli/gemini-3-flash-preview`। आप `openclaw.json` में क्लाइंट आईडी या सीक्रेट पेस्ट **नहीं** करते हैं। CLI लॉगिन प्रवाह टोकन को Gateway होस्ट पर प्रमाणीकरण प्रोफ़ाइल में संग्रहीत करता है।

  </Step>
  <Step title="प्रोजेक्ट सेट करें (यदि आवश्यक हो)">
    यदि लॉगिन के बाद अनुरोध विफल हों, तो Gateway होस्ट पर `GOOGLE_CLOUD_PROJECT` या `GOOGLE_CLOUD_PROJECT_ID` सेट करें।
  </Step>
</Steps>

Gemini CLI डिफ़ॉल्ट रूप से `stream-json` का उपयोग करता है। OpenClaw सहायक स्ट्रीम
संदेशों को पढ़ता है और `stats.cached` को `cacheRead` में नॉर्मलाइज़ करता है; लेगेसी
`--output-format json` ओवरराइड अब भी `response` से उत्तर पाठ पढ़ते हैं।

### Z.AI (GLM)

- प्रदाता: `zai`
- प्रमाणीकरण: `ZAI_API_KEY`
- उदाहरण मॉडल: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - मॉडल संदर्भ कैनोनिकल `zai/*` प्रदाता आईडी का उपयोग करते हैं।
  - `zai-api-key` मेल खाने वाले Z.AI एंडपॉइंट का स्वतः पता लगाता है; `zai-coding-global`, `zai-coding-cn`, `zai-global`, और `zai-cn` किसी विशिष्ट सतह को बाध्य करते हैं

### Vercel AI Gateway

- प्रदाता: `vercel-ai-gateway`
- प्रमाणीकरण: `AI_GATEWAY_API_KEY`
- उदाहरण मॉडल: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### अन्य बंडल किए गए प्रदाता Plugin

| प्रदाता                                  | आईडी                             | प्रमाणीकरण परिवेश चर                                  | उदाहरण मॉडल                                            |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| Arcee                                   | `arcee`                          | `ARCEEAI_API_KEY` या `OPENROUTER_API_KEY`            | `arcee/trinity-large-thinking`                         |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                        |
| Cerebras                                | `cerebras`                       | `CEREBRAS_API_KEY`                                   | `cerebras/zai-glm-4.7`                                 |
| Chutes                                  | `chutes`                         | `CHUTES_API_KEY` या `CHUTES_OAUTH_TOKEN`             | `chutes/zai-org/GLM-5-TEE`                             |
| ClawRouter                              | `clawrouter`                     | `CLAWROUTER_API_KEY`                                 | `clawrouter/anthropic/claude-sonnet-4-6`               |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-plus-05-2026`                        |
| DeepInfra                               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                  | `deepinfra/deepseek-ai/DeepSeek-V4-Flash`              |
| DeepSeek                                | `deepseek`                       | `DEEPSEEK_API_KEY`                                   | `deepseek/deepseek-v4-flash`                           |
| Featherless AI                          | `featherless`                    | `FEATHERLESS_API_KEY`                                | `featherless/Qwen/Qwen3-32B`                           |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                      |
| GMI Cloud                               | `gmi`                            | `GMI_API_KEY`                                        | `gmi/google/gemini-3.1-flash-lite`                     |
| Groq                                    | `groq`                           | `GROQ_API_KEY`                                       | `groq/llama-3.3-70b-versatile`                         |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` या `HF_TOKEN`                | `huggingface/deepseek-ai/DeepSeek-R1`                  |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                   |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                         |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                   |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`             |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                     |
| [Ollama Cloud](/hi/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                               |
| OpenRouter                              | `openrouter`                     | OpenRouter OAuth या `OPENROUTER_API_KEY`             | `openrouter/auto`                                      |
| Qianfan                                 | `qianfan`                        | `QIANFAN_API_KEY`                                    | `qianfan/deepseek-v3.2`                                |
| Tencent TokenHub                        | `tencent-tokenhub`               | `TOKENHUB_API_KEY`                                   | `tencent-tokenhub/hy3-preview`                         |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`     |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                      |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`          |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                      |
| xAI                                     | `xai`                            | SuperGrok/X Premium OAuth या `XAI_API_KEY`           | `xai/grok-4.3`                                         |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2.5` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### जानने योग्य विशिष्ट व्यवहार

<AccordionGroup>
  <Accordion title="OpenRouter">
    यह अपने ऐप-एट्रिब्यूशन हेडर और Anthropic `cache_control` मार्कर केवल सत्यापित `openrouter.ai` रूट पर लागू करता है। DeepSeek, Moonshot और ZAI संदर्भ OpenRouter-प्रबंधित प्रॉम्प्ट कैशिंग के लिए कैश-TTL योग्य हैं, लेकिन उन्हें Anthropic कैश मार्कर नहीं मिलते। प्रॉक्सी-शैली के OpenAI-संगत पथ के रूप में, यह केवल मूल OpenAI के लिए होने वाली शेपिंग (`serviceTier`, Responses `store`, प्रॉम्प्ट-कैश संकेत, OpenAI रीजनिंग-संगतता) छोड़ देता है। Gemini-समर्थित संदर्भ केवल प्रॉक्सी-Gemini थॉट-सिग्नेचर सैनिटाइजेशन बनाए रखते हैं।
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini-समर्थित संदर्भ उसी प्रॉक्सी-Gemini सैनिटाइजेशन पथ का अनुसरण करते हैं; `kilocode/kilo-auto/balanced` और अन्य प्रॉक्सी-रीजनिंग-असमर्थित संदर्भ प्रॉक्सी रीजनिंग इंजेक्शन छोड़ देते हैं।
  </Accordion>
  <Accordion title="MiniMax">
    API-कुंजी ऑनबोर्डिंग स्पष्ट M3 और M2.7 चैट मॉडल परिभाषाएँ लिखती है; छवि समझ Plugin-स्वामित्व वाले `MiniMax-VL-01` मीडिया प्रदाता पर बनी रहती है।
  </Accordion>
  <Accordion title="NVIDIA">
    मॉडल आईडी `nvidia/<vendor>/<model>` नेमस्पेस का उपयोग करते हैं (उदाहरण के लिए `nvidia/nvidia/nemotron-...`); पिकर शाब्दिक `<provider>/<model-id>` संयोजन बनाए रखते हैं, जबकि API को भेजी गई कैनोनिकल कुंजी में केवल एक उपसर्ग रहता है।
  </Accordion>
  <Accordion title="xAI">
    यह xAI Responses पथ का उपयोग करता है। अनुशंसित पथ SuperGrok/X Premium OAuth है; API कुंजियाँ अब भी `XAI_API_KEY` या Plugin कॉन्फ़िगरेशन के माध्यम से काम करती हैं, और Grok `web_search` API-कुंजी फ़ॉलबैक से पहले उसी प्रमाणीकरण प्रोफ़ाइल का पुनः उपयोग करता है। उपलब्ध होने पर Grok 4.5 को चैट, कोडिंग और एजेंटिक कार्य के लिए चुना जा सकता है; `grok-4.3` क्षेत्रीय रूप से सुरक्षित बंडल किया गया डिफ़ॉल्ट बना रहता है। पुराने `/fast` और `params.fastMode: true` कॉन्फ़िगरेशन अब भी xAI के Grok 4.3 संगतता रीडायरेक्ट के माध्यम से रिज़ॉल्व होते हैं, लेकिन नए कॉन्फ़िगरेशन में सीधे किसी वर्तमान मॉडल को चुनना चाहिए। `tool_stream` डिफ़ॉल्ट रूप से चालू रहता है; `agents.defaults.models["xai/<model>"].params.tool_stream=false` के माध्यम से अक्षम करें।
  </Accordion>
</AccordionGroup>

## `models.providers` के माध्यम से प्रदाता (कस्टम/बेस URL)

**कस्टम** प्रदाता या OpenAI/Anthropic-संगत प्रॉक्सी जोड़ने के लिए `models.providers` (या `models.json`) का उपयोग करें।

नीचे दिए गए कई बंडल प्रदाता Plugin पहले से ही एक डिफ़ॉल्ट कैटलॉग प्रकाशित करते हैं। स्पष्ट `models.providers.<id>` प्रविष्टियों का उपयोग केवल तब करें, जब आप डिफ़ॉल्ट बेस URL, हेडर या मॉडल सूची को ओवरराइड करना चाहते हों।

Gateway मॉडल क्षमता जाँच स्पष्ट `models.providers.<id>.models[]` मेटाडेटा भी पढ़ती है। यदि कोई कस्टम या प्रॉक्सी मॉडल छवियाँ स्वीकार करता है, तो उस मॉडल पर `input: ["text", "image"]` सेट करें, ताकि WebChat और Node-मूल अटैचमेंट पथ छवियों को केवल-पाठ मीडिया संदर्भों के बजाय मूल मॉडल इनपुट के रूप में पास करें।

`agents.defaults.models["provider/model"]` एजेंटों के लिए उपनाम और प्रति-मॉडल मेटाडेटा नियंत्रित करता है। यह न तो ओवरराइड को प्रतिबंधित करता है, न ही स्वयं कोई नया रनटाइम मॉडल पंजीकृत करता है। कस्टम प्रदाता मॉडलों के लिए, कम-से-कम मेल खाने वाले `id` के साथ `models.providers.<provider>.models[]` भी जोड़ें; जब आप ओवरराइड प्रतिबंध चाहते हों, तब `agents.defaults.modelPolicy.allow` का अलग से उपयोग करें।

### Moonshot AI (Kimi)

ऑनबोर्डिंग से पहले `@openclaw/moonshot-provider` इंस्टॉल करें। स्पष्ट `models.providers.moonshot` प्रविष्टि केवल तब जोड़ें, जब आपको बेस URL या मॉडल मेटाडेटा ओवरराइड करना हो:

- प्रदाता: `moonshot`
- प्रमाणीकरण: `MOONSHOT_API_KEY`
- उदाहरण मॉडल: `moonshot/kimi-k3`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` या `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi मॉडल आईडी:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k3`
- `moonshot/kimi-k2.7-code`
- `moonshot/kimi-k2.7-code-highspeed`
- `moonshot/kimi-k2.5`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

पूरी सेटअप मार्गदर्शिका के लिए [Moonshot AI (Kimi + Kimi Coding)](/hi/providers/moonshot) देखें।

### Kimi Coding

Kimi Coding, Moonshot AI के Anthropic-संगत एंडपॉइंट का उपयोग करता है:

- प्रदाता: `kimi`
- प्रमाणीकरण: `KIMI_API_KEY`
- Kimi K3: `kimi/k3` (256K) या `kimi/k3[1m]` (1M प्लान)
- Kimi Code: `kimi/kimi-for-coding`
- Kimi Code HighSpeed: `kimi/kimi-for-coding-highspeed`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

पुराने `kimi/kimi-code` और `kimi/k2p5` अब भी संगतता मॉडल आईडी के रूप में स्वीकार किए जाते हैं और Kimi के स्थिर API मॉडल आईडी में सामान्यीकृत होते हैं।

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) चीन में Doubao और अन्य मॉडलों तक पहुँच प्रदान करता है।

- प्रदाता: `volcengine` (कोडिंग: `volcengine-plan`)
- प्रमाणीकरण: `VOLCANO_ENGINE_API_KEY`
- उदाहरण मॉडल: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

ऑनबोर्डिंग डिफ़ॉल्ट रूप से कोडिंग सतह का उपयोग करती है, लेकिन सामान्य `volcengine/*` कैटलॉग उसी समय पंजीकृत होता है।

ऑनबोर्डिंग/कॉन्फ़िगरेशन मॉडल पिकर में, Volcengine प्रमाणीकरण विकल्प `volcengine/*` और `volcengine-plan/*` दोनों पंक्तियों को प्राथमिकता देता है। यदि वे मॉडल अभी लोड नहीं हुए हैं, तो OpenClaw खाली प्रदाता-स्कोप वाला पिकर दिखाने के बजाय बिना फ़िल्टर किए गए कैटलॉग पर फ़ॉलबैक करता है।

<Tabs>
  <Tab title="मानक मॉडल">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2)

  </Tab>
  <Tab title="कोडिंग मॉडल (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`

  </Tab>
</Tabs>

### BytePlus (अंतरराष्ट्रीय)

BytePlus ARK अंतरराष्ट्रीय उपयोगकर्ताओं को Volcano Engine के समान मॉडलों तक पहुँच प्रदान करता है।

- प्रदाता: `byteplus` (कोडिंग: `byteplus-plan`)
- प्रमाणीकरण: `BYTEPLUS_API_KEY`
- उदाहरण मॉडल: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

ऑनबोर्डिंग डिफ़ॉल्ट रूप से कोडिंग सतह का उपयोग करती है, लेकिन सामान्य `byteplus/*` कैटलॉग भी उसी समय पंजीकृत होता है।

ऑनबोर्डिंग/कॉन्फ़िगरेशन मॉडल चयनकर्ताओं में, BytePlus प्रमाणीकरण विकल्प `byteplus/*` और `byteplus-plan/*` दोनों पंक्तियों को प्राथमिकता देता है। यदि वे मॉडल अभी लोड नहीं हुए हैं, तो OpenClaw खाली प्रदाता-सीमित चयनकर्ता दिखाने के बजाय बिना फ़िल्टर किए गए कैटलॉग पर वापस जाता है।

<Tabs>
  <Tab title="मानक मॉडल">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="कोडिंग मॉडल (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic, `synthetic` प्रदाता के माध्यम से Anthropic-संगत मॉडल उपलब्ध कराता है:

- प्रदाता: `synthetic`
- प्रमाणीकरण: `SYNTHETIC_API_KEY`
- उदाहरण मॉडल: `synthetic/hf:MiniMaxAI/MiniMax-M3`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M3" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M3", name: "MiniMax M3" }],
      },
    },
  },
}
```

### MiniMax

MiniMax को `models.providers` के माध्यम से कॉन्फ़िगर किया जाता है, क्योंकि यह कस्टम एंडपॉइंट का उपयोग करता है:

- MiniMax OAuth (वैश्विक): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (चीन): `--auth-choice minimax-cn-oauth`
- MiniMax API कुंजी (वैश्विक): `--auth-choice minimax-global-api`
- MiniMax API कुंजी (चीन): `--auth-choice minimax-cn-api`
- प्रमाणीकरण: `minimax` के लिए `MINIMAX_API_KEY`; `minimax-portal` के लिए `MINIMAX_OAUTH_TOKEN` या `MINIMAX_API_KEY`

सेटअप विवरण, मॉडल विकल्पों और कॉन्फ़िगरेशन स्निपेट के लिए [/providers/minimax](/hi/providers/minimax) देखें।

<Note>
MiniMax के Anthropic-संगत स्ट्रीमिंग पथ पर, OpenClaw M2.x परिवार के लिए चिंतन को डिफ़ॉल्ट रूप से अक्षम करता है, जब तक कि आप इसे स्पष्ट रूप से सेट न करें; MiniMax-M3 (और M3.x) डिफ़ॉल्ट रूप से प्रदाता के छोड़े गए/अनुकूली चिंतन पथ पर बना रहता है। `/fast on`, `MiniMax-M2.7` को `MiniMax-M2.7-highspeed` में पुनर्लिखता है।
</Note>

Plugin-स्वामित्व वाला क्षमता विभाजन:

- टेक्स्ट/चैट के डिफ़ॉल्ट `minimax/MiniMax-M3` पर बने रहते हैं
- छवि निर्माण `minimax/image-01` या `minimax-portal/image-01` है
- दोनों MiniMax प्रमाणीकरण पथों पर छवि बोध Plugin-स्वामित्व वाला `MiniMax-VL-01` है
- वेब खोज प्रदाता आईडी `minimax` पर बनी रहती है

### LM Studio

LM Studio एक बंडल किए गए प्रदाता Plugin के रूप में आता है, जो नेटिव API का उपयोग करता है:

- प्रदाता: `lmstudio`
- प्रमाणीकरण: `LM_API_TOKEN`
- डिफ़ॉल्ट इन्फ़रेंस आधार URL: `http://localhost:1234/v1`

फिर एक मॉडल सेट करें (`http://localhost:1234/api/v1/models` द्वारा लौटाई गई किसी आईडी से बदलें):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw खोज और स्वतः-लोड के लिए LM Studio के नेटिव `/api/v1/models` और `/api/v1/models/load` का उपयोग करता है, जबकि इन्फ़रेंस के लिए डिफ़ॉल्ट रूप से `/v1/chat/completions` का उपयोग होता है। यदि आप चाहते हैं कि LM Studio का JIT लोडिंग, TTL और स्वतः-बेदखली मॉडल जीवनचक्र का स्वामित्व लें, तो `models.providers.lmstudio.params.preload: false` सेट करें। सेटअप और समस्या निवारण के लिए [/providers/lmstudio](/hi/providers/lmstudio) देखें।

### Ollama

Ollama एक बंडल किए गए प्रदाता Plugin के रूप में आता है और Ollama के नेटिव API का उपयोग करता है:

- प्रदाता: `ollama`
- प्रमाणीकरण: आवश्यक नहीं (स्थानीय सर्वर)
- उदाहरण मॉडल: `ollama/llama3.3`
- इंस्टॉलेशन: [https://ollama.com/download](https://ollama.com/download)

```bash
# Ollama इंस्टॉल करें, फिर एक मॉडल पुल करें:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

जब आप `OLLAMA_API_KEY` के साथ इसे चुनते हैं, तो Ollama को स्थानीय रूप से `http://127.0.0.1:11434` पर खोजा जाता है, और बंडल किया गया प्रदाता Plugin, Ollama को सीधे `openclaw onboard` तथा मॉडल चयनकर्ता में जोड़ता है। ऑनबोर्डिंग, क्लाउड/स्थानीय मोड और कस्टम कॉन्फ़िगरेशन के लिए [/providers/ollama](/hi/providers/ollama) देखें।

### vLLM

vLLM स्थानीय/स्वयं-होस्ट किए गए OpenAI-संगत सर्वरों के लिए एक बंडल किए गए प्रदाता Plugin के रूप में आता है:

- प्रदाता: `vllm`
- प्रमाणीकरण: वैकल्पिक (आपके सर्वर पर निर्भर)
- डिफ़ॉल्ट आधार URL: `http://127.0.0.1:8000/v1`

स्थानीय रूप से स्वतः-खोज चुनने के लिए (यदि आपका सर्वर प्रमाणीकरण लागू नहीं करता, तो कोई भी मान काम करता है):

```bash
export VLLM_API_KEY="vllm-local"
```

फिर एक मॉडल सेट करें (`/v1/models` द्वारा लौटाई गई किसी आईडी से बदलें):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

विवरण के लिए [/providers/vllm](/hi/providers/vllm) देखें।

### SGLang

SGLang तेज़, स्वयं-होस्ट किए गए OpenAI-संगत सर्वरों के लिए एक बंडल किए गए प्रदाता Plugin के रूप में आता है:

- प्रदाता: `sglang`
- प्रमाणीकरण: वैकल्पिक (आपके सर्वर पर निर्भर)
- डिफ़ॉल्ट आधार URL: `http://127.0.0.1:30000/v1`

स्थानीय रूप से स्वतः-खोज चुनने के लिए (यदि आपका सर्वर प्रमाणीकरण लागू नहीं करता, तो कोई भी मान काम करता है):

```bash
export SGLANG_API_KEY="sglang-local"
```

फिर एक मॉडल सेट करें (`/v1/models` द्वारा लौटाई गई किसी आईडी से बदलें):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

विवरण के लिए [/providers/sglang](/hi/providers/sglang) देखें।

### स्थानीय प्रॉक्सी (LM Studio, vLLM, LiteLLM आदि)

उदाहरण (OpenAI-संगत):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="डिफ़ॉल्ट वैकल्पिक फ़ील्ड">
    कस्टम प्रदाताओं के लिए, `reasoning`, `input`, `cost`, `contextWindow` और `maxTokens` वैकल्पिक हैं। इन्हें छोड़ने पर, OpenClaw निम्न डिफ़ॉल्ट मानों का उपयोग करता है:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    अनुशंसित: अपने प्रॉक्सी/मॉडल की सीमाओं से मेल खाने वाले स्पष्ट मान सेट करें।

  </Accordion>
  <Accordion title="प्रॉक्सी-रूट आकार-निर्धारण नियम">
    - गैर-नेटिव एंडपॉइंट पर `api: "openai-completions"` के लिए (कोई भी गैर-रिक्त `baseUrl`, जिसका होस्ट `api.openai.com` नहीं है), OpenClaw असमर्थित `developer` भूमिकाओं के कारण प्रदाता की 400 त्रुटियों से बचने के लिए `compat.supportsDeveloperRole: false` को बाध्य करता है।
    - प्रॉक्सी-शैली के OpenAI-संगत रूट नेटिव, केवल-OpenAI अनुरोध आकार-निर्धारण को भी छोड़ देते हैं: कोई `service_tier` नहीं, कोई Responses `store` नहीं, कोई Completions `store` नहीं, कोई प्रॉम्प्ट-कैश संकेत नहीं, कोई OpenAI रीजनिंग-संगतता पेलोड आकार-निर्धारण नहीं और कोई छिपे हुए OpenClaw एट्रिब्यूशन हेडर नहीं।
    - विक्रेता-विशिष्ट फ़ील्ड की आवश्यकता वाले OpenAI-संगत Completions प्रॉक्सी के लिए, आउटबाउंड अनुरोध बॉडी में अतिरिक्त JSON मर्ज करने हेतु `agents.defaults.models["provider/model"].params.extra_body` (या `extraBody`) सेट करें।
    - vLLM चैट-टेम्पलेट नियंत्रणों के लिए, `agents.defaults.models["provider/model"].params.chat_template_kwargs` सेट करें। सत्र का चिंतन स्तर बंद होने पर, बंडल किया गया vLLM Plugin `vllm/nemotron-3-*` के लिए स्वतः `enable_thinking: false` और `force_nonempty_content: true` भेजता है।
    - धीमे स्थानीय मॉडल या दूरस्थ LAN/tailnet होस्ट के लिए, `models.providers.<id>.timeoutSeconds` सेट करें। यह प्रदाता मॉडल के HTTP अनुरोध प्रबंधन को बढ़ाता है, जिसमें कनेक्ट, हेडर, बॉडी स्ट्रीमिंग और संपूर्ण संरक्षित-फ़ेच निरस्तीकरण शामिल हैं, लेकिन पूरे एजेंट रनटाइम का टाइमआउट नहीं बढ़ता। यदि `agents.defaults.timeoutSeconds` या रन-विशिष्ट टाइमआउट कम है, तो उस सीमा को भी बढ़ाएँ; प्रदाता टाइमआउट पूरे रन को विस्तारित नहीं कर सकते।
    - मॉडल प्रदाता HTTP कॉल, `198.18.0.0/15` और `fc00::/7` में Surge, Clash और sing-box के नकली-IP DNS उत्तरों को केवल कॉन्फ़िगर किए गए प्रदाता `baseUrl` होस्टनाम के लिए अनुमति देती हैं। कस्टम/स्थानीय प्रदाता एंडपॉइंट, संरक्षित मॉडल अनुरोधों के लिए ठीक उसी कॉन्फ़िगर किए गए `scheme://host:port` मूल पर भी भरोसा करते हैं, जिसमें लूपबैक, LAN और tailnet होस्ट शामिल हैं। यह कोई नया कॉन्फ़िगरेशन विकल्प नहीं है; आपके द्वारा कॉन्फ़िगर किया गया `baseUrl` केवल उसी मूल के लिए अनुरोध नीति को विस्तारित करता है। नकली-IP होस्टनाम की अनुमति और सटीक-मूल भरोसा स्वतंत्र तंत्र हैं। अन्य निजी, लूपबैक, लिंक-स्थानीय, मेटाडेटा गंतव्यों और अलग पोर्टों के लिए अब भी स्पष्ट `models.providers.<id>.request.allowPrivateNetwork: true` चयन आवश्यक है। सटीक-मूल भरोसे से बाहर निकलने के लिए `models.providers.<id>.request.allowPrivateNetwork: false` सेट करें।
    - यदि `baseUrl` रिक्त है या छोड़ा गया है, तो OpenClaw डिफ़ॉल्ट OpenAI व्यवहार बनाए रखता है (जो `api.openai.com` में परिणत होता है)।
    - सुरक्षा के लिए, गैर-नेटिव `openai-completions` एंडपॉइंट पर स्पष्ट `compat.supportsDeveloperRole: true` को अब भी ओवरराइड किया जाता है।
    - गैर-प्रत्यक्ष एंडपॉइंट पर `api: "anthropic-messages"` के लिए (कैनॉनिकल `anthropic` के अलावा कोई भी प्रदाता, या ऐसा कस्टम `models.providers.anthropic.baseUrl` जिसका होस्ट कोई सार्वजनिक `api.anthropic.com` एंडपॉइंट नहीं है), OpenClaw `claude-code-20250219`, `interleaved-thinking-2025-05-14` और OAuth मार्कर जैसे अंतर्निहित Anthropic बीटा हेडर को दबाता है, ताकि कस्टम Anthropic-संगत प्रॉक्सी असमर्थित बीटा फ़्लैग अस्वीकार न करें। यदि आपके प्रॉक्सी को विशिष्ट बीटा सुविधाओं की आवश्यकता है, तो `models.providers.<id>.headers["anthropic-beta"]` स्पष्ट रूप से सेट करें।

  </Accordion>
</AccordionGroup>

## CLI उदाहरण

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

यह भी देखें: पूर्ण कॉन्फ़िगरेशन उदाहरणों के लिए [कॉन्फ़िगरेशन](/hi/gateway/configuration)।

## संबंधित

- [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/config-agents#agent-defaults) - मॉडल कॉन्फ़िगरेशन कुंजियाँ
- [मॉडल फ़ेलओवर](/hi/concepts/model-failover) - फ़ॉलबैक शृंखलाएँ और पुनः प्रयास व्यवहार
- [मॉडल](/hi/concepts/models) - मॉडल कॉन्फ़िगरेशन और उपनाम
- [प्रदाता](/hi/providers) - प्रत्येक प्रदाता के लिए सेटअप मार्गदर्शिकाएँ
