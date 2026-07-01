---
read_when:
    - Agent-Standardeinstellungen abstimmen (Modelle, Denken, Workspace, Heartbeat, Medien, Skills)
    - Konfiguration von Multi-Agent-Routing und Bindungen
    - |-
      OpenClaw Docs-i18n-Eingabe>
      Sitzungs-, Nachrichtenzustellungs- und Talk-Modus-Verhalten anpassen
summary: Agent-Standards, Multi-Agent-Routing, Sitzung, Nachrichten und Talk-Konfiguration
title: Konfiguration — Agenten
x-i18n:
    generated_at: "2026-07-01T12:54:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e73e82e78ea597919a304e5bb4966221c805d2ddd48e1d37b2bf06eb60aaf5c8
    source_path: gateway/config-agents.md
    workflow: 16
---

Agent-bezogene Konfigurationsschlüssel unter `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` und `talk.*`. Für Kanäle, Tools, Gateway-Laufzeit und andere
Schlüssel auf oberster Ebene siehe [Konfigurationsreferenz](/de/gateway/configuration-reference).

## Agent-Standardeinstellungen

### `agents.defaults.workspace`

Standard: `OPENCLAW_WORKSPACE_DIR`, wenn gesetzt, andernfalls `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Ein expliziter Wert für `agents.defaults.workspace` hat Vorrang vor
`OPENCLAW_WORKSPACE_DIR`. Verwenden Sie die Umgebungsvariable, um Standard-Agents
auf einen eingebundenen Workspace zu verweisen, wenn Sie diesen Pfad nicht in die Konfiguration schreiben möchten.

### `agents.defaults.repoRoot`

Optionaler Repository-Stamm, der in der Runtime-Zeile des System-Prompts angezeigt wird. Wenn nicht gesetzt, erkennt OpenClaw ihn automatisch, indem es vom Workspace aus nach oben läuft.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Optionale Standard-Allowlist für Skills für Agents, die
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

- Lassen Sie `agents.defaults.skills` weg, um Skills standardmäßig uneingeschränkt zuzulassen.
- Lassen Sie `agents.list[].skills` weg, um die Standardeinstellungen zu erben.
- Setzen Sie `agents.list[].skills: []`, um keine Skills zuzulassen.
- Eine nicht leere Liste `agents.list[].skills` ist die endgültige Menge für diesen Agent; sie
  wird nicht mit den Standardeinstellungen zusammengeführt.

### `agents.defaults.skipBootstrap`

Deaktiviert die automatische Erstellung von Workspace-Bootstrap-Dateien (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Überspringt die Erstellung ausgewählter optionaler Workspace-Dateien, schreibt aber weiterhin erforderliche Bootstrap-Dateien. Gültige Werte: `SOUL.md`, `USER.md`, `HEARTBEAT.md` und `IDENTITY.md`.

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

- `"continuation-skip"`: Sichere Fortsetzungsturns (nach einer abgeschlossenen Assistant-Antwort) überspringen die erneute Injektion des Workspace-Bootstrap und reduzieren so die Prompt-Größe. Heartbeat-Läufe und Wiederholungen nach Compaction bauen den Kontext weiterhin neu auf.
- `"never"`: Deaktiviert Workspace-Bootstrap und Kontextdatei-Injektion bei jedem Turn. Verwenden Sie dies nur für Agents, die ihren Prompt-Lebenszyklus vollständig selbst besitzen (benutzerdefinierte Kontext-Engines, native Runtimes, die ihren eigenen Kontext erstellen, oder spezialisierte Workflows ohne Bootstrap). Heartbeat- und Compaction-Recovery-Turns überspringen die Injektion ebenfalls.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Überschreibung pro Agent: `agents.list[].contextInjection`. Weggelassene Werte erben
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Maximale Zeichenanzahl pro Workspace-Bootstrap-Datei vor dem Kürzen. Standard: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Überschreibung pro Agent: `agents.list[].bootstrapMaxChars`. Weggelassene Werte erben
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Maximale Gesamtzahl injizierter Zeichen über alle Workspace-Bootstrap-Dateien hinweg. Standard: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Überschreibung pro Agent: `agents.list[].bootstrapTotalMaxChars`. Weggelassene Werte
erben `agents.defaults.bootstrapTotalMaxChars`.

### Bootstrap-Profilüberschreibungen pro Agent

Verwenden Sie Bootstrap-Profilüberschreibungen pro Agent, wenn ein Agent ein anderes Prompt-
Injektionsverhalten als die gemeinsamen Standardeinstellungen benötigt. Weggelassene Felder erben von
`agents.defaults`.

```json5
{
  agents: {
    defaults: {
      contextInjection: "continuation-skip",
      bootstrapMaxChars: 20000,
      bootstrapTotalMaxChars: 60000,
    },
    list: [
      {
        id: "strict-worker",
        contextInjection: "always",
        bootstrapMaxChars: 50000,
        bootstrapTotalMaxChars: 300000,
      },
    ],
  },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Steuert den für den Agent sichtbaren Hinweis im System-Prompt, wenn Bootstrap-Kontext gekürzt wird.
Standard: `"always"`.

- `"off"`: Niemals Hinweistext zur Kürzung in den System-Prompt injizieren.
- `"once"`: Einen knappen Hinweis einmal pro eindeutiger Kürzungssignatur injizieren.
- `"always"`: Bei jedem Lauf mit vorhandener Kürzung einen knappen Hinweis injizieren (empfohlen).

Detaillierte Roh-/Injektionszählungen und Felder zur Konfigurationsabstimmung bleiben in Diagnoseausgaben wie
Kontext-/Statusberichten und Logs; der routinemäßige WebChat-Benutzer-/Laufzeitkontext erhält nur
den knappen Wiederherstellungshinweis.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Kontextbudget-Zuordnung nach Zuständigkeit

OpenClaw hat mehrere Prompt-/Kontextbudgets mit hohem Volumen, und sie sind
absichtlich nach Subsystem getrennt, statt alle über einen generischen
Regler zu laufen.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normale Workspace-Bootstrap-Injektion.
- `agents.defaults.startupContext.*`:
  einmaliges Reset-/Startup-Prelude für Modellläufe, einschließlich neuer täglicher
  `memory/*.md`-Dateien. Reine Chatbefehle `/new` und `/reset` werden
  bestätigt, ohne das Modell aufzurufen.
- `skills.limits.*`:
  die kompakte Skills-Liste, die in den System-Prompt injiziert wird.
- `agents.defaults.contextLimits.*`:
  begrenzte Runtime-Auszüge und injizierte runtime-eigene Blöcke.
- `memory.qmd.limits.*`:
  Größen für indizierte Memory-Such-Snippets und Injektion.

Verwenden Sie die passende Überschreibung pro Agent nur, wenn ein Agent ein anderes
Budget benötigt:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Steuert das Startup-Prelude für den ersten Turn, das bei Reset-/Startup-Modellläufen injiziert wird.
Reine Chatbefehle `/new` und `/reset` bestätigen den Reset, ohne das
Modell aufzurufen, sodass sie dieses Prelude nicht laden.

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

Gemeinsame Standardeinstellungen für begrenzte Runtime-Kontextoberflächen.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: Standardobergrenze für `memory_get`-Auszüge, bevor Kürzungs-
  Metadaten und Fortsetzungshinweis hinzugefügt werden.
- `memoryGetDefaultLines`: Standard-Zeilenfenster für `memory_get`, wenn `lines`
  weggelassen wird.
- `toolResultMaxChars`: erweiterte Obergrenze für Live-Tool-Ergebnisse, die für persistierte
  Ergebnisse und Overflow-Wiederherstellung verwendet wird. Lassen Sie den Wert ungesetzt für die automatische Modellkontext-Obergrenze:
  `16000` Zeichen unter 100K Tokens, `32000` Zeichen ab 100K Tokens und `64000`
  Zeichen ab 200K Tokens. Explizite Werte bis `1000000` werden für
  Long-Context-Modelle akzeptiert, aber die wirksame Obergrenze bleibt auf etwa 30 % des
  Modell-Kontextfensters begrenzt. `openclaw doctor --deep` gibt die wirksame Obergrenze aus,
  und Doctor warnt nur, wenn eine explizite Überschreibung veraltet ist oder keine Wirkung hat.
- `postCompactionMaxChars`: Obergrenze für AGENTS.md-Auszüge, die während der Aktualisierungsinjektion
  nach Compaction verwendet wird.

#### `agents.list[].contextLimits`

Überschreibung pro Agent für die gemeinsamen `contextLimits`-Regler. Weggelassene Felder erben
von `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // advanced ceiling for this agent
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Globale Obergrenze für die kompakte Skills-Liste, die in den System-Prompt injiziert wird. Dies
wirkt sich nicht darauf aus, `SKILL.md`-Dateien bei Bedarf zu lesen.

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

Maximale Pixelgröße der längsten Bildseite in Transcript-/Tool-Bildblöcken vor Provider-Aufrufen.
Standard: `1200`.

Niedrigere Werte reduzieren in der Regel Vision-Token-Nutzung und Anfrage-Payload-Größe bei screenshotlastigen Läufen.
Höhere Werte erhalten mehr visuelle Details.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Komprimierungs-/Detailpräferenz für Image-Tools bei Bildern, die aus Dateipfaden, URLs und Medienreferenzen geladen werden.
Standard: `auto`.

OpenClaw passt die Resize-Abstufung an das ausgewählte Bildmodell an. Zum Beispiel können Claude Opus 4.8, OpenAI GPT-5.5, Qwen VL und gehostete Llama-4-Vision-Modelle größere Bilder verwenden als ältere/standardmäßige High-Detail-Vision-Pfade, während Multi-Bild-Turns im Modus `auto` aggressiver komprimiert werden, um Token- und Latenzkosten zu steuern.

Werte:

- `auto`: an Modellgrenzen und Bildanzahl anpassen.
- `efficient`: kleinere Bilder für geringere Token- und Byte-Nutzung bevorzugen.
- `balanced`: die standardmäßige mittlere Abstufung verwenden.
- `high`: mehr Details für Screenshots, Diagramme und Dokumentbilder erhalten.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
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

Zeitformat im System-Prompt. Standard: `auto` (Betriebssystempräferenz).

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
  - Wird vom `image`-Tool-Pfad als dessen Vision-Model-Konfiguration verwendet.
  - Wird außerdem als Fallback-Routing verwendet, wenn das ausgewählte/standardmäßige Modell keine Bildeingabe akzeptieren kann.
  - Bevorzugen Sie explizite `provider/model`-Referenzen. Reine IDs werden aus Kompatibilitätsgründen akzeptiert; wenn eine reine ID eindeutig mit einem konfigurierten bildeingabefähigen Eintrag in `models.providers.*.models` übereinstimmt, qualifiziert OpenClaw sie für diesen Provider. Mehrdeutige konfigurierte Treffer erfordern ein explizites Provider-Präfix.
- `imageGenerationModel`: akzeptiert entweder eine Zeichenfolge (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Bildgenerierungsfähigkeit und jeder künftigen Tool-/Plugin-Oberfläche verwendet, die Bilder generiert.
  - Typische Werte: `google/gemini-3.1-flash-image-preview` für native Gemini-Bildgenerierung, `fal/fal-ai/flux/dev` für fal, `openai/gpt-image-2` für OpenAI Images oder `openai/gpt-image-1.5` für OpenAI-PNG-/WebP-Ausgabe mit transparentem Hintergrund.
  - Wenn Sie direkt ein Provider/Modell auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung (zum Beispiel `GEMINI_API_KEY` oder `GOOGLE_API_KEY` für `google/*`, `OPENAI_API_KEY` oder OpenAI Codex OAuth für `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` für `fal/*`).
  - Wenn ausgelassen, kann `image_generate` weiterhin einen authentifizierungsgestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider und danach die verbleibenden registrierten Bildgenerierungs-Provider in Provider-ID-Reihenfolge.
- `musicGenerationModel`: akzeptiert entweder eine Zeichenfolge (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Musikgenerierungsfähigkeit und dem integrierten Tool `music_generate` verwendet.
  - Typische Werte: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` oder `minimax/music-2.6`.
  - Wenn ausgelassen, kann `music_generate` weiterhin einen authentifizierungsgestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider und danach die verbleibenden registrierten Musikgenerierungs-Provider in Provider-ID-Reihenfolge.
  - Wenn Sie direkt ein Provider/Modell auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung/API-Schlüssel.
- `videoGenerationModel`: akzeptiert entweder eine Zeichenfolge (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Videogenerierungsfähigkeit und dem integrierten Tool `video_generate` verwendet.
  - Typische Werte: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` oder `qwen/wan2.7-r2v`.
  - Wenn ausgelassen, kann `video_generate` weiterhin einen authentifizierungsgestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider und danach die verbleibenden registrierten Videogenerierungs-Provider in Provider-ID-Reihenfolge.
  - Wenn Sie direkt ein Provider/Modell auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung/API-Schlüssel.
  - Das offizielle Qwen-Videogenerierungs-Plugin unterstützt bis zu 1 Ausgabevideo, 1 Eingabebild, 4 Eingabevideos, 10 Sekunden Dauer sowie Provider-weite Optionen `size`, `aspectRatio`, `resolution`, `audio` und `watermark`.
- `pdfModel`: akzeptiert entweder eine Zeichenfolge (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird vom `pdf`-Tool für das Modell-Routing verwendet.
  - Wenn ausgelassen, fällt das PDF-Tool auf `imageModel` und danach auf das aufgelöste Sitzungs-/Standardmodell zurück.
- `pdfMaxBytesMb`: standardmäßige PDF-Größenbegrenzung für das `pdf`-Tool, wenn `maxBytesMb` zum Aufrufzeitpunkt nicht übergeben wird.
- `pdfMaxPages`: standardmäßige maximale Seitenzahl, die vom Extraktions-Fallback-Modus im `pdf`-Tool berücksichtigt wird.
- `verboseDefault`: standardmäßige Ausführlichkeitsstufe für Agenten. Werte: `"off"`, `"on"`, `"full"`. Standard: `"off"`.
- `toolProgressDetail`: Detailmodus für `/verbose`-Tool-Zusammenfassungen und Tool-Zeilen in Fortschrittsentwürfen. Werte: `"explain"` (Standard, kompakte menschliche Bezeichnungen) oder `"raw"` (hängt rohe Befehle/Details an, wenn verfügbar). Pro-Agent-`agents.list[].toolProgressDetail` überschreibt diesen Standard.
- `reasoningDefault`: standardmäßige Reasoning-Sichtbarkeit für Agenten. Werte: `"off"`, `"on"`, `"stream"`. Pro-Agent-`agents.list[].reasoningDefault` überschreibt diesen Standard. Konfigurierte Reasoning-Standards werden nur für Besitzer, autorisierte Absender oder Gateway-Kontexte mit Operator-Adminrechten angewendet, wenn keine Reasoning-Überschreibung pro Nachricht oder Sitzung festgelegt ist.
- `elevatedDefault`: standardmäßige Stufe für erweiterte Ausgaben von Agenten. Werte: `"off"`, `"on"`, `"ask"`, `"full"`. Standard: `"on"`.
- `model.primary`: Format `provider/model` (z. B. `openai/gpt-5.5` für Zugriff per OpenAI-API-Schlüssel oder Codex OAuth). Wenn Sie den Provider auslassen, versucht OpenClaw zuerst einen Alias, dann einen eindeutigen Treffer eines konfigurierten Providers für genau diese Modell-ID und fällt erst danach auf den konfigurierten Standard-Provider zurück (veraltetes Kompatibilitätsverhalten; bevorzugen Sie daher explizit `provider/model`). Wenn dieser Provider das konfigurierte Standardmodell nicht mehr bereitstellt, fällt OpenClaw auf den ersten konfigurierten Provider/Modell-Eintrag zurück, statt einen veralteten entfernten Provider-Standard zu melden.
- `models`: der konfigurierte Modellkatalog und die Allowlist für `/model`. Jeder Eintrag kann `alias` (Kurzform) und `params` (Provider-spezifisch, zum Beispiel `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, OpenRouter-`provider`-Routing, `chat_template_kwargs`, `extra_body`/`extraBody`) enthalten.
  - Verwenden Sie `provider/*`-Einträge wie `"openai/*": {}` oder `"vllm/*": {}`, um alle erkannten Modelle für ausgewählte Provider anzuzeigen, ohne jede Modell-ID manuell aufzulisten.
  - Fügen Sie einem `provider/*`-Eintrag `agentRuntime` hinzu, wenn jedes dynamisch erkannte Modell für diesen Provider dieselbe Laufzeit verwenden soll. Exakte `provider/model`-Laufzeitrichtlinien haben weiterhin Vorrang vor dem Platzhalter.
  - Sichere Bearbeitungen: Verwenden Sie `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, um Einträge hinzuzufügen. `config set` verweigert Ersetzungen, die bestehende Allowlist-Einträge entfernen würden, sofern Sie nicht `--replace` übergeben.
  - Provider-bezogene Konfigurations-/Onboarding-Flows führen ausgewählte Provider-Modelle in diese Map zusammen und erhalten bereits konfigurierte, nicht verwandte Provider.
  - Für direkte OpenAI-Responses-Modelle ist serverseitige Compaction automatisch aktiviert. Verwenden Sie `params.responsesServerCompaction: false`, um das Einfügen von `context_management` zu stoppen, oder `params.responsesCompactThreshold`, um den Schwellenwert zu überschreiben. Siehe [OpenAI-serverseitige Compaction](/de/providers/openai#server-side-compaction-responses-api).
- `params`: globale standardmäßige Provider-Parameter, die auf alle Modelle angewendet werden. Wird unter `agents.defaults.params` festgelegt (z. B. `{ cacheRetention: "long" }`).
- `params`-Merge-Priorität (Konfiguration): `agents.defaults.params` (globale Basis) wird von `agents.defaults.models["provider/model"].params` (pro Modell) überschrieben, danach überschreibt `agents.list[].params` (passende Agenten-ID) schlüsselweise. Details finden Sie unter [Prompt Caching](/de/reference/prompt-caching).
- `models.providers.openrouter.params.provider`: OpenRouter-weiter Standard für Provider-Routing-Richtlinien. OpenClaw leitet dies an das `provider`-Objekt der OpenRouter-Anfrage weiter; pro Modell überschreiben `agents.defaults.models["openrouter/<model>"].params.provider` und Agentenparameter schlüsselweise. Siehe [OpenRouter-Provider-Routing](/de/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: erweitertes Pass-through-JSON, das in `api: "openai-completions"`-Anfragekörper für OpenAI-kompatible Proxys zusammengeführt wird. Wenn es mit generierten Anfrage-Schlüsseln kollidiert, hat der zusätzliche Body Vorrang; nicht-native Completions-Routen entfernen anschließend weiterhin OpenAI-spezifisches `store`.
- `params.chat_template_kwargs`: vLLM-/OpenAI-kompatible Chat-Template-Argumente, die in oberste `api: "openai-completions"`-Anfragekörper zusammengeführt werden. Für `vllm/nemotron-3-*` mit deaktiviertem Thinking sendet das gebündelte vLLM-Plugin automatisch `enable_thinking: false` und `force_nonempty_content: true`; explizite `chat_template_kwargs` überschreiben generierte Standards, und `extra_body.chat_template_kwargs` hat weiterhin endgültige Priorität. Konfigurierte vLLM-Qwen- und Nemotron-Thinking-Modelle stellen binäre `/think`-Auswahlen (`off`, `on`) statt der mehrstufigen Effort-Leiter bereit.
- `compat.thinkingFormat`: OpenAI-kompatibler Thinking-Payload-Stil. Verwenden Sie `"together"` für Together-artiges `reasoning.enabled`, `"qwen"` für Qwen-artiges Top-Level-`enable_thinking` oder `"qwen-chat-template"` für `chat_template_kwargs.enable_thinking` auf Backends der Qwen-Familie, die Chat-Template-Kwargs auf Anfrageebene unterstützen, wie vLLM. OpenClaw bildet deaktiviertes Thinking auf `false` und aktiviertes Thinking auf `true` ab, und konfigurierte vLLM-Qwen-Modelle stellen für diese Formate binäre `/think`-Auswahlen bereit.
- `compat.supportedReasoningEfforts`: pro Modell geltende OpenAI-kompatible Liste von Reasoning-Efforts. Fügen Sie `"xhigh"` für benutzerdefinierte Endpunkte ein, die dies tatsächlich akzeptieren; OpenClaw stellt dann `/think xhigh` in Befehlsmenüs, Gateway-Sitzungszeilen, Sitzungs-Patch-Validierung, Agenten-CLI-Validierung und `llm-task`-Validierung für dieses konfigurierte Provider/Modell bereit. Verwenden Sie `compat.reasoningEffortMap`, wenn das Backend einen Provider-spezifischen Wert für eine kanonische Stufe erwartet.
- `params.preserveThinking`: ausschließlich Z.AI-Opt-in für beibehaltenes Thinking. Wenn aktiviert und Thinking eingeschaltet ist, sendet OpenClaw `thinking.clear_thinking: false` und spielt vorheriges `reasoning_content` erneut ein; siehe [Z.AI-Thinking und beibehaltenes Thinking](/de/providers/zai#thinking-and-preserved-thinking).
- `localService`: optionaler Provider-weiter Prozessmanager für lokale/selbst gehostete Modellserver. Wenn das ausgewählte Modell zu diesem Provider gehört, prüft OpenClaw `healthUrl` (oder `baseUrl + "/models"`), startet `command` mit `args`, falls der Endpunkt nicht erreichbar ist, wartet bis zu `readyTimeoutMs` und sendet dann die Modellanfrage. `command` muss ein absoluter Pfad sein. `idleStopMs: 0` hält den Prozess bis zum Beenden von OpenClaw am Leben; ein positiver Wert stoppt den von OpenClaw gestarteten Prozess nach entsprechend vielen inaktiven Millisekunden. Siehe [Lokale Modelldienste](/de/gateway/local-model-services).
- Laufzeitrichtlinien gehören zu Providern oder Modellen, nicht zu `agents.defaults`. Verwenden Sie `models.providers.<provider>.agentRuntime` für Provider-weite Regeln oder `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` für modellspezifische Regeln. OpenAI-Agentenmodelle auf dem offiziellen OpenAI-Provider wählen standardmäßig Codex aus.
- Konfigurationsschreiber, die diese Felder ändern (zum Beispiel `/models set`, `/models set-image` und Befehle zum Hinzufügen/Entfernen von Fallbacks), speichern die kanonische Objektform und erhalten bestehende Fallback-Listen, wenn möglich.
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
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
        "vllm/*": {
          agentRuntime: { id: "openclaw" },
        },
      },
    },
  },
}
```

- `id`: `"auto"`, `"openclaw"`, eine registrierte Plugin-Harness-ID oder ein unterstützter CLI-Backend-Alias. Das gebündelte Codex-Plugin registriert `codex`; das gebündelte Anthropic-Plugin stellt das CLI-Backend `claude-cli` bereit.
- `id: "auto"` lässt registrierte Plugin-Harnesse unterstützte Turns beanspruchen und verwendet OpenClaw, wenn kein Harness passt. Eine explizite Plugin-Laufzeitumgebung wie `id: "codex"` erfordert diesen Harness und schlägt geschlossen fehl, wenn er nicht verfügbar ist oder fehlschlägt.
- `id: "pi"` wird nur als veralteter Alias für `openclaw` akzeptiert, um ausgelieferte Konfigurationen aus v2026.5.22 und früher zu erhalten. Neue Konfiguration sollte `openclaw` verwenden.
- Die Laufzeitpriorität ist zuerst exakte Modellrichtlinie (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` oder `models.providers.<provider>.models[]`), dann `agents.list[]` / `agents.defaults.models["provider/*"]`, dann Provider-weite Richtlinie unter `models.providers.<provider>.agentRuntime`.
- Laufzeitschlüssel für ganze Agenten sind Legacy. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, Sitzungs-Laufzeit-Pins und `OPENCLAW_AGENT_RUNTIME` werden von der Laufzeitauswahl ignoriert. Führen Sie `openclaw doctor --fix` aus, um veraltete Werte zu entfernen.
- OpenAI-Agentenmodelle verwenden standardmäßig den Codex-Harness; Provider/Modell `agentRuntime.id: "codex"` bleibt gültig, wenn Sie dies explizit machen möchten.
- Für Claude-CLI-Bereitstellungen bevorzugen Sie `model: "anthropic/claude-opus-4-8"` plus modellbezogenes `agentRuntime.id: "claude-cli"`. Legacy-Modellreferenzen `claude-cli/claude-opus-4-7` funktionieren aus Kompatibilitätsgründen weiterhin, aber neue Konfiguration sollte die Provider/Modell-Auswahl kanonisch halten und das Ausführungs-Backend in die Provider/Modell-Laufzeitrichtlinie legen.
- Dies steuert nur die Ausführung von Text-Agent-Turns. Mediengenerierung, Vision, PDF, Musik, Video und TTS verwenden weiterhin ihre Provider/Modell-Einstellungen.

**Integrierte Alias-Kurzformen** (gelten nur, wenn das Modell in `agents.defaults.models` ist):

| Alias               | Modell                          |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-8`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.4`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

Ihre konfigurierten Aliasse haben immer Vorrang vor Standardwerten.

Z.AI-GLM-4.x-Modelle aktivieren automatisch den Denkmodus, sofern Sie nicht `--thinking off` festlegen oder `agents.defaults.models["zai/<model>"].params.thinking` selbst definieren.
Z.AI-Modelle aktivieren `tool_stream` standardmäßig für das Streaming von Tool-Aufrufen. Setzen Sie `agents.defaults.models["zai/<model>"].params.tool_stream` auf `false`, um es zu deaktivieren.
Anthropic Claude Opus 4.8 lässt Denken in OpenClaw standardmäßig deaktiviert; wenn adaptives Denken explizit aktiviert ist, ist der Provider-eigene Standard für Aufwand `high`. Claude-4.6-Modelle verwenden standardmäßig `adaptive`, wenn keine explizite Denkstufe festgelegt ist.

### `agents.defaults.cliBackends`

Optionale CLI-Backends für reine Text-Fallback-Läufe (keine Tool-Aufrufe). Nützlich als Sicherung, wenn API-Provider fehlschlagen.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
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
- Sitzungen werden unterstützt, wenn `sessionArg` festgelegt ist.
- Bilddurchreichung wird unterstützt, wenn `imageArg` Dateipfade akzeptiert.
- `reseedFromRawTranscriptWhenUncompacted: true` ermöglicht einem Backend, sichere
  invalidierte Sitzungen aus einem begrenzten Roh-OpenClaw-Transkriptauszug wiederherzustellen, bevor die
  erste Compaction-Zusammenfassung existiert. Änderungen am Auth-Profil oder an der Anmeldeinformations-Epoche
  führen weiterhin niemals zu Raw-Reseeding.

### `agents.defaults.promptOverlays`

Provider-unabhängige Prompt-Overlays, die nach Modellfamilie auf von OpenClaw zusammengesetzte Prompt-Oberflächen angewendet werden. Modell-IDs der GPT-5-Familie erhalten den gemeinsamen Verhaltensvertrag über OpenClaw/Provider-Routen hinweg; `personality` steuert nur die freundliche Ebene des Interaktionsstils. Native Codex-App-Server-Routen behalten Codex-eigene Basis-/Modellanweisungen statt dieses OpenClaw-GPT-5-Overlays bei, und OpenClaw deaktiviert Codexs integrierte Personality für native Threads.

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

- `"friendly"` (Standard) und `"on"` aktivieren die freundliche Ebene des Interaktionsstils.
- `"off"` deaktiviert nur die freundliche Ebene; der markierte GPT-5-Verhaltensvertrag bleibt aktiviert.
- Legacy `plugins.entries.openai.config.personality` wird weiterhin gelesen, wenn diese gemeinsame Einstellung nicht gesetzt ist.

### `agents.defaults.heartbeat`

Regelmäßige Heartbeat-Läufe.

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

- `every`: Dauerzeichenfolge (ms/s/m/h). Standard: `30m` (API-Schlüssel-Auth) oder `1h` (OAuth-Auth). Setzen Sie dies auf `0m`, um es zu deaktivieren.
- `includeSystemPromptSection`: wenn false, wird der Heartbeat-Abschnitt aus dem System-Prompt weggelassen und die Injektion von `HEARTBEAT.md` in den Bootstrap-Kontext übersprungen. Standard: `true`.
- `suppressToolErrorWarnings`: wenn true, werden Warnungs-Payloads für Tool-Fehler während Heartbeat-Läufen unterdrückt.
- `timeoutSeconds`: maximale Zeit in Sekunden, die für einen Heartbeat-Agent-Turn zulässig ist, bevor er abgebrochen wird. Nicht setzen, um `agents.defaults.timeoutSeconds` zu verwenden, wenn gesetzt, andernfalls die Heartbeat-Kadenz, begrenzt auf 600 Sekunden.
- `directPolicy`: Richtlinie für Direkt-/DM-Zustellung. `allow` (Standard) erlaubt Zustellung an Direktziele. `block` unterdrückt Zustellung an Direktziele und gibt `reason=dm-blocked` aus.
- `lightContext`: wenn true, verwenden Heartbeat-Läufe leichtgewichtigen Bootstrap-Kontext und behalten nur `HEARTBEAT.md` aus den Workspace-Bootstrap-Dateien.
- `isolatedSession`: wenn true, läuft jeder Heartbeat in einer frischen Sitzung ohne vorherigen Gesprächsverlauf. Gleiches Isolationsmuster wie Cron `sessionTarget: "isolated"`. Reduziert die Token-Kosten pro Heartbeat von ca. 100K auf ca. 2-5K Tokens.
- `skipWhenBusy`: wenn true, werden Heartbeat-Läufe bei zusätzlichen ausgelasteten Lanes dieses Agenten verschoben: dessen eigene sitzungsschlüsselbasierte Subagent- oder verschachtelte Befehlsarbeit. Cron-Lanes verschieben Heartbeats immer, auch ohne dieses Flag.
- Pro Agent: setzen Sie `agents.list[].heartbeat`. Wenn ein Agent `heartbeat` definiert, führen **nur diese Agenten** Heartbeats aus.
- Heartbeats führen vollständige Agent-Turns aus — kürzere Intervalle verbrauchen mehr Tokens.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // opt in to AGENTS.md section reinjection
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
- `provider`: ID eines registrierten Compaction-Provider-Plugins. Wenn gesetzt, wird die `summarize()`-Funktion des Providers statt der integrierten LLM-Zusammenfassung aufgerufen. Fällt bei Fehlern auf die integrierte Funktion zurück. Das Setzen eines Providers erzwingt `mode: "safeguard"`. Siehe [Compaction](/de/concepts/compaction).
- `timeoutSeconds`: maximal zulässige Sekunden für einen einzelnen Compaction-Vorgang, bevor OpenClaw ihn abbricht. Standard: `180`.
- `keepRecentTokens`: Agent-Cut-Point-Budget, um das jüngste Transkriptende wortgetreu beizubehalten. Manuelles `/compact` berücksichtigt dies, wenn es explizit gesetzt ist; andernfalls ist manuelle Compaction ein harter Checkpoint.
- `identifierPolicy`: `strict` (Standard), `off` oder `custom`. `strict` stellt bei der Compaction-Zusammenfassung integrierte Hinweise zur Beibehaltung undurchsichtiger Kennungen voran.
- `identifierInstructions`: optionaler benutzerdefinierter Text zur Beibehaltung von Kennungen, der verwendet wird, wenn `identifierPolicy=custom` gilt.
- `qualityGuard`: Prüfungen mit Wiederholung bei fehlerhaft formatierter Ausgabe für Safeguard-Zusammenfassungen. Im Safeguard-Modus standardmäßig aktiviert; setzen Sie `enabled: false`, um die Prüfung zu überspringen.
- `midTurnPrecheck`: optionale Druckprüfung für den Tool-Loop. Wenn `enabled: true` gesetzt ist, prüft OpenClaw den Kontextdruck, nachdem Tool-Ergebnisse angehängt wurden und bevor der nächste Modellaufruf erfolgt. Wenn der Kontext nicht mehr passt, bricht OpenClaw den aktuellen Versuch vor dem Absenden des Prompts ab und verwendet den bestehenden Precheck-Wiederherstellungspfad erneut, um Tool-Ergebnisse zu kürzen oder eine Compaction durchzuführen und es erneut zu versuchen. Funktioniert mit den Compaction-Modi `default` und `safeguard`. Standard: deaktiviert.
- `postCompactionSections`: optionale AGENTS.md-H2/H3-Abschnittsnamen, die nach der Compaction erneut eingefügt werden. Das erneute Einfügen ist deaktiviert, wenn der Wert nicht gesetzt oder auf `[]` gesetzt ist. Das explizite Setzen von `["Session Startup", "Red Lines"]` aktiviert dieses Paar und bewahrt den alten Fallback `Every Session`/`Safety`. Aktivieren Sie dies nur, wenn der zusätzliche Kontext das Risiko wert ist, Projekthinweise zu duplizieren, die bereits in der Compaction-Zusammenfassung erfasst wurden.
- `model`: optionales `provider/model-id` oder reiner Alias aus `agents.defaults.models` nur für die Compaction-Zusammenfassung. Reine Aliasse werden vor dem Dispatch aufgelöst; konfigurierte wörtliche Modell-IDs behalten bei Kollisionen Vorrang. Verwenden Sie dies, wenn die Hauptsitzung ein Modell beibehalten soll, Compaction-Zusammenfassungen aber auf einem anderen laufen sollen; wenn nicht gesetzt, verwendet Compaction das primäre Modell der Sitzung.
- `maxActiveTranscriptBytes`: optionaler Byte-Schwellenwert (`number` oder Zeichenfolgen wie `"20mb"`), der vor einem Lauf normale lokale Compaction auslöst, wenn das aktive JSONL den Schwellenwert überschreitet. Erfordert `truncateAfterCompaction`, damit erfolgreiche Compaction zu einem kleineren Nachfolge-Transkript rotieren kann. Deaktiviert, wenn nicht gesetzt oder `0`.
- `notifyUser`: wenn `true`, werden kurze Hinweise an den Benutzer gesendet, wenn Compaction startet und wenn sie abgeschlossen ist (zum Beispiel „Kontext wird komprimiert...“ und „Compaction abgeschlossen“). Standardmäßig deaktiviert, damit Compaction still bleibt.
- `memoryFlush`: stiller agentischer Turn vor Auto-Compaction, um dauerhafte Erinnerungen zu speichern. Setzen Sie `model` auf einen exakten Provider/ein exaktes Modell wie `ollama/qwen3:8b`, wenn dieser Wartungs-Turn auf einem lokalen Modell bleiben soll; die Überschreibung erbt die Fallback-Kette der aktiven Sitzung nicht. Wird übersprungen, wenn der Workspace schreibgeschützt ist.

### `agents.defaults.runRetries`

Grenzen für Wiederholungsiterationen der äußeren Ausführungsschleife für die eingebettete Agent-Laufzeit, um Endlosschleifen während der Fehlerwiederherstellung zu verhindern. Beachten Sie, dass diese Einstellung derzeit nur für die eingebettete Agent-Laufzeit gilt, nicht für ACP- oder CLI-Laufzeiten.

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

- `base`: Basisanzahl von Wiederholungsiterationen für die äußere Ausführungsschleife. Standard: `24`.
- `perProfile`: zusätzliche Wiederholungsiterationen pro Fallback-Profilkandidat. Standard: `8`.
- `min`: absolutes Mindestlimit für Wiederholungsiterationen. Standard: `32`.
- `max`: absolutes Höchstlimit für Wiederholungsiterationen, um unkontrollierte Ausführung zu verhindern. Standard: `160`.

### `agents.defaults.contextPruning`

Entfernt **alte Tool-Ergebnisse** aus dem In-Memory-Kontext, bevor er an das LLM gesendet wird. Ändert den Sitzungsverlauf auf der Festplatte **nicht**.

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
- `ttl` steuert, wie oft die Bereinigung erneut ausgeführt werden kann (nach der letzten Cache-Berührung).
- Die Bereinigung kürzt zuerst übergroße Tool-Ergebnisse weich und löscht ältere Tool-Ergebnisse anschließend bei Bedarf hart.
- `softTrimRatio` und `hardClearRatio` akzeptieren Werte von `0.0` bis `1.0`; die Konfigurationsvalidierung weist Werte außerhalb dieses Bereichs zurück.

**Weiches Kürzen** behält Anfang + Ende bei und fügt `...` in der Mitte ein.

**Hartes Löschen** ersetzt das gesamte Tool-Ergebnis durch den Platzhalter.

Hinweise:

- Bildblöcke werden niemals gekürzt/gelöscht.
- Verhältnisse basieren auf Zeichen (näherungsweise), nicht auf exakten Tokenzahlen.
- Wenn weniger als `keepLastAssistants` Assistant-Nachrichten vorhanden sind, wird die Bereinigung übersprungen.

</Accordion>

Siehe [Sitzungsbereinigung](/de/concepts/session-pruning) für Details zum Verhalten.

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
- Kanalüberschreibungen: `channels.<channel>.blockStreamingCoalesce` (und Varianten pro Konto). Signal/Slack/Discord/Google Chat verwenden standardmäßig `minChars: 1500`.
- `humanDelay`: zufällige Pause zwischen Blockantworten. `natural` = 800–2500 ms. Überschreibung pro Agent: `agents.list[].humanDelay`.

Siehe [Streaming](/de/concepts/streaming) für Verhalten und Segmentierungsdetails.

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

Optionales Sandboxing für den eingebetteten Agent. Siehe [Sandboxing](/de/gateway/sandboxing) für die vollständige Anleitung.

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

- `docker`: lokale Docker-Laufzeit (Standard)
- `ssh`: generische SSH-gestützte Remote-Laufzeit
- `openshell`: OpenShell-Laufzeit

Wenn `backend: "openshell"` ausgewählt ist, werden laufzeitspezifische Einstellungen nach
`plugins.entries.openshell.config` verschoben.

**SSH-Backend-Konfiguration:**

- `target`: SSH-Ziel im Format `user@host[:port]`
- `command`: SSH-Client-Befehl (Standard: `ssh`)
- `workspaceRoot`: absoluter Remote-Stamm, der für Workspaces pro Scope verwendet wird
- `identityFile` / `certificateFile` / `knownHostsFile`: vorhandene lokale Dateien, die an OpenSSH übergeben werden
- `identityData` / `certificateData` / `knownHostsData`: Inline-Inhalte oder SecretRefs, die OpenClaw zur Laufzeit in temporären Dateien materialisiert
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH-Regler für die Host-Key-Richtlinie

**SSH-Auth-Priorität:**

- `identityData` gewinnt gegenüber `identityFile`
- `certificateData` gewinnt gegenüber `certificateFile`
- `knownHostsData` gewinnt gegenüber `knownHostsFile`
- SecretRef-gestützte `*Data`-Werte werden aus dem aktiven Secrets-Laufzeit-Snapshot aufgelöst, bevor die Sandbox-Sitzung startet

**SSH-Backend-Verhalten:**

- initialisiert den Remote-Workspace einmal nach dem Erstellen oder Neuerstellen
- hält anschließend den Remote-SSH-Workspace kanonisch
- leitet `exec`, Datei-Tools und Medienpfade über SSH
- synchronisiert Remote-Änderungen nicht automatisch zurück zum Host
- unterstützt keine Sandbox-Browser-Container

**Workspace-Zugriff:**

- `none`: Sandbox-Workspace pro Scope unter `~/.openclaw/sandboxes`
- `ro`: Sandbox-Workspace unter `/workspace`, Agent-Workspace schreibgeschützt unter `/agent` eingebunden
- `rw`: Agent-Workspace lese-/schreibbar unter `/workspace` eingebunden

**Scope:**

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

- `mirror`: Remote vor der Ausführung aus lokalem Stand befüllen, nach der Ausführung zurücksynchronisieren; der lokale Workspace bleibt kanonisch
- `remote`: Remote einmalig beim Erstellen der Sandbox befüllen, danach bleibt der Remote-Workspace kanonisch

Im `remote`-Modus werden host-lokale Änderungen, die außerhalb von OpenClaw vorgenommen wurden, nach dem Befüllungsschritt nicht automatisch in die Sandbox synchronisiert.
Der Transport erfolgt per SSH in die OpenShell-Sandbox, aber das Plugin besitzt den Sandbox-Lebenszyklus und die optionale Mirror-Synchronisierung.

**`setupCommand`** wird einmal nach der Container-Erstellung ausgeführt (über `sh -lc`). Benötigt Netzwerk-Egress, beschreibbares Root-Dateisystem und Root-Benutzer.

**Container verwenden standardmäßig `network: "none"`** — setzen Sie es auf `"bridge"` (oder ein benutzerdefiniertes Bridge-Netzwerk), wenn der Agent ausgehenden Zugriff benötigt.
`"host"` ist blockiert. `"container:<id>"` ist standardmäßig blockiert, sofern Sie nicht explizit
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` setzen (Notfalloption).
Codex-App-Server-Turns in einer aktiven OpenClaw-Sandbox verwenden dieselbe Egress-Einstellung für ihren nativen Netzwerkzugriff im Code-Modus.

**Eingehende Anhänge** werden im aktiven Workspace unter `media/inbound/*` bereitgestellt.

**`docker.binds`** mountet zusätzliche Host-Verzeichnisse; globale und pro-Agent-Binds werden zusammengeführt.

**Sandbox-Browser** (`sandbox.browser.enabled`): Chromium + CDP in einem Container. noVNC-URL wird in den System-Prompt eingefügt. Erfordert kein `browser.enabled` in `openclaw.json`.
noVNC-Beobachterzugriff verwendet standardmäßig VNC-Auth, und OpenClaw gibt eine kurzlebige Token-URL aus (statt das Passwort in der geteilten URL offenzulegen).

- `allowHostControl: false` (Standard) verhindert, dass Sandbox-Sitzungen den Host-Browser ansteuern.
- `network` ist standardmäßig `openclaw-sandbox-browser` (dediziertes Bridge-Netzwerk). Setzen Sie es nur dann auf `bridge`, wenn Sie explizit globale Bridge-Konnektivität wünschen.
- `cdpSourceRange` schränkt optional den CDP-Eingang am Container-Rand auf einen CIDR-Bereich ein (zum Beispiel `172.21.0.1/32`).
- `sandbox.browser.binds` mountet zusätzliche Host-Verzeichnisse nur in den Sandbox-Browser-Container. Wenn gesetzt (einschließlich `[]`), ersetzt es `docker.binds` für den Browser-Container.
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
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` aktiviert Erweiterungen wieder, wenn Ihr Workflow
    davon abhängt.
  - `--renderer-process-limit=2` kann mit
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` geändert werden; setzen Sie `0`, um Chromiums
    standardmäßiges Prozesslimit zu verwenden.
  - plus `--no-sandbox`, wenn `noSandbox` aktiviert ist.
  - Standardwerte sind die Baseline des Container-Images; verwenden Sie ein benutzerdefiniertes Browser-Image mit einem benutzerdefinierten
    Entrypoint, um Container-Standardwerte zu ändern.

</Accordion>

Browser-Sandboxing und `sandbox.docker.binds` sind nur für Docker verfügbar.

Images bauen (aus einem Source-Checkout):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Für npm-Installationen ohne Source-Checkout siehe [Sandboxing § Images und Einrichtung](/de/gateway/sandboxing#images-and-setup) für Inline-`docker build`-Befehle.

### `agents.list` (Überschreibungen pro Agent)

Verwenden Sie `agents.list[].tts`, um einem Agent einen eigenen TTS-Provider, eine Stimme, ein Modell,
einen Stil oder einen Auto-TTS-Modus zu geben. Der Agent-Block wird tief über
`messages.tts` zusammengeführt, sodass gemeinsame Anmeldedaten an einer Stelle bleiben können, während einzelne
Agents nur die benötigten Stimm- oder Provider-Felder überschreiben. Die Überschreibung des aktiven Agents
gilt für automatische gesprochene Antworten, `/tts audio`, `/tts status` und
das Agent-Tool `tts`. Siehe [Text-to-Speech](/de/tools/tts#per-agent-voice-overrides)
für Provider-Beispiele und Priorität.

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
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
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
- `default`: wenn mehrere gesetzt sind, gewinnt der erste (Warnung wird protokolliert). Wenn keine gesetzt ist, ist der erste Listeneintrag der Standard.
- `model`: String-Form setzt ein striktes primäres Modell pro Agent ohne Modell-Fallback; Objektform `{ primary }` ist ebenfalls strikt, sofern Sie keine `fallbacks` hinzufügen. Verwenden Sie `{ primary, fallbacks: [...] }`, um Fallback für diesen Agent zu aktivieren, oder `{ primary, fallbacks: [] }`, um striktes Verhalten explizit zu machen. Cron-Jobs, die nur `primary` überschreiben, erben weiterhin Standard-Fallbacks, sofern Sie nicht `fallbacks: []` setzen.
- `params`: Stream-Parameter pro Agent, die über den ausgewählten Modelleintrag in `agents.defaults.models` zusammengeführt werden. Verwenden Sie dies für agentenspezifische Überschreibungen wie `cacheRetention`, `temperature` oder `maxTokens`, ohne den gesamten Modellkatalog zu duplizieren.
- `tts`: optionale Text-to-Speech-Überschreibungen pro Agent. Der Block wird tief über `messages.tts` zusammengeführt; behalten Sie daher gemeinsame Provider-Anmeldedaten und Fallback-Richtlinien in `messages.tts` und setzen Sie hier nur personaspezifische Werte wie Provider, Stimme, Modell, Stil oder Auto-Modus.
- `skills`: optionale Skills-Allowlist pro Agent. Wenn ausgelassen, erbt der Agent `agents.defaults.skills`, sofern gesetzt; eine explizite Liste ersetzt Standardwerte statt sie zusammenzuführen, und `[]` bedeutet keine Skills.
- `thinkingDefault`: optionale Standard-Denkstufe pro Agent (`off | minimal | low | medium | high | xhigh | adaptive | max`). Überschreibt `agents.defaults.thinkingDefault` für diesen Agent, wenn keine Überschreibung pro Nachricht oder Sitzung gesetzt ist. Das ausgewählte Provider-/Modellprofil steuert, welche Werte gültig sind; für Google Gemini behält `adaptive` das Provider-eigene dynamische Denken bei (`thinkingLevel` bei Gemini 3/3.1 ausgelassen, `thinkingBudget: -1` bei Gemini 2.5).
- `reasoningDefault`: optionale Standard-Sichtbarkeit des Reasoning pro Agent (`on | off | stream`). Überschreibt `agents.defaults.reasoningDefault` für diesen Agent, wenn keine Reasoning-Überschreibung pro Nachricht oder Sitzung gesetzt ist.
- `fastModeDefault`: optionaler Standard für den Schnellmodus pro Agent (`"auto" | true | false`). Gilt, wenn keine Schnellmodus-Überschreibung pro Nachricht oder Sitzung gesetzt ist.
- `models`: optionale Modellkatalog-/Runtime-Überschreibungen pro Agent, indiziert nach vollständigen `provider/model`-IDs. Verwenden Sie `models["provider/model"].agentRuntime` für Runtime-Ausnahmen pro Agent.
- `runtime`: optionaler Runtime-Deskriptor pro Agent. Verwenden Sie `type: "acp"` mit `runtime.acp`-Standardwerten (`agent`, `backend`, `mode`, `cwd`), wenn der Agent standardmäßig ACP-Harness-Sitzungen verwenden soll.
- `identity.avatar`: Workspace-relativer Pfad, `http(s)`-URL oder `data:`-URI.
- Lokale Workspace-relative `identity.avatar`-Bilddateien sind auf 2 MB begrenzt. `http(s)`-URLs und `data:`-URIs werden nicht mit dem lokalen Dateigrößenlimit geprüft.
- `identity` leitet Standardwerte ab: `ackReaction` aus `emoji`, `mentionPatterns` aus `name`/`emoji`.
- `subagents.allowAgents`: Allowlist konfigurierter Agent-IDs für explizite `sessions_spawn.agentId`-Ziele (`["*"]` = jedes konfigurierte Ziel; Standard: nur derselbe Agent). Nehmen Sie die Anforderer-ID auf, wenn selbstzielende `agentId`-Aufrufe erlaubt sein sollen. Veraltete Einträge, deren Agent-Konfiguration gelöscht wurde, werden von `sessions_spawn` abgelehnt und in `agents_list` ausgelassen; führen Sie `openclaw doctor --fix` aus, um sie zu bereinigen, oder fügen Sie einen minimalen `agents.list[]`-Eintrag hinzu, wenn dieses Ziel spawnbar bleiben und dabei Standardwerte erben soll.
- Sandbox-Vererbungsprüfung: Wenn die Anforderer-Sitzung in einer Sandbox läuft, lehnt `sessions_spawn` Ziele ab, die ohne Sandbox laufen würden.
- `subagents.requireAgentId`: wenn true, werden `sessions_spawn`-Aufrufe blockiert, die `agentId` auslassen (erzwingt explizite Profilauswahl; Standard: false).

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

- `type` (optional): `route` für normales Routing (fehlender Typ ist standardmäßig route), `acp` für persistente ACP-Konversationsbindungen.
- `match.channel` (erforderlich)
- `match.accountId` (optional; `*` = beliebiges Konto; ausgelassen = Standardkonto)
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

Innerhalb jeder Stufe gewinnt der erste passende `bindings`-Eintrag.

Für Einträge mit `type: "acp"` löst OpenClaw über die exakte Konversationsidentität (`match.channel` + Konto + `match.peer.id`) auf und verwendet nicht die oben genannte Stufenreihenfolge der Route-Bindings.

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

<Accordion title="Schreibgeschützte Tools + Workspace">

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

Siehe [Multi-Agent-Sandbox und Tools](/de/tools/multi-agent-sandbox-tools) für Details zur Rangfolge.

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
      mode: "enforce", // enforce (default) | warn
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

- **`scope`**: grundlegende Strategie zur Sitzungsgruppierung für Gruppenchats.
  - `per-sender` (Standard): Jeder Absender erhält eine isolierte Sitzung innerhalb eines Kanalkontexts.
  - `global`: Alle Teilnehmenden in einem Kanalkontext teilen sich eine einzige Sitzung (nur verwenden, wenn ein gemeinsamer Kontext beabsichtigt ist).
- **`dmScope`**: legt fest, wie Direktnachrichten gruppiert werden.
  - `main`: Alle Direktnachrichten teilen sich die Hauptsitzung.
  - `per-peer`: Isolierung nach Absender-ID über Kanäle hinweg.
  - `per-channel-peer`: Isolierung pro Kanal + Absender (empfohlen für Mehrbenutzer-Postfächer).
  - `per-account-channel-peer`: Isolierung pro Konto + Kanal + Absender (empfohlen für mehrere Konten).
- **`identityLinks`**: ordnet kanonische IDs Provider-präfixierten Peers zu, um Sitzungen kanalübergreifend zu teilen. Dock-Befehle wie `/dock_discord` verwenden dieselbe Zuordnung, um die Antwortroute der aktiven Sitzung zu einem anderen verknüpften Kanal-Peer zu wechseln; siehe [Kanal-Docking](/de/concepts/channel-docking).
- **`reset`**: primäre Zurücksetzungsrichtlinie. `daily` setzt zur lokalen Zeit `atHour` zurück; `idle` setzt nach `idleMinutes` zurück. Wenn beides konfiguriert ist, gewinnt die zuerst ablaufende Frist. Die Aktualität für tägliche Zurücksetzungen verwendet `sessionStartedAt` der Sitzungszeile; die Aktualität für Inaktivitätszurücksetzungen verwendet `lastInteractionAt`. Hintergrund- oder Systemereignis-Schreibvorgänge wie Heartbeat, Cron-Weckvorgänge, Exec-Benachrichtigungen und Gateway-Buchhaltung können `updatedAt` aktualisieren, halten tägliche oder inaktive Sitzungen aber nicht frisch.
- **`resetByType`**: typbezogene Überschreibungen (`direct`, `group`, `thread`). Das ältere `dm` wird als Alias für `direct` akzeptiert.
- **`mainKey`**: Legacy-Feld. Die Runtime verwendet immer `"main"` für den Haupt-Bucket für direkte Chats.
- **`agentToAgent.maxPingPongTurns`**: maximale Antwortwechsel zwischen Agents während Agent-zu-Agent-Austauschen (Ganzzahl, Bereich: `0`-`20`, Standard: `5`). `0` deaktiviert Ping-Pong-Verkettung.
- **`sendPolicy`**: Abgleich nach `channel`, `chatType` (`direct|group|channel`, mit Legacy-Alias `dm`), `keyPrefix` oder `rawKeyPrefix`. Die erste Ablehnung gewinnt.
- **`maintenance`**: Bereinigungs- und Aufbewahrungssteuerung für den Sitzungsspeicher.
  - `mode`: `enforce` wendet Bereinigungen an und ist der Standard; `warn` gibt nur Warnungen aus.
  - `pruneAfter`: Altersgrenze für veraltete Einträge (Standard `30d`).
  - `maxEntries`: maximale Anzahl von Einträgen in `sessions.json` (Standard `500`). Die Runtime schreibt Batch-Bereinigungen mit einem kleinen Hochwasserpuffer für produktionsgroße Limits; `openclaw sessions cleanup --enforce` wendet das Limit sofort an.
  - Kurzlebige Gateway-Model-Run-Prüfsitzungen verwenden eine feste Aufbewahrung von `24h`, die Bereinigung ist jedoch druckgesteuert: Sie entfernt veraltete strikte Model-Run-Prüfzeilen nur, wenn Wartungs- oder Limitdruck bei Sitzungseinträgen erreicht ist. Nur strikte explizite Prüfschlüssel, die `agent:*:explicit:model-run-<uuid>` entsprechen, sind berechtigt; normale direkte, Gruppen-, Thread-, Cron-, Hook-, Heartbeat-, ACP- und Sub-Agent-Sitzungen übernehmen diese 24-Stunden-Aufbewahrung nicht. Wenn die Model-Run-Bereinigung läuft, läuft sie vor der breiteren Bereinigung veralteter Einträge durch `pruneAfter` und vor dem `maxEntries`-Limit.
  - `rotateBytes`: veraltet und wird ignoriert; `openclaw doctor --fix` entfernt es aus älteren Konfigurationen.
  - `resetArchiveRetention`: Aufbewahrung für `*.reset.<timestamp>`-Transkriptarchive. Standardmäßig `pruneAfter`; auf `false` setzen, um sie zu deaktivieren.
  - `maxDiskBytes`: optionales Speicherplatzbudget für das Sitzungsverzeichnis. Im Modus `warn` protokolliert es Warnungen; im Modus `enforce` entfernt es zuerst die ältesten Artefakte/Sitzungen.
  - `highWaterBytes`: optionales Ziel nach Budgetbereinigung. Standardmäßig `80%` von `maxDiskBytes`.
- **`threadBindings`**: globale Standards für threadgebundene Sitzungsfunktionen.
  - `enabled`: zentraler Standardschalter (Provider können überschreiben; Discord verwendet `channels.discord.threadBindings.enabled`)
  - `idleHours`: Standard für automatisches Entfokussieren nach Inaktivität in Stunden (`0` deaktiviert; Provider können überschreiben)
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
      mode: "followup", // steer | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
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

Auflösung (spezifischste Einstellung gewinnt): Konto → Kanal → global. `""` deaktiviert und stoppt die Kaskade. `"auto"` leitet `[{identity.name}]` ab.

**Template-Variablen:**

| Variable          | Beschreibung            | Beispiel                    |
| ----------------- | ----------------------- | --------------------------- |
| `{model}`         | Kurzer Modellname       | `claude-opus-4-6`           |
| `{modelFull}`     | Vollständige Modellkennung | `anthropic/claude-opus-4-6` |
| `{provider}`      | Provider-Name           | `anthropic`                 |
| `{thinkingLevel}` | Aktuelles Thinking-Level | `high`, `low`, `off`        |
| `{identity.name}` | Name der Agent-Identität | (wie `"auto"`)              |

Variablen sind nicht groß-/kleinschreibungssensitiv. `{think}` ist ein Alias für `{thinkingLevel}`.

### Bestätigungsreaktion

- Standardmäßig das `identity.emoji` des aktiven Agents, andernfalls `"👀"`. Auf `""` setzen, um sie zu deaktivieren.
- Überschreibungen pro Kanal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Auflösungsreihenfolge: Konto → Kanal → `messages.ackReaction` → Identitäts-Fallback.
- Geltungsbereich: `group-mentions` (Standard), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: entfernt die Bestätigung nach der Antwort auf reaktionsfähigen Kanälen wie Slack, Discord, Telegram, WhatsApp und iMessage.
- `messages.statusReactions.enabled`: aktiviert Lifecycle-Statusreaktionen auf Slack, Discord, Telegram und WhatsApp.
  Auf Slack und Discord bleiben Statusreaktionen aktiviert, wenn Bestätigungsreaktionen aktiv sind und der Wert nicht gesetzt ist.
  Auf Telegram und WhatsApp muss der Wert explizit auf `true` gesetzt werden, um Lifecycle-Statusreaktionen zu aktivieren.
- `messages.statusReactions.emojis`: überschreibt Lifecycle-Emoji-Schlüssel:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` und `stallHard`.
  Telegram erlaubt nur einen festen Reaktionssatz, daher fallen nicht unterstützte konfigurierte Emoji
  auf die nächstgelegene unterstützte Statusvariante für diesen Chat zurück.

### Eingangs-Debounce

Bündelt schnell aufeinanderfolgende reine Textnachrichten desselben Absenders zu einem einzigen Agent-Durchlauf. Medien/Anhänge lösen sofort aus. Steuerbefehle umgehen das Debouncing.

### TTS (Text-to-Speech)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-5.4-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          speakerVoiceId: "voice_id",
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
          speakerVoice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "alloy",
        },
      },
    },
  },
}
```

- `auto` steuert den standardmäßigen Auto-TTS-Modus: `off`, `always`, `inbound` oder `tagged`. `/tts on|off` kann lokale Einstellungen überschreiben, und `/tts status` zeigt den effektiven Zustand an.
- `summaryModel` überschreibt `agents.defaults.model.primary` für automatische Zusammenfassungen.
- `modelOverrides` ist standardmäßig aktiviert; `modelOverrides.allowProvider` ist standardmäßig `false` (Opt-in).
- API-Schlüssel fallen auf `ELEVENLABS_API_KEY`/`XI_API_KEY` und `OPENAI_API_KEY` zurück.
- Gebündelte Sprach-Provider gehören dem Plugin. Wenn `plugins.allow` gesetzt ist, schließen Sie jedes TTS-Provider-Plugin ein, das Sie verwenden möchten, zum Beispiel `microsoft` für Edge TTS. Die veraltete Provider-ID `edge` wird als Alias für `microsoft` akzeptiert.
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
        speakerVoiceId: "elevenlabs_voice_id",
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
          speakerVoice: "cedar",
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
- Veraltete flache Talk-Schlüssel (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) dienen nur der Kompatibilität. Führen Sie `openclaw doctor --fix` aus, um gespeicherte Konfiguration in `talk.providers.<provider>` umzuschreiben.
- Voice-IDs fallen auf `ELEVENLABS_VOICE_ID` oder `SAG_VOICE_ID` zurück.
- `providers.*.apiKey` akzeptiert Klartextzeichenfolgen oder SecretRef-Objekte.
- Der Fallback `ELEVENLABS_API_KEY` gilt nur, wenn kein Talk-API-Schlüssel konfiguriert ist.
- `providers.*.voiceAliases` erlaubt Talk-Anweisungen die Verwendung sprechender Namen.
- `providers.mlx.modelId` wählt das Hugging-Face-Repository aus, das vom lokalen macOS-MLX-Helfer verwendet wird. Wenn es ausgelassen wird, verwendet macOS `mlx-community/Soprano-80M-bf16`.
- Die macOS-MLX-Wiedergabe läuft über den gebündelten Helfer `openclaw-mlx-tts`, wenn vorhanden, oder über eine ausführbare Datei in `PATH`; `OPENCLAW_MLX_TTS_BIN` überschreibt den Helferpfad für die Entwicklung.
- `consultThinkingLevel` steuert das Denklevel für den vollständigen OpenClaw-Agentenlauf hinter Control-UI-Talk-Echtzeitaufrufen von `openclaw_agent_consult`. Lassen Sie es ungesetzt, um das normale Sitzungs-/Modellverhalten beizubehalten.
- `consultFastMode` setzt eine einmalige Fast-Mode-Überschreibung für Control-UI-Talk-Echtzeitkonsultationen, ohne die normale Fast-Mode-Einstellung der Sitzung zu ändern.
- `speechLocale` setzt die BCP-47-Locale-ID, die von der iOS/macOS-Talk-Spracherkennung verwendet wird. Lassen Sie es ungesetzt, um die Gerätestandardeinstellung zu verwenden.
- `silenceTimeoutMs` steuert, wie lange der Talk-Modus nach Stille des Benutzers wartet, bevor er das Transkript sendet. Ungesetzt bleibt das standardmäßige Pausenfenster der Plattform erhalten (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` fügt Provider-seitige Systemanweisungen an den integrierten Echtzeit-Prompt von OpenClaw an, sodass der Sprachstil konfiguriert werden kann, ohne die standardmäßige `openclaw_agent_consult`-Anleitung zu verlieren.
- `realtime.consultRouting` steuert den Gateway-Relay-Fallback, wenn der Echtzeit-Provider ein finales Benutzertranskript ohne `openclaw_agent_consult` erzeugt: `provider-direct` behält direkte Provider-Antworten bei, während `force-agent-consult` die finalisierte Anfrage durch OpenClaw leitet.

---

## Verwandt

- [Konfigurationsreferenz](/de/gateway/configuration-reference) — alle anderen Konfigurationsschlüssel
- [Konfiguration](/de/gateway/configuration) — häufige Aufgaben und schnelle Einrichtung
- [Konfigurationsbeispiele](/de/gateway/configuration-examples)
