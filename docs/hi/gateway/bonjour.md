---
read_when:
    - macOS/iOS पर Bonjour खोज समस्याओं की डीबगिंग
    - mDNS सेवा प्रकारों, TXT रिकॉर्ड्स या खोज UX को बदलना
summary: Bonjour/mDNS डिस्कवरी + डीबगिंग (Gateway बीकन, क्लाइंट, और सामान्य विफलता मोड)
title: Bonjour डिस्कवरी
x-i18n:
    generated_at: "2026-06-28T23:05:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05892ee8f0dc880f68f7cf024de9452b8d999ff1af3c7ca9850fb4f2d732af0c
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw किसी सक्रिय Gateway (WebSocket endpoint) को खोजने के लिए Bonjour (mDNS / DNS-SD) का उपयोग कर सकता है।
Multicast `local.` ब्राउजिंग **केवल-LAN सुविधा** है। bundled `bonjour`
Plugin LAN advertising का स्वामी है। यह macOS hosts पर अपने-आप शुरू होता है और
Linux, Windows, और containerized Gateway deployments पर opt-in है। cross-network discovery के लिए, वही
beacon किसी configured wide-area DNS-SD domain के जरिए भी publish किया जा सकता है। Discovery
अब भी best-effort है और SSH या Tailnet-आधारित connectivity को **बदलती नहीं** है।

## Tailscale पर Wide-area Bonjour (Unicast DNS-SD)

यदि node और gateway अलग-अलग networks पर हैं, तो multicast mDNS
boundary पार नहीं करेगा। आप Tailscale पर **unicast DNS-SD**
("Wide-Area Bonjour") पर स्विच करके वही discovery UX रख सकते हैं।

उच्च-स्तरीय चरण:

1. gateway host पर DNS server चलाएँ (Tailnet पर reachable)।
2. `_openclaw-gw._tcp` के लिए DNS-SD records को एक dedicated zone
   (उदाहरण: `openclaw.internal.`) के तहत publish करें।
3. Tailscale **split DNS** configure करें ताकि आपका चुना हुआ domain clients
   (iOS सहित) के लिए उस DNS server के जरिए resolve हो।

OpenClaw किसी भी discovery domain को support करता है; `openclaw.internal.` केवल एक उदाहरण है।
iOS/Android nodes `local.` और आपके configured wide-area domain, दोनों browse करते हैं।

### Gateway config (अनुशंसित)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### एक-बार का DNS server setup (gateway host)

```bash
openclaw dns setup --apply
```

यह CoreDNS install करता है और इसे configure करता है ताकि यह:

- केवल gateway के Tailscale interfaces पर port 53 पर listen करे
- आपके चुने हुए domain (उदाहरण: `openclaw.internal.`) को `~/.openclaw/dns/<domain>.db` से serve करे

tailnet-connected machine से validate करें:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS settings

Tailscale admin console में:

- gateway के tailnet IP (UDP/TCP 53) की ओर point करता हुआ nameserver add करें।
- split DNS add करें ताकि आपका discovery domain उस nameserver का उपयोग करे।

एक बार clients tailnet DNS accept कर लें, तो iOS nodes और CLI discovery
बिना multicast के आपके discovery domain में `_openclaw-gw._tcp` browse कर सकते हैं।

### Gateway listener security (अनुशंसित)

Gateway WS port (default `18789`) default रूप से loopback से bind होता है। LAN/tailnet
access के लिए, explicit bind करें और auth enabled रखें।

tailnet-only setups के लिए:

- `~/.openclaw/openclaw.json` में `gateway.bind: "tailnet"` set करें।
- Gateway restart करें (या macOS menubar app restart करें)।

## क्या advertise करता है

केवल Gateway `_openclaw-gw._tcp` advertise करता है। LAN multicast advertising
bundled `bonjour` Plugin द्वारा तब प्रदान की जाती है जब Plugin enabled हो; wide-area
DNS-SD publishing Gateway-owned रहती है।

