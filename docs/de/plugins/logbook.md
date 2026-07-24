---
read_when:
    - Sie möchten in der Control UI eine Zeitleiste Ihres Tages im Stil von Dayflow.
    - Sie aktivieren oder konfigurieren das mitgelieferte Logbook-Plugin
    - Sie möchten Stand-up-Zusammenfassungen oder Tagesrückblicke auf Grundlage der Bildschirmaktivität
summary: Optionales automatisches Arbeitsjournal, das aus regelmäßigen Bildschirmaufnahmen erstellt wird
title: Logbuch-Plugin
x-i18n:
    generated_at: "2026-07-24T05:05:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 19197e580421dfe81f82f8599578e4c68a15004813bb2b6c3de761c14f426b08
    source_path: plugins/logbook.md
    workflow: 16
---

Das Logbook-Plugin verwandelt Bildschirmaktivitäten in ein automatisches Arbeitsjournal. Es
erfasst regelmäßig Bildschirmaufnahmen von einer gekoppelten Node, fasst sie zu
Beobachtungen mit Zeitstempeln zusammen und erstellt Zeitleistenkarten in der
[Control UI](/de/web/control-ui). Es kann außerdem tägliche Standup-Notizen erstellen und
Fragen zu einem erfassten Tag beantworten.

Der OpenClaw-eigene Zustand verbleibt auf dem Gateway unter `<state-dir>/logbook/`, aber
die Modellverarbeitung erfolgt nicht unbedingt lokal. Ausgewählte Screenshots werden an die
konfigurierte Vision-Route gesendet; Beobachtungen und Zeitleistentext werden an das standardmäßige
Agentenmodell gesendet. Verwenden Sie für beide Phasen lokale Modellrouten, wenn Bildschirminhalte und
daraus abgeleiteter Aktivitätstext auf dem Rechner verbleiben müssen.

Logbook ist gebündelt und standardmäßig deaktiviert. Durch das Aktivieren des Plugins wird die
Bildschirmerfassung für das Gateway aktiviert, da `captureEnabled` standardmäßig auf `true` gesetzt ist.

## Vorbereitung

Sie benötigen:

- Eine verbundene Node, die `screen.snapshot` oder `logbook.snapshot` bereitstellt. Die
  macOS-App-Node benötigt die Berechtigung zur Bildschirmaufnahme. Ein headless macOS-Node-Host
  (`openclaw node host run`) erhält den vom Plugin bereitgestellten Befehl `logbook.snapshot`,
  der auf dem Systemwerkzeug `screencapture` basiert.
- Das gebündelte Codex-Plugin muss aktiviert und authentifiziert sein. Codex stellt derzeit
  den Vertrag zur strukturierten Bildextraktion bereit, den Logbook benötigt. Melden Sie sich mit
  `openclaw models auth login --provider openai` an; weitere Authentifizierungswege finden Sie unter
  [Codex-Harness](/de/plugins/codex-harness).
- Ein funktionsfähiges standardmäßiges Agentenmodell. Logbook verwendet es nach dem Vision-Durchlauf
  zur Erstellung von Karten, Standup-Notizen und Antworten auf Fragen zum Tag.

## Schnellstart

Aktivieren Sie die Codex- und Logbook-Plugins:

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

Wenn Sie `plugins.allow` verwenden, schließen Sie sowohl `codex` als auch `logbook` ein. Starten Sie das
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
Headless Nodes geben `logbook.snapshot` erst bekannt, nachdem das Plugin aktiviert wurde.
Wenn der Befehl fehlt, lesen Sie [Fehlerbehebung für Nodes](/de/nodes/troubleshooting).

Die Registerkarte „Logbook“ wird nur bei aktiviertem Plugin und einer Control-UI-Sitzung mit
`operator.write` angezeigt. Die Statuszeile sollte fehlerfrei **Erfassung läuft** anzeigen.
Eine Zeitleistenkarte erscheint, wenn das Analysefenster geschlossen wird. Alternativ können Sie
**Jetzt analysieren** auswählen, nachdem Aktivitäten erfasst wurden.

## Funktionsweise

1. **Erfassen**: Alle `captureIntervalSeconds` (standardmäßig 30s) ruft Logbook
   den Erfassungsbefehl der ausgewählten Node auf und speichert ein skaliertes JPEG-Bild.
   Aufeinanderfolgende identische Bilder werden als inaktiv markiert und von der Analyse ausgeschlossen.
