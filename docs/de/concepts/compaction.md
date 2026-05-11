---
read_when:
    - Sie möchten Auto-Compaction und /compact verstehen
    - Sie debuggen lange Sitzungen, die Kontextlimits erreichen
summary: Wie OpenClaw lange Konversationen zusammenfasst, um innerhalb der Modellgrenzen zu bleiben
title: Compaction
x-i18n:
    generated_at: "2026-05-11T20:27:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: edef60498a1e91405bd42d5e6eb4883719487f6d6f40936c4168e8bc5f40a39a
    source_path: concepts/compaction.md
    workflow: 16
---

Jedes Modell hat ein Kontextfenster: die maximale Anzahl von Token, die es verarbeiten kann. Wenn sich eine Unterhaltung dieser Grenze nähert, führt OpenClaw eine **Compaction** älterer Nachrichten zu einer Zusammenfassung durch, damit der Chat fortgesetzt werden kann.

## Funktionsweise

1. Ältere Unterhaltungsbeiträge werden zu einem kompakten Eintrag zusammengefasst.
2. Die Zusammenfassung wird im Sitzungstranskript gespeichert.
3. Aktuelle Nachrichten bleiben unverändert erhalten.

Wenn OpenClaw den Verlauf in Compaction-Abschnitte aufteilt, hält es Tool-Aufrufe des Assistenten mit den passenden `toolResult`-Einträgen zusammen. Wenn ein Trennpunkt innerhalb eines Tool-Blocks liegt, verschiebt OpenClaw die Grenze, damit das Paar zusammenbleibt und der aktuelle nicht zusammengefasste Nachlauf erhalten bleibt.

Der vollständige Unterhaltungsverlauf bleibt auf dem Datenträger. Compaction ändert nur, was das Modell im nächsten Durchlauf sieht.

## Auto-Compaction

Auto-Compaction ist standardmäßig aktiviert. Sie wird ausgeführt, wenn sich die Sitzung der Kontextgrenze nähert oder wenn das Modell einen Kontextüberlauf-Fehler zurückgibt. In diesem Fall führt OpenClaw eine Compaction durch und versucht es erneut.

Sie sehen Folgendes:

- `embedded run auto-compaction start` / `complete` in normalen Gateway-Logs.
- `🧹 Auto-compaction complete` im ausführlichen Modus.
- `/status` zeigt `🧹 Compactions: <count>`.

<Info>
Vor der Compaction erinnert OpenClaw den Agenten automatisch daran, wichtige Notizen in [Memory](/de/concepts/memory)-Dateien zu speichern. Das verhindert Kontextverlust.
</Info>

<AccordionGroup>
  <Accordion title="Erkannte Überlauf-Signaturen">
    OpenClaw erkennt Kontextüberlauf anhand dieser Provider-Fehlermuster:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Manuelle Compaction

Geben Sie in einem beliebigen Chat `/compact` ein, um eine Compaction zu erzwingen. Fügen Sie Anweisungen hinzu, um die Zusammenfassung zu steuern:

```
/compact Focus on the API design decisions
```

Wenn `agents.defaults.compaction.keepRecentTokens` gesetzt ist, beachtet die manuelle Compaction diesen Pi-Trennpunkt und behält den aktuellen Nachlauf im neu aufgebauten Kontext. Ohne explizites Beibehaltungsbudget verhält sich die manuelle Compaction wie ein harter Prüfpunkt und wird nur mit der neuen Zusammenfassung fortgesetzt.

## Konfiguration

Konfigurieren Sie Compaction unter `agents.defaults.compaction` in Ihrer `openclaw.json`. Die wichtigsten Stellschrauben sind unten aufgeführt; die vollständige Referenz finden Sie unter [Ausführlicher Einblick in die Sitzungsverwaltung](/de/reference/session-management-compaction).

### Anderes Modell verwenden

Standardmäßig verwendet Compaction das primäre Modell des Agenten. Setzen Sie `agents.defaults.compaction.model`, um die Zusammenfassung an ein leistungsfähigeres oder spezialisiertes Modell zu delegieren. Die Überschreibung akzeptiert jede `provider/model-id`-Zeichenfolge:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

Das funktioniert auch mit lokalen Modellen, zum Beispiel mit einem zweiten Ollama-Modell, das speziell für Zusammenfassungen vorgesehen ist:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

Wenn nichts gesetzt ist, startet Compaction mit dem aktiven Sitzungsmodell. Wenn die Zusammenfassung mit einem Provider-Fehler fehlschlägt, der für Modell-Fallback geeignet ist, versucht OpenClaw diesen Compaction-Versuch über die vorhandene Modell-Fallback-Kette der Sitzung erneut. Die Fallback-Auswahl ist temporär und wird nicht in den Sitzungsstatus zurückgeschrieben. Eine explizite Überschreibung mit `agents.defaults.compaction.model` bleibt exakt und übernimmt nicht die Fallback-Kette der Sitzung.

### Beibehaltung von Kennungen

Die Compaction-Zusammenfassung behält undurchsichtige Kennungen standardmäßig bei (`identifierPolicy: "strict"`). Überschreiben Sie dies mit `identifierPolicy: "off"`, um es zu deaktivieren, oder mit `identifierPolicy: "custom"` plus `identifierInstructions` für benutzerdefinierte Vorgaben.

### Byte-Schutz für das aktive Transkript

