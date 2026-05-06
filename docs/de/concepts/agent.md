---
read_when:
    - Ändern der Agentenlaufzeit, der Arbeitsbereichsinitialisierung oder des Sitzungsverhaltens
summary: Agent-Laufzeitumgebung, Arbeitsbereichsvertrag und Sitzungsinitialisierung
title: Agent-Laufzeit
x-i18n:
    generated_at: "2026-05-06T06:42:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 372cf6a02b35646c24e68d96938bba57721eeec512e17c2d40c8e721e7561bd1
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw führt eine **einzige eingebettete Agent-Runtime** aus - einen Agent-Prozess pro
Gateway, mit eigenem Arbeitsbereich, Bootstrap-Dateien und Sitzungsspeicher. Diese Seite
behandelt diesen Runtime-Vertrag: was der Arbeitsbereich enthalten muss, welche Dateien
injiziert werden und wie Sitzungen dagegen bootstrappen.

## Arbeitsbereich (erforderlich)

OpenClaw verwendet ein einzelnes Agent-Arbeitsbereichsverzeichnis (`agents.defaults.workspace`) als das **einzige** Arbeitsverzeichnis (`cwd`) des Agents für Tools und Kontext.

Empfohlen: Verwenden Sie `openclaw setup`, um `~/.openclaw/openclaw.json` zu erstellen, falls die Datei fehlt, und die Arbeitsbereichsdateien zu initialisieren.

Vollständiges Arbeitsbereichslayout + Backup-Anleitung: [Agent-Arbeitsbereich](/de/concepts/agent-workspace)

Wenn `agents.defaults.sandbox` aktiviert ist, können Nicht-Hauptsitzungen dies mit
sitzungsspezifischen Arbeitsbereichen unter `agents.defaults.sandbox.workspaceRoot` überschreiben (siehe
[Gateway-Konfiguration](/de/gateway/configuration)).

## Bootstrap-Dateien (injiziert)

Innerhalb von `agents.defaults.workspace` erwartet OpenClaw diese vom Benutzer bearbeitbaren Dateien:

- `AGENTS.md` - Betriebsanweisungen + „Memory“
- `SOUL.md` - Persona, Grenzen, Ton
- `TOOLS.md` - benutzerverwaltete Tool-Notizen (z. B. `imsg`, `sag`, Konventionen)
- `BOOTSTRAP.md` - einmaliges Erststart-Ritual (nach Abschluss gelöscht)
- `IDENTITY.md` - Agent-Name/Vibe/Emoji
- `USER.md` - Benutzerprofil + bevorzugte Anrede

Beim ersten Turn einer neuen Sitzung injiziert OpenClaw die Inhalte dieser Dateien in den Project Context des System-Prompts.

Leere Dateien werden übersprungen. Große Dateien werden gekürzt und mit einer Markierung abgeschnitten, damit Prompts schlank bleiben (lesen Sie die Datei für den vollständigen Inhalt).

Wenn eine Datei fehlt, injiziert OpenClaw eine einzelne Markierungszeile „fehlende Datei“ (und `openclaw setup` erstellt eine sichere Standardvorlage).

`BOOTSTRAP.md` wird nur für einen **brandneuen Arbeitsbereich** erstellt (keine anderen Bootstrap-Dateien vorhanden). Solange sie aussteht, behält OpenClaw sie im Project Context und fügt dem System-Prompt Bootstrap-Anleitung für das anfängliche Ritual hinzu, anstatt sie in die Benutzernachricht zu kopieren. Wenn Sie sie nach Abschluss des Rituals löschen, sollte sie bei späteren Neustarts nicht erneut erstellt werden.

Um die Erstellung von Bootstrap-Dateien vollständig zu deaktivieren (für vorbefüllte Arbeitsbereiche), legen Sie Folgendes fest:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Integrierte Tools

Kern-Tools (Lesen/Ausführen/Bearbeiten/Schreiben und zugehörige System-Tools) sind immer verfügbar,
vorbehaltlich der Tool-Richtlinie. `apply_patch` ist optional und wird durch
`tools.exec.applyPatch` gesteuert. `TOOLS.md` steuert **nicht**, welche Tools existieren; es ist
Anleitung dafür, wie _Sie_ möchten, dass sie verwendet werden.

## Skills

OpenClaw lädt Skills aus diesen Speicherorten (höchste Priorität zuerst):

