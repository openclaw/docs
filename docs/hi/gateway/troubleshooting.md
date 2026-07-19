---
read_when:
    - समस्या निवारण केंद्र ने आपको अधिक गहन निदान के लिए यहाँ भेजा है
    - आपको सटीक कमांड वाले, लक्षण-आधारित स्थिर रनबुक अनुभागों की आवश्यकता है
sidebarTitle: Troubleshooting
summary: Gateway, चैनलों, ऑटोमेशन, नोड्स और ब्राउज़र के लिए विस्तृत समस्या-निवारण रनबुक
title: समस्या निवारण
x-i18n:
    generated_at: "2026-07-19T08:36:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 104d84b73305cb1290562c5045e0733611f5d9c42be064773c288429604da7f4
    source_path: gateway/troubleshooting.md
    workflow: 16
---

यह विस्तृत रनबुक है। पहले त्वरित ट्राइएज प्रवाह के लिए [/help/troubleshooting](/hi/help/troubleshooting) से शुरू करें।

## कमांड क्रम

इस क्रम में चलाएँ:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

स्वस्थ स्थिति के संकेत:

- `openclaw gateway status` में `Runtime: running`, `Connectivity probe: ok`, और एक `Capability: ...` पंक्ति दिखाई देती है।
- `openclaw doctor` किसी अवरोधक कॉन्फ़िगरेशन/सेवा समस्या की सूचना नहीं देता।
- `openclaw channels status --probe` प्रत्येक अकाउंट की लाइव ट्रांसपोर्ट स्थिति और, जहाँ समर्थित हो, `works` या `audit ok` दिखाता है।

## अपडेट के बाद

जब कोई अपडेट पूरा हो जाए लेकिन Gateway बंद हो, चैनल खाली हों, या मॉडल कॉल 401 त्रुटियों के साथ विफल हों, तब इसका उपयोग करें।

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

इनकी जाँच करें:

- `openclaw status` / `openclaw status --all` में `Update restart`। लंबित या विफल हैंडऑफ़ में अगला चलाया जाने वाला कमांड शामिल होता है।
- चैनल के अंतर्गत `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`: चैनल कॉन्फ़िगरेशन अब भी मौजूद है, लेकिन चैनल लोड होने से पहले Plugin पंजीकरण विफल हो गया।
- पुनः प्रमाणीकरण के बाद प्रदाता की 401 त्रुटियाँ: `openclaw doctor --fix` प्रत्येक एजेंट के पुराने OAuth प्रमाणीकरण शैडो की जाँच करता है और पुरानी प्रतियाँ हटा देता है, ताकि सभी एजेंट वर्तमान साझा प्रोफ़ाइल का समाधान करें।

## विभाजित इंस्टॉलेशन और नए कॉन्फ़िगरेशन की सुरक्षा

जब अपडेट के बाद कोई Gateway सेवा अप्रत्याशित रूप से बंद हो जाए, या लॉग दिखाएँ कि कोई `openclaw` बाइनरी उस संस्करण से पुरानी है जिसने पिछली बार `openclaw.json` लिखा था, तब इसका उपयोग करें।

OpenClaw कॉन्फ़िगरेशन लेखन को `meta.lastTouchedVersion` से चिह्नित करता है। केवल-पढ़ने वाले कमांड नए OpenClaw द्वारा लिखे गए कॉन्फ़िगरेशन की जाँच कर सकते हैं, लेकिन पुरानी बाइनरी से प्रक्रिया और सेवा में बदलाव चलाने से मना कर दिया जाता है। अवरुद्ध क्रियाएँ: Gateway सेवा को शुरू/बंद/पुनः आरंभ/अनइंस्टॉल करना, बलपूर्वक सेवा पुनः इंस्टॉल करना, सेवा-मोड में Gateway शुरू करना, और `gateway --force` पोर्ट की सफ़ाई।

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="PATH ठीक करें">
    `PATH` को ठीक करें ताकि `openclaw` नए इंस्टॉलेशन का समाधान करे, फिर क्रिया दोबारा चलाएँ।
  </Step>
  <Step title="Gateway सेवा पुनः इंस्टॉल करें">
    नए इंस्टॉलेशन से इच्छित Gateway सेवा पुनः इंस्टॉल करें:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="पुराने रैपर हटाएँ">
    पुराने सिस्टम पैकेज या रैपर प्रविष्टियाँ हटाएँ जो अब भी किसी पुरानी `openclaw` बाइनरी की ओर संकेत करती हैं।
  </Step>
</Steps>

<Warning>
केवल जानबूझकर डाउनग्रेड या आपातकालीन पुनर्प्राप्ति के लिए, एकल कमांड हेतु `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` सेट करें। सामान्य संचालन के लिए इसे सेट न रखें।
</Warning>

## रोलबैक के बाद प्रोटोकॉल बेमेल

जब डाउनग्रेड या रोलबैक के बाद लॉग लगातार `protocol mismatch` प्रिंट करते रहें, तब इसका उपयोग करें। कोई पुराना Gateway चल रहा है, लेकिन एक नई स्थानीय क्लाइंट प्रक्रिया अब भी ऐसी प्रोटोकॉल सीमा के साथ पुनः कनेक्ट हो रही है जिसे पुराना Gateway समझ नहीं सकता।

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

इनकी जाँच करें:

- Gateway लॉग में `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>`।
- `openclaw doctor --deep` में `openclaw gateway status --deep` या `Gateway clients` के अंतर्गत `Established clients:`: Gateway पोर्ट से जुड़े सक्रिय TCP क्लाइंट, और OS द्वारा अनुमति दिए जाने पर उनके PID तथा कमांड पंक्तियाँ।
- ऐसी क्लाइंट प्रक्रिया जिसकी कमांड पंक्ति उस नए OpenClaw इंस्टॉलेशन या रैपर की ओर संकेत करती है जिससे आपने रोलबैक किया था।

समाधान:

1. `gateway status --deep` द्वारा दिखाई गई पुरानी OpenClaw क्लाइंट प्रक्रिया को बंद या पुनः आरंभ करें।
2. OpenClaw को एम्बेड करने वाले ऐप या रैपर पुनः आरंभ करें: स्थानीय डैशबोर्ड, एडिटर, ऐप-सर्वर सहायक, या लंबे समय से चल रहे `openclaw logs --follow` शेल।
3. `openclaw gateway status --deep` या `openclaw doctor --deep` दोबारा चलाएँ और पुष्टि करें कि पुराना क्लाइंट PID हट गया है।

किसी पुराने Gateway से नया असंगत प्रोटोकॉल स्वीकार न करवाएँ। प्रोटोकॉल वृद्धि वायर अनुबंध की सुरक्षा करती है; रोलबैक पुनर्प्राप्ति प्रक्रिया/संस्करण की सफ़ाई से जुड़ी समस्या है।

## पथ से बाहर जाने के कारण Skill सिमलिंक छोड़ा गया

जब लॉग में यह शामिल हो, तब इसका उपयोग करें:

```text
कॉन्फ़िगर किए गए रूट से बाहर निकला Skill पथ छोड़ा जा रहा है: ... reason=symlink-escape
```

प्रत्येक Skill रूट एक परिसीमन सीमा है। `~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills`, या `~/.openclaw/skills` के अंतर्गत किसी सिमलिंक को तब छोड़ दिया जाता है जब उसका वास्तविक लक्ष्य उस रूट से बाहर समाधान होता है, जब तक कि लक्ष्य को स्पष्ट रूप से विश्वसनीय न बनाया गया हो।

लिंक की जाँच करें:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

यदि लक्ष्य जानबूझकर रखा गया है, तो प्रत्यक्ष Skill रूट और अनुमत सिमलिंक लक्ष्य दोनों कॉन्फ़िगर करें:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

फिर नया सत्र शुरू करें या Skills वॉचर के रीफ़्रेश होने की प्रतीक्षा करें। यदि चल रही प्रक्रिया कॉन्फ़िगरेशन परिवर्तन से पहले की है, तो Gateway पुनः आरंभ करें।

`~`, `/`, या संपूर्ण सिंक किए गए प्रोजेक्ट फ़ोल्डर जैसे व्यापक लक्ष्यों का उपयोग न करें। `allowSymlinkTargets` को उस वास्तविक Skill रूट तक सीमित रखें जिसमें विश्वसनीय `SKILL.md` डायरेक्टरियाँ हैं।

यदि Skill Workshop लागू करने की क्रिया को उन विश्वसनीय सिमलिंक वाली वर्कस्पेस Skill पथों के माध्यम से भी लिखना चाहिए, तो `skills.workshop.allowSymlinkTargetWrites` सक्षम करें। केवल-पढ़ने वाले साझा Skill रूट के लिए इसे अक्षम रखें।

संबंधित:

