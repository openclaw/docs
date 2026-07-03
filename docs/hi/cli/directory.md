---
read_when:
    - आप किसी चैनल के लिए संपर्क/समूह/स्वयं की आईडी देखना चाहते हैं
    - आप एक चैनल डायरेक्टरी एडैप्टर विकसित कर रहे हैं
summary: '`openclaw directory` के लिए CLI संदर्भ (स्वयं, पीयर्स, समूह)'
title: निर्देशिका
x-i18n:
    generated_at: "2026-07-03T15:24:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d17f545ce0bbe23a6c1ba74e4d1b44b103cc985b52affe4b25fbc6a6d1121045
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

इसका समर्थन करने वाले चैनलों के लिए निर्देशिका लुकअप (संपर्क/पीयर, समूह, और "me")।

## सामान्य फ़्लैग

- `--channel <name>`: चैनल id/alias (जब कई चैनल कॉन्फ़िगर हों तो आवश्यक; केवल एक कॉन्फ़िगर होने पर स्वतः)
- `--account <id>`: खाता id (डिफ़ॉल्ट: चैनल डिफ़ॉल्ट)
- `--json`: JSON आउटपुट करें

## नोट्स

- `directory` का उद्देश्य उन IDs को खोजने में मदद करना है जिन्हें आप अन्य कमांड में पेस्ट कर सकते हैं (विशेष रूप से `openclaw message send --target ...`)।
- कई चैनलों के लिए, परिणाम लाइव प्रदाता निर्देशिका के बजाय कॉन्फ़िगरेशन-समर्थित होते हैं (allowlists / कॉन्फ़िगर किए गए समूह)।
- इंस्टॉल किए गए चैनल Plugins फिर भी निर्देशिका समर्थन छोड़ सकते हैं; उस स्थिति में कमांड Plugin को फिर से इंस्टॉल करने के बजाय असमर्थित निर्देशिका ऑपरेशन की रिपोर्ट करता है।
- डिफ़ॉल्ट आउटपुट `id` (और कभी-कभी `name`) होता है, जिसे टैब से अलग किया जाता है; स्क्रिप्टिंग के लिए `--json` का उपयोग करें।

## `message send` के साथ परिणामों का उपयोग करना

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## ID फ़ॉर्मैट (चैनल के अनुसार)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (समूह), `120363123456789@newsletter` (Channel/Newsletter आउटबाउंड लक्ष्य)
- Signal: कॉन्फ़िगर किए गए alias E.164/UUID DM लक्ष्यों या `group:<id>` समूह लक्ष्यों में resolve होते हैं
- Telegram: `@username` या संख्यात्मक चैट id; समूह संख्यात्मक ids होते हैं
- Slack: `user:U…` और `channel:C…`
- Discord: `user:<id>` और `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server`, या `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` और `conversation:<id>`
- Zalo (Plugin): user id (Bot API)
- Zalo Personal / `zalouser` (Plugin): `zca` से thread id (DM/समूह) (`me`, `friend list`, `group list`)

## स्वयं ("me")

```bash
openclaw directory self --channel zalouser
```

## पीयर (संपर्क/उपयोगकर्ता)

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## समूह

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```

## संबंधित

- [CLI संदर्भ](/hi/cli)
