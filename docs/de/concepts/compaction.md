---
read_when:
    - Sie möchten Auto-Compaction und /compact verstehen
    - Sie debuggen lange Sitzungen, die Kontextlimits erreichen
summary: Wie OpenClaw lange Unterhaltungen zusammenfasst, um innerhalb der Modellgrenzen zu bleiben
title: Compaction
x-i18n:
    generated_at: "2026-06-27T17:22:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 71c1665055574622926a4f13ee82b97f1c45e679a895db78da983919c0a5458f
    source_path: concepts/compaction.md
    workflow: 16
---

Jedes Modell hat ein Kontextfenster: die maximale Anzahl von Tokens, die es verarbeiten kann. Wenn sich eine Unterhaltung diesem Limit nähert, fasst OpenClaw ältere Nachrichten per **Compaction** zu einer Zusammenfassung zusammen, damit der Chat fortgesetzt werden kann.

## Funktionsweise

1. Ältere Unterhaltungsdurchläufe werden zu einem kompakten Eintrag zusammengefasst.
2. Die Zusammenfassung wird im Sitzungs-Transkript gespeichert.
3. Aktuelle Nachrichten bleiben unverändert erhalten.

Wenn OpenClaw den Verlauf in Compaction-Blöcke aufteilt, hält es Tool-Aufrufe des Assistenten mit den zugehörigen `toolResult`-Einträgen zusammen. Wenn ein Trennpunkt innerhalb eines Tool-Blocks liegt, verschiebt OpenClaw die Grenze, damit das Paar zusammenbleibt und der aktuelle nicht zusammengefasste Abschnitt erhalten bleibt.

Der vollständige Unterhaltungsverlauf bleibt auf der Festplatte. Compaction ändert nur, was das Modell im nächsten Durchlauf sieht.

## Automatische Compaction

Automatische Compaction ist standardmäßig aktiviert. Sie wird ausgeführt, wenn sich die Sitzung dem Kontextlimit nähert oder wenn das Modell einen Kontextüberlauf-Fehler zurückgibt (in diesem Fall führt OpenClaw eine Compaction durch und versucht es erneut).

Sie sehen:

- `embedded run auto-compaction start` / `complete` in normalen Gateway-Logs.
- `🧹 Auto-compaction complete` im ausführlichen Modus.
- `/status` zeigt `🧹 Compactions: <count>`.

<Info>
Vor der Compaction erinnert OpenClaw den Agenten automatisch daran, wichtige Notizen in [memory](/de/concepts/memory)-Dateien zu speichern. Dies verhindert Kontextverlust.
</Info>

<AccordionGroup>
  <Accordion title="Erkannte Überlauf-Signaturen">
    OpenClaw erkennt Kontextüberläufe anhand dieser Provider-Fehlermuster:

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

Wenn `agents.defaults.compaction.keepRecentTokens` gesetzt ist, berücksichtigt die manuelle Compaction diesen OpenClaw-Schnittpunkt und behält den aktuellen Abschnitt im neu aufgebauten Kontext. Ohne explizites Beibehaltungsbudget verhält sich die manuelle Compaction wie ein harter Kontrollpunkt und fährt allein mit der neuen Zusammenfassung fort.

## Konfiguration

Konfigurieren Sie Compaction unter `agents.defaults.compaction` in Ihrer `openclaw.json`. Die häufigsten Stellschrauben sind unten aufgeführt; die vollständige Referenz finden Sie unter [Detaillierter Überblick zur Sitzungsverwaltung](/de/reference/session-management-compaction).

### Ein anderes Modell verwenden

Standardmäßig verwendet Compaction das primäre Modell des Agenten. Setzen Sie `agents.defaults.compaction.model`, um die Zusammenfassung an ein leistungsfähigeres oder spezialisierteres Modell zu delegieren. Die Überschreibung akzeptiert eine `provider/model-id`-Zeichenfolge oder einen einfachen Alias, der unter `agents.defaults.models` konfiguriert ist:

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

Einfache konfigurierte Aliasse werden vor Beginn der Compaction zu ihrem kanonischen Provider und Modell aufgelöst. Wenn ein einfacher Wert sowohl einem Alias als auch einer konfigurierten literalen Modell-ID entspricht, gewinnt die literale Modell-ID. Ein nicht übereinstimmender einfacher Wert bleibt eine Modell-ID beim aktiven Provider.

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

Wenn nichts gesetzt ist, beginnt Compaction mit dem aktiven Sitzungsmodell. Wenn die Zusammenfassung mit einem Provider-Fehler fehlschlägt, der für Modell-Fallback infrage kommt, versucht OpenClaw diesen Compaction-Versuch erneut über die bestehende Modell-Fallback-Kette der Sitzung. Die Fallback-Auswahl ist temporär und wird nicht in den Sitzungszustand zurückgeschrieben. Eine explizite Überschreibung über `agents.defaults.compaction.model` bleibt exakt und erbt nicht die Sitzungs-Fallback-Kette.

### Beibehaltung von Bezeichnern

Die Compaction-Zusammenfassung bewahrt standardmäßig undurchsichtige Bezeichner (`identifierPolicy: "strict"`). Überschreiben Sie dies mit `identifierPolicy: "off"`, um es zu deaktivieren, oder mit `identifierPolicy: "custom"` plus `identifierInstructions` für benutzerdefinierte Vorgaben.

