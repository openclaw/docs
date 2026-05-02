---
read_when:
    - Sie möchten Auto-Compaction und /compact verstehen
    - Sie debuggen lange Sitzungen, die Kontextlimits erreichen
summary: Wie OpenClaw lange Unterhaltungen zusammenfasst, um innerhalb der Modellgrenzen zu bleiben
title: Compaction
x-i18n:
    generated_at: "2026-05-02T06:31:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f8e6f372508a0f5421654d3e2a694695eb8a7fda4e3928159bf8f08b2a2156b
    source_path: concepts/compaction.md
    workflow: 16
---

Jedes Modell hat ein Kontextfenster: die maximale Anzahl von Tokens, die es verarbeiten kann. Wenn sich eine Unterhaltung diesem Limit nähert, führt OpenClaw für ältere Nachrichten eine **Compaction** zu einer Zusammenfassung durch, damit der Chat fortgesetzt werden kann.

## Funktionsweise

1. Ältere Unterhaltungsschritte werden zu einem kompakten Eintrag zusammengefasst.
2. Die Zusammenfassung wird im Sitzungstranskript gespeichert.
3. Aktuelle Nachrichten bleiben unverändert erhalten.

Wenn OpenClaw den Verlauf in Compaction-Blöcke aufteilt, bleiben Tool-Aufrufe des Assistenten mit ihren passenden `toolResult`-Einträgen gekoppelt. Wenn ein Trennpunkt innerhalb eines Tool-Blocks liegt, verschiebt OpenClaw die Grenze, damit das Paar zusammenbleibt und der aktuelle, nicht zusammengefasste Rest erhalten bleibt.

Der vollständige Unterhaltungsverlauf bleibt auf dem Datenträger erhalten. Compaction ändert nur, was das Modell im nächsten Schritt sieht.

## Automatische Compaction

Automatische Compaction ist standardmäßig aktiviert. Sie wird ausgeführt, wenn sich die Sitzung dem Kontextlimit nähert oder wenn das Modell einen Kontextüberlauf-Fehler zurückgibt. In diesem Fall führt OpenClaw eine Compaction durch und versucht es erneut.

Sie sehen:

- `🧹 Auto-compaction complete` im ausführlichen Modus.
- `/status` zeigt `🧹 Compactions: <count>`.

<Info>
Vor der Compaction erinnert OpenClaw den Agenten automatisch daran, wichtige Notizen in [Memory](/de/concepts/memory)-Dateien zu speichern. Das verhindert Kontextverlust.
</Info>

<AccordionGroup>
  <Accordion title="Erkannte Überlaufsignaturen">
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

Wenn `agents.defaults.compaction.keepRecentTokens` gesetzt ist, berücksichtigt die manuelle Compaction diesen Pi-Schnittpunkt und behält den aktuellen Rest im neu aufgebauten Kontext bei. Ohne ein explizites Aufbewahrungsbudget verhält sich die manuelle Compaction wie ein harter Prüfpunkt und wird nur aus der neuen Zusammenfassung fortgesetzt.

## Konfiguration

Konfigurieren Sie Compaction unter `agents.defaults.compaction` in Ihrer `openclaw.json`. Die gängigsten Stellschrauben sind unten aufgeführt; die vollständige Referenz finden Sie unter [Ausführliche Sitzungverwaltung](/de/reference/session-management-compaction).

### Ein anderes Modell verwenden

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

Wenn nicht gesetzt, startet Compaction mit dem aktiven Sitzungsmodell. Wenn die Zusammenfassung mit einem Provider-Fehler fehlschlägt, der für Modell-Fallback geeignet ist, versucht OpenClaw diesen Compaction-Versuch über die vorhandene Modell-Fallback-Kette der Sitzung erneut. Die Fallback-Auswahl ist temporär und wird nicht in den Sitzungszustand zurückgeschrieben. Eine explizite Überschreibung über `agents.defaults.compaction.model` bleibt exakt und erbt die Sitzungs-Fallback-Kette nicht.

### Beibehaltung von Bezeichnern

Die Compaction-Zusammenfassung bewahrt undurchsichtige Bezeichner standardmäßig (`identifierPolicy: "strict"`). Überschreiben Sie dies mit `identifierPolicy: "off"`, um es zu deaktivieren, oder mit `identifierPolicy: "custom"` plus `identifierInstructions` für benutzerdefinierte Anweisungen.

### Byte-Grenze für aktives Transkript

Wenn `agents.defaults.compaction.maxActiveTranscriptBytes` gesetzt ist, löst OpenClaw vor einem Lauf eine normale lokale Compaction aus, sobald die aktive JSONL-Datei diese Größe erreicht. Das ist nützlich für lange laufende Sitzungen, bei denen das providerseitige Kontextmanagement den Modellkontext stabil halten kann, während das lokale Transkript weiter wächst. Dabei werden keine rohen JSONL-Bytes aufgeteilt; stattdessen wird die normale Compaction-Pipeline angewiesen, eine semantische Zusammenfassung zu erstellen.

