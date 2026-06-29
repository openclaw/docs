---
read_when:
    - OpenClaw में Matrix सेट अप करना
    - Matrix E2EE और सत्यापन कॉन्फ़िगर करना
summary: Matrix समर्थन स्थिति, सेटअप, और कॉन्फ़िगरेशन उदाहरण
title: Matrix
x-i18n:
    generated_at: "2026-06-28T22:36:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1291273746e364fb0ca7eafbde3d717ee555c3edfa576eab4fdd3d0048ceedd
    source_path: channels/matrix.md
    workflow: 16
---

Matrix OpenClaw के लिए डाउनलोड करने योग्य चैनल Plugin है।
यह आधिकारिक `matrix-js-sdk` का उपयोग करता है और DMs, रूम, थ्रेड, मीडिया, प्रतिक्रियाएं, पोल, लोकेशन, और E2EE का समर्थन करता है।

## इंस्टॉल करें

चैनल कॉन्फ़िगर करने से पहले ClawHub से Matrix इंस्टॉल करें:

```bash
openclaw plugins install @openclaw/matrix
```

बिना उपसर्ग वाले Plugin specs पहले ClawHub आज़माते हैं, फिर npm fallback। registry स्रोत को बाध्य करने के लिए, `openclaw plugins install clawhub:@openclaw/matrix` या `openclaw plugins install npm:@openclaw/matrix` का उपयोग करें।

स्थानीय checkout से:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` Plugin को रजिस्टर और सक्षम करता है, इसलिए अलग से `openclaw plugins enable matrix` चरण की आवश्यकता नहीं है। नीचे चैनल कॉन्फ़िगर करने तक Plugin फिर भी कुछ नहीं करता। सामान्य Plugin व्यवहार और इंस्टॉल नियमों के लिए [Plugins](/hi/tools/plugin) देखें।

## सेटअप

1. अपने homeserver पर Matrix खाता बनाएं।
2. `channels.matrix` को या तो `homeserver` + `accessToken`, या `homeserver` + `userId` + `password` के साथ कॉन्फ़िगर करें।
3. Gateway रीस्टार्ट करें।
4. bot के साथ DM शुरू करें, या उसे किसी रूम में आमंत्रित करें ([auto-join](#auto-join) देखें - नए आमंत्रण केवल तब आते हैं जब `autoJoin` उन्हें अनुमति देता है)।

### इंटरैक्टिव सेटअप

```bash
openclaw channels add
openclaw configure --section channels
```

wizard ये पूछता है: homeserver URL, auth विधि (access token या password), user ID (केवल password auth), वैकल्पिक device name, E2EE सक्षम करना है या नहीं, और room access तथा auto-join कॉन्फ़िगर करना है या नहीं।

यदि मेल खाते `MATRIX_*` env vars पहले से मौजूद हैं और चुने गए खाते में saved auth नहीं है, तो wizard env-var shortcut प्रदान करता है। allowlist सहेजने से पहले room names resolve करने के लिए, `openclaw channels resolve --channel matrix "Project Room"` चलाएं। E2EE सक्षम होने पर, wizard config लिखता है और [`openclaw matrix encryption setup`](#encryption-and-verification) जैसा ही bootstrap चलाता है।

### न्यूनतम config

Token-based:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

Password-based (पहले login के बाद token cached हो जाता है):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

### Auto-join

`channels.matrix.autoJoin` का default `off` है। default के साथ, bot नए rooms या नए invites से आए DMs में तब तक दिखाई नहीं देगा जब तक आप manually join नहीं करते।

OpenClaw invite time पर यह नहीं बता सकता कि invited room DM है या group, इसलिए सभी invites - DM-style invites सहित - पहले `autoJoin` से गुजरते हैं। `dm.policy` केवल बाद में लागू होता है, जब bot join कर चुका हो और room classify हो चुका हो।

<Warning>
bot कौन से invites स्वीकार करता है इसे सीमित करने के लिए `autoJoin: "allowlist"` के साथ `autoJoinAllowlist` सेट करें, या हर invite स्वीकार करने के लिए `autoJoin: "always"` सेट करें।

`autoJoinAllowlist` केवल stable targets स्वीकार करता है: `!roomId:server`, `#alias:server`, या `*`। Plain room names अस्वीकार किए जाते हैं; alias entries homeserver के विरुद्ध resolve होती हैं, invited room द्वारा दावा किए गए state के विरुद्ध नहीं।
</Warning>

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": { requireMention: true },
      },
    },
  },
}
```

हर invite स्वीकार करने के लिए, `autoJoin: "always"` का उपयोग करें।

### Allowlist target formats

DM और room allowlists को stable IDs से भरना सबसे अच्छा है:

- DMs (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): `@user:server` का उपयोग करें। Display names default रूप से अनदेखे किए जाते हैं क्योंकि वे mutable होते हैं; `dangerouslyAllowNameMatching: true` केवल तब सेट करें जब आपको display-name entries के साथ स्पष्ट रूप से compatibility चाहिए।
- Room allowlist keys (`groups`, legacy `rooms`): `!room:server` या `#alias:server` का उपयोग करें। Plain room names default रूप से अनदेखे किए जाते हैं; `dangerouslyAllowNameMatching: true` केवल तब सेट करें जब आपको joined-room name lookup के साथ स्पष्ट रूप से compatibility चाहिए।
- Invite allowlists (`autoJoinAllowlist`): `!room:server`, `#alias:server`, या `*` का उपयोग करें। Plain room names अस्वीकार किए जाते हैं।

### Account ID normalization

wizard friendly name को normalized account ID में बदलता है। उदाहरण के लिए, `Ops Bot` `ops-bot` बन जाता है। scoped env-var names में punctuation escape किया जाता है ताकि दो accounts collide न कर सकें: `-` → `_X2D_`, इसलिए `ops-prod` `MATRIX_OPS_X2D_PROD_*` पर map होता है।

### Cached credentials

Matrix cached credentials को `~/.openclaw/credentials/matrix/` के अंतर्गत store करता है:

- default account: `credentials.json`
- named accounts: `credentials-<account>.json`

जब cached credentials वहां मौजूद होते हैं, OpenClaw Matrix को configured मानता है, भले ही access token config file में न हो - यह setup, `openclaw doctor`, और channel-status probes को cover करता है।

### Environment variables

तब उपयोग किए जाते हैं जब equivalent config key सेट नहीं है। default account unprefixed names का उपयोग करता है; named accounts suffix से पहले account ID inserted रखते हैं।

| Default account       | Named account (`<ID>` normalized account ID है) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

