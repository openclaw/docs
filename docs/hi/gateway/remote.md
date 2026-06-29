---
read_when:
    - रिमोट Gateway सेटअप चलाना या समस्या निवारण करना
summary: Gateway WS, SSH टनल और tailnets का उपयोग करके रिमोट एक्सेस
title: दूरस्थ पहुँच
x-i18n:
    generated_at: "2026-06-28T23:12:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5f885026fe76acb46f49955c6e485e08714a5cc5e90c165d20e25cea1acf864
    source_path: gateway/remote.md
    workflow: 16
---

यह repo एक समर्पित host (desktop/server) पर एक ही Gateway (master) चलाकर और clients को उससे जोड़कर remote gateway access का समर्थन करता है।

- **operators (आप / macOS app)** के लिए: जब gateway पहुँच योग्य हो, तो direct LAN/Tailnet WebSocket सबसे सरल है; SSH tunneling सार्वभौमिक fallback है।
- **nodes (iOS/Android और भविष्य के devices)** के लिए: आवश्यकता के अनुसार LAN/tailnet या SSH tunnel से Gateway **WebSocket** से जुड़ें।

## मुख्य विचार

- Gateway WebSocket आमतौर पर आपके configured port (default 18789) पर **loopback** से bind होता है।
- Remote उपयोग के लिए, इसे Tailscale Serve या trusted LAN/Tailnet bind के माध्यम से expose करें, या SSH पर loopback port forward करें।

## सामान्य VPN और tailnet setups

**Gateway host** को वह स्थान समझें जहाँ agent रहता है। यह sessions, auth profiles, channels, और state का मालिक होता है। आपका laptop, desktop, और nodes उस host से जुड़ते हैं।

### आपके tailnet में always-on Gateway

Gateway को persistent host (VPS या home server) पर चलाएँ और **Tailscale** या SSH के माध्यम से पहुँचें।

- **सर्वश्रेष्ठ UX:** `gateway.bind: "loopback"` रखें और Control UI के लिए **Tailscale Serve** का उपयोग करें।
- **Trusted LAN/Tailnet:** gateway को private interface से bind करें और `gateway.remote.transport: "direct"` के साथ सीधे connect करें।
- **Fallback:** loopback रखें और access की आवश्यकता वाली किसी भी machine से SSH tunnel उपयोग करें।
- **उदाहरण:** [exe.dev](/hi/install/exe-dev) (आसान VM) या [Hetzner](/hi/install/hetzner) (production VPS)।

यह तब आदर्श है जब आपका laptop अक्सर sleep करता है लेकिन आप agent को always-on रखना चाहते हैं।

### Home desktop Gateway चलाता है

Laptop **agent नहीं** चलाता। यह remotely connect करता है:

- macOS app का remote mode उपयोग करें (Settings → General → OpenClaw runs)।
- जब gateway LAN/Tailnet पर पहुँच योग्य हो तो app सीधे connect करता है, या जब आप SSH चुनते हैं तो SSH tunnel खोलता और manage करता है।

Runbook: [macOS remote access](/hi/platforms/mac/remote)।

### Laptop Gateway चलाता है

Gateway को local रखें लेकिन उसे सुरक्षित रूप से expose करें:

- अन्य machines से laptop तक SSH tunnel करें, या
- Control UI को Tailscale Serve करें और Gateway को केवल loopback रखें।

Guides: [Tailscale](/hi/gateway/tailscale) और [Web overview](/hi/web)।

## Command flow (कहाँ क्या चलता है)

एक gateway service state + channels की मालिक होती है। Nodes peripherals हैं।

Flow example (Telegram → node):

- Telegram message **Gateway** पर आता है।
- Gateway **agent** चलाता है और तय करता है कि node tool call करना है या नहीं।
- Gateway Gateway WebSocket (`node.*` RPC) पर **node** को call करता है।
- Node result लौटाता है; Gateway वापस Telegram पर reply करता है।

Notes:

