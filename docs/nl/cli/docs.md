---
read_when:
    - Je wilt de live OpenClaw-documentatie vanuit de terminal doorzoeken
    - Je moet weten welke gehoste zoek-API de docs-CLI aanroept
summary: CLI-referentie voor `openclaw docs` (doorzoek de live documentatie-index)
title: Docs
x-i18n:
    generated_at: "2026-06-27T17:19:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f8be22f689d40ffec29df9562b69444c0f8b9bb607dfcb79de20b3023e0eb30a
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

Doorzoek de live OpenClaw-documentatie-index vanuit de terminal. De opdracht roept de door Cloudflare gehoste zoek-API voor documentatie van OpenClaw aan en toont de resultaten in je terminal.

## Gebruik

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

Argumenten:

| Argument     | Beschrijving                                                                         |
| ------------ | ------------------------------------------------------------------------------------ |
| `[query...]` | Vrije zoekopdracht. Zoekopdrachten met meerdere woorden worden samengevoegd met spaties en als één geheel verzonden. |

## Voorbeelden

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Zonder zoekopdracht toont `openclaw docs` de URL van het documentatie-startpunt plus een voorbeeldzoekopdracht in plaats van een zoekactie uit te voeren.

## Hoe het werkt

`openclaw docs` roept `https://docs.openclaw.ai/api/search` aan en toont de JSON-resultaten. De zoekaanroep gebruikt een vaste timeout van 30 seconden.

## Uitvoer

In een rijke (TTY-)terminal worden resultaten weergegeven als een kop gevolgd door een lijst met opsommingstekens. Elk opsommingsteken toont de paginatitel, de gekoppelde documentatie-URL en een kort fragment op de volgende regel. Lege resultaten tonen "Geen resultaten.".

In niet-rijke uitvoer (doorgevoerd via pipe, `--no-color`, scripts) worden dezelfde gegevens als Markdown weergegeven:

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## Exitcodes

| Code | Betekenis                                                        |
| ---- | ---------------------------------------------------------------- |
| `0`  | Zoekactie geslaagd (inclusief antwoorden zonder resultaten).     |
| `1`  | De aanroep naar de gehoste zoek-API voor documentatie is mislukt; stderr wordt inline afgedrukt. |

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Live documentatie](https://docs.openclaw.ai)
