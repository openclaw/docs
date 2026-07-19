---
read_when:
    - आपको पुराने दस्तावेज़ों या रिलीज़ नोट्स में `openclaw flows` मिलता है
    - आप TaskFlow के निरीक्षण के लिए एक त्वरित संदर्भ चाहते हैं
summary: 'रीडायरेक्ट: प्रवाह कमांड `openclaw tasks flow` के अंतर्गत उपलब्ध हैं'
title: प्रवाह (रीडायरेक्ट)
x-i18n:
    generated_at: "2026-07-19T08:15:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 05d27154190d6087649612d81ce15f0cbc9459aa89ab22211582c18f4fc2943c
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

कोई शीर्ष-स्तरीय `openclaw flows` कमांड नहीं है। स्थायी TaskFlow निरीक्षण `openclaw tasks flow` के अंतर्गत उपलब्ध है।

## उपकमांड

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| उपकमांड | विवरण                | आर्ग्युमेंट / विकल्प                                                                   |
| ---------- | -------------------------- | ------------------------------------------------------------------------------------- |
| `list`     | ट्रैक किए गए TaskFlows की सूची दिखाएँ।    | `--json` मशीन-पठनीय आउटपुट; `--status <name>` फ़िल्टर (नीचे स्थिति मान देखें)। |
| `show`     | एक TaskFlow दिखाएँ।         | `<lookup>` प्रवाह आईडी या स्वामी कुंजी; `--json` मशीन-पठनीय आउटपुट।                    |
| `cancel`   | चल रहे TaskFlow को रद्द करें। | `<lookup>` प्रवाह आईडी या स्वामी कुंजी।                                                      |

`<lookup>` या तो प्रवाह आईडी (`list` / `show` द्वारा लौटाई गई) या प्रवाह की स्वामी कुंजी (वह स्थिर पहचानकर्ता जिसका उपयोग स्वामी उपप्रणाली प्रवाह को ट्रैक करने के लिए करती है) स्वीकार करता है।

### स्थिति फ़िल्टर मान

`list` पर `--status` इनमें से एक स्वीकार करता है: `queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`।

## उदाहरण

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

TaskFlow की अवधारणाओं और लेखन के लिए, [TaskFlow](/hi/automation/taskflow) देखें। मूल `tasks` कमांड के लिए, [tasks CLI संदर्भ](/hi/cli/tasks) देखें।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [स्वचालन](/hi/automation)
- [TaskFlow](/hi/automation/taskflow)
