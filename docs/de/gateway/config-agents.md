---
read_when:
    - Agent-Standardeinstellungen optimieren (Modelle, Denken, Arbeitsbereich, Heartbeat, Medien, Skills)
    - Multi-Agent-Routing und Bindungen konfigurieren
    - Verhalten von Sitzungen, Nachrichtenzustellung und Talk-Modus anpassen
summary: Agent-Standardeinstellungen, Multi-Agent-Routing, Sitzung, Nachrichten und Gesprächskonfiguration
title: Konfiguration — Agenten
x-i18n:
    generated_at: "2026-04-30T16:27:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6a38f42c35c6c6e46d6d00ad710c6c80d78703e0b7e3388f5631cf91eb17084
    source_path: gateway/config-agents.md
    workflow: 16
---

Agentbezogene Konfigurationsschlüssel unter `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` und `talk.*`. Für Kanäle, Tools, Gateway-Laufzeitumgebung und andere
Schlüssel auf oberster Ebene siehe [Konfigurationsreferenz](/de/gateway/configuration-reference).

## Agent-Standardeinstellungen

### `agents.defaults.workspace`

Standard: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Optionales Repository-Stammverzeichnis, das in der Runtime-Zeile des System-Prompts angezeigt wird. Wenn nicht festgelegt, erkennt OpenClaw es automatisch, indem es vom Workspace aus nach oben läuft.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Optionale Standard-Zulassungsliste für Skills für Agenten, die
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
- Lassen Sie `agents.list[].skills` weg, um die Standardeinstellungen zu übernehmen.
- Setzen Sie `agents.list[].skills: []`, um keine Skills zuzulassen.
- Eine nicht leere Liste `agents.list[].skills` ist der endgültige Satz für diesen Agenten; sie
  wird nicht mit den Standardeinstellungen zusammengeführt.

### `agents.defaults.skipBootstrap`