account `ops` के लिए, names `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, आदि बन जाते हैं। recovery-key env vars recovery-aware CLI flows (`verify backup restore`, `verify device`, `verify bootstrap`) द्वारा तब पढ़े जाते हैं जब आप key को `--recovery-key-stdin` के जरिए pipe करते हैं।

`MATRIX_HOMESERVER` को workspace `.env` से सेट नहीं किया जा सकता; [Workspace `.env` files](/hi/gateway/security) देखें।

## Configuration example

DM pairing, room allowlist, और E2EE के साथ practical baseline:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": { requireMention: true },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

## Streaming previews

Matrix reply streaming opt-in है। `streaming` नियंत्रित करता है कि OpenClaw in-flight assistant reply कैसे deliver करता है; `blockStreaming` नियंत्रित करता है कि हर completed block अपनी अलग Matrix message के रूप में preserve हो या नहीं।

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

live answer previews बनाए रखने लेकिन interim tool/progress lines छिपाने के लिए, object
form का उपयोग करें:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "partial",
        preview: {
          toolProgress: false,
        },
      },
    },
  },
}
```

| `streaming`       | व्यवहार                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (default) | पूरी reply की प्रतीक्षा करें, एक बार send करें। `true` ↔ `"partial"`, `false` ↔ `"off"`।                                                                                        |
| `"partial"`       | model के current block लिखते समय एक normal text message को in place edit करें। Stock Matrix clients पहली preview पर notify कर सकते हैं, final edit पर नहीं।              |
| `"quiet"`         | `"partial"` जैसा ही, लेकिन message non-notifying notice होती है। Recipients को notification केवल तब मिलता है जब per-user push rule finalized edit से match करे (नीचे देखें)। |

`blockStreaming`, `streaming` से independent है:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (default)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | current block के लिए live draft, completed blocks messages के रूप में रखे जाते हैं | current block के लिए live draft, in place finalized |
| `"off"`                 | प्रत्येक finished block के लिए एक notifying Matrix message                     | पूरी reply के लिए एक notifying Matrix message      |

Notes:

- यदि preview Matrix की per-event size limit से बढ़ जाती है, तो OpenClaw preview streaming रोक देता है और final-only delivery पर fallback करता है।
- Media replies हमेशा attachments को सामान्य रूप से send करती हैं। यदि stale preview अब safely reuse नहीं की जा सकती, तो OpenClaw final media reply भेजने से पहले उसे redact करता है।
- Matrix preview streaming active होने पर tool-progress preview updates default रूप से enabled होते हैं। answer text के लिए preview edits बनाए रखने लेकिन tool progress को normal delivery path पर छोड़ने के लिए `streaming.preview.toolProgress: false` सेट करें।
- Preview edits में अतिरिक्त Matrix API calls लगती हैं। यदि आप सबसे conservative rate-limit profile चाहते हैं तो `streaming: "off"` छोड़ें।

## Voice messages

Inbound Matrix voice notes को room mention gate से पहले transcribe किया जाता है। इससे ऐसा voice note जो bot name कहता है, `requireMention: true` room में agent को trigger कर सकता है, और यह agent को केवल audio attachment placeholder के बजाय transcript देता है।

Matrix `tools.media.audio` के अंतर्गत configured shared audio media provider का उपयोग करता है, जैसे OpenAI `gpt-4o-mini-transcribe`। provider setup और limits के लिए [Media tools overview](/hi/tools/media-overview) देखें।

Behavior details:

- `m.audio` events और `audio/*` MIME type वाले `m.file` events eligible हैं।
- encrypted rooms में, OpenClaw transcription से पहले existing Matrix media path के माध्यम से attachment decrypt करता है।
- transcript को agent prompt में machine-generated और untrusted के रूप में mark किया जाता है।
- attachment को already transcribed के रूप में mark किया जाता है ताकि downstream media tools वही voice note फिर से transcribe न करें।
- audio transcription को globally disable करने के लिए `tools.media.audio.enabled: false` सेट करें।

## Approval metadata

Matrix native approval prompts सामान्य `m.room.message` events हैं जिनमें `com.openclaw.approval` के अंतर्गत OpenClaw-specific custom event content होता है। Matrix custom event-content keys की अनुमति देता है, इसलिए stock clients अभी भी text body render करते हैं जबकि OpenClaw-aware clients structured approval id, kind, state, available decisions, और exec/plugin details पढ़ सकते हैं।

जब approval prompt एक Matrix event के लिए बहुत लंबा होता है, OpenClaw visible text को chunks में बांटता है और `com.openclaw.approval` केवल पहले chunk से attach करता है। allow/deny decisions के लिए reactions उसी पहले event से bound होती हैं, इसलिए long prompts का approval target single-event prompts जैसा ही रहता है।

### quiet finalized previews के लिए self-hosted push rules

`streaming: "quiet"` recipients को केवल तब notify करता है जब block या turn finalized हो - per-user push rule को finalized preview marker से match करना होता है। पूरी recipe (recipient token, pusher check, rule install, per-homeserver notes) के लिए [Matrix push rules for quiet previews](/hi/channels/matrix-push-rules) देखें।

## Bot-to-bot rooms

Default रूप से, दूसरे configured OpenClaw Matrix accounts से आए Matrix messages ignore किए जाते हैं।

