---
read_when:
    - Agent-Standardeinstellungen anpassen (Modelle, Denken, Workspace, Heartbeat, Medien, Skills)
    - Multi-Agent-Routing und Bindungen konfigurieren
    - Sitzungs-, Nachrichtenzustellungs- und Sprechmodusverhalten anpassen
summary: Agent-Standardeinstellungen, Multi-Agent-Routing, Sitzungs-, Nachrichten- und Gesprächskonfiguration
title: Konfiguration — Agenten
x-i18n:
    generated_at: "2026-07-12T15:22:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 054fbb866e4c02a64a1e8041421a478e3c1fd01311f57f293c6420a6516ebddb
    source_path: gateway/config-agents.md
    workflow: 16
---

Agent-spezifische Konfigurationsschlüssel unter `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` und `talk.*`. Informationen zu Kanälen, Tools, der Gateway-Laufzeit und anderen
Schlüsseln auf oberster Ebene finden Sie in der [Konfigurationsreferenz](/de/gateway/configuration-reference).

## Agent-Standardwerte

### `agents.defaults.workspace`

Standard: `OPENCLAW_WORKSPACE_DIR`, wenn gesetzt, andernfalls `~/.openclaw/workspace` (oder `~/.openclaw/workspace-<profile>`, wenn `OPENCLAW_PROFILE` auf ein vom Standard abweichendes Profil gesetzt ist).

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Ein expliziter Wert für `agents.defaults.workspace` hat Vorrang vor
`OPENCLAW_WORKSPACE_DIR`. Verwenden Sie die Umgebungsvariable, um Standard-Agenten
auf einen eingebundenen Arbeitsbereich zu verweisen, wenn Sie diesen Pfad nicht in die Konfiguration schreiben möchten.

### `agents.defaults.repoRoot`

