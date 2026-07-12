---
read_when:
    - Sie möchten in der Control UI eine Tageszeitleiste im Stil von Dayflow.
    - Sie aktivieren oder konfigurieren das mitgelieferte Logbook-Plugin
    - Sie möchten Stand-up-Zusammenfassungen oder einen Tagesrückblick auf Grundlage der Bildschirmaktivität.
summary: Optionales automatisches Arbeitsjournal, das aus regelmäßigen Bildschirmaufnahmen erstellt wird
title: Logbuch-Plugin
x-i18n:
    generated_at: "2026-07-12T15:42:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a3ea1d40d62041417d047fbaf6b02aeb86e76314b8f620f7b9939e2e0c3b9f7e
    source_path: plugins/logbook.md
    workflow: 16
---

Das Logbook-Plugin verwandelt Bildschirmaktivitäten in ein automatisches Arbeitsjournal. Es
erfasst regelmäßig Bildschirmaufnahmen von einem gekoppelten Node, fasst sie zu
Beobachtungen mit Zeitstempeln zusammen und erstellt Zeitleistenkarten in der
[Control UI](/de/web/control-ui). Es kann außerdem tägliche Stand-up-Notizen erstellen und
Fragen zu einem erfassten Tag beantworten.

Der OpenClaw-eigene Zustand verbleibt auf dem Gateway unter `<state-dir>/logbook/`, die
Modellverarbeitung erfolgt jedoch nicht zwingend lokal. Ausgewählte Bildschirmaufnahmen werden an die
konfigurierte Vision-Route gesendet; Beobachtungen und Zeitleistentext werden an das standardmäßige
Agentenmodell gesendet. Verwenden Sie für beide Phasen lokale Modellrouten, wenn Bildschirminhalte und
daraus abgeleitete Aktivitätstexte auf dem Rechner verbleiben müssen.

Logbook ist enthalten und standardmäßig deaktiviert. Durch Aktivieren des Plugins wird die
Bildschirmaufnahme für das Gateway eingeschaltet, da `captureEnabled` standardmäßig `true` ist.

## Bevor Sie beginnen

Sie benötigen:

- Einen verbundenen Node, der `screen.snapshot` oder `logbook.snapshot` bereitstellt. Der
  Node der macOS-App benötigt die Berechtigung für Bildschirmaufnahmen. Ein monitorloser macOS-Node-Host
  (`openclaw node host run`) erhält den vom Plugin bereitgestellten Befehl `logbook.snapshot`,
  der das Systemwerkzeug `screencapture` verwendet.
- Das enthaltene Codex-Plugin muss aktiviert und authentifiziert sein. Codex stellt derzeit
  den Vertrag zur strukturierten Bildextraktion bereit, den Logbook benötigt. Melden Sie sich mit
  `openclaw models auth login --provider openai` an; weitere Authentifizierungswege finden Sie unter
  [Codex-Harness](/de/plugins/codex-harness).
- Ein funktionierendes standardmäßiges Agentenmodell. Logbook verwendet es nach dem Vision-Durchlauf,
  um Karten, Stand-up-Notizen und Antworten auf Fragen zum Tag zu erzeugen.

## Schnellstart

Aktivieren Sie die Plugins Codex und Logbook:

```bash
openclaw plugins enable codex
openclaw plugins enable logbook
```