जब आप जानबूझकर inter-agent Matrix traffic चाहते हों, तो `allowBots` का उपयोग करें:

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` अनुमत रूम और DM में अन्य कॉन्फ़िगर किए गए Matrix बॉट खातों से संदेश स्वीकार करता है।
- `allowBots: "mentions"` उन संदेशों को केवल तब स्वीकार करता है जब वे रूम में इस बॉट का स्पष्ट रूप से उल्लेख करते हैं। DM अब भी अनुमत हैं।
- `groups.<room>.allowBots` एक रूम के लिए खाता-स्तरीय सेटिंग को ओवरराइड करता है।
- स्वीकार किए गए कॉन्फ़िगर-बॉट संदेश साझा [बॉट लूप सुरक्षा](/hi/channels/bot-loop-protection) का उपयोग करते हैं। `channels.defaults.botLoopProtection` कॉन्फ़िगर करें, फिर जब किसी रूम को अलग बजट चाहिए तो `channels.matrix.botLoopProtection` या `channels.matrix.groups.<room>.botLoopProtection` से ओवरराइड करें।
- OpenClaw अब भी स्वयं-उत्तर लूप से बचने के लिए उसी Matrix उपयोगकर्ता ID से आए संदेशों को अनदेखा करता है।
- Matrix यहां कोई मूल बॉट फ़्लैग उजागर नहीं करता; OpenClaw "बॉट-लेखित" को "इस OpenClaw Gateway पर किसी अन्य कॉन्फ़िगर किए गए Matrix खाते द्वारा भेजा गया" मानता है।

साझा रूम में बॉट-से-बॉट ट्रैफ़िक सक्षम करते समय सख्त रूम अनुमति-सूचियों और उल्लेख आवश्यकताओं का उपयोग करें।

## एन्क्रिप्शन और सत्यापन

एन्क्रिप्टेड (E2EE) रूम में, आउटबाउंड इमेज इवेंट `thumbnail_file` का उपयोग करते हैं ताकि इमेज प्रीव्यू पूरे अटैचमेंट के साथ एन्क्रिप्ट हों। अनएन्क्रिप्टेड रूम अब भी सामान्य `thumbnail_url` का उपयोग करते हैं। किसी कॉन्फ़िगरेशन की आवश्यकता नहीं है - Plugin E2EE स्थिति को अपने-आप पहचानता है।

सभी `openclaw matrix` कमांड `--verbose` (पूर्ण डायग्नोस्टिक्स), `--json` (मशीन-पठनीय आउटपुट), और `--account <id>` (मल्टी-खाता सेटअप) स्वीकार करते हैं। आउटपुट डिफ़ॉल्ट रूप से संक्षिप्त होता है, शांत आंतरिक SDK लॉगिंग के साथ। नीचे दिए गए उदाहरण कैननिकल रूप दिखाते हैं; आवश्यकतानुसार फ़्लैग जोड़ें।

### एन्क्रिप्शन सक्षम करें

```bash
openclaw matrix encryption setup
```

गुप्त स्टोरेज और क्रॉस-साइनिंग को बूटस्ट्रैप करता है, आवश्यकता होने पर रूम-की बैकअप बनाता है, फिर स्थिति और अगले चरण प्रिंट करता है। उपयोगी फ़्लैग:

- `--recovery-key <key>` बूटस्ट्रैपिंग से पहले रिकवरी की लागू करें (नीचे दस्तावेज़ित stdin रूप को प्राथमिकता दें)
- `--force-reset-cross-signing` वर्तमान क्रॉस-साइनिंग पहचान हटाकर नई बनाएँ (केवल जानबूझकर उपयोग करें)

नए खाते के लिए, निर्माण के समय E2EE सक्षम करें:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` `--enable-e2ee` का उपनाम है।

मैनुअल कॉन्फ़िग समकक्ष:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

### स्थिति और भरोसा संकेत

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` तीन स्वतंत्र भरोसा संकेत रिपोर्ट करता है (`--verbose` ये सभी दिखाता है):

- `Locally trusted`: केवल इस क्लाइंट द्वारा विश्वसनीय
- `Cross-signing verified`: SDK क्रॉस-साइनिंग के माध्यम से सत्यापन रिपोर्ट करता है
- `Signed by owner`: आपकी अपनी सेल्फ़-साइनिंग की से साइन किया गया (केवल डायग्नोस्टिक)

`Verified by owner` केवल तब `yes` बनता है जब `Cross-signing verified` `yes` हो। केवल स्थानीय भरोसा या मालिक का सिग्नेचर पर्याप्त नहीं है।

`--allow-degraded-local-state` पहले Matrix खाता तैयार किए बिना सर्वोत्तम-प्रयास डायग्नोस्टिक्स लौटाता है; ऑफ़लाइन या आंशिक रूप से कॉन्फ़िगर किए गए प्रोब के लिए उपयोगी है।

### इस डिवाइस को रिकवरी की से सत्यापित करें

रिकवरी की संवेदनशील होती है - इसे कमांड लाइन पर पास करने के बजाय stdin के माध्यम से पाइप करें। `MATRIX_RECOVERY_KEY` सेट करें (या नामित खाते के लिए `MATRIX_<ID>_RECOVERY_KEY`):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

कमांड तीन स्थितियां रिपोर्ट करता है:

- `Recovery key accepted`: Matrix ने गुप्त स्टोरेज या डिवाइस भरोसे के लिए की स्वीकार की।
- `Backup usable`: रूम-की बैकअप विश्वसनीय रिकवरी सामग्री से लोड किया जा सकता है।
- `Device verified by owner`: इस डिवाइस के पास पूर्ण Matrix क्रॉस-साइनिंग पहचान भरोसा है।

जब पूर्ण पहचान भरोसा अधूरा हो, तो यह नॉन-ज़ीरो से बाहर निकलता है, भले ही रिकवरी की ने बैकअप सामग्री अनलॉक कर दी हो। उस स्थिति में, किसी अन्य Matrix क्लाइंट से सेल्फ़-सत्यापन पूरा करें:

```bash
openclaw matrix verify self
```

`verify self` सफलतापूर्वक बाहर निकलने से पहले `Cross-signing verified: yes` की प्रतीक्षा करता है। प्रतीक्षा समायोजित करने के लिए `--timeout-ms <ms>` का उपयोग करें।

लिटरल-की रूप `openclaw matrix verify device "<recovery-key>"` भी स्वीकार किया जाता है, लेकिन की आपके शेल इतिहास में चली जाती है।

### क्रॉस-साइनिंग बूटस्ट्रैप या रिपेयर करें

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` एन्क्रिप्टेड खातों के लिए रिपेयर और सेटअप कमांड है। क्रम में, यह:

- गुप्त स्टोरेज को बूटस्ट्रैप करता है, संभव होने पर मौजूदा रिकवरी की का पुनः उपयोग करता है
- क्रॉस-साइनिंग को बूटस्ट्रैप करता है और गायब सार्वजनिक की अपलोड करता है
- वर्तमान डिवाइस को मार्क और क्रॉस-साइन करता है
- यदि पहले से मौजूद नहीं है तो सर्वर-साइड रूम-की बैकअप बनाता है

यदि homeserver को क्रॉस-साइनिंग की अपलोड करने के लिए UIA चाहिए, तो OpenClaw पहले नो-ऑथ आज़माता है, फिर `m.login.dummy`, फिर `m.login.password` (`channels.matrix.password` आवश्यक है)।

उपयोगी फ़्लैग:

- `--recovery-key-stdin` (`printf '%s\n' "$MATRIX_RECOVERY_KEY" | …` के साथ जोड़ें) या `--recovery-key <key>`
- `--force-reset-cross-signing` वर्तमान क्रॉस-साइनिंग पहचान हटाने के लिए (केवल जानबूझकर; सक्रिय रिकवरी की का संग्रहित होना या `--recovery-key-stdin` के साथ दिया जाना आवश्यक है)

