---
read_when:
    - Mac-Menüoberfläche oder Statuslogik anpassen
summary: Statuslogik der Menüleiste und welche Informationen Benutzern angezeigt werden
title: Menüleiste
x-i18n:
    generated_at: "2026-05-06T06:56:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: c569ced20b2f6a639d52d373cc8b55a42d7c015a0b234d5154ce67ac03c2eaf6
    source_path: platforms/mac/menu-bar.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## Was angezeigt wird

- Wir zeigen den aktuellen Arbeitszustand des Agenten im Menüleisten-Icon und in der ersten Statuszeile des Menüs an.
- Der Health-Status wird ausgeblendet, während Arbeit aktiv ist; er kehrt zurück, wenn alle Sitzungen inaktiv sind.
- Ein Root-Untermenü „Kontext“ enthält aktuelle Sitzungen, statt sie direkt im Root-Menü aufzuklappen.
- Der Block „Nodes“ im Root-Menü listet nur **Geräte** auf (gekoppelte Nodes über `node.list`), keine Client-/Präsenz-Einträge.
- Ein Root-Abschnitt „Nutzung“ erscheint unter Kontext, wenn Provider-Nutzungs-Snapshots verfügbar sind, gefolgt von Nutzungskosten-Details, wenn verfügbar.

## Zustandsmodell

- Sitzungen: Ereignisse kommen mit `runId` (pro Lauf) plus `sessionKey` in der Payload an. Die „Haupt“-Sitzung ist der Schlüssel `main`; falls er fehlt, greifen wir auf die zuletzt aktualisierte Sitzung zurück.
- Priorität: Haupt gewinnt immer. Wenn Haupt aktiv ist, wird ihr Zustand sofort angezeigt. Wenn Haupt inaktiv ist, wird die zuletzt aktive Nicht-Haupt-Sitzung angezeigt. Wir wechseln nicht mitten in der Aktivität hin und her; wir wechseln nur, wenn die aktuelle Sitzung inaktiv wird oder Haupt aktiv wird.
- Aktivitätsarten:
  - `job`: Ausführung eines High-Level-Befehls (`state: started|streaming|done|error`).
  - `tool`: `phase: start|result` mit `toolName` und `meta/args`.

## IconState-Enum (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (Debug-Override)

### ActivityKind → Glyph

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- Standard → 🛠️

### Visuelle Zuordnung

- `idle`: normales Tierchen.
- `workingMain`: Badge mit Glyph, vollständige Tönung, „Working“-Beinanimation.
- `workingOther`: Badge mit Glyph, gedämpfte Tönung, kein Huschen.
- `overridden`: verwendet unabhängig von der Aktivität den gewählten Glyph/die gewählte Tönung.

## Kontext-Untermenü

- Das Root-Menü zeigt eine Zeile „Kontext“ mit Sitzungsanzahl/-status und öffnet ein Untermenü.
- Die Kopfzeile des Kontext-Untermenüs zeigt die Anzahl aktiver Sitzungen der letzten 24 Stunden.
- Jede Sitzungszeile behält ihre Token-Leiste, ihr Alter, ihre Vorschau, Denken/ausführlich sowie die Aktionen Zurücksetzen, Komprimieren und Löschen.
- Lade-, Getrennt- und Sitzungslade-Fehlermeldungen erscheinen im Kontext-Untermenü.
- Provider-Nutzung und Nutzungskosten-Details bleiben auf Root-Ebene unter Kontext, damit sie ohne Öffnen des Untermenüs auf einen Blick sichtbar bleiben.

## Statuszeilentext (Menü)

- Während Arbeit aktiv ist: `<Session role> · <activity label>`
  - Beispiele: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Im inaktiven Zustand: fällt auf die Health-Zusammenfassung zurück.

## Ereignisaufnahme

- Quelle: Control-Channel-`agent`-Ereignisse (`ControlChannel.handleAgentEvent`).
- Geparste Felder:
  - `stream: "job"` mit `data.state` für Start/Stopp.
  - `stream: "tool"` mit `data.phase`, `name`, optional `meta`/`args`.
- Labels:
  - `exec`: erste Zeile von `args.command`.
  - `read`/`write`: gekürzter Pfad.
  - `edit`: Pfad plus aus `meta`/Diff-Zählwerten abgeleitete Änderungsart.
  - Fallback: Tool-Name.

## Debug-Override

- Einstellungen ▸ Debug ▸ Auswahl „Icon-Override“:
  - `System (auto)` (Standard)
  - `Working: main` (pro Tool-Art)
  - `Working: other` (pro Tool-Art)
  - `Idle`
- Gespeichert über `@AppStorage("iconOverride")`; zugeordnet zu `IconState.overridden`.

## Test-Checkliste

- Hauptsitzungs-Job auslösen: prüfen, dass das Icon sofort wechselt und die Statuszeile das Haupt-Label anzeigt.
- Nicht-Haupt-Sitzungs-Job auslösen, während Haupt inaktiv ist: Icon/Status zeigt Nicht-Haupt an; bleibt stabil, bis er abgeschlossen ist.
- Haupt starten, während Andere aktiv ist: Icon wechselt sofort zu Haupt.
- Schnelle Tool-Bursts: sicherstellen, dass das Badge nicht flackert (TTL-Kulanz bei Tool-Ergebnissen).
- Health-Zeile erscheint wieder, sobald alle Sitzungen inaktiv sind.

## Verwandt

- [macOS-App](/de/platforms/macos)
- [Menüleisten-Icon](/de/platforms/mac/icon)
