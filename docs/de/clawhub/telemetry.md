---
read_when:
    - Arbeiten an Telemetrie-/Datenschutzkontrollen
    - Fragen dazu, welche Daten erhoben werden
summary: Installations-Telemetrie, die über `clawhub sync` erfasst wird, + Widerspruchsmöglichkeit.
x-i18n:
    generated_at: "2026-05-13T04:18:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetrie

ClawHub verwendet **minimale Telemetrie**, um **Installationszahlen** zu berechnen (was tatsächlich verwendet wird) und bessere Sortierung/Filterung zu ermöglichen.
Dies basiert auf dem CLI-Befehl `clawhub sync`.

## Wann Telemetrie erfasst wird

Telemetrie wird nur gesendet, wenn:

- Sie in der CLI **angemeldet** sind (für Sync-/Publish-Flows setzen wir Authentifizierung bereits voraus).
- Sie `clawhub sync` ausführen.
- Telemetrie **nicht deaktiviert** ist (siehe „So deaktivieren Sie Telemetrie“ unten).

Wenn Sie nicht angemeldet sind, wird nichts gemeldet.

## Was wir erfassen

Bei jedem `clawhub sync` meldet die CLI eine **vollständige Momentaufnahme** dessen, was sie gefunden hat, gruppiert nach Scan-Root („Ordner/Root“).

Für jede Root speichern wir:

- `rootId`: ein **SHA-256-Hash** des kanonischen Root-Pfads (der Server sieht niemals den unverarbeiteten Pfad).
- `label`: eine menschenlesbare Bezeichnung, die aus den letzten beiden Pfadsegmenten abgeleitet wird (Home-Pfade werden mit `~` angezeigt).
- `firstSeenAt`, `lastSeenAt`, optional `expiredAt`.

Für jeden unter einer Root gefundenen Skill speichern wir:

- `skillId` (per Slug aufgelöst; nur Skills, die in der Registry vorhanden sind, werden verfolgt).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (bestmöglich; derzeit die in der Registry gefundene Version, sofern bekannt).
- optional `removedAt`, wenn eine zuvor gemeldete Installation aus einer Root verschwindet.

### Was wir _nicht_ erfassen

- Keine unverarbeiteten absoluten Ordnerpfade (nur gehashte `rootId` + eine kurze Anzeigebezeichnung).
- Keine Dateiinhalte.
- Keine Logs pro Ausführung, Prompts oder andere CLI-Ausgabe.
- Kein Tracking für Skills, die nicht in die Registry hochgeladen wurden (unbekannte Slugs werden ignoriert).

## Installationszahlen

Wir pflegen zwei Zähler pro Skill:

- `installsCurrent`: eindeutige Benutzer, die den Skill derzeit in mindestens einer aktiven Root installiert haben.
- `installsAllTime`: eindeutige Benutzer, die jemals gemeldet haben, dass der Skill installiert ist.

### Mehrere Roots

Wenn Sie aus mehreren Ordnern synchronisieren, behandeln wir jede Scan-Root unabhängig. Ein Skill gilt als „derzeit installiert“, wenn er in **irgendeiner** aktiven Root vorhanden ist.

### Deinstallationserkennung

Da `sync` den vollständigen Satz pro Root meldet:

- Wenn ein Skill bei der nächsten Synchronisierung aus einer Root verschwindet, markieren wir ihn für diese Root als entfernt.
- Wenn der Skill aus allen Ihren Roots entfernt wurde, zählt er nicht mehr zu `installsCurrent`.
- `installsAllTime` sinkt nie, es sei denn, Sie löschen Telemetrie (siehe unten).

### Veralterung (120 Tage)

Roots, die **120 Tage** lang keine Telemetrie melden, werden als veraltet markiert, und ihre Installationen zählen nicht mehr zu `installsCurrent`.
Dies wird verzögert ausgewertet (beim nächsten Telemetriebericht), um Hintergrundjobs zu vermeiden.

## Transparenz + Benutzerkontrollen

ClawHub stellt in Ihrem eigenen Profil einen privaten Tab „Installiert“ bereit:

- Zeigt die exakten Roots + installierten Skills, die wir speichern.
- Enthält eine Ansicht für den **JSON-Export**.
- Enthält eine Aktion **Telemetrie löschen**, um alle gespeicherten Telemetriedaten für Ihr Konto zu entfernen.

Alle anderen sehen nur **aggregierte Installationszähler**; niemand sonst kann Ihre Roots/Ordner sehen.

Wenn Sie Ihr Konto löschen, werden auch Ihre Telemetriedaten gelöscht.

## So deaktivieren Sie Telemetrie

Setzen Sie die Umgebungsvariable:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Wenn dies gesetzt ist, sendet die CLI während `clawhub sync` keine Telemetrie.
