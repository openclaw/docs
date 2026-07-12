---
read_when:
    - Arbeiten am Laufzeitcode oder an Tests für OpenClaw-Agenten
    - Lint-, Typprüfungs- und Live-Testabläufe für die Agent-Laufzeit ausführen
summary: 'Entwickler-Workflow für die OpenClaw-Agentenlaufzeit: Build, Tests und Live-Validierung'
title: Workflow der OpenClaw-Agentenlaufzeit
x-i18n:
    generated_at: "2026-07-12T15:29:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 044f05779bef4ad18478081ba44d84356723c8a0be764440aa9d2b976d167324
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

Entwickler-Workflow für die Agent-Runtime (`src/agents/`) im OpenClaw-Repository.

## Typprüfung und Linting

- Standardmäßige lokale Prüfung: `pnpm check` (Typprüfung, Linting, Richtlinienprüfungen)
- Build-Prüfung: `pnpm build`, wenn sich die Änderung auf Build-Ausgaben, Paketierung oder Lazy-Loading-/Modulgrenzen auswirken kann
- Vollständige Prüfung vor dem Push: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`

## Agent-Runtime-Tests ausführen

Führen Sie die Unit-Test-Suites der Agent-Runtime aus:

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

Das erste Glob-Muster deckt auch die Test-Suites `agent-tools*`, `agent-settings` und
`agent-tool-definition-adapter*` ab.

Live-Tests sind von der Unit-Test-Konfiguration ausgeschlossen. Führen Sie sie über den Live-
Wrapper aus (setzt `OPENCLAW_LIVE_TEST=1` und erfordert Provider-Anmeldedaten):

```bash
pnpm test:live src/agents/embedded-agent-runner-extraparams.live.test.ts
```

## Manuelle Tests

- Führen Sie das Gateway im Entwicklungsmodus aus (überspringt Channel-Verbindungen über `OPENCLAW_SKIP_CHANNELS=1`): `pnpm gateway:dev`
- Lösen Sie über das Gateway einen Agent-Durchlauf aus: `pnpm openclaw agent --message "Hello" --thinking low`
- Verwenden Sie die TUI für interaktives Debugging: `pnpm tui`

Fordern Sie zum Testen des Tool-Aufrufverhaltens eine `read`- oder `exec`-Aktion an, damit Sie
das Tool-Streaming und die Verarbeitung der Nutzdaten beobachten können.

## Vollständiges Zurücksetzen

Der Zustand befindet sich im OpenClaw-Zustandsverzeichnis: standardmäßig `~/.openclaw` oder
`$OPENCLAW_STATE_DIR`, wenn diese Variable gesetzt ist. Pfade relativ zu diesem Verzeichnis:

| Pfad                                           | Inhalt                                                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `openclaw.json`                                | Konfiguration                                                                                    |
| `state/openclaw.sqlite`                        | Gemeinsame Runtime-Zustandsdatenbank                                                             |
| `agents/<agentId>/agent/openclaw-agent.sqlite` | Agentspezifische Modellauthentifizierungsprofile (API-Schlüssel + OAuth) und Runtime-Zustand      |
| `credentials/`                                 | Provider-/Channel-Anmeldedaten außerhalb des Authentifizierungsprofilspeichers                    |
| `agents/<agentId>/sessions/`                   | Transkriptverlauf und Migrationsquellen für veraltete Sitzungen                                   |
| `sessions/`                                    | Veralteter Sitzungsspeicher für einen einzelnen Agent (nur alte Installationen)                   |
| `workspace/`                                   | Standardarbeitsbereich des Agents (zusätzliche Agents verwenden `workspace-<agentId>`)            |

Löschen Sie diese Pfade für ein vollständiges Zurücksetzen. Selektivere Zurücksetzungen:

- Nur Sitzungen: Löschen Sie `agents/<agentId>/agent/openclaw-agent.sqlite` nicht; Sitzungszeilen befinden sich dort zusammen mit anderem agentspezifischem Zustand. Verwenden Sie `/new` oder `/reset`, um eine neue Sitzung für einen Chat zu starten, und `openclaw sessions cleanup` für die Sitzungsverwaltung.
- Authentifizierung beibehalten: Belassen Sie `agents/<agentId>/agent/openclaw-agent.sqlite` und `credentials/` an ihrem Platz.

Veraltete `auth-profiles.json`-Dateien werden zur Laufzeit nicht mehr gelesen;
`openclaw doctor --fix` importiert sie in den SQLite-Speicher.

## Referenzen

- [Tests](/de/help/testing)
- [Erste Schritte](/de/start/getting-started)

## Verwandte Themen

- [Architektur der OpenClaw-Agent-Runtime](/de/agent-runtime-architecture)
