---
read_when:
    - CLI से Gateway चलाना (डेवलपमेंट या सर्वर)
    - Gateway प्रमाणीकरण, बाइंड मोड और कनेक्टिविटी की डिबगिंग
    - Bonjour के माध्यम से Gateway खोजना (स्थानीय + वाइड-एरिया DNS-SD)
    - बाहरी Gateway प्रक्रिया पर्यवेक्षक का एकीकरण
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateway चलाएँ, क्वेरी करें और खोजें
title: Gateway
x-i18n:
    generated_at: "2026-07-21T17:01:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0188d7c79571ebf8f350295775625533a83cb2eb909bcc8763e8ce81806d2214
    source_path: cli/gateway.md
    workflow: 16
---

Gateway, OpenClaw का WebSocket सर्वर है (चैनल, नोड, सत्र, हुक)। नीचे दिए गए सभी उपकमांड `openclaw gateway ...` के अंतर्गत उपलब्ध हैं।

<CardGroup cols={3}>
  <Card title="Bonjour खोज" href="/hi/gateway/bonjour">
    स्थानीय mDNS + वाइड-एरिया DNS-SD सेटअप।
  </Card>
  <Card title="खोज का अवलोकन" href="/hi/gateway/discovery">
    OpenClaw किस प्रकार Gateway का विज्ञापन करता है और उन्हें खोजता है।
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
    - जब तक `~/.openclaw/openclaw.json` में `gateway.mode=local` सेट न हो, प्रारंभ होने से इनकार करता है। तदर्थ/डेवलपमेंट रन के लिए `--allow-unconfigured` का उपयोग करें; यह कॉन्फ़िगरेशन लिखे या सुधार किए बिना सुरक्षा जाँच को बायपास करता है।
    - जब स्टार्टअप को सुधार योग्य अमान्य कॉन्फ़िगरेशन मिलता है, तो एक इंटरैक्टिव टर्मिनल `openclaw doctor --fix` चलाने का प्रस्ताव देता है और सहमति के बाद स्टार्टअप का एक बार पुनः प्रयास करता है। गैर-इंटरैक्टिव रन कभी भी स्वचालित रूप से सुधार नहीं करते; इसके बजाय वे कमांड प्रिंट करते हैं। यदि सुधारा गया कॉन्फ़िगरेशन फिर भी अमान्य है, तो स्टार्टअप रुका रहता है।
    - `openclaw onboard --mode local` और `openclaw setup`, `gateway.mode=local` लिखते हैं। यदि कॉन्फ़िगरेशन फ़ाइल मौजूद है, लेकिन `gateway.mode` अनुपस्थित है, तो इसे क्षतिग्रस्त/अधिलेखित कॉन्फ़िगरेशन माना जाता है और Gateway आपके लिए `local` का अनुमान लगाने से इनकार करता है — ऑनबोर्डिंग दोबारा चलाएँ, कुंजी मैन्युअल रूप से सेट करें, या `--allow-unconfigured` पास करें।
    - प्रमाणीकरण के बिना लूपबैक से परे बाइंडिंग अवरुद्ध है।
    - `--bind` मान `lan`, `tailnet`, और `custom` वर्तमान में केवल IPv4 पथों पर रिज़ॉल्व होते हैं; केवल IPv6 वाले स्वयं-होस्ट किए गए सेटअप को Gateway के आगे IPv4 साइडकार या प्रॉक्सी चाहिए।
    - अधिकृत होने पर `SIGUSR1` प्रक्रिया के भीतर पुनः प्रारंभ ट्रिगर करता है। `commands.restart` (डिफ़ॉल्ट: सक्षम) बाहरी रूप से भेजे गए `SIGUSR1` को नियंत्रित करता है; मैन्युअल OS-सिग्नल पुनः प्रारंभ अवरुद्ध करने के लिए इसे `false` पर सेट करें। एजेंट-सामना करने वाला `gateway` टूल केवल-पठन है; एजेंट मानव-अनुमोदित `openclaw` डेलिगेशन टूल के माध्यम से पुनः प्रारंभ का अनुरोध करते हैं।
    - `SIGINT`/`SIGTERM` प्रक्रिया रोकते हैं, लेकिन कस्टम टर्मिनल स्थिति पुनर्स्थापित नहीं करते — यदि आप CLI को TUI या रॉ-मोड इनपुट में रैप करते हैं, तो बाहर निकलने से पहले टर्मिनल स्वयं पुनर्स्थापित करें।

  </Accordion>
</AccordionGroup>

### विकल्प

<ParamField path="--port <port>" type="number">
  WebSocket पोर्ट (कॉन्फ़िगरेशन/परिवेश से डिफ़ॉल्ट; सामान्यतः `18789`)।
</ParamField>
<ParamField path="--bind <mode>" type="string">
  बाइंड मोड: `loopback` (डिफ़ॉल्ट), `lan`, `tailnet`, `auto`, `custom`।
</ParamField>
<ParamField path="--token <token>" type="string">
  `connect.params.auth.token` के लिए साझा टोकन। सेट होने पर डिफ़ॉल्ट रूप से `OPENCLAW_GATEWAY_TOKEN`।
</ParamField>
<ParamField path="--auth <mode>" type="string">
  प्रमाणीकरण मोड: `none`, `token`, `password`, `trusted-proxy`।
</ParamField>
<ParamField path="--password <password>" type="string">
  `--auth password` के लिए पासवर्ड।
</ParamField>
<ParamField path="--password-file <path>" type="string">
  किसी फ़ाइल से Gateway पासवर्ड पढ़ें।
