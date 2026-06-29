---
read_when:
    - DigitalOcean पर OpenClaw सेट अप करना
    - OpenClaw के लिए एक सरल भुगतान वाला VPS ढूंढना
summary: DigitalOcean Droplet पर OpenClaw होस्ट करें
title: DigitalOcean
x-i18n:
    generated_at: "2026-06-28T23:19:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2ddfe3e6df5e48616584e912e12eede30a62f869fc307f586c9604c9c06c9e5b
    source_path: install/digitalocean.md
    workflow: 16
---

DigitalOcean Droplet पर एक स्थायी OpenClaw Gateway चलाएं (1 GB Basic प्लान के लिए लगभग $6/माह)।

DigitalOcean सबसे सरल सशुल्क VPS रास्ता है। अगर आप सस्ते या मुफ्त विकल्प पसंद करते हैं:

- [Hetzner](/hi/install/hetzner) — €3.79/माह, प्रति डॉलर अधिक कोर/RAM।
- [Oracle Cloud](/hi/install/oracle) — Always Free ARM (4 OCPU, 24 GB RAM तक), लेकिन साइनअप थोड़ा कठिन हो सकता है और यह केवल ARM है।

## पूर्वापेक्षाएं

- DigitalOcean खाता ([signup](https://cloud.digitalocean.com/registrations/new))
- SSH कुंजी जोड़ी (या पासवर्ड auth उपयोग करने की इच्छा)
- लगभग 20 मिनट

## सेटअप

<Steps>
  <Step title="Droplet बनाएं">
    <Warning>
    साफ बेस इमेज (Ubuntu 24.04 LTS) का उपयोग करें। जब तक आपने उनके स्टार्टअप स्क्रिप्ट और फ़ायरवॉल डिफ़ॉल्ट की समीक्षा न की हो, तृतीय-पक्ष Marketplace 1-click इमेज से बचें।
    </Warning>

    1. [DigitalOcean](https://cloud.digitalocean.com/) में लॉग इन करें।
    2. **Create > Droplets** पर क्लिक करें।
    3. चुनें:
       - **Region:** आपके सबसे नज़दीक
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** SSH कुंजी (अनुशंसित) या पासवर्ड
    4. **Create Droplet** पर क्लिक करें और IP पता नोट करें।

  </Step>

  <Step title="कनेक्ट करें और इंस्टॉल करें">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Install Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Install OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash

    # Create the non-root user that will own OpenClaw state and services.
    adduser openclaw
    usermod -aG sudo openclaw
    loginctl enable-linger openclaw

    su - openclaw
    openclaw --version
    ```

    root shell का उपयोग केवल सिस्टम bootstrap के लिए करें। OpenClaw कमांड non-root `openclaw` उपयोगकर्ता के रूप में चलाएं ताकि state `/home/openclaw/.openclaw/` के अंतर्गत रहे और Gateway उस उपयोगकर्ता की systemd सेवा के रूप में इंस्टॉल हो।

  </Step>

  <Step title="ऑनबोर्डिंग चलाएं">
    ```bash
    openclaw onboard --install-daemon
    ```

    विज़ार्ड आपको model auth, चैनल सेटअप, gateway token generation, और daemon installation (systemd) से गुज़ारता है।

  </Step>

  <Step title="swap जोड़ें (1 GB Droplets के लिए अनुशंसित)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="gateway सत्यापित करें">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Control UI तक पहुंचें">
    gateway डिफ़ॉल्ट रूप से loopback से bind होता है। इनमें से एक विकल्प चुनें।

    **विकल्प A: SSH tunnel (सबसे सरल)**

    ```bash
    # From your local machine
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

    फिर अपने tailnet पर किसी भी डिवाइस से `https://<magicdns>/` खोलें।

    Tailscale Serve, tailnet identity headers के ज़रिए Control UI और WebSocket traffic को authenticate करता है, जो मानता है कि gateway host स्वयं trusted है। HTTP API endpoints, इसके बावजूद, gateway के सामान्य auth mode (token/password) का पालन करते हैं। Serve पर स्पष्ट shared-secret credentials आवश्यक करने के लिए, `gateway.auth.allowTailscale: false` सेट करें और `gateway.auth.mode: "token"` या `"password"` का उपयोग करें।

    **विकल्प C: Tailnet bind (Serve नहीं)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    फिर `http://<tailscale-ip>:18789` खोलें (token आवश्यक)।

  </Step>
</Steps>

## स्थायित्व और backup

OpenClaw state यहां रहता है:

- `~/.openclaw/` — `openclaw.json`, per-agent `auth-profiles.json`, channel/provider state, और session data।
- `~/.openclaw/workspace/` — agent workspace (SOUL.md, memory, artifacts)।

ये Droplet reboot के बाद भी बने रहते हैं। portable snapshot लेने के लिए:

```bash
openclaw backup create
```

DigitalOcean snapshots पूरे Droplet का backup लेते हैं; `openclaw backup create` hosts के बीच portable है।

## 1 GB RAM सुझाव

$6 Droplet में केवल 1 GB RAM है। चीज़ों को सुचारु रखने के लिए:

- सुनिश्चित करें कि ऊपर दिया गया swap step `/etc/fstab` में है, ताकि यह reboots के बाद भी बना रहे।
- स्थानीय models के बजाय API-based models (Claude, GPT) को प्राथमिकता दें — स्थानीय LLM inference 1 GB में फिट नहीं होता।
- अगर बड़े prompts पर OOMs आते हैं तो `agents.defaults.model.primary` को छोटे model पर सेट करें।
- `free -h` और `htop` से monitor करें।

## समस्या निवारण

**Gateway शुरू नहीं होगा** -- `openclaw doctor --non-interactive` चलाएं और `journalctl --user -u openclaw-gateway.service -n 50` से logs जांचें।

**Port पहले से उपयोग में है** -- process ढूंढने के लिए `lsof -i :18789` चलाएं, फिर उसे रोकें।

**Memory कम पड़ रही है** -- `free -h` से सत्यापित करें कि swap active है। अगर फिर भी OOM आ रहा है, तो स्थानीय models के बजाय API-based models (Claude, GPT) का उपयोग करें, या 2 GB Droplet पर upgrade करें।

## अगले कदम

- [Channels](/hi/channels) -- Telegram, WhatsApp, Discord, और अन्य कनेक्ट करें
- [Gateway configuration](/hi/gateway/configuration) -- सभी config options
- [Updating](/hi/install/updating) -- OpenClaw को up to date रखें

## संबंधित

- [Install overview](/hi/install)
- [Fly.io](/hi/install/fly)
- [Hetzner](/hi/install/hetzner)
- [VPS hosting](/hi/vps)
