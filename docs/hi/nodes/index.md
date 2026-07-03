---
read_when:
    - iOS/Android नोड्स को Gateway से पेयर करना
    - एजेंट संदर्भ के लिए नोड कैनवास/कैमरा का उपयोग
    - नए node कमांड या CLI हेल्पर जोड़ना
summary: 'नोड्स: कैनवास/कैमरा/स्क्रीन/डिवाइस/सूचनाओं/सिस्टम के लिए पेयरिंग, क्षमताएं, अनुमतियां, और CLI हेल्पर'
title: Node
x-i18n:
    generated_at: "2026-07-03T09:37:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7096a2600063465ac0bfca359fa1551cb8ca2ab28b095e32a7893669448d36aa
    source_path: nodes/index.md
    workflow: 16
---

एक **Node** एक companion डिवाइस (macOS/iOS/Android/headless) है जो `role: "node"` के साथ Gateway **WebSocket** (ऑपरेटरों वाले ही पोर्ट) से जुड़ता है और `node.invoke` के ज़रिए कमांड सतह (जैसे `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) उपलब्ध कराता है। प्रोटोकॉल विवरण: [Gateway प्रोटोकॉल](/hi/gateway/protocol).

पुराना ट्रांसपोर्ट: [Bridge प्रोटोकॉल](/hi/gateway/bridge-protocol) (TCP JSONL;
मौजूदा Nodes के लिए केवल ऐतिहासिक).

macOS **Node मोड** में भी चल सकता है: menubar ऐप Gateway के
WS सर्वर से जुड़ता है और अपने स्थानीय canvas/camera कमांड्स को Node के रूप में उपलब्ध कराता है (ताकि
`openclaw nodes …` इस Mac के विरुद्ध काम करे)। रिमोट gateway मोड में, ब्राउज़र
ऑटोमेशन CLI Node होस्ट (`openclaw node run` या
इंस्टॉल की गई Node सर्विस) संभालता है, native ऐप Node नहीं।

नोट्स:

- Nodes **peripherals** हैं, gateways नहीं। वे gateway सर्विस नहीं चलाते।
- Telegram/WhatsApp/आदि संदेश **gateway** पर आते हैं, Nodes पर नहीं।
- समस्या-निवारण runbook: [/nodes/troubleshooting](/hi/nodes/troubleshooting)

## Pairing + स्थिति

**WS Nodes डिवाइस pairing का उपयोग करते हैं।** Nodes `connect` के दौरान डिवाइस पहचान प्रस्तुत करते हैं; Gateway
`role: node` के लिए डिवाइस pairing अनुरोध बनाता है। devices CLI (या UI) के ज़रिए मंज़ूरी दें।

त्वरित CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

यदि कोई Node बदले हुए auth विवरण (role/scopes/public key) के साथ दोबारा प्रयास करता है, तो पिछला
pending अनुरोध प्रतिस्थापित हो जाता है और नया `requestId` बनाया जाता है। मंज़ूरी देने से पहले
`openclaw devices list` फिर चलाएँ।

नोट्स:

- `nodes status` किसी Node को **paired** के रूप में चिह्नित करता है जब उसकी डिवाइस pairing role में `node` शामिल हो।
- डिवाइस pairing रिकॉर्ड टिकाऊ approved-role अनुबंध है। Token
  rotation उसी अनुबंध के अंदर रहता है; यह किसी paired Node को ऐसी
  अलग role में अपग्रेड नहीं कर सकता जिसकी pairing मंज़ूरी कभी दी ही नहीं गई।
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) एक अलग gateway-owned
  Node pairing store है; यह WS `connect` handshake को gate **नहीं** करता।
- `openclaw nodes remove --node <id|name|ip>` किसी Node pairing को हटाता है। किसी
  device-backed Node के लिए यह `devices/paired.json` में डिवाइस की `node` role को रद्द करता है
  और उस डिवाइस के node-role sessions को disconnect करता है — mixed-role डिवाइस अपनी
  row रखता है और केवल `node` role खोता है, जबकि node-only डिवाइस row
  हटा दी जाती है। यह अलग gateway-owned Node
  pairing store से कोई मिलती-जुलती entry भी साफ़ करता है। `operator.pairing` non-operator Node rows हटा सकता है; किसी
  mixed-role डिवाइस पर अपनी ही Node role रद्द करने वाले device-token caller को
  अतिरिक्त रूप से `operator.admin` चाहिए।
- Approval scope pending अनुरोध के घोषित commands का अनुसरण करता है:
  - commandless अनुरोध: `operator.pairing`
  - non-exec Node commands: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## रिमोट Node होस्ट (system.run)

जब आपका Gateway एक मशीन पर चलता है और आप commands को
दूसरी मशीन पर execute कराना चाहते हैं, तो **Node होस्ट** का उपयोग करें। मॉडल फिर भी **gateway** से बात करता है; `host=node` चुने जाने पर gateway
`exec` calls को **Node होस्ट** पर forward करता है।

### क्या कहाँ चलता है

- **Gateway होस्ट**: संदेश प्राप्त करता है, मॉडल चलाता है, tool calls route करता है।
- **Node होस्ट**: Node मशीन पर `system.run`/`system.which` execute करता है।
- **Approvals**: Node होस्ट पर `~/.openclaw/exec-approvals.json` के ज़रिए लागू होते हैं।

Approval नोट:

- Approval-backed Node runs exact request context से bind होते हैं।
- सीधे shell/runtime file executions के लिए, OpenClaw best-effort एक ठोस स्थानीय
  file operand को भी bind करता है और execution से पहले वह file बदल जाए तो run deny कर देता है।
- यदि OpenClaw किसी interpreter/runtime command के लिए ठीक एक ठोस स्थानीय file की पहचान नहीं कर सकता,
  तो approval-backed execution को पूर्ण runtime coverage का दिखावा करने के बजाय deny किया जाता है। व्यापक interpreter semantics के लिए sandboxing,
  अलग hosts, या explicit trusted allowlist/full workflow का उपयोग करें।

### Node होस्ट शुरू करें (foreground)

Node मशीन पर:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### SSH tunnel के ज़रिए रिमोट gateway (loopback bind)

यदि Gateway loopback से bind होता है (`gateway.bind=loopback`, local mode में default),
तो रिमोट Node hosts सीधे connect नहीं कर सकते। SSH tunnel बनाएँ और
Node होस्ट को tunnel के local end की ओर point करें।

उदाहरण (Node होस्ट -> gateway होस्ट):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

नोट्स:

- `openclaw node run` token या password auth का समर्थन करता है।
- Env vars को प्राथमिकता दी जाती है: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Config fallback `gateway.auth.token` / `gateway.auth.password` है।
- local mode में, Node होस्ट जानबूझकर `gateway.remote.token` / `gateway.remote.password` को ignore करता है।
- remote mode में, `gateway.remote.token` / `gateway.remote.password` remote precedence rules के अनुसार eligible हैं।
- यदि active local `gateway.auth.*` SecretRefs configured लेकिन unresolved हैं, तो Node-host auth fails closed।
- Node-host auth resolution केवल `OPENCLAW_GATEWAY_*` env vars को मानता है।

### Node होस्ट शुरू करें (service)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Pair + नाम दें

Gateway होस्ट पर:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

यदि Node बदले हुए auth details के साथ दोबारा प्रयास करता है, तो `openclaw devices list` फिर चलाएँ
और मौजूदा `requestId` को approve करें।

नामकरण विकल्प:

- `openclaw node run` / `openclaw node install` पर `--display-name` (Node पर `~/.openclaw/node.json` में persist होता है)।
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (gateway override).

### Commands को allowlist करें

Exec approvals **प्रति Node होस्ट** होते हैं। Gateway से allowlist entries जोड़ें:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Approvals Node होस्ट पर `~/.openclaw/exec-approvals.json` में रहते हैं।

### exec को Node की ओर point करें

Defaults configure करें (gateway config):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

या प्रति session:

```
/exec host=node security=allowlist node=<id-or-name>
```

Set होने के बाद, `host=node` वाला कोई भी `exec` call Node होस्ट पर चलता है (Node
allowlist/approvals के अधीन)।

`host=auto` अपने आप Node नहीं चुनेगा, लेकिन `auto` से explicit per-call `host=node` अनुरोध की अनुमति है। यदि आप session के लिए Node exec को default बनाना चाहते हैं, तो स्पष्ट रूप से `tools.exec.host=node` या `/exec host=node ...` set करें।

संबंधित:

- [Node होस्ट CLI](/hi/cli/node)
- [Exec tool](/hi/tools/exec)
- [Exec approvals](/hi/tools/exec-approvals)

### स्थानीय मॉडल inference

कोई desktop या server Node उस Node पर चल रहे Ollama server से chat-capable models उपलब्ध करा सकता है। Agents installed models खोजने और remotely bounded prompt चलाने के लिए Ollama Plugin के `node_inference` tool का उपयोग करते हैं; Gateway को Ollama तक सीधे network access की आवश्यकता नहीं होती। Setup, model filtering, और direct verification commands के लिए [Ollama Node-local inference](/hi/providers/ollama#node-local-inference)
देखें।

## Commands invoke करना

Low-level (raw RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

सामान्य "agent को MEDIA attachment दें" workflows के लिए higher-level helpers मौजूद हैं।

## Command policy

Node commands invoke होने से पहले दो gates पास करने चाहिए:

1. Node को अपने WebSocket `connect.commands` list में command declare करना चाहिए।
2. Gateway की platform policy को declared command की अनुमति देनी चाहिए।

Windows और macOS companion Nodes default रूप से सुरक्षित declared commands जैसे
`canvas.*`, `camera.list`, `location.get`, और `screen.snapshot` की अनुमति देते हैं।
वे trusted Nodes जो `talk` capability advertise करते हैं या `talk.*` commands declare करते हैं,
default रूप से declared push-to-talk commands (`talk.ptt.start`, `talk.ptt.stop`,
`talk.ptt.cancel`, `talk.ptt.once`) की भी अनुमति देते हैं, platform label से स्वतंत्र।
`camera.snap`, `camera.clip`, और
`screen.record` जैसे dangerous या privacy-heavy commands को अब भी
`gateway.nodes.allowCommands` के साथ explicit opt-in चाहिए। `gateway.nodes.denyCommands` हमेशा
defaults और extra allowlist entries पर जीतता है।

Plugin-owned Node commands Gateway node-invoke policy जोड़ सकते हैं। वह policy
allowlist check के बाद और Node को forward करने से पहले चलती है, इसलिए raw
`node.invoke`, CLI helpers, और dedicated agent tools एक ही Plugin
permission boundary साझा करते हैं। Dangerous Plugin Node commands को अब भी explicit
`gateway.nodes.allowCommands` opt-in चाहिए।

Node द्वारा अपनी declared command list बदलने के बाद, पुरानी device pairing को reject करें
और नए अनुरोध को approve करें ताकि gateway updated command snapshot store करे।

## Config (`openclaw.json`)

Node-related settings `gateway.nodes` और `tools.exec` के अंतर्गत रहते हैं:

```json5
{
  gateway: {
    nodes: {
      // Auto-approve first-time node pairing from trusted networks (CIDR list).
      // Disabled when unset. Only applies to first-time role:node requests
      // with no requested scopes; does not auto-approve upgrades.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
      // Opt into dangerous/privacy-heavy node commands (camera.snap, etc.).
      allowCommands: ["camera.snap", "screen.record"],
      // Block exact command names even if defaults or allowCommands include them.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Default exec host: "node" routes all exec calls to a paired node.
      host: "node",
      // Security mode for node exec: allow only approved/allowlisted commands.
      security: "allowlist",
      // Pin exec to a specific node (id or name). Omit to allow any node.
      node: "build-node",
    },
  },
}
```

Exact Node command names का उपयोग करें। `denyCommands` किसी command को तब भी हटाता है जब
platform default या `allowCommands` entry अन्यथा उसकी अनुमति देती। Gateway Node pairing और command-policy field details के लिए
[Gateway configuration reference](/hi/gateway/configuration-reference#gateway-field-details)
देखें।

Per-agent exec Node override:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: { exec: { node: "build-node" } },
      },
    ],
  },
}
```

## Screenshots (canvas snapshots)

यदि Node Canvas (WebView) दिखा रहा है, तो `canvas.snapshot` `{ format, base64 }` लौटाता है।

CLI helper (temp file में लिखता है और saved path print करता है):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Canvas controls

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

नोट्स:

- `canvas present` URLs या local file paths (`--target`) स्वीकार करता है, साथ ही positioning के लिए optional `--x/--y/--width/--height`।
- `canvas eval` inline JS (`--js`) या positional arg स्वीकार करता है।

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

नोट्स:

- मोबाइल नोड action-capable rendering के लिए bundled app-owned A2UI पेज का उपयोग करते हैं।
- केवल A2UI v0.8 JSONL समर्थित है (v0.9/createSurface अस्वीकार किया जाता है)।
- iOS और Android remote Gateway Canvas पेज render करते हैं, लेकिन A2UI button actions केवल bundled app-owned A2UI पेज से dispatch किए जाते हैं। Gateway-hosted HTTP/HTTPS A2UI पेज उन मोबाइल clients पर केवल render-only हैं।

## फ़ोटो + वीडियो (नोड कैमरा)

फ़ोटो (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

वीडियो क्लिप (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

टिप्पणियां:

- `canvas.*` और `camera.*` के लिए नोड **foreground** में होना चाहिए (background calls `NODE_BACKGROUND_UNAVAILABLE` लौटाते हैं)।
- बहुत बड़े base64 payloads से बचने के लिए क्लिप अवधि clamp की जाती है (वर्तमान में `<= 60s`)।
- Android संभव होने पर `CAMERA`/`RECORD_AUDIO` अनुमतियों के लिए prompt करेगा; अस्वीकृत अनुमतियां `*_PERMISSION_REQUIRED` के साथ विफल होती हैं।

## स्क्रीन रिकॉर्डिंग (नोड)

समर्थित नोड `screen.record` (mp4) expose करते हैं। उदाहरण:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

टिप्पणियां:

- `screen.record` की उपलब्धता नोड platform पर निर्भर करती है।
- स्क्रीन रिकॉर्डिंग `<= 60s` तक clamp की जाती हैं।
- `--no-audio` समर्थित platforms पर microphone capture बंद करता है।
- कई स्क्रीन उपलब्ध होने पर display चुनने के लिए `--screen <index>` का उपयोग करें।

## लोकेशन (नोड)

Settings में Location enabled होने पर नोड `location.get` expose करते हैं।

CLI helper:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

टिप्पणियां:

- Location **default रूप से बंद** है।
- "Always" के लिए system permission आवश्यक है; background fetch best-effort है।
- response में lat/lon, accuracy (meters), और timestamp शामिल हैं।

## SMS (Android नोड)

जब user **SMS** permission देता है और device telephony support करता है, तब Android नोड `sms.send` expose कर सकते हैं।

Low-level invoke:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

टिप्पणियां:

- capability advertise होने से पहले Android device पर permission prompt स्वीकार किया जाना चाहिए।
- telephony के बिना Wi-Fi-only devices `sms.send` advertise नहीं करेंगे।

## Android device + personal data commands

संबंधित capabilities enabled होने पर Android नोड अतिरिक्त command families advertise कर सकते हैं।

उपलब्ध families:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- Android Settings में Installed Apps sharing enabled होने पर `device.apps`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Invoke उदाहरण:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

टिप्पणियां:

- `device.apps` opt-in है और default रूप से launcher-visible apps लौटाता है।
- Motion commands उपलब्ध sensors द्वारा capability-gated होते हैं।

## सिस्टम commands (नोड host / Mac नोड)

macOS नोड `system.run`, `system.notify`, और `system.execApprovals.get/set` expose करता है।
headless नोड host `system.run`, `system.which`, और `system.execApprovals.get/set` expose करता है।

उदाहरण:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

टिप्पणियां:

- `system.run` payload में stdout/stderr/exit code लौटाता है।
- Shell execution अब `host=node` के साथ `exec` tool से होकर जाती है; explicit node commands के लिए `nodes` direct-RPC surface बना रहता है।
- `nodes invoke` `system.run` या `system.run.prepare` expose नहीं करता; वे केवल exec path पर रहते हैं।
- exec path approval से पहले canonical `systemRunPlan` तैयार करता है। एक बार
  approval मिल जाने पर, gateway वही stored plan forward करता है, बाद में
  caller-edited command/cwd/session fields नहीं।
- `system.notify` macOS app पर notification permission state का सम्मान करता है।
- अपरिचित नोड `platform` / `deviceFamily` metadata एक conservative default allowlist का उपयोग करता है जो `system.run` और `system.which` को exclude करता है। यदि आपको किसी unknown platform के लिए जानबूझकर वे commands चाहिए, तो उन्हें `gateway.nodes.allowCommands` के जरिए स्पष्ट रूप से जोड़ें।
- `system.run` `--cwd`, `--env KEY=VAL`, `--command-timeout`, और `--needs-screen-recording` support करता है।
- shell wrappers (`bash|sh|zsh ... -c/-lc`) के लिए, request-scoped `--env` values एक explicit allowlist (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`) तक घटा दी जाती हैं।
- allowlist mode में allow-always decisions के लिए, known dispatch wrappers (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) wrapper paths के बजाय inner executable paths persist करते हैं। यदि unwrapping सुरक्षित नहीं है, तो कोई allowlist entry automatic रूप से persist नहीं की जाती।
- allowlist mode में Windows नोड hosts पर, `cmd.exe /c` के जरिए shell-wrapper runs को approval चाहिए (केवल allowlist entry wrapper form को auto-allow नहीं करती)।
- `system.notify` `--priority <passive|active|timeSensitive>` और `--delivery <system|overlay|auto>` support करता है।
- नोड hosts `PATH` overrides ignore करते हैं और dangerous startup/shell keys (`DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`) strip करते हैं। यदि आपको अतिरिक्त PATH entries चाहिए, तो `--env` के जरिए `PATH` pass करने के बजाय नोड host service environment configure करें (या tools को standard locations में install करें)।
- macOS नोड mode पर, `system.run` macOS app में exec approvals द्वारा gated है (Settings → Exec approvals)।
  Ask/allowlist/full headless नोड host जैसा ही behave करते हैं; denied prompts `SYSTEM_RUN_DENIED` लौटाते हैं।
- headless नोड host पर, `system.run` exec approvals (`~/.openclaw/exec-approvals.json`) द्वारा gated है।

## Exec नोड binding

जब कई नोड उपलब्ध हों, तो आप exec को किसी specific नोड से bind कर सकते हैं।
यह `exec host=node` के लिए default नोड set करता है (और per agent override किया जा सकता है)।

Global default:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Per-agent override:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

किसी भी नोड की अनुमति देने के लिए unset करें:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## अनुमतियों का map

नोड `node.list` / `node.describe` में permission name (जैसे `screenRecording`, `accessibility`) से keyed, boolean values (`true` = granted) वाला `permissions` map शामिल कर सकते हैं।

## Headless नोड host (cross-platform)

OpenClaw एक **headless नोड host** (कोई UI नहीं) चला सकता है जो Gateway
WebSocket से connect करता है और `system.run` / `system.which` expose करता है। यह Linux/Windows पर
या server के साथ minimal नोड चलाने के लिए उपयोगी है।

इसे start करें:

```bash
openclaw node run --host <gateway-host> --port 18789
```

टिप्पणियां:

- Pairing अब भी आवश्यक है (Gateway device pairing prompt दिखाएगा)।
- नोड host अपना node id, token, display name, और gateway connection info `~/.openclaw/node.json` में store करता है।
- Exec approvals local रूप से `~/.openclaw/exec-approvals.json` के जरिए enforce किए जाते हैं
  ([Exec approvals](/hi/tools/exec-approvals) देखें)।
- macOS पर, headless नोड host default रूप से `system.run` local रूप से execute करता है। `system.run` को companion app exec host के जरिए route करने के लिए
  `OPENCLAW_NODE_EXEC_HOST=app` set करें; app host को require करने और उसके unavailable होने पर fail closed करने के लिए
  `OPENCLAW_NODE_EXEC_FALLBACK=0` जोड़ें।
- जब Gateway WS TLS उपयोग करता है, तो `--tls` / `--tls-fingerprint` जोड़ें।

## Mac नोड mode

- macOS menubar app नोड के रूप में Gateway WS server से connect करता है (इसलिए `openclaw nodes …` इस Mac के विरुद्ध काम करता है)।
- remote mode में, app Gateway port के लिए SSH tunnel खोलता है और `localhost` से connect करता है।
