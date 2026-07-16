---
read_when:
    - आप अनुमानित अनुवर्ती प्रतिबद्धताओं की जाँच करना चाहते हैं
    - आप लंबित चेक-इन रद्द करना चाहते हैं
    - आप इस बात का ऑडिट कर रहे हैं कि Heartbeat क्या डिलीवर कर सकता है
summary: '`openclaw commitments` के लिए CLI संदर्भ (अनुमानित फ़ॉलो-अप का निरीक्षण करें और उन्हें खारिज करें)'
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-16T13:55:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: db8a7d8f5756ccb18ed0990fcedf50d1072bb67e775c29eefdbd1a7dd795b7b0
    source_path: cli/commitments.md
    workflow: 16
---

अनुमानित फ़ॉलो-अप प्रतिबद्धताओं को सूचीबद्ध और प्रबंधित करें।

प्रतिबद्धताएँ ऑप्ट-इन (`commitments.enabled`), अल्पकालिक फ़ॉलो-अप स्मृतियाँ हैं,
जो वार्तालाप के संदर्भ से बनाई जाती हैं और Heartbeat द्वारा पहुँचाई जाती हैं। अवधारणात्मक मार्गदर्शिका और कॉन्फ़िगरेशन के लिए
[अनुमानित प्रतिबद्धताएँ](/hi/concepts/commitments) देखें।

कोई उपकमांड न दिए जाने पर, `openclaw commitments` लंबित प्रतिबद्धताओं को सूचीबद्ध करता है।

## उपयोग

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## विकल्प

- `--all`: केवल लंबित प्रतिबद्धताओं के बजाय सभी स्थितियाँ दिखाएँ।
- `--agent <id>`: किसी एक एजेंट आईडी के अनुसार फ़िल्टर करें।
- `--status <status>`: स्थिति के अनुसार फ़िल्टर करें। मान: `pending`, `sent`,
  `dismissed`, `snoozed`, या `expired`। अज्ञात मान देने पर त्रुटि के साथ प्रक्रिया समाप्त हो जाती है।
- `--json`: मशीन-पठनीय JSON आउटपुट दें।

`dismiss` दी गई प्रतिबद्धता आईडी को `dismissed` के रूप में चिह्नित करता है, ताकि Heartbeat
उन्हें न पहुँचाए।

## उदाहरण

लंबित प्रतिबद्धताएँ सूचीबद्ध करें:

```bash
openclaw commitments
```

संग्रहीत प्रत्येक प्रतिबद्धता सूचीबद्ध करें:

```bash
openclaw commitments --all
```

किसी एक एजेंट के अनुसार फ़िल्टर करें:

```bash
openclaw commitments --agent main
```

स्थगित प्रतिबद्धताएँ खोजें:

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

टेक्स्ट आउटपुट प्रतिबद्धताओं की संख्या, साझा SQLite डेटाबेस पथ, सभी सक्रिय फ़िल्टर
और प्रत्येक प्रतिबद्धता के लिए एक पंक्ति प्रिंट करता है:

- प्रतिबद्धता आईडी
- स्थिति
- प्रकार (`event_check_in`, `deadline_check`, `care_check_in`, या `open_loop`)
- सबसे प्रारंभिक नियत समय
- दायरा (एजेंट/चैनल/लक्ष्य)
- सुझाया गया चेक-इन टेक्स्ट

JSON आउटपुट में संख्या, सक्रिय स्थिति और एजेंट फ़िल्टर,
साझा SQLite डेटाबेस पथ और पूर्ण संग्रहीत रिकॉर्ड शामिल होते हैं।

## संबंधित

- [अनुमानित प्रतिबद्धताएँ](/hi/concepts/commitments)
- [स्मृति का अवलोकन](/hi/concepts/memory)
- [Heartbeat](/hi/gateway/heartbeat)
- [निर्धारित कार्य](/hi/automation/cron-jobs)
