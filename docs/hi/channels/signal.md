---
read_when:
    - Signal समर्थन सेट अप करना
    - Signal भेजने/प्राप्त करने की डीबगिंग
summary: signal-cli के माध्यम से Signal समर्थन (नेटिव daemon या bbernhard container), सेटअप पथ, और नंबर मॉडल
title: Signal
x-i18n:
    generated_at: "2026-06-28T22:39:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f4d82f43a11494d371a9af9a8e55b227364594a5a144b5a4d8690e865d9ade8
    source_path: channels/signal.md
    workflow: 16
---

स्थिति: बाहरी CLI एकीकरण। Gateway HTTP के ज़रिए `signal-cli` से बात करता है — या तो नेटिव daemon (JSON-RPC + SSE) या bbernhard/signal-cli-rest-api container (REST + WebSocket)।

## पूर्वापेक्षाएँ

- आपके server पर OpenClaw स्थापित हो (नीचे दिया Linux flow Ubuntu 24 पर परीक्षण किया गया है)।
- इनमें से एक:
  - host पर `signal-cli` उपलब्ध हो (नेटिव mode), **या**
  - `bbernhard/signal-cli-rest-api` Docker container (container mode)।
- एक phone number जो एक verification SMS प्राप्त कर सके (SMS registration path के लिए)।
- registration के दौरान Signal captcha (`signalcaptchas.org`) के लिए browser access।

## त्वरित setup (शुरुआती)

1. bot के लिए **अलग Signal number** इस्तेमाल करें (अनुशंसित)।
2. OpenClaw plugin install करें:

```bash
openclaw plugins install @openclaw/signal
```

3. `signal-cli` install करें (यदि आप JVM build इस्तेमाल करते हैं तो Java आवश्यक है)।
4. एक setup path चुनें:
   - **Path A (QR link):** `signal-cli link -n "OpenClaw"` और Signal से scan करें।
   - **Path B (SMS register):** captcha + SMS verification के साथ एक dedicated number register करें।
5. OpenClaw configure करें और gateway restart करें।
6. पहला DM भेजें और pairing approve करें (`openclaw pairing approve signal <CODE>`)।

न्यूनतम config:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

Field संदर्भ:

| Field        | विवरण                                                        |
| ------------ | ------------------------------------------------------------ |
| `account`    | E.164 format में bot phone number (`+15551234567`)            |
| `cliPath`    | `signal-cli` का path (`PATH` पर हो तो `signal-cli`)           |
| `configPath` | `--config` के रूप में pass किया गया signal-cli config dir     |
| `dmPolicy`   | DM access policy (`pairing` अनुशंसित)                        |
| `allowFrom`  | DM करने की अनुमति वाले phone numbers या `uuid:<id>` values   |

## यह क्या है

- `signal-cli` के ज़रिए Signal channel (embedded libsignal नहीं)।
- निर्धारक routing: replies हमेशा Signal पर वापस जाती हैं।
- DMs agent का main session share करते हैं; groups अलग-थलग रहते हैं (`agent:<agentId>:signal:group:<groupId>`)।

## Config writes

Default रूप से, Signal को `/config set|unset` से trigger होने वाले config updates लिखने की अनुमति है (इसके लिए `commands.config: true` चाहिए)।

इसके साथ disable करें:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Number model (महत्वपूर्ण)

- gateway एक **Signal device** (`signal-cli` account) से connect करता है।
- यदि आप bot को **अपने personal Signal account** पर चलाते हैं, तो यह आपके अपने messages ignore करेगा (loop protection)।
- "मैं bot को text करूं और वह reply करे" के लिए, **अलग bot number** इस्तेमाल करें।

## Setup path A: मौजूदा Signal account link करें (QR)

1. `signal-cli` install करें (JVM या native build)।
2. एक bot account link करें:
   - `signal-cli link -n "OpenClaw"` फिर Signal में QR scan करें।
3. Signal configure करें और gateway start करें।

Example:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

