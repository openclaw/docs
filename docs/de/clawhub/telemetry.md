---
read_when:
    - Arbeiten an Telemetrie-/Datenschutzkontrollen
    - Fragen dazu, welche Daten erfasst werden
summary: Installations-Telemetrie, die über `clawhub sync` erfasst wird, + Opt-out.
x-i18n:
    generated_at: "2026-05-12T12:54:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetrie

ClawHub verwendet **minimale Telemetrie**, um **Installationszahlen** zu berechnen (was tatsächlich genutzt wird) und bessere Sortierung/Filterung zu ermöglichen.
Dies basiert auf dem CLI-Befehl `clawhub sync`.

## Wann Telemetrie erfasst wird

Telemetrie wird nur gesendet, wenn:

- Sie in der CLI **angemeldet** sind (für Sync-/Veröffentlichungsabläufe verlangen wir ohnehin Authentifizierung).
- Sie `clawhub sync` ausführen.
- Telemetrie **nicht deaktiviert** ist (siehe „Deaktivieren“ unten).

Wenn Sie nicht angemeldet sind, wird nichts gemeldet.

## Was wir erfassen

Bei jedem `clawhub sync` meldet die CLI einen **vollständigen Snapshot** dessen, was sie gefunden hat, gruppiert nach Scan-Root („Ordner/Root“).

Für jeden Root speichern wir:

- `rootId`: ein **SHA-256-Hash** des kanonischen Root-Pfads (der Server sieht den Rohpfad nie).
- `label`: eine menschenlesbare Bezeichnung, die aus den letzten beiden Pfadsegmenten abgeleitet wird (Home-Pfade werden mit `~` angezeigt).
- `firstSeenAt`, `lastSeenAt`, optional `expiredAt`.

Für jeden unter einem Root gefundenen Skill speichern wir:

- `skillId` (über den Slug aufgelöst; nur Skills, die in der Registry existieren, werden verfolgt).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (nach bestem Aufwand; derzeit die zur Registry passende Version, falls bekannt).
- optional `removedAt`, wenn eine zuvor gemeldete Installation aus einem Root verschwindet.

### Was wir _nicht_ erfassen

- Keine rohen absoluten Ordnerpfade (nur gehashte `rootId` + eine kurze Anzeigenbezeichnung).
- Keine Dateiinhalte.
- Keine Pro-Lauf-Protokolle, Prompts oder andere CLI-Ausgaben.
- Keine Nachverfolgung für Skills, die nicht in die Registry hochgeladen wurden (unbekannte Slugs werden ignoriert).

## Installationszahlen

Wir führen zwei Zähler pro Skill:

- `installsCurrent`: eindeutige Benutzer, die den Skill derzeit in mindestens einem aktiven Root installiert haben.
- `installsAllTime`: eindeutige Benutzer, die den Skill jemals als installiert gemeldet haben.

### Mehrere Roots

Wenn Sie aus mehreren Ordnern synchronisieren, behandeln wir jeden Scan-Root unabhängig. Ein Skill gilt als „derzeit installiert“, wenn er in **einem beliebigen** aktiven Root vorhanden ist.

### Erkennung von Deinstallationen

Da `sync` die vollständige Menge pro Root meldet:

- Wenn ein Skill beim nächsten Sync aus einem Root verschwindet, markieren wir ihn für diesen Root als entfernt.
- Wenn der Skill aus allen Ihren Roots entfernt wird, zählt er nicht mehr zu `installsCurrent`.
- `installsAllTime` sinkt nie, es sei denn, Sie löschen Telemetrie (siehe unten).

### Veraltung (120 Tage)

Roots, die **120 Tage** lang keine Telemetrie melden, werden als veraltet markiert, und ihre Installationen zählen nicht mehr zu `installsCurrent`.
Dies wird träge ausgewertet (beim nächsten Telemetriebericht), um Hintergrundjobs zu vermeiden.

## Transparenz + Benutzerkontrollen

ClawHub stellt auf Ihrem eigenen Profil einen privaten Tab „Installiert“ bereit:

- Zeigt die exakten Roots + installierten Skills, die wir speichern.
- Enthält eine **JSON-Export**-Ansicht.
- Enthält eine Aktion **Telemetrie löschen**, um alle gespeicherten Telemetriedaten für Ihr Konto zu entfernen.

Alle anderen sehen nur **aggregierte Installationszähler**; niemand sonst kann Ihre Roots/Ordner sehen.

Wenn Sie Ihr Konto löschen, werden auch Ihre Telemetriedaten gelöscht.

## Telemetrie deaktivieren

Setzen Sie die Umgebungsvariable:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Wenn diese gesetzt ist, sendet die CLI während `clawhub sync` keine Telemetrie.
