---
read_when:
    - Raspberry Pi पर OpenClaw सेट करना
    - ARM उपकरणों पर OpenClaw चलाना
    - एक सस्ता हमेशा चालू रहने वाला व्यक्तिगत AI बनाना
summary: हमेशा चालू स्व-होस्टिंग के लिए Raspberry Pi पर OpenClaw होस्ट करें
title: Raspberry Pi
x-i18n:
    generated_at: "2026-06-28T23:23:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9cd90b4cc70c8fe7eab2a0abadc0e2969c7dc1c09657a0819bc004280ec32ba3
    source_path: install/raspberry-pi.md
    workflow: 16
---

Raspberry Pi पर एक लगातार चलने वाला, हमेशा-ऑन OpenClaw Gateway चलाएं। चूंकि Pi सिर्फ Gateway है (मॉडल API के जरिए क्लाउड में चलते हैं), इसलिए साधारण Pi भी वर्कलोड अच्छी तरह संभाल लेता है — सामान्य हार्डवेयर लागत **$35–80 एक बार**, कोई मासिक शुल्क नहीं।

## हार्डवेयर संगतता

| Pi मॉडल     | RAM    | काम करता है? | टिप्पणियां                         |
| ----------- | ------ | ------------- | ---------------------------------- |
| Pi 5        | 4/8 GB | सबसे अच्छा    | सबसे तेज, अनुशंसित।               |
| Pi 4        | 4 GB   | अच्छा         | अधिकांश उपयोगकर्ताओं के लिए सही।  |
| Pi 4        | 2 GB   | ठीक           | swap जोड़ें।                      |
| Pi 4        | 1 GB   | सीमित         | swap और न्यूनतम config के साथ संभव। |
| Pi 3B+      | 1 GB   | धीमा          | काम करता है लेकिन सुस्त है।       |
| Pi Zero 2 W | 512 MB | नहीं          | अनुशंसित नहीं।                    |

**न्यूनतम:** 1 GB RAM, 1 core, 500 MB खाली disk, 64-bit OS।
**अनुशंसित:** 2 GB+ RAM, 16 GB+ SD card (या USB SSD), Ethernet।

## पूर्वापेक्षाएं

- 2 GB+ RAM वाला Raspberry Pi 4 या 5 (4 GB अनुशंसित)
- MicroSD card (16 GB+) या USB SSD (बेहतर प्रदर्शन)
- आधिकारिक Pi power supply
- नेटवर्क कनेक्शन (Ethernet या WiFi)
- 64-bit Raspberry Pi OS (आवश्यक -- 32-bit का उपयोग न करें)
- लगभग 30 मिनट

## सेटअप

<Steps>
  <Step title="OS फ्लैश करें">
    headless server के लिए **Raspberry Pi OS Lite (64-bit)** का उपयोग करें -- desktop की जरूरत नहीं।

    1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/) डाउनलोड करें।
    2. OS चुनें: **Raspberry Pi OS Lite (64-bit)**।
    3. settings dialog में, पहले से config करें:
       - Hostname: `gateway-host`
       - SSH सक्षम करें
       - username और password सेट करें
       - WiFi config करें (यदि Ethernet का उपयोग नहीं कर रहे हैं)
    4. अपने SD card या USB drive पर फ्लैश करें, उसे लगाएं, और Pi को boot करें।

  </Step>

  <Step title="SSH के जरिए connect करें">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="system अपडेट करें">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Set timezone (important for cron and reminders)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Node.js 24 install करें">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="swap जोड़ें (2 GB या उससे कम के लिए महत्वपूर्ण)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Reduce swappiness for low-RAM devices
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="OpenClaw install करें">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="onboarding चलाएं">
    ```bash
    openclaw onboard --install-daemon
    ```

    wizard का पालन करें। headless devices के लिए OAuth की तुलना में API keys अनुशंसित हैं। शुरुआत के लिए Telegram सबसे आसान channel है।

  </Step>

  <Step title="सत्यापित करें">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Control UI तक पहुंचें">
    अपने computer पर, Pi से dashboard URL प्राप्त करें:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    फिर दूसरे terminal में SSH tunnel बनाएं:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    प्रिंट किए गए URL को अपने local browser में खोलें। हमेशा-ऑन remote access के लिए, [Tailscale integration](/hi/gateway/tailscale) देखें।

  </Step>
