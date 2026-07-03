---
read_when:
    - Signal समर्थन सेट अप करना
    - Signal भेजने/प्राप्त करने की डीबगिंग
summary: signal-cli (नेटिव daemon या bbernhard container), सेटअप पाथ, और नंबर मॉडल के जरिए Signal समर्थन
title: Signal
x-i18n:
    generated_at: "2026-07-03T15:25:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 862afe3764e89aa026d245f57134b8e8e157539f24975ca341d67296fb8852d0
    source_path: channels/signal.md
    workflow: 16
---

स्थिति: बाहरी CLI एकीकरण। Gateway `signal-cli` से HTTP पर बात करता है — या तो नेटिव डेमन (JSON-RPC + SSE) या bbernhard/signal-cli-rest-api कंटेनर (REST + WebSocket)।

## पूर्वापेक्षाएँ

- आपके सर्वर पर OpenClaw इंस्टॉल हो (नीचे दिया गया Linux फ्लो Ubuntu 24 पर परीक्षण किया गया है)।
- इनमें से एक:
  - होस्ट पर `signal-cli` उपलब्ध हो (नेटिव मोड), **या**
  - `bbernhard/signal-cli-rest-api` Docker कंटेनर (कंटेनर मोड)।
- ऐसा फ़ोन नंबर जो एक सत्यापन SMS प्राप्त कर सके (SMS पंजीकरण पथ के लिए)।
- पंजीकरण के दौरान Signal captcha (`signalcaptchas.org`) के लिए ब्राउज़र एक्सेस।

## त्वरित सेटअप (शुरुआती)

1. बॉट के लिए **अलग Signal नंबर** इस्तेमाल करें (अनुशंसित)।
2. OpenClaw Plugin इंस्टॉल करें:

```bash
openclaw plugins install @openclaw/signal
```

3. `signal-cli` इंस्टॉल करें (यदि आप JVM बिल्ड इस्तेमाल करते हैं तो Java आवश्यक है)।
4. एक सेटअप पथ चुनें:
   - **पथ A (QR लिंक):** `signal-cli link -n "OpenClaw"` और Signal से स्कैन करें।
   - **पथ B (SMS पंजीकरण):** captcha + SMS सत्यापन के साथ एक समर्पित नंबर पंजीकृत करें।
5. OpenClaw कॉन्फ़िगर करें और gateway रीस्टार्ट करें।
6. पहला DM भेजें और पेयरिंग स्वीकृत करें (`openclaw pairing approve signal <CODE>`)।

न्यूनतम कॉन्फ़िग:

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

फ़ील्ड संदर्भ:

| फ़ील्ड        | विवरण                                       |
| ------------ | ------------------------------------------------- |
| `account`    | E.164 फ़ॉर्मैट में बॉट फ़ोन नंबर (`+15551234567`) |
| `cliPath`    | `signal-cli` का पथ (`PATH` पर हो तो `signal-cli`)  |
| `configPath` | `--config` के रूप में पास की गई signal-cli कॉन्फ़िग dir        |
| `dmPolicy`   | DM एक्सेस नीति (`pairing` अनुशंसित)          |
| `allowFrom`  | DM की अनुमति वाले फ़ोन नंबर या `uuid:<id>` मान |

## यह क्या है

- `signal-cli` के माध्यम से Signal चैनल (एम्बेडेड libsignal नहीं)।
- निर्धारक रूटिंग: जवाब हमेशा Signal पर ही वापस जाते हैं।
- DMs एजेंट का मुख्य सेशन साझा करते हैं; समूह अलग-थलग होते हैं (`agent:<agentId>:signal:group:<groupId>`)।

## कॉन्फ़िग लेखन

डिफ़ॉल्ट रूप से, Signal को `/config set|unset` से ट्रिगर हुए कॉन्फ़िग अपडेट लिखने की अनुमति होती है (`commands.config: true` आवश्यक है)।

इससे अक्षम करें:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## नंबर मॉडल (महत्वपूर्ण)

- Gateway एक **Signal डिवाइस** (`signal-cli` अकाउंट) से कनेक्ट करता है।
- यदि आप बॉट को **अपने व्यक्तिगत Signal अकाउंट** पर चलाते हैं, तो यह आपके अपने संदेशों को अनदेखा करेगा (लूप सुरक्षा)।
- "मैं बॉट को टेक्स्ट करूँ और वह जवाब दे" के लिए, **अलग बॉट नंबर** इस्तेमाल करें।

