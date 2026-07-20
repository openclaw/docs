---
read_when:
    - प्रदाता क्रेडेंशियल और `auth-profiles.json` रेफ़रेंस के लिए SecretRefs कॉन्फ़िगर करना
    - प्रोडक्शन में सीक्रेट्स को सुरक्षित रूप से रीलोड, ऑडिट, कॉन्फ़िगर और लागू करना
    - स्टार्टअप पर तुरंत विफल होने, निष्क्रिय सतह फ़िल्टरिंग और अंतिम ज्ञात सही व्यवहार को समझना
sidebarTitle: Secrets management
summary: 'सीक्रेट प्रबंधन: SecretRef अनुबंध, रनटाइम स्नैपशॉट व्यवहार और सुरक्षित एकतरफ़ा स्क्रबिंग'
title: गोपनीय जानकारी का प्रबंधन
x-i18n:
    generated_at: "2026-07-20T07:02:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bbc7d006384ab6518daadc9f9283e15954a76f95307a09b73b053017a53b112c
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw योगात्मक SecretRefs का समर्थन करता है, ताकि समर्थित क्रेडेंशियल को कॉन्फ़िगरेशन में प्लेनटेक्स्ट के रूप में रखने की आवश्यकता न हो।

<Note>
प्लेनटेक्स्ट अब भी काम करता है। SecretRefs प्रत्येक क्रेडेंशियल के लिए वैकल्पिक हैं।
</Note>

<Warning>
यदि प्लेनटेक्स्ट क्रेडेंशियल ऐसी फ़ाइलों में हैं जिनका एजेंट निरीक्षण कर सकता है, तो वे एजेंट द्वारा पढ़े जा सकते हैं; इनमें `openclaw.json`, `auth-profiles.json`, `.env`, या जनरेट की गई `agents/*/agent/models.json` फ़ाइलें शामिल हैं। SecretRefs उस स्थानीय प्रभाव-क्षेत्र को तभी कम करते हैं, जब प्रत्येक समर्थित क्रेडेंशियल माइग्रेट हो जाए और `openclaw secrets audit --check` किसी प्लेनटेक्स्ट अवशेष की रिपोर्ट न करे।
</Warning>

## रनटाइम मॉडल

- Secrets अनुरोध पथों पर विलंबित रूप से नहीं, बल्कि सक्रियण के दौरान तुरंत एक इन-मेमोरी रनटाइम स्नैपशॉट में रिज़ॉल्व होते हैं।
- कोल्ड Gateway स्टार्टअप, पुनः प्रयास योग्य SecretRef विफलता को किसी ज्ञात गैर-Gateway स्वामी तक सीमित करता है, जब वह स्वामी पृथक्करण का समर्थन करता हो। मैप किए गए स्वामी वर्गों में मॉडल प्रदाता और skills, मीडिया/TTS/cron प्रदाता, पात्र प्रमाणीकरण प्रोफ़ाइल, प्रति-एजेंट मेमोरी, सैंडबॉक्स SSH, चैनल खाते और मैनिफ़ेस्ट द्वारा घोषित plugin रूट शामिल हैं। Gateway शुरू होता है, स्वामी को कॉन्फ़िगर-किंतु-अनुपलब्ध के रूप में दर्ज करता है और एक संपादित डिग्रेडेशन चेतावनी जारी करता है। Gateway इनग्रेस प्रमाणीकरण, संरचनात्मक रूप से अमान्य रेफ़ या रिज़ॉल्व किए गए मान, विफलता पर बंद होने वाले स्वामी और ऐसे रेफ़ जिनका रनटाइम स्वामी मैप नहीं है, फिर भी स्टार्टअप को विफल करते हैं।
- रीलोड प्रत्येक मैप किए गए स्वामी को स्वतंत्र रूप से सत्यापित करता है और फिर एक एटॉमिक स्नैपशॉट प्रकाशित करता है। स्वस्थ स्वामी रीफ़्रेश होते हैं। कोई पात्र विफल स्वामी अपना अंतिम ज्ञात-सही मान बनाए रखता है और केवल तभी स्टेल होता है, जब उसकी रेफ़ पहचान, प्रदाता परिभाषाएँ और संपूर्ण गैर-गोपनीय स्वामी अनुबंध अपरिवर्तित हों; बदला हुआ या नया विफल स्वामी कोल्ड हो जाता है। कोई सख़्त विफलता रीलोड को अस्वीकार कर देती है और सक्रिय स्नैपशॉट को सुरक्षित रखती है।
- नीति उल्लंघन (उदाहरण के लिए SecretRef इनपुट के साथ संयुक्त OAuth-मोड प्रमाणीकरण प्रोफ़ाइल) रनटाइम स्वैप से पहले सक्रियण को विफल कर देते हैं।
- रनटाइम अनुरोध केवल सक्रिय इन-मेमोरी स्नैपशॉट पढ़ते हैं। मॉडल-प्रदाता SecretRef क्रेडेंशियल, इग्रेस तक प्रक्रिया-स्थानीय सेंटिनल के रूप में प्रमाणीकरण स्टोरेज और स्ट्रीम विकल्पों से होकर गुजरते हैं। आउटबाउंड डिलीवरी पथ (Discord उत्तर/थ्रेड डिलीवरी, Telegram कार्रवाई प्रेषण) भी वही स्नैपशॉट पढ़ते हैं और प्रत्येक प्रेषण पर रेफ़ को दोबारा रिज़ॉल्व नहीं करते।

यह गुप्त-प्रदाता की अनुपलब्धता को हॉट अनुरोध पथों से दूर रखता है।

Gateway इनग्रेस सुरक्षा, संरचनात्मक रूप से अमान्य कॉन्फ़िगरेशन या रिज़ॉल्व किए गए मान, नीति उल्लंघन और अज्ञात स्वामित्व अब भी विफलता पर बंद रहते हैं। पृथक किए गए स्वामी कभी भी निम्न-प्राथमिकता वाले क्रेडेंशियल स्रोत पर वापस नहीं जाते।

## इग्रेस-समय इंजेक्शन (सेंटिनल)

