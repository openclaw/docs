---
summary: Wie OpenClaw die integrierte Agent-Laufzeit, Provider, Sitzungen, Tools und Erweiterungen ausführt.
title: Agent-Laufzeitarchitektur
x-i18n:
    generated_at: "2026-06-27T17:08:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd0ca61b10a4f7029590da8566b22cc44cf801af162e5f2c00c9561fe46e39e3
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw besitzt die integrierte Agent-Laufzeit direkt. Der Laufzeitcode liegt unter `src/agents/`, Modell-/Provider-Hilfsfunktionen liegen unter `src/llm/`, und Plugin-seitige Verträge werden über die `openclaw/plugin-sdk/*`-Barrels bereitgestellt.

## Laufzeit-Layout

- `src/agents/embedded-agent-runner/`: integrierte Agent-Versuchsschleife, Provider-Stream-Adapter, Compaction, Modellauswahl und Sitzungsanbindung.
- `src/agents/sessions/`: Sitzungspersistenz, Laden von Erweiterungen, Ressourcenerkennung, Skills, Prompts, Themes und TUI-gestützte Tool-Renderer.
- `packages/agent-core/`: wiederverwendbarer Agent-Kern, Low-Level-Harness-Typen, Nachrichten, Compaction-Hilfsfunktionen, Prompt-Vorlagen und Tool-/Sitzungsverträge.
- `src/agents/runtime/`: OpenClaw-Fassade für `@openclaw/agent-core` plus lokale Proxy-Dienstprogramme.
- `src/agents/agent-tools*.ts`: OpenClaw-eigene Tool-Definitionen, Schemas, Richtlinien, Before-/After-Hook-Adapter und Unterstützung für Host-Bearbeitungen.
- `src/agents/agent-hooks/`: integrierte Laufzeit-Hooks wie Compaction-Schutzmechanismen und Kontextbereinigung.
- `src/llm/`: Modell-/Provider-Registry, Transport-Hilfsfunktionen und Provider-spezifische Stream-Implementierungen.

## Grenzen

Der Core-Code ruft die integrierte Laufzeit über OpenClaw-Module und SDK-Barrels auf, nicht über alte externe Agent-Pakete. Plugins verwenden dokumentierte `openclaw/plugin-sdk/*`-Einstiegspunkte und importieren keine `src/**`-Interna.

`@earendil-works/pi-tui` bleibt eine TUI-Abhängigkeit eines Drittanbieters. Sie wird von der lokalen TUI und den Sitzungs-Renderern als Toolkit für Terminal-Komponenten verwendet; sie zu internalisieren wäre ein separater Vendoring-Aufwand.

## Manifeste

Ressourcenpakete deklarieren OpenClaw-Ressourcen in den Paketmetadaten:

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

Der Paketmanager erkennt außerdem konventionelle Verzeichnisse `extensions/`, `skills/`, `prompts/` und `themes/`.

## Laufzeitauswahl

Die standardmäßige integrierte Laufzeit-ID ist `openclaw`. Plugin-Harnesses können zusätzliche Laufzeit-IDs registrieren. `auto` wählt einen unterstützenden Plugin-Harness aus, wenn einer vorhanden ist, und verwendet andernfalls die integrierte OpenClaw-Laufzeit.

## Verwandte Themen

- [OpenClaw-Agent-Laufzeit-Workflow](/de/openclaw-agent-runtime)
- [Agent-Laufzeiten](/de/concepts/agent-runtimes)
