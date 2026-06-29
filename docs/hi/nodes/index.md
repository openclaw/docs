---
read_when:
    - iOS/Android नोड्स को Gateway से पेयर करना
    - एजेंट संदर्भ के लिए Node कैनवास/कैमरा का उपयोग करना
    - नए node कमांड या CLI सहायक जोड़ना
summary: 'नोड्स: कैनवास/कैमरा/स्क्रीन/डिवाइस/सूचनाओं/सिस्टम के लिए पेयरिंग, क्षमताएँ, अनुमतियाँ, और CLI सहायक'
title: नोड्स
x-i18n:
    generated_at: "2026-06-28T23:24:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e860f051faeeea2d7461d07d2119a7f11f80812aa87896882f11edee36667e4a
    source_path: nodes/index.md
    workflow: 16
---

एक **node** एक companion device (macOS/iOS/Android/headless) है जो Gateway **WebSocket** (operators वाले उसी port) से `role: "node"` के साथ जुड़ता है और `node.invoke` के माध्यम से command surface (जैसे `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) उजागर करता है। Protocol details: [Gateway protocol](/hi/gateway/protocol).

Legacy transport: [Bridge protocol](/hi/gateway/bridge-protocol) (TCP JSONL;
वर्तमान nodes के लिए केवल ऐतिहासिक).

macOS **node mode** में भी चल सकता है: menubar app Gateway के
WS server से जुड़ता है और अपने local canvas/camera commands को node के रूप में उजागर करता है (ताकि
`openclaw nodes …` इस Mac के विरुद्ध काम करे)। remote gateway mode में, browser
automation CLI node host (`openclaw node run` या
installed node service) द्वारा संभाली जाती है, native app node द्वारा नहीं।

नोट्स:

- Nodes **peripherals** हैं, gateways नहीं। वे gateway service नहीं चलाते।
- Telegram/WhatsApp/etc. messages **gateway** पर आते हैं, nodes पर नहीं।
- Troubleshooting runbook: [/nodes/troubleshooting](/hi/nodes/troubleshooting)

## Pairing + status

**WS nodes device pairing का उपयोग करते हैं।** Nodes `connect` के दौरान device identity प्रस्तुत करते हैं; Gateway
`role: node` के लिए device pairing request बनाता है। devices CLI (या UI) के माध्यम से approve करें।

Quick CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

यदि कोई node बदले हुए auth details (role/scopes/public key) के साथ फिर से कोशिश करता है, तो पिछला
pending request supersede हो जाता है और नया `requestId` बनाया जाता है। approve करने से पहले
`openclaw devices list` फिर से चलाएं।

नोट्स:

- `nodes status` किसी node को **paired** के रूप में चिह्नित करता है जब उसकी device pairing role में `node` शामिल हो।
- device pairing record टिकाऊ approved-role contract है। Token
  rotation उसी contract के अंदर रहती है; यह किसी paired node को ऐसी
  अलग role में upgrade नहीं कर सकती जिसे pairing approval ने कभी grant नहीं किया।
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) एक अलग gateway-owned
  node pairing store है; यह WS `connect` handshake को gate **नहीं** करता।
- `openclaw nodes remove --node <id|name|ip>` किसी node pairing को हटाता है। किसी
  device-backed node के लिए यह `devices/paired.json` में device की `node` role को revoke करता है
  और उस device के node-role sessions को disconnect करता है — mixed-role device अपनी
  row रखता है और केवल `node` role खोता है, जबकि node-only device row
  delete हो जाती है। यह अलग gateway-owned node
  pairing store से कोई matching entry भी clear करता है। `operator.pairing` non-operator node rows हटा सकता है; mixed-role device पर अपनी ही node role revoke करने वाले
  device-token caller को अतिरिक्त रूप से `operator.admin` चाहिए।
- Approval scope pending request के declared commands का पालन करता है:
  - commandless request: `operator.pairing`
  - non-exec node commands: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Remote node host (system.run)

जब आपका Gateway एक machine पर चलता है और आप commands को
दूसरी machine पर execute कराना चाहते हैं, तो **node host** का उपयोग करें। model अब भी **gateway** से बात करता है; जब `host=node` चुना जाता है, तो gateway
`exec` calls को **node host** तक forward करता है।

### क्या कहां चलता है

- **Gateway host**: messages receive करता है, model चलाता है, tool calls route करता है।
- **Node host**: node machine पर `system.run`/`system.which` execute करता है।
- **Approvals**: node host पर `~/.openclaw/exec-approvals.json` के माध्यम से enforce किए जाते हैं।

Approval note:

- Approval-backed node runs exact request context से bind होते हैं।
- direct shell/runtime file executions के लिए, OpenClaw best-effort रूप से एक concrete local
  file operand को भी bind करता है और यदि वह file execution से पहले बदलती है तो run deny करता है।
- यदि OpenClaw interpreter/runtime command के लिए ठीक एक concrete local file पहचान नहीं सकता,
  तो full runtime coverage का दिखावा करने के बजाय approval-backed execution deny कर दिया जाता है। व्यापक interpreter semantics के लिए sandboxing,
  separate hosts, या explicit trusted allowlist/full workflow का उपयोग करें।

### node host शुरू करें (foreground)

node machine पर:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### SSH tunnel के माध्यम से remote gateway (loopback bind)

यदि Gateway loopback (`gateway.bind=loopback`, local mode में default) पर bind करता है,
तो remote node hosts सीधे connect नहीं कर सकते। SSH tunnel बनाएं और
node host को tunnel के local end पर point करें।

Example (node host -> gateway host):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

नोट्स:

- `openclaw node run` token या password auth support करता है।
- Env vars preferred हैं: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Config fallback `gateway.auth.token` / `gateway.auth.password` है।
- local mode में, node host जानबूझकर `gateway.remote.token` / `gateway.remote.password` ignore करता है।
- remote mode में, `gateway.remote.token` / `gateway.remote.password` remote precedence rules के अनुसार eligible हैं।
- यदि active local `gateway.auth.*` SecretRefs configured हैं लेकिन unresolved हैं, तो node-host auth fails closed।
- Node-host auth resolution केवल `OPENCLAW_GATEWAY_*` env vars का सम्मान करता है।

### node host शुरू करें (service)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Pair + name

gateway host पर:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

यदि node बदले हुए auth details के साथ retry करता है, तो `openclaw devices list` फिर से चलाएं
और current `requestId` approve करें।

Naming options:

- `openclaw node run` / `openclaw node install` पर `--display-name` (node पर `~/.openclaw/node.json` में persist होता है)।
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (gateway override).

### commands को allowlist करें

Exec approvals **per node host** होते हैं। gateway से allowlist entries जोड़ें:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Approvals node host पर `~/.openclaw/exec-approvals.json` में रहते हैं।

### exec को node पर point करें

defaults configure करें (gateway config):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

या per session:

```
/exec host=node security=allowlist node=<id-or-name>
```

एक बार set होने पर, `host=node` वाली कोई भी `exec` call node host पर चलती है (node
allowlist/approvals के अधीन)।

`host=auto` अपने आप node को implicitly choose नहीं करेगा, लेकिन `auto` से explicit per-call `host=node` request allowed है। यदि आप session के लिए node exec को default बनाना चाहते हैं, तो `tools.exec.host=node` या `/exec host=node ...` explicitly set करें।

Related:

- [Node host CLI](/hi/cli/node)
- [Exec tool](/hi/tools/exec)
- [Exec approvals](/hi/tools/exec-approvals)

## commands invoke करना

Low-level (raw RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

सामान्य "agent को MEDIA attachment दें" workflows के लिए higher-level helpers मौजूद हैं।

## Command policy

Node commands invoke किए जाने से पहले दो gates पास करने चाहिए:

1. node को अपने WebSocket `connect.commands` list में command declare करना चाहिए।
2. gateway की platform policy को declared command allow करना चाहिए।

Windows और macOS companion nodes default रूप से
`canvas.*`, `camera.list`, `location.get`, और `screen.snapshot` जैसे safe declared commands allow करते हैं।
Trusted nodes जो `talk` capability advertise करते हैं या `talk.*` commands declare करते हैं,
वे declared push-to-talk commands (`talk.ptt.start`, `talk.ptt.stop`,
`talk.ptt.cancel`, `talk.ptt.once`) को भी default रूप से allow करते हैं, platform label से independent।
`camera.snap`, `camera.clip`, और
`screen.record` जैसे dangerous या privacy-heavy commands को अब भी
`gateway.nodes.allowCommands` के साथ explicit opt-in चाहिए। `gateway.nodes.denyCommands` हमेशा
defaults और extra allowlist entries पर precedence लेता है।

Plugin-owned node commands Gateway node-invoke policy जोड़ सकते हैं। वह policy
allowlist check के बाद और node को forward करने से पहले चलती है, ताकि raw
`node.invoke`, CLI helpers, और dedicated agent tools समान plugin
permission boundary साझा करें। Dangerous plugin node commands को अब भी explicit
`gateway.nodes.allowCommands` opt-in चाहिए।

node द्वारा अपनी declared command list बदलने के बाद, पुराने device pairing को reject करें
और new request approve करें ताकि gateway updated command snapshot store करे।

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

exact node command names का उपयोग करें। `denyCommands` किसी command को हटा देता है, भले ही
platform default या `allowCommands` entry अन्यथा उसे allow करती। gateway node pairing और command-policy field details के लिए
[Gateway configuration reference](/hi/gateway/configuration-reference#gateway-field-details)
देखें।

Per-agent exec node override:

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

यदि node Canvas (WebView) दिखा रहा है, तो `canvas.snapshot` `{ format, base64 }` return करता है।

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

- `canvas present` URLs या local file paths (`--target`) accept करता है, साथ ही positioning के लिए optional `--x/--y/--width/--height`।
- `canvas eval` inline JS (`--js`) या positional arg accept करता है।

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

नोट्स:

- Mobile nodes action-capable rendering के लिए bundled app-owned A2UI page का उपयोग करते हैं।
- केवल A2UI v0.8 JSONL supported है (v0.9/createSurface rejected है)।
- iOS और Android remote Gateway Canvas pages render करते हैं, लेकिन A2UI button actions केवल bundled app-owned A2UI page से dispatch होते हैं। Gateway-hosted HTTP/HTTPS A2UI pages उन mobile clients पर render-only हैं।

## Photos + videos (node camera)

Photos (`jpg`):

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

नोट्स:

- `canvas.*` और `camera.*` के लिए नोड का **फ़ोरग्राउंड में होना** ज़रूरी है (बैकग्राउंड कॉल `NODE_BACKGROUND_UNAVAILABLE` लौटाते हैं)।
- बहुत बड़े base64 payloads से बचने के लिए क्लिप अवधि सीमित की जाती है (वर्तमान में `<= 60s`)।
- संभव होने पर Android `CAMERA`/`RECORD_AUDIO` अनुमतियों के लिए prompt करेगा; अस्वीकृत अनुमतियाँ `*_PERMISSION_REQUIRED` के साथ विफल होती हैं।

## स्क्रीन रिकॉर्डिंग (नोड)

समर्थित नोड `screen.record` (`mp4`) उपलब्ध कराते हैं। उदाहरण:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

नोट्स:

- `screen.record` की उपलब्धता नोड प्लेटफ़ॉर्म पर निर्भर करती है।
- स्क्रीन रिकॉर्डिंग `<= 60s` तक सीमित की जाती हैं।
- समर्थित प्लेटफ़ॉर्म पर `--no-audio` माइक्रोफ़ोन कैप्चर को अक्षम करता है।
- कई स्क्रीन उपलब्ध होने पर डिस्प्ले चुनने के लिए `--screen <index>` का उपयोग करें।

## स्थान (नोड)

जब settings में Location सक्षम हो, तब नोड `location.get` उपलब्ध कराते हैं।

CLI helper:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

नोट्स:

- Location **डिफ़ॉल्ट रूप से बंद** है।
- "Always" के लिए सिस्टम अनुमति आवश्यक है; बैकग्राउंड fetch best-effort है।
- प्रतिक्रिया में lat/lon, accuracy (meters), और timestamp शामिल होते हैं।

## SMS (Android नोड)

जब उपयोगकर्ता **SMS** अनुमति देता है और डिवाइस telephony का समर्थन करता है, तब Android नोड `sms.send` उपलब्ध करा सकते हैं।

निम्न-स्तरीय invoke:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

नोट्स:

- capability विज्ञापित होने से पहले Android डिवाइस पर permission prompt स्वीकार किया जाना चाहिए।
- telephony के बिना Wi-Fi-only डिवाइस `sms.send` विज्ञापित नहीं करेंगे।

## Android डिवाइस + निजी डेटा commands

संबंधित capabilities सक्षम होने पर Android नोड अतिरिक्त command families विज्ञापित कर सकते हैं।

उपलब्ध families:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- Android Settings में Installed Apps sharing सक्षम होने पर `device.apps`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

उदाहरण invokes:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

नोट्स:

- `device.apps` opt-in है और डिफ़ॉल्ट रूप से launcher-visible apps लौटाता है।
- Motion commands उपलब्ध sensors द्वारा capability-gated होते हैं।

## सिस्टम commands (नोड host / mac नोड)

macOS नोड `system.run`, `system.notify`, और `system.execApprovals.get/set` उपलब्ध कराता है।
headless node host `system.run`, `system.which`, और `system.execApprovals.get/set` उपलब्ध कराता है।

उदाहरण:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

नोट्स:

- `system.run` payload में stdout/stderr/exit code लौटाता है।
- Shell execution अब `host=node` के साथ `exec` tool से होकर जाता है; स्पष्ट node commands के लिए `nodes` direct-RPC surface बना रहता है।
- `nodes invoke` `system.run` या `system.run.prepare` उपलब्ध नहीं कराता; वे केवल exec path पर रहते हैं।
- exec path approval से पहले canonical `systemRunPlan` तैयार करता है। एक बार
  approval मिल जाने पर, gateway वही stored plan आगे भेजता है, बाद में caller द्वारा संपादित कोई
  command/cwd/session fields नहीं।
- `system.notify` macOS app पर notification permission state का सम्मान करता है।
- अपरिचित नोड `platform` / `deviceFamily` metadata एक conservative default allowlist का उपयोग करता है, जिसमें `system.run` और `system.which` शामिल नहीं होते। यदि आपको किसी unknown platform के लिए सचमुच उन commands की आवश्यकता है, तो उन्हें `gateway.nodes.allowCommands` के ज़रिये स्पष्ट रूप से जोड़ें।
- `system.run` `--cwd`, `--env KEY=VAL`, `--command-timeout`, और `--needs-screen-recording` का समर्थन करता है।
- shell wrappers (`bash|sh|zsh ... -c/-lc`) के लिए, request-scoped `--env` values को एक explicit allowlist (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`) तक घटाया जाता है।
- allowlist mode में allow-always decisions के लिए, ज्ञात dispatch wrappers (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) wrapper paths के बजाय inner executable paths persist करते हैं। यदि unwrapping सुरक्षित नहीं है, तो कोई allowlist entry अपने-आप persist नहीं की जाती।
- allowlist mode में Windows node hosts पर, `cmd.exe /c` के ज़रिये shell-wrapper runs को approval चाहिए (केवल allowlist entry wrapper form को auto-allow नहीं करती)।
- `system.notify` `--priority <passive|active|timeSensitive>` और `--delivery <system|overlay|auto>` का समर्थन करता है।
- Node hosts `PATH` overrides को ignore करते हैं और खतरनाक startup/shell keys (`DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`) हटाते हैं। यदि आपको अतिरिक्त PATH entries चाहिए, तो `--env` के ज़रिये `PATH` pass करने के बजाय node host service environment configure करें (या tools को standard locations में install करें)।
- macOS node mode पर, `system.run` macOS app में exec approvals द्वारा gated होता है (Settings → Exec approvals)।
  Ask/allowlist/full headless node host की तरह ही व्यवहार करते हैं; अस्वीकृत prompts `SYSTEM_RUN_DENIED` लौटाते हैं।
