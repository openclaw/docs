---
read_when:
    - आप किसी चैनल के लिए संपर्क/समूह/स्वयं की आईडी खोजना चाहते हैं
    - आप एक चैनल डायरेक्टरी अडैप्टर विकसित कर रहे हैं
summary: '`openclaw directory` (स्वयं, पीयर्स, समूह) के लिए CLI संदर्भ'
title: निर्देशिका
x-i18n:
    generated_at: "2026-07-16T13:58:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d9e1a952525f79dcb6eedb87eb433be7cb378fa19de5f252521e287d2c52275c
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

इनका समर्थन करने वाले चैनलों के लिए डायरेक्टरी लुकअप: संपर्क/पीयर, समूह और "मैं" (स्वयं)।

परिणामों को अन्य कमांड में पेस्ट करने के लिए बनाया गया है, विशेष रूप से `openclaw message send --target ...` में।

## सामान्य फ़्लैग

- `--channel <name>`: चैनल आईडी/उपनाम (एकाधिक चैनल कॉन्फ़िगर होने पर आवश्यक; केवल एक कॉन्फ़िगर होने पर स्वतः चयनित)
- `--account <id>`: खाता आईडी (डिफ़ॉल्ट: चैनल का डिफ़ॉल्ट)
- `--json`: JSON आउटपुट

डिफ़ॉल्ट (गैर-JSON) आउटपुट में `id` (और कभी-कभी `name`) को टैब से अलग किया जाता है।

## टिप्पणियाँ

- कई चैनलों के लिए, परिणाम लाइव प्रदाता डायरेक्टरी के बजाय कॉन्फ़िगरेशन-आधारित (अनुमति-सूचियाँ / कॉन्फ़िगर किए गए समूह) होते हैं।
- पहले से इंस्टॉल किए गए चैनल Plugin में डायरेक्टरी समर्थन उपलब्ध न हो सकता है। उस स्थिति में कमांड असमर्थित ऑपरेशन की सूचना देता है; वह समर्थन जोड़ने के लिए Plugin को पुनः इंस्टॉल या अपग्रेड करने का प्रयास नहीं करता।

## `message send` के साथ परिणामों का उपयोग

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## चैनल के अनुसार आईडी प्रारूप

| चैनल                             | लक्ष्य आईडी प्रारूप                                                                                                            |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| WhatsApp                            | `+15551234567` (सीधा संदेश), `1234567890-1234567890@g.us` (समूह), `120363123456789@newsletter` (चैनल/न्यूज़लेटर, केवल आउटबाउंड) |
| Signal                              | कॉन्फ़िगर किए गए उपनाम E.164/UUID सीधे संदेश के लक्ष्यों या `group:<id>` समूह लक्ष्यों में बदलते हैं                                           |
| Telegram                            | `@username` या संख्यात्मक चैट आईडी; समूह संख्यात्मक आईडी का उपयोग करते हैं                                                                      |
| Slack                               | `user:U…` और `channel:C…`                                                                                                  |
| Discord                             | `user:<id>` और `channel:<id>`                                                                                              |
| Matrix (Plugin)                     | `user:@user:server`, `room:!roomId:server`, या `#alias:server`                                                              |
| Microsoft Teams (Plugin)            | `user:<id>` और `conversation:<id>`                                                                                         |
| Zalo (Plugin)                       | उपयोगकर्ता आईडी (Bot API)                                                                                                           |
| Zalo Personal / `zalouser` (Plugin) | थ्रेड आईडी (सीधा संदेश/समूह), `zca` से (`me`, `friend list`, `group list`)                                                        |

## स्वयं ("मैं")

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
