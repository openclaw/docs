---
read_when:
    - Agent-Laufzeit, Workspace-Bootstrap oder Sitzungsverhalten ändern
summary: Agent-Laufzeit, Workspace-Vertrag und Sitzungs-Bootstrap
title: Agent-Laufzeit
x-i18n:
    generated_at: "2026-06-27T17:22:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fb4d3f0bb6e8aa2a23d00f5def5eb0ffa152bc75f82a12c40ac7ed00776011c
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw führt eine **einzelne eingebettete Agent-Runtime** aus - einen Agent-Prozess pro Gateway, mit eigenem Workspace, Bootstrap-Dateien und Sitzungsspeicher. Diese Seite behandelt diesen Runtime-Vertrag: was der Workspace enthalten muss, welche Dateien injiziert werden und wie Sitzungen dagegen gebootstrapt werden.

## Workspace (erforderlich)

OpenClaw verwendet ein einzelnes Agent-Workspace-Verzeichnis (`agents.defaults.workspace`) als das **einzige** Arbeitsverzeichnis (`cwd`) des Agents für Tools und Kontext.

Empfohlen: Verwenden Sie `openclaw setup`, um `~/.openclaw/openclaw.json` zu erstellen, falls sie fehlt, und die Workspace-Dateien zu initialisieren.

Vollständiges Workspace-Layout + Backup-Leitfaden: [Agent-Workspace](/de/concepts/agent-workspace)

Wenn `agents.defaults.sandbox` aktiviert ist, können Nicht-Hauptsitzungen dies mit sitzungsbezogenen Workspaces unter `agents.defaults.sandbox.workspaceRoot` überschreiben (siehe [Gateway-Konfiguration](/de/gateway/configuration)).

## Bootstrap-Dateien (injiziert)

Innerhalb von `agents.defaults.workspace` erwartet OpenClaw diese vom Benutzer bearbeitbaren Dateien:

- `AGENTS.md` - Betriebsanweisungen + „Gedächtnis“
- `SOUL.md` - Persona, Grenzen, Ton
- `TOOLS.md` - vom Benutzer gepflegte Tool-Notizen (z. B. `imsg`, `sag`, Konventionen)
- `BOOTSTRAP.md` - einmaliges Erstritual (nach Abschluss gelöscht)
- `IDENTITY.md` - Agent-Name/Vibe/Emoji
- `USER.md` - Benutzerprofil + bevorzugte Anrede

Beim ersten Turn einer neuen Sitzung injiziert OpenClaw die Inhalte dieser Dateien in den Projektkontext des System-Prompts.

Leere Dateien werden übersprungen. Große Dateien werden gekürzt und mit einer Markierung abgeschnitten, damit Prompts schlank bleiben (lesen Sie die Datei für den vollständigen Inhalt).

Wenn eine Datei fehlt, injiziert OpenClaw eine einzelne Markierungszeile „fehlende Datei“ (und `openclaw setup` erstellt eine sichere Standardvorlage).

`BOOTSTRAP.md` wird nur für einen **brandneuen Workspace** erstellt (keine anderen Bootstrap-Dateien vorhanden). Solange sie aussteht, behält OpenClaw sie im Projektkontext und fügt System-Prompt-Bootstrap-Anleitung für das Anfangsritual hinzu, statt sie in die Benutzernachricht zu kopieren. Wenn Sie sie nach Abschluss des Rituals löschen, sollte sie bei späteren Neustarts nicht neu erstellt werden.

Nachdem ein Workspace beobachtet wurde, hält OpenClaw außerdem eine Attestierungsmarkierung im Zustandsverzeichnis für den Workspace-Pfad vor. Wenn ein kürzlich attestierter Workspace verschwindet oder gelöscht wird, verweigert der Start ein stilles erneutes Anlegen von `BOOTSTRAP.md`; stellen Sie den Workspace wieder her oder verwenden Sie einen vollständigen Onboard-Reset, damit Workspace und Markierung gemeinsam entfernt werden.

Um die Erstellung von Bootstrap-Dateien vollständig zu deaktivieren (für vorbefüllte Workspaces), setzen Sie:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Integrierte Tools

Core-Tools (read/exec/edit/write und verwandte System-Tools) sind immer verfügbar, vorbehaltlich der Tool-Richtlinie. `apply_patch` ist optional und wird durch `tools.exec.applyPatch` gesteuert. `TOOLS.md` steuert **nicht**, welche Tools existieren; es ist Anleitung dafür, wie _Sie_ möchten, dass sie verwendet werden.

## Skills

OpenClaw lädt Skills aus diesen Speicherorten (höchste Priorität zuerst):