</ParamField>
<ParamField path="--tailscale <mode>" type="string">
  Tailscale एक्सपोज़र: `off`, `serve`, `funnel`।
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  शटडाउन पर Tailscale सर्व/फ़नल कॉन्फ़िगरेशन रीसेट करें।
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  `gateway.mode=local` लागू किए बिना प्रारंभ करें। केवल तदर्थ/डेवलपमेंट बूटस्ट्रैप; कॉन्फ़िगरेशन को सहेजता या सुधारता नहीं है।
</ParamField>
<ParamField path="--dev" type="boolean">
  अनुपस्थित होने पर डेवलपमेंट कॉन्फ़िगरेशन + कार्यस्थान बनाएँ (`BOOTSTRAP.md` छोड़ देता है)।
</ParamField>
<ParamField path="--dev-ambient-channels" type="boolean">
  डेवलपमेंट Gateway को परिवेश में उपलब्ध पर्यावरण चरों से चैनल स्वतः कॉन्फ़िगर करने दें। `--dev` आवश्यक है।
</ParamField>
<ParamField path="--reset" type="boolean">
  डेवलपमेंट कॉन्फ़िगरेशन, क्रेडेंशियल, सत्र और कार्यस्थान रीसेट करें। `--dev` आवश्यक है।
</ParamField>
<ParamField path="--force" type="boolean">
  प्रारंभ करने से पहले लक्ष्य पोर्ट पर मौजूद किसी भी लिसनर को समाप्त करें। गैर-इंटरैक्टिव शेल में, यह सत्यापित Gateway लिसनर को समाप्त करने से इनकार करता है; इसके बजाय `--dev` या मुक्त पोर्ट वाले पृथक `--profile` का उपयोग करें।
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

`--bind custom` के लिए, `gateway.customBindHost` को IPv4 पते पर सेट करें। `127.0.0.1` या `0.0.0.0` के अतिरिक्त किसी भी पते के लिए समान होस्ट के क्लाइंट हेतु उसी पोर्ट पर `127.0.0.1` भी आवश्यक है; यदि कोई भी लिसनर बाइंड नहीं कर पाता, तो स्टार्टअप विफल हो जाता है। वाइल्डकार्ड `0.0.0.0` अलग से आवश्यक उपनाम नहीं जोड़ता। केवल IPv6 वाले स्वयं-होस्ट किए गए सेटअप को Gateway के आगे IPv4 साइडकार या प्रॉक्सी चाहिए।