### रूम-की बैकअप

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` दिखाता है कि सर्वर-साइड बैकअप मौजूद है या नहीं और यह डिवाइस उसे डिक्रिप्ट कर सकता है या नहीं। `backup restore` बैकअप किए गए रूम की को स्थानीय क्रिप्टो स्टोर में आयात करता है; यदि रिकवरी की पहले से डिस्क पर है तो आप `--recovery-key-stdin` छोड़ सकते हैं।

टूटे हुए बैकअप को नए बेसलाइन से बदलने के लिए (अप्राप्य पुराने इतिहास को खोना स्वीकार करता है; यदि वर्तमान बैकअप सीक्रेट लोड नहीं हो सकता तो गुप्त स्टोरेज भी फिर से बना सकता है):

```bash
openclaw matrix verify backup reset --yes
```

`--rotate-recovery-key` केवल तब जोड़ें जब आप जानबूझकर चाहते हों कि पिछली रिकवरी की नया बैकअप बेसलाइन अनलॉक करना बंद कर दे।

### सत्यापन सूचीबद्ध करना, अनुरोध करना, और जवाब देना

```bash
openclaw matrix verify list
```

चयनित खाते के लिए लंबित सत्यापन अनुरोध सूचीबद्ध करता है।

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

इस OpenClaw खाते से सत्यापन अनुरोध भेजता है। `--own-user` सेल्फ़-सत्यापन का अनुरोध करता है (आप उसी उपयोगकर्ता के किसी अन्य Matrix क्लाइंट में प्रॉम्प्ट स्वीकार करते हैं); `--user-id`/`--device-id`/`--room-id` किसी और को लक्षित करते हैं। `--own-user` को अन्य लक्ष्यीकरण फ़्लैग के साथ मिलाया नहीं जा सकता।

निचले-स्तर के लाइफ़साइकल हैंडलिंग के लिए - आमतौर पर किसी अन्य क्लाइंट से इनबाउंड अनुरोधों को शैडो करते समय - ये कमांड किसी विशिष्ट अनुरोध `<id>` पर काम करते हैं (`verify list` और `verify request` द्वारा प्रिंट किया गया):

| कमांड                                     | उद्देश्य                                                             |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | इनबाउंड अनुरोध स्वीकार करें                                           |
| `openclaw matrix verify start <id>`        | SAS फ़्लो शुरू करें                                                  |
| `openclaw matrix verify sas <id>`          | SAS इमोजी या दशमलव प्रिंट करें                                     |
| `openclaw matrix verify confirm-sas <id>`  | पुष्टि करें कि SAS दूसरे क्लाइंट द्वारा दिखाए गए से मेल खाता है            |
| `openclaw matrix verify mismatch-sas <id>` | जब इमोजी या दशमलव मेल नहीं खाते तो SAS अस्वीकार करें              |
| `openclaw matrix verify cancel <id>`       | रद्द करें; वैकल्पिक `--reason <text>` और `--code <matrix-code>` लेता है |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas`, और `cancel` सभी `--user-id` और `--room-id` को DM फ़ॉलो-अप संकेतों के रूप में स्वीकार करते हैं, जब सत्यापन किसी विशिष्ट डायरेक्ट-मैसेज रूम से जुड़ा हो।

### मल्टी-खाता नोट्स

`--account <id>` के बिना, Matrix CLI कमांड अंतर्निहित डिफ़ॉल्ट खाते का उपयोग करते हैं। यदि आपके पास कई नामित खाते हैं और आपने `channels.matrix.defaultAccount` सेट नहीं किया है, तो वे अनुमान लगाने से मना करेंगे और आपसे चयन करने को कहेंगे। जब किसी नामित खाते के लिए E2EE अक्षम या अनुपलब्ध हो, तो त्रुटियाँ उस खाते की कॉन्फ़िग की की ओर संकेत करती हैं, उदाहरण के लिए `channels.matrix.accounts.assistant.encryption`।

<AccordionGroup>
  <Accordion title="स्टार्टअप व्यवहार">
    `encryption: true` के साथ, `startupVerification` डिफ़ॉल्ट रूप से `"if-unverified"` होता है। स्टार्टअप पर एक असत्यापित डिवाइस किसी अन्य Matrix क्लाइंट में सेल्फ़-सत्यापन का अनुरोध करता है, डुप्लिकेट छोड़ता है और कूलडाउन लागू करता है (डिफ़ॉल्ट रूप से 24 घंटे)। `startupVerificationCooldownHours` से समायोजित करें या `startupVerification: "off"` से अक्षम करें।

    स्टार्टअप एक सावधान क्रिप्टो बूटस्ट्रैप पास भी चलाता है जो वर्तमान गुप्त स्टोरेज और क्रॉस-साइनिंग पहचान का पुनः उपयोग करता है। यदि बूटस्ट्रैप स्थिति टूटी हुई है, तो OpenClaw `channels.matrix.password` के बिना भी संरक्षित रिपेयर का प्रयास करता है; यदि homeserver को पासवर्ड UIA चाहिए, तो स्टार्टअप चेतावनी लॉग करता है और नॉन-फ़ेटल रहता है। पहले से मालिक-साइन किए गए डिवाइस सुरक्षित रखे जाते हैं।

    पूर्ण अपग्रेड फ़्लो के लिए [Matrix माइग्रेशन](/hi/channels/matrix-migration) देखें।

  </Accordion>

  <Accordion title="सत्यापन सूचनाएं">
    Matrix सख्त DM सत्यापन रूम में सत्यापन लाइफ़साइकल सूचनाएं `m.notice` संदेशों के रूप में पोस्ट करता है: अनुरोध, तैयार (with "Verify by emoji" मार्गदर्शन), शुरुआत/पूर्णता, और उपलब्ध होने पर SAS (इमोजी/दशमलव) विवरण।

    किसी अन्य Matrix क्लाइंट से आने वाले अनुरोध ट्रैक और स्वतः-स्वीकार किए जाते हैं। सेल्फ़-सत्यापन के लिए, OpenClaw SAS फ़्लो अपने-आप शुरू करता है और इमोजी सत्यापन उपलब्ध होने पर अपनी ओर से पुष्टि करता है - आपको अब भी अपने Matrix क्लाइंट में तुलना करके "They match" की पुष्टि करनी होगी।

    सत्यापन सिस्टम सूचनाएं एजेंट चैट पाइपलाइन को फ़ॉरवर्ड नहीं की जातीं।

  </Accordion>

  <Accordion title="हटाया गया या अमान्य Matrix डिवाइस">
    यदि `verify status` कहता है कि वर्तमान डिवाइस अब homeserver पर सूचीबद्ध नहीं है, तो नया OpenClaw Matrix डिवाइस बनाएँ। पासवर्ड लॉगिन के लिए:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    टोकन प्रमाणीकरण के लिए, अपने Matrix क्लाइंट या एडमिन UI में नया एक्सेस टोकन बनाएँ, फिर OpenClaw अपडेट करें:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    विफल कमांड से मिले खाता ID से `assistant` बदलें, या डिफ़ॉल्ट खाते के लिए `--account` छोड़ दें।

  </Accordion>

  <Accordion title="डिवाइस स्वच्छता">
    पुराने OpenClaw-प्रबंधित डिवाइस जमा हो सकते हैं। सूचीबद्ध करें और हटाएँ:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="क्रिप्टो स्टोर">
    Matrix E2EE आधिकारिक `matrix-js-sdk` Rust क्रिप्टो पथ का उपयोग करता है, जिसमें IndexedDB shim के रूप में `fake-indexeddb` है। क्रिप्टो स्थिति `crypto-idb-snapshot.json` में बनी रहती है (प्रतिबंधित फ़ाइल अनुमतियां)।

    एन्क्रिप्टेड रनटाइम स्थिति `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` के अंतर्गत रहती है और इसमें सिंक स्टोर, क्रिप्टो स्टोर, रिकवरी की, IDB स्नैपशॉट, थ्रेड बाइंडिंग, और स्टार्टअप सत्यापन स्थिति शामिल हैं। जब टोकन बदलता है लेकिन खाता पहचान वही रहती है, तो OpenClaw सर्वोत्तम मौजूदा रूट का पुनः उपयोग करता है ताकि पिछली स्थिति दिखाई देती रहे।

    एकल पुराना token-hash रूट सामान्य टोकन-रोटेशन निरंतरता पथ हो सकता है। यदि OpenClaw `matrix: multiple populated token-hash storage roots detected` लॉग करता है, तो खाता डायरेक्टरी जांचें और चयनित सक्रिय रूट स्वस्थ होने की पुष्टि के बाद ही पुराने सिबलिंग रूट आर्काइव करें। उन्हें तुरंत हटाने के बजाय पुराने रूट को `_archive/` डायरेक्टरी में ले जाना बेहतर है।

  </Accordion>
