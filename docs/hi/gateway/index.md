---
read_when:
    - Gateway प्रक्रिया चलाना या डीबग करना
summary: Gateway सेवा, लाइफ़साइकल, और संचालन के लिए रनबुक
title: Gateway रनबुक
x-i18n:
    generated_at: "2026-06-28T23:09:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0bbbcad26df135e1475cbeb14f1299b48bae62be759b2e6c6f82164d175601b
    source_path: gateway/index.md
    workflow: 16
---

दिन-1 स्टार्टअप और दिन-2 संचालन के लिए Gateway सेवा के लिए इस पृष्ठ का उपयोग करें।

<CardGroup cols={2}>
  <Card title="गहन समस्या-निवारण" icon="siren" href="/hi/gateway/troubleshooting">
    सटीक कमांड लैडर और लॉग सिग्नेचर के साथ लक्षण-प्रथम निदान।
  </Card>
  <Card title="कॉन्फ़िगरेशन" icon="sliders" href="/hi/gateway/configuration">
    कार्य-उन्मुख सेटअप गाइड + पूर्ण कॉन्फ़िगरेशन संदर्भ।
  </Card>
  <Card title="सीक्रेट्स प्रबंधन" icon="key-round" href="/hi/gateway/secrets">
    SecretRef अनुबंध, रनटाइम स्नैपशॉट व्यवहार, और माइग्रेट/रीलोड संचालन।
  </Card>
  <Card title="सीक्रेट्स प्लान अनुबंध" icon="shield-check" href="/hi/gateway/secrets-plan-contract">
    सटीक `secrets apply` लक्ष्य/पथ नियम और केवल-ref auth-profile व्यवहार।
  </Card>
</CardGroup>

## 5-मिनट का स्थानीय स्टार्टअप

<Steps>
  <Step title="Gateway शुरू करें">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="सेवा स्वास्थ्य सत्यापित करें">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

स्वस्थ बेसलाइन: `Runtime: running`, `Connectivity probe: ok`, और `Capability: ...` जो आपकी अपेक्षा से मेल खाता हो। जब आपको केवल पहुंच-योग्यता नहीं, बल्कि read-scope RPC प्रमाण चाहिए, तो `openclaw gateway status --require-rpc` का उपयोग करें।

  </Step>

  <Step title="चैनल तैयारी सत्यापित करें">

```bash
openclaw channels status --probe
```

पहुंच योग्य gateway के साथ यह प्रति-खाता चैनल जांच और वैकल्पिक ऑडिट लाइव चलाता है।
यदि gateway पहुंच योग्य नहीं है, तो CLI लाइव जांच आउटपुट के बजाय केवल-कॉन्फ़िग चैनल सारांश पर वापस चला जाता है।

  </Step>
</Steps>

<Note>
Gateway कॉन्फ़िग रीलोड सक्रिय कॉन्फ़िग फ़ाइल पथ को देखता है (profile/state डिफ़ॉल्ट से resolve किया गया, या सेट होने पर `OPENCLAW_CONFIG_PATH` से)।
डिफ़ॉल्ट मोड `gateway.reload.mode="hybrid"` है।
पहले सफल लोड के बाद, चल रही प्रक्रिया सक्रिय इन-मेमोरी कॉन्फ़िग स्नैपशॉट परोसती है; सफल रीलोड उस स्नैपशॉट को atomic रूप से बदल देता है।
</Note>

## रनटाइम मॉडल

