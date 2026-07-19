---
read_when:
    - CLI से Gateway चलाना (डेवलपमेंट या सर्वर के लिए)
    - Gateway प्रमाणीकरण, बाइंड मोड और कनेक्टिविटी की डीबगिंग
    - Bonjour के माध्यम से Gateway खोजना (स्थानीय + वाइड-एरिया DNS-SD)
    - किसी बाहरी Gateway प्रोसेस सुपरवाइज़र का एकीकरण
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — गेटवे चलाएँ, क्वेरी करें और खोजें
title: Gateway
x-i18n:
    generated_at: "2026-07-19T08:18:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7b7b8be9139e975be1a890e7a6fe09af526aaa4261d92198d4388a06e6d13216
    source_path: cli/gateway.md
    workflow: 16
---

Gateway, OpenClaw का WebSocket सर्वर है (चैनल, नोड, सत्र, हुक)। नीचे दिए गए सभी उपकमांड `openclaw gateway ...` के अंतर्गत उपलब्ध हैं।

<CardGroup cols={3}>
  <Card title="Bonjour खोज" href="/hi/gateway/bonjour">
    स्थानीय mDNS + विस्तृत-क्षेत्र DNS-SD सेटअप।
  </Card>
  <Card title="खोज का अवलोकन" href="/hi/gateway/discovery">
    OpenClaw किस प्रकार Gateway का प्रचार करता और उन्हें खोजता है।
  </Card>
  <Card title="कॉन्फ़िगरेशन" href="/hi/gateway/configuration">
    शीर्ष-स्तरीय Gateway कॉन्फ़िगरेशन कुंजियाँ।
  </Card>
</CardGroup>

## Gateway चलाएँ

```bash
openclaw gateway
openclaw gateway run   # समतुल्य, स्पष्ट रूप
```

<AccordionGroup>
  <Accordion title="स्टार्टअप व्यवहार">
    - जब तक `~/.openclaw/openclaw.json` में `gateway.mode=local` सेट न हो, यह शुरू होने से इनकार करता है। तदर्थ/डेवलपमेंट संचालन के लिए `--allow-unconfigured` का उपयोग करें; यह कॉन्फ़िगरेशन लिखे या सुधारे बिना सुरक्षा-जाँच को बायपास करता है।
    - स्टार्टअप के दौरान सुधार योग्य अमान्य कॉन्फ़िगरेशन मिलने पर, इंटरैक्टिव टर्मिनल `openclaw doctor --fix` चलाने का प्रस्ताव देता है और सहमति मिलने के बाद स्टार्टअप का एक बार पुनः प्रयास करता है। गैर-इंटरैक्टिव संचालन कभी भी स्वचालित रूप से सुधार नहीं करता; इसके बजाय वह कमांड प्रिंट करता है। यदि सुधारा गया कॉन्फ़िगरेशन फिर भी अमान्य हो, तो स्टार्टअप रुका रहता है।
    - `openclaw onboard --mode local` और `openclaw setup`, `gateway.mode=local` लिखते हैं। यदि कॉन्फ़िगरेशन फ़ाइल मौजूद है, लेकिन `gateway.mode` अनुपस्थित है, तो इसे क्षतिग्रस्त/अधिलेखित कॉन्फ़िगरेशन माना जाता है और Gateway आपके लिए `local` का अनुमान लगाने से इनकार करता है — ऑनबोर्डिंग दोबारा चलाएँ, कुंजी मैन्युअल रूप से सेट करें, या `--allow-unconfigured` पास करें।
    - प्रमाणीकरण के बिना लूपबैक से परे बाइंड करना अवरुद्ध है।
    - `--bind` के मान `lan`, `tailnet`, और `custom` वर्तमान में केवल IPv4 पथों पर हल होते हैं; केवल IPv6 वाले अपना-होस्ट-स्वयं-लाएँ सेटअप के लिए Gateway के आगे IPv4 साइडकार या प्रॉक्सी आवश्यक है।
    - अधिकृत होने पर `SIGUSR1` प्रक्रिया के भीतर पुनः आरंभ ट्रिगर करता है। `commands.restart` (डिफ़ॉल्ट: सक्षम) बाहर से भेजे गए `SIGUSR1` को नियंत्रित करता है; मैन्युअल OS-सिग्नल पुनः आरंभ अवरुद्ध करने के लिए इसे `false` पर सेट करें। एजेंट-सामना करने वाला `gateway` टूल केवल-पढ़ने योग्य है; एजेंट मानव-अनुमोदित `openclaw` प्रत्यायोजन टूल के माध्यम से पुनः आरंभ का अनुरोध करते हैं।
    - `SIGINT`/`SIGTERM` प्रक्रिया रोकते हैं, लेकिन कस्टम टर्मिनल स्थिति पुनर्स्थापित नहीं करते — यदि आप CLI को TUI या रॉ-मोड इनपुट में लपेटते हैं, तो बाहर निकलने से पहले टर्मिनल स्वयं पुनर्स्थापित करें।

  </Accordion>
</AccordionGroup>

### विकल्प

<ParamField path="--port <port>" type="number">
  WebSocket पोर्ट (कॉन्फ़िगरेशन/पर्यावरण से डिफ़ॉल्ट; सामान्यतः `18789`)।
</ParamField>
<ParamField path="--bind <mode>" type="string">
  बाइंड मोड: `loopback` (डिफ़ॉल्ट), `lan`, `tailnet`, `auto`, `custom`।
</ParamField>
<ParamField path="--token <token>" type="string">
  `connect.params.auth.token` के लिए साझा टोकन। सेट होने पर डिफ़ॉल्ट `OPENCLAW_GATEWAY_TOKEN` होता है।
</ParamField>
<ParamField path="--auth <mode>" type="string">
  प्रमाणीकरण मोड: `none`, `token`, `password`, `trusted-proxy`।
</ParamField>
<ParamField path="--password <password>" type="string">
  `--auth password` के लिए पासवर्ड।
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Gateway पासवर्ड किसी फ़ाइल से पढ़ें।
</ParamField>
<ParamField path="--tailscale <mode>" type="string">
  Tailscale एक्सपोज़र: `off`, `serve`, `funnel`।
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  शटडाउन पर Tailscale serve/funnel कॉन्फ़िगरेशन रीसेट करें।
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  `gateway.mode=local` लागू किए बिना शुरू करें। केवल तदर्थ/डेवलपमेंट बूटस्ट्रैप; कॉन्फ़िगरेशन सहेजता या सुधारता नहीं है।
</ParamField>
<ParamField path="--dev" type="boolean">
  अनुपस्थित होने पर डेवलपमेंट कॉन्फ़िगरेशन + कार्यस्थान बनाएँ (`BOOTSTRAP.md` छोड़ देता है)।
