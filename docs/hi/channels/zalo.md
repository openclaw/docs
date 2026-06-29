---
read_when:
    - Zalo सुविधाओं या Webhook पर काम करना
summary: Zalo बॉट समर्थन स्थिति, क्षमताएँ, और कॉन्फ़िगरेशन
title: Zalo
x-i18n:
    generated_at: "2026-06-28T22:41:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6226af1217e1e8b03b485df99f6375872b487f7040c091f2bb2d85e18dec75d0
    source_path: channels/zalo.md
    workflow: 16
---

स्थिति: प्रयोगात्मक। DMs समर्थित हैं। नीचे [क्षमताएँ](#capabilities) अनुभाग वर्तमान Marketplace-bot व्यवहार को दर्शाता है।

## बंडल किया गया Plugin

Zalo वर्तमान OpenClaw रिलीज़ में बंडल किए गए Plugin के रूप में आता है, इसलिए सामान्य पैकेज किए गए
बिल्ड को अलग इंस्टॉल की आवश्यकता नहीं होती।

यदि आप किसी पुराने बिल्ड पर हैं या ऐसे कस्टम इंस्टॉल पर हैं जिसमें Zalo शामिल नहीं है, तो
npm पैकेज सीधे इंस्टॉल करें:

- CLI के माध्यम से इंस्टॉल करें: `openclaw plugins install @openclaw/zalo`
- पिन किया गया संस्करण: `openclaw plugins install @openclaw/zalo@2026.5.2`
- या किसी स्रोत checkout से: `openclaw plugins install ./path/to/local/zalo-plugin`
- विवरण: [Plugin](/hi/tools/plugin)

## त्वरित सेटअप (शुरुआती)

1. सुनिश्चित करें कि Zalo Plugin उपलब्ध है।
   - वर्तमान पैकेज किए गए OpenClaw रिलीज़ में यह पहले से बंडल होता है।
   - पुराने/कस्टम इंस्टॉल इसे ऊपर दिए गए कमांड से मैन्युअल रूप से जोड़ सकते हैं।
2. token सेट करें:
   - Env: `ZALO_BOT_TOKEN=...`
   - या config: `channels.zalo.accounts.default.botToken: "..."`.
3. gateway पुनः प्रारंभ करें (या सेटअप पूरा करें)।
4. DM पहुंच डिफ़ॉल्ट रूप से pairing है; पहले संपर्क पर pairing code approve करें।

न्यूनतम config:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

## यह क्या है

Zalo वियतनाम-केंद्रित messaging app है; इसका Bot API Gateway को 1:1 बातचीत के लिए bot चलाने देता है।
यह support या notifications के लिए उपयुक्त है, जहां आप Zalo पर deterministic routing वापस चाहते हैं।

यह पृष्ठ **Zalo Bot Creator / Marketplace bots** के लिए वर्तमान OpenClaw व्यवहार दर्शाता है।
**Zalo Official Account (OA) bots** Zalo का अलग product surface है और अलग तरह से व्यवहार कर सकता है।

- Gateway के स्वामित्व वाला Zalo Bot API channel।
- Deterministic routing: replies वापस Zalo पर जाते हैं; model कभी channels नहीं चुनता।
- DMs agent के मुख्य session को साझा करते हैं।
- नीचे [क्षमताएँ](#capabilities) अनुभाग वर्तमान Marketplace-bot support दिखाता है।

## सेटअप (तेज़ रास्ता)

### 1) bot token बनाएं (Zalo Bot Platform)

1. [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) पर जाएं और sign in करें।
2. नया bot बनाएं और उसकी settings configure करें।
3. पूरा bot token copy करें (आम तौर पर `numeric_id:secret`)। Marketplace bots के लिए, usable runtime token creation के बाद bot के welcome message में दिखाई दे सकता है।

### 2) token configure करें (env या config)

उदाहरण:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

यदि आप बाद में ऐसे Zalo bot surface पर जाते हैं जहां groups उपलब्ध हैं, तो आप `groupPolicy` और `groupAllowFrom` जैसी group-specific config स्पष्ट रूप से जोड़ सकते हैं। वर्तमान Marketplace-bot व्यवहार के लिए, [क्षमताएँ](#capabilities) देखें।

Env विकल्प: `ZALO_BOT_TOKEN=...` (केवल default account के लिए काम करता है)।

Multi-account support: per-account tokens और वैकल्पिक `name` के साथ `channels.zalo.accounts` का उपयोग करें।

3. gateway पुनः प्रारंभ करें। token resolve होने पर Zalo शुरू होता है (env या config)।
4. DM पहुंच default रूप से pairing होती है। bot से पहली बार संपर्क होने पर code approve करें।

## यह कैसे काम करता है (व्यवहार)

- Inbound messages media placeholders के साथ shared channel envelope में normalized होते हैं।
- Replies हमेशा उसी Zalo chat पर वापस route होते हैं।
- Default रूप से long-polling; webhook mode `channels.zalo.webhookUrl` के साथ उपलब्ध है।

## सीमाएं

- Outbound text को 2000 characters में chunk किया जाता है (Zalo API limit)।
- Media downloads/uploads `channels.zalo.mediaMaxMb` से capped हैं (default 5)।
- 2000 char limit के कारण streaming कम उपयोगी होने से default रूप से blocked है।

## पहुंच नियंत्रण (DMs)

### DM पहुंच

- Default: `channels.zalo.dmPolicy = "pairing"`। Unknown senders को pairing code मिलता है; approve होने तक messages ignore किए जाते हैं (codes 1 घंटे बाद expire होते हैं)।
- इसके माध्यम से approve करें:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- Pairing default token exchange है। विवरण: [Pairing](/hi/channels/pairing)
- `channels.zalo.allowFrom` numeric user IDs स्वीकार करता है (username lookup उपलब्ध नहीं है)।

## पहुंच नियंत्रण (Groups)

**Zalo Bot Creator / Marketplace bots** के लिए, group support व्यवहार में उपलब्ध नहीं था क्योंकि bot को group में जोड़ा ही नहीं जा सकता था।

इसका मतलब है कि नीचे दी गई group-related config keys schema में मौजूद हैं, लेकिन Marketplace bots के लिए usable नहीं थीं:

- `channels.zalo.groupPolicy` group inbound handling नियंत्रित करता है: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` यह restrict करता है कि groups में कौन से sender IDs bot को trigger कर सकते हैं।
- यदि `groupAllowFrom` unset है, तो Zalo sender checks के लिए `allowFrom` पर fallback करता है।
- Runtime note: यदि `channels.zalo` पूरी तरह missing है, तो runtime safety के लिए अभी भी `groupPolicy="allowlist"` पर fallback करता है।

group policy values (जब आपके bot surface पर group access उपलब्ध हो) हैं:

- `groupPolicy: "disabled"` — सभी group messages को block करता है।
- `groupPolicy: "open"` — किसी भी group member को allow करता है (mention-gated)।
- `groupPolicy: "allowlist"` — fail-closed default; केवल allowed senders स्वीकार किए जाते हैं।

यदि आप किसी अलग Zalo bot product surface का उपयोग कर रहे हैं और working group behavior verify कर चुके हैं, तो यह मानने के बजाय कि वह Marketplace-bot flow से मेल खाता है, उसे अलग से document करें।

## Long-polling बनाम webhook

- Default: long-polling (public URL आवश्यक नहीं)।
- Webhook mode: `channels.zalo.webhookUrl` और `channels.zalo.webhookSecret` सेट करें।
  - webhook secret 8-256 characters का होना चाहिए।
  - Webhook URL को HTTPS का उपयोग करना चाहिए।
  - Zalo verification के लिए `X-Bot-Api-Secret-Token` header के साथ events भेजता है।
  - Gateway HTTP `channels.zalo.webhookPath` पर webhook requests handle करता है (default webhook URL path पर होता है)।
  - Requests को `Content-Type: application/json` (या `+json` media types) का उपयोग करना चाहिए।
  - Duplicate events (`event_name + message_id`) short replay window के लिए ignore किए जाते हैं।
  - Burst traffic path/source के अनुसार rate-limited है और HTTP 429 return कर सकता है।

**नोट:** getUpdates (polling) और webhook Zalo API docs के अनुसार per-bot mutually exclusive हैं।

## समर्थित message types

त्वरित support snapshot के लिए, [क्षमताएँ](#capabilities) देखें। नीचे दिए गए notes वहां detail जोड़ते हैं जहां behavior को अतिरिक्त context चाहिए।

- **Text messages**: 2000 character chunking के साथ पूरा support।
- **Text में plain URLs**: सामान्य text input की तरह व्यवहार करते हैं।
- **Link previews / rich link cards**: [क्षमताएँ](#capabilities) में Marketplace-bot status देखें; वे reliably reply trigger नहीं करते थे।
- **Image messages**: [क्षमताएँ](#capabilities) में Marketplace-bot status देखें; inbound image handling unreliable था (final reply के बिना typing indicator)।
- **Stickers**: [क्षमताएँ](#capabilities) में Marketplace-bot status देखें।
- **Voice notes / audio files / video / generic file attachments**: [क्षमताएँ](#capabilities) में Marketplace-bot status देखें।
- **Unsupported types**: Logged (उदाहरण के लिए, protected users से messages)।

## क्षमताएँ

यह table OpenClaw में वर्तमान **Zalo Bot Creator / Marketplace bot** behavior का सारांश देता है।

| Feature                     | Status                                  |
| --------------------------- | --------------------------------------- |
| Direct messages             | ✅ समर्थित                              |
| Groups                      | ❌ Marketplace bots के लिए उपलब्ध नहीं  |
| Media (inbound images)      | ⚠️ सीमित / अपने environment में verify करें |
| Media (outbound images)     | ⚠️ Marketplace bots के लिए फिर से test नहीं किया गया |
| Plain URLs in text          | ✅ समर्थित                              |
| Link previews               | ⚠️ Marketplace bots के लिए unreliable   |
| Reactions                   | ❌ समर्थित नहीं                         |
| Stickers                    | ⚠️ Marketplace bots के लिए कोई agent reply नहीं |
| Voice notes / audio / video | ⚠️ Marketplace bots के लिए कोई agent reply नहीं |
| File attachments            | ⚠️ Marketplace bots के लिए कोई agent reply नहीं |
| Threads                     | ❌ समर्थित नहीं                         |
| Polls                       | ❌ समर्थित नहीं                         |
| Native commands             | ❌ समर्थित नहीं                         |
| Streaming                   | ⚠️ Blocked (2000 char limit)            |

## Delivery targets (CLI/cron)

- target के रूप में chat id का उपयोग करें।
- उदाहरण: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Troubleshooting

**Bot respond नहीं करता:**

- जांचें कि token valid है: `openclaw channels status --probe`
- verify करें कि sender approved है (pairing या allowFrom)
- gateway logs देखें: `openclaw logs --follow`

**Webhook events receive नहीं कर रहा:**

- सुनिश्चित करें कि webhook URL HTTPS का उपयोग करता है
- verify करें कि secret token 8-256 characters का है
- पुष्टि करें कि gateway HTTP endpoint configured path पर reachable है
- जांचें कि getUpdates polling चल नहीं रहा है (वे mutually exclusive हैं)

## Configuration reference (Zalo)

पूरा configuration: [Configuration](/hi/gateway/configuration)

Flat top-level keys (`channels.zalo.botToken`, `channels.zalo.dmPolicy`, और समान) legacy single-account shorthand हैं। नई configs के लिए `channels.zalo.accounts.<id>.*` को प्राथमिकता दें। दोनों forms अभी भी यहां documented हैं क्योंकि वे schema में मौजूद हैं।

Provider options:

- `channels.zalo.enabled`: channel startup enable/disable करें।
- `channels.zalo.botToken`: Zalo Bot Platform से bot token।
- `channels.zalo.tokenFile`: regular file path से token read करें। Symlinks rejected हैं।
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (default: pairing)।
- `channels.zalo.allowFrom`: DM allowlist (user IDs)। `open` के लिए `"*"` आवश्यक है। wizard numeric IDs मांगेगा।
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (default: allowlist)। config में मौजूद; वर्तमान Marketplace-bot behavior के लिए [क्षमताएँ](#capabilities) और [पहुंच नियंत्रण (Groups)](#access-control-groups) देखें।
- `channels.zalo.groupAllowFrom`: group sender allowlist (user IDs)। unset होने पर `allowFrom` पर fallback करता है।
- `channels.zalo.mediaMaxMb`: inbound/outbound media cap (MB, default 5)।
- `channels.zalo.webhookUrl`: webhook mode enable करें (HTTPS आवश्यक)।
- `channels.zalo.webhookSecret`: webhook secret (8-256 chars)।
- `channels.zalo.webhookPath`: gateway HTTP server पर webhook path।
- `channels.zalo.proxy`: API requests के लिए proxy URL।

Multi-account options:

- `channels.zalo.accounts.<id>.botToken`: per-account token।
- `channels.zalo.accounts.<id>.tokenFile`: per-account regular token file। Symlinks rejected हैं।
- `channels.zalo.accounts.<id>.name`: display name।
- `channels.zalo.accounts.<id>.enabled`: account enable/disable करें।
- `channels.zalo.accounts.<id>.dmPolicy`: per-account DM policy।
- `channels.zalo.accounts.<id>.allowFrom`: per-account allowlist।
- `channels.zalo.accounts.<id>.groupPolicy`: per-account group policy। config में मौजूद; वर्तमान Marketplace-bot behavior के लिए [क्षमताएँ](#capabilities) और [पहुंच नियंत्रण (Groups)](#access-control-groups) देखें।
- `channels.zalo.accounts.<id>.groupAllowFrom`: per-account group sender allowlist।
- `channels.zalo.accounts.<id>.webhookUrl`: per-account webhook URL।
- `channels.zalo.accounts.<id>.webhookSecret`: per-account webhook secret।
- `channels.zalo.accounts.<id>.webhookPath`: per-account webhook path।
- `channels.zalo.accounts.<id>.proxy`: per-account proxy URL।

## संबंधित

- [Channels Overview](/hi/channels) — सभी समर्थित channels
- [Pairing](/hi/channels/pairing) — DM authentication और pairing flow
- [Groups](/hi/channels/groups) — group chat behavior और mention gating
- [Channel Routing](/hi/channels/channel-routing) — messages के लिए session routing
- [Security](/hi/gateway/security) — access model और hardening
