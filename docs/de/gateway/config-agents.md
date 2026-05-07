---
read_when:
    - Agent-Standardwerte anpassen (Modelle, Denken, Arbeitsbereich, Heartbeat, Medien, Skills)
    - Multi-Agenten-Routing und Bindungen konfigurieren
    - Sitzungen, Nachrichtenzustellung und Verhalten im Talk-Modus anpassen
summary: Agenten-Standardeinstellungen, Multi-Agent-Routing, Sitzung, Nachrichten und Talk-Konfiguration
title: Konfiguration — Agenten
x-i18n:
    generated_at: "2026-05-07T13:16:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 287b832cda451900ff184546ee38313e1304ffc9bb52bacae6b1f457c64f4c08
    source_path: gateway/config-agents.md
    workflow: 16
---

Agent-bezogene Konfigurationsschlüssel unter `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` und `talk.*`. Für Kanäle, Tools, Gateway-Laufzeit und andere
Schlüssel auf oberster Ebene siehe [Konfigurationsreferenz](/de/gateway/configuration-reference).

## Agent-Standardwerte

### `agents.defaults.workspace`

Standardwert: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Optionaler Repository-Stamm, der in der Runtime-Zeile des System-Prompts angezeigt wird. Wenn nicht festgelegt, erkennt OpenClaw ihn automatisch, indem es vom Arbeitsbereich aus nach oben läuft.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Optionale Standard-Allowlist für Skills für Agents, die
`agents.list[].skills` nicht festlegen.

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

- Lassen Sie `agents.defaults.skills` weg, um Skills standardmäßig uneingeschränkt zuzulassen.
- Lassen Sie `agents.list[].skills` weg, um die Standardwerte zu übernehmen.
- Setzen Sie `agents.list[].skills: []`, um keine Skills zuzulassen.
- Eine nicht leere Liste `agents.list[].skills` ist die endgültige Menge für diesen Agent; sie
  wird nicht mit Standardwerten zusammengeführt.

### `agents.defaults.skipBootstrap`