- headless node host पर, `system.run` exec approvals (`~/.openclaw/exec-approvals.json`) द्वारा gated होता है।

## Exec नोड binding

जब कई नोड उपलब्ध हों, तो आप exec को किसी विशिष्ट नोड से bind कर सकते हैं।
यह `exec host=node` के लिए default node सेट करता है (और इसे per agent override किया जा सकता है)।

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

नोड `node.list` / `node.describe` में `permissions` map शामिल कर सकते हैं, जो permission name (जैसे `screenRecording`, `accessibility`) से keyed होता है और boolean values (`true` = granted) रखता है।

## Headless node host (cross-platform)

OpenClaw एक **headless node host** (कोई UI नहीं) चला सकता है, जो Gateway
WebSocket से connect करता है और `system.run` / `system.which` उपलब्ध कराता है। यह Linux/Windows पर
या server के साथ minimal node चलाने के लिए उपयोगी है।

इसे शुरू करें:

```bash
openclaw node run --host <gateway-host> --port 18789
```

नोट्स:

- Pairing अभी भी आवश्यक है (Gateway device pairing prompt दिखाएगा)।
- node host अपना node id, token, display name, और gateway connection info `~/.openclaw/node.json` में store करता है।
- Exec approvals स्थानीय रूप से `~/.openclaw/exec-approvals.json` के ज़रिये enforced होते हैं
  ([Exec approvals](/hi/tools/exec-approvals) देखें)।
- macOS पर, headless node host डिफ़ॉल्ट रूप से `system.run` को locally execute करता है। `system.run` को companion app exec host के ज़रिये route करने के लिए
  `OPENCLAW_NODE_EXEC_HOST=app` सेट करें; app host को आवश्यक बनाने और उसके unavailable होने पर fail closed करने के लिए
  `OPENCLAW_NODE_EXEC_FALLBACK=0` जोड़ें।
- जब Gateway WS TLS का उपयोग करता हो, तब `--tls` / `--tls-fingerprint` जोड़ें।

## Mac node mode

- macOS menubar app Gateway WS server से नोड के रूप में connect करता है (इसलिए `openclaw nodes …` इस Mac के विरुद्ध काम करता है)।
- remote mode में, app Gateway port के लिए SSH tunnel खोलता है और `localhost` से connect करता है।
