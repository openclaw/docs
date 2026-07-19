---
read_when:
    - Raspberry Pi पर OpenClaw सेट अप करना
    - ARM डिवाइसों पर OpenClaw चलाना
    - कम लागत वाला हमेशा सक्रिय निजी AI बनाना
summary: हमेशा चालू रहने वाली स्व-होस्टिंग के लिए OpenClaw को Raspberry Pi पर होस्ट करें
title: Raspberry Pi
x-i18n:
    generated_at: "2026-07-19T08:47:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 60f8f3b23577155658d410993937ebe7c34c21f71c1bd7d9b0c453f15c4aa024
    source_path: install/raspberry-pi.md
    workflow: 16
---

Raspberry Pi पर एक स्थायी, हमेशा चालू रहने वाला OpenClaw Gateway चलाएँ। चूँकि Pi केवल Gateway है (मॉडल API के माध्यम से क्लाउड में चलते हैं), इसलिए सामान्य क्षमता वाला Pi भी कार्यभार को अच्छी तरह सँभाल लेता है -- आम तौर पर हार्डवेयर की लागत **एक बार $35-80** होती है, कोई मासिक शुल्क नहीं।

## हार्डवेयर संगतता

| Pi मॉडल     | RAM    | काम करता है? | टिप्पणियाँ                              |
| ----------- | ------ | ------------ | --------------------------------------- |
| Pi 5        | 4/8 GB | सर्वोत्तम    | सबसे तेज़, अनुशंसित।                   |
| Pi 4        | 4 GB   | अच्छा        | अधिकांश उपयोगकर्ताओं के लिए उपयुक्त।   |
| Pi 4        | 2 GB   | ठीक          | स्वैप जोड़ें।                           |
| Pi 4        | 1 GB   | सीमित        | स्वैप और न्यूनतम कॉन्फ़िगरेशन के साथ संभव। |
| Pi 3B+      | 1 GB   | धीमा         | काम करता है, लेकिन सुस्त है।            |
| Pi Zero 2 W | 512 MB | नहीं         | अनुशंसित नहीं।                          |

**न्यूनतम:** 1 GB RAM, 1 कोर, 500 MB खाली डिस्क, 64-बिट OS।
**अनुशंसित:** 2 GB+ RAM, 16 GB+ SD कार्ड (या USB SSD), ईथरनेट।

## पूर्वापेक्षाएँ

- 2 GB+ RAM वाला Raspberry Pi 4 या 5 (4 GB अनुशंसित)
- MicroSD कार्ड (16 GB+) या USB SSD (बेहतर प्रदर्शन)
- आधिकारिक Pi बिजली आपूर्ति
- नेटवर्क कनेक्शन (ईथरनेट या WiFi)
- 64-बिट Raspberry Pi OS (आवश्यक -- 32-बिट का उपयोग न करें)
- लगभग 30 मिनट

## सेटअप

<Steps>
  <Step title="OS फ़्लैश करें">
    **Raspberry Pi OS Lite (64-बिट)** का उपयोग करें -- हेडलेस सर्वर के लिए डेस्कटॉप की आवश्यकता नहीं है।

    1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/) डाउनलोड करें।
    2. OS चुनें: **Raspberry Pi OS Lite (64-bit)**।
    3. सेटिंग्स संवाद में पहले से कॉन्फ़िगर करें:
       - होस्टनेम: `gateway-host`
       - SSH सक्षम करें
       - उपयोगकर्ता नाम और पासवर्ड सेट करें
       - WiFi कॉन्फ़िगर करें (यदि ईथरनेट का उपयोग नहीं कर रहे हैं)
    4. अपने SD कार्ड या USB ड्राइव पर फ़्लैश करें, उसे लगाएँ और Pi को बूट करें।

  </Step>

  <Step title="SSH के माध्यम से कनेक्ट करें">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="सिस्टम अपडेट करें">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # समय क्षेत्र सेट करें (Cron और रिमाइंडर के लिए महत्वपूर्ण)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Node.js 24 इंस्टॉल करें">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="स्वैप जोड़ें (2 GB या उससे कम के लिए महत्वपूर्ण)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # कम RAM वाले उपकरणों के लिए स्वैपिनेस घटाएँ
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="OpenClaw इंस्टॉल करें">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="ऑनबोर्डिंग चलाएँ">
    ```bash
    openclaw onboard --install-daemon
    ```

    विज़ार्ड का अनुसरण करें। हेडलेस उपकरणों के लिए OAuth की तुलना में API कुंजियाँ अनुशंसित हैं। शुरुआत करने के लिए Telegram सबसे आसान चैनल है।

  </Step>

  <Step title="सत्यापित करें">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Control UI तक पहुँचें">
    अपने कंप्यूटर पर Pi से डैशबोर्ड URL प्राप्त करें:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    फिर किसी अन्य टर्मिनल में SSH टनल बनाएँ:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    प्रिंट किया गया URL अपने स्थानीय ब्राउज़र में खोलें। हमेशा चालू रहने वाली रिमोट पहुँच के लिए, [Tailscale एकीकरण](/hi/gateway/tailscale) देखें।

  </Step>
</Steps>

## प्रदर्शन संबंधी सुझाव

**USB SSD का उपयोग करें** -- SD कार्ड धीमे होते हैं और घिस जाते हैं। USB SSD प्रदर्शन में उल्लेखनीय सुधार करता है और अधिक लेखन चक्रों तक चलता है; यदि आप OS को SD पर रखते हैं, तो `OPENCLAW_STATE_DIR` के लिए इसका उपयोग करें। [Pi USB बूट मार्गदर्शिका](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) देखें।

