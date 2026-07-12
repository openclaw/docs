---
read_when:
    - Onderzoek naar een crash van de tsx/esbuild-loader waarin een ontbrekende helper `__name` wordt vermeld
summary: Historische crash met Node + tsx, waarbij "__name is not a function" werd gemeld, en de oorzaak ervan
title: Node + tsx-crash
x-i18n:
    generated_at: "2026-07-12T08:51:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97d2f62d24860cee65753027ba84c14c8d4ffb910ee17bb0032cf0409c427589
    source_path: debug/node-issue.md
    workflow: 16
---

# Crash van Node + tsx: "\_\_name is geen functie"

## Status

Opgelost. Deze crash is niet reproduceerbaar met de huidige `tsx`-versie die in
`package.json` is vastgezet (`4.22.3`), noch met de huidige Node-releases. Deze informatie blijft hier staan voor het geval een
toekomstige upgrade van `tsx`/esbuild het probleem opnieuw introduceert.

## Oorspronkelijk symptoom

Het uitvoeren van OpenClaw-ontwikkelscripts via `tsx` mislukte bij het opstarten met:

```text
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (src/logging/subsystem.ts)
    at <caller> (src/agents/auth-profiles/constants.ts)
```

Regelnummers zijn weggelaten; beide bestanden zijn sinds de oorspronkelijke crash
gewijzigd en de specifieke regels komen niet meer overeen.

Dit trad op nadat ontwikkelscripts waren overgeschakeld van Bun naar `tsx` (`2871657e`,
2026-01-06) om Bun optioneel te maken. Het equivalente pad op basis van Bun crashte niet.
Het probleem werd oorspronkelijk waargenomen met Node v25.3.0 op macOS; andere platforms waarop
Node 25 wordt uitgevoerd, werden waarschijnlijk ook als getroffen beschouwd.

## Oorzaak

`tsx` transformeert TS/ESM via esbuild, waarbij `keepNames: true` vast is ingesteld in
de transformatieopties. Door die instelling laat esbuild benoemde functie- en klassedeclaraties
omhullen door een aanroep van een `__name`-hulpfunctie, zodat `fn.name` behouden blijft na minificatie
en bundeling. De crash betekent dat de hulpfunctie ontbrak of werd overschaduwd op de aanroeplocatie
voor die module in de getroffen combinatie van `tsx` en Node, waardoor `__name(...)`
een fout genereerde in plaats van de omhulde waarde te retourneren.

## Huidige reproductiecontrole

```bash
node --version
pnpm install
node --import tsx src/entry.ts status
```

Minimale geïsoleerde reproductie (laadt alleen de module uit de oorspronkelijke stacktrace):

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

Beide opdrachten worden momenteel zonder fouten afgesloten. Als een van beide opnieuw de fout
`__name is not a function` genereert, leg dan de exacte Node-versie, de `tsx`-versie
(`node_modules/tsx/package.json`) en de volledige stacktrace vast voordat je het probleem upstream meldt.

## Tijdelijke oplossingen (als de crash terugkeert)

- Voer ontwikkelscripts uit met Bun in plaats van `node --import tsx`.
- Voer `pnpm tsgo` uit voor typecontrole en voer vervolgens de gebouwde uitvoer uit in plaats van de
  broncode via `tsx`:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Probeer een andere `tsx`-versie (`pnpm add -D tsx@<version>` is een wijziging van een afhankelijkheid
  en vereist volgens het repositorybeleid goedkeuring) om via bisectie vast te stellen of de meegeleverde
  esbuild-versie de bug opnieuw heeft geïntroduceerd.
- Test met een andere hoofd- of subversie van Node om te bepalen of de fout
  versiespecifiek is.

## Verwijzingen

- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Gerelateerd

- [Node.js-installatie](/nl/install/node)
- [Problemen met de Gateway oplossen](/nl/gateway/troubleshooting)