Multi-account support: per-account config और वैकल्पिक `name` के साथ `channels.signal.accounts` इस्तेमाल करें। साझा pattern के लिए [`gateway/configuration`](/hi/gateway/config-channels#multi-account-all-channels) देखें।

## Setup path B: dedicated bot number register करें (SMS, Linux)

जब आप मौजूदा Signal app account link करने के बजाय dedicated bot number चाहते हों, तब इसका उपयोग करें।

1. ऐसा number लें जो SMS प्राप्त कर सके (या landlines के लिए voice verification)।
   - account/session conflicts से बचने के लिए dedicated bot number इस्तेमाल करें।
2. gateway host पर `signal-cli` install करें:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

यदि आप JVM build (`signal-cli-${VERSION}.tar.gz`) इस्तेमाल करते हैं, तो पहले JRE 25+ install करें।
`signal-cli` updated रखें; upstream बताता है कि Signal server APIs बदलने पर पुराने releases टूट सकते हैं।

3. number register और verify करें:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

यदि captcha आवश्यक हो:

1. `https://signalcaptchas.org/registration/generate.html` खोलें।
2. captcha पूरा करें, "Signal खोलें" से `signalcaptcha://...` link target copy करें।
3. संभव हो तो browser session के समान external IP से run करें।
4. registration तुरंत फिर run करें (captcha tokens जल्दी expire होते हैं):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw configure करें, gateway restart करें, channel verify करें:

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. अपने DM sender को pair करें:
   - bot number पर कोई भी message भेजें।
   - server पर code approve करें: `openclaw pairing approve signal <PAIRING_CODE>`।
   - "Unknown contact" से बचने के लिए bot number को अपने phone पर contact के रूप में save करें।

<Warning>
`signal-cli` के साथ phone number account register करने से उस number के लिए main Signal app session de-authenticate हो सकता है। Dedicated bot number को प्राथमिकता दें, या यदि आपको अपना मौजूदा phone app setup बनाए रखना है तो QR link mode इस्तेमाल करें।
</Warning>

Upstream संदर्भ:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captcha flow: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Linking flow: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## External daemon mode (httpUrl)

यदि आप `signal-cli` को स्वयं manage करना चाहते हैं (धीमे JVM cold starts, container init, या shared CPUs), तो daemon अलग से run करें और OpenClaw को उसकी ओर point करें:

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

यह OpenClaw के अंदर auto-spawn और startup wait को skip करता है। Auto-spawning के समय धीमे starts के लिए, `channels.signal.startupTimeoutMs` set करें।

## Container mode (bbernhard/signal-cli-rest-api)

`signal-cli` को natively चलाने के बजाय, आप [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) Docker container इस्तेमाल कर सकते हैं। यह `signal-cli` को REST API और WebSocket interface के पीछे wrap करता है।

Requirements:

- real-time message receiving के लिए container **ज़रूर** `MODE=json-rpc` के साथ run होना चाहिए।
- OpenClaw connect करने से पहले container के अंदर अपना Signal account register या link करें।

Example `docker-compose.yml` service:

```yaml
signal-cli:
  image: bbernhard/signal-cli-rest-api:latest
  environment:
    MODE: json-rpc
  ports:
    - "8080:8080"
  volumes:
    - signal-cli-data:/home/.local/share/signal-cli
```

OpenClaw config:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      httpUrl: "http://signal-cli:8080",
      autoStart: false,
      apiMode: "container", // or "auto" to detect automatically
    },
  },
}
```

`apiMode` field नियंत्रित करता है कि OpenClaw कौन सा protocol इस्तेमाल करता है:

| Value         | व्यवहार                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (Default) दोनों transports probe करता है; streaming container WebSocket receive validate करती है |
| `"native"`    | native signal-cli force करें (`/api/v1/rpc` पर JSON-RPC, `/api/v1/events` पर SSE)     |
| `"container"` | bbernhard container force करें (`/v2/send` पर REST, `/v1/receive/{account}` पर WebSocket) |

जब `apiMode` `"auto"` होता है, तो repeated probes से बचने के लिए OpenClaw detected mode को 30 seconds तक cache करता है। Container receive streaming के लिए तभी चुना जाता है जब `/v1/receive/{account}` WebSocket में upgrade हो, जिसके लिए `MODE=json-rpc` चाहिए।

Container mode वही Signal channel operations support करता है जो native mode करता है, जहां container matching APIs expose करता है: sends, receives, attachments, typing indicators, read/viewed receipts, reactions, groups, और styled text। OpenClaw अपनी native Signal RPC calls को container के REST payloads में translate करता है, जिसमें `group.{base64(internal_id)}` group IDs और formatted text के लिए `text_mode: "styled"` शामिल हैं।

Operational notes:

- Container mode के साथ `autoStart: false` इस्तेमाल करें। `apiMode: "container"` चुने जाने पर OpenClaw को native daemon spawn नहीं करना चाहिए।
- receiving के लिए `MODE=json-rpc` इस्तेमाल करें। `MODE=normal` `/v1/about` को healthy दिखा सकता है, लेकिन `/v1/receive/{account}` WebSocket-upgrade नहीं करता, इसलिए OpenClaw `auto` mode में container receive streaming नहीं चुनेगा।
- जब आपको पता हो कि `httpUrl` bbernhard की REST API की ओर point करता है, तो `apiMode: "container"` set करें। जब आपको पता हो कि यह native `signal-cli` JSON-RPC/SSE की ओर point करता है, तो `apiMode: "native"` set करें। Deployment बदल सकता हो तो `"auto"` इस्तेमाल करें।
- Container attachment downloads native mode जैसी ही media byte limits का पालन करते हैं। जब server `Content-Length` भेजता है तो oversized responses पूरी तरह buffer होने से पहले reject हो जाते हैं, और अन्यथा streaming के दौरान reject होते हैं।

## Access control (DMs + groups)

DMs:

- Default: `channels.signal.dmPolicy = "pairing"`।
- Unknown senders को pairing code मिलता है; approved होने तक messages ignore किए जाते हैं (codes 1 hour के बाद expire होते हैं)।
- इसके ज़रिए approve करें:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Pairing Signal DMs के लिए default token exchange है। Details: [पेयरिंग](/hi/channels/pairing)
- UUID-only senders (`sourceUuid` से) `channels.signal.allowFrom` में `uuid:<id>` के रूप में stored होते हैं।

Groups:

- `channels.signal.groupPolicy = open | allowlist | disabled`।
- `allowlist` set होने पर `channels.signal.groupAllowFrom` नियंत्रित करता है कि कौन से groups या senders group replies trigger कर सकते हैं; entries Signal group IDs (raw, `group:<id>`, या `signal:group:<id>`), sender phone numbers, `uuid:<id>` values, या `*` हो सकती हैं।
- `channels.signal.groups["<group-id>" | "*"]` group behavior को `requireMention`, `tools`, और `toolsBySender` के साथ override कर सकता है।
- Multi-account setups में per-account overrides के लिए `channels.signal.accounts.<id>.groups` इस्तेमाल करें।
- `groupAllowFrom` के ज़रिए Signal group को allowlist करने से mention gating अपने आप disable नहीं होती। विशेष रूप से configured `channels.signal.groups["<group-id>"]` entry हर group message process करती है जब तक `requireMention=true` set न हो।
- Runtime note: यदि `channels.signal` पूरी तरह missing है, तो runtime group checks के लिए `groupPolicy="allowlist"` पर fallback करता है (भले ही `channels.defaults.groupPolicy` set हो)।

## यह कैसे काम करता है (behavior)

- Native mode: `signal-cli` daemon के रूप में run होता है; gateway SSE के ज़रिए events पढ़ता है।
- Container mode: gateway REST API के ज़रिए sends करता है और WebSocket के ज़रिए receives करता है।
- Inbound messages shared channel envelope में normalized होते हैं।
- Replies हमेशा उसी number या group पर वापस route होती हैं।

## Media + limits

- Outbound text `channels.signal.textChunkLimit` (default 4000) तक chunk किया जाता है।
- वैकल्पिक newline chunking: length chunking से पहले blank lines (paragraph boundaries) पर split करने के लिए `channels.signal.chunkMode="newline"` set करें।
- Attachments supported हैं (`signal-cli` से base64 fetched)।
- जब `contentType` missing हो, तो voice-note attachments MIME fallback के रूप में `signal-cli` filename इस्तेमाल करते हैं, ताकि audio transcription फिर भी AAC voice memos classify कर सके।
- Default media cap: `channels.signal.mediaMaxMb` (default 8)।
- Media downloading skip करने के लिए `channels.signal.ignoreAttachments` इस्तेमाल करें।
- Group history context `channels.signal.historyLimit` (या `channels.signal.accounts.*.historyLimit`) इस्तेमाल करता है, और fallback के रूप में `messages.groupChat.historyLimit` लेता है। Disable करने के लिए `0` set करें (default 50)।

## Typing + read receipts

- **टाइपिंग संकेतक**: OpenClaw `signal-cli sendTyping` के माध्यम से टाइपिंग सिग्नल भेजता है और जवाब चलते समय उन्हें रीफ़्रेश करता है।
- **पठन रसीदें**: जब `channels.signal.sendReadReceipts` true हो, OpenClaw अनुमति प्राप्त DM के लिए पठन रसीदें अग्रेषित करता है।
- signal-cli समूहों के लिए पठन रसीदें उपलब्ध नहीं कराता।

## प्रतिक्रियाएँ (संदेश टूल)

- `channel=signal` के साथ `message action=react` का उपयोग करें।
- लक्ष्य: प्रेषक E.164 या UUID (पेयरिंग आउटपुट से `uuid:<id>` उपयोग करें; खाली UUID भी काम करता है)।
- `messageId` उस संदेश का Signal टाइमस्टैम्प है जिस पर आप प्रतिक्रिया दे रहे हैं।
- समूह प्रतिक्रियाओं के लिए `targetAuthor` या `targetAuthorUuid` आवश्यक है।

उदाहरण:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

कॉन्फ़िगरेशन:

- `channels.signal.actions.reactions`: प्रतिक्रिया कार्रवाइयाँ सक्षम/अक्षम करें (डिफ़ॉल्ट true)।
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`।
  - `off`/`ack` एजेंट प्रतिक्रियाएँ अक्षम करता है (संदेश टूल `react` त्रुटि देगा)।
  - `minimal`/`extensive` एजेंट प्रतिक्रियाएँ सक्षम करता है और मार्गदर्शन स्तर सेट करता है।
