---
read_when:
    - DigitalOcean पर OpenClaw सेट अप करना
    - OpenClaw के लिए एक सरल सशुल्क VPS की तलाश है
summary: DigitalOcean Droplet पर OpenClaw होस्ट करें
title: DigitalOcean
x-i18n:
    generated_at: "2026-07-19T08:46:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e124a59c079efda0c8e880018f2657fad784af1489ca3f98ed8ab609249e35bd
    source_path: install/digitalocean.md
    workflow: 16
---

DigitalOcean Droplet पर एक स्थायी OpenClaw Gateway चलाएँ (1 GB Basic प्लान के लिए लगभग $6/माह)।

DigitalOcean एक सरल सशुल्क VPS विकल्प है। सस्ते या निःशुल्क विकल्पों के लिए:

- [Hetzner](/hi/install/hetzner) -- प्रति डॉलर अधिक कोर/RAM।
- [Oracle Cloud](/hi/install/oracle) -- Always Free ARM टियर (अधिकतम 4 OCPU, 24 GB RAM), लेकिन साइनअप में परेशानी हो सकती है और यह केवल ARM के लिए है।

## पूर्वापेक्षाएँ

- DigitalOcean खाता ([साइनअप](https://cloud.digitalocean.com/registrations/new))
- SSH कुंजी युग्म (या पासवर्ड प्रमाणीकरण का उपयोग करने की सहमति)
- लगभग 20 मिनट

## सेटअप

<Steps>
  <Step title="Droplet बनाएँ">
    <Warning>
    एक साफ़ बेस इमेज (Ubuntu 24.04 LTS) का उपयोग करें। तृतीय-पक्ष Marketplace 1-क्लिक इमेज से बचें, जब तक कि आपने उनकी स्टार्टअप स्क्रिप्ट और फ़ायरवॉल डिफ़ॉल्ट की समीक्षा न कर ली हो।
    </Warning>

    1. [DigitalOcean](https://cloud.digitalocean.com/) में लॉग इन करें।
    2. **Create > Droplets** पर क्लिक करें।
    3. चुनें:
       - **Region:** आपके सबसे निकट
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** SSH key (अनुशंसित) या password
    4. **Create Droplet** पर क्लिक करें और IP पता नोट कर लें।

  </Step>

  <Step title="कनेक्ट करें और इंस्टॉल करें">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Node.js 24 इंस्टॉल करें
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # OpenClaw इंस्टॉल करें
    curl -fsSL https://openclaw.ai/install.sh | bash

    # वह गैर-रूट उपयोगकर्ता बनाएँ जिसके स्वामित्व में OpenClaw की स्थिति और सेवाएँ होंगी।
    adduser openclaw
    usermod -aG sudo openclaw
    loginctl enable-linger openclaw

    su - openclaw
    openclaw --version
    ```

    रूट शेल का उपयोग केवल सिस्टम बूटस्ट्रैप के लिए करें। OpenClaw कमांड गैर-रूट `openclaw` उपयोगकर्ता के रूप में चलाएँ, ताकि स्थिति `/home/openclaw/.openclaw/` के अंतर्गत रहे और Gateway उस उपयोगकर्ता की systemd `--user` सेवा के रूप में इंस्टॉल हो।

  </Step>

  <Step title="ऑनबोर्डिंग चलाएँ">
    ```bash
    openclaw onboard --install-daemon
    ```

    विज़ार्ड आपको मॉडल प्रमाणीकरण, चैनल सेटअप, Gateway टोकन जनरेशन और डेमन इंस्टॉलेशन (systemd उपयोगकर्ता सेवा) की प्रक्रिया से गुज़ारता है।

  </Step>

  <Step title="स्वैप जोड़ें (1 GB Droplets के लिए अनुशंसित)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Gateway सत्यापित करें">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Control UI एक्सेस करें">
    Gateway डिफ़ॉल्ट रूप से लूपबैक से बाइंड होता है। इनमें से कोई एक विकल्प चुनें।

    **विकल्प A: SSH टनल (सबसे सरल)**

    ```bash
    # अपनी स्थानीय मशीन से
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    फिर `http://localhost:18789` खोलें।

    **विकल्प B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sudo sh
    sudo tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    फिर अपने टेलनेट पर किसी भी डिवाइस से `https://<magicdns>/` खोलें।

    Tailscale Serve टेलनेट पहचान हेडर के माध्यम से Control UI और WebSocket ट्रैफ़िक को प्रमाणित करता है, जिसमें यह माना जाता है कि Gateway होस्ट स्वयं विश्वसनीय है। इसके बावजूद HTTP API एंडपॉइंट Gateway के सामान्य प्रमाणीकरण मोड (टोकन/पासवर्ड) का पालन करते हैं। Serve पर स्पष्ट साझा-गुप्त क्रेडेंशियल आवश्यक बनाने के लिए, `gateway.auth.allowTailscale: false` सेट करें और `gateway.auth.mode: "token"` या `"password"` का उपयोग करें।

    **विकल्प C: टेलनेट बाइंड (Serve के बिना)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    फिर `http://<tailscale-ip>:18789` खोलें (टोकन आवश्यक है)।

  </Step>
</Steps>

## स्थायित्व और बैकअप

OpenClaw की स्थिति यहाँ रहती है:

- `~/.openclaw/` -- `openclaw.json`, चैनल/प्रदाता क्रेडेंशियल, प्रति-एजेंट `auth-profiles.json`, और सत्र डेटा।
- `~/.openclaw/workspace/` -- एजेंट वर्कस्पेस (SOUL.md, मेमोरी, आर्टिफ़ैक्ट)।

ये Droplet रीबूट के बाद भी बने रहते हैं। पोर्टेबल स्नैपशॉट लेने के लिए:

```bash
openclaw backup create
```

DigitalOcean स्नैपशॉट पूरे Droplet का बैकअप लेते हैं; `openclaw backup create` को अलग-अलग होस्ट पर पोर्ट किया जा सकता है।

## 1 GB RAM के लिए सुझाव

$6 वाले Droplet में केवल 1 GB RAM है। सुचारू संचालन के लिए:

- सुनिश्चित करें कि ऊपर दिया गया स्वैप चरण `/etc/fstab` में हो, ताकि वह रीबूट के बाद भी बना रहे।
- स्थानीय मॉडल के बजाय API-आधारित मॉडल (Claude, GPT) को प्राथमिकता दें -- स्थानीय LLM इनफ़रेंस 1 GB में फ़िट नहीं होता।
- यदि बड़े प्रॉम्प्ट पर OOM त्रुटियाँ आती हैं, तो `agents.defaults.model.primary` को किसी छोटे मॉडल पर सेट करें।
- `free -h` और `htop` से निगरानी करें।

## समस्या निवारण

**Gateway शुरू नहीं होता** -- `openclaw doctor --non-interactive` चलाएँ और `journalctl --user -u openclaw-gateway.service -n 50` से लॉग जाँचें।

**पोर्ट पहले से उपयोग में है** -- प्रक्रिया खोजने के लिए `lsof -i :18789` चलाएँ, फिर उसे रोकें।

**मेमोरी समाप्त** -- `free -h` से सत्यापित करें कि स्वैप सक्रिय है। यदि फिर भी OOM त्रुटियाँ आती हैं, तो स्थानीय मॉडल के बजाय API-आधारित मॉडल (Claude, GPT) पर स्विच करें या 2 GB Droplet में अपग्रेड करें।

## अगले चरण

- [चैनल](/hi/channels) -- Telegram, WhatsApp, Discord और अन्य सेवाएँ कनेक्ट करें
- [Gateway कॉन्फ़िगरेशन](/hi/gateway/configuration) -- सभी कॉन्फ़िगरेशन विकल्प
- [अपडेट करना](/hi/install/updating) -- OpenClaw को अद्यतित रखें

## संबंधित

- [इंस्टॉलेशन अवलोकन](/hi/install)
- [Fly.io](/hi/install/fly)
- [Hetzner](/hi/install/hetzner)
- [VPS होस्टिंग](/hi/vps)