</AccordionGroup>

## प्रोफ़ाइल प्रबंधन

चुने गए खाते के लिए Matrix स्व-प्रोफ़ाइल अपडेट करें:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

आप एक ही कॉल में दोनों विकल्प पास कर सकते हैं। Matrix `mxc://` avatar URL सीधे स्वीकार करता है; जब आप `http://` या `https://` पास करते हैं, तो OpenClaw पहले फ़ाइल अपलोड करता है और हल किए गए `mxc://` URL को `channels.matrix.avatarUrl` (या प्रति-खाता ओवरराइड) में संग्रहीत करता है।

## थ्रेड

Matrix स्वचालित जवाबों और message-tool भेजने, दोनों के लिए native Matrix threads का समर्थन करता है। व्यवहार को दो स्वतंत्र knobs नियंत्रित करते हैं:

### सत्र रूटिंग (`sessionScope`)

`dm.sessionScope` तय करता है कि Matrix DM rooms OpenClaw sessions से कैसे मैप होते हैं:

- `"per-user"` (डिफ़ॉल्ट): समान routed peer वाले सभी DM rooms एक session साझा करते हैं।
- `"per-room"`: प्रत्येक Matrix DM room को अपनी session key मिलती है, भले ही peer वही हो।

स्पष्ट conversation bindings हमेशा `sessionScope` पर प्राथमिकता लेते हैं, इसलिए bound rooms और threads अपना चुना हुआ target session बनाए रखते हैं।

### जवाब थ्रेडिंग (`threadReplies`)

`threadReplies` तय करता है कि bot अपना जवाब कहां पोस्ट करता है:

- `"off"`: जवाब top-level होते हैं। Inbound threaded messages parent session पर रहते हैं।
- `"inbound"`: केवल तब thread के अंदर जवाब दें जब inbound message पहले से उस thread में था।
- `"always"`: triggering message पर rooted thread के अंदर जवाब दें; वह conversation पहले trigger से ही matching thread-scoped session से routed होता है।

`dm.threadReplies` इसे केवल DMs के लिए override करता है - उदाहरण के लिए, DMs को flat रखते हुए room threads को isolated रखें।

### थ्रेड inheritance और slash commands

- Inbound threaded messages में thread root message extra agent context के रूप में शामिल होता है।
- Message-tool sends समान room (या समान DM user target) को target करते समय current Matrix thread को auto-inherit करते हैं, जब तक explicit `threadId` नहीं दिया जाता।
- DM user-target reuse केवल तब सक्रिय होता है जब current session metadata उसी Matrix account पर वही DM peer सिद्ध करता है; अन्यथा OpenClaw normal user-scoped routing पर वापस जाता है।
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, और thread-bound `/acp spawn` सभी Matrix rooms और DMs में काम करते हैं।
- Top-level `/focus` नया Matrix thread बनाता है और `threadBindings.spawnSessions` enabled होने पर उसे target session से bind करता है।
- मौजूदा Matrix thread के अंदर `/focus` या `/acp spawn --thread here` चलाने से वही thread उसी जगह bind होता है।

जब OpenClaw उसी shared session पर किसी दूसरे DM room से टकराता हुआ Matrix DM room detect करता है, तो वह उस room में एक बार का `m.notice` पोस्ट करता है जो `/focus` escape hatch की ओर इंगित करता है और `dm.sessionScope` change सुझाता है। यह notice केवल तब दिखाई देता है जब thread bindings enabled हों।

## ACP conversation bindings

Matrix rooms, DMs, और मौजूदा Matrix threads को chat surface बदले बिना टिकाऊ ACP workspaces में बदला जा सकता है।

तेज़ operator flow:

- जिस Matrix DM, room, या मौजूदा thread का उपयोग जारी रखना चाहते हैं, उसके अंदर `/acp spawn codex --bind here` चलाएँ।
- Top-level Matrix DM या room में, current DM/room chat surface बना रहता है और future messages spawned ACP session को route होते हैं।
- मौजूदा Matrix thread के अंदर, `--bind here` current thread को उसी जगह bind करता है।
- `/new` और `/reset` उसी bound ACP session को उसी जगह reset करते हैं।
- `/acp close` ACP session को close करता है और binding हटाता है।

