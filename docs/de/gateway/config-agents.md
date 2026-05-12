---
read_when:
    - Agent-Standardeinstellungen anpassen (Modelle, Denken, Arbeitsbereich, Heartbeat, Medien, Skills)
    - Multi-Agent-Routing und Bindungen konfigurieren
    - Verhalten von Sitzungen, Nachrichtenzustellung und Sprechmodus anpassen
summary: Agent-Standardwerte, Multi-Agent-Routing, Sitzung, Nachrichten und Talk-Konfiguration
title: Konfiguration — Agenten
x-i18n:
    generated_at: "2026-05-12T23:30:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08ddc1b36f4b9408ebaa5f071693b1c1333cedc9b00f75df93f12e73081e1033
    source_path: gateway/config-agents.md
    workflow: 16
---

Agent-bezogene Konfigurationsschlüssel unter `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` und `talk.*`. Für Kanäle, Tools, Gateway-Runtime und andere
Top-Level-Schlüssel siehe [Konfigurationsreferenz](/de/gateway/configuration-reference).

## Agent-Standardwerte

### `agents.defaults.workspace`

Standard: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Optionaler Repository-Root, der in der Runtime-Zeile des System-Prompts angezeigt wird. Wenn nicht gesetzt, erkennt OpenClaw ihn automatisch, indem es vom Workspace aus nach oben sucht.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Optionale Standard-Zulassungsliste für Skills für Agenten, die
`agents.list[].skills` nicht setzen.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

- Lassen Sie `agents.defaults.skills` weg, um standardmäßig uneingeschränkte Skills zu verwenden.
- Lassen Sie `agents.list[].skills` weg, um die Standardwerte zu übernehmen.
- Setzen Sie `agents.list[].skills: []`, um keine Skills zu verwenden.
- Eine nicht leere Liste `agents.list[].skills` ist die endgültige Menge für diesen Agenten; sie
  wird nicht mit Standardwerten zusammengeführt.

### `agents.defaults.skipBootstrap`

