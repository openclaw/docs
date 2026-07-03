---
read_when:
    - रिमोट Mac नियंत्रण सेट अप करना या डीबग करना
summary: दूरस्थ OpenClaw Gateway को नियंत्रित करने के लिए macOS ऐप प्रवाह
title: रिमोट कंट्रोल
x-i18n:
    generated_at: "2026-07-03T23:33:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d1ac5065011ef16085b3349ee7224fe3e806a6de61feaac2dcd5c9ed264227e
    source_path: platforms/mac/remote.md
    workflow: 16
---

यह flow macOS ऐप को किसी अन्य host (desktop/server) पर चल रहे OpenClaw Gateway के लिए पूर्ण remote control की तरह काम करने देता है। ऐप trusted LAN/Tailnet Gateway URLs से सीधे connect कर सकता है या remote Gateway के केवल loopback होने पर SSH tunnel manage कर सकता है। Health checks, Voice Wake forwarding, और Web Chat _Settings → General_ से वही remote configuration reuse करते हैं।

## Modes

- **Local (यह Mac)**: सब कुछ laptop पर चलता है। SSH शामिल नहीं है।
- **Remote over SSH (default)**: OpenClaw commands remote host पर execute होते हैं। mac ऐप `-o BatchMode` के साथ आपकी चुनी हुई identity/key और local port-forward का उपयोग करके SSH connection खोलता है।
- **Remote direct (ws/wss)**: कोई SSH tunnel नहीं। mac ऐप Gateway URL से सीधे connect करता है (उदाहरण के लिए, LAN, Tailscale, Tailscale Serve, या public HTTPS reverse proxy के माध्यम से)।

## Remote transports

Remote mode दो transports support करता है:

- **SSH tunnel** (default): Gateway port को localhost पर forward करने के लिए `ssh -N -L ...` का उपयोग करता है। Gateway को Node का IP `127.0.0.1` दिखेगा क्योंकि tunnel loopback है।
- **Direct (ws/wss)**: Gateway URL से सीधे connect करता है। Gateway को वास्तविक client IP दिखता है।

ऐप app-owned SSH processes के लिए SSH connection multiplexing और post-authentication backgrounding disable करता है, ताकि selected alias में `ControlMaster` या `ForkAfterAuthentication` enabled होने पर भी वह exact process को monitor और restart कर सके।

SSH host-key verification default रूप से strict है क्योंकि Gateway credentials इस tunnel से होकर जाते हैं। किसी managed SSH alias के लिए, जिसका trust behavior आप स्पष्ट रूप से उपयोग करना चाहते हैं, `openclaw-mac configure-remote --ssh-target <alias> --ssh-host-key-policy openssh` के साथ opt in करें या `gateway.remote.sshHostKeyPolicy` को `"openssh"` पर set करें। यह opt-in effective OpenSSH host-key policy का उपयोग करता है; पहले alias और किसी matching `Host *` या system configuration की review करें। ऐप में या `configure-remote` के साथ SSH target बदलने पर policy `strict` पर reset हो जाती है, जब तक आप फिर से स्पष्ट रूप से opt in न करें।

SSH tunnel mode में, discovered LAN/tailnet hostnames
`gateway.remote.sshTarget` के रूप में save किए जाते हैं। ऐप `gateway.remote.url` को local
tunnel endpoint पर रखता है, उदाहरण के लिए `ws://127.0.0.1:18789`, ताकि CLI, Web Chat, और
local node-host service सभी वही सुरक्षित loopback transport उपयोग करें।
जब discovery raw Tailnet IPs और stable hostnames दोनों लौटाती है, तो ऐप
Tailscale MagicDNS या LAN names को prefer करता है ताकि remote connections address
changes के बाद बेहतर तरीके से बने रहें।
अगर local tunnel port remote Gateway port से अलग है, तो
`gateway.remote.remotePort` को remote host के port पर set करें।

Remote mode में browser automation CLI Node host के स्वामित्व में होता है, native
macOS app Node के नहीं। संभव होने पर ऐप installed Node host service start करता है;
अगर आपको उस Mac से browser control चाहिए, तो इसे
`openclaw node install ...` और `openclaw node start` के साथ install/start करें (या foreground में
`openclaw node run ...` चलाएं), फिर उस browser-capable
Node को target करें।

## Remote host पर prerequisites

1. Node + pnpm install करें और OpenClaw CLI build/install करें (`pnpm install && pnpm build && pnpm link --global`)।
2. सुनिश्चित करें कि non-interactive shells के लिए `openclaw` PATH पर है (जरूरत हो तो `/usr/local/bin` या `/opt/homebrew/bin` में symlink करें)।
3. केवल SSH transport के लिए: key auth के साथ SSH खोलें। Off-LAN stable reachability के लिए हम **Tailscale** IPs recommend करते हैं।

## macOS app setup

Welcome flow के बिना ऐप को preconfigure करने के लिए:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Trusted LAN या Tailnet पर पहले से reachable Gateway के लिए, SSH को पूरी तरह skip करें:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