- Workspace: `<workspace>/skills`
- Projekt-Agent-Skills: `<workspace>/.agents/skills`
- Persönliche Agent-Skills: `~/.agents/skills`
- Verwaltet/lokal: `~/.openclaw/skills`
- Gebündelt (mit der Installation ausgeliefert)
- Zusätzliche Skill-Ordner: `skills.load.extraDirs`

Skill-Roots können gruppierte Ordner wie `<workspace>/skills/personal/foo/SKILL.md` enthalten; der Skill wird weiterhin über seinen flachen Frontmatter-Namen verfügbar gemacht, zum Beispiel `foo`.

Skills können per Konfiguration/Env gesteuert werden (siehe `skills` in [Gateway-Konfiguration](/de/gateway/configuration)).

## Runtime-Grenzen

Die eingebettete Agent-Runtime gehört OpenClaw: Modellerkennung, Tool-Verdrahtung, Prompt-Zusammenstellung, Sitzungsverwaltung und Kanalzustellung teilen sich eine integrierte Runtime-Oberfläche.

## Sitzungen

Sitzungstranskripte werden als JSONL gespeichert unter:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

Die Sitzungs-ID ist stabil und wird von OpenClaw gewählt.
Legacy-Sitzungsordner aus anderen Tools werden nicht gelesen.

## Steuerung während des Streamings

Eingehende Prompts, die mitten in einem Lauf eintreffen, werden standardmäßig in den aktuellen Lauf gesteuert. Die Steuerung wird **nachdem der aktuelle Assistant-Turn seine Tool-Aufrufe fertig ausgeführt hat** zugestellt, vor dem nächsten LLM-Aufruf, und überspringt keine verbleibenden Tool-Aufrufe aus der aktuellen Assistant-Nachricht mehr.

`/queue steer` ist das Standardverhalten bei aktivem Lauf. `/queue followup` und `/queue collect` lassen Nachrichten auf einen späteren Turn warten, statt zu steuern. `/queue interrupt` bricht stattdessen den aktiven Lauf ab. Siehe [Queue](/de/concepts/queue) und [Steering-Queue](/de/concepts/queue-steering) für Queue- und Grenzverhalten.

Block-Streaming sendet abgeschlossene Assistant-Blöcke, sobald sie fertig sind; es ist **standardmäßig deaktiviert** (`agents.defaults.blockStreamingDefault: "off"`).
Passen Sie die Grenze über `agents.defaults.blockStreamingBreak` an (`text_end` vs `message_end`; Standard ist text_end).
Steuern Sie weiches Block-Chunking mit `agents.defaults.blockStreamingChunk` (Standard 800-1200 Zeichen; bevorzugt Absatzumbrüche, dann Zeilenumbrüche; Sätze zuletzt).
Fassen Sie gestreamte Chunks mit `agents.defaults.blockStreamingCoalesce` zusammen, um Einzeilen-Spam zu reduzieren (leerlaufbasiertes Zusammenführen vor dem Senden). Nicht-Telegram-Kanäle erfordern explizit `*.blockStreaming: true`, um Blockantworten zu aktivieren.
Ausführliche Tool-Zusammenfassungen werden beim Tool-Start ausgegeben (kein Debounce); die Control UI streamt Tool-Ausgabe, wenn verfügbar, über Agent-Ereignisse.
Weitere Details: [Streaming + Chunking](/de/concepts/streaming).

## Modell-Refs

Modell-Refs in der Konfiguration (zum Beispiel `agents.defaults.model` und `agents.defaults.models`) werden durch Aufteilen am **ersten** `/` geparst.

- Verwenden Sie `provider/model`, wenn Sie Modelle konfigurieren.
- Wenn die Modell-ID selbst `/` enthält (OpenRouter-Stil), schließen Sie das Provider-Präfix ein (Beispiel: `openrouter/moonshotai/kimi-k2`).
- Wenn Sie den Provider weglassen, versucht OpenClaw zuerst einen Alias, dann eine Übereinstimmung mit einem eindeutigen konfigurierten Provider für genau diese Modell-ID, und fällt erst dann auf den konfigurierten Standard-Provider zurück. Wenn dieser Provider das konfigurierte Standardmodell nicht mehr bereitstellt, fällt OpenClaw auf das erste konfigurierte Provider/Modell zurück, statt einen veralteten Standard eines entfernten Providers offenzulegen.

## Konfiguration (minimal)

Setzen Sie mindestens:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (dringend empfohlen)

---

_Nächster Schritt: [Gruppenchats](/de/channels/group-messages)_ 🦞

## Verwandt

- [Agent-Workspace](/de/concepts/agent-workspace)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Sitzungsverwaltung](/de/concepts/session)
