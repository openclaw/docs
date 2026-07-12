---
read_when:
    - Sie möchten die Kosten für Prompt-Tokens durch Cache-Aufbewahrung reduzieren
    - Sie benötigen in Multi-Agent-Setups ein Cache-Verhalten pro Agent.
    - Sie stimmen Heartbeat und Cache-TTL-Bereinigung aufeinander ab
summary: Einstellungen für Prompt-Caching, Zusammenführungsreihenfolge, Provider-Verhalten und Optimierungsmuster
title: Prompt-Caching
x-i18n:
    generated_at: "2026-07-12T15:49:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 68f3e6ba31517a598f22cfdbe04da746a756feadc7c4c376efaa4779cbf05b31
    source_path: reference/prompt-caching.md
    workflow: 16
---

Prompt-Caching ermöglicht es einem Modell-Provider, ein unverändertes Prompt-Präfix (System-/Entwickleranweisungen, Tool-Definitionen und weiteren stabilen Kontext) über mehrere Interaktionen hinweg wiederzuverwenden, anstatt es bei jeder Anfrage erneut zu verarbeiten. Dies reduziert bei lang laufenden Sitzungen mit wiederholtem Kontext die Token-Kosten und die Latenz.

OpenClaw normalisiert die Nutzungsdaten des Providers in `cacheRead` und `cacheWrite`, sofern die vorgelagerte API diese Zähler bereitstellt. Nutzungszusammenfassungen (`/status` und Ähnliches) greifen auf den letzten Nutzungseintrag im Transkript zurück, wenn die Live-Sitzungsmomentaufnahme keine Cache-Zähler enthält; ein von null verschiedener Live-Wert hat stets Vorrang vor dem Rückgriffswert.

Provider-Referenzen:

- [Prompt-Caching von Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Prompt-Caching von OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching)

## Primäre Einstellungen

### `cacheRetention`

Werte: `"none" | "short" | "long"`. Konfigurierbar als globaler Standardwert sowie pro Modell und pro Agent.

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # überschreibt den globalen Standardwert für dieses Modell
  list:
    - id: "alerts"
      params:
        cacheRetention: "none" # überschreibt beide Standardwerte für diesen Agent
