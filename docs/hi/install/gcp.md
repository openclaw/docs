---
read_when:
    - आप GCP पर OpenClaw को 24/7 चालू रखना चाहते हैं
    - आप अपनी स्वयं की VM पर उत्पादन-स्तरीय, हमेशा चालू रहने वाला Gateway चाहते हैं
    - आप स्थायित्व, बाइनरी और पुनः आरंभ के व्यवहार पर पूर्ण नियंत्रण चाहते हैं
summary: टिकाऊ स्टेट के साथ GCP Compute Engine VM (Docker) पर OpenClaw Gateway को 24/7 चलाएँ
title: GCP
x-i18n:
    generated_at: "2026-07-16T15:35:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6ca46b2ee78731162261cae6ea5a26b718be6035b998fa92e4ee5c9ea2e7ae07
    source_path: install/gcp.md
    workflow: 16
---

स्थायी स्थिति, पहले से शामिल बाइनरी और सुरक्षित रीस्टार्ट व्यवहार के साथ Docker का उपयोग करके GCP Compute Engine VM पर एक स्थायी OpenClaw Gateway चलाएँ।

मूल्य मशीन प्रकार और क्षेत्र के अनुसार अलग-अलग होता है; अपने कार्यभार के लिए उपयुक्त सबसे छोटा VM चुनें और OOM होने पर उसका आकार बढ़ाएँ।

Gateway को आपके लैपटॉप से SSH पोर्ट फ़ॉरवर्डिंग के माध्यम से, या यदि आप फ़ायरवॉल और टोकन स्वयं प्रबंधित करते हैं तो सीधे पोर्ट एक्सपोज़र के माध्यम से एक्सेस किया जा सकता है।

यह गाइड GCP Compute Engine पर Debian का उपयोग करती है। Ubuntu भी काम करता है; पैकेजों को उसके अनुसार मैप करें। सामान्य Docker प्रवाह के लिए, [Docker](/hi/install/docker) देखें।

## आपको क्या चाहिए