2. **Beobachten**: Sobald ein Analysefenster (standardmäßig 15 Minuten) verstrichen ist,
   wählt das Plugin bis zu 16 aktive Bilder aus und sendet sie an das Vision-Modell.
   Dieses gibt Aktivitätsbeobachtungen mit Zeitstempeln zurück („VS Code: Bearbeitung von
   store.ts, Behebung eines Typfehlers“). Eine Erfassungslücke von mehr als zwei Minuten oder
   die lokale Mitternacht schließt ebenfalls das aktuelle Fenster.
3. **Synthetisieren**: Die Beobachtungen und die vorhandenen Karten der letzten 45 Minuten werden
   zu Zeitleistenkarten (jeweils 10-60 Minuten) mit Titel, Zusammenfassung,
   Kategorie, Haupt-App und etwaigen kurzen Ablenkungen überarbeitet.
4. **Bereinigen**: Bilder, die älter als `retentionDays` (standardmäßig 14) sind, werden gelöscht.
   Karten, Beobachtungen und zwischengespeicherte Standups bleiben erhalten.

Tagesgrenzen und Zeitleistenuhren verwenden die lokale Zeitzone des Gateways und nicht die
Zeitzone des Browsers. Bilder und die SQLite-Zeitleistendatenbank befinden sich unter
`<state-dir>/logbook/`.

## Modell- und Datenfluss

Logbook verwendet zwei separate Modellrouten:

| Phase              | Gesendete Daten                                            | Modellroute                                                        |
| ------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------ |
| Beobachten         | Bis zu 16 ausgewählte JPEG-Bilder und ihre Erfassungszeiten | `visionModel` oder ein kompatibler übernommener `tools.media`-Codex-Eintrag |
| Karten synthetisieren | Beobachtungen mit Zeitstempeln und aktuelle Zeitleistenkarten | Standardmäßiges Agentenmodell über die LLM-Laufzeit des Plugins    |
| Standup erstellen  | Karten für den ausgewählten und den vorherigen Tag         | Standardmäßiges Agentenmodell über die LLM-Laufzeit des Plugins    |
| Tag abfragen       | Frage, Karten des ausgewählten Tages und aktuelle Beobachtungen | Standardmäßiges Agentenmodell über die LLM-Laufzeit des Plugins    |

Die vollständige SQLite-Datenbank wird an keines der Modelle gesendet. Unbearbeitete Screenshots werden nur
an die Beobachtungsphase gesendet; Kartensynthese, Standup und Fragen und Antworten erhalten
abgeleiteten Text.

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

Alle Logbook-Konfigurationsschlüssel sind optional. Numerische Werte werden auf ganze Zahlen gerundet
und auf den unterstützten Bereich begrenzt.

| Schlüssel                 | Standardwert | Bereich oder Werte       | Verhalten                                                                                     |
| ------------------------- | ------------ | ------------------------ | --------------------------------------------------------------------------------------------- |
| `captureEnabled`        | `true` | boolescher Wert      | Dauerhafter Hauptschalter für neue Aufnahmen; die Zeitleiste bleibt verfügbar, wenn `false` |
| `captureIntervalSeconds`        | `30` | `5`-`600` | Verzögerung zwischen Erfassungsversuchen                                                      |
| `analysisIntervalMinutes`        | `15` | `3`-`120` | Zielzeitraum für Beobachtungen; Lücken und Mitternacht können ihn früher schließen            |
| `nodeId`        | nicht festgelegt | Node-ID oder Anzeigename | Bindet die Erfassung an eine verbundene Node; beim Abgleich wird Groß-/Kleinschreibung ignoriert |
| `screenIndex`        | `0` | `0`-`16` | Nullbasierter Bildschirmindex                                                                |
| `maxWidth`        | `1440` | `480`-`3840` | Angeforderte Obergrenze der Erfassungsgröße; headless macOS wendet sie auf die größte Abmessung an |
| `visionModel`        | nicht festgelegt | `provider/model`  | Explizite strukturierte Route; fehlerhafte Referenzen pausieren die Analyse, nicht unterstützte Provider lassen Stapel fehlschlagen |
| `retentionDays`        | `14` | `1`-`365` | Löscht alte Bilder; Karten, Beobachtungen und Standups bleiben erhalten                       |

