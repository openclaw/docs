---
read_when:
    - Sie möchten Auto-Compaction und `/compact` verstehen
    - Sie debuggen lange Sitzungen, die an Kontextgrenzen stoßen
summary: Wie OpenClaw lange Unterhaltungen zusammenfasst, um innerhalb der Modellgrenzen zu bleiben
title: Compaction
x-i18n:
    generated_at: "2026-04-25T13:44:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e396a59d5346355cf2d87cd08ca8550877b103b1c613670fb3908fe1b028170
    source_path: concepts/compaction.md
    workflow: 15
---

Jedes Modell hat ein Kontextfenster – die maximale Anzahl von Tokens, die es verarbeiten kann.
Wenn sich eine Unterhaltung diesem Limit nähert, führt OpenClaw eine **Compaction** älterer Nachrichten
zu einer Zusammenfassung durch, damit der Chat fortgesetzt werden kann.

## Funktionsweise

1. Ältere Gesprächs-Turns werden zu einem kompakten Eintrag zusammengefasst.
2. Die Zusammenfassung wird im Sitzungsprotokoll gespeichert.
3. Neuere Nachrichten bleiben unverändert erhalten.

Wenn OpenClaw den Verlauf in Compaction-Blöcke aufteilt, hält es Tool-Aufrufe des Assistenten
mit ihren passenden `toolResult`-Einträgen zusammen. Wenn ein Teilungspunkt
innerhalb eines Tool-Blocks landet, verschiebt OpenClaw die Grenze, damit das Paar zusammenbleibt und
das aktuelle nicht zusammengefasste Ende erhalten bleibt.

Der vollständige Gesprächsverlauf bleibt auf dem Datenträger erhalten. Compaction ändert nur, was das
Modell beim nächsten Turn sieht.

## Auto-Compaction

