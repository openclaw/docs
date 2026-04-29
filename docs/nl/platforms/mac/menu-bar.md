---
read_when:
    - Mac-menu-UI of statuslogica aanpassen
summary: Logica voor de menubalkstatus en wat aan gebruikers wordt getoond
title: Menubalk
x-i18n:
    generated_at: "2026-04-29T22:59:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89b03f3b0f9e56057d4cbf10bd1252372c65a2b2ae5e0405a844e9a59b51405d
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

# Statuslogica van de menubalk

## Wat wordt weergegeven

- We tonen de huidige werkstatus van de agent in het menubalkpictogram en in de eerste statusrij van het menu.
- De gezondheidsstatus is verborgen terwijl er actief werk is; deze keert terug wanneer alle sessies inactief zijn.
- Het blok “Nodes” in het menu vermeldt alleen **apparaten** (gekoppelde nodes via `node.list`), geen client-/aanwezigheidsvermeldingen.
- Een sectie “Gebruik” verschijnt onder Context wanneer gebruikssnapshots van providers beschikbaar zijn.

## Statusmodel

- Sessies: gebeurtenissen komen binnen met `runId` (per run) plus `sessionKey` in de payload. De “hoofd”-sessie is de sleutel `main`; als die ontbreekt, vallen we terug op de meest recent bijgewerkte sessie.
- Prioriteit: main wint altijd. Als main actief is, wordt de status daarvan direct weergegeven. Als main inactief is, wordt de meest recent actieve niet-main-sessie weergegeven. We wisselen niet heen en weer midden in activiteit; we schakelen alleen wanneer de huidige sessie inactief wordt of main actief wordt.
- Activiteitstypen:
  - `job`: opdrachtuitvoering op hoog niveau (`state: started|streaming|done|error`).
  - `tool`: `phase: start|result` met `toolName` en `meta/args`.

## IconState-enum (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (debug-override)

### ActivityKind → glyph

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- standaard → 🛠️

### Visuele mapping

- `idle`: normaal wezentje.
- `workingMain`: badge met glyph, volledige tint, “werkende” beenanimatie.
- `workingOther`: badge met glyph, gedempte tint, geen gescharrel.
- `overridden`: gebruikt de gekozen glyph/tint ongeacht de activiteit.

## Tekst van statusrij (menu)

- Terwijl werk actief is: `<Session role> · <activity label>`
  - Voorbeelden: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Wanneer inactief: valt terug op de gezondheidssamenvatting.

## Gebeurtenisinname

- Bron: control-channel `agent`-gebeurtenissen (`ControlChannel.handleAgentEvent`).
- Geparste velden:
  - `stream: "job"` met `data.state` voor starten/stoppen.
  - `stream: "tool"` met `data.phase`, `name`, optioneel `meta`/`args`.
- Labels:
  - `exec`: eerste regel van `args.command`.
  - `read`/`write`: verkort pad.
  - `edit`: pad plus afgeleid wijzigingstype uit `meta`/diff-aantallen.
  - fallback: toolnaam.

## Debug-override

- Instellingen ▸ Debug ▸ kiezer “Pictogram-override”:
  - `System (auto)` (standaard)
  - `Working: main` (per tooltype)
  - `Working: other` (per tooltype)
  - `Idle`
- Opgeslagen via `@AppStorage("iconOverride")`; gemapt naar `IconState.overridden`.

## Testchecklist

- Activeer taak in main-sessie: controleer of het pictogram direct wisselt en de statusrij het main-label toont.
- Activeer taak in niet-main-sessie terwijl main inactief is: pictogram/status toont niet-main; blijft stabiel tot die is voltooid.
- Start main terwijl een andere sessie actief is: pictogram schakelt direct naar main.
- Snelle toolbursts: zorg dat de badge niet flikkert (TTL-speling op toolresultaten).
- Gezondheidsrij verschijnt opnieuw zodra alle sessies inactief zijn.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [Menubalkpictogram](/nl/platforms/mac/icon)
