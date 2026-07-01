---
read_when:
    - OpenClaw में Matrix सेट अप करना
    - Matrix E2EE और सत्यापन कॉन्फ़िगर करना
summary: Matrix समर्थन स्थिति, सेटअप, और कॉन्फ़िगरेशन उदाहरण
title: मैट्रिक्स
x-i18n:
    generated_at: "2026-07-01T12:58:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2aa86a477c4f15e792ba01c45bb06f37a55fee26ee2c895bfa308ff57ef6d819
    source_path: channels/matrix.md
    workflow: 16
---

Matrix, OpenClaw के लिए डाउनलोड किया जा सकने वाला channel plugin है।
यह आधिकारिक `matrix-js-sdk` का उपयोग करता है और DMs, rooms, threads, media, reactions, polls, location, और E2EE का समर्थन करता है।

## इंस्टॉल करें

channel कॉन्फ़िगर करने से पहले ClawHub से Matrix इंस्टॉल करें:

```bash
openclaw plugins install @openclaw/matrix
```

Bare plugin specs पहले ClawHub आज़माते हैं, फिर npm fallback। registry source को बाध्य करने के लिए, `openclaw plugins install clawhub:@openclaw/matrix` या `openclaw plugins install npm:@openclaw/matrix` का उपयोग करें।

local checkout से:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` plugin को register और enable करता है, इसलिए अलग से `openclaw plugins enable matrix` चरण की आवश्यकता नहीं है। फिर भी plugin तब तक कुछ नहीं करता जब तक आप नीचे channel कॉन्फ़िगर नहीं करते। सामान्य plugin व्यवहार और install नियमों के लिए [Plugins](/hi/tools/plugin) देखें।

## सेटअप

1. अपने homeserver पर Matrix account बनाएँ।
2. `channels.matrix` को या तो `homeserver` + `accessToken`, या `homeserver` + `userId` + `password` के साथ कॉन्फ़िगर करें।
3. gateway को restart करें।
4. bot के साथ DM शुरू करें, या इसे room में invite करें ([auto-join](#auto-join) देखें - नए invites केवल तब land होते हैं जब `autoJoin` उन्हें allow करता है)।

### इंटरैक्टिव सेटअप

```bash
openclaw channels add
openclaw configure --section channels
```

wizard पूछता है: homeserver URL, auth method (access token या password), user ID (केवल password auth), optional device name, E2EE enable करना है या नहीं, और room access तथा auto-join कॉन्फ़िगर करना है या नहीं।

यदि matching `MATRIX_*` env vars पहले से मौजूद हैं और चयनित account में saved auth नहीं है, तो wizard env-var shortcut प्रदान करता है। allowlist save करने से पहले room names resolve करने के लिए, `openclaw channels resolve --channel matrix "Project Room"` चलाएँ। जब E2EE enable होता है, wizard config लिखता है और [`openclaw matrix encryption setup`](#encryption-and-verification) जैसा ही bootstrap चलाता है।

### न्यूनतम कॉन्फ़िग

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

Password-based (token पहले login के बाद cache किया जाता है):

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

`channels.matrix.autoJoin` default रूप से `off` है। default के साथ, bot नए rooms या DMs में fresh invites से तब तक दिखाई नहीं देगा जब तक आप manually join नहीं करते।

OpenClaw invite time पर नहीं बता सकता कि invited room DM है या group, इसलिए सभी invites - DM-style invites सहित - पहले `autoJoin` से गुजरते हैं। `dm.policy` केवल बाद में apply होता है, bot के join करने और room classify होने के बाद।

<Warning>
bot कौन-से invites accept करता है इसे restrict करने के लिए `autoJoin: "allowlist"` के साथ `autoJoinAllowlist` set करें, या हर invite accept करने के लिए `autoJoin: "always"`।

`autoJoinAllowlist` केवल stable targets accept करता है: `!roomId:server`, `#alias:server`, या `*`। plain room names reject किए जाते हैं; alias entries homeserver के विरुद्ध resolve होती हैं, invited room द्वारा claimed state के विरुद्ध नहीं।
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

हर invite accept करने के लिए, `autoJoin: "always"` का उपयोग करें।

### Allowlist target formats

DM और room allowlists को stable IDs से भरना सबसे अच्छा है:

- DMs (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): `@user:server` का उपयोग करें। Display names default रूप से ignore किए जाते हैं क्योंकि वे mutable हैं; `dangerouslyAllowNameMatching: true` केवल तब set करें जब आपको स्पष्ट रूप से display-name entries के साथ compatibility चाहिए।
- Room allowlist keys (`groups`, legacy `rooms`): `!room:server` या `#alias:server` का उपयोग करें। plain room names default रूप से ignore किए जाते हैं; `dangerouslyAllowNameMatching: true` केवल तब set करें जब आपको joined-room name lookup के साथ स्पष्ट रूप से compatibility चाहिए।
- Invite allowlists (`autoJoinAllowlist`): `!room:server`, `#alias:server`, या `*` का उपयोग करें। plain room names reject किए जाते हैं।

### Account ID normalization

wizard friendly name को normalized account ID में convert करता है। उदाहरण के लिए, `Ops Bot` `ops-bot` बन जाता है। scoped env-var names में punctuation escape किया जाता है ताकि दो accounts collide न कर सकें: `-` → `_X2D_`, इसलिए `ops-prod` `MATRIX_OPS_X2D_PROD_*` पर map होता है।

### Cached credentials

Matrix cached credentials को `~/.openclaw/credentials/matrix/` के अंतर्गत store करता है:

- default account: `credentials.json`
- named accounts: `credentials-<account>.json`

जब वहाँ cached credentials मौजूद होते हैं, OpenClaw Matrix को configured मानता है, भले ही access token config file में न हो - यह setup, `openclaw doctor`, और channel-status probes को cover करता है।

### Environment variables

जब equivalent config key set न हो तो उपयोग किए जाते हैं। default account unprefixed names का उपयोग करता है; named accounts suffix से पहले account ID inserted करते हैं।

| Default account       | Named account (`<ID>` normalized account ID है) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

