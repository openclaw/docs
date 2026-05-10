---
read_when:
    - Je wilt de live OpenClaw-docs vanuit de terminal doorzoeken
    - Je moet weten welke hulpbinaries de documentatie-CLI via de shell aanroept
summary: CLI-referentie voor `openclaw docs` (doorzoek de live documentatie-index)
title: Documentatie
x-i18n:
    generated_at: "2026-05-10T19:28:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0f733083bf455695ed24b13db6fe53e95aa3804fa8696a2fd29e749f24324c8
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

Doorzoek de live OpenClaw-documentatie-index vanuit de terminal. De opdracht roept vanuit de shell het openbare, door Mintlify gehoste docs MCP-zoekendpoint op via `https://docs.openclaw.ai/mcp.SearchOpenClaw` en geeft de resultaten weer in je terminal.

## Gebruik

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

Argumenten:

| Argument     | Beschrijving                                                                       |
| ------------ | ---------------------------------------------------------------------------------- |
| `[query...]` | Vrije zoekopdracht. Zoekopdrachten met meerdere woorden worden met spaties samengevoegd en als één geheel verzonden. |

## Voorbeelden

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Zonder zoekopdracht drukt `openclaw docs` de URL van het docs-startpunt plus een voorbeeldzoekopdracht af in plaats van een zoekopdracht uit te voeren.

## Hoe het werkt

`openclaw docs` roept de `mcporter` CLI aan om de docs-zoektool van MCP aan te roepen en parseert daarna de blokken `Title: / Link: / Content:` uit de tooluitvoer naar een lijst met resultaten.

Om `mcporter` te vinden, controleert OpenClaw in deze volgorde:

1. `mcporter` op `PATH` (direct gebruikt indien aanwezig).
2. `pnpm dlx mcporter ...` als `pnpm` is geïnstalleerd.
3. `npx -y mcporter ...` als `npx` is geïnstalleerd.

Als geen van deze beschikbaar is, mislukt de opdracht met een hint om `pnpm` te installeren (`npm install -g pnpm`).

De zoekaanroep gebruikt een vaste time-out van 30 seconden. Resultaatfragmenten worden afgekapt tot ~220 tekens per item.

## Uitvoer

In een rijke (TTY-)terminal worden resultaten weergegeven als een kop gevolgd door een lijst met opsommingstekens. Elk opsommingsteken toont de paginatitel, de gekoppelde docs-URL en een kort fragment op de volgende regel. Lege resultaten drukken "Geen resultaten." af.

In niet-rijke uitvoer (gepiped, `--no-color`, scripts) wordt dezelfde data als Markdown weergegeven:

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## Afsluitcodes

| Code | Betekenis                                           |
| ---- | --------------------------------------------------- |
| `0`  | Zoeken is geslaagd (inclusief antwoorden zonder resultaten). |
| `1`  | De MCP-toolaanroep is mislukt; stderr wordt inline afgedrukt. |

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Live docs](https://docs.openclaw.ai)