<Warning>
Die Byte-Grenze erfordert `truncateAfterCompaction: true`. Ohne Transkriptrotation würde die aktive Datei nicht schrumpfen und die Grenze bleibt inaktiv.
</Warning>

### Nachfolgetranskripte

Wenn `agents.defaults.compaction.truncateAfterCompaction` aktiviert ist, schreibt OpenClaw das vorhandene Transkript nicht direkt um. Es erstellt aus der Compaction-Zusammenfassung, dem erhaltenen Zustand und dem nicht zusammengefassten Rest ein neues aktives Nachfolgetranskript und behält die vorherige JSONL-Datei als archivierte Prüfpunktquelle bei.
Nachfolgetranskripte entfernen außerdem exakt doppelte lange Benutzerbeiträge, die innerhalb eines kurzen Wiederholungsfensters eintreffen, damit Wiederholungsstürme aus Kanälen nach der Compaction nicht in das nächste aktive Transkript übernommen werden.

Vor-Compaction-Prüfpunkte bleiben nur erhalten, solange sie unter OpenClaws Größenlimit für Prüfpunkte bleiben; übergroße aktive Transkripte werden weiterhin kompaktiert, aber OpenClaw überspringt den großen Debug-Snapshot, statt die Datenträgernutzung zu verdoppeln.

### Compaction-Hinweise

Standardmäßig läuft Compaction still. Setzen Sie `notifyUser`, um kurze Statusmeldungen anzuzeigen, wenn Compaction startet und abgeschlossen ist:

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

### Memory-Flush

Vor der Compaction kann OpenClaw einen **stillen Memory-Flush**-Schritt ausführen, um dauerhafte Notizen auf dem Datenträger zu speichern. Setzen Sie `agents.defaults.compaction.memoryFlush.model`, wenn dieser Aufräumschritt ein lokales Modell statt des aktiven Unterhaltungsmodells verwenden soll:

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

Die Modellüberschreibung für den Memory-Flush ist exakt und erbt die aktive Sitzungs-Fallback-Kette nicht. Details und Konfiguration finden Sie unter [Memory](/de/concepts/memory).

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

Das Setzen eines `provider` erzwingt automatisch `mode: "safeguard"`. Provider erhalten dieselben Compaction-Anweisungen und dieselbe Richtlinie zur Beibehaltung von Bezeichnern wie der integrierte Pfad, und OpenClaw bewahrt auch nach der Provider-Ausgabe weiterhin den Suffixkontext aus aktuellen Schritten und geteilten Schritten.

<Note>
Wenn der Provider fehlschlägt oder ein leeres Ergebnis zurückgibt, fällt OpenClaw auf die integrierte LLM-Zusammenfassung zurück.
</Note>

## Compaction vs. Bereinigung

|                  | Compaction                         | Bereinigung                         |
| ---------------- | ---------------------------------- | ----------------------------------- |
| **Funktion**     | Fasst ältere Unterhaltung zusammen | Kürzt alte Tool-Ergebnisse          |
| **Gespeichert?** | Ja (im Sitzungstranskript)         | Nein (nur im Arbeitsspeicher, je Anfrage) |
| **Geltungsbereich** | Gesamte Unterhaltung            | Nur Tool-Ergebnisse                 |

[Session-Bereinigung](/de/concepts/session-pruning) ist eine leichtgewichtigere Ergänzung, die Tool-Ausgaben kürzt, ohne sie zusammenzufassen.

## Fehlerbehebung

**Zu häufige Compaction?** Das Kontextfenster des Modells ist möglicherweise klein, oder Tool-Ausgaben sind möglicherweise groß. Versuchen Sie, [Session-Bereinigung](/de/concepts/session-pruning) zu aktivieren.

**Kontext wirkt nach der Compaction veraltet?** Verwenden Sie `/compact Focus on <topic>`, um die Zusammenfassung zu steuern, oder aktivieren Sie den [Memory-Flush](/de/concepts/memory), damit Notizen erhalten bleiben.

**Benötigen Sie einen Neustart ohne Altlasten?** `/new` startet eine neue Sitzung ohne Compaction.

Erweiterte Konfigurationen (reservierte Tokens, Beibehaltung von Bezeichnern, benutzerdefinierte Kontext-Engines, serverseitige OpenAI-Compaction) finden Sie in der [ausführlichen Sitzungsverwaltung](/de/reference/session-management-compaction).

## Verwandte Themen

- [Session](/de/concepts/session): Sitzungsverwaltung und Lebenszyklus.
- [Session-Bereinigung](/de/concepts/session-pruning): Kürzen von Tool-Ergebnissen.
- [Kontext](/de/concepts/context): wie Kontext für Agentenschritte aufgebaut wird.
- [Hooks](/de/automation/hooks): Hooks für den Compaction-Lebenszyklus (`before_compaction`, `after_compaction`).