## Service types

- `_openclaw-gw._tcp` - gateway transport beacon (macOS/iOS/Android nodes द्वारा उपयोग किया जाता है)।

## TXT keys (non-secret hints)

Gateway UI flows को सुविधाजनक बनाने के लिए छोटे non-secret hints advertise करता है:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (केवल जब TLS enabled हो)
- `gatewayTlsSha256=<sha256>` (केवल जब TLS enabled हो और fingerprint उपलब्ध हो)
- `canvasPort=<port>` (केवल जब canvas host enabled हो; currently `gatewayPort` के समान)
- `transport=gateway`
- `tailnetDns=<magicdns>` (केवल mDNS full mode, Tailnet उपलब्ध होने पर optional hint)
- `sshPort=<port>` (केवल full mode; minimal और off modes में omitted)
- `cliPath=<path>` (केवल full mode; minimal और off modes में omitted)

Security notes:

- Bonjour/mDNS TXT records **unauthenticated** होते हैं। Clients को TXT को authoritative routing नहीं मानना चाहिए।
- Clients को resolved service endpoint (SRV + A/AAAA) का उपयोग करके route करना चाहिए। `lanHost`, `tailnetDns`, `gatewayPort`, और `gatewayTlsSha256` को केवल hints मानें।
- SSH auto-targeting को भी resolved service host का उपयोग करना चाहिए, केवल TXT-only hints का नहीं।
- TLS pinning को किसी advertised `gatewayTlsSha256` को पहले से stored pin override करने की अनुमति कभी नहीं देनी चाहिए।
- iOS/Android nodes को discovery-based direct connects को **केवल-TLS** मानना चाहिए और first-time fingerprint पर trust करने से पहले explicit user confirmation मांगना चाहिए।

## macOS पर debugging

उपयोगी built-in tools:

- Instances browse करें:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- एक instance resolve करें (`<instance>` replace करें):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

यदि browsing काम करती है लेकिन resolving fail होती है, तो आमतौर पर आप LAN policy या
mDNS resolver issue से टकरा रहे होते हैं।

## Gateway logs में debugging

Gateway एक rolling log file लिखता है (startup पर
`gateway log file: ...` के रूप में printed)। `bonjour:` lines देखें, खासकर:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

watchdog active `probing`, `announcing`, और fresh conflict-renames को
in-progress states मानता है। यदि service कभी `announced` तक नहीं पहुँचती, तो OpenClaw अंततः
advertiser को recreate करता है और, repeated failures के बाद, forever re-advertising करने के बजाय उस
Gateway process के लिए Bonjour disable कर देता है।

Bonjour advertised `.local` host के लिए system hostname का उपयोग करता है जब यह
valid DNS label हो। यदि system hostname में spaces, underscores, या कोई अन्य
invalid DNS-label character हो, तो OpenClaw `openclaw.local` पर fallback करता है। जब आपको
explicit host label चाहिए, तो Gateway शुरू करने से पहले `OPENCLAW_MDNS_HOSTNAME=<name>` set करें।

## iOS node पर debugging

iOS node `_openclaw-gw._tcp` discover करने के लिए `NWBrowser` का उपयोग करता है।

Logs capture करने के लिए:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → reproduce → **Copy**

Log में browser state transitions और result-set changes शामिल होते हैं।

## Bonjour कब enable करें

Bonjour macOS hosts पर empty-config Gateway startup के लिए auto-start होता है क्योंकि
local app और nearby iOS/Android nodes आमतौर पर same-LAN discovery पर rely करते हैं।

जब Linux, Windows, या किसी अन्य non-macOS host पर same-LAN auto-discovery उपयोगी हो, तो Bonjour explicit रूप से enable करें:

```bash
openclaw plugins enable bonjour
```

