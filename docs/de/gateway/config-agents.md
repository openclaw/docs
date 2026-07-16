---
read_when:
    - Agentenstandardwerte optimieren (Modelle, Denkmodus, Arbeitsbereich, Heartbeat, Medien, Skills)
    - Multi-Agent-Routing und Bindings konfigurieren
    - Sitzungs-, Nachrichtenzustellungs- und Sprechmodusverhalten anpassen
summary: Agentenstandards, Multi-Agent-Routing, Sitzungs-, Nachrichten- und Sprachkonfiguration
title: Konfiguration — Agenten
x-i18n:
    generated_at: "2026-07-16T12:43:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 61e6d6b6db806b05f5354a86a4d937a0e16b9f656b22ae4f3185a1674d2ee21a
    source_path: gateway/config-agents.md
    workflow: 16
---

Agent-spezifische Konfigurationsschlüssel unter `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` und `talk.*`. Informationen zu Kanälen, Tools, Gateway-Laufzeit und anderen
Schlüsseln der obersten Ebene finden Sie in der [Konfigurationsreferenz](/de/gateway/configuration-reference).

## Agent-Standardwerte

### `agents.defaults.workspace`

Standard: `OPENCLAW_WORKSPACE_DIR`, sofern festgelegt, andernfalls `~/.openclaw/workspace` (oder `~/.openclaw/workspace-<profile>`, wenn `OPENCLAW_PROFILE` auf ein vom Standard abweichendes Profil gesetzt ist).

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Ein expliziter Wert für `agents.defaults.workspace` hat Vorrang vor
`OPENCLAW_WORKSPACE_DIR`. Verwenden Sie die Umgebungsvariable, um Standard-Agents
auf einen eingebundenen Workspace zu verweisen, wenn Sie diesen Pfad nicht in die Konfiguration schreiben möchten.

### `agents.defaults.repoRoot`

