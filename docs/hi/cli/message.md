---
read_when:
    - संदेश CLI कार्रवाइयाँ जोड़ना या संशोधित करना
    - आउटबाउंड चैनल का व्यवहार बदलना
summary: '`openclaw message` के लिए CLI संदर्भ (भेजना + चैनल क्रियाएं)'
title: संदेश
x-i18n:
    generated_at: "2026-06-28T22:50:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4a8a716435313efa41a13ee5c6392eb2e4cfca2ede3e4690b157d26d077f7d56
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

संदेश और चैनल कार्रवाइयाँ भेजने के लिए एकल आउटबाउंड कमांड
(Discord/Google Chat/iMessage/Matrix/Mattermost (Plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## उपयोग

```
openclaw message <subcommand> [flags]
```

चैनल चयन:

- यदि एक से अधिक चैनल कॉन्फ़िगर किए गए हैं, तो `--channel` आवश्यक है।
- यदि ठीक एक चैनल कॉन्फ़िगर किया गया है, तो वह डिफ़ॉल्ट बन जाता है।
- मान: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost के लिए Plugin आवश्यक है)
- जब `--channel` या चैनल-प्रीफ़िक्स वाला लक्ष्य मौजूद हो, तो `openclaw message` चयनित चैनल को उसके स्वामी Plugin से हल करता है; अन्यथा यह डिफ़ॉल्ट-चैनल अनुमान के लिए कॉन्फ़िगर किए गए चैनल Plugins लोड करता है।

लक्ष्य फ़ॉर्मैट (`--target`):

- WhatsApp: E.164, समूह JID, या WhatsApp चैनल/न्यूज़लेटर JID (`...@newsletter`)
- Telegram: चैट id, `@username`, या फ़ोरम टॉपिक लक्ष्य (`-1001234567890:topic:42`, या `--thread-id 42`)
- Discord: `channel:<id>` या `user:<id>` (या `<@id>` उल्लेख; कच्चे संख्यात्मक ids को चैनल माना जाता है)
- Google Chat: `spaces/<spaceId>` या `users/<userId>`
- Slack: `channel:<id>` या `user:<id>` (कच्चा चैनल id स्वीकार किया जाता है)
- Mattermost (Plugin): `channel:<id>`, `user:<id>`, या `@username` (बिना उपसर्ग वाले ids को चैनल माना जाता है)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>`, या `username:<name>`/`u:<name>`
- iMessage: हैंडल, `chat_id:<id>`, `chat_guid:<guid>`, या `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server`, या `#alias:server`
- Microsoft Teams: बातचीत id (`19:...@thread.tacv2`) या `conversation:<id>` या `user:<aad-object-id>`

नाम लुकअप:

- समर्थित प्रदाताओं (Discord/Slack/आदि) के लिए, `Help` या `#help` जैसे चैनल नाम डायरेक्टरी कैश के माध्यम से हल किए जाते हैं।
- कैश मिस होने पर, प्रदाता द्वारा समर्थन होने पर OpenClaw लाइव डायरेक्टरी लुकअप का प्रयास करेगा।

## सामान्य flags

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (send/poll/read/आदि के लिए लक्ष्य चैनल या उपयोगकर्ता)
- `--targets <name>` (दोहराएँ; केवल प्रसारण)
- `--json`
- `--dry-run`
- `--verbose`

## SecretRef व्यवहार

- चयनित कार्रवाई चलाने से पहले `openclaw message` समर्थित चैनल SecretRefs को हल करता है।
- जब संभव हो, रिज़ॉल्यूशन सक्रिय कार्रवाई लक्ष्य तक सीमित होता है:
  - जब `--channel` सेट हो (या `discord:...` जैसे प्रीफ़िक्स लक्ष्यों से अनुमानित हो), तो चैनल-स्कोप्ड
  - जब `--account` सेट हो, तो अकाउंट-स्कोप्ड (चैनल ग्लोबल्स + चयनित अकाउंट सतहें)
  - जब `--account` छोड़ा गया हो, तो OpenClaw `default` अकाउंट SecretRef स्कोप को बाध्य नहीं करता
- असंबंधित चैनलों पर अनहल किए गए SecretRefs लक्षित संदेश कार्रवाई को ब्लॉक नहीं करते।
- यदि चयनित चैनल/अकाउंट SecretRef अनहल है, तो कमांड उस कार्रवाई के लिए बंद रूप में विफल होता है।

## कार्रवाइयाँ

### कोर

- `send`
  - चैनल: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - आवश्यक: `--target`, साथ में `--message`, `--media`, या `--presentation`
  - वैकल्पिक: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - साझा प्रस्तुति पेलोड: `--presentation` सेमांटिक ब्लॉक (`text`, `context`, `divider`, `buttons`, `select`) भेजता है जिन्हें कोर चयनित चैनल की घोषित क्षमताओं के माध्यम से रेंडर करता है। [Message Presentation](/hi/plugins/message-presentation) देखें।
  - सामान्य डिलीवरी प्राथमिकताएँ: `--delivery` `{ "pin": true }` जैसे डिलीवरी संकेत स्वीकार करता है; चैनल द्वारा समर्थन होने पर `--pin` पिन की गई डिलीवरी का संक्षिप्त रूप है।
  - Telegram + WhatsApp: `--force-document` (चैनल संपीड़न से बचने के लिए चित्र, GIFs और वीडियो को दस्तावेज़ों के रूप में भेजें)
  - केवल Telegram: `--thread-id` (फ़ोरम टॉपिक id)
  - केवल Slack: `--thread-id` (थ्रेड टाइमस्टैम्प; `--reply-to` वही फ़ील्ड उपयोग करता है)
  - Telegram + Discord: `--silent`
  - केवल WhatsApp: `--gif-playback`; WhatsApp चैनल/न्यूज़लेटर उनके मूल `@newsletter` JID से संबोधित किए जाते हैं।

- `poll`
  - चैनल: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - आवश्यक: `--target`, `--poll-question`, `--poll-option` (दोहराएँ)
  - वैकल्पिक: `--poll-multi`
  - केवल Discord: `--poll-duration-hours`, `--silent`, `--message`
  - केवल Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - चैनल: Discord/Google Chat/Matrix/Nextcloud Talk/Signal/Slack/Telegram/WhatsApp
  - आवश्यक: `--message-id`, `--target`
  - वैकल्पिक: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - नोट: `--remove` के लिए `--emoji` आवश्यक है (जहाँ समर्थित हो, अपनी प्रतिक्रियाएँ साफ़ करने के लिए `--emoji` छोड़ें; /tools/reactions देखें)
  - केवल WhatsApp: `--participant`, `--from-me`
  - Signal समूह प्रतिक्रियाएँ: `--target-author` या `--target-author-uuid` आवश्यक
  - Nextcloud Talk: केवल प्रतिक्रियाएँ जोड़ना; `--remove` स्पष्ट त्रुटि के साथ अस्वीकार किया जाता है (/tools/reactions देखें)

- `reactions`
  - चैनल: Discord/Google Chat/Slack/Matrix
  - आवश्यक: `--message-id`, `--target`
  - वैकल्पिक: `--limit`

- `read`
  - चैनल: Discord/Slack/Matrix
  - आवश्यक: `--target`
  - वैकल्पिक: `--limit`, `--message-id`, `--before`, `--after`
  - केवल Slack: `--message-id` किसी विशिष्ट Slack संदेश टाइमस्टैम्प को पढ़ता है; सटीक थ्रेड उत्तर पढ़ने के लिए `--thread-id` के साथ मिलाएँ।
  - केवल Discord: `--around`

- `edit`
  - चैनल: Discord/Slack/Matrix
  - आवश्यक: `--message-id`, `--message`, `--target`

- `delete`
  - चैनल: Discord/Slack/Telegram/Matrix
  - आवश्यक: `--message-id`, `--target`

- `pin` / `unpin`
  - चैनल: Discord/Slack/Matrix
  - आवश्यक: `--message-id`, `--target`

- `pins` (सूची)
  - चैनल: Discord/Slack/Matrix
  - आवश्यक: `--target`

- `permissions`
  - चैनल: Discord/Matrix
  - आवश्यक: `--target`
  - केवल Matrix: तब उपलब्ध जब Matrix एन्क्रिप्शन सक्षम हो और सत्यापन कार्रवाइयों की अनुमति हो

- `search`
  - चैनल: Discord
  - आवश्यक: `--guild-id`, `--query`
  - वैकल्पिक: `--channel-id`, `--channel-ids` (दोहराएँ), `--author-id`, `--author-ids` (दोहराएँ), `--limit`

### थ्रेड्स

- `thread create`
  - चैनल: Discord
  - आवश्यक: `--thread-name`, `--target` (चैनल id)
  - वैकल्पिक: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - चैनल: Discord
  - आवश्यक: `--guild-id`
  - वैकल्पिक: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - चैनल: Discord
  - आवश्यक: `--target` (थ्रेड id), `--message`
  - वैकल्पिक: `--media`, `--reply-to`

### इमोजी

- `emoji list`
  - Discord: `--guild-id`
  - Slack: कोई अतिरिक्त flags नहीं

- `emoji upload`
  - चैनल: Discord
  - आवश्यक: `--guild-id`, `--emoji-name`, `--media`
  - वैकल्पिक: `--role-ids` (दोहराएँ)

### स्टिकर्स

- `sticker send`
  - चैनल: Discord
  - आवश्यक: `--target`, `--sticker-id` (दोहराएँ)
  - वैकल्पिक: `--message`

- `sticker upload`
  - चैनल: Discord
  - आवश्यक: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### भूमिकाएँ / चैनल / सदस्य / वॉइस

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (Discord के लिए + `--guild-id`)
- `voice status` (Discord): `--guild-id`, `--user-id`

### इवेंट

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - वैकल्पिक: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### मॉडरेशन (Discord)

- `timeout`: `--guild-id`, `--user-id` (वैकल्पिक `--duration-min` या `--until`; टाइमआउट साफ़ करने के लिए दोनों छोड़ दें)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` भी `--reason` का समर्थन करता है

### ब्रॉडकास्ट

- `broadcast`
  - चैनल: कोई भी कॉन्फ़िगर किया गया चैनल; सभी प्रदाताओं को लक्षित करने के लिए `--channel all` का उपयोग करें
  - आवश्यक: `--targets <target...>`
  - वैकल्पिक: `--message`, `--media`, `--dry-run`

## उदाहरण

Discord जवाब भेजें:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

सार्थक बटनों के साथ संदेश भेजें:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

Core उसी `presentation` पेलोड को चैनल क्षमता के आधार पर Discord कंपोनेंट, Slack ब्लॉक, Telegram इनलाइन बटन, Mattermost प्रॉप्स, या Teams/Feishu कार्ड में रेंडर करता है। पूरे अनुबंध और फ़ॉलबैक नियमों के लिए [संदेश प्रस्तुति](/hi/plugins/message-presentation) देखें।

अधिक समृद्ध प्रस्तुति पेलोड भेजें:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

Discord पोल बनाएँ:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Telegram पोल बनाएँ (2 मिनट में अपने-आप बंद):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Teams प्रोएक्टिव संदेश भेजें:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Teams पोल बनाएँ:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

Slack में प्रतिक्रिया दें:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

Signal समूह में प्रतिक्रिया दें:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

सामान्य प्रस्तुति के माध्यम से Telegram इनलाइन बटन भेजें:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

सामान्य प्रस्तुति के माध्यम से Telegram Mini App बटन भेजें:

```
openclaw message send --channel telegram --target 123456789 --message "Open app:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Launch","webApp":{"url":"https://example.com/app"}}]}]}'
```

Telegram वेब ऐप बटन केवल उपयोगकर्ता और
बॉट के बीच निजी चैट में समर्थित हैं। `web_app` का उपयोग करने वाले पुराने JSON पेलोड अब भी पार्स होते हैं, लेकिन `webApp`
कैनोनिकल प्रस्तुति फ़ील्ड है।

सामान्य प्रस्तुति के माध्यम से Teams कार्ड भेजें:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

संपीड़न से बचने के लिए Telegram या WhatsApp इमेज को दस्तावेज़ के रूप में भेजें:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [एजेंट भेजें](/hi/tools/agent-send)
