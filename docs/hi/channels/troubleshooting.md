---
read_when:
    - चैनल ट्रांसपोर्ट जुड़ा हुआ बताता है, लेकिन जवाब विफल होते हैं
    - गहन प्रदाता दस्तावेज़ों से पहले चैनल-विशिष्ट जाँचों की आवश्यकता है
summary: प्रति-चैनल विफलता पैटर्न और सुधारों के साथ तेज़ चैनल-स्तरीय समस्या निवारण
title: चैनल समस्या निवारण
x-i18n:
    generated_at: "2026-06-28T22:41:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56b64030ec56553b4c2e156195806029f91bc8cc449588a242b0f45f8bbddb6e
    source_path: channels/troubleshooting.md
    workflow: 16
---

जब कोई चैनल कनेक्ट हो जाता है लेकिन व्यवहार गलत हो, तो इस पेज का उपयोग करें।

## कमांड क्रम

पहले इन्हें क्रम से चलाएं:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

स्वस्थ बेसलाइन:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable`, या `admin-capable`
- चैनल जांच दिखाती है कि ट्रांसपोर्ट कनेक्ट है और, जहां समर्थित हो, `works` या `audit ok`

## अपडेट के बाद

इसका उपयोग तब करें जब Telegram, iMessage, BlueBubbles-युग के कॉन्फ़िग, या कोई अन्य Plugin
चैनल अपडेट के बाद गायब हो जाए।

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

`openclaw status --all` में `plugin load failed: dependency tree corrupted; run openclaw doctor
--fix` देखें। इसका अर्थ है कि चैनल कॉन्फ़िगर है, लेकिन
Plugin सेटअप/लोड पाथ ने चैनल रजिस्टर करने के बजाय भ्रष्ट निर्भरता ट्री का सामना किया।
`openclaw doctor --fix` पुराने Plugin निर्भरता स्टेजिंग
डायरेक्टरी और पुराने auth शैडो हटाता है, फिर `openclaw gateway restart`
स्वच्छ स्थिति को फिर से लोड करता है।

## WhatsApp

### WhatsApp विफलता संकेत

| लक्षण                             | सबसे तेज जांच                                       | समाधान                                                                                                                              |
| ----------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| कनेक्ट है लेकिन DM जवाब नहीं मिलते         | `openclaw pairing list whatsapp`                    | भेजने वाले को मंजूरी दें या DM नीति/allowlist बदलें।                                                                                    |
| समूह संदेश अनदेखे हो रहे हैं              | कॉन्फ़िग में `requireMention` + mention पैटर्न जांचें | बॉट को mention करें या उस समूह के लिए mention नीति ढीली करें।                                                                          |
| QR लॉगिन 408 के साथ टाइम आउट होता है         | Gateway `HTTPS_PROXY` / `HTTP_PROXY` env जांचें      | पहुंच योग्य proxy सेट करें; `NO_PROXY` केवल bypass के लिए उपयोग करें।                                                                         |
| यादृच्छिक डिस्कनेक्ट/रीलॉगिन लूप     | `openclaw channels status --probe` + लॉग           | हालिया reconnects को तब भी चिह्नित किया जाता है जब अभी कनेक्ट हो; लॉग देखें, Gateway restart करें, फिर flapping जारी रहे तो relink करें। |
| `status=408 Request Time-out` लूप  | जांच, लॉग, doctor, फिर Gateway स्थिति            | पहले host connectivity/timing ठीक करें; लूप बना रहे तो auth का backup लें और account को फिर से link करें।                                   |
| जवाब सेकंड/मिनट देर से आते हैं | `openclaw doctor --fix`                             | Doctor सत्यापित पुराने local TUI clients को रोकता है जब वे Gateway event loop को खराब कर रहे हों।                                    |

पूरा समस्या-निवारण: [WhatsApp समस्या-निवारण](/hi/channels/whatsapp#troubleshooting)

## Telegram

### Telegram विफलता संकेत

| लक्षण                              | सबसे तेज जांच                                    | समाधान                                                                                                                        |
| ------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `/start` लेकिन उपयोगी reply flow नहीं    | `openclaw pairing list telegram`                 | pairing को मंजूरी दें या DM नीति बदलें।                                                                                       |
| बॉट online है लेकिन group शांत रहता है    | mention आवश्यकता और bot privacy mode सत्यापित करें  | group visibility के लिए privacy mode अक्षम करें या bot को mention करें।                                                                  |
| network errors के साथ send failures    | Telegram API call failures के लिए logs देखें      | `api.telegram.org` तक DNS/IPv6/proxy routing ठीक करें।                                                                          |
| startup `getMe returned 401` बताता है | configured token source जांचें                    | BotFather token को फिर से copy या regenerate करें और `botToken`, `tokenFile`, या default-account `TELEGRAM_BOT_TOKEN` अपडेट करें।     |
| polling stalls या reconnects धीरे होते हैं  | polling diagnostics के लिए `openclaw logs --follow` | Upgrade करें; यदि restarts false positives हैं, तो `pollingStallThresholdMs` tune करें। Persistent stalls अभी भी proxy/DNS/IPv6 की ओर इशारा करते हैं। |
| startup पर `setMyCommands` rejected  | `BOT_COMMANDS_TOO_MUCH` के लिए logs देखें         | Plugin/skill/custom Telegram commands कम करें या native menus अक्षम करें।                                                      |
| upgrade के बाद allowlist आपको block करती है    | `openclaw security audit` और config allowlists  | `openclaw doctor --fix` चलाएं या `@username` को numeric sender IDs से बदलें।                                                |

पूरा समस्या-निवारण: [Telegram समस्या-निवारण](/hi/channels/telegram#troubleshooting)

## Discord

### Discord विफलता संकेत

| लक्षण                                   | सबसे तेज जांच                                                                                                                | समाधान                                                                                                                                                                                                                                                                   |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| बॉट online है लेकिन guild replies नहीं           | `openclaw channels status --probe`                                                                                           | guild/channel को allow करें और message content intent सत्यापित करें।                                                                                                                                                                                                                |
| group messages अनदेखे हो रहे हैं                    | mention gating drops के लिए logs जांचें                                                                                          | bot को mention करें या guild/channel `requireMention: false` सेट करें।                                                                                                                                                                                                             |
| Typing/token usage है लेकिन Discord message नहीं | जांचें कि यह ambient room event है या opted-in `message_tool` room है जहां model ने `message(action=send)` छोड़ दिया | suppressed final payload metadata के लिए Gateway verbose log देखें, `messages.groupChat.unmentionedInbound` सत्यापित करें, [Ambient room events](/hi/channels/ambient-room-events) पढ़ें, या सामान्य group requests के लिए `messages.groupChat.visibleReplies: "automatic"` रखें। |
| DM replies गायब हैं                        | `openclaw pairing list discord`                                                                                              | DM pairing को मंजूरी दें या DM policy समायोजित करें।                                                                                                                                                                                                                               |

पूरा समस्या-निवारण: [Discord समस्या-निवारण](/hi/channels/discord#troubleshooting)

## Slack

### Slack विफलता संकेत

| लक्षण                                | सबसे तेज जांच                             | समाधान                                                                                                                                                  |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode connected है लेकिन responses नहीं | `openclaw channels status --probe`        | app token + bot token और आवश्यक scopes सत्यापित करें; SecretRef-backed setups पर `botTokenStatus` / `appTokenStatus = configured_unavailable` देखें। |
| DMs blocked                            | `openclaw pairing list slack`             | pairing को मंजूरी दें या DM policy ढीली करें।                                                                                                                  |
| Channel message ignored                | `groupPolicy` और channel allowlist जांचें | channel को allow करें या policy को `open` पर switch करें।                                                                                                        |

पूरा समस्या-निवारण: [Slack समस्या-निवारण](/hi/channels/slack#troubleshooting)

## iMessage

### iMessage विफलता संकेत

| लक्षण                              | सबसे तेज जांच                                           | समाधान                                                                   |
| ------------------------------------ | ------------------------------------------------------- | --------------------------------------------------------------------- |
| `imsg` गायब है या non-macOS पर fail होता है | `openclaw channels status --probe --channel imessage`   | OpenClaw को Messages Mac पर चलाएं या `cliPath` के लिए SSH wrapper उपयोग करें। |
| macOS पर send कर सकते हैं लेकिन receive नहीं     | Messages automation के लिए macOS privacy permissions जांचें | TCC permissions फिर से grant करें और channel process restart करें।                 |
| DM sender blocked                    | `openclaw pairing list imessage`                        | pairing को मंजूरी दें या allowlist अपडेट करें।                                  |

पूरा समस्या-निवारण:

- [iMessage समस्या-निवारण](/hi/channels/imessage#troubleshooting)

## Signal

### Signal विफलता संकेत

| लक्षण                         | सबसे तेज जांच                              | समाधान                                                      |
| ------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| Daemon reachable है लेकिन bot silent | `openclaw channels status --probe`         | `signal-cli` daemon URL/account और receive mode सत्यापित करें। |
| DM blocked                      | `openclaw pairing list signal`             | sender को मंजूरी दें या DM policy समायोजित करें।                      |
| Group replies trigger नहीं होते    | group allowlist और mention patterns जांचें | sender/group जोड़ें या gating ढीली करें।                       |

पूरा समस्या-निवारण: [Signal समस्या-निवारण](/hi/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot विफलता संकेत

| लक्षण                         | सबसे तेज जांच                               | समाधान                                                             |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| Bot replies "gone to Mars"      | config में `appId` और `clientSecret` सत्यापित करें | credentials सेट करें या Gateway restart करें।                         |
| inbound messages नहीं             | `openclaw channels status --probe`          | QQ Open Platform पर credentials सत्यापित करें।                     |
| Voice transcribed नहीं हुआ           | STT provider config जांचें                   | `channels.qqbot.stt` या `tools.media.audio` कॉन्फ़िगर करें।          |
| Proactive messages नहीं आ रहे | QQ platform interaction requirements जांचें  | हालिया interaction के बिना QQ bot-initiated messages block कर सकता है। |

पूर्ण समस्या-निवारण: [QQ Bot समस्या-निवारण](/hi/channels/qqbot#troubleshooting)

## Matrix

### Matrix विफलता संकेत

| लक्षण                              | सबसे तेज़ जाँच                         | समाधान                                                                    |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| लॉग इन है लेकिन रूम संदेशों को अनदेखा करता है | `openclaw channels status --probe`     | `groupPolicy`, रूम अनुमति-सूची, और उल्लेख गेटिंग जाँचें।                  |
| DM प्रोसेस नहीं होते               | `openclaw pairing list matrix`         | भेजने वाले को स्वीकृत करें या DM नीति समायोजित करें।                     |
| एन्क्रिप्टेड रूम विफल होते हैं     | `openclaw matrix verify status`        | डिवाइस को फिर से सत्यापित करें, फिर `openclaw matrix verify backup status` जाँचें। |
| बैकअप पुनर्स्थापन लंबित/टूटा हुआ है | `openclaw matrix verify backup status` | `openclaw matrix verify backup restore` चलाएँ या रिकवरी कुंजी के साथ फिर चलाएँ। |
| क्रॉस-साइनिंग/बूटस्ट्रैप गलत दिखता है | `openclaw matrix verify bootstrap`     | सीक्रेट स्टोरेज, क्रॉस-साइनिंग, और बैकअप स्थिति को एक ही पास में सुधारें। |

पूर्ण सेटअप और कॉन्फ़िगरेशन: [Matrix](/hi/channels/matrix)

## संबंधित

- [पेयरिंग](/hi/channels/pairing)
- [चैनल रूटिंग](/hi/channels/channel-routing)
- [Gateway समस्या-निवारण](/hi/gateway/troubleshooting)