account `ops` के लिए, names `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, आदि बन जाते हैं। recovery-key env vars recovery-aware CLI flows (`verify backup restore`, `verify device`, `verify bootstrap`) द्वारा पढ़े जाते हैं जब आप key को `--recovery-key-stdin` के माध्यम से pipe करते हैं।

`MATRIX_HOMESERVER` workspace `.env` से set नहीं किया जा सकता; [Workspace `.env` files](/hi/gateway/security) देखें।

## कॉन्फ़िगरेशन उदाहरण

DM pairing, room allowlist, और E2EE के साथ एक व्यावहारिक baseline:

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

Matrix reply streaming opt-in है। `streaming` नियंत्रित करता है कि OpenClaw in-flight assistant reply कैसे deliver करता है; `blockStreaming` नियंत्रित करता है कि प्रत्येक completed block अपने Matrix message के रूप में preserve किया जाए या नहीं।

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

live answer previews रखने लेकिन interim tool/progress lines छिपाने के लिए, object
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

पूर्ण object form `{ mode, preview, progress }` accept करता है:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto", // pick from configured or built-in labels (false to hide)
          labels: ["Thinking", "Writing", "Searching"], // candidates for label: "auto"
          maxLines: 8, // max rolling progress lines (default: 8)
          maxLineChars: 120, // max chars per line before truncation (default: 120)
          toolProgress: true, // show tool/progress activity (default: true)
        },
      },
    },
  },
}
```

- `progress.label`: custom label, configured या built-in labels में से चुनने के लिए `"auto"` या unset, या label line छिपाने के लिए `false`।
- `progress.labels`: candidate labels जो केवल तब उपयोग होते हैं जब `label` `"auto"` या unset हो। built-in defaults के लिए unset छोड़ें।
- `progress.maxLines`: draft में रखी जाने वाली maximum rolling progress lines। इस limit के बाद, पुरानी lines trim कर दी जाती हैं।
- `progress.maxLineChars`: truncation से पहले प्रति compact progress line maximum characters।
- `progress.toolProgress`: जब `true` (default), live tool/progress activity draft में दिखाई देती है।

| `streaming`       | Behavior                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (default) | full reply की प्रतीक्षा करें, एक बार send करें। `true` ↔ `"partial"`, `false` ↔ `"off"`।                                                                                        |
| `"partial"`       | model के current block लिखने पर एक normal text message को in place edit करें। Stock Matrix clients पहले preview पर notify कर सकते हैं, final edit पर नहीं।              |
| `"quiet"`         | `"partial"` जैसा ही, लेकिन message non-notifying notice होता है। Recipients को notification केवल तब मिलता है जब per-user push rule finalized edit से match करता है (नीचे देखें)। |
| `"progress"`      | progress draft का उपयोग करके individual compact progress lines भेजता है।                                                                                                     |

`blockStreaming`, `streaming` से independent है:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (default)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | current block के लिए live draft, completed blocks messages के रूप में रखे गए | current block के लिए live draft, in place finalized |
| `"off"`                 | प्रत्येक finished block के लिए एक notifying Matrix message                     | full reply के लिए एक notifying Matrix message      |

Notes:

- यदि preview Matrix की per-event size limit से आगे बढ़ता है, OpenClaw preview streaming रोक देता है और final-only delivery पर fallback करता है।
- Media replies हमेशा attachments normally भेजते हैं। यदि stale preview अब safely reuse नहीं किया जा सकता, तो OpenClaw final media reply भेजने से पहले उसे redact करता है।
- Matrix preview streaming active होने पर tool-progress preview updates default रूप से enabled होते हैं। answer text के लिए preview edits रखने लेकिन tool progress को normal delivery path पर छोड़ने के लिए `streaming.preview.toolProgress: false` set करें।
- Preview edits में अतिरिक्त Matrix API calls लगती हैं। यदि आप सबसे conservative rate-limit profile चाहते हैं तो `streaming: "off"` छोड़ें।

## Voice messages

Inbound Matrix voice notes को room mention gate से पहले transcribe किया जाता है। इससे bot का नाम बोलने वाला voice note `requireMention: true` room में agent को trigger कर सकता है, और agent को केवल audio attachment placeholder के बजाय transcript मिलता है।

Matrix `tools.media.audio` के अंतर्गत configured shared audio media provider का उपयोग करता है, जैसे OpenAI `gpt-4o-mini-transcribe`। provider setup और limits के लिए [Media tools overview](/hi/tools/media-overview) देखें।

Behavior details:

- `m.audio` इवेंट और `audio/*` MIME प्रकार वाले `m.file` इवेंट पात्र हैं.
- एन्क्रिप्टेड रूम में, OpenClaw ट्रांसक्रिप्शन से पहले मौजूदा Matrix मीडिया पाथ के माध्यम से अटैचमेंट को डिक्रिप्ट करता है.
- एजेंट प्रॉम्प्ट में ट्रांसक्रिप्ट को मशीन-जनित और अविश्वसनीय के रूप में चिह्नित किया जाता है.
- अटैचमेंट को पहले से ट्रांसक्राइब किया हुआ चिह्नित किया जाता है ताकि डाउनस्ट्रीम मीडिया टूल उसी वॉयस नोट को फिर से ट्रांसक्राइब न करें.
- ऑडियो ट्रांसक्रिप्शन को वैश्विक रूप से अक्षम करने के लिए `tools.media.audio.enabled: false` सेट करें.

## अनुमोदन मेटाडेटा

Matrix नेटिव अनुमोदन प्रॉम्प्ट सामान्य `m.room.message` इवेंट होते हैं जिनमें `com.openclaw.approval` के अंतर्गत OpenClaw-विशिष्ट कस्टम इवेंट सामग्री होती है. Matrix कस्टम इवेंट-सामग्री कुंजियों की अनुमति देता है, इसलिए सामान्य क्लाइंट अभी भी टेक्स्ट बॉडी रेंडर करते हैं, जबकि OpenClaw-aware क्लाइंट संरचित अनुमोदन id, kind, state, उपलब्ध निर्णय, और exec/plugin विवरण पढ़ सकते हैं.

जब कोई अनुमोदन प्रॉम्प्ट एक Matrix इवेंट के लिए बहुत लंबा होता है, OpenClaw दृश्यमान टेक्स्ट को खंडों में बांटता है और केवल पहले खंड से `com.openclaw.approval` जोड़ता है. allow/deny निर्णयों के लिए प्रतिक्रियाएं उसी पहले इवेंट से बंधी होती हैं, इसलिए लंबे प्रॉम्प्ट single-event प्रॉम्प्ट की तरह ही वही अनुमोदन लक्ष्य रखते हैं.

