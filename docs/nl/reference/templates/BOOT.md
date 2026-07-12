---
read_when:
    - Een BOOT.md-checklist toevoegen
summary: Werkruimtesjabloon voor BOOT.md
title: BOOT.md-sjabloon
x-i18n:
    generated_at: "2026-07-12T09:23:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1adfb4d71f1f03716a1ddc4774a4cb6ead4b8be65bd9bb34066a9e1929a36b21
    source_path: reference/templates/BOOT.md
    workflow: 16
---

# BOOT.md

Voeg hier korte, expliciete opstartinstructies toe. De meegeleverde `boot-md`-hook voert dit bestand eenmaal per agentwerkruimte uit telkens wanneer de Gateway start, mits het bestand bestaat en inhoud bevat die niet uitsluitend uit witruimte bestaat. Meerdere agents die een werkruimte delen, activeren samen slechts één uitvoering.

De hook wordt standaard uitgeschakeld geleverd. Schakel deze eerst in:

```bash
openclaw hooks enable boot-md
```

Als een checklistitem een bericht verzendt, gebruik dan de berichtentool en antwoord vervolgens met exact het stille token `NO_REPLY` (hoofdletterongevoelig).

## Gerelateerd

- [Agentwerkruimte](/nl/concepts/agent-workspace)
- [Hooks](/nl/automation/hooks#boot-md)