Optionales Repository-Stammverzeichnis, das in der Runtime-Zeile des System-Prompts angezeigt wird. Wenn nicht gesetzt, erkennt OpenClaw es automatisch, indem es vom Arbeitsbereich aus die Verzeichnishierarchie nach oben durchsucht.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Optionale standardmäßige Skills-Zulassungsliste für Agenten, die
`agents.list[].skills` nicht festlegen.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // übernimmt github, weather
      { id: "docs", skills: ["docs-search"] }, // ersetzt die Standardwerte
      { id: "locked-down", skills: [] }, // keine Skills
    ],
  },
}
```

- Lassen Sie `agents.defaults.skills` weg, um standardmäßig uneingeschränkte Skills zuzulassen.
- Lassen Sie `agents.list[].skills` weg, um die Standardwerte zu übernehmen.
- Setzen Sie `agents.list[].skills: []`, um keine Skills zuzulassen.
- Eine nicht leere Liste `agents.list[].skills` ist die endgültige Menge für diesen Agenten; sie
  wird nicht mit den Standardwerten zusammengeführt.

### `agents.defaults.skipBootstrap`

Deaktiviert die automatische Erstellung von Bootstrap-Dateien im Arbeitsbereich (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Überspringt die Erstellung ausgewählter optionaler Arbeitsbereichsdateien, während erforderliche Bootstrap-Dateien (`AGENTS.md`, `TOOLS.md`, `BOOTSTRAP.md`) weiterhin geschrieben werden. Gültige Werte: `SOUL.md`, `USER.md`, `HEARTBEAT.md` und `IDENTITY.md`.

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

- `"continuation-skip"`: Bei sicheren Fortsetzungsdurchläufen (nach einer abgeschlossenen Assistentenantwort) wird das erneute Einfügen des Arbeitsbereichs-Bootstraps übersprungen, wodurch sich die Prompt-Größe verringert. Heartbeat-Ausführungen und Wiederholungen nach einer Compaction erstellen den Kontext weiterhin neu.
- `"never"`: Deaktiviert bei jedem Durchlauf die Einfügung des Arbeitsbereichs-Bootstraps und der Kontextdateien. Verwenden Sie dies nur für Agenten, die ihren Prompt-Lebenszyklus vollständig selbst verwalten (benutzerdefinierte Kontext-Engines, native Laufzeiten, die ihren eigenen Kontext erstellen, oder spezialisierte Arbeitsabläufe ohne Bootstrap). Auch bei Heartbeat- und Wiederherstellungsdurchläufen nach einer Compaction wird die Einfügung übersprungen.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Agent-spezifische Überschreibung: `agents.list[].contextInjection`. Fehlende Werte übernehmen
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Maximale Zeichenanzahl pro Bootstrap-Datei des Arbeitsbereichs vor der Kürzung. Standard: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Agent-spezifische Überschreibung: `agents.list[].bootstrapMaxChars`. Fehlende Werte übernehmen
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Maximale Gesamtzahl der Zeichen, die aus allen Bootstrap-Dateien des Arbeitsbereichs eingefügt werden. Standard: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Agent-spezifische Überschreibung: `agents.list[].bootstrapTotalMaxChars`. Fehlende Werte
übernehmen `agents.defaults.bootstrapTotalMaxChars`.

### Agent-spezifische Überschreibungen des Bootstrap-Profils

Verwenden Sie agent-spezifische Überschreibungen des Bootstrap-Profils, wenn ein Agent ein anderes
Verhalten bei der Prompt-Einfügung als die gemeinsamen Standardwerte benötigt. Fehlende Felder übernehmen die Werte aus
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

Steuert den für den Agenten sichtbaren Hinweis im System-Prompt, wenn der Bootstrap-Kontext gekürzt wird.
Standard: `"always"`.

- `"off"`: Fügt niemals einen Kürzungshinweis in den System-Prompt ein.
- `"once"`: Fügt für jede eindeutige Kürzungssignatur einmal einen knappen Hinweis ein.
- `"always"`: Fügt bei jeder Ausführung einen knappen Hinweis ein, wenn eine Kürzung vorliegt (empfohlen).

Detaillierte Roh-/Einfügungszahlen und Felder zur Konfigurationsanpassung verbleiben in Diagnosen wie
Kontext-/Statusberichten und Protokollen; der reguläre WebChat-Benutzer-/Laufzeitkontext erhält nur
den knappen Wiederherstellungshinweis.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Zuordnung der Zuständigkeit für Kontextbudgets

OpenClaw verfügt über mehrere Prompt-/Kontextbudgets mit hohem Volumen, die
bewusst nach Subsystem aufgeteilt sind, statt alle über einen einzigen generischen
Regler zu steuern.

| Budget                                                         | Deckt ab                                                                                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | Normale Einfügung des Arbeitsbereichs-Bootstraps                                                                                                                  |
| `agents.defaults.startupContext.*`                             | Einmaliger Vorspann für Modellausführungen beim Zurücksetzen/Starten, einschließlich aktueller täglicher `memory/*.md`-Dateien. Bloße Chat-Befehle `/new` und `/reset` werden bestätigt, ohne das Modell aufzurufen |
| `skills.limits.*`                                              | Die kompakte Skills-Liste, die in den System-Prompt eingefügt wird                                                                                                |
| `agents.defaults.contextLimits.*`                              | Begrenzte Laufzeitauszüge und eingefügte, von der Laufzeit verwaltete Blöcke                                                                                      |
| `memory.qmd.limits.*`                                          | Größenbegrenzung für indizierte Speichersuchauszüge und deren Einfügung                                                                                           |

Entsprechende agent-spezifische Überschreibungen:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Steuert den beim ersten Durchlauf eingefügten Startvorspann für Modellausführungen beim Zurücksetzen/Starten.
Bloße Chat-Befehle `/new` und `/reset` bestätigen das Zurücksetzen, ohne
das Modell aufzurufen, sodass dieser Vorspann nicht geladen wird.

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

- `memoryGetMaxChars`: standardmäßige Obergrenze für `memory_get`-Auszüge, bevor Kürzungsmetadaten
  und ein Fortsetzungshinweis hinzugefügt werden.
- `memoryGetDefaultLines`: standardmäßiges `memory_get`-Zeilenfenster, wenn `lines` nicht
  angegeben ist.
- `toolResultMaxChars`: erweiterte Obergrenze für Live-Tool-Ergebnisse, die für persistierte
  Ergebnisse und die Wiederherstellung bei Überschreitung verwendet wird. Lassen Sie den Wert für die automatische Modellkontext-Obergrenze ungesetzt:
  `16000` Zeichen unter 100K Tokens, `32000` Zeichen bei 100K+ Tokens und `64000`
  Zeichen bei 200K+ Tokens. Explizite Werte bis `1000000` werden für
  Modelle mit langem Kontext akzeptiert, die effektive Obergrenze bleibt jedoch auf etwa 30 % des
  Modellkontextfensters begrenzt. `openclaw doctor --deep` gibt die effektive Obergrenze aus,
  und Doctor warnt nur, wenn eine explizite Überschreibung veraltet oder wirkungslos ist.
- `postCompactionMaxChars`: Obergrenze für AGENTS.md-Auszüge, die bei der
  Aktualisierungseinfügung nach einer Compaction verwendet wird.

#### `agents.list[].contextLimits`

Agent-spezifische Überschreibung für die gemeinsamen `contextLimits`-Regler. Fehlende Felder übernehmen
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
          toolResultMaxChars: 8000, // erweiterte Obergrenze für diesen Agenten
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

Maximale Pixelgröße der längsten Bildseite in Transkript-/Tool-Bildblöcken vor Provider-Aufrufen.
Standard: `1200`.

Niedrigere Werte reduzieren bei screenshotlastigen Ausführungen in der Regel die Nutzung von Vision-Tokens und die Größe der Anfrage-Nutzlast.
Höhere Werte bewahren mehr visuelle Details.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Präferenz für Komprimierung/Detailgrad des Bild-Tools bei Bildern, die aus Dateipfaden, URLs und Medienreferenzen geladen werden.
Standard: `auto`.

OpenClaw passt die Größenänderungsstufen an das ausgewählte Bildmodell an. Beispielsweise können Claude Opus 4.8, OpenAI GPT-5.6 Sol, Qwen VL und gehostete Llama-4-Vision-Modelle größere Bilder als ältere/standardmäßige Vision-Pfade mit hohem Detailgrad verwenden, während Durchläufe mit mehreren Bildern im Modus `auto` stärker komprimiert werden, um Token- und Latenzkosten zu begrenzen.

Werte:

- `auto`: An Modellgrenzen und Bildanzahl anpassen.
- `efficient`: Kleinere Bilder für eine geringere Token- und Byte-Nutzung bevorzugen.
- `balanced`: Die standardmäßige, ausgewogene Größenabstufung verwenden.
- `high`: Mehr Details für Screenshots, Diagramme und Dokumentbilder bewahren.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

Zeitzone für den System-Prompt-Kontext (nicht für Nachrichtenzeitstempel). Fällt auf die Zeitzone des Hosts zurück.

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

- `model`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Die String-Form legt nur das primäre Modell fest.
  - Die Objektform legt das primäre Modell sowie geordnete Failover-Modelle fest.
- `utilityModel`: optionale `provider/model`-Referenz oder optionaler Alias für kurze interne Aufgaben. Derzeit wird dies für generierte Sitzungstitel in der Control UI, Thementitel für Telegram-Direktnachrichten, automatische Thread-Titel in Discord und [Fortschrittsentwurf-Erzählungen](/de/concepts/progress-drafts#narrated-status) verwendet. Wenn nicht festgelegt, leitet OpenClaw den deklarierten Standard des primären Providers für kleine Modelle ab, sofern vorhanden (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`); andernfalls greifen Titelaufgaben auf das primäre Modell des Agenten zurück und die Erzählung bleibt deaktiviert. Legen Sie `utilityModel: ""` fest, um das Utility-Routing vollständig zu deaktivieren. `agents.list[].utilityModel` überschreibt den Standardwert (ein leerer agentenspezifischer Wert deaktiviert es für diesen Agenten), und eine operationsspezifische Modellüberschreibung hat Vorrang vor beiden. Utility-Aufgaben führen separate Modellaufrufe durch und senden aufgabenspezifische Inhalte an den ausgewählten Modell-Provider. Die Titelerzeugung im Dashboard sendet höchstens die ersten 1.000 Zeichen der ersten Nachricht, die kein Befehl ist; die Erzählung sendet die eingehende Anfrage sowie kompakte, redigierte Werkzeugzusammenfassungen. Wählen Sie einen Provider, der Ihren Anforderungen an Kosten und Datenverarbeitung entspricht.
- `imageModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird vom Pfad des Werkzeugs `image` als Konfiguration für das Vision-Modell verwendet.
  - Wird außerdem als Fallback-Routing verwendet, wenn das ausgewählte bzw. standardmäßige Modell keine Bildeingaben akzeptieren kann.
  - Bevorzugen Sie explizite `provider/model`-Referenzen. Reine IDs werden aus Kompatibilitätsgründen akzeptiert; wenn eine reine ID eindeutig einem konfigurierten bildfähigen Eintrag in `models.providers.*.models` entspricht, ergänzt OpenClaw den zugehörigen Provider. Mehrdeutige konfigurierte Treffer erfordern ein explizites Provider-Präfix.
- `imageGenerationModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Bilderzeugungsfunktion und allen zukünftigen Werkzeug-/Plugin-Oberflächen verwendet, die Bilder erzeugen.
  - Typische Werte: `google/gemini-3.1-flash-image-preview` für native Gemini-Bilderzeugung, `fal/fal-ai/flux/dev` für fal, `openai/gpt-image-2` für OpenAI Images oder `openai/gpt-image-1.5` für OpenAI-PNG-/WebP-Ausgabe mit transparentem Hintergrund.
  - Wenn Sie einen Provider bzw. ein Modell direkt auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung (beispielsweise `GEMINI_API_KEY` oder `GOOGLE_API_KEY` für `google/*`, `OPENAI_API_KEY` oder OpenAI Codex OAuth für `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` für `fal/*`).
  - Wenn nicht angegeben, kann `image_generate` weiterhin einen durch Authentifizierung gestützten Provider-Standard ableiten. Dabei wird zuerst der aktuelle Standard-Provider und anschließend die übrigen registrierten Bilderzeugungs-Provider in der Reihenfolge ihrer Provider-IDs versucht.
- `musicGenerationModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Musikerzeugungsfunktion und dem integrierten Werkzeug `music_generate` verwendet.
  - Typische Werte: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` oder `minimax/music-2.6`.
  - Wenn nicht angegeben, kann `music_generate` weiterhin einen durch Authentifizierung gestützten Provider-Standard ableiten. Dabei wird zuerst der aktuelle Standard-Provider und anschließend die übrigen registrierten Musikerzeugungs-Provider in der Reihenfolge ihrer Provider-IDs versucht.
  - Wenn Sie einen Provider bzw. ein Modell direkt auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung bzw. den passenden API-Schlüssel.
- `videoGenerationModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Videoerzeugungsfunktion und dem integrierten Werkzeug `video_generate` verwendet.
  - Typische Werte: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` oder `qwen/wan2.7-r2v`.
  - Wenn nicht angegeben, kann `video_generate` weiterhin einen durch Authentifizierung gestützten Provider-Standard ableiten. Dabei wird zuerst der aktuelle Standard-Provider und anschließend die übrigen registrierten Videoerzeugungs-Provider in der Reihenfolge ihrer Provider-IDs versucht.
  - Wenn Sie einen Provider bzw. ein Modell direkt auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung bzw. den passenden API-Schlüssel.
  - Das offizielle Qwen-Plugin zur Videoerzeugung unterstützt bis zu 1 Ausgabevideo, 1 Eingabebild, 4 Eingabevideos, eine Dauer von 10 Sekunden sowie die Optionen `size`, `aspectRatio`, `resolution`, `audio` und `watermark` auf Provider-Ebene.
- `pdfModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird vom Werkzeug `pdf` für das Modell-Routing verwendet.
  - Wenn nicht angegeben, greift das PDF-Werkzeug zunächst auf `imageModel` und anschließend auf das aufgelöste Sitzungs-/Standardmodell zurück.
- `pdfMaxBytesMb`: standardmäßige PDF-Größenbegrenzung für das Werkzeug `pdf`, wenn beim Aufruf kein `maxBytesMb` übergeben wird.
- `pdfMaxPages`: standardmäßige maximale Anzahl der Seiten, die im Extraktions-Fallback-Modus des Werkzeugs `pdf` berücksichtigt werden.
- `verboseDefault`: standardmäßige Ausführlichkeitsstufe für Agenten. Werte: `"off"`, `"on"`, `"full"`. Standard: `"off"`.
- `toolProgressDetail`: Detailmodus für Werkzeugzusammenfassungen von `/verbose` und Werkzeugzeilen in Fortschrittsentwürfen. Werte: `"explain"` (Standard, kompakte menschenlesbare Bezeichnungen) oder `"raw"` (hängt den unverarbeiteten Befehl bzw. Details an, sofern verfügbar). Das agentenspezifische `agents.list[].toolProgressDetail` überschreibt diesen Standardwert.
- `reasoningDefault`: standardmäßige Sichtbarkeit der Schlussfolgerungen für Agenten. Werte: `"off"`, `"on"`, `"stream"`. Das agentenspezifische `agents.list[].reasoningDefault` überschreibt diesen Standardwert. Konfigurierte Standardwerte für Schlussfolgerungen werden nur für Eigentümer, autorisierte Absender oder Gateway-Kontexte mit Operator-Administratorrechten angewendet, wenn keine nachrichten- oder sitzungsspezifische Überschreibung für Schlussfolgerungen festgelegt ist.
- `elevatedDefault`: standardmäßige Stufe für privilegierte Ausgaben von Agenten. Werte: `"off"`, `"on"`, `"ask"`, `"full"`. Standard: `"on"`.
- `model.primary`: Format `provider/model` (z. B. `openai/gpt-5.6-sol` für den Zugriff über Codex OAuth). Wenn Sie den Provider weglassen, versucht OpenClaw zunächst einen Alias, dann einen eindeutigen Treffer bei konfigurierten Providern für genau diese Modell-ID und greift erst danach auf den konfigurierten Standard-Provider zurück (veraltetes Kompatibilitätsverhalten; bevorzugen Sie daher ein explizites `provider/model`). Wenn dieser Provider das konfigurierte Standardmodell nicht mehr bereitstellt, greift OpenClaw auf den ersten konfigurierten Provider bzw. das erste konfigurierte Modell zurück, anstatt einen veralteten Standardwert eines entfernten Providers anzuzeigen.
- `models`: der konfigurierte Modellkatalog und die Zulassungsliste für `/model`. Jeder Eintrag kann `alias` (Kurzform) und `params` (Provider-spezifisch, beispielsweise `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, OpenRouter-`provider`-Routing, `chat_template_kwargs`, `extra_body`/`extraBody`) enthalten.
  - Verwenden Sie `provider/*`-Einträge wie `"openai/*": {}` oder `"vllm/*": {}`, um alle erkannten Modelle ausgewählter Provider anzuzeigen, ohne jede Modell-ID manuell aufzuführen.
  - Fügen Sie einem `provider/*`-Eintrag `agentRuntime` hinzu, wenn jedes für diesen Provider dynamisch erkannte Modell dieselbe Laufzeit verwenden soll. Die Laufzeitrichtlinie eines exakten `provider/model` hat weiterhin Vorrang vor dem Platzhalter.
  - Sichere Änderungen: Verwenden Sie `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, um Einträge hinzuzufügen. `config set` lehnt Ersetzungen ab, die vorhandene Einträge der Zulassungsliste entfernen würden, sofern Sie nicht `--replace` übergeben.
  - Provider-spezifische Konfigurations-/Onboarding-Abläufe führen die ausgewählten Provider-Modelle mit dieser Zuordnung zusammen und behalten bereits konfigurierte, nicht betroffene Provider bei.
  - Für direkte OpenAI-Responses-Modelle wird die serverseitige Compaction automatisch aktiviert. Verwenden Sie `params.responsesServerCompaction: false`, um die Einfügung von `context_management` zu unterbinden, oder `params.responsesCompactThreshold`, um den Schwellenwert zu überschreiben. Siehe [serverseitige OpenAI-Compaction](/de/providers/openai#advanced-configuration).
- `params`: globale standardmäßige Provider-Parameter, die auf alle Modelle angewendet werden. Festzulegen unter `agents.defaults.params` (z. B. `{ cacheRetention: "long" }`).
- Zusammenführungsrangfolge für `params` (Konfiguration): `agents.defaults.params` (globale Basis) wird durch `agents.defaults.models["provider/model"].params` (modellspezifisch) überschrieben; anschließend überschreibt `agents.list[].params` (bei übereinstimmender Agenten-ID) die Werte schlüsselweise. Einzelheiten finden Sie unter [Prompt-Caching](/de/reference/prompt-caching).
- `models.providers.openrouter.params.provider`: OpenRouter-weiter Standard für die Provider-Routing-Richtlinie. OpenClaw leitet diesen an das `provider`-Objekt der OpenRouter-Anfrage weiter; modellspezifische `agents.defaults.models["openrouter/<model>"].params.provider` und Agentenparameter überschreiben ihn schlüsselweise. Siehe [OpenRouter-Provider-Routing](/de/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: erweitertes, unverändert weitergereichtes JSON, das mit den Anfragetexten von `api: "openai-completions"` für OpenAI-kompatible Proxys zusammengeführt wird. Bei einer Kollision mit erzeugten Anfrageschlüsseln hat der zusätzliche Anfragetext Vorrang; nicht native Completions-Routen entfernen anschließend weiterhin das ausschließlich für OpenAI vorgesehene `store`.
- `params.chat_template_kwargs`: vLLM-/OpenAI-kompatible Chat-Template-Argumente, die mit den Anfragetexten der obersten Ebene von `api: "openai-completions"` zusammengeführt werden. Für `vllm/nemotron-3-*` bei deaktiviertem Denken sendet das gebündelte vLLM-Plugin automatisch `enable_thinking: false` und `force_nonempty_content: true`; explizite `chat_template_kwargs` überschreiben erzeugte Standardwerte, und `extra_body.chat_template_kwargs` hat weiterhin die endgültige Priorität. Konfigurierte vLLM-Qwen- und Nemotron-Denkmodelle stellen binäre `/think`-Optionen (`off`, `on`) anstelle der mehrstufigen Aufwandsstaffel bereit.
- `compat.thinkingFormat`: OpenAI-kompatibles Format der Denk-Nutzdaten. Verwenden Sie `"together"` für `reasoning.enabled` im Together-Stil, `"qwen"` für `enable_thinking` auf oberster Ebene im Qwen-Stil oder `"qwen-chat-template"` für `chat_template_kwargs.enable_thinking` bei Backends der Qwen-Familie, die Chat-Template-Kwargs auf Anfrageebene unterstützen, etwa vLLM. OpenClaw ordnet deaktiviertes Denken `false` und aktiviertes Denken `true` zu; konfigurierte vLLM-Qwen-Modelle stellen für diese Formate binäre `/think`-Optionen bereit.
- `compat.supportedReasoningEfforts`: modellspezifische Liste OpenAI-kompatibler Schlussfolgerungsaufwände. Nehmen Sie `"xhigh"` für benutzerdefinierte Endpunkte auf, die diesen Wert tatsächlich akzeptieren; OpenClaw stellt dann `/think xhigh` in Befehlsmenüs, Gateway-Sitzungszeilen, der Validierung von Sitzungsänderungen, der Agenten-CLI-Validierung und der `llm-task`-Validierung für diesen konfigurierten Provider bzw. dieses Modell bereit. Verwenden Sie `compat.reasoningEffortMap`, wenn das Backend für eine kanonische Stufe einen Provider-spezifischen Wert erwartet.
- `params.preserveThinking`: ausschließlich für Z.AI vorgesehene Opt-in-Option zur Beibehaltung des Denkverlaufs. Wenn sie aktiviert und das Denken eingeschaltet ist, sendet OpenClaw `thinking.clear_thinking: false` und spielt vorherige `reasoning_content` erneut ein; siehe [Z.AI-Denken und beibehaltener Denkverlauf](/de/providers/zai#advanced-configuration).
- `localService`: optionaler Prozessmanager auf Provider-Ebene für lokale bzw. selbst gehostete Modellserver. Wenn das ausgewählte Modell zu diesem Provider gehört, prüft OpenClaw `healthUrl` (oder `baseUrl + "/models"`), startet bei nicht erreichbarem Endpunkt `command` mit `args`, wartet bis zu `readyTimeoutMs` und sendet anschließend die Modellanfrage. `command` muss ein absoluter Pfad sein. `idleStopMs: 0` hält den Prozess bis zum Beenden von OpenClaw aktiv; ein positiver Wert beendet den von OpenClaw gestarteten Prozess nach entsprechend vielen Millisekunden Inaktivität. Siehe [Lokale Modelldienste](/de/gateway/local-model-services).
- Laufzeitrichtlinien gehören zu Providern oder Modellen, nicht zu `agents.defaults`. Verwenden Sie `models.providers.<provider>.agentRuntime` für Provider-weite Regeln oder `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` für modellspezifische Regeln. Ein Provider-/Modellpräfix allein wählt niemals ein Harness aus. Wenn die Laufzeit nicht festgelegt oder auf `auto` gesetzt ist, kann OpenAI Codex nur für eine exakt passende offizielle HTTPS-Route für Platform Responses oder ChatGPT Responses ohne benutzerdefinierte Anfrageüberschreibung implizit auswählen. Siehe [Implizite OpenAI-Agentenlaufzeit](/de/providers/openai#implicit-agent-runtime).
- Konfigurationsschreiber, die diese Felder ändern (beispielsweise `/models set`, `/models set-image` sowie Befehle zum Hinzufügen/Entfernen von Fallbacks), speichern die kanonische Objektform und behalten vorhandene Fallback-Listen nach Möglichkeit bei.
- `maxConcurrent`: maximale Anzahl paralleler Agentenausführungen über Sitzungen hinweg (jede Sitzung wird weiterhin serialisiert). Standard: `4`.

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

- `id`: `"auto"`, `"openclaw"`, die ID eines registrierten Plugin-Harness oder ein unterstützter Alias eines CLI-Backends. Das mitgelieferte Codex-Plugin registriert `codex`; das mitgelieferte Anthropic-Plugin stellt das CLI-Backend `claude-cli` bereit.
- Mit `id: "auto"` können registrierte Plugin-Harnesses effektive Routen übernehmen, die ihren Unterstützungsvertrag deklarieren oder anderweitig erfüllen; wenn kein Harness passt, wird OpenClaw verwendet. Eine explizite Plugin-Laufzeit wie `id: "codex"` erfordert dieses Harness und eine kompatible effektive Route; sie schlägt sicher fehl, wenn eines von beiden nicht verfügbar ist oder die Ausführung fehlschlägt.
- `id: "pi"` wird nur als veralteter Alias für `openclaw` akzeptiert, um ausgelieferte Konfigurationen aus v2026.5.22 und früher beizubehalten. Neue Konfigurationen sollten `openclaw` verwenden.
- Bei der Laufzeitpräzedenz gilt zuerst die Richtlinie für das exakte Modell (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` oder `models.providers.<provider>.models[]`), dann `agents.list[]` / `agents.defaults.models["provider/*"]` und anschließend die Provider-weite Richtlinie unter `models.providers.<provider>.agentRuntime`.
- Laufzeitschlüssel für den gesamten Agenten sind veraltet. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, Laufzeit-Pins für Sitzungen und `OPENCLAW_AGENT_RUNTIME` werden bei der Laufzeitauswahl ignoriert. Führen Sie `openclaw doctor --fix` aus, um veraltete Werte zu entfernen.
- Geeignete offizielle exakte HTTPS-Routen für OpenAI Responses/ChatGPT ohne vom Autor festgelegte Anfrageüberschreibung können das Codex-Harness implizit verwenden. `agentRuntime.id: "codex"` für Provider/Modell macht Codex zu einer Anforderung, bei deren Nichterfüllung die Ausführung sicher fehlschlägt, macht eine inkompatible Route jedoch nicht kompatibel.
- Bevorzugen Sie für Claude-CLI-Bereitstellungen `model: "anthropic/claude-opus-4-8"` zusammen mit dem modellspezifischen `agentRuntime.id: "claude-cli"`. Veraltete Referenzen im Format `claude-cli/<model>` funktionieren aus Kompatibilitätsgründen weiterhin, neue Konfigurationen sollten die Provider-/Modellauswahl jedoch kanonisch halten und das Ausführungs-Backend in der Laufzeitrichtlinie für Provider/Modell festlegen.
- Dies steuert nur die Ausführung textbasierter Agenten-Turns. Mediengenerierung, Bilderkennung, PDF, Musik, Video und TTS verwenden weiterhin ihre jeweiligen Provider-/Modelleinstellungen.

**Integrierte Alias-Kurzformen** (gelten nur, wenn das Modell in `agents.defaults.models` enthalten ist):

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

Ihre konfigurierten Aliase haben immer Vorrang vor den Standardwerten.

Z.AI-GLM-4.x-Modelle aktivieren automatisch den Denkmodus, sofern Sie nicht `--thinking off` festlegen oder `agents.defaults.models["zai/<model>"].params.thinking` selbst definieren.
Z.AI-Modelle aktivieren standardmäßig `tool_stream` für das Streaming von Werkzeugaufrufen. Setzen Sie `agents.defaults.models["zai/<model>"].params.tool_stream` auf `false`, um es zu deaktivieren.
Bei Anthropic Claude Opus 4.8 bleibt das Denken in OpenClaw standardmäßig deaktiviert; wenn adaptives Denken explizit aktiviert wird, ist der vom Anthropic-Provider vorgegebene Standardwert für den Aufwand `high`. Claude-4.6-Modelle verwenden standardmäßig `adaptive`, wenn keine explizite Denkstufe festgelegt ist.

### `agents.defaults.cliBackends`

Optionale CLI-Backends für reine Text-Fallback-Ausführungen (keine Werkzeugaufrufe). Nützlich als Ausweichlösung, wenn API-Provider ausfallen.

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
          // Oder verwenden Sie systemPromptFileArg, wenn die CLI ein Flag für eine Prompt-Datei akzeptiert.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI-Backends sind primär textbasiert; Werkzeuge sind immer deaktiviert.
- Sitzungen werden unterstützt, wenn `sessionArg` festgelegt ist.
- Die Durchleitung von Bildern wird unterstützt, wenn `imageArg` Dateipfade akzeptiert.
- Mit `reseedFromRawTranscriptWhenUncompacted: true` kann ein Backend sichere
  ungültig gewordene Sitzungen aus dem begrenzten Ende eines OpenClaw-Rohtranskripts wiederherstellen, bevor die
  erste Compaction-Zusammenfassung vorhanden ist. Änderungen am Authentifizierungsprofil oder an der Zugangsdaten-Epoche
  führen dennoch niemals zu einer Wiederherstellung aus Rohdaten.

### `agents.defaults.promptOverlays`

Provider-unabhängige Prompt-Overlays, die nach Modellfamilie auf von OpenClaw zusammengestellte Prompt-Oberflächen angewendet werden. Modell-IDs der GPT-5-Familie erhalten den gemeinsamen Verhaltensvertrag über OpenClaw-/Provider-Routen hinweg; `personality` steuert nur die Ebene für einen freundlichen Interaktionsstil. Native Codex-App-Server-Routen behalten die Codex-eigenen Basis-/Modellanweisungen anstelle dieses OpenClaw-GPT-5-Overlays bei, und OpenClaw deaktiviert die integrierte Persönlichkeit von Codex für native Threads.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // freundlich | ein | aus
        },
      },
    },
  },
}
```

- `"friendly"` (Standard) und `"on"` aktivieren die Ebene für einen freundlichen Interaktionsstil.
- `"off"` deaktiviert nur die freundliche Ebene; der gekennzeichnete GPT-5-Verhaltensvertrag bleibt aktiviert.
- Das veraltete `plugins.entries.openai.config.personality` wird weiterhin gelesen, wenn diese gemeinsame Einstellung nicht gesetzt ist.

### `agents.defaults.heartbeat`

Regelmäßige Heartbeat-Ausführungen.

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
        isolatedSession: false, // Standard: false; true führt jeden Heartbeat in einer neuen Sitzung aus (ohne Konversationsverlauf)
        skipWhenBusy: false, // Standard: false; true wartet auch auf die Subagent-/verschachtelten Ausführungspfade dieses Agenten
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (Standard) | block
        target: "none", // Standard: none | Optionen: last | whatsapp | telegram | discord | ...
        prompt: "HEARTBEAT.md lesen, falls die Datei vorhanden ist...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: Zeitdauerzeichenfolge (ms/s/m/h). Standard: `30m` (API-Schlüssel-Authentifizierung) oder `1h` (OAuth-Authentifizierung). Zum Deaktivieren auf `0m` setzen.
- `includeSystemPromptSection`: Wenn false, wird der Heartbeat-Abschnitt im System-Prompt ausgelassen und die Einfügung von `HEARTBEAT.md` in den Bootstrap-Kontext übersprungen. Standard: `true`.
- `suppressToolErrorWarnings`: Wenn true, werden Warnnutzlasten zu Tool-Fehlern während Heartbeat-Ausführungen unterdrückt.
- `timeoutSeconds`: Maximal zulässige Zeit in Sekunden für einen Heartbeat-Agentendurchlauf, bevor er abgebrochen wird. Nicht setzen, um den Wert von `agents.defaults.timeoutSeconds` zu verwenden, sofern dieser gesetzt ist; andernfalls wird das Heartbeat-Intervall mit einer Obergrenze von 600 Sekunden verwendet.
- `directPolicy`: Richtlinie für direkte Zustellung/DM-Zustellung. `allow` (Standard) erlaubt die Zustellung an direkte Ziele. `block` unterdrückt die Zustellung an direkte Ziele und gibt `reason=dm-blocked` aus.
- `lightContext`: Wenn true, verwenden Heartbeat-Ausführungen einen schlanken Bootstrap-Kontext und behalten aus den Workspace-Bootstrap-Dateien nur `HEARTBEAT.md` bei.
- `isolatedSession`: Wenn true, wird jeder Heartbeat in einer neuen Sitzung ohne vorherigen Konversationsverlauf ausgeführt. Dasselbe Isolationsmuster wie bei Cron mit `sessionTarget: "isolated"`. Reduziert die Token-Kosten pro Heartbeat von ~100K auf ~2-5K Token.
- `skipWhenBusy`: Wenn true, werden Heartbeat-Ausführungen bei zusätzlichen ausgelasteten Ausführungspfaden dieses Agenten zurückgestellt: bei seiner eigenen sitzungsschlüsselgebundenen Subagent-Arbeit oder verschachtelten Befehlsarbeit. Cron-Ausführungspfade stellen Heartbeats immer zurück, auch ohne dieses Flag.
- Pro Agent: `agents.list[].heartbeat` setzen. Wenn ein Agent `heartbeat` definiert, führen **nur diese Agenten** Heartbeats aus.
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
        identifierInstructions: "Bereitstellungs-IDs, Ticket-IDs und Host:Port-Paare exakt beibehalten.", // verwendet, wenn identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optionale Prüfung auf Belastung der Tool-Schleife
        postIndexSync: "async", // off | async | await
        postCompactionSections: ["Session Startup", "Red Lines"], // AGENTS.md-Abschnitte für die erneute Einfügung explizit aktivieren
        model: "openrouter/anthropic/claude-sonnet-4-6", // optionale Modellüberschreibung nur für Compaction
        truncateAfterCompaction: true, // nach der Compaction zu einer kleineren nachfolgenden JSONL-Datei rotieren
        maxActiveTranscriptBytes: "20mb", // optionaler Vorab-Auslöser für lokale Compaction
        notifyUser: true, // Benachrichtigungen bei Beginn/Abschluss der Compaction und bei Beeinträchtigung des Speicher-Flushs (Standard: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // optionale Modellüberschreibung nur für den Speicher-Flush
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
          systemPrompt: "Die Sitzung nähert sich der Compaction. Dauerhafte Erinnerungen jetzt speichern.",
          prompt: "Alle dauerhaften Notizen in memory/YYYY-MM-DD.md schreiben; mit dem exakten stillen Token NO_REPLY antworten, wenn nichts zu speichern ist.",
        },
      },
    },
  },
}
```

- `mode`: `default` oder `safeguard` (abschnittsweise Zusammenfassung für lange Verläufe). Siehe [Compaction](/de/concepts/compaction).
- `provider`: ID eines registrierten Compaction-Provider-Plugins. Wenn festgelegt, wird `summarize()` des Providers anstelle der integrierten LLM-Zusammenfassung aufgerufen. Bei einem Fehler wird auf die integrierte Zusammenfassung zurückgegriffen. Das Festlegen eines Providers erzwingt `mode: "safeguard"`. Siehe [Compaction](/de/concepts/compaction).
- `timeoutSeconds`: maximale Anzahl von Sekunden, die für einen einzelnen Compaction-Vorgang zulässig ist, bevor OpenClaw ihn abbricht. Standard: `180`.
- `reserveTokens`: Token-Reserve, die nach der Compaction für die Modellausgabe und zukünftige Tool-Ergebnisse verfügbar bleibt. Wenn das Kontextfenster des Modells bekannt ist, begrenzt OpenClaw die effektive Reserve, damit sie das Prompt-Budget nicht aufbrauchen kann.
- `reserveTokensFloor`: vom eingebetteten Runtime erzwungene Mindestreserve. Legen Sie `0` fest, um die Untergrenze zu deaktivieren. Die Untergrenze unterliegt weiterhin der aktiven Begrenzung des Kontextfensters.
- `keepRecentTokens`: Budget für den Trennpunkt des Agents, um das neueste Ende des Transkripts unverändert beizubehalten. Manuelles `/compact` berücksichtigt dies, wenn es ausdrücklich festgelegt ist; andernfalls ist die manuelle Compaction ein fester Prüfpunkt.
- `recentTurnsPreserve`: Anzahl der neuesten Benutzer-/Assistenten-Runden, die außerhalb der Safeguard-Zusammenfassung unverändert beibehalten werden. Standard: `3`.
- `maxHistoryShare`: maximaler Anteil des gesamten Kontextbudgets, der nach der Compaction für den beibehaltenen Verlauf zulässig ist (Bereich `0.1`-`0.9`).
- `identifierPolicy`: `strict` (Standard), `off` oder `custom`. `strict` stellt bei der Compaction-Zusammenfassung integrierte Anweisungen zur Beibehaltung undurchsichtiger Bezeichner voran.
- `identifierInstructions`: optionaler benutzerdefinierter Text zur Beibehaltung von Bezeichnern, der verwendet wird, wenn `identifierPolicy=custom` gilt.
- `qualityGuard`: Prüfungen mit erneutem Versuch bei fehlerhaft formatierter Ausgabe für Safeguard-Zusammenfassungen. Im Safeguard-Modus standardmäßig aktiviert; legen Sie `enabled: false` fest, um die Prüfung zu überspringen.
- `midTurnPrecheck`: optionale Prüfung des Tool-Schleifendrucks. Wenn `enabled: true` festgelegt ist, prüft OpenClaw den Kontextdruck, nachdem Tool-Ergebnisse angehängt wurden und bevor das Modell erneut aufgerufen wird. Wenn der Kontext nicht mehr passt, bricht es den aktuellen Versuch vor dem Absenden des Prompts ab und verwendet den bestehenden Wiederherstellungspfad der Vorabprüfung erneut, um Tool-Ergebnisse zu kürzen oder eine Compaction durchzuführen und den Versuch zu wiederholen. Funktioniert sowohl mit dem Compaction-Modus `default` als auch mit `safeguard`. Standard: deaktiviert.
- `postIndexSync`: Modus zur Neuindizierung des Sitzungsspeichers nach der Compaction. Standard: `"async"`. Verwenden Sie `"await"` für die höchste Aktualität, `"async"` für eine geringere Compaction-Latenz oder `"off"` nur, wenn die Synchronisierung des Sitzungsspeichers anderweitig verarbeitet wird.
- `postCompactionSections`: optionale Namen von H2-/H3-Abschnitten aus AGENTS.md, die nach der Compaction erneut eingefügt werden. Das erneute Einfügen ist deaktiviert, wenn die Einstellung nicht gesetzt oder auf `[]` gesetzt ist. Durch ausdrückliches Festlegen von `["Session Startup", "Red Lines"]` wird dieses Paar aktiviert und der bisherige Fallback `Every Session`/`Safety` beibehalten. Aktivieren Sie dies nur, wenn der zusätzliche Kontext das Risiko wert ist, bereits in der Compaction-Zusammenfassung erfasste Projektanweisungen zu duplizieren.
- `model`: optionale Angabe `provider/model-id` oder reiner Alias aus `agents.defaults.models`, ausschließlich für die Compaction-Zusammenfassung. Reine Aliasse werden vor der Weiterleitung aufgelöst; konfigurierte wörtliche Modell-IDs behalten bei Kollisionen Vorrang. Verwenden Sie dies, wenn die Hauptsitzung ein Modell beibehalten, Compaction-Zusammenfassungen jedoch mit einem anderen Modell ausführen soll; wenn nicht festgelegt, verwendet die Compaction das primäre Modell der Sitzung.
- `truncateAfterCompaction`: rotiert das aktive Sitzungstranskript nach der Compaction, sodass zukünftige Runden nur die Zusammenfassung und das nicht zusammengefasste Ende laden, während das vorherige vollständige Transkript archiviert bleibt. Verhindert ein unbegrenztes Wachstum des aktiven Transkripts in lang laufenden Sitzungen. Standard: `false`.
- `maxActiveTranscriptBytes`: optionaler Byte-Schwellenwert (`number` oder Zeichenfolgen wie `"20mb"`), der vor einer Ausführung eine normale lokale Compaction auslöst, wenn der Transkriptverlauf den Schwellenwert überschreitet. Erfordert `truncateAfterCompaction`, damit eine erfolgreiche Compaction zu einem kleineren Nachfolgetranskript rotieren kann. Deaktiviert, wenn nicht festgelegt oder auf `0` gesetzt.
- `notifyUser`: sendet bei `true` kurze Hinweise zur Kontextpflege an den Benutzer: wenn die Compaction beginnt und abgeschlossen ist (zum Beispiel „Kontext wird komprimiert ...“ und „Compaction abgeschlossen“), und wenn eine Speicherleerung vor der Compaction ausgeschöpft ist, sodass die Antwort in einem eingeschränkten Zustand fortgesetzt wird (zum Beispiel „Die Speicherpflege ist vorübergehend fehlgeschlagen; Ihre Antwort wird fortgesetzt.“). Standardmäßig deaktiviert, damit diese Hinweise nicht angezeigt werden.
- `memoryFlush`: stille agentische Runde vor der automatischen Compaction, um dauerhafte Erinnerungen zu speichern. Legen Sie `model` auf einen exakten Provider/ein exaktes Modell wie `ollama/qwen3:8b` fest, wenn diese Wartungsrunde auf einem lokalen Modell verbleiben soll; die Überschreibung übernimmt nicht die aktive Fallback-Kette der Sitzung. `forceFlushTranscriptBytes` erzwingt die Leerung, wenn die Transkriptgröße den Schwellenwert erreicht, selbst wenn die Token-Zähler veraltet sind. Wird übersprungen, wenn der Arbeitsbereich schreibgeschützt ist.

### `agents.defaults.runRetries`

Grenzen für die Wiederholungsiterationen der äußeren Ausführungsschleife des eingebetteten Agent-Runtime, um Endlosschleifen während der Fehlerbehebung zu verhindern. Diese Einstellung gilt nur für den eingebetteten Agent-Runtime, nicht für ACP- oder CLI-Runtimes.

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

Entfernt **alte Tool-Ergebnisse** aus dem Arbeitsspeicherkontext, bevor dieser an das LLM gesendet wird. Ändert den Sitzungsverlauf auf dem Datenträger **nicht**. Standardmäßig deaktiviert; legen Sie zum Aktivieren `mode: "cache-ttl"` fest.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // aus (Standard) | cache-ttl
        ttl: "1h", // Dauer (ms/s/m/h), Standardeinheit: Minuten; Standard: 5m
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
- `ttl` steuert, wie häufig die Bereinigung erneut ausgeführt werden kann (nach dem letzten Cache-Zugriff). Standard: `5m`.
- Die Bereinigung kürzt zunächst übergroße Tool-Ergebnisse behutsam und löscht anschließend bei Bedarf ältere Tool-Ergebnisse vollständig.
- `softTrimRatio` und `hardClearRatio` akzeptieren Werte von `0.0` bis `1.0`; die Konfigurationsvalidierung weist Werte außerhalb dieses Bereichs zurück.

**Behutsames Kürzen** behält Anfang und Ende bei und fügt in der Mitte `...` ein.

**Vollständiges Löschen** ersetzt das gesamte Tool-Ergebnis durch den Platzhalter.

Hinweise:

- Bildblöcke werden niemals gekürzt oder gelöscht.
- Verhältnisse basieren auf Zeichen (näherungsweise), nicht auf exakten Token-Anzahlen.
- Wenn weniger als `keepLastAssistants` Assistentennachrichten vorhanden sind, wird die Bereinigung übersprungen.

</Accordion>

Weitere Einzelheiten zum Verhalten finden Sie unter [Sitzungsbereinigung](/de/concepts/session-pruning).

### Block-Streaming

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // ein | aus
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200, breakPreference: "paragraph" },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // aus (Standard) | natural | custom (minMs/maxMs verwenden)
    },
  },
}
```

- Kanäle außer Telegram erfordern ausdrücklich `*.blockStreaming: true`, um Blockantworten zu aktivieren.
- Kanalüberschreibungen: `channels.<channel>.blockStreamingCoalesce` (sowie Varianten pro Konto). Discord, Google Chat, Mattermost, MS Teams, Signal und Slack verwenden standardmäßig `minChars: 1500` / `idleMs: 1000`.
- `blockStreamingChunk.breakPreference`: bevorzugte Abschnittsgrenze (`"paragraph" | "newline" | "sentence"`).
- `humanDelay`: zufällige Pause zwischen Blockantworten. Standard: `off`. `natural` = 800-2500ms. `custom` verwendet `minMs`/`maxMs` (für jede nicht festgelegte Grenze wird auf den natürlichen Bereich zurückgegriffen). Überschreibung pro Agent: `agents.list[].humanDelay`.

Weitere Einzelheiten zum Verhalten und zur Abschnittsbildung finden Sie unter [Streaming](/de/concepts/streaming).

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
- Standard für `typingIntervalSeconds`: `6`.
- Überschreibungen pro Sitzung: `session.typingMode`, `session.typingIntervalSeconds`.

Siehe [Tippindikatoren](/de/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Optionale Sandbox-Isolierung für den eingebetteten Agent. Die vollständige Anleitung finden Sie unter [Sandbox-Isolierung](/de/gateway/sandboxing).

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // aus (Standard) | non-main | all
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

Die oben gezeigten Standardwerte (`off`/`docker`/`agent`/`none`/Image `bookworm-slim`/Netzwerk `none`/usw.) sind die tatsächlichen OpenClaw-Standardwerte und nicht nur beispielhafte Werte.

<Accordion title="Sandbox-Details">

**Backend:**

- `docker`: lokale Docker-Laufzeit (Standard)
- `ssh`: generische, SSH-gestützte Remote-Laufzeit
- `openshell`: OpenShell-Laufzeit

Wenn `backend: "openshell"` ausgewählt ist, werden laufzeitspezifische Einstellungen nach
`plugins.entries.openshell.config` verschoben.

**SSH-Backend-Konfiguration:**

- `target`: SSH-Ziel im Format `user@host[:port]`
- `command`: SSH-Client-Befehl (Standard: `ssh`)
- `workspaceRoot`: absoluter Remote-Stammordner für Arbeitsbereiche pro Geltungsbereich (Standard: `/tmp/openclaw-sandboxes`)
- `identityFile` / `certificateFile` / `knownHostsFile`: vorhandene lokale Dateien, die an OpenSSH übergeben werden
- `identityData` / `certificateData` / `knownHostsData`: Inline-Inhalte oder SecretRefs, die OpenClaw zur Laufzeit in temporären Dateien materialisiert
- `strictHostKeyChecking` / `updateHostKeys`: Einstellungen für die OpenSSH-Hostschlüsselrichtlinie (beide standardmäßig `true`)

**Priorität der SSH-Authentifizierung:**

- `identityData` hat Vorrang vor `identityFile`
- `certificateData` hat Vorrang vor `certificateFile`
- `knownHostsData` hat Vorrang vor `knownHostsFile`
- SecretRef-gestützte `*Data`-Werte werden vor Beginn der Sandbox-Sitzung aus dem aktiven Laufzeit-Snapshot der Secrets aufgelöst

**Verhalten des SSH-Backends:**

- initialisiert den Remote-Arbeitsbereich einmal nach der Erstellung oder Neuerstellung
- verwendet anschließend den Remote-SSH-Arbeitsbereich als kanonische Quelle
- leitet `exec`, Dateiwerkzeuge und Medienpfade über SSH
- synchronisiert Remote-Änderungen nicht automatisch zurück zum Host
- unterstützt keine Sandbox-Browser-Container

**Zugriff auf den Arbeitsbereich:**

- `none`: Sandbox-Arbeitsbereich pro Geltungsbereich unter `~/.openclaw/sandboxes` (Standard)
- `ro`: Sandbox-Arbeitsbereich unter `/workspace`, Agent-Arbeitsbereich schreibgeschützt unter `/agent` eingehängt
- `rw`: Agent-Arbeitsbereich mit Lese-/Schreibzugriff unter `/workspace` eingehängt

**Geltungsbereich:**

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

- `mirror`: Remote-Bereich vor der Ausführung aus dem lokalen Bereich initialisieren und nach der Ausführung zurücksynchronisieren; der lokale Arbeitsbereich bleibt kanonisch
- `remote`: Remote-Bereich einmal bei Erstellung der Sandbox initialisieren und anschließend den Remote-Arbeitsbereich als kanonische Quelle verwenden

Im Modus `remote` werden lokale Änderungen auf dem Host, die außerhalb von OpenClaw vorgenommen wurden, nach dem Initialisierungsschritt nicht automatisch in die Sandbox synchronisiert.
Der Transport erfolgt per SSH in die OpenShell-Sandbox, das Plugin verwaltet jedoch den Lebenszyklus der Sandbox und die optionale Spiegelsynchronisierung.

**`setupCommand`** wird einmal nach der Container-Erstellung ausgeführt (über `sh -lc`). Erfordert ausgehenden Netzwerkzugriff, einen beschreibbaren Stammordner und den Root-Benutzer.

**Container verwenden standardmäßig `network: "none"`** – setzen Sie den Wert auf `"bridge"` (oder ein benutzerdefiniertes Bridge-Netzwerk), wenn der Agent ausgehenden Zugriff benötigt.
`"host"` ist gesperrt. `"container:<id>"` ist standardmäßig gesperrt, sofern Sie nicht ausdrücklich
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` festlegen (Notfalloption).
Codex-App-Server-Durchläufe in einer aktiven OpenClaw-Sandbox verwenden dieselbe Einstellung für ausgehenden Zugriff für ihren nativen Netzwerkzugriff im Code-Modus.

**Eingehende Anhänge** werden unter `media/inbound/*` im aktiven Arbeitsbereich bereitgestellt.

**`docker.binds`** hängt zusätzliche Host-Verzeichnisse ein; globale und agentspezifische Bind-Mounts werden zusammengeführt.

**Sandbox-Browser** (`sandbox.browser.enabled`, Standard `false`): Chromium + CDP in einem Container. Die noVNC-URL wird in den System-Prompt eingefügt. Erfordert nicht `browser.enabled` in `openclaw.json`.
Der noVNC-Beobachterzugriff verwendet standardmäßig VNC-Authentifizierung, und OpenClaw erzeugt eine kurzlebige Token-URL (anstatt das Passwort in der gemeinsam genutzten URL offenzulegen).

- `allowHostControl: false` (Standard) verhindert, dass Sandbox-Sitzungen den Host-Browser ansteuern.
- `network` verwendet standardmäßig `openclaw-sandbox-browser` (dediziertes Bridge-Netzwerk). Setzen Sie den Wert nur dann auf `bridge`, wenn Sie ausdrücklich globale Bridge-Konnektivität wünschen. `"host"` ist auch hier gesperrt.
- `cdpSourceRange` beschränkt optional den eingehenden CDP-Zugriff am Container-Rand auf einen CIDR-Bereich (zum Beispiel `172.21.0.1/32`).
- `sandbox.browser.binds` hängt zusätzliche Host-Verzeichnisse ausschließlich in den Sandbox-Browser-Container ein. Wenn diese Option festgelegt ist (einschließlich `[]`), ersetzt sie `docker.binds` für den Browser-Container.
- Chromium im Sandbox-Browser-Container wird immer mit `--no-sandbox --disable-setuid-sandbox` gestartet (Container verfügen nicht über die Kernel-Primitive, die Chromes eigene Sandbox benötigt); dafür gibt es keine Konfigurationsoption.
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
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` deaktiviert werden, wenn die Verwendung von WebGL/3D dies erfordert.
  - `--disable-extensions` (standardmäßig aktiviert); `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`
    aktiviert Erweiterungen erneut, wenn Ihr Arbeitsablauf von ihnen abhängt.
  - `--renderer-process-limit=2` standardmäßig; ändern Sie den Wert mit
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` oder setzen Sie ihn auf `0`, um Chromiums
    standardmäßiges Prozesslimit zu verwenden.
  - `--headless=new` nur, wenn `headless` aktiviert ist.
  - Die Standardwerte bilden die Basis des Container-Images; verwenden Sie ein benutzerdefiniertes Browser-Image mit einem benutzerdefinierten
    Einstiegspunkt, um die Container-Standardwerte zu ändern.

</Accordion>

Browser-Sandboxing und `sandbox.docker.binds` sind ausschließlich mit Docker verfügbar.

Images erstellen (aus einem Quellcode-Checkout):

```bash
scripts/sandbox-setup.sh           # Haupt-Sandbox-Image
scripts/sandbox-browser-setup.sh   # optionales Browser-Image
```

Informationen zu npm-Installationen ohne Quellcode-Checkout finden Sie unter [Sandboxing § Images und Einrichtung](/de/gateway/sandboxing#images-and-setup) mit Inline-Befehlen für `docker build`.

### `agents.list` (agentspezifische Überschreibungen)

Verwenden Sie `agents.list[].tts`, um einem Agent einen eigenen TTS-Provider, eine eigene Stimme, ein eigenes Modell,
einen eigenen Stil oder einen eigenen automatischen TTS-Modus zuzuweisen. Der Agent-Block wird tief mit dem globalen
`messages.tts` zusammengeführt. So können gemeinsam genutzte Anmeldedaten an einer Stelle verbleiben, während einzelne
Agenten nur die benötigten Felder für Stimme oder Provider überschreiben. Die Überschreibung des aktiven Agenten
gilt für automatische gesprochene Antworten, `/tts audio`, `/tts status` und
das Agent-Werkzeug `tts`. Beispiele für Provider und die Rangfolge finden Sie unter [Text-to-Speech](/de/tools/tts#per-agent-voice-overrides).

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
        thinkingDefault: "high", // agentspezifische Überschreibung der Denkstufe
        reasoningDefault: "on", // agentspezifische Überschreibung der Sichtbarkeit der Schlussfolgerungen
        fastModeDefault: false, // agentspezifische Überschreibung des Schnellmodus
        params: { cacheRetention: "none" }, // überschreibt übereinstimmende defaults.models-Parameter anhand des Schlüssels
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
- `default`: Wenn mehrere festgelegt sind, gilt der erste Eintrag (eine Warnung wird protokolliert). Ist keiner festgelegt, ist der erste Listeneintrag der Standardwert.
- `model`: Die Zeichenfolgenform legt ein striktes primäres Modell pro Agent ohne Modell-Fallback fest; die Objektform `{ primary }` ist ebenfalls strikt, sofern Sie keine `fallbacks` hinzufügen. Verwenden Sie `{ primary, fallbacks: [...] }`, um den Fallback für diesen Agent zu aktivieren, oder `{ primary, fallbacks: [] }`, um das strikte Verhalten ausdrücklich festzulegen. Cron-Aufträge, die nur `primary` überschreiben, übernehmen weiterhin die standardmäßigen Fallbacks, sofern Sie nicht `fallbacks: []` festlegen.
- `utilityModel`: optionale Überschreibung pro Agent für kurze interne Aufgaben wie generierte Sitzungs- und Thread-Titel. Fällt auf `agents.defaults.utilityModel`, dann auf den deklarierten Standard des primären Providers für kleine Modelle und schließlich auf das primäre Modell dieses Agents zurück. Eine leere Zeichenfolge deaktiviert das Utility-Routing für diesen Agent.
- `params`: Stream-Parameter pro Agent, die über den ausgewählten Modelleintrag in `agents.defaults.models` gelegt werden. Verwenden Sie dies für agentspezifische Überschreibungen wie `cacheRetention`, `temperature` oder `maxTokens`, ohne den gesamten Modellkatalog zu duplizieren.
- `tts`: optionale Text-to-Speech-Überschreibungen pro Agent. Der Block wird rekursiv über `messages.tts` gelegt. Belassen Sie daher gemeinsam verwendete Provider-Anmeldedaten und die Fallback-Richtlinie in `messages.tts` und legen Sie hier nur personaspezifische Werte wie Provider, Stimme, Modell, Stil oder automatischen Modus fest.
- `skills`: optionale Skill-Zulassungsliste pro Agent. Wenn sie weggelassen wird, übernimmt der Agent den Wert von `agents.defaults.skills`, sofern dieser festgelegt ist; eine explizite Liste ersetzt die Standardwerte, statt sie zusammenzuführen, und `[]` bedeutet, dass keine Skills verfügbar sind.
- `thinkingDefault`: optionale Standard-Denkstufe pro Agent (`off | minimal | low | medium | high | xhigh | adaptive | max`). Überschreibt `agents.defaults.thinkingDefault` für diesen Agent, wenn keine Überschreibung pro Nachricht oder Sitzung festgelegt ist. Das ausgewählte Provider-/Modellprofil bestimmt, welche Werte gültig sind; bei Google Gemini behält `adaptive` das vom Provider gesteuerte dynamische Denken bei (`thinkingLevel` wird bei Gemini 3/3.1 weggelassen, `thinkingBudget: -1` bei Gemini 2.5).
- `reasoningDefault`: optionale Standardsichtbarkeit der Schlussfolgerungen pro Agent (`on | off | stream`). Überschreibt `agents.defaults.reasoningDefault` für diesen Agent, wenn keine Überschreibung der Schlussfolgerungen pro Nachricht oder Sitzung festgelegt ist.
- `fastModeDefault`: optionale Standardeinstellung für den schnellen Modus pro Agent (`"auto" | true | false`). Gilt, wenn keine Überschreibung des schnellen Modus pro Nachricht oder Sitzung festgelegt ist.
- `models`: optionale Überschreibungen des Modellkatalogs bzw. der Laufzeit pro Agent, indiziert nach vollständigen `provider/model`-IDs. Verwenden Sie `models["provider/model"].agentRuntime` für Laufzeitausnahmen pro Agent.
- `runtime`: optionale Laufzeitbeschreibung pro Agent. Verwenden Sie `type: "acp"` mit den Standardwerten unter `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), wenn der Agent standardmäßig ACP-Harness-Sitzungen verwenden soll.
- `identity.avatar`: arbeitsbereichsrelativer Pfad, `http(s)`-URL oder `data:`-URI.
- Lokale arbeitsbereichsrelative `identity.avatar`-Bilddateien sind auf 2 MB begrenzt. `http(s)`-URLs und `data:`-URIs werden nicht anhand der lokalen Dateigrößenbeschränkung geprüft.
- `identity` leitet Standardwerte ab: `ackReaction` aus `emoji`, `mentionPatterns` aus `name`/`emoji`.
- `subagents.allowAgents`: Zulassungsliste konfigurierter Agent-IDs für explizite `sessions_spawn.agentId`-Ziele (`["*"]` = jedes konfigurierte Ziel; Standard: nur derselbe Agent). Nehmen Sie die ID des anfordernden Agents auf, wenn selbstreferenzierende `agentId`-Aufrufe zulässig sein sollen. Veraltete Einträge, deren Agent-Konfiguration gelöscht wurde, werden von `sessions_spawn` abgelehnt und aus `agents_list` weggelassen. Führen Sie `openclaw doctor --fix` aus, um sie zu bereinigen, oder fügen Sie einen minimalen `agents.list[]`-Eintrag hinzu, wenn dieses Ziel weiterhin erzeugt werden können soll und dabei die Standardwerte übernehmen soll.
- Schutz für die Sandbox-Vererbung: Wenn die anfordernde Sitzung in einer Sandbox ausgeführt wird, lehnt `sessions_spawn` Ziele ab, die ohne Sandbox ausgeführt würden.
- `subagents.requireAgentId`: Wenn „true“, werden `sessions_spawn`-Aufrufe blockiert, die `agentId` weglassen (erzwingt die explizite Profilauswahl; Standard: „false“).
- `subagents.maxConcurrent`: maximale Anzahl gleichzeitig ausgeführter untergeordneter Agent-Läufe über die Subagent-Ausführung hinweg. Standard: `8`.
- `subagents.maxChildrenPerAgent`: maximale Anzahl aktiver untergeordneter Agents, die eine einzelne Agent-Sitzung erzeugen kann. Standard: `5`.
- `subagents.maxSpawnDepth`: maximale Verschachtelungstiefe für das Erzeugen von Subagents (`1`-`5`). Standard: `1` (keine Verschachtelung).
- `subagents.archiveAfterMinutes`: Zeitspanne, nach der der Status abgeschlossener Subagents archiviert wird. Standard: `60`.

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

### Felder für den Binding-Abgleich

- `type` (optional): `route` für normales Routing (bei fehlendem Typ ist der Standardwert „route“), `acp` für persistente ACP-Konversationsbindungen.
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
6. Standard-Agent

Innerhalb jeder Stufe gilt der erste passende `bindings`-Eintrag.

Für Einträge mit `type: "acp"` erfolgt die Auflösung in OpenClaw anhand der exakten Konversationsidentität (`match.channel` + Konto + `match.peer.id`); die oben angegebene Stufenreihenfolge der Routenbindungen wird dabei nicht verwendet.

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

- **`scope`**: grundlegende Strategie zur Sitzungsgruppierung für Gruppenchat-Kontexte.
  - `per-sender` (Standard): Jeder Absender erhält innerhalb eines Kanalkontexts eine isolierte Sitzung.
  - `global`: Alle Teilnehmer in einem Kanalkontext teilen sich eine einzige Sitzung (nur verwenden, wenn ein gemeinsamer Kontext beabsichtigt ist).
- **`dmScope`**: legt fest, wie Direktnachrichten gruppiert werden.
  - `main`: Alle Direktnachrichten teilen sich die Hauptsitzung.
  - `per-peer`: nach Absender-ID kanalübergreifend isolieren.
  - `per-channel-peer`: pro Kanal + Absender isolieren (für Posteingänge mit mehreren Benutzern empfohlen).
  - `per-account-channel-peer`: pro Konto + Kanal + Absender isolieren (für mehrere Konten empfohlen).
- **`identityLinks`**: ordnet kanonische IDs Provider-präfigierten Kommunikationspartnern zu, um Sitzungen kanalübergreifend zu teilen. Dock-Befehle wie `/dock_discord` verwenden dieselbe Zuordnung, um die Antwort-Route der aktiven Sitzung auf einen anderen verknüpften Kanalpartner umzuschalten; siehe [Kanal-Docking](/de/concepts/channel-docking).
- **`reset`**: primäre Rücksetzrichtlinie. `daily` setzt zur lokalen Uhrzeit `atHour` zurück; `idle` setzt nach `idleMinutes` zurück. Wenn beide konfiguriert sind, gilt die zuerst ablaufende Bedingung. Die Aktualität für tägliche Rücksetzungen basiert auf `sessionStartedAt` des Sitzungseintrags; die Aktualität für Leerlaufrücksetzungen basiert auf `lastInteractionAt`. Schreibvorgänge durch Hintergrund-/Systemereignisse wie Heartbeat, Cron-Aktivierungen, Ausführungsbenachrichtigungen und Gateway-Verwaltung können `updatedAt` aktualisieren, halten tägliche bzw. Leerlaufsitzungen jedoch nicht aktuell.
- **`resetByType`**: typspezifische Überschreibungen (`direct`, `group`, `thread`). Das veraltete `dm` wird als Alias für `direct` akzeptiert.
- **`resetByChannel`**: kanalspezifische Rücksetzungsüberschreibungen, deren Schlüssel die Provider-/Kanal-ID ist. Wenn der Kanal der Sitzung einen passenden Eintrag hat, hat dieser für die Sitzung uneingeschränkt Vorrang vor `resetByType`/`reset`. Nur verwenden, wenn ein Kanal ein von der Richtlinie auf Typebene abweichendes Rücksetzverhalten benötigt.
- **`mainKey`**: veraltetes Feld. Die Laufzeit verwendet für den Hauptbereich direkter Chats immer `"main"`.
- **`agentToAgent.maxPingPongTurns`**: maximale Anzahl wechselseitiger Antwortrunden zwischen Agenten bei Agent-zu-Agent-Austauschen (Ganzzahl, Bereich: `0`-`20`, Standard: `5`). `0` deaktiviert die Pingpong-Verkettung.
- **`sendPolicy`**: Abgleich anhand von `channel`, `chatType` (`direct|group|channel`, mit dem veralteten Alias `dm`), `keyPrefix` oder `rawKeyPrefix`. Die erste Ablehnung hat Vorrang.
- **`maintenance`**: Bereinigung des Sitzungsspeichers + Aufbewahrungssteuerung.
  - `mode`: `enforce` führt die Bereinigung aus und ist der Standard; `warn` gibt nur Warnungen aus.
  - `pruneAfter`: Altersgrenze für veraltete Einträge (Standard `30d`).
  - `maxEntries`: maximale Anzahl von SQLite-Sitzungseinträgen (Standard `500`). Laufzeitschreibvorgänge führen die Bereinigung stapelweise mit einem kleinen Puffer oberhalb des Grenzwerts für produktionsübliche Höchstwerte aus; `openclaw sessions cleanup --enforce` wendet den Grenzwert sofort an.
  - Kurzlebige Gateway-Prüfsitzungen für Modellläufe verwenden eine feste Aufbewahrung von `24h`, die Bereinigung erfolgt jedoch nur unter Speicherdruck: Veraltete Einträge strikter Modelllaufprüfungen werden nur entfernt, wenn Wartungs-/Grenzwertdruck bei Sitzungseinträgen erreicht wird. Nur streng explizite Prüfschlüssel, die `agent:*:explicit:model-run-<uuid>` entsprechen, kommen infrage; normale Direkt-, Gruppen-, Thread-, Cron-, Hook-, Heartbeat-, ACP- und Subagent-Sitzungen übernehmen diese Aufbewahrung von 24 Stunden nicht. Wenn die Modelllaufbereinigung ausgeführt wird, erfolgt sie vor der umfassenderen Bereinigung veralteter Einträge gemäß `pruneAfter` und dem Grenzwert `maxEntries`.
  - `rotateBytes`: veraltet und wird ignoriert; `openclaw doctor --fix` entfernt es aus älteren Konfigurationen.
  - `resetArchiveRetention`: Aufbewahrung für Transkriptarchive im Format `*.reset.<timestamp>`. Verwendet standardmäßig `pruneAfter`; auf `false` setzen, um sie zu deaktivieren.
  - `maxDiskBytes`: optionales Speicherplatzbudget für das Sitzungsverzeichnis. Im Modus `warn` werden Warnungen protokolliert; im Modus `enforce` werden zuerst die ältesten Artefakte/Sitzungen entfernt.
  - `highWaterBytes`: optionaler Zielwert nach der Budgetbereinigung. Standardmäßig `80%` von `maxDiskBytes`.
- **`writeLock`**: Steuerung der Schreibsperre für Sitzungstranskripte. Nur anpassen, wenn legitime Transkriptvorbereitung, Bereinigung, Compaction oder Spiegelung länger als gemäß den Standardrichtlinien um die Sperre konkurrieren.
  - `acquireTimeoutMs`: Wartezeit in Millisekunden beim Anfordern einer Sperre, bevor die Sitzung als beschäftigt gemeldet wird. Standard: `60000`; Umgebungsüberschreibung `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`.
  - `staleMs`: Zeit in Millisekunden, nach der eine bestehende Sperre als veraltet behandelt und zurückgefordert wird. Standard: `1800000`; Umgebungsüberschreibung `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`.
  - `maxHoldMs`: Zeit in Millisekunden, die eine prozessintern gehaltene Sperre maximal bestehen darf, bevor der Watchdog sie freigibt. Standard: `300000`; Umgebungsüberschreibung `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.
- **`threadBindings`**: globale Standardwerte für an Threads gebundene Sitzungsfunktionen.
  - `enabled`: übergeordneter Standardschalter (Provider können ihn überschreiben; Discord verwendet `channels.discord.threadBindings.enabled`)
  - `idleHours`: standardmäßige automatische Aufhebung des Fokus nach Inaktivität in Stunden (`0` deaktiviert; Provider können den Wert überschreiben)
  - `maxAgeHours`: standardmäßiges absolutes Höchstalter in Stunden (`0` deaktiviert; Provider können den Wert überschreiben)
  - `spawnSessions`: standardmäßige Freigabe zum Erstellen threadgebundener Arbeitssitzungen über `sessions_spawn` und ACP-Thread-Erstellungen. Standardmäßig `true`, wenn Threadbindungen aktiviert sind; Provider/Konten können den Wert überschreiben.
  - `defaultSpawnContext`: standardmäßiger nativer Subagent-Kontext für threadgebundene Erstellungen (`"fork"` oder `"isolated"`). Standardmäßig `"fork"`.

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

Überschreibungen pro Kanal/Konto: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Auflösung (der spezifischste Wert hat Vorrang): Konto → Kanal → global. `""` deaktiviert die Funktion und beendet die Kaskade. `"auto"` leitet `[{identity.name}]` ab.

**Vorlagenvariablen:**

| Variable          | Beschreibung                  | Beispiel                    |
| ----------------- | ----------------------------- | --------------------------- |
| `{model}`         | Kurzer Modellname             | `claude-opus-4-6`           |
| `{modelFull}`     | Vollständige Modellkennung    | `anthropic/claude-opus-4-6` |
| `{provider}`      | Providername                  | `anthropic`                 |
| `{thinkingLevel}` | Aktuelle Denkstufe            | `high`, `low`, `off`        |
| `{identity.name}` | Name der Agentenidentität     | (entspricht `"auto"`)       |

Bei Variablen wird nicht zwischen Groß- und Kleinschreibung unterschieden. `{think}` ist ein Alias für `{thinkingLevel}`.

### Bestätigungsreaktion

- Verwendet standardmäßig `identity.emoji` des aktiven Agenten, andernfalls `"👀"`. Zum Deaktivieren auf `""` setzen.
- Kanalspezifische Überschreibungen: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Auflösungsreihenfolge: Konto → Kanal → `messages.ackReaction` → Identitäts-Fallback.
- Geltungsbereich: `group-mentions` (Standard), `group-all`, `direct`, `all` oder `off`/`none` (deaktiviert Bestätigungsreaktionen vollständig).
- `removeAckAfterReply`: entfernt die Bestätigung nach der Antwort auf Kanälen, die Reaktionen unterstützen, etwa Slack, Discord, Signal, Telegram, WhatsApp und iMessage.
- `messages.statusReactions.enabled`: aktiviert Statusreaktionen für den Lebenszyklus auf Slack, Discord, Signal, Telegram und WhatsApp.
  Bei Discord bleiben Statusreaktionen aktiviert, wenn der Wert nicht gesetzt ist und Bestätigungsreaktionen aktiv sind.
  Bei Slack, Signal, Telegram und WhatsApp müssen Sie den Wert explizit auf `true` setzen, um Statusreaktionen für den Lebenszyklus zu aktivieren.
  Slack verwendet standardmäßig seinen nativen Assistenten-Threadstatus und wechselnde Lademeldungen für Fortschrittsanzeigen, während die konfigurierte Bestätigungsreaktion unverändert bleibt.
- `messages.statusReactions.emojis`: überschreibt die Emoji-Schlüssel für den Lebenszyklusstatus:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` und `stallHard`.
  Telegram erlaubt nur einen festen Reaktionssatz, daher werden nicht unterstützte konfigurierte Emojis
  auf die nächstgelegene unterstützte Statusvariante für diesen Chat zurückgesetzt.

### Warteschlange

- `mode`: Warteschlangenstrategie für eingehende Nachrichten, die eintreffen, während ein Sitzungslauf aktiv ist. Standard: `"steer"`.
  - `steer`: fügt die neue Eingabeaufforderung in den aktiven Lauf ein.
  - `followup`: führt die neue Eingabeaufforderung aus, nachdem der aktive Lauf abgeschlossen ist.
  - `collect`: fasst kompatible Nachrichten zusammen und führt sie später gemeinsam aus.
  - `interrupt`: bricht den aktiven Lauf ab, bevor die neueste Eingabeaufforderung gestartet wird.
- `debounceMs`: Verzögerung vor dem Weiterleiten einer in die Warteschlange gestellten/gesteuerten Nachricht. Standard: `500`.
- `cap`: maximale Anzahl von Nachrichten in der Warteschlange, bevor die Verwerfungsrichtlinie angewendet wird. Standard: `20`.
- `drop`: Strategie bei Überschreitung des Grenzwerts. `"summarize"` (Standard) verwirft die ältesten Einträge, behält jedoch kompakte Zusammenfassungen bei; `"old"` verwirft die ältesten Einträge ohne Zusammenfassungen; `"new"` lehnt den neuesten Eintrag ab.
- `byChannel`: kanalspezifische Überschreibungen für `mode`, deren Schlüssel die Provider-ID ist.
- `debounceMsByChannel`: kanalspezifische Überschreibungen für `debounceMs`, deren Schlüssel die Provider-ID ist.

### Entprellung eingehender Nachrichten

Fasst schnell aufeinanderfolgende reine Textnachrichten desselben Absenders zu einem einzigen Agentendurchlauf zusammen. Medien/Anhänge lösen die Weiterleitung sofort aus. Steuerbefehle umgehen die Entprellung. Standardwert für `debounceMs`: `2000`.

### Weitere Nachrichtenschlüssel

- `messages.messagePrefix`: Präfixtext, der eingehenden Benutzernachrichten vorangestellt wird, bevor sie die Agentenlaufzeit erreichen. Sparsam für Kanalkontextmarkierungen verwenden.
- `messages.visibleReplies`: steuert sichtbare Antworten auf Ursprungsnachrichten in Direkt-, Gruppen- und Kanalunterhaltungen (`"message_tool"` erfordert `message(action=send)` für eine sichtbare Ausgabe; `"automatic"` veröffentlicht normale Antworten wie zuvor).
- `messages.usageTemplate` / `messages.responseUsage`: benutzerdefinierte Vorlage für die `/usage`-Fußzeile und standardmäßiger Nutzungsmodus pro Antwort (`off | tokens | full`, zusätzlich der veraltete Alias `on` für `tokens`).
- `messages.groupChat.mentionPatterns` / `historyLimit`: Erwähnungsauslöser für Gruppennachrichten und Größe des Verlaufsfensters.
- `messages.suppressToolErrors`: unterdrückt bei `true` die dem Benutzer angezeigten `⚠️`-Warnungen zu Werkzeugfehlern (der Agent sieht die Fehler weiterhin im Kontext und kann es erneut versuchen). Standard: `false`.

### TTS (Text-zu-Sprache)

```json5
{
  messages: {
    tts: {
      auto: "off", // off (Standard) | always | inbound | tagged
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

- `auto` steuert den standardmäßigen Auto-TTS-Modus: `off`, `always`, `inbound` oder `tagged`. `/tts on|off` kann lokale Einstellungen überschreiben, und `/tts status` zeigt den effektiven Status an.
- `summaryModel` überschreibt `agents.defaults.model.primary` für die automatische Zusammenfassung.
- `modelOverrides` ist standardmäßig aktiviert (`enabled !== false`); `modelOverrides.allowProvider` muss explizit aktiviert werden.
- API-Schlüssel greifen ersatzweise auf `ELEVENLABS_API_KEY`/`XI_API_KEY` und `OPENAI_API_KEY` zurück.
- Mitgelieferte Sprachausgabe-Provider gehören jeweils einem Plugin. Wenn `plugins.allow` festgelegt ist, nehmen Sie jedes TTS-Provider-Plugin auf, das Sie verwenden möchten, beispielsweise `microsoft` für Edge TTS. Die veraltete Provider-ID `edge` wird als Alias für `microsoft` akzeptiert.
- `providers.openai.baseUrl` überschreibt den OpenAI-TTS-Endpunkt. Die Auflösungsreihenfolge lautet: Konfiguration, dann `OPENAI_TTS_BASE_URL`, dann `https://api.openai.com/v1`.
- Wenn `providers.openai.baseUrl` auf einen Endpunkt verweist, der nicht von OpenAI stammt, behandelt OpenClaw ihn als OpenAI-kompatiblen TTS-Server und lockert die Modell-/Stimmenvalidierung.

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
      instructions: "Sprechen Sie freundlich und halten Sie die Antworten kurz.",
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

- `talk.provider` muss mit einem Schlüssel in `talk.providers` übereinstimmen, wenn mehrere Talk-Provider konfiguriert sind.
- Veraltete flache Talk-Schlüssel (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) dienen nur der Kompatibilität. Führen Sie `openclaw doctor --fix` aus, um die persistierte Konfiguration in `talk.providers.<provider>` umzuschreiben.
- Sprach-IDs greifen auf `ELEVENLABS_VOICE_ID` oder `SAG_VOICE_ID` zurück (Verhalten des macOS-Talk-Clients).
- `providers.*.apiKey` akzeptiert Klartextzeichenfolgen oder SecretRef-Objekte.
- Der Fallback `ELEVENLABS_API_KEY` gilt nur, wenn kein Talk-API-Schlüssel konfiguriert ist.
- `providers.*.voiceAliases` ermöglicht Talk-Direktiven die Verwendung benutzerfreundlicher Namen.
- `providers.mlx.modelId` wählt das Hugging-Face-Repository aus, das vom lokalen MLX-Hilfsprogramm unter macOS verwendet wird. Falls nicht angegeben, verwendet macOS `mlx-community/Soprano-80M-bf16`.
- Die macOS-MLX-Wiedergabe erfolgt über das gebündelte Hilfsprogramm `openclaw-mlx-tts`, sofern vorhanden, oder über eine ausführbare Datei in `PATH`; `OPENCLAW_MLX_TTS_BIN` überschreibt den Pfad des Hilfsprogramms für die Entwicklung.
- `consultThinkingLevel` steuert die Denkstufe für den vollständigen OpenClaw-Agentenlauf hinter den Echtzeitaufrufen `openclaw_agent_consult` von Control UI Talk. Lassen Sie die Einstellung nicht gesetzt, um das normale Sitzungs-/Modellverhalten beizubehalten.
- `consultFastMode` legt eine einmalige Überschreibung des Schnellmodus für Echtzeitkonsultationen von Control UI Talk fest, ohne die normale Schnellmoduseinstellung der Sitzung zu ändern.
- `speechLocale` legt die BCP-47-Gebietsschema-ID fest, die von der Talk-Spracherkennung unter iOS/macOS verwendet wird. Lassen Sie die Einstellung nicht gesetzt, um den Gerätestandard zu verwenden.
- `silenceTimeoutMs` steuert, wie lange der Talk-Modus nach dem Verstummen des Benutzers wartet, bevor er das Transkript sendet. Wenn die Einstellung nicht gesetzt ist, bleibt das standardmäßige Pausenfenster der Plattform (`700 ms on macOS and Android, 900 ms on iOS`) erhalten.
- `realtime.instructions` hängt an den Provider gerichtete Systemanweisungen an den integrierten Echtzeit-Prompt von OpenClaw an, sodass der Sprachstil konfiguriert werden kann, ohne die standardmäßigen Hinweise von `openclaw_agent_consult` zu verlieren.
- `realtime.vadThreshold` legt den Schwellenwert des Providers für Sprachaktivität von `0` (höchste Empfindlichkeit) bis `1` (niedrigste Empfindlichkeit) fest. Wenn die Einstellung nicht gesetzt ist, bleibt der Standardwert des Providers erhalten.
- `realtime.silenceDurationMs` legt das positive ganzzahlige Stillefenster fest, bevor der Provider einen Echtzeit-Benutzerbeitrag übernimmt. Wenn die Einstellung nicht gesetzt ist, bleibt der Standardwert des Providers erhalten.
- `realtime.prefixPaddingMs` legt die nicht negative ganzzahlige Audiomenge fest, die vor dem Beginn erkannter Sprache beibehalten wird. Wenn die Einstellung nicht gesetzt ist, bleibt der Standardwert des Providers erhalten.
- `realtime.reasoningEffort` legt die providerspezifische Schlussfolgerungsstufe für Echtzeitsitzungen fest. Wenn die Einstellung nicht gesetzt ist, bleibt der Standardwert des Providers erhalten.
- `realtime.consultRouting`: `"provider-direct"` (Standard) behält direkte Provider-Antworten bei, wenn der Echtzeit-Provider ein endgültiges Benutzertranskript ohne `openclaw_agent_consult` erzeugt. `"force-agent-consult"` leitet die abgeschlossene Anfrage stattdessen durch OpenClaw.

---

## Verwandte Themen

- [Konfigurationsreferenz](/de/gateway/configuration-reference) — alle weiteren Konfigurationsschlüssel
- [Konfiguration](/de/gateway/configuration) — häufige Aufgaben und schnelle Einrichtung
- [Konfigurationsbeispiele](/de/gateway/configuration-examples)
