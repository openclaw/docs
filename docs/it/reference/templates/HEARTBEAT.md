---
read_when:
    - Avvio manuale di un workspace
summary: Modello di area di lavoro per HEARTBEAT.md
title: Modello HEARTBEAT.md
x-i18n:
    generated_at: "2026-06-27T18:15:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a1ea787d67110ca53d752706b62f5ce5c4df8637897dee97ce6502f6a05eb6
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# Modello HEARTBEAT.md

`HEARTBEAT.md` si trova nello spazio di lavoro dell’agente. Lascia il file vuoto, oppure con soli commenti e intestazioni Markdown, quando vuoi che OpenClaw salti le chiamate al modello Heartbeat.

Il modello di runtime predefinito è:

```markdown
# Keep this file empty (or with only comments) to skip heartbeat API calls.

# Add tasks below when you want the agent to check something periodically.
```

Aggiungi attività brevi sotto i commenti solo quando vuoi che l’agente controlli qualcosa periodicamente. Mantieni piccole le istruzioni Heartbeat perché vengono lette durante i risvegli ricorrenti.

## Correlati

- [Configurazione Heartbeat](/it/gateway/config-agents)
