---
read_when:
    - आप चाहते हैं कि OpenClaw किसी क्लाउड VPS पर 24/7 चलता रहे (आपके लैपटॉप पर नहीं)
    - आप अपने स्वयं के VPS पर उत्पादन-स्तरीय, हमेशा चालू रहने वाला Gateway चाहते हैं
    - आप स्थायित्व, बाइनरी और पुनः आरंभ के व्यवहार पर पूर्ण नियंत्रण चाहते हैं
    - आप Hetzner या किसी समान प्रदाता पर Docker में OpenClaw चला रहे हैं
summary: टिकाऊ स्टेट और पहले से शामिल बाइनरी के साथ सस्ते Hetzner VPS (Docker) पर OpenClaw Gateway 24/7 चलाएँ
title: Hetzner
x-i18n:
    generated_at: "2026-07-19T08:55:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8ffebc0ce725fd219d13d0a556940327e70dab810b8fbee0b365c4870dc7109b
    source_path: install/hetzner.md
    workflow: 16
---

Docker का उपयोग करके Hetzner VPS पर टिकाऊ स्थिति, पहले से शामिल बाइनरी और सुरक्षित रीस्टार्ट व्यवहार के साथ एक स्थायी OpenClaw Gateway चलाएँ।

Hetzner की कीमतें बदलती रहती हैं; आवश्यकताओं के अनुरूप सबसे छोटा Debian/Ubuntu VPS चुनें और OOM होने पर उसका आकार बढ़ाएँ।

Gateway को आपके लैपटॉप से SSH पोर्ट फ़ॉरवर्डिंग के माध्यम से एक्सेस किया जा सकता है, या यदि आप फ़ायरवॉल और टोकन स्वयं प्रबंधित करते हैं, तो सीधे पोर्ट सार्वजनिक करके एक्सेस किया जा सकता है।

सुरक्षा मॉडल का स्मरण:

- कंपनी में साझा किए गए एजेंट उचित हैं, जब सभी एक ही विश्वास सीमा में हों और रनटाइम केवल व्यावसायिक उपयोग के लिए हो।
- सख्त पृथक्करण बनाए रखें: समर्पित VPS/रनटाइम + समर्पित खाते; उस होस्ट पर कोई व्यक्तिगत Apple/Google/ब्राउज़र/पासवर्ड-मैनेजर प्रोफ़ाइल न रखें।
- यदि उपयोगकर्ता एक-दूसरे के प्रति प्रतिकूल हों, तो gateway/होस्ट/OS उपयोगकर्ता के आधार पर अलग करें।

[सुरक्षा](/hi/gateway/security) और [VPS होस्टिंग](/hi/vps) देखें।

यह मार्गदर्शिका Hetzner पर Ubuntu या Debian मानकर चलती है। किसी अन्य Linux VPS पर पैकेजों को उसके अनुसार अनुकूलित करें। सामान्य Docker प्रवाह के लिए, [Docker](/hi/install/docker) देखें।

## आपको क्या चाहिए

- रूट एक्सेस वाला Hetzner VPS
- आपके लैपटॉप से SSH एक्सेस
- Docker और Docker Compose
- मॉडल प्रमाणीकरण क्रेडेंशियल
- वैकल्पिक प्रदाता क्रेडेंशियल (WhatsApp QR, Telegram बॉट टोकन, Gmail OAuth)
- लगभग 20 मिनट

## त्वरित तरीका

1. Hetzner VPS का प्रावधान करें
2. Docker इंस्टॉल करें
3. OpenClaw रिपॉज़िटरी क्लोन करें
4. स्थायी होस्ट डायरेक्टरी बनाएँ
5. `.env` और `docker-compose.yml` कॉन्फ़िगर करें
6. आवश्यक बाइनरी को इमेज में शामिल करें
7. `docker compose up -d`
8. स्थिति की स्थायित्व और Gateway एक्सेस सत्यापित करें

