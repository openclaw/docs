---
read_when:
    - De gebruikersinterface van het Mac-menu of de statuslogica aanpassen
summary: Statuslogica van de menubalk en wat aan gebruikers wordt getoond
title: Menubalk
x-i18n:
    generated_at: "2026-07-12T09:04:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 480a85f383a6495c0e45850a322c0c67c4cc35e21d2d29b4bd86f42fdbf9430a
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

## Wat wordt weergegeven

- De huidige werkstatus van de agent wordt weergegeven in het menubalkpictogram en in de eerste statusrij van het menu.
- De gezondheidsstatus wordt verborgen zolang er actief werk wordt uitgevoerd; deze keert terug zodra alle sessies inactief zijn.
- Een hoofditem 'Context' opent een submenu met recente sessies in plaats van deze in het hoofdmenu uit te vouwen.
- Een blok 'Nodes' in het hoofdmenu vermeldt alleen gekoppelde **apparaten** (uit `node.list`), geen client-/aanwezigheidsvermeldingen.
- Een hoofdsectie 'Gebruik' verschijnt onder Context wanneer momentopnamen van het providergebruik beschikbaar zijn, gevolgd door kostengegevens indien beschikbaar.

## Statusmodel

- Bron: `WorkActivityStore` (`apps/macos/Sources/OpenClaw/WorkActivityStore.swift`).
- Gebeurtenissen komen binnen als `ControlAgentEvent` met een `runId`; de afhandelingsfunctie (`ControlChannel.routeWorkActivity`) leest `sessionKey` uit de gebeurtenispayload en gebruikt standaard `"main"` als deze ontbreekt.
- Prioriteit: de hoofdsessie (standaard `sessionKey == "main"`) heeft altijd voorrang. Als de hoofdsessie actief is, wordt de status daarvan onmiddellijk weergegeven. Als de hoofdsessie inactief is, wordt in plaats daarvan de meest recent actieve niet-hoofdsessie weergegeven. De opslag wisselt niet tijdens een activiteit; er wordt alleen gewisseld wanneer de huidige sessie inactief wordt of de hoofdsessie actief wordt.
- Activiteitstypen:
  - `job`: uitvoering van opdrachten op hoog niveau (`state: started|streaming|done|error|...`).
  - `tool`: `phase: start|result` met `name` en optioneel `meta`/`args`.

## `IconState`-enum (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (foutopsporingsoverschrijving)

### `ActivityKind` -> badgesymbool

`ActivityKind` omvat een `ToolKind` (`bash`, `read`, `write`, `edit`, `attach`, `other`) of een losse `job`. Elk type wordt toegewezen aan een SF Symbols-badge die over het beestjespictogram wordt getekend (`IconState.badgeSymbolName`):

| Type            | Symbool                            |
| --------------- | ---------------------------------- |
| `bash`          | `chevron.left.slash.chevron.right` |
| `read`          | `doc`                              |
| `write`         | `pencil`                           |
| `edit`          | `pencil.tip`                       |
| `attach`        | `paperclip`                        |
| `other` / `job` | `gearshape.fill`                   |

### Visuele toewijzing

- `idle`: normaal beestje, geen badge.
- `workingMain`: badge met symbool, volledige tint (prominentie `.primary`), 'werk'-animatie van de poten.
- `workingOther`: badge met symbool, gedempte tint (prominentie `.secondary`), geen renbeweging.
- `overridden`: gebruikt het gekozen symbool en de gekozen tint, ongeacht de werkelijke activiteit.

## Submenu Context

- Het hoofdmenu toont één rij 'Context' met een aantal sessies/status; hiermee wordt een submenu (`MenuSessionsInjector`) geopend.
- De kop van het submenu toont het aantal actieve sessies van de afgelopen 24 uur.
- Elke sessierij behoudt de tokenbalk, leeftijd, het voorbeeld, de schakelaar voor denken/uitgebreide uitvoer en de acties voor opnieuw instellen, comprimeren en verwijderen.
- Meldingen over laden, een verbroken verbinding en fouten bij het laden van sessies worden in het submenu Context weergegeven.
- De secties voor gebruik en kosten blijven op hoofdniveau onder Context staan, zodat ze in één oogopslag zichtbaar blijven zonder het submenu te openen.

## Tekst van de statusrij (menu)

- Terwijl er actief wordt gewerkt: `<Session role> · <activity label>` (`"\(roleLabel) · \(activity.label)"` in `MenuContentView`), waarbij het rollabel `Main` of `Other` is.
- Bij inactiviteit: valt terug op het gezondheidsoverzicht.

## Gebeurtenisverwerking

- Bron: `agent`-gebeurtenissen van het besturingskanaal, gerouteerd door `ControlChannel.routeWorkActivity(from:)`.
- Geparseerde velden:
  - `stream: "job"` met `data.state` voor starten/stoppen.
  - `stream: "tool"` met `data.phase`, `data.name` en optioneel `data.meta`/`data.args`.
- Toollabels zijn afkomstig van `ToolDisplayRegistry.resolve(name:args:meta:)`; niet-herkende namen vallen terug op de onbewerkte toolnaam.

## Foutopsporingsoverschrijving

- Settings > Debug > kiezer "Icon override":
  - `System (auto)` (standaard)
  - `Working: main` / `Working: other` (per soort tool: bash, lezen, schrijven, bewerken, overig)
  - `Idle`
- Opgeslagen onder de `UserDefaults`-sleutel `openclaw.iconOverride`; toegewezen aan `IconState.overridden`.

## Testchecklist

- Activeer een taak in de hoofdsessie: het pictogram verandert onmiddellijk en de statusrij toont het hoofdlabel.
- Activeer een taak in een andere sessie terwijl de hoofdsessie inactief is: het pictogram/de status toont de andere sessie en blijft stabiel totdat deze is voltooid.
- Start de hoofdsessie terwijl een andere sessie actief is: het pictogram schakelt onmiddellijk over naar de hoofdsessie.
- Snelle opeenvolging van toolactiviteiten: de badge flikkert niet (respijtperiode van 2 seconden voordat een voltooide tool wordt gewist, `WorkActivityStore.toolResultGrace`).
- De statusrij voor de systeemgezondheid verschijnt opnieuw zodra alle sessies inactief zijn.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [Menubalkpictogram](/nl/platforms/mac/icon)