## सेटअप पथ A: मौजूदा Signal अकाउंट लिंक करें (QR)

1. `signal-cli` इंस्टॉल करें (JVM या नेटिव बिल्ड)।
2. बॉट अकाउंट लिंक करें:
   - `signal-cli link -n "OpenClaw"` फिर Signal में QR स्कैन करें।
3. Signal कॉन्फ़िगर करें और gateway शुरू करें।

उदाहरण:

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

मल्टी-अकाउंट समर्थन: प्रति-अकाउंट कॉन्फ़िग और वैकल्पिक `name` के साथ `channels.signal.accounts` इस्तेमाल करें। साझा पैटर्न के लिए [`gateway/configuration`](/hi/gateway/config-channels#multi-account-all-channels) देखें।

## सेटअप पथ B: समर्पित बॉट नंबर पंजीकृत करें (SMS, Linux)

जब आप किसी मौजूदा Signal ऐप अकाउंट को लिंक करने के बजाय समर्पित बॉट नंबर चाहते हों, तब इसका इस्तेमाल करें।

1. ऐसा नंबर लें जो SMS प्राप्त कर सके (या लैंडलाइन के लिए वॉइस सत्यापन)।
   - अकाउंट/सेशन टकराव से बचने के लिए समर्पित बॉट नंबर इस्तेमाल करें।
2. Gateway होस्ट पर `signal-cli` इंस्टॉल करें:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

यदि आप JVM बिल्ड (`signal-cli-${VERSION}.tar.gz`) इस्तेमाल करते हैं, तो पहले JRE 25+ इंस्टॉल करें।
`signal-cli` को अपडेट रखें; upstream नोट करता है कि पुराने रिलीज़ Signal सर्वर APIs बदलने पर टूट सकते हैं।

3. नंबर पंजीकृत और सत्यापित करें:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

यदि captcha आवश्यक हो:

1. `https://signalcaptchas.org/registration/generate.html` खोलें।
2. captcha पूरा करें, "Open Signal" से `signalcaptcha://...` लिंक लक्ष्य कॉपी करें।
3. संभव हो तो ब्राउज़र सेशन जैसे बाहरी IP से ही चलाएँ।
4. तुरंत फिर से पंजीकरण चलाएँ (captcha टोकन जल्दी समाप्त हो जाते हैं):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw कॉन्फ़िगर करें, gateway रीस्टार्ट करें, चैनल सत्यापित करें:

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. अपने DM प्रेषक को पेयर करें:
   - बॉट नंबर पर कोई भी संदेश भेजें।
   - सर्वर पर कोड स्वीकृत करें: `openclaw pairing approve signal <PAIRING_CODE>`।
   - "Unknown contact" से बचने के लिए बॉट नंबर को अपने फ़ोन में संपर्क के रूप में सेव करें।

<Warning>
`signal-cli` के साथ फ़ोन नंबर अकाउंट पंजीकृत करने से उस नंबर का मुख्य Signal ऐप सेशन डी-ऑथेंटिकेट हो सकता है। समर्पित बॉट नंबर को प्राथमिकता दें, या यदि आपको अपना मौजूदा फ़ोन ऐप सेटअप बनाए रखना है तो QR लिंक मोड इस्तेमाल करें।
</Warning>

Upstream संदर्भ:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captcha फ्लो: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- लिंकिंग फ्लो: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## बाहरी डेमन मोड (httpUrl)

यदि आप `signal-cli` स्वयं प्रबंधित करना चाहते हैं (धीमे JVM कोल्ड स्टार्ट, कंटेनर init, या साझा CPUs), तो डेमन अलग से चलाएँ और OpenClaw को उसकी ओर इंगित करें:

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

यह auto-spawn और OpenClaw के अंदर startup wait को छोड़ देता है। auto-spawn करते समय धीमे स्टार्ट के लिए `channels.signal.startupTimeoutMs` सेट करें।

## कंटेनर मोड (bbernhard/signal-cli-rest-api)

`signal-cli` को नेटिव रूप से चलाने के बजाय, आप [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) Docker कंटेनर इस्तेमाल कर सकते हैं। यह `signal-cli` को REST API और WebSocket इंटरफ़ेस के पीछे रैप करता है।

आवश्यकताएँ:

- रियल-टाइम संदेश प्राप्ति के लिए कंटेनर **`MODE=json-rpc` के साथ ही** चलना चाहिए।
- OpenClaw कनेक्ट करने से पहले कंटेनर के अंदर अपना Signal अकाउंट पंजीकृत या लिंक करें।

उदाहरण `docker-compose.yml` सेवा:

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

OpenClaw कॉन्फ़िग:

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

`apiMode` फ़ील्ड नियंत्रित करता है कि OpenClaw कौन-सा प्रोटोकॉल इस्तेमाल करता है:

| मान         | व्यवहार                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (डिफ़ॉल्ट) दोनों transports को probe करता है; streaming कंटेनर WebSocket receive को सत्यापित करती है    |
| `"native"`    | नेटिव signal-cli को बाध्य करें (`/api/v1/rpc` पर JSON-RPC, `/api/v1/events` पर SSE)         |
| `"container"` | bbernhard कंटेनर को बाध्य करें (`/v2/send` पर REST, `/v1/receive/{account}` पर WebSocket) |

जब `apiMode` `"auto"` होता है, OpenClaw दोहराए गए probes से बचने के लिए पहचाने गए मोड को 30 सेकंड के लिए कैश करता है। कंटेनर receive केवल streaming के लिए तब चुना जाता है जब `/v1/receive/{account}` WebSocket में upgrade हो जाए, जिसके लिए `MODE=json-rpc` आवश्यक है।

कंटेनर मोड वही Signal चैनल ऑपरेशन समर्थित करता है जो नेटिव मोड करता है, जहाँ कंटेनर मिलते-जुलते APIs expose करता है: भेजना, प्राप्त करना, attachments, typing indicators, read/viewed receipts, reactions, groups, और styled text। OpenClaw अपने नेटिव Signal RPC कॉल को कंटेनर के REST payloads में अनुवाद करता है, जिसमें `group.{base64(internal_id)}` group IDs और formatted text के लिए `text_mode: "styled"` शामिल हैं।

संचालन नोट्स:

- कंटेनर मोड के साथ `autoStart: false` इस्तेमाल करें। `apiMode: "container"` चुने जाने पर OpenClaw को नेटिव डेमन spawn नहीं करना चाहिए।
- प्राप्ति के लिए `MODE=json-rpc` इस्तेमाल करें। `MODE=normal` `/v1/about` को healthy दिखा सकता है, लेकिन `/v1/receive/{account}` WebSocket-upgrade नहीं करता, इसलिए OpenClaw `auto` मोड में कंटेनर receive streaming नहीं चुनेगा।
- जब आपको पता हो कि `httpUrl` bbernhard के REST API की ओर इशारा करता है, तब `apiMode: "container"` सेट करें। जब आपको पता हो कि यह नेटिव `signal-cli` JSON-RPC/SSE की ओर इशारा करता है, तब `apiMode: "native"` सेट करें। जब deployment बदल सकता हो, तब `"auto"` इस्तेमाल करें।
- कंटेनर attachment downloads नेटिव मोड जैसी ही media byte limits का सम्मान करते हैं। जब सर्वर `Content-Length` भेजता है तो oversized responses पूरी तरह buffer होने से पहले reject हो जाते हैं, और अन्यथा streaming के दौरान।

## एक्सेस नियंत्रण (DMs + groups)

DMs:

- डिफ़ॉल्ट: `channels.signal.dmPolicy = "pairing"`।
- अज्ञात प्रेषकों को pairing code मिलता है; संदेश स्वीकृत होने तक अनदेखा किए जाते हैं (codes 1 घंटे बाद समाप्त हो जाते हैं)।
- इसके माध्यम से स्वीकृत करें:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Pairing Signal DMs के लिए डिफ़ॉल्ट token exchange है। विवरण: [Pairing](/hi/channels/pairing)
- UUID-only प्रेषक (`sourceUuid` से) `channels.signal.allowFrom` में `uuid:<id>` के रूप में stored होते हैं।

समूह:

- `channels.signal.groupPolicy = open | allowlist | disabled`।
- `allowlist` सेट होने पर `channels.signal.groupAllowFrom` नियंत्रित करता है कि कौन-से groups या senders group replies ट्रिगर कर सकते हैं; entries Signal group IDs (raw, `group:<id>`, या `signal:group:<id>`), sender phone numbers, `uuid:<id>` values, या `*` हो सकती हैं।
- `channels.signal.groups["<group-id>" | "*"]` `requireMention`, `tools`, और `toolsBySender` के साथ group behavior override कर सकता है।
- multi-account setups में per-account overrides के लिए `channels.signal.accounts.<id>.groups` इस्तेमाल करें।
- `groupAllowFrom` के माध्यम से Signal group को allowlist करने से mention gating अपने-आप disable नहीं होती। विशेष रूप से configured `channels.signal.groups["<group-id>"]` entry हर group message process करती है, जब तक `requireMention=true` सेट न हो।
- Runtime नोट: यदि `channels.signal` पूरी तरह missing है, तो runtime group checks के लिए `groupPolicy="allowlist"` पर fallback करता है (भले ही `channels.defaults.groupPolicy` सेट हो)।

## यह कैसे काम करता है (व्यवहार)

- नेटिव मोड: `signal-cli` डेमन के रूप में चलता है; gateway SSE के माध्यम से events पढ़ता है।
- कंटेनर मोड: gateway REST API के माध्यम से भेजता है और WebSocket के माध्यम से प्राप्त करता है।
- आने वाले संदेश साझा channel envelope में normalize किए जाते हैं।
- जवाब हमेशा उसी नंबर या group पर वापस route होते हैं।

## मीडिया + सीमाएँ

- Outbound text को `channels.signal.textChunkLimit` तक chunk किया जाता है (डिफ़ॉल्ट 4000)।
- वैकल्पिक newline chunking: length chunking से पहले blank lines (paragraph boundaries) पर split करने के लिए `channels.signal.chunkMode="newline"` सेट करें।
- Attachments समर्थित हैं (`signal-cli` से base64 fetched)।
- जब `contentType` missing हो, तो voice-note attachments MIME fallback के रूप में `signal-cli` filename इस्तेमाल करते हैं, ताकि audio transcription अब भी AAC voice memos classify कर सके।
- डिफ़ॉल्ट media cap: `channels.signal.mediaMaxMb` (डिफ़ॉल्ट 8)।
- media download करना skip करने के लिए `channels.signal.ignoreAttachments` इस्तेमाल करें।
- Group history context `channels.signal.historyLimit` (या `channels.signal.accounts.*.historyLimit`) इस्तेमाल करता है, और fallback करके `messages.groupChat.historyLimit` पर जाता है। disable करने के लिए `0` सेट करें (डिफ़ॉल्ट 50)।

## Typing + read receipts

- **टाइपिंग संकेतक**: OpenClaw `signal-cli sendTyping` के माध्यम से टाइपिंग संकेत भेजता है और जवाब चलने के दौरान उन्हें ताज़ा करता है।
- **रीड रसीदें**: जब `channels.signal.sendReadReceipts` true हो, OpenClaw अनुमत DMs के लिए रीड रसीदें आगे भेजता है।
- Signal-cli समूहों के लिए रीड रसीदें उपलब्ध नहीं कराता।

## जीवनचक्र स्थिति प्रतिक्रियाएं

Signal को इनबाउंड टर्न पर साझा
queued/thinking/tool/compaction/done/error प्रतिक्रिया जीवनचक्र दिखाने देने के लिए
`messages.statusReactions.enabled: true` सेट करें।
Signal इनबाउंड संदेश timestamp को प्रतिक्रिया लक्ष्य के रूप में उपयोग करता है; समूह
प्रतिक्रियाएं Signal समूह id और मूल प्रेषक को लक्ष्य लेखक के रूप में साथ भेजी जाती हैं।

स्थिति प्रतिक्रियाओं के लिए एक ack प्रतिक्रिया और मेल खाता
`messages.ackReactionScope` (`direct`, `group-all`, `group-mentions`, या `all`) भी चाहिए।
Signal स्थिति प्रतिक्रियाएं अक्षम करने के लिए `channels.signal.reactionLevel: "off"` सेट करें।
message-tool `react` कार्रवाई अधिक सख्त रहती है: इसके लिए
`reactionLevel: "minimal"` या `"extensive"` चाहिए।

`messages.removeAckAfterReply: true` कॉन्फ़िगर किए गए होल्ड समय के बाद अंतिम स्थिति प्रतिक्रिया साफ़ करता है।
अन्यथा Signal अंतिम done/error स्थिति के बाद प्रारंभिक ack प्रतिक्रिया बहाल करता है।

## प्रतिक्रियाएं (message tool)

- `channel=signal` के साथ `message action=react` उपयोग करें।
- लक्ष्य: प्रेषक E.164 या UUID (pairing आउटपुट से `uuid:<id>` उपयोग करें; bare UUID भी काम करता है)।
- `messageId` उस संदेश का Signal timestamp है जिस पर आप प्रतिक्रिया दे रहे हैं।
- समूह प्रतिक्रियाओं के लिए `targetAuthor` या `targetAuthorUuid` चाहिए।

उदाहरण:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

कॉन्फ़िग:

- `channels.signal.actions.reactions`: प्रतिक्रिया कार्रवाइयां सक्षम/अक्षम करें (डिफ़ॉल्ट true)।
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`।
  - `off`/`ack` एजेंट प्रतिक्रियाएं अक्षम करता है (message tool `react` त्रुटि देगा)।
  - `minimal`/`extensive` एजेंट प्रतिक्रियाएं सक्षम करता है और मार्गदर्शन स्तर सेट करता है।
- प्रति-खाता ओवरराइड: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`।

## स्वीकृति प्रतिक्रियाएं

Signal exec और Plugin स्वीकृति prompts शीर्ष-स्तरीय `approvals.exec` और
`approvals.plugin` routing blocks उपयोग करते हैं। Signal में
`channels.signal.execApprovals` block नहीं है।

- `👍` एक बार स्वीकृत करता है।
- `👎` अस्वीकार करता है।
- जब कोई अनुरोध स्थायी स्वीकृति प्रदान करे, तो `/approve <id> allow-always` उपयोग करें।

स्वीकृति प्रतिक्रिया समाधान के लिए `channels.signal.allowFrom`, `channels.signal.defaultTo`,
या मेल खाते account-level fields से स्पष्ट Signal approvers चाहिए।
Direct same-chat exec approval prompts स्पष्ट approvers के बिना भी duplicate local `/approve` fallback
को दबा सकते हैं; no-approver group approvals local fallback को दृश्यमान रखते हैं।

## डिलीवरी लक्ष्य (CLI/cron)

- DMs: `signal:+15551234567` (या plain E.164)।
- UUID DMs: `uuid:<id>` (या bare UUID)।
- समूह: `signal:group:<groupId>`।
- Usernames: `username:<name>` (यदि आपके Signal खाते द्वारा समर्थित हो)।

## उपनाम

जब आप बार-बार उपयोग होने वाले Signal लक्ष्यों के लिए स्थिर नाम चाहते हों, तो aliases कॉन्फ़िगर करें।
Aliases केवल OpenClaw-side config हैं; वे Signal contacts बनाते या संपादित नहीं करते।

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
        jane: "uuid:123e4567-e89b-12d3-a456-426614174000",
        ops: "group:<groupId>",
      },
      defaultTo: "signal:me",
    },
  },
}
```

जहां भी Signal delivery targets स्वीकार किए जाते हैं, aliases उपयोग करें:

```bash
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
```

Per-account aliases शीर्ष-स्तरीय aliases विरासत में लेते हैं और नाम जोड़ या override कर सकते हैं:

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
      },
      accounts: {
        work: {
          aliases: {
            ops: "group:<workGroupId>",
          },
        },
      },
    },
  },
}
```

