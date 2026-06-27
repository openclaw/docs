---
read_when:
    - Arbeiten an OpenClaw-Agent-Runtime-Code oder -Tests
    - Agent-Runtime-Lint-, Typecheck- und Live-Test-Abläufe ausführen
summary: 'Entwickler-Workflow für die OpenClaw-Agent-Laufzeit: Build, Tests und Live-Validierung'
title: OpenClaw-Agentenlaufzeit-Workflow
x-i18n:
    generated_at: "2026-06-27T17:40:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbe2a192ff7954577f8cbeae33676cbfd330f297d31c1917d2ab52898c2c5064
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

Ein sinnvoller Workflow für die Arbeit an der OpenClaw-Agent-Runtime in OpenClaw.

## Typprüfung und Linting

- Standardmäßiges lokales Gate: `pnpm check`
- Build-Gate: `pnpm build`, wenn die Änderung Build-Ausgabe, Paketierung oder Lazy-Loading-/Modulgrenzen beeinflussen kann
- Vollständiges Landing-Gate für Änderungen an der Agent-Runtime: `pnpm check && pnpm test`

## Agent-Runtime-Tests ausführen

Führen Sie das Agent-Runtime-Testset direkt mit Vitest aus:

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-tools*.test.ts" \
  "src/agents/agent-settings.test.ts" \
  "src/agents/agent-tool-definition-adapter*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

Um die Live-Provider-Übung einzuschließen:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/embedded-agent-runner-extraparams.live.test.ts
```

Dies deckt die wichtigsten Unit-Test-Suites der Agent-Runtime ab:

- `src/agents/agent-*.test.ts`
- `src/agents/embedded-agent-*.test.ts`
- `src/agents/agent-tools*.test.ts`
- `src/agents/agent-settings.test.ts`
- `src/agents/agent-tool-definition-adapter.test.ts`
- `src/agents/agent-hooks/*.test.ts`

## Manuelles Testen

Empfohlener Ablauf:

- Führen Sie den Gateway im Entwicklungsmodus aus:
  - `pnpm gateway:dev`
- Lösen Sie den Agent direkt aus:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Verwenden Sie die TUI für interaktives Debugging:
  - `pnpm tui`

Fordern Sie für das Verhalten von Tool-Aufrufen eine `read`- oder `exec`-Aktion an, damit Sie Tool-Streaming und Payload-Verarbeitung sehen können.

## Zurücksetzen auf einen sauberen Ausgangszustand

Der State befindet sich im OpenClaw-State-Verzeichnis. Standard ist `~/.openclaw`. Wenn `OPENCLAW_STATE_DIR` gesetzt ist, verwenden Sie stattdessen dieses Verzeichnis.

Um alles zurückzusetzen:

- `openclaw.json` für die Konfiguration
- `agents/<agentId>/agent/auth-profiles.json` für Modell-Auth-Profile (API-Schlüssel + OAuth)
- `credentials/` für Provider-/Channel-State, der sich noch außerhalb des Auth-Profile-Stores befindet
- `agents/<agentId>/sessions/` für den Agent-Sitzungsverlauf
- `agents/<agentId>/sessions/sessions.json` für den Sitzungsindex
- `sessions/`, falls Legacy-Pfade vorhanden sind
- `workspace/`, wenn Sie einen leeren Workspace möchten

Wenn Sie nur Sitzungen zurücksetzen möchten, löschen Sie `agents/<agentId>/sessions/` für diesen Agent. Wenn Sie Auth beibehalten möchten, lassen Sie `agents/<agentId>/agent/auth-profiles.json` und jeglichen Provider-State unter `credentials/` unverändert.

## Referenzen

- [Testen](/de/help/testing)
- [Erste Schritte](/de/start/getting-started)

## Verwandt

- [OpenClaw-Agent-Runtime-Architektur](/de/agent-runtime-architecture)
