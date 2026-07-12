---
read_when:
    - Inizializzazione manuale di un'area di lavoro
summary: Modello di area di lavoro per HEARTBEAT.md
title: Modello HEARTBEAT.md
x-i18n:
    generated_at: "2026-07-12T07:29:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1605f546995e0bdcb11f9bf905173b14aca25cfad664fe2c7644d18c2b4142e2
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# Modello HEARTBEAT.md

`HEARTBEAT.md` si trova nello spazio di lavoro dell'agente e contiene l'elenco di controllo periodico di Heartbeat. Lascialo vuoto oppure contenente solo spazi, commenti Markdown, intestazioni ATX, elementi di elenco vuoti (`- `, `* [ ]`) o delimitatori di blocchi di codice, affinché OpenClaw ignori completamente la chiamata al modello di Heartbeat (`reason=empty-heartbeat-file`).

Contenuto predefinito distribuito:

```markdown
<!-- Modello Heartbeat; un contenuto costituito solo da commenti impedisce le chiamate pianificate all'API di Heartbeat. -->

# Mantieni vuoto questo file (o inserisci solo commenti) per ignorare le chiamate all'API di Heartbeat.

# Aggiungi attività qui sotto quando vuoi che l'agente controlli periodicamente qualcosa.
```

Aggiungi brevi attività sotto le righe di commento solo quando desideri controlli periodici. Mantieni il contenuto ridotto: a ogni ciclo, Heartbeat legge questo file (per impostazione predefinita ogni 30 minuti), quindi istruzioni eccessive consumano token a ogni attivazione.

Per eseguire controlli solo quando sono previsti, invece di usare un semplice elenco, utilizza un blocco strutturato `tasks:` con i campi `interval` e `prompt` per ogni attività; consulta [HEARTBEAT.md](/it/gateway/heartbeat#heartbeatmd-optional) per il formato e il comportamento.

## Contenuti correlati

- [Heartbeat](/it/gateway/heartbeat)
- [Configurazione di Heartbeat](/it/gateway/config-agents)