### शांत अंतिम previews के लिए self-hosted push rules

`streaming: "quiet"` प्राप्तकर्ताओं को केवल तब सूचित करता है जब कोई ब्लॉक या turn अंतिम हो जाता है - प्रति-यूज़र push rule को अंतिम preview marker से मेल खाना होता है. पूरी विधि (recipient token, pusher check, rule install, प्रति-homeserver notes) के लिए [शांत previews के लिए Matrix push rules](/hi/channels/matrix-push-rules) देखें.

## Bot-to-bot रूम

डिफ़ॉल्ट रूप से, अन्य कॉन्फ़िगर किए गए OpenClaw Matrix खातों से आए Matrix संदेशों को अनदेखा किया जाता है.

जब आप जानबूझकर inter-agent Matrix ट्रैफ़िक चाहते हैं, तो `allowBots` का उपयोग करें:

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

- `allowBots: true` अनुमति प्राप्त रूम और DM में अन्य कॉन्फ़िगर किए गए Matrix bot खातों से संदेश स्वीकार करता है.
- `allowBots: "mentions"` उन संदेशों को केवल तब स्वीकार करता है जब वे रूम में इस bot का दृश्यमान उल्लेख करते हैं. DM अभी भी अनुमत हैं.
- `groups.<room>.allowBots` एक रूम के लिए account-level सेटिंग को ओवरराइड करता है.
- स्वीकार किए गए configured-bot संदेश साझा [bot loop protection](/hi/channels/bot-loop-protection) का उपयोग करते हैं. `channels.defaults.botLoopProtection` कॉन्फ़िगर करें, फिर जब किसी रूम को अलग budget चाहिए तो `channels.matrix.botLoopProtection` या `channels.matrix.groups.<room>.botLoopProtection` से ओवरराइड करें.
- OpenClaw self-reply loops से बचने के लिए उसी Matrix user ID से आए संदेशों को अभी भी अनदेखा करता है.
- Matrix यहां कोई नेटिव bot flag प्रदर्शित नहीं करता; OpenClaw "bot-authored" को "इस OpenClaw gateway पर किसी अन्य कॉन्फ़िगर किए गए Matrix खाते द्वारा भेजा गया" मानता है.

साझा रूम में bot-to-bot ट्रैफ़िक सक्षम करते समय strict room allowlists और mention requirements का उपयोग करें.

## एन्क्रिप्शन और सत्यापन

एन्क्रिप्टेड (E2EE) रूम में, outbound image events `thumbnail_file` का उपयोग करते हैं ताकि image previews पूर्ण अटैचमेंट के साथ एन्क्रिप्टेड रहें. अनएन्क्रिप्टेड रूम अभी भी सादा `thumbnail_url` उपयोग करते हैं. कोई कॉन्फ़िगरेशन आवश्यक नहीं है - Plugin E2EE स्थिति को स्वचालित रूप से पहचानता है.

सभी `openclaw matrix` कमांड `--verbose` (पूर्ण diagnostics), `--json` (machine-readable output), और `--account <id>` (multi-account setups) स्वीकार करते हैं. आउटपुट डिफ़ॉल्ट रूप से संक्षिप्त होता है, शांत आंतरिक SDK logging के साथ. नीचे दिए गए उदाहरण canonical form दिखाते हैं; आवश्यकता अनुसार flags जोड़ें.

### एन्क्रिप्शन सक्षम करें

```bash
openclaw matrix encryption setup
```

secret storage और cross-signing को bootstrap करता है, आवश्यकता होने पर room-key backup बनाता है, फिर status और अगले चरण प्रिंट करता है. उपयोगी flags:

- `--recovery-key <key>` bootstrapping से पहले recovery key लागू करें (नीचे documented stdin form को प्राथमिकता दें)
- `--force-reset-cross-signing` वर्तमान cross-signing identity को हटाकर नई बनाएं (केवल जानबूझकर उपयोग करें)

नए खाते के लिए, निर्माण के समय E2EE सक्षम करें:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` `--enable-e2ee` का alias है.

समतुल्य manual config:

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

### स्थिति और trust signals

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` तीन स्वतंत्र trust signals रिपोर्ट करता है (`--verbose` वे सभी दिखाता है):

- `Locally trusted`: केवल इस क्लाइंट द्वारा trusted
- `Cross-signing verified`: SDK cross-signing के माध्यम से verification रिपोर्ट करता है
- `Signed by owner`: आपकी अपनी self-signing key द्वारा signed (केवल diagnostic)

`Verified by owner` केवल तब `yes` बनता है जब `Cross-signing verified` `yes` हो. केवल local trust या owner signature पर्याप्त नहीं है.

`--allow-degraded-local-state` Matrix खाते को पहले तैयार किए बिना best-effort diagnostics लौटाता है; offline या partially-configured probes के लिए उपयोगी.

### इस device को recovery key से verify करें

recovery key संवेदनशील है - इसे command line पर पास करने के बजाय stdin के माध्यम से pipe करें. `MATRIX_RECOVERY_KEY` सेट करें (या named account के लिए `MATRIX_<ID>_RECOVERY_KEY`):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

कमांड तीन स्थितियां रिपोर्ट करता है:

- `Recovery key accepted`: Matrix ने secret storage या device trust के लिए key स्वीकार की.
- `Backup usable`: room-key backup trusted recovery material के साथ load किया जा सकता है.
- `Device verified by owner`: इस device को पूर्ण Matrix cross-signing identity trust है.

पूर्ण identity trust अधूरा होने पर यह non-zero exit करता है, भले ही recovery key ने backup material unlock कर दिया हो. उस स्थिति में, किसी अन्य Matrix client से self-verification पूरा करें:

```bash
openclaw matrix verify self
```

`verify self` सफलतापूर्वक exit करने से पहले `Cross-signing verified: yes` की प्रतीक्षा करता है. प्रतीक्षा समायोजित करने के लिए `--timeout-ms <ms>` का उपयोग करें.

