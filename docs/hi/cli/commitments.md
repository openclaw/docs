---
read_when:
    - आप अनुमानित फॉलो-अप प्रतिबद्धताओं की जांच करना चाहते हैं
    - आप लंबित चेक-इन खारिज करना चाहते हैं
    - आप ऑडिट कर रहे हैं कि Heartbeat क्या वितरित कर सकता है
summary: '`openclaw commitments` के लिए CLI संदर्भ (अनुमानित फ़ॉलो-अप्स का निरीक्षण करें और खारिज करें)'
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-06-28T22:47:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37d5e5dca25cf649a5069360aa4e41fcc33d042dea99f643b98c07189c58f21c
    source_path: cli/commitments.md
    workflow: 16
---

अनुमानित फ़ॉलो-अप प्रतिबद्धताओं को सूचीबद्ध और प्रबंधित करें।

प्रतिबद्धताएँ opt-in, अल्पकालिक फ़ॉलो-अप स्मृतियाँ हैं, जो
बातचीत के संदर्भ से बनाई जाती हैं। वैचारिक मार्गदर्शिका के लिए
[अनुमानित प्रतिबद्धताएँ](/hi/concepts/commitments) देखें।

किसी subcommand के बिना, `openclaw commitments` लंबित प्रतिबद्धताओं को सूचीबद्ध करता है।

## उपयोग

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## विकल्प

- `--all`: केवल लंबित प्रतिबद्धताओं के बजाय सभी स्थितियाँ दिखाएँ।
- `--agent <id>`: एक एजेंट आईडी तक फ़िल्टर करें।
- `--status <status>`: स्थिति के आधार पर फ़िल्टर करें। मान: `pending`, `sent`,
  `dismissed`, `snoozed`, या `expired`।
- `--json`: मशीन-पठनीय JSON आउटपुट करें।

## उदाहरण

लंबित प्रतिबद्धताओं को सूचीबद्ध करें:

```bash
openclaw commitments
```

संग्रहीत हर प्रतिबद्धता को सूचीबद्ध करें:

```bash
openclaw commitments --all
```

एक एजेंट तक फ़िल्टर करें:

```bash
openclaw commitments --agent main
```

स्नूज़ की गई प्रतिबद्धताएँ खोजें:

```bash
openclaw commitments --status snoozed
```

एक या अधिक प्रतिबद्धताएँ खारिज करें:

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

JSON के रूप में निर्यात करें:

```bash
openclaw commitments --all --json
```

## आउटपुट

टेक्स्ट आउटपुट में शामिल हैं:

- प्रतिबद्धता आईडी
- स्थिति
- प्रकार
- सबसे प्रारंभिक नियत समय
- दायरा
- सुझाया गया check-in टेक्स्ट

JSON आउटपुट में प्रतिबद्धता स्टोर पथ और पूर्ण संग्रहीत रिकॉर्ड भी शामिल होते हैं।

## संबंधित

- [अनुमानित प्रतिबद्धताएँ](/hi/concepts/commitments)
- [मेमरी अवलोकन](/hi/concepts/memory)
- [Heartbeat](/hi/gateway/heartbeat)
- [निर्धारित कार्य](/hi/automation/cron-jobs)
