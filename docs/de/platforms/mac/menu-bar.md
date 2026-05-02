---
read_when:
    - Anpassen der Mac-Menü-UI oder Statuslogik
summary: Statuslogik der Menüleiste und was Benutzern angezeigt wird
title: Menüleiste
x-i18n:
    generated_at: "2026-05-02T06:38:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 340b86a2e222fb1fe7fda4f0f0434127af1393a64348ea033ea284ba52866beb
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

# Statuslogik der Menüleiste

## Was angezeigt wird

- Wir zeigen den aktuellen Arbeitszustand des Agenten im Menüleisten-Icon und in der ersten Statuszeile des Menüs an.
- Der Integritätsstatus ist ausgeblendet, während Arbeit aktiv ist; er kehrt zurück, wenn alle Sitzungen im Leerlauf sind.
- Ein Stamm-Untermenü „Kontext“ enthält aktuelle Sitzungen, anstatt sie direkt im Stammmenü aufzuklappen.
- Der Block „Nodes“ im Stammmenü listet nur **Geräte** auf (gekoppelte Nodes über `node.list`), keine Client-/Präsenz-Einträge.
- Ein Stammabschnitt „Nutzung“ erscheint unterhalb von „Kontext“, wenn Provider-Nutzungs-Snapshots verfügbar sind, gefolgt von Nutzungskosten-Details, sofern verfügbar.

## Zustandsmodell

- Sitzungen: Ereignisse treffen mit `runId` (pro Lauf) plus `sessionKey` in der Nutzlast ein. Die Sitzung „main“ ist der Schlüssel `main`; falls sie fehlt, fallen wir auf die zuletzt aktualisierte Sitzung zurück.
- Priorität: `main` hat immer Vorrang. Wenn `main` aktiv ist, wird ihr Zustand sofort angezeigt. Wenn `main` im Leerlauf ist, wird die zuletzt aktive Nicht-`main`-Sitzung angezeigt. Wir wechseln nicht mitten in einer Aktivität hin und her; wir wechseln nur, wenn die aktuelle Sitzung in den Leerlauf geht oder `main` aktiv wird.
- Aktivitätsarten:
  - `job`: Befehlsausführung auf hoher Ebene (`state: started|streaming|done|error`).
  - `tool`: `phase: start|result` mit `toolName` und `meta/args`.

## IconState-Enum (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (Debug-Überschreibung)

### ActivityKind → Symbol

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- Standard → 🛠️

### Visuelle Zuordnung

- `idle`: normales Tierchen.
- `workingMain`: Abzeichen mit Symbol, voller Farbton, „Arbeits“-Animation der Beine.
- `workingOther`: Abzeichen mit Symbol, gedämpfter Farbton, kein Huschen.
- `overridden`: verwendet unabhängig von der Aktivität das gewählte Symbol/den gewählten Farbton.

## Kontext-Untermenü

- Das Stammmenü zeigt eine Zeile „Kontext“ mit Sitzungsanzahl/-status und öffnet ein Untermenü.
- Die Kopfzeile des Kontext-Untermenüs zeigt die Anzahl aktiver Sitzungen der letzten 24 Stunden.
- Jede Sitzungszeile behält ihre Token-Leiste, ihr Alter, ihre Vorschau, Denken/ausführliche Ausgabe sowie die Aktionen zum Zurücksetzen, Komprimieren und Löschen.
- Lade-, Verbindungsgetrennt- und Sitzungs-Ladefehlermeldungen erscheinen im Kontext-Untermenü.
- Provider-Nutzung und Nutzungskosten-Details bleiben auf Stammebene unterhalb von „Kontext“, sodass sie ohne Öffnen des Untermenüs auf einen Blick sichtbar bleiben.

## Statuszeilentext (Menü)

- Während Arbeit aktiv ist: `<Session role> · <activity label>`
  - Beispiele: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Im Leerlauf: fällt auf die Integritätszusammenfassung zurück.

## Ereignisaufnahme

- Quelle: Control-Channel-`agent`-Ereignisse (`ControlChannel.handleAgentEvent`).
- Geparste Felder:
  - `stream: "job"` mit `data.state` für Start/Stopp.
  - `stream: "tool"` mit `data.phase`, `name`, optional `meta`/`args`.
- Beschriftungen:
  - `exec`: erste Zeile von `args.command`.
  - `read`/`write`: gekürzter Pfad.
  - `edit`: Pfad plus aus `meta`/Diff-Zählungen abgeleitete Änderungsart.
  - Fallback: Tool-Name.

## Debug-Überschreibung

- Einstellungen ▸ Debug ▸ Auswahl „Icon-Überschreibung“:
  - `System (auto)` (Standard)
  - `Working: main` (pro Tool-Art)
  - `Working: other` (pro Tool-Art)
  - `Idle`
- Gespeichert über `@AppStorage("iconOverride")`; zugeordnet zu `IconState.overridden`.

## Testcheckliste

- Job der Hauptsitzung auslösen: Prüfen Sie, dass das Icon sofort wechselt und die Statuszeile die Hauptbeschriftung anzeigt.
- Job einer Nicht-Hauptsitzung auslösen, während `main` im Leerlauf ist: Icon/Status zeigt die Nicht-Hauptsitzung an; bleibt stabil, bis sie beendet ist.
- `main` starten, während eine andere Sitzung aktiv ist: Icon wechselt sofort zu `main`.
- Schnelle Tool-Serien: Sicherstellen, dass das Abzeichen nicht flackert (TTL-Toleranz bei Tool-Ergebnissen).
- Integritätszeile erscheint wieder, sobald alle Sitzungen im Leerlauf sind.

## Verwandt

- [macOS-App](/de/platforms/macos)
- [Menüleisten-Icon](/de/platforms/mac/icon)
