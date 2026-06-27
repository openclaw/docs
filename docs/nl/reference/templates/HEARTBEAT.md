---
read_when:
    - Een werkruimte handmatig bootstrappen
summary: Werkruimtesjabloon voor HEARTBEAT.md
title: HEARTBEAT.md-sjabloon
x-i18n:
    generated_at: "2026-06-27T18:20:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a1ea787d67110ca53d752706b62f5ce5c4df8637897dee97ce6502f6a05eb6
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# HEARTBEAT.md-sjabloon

`HEARTBEAT.md` staat in de agentwerkruimte. Houd het bestand leeg, of gebruik alleen Markdown-opmerkingen en koppen, wanneer je wilt dat OpenClaw Heartbeat-modelaanroepen overslaat.

De standaard runtime-sjabloon is:

```markdown
# Keep this file empty (or with only comments) to skip heartbeat API calls.

# Add tasks below when you want the agent to check something periodically.
```

Voeg alleen korte taken toe onder de opmerkingen wanneer je wilt dat de agent periodiek iets controleert. Houd Heartbeat-instructies klein, omdat ze tijdens terugkerende wakes worden gelezen.

## Gerelateerd

- [Heartbeat-configuratie](/nl/gateway/config-agents)