Ohne `nodeId` bevorzugt Logbook eine verbundene App-Node, die
`screen.snapshot` bereitstellt, und greift anschließend auf eine headless Node zurück, die
`logbook.snapshot` bereitstellt. In einer nicht gebundenen Konfiguration wird eine ausgefallene Node
hinter anderen geeigneten Nodes eingereiht. Der Pausenschalter im Dashboard gilt nur für die Sitzung und wird
beim Neustart des Gateways zurückgesetzt; verwenden Sie `captureEnabled: false` für einen dauerhaften Stopp.

### Auswahl des Vision-Modells

Logbook ermittelt das Beobachtungsmodell in dieser Reihenfolge:

1. `plugins.entries.logbook.config.visionModel`
2. der erste bildfähige Codex-Eintrag unter `tools.media.models`

Andere Medien-Provider werden übersprungen, da sie derzeit nicht den
Vertrag zur strukturierten Extraktion bereitstellen, den Logbook benötigt. Das Festlegen von
`tools.media.image.enabled: false` deaktiviert übernommene Medienstandards, ein
explizites Logbook-`visionModel` gilt jedoch weiterhin.

## Dashboard-Registerkarte

- **Zeitleiste**: erweiterbare Karten pro Aktivität mit Kategoriefarben, der Haupt-App,
  Ablenkungskennzeichnungen und einem Schlüsselbild.
- **Tagesübersicht**: Fokusverhältnis, Aufschlüsselung nach Kategorien, meistgenutzte Apps.
- **Tägliches Standup**: Wandelt den gestrigen und den heutigen Tag in eine direkt einfügbare Aktualisierung um.
- **Tag abfragen**: Fragen in natürlicher Sprache, die anhand der erfassten
  Zeitleiste beantwortet werden („Wann habe ich den Gateway-PR geprüft?“).
- **Jetzt analysieren**: Schließt das aktuelle Erfassungsfenster sofort, statt
  auf das Analyseintervall zu warten.

## Gateway-Methoden

Logbook registriert die folgenden Gateway-RPC-Methoden:

| Methode               | Parameter                | Bereich          | Ergebnis                                                                 |
| --------------------- | ------------------------ | ---------------- | ------------------------------------------------------------------------ |
| `logbook.status`    | keine                    | `operator.read` | Status von Erfassung, Analyse, Modell, Node, Gateway-Tag und Gateway-Zeitzone |
| `logbook.days`    | keine                    | `operator.read` | Tage mit Anzahlen von Zeitleistenkarten und zeitlichen Kartengrenzen     |
| `logbook.timeline`    | `{ day?: "YYYY-MM-DD" }`       | `operator.read` | Abgeleitete Karten und Tagesstatistiken; standardmäßig der aktuelle Tag des Gateways |
| `logbook.frames`    | `{ startMs, endMs }`       | `operator.write` | Bildmetadaten im angeforderten Bereich in Epochenmillisekunden           |
| `logbook.frame`    | `{ frameId }`       | `operator.write` | Ein unbearbeitetes JPEG-Bild als base64                                  |
| `logbook.standup`    | `{ day?, refresh? }`       | `operator.write` | Zwischengespeicherter oder neu erstellter Standup-Text für einen Tag     |
| `logbook.ask`    | `{ day?, question }`       | `operator.write` | Auf der Zeitleiste basierende Antwort für einen Tag                      |
| `logbook.capture.set`    | `{ paused }`       | `operator.write` | Nur für die Sitzung geltender Pausenzustand und aktualisierter Status    |
| `logbook.analyze.now`    | keine                    | `operator.write` | Startet die ausstehende Analyse oder gibt einen Grund zurück, warum sie nicht gestartet werden konnte |

Die Lesemethoden geben den Betriebszustand oder abgeleiteten Text zurück. Unbearbeitete
Screenshot-Pixel, modellkostenverursachende Aktionen und Laufzeitmutationen erfordern
`operator.write`. Die Registerkarte der Control UI erfordert außerdem `operator.write`, da sie
diese Aktionen und Vorschauen unbearbeiteter Bilder bereitstellt; ein schreibgeschützter Client kann die
Methoden für abgeleiteten Text weiterhin direkt aufrufen.

## Datenschutzhinweise

