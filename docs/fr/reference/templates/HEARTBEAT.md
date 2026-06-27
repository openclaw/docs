---
read_when:
    - Amorcer un espace de travail manuellement
summary: Modèle d’espace de travail pour HEARTBEAT.md
title: modèle HEARTBEAT.md
x-i18n:
    generated_at: "2026-06-27T18:12:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a1ea787d67110ca53d752706b62f5ce5c4df8637897dee97ce6502f6a05eb6
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# Modèle HEARTBEAT.md

`HEARTBEAT.md` se trouve dans l’espace de travail de l’agent. Laissez le fichier vide, ou avec uniquement des commentaires et des titres Markdown, lorsque vous voulez qu’OpenClaw ignore les appels de modèle Heartbeat.

Le modèle d’exécution par défaut est :

```markdown
# Gardez ce fichier vide (ou avec uniquement des commentaires) pour ignorer les appels d’API Heartbeat.

# Ajoutez des tâches ci-dessous lorsque vous voulez que l’agent vérifie quelque chose périodiquement.
```

Ajoutez des tâches courtes sous les commentaires uniquement lorsque vous voulez que l’agent vérifie quelque chose périodiquement. Gardez les instructions Heartbeat concises, car elles sont lues lors des réveils récurrents.

## Connexe

- [Configuration Heartbeat](/fr/gateway/config-agents)