- Arbeitsbereich: `<workspace>/skills`
- Projekt-Agent-Skills: `<workspace>/.agents/skills`
- Persönliche Agent-Skills: `~/.agents/skills`
- Verwaltet/lokal: `~/.openclaw/skills`
- Gebündelt (mit der Installation ausgeliefert)
- Zusätzliche Skill-Ordner: `skills.load.extraDirs`

Skills können durch Konfiguration/Env gesteuert werden (siehe `skills` in der [Gateway-Konfiguration](/de/gateway/configuration)).

## Runtime-Grenzen

Die eingebettete Agent-Runtime basiert auf dem Pi-Agent-Kern (Modelle, Tools und
Prompt-Pipeline). Sitzungsverwaltung, Discovery, Tool-Verdrahtung und Kanalzustellung
sind OpenClaw-eigene Schichten über diesem Kern.

## Sitzungen

Sitzungstranskripte werden als JSONL gespeichert unter:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

Die Sitzungs-ID ist stabil und wird von OpenClaw ausgewählt.
Legacy-Sitzungsordner anderer Tools werden nicht gelesen.

## Steuern während des Streamings

Wenn der Warteschlangenmodus `steer` ist, werden eingehende Nachrichten in den aktuellen Lauf injiziert.
Steering in der Warteschlange wird **zugestellt, nachdem der aktuelle Assistant-Turn die Ausführung seiner Tool-Aufrufe beendet hat**,
vor dem nächsten LLM-Aufruf. Pi leert alle ausstehenden
Steering-Nachrichten gemeinsam für `steer`; Legacy-`queue` leert eine Nachricht pro
Modellgrenze. Steering überspringt nicht mehr verbleibende Tool-Aufrufe aus der aktuellen
Assistant-Nachricht.

Wenn der Warteschlangenmodus `followup` oder `collect` ist, werden eingehende Nachrichten gehalten, bis der
aktuelle Turn endet; anschließend startet ein neuer Agent-Turn mit den wartenden Payloads. Siehe
[Warteschlange](/de/concepts/queue) und [Steering-Warteschlange](/de/concepts/queue-steering) für Modus-
und Grenzverhalten.

Block-Streaming sendet abgeschlossene Assistant-Blöcke, sobald sie fertig sind; es ist
**standardmäßig deaktiviert** (`agents.defaults.blockStreamingDefault: "off"`).
Stellen Sie die Grenze über `agents.defaults.blockStreamingBreak` ein (`text_end` vs `message_end`; Standard ist text_end).
Steuern Sie weiches Block-Chunking mit `agents.defaults.blockStreamingChunk` (standardmäßig
800-1200 Zeichen; bevorzugt Absatzumbrüche, dann Zeilenumbrüche; Sätze zuletzt).
Fassen Sie gestreamte Chunks mit `agents.defaults.blockStreamingCoalesce` zusammen, um
einzeiligen Spam zu reduzieren (inaktivitätsbasierte Zusammenführung vor dem Senden). Nicht-Telegram-Kanäle erfordern
explizit `*.blockStreaming: true`, um Block-Antworten zu aktivieren.
Ausführliche Tool-Zusammenfassungen werden beim Tool-Start ausgegeben (kein Debounce); die Control UI
streamt Tool-Ausgaben über Agent-Events, wenn verfügbar.
Weitere Details: [Streaming + Chunking](/de/concepts/streaming).

## Modell-Refs

Modell-Refs in der Konfiguration (zum Beispiel `agents.defaults.model` und `agents.defaults.models`) werden geparst, indem am **ersten** `/` getrennt wird.

- Verwenden Sie `provider/model`, wenn Sie Modelle konfigurieren.
- Wenn die Modell-ID selbst `/` enthält (OpenRouter-Stil), fügen Sie das Provider-Präfix hinzu (Beispiel: `openrouter/moonshotai/kimi-k2`).
- Wenn Sie den Provider weglassen, versucht OpenClaw zuerst einen Alias, dann einen eindeutigen
  Treffer eines konfigurierten Providers für genau diese Modell-ID und fällt erst dann
  auf den konfigurierten Standard-Provider zurück. Wenn dieser Provider das
  konfigurierte Standardmodell nicht mehr anbietet, fällt OpenClaw auf das erste konfigurierte
  Provider/Modell zurück, anstatt einen veralteten Standard eines entfernten Providers offenzulegen.

## Konfiguration (minimal)

Legen Sie mindestens Folgendes fest:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (dringend empfohlen)

---

_Weiter: [Gruppenchats](/de/channels/group-messages)_ 🦞

## Verwandt

- [Agent-Arbeitsbereich](/de/concepts/agent-workspace)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Sitzungsverwaltung](/de/concepts/session)