## Gateway पुनः प्रारंभ करें

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` चालू Gateway को सक्रिय कार्य की पूर्व-जाँच करने और वह कार्य समाप्त होने के बाद एक समेकित पुनः प्रारंभ निर्धारित करने के लिए कहता है। प्रतीक्षा 5 मिनट तक सीमित है; समय-सीमा समाप्त होने पर पुनः प्रारंभ बलपूर्वक किया जाता है। `--safe` को `--force` या `--wait` के साथ संयोजित नहीं किया जा सकता।

`--skip-deferral` सुरक्षित पुनः प्रारंभ पर सक्रिय-कार्य स्थगन गेट को बायपास करता है, इसलिए रिपोर्ट किए गए अवरोधकों के बावजूद Gateway तुरंत पुनः प्रारंभ होता है। इसके लिए `--safe` आवश्यक है — इसका उपयोग तब करें जब कोई अनियंत्रित टास्क स्थगन को अटकाए रखता है।

`--wait <duration>` सामान्य (गैर-सुरक्षित) पुनः प्रारंभ के लिए ड्रेन समय-सीमा को ओवरराइड करता है। बिना इकाई वाले मिलीसेकंड या इकाई प्रत्यय `ms`, `s`, `m`, `h`, `d` स्वीकार करता है (जैसे `30s`, `5m`, `1h30m`); `--wait 0` अनिश्चित काल तक प्रतीक्षा करता है। `--force` या `--safe` के साथ संगत नहीं है।

`--force` सक्रिय कार्य के समाप्त होने की प्रतीक्षा छोड़ देता है और तुरंत पुनः प्रारंभ करता है। सामान्य `restart` (कोई फ़्लैग नहीं) मौजूदा सेवा-प्रबंधक पुनः प्रारंभ व्यवहार बनाए रखता है।

<Warning>
इनलाइन `--password` स्थानीय प्रक्रिया सूचियों में दिखाई दे सकता है। `--password-file`, पर्यावरण चर, या SecretRef-समर्थित `gateway.auth.password` को प्राथमिकता दें।
</Warning>

### बाहरी पर्यवेक्षक

`OPENCLAW_SUPERVISOR_MODE=external` केवल तभी सेट करें, जब कोई अन्य प्रक्रिया प्रबंधक Gateway जीवनचक्र का स्वामी हो। इस मोड में:

- `openclaw gateway restart` launchd, systemd या Task Scheduler के बजाय सत्यापित रूप से चल रहे Gateway को लक्षित करते हुए मौजूदा सुरक्षित, बलपूर्वक और सीमित-प्रतीक्षा व्यवहार बनाए रखता है।
- बाहरी पर्यवेक्षक का उपयोग करने के मार्गदर्शन के साथ मूल सेवा की स्थापना, प्रारंभ, रोक और स्थापना-रद्द करने की कार्रवाइयों से इनकार किया जाता है।
- OpenClaw के स्व-अद्यतन से इनकार किया जाता है, ताकि पर्यवेक्षक Gateway को रोक सके, रनटाइम को बदल और अंतिम रूप दे सके, तथा उसे सुरक्षित रूप से पुनः प्रारंभ कर सके।
- नई प्रक्रिया वाला पुनः प्रारंभ साफ़ निकास से पहले SQLite में सीमित हैंडऑफ़ लिखता है। यदि स्थायित्व विफल होता है, तो उपभोग योग्य हैंडऑफ़ के बिना बाहर निकलने के बजाय Gateway प्रक्रिया के भीतर पुनः प्रारंभ का उपयोग करता है।

`OPENCLAW_SERVICE_REPAIR_POLICY=external` एक अलग Doctor सुधार नीति बनी रहती है। यह रनटाइम स्वामित्व घोषित नहीं करती; जिन पर्यवेक्षकों को दोनों व्यवहारों की आवश्यकता है, उन्हें दोनों चर सेट करने चाहिए।

बाहरी पर्यवेक्षक छिपे हुए मशीन अनुबंध के माध्यम से पुनः प्रारंभ हैंडऑफ़ पर सहमति बना सकते हैं और उसका उपभोग कर सकते हैं:

```bash
openclaw gateway restart-handoff capabilities --json
openclaw gateway restart-handoff consume --expected-pid <pid> --json
```

प्रोटोकॉल संस्करण `1`, `consume` कार्रवाई का समर्थन करता है। उपभोग एक तत्काल SQLite ट्रांज़ैक्शन के भीतर अपेक्षित PID और सीमित हैंडऑफ़ फ़ील्ड को सत्यापित करता है। सफलता लौटाने से पहले स्वीकृत हैंडऑफ़ हटा दिया जाता है, इसलिए समवर्ती या दोबारा चलाए गए उपभोक्ता दोनों उसे स्वीकार नहीं कर सकते। PID बेमेल होने पर हैंडऑफ़ संबंधित स्वामी के लिए रखा जाता है; अनुपस्थित, समय-सीमा समाप्त और अमान्य पंक्तियाँ पुनः प्रारंभ को अधिकृत नहीं करतीं।

वैध मशीन अनुरोध, पुनः प्रारंभ न करने वाले परिणामों सहित, निकास कोड `0` के साथ JSON लौटाते हैं। अमान्य आर्ग्युमेंट निकास कोड `2` के साथ `reason: "invalid-expected-pid"` लौटाते हैं; स्थिति-स्टोर विफलताएँ निकास कोड `1` के साथ `reason: "store-unavailable"` लौटाती हैं। पर्यवेक्षकों को OpenClaw संस्करण स्ट्रिंग से समर्थन का अनुमान लगाने या निजी SQLite स्कीमा को सीधे पढ़ने के बजाय, उपयोग किए जाने वाले सटीक रनटाइम या लॉन्चर पर `capabilities` की जाँच करनी चाहिए।

### Gateway प्रोफ़ाइलिंग

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` स्टार्टअप के दौरान चरण समय लॉग करता है, जिसमें प्रत्येक चरण की `eventLoopMax` देरी और Plugin लुकअप-टेबल समय (इंस्टॉल किया गया इंडेक्स, मैनिफ़ेस्ट रजिस्ट्री, स्टार्टअप योजना, स्वामी-मैप कार्य) शामिल हैं।
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` पुनः प्रारंभ-सीमित `restart trace:` पंक्तियाँ लॉग करता है: सिग्नल प्रबंधन, सक्रिय कार्य ड्रेन, शटडाउन चरण, अगला प्रारंभ, तैयार होने का समय और मेमोरी मेट्रिक्स।
- `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` के साथ `OPENCLAW_DIAGNOSTICS=timeline` बाहरी QA हार्नेस के लिए सर्वोत्तम-प्रयास JSONL स्टार्टअप डायग्नोस्टिक्स टाइमलाइन लिखता है (कॉन्फ़िगरेशन `diagnostics.flags: ["timeline"]` के समतुल्य; पथ अभी भी केवल पर्यावरण चर के माध्यम से उपलब्ध है)। इवेंट-लूप नमूने शामिल करने के लिए `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` जोड़ें।
- पहले `pnpm build`, फिर `pnpm test:startup:gateway -- --runs 5 --warmup 1`, निर्मित CLI एंट्री के विरुद्ध Gateway स्टार्टअप का बेंचमार्क करता है: पहली प्रक्रिया आउटपुट, `/healthz`, `/readyz`, स्टार्टअप ट्रेस समय, इवेंट-लूप देरी और Plugin लुकअप-टेबल समय।
- पहले `pnpm build`, फिर `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`, macOS या Linux पर प्रक्रिया के भीतर पुनः प्रारंभ का बेंचमार्क करता है (Windows पर समर्थित नहीं; पुनः प्रारंभ के लिए `SIGUSR1` आवश्यक है)। यह `SIGUSR1` का उपयोग करता है, चाइल्ड प्रक्रिया में दोनों ट्रेस सक्षम करता है, और अगला `/healthz`, अगला `/readyz`, डाउनटाइम, तैयार होने का समय, CPU, RSS तथा पुनः प्रारंभ ट्रेस मेट्रिक्स रिकॉर्ड करता है।
- `/healthz` सक्रियता है; `/readyz` उपयोग योग्य तत्परता है। ट्रेस पंक्तियों और बेंचमार्क आउटपुट को स्वामी-आरोपण संकेत मानें, किसी एक अवधि या नमूने से प्राप्त पूर्ण प्रदर्शन निष्कर्ष नहीं।

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
    - `--timeout <ms>`: समय-सीमा/बजट (डिफ़ॉल्ट प्रत्येक कमांड के अनुसार अलग होता है; नीचे प्रत्येक कमांड देखें)।
    - `--expect-final`: "अंतिम" प्रतिक्रिया की प्रतीक्षा करें (एजेंट कॉल)।

  </Tab>
</Tabs>

<Note>
जब आप `--url` सेट करते हैं, तो CLI कॉन्फ़िगरेशन या पर्यावरण क्रेडेंशियल पर फ़ॉलबैक नहीं करता। `--token` या `--password` स्पष्ट रूप से पास करें। स्पष्ट क्रेडेंशियल का अनुपस्थित होना एक त्रुटि है।
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` एक लाइवनेस प्रोब है: सर्वर के HTTP का उत्तर देने में सक्षम होते ही यह लौट आता है। `/readyz` अधिक सख्त है और स्टार्टअप Plugin साइडकार, चैनल या कॉन्फ़िगर किए गए हुक के स्थिर होने तक लाल रहता है। स्थानीय या प्रमाणीकृत विस्तृत `/readyz` प्रतिक्रियाओं में एक `eventLoop` निदान ब्लॉक (विलंब, उपयोग, CPU-कोर अनुपात, `degraded` फ़्लैग) शामिल होता है।

