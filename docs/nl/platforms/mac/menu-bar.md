---
read_when:
    - Mac-menu-UI of statuslogica aanpassen
summary: Logica voor de status in de menubalk en wat aan gebruikers wordt getoond
title: Menubalk
x-i18n:
    generated_at: "2026-05-01T11:20:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 340b86a2e222fb1fe7fda4f0f0434127af1393a64348ea033ea284ba52866beb
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

# Statuslogica voor menubalk

## Wat wordt weergegeven

- We tonen de huidige werkstatus van de agent in het menubalkpictogram en in de eerste statusrij van het menu.
- De gezondheidsstatus wordt verborgen terwijl er werk actief is; deze keert terug wanneer alle sessies inactief zijn.
- Een hoofdsubmenu “Context” bevat recente sessies in plaats van ze direct in het hoofdmenu uit te vouwen.
- Het blok “Nodes” in het hoofdmenu vermeldt alleen **apparaten** (gekoppelde nodes via `node.list`), geen client-/aanwezigheidsitems.
- Een hoofdsectie “Gebruik” verschijnt onder Context wanneer momentopnamen van providergebruik beschikbaar zijn, gevolgd door gebruikskosteninformatie wanneer beschikbaar.

## Statusmodel

- Sessies: events komen binnen met `runId` (per uitvoering) plus `sessionKey` in de payload. De “hoofd”-sessie is de sleutel `main`; als die ontbreekt, vallen we terug op de meest recent bijgewerkte sessie.
- Prioriteit: main wint altijd. Als main actief is, wordt de status daarvan onmiddellijk weergegeven. Als main inactief is, wordt de meest recent actieve niet-main-sessie weergegeven. We wisselen niet heen en weer tijdens activiteit; we schakelen alleen wanneer de huidige sessie inactief wordt of main actief wordt.
- Activiteitstypen:
  - `job`: uitvoering van opdrachten op hoog niveau (`state: started|streaming|done|error`).
  - `tool`: `phase: start|result` met `toolName` en `meta/args`.

## IconState-enum (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (debug-override)

### ActivityKind → teken

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- standaard → 🛠️

### Visuele mapping

- `idle`: normaal figuurtje.
- `workingMain`: badge met teken, volledige tint, “werkende” animatie van de pootjes.
- `workingOther`: badge met teken, gedempte tint, geen haastbeweging.
- `overridden`: gebruikt het gekozen teken/de gekozen tint ongeacht de activiteit.

## Context-submenu

- Het hoofdmenu toont één rij “Context” met een sessietelling/-status en opent een submenu.
- De header van het Context-submenu toont het aantal actieve sessies van de afgelopen 24 uur.
- Elke sessierij behoudt de tokenbalk, leeftijd, preview, denken/uitgebreid, reset-, compact- en verwijderacties.
- Berichten over laden, verbroken verbindingen en fouten bij het laden van sessies verschijnen in het Context-submenu.
- Providergebruik en gebruikskosteninformatie blijven op hoofdniveau onder Context, zodat ze in één oogopslag zichtbaar blijven zonder het submenu te openen.

## Statusrijtekst (menu)

- Terwijl er werk actief is: `<Session role> · <activity label>`
  - Voorbeelden: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Wanneer inactief: valt terug op de gezondheidssamenvatting.

## Eventinname

- Bron: control-channel `agent`-events (`ControlChannel.handleAgentEvent`).
- Geparste velden:
  - `stream: "job"` met `data.state` voor starten/stoppen.
  - `stream: "tool"` met `data.phase`, `name`, optioneel `meta`/`args`.
- Labels:
  - `exec`: eerste regel van `args.command`.
  - `read`/`write`: verkort pad.
  - `edit`: pad plus afgeleid wijzigingstype uit `meta`/diff-tellingen.
  - fallback: toolnaam.

## Debug-override

- Instellingen ▸ Debug ▸ kiezer “Pictogram-override”:
  - `System (auto)` (standaard)
  - `Working: main` (per tooltype)
  - `Working: other` (per tooltype)
  - `Idle`
- Opgeslagen via `@AppStorage("iconOverride")`; gemapt naar `IconState.overridden`.

## Testchecklist

- Activeer job van main-sessie: controleer of het pictogram onmiddellijk omschakelt en de statusrij het main-label toont.
- Activeer job van niet-main-sessie terwijl main inactief is: pictogram/status toont niet-main; blijft stabiel tot deze klaar is.
- Start main terwijl andere sessie actief is: pictogram schakelt direct naar main.
- Snelle toolbursts: zorg dat de badge niet flikkert (TTL-grace op toolresultaten).
- Gezondheidsrij verschijnt opnieuw zodra alle sessies inactief zijn.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [Menubalkpictogram](/nl/platforms/mac/icon)