Auto-Compaction ist standardmäßig aktiviert. Sie läuft, wenn sich die Sitzung dem Kontextlimit
nähert oder wenn das Modell einen Kontextüberlauffehler zurückgibt (in diesem Fall
führt OpenClaw eine Compaction durch und versucht es erneut). Typische Überlaufsignaturen sind
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model` und `ollama error: context length
exceeded`.

<Info>
Vor der Compaction erinnert OpenClaw den Agenten automatisch daran, wichtige
Notizen in [memory](/de/concepts/memory)-Dateien zu speichern. Das verhindert Kontextverlust.
</Info>

Verwenden Sie die Einstellung `agents.defaults.compaction` in Ihrer `openclaw.json`, um das Verhalten der Compaction zu konfigurieren (Modus, Ziel-Tokens usw.).
Die Compaction-Zusammenfassung bewahrt standardmäßig opake Bezeichner (`identifierPolicy: "strict"`). Sie können dies mit `identifierPolicy: "off"` überschreiben oder mit `identifierPolicy: "custom"` und `identifierInstructions` benutzerdefinierten Text angeben.

Sie können optional über `agents.defaults.compaction.model` ein anderes Modell für die Compaction-Zusammenfassung angeben. Das ist nützlich, wenn Ihr primäres Modell ein lokales oder kleines Modell ist und Sie möchten, dass Compaction-Zusammenfassungen von einem leistungsfähigeren Modell erzeugt werden. Die Überschreibung akzeptiert jede Zeichenfolge im Format `provider/model-id`:

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

Das funktioniert auch mit lokalen Modellen, zum Beispiel mit einem zweiten Ollama-Modell speziell für Zusammenfassungen oder einem feinabgestimmten Compaction-Spezialisten:

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

## Austauschbare Compaction-Provider

Plugins können über `registerCompactionProvider()` in der Plugin-API einen benutzerdefinierten Compaction-Provider registrieren. Wenn ein Provider registriert und konfiguriert ist, delegiert OpenClaw die Zusammenfassung an ihn statt an die eingebaute LLM-Pipeline.

Um einen registrierten Provider zu verwenden, setzen Sie die Provider-ID in Ihrer Konfiguration:

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

Das Setzen eines `provider` erzwingt automatisch `mode: "safeguard"`. Provider erhalten dieselben Compaction-Anweisungen und dieselbe Richtlinie zur Bezeichnerbewahrung wie der eingebaute Pfad, und OpenClaw bewahrt auch nach der Provider-Ausgabe weiterhin den Kontext der neueren Turns und des nach einer Teilung verbleibenden Suffixes. Wenn der Provider fehlschlägt oder ein leeres Ergebnis zurückgibt, greift OpenClaw auf die eingebaute LLM-Zusammenfassung zurück.

## Auto-Compaction (standardmäßig aktiviert)

Wenn sich eine Sitzung dem Kontextfenster des Modells nähert oder es überschreitet, löst OpenClaw Auto-Compaction aus und versucht die ursprüngliche Anfrage möglicherweise mit dem kompaktierten Kontext erneut.

Sie sehen:

- `🧹 Auto-compaction complete` im ausführlichen Modus
- `/status` zeigt `🧹 Compactions: <count>`

Vor der Compaction kann OpenClaw einen **stillen Memory-Flush**-Turn ausführen, um
dauerhafte Notizen auf dem Datenträger zu speichern. Siehe [Memory](/de/concepts/memory) für Details und Konfiguration.

## Manuelle Compaction

Geben Sie in einem beliebigen Chat `/compact` ein, um eine Compaction zu erzwingen. Fügen Sie Anweisungen hinzu, um
die Zusammenfassung zu steuern:

```
/compact Focus on the API design decisions
```

Wenn `agents.defaults.compaction.keepRecentTokens` gesetzt ist, berücksichtigt die manuelle Compaction
diesen Pi-Schnittpunkt und behält das neuere Ende im neu aufgebauten Kontext bei. Ohne
ein explizites Beibehaltungsbudget verhält sich die manuelle Compaction wie ein harter Checkpoint und
setzt nur mit der neuen Zusammenfassung fort.

## Ein anderes Modell verwenden

Standardmäßig verwendet Compaction das primäre Modell Ihres Agenten. Sie können ein leistungsfähigeres
Modell für bessere Zusammenfassungen verwenden:

```json5
{
  agents: {
    defaults: {
      compaction: {
        model: "openrouter/anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

## Compaction-Hinweise

Standardmäßig läuft Compaction still im Hintergrund. Um kurze Hinweise anzuzeigen, wenn die Compaction
startet und wenn sie abgeschlossen ist, aktivieren Sie `notifyUser`:

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

Wenn aktiviert, sieht der Benutzer kurze Statusmeldungen rund um jeden Compaction-Durchlauf
(zum Beispiel „Kontext wird kompaktiert ...“ und „Compaction abgeschlossen“).

## Compaction vs. Pruning

|                  | Compaction                          | Pruning                              |
| ---------------- | ----------------------------------- | ------------------------------------ |
| **Was es tut**   | Fasst ältere Unterhaltung zusammen  | Schneidet alte Tool-Ergebnisse ab    |
| **Gespeichert?** | Ja (im Sitzungsprotokoll)           | Nein (nur im Speicher, pro Anfrage)  |
| **Umfang**       | Gesamte Unterhaltung                | Nur Tool-Ergebnisse                  |

[Session pruning](/de/concepts/session-pruning) ist eine leichtgewichtigere Ergänzung, die
Tool-Ausgaben kürzt, ohne sie zusammenzufassen.

## Fehlerbehebung

**Zu häufige Compaction?** Das Kontextfenster des Modells ist möglicherweise klein, oder Tool-
Ausgaben sind möglicherweise groß. Versuchen Sie,
[Session pruning](/de/concepts/session-pruning) zu aktivieren.

**Der Kontext wirkt nach der Compaction veraltet?** Verwenden Sie `/compact Focus on <topic>`, um
die Zusammenfassung zu steuern, oder aktivieren Sie den [Memory-Flush](/de/concepts/memory), damit Notizen
erhalten bleiben.

**Sie brauchen einen kompletten Neustart?** `/new` startet eine neue Sitzung ohne Compaction.

Für erweiterte Konfiguration (Reserve-Tokens, Bezeichnerbewahrung, benutzerdefinierte
Kontext-Engines, serverseitige OpenAI-Compaction) siehe den
[Session Management Deep Dive](/de/reference/session-management-compaction).

## Verwandt

- [Session](/de/concepts/session) — Sitzungsverwaltung und Lebenszyklus
- [Session Pruning](/de/concepts/session-pruning) — Kürzen von Tool-Ergebnissen
- [Context](/de/concepts/context) — wie Kontext für Agenten-Turns aufgebaut wird
- [Hooks](/de/automation/hooks) — Hooks für den Compaction-Lebenszyklus (before_compaction, after_compaction)
