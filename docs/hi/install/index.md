---
read_when:
    - आपको Getting Started क्विकस्टार्ट के अलावा किसी अन्य इंस्टॉल विधि की आवश्यकता है
    - आप किसी क्लाउड प्लेटफ़ॉर्म पर परिनियोजित करना चाहते हैं
    - आपको अपडेट, माइग्रेट या अनइंस्टॉल करना होगा
summary: OpenClaw इंस्टॉल करें - इंस्टॉलर स्क्रिप्ट, npm/pnpm/bun, स्रोत से, Docker, और बहुत कुछ
title: इंस्टॉल करें
x-i18n:
    generated_at: "2026-07-16T15:37:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dc6c6c33294852c90d2d2904b78ff8b0483b8e72a380d5835c5bdda67547de0c
    source_path: install/index.md
    workflow: 16
---

## सिस्टम आवश्यकताएँ

- **Node 22.22.3+, 24.15+, या 25.9+** - Node 24 डिफ़ॉल्ट लक्ष्य है; इंस्टॉलर स्क्रिप्ट इसे अपने-आप संभालती है।
- **macOS, Linux, या Windows** - Windows उपयोगकर्ता मूल Windows Hub ऐप, PowerShell CLI इंस्टॉलर, या WSL2 Gateway से शुरुआत कर सकते हैं। [Windows](/hi/platforms/windows) देखें।
- `pnpm` की आवश्यकता केवल स्रोत से बिल्ड करने पर होती है।

## अनुशंसित: इंस्टॉलर स्क्रिप्ट

इंस्टॉल करने का सबसे तेज़ तरीका। यह आपके OS का पता लगाता है, आवश्यकता होने पर Node इंस्टॉल करता है, OpenClaw इंस्टॉल करता है, और ऑनबोर्डिंग शुरू करता है।

