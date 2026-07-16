---
read_when:
    - आप बैकग्राउंड कार्य रिकॉर्ड का निरीक्षण, ऑडिट या उन्हें रद्द करना चाहते हैं
    - आप `openclaw tasks flow` के अंतर्गत Task Flow कमांड का दस्तावेज़ीकरण कर रहे हैं
summary: '`openclaw tasks` (पृष्ठभूमि कार्य लेजर और Task Flow स्थिति) के लिए CLI संदर्भ'
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-07-16T14:06:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b03a4aa9fab12b6e5773259a76a1e89fd6e6398c73e5b0533a31e5e3a3894f9c
    source_path: cli/tasks.md
    workflow: 16
---

टिकाऊ बैकग्राउंड कार्यों और Task Flow स्थिति का निरीक्षण करें। बिना किसी उपकमांड के,
`openclaw tasks`, `openclaw tasks list` के समतुल्य है।

जीवनचक्र और डिलीवरी मॉडल के लिए [बैकग्राउंड कार्य](/hi/automation/tasks) देखें,
और निष्कर्षों के पूर्ण विवरण के लिए उसका `tasks audit` अनुभाग देखें।

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

| फ़्लैग               | विवरण                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `--json`           | JSON आउटपुट करें।                                                                                       |
| `--runtime <name>` | प्रकार के अनुसार फ़िल्टर करें: `subagent`, `acp`, `cron`, या `cli`।                                               |
| `--status <name>`  | स्थिति के अनुसार फ़िल्टर करें: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled`, या `lost`। |

## उपकमांड

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

ट्रैक किए गए बैकग्राउंड कार्यों को नवीनतम से शुरू करके सूचीबद्ध करता है।

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

कार्य ID, रन ID या सत्र कुंजी के आधार पर एक कार्य दिखाता है।

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

चल रहे कार्य की सूचना नीति बदलता है।

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

चल रहे बैकग्राउंड कार्य को रद्द करता है।

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

पुराने, खोए हुए, डिलीवरी-विफल या अन्यथा असंगत कार्य और
Task Flow रिकॉर्ड सामने लाता है। `cleanupAfter` तक बनाए रखे गए खोए हुए कार्य चेतावनियाँ हैं;
समय-सीमा समाप्त या बिना स्टैम्प वाले खोए हुए कार्य त्रुटियाँ हैं।

`--code` कार्य कोड (`stale_queued`, `stale_running`, `lost`,
`delivery_failed`, `missing_cleanup`, `inconsistent_timestamps`) और Task
Flow कोड (`restore_failed`, `stale_waiting`, `stale_blocked`,
`cancel_stuck`, `missing_linked_tasks`, `blocked_task_missing`) स्वीकार करता है। प्रत्येक
कोड की गंभीरता और ट्रिगर विवरण के लिए [बैकग्राउंड कार्य](/hi/automation/tasks)
देखें।

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

कार्य और Task Flow मिलान, क्लीनअप स्टैम्पिंग,
प्रूनिंग तथा पुराने Cron रन सत्र रजिस्ट्री क्लीनअप का पूर्वावलोकन करता है या उन्हें लागू करता है।

Cron कार्यों के लिए, किसी पुराने सक्रिय कार्य को `lost` चिह्नित करने से पहले
मिलान स्थायी रन लॉग/जॉब स्थिति का उपयोग करता है, ताकि पूर्ण हो चुके Cron रन केवल
इन-मेमोरी Gateway रनटाइम स्थिति समाप्त होने के कारण गलत ऑडिट त्रुटियाँ न बनें।
ऑफ़लाइन CLI ऑडिट, Gateway के प्रोसेस-लोकल Cron सक्रिय-जॉब सेट के लिए
प्रामाणिक नहीं है। रन ID/स्रोत ID वाले CLI कार्यों का लाइव Gateway रन संदर्भ
समाप्त होने पर उन्हें `lost` चिह्नित किया जाता है, भले ही कोई पुरानी चाइल्ड-सत्र पंक्ति
बची हुई हो।

लागू किए जाने पर, रखरखाव वर्तमान में चल रहे Cron जॉब को सुरक्षित रखते हुए
7 दिनों से पुरानी `cron:<jobId>:run:<uuid>` सत्र रजिस्ट्री पंक्तियों को भी प्रून करता है
और गैर-Cron सत्र पंक्तियों को अपरिवर्तित छोड़ता है।

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

कार्य लेजर के अंतर्गत टिकाऊ Task Flow स्थिति का निरीक्षण करता है या उसे रद्द करता है।
`flow list --status`, `queued`, `running`, `waiting`, `blocked`,
`succeeded`, `failed`, `cancelled`, या `lost` स्वीकार करता है।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [बैकग्राउंड कार्य](/hi/automation/tasks)