Optionaler Repository-Stamm, der in der Runtime-Zeile des System-Prompts angezeigt wird. Wenn nicht festgelegt, erkennt OpenClaw ihn automatisch, indem es vom Workspace aus nach oben durch die Verzeichnisse navigiert.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Optionale standardmäßige Skill-Zulassungsliste für Agents, die
`agents.list[].skills` nicht festlegen.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // erbt github, weather
      { id: "docs", skills: ["docs-search"] }, // ersetzt Standardwerte
      { id: "locked-down", skills: [] }, // keine Skills
    ],
  },
}
```

- Lassen Sie `agents.defaults.skills` weg, um Skills standardmäßig nicht einzuschränken.
- Lassen Sie `agents.list[].skills` weg, um die Standardwerte zu erben.
- Setzen Sie `agents.list[].skills: []`, um keine Skills zuzulassen.
- Eine nicht leere Liste `agents.list[].skills` ist die endgültige Menge für diesen Agent; sie
  wird nicht mit den Standardwerten zusammengeführt.

### `agents.defaults.skipBootstrap`

Deaktiviert die automatische Erstellung von Workspace-Bootstrap-Dateien (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Überspringt die Erstellung ausgewählter optionaler Workspace-Dateien, während erforderliche Bootstrap-Dateien (`AGENTS.md`, `TOOLS.md`, `BOOTSTRAP.md`) weiterhin geschrieben werden. Gültige Werte: `SOUL.md`, `USER.md`, `HEARTBEAT.md` und `IDENTITY.md`.

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

Steuert, wann Workspace-Bootstrap-Dateien in den System-Prompt eingefügt werden. Standard: `"always"`.

- `"continuation-skip"`: Bei sicheren Fortsetzungsdurchläufen (nach einer abgeschlossenen Assistentenantwort) wird das erneute Einfügen des Workspace-Bootstraps übersprungen, wodurch die Prompt-Größe reduziert wird. Heartbeat-Ausführungen und Wiederholungsversuche nach einer Compaction bauen den Kontext weiterhin neu auf.
- `"never"`: Deaktiviert bei jedem Durchlauf das Einfügen des Workspace-Bootstraps und der Kontextdateien. Verwenden Sie dies nur für Agents, die ihren Prompt-Lebenszyklus vollständig selbst verwalten (benutzerdefinierte Kontext-Engines, native Laufzeiten, die ihren eigenen Kontext erstellen, oder spezialisierte Workflows ohne Bootstrap). Bei Heartbeat- und Wiederherstellungsdurchläufen nach einer Compaction wird das Einfügen ebenfalls übersprungen.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Agent-spezifische Überschreibung: `agents.list[].contextInjection`. Nicht angegebene Werte erben
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Maximale Zeichenzahl pro Workspace-Bootstrap-Datei vor der Kürzung. Standard: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Agent-spezifische Überschreibung: `agents.list[].bootstrapMaxChars`. Nicht angegebene Werte erben
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Maximale Gesamtzeichenzahl, die über alle Workspace-Bootstrap-Dateien hinweg eingefügt wird. Standard: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Agent-spezifische Überschreibung: `agents.list[].bootstrapTotalMaxChars`. Nicht angegebene Werte
erben `agents.defaults.bootstrapTotalMaxChars`.

### Agent-spezifische Überschreibungen des Bootstrap-Profils

Verwenden Sie Agent-spezifische Überschreibungen des Bootstrap-Profils, wenn ein Agent ein anderes Verhalten beim
Einfügen des Prompts als die gemeinsamen Standardwerte benötigt. Nicht angegebene Felder erben von
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

Steuert den für den Agent sichtbaren Hinweis im System-Prompt, wenn der Bootstrap-Kontext gekürzt wird.
Standard: `"always"`.

- `"off"`: Fügt niemals einen Hinweistext zur Kürzung in den System-Prompt ein.
- `"once"`: Fügt einmal pro eindeutiger Kürzungssignatur einen knappen Hinweis ein.
- `"always"`: Fügt bei jeder Ausführung einen knappen Hinweis ein, wenn eine Kürzung vorliegt (empfohlen).

Detaillierte rohe/eingefügte Zählwerte und Felder zur Konfigurationsoptimierung verbleiben in Diagnosen wie
Kontext-/Statusberichten und Protokollen; der normale WebChat-Benutzer-/Laufzeitkontext erhält nur
den knappen Wiederherstellungshinweis.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Zuordnung der Zuständigkeit für Kontextbudgets

OpenClaw verfügt über mehrere umfangreiche Prompt-/Kontextbudgets, die
bewusst nach Subsystem getrennt sind, anstatt alle über einen einzigen generischen
Regler gesteuert zu werden.

| Budget                                                         | Deckt ab                                                                                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | Normales Einfügen des Workspace-Bootstraps                                                                                                                            |
| `agents.defaults.startupContext.*`                             | Einmaliger Vorspann für Modellläufe beim Zurücksetzen/Starten, einschließlich aktueller täglicher `memory/*.md`-Dateien. Reine Chat-Befehle `/new` und `/reset` werden bestätigt, ohne das Modell aufzurufen |
| `skills.limits.*`                                              | Die kompakte Skills-Liste, die in den System-Prompt eingefügt wird                                                                                                         |
| `agents.defaults.contextLimits.*`                              | Begrenzte Laufzeitauszüge und eingefügte, von der Laufzeit verwaltete Blöcke                                                                                                      |
| `memory.qmd.limits.*`                                          | Größe des indizierten Speicher-Suchausschnitts und seiner Einfügung                                                                                                              |

Entsprechende Agent-spezifische Überschreibungen:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Steuert den beim ersten Durchlauf auf Zurücksetzungs-/Startmodellläufen eingefügten Startvorspann.
Reine Chat-Befehle `/new` und `/reset` bestätigen das Zurücksetzen, ohne
das Modell aufzurufen, daher laden sie diesen Vorspann nicht.

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

Gemeinsame Standardwerte für begrenzte Laufzeitkontextflächen.

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

- `memoryGetMaxChars`: Standardmäßige Obergrenze für `memory_get`-Auszüge, bevor Kürzungsmetadaten
  und ein Fortsetzungshinweis hinzugefügt werden.
- `memoryGetDefaultLines`: Standardmäßiges Zeilenfenster für `memory_get`, wenn `lines`
  nicht angegeben ist.
- `toolResultMaxChars`: Erweiterte Obergrenze für Live-Tool-Ergebnisse, die für persistierte
  Ergebnisse und die Wiederherstellung bei Überlauf verwendet wird. Lassen Sie den Wert für die automatische Obergrenze des Modellkontexts nicht festgelegt:
  `16000` Zeichen unter 100K Tokens, `32000` Zeichen ab 100K Tokens und `64000`
  Zeichen ab 200K Tokens. Explizite Werte bis `1000000` werden für
  Modelle mit langem Kontext akzeptiert, die effektive Obergrenze bleibt jedoch auf etwa 30 % des
  Modellkontextfensters begrenzt. `openclaw doctor --deep` gibt die effektive Obergrenze aus,
  und Doctor warnt nur, wenn eine explizite Überschreibung veraltet oder wirkungslos ist.
- `postCompactionMaxChars`: Obergrenze für AGENTS.md-Auszüge, die bei der
  Aktualisierungseinfügung nach einer Compaction verwendet wird.

#### `agents.list[].contextLimits`

Agent-spezifische Überschreibung für die gemeinsamen `contextLimits`-Regler. Nicht angegebene Felder erben
von `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: { memoryGetMaxChars: 12000 },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // erweiterte Obergrenze für diesen Agent
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Globale Obergrenze für die kompakte Skills-Liste, die in den System-Prompt eingefügt wird. Dies
wirkt sich nicht auf das bedarfsgesteuerte Lesen von `SKILL.md`-Dateien aus.

```json5
{
  skills: { limits: { maxSkillsPromptChars: 18000 } },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Agent-spezifische Überschreibung für das Skills-Prompt-Budget.

```json5
{
  agents: {
    list: [{ id: "tiny-local", skillsLimits: { maxSkillsPromptChars: 6000 } }],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Maximale Pixelgröße für die längste Bildseite in Transkript-/Tool-Bildblöcken vor Provider-Aufrufen.
Standard: `1200`.

Niedrigere Werte reduzieren bei screenshotintensiven Ausführungen in der Regel die Nutzung von Vision-Tokens und die Größe der Anfrage-Nutzlast.
Höhere Werte bewahren mehr visuelle Details.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Komprimierungs-/Detailpräferenz des Bild-Tools für Bilder, die aus Dateipfaden, URLs und Medienreferenzen geladen werden.
Standard: `auto`.

OpenClaw passt die Größenänderungsstaffel an das ausgewählte Bildmodell an. Beispielsweise können Claude Opus 4.8, OpenAI GPT-5.6 Sol, Qwen VL und gehostete Llama-4-Vision-Modelle größere Bilder als ältere/standardmäßige Vision-Pfade mit hoher Detailgenauigkeit verwenden, während Durchläufe mit mehreren Bildern im Modus `auto` stärker komprimiert werden, um Token- und Latenzkosten zu begrenzen.

Werte:

- `auto`: An Modellgrenzen und Bildanzahl anpassen.
- `efficient`: Kleinere Bilder bevorzugen, um die Token- und Byte-Nutzung zu reduzieren.
- `balanced`: Die standardmäßige ausgewogene Staffel verwenden.
- `high`: Mehr Details für Screenshots, Diagramme und Dokumentbilder bewahren.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

Zeitzone für den Kontext des System-Prompts (nicht für Nachrichtenzeitstempel). Fällt auf die Zeitzone des Hosts zurück.

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
      utilityModel: "openai/gpt-5.4-mini",
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
      params: { cacheRetention: "long" }, // globale standardmäßige Provider-Parameter
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
      maxConcurrent: 4,
    },
  },
}
```

- `model`: akzeptiert entweder eine Zeichenfolge (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Die Zeichenfolgenform legt nur das primäre Modell fest.
  - Die Objektform legt das primäre Modell sowie geordnete Failover-Modelle fest.
- `utilityModel`: optionale `provider/model`-Referenz oder Alias für kurze interne Aufgaben. Sie wird derzeit für generierte Sitzungstitel der Control UI, Titel von Telegram-DM-Themen, Titel automatisch erstellter Discord-Threads und [Erzählungen in Fortschrittsentwürfen](/de/concepts/progress-drafts#narrated-status) verwendet. Wenn sie nicht festgelegt ist, leitet OpenClaw den deklarierten Standard des primären Providers für kleine Modelle ab, sofern ein solcher vorhanden ist (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`); andernfalls greifen Titelaufgaben auf das primäre Modell des Agenten zurück und die Erzählung bleibt deaktiviert. Legen Sie `utilityModel: ""` fest, um das Utility-Routing vollständig zu deaktivieren. `agents.list[].utilityModel` überschreibt den Standard (ein leerer agentenspezifischer Wert deaktiviert es für diesen Agenten), und eine operationsspezifische Modellüberschreibung hat Vorrang vor beiden. Utility-Aufgaben führen separate Modellaufrufe aus und senden aufgabenspezifische Inhalte an den ausgewählten Modell-Provider. Bei der Generierung von Dashboard-Titeln werden höchstens die ersten 1.000 Zeichen der ersten Nachricht gesendet, die kein Befehl ist; bei Erzählungen werden die eingehende Anfrage sowie kompakte, redigierte Tool-Zusammenfassungen gesendet. Wählen Sie einen Provider, der Ihren Anforderungen an Kosten und Datenverarbeitung entspricht.
- `imageModel`: akzeptiert entweder eine Zeichenfolge (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird vom Tool-Pfad `image` als Konfiguration für das Bildverarbeitungsmodell verwendet, wenn das aktive Modell keine Bilder akzeptieren kann. Modelle mit nativer Bildverarbeitung erhalten stattdessen die geladenen Bildbytes direkt.
  - Wird außerdem als Fallback-Routing verwendet, wenn das ausgewählte bzw. standardmäßige Modell keine Bildeingaben akzeptieren kann.
  - Bevorzugen Sie explizite `provider/model`-Referenzen. Unqualifizierte IDs werden aus Kompatibilitätsgründen akzeptiert; wenn eine unqualifizierte ID eindeutig einem konfigurierten bildfähigen Eintrag in `models.providers.*.models` entspricht, ergänzt OpenClaw sie um diesen Provider. Bei mehrdeutigen konfigurierten Übereinstimmungen ist ein explizites Provider-Präfix erforderlich.
- `imageGenerationModel`: akzeptiert entweder eine Zeichenfolge (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Bildgenerierungsfunktion und allen zukünftigen Tool-/Plugin-Oberflächen verwendet, die Bilder generieren.
  - Typische Werte: `google/gemini-3.1-flash-image-preview` für die native Gemini-Bildgenerierung, `fal/fal-ai/flux/dev` für fal, `openai/gpt-image-2` für OpenAI Images oder `openai/gpt-image-1.5` für OpenAI-PNG-/WebP-Ausgaben mit transparentem Hintergrund.
  - Wenn Sie einen Provider bzw. ein Modell direkt auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung (beispielsweise `GEMINI_API_KEY` oder `GOOGLE_API_KEY` für `google/*`, `OPENAI_API_KEY` oder OpenAI Codex OAuth für `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` für `fal/*`).
  - Wenn der Wert weggelassen wird, kann `image_generate` weiterhin einen durch Authentifizierung gestützten Provider-Standard ableiten. Dabei wird zuerst der aktuelle Standard-Provider und anschließend werden die übrigen registrierten Provider für die Bildgenerierung in der Reihenfolge ihrer Provider-IDs ausprobiert.
- `musicGenerationModel`: akzeptiert entweder eine Zeichenfolge (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Musikgenerierungsfunktion und dem integrierten Tool `music_generate` verwendet.
  - Typische Werte: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` oder `minimax/music-2.6`.
  - Wenn der Wert weggelassen wird, kann `music_generate` weiterhin einen durch Authentifizierung gestützten Provider-Standard ableiten. Dabei wird zuerst der aktuelle Standard-Provider und anschließend werden die übrigen registrierten Provider für die Musikgenerierung in der Reihenfolge ihrer Provider-IDs ausprobiert.
  - Wenn Sie einen Provider bzw. ein Modell direkt auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung bzw. den passenden API-Schlüssel.
- `videoGenerationModel`: akzeptiert entweder eine Zeichenfolge (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Videogenerierungsfunktion und dem integrierten Tool `video_generate` verwendet.
  - Typische Werte: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` oder `qwen/wan2.7-r2v`.
  - Wenn der Wert weggelassen wird, kann `video_generate` weiterhin einen durch Authentifizierung gestützten Provider-Standard ableiten. Dabei wird zuerst der aktuelle Standard-Provider und anschließend werden die übrigen registrierten Provider für die Videogenerierung in der Reihenfolge ihrer Provider-IDs ausprobiert.
  - Wenn Sie einen Provider bzw. ein Modell direkt auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung bzw. den passenden API-Schlüssel.
  - Das offizielle Qwen-Plugin für die Videogenerierung unterstützt bis zu 1 Ausgabevideo, 1 Eingabebild, 4 Eingabevideos, eine Dauer von 10 Sekunden sowie die Optionen `size`, `aspectRatio`, `resolution`, `audio` und `watermark` auf Provider-Ebene.
- `pdfModel`: akzeptiert entweder eine Zeichenfolge (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird vom Tool `pdf` für das Modell-Routing verwendet.
  - Wenn der Wert weggelassen wird, greift das PDF-Tool zunächst auf `imageModel` und anschließend auf das aufgelöste Sitzungs- bzw. Standardmodell zurück.
- `pdfMaxBytesMb`: standardmäßige PDF-Größenbeschränkung für das Tool `pdf`, wenn beim Aufruf kein `maxBytesMb` übergeben wird.
- `pdfMaxPages`: standardmäßige maximale Seitenzahl, die im Extraktions-Fallback-Modus des Tools `pdf` berücksichtigt wird.
- `verboseDefault`: standardmäßige Ausführlichkeitsstufe für Agenten. Werte: `"off"`, `"on"`, `"full"`. Standard: `"off"`.
- `toolProgressDetail`: Detailmodus für Tool-Zusammenfassungen von `/verbose` und Tool-Zeilen in Fortschrittsentwürfen. Werte: `"explain"` (Standard, kompakte menschenlesbare Bezeichnungen) oder `"raw"` (fügt den unverarbeiteten Befehl bzw. Details an, sofern verfügbar). Das agentenspezifische `agents.list[].toolProgressDetail` überschreibt diesen Standard.
- `reasoningDefault`: standardmäßige Sichtbarkeit der Schlussfolgerungen für Agenten. Werte: `"off"`, `"on"`, `"stream"`. Das agentenspezifische `agents.list[].reasoningDefault` überschreibt diesen Standard. Konfigurierte Standardwerte für Schlussfolgerungen werden nur für Eigentümer, autorisierte Absender oder Gateway-Kontexte von Operator-Administratoren angewendet, wenn keine nachrichten- oder sitzungsspezifische Überschreibung der Schlussfolgerungen festgelegt ist.
- `elevatedDefault`: standardmäßige Stufe für Ausgaben mit erhöhten Berechtigungen für Agenten. Werte: `"off"`, `"on"`, `"ask"`, `"full"`. Standard: `"on"`.
- `model.primary`: Format `provider/model` (z. B. `openai/gpt-5.6-sol` für den Zugriff über Codex OAuth). Wenn Sie den Provider weglassen, versucht OpenClaw zunächst einen Alias, dann eine eindeutige Übereinstimmung mit einem konfigurierten Provider für genau diese Modell-ID und greift erst danach auf den konfigurierten Standard-Provider zurück (veraltetes Kompatibilitätsverhalten; bevorzugen Sie daher ein explizites `provider/model`). Wenn dieser Provider das konfigurierte Standardmodell nicht mehr bereitstellt, greift OpenClaw auf den ersten konfigurierten Provider bzw. das erste konfigurierte Modell zurück, anstatt einen veralteten Standard eines entfernten Providers als Fehler auszugeben.
- `models`: der konfigurierte Modellkatalog und die Zulassungsliste für `/model`. Jeder Eintrag kann `alias` (Kurzbezeichnung) und `params` (Provider-spezifisch, beispielsweise `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, OpenRouter-`provider`-Routing, `chat_template_kwargs`, `extra_body`/`extraBody`) enthalten.
  - Verwenden Sie `provider/*`-Einträge wie `"openai/*": {}` oder `"vllm/*": {}`, um alle erkannten Modelle für ausgewählte Provider anzuzeigen, ohne jede Modell-ID manuell aufzulisten.
  - Fügen Sie einem `provider/*`-Eintrag `agentRuntime` hinzu, wenn jedes dynamisch erkannte Modell dieses Providers dieselbe Laufzeit verwenden soll. Eine exakte `provider/model`-Laufzeitrichtlinie hat weiterhin Vorrang vor dem Platzhalter.
  - Sichere Änderungen: Verwenden Sie `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, um Einträge hinzuzufügen. `config set` verweigert Ersetzungen, durch die vorhandene Einträge der Zulassungsliste entfernt würden, sofern Sie nicht `--replace` übergeben.
  - Provider-spezifische Konfigurations- und Onboarding-Abläufe führen die ausgewählten Provider-Modelle mit dieser Zuordnung zusammen und behalten bereits konfigurierte, nicht betroffene Provider bei.
  - Für direkte OpenAI-Responses-Modelle wird die serverseitige Compaction automatisch aktiviert. Verwenden Sie `params.responsesServerCompaction: false`, um das Einfügen von `context_management` zu unterbinden, oder `params.responsesCompactThreshold`, um den Schwellenwert zu überschreiben. Siehe [serverseitige OpenAI-Compaction](/de/providers/openai#advanced-configuration).
- `params`: globale Standardparameter des Providers, die auf alle Modelle angewendet werden. Festzulegen unter `agents.defaults.params` (z. B. `{ cacheRetention: "long" }`).
- `params`-Zusammenführungsrangfolge (Konfiguration): `agents.defaults.params` (globale Basis) wird durch `agents.defaults.models["provider/model"].params` (pro Modell) überschrieben; anschließend überschreibt `agents.list[].params` (übereinstimmende Agenten-ID) schlüsselweise. Weitere Informationen finden Sie unter [Prompt-Caching](/de/reference/prompt-caching).
- `models.providers.openrouter.params.provider`: OpenRouter-weit geltende Standardrichtlinie für das Provider-Routing. OpenClaw leitet sie an das `provider`-Objekt der OpenRouter-Anfrage weiter; `agents.defaults.models["openrouter/<model>"].params.provider` pro Modell und Agentenparameter überschreiben sie schlüsselweise. Siehe [OpenRouter-Provider-Routing](/de/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: erweitertes unverändert durchgereichtes JSON, das mit `api: "openai-completions"`-Anfragekörpern für OpenAI-kompatible Proxys zusammengeführt wird. Bei einer Kollision mit generierten Anfrageschlüsseln hat der zusätzliche Anfragekörper Vorrang; nicht native Completions-Routen entfernen anschließend weiterhin das ausschließlich für OpenAI bestimmte `store`.
- `params.chat_template_kwargs`: vLLM-/OpenAI-kompatible Argumente für Chat-Vorlagen, die mit `api: "openai-completions"`-Anfragekörpern der obersten Ebene zusammengeführt werden. Bei `vllm/nemotron-3-*` mit deaktiviertem Denken sendet das gebündelte vLLM-Plugin automatisch `enable_thinking: false` und `force_nonempty_content: true`; explizite `chat_template_kwargs` überschreiben generierte Standardwerte, und `extra_body.chat_template_kwargs` hat weiterhin endgültigen Vorrang. Konfigurierte vLLM-Denkmodelle von Qwen und Nemotron bieten binäre `/think`-Auswahlmöglichkeiten (`off`, `on`) anstelle der mehrstufigen Aufwandsstaffel.
- `compat.thinkingFormat`: Nutzdatenformat für OpenAI-kompatibles Denken. Verwenden Sie `"together"` für `reasoning.enabled` im Together-Stil, `"qwen"` für `enable_thinking` auf oberster Ebene im Qwen-Stil oder `"qwen-chat-template"` für `chat_template_kwargs.enable_thinking` auf Backends der Qwen-Familie, die Chat-Vorlagen-Schlüsselwortargumente auf Anfrageebene unterstützen, beispielsweise vLLM. OpenClaw ordnet deaktiviertes Denken `false` und aktiviertes Denken `true` zu; konfigurierte vLLM-Qwen-Modelle bieten für diese Formate binäre `/think`-Auswahlmöglichkeiten.
- `compat.supportedReasoningEfforts`: Liste OpenAI-kompatibler Schlussfolgerungsaufwände pro Modell. Nehmen Sie `"xhigh"` für benutzerdefinierte Endpunkte auf, die diesen Wert tatsächlich akzeptieren; OpenClaw stellt dann `/think xhigh` in Befehlsmenüs, Gateway-Sitzungszeilen, der Validierung von Sitzungs-Patches, der Agenten-CLI-Validierung und der `llm-task`-Validierung für diesen konfigurierten Provider bzw. dieses konfigurierte Modell bereit. Verwenden Sie `compat.reasoningEffortMap`, wenn das Backend für eine kanonische Stufe einen Provider-spezifischen Wert erwartet.
- `params.preserveThinking`: ausschließlich für Z.AI vorgesehene optionale Aktivierung des beibehaltenen Denkens. Wenn sie aktiviert und das Denken eingeschaltet ist, sendet OpenClaw `thinking.clear_thinking: false` und spielt vorherige `reasoning_content` erneut ein; siehe [Z.AI-Denken und beibehaltenes Denken](/de/providers/zai#advanced-configuration).
- `localService`: optionaler Prozessmanager auf Provider-Ebene für lokale bzw. selbst gehostete Modellserver. Wenn das ausgewählte Modell zu diesem Provider gehört, prüft OpenClaw `healthUrl` (oder `baseUrl + "/models"`), startet bei nicht erreichbarem Endpunkt `command` mit `args`, wartet bis zu `readyTimeoutMs` und sendet anschließend die Modellanfrage. `command` muss ein absoluter Pfad sein. `idleStopMs: 0` hält den Prozess bis zum Beenden von OpenClaw aktiv; ein positiver Wert beendet den von OpenClaw gestarteten Prozess nach der entsprechenden Anzahl inaktiver Millisekunden. Siehe [Lokale Modelldienste](/de/gateway/local-model-services).
- Laufzeitrichtlinien gehören zu Providern oder Modellen, nicht zu `agents.defaults`. Verwenden Sie `models.providers.<provider>.agentRuntime` für providerweite Regeln oder `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` für modellspezifische Regeln. Ein Provider-/Modellpräfix allein wählt niemals ein Harness aus. Wenn die Laufzeit nicht festgelegt oder auf `auto` gesetzt ist, darf OpenAI Codex nur für eine exakt übereinstimmende offizielle HTTPS-Route für Platform Responses oder ChatGPT Responses ohne vom Autor festgelegte Anforderungsüberschreibung implizit auswählen. Siehe [Implizite Agent-Laufzeit von OpenAI](/de/providers/openai#implicit-agent-runtime).
- Konfigurationsprogramme, die diese Felder ändern (zum Beispiel `/models set`, `/models set-image` und Befehle zum Hinzufügen/Entfernen von Fallbacks), speichern die kanonische Objektform und behalten vorhandene Fallback-Listen nach Möglichkeit bei.
- `maxConcurrent`: maximale Anzahl paralleler Agent-Ausführungen über mehrere Sitzungen hinweg (jede Sitzung wird weiterhin serialisiert). Standard: `4`.

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
      model: "openai/gpt-5.6-sol",
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

- `id`: `"auto"`, `"openclaw"`, die ID eines registrierten Plugin-Harness oder ein unterstützter CLI-Backend-Alias. Das mitgelieferte Codex-Plugin registriert `codex`; das mitgelieferte Anthropic-Plugin stellt das CLI-Backend `claude-cli` bereit.
- `id: "auto"` ermöglicht registrierten Plugin-Harnesses, effektive Routen zu übernehmen, die ihren Unterstützungsvertrag deklarieren oder anderweitig erfüllen, und verwendet OpenClaw, wenn kein Harness übereinstimmt. Eine explizite Plugin-Laufzeit wie `id: "codex"` erfordert dieses Harness und eine kompatible effektive Route; sie schlägt sicher geschlossen fehl, wenn eines von beiden nicht verfügbar ist oder die Ausführung fehlschlägt.
- `id: "pi"` wird nur als veralteter Alias für `openclaw` akzeptiert, um ausgelieferte Konfigurationen aus v2026.5.22 und früher beizubehalten. Neue Konfigurationen sollten `openclaw` verwenden.
- Bei der Laufzeitpriorität gilt zuerst die Richtlinie für das exakte Modell (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` oder `models.providers.<provider>.models[]`), danach `agents.list[]` / `agents.defaults.models["provider/*"]` und anschließend die Provider-weite Richtlinie unter `models.providers.<provider>.agentRuntime`.
- Laufzeitschlüssel für den gesamten Agenten sind veraltet. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, Laufzeit-Pins für Sitzungen und `OPENCLAW_AGENT_RUNTIME` werden bei der Laufzeitauswahl ignoriert. Führen Sie `openclaw doctor --fix` aus, um veraltete Werte zu entfernen.
- Geeignete exakte offizielle HTTPS-Routen für OpenAI Responses/ChatGPT ohne benutzerdefinierte Anfrageüberschreibung können das Codex-Harness implizit verwenden. Provider-/Modell-`agentRuntime.id: "codex"` macht Codex zu einer Anforderung, die sicher geschlossen fehlschlägt, macht jedoch keine inkompatible Route kompatibel.
- Für Claude-CLI-Bereitstellungen werden `model: "anthropic/claude-opus-4-8"` und modellbezogenes `agentRuntime.id: "claude-cli"` empfohlen. Veraltete `claude-cli/<model>`-Referenzen funktionieren aus Kompatibilitätsgründen weiterhin, neue Konfigurationen sollten jedoch die Provider-/Modellauswahl kanonisch halten und das Ausführungs-Backend in der Provider-/Modell-Laufzeitrichtlinie angeben.
- Dies steuert ausschließlich die Ausführung textbasierter Agentendurchläufe. Mediengenerierung, Bildverarbeitung, PDF, Musik, Video und TTS verwenden weiterhin ihre jeweiligen Provider-/Modelleinstellungen.

**Integrierte Alias-Kurzformen** (gelten nur, wenn sich das Modell in `agents.defaults.models` befindet):

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

Ihre konfigurierten Aliase haben stets Vorrang vor den Standardwerten.

Z.AI-GLM-4.x-Modelle aktivieren automatisch den Denkmodus, sofern Sie nicht `--thinking off` festlegen oder `agents.defaults.models["zai/<model>"].params.thinking` selbst definieren.
Z.AI-Modelle aktivieren standardmäßig `tool_stream` für das Streaming von Tool-Aufrufen. Setzen Sie `agents.defaults.models["zai/<model>"].params.tool_stream` auf `false`, um dies zu deaktivieren.
Bei Anthropic Claude Opus 4.8 bleibt das Denken in OpenClaw standardmäßig deaktiviert; wenn adaptives Denken explizit aktiviert wird, lautet der Provider-eigene Standardwert für den Aufwand von Anthropic `high`. Claude-4.6-Modelle verwenden standardmäßig `adaptive`, wenn keine explizite Denkstufe festgelegt ist.

### `agents.defaults.cliBackends`

Optionale CLI-Backends für rein textbasierte Ausweichläufe (keine Tool-Aufrufe). Nützlich als Absicherung, wenn API-Provider ausfallen.

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
          // Alternativ systemPromptFileArg verwenden, wenn die CLI ein Flag für eine Prompt-Datei akzeptiert.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI-Backends sind primär textbasiert; Tools sind immer deaktiviert.
- Sitzungen werden unterstützt, wenn `sessionArg` festgelegt ist.
- Die Bilddurchleitung wird unterstützt, wenn `imageArg` Dateipfade akzeptiert.
- `reseedFromRawTranscriptWhenUncompacted: true` ermöglicht einem Backend, sicher
  ungültig gewordene Sitzungen aus einem begrenzten Rohabschnitt am Ende eines OpenClaw-Transkripts
  wiederherzustellen, bevor die erste Compaction-Zusammenfassung vorhanden ist. Änderungen am
  Authentifizierungsprofil oder an der Anmeldedatenepoche führen weiterhin niemals zu einer erneuten Rohinitialisierung.

### `agents.defaults.promptOverlays`

Provider-unabhängige Prompt-Overlays, die nach Modellfamilie auf von OpenClaw zusammengestellte Prompt-Oberflächen angewendet werden. Modell-IDs der GPT-5-Familie erhalten den gemeinsamen Verhaltensvertrag über OpenClaw-/Provider-Routen hinweg; `personality` steuert ausschließlich die freundliche Interaktionsstilebene. Native Codex-App-Server-Routen behalten die Codex-eigenen Basis-/Modellanweisungen anstelle dieses OpenClaw-GPT-5-Overlays bei, und OpenClaw deaktiviert die integrierte Codex-Persönlichkeit für native Threads.

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

- `"friendly"` (Standard) und `"on"` aktivieren die freundliche Interaktionsstilebene.
- `"off"` deaktiviert ausschließlich die freundliche Ebene; der markierte GPT-5-Verhaltensvertrag bleibt aktiviert.
- Das veraltete `plugins.entries.openai.config.personality` wird weiterhin gelesen, wenn diese gemeinsame Einstellung nicht festgelegt ist.

### `agents.defaults.heartbeat`

Regelmäßige Heartbeat-Läufe.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m deaktiviert
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // Standard: true; false lässt den Heartbeat-Abschnitt im System-Prompt aus
        lightContext: false, // Standard: false; true behält aus den Workspace-Bootstrap-Dateien nur HEARTBEAT.md bei
        isolatedSession: false, // Standard: false; true führt jeden Heartbeat in einer neuen Sitzung aus (ohne Gesprächsverlauf)
        skipWhenBusy: false, // Standard: false; true wartet zusätzlich auf Subagent-/verschachtelte Ausführungsspuren dieses Agenten
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (Standard) | block
        target: "none", // Standard: none | Optionen: last | whatsapp | telegram | discord | ...
        prompt: "Lesen Sie HEARTBEAT.md, falls die Datei vorhanden ist...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: Zeitdauerzeichenfolge (ms/s/m/h). Standard: `30m` (API-Schlüssel-Authentifizierung) oder `1h` (OAuth-Authentifizierung). Zum Deaktivieren auf `0m` setzen.
- `includeSystemPromptSection`: Wenn false, wird der Heartbeat-Abschnitt im System-Prompt ausgelassen und die Injektion von `HEARTBEAT.md` in den Bootstrap-Kontext übersprungen. Standard: `true`.
- `suppressToolErrorWarnings`: Wenn true, werden während Heartbeat-Läufen Nutzdaten mit Tool-Fehlerwarnungen unterdrückt.
- `timeoutSeconds`: maximal zulässige Dauer eines Heartbeat-Agentendurchlaufs in Sekunden, bevor er abgebrochen wird. Nicht festlegen, um `agents.defaults.timeoutSeconds` zu verwenden, sofern dieser Wert gesetzt ist; andernfalls gilt der auf 600 Sekunden begrenzte Heartbeat-Takt.
- `directPolicy`: Zustellrichtlinie für direkte Nachrichten/DMs. `allow` (Standard) erlaubt die Zustellung an direkte Ziele. `block` unterdrückt die Zustellung an direkte Ziele und gibt `reason=dm-blocked` aus.
- `lightContext`: Wenn true, verwenden Heartbeat-Läufe einen leichtgewichtigen Bootstrap-Kontext und behalten aus den Workspace-Bootstrap-Dateien nur `HEARTBEAT.md` bei.
- `isolatedSession`: Wenn true, wird jeder Heartbeat in einer neuen Sitzung ohne vorherigen Gesprächsverlauf ausgeführt. Dasselbe Isolationsmuster wie bei Cron `sessionTarget: "isolated"`. Reduziert die Token-Kosten pro Heartbeat von ~100K auf ~2-5K Token.
- `skipWhenBusy`: Wenn true, werden Heartbeat-Läufe bei zusätzlichen belegten Ausführungsspuren dieses Agenten zurückgestellt: bei seiner eigenen sitzungsschlüsselgebundenen Subagentenarbeit oder verschachtelten Befehlsarbeit. Cron-Ausführungsspuren stellen Heartbeats immer zurück, auch ohne dieses Flag.
- Pro Agent: `agents.list[].heartbeat` festlegen. Wenn ein Agent `heartbeat` definiert, führen **nur diese Agenten** Heartbeats aus.
- Heartbeats führen vollständige Agentendurchläufe aus — kürzere Intervalle verbrauchen mehr Token.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // ID eines registrierten Compaction-Provider-Plugins (optional)
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        recentTurnsPreserve: 3,
        maxHistoryShare: 0.7,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Bewahren Sie Bereitstellungs-IDs, Ticket-IDs und Host:Port-Paare exakt bei.", // wird verwendet, wenn identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optionale Auslastungsprüfung der Tool-Schleife
        postIndexSync: "async", // off | async | await
        postCompactionSections: ["Session Startup", "Red Lines"], // AGENTS.md-Abschnitte explizit für die erneute Injektion auswählen
        model: "openrouter/anthropic/claude-sonnet-4-6", // optionale Modellüberschreibung ausschließlich für Compaction
        truncateAfterCompaction: true, // nach der Compaction zu einer kleineren nachfolgenden JSONL-Datei rotieren
        maxActiveTranscriptBytes: "20mb", // optionaler Auslöser für lokale Compaction bei der Vorabprüfung
        notifyUser: true, // Benachrichtigungen beim Start/Abschluss der Compaction und bei Beeinträchtigungen der Speicherleerung (Standard: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // optionale Modellüberschreibung ausschließlich für die Speicherleerung
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
          systemPrompt: "Die Sitzung nähert sich der Compaction. Speichern Sie jetzt dauerhafte Erinnerungen.",
          prompt: "Schreiben Sie alle dauerhaften Notizen in memory/YYYY-MM-DD.md; antworten Sie mit dem exakten stillen Token NO_REPLY, wenn nichts zu speichern ist.",
        },
      },
    },
  },
}
```

- `mode`: `default` oder `safeguard` (abschnittsweise Zusammenfassung für lange Verläufe). Siehe [Compaction](/de/concepts/compaction).
- `provider`: ID eines registrierten Compaction-Provider-Plugins. Wenn festgelegt, wird `summarize()` des Providers anstelle der integrierten LLM-Zusammenfassung aufgerufen. Bei einem Fehler wird auf die integrierte Funktion zurückgegriffen. Durch Festlegen eines Providers wird `mode: "safeguard"` erzwungen. Siehe [Compaction](/de/concepts/compaction).
- `timeoutSeconds`: maximal zulässige Anzahl von Sekunden für einen einzelnen Compaction-Vorgang, bevor OpenClaw ihn abbricht. Standard: `180`.
- `reserveTokens`: Token-Reserve, die nach der Compaction für die Modellausgabe und zukünftige Tool-Ergebnisse verfügbar bleibt. Wenn das Kontextfenster des Modells bekannt ist, begrenzt OpenClaw die effektive Reserve, sodass sie das Prompt-Budget nicht aufbrauchen kann.
- `reserveTokensFloor`: vom eingebetteten Runtime erzwungene Mindestreserve. Legen Sie `0` fest, um die Untergrenze zu deaktivieren. Die Untergrenze unterliegt weiterhin der aktiven Begrenzung des Kontextfensters.
- `keepRecentTokens`: Budget für den Schnittpunkt des Agenten, um das jüngste Ende des Transkripts wortgetreu beizubehalten. Manuelles `/compact` berücksichtigt dies, wenn es explizit festgelegt ist; andernfalls ist die manuelle Compaction ein fester Prüfpunkt.
- `recentTurnsPreserve`: Anzahl der jüngsten Benutzer-/Assistentenwechsel, die außerhalb der Schutzmechanismus-Zusammenfassung wortgetreu beibehalten werden. Standard: `3`.
- `maxHistoryShare`: maximaler Anteil des gesamten Kontextbudgets, der nach der Compaction für den beibehaltenen Verlauf zulässig ist (Bereich `0.1`-`0.9`).
- `identifierPolicy`: `strict` (Standard), `off` oder `custom`. `strict` stellt bei der Compaction-Zusammenfassung integrierte Anweisungen zur Beibehaltung nicht transparenter Bezeichner voran.
- `identifierInstructions`: optionaler benutzerdefinierter Text zur Beibehaltung von Bezeichnern, der verwendet wird, wenn `identifierPolicy=custom`.
- `qualityGuard`: Prüfungen mit Wiederholungsversuch bei fehlerhaft formatierter Ausgabe für Schutzmechanismus-Zusammenfassungen. Im Schutzmechanismus-Modus standardmäßig aktiviert; legen Sie `enabled: false` fest, um die Prüfung zu überspringen.
- `midTurnPrecheck`: optionale Prüfung des Tool-Schleifendrucks. Wenn `enabled: true`, prüft OpenClaw den Kontextdruck, nachdem Tool-Ergebnisse angehängt wurden und bevor das Modell erneut aufgerufen wird. Wenn der Kontext nicht mehr passt, bricht es den aktuellen Versuch vor dem Senden des Prompts ab und verwendet den bestehenden Wiederherstellungspfad der Vorabprüfung erneut, um Tool-Ergebnisse zu kürzen oder eine Compaction durchzuführen und den Versuch zu wiederholen. Funktioniert sowohl mit dem Compaction-Modus `default` als auch mit `safeguard`. Standard: deaktiviert.
- `postIndexSync`: Modus zur Neuindizierung des Sitzungsspeichers nach der Compaction. Standard: `"async"`. Verwenden Sie `"await"` für höchste Aktualität, `"async"` für geringere Compaction-Latenz oder `"off"` nur, wenn die Synchronisierung des Sitzungsspeichers anderweitig erfolgt.
- `postCompactionSections`: optionale Namen von H2-/H3-Abschnitten in AGENTS.md, die nach der Compaction erneut eingefügt werden sollen. Das erneute Einfügen ist deaktiviert, wenn die Einstellung nicht gesetzt oder auf `[]` gesetzt ist. Durch explizites Festlegen von `["Session Startup", "Red Lines"]` wird dieses Paar aktiviert und der bisherige Fallback `Every Session`/`Safety` beibehalten. Aktivieren Sie dies nur, wenn der zusätzliche Kontext das Risiko wert ist, Projektanweisungen zu duplizieren, die bereits in der Compaction-Zusammenfassung enthalten sind.
- `model`: optionales `provider/model-id` oder einfacher Alias aus `agents.defaults.models` ausschließlich für die Compaction-Zusammenfassung. Einfache Aliasse werden vor der Weiterleitung aufgelöst; konfigurierte wörtliche Modell-IDs haben bei Kollisionen Vorrang. Verwenden Sie dies, wenn die Hauptsitzung ein Modell beibehalten, Compaction-Zusammenfassungen jedoch auf einem anderen Modell ausgeführt werden sollen; wenn nicht festgelegt, verwendet die Compaction das primäre Modell der Sitzung.
- `truncateAfterCompaction`: rotiert das aktive Sitzungstranskript nach der Compaction, sodass zukünftige Wechsel nur die Zusammenfassung und das nicht zusammengefasste Ende laden, während das vorherige vollständige Transkript archiviert bleibt. Verhindert ein unbegrenztes Wachstum des aktiven Transkripts in lang laufenden Sitzungen. Standard: `false`.
- `maxActiveTranscriptBytes`: optionaler Schwellenwert in Byte (`number` oder Zeichenfolgen wie `"20mb"`), der vor einem Lauf eine normale lokale Compaction auslöst, wenn der Transkriptverlauf den Schwellenwert überschreitet. Erfordert `truncateAfterCompaction`, damit eine erfolgreiche Compaction zu einem kleineren Folgetranskript rotieren kann. Deaktiviert, wenn nicht festgelegt oder auf `0` gesetzt.
- `notifyUser`: wenn `true`, werden kurze Hinweise zur Kontextpflege an den Benutzer gesendet: wenn die Compaction beginnt und abgeschlossen ist (zum Beispiel „Kontext wird komprimiert ...“ und „Compaction abgeschlossen“), sowie wenn eine Speicherleerung vor der Compaction ausgeschöpft ist und die Antwort daher in einem beeinträchtigten Zustand fortgesetzt wird (zum Beispiel „Die Speicherpflege ist vorübergehend fehlgeschlagen; Ihre Antwort wird fortgesetzt.“). Standardmäßig deaktiviert, damit diese Hinweise nicht angezeigt werden.
- `memoryFlush`: stiller agentischer Wechsel vor der automatischen Compaction zum Speichern dauerhafter Erinnerungen. Legen Sie `model` auf einen exakten Provider/ein exaktes Modell wie `ollama/qwen3:8b` fest, wenn dieser Wartungswechsel auf einem lokalen Modell verbleiben soll; die Überschreibung übernimmt nicht die aktive Fallback-Kette der Sitzung. `forceFlushTranscriptBytes` erzwingt die Leerung, wenn die Transkriptgröße den Schwellenwert erreicht, selbst wenn die Token-Zähler veraltet sind. Wird übersprungen, wenn der Arbeitsbereich schreibgeschützt ist.

### `agents.defaults.runRetries`

Grenzen für Wiederholungsiterationen der äußeren Ausführungsschleife des eingebetteten Agent-Runtime, um Endlosschleifen bei der Fehlerbehebung zu verhindern. Diese Einstellung gilt nur für den eingebetteten Agent-Runtime, nicht für ACP- oder CLI-Runtimes.

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
        runRetries: { max: 50 }, // optionale Überschreibungen pro Agent
      },
    ],
  },
}
```

- `base`: Basisanzahl der Wiederholungsiterationen für die äußere Ausführungsschleife. Standard: `24`.
- `perProfile`: zusätzliche Wiederholungsiterationen, die pro Kandidat für ein Fallback-Profil gewährt werden. Standard: `8`.
- `min`: absolute Mindestgrenze für Wiederholungsiterationen. Standard: `32`.
- `max`: absolute Höchstgrenze für Wiederholungsiterationen, um eine außer Kontrolle geratene Ausführung zu verhindern. Standard: `160`.

### `agents.defaults.contextPruning`

Entfernt **alte Tool-Ergebnisse** aus dem In-Memory-Kontext, bevor dieser an das LLM gesendet wird. Ändert den Sitzungsverlauf auf dem Datenträger **nicht**. Standardmäßig deaktiviert; legen Sie zum Aktivieren `mode: "cache-ttl"` fest.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off (Standard) | cache-ttl
        ttl: "1h", // Dauer (ms/s/m/h), Standardeinheit: Minuten; Standard: 5m
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Inhalt des alten Tool-Ergebnisses gelöscht]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Verhalten des cache-ttl-Modus">

- `mode: "cache-ttl"` aktiviert Bereinigungsdurchläufe.
- `ttl` steuert, wie häufig die Bereinigung erneut ausgeführt werden kann (nach dem letzten Cache-Zugriff). Standard: `5m`.
- Bei der Bereinigung werden übergroße Tool-Ergebnisse zunächst sanft gekürzt und anschließend bei Bedarf ältere Tool-Ergebnisse vollständig gelöscht.
- `softTrimRatio` und `hardClearRatio` akzeptieren Werte von `0.0` bis `1.0`; die Konfigurationsvalidierung lehnt Werte außerhalb dieses Bereichs ab.

**Sanftes Kürzen** behält Anfang und Ende bei und fügt `...` in der Mitte ein.

**Vollständiges Löschen** ersetzt das gesamte Tool-Ergebnis durch den Platzhalter.

Hinweise:

- Bildblöcke werden niemals gekürzt oder gelöscht.
- Verhältnisse basieren auf Zeichen (Näherungswerte), nicht auf exakten Token-Anzahlen.
- Wenn weniger als `keepLastAssistants` Assistentennachrichten vorhanden sind, wird die Bereinigung übersprungen.

</Accordion>

Verhaltensdetails finden Sie unter [Sitzungsbereinigung](/de/concepts/session-pruning).

### Block-Streaming

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200, breakPreference: "paragraph" },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off (Standard) | natural | custom (minMs/maxMs verwenden)
    },
  },
}
```

- Kanäle außer Telegram erfordern explizit `*.streaming.block.enabled: true`, um Blockantworten zu aktivieren. QQ Bot ist die Ausnahme: Es verfügt über keine `streaming.block`-Schlüssel und streamt Blockantworten, sofern `channels.qqbot.streaming.mode` nicht `"off"` ist.
- Kanalspezifische Überschreibungen: `channels.<channel>.streaming.block.coalesce` (und Varianten pro Konto). Discord, Google Chat, Mattermost, MS Teams, Signal und Slack verwenden standardmäßig `minChars: 1500` / `idleMs: 1000`.
- `blockStreamingChunk.breakPreference`: bevorzugte Abschnittsgrenze (`"paragraph" | "newline" | "sentence"`).
- `humanDelay`: zufällige Pause zwischen Blockantworten. Standard: `off`. `natural` = 800-2500ms. `custom` verwendet `minMs`/`maxMs` (für jede nicht festgelegte Grenze wird auf den natürlichen Bereich zurückgegriffen). Überschreibung pro Agent: `agents.list[].humanDelay`.

Details zum Verhalten und zur Abschnittsbildung finden Sie unter [Streaming](/de/concepts/streaming).

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

- Standardwerte: `instant` für direkte Chats/Erwähnungen, `message` für Gruppenchats ohne Erwähnung.
- Standardwert für `typingIntervalSeconds`: `6`.
- Überschreibungen pro Sitzung: `session.typingMode`, `session.typingIntervalSeconds`.

Siehe [Tippindikatoren](/de/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Optionale Sandbox-Isolierung für den eingebetteten Agenten. Den vollständigen Leitfaden finden Sie unter [Sandbox-Isolierung](/de/gateway/sandboxing).

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off (default) | non-main | all
        backend: "docker", // docker (default) | ssh | openshell
        scope: "agent", // session | agent (default) | shared
        workspaceAccess: "none", // none (default) | ro | rw
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
          gpus: "all",
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

Die oben gezeigten Standardwerte (`off`/`docker`/`agent`/`none`/`bookworm-slim`-Image/`none`-Netzwerk usw.) sind die tatsächlichen OpenClaw-Standardwerte und nicht nur Beispielwerte.

<Accordion title="Sandbox-Details">

**Backend:**

- `docker`: lokale Docker-Laufzeit (Standard)
- `ssh`: generische SSH-gestützte Remote-Laufzeit
- `openshell`: OpenShell-Laufzeit

Wenn `backend: "openshell"` ausgewählt ist, werden laufzeitspezifische Einstellungen nach
`plugins.entries.openshell.config` verschoben.

**SSH-Backend-Konfiguration:**

- `target`: SSH-Ziel im Format `user@host[:port]`
- `command`: SSH-Client-Befehl (Standard: `ssh`)
- `workspaceRoot`: absoluter Remote-Stammpfad für Arbeitsbereiche je Geltungsbereich (Standard: `/tmp/openclaw-sandboxes`)
- `identityFile` / `certificateFile` / `knownHostsFile`: vorhandene lokale Dateien, die an OpenSSH übergeben werden
- `identityData` / `certificateData` / `knownHostsData`: Inline-Inhalte oder SecretRefs, die OpenClaw zur Laufzeit als temporäre Dateien bereitstellt
- `strictHostKeyChecking` / `updateHostKeys`: Optionen für die OpenSSH-Hostschlüsselrichtlinie (beide standardmäßig `true`)

**SSH-Authentifizierungsrangfolge:**

- `identityData` hat Vorrang vor `identityFile`
- `certificateData` hat Vorrang vor `certificateFile`
- `knownHostsData` hat Vorrang vor `knownHostsFile`
- Durch SecretRef bereitgestellte `*Data`-Werte werden aus dem aktiven Laufzeit-Snapshot der Secrets aufgelöst, bevor die Sandbox-Sitzung startet

**Verhalten des SSH-Backends:**

- initialisiert den Remote-Arbeitsbereich einmal nach der Erstellung oder Neuerstellung
- behält anschließend den Remote-SSH-Arbeitsbereich als maßgeblich bei
- leitet `exec`, Dateiwerkzeuge und Medienpfade über SSH
- synchronisiert Remote-Änderungen nicht automatisch zurück zum Host
- unterstützt keine Sandbox-Browser-Container

**Arbeitsbereichszugriff:**

- `none`: Sandbox-Arbeitsbereich je Geltungsbereich unter `~/.openclaw/sandboxes` (Standard)
- `ro`: Sandbox-Arbeitsbereich unter `/workspace`, Agent-Arbeitsbereich schreibgeschützt unter `/agent` eingebunden
- `rw`: Agent-Arbeitsbereich mit Lese- und Schreibzugriff unter `/workspace` eingebunden

**Geltungsbereich:**

- `session`: Container und Arbeitsbereich je Sitzung
- `agent`: ein Container und Arbeitsbereich je Agent (Standard)
- `shared`: gemeinsam genutzter Container und Arbeitsbereich (keine sitzungsübergreifende Isolation)

**OpenShell-Plugin-Konfiguration:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror (default) | remote
          command: "openshell",
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

- `mirror`: Remote-Arbeitsbereich vor der Ausführung aus dem lokalen Arbeitsbereich initialisieren und nach der Ausführung zurücksynchronisieren; der lokale Arbeitsbereich bleibt maßgeblich
- `remote`: Remote-Arbeitsbereich einmal bei der Erstellung der Sandbox initialisieren und anschließend als maßgeblich beibehalten

Im Modus `remote` werden außerhalb von OpenClaw vorgenommene lokale Host-Änderungen nach dem Initialisierungsschritt nicht automatisch in die Sandbox synchronisiert.
Der Transport erfolgt per SSH in die OpenShell-Sandbox, das Plugin verwaltet jedoch den Lebenszyklus der Sandbox und die optionale Spiegelsynchronisierung.

**`setupCommand`** wird einmal nach der Containererstellung ausgeführt (über `sh -lc`). Erfordert ausgehenden Netzwerkzugriff, ein beschreibbares Stammdateisystem und den Root-Benutzer.

**Container verwenden standardmäßig `network: "none"`** — setzen Sie dies auf `"bridge"` (oder ein benutzerdefiniertes Bridge-Netzwerk), wenn der Agent ausgehenden Zugriff benötigt.
`"host"` ist gesperrt. `"container:<id>"` ist standardmäßig gesperrt, sofern Sie nicht ausdrücklich
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` festlegen (Notfalloption).
Codex-App-Server-Ausführungen in einer aktiven OpenClaw-Sandbox verwenden dieselbe Einstellung für ausgehenden Zugriff beim nativen Netzwerkzugriff im Code-Modus.

**Eingehende Anhänge** werden unter `media/inbound/*` im aktiven Arbeitsbereich bereitgestellt.

**`docker.binds`** bindet zusätzliche Hostverzeichnisse ein; globale und agentspezifische Bind-Mounts werden zusammengeführt.

**Sandbox-Browser** (`sandbox.browser.enabled`, Standard `false`): Chromium und CDP in einem Container. Die noVNC-URL wird in den System-Prompt eingefügt. Erfordert `browser.enabled` in `openclaw.json` nicht.
Der noVNC-Beobachterzugriff verwendet standardmäßig VNC-Authentifizierung, und OpenClaw erzeugt eine kurzlebige Token-URL, anstatt das Passwort in der freigegebenen URL offenzulegen.

- `allowHostControl: false` (Standard) verhindert, dass Sandbox-Sitzungen den Host-Browser ansprechen.
- `network` ist standardmäßig `openclaw-sandbox-browser` (dediziertes Bridge-Netzwerk). Setzen Sie dies nur dann auf `bridge`, wenn Sie ausdrücklich globale Bridge-Konnektivität wünschen. `"host"` ist auch hier gesperrt.
- `cdpSourceRange` beschränkt optional den eingehenden CDP-Zugriff am Containerrand auf einen CIDR-Bereich (zum Beispiel `172.21.0.1/32`).
- `sandbox.browser.binds` bindet zusätzliche Hostverzeichnisse ausschließlich in den Sandbox-Browser-Container ein. Wenn festgelegt (einschließlich `[]`), ersetzt es `docker.binds` für den Browser-Container.
- Chromium im Sandbox-Browser-Container wird immer mit `--no-sandbox --disable-setuid-sandbox` gestartet (Container verfügen nicht über die Kernel-Primitive, die Chromes eigene Sandbox benötigt); hierfür gibt es keine Konfigurationsoption.
- Die Startstandardwerte sind in `scripts/sandbox-browser-entrypoint.sh` definiert und für Container-Hosts optimiert:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--password-store=basic`
  - `--use-mock-keychain`
  - `--disable-3d-apis`, `--disable-gpu` und `--disable-software-rasterizer` sind
    standardmäßig aktiviert und können mit
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` deaktiviert werden, wenn die WebGL-/3D-Nutzung dies erfordert.
  - `--disable-extensions` (standardmäßig aktiviert); `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`
    aktiviert Erweiterungen erneut, wenn Ihr Arbeitsablauf davon abhängt.
  - standardmäßig `--renderer-process-limit=2`; ändern Sie dies mit
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, oder setzen Sie `0`, um Chromiums
    standardmäßige Prozessbegrenzung zu verwenden.
  - `--headless=new` nur, wenn `headless` aktiviert ist.
  - Die Standardwerte entsprechen der Basis des Container-Images; verwenden Sie ein benutzerdefiniertes Browser-Image mit einem benutzerdefinierten
    Einstiegspunkt, um die Container-Standardwerte zu ändern.

</Accordion>

Browser-Sandboxing und `sandbox.docker.binds` sind nur mit Docker verfügbar.

Images erstellen (aus einem Quellcode-Checkout):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Informationen zu npm-Installationen ohne Quellcode-Checkout finden Sie unter [Sandboxing § Images und Einrichtung](/de/gateway/sandboxing#images-and-setup) für Inline-Befehle vom Typ `docker build`.

### `agents.list` (agentspezifische Überschreibungen)

Verwenden Sie `agents.list[].tts`, um einem Agent einen eigenen TTS-Provider, eine eigene Stimme, ein eigenes Modell,
einen eigenen Stil oder einen eigenen automatischen TTS-Modus zuzuweisen. Der Agent-Block wird tief mit den globalen
`messages.tts` zusammengeführt, sodass gemeinsam genutzte Anmeldedaten an einer Stelle verbleiben können, während einzelne
Agents nur die benötigten Stimm- oder Provider-Felder überschreiben. Die Überschreibung des aktiven Agents
gilt für automatische gesprochene Antworten, `/tts audio`, `/tts status` und
das Agent-Werkzeug `tts`. Unter [Text-to-Speech](/de/tools/tts#per-agent-voice-overrides)
finden Sie Provider-Beispiele und die Rangfolge.

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
        utilityModel: "openai/gpt-5.4-mini",
        thinkingDefault: "high", // Überschreibung der Denkstufe pro Agent
        reasoningDefault: "on", // Überschreibung der Sichtbarkeit der Schlussfolgerungen pro Agent
        fastModeDefault: false, // Überschreibung des Schnellmodus pro Agent
        params: { cacheRetention: "none" }, // überschreibt passende defaults.models-Parameter anhand des Schlüssels
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // ersetzt agents.defaults.skills, wenn festgelegt
        identity: {
          name: "Samantha",
          theme: "hilfsbereites Faultier",
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
            mode: "persistent", // persistent | oneshot
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
- `default`: Wenn mehrere festgelegt sind, hat der erste Vorrang (Warnung wird protokolliert). Wenn keiner festgelegt ist, ist der erste Listeneintrag der Standard.
- `model`: Die Zeichenfolgenform legt ein striktes agentenspezifisches Primärmodell ohne Modell-Fallback fest; die Objektform `{ primary }` ist ebenfalls strikt, sofern Sie nicht `fallbacks` hinzufügen. Verwenden Sie `{ primary, fallbacks: [...] }`, um den Agent für Fallback zu aktivieren, oder `{ primary, fallbacks: [] }`, um das strikte Verhalten ausdrücklich festzulegen. Cron-Aufträge, die nur `primary` überschreiben, übernehmen weiterhin die standardmäßigen Fallbacks, sofern Sie nicht `fallbacks: []` festlegen.
- `utilityModel`: optionale agentenspezifische Überschreibung für kurze interne Aufgaben wie generierte Sitzungs- und Threadtitel. Fällt auf `agents.defaults.utilityModel`, dann auf das deklarierte Standard-Kleinmodell des primären Providers und anschließend auf das Primärmodell dieses Agents zurück. Eine leere Zeichenfolge deaktiviert das Utility-Routing für diesen Agent.
- `params`: agentenspezifische Stream-Parameter, die über den ausgewählten Modelleintrag in `agents.defaults.models` gelegt werden. Verwenden Sie dies für agentenspezifische Überschreibungen wie `cacheRetention`, `temperature` oder `maxTokens`, ohne den gesamten Modellkatalog zu duplizieren.
- `tts`: optionale agentenspezifische Überschreibungen für die Text-zu-Sprache-Ausgabe. Der Block wird tief mit `messages.tts` zusammengeführt. Bewahren Sie daher gemeinsam genutzte Provider-Anmeldedaten und die Fallback-Richtlinie in `messages.tts` auf und legen Sie hier nur personaspezifische Werte wie Provider, Stimme, Modell, Stil oder Automatikmodus fest.
- `skills`: optionale agentenspezifische Skills-Zulassungsliste. Wenn sie weggelassen wird, übernimmt der Agent `agents.defaults.skills`, sofern dies festgelegt ist; eine explizite Liste ersetzt die Standardwerte, anstatt sie zusammenzuführen, und `[]` bedeutet, dass keine Skills verfügbar sind.
- `thinkingDefault`: optionale agentenspezifische Standard-Denkstufe (`off | minimal | low | medium | high | xhigh | adaptive | max`). Überschreibt `agents.defaults.thinkingDefault` für diesen Agent, wenn keine nachrichten- oder sitzungsspezifische Überschreibung festgelegt ist. Das ausgewählte Provider-/Modellprofil bestimmt, welche Werte gültig sind; bei Google Gemini behält `adaptive` das vom Provider gesteuerte dynamische Denken bei (`thinkingLevel` wird bei Gemini 3/3.1 weggelassen, `thinkingBudget: -1` bei Gemini 2.5).
- `reasoningDefault`: optionale agentenspezifische Standardsichtbarkeit der Schlussfolgerungen (`on | off | stream`). Überschreibt `agents.defaults.reasoningDefault` für diesen Agent, wenn keine nachrichten- oder sitzungsspezifische Überschreibung der Schlussfolgerungen festgelegt ist.
- `fastModeDefault`: optionaler agentenspezifischer Standard für den Schnellmodus (`"auto" | true | false`). Wird angewendet, wenn keine nachrichten- oder sitzungsspezifische Überschreibung des Schnellmodus festgelegt ist.
- `models`: optionale agentenspezifische Überschreibungen des Modellkatalogs bzw. der Runtime, indiziert durch vollständige `provider/model`-IDs. Verwenden Sie `models["provider/model"].agentRuntime` für agentenspezifische Runtime-Ausnahmen.
- `runtime`: optionaler agentenspezifischer Runtime-Deskriptor. Verwenden Sie `type: "acp"` mit den `runtime.acp`-Standardwerten (`agent`, `backend`, `mode`, `cwd`), wenn der Agent standardmäßig ACP-Harness-Sitzungen verwenden soll.
- `identity.avatar`: arbeitsbereichsrelativer Pfad, `http(s)`-URL oder `data:`-URI.
- Lokale arbeitsbereichsrelative `identity.avatar`-Bilddateien sind auf 2 MB begrenzt. `http(s)`-URLs und `data:`-URIs werden nicht anhand der lokalen Dateigrößenbeschränkung geprüft.
- `identity` leitet Standardwerte ab: `ackReaction` aus `emoji`, `mentionPatterns` aus `name`/`emoji`.
- `subagents.allowAgents`: Zulassungsliste konfigurierter Agent-IDs für explizite `sessions_spawn.agentId`-Ziele (`["*"]` = beliebiges konfiguriertes Ziel; Standard: nur derselbe Agent). Nehmen Sie die ID des Anforderers auf, wenn selbstbezogene `agentId`-Aufrufe erlaubt sein sollen. Veraltete Einträge, deren Agent-Konfiguration gelöscht wurde, werden von `sessions_spawn` abgelehnt und aus `agents_list` weggelassen; führen Sie `openclaw doctor --fix` aus, um sie zu bereinigen, oder fügen Sie einen minimalen `agents.list[]`-Eintrag hinzu, wenn dieses Ziel weiterhin gestartet werden können und dabei Standardwerte übernehmen soll.
- Schutz für die Sandbox-Vererbung: Wenn die Sitzung des Anforderers in einer Sandbox ausgeführt wird, lehnt `sessions_spawn` Ziele ab, die ohne Sandbox ausgeführt würden.
- `subagents.requireAgentId`: Wenn wahr, werden `sessions_spawn`-Aufrufe blockiert, die `agentId` weglassen (erzwingt eine explizite Profilauswahl; Standard: falsch).
- `subagents.maxConcurrent`: maximale Anzahl gleichzeitig ausgeführter untergeordneter Agents über die Subagent-Ausführung hinweg. Standard: `8`.
- `subagents.maxChildrenPerAgent`: maximale Anzahl aktiver untergeordneter Agents, die eine einzelne Agent-Sitzung starten kann. Standard: `5`.
- `subagents.maxSpawnDepth`: maximale Verschachtelungstiefe beim Starten von Subagents (`1`–`5`). Standard: `1` (keine Verschachtelung).
- `subagents.archiveAfterMinutes`: Zeitraum, nach dem der Status eines abgeschlossenen Subagents archiviert wird. Standard: `60`.

---

## Multi-Agent-Routing

Führen Sie mehrere isolierte Agents innerhalb eines Gateways aus. Siehe [Multi-Agent](/de/concepts/multi-agent).

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

### Übereinstimmungsfelder für Bindungen

- `type` (optional): `route` für normales Routing (bei fehlendem Typ wird standardmäßig „route“ verwendet), `acp` für persistente ACP-Konversationsbindungen.
- `match.channel` (erforderlich)
- `match.accountId` (optional; `*` = beliebiges Konto; weggelassen = Standardkonto)
- `match.peer` (optional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (optional; kanalspezifisch)
- `acp` (optional; nur für `type: "acp"`): `{ mode, label, cwd, backend }`

**Deterministische Übereinstimmungsreihenfolge:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exakt, ohne Peer/Guild/Team)
5. `match.accountId: "*"` (kanalweit)
6. Standard-Agent

Innerhalb jeder Stufe hat der erste passende `bindings`-Eintrag Vorrang.

Bei `type: "acp"`-Einträgen löst OpenClaw anhand der exakten Konversationsidentität (`match.channel` + Konto + `match.peer.id`) auf und verwendet nicht die oben beschriebene Stufenreihenfolge der Routing-Bindungen.

### Agentenspezifische Zugriffsprofile

<Accordion title="Vollzugriff (ohne Sandbox)">

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

<Accordion title="Kein Dateisystemzugriff (nur Nachrichtenübermittlung)">

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

Einzelheiten zur Rangfolge finden Sie unter [Multi-Agent-Sandbox und -Tools](/de/tools/multi-agent-sandbox-tools).

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
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 30 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    maintenance: {
      mode: "enforce", // enforce (Standard) | warn
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // Dauer oder false
      maxDiskBytes: "500mb", // optionales festes Limit
      highWaterBytes: "400mb", // optionales Bereinigungsziel
    },
    writeLock: {
      acquireTimeoutMs: 60000,
      staleMs: 1800000,
      maxHoldMs: 300000,
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // standardmäßige automatische Aufhebung des Fokus nach Inaktivität in Stunden (`0` deaktiviert dies)
      maxAgeHours: 0, // standardmäßiges festes Höchstalter in Stunden (`0` deaktiviert dies)
    },
    mainKey: "main", // veraltet (die Runtime verwendet immer "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Details zu Sitzungsfeldern">

- **`scope`**: grundlegende Strategie zur Sitzungsgruppierung für Gruppenchat-Kontexte.
  - `per-sender` (Standard): Jeder Absender erhält innerhalb eines Kanalkontexts eine isolierte Sitzung.
  - `global`: Alle Teilnehmer eines Kanalkontexts teilen sich eine einzige Sitzung (nur verwenden, wenn ein gemeinsamer Kontext beabsichtigt ist).
- **`dmScope`**: Gruppierung von Direktnachrichten.
  - `main`: Alle Direktnachrichten teilen sich die Hauptsitzung.
  - `per-peer`: kanalübergreifend nach Absender-ID isolieren.
  - `per-channel-peer`: nach Kanal und Absender isolieren (für Posteingänge mit mehreren Benutzern empfohlen).
  - `per-account-channel-peer`: nach Konto, Kanal und Absender isolieren (für mehrere Konten empfohlen).
- **`identityLinks`**: kanonische IDs für die kanalübergreifende Sitzungsfreigabe Provider-präfixierten Gegenstellen zuordnen. Andockbefehle wie `/dock_discord` verwenden dieselbe Zuordnung, um die Antwort-Route der aktiven Sitzung auf eine andere verknüpfte Kanal-Gegenstelle umzuschalten; siehe [Kanal-Andocken](/de/concepts/channel-docking).
- **`reset`**: primäre Richtlinie zum Zurücksetzen. `daily` setzt um `atHour` Ortszeit zurück; `idle` setzt nach `idleMinutes` zurück. Wenn beide konfiguriert sind, gilt der Zeitpunkt, der zuerst abläuft. Für die Aktualität beim täglichen Zurücksetzen wird `sessionStartedAt` der Sitzungszeile verwendet; für die Aktualität beim Zurücksetzen wegen Inaktivität wird `lastInteractionAt` verwendet. Schreibvorgänge durch Hintergrund-/Systemereignisse wie Heartbeat, Cron-Aktivierungen, Ausführungsbenachrichtigungen und Gateway-Verwaltung können `updatedAt` aktualisieren, halten tägliche oder inaktivitätsbasierte Sitzungen jedoch nicht aktuell.
- **`resetByType`**: typspezifische Überschreibungen (`direct`, `group`, `thread`). Das veraltete `dm` wird als Alias für `direct` akzeptiert.
- **`resetByChannel`**: kanalspezifische Überschreibungen für das Zurücksetzen, indiziert nach Provider-/Kanal-ID. Wenn der Kanal der Sitzung einen passenden Eintrag hat, hat dieser für diese Sitzung uneingeschränkt Vorrang vor `resetByType`/`reset`. Nur verwenden, wenn ein Kanal ein von der Richtlinie auf Typebene abweichendes Zurücksetzungsverhalten benötigt.
- **`mainKey`**: veraltetes Feld. Die Laufzeit verwendet für den Hauptbereich direkter Chats immer `"main"`.
- **`agentToAgent.maxPingPongTurns`**: maximale Anzahl von Antwortwechseln zwischen Agenten bei Agent-zu-Agent-Austauschen (Ganzzahl, Bereich: `0`-`20`, Standard: `5`). `0` deaktiviert die Pingpong-Verkettung.
- **`sendPolicy`**: Abgleich nach `channel`, `chatType` (`direct|group|channel`, mit dem veralteten Alias `dm`), `keyPrefix` oder `rawKeyPrefix`. Die erste Ablehnung hat Vorrang.
- **`maintenance`**: Steuerelemente für Bereinigung und Aufbewahrung des Sitzungsspeichers.
  - `mode`: `enforce` führt die Bereinigung aus und ist der Standard; `warn` gibt nur Warnungen aus.
  - `pruneAfter`: Altersschwelle für veraltete Einträge (Standard: `30d`).
  - `maxEntries`: maximale Anzahl von SQLite-Sitzungseinträgen (Standard: `500`). Laufzeitschreibvorgänge führen die Bereinigung stapelweise mit einem kleinen Hochwasserpuffer für produktionsgerechte Obergrenzen aus; `openclaw sessions cleanup --enforce` wendet die Obergrenze sofort an.
  - Kurzlebige Gateway-Testsitzungen für Modellläufe verwenden eine feste Aufbewahrung von `24h`, die Bereinigung wird jedoch nur bei Belastung ausgeführt: Veraltete Zeilen strikter Tests für Modellläufe werden nur entfernt, wenn die Wartung der Sitzungseinträge oder der Druck durch die Obergrenze einsetzt. Nur strikt explizite Testschlüssel, die `agent:*:explicit:model-run-<uuid>` entsprechen, kommen infrage; normale Direkt-, Gruppen-, Thread-, Cron-, Hook-, Heartbeat-, ACP- und Subagent-Sitzungen übernehmen diese 24-stündige Aufbewahrung nicht. Wenn die Bereinigung von Modellläufen ausgeführt wird, erfolgt sie vor der allgemeineren Bereinigung veralteter Einträge durch `pruneAfter` und der Obergrenze `maxEntries`.
  - Das veraltete `rotateBytes` wird vom aktuellen Schema abgelehnt; `openclaw doctor --fix` entfernt es aus älteren Konfigurationen.
  - `resetArchiveRetention`: altersbasierte Aufbewahrung für Archive zurückgesetzter/gelöschter Transkripte. Standardmäßig bleiben Archive bis zur Verdrängung aufgrund des Speicherplatzbudgets erhalten; legen Sie eine Dauer fest, um die Löschung nach verstrichener Zeit zu aktivieren, oder `false`, um sie ausdrücklich zu deaktivieren.
  - `maxDiskBytes`: optionales Speicherplatzbudget für das Sitzungsverzeichnis. Im Modus `warn` werden Warnungen protokolliert; im Modus `enforce` werden zuerst die ältesten Artefakte/Sitzungen entfernt.
  - `highWaterBytes`: optionales Ziel nach der Budgetbereinigung. Standardmäßig `80%` von `maxDiskBytes`.
- **`writeLock`**: Steuerelemente für Schreibsperren von Sitzungstranskripten. Nur anpassen, wenn legitime Vorgänge zur Transkriptvorbereitung, Bereinigung, Compaction oder Spiegelung länger als durch die Standardrichtlinien vorgesehen um die Sperre konkurrieren.
  - `acquireTimeoutMs`: Wartezeit in Millisekunden beim Erlangen einer Sperre, bevor die Sitzung als beschäftigt gemeldet wird. Standard: `60000`; Umgebungsüberschreibung `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`.
  - `staleMs`: Zeit in Millisekunden, nach der eine vorhandene Sperre als veraltet gilt und zurückgefordert wird. Standard: `1800000`; Umgebungsüberschreibung `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`.
  - `maxHoldMs`: Zeit in Millisekunden, die eine prozessinterne Sperre gehalten werden darf, bevor der Watchdog sie freigibt. Standard: `300000`; Umgebungsüberschreibung `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.
- **`threadBindings`**: globale Standardwerte für threadgebundene Sitzungsfunktionen.
  - `enabled`: zentraler Standardschalter (Provider können ihn überschreiben; Discord verwendet `channels.discord.threadBindings.enabled`)
  - `idleHours`: standardmäßige automatische Aufhebung des Fokus nach Inaktivität in Stunden (`0` deaktiviert sie; Provider können sie überschreiben)
  - `maxAgeHours`: standardmäßiges maximales Alter in Stunden (`0` deaktiviert es; Provider können es überschreiben)
  - `spawnSessions`: Standardschranke für die Erstellung threadgebundener Arbeitssitzungen aus `sessions_spawn` und ACP-Thread-Starts. Standardmäßig `true`, wenn Thread-Bindungen aktiviert sind; Provider/Konten können dies überschreiben.
  - `defaultSpawnContext`: standardmäßiger nativer Subagent-Kontext für threadgebundene Starts (`"fork"` oder `"isolated"`). Standardmäßig `"fork"`.

</Accordion>

---

## Nachrichten

```json5
{
  messages: {
    responsePrefix: "🦞", // oder "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all | off | none
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer (Standard) | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize (Standard)
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
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

Kanal-/kontospezifische Überschreibungen: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Auflösungsreihenfolge (die spezifischste Einstellung hat Vorrang): Konto → Kanal → global. `""` deaktiviert die Funktion und beendet die Kaskade. `"auto"` leitet `[{identity.name}]` ab.

**Vorlagenvariablen:**

| Variable          | Beschreibung            | Beispiel                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Kurzer Modellname       | `claude-opus-4-6`           |
| `{modelFull}`     | Vollständige Modellkennung  | `anthropic/claude-opus-4-6` |
| `{provider}`      | Providername          | `anthropic`                 |
| `{thinkingLevel}` | Aktuelle Denkstufe | `high`, `low`, `off`        |
| `{identity.name}` | Name der Agentenidentität    | (identisch mit `"auto"`)          |

Bei Variablen wird die Groß-/Kleinschreibung nicht berücksichtigt. `{think}` ist ein Alias für `{thinkingLevel}`.

### Bestätigungsreaktion

- Standardmäßig wird `identity.emoji` des aktiven Agenten verwendet, andernfalls `"👀"`. Zum Deaktivieren `""` festlegen.
- Kanalspezifische Überschreibungen: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Auflösungsreihenfolge: Konto → Kanal → `messages.ackReaction` → Rückfall auf die Identität.
- Geltungsbereich: `group-mentions` (Standard), `group-all`, `direct`, `all` oder `off`/`none` (deaktiviert Bestätigungsreaktionen vollständig).
- `removeAckAfterReply`: entfernt die Bestätigung nach der Antwort in reaktionsfähigen Kanälen wie Slack, Discord, Signal, Telegram, WhatsApp und iMessage.
- `messages.statusReactions.enabled`: aktiviert Reaktionen auf Lebenszyklusstatus in Slack, Discord, Signal, Telegram und WhatsApp.
  In Discord bleiben Statusreaktionen bei nicht festgelegtem Wert aktiviert, wenn Bestätigungsreaktionen aktiv sind.
  In Slack, Signal, Telegram und WhatsApp muss der Wert ausdrücklich auf `true` gesetzt werden, um Reaktionen auf Lebenszyklusstatus zu aktivieren.
  Slack verwendet standardmäßig seinen nativen Status für Assistenten-Threads sowie wechselnde Lademeldungen für den Fortschritt, während die konfigurierte Bestätigungsreaktion unverändert bleibt.
- `messages.statusReactions.emojis`: überschreibt Emoji-Schlüssel für den Lebenszyklus:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` und `stallHard`.
  Telegram erlaubt nur eine feste Gruppe von Reaktionen, daher werden nicht unterstützte konfigurierte Emojis
  auf die nächstgelegene unterstützte Statusvariante für diesen Chat zurückgesetzt.

### Warteschlange

- `mode`: Warteschlangenstrategie für eingehende Nachrichten, die während eines aktiven Sitzungsdurchlaufs eintreffen. Standard: `"steer"`.
  - `steer`: die neue Eingabeaufforderung in den aktiven Durchlauf einfügen.
  - `followup`: die neue Eingabeaufforderung ausführen, nachdem der aktive Durchlauf abgeschlossen ist.
  - `collect`: kompatible Nachrichten bündeln und später gemeinsam ausführen.
  - `interrupt`: den aktiven Durchlauf abbrechen, bevor die neueste Eingabeaufforderung gestartet wird.
- `debounceMs`: Verzögerung vor dem Versenden einer eingereihten/gesteuerten Nachricht. Standard: `500`.
- `cap`: maximale Anzahl eingereihter Nachrichten, bevor die Verwerfungsrichtlinie greift. Standard: `20`.
- `drop`: Strategie bei Überschreitung der Obergrenze. `"summarize"` (Standard) verwirft die ältesten Einträge, behält aber kompakte Zusammenfassungen; `"old"` verwirft die ältesten Einträge ohne Zusammenfassungen; `"new"` lehnt das neueste Element ab.
- `byChannel`: kanalspezifische Überschreibungen für `mode`, indiziert nach Provider-ID.
- `debounceMsByChannel`: kanalspezifische Überschreibungen für `debounceMs`, indiziert nach Provider-ID.

### Entprellung eingehender Nachrichten

Bündelt schnell aufeinanderfolgende reine Textnachrichten desselben Absenders zu einem einzigen Agentendurchlauf. Medien/Anhänge lösen die Verarbeitung sofort aus. Steuerbefehle umgehen die Entprellung. Standard für `debounceMs`: `2000`.

### Weitere Nachrichtenschlüssel

- `messages.messagePrefix`: Präfixtext, der eingehenden Benutzernachrichten vorangestellt wird, bevor sie die Agentenlaufzeit erreichen. Sparsam für Markierungen des Kanalkontexts verwenden.
- `messages.visibleReplies`: steuert sichtbare Quellantworten in Direkt-, Gruppen- und Kanalunterhaltungen (`"message_tool"` erfordert `message(action=send)` für eine sichtbare Ausgabe; `"automatic"` veröffentlicht normale Antworten wie zuvor).
- `messages.usageTemplate` / `messages.responseUsage`: benutzerdefinierte Fußzeilenvorlage für `/usage` und standardmäßiger Verwendungsmodus pro Antwort (`off | tokens | full`, zusätzlich der veraltete Alias `on` für `tokens`).
- `messages.groupChat.mentionPatterns` / `historyLimit`: Auslöser für Erwähnungen in Gruppennachrichten und Größe des Verlaufsfensters.
- `messages.suppressToolErrors`: unterdrückt bei `true` die dem Benutzer angezeigten Werkzeugfehlerwarnungen von `⚠️` (der Agent sieht die Fehler weiterhin im Kontext und kann es erneut versuchen). Standard: `false`.

### TTS (Text-to-Speech)

```json5
{
  messages: {
    tts: {
      auto: "off", // off (default) | always | inbound | tagged
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
          speakerVoice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "coral",
        },
      },
    },
  },
}
```

- `auto` steuert den standardmäßigen automatischen TTS-Modus: `off`, `always`, `inbound` oder `tagged`. `/tts on|off` kann lokale Einstellungen überschreiben, und `/tts status` zeigt den effektiven Status an.
- `summaryModel` überschreibt `agents.defaults.model.primary` für die automatische Zusammenfassung.
- `modelOverrides` ist standardmäßig aktiviert (`enabled !== false`); `modelOverrides.allowProvider` muss explizit aktiviert werden.
- API-Schlüssel greifen ersatzweise auf `ELEVENLABS_API_KEY`/`XI_API_KEY` und `OPENAI_API_KEY` zurück.
- Mitgelieferte Sprachausgabe-Provider gehören den jeweiligen Plugins. Wenn `plugins.allow` festgelegt ist, schließen Sie jedes TTS-Provider-Plugin ein, das Sie verwenden möchten, beispielsweise `microsoft` für Edge TTS. Die veraltete Provider-ID `edge` wird als Alias für `microsoft` akzeptiert.
- `providers.openai.baseUrl` überschreibt den OpenAI-TTS-Endpunkt. Die Auflösungsreihenfolge lautet: Konfiguration, dann `OPENAI_TTS_BASE_URL`, dann `https://api.openai.com/v1`.
- Wenn `providers.openai.baseUrl` auf einen Nicht-OpenAI-Endpunkt verweist, behandelt OpenClaw ihn als OpenAI-kompatiblen TTS-Server und lockert die Modell- und Stimmenvalidierung.

---

## Sprechen

Standardwerte für den Sprechmodus (macOS/iOS/Android und die browserbasierte Control UI).

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
        modelId: "eleven_multilingual_v2",
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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime", // realtime | stt-tts | transcription
      transport: "webrtc", // webrtc | provider-websocket | gateway-relay | managed-room
      vadThreshold: 0.5,
      silenceDurationMs: 500,
      prefixPaddingMs: 300,
      reasoningEffort: "medium",
      brain: "agent-consult", // agent-consult | direct-tools | none
    },
  },
}
```

- `talk.provider` muss einem Schlüssel in `talk.providers` entsprechen, wenn mehrere Provider für den Sprechmodus konfiguriert sind.
- Veraltete flache Schlüssel für den Sprechmodus (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) dienen ausschließlich der Kompatibilität. Führen Sie `openclaw doctor --fix` aus, um die persistierte Konfiguration in `talk.providers.<provider>` umzuschreiben.
- Stimmen-IDs greifen ersatzweise auf `ELEVENLABS_VOICE_ID` oder `SAG_VOICE_ID` zurück (Verhalten des macOS-Clients für den Sprechmodus).
- `providers.*.apiKey` akzeptiert Klartextzeichenfolgen oder SecretRef-Objekte.
- Der Rückgriff auf `ELEVENLABS_API_KEY` erfolgt nur, wenn kein API-Schlüssel für den Sprechmodus konfiguriert ist.
- `providers.*.voiceAliases` ermöglicht die Verwendung benutzerfreundlicher Namen in Anweisungen für den Sprechmodus.
- `providers.mlx.modelId` wählt das Hugging-Face-Repository aus, das vom lokalen MLX-Hilfsprogramm unter macOS verwendet wird. Wenn die Angabe fehlt, verwendet macOS `mlx-community/Soprano-80M-bf16`.
- Die MLX-Wiedergabe unter macOS erfolgt über das mitgelieferte Hilfsprogramm `openclaw-mlx-tts`, sofern vorhanden, oder über eine ausführbare Datei in `PATH`; `OPENCLAW_MLX_TTS_BIN` überschreibt den Pfad des Hilfsprogramms für die Entwicklung.
- `consultThinkingLevel` steuert die Denkstufe für den vollständigen Lauf des OpenClaw-Agenten hinter Echtzeitaufrufen von `openclaw_agent_consult` im Sprechmodus der Control UI. Lassen Sie die Einstellung leer, um das normale Sitzungs- und Modellverhalten beizubehalten.
- `consultFastMode` legt eine einmalige Überschreibung des Schnellmodus für Echtzeitkonsultationen im Sprechmodus der Control UI fest, ohne die normale Schnellmoduseinstellung der Sitzung zu ändern.
- `speechLocale` legt die BCP-47-Gebietsschema-ID fest, die von der Spracherkennung des Sprechmodus unter iOS/macOS verwendet wird. Lassen Sie die Einstellung leer, um den Standardwert des Geräts zu verwenden.
- `silenceTimeoutMs` steuert, wie lange der Sprechmodus nach dem Verstummen des Benutzers wartet, bevor er das Transkript sendet. Ohne Angabe bleibt das plattformspezifische Standardpausenfenster (`700 ms on macOS and Android, 900 ms on iOS`) erhalten.
- `realtime.instructions` hängt Provider-seitige Systemanweisungen an die integrierte Echtzeit-Eingabeaufforderung von OpenClaw an, sodass der Sprachstil konfiguriert werden kann, ohne die standardmäßigen Hinweise von `openclaw_agent_consult` zu verlieren.
- `realtime.vadThreshold` legt den Provider-Schwellenwert für die Sprachaktivität von `0` (höchste Empfindlichkeit) bis `1` (geringste Empfindlichkeit) fest. Ohne Angabe bleibt der Standardwert des Providers erhalten.
- `realtime.silenceDurationMs` legt das positive ganzzahlige Stillefenster fest, nach dem der Provider einen Echtzeit-Benutzerbeitrag abschließt. Ohne Angabe bleibt der Standardwert des Providers erhalten.
- `realtime.prefixPaddingMs` legt die nicht negative ganzzahlige Audiomenge fest, die vor dem Beginn der erkannten Sprache beibehalten wird. Ohne Angabe bleibt der Standardwert des Providers erhalten.
- `realtime.reasoningEffort` legt die Provider-spezifische Denkstufe für Echtzeitsitzungen fest. Ohne Angabe bleibt der Standardwert des Providers erhalten.
- `realtime.consultRouting`: `"provider-direct"` (Standard) behält direkte Antworten des Providers bei, wenn der Echtzeit-Provider ein endgültiges Benutzertranskript ohne `openclaw_agent_consult` erzeugt. `"force-agent-consult"` leitet die abgeschlossene Anfrage stattdessen über OpenClaw weiter.

---

## Verwandte Themen

- [Konfigurationsreferenz](/de/gateway/configuration-reference) — alle weiteren Konfigurationsschlüssel
- [Konfiguration](/de/gateway/configuration) — häufige Aufgaben und Schnelleinrichtung
- [Konfigurationsbeispiele](/de/gateway/configuration-examples)
