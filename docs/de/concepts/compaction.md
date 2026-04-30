---
read_when:
    - Sie möchten automatische Compaction und /compact verstehen
    - Sie debuggen lange Sitzungen, die Kontextlimits erreichen
summary: Wie OpenClaw lange Unterhaltungen zusammenfasst, um innerhalb der Modellgrenzen zu bleiben
title: Compaction
x-i18n:
    generated_at: "2026-04-30T06:48:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9beac513a8226a7dd107cdc3a7bfd7550d87e98648004c80487db968c57742d4
    source_path: concepts/compaction.md
    workflow: 16
---

Jedes Modell hat ein Kontextfenster: die maximale Anzahl von Tokens, die es verarbeiten kann. Wenn sich eine Unterhaltung diesem Limit nähert, führt OpenClaw eine **Compaction** älterer Nachrichten zu einer Zusammenfassung durch, damit der Chat fortgesetzt werden kann.

## Funktionsweise

1. Ältere Unterhaltungsschritte werden zu einem kompakten Eintrag zusammengefasst.
2. Die Zusammenfassung wird im Sitzungstranskript gespeichert.
3. Aktuelle Nachrichten bleiben unverändert erhalten.

Wenn OpenClaw den Verlauf in Compaction-Abschnitte aufteilt, hält es Tool-Aufrufe des Assistenten mit ihren passenden `toolResult`-Einträgen zusammen. Wenn ein Trennpunkt innerhalb eines Tool-Blocks liegt, verschiebt OpenClaw die Grenze, damit das Paar zusammenbleibt und das aktuelle nicht zusammengefasste Ende erhalten wird.

Der vollständige Unterhaltungsverlauf bleibt auf dem Datenträger. Compaction ändert nur, was das Modell im nächsten Schritt sieht.

## Automatische Compaction

Automatische Compaction ist standardmäßig aktiviert. Sie wird ausgeführt, wenn sich die Sitzung dem Kontextlimit nähert oder wenn das Modell einen Kontextüberlauf-Fehler zurückgibt. In diesem Fall führt OpenClaw eine Compaction durch und versucht es erneut.

Sie sehen:

- `🧹 Auto-compaction complete` im ausführlichen Modus.
- `/status` zeigt `🧹 Compactions: <count>`.

<Info>
Vor der Compaction erinnert OpenClaw den Agenten automatisch daran, wichtige Notizen in [Memory](/de/concepts/memory)-Dateien zu speichern. Dadurch wird Kontextverlust verhindert.
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

Wenn `agents.defaults.compaction.keepRecentTokens` gesetzt ist, berücksichtigt die manuelle Compaction diesen Pi-Schnittpunkt und behält das aktuelle Ende im neu aufgebauten Kontext bei. Ohne explizites Beibehaltungsbudget verhält sich die manuelle Compaction wie ein harter Prüfpunkt und wird nur mit der neuen Zusammenfassung fortgesetzt.

## Konfiguration

Konfigurieren Sie Compaction unter `agents.defaults.compaction` in Ihrer `openclaw.json`. Die wichtigsten Optionen sind unten aufgeführt; die vollständige Referenz finden Sie unter [Ausführliche Sitzungsverwaltung](/de/reference/session-management-compaction).

### Anderes Modell verwenden

Standardmäßig verwendet Compaction das primäre Modell des Agenten. Setzen Sie `agents.defaults.compaction.model`, um die Zusammenfassung an ein leistungsfähigeres oder spezialisiertes Modell zu delegieren. Die Überschreibung akzeptiert jede `provider/model-id`-Zeichenkette:

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

Dies funktioniert auch mit lokalen Modellen, zum Beispiel mit einem zweiten Ollama-Modell, das der Zusammenfassung gewidmet ist:

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

Wenn nichts gesetzt ist, verwendet Compaction das primäre Modell des Agenten.

### Beibehaltung von Kennungen

Die Compaction-Zusammenfassung bewahrt standardmäßig undurchsichtige Kennungen (`identifierPolicy: "strict"`). Überschreiben Sie dies mit `identifierPolicy: "off"`, um es zu deaktivieren, oder mit `identifierPolicy: "custom"` plus `identifierInstructions` für eigene Vorgaben.

### Byte-Schutz für aktives Transkript

Wenn `agents.defaults.compaction.maxActiveTranscriptBytes` gesetzt ist, löst OpenClaw vor einem Lauf eine normale lokale Compaction aus, falls die aktive JSONL-Datei diese Größe erreicht. Das ist nützlich für lange laufende Sitzungen, bei denen das Provider-seitige Kontextmanagement den Modellkontext gesund halten kann, während das lokale Transkript weiter wächst. Es teilt keine rohen JSONL-Bytes auf, sondern fordert die normale Compaction-Pipeline auf, eine semantische Zusammenfassung zu erstellen.

<Warning>
Der Byte-Schutz erfordert `truncateAfterCompaction: true`. Ohne Transkript-Rotation würde die aktive Datei nicht schrumpfen und der Schutz bleibt inaktiv.
</Warning>