- Snapshots können alles enthalten, was auf dem Bildschirm angezeigt wird, einschließlich Geheimnissen. Frames verlassen den Rechner nie, außer als ausgewählte Eingabe für das konfigurierte Beobachtungsmodell.
- Beobachtungen, kürzlich erstellte Karten und Fragen können den Rechner über das standardmäßige Agentenmodell während der Kartensynthese, der Stand-up-Erstellung oder bei Fragen und Antworten verlassen. Wenden Sie die Richtlinie des Providers zur Datenverarbeitung auf beide Modellrouten an.
- Verwenden Sie sowohl für das strukturierte Beobachtungsmodell als auch für das standardmäßige Agentenmodell lokale Routen, wenn Sie eine vollständig lokale Pipeline benötigen.
- Frames, die Zeitleistendatenbank und temporäre Aufnahmen werden mit Dateiberechtigungen geschrieben, die ausschließlich dem Eigentümer Zugriff gewähren.
- Das Hinzufügen von `screen.snapshot` zu `gateway.nodes.commands.deny` ist der Notausschalter für Bildschirmaufnahmen: Es blockiert sowohl die Aufnahme durch App-Nodes als auch Logbooks eigenen Befehl `logbook.snapshot`.
- Das Festlegen von `tools.media.image.enabled: false` verhindert außerdem, dass Logbook die Medienbildmodelle für die Analyse verwendet; dann wird ausschließlich ein expliziter Wert für `visionModel` in der Plugin-Konfiguration verwendet.

## Fehlerbehebung

### Der Logbook-Tab fehlt

Prüfen Sie alle drei Voraussetzungen:

1. `openclaw plugins list --enabled` enthält `logbook`.
2. Das Gateway wurde nach der Änderung am Plugin oder an der Zulassungsliste neu gestartet.
3. Die Verbindung zur Control UI verfügt über `operator.write`; schreibgeschützte Sitzungen erhalten den interaktiven Tab-Deskriptor nicht.

Wenn `plugins.allow` festgelegt ist, muss es für die empfohlene Konfiguration sowohl `logbook` als auch `codex` enthalten.

### Die Aufnahme meldet einen Fehler

```bash
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw logs --follow
```

- Vergewissern Sie sich, dass der Node `screen.snapshot` oder `logbook.snapshot` bereitstellt.
- Erteilen Sie auf dem aufzeichnenden Mac die Berechtigung für Bildschirmaufnahmen.
- Wenn `nodeId` konfiguriert ist, vergewissern Sie sich, dass der Wert mit der Node-ID oder dem Anzeigenamen übereinstimmt.
- Prüfen Sie, dass `gateway.nodes.commands.deny` nicht `screen.snapshot` enthält.

Nach drei aufeinanderfolgenden Fehlern pausiert Logbook für zehn Aufnahmetakte und versucht es anschließend erneut. Bei einer nicht fest zugeordneten Einrichtung kann zu einem anderen geeigneten Node gewechselt werden.

### Aufnahmen sind erfolgreich, aber es werden keine Karten angezeigt

- Der Status **Modell fehlt** bedeutet, dass keine kompatible Route für strukturierte Bildverarbeitung gefunden wurde. Aktivieren und authentifizieren Sie das Codex-Plugin oder legen Sie einen gültigen expliziten Wert für `visionModel` fest. Aufgenommene Frames bleiben ausstehend, solange das Modell fehlt, und können analysiert werden, nachdem die Konfiguration korrigiert wurde.
- Warten Sie auf `analysisIntervalMinutes` oder wählen Sie **Jetzt analysieren**, nachdem Aktivität aufgezeichnet wurde.
- Aufeinanderfolgende identische Frames gelten als Nachweis für Inaktivität und werden nicht in Analysebatches aufgenommen. Ändern Sie vor dem Testen den sichtbaren Bildschirminhalt.
- Wenn der neueste Batch einen Fehler anzeigt, beheben Sie das Modell- oder Authentifizierungsproblem und wählen Sie **Jetzt analysieren**. Fehlgeschlagene Batches werden nur nach dieser expliziten Aktion erneut versucht, um wiederholte Modellkosten zu vermeiden.

## Verwandte Themen

- [Plugins verwalten](/de/plugins/manage-plugins)
- [Codex-Harness](/de/plugins/codex-harness)
- [Medienverständnis](/de/nodes/media-understanding)
- [Nodes](/de/nodes)
- [Node-Fehlerbehebung](/de/nodes/troubleshooting)
- [Control UI](/de/web/control-ui)
