---
read_when:
    - आप टर्मिनल से संग्रहीत ट्रांसक्रिप्ट सारांश पढ़ना चाहते हैं
    - आपको ट्रांसक्रिप्ट के Markdown सारांश का पथ चाहिए
    - आप मुख्य ट्रांसक्रिप्ट संग्रहण लेआउट को डीबग कर रहे हैं
summary: '`openclaw transcripts` के लिए CLI संदर्भ (संग्रहीत ट्रांसक्रिप्ट सूचीबद्ध करें, दिखाएँ और उनका स्थान पता करें)'
title: ट्रांसक्रिप्ट CLI
x-i18n:
    generated_at: "2026-07-19T08:25:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dde02e924339c64cf6acd5c4b6162785dcfccf4a1df2aac0d9d52d5306511579
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

`transcripts` एजेंट टूल द्वारा लिखे गए ट्रांसक्रिप्ट के लिए केवल-पढ़ने योग्य निरीक्षक।
कैप्चर, आयात और सारांश-निर्माण इस CLI से नहीं, बल्कि उस टूल के माध्यम से चलते हैं।

आर्टिफ़ैक्ट स्टेट डायरेक्टरी के अंतर्गत रहते हैं:

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

डिफ़ॉल्ट स्टेट डायरेक्टरी `~/.openclaw` है; इसे `OPENCLAW_STATE_DIR` से ओवरराइड करें।
दिनांक डायरेक्टरी सेशन शुरू होने के समय से निर्धारित होती है; सेशन डायरेक्टरी
सेशन आईडी से प्राप्त एक फ़ाइलसिस्टम-सुरक्षित स्लग होती है।

## कमांड

```bash
openclaw transcripts list
openclaw transcripts show <session>
openclaw transcripts show YYYY-MM-DD/<session>
openclaw transcripts path <session>
openclaw transcripts path YYYY-MM-DD/<session>
openclaw transcripts path <session> --dir
openclaw transcripts path <session> --metadata
openclaw transcripts path <session> --transcript
openclaw transcripts list --json
openclaw transcripts show <session> --json
openclaw transcripts path <session> --json
```

| कमांड                       | विवरण                                     |
| ----------------------------- | ----------------------------------------------- |
| `list`                        | संग्रहित सेशन सूचीबद्ध करें।                           |
| `show <session>`              | संग्रहित `summary.md` प्रिंट करें।                  |
| `path <session>`              | `summary.md` पाथ प्रिंट करें।                    |
| `path <session> --dir`        | सेशन डायरेक्टरी प्रिंट करें।                    |
| `path <session> --metadata`   | `metadata.json` प्रिंट करें।                          |
| `path <session> --transcript` | `transcript.jsonl` प्रिंट करें।                       |
| `--json`                      | मशीन-पठनीय आउटपुट प्रिंट करें (कोई भी सबकमांड)। |

`<session>` या तो केवल सेशन आईडी या दिनांक-युक्त चयनकर्ता
(`YYYY-MM-DD/<session>`) स्वीकार करता है। जब एक ही सेशन आईडी एक से अधिक दिनों में
मौजूद हो, तो दिनांक-युक्त रूप का उपयोग करें, उदाहरण के लिए `openclaw transcripts show
2026-05-22/standup`। डिफ़ॉल्ट सेशन आईडी में टाइमस्टैम्प और रैंडम
प्रत्यय शामिल होते हैं; किसी सेशन को निश्चित आईडी केवल तभी दें, जब वह आईडी उस दिन के भीतर अद्वितीय हो।

## आउटपुट

`list` प्रत्येक सेशन के लिए टैब से अलग की गई एक पंक्ति प्रिंट करता है: चयनकर्ता, आरंभ समय, शीर्षक,
सारांश पाथ।

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  साप्ताहिक स्टैंडअप  /Users/user/.openclaw/transcripts/2026-05-22/standup/summary.md
```

चयनकर्ता `show` या `path` को वापस देने के लिए सबसे सुरक्षित मान है।

`list --json` `sessionId`, `selector`, `date`, `title`,
`startedAt`, `stoppedAt`, `source`, `path`, `summaryPath`, `hasSummary` वाले ऑब्जेक्ट लौटाता है।

`show --json` संग्रहित सेशन मेटाडेटा, चयनकर्ता, सेशन
डायरेक्टरी, सारांश पाथ और सारांश का Markdown टेक्स्ट लौटाता है।

`path --json` चयनित पाथ और वह फ़ाइल मौजूद है या नहीं, यह लौटाता है।

## प्रतिदिन कई सेशन

सेशन पहले दिनांक और फिर सेशन आईडी के अनुसार समूहित होते हैं। एक दिन में दस मीटिंग
दस सहोदर फ़ोल्डर बन जाती हैं:

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

ऑटोमेशन के लिए डिफ़ॉल्ट रूप से जनरेट की गई आईडी का उपयोग करें। `standup` जैसी निश्चित आईडी का उपयोग केवल
तभी करें, जब वह उसी दिनांक पर दोहराई नहीं जाएगी।

## अनुपलब्ध सारांश

लाइव सेशन रुकने पर `summary.md` लिखते हैं; आयातित ट्रांसक्रिप्ट
आयात के तुरंत बाद इसे लिखते हैं। कैप्चर अभी भी सक्रिय होने पर, रुकने के दौरान किसी प्रोवाइडर के विफल होने पर, या
किसी भी कथन के आने से पहले मेटाडेटा लिखे जाने पर कोई सेशन सारांश के बिना `list` में दिखाई दे सकता है।

रॉ, केवल-जोड़ने योग्य ट्रांसक्रिप्ट का निरीक्षण करने के लिए `path <session> --transcript` का उपयोग करें,
या Markdown सारांश पुनः जनरेट करने के लिए `transcripts` टूल की `summarize` कार्रवाई चलाएँ।

## कॉन्फ़िगरेशन

कैप्चर ऑप्ट-इन है (लाइव स्रोत मीटिंग ऑडियो से जुड़कर उसे रिकॉर्ड कर सकते हैं)। इसे
इससे सक्षम करें:

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

- `enabled` (डिफ़ॉल्ट `false`): टूल चालू करें।
- `maxUtterances` (डिफ़ॉल्ट `2000`, 1-10000 तक सीमित): प्रति
  सेशन कथन बफ़र का आकार।

ऑटो-स्टार्ट स्रोतों को `transcripts.autoStart` से कॉन्फ़िगर करें। प्रत्येक प्रविष्टि
मौजूद होने पर सक्षम होती है; उस स्रोत को अक्षम करने के लिए प्रविष्टि छोड़ दें। `discord-voice`
बंडल किया गया ऑटो-स्टार्ट-सक्षम स्रोत है और इसके लिए `guildId` तथा
`channelId` आवश्यक हैं:

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      }
    ]
  }
}
```
