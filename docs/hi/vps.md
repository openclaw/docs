---
read_when:
    - आप Gateway को किसी Linux सर्वर या क्लाउड VPS पर चलाना चाहते हैं
    - आपको होस्टिंग गाइड का एक त्वरित मानचित्र चाहिए
    - आप OpenClaw के लिए सामान्य Linux सर्वर ट्यूनिंग चाहते हैं
sidebarTitle: Linux Server
summary: Linux सर्वर या क्लाउड VPS पर OpenClaw चलाएँ — प्रदाता चयनकर्ता, आर्किटेक्चर और अनुकूलन
title: Linux सर्वर
x-i18n:
    generated_at: "2026-07-16T17:40:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 634a246850ab8b854c2c799688fd368ebed3a02124baa85bf38d5ff6ef8cec64
    source_path: vps.md
    workflow: 16
---

किसी भी Linux सर्वर या क्लाउड VPS पर OpenClaw Gateway चलाएँ। यह पृष्ठ आपको
प्रदाता चुनने में मदद करता है, बताता है कि क्लाउड परिनियोजन कैसे काम करते हैं, और सभी जगह लागू होने वाली सामान्य Linux
ट्यूनिंग को शामिल करता है।

## प्रदाता चुनें

<CardGroup cols={2}>
  <Card title="Azure" href="/hi/install/azure">Linux VM</Card>
  <Card title="DigitalOcean" href="/hi/install/digitalocean">सरल सशुल्क VPS</Card>
  <Card title="exe.dev" href="/hi/install/exe-dev">HTTPS प्रॉक्सी वाला VM</Card>
  <Card title="Fly.io" href="/hi/install/fly">Fly मशीनें</Card>
  <Card title="GCP" href="/hi/install/gcp">Compute Engine</Card>
  <Card title="Hetzner" href="/hi/install/hetzner">Hetzner VPS पर Docker</Card>
  <Card title="Hostinger" href="/hi/install/hostinger">एक-क्लिक सेटअप वाला VPS</Card>
  <Card title="Northflank" href="/hi/install/northflank">एक-क्लिक ब्राउज़र सेटअप</Card>
  <Card title="Oracle Cloud" href="/hi/install/oracle">हमेशा निःशुल्क ARM टियर</Card>
  <Card title="Railway" href="/hi/install/railway">एक-क्लिक ब्राउज़र सेटअप</Card>
  <Card title="Raspberry Pi" href="/hi/install/raspberry-pi">ARM पर स्वयं होस्ट किया गया</Card>
</CardGroup>

**AWS (EC2 / Lightsail / निःशुल्क टियर)** भी अच्छी तरह काम करता है।
समुदाय द्वारा बनाया गया वीडियो मार्गदर्शन यहाँ उपलब्ध है:
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(सामुदायिक संसाधन -- अनुपलब्ध हो सकता है)।

## क्लाउड सेटअप कैसे काम करते हैं

- __**Gateway VPS पर चलता है** और स्थिति + कार्यस्थान का स्वामी होता है।
- आप अपने लैपटॉप या फ़ोन से **नियंत्रण UI** या **Tailscale/SSH** के माध्यम से कनेक्ट करते हैं।
- VPS को प्रामाणिक स्रोत मानें और स्थिति + कार्यस्थान का नियमित रूप से **बैकअप लें**।
- सुरक्षित डिफ़ॉल्ट: Gateway को लूपबैक पर रखें और SSH टनल या Tailscale Serve के माध्यम से उस तक पहुँचें।
  यदि आप `lan` या `tailnet` से बाइंड करते हैं, तो Gateway को साझा सीक्रेट
  (`gateway.auth.token` या `gateway.auth.password`) की आवश्यकता होती है, जब तक कि प्रमाणीकरण किसी
  विश्वसनीय प्रॉक्सी को प्रत्यायोजित न किया गया हो।

संबंधित पृष्ठ: [Gateway की दूरस्थ पहुँच](/hi/gateway/remote), [प्लेटफ़ॉर्म केंद्र](/hi/platforms)।

## पहले व्यवस्थापक पहुँच को सुदृढ़ करें

किसी सार्वजनिक VPS पर OpenClaw स्थापित करने से पहले तय करें कि आप
उस मशीन का प्रशासन कैसे करना चाहते हैं।

- केवल Tailnet के माध्यम से व्यवस्थापक पहुँच के लिए: पहले Tailscale स्थापित करें, VPS को अपने
  टेलनेट से जोड़ें, Tailscale IP या MagicDNS नाम के माध्यम से दूसरा SSH सत्र सत्यापित करें,
  फिर सार्वजनिक SSH को प्रतिबंधित करें।
