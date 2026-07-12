---
read_when:
    - Anpassen der Mac-Menüoberfläche oder Statuslogik
summary: Statuslogik der Menüleiste und für Benutzer sichtbare Informationen
title: Menüleiste
x-i18n:
    generated_at: "2026-07-12T15:31:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 480a85f383a6495c0e45850a322c0c67c4cc35e21d2d29b4bd86f42fdbf9430a
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

## Was angezeigt wird

- Der aktuelle Arbeitszustand des Agenten wird im Menüleistensymbol und in der ersten Statuszeile des Menüs dargestellt.
- Der Integritätsstatus wird während aktiver Arbeit ausgeblendet; er wird wieder angezeigt, sobald alle Sitzungen inaktiv sind.
- Ein übergeordneter Eintrag „Kontext“ öffnet ein Untermenü mit den letzten Sitzungen, statt sie im übergeordneten Menü aufzuklappen.
- Ein Block „Nodes“ im übergeordneten Menü listet nur gekoppelte **Geräte** (aus `node.list`) auf, keine Client-/Präsenzeinträge.
- Ein übergeordneter Abschnitt „Nutzung“ wird unter „Kontext“ angezeigt, wenn Momentaufnahmen der Provider-Nutzung verfügbar sind, gefolgt von Kostendetails, sofern verfügbar.

## Zustandsmodell

- Quelle: `WorkActivityStore` (`apps/macos/Sources/OpenClaw/WorkActivityStore.swift`).
- Ereignisse gehen als `ControlAgentEvent` mit einer `runId` ein; der Handler (`ControlChannel.routeWorkActivity`) liest `sessionKey` aus der Ereignisnutzlast und verwendet standardmäßig `"main"`, wenn der Wert fehlt.
- Priorität: Die Hauptsitzung (standardmäßig `sessionKey == "main"`) hat immer Vorrang. Wenn die Hauptsitzung aktiv ist, wird ihr Zustand sofort angezeigt. Wenn die Hauptsitzung inaktiv ist, wird stattdessen die zuletzt aktive Nicht-Hauptsitzung angezeigt. Der Store wechselt nicht während einer Aktivität; er wechselt nur, wenn die aktuelle Sitzung inaktiv wird oder die Hauptsitzung aktiv wird.
- Aktivitätsarten:
  - `job`: Ausführung eines übergeordneten Befehls (`state: started|streaming|done|error|...`).
  - `tool`: `phase: start|result` mit `name`, optional `meta`/`args`.

## Aufzählung IconState (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (Debug-Überschreibung)

### ActivityKind -> Badge-Symbol

`ActivityKind` umschließt einen `ToolKind` (`bash`, `read`, `write`, `edit`, `attach`, `other`) oder einen einfachen `job`. Jeder Wert wird einem SF-Symbol-Badge zugeordnet, das über dem Tierchensymbol gezeichnet wird (`IconState.badgeSymbolName`):

| Art             | Symbol                             |
| --------------- | ---------------------------------- |
| `bash`          | `chevron.left.slash.chevron.right` |
| `read`          | `doc`                              |
| `write`         | `pencil`                           |
| `edit`          | `pencil.tip`                       |
| `attach`        | `paperclip`                        |
| `other` / `job` | `gearshape.fill`                   |

### Visuelle Zuordnung

- `idle`: normales Tierchen, kein Badge.
- `workingMain`: Badge mit Symbol, vollständige Tönung (Hervorhebung `.primary`), „Arbeits“-Animation der Beine.
- `workingOther`: Badge mit Symbol, gedämpfte Tönung (Hervorhebung `.secondary`), kein Herumhuschen.
- `overridden`: verwendet unabhängig von der tatsächlichen Aktivität das ausgewählte Symbol und die ausgewählte Tönung.

## Kontext-Untermenü

- Das Hauptmenü zeigt eine einzelne Zeile „Kontext“ mit Sitzungsanzahl und -status; sie öffnet ein Untermenü (`MenuSessionsInjector`).
- Die Kopfzeile des Untermenüs zeigt die Anzahl der aktiven Sitzungen der letzten 24 Stunden.
- Jede Sitzungszeile behält ihre Token-Leiste, das Alter, die Vorschau, den Umschalter für Denkmodus/ausführliche Ausgabe sowie die Aktionen zum Zurücksetzen, Komprimieren und Löschen.
- Meldungen zum Laden, zu einer getrennten Verbindung und zu Fehlern beim Laden von Sitzungen werden im Kontext-Untermenü angezeigt.
- Die Abschnitte zu Nutzung und Kosten bleiben auf der Hauptebene unterhalb von „Kontext“, damit sie ohne Öffnen des Untermenüs auf einen Blick erkennbar sind.

## Text der Statuszeile (Menü)

- Während Arbeit aktiv ist: `<Session role> · <activity label>` (`"\(roleLabel) · \(activity.label)"` in `MenuContentView`), wobei die Rollenbezeichnung `Main` oder `Other` lautet.
- Im Leerlauf: Es wird auf die Zustandsübersicht zurückgegriffen.

## Ereignisaufnahme

- Quelle: `agent`-Ereignisse des Steuerungskanals, weitergeleitet durch `ControlChannel.routeWorkActivity(from:)`.
- Geparste Felder:
  - `stream: "job"` mit `data.state` für Start/Stopp.
  - `stream: "tool"` mit `data.phase`, `data.name` und optional `data.meta`/`data.args`.
- Tool-Bezeichnungen stammen aus `ToolDisplayRegistry.resolve(name:args:meta:)`; nicht aufgelöste Namen greifen auf den unverarbeiteten Tool-Namen zurück.

## Debug-Überschreibung

- Einstellungen > Debug > Auswahl „Icon override“:
  - `System (auto)` (Standard)
  - `Working: main` / `Working: other` (nach Tooltyp: bash, read, write, edit, other)
  - `Idle`
- Gespeichert unter dem `UserDefaults`-Schlüssel `openclaw.iconOverride`; `IconState.overridden` zugeordnet.

## Test-Checkliste

- Auftrag der Hauptsitzung auslösen: Das Symbol wechselt sofort, und die Statuszeile zeigt die Hauptsitzungsbezeichnung an.
- Auftrag einer anderen Sitzung auslösen, während die Hauptsitzung inaktiv ist: Symbol und Status zeigen die andere Sitzung an und bleiben stabil, bis sie beendet ist.
- Hauptsitzung starten, während eine andere Sitzung aktiv ist: Das Symbol wechselt sofort zur Hauptsitzung.
- Schnelle Toolfolgen: Das Badge flackert nicht (2 Sekunden Kulanzzeit vor dem Ausblenden eines abgeschlossenen Tools, `WorkActivityStore.toolResultGrace`).
- Die Systemstatuszeile wird wieder angezeigt, sobald alle Sitzungen inaktiv sind.

## Verwandte Themen

- [macOS-App](/de/platforms/macos)
- [Menüleistensymbol](/de/platforms/mac/icon)
