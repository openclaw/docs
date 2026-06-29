---
read_when:
    - आप पुराने दस्तावेज़ों या रिलीज़ नोट्स में `openclaw flows` देखते हैं
    - आप एक त्वरित TaskFlow निरीक्षण संदर्भ चाहते हैं
summary: 'रीडायरेक्ट: flow कमांड `openclaw tasks flow` के अंतर्गत हैं'
title: प्रवाह (रीडायरेक्ट)
x-i18n:
    generated_at: "2026-06-28T22:49:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b41e8a911cfbba32f3a1af059df34f73443ea7649bce46a5926cdf26c8399c12
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

शीर्ष-स्तरीय `openclaw flows` कमांड नहीं है। स्थायी TaskFlow निरीक्षण `openclaw tasks flow` के अंतर्गत है।

## उपकमांड

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| उपकमांड | विवरण                | आर्ग्युमेंट / विकल्प                                                                   |
| ---------- | -------------------------- | ------------------------------------------------------------------------------------- |
| `list`     | ट्रैक किए गए TaskFlow सूचीबद्ध करें।    | `--json` मशीन-पठनीय आउटपुट; `--status <name>` फ़िल्टर (नीचे स्थिति मान देखें)। |
| `show`     | एक TaskFlow दिखाएं।         | `<lookup>` flow id या स्वामी कुंजी; `--json` मशीन-पठनीय आउटपुट।                    |
| `cancel`   | चल रहे TaskFlow को रद्द करें। | `<lookup>` flow id या स्वामी कुंजी।                                                      |

`<lookup>` flow id (`list` / `show` द्वारा लौटाया गया) या flow की स्वामी कुंजी (वह स्थिर पहचानकर्ता जिसे स्वामित्व वाला सबसिस्टम flow को ट्रैक करने के लिए उपयोग करता है) में से किसी एक को स्वीकार करता है।

### स्थिति फ़िल्टर मान

`list` पर `--status` इनमें से एक स्वीकार करता है:

`queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`

## उदाहरण

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

पूर्ण TaskFlow अवधारणाओं और ऑथरिंग के लिए [TaskFlow](/hi/automation/taskflow) देखें। पैरेंट `tasks` कमांड के लिए [tasks CLI संदर्भ](/hi/cli/tasks) देखें।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [ऑटोमेशन](/hi/automation)
- [TaskFlow](/hi/automation/taskflow)