- Tailscale के बिना: अधिक सेवाएँ उपलब्ध कराने से पहले
  अपने SSH पथ पर समकक्ष सुरक्षा सुदृढ़ीकरण लागू करें।
- यह Gateway पहुँच से अलग है। आप OpenClaw को फिर भी
  लूपबैक से बाइंड रख सकते हैं और डैशबोर्ड के लिए SSH टनल या Tailscale Serve का उपयोग कर सकते हैं।

Tailscale-विशिष्ट Gateway विकल्प [Tailscale](/hi/gateway/tailscale) में उपलब्ध हैं।

## VPS पर कंपनी का साझा एजेंट

किसी टीम के लिए एक एजेंट चलाना तब एक मान्य सेटअप है, जब प्रत्येक उपयोगकर्ता
एक ही विश्वास-सीमा में हो और एजेंट केवल व्यावसायिक उपयोग के लिए हो।

- इसे समर्पित रनटाइम पर रखें (VPS/VM/कंटेनर + समर्पित OS उपयोगकर्ता/खाते)।
- उस रनटाइम को व्यक्तिगत Apple/Google खातों या व्यक्तिगत ब्राउज़र/पासवर्ड-मैनेजर प्रोफ़ाइल में साइन इन न करें।
- यदि उपयोगकर्ता एक-दूसरे के प्रति प्रतिकूल हों, तो उन्हें Gateway/होस्ट/OS उपयोगकर्ता के आधार पर अलग करें।

सुरक्षा मॉडल का विवरण: [सुरक्षा](/hi/gateway/security)।

## VPS के साथ Node का उपयोग

आप Gateway को क्लाउड में रख सकते हैं और अपने स्थानीय डिवाइसों
(Mac/iOS/Android/हेडलेस) पर **Node** जोड़ सकते हैं। Gateway के क्लाउड में बने रहने के दौरान Node स्थानीय स्क्रीन/कैमरा/कैनवास और `system.run`
क्षमताएँ प्रदान करते हैं।

दस्तावेज़: [Node](/hi/nodes), [Node CLI](/hi/cli/nodes)।

## छोटे VM और ARM होस्ट के लिए स्टार्टअप ट्यूनिंग

यदि कम क्षमता वाले VM (या ARM होस्ट) पर CLI कमांड धीमे लगते हैं, तो Node का मॉड्यूल कंपाइल कैश सक्षम करें:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` बार-बार चलाए जाने वाले कमांड के स्टार्टअप समय में सुधार करता है; पहली बार चलाने पर कैश तैयार होता है।
- `OPENCLAW_NO_RESPAWN=1` नियमित Gateway पुनरारंभों को उसी प्रक्रिया में रखता है, जिससे अतिरिक्त प्रक्रिया हस्तांतरण से बचा जाता है और छोटे होस्ट पर PID ट्रैकिंग सरल रहती है।
- Raspberry Pi से संबंधित विवरण के लिए, [Raspberry Pi](/hi/install/raspberry-pi) देखें।

### systemd ट्यूनिंग जाँच-सूची (वैकल्पिक)

`systemd` का उपयोग करने वाले VM होस्ट के लिए, इन पर विचार करें:

- स्थिर स्टार्टअप पथ के लिए सेवा परिवेश: `OPENCLAW_NO_RESPAWN=1` और
  `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- स्पष्ट पुनरारंभ व्यवहार: `Restart=always`, `RestartSec=2`, `TimeoutStartSec=90`
- अनियमित I/O के कारण कोल्ड स्टार्ट पर पड़ने वाले प्रभाव को कम करने के लिए स्थिति/कैश पथों हेतु SSD-समर्थित डिस्क।

मानक `openclaw onboard --install-daemon` पथ एक systemd उपयोगकर्ता
यूनिट स्थापित करता है; इसे इसके माध्यम से संपादित करें:

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

यदि आपने जानबूझकर इसके बजाय सिस्टम यूनिट स्थापित की है, तो उसे
`sudo systemctl edit openclaw-gateway.service` के माध्यम से संपादित करें।

`Restart=` नीतियाँ स्वचालित पुनर्प्राप्ति में कैसे सहायता करती हैं:
[systemd सेवा पुनर्प्राप्ति को स्वचालित कर सकता है](https://www.redhat.com/en/blog/systemd-automate-recovery)।

Linux के OOM व्यवहार, चाइल्ड प्रक्रिया में पीड़ित चयन और `exit 137`
निदान के लिए, [Linux मेमोरी दबाव और OOM किल](/hi/platforms/linux#memory-pressure-and-oom-kills) देखें।

## संबंधित

- [स्थापना का अवलोकन](/hi/install)
- [DigitalOcean](/hi/install/digitalocean)
- [Fly.io](/hi/install/fly)
- [Hetzner](/hi/install/hetzner)