</ParamField>
<ParamField path="--reset" type="boolean">
  डेवलपमेंट कॉन्फ़िगरेशन, क्रेडेंशियल, सत्र और कार्यस्थान रीसेट करें। `--dev` आवश्यक है।
</ParamField>
<ParamField path="--force" type="boolean">
  शुरू करने से पहले लक्ष्य पोर्ट पर मौजूद किसी भी लिसनर को समाप्त करें। गैर-इंटरैक्टिव शेल में यह सत्यापित Gateway लिसनर को समाप्त करने से इनकार करता है; इसके बजाय `--dev` या मुक्त पोर्ट वाला पृथक `--profile` उपयोग करें।
</ParamField>
<ParamField path="--verbose" type="boolean">
  stdout/stderr पर विस्तृत लॉगिंग।
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  कंसोल में केवल CLI बैकएंड लॉग दिखाएँ (stdout/stderr भी सक्षम करता है)।
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  WebSocket लॉग शैली: `auto`, `full`, `compact`।
</ParamField>
<ParamField path="--compact" type="boolean">
  `--ws-log compact` का उपनाम।
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  रॉ मॉडल स्ट्रीम इवेंट को JSONL में लॉग करें।
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  रॉ स्ट्रीम JSONL पथ।
</ParamField>

`--claude-cli-logs`, `--cli-backend-logs` का अप्रचलित उपनाम है।

`--bind custom` के लिए, `gateway.customBindHost` को किसी IPv4 पते पर सेट करें। `127.0.0.1` या `0.0.0.0` के अतिरिक्त किसी भी पते के लिए समान-होस्ट क्लाइंट हेतु उसी पोर्ट पर `127.0.0.1` भी आवश्यक है; यदि कोई भी लिसनर बाइंड नहीं कर पाता, तो स्टार्टअप विफल हो जाता है। वाइल्डकार्ड `0.0.0.0` कोई अलग आवश्यक उपनाम नहीं जोड़ता। केवल IPv6 वाले अपना-होस्ट-स्वयं-लाएँ सेटअप के लिए Gateway के आगे IPv4 साइडकार या प्रॉक्सी आवश्यक है।