### Nachfolge-Transkripte

Wenn `agents.defaults.compaction.truncateAfterCompaction` aktiviert ist, schreibt OpenClaw das bestehende Transkript nicht direkt um. Es erstellt aus der Compaction-Zusammenfassung, dem beibehaltenen Zustand und dem nicht zusammengefassten Ende ein neues aktives Nachfolge-Transkript und behält die vorherige JSONL-Datei als archivierte Prüfpunktquelle.
Nachfolge-Transkripte entfernen außerdem exakt doppelte lange Benutzereingaben, die innerhalb eines kurzen Wiederholungsfensters eintreffen, damit Wiederholungsstürme von Kanälen nach der Compaction nicht in das nächste aktive Transkript übernommen werden.

Prüfpunkte vor der Compaction werden nur beibehalten, solange sie unter der OpenClaw-Größenobergrenze für Prüfpunkte bleiben; übergroße aktive Transkripte werden trotzdem kompaktiert, aber OpenClaw überspringt den großen Debug-Snapshot, statt die Datenträgernutzung zu verdoppeln.

### Compaction-Hinweise

Standardmäßig läuft Compaction im Hintergrund. Setzen Sie `notifyUser`, um kurze Statusmeldungen anzuzeigen, wenn Compaction startet und abgeschlossen ist:

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

Vor der Compaction kann OpenClaw einen **stillen Memory-Flush**-Schritt ausführen, um dauerhafte Notizen auf dem Datenträger zu speichern. Setzen Sie `agents.defaults.compaction.memoryFlush.model`, wenn dieser Verwaltungsdurchlauf ein lokales Modell statt des aktiven Unterhaltungsmodells verwenden soll:

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

Die Modellüberschreibung für den Memory-Flush ist exakt und erbt nicht die Fallback-Kette der aktiven Sitzung. Details und Konfiguration finden Sie unter [Memory](/de/concepts/memory).

## Austauschbare Compaction-Provider

Plugins können über `registerCompactionProvider()` in der Plugin-API einen eigenen Compaction-Provider registrieren. Wenn ein Provider registriert und konfiguriert ist, delegiert OpenClaw die Zusammenfassung an ihn statt an die integrierte LLM-Pipeline.

Um einen registrierten Provider zu verwenden, setzen Sie seine ID in Ihrer Konfiguration:

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

Das Setzen eines `provider` erzwingt automatisch `mode: "safeguard"`. Provider erhalten dieselben Compaction-Anweisungen und dieselbe Richtlinie zur Beibehaltung von Kennungen wie der integrierte Pfad, und OpenClaw bewahrt nach der Provider-Ausgabe weiterhin Kontext aus aktuellen Schritten und geteilten Schritten als Suffix.

<Note>
Wenn der Provider fehlschlägt oder ein leeres Ergebnis zurückgibt, fällt OpenClaw auf die integrierte LLM-Zusammenfassung zurück.
</Note>

## Compaction im Vergleich zu Kürzung

|                  | Compaction                         | Kürzung                                      |
| ---------------- | ---------------------------------- | ------------------------------------------- |
| **Was geschieht** | Fasst ältere Unterhaltung zusammen | Kürzt alte Tool-Ergebnisse                  |
| **Gespeichert?** | Ja (im Sitzungstranskript)         | Nein (nur im Arbeitsspeicher, pro Anfrage) |
| **Umfang**       | Gesamte Unterhaltung               | Nur Tool-Ergebnisse                         |

[Sitzungskürzung](/de/concepts/session-pruning) ist eine leichtgewichtigere Ergänzung, die Tool-Ausgaben kürzt, ohne sie zusammenzufassen.

## Fehlerbehebung

**Zu häufige Compaction?** Das Kontextfenster des Modells ist möglicherweise klein, oder Tool-Ausgaben sind groß. Aktivieren Sie probeweise die [Sitzungskürzung](/de/concepts/session-pruning).

**Kontext wirkt nach der Compaction veraltet?** Verwenden Sie `/compact Focus on <topic>`, um die Zusammenfassung zu steuern, oder aktivieren Sie den [Memory-Flush](/de/concepts/memory), damit Notizen erhalten bleiben.

**Benötigen Sie einen sauberen Neustart?** `/new` startet eine neue Sitzung ohne Compaction.

Erweiterte Konfiguration (reservierte Tokens, Beibehaltung von Kennungen, eigene Kontext-Engines, OpenAI-serverseitige Compaction) finden Sie in der [ausführlichen Sitzungsverwaltung](/de/reference/session-management-compaction).

## Verwandte Themen

- [Sitzung](/de/concepts/session): Sitzungsverwaltung und Lebenszyklus.
- [Sitzungskürzung](/de/concepts/session-pruning): Kürzen von Tool-Ergebnissen.
- [Kontext](/de/concepts/context): wie Kontext für Agentenschritte erstellt wird.
- [Hooks](/de/automation/hooks): Compaction-Lebenszyklus-Hooks (`before_compaction`, `after_compaction`).
