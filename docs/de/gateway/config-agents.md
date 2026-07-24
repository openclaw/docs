---
read_when:
    - Optimierung der Agenten-Standardeinstellungen (Modelle, Denkmodus, Arbeitsbereich, Heartbeat, Medien, Skills)
    - Multi-Agent-Routing und Bindungen konfigurieren
    - Anpassen des Sitzungs-, Nachrichtenzustellungs- und Sprechmodusverhaltens
summary: Agenten-Standardeinstellungen, Multi-Agent-Routing, Sitzungs-, Nachrichten- und Sprachkonfiguration
title: Konfiguration — Agenten
x-i18n:
    generated_at: "2026-07-24T04:55:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 266e2e273461f63c9e05fe761c7bbd7b494231fe509dc3c0a72b1536578358b0
    source_path: gateway/config-agents.md
    workflow: 16
---

Agent-spezifische Konfigurationsschlüssel unter `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` und `talk.*`. Informationen zu Kanälen, Tools, der Gateway-Laufzeit und anderen
Schlüsseln der obersten Ebene finden Sie in der [Konfigurationsreferenz](/de/gateway/configuration-reference).

## Agent-Standardwerte

### `agents.defaults.workspace`

Standard: `OPENCLAW_WORKSPACE_DIR`, wenn festgelegt, andernfalls `~/.openclaw/workspace` (oder `~/.openclaw/workspace-<profile>`, wenn `OPENCLAW_PROFILE` auf ein vom Standard abweichendes Profil gesetzt ist).

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Ein expliziter Wert für `agents.defaults.workspace` hat Vorrang vor
`OPENCLAW_WORKSPACE_DIR`. Verwenden Sie die Umgebungsvariable, um Standard-Agents
auf einen eingehängten Arbeitsbereich zu verweisen, wenn Sie diesen Pfad nicht in die Konfiguration schreiben möchten.

### `agents.defaults.repoRoot`

Optionales Repository-Stammverzeichnis, das in der Runtime-Zeile des System-Prompts angezeigt wird. Wenn nicht festgelegt, erkennt OpenClaw es automatisch, indem ausgehend vom Arbeitsbereich die Verzeichnishierarchie nach oben durchsucht wird.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Optionale standardmäßige Skill-Zulassungsliste für Agents, die
`agents.entries.*.skills` nicht festlegen.

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

- Lassen Sie `agents.defaults.skills` weg, um standardmäßig uneingeschränkte Skills zuzulassen.
- Lassen Sie `agents.entries.*.skills` weg, um die Standardwerte zu übernehmen.
- Setzen Sie `agents.entries.*.skills: []`, um keine Skills zuzulassen.
- Eine nicht leere Liste `agents.entries.*.skills` ist die endgültige Menge für diesen Agent; sie
  wird nicht mit den Standardwerten zusammengeführt.

### `agents.defaults.skipBootstrap`

