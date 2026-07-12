---
read_when:
    - Sie möchten die automatische Compaction und `/compact` verstehen
    - Sie debuggen lange Sitzungen, die an Kontextgrenzen stoßen
summary: Wie OpenClaw lange Unterhaltungen zusammenfasst, um die Modelllimits einzuhalten
title: Compaction
x-i18n:
    generated_at: "2026-07-12T15:11:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f00fb0cf59184ef450f1fc4d39a21a40ee4e8327d872766bca7f3642c0145514
    source_path: concepts/compaction.md
    workflow: 16
---

Jedes Modell hat ein Kontextfenster: die maximale Anzahl an Tokens, die es verarbeiten kann. Wenn sich eine Unterhaltung diesem Limit nähert, **komprimiert** OpenClaw ältere Nachrichten zu einer Zusammenfassung, damit der Chat fortgesetzt werden kann.

## Funktionsweise

1. Ältere Gesprächsbeiträge werden zu einem kompakten Eintrag zusammengefasst.
2. Die Zusammenfassung wird im Sitzungstranskript gespeichert.
3. Neuere Nachrichten bleiben unverändert erhalten.

OpenClaw hält Tool-Aufrufe des Assistenten mit den zugehörigen `toolResult`-Einträgen zusammen, wenn es einen Teilungspunkt für die Compaction auswählt. Falls der Punkt innerhalb eines Tool-Blocks liegt, verschiebt OpenClaw die Grenze so, dass das Paar zusammenbleibt und das aktuelle, nicht zusammengefasste Ende erhalten bleibt.

Der vollständige Gesprächsverlauf bleibt auf dem Datenträger gespeichert. Die Compaction ändert nur, was das Modell im nächsten Durchlauf sieht.

<Note>
Bei neuen Konfigurationen ist `agents.defaults.compaction.mode` standardmäßig auf `"safeguard"` gesetzt (strengere Schutzmechanismen, Prüfungen der Zusammenfassungsqualität). Setzen Sie ausdrücklich `mode: "default"`, um dies zu deaktivieren.
</Note>

## Automatische Compaction

Die automatische Compaction ist standardmäßig aktiviert. Sie wird ausgeführt, wenn sich die Sitzung dem Kontextlimit nähert oder wenn das Modell einen Kontextüberlauffehler zurückgibt (in diesem Fall führt OpenClaw eine Compaction durch und versucht es erneut).

Folgendes wird angezeigt:

- `embedded run auto-compaction start` / `complete` in normalen Gateway-Protokollen.
- `🧹 Auto-compaction complete` im ausführlichen Modus.
- `/status` mit `🧹 Compactions: <count>`.

<Info>
Vor der Compaction erinnert OpenClaw den Agenten automatisch daran, wichtige Notizen in [Memory-Dateien](/de/concepts/memory) zu speichern. Dadurch wird ein Kontextverlust verhindert.
</Info>

