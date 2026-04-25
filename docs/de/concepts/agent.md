---
read_when:
    - Agent-Laufzeit, Workspace-Bootstrap oder Sitzungsverhalten ändern
summary: Agent-Laufzeit, Workspace-Vertrag und Sitzungs-Bootstrap
title: Agent-Laufzeit
x-i18n:
    generated_at: "2026-04-25T13:44:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37483fdb62d41a8f888bd362db93078dc8ecb8bb3fd19270b0234689aa82f309
    source_path: concepts/agent.md
    workflow: 15
---

OpenClaw führt eine **einzelne eingebettete Agent-Laufzeit** aus — einen Agent-Prozess pro
Gateway, mit eigenem Workspace, Bootstrap-Dateien und Sitzungsspeicher. Diese Seite
behandelt diesen Laufzeitvertrag: was der Workspace enthalten muss, welche Dateien
injiziert werden und wie Sitzungen dagegen gebootstrapped werden.

## Workspace (erforderlich)

OpenClaw verwendet ein einzelnes Agent-Workspace-Verzeichnis (`agents.defaults.workspace`) als das **einzige** Arbeitsverzeichnis (`cwd`) des Agenten für Tools und Kontext.

Empfohlen: Verwenden Sie `openclaw setup`, um `~/.openclaw/openclaw.json` zu erstellen, falls es fehlt, und die Workspace-Dateien zu initialisieren.

Vollständiges Workspace-Layout + Backup-Leitfaden: [Agent-Workspace](/de/concepts/agent-workspace)

Wenn `agents.defaults.sandbox` aktiviert ist, können Nicht-Hauptsitzungen dies mit
sitzungsspezifischen Workspaces unter `agents.defaults.sandbox.workspaceRoot` überschreiben (siehe
[Gateway-Konfiguration](/de/gateway/configuration)).

## Bootstrap-Dateien (injiziert)

Innerhalb von `agents.defaults.workspace` erwartet OpenClaw diese vom Benutzer bearbeitbaren Dateien:

- `AGENTS.md` — Betriebsanweisungen + „Memory“
- `SOUL.md` — Persona, Grenzen, Ton
- `TOOLS.md` — vom Benutzer gepflegte Tool-Hinweise (z. B. `imsg`, `sag`, Konventionen)
- `BOOTSTRAP.md` — einmaliges Ritual beim ersten Lauf (wird nach Abschluss gelöscht)
- `IDENTITY.md` — Agentenname/Vibe/Emoji
- `USER.md` — Benutzerprofil + bevorzugte Anrede

Beim ersten Turn einer neuen Sitzung injiziert OpenClaw den Inhalt dieser Dateien direkt in den Agentenkontext.

Leere Dateien werden übersprungen. Große Dateien werden gekürzt und mit einer Markierung abgeschnitten, damit Prompts kompakt bleiben (lesen Sie die Datei für den vollständigen Inhalt).

Wenn eine Datei fehlt, injiziert OpenClaw eine einzelne Markerzeile „missing file“ (und `openclaw setup` erstellt eine sichere Standardvorlage).

`BOOTSTRAP.md` wird nur für einen **brandneuen Workspace** erstellt (keine anderen Bootstrap-Dateien vorhanden). Wenn Sie sie nach Abschluss des Rituals löschen, sollte sie bei späteren Neustarts nicht erneut erstellt werden.

Um die Erstellung von Bootstrap-Dateien vollständig zu deaktivieren (für vorab befüllte Workspaces), setzen Sie:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Integrierte Tools

Core-Tools (read/exec/edit/write und verwandte System-Tools) sind immer verfügbar,
vorbehaltlich der Tool-Richtlinie. `apply_patch` ist optional und wird durch
`tools.exec.applyPatch` gesteuert. `TOOLS.md` steuert **nicht**, welche Tools existieren; es ist
eine Anleitung dafür, wie _Sie_ sie verwendet haben möchten.

## Skills

OpenClaw lädt Skills aus diesen Orten (höchste Priorität zuerst):

- Workspace: `<workspace>/skills`
- Projekt-Agent-Skills: `<workspace>/.agents/skills`
- Persönliche Agent-Skills: `~/.agents/skills`
- Verwaltet/lokal: `~/.openclaw/skills`
- Gebündelt (mit der Installation ausgeliefert)
- Zusätzliche Skill-Ordner: `skills.load.extraDirs`

