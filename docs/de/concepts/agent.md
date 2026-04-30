---
read_when:
    - Ändern der Agent-Laufzeit, des Workspace-Bootstraps oder des Sitzungsverhaltens
summary: Agent-Laufzeit, Workspace-Vertrag und Sitzungsinitialisierung
title: Agent-Laufzeitumgebung
x-i18n:
    generated_at: "2026-04-30T06:47:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4d65ee96cece296251d7d3a0512f12d2dfa900db0e5ffc0f37dcddae7ea55ad
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw führt eine **einzelne eingebettete Agent-Runtime** aus — einen Agent-Prozess pro
Gateway, mit eigenem Workspace, Bootstrap-Dateien und Sitzungsspeicher. Diese Seite
behandelt diesen Runtime-Vertrag: was der Workspace enthalten muss, welche Dateien
injiziert werden und wie Sitzungen dagegen bootstrappen.

## Workspace (erforderlich)

OpenClaw verwendet ein einzelnes Agent-Workspace-Verzeichnis (`agents.defaults.workspace`) als das **einzige** Arbeitsverzeichnis (`cwd`) des Agent für Tools und Kontext.

Empfohlen: Verwenden Sie `openclaw setup`, um `~/.openclaw/openclaw.json` zu erstellen, falls sie fehlt, und die Workspace-Dateien zu initialisieren.

Vollständiges Workspace-Layout + Backup-Leitfaden: [Agent-Workspace](/de/concepts/agent-workspace)

Wenn `agents.defaults.sandbox` aktiviert ist, können Nicht-Hauptsitzungen dies mit
sitzungsspezifischen Workspaces unter `agents.defaults.sandbox.workspaceRoot` überschreiben (siehe
[Gateway-Konfiguration](/de/gateway/configuration)).

## Bootstrap-Dateien (injiziert)

Innerhalb von `agents.defaults.workspace` erwartet OpenClaw diese vom Benutzer editierbaren Dateien:

- `AGENTS.md` — Betriebsanweisungen + „Memory“
- `SOUL.md` — Persona, Grenzen, Ton
- `TOOLS.md` — vom Benutzer gepflegte Tool-Notizen (z. B. `imsg`, `sag`, Konventionen)
- `BOOTSTRAP.md` — einmaliges Ritual beim ersten Start (nach Abschluss gelöscht)
- `IDENTITY.md` — Agent-Name/Vibe/Emoji
- `USER.md` — Benutzerprofil + bevorzugte Anrede

Beim ersten Turn einer neuen Sitzung injiziert OpenClaw den Inhalt dieser Dateien direkt in den Agent-Kontext.

Leere Dateien werden übersprungen. Große Dateien werden gekürzt und mit einer Markierung abgeschnitten, damit Prompts schlank bleiben (lesen Sie die Datei für den vollständigen Inhalt).

Wenn eine Datei fehlt, injiziert OpenClaw eine einzelne „fehlende Datei“-Markierungszeile (und `openclaw setup` erstellt eine sichere Standardvorlage).

`BOOTSTRAP.md` wird nur für einen **brandneuen Workspace** erstellt (keine anderen Bootstrap-Dateien vorhanden). Wenn Sie sie nach Abschluss des Rituals löschen, sollte sie bei späteren Neustarts nicht neu erstellt werden.

Um die Erstellung von Bootstrap-Dateien vollständig zu deaktivieren (für vorbefüllte Workspaces), setzen Sie:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Integrierte Tools

Core-Tools (read/exec/edit/write und verwandte System-Tools) sind immer verfügbar,
vorbehaltlich der Tool-Richtlinie. `apply_patch` ist optional und durch
`tools.exec.applyPatch` gesteuert. `TOOLS.md` steuert **nicht**, welche Tools vorhanden sind; es ist
eine Anleitung dafür, wie _Sie_ möchten, dass sie verwendet werden.

## Skills

OpenClaw lädt Skills aus diesen Speicherorten (höchste Priorität zuerst):

- Workspace: `<workspace>/skills`
- Projekt-Agent-Skills: `<workspace>/.agents/skills`
- Persönliche Agent-Skills: `~/.agents/skills`
- Verwaltet/lokal: `~/.openclaw/skills`
- Gebündelt (mit der Installation ausgeliefert)
- Zusätzliche Skill-Ordner: `skills.load.extraDirs`