```

Zusammenführungsreihenfolge (spätere Einträge haben Vorrang):

1. `agents.defaults.params` - globaler Standardwert für alle Modelle
2. `agents.defaults.models["provider/model"].params` - Überschreibung pro Modell
3. `agents.list[].params` - Überschreibung pro Agent, abgeglichen anhand der Agent-ID

Quelle: `src/agents/embedded-agent-runner/extra-params.ts` (`resolveExtraParams`).

### `contextPruning.mode: "cache-ttl"`

Entfernt alten Kontext aus Tool-Ergebnissen, nachdem das Cache-TTL-Zeitfenster abgelaufen ist, damit eine Anfrage nach einer Leerlaufphase keinen übermäßig großen Verlauf erneut zwischenspeichert.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Siehe [Sitzungsbereinigung](/de/concepts/session-pruning) für das vollständige Verhalten.

### Heartbeat zum Warmhalten

Heartbeat kann Cache-Zeitfenster warmhalten und wiederholte Cache-Schreibvorgänge nach Leerlaufphasen reduzieren. Global (`agents.defaults.heartbeat`) oder pro Agent (`agents.list[].heartbeat`) konfigurierbar.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## Provider-Verhalten

### Anthropic (direkte API und Vertex AI)

- `cacheRetention` wird für die Provider `anthropic` und `anthropic-vertex` sowie für Claude-Modelle auf `amazon-bedrock` und benutzerdefinierten, mit `anthropic-messages` kompatiblen Endpunkten unterstützt, wenn `cacheRetention` explizit festgelegt ist.
- Wenn nicht festgelegt, setzt OpenClaw für direkte Anthropic-Verbindungen standardmäßig `cacheRetention: "short"` (`anthropic`- und `anthropic-vertex`-Provider; andere Routen der Anthropic-Familie erfordern einen expliziten Wert).
- Native Anthropic-Messages-Antworten stellen `cache_read_input_tokens` und `cache_creation_input_tokens` bereit, die `cacheRead` und `cacheWrite` zugeordnet werden.
- `cacheRetention: "short"` entspricht dem standardmäßigen flüchtigen 5-Minuten-Cache. `cacheRetention: "long"` fordert bei expliziter Festlegung die TTL von 1 Stunde (`cache_control: { type: "ephemeral", ttl: "1h" }`) an. Eine implizite bzw. umgebungsvariablengesteuerte lange Aufbewahrung (`OPENCLAW_CACHE_RETENTION=long` ohne explizites `cacheRetention`) führt nur auf Hosts von `api.anthropic.com` oder Vertex AI (`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`) zu einem Upgrade auf die TTL von 1 Stunde; andere Hosts behalten den 5-Minuten-Cache bei.

Quelle: `src/agents/anthropic-payload-policy.ts` (`resolveAnthropicEphemeralCacheControl`, `isLongTtlEligibleEndpoint`).

### OpenAI (direkte API)

- Prompt-Caching erfolgt bei unterstützten aktuellen Modellen automatisch; OpenClaw fügt keine Cache-Markierungen auf Blockebene ein.
- OpenClaw sendet `prompt_cache_key`, um das Cache-Routing über mehrere Turns hinweg stabil zu halten. Direkte `api.openai.com`-Hosts erhalten dies automatisch. OpenAI-kompatible Proxys (oMLX, llama.cpp, benutzerdefinierte Endpunkte) benötigen `compat.supportsPromptCacheKey: true` in der Modellkonfiguration, um diese Funktion zu aktivieren – bei einem Proxy wird dies niemals automatisch erkannt.
- `prompt_cache_retention: "24h"` wird nur hinzugefügt, wenn `cacheRetention: "long"` ausgewählt ist und der aufgelöste Endpunkt sowohl den Cache-Schlüssel als auch die lange Aufbewahrung unterstützt (`compat.supportsLongCacheRetention`, standardmäßig aktiviert; Together-AI- und Cloudflare-Kompatibilitätsprofile deaktivieren sie). `cacheRetention: "none"` unterdrückt beide Felder.
- Cache-Treffer werden über `usage.prompt_tokens_details.cached_tokens` (Chat Completions) oder `input_tokens_details.cached_tokens` (Responses API) bereitgestellt und `cacheRead` zugeordnet.
- Nutzdaten der Responses API können außerdem `input_tokens_details.cache_write_tokens` bereitstellen, das `cacheWrite` zugeordnet und mit der Cache-Schreibrate des Modells bepreist wird; bei Responses-Nutzdaten, in denen das Feld fehlt, bleibt `cacheWrite` auf `0`. Die Chat Completions API von OpenAI dokumentiert oder liefert keinen `cache_write_tokens`-Zähler, OpenClaw liest dort jedoch weiterhin `prompt_tokens_details.cache_write_tokens` für OpenRouter-kompatible und DeepSeek-artige Proxys aus, die einen separaten Schreibzähler melden.
- In der Praxis verhält sich OpenAI eher wie ein Cache für das anfängliche Präfix als wie Anthropics fortlaufende Wiederverwendung des vollständigen Verlaufs – siehe unten [Erwartungen an OpenAI im Live-Betrieb](#openai-live-expectations).

### Amazon Bedrock

- Anthropic-Claude-Modellreferenzen (`amazon-bedrock/*anthropic.claude*` sowie Präfixe für AWS-System-Inferenzprofile `us.`/`eu.`/`global.anthropic.claude*`) unterstützen die explizite Weitergabe von `cacheRetention`.
- Bedrock-Modelle, die nicht von Anthropic stammen (zum Beispiel `amazon.nova-*`), werden zur Laufzeit unabhängig von einem konfigurierten `cacheRetention`-Wert ohne Cache-Aufbewahrung aufgelöst.
- Nicht transparente ARNs für Bedrock-Anwendungs-Inferenzprofile (Profil-IDs, die nicht `claude` enthalten) werden ebenfalls ohne Cache-Aufbewahrung aufgelöst, sofern `cacheRetention` nicht explizit festgelegt ist, da sich die Modellfamilie nicht allein aus der ARN ableiten lässt.

### OpenRouter

Für Modellreferenzen vom Typ `openrouter/anthropic/*` fügt OpenClaw Anthropic-`cache_control`-Marker in System-/Entwickler-Promptblöcke ein, jedoch nur, wenn die Anfrage weiterhin auf eine verifizierte OpenRouter-Route abzielt (`openrouter` an seinem Standardendpunkt oder ein beliebiger Provider/eine beliebige Basis-URL, der bzw. die zu `openrouter.ai` aufgelöst wird). Wird das Modell auf eine beliebige OpenAI-kompatible Proxy-URL umgeleitet, werden diese Marker nicht mehr eingefügt.

`contextPruning.mode: "cache-ttl"` ist für Modellreferenzen vom Typ `openrouter/anthropic/*`, `openrouter/deepseek/*`, `openrouter/moonshot/*`, `openrouter/moonshotai/*` und `openrouter/zai/*` zulässig, da diese Routen das Provider-seitige Prompt-Caching verarbeiten, ohne die von OpenClaw eingefügten Marker zu benötigen.

Quelle: `extensions/openrouter/index.ts` (`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`).

Der Cache-Aufbau für DeepSeek auf OpenRouter erfolgt nach bestem Bemühen und kann einige Sekunden dauern; eine unmittelbar folgende Anfrage kann daher weiterhin `cached_tokens: 0` anzeigen. Überprüfen Sie dies nach einer kurzen Verzögerung mit einer wiederholten Anfrage mit demselben Präfix und verwenden Sie `usage.prompt_tokens_details.cached_tokens` als Signal für einen Cache-Treffer.

### Google Gemini (direkte API)

- Der direkte Gemini-Transport (`api: "google-generative-ai"`) meldet Cache-Treffer über das vorgelagerte `cachedContentTokenCount`, das `cacheRead` zugeordnet wird.
- Geeignete Modellfamilien: `gemini-2.5*` und `gemini-3*` (ausgenommen Live-/Vorschauvarianten außerhalb dieser Präfixübereinstimmung, zum Beispiel `gemini-live-2.5-flash-preview`).
- Wenn `cacheRetention` für ein geeignetes Modell festgelegt ist, erstellt, verwendet und aktualisiert OpenClaw automatisch eine `cachedContents`-Ressource für den System-Prompt – eine manuelle Kennung für zwischengespeicherte Inhalte ist nicht erforderlich. Die TTL beträgt `300s` für `cacheRetention: "short"` und `3600s` für `"long"`.
- Sie können weiterhin eine bereits vorhandene Gemini-Kennung für zwischengespeicherte Inhalte als `params.cachedContent` (oder das veraltete `params.cached_content`) übergeben; eine explizite Kennung umgeht den automatischen Cache-Verwaltungspfad vollständig.
- Dies ist vom Prompt-Präfix-Caching von Anthropic/OpenAI getrennt: OpenClaw verwaltet für Gemini eine Provider-native `cachedContents`-Ressource, anstatt Inline-Cache-Markierungen einzufügen.

Quelle: `src/agents/embedded-agent-runner/google-prompt-cache.ts`.

### CLI-Harness-Provider (Claude Code, Gemini CLI)

CLI-Backends, die JSONL-Nutzungsereignisse ausgeben (`jsonlDialect: "claude-stream-json"` oder `"gemini-stream-json"`), durchlaufen einen gemeinsamen Nutzungsparser, der mehrere Varianten von Feldnamen erkennt, darunter einen einfachen `cached`-Zähler, der `cacheRead` zugeordnet wird. Wenn die JSON-Nutzlast der CLI kein direktes Eingabe-Token-Feld enthält, leitet OpenClaw es als `input_tokens - cached` ab. Dies dient ausschließlich der Normalisierung der Nutzung – es erstellt keine Prompt-Cache-Markierungen im Stil von Anthropic/OpenAI für diese CLI-gesteuerten Modelle.

Quelle: `src/agents/cli-output.ts` (`toCliUsage`).

### Andere Provider

Wenn ein Provider keinen der oben genannten Cache-Modi unterstützt, hat `cacheRetention` keine Wirkung.

## Cache-Grenze des System-Prompts

OpenClaw teilt den System-Prompt an einer internen Cache-Präfix-Grenze in ein **stabiles Präfix** und ein **volatiles Suffix** auf. Inhalte oberhalb der Grenze (Tool-Definitionen, Skills-Metadaten, Workspace-Dateien) werden so angeordnet, dass sie über mehrere Durchläufe hinweg byteidentisch bleiben. Inhalte unterhalb der Grenze (zum Beispiel `HEARTBEAT.md`, Laufzeit-Zeitstempel und andere Metadaten pro Durchlauf) können sich ändern, ohne das zwischengespeicherte Präfix ungültig zu machen.

Wichtige Designentscheidungen:

- Stabile Projektkontextdateien des Workspace werden vor `HEARTBEAT.md` angeordnet, damit Änderungen am Heartbeat das stabile Präfix nicht ungültig machen.
- Die Grenze gilt für die Transportaufbereitung der Anthropic-Familie, der OpenAI-Familie, von Google und der CLI, sodass alle unterstützten Provider von derselben Präfixstabilität profitieren.
- Codex-Responses- und Anthropic-Vertex-Anfragen werden durch eine grenzbewusste Cache-Aufbereitung geleitet, damit die Cache-Wiederverwendung mit den tatsächlich bei den Providern eingehenden Daten übereinstimmt.
- Fingerabdrücke des System-Prompts werden normalisiert (Leerraum, Zeilenenden, durch Hooks hinzugefügter Kontext, Reihenfolge der Laufzeitfähigkeiten), sodass semantisch unveränderte Prompts über mehrere Durchläufe hinweg denselben Cache verwenden.

Wenn nach einer Konfigurations- oder Workspace-Änderung unerwartete Spitzen bei `cacheWrite` auftreten, prüfen Sie, ob die Änderung oberhalb oder unterhalb der Cache-Grenze liegt. Das Verschieben volatiler Inhalte unter die Grenze (oder deren Stabilisierung) behebt das Problem üblicherweise.

## OpenClaw-Schutzmechanismen für Cache-Stabilität

- Gebündelte MCP-Toolkataloge werden vor der Tool-Registrierung deterministisch sortiert (zuerst nach Servername, dann nach Toolname), damit Änderungen der Reihenfolge von `listTools()` nicht zu Veränderungen im Tool-Block führen und Prompt-Cache-Präfixe ungültig machen.
- Bei veralteten Sitzungen mit dauerhaft gespeicherten Bildblöcken bleiben die **3 neuesten abgeschlossenen Durchläufe** unverändert erhalten (gezählt werden alle abgeschlossenen Durchläufe, nicht nur solche mit Bildern). Ältere, bereits verarbeitete Bildblöcke werden durch eine Textmarkierung ersetzt, damit bildintensive Folgeanfragen nicht wiederholt große, veraltete Nutzlasten senden.

## Abstimmungsmuster

### Gemischter Datenverkehr (empfohlene Standardeinstellung)

Behalten Sie auf Ihrem Hauptagenten eine langlebige Basis bei und deaktivieren Sie das Caching auf Benachrichtigungsagenten mit stark schwankender Auslastung:

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### Kostenorientierte Basis

- Setzen Sie die grundlegende Einstellung `cacheRetention: "short"`.
- Aktivieren Sie `contextPruning.mode: "cache-ttl"`.
- Halten Sie den Heartbeat nur bei Agenten, die von warmen Caches profitieren, unterhalb Ihrer TTL.

## Live-Regressionstests

OpenClaw führt eine kombinierte Live-Regressionsprüfung für den Cache aus, die wiederholte Präfixe, Tool-Durchläufe, Bild-Durchläufe, Tool-Transkripte im MCP-Stil und eine Anthropic-Kontrollgruppe ohne Cache abdeckt.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

Führen Sie sie wie folgt aus:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Die Basisdatei speichert die zuletzt beobachteten Live-Werte sowie die Provider-spezifischen Regressionsuntergrenzen, gegen die der Test prüft. Jeder Durchlauf verwendet neue, durchlaufspezifische Sitzungs-IDs und Prompt-Namensräume, damit ein vorheriger Cache-Zustand die aktuelle Stichprobe nicht verfälscht. Anthropic und OpenAI verwenden unterschiedliche Durchsetzungsregeln: Das Unterschreiten einer Anthropic-Untergrenze ist eine harte Regression (der Test schlägt fehl), während das Unterschreiten einer OpenAI-Untergrenze nur überwacht wird (als Warnung aufgezeichnet, der Durchlauf schlägt nicht fehl). Sie verwenden keinen gemeinsamen Provider-übergreifenden Schwellenwert.

### Erwartetes Live-Verhalten bei Anthropic

- Erwarten Sie explizite Warmup-Schreibvorgänge über `cacheWrite`.
- Erwarten Sie bei wiederholten Durchläufen die Wiederverwendung nahezu des gesamten Verlaufs, da Anthropics Cache-Steuerung den Cache-Haltepunkt im Verlauf der Unterhaltung weiterbewegt.
- Mindestwerte für stabile, Tool-, Bild- und MCP-artige Pfade sind verbindliche Regressionsgrenzen.

### Erwartungen für OpenAI-Livebetrieb

- Erwarten Sie ausschließlich `cacheRead`; bei Chat Completions bleibt `cacheWrite` auf `0`.
- Behandeln Sie die Cache-Wiederverwendung bei wiederholten Durchläufen als Provider-spezifisches Plateau, nicht als eine sich verschiebende Wiederverwendung des vollständigen Verlaufs nach Anthropic-Art.
- Mindestwerte dienen nur der Überwachung (ein Unterschreiten wird als Warnung protokolliert, nicht als Testfehler) und wurden aus dem beobachteten Liveverhalten von `gpt-5.4-mini` abgeleitet:

| Szenario               | Mindestwert für `cacheRead` | Mindesttrefferquote |
| ---------------------- | --------------------------: | ------------------: |
| Stabiles Präfix        |                       4,608 |                0.90 |
| Tool-Transkript        |                       4,096 |                0.85 |
| Bildtranskript         |                       3,840 |                0.82 |
| MCP-artiges Transkript |                       4,096 |                0.85 |

Die zuletzt beobachteten Basiswerte (aus `live-cache-regression-baseline.ts`) lagen bei: stabiles Präfix `cacheRead=4864`, Trefferquote `0.966`; Tool-Transkript `cacheRead=4608`, Trefferquote `0.896`; Bildtranskript `cacheRead=4864`, Trefferquote `0.954`; MCP-artiges Transkript `cacheRead=4608`, Trefferquote `0.891`.

Warum sich die Zusicherungen unterscheiden: Anthropic stellt explizite Cache-Haltepunkte und eine sich verschiebende Wiederverwendung des Unterhaltungsverlaufs bereit, während das effektiv wiederverwendbare Präfix von OpenAI im Live-Datenverkehr bereits vor dem vollständigen Prompt ein Plateau erreichen kann. Der Vergleich beider Provider anhand eines einzigen Provider-übergreifenden prozentualen Schwellenwerts erzeugt falsche Regressionen.

## Konfiguration von `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # Standardwert true
    includePrompt: false # Standardwert true
    includeSystem: false # Standardwert true
```

Standardwerte:

| Schlüssel         | Standardwert                                 |
| ----------------- | -------------------------------------------- |
| `filePath`        | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl` |
| `includeMessages` | `true`                                       |
| `includePrompt`   | `true`                                       |
| `includeSystem`   | `true`                                       |

### Umgebungsvariablen (einmaliges Debugging)

| Variable                             | Wirkung                                             |
| ------------------------------------ | --------------------------------------------------- |
| `OPENCLAW_CACHE_TRACE=1`             | Aktiviert die Cache-Ablaufverfolgung                |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | Überschreibt den Ausgabepfad                         |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | Schaltet die Erfassung vollständiger Nachrichten um |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | Schaltet die Erfassung des Prompttexts um            |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | Schaltet die Erfassung des System-Prompts um         |

### Was zu prüfen ist

- Cache-Ablaufverfolgungsereignisse liegen als JSONL mit gestaffelten Momentaufnahmen wie `session:loaded`, `prompt:before`, `stream:context` und `session:after` vor.
- Die Cache-Token-Auswirkung pro Durchlauf ist in den normalen Nutzungsansichten sichtbar: `cacheRead` und `cacheWrite` erscheinen in `/usage tokens`, `/status`, Sitzungsnutzungszusammenfassungen und benutzerdefinierten `messages.usageTemplate`-Layouts.
- Bei Anthropic sind sowohl `cacheRead` als auch `cacheWrite` zu erwarten, wenn Caching aktiv ist.
- Bei OpenAI ist bei Cache-Treffern `cacheRead` zu erwarten; `cacheWrite` wird nur bei Nutzlasten der Responses API ausgefüllt, die es enthalten (siehe oben [OpenAI](#openai-direct-api)).
- OpenAI gibt außerdem Header für Ablaufverfolgung und Ratenbegrenzung wie `x-request-id`, `openai-processing-ms` und `x-ratelimit-*` zurück; verwenden Sie diese zur Anfrageverfolgung, die Erfassung von Cache-Treffern sollte jedoch weiterhin aus der Nutzungsnutzlast und nicht aus Headern stammen.

## Schnelle Fehlerbehebung

- **Hoher `cacheWrite`-Wert bei den meisten Durchläufen**: Prüfen Sie, ob der System-Prompt veränderliche Eingaben enthält; stellen Sie sicher, dass das Modell bzw. der Provider Ihre Cache-Einstellungen unterstützt.
- **Hoher `cacheWrite`-Wert bei Anthropic**: Dies bedeutet häufig, dass der Cache-Haltepunkt auf Inhalten liegt, die sich bei jeder Anfrage ändern.
- **Niedriger `cacheRead`-Wert bei OpenAI**: Stellen Sie sicher, dass das stabile Präfix am Anfang steht, das wiederholte Präfix mindestens 1024 Token umfasst und derselbe `prompt_cache_key` für Durchläufe wiederverwendet wird, die einen Cache gemeinsam nutzen sollen.
- **Keine Auswirkung von `cacheRetention`**: Stellen Sie sicher, dass der Modellschlüssel mit `agents.defaults.models["provider/model"]` übereinstimmt.
- **Bedrock-Nova-Anfragen mit Cache-Einstellungen**: Erwartetes Verhalten – diese werden zur Laufzeit ohne Cache-Aufbewahrung aufgelöst.

Zugehörige Dokumentation:

- [Anthropic](/de/providers/anthropic)
- [Token-Nutzung und Kosten](/de/reference/token-use)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
- [Gateway-Konfigurationsreferenz](/de/gateway/configuration-reference)

## Verwandte Themen

- [Token-Nutzung und Kosten](/de/reference/token-use)
- [API-Nutzung und Kosten](/de/reference/api-usage-costs)
