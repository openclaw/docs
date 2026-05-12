---
read_when:
    - Arbeiten an Telemetrie- und Datenschutzkontrollen
    - Fragen dazu, welche Daten erhoben werden
summary: Installations-Telemetrie, erfasst über `clawhub sync` + Opt-out.
x-i18n:
    generated_at: "2026-05-12T08:44:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetrie

ClawHub verwendet **minimale Telemetrie**, um **Installationszahlen** zu berechnen (was tatsächlich verwendet wird) und eine bessere Sortierung/Filterung zu ermöglichen.
Dies basiert auf dem CLI-Befehl `clawhub sync`.

## Wann Telemetrie erfasst wird

Telemetrie wird nur gesendet, wenn:

- Sie in der CLI **angemeldet** sind (wir verlangen Authentifizierung bereits für Synchronisierungs-/Veröffentlichungsabläufe).
- Sie `clawhub sync` ausführen.
- Telemetrie **nicht deaktiviert** ist (siehe „So deaktivieren Sie Telemetrie“ unten).

Wenn Sie nicht angemeldet sind, wird nichts gemeldet.

## Was wir erfassen

Bei jedem `clawhub sync` meldet die CLI einen **vollständigen Snapshot** dessen, was sie gefunden hat, gruppiert nach Scan-Root („Ordner/Root“).

Für jeden Root speichern wir:

- `rootId`: ein **SHA-256-Hash** des kanonischen Root-Pfads (der Server sieht niemals den Rohpfad).
- `label`: eine menschenlesbare Bezeichnung, abgeleitet aus den letzten beiden Pfadsegmenten (Home-Pfade werden mit `~` angezeigt).
- `firstSeenAt`, `lastSeenAt`, optional `expiredAt`.

Für jeden unter einem Root gefundenen Skill speichern wir:

- `skillId` (über den Slug aufgelöst; nur Skills, die in der Registry existieren, werden verfolgt).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (nach bestem Aufwand; derzeit die mit der Registry abgeglichene Version, falls bekannt).
- optional `removedAt`, wenn eine zuvor gemeldete Installation aus einem Root verschwindet.

### Was wir _nicht_ erfassen

- Keine rohen absoluten Ordnerpfade (nur gehashte `rootId` + eine kurze Anzeigebezeichnung).
- Keine Dateiinhalte.
- Keine Logs einzelner Läufe, Prompts oder andere CLI-Ausgaben.
- Kein Tracking für Skills, die nicht in die Registry hochgeladen wurden (unbekannte Slugs werden ignoriert).

## Installationszahlen

Wir pflegen zwei Zähler pro Skill:

- `installsCurrent`: eindeutige Benutzer, die den Skill derzeit in mindestens einem aktiven Root installiert haben.
- `installsAllTime`: eindeutige Benutzer, die den Skill jemals als installiert gemeldet haben.

### Mehrere Roots

Wenn Sie aus mehreren Ordnern synchronisieren, behandeln wir jeden Scan-Root unabhängig. Ein Skill gilt als „derzeit installiert“, wenn er in **irgendeinem** aktiven Root vorhanden ist.

### Erkennung von Deinstallationen

Da `sync` den vollständigen Satz pro Root meldet:

- Wenn ein Skill beim nächsten Sync aus einem Root verschwindet, markieren wir ihn für diesen Root als entfernt.
- Wenn der Skill aus all Ihren Roots entfernt wurde, zählt er nicht mehr zu `installsCurrent`.
- `installsAllTime` sinkt nie, es sei denn, Sie löschen Telemetrie (siehe unten).

### Veraltung (120 Tage)

Roots, die **120 Tage** lang keine Telemetrie melden, werden als veraltet markiert, und ihre Installationen zählen nicht mehr zu `installsCurrent`.
Dies wird verzögert ausgewertet (beim nächsten Telemetriebericht), um Hintergrundjobs zu vermeiden.

## Transparenz + Benutzerkontrollen

ClawHub stellt einen privaten Tab „Installiert“ in Ihrem eigenen Profil bereit:

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