Deaktiviert die automatische Erstellung von Workspace-Bootstrap-Dateien (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Steuert, wann Workspace-Bootstrap-Dateien in den System-Prompt eingefügt werden. Standard: `"always"`.

- `"continuation-skip"`: sichere Fortsetzungs-Turns (nach einer abgeschlossenen Assistentenantwort) überspringen die erneute Einfügung des Workspace-Bootstraps und reduzieren so die Prompt-Größe. Heartbeat-Läufe und Wiederholungen nach Compaction bauen den Kontext weiterhin neu auf.
- `"never"`: deaktiviert Workspace-Bootstrap und Kontextdatei-Einfügung bei jedem Turn. Verwenden Sie dies nur für Agenten, die ihren Prompt-Lebenszyklus vollständig selbst verwalten (benutzerdefinierte Kontext-Engines, native Laufzeitumgebungen, die ihren eigenen Kontext aufbauen, oder spezialisierte Workflows ohne Bootstrap). Heartbeat- und Compaction-Wiederherstellungs-Turns überspringen ebenfalls die Einfügung.

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

Maximale Gesamtzeichenanzahl, die über alle Workspace-Bootstrap-Dateien hinweg eingefügt wird. Standard: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Steuert den für den Agenten sichtbaren Warntext, wenn Bootstrap-Kontext gekürzt wird.
Standard: `"once"`.

- `"off"`: niemals Warntext in den System-Prompt einfügen.
- `"once"`: Warnung einmal pro eindeutiger Kürzungssignatur einfügen (empfohlen).
- `"always"`: Warnung bei jedem Lauf einfügen, wenn eine Kürzung vorliegt.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Zuständigkeitskarte für Kontextbudgets

OpenClaw hat mehrere großvolumige Prompt-/Kontextbudgets, und sie sind
absichtlich nach Subsystem aufgeteilt, statt alle über einen generischen
Regler zu laufen.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normale Workspace-Bootstrap-Einfügung.
- `agents.defaults.startupContext.*`:
  einmaliger Reset-/Start-Modelllauf-Vorspann, einschließlich aktueller täglicher
  `memory/*.md`-Dateien. Einfache Chat-Befehle `/new` und `/reset` werden
  bestätigt, ohne das Modell aufzurufen.
- `skills.limits.*`:
  die kompakte Skills-Liste, die in den System-Prompt eingefügt wird.
- `agents.defaults.contextLimits.*`:
  begrenzte Runtime-Auszüge und eingefügte Runtime-eigene Blöcke.
- `memory.qmd.limits.*`:
  Größen für indexierte Speichersuch-Snippets und Einfügung.

Verwenden Sie die passende agentenspezifische Überschreibung nur, wenn ein Agent ein anderes
Budget benötigt:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Steuert den beim ersten Turn eingefügten Startvorspann für Reset-/Start-Modellläufe.
Einfache Chat-Befehle `/new` und `/reset` bestätigen den Reset, ohne das Modell
aufzurufen; daher laden sie diesen Vorspann nicht.

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

Gemeinsame Standardeinstellungen für begrenzte Runtime-Kontextflächen.

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

- `memoryGetMaxChars`: Standard-Obergrenze für `memory_get`-Auszüge, bevor Kürzungsmetadaten
  und Fortsetzungshinweis hinzugefügt werden.
- `memoryGetDefaultLines`: Standard-Zeilenfenster für `memory_get`, wenn `lines` weggelassen wird.
- `toolResultMaxChars`: Obergrenze für Live-Tool-Ergebnisse, die für persistierte Ergebnisse und
  Überlaufwiederherstellung verwendet wird.
- `postCompactionMaxChars`: Obergrenze für AGENTS.md-Auszüge, die während der
  Aktualisierungseinfügung nach Compaction verwendet wird.

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

Globale Obergrenze für die kompakte Skills-Liste, die in den System-Prompt eingefügt wird. Dies
beeinflusst nicht das bedarfsweise Lesen von `SKILL.md`-Dateien.

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

Niedrigere Werte reduzieren üblicherweise die Nutzung von Vision-Token und die Größe der Anfrage-Payload bei screenshotlastigen Läufen.
Höhere Werte erhalten mehr visuelle Details.

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
      agentRuntime: {
        id: "pi", // pi | auto | registered harness id, e.g. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
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

- `model`: akzeptiert entweder eine Zeichenkette (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Die Zeichenkettenform legt nur das primäre Modell fest.
  - Die Objektform legt das primäre Modell plus geordnete Ausfallmodelle fest.
- `imageModel`: akzeptiert entweder eine Zeichenkette (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird vom `image`-Toolpfad als dessen Vision-Modell-Konfiguration verwendet.
  - Wird auch als Fallback-Routing verwendet, wenn das ausgewählte/standardmäßige Modell keine Bildeingabe akzeptieren kann.
  - Bevorzugen Sie explizite `provider/model`-Referenzen. Reine IDs werden aus Kompatibilitätsgründen akzeptiert; wenn eine reine ID eindeutig einem konfigurierten bildeingabefähigen Eintrag in `models.providers.*.models` entspricht, qualifiziert OpenClaw sie für diesen Provider. Mehrdeutige konfigurierte Treffer erfordern ein explizites Provider-Präfix.
- `imageGenerationModel`: akzeptiert entweder eine Zeichenkette (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Bildgenerierungsfunktion und jeder zukünftigen Tool-/Plugin-Oberfläche verwendet, die Bilder generiert.
  - Typische Werte: `google/gemini-3.1-flash-image-preview` für native Gemini-Bildgenerierung, `fal/fal-ai/flux/dev` für fal, `openai/gpt-image-2` für OpenAI Images oder `openai/gpt-image-1.5` für OpenAI-PNG-/WebP-Ausgabe mit transparentem Hintergrund.
  - Wenn Sie einen Provider/ein Modell direkt auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung (zum Beispiel `GEMINI_API_KEY` oder `GOOGLE_API_KEY` für `google/*`, `OPENAI_API_KEY` oder OpenAI Codex OAuth für `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` für `fal/*`).
  - Wenn ausgelassen, kann `image_generate` weiterhin einen authentifizierungsgestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider und danach die übrigen registrierten Bildgenerierungs-Provider in Provider-ID-Reihenfolge.
- `musicGenerationModel`: akzeptiert entweder eine Zeichenkette (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Musikgenerierungsfunktion und dem integrierten `music_generate`-Tool verwendet.
  - Typische Werte: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` oder `minimax/music-2.6`.
  - Wenn ausgelassen, kann `music_generate` weiterhin einen authentifizierungsgestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider und danach die übrigen registrierten Musikgenerierungs-Provider in Provider-ID-Reihenfolge.
  - Wenn Sie einen Provider/ein Modell direkt auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung/den passenden API-Schlüssel.
- `videoGenerationModel`: akzeptiert entweder eine Zeichenkette (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Videogenerierungsfunktion und dem integrierten `video_generate`-Tool verwendet.
  - Typische Werte: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` oder `qwen/wan2.7-r2v`.
  - Wenn ausgelassen, kann `video_generate` weiterhin einen authentifizierungsgestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider und danach die übrigen registrierten Videogenerierungs-Provider in Provider-ID-Reihenfolge.
  - Wenn Sie einen Provider/ein Modell direkt auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung/den passenden API-Schlüssel.
  - Der gebündelte Qwen-Provider für Videogenerierung unterstützt bis zu 1 Ausgabevideo, 1 Eingabebild, 4 Eingabevideos, 10 Sekunden Dauer sowie Provider-weite Optionen `size`, `aspectRatio`, `resolution`, `audio` und `watermark`.
- `pdfModel`: akzeptiert entweder eine Zeichenkette (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird vom `pdf`-Tool für Modell-Routing verwendet.
  - Wenn ausgelassen, fällt das PDF-Tool auf `imageModel` und danach auf das aufgelöste Sitzungs-/Standardmodell zurück.
- `pdfMaxBytesMb`: standardmäßige PDF-Größenbegrenzung für das `pdf`-Tool, wenn `maxBytesMb` beim Aufruf nicht übergeben wird.
- `pdfMaxPages`: standardmäßige maximale Seitenzahl, die vom Extraktions-Fallback-Modus im `pdf`-Tool berücksichtigt wird.
- `verboseDefault`: standardmäßige Ausführlichkeitsstufe für Agenten. Werte: `"off"`, `"on"`, `"full"`. Standard: `"off"`.
- `reasoningDefault`: standardmäßige Reasoning-Sichtbarkeit für Agenten. Werte: `"off"`, `"on"`, `"stream"`. Agentenspezifisches `agents.list[].reasoningDefault` überschreibt diesen Standard. Konfigurierte Reasoning-Standards werden nur für Besitzer, autorisierte Absender oder Operator-Admin-Gateway-Kontexte angewendet, wenn keine Reasoning-Überschreibung pro Nachricht oder Sitzung gesetzt ist.
- `elevatedDefault`: standardmäßige Stufe für erweiterte Ausgaben für Agenten. Werte: `"off"`, `"on"`, `"ask"`, `"full"`. Standard: `"on"`.
- `model.primary`: Format `provider/model` (z. B. `openai/gpt-5.5` für API-Schlüsselzugriff oder `openai-codex/gpt-5.5` für Codex OAuth). Wenn Sie den Provider auslassen, versucht OpenClaw zuerst einen Alias, dann einen eindeutigen Treffer bei konfigurierten Providern für genau diese Modell-ID und fällt erst danach auf den konfigurierten Standard-Provider zurück (veraltetes Kompatibilitätsverhalten, daher bevorzugen Sie explizit `provider/model`). Wenn dieser Provider das konfigurierte Standardmodell nicht mehr bereitstellt, fällt OpenClaw auf den ersten konfigurierten Provider/das erste konfigurierte Modell zurück, statt einen veralteten, entfernten Provider-Standard anzuzeigen.
- `models`: der konfigurierte Modellkatalog und die Zulassungsliste für `/model`. Jeder Eintrag kann `alias` (Kurzform) und `params` enthalten (Provider-spezifisch, zum Beispiel `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Sichere Bearbeitungen: Verwenden Sie `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, um Einträge hinzuzufügen. `config set` verweigert Ersetzungen, die vorhandene Zulassungslisteneinträge entfernen würden, sofern Sie nicht `--replace` übergeben.
  - Provider-bezogene Konfigurations-/Onboarding-Abläufe führen ausgewählte Provider-Modelle in diese Zuordnung ein und behalten bereits konfigurierte, nicht zusammenhängende Provider bei.
  - Für direkte OpenAI-Responses-Modelle wird serverseitige Compaction automatisch aktiviert. Verwenden Sie `params.responsesServerCompaction: false`, um das Einfügen von `context_management` zu stoppen, oder `params.responsesCompactThreshold`, um den Schwellenwert zu überschreiben. Siehe [OpenAI serverseitige Compaction](/de/providers/openai#server-side-compaction-responses-api).
- `params`: globale standardmäßige Provider-Parameter, die auf alle Modelle angewendet werden. Festgelegt unter `agents.defaults.params` (z. B. `{ cacheRetention: "long" }`).
- Zusammenführungsrangfolge von `params` (Konfiguration): `agents.defaults.params` (globale Basis) wird von `agents.defaults.models["provider/model"].params` (pro Modell) überschrieben, danach überschreibt `agents.list[].params` (passende Agenten-ID) nach Schlüssel. Siehe [Prompt-Caching](/de/reference/prompt-caching) für Details.
- `params.extra_body`/`params.extraBody`: erweiterte Durchreich-JSON-Daten, die für OpenAI-kompatible Proxys in `api: "openai-completions"`-Anforderungskörper zusammengeführt werden. Bei Kollisionen mit generierten Anforderungsschlüsseln gewinnt der zusätzliche Körper; nicht-native Completions-Routen entfernen anschließend weiterhin OpenAI-spezifisches `store`.
- `params.chat_template_kwargs`: vLLM-/OpenAI-kompatible Chat-Template-Argumente, die in oberste `api: "openai-completions"`-Anforderungskörper zusammengeführt werden. Für `vllm/nemotron-3-*` mit deaktiviertem Thinking sendet das gebündelte vLLM-Plugin automatisch `enable_thinking: false` und `force_nonempty_content: true`; explizite `chat_template_kwargs` überschreiben generierte Standards, und `extra_body.chat_template_kwargs` hat weiterhin endgültigen Vorrang. Für vLLM-Qwen-Thinking-Steuerungen setzen Sie `params.qwenThinkingFormat` für diesen Modelleintrag auf `"chat-template"` oder `"top-level"`.
- `compat.supportedReasoningEfforts`: pro Modell geltende OpenAI-kompatible Liste für Reasoning-Aufwand. Fügen Sie `"xhigh"` für benutzerdefinierte Endpunkte hinzu, die es wirklich akzeptieren; OpenClaw macht dann `/think xhigh` in Befehlsmenüs, Gateway-Sitzungszeilen, Sitzungs-Patch-Validierung, Agenten-CLI-Validierung und `llm-task`-Validierung für diesen konfigurierten Provider/dieses Modell verfügbar. Verwenden Sie `compat.reasoningEffortMap`, wenn das Backend einen Provider-spezifischen Wert für eine kanonische Stufe erwartet.
- `params.preserveThinking`: nur für Z.AI verfügbare Opt-in-Option für beibehaltenes Thinking. Wenn aktiviert und Thinking eingeschaltet ist, sendet OpenClaw `thinking.clear_thinking: false` und spielt vorheriges `reasoning_content` erneut ein; siehe [Z.AI-Thinking und beibehaltenes Thinking](/de/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: standardmäßige Low-Level-Agentenlaufzeit-Richtlinie. Eine ausgelassene ID verwendet standardmäßig OpenClaw Pi. Verwenden Sie `id: "pi"`, um den integrierten PI-Harness zu erzwingen, `id: "auto"`, damit registrierte Plugin-Harnesses unterstützte Modelle beanspruchen können, eine registrierte Harness-ID wie `id: "codex"` oder einen unterstützten CLI-Backend-Alias wie `id: "claude-cli"`. Setzen Sie `fallback: "none"`, um den automatischen PI-Fallback zu deaktivieren. Explizite Plugin-Laufzeiten wie `codex` schlagen standardmäßig geschlossen fehl, sofern Sie nicht `fallback: "pi"` im selben Überschreibungsbereich setzen. Halten Sie Modellreferenzen kanonisch als `provider/model`; wählen Sie Codex, Claude CLI, Gemini CLI und andere Ausführungs-Backends über die Laufzeitkonfiguration statt über ältere Laufzeit-Provider-Präfixe aus. Siehe [Agentenlaufzeiten](/de/concepts/agent-runtimes), um zu verstehen, wie sich dies von der Provider-/Modellauswahl unterscheidet.
- Konfigurationsschreiber, die diese Felder verändern (zum Beispiel `/models set`, `/models set-image` und Befehle zum Hinzufügen/Entfernen von Fallbacks), speichern die kanonische Objektform und behalten vorhandene Fallback-Listen nach Möglichkeit bei.
- `maxConcurrent`: maximale parallele Agentenläufe über Sitzungen hinweg (jede Sitzung bleibt dennoch serialisiert). Standard: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` steuert, welcher Low-Level-Executor Agenten-Turns ausführt. Die meisten
Bereitstellungen sollten die standardmäßige OpenClaw-Pi-Laufzeit beibehalten. Verwenden Sie sie, wenn ein vertrauenswürdiges
Plugin einen nativen Harness bereitstellt, etwa den gebündelten Codex-App-Server-Harness,
oder wenn Sie ein unterstütztes CLI-Backend wie Claude CLI verwenden möchten. Zum mentalen
Modell siehe [Agentenlaufzeiten](/de/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, eine registrierte Plugin-Harness-ID oder ein unterstützter CLI-Backend-Alias. Das gebündelte Codex-Plugin registriert `codex`; das gebündelte Anthropic-Plugin stellt das `claude-cli`-CLI-Backend bereit.
- `fallback`: `"pi"` oder `"none"`. Bei `id: "auto"` ist der ausgelassene Fallback standardmäßig `"pi"`, damit alte Konfigurationen PI weiterverwenden können, wenn kein Plugin-Harness einen Lauf beansprucht. Im expliziten Plugin-Laufzeitmodus, etwa `id: "codex"`, ist der ausgelassene Fallback standardmäßig `"none"`, damit ein fehlender Harness fehlschlägt, statt stillschweigend PI zu verwenden. Laufzeitüberschreibungen erben den Fallback nicht aus einem breiteren Bereich; setzen Sie `fallback: "pi"` neben der expliziten Laufzeit, wenn Sie diesen Kompatibilitäts-Fallback bewusst möchten. Fehler ausgewählter Plugin-Harnesses werden immer direkt angezeigt.
- Umgebungsüberschreibungen: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` überschreibt `id`; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` überschreibt den Fallback für diesen Prozess.
- Für reine Codex-Bereitstellungen setzen Sie `model: "openai/gpt-5.5"` und `agentRuntime.id: "codex"`. Sie können zur besseren Lesbarkeit auch `agentRuntime.fallback: "none"` explizit setzen; dies ist der Standard für explizite Plugin-Laufzeiten.
- Für Claude-CLI-Bereitstellungen bevorzugen Sie `model: "anthropic/claude-opus-4-7"` plus `agentRuntime.id: "claude-cli"`. Ältere `claude-cli/claude-opus-4-7`-Modellreferenzen funktionieren aus Kompatibilitätsgründen weiterhin, neue Konfigurationen sollten jedoch die Provider-/Modellauswahl kanonisch halten und das Ausführungs-Backend in `agentRuntime.id` ablegen.
- Ältere Laufzeit-Richtlinienschlüssel werden von `openclaw doctor --fix` zu `agentRuntime` umgeschrieben.
- Die Harness-Auswahl wird nach dem ersten eingebetteten Lauf pro Sitzungs-ID fixiert. Konfigurations-/Umgebungsänderungen betreffen neue oder zurückgesetzte Sitzungen, nicht ein vorhandenes Transkript. Ältere Sitzungen mit Transkriptverlauf, aber ohne aufgezeichnete Fixierung, werden als PI-fixiert behandelt. `/status` meldet die effektive Laufzeit, zum Beispiel `Runtime: OpenClaw Pi Default` oder `Runtime: OpenAI Codex`.
- Dies steuert nur die Ausführung von Text-Agenten-Turns. Mediengenerierung, Vision, PDF, Musik, Video und TTS verwenden weiterhin ihre Provider-/Modelleinstellungen.

**Integrierte Alias-Kurzformen** (gelten nur, wenn das Modell in `agents.defaults.models` enthalten ist):

| Alias               | Modell                                     |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` or `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

Ihre konfigurierten Aliase haben immer Vorrang vor den Standardwerten.

Z.AI-GLM-4.x-Modelle aktivieren automatisch den Thinking-Modus, sofern Sie nicht `--thinking off` festlegen oder `agents.defaults.models["zai/<model>"].params.thinking` selbst definieren.
Z.AI-Modelle aktivieren standardmäßig `tool_stream` für Tool-Call-Streaming. Setzen Sie `agents.defaults.models["zai/<model>"].params.tool_stream` auf `false`, um dies zu deaktivieren.
Anthropic-Claude-4.6-Modelle verwenden standardmäßig `adaptive` Thinking, wenn keine explizite Thinking-Stufe festgelegt ist.

### `agents.defaults.cliBackends`

Optionale CLI-Backends für rein textbasierte Fallback-Ausführungen (keine Tool-Aufrufe). Nützlich als Ausweichlösung, wenn API-Provider ausfallen.

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
- Sitzungen werden unterstützt, wenn `sessionArg` gesetzt ist.
- Bilddurchleitung wird unterstützt, wenn `imageArg` Dateipfade akzeptiert.

### `agents.defaults.systemPromptOverride`

Ersetzt den gesamten von OpenClaw zusammengesetzten System-Prompt durch eine feste Zeichenfolge. Legen Sie dies auf Standardebene (`agents.defaults.systemPromptOverride`) oder pro Agent (`agents.list[].systemPromptOverride`) fest. Agent-spezifische Werte haben Vorrang; ein leerer oder nur aus Leerzeichen bestehender Wert wird ignoriert. Nützlich für kontrollierte Prompt-Experimente.

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
- Das Legacy-`plugins.entries.openai.config.personality` wird weiterhin gelesen, wenn diese gemeinsame Einstellung nicht gesetzt ist.

### `agents.defaults.heartbeat`

Regelmäßige Heartbeat-Ausführungen.

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

- `every`: Dauerzeichenfolge (ms/s/m/h). Standard: `30m` (API-Schlüssel-Auth) oder `1h` (OAuth-Auth). Setzen Sie den Wert auf `0m`, um dies zu deaktivieren.
- `includeSystemPromptSection`: Wenn `false`, wird der Heartbeat-Abschnitt aus dem System-Prompt ausgelassen und die Injektion von `HEARTBEAT.md` in den Bootstrap-Kontext übersprungen. Standard: `true`.
- `suppressToolErrorWarnings`: Wenn `true`, werden Tool-Fehlerwarnungs-Payloads während Heartbeat-Ausführungen unterdrückt.
- `timeoutSeconds`: maximal zulässige Zeit in Sekunden für einen Heartbeat-Agent-Turn, bevor er abgebrochen wird. Lassen Sie dies ungesetzt, um `agents.defaults.timeoutSeconds` zu verwenden.
- `directPolicy`: Zustellrichtlinie für Direkt-/DM-Zustellung. `allow` (Standard) erlaubt die Zustellung an direkte Ziele. `block` unterdrückt die Zustellung an direkte Ziele und gibt `reason=dm-blocked` aus.
- `lightContext`: Wenn `true`, verwenden Heartbeat-Ausführungen einen schlanken Bootstrap-Kontext und behalten aus den Workspace-Bootstrap-Dateien nur `HEARTBEAT.md` bei.
- `isolatedSession`: Wenn `true`, wird jeder Heartbeat in einer frischen Sitzung ohne vorherigen Gesprächsverlauf ausgeführt. Gleiches Isolationsmuster wie bei Cron `sessionTarget: "isolated"`. Reduziert die Token-Kosten pro Heartbeat von etwa 100.000 auf etwa 2.000 bis 5.000 Tokens.
- `skipWhenBusy`: Wenn `true`, werden Heartbeat-Ausführungen bei zusätzlichen ausgelasteten Lanes zurückgestellt: Subagent- oder verschachtelte Befehlsarbeit. Cron-Lanes stellen Heartbeats immer zurück, auch ohne dieses Flag.
- Pro Agent: Legen Sie `agents.list[].heartbeat` fest. Wenn ein Agent `heartbeat` definiert, führen **nur diese Agents** Heartbeats aus.
- Heartbeats führen vollständige Agent-Turns aus – kürzere Intervalle verbrauchen mehr Tokens.

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
- `provider`: ID eines registrierten Compaction-Provider-Plugins. Wenn gesetzt, wird `summarize()` des Providers statt der integrierten LLM-Zusammenfassung aufgerufen. Bei einem Fehler wird auf die integrierte Variante zurückgegriffen. Das Setzen eines Providers erzwingt `mode: "safeguard"`. Siehe [Compaction](/de/concepts/compaction).
- `timeoutSeconds`: maximal zulässige Sekunden für einen einzelnen Compaction-Vorgang, bevor OpenClaw ihn abbricht. Standard: `900`.
- `keepRecentTokens`: Pi-Schnittpunktbudget, um den neuesten Transkript-Endteil unverändert beizubehalten. Manuelles `/compact` berücksichtigt dies, wenn es explizit gesetzt ist; andernfalls ist manuelle Compaction ein harter Checkpoint.
- `identifierPolicy`: `strict` (Standard), `off` oder `custom`. `strict` stellt während der Compaction-Zusammenfassung integrierte Hinweise zur Beibehaltung undurchsichtiger Bezeichner voran.
- `identifierInstructions`: optionaler benutzerdefinierter Text zur Bezeichnerbeibehaltung, der verwendet wird, wenn `identifierPolicy=custom`.
- `qualityGuard`: Prüfungen mit Wiederholung bei fehlerhaft formatierten Ausgaben für Safeguard-Zusammenfassungen. Im Safeguard-Modus standardmäßig aktiviert; setzen Sie `enabled: false`, um die Prüfung zu überspringen.
- `midTurnPrecheck`: optionale Pi-Tool-Loop-Druckprüfung. Wenn `enabled: true`, prüft OpenClaw den Kontextdruck, nachdem Tool-Ergebnisse angehängt wurden und bevor der nächste Modellaufruf erfolgt. Wenn der Kontext nicht mehr passt, wird der aktuelle Versuch vor dem Absenden des Prompts abgebrochen und der vorhandene Precheck-Wiederherstellungspfad wiederverwendet, um Tool-Ergebnisse zu kürzen oder zu kompaktieren und erneut zu versuchen. Funktioniert sowohl mit dem Compaction-Modus `default` als auch mit `safeguard`. Standard: deaktiviert.
- `postCompactionSections`: optionale AGENTS.md-H2/H3-Abschnittsnamen, die nach der Compaction erneut injiziert werden. Standardmäßig `["Session Startup", "Red Lines"]`; setzen Sie `[]`, um die erneute Injektion zu deaktivieren. Wenn der Wert nicht gesetzt ist oder explizit auf dieses Standardpaar gesetzt wird, werden ältere Überschriften `Every Session`/`Safety` auch als Legacy-Fallback akzeptiert.
- `model`: optionale `provider/model-id`-Überschreibung nur für Compaction-Zusammenfassungen. Verwenden Sie dies, wenn die Hauptsitzung ein Modell behalten soll, Compaction-Zusammenfassungen aber auf einem anderen Modell laufen sollen; wenn nicht gesetzt, verwendet Compaction das primäre Modell der Sitzung.
- `maxActiveTranscriptBytes`: optionaler Byte-Schwellenwert (`number` oder Zeichenfolgen wie `"20mb"`), der vor einer Ausführung eine normale lokale Compaction auslöst, wenn das aktive JSONL den Schwellenwert überschreitet. Erfordert `truncateAfterCompaction`, damit erfolgreiche Compaction auf ein kleineres Nachfolge-Transkript rotieren kann. Deaktiviert, wenn nicht gesetzt oder `0`.
- `notifyUser`: Wenn `true`, werden kurze Hinweise an den Benutzer gesendet, wenn Compaction startet und wenn sie abgeschlossen ist (zum Beispiel „Kontext wird kompaktiert ...“ und „Compaction abgeschlossen“). Standardmäßig deaktiviert, damit Compaction still bleibt.
- `memoryFlush`: stiller agentischer Turn vor Auto-Compaction, um dauerhafte Memories zu speichern. Setzen Sie `model` auf einen exakten Provider/ein exaktes Modell wie `ollama/qwen3:8b`, wenn dieser Housekeeping-Turn auf einem lokalen Modell bleiben soll; die Überschreibung erbt nicht die Fallback-Kette der aktiven Sitzung. Wird übersprungen, wenn der Workspace schreibgeschützt ist.

### `agents.defaults.contextPruning`

Entfernt **alte Tool-Ergebnisse** aus dem In-Memory-Kontext, bevor er an das LLM gesendet wird. Ändert **nicht** den Sitzungsverlauf auf der Festplatte.

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

- `mode: "cache-ttl"` aktiviert Pruning-Durchläufe.
- `ttl` steuert, wie oft Pruning erneut ausgeführt werden kann (nach der letzten Cache-Berührung).
- Beim Pruning werden zuerst übergroße Tool-Ergebnisse per Soft-Trim gekürzt, anschließend werden bei Bedarf ältere Tool-Ergebnisse per Hard-Clear geleert.

**Soft-Trim** behält Anfang + Ende bei und fügt `...` in der Mitte ein.

**Hard-Clear** ersetzt das gesamte Tool-Ergebnis durch den Platzhalter.

Hinweise:

- Bildblöcke werden nie gekürzt/geleert.
- Verhältnisse sind zeichenbasiert (ungefähr), keine exakten Token-Zahlen.
- Wenn weniger als `keepLastAssistants` Assistant-Nachrichten vorhanden sind, wird Pruning übersprungen.

</Accordion>

Siehe [Session Pruning](/de/concepts/session-pruning) für Verhaltensdetails.

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

- Kanäle außer Telegram erfordern explizit `*.blockStreaming: true`, um Blockantworten zu aktivieren.
- Kanal-Overrides: `channels.<channel>.blockStreamingCoalesce` (und Varianten pro Konto). Signal/Slack/Discord/Google Chat verwenden standardmäßig `minChars: 1500`.
- `humanDelay`: zufällige Pause zwischen Blockantworten. `natural` = 800–2500 ms. Override pro Agent: `agents.list[].humanDelay`.

Weitere Informationen zu Verhalten und Chunking-Details finden Sie unter [Streaming](/de/concepts/streaming).

### Eingabeindikatoren

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

- Standardeinstellungen: `instant` für direkte Chats/Erwähnungen, `message` für nicht erwähnte Gruppenchats.
- Overrides pro Sitzung: `session.typingMode`, `session.typingIntervalSeconds`.

Siehe [Eingabeindikatoren](/de/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Optionales Sandboxing für den eingebetteten Agent. Die vollständige Anleitung finden Sie unter [Sandboxing](/de/gateway/sandboxing).

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
- `workspaceRoot`: absoluter Remote-Stamm, der für Arbeitsbereiche pro Scope verwendet wird
- `identityFile` / `certificateFile` / `knownHostsFile`: vorhandene lokale Dateien, die an OpenSSH übergeben werden
- `identityData` / `certificateData` / `knownHostsData`: Inline-Inhalte oder SecretRefs, die OpenClaw zur Laufzeit in temporäre Dateien materialisiert
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH-Regler für Hostschlüsselrichtlinien

**SSH-Authentifizierungsrangfolge:**

- `identityData` hat Vorrang vor `identityFile`
- `certificateData` hat Vorrang vor `certificateFile`
- `knownHostsData` hat Vorrang vor `knownHostsFile`
- SecretRef-gestützte `*Data`-Werte werden aus dem aktiven Secrets-Laufzeit-Snapshot aufgelöst, bevor die Sandbox-Sitzung startet

**SSH-Backend-Verhalten:**

- initialisiert den Remote-Arbeitsbereich einmal nach dem Erstellen oder erneuten Erstellen
- hält anschließend den Remote-SSH-Arbeitsbereich kanonisch
- leitet `exec`, Datei-Tools und Medienpfade über SSH weiter
- synchronisiert Remote-Änderungen nicht automatisch zurück zum Host
- unterstützt keine Sandbox-Browser-Container

**Workspace-Zugriff:**

- `none`: Sandbox-Workspace pro Bereich unter `~/.openclaw/sandboxes`
- `ro`: Sandbox-Workspace unter `/workspace`, Agent-Workspace schreibgeschützt unter `/agent` eingehängt
- `rw`: Agent-Workspace mit Lese-/Schreibzugriff unter `/workspace` eingehängt

**Bereich:**

- `session`: Container + Workspace pro Sitzung
- `agent`: ein Container + Workspace pro Agent (Standard)
- `shared`: gemeinsam genutzter Container und Workspace (keine sitzungsübergreifende Isolierung)

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

- `mirror`: Remote vor der Ausführung aus lokalem Zustand initialisieren, nach der Ausführung zurücksynchronisieren; lokaler Workspace bleibt maßgeblich
- `remote`: Remote einmal beim Erstellen der Sandbox initialisieren, danach den Remote-Workspace maßgeblich halten

Im Modus `remote` werden host-lokale Änderungen, die außerhalb von OpenClaw vorgenommen wurden, nach dem Initialisierungsschritt nicht automatisch in die Sandbox synchronisiert.
Der Transport erfolgt per SSH in die OpenShell-Sandbox, aber das Plugin verwaltet den Sandbox-Lebenszyklus und die optionale Mirror-Synchronisierung.

**`setupCommand`** wird einmal nach der Container-Erstellung ausgeführt (über `sh -lc`). Benötigt Netzwerk-Egress, beschreibbare Root-Dateisysteme und den Root-Benutzer.

**Container verwenden standardmäßig `network: "none"`** – setzen Sie dies auf `"bridge"` (oder ein benutzerdefiniertes Bridge-Netzwerk), wenn der Agent ausgehenden Zugriff benötigt.
`"host"` ist blockiert. `"container:<id>"` ist standardmäßig blockiert, sofern Sie nicht explizit
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` setzen (Break-Glass).

**Eingehende Anhänge** werden im aktiven Workspace unter `media/inbound/*` bereitgestellt.

**`docker.binds`** hängt zusätzliche Host-Verzeichnisse ein; globale und agentenspezifische Bind-Mounts werden zusammengeführt.

**Sandboxed Browser** (`sandbox.browser.enabled`): Chromium + CDP in einem Container. noVNC-URL wird in den System-Prompt eingefügt. Erfordert kein `browser.enabled` in `openclaw.json`.
Der noVNC-Beobachterzugriff verwendet standardmäßig VNC-Authentifizierung, und OpenClaw gibt eine kurzlebige Token-URL aus (statt das Passwort in der gemeinsam genutzten URL offenzulegen).

- `allowHostControl: false` (Standard) blockiert, dass Sandbox-Sitzungen den Host-Browser ansteuern.
- `network` ist standardmäßig `openclaw-sandbox-browser` (dediziertes Bridge-Netzwerk). Setzen Sie es nur dann auf `bridge`, wenn Sie explizit globale Bridge-Konnektivität wünschen.
- `cdpSourceRange` schränkt optional den CDP-Ingress am Container-Rand auf einen CIDR-Bereich ein (zum Beispiel `172.21.0.1/32`).
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
    Standard-Prozesslimit zu verwenden.
  - plus `--no-sandbox`, wenn `noSandbox` aktiviert ist.
  - Standards sind die Basislinie des Container-Images; verwenden Sie ein benutzerdefiniertes Browser-Image mit einem benutzerdefinierten
    Entrypoint, um Container-Standards zu ändern.

</Accordion>

Browser-Sandboxing und `sandbox.docker.binds` sind ausschließlich Docker-spezifisch.

Images bauen:

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list` (agentenspezifische Überschreibungen)

Verwenden Sie `agents.list[].tts`, um einem Agent einen eigenen TTS-Provider, eine eigene Stimme, ein eigenes Modell,
einen eigenen Stil oder einen eigenen Auto-TTS-Modus zuzuweisen. Der Agent-Block wird per Deep-Merge über das globale
`messages.tts` gelegt, sodass gemeinsam genutzte Anmeldedaten an einer Stelle bleiben können, während einzelne
Agents nur die benötigten Stimmen- oder Provider-Felder überschreiben. Die Überschreibung des aktiven Agents
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
        agentRuntime: { id: "auto", fallback: "pi" },
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
- `default`: Wenn mehrere gesetzt sind, gewinnt der erste Eintrag (Warnung wird protokolliert). Wenn keiner gesetzt ist, ist der erste Listeneintrag der Standard.
- `model`: Die String-Form setzt ein strikt agentspezifisches Primärmodell ohne Modell-Fallback; die Objektform `{ primary }` ist ebenfalls strikt, sofern Sie keine `fallbacks` hinzufügen. Verwenden Sie `{ primary, fallbacks: [...] }`, um diesen Agent für Fallbacks zu aktivieren, oder `{ primary, fallbacks: [] }`, um striktes Verhalten explizit zu machen. Cron-Jobs, die nur `primary` überschreiben, erben weiterhin Standard-Fallbacks, sofern Sie nicht `fallbacks: []` setzen.
- `params`: agentspezifische Stream-Parameter, die über den ausgewählten Modelleintrag in `agents.defaults.models` gemergt werden. Verwenden Sie dies für agentspezifische Überschreibungen wie `cacheRetention`, `temperature` oder `maxTokens`, ohne den gesamten Modellkatalog zu duplizieren.
- `tts`: optionale agentspezifische Text-to-Speech-Überschreibungen. Der Block wird per Deep Merge über `messages.tts` gelegt. Behalten Sie daher gemeinsame Provider-Anmeldedaten und Fallback-Richtlinien in `messages.tts` und setzen Sie hier nur personaspezifische Werte wie Provider, Stimme, Modell, Stil oder Automatikmodus.
- `skills`: optionale agentspezifische Skill-Allowlist. Wenn weggelassen, erbt der Agent `agents.defaults.skills`, sofern gesetzt; eine explizite Liste ersetzt Standards, statt sie zu mergen, und `[]` bedeutet keine Skills.
- `thinkingDefault`: optionale agentspezifische Standard-Denkstufe (`off | minimal | low | medium | high | xhigh | adaptive | max`). Überschreibt `agents.defaults.thinkingDefault` für diesen Agent, wenn keine nachrichten- oder sitzungsspezifische Überschreibung gesetzt ist. Das ausgewählte Provider-/Modellprofil steuert, welche Werte gültig sind; bei Google Gemini behält `adaptive` das vom Provider gesteuerte dynamische Denken bei (`thinkingLevel` bei Gemini 3/3.1 weggelassen, `thinkingBudget: -1` bei Gemini 2.5).
- `reasoningDefault`: optionale agentspezifische Standard-Sichtbarkeit für Reasoning (`on | off | stream`). Überschreibt `agents.defaults.reasoningDefault` für diesen Agent, wenn keine nachrichten- oder sitzungsspezifische Reasoning-Überschreibung gesetzt ist.
- `fastModeDefault`: optionaler agentspezifischer Standard für den Schnellmodus (`true | false`). Gilt, wenn keine nachrichten- oder sitzungsspezifische Schnellmodus-Überschreibung gesetzt ist.
- `agentRuntime`: optionale agentspezifische Überschreibung der Low-Level-Laufzeitrichtlinie. Verwenden Sie `{ id: "codex" }`, um einen Agent ausschließlich auf Codex zu beschränken, während andere Agents im `auto`-Modus den standardmäßigen PI-Fallback behalten.
- `runtime`: optionaler agentspezifischer Laufzeitdeskriptor. Verwenden Sie `type: "acp"` mit `runtime.acp`-Standards (`agent`, `backend`, `mode`, `cwd`), wenn der Agent standardmäßig ACP-Harness-Sitzungen verwenden soll.
- `identity.avatar`: workspace-relativer Pfad, `http(s)`-URL oder `data:`-URI.
- `identity` leitet Standards ab: `ackReaction` aus `emoji`, `mentionPatterns` aus `name`/`emoji`.
- `subagents.allowAgents`: Allowlist von Agent-IDs für explizite `sessions_spawn.agentId`-Ziele (`["*"]` = beliebig; Standard: nur derselbe Agent). Nehmen Sie die Requester-ID auf, wenn selbstadressierte `agentId`-Aufrufe erlaubt sein sollen.
- Sandbox-Vererbungs-Schutz: Wenn die Requester-Sitzung in einer Sandbox läuft, lehnt `sessions_spawn` Ziele ab, die ohne Sandbox laufen würden.
- `subagents.requireAgentId`: Wenn true, blockiert dies `sessions_spawn`-Aufrufe, die `agentId` weglassen (erzwingt explizite Profilauswahl; Standard: false).

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

- `type` (optional): `route` für normales Routing (fehlender Typ ist standardmäßig route), `acp` für persistente ACP-Konversations-Bindings.
- `match.channel` (erforderlich)
- `match.accountId` (optional; `*` = beliebiges Konto; weggelassen = Standardkonto)
- `match.peer` (optional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (optional; kanalspezifisch)
- `acp` (optional; nur für `type: "acp"`): `{ mode, label, cwd, backend }`

**Deterministische Match-Reihenfolge:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exakt, ohne peer/guild/team)
5. `match.accountId: "*"` (kanalweit)
6. Standard-Agent

Innerhalb jeder Ebene gewinnt der erste passende `bindings`-Eintrag.

Für Einträge mit `type: "acp"` löst OpenClaw über die exakte Konversationsidentität (`match.channel` + Konto + `match.peer.id`) auf und verwendet nicht die obige Ebenenreihenfolge der Route-Bindings.

### Agentspezifische Zugriffsprofile

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

<Accordion title="Read-only-Tools + Workspace">

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

Siehe [Multi-Agent Sandbox & Tools](/de/tools/multi-agent-sandbox-tools) für Details zur Vorranglogik.

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
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
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
  - `global`: Alle Teilnehmenden in einem Kanalkontext teilen sich eine einzelne Sitzung (nur verwenden, wenn gemeinsamer Kontext beabsichtigt ist).
- **`dmScope`**: wie DMs gruppiert werden.
  - `main`: Alle DMs teilen sich die Hauptsitzung.
  - `per-peer`: nach Absender-ID kanalübergreifend isolieren.
  - `per-channel-peer`: pro Kanal + Absender isolieren (empfohlen für Posteingänge mit mehreren Benutzern).
  - `per-account-channel-peer`: pro Konto + Kanal + Absender isolieren (empfohlen für mehrere Konten).
- **`identityLinks`**: ordnet kanonische IDs Provider-präfixierten Peers zu, um kanalübergreifende Sitzungen gemeinsam zu nutzen. Dock-Befehle wie `/dock_discord` verwenden dieselbe Zuordnung, um die Antwortroute der aktiven Sitzung auf einen anderen verknüpften Kanal-Peer umzuschalten; siehe [Kanal-Docking](/de/concepts/channel-docking).
- **`reset`**: primäre Zurücksetzungsrichtlinie. `daily` setzt zur lokalen Zeit `atHour` zurück; `idle` setzt nach `idleMinutes` zurück. Wenn beides konfiguriert ist, gewinnt das, was zuerst abläuft. Die Aktualität des täglichen Zurücksetzens verwendet `sessionStartedAt` der Sitzungszeile; die Aktualität des Inaktivitäts-Zurücksetzens verwendet `lastInteractionAt`. Hintergrund-/Systemereignis-Schreibvorgänge wie Heartbeat, Cron-Weckvorgänge, Exec-Benachrichtigungen und Gateway-Buchhaltung können `updatedAt` aktualisieren, halten tägliche/Inaktivitätssitzungen aber nicht frisch.
- **`resetByType`**: Überschreibungen pro Typ (`direct`, `group`, `thread`). Das veraltete `dm` wird als Alias für `direct` akzeptiert.
- **`parentForkMaxTokens`**: maximal zulässige `totalTokens` der übergeordneten Sitzung beim Erstellen einer geforkten Thread-Sitzung (Standard `100000`).
  - Wenn die `totalTokens` der übergeordneten Sitzung über diesem Wert liegen, startet OpenClaw eine neue Thread-Sitzung, statt den Transkriptverlauf der übergeordneten Sitzung zu übernehmen.
  - Setzen Sie `0`, um diesen Schutz zu deaktivieren und das Forken der übergeordneten Sitzung immer zu erlauben.
- **`mainKey`**: veraltetes Feld. Die Laufzeit verwendet immer `"main"` für den Haupt-Bucket für direkte Chats.
- **`agentToAgent.maxPingPongTurns`**: maximale Antwort-zurück-Runden zwischen Agenten während Agent-zu-Agent-Austauschen (Ganzzahl, Bereich: `0`–`5`). `0` deaktiviert Ping-Pong-Verkettung.
- **`sendPolicy`**: Abgleich nach `channel`, `chatType` (`direct|group|channel`, mit veraltetem Alias `dm`), `keyPrefix` oder `rawKeyPrefix`. Die erste Ablehnung gewinnt.
- **`maintenance`**: Bereinigungs- und Aufbewahrungssteuerung für den Sitzungsspeicher.
  - `mode`: `warn` gibt nur Warnungen aus; `enforce` wendet Bereinigung an.
  - `pruneAfter`: Altersgrenze für veraltete Einträge (Standard `30d`).
  - `maxEntries`: maximale Anzahl von Einträgen in `sessions.json` (Standard `500`). Die Laufzeit schreibt Batch-Bereinigung mit einem kleinen High-Water-Puffer für produktionsgroße Grenzwerte; `openclaw sessions cleanup --enforce` wendet den Grenzwert sofort an.
  - `rotateBytes`: veraltet und ignoriert; `openclaw doctor --fix` entfernt es aus älteren Konfigurationen.
  - `resetArchiveRetention`: Aufbewahrung für `*.reset.<timestamp>`-Transkriptarchive. Standardmäßig `pruneAfter`; setzen Sie `false`, um sie zu deaktivieren.
  - `maxDiskBytes`: optionales Festplattenbudget für das Sitzungsverzeichnis. Im Modus `warn` werden Warnungen protokolliert; im Modus `enforce` werden zuerst die ältesten Artefakte/Sitzungen entfernt.
  - `highWaterBytes`: optionales Ziel nach Budgetbereinigung. Standardmäßig `80%` von `maxDiskBytes`.
- **`threadBindings`**: globale Standards für Thread-gebundene Sitzungsfunktionen.
  - `enabled`: übergeordneter Standardschalter (Provider können überschreiben; Discord verwendet `channels.discord.threadBindings.enabled`)
  - `idleHours`: standardmäßiges automatisches Entfokussieren bei Inaktivität in Stunden (`0` deaktiviert; Provider können überschreiben)
  - `maxAgeHours`: standardmäßiges hartes Maximalalter in Stunden (`0` deaktiviert; Provider können überschreiben)

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

Auflösung (spezifischster Wert gewinnt): Konto → Kanal → global. `""` deaktiviert und stoppt die Kaskade. `"auto"` leitet `[{identity.name}]` ab.

**Template-Variablen:**

| Variable          | Beschreibung                 | Beispiel                    |
| ----------------- | ---------------------------- | --------------------------- |
| `{model}`         | Kurzer Modellname            | `claude-opus-4-6`           |
| `{modelFull}`     | Vollständiger Modellbezeichner | `anthropic/claude-opus-4-6` |
| `{provider}`      | Provider-Name                | `anthropic`                 |
| `{thinkingLevel}` | Aktuelle Denkstufe           | `high`, `low`, `off`        |
| `{identity.name}` | Name der Agent-Identität     | (wie `"auto"`)              |

Bei Variablen wird die Groß-/Kleinschreibung nicht beachtet. `{think}` ist ein Alias für `{thinkingLevel}`.

### Bestätigungsreaktion

- Standardmäßig `identity.emoji` des aktiven Agenten, andernfalls `"👀"`. Setzen Sie `""`, um sie zu deaktivieren.
- Überschreibungen pro Kanal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Auflösungsreihenfolge: Konto → Kanal → `messages.ackReaction` → Identitäts-Fallback.
- Geltungsbereich: `group-mentions` (Standard), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: entfernt die Bestätigung nach der Antwort auf reaktionsfähigen Kanälen wie Slack, Discord, Telegram, WhatsApp und BlueBubbles.
- `messages.statusReactions.enabled`: aktiviert Lebenszyklus-Statusreaktionen auf Slack, Discord und Telegram.
  Auf Slack und Discord bleiben Statusreaktionen aktiviert, wenn Bestätigungsreaktionen aktiv sind und der Wert nicht gesetzt ist.
  Auf Telegram müssen Sie den Wert explizit auf `true` setzen, um Lebenszyklus-Statusreaktionen zu aktivieren.

### Eingangs-Debounce

Bündelt schnell aufeinanderfolgende reine Textnachrichten desselben Absenders in einem einzelnen Agent-Durchlauf. Medien/Anhänge werden sofort durchgereicht. Steuerbefehle umgehen das Debouncing.

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

- `auto` steuert den standardmäßigen automatischen TTS-Modus: `off`, `always`, `inbound` oder `tagged`. `/tts on|off` kann lokale Einstellungen überschreiben, und `/tts status` zeigt den wirksamen Zustand an.
- `summaryModel` überschreibt `agents.defaults.model.primary` für automatische Zusammenfassungen.
- `modelOverrides` ist standardmäßig aktiviert; `modelOverrides.allowProvider` ist standardmäßig `false` (Opt-in).
- API-Schlüssel fallen auf `ELEVENLABS_API_KEY`/`XI_API_KEY` und `OPENAI_API_KEY` zurück.
- Gebündelte Speech-Provider sind Plugin-eigen. Wenn `plugins.allow` gesetzt ist, schließen Sie jedes TTS-Provider-Plugin ein, das Sie verwenden möchten, zum Beispiel `microsoft` für Edge TTS. Die veraltete Provider-ID `edge` wird als Alias für `microsoft` akzeptiert.
- `providers.openai.baseUrl` überschreibt den OpenAI-TTS-Endpunkt. Die Auflösungsreihenfolge ist Konfiguration, dann `OPENAI_TTS_BASE_URL`, dann `https://api.openai.com/v1`.
- Wenn `providers.openai.baseUrl` auf einen Nicht-OpenAI-Endpunkt verweist, behandelt OpenClaw ihn als OpenAI-kompatiblen TTS-Server und lockert die Modell-/Stimmenvalidierung.

---

## Sprechen

Standards für den Sprechen-Modus (macOS/iOS/Android).

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
  },
}
```

- `talk.provider` muss einem Schlüssel in `talk.providers` entsprechen, wenn mehrere Talk-Provider konfiguriert sind.
- Veraltete flache Talk-Schlüssel (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) dienen nur der Kompatibilität und werden automatisch nach `talk.providers.<provider>` migriert.
- Voice-IDs fallen auf `ELEVENLABS_VOICE_ID` oder `SAG_VOICE_ID` zurück.
- `providers.*.apiKey` akzeptiert Klartextzeichenfolgen oder SecretRef-Objekte.
- Der Fallback `ELEVENLABS_API_KEY` gilt nur, wenn kein Talk-API-Schlüssel konfiguriert ist.
- `providers.*.voiceAliases` ermöglicht Talk-Direktiven die Verwendung benutzerfreundlicher Namen.
- `providers.mlx.modelId` wählt das Hugging-Face-Repo aus, das vom lokalen macOS-MLX-Helfer verwendet wird. Wenn ausgelassen, verwendet macOS `mlx-community/Soprano-80M-bf16`.
- Die macOS-MLX-Wiedergabe läuft über den gebündelten Helfer `openclaw-mlx-tts`, wenn vorhanden, oder über eine ausführbare Datei in `PATH`; `OPENCLAW_MLX_TTS_BIN` überschreibt den Helferpfad für die Entwicklung.
- `speechLocale` legt die BCP-47-Locale-ID fest, die von der iOS/macOS-Talk-Spracherkennung verwendet wird. Lassen Sie den Wert ungesetzt, um die Gerätevoreinstellung zu verwenden.
- `silenceTimeoutMs` steuert, wie lange der Talk-Modus nach der Stille des Benutzers wartet, bevor er das Transkript sendet. Nicht gesetzt bleibt das plattformseitige Standard-Pausenfenster erhalten (`700 ms on macOS and Android, 900 ms on iOS`).

---

## Verwandte Themen

- [Konfigurationsreferenz](/de/gateway/configuration-reference) — alle anderen Konfigurationsschlüssel
- [Konfiguration](/de/gateway/configuration) — häufige Aufgaben und schnelle Einrichtung
- [Konfigurationsbeispiele](/de/gateway/configuration-examples)
