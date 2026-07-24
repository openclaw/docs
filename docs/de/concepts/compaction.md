---
read_when:
    - Sie möchten die automatische Compaction und `/compact` verstehen
    - Sie debuggen lange Sitzungen, die an Kontextgrenzen stoßen
summary: Wie OpenClaw lange Unterhaltungen zusammenfasst, um die Modelllimits einzuhalten
title: Compaction
x-i18n:
    generated_at: "2026-07-24T04:21:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: eb1f794fa60affd602378bcff8b07786bfeca55ab3fa09d5fa7214a05fa48806
    source_path: concepts/compaction.md
    workflow: 16
---

Jedes Modell hat ein Kontextfenster: die maximale Anzahl an Tokens, die es verarbeiten kann. Wenn sich eine Unterhaltung diesem Limit nähert, fasst OpenClaw ältere Nachrichten durch **Compaction** zusammen, damit der Chat fortgesetzt werden kann.

## Funktionsweise

1. Ältere Gesprächsrunden werden in einem kompakten Eintrag zusammengefasst.
2. Die Zusammenfassung wird im Sitzungstranskript gespeichert.
3. Neuere Nachrichten bleiben unverändert erhalten.

OpenClaw hält Tool-Aufrufe des Assistenten mit den zugehörigen `toolResult`-Einträgen zusammen, wenn es einen Trennpunkt für die Compaction auswählt. Falls der Punkt innerhalb eines Tool-Blocks liegt, verschiebt OpenClaw die Grenze, damit das Paar zusammenbleibt und der aktuelle, nicht zusammengefasste Rest erhalten bleibt.

Der vollständige Gesprächsverlauf bleibt auf der Festplatte gespeichert. Die Compaction ändert nur, was das Modell in der nächsten Gesprächsrunde sieht.

<Note>
Neue Konfigurationen setzen `agents.defaults.compaction.mode` standardmäßig auf `"safeguard"` (strengere Schutzmechanismen, Qualitätsprüfungen für Zusammenfassungen). Setzen Sie `mode: "default"` ausdrücklich, um dies zu deaktivieren.
</Note>

## Automatische Compaction

Die automatische Compaction ist standardmäßig aktiviert. Sie wird ausgeführt, wenn sich die Sitzung dem Kontextlimit nähert oder das Modell einen Kontextüberlauffehler zurückgibt. In diesem Fall führt OpenClaw eine Compaction durch und versucht es erneut.

Folgendes wird angezeigt:

- `embedded run auto-compaction start` / `complete` in normalen Gateway-Protokollen.
- `🧹 Auto-compaction complete` im ausführlichen Modus.
- `/status` mit `🧹 Compactions: <count>`.

<Info>
Vor der Compaction erinnert OpenClaw den Agenten automatisch daran, wichtige Notizen in [Speicherdateien](/de/concepts/memory) zu sichern. Dies verhindert Kontextverlust.
</Info>

<AccordionGroup>
  <Accordion title="Von OpenClaw erkannte Muster für Überlauffehler">
    OpenClaw gleicht Dutzende providerspezifische Fehlermeldungen für Überläufe ab (Anthropic, OpenAI, Bedrock, Gemini, Ollama, OpenRouter und weitere). Häufige Beispiele:

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

Wenn `agents.defaults.compaction.keepRecentTokens` festgelegt ist (Standard: 20,000), berücksichtigt die manuelle Compaction diesen Trennpunkt und behält den neueren Rest im neu aufgebauten Kontext bei. Ohne explizites Beibehaltungsbudget verhält sich die manuelle Compaction wie ein fester Prüfpunkt und wird ausschließlich mit der neuen Zusammenfassung fortgesetzt.

## Konfiguration

Konfigurieren Sie die Compaction unter `agents.defaults.compaction` in Ihrer `openclaw.json`. Die gebräuchlichsten Einstellungen sind nachfolgend aufgeführt. Die vollständige Referenz finden Sie unter [Ausführliche Erläuterung der Sitzungsverwaltung](/de/reference/session-management-compaction).