- [Skills कॉन्फ़िगरेशन](/hi/tools/skills-config#symlinked-skill-roots)
- [कॉन्फ़िगरेशन उदाहरण](/hi/gateway/configuration-examples#symlinked-sibling-skill-repo)

## लंबे कॉन्टेक्स्ट के लिए Anthropic 429 अतिरिक्त उपयोग आवश्यक

जब लॉग/त्रुटियों में यह शामिल हो, तब इसका उपयोग करें: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`।

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

इनकी जाँच करें:

- चयनित Anthropic मॉडल GA-सक्षम 1M Claude 4.x मॉडल (Opus 4.6/4.7/4.8, Sonnet 4.6) है, या मॉडल कॉन्फ़िगरेशन में अब भी पुराना `params.context1m: true` मौजूद है।
- वर्तमान Anthropic क्रेडेंशियल लंबे कॉन्टेक्स्ट के उपयोग के योग्य नहीं है।
- अनुरोध केवल उन लंबे सत्रों/मॉडल रन में विफल होते हैं जिन्हें 1M कॉन्टेक्स्ट पथ की आवश्यकता होती है।

समाधान विकल्प:

<Steps>
  <Step title="मानक कॉन्टेक्स्ट विंडो का उपयोग करें">
    किसी मानक-विंडो मॉडल पर स्विच करें, या पुराने मॉडल कॉन्फ़िगरेशन से पुराना
    `context1m` हटाएँ जो 1M कॉन्टेक्स्ट के लिए GA-सक्षम नहीं है।
  </Step>
  <Step title="योग्य क्रेडेंशियल का उपयोग करें">
    ऐसा Anthropic क्रेडेंशियल उपयोग करें जो लंबे-कॉन्टेक्स्ट अनुरोधों के योग्य हो, या Anthropic API कुंजी पर स्विच करें।
  </Step>
  <Step title="फ़ॉलबैक मॉडल कॉन्फ़िगर करें">
    फ़ॉलबैक मॉडल कॉन्फ़िगर करें ताकि Anthropic के लंबे-कॉन्टेक्स्ट अनुरोध अस्वीकार होने पर भी रन जारी रहें।
  </Step>
</Steps>

संबंधित:

- [Anthropic](/hi/providers/anthropic)
- [टोकन का उपयोग और लागत](/hi/reference/token-use)
- [मुझे Anthropic से HTTP 429 क्यों दिखाई दे रहा है?](/hi/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## अपस्ट्रीम 403 अवरुद्ध प्रतिक्रियाएँ

जब कोई अपस्ट्रीम LLM प्रदाता `Your request was blocked` जैसी सामान्य `403` लौटाए, तब इसका उपयोग करें।

यह न मानें कि यह हमेशा OpenClaw कॉन्फ़िगरेशन की समस्या है। प्रतिक्रिया किसी अपस्ट्रीम सुरक्षा परत से आ सकती है, जैसे CDN, WAF, बॉट-प्रबंधन नियम, या OpenAI-संगत एंडपॉइंट के सामने स्थित रिवर्स प्रॉक्सी।

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

इनकी जाँच करें:

- एक ही प्रदाता के अंतर्गत कई मॉडल एक ही तरह से विफल हो रहे हैं।
- सामान्य प्रदाता API त्रुटि के बजाय HTML या सामान्य सुरक्षा टेक्स्ट।
- उसी अनुरोध समय के प्रदाता-पक्ष के सुरक्षा इवेंट।
- सामान्य SDK-आकार वाले अनुरोध विफल होने के दौरान एक छोटा प्रत्यक्ष `curl` प्रोब सफल हो रहा है।

जब साक्ष्य WAF/CDN अवरोध की ओर संकेत करें, तो पहले प्रदाता-पक्ष की फ़िल्टरिंग ठीक करें। OpenClaw द्वारा उपयोग किए जाने वाले API पथ के लिए संकीर्ण दायरे वाला अनुमति या छोड़ने का नियम अपनाएँ, और पूरी साइट की सुरक्षा अक्षम करने से बचें।

<Warning>
एक सफल न्यूनतम `curl` इस बात की गारंटी नहीं देता कि वास्तविक SDK-शैली के अनुरोध उसी अपस्ट्रीम सुरक्षा परत से सफलतापूर्वक गुज़रेंगे।
</Warning>

संबंधित:

- [OpenAI-संगत एंडपॉइंट](/hi/gateway/configuration-reference#openai-compatible-endpoints)
- [प्रदाता कॉन्फ़िगरेशन](/hi/providers)
- [लॉग](/hi/logging)

## स्थानीय OpenAI-संगत बैकएंड प्रत्यक्ष प्रोब में सफल होता है, लेकिन एजेंट रन विफल होते हैं

इस स्थिति में उपयोग करें:

- `curl ... /v1/models` काम करता है।
- छोटी प्रत्यक्ष `/v1/chat/completions` कॉल काम करती हैं।
- OpenClaw मॉडल रन केवल सामान्य एजेंट टर्न पर विफल होते हैं।

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

इनकी जाँच करें:

- प्रत्यक्ष छोटी कॉल सफल होती हैं, लेकिन OpenClaw रन केवल बड़े प्रॉम्प्ट पर विफल होते हैं।
- `model_not_found` या 404 त्रुटियाँ, भले ही प्रत्यक्ष `/v1/chat/completions` उसी मूल मॉडल आईडी के साथ काम करता हो।
- बैकएंड त्रुटियाँ कि `messages[].content` को स्ट्रिंग अपेक्षित है।
- OpenAI-संगत स्थानीय बैकएंड के साथ रुक-रुककर आने वाली `incomplete turn detected ... stopReason=stop payloads=0` चेतावनियाँ।
- बैकएंड क्रैश जो केवल अधिक प्रॉम्प्ट-टोकन संख्या या पूर्ण एजेंट रनटाइम प्रॉम्प्ट के साथ दिखाई देते हैं।

<AccordionGroup>
  <Accordion title="सामान्य संकेत">
    - स्थानीय MLX/vLLM-शैली सर्वर के साथ `model_not_found`: सत्यापित करें कि `baseUrl` में `/v1` शामिल है, `/v1/chat/completions` बैकएंड के लिए `api`, `"openai-completions"` है, और `models.providers.<provider>.models[].id` मूल प्रदाता-स्थानीय आईडी है। इसे एक बार प्रदाता उपसर्ग के साथ चुनें, उदाहरण के लिए `mlx/mlx-community/Qwen3-30B-A3B-6bit`; कैटलॉग प्रविष्टि को `mlx-community/Qwen3-30B-A3B-6bit` ही रखें।
    - `messages[...].content: invalid type: sequence, expected a string`: बैकएंड संरचित Chat Completions सामग्री भागों को अस्वीकार करता है। समाधान: `models.providers.<provider>.models[].compat.requiresStringContent: true` सेट करें।
    - `validation.keys` या `["role","content"]` जैसी अनुमत संदेश कुंजियाँ: बैकएंड Chat Completions संदेशों पर OpenAI-शैली के रीप्ले मेटाडेटा को अस्वीकार करता है। समाधान: `models.providers.<provider>.models[].compat.strictMessageKeys: true` सेट करें।
    - `incomplete turn detected ... stopReason=stop payloads=0`: बैकएंड ने Chat Completions अनुरोध पूरा किया, लेकिन उस टर्न के लिए उपयोगकर्ता को दिखाई देने वाला कोई सहायक टेक्स्ट नहीं लौटाया। OpenClaw रीप्ले-सुरक्षित खाली OpenAI-संगत टर्न का एक बार पुनः प्रयास करता है; लगातार विफलताओं का सामान्य अर्थ है कि बैकएंड खाली/गैर-टेक्स्ट सामग्री उत्सर्जित कर रहा है या अंतिम उत्तर का टेक्स्ट दबा रहा है।
    - प्रत्यक्ष छोटे अनुरोध सफल होते हैं, लेकिन OpenClaw एजेंट रन बैकएंड/मॉडल क्रैश के साथ विफल होते हैं (उदाहरण के लिए कुछ `inferrs` बिल्ड पर Gemma): संभवतः OpenClaw ट्रांसपोर्ट पहले से सही है; बैकएंड बड़े एजेंट-रनटाइम प्रॉम्प्ट आकार पर विफल हो रहा है।
    - टूल अक्षम करने के बाद विफलताएँ कम होती हैं लेकिन समाप्त नहीं होतीं: टूल स्कीमा दबाव का हिस्सा थे, लेकिन शेष समस्या अब भी अपस्ट्रीम मॉडल/सर्वर क्षमता या बैकएंड बग है।

  </Accordion>
  <Accordion title="समाधान विकल्प">
    1. केवल-स्ट्रिंग Chat Completions बैकएंड के लिए `compat.requiresStringContent: true` सेट करें।
    2. ऐसे सख्त Chat Completions बैकएंड के लिए `compat.strictMessageKeys: true` सेट करें जो प्रत्येक संदेश पर केवल `role` और `content` स्वीकार करते हैं।
    3. ऐसे मॉडल/बैकएंड के लिए `compat.supportsTools: false` सेट करें जो OpenClaw के टूल स्कीमा सतह को विश्वसनीय रूप से संभाल नहीं सकते।
    4. जहाँ संभव हो प्रॉम्प्ट दबाव कम करें: छोटा वर्कस्पेस बूटस्ट्रैप, संक्षिप्त सत्र इतिहास, हल्का स्थानीय मॉडल, या अधिक सक्षम लंबे-कॉन्टेक्स्ट समर्थन वाला बैकएंड।
    5. यदि छोटे प्रत्यक्ष अनुरोध लगातार सफल होते रहें, जबकि OpenClaw एजेंट टर्न अब भी बैकएंड के भीतर क्रैश हों, तो इसे अपस्ट्रीम सर्वर/मॉडल की सीमा मानें और स्वीकार किए गए पेलोड आकार के साथ वहाँ पुनरुत्पादन रिपोर्ट दर्ज करें।
  </Accordion>
</AccordionGroup>

संबंधित:

- [कॉन्फ़िगरेशन](/hi/gateway/configuration)
- [स्थानीय मॉडल](/hi/gateway/local-models)
- [OpenAI-संगत एंडपॉइंट](/hi/gateway/configuration-reference#openai-compatible-endpoints)

## कोई उत्तर नहीं

यदि चैनल चालू हैं, लेकिन कोई उत्तर नहीं मिल रहा है, तो किसी भी चीज़ को फिर से कनेक्ट करने से पहले रूटिंग और नीति जाँचें।

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

इनकी जाँच करें:

- DM प्रेषकों के लिए पेयरिंग लंबित है।
- समूह में उल्लेख की गेटिंग (`requireMention`, `mentionPatterns`)।
- चैनल/समूह अनुमति-सूची में असंगतियाँ।

सामान्य संकेत:

- `drop guild message (mention required` → उल्लेख होने तक समूह संदेश अनदेखा किया गया।
- `pairing request` → प्रेषक को स्वीकृति चाहिए।
- `blocked` / `allowlist` → प्रेषक/चैनल को नीति द्वारा फ़िल्टर किया गया।

संबंधित:

- [चैनल की समस्या निवारण](/hi/channels/troubleshooting)
- [समूह](/hi/channels/groups)
- [पेयरिंग](/hi/channels/pairing)

## डैशबोर्ड नियंत्रण UI कनेक्टिविटी

जब डैशबोर्ड/नियंत्रण UI कनेक्ट न हो, तो URL, प्रमाणीकरण मोड और सुरक्षित संदर्भ संबंधी धारणाओं की पुष्टि करें।

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

इनकी जाँच करें:

- सही जाँच URL और डैशबोर्ड URL।
- क्लाइंट और Gateway के बीच प्रमाणीकरण मोड/टोकन असंगति।
- जहाँ डिवाइस पहचान आवश्यक है, वहाँ HTTP का उपयोग।

यदि किसी अपडेट के बाद स्थानीय ब्राउज़र `127.0.0.1:18789` से कनेक्ट नहीं हो सकता, तो पहले स्थानीय Gateway सेवा पुनर्स्थापित करें और पुष्टि करें कि वह डैशबोर्ड प्रस्तुत कर रही है:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

यदि `curl` OpenClaw HTML लौटाता है, तो Gateway काम कर रहा है और शेष समस्या संभवतः ब्राउज़र कैश, कोई पुराना डीप लिंक या टैब की पुरानी स्थिति है। `http://127.0.0.1:18789` को सीधे खोलें और डैशबोर्ड से नेविगेट करें। यदि पुनः आरंभ करने के बाद सेवा चालू नहीं रहती, तो `openclaw gateway start` चलाएँ और `openclaw gateway status` फिर से जाँचें।

<AccordionGroup>
  <Accordion title="कनेक्शन / प्रमाणीकरण संकेत">
    - `device identity required` → असुरक्षित संदर्भ या डिवाइस प्रमाणीकरण अनुपस्थित है।
    - `origin not allowed` → ब्राउज़र `Origin`, `gateway.controlUi.allowedOrigins` में नहीं है (या आप स्पष्ट अनुमति-सूची के बिना किसी गैर-लूपबैक ब्राउज़र मूल से कनेक्ट कर रहे हैं)।
    - `device nonce required` / `device nonce mismatch` → क्लाइंट चुनौती-आधारित डिवाइस प्रमाणीकरण प्रवाह (`connect.challenge` + `device.nonce`) पूरा नहीं कर रहा है।
    - `device signature invalid` / `device signature expired` → क्लाइंट ने वर्तमान हैंडशेक के लिए गलत पेलोड (या पुराना टाइमस्टैम्प) हस्ताक्षरित किया।
    - `AUTH_TOKEN_MISMATCH` के साथ `canRetryWithDeviceToken=true` → क्लाइंट कैश किए गए डिवाइस टोकन के साथ एक विश्वसनीय पुनः प्रयास कर सकता है।
    - वह कैश-टोकन पुनः प्रयास, पेयर किए गए डिवाइस टोकन के साथ संग्रहीत कैश किए गए स्कोप सेट का पुनः उपयोग करता है। इसके बजाय स्पष्ट `deviceToken` / स्पष्ट `scopes` कॉलर अपना अनुरोधित स्कोप सेट बनाए रखते हैं।
    - `AUTH_SCOPE_MISMATCH` → डिवाइस टोकन पहचाना गया था, लेकिन उसके स्वीकृत स्कोप इस कनेक्शन अनुरोध को कवर नहीं करते; साझा Gateway टोकन बदलने के बजाय फिर से पेयर करें या अनुरोधित स्कोप अनुबंध स्वीकृत करें।
    - उस पुनः प्रयास पथ के बाहर, कनेक्शन प्रमाणीकरण की प्राथमिकता में पहले स्पष्ट साझा टोकन/पासवर्ड, फिर स्पष्ट `deviceToken`, फिर संग्रहीत डिवाइस टोकन और अंत में बूटस्ट्रैप टोकन आता है।
    - असिंक्रोनस Tailscale Serve नियंत्रण UI पथ पर, समान `{scope, ip}` के विफल प्रयासों को सीमक द्वारा विफलता दर्ज किए जाने से पहले क्रमबद्ध किया जाता है। इसलिए समान क्लाइंट से एक साथ किए गए दो खराब पुनः प्रयासों में, दो सामान्य असंगतियों के बजाय दूसरे प्रयास पर `retry later` दिखाई दे सकता है।
    - ब्राउज़र-मूल लूपबैक क्लाइंट से `too many failed authentication attempts (retry later)` → उसी सामान्यीकृत `Origin` से बार-बार होने वाली विफलताओं को अस्थायी रूप से अवरुद्ध किया जाता है; कोई अन्य localhost मूल अलग बकेट का उपयोग करता है।
    - उस पुनः प्रयास के बाद बार-बार `unauthorized` → साझा टोकन/डिवाइस टोकन में अंतर; टोकन कॉन्फ़िगरेशन रीफ़्रेश करें और आवश्यकता होने पर डिवाइस टोकन को फिर से स्वीकृत/परिवर्तित करें।
    - `gateway connect failed:` → गलत होस्ट/पोर्ट/URL लक्ष्य।

  </Accordion>
</AccordionGroup>

### प्रमाणीकरण विवरण कोड का त्वरित मानचित्र

अगली कार्रवाई चुनने के लिए विफल `connect` प्रतिक्रिया से `error.details.code` का उपयोग करें:

| विवरण कोड                  | अर्थ                                                                                                                                                                                      | अनुशंसित कार्रवाई                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | क्लाइंट ने आवश्यक साझा टोकन नहीं भेजा।                                                                                                                                                 | क्लाइंट में टोकन पेस्ट/सेट करें और फिर प्रयास करें। डैशबोर्ड पथों के लिए: `openclaw config get gateway.auth.token`, फिर नियंत्रण UI सेटिंग में पेस्ट करें।                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | साझा टोकन Gateway प्रमाणीकरण टोकन से मेल नहीं खाता।                                                                                                                                               | यदि `canRetryWithDeviceToken=true` हो, तो एक विश्वसनीय पुनः प्रयास की अनुमति दें। कैश-टोकन पुनः प्रयास संग्रहीत स्वीकृत स्कोप का पुनः उपयोग करते हैं; स्पष्ट `deviceToken` / `scopes` कॉलर अनुरोधित स्कोप बनाए रखते हैं। यदि फिर भी विफल हो, तो [टोकन अंतर पुनर्प्राप्ति जाँच-सूची](/hi/cli/devices#token-drift-recovery-checklist) चलाएँ। |
| `AUTH_DEVICE_TOKEN_MISMATCH` | प्रति-डिवाइस कैश किया गया टोकन पुराना है या निरस्त किया जा चुका है।                                                                                                                                                 | [डिवाइस CLI](/hi/cli/devices) का उपयोग करके डिवाइस टोकन बदलें/फिर से स्वीकृत करें, फिर दोबारा कनेक्ट करें।                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | डिवाइस टोकन मान्य है, लेकिन उसकी स्वीकृत भूमिका/स्कोप इस कनेक्शन अनुरोध को कवर नहीं करते।                                                                                                       | डिवाइस को फिर से पेयर करें या अनुरोधित स्कोप अनुबंध स्वीकृत करें; इसे साझा-टोकन अंतर न मानें।                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | डिवाइस पहचान को स्वीकृति चाहिए। `not-paired`, `scope-upgrade`, `role-upgrade`, या `metadata-upgrade` के लिए `error.details.reason` जाँचें और उपलब्ध होने पर `requestId` / `remediationHint` का उपयोग करें। | लंबित अनुरोध स्वीकृत करें: `openclaw devices list`, फिर `openclaw devices approve <requestId>`। अनुरोधित पहुँच की समीक्षा करने के बाद स्कोप/भूमिका अपग्रेड भी इसी प्रवाह का उपयोग करते हैं।                                                                                                               |

<Note>
साझा Gateway टोकन/पासवर्ड से प्रमाणित प्रत्यक्ष लूपबैक बैकएंड RPC को CLI की पेयर किए गए डिवाइस की स्कोप आधाररेखा पर निर्भर नहीं होना चाहिए। यदि सबएजेंट या अन्य आंतरिक कॉल अब भी `scope-upgrade` के साथ विफल होते हैं, तो पुष्टि करें कि कॉलर `client.id: "gateway-client"` और `client.mode: "backend"` का उपयोग कर रहा है और स्पष्ट `deviceIdentity` या डिवाइस टोकन बाध्य नहीं कर रहा है।
</Note>

डिवाइस प्रमाणीकरण v2 माइग्रेशन जाँच:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

यदि लॉग नॉन्स/हस्ताक्षर त्रुटियाँ दिखाते हैं, तो कनेक्ट होने वाले क्लाइंट को अपडेट करें और इसकी पुष्टि करें:

<Steps>
  <Step title="connect.challenge की प्रतीक्षा करें">
    क्लाइंट Gateway द्वारा जारी `connect.challenge` की प्रतीक्षा करता है।
  </Step>
  <Step title="पेलोड पर हस्ताक्षर करें">
    क्लाइंट चुनौती-बद्ध पेलोड पर हस्ताक्षर करता है।
  </Step>
  <Step title="डिवाइस नॉन्स भेजें">
    क्लाइंट समान चुनौती नॉन्स के साथ `connect.params.device.nonce` भेजता है।
  </Step>
</Steps>

यदि `openclaw devices rotate` / `revoke` / `remove` को अप्रत्याशित रूप से अस्वीकार किया जाता है:

- पेयर किए गए डिवाइस के टोकन सत्र केवल **अपने स्वयं के** डिवाइस को प्रबंधित कर सकते हैं, जब तक कि कॉलर के पास `operator.admin` भी न हो।
- `openclaw devices rotate --scope ...` केवल वे ऑपरेटर स्कोप अनुरोधित कर सकता है जो कॉलर सत्र के पास पहले से हैं।

संबंधित:

- [कॉन्फ़िगरेशन](/hi/gateway/configuration) (Gateway प्रमाणीकरण मोड)
- [नियंत्रण UI](/hi/web/control-ui)
- [डिवाइस](/hi/cli/devices)
- [दूरस्थ पहुँच](/hi/gateway/remote)
- [विश्वसनीय प्रॉक्सी प्रमाणीकरण](/hi/gateway/trusted-proxy-auth)

## Gateway सेवा नहीं चल रही है

इसका उपयोग तब करें जब सेवा इंस्टॉल हो, लेकिन प्रक्रिया चालू न रहे।

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # सिस्टम-स्तरीय सेवाएँ भी स्कैन करें
```

इनकी जाँच करें:

- निकास संकेतों के साथ `Runtime: stopped`।
- सेवा कॉन्फ़िगरेशन में असंगति (`Config (cli)` बनाम `Config (service)`)।
- पोर्ट/लिसनर टकराव।
- `--deep` का उपयोग होने पर अतिरिक्त launchd/systemd/schtasks इंस्टॉलेशन।
- `Other gateway-like services detected (best effort)` सफ़ाई संकेत।

<AccordionGroup>
  <Accordion title="सामान्य संकेत">
    - `Gateway start blocked: set gateway.mode=local` या `existing config is missing gateway.mode` → स्थानीय Gateway मोड सक्षम नहीं है या कॉन्फ़िगरेशन फ़ाइल अधिलेखित हो गई और उसमें से `gateway.mode` हट गया। समाधान: अपने कॉन्फ़िगरेशन में `gateway.mode="local"` सेट करें या अपेक्षित स्थानीय-मोड कॉन्फ़िगरेशन को दोबारा दर्ज करने के लिए `openclaw onboard --mode local` / `openclaw setup` फिर से चलाएँ। यदि आप Podman के माध्यम से OpenClaw चला रहे हैं, तो डिफ़ॉल्ट कॉन्फ़िगरेशन पथ `~/.openclaw/openclaw.json` है।
    - `refusing to bind gateway ... without auth` → वैध Gateway प्रमाणीकरण पथ के बिना गैर-लूपबैक बाइंड (टोकन/पासवर्ड या, जहाँ कॉन्फ़िगर किया गया हो, विश्वसनीय प्रॉक्सी)।
    - `another gateway instance is already listening` / `EADDRINUSE` → पोर्ट टकराव।
    - `Other gateway-like services detected (best effort)` → पुराने या समानांतर launchd/systemd/schtasks यूनिट मौजूद हैं। अधिकांश सेटअप में प्रति मशीन एक Gateway रखना चाहिए; यदि आपको एक से अधिक की आवश्यकता है, तो पोर्ट + कॉन्फ़िगरेशन/स्थिति/वर्कस्पेस को पृथक करें। [/gateway#multiple-gateways-same-host](/hi/gateway#multiple-gateways-same-host) देखें।
    - doctor से `System-level OpenClaw gateway service detected` → उपयोगकर्ता-स्तरीय सेवा अनुपस्थित होने के दौरान एक systemd सिस्टम यूनिट मौजूद है। doctor को उपयोगकर्ता सेवा इंस्टॉल करने देने से पहले डुप्लिकेट को हटाएँ या अक्षम करें, या यदि सिस्टम यूनिट ही अभीष्ट पर्यवेक्षक है तो `OPENCLAW_SERVICE_REPAIR_POLICY=external` सेट करें।
    - `Gateway service port does not match current gateway config` → इंस्टॉल किया गया पर्यवेक्षक अब भी पुराने `--port` को पिन करता है। `openclaw doctor --fix` या `openclaw gateway install --force` चलाएँ, फिर Gateway सेवा पुनः आरंभ करें।

  </Accordion>
</AccordionGroup>

संबंधित:

- [पृष्ठभूमि निष्पादन और प्रक्रिया टूल](/hi/gateway/background-process)
- [कॉन्फ़िगरेशन](/hi/gateway/configuration)
- [Doctor](/hi/gateway/doctor)

## macOS Gateway चुपचाप प्रतिक्रिया देना बंद कर देता है, फिर डैशबोर्ड को छूने पर दोबारा शुरू हो जाता है

जब macOS होस्ट पर चैनल (Telegram, WhatsApp आदि) एक बार में कई मिनटों से लेकर घंटों तक शांत हो जाएँ और आपके Control UI खोलते ही, SSH से कनेक्ट करते ही या होस्ट के साथ किसी अन्य तरीके से इंटरैक्ट करते ही gateway वापस सक्रिय होता दिखाई दे, तब इसका उपयोग करें। आम तौर पर `openclaw status` में कोई स्पष्ट लक्षण नहीं होता, क्योंकि जब तक आप जाँचते हैं, gateway फिर से सक्रिय हो चुका होता है।

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

इनकी तलाश करें:

- `~/.openclaw/logs/stability/` में एक या अधिक `*-uncaught_exception.json` बंडल, जिनमें `error.code` को `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH` या `ECONNREFUSED` जैसे अस्थायी नेटवर्क कोड पर सेट किया गया हो।
- क्रैश टाइमस्टैम्प के अनुरूप `Entering Sleep state due to 'Maintenance Sleep'` या `en0 driver is slow (msg: WillChangeState to 0)` जैसी `pmset -g log` पंक्तियाँ। Power Nap / Maintenance Sleep कुछ समय के लिए Wi-Fi ड्राइवर को स्थिति 0 में डाल देता है; उस अवधि में होने वाला कोई भी आउटबाउंड `connect()`, अन्यथा पूर्ण नेटवर्क कनेक्टिविटी वाले होस्ट पर भी `ENETDOWN` के साथ विफल हो सकता है।
- `state = not running` दिखाने वाला `launchctl print` आउटपुट, जिसमें हाल के कई `runs` और एक निकास कोड हों, विशेष रूप से जब क्रैश और अगले लॉन्च के बीच का अंतर सेकंड के बजाय लगभग एक घंटे का हो। macOS launchd लगातार कई क्रैश के बाद एक गैर-दस्तावेजीकृत पुनः-सृजन सुरक्षा गेट लागू करता है, जो इंटरैक्टिव लॉगिन, डैशबोर्ड कनेक्शन या `launchctl kickstart` जैसे किसी बाहरी ट्रिगर द्वारा इसे पुनः सक्रिय किए जाने तक `KeepAlive=true` का पालन बंद कर सकता है।

सामान्य संकेत:

- एक स्थिरता बंडल, जिसका `error.code`, `ENETDOWN` या संबंधित कोड हो और कॉल स्टैक Node `net` `lookupAndConnect` / `Socket.connect` की ओर संकेत करे। OpenClaw `2026.5.26` और उसके बाद के संस्करण इन्हें अहानिकर अस्थायी नेटवर्क त्रुटियों के रूप में वर्गीकृत करते हैं, इसलिए अब ये शीर्ष-स्तरीय अनकॉट हैंडलर तक प्रसारित नहीं होतीं; यदि आप किसी पुराने रिलीज़ पर हैं, तो पहले अपग्रेड करें।
- लंबी शांत अवधियाँ, जो आपके Control UI से कनेक्ट करते या होस्ट में SSH करते ही समाप्त हो जाती हैं: उपयोगकर्ता को दिखाई देने वाली गतिविधि ही launchd के पुनः-सृजन गेट को दोबारा सक्रिय करती है, डैशबोर्ड gateway के साथ ऐसा कुछ नहीं करता।
- पूरे दिन `runs` की संख्या बढ़ना, जबकि `~/Library/Logs/openclaw/gateway.log` में उससे संबंधित कोई `received SIG*; shutting down` पंक्ति न हो: सामान्य शटडाउन सिग्नल को लॉग करते हैं; अस्थायी क्रैश नहीं।

क्या करें:

1. यदि आप `2026.5.26` से पहले का रिलीज़ चला रहे हैं, तो **gateway अपग्रेड करें**। अपग्रेड करने के बाद, भविष्य की `ENETDOWN` त्रुटियाँ प्रक्रिया को समाप्त करने के बजाय चेतावनियों के रूप में लॉग की जाती हैं।
2. हमेशा चालू सर्वर के रूप में उपयोग किए जाने वाले Mac mini / डेस्कटॉप होस्ट पर **मेंटेनेंस स्लीप गतिविधि कम करें**:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   इससे अंतर्निहित ड्राइवर अस्थिरता काफी कम होती है, लेकिन पूरी तरह समाप्त नहीं होती। इन फ़्लैग के बावजूद सिस्टम TCP keepalive और mDNS रखरखाव के लिए कुछ मेंटेनेंस स्लीप अब भी कर सकता है।

3. एक **लाइवनेस वॉचडॉग जोड़ें**, ताकि launchd द्वारा रोकी गई भविष्य की क्रैश शृंखला का शीघ्र पता लगाया जा सके:

   ```bash
   # launchd से अवगत लाइवनेस जाँच का उदाहरण, 5-मिनट के cron या LaunchAgent के लिए उपयुक्त
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   इसका उद्देश्य पुनः-सृजन गेट को बाहरी रूप से दोबारा सक्रिय करना है; क्रैश शृंखला के बाद macOS पर केवल `KeepAlive=true` पर्याप्त नहीं है।

संबंधित:

- [macOS प्लेटफ़ॉर्म नोट्स](/hi/platforms/macos)
- [लॉगिंग](/hi/logging)
- [Doctor](/hi/gateway/doctor)

## डुप्लिकेट gateway/node LaunchAgents वाला macOS launchd सुपरवाइज़र लूप

इसका उपयोग तब करें, जब macOS इंस्टॉलेशन हर कुछ सेकंड में पुनः आरंभ होता रहे, `openclaw`
स्वास्थ्य जाँच स्वस्थ और अनुपलब्ध स्थितियों के बीच बदलती रहे और चैनल डिस्पैच रुक जाए,
भले ही सेवा चलती हुई दिखाई दे।

यह उन पुराने इंस्टॉलेशन पर देखा गया था, जहाँ `ai.openclaw.gateway` और
`ai.openclaw.node` दोनों LaunchAgents सक्रिय थे और प्रत्येक ने
`OPENCLAW_LAUNCHD_LABEL` इंजेक्ट किया था। उस स्थिति में OpenClaw launchd
पर्यवेक्षण का पता लगा सकता है, पुनः आरंभ का नियंत्रण launchd को वापस सौंपने का प्रयास कर सकता है और एक स्थिर gateway प्रक्रिया के बजाय तेज़
`EADDRINUSE`/पुनः-सृजन लूप में फँस सकता है।

```bash
for i in 1 2 3 4; do
  ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
  sleep 10
done

openclaw gateway status --deep
openclaw node status
launchctl print gui/$UID/ai.openclaw.gateway | grep -E 'state|last exit|runs'
tail -n 80 ~/Library/Logs/openclaw/gateway.log
```

इनकी तलाश करें:

- 30-सेकंड के नमूने में एक स्थिर प्रक्रिया के बजाय एक से अधिक gateway PID।
- `EADDRINUSE`, `another gateway instance is already listening` या
  `gateway.log` में बार-बार आने वाली पुनः आरंभ/हैंडऑफ़ पंक्तियाँ।
- ऐसे होस्ट पर `~/Library/LaunchAgents/ai.openclaw.gateway.plist` और
  `~/Library/LaunchAgents/ai.openclaw.node.plist` दोनों का एक साथ लोड होना,
  जहाँ केवल एक प्रबंधित gateway सेवा चलनी चाहिए।

क्या करें:

1. यदि इस होस्ट पर केवल Gateway सेवा चलनी चाहिए, तो OpenClaw के माध्यम से प्रबंधित node
   सेवा हटाएँ। यदि आप रिमोट node सुविधाओं के लिए सक्रिय रूप से node
   सेवा पर निर्भर हैं, तो **यह चरण छोड़ दें**; इसे अनइंस्टॉल करने से
   इस होस्ट पर वे सुविधाएँ बंद हो जाती हैं:

   ```bash
   openclaw node uninstall
   ```

2. एक स्थायी Gateway रैपर इंस्टॉल करें, जो OpenClaw शुरू करने से पहले इनहेरिट किए गए launchd
   मार्कर साफ़ कर दे। समर्थित `--wrapper` विकल्प का उपयोग करें;
   `~/.openclaw/service-env/` के अंतर्गत जनरेट की गई फ़ाइल को संपादित न करें, क्योंकि सेवा
   को दोबारा इंस्टॉल करने, अपडेट करने और doctor द्वारा सुधारने पर वह फ़ाइल फिर से जनरेट होती है:

   ```bash
   mkdir -p ~/.local/bin
   cat >~/.local/bin/openclaw-launchd-workaround <<'EOF'
   #!/bin/sh
   set -eu
   unset OPENCLAW_LAUNCHD_LABEL LAUNCH_JOB_LABEL LAUNCH_JOB_NAME XPC_SERVICE_NAME || true
   exec openclaw "$@"
   EOF
   chmod 700 ~/.local/bin/openclaw-launchd-workaround

   openclaw gateway install \
     --wrapper ~/.local/bin/openclaw-launchd-workaround \
     --force
   ```

   `gateway install` बाध्य पुनः इंस्टॉल, अपडेट और doctor मरम्मत के दौरान
   रैपर पथ को बनाए रखता है।

3. सत्यापित करें कि Gateway स्थिर है और RPC प्रदान कर रहा है, केवल सुन नहीं रहा है:

   ```bash
   openclaw gateway status --deep --require-rpc

   for i in 1 2 3 4; do
     ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
     sleep 10
   done
   ```

   PID नमूने में बदलते रहने वाले PID के समूह के बजाय एक स्थिर प्रक्रिया दिखनी चाहिए,
   और इनबाउंड चैनल डिस्पैच फिर से शुरू होना चाहिए।

4. उस रिलीज़ में अपग्रेड करने के बाद, जिसमें अंतर्निहित दोहरा-LaunchAgent लूप
   ठीक कर दिया गया है, वैकल्पिक उपाय हटाएँ और सामान्य प्रबंधित सेवा पुनः इंस्टॉल करें:

   ```bash
   OPENCLAW_WRAPPER= openclaw gateway install --force
   rm ~/.local/bin/openclaw-launchd-workaround
   ```

संबंधित:

- [macOS प्लेटफ़ॉर्म नोट्स](/hi/platforms/mac/bundled-gateway)
- [Doctor](/hi/gateway/doctor)
- [Gateway CLI](/hi/cli/gateway)

## अधिक मेमोरी उपयोग के दौरान Gateway बंद हो जाता है

इसका उपयोग तब करें, जब लोड के दौरान Gateway गायब हो जाए, सुपरवाइज़र OOM-जैसे पुनः प्रारंभ की सूचना दे या लॉग में `critical memory pressure bundle written` का उल्लेख हो।

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

इन्हें खोजें:

- नवीनतम स्थिरता बंडल में `Reason: diagnostic.memory.pressure.critical`।
- `critical/rss_threshold`, `critical/heap_threshold` या `critical/rss_growth` के साथ `Memory pressure:`।
- हीप सीमा के निकट `V8 heap:` मान।
- `agents/<agent>/sessions/<session>.jsonl` या `sessions/<session>.jsonl` जैसी `Largest session files:` प्रविष्टियाँ।
- जब Gateway किसी कंटेनर या मेमोरी-सीमित सेवा में चलता हो, तब Linux cgroup मेमोरी काउंटर।

सामान्य संकेत:

- पुनः प्रारंभ होने से कुछ समय पहले `critical memory pressure bundle written` दिखाई देता है → OpenClaw ने OOM-पूर्व स्थिरता बंडल कैप्चर किया। `openclaw gateway stability --bundle latest` से उसका निरीक्षण करें।
- Gateway लॉग में `memory pressure: level=critical ... memoryPressureSnapshot=disabled` दिखाई देता है → OpenClaw ने गंभीर मेमोरी दबाव का पता लगाया, लेकिन OOM-पूर्व स्थिरता स्नैपशॉट बंद है।
- `Largest session files:` किसी बहुत बड़े संशोधित ट्रांसक्रिप्ट पथ की ओर संकेत करता है → पुनः प्रारंभ करने से पहले बनाए रखे गए सत्र इतिहास को घटाएँ, सत्र वृद्धि का निरीक्षण करें या पुराने ट्रांसक्रिप्ट को सक्रिय स्टोर से बाहर ले जाएँ।
- प्रयुक्त `V8 heap:` बाइट हीप सीमा के निकट हैं → पहले प्रॉम्प्ट/सत्र दबाव कम करें या समवर्ती कार्य घटाएँ। किसी प्रबंधित सेवा के लिए, `openclaw gateway status` में `Gateway heap:` का निरीक्षण करें; यदि उसमें `not set` लिखा है, तो `openclaw gateway install --force` से पुराना सेवा मेटाडेटा पुनः जनरेट करें। परिवेशी शेल `NODE_OPTIONS` को जानबूझकर अनदेखा किया जाता है। स्पष्ट सुपरवाइज़र-स्तरीय हीप ओवरराइड का उपयोग केवल निरंतर कार्यभार की पुष्टि करने और पर्याप्त नेटिव-मेमोरी गुंजाइश छोड़ने के बाद करें।
- `Memory pressure: critical/rss_growth` → एक सैंपलिंग विंडो के भीतर मेमोरी तेज़ी से बढ़ी। किसी बड़े इम्पोर्ट, अनियंत्रित टूल आउटपुट, बार-बार किए गए पुनः प्रयास या कतारबद्ध एजेंट कार्य के बैच के लिए नवीनतम लॉग जाँचें।
- लॉग में गंभीर मेमोरी दबाव दिखाई देता है, लेकिन कोई बंडल मौजूद नहीं है → यह डिफ़ॉल्ट व्यवहार है। भविष्य की गंभीर मेमोरी दबाव घटनाओं पर OOM-पूर्व स्थिरता बंडल कैप्चर करने के लिए `diagnostics.memoryPressureSnapshot: true` सेट करें।

स्थिरता बंडल पेलोड-रहित है। इसमें संचालन संबंधी मेमोरी प्रमाण और संशोधित सापेक्ष फ़ाइल पथ शामिल होते हैं, संदेश टेक्स्ट, webhook बॉडी, क्रेडेंशियल, टोकन, कुकी या अपरिवर्तित सत्र ID नहीं। अपरिवर्तित लॉग कॉपी करने के बजाय बग रिपोर्ट में डायग्नोस्टिक्स एक्सपोर्ट संलग्न करें।

संबंधित:

- [Gateway स्वास्थ्य](/hi/gateway/health)
- [डायग्नोस्टिक्स एक्सपोर्ट](/hi/gateway/diagnostics)
- [सत्र](/hi/cli/sessions)

## Gateway ने अमान्य कॉन्फ़िगरेशन अस्वीकार किया

इसका उपयोग तब करें, जब Gateway स्टार्टअप `Invalid config` के साथ विफल हो या हॉट रीलोड लॉग बताएँ कि उसने किसी अमान्य संपादन को छोड़ दिया।

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

इन्हें खोजें:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- सक्रिय कॉन्फ़िगरेशन के पास टाइमस्टैम्प वाली `openclaw.json.rejected.*` फ़ाइल।
- यदि `doctor --fix` ने किसी टूटे हुए प्रत्यक्ष संपादन की मरम्मत की है, तो टाइमस्टैम्प वाली `openclaw.json.clobbered.*` फ़ाइल।
- OpenClaw प्रत्येक कॉन्फ़िगरेशन पथ के लिए नवीनतम 32 `.clobbered.*` फ़ाइलें रखता है और पुरानी फ़ाइलों को क्रमावर्तित करता है।

<AccordionGroup>
  <Accordion title="क्या हुआ">
    - स्टार्टअप, हॉट रीलोड या OpenClaw के स्वामित्व वाले लेखन के दौरान कॉन्फ़िगरेशन सत्यापित नहीं हुआ।
    - Gateway स्टार्टअप `openclaw.json` को दोबारा लिखने के बजाय सुरक्षित रूप से विफल हो जाता है।
    - हॉट रीलोड अमान्य बाहरी संपादनों को छोड़ देता है और वर्तमान रनटाइम कॉन्फ़िगरेशन को सक्रिय रखता है।
    - OpenClaw के स्वामित्व वाले लेखन कमिट से पहले अमान्य/विनाशकारी पेलोड अस्वीकार करते हैं और `.rejected.*` सहेजते हैं।
    - मरम्मत का स्वामित्व `openclaw doctor --fix` के पास है। यह गैर-JSON उपसर्ग हटा सकता है या अस्वीकृत पेलोड को `.clobbered.*` के रूप में सुरक्षित रखते हुए अंतिम ज्ञात-सही प्रति पुनर्स्थापित कर सकता है।
    - जब किसी एक कॉन्फ़िगरेशन पथ के लिए कई मरम्मत होती हैं, तो OpenClaw पुरानी `.clobbered.*` फ़ाइलों को क्रमावर्तित करता है, ताकि सबसे नया मरम्मत किया गया पेलोड अब भी उपलब्ध रहे।

  </Accordion>
  <Accordion title="जाँचें और सुधारें">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="सामान्य संकेत">
    - `.clobbered.*` मौजूद है → सक्रिय कॉन्फ़िग की मरम्मत करते समय doctor ने एक खराब बाहरी संपादन सुरक्षित रखा।
    - `.rejected.*` मौजूद है → OpenClaw के स्वामित्व वाला कॉन्फ़िग लेखन कमिट से पहले स्कीमा या क्लॉबर जाँच में विफल हुआ।
    - `Config write rejected:` → लेखन ने आवश्यक संरचना हटाने, फ़ाइल का आकार तेज़ी से घटाने या अमान्य कॉन्फ़िग सहेजने का प्रयास किया।
    - `config reload skipped (invalid config):` → प्रत्यक्ष संपादन सत्यापन में विफल हुआ और चल रहे Gateway ने उसे अनदेखा कर दिया।
    - `Invalid config at ...` → Gateway सेवाएँ बूट होने से पहले स्टार्टअप विफल हुआ।
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good`, या `size-drop-vs-last-good:*` → OpenClaw के स्वामित्व वाला लेखन अस्वीकार कर दिया गया, क्योंकि अंतिम ज्ञात-सही बैकअप की तुलना में उसमें फ़ील्ड या आकार कम थे।
    - `Config last-known-good promotion skipped` → प्रत्याशी में `***` जैसे संपादित गुप्त मानों के प्लेसहोल्डर थे।

  </Accordion>
  <Accordion title="सुधार के विकल्प">
    1. doctor को उपसर्गयुक्त/क्लॉबर किए गए कॉन्फ़िग की मरम्मत करने या अंतिम ज्ञात-सही कॉन्फ़िग पुनर्स्थापित करने देने के लिए `openclaw doctor --fix` चलाएँ।
    2. `.clobbered.*` या `.rejected.*` से केवल इच्छित कुंजियाँ कॉपी करें, फिर उन्हें `openclaw config set` या `config.patch` से लागू करें।
    3. पुनः आरंभ करने से पहले `openclaw config validate` चलाएँ।
    4. यदि आप हाथ से संपादित करते हैं, तो केवल वह आंशिक ऑब्जेक्ट न रखें जिसे आप बदलना चाहते थे, बल्कि पूरा JSON5 कॉन्फ़िग रखें।
  </Accordion>
</AccordionGroup>

संबंधित:

- [कॉन्फ़िग](/hi/cli/config)
- [कॉन्फ़िगरेशन: हॉट रीलोड](/hi/gateway/configuration#config-hot-reload)
- [कॉन्फ़िगरेशन: सख़्त सत्यापन](/hi/gateway/configuration#strict-validation)
- [Doctor](/hi/gateway/doctor)

## Gateway प्रोब चेतावनियाँ

इसका उपयोग तब करें जब `openclaw gateway probe` किसी लक्ष्य तक पहुँचता हो, लेकिन फिर भी चेतावनी ब्लॉक प्रिंट करता हो।

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

इन्हें खोजें:

- JSON आउटपुट में `warnings[].code` और `primaryTargetId`।
- चेतावनी SSH फ़ॉलबैक, एकाधिक गेटवे, अनुपलब्ध स्कोप या अनसुलझे प्रमाणीकरण संदर्भों के बारे में है या नहीं।

सामान्य संकेत:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH सेटअप विफल हुआ, लेकिन कमांड ने फिर भी प्रत्यक्ष कॉन्फ़िगर किए गए/लूपबैक लक्ष्यों को आज़माया।
- `multiple reachable gateway identities detected` → अलग-अलग गेटवे ने उत्तर दिया, या OpenClaw यह प्रमाणित नहीं कर सका कि पहुँच योग्य लक्ष्य एक ही गेटवे हैं। समान गेटवे के लिए SSH टनल, प्रॉक्सी URL या कॉन्फ़िगर किया गया रिमोट URL, ट्रांसपोर्ट पोर्ट अलग होने पर भी, एकाधिक ट्रांसपोर्ट वाला एक ही गेटवे माना जाता है।
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → कनेक्शन सफल रहा, लेकिन विस्तृत RPC स्कोप द्वारा सीमित है; डिवाइस पहचान को पेयर करें या `operator.read` वाले क्रेडेंशियल का उपयोग करें।
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → कनेक्शन सफल रहा, लेकिन पूरा डायग्नोस्टिक RPC सेट टाइम आउट हुआ या विफल रहा। इसे कमज़ोर डायग्नोस्टिक्स वाला पहुँच योग्य Gateway मानें; `--json` आउटपुट में `connect.ok` और `connect.rpcOk` की तुलना करें।
- `Capability: pairing-pending` या `gateway closed (1008): pairing required` → गेटवे ने उत्तर दिया, लेकिन सामान्य ऑपरेटर पहुँच से पहले इस क्लाइंट को अभी भी पेयरिंग/स्वीकृति चाहिए।
- अनसुलझा `gateway.auth.*` / `gateway.remote.*` SecretRef चेतावनी पाठ → विफल लक्ष्य के लिए इस कमांड पथ में प्रमाणीकरण सामग्री उपलब्ध नहीं थी।

संबंधित:

- [Gateway](/hi/cli/gateway)
- [एक ही होस्ट पर एकाधिक गेटवे](/hi/gateway#multiple-gateways-same-host)
- [रिमोट पहुँच](/hi/gateway/remote)

## चैनल कनेक्ट है, संदेश प्रवाहित नहीं हो रहे

यदि चैनल की स्थिति कनेक्टेड है लेकिन संदेश प्रवाह बंद है, तो नीति, अनुमतियों और चैनल-विशिष्ट डिलीवरी नियमों पर ध्यान दें।

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

इन्हें खोजें:

- DM नीति (`pairing`, `allowlist`, `open`, `disabled`)।
- समूह की अनुमति-सूची और उल्लेख संबंधी आवश्यकताएँ।
- अनुपलब्ध चैनल API अनुमतियाँ/स्कोप।

सामान्य संकेत:

- `mention required` → समूह उल्लेख नीति के कारण संदेश अनदेखा किया गया।
- `pairing` / लंबित स्वीकृति ट्रेस → प्रेषक स्वीकृत नहीं है।
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → चैनल प्रमाणीकरण/अनुमति की समस्या।

संबंधित:

- [चैनल समस्या निवारण](/hi/channels/troubleshooting)
- [Discord](/hi/channels/discord)
- [Telegram](/hi/channels/telegram)
- [WhatsApp](/hi/channels/whatsapp)

## Cron और Heartbeat डिलीवरी

यदि Cron या Heartbeat नहीं चला या डिलीवर नहीं हुआ, तो पहले शेड्यूलर की स्थिति और फिर डिलीवरी लक्ष्य सत्यापित करें।

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

इन्हें खोजें:

- Cron सक्षम हो और अगला वेक मौजूद हो।
- जॉब रन इतिहास की स्थिति (`ok`, `skipped`, `error`)।
- Heartbeat छोड़ने के कारण (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`)।

<AccordionGroup>
  <Accordion title="सामान्य संकेत">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron अक्षम है।
    - `cron: timer tick failed` → शेड्यूलर टिक विफल हुआ; फ़ाइल/लॉग/रनटाइम त्रुटियाँ जाँचें।
    - `heartbeat skipped` के साथ `reason=quiet-hours` → सक्रिय घंटों की समय-सीमा से बाहर।
    - `heartbeat skipped` के साथ `reason=empty-heartbeat-file` → `HEARTBEAT.md` मौजूद है, लेकिन उसमें केवल रिक्त, टिप्पणी, हेडर, फ़ेंस या खाली-चेकलिस्ट स्कैफ़ोल्डिंग है, इसलिए OpenClaw मॉडल कॉल छोड़ देता है।
    - `heartbeat skipped` के साथ `reason=no-tasks-due` → `HEARTBEAT.md` में `tasks:` ब्लॉक है, लेकिन इस टिक पर कोई भी कार्य नियत नहीं है।
    - `heartbeat: unknown accountId` → Heartbeat डिलीवरी लक्ष्य के लिए अमान्य खाता आईडी।
    - `heartbeat skipped` के साथ `reason=dm-blocked` → जब `agents.defaults.heartbeat.directPolicy` (या प्रति-एजेंट ओवरराइड) को `block` पर सेट किया गया है, तब Heartbeat लक्ष्य DM-शैली के गंतव्य के रूप में हल हुआ।

  </Accordion>
</AccordionGroup>

संबंधित:

- [Heartbeat](/hi/gateway/heartbeat)
- [निर्धारित कार्य](/hi/automation/cron-jobs)
- [निर्धारित कार्य: समस्या निवारण](/hi/automation/cron-jobs#troubleshooting)

## Node पेयर है, टूल विफल होता है

यदि Node पेयर है लेकिन टूल विफल होते हैं, तो फ़ोरग्राउंड, अनुमति और स्वीकृति की स्थिति को अलग-अलग जाँचें।

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

इन्हें खोजें:

- Node अपेक्षित क्षमताओं के साथ ऑनलाइन हो।
- कैमरा/माइक/स्थान/स्क्रीन के लिए OS अनुमति अनुदान।
- निष्पादन स्वीकृतियाँ और अनुमति-सूची की स्थिति।

सामान्य संकेत:

- `NODE_BACKGROUND_UNAVAILABLE` → Node ऐप का फ़ोरग्राउंड में होना आवश्यक है।
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → OS अनुमति अनुपलब्ध है।
- `SYSTEM_RUN_DENIED: approval required` → निष्पादन स्वीकृति लंबित है।
- `SYSTEM_RUN_DENIED: allowlist miss` → अनुमति-सूची ने कमांड को अवरुद्ध किया।

संबंधित:

- [निष्पादन स्वीकृतियाँ](/hi/tools/exec-approvals)
- [Node समस्या निवारण](/hi/nodes/troubleshooting)
- [Nodes](/hi/nodes/index)

## ब्राउज़र टूल विफल होता है

इसका उपयोग तब करें जब Gateway स्वयं स्वस्थ होने के बावजूद ब्राउज़र टूल की क्रियाएँ विफल हों।

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

इन्हें खोजें:

- `plugins.allow` सेट है या नहीं और उसमें `browser` शामिल है या नहीं।
- मान्य ब्राउज़र निष्पादन योग्य पथ।
- CDP प्रोफ़ाइल की पहुँच-योग्यता।
- `existing-session` / `user` प्रोफ़ाइलों के लिए स्थानीय Chrome की उपलब्धता।

<AccordionGroup>
  <Accordion title="Plugin / निष्पादन योग्य संकेत">
    - `unknown command "browser"` या `unknown command 'browser'` → बंडल किया गया ब्राउज़र Plugin `plugins.allow` द्वारा बाहर रखा गया है।
    - ब्राउज़र टूल अनुपलब्ध है, जबकि `browser.enabled=true` → `plugins.allow`, `browser` को बाहर रखता है, इसलिए Plugin कभी लोड नहीं हुआ।
    - `Failed to start Chrome CDP on port` → ब्राउज़र प्रक्रिया लॉन्च होने में विफल रही।
    - `browser.executablePath not found` → कॉन्फ़िगर किया गया पथ अमान्य है।
    - `browser.cdpUrl must be http(s) or ws(s)` → कॉन्फ़िगर किया गया CDP URL, `file:` या `ftp:` जैसी असमर्थित स्कीम का उपयोग करता है।
    - `browser.cdpUrl has invalid port` → कॉन्फ़िगर किए गए CDP URL में खराब या सीमा से बाहर पोर्ट है।
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → वर्तमान Gateway इंस्टॉल में मुख्य ब्राउज़र रनटाइम निर्भरता नहीं है; OpenClaw को पुनः इंस्टॉल या अपडेट करें, फिर Gateway को पुनः आरंभ करें। ARIA स्नैपशॉट और सामान्य पृष्ठ स्क्रीनशॉट फिर भी काम कर सकते हैं, लेकिन नेविगेशन, AI स्नैपशॉट, CSS-सिलेक्टर एलिमेंट स्क्रीनशॉट और PDF निर्यात अनुपलब्ध रहते हैं।

  </Accordion>
  <Accordion title="Chrome MCP / मौजूदा-सत्र संकेत">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP मौजूदा-सत्र अभी चयनित ब्राउज़र डेटा डायरेक्टरी से जुड़ नहीं सका। ब्राउज़र निरीक्षण पृष्ठ खोलें, रिमोट डीबगिंग सक्षम करें, ब्राउज़र खुला रखें, पहली संलग्नता प्रॉम्प्ट स्वीकृत करें और फिर पुनः प्रयास करें। यदि साइन-इन स्थिति आवश्यक नहीं है, तो प्रबंधित `openclaw` प्रोफ़ाइल को प्राथमिकता दें।
    - `No browser tabs found for profile="user"` → Chrome MCP संलग्नता प्रोफ़ाइल में कोई खुला स्थानीय Chrome टैब नहीं है।
    - `Remote CDP for profile "<name>" is not reachable` → कॉन्फ़िगर किया गया रिमोट CDP एंडपॉइंट Gateway होस्ट से पहुँच योग्य नहीं है।
    - `Browser attachOnly is enabled ... not reachable` या `Browser attachOnly is enabled and CDP websocket ... is not reachable` → केवल-संलग्नता प्रोफ़ाइल में कोई पहुँच योग्य लक्ष्य नहीं है, या HTTP एंडपॉइंट ने उत्तर दिया लेकिन CDP WebSocket फिर भी नहीं खोला जा सका।

  </Accordion>
  <Accordion title="एलिमेंट / स्क्रीनशॉट / अपलोड संकेत">
    - `fullPage is not supported for element screenshots` → स्क्रीनशॉट अनुरोध ने `--full-page` को `--ref` या `--element` के साथ मिला दिया।
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` स्क्रीनशॉट कॉल को CSS `--element` के बजाय पृष्ठ कैप्चर या स्नैपशॉट `--ref` का उपयोग करना चाहिए।
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP अपलोड हुक को CSS सिलेक्टर नहीं, स्नैपशॉट संदर्भ चाहिए।
    - `existing-session file uploads currently support one file at a time.` → Chrome MCP प्रोफ़ाइलों पर प्रत्येक कॉल में एक अपलोड भेजें।
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP प्रोफ़ाइलों पर डायलॉग हुक टाइमआउट ओवरराइड का समर्थन नहीं करते।
    - `existing-session type does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP मौजूदा-सत्र प्रोफ़ाइलों पर `act:type` के लिए `timeoutMs` छोड़ दें, या कस्टम टाइमआउट आवश्यक होने पर प्रबंधित/CDP ब्राउज़र प्रोफ़ाइल का उपयोग करें।
    - `response body is not supported for existing-session profiles yet.` → `responsebody` को अभी भी प्रबंधित ब्राउज़र या रॉ CDP प्रोफ़ाइल चाहिए।
    - केवल-संलग्नता या रिमोट CDP प्रोफ़ाइलों पर पुराने व्यूपोर्ट / डार्क-मोड / लोकेल / ऑफ़लाइन ओवरराइड → पूरे Gateway को पुनः आरंभ किए बिना सक्रिय नियंत्रण सत्र बंद करने और Playwright/CDP इम्यूलेशन स्थिति जारी करने के लिए `openclaw browser stop --browser-profile <name>` चलाएँ।

  </Accordion>
</AccordionGroup>

संबंधित:

- [ब्राउज़र (OpenClaw द्वारा प्रबंधित)](/hi/tools/browser)
- [ब्राउज़र समस्या निवारण](/hi/tools/browser-linux-troubleshooting)

## यदि आपने अपग्रेड किया और अचानक कुछ खराब हो गया

अपग्रेड के बाद अधिकांश खराबियाँ कॉन्फ़िग विचलन या अब लागू किए जा रहे अधिक सख़्त डिफ़ॉल्ट के कारण होती हैं।

<AccordionGroup>
  <Accordion title="1. प्रमाणीकरण और URL ओवरराइड का व्यवहार बदल गया है">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    क्या जाँचें:

    - यदि `gateway.mode=remote`, तो हो सकता है कि CLI कॉल रिमोट को लक्षित कर रही हों, जबकि आपकी स्थानीय सेवा ठीक हो।
    - स्पष्ट `--url` कॉल संग्रहीत क्रेडेंशियल पर फ़ॉलबैक नहीं करतीं।

    सामान्य संकेत:

    - `gateway connect failed:` → गलत URL लक्ष्य।
    - `unauthorized` → एंडपॉइंट पहुँच योग्य है, लेकिन प्रमाणीकरण गलत है।

  </Accordion>
  <Accordion title="2. बाइंड और प्रमाणीकरण संबंधी सुरक्षा-सीमाएँ अधिक सख्त हैं">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    क्या जाँचें:

    - गैर-लूपबैक बाइंड (`lan`, `tailnet`, `custom`) के लिए एक मान्य Gateway प्रमाणीकरण पथ आवश्यक है: साझा टोकन/पासवर्ड प्रमाणीकरण या सही तरीके से कॉन्फ़िगर किया गया गैर-लूपबैक `trusted-proxy` परिनियोजन।
    - `gateway.token` जैसी पुरानी कुंजियाँ `gateway.auth.token` को प्रतिस्थापित नहीं करतीं।

    सामान्य संकेत:

    - `refusing to bind gateway ... without auth` → मान्य Gateway प्रमाणीकरण पथ के बिना गैर-लूपबैक बाइंड।
    - रनटाइम चलने के दौरान `Connectivity probe: failed` → Gateway सक्रिय है, लेकिन वर्तमान प्रमाणीकरण/URL से उस तक पहुँचा नहीं जा सकता।

  </Accordion>
  <Accordion title="3. पेयरिंग और डिवाइस पहचान की स्थिति बदल गई है">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    क्या जाँचें:

    - डैशबोर्ड/नोड के लिए लंबित डिवाइस स्वीकृतियाँ।
    - नीति या पहचान में बदलाव के बाद लंबित DM पेयरिंग स्वीकृतियाँ।

    सामान्य संकेत:

    - `device identity required` → डिवाइस प्रमाणीकरण पूरा नहीं हुआ।
    - `pairing required` → प्रेषक/डिवाइस को स्वीकृत करना आवश्यक है।

  </Accordion>
</AccordionGroup>

यदि जाँचों के बाद भी सेवा कॉन्फ़िगरेशन और रनटाइम में अंतर है, तो उसी प्रोफ़ाइल/स्थिति डायरेक्टरी से सेवा मेटाडेटा को फिर से इंस्टॉल करें:

```bash
openclaw gateway install --force
openclaw gateway restart
```

संबंधित:

- [प्रमाणीकरण](/hi/gateway/authentication)
- [बैकग्राउंड निष्पादन और प्रोसेस टूल](/hi/gateway/background-process)
- [Node पेयरिंग](/hi/gateway/pairing)

## संबंधित

- [Doctor](/hi/gateway/doctor)
- [अक्सर पूछे जाने वाले प्रश्न](/hi/help/faq)
- [Gateway रनबुक](/hi/gateway)
