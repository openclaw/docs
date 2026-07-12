---
read_when:
    - Een werkruimte handmatig initialiseren
summary: Werkruimtesjabloon voor HEARTBEAT.md
title: HEARTBEAT.md-sjabloon
x-i18n:
    generated_at: "2026-07-12T09:24:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1605f546995e0bdcb11f9bf905173b14aca25cfad664fe2c7644d18c2b4142e2
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# HEARTBEAT.md-sjabloon

`HEARTBEAT.md` bevindt zich in de agentwerkruimte en bevat de periodieke Heartbeat-controlelijst. Houd het bestand leeg, of gebruik alleen witruimte, Markdown-opmerkingen, ATX-koppen, lege lijstitems (`- `, `* [ ]`) of fence-markeringen, zodat OpenClaw de aanroep van het Heartbeat-model volledig overslaat (`reason=empty-heartbeat-file`).

Standaard meegeleverde inhoud:

```markdown
<!-- Heartbeat-sjabloon; inhoud met alleen opmerkingen voorkomt geplande Heartbeat-API-aanroepen. -->

# Houd dit bestand leeg (of gebruik alleen opmerkingen) om Heartbeat-API-aanroepen over te slaan.

# Voeg hieronder taken toe wanneer je wilt dat de agent periodiek iets controleert.
```

Voeg alleen korte taken onder de commentaarregels toe wanneer je periodieke controles wilt. Houd het beknopt: bij elke tik (standaard elke 30 minuten) leest Heartbeat dit bestand, waardoor uitgebreide instructies bij elke activering tokens verbruiken.

Gebruik voor controles die alleen worden uitgevoerd wanneer ze aan de beurt zijn, in plaats van een gewone controlelijst, een gestructureerd `tasks:`-blok met per taak de velden `interval` en `prompt`; zie [HEARTBEAT.md](/nl/gateway/heartbeat#heartbeatmd-optional) voor de indeling en het gedrag.

## Gerelateerd

- [Heartbeat](/nl/gateway/heartbeat)
- [Heartbeat-configuratie](/nl/gateway/config-agents)