literal-key form `openclaw matrix verify device "<recovery-key>"` भी स्वीकार किया जाता है, लेकिन key आपकी shell history में चली जाती है.

### cross-signing को bootstrap या repair करें

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` एन्क्रिप्टेड खातों के लिए repair और setup कमांड है. क्रम में, यह:

- secret storage को bootstrap करता है, संभव होने पर मौजूदा recovery key का पुनः उपयोग करता है
- cross-signing को bootstrap करता है और missing public keys अपलोड करता है
- current device को mark और cross-sign करता है
- यदि server-side room-key backup पहले से मौजूद नहीं है तो उसे बनाता है

यदि homeserver को cross-signing keys अपलोड करने के लिए UIA चाहिए, OpenClaw पहले no-auth आज़माता है, फिर `m.login.dummy`, फिर `m.login.password` (`channels.matrix.password` आवश्यक).

उपयोगी flags:

- `--recovery-key-stdin` (`printf '%s\n' "$MATRIX_RECOVERY_KEY" | …` के साथ pair करें) या `--recovery-key <key>`
- `--force-reset-cross-signing` वर्तमान cross-signing identity को हटाने के लिए (केवल जानबूझकर; active recovery key को stored होना या `--recovery-key-stdin` के साथ supplied होना आवश्यक)

### Room-key backup

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` दिखाता है कि server-side backup मौजूद है या नहीं और यह device उसे decrypt कर सकता है या नहीं. `backup restore` backed-up room keys को local crypto store में import करता है; यदि recovery key पहले से disk पर है तो आप `--recovery-key-stdin` छोड़ सकते हैं.

टूटे हुए backup को fresh baseline से बदलने के लिए (unrecoverable old history खोने को स्वीकार करता है; यदि current backup secret unloadable है तो secret storage को फिर से बना भी सकता है):

```bash
openclaw matrix verify backup reset --yes
```

`--rotate-recovery-key` केवल तब जोड़ें जब आप जानबूझकर चाहते हों कि previous recovery key fresh backup baseline को unlock करना बंद कर दे.

### verifications को list करना, request करना, और respond करना

```bash
openclaw matrix verify list
```

चुने गए खाते के लिए pending verification requests सूचीबद्ध करता है.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

इस OpenClaw खाते से verification request भेजता है. `--own-user` self-verification request करता है (आप उसी user के किसी अन्य Matrix client में prompt स्वीकार करते हैं); `--user-id`/`--device-id`/`--room-id` किसी और को target करते हैं. `--own-user` को अन्य targeting flags के साथ combine नहीं किया जा सकता.

Lower-level lifecycle handling के लिए - आम तौर पर किसी अन्य client से inbound requests को shadow करते समय - ये कमांड किसी विशिष्ट request `<id>` पर काम करते हैं (`verify list` और `verify request` द्वारा printed):

| कमांड                                    | उद्देश्य                                                             |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | inbound request स्वीकार करें                                           |
| `openclaw matrix verify start <id>`        | SAS flow शुरू करें                                                  |
| `openclaw matrix verify sas <id>`          | SAS emoji या decimals प्रिंट करें                                     |
| `openclaw matrix verify confirm-sas <id>`  | पुष्टि करें कि SAS दूसरे client द्वारा दिखाए गए से match करता है            |
| `openclaw matrix verify mismatch-sas <id>` | जब emoji या decimals match न करें तो SAS reject करें              |
| `openclaw matrix verify cancel <id>`       | रद्द करें; optional `--reason <text>` और `--code <matrix-code>` लेता है |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas`, और `cancel` सभी `--user-id` और `--room-id` को DM follow-up hints के रूप में स्वीकार करते हैं जब verification किसी specific direct-message room से anchored हो.

### Multi-account notes

`--account <id>` के बिना, Matrix CLI commands implicit default account का उपयोग करते हैं. यदि आपके पास कई named accounts हैं और आपने `channels.matrix.defaultAccount` सेट नहीं किया है, तो वे guess करने से इंकार करेंगे और आपसे चुनने को कहेंगे. जब किसी named account के लिए E2EE disabled या unavailable हो, errors उस account की config key की ओर संकेत करते हैं, उदाहरण के लिए `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="स्टार्टअप व्यवहार">
    `encryption: true` के साथ, `startupVerification` डिफ़ॉल्ट रूप से `"if-unverified"` होता है. startup पर unverified device किसी अन्य Matrix client में self-verification request करता है, duplicates छोड़ता है और cooldown लागू करता है (डिफ़ॉल्ट रूप से 24 घंटे). `startupVerificationCooldownHours` से tune करें या `startupVerification: "off"` से disable करें.

    Startup एक conservative crypto bootstrap pass भी चलाता है जो current secret storage और cross-signing identity का पुनः उपयोग करता है. यदि bootstrap state broken है, OpenClaw `channels.matrix.password` के बिना भी guarded repair का प्रयास करता है; यदि homeserver को password UIA चाहिए, startup warning log करता है और non-fatal रहता है. Already-owner-signed devices सुरक्षित रखे जाते हैं.

    पूर्ण upgrade flow के लिए [Matrix migration](/hi/channels/matrix-migration) देखें.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix strict DM verification room में verification lifecycle notices को `m.notice` messages के रूप में post करता है: request, ready ("Verify by emoji" guidance के साथ), start/completion, और उपलब्ध होने पर SAS (emoji/decimal) details.

    किसी अन्य Matrix client से incoming requests को tracked और auto-accepted किया जाता है. self-verification के लिए, OpenClaw SAS flow अपने आप शुरू करता है और emoji verification उपलब्ध होते ही अपनी side confirm करता है - आपको अभी भी अपने Matrix client में compare करके "They match" confirm करना होगा.

    Verification system notices agent chat pipeline को forward नहीं किए जाते.

  </Accordion>

  <Accordion title="हटाया गया या अमान्य Matrix device">
    यदि `verify status` कहता है कि current device अब homeserver पर listed नहीं है, तो नया OpenClaw Matrix device बनाएं. password login के लिए:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    टोकन auth के लिए, अपने Matrix क्लाइंट या admin UI में एक ताज़ा access token बनाएं, फिर OpenClaw अपडेट करें:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    `assistant` को विफल कमांड के account ID से बदलें, या default account के लिए `--account` छोड़ दें।

  </Accordion>

  <Accordion title="डिवाइस स्वच्छता">
    पुराने OpenClaw-प्रबंधित डिवाइस जमा हो सकते हैं। सूची बनाएं और हटाएं:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE आधिकारिक `matrix-js-sdk` Rust crypto पथ का उपयोग करता है, जिसमें IndexedDB shim के रूप में `fake-indexeddb` होता है। Crypto स्थिति `crypto-idb-snapshot.json` में बनी रहती है (प्रतिबंधात्मक फ़ाइल अनुमतियां)।

    एन्क्रिप्टेड runtime स्थिति `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` के अंतर्गत रहती है और इसमें sync store, crypto store, recovery key, IDB snapshot, thread bindings, और startup verification state शामिल होते हैं। जब token बदलता है लेकिन account identity वही रहती है, OpenClaw सबसे अच्छा मौजूदा root दोबारा उपयोग करता है ताकि पिछली स्थिति दिखाई देती रहे।

    एक single पुराना token-hash root सामान्य token-rotation continuity path हो सकता है। यदि OpenClaw `matrix: multiple populated token-hash storage roots detected` लॉग करता है, तो account directory जांचें और stale sibling roots को केवल यह पुष्टि करने के बाद archive करें कि चुना गया active root स्वस्थ है। Stale roots को तुरंत हटाने के बजाय उन्हें `_archive/` directory में ले जाना बेहतर है।

  </Accordion>
