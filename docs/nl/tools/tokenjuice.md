---
read_when:
    - Je wilt kortere `exec`- of `bash`-toolresultaten in OpenClaw
    - Je wilt de meegeleverde tokenjuice-Plugin inschakelen
    - Je moet begrijpen wat tokenjuice wijzigt en wat het onbewerkt laat
summary: Comprimeer ruisige resultaten van exec- en bash-tools met een optionele meegeleverde Plugin
title: Tokenbudget
x-i18n:
    generated_at: "2026-04-29T23:27:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 04328cc7a13ccd64f8309ddff867ae893387f93c26641dfa1a4013a4c3063962
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` is een optionele gebundelde Plugin die ruisrijke `exec`- en `bash`-toolresultaten comprimeert nadat de opdracht al is uitgevoerd.

Het wijzigt het geretourneerde `tool_result`, niet de opdracht zelf. Tokenjuice herschrijft geen shellinvoer, voert opdrachten niet opnieuw uit en wijzigt geen exitcodes.

Vandaag geldt dit voor ingebedde PI-uitvoeringen en dynamische OpenClaw-tools in de Codex app-server-harness. Tokenjuice koppelt in op OpenClaw's middleware voor toolresultaten en trimt de uitvoer voordat die teruggaat naar de actieve harness-sessie.

## De Plugin inschakelen

Snelste manier:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Equivalent:

```bash
openclaw plugins enable tokenjuice
```

OpenClaw levert de Plugin al mee. Er is geen aparte stap `plugins install`
of `tokenjuice install openclaw`.

Als je de configuratie liever direct bewerkt:

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

- Comprimeert ruisrijke `exec`- en `bash`-resultaten voordat ze terug de sessie in worden gevoerd.
- Laat de oorspronkelijke opdrachtuitvoering ongemoeid.
- Behoudt exacte leesacties van bestandsinhoud en andere opdrachten die tokenjuice onbewerkt moet laten.
- Blijft opt-in: schakel de Plugin uit als je overal letterlijke uitvoer wilt.

## Verifiëren dat het werkt

1. Schakel de Plugin in.
2. Start een sessie die `exec` kan aanroepen.
3. Voer een ruisrijke opdracht uit, zoals `git status`.
4. Controleer of het geretourneerde toolresultaat korter en beter gestructureerd is dan de ruwe shelluitvoer.

## De Plugin uitschakelen

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
