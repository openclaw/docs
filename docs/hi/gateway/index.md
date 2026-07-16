---
read_when:
    - Gateway प्रक्रिया को चलाना या डीबग करना
summary: Gateway सेवा, जीवनचक्र और संचालन के लिए रनबुक
title: Gateway संचालन पुस्तिका
x-i18n:
    generated_at: "2026-07-16T14:54:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d8b50b6041905c321887ea0f579f8d4c3b74552b2b72c37ec655e43a53dfc130
    source_path: gateway/index.md
    workflow: 16
---

इस पृष्ठ का उपयोग Gateway सेवा के पहले दिन के स्टार्टअप और दूसरे दिन के संचालन के लिए करें।

<CardGroup cols={2}>
  <Card title="गहन समस्या निवारण" icon="siren" href="/hi/gateway/troubleshooting">
    सटीक कमांड क्रमों और लॉग सिग्नेचर के साथ लक्षण-प्रथम निदान।
  </Card>
  <Card title="कॉन्फ़िगरेशन" icon="sliders" href="/hi/gateway/configuration">
    कार्य-उन्मुख सेटअप मार्गदर्शिका + पूर्ण कॉन्फ़िगरेशन संदर्भ।
  </Card>
  <Card title="सीक्रेट प्रबंधन" icon="key-round" href="/hi/gateway/secrets">
    SecretRef अनुबंध, रनटाइम स्नैपशॉट व्यवहार और माइग्रेशन/रीलोड संचालन।
  </Card>
  <Card title="सीक्रेट योजना अनुबंध" icon="shield-check" href="/hi/gateway/secrets-plan-contract">
    सटीक `secrets apply` लक्ष्य/पथ नियम और केवल-रेफ़रेंस ऑथ-प्रोफ़ाइल व्यवहार।
  </Card>
</CardGroup>

## 5-मिनट का स्थानीय स्टार्टअप

<Steps>
  <Step title="Gateway शुरू करें">

```bash
openclaw gateway --port 18789
# डीबग/ट्रेस को stdio पर मिरर किया गया
openclaw gateway --port 18789 --verbose
# चयनित पोर्ट पर लिसनर को बलपूर्वक बंद करें, फिर शुरू करें
openclaw gateway --force
```

  </Step>

  <Step title="सेवा की स्थिति सत्यापित करें">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

स्वस्थ आधाररेखा: `Runtime: running`, `Connectivity probe: ok`, और आपकी अपेक्षा से मेल खाने वाली एक `Capability` पंक्ति। केवल पहुँच-क्षमता नहीं, बल्कि रीड-स्कोप RPC प्रमाण के लिए `openclaw gateway status --require-rpc` का उपयोग करें।

  </Step>

  <Step title="चैनल की तत्परता सत्यापित करें">

```bash
openclaw channels status --probe
```

पहुँच योग्य gateway के साथ यह प्रत्येक अकाउंट के लिए लाइव चैनल जाँच और वैकल्पिक ऑडिट चलाता है। यदि gateway तक पहुँचा नहीं जा सकता, तो CLI केवल-कॉन्फ़िगरेशन चैनल सारांश का उपयोग करता है।

  </Step>
</Steps>

<Note>
Gateway कॉन्फ़िगरेशन रीलोड सक्रिय कॉन्फ़िगरेशन फ़ाइल पथ पर नज़र रखता है (प्रोफ़ाइल/स्टेट डिफ़ॉल्ट से निर्धारित, या सेट होने पर `OPENCLAW_CONFIG_PATH`)। डिफ़ॉल्ट मोड `gateway.reload.mode="hybrid"` है। पहली सफल लोडिंग के बाद, चालू प्रक्रिया सक्रिय इन-मेमोरी कॉन्फ़िगरेशन स्नैपशॉट प्रदान करती है; सफल रीलोड उस स्नैपशॉट को परमाण्विक रूप से बदल देता है।
</Note>

## रनटाइम मॉडल