</AccordionGroup>

## Profile प्रबंधन

चुने गए account के लिए Matrix self-profile अपडेट करें:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

आप दोनों options एक ही call में दे सकते हैं। Matrix `mxc://` avatar URLs को सीधे स्वीकार करता है; जब आप `http://` या `https://` देते हैं, तो OpenClaw पहले file upload करता है और resolved `mxc://` URL को `channels.matrix.avatarUrl` (या per-account override) में store करता है।

## Threads

Matrix automatic replies और message-tool sends, दोनों के लिए native Matrix threads का समर्थन करता है। दो independent knobs behavior नियंत्रित करते हैं:

### Session routing (`sessionScope`)

`dm.sessionScope` तय करता है कि Matrix DM rooms OpenClaw sessions से कैसे map होते हैं:

- `"per-user"` (default): समान routed peer वाले सभी DM rooms एक session share करते हैं।
- `"per-room"`: हर Matrix DM room को अपनी session key मिलती है, भले ही peer वही हो।

Explicit conversation bindings हमेशा `sessionScope` पर जीतते हैं, इसलिए bound rooms और threads अपना चुना हुआ target session बनाए रखते हैं।

### Reply threading (`threadReplies`)

`threadReplies` तय करता है कि bot अपना reply कहां post करता है:

- `"off"`: replies top-level होते हैं। Inbound threaded messages parent session पर रहते हैं।
- `"inbound"`: thread के अंदर reply केवल तब करें जब inbound message पहले से उसी thread में था।
- `"always"`: triggering message पर rooted thread के अंदर reply करें; वह conversation पहले trigger से ही matching thread-scoped session के through route होती है।

`dm.threadReplies` इसे केवल DMs के लिए override करता है - उदाहरण के लिए, room threads को isolated रखें जबकि DMs को flat रखें।

### Thread inheritance और slash commands

- Inbound threaded messages thread root message को extra agent context के रूप में शामिल करते हैं।
- Message-tool sends समान room (या समान DM user target) को target करते समय current Matrix thread को auto-inherit करते हैं, जब तक कि explicit `threadId` न दिया गया हो।
- DM user-target reuse केवल तब लागू होता है जब current session metadata समान Matrix account पर वही DM peer साबित करता है; अन्यथा OpenClaw सामान्य user-scoped routing पर वापस चला जाता है।
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, और thread-bound `/acp spawn` सभी Matrix rooms और DMs में काम करते हैं।
- Top-level `/focus` एक नया Matrix thread बनाता है और `threadBindings.spawnSessions` enabled होने पर उसे target session से bind करता है।
- Existing Matrix thread के अंदर `/focus` या `/acp spawn --thread here` चलाने से वह thread वहीं bind हो जाता है।

जब OpenClaw समान shared session पर किसी दूसरे DM room से टकराता हुआ Matrix DM room detect करता है, तो वह उस room में एक one-time `m.notice` post करता है जो `/focus` escape hatch की ओर इशारा करता है और `dm.sessionScope` change का सुझाव देता है। Notice केवल तब दिखाई देता है जब thread bindings enabled हों।

## ACP conversation bindings

Matrix rooms, DMs, और existing Matrix threads को chat surface बदले बिना durable ACP workspaces में बदला जा सकता है।

तेज़ operator flow:

- जिस Matrix DM, room, या existing thread का उपयोग जारी रखना चाहते हैं, उसके अंदर `/acp spawn codex --bind here` चलाएं।
- Top-level Matrix DM या room में, current DM/room chat surface बना रहता है और future messages spawned ACP session को route होते हैं।
- Existing Matrix thread के अंदर, `--bind here` उस current thread को वहीं bind करता है।
- `/new` और `/reset` वही bound ACP session वहीं reset करते हैं।
- `/acp close` ACP session बंद करता है और binding हटाता है।

नोट्स:

- `--bind here` child Matrix thread नहीं बनाता।
- `threadBindings.spawnSessions` `/acp spawn --thread auto|here` को gate करता है, जहां OpenClaw को child Matrix thread बनाना या bind करना होता है।

### Thread binding config

Matrix `session.threadBindings` से global defaults inherit करता है, और per-channel overrides का भी समर्थन करता है:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix thread-bound session spawns default रूप से on हैं:

- Top-level `/focus` और `/acp spawn --thread auto|here` को Matrix threads बनाने/bind करने से रोकने के लिए `threadBindings.spawnSessions: false` set करें।
- जब native subagent thread spawns को parent transcript fork नहीं करना चाहिए, तो `threadBindings.defaultSpawnContext: "isolated"` set करें।

## Reactions

Matrix outbound reactions, inbound reaction notifications, और ack reactions का समर्थन करता है।

Outbound reaction tooling `channels.matrix.actions.reactions` से gated है:

