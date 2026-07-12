---
summary: 'Wie OpenClaw die integrierte Agenten-Runtime strukturiert: Codeorganisation, Abgrenzungen, Ressourcenmanifeste und Runtime-Auswahl.'
title: Architektur der Agentenlaufzeit
x-i18n:
    generated_at: "2026-07-12T14:58:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 071a0cb076230ce02f2c2c1c21971379cf617f24faa8a9733570aae30a062019
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw ist für die integrierte Agent-Runtime verantwortlich. Der Runtime-Code befindet sich unter `src/agents/`, der Modell-/Provider-Transport unter `src/llm/`, und die für Plugins vorgesehenen Verträge werden über die Barrels `openclaw/plugin-sdk/*` bereitgestellt.

## Runtime-Struktur

| Pfad                                | Verantwortungsbereich                                                                                                                                                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/agents/embedded-agent-runner/` | Integrierte Versuchsschleife (`run.ts`, `run/`), Modellauswahl und Provider-Normalisierung (`model*.ts`), anfragespezifische Parameter je Provider (`extra-params.*`), Compaction sowie Verknüpfung von Transkript und Sitzung.             |
| `src/agents/sessions/`              | Sitzungspersistenz (`session-manager.ts`), Ressourcenerkennung (`package-manager.ts`, `resource-loader.ts`), Laden von `extensions` innerhalb der Sitzung, Prompt-Vorlagen, Skills, Themes und TUI-basierte Tool-Renderer (`tools/`).      |
| `packages/agent-core/`              | Wiederverwendbarer Agent-Kern (`@openclaw/agent-core`): Agentenschleife, Harness-Typen, Nachrichten, Compaction-Hilfsfunktionen, Prompt-Vorlagen, Skills und Verträge für die Sitzungsspeicherung.                                        |
| `src/agents/runtime/`               | OpenClaw-Fassade, die `@openclaw/agent-core` mit der LLM-Runtime des Plugin-SDK verbindet und diese zusammen mit lokalen Proxy-Hilfsfunktionen erneut exportiert.                                                                       |
| `src/agents/agent-tools*.ts`        | OpenClaw-eigene Tool-Definitionen, Parameterschemas, Tool-Richtlinien, Adapter vor und nach Tool-Aufrufen sowie Bearbeitungs-Tools für Host und Sandbox.                                                                                |
| `src/agents/agent-hooks/`           | Integrierte Runtime-Hooks: Compaction-Schutzmechanismus, Compaction-Anweisungen, Kontextbereinigung.                                                                                                                                   |
| `src/agents/harness/`               | Harness-Registry, Auswahlrichtlinie und Lebenszyklus für die integrierten und von Plugins registrierten Harnesses.                                                                                                                     |
| `src/llm/`                          | Modell-/Provider-Registry, Transport-Hilfsfunktionen und providerspezifische Stream-Implementierungen (`src/llm/providers/`).                                                                                                          |

## Grenzen

Der Kern ruft die integrierte Runtime über OpenClaw-Module und SDK-Barrels auf; es verbleiben keine externen Pakete für Agent-Frameworks. Plugins verwenden die dokumentierten Einstiegspunkte `openclaw/plugin-sdk/*` und importieren keine Interna aus `src/**`.

`@earendil-works/pi-tui` bleibt eine Drittanbieterabhängigkeit: ein Toolkit für Terminalkomponenten, das von der lokalen TUI und den Tool-Renderern für Sitzungen verwendet wird. Seine Internalisierung wäre ein separates Vendoring-Vorhaben.

## Manifeste

Ressourcenpakete deklarieren OpenClaw-Ressourcen in den `package.json`-Metadaten. Einträge sind Dateipfade oder Globs relativ zum Paketstamm:

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

Ressourcentypen, die nicht in einem Manifest aufgeführt sind, greifen auf die Erkennung der konventionellen Verzeichnisse `extensions/`, `skills/`, `prompts/` und `themes/` zurück.

## Runtime-Auswahl

- Die ID der integrierten Runtime ist `openclaw`. Der veraltete Alias `pi` wird zu `openclaw` normalisiert; `codex-app-server` wird zu `codex` normalisiert.
- Plugin-Harnesses registrieren zusätzliche Runtime-IDs (zum Beispiel `codex`).
- Die Runtime-Richtlinie wird über die modell-/providerspezifische Konfiguration `agentRuntime.id` festgelegt (der Modelleintrag hat Vorrang vor dem Providereintrag). Nicht festgelegt oder `default` wird zu `auto` aufgelöst.
- `auto` wählt einen registrierten Plugin-Harness aus, der die effektive Provider-Route unterstützt, andernfalls die integrierte OpenClaw-Runtime. Ein Provider- oder Modellpräfix allein wählt niemals einen Harness aus.
- OpenAI darf `codex` nur für eine exakt übereinstimmende offizielle HTTPS-Route für Platform Responses oder ChatGPT Responses implizit auswählen, wenn keine vom Autor festgelegte Anforderungsüberschreibung vorliegt. Completions-Adapter, benutzerdefinierte Endpunkte und Routen mit vom Autor festgelegtem Anfrageverhalten verbleiben auf `openclaw`; offizielle Klartext-HTTP-Endpunkte werden abgelehnt. Siehe [Implizite OpenAI-Agent-Runtime](/de/providers/openai#implicit-agent-runtime).

## Verwandte Themen

- [Workflow der OpenClaw-Agent-Runtime](/de/openclaw-agent-runtime)
- [Agent-Runtimes](/de/concepts/agent-runtimes)