नोट्स:

- `--bind here` child Matrix thread नहीं बनाता।
- `threadBindings.spawnSessions` `/acp spawn --thread auto|here` को gate करता है, जहाँ OpenClaw को child Matrix thread बनाना या bind करना होता है।

### थ्रेड binding config

Matrix `session.threadBindings` से global defaults inherit करता है, और per-channel overrides का भी समर्थन करता है:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix thread-bound session spawns डिफ़ॉल्ट रूप से on होते हैं:

- Top-level `/focus` और `/acp spawn --thread auto|here` को Matrix threads बनाने/bind करने से रोकने के लिए `threadBindings.spawnSessions: false` set करें।
- जब native subagent thread spawns को parent transcript fork नहीं करना चाहिए, तो `threadBindings.defaultSpawnContext: "isolated"` set करें।

## प्रतिक्रियाएँ

Matrix outbound reactions, inbound reaction notifications, और ack reactions का समर्थन करता है।

Outbound reaction tooling `channels.matrix.actions.reactions` द्वारा gated है:

- `react` Matrix event में reaction जोड़ता है।
- `reactions` Matrix event के लिए current reaction summary list करता है।
- `emoji=""` उस event पर bot की अपनी reactions हटाता है।
- `remove: true` bot से केवल specified emoji reaction हटाता है।

**Resolution order** (पहला defined value जीतता है):

| सेटिंग                 | क्रम                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | प्रति-खाता → channel → `messages.ackReaction` → agent identity emoji फ़ॉलबैक   |
| `ackReactionScope`      | प्रति-खाता → channel → `messages.ackReactionScope` → डिफ़ॉल्ट `"group-mentions"` |
| `reactionNotifications` | प्रति-खाता → channel → डिफ़ॉल्ट `"own"`                                          |

`reactionNotifications: "own"` जोड़े गए `m.reaction` events को forward करता है जब वे bot-authored Matrix messages को target करते हैं; `"off"` reaction system events disable करता है। Reaction removals को system events में synthesize नहीं किया जाता क्योंकि Matrix उन्हें redactions के रूप में surface करता है, standalone `m.reaction` removals के रूप में नहीं।

## History context

- `channels.matrix.historyLimit` नियंत्रित करता है कि Matrix room message के agent को trigger करने पर कितने recent room messages `InboundHistory` के रूप में शामिल किए जाएँ। यह `messages.groupChat.historyLimit` पर fallback करता है; यदि दोनों unset हैं, तो effective default `0` है। Disable करने के लिए `0` set करें।
- Matrix room history केवल room-only है। DMs normal session history का उपयोग जारी रखते हैं।
- Matrix room history pending-only है: OpenClaw उन room messages को buffer करता है जिन्होंने अभी तक reply trigger नहीं किया, फिर mention या दूसरा trigger आने पर उस window का snapshot लेता है।
- Current trigger message `InboundHistory` में शामिल नहीं होता; वह उस turn के main inbound body में रहता है।
- उसी Matrix event के retries newer room messages की ओर drift करने के बजाय original history snapshot reuse करते हैं।

## Context visibility

Matrix fetched reply text, thread roots, और pending history जैसे supplemental room context के लिए shared `contextVisibility` control का समर्थन करता है।

- `contextVisibility: "all"` डिफ़ॉल्ट है। Supplemental context जैसा प्राप्त हुआ वैसा रखा जाता है।
- `contextVisibility: "allowlist"` supplemental context को active room/user allowlist checks द्वारा allowed senders तक filter करता है।
- `contextVisibility: "allowlist_quote"` `allowlist` जैसा व्यवहार करता है, लेकिन फिर भी एक explicit quoted reply रखता है।

यह setting supplemental context visibility को प्रभावित करती है, यह नहीं कि inbound message खुद reply trigger कर सकता है या नहीं।
Trigger authorization अब भी `groupPolicy`, `groups`, `groupAllowFrom`, और DM policy settings से आता है।

