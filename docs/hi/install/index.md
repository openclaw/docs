---
read_when:
    - आपको आरंभ करना त्वरित प्रारंभ से अलग किसी इंस्टॉल विधि की आवश्यकता है
    - आप क्लाउड प्लेटफ़ॉर्म पर डिप्लॉय करना चाहते हैं
    - आपको अपडेट, माइग्रेट या अनइंस्टॉल करने की आवश्यकता है
summary: OpenClaw इंस्टॉल करें - इंस्टॉलर स्क्रिप्ट, npm/pnpm/bun, स्रोत से, Docker, और भी बहुत कुछ
title: इंस्टॉल करें
x-i18n:
    generated_at: "2026-06-28T23:21:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8c6108cecea3e38a6f714758fe4de9b01eebe1c89f9ff68251685c440e8a41f
    source_path: install/index.md
    workflow: 16
---

## सिस्टम आवश्यकताएँ

- **Node 24** (अनुशंसित) या Node 22.19+ - इंस्टॉलर स्क्रिप्ट इसे अपने आप संभालती है
- **macOS, Linux, या Windows** - Windows उपयोगकर्ता नेटिव Windows Hub ऐप, PowerShell CLI इंस्टॉलर, या WSL2 Gateway से शुरू कर सकते हैं। देखें [Windows](/hi/platforms/windows)।
- `pnpm` की ज़रूरत केवल तब होती है जब आप स्रोत से बिल्ड करते हैं

## अनुशंसित: इंस्टॉलर स्क्रिप्ट

इंस्टॉल करने का सबसे तेज़ तरीका। यह आपका OS पहचानता है, ज़रूरत होने पर Node इंस्टॉल करता है, OpenClaw इंस्टॉल करता है, और ऑनबोर्डिंग शुरू करता है।

