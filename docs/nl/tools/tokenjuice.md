---
read_when:
    - Je wilt kortere `exec`- of `bash`-toolresultaten in OpenClaw
    - Je wilt de Tokenjuice-plugin installeren of inschakelen
    - Je moet begrijpen wat tokenjuice wijzigt en wat het onbewerkt laat
summary: Comprimeer onoverzichtelijke resultaten van de exec- en bash-tools met de optionele Tokenjuice-plugin
title: Tokenjuice
x-i18n:
    generated_at: "2026-07-12T09:25:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96b110563a2600429dd9f0d38997cf7cc5ae4952b7f146a6ab64c96f2f202440
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` is een optionele externe plugin die uitvoerige resultaten van de tools `exec` en `bash`
compacteert nadat de opdracht al is uitgevoerd.

De plugin wijzigt het geretourneerde `tool_result`, niet de opdracht zelf. Tokenjuice
herschrijft geen shellinvoer, voert opdrachten niet opnieuw uit en wijzigt geen afsluitcodes.

Momenteel geldt dit voor ingebedde OpenClaw-uitvoeringen en dynamische OpenClaw-tools in de
Codex-app-serverharnas. Tokenjuice haakt in op de toolresultaatmiddleware van OpenClaw en
kort de uitvoer in voordat deze wordt teruggestuurd naar de actieve harnassessie.

## De plugin inschakelen

Eenmalig installeren:

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

Daarna inschakelen:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Equivalent:

```bash
openclaw plugins enable tokenjuice
```

Als u de configuratie liever rechtstreeks bewerkt:

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

- Compacteert uitvoerige resultaten van `exec` en `bash` voordat ze worden teruggekoppeld naar de sessie.
- Laat de oorspronkelijke uitvoering van de opdracht ongewijzigd.
- Past een beleid voor veilige inventarisatie toe: exacte uitlezingen van bestandsinhoud blijven ongewijzigd, zelfstandige opdrachten voor repository-inventarisatie kunnen worden gecompacteerd en onveilige gemengde opdrachtreeksen blijven ongewijzigd.
- Blijft opt-in: schakel de plugin uit als u overal letterlijke uitvoer wilt.

## Controleren of de plugin werkt

1. Schakel de plugin in.
2. Start een sessie die `exec` kan aanroepen.
3. Voer een uitvoerige opdracht uit, zoals `git status`.
4. Controleer of het geretourneerde toolresultaat korter en beter gestructureerd is dan de onbewerkte shelluitvoer.

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
- [Contextengine](/nl/concepts/context-engine)