- **Nodes gateway service नहीं चलाते।** प्रति host केवल एक gateway चलना चाहिए, जब तक कि आप जानबूझकर isolated profiles न चला रहे हों (देखें [Multiple gateways](/hi/gateway/multiple-gateways))।
- macOS app "node mode" Gateway WebSocket पर केवल एक node client है।

## SSH tunnel (CLI + tools)

Remote Gateway WS के लिए local tunnel बनाएँ:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Tunnel चालू होने पर:

- `openclaw health` और `openclaw status --deep` अब `ws://127.0.0.1:18789` के माध्यम से remote gateway तक पहुँचते हैं।
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe`, और `openclaw gateway call` भी आवश्यकता होने पर `--url` के माध्यम से forwarded URL को target कर सकते हैं।

<Note>
`18789` को अपने configured `gateway.port` (या `--port` या `OPENCLAW_GATEWAY_PORT`) से बदलें।
</Note>

<Warning>
जब आप `--url` pass करते हैं, CLI config या environment credentials पर fallback नहीं करता। `--token` या `--password` स्पष्ट रूप से include करें। Explicit credentials का missing होना error है।
</Warning>

## CLI remote defaults

आप remote target persist कर सकते हैं ताकि CLI commands default रूप से उसका उपयोग करें:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

जब gateway केवल loopback हो, URL को `ws://127.0.0.1:18789` पर रखें और पहले SSH tunnel खोलें।
macOS app के SSH tunnel transport में, discovered gateway hostnames
`gateway.remote.sshTarget` में होते हैं; `gateway.remote.url` local tunnel URL बना रहता है।
यदि वे ports अलग हों, तो `gateway.remote.remotePort` को SSH host पर gateway port पर set करें।

Trusted LAN या Tailnet पर पहले से reachable gateway के लिए direct mode उपयोग करें:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      transport: "direct",
      url: "ws://192.168.0.202:18789",
      token: "your-token",
    },
  },
}
```

## Credential precedence

Gateway credential resolution call/probe/status paths और Discord exec-approval monitoring में एक shared contract का पालन करता है। Node-host वही base contract उपयोग करता है, एक local-mode exception के साथ (यह जानबूझकर `gateway.remote.*` को ignore करता है):

- Explicit credentials (`--token`, `--password`, या tool `gatewayToken`) explicit auth स्वीकार करने वाले call paths पर हमेशा जीतते हैं।
- URL override safety:
  - CLI URL overrides (`--url`) implicit config/env credentials को कभी reuse नहीं करते।
  - Env URL overrides (`OPENCLAW_GATEWAY_URL`) केवल env credentials (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) उपयोग कर सकते हैं।
- Local mode defaults:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (remote fallback केवल तब apply होता है जब local auth token input unset हो)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (remote fallback केवल तब apply होता है जब local auth password input unset हो)
- Remote mode defaults:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-host local-mode exception: `gateway.remote.token` / `gateway.remote.password` ignore किए जाते हैं।
- Remote probe/status token checks default रूप से strict हैं: remote mode target करते समय वे केवल `gateway.remote.token` उपयोग करते हैं (कोई local token fallback नहीं)।
- Gateway env overrides केवल `OPENCLAW_GATEWAY_*` उपयोग करते हैं।

## Chat UI remote access

WebChat अब अलग HTTP port उपयोग नहीं करता। SwiftUI chat UI सीधे Gateway WebSocket से connect करता है।

- SSH पर `18789` forward करें (ऊपर देखें), फिर clients को `ws://127.0.0.1:18789` से connect करें।
- LAN/Tailnet direct mode के लिए, clients को configured private `ws://` या secure `wss://` URL से connect करें।
- macOS पर, app का remote mode prefer करें, जो selected transport को automatically manage करता है।

## macOS app remote mode

macOS menu bar app वही setup end-to-end drive कर सकता है (remote status checks, WebChat, और Voice Wake forwarding)।

Runbook: [macOS remote access](/hi/platforms/mac/remote)।

## Security rules (remote/VPN)

Short version: **Gateway को केवल loopback रखें** जब तक आपको यकीन न हो कि bind की आवश्यकता है।

