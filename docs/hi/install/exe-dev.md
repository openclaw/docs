---
read_when:
    - आप Gateway के लिए एक सस्ता, हमेशा चालू रहने वाला Linux होस्ट चाहते हैं
    - आप अपना VPS चलाए बिना दूरस्थ Control UI एक्सेस चाहते हैं
summary: दूरस्थ पहुँच के लिए exe.dev (VM + HTTPS प्रॉक्सी) पर OpenClaw Gateway चलाएँ
title: exe.dev
x-i18n:
    generated_at: "2026-07-19T09:09:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a768511d2d7e4e4ec10bcdae83684417bde05286468b0534200f8dd5ec015f7b
    source_path: install/exe-dev.md
    workflow: 16
---

**लक्ष्य:** OpenClaw Gateway को [exe.dev](https://exe.dev) VM पर चलाना, जो `https://<vm-name>.exe.xyz` पर उपलब्ध हो।

यह मार्गदर्शिका exe.dev की डिफ़ॉल्ट **exeuntu** इमेज मानकर चलती है। अन्य डिस्ट्रो पर पैकेजों को तदनुसार मैप करें।

## आपको क्या चाहिए

- exe.dev खाता
- exe.dev VM तक `ssh exe.dev` पहुँच (वैकल्पिक, मैन्युअल सेटअप के लिए)

## शुरुआती उपयोगकर्ताओं के लिए त्वरित तरीका

1. [https://exe.new/openclaw](https://exe.new/openclaw) खोलें
2. आवश्यकतानुसार अपनी प्रमाणीकरण कुंजी/टोकन भरें
3. अपने VM के पास "Agent" पर क्लिक करें और Shelley द्वारा प्रोविज़निंग पूरी किए जाने तक प्रतीक्षा करें
4. `https://<vm-name>.exe.xyz/` खोलें और कॉन्फ़िगर किए गए साझा सीक्रेट से प्रमाणित करें (डिफ़ॉल्ट रूप से टोकन प्रमाणीकरण; यदि आप `gateway.auth.mode` बदलते हैं, तो पासवर्ड प्रमाणीकरण भी काम करता है)
5. लंबित डिवाइस पेयरिंग अनुरोधों को `openclaw devices approve <requestId>` से स्वीकृत करें

## Shelley के साथ स्वचालित इंस्टॉलेशन

exe.dev का एजेंट Shelley, प्रॉम्प्ट से OpenClaw इंस्टॉल कर सकता है:

```text
इस VM पर OpenClaw (https://docs.openclaw.ai/install) सेट अप करें। OpenClaw ऑनबोर्डिंग के लिए नॉन-इंटरैक्टिव और accept-risk फ़्लैग का उपयोग करें। आवश्यकतानुसार दी गई प्रमाणीकरण जानकारी या टोकन जोड़ें। nginx को डिफ़ॉल्ट पोर्ट 18789 से डिफ़ॉल्ट रूप से सक्षम साइट कॉन्फ़िगरेशन के रूट लोकेशन पर फ़ॉरवर्ड करने के लिए कॉन्फ़िगर करें और Websocket समर्थन सक्षम करना सुनिश्चित करें। पेयरिंग "openclaw devices list" और "openclaw devices approve <request id>" से की जाती है। सुनिश्चित करें कि डैशबोर्ड पर OpenClaw का स्वास्थ्य ठीक दिखता है। exe.dev हमारे लिए पोर्ट 8000 से पोर्ट 80/443 पर फ़ॉरवर्डिंग और HTTPS संभालता है, इसलिए अंतिम "पहुंच योग्य" पता बिना पोर्ट निर्दिष्ट किए <vm-name>.exe.xyz होना चाहिए।
```

## मैन्युअल इंस्टॉलेशन

<Steps>
  <Step title="VM बनाएँ">
    अपने डिवाइस से:

    ```bash
    ssh exe.dev new
    ```

    फिर कनेक्ट करें:

    ```bash
    ssh <vm-name>.exe.xyz
    ```

    <Tip>
    इस VM को **स्टेटफुल** रखें। OpenClaw, `openclaw.json`, प्रति-एजेंट `auth-profiles.json`, सेशन और चैनल/प्रोवाइडर स्थिति को `~/.openclaw/` के अंतर्गत, तथा वर्कस्पेस को `~/.openclaw/workspace/` के अंतर्गत संग्रहीत करता है।
    </Tip>

  </Step>

  <Step title="पूर्वापेक्षाएँ इंस्टॉल करें (VM पर)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl jq ca-certificates openssl
    ```
  </Step>

  <Step title="OpenClaw इंस्टॉल करें">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="पोर्ट 8000 को प्रॉक्सी करने के लिए nginx कॉन्फ़िगर करें">
    `/etc/nginx/sites-enabled/default` संपादित करें:

    ```nginx
    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        listen 8000;
        listen [::]:8000;

        server_name _;

        location / {
            proxy_pass http://127.0.0.1:18789;
            proxy_http_version 1.1;

            # WebSocket समर्थन
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            # मानक प्रॉक्सी हेडर
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_set_header X-Forwarded-Proto $scheme;

            # लंबे समय तक चलने वाले कनेक्शन के लिए टाइमआउट सेटिंग
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }
    }
    ```

    क्लाइंट द्वारा दी गई चेन को बनाए रखने के बजाय फ़ॉरवर्डिंग हेडर को ओवरराइट करें। OpenClaw केवल स्पष्ट रूप से कॉन्फ़िगर किए गए प्रॉक्सी से फ़ॉरवर्ड किए गए IP मेटाडेटा पर भरोसा करता है, और जोड़ने की शैली वाली `X-Forwarded-For` चेन को सुरक्षा सुदृढ़ीकरण के लिए जोखिम माना जाता है।

  </Step>

  <Step title="OpenClaw तक पहुँचें और डिवाइस स्वीकृत करें">
    `https://<vm-name>.exe.xyz/` खोलें (ऑनबोर्डिंग से मिला Control UI आउटपुट देखें)। यदि यह प्रमाणीकरण माँगे, तो VM से कॉन्फ़िगर किया गया साझा सीक्रेट पेस्ट करें।

    यह मार्गदर्शिका डिफ़ॉल्ट रूप से टोकन प्रमाणीकरण का उपयोग करती है, इसलिए `gateway.auth.token` को `openclaw config get gateway.auth.token` से प्राप्त करें, या `openclaw doctor --n` से नया जनरेट करें। यदि आपने Gateway को पासवर्ड प्रमाणीकरण पर स्विच किया है, तो इसके बजाय `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` का उपयोग करें।

    डिवाइसों को `openclaw devices list` और `openclaw devices approve <requestId>` से स्वीकृत करें। संदेह होने पर अपने ब्राउज़र से Shelley का उपयोग करें।

  </Step>
</Steps>

## रिमोट चैनल सेटअप

रिमोट होस्ट के लिए, `config set` पर कई SSH कॉल के बजाय एक `config patch` कॉल को प्राथमिकता दें। वास्तविक टोकन VM परिवेश या `~/.openclaw/.env` में रखें, और `openclaw.json` में केवल SecretRefs रखें। संपूर्ण SecretRef अनुबंध के लिए [सीक्रेट प्रबंधन](/hi/gateway/secrets) देखें।

VM पर, सेवा परिवेश में उसके लिए आवश्यक सीक्रेट शामिल करें:

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

अपनी स्थानीय मशीन से एक पैच फ़ाइल बनाएँ और उसे VM में पाइप करें:

```json5
// openclaw.remote.patch.json5
{
  secrets: {
    providers: {
      default: { source: "env" },
    },
  },
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --dry-run' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw gateway restart && openclaw health'
```

जब किसी नेस्टेड अनुमति-सूची को ठीक पैच मान के बराबर बनाना हो, तो `--replace-path` का उपयोग करें, उदाहरण के लिए Discord चैनल की अनुमति-सूची को बदलना:

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

चैनल कॉन्फ़िगरेशन के संपूर्ण संदर्भ के लिए [Discord](/hi/channels/discord) और [Slack](/hi/channels/slack) देखें।

## रिमोट पहुँच

exe.dev रिमोट पहुँच के लिए प्रमाणीकरण संभालता है। डिफ़ॉल्ट रूप से, पोर्ट 8000 से HTTP ट्रैफ़िक को ईमेल प्रमाणीकरण के साथ `https://<vm-name>.exe.xyz` पर फ़ॉरवर्ड किया जाता है।

## अपडेट करना

```bash
openclaw update
```

चैनल बदलने और मैन्युअल पुनर्प्राप्ति के लिए [अपडेट करना](/hi/install/updating) देखें।

## संबंधित

- [रिमोट Gateway](/hi/gateway/remote)
- [इंस्टॉलेशन का अवलोकन](/hi/install)
