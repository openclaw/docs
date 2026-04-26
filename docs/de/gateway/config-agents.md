---
read_when:
    - Abstimmen von Agent-Standardeinstellungen (Modelle, Thinking, Workspace, Heartbeat, Medien, Skills)
    - Routing und Bindings für mehrere Agenten konfigurieren
    - Sitzung, Nachrichtenzustellung und Talk-Mode-Verhalten anpassen
summary: Agent-Standardeinstellungen, Routing mit mehreren Agenten, Sitzung, Nachrichten und Talk-Konfiguration
title: Konfiguration — Agenten
x-i18n:
    generated_at: "2026-04-26T11:28:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e99e1548c708e62156b3743028eaa5ee705b5f4967bffdab59c3cb342dfa724
    source_path: gateway/config-agents.md
    workflow: 15
---

Konfigurationsschlüssel im Agent-Bereich unter `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` und `talk.*`. Für Channels, Tools, Gateway-Laufzeit und andere
Schlüssel der obersten Ebene siehe [Konfigurationsreferenz](/de/gateway/configuration-reference).

## Agent-Standardeinstellungen

### `agents.defaults.workspace`

Standard: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Optionales Repository-Root, das in der Zeile Runtime des System-Prompts angezeigt wird. Wenn nicht gesetzt, erkennt OpenClaw es automatisch, indem es vom Workspace aus nach oben läuft.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Optionale Standard-Allowlist für Skills für Agenten, die
`agents.list[].skills` nicht setzen.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // übernimmt github, weather
      { id: "docs", skills: ["docs-search"] }, // ersetzt Standards
      { id: "locked-down", skills: [] }, // keine Skills
    ],
  },
}
```

- Lassen Sie `agents.defaults.skills` weg, um standardmäßig keine Einschränkung für Skills zu haben.
- Lassen Sie `agents.list[].skills` weg, um die Standards zu übernehmen.
- Setzen Sie `agents.list[].skills: []` für keine Skills.
- Eine nicht leere Liste in `agents.list[].skills` ist die endgültige Menge für diesen Agenten; sie
  wird nicht mit den Standards zusammengeführt.

### `agents.defaults.skipBootstrap`

Deaktiviert die automatische Erstellung von Bootstrap-Dateien im Workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Steuert, wann Bootstrap-Dateien des Workspace in den System-Prompt eingefügt werden. Standard: `"always"`.

- `"continuation-skip"`: sichere Fortsetzungs-Turns (nach einer abgeschlossenen Assistant-Antwort) überspringen das erneute Einfügen des Workspace-Bootstraps und verringern so die Prompt-Größe. Heartbeat-Läufe und Wiederholungen nach Compaction bauen den Kontext weiterhin neu auf.
- `"never"`: deaktiviert das Einfügen von Workspace-Bootstrap- und Kontextdateien bei jedem Turn. Verwenden Sie dies nur für Agenten, die ihren Prompt-Lebenszyklus vollständig selbst verwalten (benutzerdefinierte Kontext-Engines, native Laufzeiten, die ihren eigenen Kontext aufbauen, oder spezialisierte bootstrapfreie Workflows). Heartbeat- und Wiederherstellungs-Turns nach Compaction überspringen das Einfügen ebenfalls.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Maximale Zeichenzahl pro Bootstrap-Datei im Workspace vor der Kürzung. Standard: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Maximale Gesamtzeichenzahl, die über alle Bootstrap-Dateien des Workspace eingefügt wird. Standard: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Steuert den für den Agenten sichtbaren Warntext, wenn Bootstrap-Kontext gekürzt wird.
Standard: `"once"`.

- `"off"`: fügt niemals Warntext in den System-Prompt ein.
- `"once"`: fügt die Warnung einmal pro eindeutiger Kürzungssignatur ein (empfohlen).
- `"always"`: fügt die Warnung bei jedem Lauf ein, wenn eine Kürzung vorliegt.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Zuordnung der Eigentümerschaft für Kontextbudgets

OpenClaw hat mehrere volumenstarke Prompt-/Kontextbudgets, und sie sind
absichtlich nach Subsystem aufgeteilt, statt alle durch einen einzelnen generischen
Schalter zu führen.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normales Einfügen des Workspace-Bootstraps.
- `agents.defaults.startupContext.*`:
  einmaliges Start-Prelude für `/new` und `/reset`, einschließlich aktueller täglicher
  Dateien unter `memory/*.md`.
- `skills.limits.*`:
  die kompakte Skills-Liste, die in den System-Prompt eingefügt wird.
- `agents.defaults.contextLimits.*`:
  begrenzte Laufzeit-Auszüge und eingefügte laufzeitverwaltete Blöcke.
- `memory.qmd.limits.*`:
  Größe von indizierten Memory-Such-Snippets und Einfügungen.

Verwenden Sie die passende Überschreibung pro Agent nur dann, wenn ein Agent ein anderes
Budget benötigt:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Steuert das Start-Prelude des ersten Turns, das bei einfachen `/new`- und `/reset`-
Läufen eingefügt wird.

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

Gemeinsame Standardwerte für begrenzte Laufzeit-Kontextoberflächen.

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

- `memoryGetMaxChars`: Standardgrenze für Auszüge von `memory_get`, bevor Metadaten zur Kürzung
  und ein Fortsetzungshinweis hinzugefügt werden.
- `memoryGetDefaultLines`: Standard-Zeilenfenster für `memory_get`, wenn `lines`
  weggelassen wird.
- `toolResultMaxChars`: aktuelle Begrenzung für Tool-Ergebnisse, die für persistierte Ergebnisse und
  Overflow-Wiederherstellung verwendet wird.
- `postCompactionMaxChars`: Begrenzung für Auszüge aus `AGENTS.md`, die während der Einfügung bei Aktualisierung nach Compaction verwendet wird.

#### `agents.list[].contextLimits`

Überschreibung pro Agent für die gemeinsamen Schalter in `contextLimits`. Weggelassene Felder übernehmen
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

Überschreibung pro Agent für das Prompt-Budget der Skills.

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

Maximale Pixelgröße für die längste Bildseite in Bildblöcken von Transkripten/Tools vor Provider-Aufrufen.
Standard: `1200`.

Niedrigere Werte reduzieren gewöhnlich die Nutzung von Vision-Token und die Größe der Request-Payload bei Läufen mit vielen Screenshots.
Höhere Werte erhalten mehr visuelle Details.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Zeitzone für den Kontext im System-Prompt (nicht für Nachrichtenzeitstempel). Fällt auf die Zeitzone des Hosts zurück.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Zeitformat im System-Prompt. Standard: `auto` (OS-Einstellung).

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
      params: { cacheRetention: "long" }, // globale Standard-Provider-Parameter
      agentRuntime: {
        id: "pi", // pi | auto | registrierte Harness-ID, z. B. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
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
  - Die Zeichenfolgenform setzt nur das primäre Modell.
  - Die Objektform setzt das primäre Modell plus geordnete Failover-Modelle.
- `imageModel`: akzeptiert entweder eine Zeichenfolge (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird vom `image`-Toolpfad als Konfiguration des Vision-Modells verwendet.
  - Wird auch als Fallback-Routing verwendet, wenn das ausgewählte/Standardmodell keine Bildeingabe akzeptieren kann.
- `imageGenerationModel`: akzeptiert entweder eine Zeichenfolge (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Bildgenerierungsfunktion und jeder zukünftigen Tool-/Plugin-Oberfläche verwendet, die Bilder erzeugt.
  - Typische Werte: `google/gemini-3.1-flash-image-preview` für native Gemini-Bildgenerierung, `fal/fal-ai/flux/dev` für fal, `openai/gpt-image-2` für OpenAI Images oder `openai/gpt-image-1.5` für transparente OpenAI-PNG-/WebP-Ausgabe.
  - Wenn Sie einen Provider/ein Modell direkt auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung (zum Beispiel `GEMINI_API_KEY` oder `GOOGLE_API_KEY` für `google/*`, `OPENAI_API_KEY` oder OpenAI Codex OAuth für `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` für `fal/*`).
  - Wenn es weggelassen wird, kann `image_generate` dennoch einen auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standardprovider und dann die übrigen registrierten Bildgenerierungs-Provider in der Reihenfolge ihrer Provider-IDs.
- `musicGenerationModel`: akzeptiert entweder eine Zeichenfolge (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Musikgenerierungsfunktion und dem eingebauten Tool `music_generate` verwendet.
  - Typische Werte: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` oder `minimax/music-2.6`.
  - Wenn es weggelassen wird, kann `music_generate` dennoch einen auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standardprovider und dann die übrigen registrierten Musikgenerierungs-Provider in der Reihenfolge ihrer Provider-IDs.
  - Wenn Sie einen Provider/ein Modell direkt auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung bzw. den passenden API-Key.
- `videoGenerationModel`: akzeptiert entweder eine Zeichenfolge (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Videogenerierungsfunktion und dem eingebauten Tool `video_generate` verwendet.
  - Typische Werte: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` oder `qwen/wan2.7-r2v`.
  - Wenn es weggelassen wird, kann `video_generate` dennoch einen auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standardprovider und dann die übrigen registrierten Videogenerierungs-Provider in der Reihenfolge ihrer Provider-IDs.
  - Wenn Sie einen Provider/ein Modell direkt auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung bzw. den passenden API-Key.
  - Der gebündelte Qwen-Provider für Videogenerierung unterstützt bis zu 1 Ausgabevideo, 1 Eingabebild, 4 Eingabevideos, 10 Sekunden Dauer sowie die Provider-Optionen `size`, `aspectRatio`, `resolution`, `audio` und `watermark`.
- `pdfModel`: akzeptiert entweder eine Zeichenfolge (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird vom `pdf`-Tool für das Modell-Routing verwendet.
  - Wenn es weggelassen wird, greift das PDF-Tool auf `imageModel` zurück und dann auf das aufgelöste Sitzungs-/Standardmodell.
- `pdfMaxBytesMb`: Standardgrößenlimit für PDFs im `pdf`-Tool, wenn `maxBytesMb` beim Aufruf nicht übergeben wird.
- `pdfMaxPages`: Standardmaximum an Seiten, die im Extraktions-Fallback-Modus des `pdf`-Tools berücksichtigt werden.
- `verboseDefault`: Standard-Verbose-Level für Agenten. Werte: `"off"`, `"on"`, `"full"`. Standard: `"off"`.
- `elevatedDefault`: Standard-Level für erhöhte Ausgabe bei Agenten. Werte: `"off"`, `"on"`, `"ask"`, `"full"`. Standard: `"on"`.
- `model.primary`: Format `provider/model` (z. B. `openai/gpt-5.5` für API-Key-Zugriff oder `openai-codex/gpt-5.5` für Codex OAuth). Wenn Sie den Provider weglassen, versucht OpenClaw zuerst einen Alias, dann einen eindeutigen Treffer eines konfigurierten Providers für genau diese Modell-ID und greift erst dann auf den konfigurierten Standardprovider zurück (veraltetes Kompatibilitätsverhalten, daher besser explizit `provider/model` verwenden). Wenn dieser Provider das konfigurierte Standardmodell nicht mehr bereitstellt, greift OpenClaw auf das erste konfigurierte Provider-/Modellpaar zurück, statt einen veralteten Standard eines entfernten Providers anzuzeigen.
- `models`: der konfigurierte Modellkatalog und die Allowlist für `/model`. Jeder Eintrag kann `alias` (Abkürzung) und `params` (providerspezifisch, zum Beispiel `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`) enthalten.
  - Sichere Bearbeitungen: Verwenden Sie `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, um Einträge hinzuzufügen. `config set` verweigert Ersetzungen, die vorhandene Allowlist-Einträge entfernen würden, es sei denn, Sie übergeben `--replace`.
  - Providerbezogene Konfigurations-/Onboarding-Flows führen ausgewählte Provider-Modelle in diese Zuordnung ein und behalten bereits konfigurierte, nicht zusammenhängende Provider bei.
  - Für direkte OpenAI-Responses-Modelle wird serverseitige Compaction automatisch aktiviert. Verwenden Sie `params.responsesServerCompaction: false`, um das Einfügen von `context_management` zu stoppen, oder `params.responsesCompactThreshold`, um den Schwellenwert zu überschreiben. Siehe [OpenAI server-side compaction](/de/providers/openai#server-side-compaction-responses-api).
- `params`: globale Standard-Provider-Parameter, die auf alle Modelle angewendet werden. Setzen unter `agents.defaults.params` (z. B. `{ cacheRetention: "long" }`).
- Merge-Priorität von `params` (Konfiguration): `agents.defaults.params` (globale Basis) wird von `agents.defaults.models["provider/model"].params` (pro Modell) überschrieben, danach überschreibt `agents.list[].params` (passende Agent-ID) schlüsselweise. Details finden Sie unter [Prompt Caching](/de/reference/prompt-caching).
- `params.extra_body`/`params.extraBody`: erweitertes durchgereichtes JSON, das in Request-Bodies von `api: "openai-completions"` für OpenAI-kompatible Proxys zusammengeführt wird. Wenn es mit generierten Request-Schlüsseln kollidiert, gewinnt der zusätzliche Body; nicht native Completions-Routen entfernen danach weiterhin das nur für OpenAI gedachte `store`.
- `params.chat_template_kwargs`: vLLM-/OpenAI-kompatible Chat-Template-Argumente, die in Top-Level-Request-Bodies von `api: "openai-completions"` zusammengeführt werden. Für `vllm/nemotron-3-*` mit deaktiviertem Thinking sendet OpenClaw automatisch `enable_thinking: false` und `force_nonempty_content: true`; explizite `chat_template_kwargs` überschreiben diese Standards, und `extra_body.chat_template_kwargs` hat weiterhin die endgültige Priorität.
- `params.preserveThinking`: nur für Z.AI verfügbare Opt-in-Option für erhaltenes Thinking. Wenn aktiviert und Thinking eingeschaltet ist, sendet OpenClaw `thinking.clear_thinking: false` und spielt vorheriges `reasoning_content` erneut ein; siehe [Z.AI thinking and preserved thinking](/de/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: Standardrichtlinie für die Low-Level-Agent-Laufzeit. Wenn `id` weggelassen wird, ist standardmäßig OpenClaw Pi aktiv. Verwenden Sie `id: "pi"`, um das eingebaute PI-Harness zu erzwingen, `id: "auto"`, damit registrierte Plugin-Harnesses unterstützte Modelle beanspruchen können, eine registrierte Harness-ID wie `id: "codex"` oder einen unterstützten CLI-Backend-Alias wie `id: "claude-cli"`. Setzen Sie `fallback: "none"`, um automatischen Pi-Fallback zu deaktivieren. Explizite Plugin-Laufzeiten wie `codex` schlagen standardmäßig fail-closed fehl, sofern Sie nicht `fallback: "pi"` im selben Überschreibungsbereich setzen. Behalten Sie Modellreferenzen kanonisch als `provider/model`; wählen Sie Codex, Claude CLI, Gemini CLI und andere Ausführungs-Backends über die Laufzeitkonfiguration statt über veraltete Laufzeit-Provider-Präfixe. Unter [Agent runtimes](/de/concepts/agent-runtimes) wird erklärt, wie sich das von der Auswahl von Provider/Modell unterscheidet.
- Konfigurationsschreiber, die diese Felder ändern (zum Beispiel `/models set`, `/models set-image` und Befehle zum Hinzufügen/Entfernen von Fallbacks), speichern die kanonische Objektform und behalten vorhandene Fallback-Listen nach Möglichkeit bei.
- `maxConcurrent`: maximale Anzahl paralleler Agent-Läufe über Sitzungen hinweg (jede Sitzung bleibt weiterhin serialisiert). Standard: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` steuert, welcher Low-Level-Executor Agent-Turns ausführt. Die meisten
Deployments sollten die Standardlaufzeit OpenClaw Pi beibehalten. Verwenden Sie sie, wenn ein vertrauenswürdiges
Plugin ein natives Harness bereitstellt, wie etwa das gebündelte Codex-App-Server-Harness,
oder wenn Sie ein unterstütztes CLI-Backend wie Claude CLI verwenden möchten. Das konzeptionelle
Modell finden Sie unter [Agent runtimes](/de/concepts/agent-runtimes).

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

- `id`: `"auto"`, `"pi"`, eine registrierte Plugin-Harness-ID oder ein unterstützter CLI-Backend-Alias. Das gebündelte Codex-Plugin registriert `codex`; das gebündelte Anthropic-Plugin stellt das CLI-Backend `claude-cli` bereit.
- `fallback`: `"pi"` oder `"none"`. Bei `id: "auto"` ist der Standard für einen weggelassenen Fallback `"pi"`, sodass alte Konfigurationen weiterhin PI verwenden können, wenn kein Plugin-Harness einen Lauf beansprucht. Im Modus expliziter Plugin-Laufzeiten, etwa `id: "codex"`, ist der Standard für einen weggelassenen Fallback `"none"`, sodass ein fehlendes Harness fehlschlägt, statt stillschweigend PI zu verwenden. Laufzeitüberschreibungen übernehmen keinen Fallback aus einem breiteren Bereich; setzen Sie `fallback: "pi"` zusammen mit der expliziten Laufzeit, wenn Sie diesen Kompatibilitäts-Fallback absichtlich möchten. Fehler des ausgewählten Plugin-Harnesses werden immer direkt angezeigt.
- Umgebungsüberschreibungen: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` überschreibt `id`; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` überschreibt den Fallback für diesen Prozess.
- Für reine Codex-Deployments setzen Sie `model: "openai/gpt-5.5"` und `agentRuntime.id: "codex"`. Sie können der Lesbarkeit halber auch explizit `agentRuntime.fallback: "none"` setzen; das ist der Standard für explizite Plugin-Laufzeiten.
- Für Claude-CLI-Deployments bevorzugen Sie `model: "anthropic/claude-opus-4-7"` plus `agentRuntime.id: "claude-cli"`. Veraltete Modellreferenzen wie `claude-cli/claude-opus-4-7` funktionieren aus Kompatibilitätsgründen weiterhin, aber neue Konfigurationen sollten die Auswahl von Provider/Modell kanonisch halten und das Ausführungs-Backend in `agentRuntime.id` ablegen.
- Ältere Schlüssel für Laufzeitrichtlinien werden von `openclaw doctor --fix` in `agentRuntime` umgeschrieben.
- Die Wahl des Harnesses wird pro Sitzungs-ID nach dem ersten eingebetteten Lauf festgelegt. Änderungen an Konfiguration/Umgebung wirken sich auf neue oder zurückgesetzte Sitzungen aus, nicht auf ein vorhandenes Transkript. Legacy-Sitzungen mit Transkriptverlauf, aber ohne aufgezeichnete Fixierung, werden so behandelt, als wären sie auf PI fixiert. `/status` meldet die effektive Laufzeit, zum Beispiel `Runtime: OpenClaw Pi Default` oder `Runtime: OpenAI Codex`.
- Dies steuert nur die Ausführung von textbasierten Agent-Turns. Mediengenerierung, Vision, PDF, Musik, Video und TTS verwenden weiterhin ihre Einstellungen für Provider/Modell.

**Eingebaute Alias-Kurzformen** (gelten nur, wenn das Modell in `agents.defaults.models` enthalten ist):

| Alias               | Modell                                     |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` oder `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

Ihre konfigurierten Aliasse haben immer Vorrang vor den Standards.

Modelle Z.AI GLM-4.x aktivieren automatisch den Thinking-Modus, sofern Sie nicht `--thinking off` setzen oder `agents.defaults.models["zai/<model>"].params.thinking` selbst definieren.
Z.AI-Modelle aktivieren standardmäßig `tool_stream` für das Streaming von Tool-Aufrufen. Setzen Sie `agents.defaults.models["zai/<model>"].params.tool_stream` auf `false`, um dies zu deaktivieren.
Anthropic-Claude-4.6-Modelle verwenden standardmäßig `adaptive` Thinking, wenn kein explizites Thinking-Level gesetzt ist.

### `agents.defaults.cliBackends`

Optionale CLI-Backends für textbasierte Fallback-Läufe (keine Tool-Aufrufe). Nützlich als Backup, wenn API-Provider ausfallen.

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
          // Oder verwenden Sie systemPromptFileArg, wenn die CLI ein Prompt-Datei-Flag akzeptiert.
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
- Image-Pass-through wird unterstützt, wenn `imageArg` Dateipfade akzeptiert.

### `agents.defaults.systemPromptOverride`

Ersetzt den gesamten von OpenClaw zusammengestellten System-Prompt durch eine feste Zeichenfolge. Setzen Sie dies auf Standardebene (`agents.defaults.systemPromptOverride`) oder pro Agent (`agents.list[].systemPromptOverride`). Werte pro Agent haben Vorrang; ein leerer oder nur aus Leerzeichen bestehender Wert wird ignoriert. Nützlich für kontrollierte Prompt-Experimente.

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

Providerunabhängige Prompt-Overlays, die nach Modellfamilie angewendet werden. Modell-IDs der GPT-5-Familie erhalten den gemeinsamen Verhaltensvertrag über Provider hinweg; `personality` steuert nur die Ebene des freundlichen Interaktionsstils.

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

- `"friendly"` (Standard) und `"on"` aktivieren die Ebene des freundlichen Interaktionsstils.
- `"off"` deaktiviert nur die freundliche Ebene; der markierte GPT-5-Verhaltensvertrag bleibt aktiviert.
- Das veraltete `plugins.entries.openai.config.personality` wird weiterhin gelesen, wenn diese gemeinsame Einstellung nicht gesetzt ist.

### `agents.defaults.heartbeat`

Periodische Heartbeat-Läufe.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m deaktiviert
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // Standard: true; false lässt den Heartbeat-Abschnitt im System-Prompt weg
        lightContext: false, // Standard: false; true behält nur HEARTBEAT.md aus den Bootstrap-Dateien des Workspace
        isolatedSession: false, // Standard: false; true führt jeden Heartbeat in einer neuen Sitzung aus (kein Konversationsverlauf)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (Standard) | block
        target: "none", // Standard: none | Optionen: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: Dauer-String (ms/s/m/h). Standard: `30m` (API-Key-Authentifizierung) oder `1h` (OAuth-Authentifizierung). Setzen Sie `0m`, um zu deaktivieren.
- `includeSystemPromptSection`: wenn `false`, wird der Heartbeat-Abschnitt aus dem System-Prompt weggelassen und das Einfügen von `HEARTBEAT.md` in den Bootstrap-Kontext übersprungen. Standard: `true`.
- `suppressToolErrorWarnings`: wenn `true`, werden Payloads mit Tool-Fehlerwarnungen während Heartbeat-Läufen unterdrückt.
- `timeoutSeconds`: maximale Zeit in Sekunden, die ein Heartbeat-Agenten-Turn dauern darf, bevor er abgebrochen wird. Wenn nicht gesetzt, wird `agents.defaults.timeoutSeconds` verwendet.
- `directPolicy`: Zustellrichtlinie für direkte Ziele/DMs. `allow` (Standard) erlaubt die Zustellung an direkte Ziele. `block` unterdrückt die Zustellung an direkte Ziele und erzeugt `reason=dm-blocked`.
- `lightContext`: wenn `true`, verwenden Heartbeat-Läufe einen leichtgewichtigen Bootstrap-Kontext und behalten nur `HEARTBEAT.md` aus den Bootstrap-Dateien des Workspace.
- `isolatedSession`: wenn `true`, wird jeder Heartbeat in einer neuen Sitzung ohne vorherigen Konversationsverlauf ausgeführt. Dasselbe Isolierungsmuster wie bei Cron `sessionTarget: "isolated"`. Reduziert die Token-Kosten pro Heartbeat von etwa 100K auf etwa 2–5K Token.
- Pro Agent: setzen Sie `agents.list[].heartbeat`. Wenn irgendein Agent `heartbeat` definiert, führen **nur diese Agenten** Heartbeats aus.
- Heartbeats führen vollständige Agenten-Turns aus — kürzere Intervalle verbrauchen mehr Token.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // ID eines registrierten Compaction-Provider-Plugins (optional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // verwendet bei identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        postCompactionSections: ["Session Startup", "Red Lines"], // [] deaktiviert das erneute Einfügen
        model: "openrouter/anthropic/claude-sonnet-4-6", // optionale nur für Compaction geltende Modellüberschreibung
        notifyUser: true, // kurze Hinweise senden, wenn Compaction beginnt und abgeschlossen ist (Standard: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` oder `safeguard` (stückweise Zusammenfassung für lange Verläufe). Siehe [Compaction](/de/concepts/compaction).
- `provider`: ID eines registrierten Compaction-Provider-Plugins. Wenn gesetzt, wird `summarize()` des Providers anstelle der eingebauten LLM-Zusammenfassung aufgerufen. Bei Fehlern wird auf die eingebaute Funktion zurückgegriffen. Das Setzen eines Providers erzwingt `mode: "safeguard"`. Siehe [Compaction](/de/concepts/compaction).
- `timeoutSeconds`: maximale Anzahl an Sekunden, die OpenClaw für einen einzelnen Compaction-Vorgang zulässt, bevor er abgebrochen wird. Standard: `900`.
- `keepRecentTokens`: Budget für den Pi-Schnittpunkt, um den neuesten Transkript-Tail wortwörtlich beizubehalten. Manuelles `/compact` berücksichtigt dies, wenn es explizit gesetzt ist; andernfalls ist manuelle Compaction ein harter Checkpoint.
- `identifierPolicy`: `strict` (Standard), `off` oder `custom`. `strict` stellt der Zusammenfassung bei der Compaction eingebaute Hinweise zum Erhalt opaker Identifikatoren voran.
- `identifierInstructions`: optionaler benutzerdefinierter Text zum Erhalt von Identifikatoren, der verwendet wird, wenn `identifierPolicy=custom`.
- `qualityGuard`: Prüfungen mit Wiederholung bei fehlerhafter Ausgabe für safeguard-Zusammenfassungen. Im safeguard-Modus standardmäßig aktiviert; setzen Sie `enabled: false`, um die Prüfung zu überspringen.
- `postCompactionSections`: optionale Abschnittsnamen H2/H3 aus AGENTS.md, die nach der Compaction erneut eingefügt werden. Standard ist `["Session Startup", "Red Lines"]`; setzen Sie `[]`, um das erneute Einfügen zu deaktivieren. Wenn nicht gesetzt oder explizit auf dieses Standardpaar gesetzt, werden ältere Überschriften `Every Session`/`Safety` ebenfalls als Legacy-Fallback akzeptiert.
- `model`: optionale Überschreibung `provider/model-id` nur für die Compaction-Zusammenfassung. Verwenden Sie dies, wenn die Hauptsitzung ein Modell behalten soll, Compaction-Zusammenfassungen aber auf einem anderen Modell laufen sollen; wenn nicht gesetzt, verwendet Compaction das primäre Modell der Sitzung.
- `notifyUser`: wenn `true`, sendet OpenClaw kurze Hinweise an den Benutzer, wenn die Compaction beginnt und wenn sie abgeschlossen ist (zum Beispiel „Compacting context...“ und „Compaction complete“). Standardmäßig deaktiviert, damit die Compaction still bleibt.
- `memoryFlush`: stiller agentischer Turn vor der automatischen Compaction, um dauerhafte Erinnerungen zu speichern. Wird übersprungen, wenn der Workspace schreibgeschützt ist.

### `agents.defaults.contextPruning`

Schneidet **alte Tool-Ergebnisse** aus dem In-Memory-Kontext heraus, bevor sie an das LLM gesendet werden. Ändert **nicht** den Sitzungsverlauf auf der Festplatte.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // Dauer (ms/s/m/h), Standardeinheit: Minuten
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

<Accordion title="Verhalten des Modus cache-ttl">

- `mode: "cache-ttl"` aktiviert Bereinigungsdurchläufe.
- `ttl` steuert, wie oft die Bereinigung erneut laufen kann (nach dem letzten Cache-Touch).
- Die Bereinigung kürzt zuerst übergroße Tool-Ergebnisse weich und löscht bei Bedarf anschließend ältere Tool-Ergebnisse hart.

**Soft-trim** behält Anfang + Ende und fügt in der Mitte `...` ein.

**Hard-clear** ersetzt das gesamte Tool-Ergebnis durch den Platzhalter.

Hinweise:

- Bildblöcke werden niemals gekürzt/gelöscht.
- Verhältnisse basieren auf Zeichen (ungefähr), nicht auf exakten Token-Zahlen.
- Wenn weniger als `keepLastAssistants` Assistant-Nachrichten vorhanden sind, wird die Bereinigung übersprungen.

</Accordion>

Details zum Verhalten finden Sie unter [Session Pruning](/de/concepts/session-pruning).

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

- Nicht-Telegram-Channels benötigen explizit `*.blockStreaming: true`, um Block-Antworten zu aktivieren.
- Channel-Überschreibungen: `channels.<channel>.blockStreamingCoalesce` (und Varianten pro Account). Signal/Slack/Discord/Google Chat verwenden standardmäßig `minChars: 1500`.
- `humanDelay`: zufällige Pause zwischen Block-Antworten. `natural` = 800–2500 ms. Überschreibung pro Agent: `agents.list[].humanDelay`.

Details zu Verhalten und Chunking finden Sie unter [Streaming](/de/concepts/streaming).

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

- Standardwerte: `instant` für Direktchats/Erwähnungen, `message` für Gruppenchats ohne Erwähnung.
- Überschreibungen pro Sitzung: `session.typingMode`, `session.typingIntervalSeconds`.

Siehe [Typing Indicators](/de/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Optionales Sandboxing für den eingebetteten Agenten. Den vollständigen Leitfaden finden Sie unter [Sandboxing](/de/gateway/sandboxing).

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
          // SecretRefs / Inline-Inhalte werden ebenfalls unterstützt:
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

<Accordion title="Sandbox-Details">

**Backend:**

- `docker`: lokale Docker-Laufzeit (Standard)
- `ssh`: generische entfernte Laufzeit auf SSH-Basis
- `openshell`: OpenShell-Laufzeit

Wenn `backend: "openshell"` ausgewählt ist, werden laufzeitspezifische Einstellungen nach
`plugins.entries.openshell.config` verschoben.

**Konfiguration des SSH-Backends:**

- `target`: SSH-Ziel im Format `user@host[:port]`
- `command`: SSH-Client-Befehl (Standard: `ssh`)
- `workspaceRoot`: absolutes entferntes Root, das für Workspaces pro Bereich verwendet wird
- `identityFile` / `certificateFile` / `knownHostsFile`: vorhandene lokale Dateien, die an OpenSSH übergeben werden
- `identityData` / `certificateData` / `knownHostsData`: Inline-Inhalte oder SecretRefs, die OpenClaw zur Laufzeit in temporäre Dateien materialisiert
- `strictHostKeyChecking` / `updateHostKeys`: Schalter für die OpenSSH-Host-Key-Richtlinie

**SSH-Authentifizierungspriorität:**

- `identityData` hat Vorrang vor `identityFile`
- `certificateData` hat Vorrang vor `certificateFile`
- `knownHostsData` hat Vorrang vor `knownHostsFile`
- SecretRef-gestützte `*Data`-Werte werden aus dem aktiven Snapshot der Secrets-Laufzeit aufgelöst, bevor die Sandbox-Sitzung startet

**Verhalten des SSH-Backends:**

- initialisiert den entfernten Workspace einmal nach Erstellen oder Neuerstellen
- behält danach den entfernten SSH-Workspace als kanonisch bei
- leitet `exec`, Dateitools und Medienpfade über SSH
- synchronisiert entfernte Änderungen nicht automatisch zurück auf den Host
- unterstützt keine Sandbox-Browser-Container

**Workspace-Zugriff:**

- `none`: Sandbox-Workspace pro Bereich unter `~/.openclaw/sandboxes`
- `ro`: Sandbox-Workspace unter `/workspace`, Agent-Workspace schreibgeschützt unter `/agent` eingehängt
- `rw`: Agent-Workspace unter `/workspace` mit Lese-/Schreibzugriff eingehängt

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
          policy: "strict", // optionale OpenShell-Richtlinien-ID
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

- `mirror`: initialisiert entfernt aus lokal vor `exec`, synchronisiert nach `exec` zurück; lokaler Workspace bleibt kanonisch
- `remote`: initialisiert entfernt einmal beim Erstellen der Sandbox, behält danach den entfernten Workspace als kanonisch bei

Im Modus `remote` werden hostlokale Änderungen, die außerhalb von OpenClaw vorgenommen wurden, nach dem Initialisierungsschritt nicht automatisch in die Sandbox synchronisiert.
Der Transport erfolgt per SSH in die OpenShell-Sandbox, aber das Plugin verwaltet den Sandbox-Lebenszyklus und die optionale Mirror-Synchronisierung.

**`setupCommand`** wird einmal nach der Container-Erstellung ausgeführt (über `sh -lc`). Benötigt Netzwerk-Egress, beschreibbares Root und Root-Benutzer.

**Container verwenden standardmäßig `network: "none"`** — setzen Sie dies auf `"bridge"` (oder ein benutzerdefiniertes Bridge-Netzwerk), wenn der Agent ausgehenden Zugriff benötigt.
`"host"` ist blockiert. `"container:<id>"` ist standardmäßig blockiert, außer Sie setzen explizit
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (Notfalloption).

**Eingehende Anhänge** werden in `media/inbound/*` im aktiven Workspace bereitgestellt.

**`docker.binds`** hängt zusätzliche Host-Verzeichnisse ein; globale und pro-Agent-Binds werden zusammengeführt.

**Sandbox-Browser** (`sandbox.browser.enabled`): Chromium + CDP in einem Container. Die noVNC-URL wird in den System-Prompt eingefügt. Erfordert kein `browser.enabled` in `openclaw.json`.
Der Beobachterzugriff über noVNC verwendet standardmäßig VNC-Authentifizierung, und OpenClaw erzeugt eine URL mit kurzlebigem Token (statt das Passwort in der gemeinsam genutzten URL offenzulegen).

- `allowHostControl: false` (Standard) blockiert, dass Sandbox-Sitzungen auf den Host-Browser zielen.
- `network` verwendet standardmäßig `openclaw-sandbox-browser` (dediziertes Bridge-Netzwerk). Setzen Sie es nur dann auf `bridge`, wenn Sie ausdrücklich globale Bridge-Konnektivität möchten.
- `cdpSourceRange` beschränkt optional eingehende CDP-Verbindungen am Containerrand auf einen CIDR-Bereich (zum Beispiel `172.21.0.1/32`).
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
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` deaktiviert werden, falls WebGL-/3D-Nutzung dies erfordert.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` aktiviert Erweiterungen wieder, falls Ihr Workflow
    davon abhängt.
  - `--renderer-process-limit=2` kann mit
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` geändert werden; setzen Sie `0`, um das
    Standard-Prozesslimit von Chromium zu verwenden.
  - plus `--no-sandbox`, wenn `noSandbox` aktiviert ist.
  - Die Standardwerte sind die Basis des Container-Images; verwenden Sie ein benutzerdefiniertes Browser-Image mit eigenem
    Entrypoint, um die Container-Standards zu ändern.

</Accordion>

Browser-Sandboxing und `sandbox.docker.binds` sind nur für Docker verfügbar.

Images erstellen:

```bash
scripts/sandbox-setup.sh           # Haupt-Sandbox-Image
scripts/sandbox-browser-setup.sh   # optionales Browser-Image
```

### `agents.list` (Überschreibungen pro Agent)

Verwenden Sie `agents.list[].tts`, um einem Agenten seinen eigenen TTS-Provider, seine Stimme, sein Modell,
seinen Stil oder seinen automatischen TTS-Modus zu geben. Der Agent-Block wird per Deep-Merge über globales
`messages.tts` gelegt, sodass gemeinsame Zugangsdaten an einer Stelle bleiben können, während einzelne
Agenten nur die Felder für Stimme oder Provider überschreiben, die sie benötigen. Die Überschreibung des aktiven Agenten
gilt für automatische gesprochene Antworten, `/tts audio`, `/tts status` und
das Agenten-Tool `tts`. Beispiele zu Providern und zur Priorität finden Sie unter [Text-to-speech](/de/tools/tts#per-agent-voice-overrides).

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
        model: "anthropic/claude-opus-4-6", // oder { primary, fallbacks }
        thinkingDefault: "high", // Überschreibung des Thinking-Levels pro Agent
        reasoningDefault: "on", // Überschreibung der Sichtbarkeit von Reasoning pro Agent
        fastModeDefault: false, // Überschreibung des Fast Mode pro Agent
        agentRuntime: { id: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // überschreibt passende defaults.models-Parameter schlüsselweise
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // ersetzt agents.defaults.skills, wenn gesetzt
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
- `default`: wenn mehrere gesetzt sind, gewinnt der erste (Warnung wird protokolliert). Wenn keiner gesetzt ist, ist der erste Listeneintrag der Standard.
- `model`: Die Zeichenfolgenform überschreibt nur `primary`; die Objektform `{ primary, fallbacks }` überschreibt beides (`[]` deaktiviert globale Fallbacks). Cron-Jobs, die nur `primary` überschreiben, übernehmen weiterhin die Standard-Fallbacks, sofern Sie nicht `fallbacks: []` setzen.
- `params`: Stream-Parameter pro Agent, die über den ausgewählten Modelleintrag in `agents.defaults.models` zusammengeführt werden. Verwenden Sie dies für agentenspezifische Überschreibungen wie `cacheRetention`, `temperature` oder `maxTokens`, ohne den gesamten Modellkatalog zu duplizieren.
- `tts`: optionale Überschreibungen für Text-to-Speech pro Agent. Der Block wird per Deep-Merge über `messages.tts` gelegt. Behalten Sie daher gemeinsame Provider-Anmeldedaten und die Fallback-Richtlinie in `messages.tts` und setzen Sie hier nur personaspezifische Werte wie Provider, Stimme, Modell, Stil oder Auto-Modus.
- `skills`: optionale Skill-Allowlist pro Agent. Wenn weggelassen, übernimmt der Agent `agents.defaults.skills`, falls gesetzt; eine explizite Liste ersetzt die Standards statt sie zusammenzuführen, und `[]` bedeutet keine Skills.
- `thinkingDefault`: optionales Thinking-Standardniveau pro Agent (`off | minimal | low | medium | high | xhigh | adaptive | max`). Überschreibt `agents.defaults.thinkingDefault` für diesen Agenten, wenn keine Überschreibung pro Nachricht oder Sitzung gesetzt ist. Das ausgewählte Provider-/Modellprofil steuert, welche Werte gültig sind; bei Google Gemini behält `adaptive` das providerseitige dynamische Thinking bei (`thinkingLevel` bei Gemini 3/3.1 weggelassen, `thinkingBudget: -1` bei Gemini 2.5).
- `reasoningDefault`: optionale Standardsichtbarkeit für Reasoning pro Agent (`on | off | stream`). Gilt, wenn keine Überschreibung für Reasoning pro Nachricht oder Sitzung gesetzt ist.
- `fastModeDefault`: optionaler Standard für Fast Mode pro Agent (`true | false`). Gilt, wenn keine Überschreibung für Fast Mode pro Nachricht oder Sitzung gesetzt ist.
- `agentRuntime`: optionale Überschreibung der Low-Level-Laufzeitrichtlinie pro Agent. Verwenden Sie `{ id: "codex" }`, um einen Agenten nur auf Codex zu beschränken, während andere Agenten den Standard-PI-Fallback im `auto`-Modus behalten.
- `runtime`: optionaler Laufzeit-Deskriptor pro Agent. Verwenden Sie `type: "acp"` mit Standardwerten unter `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), wenn der Agent standardmäßig ACP-Harness-Sitzungen verwenden soll.
- `identity.avatar`: Workspace-relativer Pfad, `http(s)`-URL oder `data:`-URI.
- `identity` leitet Standardwerte ab: `ackReaction` aus `emoji`, `mentionPatterns` aus `name`/`emoji`.
- `subagents.allowAgents`: Allowlist von Agent-IDs für `sessions_spawn` (`["*"]` = beliebig; Standard: nur derselbe Agent).
- Sandbox-Vererbungs-Guard: Wenn die anfragende Sitzung in einer Sandbox läuft, lehnt `sessions_spawn` Ziele ab, die ohne Sandbox laufen würden.
- `subagents.requireAgentId`: wenn `true`, blockiert `sessions_spawn`-Aufrufe ohne `agentId` (erzwingt explizite Profilauswahl; Standard: false).

---

## Routing mit mehreren Agenten

Führen Sie mehrere isolierte Agenten in einem Gateway aus. Siehe [Multi-Agent](/de/concepts/multi-agent).

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

### Match-Felder für Bindings

- `type` (optional): `route` für normales Routing (fehlender Typ entspricht standardmäßig `route`), `acp` für persistente ACP-Konversations-Bindings.
- `match.channel` (erforderlich)
- `match.accountId` (optional; `*` = beliebiger Account; weggelassen = Standardaccount)
- `match.peer` (optional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (optional; channelspezifisch)
- `acp` (optional; nur für `type: "acp"`): `{ mode, label, cwd, backend }`

**Deterministische Match-Reihenfolge:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exakt, ohne Peer/Guild/Team)
5. `match.accountId: "*"` (channelweit)
6. Standardagent

Innerhalb jeder Ebene gewinnt der erste passende Eintrag in `bindings`.

Für Einträge mit `type: "acp"` löst OpenClaw nach exakter Konversationsidentität auf (`match.channel` + Account + `match.peer.id`) und verwendet nicht die obige Ebenenreihenfolge der Route-Bindings.

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

Einzelheiten zur Priorität finden Sie unter [Sandbox & Tools für mehrere Agenten](/de/tools/multi-agent-sandbox-tools).

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
    parentForkMaxTokens: 100000, // Parent-Thread-Fork oberhalb dieser Token-Anzahl überspringen (0 deaktiviert)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // Dauer oder false
      maxDiskBytes: "500mb", // optionales hartes Budget
      highWaterBytes: "400mb", // optionales Bereinigungsziel
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // Standard für automatisches Entfokussieren bei Inaktivität in Stunden (`0` deaktiviert)
      maxAgeHours: 0, // Standard für maximales Alter in Stunden (`0` deaktiviert)
    },
    mainKey: "main", // veraltet (die Laufzeit verwendet immer "main")
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
  - `per-sender` (Standard): Jeder Absender erhält innerhalb eines Channel-Kontexts eine isolierte Sitzung.
  - `global`: Alle Teilnehmer in einem Channel-Kontext teilen sich eine einzige Sitzung (nur verwenden, wenn gemeinsamer Kontext beabsichtigt ist).
- **`dmScope`**: wie DMs gruppiert werden.
  - `main`: Alle DMs teilen sich die Hauptsitzung.
  - `per-peer`: Isolierung nach Absender-ID kanalübergreifend.
  - `per-channel-peer`: Isolierung pro Channel + Absender (empfohlen für Mehrbenutzer-Postfächer).
  - `per-account-channel-peer`: Isolierung pro Account + Channel + Absender (empfohlen für mehrere Accounts).
- **`identityLinks`**: Zuordnung kanonischer IDs zu Provider-präfixierten Peers für sitzungsübergreifendes Teilen über mehrere Channels.
- **`reset`**: primäre Zurücksetzungsrichtlinie. `daily` setzt um `atHour` Ortszeit zurück; `idle` setzt nach `idleMinutes` zurück. Wenn beide konfiguriert sind, gewinnt die zuerst ablaufende. Die Frische für tägliche Zurücksetzung verwendet `sessionStartedAt` der Sitzungszeile; die Frische für Leerlauf-Zurücksetzung verwendet `lastInteractionAt`. Hintergrund-/Systemereignis-Schreibvorgänge wie Heartbeat, Cron-Weckereignisse, Exec-Benachrichtigungen und Gateway-Buchführung können `updatedAt` aktualisieren, halten tägliche/Leerlauf-Sitzungen jedoch nicht frisch.
- **`resetByType`**: Überschreibungen pro Typ (`direct`, `group`, `thread`). Das veraltete `dm` wird als Alias für `direct` akzeptiert.
- **`parentForkMaxTokens`**: maximale `totalTokens` der Parent-Sitzung, die beim Erstellen einer geforkten Thread-Sitzung erlaubt sind (Standard `100000`).
  - Wenn `totalTokens` des Parent über diesem Wert liegt, startet OpenClaw eine neue Thread-Sitzung, statt den Transkriptverlauf des Parent zu übernehmen.
  - Setzen Sie `0`, um diesen Guard zu deaktivieren und Parent-Forking immer zu erlauben.
- **`mainKey`**: veraltetes Feld. Die Laufzeit verwendet immer `"main"` für den Haupt-Bucket direkter Chats.
- **`agentToAgent.maxPingPongTurns`**: maximale Anzahl von Antwort-Turns zwischen Agenten bei Agent-zu-Agent-Austausch (Ganzzahl, Bereich: `0`–`5`). `0` deaktiviert Ping-Pong-Verkettung.
- **`sendPolicy`**: Match nach `channel`, `chatType` (`direct|group|channel`, mit veraltetem Alias `dm`), `keyPrefix` oder `rawKeyPrefix`. Die erste Verweigerung gewinnt.
- **`maintenance`**: Bereinigung und Aufbewahrungssteuerung für den Sitzungs-Store.
  - `mode`: `warn` gibt nur Warnungen aus; `enforce` wendet die Bereinigung an.
  - `pruneAfter`: Altersgrenze für veraltete Einträge (Standard `30d`).
  - `maxEntries`: maximale Anzahl an Einträgen in `sessions.json` (Standard `500`).
  - `rotateBytes`: rotiert `sessions.json`, wenn diese Größe überschritten wird (Standard `10mb`).
  - `resetArchiveRetention`: Aufbewahrung für `*.reset.<timestamp>`-Transkriptarchive. Standardmäßig `pruneAfter`; setzen Sie `false`, um zu deaktivieren.
  - `maxDiskBytes`: optionales Speicherbudget für das Sitzungsverzeichnis. Im Modus `warn` werden Warnungen protokolliert; im Modus `enforce` werden zuerst die ältesten Artefakte/Sitzungen entfernt.
  - `highWaterBytes`: optionales Ziel nach Budgetbereinigung. Standardmäßig `80%` von `maxDiskBytes`.
- **`threadBindings`**: globale Standardwerte für threadgebundene Sitzungsfunktionen.
  - `enabled`: globaler Standardschalter (Provider können überschreiben; Discord verwendet `channels.discord.threadBindings.enabled`)
  - `idleHours`: Standardwert für automatisches Entfokussieren bei Inaktivität in Stunden (`0` deaktiviert; Provider können überschreiben)
  - `maxAgeHours`: Standardwert für maximales Alter in Stunden (`0` deaktiviert; Provider können überschreiben)

</Accordion>

---

## Nachrichten

```json5
{
  messages: {
    responsePrefix: "🦞", // oder "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 deaktiviert
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Antwortpräfix

Überschreibungen pro Channel/Account: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Auflösung (spezifischster Wert gewinnt): Account → Channel → global. `""` deaktiviert und stoppt die Kaskade. `"auto"` leitet `[{identity.name}]` ab.

**Vorlagenvariablen:**

| Variable          | Beschreibung          | Beispiel                    |
| ----------------- | --------------------- | --------------------------- |
| `{model}`         | Kurzer Modellname     | `claude-opus-4-6`           |
| `{modelFull}`     | Vollständige Modellkennung | `anthropic/claude-opus-4-6` |
| `{provider}`      | Providername          | `anthropic`                 |
| `{thinkingLevel}` | Aktuelles Thinking-Niveau | `high`, `low`, `off`        |
| `{identity.name}` | Name der Agentenidentität | (entspricht `"auto"`)       |

Variablen sind nicht case-sensitiv. `{think}` ist ein Alias für `{thinkingLevel}`.

### Bestätigungsreaktion

- Standardmäßig das `identity.emoji` des aktiven Agenten, andernfalls `"👀"`. Setzen Sie `""`, um zu deaktivieren.
- Überschreibungen pro Channel: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Auflösungsreihenfolge: Account → Channel → `messages.ackReaction` → Identity-Fallback.
- Bereich: `group-mentions` (Standard), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: entfernt die Bestätigung nach der Antwort auf Channels mit Reaktionsunterstützung wie Slack, Discord, Telegram, WhatsApp und BlueBubbles.
- `messages.statusReactions.enabled`: aktiviert Lebenszyklus-Statusreaktionen auf Slack, Discord und Telegram.
  Auf Slack und Discord bleiben Statusreaktionen aktiviert, wenn Bestätigungsreaktionen aktiv sind und der Wert nicht gesetzt ist.
  Auf Telegram müssen Sie den Wert explizit auf `true` setzen, um Lebenszyklus-Statusreaktionen zu aktivieren.

### Eingangs-Debounce

Fasst schnelle reine Textnachrichten desselben Absenders zu einem einzigen Agenten-Turn zusammen. Medien/Anhänge werden sofort geleert. Steuerbefehle umgehen das Debouncing.

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

- `auto` steuert den Standard-Auto-TTS-Modus: `off`, `always`, `inbound` oder `tagged`. `/tts on|off` kann lokale Einstellungen überschreiben, und `/tts status` zeigt den effektiven Zustand.
- `summaryModel` überschreibt `agents.defaults.model.primary` für die Auto-Zusammenfassung.
- `modelOverrides` ist standardmäßig aktiviert; `modelOverrides.allowProvider` ist standardmäßig `false` (Opt-in).
- API-Keys greifen auf `ELEVENLABS_API_KEY`/`XI_API_KEY` und `OPENAI_API_KEY` zurück.
- Gebündelte Sprach-Provider sind Plugin-eigen. Wenn `plugins.allow` gesetzt ist, schließen Sie jedes TTS-Provider-Plugin ein, das Sie verwenden möchten, zum Beispiel `microsoft` für Edge TTS. Die veraltete Provider-ID `edge` wird als Alias für `microsoft` akzeptiert.
- `providers.openai.baseUrl` überschreibt den OpenAI-TTS-Endpunkt. Die Auflösungsreihenfolge ist Konfiguration, dann `OPENAI_TTS_BASE_URL`, dann `https://api.openai.com/v1`.
- Wenn `providers.openai.baseUrl` auf einen Nicht-OpenAI-Endpunkt zeigt, behandelt OpenClaw ihn als OpenAI-kompatiblen TTS-Server und lockert die Validierung von Modell/Stimme.

---

## Talk

Standardwerte für den Talk-Mode (macOS/iOS/Android).

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

- `talk.provider` muss mit einem Schlüssel in `talk.providers` übereinstimmen, wenn mehrere Talk-Provider konfiguriert sind.
- Veraltete flache Talk-Schlüssel (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) dienen nur der Kompatibilität und werden automatisch nach `talk.providers.<provider>` migriert.
- Voice-IDs greifen auf `ELEVENLABS_VOICE_ID` oder `SAG_VOICE_ID` zurück.
- `providers.*.apiKey` akzeptiert Klartext-Zeichenfolgen oder SecretRef-Objekte.
- Der Fallback `ELEVENLABS_API_KEY` gilt nur, wenn kein Talk-API-Key konfiguriert ist.
- `providers.*.voiceAliases` erlaubt Talk-Direktiven, benutzerfreundliche Namen zu verwenden.
- `providers.mlx.modelId` wählt das Hugging-Face-Repository aus, das vom lokalen MLX-Helper auf macOS verwendet wird. Wenn nicht gesetzt, verwendet macOS `mlx-community/Soprano-80M-bf16`.
- Die MLX-Wiedergabe auf macOS läuft über den gebündelten Helper `openclaw-mlx-tts`, falls vorhanden, oder über ein ausführbares Programm auf `PATH`; `OPENCLAW_MLX_TTS_BIN` überschreibt den Helper-Pfad für die Entwicklung.
- `speechLocale` setzt die BCP-47-Locale-ID, die von der Spracherkennung im Talk-Mode auf iOS/macOS verwendet wird. Wenn nicht gesetzt, wird der Standard des Geräts verwendet.
- `silenceTimeoutMs` steuert, wie lange der Talk-Mode nach Benutzerschweigen wartet, bevor er das Transkript sendet. Nicht gesetzt behält das Standard-Pausenfenster der Plattform bei (`700 ms auf macOS und Android, 900 ms auf iOS`).

---

## Verwandte Inhalte

- [Konfigurationsreferenz](/de/gateway/configuration-reference) — alle anderen Konfigurationsschlüssel
- [Konfiguration](/de/gateway/configuration) — häufige Aufgaben und Schnelleinrichtung
- [Konfigurationsbeispiele](/de/gateway/configuration-examples)