<Note>
Windows डेस्कटॉप उपयोगकर्ता नेटिव [Windows Hub](/hi/platforms/windows#recommended-windows-hub) companion ऐप भी इंस्टॉल कर सकते हैं, जिसमें सेटअप, ट्रे स्टेटस, चैट, Node मोड, और local MCP मोड शामिल हैं।
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

सभी फ़्लैग और CI/ऑटोमेशन विकल्पों के लिए, देखें [इंस्टॉलर आंतरिक विवरण](/hi/install/installer)।

## वैकल्पिक इंस्टॉल विधियाँ

### लोकल प्रीफ़िक्स इंस्टॉलर (`install-cli.sh`)

इसे तब उपयोग करें जब आप चाहते हों कि OpenClaw और Node किसी लोकल प्रीफ़िक्स, जैसे
`~/.openclaw`, के तहत रहें, बिना सिस्टम-वाइड Node इंस्टॉल पर निर्भर हुए:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

यह डिफ़ॉल्ट रूप से npm इंस्टॉल का समर्थन करता है, साथ ही उसी
प्रीफ़िक्स फ़्लो के तहत git-checkout इंस्टॉल का भी। पूरा संदर्भ: [इंस्टॉलर आंतरिक विवरण](/hi/install/installer#install-clish)।

पहले से इंस्टॉल है? पैकेज और git इंस्टॉल के बीच स्विच करें
`openclaw update --channel dev` और `openclaw update --channel stable` के साथ। देखें
[अपडेट करना](/hi/install/updating#switch-between-npm-and-git-installs)।

### npm, pnpm, या bun

यदि आप पहले से Node स्वयं मैनेज करते हैं:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    होस्टेड इंस्टॉलर OpenClaw पैकेज इंस्टॉल के लिए `min-release-age` जैसे npm freshness फ़िल्टर साफ़ करता है। यदि आप npm से मैन्युअल रूप से इंस्टॉल करते हैं, तो आपकी अपनी
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
    pnpm को build scripts वाले पैकेजों के लिए स्पष्ट स्वीकृति की आवश्यकता होती है। पहले इंस्टॉल के बाद `pnpm approve-builds -g` चलाएँ।
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun ग्लोबल CLI इंस्टॉल पथ के लिए समर्थित है। Gateway runtime के लिए, Node अनुशंसित daemon runtime बना रहता है।
    </Note>

  </Tab>
</Tabs>

### स्रोत से

योगदानकर्ताओं या उन सभी के लिए जो लोकल checkout से चलाना चाहते हैं:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

या link छोड़ें और repo के अंदर से `pnpm openclaw ...` उपयोग करें। पूर्ण विकास workflows के लिए देखें [सेटअप](/hi/start/setup)।

### GitHub main checkout से इंस्टॉल करें

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### कंटेनर और पैकेज मैनेजर

<CardGroup cols={2}>
  <Card title="Docker" href="/hi/install/docker" icon="container">
    कंटेनराइज़्ड या headless deployments।
  </Card>
  <Card title="Podman" href="/hi/install/podman" icon="container">
    Docker का rootless कंटेनर विकल्प।
  </Card>
  <Card title="Nix" href="/hi/install/nix" icon="snowflake">
    Nix flake के ज़रिए घोषणात्मक इंस्टॉल।
  </Card>
  <Card title="Ansible" href="/hi/install/ansible" icon="server">
    स्वचालित fleet provisioning।
  </Card>
  <Card title="Bun" href="/hi/install/bun" icon="zap">
    Bun runtime के ज़रिए केवल-CLI उपयोग।
  </Card>
</CardGroup>

## इंस्टॉल सत्यापित करें

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

यदि आप इंस्टॉल के बाद managed startup चाहते हैं:

- macOS: `openclaw onboard --install-daemon` या `openclaw gateway install` के ज़रिए LaunchAgent
- Linux/WSL2: उन्हीं commands के ज़रिए systemd user service
- नेटिव Windows: पहले Scheduled Task, और यदि task बनाना अस्वीकार हो जाए तो प्रति-उपयोगकर्ता Startup-folder login item fallback

## होस्टिंग और deployment

OpenClaw को cloud server या VPS पर deploy करें:

<CardGroup cols={3}>
  <Card title="VPS" href="/hi/vps">
    कोई भी Linux VPS।
  </Card>
  <Card title="Docker VM" href="/hi/install/docker-vm-runtime">
    साझा Docker चरण।
  </Card>
  <Card title="Kubernetes" href="/hi/install/kubernetes">
    K8s deployment।
  </Card>
  <Card title="Fly.io" href="/hi/install/fly">
    Fly.io पर deploy करें।
  </Card>
  <Card title="Hetzner" href="/hi/install/hetzner">
    Hetzner deployment।
  </Card>
  <Card title="GCP" href="/hi/install/gcp">
    Google Cloud deployment।
  </Card>
  <Card title="Azure" href="/hi/install/azure">
    Azure deployment।
  </Card>
  <Card title="Railway" href="/hi/install/railway">
    Railway deployment।
  </Card>
  <Card title="Render" href="/hi/install/render">
    Render deployment।
  </Card>
  <Card title="Northflank" href="/hi/install/northflank">
    Northflank deployment।
  </Card>
</CardGroup>

## अपडेट, migrate, या uninstall करें

<CardGroup cols={3}>
  <Card title="Updating" href="/hi/install/updating" icon="refresh-cw">
    OpenClaw को अद्यतित रखें।
  </Card>
  <Card title="Migrating" href="/hi/install/migrating" icon="arrow-right">
    नई मशीन पर जाएँ।
  </Card>
  <Card title="Uninstall" href="/hi/install/uninstall" icon="trash-2">
    OpenClaw को पूरी तरह हटाएँ।
  </Card>
</CardGroup>

## समस्या निवारण: `openclaw` नहीं मिला

यदि इंस्टॉल सफल रहा लेकिन आपके terminal में `openclaw` नहीं मिला:

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```

यदि `$(npm prefix -g)/bin` आपके `$PATH` में नहीं है, तो इसे अपनी shell startup file (`~/.zshrc` या `~/.bashrc`) में जोड़ें:

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

फिर नया terminal खोलें। अधिक विवरण के लिए देखें [Node सेटअप](/hi/install/node)।