### Anderes Modell verwenden

Standardmäßig verwendet die Compaction das primäre Modell des Agenten. Legen Sie `agents.defaults.compaction.model` fest, um die Zusammenfassung an ein leistungsfähigeres oder spezialisiertes Modell zu delegieren. Die Überschreibung akzeptiert eine `provider/model-id`-Zeichenfolge oder einen einfachen, unter `agents.defaults.models` konfigurierten Alias:

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

Einfache konfigurierte Aliasse werden vor Beginn der Compaction in ihren kanonischen Provider und ihr kanonisches Modell aufgelöst. Wenn ein einfacher Wert sowohl mit einem Alias als auch mit einer konfigurierten wörtlichen Modell-ID übereinstimmt, hat die wörtliche Modell-ID Vorrang. Ein nicht übereinstimmender einfacher Wert bleibt eine Modell-ID beim aktiven Provider.

Dies funktioniert auch mit lokalen Modellen, beispielsweise mit einem zweiten Ollama-Modell, das ausschließlich für Zusammenfassungen verwendet wird:

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

Wenn keine Einstellung vorhanden ist, beginnt die Compaction mit dem aktiven Sitzungsmodell. Falls die Zusammenfassung aufgrund eines Providerfehlers fehlschlägt, der einen Modell-Fallback zulässt, versucht OpenClaw diesen Compaction-Vorgang über die bestehende Modell-Fallback-Kette der Sitzung erneut. Die Fallback-Auswahl ist temporär und wird nicht in den Sitzungsstatus zurückgeschrieben. Eine explizite Überschreibung durch `agents.defaults.compaction.model` bleibt exakt und übernimmt nicht die Fallback-Kette der Sitzung.

### Beibehaltung von Bezeichnern

Die Compaction-Zusammenfassung behält standardmäßig undurchsichtige Bezeichner bei (`identifierPolicy: "strict"`). Überschreiben Sie dies mit `identifierPolicy: "off"`, um es zu deaktivieren. Benutzerdefinierte Vorgaben gehören in die `summarize()`-Implementierung eines Compaction-Providers.

### Byte-Schutz für das aktive Transkript

Wenn `agents.defaults.compaction.maxActiveTranscriptBytes` festgelegt ist, löst OpenClaw
vor einer Ausführung die normale lokale Compaction aus, sobald der Transkriptverlauf
diese Größe erreicht. Dies ist für lang laufende Sitzungen nützlich, bei denen die
providerseitige Kontextverwaltung den Modellkontext möglicherweise intakt hält,
während der dauerhaft gespeicherte Transkriptverlauf weiter wächst. Dabei werden
keine Rohbytes getrennt; stattdessen wird die normale Compaction-Pipeline
aufgefordert, eine semantische Zusammenfassung zu erstellen.

<Warning>
Der Byte-Schutz gilt für den aktiven SQLite-Transkriptverlauf. Veraltete
JSONL-Prüfpunktartefakte sind nicht das aktive Ziel der Compaction.
</Warning>

### Nachfolgetranskripte

Wenn `agents.defaults.compaction.truncateAfterCompaction` aktiviert ist, schreibt OpenClaw das vorhandene Transkript nicht direkt um. Es erstellt aus der Compaction-Zusammenfassung, dem beibehaltenen Status und dem nicht zusammengefassten Rest ein neues aktives Nachfolgetranskript und zeichnet anschließend Prüfpunktmetadaten auf, die Verzweigungs- und Wiederherstellungsabläufe auf diesen kompaktierten Nachfolger verweisen.
Nachfolgetranskripte entfernen außerdem exakt duplizierte lange Benutzereingaben,
die innerhalb eines kurzen Wiederholungsfensters eingehen, sodass durch Kanäle
verursachte Wiederholungsstürme nach der Compaction nicht in das nächste aktive
Transkript übernommen werden.

OpenClaw schreibt für neue Compactions keine separaten Kopien von
`.checkpoint.*.jsonl` mehr. Vorhandene veraltete Prüfpunktdateien können weiterhin
verwendet werden, solange auf sie verwiesen wird, und werden durch die normale
Sitzungsbereinigung entfernt.