Konfigurieren Sie für einen deterministischen Start ein explizites Vision-Modell:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
      logbook: {
        enabled: true,
        config: {
          visionModel: "codex/gpt-5.6-sol",
        },
      },
    },
  },
}
```

Wenn Sie `plugins.allow` verwenden, nehmen Sie sowohl `codex` als auch `logbook` auf. Starten Sie das
Gateway nach Änderungen an der Plugin-Konfiguration neu, prüfen Sie anschließend die Registrierungen
und öffnen Sie das Dashboard:

```bash
openclaw gateway restart
openclaw plugins inspect logbook --runtime --json
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw dashboard
```

Die Node-Beschreibung muss `screen.snapshot` oder `logbook.snapshot` enthalten.
Monitorlose Nodes geben `logbook.snapshot` erst an, nachdem das Plugin aktiviert wurde.
Wenn der Befehl fehlt, lesen Sie [Fehlerbehebung für Nodes](/de/nodes/troubleshooting).

Der Logbook-Tab wird nur bei aktiviertem Plugin und einer Control-UI-Sitzung mit
`operator.write` angezeigt. In der Statuszeile sollte **Erfassung läuft** ohne Fehler stehen.
Eine Zeitleistenkarte erscheint, wenn das Analysefenster geschlossen wird. Alternativ können Sie
**Jetzt analysieren** auswählen, nachdem Aktivitäten erfasst wurden.

## Funktionsweise

1. **Erfassen**: Alle `captureIntervalSeconds` (standardmäßig 30s) ruft Logbook
   den Aufnahmebefehl des ausgewählten Nodes auf und speichert ein skaliertes JPEG-Bild.
   Aufeinanderfolgende identische Bilder werden als inaktiv markiert und von der Analyse ausgeschlossen.
2. **Beobachten**: Sobald ein Analysefenster (standardmäßig 15 Minuten) verstrichen ist,
   wählt das Plugin bis zu 16 aktive Bilder aus und sendet sie an das Vision-Modell,
   das Aktivitätsbeobachtungen mit Zeitstempeln zurückgibt („VS Code: Bearbeiten von
   store.ts, Beheben eines Typfehlers“). Eine Aufnahmelücke von mehr als zwei Minuten oder
   die lokale Mitternacht schließt ebenfalls das aktuelle Fenster.
3. **Synthetisieren**: Die Beobachtungen und die vorhandenen Karten der letzten 45 Minuten werden
   zu Zeitleistenkarten (jeweils 10-60 Minuten) mit Titel, Zusammenfassung,
   Kategorie, Haupt-App und kurzen Ablenkungen überarbeitet.
4. **Bereinigen**: Bilder, die älter als `retentionDays` (standardmäßig 14) sind, werden gelöscht.
   Karten, Beobachtungen und zwischengespeicherte Stand-ups bleiben erhalten.

Tagesgrenzen und Zeitleistenuhren verwenden die lokale Zeitzone des Gateways, nicht die
Zeitzone des Browsers. Bilder und die SQLite-Zeitleistendatenbank befinden sich unter
`<state-dir>/logbook/`.

## Modell- und Datenfluss

Logbook verwendet zwei separate Modellrouten:

| Phase              | Gesendete Daten                                            | Modellroute                                                        |
| ------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------ |
| Beobachten         | Bis zu 16 ausgewählte JPEG-Bilder und ihre Aufnahmezeiten  | `visionModel` oder ein kompatibler übernommener Codex-Eintrag unter `tools.media` |
| Karten synthetisieren | Beobachtungen mit Zeitstempeln und aktuelle Zeitleistenkarten | Standardmäßiges Agentenmodell über die LLM-Laufzeit des Plugins |
| Stand-up erstellen | Karten für den ausgewählten und den vorherigen Tag         | Standardmäßiges Agentenmodell über die LLM-Laufzeit des Plugins    |
| Ihren Tag abfragen | Die Frage, Karten des ausgewählten Tages und aktuelle Beobachtungen | Standardmäßiges Agentenmodell über die LLM-Laufzeit des Plugins |

Die vollständige SQLite-Datenbank wird an keines der Modelle gesendet. Unverarbeitete Bildschirmaufnahmen werden nur
an die Beobachtungsphase gesendet; Kartensynthese, Stand-up und Fragen und Antworten erhalten daraus abgeleiteten
Text.

## Konfiguration

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
      logbook: {
        enabled: true,
        config: {
          captureEnabled: true,
          captureIntervalSeconds: 30,
          analysisIntervalMinutes: 15,
          nodeId: "my-mac",
          screenIndex: 0,
          maxWidth: 1440,
          visionModel: "codex/gpt-5.6-sol",
          retentionDays: 14,
        },
      },
    },
  },
}
```

Alle Logbook-Konfigurationsschlüssel sind optional. Numerische Werte werden auf Ganzzahlen gerundet
und auf den unterstützten Bereich begrenzt.

| Schlüssel                  | Standardwert | Bereich oder Werte       | Verhalten                                                                                      |
| -------------------------- | ------------ | ------------------------ | ---------------------------------------------------------------------------------------------- |
| `captureEnabled`           | `true`       | boolescher Wert          | Dauerhafter Hauptschalter für neue Aufnahmen; die Zeitleiste bleibt bei `false` verfügbar       |
| `captureIntervalSeconds`   | `30`         | `5`-`600`                | Verzögerung zwischen Aufnahmeversuchen                                                         |
| `analysisIntervalMinutes`  | `15`         | `3`-`120`                | Angestrebtes Beobachtungsfenster; Lücken und Mitternacht können es früher schließen             |
| `nodeId`                   | nicht gesetzt | Node-ID oder Anzeigename | Bindet die Aufnahme an einen verbundenen Node; beim Abgleich wird die Groß-/Kleinschreibung ignoriert |
| `screenIndex`              | `0`          | `0`-`16`                 | Nullbasierter Bildschirmindex                                                                  |
| `maxWidth`                 | `1440`       | `480`-`3840`             | Angeforderte Obergrenze der Aufnahmegröße; monitorloses macOS wendet sie auf die größte Abmessung an |
| `visionModel`              | nicht gesetzt | `provider/model`         | Explizite strukturierte Route; fehlerhafte Referenzen pausieren die Analyse, nicht unterstützte Provider lassen Stapel fehlschlagen |
| `retentionDays`            | `14`         | `1`-`365`                | Löscht alte Bilder; Karten, Beobachtungen und Stand-ups bleiben erhalten                        |

