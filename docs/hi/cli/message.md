---
read_when:
    - संदेश CLI क्रियाएँ जोड़ना या संशोधित करना
    - आउटबाउंड चैनल का व्यवहार बदलना
summary: '`openclaw message` के लिए CLI संदर्भ (भेजना + चैनल कार्रवाइयाँ)'
title: संदेश
x-i18n:
    generated_at: "2026-07-19T09:11:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e2d1cca9be7cfa7625cac3e440ecb5847d9fab9c545c9267a41a2f99c26c514b
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Discord, Google Chat, iMessage, Matrix, Mattermost (Plugin), Microsoft Teams,
Signal, Slack, Telegram और WhatsApp पर संदेश तथा चैनल कार्रवाइयाँ भेजने के लिए
एकल आउटबाउंड कमांड।

```bash
openclaw message <subcommand> [flags]
```

## चैनल चयन

- यदि एक से अधिक चैनल कॉन्फ़िगर हैं, तो `--channel <name>` आवश्यक है; ठीक
  एक चैनल कॉन्फ़िगर होने पर वही चैनल डिफ़ॉल्ट होता है।
- मान: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`
  (Mattermost के लिए Plugin आवश्यक है)।
- चैनल-उपसर्ग वाले लक्ष्य (उदाहरण के लिए `discord:channel:123`) स्पष्ट
  `--channel` के बिना स्वामी Plugin का समाधान करते हैं।

## लक्ष्य प्रारूप (`-t, --target`)

| चैनल               | प्रारूप                                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| Discord             | `channel:<id>`, `user:<id>`, `<@id>` उल्लेख, या केवल संख्यात्मक id (चैनल id माना जाता है)               |
| Google Chat         | `spaces/<spaceId>` या `users/<userId>`                                                                     |
| iMessage            | हैंडल, `chat_id:<id>`, `chat_guid:<guid>`, या `chat_identifier:<id>`                                      |
| Mattermost (Plugin) | `channel:<id>`, `user:<id>`, `@username`, या केवल id (चैनल माना जाता है)                              |
| Matrix              | `@user:server`, `!room:server`, या `#alias:server`                                                         |
| Microsoft Teams     | `conversation:<id>` (`19:...@thread.tacv2`), केवल वार्तालाप id, या `user:<aad-object-id>`             |
| Signal              | `+E.164`, `group:<id>`, `uuid:<id>`, `username:<name>`/`u:<name>`, या इनमें से कोई भी `signal:` उपसर्ग के साथ |
| Slack               | `channel:<id>` या `user:<id>` (केवल id को चैनल माना जाता है)                                          |
| Telegram            | चैट id, `@username`, या फ़ोरम विषय लक्ष्य: `<chatId>:topic:<topicId>` (या `--thread-id <topicId>`)     |
| WhatsApp            | E.164, समूह JID (`...@g.us`), या चैनल/न्यूज़लेटर JID (`...@newsletter`)                                |

चैनल नाम लुकअप: डायरेक्टरी वाले प्रदाताओं (Discord/Slack/आदि) के लिए
`Help` या `#help` जैसे नाम डायरेक्टरी कैश के माध्यम से हल होते हैं; कैश में न मिलने पर,
जहाँ प्रदाता इसका समर्थन करता है, लाइव डायरेक्टरी लुकअप का उपयोग किया जाता है।

## सामान्य फ़्लैग

प्रत्येक कार्रवाई स्वीकार करती है: `--channel <name>`, `--account <id>`, `--json`,
`--dry-run`, `--verbose`। जिन कार्रवाइयों में गंतव्य होता है, वे
`-t, --target <dest>` भी स्वीकार करती हैं।

## SecretRef समाधान

`openclaw message` कार्रवाई चलाने से पहले चैनल SecretRefs को यथासंभव
सीमित दायरे में हल करता है:

- जब `--channel` सेट हो (या उपसर्ग वाले लक्ष्य से अनुमानित हो), तब चैनल-दायरा
- जब `--account` भी सेट हो, तब अकाउंट-दायरा
- जब दोनों में से कोई भी सेट न हो, तब सभी कॉन्फ़िगर किए गए चैनल

असंबंधित चैनलों के अनसुलझे SecretRefs कभी भी लक्षित कार्रवाई को अवरुद्ध नहीं करते;
चयनित चैनल/अकाउंट का अनसुलझा SecretRef कार्रवाई को बंद रखते हुए विफल करता है।

## कार्रवाइयाँ

### मुख्य