### Byte-Schutz für aktives Transkript

Wenn `agents.defaults.compaction.maxActiveTranscriptBytes` gesetzt ist, löst OpenClaw vor einem Lauf eine normale lokale Compaction aus, falls die aktive JSONL-Datei diese Größe erreicht. Das ist nützlich für lange laufende Sitzungen, in denen providerseitige Kontextverwaltung den Modellkontext gesund halten kann, während das lokale Transkript weiter wächst. Es teilt keine rohen JSONL-Bytes auf; es weist die normale Compaction-Pipeline an, eine semantische Zusammenfassung zu erstellen.

<Warning>
Der Byte-Schutz erfordert `truncateAfterCompaction: true`. Ohne Transkript-Rotation würde die aktive Datei nicht schrumpfen und der Schutz bliebe inaktiv.
</Warning>

### Nachfolge-Transkripte

Wenn `agents.defaults.compaction.truncateAfterCompaction` aktiviert ist, schreibt OpenClaw das vorhandene Transkript nicht direkt um. Es erstellt aus der Compaction-Zusammenfassung, dem beibehaltenen Zustand und dem nicht zusammengefassten Abschnitt ein neues aktives Nachfolge-Transkript und zeichnet anschließend Kontrollpunkt-Metadaten auf, die Branch-/Restore-Flows auf diesen kompakten Nachfolger verweisen.
Nachfolge-Transkripte entfernen außerdem exakte Duplikate langer Benutzerdurchläufe, die innerhalb eines kurzen Wiederholungsfensters eintreffen, sodass Kanal-Wiederholungsstürme nach der Compaction nicht in das nächste aktive Transkript übernommen werden.

OpenClaw schreibt für neue Compactions keine separaten `.checkpoint.*.jsonl`-Kopien mehr. Vorhandene Legacy-Kontrollpunktdateien können weiterhin verwendet werden, solange sie referenziert werden, und werden durch die normale Sitzungsbereinigung entfernt.

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

### Speicher-Flush

Vor der Compaction kann OpenClaw einen **stillen Speicher-Flush**-Durchlauf ausführen, um dauerhafte Notizen auf der Festplatte zu speichern. Setzen Sie `agents.defaults.compaction.memoryFlush.model`, wenn dieser Verwaltungsdurchlauf ein lokales Modell statt des aktiven Unterhaltungsmodells verwenden soll:

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

Die Modellüberschreibung für den Speicher-Flush ist exakt und erbt nicht die aktive Sitzungs-Fallback-Kette. Details und Konfiguration finden Sie unter [Speicher](/de/concepts/memory).

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

Das Setzen eines `provider` erzwingt automatisch `mode: "safeguard"`. Provider erhalten dieselben Compaction-Anweisungen und dieselbe Richtlinie zur Beibehaltung von Bezeichnern wie der integrierte Pfad, und OpenClaw bewahrt nach der Provider-Ausgabe weiterhin den Suffix-Kontext aktueller Durchläufe und geteilter Durchläufe.

<Note>
Wenn der Provider fehlschlägt oder ein leeres Ergebnis zurückgibt, fällt OpenClaw auf die integrierte LLM-Zusammenfassung zurück.
</Note>

## Compaction vs. Pruning

|                  | Compaction                         | Pruning                                 |
| ---------------- | ---------------------------------- | --------------------------------------- |
| **Was es tut**   | Fasst ältere Unterhaltung zusammen | Kürzt alte Tool-Ergebnisse              |
| **Gespeichert?** | Ja (im Sitzungs-Transkript)        | Nein (nur im Arbeitsspeicher, je Anfrage) |
| **Umfang**       | Gesamte Unterhaltung               | Nur Tool-Ergebnisse                     |

[Session-Pruning](/de/concepts/session-pruning) ist eine leichtgewichtigere Ergänzung, die Tool-Ausgaben kürzt, ohne sie zusammenzufassen.

## Fehlerbehebung

**Compaction erfolgt zu häufig?** Das Kontextfenster des Modells ist möglicherweise klein, oder Tool-Ausgaben sind möglicherweise groß. Versuchen Sie, [Session-Pruning](/de/concepts/session-pruning) zu aktivieren.

**Der Kontext wirkt nach der Compaction veraltet?** Verwenden Sie `/compact Focus on <topic>`, um die Zusammenfassung zu steuern, oder aktivieren Sie den [Speicher-Flush](/de/concepts/memory), damit Notizen erhalten bleiben.

**Sie benötigen einen sauberen Neustart?** `/new` startet eine frische Sitzung ohne Compaction.

Erweiterte Konfiguration (reservierte Tokens, Beibehaltung von Bezeichnern, benutzerdefinierte Kontext-Engines, serverseitige OpenAI-Compaction) finden Sie im [detaillierten Überblick zur Sitzungsverwaltung](/de/reference/session-management-compaction).

## Verwandte Themen

- [Sitzung](/de/concepts/session): Sitzungsverwaltung und Lebenszyklus.
- [Session-Pruning](/de/concepts/session-pruning): Kürzen von Tool-Ergebnissen.
- [Kontext](/de/concepts/context): wie Kontext für Agenten-Durchläufe aufgebaut wird.
- [Hooks](/de/automation/hooks): Compaction-Lebenszyklus-Hooks (`before_compaction`, `after_compaction`).
