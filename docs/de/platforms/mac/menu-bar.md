---
read_when:
    - Anpassen der Mac-Menüoberfläche oder Statuslogik
summary: Statuslogik der Menüleiste und die den Benutzern angezeigten Informationen
title: Menüleiste
x-i18n:
    generated_at: "2026-07-12T01:50:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 480a85f383a6495c0e45850a322c0c67c4cc35e21d2d29b4bd86f42fdbf9430a
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

## Was angezeigt wird

- Der aktuelle Arbeitsstatus des Agenten wird im Menüleistensymbol und in der ersten Statuszeile des Menüs dargestellt.
- Der Integritätsstatus wird ausgeblendet, solange Arbeit aktiv ist; er wird wieder angezeigt, sobald alle Sitzungen inaktiv sind.
- Ein übergeordneter Eintrag „Kontext“ öffnet ein Untermenü mit den letzten Sitzungen, anstatt sie im Hauptmenü aufzuklappen.
- Ein Block „Nodes“ im Hauptmenü führt nur gekoppelte **Geräte** auf (aus `node.list`), keine Client-/Präsenzeinträge.
- Unter „Kontext“ wird im Hauptmenü ein Abschnitt „Nutzung“ angezeigt, wenn Momentaufnahmen der Provider-Nutzung verfügbar sind, gefolgt von Kostendetails, sofern verfügbar.

## Zustandsmodell

- Quelle: `WorkActivityStore` (`apps/macos/Sources/OpenClaw/WorkActivityStore.swift`).
- Ereignisse gehen als `ControlAgentEvent` mit einer `runId` ein; der Handler (`ControlChannel.routeWorkActivity`) liest `sessionKey` aus der Ereignisnutzlast und verwendet standardmäßig `"main"`, wenn der Wert fehlt.
- Priorität: Die Hauptsitzung (standardmäßig `sessionKey == "main"`) hat immer Vorrang. Wenn die Hauptsitzung aktiv ist, wird ihr Zustand sofort angezeigt. Wenn die Hauptsitzung inaktiv ist, wird stattdessen die zuletzt aktive Nicht-Hauptsitzung angezeigt. Der Store wechselt nicht während einer laufenden Aktivität; er wechselt erst, wenn die aktuelle Sitzung inaktiv wird oder die Hauptsitzung aktiv wird.
- Aktivitätsarten:
  - `job`: Ausführung eines übergeordneten Befehls (`state: started|streaming|done|error|...`).
  - `tool`: `phase: start|result` mit `name` sowie optional `meta`/`args`.

## `IconState`-Enum (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (Debug-Überschreibung)

### `ActivityKind` -> Abzeichensymbol

`ActivityKind` umschließt einen `ToolKind` (`bash`, `read`, `write`, `edit`, `attach`, `other`) oder einen einfachen `job`. Jeder Wert ist einem SF-Symbol-Abzeichen zugeordnet, das über dem Tierchensymbol gezeichnet wird (`IconState.badgeSymbolName`):

| Art             | Symbol                             |
| --------------- | ---------------------------------- |
| `bash`          | `chevron.left.slash.chevron.right` |
| `read`          | `doc`                              |
| `write`         | `pencil`                           |
| `edit`          | `pencil.tip`                       |
| `attach`        | `paperclip`                        |
| `other` / `job` | `gearshape.fill`                   |

### Visuelle Zuordnung

- `idle`: normales Tierchen, kein Abzeichen.
- `workingMain`: Abzeichen mit Symbol, vollständige Tönung (Hervorhebung `.primary`), „Arbeits“-Animation der Beine.
- `workingOther`: Abzeichen mit Symbol, gedämpfte Tönung (Hervorhebung `.secondary`), kein Huschen.
- `overridden`: verwendet unabhängig von der tatsächlichen Aktivität das ausgewählte Symbol und die ausgewählte Tönung.

## Kontext-Untermenü

- Das Hauptmenü zeigt eine Zeile „Kontext“ mit Sitzungsanzahl und -status; sie öffnet ein Untermenü (`MenuSessionsInjector`).
- Die Kopfzeile des Untermenüs zeigt die Anzahl der aktiven Sitzungen der letzten 24 Stunden.
- Jede Sitzungszeile behält ihre Token-Leiste, das Alter, die Vorschau, den Schalter für Denkmodus/ausführliche Ausgabe sowie die Aktionen zum Zurücksetzen, Komprimieren und Löschen.
- Meldungen zum Laden, zu einer getrennten Verbindung und zu Fehlern beim Laden von Sitzungen werden innerhalb des Kontext-Untermenüs angezeigt.
- Die Abschnitte zu Nutzung und Kosten bleiben auf der Hauptebene unterhalb von „Kontext“, sodass sie ohne Öffnen des Untermenüs auf einen Blick sichtbar bleiben.

## Text der Statuszeile (Menü)

- Während Arbeiten aktiv sind: `<Session role> · <activity label>` (`"\(roleLabel) · \(activity.label)"` in `MenuContentView`), wobei die Rollenbezeichnung `Main` oder `Other` lautet.
- Im Leerlauf: greift auf die Zustandsübersicht zurück.

## Ereignisaufnahme

- Quelle: `agent`-Ereignisse des Steuerungskanals, weitergeleitet durch `ControlChannel.routeWorkActivity(from:)`.
- Analysierte Felder:
  - `stream: "job"` mit `data.state` für Start/Stopp.
  - `stream: "tool"` mit `data.phase`, `data.name` und optional `data.meta`/`data.args`.
- Werkzeugbezeichnungen stammen aus `ToolDisplayRegistry.resolve(name:args:meta:)`; bei nicht aufgelösten Namen wird ersatzweise der unveränderte Werkzeugname verwendet.

## Debug-Überschreibung

- Einstellungen > Debug > Auswahl „Icon-Überschreibung“:
  - `System (auto)` (Standard)
  - `Working: main` / `Working: other` (nach Werkzeugtyp: bash, lesen, schreiben, bearbeiten, sonstige)
  - `Idle`
- Gespeichert unter dem `UserDefaults`-Schlüssel `openclaw.iconOverride`; `IconState.overridden` zugeordnet.

## Test-Checkliste

- Auftrag der Hauptsitzung auslösen: Das Icon wechselt sofort, und die Statuszeile zeigt die Bezeichnung der Hauptsitzung.
- Auftrag einer anderen Sitzung auslösen, während die Hauptsitzung inaktiv ist: Icon und Status zeigen die andere Sitzung an und bleiben bis zu deren Abschluss stabil.
- Hauptsitzung starten, während eine andere Sitzung aktiv ist: Das Icon wechselt sofort zur Hauptsitzung.
- Schnelle Werkzeugfolgen: Das Badge flackert nicht (Kulanzzeit von 2 Sekunden vor dem Entfernen eines abgeschlossenen Werkzeugs, `WorkActivityStore.toolResultGrace`).
- Die Statuszeile wird wieder angezeigt, sobald alle Sitzungen inaktiv sind.

## Verwandte Themen

- [macOS-App](/de/platforms/macos)
- [Menüleisten-Icon](/de/platforms/mac/icon)