यह remote config लिखता है, onboarding complete mark करता है, और ऐप start होने पर
selected transport को own करने देता है।

1. _Settings → General_ खोलें।
2. **OpenClaw runs** के अंतर्गत, **Remote** चुनें और set करें:
   - **Transport**: **SSH tunnel** या **Direct (ws/wss)**।
   - **SSH target**: `user@host` (optional `:port`)।
     - अगर Gateway उसी LAN पर है और Bonjour advertise करता है, तो इस field को auto-fill करने के लिए discovered list से उसे चुनें।
   - **Gateway URL** (केवल Direct): `wss://gateway.example.ts.net` (या local/LAN के लिए `ws://...`)।
   - **Identity file** (advanced): आपकी key का path।
   - **Project root** (advanced): commands के लिए उपयोग किया गया remote checkout path।
   - **CLI path** (advanced): runnable `openclaw` entrypoint/binary का optional path (advertised होने पर auto-filled)।
3. **Test remote** दबाएं। Success का मतलब है कि remote `openclaw status --json` सही तरह चलता है। Failures आमतौर पर PATH/CLI issues होते हैं; exit 127 का मतलब है कि CLI remote पर नहीं मिला।
4. Health checks और Web Chat अब selected transport के माध्यम से automatically चलेंगे।

## Web Chat

- **SSH tunnel**: Web Chat forwarded WebSocket control port (default 18789) पर Gateway से connect करता है।
- **Direct (ws/wss)**: Web Chat configured Gateway URL से सीधे connect करता है।
- अब कोई अलग WebChat HTTP server नहीं है।

## Permissions

- Remote host को local जैसी ही TCC approvals चाहिए (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications)। इन्हें एक बार grant करने के लिए उस machine पर onboarding चलाएं।
- Nodes अपनी permission state `node.list` / `node.describe` के माध्यम से advertise करते हैं ताकि agents जान सकें कि क्या available है।

## Security notes

- Remote host पर loopback binds prefer करें और SSH, Tailscale Serve, या trusted Tailnet/LAN direct URL के माध्यम से connect करें।
- SSH tunneling default रूप से पहले से trusted host key require करता है। पहले host key पर trust करें ताकि वह configured known-hosts file में मौजूद हो, या किसी managed alias के लिए, जिसकी OpenSSH trust policy आप accept करते हैं, स्पष्ट रूप से `gateway.remote.sshHostKeyPolicy: "openssh"` चुनें।
- अगर आप Gateway को non-loopback interface पर bind करते हैं, तो valid Gateway auth require करें: token, password, या `gateway.auth.mode: "trusted-proxy"` वाला identity-aware reverse proxy।
- [Security](/hi/gateway/security) और [Tailscale](/hi/gateway/tailscale) देखें।

## WhatsApp login flow (remote)

- Remote host पर `openclaw channels login --verbose` चलाएं। अपने phone पर WhatsApp से QR scan करें।
- अगर auth expire हो जाए, तो उसी host पर login फिर से चलाएं। Health check link problems दिखाएगा।

## Troubleshooting

- **exit 127 / not found**: non-login shells के लिए `openclaw` PATH पर नहीं है। इसे `/etc/paths`, अपने shell rc में add करें, या `/usr/local/bin`/`/opt/homebrew/bin` में symlink करें।
- **Health probe failed**: SSH reachability, PATH, और यह check करें कि Baileys logged in है (`openclaw status --json`)।
- **Web Chat stuck**: confirm करें कि Gateway remote host पर चल रहा है और forwarded port Gateway WS port से match करता है; UI को healthy WS connection चाहिए।
- **Node IP shows 127.0.0.1**: SSH tunnel के साथ expected है। अगर आप चाहते हैं कि Gateway को real client IP दिखे, तो **Transport** को **Direct (ws/wss)** पर switch करें।
- **Dashboard works but Mac capabilities are offline**: इसका मतलब है कि ऐप का operator/control connection healthy है, लेकिन companion Node connection connected नहीं है या उसका command surface missing है। Menu bar device section खोलें और check करें कि Mac `paired · disconnected` है या नहीं। `wss://*.ts.net` Tailscale Serve endpoints के लिए, ऐप certificate rotation के बाद stale legacy TLS leaf pins detect करता है, macOS द्वारा नए certificate पर trust करने पर stale pin clear करता है, और automatically retry करता है। अगर certificate system-trusted नहीं है या host Tailscale Serve name नहीं है, तो `gateway.remote.tlsFingerprint` को expected certificate fingerprint पर set करें, certificate review करें, या **Remote over SSH** पर switch करें।
- **Voice Wake**: remote mode में trigger phrases automatically forward होते हैं; अलग forwarder की जरूरत नहीं है।

## Notification sounds

`openclaw` और `node.invoke` वाले scripts से प्रति notification sounds चुनें, जैसे:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

ऐप में अब कोई global "default sound" toggle नहीं है; callers हर request के लिए sound (या कोई sound नहीं) चुनते हैं।

## Related

- [macOS app](/hi/platforms/macos)
- [Remote access](/hi/gateway/remote)