<Steps>
  <Step title="VPS का प्रावधान करें">
    Hetzner में Ubuntu या Debian VPS बनाएँ, फिर रूट के रूप में कनेक्ट करें:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    VPS को डिस्पोज़ेबल इन्फ़्रास्ट्रक्चर नहीं, बल्कि स्थिति-संरक्षित इन्फ़्रास्ट्रक्चर मानें।

  </Step>

  <Step title="Docker इंस्टॉल करें (VPS पर)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    सत्यापित करें:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="OpenClaw रिपॉज़िटरी क्लोन करें">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    यह मार्गदर्शिका एक कस्टम इमेज बनाती है, ताकि उसमें शामिल की गई सभी बाइनरी रीस्टार्ट के बाद भी बनी रहें।

  </Step>

  <Step title="स्थायी होस्ट डायरेक्टरी बनाएँ">
    Docker कंटेनर अस्थायी होते हैं; लंबे समय तक रहने वाली सभी स्थिति होस्ट पर रहनी चाहिए।

    ```bash
    mkdir -p /root/.openclaw/workspace

    # कंटेनर उपयोगकर्ता (uid 1000) को स्वामित्व दें:
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="एनवायरनमेंट वेरिएबल कॉन्फ़िगर करें">
    रिपॉज़िटरी रूट में `.env` बनाएँ:

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    स्थायी gateway टोकन को
    `.env` के माध्यम से प्रबंधित करने के लिए `OPENCLAW_GATEWAY_TOKEN` सेट करें; अन्यथा रीस्टार्ट के बाद क्लाइंट पर निर्भर होने से पहले `gateway.auth.token` कॉन्फ़िगर करें। यदि इनमें से कोई भी सेट नहीं है, तो OpenClaw उस स्टार्टअप के लिए केवल रनटाइम वाला टोकन उपयोग करता है। `GOG_KEYRING_PASSWORD` के लिए एक कीरिंग पासवर्ड जनरेट करें:

    ```bash
    openssl rand -hex 32
    ```

    **इस फ़ाइल को कमिट न करें।** इसमें
    `OPENCLAW_GATEWAY_TOKEN` जैसे कंटेनर/रनटाइम एनवायरनमेंट वेरिएबल होते हैं। संग्रहीत प्रदाता OAuth/API-कुंजी प्रमाणीकरण माउंट किए गए
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` में रहता है।

  </Step>

  <Step title="Docker Compose कॉन्फ़िगरेशन">
    `docker-compose.yml` बनाएँ या अपडेट करें:

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # अनुशंसित: VPS पर Gateway को केवल लूपबैक तक सीमित रखें; SSH टनल के माध्यम से एक्सेस करें।
          # इसे सार्वजनिक करने के लिए, `127.0.0.1:` प्रीफ़िक्स हटाएँ और फ़ायरवॉल को उसके अनुसार कॉन्फ़िगर करें।
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` केवल शुरुआती सेटअप की सुविधा के लिए है, वास्तविक gateway कॉन्फ़िगरेशन का विकल्प नहीं। फिर भी अपने डिप्लॉयमेंट के लिए प्रमाणीकरण (`gateway.auth.token` या पासवर्ड) और सुरक्षित बाइंड मोड सेट करें।

  </Step>

  <Step title="साझा Docker VM रनटाइम चरण">
    सामान्य Docker होस्ट प्रवाह के लिए साझा रनटाइम मार्गदर्शिका का पालन करें:

    - [आवश्यक बाइनरी को इमेज में शामिल करें](/hi/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [बिल्ड करें और चलाएँ](/hi/install/docker-vm-runtime#build-and-launch)
    - [क्या कहाँ स्थायी रहता है](/hi/install/docker-vm-runtime#what-persists-where)
    - [अपडेट](/hi/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner-विशिष्ट एक्सेस">
    साझा बिल्ड और लॉन्च चरणों के बाद, टनल खोलें।

    **पूर्वापेक्षा:** सुनिश्चित करें कि आपका VPS sshd कॉन्फ़िगरेशन TCP फ़ॉरवर्डिंग की अनुमति देता है। यदि आपने
    अपना SSH कॉन्फ़िगरेशन सख्त किया है, तो `/etc/ssh/sshd_config` जाँचें और यह सेट करें:

    ```text
    AllowTcpForwarding local
    ```

    `local` आपके लैपटॉप से `ssh -L` स्थानीय फ़ॉरवर्ड की अनुमति देता है, जबकि
    सर्वर से रिमोट फ़ॉरवर्ड को अवरुद्ध करता है। इसे `no` पर सेट करने से टनल इस त्रुटि के साथ विफल हो जाती है:
    `channel 3: open failed: administratively prohibited: open failed`

    TCP फ़ॉरवर्डिंग सक्षम होने की पुष्टि करने के बाद, SSH सेवा
    (`systemctl restart ssh`) रीस्टार्ट करें और अपने लैपटॉप से टनल चलाएँ:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    `http://127.0.0.1:18789/` खोलें और कॉन्फ़िगर किया गया साझा सीक्रेट पेस्ट करें।
    यह मार्गदर्शिका डिफ़ॉल्ट रूप से gateway टोकन का उपयोग करती है; यदि आपने पासवर्ड प्रमाणीकरण अपनाया है,
    तो इसके बजाय अपना कॉन्फ़िगर किया गया पासवर्ड उपयोग करें।

  </Step>
</Steps>

साझा स्थायित्व मानचित्र [Docker VM रनटाइम](/hi/install/docker-vm-runtime#what-persists-where) में उपलब्ध है।

## कोड के रूप में इन्फ़्रास्ट्रक्चर (Terraform)

इन्फ़्रास्ट्रक्चर-ऐज़-कोड कार्यप्रवाह पसंद करने वाली टीमों के लिए, समुदाय द्वारा अनुरक्षित Terraform सेटअप ये सुविधाएँ प्रदान करता है:

- रिमोट स्थिति प्रबंधन के साथ मॉड्यूलर Terraform कॉन्फ़िगरेशन
- cloud-init के माध्यम से स्वचालित प्रावधान
- डिप्लॉयमेंट स्क्रिप्ट (बूटस्ट्रैप, डिप्लॉय, बैकअप/पुनर्स्थापन)
- सुरक्षा सुदृढ़ीकरण (फ़ायरवॉल, UFW, केवल SSH एक्सेस)
- gateway एक्सेस के लिए SSH टनल कॉन्फ़िगरेशन

**रिपॉज़िटरी:**

- इन्फ़्रास्ट्रक्चर: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker कॉन्फ़िगरेशन: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

यह तरीका ऊपर दिए गए Docker सेटअप में पुनरुत्पाद्य डिप्लॉयमेंट, संस्करण-नियंत्रित इन्फ़्रास्ट्रक्चर और स्वचालित आपदा पुनर्प्राप्ति जोड़ता है।

<Note>
समुदाय द्वारा अनुरक्षित। समस्याओं या योगदान के लिए, ऊपर दिए गए रिपॉज़िटरी लिंक देखें।
</Note>

## अगले चरण

- मैसेजिंग चैनल सेट अप करें: [चैनल](/hi/channels)
- Gateway कॉन्फ़िगर करें: [Gateway कॉन्फ़िगरेशन](/hi/gateway/configuration)
- OpenClaw को अद्यतित रखें: [अपडेट करना](/hi/install/updating)

## संबंधित

- [इंस्टॉलेशन अवलोकन](/hi/install)
- [Fly.io](/hi/install/fly)
- [Docker](/hi/install/docker)
- [VPS होस्टिंग](/hi/vps)