Ohne `nodeId` bevorzugt Logbook einen verbundenen App-Node, der
`screen.snapshot` bereitstellt, und weicht anschließend auf einen monitorlosen Node mit
`logbook.snapshot` aus. In einer nicht gebundenen Konfiguration wird ein fehlgeschlagener Node hinter andere
geeignete Nodes verschoben. Der Pausenschalter im Dashboard gilt nur für die Sitzung und wird beim
Neustart des Gateways zurückgesetzt; verwenden Sie `captureEnabled: false` für einen dauerhaften Stopp.

### Auswahl des Vision-Modells

Logbook bestimmt das Beobachtungsmodell in dieser Reihenfolge:

1. `plugins.entries.logbook.config.visionModel`
2. der erste bildfähige Codex-Eintrag unter `tools.media.image.models`
3. der erste bildfähige Codex-Eintrag unter `tools.media.models`

Andere Medien-Provider werden übersprungen, da sie derzeit nicht den
Vertrag zur strukturierten Extraktion bereitstellen, den Logbook benötigt. Durch Festlegen von
`tools.media.image.enabled: false` werden übernommene Medienstandardwerte deaktiviert, ein
explizites Logbook-`visionModel` gilt jedoch weiterhin.

## Dashboard-Tab

- **Zeitleiste**: aufklappbare Karten pro Aktivität mit Kategoriefarben, der Haupt-App,
  Ablenkungsmarkierungen und einem Schlüsselbild der Aufnahme.
- **Der Tag auf einen Blick**: Fokusanteil, Aufschlüsselung nach Kategorien, meistgenutzte Apps.
- **Tägliches Stand-up**: verwandelt gestern und heute in eine direkt einfügbare Aktualisierung.
- **Ihren Tag abfragen**: natürlichsprachliche Fragen, die anhand der erfassten
  Zeitleiste beantwortet werden („Wann habe ich den Gateway-PR geprüft?“).
- **Jetzt analysieren**: schließt das aktuelle Aufnahmefenster sofort, anstatt
  auf das Analyseintervall zu warten.

## Gateway-Methoden

Logbook registriert diese Gateway-RPC-Methoden:

| Methode               | Parameter                | Berechtigungsumfang | Ergebnis                                                                      |
| --------------------- | ------------------------ | ------------------- | ----------------------------------------------------------------------------- |
| `logbook.status`      | keine                    | `operator.read`     | Status von Erfassung, Analyse, Modell, Node, Gateway-Tag und Gateway-Zeitzone |
| `logbook.days`        | keine                    | `operator.read`     | Tage mit Anzahlen der Zeitleistenkarten und Zeitgrenzen der Karten            |
| `logbook.timeline`    | `{ day?: "YYYY-MM-DD" }` | `operator.read`     | Abgeleitete Karten und Tagesstatistiken; standardmäßig der aktuelle Tag des Gateways |
| `logbook.frames`      | `{ startMs, endMs }`     | `operator.write`    | Bildmetadaten im angeforderten Bereich in Epoch-Millisekunden                  |
| `logbook.frame`       | `{ frameId }`            | `operator.write`    | Ein unverarbeitetes JPEG-Bild als base64                                       |
| `logbook.standup`     | `{ day?, refresh? }`     | `operator.write`    | Zwischengespeicherter oder neu erzeugter Stand-up-Text für einen Tag           |
| `logbook.ask`         | `{ day?, question }`     | `operator.write`    | Auf der Zeitleiste basierende Antwort für einen Tag                            |
| `logbook.capture.set` | `{ paused }`             | `operator.write`    | Nur für die Sitzung geltender Pausenstatus und aktualisierter Status           |
| `logbook.analyze.now` | keine                    | `operator.write`    | Startet die ausstehende Analyse oder gibt einen Grund zurück, warum sie nicht gestartet werden konnte |

Die Lesemethoden geben den Betriebszustand oder abgeleiteten Text zurück. Unverarbeitete
Bildschirmpixel, Aktionen mit Modellkosten und Laufzeitänderungen erfordern
`operator.write`. Der Control-UI-Tab erfordert ebenfalls `operator.write`, da er
diese Aktionen und Vorschauen unverarbeiteter Bilder bereitstellt; ein schreibgeschützter Client kann die
Methoden für abgeleiteten Text weiterhin direkt aufrufen.