`openclaw directory peers list --channel signal` और
`openclaw directory groups list --channel signal` कॉन्फ़िगर किए गए aliases सूचीबद्ध करते हैं। Signal
directory config-backed है; यह Signal contacts को live-query नहीं करती या
Signal खाते को बदलती नहीं है।

## समस्या निवारण

पहले यह ladder चलाएं:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

फिर जरूरत हो तो DM pairing स्थिति की पुष्टि करें:

```bash
openclaw pairing list signal
```

सामान्य विफलताएं:

- Daemon पहुंच योग्य है लेकिन जवाब नहीं: account/daemon settings (`httpUrl`, `account`) और receive mode सत्यापित करें।
- DMs अनदेखे: प्रेषक pairing approval लंबित है।
- समूह संदेश अनदेखे: group sender/mention gating delivery रोकती है।
- संपादन के बाद config validation errors: `openclaw doctor --fix` चलाएं।
- diagnostics से Signal गायब: `channels.signal.enabled: true` की पुष्टि करें।

अतिरिक्त जांचें:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

triage flow के लिए: [/channels/troubleshooting](/hi/channels/troubleshooting)।

## सुरक्षा नोट्स

- `signal-cli` account keys स्थानीय रूप से संग्रहीत करता है (आमतौर पर `~/.local/share/signal-cli/data/`)।
- server migration या rebuild से पहले Signal account state का backup लें।
- जब तक आप स्पष्ट रूप से व्यापक DM access नहीं चाहते, `channels.signal.dmPolicy: "pairing"` रखें।
- SMS verification केवल registration या recovery flows के लिए आवश्यक है, लेकिन number/account पर नियंत्रण खोना re-registration को जटिल बना सकता है।