Deaktiviert die automatische Erstellung der Bootstrap-Dateien für den Arbeitsbereich (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Überspringt die Erstellung ausgewählter optionaler Arbeitsbereichsdateien, während erforderliche Bootstrap-Dateien (`AGENTS.md`, `TOOLS.md`, `BOOTSTRAP.md`) weiterhin geschrieben werden. Gültige Werte: `SOUL.md`, `USER.md` und `IDENTITY.md` (`HEARTBEAT.md` wird akzeptiert, hat aber keine Wirkung, da der Heartbeat-Kontext in den temporären Bereich des Cron-Monitors verschoben wurde).

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

Steuert, wann Bootstrap-Dateien des Arbeitsbereichs in den System-Prompt eingefügt werden. Standard: `"always"`.

- `"continuation-skip"`: Bei sicheren Fortsetzungsdurchläufen (nach einer abgeschlossenen Assistentenantwort) wird das erneute Einfügen des Arbeitsbereich-Bootstraps übersprungen, wodurch die Prompt-Größe reduziert wird. Heartbeat-Ausführungen und Wiederholungsversuche nach einer Compaction bauen den Kontext weiterhin neu auf.
- `"never"`: Deaktiviert das Einfügen von Arbeitsbereich-Bootstrap- und Kontextdateien bei jedem Durchlauf. Verwenden Sie dies nur für Agents, die ihren Prompt-Lebenszyklus vollständig selbst verwalten (benutzerdefinierte Kontext-Engines, native Laufzeiten, die ihren eigenen Kontext erstellen, oder spezialisierte Bootstrap-freie Arbeitsabläufe). Bei Heartbeat- und Compaction-Wiederherstellungsdurchläufen wird das Einfügen ebenfalls übersprungen.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Agent-spezifische Überschreibung: `agents.entries.*.contextInjection`. Nicht angegebene Werte übernehmen
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Maximale Zeichenzahl pro Bootstrap-Datei des Arbeitsbereichs vor der Kürzung. Standard: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Agent-spezifische Überschreibung: `agents.entries.*.bootstrapMaxChars`. Nicht angegebene Werte übernehmen
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Maximale Gesamtzeichenzahl, die aus allen Bootstrap-Dateien des Arbeitsbereichs eingefügt wird. Standard: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Agent-spezifische Überschreibung: `agents.entries.*.bootstrapTotalMaxChars`. Nicht angegebene Werte
übernehmen `agents.defaults.bootstrapTotalMaxChars`.

### Agent-spezifische Überschreibungen des Bootstrap-Profils

Verwenden Sie Agent-spezifische Überschreibungen des Bootstrap-Profils, wenn ein Agent ein anderes Verhalten beim
Einfügen in den Prompt als die gemeinsamen Standardwerte benötigt. Nicht angegebene Felder übernehmen die Werte aus
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
- `"once"`: Fügt für jede eindeutige Kürzungssignatur einmal einen kurzen Hinweis ein.
- `"always"`: Fügt bei jeder Ausführung einen kurzen Hinweis ein, wenn eine Kürzung vorliegt (empfohlen).

Detaillierte Roh-/Einfügungszahlen und Felder zur Konfigurationsoptimierung verbleiben in Diagnosen wie
Kontext-/Statusberichten und Protokollen; der reguläre WebChat-Benutzer-/Laufzeitkontext
erhält nur den kurzen Wiederherstellungshinweis.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Zuordnung der Zuständigkeit für Kontextbudgets

OpenClaw verfügt über mehrere umfangreiche Prompt-/Kontextbudgets, die bewusst
nach Subsystem getrennt sind, anstatt alle über eine einzige generische
Option zu steuern.

| Budget                                                         | Umfasst                                                                                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | Reguläres Einfügen des Arbeitsbereich-Bootstraps                                                                                                                            |
| `agents.defaults.startupContext.*`                             | Einmaliger Vorspann für Modellläufe beim Zurücksetzen/Starten, einschließlich aktueller täglicher `memory/*.md`-Dateien. Reine Chatbefehle `/new` und `/reset` werden bestätigt, ohne das Modell aufzurufen |
| `skills.limits.*`                                              | Die kompakte Skills-Liste, die in den System-Prompt eingefügt wird                                                                                                         |
| `agents.defaults.contextLimits.*`                              | Begrenzte Laufzeitauszüge und eingefügte, von der Laufzeit verwaltete Blöcke                                                                                                      |
| `memory.qmd.limits.*`                                          | Ausschnitt aus der indizierten Speichersuche und Größenfestlegung für das Einfügen                                                                                                              |

Entsprechende Agent-spezifische Überschreibungen:

- `agents.entries.*.skillsLimits.maxSkillsPromptChars`
- `agents.entries.*.contextInjection`
- `agents.entries.*.bootstrapMaxChars`
- `agents.entries.*.bootstrapTotalMaxChars`
- `agents.entries.*.contextLimits.*`

#### `agents.defaults.startupContext`

Steuert den beim ersten Durchlauf eingefügten Startvorspann für Modellläufe beim Zurücksetzen/Starten.
Reine Chatbefehle `/new` und `/reset` bestätigen das Zurücksetzen, ohne
das Modell aufzurufen, und laden diesen Vorspann daher nicht.

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
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: Standardmäßige Auszugsbegrenzung von `memory_get`, bevor
  Metadaten zur Kürzung und ein Fortsetzungshinweis hinzugefügt werden.
- Wenn `memory_get` den Wert `lines` nicht angibt, verwendet OpenClaw ein integriertes Fenster mit 120 Zeilen und
  wendet anschließend `memoryGetMaxChars` an.
- Live-Tool-Ergebnisse verwenden eine automatische Begrenzung für den Modellkontext: `16000` Zeichen bei weniger als 100K
  Token, `32000` Zeichen bei 100K+ Token und `64000` Zeichen bei 200K+ Token.
- `postCompactionMaxChars`: Begrenzung für AGENTS.md-Auszüge, die beim
  erneuten Einfügen nach einer Compaction verwendet wird.

#### `agents.entries.*.contextLimits`

Agent-spezifische Überschreibung für die gemeinsamen `contextLimits`-Optionen. Nicht angegebene Felder übernehmen
die Werte aus `agents.defaults.contextLimits`.

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
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Globale Begrenzung für die kompakte Skills-Liste, die in den System-Prompt eingefügt wird. Dies
wirkt sich nicht auf das bedarfsgesteuerte Lesen von `SKILL.md`-Dateien aus.

```json5
{
  skills: { limits: { maxSkillsPromptChars: 18000 } },
}
```

#### `agents.entries.*.skillsLimits.maxSkillsPromptChars`

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

Niedrigere Werte reduzieren bei Screenshot-intensiven Ausführungen in der Regel die Nutzung von Vision-Token und die Größe der Anfrage-Nutzlast.
Höhere Werte bewahren mehr visuelle Details.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Komprimierungs-/Detailpräferenz des Bild-Tools für Bilder, die aus Dateipfaden, URLs und Medienreferenzen geladen werden.
Standard: `auto`.

OpenClaw passt die Staffelung der Größenänderung an das ausgewählte Bildmodell an. Beispielsweise können Claude Opus 4.8, OpenAI GPT-5.6 Sol, Qwen VL und gehostete Llama-4-Vision-Modelle größere Bilder verwenden als ältere bzw. standardmäßige Vision-Pfade mit hoher Detailgenauigkeit, während Durchläufe mit mehreren Bildern im Modus `auto` stärker komprimiert werden, um Token- und Latenzkosten zu begrenzen.

Werte:

- `auto`: An Modellgrenzen und Bildanzahl anpassen.
- `efficient`: Kleinere Bilder für eine geringere Token- und Byte-Nutzung bevorzugen.
- `balanced`: Die standardmäßige ausgewogene Staffelung verwenden.
- `high`: Mehr Details für Screenshots, Diagramme und Dokumentbilder bewahren.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

Zeitzone für den Kontext des System-Prompts (nicht für Nachrichtenzeitstempel). Verwendet ersatzweise die Zeitzone des Hosts.

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
      mediaModels: {
        image: {
          primary: "openai/gpt-image-2",
          fallbacks: ["google/gemini-3.1-flash-image"],
        },
        video: {
          primary: "qwen/wan2.6-t2v",
          fallbacks: ["qwen/wan2.6-i2v"],
        },
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // globale standardmäßige Provider-Parameter
      pdfMaxMb: 10,
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
- `utilityModel`: optionale `provider/model`-Referenz oder Alias für kurze interne Aufgaben. Sie wird derzeit für generierte Sitzungstitel der Control UI, Thementitel für Telegram-Direktnachrichten, automatische Thread-Titel in Discord und [Fortschrittsentwurfsbeschreibungen](/de/concepts/progress-drafts#narrated-status) verwendet. Ist sie nicht festgelegt, leitet OpenClaw den vom primären Provider deklarierten Standard für kleine Modelle ab, sofern einer vorhanden ist (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`); andernfalls verwenden Titelaufgaben das primäre Modell des Agenten, und Beschreibungen bleiben deaktiviert. Wenn ein separates Hilfsmodell einen generierten Titel nicht vorbereiten oder fertigstellen kann, versucht OpenClaw diesen Titel einmal mit dem primären Modell erneut. Bei Dashboard-Titeln verwenden die automatische Ableitung des Hilfsmodells und der reguläre Fallback den effektiven Provider und das Authentifizierungsprofil der Sitzung; ein explizites Hilfsmodell behält seinen konfigurierten Provider und seine konfigurierte Authentifizierung bei. Legen Sie `utilityModel: ""` fest, um die alternative Hilfsroute zu überspringen; die Generierung von Dashboard-Titeln wird dennoch direkt mit dem regulären Sitzungsmodell fortgesetzt. `agents.entries.*.utilityModel` überschreibt den Standard, und eine vorgangsspezifische Modellüberschreibung hat Vorrang vor beiden. Hilfsaufgaben führen separate Modellaufrufe durch und senden aufgabenspezifische Inhalte an den ausgewählten Modell-Provider. Die Generierung von Dashboard-Titeln sendet höchstens die ersten 1.000 Zeichen der ersten Nachricht, die kein Befehl ist; die Beschreibung sendet die eingehende Anfrage sowie kompakte, geschwärzte Werkzeugzusammenfassungen. Wählen Sie einen Provider, der Ihren Anforderungen an Kosten und Datenverarbeitung entspricht.
- `imageModel`: akzeptiert entweder eine Zeichenfolge (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird vom Werkzeugpfad `image` als Konfiguration des Bildverarbeitungsmodells verwendet, wenn das aktive Modell keine Bilder akzeptieren kann. Modelle mit nativer Bildverarbeitung erhalten stattdessen die geladenen Bildbytes direkt.
  - Wird außerdem als Fallback-Routing verwendet, wenn das ausgewählte oder standardmäßige Modell keine Bildeingaben akzeptieren kann.
  - Bevorzugen Sie explizite `provider/model`-Referenzen. Unqualifizierte IDs werden aus Kompatibilitätsgründen akzeptiert; wenn eine unqualifizierte ID eindeutig einem konfigurierten bildfähigen Eintrag in `models.providers.*.models` entspricht, ergänzt OpenClaw sie um diesen Provider. Bei mehrdeutigen konfigurierten Treffern ist ein explizites Provider-Präfix erforderlich.
- `mediaModels.image`: akzeptiert entweder eine Zeichenfolge (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsam genutzten Bildgenerierungsfunktion und allen zukünftigen Werkzeug- oder Plugin-Oberflächen verwendet, die Bilder generieren.
  - Typische Werte: `google/gemini-3.1-flash-image` für die native Gemini-Bildgenerierung, `fal/fal-ai/flux/dev` für fal, `openai/gpt-image-2` für OpenAI Images oder `openai/gpt-image-1.5` für OpenAI-Ausgaben im PNG-/WebP-Format mit transparentem Hintergrund.
  - Wenn Sie einen Provider oder ein Modell direkt auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung (beispielsweise `GEMINI_API_KEY` oder `GOOGLE_API_KEY` für `google/*`, `OPENAI_API_KEY` oder OpenAI Codex OAuth für `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` für `fal/*`).
  - Wenn dies weggelassen wird, kann `image_generate` weiterhin einen durch Authentifizierung gestützten Provider-Standard ableiten. Dabei wird zuerst der aktuelle Standard-Provider und anschließend die übrigen registrierten Provider für die Bildgenerierung in der Reihenfolge ihrer Provider-IDs ausprobiert.
- `mediaModels.music`: akzeptiert entweder eine Zeichenfolge (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsam genutzten Musikgenerierungsfunktion und dem integrierten Werkzeug `music_generate` verwendet.
  - Typische Werte: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` oder `minimax/music-2.6`.
  - Wenn dies weggelassen wird, kann `music_generate` weiterhin einen durch Authentifizierung gestützten Provider-Standard ableiten. Dabei wird zuerst der aktuelle Standard-Provider und anschließend die übrigen registrierten Provider für die Musikgenerierung in der Reihenfolge ihrer Provider-IDs ausprobiert.
  - Wenn Sie einen Provider oder ein Modell direkt auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung bzw. den passenden API-Schlüssel.
- `mediaModels.video`: akzeptiert entweder eine Zeichenfolge (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsam genutzten Videogenerierungsfunktion und dem integrierten Werkzeug `video_generate` verwendet.
  - Typische Werte: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` oder `qwen/wan2.7-r2v`.
  - Wenn dies weggelassen wird, kann `video_generate` weiterhin einen durch Authentifizierung gestützten Provider-Standard ableiten. Dabei wird zuerst der aktuelle Standard-Provider und anschließend die übrigen registrierten Provider für die Videogenerierung in der Reihenfolge ihrer Provider-IDs ausprobiert.
  - Wenn Sie einen Provider oder ein Modell direkt auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung bzw. den passenden API-Schlüssel.
  - Das offizielle Qwen-Plugin für die Videogenerierung unterstützt bis zu 1 Ausgabevideo, 1 Eingabebild, 4 Eingabevideos, eine Dauer von 10 Sekunden sowie die Optionen `size`, `aspectRatio`, `resolution`, `audio` und `watermark` auf Provider-Ebene.
- `pdfModel`: akzeptiert entweder eine Zeichenfolge (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird vom Werkzeug `pdf` für das Modell-Routing verwendet.
  - Wenn dies weggelassen wird, greift das PDF-Werkzeug zunächst auf `imageModel` und anschließend auf das aufgelöste Sitzungs- bzw. Standardmodell zurück.
- `pdfMaxMb`: standardmäßiges PDF-Größenlimit für das Werkzeug `pdf`, wenn `maxBytesMb` beim Aufruf nicht übergeben wird.
- `pdfMaxPages`: standardmäßige maximale Seitenanzahl, die im Fallback-Modus der Extraktion durch das Werkzeug `pdf` berücksichtigt wird.
- `verboseDefault`: standardmäßige Ausführlichkeitsstufe für Agenten. Werte: `"off"`, `"on"`, `"full"`. Standard: `"off"`.
- `toolProgressDetail`: Detailmodus für Zusammenfassungen des Werkzeugs `/verbose` und Werkzeugzeilen in Fortschrittsentwürfen. Werte: `"explain"` (Standard, kompakte menschenlesbare Bezeichnungen) oder `"raw"` (fügt, sofern verfügbar, den Rohbefehl bzw. die Rohdetails an). Die agentenspezifische Einstellung `agents.entries.*.toolProgressDetail` überschreibt diesen Standard.
- `reasoningDefault`: standardmäßige Sichtbarkeit der Schlussfolgerungen für Agenten. Werte: `"off"`, `"on"`, `"stream"`. Die agentenspezifische Einstellung `agents.entries.*.reasoningDefault` überschreibt diesen Standard. Konfigurierte Schlussfolgerungsstandards werden nur für Eigentümer, autorisierte Absender oder Gateway-Kontexte von Operatoradministratoren angewendet, wenn keine Schlussfolgerungsüberschreibung pro Nachricht oder Sitzung festgelegt ist.
- `elevatedDefault`: standardmäßige Stufe für Ausgaben mit erhöhten Berechtigungen bei Agenten. Werte: `"off"`, `"on"`, `"ask"`, `"full"`. Standard: `"on"`.
- `model.primary`: Format `provider/model` (z. B. `openai/gpt-5.6-sol` für Codex-OAuth-Zugriff). Wenn Sie den Provider weglassen, versucht OpenClaw zunächst einen Alias, dann einen eindeutigen Treffer unter den konfigurierten Providern für genau diese Modell-ID und greift erst danach auf den konfigurierten Standard-Provider zurück (veraltetes Kompatibilitätsverhalten; bevorzugen Sie daher explizites `provider/model`). Wenn dieser Provider das konfigurierte Standardmodell nicht mehr bereitstellt, greift OpenClaw auf den ersten konfigurierten Provider bzw. das erste konfigurierte Modell zurück, anstatt einen veralteten Standard eines entfernten Providers anzuzeigen.
- `contextTokens`: optionale agentenweite Obergrenze. Sie kann das effektive Budget eines größeren Modells senken, ein Modell jedoch nicht über seinen konfigurierten oder ermittelten Wert `contextTokens` hinaus anheben. Um für ein direktes OpenAI-Modell dessen größeres natives Kontextfenster zu aktivieren, legen Sie für dieses Modell `models.providers.openai.models[].contextWindow` und `contextTokens` fest; siehe [OpenAI-Standards für Kontextfenster](/de/providers/openai#context-window-defaults-and-long-context-opt-in).
- `models`: konfigurierte Aliase und modellspezifische Einstellungen. Jeder Eintrag kann `alias` (Kurzform) und `params` (Provider-spezifisch, beispielsweise `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, OpenRouter-Routing über `provider`, `chat_template_kwargs`, `extra_body`/`extraBody`) enthalten. Das Hinzufügen von Einträgen schränkt Modellüberschreibungen nicht ein.
  - Verwenden Sie `provider/*`-Einträge wie `"openai/*": {}` oder `"vllm/*": {}`, um alle ermittelten Modelle für ausgewählte Provider anzuzeigen, ohne jede Modell-ID manuell aufzulisten.
  - Fügen Sie einem `provider/*`-Eintrag `agentRuntime` hinzu, wenn alle dynamisch ermittelten Modelle für diesen Provider dieselbe Laufzeit verwenden sollen. Eine exakte Laufzeitrichtlinie für `provider/model` hat weiterhin Vorrang vor dem Platzhalter.
  - Sichere Metadatenänderungen: Verwenden Sie `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, um Einträge hinzuzufügen. `config set` lehnt Ersetzungen ab, durch die vorhandene Einträge entfernt würden, sofern Sie nicht `--replace` übergeben.
- `modelPolicy.allow`: explizite Positivliste für Überschreibungen. Akzeptiert Aliase, exakte `provider/model`-Referenzen und abschließende Präfixplatzhalter wie `openai/*` oder `clawrouter/anthropic/*`. Lassen Sie sie weg oder verwenden Sie `[]`, um jedes Modell zuzulassen. `agents.entries.*.modelPolicy.allow` ersetzt die Standardrichtlinie für diesen Agenten; eine explizite leere Liste aktiviert für diesen Agenten die Zulassung aller Modelle.
  - Provider-bezogene Konfigurations- und Onboarding-Abläufe führen ausgewählte Provider-Modelle mit dieser Zuordnung zusammen und behalten bereits konfigurierte, nicht betroffene Provider bei.
  - Für direkte OpenAI-Responses-Modelle wird die serverseitige Compaction automatisch aktiviert. Verwenden Sie `params.responsesServerCompaction: false`, um das Einfügen von `context_management` zu unterbinden, oder `params.responsesCompactThreshold`, um den Schwellenwert zu überschreiben. Siehe [Serverseitige OpenAI-Compaction](/de/providers/openai#advanced-configuration).
- `params`: globale Standardparameter des Providers, die auf alle Modelle angewendet werden. Festzulegen unter `agents.defaults.params` (z. B. `{ cacheRetention: "long" }`).
- `params`-Zusammenführungsreihenfolge (Konfiguration): `agents.defaults.params` (globale Basis) wird durch `agents.defaults.models["provider/model"].params` (modellspezifisch) überschrieben; anschließend überschreibt `agents.entries.*.params` (übereinstimmende Agenten-ID) schlüsselweise. Weitere Informationen finden Sie unter [Prompt-Caching](/de/reference/prompt-caching).
- `models.providers.openrouter.params.provider`: OpenRouter-weite Standardrichtlinie für das Provider-Routing. OpenClaw leitet diese an das Objekt `provider` der OpenRouter-Anfrage weiter; modellspezifische `agents.defaults.models["openrouter/<model>"].params.provider`- und Agentenparameter überschreiben sie schlüsselweise. Siehe [Provider-Routing von OpenRouter](/de/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: erweitertes, unverändert durchgereichtes JSON, das für OpenAI-kompatible Proxys mit `api: "openai-completions"`-Anfragetexten zusammengeführt wird. Bei einer Kollision mit generierten Anfrageschlüsseln hat der zusätzliche Anfragetext Vorrang; nicht native Completions-Routen entfernen danach weiterhin das ausschließlich für OpenAI bestimmte `store`.
- `params.chat_template_kwargs`: vLLM-/OpenAI-kompatible Chat-Template-Argumente, die mit `api: "openai-completions"`-Anfragetexten der obersten Ebene zusammengeführt werden. Für `vllm/nemotron-3-*` mit deaktiviertem Denken sendet das mitgelieferte vLLM-Plugin automatisch `enable_thinking: false` und `force_nonempty_content: true`; explizite `chat_template_kwargs` überschreiben generierte Standards, und `extra_body.chat_template_kwargs` hat weiterhin die endgültige Priorität. Konfigurierte vLLM-Modelle für Qwen und Nemotron mit Denkfunktion stellen binäre `/think`-Auswahlmöglichkeiten (`off`, `on`) anstelle der mehrstufigen Aufwandsstaffel bereit.
- `compat.thinkingFormat`: Nutzdatenformat für OpenAI-kompatibles Denken. Verwenden Sie `"together"` für `reasoning.enabled` im Together-Stil, `"qwen"` für `enable_thinking` auf oberster Ebene im Qwen-Stil oder `"qwen-chat-template"` für `chat_template_kwargs.enable_thinking` auf Backends der Qwen-Familie, die Chat-Template-Schlüsselwortargumente auf Anfrageebene unterstützen, beispielsweise vLLM. OpenClaw ordnet deaktiviertes Denken `false` und aktiviertes Denken `true` zu; konfigurierte vLLM-Qwen-Modelle stellen für diese Formate binäre `/think`-Auswahlmöglichkeiten bereit.
- `compat.supportedReasoningEfforts`: OpenAI-kompatible Liste des Reasoning-Aufwands pro Modell. Fügen Sie `"xhigh"` für benutzerdefinierte Endpunkte ein, die diesen Wert tatsächlich akzeptieren; OpenClaw stellt dann `/think xhigh` in Befehlsmenüs, Gateway-Sitzungszeilen, der Validierung von Sitzungspatches, der Agent-CLI-Validierung und der `llm-task`-Validierung für den konfigurierten Provider/das konfigurierte Modell bereit. Verwenden Sie `compat.reasoningEffortMap`, wenn das Backend für eine kanonische Stufe einen providerspezifischen Wert erwartet.
- `params.preserveThinking`: nur für Z.AI verfügbare Opt-in-Option für beibehaltenes Denken. Wenn sie aktiviert und das Denken eingeschaltet ist, sendet OpenClaw `thinking.clear_thinking: false` und spielt vorherige `reasoning_content` erneut ein; siehe [Z.AI-Denken und beibehaltenes Denken](/de/providers/zai#advanced-configuration).
- `localService`: optionaler Prozessmanager auf Provider-Ebene für lokale/selbst gehostete Modellserver. Wenn das ausgewählte Modell zu diesem Provider gehört, prüft OpenClaw `healthUrl` (oder `baseUrl + "/models"`), startet `command` mit `args`, falls der Endpunkt nicht erreichbar ist, wartet bis zu `readyTimeoutMs` und sendet anschließend die Modellanfrage. `command` muss ein absoluter Pfad sein. `idleStopMs: 0` hält den Prozess am Leben, bis OpenClaw beendet wird; ein positiver Wert beendet den von OpenClaw gestarteten Prozess nach entsprechend vielen Millisekunden Inaktivität. Siehe [Lokale Modelldienste](/de/gateway/local-model-services).
- Laufzeitrichtlinien gehören zu Providern oder Modellen, nicht zu `agents.defaults`. Verwenden Sie `models.providers.<provider>.agentRuntime` für providerweite Regeln oder `agents.defaults.models["provider/model"].agentRuntime` / `agents.entries.*.models["provider/model"].agentRuntime` für modellspezifische Regeln. Ein Provider-/Modellpräfix allein wählt niemals ein Harness aus. Wenn die Laufzeit nicht festgelegt oder auf `auto` gesetzt ist, kann OpenAI Codex nur für eine exakte offizielle HTTPS-Platform-Responses- oder ChatGPT-Responses-Route ohne explizite Anfrageüberschreibung implizit auswählen. Siehe [Implizite Agent-Laufzeit von OpenAI](/de/providers/openai#implicit-agent-runtime).
- Konfigurationsschreiber, die diese Felder ändern (beispielsweise `/models set`, `/models set-image` sowie Befehle zum Hinzufügen/Entfernen von Fallbacks), speichern die kanonische Objektform und erhalten vorhandene Fallback-Listen, soweit möglich.
- `maxConcurrent`: maximale Anzahl paralleler Agent-Ausführungen über Sitzungen hinweg (jede Sitzung wird weiterhin serialisiert). Standard: `4`.

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

- `id`: `"auto"`, `"openclaw"`, die ID eines registrierten Plugin-Harnesses oder ein unterstützter CLI-Backend-Alias. Das mitgelieferte Codex-Plugin registriert `codex`; das mitgelieferte Anthropic-Plugin stellt das CLI-Backend `claude-cli` bereit.
- `id: "auto"` ermöglicht registrierten Plugin-Harnesses, effektive Routen zu übernehmen, die ihren Unterstützungsvertrag deklarieren oder anderweitig erfüllen, und verwendet OpenClaw, wenn kein Harness übereinstimmt. Eine explizite Plugin-Laufzeit wie `id: "codex"` erfordert dieses Harness und eine kompatible effektive Route; sie schlägt sicher geschlossen fehl, wenn eines von beiden nicht verfügbar ist oder die Ausführung fehlschlägt.
- `id: "pi"` wird nur als veralteter Alias für `openclaw` akzeptiert, um ausgelieferte Konfigurationen aus v2026.5.22 und früher beizubehalten. Neue Konfigurationen sollten `openclaw` verwenden.
- Bei der Laufzeitpriorität gilt zuerst die exakte Modellrichtlinie (`agents.entries.*.models["provider/model"]`, `agents.defaults.models["provider/model"]` oder `models.providers.<provider>.models[]`), dann `agents.entries.*` / `agents.defaults.models["provider/*"]` und anschließend die providerweite Richtlinie unter `models.providers.<provider>.agentRuntime`.
- Laufzeitschlüssel für den gesamten Agenten sind veraltet. `agents.defaults.agentRuntime`, `agents.entries.*.agentRuntime`, Laufzeit-Pins für Sitzungen und `OPENCLAW_AGENT_RUNTIME` werden bei der Laufzeitauswahl ignoriert. Führen Sie `openclaw doctor --fix` aus, um veraltete Werte zu entfernen.
- Geeignete exakte offizielle HTTPS-Routen für OpenAI Responses/ChatGPT ohne explizite Anfrageüberschreibung können das Codex-Harness implizit verwenden. `agentRuntime.id: "codex"` auf Provider-/Modellebene macht Codex zu einer sicher geschlossen fehlschlagenden Anforderung, macht eine inkompatible Route jedoch nicht kompatibel.
- Bevorzugen Sie für Claude-CLI-Bereitstellungen `model: "anthropic/claude-opus-4-8"` zusammen mit dem modellbezogenen `agentRuntime.id: "claude-cli"`. Veraltete `claude-cli/<model>`-Referenzen funktionieren aus Kompatibilitätsgründen weiterhin, neue Konfigurationen sollten die Provider-/Modellauswahl jedoch kanonisch halten und das Ausführungs-Backend in der Provider-/Modell-Laufzeitrichtlinie festlegen.
- Dies steuert nur die Ausführung textbasierter Agentenschritte. Mediengenerierung, Bildverarbeitung, PDF, Musik, Video und TTS verwenden weiterhin ihre Provider-/Modelleinstellungen.

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

Ihre konfigurierten Aliasse haben stets Vorrang vor den Standardwerten.

Z.AI-GLM-4.x-Modelle aktivieren automatisch den Denkmodus, sofern Sie nicht `--thinking off` festlegen oder `agents.defaults.models["zai/<model>"].params.thinking` selbst definieren.
Z.AI-Modelle aktivieren standardmäßig `tool_stream` für das Streaming von Tool-Aufrufen. Setzen Sie `agents.defaults.models["zai/<model>"].params.tool_stream` auf `false`, um dies zu deaktivieren.
Bei Anthropic Claude Opus 4.8 bleibt das Denken in OpenClaw standardmäßig deaktiviert; wenn adaptives Denken explizit aktiviert wird, lautet der von Anthropic als Provider vorgegebene Standardaufwand `high`. Claude-4.6-Modelle verwenden standardmäßig `adaptive`, wenn keine explizite Denkstufe festgelegt ist.

### Auswahl des CLI-Backends

Die Mechanismen des CLI-Adapters werden von Plugins registriert und nicht unter den Agentenstandardwerten
konfiguriert. Wählen Sie ein registriertes CLI-Backend mit dem modellbezogenen `agentRuntime.id`,
wie oben dargestellt. Informationen zum Betrieb finden Sie unter [CLI-Backends](/de/gateway/cli-backends) und
Informationen zur Registrierung von Befehlen, Sitzungen, Bildern und Parsern unter
[Erstellen von CLI-Backend-Plugins](/de/plugins/cli-backend-plugins).

### `agents.defaults.promptOverlays`

Providerunabhängige Prompt-Overlays, die nach Modellfamilie auf von OpenClaw zusammengestellte Prompt-Oberflächen angewendet werden. Modell-IDs der GPT-5-Familie erhalten den gemeinsamen Verhaltensvertrag über OpenClaw-/Provider-Routen hinweg; `personality` steuert nur die Ebene des freundlichen Interaktionsstils. Native Codex-App-Server-Routen behalten die von Codex vorgegebenen Basis-/Modellanweisungen anstelle dieses OpenClaw-GPT-5-Overlays bei, und OpenClaw deaktiviert die integrierte Persönlichkeit von Codex für native Threads.

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
- Das veraltete `plugins.entries.openai.config.personality` wird weiterhin gelesen, wenn diese gemeinsame Einstellung nicht festgelegt ist.

### `agents.defaults.heartbeat`

Periodische Heartbeat-Ausführungen.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true skips workspace bootstrap files for heartbeat runs
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Follow the heartbeat monitor scratch context...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: Zeitdauerzeichenfolge (ms/s/m/h). Standard: `30m` (API-Schlüsselauthentifizierung) oder `1h` (OAuth-Authentifizierung). Setzen Sie den Wert auf `0m`, um die Funktion zu deaktivieren.
- Der Takt wird in eine systemeigene Cron-Monitorzeile geschrieben. Führen Sie `openclaw doctor --fix` aus, um eine fehlende oder veraltete Zeile zu materialisieren. Wenn Cron deaktiviert ist, werden geplante Heartbeats nicht ausgeführt und das Gateway protokolliert beim Start eine Warnung.
- `includeSystemPromptSection`: Wenn der Wert false ist, wird der Heartbeat-Abschnitt im System-Prompt ausgelassen. Standard: `true`.
- `suppressToolErrorWarnings`: Wenn der Wert true ist, werden während Heartbeat-Ausführungen Warnnutzlasten zu Tool-Fehlern unterdrückt.
- `timeoutSeconds`: Maximal zulässige Dauer eines Heartbeat-Agentenschritts in Sekunden, bevor er abgebrochen wird. Lassen Sie den Wert nicht gesetzt, um `agents.defaults.timeoutSeconds` zu verwenden, sofern dieser Wert festgelegt ist; andernfalls wird der Heartbeat-Takt mit einer Obergrenze von 600 Sekunden verwendet.
- `directPolicy`: Zustellungsrichtlinie für direkte Nachrichten/DMs. `allow` (Standard) erlaubt die Zustellung an direkte Ziele. `block` unterdrückt die Zustellung an direkte Ziele und gibt `reason=dm-blocked` aus.
- `lightContext`: Wenn der Wert true ist, verwenden Heartbeat-Ausführungen einen leichtgewichtigen Bootstrap-Kontext und überspringen Bootstrap-Dateien des Arbeitsbereichs. Der Monitor-Zwischenspeicher wird in beiden Fällen vom Heartbeat-Runner injiziert.
- `isolatedSession`: Wenn der Wert true ist, wird jeder Heartbeat in einer neuen Sitzung ohne vorherigen Gesprächsverlauf ausgeführt. Dasselbe Isolationsmuster wie bei Cron `sessionTarget: "isolated"`. Reduziert die Token-Kosten pro Heartbeat von ~100K auf ~2-5K Token.
- `skipWhenBusy`: Wenn der Wert true ist, werden Heartbeat-Ausführungen bei zusätzlichen belegten Lanes dieses Agenten zurückgestellt: bei dessen eigener sitzungsschlüsselbezogener Subagentenarbeit oder verschachtelter Befehlsarbeit. Cron-Lanes stellen Heartbeats auch ohne dieses Flag stets zurück.
- Pro Agent: Legen Sie `agents.entries.*.heartbeat` fest. Wenn ein Agent `heartbeat` definiert, führen **nur diese Agenten** Heartbeats aus.
- Heartbeats führen vollständige Agentenschritte aus – kürzere Intervalle verbrauchen mehr Token.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        thinkingLevel: "low", // optional compaction-only thinking override
        timeoutSeconds: 180,
        keepRecentTokens: 50000,
        recentTurnsPreserve: 3,
        identifierPolicy: "strict", // strict | off
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional tool-loop pressure check
        postIndexSync: "async", // off | async | await
        postCompactionSections: ["Session Startup", "Red Lines"],
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        truncateAfterCompaction: true, // rotate to a smaller successor JSONL after compaction
        maxActiveTranscriptBytes: "20mb", // optional preflight local compaction trigger
        notifyUser: true, // notices when compaction starts/completes and on memory-flush degradation (default: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // optional memory-flush-only model override
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
        },
      },
    },
  },
}
```

- `mode`: `default` oder `safeguard` (abschnittsweise Zusammenfassung für lange Verläufe). Siehe [Compaction](/de/concepts/compaction).
- `provider`: ID eines registrierten Compaction-Provider-Plugins. Wenn festgelegt, wird `summarize()` des Providers anstelle der integrierten LLM-Zusammenfassung aufgerufen. Bei einem Fehler wird auf die integrierte Funktion zurückgegriffen. Das Festlegen eines Providers erzwingt `mode: "safeguard"`. Siehe [Compaction](/de/concepts/compaction).
- `thinkingLevel`: optionale Denkstufe, die nur für eingebettete Compaction-Zusammenfassungen von OpenClaw verwendet wird (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, `max` oder `ultra`). Sie überschreibt die aktuelle Denkstufe der Sitzung und wird auf das ausgewählte Compaction-Modell bzw. die ausgewählte Compaction-Laufzeit begrenzt. Lassen Sie die Einstellung leer, um die Sitzungsstufe zu übernehmen. Die native Compaction des Codex-App-Servers ignoriert diese Einstellung, da die native Compact-Anfrage keine Denkstufenüberschreibung pro Vorgang unterstützt; OpenClaw protokolliert bei konfigurierter Einstellung eine Warnung.
- `timeoutSeconds`: maximal zulässige Anzahl von Sekunden für einen einzelnen Compaction-Vorgang, bevor OpenClaw ihn abbricht. Standard: `180`.
- `keepRecentTokens`: Budget für den Agent-Schnittpunkt, um das neueste Transkriptende unverändert beizubehalten. Manuelles `/compact` berücksichtigt dies, wenn es ausdrücklich festgelegt ist; andernfalls ist die manuelle Compaction ein fester Prüfpunkt.
- `recentTurnsPreserve`: Anzahl der neuesten Benutzer-/Assistentenwechsel, die außerhalb der Schutzmechanismus-Zusammenfassung unverändert beibehalten werden. Standard: `3`.
- `identifierPolicy`: `strict` (Standard) oder `off`. `strict` stellt bei der Compaction-Zusammenfassung integrierte Hinweise zur Beibehaltung nicht transparenter Kennungen voran.
- `qualityGuard`: Prüfungen mit erneutem Versuch bei fehlerhaft formatierter Ausgabe für Schutzmechanismus-Zusammenfassungen. Im Schutzmechanismusmodus standardmäßig aktiviert; legen Sie `enabled: false` fest, um die Prüfung zu überspringen.
- `midTurnPrecheck`: optionale Prüfung der Tool-Schleifenbelastung. Wenn `enabled: true`, prüft OpenClaw den Kontextdruck, nachdem Tool-Ergebnisse angehängt wurden und bevor das Modell erneut aufgerufen wird. Wenn der Kontext nicht mehr passt, bricht es den aktuellen Versuch vor dem Absenden des Prompts ab und verwendet den bestehenden Vorabprüfungs-Wiederherstellungspfad erneut, um Tool-Ergebnisse zu kürzen oder eine Compaction durchzuführen und den Versuch zu wiederholen. Funktioniert sowohl mit dem Compaction-Modus `default` als auch mit `safeguard`. Standard: deaktiviert.
- `postIndexSync`: Modus für die Neuindizierung des Sitzungsspeichers nach der Compaction. Standard: `"async"`. Verwenden Sie `"await"` für höchste Aktualität, `"async"` für eine geringere Compaction-Latenz oder `"off"` nur, wenn die Synchronisierung des Sitzungsspeichers anderweitig erfolgt.
- `postCompactionSections`: optionale Namen von H2-/H3-Abschnitten in AGENTS.md, die nach der Compaction erneut eingefügt werden sollen. Lassen Sie die Einstellung leer oder verwenden Sie `[]`, um dies zu deaktivieren.
- `model`: optionales `provider/model-id` oder einfacher Alias aus `agents.defaults.models`, ausschließlich für die Compaction-Zusammenfassung. Einfache Aliasse werden vor der Weiterleitung aufgelöst; konfigurierte wörtliche Modell-IDs haben bei Kollisionen Vorrang. Verwenden Sie dies, wenn die Hauptsitzung ein Modell beibehalten soll, Compaction-Zusammenfassungen jedoch mit einem anderen ausgeführt werden sollen; wenn nicht festgelegt, verwendet die Compaction das primäre Modell der Sitzung.
- `truncateAfterCompaction`: rotiert das aktive Sitzungstranskript nach der Compaction, sodass zukünftige Wechsel nur die Zusammenfassung und das nicht zusammengefasste Ende laden, während das vorherige vollständige Transkript archiviert bleibt. Verhindert ein unbegrenztes Wachstum des aktiven Transkripts in lang laufenden Sitzungen. Standard: `false`.
- `maxActiveTranscriptBytes`: optionaler Byte-Schwellenwert (`number` oder Zeichenfolgen wie `"20mb"`), der vor einer Ausführung eine normale lokale Compaction auslöst, wenn der Transkriptverlauf den Schwellenwert überschreitet. Erfordert `truncateAfterCompaction`, damit nach erfolgreicher Compaction zu einem kleineren Nachfolgetranskript rotiert werden kann. Deaktiviert, wenn nicht festgelegt oder `0`.
- `notifyUser`: wenn `true`, werden dem Benutzer kurze Hinweise zur Kontextpflege gesendet: wenn die Compaction beginnt und abgeschlossen ist (zum Beispiel „Kontext wird komprimiert ...“ und „Compaction abgeschlossen“) sowie wenn eine Speicherleerung vor der Compaction ausgeschöpft ist und die Antwort daher in einem eingeschränkten Zustand fortgesetzt wird (zum Beispiel „Die Speicherpflege ist vorübergehend fehlgeschlagen; Ihre Antwort wird fortgesetzt.“). Standardmäßig deaktiviert, damit diese Hinweise nicht angezeigt werden.
- `memoryFlush`: stiller agentischer Wechsel vor der automatischen Compaction zum Speichern dauerhafter Erinnerungen. Legen Sie `model` auf einen genauen Provider/ein genaues Modell wie `ollama/qwen3:8b` fest, wenn dieser Wartungswechsel auf einem lokalen Modell verbleiben soll; die Überschreibung übernimmt nicht die aktive Fallback-Kette der Sitzung. `forceFlushTranscriptBytes` erzwingt die Leerung, wenn die Transkriptgröße den Schwellenwert erreicht, selbst wenn die Token-Zähler veraltet sind. Wird übersprungen, wenn der Arbeitsbereich schreibgeschützt ist.

Benutzerdefinierte Compaction-Anweisungen werden vom Code verwaltet. Implementieren Sie ein Compaction-Provider-
Plugin mit `summarize()` für eine benutzerdefinierte Erstellung der Zusammenfassung und verwenden Sie
`before_prompt_build`, wenn Kontext nach der Compaction in spätere
Modell-Prompts eingefügt werden muss. Doctor entfernt die stillgelegten Anweisungsfelder und verweist auf diese
Schnittstellen.

### `agents.defaults.contextPruning`

Entfernt **alte Tool-Ergebnisse** aus dem In-Memory-Kontext, bevor dieser an das LLM gesendet wird. Der Sitzungsverlauf auf dem Datenträger wird **nicht** geändert. Standardmäßig deaktiviert; legen Sie zum Aktivieren `mode: "cache-ttl"` fest.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // aus (Standard) | cache-ttl
      },
    },
  },
}
```

<Accordion title="Verhalten des cache-ttl-Modus">

- `mode: "cache-ttl"` aktiviert Bereinigungsdurchläufe.
- Bei der Bereinigung werden übergroße Tool-Ergebnisse zunächst sanft gekürzt und ältere Tool-Ergebnisse anschließend bei Bedarf vollständig entfernt.

Beim **sanften Kürzen** bleiben Anfang und Ende erhalten, und in der Mitte wird `...` eingefügt.

Beim **vollständigen Entfernen** wird das gesamte Tool-Ergebnis durch den Platzhalter ersetzt.

Hinweise:

- Bildblöcke werden niemals gekürzt oder entfernt.
- Verhältnisse basieren auf Zeichen (Näherungswerte), nicht auf exakten Token-Anzahlen.
- Die neuesten Assistentennachrichten bleiben erhalten.

</Accordion>

Details zum Verhalten finden Sie unter [Sitzungsbereinigung](/de/concepts/session-pruning).

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

- Kanäle außer Telegram erfordern ein ausdrückliches `*.streaming.block.enabled: true`, um Blockantworten zu aktivieren. QQ Bot ist die Ausnahme: Er besitzt keine `streaming.block`-Schlüssel und streamt Blockantworten, sofern `channels.qqbot.streaming.mode` nicht `"off"` ist.
- Kanalspezifische Überschreibungen: `channels.<channel>.streaming.block.coalesce` (und Varianten pro Konto). Discord, Google Chat, Mattermost, MS Teams, Signal und Slack verwenden standardmäßig `minChars: 1500` / `idleMs: 1000`.
- `blockStreamingChunk.breakPreference`: bevorzugte Abschnittsgrenze (`"paragraph" | "newline" | "sentence"`).
- `humanDelay`: zufällige Pause zwischen Blockantworten. Standard: `off`. `natural` = 800-2500ms. `custom` verwendet `minMs`/`maxMs` (für jede nicht festgelegte Grenze wird auf den natürlichen Bereich zurückgegriffen). Überschreibung pro Agent: `agents.entries.*.humanDelay`.

Details zum Verhalten und zur Abschnittsbildung finden Sie unter [Streaming](/de/concepts/streaming).

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

- Standardwerte: `instant` für Direktchats/Erwähnungen, `message` für Gruppenchats ohne Erwähnung.
- Standardwert für `typingIntervalSeconds`: `6`.
- Überschreibung pro Agent: `agents.entries.*.typingMode`.

Siehe [Eingabeindikatoren](/de/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Optionale Sandbox-Ausführung für den eingebetteten Agent. Den vollständigen Leitfaden finden Sie unter [Sandbox-Ausführung](/de/gateway/sandboxing).

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off (Standard) | non-main | all
        backend: "docker", // docker (Standard) | ssh | openshell
        scope: "agent", // session | agent (Standard) | shared
        workspaceAccess: "none", // none (Standard) | ro | rw
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
          // SecretRefs / eingebettete Inhalte werden ebenfalls unterstützt:
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
- `ssh`: generische SSH-basierte Remote-Laufzeit
- `openshell`: OpenShell-Laufzeit

Wenn `backend: "openshell"` ausgewählt ist, werden laufzeitspezifische Einstellungen nach
`plugins.entries.openshell.config` verschoben.

**SSH-Backend-Konfiguration:**

- `target`: SSH-Ziel im Format `user@host[:port]`
- `command`: SSH-Client-Befehl (Standard: `ssh`)
- `workspaceRoot`: absolutes Remote-Stammverzeichnis für bereichsspezifische Arbeitsbereiche (Standard: `/tmp/openclaw-sandboxes`)
- `identityFile` / `certificateFile` / `knownHostsFile`: vorhandene lokale Dateien, die an OpenSSH übergeben werden
- `identityData` / `certificateData` / `knownHostsData`: Inline-Inhalte oder SecretRefs, die OpenClaw zur Laufzeit in temporären Dateien materialisiert
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH-Optionen für die Hostschlüsselrichtlinie (beide standardmäßig `true`)

**Priorität der SSH-Authentifizierung:**

- `identityData` hat Vorrang vor `identityFile`
- `certificateData` hat Vorrang vor `certificateFile`
- `knownHostsData` hat Vorrang vor `knownHostsFile`
- Durch SecretRef gestützte `*Data`-Werte werden aus dem aktiven Laufzeit-Snapshot der Secrets aufgelöst, bevor die Sandbox-Sitzung startet

**Verhalten des SSH-Backends:**

- initialisiert den Remote-Arbeitsbereich einmal nach dem Erstellen oder Neuerstellen
- behält anschließend den Remote-SSH-Arbeitsbereich als kanonische Quelle bei
- leitet `exec`, Dateiwerkzeuge und Medienpfade über SSH
- synchronisiert Remote-Änderungen nicht automatisch zurück zum Host
- unterstützt keine Sandbox-Browsercontainer

**Zugriff auf den Arbeitsbereich:**

- `none`: bereichsspezifischer Sandbox-Arbeitsbereich unter `~/.openclaw/sandboxes` (Standard)
- `ro`: Sandbox-Arbeitsbereich unter `/workspace`, Agent-Arbeitsbereich schreibgeschützt unter `/agent` eingehängt
- `rw`: Agent-Arbeitsbereich mit Lese- und Schreibzugriff unter `/workspace` eingehängt

**Bereich:**

- `session`: Container und Arbeitsbereich pro Sitzung
- `agent`: ein Container und Arbeitsbereich pro Agent (Standard)
- `shared`: gemeinsam genutzter Container und Arbeitsbereich (keine sitzungsübergreifende Isolation)

**OpenShell-Plugin-Konfiguration:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // Spiegelung (Standard) | Remote
          command: "openshell",
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

- `mirror`: vor der Ausführung Remote aus lokalen Daten initialisieren und nach der Ausführung zurücksynchronisieren; der lokale Arbeitsbereich bleibt kanonisch
- `remote`: Remote einmal beim Erstellen der Sandbox initialisieren und anschließend den Remote-Arbeitsbereich als kanonische Quelle beibehalten

Im Modus `remote` werden außerhalb von OpenClaw vorgenommene lokale Host-Änderungen nach dem Initialisierungsschritt nicht automatisch mit der Sandbox synchronisiert.
Der Transport erfolgt per SSH in die OpenShell-Sandbox, das Plugin verwaltet jedoch den Lebenszyklus der Sandbox und die optionale Spiegelungssynchronisierung.

**`setupCommand`** wird einmal nach der Containererstellung ausgeführt (über `sh -lc`). Erfordert ausgehenden Netzwerkzugriff, ein beschreibbares Stammverzeichnis und den Root-Benutzer.

**Container verwenden standardmäßig `network: "none"`** — setzen Sie dies auf `"bridge"` (oder ein benutzerdefiniertes Bridge-Netzwerk), wenn der Agent ausgehenden Zugriff benötigt.
`"host"` ist blockiert. `"container:<id>"` ist standardmäßig blockiert, sofern Sie nicht ausdrücklich
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` festlegen (Notfalloption).
Codex-App-Server-Durchläufe in einer aktiven OpenClaw-Sandbox verwenden dieselbe Einstellung für ausgehenden Zugriff für ihren nativen Netzwerkzugriff im Code-Modus.

**Eingehende Anhänge** werden unter `media/inbound/*` im aktiven Arbeitsbereich bereitgestellt.

**`docker.binds`** hängt zusätzliche Host-Verzeichnisse ein; globale und agentspezifische Bind-Mounts werden zusammengeführt.

**Sandbox-Browser** (`sandbox.browser.enabled`, standardmäßig `false`): Chromium + CDP in einem Container. Die noVNC-URL wird in den System-Prompt eingefügt. Erfordert kein `browser.enabled` in `openclaw.json`.
Der noVNC-Beobachterzugriff verwendet standardmäßig VNC-Authentifizierung, und OpenClaw erzeugt eine kurzlebige Token-URL, anstatt das Passwort in der freigegebenen URL offenzulegen.

- `allowHostControl: false` (Standard) verhindert, dass Sandbox-Sitzungen den Host-Browser ansteuern.
- `network` verwendet standardmäßig `openclaw-sandbox-browser` (dediziertes Bridge-Netzwerk). Setzen Sie dies nur dann auf `bridge`, wenn Sie ausdrücklich globale Bridge-Konnektivität wünschen. `"host"` ist auch hier blockiert.
- `cdpSourceRange` beschränkt den CDP-Eingang am Containerrand optional auf einen CIDR-Bereich (zum Beispiel `172.21.0.1/32`).
- `sandbox.browser.binds` hängt zusätzliche Host-Verzeichnisse ausschließlich in den Sandbox-Browsercontainer ein. Wenn diese Option gesetzt ist (einschließlich `[]`), ersetzt sie `docker.binds` für den Browsercontainer.
- Chromium im Sandbox-Browsercontainer wird immer mit `--no-sandbox --disable-setuid-sandbox` gestartet (Container verfügen nicht über die Kernel-Primitive, die Chromes eigene Sandbox benötigt); hierfür gibt es keine Konfigurationsoption.
- Die Startstandardwerte sind in `scripts/sandbox-browser-entrypoint.sh` definiert und für Containerhosts optimiert:
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
    aktiviert Erweiterungen erneut, falls Ihr Workflow von ihnen abhängt.
  - standardmäßig `--renderer-process-limit=2`; ändern Sie dies mit
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, setzen Sie `0`, um Chromiums
    standardmäßige Prozessbegrenzung zu verwenden.
  - `--headless=new` nur, wenn `headless` aktiviert ist.
  - Die Standardwerte entsprechen der Basis des Container-Images; verwenden Sie ein benutzerdefiniertes Browser-Image mit einem benutzerdefinierten
    Einstiegspunkt, um die Containerstandardwerte zu ändern.

</Accordion>

Browser-Sandboxing und `sandbox.docker.binds` sind ausschließlich mit Docker verfügbar.

Images erstellen (aus einem Quellcode-Checkout):

```bash
scripts/sandbox-setup.sh           # Haupt-Sandbox-Image
scripts/sandbox-browser-setup.sh   # optionales Browser-Image
```

Informationen zu npm-Installationen ohne Quellcode-Checkout finden Sie unter [Sandboxing § Images und Einrichtung](/de/gateway/sandboxing#images-and-setup) für Inline-Befehle vom Typ `docker build`.

### `agents.entries` (agentspezifische Überschreibungen)

Verwenden Sie `agents.entries.*.tts`, um einem Agent einen eigenen TTS-Provider, eine eigene Stimme, ein eigenes Modell,
einen eigenen Stil oder einen eigenen automatischen TTS-Modus zuzuweisen. Der Agent-Block wird rekursiv mit den globalen
`tts` zusammengeführt, sodass gemeinsam genutzte Anmeldedaten an einer Stelle verbleiben können, während einzelne
Agents nur die benötigten Stimm- oder Provider-Felder überschreiben. Die Überschreibung des aktiven Agents
gilt für automatische gesprochene Antworten, `/tts audio`, `/tts status` und
das Agent-Werkzeug `tts`. Beispiele für Provider und die Prioritätsreihenfolge finden Sie unter [Text-zu-Sprache](/de/tools/tts#per-agent-voice-overrides).

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
        thinkingDefault: "high", // agentspezifische Überschreibung der Denktiefe
        reasoningDefault: "on", // agentspezifische Überschreibung der Sichtbarkeit von Schlussfolgerungen
        fastModeDefault: false, // agentspezifische Überschreibung des Schnellmodus
        params: { cacheRetention: "none" }, // überschreibt übereinstimmende defaults.models-Parameter nach Schlüssel
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // ersetzt agents.defaults.skills, wenn gesetzt
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
- `default`: Wenn mehrere festgelegt sind, wird der erste verwendet (eine Warnung wird protokolliert). Wenn keiner festgelegt ist, ist der erste Listeneintrag der Standardwert.
- `model`: Die Zeichenfolgenform legt ein striktes primäres Modell pro Agent ohne Modell-Fallback fest; die Objektform `{ primary }` ist ebenfalls strikt, sofern Sie nicht `fallbacks` hinzufügen. Verwenden Sie `{ primary, fallbacks: [...] }`, um den Fallback für diesen Agent zu aktivieren, oder `{ primary, fallbacks: [] }`, um das strikte Verhalten ausdrücklich festzulegen. Cron-Aufträge, die nur `primary` überschreiben, übernehmen weiterhin die standardmäßigen Fallbacks, sofern Sie nicht `fallbacks: []` festlegen.
- `utilityModel`: optionale Überschreibung pro Agent für kurze interne Aufgaben wie generierte Sitzungs- und Thread-Titel. Fällt auf `agents.defaults.utilityModel` und anschließend auf das deklarierte Standard-Kleinmodell des effektiven Sitzungs-Providers zurück. Dashboard-Titel versuchen es einmal erneut mit dem effektiven regulären Sitzungsmodell. Eine leere Zeichenfolge überspringt die alternative Hilfsroute für diesen Agent, ohne die Generierung von Dashboard-Titeln zu deaktivieren.
- `params`: Stream-Parameter pro Agent, die über den ausgewählten Modelleintrag in `agents.defaults.models` gelegt werden. Verwenden Sie dies für agentspezifische Überschreibungen wie `cacheRetention`, `temperature` oder `maxTokens`, ohne den gesamten Modellkatalog zu duplizieren.
- `tts`: optionale Text-to-Speech-Überschreibungen pro Agent. Der Block wird rekursiv mit `tts` zusammengeführt. Behalten Sie daher gemeinsam verwendete Provider-Anmeldedaten und die Fallback-Richtlinie in `tts` bei und legen Sie hier nur personenspezifische Werte wie Provider, Stimme, Modell, Stil oder automatischen Modus fest.
- `skills`: optionale Skills-Zulassungsliste pro Agent. Falls sie weggelassen wird, übernimmt der Agent `agents.defaults.skills`, sofern festgelegt; eine explizite Liste ersetzt die Standardwerte, statt sie zusammenzuführen, und `[]` bedeutet, dass keine Skills verfügbar sind.
- `thinkingDefault`: optionale standardmäßige Denkstufe pro Agent (`off | minimal | low | medium | high | xhigh | adaptive | max`). Überschreibt `agents.defaults.thinkingDefault` für diesen Agent, wenn keine nachrichten- oder sitzungsspezifische Überschreibung festgelegt ist. Das ausgewählte Provider-/Modellprofil bestimmt, welche Werte gültig sind; bei Google Gemini behält `adaptive` das vom Provider gesteuerte dynamische Denken bei (`thinkingLevel` bei Gemini 3/3.1 weggelassen, `thinkingBudget: -1` bei Gemini 2.5).
- `reasoningDefault`: optionale standardmäßige Sichtbarkeit der Schlussfolgerungen pro Agent (`on | off | stream`). Überschreibt `agents.defaults.reasoningDefault` für diesen Agent, wenn keine nachrichten- oder sitzungsspezifische Überschreibung der Schlussfolgerungen festgelegt ist.
- `fastModeDefault`: optionaler Standardwert pro Agent für den Schnellmodus (`"auto" | true | false`). Gilt, wenn keine nachrichten- oder sitzungsspezifische Überschreibung des Schnellmodus festgelegt ist.
- `models`: optionale Überschreibungen des Modellkatalogs bzw. der Laufzeit pro Agent, indiziert nach vollständigen `provider/model`-IDs. Verwenden Sie `models["provider/model"].agentRuntime` für Laufzeitausnahmen pro Agent.
- `runtime`: optionale Laufzeitbeschreibung pro Agent. Verwenden Sie `type: "acp"` mit den `runtime.acp`-Standardwerten (`agent`, `backend`, `mode`, `cwd`), wenn der Agent standardmäßig ACP-Harness-Sitzungen verwenden soll.
- `identity.avatar`: Workspace-relativer Pfad, `http(s)`-URL oder `data:`-URI.
- Lokale Workspace-relative `identity.avatar`-Bilddateien sind auf 2 MB begrenzt. `http(s)`-URLs und `data:`-URIs werden nicht anhand der lokalen Dateigrößenbegrenzung geprüft.
- `identity` leitet Standardwerte ab: `ackReaction` aus `emoji`, `mentionPatterns` aus `name`/`emoji`.
- `subagents.allowAgents`: Zulassungsliste konfigurierter Agent-IDs für explizite `sessions_spawn.agentId`-Ziele (`["*"]` = jedes konfigurierte Ziel; Standard: nur derselbe Agent). Nehmen Sie die ID des Anfordernden auf, wenn an sich selbst gerichtete `agentId`-Aufrufe zulässig sein sollen. Veraltete Einträge, deren Agent-Konfiguration gelöscht wurde, werden von `sessions_spawn` abgelehnt und aus `agents_list` weggelassen; führen Sie `openclaw doctor --fix` aus, um sie zu bereinigen, oder fügen Sie einen minimalen `agents.entries.*`-Eintrag hinzu, wenn dieses Ziel weiterhin erzeugt werden können soll und dabei Standardwerte übernehmen soll.
- Schutz für die Sandbox-Vererbung: Wenn die Sitzung des Anfordernden in einer Sandbox ausgeführt wird, lehnt `sessions_spawn` Ziele ab, die ohne Sandbox ausgeführt würden.
- `subagents.requireAgentId`: Wenn wahr, werden `sessions_spawn`-Aufrufe blockiert, die `agentId` auslassen (erzwingt die explizite Profilauswahl; Standard: falsch).
- `subagents.maxConcurrent`: maximale Anzahl gleichzeitig ausgeführter untergeordneter Agents über die Subagent-Ausführung hinweg. Standard: `8`.
- `subagents.maxChildrenPerAgent`: maximale Anzahl aktiver untergeordneter Agents, die eine einzelne Agent-Sitzung erzeugen kann. Standard: `5`.
- `subagents.maxSpawnDepth`: maximale Verschachtelungstiefe für das Erzeugen von Subagents (`1`-`5`). Standard: `1` (keine Verschachtelung).
- `subagents.archiveAfterMinutes`: Zeitraum, nach dem der Status abgeschlossener Subagents archiviert wird. Standard: `60`.

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

### Übereinstimmungsfelder für Bindungen

- `type` (optional): `route` für normales Routing (ein fehlender Typ verwendet standardmäßig die Route), `acp` für persistente ACP-Konversationsbindungen.
- `match.channel` (erforderlich)
- `match.accountId` (optional; `*` = jedes Konto; weggelassen = Standardkonto)
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

Innerhalb jeder Stufe wird der erste übereinstimmende `bindings`-Eintrag verwendet.

Bei `type: "acp"`-Einträgen löst OpenClaw anhand der exakten Konversationsidentität (`match.channel` + Konto + `match.peer.id`) auf und verwendet nicht die oben angegebene Stufenreihenfolge der Routenbindung.

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
    sharing: {
      readOnly: true,
      suggest: true,
      drafts: true,
    },
    mainKey: "main", // legacy (runtime always uses "main")
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Details zu den Sitzungsfeldern">

- **`scope`**: grundlegende Strategie zur Sitzungsgruppierung für Gruppenchats.
  - `per-sender` (Standard): Jeder Absender erhält innerhalb eines Kanalkontexts eine isolierte Sitzung.
  - `global`: Alle Teilnehmer in einem Kanalkontext teilen sich eine einzige Sitzung (nur verwenden, wenn ein gemeinsamer Kontext beabsichtigt ist).
- **`dmScope`**: Gruppierung von Direktnachrichten.
  - `main`: Alle Direktnachrichten teilen sich die Hauptsitzung.
  - `per-peer`: kanalübergreifend nach Absender-ID isolieren.
  - `per-channel-peer`: nach Kanal und Absender isolieren (für Posteingänge mit mehreren Benutzern empfohlen).
  - `per-account-channel-peer`: nach Konto, Kanal und Absender isolieren (für mehrere Konten empfohlen).
- **`identityLinks`**: kanonische IDs für die kanalübergreifende Sitzungsfreigabe Provider-präfixierten Gegenstellen zuordnen. Andockbefehle wie `/dock_discord` verwenden dieselbe Zuordnung, um die Antwortweiterleitung der aktiven Sitzung auf eine andere verknüpfte Kanalgegenstelle umzuschalten; siehe [Andocken von Kanälen](/de/concepts/channel-docking).
- **`reset`**: primäre Richtlinie zum Zurücksetzen. `none` deaktiviert das automatische Zurücksetzen und ist der Standard; stattdessen begrenzt Compaction den aktiven Kontext. `daily` setzt um `atHour` Ortszeit zurück; `idle` setzt nach `idleMinutes` zurück. Wenn beide konfiguriert sind, gilt der zuerst ablaufende Wert. `/new` und `/reset` bleiben in jedem Modus verfügbar. Für die Aktualität des täglichen Zurücksetzens wird `sessionStartedAt` der Sitzungszeile verwendet; für die Aktualität des Zurücksetzens bei Inaktivität wird `lastInteractionAt` verwendet. Schreibvorgänge durch Hintergrund- oder Systemereignisse wie Heartbeat, Cron-Aktivierungen, Ausführungsbenachrichtigungen und Gateway-Buchführung können `updatedAt` aktualisieren, halten tägliche oder inaktive Sitzungen jedoch nicht aktuell.
  - **`resetByType`**: typbezogene Überschreibungen (`direct`, `group`, `thread`). Doctor migriert veraltete `dm`-Einträge nach `direct`; das Schema lehnt `dm` ab.
- **`resetByChannel`**: kanalbezogene Überschreibungen für das Zurücksetzen, nach Provider-/Kanal-ID verschlüsselt. Wenn der Kanal der Sitzung einen passenden Eintrag besitzt, hat dieser für die Sitzung uneingeschränkt Vorrang vor `resetByType`/`reset`. Nur verwenden, wenn ein Kanal ein von der typbezogenen Richtlinie abweichendes Zurücksetzungsverhalten benötigt.
- **`mainKey`**: veraltetes Feld. Die Laufzeit verwendet für den Hauptbereich direkter Chats immer `"main"`.
- **`sendPolicy`**: Abgleich nach `channel`, `chatType` (`direct|group|channel`, mit dem veralteten Alias `dm`), `keyPrefix` oder `rawKeyPrefix`. Die erste Ablehnung ist maßgeblich.
- **`maintenance`**: Bereinigungs- und Aufbewahrungssteuerung für den Sitzungsspeicher.
  - `mode`: `enforce` führt die Bereinigung durch und ist der Standard; `warn` gibt nur Warnungen aus.
  - `pruneAfter`: Altersgrenze für veraltete Einträge (Standard: `30d`).
  - `maxEntries`: maximale Anzahl von SQLite-Sitzungseinträgen (Standard: `500`). Laufzeitschreibvorgänge führen eine stapelweise Bereinigung mit einem kleinen Hochwasserpuffer für produktionsübliche Obergrenzen durch; `openclaw sessions cleanup --enforce` wendet die Obergrenze sofort an.
  - Kurzlebige Gateway-Testsitzungen für Modellausführungen verwenden eine feste Aufbewahrungsdauer von `24h`, die Bereinigung erfolgt jedoch nur bei Speicherdruck: Veraltete Zeilen strikter Modellausführungstests werden nur entfernt, wenn der Wartungs- oder Obergrenzendruck für Sitzungseinträge erreicht ist. Nur explizite strikte Testschlüssel, die `agent:*:explicit:model-run-<uuid>` entsprechen, kommen infrage; normale Direkt-, Gruppen-, Thread-, Cron-, Hook-, Heartbeat-, ACP- und Subagent-Sitzungen übernehmen diese Aufbewahrungsdauer von 24 Stunden nicht. Wenn die Bereinigung von Modellausführungen ausgeführt wird, erfolgt sie vor der allgemeineren Bereinigung veralteter Einträge gemäß `pruneAfter` und der Obergrenze `maxEntries`.
  - Das veraltete `rotateBytes` wird vom aktuellen Schema abgelehnt; `openclaw doctor --fix` entfernt es aus älteren Konfigurationen.
  - `resetArchiveRetention`: altersbasierte Aufbewahrung zurückgesetzter oder gelöschter Transkriptarchive. Standardmäßig bleiben Archive bis zur Verdrängung aufgrund des Speicherplatzbudgets erhalten; legen Sie eine Dauer fest, um die zeitbasierte Löschung zu aktivieren, oder `false`, um sie ausdrücklich zu deaktivieren.
  - `maxDiskBytes`: optionales Speicherplatzbudget für das Sitzungsverzeichnis. Im Modus `warn` werden Warnungen protokolliert; im Modus `enforce` werden die ältesten Artefakte und Sitzungen zuerst entfernt.
  - `highWaterBytes`: optionaler Zielwert nach der Budgetbereinigung. Standardmäßig `80%` von `maxDiskBytes`.
- **`threadBindings`**: globale Standardwerte für Funktionen Thread-gebundener Sitzungen.
  - `enabled`: Hauptschalter für unterstützte Kanal-Thread-Bindungen
  - `idleHours`: standardmäßiges automatisches Aufheben des Fokus nach Inaktivität in Stunden (`0` deaktiviert es; Provider können den Wert überschreiben)
  - `maxAgeHours`: standardmäßiges maximales Alter in Stunden (`0` deaktiviert es; Provider können den Wert überschreiben)
  - `spawnSessions`: Standardschranke für das Erstellen Thread-gebundener Arbeitssitzungen aus `sessions_spawn` und ACP-Thread-Erstellungen. Standardmäßig `true`, wenn Thread-Bindungen aktiviert sind; Provider und Konten können den Wert überschreiben.
  - `defaultSpawnContext`: standardmäßiger nativer Subagent-Kontext für Thread-gebundene Erstellungen (`"fork"` oder `"isolated"`). Standardmäßig `"fork"`.
- **`sharing`**: steuert, welche sitzungsbezogenen Zusammenarbeitsmodi Eigentümer und `operator.admin`-Verbindungen auswählen dürfen. Jedes Flag ist standardmäßig auf `true` gesetzt; wird eines auf `false` gesetzt, wird diese Auswahl aus der Control UI entfernt, und die Sichtbarkeit bei der Erstellung oder `session.visibility.set` lehnt sie ab. Neue Sitzungen beginnen mit `shared`, sofern die Control UI sie nicht als Entwurf startet.
  - `readOnly`: `read-only` zulassen, wobei Nichtmitglieder zuschauen, aber keine Nachrichten senden, steuern, abbrechen, genehmigen oder den Sitzungsstatus ändern können.
  - `suggest`: `suggest` zulassen. In dieser Phase erzwingt es dasselbe Zulassungsverhalten wie `read-only`; die Vorschlagswarteschlange ist eine spätere Funktion.
  - `drafts`: `draft` zulassen, wodurch die Sitzung für Nichtadministratoren und Nichteigentümer in Sitzungslisten und Ereignisübertragungen ausgeblendet wird.

Änderungen an Mitgliedschaft und Sichtbarkeit werden als Systemhinweise in das Sitzungstranskript geschrieben. Diese Steuerungen koordinieren Betreiber, die sich einen Agenten teilen; sie bilden keine Sicherheitsgrenze zwischen Mandanten. Verwenden Sie getrennte Gateways oder Agenten, wenn die Arbeit Isolation erfordert.

</Accordion>

---

## Nachrichten

```json5
{
  messages: {
    responsePrefix: "🦞", // oder "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all | off | none
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

Kanal-/kontobezogene Überschreibungen: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Auflösung (der spezifischste Wert ist maßgeblich): Konto → Kanal → global. `""` deaktiviert die Funktion und beendet die Kaskade. `"auto"` leitet `[{identity.name}]` ab.

**Vorlagenvariablen:**

| Variable          | Beschreibung            | Beispiel                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Kurzer Modellname       | `claude-opus-4-6`           |
| `{modelFull}`     | Vollständige Modellkennung  | `anthropic/claude-opus-4-6` |
| `{provider}`      | Providername          | `anthropic`                 |
| `{thinkingLevel}` | Aktuelle Denkstufe | `high`, `low`, `off`        |
| `{identity.name}` | Name der Agentenidentität    | (entspricht `"auto"`)          |

Bei Variablen wird die Groß-/Kleinschreibung nicht berücksichtigt. `{think}` ist ein Alias für `{thinkingLevel}`.

### Bestätigungsreaktion

- Standardmäßig wird `identity.emoji` des aktiven Agenten verwendet, andernfalls `"👀"`. Setzen Sie `""`, um die Funktion zu deaktivieren.
- Kanalbezogene Überschreibungen: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Auflösungsreihenfolge: Konto → Kanal → `messages.ackReaction` → Identitätsfallback.
- Geltungsbereich: `group-mentions` (Standard), `group-all`, `direct`, `all` oder `off`/`none` (deaktiviert Bestätigungsreaktionen vollständig).
- `messages.statusReactions.enabled`: aktiviert Reaktionen auf Lebenszyklusstatus bei Slack, Discord, Signal, Telegram und WhatsApp.
  Bei Discord bleiben Statusreaktionen bei nicht gesetztem Wert aktiviert, wenn Bestätigungsreaktionen aktiv sind.
  Bei Slack, Signal, Telegram und WhatsApp muss der Wert ausdrücklich auf `true` gesetzt werden, um Reaktionen auf den Lebenszyklusstatus zu aktivieren.
  Slack verwendet standardmäßig seinen nativen Assistenten-Thread-Status und wechselnde Lademeldungen für den Fortschritt, während die konfigurierte Bestätigungsreaktion unverändert bleibt.

### Warteschlange

- `mode`: Warteschlangenstrategie für eingehende Nachrichten, die während einer aktiven Sitzungsausführung eintreffen. Standard: `"steer"`.
  - `steer`: die neue Eingabeaufforderung in die aktive Ausführung einfügen.
  - `followup`: die neue Eingabeaufforderung ausführen, nachdem die aktive Ausführung beendet ist.
  - `collect`: kompatible Nachrichten bündeln und später gemeinsam ausführen.
  - `interrupt`: die aktive Ausführung abbrechen, bevor die neueste Eingabeaufforderung gestartet wird.
- `debounceMs`: Verzögerung vor der Weiterleitung einer in die Warteschlange gestellten oder gesteuerten Nachricht. Standard: `500`.
- `cap`: maximale Anzahl von Nachrichten in der Warteschlange, bevor die Verwerfungsrichtlinie angewendet wird. Standard: `20`.
- `drop`: Strategie bei Überschreitung der Obergrenze. `"summarize"` (Standard) verwirft die ältesten Einträge, behält jedoch kompakte Zusammenfassungen bei; `"old"` verwirft die ältesten Einträge ohne Zusammenfassungen; `"new"` lehnt den neuesten Eintrag ab.
- `byChannel`: kanalbezogene `mode`-Überschreibungen, nach Provider-ID verschlüsselt.
- `debounceMsByChannel`: kanalbezogene `debounceMs`-Überschreibungen, nach Provider-ID verschlüsselt.

### Entprellung eingehender Nachrichten

Bündelt schnell aufeinanderfolgende reine Textnachrichten desselben Absenders zu einem einzigen Agentendurchlauf. Medien und Anhänge lösen die Verarbeitung sofort aus. Steuerbefehle umgehen die Entprellung. Standardwert für `debounceMs`: `2000`.

### Weitere Nachrichtenschlüssel

- `channels.whatsapp.responsePrefix`: Präfix für ausgehende WhatsApp-Antworten. Doctor verschiebt den veralteten eingehenden Wert `messagePrefix` nur hierher, wenn dieser kanonische Wert nicht gesetzt ist.
- `messages.visibleReplies`: steuert sichtbare Quellantworten in Direkt-, Gruppen- und Kanalunterhaltungen (`"message_tool"` erfordert `message(action=send)` für eine sichtbare Ausgabe; `"automatic"` veröffentlicht normale Antworten wie bisher).
- `messages.usageTemplate` / `messages.responseUsage`: benutzerdefinierte `/usage`-Fußzeilenvorlage und standardmäßiger Verwendungsmodus pro Antwort (`off | tokens | full`, zusätzlich der veraltete Alias `on` für `tokens`).
- `messages.groupChat.mentionPatterns` / `historyLimit`: Auslöser für Erwähnungen in Gruppennachrichten und Größe des Verlaufsfensters.
- `messages.suppressToolErrors`: unterdrückt bei `true` die dem Benutzer angezeigten `⚠️`-Werkzeugfehlerwarnungen (der Agent sieht die Fehler weiterhin im Kontext und kann es erneut versuchen). Standard: `false`.

### TTS (Text-zu-Sprache)

```json5
{
  tts: {
    auto: "off", // off (Standard) | always | inbound | tagged
    mode: "final", // final | all
    provider: "elevenlabs",
    summaryModel: "openai/gpt-5.4-mini",
    modelOverrides: { enabled: true },
    maxTextLength: 4000,
    timeoutMs: 30000,
    providers: {
      elevenlabs: {
        apiKey: "example-elevenlabs-api-key",
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
        apiKey: "example-openai-api-key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        speakerVoice: "coral",
      },
    },
  },
}
```

Der globale Einstellungspfad ist ein Maschinenzustand (standardmäßig
`~/.openclaw/settings/tts.json`; überschreibbar mit `OPENCLAW_TTS_PREFS`). Erweiterte
Multi-Agent-Konfigurationen können `agents.entries.<id>.tts.prefsPath` für separate
agentenspezifische Einstellungsspeicher festlegen.

- `auto` steuert den standardmäßigen automatischen TTS-Modus: `off`, `always`, `inbound` oder `tagged`. `/tts on|off` kann lokale Einstellungen überschreiben und `/tts status` zeigt den wirksamen Zustand an.
- `summaryModel` überschreibt `agents.defaults.model.primary` für die automatische Zusammenfassung.
- `modelOverrides` ist standardmäßig aktiviert (`enabled !== false`); `modelOverrides.allowProvider` muss ausdrücklich aktiviert werden.
- API-Schlüssel greifen ersatzweise auf `ELEVENLABS_API_KEY`/`XI_API_KEY` und `OPENAI_API_KEY` zurück.
- Mitgelieferte Sprachausgabe-Provider gehören den Plugins. Wenn `plugins.allow` festgelegt ist, nehmen Sie jedes gewünschte TTS-Provider-Plugin auf, beispielsweise `microsoft` für Edge TTS. Die veraltete Provider-ID `edge` wird als Alias für `microsoft` akzeptiert.
- `providers.openai.baseUrl` überschreibt den OpenAI-TTS-Endpunkt. Die Auflösungsreihenfolge lautet: Konfiguration, dann `OPENAI_TTS_BASE_URL`, dann `https://api.openai.com/v1`.
- Wenn `providers.openai.baseUrl` auf einen Nicht-OpenAI-Endpunkt verweist, behandelt OpenClaw ihn als OpenAI-kompatiblen TTS-Server und lockert die Modell-/Stimmenvalidierung.

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
      instructions: "Sprechen Sie freundlich und halten Sie Antworten kurz.",
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

- `talk.provider` muss einem Schlüssel in `talk.providers` entsprechen, wenn mehrere Sprech-Provider konfiguriert sind.
- Veraltete flache Sprechschlüssel (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) dienen ausschließlich der Kompatibilität. Führen Sie `openclaw doctor --fix` aus, um die persistierte Konfiguration in `talk.providers.<provider>` umzuschreiben.
- Stimmen-IDs greifen ersatzweise auf `ELEVENLABS_VOICE_ID` oder `SAG_VOICE_ID` zurück (Verhalten des macOS-Sprechclients).
- `providers.*.apiKey` akzeptiert Klartextzeichenfolgen oder SecretRef-Objekte.
- Der Rückgriff auf `ELEVENLABS_API_KEY` gilt nur, wenn kein Sprech-API-Schlüssel konfiguriert ist.
- `providers.*.voiceAliases` ermöglicht Sprechdirektiven die Verwendung benutzerfreundlicher Namen.
- `providers.mlx.modelId` wählt das Hugging-Face-Repository aus, das die lokale MLX-Hilfskomponente unter macOS verwendet. Bei Auslassung verwendet macOS `mlx-community/Soprano-80M-bf16`.
- Die MLX-Wiedergabe unter macOS erfolgt über die mitgelieferte Hilfskomponente `openclaw-mlx-tts`, sofern vorhanden, oder über eine ausführbare Datei in `PATH`; `OPENCLAW_MLX_TTS_BIN` überschreibt den Pfad der Hilfskomponente für die Entwicklung.
- `consultThinkingLevel` steuert die Denktiefe für den vollständigen OpenClaw-Agentenlauf hinter den Echtzeitaufrufen `openclaw_agent_consult` der Control UI im Sprechmodus. Lassen Sie die Einstellung ungesetzt, um das normale Sitzungs-/Modellverhalten beizubehalten.
- `consultFastMode` legt eine einmalige Überschreibung des Schnellmodus für Echtzeitkonsultationen der Control UI im Sprechmodus fest, ohne die normale Schnellmoduseinstellung der Sitzung zu ändern.
- `speechLocale` legt die BCP-47-Gebietsschema-ID fest, die Android, iOS und macOS für die Spracherkennung im Sprechmodus verwenden. Android verwendet außerdem deren Sprachkomponente als Orientierung für die Echtzeittranskription der Eingabe. Lassen Sie die Einstellung ungesetzt, um den Gerätestandard zu verwenden.
- `silenceTimeoutMs` steuert, wie lange der Sprechmodus nach dem Verstummen des Benutzers wartet, bevor er das Transkript sendet. Bei nicht gesetztem Wert bleibt das standardmäßige Pausenfenster der Plattform (`700 ms on macOS and Android, 900 ms on iOS`) erhalten.
- `realtime.instructions` hängt an Provider gerichtete Systemanweisungen an die integrierte Echtzeit-Eingabeaufforderung von OpenClaw an, sodass der Sprechstil konfiguriert werden kann, ohne die standardmäßigen `openclaw_agent_consult`-Vorgaben zu verlieren.
- `realtime.vadThreshold` legt den Schwellenwert des Providers für die Sprachaktivität zwischen `0` (höchste Empfindlichkeit) und `1` (geringste Empfindlichkeit) fest. Bei nicht gesetztem Wert bleibt der Standardwert des Providers erhalten.
- `realtime.silenceDurationMs` legt das positive ganzzahlige Stillefenster fest, nach dem der Provider einen Echtzeit-Benutzerturn übernimmt. Bei nicht gesetztem Wert bleibt der Standardwert des Providers erhalten.
- `realtime.prefixPaddingMs` legt die nicht negative ganzzahlige Audiomenge fest, die vor dem Beginn der erkannten Sprache erhalten bleibt. Bei nicht gesetztem Wert bleibt der Standardwert des Providers erhalten.
- `realtime.reasoningEffort` legt die providerspezifische Schlussfolgerungstiefe für Echtzeitsitzungen fest. Bei nicht gesetztem Wert bleibt der Standardwert des Providers erhalten.
- `realtime.consultRouting`: `"provider-direct"` (Standard) behält direkte Provider-Antworten bei, wenn der Echtzeit-Provider ein endgültiges Benutzertranskript ohne `openclaw_agent_consult` erzeugt. `"force-agent-consult"` leitet die abgeschlossene Anfrage stattdessen über OpenClaw.

---

## Verwandte Themen

- [Konfigurationsreferenz](/de/gateway/configuration-reference) — alle weiteren Konfigurationsschlüssel
- [Konfiguration](/de/gateway/configuration) — häufige Aufgaben und Schnelleinrichtung
- [Konfigurationsbeispiele](/de/gateway/configuration-examples)