- रूटिंग, control plane, और चैनल कनेक्शन के लिए एक हमेशा-ऑन प्रक्रिया।
- इसके लिए एकल multiplexed पोर्ट:
  - WebSocket control/RPC
  - HTTP API (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Plugin HTTP रूट, जैसे वैकल्पिक `/api/v1/admin/rpc`
  - Control UI और hooks
- डिफ़ॉल्ट bind मोड: `loopback`।
- Auth डिफ़ॉल्ट रूप से आवश्यक है। Shared-secret सेटअप
  `gateway.auth.token` / `gateway.auth.password` (या
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) का उपयोग करते हैं, और non-loopback
  reverse-proxy सेटअप `gateway.auth.mode: "trusted-proxy"` का उपयोग कर सकते हैं।

## OpenAI-compatible endpoints

OpenClaw की सबसे उच्च-प्रभाव वाली compatibility surface अब है:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

यह सेट क्यों महत्वपूर्ण है:

- अधिकांश Open WebUI, LobeChat, और LibreChat इंटीग्रेशन पहले `/v1/models` जांचते हैं।
- कई RAG और memory pipelines `/v1/embeddings` की अपेक्षा करते हैं।
- Agent-native clients तेजी से `/v1/responses` को प्राथमिकता देते हैं।

योजना नोट:

- `/v1/models` agent-first है: यह `openclaw`, `openclaw/default`, और `openclaw/<agentId>` लौटाता है।
- `openclaw/default` स्थिर alias है जो हमेशा configured default agent पर map होता है।
- जब आप backend provider/model override चाहते हैं, तो `x-openclaw-model` का उपयोग करें; अन्यथा चयनित agent का सामान्य model और embedding setup नियंत्रण में रहता है।

ये सभी मुख्य Gateway पोर्ट पर चलते हैं और Gateway HTTP API के बाकी हिस्से जैसी ही trusted operator auth boundary का उपयोग करते हैं।

Admin HTTP RPC (`POST /api/v1/admin/rpc`) host tooling के लिए एक अलग, default-off Plugin रूट है जो WebSocket RPC का उपयोग नहीं कर सकता। [Admin HTTP RPC](/hi/plugins/admin-http-rpc) देखें।

### पोर्ट और bind प्राथमिकता

| सेटिंग      | Resolution order                                              |
| ------------ | ------------------------------------------------------------- |
| Gateway पोर्ट | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bind मोड    | CLI/override → `gateway.bind` → `loopback`                    |

इंस्टॉल की गई gateway सेवाएं resolved `--port` को supervisor metadata में रिकॉर्ड करती हैं। `gateway.port` बदलने के बाद, `openclaw doctor --fix` या `openclaw gateway install --force` चलाएं ताकि launchd/systemd/schtasks प्रक्रिया को नए पोर्ट पर शुरू करें।

Gateway startup non-loopback binds के लिए स्थानीय
Control UI origins seed करते समय उसी effective port और bind का उपयोग करता है। उदाहरण के लिए, `--bind lan --port 3000`
runtime validation चलने से पहले `http://localhost:3000` और `http://127.0.0.1:3000`
seed करता है। किसी भी remote browser origins, जैसे HTTPS proxy URLs, को
`gateway.controlUi.allowedOrigins` में स्पष्ट रूप से जोड़ें।

### Hot reload modes

| `gateway.reload.mode` | व्यवहार                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | कोई config reload नहीं                           |
| `hot`                 | केवल hot-safe बदलाव लागू करें                |
| `restart`             | reload-required बदलावों पर restart करें         |
| `hybrid` (default)    | सुरक्षित होने पर hot-apply करें, आवश्यक होने पर restart करें |

## Operator command set

```bash
openclaw gateway status
openclaw gateway status --deep   # adds a system-level service scan
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` अतिरिक्त service discovery (LaunchDaemons/systemd system
units/schtasks) के लिए है, न कि गहरी RPC health probe के लिए।

## Multiple gateways (same host)

अधिकांश इंस्टॉल में प्रति मशीन एक gateway चलना चाहिए। एक single gateway कई
agents और channels host कर सकता है।

आपको multiple gateways केवल तब चाहिए जब आप जानबूझकर isolation या rescue bot चाहते हों।

उपयोगी जांचें:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

क्या अपेक्षा करें:

- `gateway status --deep` `Other gateway-like services detected (best effort)`
  रिपोर्ट कर सकता है और stale launchd/systemd/schtasks installs अभी भी मौजूद होने पर cleanup hints print कर सकता है।
- `gateway probe` distinct
  gateways के जवाब देने पर, या जब OpenClaw यह prove नहीं कर सकता कि reachable targets वही gateway हैं, `multiple reachable gateway identities` के बारे में warn कर सकता है।
  उसी gateway के लिए SSH tunnel, proxy URL, या configured remote URL multiple transports वाला एक
  gateway है, भले ही transport ports अलग हों।
- यदि यह जानबूझकर है, तो प्रति gateway ports, config/state, और workspace roots isolate करें।

प्रति instance checklist:

- Unique `gateway.port`
- Unique `OPENCLAW_CONFIG_PATH`
- Unique `OPENCLAW_STATE_DIR`
- Unique `agents.defaults.workspace`

उदाहरण:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

विस्तृत सेटअप: [/gateway/multiple-gateways](/hi/gateway/multiple-gateways).

## Remote access

प्राथमिकता: Tailscale/VPN।
Fallback: SSH tunnel।

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

फिर clients को स्थानीय रूप से `ws://127.0.0.1:18789` से connect करें।

<Warning>
SSH tunnels gateway auth को bypass नहीं करते। shared-secret auth के लिए, clients को tunnel पर भी
`token`/`password` भेजना होगा। identity-bearing modes के लिए,
request को फिर भी उस auth path को satisfy करना होगा।
</Warning>

देखें: [Remote Gateway](/hi/gateway/remote), [Authentication](/hi/gateway/authentication), [Tailscale](/hi/gateway/tailscale).

## Supervision and service lifecycle

production-like reliability के लिए supervised runs का उपयोग करें।

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

restarts के लिए `openclaw gateway restart` का उपयोग करें। restart substitute के रूप में `openclaw gateway stop` और `openclaw gateway start` को chain न करें।

macOS पर, `gateway stop` डिफ़ॉल्ट रूप से `launchctl bootout` का उपयोग करता है — यह disable persist किए बिना current boot session से LaunchAgent को remove करता है, इसलिए unexpected crashes के बाद भी KeepAlive auto-recovery काम करती है और `gateway start` cleanly re-enable करता है। reboots के पार auto-respawn को persistently suppress करने के लिए, `--disable` pass करें: `openclaw gateway stop --disable`।

LaunchAgent labels `ai.openclaw.gateway` (default) या `ai.openclaw.<profile>` (named profile) हैं। `openclaw doctor` service config drift का audit और repair करता है।

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

logout के बाद persistence के लिए, lingering enable करें:

```bash
sudo loginctl enable-linger <user>
```

जब custom install path चाहिए हो, manual user-unit example:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (native)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

Native Windows managed startup `OpenClaw Gateway`
(या named profiles के लिए `OpenClaw Gateway (<profile>)`) नामक Scheduled Task का उपयोग करता है। यदि Scheduled Task
creation अस्वीकृत है, तो OpenClaw state directory के अंदर `gateway.cmd` की ओर point करने वाले per-user Startup-folder launcher पर fallback करता है।

  </Tab>

  <Tab title="Linux (system service)">

multi-user/always-on hosts के लिए system unit का उपयोग करें।

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

user unit जैसा ही service body उपयोग करें, लेकिन इसे
`/etc/systemd/system/openclaw-gateway[-<profile>].service` के अंतर्गत install करें और यदि आपका `openclaw` binary कहीं और है तो
`ExecStart=` adjust करें।

उसी profile/port के लिए `openclaw doctor --fix` को user-level gateway service install करने भी न दें। जब यह system-level OpenClaw gateway service पाता है तो Doctor उस automatic install को refuse करता है; जब system unit lifecycle own करता है, तो `OPENCLAW_SERVICE_REPAIR_POLICY=external` का उपयोग करें।

  </Tab>
</Tabs>

## Dev profile quick path

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

डिफ़ॉल्ट में isolated state/config और base gateway port `19001` शामिल हैं।

## Protocol quick reference (operator view)

- पहला client frame `connect` होना चाहिए।
- Gateway `hello-ok` snapshot (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy) लौटाता है।
- `hello-ok.features.methods` / `events` conservative discovery list हैं, हर callable helper route का generated dump नहीं।
- Requests: `req(method, params)` → `res(ok/payload|error)`।
- सामान्य events में `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.operation`, `session.tool`, `sessions.changed`,
  `presence`, `tick`, `health`, `heartbeat`, pairing/approval lifecycle events,
  और `shutdown` शामिल हैं।

Agent runs दो-stage हैं:

1. Immediate accepted ack (`status:"accepted"`)
2. Final completion response (`status:"ok"|"error"`), बीच में streamed `agent` events के साथ।

पूर्ण protocol docs देखें: [Gateway Protocol](/hi/gateway/protocol).

## Operational checks

### Liveness

- WS खोलें और `connect` भेजें।
- snapshot के साथ `hello-ok` response की अपेक्षा करें।

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Gap recovery

Events replay नहीं किए जाते। sequence gaps पर, जारी रखने से पहले state (`health`, `system-presence`) refresh करें।

## Common failure signatures

| हस्ताक्षर                                                      | संभावित समस्या                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | मान्य Gateway प्रमाणीकरण पथ के बिना गैर-loopback बाइंड                             |
| `another gateway instance is already listening` / `EADDRINUSE` | पोर्ट टकराव                                                                   |
| `Gateway start blocked: set gateway.mode=local`                | कॉन्फिग रिमोट मोड पर सेट है, या क्षतिग्रस्त कॉन्फिग से local-mode स्टैम्प गायब है |
| `unauthorized` during connect                                  | क्लाइंट और Gateway के बीच प्रमाणीकरण बेमेल                                        |

पूरी निदान सीढ़ियों के लिए, [Gateway समस्या निवारण](/hi/gateway/troubleshooting) का उपयोग करें।

## सुरक्षा गारंटियां

- Gateway प्रोटोकॉल क्लाइंट Gateway अनुपलब्ध होने पर तुरंत विफल होते हैं (कोई अंतर्निहित डायरेक्ट-चैनल फॉलबैक नहीं)।
- अमान्य/नॉन-कनेक्ट पहले फ्रेम अस्वीकार करके बंद कर दिए जाते हैं।
- व्यवस्थित शटडाउन सॉकेट बंद होने से पहले `shutdown` इवेंट उत्सर्जित करता है।

---

संबंधित:

- [समस्या निवारण](/hi/gateway/troubleshooting)
- [पृष्ठभूमि प्रक्रिया](/hi/gateway/background-process)
- [कॉन्फिगरेशन](/hi/gateway/configuration)
- [स्वास्थ्य](/hi/gateway/health)
- [Doctor](/hi/gateway/doctor)
- [प्रमाणीकरण](/hi/gateway/authentication)

## संबंधित

- [कॉन्फिगरेशन](/hi/gateway/configuration)
- [Gateway समस्या निवारण](/hi/gateway/troubleshooting)
- [रिमोट एक्सेस](/hi/gateway/remote)
- [सीक्रेट्स प्रबंधन](/hi/gateway/secrets)