Deaktiviert die automatische Erstellung von Workspace-Bootstrap-Dateien (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Überspringt die Erstellung ausgewählter optionaler Workspace-Dateien, während erforderliche Bootstrap-Dateien weiterhin geschrieben werden. Gültige Werte: `SOUL.md`, `USER.md`, `HEARTBEAT.md` und `IDENTITY.md`.

```json5
{
  agents: {
    defaults: {
      skipOptionalBootstrapFiles: ["SOUL.md", "USER.md"],
    },
  },
}
```

### `agents.defaults.contextInjection`

Steuert, wann Workspace-Bootstrap-Dateien in den System-Prompt injiziert werden. Standard: `"always"`.

- `"continuation-skip"`: Sichere Fortsetzungs-Turns (nach einer abgeschlossenen Assistentenantwort) überspringen die erneute Injektion des Workspace-Bootstraps und reduzieren so die Prompt-Größe. Heartbeat-Läufe und Wiederholungsversuche nach der Compaction bauen den Kontext weiterhin neu auf.
- `"never"`: Deaktiviert Workspace-Bootstrap und Kontextdatei-Injektion bei jedem Turn. Verwenden Sie dies nur für Agenten, die ihren Prompt-Lebenszyklus vollständig selbst besitzen (benutzerdefinierte Kontext-Engines, native Runtimes, die ihren eigenen Kontext erstellen, oder spezialisierte bootstrapfreie Workflows). Heartbeat- und Compaction-Recovery-Turns überspringen die Injektion ebenfalls.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Maximale Zeichenanzahl pro Workspace-Bootstrap-Datei vor der Kürzung. Standard: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Maximale Gesamtzahl injizierter Zeichen über alle Workspace-Bootstrap-Dateien hinweg. Standard: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Steuert den für den Agenten sichtbaren Hinweis im System-Prompt, wenn Bootstrap-Kontext gekürzt wird.
Standard: `"once"`.

- `"off"`: Niemals Hinweistext zur Kürzung in den System-Prompt injizieren.
- `"once"`: Einen knappen Hinweis einmal pro eindeutiger Kürzungssignatur injizieren (empfohlen).
- `"always"`: Bei jedem Lauf einen knappen Hinweis injizieren, wenn eine Kürzung vorliegt.

Detaillierte Roh-/Injektionszählungen und Felder zur Konfigurationsabstimmung bleiben in Diagnosen wie
Kontext-/Statusberichten und Logs; regulärer WebChat-Benutzer-/Runtime-Kontext erhält nur
den knappen Wiederherstellungshinweis.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Zuständigkeitskarte für Kontextbudgets

OpenClaw hat mehrere umfangreiche Prompt-/Kontextbudgets, die bewusst nach
Subsystem aufgeteilt sind, statt alle über einen generischen
Regler zu laufen.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normale Workspace-Bootstrap-Injektion.
- `agents.defaults.startupContext.*`:
  einmalige Reset-/Startup-Modelllauf-Einleitung, einschließlich aktueller täglicher
  `memory/*.md`-Dateien. Reine Chat-Befehle `/new` und `/reset` werden
  bestätigt, ohne das Modell aufzurufen.
- `skills.limits.*`:
  die kompakte Skills-Liste, die in den System-Prompt injiziert wird.
- `agents.defaults.contextLimits.*`:
  begrenzte Runtime-Auszüge und injizierte Runtime-eigene Blöcke.
- `memory.qmd.limits.*`:
  Größen für indizierte Speicher-Suchsnippets und Injektion.

Verwenden Sie die passende agentenspezifische Überschreibung nur, wenn ein Agent ein anderes
Budget benötigt:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Steuert die First-Turn-Startup-Einleitung, die bei Reset-/Startup-Modellläufen injiziert wird.
Reine Chat-Befehle `/new` und `/reset` bestätigen den Reset, ohne das
Modell aufzurufen, daher laden sie diese Einleitung nicht.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

Gemeinsame Standardwerte für begrenzte Runtime-Kontextflächen.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: Standard-Auszugslimit für `memory_get`, bevor Kürzungsmetadaten
  und Fortsetzungshinweis hinzugefügt werden.
- `memoryGetDefaultLines`: Standard-Zeilenfenster für `memory_get`, wenn `lines`
  weggelassen wird.
- `toolResultMaxChars`: Live-Tool-Ergebnislimit, das für persistierte Ergebnisse und
  Overflow-Wiederherstellung verwendet wird.
- `postCompactionMaxChars`: AGENTS.md-Auszugslimit, das während der Aktualisierungsinjektion
  nach der Compaction verwendet wird.

#### `agents.list[].contextLimits`

Agentenspezifische Überschreibung für die gemeinsamen `contextLimits`-Regler. Weggelassene Felder erben
von `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Globales Limit für die kompakte Skills-Liste, die in den System-Prompt injiziert wird. Dies
wirkt sich nicht auf das bedarfsweise Lesen von `SKILL.md`-Dateien aus.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Agentenspezifische Überschreibung für das Skills-Prompt-Budget.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Maximale Pixelgröße für die längste Bildseite in Transkript-/Tool-Bildblöcken vor Provider-Aufrufen.
Standard: `1200`.

Niedrigere Werte reduzieren in der Regel die Vision-Token-Nutzung und die Größe der Request-Payload bei screenshotlastigen Läufen.
Höhere Werte bewahren mehr visuelle Details.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Zeitzone für den System-Prompt-Kontext (nicht für Nachrichtenzeitstempel). Fällt auf die Host-Zeitzone zurück.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Zeitformat im System-Prompt. Standard: `auto` (Betriebssystemeinstellung).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // global default provider params
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      toolProgressDetail: "explain",
      reasoningDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: akzeptiert entweder eine Zeichenfolge (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Die Zeichenfolgenform legt nur das primäre Modell fest.
  - Die Objektform legt das primäre Modell plus geordnete Failover-Modelle fest.
- `imageModel`: akzeptiert entweder eine Zeichenfolge (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird vom `image`-Tool-Pfad als dessen Vision-Modellkonfiguration verwendet.
  - Wird außerdem als Fallback-Routing verwendet, wenn das ausgewählte/standardmäßige Modell keine Bildeingabe akzeptieren kann.
  - Bevorzugen Sie explizite `provider/model`-Referenzen. Bloße IDs werden aus Kompatibilitätsgründen akzeptiert; wenn eine bloße ID eindeutig einem konfigurierten bildfähigen Eintrag in `models.providers.*.models` entspricht, qualifiziert OpenClaw sie für diesen Provider. Mehrdeutige konfigurierte Treffer erfordern ein explizites Provider-Präfix.
- `imageGenerationModel`: akzeptiert entweder eine Zeichenfolge (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Bildgenerierungsfunktion und jeder zukünftigen Tool-/Plugin-Oberfläche verwendet, die Bilder generiert.
  - Typische Werte: `google/gemini-3.1-flash-image-preview` für native Gemini-Bildgenerierung, `fal/fal-ai/flux/dev` für fal, `openai/gpt-image-2` für OpenAI Images oder `openai/gpt-image-1.5` für OpenAI-PNG-/WebP-Ausgabe mit transparentem Hintergrund.
  - Wenn Sie direkt einen Provider/ein Modell auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung (zum Beispiel `GEMINI_API_KEY` oder `GOOGLE_API_KEY` für `google/*`, `OPENAI_API_KEY` oder OpenAI Codex OAuth für `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` für `fal/*`).
  - Wenn ausgelassen, kann `image_generate` weiterhin einen authentifizierungsbasierten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider und danach die übrigen registrierten Bildgenerierungs-Provider in Reihenfolge der Provider-ID.
- `musicGenerationModel`: akzeptiert entweder eine Zeichenfolge (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Musikgenerierungsfunktion und dem integrierten `music_generate`-Tool verwendet.
  - Typische Werte: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` oder `minimax/music-2.6`.
  - Wenn ausgelassen, kann `music_generate` weiterhin einen authentifizierungsbasierten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider und danach die übrigen registrierten Musikgenerierungs-Provider in Reihenfolge der Provider-ID.
  - Wenn Sie direkt einen Provider/ein Modell auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung/den passenden API-Schlüssel.
- `videoGenerationModel`: akzeptiert entweder eine Zeichenfolge (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Videogenerierungsfunktion und dem integrierten `video_generate`-Tool verwendet.
  - Typische Werte: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` oder `qwen/wan2.7-r2v`.
  - Wenn ausgelassen, kann `video_generate` weiterhin einen authentifizierungsbasierten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider und danach die übrigen registrierten Videogenerierungs-Provider in Reihenfolge der Provider-ID.
  - Wenn Sie direkt einen Provider/ein Modell auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung/den passenden API-Schlüssel.
  - Der gebündelte Qwen-Videogenerierungs-Provider unterstützt bis zu 1 Ausgabevideo, 1 Eingabebild, 4 Eingabevideos, 10 Sekunden Dauer sowie Provider-weite Optionen für `size`, `aspectRatio`, `resolution`, `audio` und `watermark`.
- `pdfModel`: akzeptiert entweder eine Zeichenfolge (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird vom `pdf`-Tool für das Modell-Routing verwendet.
  - Wenn ausgelassen, fällt das PDF-Tool auf `imageModel` und danach auf das aufgelöste Sitzungs-/Standardmodell zurück.
- `pdfMaxBytesMb`: Standardgrößenlimit für PDFs für das `pdf`-Tool, wenn `maxBytesMb` beim Aufruf nicht übergeben wird.
- `pdfMaxPages`: standardmäßige maximale Seitenanzahl, die vom Extraktions-Fallback-Modus im `pdf`-Tool berücksichtigt wird.
- `verboseDefault`: standardmäßige Ausführlichkeitsstufe für Agenten. Werte: `"off"`, `"on"`, `"full"`. Standard: `"off"`.
- `toolProgressDetail`: Detailmodus für `/verbose`-Tool-Zusammenfassungen und Tool-Zeilen in Fortschrittsentwürfen. Werte: `"explain"` (Standard, kompakte menschliche Bezeichnungen) oder `"raw"` (hängt rohe Befehle/Details an, wenn verfügbar). Agentenspezifisches `agents.list[].toolProgressDetail` überschreibt diesen Standard.
- `reasoningDefault`: standardmäßige Reasoning-Sichtbarkeit für Agenten. Werte: `"off"`, `"on"`, `"stream"`. Agentenspezifisches `agents.list[].reasoningDefault` überschreibt diesen Standard. Konfigurierte Reasoning-Standards werden nur für Besitzer, autorisierte Absender oder Operator-Admin-Gateway-Kontexte angewendet, wenn keine Reasoning-Überschreibung pro Nachricht oder Sitzung gesetzt ist.
- `elevatedDefault`: standardmäßige Stufe für erhöhte Ausgabe für Agenten. Werte: `"off"`, `"on"`, `"ask"`, `"full"`. Standard: `"on"`.
- `model.primary`: Format `provider/model` (z. B. `openai/gpt-5.5` für OpenAI-API-Schlüssel oder Codex-OAuth-Zugriff). Wenn Sie den Provider weglassen, versucht OpenClaw zuerst einen Alias, dann einen eindeutigen Treffer bei konfigurierten Providern für genau diese Modell-ID und fällt erst danach auf den konfigurierten Standard-Provider zurück (veraltetes Kompatibilitätsverhalten, daher bevorzugen Sie explizit `provider/model`). Wenn dieser Provider das konfigurierte Standardmodell nicht mehr bereitstellt, fällt OpenClaw auf den ersten konfigurierten Provider/das erste konfigurierte Modell zurück, statt einen veralteten Standard eines entfernten Providers anzuzeigen.
- `models`: der konfigurierte Modellkatalog und die Allowlist für `/model`. Jeder Eintrag kann `alias` (Kurzbefehl) und `params` (Provider-spezifisch, zum Beispiel `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`) enthalten.
  - Verwenden Sie `provider/*`-Einträge wie `"openai-codex/*": {}` oder `"vllm/*": {}`, um alle erkannten Modelle für ausgewählte Provider anzuzeigen, ohne jede Modell-ID manuell aufzuführen.
  - Sichere Änderungen: Verwenden Sie `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, um Einträge hinzuzufügen. `config set` verweigert Ersetzungen, die bestehende Allowlist-Einträge entfernen würden, sofern Sie nicht `--replace` übergeben.
  - Provider-bezogene Configure-/Onboarding-Flows führen ausgewählte Provider-Modelle in diese Zuordnung ein und bewahren bereits konfigurierte, nicht verwandte Provider.
  - Für direkte OpenAI-Responses-Modelle ist serverseitige Compaction automatisch aktiviert. Verwenden Sie `params.responsesServerCompaction: false`, um das Einfügen von `context_management` zu stoppen, oder `params.responsesCompactThreshold`, um den Schwellenwert zu überschreiben. Siehe [OpenAI serverseitige Compaction](/de/providers/openai#server-side-compaction-responses-api).
- `params`: globale standardmäßige Provider-Parameter, die auf alle Modelle angewendet werden. Wird unter `agents.defaults.params` gesetzt (z. B. `{ cacheRetention: "long" }`).
- Zusammenführungsrangfolge für `params` (Konfiguration): `agents.defaults.params` (globale Basis) wird durch `agents.defaults.models["provider/model"].params` (pro Modell) überschrieben, danach überschreibt `agents.list[].params` (passende Agenten-ID) schlüsselweise. Siehe [Prompt Caching](/de/reference/prompt-caching) für Details.
- `params.extra_body`/`params.extraBody`: erweiterte Pass-through-JSON-Daten, die in `api: "openai-completions"`-Request-Bodies für OpenAI-kompatible Proxys eingefügt werden. Wenn sie mit generierten Request-Schlüsseln kollidieren, gewinnt der zusätzliche Body; nicht native Completions-Routen entfernen anschließend weiterhin OpenAI-spezifisches `store`.
- `params.chat_template_kwargs`: vLLM-/OpenAI-kompatible Chat-Template-Argumente, die in Top-Level-`api: "openai-completions"`-Request-Bodies eingefügt werden. Für `vllm/nemotron-3-*` mit deaktiviertem Thinking sendet das gebündelte vLLM-Plugin automatisch `enable_thinking: false` und `force_nonempty_content: true`; explizite `chat_template_kwargs` überschreiben generierte Standards, und `extra_body.chat_template_kwargs` hat weiterhin endgültigen Vorrang. Für vLLM-Qwen-Thinking-Steuerungen setzen Sie `params.qwenThinkingFormat` für diesen Modelleintrag auf `"chat-template"` oder `"top-level"`.
- `compat.thinkingFormat`: OpenAI-kompatibler Thinking-Payload-Stil. Verwenden Sie `"qwen"` für Qwen-artiges Top-Level-`enable_thinking` oder `"qwen-chat-template"` für `chat_template_kwargs.enable_thinking` auf Backends der Qwen-Familie, die Chat-Template-Kwargs auf Request-Ebene unterstützen, wie vLLM. OpenClaw ordnet deaktiviertes Thinking `false` und aktiviertes Thinking `true` zu.
- `compat.supportedReasoningEfforts`: OpenAI-kompatible Liste der Reasoning-Aufwände pro Modell. Fügen Sie `"xhigh"` für benutzerdefinierte Endpunkte hinzu, die es tatsächlich akzeptieren; OpenClaw zeigt dann `/think xhigh` in Befehlsmenüs, Gateway-Sitzungszeilen, Sitzungs-Patch-Validierung, Agent-CLI-Validierung und `llm-task`-Validierung für diesen konfigurierten Provider/dieses Modell an. Verwenden Sie `compat.reasoningEffortMap`, wenn das Backend einen Provider-spezifischen Wert für eine kanonische Stufe erwartet.
- `params.preserveThinking`: nur für Z.AI geltendes Opt-in für beibehaltenes Thinking. Wenn aktiviert und Thinking eingeschaltet ist, sendet OpenClaw `thinking.clear_thinking: false` und spielt vorheriges `reasoning_content` erneut ab; siehe [Z.AI-Thinking und beibehaltenes Thinking](/de/providers/zai#thinking-and-preserved-thinking).
- `localService`: optionaler Prozessmanager auf Provider-Ebene für lokale/selbst gehostete Modellserver. Wenn das ausgewählte Modell zu diesem Provider gehört, prüft OpenClaw `healthUrl` (oder `baseUrl + "/models"`), startet `command` mit `args`, falls der Endpunkt nicht erreichbar ist, wartet bis zu `readyTimeoutMs` und sendet dann die Modellanfrage. `command` muss ein absoluter Pfad sein. `idleStopMs: 0` hält den Prozess am Leben, bis OpenClaw beendet wird; ein positiver Wert stoppt den von OpenClaw gestarteten Prozess nach entsprechend vielen Leerlauf-Millisekunden. Siehe [Lokale Modelldienste](/de/gateway/local-model-services).
- Laufzeitrichtlinien gehören auf Provider oder Modelle, nicht auf `agents.defaults`. Verwenden Sie `models.providers.<provider>.agentRuntime` für Provider-weite Regeln oder `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` für modellspezifische Regeln. OpenAI-Agentenmodelle beim offiziellen OpenAI-Provider wählen standardmäßig Codex aus.
- Konfigurationsschreiber, die diese Felder verändern (zum Beispiel `/models set`, `/models set-image` und Befehle zum Hinzufügen/Entfernen von Fallbacks), speichern die kanonische Objektform und bewahren bestehende Fallback-Listen, wenn möglich.
- `maxConcurrent`: maximale parallele Agentenläufe über Sitzungen hinweg (jede Sitzung bleibt weiterhin serialisiert). Standard: 4.

### Laufzeitrichtlinie

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: { id: "codex" },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      models: {
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, eine registrierte Plugin-Harness-ID oder ein unterstützter CLI-Backend-Alias. Das gebündelte Codex-Plugin registriert `codex`; das gebündelte Anthropic-Plugin stellt das `claude-cli`-CLI-Backend bereit.
- `id: "auto"` lässt registrierte Plugin-Harnesses unterstützte Turns übernehmen und verwendet PI, wenn kein Harness passt. Eine explizite Plugin-Laufzeit wie `id: "codex"` erfordert diesen Harness und schlägt geschlossen fehl, wenn er nicht verfügbar ist oder fehlschlägt.
- Laufzeitschlüssel auf Agentenebene als Ganzes sind Legacy. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, Sitzungs-Laufzeit-Pins und `OPENCLAW_AGENT_RUNTIME` werden von der Laufzeitauswahl ignoriert. Führen Sie `openclaw doctor --fix` aus, um veraltete Werte zu entfernen.
- OpenAI-Agentenmodelle verwenden standardmäßig den Codex-Harness; Provider-/Modell-`agentRuntime.id: "codex"` bleibt gültig, wenn Sie dies explizit machen möchten.
- Für Claude-CLI-Deployments bevorzugen Sie `model: "anthropic/claude-opus-4-7"` plus modellspezifisches `agentRuntime.id: "claude-cli"`. Legacy-`claude-cli/claude-opus-4-7`-Modellreferenzen funktionieren aus Kompatibilitätsgründen weiterhin, aber neue Konfiguration sollte die Provider-/Modellauswahl kanonisch halten und das Ausführungs-Backend in der Provider-/Modell-Laufzeitrichtlinie platzieren.
- Dies steuert nur die Ausführung von Text-Agent-Turns. Mediengenerierung, Vision, PDF, Musik, Video und TTS verwenden weiterhin ihre Provider-/Modelleinstellungen.

**Integrierte Alias-Kurzformen** (gelten nur, wenn sich das Modell in `agents.defaults.models` befindet):

| Alias               | Modell                                |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.5`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Ihre konfigurierten Aliase haben immer Vorrang vor den Standardwerten.

Z.AI GLM-4.x-Modelle aktivieren automatisch den Denkmodus, sofern Sie nicht `--thinking off` festlegen oder `agents.defaults.models["zai/<model>"].params.thinking` selbst definieren.
Z.AI-Modelle aktivieren standardmäßig `tool_stream` für Tool-Call-Streaming. Setzen Sie `agents.defaults.models["zai/<model>"].params.tool_stream` auf `false`, um es zu deaktivieren.
Anthropic-Claude-4.6-Modelle verwenden standardmäßig `adaptive`-Denken, wenn keine explizite Denkstufe festgelegt ist.

### `agents.defaults.cliBackends`

Optionale CLI-Backends für reine Text-Fallback-Läufe (keine Tool-Aufrufe). Nützlich als Backup, wenn API-Provider fehlschlagen.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // Or use systemPromptFileArg when the CLI accepts a prompt file flag.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI-Backends sind auf Text ausgelegt; Tools sind immer deaktiviert.
- Sitzungen werden unterstützt, wenn `sessionArg` gesetzt ist.
- Bilddurchleitung wird unterstützt, wenn `imageArg` Dateipfade akzeptiert.
- `reseedFromRawTranscriptWhenUncompacted: true` ermöglicht einem Backend, sichere
  ungültig gewordene Sitzungen aus einem begrenzten unverarbeiteten OpenClaw-Transkriptausschnitt wiederherzustellen, bevor die
  erste Compaction-Zusammenfassung vorhanden ist. Änderungen am Auth-Profil oder an der Credential-Epoche
  werden dennoch niemals aus Rohdaten neu eingespeist.

### `agents.defaults.systemPromptOverride`

Ersetzt den gesamten von OpenClaw zusammengesetzten System-Prompt durch eine feste Zeichenkette. Auf Standardebene (`agents.defaults.systemPromptOverride`) oder pro Agent (`agents.list[].systemPromptOverride`) festlegen. Agentenspezifische Werte haben Vorrang; ein leerer oder nur aus Leerzeichen bestehender Wert wird ignoriert. Nützlich für kontrollierte Prompt-Experimente.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

Provider-unabhängige Prompt-Overlays, die nach Modellfamilie angewendet werden. Modell-IDs der GPT-5-Familie erhalten den gemeinsamen Verhaltensvertrag über Provider hinweg; `personality` steuert nur die freundliche Interaktionsstil-Ebene.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"` (Standard) und `"on"` aktivieren die freundliche Interaktionsstil-Ebene.
- `"off"` deaktiviert nur die freundliche Ebene; der markierte GPT-5-Verhaltensvertrag bleibt aktiviert.
- Das veraltete `plugins.entries.openai.config.personality` wird weiterhin gelesen, wenn diese gemeinsame Einstellung nicht gesetzt ist.

### `agents.defaults.heartbeat`

Periodische Heartbeat-Läufe.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: Dauerzeichenkette (ms/s/m/h). Standard: `30m` (API-Key-Auth) oder `1h` (OAuth-Auth). Auf `0m` setzen, um zu deaktivieren.
- `includeSystemPromptSection`: Wenn false, wird der Heartbeat-Abschnitt im System-Prompt ausgelassen und die Injektion von `HEARTBEAT.md` in den Bootstrap-Kontext übersprungen. Standard: `true`.
- `suppressToolErrorWarnings`: Wenn true, werden Tool-Fehlerwarn-Payloads während Heartbeat-Läufen unterdrückt.
- `timeoutSeconds`: Maximale Zeit in Sekunden, die für einen Heartbeat-Agent-Turn zulässig ist, bevor er abgebrochen wird. Nicht setzen, um `agents.defaults.timeoutSeconds` zu verwenden.
- `directPolicy`: Richtlinie für Direkt-/DM-Zustellung. `allow` (Standard) erlaubt die Zustellung an direkte Ziele. `block` unterdrückt die Zustellung an direkte Ziele und gibt `reason=dm-blocked` aus.
- `lightContext`: Wenn true, verwenden Heartbeat-Läufe einen leichtgewichtigen Bootstrap-Kontext und behalten aus den Workspace-Bootstrap-Dateien nur `HEARTBEAT.md`.
- `isolatedSession`: Wenn true, läuft jeder Heartbeat in einer frischen Sitzung ohne vorherigen Konversationsverlauf. Dasselbe Isolationsmuster wie bei Cron `sessionTarget: "isolated"`. Reduziert die Tokenkosten pro Heartbeat von etwa 100K auf etwa 2-5K Token.
- `skipWhenBusy`: Wenn true, werden Heartbeat-Läufe bei zusätzlichen ausgelasteten Lanes dieses Agenten zurückgestellt: dessen eigene sitzungsschlüsselgebundene Subagent- oder verschachtelte Command-Arbeit. Cron-Lanes stellen Heartbeats immer zurück, auch ohne dieses Flag.
- Pro Agent: `agents.list[].heartbeat` festlegen. Wenn ein Agent `heartbeat` definiert, führen **nur diese Agenten** Heartbeats aus.
- Heartbeats führen vollständige Agent-Turns aus — kürzere Intervalle verbrauchen mehr Token.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional Pi tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        truncateAfterCompaction: true, // rotate to a smaller successor JSONL after compaction
        maxActiveTranscriptBytes: "20mb", // optional preflight local compaction trigger
        notifyUser: true, // send brief notices when compaction starts and completes (default: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // optional memory-flush-only model override
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` oder `safeguard` (gestückelte Zusammenfassung für lange Verläufe). Siehe [Compaction](/de/concepts/compaction).
- `provider`: ID eines registrierten Compaction-Provider-Plugins. Wenn gesetzt, wird statt der integrierten LLM-Zusammenfassung die `summarize()`-Funktion des Providers aufgerufen. Bei Fehler wird auf die integrierte Zusammenfassung zurückgefallen. Das Setzen eines Providers erzwingt `mode: "safeguard"`. Siehe [Compaction](/de/concepts/compaction).
- `timeoutSeconds`: Maximale Anzahl Sekunden, die für einen einzelnen Compaction-Vorgang zulässig ist, bevor OpenClaw ihn abbricht. Standard: `900`.
- `keepRecentTokens`: Pi-Schnittpunkt-Budget zum wortgetreuen Beibehalten des jüngsten Transkriptausschnitts. Manuelles `/compact` berücksichtigt dies, wenn es explizit gesetzt ist; andernfalls ist manuelle Compaction ein harter Checkpoint.
- `identifierPolicy`: `strict` (Standard), `off` oder `custom`. `strict` stellt der Compaction-Zusammenfassung integrierte Leitlinien zur Beibehaltung undurchsichtiger Kennungen voran.
- `identifierInstructions`: Optionaler benutzerdefinierter Text zur Beibehaltung von Kennungen, der verwendet wird, wenn `identifierPolicy=custom` ist.
- `qualityGuard`: Prüfungen für erneute Versuche bei fehlerhaft formatierten Ausgaben für Safeguard-Zusammenfassungen. Im Safeguard-Modus standardmäßig aktiviert; setzen Sie `enabled: false`, um das Audit zu überspringen.
- `midTurnPrecheck`: Optionale Pi-Tool-Loop-Druckprüfung. Wenn `enabled: true`, prüft OpenClaw den Kontextdruck, nachdem Tool-Ergebnisse angehängt wurden und bevor der nächste Modellaufruf erfolgt. Wenn der Kontext nicht mehr passt, bricht es den aktuellen Versuch vor dem Einreichen des Prompts ab und verwendet den vorhandenen Precheck-Wiederherstellungspfad erneut, um Tool-Ergebnisse zu kürzen oder zu komprimieren und es erneut zu versuchen. Funktioniert mit den Compaction-Modi `default` und `safeguard`. Standard: deaktiviert.
- `postCompactionSections`: Optionale AGENTS.md-H2/H3-Abschnittsnamen zur erneuten Injektion nach Compaction. Standardmäßig `["Session Startup", "Red Lines"]`; setzen Sie `[]`, um die erneute Injektion zu deaktivieren. Wenn nicht gesetzt oder explizit auf dieses Standardpaar gesetzt, werden ältere Überschriften `Every Session`/`Safety` ebenfalls als Legacy-Fallback akzeptiert.
- `model`: Optionale `provider/model-id`-Überschreibung nur für die Compaction-Zusammenfassung. Verwenden Sie dies, wenn die Hauptsitzung ein Modell behalten soll, Compaction-Zusammenfassungen aber auf einem anderen laufen sollen; wenn nicht gesetzt, verwendet Compaction das primäre Modell der Sitzung.
- `maxActiveTranscriptBytes`: Optionaler Byte-Schwellenwert (`number` oder Zeichenketten wie `"20mb"`), der vor einem Lauf normale lokale Compaction auslöst, wenn das aktive JSONL den Schwellenwert überschreitet. Erfordert `truncateAfterCompaction`, damit erfolgreiche Compaction zu einem kleineren Nachfolge-Transkript rotieren kann. Deaktiviert, wenn nicht gesetzt oder `0`.
- `notifyUser`: Wenn `true`, werden kurze Hinweise an den Benutzer gesendet, wenn Compaction beginnt und wenn sie abgeschlossen ist (zum Beispiel „Compacting context...“ und „Compaction complete“). Standardmäßig deaktiviert, damit Compaction stumm bleibt.
- `memoryFlush`: Stummer agentischer Turn vor automatischer Compaction, um dauerhafte Erinnerungen zu speichern. Setzen Sie `model` auf ein exaktes Provider/Modell wie `ollama/qwen3:8b`, wenn dieser Verwaltungs-Turn auf einem lokalen Modell bleiben soll; die Überschreibung übernimmt nicht die Fallback-Kette der aktiven Sitzung. Wird übersprungen, wenn der Workspace schreibgeschützt ist.

### `agents.defaults.runRetries`

Grenzen für Wiederholungsiterationen der äußeren Ausführungsschleife für den eingebetteten Pi-Runner, um während der Fehlerwiederherstellung endlose Ausführungsschleifen zu verhindern. Beachten Sie, dass diese Einstellung derzeit nur für die eingebettete Agent-Laufzeit gilt, nicht für ACP- oder CLI-Laufzeiten.

```json5
{
  agents: {
    defaults: {
      runRetries: {
        base: 24,
        perProfile: 8,
        min: 32,
        max: 160,
      },
    },
    list: [
      {
        id: "main",
        runRetries: { max: 50 }, // optional per-agent overrides
      },
    ],
  },
}
```

- `base`: Basisanzahl der Wiederholungsiterationen für die äußere Ausführungsschleife. Standard: `24`.
- `perProfile`: Zusätzliche Wiederholungsiterationen, die pro Fallback-Profilkandidat gewährt werden. Standard: `8`.
- `min`: Absolutes Mindestlimit für Wiederholungsiterationen. Standard: `32`.
- `max`: Absolutes Höchstlimit für Wiederholungsiterationen, um unkontrollierte Ausführung zu verhindern. Standard: `160`.

### `agents.defaults.contextPruning`

Entfernt **alte Tool-Ergebnisse** aus dem In-Memory-Kontext, bevor dieser an das LLM gesendet wird. Ändert den Sitzungsverlauf auf der Festplatte **nicht**.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl mode behavior">

- `mode: "cache-ttl"` aktiviert Bereinigungsdurchläufe.
- `ttl` steuert, wie oft die Bereinigung erneut ausgeführt werden kann (nach dem letzten Cache-Zugriff).
- Die Bereinigung kürzt zunächst übergroße Tool-Ergebnisse weich und löscht anschließend bei Bedarf ältere Tool-Ergebnisse hart.

**Soft-trim** behält Anfang und Ende bei und fügt `...` in der Mitte ein.

**Hard-clear** ersetzt das gesamte Tool-Ergebnis durch den Platzhalter.

Hinweise:

- Bildblöcke werden nie gekürzt oder gelöscht.
- Verhältnisse basieren auf Zeichen (ungefähr), nicht auf exakten Token-Zahlen.
- Wenn weniger als `keepLastAssistants` Assistant-Nachrichten vorhanden sind, wird die Bereinigung übersprungen.

</Accordion>

Weitere Verhaltensdetails finden Sie unter [Sitzungsbereinigung](/de/concepts/session-pruning).

### Block-Streaming

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Nicht-Telegram-Kanäle erfordern explizit `*.blockStreaming: true`, um Blockantworten zu aktivieren.
- Kanal-Overrides: `channels.<channel>.blockStreamingCoalesce` (und Varianten pro Konto). Signal/Slack/Discord/Google Chat verwenden standardmäßig `minChars: 1500`.
- `humanDelay`: zufällige Pause zwischen Blockantworten. `natural` = 800–2500 ms. Override pro Agent: `agents.list[].humanDelay`.

Weitere Details zu Verhalten und Chunking finden Sie unter [Streaming](/de/concepts/streaming).

### Tippindikatoren

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Standardwerte: `instant` für Direktchats/Erwähnungen, `message` für nicht erwähnte Gruppenchats.
- Overrides pro Sitzung: `session.typingMode`, `session.typingIntervalSeconds`.

Siehe [Tippindikatoren](/de/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Optionales Sandboxing für den eingebetteten Agenten. Die vollständige Anleitung finden Sie unter [Sandboxing](/de/gateway/sandboxing).

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / inline contents also supported:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Sandbox details">

**Backend:**

- `docker`: lokale Docker-Laufzeitumgebung (Standard)
- `ssh`: generische SSH-gestützte Remote-Laufzeitumgebung
- `openshell`: OpenShell-Laufzeitumgebung

Wenn `backend: "openshell"` ausgewählt ist, werden laufzeitspezifische Einstellungen nach
`plugins.entries.openshell.config` verschoben.

**SSH-Backend-Konfiguration:**

- `target`: SSH-Ziel im Format `user@host[:port]`
- `command`: SSH-Client-Befehl (Standard: `ssh`)
- `workspaceRoot`: absoluter Remote-Root, der für Workspaces pro Scope verwendet wird
- `identityFile` / `certificateFile` / `knownHostsFile`: vorhandene lokale Dateien, die an OpenSSH übergeben werden
- `identityData` / `certificateData` / `knownHostsData`: Inline-Inhalte oder SecretRefs, die OpenClaw zur Laufzeit in temporäre Dateien materialisiert
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH-Regler für die Host-Key-Richtlinie

**SSH-Auth-Priorität:**

- `identityData` hat Vorrang vor `identityFile`
- `certificateData` hat Vorrang vor `certificateFile`
- `knownHostsData` hat Vorrang vor `knownHostsFile`
- SecretRef-gestützte `*Data`-Werte werden aus dem aktiven Runtime-Snapshot der Secrets aufgelöst, bevor die Sandbox-Sitzung startet

**SSH-Backend-Verhalten:**

- initialisiert den Remote-Workspace einmal nach dem Erstellen oder Neuerstellen
- hält anschließend den Remote-SSH-Workspace kanonisch
- leitet `exec`, Datei-Tools und Medienpfade über SSH weiter
- synchronisiert Remote-Änderungen nicht automatisch zurück zum Host
- unterstützt keine Sandbox-Browser-Container

**Workspace-Zugriff:**

- `none`: Sandbox-Workspace pro Scope unter `~/.openclaw/sandboxes`
- `ro`: Sandbox-Workspace unter `/workspace`, Agent-Workspace schreibgeschützt unter `/agent` eingehängt
- `rw`: Agent-Workspace mit Lese-/Schreibzugriff unter `/workspace` eingehängt

**Scope:**

- `session`: Container und Workspace pro Sitzung
- `agent`: ein Container und Workspace pro Agent (Standard)
- `shared`: gemeinsamer Container und Workspace (keine sitzungsübergreifende Isolation)

**OpenShell-Plugin-Konfiguration:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell-Modus:**

- `mirror`: Remote vor `exec` aus lokalem Workspace initialisieren, nach `exec` zurücksynchronisieren; lokaler Workspace bleibt kanonisch
- `remote`: Remote einmal initialisieren, wenn die Sandbox erstellt wird, anschließend den Remote-Workspace kanonisch halten

Im Modus `remote` werden host-lokale Änderungen, die außerhalb von OpenClaw vorgenommen wurden, nach dem Initialisierungsschritt nicht automatisch in die Sandbox synchronisiert.
Der Transport erfolgt per SSH in die OpenShell-Sandbox, aber das Plugin besitzt den Sandbox-Lebenszyklus und die optionale Spiegelungssynchronisierung.

**`setupCommand`** wird einmal nach der Container-Erstellung ausgeführt (über `sh -lc`). Erfordert Netzwerk-Egress, beschreibbaren Root und Root-Benutzer.

**Container verwenden standardmäßig `network: "none"`** — setzen Sie dies auf `"bridge"` (oder ein benutzerdefiniertes Bridge-Netzwerk), wenn der Agent ausgehenden Zugriff benötigt.
`"host"` ist blockiert. `"container:<id>"` ist standardmäßig blockiert, sofern Sie nicht explizit
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` setzen (Break-Glass).

**Eingehende Anhänge** werden im aktiven Workspace unter `media/inbound/*` bereitgestellt.

**`docker.binds`** hängt zusätzliche Host-Verzeichnisse ein; globale und agentenspezifische Bind-Mounts werden zusammengeführt.

**Sandbox-Browser** (`sandbox.browser.enabled`): Chromium + CDP in einem Container. noVNC-URL wird in den System-Prompt eingefügt. Erfordert kein `browser.enabled` in `openclaw.json`.
Der noVNC-Beobachterzugriff verwendet standardmäßig VNC-Auth, und OpenClaw gibt eine kurzlebige Token-URL aus (statt das Passwort in der gemeinsamen URL offenzulegen).

- `allowHostControl: false` (Standard) hindert Sandbox-Sitzungen daran, den Host-Browser anzusteuern.
- `network` ist standardmäßig `openclaw-sandbox-browser` (dediziertes Bridge-Netzwerk). Setzen Sie es nur dann auf `bridge`, wenn Sie explizit globale Bridge-Konnektivität wünschen.
- `cdpSourceRange` beschränkt optional eingehenden CDP-Zugriff am Container-Rand auf einen CIDR-Bereich (zum Beispiel `172.21.0.1/32`).
- `sandbox.browser.binds` hängt zusätzliche Host-Verzeichnisse nur in den Sandbox-Browser-Container ein. Wenn gesetzt (einschließlich `[]`), ersetzt es `docker.binds` für den Browser-Container.
- Start-Standardwerte sind in `scripts/sandbox-browser-entrypoint.sh` definiert und für Container-Hosts abgestimmt:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (standardmäßig aktiviert)
  - `--disable-3d-apis`, `--disable-software-rasterizer` und `--disable-gpu` sind
    standardmäßig aktiviert und können mit
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` deaktiviert werden, wenn WebGL-/3D-Nutzung dies erfordert.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` aktiviert Erweiterungen wieder, falls Ihr Workflow
    davon abhängt.
  - `--renderer-process-limit=2` kann mit
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` geändert werden; setzen Sie `0`, um Chromiums
    Standard-Prozesslimit zu verwenden.
  - zusätzlich `--no-sandbox`, wenn `noSandbox` aktiviert ist.
  - Standardwerte sind die Baseline des Container-Images; verwenden Sie ein benutzerdefiniertes Browser-Image mit einem benutzerdefinierten
    Einstiegspunkt, um Container-Standardwerte zu ändern.

</Accordion>

Browser-Sandboxing und `sandbox.docker.binds` sind nur für Docker verfügbar.

Images bauen (aus einem Source-Checkout):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Für npm-Installationen ohne Source-Checkout finden Sie unter [Sandboxing § Images und Einrichtung](/de/gateway/sandboxing#images-and-setup) Inline-`docker build`-Befehle.

### `agents.list` (Overrides pro Agent)

Verwenden Sie `agents.list[].tts`, um einem Agenten einen eigenen TTS-Provider, eine Stimme, ein Modell,
einen Stil oder einen Auto-TTS-Modus zu geben. Der Agentenblock wird per Deep-Merge über das globale
`messages.tts` gelegt, sodass gemeinsam genutzte Zugangsdaten an einer Stelle bleiben können, während einzelne
Agenten nur die Sprach- oder Provider-Felder überschreiben, die sie benötigen. Die Überschreibung des aktiven Agenten
gilt für automatische gesprochene Antworten, `/tts audio`, `/tts status` und
das Agenten-Tool `tts`. Siehe [Text-to-Speech](/de/tools/tts#per-agent-voice-overrides)
für Provider-Beispiele und Vorrangregeln.

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // replaces agents.defaults.skills when set
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: stabile Agenten-ID (erforderlich).
- `default`: Wenn mehrere gesetzt sind, gewinnt der erste Eintrag (Warnung wird protokolliert). Wenn keiner gesetzt ist, ist der erste Listeneintrag der Standard.
- `model`: Die Zeichenkettenform legt ein striktes primäres Modell pro Agent ohne Modell-Fallback fest; die Objektform `{ primary }` ist ebenfalls strikt, sofern Sie keine `fallbacks` hinzufügen. Verwenden Sie `{ primary, fallbacks: [...] }`, um diesen Agenten für Fallbacks zu aktivieren, oder `{ primary, fallbacks: [] }`, um das strikte Verhalten ausdrücklich zu machen. Cron-Jobs, die nur `primary` überschreiben, erben weiterhin Standard-Fallbacks, sofern Sie nicht `fallbacks: []` setzen.
- `params`: Stream-Parameter pro Agent, die über den ausgewählten Modelleintrag in `agents.defaults.models` gelegt werden. Verwenden Sie dies für agentenspezifische Überschreibungen wie `cacheRetention`, `temperature` oder `maxTokens`, ohne den gesamten Modellkatalog zu duplizieren.
- `tts`: optionale Text-to-Speech-Überschreibungen pro Agent. Der Block wird per Deep-Merge über `messages.tts` gelegt. Belassen Sie daher gemeinsam genutzte Provider-Zugangsdaten und Fallback-Richtlinien in `messages.tts` und setzen Sie hier nur personaspezifische Werte wie Provider, Stimme, Modell, Stil oder Auto-Modus.
- `skills`: optionale Skill-Zulassungsliste pro Agent. Wenn sie weggelassen wird, erbt der Agent `agents.defaults.skills`, falls gesetzt; eine explizite Liste ersetzt die Standardwerte, statt sie zusammenzuführen, und `[]` bedeutet keine Skills.
- `thinkingDefault`: optionales Standard-Denkniveau pro Agent (`off | minimal | low | medium | high | xhigh | adaptive | max`). Überschreibt `agents.defaults.thinkingDefault` für diesen Agenten, wenn keine Überschreibung pro Nachricht oder Sitzung gesetzt ist. Das ausgewählte Provider-/Modellprofil steuert, welche Werte gültig sind; bei Google Gemini behält `adaptive` das vom Provider verwaltete dynamische Denken bei (`thinkingLevel` wird bei Gemini 3/3.1 weggelassen, `thinkingBudget: -1` bei Gemini 2.5).
- `reasoningDefault`: optionale Standard-Sichtbarkeit für Reasoning pro Agent (`on | off | stream`). Überschreibt `agents.defaults.reasoningDefault` für diesen Agenten, wenn keine Reasoning-Überschreibung pro Nachricht oder Sitzung gesetzt ist.
- `fastModeDefault`: optionaler Standard für den Schnellmodus pro Agent (`true | false`). Gilt, wenn keine Schnellmodus-Überschreibung pro Nachricht oder Sitzung gesetzt ist.
- `models`: optionale Modellkatalog-/Runtime-Überschreibungen pro Agent, indiziert nach vollständigen `provider/model`-IDs. Verwenden Sie `models["provider/model"].agentRuntime` für Runtime-Ausnahmen pro Agent.
- `runtime`: optionaler Runtime-Deskriptor pro Agent. Verwenden Sie `type: "acp"` mit `runtime.acp`-Standardwerten (`agent`, `backend`, `mode`, `cwd`), wenn der Agent standardmäßig ACP-Harness-Sitzungen verwenden soll.
- `identity.avatar`: arbeitsbereichsrelativer Pfad, `http(s)`-URL oder `data:`-URI.
- `identity` leitet Standardwerte ab: `ackReaction` aus `emoji`, `mentionPatterns` aus `name`/`emoji`.
- `subagents.allowAgents`: Zulassungsliste von Agenten-IDs für explizite `sessions_spawn.agentId`-Ziele (`["*"]` = beliebig; Standard: nur derselbe Agent). Fügen Sie die ID des Anfragenden ein, wenn selbstadressierte `agentId`-Aufrufe erlaubt sein sollen.
- Sandbox-Vererbungsprüfung: Wenn die anfragende Sitzung in einer Sandbox läuft, lehnt `sessions_spawn` Ziele ab, die ohne Sandbox laufen würden.
- `subagents.requireAgentId`: Wenn true, werden `sessions_spawn`-Aufrufe blockiert, die `agentId` weglassen (erzwingt explizite Profilauswahl; Standard: false).

---

## Multi-Agent-Routing

Führen Sie mehrere isolierte Agenten innerhalb eines Gateways aus. Siehe [Multi-Agent](/de/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Binding-Abgleichfelder

- `type` (optional): `route` für normales Routing (fehlender Typ ist standardmäßig route), `acp` für persistente ACP-Konversations-Bindings.
- `match.channel` (erforderlich)
- `match.accountId` (optional; `*` = beliebiges Konto; weggelassen = Standardkonto)
- `match.peer` (optional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (optional; kanalspezifisch)
- `acp` (optional; nur für `type: "acp"`): `{ mode, label, cwd, backend }`

**Deterministische Abgleichreihenfolge:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exakt, ohne Peer/Guild/Team)
5. `match.accountId: "*"` (kanalweit)
6. Standardagent

Innerhalb jeder Ebene gewinnt der erste passende `bindings`-Eintrag.

Für Einträge mit `type: "acp"` löst OpenClaw anhand der exakten Konversationsidentität auf (`match.channel` + Konto + `match.peer.id`) und verwendet nicht die oben genannte Ebenenreihenfolge für Route-Bindings.

### Zugriffsprofile pro Agent

<Accordion title="Vollzugriff (keine Sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Schreibgeschützte Tools + Arbeitsbereich">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Kein Dateisystemzugriff (nur Messaging)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Siehe [Multi-Agent-Sandbox und Tools](/de/tools/multi-agent-sandbox-tools) für Details zur Vorrangreihenfolge.

---

## Sitzung

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Details zu Sitzungsfeldern">

- **`scope`**: grundlegende Sitzungsgruppierungsstrategie für Gruppenchats.
  - `per-sender` (Standard): Jeder Absender erhält eine isolierte Sitzung innerhalb eines Kanalkontexts.
  - `global`: Alle Teilnehmer in einem Kanalkontext teilen sich eine einzelne Sitzung (nur verwenden, wenn ein gemeinsamer Kontext beabsichtigt ist).
- **`dmScope`**: wie DMs gruppiert werden.
  - `main`: Alle DMs teilen sich die Hauptsitzung.
  - `per-peer`: nach Absender-ID kanalübergreifend isolieren.
  - `per-channel-peer`: pro Kanal + Absender isolieren (empfohlen für Posteingänge mit mehreren Benutzern).
  - `per-account-channel-peer`: pro Konto + Kanal + Absender isolieren (empfohlen für mehrere Konten).
- **`identityLinks`**: ordnet kanonische IDs Provider-präfixierten Peers für kanalübergreifende Sitzungsfreigabe zu. Dock-Befehle wie `/dock_discord` verwenden dieselbe Zuordnung, um die Antwortroute der aktiven Sitzung zu einem anderen verknüpften Kanal-Peer zu wechseln; siehe [Channel-Docking](/de/concepts/channel-docking).
- **`reset`**: primäre Reset-Richtlinie. `daily` setzt zur lokalen Zeit `atHour` zurück; `idle` setzt nach `idleMinutes` zurück. Wenn beides konfiguriert ist, gewinnt das, was zuerst abläuft. Die Aktualität des täglichen Resets verwendet `sessionStartedAt` der Sitzungszeile; die Aktualität des Leerlauf-Resets verwendet `lastInteractionAt`. Hintergrund-/Systemereignis-Schreibvorgänge wie Heartbeat, Cron-Weckvorgänge, Exec-Benachrichtigungen und Gateway-Buchhaltung können `updatedAt` aktualisieren, halten tägliche/Leerlauf-Sitzungen aber nicht aktuell.
- **`resetByType`**: typspezifische Überschreibungen (`direct`, `group`, `thread`). Das ältere `dm` wird als Alias für `direct` akzeptiert.
- **`mainKey`**: älteres Feld. Die Laufzeit verwendet für den Haupt-Bucket direkter Chats immer `"main"`.
- **`agentToAgent.maxPingPongTurns`**: maximale Hin-und-her-Antwortzüge zwischen Agenten während Agent-zu-Agent-Austauschen (Ganzzahl, Bereich: `0`-`20`, Standard: `5`). `0` deaktiviert Ping-Pong-Verkettung.
- **`sendPolicy`**: Abgleich nach `channel`, `chatType` (`direct|group|channel`, mit älterem Alias `dm`), `keyPrefix` oder `rawKeyPrefix`. Die erste Ablehnung gewinnt.
- **`maintenance`**: Sitzungs-Store-Bereinigung + Aufbewahrungssteuerung.
  - `mode`: `warn` gibt nur Warnungen aus; `enforce` wendet die Bereinigung an.
  - `pruneAfter`: Altersgrenze für veraltete Einträge (Standard `30d`).
  - `maxEntries`: maximale Anzahl von Einträgen in `sessions.json` (Standard `500`). Die Laufzeit schreibt Batch-Bereinigungen mit einem kleinen High-Water-Puffer für produktionsgroße Obergrenzen; `openclaw sessions cleanup --enforce` wendet die Obergrenze sofort an.
  - `rotateBytes`: veraltet und ignoriert; `openclaw doctor --fix` entfernt es aus älteren Konfigurationen.
  - `resetArchiveRetention`: Aufbewahrung für `*.reset.<timestamp>`-Transkriptarchive. Standardmäßig `pruneAfter`; auf `false` setzen, um sie zu deaktivieren.
  - `maxDiskBytes`: optionales Speicherplatzbudget für das Sitzungsverzeichnis. Im Modus `warn` protokolliert es Warnungen; im Modus `enforce` entfernt es zuerst die ältesten Artefakte/Sitzungen.
  - `highWaterBytes`: optionales Ziel nach Budgetbereinigung. Standardmäßig `80%` von `maxDiskBytes`.
- **`threadBindings`**: globale Standardwerte für threadgebundene Sitzungsfunktionen.
  - `enabled`: zentraler Standardschalter (Provider können ihn überschreiben; Discord verwendet `channels.discord.threadBindings.enabled`)
  - `idleHours`: standardmäßiges automatisches Aufheben des Fokus bei Inaktivität in Stunden (`0` deaktiviert; Provider können überschreiben)
  - `maxAgeHours`: standardmäßiges hartes Maximalalter in Stunden (`0` deaktiviert; Provider können überschreiben)
  - `spawnSessions`: Standard-Gate zum Erstellen threadgebundener Arbeitssitzungen aus `sessions_spawn` und ACP-Thread-Spawns. Standardmäßig `true`, wenn Thread-Bindings aktiviert sind; Provider/Konten können überschreiben.
  - `defaultSpawnContext`: standardmäßiger nativer Subagent-Kontext für threadgebundene Spawns (`"fork"` oder `"isolated"`). Standardmäßig `"fork"`.

</Accordion>

---

## Nachrichten

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer | queue (legacy one-at-a-time) | followup | collect | steer-backlog | steer+backlog | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "steer",
        telegram: "steer",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Antwortpräfix

Überschreibungen pro Kanal/Konto: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Auflösung (am spezifischsten gewinnt): Konto → Kanal → global. `""` deaktiviert und stoppt die Kaskade. `"auto"` leitet `[{identity.name}]` ab.

**Template-Variablen:**

| Variable          | Beschreibung               | Beispiel                    |
| ----------------- | -------------------------- | --------------------------- |
| `{model}`         | Kurzer Modellname          | `claude-opus-4-6`           |
| `{modelFull}`     | Vollständige Modellkennung | `anthropic/claude-opus-4-6` |
| `{provider}`      | Provider-Name              | `anthropic`                 |
| `{thinkingLevel}` | Aktuelle Denkstufe         | `high`, `low`, `off`        |
| `{identity.name}` | Name der Agentenidentität  | (identisch mit `"auto"`)    |

Bei Variablen wird die Groß-/Kleinschreibung ignoriert. `{think}` ist ein Alias für `{thinkingLevel}`.

### Bestätigungsreaktion

- Standardmäßig `identity.emoji` des aktiven Agenten, andernfalls `"👀"`. Auf `""` setzen, um sie zu deaktivieren.
- Überschreibungen pro Kanal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Auflösungsreihenfolge: Konto → Kanal → `messages.ackReaction` → Identitäts-Fallback.
- Umfang: `group-mentions` (Standard), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: entfernt die Bestätigung nach der Antwort auf reaktionsfähigen Kanälen wie Slack, Discord, Telegram, WhatsApp und iMessage.
- `messages.statusReactions.enabled`: aktiviert Lebenszyklus-Statusreaktionen auf Slack, Discord und Telegram.
  Auf Slack und Discord bleiben Statusreaktionen bei nicht gesetztem Wert aktiviert, wenn Bestätigungsreaktionen aktiv sind.
  Auf Telegram setzen Sie dies ausdrücklich auf `true`, um Lebenszyklus-Statusreaktionen zu aktivieren.

### Inbound-Entprellung

Bündelt schnell aufeinanderfolgende reine Textnachrichten desselben Absenders zu einem einzelnen Agentendurchlauf. Medien/Anhänge lösen sofortiges Senden aus. Steuerbefehle umgehen die Entprellung.

### TTS (Text-zu-Sprache)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
        microsoft: {
          voice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
      },
    },
  },
}
```

- `auto` steuert den standardmäßigen automatischen TTS-Modus: `off`, `always`, `inbound` oder `tagged`. `/tts on|off` kann lokale Einstellungen überschreiben, und `/tts status` zeigt den effektiven Zustand.
- `summaryModel` überschreibt `agents.defaults.model.primary` für automatische Zusammenfassungen.
- `modelOverrides` ist standardmäßig aktiviert; `modelOverrides.allowProvider` ist standardmäßig `false` (Opt-in).
- API-Schlüssel greifen auf `ELEVENLABS_API_KEY`/`XI_API_KEY` und `OPENAI_API_KEY` zurück.
- Gebündelte Sprach-Provider gehören Plugins. Wenn `plugins.allow` gesetzt ist, fügen Sie jedes TTS-Provider-Plugin ein, das Sie verwenden möchten, zum Beispiel `microsoft` für Edge TTS. Die ältere Provider-ID `edge` wird als Alias für `microsoft` akzeptiert.
- `providers.openai.baseUrl` überschreibt den OpenAI-TTS-Endpunkt. Die Auflösungsreihenfolge ist Konfiguration, dann `OPENAI_TTS_BASE_URL`, dann `https://api.openai.com/v1`.
- Wenn `providers.openai.baseUrl` auf einen Nicht-OpenAI-Endpunkt verweist, behandelt OpenClaw ihn als OpenAI-kompatiblen TTS-Server und lockert die Modell-/Stimmenvalidierung.

---

## Talk

Standardwerte für den Talk-Modus (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    consultThinkingLevel: "low",
    consultFastMode: true,
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- `talk.provider` muss mit einem Schlüssel in `talk.providers` übereinstimmen, wenn mehrere Talk-Provider konfiguriert sind.
- Ältere flache Talk-Schlüssel (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) dienen nur der Kompatibilität. Führen Sie `openclaw doctor --fix` aus, um persistierte Konfiguration in `talk.providers.<provider>` umzuschreiben.
- Stimmen-IDs greifen auf `ELEVENLABS_VOICE_ID` oder `SAG_VOICE_ID` zurück.
- `providers.*.apiKey` akzeptiert Klartextzeichenfolgen oder SecretRef-Objekte.
- Der Fallback `ELEVENLABS_API_KEY` gilt nur, wenn kein Talk-API-Schlüssel konfiguriert ist.
- `providers.*.voiceAliases` lässt Talk-Direktiven Anzeigenamen verwenden.
- `providers.mlx.modelId` wählt das Hugging-Face-Repository aus, das vom lokalen macOS-MLX-Helfer verwendet wird. Wenn ausgelassen, verwendet macOS `mlx-community/Soprano-80M-bf16`.
- Die macOS-MLX-Wiedergabe läuft über den gebündelten Helfer `openclaw-mlx-tts`, wenn vorhanden, oder über eine ausführbare Datei in `PATH`; `OPENCLAW_MLX_TTS_BIN` überschreibt den Helferpfad für die Entwicklung.
- `consultThinkingLevel` steuert die Denkstufe für den vollständigen OpenClaw-Agentendurchlauf hinter Control-UI-Talk-Echtzeitaufrufen von `openclaw_agent_consult`. Nicht setzen, um das normale Sitzungs-/Modellverhalten beizubehalten.
- `consultFastMode` setzt eine einmalige Fast-Mode-Überschreibung für Control-UI-Talk-Echtzeitabfragen, ohne die normale Fast-Mode-Einstellung der Sitzung zu ändern.
- `speechLocale` legt die BCP-47-Locale-ID fest, die von der iOS/macOS-Talk-Spracherkennung verwendet wird. Nicht setzen, um die Gerätestandardeinstellung zu verwenden.
- `silenceTimeoutMs` steuert, wie lange der Talk-Modus nach Benutzerstille wartet, bevor er das Transkript sendet. Bei nicht gesetztem Wert bleibt das plattformspezifische Standard-Pausenfenster erhalten (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` hängt Provider-seitige Systemanweisungen an den integrierten Echtzeit-Prompt von OpenClaw an, sodass der Sprachstil konfiguriert werden kann, ohne die standardmäßige Anleitung für `openclaw_agent_consult` zu verlieren.

---

## Verwandt

- [Konfigurationsreferenz](/de/gateway/configuration-reference) — alle anderen Konfigurationsschlüssel
- [Konfiguration](/de/gateway/configuration) — häufige Aufgaben und Schnelleinrichtung
- [Konfigurationsbeispiele](/de/gateway/configuration-examples)