SecretRefs द्वारा समर्थित मॉडल-प्रदाता क्रेडेंशियल के लिए, OpenClaw मॉडल-प्रमाणीकरण रिज़ॉल्यूशन के दौरान एक अपारदर्शी, प्रक्रिया-स्थानीय सेंटिनल बनाता है। इसलिए प्रमाणीकरण स्टोरेज, स्ट्रीम विकल्प, SDK कॉन्फ़िगरेशन, लॉग, त्रुटि ऑब्जेक्ट और अधिकांश रनटाइम आत्मनिरीक्षण प्रदाता क्रेडेंशियल के बजाय `oc-sent-v1-...` जैसा मान देखते हैं। संरक्षित मॉडल फ़ेच और प्रबंधित स्थानीय-प्रदाता स्वास्थ्य जाँच, प्रत्येक अनुरोध के प्रक्रिया से बाहर जाने के ठीक पहले URL और हेडर मानों में ज्ञात सेंटिनल को प्रतिस्थापित कर देते हैं।

अज्ञात सेंटिनल-जैसे मान नेटवर्क गतिविधि से पहले विफलता पर बंद हो जाते हैं। OpenClaw किसी अनरिज़ॉल्व्ड सेंटिनल को प्रदाता तक अग्रेषित करने के बजाय अनुरोध भेजने से इनकार करता है। गहन सुरक्षा उपाय के रूप में, रिज़ॉल्व किए गए गुप्त मान भी सटीक-मान लॉग संपादन के लिए पंजीकृत किए जाते हैं।

प्रदाता अडैप्टर अपने SDK द्वारा समर्थित नवीनतम इंजेक्शन बिंदु का उपयोग करते हैं:

- कस्टम फ़ेच विकल्प वाले SDK को OpenClaw का संरक्षित फ़ेच मिलता है, इसलिए SDK सेंटिनल बनाए रखता है।
- कस्टम फ़ेच विकल्प के बिना SDK, क्लाइंट निर्माण के ठीक पहले सेंटिनल को अनरैप करते हैं। Plugin-स्वामित्व वाली प्रदाता स्ट्रीम और एजेंट हार्नेस अंतिम कोर-स्वामित्व वाले हैंडऑफ़ पर अनरैप करते हैं, क्योंकि वे ट्रांसपोर्ट OpenClaw का संरक्षित फ़ेच साझा नहीं करते।

सेंटिनल मॉडल-कॉल श्रृंखला में प्लेनटेक्स्ट के उजागर होने को कम करते हैं, लेकिन वे प्रक्रिया पृथक्करण नहीं हैं। वास्तविक मान अब भी उसी प्रक्रिया की मेमोरी में मौजूद रहता है और अंतिम अडैप्टर सीमा पर दिखाई देता है। SecretRefs के माध्यम से कॉन्फ़िगर न किए गए सामान्य एनवायरनमेंट क्रेडेंशियल प्लेनटेक्स्ट में रहते हैं और इस तंत्र के दायरे से बाहर हैं।

घटना प्रतिक्रिया या संगतता समस्या निवारण के दौरान सेंटिनल निर्माण अक्षम करने के लिए `OPENCLAW_SECRET_SENTINELS=off` सेट करें (`0` या `false` भी स्वीकार करता है, अक्षर-आकार असंवेदी)। किल स्विच सटीक-मान संपादन पंजीकरण को अक्षम नहीं करता।

## एजेंट-पहुँच सीमा

SecretRefs क्रेडेंशियल को कॉन्फ़िगरेशन और जनरेट की गई मॉडल फ़ाइलों में स्थायी रूप से सहेजे जाने से रोकते हैं, लेकिन वे प्रक्रिया-पृथक्करण सीमा नहीं हैं। एजेंट द्वारा पढ़े जा सकने वाले पथ पर डिस्क में छोड़ा गया प्लेनटेक्स्ट क्रेडेंशियल, API-स्तरीय संपादन को बायपास करते हुए, फ़ाइल या शेल टूल के माध्यम से अब भी पढ़ा जा सकता है।

उन उत्पादन परिनियोजनों के लिए जहाँ एजेंट की पहुँच वाली फ़ाइलें दायरे में हैं, माइग्रेशन को केवल तभी पूर्ण मानें जब ये सभी शर्तें पूरी हों:

- समर्थित क्रेडेंशियल प्लेनटेक्स्ट मानों के बजाय SecretRefs का उपयोग करते हैं।
- पुराने प्लेनटेक्स्ट अवशेष `openclaw.json`, `auth-profiles.json`, `.env`, और जनरेट की गई `models.json` फ़ाइलों से मिटा दिए गए हैं।
- माइग्रेशन के बाद `openclaw secrets audit --check` साफ़ है।
- शेष सभी असमर्थित या रोटेट होने वाले क्रेडेंशियल OS पृथक्करण, कंटेनर पृथक्करण या किसी बाहरी क्रेडेंशियल प्रॉक्सी द्वारा सुरक्षित हैं।

इसी कारण ऑडिट/कॉन्फ़िगर/लागू कार्यप्रवाह केवल सुविधा सहायक नहीं, बल्कि एक सुरक्षा माइग्रेशन गेट है।

<Warning>
SecretRefs मनमाने ढंग से पढ़ी जा सकने वाली फ़ाइलों को सुरक्षित नहीं बनाते। बैकअप, कॉपी किए गए कॉन्फ़िगरेशन, पुराने जनरेट किए गए मॉडल कैटलॉग और असमर्थित क्रेडेंशियल वर्ग तब तक उत्पादन secrets बने रहते हैं, जब तक उन्हें हटा न दिया जाए, एजेंट विश्वास सीमा से बाहर न ले जाया जाए या अलग से पृथक न किया जाए।
</Warning>

## सक्रिय-सतह फ़िल्टरिंग

SecretRefs केवल प्रभावी रूप से सक्रिय सतहों पर सत्यापित किए जाते हैं:

- **सक्षम सतहें**: मैप किए गए, पृथक किए जा सकने वाले स्वामियों की पुनः प्रयास योग्य विफलताएँ कोल्ड या स्टेल डिग्रेडेशन में प्रवेश करती हैं। सख़्त, विफलता पर बंद होने वाली, Gateway के लिए आवश्यक या अमैप्ड विफलताएँ स्टार्टअप/रीलोड को अवरुद्ध करती हैं।
- **निष्क्रिय सतहें**: अनरिज़ॉल्व्ड रेफ़ स्टार्टअप/रीलोड को अवरुद्ध नहीं करते; वे एक गैर-घातक `SECRETS_REF_IGNORED_INACTIVE_SURFACE` निदान जारी करते हैं।

