---
read_when:
    - आप पृष्ठभूमि कार्य रिकॉर्ड का निरीक्षण, ऑडिट या रद्द करना चाहते हैं
    - आप `openclaw tasks flow` के अंतर्गत TaskFlow कमांड का दस्तावेज़ीकरण कर रहे हैं
summary: '`openclaw tasks` के लिए CLI संदर्भ (पृष्ठभूमि कार्य लेजर और Task Flow स्थिति)'
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-06-28T22:53:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7bbb97690124a8e59ec5e6a517f33166ad449ee6268894ab132ad9cb69dcaa81
    source_path: cli/tasks.md
    workflow: 16
---

टिकाऊ पृष्ठभूमि कार्यों और Task Flow स्थिति का निरीक्षण करें। बिना किसी उपकमांड के,
`openclaw tasks` `openclaw tasks list` के बराबर है।

लाइफसाइकल और डिलीवरी मॉडल के लिए [पृष्ठभूमि कार्य](/hi/automation/tasks) देखें।

## उपयोग

```bash
openclaw tasks
openclaw tasks list
openclaw tasks list --runtime acp
openclaw tasks list --status running
openclaw tasks show <lookup>
openclaw tasks notify <lookup> state_changes
openclaw tasks cancel <lookup>
openclaw tasks audit
openclaw tasks maintenance
openclaw tasks maintenance --apply
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## रूट विकल्प

- `--json`: JSON आउटपुट करें।
- `--runtime <name>`: प्रकार के अनुसार फ़िल्टर करें: `subagent`, `acp`, `cron`, या `cli`।
- `--status <name>`: स्थिति के अनुसार फ़िल्टर करें: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled`, या `lost`।

## उपकमांड

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

ट्रैक किए गए पृष्ठभूमि कार्यों को सबसे नए पहले सूचीबद्ध करता है।

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

कार्य ID, रन ID, या सेशन कुंजी से एक कार्य दिखाता है।

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

चल रहे कार्य के लिए सूचना नीति बदलता है।

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

चल रहे पृष्ठभूमि कार्य को रद्द करता है।

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

पुराने, खोए हुए, डिलीवरी-विफल, या अन्यथा असंगत कार्य और Task Flow रिकॉर्ड सामने लाता है। `cleanupAfter` तक रखे गए खोए हुए कार्य चेतावनियां हैं; समाप्त हो चुके या बिना स्टैम्प वाले खोए हुए कार्य त्रुटियां हैं।

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

कार्य और Task Flow समन्वय, क्लीनअप स्टैम्पिंग, प्रूनिंग,
और पुराने cron रन सेशन रजिस्ट्री क्लीनअप का पूर्वावलोकन करता है या उन्हें लागू करता है।
cron कार्यों के लिए, समन्वय किसी पुराने सक्रिय कार्य को `lost` चिह्नित करने से पहले
स्थायी रन लॉग/जॉब स्थिति का उपयोग करता है, इसलिए पूर्ण हो चुके cron रन केवल इसलिए
झूठी ऑडिट त्रुटियां नहीं बनते क्योंकि इन-मेमोरी Gateway रनटाइम स्थिति जा चुकी है। ऑफलाइन CLI ऑडिट
Gateway के प्रोसेस-लोकल cron सक्रिय-जॉब सेट के लिए आधिकारिक नहीं है। रन id/source id वाले CLI कार्यों को
`lost` चिह्नित किया जाता है जब उनका लाइव Gateway रन संदर्भ
जा चुका हो, भले ही कोई पुरानी चाइल्ड-सेशन पंक्ति बची रहे।
लागू किए जाने पर, maintenance `cron:<jobId>:run:<uuid>` सेशन रजिस्ट्री
पंक्तियों को भी प्रून करता है जो 7 दिनों से पुरानी हैं, जबकि वर्तमान में चल रहे cron जॉब्स को सुरक्षित रखता है और
गैर-cron सेशन पंक्तियों को नहीं छूता।

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

कार्य लेजर के अंतर्गत टिकाऊ Task Flow स्थिति का निरीक्षण करता है या उसे रद्द करता है।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [पृष्ठभूमि कार्य](/hi/automation/tasks)