<ParamField path="--port <port>" type="number">
  इस पोर्ट पर स्थानीय लूपबैक Gateway को लक्षित करें। इस कॉल के लिए `OPENCLAW_GATEWAY_URL` और `OPENCLAW_GATEWAY_PORT` को ओवरराइड करता है।
</ParamField>

### `gateway usage-cost`

सेशन लॉग से उपयोग-लागत सारांश प्राप्त करें।

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
  सभी कॉन्फ़िगर किए गए एजेंटों के आँकड़े एकत्रित करें। इसे `--agent` के साथ संयोजित नहीं किया जा सकता।
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
  केवल किसी निदान अनुक्रम संख्या के बाद के इवेंट शामिल करें।
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
  <Accordion title="गोपनीयता और बंडल का व्यवहार">
    - रिकॉर्ड परिचालन मेटाडेटा रखते हैं: इवेंट नाम, गणनाएँ, बाइट आकार, मेमोरी रीडिंग, क्यू/सेशन स्थिति, अनुमोदन आईडी, चैनल/Plugin नाम और संपादित सेशन सारांश। इनमें चैट टेक्स्ट, Webhook बॉडी, टूल आउटपुट, अपरिष्कृत अनुरोध/प्रतिक्रिया बॉडी, टोकन, कुकी, गुप्त मान, होस्टनेम और अपरिष्कृत सेशन आईडी शामिल नहीं होते। रिकॉर्डर को पूरी तरह अक्षम करने के लिए `diagnostics.enabled: false` सेट करें।
    - रिकॉर्डर में इवेंट होने पर घातक Gateway निकास, शटडाउन टाइमआउट और रीस्टार्ट स्टार्टअप विफलताएँ वही निदान स्नैपशॉट `~/.openclaw/logs/stability/openclaw-stability-*.json` में लिखती हैं। नवीनतम बंडल का निरीक्षण `openclaw gateway stability --bundle latest` से करें; `--limit`, `--type` और `--since-seq` बंडल आउटपुट पर भी लागू होते हैं।

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

बग रिपोर्ट के लिए डिज़ाइन किया गया स्थानीय निदान zip लिखें। गोपनीयता मॉडल और बंडल की सामग्री के लिए [निदान निर्यात](/hi/gateway/diagnostics) देखें।

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  आउटपुट zip पथ। डिफ़ॉल्ट रूप से स्टेट डायरेक्टरी के अंतर्गत सहायता निर्यात होता है।
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  शामिल की जाने वाली सैनिटाइज़ की गई लॉग पंक्तियों की अधिकतम संख्या।
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

निर्यात में ये बंडल होते हैं: `manifest.json` (फ़ाइल सूची), `summary.md` (Markdown सारांश), `diagnostics.json` (शीर्ष-स्तरीय कॉन्फ़िगरेशन/लॉग/डिस्कवरी/स्थिरता/स्थिति/स्वास्थ्य सारांश), `config/sanitized.json`, `status/gateway-status.json`, `health/gateway-health.json`, `logs/openclaw-sanitized.jsonl` और बंडल मौजूद होने पर `stability/latest.json`।

इसे साझा करने के लिए डिज़ाइन किया गया है। यह डीबगिंग के लिए उपयोगी परिचालन विवरण—सुरक्षित लॉग फ़ील्ड, सबसिस्टम नाम, स्थिति कोड, अवधियाँ, कॉन्फ़िगर किए गए मोड, पोर्ट, Plugin/प्रदाता आईडी, गैर-गुप्त फ़ीचर सेटिंग और संपादित परिचालन लॉग संदेश—रखता है तथा चैट टेक्स्ट, Webhook बॉडी, टूल आउटपुट, क्रेडेंशियल, कुकी, खाता/संदेश पहचानकर्ता, प्रॉम्प्ट/निर्देश टेक्स्ट, होस्टनेम और गुप्त मानों को छोड़ देता है या संपादित कर देता है। जब कोई लॉग संदेश उपयोगकर्ता/चैट/टूल पेलोड टेक्स्ट जैसा दिखता है (जैसे "उपयोगकर्ता ने कहा", "चैट टेक्स्ट", "टूल आउटपुट", "Webhook बॉडी"), तो निर्यात केवल यह तथ्य रखता है कि संदेश छोड़ दिया गया था और साथ में उसकी बाइट संख्या रखता है।

### `gateway status`

Gateway सेवा (launchd/systemd/schtasks) के साथ एक वैकल्पिक कनेक्टिविटी/प्रमाणीकरण प्रोब दिखाता है।

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  स्पष्ट प्रोब लक्ष्य जोड़ें। कॉन्फ़िगर किया गया रिमोट + localhost फिर भी प्रोब किए जाते हैं।
</ParamField>
<ParamField path="--token <token>" type="string">
  प्रोब के लिए टोकन प्रमाणीकरण।
</ParamField>
<ParamField path="--password <password>" type="string">
  प्रोब के लिए पासवर्ड प्रमाणीकरण।
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  प्रोब टाइमआउट।
</ParamField>
<ParamField path="--no-probe" type="boolean">
  कनेक्टिविटी प्रोब छोड़ें (केवल-सेवा दृश्य)।