Enabled होने पर, Bonjour `discovery.mdns.mode` का उपयोग करके तय करता है कि कितना TXT metadata
publish करना है। वही mode wide-area DNS-SD records में optional TXT hints को control करता है।
Default mode `minimal` है; `full` का उपयोग केवल तब करें जब clients को `cliPath` या
`sshPort` hints चाहिए। Plugin enablement बदले बिना LAN multicast suppress करने के लिए `off` का उपयोग करें;
जब `discovery.wideArea.enabled` true हो, तो wide-area DNS-SD अब भी minimal Gateway beacon publish कर सकता है।

## Bonjour कब disable करें

जब LAN multicast advertising unnecessary, unavailable,
या harmful हो, तब Bonjour disabled छोड़ दें। आम cases हैं non-macOS servers, Docker bridge networking,
WSL, या ऐसी network policy जो mDNS multicast drop करती है। इन environments में
Gateway अब भी अपनी published URL, SSH, Tailnet, या wide-area
DNS-SD के जरिए reachable है, लेकिन LAN auto-discovery reliable नहीं है।

जब problem deployment-scoped हो, तो existing environment override को prefer करें:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

यह Plugin configuration बदले बिना LAN multicast advertising disable करता है।
यह Docker images, service files, launch scripts, और one-off
debugging के लिए safe है क्योंकि environment हटते ही setting गायब हो जाती है।

जब आप उस OpenClaw config के लिए bundled LAN
discovery Plugin को जानबूझकर turn off करना चाहते हों, तो Plugin configuration का उपयोग करें:

```bash
openclaw plugins disable bonjour
```

## Docker gotchas

bundled Bonjour Plugin detected containers में LAN multicast advertising को auto-disable करता है
जब `OPENCLAW_DISABLE_BONJOUR` unset हो। Docker bridge networks
आमतौर पर mDNS multicast (`224.0.0.251:5353`) को container
और LAN के बीच forward नहीं करते, इसलिए container से advertising शायद ही discovery को काम कराती है।

महत्वपूर्ण gotchas:

- Bonjour macOS hosts पर auto-start होता है और अन्य जगह opt-in है। इसे
  disabled छोड़ना Gateway को रोकता नहीं है; यह केवल LAN multicast advertising skip करता है।
- Bonjour disable करने से `gateway.bind` नहीं बदलता; Docker अब भी
  `OPENCLAW_GATEWAY_BIND=lan` पर default करता है ताकि published host port काम कर सके।
- Bonjour disable करने से wide-area DNS-SD disable नहीं होता। जब Gateway और node same LAN पर न हों, तो wide-area discovery
  या Tailnet का उपयोग करें।
- Docker के बाहर वही `OPENCLAW_CONFIG_DIR` reuse करने से
  container auto-disable policy persist नहीं होती।
- `OPENCLAW_DISABLE_BONJOUR=0` केवल host networking, macvlan, या किसी अन्य
  network के लिए set करें जहाँ mDNS multicast का pass होना known हो; force-disable करने के लिए इसे `1` पर set करें।

## Disabled Bonjour की troubleshooting

यदि Docker setup के बाद कोई node अब Gateway auto-discover नहीं करता:

1. Confirm करें कि Gateway auto, forced-on, या forced-off mode में चल रहा है:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Confirm करें कि Gateway स्वयं published port के जरिए reachable है:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Bonjour disabled होने पर direct target का उपयोग करें:
   - Control UI या local tools: `http://127.0.0.1:18789`
   - LAN clients: `http://<gateway-host>:18789`
   - Cross-network clients: Tailnet MagicDNS, Tailnet IP, SSH tunnel, या
     wide-area DNS-SD

4. यदि आपने Docker में Bonjour Plugin deliberately enable किया है और
   `OPENCLAW_DISABLE_BONJOUR=0` के साथ advertising force की है, तो host से multicast test करें:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   यदि browsing empty है या Gateway logs repeated ciao watchdog
   cancellations दिखाते हैं, तो `OPENCLAW_DISABLE_BONJOUR=1` restore करें और direct या
   Tailnet route का उपयोग करें।