**मॉड्यूल कंपाइल कैश सक्षम करें** -- कम क्षमता वाले Pi होस्ट पर बार-बार किए जाने वाले CLI आह्वानों को तेज़ करता है। `OPENCLAW_NO_RESPAWN=1` नियमित Gateway पुनरारंभ को उसी प्रक्रिया में रखता है, जिससे अतिरिक्त प्रक्रिया हस्तांतरण से बचा जाता है और छोटे होस्ट पर PID ट्रैकिंग सरल बनी रहती है:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

`/tmp` के बजाय `/var/tmp` का उपयोग करें -- कुछ डिस्ट्रो बूट के समय `/tmp` को साफ़ कर देते हैं, जिससे तैयार कैश हट जाता है।

**मेमोरी उपयोग घटाएँ** -- हेडलेस सेटअप के लिए GPU मेमोरी खाली करें और अप्रयुक्त सेवाएँ अक्षम करें:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**स्थिर पुनरारंभ के लिए systemd ड्रॉप-इन** -- यदि यह Pi मुख्यतः OpenClaw चला रहा है, तो एक सेवा ड्रॉप-इन जोड़ें:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

फिर `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`। हेडलेस Pi पर लिंगरिंग भी एक बार सक्षम करें, ताकि उपयोगकर्ता सेवा लॉगआउट के बाद भी चलती रहे: `sudo loginctl enable-linger "$(whoami)"`।

## अनुशंसित मॉडल सेटअप

चूँकि Pi केवल Gateway चलाता है, इसलिए क्लाउड-होस्टेड API मॉडल का उपयोग करें -- Pi पर स्थानीय LLM न चलाएँ; छोटे मॉडल भी उपयोगी होने के लिए बहुत धीमे होते हैं:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": ["openai/gpt-5.4-mini"]
      }
    }
  }
}
```

## ARM बाइनरी संबंधी टिप्पणियाँ

OpenClaw की अधिकांश सुविधाएँ ARM64 पर बिना किसी बदलाव के काम करती हैं (Node.js, Telegram, WhatsApp/Baileys, Chromium)। जिन बाइनरी के ARM बिल्ड कभी-कभी उपलब्ध नहीं होते, वे आम तौर पर Skills द्वारा प्रदान किए गए वैकल्पिक Go/Rust CLI टूल होते हैं। `uname -m` से आर्किटेक्चर सत्यापित करें (इसमें `aarch64` दिखना चाहिए), फिर स्रोत से बिल्ड करने से पहले अनुपलब्ध बाइनरी के रिलीज़ पृष्ठ पर `linux-arm64` / `aarch64` आर्टिफ़ैक्ट देखें।

## स्थायित्व और बैकअप

OpenClaw की स्थिति यहाँ संग्रहीत होती है:

- `~/.openclaw/` -- `openclaw.json`, प्रति-एजेंट `auth-profiles.json`, चैनल/प्रदाता स्थिति, सत्र।
- `~/.openclaw/workspace/` -- एजेंट कार्यस्थान (SOUL.md, मेमोरी, आर्टिफ़ैक्ट)।

ये रीबूट के बाद भी बने रहते हैं और प्रदर्शन तथा दीर्घायु, दोनों के लिए SD कार्ड की तुलना में SSD से लाभान्वित होते हैं। पोर्टेबल स्नैपशॉट लेने के लिए चलाएँ:

```bash
openclaw backup create
```

## समस्या निवारण

**मेमोरी समाप्त** -- `free -h` से सत्यापित करें कि स्वैप सक्रिय है। अप्रयुक्त सेवाएँ अक्षम करें (`sudo systemctl disable cups bluetooth avahi-daemon`)। केवल API-आधारित मॉडल का उपयोग करें।

**धीमा प्रदर्शन** -- SD कार्ड के बजाय USB SSD का उपयोग करें। `vcgencmd get_throttled` से CPU थ्रॉटलिंग की जाँच करें (इससे `0x0` मिलना चाहिए)।

**सेवा शुरू नहीं होती** -- `journalctl --user -u openclaw-gateway.service --no-pager -n 100` से लॉग जाँचें और `openclaw doctor --non-interactive` चलाएँ। यदि यह हेडलेस Pi है, तो यह भी सत्यापित करें कि लिंगरिंग सक्षम है: `sudo loginctl enable-linger "$(whoami)"`।

**ARM बाइनरी समस्याएँ** -- यदि कोई Skill "exec format error" के साथ विफल होती है, तो जाँचें कि बाइनरी का ARM64 बिल्ड उपलब्ध है या नहीं। `uname -m` से आर्किटेक्चर सत्यापित करें (इसमें `aarch64` दिखना चाहिए)।

**WiFi कनेक्शन टूटता है** -- WiFi पावर प्रबंधन अक्षम करें: `sudo iwconfig wlan0 power off`।

## अगले चरण

- [चैनल](/hi/channels) -- Telegram, WhatsApp, Discord और अन्य से कनेक्ट करें
- [Gateway कॉन्फ़िगरेशन](/hi/gateway/configuration) -- सभी कॉन्फ़िगरेशन विकल्प
- [अपडेट करना](/hi/install/updating) -- OpenClaw को अद्यतित रखें

## संबंधित

- [इंस्टॉलेशन अवलोकन](/hi/install)
- [Linux सर्वर](/hi/vps)
- [प्लेटफ़ॉर्म](/hi/platforms)
