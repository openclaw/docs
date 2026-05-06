---
read_when:
    - Mac-menu-UI of statuslogica aanpassen
summary: Menubalkstatuslogica en wat aan gebruikers wordt getoond
title: Menubalk
x-i18n:
    generated_at: "2026-05-06T09:23:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: c569ced20b2f6a639d52d373cc8b55a42d7c015a0b234d5154ce67ac03c2eaf6
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

## Wat wordt getoond

- We tonen de huidige werkstatus van de agent in het menubalkpictogram en in de eerste statusrij van het menu.
- De gezondheidsstatus wordt verborgen terwijl er werk actief is; deze keert terug wanneer alle sessies inactief zijn.
- Een hoofdsubmenu "Context" bevat recente sessies in plaats van ze rechtstreeks in het hoofdmenu uit te vouwen.
- Het blok "Knooppunten" in het hoofdmenu toont alleen **apparaten** (gekoppelde knooppunten via `node.list`), geen client-/aanwezigheidsitems.
- Een hoofdsectie "Gebruik" verschijnt onder Context wanneer snapshots van providergebruik beschikbaar zijn, gevolgd door gebruikskosten-details wanneer beschikbaar.

## Statusmodel

- Sessies: gebeurtenissen komen binnen met `runId` (per uitvoering) plus `sessionKey` in de payload. De "hoofd"-sessie is de sleutel `main`; als die ontbreekt, vallen we terug op de laatst bijgewerkte sessie.
- Prioriteit: hoofd wint altijd. Als hoofd actief is, wordt de status ervan onmiddellijk getoond. Als hoofd inactief is, wordt de meest recent actieve niet-hoofdsessie getoond. We wisselen niet heen en weer tijdens activiteit; we schakelen alleen wanneer de huidige sessie inactief wordt of hoofd actief wordt.
- Activiteitstypen:
  - `job`: opdrachtuitvoering op hoog niveau (`state: started|streaming|done|error`).
  - `tool`: `phase: start|result` met `toolName` en `meta/args`.

## IconState-enum (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (debug-override)

### ActivityKind → symbool

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- standaard → 🛠️

### Visuele mapping

- `idle`: normaal beestje.
- `workingMain`: badge met symbool, volledige tint, "werkende" beenanimatie.
- `workingOther`: badge met symbool, gedempte tint, geen gehaast.
- `overridden`: gebruikt het gekozen symbool/de gekozen tint ongeacht de activiteit.

## Contextsubmenu

- Het hoofdmenu toont één rij "Context" met een sessietelling/-status en opent een submenu.
- De koptekst van het Contextsubmenu toont het aantal actieve sessies van de laatste 24 uur.
- Elke sessierij behoudt de tokenbalk, leeftijd, preview, denk-/verbose-status, en acties voor resetten, compact maken en verwijderen.
- Berichten voor laden, verbroken verbinding en fouten bij het laden van sessies verschijnen binnen het Contextsubmenu.
- Providergebruik en gebruikskosten-details blijven op hoofdniveau onder Context, zodat ze in één oogopslag zichtbaar blijven zonder het submenu te openen.

## Statusrijtekst (menu)

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
  - `edit`: pad plus afgeleide wijzigingssoort uit `meta`/diff-tellingen.
  - fallback: toolnaam.

## Debug-override

- Instellingen ▸ Debug ▸ keuzelijst "Pictogram-override":
  - `System (auto)` (standaard)
  - `Working: main` (per toolsoort)
  - `Working: other` (per toolsoort)
  - `Idle`
- Opgeslagen via `@AppStorage("iconOverride")`; gemapt naar `IconState.overridden`.

## Testchecklist

- Activeer taak in hoofdsessie: controleer of het pictogram onmiddellijk wisselt en de statusrij het hoofdlabel toont.
- Activeer taak in niet-hoofdsessie terwijl hoofd inactief is: pictogram/status toont niet-hoofd; blijft stabiel totdat deze is voltooid.
- Start hoofd terwijl andere sessie actief is: pictogram schakelt direct naar hoofd.
- Snelle toolbursts: zorg dat de badge niet flikkert (TTL-gratie op toolresultaten).
- Gezondheidsrij verschijnt opnieuw zodra alle sessies inactief zijn.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [Menubalkpictogram](/nl/platforms/mac/icon)
