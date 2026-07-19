---
read_when:
    - Oracle Cloud पर OpenClaw सेट अप करना
    - OpenClaw के लिए मुफ़्त VPS होस्टिंग की तलाश करना
    - छोटे सर्वर पर 24/7 OpenClaw चाहिए
summary: Oracle Cloud के Always Free ARM टियर पर OpenClaw होस्ट करें
title: Oracle Cloud
x-i18n:
    generated_at: "2026-07-19T09:32:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5e1eb95b6bc8ad73e1492a03d8ebe32d89c80e58347614e6ae12d2d3d926d577
    source_path: install/oracle.md
    workflow: 16
---

Oracle Cloud के **Always Free** ARM टियर (अधिकतम 4 OCPU, 24 GB RAM, 200 GB स्टोरेज) पर बिना किसी लागत के एक स्थायी OpenClaw Gateway चलाएँ।

## पूर्वापेक्षाएँ

- Oracle Cloud खाता ([साइन अप](https://www.oracle.com/cloud/free/)) -- समस्याएँ आने पर [समुदाय साइन-अप मार्गदर्शिका](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) देखें
- Tailscale खाता ([tailscale.com](https://tailscale.com) पर निःशुल्क)
- एक SSH कुंजी युग्म
- लगभग 30 मिनट

## सेटअप

<Steps>
  <Step title="OCI इंस्टेंस बनाएँ">
    1. [Oracle Cloud Console](https://cloud.oracle.com/) में लॉग इन करें।
    2. **Compute > Instances > Create Instance** पर जाएँ।
    3. कॉन्फ़िगर करें:
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (या अधिकतम 4)
       - **Memory:** 12 GB (या अधिकतम 24 GB)
       - **Boot volume:** 50 GB (अधिकतम 200 GB निःशुल्क)
       - **SSH key:** अपनी सार्वजनिक कुंजी जोड़ें
    4. **Create** पर क्लिक करें और सार्वजनिक IP पता नोट कर लें।

    <Tip>
    यदि "Out of capacity" के कारण इंस्टेंस बनाना विफल हो जाता है, तो कोई अन्य उपलब्धता डोमेन आज़माएँ या बाद में फिर प्रयास करें। निःशुल्क टियर की क्षमता सीमित है।
    </Tip>

  </Step>

  <Step title="कनेक्ट करें और सिस्टम अपडेट करें">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    कुछ निर्भरताओं के ARM संकलन के लिए `build-essential` आवश्यक है।

  </Step>

  <Step title="उपयोगकर्ता और होस्टनाम कॉन्फ़िगर करें">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    लिंगर सक्षम करने से लॉग आउट करने के बाद भी उपयोगकर्ता सेवाएँ चलती रहती हैं।

  </Step>

  <Step title="Tailscale इंस्टॉल करें">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    अब से Tailscale के माध्यम से कनेक्ट करें: `ssh ubuntu@openclaw`।

  </Step>

  <Step title="OpenClaw इंस्टॉल करें">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    "How do you want to hatch your bot?" पूछे जाने पर **Do this later** चुनें।

  </Step>

  <Step title="Gateway कॉन्फ़िगर करें">
    सुरक्षित रिमोट एक्सेस के लिए Tailscale Serve के साथ टोकन प्रमाणीकरण का उपयोग करें।

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    यहाँ `gateway.trustedProxies=["127.0.0.1"]` केवल स्थानीय Tailscale Serve प्रॉक्सी के फ़ॉरवर्ड किए गए IP/स्थानीय क्लाइंट प्रबंधन के लिए है। यह `gateway.auth.mode: "trusted-proxy"` **नहीं** है। इस सेटअप में डिफ़ व्यूअर रूट फ़ेल-क्लोज़्ड व्यवहार बनाए रखते हैं: फ़ॉरवर्ड किए गए प्रॉक्सी हेडर के बिना कच्चे `127.0.0.1` व्यूअर अनुरोध `Diff not found` लौटाते हैं। अटैचमेंट के लिए `mode=file` / `mode=both` का उपयोग करें, या यदि आपको साझा किए जा सकने वाले व्यूअर लिंक चाहिए, तो जानबूझकर रिमोट व्यूअर सक्षम करें और `plugins.entries.diffs.config.viewerBaseUrl` सेट करें (या प्रॉक्सी `baseUrl` पास करें)।

  </Step>

  <Step title="VCN सुरक्षा को सीमित करें">
    नेटवर्क किनारे पर Tailscale को छोड़कर समस्त ट्रैफ़िक अवरुद्ध करें:

    1. OCI Console में **Networking > Virtual Cloud Networks** पर जाएँ।
    2. अपने VCN पर क्लिक करें, फिर **Security Lists > Default Security List** पर जाएँ।
    3. `0.0.0.0/0 UDP 41641` (Tailscale) को छोड़कर सभी प्रवेश नियम **Remove** करें।
    4. डिफ़ॉल्ट निर्गमन नियम बनाए रखें (सभी आउटबाउंड ट्रैफ़िक की अनुमति दें)।

    यह नेटवर्क किनारे पर पोर्ट 22 का SSH, HTTP, HTTPS और अन्य सभी चीज़ें अवरुद्ध करता है। इसके बाद आप केवल Tailscale के माध्यम से कनेक्ट कर सकते हैं।

  </Step>

  <Step title="सत्यापित करें">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    अपने टेलनेट पर मौजूद किसी भी डिवाइस से नियंत्रण UI एक्सेस करें:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    `<tailnet-name>` को अपने टेलनेट नाम से बदलें (यह `tailscale status` में दिखाई देता है)।

  </Step>
</Steps>

## सुरक्षा स्थिति सत्यापित करें

VCN को सीमित करने (केवल UDP 41641 खुला रखने) और Gateway को लूपबैक से बाँधने पर सार्वजनिक ट्रैफ़िक नेटवर्क किनारे पर अवरुद्ध हो जाता है और व्यवस्थापकीय एक्सेस केवल टेलनेट तक सीमित रहता है। इससे VPS को सुरक्षित बनाने के कई पारंपरिक चरणों की आवश्यकता समाप्त हो जाती है:

| पारंपरिक चरण             | आवश्यक है?     | कारण                                                                       |
| ------------------------ | -------------- | -------------------------------------------------------------------------- |
| UFW फ़ायरवॉल             | नहीं           | VCN ट्रैफ़िक को इंस्टेंस तक पहुँचने से पहले अवरुद्ध कर देता है।             |
| fail2ban                 | नहीं           | पोर्ट 22 VCN पर अवरुद्ध है; ब्रूट-फ़ोर्स के लिए कोई सतह नहीं है।            |
| sshd को सुरक्षित बनाना   | नहीं           | Tailscale SSH, sshd का उपयोग नहीं करता।                                    |
| रूट लॉगिन अक्षम करना     | नहीं           | Tailscale सिस्टम उपयोगकर्ताओं के बजाय टेलनेट पहचान से प्रमाणीकरण करता है।   |
| केवल SSH कुंजी प्रमाणीकरण | नहीं           | वही कारण -- टेलनेट पहचान सिस्टम SSH कुंजियों का स्थान लेती है।             |
| IPv6 को सुरक्षित बनाना   | सामान्यतः नहीं | VCN/सबनेट सेटिंग पर निर्भर करता है; सत्यापित करें कि वास्तव में क्या असाइन/उजागर किया गया है। |

फिर भी अनुशंसित:

- क्रेडेंशियल फ़ाइल की अनुमतियाँ सीमित करने के लिए `chmod 700 ~/.openclaw`।
- OpenClaw-विशिष्ट सुरक्षा स्थिति जाँच के लिए `openclaw security audit`।
- OS पैच के लिए नियमित रूप से `sudo apt update && sudo apt upgrade`।
- [Tailscale एडमिन कंसोल](https://login.tailscale.com/admin) में डिवाइसों की समय-समय पर समीक्षा करें।

त्वरित सत्यापन कमांड:

```bash
# पुष्टि करें कि कोई सार्वजनिक पोर्ट सुन नहीं रहा है
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# सत्यापित करें कि Tailscale SSH सक्रिय है
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH सक्रिय है"

# वैकल्पिक: Tailscale SSH के काम करने की पुष्टि होने के बाद sshd को पूरी तरह अक्षम करें
sudo systemctl disable --now ssh
```

## ARM संबंधी टिप्पणियाँ

Always Free टियर ARM (`aarch64`) है। OpenClaw की अधिकांश सुविधाएँ ठीक से काम करती हैं; कुछ नेटिव बाइनरी को ARM बिल्ड की आवश्यकता होती है:

- Node.js, Telegram, WhatsApp (Baileys): पूर्णतः JavaScript, कोई समस्या नहीं।
- नेटिव कोड वाले अधिकांश npm पैकेज: पूर्व-निर्मित `linux-arm64` आर्टिफ़ैक्ट उपलब्ध हैं।
- वैकल्पिक CLI सहायक (उदाहरण के लिए, Skills द्वारा प्रदान की गई Go/Rust बाइनरी): इंस्टॉल करने से पहले `aarch64` / `linux-arm64` रिलीज़ की जाँच करें।

`uname -m` से आर्किटेक्चर सत्यापित करें (इसे `aarch64` प्रिंट करना चाहिए)। जिन बाइनरी का ARM बिल्ड उपलब्ध नहीं है, उन्हें स्रोत से इंस्टॉल करें या छोड़ दें।

## स्थायित्व और बैकअप

OpenClaw की स्थिति यहाँ रहती है:

- `~/.openclaw/` -- `openclaw.json`, प्रति-एजेंट `auth-profiles.json`, चैनल/प्रदाता स्थिति और सत्र डेटा।
- `~/.openclaw/workspace/` -- एजेंट कार्यस्थान (SOUL.md, मेमोरी, आर्टिफ़ैक्ट)।

ये रीबूट के बाद भी बने रहते हैं। पोर्टेबल स्नैपशॉट लेने के लिए:

```bash
openclaw backup create
```

## फ़ॉलबैक: SSH टनल

यदि Tailscale Serve काम नहीं कर रहा है, तो अपनी स्थानीय मशीन से SSH टनल का उपयोग करें:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

फिर `http://localhost:18789` खोलें।

## समस्या निवारण

**इंस्टेंस बनाना विफल होता है ("Out of capacity")** -- निःशुल्क टियर के ARM इंस्टेंस लोकप्रिय हैं। कोई अन्य उपलब्धता डोमेन आज़माएँ या कम व्यस्त समय में फिर प्रयास करें।

**Tailscale कनेक्ट नहीं होता** -- पुनः प्रमाणीकरण के लिए `sudo tailscale up --ssh --hostname=openclaw --reset` चलाएँ।

**Gateway प्रारंभ नहीं होता** -- `openclaw doctor --non-interactive` चलाएँ और `journalctl --user -u openclaw-gateway.service -n 50` से लॉग जाँचें।

**ARM बाइनरी संबंधी समस्याएँ** -- अधिकांश npm पैकेज ARM64 पर काम करते हैं। नेटिव बाइनरी के लिए `linux-arm64` या `aarch64` रिलीज़ खोजें। `uname -m` से आर्किटेक्चर सत्यापित करें।

## अगले चरण

- [चैनल](/hi/channels) -- Telegram, WhatsApp, Discord और अन्य सेवाएँ कनेक्ट करें
- [Gateway कॉन्फ़िगरेशन](/hi/gateway/configuration) -- सभी कॉन्फ़िगरेशन विकल्प
- [अपडेट करना](/hi/install/updating) -- OpenClaw को अद्यतित रखें

## संबंधित

- [इंस्टॉल अवलोकन](/hi/install)
- [GCP](/hi/install/gcp)
- [VPS होस्टिंग](/hi/vps)