- **Loopback + SSH/Tailscale Serve** सबसे सुरक्षित default है (कोई public exposure नहीं)।
- Plaintext `ws://` loopback, LAN, link-local, `.local`, `.ts.net`, और Tailscale CGNAT hosts के लिए accepted है। Public remote hosts को `wss://` उपयोग करना होगा।
- **Non-loopback binds** (`lan`/`tailnet`/`custom`, या `auto` जब loopback unavailable हो) को gateway auth उपयोग करना होगा: token, password, या `gateway.auth.mode: "trusted-proxy"` वाला identity-aware reverse proxy।
- `gateway.remote.token` / `.password` client credential sources हैं। वे अपने आप server auth configure **नहीं** करते।
- Local call paths `gateway.auth.*` unset होने पर ही fallback के रूप में `gateway.remote.*` उपयोग कर सकते हैं।
- यदि `gateway.auth.token` / `gateway.auth.password` SecretRef के माध्यम से explicitly configured है और unresolved है, तो resolution fail closed होता है (कोई remote fallback masking नहीं)।
- `gateway.remote.tlsFingerprint` `wss://` उपयोग करते समय remote TLS cert को pin करता है, जिसमें macOS direct mode शामिल है। Configured या पहले से stored pin के बिना, macOS normal system trust pass होने के बाद ही first-use certificate pin करता है; self-signed या private-CA gateways जिन पर macOS पहले से trust नहीं करता, उन्हें explicit fingerprint या Remote over SSH चाहिए।
- **Tailscale Serve** `gateway.auth.allowTailscale: true` होने पर identity
  headers के माध्यम से Control UI/WebSocket traffic authenticate कर सकता है; HTTP API endpoints उस
  Tailscale header auth का उपयोग नहीं करते और इसके बजाय gateway के normal HTTP
  auth mode का पालन करते हैं। यह tokenless flow मानता है कि gateway host trusted है। यदि आप हर जगह shared-secret auth चाहते हैं तो इसे
  `false` पर set करें।
- **Trusted-proxy** auth default रूप से non-loopback identity-aware proxy setups की अपेक्षा करता है।
  Same-host loopback reverse proxies को explicit `gateway.auth.trustedProxy.allowLoopback = true` चाहिए।
- Browser control को operator access जैसा मानें: केवल tailnet + deliberate node pairing।

Deep dive: [Security](/hi/gateway/security)।

### macOS: LaunchAgent के माध्यम से persistent SSH tunnel

Remote gateway से connect करने वाले macOS clients के लिए, सबसे आसान persistent setup SSH `LocalForward` config entry और reboot तथा crash के बाद tunnel को alive रखने के लिए LaunchAgent उपयोग करता है।

#### Step 1: SSH config जोड़ें

`~/.ssh/config` edit करें:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

`<REMOTE_IP>` और `<REMOTE_USER>` को अपने values से बदलें।

#### Step 2: SSH key copy करें (one-time)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Step 3: gateway token configure करें

Token को config में store करें ताकि यह restarts के बाद persist रहे:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Step 4: LaunchAgent बनाएँ

इसे `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist` के रूप में save करें:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### Step 5: LaunchAgent load करें

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Tunnel login पर automatically start होगा, crash पर restart होगा, और forwarded port को live रखेगा।

<Note>
यदि आपके पास older setup से बचा हुआ `com.openclaw.ssh-tunnel` LaunchAgent है, तो उसे unload और delete करें।
</Note>

#### Troubleshooting

जाँचें कि tunnel चल रहा है या नहीं:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Tunnel restart करें:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Tunnel stop करें:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Config entry                         | यह क्या करता है                                             |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | local port 18789 को remote port 18789 पर forward करता है    |
| `ssh -N`                             | remote commands execute किए बिना SSH (केवल port-forwarding) |
| `KeepAlive`                          | tunnel crash होने पर automatically restart करता है           |
| `RunAtLoad`                          | login पर LaunchAgent load होने पर tunnel start करता है       |

## Related

- [Tailscale](/hi/gateway/tailscale)
- [Authentication](/hi/gateway/authentication)
- [Remote gateway setup](/hi/gateway/remote-gateway-readme)