</ParamField>
<ParamField path="--deep" type="boolean">
  सिस्टम-स्तरीय सेवाओं को भी स्कैन करें।
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  कनेक्टिविटी प्रोब को रीड प्रोब में अपग्रेड करें और विफल होने पर गैर-शून्य कोड के साथ बाहर निकलें। इसे `--no-probe` के साथ संयोजित नहीं किया जा सकता।
</ParamField>

<AccordionGroup>
  <Accordion title="स्थिति का अर्थ">
    - स्थानीय CLI कॉन्फ़िगरेशन अनुपस्थित या अमान्य होने पर भी निदान के लिए उपलब्ध रहता है।
    - डिफ़ॉल्ट आउटपुट सेवा स्थिति, WebSocket कनेक्शन और हैंडशेक के समय दिखाई देने वाली प्रमाणीकरण क्षमता को प्रमाणित करता है—रीड/राइट/एडमिन परिचालनों को नहीं।
    - पहली बार के डिवाइस प्रमाणीकरण के लिए प्रोब गैर-परिवर्तनकारी होते हैं: मौजूद होने पर वे मौजूदा कैश किया हुआ डिवाइस टोकन पुनः उपयोग करते हैं, लेकिन केवल स्थिति जाँचने के लिए कभी नया CLI डिवाइस पहचानकर्ता या केवल-पढ़ने योग्य पेयरिंग रिकॉर्ड नहीं बनाते।
    - जहाँ संभव हो, प्रोब प्रमाणीकरण के लिए कॉन्फ़िगर किए गए प्रमाणीकरण SecretRefs को हल करता है। यदि कोई आवश्यक SecretRef अनसुलझा है, तो प्रोब कनेक्टिविटी/प्रमाणीकरण विफल होने पर `--json`, `rpc.authWarning` रिपोर्ट करता है; `--token`/`--password` स्पष्ट रूप से दें या गुप्त स्रोत ठीक करें। प्रोब सफल होने के बाद अनसुलझे-प्रमाणीकरण की चेतावनियाँ दबा दी जाती हैं।
    - चल रहा Gateway इसे रिपोर्ट करे तो JSON आउटपुट में `gateway.version` शामिल होता है; यदि हैंडशेक प्रोब संस्करण मेटाडेटा नहीं दे सकता, तो `--require-rpc`, `status.runtimeVersion` RPC पेलोड का फ़ॉलबैक उपयोग कर सकता है।
    - जब सुनने वाली सेवा पर्याप्त न हो और रीड-स्कोप RPC का भी स्वस्थ होना आवश्यक हो, तो स्क्रिप्ट/ऑटोमेशन में `--require-rpc` का उपयोग करें।
    - `--deep` अतिरिक्त launchd/systemd/schtasks इंस्टॉलेशन स्कैन करता है; एकाधिक Gateway-जैसी सेवाएँ मिलने पर मानव-पठनीय आउटपुट सफ़ाई के संकेत प्रिंट करता है (आमतौर पर प्रति मशीन एक Gateway चलाएँ) और प्रासंगिक होने पर हाल का सुपरवाइज़र रीस्टार्ट हस्तांतरण रिपोर्ट करता है।
    - `--deep` Plugin-जागरूक मोड (`pluginValidation: "full"`) में कॉन्फ़िगरेशन सत्यापन भी चलाता है और Plugin मैनिफ़ेस्ट चेतावनियाँ दिखाता है (जैसे चैनल कॉन्फ़िगरेशन मेटाडेटा अनुपस्थित होना)। डिफ़ॉल्ट `gateway status` तेज़ केवल-पढ़ने योग्य पथ बनाए रखता है, जो Plugin सत्यापन छोड़ देता है।
    - प्रोफ़ाइल या स्टेट-डायरेक्टरी विचलन का निदान करने में सहायता के लिए मानव-पठनीय आउटपुट में हल किया गया फ़ाइल लॉग पथ और CLI-बनाम-सेवा कॉन्फ़िगरेशन पथ/वैधता शामिल होते हैं।
    - मानव-पठनीय आउटपुट में लागू सीमा और उसकी अनुकूली व्युत्पत्ति के साथ `Gateway heap:` शामिल होता है। JSON आउटपुट उसी रिपोर्ट को `service.gatewayHeap` के रूप में दिखाता है।

  </Accordion>
  <Accordion title="Linux systemd प्रमाणीकरण-विचलन जाँच">
    - सेवा प्रमाणीकरण विचलन जाँच यूनिट से `Environment=` और `EnvironmentFile=` दोनों पढ़ती हैं (इनमें `%h`, उद्धृत पथ, एकाधिक फ़ाइलें और वैकल्पिक `-` फ़ाइलें शामिल हैं)।
    - मर्ज किए गए रनटाइम परिवेश का उपयोग करके `gateway.auth.token` SecretRefs को हल करता है (पहले सेवा कमांड परिवेश, फिर प्रक्रिया परिवेश फ़ॉलबैक)।
    - टोकन-विचलन जाँच तब कॉन्फ़िगरेशन टोकन समाधान छोड़ देती है, जब टोकन प्रमाणीकरण प्रभावी रूप से सक्रिय नहीं होता (`gateway.auth.mode` स्पष्ट रूप से `password`/`none`/`trusted-proxy` हो, या मोड सेट न हो जहाँ पासवर्ड प्राथमिक हो सकता है और कोई टोकन उम्मीदवार प्राथमिक नहीं हो सकता)।

  </Accordion>
</AccordionGroup>

### `gateway probe`

"सब कुछ डीबग करें" कमांड। यह हमेशा इनका प्रोब करता है:

- आपका कॉन्फ़िगर किया गया रिमोट Gateway (यदि सेट हो), और
- localhost (लूपबैक), **भले ही रिमोट कॉन्फ़िगर किया गया हो**।