<Note>
Windows डेस्कटॉप उपयोगकर्ता मूल [Windows Hub](/hi/platforms/windows#recommended-windows-hub) सहायक ऐप भी इंस्टॉल कर सकते हैं, जिसमें सेटअप, ट्रे स्थिति, चैट, नोड मोड, और स्थानीय MCP मोड शामिल हैं।
</Note>

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
</Tabs>

ऑनबोर्डिंग चलाए बिना इंस्टॉल करने के लिए:

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

सभी फ़्लैग और CI/ऑटोमेशन विकल्पों के लिए, [इंस्टॉलर की आंतरिक कार्यप्रणाली](/hi/install/installer) देखें।

## वैकल्पिक इंस्टॉल विधियाँ

### स्थानीय प्रीफ़िक्स इंस्टॉलर (`install-cli.sh`)

इसका उपयोग तब करें, जब आप चाहते हैं कि OpenClaw और Node को
`~/.openclaw` जैसे स्थानीय प्रीफ़िक्स के अंतर्गत रखा जाए और वे पूरे सिस्टम में किए गए Node इंस्टॉल पर निर्भर न हों:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

यह डिफ़ॉल्ट रूप से npm इंस्टॉल के साथ-साथ उसी प्रीफ़िक्स प्रवाह के अंतर्गत
git-checkout इंस्टॉल का भी समर्थन करता है। पूर्ण संदर्भ: [इंस्टॉलर की आंतरिक कार्यप्रणाली](/hi/install/installer#install-clish)।

पहले से इंस्टॉल है? `openclaw update --channel dev` और `openclaw update --channel stable` से पैकेज और git इंस्टॉल के बीच स्विच करें। 
[अपडेट करना](/hi/install/updating#switch-between-npm-and-git-installs) देखें।

### npm, pnpm, या bun

यदि आप पहले से Node को स्वयं प्रबंधित करते हैं:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    होस्ट किया गया इंस्टॉलर OpenClaw पैकेज इंस्टॉल के लिए `min-release-age`
    जैसे npm ताज़गी फ़िल्टर हटा देता है। यदि आप npm से मैन्युअल रूप से इंस्टॉल करते हैं, तो आपकी अपनी
    npm नीति फिर भी लागू होती है।
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm में बिल्ड स्क्रिप्ट वाले पैकेजों के लिए स्पष्ट स्वीकृति आवश्यक है। पहले इंस्टॉल के बाद `pnpm approve-builds -g` चलाएँ।
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun ग्लोबल पैकेज इंस्टॉल कर सकता है, लेकिन इससे बने `openclaw` निष्पादन योग्य को समर्थित Node रनटाइम की आवश्यकता होती है, क्योंकि OpenClaw स्थिति `node:sqlite` का उपयोग करती है।
    </Note>

  </Tab>
</Tabs>

### स्रोत से

योगदानकर्ताओं या स्थानीय चेकआउट से चलाने के इच्छुक किसी भी व्यक्ति के लिए:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

या लिंक को छोड़ दें और रेपो के भीतर से `pnpm openclaw ...` का उपयोग करें। पूर्ण विकास कार्यप्रवाहों के लिए [सेटअप](/hi/start/setup) देखें।

### GitHub के main चेकआउट से इंस्टॉल करें

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### कंटेनर और पैकेज प्रबंधक

<CardGroup cols={2}>
  <Card title="Docker" href="/hi/install/docker" icon="container">
    कंटेनरीकृत या हेडलेस परिनियोजन।
  </Card>
  <Card title="Podman" href="/hi/install/podman" icon="container">
    Docker का रूटलेस कंटेनर विकल्प।
  </Card>
  <Card title="Nix" href="/hi/install/nix" icon="snowflake">
    Nix flake के माध्यम से घोषणात्मक इंस्टॉल।
  </Card>
  <Card title="Ansible" href="/hi/install/ansible" icon="server">
    स्वचालित फ़्लीट प्रावधान।
  </Card>
  <Card title="Bun" href="/hi/install/bun" icon="zap">
    वैकल्पिक निर्भरता इंस्टॉलर और पैकेज-स्क्रिप्ट रनर।
  </Card>
</CardGroup>

## इंस्टॉल सत्यापित करें

```bash
openclaw --version      # पुष्टि करें कि CLI उपलब्ध है
openclaw doctor         # कॉन्फ़िगरेशन समस्याओं की जाँच करें
openclaw gateway status # सत्यापित करें कि Gateway चल रहा है
```

यदि आप इंस्टॉल के बाद प्रबंधित स्टार्टअप चाहते हैं:

- macOS: `openclaw onboard --install-daemon` या `openclaw gateway install` के माध्यम से LaunchAgent
- Linux/WSL2: उन्हीं कमांड के माध्यम से systemd उपयोगकर्ता सेवा
- मूल Windows: पहले Scheduled Task, और कार्य निर्माण अस्वीकृत होने पर प्रति-उपयोगकर्ता Startup-folder लॉगिन आइटम फ़ॉलबैक

## होस्टिंग और परिनियोजन

OpenClaw को क्लाउड सर्वर या VPS पर परिनियोजित करें। पूर्ण
प्रदाता चयनकर्ता (DigitalOcean, Hetzner, Hostinger, Fly.io, GCP, Azure, Railway,
Northflank, Oracle Cloud, Raspberry Pi, और अन्य) के लिए [Linux सर्वर](/hi/vps) देखें, या
[Render](/hi/install/render) पर घोषणात्मक रूप से परिनियोजित करें।

<CardGroup cols={3}>
  <Card title="VPS" href="/hi/vps">
    कोई प्रदाता चुनें।
  </Card>
  <Card title="Docker VM" href="/hi/install/docker-vm-runtime">
    साझा Docker चरण।
  </Card>
  <Card title="Kubernetes" href="/hi/install/kubernetes">
    K8s परिनियोजन।
  </Card>
</CardGroup>

## अपडेट करें, माइग्रेट करें, या अनइंस्टॉल करें

<CardGroup cols={3}>
  <Card title="अपडेट करना" href="/hi/install/updating" icon="refresh-cw">
    OpenClaw को अद्यतित रखें।
  </Card>
  <Card title="माइग्रेट करना" href="/hi/install/migrating" icon="arrow-right">
    नई मशीन पर जाएँ।
  </Card>
  <Card title="अनइंस्टॉल करें" href="/hi/install/uninstall" icon="trash-2">
    OpenClaw को पूरी तरह हटाएँ।
  </Card>
</CardGroup>

## समस्या निवारण: `openclaw` नहीं मिला

यह लगभग हमेशा PATH की समस्या होती है: npm की ग्लोबल bin डायरेक्टरी आपके शेल के `PATH` में नहीं है। Windows पथ सहित पूर्ण समाधान के लिए [Node.js समस्या निवारण](/hi/install/node#troubleshooting) देखें।

```bash
node -v           # क्या Node इंस्टॉल है?
npm prefix -g     # ग्लोबल पैकेज कहाँ हैं?
echo "$PATH"      # क्या ग्लोबल bin डायरेक्टरी PATH में है?
```