## Gateway पुनः आरंभ करें

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` चल रहे Gateway से सक्रिय कार्य की पूर्व-जाँच करने और वह कार्य समाप्त होने के बाद एक समेकित पुनः आरंभ निर्धारित करने को कहता है। प्रतीक्षा `gateway.reload.deferralTimeoutMs` (डिफ़ॉल्ट: 5 मिनट / `300000`) द्वारा सीमित होती है; समय-सीमा समाप्त होने पर पुनः आरंभ बलपूर्वक किया जाता है। बलपूर्वक पुनः आरंभ करने के बजाय अनिश्चितकाल तक प्रतीक्षा करने के लिए `deferralTimeoutMs: 0` सेट करें (समय-समय पर अभी-भी-लंबित चेतावनियों सहित)। `--safe` को `--force` या `--wait` के साथ संयोजित नहीं किया जा सकता।

`--skip-deferral` सुरक्षित पुनः आरंभ पर सक्रिय-कार्य स्थगन द्वार को बायपास करता है, इसलिए रिपोर्ट किए गए अवरोधकों के बावजूद Gateway तुरंत पुनः आरंभ हो जाता है। इसके लिए `--safe` आवश्यक है — जब स्थगन किसी अनियंत्रित कार्य पर अटक जाए, तब इसका उपयोग करें।

`--wait <duration>` सामान्य (गैर-सुरक्षित) पुनः आरंभ के लिए ड्रेन समय-सीमा को ओवरराइड करता है। यह सीधे मिलीसेकंड या इकाई प्रत्यय `ms`, `s`, `m`, `h`, `d` स्वीकार करता है (जैसे `30s`, `5m`, `1h30m`); `--wait 0` अनिश्चितकाल तक प्रतीक्षा करता है। `--force` या `--safe` के साथ संगत नहीं है।

`--force` सक्रिय-कार्य ड्रेन छोड़ देता है और तुरंत पुनः आरंभ करता है। सामान्य `restart` (बिना फ़्लैग) मौजूदा सेवा-प्रबंधक पुनः आरंभ व्यवहार बनाए रखता है।

<Warning>
इनलाइन `--password` स्थानीय प्रक्रिया सूचियों में दिखाई दे सकता है। `--password-file`, पर्यावरण, या SecretRef-समर्थित `gateway.auth.password` को प्राथमिकता दें।
</Warning>

### बाहरी सुपरवाइज़र

`OPENCLAW_SUPERVISOR_MODE=external` केवल तभी सेट करें, जब कोई अन्य प्रक्रिया प्रबंधक Gateway जीवनचक्र का स्वामी हो। इस मोड में:

- `openclaw gateway restart`, launchd, systemd या Task Scheduler के बजाय सत्यापित चल रहे Gateway को लक्ष्य बनाते हुए मौजूदा सुरक्षित, बलपूर्वक और सीमित-प्रतीक्षा व्यवहार बनाए रखता है।
- नेटिव सेवा इंस्टॉल, प्रारंभ, रोकने और अनइंस्टॉल करने की कार्रवाइयाँ अस्वीकार कर दी जाती हैं तथा बाहरी सुपरवाइज़र उपयोग करने का मार्गदर्शन दिया जाता है।
- OpenClaw का स्व-अद्यतन अस्वीकार कर दिया जाता है, ताकि सुपरवाइज़र Gateway को रोक सके, रनटाइम को बदलकर अंतिम रूप दे सके और उसे सुरक्षित रूप से पुनः आरंभ कर सके।
- नई-प्रक्रिया वाला पुनः आरंभ साफ़ निकास से पहले एक सीमित SQLite हैंडऑफ़ लिखता है। यदि स्थायित्व विफल हो जाए, तो उपभोग योग्य हैंडऑफ़ के बिना बाहर निकलने के बजाय Gateway प्रक्रिया के भीतर पुनः आरंभ का सहारा लेता है।

`OPENCLAW_SERVICE_REPAIR_POLICY=external` एक अलग Doctor सुधार नीति बनी रहती है। यह रनटाइम स्वामित्व घोषित नहीं करती; जिन सुपरवाइज़र को दोनों व्यवहार चाहिए, उन्हें दोनों वेरिएबल सेट करने चाहिए।

बाहरी सुपरवाइज़र इस छिपे हुए मशीन अनुबंध के माध्यम से पुनः आरंभ हैंडऑफ़ पर सहमति बना और उसका उपभोग कर सकते हैं:

```bash
openclaw gateway restart-handoff capabilities --json
openclaw gateway restart-handoff consume --expected-pid <pid> --json
```

प्रोटोकॉल संस्करण `1`, `consume` कार्रवाई का समर्थन करता है। उपभोग एक तत्काल SQLite ट्रांज़ैक्शन के भीतर अपेक्षित PID और सीमित हैंडऑफ़ फ़ील्ड सत्यापित करता है। स्वीकृत हैंडऑफ़ सफलता लौटाए जाने से पहले हटा दिया जाता है, इसलिए समवर्ती या पुनः चलाए गए उपभोक्ता दोनों उसे स्वीकार नहीं कर सकते। PID असंगति मिलान करने वाले स्वामी के लिए बनाए रखी जाती है; अनुपस्थित, समाप्त और अमान्य पंक्तियाँ पुनः आरंभ को अधिकृत नहीं करतीं।

मान्य मशीन अनुरोध निकास कोड `0` के साथ JSON लौटाते हैं, जिसमें गैर-पुनः आरंभ परिणाम भी शामिल हैं। अमान्य आर्ग्युमेंट निकास कोड `2` के साथ `reason: "invalid-expected-pid"` लौटाते हैं; स्थिति-भंडार विफलताएँ निकास कोड `1` के साथ `reason: "store-unavailable"` लौटाती हैं। सुपरवाइज़र को OpenClaw संस्करण स्ट्रिंग से समर्थन का अनुमान लगाने या निजी SQLite स्कीमा को सीधे पढ़ने के बजाय, उसी सटीक रनटाइम या लॉन्चर पर `capabilities` की जाँच करनी चाहिए जिसका वे उपयोग करेंगे।

### Gateway प्रोफ़ाइलिंग

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` स्टार्टअप के दौरान चरण समय लॉग करता है, जिसमें प्रत्येक चरण का `eventLoopMax` विलंब और Plugin लुकअप-टेबल समय (इंस्टॉल किया गया इंडेक्स, मैनिफ़ेस्ट रजिस्ट्री, स्टार्टअप योजना, स्वामी-मैप कार्य) शामिल हैं।
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` पुनः आरंभ-सीमित `restart trace:` पंक्तियाँ लॉग करता है: सिग्नल प्रबंधन, सक्रिय-कार्य ड्रेन, शटडाउन चरण, अगला प्रारंभ, तैयार होने का समय और मेमोरी मेट्रिक्स।
- `OPENCLAW_DIAGNOSTICS=timeline` को `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` के साथ उपयोग करने पर बाहरी QA हार्नेस के लिए सर्वोत्तम-प्रयास JSONL स्टार्टअप निदान टाइमलाइन लिखी जाती है (कॉन्फ़िगरेशन `diagnostics.flags: ["timeline"]` के समतुल्य; पथ अब भी केवल पर्यावरण द्वारा सेट किया जाता है)। इवेंट-लूप नमूने शामिल करने के लिए `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` जोड़ें।
- `pnpm build` और फिर `pnpm test:startup:gateway -- --runs 5 --warmup 1`, निर्मित CLI एंट्री के सापेक्ष Gateway स्टार्टअप का बेंचमार्क करते हैं: पहली प्रक्रिया आउटपुट, `/healthz`, `/readyz`, स्टार्टअप ट्रेस समय, इवेंट-लूप विलंब और Plugin लुकअप-टेबल समय।
- `pnpm build` और फिर `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`, macOS या Linux पर प्रक्रिया के भीतर पुनः आरंभ का बेंचमार्क करते हैं (Windows पर समर्थित नहीं; पुनः आरंभ के लिए `SIGUSR1` आवश्यक है)। यह `SIGUSR1` का उपयोग करता है, चाइल्ड प्रक्रिया में दोनों ट्रेस सक्षम करता है और अगला `/healthz`, अगला `/readyz`, डाउनटाइम, तैयार होने का समय, CPU, RSS और पुनः आरंभ ट्रेस मेट्रिक्स रिकॉर्ड करता है।
- `/healthz` जीवंतता है; `/readyz` उपयोग योग्य तत्परता है। ट्रेस पंक्तियों और बेंचमार्क आउटपुट को स्वामी-आरोपण संकेत मानें, किसी एक अवधि या नमूने से निकाला गया पूर्ण प्रदर्शन निष्कर्ष नहीं।

## चल रहे Gateway से क्वेरी करें

सभी क्वेरी कमांड WebSocket RPC का उपयोग करते हैं।

<Tabs>
  <Tab title="आउटपुट मोड">
    - डिफ़ॉल्ट: मानव-पठनीय (TTY में रंगीन)।
    - `--json`: मशीन-पठनीय JSON (कोई शैली/स्पिनर नहीं)।
    - `--no-color` (या `NO_COLOR=1`): मानव-पठनीय लेआउट बनाए रखते हुए ANSI अक्षम करें।

  </Tab>
  <Tab title="साझा विकल्प">
    - `--url <url>`: Gateway WebSocket URL।
    - `--token <token>`: Gateway टोकन।
    - `--password <password>`: Gateway पासवर्ड।
    - `--timeout <ms>`: टाइमआउट/समय-सीमा (डिफ़ॉल्ट प्रत्येक कमांड के अनुसार अलग होता है; नीचे प्रत्येक कमांड देखें)।
    - `--expect-final`: "अंतिम" प्रतिक्रिया की प्रतीक्षा करें (एजेंट कॉल)।

  </Tab>
</Tabs>

<Note>
जब आप `--url` सेट करते हैं, तो CLI कॉन्फ़िगरेशन या पर्यावरण क्रेडेंशियल पर वापस नहीं जाता। `--token` या `--password` स्पष्ट रूप से पास करें। स्पष्ट क्रेडेंशियल का न होना एक त्रुटि है।
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` एक सक्रियता जाँच है: जैसे ही सर्वर HTTP का उत्तर दे सकता है, यह लौट आती है। `/readyz` अधिक सख्त है और स्टार्टअप Plugin साइडकार, चैनल या कॉन्फ़िगर किए गए हुक के स्थिर होने तक लाल रहती है। स्थानीय या प्रमाणीकृत विस्तृत `/readyz` प्रतिक्रियाओं में एक `eventLoop` निदान ब्लॉक (विलंब, उपयोग, CPU-कोर अनुपात, `degraded` फ़्लैग) शामिल होता है।