- `react` Matrix event में reaction जोड़ता है।
- `reactions` Matrix event के लिए current reaction summary list करता है।
- `emoji=""` उस event पर bot की अपनी reactions हटाता है।
- `remove: true` bot से केवल specified emoji reaction हटाता है।

**Resolution order** (पहली defined value जीतती है):

| Setting                 | Order                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | per-account → channel → `messages.ackReaction` → agent identity emoji fallback   |
| `ackReactionScope`      | per-account → channel → `messages.ackReactionScope` → default `"group-mentions"` |
| `reactionNotifications` | per-account → channel → default `"own"`                                          |

`reactionNotifications: "own"` added `m.reaction` events को तब forward करता है जब वे bot-authored Matrix messages को target करते हैं; `"off"` reaction system events को disable करता है। Reaction removals को system events में synthesize नहीं किया जाता क्योंकि Matrix उन्हें redactions के रूप में surface करता है, standalone `m.reaction` removals के रूप में नहीं।

## History context

- `channels.matrix.historyLimit` नियंत्रित करता है कि जब Matrix room message agent को trigger करता है, तो कितने recent room messages `InboundHistory` के रूप में शामिल किए जाते हैं। यह `messages.groupChat.historyLimit` पर fallback करता है; यदि दोनों unset हैं, तो effective default `0` है। Disable करने के लिए `0` set करें।
- Matrix room history केवल room-only है। DMs सामान्य session history का उपयोग जारी रखते हैं।
- Matrix room history pending-only है: OpenClaw उन room messages को buffer करता है जिन्होंने अभी reply trigger नहीं किया, फिर mention या अन्य trigger आने पर उस window का snapshot लेता है।
- Current trigger message `InboundHistory` में शामिल नहीं होता; वह उस turn के लिए main inbound body में रहता है।
- उसी Matrix event की retries newer room messages तक drift करने के बजाय original history snapshot को दोबारा उपयोग करती हैं।

## Context visibility

Matrix fetched reply text, thread roots, और pending history जैसे supplemental room context के लिए shared `contextVisibility` control का समर्थन करता है।

- `contextVisibility: "all"` default है। Supplemental context received रूप में रखा जाता है।
- `contextVisibility: "allowlist"` supplemental context को active room/user allowlist checks द्वारा allowed senders तक filter करता है।
- `contextVisibility: "allowlist_quote"` `allowlist` जैसा व्यवहार करता है, लेकिन फिर भी एक explicit quoted reply रखता है।

यह setting supplemental context visibility को affect करती है, यह नहीं कि inbound message खुद reply trigger कर सकता है या नहीं।
Trigger authorization अभी भी `groupPolicy`, `groups`, `groupAllowFrom`, और DM policy settings से आता है।

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

Rooms को चालू रखते हुए DMs को पूरी तरह silent करने के लिए, `dm.enabled: false` set करें:

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

यदि कोई unapproved Matrix user approval से पहले आपको message करता रहता है, तो OpenClaw वही pending pairing code दोबारा उपयोग करता है और नया code mint करने के बजाय short cooldown के बाद reminder reply भेज सकता है।

Shared DM pairing flow और storage layout के लिए [Pairing](/hi/channels/pairing) देखें।

## Direct room repair

यदि direct-message state sync से बाहर drift हो जाती है, तो OpenClaw stale `m.direct` mappings के साथ समाप्त हो सकता है जो live DM के बजाय पुराने solo rooms की ओर point करते हैं। किसी peer के लिए current mapping inspect करें:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

इसे repair करें:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

दोनों commands multi-account setups के लिए `--account <id>` स्वीकार करते हैं। Repair flow:

- ऐसे strict 1:1 DM को prefer करता है जो पहले से `m.direct` में mapped है
- उस user के साथ किसी भी currently joined strict 1:1 DM पर fallback करता है
- यदि कोई healthy DM मौजूद नहीं है, तो fresh direct room बनाता है और `m.direct` rewrite करता है

यह पुराने rooms को automatically delete नहीं करता। यह healthy DM चुनता है और mapping update करता है ताकि future Matrix sends, verification notices, और अन्य direct-message flows सही room को target करें।

## Exec approvals

Matrix native approval client के रूप में काम कर सकता है। `channels.matrix.execApprovals` (या per-account override के लिए `channels.matrix.accounts.<account>.execApprovals`) के अंतर्गत configure करें:

- `enabled`: Matrix-native prompts के through approvals deliver करें। Unset या `"auto"` होने पर, कम से कम एक approver resolve होते ही Matrix auto-enable हो जाता है। Explicit रूप से disable करने के लिए `false` set करें।
- `approvers`: Matrix user IDs (`@owner:example.org`) जिन्हें exec requests approve करने की अनुमति है। Optional - `channels.matrix.dm.allowFrom` पर fallback करता है।
- `target`: prompts कहां जाते हैं। `"dm"` (default) approver DMs को भेजता है; `"channel"` originating Matrix room या DM को भेजता है; `"both"` दोनों को भेजता है।
- `agentFilter` / `sessionFilter`: किन agents/sessions से Matrix delivery trigger होती है, इसके लिए optional allowlists।

Approval kinds के बीच authorization थोड़ा अलग है:

- **Exec approvals** `execApprovals.approvers` का उपयोग करते हैं, और `dm.allowFrom` पर fallback करते हैं।
- **Plugin approvals** केवल `dm.allowFrom` के through authorize होते हैं।

दोनों kinds Matrix reaction shortcuts और message updates share करते हैं। Approvers primary approval message पर reaction shortcuts देखते हैं:

- `✅` एक बार allow करें
- `❌` deny करें
- `♾️` हमेशा allow करें (जब effective exec policy इसकी अनुमति देती है)

Fallback स्लैश कमांड: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

केवल resolved approvers ही approve या deny कर सकते हैं। exec approvals के लिए channel delivery में command text शामिल होता है - `channel` या `both` केवल भरोसेमंद rooms में सक्षम करें।

संबंधित: [Exec approvals](/hi/tools/exec-approvals).

## स्लैश कमांड

स्लैश कमांड (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, आदि) DMs में सीधे काम करते हैं। rooms में, OpenClaw उन commands को भी पहचानता है जिनके आगे bot का अपना Matrix mention लगा होता है, इसलिए `@bot:server /new` custom mention regex के बिना command path को trigger करता है। इससे bot उन room-style `@mention /command` posts के प्रति responsive रहता है जिन्हें Element और समान clients तब emit करते हैं जब कोई user command type करने से पहले bot को tab-complete करता है।