Skills können per Konfiguration/Env gesteuert werden (siehe `skills` in der [Gateway-Konfiguration](/de/gateway/configuration)).

## Runtime-Grenzen

Die eingebettete Agent-Runtime basiert auf dem Pi-Agent-Core (Modelle, Tools und
Prompt-Pipeline). Sitzungsverwaltung, Discovery, Tool-Verdrahtung und Channel-Auslieferung
sind OpenClaw-eigene Schichten auf diesem Core.

## Sitzungen

Sitzungs-Transkripte werden als JSONL gespeichert unter:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

Die Sitzungs-ID ist stabil und wird von OpenClaw gewählt.
Legacy-Sitzungsordner anderer Tools werden nicht gelesen.

## Steuerung während des Streamings

Wenn der Queue-Modus `steer` ist, werden eingehende Nachrichten in den aktuellen Lauf injiziert.
Queue-Steuerung wird **nachdem der aktuelle Assistant-Turn seine Tool-Aufrufe fertig
ausgeführt hat** ausgeliefert, vor dem nächsten LLM-Aufruf. Pi leert alle ausstehenden
Steuerungsnachrichten für `steer` zusammen; das Legacy-`queue` leert eine Nachricht pro
Modellgrenze. Steuerung überspringt verbleibende Tool-Aufrufe aus der aktuellen
Assistant-Nachricht nicht mehr.

Wenn der Queue-Modus `followup` oder `collect` ist, werden eingehende Nachrichten gehalten, bis der
aktuelle Turn endet; danach startet ein neuer Agent-Turn mit den Queue-Payloads. Siehe
[Queue](/de/concepts/queue) und [Steering-Queue](/de/concepts/queue-steering) für Modus-
und Grenzverhalten.

Block-Streaming sendet abgeschlossene Assistant-Blöcke, sobald sie fertig sind; es ist
**standardmäßig deaktiviert** (`agents.defaults.blockStreamingDefault: "off"`).
Stimmen Sie die Grenze über `agents.defaults.blockStreamingBreak` ab (`text_end` vs. `message_end`; Standard ist text_end).
Steuern Sie weiches Block-Chunking mit `agents.defaults.blockStreamingChunk` (Standard sind
800–1200 Zeichen; bevorzugt Absatzumbrüche, dann Zeilenumbrüche; Sätze zuletzt).
Fassen Sie gestreamte Chunks mit `agents.defaults.blockStreamingCoalesce` zusammen, um
einzeiligen Spam zu reduzieren (inaktivitätsbasiertes Zusammenführen vor dem Senden). Nicht-Telegram-Channels benötigen
explizit `*.blockStreaming: true`, um Block-Antworten zu aktivieren.
Ausführliche Tool-Zusammenfassungen werden beim Tool-Start ausgegeben (kein Debounce); die Control UI
streamt Tool-Ausgabe über Agent-Events, wenn verfügbar.
Weitere Details: [Streaming + Chunking](/de/concepts/streaming).

## Modell-Refs

Modell-Refs in der Konfiguration (zum Beispiel `agents.defaults.model` und `agents.defaults.models`) werden geparst, indem am **ersten** `/` geteilt wird.

- Verwenden Sie `provider/model`, wenn Sie Modelle konfigurieren.
- Wenn die Modell-ID selbst `/` enthält (OpenRouter-Stil), geben Sie das Provider-Präfix an (Beispiel: `openrouter/moonshotai/kimi-k2`).
- Wenn Sie den Provider weglassen, versucht OpenClaw zuerst einen Alias, dann einen eindeutigen
  Treffer bei konfigurierten Providern für genau diese Modell-ID und fällt erst danach
  auf den konfigurierten Standard-Provider zurück. Wenn dieser Provider das
  konfigurierte Standardmodell nicht mehr anbietet, fällt OpenClaw auf das erste konfigurierte
  Provider/Modell zurück, statt einen veralteten Standard eines entfernten Providers sichtbar zu machen.

## Konfiguration (minimal)

Legen Sie mindestens Folgendes fest:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (dringend empfohlen)

---

_Weiter: [Gruppen-Chats](/de/channels/group-messages)_ 🦞

## Verwandt

- [Agent-Workspace](/de/concepts/agent-workspace)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Sitzungsverwaltung](/de/concepts/session)
