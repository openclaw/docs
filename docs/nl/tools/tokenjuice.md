---
read_when:
    - Je wilt kortere `exec`- of `bash`-toolresultaten in OpenClaw
    - Je wilt de Tokenjuice-plugin installeren of inschakelen
    - Je moet begrijpen wat tokenjuice wijzigt en wat het onbewerkt laat
summary: Comprimeer ruisige resultaten van exec- en bash-tools met de optionele Tokenjuice-Plugin
title: Tokenjuice
x-i18n:
    generated_at: "2026-06-27T18:30:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 183ab08d2a1150b446245514423b893cff9a85581980c15600cc16aec10eeae7
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` is een optionele externe plugin die lawaaiige `exec`- en `bash`-
toolresultaten comprimeert nadat de opdracht al is uitgevoerd.

Het wijzigt de teruggegeven `tool_result`, niet de opdracht zelf. Tokenjuice
herschrijft geen shellinvoer, voert opdrachten niet opnieuw uit en wijzigt geen exitcodes.

Vandaag is dit van toepassing op ingebedde OpenClaw-runs en dynamische OpenClaw-tools in de Codex
app-server-harness. Tokenjuice haakt in op OpenClaw's middleware voor toolresultaten en
snoeit de uitvoer voordat die teruggaat naar de actieve harness-sessie.

## De plugin inschakelen

Eenmalig installeren:

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

Schakel deze daarna in:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Equivalent:

```bash
openclaw plugins enable tokenjuice
```

Als u liever de configuratie rechtstreeks bewerkt:

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## Wat tokenjuice wijzigt

- Comprimeert lawaaiige `exec`- en `bash`-resultaten voordat ze terug de sessie in worden gevoerd.
- Laat de oorspronkelijke opdrachtuitvoering ongemoeid.
- Behoudt exacte lezingen van bestandsinhoud en andere opdrachten die tokenjuice onbewerkt moet laten.
- Blijft opt-in: schakel de plugin uit als u overal letterlijke uitvoer wilt.

## Controleren of het werkt

1. Schakel de plugin in.
2. Start een sessie die `exec` kan aanroepen.
3. Voer een lawaaiige opdracht uit, zoals `git status`.
4. Controleer of het teruggegeven toolresultaat korter en meer gestructureerd is dan de ruwe shelluitvoer.

## De plugin uitschakelen

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Of:

```bash
openclaw plugins disable tokenjuice
```

## Gerelateerd

- [Exec-tool](/nl/tools/exec)
- [Denkniveaus](/nl/tools/thinking)
- [Context-engine](/nl/concepts/context-engine)