- प्रति-खाता ओवरराइड: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`।

## अनुमोदन प्रतिक्रियाएँ

Signal exec और Plugin अनुमोदन प्रॉम्प्ट शीर्ष-स्तरीय `approvals.exec` और
`approvals.plugin` रूटिंग ब्लॉक का उपयोग करते हैं। Signal में
`channels.signal.execApprovals` ब्लॉक नहीं होता।

- `👍` एक बार अनुमोदित करता है।
- `👎` अस्वीकार करता है।
- जब कोई अनुरोध स्थायी अनुमोदन देता हो, तो `/approve <id> allow-always` उपयोग करें।

अनुमोदन प्रतिक्रिया समाधान के लिए `channels.signal.allowFrom`, `channels.signal.defaultTo`, या मेल खाने वाले खाता-स्तरीय फ़ील्ड से स्पष्ट Signal अनुमोदक आवश्यक हैं।
सीधे उसी-चैट exec अनुमोदन प्रॉम्प्ट स्पष्ट अनुमोदकों के बिना भी डुप्लिकेट स्थानीय `/approve` फ़ॉलबैक को दबा सकते हैं; बिना-अनुमोदक समूह अनुमोदन स्थानीय फ़ॉलबैक को दृश्यमान रखते हैं।

## डिलीवरी लक्ष्य (CLI/Cron)

- DM: `signal:+15551234567` (या साधारण E.164)।
- UUID DM: `uuid:<id>` (या खाली UUID)।
- समूह: `signal:group:<groupId>`।
- उपयोगकर्ता नाम: `username:<name>` (यदि आपके Signal खाते द्वारा समर्थित हो)।

## समस्या निवारण

पहले यह क्रम चलाएँ:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

फिर आवश्यकता होने पर DM पेयरिंग स्थिति की पुष्टि करें:

```bash
openclaw pairing list signal
```

सामान्य विफलताएँ:

- डेमन पहुँच योग्य है लेकिन कोई जवाब नहीं: खाता/डेमन सेटिंग्स (`httpUrl`, `account`) और प्राप्ति मोड सत्यापित करें।
- DM अनदेखे: प्रेषक पेयरिंग अनुमोदन की प्रतीक्षा में है।
- समूह संदेश अनदेखे: समूह प्रेषक/उल्लेख गेटिंग डिलीवरी रोकती है।
- संपादन के बाद कॉन्फ़िगरेशन सत्यापन त्रुटियाँ: `openclaw doctor --fix` चलाएँ।
- निदान में Signal गायब: `channels.signal.enabled: true` की पुष्टि करें।

अतिरिक्त जाँचें:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

प्राथमिक छंटाई प्रवाह के लिए: [/channels/troubleshooting](/hi/channels/troubleshooting)।

## सुरक्षा नोट्स

- `signal-cli` खाता कुंजियाँ स्थानीय रूप से संग्रहीत करता है (आम तौर पर `~/.local/share/signal-cli/data/`)।
- सर्वर माइग्रेशन या पुनर्निर्माण से पहले Signal खाता स्थिति का बैकअप लें।
- `channels.signal.dmPolicy: "pairing"` रखें, जब तक आप स्पष्ट रूप से व्यापक DM पहुँच नहीं चाहते।
- SMS सत्यापन केवल पंजीकरण या रिकवरी प्रवाह के लिए आवश्यक है, लेकिन नंबर/खाते का नियंत्रण खोने से दोबारा पंजीकरण जटिल हो सकता है।

## कॉन्फ़िगरेशन संदर्भ (Signal)

पूर्ण कॉन्फ़िगरेशन: [कॉन्फ़िगरेशन](/hi/gateway/configuration)

प्रदाता विकल्प:

- `channels.signal.enabled`: चैनल स्टार्टअप सक्षम/अक्षम करें।
- `channels.signal.apiMode`: `auto | native | container` (डिफ़ॉल्ट: auto)। [कंटेनर मोड](#container-mode-bbernhardsignal-cli-rest-api) देखें।
- `channels.signal.account`: बॉट खाते के लिए E.164।
- `channels.signal.cliPath`: `signal-cli` का पथ।
- `channels.signal.configPath`: वैकल्पिक `signal-cli --config` डायरेक्टरी।
- `channels.signal.httpUrl`: पूर्ण डेमन URL (host/port को ओवरराइड करता है)।
- `channels.signal.httpHost`, `channels.signal.httpPort`: डेमन बाइंड (डिफ़ॉल्ट 127.0.0.1:8080)।
- `channels.signal.autoStart`: डेमन को अपने-आप स्पॉन करें (यदि `httpUrl` सेट नहीं है तो डिफ़ॉल्ट true)।
- `channels.signal.startupTimeoutMs`: ms में स्टार्टअप प्रतीक्षा टाइमआउट (सीमा 120000)।
- `channels.signal.receiveMode`: `on-start | manual`।
- `channels.signal.ignoreAttachments`: अटैचमेंट डाउनलोड छोड़ें।
- `channels.signal.ignoreStories`: डेमन से स्टोरीज़ अनदेखी करें।
- `channels.signal.sendReadReceipts`: पठन रसीदें अग्रेषित करें।
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (डिफ़ॉल्ट: pairing)।
- `channels.signal.allowFrom`: DM allowlist (E.164 या `uuid:<id>`)। `open` के लिए `"*"` आवश्यक है। Signal में उपयोगकर्ता नाम नहीं होते; फ़ोन/UUID आईडी उपयोग करें।
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (डिफ़ॉल्ट: allowlist)।
- `channels.signal.groupAllowFrom`: समूह allowlist; Signal समूह ID (raw, `group:<id>`, या `signal:group:<id>`), प्रेषक E.164 नंबर, या `uuid:<id>` मान स्वीकार करता है।
- `channels.signal.groups`: Signal समूह id (या `"*"`) द्वारा keyed प्रति-समूह ओवरराइड। समर्थित फ़ील्ड: `requireMention`, `tools`, `toolsBySender`।
- `channels.signal.accounts.<id>.groups`: बहु-खाता सेटअप के लिए `channels.signal.groups` का प्रति-खाता संस्करण।
- `channels.signal.historyLimit`: संदर्भ के रूप में शामिल किए जाने वाले अधिकतम समूह संदेश (0 अक्षम करता है)।
- `channels.signal.dmHistoryLimit`: उपयोगकर्ता टर्न में DM इतिहास सीमा। प्रति-उपयोगकर्ता ओवरराइड: `channels.signal.dms["<phone_or_uuid>"].historyLimit`।
- `channels.signal.textChunkLimit`: आउटबाउंड खंड आकार (वर्ण)।
- `channels.signal.chunkMode`: लंबाई खंडन से पहले खाली पंक्तियों (पैराग्राफ सीमाओं) पर विभाजित करने के लिए `length` (डिफ़ॉल्ट) या `newline`।
- `channels.signal.mediaMaxMb`: इनबाउंड/आउटबाउंड मीडिया सीमा (MB)।

संबंधित वैश्विक विकल्प:

- `agents.list[].groupChat.mentionPatterns` (Signal मूल उल्लेखों का समर्थन नहीं करता)।
- `messages.groupChat.mentionPatterns` (वैश्विक फ़ॉलबैक)।
- `messages.responsePrefix`।

## संबंधित

- [चैनलों का अवलोकन](/hi/channels) — सभी समर्थित चैनल
- [पेयरिंग](/hi/channels/pairing) — DM प्रमाणीकरण और पेयरिंग प्रवाह
- [समूह](/hi/channels/groups) — समूह चैट व्यवहार और उल्लेख गेटिंग
- [चैनल रूटिंग](/hi/channels/channel-routing) — संदेशों के लिए सत्र रूटिंग
- [सुरक्षा](/hi/gateway/security) — पहुँच मॉडल और हार्डनिंग
