---
read_when:
    - Windows पर OpenClaw इंस्टॉल करना
    - Windows Hub, नेटिव Windows और WSL2 के बीच चयन करना
    - Windows companion ऐप या Windows node मोड सेट करना
summary: 'Windows समर्थन: Windows Hub, नेटिव CLI और Gateway, WSL2 Gateway सेटअप, Node मोड, और समस्या निवारण'
title: Windows
x-i18n:
    generated_at: "2026-06-28T23:30:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7c7bde33f27bce6c1136ccf688547ee82750d317a997c4a45b354c52ae1b690
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw एक मूल **Windows Hub** सहायक ऐप और Windows CLI समर्थन के साथ आता है।
जब आपको सेटअप, ट्रे स्थिति, चैट, कमांड सेंटर निदान और Windows Node क्षमताओं वाला डेस्कटॉप ऐप चाहिए, तब Windows Hub का उपयोग करें। जब आपको सीधे CLI/Gateway चाहिए, तब PowerShell
इंस्टॉलर का उपयोग करें। जब आपको सबसे अधिक Linux-संगत Gateway runtime चाहिए, तब WSL2 का उपयोग करें।

## अनुशंसित: Windows Hub

Windows Hub, Windows 10 20H2+ और Windows 11 के लिए मूल WinUI सहायक ऐप है। यह प्रशासक अधिकारों के बिना इंस्टॉल होता है और OpenClaw रिलीज़ पर हस्ताक्षरित
x64 और ARM64 इंस्टॉलर के साथ प्रकाशित किया जाता है।

नवीनतम स्थिर इंस्टॉलर [OpenClaw रिलीज़ पेज](https://github.com/openclaw/openclaw/releases) से डाउनलोड करें:

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-arm64.exe)
- [चेकसम](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-SHA256SUMS.txt)