</Steps>

## प्रदर्शन टिप्स

**USB SSD का उपयोग करें** -- SD cards धीमे होते हैं और घिस जाते हैं। USB SSD प्रदर्शन को बहुत बेहतर बनाता है। [Pi USB boot guide](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) देखें।

**module compile cache सक्षम करें** -- कम-power Pi hosts पर बार-बार CLI चलाने की गति बढ़ाता है:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

`OPENCLAW_NO_RESPAWN=1` नियमित Gateway restarts को in-process रखता है, जिससे अतिरिक्त process handoffs से बचा जाता है और छोटे hosts पर PID tracking सरल रहती है।

**memory usage घटाएं** -- headless setups के लिए, GPU memory खाली करें और unused services disable करें:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**स्थिर restarts के लिए systemd drop-in** -- यदि यह Pi ज्यादातर OpenClaw चला रहा है, तो service drop-in जोड़ें:

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

फिर `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`। headless Pi पर, lingering भी एक बार enable करें ताकि user service logout के बाद भी चलती रहे: `sudo loginctl enable-linger "$(whoami)"`।

## अनुशंसित model setup

चूंकि Pi केवल Gateway चलाता है, cloud-hosted API models का उपयोग करें:

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

Pi पर local LLMs न चलाएं — छोटे models भी उपयोगी होने के लिए बहुत धीमे हैं। model का काम Claude या GPT को करने दें।

## ARM binary notes

अधिकांश OpenClaw features ARM64 पर बिना बदलाव के काम करते हैं (Node.js, Telegram, WhatsApp/Baileys, Chromium)। जिन binaries में कभी-कभी ARM builds नहीं होते, वे आमतौर पर Skills द्वारा भेजे गए वैकल्पिक Go/Rust CLI tools होते हैं। source से build करने से पहले missing binary के release page पर `linux-arm64` / `aarch64` artifacts सत्यापित करें।

## Persistence और backups

OpenClaw state यहां रहता है:

- `~/.openclaw/` — `openclaw.json`, per-agent `auth-profiles.json`, channel/provider state, sessions।
- `~/.openclaw/workspace/` — agent workspace (SOUL.md, memory, artifacts)।

ये reboots के बाद भी बने रहते हैं। portable snapshot लें:

```bash
openclaw backup create
```

यदि आप इन्हें SSD पर रखते हैं, तो SD card की तुलना में performance और longevity दोनों बेहतर होते हैं।

## Troubleshooting

**Memory खत्म होना** -- `free -h` से सत्यापित करें कि swap active है। unused services disable करें (`sudo systemctl disable cups bluetooth avahi-daemon`)। केवल API-based models का उपयोग करें।

**धीमा performance** -- SD card की जगह USB SSD का उपयोग करें। CPU throttling की जांच `vcgencmd get_throttled` से करें (इसे `0x0` लौटाना चाहिए)।

**Service start नहीं होगी** -- logs को `journalctl --user -u openclaw-gateway.service --no-pager -n 100` से जांचें और `openclaw doctor --non-interactive` चलाएं। यदि यह headless Pi है, तो यह भी सत्यापित करें कि lingering enabled है: `sudo loginctl enable-linger "$(whoami)"`।

**ARM binary issues** -- यदि कोई skill "exec format error" के साथ विफल होती है, तो जांचें कि binary का ARM64 build है या नहीं। architecture को `uname -m` से सत्यापित करें (इसे `aarch64` दिखाना चाहिए)।

**WiFi drops** -- WiFi power management disable करें: `sudo iwconfig wlan0 power off`।

## अगले चरण

- [Channels](/hi/channels) -- Telegram, WhatsApp, Discord और अधिक connect करें
- [Gateway configuration](/hi/gateway/configuration) -- सभी config options
- [Updating](/hi/install/updating) -- OpenClaw को up to date रखें

## संबंधित

- [Install overview](/hi/install)
- [Linux server](/hi/vps)
- [Platforms](/hi/platforms)
