---
read_when:
    - Arbeiten an Telemetrie-/Datenschutzkontrollen
    - Fragen dazu, welche Daten erfasst werden
summary: Installationstelemetrie, die über `clawhub sync` erfasst wird, mit Abmeldemöglichkeit.
x-i18n:
    generated_at: "2026-05-13T05:33:26Z"
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

- Sie in der CLI **angemeldet** sind (wir verlangen Authentifizierung bereits für Sync-/Veröffentlichungsabläufe).
- Sie `clawhub sync` ausführen.
- Telemetrie **nicht deaktiviert** ist (siehe „Deaktivieren“ unten).

Wenn Sie nicht angemeldet sind, wird nichts gemeldet.

## Was wir erfassen

Bei jedem `clawhub sync` meldet die CLI eine **vollständige Momentaufnahme** dessen, was sie gefunden hat, gruppiert nach Scan-Root („Ordner/Root“).

Für jede Root speichern wir:

- `rootId`: einen **SHA-256-Hash** des kanonischen Root-Pfads (der Server sieht niemals den Rohpfad).
- `label`: eine menschenlesbare Bezeichnung, die aus den letzten beiden Pfadsegmenten abgeleitet wird (Home-Pfade werden mit `~` angezeigt).
- `firstSeenAt`, `lastSeenAt`, optional `expiredAt`.

Für jeden Skill, der unter einer Root gefunden wird, speichern wir:

- `skillId` (über Slug aufgelöst; nur Skills, die in der Registry vorhanden sind, werden nachverfolgt).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (nach bestem Wissen; derzeit die mit der Registry abgeglichene Version, falls bekannt).
- optional `removedAt`, wenn eine zuvor gemeldete Installation aus einer Root verschwindet.

### Was wir _nicht_ erfassen

- Keine rohen absoluten Ordnerpfade (nur gehashte `rootId` + eine kurze Anzeige-Bezeichnung).
- Keine Dateiinhalte.
- Keine Protokolle einzelner Läufe, Prompts oder andere CLI-Ausgaben.
- Keine Nachverfolgung für Skills, die nicht in die Registry hochgeladen wurden (unbekannte Slugs werden ignoriert).

## Installationszahlen

Wir pflegen zwei Zähler pro Skill:

- `installsCurrent`: eindeutige Nutzer, die den Skill derzeit in mindestens einer aktiven Root installiert haben.
- `installsAllTime`: eindeutige Nutzer, die den Skill jemals als installiert gemeldet haben.

### Mehrere Roots

Wenn Sie aus mehreren Ordnern synchronisieren, behandeln wir jede Scan-Root unabhängig. Ein Skill gilt als „derzeit installiert“, wenn er in **irgendeiner** aktiven Root vorhanden ist.

### Erkennung von Deinstallationen

Da `sync` die vollständige Menge pro Root meldet:

- Wenn ein Skill bei der nächsten Synchronisierung aus einer Root verschwindet, markieren wir ihn für diese Root als entfernt.
- Wenn der Skill aus all Ihren Roots entfernt wird, zählt er nicht mehr zu `installsCurrent`.
- `installsAllTime` sinkt nie, es sei denn, Sie löschen Telemetrie (siehe unten).

### Veraltete Daten (120 Tage)

Roots, die **120 Tage** lang keine Telemetrie melden, werden als veraltet markiert, und ihre Installationen zählen nicht mehr zu `installsCurrent`.
Dies wird verzögert ausgewertet (beim nächsten Telemetriebericht), um Hintergrundaufgaben zu vermeiden.

## Transparenz + Nutzerkontrollen

ClawHub stellt einen privaten Tab „Installiert“ in Ihrem eigenen Profil bereit:

- Zeigt die exakten Roots + installierten Skills, die wir speichern.
- Enthält eine Ansicht für **JSON-Export**.
- Enthält eine Aktion **Telemetrie löschen**, um alle gespeicherten Telemetriedaten für Ihr Konto zu entfernen.

Alle anderen sehen nur **aggregierte Installationszähler**; niemand sonst kann Ihre Roots/Ordner sehen.

Wenn Sie Ihr Konto löschen, werden auch Ihre Telemetriedaten gelöscht.

## Telemetrie deaktivieren

Setzen Sie die Umgebungsvariable:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Wenn diese gesetzt ist, sendet die CLI während `clawhub sync` keine Telemetrie.