यदि ऊपर दिया गया कोई डाउनलोड लिंक 404 लौटाता है, तो [रिलीज़ पेज](https://github.com/openclaw/openclaw/releases) पर जाएँ और नवीनतम रिलीज़ में `OpenClawCompanion-Setup-*` एसेट खोजें।

इंस्टॉल के बाद, Start मेनू या सिस्टम
ट्रे से **OpenClaw Companion** लॉन्च करें। इंस्टॉलर Gateway Setup, Chat, Settings,
Check for Updates और अनइंस्टॉल के लिए शॉर्टकट भी जोड़ता है।

### Windows Hub में क्या शामिल है

- सिस्टम ट्रे स्थिति और लॉगिन पर लॉन्च
- स्थानीय ऐप-स्वामित्व वाले WSL Gateway के लिए पहली बार का सेटअप
- स्थानीय, रिमोट और SSH-टनल किए गए Gateways के लिए कनेक्शन सेटिंग्स
- मूल चैट विंडो और ब्राउज़र Control UI तक पहुँच
- सेशन, उपयोग, चैनल, Nodes, पेयरिंग और
  मरम्मत कमांड के लिए कमांड सेंटर निदान
- agent-नियंत्रित कैनवास, स्क्रीन, कैमरा, सूचनाएँ,
  डिवाइस स्थिति, टेक्स्ट-टू-स्पीच, स्पीच-टू-टेक्स्ट और नियंत्रित `system.run` के लिए Windows Node मोड
- Claude Desktop, Claude Code और
  Cursor जैसे MCP क्लाइंट के लिए स्थानीय MCP सर्वर मोड

### पहली बार लॉन्च

पहली बार लॉन्च करने पर, यदि कोई उपयोग योग्य सहेजा गया Gateway नहीं है, तो Windows Hub सेटअप खोलता है।
सबसे तेज़ रास्ता **स्थानीय रूप से सेट अप करें** है, जो ऐप-स्वामित्व वाली
`OpenClawGateway` WSL distro तैयार करता है, उसके अंदर Gateway इंस्टॉल करता है और ऐप को पेयर करता है।
यह आपके मौजूदा Ubuntu distro को एक्सपोर्ट या म्यूटेट नहीं करता।

यदि आपके पास पहले से Gateway है, तो **उन्नत सेटअप** चुनें या Connections टैब खोलें।
आप इससे कनेक्ट कर सकते हैं:

- इस PC पर स्थानीय Gateway
- इस PC पर WSL Gateway
- URL और टोकन या सेटअप कोड द्वारा रिमोट Gateway
- SSH टनल के माध्यम से पहुँचा गया Gateway

सेटअप पूरा होने पर, ट्रे आइकन हरा हो जाता है। कनेक्शन, पेयरिंग, Node स्थिति और चैनल स्वास्थ्य की पुष्टि करने के लिए ट्रे से **कमांड सेंटर** खोलें।

## Windows Node मोड

Windows Hub प्रथम-श्रेणी OpenClaw Node के रूप में पंजीकृत हो सकता है। इसके बाद agent Gateway के माध्यम से घोषित Windows-मूल क्षमताओं का उपयोग कर सकता है।

सामान्य कमांड में शामिल हैं:

- `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`,
  `canvas.snapshot`
- `screen.snapshot` और, स्पष्ट ऑप्ट-इन के साथ, `screen.record`
- `camera.list` और, स्पष्ट ऑप्ट-इन के साथ, `camera.snap`, `camera.clip`
- `system.notify`, `system.run`, `system.run.prepare`, `system.which`
- `location.get`, `device.info`, `device.status`
- `stt.transcribe`, `tts.speak`

Node मोड के लिए Gateway पेयरिंग आवश्यक है। यदि ऐप पेयरिंग अनुरोध दिखाता है, तो उसे Gateway होस्ट से स्वीकृत करें:

```powershell
openclaw devices list
openclaw devices approve <request-id>
openclaw nodes status
```

Gateway केवल वही कमांड अग्रेषित करता है जिन्हें Node घोषित करता है और सर्वर नीति अनुमति देती है। `screen.record`, `camera.snap` और
`camera.clip` जैसे गोपनीयता-संवेदनशील कमांड के लिए स्पष्ट `gateway.nodes.allowCommands` ऑप्ट-इन आवश्यक है।

## स्थानीय MCP मोड

Windows Hub उसी Windows-मूल क्षमता registry को loopback पर स्थानीय
MCP सर्वर के रूप में उजागर कर सकता है। यह तब उपयोगी है जब आप स्थानीय MCP क्लाइंट से
चल रहे OpenClaw Gateway के बिना Windows क्षमताएँ चलवाना चाहते हैं।

इसे Windows Hub Settings में developer/advanced सेक्शन के अंतर्गत सक्षम करें। सर्वर सक्षम होने के बाद ऐप
loopback endpoint और bearer token दिखाता है।

मोड मैट्रिक्स:

| Node मोड | MCP सर्वर | व्यवहार                           |
| --------- | ---------- | ---------------------------------- |
| बंद       | बंद        | केवल ऑपरेटर डेस्कटॉप ऐप          |
| चालू        | बंद        | Gateway-कनेक्टेड Windows Node     |
| बंद       | चालू         | केवल स्थानीय MCP सर्वर              |
| चालू        | चालू         | Gateway Node और स्थानीय MCP सर्वर |

## मूल Windows CLI और Gateway

टर्मिनल-प्रथम उपयोग के लिए, PowerShell से OpenClaw इंस्टॉल करें:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

सत्यापित करें:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

मूल Windows CLI और Gateway flow समर्थित हैं और लगातार बेहतर हो रहे हैं।
Managed startup उपलब्ध होने पर Windows Scheduled Tasks का उपयोग करता है। task OpenClaw state dir में
पठनीय `gateway.cmd` script रखता है, लेकिन उसे
जनरेट किए गए `gateway.vbs` WScript wrapper के माध्यम से लॉन्च करता है ताकि पृष्ठभूमि Gateway कोई
दृश्यमान console window न खोले। यदि task creation अस्वीकृत हो जाता है, तो OpenClaw प्रति-उपयोगकर्ता Startup-folder login item पर fallback करता है।

Gateway service इंस्टॉल करने के लिए:

```powershell
openclaw gateway install
openclaw gateway status --json
```

यदि आप managed Gateway service के बिना केवल CLI उपयोग चाहते हैं:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## WSL2 Gateway

WSL2 Windows पर सबसे अधिक Linux-संगत Gateway runtime बना रहता है। Windows Hub
आपके लिए ऐप-स्वामित्व वाला WSL Gateway सेट अप कर सकता है, या आप अपने
distro के अंदर मैन्युअल रूप से इंस्टॉल कर सकते हैं।

मैन्युअल सेटअप:

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

WSL के अंदर systemd सक्षम करें:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

PowerShell से WSL पुनः आरंभ करें:

```powershell
wsl --shutdown
```

फिर Linux quickstart के साथ WSL के अंदर OpenClaw इंस्टॉल करें:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Windows login से पहले Gateway auto-start

Headless WSL setups के लिए, सुनिश्चित करें कि पूर्ण boot chain तब भी चले जब कोई Windows में log in न करे।

WSL के अंदर:

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

PowerShell में Administrator के रूप में:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

`Ubuntu` को अपने distro नाम से बदलें, जो यहाँ से मिलेगा:

```powershell
wsl --list --verbose
```

> **नोट:** पुराने नुस्खों से दो बदलाव:
>
> - **`/bin/true` के बजाय `dbus-launch true`** — WSL ≥ 2.6.1.0 पर एक regression ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416)) के कारण आखिरी client के बाहर निकलने के 15–20 सेकंड बाद distro idle-terminate हो जाता है, भले ही linger सक्षम हो। `dbus-launch true` workaround के रूप में child-of-init process को जीवित रखता है ([समुदाय चर्चा, microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
> - **`/ru SYSTEM` के बजाय `/ru "$env:USERNAME"`** — प्रति-उपयोगकर्ता WSL distros (डिफ़ॉल्ट setup) SYSTEM account को दिखाई नहीं देते; task चलता हुआ प्रतीत होता है लेकिन distro कभी शुरू नहीं होता। अपने account के रूप में चलाने से यह बचता है। task बनाते समय Windows आपका password माँगेगा।

रीबूट के बाद, WSL से सत्यापित करें:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## LAN पर WSL services उजागर करें

WSL का अपना virtual network होता है। यदि किसी दूसरी machine को WSL के अंदर किसी service तक पहुँचना है, तो Windows port को वर्तमान WSL IP पर forward करें। WSL IP restart के बाद बदल सकता है, इसलिए आवश्यकता होने पर forwarding rule refresh करें।

PowerShell में Administrator के रूप में उदाहरण:

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort

New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

नोट्स:

- किसी दूसरी machine से SSH Windows host IP को target करता है, उदाहरण के लिए
  `ssh user@windows-host -p 2222`.
- Remote Nodes को reachable Gateway URL की ओर point करना चाहिए, `127.0.0.1` की ओर नहीं।
- LAN access के लिए `listenaddress=0.0.0.0` का उपयोग करें। केवल local access के लिए `127.0.0.1` का उपयोग करें।

## समस्या निवारण

### ट्रे आइकन दिखाई नहीं देता

Task Manager में `OpenClaw.Tray.WinUI.exe` देखें। यदि यह चल रहा है, तो
hidden tray-icons area खोलें और इसे pin करें। यदि यह नहीं चल रहा है, तो Start menu से **OpenClaw
Companion** लॉन्च करें।

### स्थानीय सेटअप विफल होता है

Windows Hub से setup log खोलें या निरीक्षण करें:

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

सामान्य कारण disabled WSL, blocked virtualization, stale app-owned WSL
state, या Gateway package इंस्टॉल करते समय network failure हैं।

### ऐप कहता है कि पेयरिंग आवश्यक है

Gateway से operator या Node अनुरोध स्वीकृत करें:

```powershell
openclaw devices list
openclaw devices approve <request-id>
```

यदि device के पास पहले से token था, तो approval के बाद Connections tab से reconnect करें।

### Web chat remote Gateway तक नहीं पहुँच सकता

Remote web chat को HTTPS या localhost चाहिए। Self-signed certificates के लिए,
Windows में certificate पर trust करें, या localhost URL के लिए SSH tunnel का उपयोग करें।

### `screen.snapshot`, camera या audio commands विफल होते हैं

Camera, microphone, screen capture और
notifications के लिए Windows permissions की पुष्टि करें। Packaged installs protected capabilities घोषित करते हैं, लेकिन किसी command द्वारा पहली बार उनका उपयोग करने पर Windows फिर भी prompt कर सकता है।

### Git या GitHub connectivity विफल होती है

कुछ networks GitHub तक HTTPS को block या throttle करते हैं। यदि `git clone` या `gh auth
login` विफल होता है, तो दूसरा network, VPN, या HTTP/HTTPS proxy आज़माएँ।

वर्तमान session में token-based `gh` auth के लिए:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

Tokens को कभी commit न करें या उन्हें issues या pull requests में paste न करें।

## संबंधित

- [इंस्टॉल अवलोकन](/hi/install)
- [Node.js setup](/hi/install/node)
- [Nodes](/hi/nodes)
- [Control UI](/hi/web/control-ui)
- [Gateway configuration](/hi/gateway/configuration)