Deaktiviert die automatische Erstellung von Arbeitsbereich-Bootstrap-Dateien (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Überspringt die Erstellung ausgewählter optionaler Arbeitsbereichsdateien, während erforderliche Bootstrap-Dateien weiterhin geschrieben werden. Gültige Werte: `SOUL.md`, `USER.md`, `HEARTBEAT.md` und `IDENTITY.md`.

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

Steuert, wann Arbeitsbereich-Bootstrap-Dateien in den System-Prompt injiziert werden. Standardwert: `"always"`.

- `"continuation-skip"`: Sichere Fortsetzungs-Turns (nach einer abgeschlossenen Assistant-Antwort) überspringen die erneute Injektion des Arbeitsbereich-Bootstraps und reduzieren so die Prompt-Größe. Heartbeat-Läufe und Wiederholungen nach Compaction bauen den Kontext weiterhin neu auf.
- `"never"`: Deaktiviert Arbeitsbereich-Bootstrap und Kontextdatei-Injektion bei jedem Turn. Verwenden Sie dies nur für Agents, die ihren Prompt-Lebenszyklus vollständig selbst besitzen (benutzerdefinierte Kontext-Engines, native Runtimes, die ihren eigenen Kontext bauen, oder spezialisierte Workflows ohne Bootstrap). Heartbeat- und Compaction-Wiederherstellungs-Turns überspringen die Injektion ebenfalls.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Maximale Zeichenanzahl pro Arbeitsbereich-Bootstrap-Datei vor Kürzung. Standardwert: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Maximale Gesamtzeichenanzahl, die über alle Arbeitsbereich-Bootstrap-Dateien hinweg injiziert wird. Standardwert: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Steuert den für den Agent sichtbaren Hinweis im System-Prompt, wenn Bootstrap-Kontext gekürzt wird.
Standardwert: `"once"`.

- `"off"`: Niemals Hinweistext zur Kürzung in den System-Prompt injizieren.
- `"once"`: Einmal pro eindeutiger Kürzungssignatur einen knappen Hinweis injizieren (empfohlen).
- `"always"`: Bei jedem Lauf einen knappen Hinweis injizieren, wenn Kürzung vorliegt.

Detaillierte Roh-/Injektionszähler und Felder zur Konfigurationsabstimmung verbleiben in Diagnosen wie Kontext-/Statusberichten und Logs; regulärer WebChat-Benutzer-/Runtime-Kontext erhält nur den knappen Wiederherstellungshinweis.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Besitzübersicht für Kontextbudgets

OpenClaw hat mehrere umfangreiche Prompt-/Kontextbudgets, und sie sind
absichtlich nach Subsystem aufgeteilt, statt alle über einen generischen
Regler zu laufen.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normale Arbeitsbereich-Bootstrap-Injektion.
- `agents.defaults.startupContext.*`:
  einmalige Präambel für Reset-/Startup-Modellläufe, einschließlich aktueller täglicher
  `memory/*.md`-Dateien. Reine Chat-Befehle `/new` und `/reset` werden
  bestätigt, ohne das Modell aufzurufen.
- `skills.limits.*`:
  die kompakte Skills-Liste, die in den System-Prompt injiziert wird.
- `agents.defaults.contextLimits.*`:
  begrenzte Runtime-Auszüge und injizierte Runtime-eigene Blöcke.
- `memory.qmd.limits.*`:
  Größe von indizierten Speicher-Such-Snippets und Injektionen.

Verwenden Sie die passende Überschreibung pro Agent nur, wenn ein Agent ein anderes
Budget benötigt:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Steuert die beim ersten Turn injizierte Startup-Präambel bei Reset-/Startup-Modellläufen.
Reine Chat-Befehle `/new` und `/reset` bestätigen den Reset, ohne das
Modell aufzurufen, daher laden sie diese Präambel nicht.

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

- `memoryGetMaxChars`: standardmäßige Auszugsobergrenze für `memory_get`, bevor Kürzungsmetadaten
  und Fortsetzungshinweis hinzugefügt werden.
- `memoryGetDefaultLines`: standardmäßiges Zeilenfenster für `memory_get`, wenn `lines`
  weggelassen wird.
- `toolResultMaxChars`: Obergrenze für Live-Tool-Ergebnisse, verwendet für persistierte Ergebnisse und
  Überlauf-Wiederherstellung.
- `postCompactionMaxChars`: Auszugsobergrenze für AGENTS.md, verwendet während der
  Aktualisierungsinjektion nach Compaction.

#### `agents.list[].contextLimits`

Überschreibung pro Agent für die gemeinsamen `contextLimits`-Regler. Weggelassene Felder übernehmen
Werte aus `agents.defaults.contextLimits`.

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

Globale Obergrenze für die kompakte Skills-Liste, die in den System-Prompt injiziert wird. Dies
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

Überschreibung pro Agent für das Skills-Prompt-Budget.

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
Standardwert: `1200`.

Niedrigere Werte reduzieren in der Regel Vision-Token-Verbrauch und Request-Payload-Größe bei screenshotlastigen Läufen.
Höhere Werte bewahren mehr visuelle Details.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Zeitzone für den System-Prompt-Kontext (nicht für Nachrichten-Zeitstempel). Fällt auf die Host-Zeitzone zurück.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Zeitformat im System-Prompt. Standardwert: `auto` (Betriebssystempräferenz).

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
      agentRuntime: {
        id: "pi", // pi | auto | registered harness id, e.g. codex
      },
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
  - Wird vom `image`-Toolpfad als dessen Vision-Modellkonfiguration verwendet.
  - Wird auch als Fallback-Routing verwendet, wenn das ausgewählte/standardmäßige Modell keine Bildeingabe akzeptieren kann.
  - Bevorzugen Sie explizite `provider/model`-Referenzen. Bloße IDs werden aus Kompatibilitätsgründen akzeptiert; wenn eine bloße ID eindeutig mit einem konfigurierten bildfähigen Eintrag in `models.providers.*.models` übereinstimmt, qualifiziert OpenClaw sie für diesen Provider. Mehrdeutige konfigurierte Treffer erfordern ein explizites Provider-Präfix.
- `imageGenerationModel`: akzeptiert entweder eine Zeichenfolge (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Bildgenerierungsfunktion und jeder zukünftigen Tool-/Plugin-Oberfläche verwendet, die Bilder generiert.
  - Typische Werte: `google/gemini-3.1-flash-image-preview` für native Gemini-Bildgenerierung, `fal/fal-ai/flux/dev` für fal, `openai/gpt-image-2` für OpenAI Images oder `openai/gpt-image-1.5` für OpenAI-PNG-/WebP-Ausgabe mit transparentem Hintergrund.
  - Wenn Sie direkt einen Provider/ein Modell auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung (zum Beispiel `GEMINI_API_KEY` oder `GOOGLE_API_KEY` für `google/*`, `OPENAI_API_KEY` oder OpenAI Codex OAuth für `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` für `fal/*`).
  - Wenn ausgelassen, kann `image_generate` weiterhin einen authentifizierungsgestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider, dann die verbleibenden registrierten Bildgenerierungs-Provider in Provider-ID-Reihenfolge.
- `musicGenerationModel`: akzeptiert entweder eine Zeichenfolge (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Musikgenerierungsfunktion und dem integrierten Tool `music_generate` verwendet.
  - Typische Werte: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` oder `minimax/music-2.6`.
  - Wenn ausgelassen, kann `music_generate` weiterhin einen authentifizierungsgestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider, dann die verbleibenden registrierten Musikgenerierungs-Provider in Provider-ID-Reihenfolge.
  - Wenn Sie direkt einen Provider/ein Modell auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung/den passenden API-Schlüssel.
- `videoGenerationModel`: akzeptiert entweder eine Zeichenfolge (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Videogenerierungsfunktion und dem integrierten Tool `video_generate` verwendet.
  - Typische Werte: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` oder `qwen/wan2.7-r2v`.
  - Wenn ausgelassen, kann `video_generate` weiterhin einen authentifizierungsgestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider, dann die verbleibenden registrierten Videogenerierungs-Provider in Provider-ID-Reihenfolge.
  - Wenn Sie direkt einen Provider/ein Modell auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung/den passenden API-Schlüssel.
  - Der gebündelte Qwen-Videogenerierungs-Provider unterstützt bis zu 1 Ausgabevideo, 1 Eingabebild, 4 Eingabevideos, 10 Sekunden Dauer sowie Provider-weite Optionen `size`, `aspectRatio`, `resolution`, `audio` und `watermark`.
- `pdfModel`: akzeptiert entweder eine Zeichenfolge (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird vom `pdf`-Tool für Modell-Routing verwendet.
  - Wenn ausgelassen, fällt das PDF-Tool auf `imageModel` zurück und danach auf das aufgelöste Sitzungs-/Standardmodell.
- `pdfMaxBytesMb`: Standardgrößenlimit für PDFs für das `pdf`-Tool, wenn `maxBytesMb` zum Aufrufzeitpunkt nicht übergeben wird.
- `pdfMaxPages`: standardmäßige maximale Seitenzahl, die vom Extraktions-Fallback-Modus im `pdf`-Tool berücksichtigt wird.
- `verboseDefault`: standardmäßige Ausführlichkeitsstufe für Agents. Werte: `"off"`, `"on"`, `"full"`. Standard: `"off"`.
- `toolProgressDetail`: Detailmodus für `/verbose`-Toolzusammenfassungen und Toolzeilen in Fortschrittsentwürfen. Werte: `"explain"` (Standard, kompakte menschenlesbare Labels) oder `"raw"` (hängt den Rohbefehl/das Rohdetail an, sofern verfügbar). Agent-spezifisches `agents.list[].toolProgressDetail` überschreibt diesen Standard.
- `reasoningDefault`: standardmäßige Reasoning-Sichtbarkeit für Agents. Werte: `"off"`, `"on"`, `"stream"`. Agent-spezifisches `agents.list[].reasoningDefault` überschreibt diesen Standard. Konfigurierte Reasoning-Standards werden nur für Besitzer, autorisierte Absender oder Operator-Admin-Gateway-Kontexte angewendet, wenn keine Reasoning-Überschreibung pro Nachricht oder Sitzung gesetzt ist.
- `elevatedDefault`: standardmäßige Stufe für erweiterte Ausgabe bei Agents. Werte: `"off"`, `"on"`, `"ask"`, `"full"`. Standard: `"on"`.
- `model.primary`: Format `provider/model` (z. B. `openai/gpt-5.5` für OpenAI-API-Schlüssel oder Codex-OAuth-Zugriff). Wenn Sie den Provider auslassen, versucht OpenClaw zuerst einen Alias, dann einen eindeutigen konfigurierten Provider-Treffer für genau diese Modell-ID und fällt erst danach auf den konfigurierten Standard-Provider zurück (veraltetes Kompatibilitätsverhalten, bevorzugen Sie daher explizit `provider/model`). Wenn dieser Provider das konfigurierte Standardmodell nicht mehr anbietet, fällt OpenClaw auf den ersten konfigurierten Provider/das erste konfigurierte Modell zurück, statt einen veralteten entfernten Provider-Standard anzuzeigen.
- `models`: der konfigurierte Modellkatalog und die Allowlist für `/model`. Jeder Eintrag kann `alias` (Abkürzung) und `params` (Provider-spezifisch, zum Beispiel `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`) enthalten.
  - Sichere Bearbeitungen: Verwenden Sie `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, um Einträge hinzuzufügen. `config set` lehnt Ersetzungen ab, die vorhandene Allowlist-Einträge entfernen würden, sofern Sie nicht `--replace` übergeben.
  - Provider-bezogene Konfigurations-/Onboarding-Flows führen ausgewählte Provider-Modelle in diese Map zusammen und bewahren bereits konfigurierte, nicht betroffene Provider.
  - Für direkte OpenAI-Responses-Modelle ist serverseitige Compaction automatisch aktiviert. Verwenden Sie `params.responsesServerCompaction: false`, um das Einfügen von `context_management` zu stoppen, oder `params.responsesCompactThreshold`, um den Schwellenwert zu überschreiben. Siehe [OpenAI-serverseitige Compaction](/de/providers/openai#server-side-compaction-responses-api).
- `params`: globale Standard-Provider-Parameter, die auf alle Modelle angewendet werden. Festgelegt unter `agents.defaults.params` (z. B. `{ cacheRetention: "long" }`).
- Zusammenführungspriorität von `params` (Konfiguration): `agents.defaults.params` (globale Basis) wird von `agents.defaults.models["provider/model"].params` (pro Modell) überschrieben, danach überschreibt `agents.list[].params` (passende Agent-ID) schlüsselweise. Details finden Sie unter [Prompt Caching](/de/reference/prompt-caching).
- `params.extra_body`/`params.extraBody`: erweitertes Pass-through-JSON, das in `api: "openai-completions"`-Request-Bodies für OpenAI-kompatible Proxys zusammengeführt wird. Wenn es mit generierten Request-Schlüsseln kollidiert, gewinnt der Extra-Body; nicht-native Completions-Routen entfernen anschließend weiterhin OpenAI-spezifisches `store`.
- `params.chat_template_kwargs`: vLLM-/OpenAI-kompatible Chat-Template-Argumente, die in Top-Level-`api: "openai-completions"`-Request-Bodies zusammengeführt werden. Für `vllm/nemotron-3-*` mit deaktiviertem Thinking sendet das gebündelte vLLM-Plugin automatisch `enable_thinking: false` und `force_nonempty_content: true`; explizite `chat_template_kwargs` überschreiben generierte Standards, und `extra_body.chat_template_kwargs` hat weiterhin endgültige Priorität. Für vLLM-Qwen-Thinking-Steuerungen setzen Sie `params.qwenThinkingFormat` für diesen Modelleintrag auf `"chat-template"` oder `"top-level"`.
- `compat.supportedReasoningEfforts`: OpenAI-kompatible Reasoning-Aufwandsliste pro Modell. Fügen Sie `"xhigh"` für benutzerdefinierte Endpunkte hinzu, die es wirklich akzeptieren; OpenClaw stellt dann `/think xhigh` in Befehlsmenüs, Gateway-Sitzungszeilen, Sitzungs-Patch-Validierung, Agent-CLI-Validierung und `llm-task`-Validierung für diesen konfigurierten Provider/dieses konfigurierte Modell bereit. Verwenden Sie `compat.reasoningEffortMap`, wenn das Backend einen Provider-spezifischen Wert für eine kanonische Stufe erwartet.
- `params.preserveThinking`: Z.AI-spezifische Opt-in-Option für beibehaltenes Thinking. Wenn aktiviert und Thinking eingeschaltet ist, sendet OpenClaw `thinking.clear_thinking: false` und spielt vorheriges `reasoning_content` erneut ein; siehe [Z.AI Thinking und beibehaltenes Thinking](/de/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: standardmäßige Low-Level-Agent-Laufzeitrichtlinie. Eine ausgelassene ID verwendet standardmäßig OpenClaw Pi. Verwenden Sie `id: "pi"`, um das integrierte PI-Harness zu erzwingen, `id: "auto"`, damit registrierte Plugin-Harnesses unterstützte Modelle beanspruchen und PI verwendet wird, wenn keines passt, eine registrierte Harness-ID wie `id: "codex"`, um dieses Harness zu verlangen, oder einen unterstützten CLI-Backend-Alias wie `id: "claude-cli"`. Explizite Plugin-Laufzeiten schlagen geschlossen fehl, wenn das Harness nicht verfügbar ist oder fehlschlägt. Halten Sie Modellreferenzen kanonisch als `provider/model`; wählen Sie Codex, Claude CLI, Gemini CLI und andere Ausführungs-Backends über die Laufzeitkonfiguration statt über veraltete Laufzeit-Provider-Präfixe. Unter [Agent-Laufzeiten](/de/concepts/agent-runtimes) erfahren Sie, wie sich dies von der Provider-/Modellauswahl unterscheidet.
- Konfigurationsschreiber, die diese Felder ändern (zum Beispiel `/models set`, `/models set-image` und Befehle zum Hinzufügen/Entfernen von Fallbacks), speichern die kanonische Objektform und bewahren vorhandene Fallback-Listen nach Möglichkeit.
- `maxConcurrent`: maximale parallele Agent-Ausführungen über Sitzungen hinweg (jede Sitzung bleibt weiterhin serialisiert). Standard: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` steuert, welcher Low-Level-Executor Agent-Turns ausführt. Die meisten
Bereitstellungen sollten die standardmäßige OpenClaw-Pi-Laufzeit beibehalten. Verwenden Sie sie, wenn ein vertrauenswürdiges
Plugin ein natives Harness bereitstellt, etwa das gebündelte Codex-App-Server-Harness,
oder wenn Sie ein unterstütztes CLI-Backend wie Claude CLI verwenden möchten. Für das mentale
Modell siehe [Agent-Laufzeiten](/de/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, eine registrierte Plugin-Harness-ID oder ein unterstützter CLI-Backend-Alias. Das gebündelte Codex-Plugin registriert `codex`; das gebündelte Anthropic-Plugin stellt das CLI-Backend `claude-cli` bereit.
- `id: "auto"` lässt registrierte Plugin-Harnesses unterstützte Turns beanspruchen und verwendet PI, wenn kein Harness passt. Eine explizite Plugin-Laufzeit wie `id: "codex"` erfordert dieses Harness und schlägt geschlossen fehl, wenn es nicht verfügbar ist oder fehlschlägt.
- Umgebungsüberschreibung: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` überschreibt `id` für diesen Prozess.
- OpenAI-Agent-Modelle verwenden standardmäßig das Codex-Harness; `agentRuntime.id: "codex"` bleibt gültig, wenn Sie dies explizit machen möchten.
- Für Claude-CLI-Bereitstellungen bevorzugen Sie `model: "anthropic/claude-opus-4-7"` plus `agentRuntime.id: "claude-cli"`. Veraltete `claude-cli/claude-opus-4-7`-Modellreferenzen funktionieren weiterhin aus Kompatibilitätsgründen, aber neue Konfigurationen sollten die Provider-/Modellauswahl kanonisch halten und das Ausführungs-Backend in `agentRuntime.id` setzen.
- Ältere Laufzeitrichtlinien-Schlüssel werden von `openclaw doctor --fix` zu `agentRuntime` umgeschrieben.
- Die Harness-Auswahl wird nach der ersten eingebetteten Ausführung pro Sitzungs-ID fixiert. Konfigurations-/Env-Änderungen wirken sich auf neue oder zurückgesetzte Sitzungen aus, nicht auf ein vorhandenes Transkript. Veraltete OpenAI-Sitzungen mit Transkriptverlauf, aber ohne aufgezeichnete Fixierung, verwenden Codex; veraltete OpenAI-PI-Fixierungen können mit `openclaw doctor --fix` repariert werden. `/status` meldet die effektive Laufzeit, zum Beispiel `Runtime: OpenClaw Pi Default` oder `Runtime: OpenAI Codex`.
- Dies steuert nur die Ausführung von Text-Agent-Turns. Mediengenerierung, Vision, PDF, Musik, Video und TTS verwenden weiterhin ihre Provider-/Modelleinstellungen.

**Integrierte Alias-Kurzformen** (gelten nur, wenn sich das Modell in `agents.defaults.models` befindet):

| Alias               | Modell                                 |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.5`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Ihre konfigurierten Aliase haben immer Vorrang vor Standards.

Z.AI GLM-4.x-Modelle aktivieren automatisch den Denkmodus, sofern Sie nicht `--thinking off` festlegen oder `agents.defaults.models["zai/<model>"].params.thinking` selbst definieren.
Z.AI-Modelle aktivieren standardmäßig `tool_stream` für das Streaming von Tool-Aufrufen. Setzen Sie `agents.defaults.models["zai/<model>"].params.tool_stream` auf `false`, um es zu deaktivieren.
Anthropic-Claude-4.6-Modelle verwenden standardmäßig `adaptive`-Denken, wenn keine explizite Denkstufe festgelegt ist.

### `agents.defaults.cliBackends`

Optionale CLI-Backends für reine Text-Fallback-Läufe (keine Tool-Aufrufe). Nützlich als Backup, wenn API-Provider ausfallen.

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

- CLI-Backends sind textorientiert; Tools sind immer deaktiviert.
- Sessions werden unterstützt, wenn `sessionArg` festgelegt ist.
- Bilddurchreichung wird unterstützt, wenn `imageArg` Dateipfade akzeptiert.

### `agents.defaults.systemPromptOverride`

Ersetzt den gesamten von OpenClaw zusammengesetzten System-Prompt durch eine feste Zeichenfolge. Legen Sie dies auf Standardebene (`agents.defaults.systemPromptOverride`) oder pro Agent (`agents.list[].systemPromptOverride`) fest. Werte pro Agent haben Vorrang; ein leerer oder nur aus Leerzeichen bestehender Wert wird ignoriert. Nützlich für kontrollierte Prompt-Experimente.

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

Provider-unabhängige Prompt-Overlays, die nach Modellfamilie angewendet werden. Modell-IDs der GPT-5-Familie erhalten den gemeinsamen Verhaltensvertrag über Provider hinweg; `personality` steuert nur die Ebene für den freundlichen Interaktionsstil.

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

- `"friendly"` (Standard) und `"on"` aktivieren die Ebene für den freundlichen Interaktionsstil.
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
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
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

- `every`: Dauerzeichenfolge (ms/s/m/h). Standard: `30m` (API-Key-Authentifizierung) oder `1h` (OAuth-Authentifizierung). Setzen Sie dies auf `0m`, um es zu deaktivieren.
- `includeSystemPromptSection`: Wenn `false`, wird der Heartbeat-Abschnitt im System-Prompt ausgelassen und die Einfügung von `HEARTBEAT.md` in den Bootstrap-Kontext übersprungen. Standard: `true`.
- `suppressToolErrorWarnings`: Wenn `true`, werden Warn-Payloads zu Tool-Fehlern während Heartbeat-Läufen unterdrückt.
- `timeoutSeconds`: Maximale Zeit in Sekunden, die für einen Heartbeat-Agent-Turn zulässig ist, bevor er abgebrochen wird. Lassen Sie den Wert ungesetzt, um `agents.defaults.timeoutSeconds` zu verwenden.
- `directPolicy`: Zustellrichtlinie für Direktnachrichten/DMs. `allow` (Standard) erlaubt die Zustellung an direkte Ziele. `block` unterdrückt die Zustellung an direkte Ziele und gibt `reason=dm-blocked` aus.
- `lightContext`: Wenn `true`, verwenden Heartbeat-Läufe einen schlanken Bootstrap-Kontext und behalten aus den Workspace-Bootstrap-Dateien nur `HEARTBEAT.md` bei.
- `isolatedSession`: Wenn `true`, läuft jeder Heartbeat in einer neuen Session ohne vorherigen Konversationsverlauf. Gleiches Isolationsmuster wie bei Cron `sessionTarget: "isolated"`. Reduziert die Token-Kosten pro Heartbeat von ~100K auf ~2-5K Token.
- `skipWhenBusy`: Wenn `true`, werden Heartbeat-Läufe bei zusätzlichen belegten Lanes zurückgestellt: Subagent- oder verschachtelte Befehlsarbeit. Cron-Lanes stellen Heartbeats immer zurück, auch ohne dieses Flag.
- Pro Agent: Legen Sie `agents.list[].heartbeat` fest. Wenn ein Agent `heartbeat` definiert, führen **nur diese Agenten** Heartbeats aus.
- Heartbeats führen vollständige Agent-Turns aus – kürzere Intervalle verbrauchen mehr Token.

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

- `mode`: `default` oder `safeguard` (segmentierte Zusammenfassung für lange Verläufe). Siehe [Compaction](/de/concepts/compaction).
- `provider`: ID eines registrierten Compaction-Provider-Plugins. Wenn gesetzt, wird `summarize()` des Providers anstelle der integrierten LLM-Zusammenfassung aufgerufen. Fällt bei einem Fehler auf die integrierte Funktion zurück. Das Setzen eines Providers erzwingt `mode: "safeguard"`. Siehe [Compaction](/de/concepts/compaction).
- `timeoutSeconds`: Maximale Anzahl von Sekunden, die für eine einzelne Compaction-Operation zulässig ist, bevor OpenClaw sie abbricht. Standard: `900`.
- `keepRecentTokens`: Pi-Cut-Point-Budget, um den neuesten Transkriptabschnitt wörtlich beizubehalten. Manuelles `/compact` berücksichtigt dies, wenn es explizit gesetzt ist; andernfalls ist manuelle Compaction ein harter Checkpoint.
- `identifierPolicy`: `strict` (Standard), `off` oder `custom`. `strict` stellt während der Compaction-Zusammenfassung integrierte Hinweise zur Beibehaltung opaker Kennungen voran.
- `identifierInstructions`: Optionaler benutzerdefinierter Text zur Beibehaltung von Kennungen, der verwendet wird, wenn `identifierPolicy=custom`.
- `qualityGuard`: Prüfungen für Wiederholungen bei fehlerhaft formatierten Ausgaben für Safeguard-Zusammenfassungen. Im Safeguard-Modus standardmäßig aktiviert; setzen Sie `enabled: false`, um die Prüfung zu überspringen.
- `midTurnPrecheck`: Optionale Pi-Tool-Loop-Druckprüfung. Wenn `enabled: true`, prüft OpenClaw den Kontextdruck, nachdem Tool-Ergebnisse angehängt wurden und bevor der nächste Modellaufruf erfolgt. Wenn der Kontext nicht mehr passt, bricht es den aktuellen Versuch vor dem Einreichen des Prompts ab und verwendet den vorhandenen Precheck-Wiederherstellungspfad erneut, um Tool-Ergebnisse zu kürzen oder eine Compaction durchzuführen und erneut zu versuchen. Funktioniert sowohl mit dem Compaction-Modus `default` als auch mit `safeguard`. Standard: deaktiviert.
- `postCompactionSections`: Optionale AGENTS.md-H2/H3-Abschnittsnamen, die nach der Compaction erneut eingefügt werden. Standard ist `["Session Startup", "Red Lines"]`; setzen Sie `[]`, um die erneute Einfügung zu deaktivieren. Wenn nicht gesetzt oder explizit auf dieses Standardpaar gesetzt, werden ältere Überschriften `Every Session`/`Safety` ebenfalls als Legacy-Fallback akzeptiert.
- `model`: Optionaler `provider/model-id`-Override nur für die Compaction-Zusammenfassung. Verwenden Sie dies, wenn die Haupt-Session ein Modell behalten soll, Compaction-Zusammenfassungen aber auf einem anderen laufen sollen; wenn nicht gesetzt, verwendet Compaction das primäre Modell der Session.
- `maxActiveTranscriptBytes`: Optionaler Byte-Schwellenwert (`number` oder Zeichenfolgen wie `"20mb"`), der vor einem Lauf normale lokale Compaction auslöst, wenn die aktive JSONL den Schwellenwert überschreitet. Erfordert `truncateAfterCompaction`, damit eine erfolgreiche Compaction auf ein kleineres Nachfolge-Transkript rotieren kann. Deaktiviert, wenn nicht gesetzt oder `0`.
- `notifyUser`: Wenn `true`, sendet kurze Hinweise an den Benutzer, wenn Compaction startet und wenn sie abgeschlossen ist (zum Beispiel „Kontext wird kompaktiert...“ und „Compaction abgeschlossen“). Standardmäßig deaktiviert, damit Compaction still bleibt.
- `memoryFlush`: Stiller agentischer Turn vor Auto-Compaction, um dauerhafte Erinnerungen zu speichern. Setzen Sie `model` auf einen exakten Provider/ein exaktes Modell wie `ollama/qwen3:8b`, wenn dieser Verwaltungs-Turn auf einem lokalen Modell bleiben soll; der Override erbt die Fallback-Kette der aktiven Session nicht. Wird übersprungen, wenn der Workspace schreibgeschützt ist.

### `agents.defaults.contextPruning`

Schneidet **alte Tool-Ergebnisse** aus dem In-Memory-Kontext zurück, bevor an das LLM gesendet wird. Ändert **nicht** den Session-Verlauf auf der Festplatte.

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

<Accordion title="Verhalten des cache-ttl-Modus">

- `mode: "cache-ttl"` aktiviert Bereinigungsdurchläufe.
- `ttl` steuert, wie oft die Bereinigung erneut laufen kann (nach der letzten Cache-Berührung).
- Die Bereinigung kürzt zuerst übergroße Tool-Ergebnisse weich und leert anschließend bei Bedarf ältere Tool-Ergebnisse hart.

**Weiches Kürzen** behält Anfang + Ende bei und fügt `...` in der Mitte ein.

**Hartes Leeren** ersetzt das gesamte Tool-Ergebnis durch den Platzhalter.

Hinweise:

- Bildblöcke werden nie gekürzt/geleert.
- Verhältnisse sind zeichenbasiert (ungefähr), nicht exakte Token-Zahlen.
- Wenn weniger als `keepLastAssistants` Assistant-Nachrichten vorhanden sind, wird die Bereinigung übersprungen.

</Accordion>

Siehe [Session-Bereinigung](/de/concepts/session-pruning) für Verhaltensdetails.

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
- Kanal-Overrides: `channels.<channel>.blockStreamingCoalesce` (und Varianten pro Account). Signal/Slack/Discord/Google Chat verwenden standardmäßig `minChars: 1500`.
- `humanDelay`: zufällige Pause zwischen Blockantworten. `natural` = 800–2500ms. Override pro Agent: `agents.list[].humanDelay`.

Siehe [Streaming](/de/concepts/streaming) für Verhaltens- und Chunking-Details.

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

- Standards: `instant` für direkte Chats/Erwähnungen, `message` für nicht erwähnte Gruppenchats.
- Überschreibungen pro Sitzung: `session.typingMode`, `session.typingIntervalSeconds`.

Siehe [Tippindikatoren](/de/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Optionales Sandboxing für den eingebetteten Agent. Den vollständigen Leitfaden finden Sie unter [Sandboxing](/de/gateway/sandboxing).

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

- `docker`: lokale Docker-Runtime (Standard)
- `ssh`: generische SSH-gestützte Remote-Runtime
- `openshell`: OpenShell-Runtime

Wenn `backend: "openshell"` ausgewählt ist, wechseln Runtime-spezifische Einstellungen zu
`plugins.entries.openshell.config`.

**SSH-Backend-Konfiguration:**

- `target`: SSH-Ziel in der Form `user@host[:port]`
- `command`: SSH-Client-Befehl (Standard: `ssh`)
- `workspaceRoot`: absoluter Remote-Stamm, der für Workspaces pro Geltungsbereich verwendet wird
- `identityFile` / `certificateFile` / `knownHostsFile`: vorhandene lokale Dateien, die an OpenSSH übergeben werden
- `identityData` / `certificateData` / `knownHostsData`: Inline-Inhalte oder SecretRefs, die OpenClaw zur Laufzeit in temporäre Dateien materialisiert
- `strictHostKeyChecking` / `updateHostKeys`: Stellschrauben für die Host-Key-Richtlinie von OpenSSH

**SSH-Authentifizierungsrangfolge:**

- `identityData` hat Vorrang vor `identityFile`
- `certificateData` hat Vorrang vor `certificateFile`
- `knownHostsData` hat Vorrang vor `knownHostsFile`
- SecretRef-gestützte `*Data`-Werte werden aus dem aktiven Secrets-Runtime-Snapshot aufgelöst, bevor die Sandbox-Sitzung startet

**SSH-Backend-Verhalten:**

- befüllt den Remote-Workspace einmal nach dem Erstellen oder Neuerstellen
- hält danach den Remote-SSH-Workspace kanonisch
- leitet `exec`, Datei-Tools und Medienpfade über SSH
- synchronisiert Remote-Änderungen nicht automatisch zurück zum Host
- unterstützt keine Sandbox-Browser-Container

**Workspace-Zugriff:**

- `none`: Sandbox-Workspace pro Geltungsbereich unter `~/.openclaw/sandboxes`
- `ro`: Sandbox-Workspace unter `/workspace`, Agent-Workspace schreibgeschützt unter `/agent` eingehängt
- `rw`: Agent-Workspace mit Lese-/Schreibzugriff unter `/workspace` eingehängt

**Geltungsbereich:**

- `session`: Container + Workspace pro Sitzung
- `agent`: ein Container + Workspace pro Agent (Standard)
- `shared`: gemeinsam genutzter Container und Workspace (keine sitzungsübergreifende Isolation)

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

- `mirror`: Remote vor `exec` aus lokalem Workspace befüllen, nach `exec` zurücksynchronisieren; lokaler Workspace bleibt kanonisch
- `remote`: Remote einmal befüllen, wenn die Sandbox erstellt wird, danach den Remote-Workspace kanonisch halten

Im Modus `remote` werden hostlokale Bearbeitungen, die außerhalb von OpenClaw vorgenommen wurden, nach dem Befüllschritt nicht automatisch in die Sandbox synchronisiert.
Der Transport erfolgt per SSH in die OpenShell-Sandbox, aber das Plugin besitzt den Sandbox-Lebenszyklus und die optionale Spiegel-Synchronisierung.

**`setupCommand`** wird einmal nach der Container-Erstellung ausgeführt (über `sh -lc`). Benötigt ausgehenden Netzwerkzugriff, beschreibbaren Root und Root-Benutzer.

**Container verwenden standardmäßig `network: "none"`** - setzen Sie dies auf `"bridge"` (oder ein benutzerdefiniertes Bridge-Netzwerk), wenn der Agent ausgehenden Zugriff benötigt.
`"host"` wird blockiert. `"container:<id>"` ist standardmäßig blockiert, sofern Sie nicht ausdrücklich
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` setzen (Notfalloption).

**Eingehende Anhänge** werden in `media/inbound/*` im aktiven Workspace bereitgestellt.

**`docker.binds`** hängt zusätzliche Host-Verzeichnisse ein; globale und Agent-spezifische Binds werden zusammengeführt.

**Sandbox-Browser** (`sandbox.browser.enabled`): Chromium + CDP in einem Container. noVNC-URL wird in den System-Prompt eingefügt. Erfordert nicht `browser.enabled` in `openclaw.json`.
noVNC-Beobachterzugriff verwendet standardmäßig VNC-Authentifizierung, und OpenClaw gibt eine kurzlebige Token-URL aus (anstatt das Passwort in der gemeinsam genutzten URL offenzulegen).

- `allowHostControl: false` (Standard) blockiert, dass Sandbox-Sitzungen den Host-Browser ansteuern.
- `network` ist standardmäßig `openclaw-sandbox-browser` (dediziertes Bridge-Netzwerk). Setzen Sie es nur dann auf `bridge`, wenn Sie ausdrücklich globale Bridge-Konnektivität wünschen.
- `cdpSourceRange` beschränkt optional eingehenden CDP-Zugriff am Container-Rand auf einen CIDR-Bereich (zum Beispiel `172.21.0.1/32`).
- `sandbox.browser.binds` hängt zusätzliche Host-Verzeichnisse nur in den Sandbox-Browser-Container ein. Wenn gesetzt (einschließlich `[]`), ersetzt es `docker.binds` für den Browser-Container.
- Start-Standards sind in `scripts/sandbox-browser-entrypoint.sh` definiert und für Container-Hosts abgestimmt:
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
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` aktiviert Erweiterungen wieder, wenn Ihr Workflow
    davon abhängt.
  - `--renderer-process-limit=2` kann mit
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` geändert werden; setzen Sie `0`, um Chromiums
    standardmäßiges Prozesslimit zu verwenden.
  - plus `--no-sandbox`, wenn `noSandbox` aktiviert ist.
  - Standards sind die Basis des Container-Images; verwenden Sie ein eigenes Browser-Image mit einem eigenen
    Entry Point, um Container-Standards zu ändern.

</Accordion>

Browser-Sandboxing und `sandbox.docker.binds` sind nur für Docker verfügbar.

Images bauen (aus einem Source-Checkout):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Für npm-Installationen ohne Source-Checkout finden Sie Inline-`docker build`-Befehle unter [Sandboxing § Images und Einrichtung](/de/gateway/sandboxing#images-and-setup).

### `agents.list` (Überschreibungen pro Agent)

Verwenden Sie `agents.list[].tts`, um einem Agent einen eigenen TTS-Provider, eine Stimme, ein Modell,
einen Stil oder einen Auto-TTS-Modus zu geben. Der Agent-Block wird per Deep Merge über
`messages.tts` gelegt, sodass gemeinsam genutzte Anmeldedaten an einem Ort bleiben können, während einzelne
Agents nur die benötigten Felder für Stimme oder Provider überschreiben. Die Überschreibung des aktiven Agents
gilt für automatische gesprochene Antworten, `/tts audio`, `/tts status` und
das Agent-Tool `tts`. Provider-Beispiele und Rangfolge finden Sie unter [Text-to-Speech](/de/tools/tts#per-agent-voice-overrides).

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
        agentRuntime: { id: "auto" },
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

- `id`: stabile Agent-ID (erforderlich).
- `default`: Wenn mehrere gesetzt sind, gewinnt die erste (Warnung wird protokolliert). Wenn keine gesetzt ist, ist der erste Listeneintrag der Standard.
- `model`: Die Zeichenkettenform legt ein striktes primäres Modell pro Agent ohne Modell-Fallback fest; die Objektform `{ primary }` ist ebenfalls strikt, außer Sie fügen `fallbacks` hinzu. Verwenden Sie `{ primary, fallbacks: [...] }`, um diesen Agent für Fallbacks zu aktivieren, oder `{ primary, fallbacks: [] }`, um das strikte Verhalten explizit zu machen. Cron-Jobs, die nur `primary` überschreiben, erben weiterhin Standard-Fallbacks, außer Sie setzen `fallbacks: []`.
- `params`: Stream-Parameter pro Agent, die über den ausgewählten Modelleintrag in `agents.defaults.models` gemergt werden. Verwenden Sie dies für agentenspezifische Überschreibungen wie `cacheRetention`, `temperature` oder `maxTokens`, ohne den gesamten Modellkatalog zu duplizieren.
- `tts`: optionale Text-to-Speech-Überschreibungen pro Agent. Der Block wird tief über `messages.tts` gemergt; behalten Sie daher gemeinsame Provider-Anmeldedaten und Fallback-Richtlinien in `messages.tts` und setzen Sie hier nur personaspezifische Werte wie Provider, Stimme, Modell, Stil oder Auto-Modus.
- `skills`: optionale Skills-Allowlist pro Agent. Wenn sie weggelassen wird, erbt der Agent `agents.defaults.skills`, sofern gesetzt; eine explizite Liste ersetzt die Standards, statt sie zu mergen, und `[]` bedeutet keine Skills.
- `thinkingDefault`: optionale Standard-Denkstufe pro Agent (`off | minimal | low | medium | high | xhigh | adaptive | max`). Überschreibt `agents.defaults.thinkingDefault` für diesen Agent, wenn keine Überschreibung pro Nachricht oder Sitzung gesetzt ist. Das ausgewählte Provider-/Modellprofil steuert, welche Werte gültig sind; für Google Gemini behält `adaptive` das vom Provider gesteuerte dynamische Denken bei (`thinkingLevel` bei Gemini 3/3.1 weggelassen, `thinkingBudget: -1` bei Gemini 2.5).
- `reasoningDefault`: optionale Standard-Sichtbarkeit des Reasonings pro Agent (`on | off | stream`). Überschreibt `agents.defaults.reasoningDefault` für diesen Agent, wenn keine Reasoning-Überschreibung pro Nachricht oder Sitzung gesetzt ist.
- `fastModeDefault`: optionaler Standard pro Agent für den schnellen Modus (`true | false`). Wird angewendet, wenn keine Fast-Mode-Überschreibung pro Nachricht oder Sitzung gesetzt ist.
- `agentRuntime`: optionale Low-Level-Laufzeitrichtlinien-Überschreibung pro Agent. Verwenden Sie `{ id: "codex" }`, um einen Agent nur auf Codex festzulegen, während andere Agents im Modus `auto` den Standard-Pi-Fallback behalten.
- `runtime`: optionaler Laufzeitdeskriptor pro Agent. Verwenden Sie `type: "acp"` mit `runtime.acp`-Standards (`agent`, `backend`, `mode`, `cwd`), wenn der Agent standardmäßig ACP-Harness-Sitzungen verwenden soll.
- `identity.avatar`: workspace-relativer Pfad, `http(s)`-URL oder `data:`-URI.
- `identity` leitet Standards ab: `ackReaction` aus `emoji`, `mentionPatterns` aus `name`/`emoji`.
- `subagents.allowAgents`: Allowlist von Agent-IDs für explizite `sessions_spawn.agentId`-Ziele (`["*"]` = beliebig; Standard: nur derselbe Agent). Nehmen Sie die Requester-ID auf, wenn selbstzielende `agentId`-Aufrufe erlaubt sein sollen.
- Sandbox-Vererbungswächter: Wenn die Requester-Sitzung in einer Sandbox läuft, lehnt `sessions_spawn` Ziele ab, die ohne Sandbox laufen würden.
- `subagents.requireAgentId`: Wenn true, werden `sessions_spawn`-Aufrufe blockiert, die `agentId` weglassen (erzwingt explizite Profilauswahl; Standard: false).

---

## Multi-Agent-Routing

Führen Sie mehrere isolierte Agents innerhalb eines Gateway aus. Siehe [Multi-Agent](/de/concepts/multi-agent).

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

### Binding-Match-Felder

- `type` (optional): `route` für normales Routing (fehlender Typ wird standardmäßig zu route), `acp` für persistente ACP-Konversationsbindungen.
- `match.channel` (erforderlich)
- `match.accountId` (optional; `*` = beliebiges Konto; weggelassen = Standardkonto)
- `match.peer` (optional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (optional; kanalspezifisch)
- `acp` (optional; nur für `type: "acp"`): `{ mode, label, cwd, backend }`

**Deterministische Match-Reihenfolge:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exakt, kein peer/guild/team)
5. `match.accountId: "*"` (kanalweit)
6. Standard-Agent

Innerhalb jeder Ebene gewinnt der erste passende `bindings`-Eintrag.

Für `type: "acp"`-Einträge löst OpenClaw über die exakte Konversationsidentität auf (`match.channel` + Konto + `match.peer.id`) und verwendet nicht die oben genannte Route-Binding-Ebenenreihenfolge.

### Zugriffsprofile pro Agent

<Accordion title="Full access (no sandbox)">

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

<Accordion title="Read-only tools + workspace">

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

Details zur Rangfolge finden Sie unter [Multi-Agent-Sandbox und Tools](/de/tools/multi-agent-sandbox-tools).

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

- **`scope`**: grundlegende Gruppierungsstrategie für Sitzungen in Gruppenchats.
  - `per-sender` (Standard): Jeder Absender erhält eine isolierte Sitzung innerhalb eines Kanalkontexts.
  - `global`: Alle Teilnehmenden in einem Kanalkontext teilen sich eine einzige Sitzung (nur verwenden, wenn ein gemeinsamer Kontext beabsichtigt ist).
- **`dmScope`**: wie DMs gruppiert werden.
  - `main`: Alle DMs teilen sich die Hauptsitzung.
  - `per-peer`: nach Absender-ID kanalübergreifend isolieren.
  - `per-channel-peer`: pro Kanal + Absender isolieren (empfohlen für Posteingänge mit mehreren Benutzern).
  - `per-account-channel-peer`: pro Konto + Kanal + Absender isolieren (empfohlen für mehrere Konten).
- **`identityLinks`**: ordnet kanonische IDs Provider-präfixierten Peers zu, um Sitzungen kanalübergreifend zu teilen. Dock-Befehle wie `/dock_discord` verwenden dieselbe Zuordnung, um die Antwortroute der aktiven Sitzung zu einem anderen verknüpften Kanal-Peer umzuschalten; siehe [Kanal-Docking](/de/concepts/channel-docking).
- **`reset`**: primäre Zurücksetzungsrichtlinie. `daily` setzt zur lokalen Zeit `atHour` zurück; `idle` setzt nach `idleMinutes` zurück. Wenn beides konfiguriert ist, gewinnt das zuerst ablaufende Limit. Die Aktualität täglicher Zurücksetzungen verwendet `sessionStartedAt` der Sitzungszeile; die Aktualität von Leerlauf-Zurücksetzungen verwendet `lastInteractionAt`. Hintergrund-/Systemereignis-Schreibvorgänge wie Heartbeat, Cron-Wakeups, exec-Benachrichtigungen und Gateway-Buchhaltung können `updatedAt` aktualisieren, halten tägliche/Leerlauf-Sitzungen aber nicht aktuell.
- **`resetByType`**: Überschreibungen pro Typ (`direct`, `group`, `thread`). Das ältere `dm` wird als Alias für `direct` akzeptiert.
- **`mainKey`**: älteres Feld. Die Runtime verwendet immer `"main"` für den Haupt-Bucket für direkte Chats.
- **`agentToAgent.maxPingPongTurns`**: maximale Anzahl von Antwort-Rückläufen zwischen Agenten während Agent-zu-Agent-Austauschen (Ganzzahl, Bereich: `0`-`5`). `0` deaktiviert Ping-Pong-Verkettung.
- **`sendPolicy`**: Abgleich nach `channel`, `chatType` (`direct|group|channel`, mit älterem Alias `dm`), `keyPrefix` oder `rawKeyPrefix`. Die erste Ablehnung gewinnt.
- **`maintenance`**: Bereinigung des Sitzungsspeichers + Aufbewahrungssteuerung.
  - `mode`: `warn` gibt nur Warnungen aus; `enforce` wendet die Bereinigung an.
  - `pruneAfter`: Altersgrenze für veraltete Einträge (Standard `30d`).
  - `maxEntries`: maximale Anzahl von Einträgen in `sessions.json` (Standard `500`). Die Runtime schreibt die Batch-Bereinigung mit einem kleinen High-Water-Puffer für Caps in Produktionsgröße; `openclaw sessions cleanup --enforce` wendet den Cap sofort an.
  - `rotateBytes`: veraltet und ignoriert; `openclaw doctor --fix` entfernt es aus älteren Konfigurationen.
  - `resetArchiveRetention`: Aufbewahrung für `*.reset.<timestamp>`-Transkriptarchive. Standardmäßig `pruneAfter`; auf `false` setzen, um sie zu deaktivieren.
  - `maxDiskBytes`: optionales Speicherplatzbudget für das Sitzungsverzeichnis. Im Modus `warn` werden Warnungen protokolliert; im Modus `enforce` werden zuerst die ältesten Artefakte/Sitzungen entfernt.
  - `highWaterBytes`: optionales Ziel nach der Budgetbereinigung. Standardmäßig `80%` von `maxDiskBytes`.
- **`threadBindings`**: globale Standardwerte für threadgebundene Sitzungsfunktionen.
  - `enabled`: zentraler Standardschalter (Provider können ihn überschreiben; Discord verwendet `channels.discord.threadBindings.enabled`)
  - `idleHours`: standardmäßiges automatisches Unfokussieren bei Inaktivität in Stunden (`0` deaktiviert; Provider können überschreiben)
  - `maxAgeHours`: standardmäßiges hartes Höchstalter in Stunden (`0` deaktiviert; Provider können überschreiben)
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

Kanal-/Konto-spezifische Überschreibungen: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Auflösung (spezifischste Einstellung gewinnt): Konto → Kanal → global. `""` deaktiviert und stoppt die Kaskade. `"auto"` leitet `[{identity.name}]` ab.

**Template-Variablen:**

| Variable          | Beschreibung                | Beispiel                    |
| ----------------- | --------------------------- | --------------------------- |
| `{model}`         | Kurzer Modellname           | `claude-opus-4-6`           |
| `{modelFull}`     | Vollständige Modellkennung  | `anthropic/claude-opus-4-6` |
| `{provider}`      | Provider-Name               | `anthropic`                 |
| `{thinkingLevel}` | Aktuelle Denkstufe          | `high`, `low`, `off`        |
| `{identity.name}` | Name der Agentenidentität   | (identisch mit `"auto"`)    |

Variablen unterscheiden nicht zwischen Groß- und Kleinschreibung. `{think}` ist ein Alias für `{thinkingLevel}`.

### Ack-Reaktion

- Standardmäßig die `identity.emoji` des aktiven Agenten, andernfalls `"👀"`. Setzen Sie `""`, um sie zu deaktivieren.
- Kanal-spezifische Überschreibungen: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Auflösungsreihenfolge: Konto → Kanal → `messages.ackReaction` → Identitäts-Fallback.
- Geltungsbereich: `group-mentions` (Standard), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: entfernt die Ack-Reaktion nach der Antwort auf reaktionsfähigen Kanälen wie Slack, Discord, Telegram, WhatsApp und BlueBubbles.
- `messages.statusReactions.enabled`: aktiviert Lebenszyklus-Statusreaktionen auf Slack, Discord und Telegram.
  Auf Slack und Discord bleiben Statusreaktionen, wenn nicht gesetzt, aktiviert, wenn Ack-Reaktionen aktiv sind.
  Auf Telegram setzen Sie dies explizit auf `true`, um Lebenszyklus-Statusreaktionen zu aktivieren.

### Eingangs-Debounce

Bündelt schnell aufeinanderfolgende reine Textnachrichten desselben Absenders in einen einzigen Agentendurchlauf. Medien/Anhänge werden sofort weitergegeben. Steuerbefehle umgehen das Debouncing.

### TTS (Text-to-Speech)

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

- `auto` steuert den standardmäßigen Auto-TTS-Modus: `off`, `always`, `inbound` oder `tagged`. `/tts on|off` kann lokale Einstellungen überschreiben, und `/tts status` zeigt den effektiven Zustand.
- `summaryModel` überschreibt `agents.defaults.model.primary` für die automatische Zusammenfassung.
- `modelOverrides` ist standardmäßig aktiviert; `modelOverrides.allowProvider` ist standardmäßig `false` (Opt-in).
- API-Schlüssel fallen auf `ELEVENLABS_API_KEY`/`XI_API_KEY` und `OPENAI_API_KEY` zurück.
- Gebündelte Sprach-Provider gehören dem Plugin. Wenn `plugins.allow` gesetzt ist, nehmen Sie jedes TTS-Provider-Plugin auf, das Sie verwenden möchten, zum Beispiel `microsoft` für Edge TTS. Die veraltete Provider-ID `edge` wird als Alias für `microsoft` akzeptiert.
- `providers.openai.baseUrl` überschreibt den OpenAI-TTS-Endpunkt. Die Auflösungsreihenfolge ist Konfiguration, dann `OPENAI_TTS_BASE_URL`, dann `https://api.openai.com/v1`.
- Wenn `providers.openai.baseUrl` auf einen Nicht-OpenAI-Endpunkt verweist, behandelt OpenClaw ihn als OpenAI-kompatiblen TTS-Server und lockert die Modell-/Stimmenvalidierung.

---

## Talk

Standards für den Talk-Modus (macOS/iOS/Android).

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
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime",
          voice: "alloy",
        },
      },
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- `talk.provider` muss einem Schlüssel in `talk.providers` entsprechen, wenn mehrere Talk-Provider konfiguriert sind.
- Veraltete flache Talk-Schlüssel (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) dienen nur der Kompatibilität. Führen Sie `openclaw doctor --fix` aus, um persistierte Konfiguration in `talk.providers.<provider>` umzuschreiben.
- Voice-IDs fallen auf `ELEVENLABS_VOICE_ID` oder `SAG_VOICE_ID` zurück.
- `providers.*.apiKey` akzeptiert Klartextzeichenfolgen oder SecretRef-Objekte.
- Der Fallback `ELEVENLABS_API_KEY` gilt nur, wenn kein Talk-API-Schlüssel konfiguriert ist.
- `providers.*.voiceAliases` ermöglicht Talk-Anweisungen die Verwendung benutzerfreundlicher Namen.
- `providers.mlx.modelId` wählt das Hugging-Face-Repository aus, das vom lokalen macOS-MLX-Helfer verwendet wird. Wenn nicht angegeben, verwendet macOS `mlx-community/Soprano-80M-bf16`.
- Die macOS-MLX-Wiedergabe läuft über den gebündelten Helfer `openclaw-mlx-tts`, wenn vorhanden, oder über eine ausführbare Datei in `PATH`; `OPENCLAW_MLX_TTS_BIN` überschreibt den Helferpfad für die Entwicklung.
- `speechLocale` legt die BCP-47-Locale-ID fest, die von der iOS/macOS-Talk-Spracherkennung verwendet wird. Lassen Sie den Wert ungesetzt, um die Gerätevoreinstellung zu verwenden.
- `silenceTimeoutMs` steuert, wie lange der Talk-Modus nach Stille des Benutzers wartet, bevor er das Transkript sendet. Wenn nicht gesetzt, bleibt das standardmäßige Pausenfenster der Plattform erhalten (`700 ms on macOS and Android, 900 ms on iOS`).

---

## Verwandt

- [Konfigurationsreferenz](/de/gateway/configuration-reference) — alle anderen Konfigurationsschlüssel
- [Konfiguration](/de/gateway/configuration) — häufige Aufgaben und schnelle Einrichtung
- [Konfigurationsbeispiele](/de/gateway/configuration-examples)