## DM और room policy

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": { requireMention: true },
      },
    },
  },
}
```

Rooms को working रखते हुए DMs को पूरी तरह silence करने के लिए, `dm.enabled: false` set करें:

```json5
{
  channels: {
    matrix: {
      dm: { enabled: false },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
    },
  },
}
```

Mention-gating और allowlist behavior के लिए [Groups](/hi/channels/groups) देखें।

Matrix DMs के लिए pairing example:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

यदि कोई unapproved Matrix user approval से पहले आपको message भेजता रहता है, तो OpenClaw वही pending pairing code reuse करता है और नया code mint करने के बजाय छोटे cooldown के बाद reminder reply भेज सकता है।

Shared DM pairing flow और storage layout के लिए [Pairing](/hi/channels/pairing) देखें।

## Direct room repair

यदि direct-message state sync से बाहर drift हो जाती है, तो OpenClaw stale `m.direct` mappings के साथ रह सकता है जो live DM के बजाय पुराने solo rooms की ओर point करते हैं। किसी peer के लिए current mapping inspect करें:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

इसे repair करें:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

दोनों commands multi-account setups के लिए `--account <id>` स्वीकार करते हैं। Repair flow:

- `m.direct` में पहले से mapped strict 1:1 DM को prefer करता है
- उस user के साथ किसी भी currently joined strict 1:1 DM पर fallback करता है
- यदि कोई healthy DM मौजूद नहीं है, तो fresh direct room बनाता है और `m.direct` rewrite करता है

यह पुराने rooms को automatically delete नहीं करता। यह healthy DM चुनता है और mapping update करता है ताकि future Matrix sends, verification notices, और अन्य direct-message flows सही room को target करें।

## Exec approvals

Matrix native approval client के रूप में काम कर सकता है। `channels.matrix.execApprovals` (या per-account override के लिए `channels.matrix.accounts.<account>.execApprovals`) के अंतर्गत configure करें:

- `enabled`: Matrix-native prompts के माध्यम से approvals deliver करें। Unset या `"auto"` होने पर, कम से कम एक approver resolve होते ही Matrix auto-enable हो जाता है। Explicitly disable करने के लिए `false` set करें।
- `approvers`: Matrix user IDs (`@owner:example.org`) जिन्हें exec requests approve करने की अनुमति है। Optional - `channels.matrix.dm.allowFrom` पर fallback करता है।
- `target`: prompts कहाँ जाते हैं। `"dm"` (डिफ़ॉल्ट) approver DMs को भेजता है; `"channel"` originating Matrix room या DM को भेजता है; `"both"` दोनों को भेजता है।
- `agentFilter` / `sessionFilter`: कौन से agents/sessions Matrix delivery trigger करते हैं, इसके लिए optional allowlists।

Authorization approval kinds के बीच थोड़ा अलग है:

- **Exec approvals** `execApprovals.approvers` का उपयोग करते हैं, और `dm.allowFrom` पर fallback करते हैं।
- **Plugin approvals** केवल `dm.allowFrom` के माध्यम से authorize होते हैं।

दोनों kinds Matrix reaction shortcuts और message updates साझा करते हैं। Approvers primary approval message पर reaction shortcuts देखते हैं:

- `✅` एक बार allow करें
- `❌` deny करें
- `♾️` हमेशा allow करें (जब effective exec policy इसकी अनुमति देती है)

Fallback slash commands: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

केवल resolved approvers approve या deny कर सकते हैं। Exec approvals के लिए channel delivery में command text शामिल होता है - `channel` या `both` केवल trusted rooms में enable करें।

संबंधित: [Exec approvals](/hi/tools/exec-approvals).

## Slash commands

Slash commands (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, आदि) सीधे DMs में काम करते हैं। Rooms में, OpenClaw उन commands को भी पहचानता है जो bot के अपने Matrix mention से prefixed होते हैं, इसलिए `@bot:server /new` custom mention regex के बिना command path trigger करता है। इससे bot उन room-style `@mention /command` posts के प्रति responsive रहता है जो Element और समान clients तब emit करते हैं जब user command type करने से पहले bot को tab-complete करता है।

Authorization rules अब भी लागू होते हैं: command senders को plain messages जैसी ही DM या room allowlist/owner policies satisfy करनी होंगी।

## Multi-account

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

**Inheritance:**

- शीर्ष-स्तरीय `channels.matrix` मान named accounts के लिए डिफ़ॉल्ट के रूप में काम करते हैं, जब तक कोई account उन्हें override न करे.
- किसी inherited room entry को `groups.<room>.account` के साथ किसी खास account तक सीमित करें. `account` के बिना entries accounts में साझा होती हैं; जब default account शीर्ष स्तर पर configured हो, तब भी `account: "default"` काम करता है.

**Default account selection:**

- implicit routing, probing, और CLI commands द्वारा पसंद किए जाने वाले named account को चुनने के लिए `defaultAccount` सेट करें.
- यदि आपके पास कई accounts हैं और एक का नाम सचमुच `default` है, तो `defaultAccount` unset होने पर भी OpenClaw उसे implicit रूप से उपयोग करता है.
- यदि आपके पास कई named accounts हैं और कोई default selected नहीं है, तो CLI commands अनुमान लगाने से मना कर देती हैं - `defaultAccount` सेट करें या `--account <id>` pass करें.
- शीर्ष-स्तरीय `channels.matrix.*` block को केवल तभी implicit `default` account माना जाता है जब उसका auth पूरा हो (`homeserver` + `accessToken`, या `homeserver` + `userId` + `password`). Named accounts `homeserver` + `userId` से discoverable रहते हैं, जब cached credentials auth cover कर लें.

**Promotion:**

- जब OpenClaw repair या setup के दौरान single-account config को multi-account में promote करता है, तो वह existing named account को preserve करता है, यदि कोई मौजूद हो या `defaultAccount` पहले से किसी एक की ओर point करता हो. केवल Matrix auth/bootstrap keys promoted account में move होती हैं; shared delivery-policy keys शीर्ष स्तर पर रहती हैं.

Shared multi-account pattern के लिए [Configuration reference](/hi/gateway/config-channels#multi-account-all-channels) देखें.

## Private/LAN homeservers

Default रूप से, OpenClaw SSRF protection के लिए private/internal Matrix homeservers को block करता है, जब तक आप
हर account के लिए explicitly opt in न करें.

यदि आपका homeserver localhost, LAN/Tailscale IP, या internal hostname पर चलता है, तो उस Matrix account के लिए
`network.dangerouslyAllowPrivateNetwork` enable करें:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

CLI setup example:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

यह opt-in केवल trusted private/internal targets को allow करता है. Public cleartext homeservers जैसे
`http://matrix.example.org:8008` block रहते हैं. जहां संभव हो, `https://` को prefer करें.

## Matrix traffic को proxy करना

यदि आपके Matrix deployment को explicit outbound HTTP(S) proxy चाहिए, तो `channels.matrix.proxy` सेट करें:

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

Named accounts शीर्ष-स्तरीय default को `channels.matrix.accounts.<id>.proxy` से override कर सकते हैं.
OpenClaw runtime Matrix traffic और account status probes के लिए वही proxy setting उपयोग करता है.

## Target resolution

Matrix इन target forms को हर उस जगह accept करता है जहां OpenClaw आपसे room या user target मांगता है:

- Users: `@user:server`, `user:@user:server`, या `matrix:user:@user:server`
- Rooms: `!room:server`, `room:!room:server`, या `matrix:room:!room:server`
- Aliases: `#alias:server`, `channel:#alias:server`, या `matrix:channel:#alias:server`

Matrix room IDs case-sensitive हैं. Explicit delivery targets, cron jobs, bindings, या allowlists configure करते समय Matrix से मिले exact room ID casing का उपयोग करें.
OpenClaw storage के लिए internal session keys canonical रखता है, इसलिए वे lowercase
keys Matrix delivery IDs के लिए reliable source नहीं हैं.

Live directory lookup logged-in Matrix account का उपयोग करता है:

- User lookups उस homeserver पर Matrix user directory query करते हैं.
- Room lookups explicit room IDs और aliases को सीधे accept करते हैं. Joined-room name lookup best-effort है और केवल runtime room allowlists पर लागू होता है, जब `dangerouslyAllowNameMatching: true` सेट हो.
- यदि किसी room name को ID या alias में resolve नहीं किया जा सकता, तो runtime allowlist resolution में उसे ignore किया जाता है.

## Configuration reference

Allowlist-style user fields (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) full Matrix user IDs accept करते हैं (सबसे सुरक्षित). Non-ID user entries default रूप से ignore की जाती हैं. यदि आप `dangerouslyAllowNameMatching: true` सेट करते हैं, तो exact Matrix directory display-name matches startup पर और monitor चलने के दौरान allowlist बदलने पर resolve किए जाते हैं; जो entries resolve नहीं हो सकतीं, वे runtime पर ignore की जाती हैं.

Room allowlist keys (`groups`, legacy `rooms`) room IDs या aliases होनी चाहिए. Plain room-name keys default रूप से ignore की जाती हैं; `dangerouslyAllowNameMatching: true` joined room names के विरुद्ध best-effort lookup restore करता है.

