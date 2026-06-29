---
read_when:
    - Oracle Cloud पर OpenClaw सेट अप करना
    - OpenClaw के लिए मुफ़्त VPS होस्टिंग की तलाश
    - छोटे सर्वर पर 24/7 OpenClaw चाहिए
summary: Oracle Cloud के Always Free ARM टियर पर OpenClaw होस्ट करें
title: Oracle Cloud
x-i18n:
    generated_at: "2026-06-28T23:23:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9115c83c7a78b78d8b6701b028a2f6e9f08a71f7fff14b7b45f1610b8052c14e
    source_path: install/oracle.md
    workflow: 16
---

Oracle Cloud के **Always Free** ARM tier (4 OCPU, 24 GB RAM, 200 GB storage तक) पर बिना लागत के एक स्थायी OpenClaw Gateway चलाएँ।

## पूर्वापेक्षाएँ

- Oracle Cloud खाता ([साइन अप](https://www.oracle.com/cloud/free/)) -- अगर समस्याएँ आएँ, तो [समुदाय साइनअप गाइड](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) देखें
- Tailscale खाता ([tailscale.com](https://tailscale.com) पर निःशुल्क)
- एक SSH key pair
- लगभग 30 मिनट

## सेटअप

<Steps>
  <Step title="OCI instance बनाएँ">
    1. [Oracle Cloud Console](https://cloud.oracle.com/) में लॉग इन करें।
    2. **Compute > Instances > Create Instance** पर जाएँ।
    3. कॉन्फ़िगर करें:
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (या 4 तक)
       - **Memory:** 12 GB (या 24 GB तक)
       - **Boot volume:** 50 GB (200 GB तक निःशुल्क)
       - **SSH key:** अपनी public key जोड़ें
    4. **Create** पर क्लिक करें और public IP address नोट करें।

    <Tip>
    अगर instance बनाते समय "Out of capacity" त्रुटि आए, तो कोई दूसरा availability domain आज़माएँ या बाद में फिर कोशिश करें। Free tier क्षमता सीमित है।
    </Tip>

  </Step>

  <Step title="कनेक्ट करें और सिस्टम अपडेट करें">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    कुछ dependencies के ARM compilation के लिए `build-essential` आवश्यक है।

  </Step>

  <Step title="यूज़र और hostname कॉन्फ़िगर करें">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    linger सक्षम करने से logout के बाद भी user services चलती रहती हैं।

  </Step>

  <Step title="Tailscale इंस्टॉल करें">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    अब से Tailscale के ज़रिए कनेक्ट करें: `ssh ubuntu@openclaw`।

  </Step>

  <Step title="OpenClaw इंस्टॉल करें">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    जब "How do you want to hatch your bot?" पूछा जाए, तो **Do this later** चुनें।

  </Step>

  <Step title="Gateway कॉन्फ़िगर करें">
    सुरक्षित remote access के लिए Tailscale Serve के साथ token auth का उपयोग करें।

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    यहाँ `gateway.trustedProxies=["127.0.0.1"]` केवल local Tailscale Serve proxy के forwarded-IP/local-client handling के लिए है। यह `gateway.auth.mode: "trusted-proxy"` **नहीं** है। इस सेटअप में diff viewer routes fail-closed behavior बनाए रखते हैं: forwarded proxy headers के बिना raw `127.0.0.1` viewer requests `Diff not found` लौटा सकती हैं। attachments के लिए `mode=file` / `mode=both` का उपयोग करें, या अगर आपको shareable viewer links चाहिए तो जानबूझकर remote viewers सक्षम करें और `plugins.entries.diffs.config.viewerBaseUrl` सेट करें (या proxy `baseUrl` पास करें)।

  </Step>

  <Step title="VCN security लॉक डाउन करें">
    network edge पर Tailscale को छोड़कर सभी traffic block करें:

    1. OCI Console में **Networking > Virtual Cloud Networks** पर जाएँ।
    2. अपने VCN पर क्लिक करें, फिर **Security Lists > Default Security List** पर जाएँ।
    3. `0.0.0.0/0 UDP 41641` (Tailscale) को छोड़कर सभी ingress rules **हटाएँ**।
    4. default egress rules रखें (सभी outbound अनुमति दें)।

    यह network edge पर port 22 पर SSH, HTTP, HTTPS, और बाकी सब कुछ block करता है। इस बिंदु से आप केवल Tailscale के ज़रिए कनेक्ट कर सकते हैं।

  </Step>

  <Step title="सत्यापित करें">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    अपने tailnet पर किसी भी device से Control UI access करें:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    `<tailnet-name>` को अपने tailnet name से बदलें (`tailscale status` में दिखता है)।

  </Step>
</Steps>

## security posture सत्यापित करें

VCN लॉक डाउन होने (केवल UDP 41641 खुला) और Gateway के loopback से bound होने पर public traffic network edge पर block हो जाता है और admin access केवल tailnet तक सीमित रहता है। इससे कई पारंपरिक VPS hardening steps की आवश्यकता समाप्त हो जाती है:

| पारंपरिक step     | आवश्यक?      | क्यों                                                                     |
| ------------------ | ----------- | ------------------------------------------------------------------------- |
| UFW firewall       | नहीं         | VCN traffic को instance तक पहुँचने से पहले block कर देता है।              |
| fail2ban           | नहीं         | Port 22 VCN पर block है; कोई brute-force surface नहीं।                    |
| sshd hardening     | नहीं         | Tailscale SSH sshd का उपयोग नहीं करता।                                    |
| root login अक्षम करें | नहीं     | Tailscale system users से नहीं, tailnet identity से authenticate करता है। |
| SSH key-only auth  | नहीं         | वही — tailnet identity system SSH keys की जगह लेती है।                   |
| IPv6 hardening     | आमतौर पर नहीं | VCN/subnet settings पर निर्भर करता है; सत्यापित करें कि वास्तव में क्या assigned/exposed है। |

फिर भी अनुशंसित:

- credential file permissions सीमित करने के लिए `chmod 700 ~/.openclaw`।
- OpenClaw-specific posture check के लिए `openclaw security audit`।
- OS patches के लिए नियमित `sudo apt update && sudo apt upgrade`।
- [Tailscale admin console](https://login.tailscale.com/admin) में devices की समय-समय पर समीक्षा करें।

त्वरित verification commands:

```bash
# Confirm no public ports are listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely once Tailscale SSH is confirmed working
sudo systemctl disable --now ssh
```

## ARM नोट्स

Always Free tier ARM (`aarch64`) है। अधिकांश OpenClaw features ठीक काम करते हैं; थोड़ी संख्या में native binaries को ARM builds चाहिए:

- Node.js, Telegram, WhatsApp (Baileys): pure JavaScript, कोई समस्या नहीं।
- native code वाले अधिकांश npm packages: pre-built `linux-arm64` artifacts उपलब्ध।
- वैकल्पिक CLI helpers (जैसे Skills द्वारा shipped Go/Rust binaries): install करने से पहले `aarch64` / `linux-arm64` release देखें।

`uname -m` से architecture सत्यापित करें (इसे `aarch64` print करना चाहिए)। जिन binaries का ARM build नहीं है, उन्हें source से install करें या छोड़ दें।

## Persistence और backups

OpenClaw state यहाँ रहता है:

- `~/.openclaw/` — `openclaw.json`, per-agent `auth-profiles.json`, channel/provider state, और session data।
- `~/.openclaw/workspace/` — agent workspace (SOUL.md, memory, artifacts)।

ये reboots के बाद भी बने रहते हैं। portable snapshot लेने के लिए:

```bash
openclaw backup create
```

## Fallback: SSH tunnel

अगर Tailscale Serve काम नहीं कर रहा है, तो अपनी local machine से SSH tunnel का उपयोग करें:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

फिर `http://localhost:18789` खोलें।

## Troubleshooting

**Instance creation fails ("Out of capacity")** -- Free tier ARM instances लोकप्रिय हैं। कोई दूसरा availability domain आज़माएँ या off-peak hours में फिर कोशिश करें।

**Tailscale connect नहीं होगा** -- फिर से authenticate करने के लिए `sudo tailscale up --ssh --hostname=openclaw --reset` चलाएँ।

**Gateway start नहीं होगा** -- `openclaw doctor --non-interactive` चलाएँ और `journalctl --user -u openclaw-gateway.service -n 50` से logs देखें।

**ARM binary issues** -- अधिकांश npm packages ARM64 पर काम करते हैं। native binaries के लिए `linux-arm64` या `aarch64` releases खोजें। `uname -m` से architecture सत्यापित करें।

## अगले steps

- [चैनल](/hi/channels) -- Telegram, WhatsApp, Discord, और अन्य connect करें
- [Gateway configuration](/hi/gateway/configuration) -- सभी config options
- [Updating](/hi/install/updating) -- OpenClaw को up to date रखें

## संबंधित

- [Install overview](/hi/install)
- [GCP](/hi/install/gcp)
- [VPS hosting](/hi/vps)