<AccordionGroup>
  <Accordion title="Von OpenClaw erkannte Muster für Überlauffehler">
    OpenClaw erkennt Dutzende providerspezifischer Fehlermeldungen für Überläufe (Anthropic, OpenAI, Bedrock, Gemini, Ollama, OpenRouter und weitere). Häufige Beispiele:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens` (Bedrock)
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Manuelle Compaction

Geben Sie in einem beliebigen Chat `/compact` ein, um eine Compaction zu erzwingen. Fügen Sie Anweisungen hinzu, um die Zusammenfassung zu steuern:

```text
/compact Konzentriere dich auf die Entscheidungen zum API-Design
```

Wenn `agents.defaults.compaction.keepRecentTokens` festgelegt ist (Standardwert: 20,000), berücksichtigt die manuelle Compaction diesen Trennpunkt und behält das neuere Ende im neu aufgebauten Kontext bei. Ohne ein ausdrückliches Aufbewahrungsbudget verhält sich die manuelle Compaction wie ein fester Prüfpunkt und setzt ausschließlich mit der neuen Zusammenfassung fort.

## Konfiguration

Konfigurieren Sie die Compaction unter `agents.defaults.compaction` in Ihrer `openclaw.json`. Die gebräuchlichsten Optionen sind nachfolgend aufgeführt; die vollständige Referenz finden Sie unter [Ausführliche Erläuterung der Sitzungsverwaltung](/de/reference/session-management-compaction).

### Anderes Modell verwenden

Standardmäßig verwendet die Compaction das primäre Modell des Agenten. Legen Sie `agents.defaults.compaction.model` fest, um die Zusammenfassung an ein leistungsfähigeres oder spezialisiertes Modell zu delegieren. Die Überschreibung akzeptiert eine Zeichenfolge im Format `provider/model-id` oder einen einfachen Alias, der unter `agents.defaults.models` konfiguriert ist:

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

Konfigurierte einfache Aliasse werden vor Beginn der Compaction in ihren kanonischen Provider und ihr kanonisches Modell aufgelöst. Wenn ein einfacher Wert sowohl mit einem Alias als auch mit einer konfigurierten wörtlichen Modell-ID übereinstimmt, hat die wörtliche Modell-ID Vorrang. Ein nicht übereinstimmender einfacher Wert bleibt eine Modell-ID beim aktiven Provider.

Dies funktioniert auch mit lokalen Modellen, beispielsweise mit einem zweiten Ollama-Modell, das ausschließlich für Zusammenfassungen vorgesehen ist:

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

Wenn die Option nicht festgelegt ist, beginnt die Compaction mit dem aktiven Sitzungsmodell. Falls die Zusammenfassung aufgrund eines Providerfehlers fehlschlägt, der einen Modell-Fallback zulässt, wiederholt OpenClaw diesen Compaction-Versuch über die bestehende Modell-Fallback-Kette der Sitzung. Die Fallback-Auswahl ist vorübergehend und wird nicht in den Sitzungsstatus zurückgeschrieben. Eine ausdrückliche Überschreibung durch `agents.defaults.compaction.model` bleibt exakt und übernimmt nicht die Fallback-Kette der Sitzung.

### Beibehaltung von Bezeichnern

Die Compaction-Zusammenfassung behält undurchsichtige Bezeichner standardmäßig bei (`identifierPolicy: "strict"`). Verwenden Sie zum Deaktivieren `identifierPolicy: "off"` oder für benutzerdefinierte Vorgaben `identifierPolicy: "custom"` zusammen mit `identifierInstructions`.

### Byte-Grenzwert für aktive Transkripte

Wenn `agents.defaults.compaction.maxActiveTranscriptBytes` festgelegt ist, löst OpenClaw vor einem Durchlauf die normale lokale Compaction aus, sobald der Transkriptverlauf diese Größe erreicht. Dies ist bei lang laufenden Sitzungen nützlich, bei denen die kontextseitige Verwaltung durch den Provider den Modellkontext intakt halten kann, während der persistierte Transkriptverlauf weiter wächst. Dabei werden die Rohbytes nicht aufgeteilt; stattdessen wird die normale Compaction-Pipeline aufgefordert, eine semantische Zusammenfassung zu erstellen.

<Warning>
Der Byte-Grenzwert gilt für den aktiven SQLite-Transkriptverlauf. Veraltete JSONL-Checkpoint-Artefakte sind nicht das aktive Ziel der Compaction.
</Warning>

### Nachfolgetranskripte

Wenn `agents.defaults.compaction.truncateAfterCompaction` aktiviert ist, schreibt OpenClaw das vorhandene Transkript nicht direkt um. Es erstellt aus der Compaction-Zusammenfassung, dem beibehaltenen Zustand und dem nicht zusammengefassten Rest ein neues aktives Nachfolgetranskript und zeichnet anschließend Checkpoint-Metadaten auf, die Verzweigungs- und Wiederherstellungsabläufe auf diesen komprimierten Nachfolger verweisen.
Nachfolgetranskripte entfernen außerdem exakt duplizierte lange Benutzereingaben, die innerhalb eines kurzen Wiederholungszeitfensters eintreffen, sodass durch Kanalwiederholungen verursachte Anfragestürme nach der Compaction nicht in das nächste aktive Transkript übernommen werden.

OpenClaw schreibt bei neuen Compactions keine separaten `.checkpoint.*.jsonl`-Kopien mehr. Vorhandene veraltete Checkpoint-Dateien können weiterhin verwendet werden, solange auf sie verwiesen wird, und werden durch die normale Sitzungsbereinigung entfernt.

### Compaction-Benachrichtigungen

Standardmäßig wird die Compaction ohne Benachrichtigungen ausgeführt. Legen Sie `notifyUser` fest, um kurze Statusmeldungen beim Start und Abschluss der Compaction anzuzeigen und einen Hinweis auf eingeschränkte Funktionalität auszugeben, wenn eine Speicherübertragung vor der Compaction ausgeschöpft ist, die Antwort aber dennoch fortgesetzt wird:

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

### Speicherübertragung

Vor der Compaction kann OpenClaw einen Durchlauf zur **stillen Speicherübertragung** ausführen, um dauerhafte Notizen auf dem Datenträger zu speichern. Legen Sie `agents.defaults.compaction.memoryFlush.model` fest, wenn für diesen Wartungsdurchlauf ein lokales Modell statt des aktiven Konversationsmodells verwendet werden soll:

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

Die Modellüberschreibung für die Speicherübertragung ist exakt und übernimmt nicht die Fallback-Kette der aktiven Sitzung. Einzelheiten und die Konfiguration finden Sie unter [Speicher](/de/concepts/memory).

## Austauschbare Compaction-Provider

Plugins können über `registerCompactionProvider()` in der Plugin-API einen benutzerdefinierten Compaction-Provider registrieren. Wenn ein Provider registriert und konfiguriert ist, delegiert OpenClaw die Zusammenfassung an ihn statt an die integrierte LLM-Pipeline.

Um einen registrierten Provider zu verwenden, legen Sie dessen ID in Ihrer Konfiguration fest:

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

Durch Festlegen eines `provider` wird automatisch `mode: "safeguard"` erzwungen. Provider erhalten dieselben Compaction-Anweisungen und dieselbe Richtlinie zur Beibehaltung von Bezeichnern wie der integrierte Pfad. OpenClaw behält nach der Provider-Ausgabe außerdem den Suffixkontext der letzten Eingaben und aufgeteilten Eingaben bei.

<Note>
Wenn der Provider fehlschlägt oder ein leeres Ergebnis zurückgibt, greift OpenClaw auf die integrierte LLM-Zusammenfassung zurück.
</Note>

## Compaction im Vergleich zur Bereinigung

|                  | Compaction                              | Bereinigung                                      |
| ---------------- | --------------------------------------- | ------------------------------------------------ |
| **Funktion**     | Fasst ältere Konversationen zusammen   | Kürzt alte Werkzeugergebnisse                    |
| **Gespeichert?** | Ja (im Sitzungstranskript)              | Nein (nur im Arbeitsspeicher, pro Anfrage)       |
| **Umfang**       | Gesamte Konversation                    | Nur Werkzeugergebnisse                           |

Die [Sitzungsbereinigung](/de/concepts/session-pruning) ist eine schlankere Ergänzung, die Werkzeugausgaben ohne Zusammenfassung kürzt.

## Fehlerbehebung

**Erfolgt die Compaction zu häufig?** Das Kontextfenster des Modells ist möglicherweise klein oder die Werkzeugausgaben sind möglicherweise groß. Versuchen Sie, die [Sitzungsbereinigung](/de/concepts/session-pruning) zu aktivieren.

**Wirkt der Kontext nach der Compaction veraltet?** Verwenden Sie `/compact Focus on <topic>`, um die Zusammenfassung zu steuern, oder aktivieren Sie die [Speicherübertragung](/de/concepts/memory), damit Notizen erhalten bleiben.

**Benötigen Sie einen Neuanfang?** `/new` startet eine neue Sitzung ohne Compaction.

Informationen zur erweiterten Konfiguration (reservierte Token, Beibehaltung von Bezeichnern, benutzerdefinierte Kontext-Engines, serverseitige Compaction von OpenAI) finden Sie unter [Ausführliche Erläuterung der Sitzungsverwaltung](/de/reference/session-management-compaction).

## Verwandte Themen

- [Sitzung](/de/concepts/session): Sitzungsverwaltung und Lebenszyklus.
- [Sitzungsbereinigung](/de/concepts/session-pruning): Kürzen von Werkzeugergebnissen.
- [Kontext](/de/concepts/context): Aufbau des Kontexts für Agentendurchläufe.
- [Hooks](/de/automation/hooks): Hooks für den Compaction-Lebenszyklus (`before_compaction`, `after_compaction`).
