---
read_when:
    - U wilt code_execution inschakelen of configureren
    - U wilt analyse op afstand zonder lokale shelltoegang
    - Je wilt x_search of web_search combineren met externe Python-analyse
summary: code_execution -- voer externe Python-analyse in een sandbox uit met xAI
title: Code-uitvoering
x-i18n:
    generated_at: "2026-04-29T23:22:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe635ec65aaf593a5bd63c139fbfc69e1ba3ea7c58c2bba639ec1ebd70dba1a9
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` voert externe Python-analyse in een sandbox uit op de Responses API van xAI.
Dit verschilt van lokale [`exec`](/nl/tools/exec):

- `exec` voert shellcommando's uit op je machine of node
- `code_execution` voert Python uit in de externe sandbox van xAI

Gebruik `code_execution` voor:

- berekeningen
- tabellen maken
- snelle statistieken
- analyse in diagramstijl
- analyse van data die door `x_search` of `web_search` is teruggegeven

Gebruik het **niet** wanneer je lokale bestanden, je shell, je repo of gekoppelde
apparaten nodig hebt. Gebruik daarvoor [`exec`](/nl/tools/exec).

## Instellen

Je hebt een xAI-API-sleutel nodig. Elk van deze werkt:

- `XAI_API_KEY`
- `plugins.entries.xai.config.webSearch.apiKey`

Voorbeeld:

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...",
          },
          codeExecution: {
            enabled: true,
            model: "grok-4-1-fast",
            maxTurns: 2,
            timeoutSeconds: 30,
          },
        },
      },
    },
  },
}
```

## Hoe je het gebruikt

Vraag op een natuurlijke manier en maak de analyse-intentie expliciet:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

De tool gebruikt intern één parameter `task`, dus de agent moet het volledige
analyseverzoek en eventuele inline data in één prompt sturen.

## Beperkingen

- Dit is externe xAI-uitvoering, geen lokale procesuitvoering.
- Het moet worden behandeld als tijdelijke analyse, niet als een persistent notebook.
- Ga niet uit van toegang tot lokale bestanden of je workspace.
- Gebruik voor verse X-data eerst [`x_search`](/nl/tools/web#x_search).

## Gerelateerd

- [Exec-tool](/nl/tools/exec)
- [Exec-goedkeuringen](/nl/tools/exec-approvals)
- [apply_patch-tool](/nl/tools/apply-patch)
- [Webtools](/nl/tools/web)
- [xAI](/nl/providers/xai)