- GCP खाता (`e2-micro` निःशुल्क टियर के लिए पात्र है)
- `gcloud` CLI, या [Cloud Console](https://console.cloud.google.com)
- आपके लैपटॉप से SSH एक्सेस
- Docker और Docker Compose
- मॉडल प्रमाणीकरण क्रेडेंशियल
- वैकल्पिक प्रदाता क्रेडेंशियल (WhatsApp QR, Telegram बॉट टोकन, Gmail OAuth)
- लगभग 20-30 मिनट

## त्वरित तरीका

1. एक GCP प्रोजेक्ट बनाएँ, बिलिंग और Compute Engine API सक्षम करें
2. एक Compute Engine VM बनाएँ (`e2-small`, Debian 12, 20GB)
3. VM में SSH करें, Docker इंस्टॉल करें
4. OpenClaw रिपॉज़िटरी क्लोन करें
5. स्थायी होस्ट डायरेक्टरियाँ बनाएँ
6. `.env` और `docker-compose.yml` कॉन्फ़िगर करें
7. आवश्यक बाइनरी इमेज में शामिल करें, बिल्ड करें और लॉन्च करें

<Steps>
  <Step title="gcloud CLI इंस्टॉल करें (या Console का उपयोग करें)">
    [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install) से इंस्टॉल करें, फिर:

    ```bash
    gcloud init
    gcloud auth login
    ```

    या इसके बजाय नीचे दिए गए सभी चरण [Cloud Console](https://console.cloud.google.com) वेब UI के माध्यम से पूरे करें।

  </Step>

  <Step title="GCP प्रोजेक्ट बनाएँ">
    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    gcloud services enable compute.googleapis.com
    ```

    [console.cloud.google.com/billing](https://console.cloud.google.com/billing) पर बिलिंग सक्षम करें (Compute Engine के लिए आवश्यक)।

    Console में समकक्ष प्रक्रिया: IAM & Admin > Create Project, बिलिंग सक्षम करें, फिर APIs & Services > Enable APIs > "Compute Engine API" > Enable।

  </Step>

  <Step title="VM बनाएँ">
    | प्रकार     | विनिर्देश                 | लागत               | टिप्पणियाँ                                      |
    | --------- | ------------------------ | ------------------ | --------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM          | ~$25/माह           | स्थानीय Docker बिल्ड के लिए सबसे विश्वसनीय      |
    | e2-small  | 2 vCPU, 2GB RAM          | ~$12/माह           | Docker बिल्ड के लिए अनुशंसित न्यूनतम            |
    | e2-micro  | 2 vCPU (साझा), 1GB RAM   | निःशुल्क टियर पात्र | Docker बिल्ड OOM (एग्ज़िट 137) के कारण अक्सर विफल |

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

  </Step>

  <Step title="VM में SSH करें">
    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Console: Compute Engine डैशबोर्ड में VM के आगे "SSH" पर क्लिक करें।

    VM बनने के बाद SSH कुंजी के प्रसार में 1-2 मिनट लग सकते हैं; यदि कनेक्शन अस्वीकार हो जाए तो प्रतीक्षा करें और फिर से प्रयास करें।

  </Step>

  <Step title="Docker इंस्टॉल करें (VM पर)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    समूह परिवर्तन प्रभावी करने के लिए लॉग आउट करके फिर से लॉग इन करें, फिर दोबारा SSH करें:

    ```bash
    exit
    ```

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
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

    यह गाइड एक कस्टम इमेज बनाती है, ताकि उसमें शामिल की गई सभी बाइनरी रीस्टार्ट के बाद भी बनी रहें।

  </Step>

  <Step title="स्थायी होस्ट डायरेक्टरियाँ बनाएँ">
    Docker कंटेनर अस्थायी होते हैं; लंबे समय तक बनी रहने वाली सभी स्थिति होस्ट पर होनी चाहिए।

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="एनवायरनमेंट वेरिएबल कॉन्फ़िगर करें">
    रिपॉज़िटरी रूट में `.env` बनाएँ:

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    स्थिर Gateway टोकन को `.env` के माध्यम से प्रबंधित करने के लिए
    `OPENCLAW_GATEWAY_TOKEN` सेट करें; अन्यथा रीस्टार्ट के दौरान क्लाइंट पर निर्भर रहने से पहले
    `gateway.auth.token` कॉन्फ़िगर करें। यदि दोनों में से कोई भी सेट नहीं है, तो OpenClaw
    उस स्टार्टअप के लिए केवल रनटाइम टोकन का उपयोग करता है। `GOG_KEYRING_PASSWORD` के लिए
    कीरिंग पासवर्ड जनरेट करें:

    ```bash
    openssl rand -hex 32
    ```

    **इस फ़ाइल को कमिट न करें।** इसमें `OPENCLAW_GATEWAY_TOKEN` जैसे कंटेनर/रनटाइम
    एनवायरनमेंट वेरिएबल होते हैं। संग्रहीत प्रदाता OAuth/API-कुंजी प्रमाणीकरण
    माउंट किए गए `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` में रहता है।

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
          # अनुशंसित: VM पर Gateway को केवल लूपबैक तक सीमित रखें; SSH टनल के माध्यम से एक्सेस करें।
          # इसे सार्वजनिक रूप से एक्सपोज़ करने के लिए, `127.0.0.1:` प्रीफ़िक्स हटाएँ और फ़ायरवॉल को उसके अनुसार कॉन्फ़िगर करें।
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

    `--allow-unconfigured` केवल प्रारंभिक सेटअप की सुविधा के लिए है, वास्तविक Gateway कॉन्फ़िगरेशन का विकल्प नहीं। अपने डिप्लॉयमेंट के लिए फिर भी प्रमाणीकरण (`gateway.auth.token` या पासवर्ड) और सुरक्षित बाइंड मोड सेट करें।

  </Step>

  <Step title="साझा Docker VM रनटाइम चरण">
    सामान्य Docker होस्ट प्रवाह के लिए साझा रनटाइम गाइड का पालन करें:

    - [आवश्यक बाइनरी इमेज में शामिल करें](/hi/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [बिल्ड और लॉन्च करें](/hi/install/docker-vm-runtime#build-and-launch)
    - [क्या कहाँ स्थायी रहता है](/hi/install/docker-vm-runtime#what-persists-where)
    - [अपडेट](/hi/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP-विशिष्ट लॉन्च टिप्पणियाँ">
    यदि `pnpm install --frozen-lockfile` के दौरान बिल्ड `Killed` या `exit code 137` के साथ विफल हो जाता है, तो VM की मेमोरी समाप्त हो गई है। कम-से-कम `e2-small` का उपयोग करें, या अधिक विश्वसनीय पहले बिल्ड के लिए `e2-medium` का उपयोग करें।

    LAN (`OPENCLAW_GATEWAY_BIND=lan`) से बाइंड करते समय, आगे बढ़ने से पहले एक विश्वसनीय ब्राउज़र ओरिजिन कॉन्फ़िगर करें:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    यदि आपने पोर्ट बदला है, तो `18789` को अपने कॉन्फ़िगर किए गए पोर्ट से बदलें।

  </Step>

  <Step title="अपने लैपटॉप से एक्सेस करें">
    Gateway पोर्ट फ़ॉरवर्ड करने के लिए SSH टनल बनाएँ:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    अपने ब्राउज़र में `http://127.0.0.1:18789/` खोलें।

    साफ़ डैशबोर्ड लिंक फिर से प्रिंट करें:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    यदि UI साझा-सीक्रेट प्रमाणीकरण माँगता है, तो कॉन्फ़िगर किया गया टोकन या
    पासवर्ड Control UI सेटिंग में पेस्ट करें (यह Docker प्रवाह डिफ़ॉल्ट रूप से
    टोकन लिखता है; यदि आपने पासवर्ड प्रमाणीकरण अपनाया है, तो इसके बजाय अपना
    कॉन्फ़िगर किया गया पासवर्ड उपयोग करें)।

    यदि Control UI `unauthorized` या `disconnected (1008): pairing required` दिखाता है, तो ब्राउज़र डिवाइस को स्वीकृति दें:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    साझा स्थायित्व मैप के लिए [Docker VM रनटाइम](/hi/install/docker-vm-runtime#what-persists-where) और [अपडेट प्रवाह](/hi/install/docker-vm-runtime#updates) देखें।

  </Step>
</Steps>

## समस्या निवारण

**SSH कनेक्शन अस्वीकृत**

VM बनने के बाद SSH कुंजी के प्रसार में 1-2 मिनट लग सकते हैं। प्रतीक्षा करें और फिर से प्रयास करें।

**OS Login संबंधी समस्याएँ**

अपनी OS Login प्रोफ़ाइल जाँचें:

```bash
gcloud compute os-login describe-profile
```

सुनिश्चित करें कि आपके खाते के पास आवश्यक IAM अनुमतियाँ (Compute OS Login या Compute OS Admin Login) हैं।

**मेमोरी समाप्त (OOM)**

यदि Docker बिल्ड `Killed` और `exit code 137` के साथ विफल होता है, तो VM को OOM के कारण समाप्त कर दिया गया था:

```bash
# पहले VM रोकें
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# मशीन प्रकार बदलें
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# VM शुरू करें
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

## सेवा खाते (सुरक्षा की सर्वोत्तम प्रथा)

व्यक्तिगत उपयोग के लिए, आपका डिफ़ॉल्ट उपयोगकर्ता खाता ठीक काम करता है। ऑटोमेशन या CI/CD के लिए, न्यूनतम अनुमतियों वाला एक समर्पित सेवा खाता बनाएँ:

```bash
gcloud iam service-accounts create openclaw-deploy \
  --display-name="OpenClaw Deployment"

gcloud projects add-iam-policy-binding my-openclaw-project \
  --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"
```

ऑटोमेशन के लिए Owner भूमिका से बचें; काम करने वाली सबसे सीमित भूमिका का उपयोग करें। [भूमिकाओं को समझना](https://cloud.google.com/iam/docs/understanding-roles) देखें।

## अगले चरण

- मैसेजिंग चैनल सेट अप करें: [चैनल](/hi/channels)
- स्थानीय डिवाइसों को Node के रूप में पेयर करें: [Node](/hi/nodes)
- Gateway कॉन्फ़िगर करें: [Gateway कॉन्फ़िगरेशन](/hi/gateway/configuration)

## संबंधित

- [इंस्टॉलेशन अवलोकन](/hi/install)
- [Azure](/hi/install/azure)
- [VPS होस्टिंग](/hi/vps)