<ParamField path="--port <port>" type="number">
  इस पोर्ट पर स्थानीय लूपबैक Gateway को लक्षित करें। इस कॉल के लिए `OPENCLAW_GATEWAY_URL` और `OPENCLAW_GATEWAY_PORT` को ओवरराइड करता है।
</ParamField>

### `gateway usage-cost`

सत्र लॉग से उपयोग-लागत सारांश प्राप्त करें।

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  शामिल किए जाने वाले दिनों की संख्या।
</ParamField>
<ParamField path="--agent <id>" type="string">
  सारांश का दायरा एक कॉन्फ़िगर किए गए एजेंट आईडी तक सीमित करें।
</ParamField>
<ParamField path="--all-agents" type="boolean">
  सभी कॉन्फ़िगर किए गए एजेंटों में एकत्रित करें। `--agent` के साथ संयोजित नहीं किया जा सकता।
</ParamField>

### `gateway stability`

चल रहे Gateway से हाल का निदान स्थिरता रिकॉर्डर प्राप्त करें।

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  शामिल किए जाने वाले हाल के इवेंट की अधिकतम संख्या (अधिकतम `1000`)।
</ParamField>
<ParamField path="--type <type>" type="string">
  निदान इवेंट प्रकार के अनुसार फ़िल्टर करें, जैसे `payload.large` या `diagnostic.memory.pressure`।
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  केवल निदान अनुक्रम संख्या के बाद के इवेंट शामिल करें।
</ParamField>
<ParamField path="--bundle [path]" type="string">
  चल रहे Gateway को कॉल करने के बजाय सहेजा गया स्थिरता बंडल पढ़ें। `--bundle latest` (या केवल `--bundle`) स्टेट डायरेक्टरी के अंतर्गत नवीनतम बंडल चुनता है; आप सीधे बंडल JSON पथ भी दे सकते हैं।
