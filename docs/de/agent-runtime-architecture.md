---
summary: 'Wie OpenClaw die integrierte Agent-Runtime strukturiert: Codeorganisation, Grenzen, Ressourcenmanifeste und Runtime-Auswahl.'
title: Architektur der Agenten-Runtime
x-i18n:
    generated_at: "2026-07-24T03:38:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3e09ff21b4369a7c102db51e4458ad3ba1e86c9fe43a3a8bff72eef1713d2d51
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw ist Eigentümer der integrierten Agent-Runtime. Der Runtime-Code befindet sich unter `src/agents/`, der Modell-/Provider-Transport unter `src/llm/`, und die für Plugins bestimmten Verträge werden über `openclaw/plugin-sdk/*`-Barrels bereitgestellt.

## Runtime-Struktur

| Pfad                                | Zuständigkeit                                                                                                                                                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/agents/embedded-agent-runner/` | Integrierte Versuchsschleife (`run.ts`, `run/`), Modellauswahl und Provider-Normalisierung (`model*.ts`), Provider-spezifische Anfrageparameter (`extra-params.*`), Compaction sowie Verknüpfung von Transkript und Sitzung.                            |
| `src/agents/sessions/`              | Sitzungspersistenz (`session-manager.ts`), Ressourcenermittlung (`package-manager.ts`, `resource-loader.ts`), sitzungsinternes Laden von `extensions`, Prompt-Vorlagen, Skills, Themes und TUI-gestützte Tool-Renderer (`tools/`). |
| `packages/agent-core/`              | Wiederverwendbarer Agent-Kern (`@openclaw/agent-core`): Agent-Schleife, Harness-Typen, Nachrichten, Compaction-Hilfsfunktionen, Prompt-Vorlagen, Skills und Verträge für den Sitzungsspeicher.                                                           |
| `src/agents/runtime/`               | OpenClaw-Fassade, die `@openclaw/agent-core` mit der LLM-Runtime des Plugin-SDK verknüpft und diese zusammen mit lokalen Proxy-Hilfsprogrammen erneut exportiert.                                                                                             |
| `src/agents/agent-tools*.ts`        | OpenClaw-eigene Tool-Definitionen, Parameterschemas, Tool-Richtlinien, Adapter vor und nach Tool-Aufrufen sowie Bearbeitungstools für Host und Sandbox.                                                                                            |
| `src/agents/agent-hooks/`           | Integrierte Runtime-Hooks: Compaction-Schutzmechanismus, Compaction-Anweisungen, Kontextbereinigung.                                                                                                                                   |
| `src/agents/harness/`               | Harness-Registry, Auswahlrichtlinie und Lebenszyklus für integrierte und von Plugins registrierte Harnesses.                                                                                                                       |
| `src/llm/`                          | Modell-/Provider-Registry, Transporthilfen und Provider-spezifische Stream-Implementierungen (`src/llm/providers/`).                                                                                                          |

## Grenzen

Der Kern ruft die integrierte Runtime über OpenClaw-Module und SDK-Barrels auf; es sind keine Pakete externer Agent-Frameworks mehr vorhanden. Plugins verwenden dokumentierte `openclaw/plugin-sdk/*`-Einstiegspunkte und importieren keine Interna aus `src/**`.

`@earendil-works/pi-tui` bleibt eine Drittanbieterabhängigkeit: ein Toolkit für Terminalkomponenten, das von der lokalen TUI und den Tool-Renderern für Sitzungen verwendet wird. Seine Internalisierung wäre ein separates Vendoring-Vorhaben.

## Manifeste

Ressourcenpakete deklarieren OpenClaw-Ressourcen in den Metadaten von `package.json`. Einträge sind Dateipfade oder Globs relativ zum Paketstamm:

```json
{
  "openclaw": {
    "extensions": ["extensions/index.ts"],
    "skills": ["skills/*.md"],
    "prompts": ["prompts/*.md"],
    "themes": ["themes/*.json"]
  }
}
```

Ressourcentypen, die nicht in einem Manifest aufgeführt sind, greifen auf die Ermittlung der konventionellen Verzeichnisse `extensions/`, `skills/`, `prompts/` und `themes/` zurück.

## Runtime-Auswahl

- Die ID der integrierten Runtime lautet `openclaw`. Der veraltete Alias `pi` wird zu `openclaw` normalisiert; `codex-app-server` wird zu `codex` normalisiert.
- Plugin-Harnesses registrieren zusätzliche Runtime-IDs (zum Beispiel `codex`).
- Die Runtime-Richtlinie wird durch die modell-/providerspezifische Konfiguration `agentRuntime.id` festgelegt (der Modelleintrag hat Vorrang vor dem Providereintrag). Ein nicht gesetzter Wert oder `default` wird zu `auto` aufgelöst.
- `auto` wählt ein registriertes Plugin-Harness aus, das die effektive Provider-Route unterstützt, andernfalls die integrierte OpenClaw-Runtime. Ein Provider- oder Modellpräfix allein wählt niemals ein Harness aus.
- OpenAI darf `codex` nur für eine exakt übereinstimmende offizielle HTTPS-Route für Platform Responses oder ChatGPT Responses ohne benutzerdefinierte Anfrageüberschreibung implizit auswählen. Completions-Adapter, benutzerdefinierte Endpunkte und Routen mit benutzerdefiniertem Anfrageverhalten verbleiben auf `openclaw`; offizielle Klartext-HTTP-Endpunkte werden abgelehnt. Siehe [Implizite Agent-Runtime von OpenAI](/de/providers/openai#implicit-agent-runtime).

## Generationen der Modell-Runtime

Beim Start des Gateway sowie bei der Veröffentlichung von Konfigurationen, Plugins oder Authentifizierungsdaten wird für jeden konfigurierten Agent eine vorbereitete Modell-Runtime-Generation erstellt. Jede Generation besitzt die ermittelte Authentifizierungsvorlage, die Modell-Registry und den projizierten Modellkatalog als einen atomaren Snapshot. Agent-Ausführungen erzeugen veränderliche Authentifizierungs- und Registry-Speicher aus diesem Snapshot; Pfade für Durchsuchen, Status, Cron, Diagnose, TUI, PDF und Bilder lesen den veröffentlichten Katalog, anstatt die Dateisystemermittlung zu wiederholen.

Eigenständige eingebettete Runtimes veröffentlichen dieselbe Snapshot-Struktur an ihrer Aktivierungsgrenze. Eine fehlgeschlagene oder veraltete Generation wird niemals zusammen mit einer neueren Teilgeneration bereitgestellt; der Lebenszyklusverantwortliche muss zuerst einen vollständigen Ersatz veröffentlichen.

## Verwandte Themen

- [Workflow der OpenClaw-Agent-Runtime](/de/openclaw-agent-runtime)
- [Agent-Runtimes](/de/concepts/agent-runtimes)