| कार्रवाई        | चैनल                                                                                                            | आवश्यक                                                        | टिप्पणियाँ                                                                                                                                                                                                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `send`          | Discord, Google Chat, iMessage, Matrix, Mattermost (Plugin), Microsoft Teams, Signal, Slack, Telegram, WhatsApp | `--target`, तथा `--message`/`--media`/`--presentation` में से एक | नीचे [भेजें](#send) देखें।                                                                                                                                                                                                                                                                               |
| `poll`          | Discord, Matrix, Microsoft Teams, Telegram, WhatsApp                                                            | `--target`, `--poll-question`, `--poll-option` (दोहराएँ)        | नीचे [मतदान](#poll) देखें।                                                                                                                                                                                                                                                                               |
| `react`         | Discord, Matrix, Nextcloud Talk, Signal, Slack, Telegram, WhatsApp                                              | `--message-id`, `--target`                                     | `--emoji`, `--remove` (`--emoji` आवश्यक; जहाँ समर्थित हो, अपनी प्रतिक्रियाएँ हटाने के लिए इसे छोड़ दें, [प्रतिक्रियाएँ](/hi/tools/reactions) देखें)। WhatsApp: `--participant`, `--from-me`। Signal समूह प्रतिक्रियाओं के लिए `--target-author` या `--target-author-uuid` आवश्यक है। Nextcloud Talk केवल प्रतिक्रियाएँ जोड़ता है; `--remove` त्रुटि देता है। |
| `reactions`     | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--message-id`, `--target`                                     | `--limit`।                                                                                                                                                                                                                                                                                             |
| `read`          | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--target`                                                     | `--limit`, `--message-id`, `--before`, `--after`। Discord: `--around`, `--include-thread`। Slack: `--message-id` किसी विशिष्ट टाइमस्टैम्प को पढ़ता है; सटीक थ्रेड उत्तर के लिए इसे `--thread-id` के साथ संयोजित करें।                                                                                                     |
| `edit`          | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                               | `--message-id`, `--message`, `--target`                        | Telegram फ़ोरम थ्रेड `--thread-id` का उपयोग करते हैं।                                                                                                                                                                                                                                                              |
| `delete`        | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                               | `--message-id`, `--target`                                     |                                                                                                                                                                                                                                                                                                        |
| `pin` / `unpin` | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--message-id`, `--target`                                     | `unpin` `--pinned-message-id` भी स्वीकार करता है (Microsoft Teams: pin/list-pins संसाधन id, चैट संदेश id नहीं)।                                                                                                                                                                                  |
| `pins` (सूची)   | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--target`                                                     | `--limit`।                                                                                                                                                                                                                                                                                             |
| `permissions`   | Discord, Matrix                                                                                                 | `--target`                                                     | Matrix: केवल तभी उपलब्ध है जब एन्क्रिप्शन सक्षम हो और सत्यापन कार्रवाइयों की अनुमति हो।                                                                                                                                                                                                                |
| `search`        | Discord                                                                                                         | `--guild-id`, `--query`                                        | `--channel-id`, `--channel-ids` (दोहराएँ), `--author-id`, `--author-ids` (दोहराएँ), `--limit`।                                                                                                                                                                                                           |
| `member info`   | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--user-id`                                                    | `--guild-id` (Discord)।                                                                                                                                                                                                                                                                                |

### भेजें

```bash
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

- `--media <path-or-url>`: चित्र/ऑडियो/वीडियो/दस्तावेज़ संलग्न करें (स्थानीय पथ या
  URL)।
- `--presentation <json>`: `text`, `context`, `divider`,
  `chart`, `table`, `buttons`, और `select` ब्लॉक वाला साझा पेलोड, जिसे प्रत्येक चैनल की
  क्षमता के अनुसार रेंडर किया जाता है। [संदेश प्रस्तुति](/hi/plugins/message-presentation) देखें।
- `--delivery <json>`: सामान्य डिलीवरी प्राथमिकताएँ, उदाहरण के लिए `{"pin":
true}`। जहाँ चैनल इसका समर्थन करता है,
  `--pin` पिन की गई डिलीवरी का संक्षिप्त रूप है।
- `--reply-to <id>`, `--thread-id <id>` (Telegram फ़ोरम विषय; Slack थ्रेड
  टाइमस्टैम्प, `--reply-to` वाला ही फ़ील्ड)।
- `--force-document` (Telegram, WhatsApp): चैनल कम्प्रेशन से बचने के लिए चित्र/GIF/वीडियो को
  दस्तावेज़ों के रूप में भेजें।
- `--silent` (Telegram, Discord): सूचना के बिना भेजें।
- `--gif-playback` (केवल WhatsApp): वीडियो मीडिया को GIF प्लेबैक मानें।

```bash
openclaw message send --channel discord \
  --target channel:123 --message "चुनें:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"स्वीकृत करें","value":"approve","style":"success"},{"label":"अस्वीकार करें","value":"decline","style":"danger"}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat --message "चुनें:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"हाँ","value":"cmd:yes"},{"label":"नहीं","value":"cmd:no"}]}]}'
```

Slack समर्थित चार्ट ब्लॉक को मूल रूप से रेंडर करता है; अन्य चैनलों को वही
डेटा पठनीय टेक्स्ट के रूप में मिलता है:

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"blocks":[{"type":"chart","chartType":"bar","title":"तिमाही आय","categories":["Q1","Q2"],"series":[{"name":"आय","values":[120,145]}],"xLabel":"तिमाही"}]}'
```

Slack स्पष्ट टेबल ब्लॉक को भी मूल रूप से रेंडर करता है। अन्य चैनलों को
कैप्शन और प्रत्येक पंक्ति नियतात्मक टेक्स्ट के रूप में मिलती है:

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"title":"पाइपलाइन रिपोर्ट","blocks":[{"type":"table","caption":"खुली पाइपलाइन","headers":["खाता","चरण","ARR"],"rows":[["Acme","Won",125000],["Globex","Review",82000]],"rowHeaderColumnIndex":0}]}'
```

Telegram Mini App बटन `webApp` का उपयोग करते हैं (पुराने
JSON के लिए `web_app` अब भी पार्स होता है) और केवल उपयोगकर्ता तथा बॉट के बीच निजी चैट में रेंडर होते हैं:

```bash
openclaw message send --channel telegram --target 123456789 --message "ऐप खोलें:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"लॉन्च करें","webApp":{"url":"https://example.com/app"}}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"स्थिति अपडेट","blocks":[{"type":"text","text":"बिल्ड पूर्ण हुआ"}]}'
```

### पोल

```bash
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "नाश्ता?" \
  --poll-option पिज़्ज़ा --poll-option सुशी \
  --poll-multi --poll-duration-hours 48
```

- `--poll-option <choice>`: 2-12 बार दोहराएँ।
- `--poll-multi`: एकाधिक चयन की अनुमति दें।
- Discord: `--poll-duration-hours`, `--silent`, `--message`।
- Telegram: `--poll-duration-seconds <n>` (5-600), `--silent`,
  `--poll-anonymous` / `--poll-public`, `--thread-id`।

```bash
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "दोपहर का भोजन?" \
  --poll-option पिज़्ज़ा --poll-option सुशी \
  --poll-duration-seconds 120 --silent
```

```bash
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "दोपहर का भोजन?" \
  --poll-option पिज़्ज़ा --poll-option सुशी
```

### थ्रेड

- `thread create`: चैनल Discord। आवश्यक: `--thread-name`, `--target`
  (चैनल आईडी)। वैकल्पिक: `--message-id`, `--message`, `--auto-archive-min`।
- `thread list`: चैनल Discord। आवश्यक: `--guild-id`। वैकल्पिक:
  `--channel-id`, `--include-archived`, `--before`, `--limit`।
- `thread reply`: चैनल Discord। आवश्यक: `--target` (थ्रेड आईडी),
  `--message`। वैकल्पिक: `--media`, `--reply-to`।

### इमोजी

- `emoji list`: Discord (`--guild-id`), Slack (कोई अतिरिक्त फ़्लैग नहीं)।
- `emoji upload`: Discord। आवश्यक: `--guild-id`, `--emoji-name`, `--media`।
  वैकल्पिक: `--role-ids` (दोहराएँ)।

### स्टिकर

- `sticker send`: Discord। आवश्यक: `--target`, `--sticker-id` (दोहराएँ)।
  वैकल्पिक: `--message`।
- `sticker upload`: Discord। आवश्यक: `--guild-id`, `--sticker-name`,
  `--sticker-desc`, `--sticker-tags`, `--media`।

### भूमिकाएँ, चैनल, वॉइस, इवेंट (Discord)

- `role info`: `--guild-id`।
- `role add` / `role remove`: `--guild-id`, `--user-id`, `--role-id`।
- `channel info`: `--target`।
- `channel list`: `--guild-id`।
- `voice status`: `--guild-id`, `--user-id`।
- `event list`: `--guild-id`।
- `event create`: आवश्यक `--guild-id`, `--event-name`, `--start-time`;
  वैकल्पिक `--end-time`, `--desc`, `--channel-id`, `--location`,
  `--event-type`, `--image <url-or-path>`।

### मॉडरेशन (Discord)

- `timeout`: `--guild-id`, `--user-id`; वैकल्पिक `--duration-min` या
  `--until` (टाइमआउट हटाने के लिए दोनों को छोड़ दें), `--reason`।
- `kick`: `--guild-id`, `--user-id`, `--reason`।
- `ban`: `--guild-id`, `--user-id`, `--delete-days`, `--reason`।

### प्रसारण

```bash
openclaw message broadcast --targets <target...> [--channel all] [--message <text>] [--media <url>] [--dry-run]
```

एक पेलोड कई लक्ष्यों पर भेजता है। `--targets` रिक्ति से अलग की गई
सूची लेता है। प्रत्येक कॉन्फ़िगर किए गए प्रदाता को लक्षित करने के लिए `--channel all` का उपयोग करें।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [एजेंट से भेजना](/hi/tools/agent-send)
- [संदेश प्रस्तुति](/hi/plugins/message-presentation)