## कॉन्फ़िगरेशन संदर्भ (Signal)

पूर्ण कॉन्फ़िगरेशन: [कॉन्फ़िगरेशन](/hi/gateway/configuration)

Provider विकल्प:

- `channels.signal.enabled`: channel startup सक्षम/अक्षम करें।
- `channels.signal.apiMode`: `auto | native | container` (डिफ़ॉल्ट: auto)। [Container mode](#container-mode-bbernhardsignal-cli-rest-api) देखें।
- `channels.signal.account`: bot account के लिए E.164।
- `channels.signal.cliPath`: `signal-cli` का path।
- `channels.signal.configPath`: वैकल्पिक `signal-cli --config` directory।
- `channels.signal.httpUrl`: पूरा daemon URL (host/port override करता है)।
- `channels.signal.httpHost`, `channels.signal.httpPort`: daemon bind (डिफ़ॉल्ट 127.0.0.1:8080)।
- `channels.signal.autoStart`: daemon auto-spawn करें (यदि `httpUrl` unset हो तो डिफ़ॉल्ट true)।
- `channels.signal.startupTimeoutMs`: startup wait timeout ms में (cap 120000)।
- `channels.signal.receiveMode`: `on-start | manual`।
- `channels.signal.ignoreAttachments`: attachment downloads छोड़ें।
- `channels.signal.ignoreStories`: daemon से stories अनदेखी करें।
- `channels.signal.sendReadReceipts`: read receipts आगे भेजें।
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (डिफ़ॉल्ट: pairing)।
- `channels.signal.allowFrom`: DM allowlist (E.164 या `uuid:<id>`)। `open` के लिए `"*"` चाहिए। Signal में usernames नहीं हैं; phone/UUID ids उपयोग करें।
- `channels.signal.aliases`: DM या group delivery targets के लिए OpenClaw-side aliases।
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (डिफ़ॉल्ट: allowlist)।
- `channels.signal.groupAllowFrom`: group allowlist; Signal group IDs (raw, `group:<id>`, या `signal:group:<id>`), sender E.164 numbers, या `uuid:<id>` values स्वीकार करता है।
- `channels.signal.groups`: Signal group id (या `"*"`) से keyed per-group overrides। समर्थित fields: `requireMention`, `tools`, `toolsBySender`।
- `channels.signal.accounts.<id>.groups`: multi-account setups के लिए `channels.signal.groups` का per-account version।
- `channels.signal.accounts.<id>.aliases`: per-account aliases, top-level aliases के साथ merged।
- `channels.signal.historyLimit`: context के रूप में शामिल करने के लिए max group messages (0 अक्षम करता है)।
- `channels.signal.dmHistoryLimit`: user turns में DM history limit। Per-user overrides: `channels.signal.dms["<phone_or_uuid>"].historyLimit`।
- `channels.signal.textChunkLimit`: outbound chunk size (chars)।
- `channels.signal.chunkMode`: length chunking से पहले blank lines (paragraph boundaries) पर split करने के लिए `length` (डिफ़ॉल्ट) या `newline`।
- `channels.signal.mediaMaxMb`: inbound/outbound media cap (MB)।

संबंधित global विकल्प:

- `agents.list[].groupChat.mentionPatterns` (Signal native mentions का समर्थन नहीं करता)।
- `messages.groupChat.mentionPatterns` (global fallback)।
- `messages.responsePrefix`।

## संबंधित

- [Channels Overview](/hi/channels) — सभी समर्थित channels
- [Pairing](/hi/channels/pairing) — DM authentication और pairing flow
- [Groups](/hi/channels/groups) — group chat behavior और mention gating
- [Channel Routing](/hi/channels/channel-routing) — messages के लिए session routing
- [Security](/hi/gateway/security) — access model और hardening
