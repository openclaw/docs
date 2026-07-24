---
read_when:
    - Anpassen der Mac-Menüoberfläche oder Statuslogik
summary: Statuslogik der Menüleiste und für Benutzer sichtbare Informationen
title: Menüleiste
x-i18n:
    generated_at: "2026-07-24T04:30:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d53cd15109864b88010f41ccf4c46ea7fff6721bc6632630d83a558084cb2d62
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

## Was angezeigt wird

- Der aktuelle Arbeitsstatus des Agenten wird im Menüleistensymbol und in der ersten Statuszeile des Menüs angezeigt.
- Der Integritätsstatus wird ausgeblendet, solange Arbeit aktiv ist; er wird wieder angezeigt, sobald alle Sitzungen inaktiv sind.
- Ein übergeordneter Eintrag „Kontext“ öffnet ein Untermenü mit den letzten Sitzungen, anstatt sie im Hauptmenü aufzuklappen.
- Ein Block „Nodes“ im Hauptmenü listet nur gekoppelte **Geräte** auf (aus `node.list`), keine Client-/Präsenzeinträge.
- Unter „Kontext“ wird im Hauptmenü ein Abschnitt „Nutzung“ angezeigt, wenn Momentaufnahmen der Provider-Nutzung verfügbar sind, gefolgt von Kostendetails, sofern verfügbar.
- **Schnellchat** öffnet den schwebenden Eingabebereich der Hauptsitzung; das aktuelle globale Tastenkürzel wird neben dem Eintrag angezeigt.

## Zustandsmodell

- Quelle: `WorkActivityStore` (`apps/macos/Sources/OpenClaw/WorkActivityStore.swift`).
- Ereignisse treffen als `ControlAgentEvent` mit einer `runId` ein; der Handler (`ControlChannel.routeWorkActivity`) liest `sessionKey` aus der Ereignisnutzlast und verwendet standardmäßig `"main"`, wenn der Wert fehlt.
- Priorität: Die Hauptsitzung (standardmäßig `sessionKey == "main"`) hat immer Vorrang. Wenn die Hauptsitzung aktiv ist, wird ihr Zustand sofort angezeigt. Wenn die Hauptsitzung inaktiv ist, wird stattdessen die zuletzt aktive Neben­sitzung angezeigt. Der Store wechselt nicht während einer Aktivität; er wechselt nur, wenn die aktuelle Sitzung inaktiv wird oder die Hauptsitzung aktiv wird.
- Aktivitätsarten:
  - `job`: Ausführung eines übergeordneten Befehls (`state: started|streaming|done|error|...`).
  - `tool`: `phase: start|result` mit `name`, optional `meta`/`args`.

## IconState-Enumeration (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (Debug-Überschreibung)

### ActivityKind -> Abzeichensymbol

`ActivityKind` umschließt eine `ToolKind` (`bash`, `read`, `write`, `edit`, `attach`, `other`) oder eine eigenständige `job`. Jede wird einem SF-Symbol-Abzeichen zugeordnet, das über dem Tierchensymbol gezeichnet wird (`IconState.badgeSymbolName`):

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
- `workingMain`: Abzeichen mit Symbol, vollständige Tönung (`.primary`-Hervorhebung), „Arbeits“-Animation der Beine.
- `workingOther`: Abzeichen mit Symbol, gedämpfte Tönung (`.secondary`-Hervorhebung), kein Huschen.
- `overridden`: verwendet unabhängig von der tatsächlichen Aktivität das ausgewählte Symbol und die ausgewählte Tönung.

## Kontext-Untermenü

- Das Hauptmenü zeigt eine Zeile „Kontext“ mit Sitzungsanzahl/-status; sie öffnet ein Untermenü (`MenuSessionsInjector`).
- Die Kopfzeile des Untermenüs zeigt die Anzahl aktiver Sitzungen innerhalb der letzten 24 Stunden.
- Jede Sitzungszeile behält ihre Token-Leiste, ihr Alter, ihre Vorschau, den Umschalter für Denken/ausführliche Ausgabe sowie die Aktionen zum Zurücksetzen, Komprimieren und Löschen bei.
- Meldungen zum Laden, zu einer getrennten Verbindung und zu Fehlern beim Laden von Sitzungen werden im Kontext-Untermenü angezeigt.
- Die Abschnitte für Nutzung und Kosten bleiben unter „Kontext“ auf der obersten Menüebene, sodass sie ohne Öffnen des Untermenüs auf einen Blick sichtbar bleiben.

## Text der Statuszeile (Menü)

- Während Arbeit aktiv ist: `<Session role> · <activity label>` (`"\(roleLabel) · \(activity.label)"` in `MenuContentView`), wobei die Rollenbezeichnung `Main` oder `Other` lautet.
- Im inaktiven Zustand: greift auf die Integritätszusammenfassung zurück.

## Ereignisaufnahme

- Quelle: `agent`-Ereignisse des Steuerkanals, weitergeleitet durch `ControlChannel.routeWorkActivity(from:)`.
- Analysierte Felder:
  - `stream: "job"` mit `data.state` für Start/Stopp.
  - `stream: "tool"` mit `data.phase`, `data.name`, optional `data.meta`/`data.args`.
- Werkzeugbezeichnungen stammen aus `ToolDisplayRegistry.resolve(name:args:meta:)`; nicht aufgelöste Namen greifen auf den unverarbeiteten Werkzeugnamen zurück.

## Debug-Überschreibung

- Settings > Debug > Auswahl „Icon override“:
  - `System (auto)` (Standard)
  - `Working: main` / `Working: other` (je Werkzeugart: bash, read, write, edit, other)
  - `Idle`
- Gespeichert unter dem Schlüssel `openclaw.iconOverride` in `UserDefaults`; `IconState.overridden` zugeordnet.

## Testcheckliste

- Auftrag der Hauptsitzung auslösen: Das Symbol wechselt sofort, und die Statuszeile zeigt die Bezeichnung der Hauptsitzung.
- Auftrag einer Neben­sitzung auslösen, während die Hauptsitzung inaktiv ist: Symbol/Status zeigt die Neben­sitzung und bleibt bis zu ihrem Abschluss stabil.
- Hauptsitzung starten, während eine andere Sitzung aktiv ist: Das Symbol wechselt sofort zur Hauptsitzung.
- Schnelle Werkzeugfolgen: Das Abzeichen flackert nicht (Toleranzfenster von 2 Sekunden vor dem Entfernen eines abgeschlossenen Werkzeugs, `WorkActivityStore.toolResultGrace`).
- Die Integritätszeile wird wieder angezeigt, sobald alle Sitzungen inaktiv sind.

## Verwandte Themen

- [macOS-App](/de/platforms/macos)
- [Menüleistensymbol](/de/platforms/mac/icon)
