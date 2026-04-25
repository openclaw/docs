---
read_when:
    - Optimieren von Standardwerten für Agenten (Modelle, Thinking, Workspace, Heartbeat, Medien, Skills)
    - Konfigurieren von Multi-Agent-Routing und Bindungen
    - Anpassen von Verhalten für Sitzungen, Nachrichtenzustellung und Talk-Modus
summary: Standardwerte für Agenten, Multi-Agent-Routing, Sitzung, Nachrichten und Talk-Konfiguration
title: Konfiguration — Agenten
x-i18n:
    generated_at: "2026-04-25T13:45:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1601dc5720f6a82fb947667ed9c0b4612c5187572796db5deb7a28dd13be3528
    source_path: gateway/config-agents.md
    workflow: 15
---

Konfigurationsschlüssel im Agent-Bereich unter `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` und `talk.*`. Für Kanäle, Tools, Gateway-Laufzeit und andere
Top-Level-Schlüssel siehe [Konfigurationsreferenz](/de/gateway/configuration-reference).

## Standardwerte für Agenten

### `agents.defaults.workspace`

Standard: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Optionales Repository-Root, das in der Runtime-Zeile des Systemprompts angezeigt wird. Wenn nicht gesetzt, erkennt OpenClaw es automatisch, indem es vom Workspace aus nach oben läuft.

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
      { id: "writer" }, // erbt github, weather
      { id: "docs", skills: ["docs-search"] }, // ersetzt die Standardwerte
      { id: "locked-down", skills: [] }, // keine Skills
    ],
  },
}
```

- Lassen Sie `agents.defaults.skills` weg, um standardmäßig uneingeschränkte Skills zu haben.
- Lassen Sie `agents.list[].skills` weg, um die Standardwerte zu erben.
- Setzen Sie `agents.list[].skills: []` für keine Skills.
- Eine nicht leere Liste in `agents.list[].skills` ist die endgültige Menge für diesen Agenten; sie
  wird nicht mit den Standardwerten zusammengeführt.

### `agents.defaults.skipBootstrap`

Deaktiviert die automatische Erstellung von Workspace-Bootstrap-Dateien (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Steuert, wann Workspace-Bootstrap-Dateien in den Systemprompt eingefügt werden. Standard: `"always"`.

- `"continuation-skip"`: Sichere Fortsetzungszüge (nach einer abgeschlossenen Assistentenantwort) überspringen das erneute Einfügen des Workspace-Bootstraps, wodurch die Prompt-Größe reduziert wird. Heartbeat-Läufe und Wiederholungen nach Compaction bauen den Kontext weiterhin neu auf.
- `"never"`: Deaktiviert die Einfügung von Workspace-Bootstrap- und Kontextdateien bei jedem Zug. Verwenden Sie dies nur für Agenten, die ihren Prompt-Lebenszyklus vollständig selbst verwalten (benutzerdefinierte Kontext-Engines, native Laufzeiten, die ihren eigenen Kontext aufbauen, oder spezialisierte Workflows ohne Bootstrap). Heartbeat- und Wiederherstellungszüge nach Compaction überspringen die Einfügung ebenfalls.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Maximale Zeichenzahl pro Workspace-Bootstrap-Datei vor dem Abschneiden. Standard: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Maximale Gesamtzeichenzahl, die über alle Workspace-Bootstrap-Dateien hinweg eingefügt wird. Standard: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Steuert den für Agenten sichtbaren Warntext, wenn Bootstrap-Kontext abgeschnitten wird.
Standard: `"once"`.

- `"off"`: Niemals Warntext in den Systemprompt einfügen.
- `"once"`: Warnung einmal pro eindeutiger Abschneidesignatur einfügen (empfohlen).
- `"always"`: Warnung bei jedem Lauf einfügen, wenn eine Abschneidung vorliegt.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Besitzzuordnung für Kontextbudgets

OpenClaw hat mehrere umfangreiche Prompt-/Kontextbudgets, und diese sind
absichtlich nach Subsystem aufgeteilt, statt alle über einen generischen
Schalter zu laufen.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normale Einfügung des Workspace-Bootstraps.
- `agents.defaults.startupContext.*`:
  einmaliges Startprelude für `/new` und `/reset`, einschließlich aktueller täglicher
  `memory/*.md`-Dateien.
- `skills.limits.*`:
  die kompakte Skills-Liste, die in den Systemprompt eingefügt wird.
- `agents.defaults.contextLimits.*`:
  begrenzte Runtime-Auszüge und eingefügte runtimeeigene Blöcke.
- `memory.qmd.limits.*`:
  Snippet- und Einfügungsgrößen für indizierte Erinnerungssuche.

Verwenden Sie die passende Überschreibung pro Agent nur dann, wenn ein Agent ein anderes
Budget benötigt:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Steuert das Startprelude des ersten Zuges, das bei einfachen `/new`- und `/reset`-Läufen eingefügt wird.

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

Gemeinsame Standardwerte für begrenzte Runtime-Kontextoberflächen.

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

- `memoryGetMaxChars`: Standardgrenze für `memory_get`-Auszüge, bevor Metadaten zur Abschneidung und ein Fortsetzungshinweis hinzugefügt werden.
- `memoryGetDefaultLines`: Standard-Zeilenfenster für `memory_get`, wenn `lines` weggelassen wird.
- `toolResultMaxChars`: Live-Grenze für Tool-Ergebnisse, die für persistierte Ergebnisse und Überlaufwiederherstellung verwendet wird.
- `postCompactionMaxChars`: AGENTS.md-Auszugsgrenze, die bei der Aktualisierungseinfügung nach Compaction verwendet wird.

#### `agents.list[].contextLimits`

Überschreibung pro Agent für die gemeinsamen `contextLimits`-Schalter. Weggelassene Felder erben von
`agents.defaults.contextLimits`.

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

Globale Grenze für die kompakte Skills-Liste, die in den Systemprompt eingefügt wird. Dies
beeinflusst nicht das bedarfsgesteuerte Lesen von `SKILL.md`-Dateien.

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

Maximale Pixelgröße der längsten Bildseite in Transkript-/Tool-Bildblöcken vor Provider-Aufrufen.
Standard: `1200`.

Niedrigere Werte reduzieren in der Regel den Verbrauch von Vision-Tokens und die Größe der Request-Payload bei screenshotlastigen Läufen.
Höhere Werte bewahren mehr visuelle Details.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Zeitzone für den Kontext des Systemprompts (nicht für Nachrichtentimestamps). Fällt auf die Zeitzone des Hosts zurück.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Zeitformat im Systemprompt. Standard: `auto` (OS-Einstellung).

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
      embeddedHarness: {
        runtime: "pi", // pi | auto | registrierte Harness-ID, z. B. codex
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

- `model`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Die String-Form setzt nur das primäre Modell.
  - Die Objekt-Form setzt das primäre Modell plus geordnete Failover-Modelle.
- `imageModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird vom `image`-Tool-Pfad als seine Vision-Modell-Konfiguration verwendet.
  - Wird auch für Fallback-Routing verwendet, wenn das ausgewählte/standardmäßige Modell keine Bildeingaben akzeptieren kann.
- `imageGenerationModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Bildgenerierungsfunktion und jeder zukünftigen Tool-/Plugin-Oberfläche verwendet, die Bilder generiert.
  - Typische Werte: `google/gemini-3.1-flash-image-preview` für native Gemini-Bildgenerierung, `fal/fal-ai/flux/dev` für fal oder `openai/gpt-image-2` für OpenAI Images.
  - Wenn Sie direkt einen Provider/ein Modell auswählen, konfigurieren Sie auch die passende Provider-Auth (zum Beispiel `GEMINI_API_KEY` oder `GOOGLE_API_KEY` für `google/*`, `OPENAI_API_KEY` oder OpenAI Codex OAuth für `openai/gpt-image-2`, `FAL_KEY` für `fal/*`).
  - Wenn nicht gesetzt, kann `image_generate` dennoch einen auth-gestützten Standard-Provider ableiten. Es versucht zuerst den aktuellen Standard-Provider, dann die übrigen registrierten Bildgenerierungs-Provider in der Reihenfolge ihrer Provider-IDs.
- `musicGenerationModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Musikgenerierungsfunktion und dem eingebauten Tool `music_generate` verwendet.
  - Typische Werte: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` oder `minimax/music-2.6`.
  - Wenn nicht gesetzt, kann `music_generate` dennoch einen auth-gestützten Standard-Provider ableiten. Es versucht zuerst den aktuellen Standard-Provider, dann die übrigen registrierten Musikgenerierungs-Provider in der Reihenfolge ihrer Provider-IDs.
  - Wenn Sie direkt einen Provider/ein Modell auswählen, konfigurieren Sie auch die passende Provider-Auth/API-Key.
- `videoGenerationModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Videogenerierungsfunktion und dem eingebauten Tool `video_generate` verwendet.
  - Typische Werte: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` oder `qwen/wan2.7-r2v`.
  - Wenn nicht gesetzt, kann `video_generate` dennoch einen auth-gestützten Standard-Provider ableiten. Es versucht zuerst den aktuellen Standard-Provider, dann die übrigen registrierten Videogenerierungs-Provider in der Reihenfolge ihrer Provider-IDs.
  - Wenn Sie direkt einen Provider/ein Modell auswählen, konfigurieren Sie auch die passende Provider-Auth/API-Key.
  - Der gebündelte Qwen-Provider für Videogenerierung unterstützt bis zu 1 Ausgabevideo, 1 Eingabebild, 4 Eingabevideos, 10 Sekunden Dauer sowie Provider-Optionen auf Ebene des Providers für `size`, `aspectRatio`, `resolution`, `audio` und `watermark`.
- `pdfModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird vom `pdf`-Tool für das Modell-Routing verwendet.
  - Wenn nicht gesetzt, greift das PDF-Tool auf `imageModel` und dann auf das aufgelöste Sitzungs-/Standardmodell zurück.
- `pdfMaxBytesMb`: Standardgrenze für die PDF-Größe des `pdf`-Tools, wenn `maxBytesMb` beim Aufruf nicht übergeben wird.
- `pdfMaxPages`: standardmäßige maximale Seitenzahl, die im Extraktions-Fallback-Modus des `pdf`-Tools berücksichtigt wird.
- `verboseDefault`: Standard-Verbose-Level für Agenten. Werte: `"off"`, `"on"`, `"full"`. Standard: `"off"`.
- `elevatedDefault`: Standard-Level für erhöhte Ausgabe für Agenten. Werte: `"off"`, `"on"`, `"ask"`, `"full"`. Standard: `"on"`.
- `model.primary`: Format `provider/model` (z. B. `openai/gpt-5.4` für Zugriff per API-Key oder `openai-codex/gpt-5.5` für Codex OAuth). Wenn Sie den Provider weglassen, versucht OpenClaw zuerst einen Alias, dann einen eindeutigen Treffer unter den konfigurierten Providern für genau diese Modell-ID und greift erst danach auf den konfigurierten Standard-Provider zurück (veraltetes Kompatibilitätsverhalten, daher besser explizit `provider/model` angeben). Wenn dieser Provider das konfigurierte Standardmodell nicht mehr anbietet, greift OpenClaw auf das erste konfigurierte Provider-/Modellpaar zurück, anstatt einen veralteten Standard eines entfernten Providers anzuzeigen.
- `models`: der konfigurierte Modellkatalog und die Allowlist für `/model`. Jeder Eintrag kann `alias` (Kurzform) und `params` (providerspezifisch, z. B. `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `extra_body`/`extraBody`) enthalten.
  - Sichere Änderungen: Verwenden Sie `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, um Einträge hinzuzufügen. `config set` verweigert Ersetzungen, die bestehende Allowlist-Einträge entfernen würden, sofern Sie nicht `--replace` übergeben.
  - Providerbezogene Configure-/Onboarding-Abläufe führen ausgewählte Provider-Modelle in diese Map zusammen und erhalten bereits konfigurierte, nicht zusammenhängende Provider.
  - Für direkte OpenAI-Responses-Modelle ist serverseitige Compaction automatisch aktiviert. Verwenden Sie `params.responsesServerCompaction: false`, um das Einfügen von `context_management` zu stoppen, oder `params.responsesCompactThreshold`, um den Schwellenwert zu überschreiben. Siehe [OpenAI server-side compaction](/de/providers/openai#server-side-compaction-responses-api).
- `params`: globale Standard-Provider-Parameter, die auf alle Modelle angewendet werden. Setzen Sie diese unter `agents.defaults.params` (z. B. `{ cacheRetention: "long" }`).
- Merge-Priorität von `params` (Konfiguration): `agents.defaults.params` (globale Basis) wird von `agents.defaults.models["provider/model"].params` (pro Modell) überschrieben, danach überschreibt `agents.list[].params` (passende Agenten-ID) nach Schlüssel. Siehe [Prompt Caching](/de/reference/prompt-caching) für Details.
- `params.extra_body`/`params.extraBody`: erweiterte JSON-Durchleitung, die in Request-Bodies von `api: "openai-completions"` für OpenAI-kompatible Proxys zusammengeführt wird. Wenn sie mit generierten Request-Schlüsseln kollidiert, gewinnt der zusätzliche Body; nicht native Completions-Routen entfernen danach weiterhin das nur für OpenAI bestimmte `store`.
- `embeddedHarness`: Standardrichtlinie für die Low-Level-Laufzeit eingebetteter Agenten. Wenn die Laufzeit weggelassen wird, ist standardmäßig OpenClaw Pi aktiv. Verwenden Sie `runtime: "pi"`, um die eingebaute PI-Harness zu erzwingen, `runtime: "auto"`, damit registrierte Plugin-Harnesses unterstützte Modelle übernehmen können, oder eine registrierte Harness-ID wie `runtime: "codex"`. Setzen Sie `fallback: "none"`, um den automatischen PI-Fallback zu deaktivieren. Explizite Plugin-Laufzeiten wie `codex` schlagen standardmäßig fail-closed fehl, sofern Sie nicht `fallback: "pi"` im selben Override-Bereich setzen. Halten Sie Modellreferenzen kanonisch als `provider/model`; wählen Sie Codex, Claude CLI, Gemini CLI und andere Ausführungs-Backends über die Laufzeitkonfiguration statt über veraltete Provider-Präfixe der Laufzeit. Siehe [Agent runtimes](/de/concepts/agent-runtimes), wie sich dies von der Auswahl von Provider/Modell unterscheidet.
- Konfigurationsschreiber, die diese Felder ändern (zum Beispiel `/models set`, `/models set-image` und Befehle zum Hinzufügen/Entfernen von Fallbacks), speichern die kanonische Objektform und erhalten bestehende Fallback-Listen nach Möglichkeit.
- `maxConcurrent`: maximale Anzahl paralleler Agentenläufe über Sitzungen hinweg (jede Sitzung bleibt weiterhin serialisiert). Standard: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness` steuert, welcher Low-Level-Executor eingebettete Agentenzüge ausführt.
Die meisten Bereitstellungen sollten die Standard-Laufzeit OpenClaw Pi beibehalten.
Verwenden Sie sie, wenn ein vertrauenswürdiges Plugin eine native Harness bereitstellt, wie etwa die gebündelte
Codex-App-Server-Harness. Das mentale Modell dazu finden Sie unter
[Agent runtimes](/de/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`, `"pi"` oder eine registrierte Plugin-Harness-ID. Das gebündelte Codex-Plugin registriert `codex`.
- `fallback`: `"pi"` oder `"none"`. Bei `runtime: "auto"` ist der Standard-Fallback bei weggelassenem Wert `"pi"`, damit alte Konfigurationen weiter PI verwenden können, wenn keine Plugin-Harness einen Lauf übernimmt. Im Modus mit expliziter Plugin-Laufzeit, etwa `runtime: "codex"`, ist der Standard-Fallback bei weggelassenem Wert `"none"`, damit eine fehlende Harness zu einem Fehler führt, statt stillschweigend PI zu verwenden. Laufzeit-Overrides erben keinen Fallback aus einem breiteren Geltungsbereich; setzen Sie `fallback: "pi"` zusammen mit der expliziten Laufzeit, wenn Sie diesen Kompatibilitäts-Fallback absichtlich möchten. Fehler ausgewählter Plugin-Harnesses werden immer direkt angezeigt.
- Umgebungsvariablen-Overrides: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` überschreibt `runtime`; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` überschreibt den Fallback für diesen Prozess.
- Für reine Codex-Bereitstellungen setzen Sie `model: "openai/gpt-5.5"` und `embeddedHarness.runtime: "codex"`. Sie können zur besseren Lesbarkeit auch explizit `embeddedHarness.fallback: "none"` setzen; dies ist der Standard für explizite Plugin-Laufzeiten.
- Die Wahl der Harness wird nach dem ersten eingebetteten Lauf pro Sitzungs-ID fixiert. Änderungen an Konfiguration/Umgebungsvariablen wirken sich auf neue oder zurückgesetzte Sitzungen aus, nicht auf ein bestehendes Transkript. Legacy-Sitzungen mit Transkriptverlauf, aber ohne aufgezeichnete Fixierung, werden als auf PI fixiert behandelt. `/status` meldet die effektive Laufzeit, zum Beispiel `Runtime: OpenClaw Pi Default` oder `Runtime: OpenAI Codex`.
- Dies steuert nur die eingebettete Chat-Harness. Mediengenerierung, Vision, PDF, Musik, Video und TTS verwenden weiterhin ihre Provider-/Modell-Einstellungen.

**Eingebaute Alias-Kurzformen** (gelten nur, wenn das Modell in `agents.defaults.models` enthalten ist):

| Alias               | Modell                                             |
| ------------------- | -------------------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`                        |
| `sonnet`            | `anthropic/claude-sonnet-4-6`                      |
| `gpt`               | `openai/gpt-5.4` oder konfiguriertes Codex OAuth GPT-5.5 |
| `gpt-mini`          | `openai/gpt-5.4-mini`                              |
| `gpt-nano`          | `openai/gpt-5.4-nano`                              |
| `gemini`            | `google/gemini-3.1-pro-preview`                    |
| `gemini-flash`      | `google/gemini-3-flash-preview`                    |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`             |

Ihre konfigurierten Aliasse haben immer Vorrang vor den Standardwerten.

Z.AI-GLM-4.x-Modelle aktivieren automatisch den Thinking-Modus, sofern Sie nicht `--thinking off` setzen oder `agents.defaults.models["zai/<model>"].params.thinking` selbst definieren.
Z.AI-Modelle aktivieren standardmäßig `tool_stream` für das Streaming von Tool-Aufrufen. Setzen Sie `agents.defaults.models["zai/<model>"].params.tool_stream` auf `false`, um dies zu deaktivieren.
Anthropic-Claude-4.6-Modelle verwenden standardmäßig `adaptive` Thinking, wenn kein explizites Thinking-Level gesetzt ist.

### `agents.defaults.cliBackends`

Optionale CLI-Backends für textbasierte Fallback-Läufe (ohne Tool-Aufrufe). Nützlich als Backup, wenn API-Provider ausfallen.

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
- Bild-Durchleitung wird unterstützt, wenn `imageArg` Dateipfade akzeptiert.

### `agents.defaults.systemPromptOverride`

Ersetzt den gesamten von OpenClaw zusammengesetzten Systemprompt durch einen festen String. Kann auf Standardebene (`agents.defaults.systemPromptOverride`) oder pro Agent (`agents.list[].systemPromptOverride`) gesetzt werden. Werte pro Agent haben Vorrang; ein leerer oder nur aus Leerzeichen bestehender Wert wird ignoriert. Nützlich für kontrollierte Prompt-Experimente.

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

Providerunabhängige Prompt-Overlays, die nach Modellfamilie angewendet werden. Modell-IDs der GPT-5-Familie erhalten verhaltensübergreifend über Provider hinweg denselben gemeinsamen Verhaltensvertrag; `personality` steuert nur die Ebene des freundlichen Interaktionsstils.

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
        includeSystemPromptSection: true, // Standard: true; false lässt den Heartbeat-Abschnitt im Systemprompt weg
        lightContext: false, // Standard: false; true behält aus den Workspace-Bootstrap-Dateien nur HEARTBEAT.md
        isolatedSession: false, // Standard: false; true führt jeden Heartbeat in einer frischen Sitzung aus (kein Gesprächsverlauf)
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

- `every`: Dauerstring (ms/s/m/h). Standard: `30m` (API-Key-Auth) oder `1h` (OAuth-Auth). Auf `0m` setzen, um zu deaktivieren.
- `includeSystemPromptSection`: Wenn false, wird der Heartbeat-Abschnitt aus dem Systemprompt entfernt und die Einfügung von `HEARTBEAT.md` in den Bootstrap-Kontext übersprungen. Standard: `true`.
- `suppressToolErrorWarnings`: Wenn true, werden Payloads für Tool-Fehlerwarnungen während Heartbeat-Läufen unterdrückt.
- `timeoutSeconds`: maximal erlaubte Zeit in Sekunden für einen Heartbeat-Agentenzug, bevor er abgebrochen wird. Wenn nicht gesetzt, wird `agents.defaults.timeoutSeconds` verwendet.
- `directPolicy`: Richtlinie für direkte/DM-Zustellung. `allow` (Standard) erlaubt die Zustellung an direkte Ziele. `block` unterdrückt die Zustellung an direkte Ziele und gibt `reason=dm-blocked` aus.
- `lightContext`: Wenn true, verwenden Heartbeat-Läufe einen leichtgewichtigen Bootstrap-Kontext und behalten aus den Workspace-Bootstrap-Dateien nur `HEARTBEAT.md`.
- `isolatedSession`: Wenn true, wird jeder Heartbeat in einer frischen Sitzung ohne vorherigen Gesprächsverlauf ausgeführt. Dasselbe Isolationsmuster wie bei Cron `sessionTarget: "isolated"`. Reduziert die Tokenkosten pro Heartbeat von etwa 100K auf etwa 2–5K Tokens.
- Pro Agent: Setzen Sie `agents.list[].heartbeat`. Wenn irgendein Agent `heartbeat` definiert, führen **nur diese Agenten** Heartbeats aus.
- Heartbeats führen vollständige Agentenzüge aus — kürzere Intervalle verbrauchen mehr Tokens.

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
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // verwendet, wenn identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        postCompactionSections: ["Session Startup", "Red Lines"], // [] deaktiviert erneutes Einfügen
        model: "openrouter/anthropic/claude-sonnet-4-6", // optionales nur für Compaction geltendes Modell-Override
        notifyUser: true, // kurze Hinweise senden, wenn Compaction startet und endet (Standard: false)
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

- `mode`: `default` oder `safeguard` (Zusammenfassung in Blöcken für lange Verläufe). Siehe [Compaction](/de/concepts/compaction).
- `provider`: ID eines registrierten Compaction-Provider-Plugins. Wenn gesetzt, wird statt der eingebauten LLM-Zusammenfassung `summarize()` des Providers aufgerufen. Bei Fehlern wird auf die eingebaute Variante zurückgefallen. Das Setzen eines Providers erzwingt `mode: "safeguard"`. Siehe [Compaction](/de/concepts/compaction).
- `timeoutSeconds`: maximale Anzahl von Sekunden, die ein einzelner Compaction-Vorgang dauern darf, bevor OpenClaw ihn abbricht. Standard: `900`.
- `keepRecentTokens`: Budget des Pi-Schnittpunkts, um den neuesten Transkript-Schwanz wörtlich zu behalten. Manuelles `/compact` berücksichtigt dies, wenn es explizit gesetzt ist; andernfalls ist manuelle Compaction ein harter Checkpoint.
- `identifierPolicy`: `strict` (Standard), `off` oder `custom`. `strict` stellt der Compaction-Zusammenfassung eingebaute Hinweise zum Erhalt opaker Kennungen voran.
- `identifierInstructions`: optionaler benutzerdefinierter Text zum Erhalt von Kennungen, der verwendet wird, wenn `identifierPolicy=custom`.
- `qualityGuard`: Prüfungen mit Wiederholungsversuchen bei fehlerhafter Ausgabe für Safeguard-Zusammenfassungen. Im Safeguard-Modus standardmäßig aktiviert; setzen Sie `enabled: false`, um die Prüfung zu überspringen.
- `postCompactionSections`: optionale Namen von AGENTS.md-H2-/H3-Abschnitten, die nach Compaction erneut eingefügt werden. Standard ist `["Session Startup", "Red Lines"]`; setzen Sie `[]`, um das erneute Einfügen zu deaktivieren. Wenn nicht gesetzt oder explizit auf dieses Standardpaar gesetzt, werden ältere Überschriften `Every Session`/`Safety` ebenfalls als Legacy-Fallback akzeptiert.
- `model`: optionales Override `provider/model-id` nur für die Compaction-Zusammenfassung. Verwenden Sie dies, wenn die Hauptsitzung ein Modell behalten soll, Compaction-Zusammenfassungen aber auf einem anderen Modell laufen sollen; wenn nicht gesetzt, verwendet Compaction das primäre Modell der Sitzung.
- `notifyUser`: Wenn `true`, sendet kurze Hinweise an den Benutzer, wenn Compaction startet und wenn sie abgeschlossen ist (zum Beispiel „Compacting context...“ und „Compaction complete“). Standardmäßig deaktiviert, damit Compaction still bleibt.
- `memoryFlush`: stiller agentischer Zug vor der automatischen Compaction, um dauerhafte Erinnerungen zu speichern. Wird übersprungen, wenn der Workspace schreibgeschützt ist.

### `agents.defaults.contextPruning`

Beschneidet **alte Tool-Ergebnisse** aus dem In-Memory-Kontext, bevor dieser an das LLM gesendet wird. Ändert **nicht** den Sitzungsverlauf auf der Festplatte.

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

- `mode: "cache-ttl"` aktiviert Beschneidungsläufe.
- `ttl` steuert, wie oft die Beschneidung erneut ausgeführt werden kann (nach der letzten Cache-Berührung).
- Die Beschneidung kürzt zuerst übergroße Tool-Ergebnisse sanft und entfernt dann bei Bedarf ältere Tool-Ergebnisse vollständig.

**Sanftes Kürzen** behält Anfang + Ende und fügt `...` in der Mitte ein.

**Vollständiges Entfernen** ersetzt das gesamte Tool-Ergebnis durch den Platzhalter.

Hinweise:

- Bildblöcke werden nie gekürzt/entfernt.
- Verhältnisse basieren auf Zeichen (ungefähr), nicht auf exakten Tokenzahlen.
- Wenn weniger als `keepLastAssistants` Assistentennachrichten vorhanden sind, wird die Beschneidung übersprungen.

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
      humanDelay: { mode: "natural" }, // off | natural | custom (mit minMs/maxMs)
    },
  },
}
```

- Nicht-Telegram-Kanäle erfordern explizit `*.blockStreaming: true`, um Block-Antworten zu aktivieren.
- Kanal-Overrides: `channels.<channel>.blockStreamingCoalesce` (und Varianten pro Konto). Signal/Slack/Discord/Google Chat verwenden standardmäßig `minChars: 1500`.
- `humanDelay`: zufällige Pause zwischen Block-Antworten. `natural` = 800–2500 ms. Überschreibung pro Agent: `agents.list[].humanDelay`.

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

- Standards: `instant` für Direktchats/Erwähnungen, `message` für Gruppenchats ohne Erwähnung.
- Überschreibungen pro Sitzung: `session.typingMode`, `session.typingIntervalSeconds`.

Siehe [Typing Indicators](/de/concepts/typing-indicators).

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
- `workspaceRoot`: absolutes entferntes Root für Workspaces pro Geltungsbereich
- `identityFile` / `certificateFile` / `knownHostsFile`: vorhandene lokale Dateien, die an OpenSSH übergeben werden
- `identityData` / `certificateData` / `knownHostsData`: Inline-Inhalte oder SecretRefs, die OpenClaw zur Laufzeit in temporäre Dateien materialisiert
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH-Schalter für die Host-Key-Richtlinie

**Priorität der SSH-Authentifizierung:**

- `identityData` hat Vorrang vor `identityFile`
- `certificateData` hat Vorrang vor `certificateFile`
- `knownHostsData` hat Vorrang vor `knownHostsFile`
- SecretRef-gestützte `*Data`-Werte werden aus dem aktiven Snapshot der Secrets-Laufzeit aufgelöst, bevor die Sandbox-Sitzung startet

**Verhalten des SSH-Backends:**

- legt den entfernten Workspace einmal nach dem Erstellen oder Neuerstellen an
- hält danach den entfernten SSH-Workspace als kanonisch
- leitet `exec`, Dateitools und Medienpfade über SSH
- synchronisiert entfernte Änderungen nicht automatisch zurück auf den Host
- unterstützt keine Sandbox-Browser-Container

**Workspace-Zugriff:**

- `none`: Sandbox-Workspace pro Geltungsbereich unter `~/.openclaw/sandboxes`
- `ro`: Sandbox-Workspace unter `/workspace`, Agent-Workspace schreibgeschützt unter `/agent` eingehängt
- `rw`: Agent-Workspace unter `/workspace` mit Lese-/Schreibzugriff eingehängt

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

- `mirror`: vor `exec` den entfernten Workspace aus dem lokalen anlegen, nach `exec` zurücksynchronisieren; der lokale Workspace bleibt kanonisch
- `remote`: den entfernten Workspace einmal anlegen, wenn die Sandbox erstellt wird, danach bleibt der entfernte Workspace kanonisch

Im Modus `remote` werden hostlokale Änderungen, die außerhalb von OpenClaw vorgenommen werden, nach dem Anlegen nicht automatisch in die Sandbox synchronisiert.
Der Transport erfolgt per SSH in die OpenShell-Sandbox, aber das Plugin verwaltet den Lebenszyklus der Sandbox und die optionale Spiegel-Synchronisierung.

**`setupCommand`** wird einmal nach der Container-Erstellung ausgeführt (über `sh -lc`). Benötigt Netzwerk-Egress, beschreibbares Root und Root-Benutzer.

**Container verwenden standardmäßig `network: "none"`** — setzen Sie dies auf `"bridge"` (oder ein benutzerdefiniertes Bridge-Netzwerk), wenn der Agent ausgehenden Zugriff benötigt.
`"host"` ist blockiert. `"container:<id>"` ist standardmäßig blockiert, sofern Sie nicht explizit
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` setzen (Notfalloption).

**Eingehende Anhänge** werden in `media/inbound/*` im aktiven Workspace bereitgestellt.

**`docker.binds`** hängt zusätzliche Host-Verzeichnisse ein; globale und agentenspezifische Bindings werden zusammengeführt.

**Sandbox-Browser** (`sandbox.browser.enabled`): Chromium + CDP in einem Container. Die noVNC-URL wird in den Systemprompt eingefügt. Erfordert nicht `browser.enabled` in `openclaw.json`.
noVNC-Beobachterzugriff verwendet standardmäßig VNC-Authentifizierung, und OpenClaw gibt eine kurzlebige Token-URL aus (anstatt das Passwort in der geteilten URL offenzulegen).

- `allowHostControl: false` (Standard) blockiert, dass Sitzungen in der Sandbox den Host-Browser ansprechen.
- `network` ist standardmäßig `openclaw-sandbox-browser` (dediziertes Bridge-Netzwerk). Setzen Sie es nur dann auf `bridge`, wenn Sie ausdrücklich globale Bridge-Konnektivität wünschen.
- `cdpSourceRange` beschränkt optional den CDP-Eingang am Container-Rand auf einen CIDR-Bereich (zum Beispiel `172.21.0.1/32`).
- `sandbox.browser.binds` hängt zusätzliche Host-Verzeichnisse nur in den Sandbox-Browser-Container ein. Wenn gesetzt (einschließlich `[]`), ersetzt es `docker.binds` für den Browser-Container.
- Standardwerte für den Start sind in `scripts/sandbox-browser-entrypoint.sh` definiert und für Container-Hosts abgestimmt:
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
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` geändert werden; setzen Sie `0`, um das
    Standardlimit von Chromium für Prozesse zu verwenden.
  - plus `--no-sandbox`, wenn `noSandbox` aktiviert ist.
  - Die Standardwerte sind die Basis des Container-Images; verwenden Sie ein benutzerdefiniertes Browser-Image mit einem benutzerdefinierten
    Entry-Point, um die Container-Standards zu ändern.

</Accordion>

Browser-Sandboxing und `sandbox.docker.binds` sind nur für Docker verfügbar.

Images bauen:

```bash
scripts/sandbox-setup.sh           # Haupt-Sandbox-Image
scripts/sandbox-browser-setup.sh   # optionales Browser-Image
```

### `agents.list` (Überschreibungen pro Agent)

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
        fastModeDefault: false, // Überschreibung des Fast-Modus pro Agent
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // überschreibt passende defaults.models-Parameter nach Schlüssel
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

- `id`: stabile Agenten-ID (erforderlich).
- `default`: wenn mehrere gesetzt sind, gewinnt der erste (es wird eine Warnung protokolliert). Wenn keiner gesetzt ist, ist der erste Listeneintrag der Standard.
- `model`: Die String-Form überschreibt nur `primary`; die Objekt-Form `{ primary, fallbacks }` überschreibt beide (`[]` deaktiviert globale Fallbacks). Cron-Jobs, die nur `primary` überschreiben, erben weiterhin Standard-Fallbacks, sofern Sie nicht `fallbacks: []` setzen.
- `params`: Stream-Parameter pro Agent, die über den ausgewählten Modelleintrag in `agents.defaults.models` zusammengeführt werden. Verwenden Sie dies für agentenspezifische Überschreibungen wie `cacheRetention`, `temperature` oder `maxTokens`, ohne den gesamten Modellkatalog zu duplizieren.
- `skills`: optionale Skill-Allowlist pro Agent. Wenn ausgelassen, erbt der Agent `agents.defaults.skills`, sofern gesetzt; eine explizite Liste ersetzt die Standardwerte statt sie zusammenzuführen, und `[]` bedeutet keine Skills.
- `thinkingDefault`: optionales standardmäßiges Thinking-Level pro Agent (`off | minimal | low | medium | high | xhigh | adaptive | max`). Überschreibt `agents.defaults.thinkingDefault` für diesen Agenten, wenn keine Überschreibung pro Nachricht oder Sitzung gesetzt ist. Das ausgewählte Provider-/Modellprofil steuert, welche Werte gültig sind; bei Google Gemini behält `adaptive` das providerverwaltete dynamische Thinking bei (`thinkingLevel` wird bei Gemini 3/3.1 weggelassen, `thinkingBudget: -1` bei Gemini 2.5).
- `reasoningDefault`: optionale standardmäßige Sichtbarkeit von Reasoning pro Agent (`on | off | stream`). Gilt, wenn keine Überschreibung von Reasoning pro Nachricht oder Sitzung gesetzt ist.
- `fastModeDefault`: optionale Standardeinstellung pro Agent für den Fast-Modus (`true | false`). Gilt, wenn keine Überschreibung für den Fast-Modus pro Nachricht oder Sitzung gesetzt ist.
- `embeddedHarness`: optionale Überschreibung der Low-Level-Harness-Richtlinie pro Agent. Verwenden Sie `{ runtime: "codex" }`, um einen Agenten nur mit Codex zu betreiben, während andere Agenten den Standard-PI-Fallback im Modus `auto` behalten.
- `runtime`: optionaler Laufzeitdeskriptor pro Agent. Verwenden Sie `type: "acp"` mit Standardwerten unter `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), wenn der Agent standardmäßig ACP-Harness-Sitzungen verwenden soll.
- `identity.avatar`: workspace-relativer Pfad, `http(s)`-URL oder `data:`-URI.
- `identity` leitet Standardwerte ab: `ackReaction` aus `emoji`, `mentionPatterns` aus `name`/`emoji`.
- `subagents.allowAgents`: Allowlist von Agenten-IDs für `sessions_spawn` (`["*"]` = beliebig; Standard: nur derselbe Agent).
- Schutz vor Sandbox-Vererbung: Wenn die anfragende Sitzung in einer Sandbox läuft, lehnt `sessions_spawn` Ziele ab, die ohne Sandbox laufen würden.
- `subagents.requireAgentId`: Wenn true, blockiert `sessions_spawn`-Aufrufe, die `agentId` weglassen (erzwingt explizite Profilauswahl; Standard: false).

---

## Multi-Agent-Routing

Mehrere isolierte Agenten innerhalb eines Gateway ausführen. Siehe [Multi-Agent](/de/concepts/multi-agent).

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

### Match-Felder für Bindungen

- `type` (optional): `route` für normales Routing (fehlender Typ entspricht route), `acp` für persistente ACP-Gesprächsbindungen.
- `match.channel` (erforderlich)
- `match.accountId` (optional; `*` = beliebiges Konto; weggelassen = Standardkonto)
- `match.peer` (optional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (optional; kanalspezifisch)
- `acp` (optional; nur für `type: "acp"`): `{ mode, label, cwd, backend }`

**Deterministische Match-Reihenfolge:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exakt, ohne Peer/Guild/Team)
5. `match.accountId: "*"` (kanalweit)
6. Standard-Agent

Innerhalb jeder Stufe gewinnt der erste passende Eintrag in `bindings`.

Bei Einträgen vom Typ `type: "acp"` löst OpenClaw anhand der exakten Gesprächsidentität auf (`match.channel` + Konto + `match.peer.id`) und verwendet nicht die oben angegebene Reihenfolge der Routing-Bindungsstufen.

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

Siehe [Multi-Agent Sandbox & Tools](/de/tools/multi-agent-sandbox-tools) für Details zur Priorität.

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
    parentForkMaxTokens: 100000, // Parent-Thread-Fork oberhalb dieser Tokenzahl überspringen (0 deaktiviert)
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
      idleHours: 24, // standardmäßiges automatisches Entfokussieren bei Inaktivität in Stunden (`0` deaktiviert)
      maxAgeHours: 0, // standardmäßiges hartes Maximalalter in Stunden (`0` deaktiviert)
    },
    mainKey: "main", // veraltet (Laufzeit verwendet immer "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Details zu Sitzungsfeldern">

- **`scope`**: grundlegende Strategie zur Gruppierung von Sitzungen für Gruppenchats.
  - `per-sender` (Standard): jeder Absender erhält eine isolierte Sitzung innerhalb eines Kanalkontexts.
  - `global`: alle Teilnehmer in einem Kanalkontext teilen sich eine einzelne Sitzung (nur verwenden, wenn gemeinsamer Kontext beabsichtigt ist).
- **`dmScope`**: wie DMs gruppiert werden.
  - `main`: alle DMs teilen sich die Hauptsitzung.
  - `per-peer`: Isolation nach Absender-ID über Kanäle hinweg.
  - `per-channel-peer`: Isolation pro Kanal + Absender (empfohlen für Inboxen mit mehreren Benutzern).
  - `per-account-channel-peer`: Isolation pro Konto + Kanal + Absender (empfohlen für mehrere Konten).
- **`identityLinks`**: Zuordnung kanonischer IDs zu providerpräfixierten Peers für sitzungsübergreifende Nutzung über Kanäle hinweg.
- **`reset`**: primäre Reset-Richtlinie. `daily` setzt zur lokalen Uhrzeit `atHour` zurück; `idle` setzt nach `idleMinutes` zurück. Wenn beides konfiguriert ist, gewinnt der zuerst ablaufende Wert.
- **`resetByType`**: Überschreibungen pro Typ (`direct`, `group`, `thread`). Das veraltete `dm` wird als Alias für `direct` akzeptiert.
- **`parentForkMaxTokens`**: maximal erlaubte `totalTokens` der übergeordneten Sitzung beim Erstellen einer geforkten Thread-Sitzung (Standard `100000`).
  - Wenn `totalTokens` der übergeordneten Sitzung über diesem Wert liegt, startet OpenClaw eine frische Thread-Sitzung, anstatt den Verlauf des übergeordneten Transkripts zu übernehmen.
  - Setzen Sie `0`, um diese Schutzvorrichtung zu deaktivieren und Parent-Forking immer zu erlauben.
- **`mainKey`**: veraltetes Feld. Die Laufzeit verwendet für den Bucket des direkten Hauptchats immer `"main"`.
- **`agentToAgent.maxPingPongTurns`**: maximale Anzahl an Hin-und-her-Antwortzügen zwischen Agenten während Agent-zu-Agent-Austausch (Ganzzahl, Bereich: `0`–`5`). `0` deaktiviert Ping-Pong-Verkettung.
- **`sendPolicy`**: Match nach `channel`, `chatType` (`direct|group|channel`, mit veraltetem Alias `dm`), `keyPrefix` oder `rawKeyPrefix`. Das erste `deny` gewinnt.
- **`maintenance`**: Bereinigung + Aufbewahrungssteuerung für den Sitzungsspeicher.
  - `mode`: `warn` gibt nur Warnungen aus; `enforce` wendet Bereinigungen an.
  - `pruneAfter`: Altersgrenze für veraltete Einträge (Standard `30d`).
  - `maxEntries`: maximale Anzahl an Einträgen in `sessions.json` (Standard `500`).
  - `rotateBytes`: rotiert `sessions.json`, wenn diese Größe überschritten wird (Standard `10mb`).
  - `resetArchiveRetention`: Aufbewahrung für `*.reset.<timestamp>`-Transkriptarchive. Standardmäßig identisch mit `pruneAfter`; setzen Sie `false`, um dies zu deaktivieren.
  - `maxDiskBytes`: optionales Festplattenbudget für das Sitzungsverzeichnis. Im Modus `warn` werden Warnungen protokolliert; im Modus `enforce` werden zuerst die ältesten Artefakte/Sitzungen entfernt.
  - `highWaterBytes`: optionales Ziel nach der Budget-Bereinigung. Standardmäßig `80%` von `maxDiskBytes`.
- **`threadBindings`**: globale Standardwerte für threadgebundene Sitzungsfunktionen.
  - `enabled`: globaler Standard-Hauptschalter (Provider können überschreiben; Discord verwendet `channels.discord.threadBindings.enabled`)
  - `idleHours`: standardmäßiges automatisches Entfokussieren bei Inaktivität in Stunden (`0` deaktiviert; Provider können überschreiben)
  - `maxAgeHours`: standardmäßiges hartes Maximalalter in Stunden (`0` deaktiviert; Provider können überschreiben)

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

Überschreibungen pro Kanal/Konto: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Auflösung (das Spezifischste gewinnt): Konto → Kanal → global. `""` deaktiviert und stoppt die Kaskade. `"auto"` leitet `[{identity.name}]` ab.

**Template-Variablen:**

| Variable          | Beschreibung            | Beispiel                    |
| ----------------- | ----------------------- | --------------------------- |
| `{model}`         | Kurzer Modellname       | `claude-opus-4-6`           |
| `{modelFull}`     | Vollständige Modellkennung | `anthropic/claude-opus-4-6` |
| `{provider}`      | Provider-Name           | `anthropic`                 |
| `{thinkingLevel}` | Aktuelles Thinking-Level | `high`, `low`, `off`        |
| `{identity.name}` | Identity-Name des Agenten | (gleich wie `"auto"`)       |

Variablen sind nicht case-sensitiv. `{think}` ist ein Alias für `{thinkingLevel}`.

### Ack-Reaktion

- Standardmäßig das `identity.emoji` des aktiven Agenten, andernfalls `"👀"`. Setzen Sie `""`, um zu deaktivieren.
- Überschreibungen pro Kanal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Auflösungsreihenfolge: Konto → Kanal → `messages.ackReaction` → Identity-Fallback.
- Geltungsbereich: `group-mentions` (Standard), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: entfernt das Ack nach der Antwort auf Slack, Discord und Telegram.
- `messages.statusReactions.enabled`: aktiviert Lifecycle-Statusreaktionen auf Slack, Discord und Telegram.
  Auf Slack und Discord bleiben Statusreaktionen bei nicht gesetztem Wert aktiviert, wenn Ack-Reaktionen aktiv sind.
  Auf Telegram muss es explizit auf `true` gesetzt werden, um Lifecycle-Statusreaktionen zu aktivieren.

### Debounce für eingehende Nachrichten

Bündelt schnelle reine Textnachrichten desselben Absenders zu einem einzigen Agentenzug. Medien/Anhänge werden sofort geleert. Steuerbefehle umgehen Debouncing.

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

- `auto` steuert den Standardmodus für automatisches TTS: `off`, `always`, `inbound` oder `tagged`. `/tts on|off` kann lokale Einstellungen überschreiben, und `/tts status` zeigt den effektiven Zustand.
- `summaryModel` überschreibt `agents.defaults.model.primary` für die automatische Zusammenfassung.
- `modelOverrides` ist standardmäßig aktiviert; `modelOverrides.allowProvider` ist standardmäßig `false` (Opt-in).
- API-Keys greifen auf `ELEVENLABS_API_KEY`/`XI_API_KEY` und `OPENAI_API_KEY` zurück.
- Gebündelte Speech-Provider gehören Plugins. Wenn `plugins.allow` gesetzt ist, schließen Sie jedes TTS-Provider-Plugin ein, das Sie verwenden möchten, zum Beispiel `microsoft` für Edge TTS. Die veraltete Provider-ID `edge` wird als Alias für `microsoft` akzeptiert.
- `providers.openai.baseUrl` überschreibt den OpenAI-TTS-Endpunkt. Die Auflösungsreihenfolge ist Konfiguration, dann `OPENAI_TTS_BASE_URL`, dann `https://api.openai.com/v1`.
- Wenn `providers.openai.baseUrl` auf einen Nicht-OpenAI-Endpunkt zeigt, behandelt OpenClaw ihn als OpenAI-kompatiblen TTS-Server und lockert die Modell-/Stimmenvalidierung.

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
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` muss einem Schlüssel in `talk.providers` entsprechen, wenn mehrere Talk-Provider konfiguriert sind.
- Veraltete flache Talk-Schlüssel (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) dienen nur der Kompatibilität und werden automatisch nach `talk.providers.<provider>` migriert.
- Voice-IDs greifen auf `ELEVENLABS_VOICE_ID` oder `SAG_VOICE_ID` zurück.
- `providers.*.apiKey` akzeptiert Klartext-Strings oder SecretRef-Objekte.
- Der Fallback `ELEVENLABS_API_KEY` gilt nur, wenn kein Talk-API-Key konfiguriert ist.
- `providers.*.voiceAliases` erlaubt Talk-Direktiven die Verwendung freundlicher Namen.
- `providers.mlx.modelId` wählt das Hugging-Face-Repo aus, das vom lokalen MLX-Helfer auf macOS verwendet wird. Wenn nicht gesetzt, verwendet macOS `mlx-community/Soprano-80M-bf16`.
- Die MLX-Wiedergabe auf macOS läuft über den gebündelten Helfer `openclaw-mlx-tts`, wenn vorhanden, oder über eine ausführbare Datei auf `PATH`; `OPENCLAW_MLX_TTS_BIN` überschreibt für die Entwicklung den Pfad des Helfers.
- `silenceTimeoutMs` steuert, wie lange der Talk-Modus nach Stille des Benutzers wartet, bevor das Transkript gesendet wird. Wenn nicht gesetzt, bleibt das plattformspezifische Standard-Pausenfenster erhalten (`700 ms auf macOS und Android, 900 ms auf iOS`).

---

## Verwandt

- [Konfigurationsreferenz](/de/gateway/configuration-reference) — alle anderen Konfigurationsschlüssel
- [Konfiguration](/de/gateway/configuration) — häufige Aufgaben und Schnelleinrichtung
- [Konfigurationsbeispiele](/de/gateway/configuration-examples)