## Common failure modes

- **Bonjour networks cross नहीं करता**: Tailnet या SSH का उपयोग करें।
- **Multicast blocked**: कुछ Wi-Fi networks mDNS disable करते हैं।
- **Advertiser probing/announcing में अटका है**: blocked multicast वाले hosts,
  container bridges, WSL, या interface churn ciao advertiser को
  non-announced state में छोड़ सकते हैं। OpenClaw कुछ बार retry करता है और फिर advertiser को forever restart करने के बजाय current Gateway process
  के लिए Bonjour disable कर देता है।
- **Docker bridge networking**: detected containers में Bonjour auto-disable होता है।
  `OPENCLAW_DISABLE_BONJOUR=0` केवल host, macvlan, या किसी अन्य
  mDNS-capable network के लिए set करें।
- **Sleep / interface churn**: macOS अस्थायी रूप से mDNS results drop कर सकता है; retry करें।
- **Browse काम करता है लेकिन resolve fail होता है**: machine names simple रखें (emojis या
  punctuation से बचें), फिर Gateway restart करें। Service instance name
  host name से derive होता है, इसलिए बहुत complex names कुछ resolvers को confuse कर सकते हैं।

## Escaped instance names (`\032`)

Bonjour/DNS-SD अक्सर service instance names में bytes को decimal `\DDD`
sequences के रूप में escape करता है (जैसे spaces `\032` बन जाते हैं)।

- Protocol level पर यह normal है।
- UIs को display के लिए decode करना चाहिए (iOS `BonjourEscapes.decode` का उपयोग करता है)।

## Enable करना / disable करना / configuration

- macOS होस्ट डिफ़ॉल्ट रूप से bundled LAN discovery Plugin को अपने-आप शुरू करते हैं।
- `openclaw plugins enable bonjour` उन होस्ट पर bundled LAN discovery Plugin सक्षम करता है जहाँ यह डिफ़ॉल्ट रूप से सक्षम नहीं है।
- `openclaw plugins disable bonjour` bundled Plugin को अक्षम करके LAN multicast advertising अक्षम करता है।
- `OPENCLAW_DISABLE_BONJOUR=1` Plugin config बदले बिना LAN multicast advertising अक्षम करता है; स्वीकृत truthy मान `1`, `true`, `yes`, और `on` हैं (legacy: `OPENCLAW_DISABLE_BONJOUR`)।
- `OPENCLAW_DISABLE_BONJOUR=0` LAN multicast advertising को चालू करने के लिए बाध्य करता है, पहचाने गए containers के अंदर भी; स्वीकृत falsy मान `0`, `false`, `no`, और `off` हैं।
- जब Bonjour Plugin सक्षम हो और `OPENCLAW_DISABLE_BONJOUR` सेट न हो, तो Bonjour सामान्य होस्ट पर advertise करता है और पहचाने गए containers के अंदर अपने-आप अक्षम हो जाता है।
- `~/.openclaw/openclaw.json` में `gateway.bind` Gateway bind mode को नियंत्रित करता है।
- जब `sshPort` advertise किया जाता है, तो `OPENCLAW_SSH_PORT` SSH port को override करता है (legacy: `OPENCLAW_SSH_PORT`)।
- mDNS full mode सक्षम होने पर `OPENCLAW_TAILNET_DNS` TXT में MagicDNS hint प्रकाशित करता है (legacy: `OPENCLAW_TAILNET_DNS`)।
- `OPENCLAW_CLI_PATH` advertise किए गए CLI path को override करता है (legacy: `OPENCLAW_CLI_PATH`)।

## संबंधित docs

- Discovery policy और transport selection: [Discovery](/hi/gateway/discovery)
- Node pairing + approvals: [Gateway pairing](/hi/gateway/pairing)