Authorization rules अभी भी लागू होते हैं: command senders को plain messages की तरह ही वही DM या room allowlist/owner policies पूरी करनी होंगी।

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

- Top-level `channels.matrix` values named accounts के लिए defaults की तरह काम करते हैं, जब तक कोई account उन्हें override न करे।
- inherited room entry को `groups.<room>.account` के साथ किसी specific account तक scope करें। `account` के बिना entries accounts के बीच shared रहती हैं; `account: "default"` तब भी काम करता है जब default account top level पर configured हो।

**Default account selection:**

- implicit routing, probing, और CLI commands जिस named account को prefer करें, उसे चुनने के लिए `defaultAccount` set करें।
- अगर आपके पास multiple accounts हैं और उनमें से एक का नाम literally `default` है, तो OpenClaw उसे implicit रूप से use करता है, भले ही `defaultAccount` unset हो।
- अगर आपके पास multiple named accounts हैं और कोई default selected नहीं है, तो CLI commands अनुमान लगाने से इनकार करते हैं - `defaultAccount` set करें या `--account <id>` pass करें।
- Top-level `channels.matrix.*` block को implicit `default` account की तरह केवल तभी माना जाता है जब उसका auth complete हो (`homeserver` + `accessToken`, या `homeserver` + `userId` + `password`)। Named accounts `homeserver` + `userId` से discoverable रहते हैं, जब cached credentials auth को cover करते हैं।

**Promotion:**

- जब OpenClaw repair या setup के दौरान single-account config को multi-account में promote करता है, तो यदि existing named account मौजूद हो या `defaultAccount` पहले से किसी account की ओर point करता हो, वह उसे preserve करता है। केवल Matrix auth/bootstrap keys promoted account में move होती हैं; shared delivery-policy keys top level पर रहती हैं।