- रूटिंग, कंट्रोल प्लेन और चैनल कनेक्शन के लिए एक हमेशा चालू प्रक्रिया।
- इनके लिए एकल मल्टीप्लेक्स्ड पोर्ट:
  - WebSocket नियंत्रण/RPC
  - HTTP API (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Plugin HTTP रूट, जैसे वैकल्पिक `/api/v1/admin/rpc`
  - कंट्रोल UI और हुक
- डिफ़ॉल्ट बाइंड मोड: `loopback`। पहचाने गए कंटेनर परिवेश में प्रभावी डिफ़ॉल्ट `auto` है (पोर्ट-फ़ॉरवर्डिंग के लिए `0.0.0.0` में निर्धारित होता है), जब तक Tailscale serve/funnel सक्रिय न हो, जो हमेशा `loopback` को बाध्य करता है।
- डिफ़ॉल्ट रूप से प्रमाणीकरण आवश्यक है। साझा-सीक्रेट सेटअप `gateway.auth.token` / `gateway.auth.password` (या `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) का उपयोग करते हैं, और गैर-लूपबैक रिवर्स-प्रॉक्सी सेटअप `gateway.auth.mode: "trusted-proxy"` का उपयोग कर सकते हैं।

## OpenAI-संगत एंडपॉइंट

OpenClaw की सबसे प्रभावशाली संगतता सतह:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

यह समूह क्यों महत्वपूर्ण है:

- अधिकांश Open WebUI, LobeChat और LibreChat एकीकरण पहले `/v1/models` की जाँच करते हैं।
- कई RAG और मेमोरी पाइपलाइन `/v1/embeddings` की अपेक्षा करती हैं।
- एजेंट-मूल क्लाइंट तेज़ी से `/v1/responses` को प्राथमिकता दे रहे हैं।

`/v1/models` एजेंट-प्रथम है: यह प्रत्येक कॉन्फ़िगर किए गए एजेंट के लिए `openclaw`, `openclaw/default` और `openclaw/<agentId>` लौटाता है। `openclaw/default` स्थिर उपनाम है, जो हमेशा कॉन्फ़िगर किए गए डिफ़ॉल्ट एजेंट से मैप होता है। जब आपको बैकएंड प्रदाता/मॉडल ओवरराइड चाहिए, तब `x-openclaw-model` भेजें; अन्यथा चयनित एजेंट का सामान्य मॉडल और एम्बेडिंग सेटअप नियंत्रण में रहता है।

ये सभी मुख्य Gateway पोर्ट पर चलते हैं और शेष Gateway HTTP API के समान विश्वसनीय ऑपरेटर प्रमाणीकरण सीमा का उपयोग करते हैं।

एडमिन HTTP RPC (`POST /api/v1/admin/rpc`) ऐसे होस्ट टूलिंग के लिए एक अलग, डिफ़ॉल्ट रूप से बंद Plugin रूट है, जो WebSocket RPC का उपयोग नहीं कर सकती। [एडमिन HTTP RPC](/hi/plugins/admin-http-rpc) देखें।

### पोर्ट और बाइंड प्राथमिकता

| सेटिंग      | समाधान क्रम                                                     |
| ------------ | -------------------------------------------------------------------- |
| Gateway पोर्ट | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789`        |
| बाइंड मोड    | CLI/ओवरराइड → `gateway.bind` → `loopback` (या कंटेनरों में `auto`) |

इंस्टॉल की गई gateway सेवाएँ निर्धारित `--port` को सुपरवाइज़र मेटाडेटा में रिकॉर्ड करती हैं। `gateway.port` बदलने के बाद, `openclaw doctor --fix` या `openclaw gateway install --force` चलाएँ, ताकि launchd/systemd/schtasks नई पोर्ट पर प्रक्रिया शुरू करे।

गैर-लूपबैक बाइंड के लिए स्थानीय कंट्रोल UI ओरिजिन को सीड करते समय Gateway स्टार्टअप समान प्रभावी पोर्ट और बाइंड का उपयोग करता है। उदाहरण के लिए, रनटाइम सत्यापन चलने से पहले `--bind lan --port 3000`, `http://localhost:3000` और `http://127.0.0.1:3000` को सीड करता है। HTTPS प्रॉक्सी URL जैसे किसी भी दूरस्थ ब्राउज़र ओरिजिन को `gateway.controlUi.allowedOrigins` में स्पष्ट रूप से जोड़ें।

### हॉट रीलोड मोड

| `gateway.reload.mode` | व्यवहार                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | कॉन्फ़िगरेशन रीलोड नहीं                           |
| `hot`                 | केवल हॉट-सुरक्षित परिवर्तन लागू करें                |
| `restart`             | रीलोड-आवश्यक परिवर्तनों पर पुनः शुरू करें         |
| `hybrid` (डिफ़ॉल्ट)    | सुरक्षित होने पर हॉट-अप्लाई करें, आवश्यक होने पर पुनः शुरू करें |

## ऑपरेटर कमांड समूह

```bash
openclaw gateway status
openclaw gateway status --deep   # सिस्टम-स्तरीय सेवा स्कैन जोड़ता है
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` अतिरिक्त सेवा खोज (LaunchDaemons/systemd सिस्टम यूनिट/schtasks) के लिए है, अधिक गहन RPC स्थिति जाँच के लिए नहीं।

## एकाधिक gateway (एक ही होस्ट)

अधिकांश इंस्टॉलेशन में प्रति मशीन एक gateway चलाना चाहिए। एक gateway कई एजेंट और चैनल होस्ट कर सकता है। आपको कई gateway की आवश्यकता केवल तभी है, जब आप जानबूझकर अलगाव या बचाव बॉट चाहते हों।

उपयोगी जाँच:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

क्या अपेक्षित है:

- `gateway status --deep`, `Other gateway-like services detected (best effort)` की रिपोर्ट कर सकता है और पुराने launchd/systemd/schtasks इंस्टॉलेशन अब भी मौजूद होने पर सफ़ाई संकेत दिखा सकता है।
- `gateway probe`, अलग-अलग gateway के उत्तर देने पर, या जब OpenClaw यह सिद्ध नहीं कर पाता कि पहुँच योग्य लक्ष्य एक ही gateway हैं, तब `multiple reachable gateway identities` के बारे में चेतावनी दे सकता है। एक ही gateway के लिए SSH टनल, प्रॉक्सी URL या कॉन्फ़िगर किया गया दूरस्थ URL कई ट्रांसपोर्ट वाला एक gateway है, भले ही ट्रांसपोर्ट पोर्ट अलग हों।
- यदि यह जानबूझकर किया गया है, तो प्रत्येक gateway के पोर्ट, कॉन्फ़िगरेशन/स्टेट और वर्कस्पेस रूट अलग रखें।

प्रत्येक इंस्टेंस की चेकलिस्ट:

- अद्वितीय `gateway.port`
- अद्वितीय `OPENCLAW_CONFIG_PATH`
- अद्वितीय `OPENCLAW_STATE_DIR`
- अद्वितीय `agents.defaults.workspace`

उदाहरण:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

विस्तृत सेटअप: [/gateway/multiple-gateways](/hi/gateway/multiple-gateways)।

## दूरस्थ पहुँच

प्राथमिकता: Tailscale/VPN।
वैकल्पिक: SSH टनल।

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

फिर क्लाइंट को स्थानीय रूप से `ws://127.0.0.1:18789` से कनेक्ट करें।

<Warning>
SSH टनल gateway प्रमाणीकरण को बायपास नहीं करतीं। साझा-सीक्रेट प्रमाणीकरण के लिए, क्लाइंट को टनल के माध्यम से भी
`token`/`password` भेजना आवश्यक है। पहचान-धारक मोड के लिए,
अनुरोध को फिर भी उस प्रमाणीकरण पथ को पूरा करना होगा।
</Warning>

देखें: [दूरस्थ Gateway](/hi/gateway/remote), [प्रमाणीकरण](/hi/gateway/authentication), [Tailscale](/hi/gateway/tailscale)।

## पर्यवेक्षण और सेवा जीवनचक्र

प्रोडक्शन जैसी विश्वसनीयता के लिए पर्यवेक्षित रन का उपयोग करें।

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

पुनः शुरू करने के लिए `openclaw gateway restart` का उपयोग करें। पुनः शुरू करने के विकल्प के रूप में `openclaw gateway stop` और `openclaw gateway start` को क्रमबद्ध रूप से न चलाएँ।

macOS पर, `gateway stop` डिफ़ॉल्ट रूप से `launchctl bootout` का उपयोग करता है। यह स्थायी निष्क्रियता दर्ज किए बिना LaunchAgent को वर्तमान बूट सत्र से हटा देता है, इसलिए अप्रत्याशित क्रैश के बाद भी KeepAlive स्वतः-पुनर्प्राप्ति काम करती रहती है और `gateway start` इसे साफ़ ढंग से पुनः सक्षम करता है। रीबूट के बाद भी स्वतः-पुनः-स्पॉन को स्थायी रूप से रोकने के लिए, `--disable` पास करें: `openclaw gateway stop --disable`।

LaunchAgent लेबल `ai.openclaw.gateway` (डिफ़ॉल्ट) या `ai.openclaw.<profile>` (नामित प्रोफ़ाइल) होते हैं। `openclaw doctor` सेवा कॉन्फ़िगरेशन विचलन का ऑडिट और सुधार करता है।

  </Tab>

  <Tab title="Linux (systemd उपयोगकर्ता)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

लॉगआउट के बाद निरंतरता के लिए, lingering सक्षम करें:

```bash
sudo loginctl enable-linger $(whoami)
```

डेस्कटॉप सत्र के बिना हेडलेस सर्वर पर, `systemctl --user` कमांड फिर से चलाने से पहले यह भी सुनिश्चित करें कि `XDG_RUNTIME_DIR` सेट है (`export XDG_RUNTIME_DIR=/run/user/$(id -u)`)।

जब आपको कस्टम इंस्टॉल पथ चाहिए, तब मैन्युअल उपयोगकर्ता-यूनिट उदाहरण:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (नेटिव)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

नेटिव Windows प्रबंधित स्टार्टअप `OpenClaw Gateway` नामक Scheduled Task का उपयोग करता है
(या नामित प्रोफ़ाइल के लिए `OpenClaw Gateway (<profile>)`)। यदि Scheduled Task
बनाने की अनुमति न मिले, तो OpenClaw प्रति-उपयोगकर्ता Startup-folder लॉन्चर का उपयोग करता है,
जो स्टेट डायरेक्टरी के भीतर `gateway.cmd` की ओर संकेत करता है।

  </Tab>

  <Tab title="Linux (सिस्टम सेवा)">

बहु-उपयोगकर्ता/हमेशा चालू होस्ट के लिए सिस्टम यूनिट का उपयोग करें।

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

उपयोगकर्ता यूनिट के समान सेवा बॉडी का उपयोग करें, लेकिन इसे
`/etc/systemd/system/openclaw-gateway[-<profile>].service` के अंतर्गत इंस्टॉल करें और यदि आपकी `openclaw` बाइनरी कहीं और स्थित है, तो
`ExecStart=` समायोजित करें।

उसी प्रोफ़ाइल/पोर्ट के लिए `openclaw doctor --fix` को उपयोगकर्ता-स्तरीय gateway सेवा भी इंस्टॉल न करने दें। सिस्टम-स्तरीय OpenClaw gateway सेवा मिलने पर Doctor उस स्वचालित इंस्टॉलेशन को अस्वीकार करता है; जब सिस्टम यूनिट जीवनचक्र की स्वामी हो, तब `OPENCLAW_SERVICE_REPAIR_POLICY=external` का उपयोग करें।

  </Tab>
</Tabs>

अमान्य कॉन्फ़िगरेशन त्रुटियाँ कोड `78` के साथ बाहर निकलती हैं। Linux systemd यूनिट कॉन्फ़िगरेशन ठीक होने तक पुनः लॉन्च रोकने के लिए `RestartPreventExitStatus=78` का उपयोग करती हैं। launchd और Windows Task Scheduler में प्रति-एग्ज़िट-कोड रोक का समकक्ष नियम नहीं है, इसलिए Gateway तीव्र अस्वच्छ बूट इतिहास भी बनाए रखता है और बार-बार स्टार्टअप विफलताओं के बाद चैनल/प्रदाता अकाउंट के स्वतः-स्टार्ट को रोक देता है। उस सुरक्षित मोड में कंट्रोल प्लेन निरीक्षण और सुधार के लिए शुरू होता रहता है, कॉन्फ़िगरेशन हॉट रीलोड और `secrets.reload` स्वचालित चैनल पुनः शुरुआत को अस्वीकार करते हैं, और स्पष्ट ऑपरेटर `channels.start` अनुरोध इस रोक को ओवरराइड कर सकता है।

## डेवलपमेंट प्रोफ़ाइल का त्वरित पथ

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

डिफ़ॉल्ट में अलग स्टेट/कॉन्फ़िगरेशन और आधार gateway पोर्ट `19001` शामिल हैं।

## प्रोटोकॉल त्वरित संदर्भ (ऑपरेटर दृष्टिकोण)

- पहला क्लाइंट फ़्रेम `connect` होना चाहिए।
- Gateway एक `hello-ok` फ़्रेम लौटाता है, जिसमें एक `snapshot` (`presence`, `health`, `stateVersion`, `uptimeMs`) के साथ `policy` सीमाएँ (`maxPayload`, `maxBufferedBytes`, `tickIntervalMs`) होती हैं।
- `hello-ok.features.methods` / `events` एक सीमित डिस्कवरी सूची है, प्रत्येक कॉल किए जा सकने वाले
  सहायक रूट का जनरेट किया गया डंप नहीं।
- अनुरोध: `req(method, params)` → `res(ok/payload|error)`।
- सामान्य इवेंट में `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.operation`, `session.tool`, ऑप्ट-इन
  `session.approval`, `sessions.changed`, `presence`, `tick`, `health`,
  `heartbeat`, पेयरिंग/अनुमोदन लाइफ़साइकल इवेंट और `shutdown` शामिल हैं।

एजेंट रन दो चरणों में होते हैं:

1. तत्काल स्वीकृति अभिस्वीकृति (`status:"accepted"`)
2. अंतिम समापन प्रतिक्रिया (`status:"ok"|"error"`), जिनके बीच `agent` इवेंट स्ट्रीम किए जाते हैं।

संपूर्ण प्रोटोकॉल दस्तावेज़ देखें: [Gateway प्रोटोकॉल](/hi/gateway/protocol)।

## परिचालन जाँच

### सक्रियता

- WS खोलें और `connect` भेजें।
- स्नैपशॉट के साथ `hello-ok` प्रतिक्रिया अपेक्षित है।

### तत्परता

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### अंतराल से पुनर्प्राप्ति

इवेंट फिर से नहीं चलाए जाते। अनुक्रम में अंतराल होने पर, आगे बढ़ने से पहले स्थिति (`health`, `system-presence`) रीफ़्रेश करें।

## विफलता के सामान्य संकेत

| संकेत                                                          | संभावित समस्या                                                                  |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | मान्य Gateway प्रमाणीकरण पथ के बिना नॉन-लूपबैक बाइंड                           |
| `another gateway instance is already listening` / `EADDRINUSE` | पोर्ट टकराव                                                                 |
| `Gateway start blocked: set gateway.mode=local`                | कॉन्फ़िगरेशन रिमोट मोड पर सेट है, या क्षतिग्रस्त कॉन्फ़िगरेशन से `gateway.mode` अनुपस्थित है |
| कनेक्ट करते समय `unauthorized`                                  | क्लाइंट और Gateway के बीच प्रमाणीकरण बेमेल                                    |

निदान की संपूर्ण चरणबद्ध प्रक्रियाओं के लिए, [Gateway समस्या-निवारण](/hi/gateway/troubleshooting) का उपयोग करें।

## सुरक्षा की गारंटियाँ

- Gateway उपलब्ध न होने पर Gateway प्रोटोकॉल क्लाइंट तुरंत विफल हो जाते हैं (कोई अंतर्निहित डायरेक्ट-चैनल फ़ॉलबैक नहीं)।
- अमान्य/नॉन-कनेक्ट प्रथम फ़्रेम अस्वीकार करके बंद कर दिए जाते हैं।
- सुचारु शटडाउन सॉकेट बंद होने से पहले `shutdown` इवेंट उत्सर्जित करता है।

## संबंधित

- [कॉन्फ़िगरेशन](/hi/gateway/configuration)
- [Gateway समस्या-निवारण](/hi/gateway/troubleshooting)
- [बैकग्राउंड प्रक्रिया](/hi/gateway/background-process)
- [स्वास्थ्य](/hi/gateway/health)
- [Doctor](/hi/gateway/doctor)
- [प्रमाणीकरण](/hi/gateway/authentication)
- [रिमोट एक्सेस](/hi/gateway/remote)
- [सीक्रेट प्रबंधन](/hi/gateway/secrets)