`--url` देने से वह स्पष्ट लक्ष्य दोनों से पहले जुड़ जाता है। मानव-पठनीय आउटपुट लक्ष्यों को `URL (explicit)`, `Remote (configured)` / `Remote (configured, inactive)` और `Local loopback` के रूप में लेबल करता है।

<Note>
यदि एकाधिक प्रोब लक्ष्य पहुँच योग्य हों, तो सभी प्रिंट किए जाते हैं। SSH टनल, TLS/प्रॉक्सी URL और कॉन्फ़िगर किया गया रिमोट URL अलग-अलग ट्रांसपोर्ट पोर्ट होने पर भी उसी Gateway की ओर संकेत कर सकते हैं; `multiple_gateways` विशिष्ट या पहचान-संदिग्ध पहुँच योग्य Gateway के लिए आरक्षित है। पृथक प्रोफ़ाइल (जैसे बचाव बॉट) के लिए एकाधिक Gateway चलाना समर्थित है, लेकिन अधिकांश इंस्टॉलेशन एक ही Gateway चलाते हैं।
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  स्थानीय लूपबैक प्रोब लक्ष्य और SSH टनल रिमोट पोर्ट के लिए इस पोर्ट का उपयोग करें। `--url` के बिना, यह कॉन्फ़िगर किए गए Gateway परिवेश URL, परिवेश पोर्ट या रिमोट लक्ष्यों के बजाय केवल स्थानीय लूपबैक लक्ष्य चुनता है।
</ParamField>

<AccordionGroup>
  <Accordion title="व्याख्या">
    - `Reachable: yes` का अर्थ है कि कम-से-कम एक लक्ष्य ने WebSocket कनेक्शन स्वीकार किया।
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` पहुँच-योग्यता से अलग यह रिपोर्ट करता है कि प्रोब प्रमाणीकरण के बारे में क्या प्रमाणित कर सका।
    - `Read probe: ok` का अर्थ है कि रीड-स्कोप विस्तृत RPC कॉल (`health`/`status`/`system-presence`/`config.get`) भी सफल रहे।
    - `Read probe: limited - missing scope: operator.read` का अर्थ है कि कनेक्शन सफल रहा, लेकिन रीड-स्कोप RPC सीमित है। इसे पूर्ण विफलता के बजाय **अवनत** पहुँच-योग्यता के रूप में रिपोर्ट किया जाता है।
    - `Connect: ok` के बाद `Read probe: failed` का अर्थ है कि WebSocket कनेक्ट हो गया, लेकिन अनुवर्ती रीड निदान का टाइमआउट हो गया या वे विफल रहे—यह भी अगम्य होने के बजाय **अवनत** स्थिति है।
    - `gateway status` की तरह, प्रोब मौजूदा कैश किए गए डिवाइस प्रमाणीकरण का पुनः उपयोग करता है, लेकिन पहली बार की डिवाइस पहचान या पेयरिंग स्थिति नहीं बनाता।
    - निकास कोड केवल तभी गैर-शून्य होता है, जब प्रोब किया गया कोई भी लक्ष्य पहुँच योग्य न हो।

  </Accordion>
  <Accordion title="JSON आउटपुट">
    शीर्ष स्तर:

    - `ok`: कम-से-कम एक लक्ष्य पहुँच योग्य है।
    - `degraded`: कम-से-कम एक लक्ष्य ने कनेक्शन स्वीकार किया, लेकिन पूर्ण-विवरण RPC निदान पूरा नहीं किया।
    - `capability`: पहुँच योग्य लक्ष्यों में देखी गई सर्वोत्तम क्षमता (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope`, या `unknown`)।
    - `primaryTargetId`: सक्रिय विजेता के रूप में मानने के लिए सर्वोत्तम लक्ष्य, इस क्रम में: स्पष्ट URL, SSH टनल, कॉन्फ़िगर किया गया रिमोट, स्थानीय लूपबैक।
    - `warnings[]`: `code`, `message`, और वैकल्पिक `targetIds` वाले सर्वोत्तम-प्रयास चेतावनी रिकॉर्ड।
    - `network`: मौजूदा कॉन्फ़िगरेशन और होस्ट नेटवर्किंग से प्राप्त स्थानीय लूपबैक/टेलनेट URL संकेत।
    - `discovery.timeoutMs` / `discovery.count`: इस जाँच चरण के लिए उपयोग किया गया वास्तविक खोज बजट/परिणाम संख्या।

    प्रति लक्ष्य (`targets[].connect`): `ok` (पहुँच-योग्यता + अवनत वर्गीकरण), `rpcOk` (पूर्ण-विवरण RPC सफलता), `scopeLimited` (ऑपरेटर स्कोप अनुपलब्ध होने पर विवरण RPC विफल हुआ)।

    प्रति लक्ष्य (`targets[].auth`): उपलब्ध होने पर `hello-ok` में रिपोर्ट किए गए `role` और `scopes`, साथ ही प्रदर्शित `capability` वर्गीकरण।

  </Accordion>
  <Accordion title="सामान्य चेतावनी कोड">
    - `ssh_tunnel_failed`: SSH टनल सेटअप विफल हुआ; कमांड ने प्रत्यक्ष जाँच का उपयोग किया।
    - `multiple_gateways`: अलग-अलग Gateway पहचानें पहुँच योग्य थीं, या OpenClaw यह प्रमाणित नहीं कर सका कि पहुँच योग्य लक्ष्य एक ही Gateway हैं। उसी Gateway का SSH टनल, प्रॉक्सी URL या कॉन्फ़िगर किया गया रिमोट URL इसे ट्रिगर नहीं करता।
    - `auth_secretref_unresolved`: किसी विफल लक्ष्य के लिए कॉन्फ़िगर किया गया प्रमाणीकरण SecretRef हल नहीं किया जा सका।
    - `probe_scope_limited`: WebSocket कनेक्शन सफल हुआ, लेकिन `operator.read` अनुपलब्ध होने के कारण पठन जाँच सीमित थी।
    - `local_tls_runtime_unavailable`: स्थानीय Gateway TLS सक्षम है, लेकिन OpenClaw स्थानीय प्रमाणपत्र फ़िंगरप्रिंट लोड नहीं कर सका।

  </Accordion>
