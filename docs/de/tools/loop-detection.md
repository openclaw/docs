---
read_when:
    - Ein Benutzer meldet, dass Agenten in einer Schleife wiederholter Tool-Aufrufe stecken bleiben
    - Sie müssen den Schutz vor wiederholten Aufrufen steuern
    - Sie bearbeiten Richtlinien für Agenten-Tools und -Laufzeiten
    - Nach einem Wiederholungsversuch aufgrund eines Kontextüberlaufs treten `compaction_loop_persisted` Abbrüche auf
summary: So aktivieren Sie Schutzmechanismen, die sich wiederholende Tool-Aufrufschleifen erkennen
title: Tool-Schleifen-Erkennung
x-i18n:
    generated_at: "2026-07-24T05:20:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 79b5aa1d85e02b8cf46a95b3bcebb255178b91456517cab804cce77b8f3b818e
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw verfügt über zwei zusammenwirkende Schutzmechanismen gegen sich wiederholende Tool-Aufrufmuster,
die beide unter `tools.loopDetection` konfiguriert werden:

1. **Schleifenerkennung** (`enabled`) – standardmäßig deaktiviert. Überwacht den fortlaufenden
   Tool-Aufrufverlauf auf wiederholte Muster und erneute Versuche mit unbekannten Tools.
2. **Schutz nach Compaction** – aktiviert, solange
   `enabled` nicht ausdrücklich auf `false` gesetzt ist. Wird nach jedem erneuten Versuch infolge einer Compaction aktiviert und
   bricht den Lauf ab, wenn der Agent dasselbe `(tool, args, result)`-Tripel
   innerhalb des Zeitfensters wiederholt.

Setzen Sie `tools.loopDetection.enabled: false`, um beide Schutzmechanismen zu deaktivieren.

## Warum dies existiert

- Erkennt sich wiederholende Sequenzen, die keinen Fortschritt erzielen.
- Erkennt hochfrequente Schleifen ohne Ergebnis (gleiches Tool, gleiche Eingaben, wiederholte
  Fehler).
- Erkennt bestimmte wiederholte Aufrufmuster bei bekannten Polling-Tools.
- Unterbricht Zyklen aus Kontextüberlauf -> Compaction -> derselben Schleife, statt sie
  unbegrenzt weiterlaufen zu lassen.

## Konfigurationsblock

Globale Einstellung:

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // Hauptschalter für die Detektoren des fortlaufenden Verlaufs
    },
  },
}
```

Optionale agentenspezifische Überschreibung unter `agents.entries.*.tools.loopDetection`:

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
          },
        },
      },
    ],
  },
}
```

Die agentenspezifische Einstellung überschreibt die globale Einstellung.

### Verhalten des Felds

| Feld     | Standardwert | Wirkung                                                                                            |
| --------- | ------- | ------------------------------------------------------------------------------------------------- |
| `enabled` | `false` | Hauptschalter für die Detektoren des fortlaufenden Verlaufs. `false` deaktiviert auch den Schutz nach Compaction. |

Bei `exec` vergleicht das Hashing bei fehlendem Fortschritt stabile Befehlsergebnisse (Status,
Exit-Code, Zeitüberschreitungskennzeichen, Ausgabe) und ignoriert veränderliche Laufzeitmetadaten wie
Dauer, PID, Sitzungs-ID und Arbeitsverzeichnis. Ergebnisse ausgehender Nachrichtenversände
werden gehasht, nachdem veränderliche aufrufspezifische IDs (Nachrichten-ID, Datei-ID, Zeitstempel)
entfernt wurden, sodass ein „gesendet“-Ergebnis nicht identisch mit einem anderen „gesendet“-
Ergebnis erscheint. Wenn eine Lauf-ID verfügbar ist, wird der Verlauf nur innerhalb dieses Laufs ausgewertet,
sodass geplante Heartbeat-Zyklen und neue Läufe keine veralteten Schleifenzähler
aus früheren Läufen übernehmen.

## Empfohlene Einrichtung