<Accordion title="निष्क्रिय सतहों के उदाहरण">
- अक्षम चैनल/खाता प्रविष्टियाँ।
- शीर्ष-स्तरीय चैनल क्रेडेंशियल जिन्हें कोई सक्षम खाता इनहेरिट नहीं करता।
- अक्षम टूल/फ़ीचर सतहें।
- वेब खोज की प्रदाता-विशिष्ट कुंजियाँ जिन्हें `tools.web.search.provider` द्वारा नहीं चुना गया है। स्वचालित मोड में (प्रदाता अनसेट), स्वतः-पहचान के लिए प्राथमिकता क्रम से कुंजियों की जाँच तब तक की जाती है, जब तक कोई एक रिज़ॉल्व न हो जाए; चयन के बाद, गैर-चयनित प्रदाता कुंजियाँ निष्क्रिय होती हैं।
- सैंडबॉक्स SSH प्रमाणीकरण सामग्री (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, और प्रति-एजेंट ओवरराइड) केवल तभी सक्रिय होती है, जब प्रभावी सैंडबॉक्स बैकएंड `ssh` हो और डिफ़ॉल्ट एजेंट या किसी सक्षम एजेंट के लिए सैंडबॉक्स मोड `off` न हो।
- `gateway.remote.token` / `gateway.remote.password` SecretRefs सक्रिय होते हैं, यदि इनमें से कोई भी शर्त पूरी हो:
  - `gateway.mode=remote`
  - `gateway.remote.url` कॉन्फ़िगर किया गया है
  - `gateway.tailscale.mode`, `serve` या `funnel` है
  - उन रिमोट सतहों के बिना स्थानीय मोड में: `gateway.remote.token` तब सक्रिय होता है, जब टोकन प्रमाणीकरण प्राथमिक हो सकता है और कोई एनवायरनमेंट/प्रमाणीकरण टोकन कॉन्फ़िगर न हो; `gateway.remote.password` केवल तभी सक्रिय होता है, जब पासवर्ड प्रमाणीकरण प्राथमिक हो सकता है और कोई एनवायरनमेंट/प्रमाणीकरण पासवर्ड कॉन्फ़िगर न हो।
- स्टार्टअप प्रमाणीकरण रिज़ॉल्यूशन के लिए `gateway.auth.token` SecretRef तब निष्क्रिय होता है, जब `OPENCLAW_GATEWAY_TOKEN` सेट हो, क्योंकि उस रनटाइम के लिए एनवायरनमेंट टोकन इनपुट प्राथमिक होता है।

</Accordion>

## Gateway प्रमाणीकरण सतह निदान

जब `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token`, या `gateway.remote.password` पर कोई SecretRef सेट किया जाता है, तो Gateway स्टार्टअप/रीलोड कोड `SECRETS_GATEWAY_AUTH_SURFACE` के अंतर्गत सतह की स्थिति लॉग करता है:

- `active`: SecretRef प्रभावी प्रमाणीकरण सतह का भाग है और इसे रिज़ॉल्व होना आवश्यक है।
- `inactive`: कोई अन्य प्रमाणीकरण सतह प्राथमिक होती है, या रिमोट प्रमाणीकरण अक्षम/निष्क्रिय है।

लॉग प्रविष्टि में सक्रिय-सतह नीति द्वारा उपयोग किया गया कारण शामिल होता है।

## ऑनबोर्डिंग संदर्भ पूर्व-जाँच

इंटरैक्टिव ऑनबोर्डिंग में SecretRef स्टोरेज चुनने पर, सहेजने से पहले पूर्व-जाँच सत्यापन चलता है:

- एनवायरनमेंट रेफ़: एनवायरनमेंट वेरिएबल का नाम सत्यापित करता है और पुष्टि करता है कि सेटअप के दौरान कोई गैर-रिक्त मान दिखाई दे रहा है।
- प्रदाता रेफ़ (`file` या `exec`): प्रदाता चयन सत्यापित करता है, `id` को रिज़ॉल्व करता है और रिज़ॉल्व किए गए मान का प्रकार जाँचता है।
- क्विकस्टार्ट प्रवाह: जब `gateway.auth.token` पहले से SecretRef हो, तो ऑनबोर्डिंग उसी शीघ्र-विफलता गेट का उपयोग करके प्रोब/डैशबोर्ड बूटस्ट्रैप से पहले इसे रिज़ॉल्व करता है (`env`, `file`, और `exec` रेफ़ के लिए)।

सत्यापन विफल होने पर त्रुटि दिखाई जाती है और आपको पुनः प्रयास करने दिया जाता है।

## SecretRef अनुबंध

हर जगह एक ही ऑब्जेक्ट संरचना:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    SecretInput फ़ील्ड पर संक्षिप्त स्ट्रिंग भी स्वीकार की जाती हैं:

    ```json5
    "${OPENAI_API_KEY}"
    "$OPENAI_API_KEY"
    ```

    सत्यापन:

    - `provider` का `^[a-z][a-z0-9_-]{0,63}$` से मेल खाना आवश्यक है
    - `id` का `^[A-Z][A-Z0-9_]{0,127}$` से मेल खाना आवश्यक है

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    सत्यापन:

    - `provider` का `^[a-z][a-z0-9_-]{0,63}$` से मेल खाना आवश्यक है
    - `id` का निरपेक्ष JSON पॉइंटर (`/...`) होना आवश्यक है, या `singleValue` प्रदाताओं के लिए शाब्दिक `value`
    - खंडों में RFC 6901 एस्केपिंग: `~`, `~0` बन जाता है; `/`, `~1` बन जाता है

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    सत्यापन:

    - `provider` का `^[a-z][a-z0-9_-]{0,63}$` से मेल खाना आवश्यक है
    - `id` का `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` से मेल खाना आवश्यक है (`secret#json_key` जैसे चयनकर्ताओं का समर्थन करता है)
    - `id` में स्लैश-सीमांकित पथ खंडों के रूप में `.` या `..` नहीं होना चाहिए (उदाहरण के लिए `a/../b` अस्वीकार किया जाता है)

  </Tab>
</Tabs>

## प्रदाता कॉन्फ़िगरेशन