</AccordionGroup>

#### SSH के माध्यम से रिमोट (Mac ऐप के समान)

macOS ऐप का "Remote over SSH" मोड स्थानीय पोर्ट-फ़ॉरवर्ड का उपयोग करता है, ताकि केवल-लूपबैक रिमोट Gateway `ws://127.0.0.1:<port>` पर पहुँच योग्य हो जाए।

CLI समकक्ष:

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
  हल किए गए खोज एंडपॉइंट से पहले खोजे गए Gateway होस्ट को SSH लक्ष्य के रूप में चुनें (`local.` और कॉन्फ़िगर किया गया वाइड-एरिया डोमेन, यदि कोई हो)। केवल-TXT संकेतों की उपेक्षा की जाती है।
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
  मुख्य रूप से एजेंट-शैली RPC के लिए, जो अंतिम पेलोड से पहले मध्यवर्ती इवेंट स्ट्रीम करते हैं।
</ParamField>
<ParamField path="--json" type="boolean">
  मशीन-पठनीय JSON आउटपुट।
</ParamField>

<Note>
`--params` मान्य JSON होना चाहिए, और प्रत्येक विधि अपने पैरामीटर आकार को सत्यापित करती है (अतिरिक्त/गलत नाम वाले फ़ील्ड अस्वीकार किए जाते हैं)।
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

जब प्रबंधित सेवा को किसी अन्य निष्पादन योग्य के माध्यम से प्रारंभ करना आवश्यक हो, तो `--wrapper` का उपयोग करें, उदाहरण के लिए सीक्रेट मैनेजर शिम या रन-ऐज़ सहायक। रैपर को सामान्य Gateway आर्ग्युमेंट मिलते हैं और वह अंततः उन्हीं आर्ग्युमेंट के साथ `openclaw` या Node को निष्पादित करने के लिए उत्तरदायी है।

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

आप रैपर को एनवायरनमेंट के माध्यम से भी सेट कर सकते हैं। `gateway install` सत्यापित करता है कि पथ एक निष्पादन योग्य फ़ाइल है, रैपर को सेवा `ProgramArguments` में लिखता है और बाद के बलपूर्वक पुनः-इंस्टॉल, अपडेट तथा डॉक्टर मरम्मत के लिए सेवा एनवायरनमेंट में `OPENCLAW_WRAPPER` को स्थायी करता है।

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