Wenn `agents.defaults.compaction.maxActiveTranscriptBytes` gesetzt ist, löst OpenClaw vor einem Durchlauf eine normale lokale Compaction aus, wenn das aktive JSONL diese Größe erreicht. Das ist nützlich für lang laufende Sitzungen, bei denen die Provider-seitige Kontextverwaltung den Modellkontext gesund halten kann, während das lokale Transkript weiter wächst. Es teilt keine rohen JSONL-Bytes auf, sondern fordert die normale Compaction-Pipeline auf, eine semantische Zusammenfassung zu erstellen.

<Warning>
Der Byte-Schutz erfordert `truncateAfterCompaction: true`. Ohne Transkriptrotation würde die aktive Datei nicht schrumpfen, und der Schutz bleibt inaktiv.
</Warning>

### Nachfolge-Transkripte

Wenn `agents.defaults.compaction.truncateAfterCompaction` aktiviert ist, schreibt OpenClaw das vorhandene Transkript nicht direkt um. Es erstellt aus der Compaction-Zusammenfassung, dem beibehaltenen Status und dem nicht zusammengefassten Nachlauf ein neues aktives Nachfolge-Transkript und behält das vorherige JSONL anschließend als archivierte Prüfpunktquelle bei.
Nachfolge-Transkripte verwerfen außerdem exakt doppelte lange Benutzerbeiträge, die
innerhalb eines kurzen Wiederholungsfensters eintreffen, sodass Wiederholungsstürme von Kanälen nach der Compaction nicht in das
nächste aktive Transkript übernommen werden.

Prüfpunkte vor der Compaction werden nur beibehalten, solange sie unter OpenClaws
Größenobergrenze für Prüfpunkte bleiben; übergroße aktive Transkripte werden weiterhin kompakt zusammengefasst, aber OpenClaw
überspringt den großen Debug-Snapshot, anstatt die Datenträgernutzung zu verdoppeln.

### Compaction-Hinweise

Standardmäßig läuft Compaction still im Hintergrund. Setzen Sie `notifyUser`, um kurze Statusmeldungen anzuzeigen, wenn Compaction startet und abgeschlossen wird:

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

### Memory Flush

Vor der Compaction kann OpenClaw einen **stillen Memory Flush**-Durchlauf ausführen, um dauerhafte Notizen auf dem Datenträger zu speichern. Setzen Sie `agents.defaults.compaction.memoryFlush.model`, wenn dieser Verwaltungsdurchlauf ein lokales Modell statt des aktiven Unterhaltungsmodells verwenden soll:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

Die Überschreibung für das Memory-Flush-Modell ist exakt und übernimmt nicht die Fallback-Kette der aktiven Sitzung. Details und Konfiguration finden Sie unter [Memory](/de/concepts/memory).

## Austauschbare Compaction-Provider

Plugins können über `registerCompactionProvider()` in der Plugin-API einen benutzerdefinierten Compaction-Provider registrieren. Wenn ein Provider registriert und konfiguriert ist, delegiert OpenClaw die Zusammenfassung an ihn statt an die integrierte LLM-Pipeline.

Um einen registrierten Provider zu verwenden, setzen Sie dessen ID in Ihrer Konfiguration:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "provider": "my-provider"
      }
    }
  }
}
```

Das Setzen eines `provider` erzwingt automatisch `mode: "safeguard"`. Provider erhalten dieselben Compaction-Anweisungen und dieselbe Richtlinie zur Beibehaltung von Kennungen wie der integrierte Pfad, und OpenClaw bewahrt nach der Provider-Ausgabe weiterhin den Suffixkontext aus aktuellen und geteilten Durchläufen.

<Note>
Wenn der Provider fehlschlägt oder ein leeres Ergebnis zurückgibt, fällt OpenClaw auf die integrierte LLM-Zusammenfassung zurück.
</Note>

## Compaction vs. Pruning

|                  | Compaction                         | Pruning                              |
| ---------------- | ---------------------------------- | ------------------------------------ |
| **Was es tut**   | Fasst ältere Unterhaltung zusammen | Kürzt alte Tool-Ergebnisse           |
| **Gespeichert?** | Ja (im Sitzungstranskript)         | Nein (nur im Arbeitsspeicher, pro Anfrage) |
| **Umfang**       | Gesamte Unterhaltung               | Nur Tool-Ergebnisse                  |

[Session Pruning](/de/concepts/session-pruning) ist eine leichtgewichtigere Ergänzung, die Tool-Ausgaben kürzt, ohne sie zusammenzufassen.

## Fehlerbehebung

**Zu häufige Compaction?** Das Kontextfenster des Modells ist möglicherweise klein, oder Tool-Ausgaben sind groß. Versuchen Sie, [Session Pruning](/de/concepts/session-pruning) zu aktivieren.

**Kontext wirkt nach der Compaction veraltet?** Verwenden Sie `/compact Focus on <topic>`, um die Zusammenfassung zu steuern, oder aktivieren Sie den [Memory Flush](/de/concepts/memory), damit Notizen erhalten bleiben.

**Benötigen Sie einen sauberen Neustart?** `/new` startet eine neue Sitzung ohne Compaction.

Erweiterte Konfiguration (Reservetoken, Beibehaltung von Kennungen, benutzerdefinierte Kontext-Engines, OpenAI-Server-seitige Compaction) finden Sie im [ausführlichen Einblick in die Sitzungsverwaltung](/de/reference/session-management-compaction).

## Verwandte Themen

- [Sitzung](/de/concepts/session): Sitzungsverwaltung und Lebenszyklus.
- [Session Pruning](/de/concepts/session-pruning): Kürzen von Tool-Ergebnissen.
- [Kontext](/de/concepts/context): wie Kontext für Agentendurchläufe aufgebaut wird.
- [Hooks](/de/automation/hooks): Compaction-Lebenszyklus-Hooks (`before_compaction`, `after_compaction`).