### Compaction-Hinweise

Standardmäßig wird die Compaction ohne Meldung ausgeführt. Setzen Sie `notifyUser`, um kurze Statusmeldungen beim Start und Abschluss der Compaction anzuzeigen und einen Hinweis auf eingeschränkte Funktion bereitzustellen, wenn eine Speicherleerung vor der Compaction ausgeschöpft ist, die Antwort jedoch trotzdem fortgesetzt wird:

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

### Speicherleerung

Vor der Compaction kann OpenClaw eine Gesprächsrunde zur **stillen Speicherleerung** ausführen, um dauerhafte Notizen auf der Festplatte zu speichern. Setzen Sie `agents.defaults.compaction.memoryFlush.model`, wenn diese Verwaltungsrunde anstelle des aktiven Gesprächsmodells ein lokales Modell verwenden soll:

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

Die Modellüberschreibung für die Speicherleerung ist exakt und übernimmt nicht die Fallback-Kette der aktiven Sitzung. Einzelheiten und Konfigurationsinformationen finden Sie unter [Speicher](/de/concepts/memory).

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

Das Festlegen eines `provider` erzwingt automatisch `mode: "safeguard"`. Provider erhalten dieselben Compaction-Anweisungen und dieselbe Richtlinie zur Beibehaltung von Bezeichnern wie der integrierte Pfad. OpenClaw behält außerdem nach der Provider-Ausgabe den Suffixkontext neuerer und aufgeteilter Gesprächsrunden bei.

<Note>
Falls der Provider fehlschlägt oder ein leeres Ergebnis zurückgibt, greift OpenClaw auf die integrierte LLM-Zusammenfassung zurück.
</Note>

## Compaction im Vergleich zur Bereinigung

|                  | Compaction                              | Bereinigung                                  |
| ---------------- | --------------------------------------- | -------------------------------------------- |
| **Funktion**     | Fasst ältere Unterhaltungen zusammen    | Kürzt alte Tool-Ergebnisse                    |
| **Gespeichert?** | Ja (im Sitzungstranskript)              | Nein (nur im Arbeitsspeicher, pro Anfrage)    |
| **Umfang**       | Gesamte Unterhaltung                    | Nur Tool-Ergebnisse                           |

Die [Sitzungsbereinigung](/de/concepts/session-pruning) ist eine schlankere Ergänzung, die Tool-Ausgaben ohne Zusammenfassung kürzt.

## Fehlerbehebung

**Compaction zu häufig?** Das Kontextfenster des Modells ist möglicherweise klein oder die Tool-Ausgaben sind möglicherweise umfangreich. Versuchen Sie, die [Sitzungsbereinigung](/de/concepts/session-pruning) zu aktivieren.

**Wirkt der Kontext nach der Compaction veraltet?** Verwenden Sie `/compact Focus on <topic>`, um die Zusammenfassung zu steuern, oder aktivieren Sie die [Speicherleerung](/de/concepts/memory), damit Notizen erhalten bleiben.

**Benötigen Sie einen Neuanfang?** `/new` startet eine neue Sitzung ohne Compaction.

Informationen zur erweiterten Konfiguration (reservierte Tokens, Beibehaltung von Bezeichnern, benutzerdefinierte Kontext-Engines, serverseitige Compaction von OpenAI) finden Sie in der [ausführlichen Erläuterung der Sitzungsverwaltung](/de/reference/session-management-compaction).

## Verwandte Themen

- [Sitzung](/de/concepts/session): Sitzungsverwaltung und Lebenszyklus.
- [Sitzungsbereinigung](/de/concepts/session-pruning): Kürzen von Tool-Ergebnissen.
- [Kontext](/de/concepts/context): Aufbau des Kontexts für Agentenrunden.
- [Hooks](/de/automation/hooks): Hooks für den Compaction-Lebenszyklus (`before_compaction`, `after_compaction`).
