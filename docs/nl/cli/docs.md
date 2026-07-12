---
read_when:
    - Je wilt vanuit de terminal de actuele OpenClaw-documentatie doorzoeken
    - Je moet weten welke gehoste zoek-API de documentatie-CLI aanroept
summary: CLI-referentie voor `openclaw docs` (doorzoek de actuele documentatie-index)
title: Documentatie
x-i18n:
    generated_at: "2026-07-12T08:43:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0b575f0b76d40a53dd4f79c55fd65969a24eae27e27bd1c46d395f61fe89e42
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

Doorzoek de live OpenClaw-documentatie-index vanuit de terminal.

## Gebruik

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

| Argument     | Beschrijving                                                                    |
| ------------ | ------------------------------------------------------------------------------- |
| `[query...]` | Vrije zoekopdracht. Zoekopdrachten met meerdere woorden worden met spaties samengevoegd en als één geheel verzonden. |

Zonder zoekopdracht toont `openclaw docs` de URL van het documentatie-ingangspunt en een voorbeeld van een zoekopdracht, in plaats van een zoekactie uit te voeren.

## Voorbeelden

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

## Werking

`openclaw docs` roept `https://docs.openclaw.ai/api/search` aan en geeft de JSON-resultaten weer. Voor het zoekverzoek geldt een vaste time-out van 30 seconden.

## Uitvoer

In een terminal met uitgebreide opmaak (TTY) worden de resultaten weergegeven als een kop gevolgd door een lijst met opsommingstekens: de paginatitel, een gekoppelde documentatie-URL en op de volgende regel een kort fragment. Bij lege resultaten wordt "Geen resultaten." weergegeven.

In uitvoer zonder uitgebreide opmaak (via een pipe, `--no-color`, scripts) worden dezelfde gegevens als Markdown weergegeven:

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## Afsluitcodes

| Code | Betekenis                                                                    |
| ---- | ---------------------------------------------------------------------------- |
| `0`  | De zoekactie is geslaagd, ook bij antwoorden zonder resultaten.              |
| `1`  | De aanroep van de gehoste API voor het doorzoeken van de documentatie is mislukt; stderr toont de foutmelding. |

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Live documentatie](https://docs.openclaw.ai)