## Datenschutzhinweise

- Aufnahmen können alle Bildschirminhalte enthalten, einschließlich Geheimnissen. Bilder verlassen
  den Rechner ausschließlich als ausgewählte Eingabe für das konfigurierte Beobachtungsmodell.
- Beobachtungen, aktuelle Karten und Fragen können den Rechner während der
  Kartensynthese, Stand-up-Erstellung oder Fragen und Antworten über das standardmäßige Agentenmodell verlassen. Wenden Sie
  die Richtlinie des Providers zur Datenverarbeitung auf beide Modellrouten an.
- Verwenden Sie lokale Routen sowohl für das strukturierte Beobachtungsmodell als auch für das standardmäßige Agentenmodell,
  wenn Sie eine vollständig lokale Pipeline benötigen.
- Bilder, die Zeitleistendatenbank und temporäre Aufnahmen werden mit
  Dateiberechtigungen geschrieben, die ausschließlich dem Eigentümer Zugriff gewähren.
- Das Hinzufügen von `screen.snapshot` zu `gateway.nodes.denyCommands` ist der
  Notausschalter für Bildschirmaufnahmen: Es blockiert sowohl die Aufnahme durch App-Nodes als auch Logbooks eigenen
  Befehl `logbook.snapshot`.
- Das Festlegen von `tools.media.image.enabled: false` verhindert außerdem, dass Logbook
  Medienbildmodelle für die Analyse übernimmt; dann wird nur ein explizites `visionModel` in der
  Plugin-Konfiguration verwendet.

## Fehlerbehebung

### Der Logbook-Tab fehlt

Prüfen Sie alle drei Voraussetzungen:

1. `openclaw plugins list --enabled` enthält `logbook`.
2. Das Gateway wurde nach der Änderung am Plugin oder an der Zulassungsliste neu gestartet.
3. Die Control-UI-Verbindung verfügt über `operator.write`; schreibgeschützte Sitzungen erhalten
   den interaktiven Tab-Deskriptor nicht.

Wenn `plugins.allow` festgelegt ist, muss es für die empfohlene Konfiguration
sowohl `logbook` als auch `codex` enthalten.

### Erfassung meldet einen Fehler

```bash
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw logs --follow
```

- Vergewissern Sie sich, dass die Node `screen.snapshot` oder `logbook.snapshot` bereitstellt.
- Erteilen Sie auf dem für die Erfassung verwendeten Mac die Berechtigung zur Bildschirmaufnahme.
- Wenn `nodeId` konfiguriert ist, vergewissern Sie sich, dass sie mit der Node-ID oder dem Anzeigenamen übereinstimmt.
- Prüfen Sie, dass `gateway.nodes.denyCommands` nicht
  `screen.snapshot` enthält.

Nach drei aufeinanderfolgenden Fehlern pausiert Logbook für zehn Erfassungstakte
und versucht es anschließend erneut. Eine nicht fest zugewiesene Einrichtung kann zu einer anderen geeigneten Node wechseln.

### Erfassungen sind erfolgreich, aber es werden keine Karten angezeigt

- Der Status **Modell fehlt** bedeutet, dass keine kompatible Route für strukturierte
  Bildanalyse gefunden wurde. Aktivieren und authentifizieren Sie das Codex-Plugin oder legen Sie ein gültiges explizites
  `visionModel` fest. Erfasste Frames bleiben ausstehend, solange das Modell fehlt, und
  können analysiert werden, nachdem die Konfiguration korrigiert wurde.
- Warten Sie `analysisIntervalMinutes` ab oder wählen Sie **Jetzt analysieren**, nachdem Aktivität
  erfasst wurde.
- Aufeinanderfolgende identische Frames gelten als Inaktivitätsnachweis und werden nicht in
  Analysebatches aufgenommen. Ändern Sie vor dem Testen den sichtbaren Bildschirminhalt.
- Wenn der neueste Batch einen Fehler anzeigt, beheben Sie das Modell- oder Authentifizierungsproblem und wählen Sie
  **Jetzt analysieren**. Fehlgeschlagene Batches werden nur bei dieser ausdrücklichen Aktion erneut ausgeführt, um
  wiederholte Modellkosten zu vermeiden.

## Verwandte Themen

- [Plugins verwalten](/de/plugins/manage-plugins)
- [Codex-Harness](/de/plugins/codex-harness)
- [Medienverständnis](/de/nodes/media-understanding)
- [Nodes](/de/nodes)
- [Fehlerbehebung bei Nodes](/de/nodes/troubleshooting)
- [Steuerungs-UI](/de/web/control-ui)