`secrets.providers` के अंतर्गत प्रदाताओं को परिभाषित करें:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // या "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
      "team-secrets": {
        source: "exec",
        pluginIntegration: {
          pluginId: "acme-secrets",
          integrationId: "secret-store",
        },
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

<Accordion title="एनवायरनमेंट प्रदाता">
- `allowlist` के माध्यम से वैकल्पिक सटीक-नाम अनुमति-सूची।
- अनुपलब्ध या रिक्त एनवायरनमेंट मान रिज़ॉल्यूशन को विफल कर देते हैं।

</Accordion>

<Accordion title="फ़ाइल प्रदाता">
- `path` पर स्थानीय फ़ाइल पढ़ता है।
- `mode: "json"` (डिफ़ॉल्ट) JSON ऑब्जेक्ट पेलोड की अपेक्षा करता है और `id` को JSON पॉइंटर के रूप में रिज़ॉल्व करता है।
- `mode: "singleValue"` रेफ़ आईडी `"value"` की अपेक्षा करता है और फ़ाइल की अपरिष्कृत सामग्री लौटाता है (अंतिम न्यूलाइन हटाकर)।
- पथ को स्वामित्व/अनुमति जाँच पास करनी होगी; `timeoutMs` (डिफ़ॉल्ट 5000) और `maxBytes` (डिफ़ॉल्ट 1 MiB) पठन को सीमित करते हैं।
- Windows पर विफलता-पर-बंद व्यवहार: यदि पथ के लिए ACL सत्यापन उपलब्ध नहीं है, तो रिज़ॉल्यूशन विफल हो जाता है। केवल विश्वसनीय पथों के लिए, जाँच को बायपास करने हेतु उस प्रदाता पर `allowInsecurePath: true` सेट करें।

</Accordion>

<Accordion title="Exec प्रदाता">
- कॉन्फ़िगर किए गए निरपेक्ष बाइनरी पथ को सीधे चलाता है, किसी शेल का उपयोग नहीं करता।
- डिफ़ॉल्ट रूप से `command` एक नियमित फ़ाइल होनी चाहिए, symlink नहीं। symlink कमांड पथों (उदाहरण के लिए Homebrew shims) की अनुमति देने के लिए `allowSymlinkCommand: true` सेट करें, और इसे `trustedDirs` (उदाहरण के लिए `["/opt/homebrew"]`) के साथ जोड़ें, ताकि केवल पैकेज-मैनेजर पथ ही योग्य हों।
- `timeoutMs` (डिफ़ॉल्ट 5000), `noOutputTimeoutMs` (डिफ़ॉल्ट `timeoutMs` के बराबर), `maxOutputBytes` (डिफ़ॉल्ट 1 MiB), `env`/`passEnv` अनुमतिसूची और `trustedDirs` का समर्थन करता है।
- `jsonOnly` का डिफ़ॉल्ट `true` है। `jsonOnly: false` और केवल एक अनुरोधित id के साथ, साधारण गैर-JSON stdout को उस id के मान के रूप में स्वीकार किया जाता है।
- Windows पर विफलता की स्थिति में बंद: यदि कमांड पथ के लिए ACL सत्यापन उपलब्ध नहीं है, तो समाधान विफल हो जाता है। केवल विश्वसनीय पथों के लिए, जाँच को बायपास करने हेतु उस प्रदाता पर `allowInsecurePath: true` सेट करें।
- Plugin-प्रबंधित exec प्रदाता कॉपी किए गए `command`/`args` के बजाय `pluginIntegration` का उपयोग कर सकते हैं। OpenClaw स्टार्टअप/रीलोड के दौरान इंस्टॉल किए गए Plugin manifest से वर्तमान कमांड विवरण हल करता है; यदि Plugin अक्षम, हटाया गया, अविश्वसनीय हो या अब integration घोषित न करता हो, तो उस प्रदाता के सक्रिय SecretRefs विफलता की स्थिति में बंद हो जाते हैं।

अनुरोध पेलोड (stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

प्रतिक्रिया पेलोड (stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

प्रति-id वैकल्पिक त्रुटियाँ:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "code": "NOT_FOUND" } }
}
```

`code` एक वैकल्पिक मशीन-पठनीय निदान है। OpenClaw मान्य
कोड `NOT_FOUND` और `AMBIGUOUS_DUPLICATE_KEY` को प्रदाता और ref id के साथ दिखाता है। अन्य
कोड और `message` जैसे मुक्त-रूप फ़ील्ड protocol-v1 संगतता के लिए स्वीकार किए जाते हैं,
लेकिन दिखाए नहीं जाते, क्योंकि resolver आउटपुट में क्रेडेंशियल सामग्री हो सकती है।

</Accordion>

## फ़ाइल-समर्थित API कुंजियाँ

कॉन्फ़िगरेशन के `env` ब्लॉक में `file:...` स्ट्रिंग न रखें। वह ब्लॉक शाब्दिक और गैर-अधिलेखनीय है, इसलिए वहाँ `file:...` कभी हल नहीं होता।

इसके बजाय किसी समर्थित क्रेडेंशियल फ़ील्ड पर फ़ाइल SecretRef का उपयोग करें:

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

`mode: "singleValue"` के लिए, SecretRef `id`, `"value"` है। `mode: "json"` के लिए, `"/providers/xai/apiKey"` जैसे निरपेक्ष JSON pointer का उपयोग करें।

SecretRefs स्वीकार करने वाले फ़ील्ड के लिए [SecretRef क्रेडेंशियल सतह](/hi/reference/secretref-credential-surface) देखें।

## Exec integration के उदाहरण

सेवा खातों, बंडल किए गए एजेंट skill और समस्या निवारण को शामिल करने वाली समर्पित 1Password मार्गदर्शिका के लिए [1Password](/hi/gateway/1password) देखें।

<AccordionGroup>
  <Accordion title="1Password CLI">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // Homebrew की symlink की गई बाइनरी के लिए आवश्यक
            trustedDirs: ["/opt/homebrew"],
            args: ["read", "op://Personal/OpenClaw QA API Key/password"],
            passEnv: ["HOME"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
  <Accordion title="Bitwarden Secrets Manager (`bws`)">
    SecretRef ids को Bitwarden Secrets Manager आइटम कुंजियों से मैप करने के लिए resolver wrapper का उपयोग करें। रिपॉज़िटरी में `scripts/secrets/openclaw-bws-resolver.mjs` शामिल है; इसे इंस्टॉल करें या उस होस्ट के किसी निरपेक्ष विश्वसनीय पथ पर कॉपी करें जो Gateway चलाता है।

    आवश्यकताएँ:

    - Gateway होस्ट पर Bitwarden Secrets Manager CLI (`bws`) इंस्टॉल हो।
    - `BWS_ACCESS_TOKEN` Gateway सेवा के लिए उपलब्ध हो।
    - `PATH` resolver को दिया जाए, या `BWS_BIN` को निरपेक्ष `bws` बाइनरी पथ पर सेट किया जाए।
    - स्वयं होस्ट किए गए Bitwarden instance का उपयोग करते समय environment में `BWS_SERVER_URL` सेट हो।

    ```json5
    {
      secrets: {
        providers: {
          bws: {
            source: "exec",
            command: "/usr/local/bin/openclaw-bws-resolver.mjs",
            passEnv: ["BWS_ACCESS_TOKEN", "BWS_SERVER_URL", "PATH", "BWS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "bws",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    resolver अनुरोधित ids को बैच करता है, `bws secret list` चलाता है और मेल खाने वाले secret `key` फ़ील्ड के मान लौटाता है। exec SecretRef id अनुबंध को पूरा करने वाली कुंजियों का उपयोग करें, जैसे `openclaw/providers/openai/apiKey`; underscore वाली env-var-शैली की कुंजियाँ resolver चलने से पहले अस्वीकार कर दी जाती हैं। यदि एक से अधिक दृश्यमान Bitwarden secret की अनुरोधित कुंजी समान है, तो resolver अनुमान लगाने के बजाय उस id को अस्पष्ट मानकर विफल कर देता है। कॉन्फ़िगरेशन अपडेट करने के बाद resolver पथ सत्यापित करें:

    ```bash
    openclaw secrets audit --allow-exec
    ```

  </Accordion>
  <Accordion title="HashiCorp Vault CLI">
    ```json5
    {
      secrets: {
        providers: {
          vault_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/vault",
            allowSymlinkCommand: true, // Homebrew की symlink की गई बाइनरी के लिए आवश्यक
            trustedDirs: ["/opt/homebrew"],
            args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
            passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "vault_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
  <Accordion title="password-store (`pass`)">
    SecretRef ids को सीधे `pass` प्रविष्टियों से मैप करने के लिए एक छोटे resolver wrapper का उपयोग करें। इसे ऐसे निरपेक्ष पथ पर executable के रूप में सहेजें जो आपके exec-प्रदाता पथ की जाँचों को पूरा करता हो, उदाहरण के लिए `/usr/local/bin/openclaw-pass-resolver`। `#!/usr/bin/env node` shebang, resolver प्रक्रिया के `PATH` से `node` को हल करता है, इसलिए `passEnv` में `PATH` शामिल करें। यदि `pass` उस `PATH` पर नहीं है, तो पैरेंट environment में `PASS_BIN` सेट करें और इसे `passEnv` में भी शामिल करें:

    ```js
    #!/usr/bin/env node
    const { spawnSync } = require("node:child_process");

    let stdin = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      stdin += chunk;
    });
    process.stdin.on("error", (err) => {
      process.stderr.write(`${err.message}\n`);
      process.exit(1);
    });
    process.stdin.on("end", () => {
      let request;
      try {
        request = JSON.parse(stdin || "{}");
      } catch (err) {
        process.stderr.write(`Failed to parse request: ${err.message}\n`);
        process.exit(1);
      }

      const passBin = process.env.PASS_BIN || "pass";
      const values = {};
      const errors = {};

      for (const id of request.ids ?? []) {
        const result = spawnSync(passBin, ["show", id], { encoding: "utf8" });
        if (result.status === 0) {
          values[id] = result.stdout.split(/\r?\n/, 1)[0] ?? "";
        } else {
          errors[id] = { message: (result.stderr || `pass exited ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    फिर exec प्रदाता कॉन्फ़िगर करें और `apiKey` को `pass` प्रविष्टि पथ पर निर्देशित करें:

    ```json5
    {
      secrets: {
        providers: {
          pass_store: {
            source: "exec",
            command: "/usr/local/bin/openclaw-pass-resolver",
            passEnv: ["PATH", "HOME", "GNUPGHOME", "GPG_TTY", "PASSWORD_STORE_DIR", "PASS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "pass_store",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    secret को `pass` प्रविष्टि की पहली पंक्ति पर रखें, या इसके बजाय पूर्ण `pass show` आउटपुट लौटाने के लिए wrapper को अनुकूलित करें। कॉन्फ़िगरेशन अपडेट करने के बाद स्थिर audit और exec resolver पथ, दोनों सत्यापित करें:

    ```bash
    openclaw secrets audit --check
    openclaw secrets audit --allow-exec
    ```

  </Accordion>
  <Accordion title="sops">
    ```json5
    {
      secrets: {
        providers: {
          sops_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/sops",
            allowSymlinkCommand: true, // Homebrew की symlink की गई बाइनरी के लिए आवश्यक
            trustedDirs: ["/opt/homebrew"],
            args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
            passEnv: ["SOPS_AGE_KEY_FILE"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "sops_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## MCP server environment variables

`plugins.entries.acpx.config.mcpServers` के माध्यम से कॉन्फ़िगर किए गए MCP server env vars SecretInput स्वीकार करते हैं, जिससे API कुंजियाँ और टोकन plaintext कॉन्फ़िगरेशन से बाहर रहते हैं:

```json5
{
  plugins: {
    entries: {
      acpx: {
        enabled: true,
        config: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  source: "env",
                  provider: "default",
                  id: "MCP_GITHUB_PAT",
                },
              },
            },
          },
        },
      },
    },
  },
}
```

Plaintext स्ट्रिंग मान अब भी काम करते हैं। `${MCP_SERVER_API_KEY}` जैसे env-template refs और SecretRef ऑब्जेक्ट, MCP server प्रक्रिया शुरू होने से पहले gateway activation के दौरान हल होते हैं। अन्य SecretRef सतहों की तरह, अनसुलझे refs activation को केवल तभी अवरुद्ध करते हैं जब `acpx` Plugin प्रभावी रूप से सक्रिय हो।

## Sandbox SSH प्रमाणीकरण सामग्री

मुख्य `ssh` sandbox backend भी SSH प्रमाणीकरण सामग्री के लिए SecretRefs का समर्थन करता है:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

रनटाइम व्यवहार:

- OpenClaw इन संदर्भों को प्रत्येक SSH कॉल पर विलंबित रूप से नहीं, बल्कि सैंडबॉक्स सक्रियण के दौरान रिज़ॉल्व करता है।
- रिज़ॉल्व किए गए मान प्रतिबंधित फ़ाइल अनुमतियों (`0o600`) के साथ एक अस्थायी डायरेक्टरी में लिखे जाते हैं और जनरेट किए गए SSH कॉन्फ़िगरेशन में उपयोग किए जाते हैं।
- यदि प्रभावी सैंडबॉक्स बैकएंड `ssh` नहीं है (या सैंडबॉक्स मोड `off` है), तो ये संदर्भ निष्क्रिय रहते हैं और स्टार्टअप को अवरुद्ध नहीं करते।

## समर्थित क्रेडेंशियल सतह

मानक समर्थित और असमर्थित क्रेडेंशियल [SecretRef क्रेडेंशियल सतह](/hi/reference/secretref-credential-surface) में सूचीबद्ध हैं।

<Note>
रनटाइम में बनाए गए या बदलते रहने वाले क्रेडेंशियल और OAuth रीफ़्रेश सामग्री को जानबूझकर केवल-पठन SecretRef रिज़ॉल्यूशन से बाहर रखा गया है।
</Note>

## आवश्यक व्यवहार और प्राथमिकता

- संदर्भ के बिना फ़ील्ड: अपरिवर्तित।
- संदर्भ वाला फ़ील्ड: सक्रिय सतहों पर सक्रियण के दौरान आवश्यक।
- यदि प्लेनटेक्स्ट और संदर्भ दोनों मौजूद हैं, तो समर्थित प्राथमिकता पथों पर संदर्भ को प्राथमिकता मिलती है।
- रेडैक्शन सेंटिनल `__OPENCLAW_REDACTED__` आंतरिक कॉन्फ़िगरेशन रेडैक्शन/पुनर्स्थापन के लिए आरक्षित है और शाब्दिक रूप से सबमिट किए गए कॉन्फ़िगरेशन डेटा के रूप में अस्वीकार किया जाता है।

चेतावनी और ऑडिट संकेत:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (रनटाइम चेतावनी)
- `REF_SHADOWED` (जब `auth-profiles.json` क्रेडेंशियल को `openclaw.json` संदर्भों पर प्राथमिकता मिलती है, तब ऑडिट निष्कर्ष)

Google Chat संगतता: `serviceAccountRef` को प्लेनटेक्स्ट `serviceAccount` पर प्राथमिकता मिलती है; सहोदर संदर्भ सेट हो जाने पर प्लेनटेक्स्ट मान की उपेक्षा की जाती है।

## सक्रियण ट्रिगर

गोपनीय सामग्री का सक्रियण इन अवसरों पर चलता है:

- स्टार्टअप (प्रीफ़्लाइट और अंतिम सक्रियण)
- कॉन्फ़िगरेशन रीलोड हॉट-अप्लाई पथ
- कॉन्फ़िगरेशन रीलोड रीस्टार्ट-जाँच पथ
- `secrets.reload` के माध्यम से मैन्युअल रीलोड
- Gateway कॉन्फ़िगरेशन लेखन RPC प्रीफ़्लाइट (`config.set` / `config.apply` / `config.patch`), जो संपादन स्थायी करने से पहले सबमिट किए गए कॉन्फ़िगरेशन पेलोड में सक्रिय-सतह SecretRefs को सत्यापित करता है

सक्रियण अनुबंध:

- सफलता स्नैपशॉट को परमाण्विक रूप से बदल देती है।
- सख्त स्टार्टअप विफलता Gateway स्टार्टअप को निरस्त कर देती है।
- कोल्ड स्टार्टअप के दौरान, मैप किए गए और पृथक किए जा सकने वाले गैर-Gateway स्वामी के लिए पुनः प्रयास योग्य रिज़ॉल्यूशन विफलता स्नैपशॉट को प्रकाशित कर सकती है, जिसमें ठीक वही स्वामी कॉन्फ़िगर-अनुपलब्ध हो। उस स्वामी के लिए अनुरोध `SECRET_SURFACE_UNAVAILABLE` के साथ विफल होते हैं; स्पष्ट संदर्भ विफल होने के बाद मॉडल-प्रदाता स्वामी परिवेश या ऑथ-प्रोफ़ाइल क्रेडेंशियल पर फ़ॉलबैक नहीं करते।
- रीलोड और रीस्टार्ट-जाँच योग्य मैप किए गए स्वामियों को पृथक करते हैं। अपरिवर्तित प्रदाता परिभाषाओं और अपरिवर्तित पूर्ण गैर-गोपनीय स्वामी अनुबंध वाली अपरिवर्तित संदर्भ पहचानों के बिल्कुल अंतिम-ज्ञात-अच्छे मान पुराने मानों के रूप में बने रहते हैं; बदले गए या नए कॉन्फ़िगर किए गए अनरिज़ॉल्व संदर्भ केवल उस स्वामी के लिए कोल्ड प्रकाशित होते हैं। सख्त रीलोड विफलता पहले से सक्रिय स्नैपशॉट को बनाए रखती है।
- `config.set`, `config.apply`, और `config.patch` पृथक किए जा सकने वाले स्वामियों के लिए वाक्यविन्यास की दृष्टि से मान्य अनरिज़ॉल्व संदर्भ स्वीकार करते हैं और रेडैक्ट की गई `degradedSecretOwners` रिपोर्ट लौटाते हैं। Gateway इनग्रेस ऑथ, संरचनात्मक रूप से अमान्य कॉन्फ़िगरेशन या रिज़ॉल्व किए गए मान, नीति उल्लंघन और अज्ञात स्वामी अब भी डिस्क परिवर्तन से पहले अस्वीकार कर दिए जाते हैं।
- एक स्वामी के कोल्ड या पुराने होने पर भी स्वस्थ सहोदर स्वामी सामान्य रूप से रिज़ॉल्व और प्रकाशित होते हैं।
- आउटबाउंड हेल्पर/टूल कॉल को स्पष्ट प्रति-कॉल चैनल टोकन देने से SecretRef सक्रियण ट्रिगर नहीं होता; सक्रियण बिंदु स्टार्टअप, रीलोड और स्पष्ट `secrets.reload` ही रहते हैं।

## अवनत और पुनर्प्राप्त संकेत

स्वस्थ स्थिति के बाद रीलोड-समय सक्रियण विफल होने पर, OpenClaw अवनत गोपनीय सामग्री स्थिति में प्रवेश करता है और एक-बारगी सिस्टम इवेंट तथा लॉग कोड उत्सर्जित करता है:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

व्यवहार:

- अवनत: स्वस्थ स्वामी रीफ़्रेश होते हैं, पुराने स्वामी अंतिम-ज्ञात-अच्छे मान बनाए रखते हैं और कोल्ड स्वामी अनुपलब्ध रहते हैं।
- पुनर्प्राप्त: अगले सफल सक्रियण के बाद एक बार उत्सर्जित होता है।
- पहले से अवनत अवस्था में बार-बार होने वाली विफलताएँ चेतावनियाँ लॉग करती हैं, लेकिन इवेंट को दोबारा उत्सर्जित नहीं करतीं।
- सख्त स्टार्टअप विफलता कभी अवनत इवेंट उत्सर्जित नहीं करती, क्योंकि रनटाइम कभी सक्रिय ही नहीं हुआ। कोल्ड स्वामियों वाला सफल स्टार्टअप स्वामी की अवनति लॉग करता है, लेकिन रीलोडर इवेंट उत्सर्जित नहीं करता।
- संदर्भ-स्कोप वाली स्टार्टअप और रीलोड विफलताएँ प्रत्येक प्रभावित स्वामी के लिए संरचित `SECRETS_DEGRADED` चेतावनी उत्सर्जित करती हैं। प्रदाता-स्कोप वाली अनुपलब्धताएँ प्रत्येक स्वामी के लिए प्रदाता विफलता दोहराने के बजाय प्रदाता और प्रभावित स्वामियों की पूरी सूची सहित एक `SECRETS_PROVIDER_DEGRADED` चेतावनी उत्सर्जित करती हैं। चेतावनियों में रेडैक्ट किया गया कारण, `cold` या `stale` स्वामी स्थिति और `openclaw secrets reload` पुनः प्रयास संकेत शामिल होते हैं। इनमें कभी भी रिज़ॉल्व किए गए मान या SecretRef आईडी शामिल नहीं होते।
- `openclaw doctor` कोल्ड और पुराने स्वामियों को उनके प्रभावित कॉन्फ़िगरेशन पथों, रेडैक्ट किए गए कारण और पुनः प्रयास मार्गदर्शन सहित सूचीबद्ध करता है।

## कमांड-पथ रिज़ॉल्यूशन

कमांड पथ Gateway स्नैपशॉट RPC के माध्यम से समर्थित SecretRef रिज़ॉल्यूशन अपना सकते हैं। दो व्यापक व्यवहार लागू होते हैं:

<Tabs>
  <Tab title="सख्त कमांड पथ">
    उदाहरण के लिए `openclaw memory` रिमोट-मेमोरी पथ और `openclaw qr --remote`, जब उसे रिमोट साझा-गोपनीय संदर्भों की आवश्यकता हो। वे सक्रिय स्नैपशॉट से पढ़ते हैं और आवश्यक SecretRef अनुपलब्ध होने पर तुरंत विफल हो जाते हैं।
  </Tab>
  <Tab title="केवल-पठन कमांड पथ">
    उदाहरण के लिए `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit`, और केवल-पठन डॉक्टर/कॉन्फ़िगरेशन सुधार प्रवाह। ये भी सक्रिय स्नैपशॉट को प्राथमिकता देते हैं, लेकिन लक्षित SecretRef अनुपलब्ध होने पर निरस्त होने के बजाय अवनत हो जाते हैं।

    केवल-पठन व्यवहार:

    - Gateway चल रहा हो, तो ये कमांड पहले सक्रिय स्नैपशॉट से पढ़ते हैं।
    - यदि Gateway रिज़ॉल्यूशन अधूरा है या Gateway अनुपलब्ध है, तो वे उस कमांड सतह के लिए लक्षित स्थानीय फ़ॉलबैक का प्रयास करते हैं।
    - यदि लक्षित SecretRef अब भी अनुपलब्ध है, तो कमांड अवनत केवल-पठन आउटपुट और स्पष्ट निदान के साथ जारी रहता है कि संदर्भ कॉन्फ़िगर किया गया है, लेकिन इस कमांड पथ में अनुपलब्ध है।
    - यह अवनत व्यवहार केवल कमांड-स्थानीय है; यह रनटाइम स्टार्टअप, रीलोड या प्रेषण/ऑथ पथों को कमजोर नहीं करता।

  </Tab>
</Tabs>

अन्य टिप्पणियाँ:

- बैकएंड गोपनीय सामग्री के रोटेशन के बाद स्नैपशॉट रीफ़्रेश `openclaw secrets reload` द्वारा संभाला जाता है।
- इन कमांड पथों द्वारा उपयोग की जाने वाली Gateway RPC विधि: `secrets.resolve`।

## ऑडिट और कॉन्फ़िगरेशन कार्यप्रवाह

डिफ़ॉल्ट ऑपरेटर प्रवाह:

<Steps>
  <Step title="वर्तमान स्थिति का ऑडिट करें">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="SecretRefs कॉन्फ़िगर और लागू करें">
    ```bash
    openclaw secrets configure --apply
    ```
  </Step>
  <Step title="पुनः ऑडिट करें">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

जब तक पुनः ऑडिट में कोई समस्या न मिले, माइग्रेशन को पूर्ण न मानें। यदि ऑडिट अब भी स्थिर संग्रहण में प्लेनटेक्स्ट मानों की रिपोर्ट करता है, तो एजेंट-पहुँच जोखिम बना रहता है, भले ही रनटाइम API रेडैक्ट किए गए मान लौटाएँ।

यदि आप `configure` के दौरान लागू करने के बजाय योजना सहेजते हैं, तो पुनः ऑडिट से पहले उस सहेजी गई योजना को `openclaw secrets apply --from <plan-path>` से लागू करें।

<AccordionGroup>
  <Accordion title="secrets audit">
    निष्कर्षों में शामिल हैं:

    - स्थिर संग्रहण में प्लेनटेक्स्ट मान (`openclaw.json`, `auth-profiles.json`, `.env`, और जनरेट किया गया `agents/*/agent/models.json`)।
    - जनरेट की गई `models.json` प्रविष्टियों में प्लेनटेक्स्ट संवेदनशील प्रदाता हेडर अवशेष।
    - अनरिज़ॉल्व संदर्भ।
    - प्राथमिकता शैडोइंग (`auth-profiles.json` का `openclaw.json` संदर्भों पर प्राथमिकता लेना)।
    - लीगेसी अवशेष (`auth.json`, OAuth अनुस्मारक)।

    Exec टिप्पणी: डिफ़ॉल्ट रूप से, कमांड के दुष्प्रभावों से बचने के लिए ऑडिट exec SecretRef की रिज़ॉल्व-क्षमता जाँच छोड़ देता है। ऑडिट के दौरान exec प्रदाताओं को निष्पादित करने के लिए `openclaw secrets audit --allow-exec` का उपयोग करें।

    हेडर अवशेष टिप्पणी: संवेदनशील प्रदाता हेडर की पहचान नाम-ह्यूरिस्टिक पर आधारित है (सामान्य ऑथ/क्रेडेंशियल हेडर नाम और `authorization`, `x-api-key`, `token`, `secret`, `password`, तथा `credential` जैसे अंश)।

  </Accordion>
  <Accordion title="secrets configure">
    इंटरैक्टिव हेल्पर जो:

    - पहले `secrets.providers` कॉन्फ़िगर करता है (`env`/`file`/`exec`, जोड़ना/संपादित करना/हटाना)।
    - आपको एक एजेंट स्कोप के लिए `openclaw.json` और `auth-profiles.json` में समर्थित गोपनीय सामग्री वाले फ़ील्ड चुनने देता है।
    - लक्ष्य चयनकर्ता में सीधे नया `auth-profiles.json` मैपिंग बना सकता है।
    - SecretRef विवरण (`source`, `provider`, `id`) कैप्चर करता है।
    - प्रीफ़्लाइट रिज़ॉल्यूशन चलाता है और तुरंत लागू कर सकता है।

    Exec टिप्पणी: `--allow-exec` सेट न होने पर प्रीफ़्लाइट exec SecretRef जाँच छोड़ देता है। यदि आप `configure --apply` से सीधे लागू करते हैं और योजना में exec संदर्भ/प्रदाता शामिल हैं, तो लागू करने के चरण के लिए भी `--allow-exec` सेट रखें।

    सहायक मोड:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    `configure` लागू करने के डिफ़ॉल्ट:

    - लक्षित प्रदाताओं के लिए `auth-profiles.json` से मेल खाते स्थिर क्रेडेंशियल हटाएँ।
    - `auth.json` से लीगेसी स्थिर `api_key` प्रविष्टियाँ हटाएँ।
    - प्रभावी स्थिति और सक्रिय-कॉन्फ़िगरेशन `.env` फ़ाइलों से मेल खाती ज्ञात गोपनीय पंक्तियाँ हटाएँ (दोनों पथ मेल खाने पर डुप्लिकेट हटाकर)।

  </Accordion>
  <Accordion title="secrets apply">
    सहेजी गई योजना लागू करें:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Exec टिप्पणी: `--allow-exec` सेट न होने पर ड्राई-रन exec जाँच छोड़ देता है; `--allow-exec` सेट न होने पर लेखन मोड exec SecretRefs/प्रदाताओं वाली योजनाओं को अस्वीकार करता है।

    सख्त लक्ष्य/पथ अनुबंध विवरण और सटीक अस्वीकृति नियमों के लिए, [गोपनीय सामग्री लागू करने की योजना का अनुबंध](/hi/gateway/secrets-plan-contract) देखें।

  </Accordion>
</AccordionGroup>

## एक-दिशीय सुरक्षा नीति

<Warning>
OpenClaw जानबूझकर ऐसे रोलबैक बैकअप नहीं लिखता जिनमें ऐतिहासिक प्लेनटेक्स्ट गोपनीय मान हों।
</Warning>

सुरक्षा मॉडल:

- लेखन मोड से पहले प्रीफ़्लाइट सफल होना आवश्यक है।
- कमिट से पहले रनटाइम सक्रियण सत्यापित किया जाता है।
- लागू करने की प्रक्रिया परमाण्विक फ़ाइल प्रतिस्थापन और विफलता पर यथासंभव पुनर्स्थापन का उपयोग करके फ़ाइलें अपडेट करती है।

## लीगेसी ऑथ संगतता टिप्पणियाँ

स्थिर क्रेडेंशियल के लिए, रनटाइम अब प्लेनटेक्स्ट लीगेसी ऑथ संग्रहण पर निर्भर नहीं है।

- रनटाइम क्रेडेंशियल स्रोत रिज़ॉल्व किया गया इन-मेमोरी स्नैपशॉट है।
- लीगेसी स्थिर `api_key` प्रविष्टियाँ मिलने पर हटा दी जाती हैं।
- OAuth-संबंधित संगतता व्यवहार अलग रहता है।

## वेब UI टिप्पणी

कुछ SecretInput यूनियन को फ़ॉर्म मोड की तुलना में रॉ एडिटर मोड में कॉन्फ़िगर करना आसान होता है।

## संबंधित

- [प्रमाणीकरण](/hi/gateway/authentication) - प्रमाणीकरण सेटअप
- [CLI: सीक्रेट्स](/hi/cli/secrets) - CLI कमांड
- [Vault SecretRefs](/hi/plugins/vault) - HashiCorp Vault प्रदाता सेटअप
- [पर्यावरण चर](/hi/help/environment) - पर्यावरण वरीयता क्रम
- [SecretRef क्रेडेंशियल सतह](/hi/reference/secretref-credential-surface) - क्रेडेंशियल सतह
- [सीक्रेट्स लागू करने की योजना का अनुबंध](/hi/gateway/secrets-plan-contract) - योजना अनुबंध का विवरण
- [सुरक्षा](/hi/gateway/security) - सुरक्षा स्थिति