- Setzen Sie für kleinere Modelle `enabled: true`. Spitzenmodelle benötigen die Erkennung anhand des fortlaufenden Verlaufs nur selten und können
  den Hauptschalter auf `false` belassen, während sie weiterhin vom
  Schutz nach Compaction profitieren.
- Um alles einschließlich des Schutzes nach Compaction zu deaktivieren, setzen Sie
  `tools.loopDetection.enabled: false` ausdrücklich.

## Schutz nach Compaction

Nach einem erneuten Versuch infolge einer Compaction nach einem Kontextüberlauf aktiviert der Runner für die
nächsten Tool-Aufrufe einen Schutz mit kurzem Zeitfenster. Wenn der Agent dasselbe
`(toolName, argsHash, resultHash)`-Tripel innerhalb dieses Zeitfensters oft genug ausgibt, schließt der Schutz daraus, dass die Compaction die
Schleife nicht unterbrochen hat, und bricht den Lauf mit einem `compaction_loop_persisted`-Fehler ab.

Der Schutz wird mit einer Besonderheit durch das zentrale `tools.loopDetection.enabled`-Flag gesteuert:
Er bleibt **aktiviert, wenn das Flag nicht gesetzt oder `true` ist**, und wird nur
deaktiviert, wenn das Flag ausdrücklich auf `false` gesetzt ist. Dies ist beabsichtigt – der Schutz
dient dazu, Compaction-Schleifen zu beenden, die andernfalls unbegrenzt Tokens verbrauchen würden,
sodass auch Benutzer ohne Konfiguration geschützt sind.

```json5
{
  tools: {
    loopDetection: {
      // Hauptschalter; auf false setzen, um den Schutz zusammen mit den fortlaufenden Detektoren zu deaktivieren
      enabled: true,
    },
  },
}
```

- Der Schutz bricht niemals ab, solange sich die Ergebnisse ändern; nur byteidentische
  Ergebnisse im gesamten Zeitfenster lösen ihn aus.
- Er wird nur unmittelbar nach einem erneuten Versuch infolge einer Compaction aktiviert, nicht an anderen
  Stellen eines Laufs.

<Note>
  Der Schutz nach Compaction wird immer ausgeführt, wenn das zentrale Flag nicht ausdrücklich auf `false` gesetzt ist, selbst wenn Sie nie einen `tools.loopDetection`-Block angelegt haben. Suchen Sie zur Überprüfung unmittelbar nach einem Compaction-Ereignis im Gateway-Protokoll nach `post-compaction guard armed for N attempts`.
</Note>

## Protokolle und erwartetes Verhalten

Wenn eine Schleife erkannt wird, protokolliert OpenClaw ein Schleifenereignis und warnt entweder oder blockiert
abhängig vom Schweregrad den nächsten Tool-Zyklus. Dadurch wird ein unkontrollierter Token-
Verbrauch sowie ein Stillstand verhindert, während der normale Tool-Zugriff erhalten bleibt.

- Zuerst werden Warnungen ausgegeben.
- Die Blockierung erfolgt, sobald ein Muster über den Warnschwellenwert hinaus bestehen bleibt.
- Kritische Schwellenwerte blockieren den nächsten Tool-Zyklus und zeigen im Laufdatensatz einen eindeutigen
  Grund für die Schleifenerkennung an.
- Der Schutz nach Compaction gibt `compaction_loop_persisted`-Fehler aus, die
  das verursachende Tool und die Anzahl identischer Aufrufe nennen.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Ausführungsgenehmigungen" href="/de/tools/exec-approvals" icon="shield">
    Zulassungs-/Ablehnungsrichtlinie für die Shell-Ausführung.
  </Card>
  <Card title="Denkstufen" href="/de/tools/thinking" icon="brain">
    Stufen des Schlussfolgerungsaufwands und Zusammenspiel mit Provider-Richtlinien.
  </Card>
  <Card title="Unteragenten" href="/de/tools/subagents" icon="users">
    Starten isolierter Agenten, um unkontrolliertes Verhalten zu begrenzen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/config-tools#toolsloopdetection" icon="gear">
    Vollständiges `tools.loopDetection`-Schema und Zusammenführungssemantik.
  </Card>
</CardGroup>
