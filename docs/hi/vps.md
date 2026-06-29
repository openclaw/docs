---
read_when:
    - आप Gateway को Linux सर्वर या क्लाउड VPS पर चलाना चाहते हैं
    - आपको होस्टिंग गाइड का एक त्वरित मानचित्र चाहिए
    - आप OpenClaw के लिए सामान्य Linux सर्वर ट्यूनिंग चाहते हैं
sidebarTitle: Linux Server
summary: Linux सर्वर या क्लाउड VPS पर OpenClaw चलाएं — प्रदाता चयनकर्ता, आर्किटेक्चर, और ट्यूनिंग
title: Linux सर्वर
x-i18n:
    generated_at: "2026-06-29T00:26:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d32ca9cd62e99b340827f086602922eae3731d9b6cb42b1fd629917d604c549b
    source_path: vps.md
    workflow: 16
---

OpenClaw Gateway को किसी भी Linux सर्वर या क्लाउड VPS पर चलाएँ। यह पेज आपको
प्रदाता चुनने में मदद करता है, बताता है कि क्लाउड डिप्लॉयमेंट कैसे काम करते हैं, और हर जगह लागू होने वाली सामान्य Linux
ट्यूनिंग को कवर करता है।

## प्रदाता चुनें

<CardGroup cols={2}>
  <Card title="Railway" href="/hi/install/railway">एक-क्लिक, ब्राउज़र सेटअप</Card>
  <Card title="Northflank" href="/hi/install/northflank">एक-क्लिक, ब्राउज़र सेटअप</Card>
  <Card title="DigitalOcean" href="/hi/install/digitalocean">सरल भुगतान वाला VPS</Card>
  <Card title="Oracle Cloud" href="/hi/install/oracle">हमेशा मुफ़्त ARM टियर</Card>
  <Card title="Fly.io" href="/hi/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/hi/install/hetzner">Hetzner VPS पर Docker</Card>
  <Card title="Hostinger" href="/hi/install/hostinger">एक-क्लिक सेटअप वाला VPS</Card>
  <Card title="GCP" href="/hi/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/hi/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/hi/install/exe-dev">HTTPS प्रॉक्सी वाला VM</Card>
  <Card title="Raspberry Pi" href="/hi/install/raspberry-pi">ARM स्व-होस्टेड</Card>
</CardGroup>

**AWS (EC2 / Lightsail / फ़्री टियर)** भी अच्छी तरह काम करता है।
एक समुदाय वीडियो वॉकथ्रू यहाँ उपलब्ध है
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(समुदाय संसाधन -- अनुपलब्ध हो सकता है)।

## क्लाउड सेटअप कैसे काम करते हैं

- **Gateway VPS पर चलता है** और state + workspace का स्वामी होता है।
- आप अपने लैपटॉप या फ़ोन से **Control UI** या **Tailscale/SSH** के ज़रिए कनेक्ट करते हैं।
- VPS को सत्य का स्रोत मानें और state + workspace का नियमित रूप से **बैकअप** लें।
- सुरक्षित डिफ़ॉल्ट: Gateway को loopback पर रखें और SSH टनल या Tailscale Serve के ज़रिए उसे एक्सेस करें।
  अगर आप `lan` या `tailnet` से बाइंड करते हैं, तो `gateway.auth.token` या `gateway.auth.password` आवश्यक करें।

संबंधित पेज: [Gateway रिमोट एक्सेस](/hi/gateway/remote), [प्लेटफ़ॉर्म हब](/hi/platforms)।

## पहले admin access को मजबूत करें

किसी सार्वजनिक VPS पर OpenClaw इंस्टॉल करने से पहले, तय करें कि आप
बॉक्स को स्वयं कैसे प्रशासित करना चाहते हैं।

- अगर आप केवल Tailnet वाला admin access चाहते हैं, तो पहले Tailscale इंस्टॉल करें, VPS को
  अपने tailnet से जोड़ें, Tailscale IP या MagicDNS नाम पर दूसरी SSH session सत्यापित करें,
  फिर सार्वजनिक SSH को प्रतिबंधित करें।
- अगर आप Tailscale का उपयोग नहीं कर रहे हैं, तो अधिक सेवाएँ उजागर करने से पहले अपने SSH
  पथ के लिए समकक्ष hardening लागू करें।
- यह Gateway access से अलग है। आप अभी भी OpenClaw को loopback से बंधा रख सकते हैं
  और dashboard के लिए SSH टनल या Tailscale Serve का उपयोग कर सकते हैं।

Tailscale-विशिष्ट Gateway विकल्प [Tailscale](/hi/gateway/tailscale) में हैं।

## VPS पर साझा company agent

किसी टीम के लिए एकल agent चलाना तब वैध सेटअप है जब हर उपयोगकर्ता समान trust boundary में हो और agent केवल business के लिए हो।

- इसे dedicated runtime पर रखें (VPS/VM/container + dedicated OS user/accounts)।
- उस runtime को personal Apple/Google accounts या personal browser/password-manager profiles में sign in न करें।
- अगर उपयोगकर्ता एक-दूसरे के प्रति adversarial हैं, तो gateway/host/OS user के आधार पर अलग करें।

Security model विवरण: [Security](/hi/gateway/security)।

## VPS के साथ nodes का उपयोग

आप Gateway को cloud में रख सकते हैं और अपने local devices
(Mac/iOS/Android/headless) पर **nodes** के साथ pair कर सकते हैं। Nodes local screen/camera/canvas और `system.run`
क्षमताएँ प्रदान करते हैं, जबकि Gateway cloud में रहता है।

Docs: [Nodes](/hi/nodes), [Nodes CLI](/hi/cli/nodes)।

## छोटे VMs और ARM hosts के लिए startup tuning

अगर कम-शक्ति वाले VMs (या ARM hosts) पर CLI commands धीमे लगते हैं, तो Node का module compile cache enable करें:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` बार-बार command startup times को बेहतर बनाता है।
- `OPENCLAW_NO_RESPAWN=1` routine Gateway restarts को in-process रखता है, जिससे extra process handoffs बचते हैं और छोटे hosts पर PID tracking सरल रहती है।
- पहला command run cache को warm करता है; बाद के runs तेज़ होते हैं।
- Raspberry Pi की विशेष जानकारी के लिए, [Raspberry Pi](/hi/install/raspberry-pi) देखें।

### systemd tuning checklist (वैकल्पिक)

`systemd` उपयोग करने वाले VM hosts के लिए, विचार करें:

- स्थिर startup path के लिए service env जोड़ें:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- restart behavior को स्पष्ट रखें:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- state/cache paths के लिए SSD-backed disks को प्राथमिकता दें, ताकि random-I/O cold-start penalties कम हों।

मानक `openclaw onboard --install-daemon` path के लिए, user unit edit करें:

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

अगर आपने जानबूझकर system unit इंस्टॉल किया है, तो इसके बजाय
`sudo systemctl edit openclaw-gateway.service` के ज़रिए `openclaw-gateway.service` edit करें।

`Restart=` policies automated recovery में कैसे मदद करती हैं:
[systemd service recovery को automate कर सकता है](https://www.redhat.com/en/blog/systemd-automate-recovery)।

Linux OOM behavior, child process victim selection, और `exit 137`
diagnostics के लिए, [Linux memory pressure and OOM kills](/hi/platforms/linux#memory-pressure-and-oom-kills) देखें।

## संबंधित

- [Install overview](/hi/install)
- [DigitalOcean](/hi/install/digitalocean)
- [Fly.io](/hi/install/fly)
- [Hetzner](/hi/install/hetzner)
