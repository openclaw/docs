---
read_when:
    - Arbeiten am Laufzeitcode oder an Tests für OpenClaw-Agenten
    - Lint-, Typprüfungs- und Live-Test-Abläufe der Agent-Runtime ausführen
summary: 'Entwickler-Workflow für die OpenClaw-Agentenlaufzeit: Build, Tests und Live-Validierung'
title: OpenClaw-Agentenlaufzeit-Workflow
x-i18n:
    generated_at: "2026-07-24T04:42:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
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

## Tests der Agent-Runtime ausführen

Führen Sie die Unit-Test-Suites der Agent-Runtime aus:

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

Das erste Glob-Muster deckt außerdem die Test-Suites `agent-tools*`, `agent-settings` und
`agent-tool-definition-adapter*` ab.

Live-Tests sind von der Unit-Test-Konfiguration ausgeschlossen; führen Sie sie über den Live-
Wrapper aus (setzt `OPENCLAW_LIVE_TEST=1` und erfordert Provider-Anmeldedaten):

```bash
pnpm test:live src/agents/embedded-agent-runner-extraparams.live.test.ts
```

## Manuelle Tests

- Führen Sie den Gateway im Entwicklungsmodus aus (überspringt Kanalverbindungen über `OPENCLAW_SKIP_CHANNELS=1`): `pnpm gateway:dev`
- Lösen Sie über den Gateway einen Agent-Durchlauf aus: `pnpm openclaw agent --message "Hello" --thinking low`
- Verwenden Sie die TUI für interaktives Debugging: `pnpm tui`

Fordern Sie zum Testen des Tool-Aufrufverhaltens eine Aktion vom Typ `read` oder `exec` an, damit Sie
das Tool-Streaming und die Verarbeitung der Nutzdaten beobachten können.

## Vollständiges Zurücksetzen

Der Zustand befindet sich im OpenClaw-Zustandsverzeichnis: standardmäßig `~/.openclaw` oder
`$OPENCLAW_STATE_DIR`, wenn festgelegt. Relative Pfade innerhalb dieses Verzeichnisses:

| Pfad                                           | Inhalt                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `openclaw.json`                                | Konfiguration                                                             |
| `state/openclaw.sqlite`                        | Gemeinsame Datenbank für den Runtime-Zustand                                      |
| `agents/<agentId>/agent/openclaw-agent.sqlite` | Modellauthentifizierungsprofile pro Agent (API-Schlüssel + OAuth) und Runtime-Zustand |
| `credentials/`                                 | Provider-/Kanal-Anmeldedaten außerhalb des Authentifizierungsprofilspeichers        |
| `agents/<agentId>/sessions/`                   | Transkriptverlauf und Quellen für die Migration von Legacy-Sitzungen            |
| `sessions/`                                    | Legacy-Sitzungsspeicher für einen einzelnen Agent (nur alte Installationen)              |
| `workspace/`                                   | Standardmäßiger Agent-Arbeitsbereich (zusätzliche Agenten verwenden `workspace-<agentId>`)   |

Löschen Sie diese Pfade für ein vollständiges Zurücksetzen. Gezieltere Zurücksetzungen:

- Nur Sitzungen: Löschen Sie `agents/<agentId>/agent/openclaw-agent.sqlite` nicht; die Sitzungszeilen befinden sich dort neben anderem agentspezifischem Zustand. Verwenden Sie `/new` oder `/reset`, um eine neue Sitzung für einen Chat zu starten, und `openclaw sessions cleanup` für die Sitzungsverwaltung.
- Authentifizierung beibehalten: Lassen Sie `agents/<agentId>/agent/openclaw-agent.sqlite` und `credentials/` bestehen.

Legacy-Dateien vom Typ `auth-profiles.json` werden zur Laufzeit nicht mehr gelesen;
`openclaw doctor --fix` importiert sie in den SQLite-Speicher.

## Referenzen

- [Tests](/de/help/testing)
- [Erste Schritte](/de/start/getting-started)

## Verwandte Themen

- [Architektur der OpenClaw-Agent-Runtime](/de/agent-runtime-architecture)