Skills können durch Konfiguration/Umgebungsvariablen gesteuert werden (siehe `skills` in [Gateway-Konfiguration](/de/gateway/configuration)).

## Laufzeitgrenzen

Die eingebettete Agent-Laufzeit basiert auf dem Pi-Agent-Core (Modelle, Tools und
Prompt-Pipeline). Sitzungsverwaltung, Discovery, Tool-Verdrahtung und Kanal-
Zustellung sind OpenClaw-eigene Schichten über diesem Core.

## Sitzungen

Sitzungstranskripte werden als JSONL gespeichert unter:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

Die Sitzungs-ID ist stabil und wird von OpenClaw gewählt.
Veraltete Sitzungsordner anderer Tools werden nicht gelesen.

## Steuerung während des Streamings

Wenn der Queue-Modus `steer` ist, werden eingehende Nachrichten in den aktuellen Lauf injiziert.
Eingereihte Steuerung wird **nachdem der aktuelle Assistenten-Turn seine Tool-Aufrufe abgeschlossen hat**
und vor dem nächsten LLM-Aufruf zugestellt. Steuerung überspringt keine
verbleibenden Tool-Aufrufe aus der aktuellen Assistentennachricht mehr; stattdessen wird die eingereihte
Nachricht an der nächsten Modellgrenze injiziert.

Wenn der Queue-Modus `followup` oder `collect` ist, werden eingehende Nachrichten bis zum
Ende des aktuellen Turns zurückgehalten, dann startet ein neuer Agent-Turn mit den
eingereihten Payloads. Siehe [Queue](/de/concepts/queue) für Verhalten von Modus + Debounce/Cap.

Block-Streaming sendet abgeschlossene Assistentenblöcke, sobald sie fertig sind; es ist
**standardmäßig deaktiviert** (`agents.defaults.blockStreamingDefault: "off"`).
Passen Sie die Grenze über `agents.defaults.blockStreamingBreak` an (`text_end` vs `message_end`; Standard ist text_end).
Steuern Sie weiches Block-Chunking mit `agents.defaults.blockStreamingChunk` (Standard
800–1200 Zeichen; bevorzugt Absatzumbrüche, dann neue Zeilen; Sätze zuletzt).
Fassen Sie gestreamte Chunks mit `agents.defaults.blockStreamingCoalesce` zusammen, um
Spam mit einzelnen Zeilen zu reduzieren (zusammenführen nach Leerlauf vor dem Senden). Nicht-Telegram-
Kanäle erfordern explizit `*.blockStreaming: true`, um Block-Antworten zu aktivieren.
Ausführliche Tool-Zusammenfassungen werden beim Start des Tools ausgegeben (ohne Debounce); die Control UI
streamt Tool-Ausgaben über Agent-Ereignisse, wenn verfügbar.
Weitere Details: [Streaming + Chunking](/de/concepts/streaming).

## Modell-Refs

Modell-Refs in der Konfiguration (zum Beispiel `agents.defaults.model` und `agents.defaults.models`) werden durch Aufteilen am **ersten** `/` geparst.

- Verwenden Sie `provider/model`, wenn Sie Modelle konfigurieren.
- Wenn die Modell-ID selbst `/` enthält (im Stil von OpenRouter), fügen Sie das Provider-Präfix hinzu (Beispiel: `openrouter/moonshotai/kimi-k2`).
- Wenn Sie den Provider weglassen, versucht OpenClaw zuerst einen Alias, dann eine eindeutige
  Zuordnung zu einem konfigurierten Provider für genau diese Modell-ID und greift erst dann
  auf den konfigurierten Standard-Provider zurück. Wenn dieser Provider das
  konfigurierte Standardmodell nicht mehr bereitstellt, greift OpenClaw auf das erste konfigurierte
  Provider-/Modellpaar zurück, anstatt einen veralteten Standard eines entfernten Providers anzuzeigen.

## Konfiguration (minimal)

Setzen Sie mindestens:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (dringend empfohlen)

---

_Next: [Gruppenchats](/de/channels/group-messages)_ 🦞

## Verwandt

- [Agent-Workspace](/de/concepts/agent-workspace)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Sitzungsverwaltung](/de/concepts/session)