</ParamField>
<ParamField path="--export" type="boolean">
  स्थिरता विवरण प्रिंट करने के बजाय साझा करने योग्य सहायता निदान zip लिखें।
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` के लिए आउटपुट पथ।
</ParamField>

<AccordionGroup>
  <Accordion title="गोपनीयता और बंडल व्यवहार">
    - रिकॉर्ड परिचालन मेटाडेटा रखते हैं: इवेंट नाम, गणनाएँ, बाइट आकार, मेमोरी रीडिंग, कतार/सत्र स्थिति, अनुमोदन आईडी, चैनल/Plugin नाम और संशोधित सत्र सारांश। वे चैट टेक्स्ट, Webhook बॉडी, टूल आउटपुट, अपरिष्कृत अनुरोध/प्रतिक्रिया बॉडी, टोकन, कुकी, गुप्त मान, होस्टनाम और अपरिष्कृत सत्र आईडी शामिल नहीं करते। रिकॉर्डर को पूरी तरह अक्षम करने के लिए `diagnostics.enabled: false` सेट करें।
    - जब रिकॉर्डर में इवेंट होते हैं, तो घातक Gateway निकास, शटडाउन टाइमआउट और पुनः आरंभ की स्टार्टअप विफलताएँ वही निदान स्नैपशॉट `~/.openclaw/logs/stability/openclaw-stability-*.json` में लिखती हैं। नवीनतम बंडल का निरीक्षण `openclaw gateway stability --bundle latest` से करें; `--limit`, `--type` और `--since-seq` बंडल आउटपुट पर भी लागू होते हैं।

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

बग रिपोर्ट के लिए डिज़ाइन की गई स्थानीय निदान zip लिखें। गोपनीयता मॉडल और बंडल सामग्री के लिए [निदान निर्यात](/hi/gateway/diagnostics) देखें।

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  आउटपुट zip पथ। डिफ़ॉल्ट रूप से स्टेट डायरेक्टरी के अंतर्गत सहायता निर्यात होता है।
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  शामिल की जाने वाली स्वच्छ की गई लॉग पंक्तियों की अधिकतम संख्या।
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  निरीक्षण किए जाने वाले लॉग बाइट की अधिकतम संख्या।
</ParamField>
<ParamField path="--url <url>" type="string">
  स्वास्थ्य स्नैपशॉट के लिए Gateway WebSocket URL।
</ParamField>
<ParamField path="--token <token>" type="string">
  स्वास्थ्य स्नैपशॉट के लिए Gateway टोकन।
</ParamField>
<ParamField path="--password <password>" type="string">
  स्वास्थ्य स्नैपशॉट के लिए Gateway पासवर्ड।
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  स्थिति/स्वास्थ्य स्नैपशॉट टाइमआउट।
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  सहेजे गए स्थिरता बंडल की खोज छोड़ें।
</ParamField>
<ParamField path="--json" type="boolean">
  लिखे गए पथ, आकार और मैनिफ़ेस्ट को JSON के रूप में प्रिंट करें।
</ParamField>

निर्यात में ये बंडल होते हैं: `manifest.json` (फ़ाइल सूची), `summary.md` (Markdown सारांश), `diagnostics.json` (शीर्ष-स्तरीय कॉन्फ़िगरेशन/लॉग/खोज/स्थिरता/स्थिति/स्वास्थ्य सारांश), `config/sanitized.json`, `status/gateway-status.json`, `health/gateway-health.json`, `logs/openclaw-sanitized.jsonl`, और बंडल मौजूद होने पर `stability/latest.json`।

इसे साझा करने के लिए डिज़ाइन किया गया है। यह डीबगिंग के लिए उपयोगी परिचालन विवरण रखता है — सुरक्षित लॉग फ़ील्ड, सबसिस्टम नाम, स्थिति कोड, अवधियाँ, कॉन्फ़िगर किए गए मोड, पोर्ट, Plugin/प्रदाता आईडी, गैर-गुप्त फ़ीचर सेटिंग और संशोधित परिचालन लॉग संदेश — और चैट टेक्स्ट, Webhook बॉडी, टूल आउटपुट, क्रेडेंशियल, कुकी, खाता/संदेश पहचानकर्ता, प्रॉम्प्ट/निर्देश टेक्स्ट, होस्टनाम और गुप्त मानों को छोड़ता या संशोधित करता है। जब कोई लॉग संदेश उपयोगकर्ता/चैट/टूल पेलोड टेक्स्ट जैसा दिखता है (जैसे "उपयोगकर्ता ने कहा", "चैट टेक्स्ट", "टूल आउटपुट", "Webhook बॉडी"), तो निर्यात केवल यह तथ्य रखता है कि संदेश छोड़ दिया गया था और साथ में उसकी बाइट संख्या रखता है।

### `gateway status`

Gateway सेवा (launchd/systemd/schtasks) के साथ वैकल्पिक कनेक्टिविटी/प्रमाणीकरण जाँच दिखाता है।

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  स्पष्ट जाँच लक्ष्य जोड़ें। कॉन्फ़िगर किया गया रिमोट + localhost फिर भी जाँचे जाते हैं।
</ParamField>
<ParamField path="--token <token>" type="string">
  जाँच के लिए टोकन प्रमाणीकरण।
</ParamField>
<ParamField path="--password <password>" type="string">
  जाँच के लिए पासवर्ड प्रमाणीकरण।
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  जाँच टाइमआउट।
</ParamField>
<ParamField path="--no-probe" type="boolean">
  कनेक्टिविटी जाँच छोड़ें (केवल-सेवा दृश्य)।
</ParamField>
<ParamField path="--deep" type="boolean">
  सिस्टम-स्तरीय सेवाओं को भी स्कैन करें।
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  कनेक्टिविटी जाँच को रीड जाँच में अपग्रेड करें और इसके विफल होने पर गैर-शून्य मान के साथ बाहर निकलें। `--no-probe` के साथ संयोजित नहीं किया जा सकता।
</ParamField>

<AccordionGroup>
  <Accordion title="स्थिति का अर्थ">
    - स्थानीय CLI कॉन्फ़िगरेशन गुम या अमान्य होने पर भी निदान के लिए उपलब्ध रहता है।
    - डिफ़ॉल्ट आउटपुट सेवा स्थिति, WebSocket कनेक्शन और हैंडशेक के समय दिखाई देने वाली प्रमाणीकरण क्षमता प्रमाणित करता है — रीड/राइट/एडमिन संचालन नहीं।
    - पहली बार के डिवाइस प्रमाणीकरण के लिए जाँचें गैर-परिवर्तनकारी होती हैं: मौजूदा कैश किया हुआ डिवाइस टोकन होने पर वे उसका पुनः उपयोग करती हैं, लेकिन केवल स्थिति जाँचने के लिए कभी नई CLI डिवाइस पहचान या केवल-पढ़ने योग्य पेयरिंग रिकॉर्ड नहीं बनातीं।
    - संभव होने पर जाँच प्रमाणीकरण के लिए कॉन्फ़िगर किए गए प्रमाणीकरण SecretRefs को हल करता है। यदि आवश्यक SecretRef अनसुलझा है, तो जाँच कनेक्टिविटी/प्रमाणीकरण विफल होने पर `--json` में `rpc.authWarning` रिपोर्ट होता है; `--token`/`--password` स्पष्ट रूप से दें या गुप्त स्रोत ठीक करें। जाँच सफल होने के बाद अनसुलझे-प्रमाणीकरण की चेतावनियाँ दबा दी जाती हैं।
    - चल रहा Gateway इसे रिपोर्ट करे तो JSON आउटपुट में `gateway.version` शामिल होता है; यदि हैंडशेक जाँच संस्करण मेटाडेटा उपलब्ध नहीं करा सकती, तो `--require-rpc`, `status.runtimeVersion` RPC पेलोड का फ़ॉलबैक उपयोग कर सकता है।
    - जब सुनने वाली सेवा पर्याप्त न हो और रीड-स्कोप RPC का भी स्वस्थ होना आवश्यक हो, तो स्क्रिप्ट/ऑटोमेशन में `--require-rpc` का उपयोग करें।
    - `--deep` अतिरिक्त launchd/systemd/schtasks इंस्टॉल के लिए स्कैन करता है; कई gateway-जैसी सेवाएँ मिलने पर मानव-पठनीय आउटपुट सफ़ाई संकेत प्रिंट करता है (आमतौर पर प्रति मशीन एक gateway चलाएँ) और प्रासंगिक होने पर हाल का सुपरवाइज़र पुनः आरंभ हस्तांतरण रिपोर्ट करता है।
    - `--deep`, Plugin-सजग मोड (`pluginValidation: "full"`) में कॉन्फ़िगरेशन सत्यापन भी चलाता है और Plugin मैनिफ़ेस्ट चेतावनियाँ (जैसे चैनल कॉन्फ़िगरेशन मेटाडेटा गुम होना) दिखाता है। डिफ़ॉल्ट `gateway status` तेज़ केवल-पढ़ने योग्य पथ रखता है, जो Plugin सत्यापन छोड़ देता है।
    - मानव-पठनीय आउटपुट में हल किया गया फ़ाइल लॉग पथ और CLI-बनाम-सेवा कॉन्फ़िगरेशन पथ/वैधता शामिल होते हैं, ताकि प्रोफ़ाइल या स्टेट-डायरेक्टरी विचलन का निदान करने में सहायता मिले।
    - मानव-पठनीय आउटपुट में लागू सीमा और उसकी अनुकूली व्युत्पत्ति के साथ `Gateway heap:` शामिल होता है। JSON आउटपुट यही रिपोर्ट `service.gatewayHeap` के रूप में दिखाता है।

  </Accordion>
  <Accordion title="Linux systemd प्रमाणीकरण-विचलन जाँचें">
    - सेवा प्रमाणीकरण विचलन जाँचें यूनिट से `Environment=` और `EnvironmentFile=` दोनों पढ़ती हैं (इनमें `%h`, उद्धृत पथ, एकाधिक फ़ाइलें और वैकल्पिक `-` फ़ाइलें शामिल हैं)।
    - मर्ज किए गए रनटाइम परिवेश का उपयोग करके `gateway.auth.token` SecretRefs हल करता है (पहले सेवा कमांड परिवेश, फिर प्रक्रिया परिवेश फ़ॉलबैक)।
    - टोकन-विचलन जाँचें तब कॉन्फ़िगरेशन टोकन समाधान छोड़ देती हैं, जब टोकन प्रमाणीकरण प्रभावी रूप से सक्रिय नहीं होता (`gateway.auth.mode` स्पष्ट रूप से `password`/`none`/`trusted-proxy` हो, या मोड सेट न हो जहाँ पासवर्ड प्रबल हो सकता है और कोई टोकन प्रत्याशी प्रबल नहीं हो सकता)।

  </Accordion>
</AccordionGroup>

### `gateway probe`

"सब कुछ डीबग करें" कमांड। यह हमेशा इनकी जाँच करता है:

- आपका कॉन्फ़िगर किया गया रिमोट gateway (यदि सेट है), और
- localhost (लूपबैक), **भले ही रिमोट कॉन्फ़िगर किया गया हो**।

`--url` देने से वह स्पष्ट लक्ष्य इन दोनों से पहले जुड़ जाता है। मानव-पठनीय आउटपुट लक्ष्यों को `URL (explicit)`, `Remote (configured)` / `Remote (configured, inactive)`, और `Local loopback` लेबल देता है।

<Note>
यदि एकाधिक जाँच लक्ष्य पहुँच योग्य हों, तो सभी प्रिंट किए जाते हैं। SSH टनल, TLS/प्रॉक्सी URL और कॉन्फ़िगर किया गया रिमोट URL अलग-अलग ट्रांसपोर्ट पोर्ट के साथ भी उसी gateway की ओर संकेत कर सकते हैं; `multiple_gateways` अलग या पहचान-संदिग्ध पहुँच योग्य gateways के लिए आरक्षित है। पृथक प्रोफ़ाइलों (जैसे बचाव बॉट) के लिए एकाधिक gateways चलाना समर्थित है, लेकिन अधिकांश इंस्टॉल एक ही gateway चलाते हैं।
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  स्थानीय लूपबैक जाँच लक्ष्य और SSH टनल रिमोट पोर्ट के लिए इस पोर्ट का उपयोग करें। `--url` के बिना, यह कॉन्फ़िगर किए गए gateway परिवेश URL, परिवेश पोर्ट या रिमोट लक्ष्यों के बजाय केवल स्थानीय लूपबैक लक्ष्य चुनता है।
</ParamField>

<AccordionGroup>
  <Accordion title="व्याख्या">
    - `Reachable: yes` का अर्थ है कि कम-से-कम एक लक्ष्य ने WebSocket कनेक्शन स्वीकार किया।
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` बताता है कि जाँच प्रमाणीकरण के बारे में क्या प्रमाणित कर सकी, जो पहुँच योग्यता से अलग है।
    - `Read probe: ok` का अर्थ है कि रीड-स्कोप विवरण RPC कॉल (`health`/`status`/`system-presence`/`config.get`) भी सफल हुए।
    - `Read probe: limited - missing scope: operator.read` का अर्थ है कि कनेक्शन सफल हुआ, लेकिन रीड-स्कोप RPC सीमित है। इसे पूर्ण विफलता नहीं, बल्कि **अवक्रमित** पहुँच योग्यता के रूप में रिपोर्ट किया जाता है।
    - `Connect: ok` के बाद `Read probe: failed` का अर्थ है कि WebSocket कनेक्ट हो गया, लेकिन अनुवर्ती रीड निदान का समय समाप्त हो गया या वह विफल हुआ — यह भी **अवक्रमित** है, पहुँच से बाहर नहीं।
    - `gateway status` की तरह, जाँच मौजूदा कैश किए हुए डिवाइस प्रमाणीकरण का पुनः उपयोग करती है, लेकिन पहली बार की डिवाइस पहचान या पेयरिंग स्थिति नहीं बनाती।
    - निकास कोड केवल तभी गैर-शून्य होता है, जब जाँचा गया कोई भी लक्ष्य पहुँच योग्य न हो।

  </Accordion>
  <Accordion title="JSON आउटपुट">
    शीर्ष स्तर:

    - `ok`: कम-से-कम एक लक्ष्य पहुँच योग्य है।
    - `degraded`: कम-से-कम एक लक्ष्य ने कनेक्शन स्वीकार किया, लेकिन पूर्ण-विवरण RPC निदान पूरा नहीं किया।
    - `capability`: पहुँच योग्य लक्ष्यों में देखी गई सर्वोत्तम क्षमता (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope`, या `unknown`)।
    - `primaryTargetId`: सक्रिय विजेता मानने के लिए सर्वोत्तम लक्ष्य, इस क्रम में: स्पष्ट URL, SSH टनल, कॉन्फ़िगर किया गया रिमोट, स्थानीय लूपबैक।
    - `warnings[]`: `code`, `message`, और वैकल्पिक `targetIds` वाले यथासंभव चेतावनी रिकॉर्ड।
    - `network`: वर्तमान कॉन्फ़िगरेशन और होस्ट नेटवर्किंग से प्राप्त स्थानीय लूपबैक/टेलनेट URL संकेत।
    - `discovery.timeoutMs` / `discovery.count`: इस जाँच चरण के लिए उपयोग किया गया वास्तविक डिस्कवरी बजट/परिणाम संख्या।

    प्रति लक्ष्य (`targets[].connect`): `ok` (पहुँच योग्यता + अवनत वर्गीकरण), `rpcOk` (पूर्ण-विवरण RPC सफलता), `scopeLimited` (ऑपरेटर स्कोप अनुपलब्ध होने के कारण विवरण RPC विफल)।

    प्रति लक्ष्य (`targets[].auth`): उपलब्ध होने पर `role` और `scopes` को `hello-ok` में रिपोर्ट किया जाता है, साथ ही प्रदर्शित `capability` वर्गीकरण भी।

  </Accordion>
  <Accordion title="सामान्य चेतावनी कोड">
    - `ssh_tunnel_failed`: SSH टनल सेटअप विफल हुआ; कमांड ने इसके बजाय प्रत्यक्ष जाँच का उपयोग किया।
    - `multiple_gateways`: अलग-अलग Gateway पहचानें पहुँच योग्य थीं, या OpenClaw यह सिद्ध नहीं कर सका कि पहुँच योग्य लक्ष्य एक ही Gateway हैं। उसी Gateway के लिए SSH टनल, प्रॉक्सी URL या कॉन्फ़िगर किया गया रिमोट URL इसे ट्रिगर नहीं करता।
    - `auth_secretref_unresolved`: विफल लक्ष्य के लिए कॉन्फ़िगर किए गए प्रमाणीकरण SecretRef का समाधान नहीं किया जा सका।
    - `probe_scope_limited`: WebSocket कनेक्शन सफल हुआ, लेकिन `operator.read` अनुपलब्ध होने के कारण रीड जाँच सीमित रही।
    - `local_tls_runtime_unavailable`: स्थानीय Gateway TLS सक्षम है, लेकिन OpenClaw स्थानीय प्रमाणपत्र फ़िंगरप्रिंट लोड नहीं कर सका।

  </Accordion>
</AccordionGroup>

#### SSH पर रिमोट (Mac ऐप के समान)

macOS ऐप का "Remote over SSH" मोड स्थानीय पोर्ट-फ़ॉरवर्ड का उपयोग करता है, ताकि केवल लूपबैक वाला रिमोट Gateway `ws://127.0.0.1:<port>` पर पहुँच योग्य हो जाए।

समकक्ष CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` या `user@host:port` (पोर्ट का डिफ़ॉल्ट `22` है)।
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  पहचान फ़ाइल।
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  समाधान किए गए डिस्कवरी एंडपॉइंट (`local.` और कॉन्फ़िगर किया गया वाइड-एरिया डोमेन, यदि कोई हो) से पहले मिले Gateway होस्ट को SSH लक्ष्य के रूप में चुनें। केवल TXT संकेतों को अनदेखा किया जाता है।
</ParamField>

कॉन्फ़िगरेशन डिफ़ॉल्ट (वैकल्पिक): `gateway.remote.sshTarget`, `gateway.remote.sshIdentity`।

### `gateway call <method>`

निम्न-स्तरीय RPC सहायक।

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"limit": 200}'
```

<ParamField path="--params <json>" type="string" default="{}">
  पैरामीटर के लिए JSON ऑब्जेक्ट स्ट्रिंग।
</ParamField>
<ParamField path="--url <url>" type="string">
  Gateway WebSocket URL।
</ParamField>
<ParamField path="--token <token>" type="string">
  Gateway टोकन।
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway पासवर्ड।
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  टाइमआउट बजट।
</ParamField>
<ParamField path="--expect-final" type="boolean">
  मुख्यतः एजेंट-शैली RPC के लिए, जो अंतिम पेलोड से पहले मध्यवर्ती घटनाएँ स्ट्रीम करते हैं।
</ParamField>
<ParamField path="--json" type="boolean">
  मशीन-पठनीय JSON आउटपुट।
</ParamField>

<Note>
`--params` मान्य JSON होना चाहिए, और प्रत्येक विधि अपने पैरामीटर के स्वरूप को सत्यापित करती है (अतिरिक्त/गलत नाम वाले फ़ील्ड अस्वीकार किए जाते हैं)।
</Note>

## Gateway सेवा प्रबंधित करें

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### रैपर के साथ इंस्टॉल करें

जब प्रबंधित सेवा को किसी अन्य निष्पादन योग्य फ़ाइल के माध्यम से प्रारंभ करना आवश्यक हो, तब `--wrapper` का उपयोग करें, उदाहरण के लिए किसी सीक्रेट मैनेजर शिम या रन-ऐज़ सहायक के माध्यम से। रैपर को सामान्य Gateway तर्क मिलते हैं और वह अंततः उन्हीं तर्कों के साथ `openclaw` या Node को निष्पादित करने के लिए उत्तरदायी होता है।

```bash
cat > ~/.local/bin/openclaw-doppler <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec doppler run --project my-project --config production -- openclaw "$@"
EOF
chmod +x ~/.local/bin/openclaw-doppler

openclaw gateway install --wrapper ~/.local/bin/openclaw-doppler --force
openclaw gateway restart
```

आप वातावरण के माध्यम से भी रैपर सेट कर सकते हैं। `gateway install` सत्यापित करता है कि पथ एक निष्पादन योग्य फ़ाइल है, रैपर को सेवा के `ProgramArguments` में लिखता है, और बाद के बलपूर्वक पुनः इंस्टॉल, अपडेट तथा डॉक्टर मरम्मत के लिए सेवा वातावरण में `OPENCLAW_WRAPPER` को स्थायी रखता है।

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

स्थायी रैपर हटाने के लिए, पुनः इंस्टॉल करते समय `OPENCLAW_WRAPPER` को रिक्त करें:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="कमांड विकल्प">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node>` (डिफ़ॉल्ट: `node`), `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--force`, `--json`

  </Accordion>
  <Accordion title="जीवनचक्र व्यवहार">
    - `gateway start` आइडेम्पोटेंट है: जब प्रबंधित सेवा पहले से चल रही हो, तो यह चल रही प्रक्रिया की रिपोर्ट करता है और उसे अपरिवर्तित छोड़ देता है। लोड की गई लेकिन रुकी हुई सेवा पहले की तरह प्रारंभ की जाती है।
    - प्रबंधित सेवा को पुनः प्रारंभ करने के लिए `gateway restart` का उपयोग करें। पुनः प्रारंभ के विकल्प के रूप में `gateway stop` और `gateway start` को श्रृंखलाबद्ध न करें।
    - गैर-संवादात्मक शेल में, `gateway stop` के लिए `--force` आवश्यक है। संवादात्मक टर्मिनल मौजूदा संकेत-मुक्त व्यवहार बनाए रखते हैं। स्वचालन और परीक्षणों के लिए, `gateway run --dev` या मुक्त पोर्ट वाले पृथक `--profile` को प्राथमिकता दें।
    - macOS पर, `gateway stop` डिफ़ॉल्ट रूप से `launchctl bootout` का उपयोग करता है, जो निष्क्रियता को स्थायी किए बिना वर्तमान बूट सत्र से LaunchAgent हटा देता है—भविष्य के क्रैश के लिए KeepAlive की स्वतः-पुनर्प्राप्ति सक्रिय रहती है और `gateway start` बिना मैन्युअल `launchctl enable` के इसे साफ़ ढंग से पुनः सक्षम करता है। KeepAlive और RunAtLoad को स्थायी रूप से दबाने के लिए `--disable` दें, ताकि अगली स्पष्ट `gateway start` तक Gateway फिर से उत्पन्न न हो; इसका उपयोग तब करें जब मैन्युअल रोक रीबूट के बाद भी बनी रहनी चाहिए।
    - Gateway जीवनचक्र परिवर्तन `<state-dir>/logs/gateway-restart.log` में यथासंभव कुंजी-मान ऑडिट रिकॉर्ड जोड़ते हैं, जिनमें CLI प्रारंभ, रोक और पुनः प्रारंभ संचालन, सुरक्षित पुनः प्रारंभ अनुरोध, सुपरवाइज़र पुनः प्रारंभ और पृथक हैंडऑफ़ शामिल हैं।
    - जीवनचक्र कमांड स्क्रिप्टिंग के लिए `--json` स्वीकार करते हैं।

  </Accordion>
  <Accordion title="प्रबंधित Gateway हीप आकार निर्धारण">
    - `gateway install` प्रबंधित Gateway सेवा के लिए केवल-हीप `NODE_OPTIONS` मान लिखता है। जब Node किसी कंटेनर या सेवा सीमा की रिपोर्ट करता है, तो यह सीमित मेमोरी के 50% को लक्षित करता है; अन्यथा भौतिक मेमोरी के 50% को।
    - नाममात्र लक्ष्य सीमा 2048–8192 MiB है, जिसमें अतिरिक्त 75% नेटिव-हेडरूम सीमा है। छोटे होस्ट पर, यह हेडरूम सीमा लागू सीमा को नाममात्र 2048 MiB न्यूनतम से नीचे रख सकती है।
    - इंस्टॉल की गई सेवा में पहले से संग्रहीत मान्य स्पष्ट `--max-old-space-size` को बलपूर्वक पुनः इंस्टॉल और डॉक्टर मरम्मत के दौरान सुरक्षित रखा जाता है। अन्य `NODE_OPTIONS` फ़्लैग प्रबंधित सेवा में नहीं ले जाए जाते।
    - परिवेशी शेल `NODE_OPTIONS` इस नीति को ओवरराइड नहीं करता। इंस्टॉल किए गए मान का निरीक्षण करने के लिए `gateway status` या `doctor` का उपयोग करें; ऐसी पुरानी सेवा मेटाडेटा को पुनः उत्पन्न करने के लिए `openclaw gateway install --force` चलाएँ, जिसमें प्रबंधित हीप सेटिंग नहीं है।
    - यह नीति केवल प्रबंधित Gateway सेवा पर लागू होती है। अग्रभूमि `gateway run`, Node सेवाएँ और हाथ से लिखी गई सुपरवाइज़र इकाइयाँ अपना स्वयं का रनटाइम कॉन्फ़िगरेशन बनाए रखती हैं।

  </Accordion>
  <Accordion title="इंस्टॉल के समय प्रमाणीकरण और SecretRefs">
    - जब टोकन प्रमाणीकरण के लिए टोकन आवश्यक हो और `gateway.auth.token` SecretRef-प्रबंधित हो, तब `gateway install` सत्यापित करता है कि SecretRef का समाधान संभव है, लेकिन समाधान किए गए टोकन को सेवा वातावरण मेटाडेटा में स्थायी नहीं करता।
    - यदि टोकन प्रमाणीकरण के लिए टोकन आवश्यक हो और कॉन्फ़िगर किए गए टोकन SecretRef का समाधान न हो सके, तो इंस्टॉल फ़ॉलबैक प्लेनटेक्स्ट स्थायी करने के बजाय बंद रहकर विफल होता है।
    - `gateway run` पर पासवर्ड प्रमाणीकरण के लिए, इनलाइन `--password` के बजाय `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, या SecretRef-समर्थित `gateway.auth.password` को प्राथमिकता दें।
    - अनुमानित प्रमाणीकरण मोड में, केवल-शेल `OPENCLAW_GATEWAY_PASSWORD` इंस्टॉल टोकन आवश्यकताओं को शिथिल नहीं करता; प्रबंधित सेवा इंस्टॉल करते समय स्थायी कॉन्फ़िगरेशन (`gateway.auth.password` या कॉन्फ़िगरेशन `env`) का उपयोग करें।
    - यदि `gateway.auth.token` और `gateway.auth.password` दोनों कॉन्फ़िगर हैं तथा `gateway.auth.mode` सेट नहीं है, तो मोड स्पष्ट रूप से सेट किए जाने तक इंस्टॉल अवरुद्ध रहता है।

  </Accordion>
</AccordionGroup>

## Gateway खोजें (Bonjour)

`gateway discover` Gateway बीकन (`_openclaw-gw._tcp`) के लिए स्कैन करता है।

- मल्टीकास्ट DNS-SD: `local.`
- यूनिकास्ट DNS-SD (वाइड-एरिया Bonjour): कोई डोमेन चुनें (उदाहरण: `openclaw.internal.`) और स्प्लिट DNS + DNS सर्वर सेट अप करें; [Bonjour](/hi/gateway/bonjour) देखें।

केवल वे Gateway बीकन का विज्ञापन करते हैं जिनमें Bonjour डिस्कवरी सक्षम है (डिफ़ॉल्ट)।

हर बीकन पर TXT संकेत: `role` (Gateway भूमिका संकेत), `transport` (ट्रांसपोर्ट संकेत, जैसे `gateway`), `gatewayPort` (WebSocket पोर्ट, सामान्यतः `18789`), `tailnetDns` (MagicDNS होस्टनाम, उपलब्ध होने पर), `gatewayTls` / `gatewayTlsSha256` (TLS सक्षम + प्रमाणपत्र फ़िंगरप्रिंट)। `sshPort` और `cliPath` केवल पूर्ण डिस्कवरी मोड (`discovery.mdns.mode: "full"`; डिफ़ॉल्ट `"minimal"` है, जो इन्हें छोड़ देता है—इसके बाद क्लाइंट SSH लक्ष्यों के लिए पोर्ट `22` को डिफ़ॉल्ट मानते हैं) में प्रकाशित किए जाते हैं।

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  प्रति-कमांड टाइमआउट (ब्राउज़/समाधान)।
</ParamField>
<ParamField path="--json" type="boolean">
  मशीन-पठनीय आउटपुट (स्टाइलिंग/स्पिनर भी अक्षम करता है)।
</ParamField>

उदाहरण:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- जब कॉन्फ़िगर किया गया वाइड-एरिया डोमेन सक्षम हो, तब उसके साथ `local.` को स्कैन करता है।
- JSON आउटपुट में `wsUrl` समाधान किए गए सेवा एंडपॉइंट से प्राप्त होता है, न कि केवल TXT संकेतों जैसे `lanHost` या `tailnetDns` से।
- `discovery.mdns.mode`, `local.` mDNS और वाइड-एरिया DNS-SD दोनों पर `sshPort`/`cliPath` के प्रकाशन को नियंत्रित करता है (ऊपर देखें)।

</Note>

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [Gateway संचालन पुस्तिका](/hi/gateway)