स्थायी रैपर हटाने के लिए पुनः इंस्टॉल करते समय `OPENCLAW_WRAPPER` को रिक्त करें:

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
    - `gateway start` इडेम्पोटेंट है: जब प्रबंधित सेवा पहले से चल रही होती है, तो यह चल रही प्रक्रिया की रिपोर्ट करता है और उसे अपरिवर्तित छोड़ देता है। लोड की गई लेकिन रुकी हुई सेवा पहले की तरह प्रारंभ की जाती है।
    - प्रबंधित सेवा को पुनः प्रारंभ करने के लिए `gateway restart` का उपयोग करें। पुनः प्रारंभ के विकल्प के रूप में `gateway stop` और `gateway start` को श्रृंखलाबद्ध न करें।
    - गैर-इंटरैक्टिव शेल में `gateway stop` के लिए `--force` आवश्यक है। इंटरैक्टिव टर्मिनल मौजूदा प्रॉम्प्ट-रहित व्यवहार बनाए रखते हैं। स्वचालन और परीक्षणों के लिए `gateway run --dev` या मुक्त पोर्ट वाले पृथक `--profile` को प्राथमिकता दें।
    - macOS पर `gateway stop` डिफ़ॉल्ट रूप से `launchctl bootout` का उपयोग करता है, जो निष्क्रियता को स्थायी किए बिना मौजूदा बूट सत्र से LaunchAgent हटा देता है—भविष्य के क्रैश के लिए KeepAlive स्वतः-पुनर्प्राप्ति सक्रिय रहती है और `gateway start`, मैन्युअल `launchctl enable` के बिना, स्वच्छ रूप से पुनः सक्षम करता है। KeepAlive और RunAtLoad को स्थायी रूप से दबाने के लिए `--disable` दें, ताकि अगले स्पष्ट `gateway start` तक Gateway दोबारा प्रारंभ न हो; इसका उपयोग तब करें जब मैन्युअल रोक रीबूट के बाद भी बनी रहनी चाहिए।
    - Gateway जीवनचक्र परिवर्तन सर्वोत्तम-प्रयास कुंजी-मान ऑडिट रिकॉर्ड `<state-dir>/logs/gateway-restart.log` में जोड़ते हैं, जिनमें CLI प्रारंभ, रोक और पुनः प्रारंभ संचालन, सुरक्षित पुनः प्रारंभ अनुरोध, सुपरवाइज़र पुनः प्रारंभ और अलग किए गए हैंडऑफ़ शामिल हैं।
    - जीवनचक्र कमांड स्क्रिप्टिंग के लिए `--json` स्वीकार करते हैं।

  </Accordion>
  <Accordion title="प्रबंधित Gateway हीप आकार">
    - `gateway install` प्रबंधित Gateway सेवा के लिए केवल-हीप `NODE_OPTIONS` मान लिखता है। जब Node किसी कंटेनर या सेवा सीमा की रिपोर्ट करता है, तो यह सीमित मेमोरी के 50% को लक्षित करता है; अन्यथा भौतिक मेमोरी के 50% को।
    - नाममात्र लक्ष्य सीमा 2048–8192 MiB है, साथ ही नेटिव हेडरूम की अतिरिक्त 75% सीमा है। छोटे होस्ट पर वह हेडरूम सीमा लागू सीमा को नाममात्र 2048 MiB न्यूनतम से नीचे रख सकती है।
    - इंस्टॉल की गई सेवा में पहले से संग्रहित मान्य स्पष्ट `--max-old-space-size` को बलपूर्वक पुनः-इंस्टॉल और डॉक्टर मरम्मत के दौरान सुरक्षित रखा जाता है। अन्य `NODE_OPTIONS` फ़्लैग प्रबंधित सेवा में नहीं ले जाए जाते।
    - परिवेशी शेल `NODE_OPTIONS` इस नीति को ओवरराइड नहीं करता। इंस्टॉल किए गए मान का निरीक्षण करने के लिए `gateway status` या `doctor` का उपयोग करें; ऐसी पुरानी सेवा मेटाडेटा को पुनः उत्पन्न करने के लिए `openclaw gateway install --force` चलाएँ जिसमें प्रबंधित हीप सेटिंग नहीं है।
    - यह नीति केवल प्रबंधित Gateway सेवा पर लागू होती है। अग्रभूमि `gateway run`, नोड सेवाएँ और हाथ से लिखी गई सुपरवाइज़र इकाइयाँ अपना रनटाइम कॉन्फ़िगरेशन बनाए रखती हैं।

  </Accordion>
  <Accordion title="इंस्टॉल के समय प्रमाणीकरण और SecretRefs">
    - जब टोकन प्रमाणीकरण के लिए टोकन आवश्यक हो और `gateway.auth.token` SecretRef द्वारा प्रबंधित हो, तो `gateway install` सत्यापित करता है कि SecretRef हल किया जा सकता है, लेकिन हल किए गए टोकन को सेवा एनवायरनमेंट मेटाडेटा में स्थायी नहीं करता।
    - यदि टोकन प्रमाणीकरण के लिए टोकन आवश्यक हो और कॉन्फ़िगर किया गया टोकन SecretRef अनसुलझा हो, तो फ़ॉलबैक प्लेनटेक्स्ट स्थायी करने के बजाय इंस्टॉल बंद होकर विफल होता है।
    - `gateway run` पर पासवर्ड प्रमाणीकरण के लिए इनलाइन `--password` की तुलना में `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` या SecretRef-समर्थित `gateway.auth.password` को प्राथमिकता दें।
    - अनुमानित प्रमाणीकरण मोड में केवल-शेल `OPENCLAW_GATEWAY_PASSWORD`, इंस्टॉल टोकन की आवश्यकताओं को शिथिल नहीं करता; प्रबंधित सेवा इंस्टॉल करते समय टिकाऊ कॉन्फ़िगरेशन (`gateway.auth.password` या कॉन्फ़िगरेशन `env`) का उपयोग करें।
    - यदि `gateway.auth.token` और `gateway.auth.password` दोनों कॉन्फ़िगर हों तथा `gateway.auth.mode` सेट न हो, तो मोड स्पष्ट रूप से सेट किए जाने तक इंस्टॉल अवरुद्ध रहता है।

  </Accordion>
</AccordionGroup>

## Gateway खोजें (Bonjour)

`gateway discover`, Gateway बीकन (`_openclaw-gw._tcp`) के लिए स्कैन करता है।

- मल्टीकास्ट DNS-SD: `local.`
- यूनिकास्ट DNS-SD (वाइड-एरिया Bonjour): कोई डोमेन चुनें (उदाहरण: `openclaw.internal.`) और स्प्लिट DNS + DNS सर्वर सेट अप करें; [Bonjour](/hi/gateway/bonjour) देखें।

केवल वे Gateway बीकन का विज्ञापन करते हैं जिनमें Bonjour खोज सक्षम है (डिफ़ॉल्ट)।

प्रत्येक बीकन पर TXT संकेत: `role` (Gateway भूमिका संकेत), `transport` (ट्रांसपोर्ट संकेत, जैसे `gateway`), `gatewayPort` (WebSocket पोर्ट, सामान्यतः `18789`), `tailnetDns` (MagicDNS होस्टनाम, उपलब्ध होने पर), `gatewayTls` / `gatewayTlsSha256` (TLS सक्षम + प्रमाणपत्र फ़िंगरप्रिंट)। `sshPort` और `cliPath` केवल पूर्ण खोज मोड में प्रकाशित होते हैं (`discovery.mdns.mode: "full"`; डिफ़ॉल्ट `"minimal"` है, जो इन्हें छोड़ देता है—तब क्लाइंट SSH लक्ष्यों के लिए डिफ़ॉल्ट पोर्ट `22` का उपयोग करते हैं)।

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  प्रति-कमांड टाइमआउट (ब्राउज़/रिज़ॉल्व)।
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
- जब कॉन्फ़िगर किया गया वाइड-एरिया डोमेन सक्षम हो, तो `local.` के साथ उसे भी स्कैन करता है।
- JSON आउटपुट में `wsUrl` हल किए गए सेवा एंडपॉइंट से प्राप्त होता है, केवल-TXT संकेतों जैसे `lanHost` या `tailnetDns` से नहीं।
- `discovery.mdns.mode`, `local.` mDNS और वाइड-एरिया DNS-SD दोनों पर `sshPort`/`cliPath` प्रकाशन नियंत्रित करता है (ऊपर देखें)।

</Note>

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [Gateway रनबुक](/hi/gateway)