shared multi-account pattern के लिए [Configuration reference](/hi/gateway/config-channels#multi-account-all-channels) देखें।

## Private/LAN homeservers

Default रूप से, OpenClaw SSRF protection के लिए private/internal Matrix homeservers को block करता है, जब तक आप
per account explicit रूप से opt in न करें।

अगर आपका homeserver localhost, LAN/Tailscale IP, या internal hostname पर चलता है, तो उस Matrix account के लिए
`network.dangerouslyAllowPrivateNetwork` सक्षम करें:

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

यह opt-in केवल trusted private/internal targets को allow करता है। Public cleartext homeservers जैसे
`http://matrix.example.org:8008` block रहते हैं। जहाँ संभव हो `https://` prefer करें।

## Matrix traffic को proxy करना

अगर आपके Matrix deployment को explicit outbound HTTP(S) proxy चाहिए, तो `channels.matrix.proxy` set करें:

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

Named accounts top-level default को `channels.matrix.accounts.<id>.proxy` के साथ override कर सकते हैं।
OpenClaw runtime Matrix traffic और account status probes के लिए वही proxy setting use करता है।

## Target resolution

जहाँ भी OpenClaw आपसे room या user target मांगता है, Matrix इन target forms को accept करता है:

- Users: `@user:server`, `user:@user:server`, या `matrix:user:@user:server`
- Rooms: `!room:server`, `room:!room:server`, या `matrix:room:!room:server`
- Aliases: `#alias:server`, `channel:#alias:server`, या `matrix:channel:#alias:server`

Matrix room IDs case-sensitive होते हैं। explicit delivery targets, cron jobs, bindings, या allowlists configure करते समय Matrix से मिली exact room ID casing use करें।
OpenClaw storage के लिए internal session keys को canonical रखता है, इसलिए वे lowercase
keys Matrix delivery IDs के लिए reliable source नहीं हैं।

Live directory lookup logged-in Matrix account use करता है:

- User lookups उस homeserver पर Matrix user directory query करते हैं।
- Room lookups explicit room IDs और aliases को सीधे accept करते हैं। Joined-room name lookup best-effort है और runtime room allowlists पर केवल तब लागू होता है जब `dangerouslyAllowNameMatching: true` set हो।
- अगर room name को ID या alias में resolve नहीं किया जा सकता, तो runtime allowlist resolution द्वारा उसे ignore किया जाता है।

## Configuration reference

Allowlist-style user fields (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) full Matrix user IDs accept करते हैं (सबसे सुरक्षित)। Non-ID user entries default रूप से ignore की जाती हैं। अगर आप `dangerouslyAllowNameMatching: true` set करते हैं, तो exact Matrix directory display-name matches startup पर और monitor running रहने के दौरान allowlist बदलने पर resolve किए जाते हैं; जिन entries को resolve नहीं किया जा सकता, उन्हें runtime पर ignore किया जाता है।

Room allowlist keys (`groups`, legacy `rooms`) room IDs या aliases होने चाहिए। Plain room-name keys default रूप से ignore की जाती हैं; `dangerouslyAllowNameMatching: true` joined room names के खिलाफ best-effort lookup restore करता है।

### Account and connection

- `enabled`: channel को enable या disable करें।
- `name`: account के लिए optional display label।
- `defaultAccount`: जब multiple Matrix accounts configured हों तो preferred account ID।
- `accounts`: named per-account overrides। Top-level `channels.matrix` values defaults के रूप में inherit होते हैं।
- `homeserver`: homeserver URL, उदाहरण के लिए `https://matrix.example.org`।
- `network.dangerouslyAllowPrivateNetwork`: इस account को `localhost`, LAN/Tailscale IPs, या internal hostnames से connect करने दें।
- `proxy`: Matrix traffic के लिए optional HTTP(S) proxy URL। Per-account override supported है।
- `userId`: full Matrix user ID (`@bot:example.org`)।
- `accessToken`: token-based auth के लिए access token। Plaintext और SecretRef values env/file/exec providers में supported हैं ([Secrets Management](/hi/gateway/secrets))।
- `password`: password-based login के लिए password। Plaintext और SecretRef values supported हैं।
- `deviceId`: explicit Matrix device ID।
- `deviceName`: password-login time पर use होने वाला device display name।
- `avatarUrl`: profile sync और `profile set` updates के लिए stored self-avatar URL।
- `initialSyncLimit`: startup sync के दौरान fetched events की maximum संख्या।

### Encryption

- `encryption`: E2EE enable करें। Default: `false`।
- `startupVerification`: `"if-unverified"` (E2EE on होने पर default) या `"off"`। जब यह device unverified हो, तो startup पर self-verification auto-request करता है।
- `startupVerificationCooldownHours`: अगले automatic startup request से पहले cooldown। Default: `24`।

### Access and policy

- `groupPolicy`: `"open"`, `"allowlist"`, या `"disabled"`। Default: `"allowlist"`।
- `groupAllowFrom`: room traffic के लिए user IDs की allowlist।
- `mentionPatterns`: room mentions के लिए scoped regex patterns। `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }` वाला object। Controls whether configured `agents.list[].groupChat.mentionPatterns` apply per-room.
- `dm.enabled`: जब `false` हो, सभी DMs ignore करें। Default: `true`।
- `dm.policy`: `"pairing"` (default), `"allowlist"`, `"open"`, या `"disabled"`। Bot के join करने और room को DM के रूप में classify करने के बाद लागू होता है; invite handling को affect नहीं करता।
- `dm.allowFrom`: DM traffic के लिए user IDs की allowlist।
- `dm.sessionScope`: `"per-user"` (default) या `"per-room"`।
- `dm.threadReplies`: reply threading के लिए DM-only override (`"off"`, `"inbound"`, `"always"`)।
- `allowBots`: other configured Matrix bot accounts से messages accept करें (`true` या `"mentions"`)।
- `allowlistOnly`: जब `true` हो, सभी active DM policies (`"disabled"` को छोड़कर) और `"open"` group policies को `"allowlist"` पर force करता है। `"disabled"` policies को change नहीं करता।
- `dangerouslyAllowNameMatching`: जब `true` हो, user allowlist entries के लिए Matrix display-name directory lookup और room allowlist keys के लिए joined-room name lookup allow करता है। Full `@user:server` IDs और room IDs या aliases prefer करें।
- `autoJoin`: `"always"`, `"allowlist"`, या `"off"`। Default: `"off"`। DM-style invites सहित हर Matrix invite पर लागू होता है।
- `autoJoinAllowlist`: जब `autoJoin` `"allowlist"` हो तो allowed rooms/aliases। Alias entries homeserver के खिलाफ resolve की जाती हैं, invited room द्वारा claimed state के खिलाफ नहीं।
- `contextVisibility`: supplemental context visibility (`"all"` default, `"allowlist"`, `"allowlist_quote"`)।

### Reply behavior

- `replyToMode`: `"off"`, `"first"`, `"all"`, या `"batched"`।
- `threadReplies`: `"off"`, `"inbound"`, या `"always"`।
- `threadBindings`: thread-bound session routing और lifecycle के लिए per-channel overrides।
- `streaming`: `"off"` (default), `"partial"`, `"quiet"`, `"progress"`, या object form `{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`। `true` ↔ `"partial"`, `false` ↔ `"off"`।
- `blockStreaming`: जब `true` हो, completed assistant blocks separate progress messages के रूप में रखे जाते हैं।
- `markdown`: outbound text के लिए optional Markdown rendering config।
- `responsePrefix`: outbound replies के आगे जोड़ी जाने वाली optional string।
- `textChunkLimit`: जब `chunkMode: "length"` हो तो characters में outbound chunk size। Default: `4000`।
- `chunkMode`: `"length"` (default, character count से split करता है) या `"newline"` (line boundaries पर split करता है)।
- `historyLimit`: recent room messages की संख्या, जो room message agent को trigger करने पर `InboundHistory` के रूप में include होती है। `messages.groupChat.historyLimit` पर falls back; effective default `0` (disabled)।
- `mediaMaxMb`: outbound sends और inbound processing के लिए MB में media size cap।

### Reaction settings

- `ackReaction`: इस channel/account के लिए ack reaction override।
- `ackReactionScope`: scope override (`"group-mentions"` default, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`)।
- `reactionNotifications`: inbound reaction notification mode (`"own"` default, `"off"`)।

### Tooling and per-room overrides

- `actions`: प्रति-action tool gating (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: प्रति-room नीति मैप। Session पहचान resolution के बाद स्थिर room ID का उपयोग करती है। (`rooms` एक legacy alias है।)
  - `groups.<room>.account`: inherited room entry को किसी विशिष्ट account तक सीमित करें।
  - `groups.<room>.enabled`: प्रति-room toggle। जब `false` हो, तो room को ऐसे अनदेखा किया जाता है मानो वह map में हो ही नहीं।
  - `groups.<room>.requireMention`: channel-level mention requirement का प्रति-room override।
  - `groups.<room>.allowBots`: channel-level setting (`true` या `"mentions"`) का प्रति-room override।
  - `groups.<room>.botLoopProtection`: bot-to-bot loop protection budget के लिए प्रति-room override।
  - `groups.<room>.users`: प्रति-room sender allowlist।
  - `groups.<room>.tools`: प्रति-room tool allow/deny overrides।
  - `groups.<room>.autoReply`: प्रति-room mention-gating override। `true` उस room के लिए mention requirements को अक्षम करता है; `false` उन्हें फिर से लागू करता है।
  - `groups.<room>.skills`: प्रति-room skill filter।
  - `groups.<room>.systemPrompt`: प्रति-room system prompt snippet।

### Exec approval settings

- `execApprovals.enabled`: Matrix-native prompts के माध्यम से exec approvals deliver करें।
- `execApprovals.approvers`: approve करने की अनुमति वाले Matrix user IDs। `dm.allowFrom` पर fallback करता है।
- `execApprovals.target`: `"dm"` (default), `"channel"`, या `"both"`।
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: delivery के लिए वैकल्पिक agent/session allowlists।

## Related

- [Channels Overview](/hi/channels) - सभी समर्थित channels
- [Pairing](/hi/channels/pairing) - DM authentication और pairing flow
- [Groups](/hi/channels/groups) - group chat behavior और mention gating
- [Channel Routing](/hi/channels/channel-routing) - messages के लिए session routing
- [Security](/hi/gateway/security) - access model और hardening