### Account और connection

- `enabled`: channel को enable या disable करें.
- `name`: account के लिए optional display label.
- `defaultAccount`: जब कई Matrix accounts configured हों, तब preferred account ID.
- `accounts`: named per-account overrides. शीर्ष-स्तरीय `channels.matrix` values defaults के रूप में inherit होती हैं.
- `homeserver`: homeserver URL, उदाहरण के लिए `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: इस account को `localhost`, LAN/Tailscale IPs, या internal hostnames से connect करने दें.
- `proxy`: Matrix traffic के लिए optional HTTP(S) proxy URL. Per-account override supported है.
- `userId`: full Matrix user ID (`@bot:example.org`).
- `accessToken`: token-based auth के लिए access token. Plaintext और SecretRef values env/file/exec providers में supported हैं ([Secrets Management](/hi/gateway/secrets)).
- `password`: password-based login के लिए password. Plaintext और SecretRef values supported हैं.
- `deviceId`: explicit Matrix device ID.
- `deviceName`: password-login time पर उपयोग किया गया device display name.
- `avatarUrl`: profile sync और `profile set` updates के लिए stored self-avatar URL.
- `initialSyncLimit`: startup sync के दौरान fetch किए गए events की maximum संख्या.

### Encryption

- `encryption`: E2EE enable करें. Default: `false`.
- `startupVerification`: `"if-unverified"` (जब E2EE on हो तो default) या `"off"`. Startup पर यह device unverified होने पर self-verification auto-request करता है.
- `startupVerificationCooldownHours`: अगले automatic startup request से पहले cooldown. Default: `24`.

### Access और policy

- `groupPolicy`: `"open"`, `"allowlist"`, या `"disabled"`. Default: `"allowlist"`.
- `groupAllowFrom`: room traffic के लिए user IDs की allowlist.
- `dm.enabled`: जब `false` हो, तो सभी DMs ignore करें. Default: `true`.
- `dm.policy`: `"pairing"` (default), `"allowlist"`, `"open"`, या `"disabled"`. Bot के join करने और room को DM के रूप में classify करने के बाद लागू होता है; यह invite handling को affect नहीं करता.
- `dm.allowFrom`: DM traffic के लिए user IDs की allowlist.
- `dm.sessionScope`: `"per-user"` (default) या `"per-room"`.
- `dm.threadReplies`: reply threading के लिए DM-only override (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: दूसरे configured Matrix bot accounts से messages accept करें (`true` या `"mentions"`).
- `allowlistOnly`: जब `true` हो, तो सभी active DM policies (`"disabled"` को छोड़कर) और `"open"` group policies को `"allowlist"` पर force करता है. `"disabled"` policies को change नहीं करता.
- `dangerouslyAllowNameMatching`: जब `true` हो, तो user allowlist entries के लिए Matrix display-name directory lookup और room allowlist keys के लिए joined-room name lookup allow करता है. Full `@user:server` IDs और room IDs या aliases को prefer करें.
- `autoJoin`: `"always"`, `"allowlist"`, या `"off"`. Default: `"off"`. हर Matrix invite पर लागू होता है, जिसमें DM-style invites शामिल हैं.
- `autoJoinAllowlist`: जब `autoJoin` `"allowlist"` हो, तब allowed rooms/aliases. Alias entries homeserver के विरुद्ध resolve की जाती हैं, invited room द्वारा claim की गई state के विरुद्ध नहीं.
- `contextVisibility`: supplemental context visibility (`"all"` default, `"allowlist"`, `"allowlist_quote"`).

### Reply behavior

- `replyToMode`: `"off"`, `"first"`, `"all"`, या `"batched"`.
- `threadReplies`: `"off"`, `"inbound"`, या `"always"`.
- `threadBindings`: thread-bound session routing और lifecycle के लिए per-channel overrides.
- `streaming`: `"off"` (default), `"partial"`, `"quiet"`, या object form `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: जब `true` हो, तो completed assistant blocks अलग progress messages के रूप में रखे जाते हैं.
- `markdown`: outbound text के लिए optional Markdown rendering config.
- `responsePrefix`: outbound replies के आगे लगाई जाने वाली optional string.
- `textChunkLimit`: `chunkMode: "length"` होने पर characters में outbound chunk size. Default: `4000`.
- `chunkMode`: `"length"` (default, character count के अनुसार split करता है) या `"newline"` (line boundaries पर split करता है).
- `historyLimit`: agent को trigger करने वाले room message पर `InboundHistory` के रूप में शामिल recent room messages की संख्या. `messages.groupChat.historyLimit` पर fall back करता है; effective default `0` (disabled).
- `mediaMaxMb`: outbound sends और inbound processing के लिए MB में media size cap.

### Reaction settings

- `ackReaction`: इस channel/account के लिए ack reaction override.
- `ackReactionScope`: scope override (`"group-mentions"` default, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: inbound reaction notification mode (`"own"` default, `"off"`).

### Tooling और per-room overrides

- `actions`: per-action tool gating (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: per-room policy map. Session identity resolution के बाद stable room ID का उपयोग करती है. (`rooms` legacy alias है.)
  - `groups.<room>.account`: एक inherited room entry को किसी खास account तक restrict करें.
  - `groups.<room>.allowBots`: channel-level setting का per-room override (`true` या `"mentions"`).
  - `groups.<room>.users`: per-room sender allowlist.
  - `groups.<room>.tools`: per-room tool allow/deny overrides.
  - `groups.<room>.autoReply`: per-room mention-gating override. `true` उस room के लिए mention requirements disable करता है; `false` उन्हें वापस force करता है.
  - `groups.<room>.skills`: per-room skill filter.
  - `groups.<room>.systemPrompt`: per-room system prompt snippet.

### Exec approval settings

- `execApprovals.enabled`: Matrix-native prompts के माध्यम से exec approvals deliver करें.
- `execApprovals.approvers`: approve करने की अनुमति वाले Matrix user IDs. `dm.allowFrom` पर fall back करता है.
- `execApprovals.target`: `"dm"` (default), `"channel"`, या `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: delivery के लिए optional agent/session allowlists.

## Related

- [Channels Overview](/hi/channels) - सभी supported channels
- [Pairing](/hi/channels/pairing) - DM authentication और pairing flow
- [Groups](/hi/channels/groups) - group chat behavior और mention gating
- [Channel Routing](/hi/channels/channel-routing) - messages के लिए session routing
- [Security](/hi/gateway/security) - access model और hardening
