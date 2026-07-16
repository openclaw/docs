---
read_when:
    - Sie möchten die Prompt-Token-Kosten durch Cache-Aufbewahrung reduzieren
    - Sie benötigen in Multi-Agent-Setups ein Cache-Verhalten pro Agent.
    - Sie stimmen Heartbeat und Cache-TTL-Bereinigung aufeinander ab
summary: Optionen für Prompt-Caching, Zusammenführungsreihenfolge, Provider-Verhalten und Optimierungsmuster
title: Prompt-Caching
x-i18n:
    generated_at: "2026-07-16T13:26:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 59a5aefc4d4139c31461b81f164b9efa9a4c1c48d03146049cf447b9dfd6ea99
    source_path: reference/prompt-caching.md
    workflow: 16
---

Prompt-Caching ermöglicht einem Modell-Provider, ein unverändertes Prompt-Präfix (System-/Entwickleranweisungen, Tool-Definitionen und anderen stabilen Kontext) über mehrere Durchläufe hinweg wiederzuverwenden, anstatt es bei jeder Anfrage erneut zu verarbeiten. Dies reduziert Token-Kosten und Latenz bei lang laufenden Sitzungen mit wiederholtem Kontext.

OpenClaw normalisiert die Nutzungsdaten des Providers in `cacheRead` und `cacheWrite`, sofern die Upstream-API diese Zähler bereitstellt. Nutzungszusammenfassungen (`/status` und ähnliche) greifen auf den letzten Nutzungseintrag im Transkript zurück, wenn der Live-Sitzungssnapshot keine Cache-Zähler enthält; ein Live-Wert ungleich null hat stets Vorrang vor dem Rückgriffswert.

Provider-Referenzen:

- [Anthropic-Prompt-Caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [OpenAI-Prompt-Caching](https://developers.openai.com/api/docs/guides/prompt-caching)

## Primäre Einstellungen

### `cacheRetention`

Werte: `"none" | "short" | "long"`. Konfigurierbar als globaler Standard, pro Modell und pro Agent.
`"standard"` ist kein Alias; verwenden Sie `"short"` für das standardmäßige Cache-Zeitfenster des Providers. Ungültige Werte werden mit einer Warnung ignoriert.

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # overrides the global default for this model
  list:
    - id: "alerts"
      params:
        cacheRetention: "none" # overrides both defaults for this agent
```

Zusammenführungsreihenfolge (spätere Einträge haben Vorrang):

1. `agents.defaults.params` – globaler Standard für alle Modelle
2. `agents.defaults.models["provider/model"].params` – Überschreibung pro Modell
3. `agents.list[].params` – Überschreibung pro Agent, abgeglichen anhand der Agent-ID

Quelle: `src/agents/embedded-agent-runner/extra-params.ts` (`resolveExtraParams`).

### `contextPruning.mode: "cache-ttl"`

Entfernt alten Tool-Ergebniskontext nach Ablauf des Cache-TTL-Zeitfensters, sodass eine Anfrage nach einer Leerlaufphase keinen übermäßig großen Verlauf erneut zwischenspeichert.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Das vollständige Verhalten wird unter [Sitzungsbereinigung](/de/concepts/session-pruning) beschrieben.

### Heartbeat zum Warmhalten

Heartbeat kann Cache-Zeitfenster warm halten und wiederholte Cache-Schreibvorgänge nach Leerlaufphasen reduzieren. Global (`agents.defaults.heartbeat`) oder pro Agent (`agents.list[].heartbeat`) konfigurierbar.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## Provider-Verhalten

### Anthropic (direkte API und Vertex AI)

- `cacheRetention` wird für die Provider `anthropic` und `anthropic-vertex` sowie für Claude-Modelle auf `amazon-bedrock` und benutzerdefinierten `anthropic-messages`-kompatiblen Endpunkten unterstützt, wenn `cacheRetention` explizit gesetzt ist.
- Wenn kein Wert festgelegt ist, setzt OpenClaw `cacheRetention: "short"` für direkte Anthropic-Verbindungen voraus (nur Provider `anthropic` und `anthropic-vertex`; andere Routen der Anthropic-Familie erfordern einen expliziten Wert).
- Native Anthropic-Messages-Antworten stellen `cache_read_input_tokens` und `cache_creation_input_tokens` bereit, die `cacheRead` beziehungsweise `cacheWrite` zugeordnet werden.
- `cacheRetention: "short"` wird dem standardmäßigen flüchtigen 5-Minuten-Cache zugeordnet. `cacheRetention: "long"` fordert bei expliziter Festlegung die 1-stündige TTL (`cache_control: { type: "ephemeral", ttl: "1h" }`) an. Eine implizite oder umgebungsabhängige lange Aufbewahrung (`OPENCLAW_CACHE_RETENTION=long` ohne explizites `cacheRetention`) wird nur auf `api.anthropic.com`- oder Vertex-AI-Hosts (`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`) auf die 1-stündige TTL heraufgestuft; andere Hosts behalten den 5-Minuten-Cache bei.

Quelle: `src/agents/anthropic-payload-policy.ts` (`resolveAnthropicEphemeralCacheControl`, `isLongTtlEligibleEndpoint`).

### OpenAI (direkte API)

- Prompt-Caching erfolgt bei unterstützten aktuellen Modellen automatisch; OpenClaw fügt keine Cache-Markierungen auf Blockebene ein.
- OpenClaw sendet `prompt_cache_key`, um das Cache-Routing über mehrere Durchläufe hinweg stabil zu halten. Direkte `api.openai.com`-Hosts erhalten dies automatisch. OpenAI-kompatible Proxys (oMLX, llama.cpp, benutzerdefinierte Endpunkte) benötigen `compat.supportsPromptCacheKey: true` in der Modellkonfiguration, um dies zu aktivieren – bei einem Proxy erfolgt niemals eine automatische Erkennung.
- `prompt_cache_retention: "24h"` wird nur hinzugefügt, wenn `cacheRetention: "long"` ausgewählt ist und der aufgelöste Endpunkt sowohl den Cache-Schlüssel als auch eine lange Aufbewahrung unterstützt (`compat.supportsLongCacheRetention`, standardmäßig wahr; die Kompatibilitätsprofile von Together AI und Cloudflare deaktivieren dies). `cacheRetention: "none"` unterdrückt beide Felder.
- Cache-Treffer werden über `usage.prompt_tokens_details.cached_tokens` (Chat Completions) oder `input_tokens_details.cached_tokens` (Responses API) bereitgestellt und `cacheRead` zugeordnet.
- Nutzlasten der Responses API können außerdem `input_tokens_details.cache_write_tokens` bereitstellen, das `cacheWrite` zugeordnet und zum Cache-Schreibpreis des Modells abgerechnet wird; bei Responses-Nutzlasten ohne dieses Feld bleibt `cacheWrite` auf `0`. Die Chat Completions API von OpenAI dokumentiert oder liefert keinen `cache_write_tokens`-Zähler. OpenClaw liest dort dennoch `prompt_tokens_details.cache_write_tokens` für OpenRouter-kompatible und DeepSeek-artige Proxys aus, die eine separate Schreibanzahl melden.
- In der Praxis verhält sich OpenAI eher wie ein Cache für das anfängliche Präfix als wie die Wiederverwendung des fortlaufenden vollständigen Verlaufs durch Anthropic – siehe unten [Erwartungen an OpenAI im Live-Betrieb](#openai-live-expectations).

### Amazon Bedrock

- Anthropic-Claude-Modellreferenzen (`amazon-bedrock/*anthropic.claude*`, einschließlich der AWS-System-Inferenzprofilpräfixe `us.`/`eu.`/`global.anthropic.claude*`) unterstützen die explizite Durchleitung von `cacheRetention`.
- Bedrock-Modelle außerhalb von Anthropic (beispielsweise `amazon.nova-*`) werden zur Laufzeit unabhängig von einem konfigurierten `cacheRetention`-Wert ohne Cache-Aufbewahrung aufgelöst.
- Undurchsichtige ARNs von Bedrock-Anwendungsinferenzprofilen (Profil-IDs, die `claude` nicht enthalten) werden ebenfalls ohne Cache-Aufbewahrung aufgelöst, sofern `cacheRetention` nicht explizit festgelegt ist, da sich die Modellfamilie nicht allein aus der ARN ableiten lässt.

### OpenRouter

Für `openrouter/anthropic/*`-Modellreferenzen fügt OpenClaw Anthropic-`cache_control`-Markierungen in System-/Entwickler-Prompt-Blöcke ein, jedoch nur, wenn die Anfrage weiterhin an eine verifizierte OpenRouter-Route gerichtet ist (`openrouter` am Standardendpunkt oder ein beliebiger Provider beziehungsweise eine beliebige Basis-URL, die zu `openrouter.ai` aufgelöst wird). Wird das Modell auf eine beliebige OpenAI-kompatible Proxy-URL umgeleitet, endet diese Einfügung.

`contextPruning.mode: "cache-ttl"` ist für die Modellreferenzen `openrouter/anthropic/*`, `openrouter/deepseek/*`, `openrouter/moonshot/*`, `openrouter/moonshotai/*` und `openrouter/zai/*` zulässig, da diese Routen das serverseitige Prompt-Caching des Providers ohne von OpenClaw eingefügte Markierungen verarbeiten.

Quelle: `extensions/openrouter/index.ts` (`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`).

Die Cache-Erstellung für DeepSeek auf OpenRouter erfolgt nach bestem Bemühen und kann einige Sekunden dauern; eine unmittelbar folgende Anfrage kann weiterhin `cached_tokens: 0` anzeigen. Überprüfen Sie dies nach einer kurzen Verzögerung mit einer wiederholten Anfrage mit identischem Präfix und verwenden Sie `usage.prompt_tokens_details.cached_tokens` als Signal für einen Cache-Treffer.

### Google Gemini (direkte API)

- Der direkte Gemini-Transport (`api: "google-generative-ai"`) meldet Cache-Treffer über das vorgelagerte `cachedContentTokenCount`, das `cacheRead` zugeordnet wird.
- Geeignete Modellfamilien: `gemini-2.5*` und `gemini-3*` (Live-/Vorschauvarianten außerhalb dieses Präfixabgleichs sind ausgeschlossen, beispielsweise `gemini-live-2.5-flash-preview`).
- Wenn `cacheRetention` für ein geeignetes Modell festgelegt ist, erstellt, verwendet und aktualisiert OpenClaw automatisch eine `cachedContents`-Ressource für den System-Prompt – ein manueller Handle für zwischengespeicherte Inhalte ist nicht erforderlich. Die TTL beträgt `300s` für `cacheRetention: "short"` und `3600s` für `"long"`.
- Sie können weiterhin einen bereits vorhandenen Gemini-Handle für zwischengespeicherte Inhalte als `params.cachedContent` (oder das ältere `params.cached_content`) übergeben; bei einem expliziten Handle wird der automatische Cache-Verwaltungspfad vollständig übersprungen.
- Dies unterscheidet sich vom Prompt-Präfix-Caching von Anthropic/OpenAI: OpenClaw verwaltet für Gemini eine provider-native `cachedContents`-Ressource, statt Inline-Cache-Markierungen einzufügen.

Quelle: `src/agents/embedded-agent-runner/google-prompt-cache.ts`.

### CLI-Harness-Provider (Claude Code, Gemini CLI)

CLI-Backends, die JSONL-Nutzungsereignisse (`jsonlDialect: "claude-stream-json"` oder `"gemini-stream-json"`) ausgeben, werden über einen gemeinsamen Nutzungsparser verarbeitet, der mehrere Varianten von Feldnamen erkennt, darunter einen einfachen `cached`-Zähler, der `cacheRead` zugeordnet wird. Wenn die JSON-Nutzlast der CLI kein direktes Eingabe-Token-Feld enthält, leitet OpenClaw dieses als `input_tokens - cached` ab. Dies dient ausschließlich der Nutzungsnormalisierung – dadurch werden für diese CLI-gesteuerten Modelle keine Prompt-Cache-Markierungen im Stil von Anthropic/OpenAI erstellt.

Quelle: `src/agents/cli-output.ts` (`toCliUsage`).

### Andere Provider

Wenn ein Provider keinen der oben genannten Cache-Modi unterstützt, hat `cacheRetention` keine Wirkung.

## Cache-Grenze des System-Prompts

OpenClaw teilt den System-Prompt an einer internen Cache-Präfixgrenze in ein **stabiles Präfix** und ein **veränderliches Suffix**. Inhalte oberhalb der Grenze (Tool-Definitionen, Skills-Metadaten, Workspace-Dateien) werden so angeordnet, dass sie über mehrere Durchläufe hinweg byteidentisch bleiben. Inhalte unterhalb der Grenze (beispielsweise `HEARTBEAT.md`, Laufzeitzeitstempel und andere Metadaten pro Durchlauf) können sich ändern, ohne das zwischengespeicherte Präfix ungültig zu machen.

Wichtige Designentscheidungen:

- Stabile Projektkontextdateien des Workspace werden vor `HEARTBEAT.md` angeordnet, sodass Heartbeat-Änderungen das stabile Präfix nicht ungültig machen.
- Die Grenze gilt für die Transportaufbereitung der Anthropic-, OpenAI- und Google-Familien sowie der CLI, sodass alle unterstützten Provider von derselben Präfixstabilität profitieren.
- Codex-Responses- und Anthropic-Vertex-Anfragen werden durch eine grenzbewusste Cache-Aufbereitung geleitet, sodass die Cache-Wiederverwendung mit den Daten übereinstimmt, die die Provider tatsächlich erhalten.
- Fingerabdrücke von System-Prompts werden normalisiert (Leerraum, Zeilenenden, durch Hooks hinzugefügter Kontext und Reihenfolge der Laufzeitfunktionen), sodass semantisch unveränderte Prompts über mehrere Durchläufe hinweg denselben Cache nutzen.

Wenn nach einer Änderung der Konfiguration oder des Workspace unerwartete Spitzen bei `cacheWrite` auftreten, prüfen Sie, ob die Änderung oberhalb oder unterhalb der Cache-Grenze liegt. Das Verschieben veränderlicher Inhalte unter die Grenze (oder deren Stabilisierung) behebt das Problem in der Regel.

## OpenClaw-Schutzmechanismen für Cache-Stabilität

- Gebündelte MCP-Tool-Kataloge werden vor der Tool-Registrierung deterministisch sortiert (zuerst nach Servername, dann nach Tool-Name), sodass Änderungen der `listTools()`-Reihenfolge den Tool-Block nicht verändern und Prompt-Cache-Präfixe nicht ungültig machen.
- Bei älteren Sitzungen mit persistierten Bildblöcken bleiben die **3 zuletzt abgeschlossenen Durchläufe** vollständig erhalten (gezählt werden alle abgeschlossenen Durchläufe, nicht nur solche mit Bildern). Ältere, bereits verarbeitete Bildblöcke werden durch eine Textmarkierung ersetzt, sodass bildreiche Folgeanfragen nicht weiterhin große, veraltete Nutzlasten erneut senden.

## Optimierungsmuster

### Gemischter Datenverkehr (empfohlener Standard)

Behalten Sie für Ihren Haupt-Agent eine langlebige Basis bei und deaktivieren Sie das Caching für Benachrichtigungs-Agents mit stoßweisem Datenverkehr:

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

- Legen Sie als Basis `cacheRetention: "short"` fest.
- Aktivieren Sie `contextPruning.mode: "cache-ttl"`.
- Halten Sie Heartbeat nur bei Agents, die von warmen Caches profitieren, unterhalb Ihrer TTL.

## Live-Regressionstests

OpenClaw führt eine kombinierte Live-Regressionsprüfung für den Cache aus, die wiederholte Präfixe, Tool-Durchläufe, Bilddurchläufe, MCP-artige Tool-Transkripte und eine Anthropic-Kontrolle ohne Cache abdeckt.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

Führen Sie sie wie folgt aus:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Die Baseline-Datei speichert die zuletzt beobachteten Live-Werte sowie die providerspezifischen Regressionsuntergrenzen, mit denen der Test vergleicht. Jeder Lauf verwendet neue sitzungsspezifische Sitzungs-IDs und Prompt-Namespaces, damit der vorherige Cache-Zustand die aktuelle Stichprobe nicht verfälscht. Anthropic und OpenAI verwenden unterschiedliche Durchsetzungsregeln: Wird eine Anthropic-Untergrenze unterschritten, handelt es sich um eine harte Regression (der Test schlägt fehl), während das Unterschreiten einer OpenAI-Untergrenze nur überwacht wird (es wird als Warnung protokolliert und führt nicht zum Fehlschlagen des Laufs). Sie verwenden keinen gemeinsamen providerübergreifenden Schwellenwert.

### Live-Erwartungen für Anthropic

- Erwarten Sie explizite Warmup-Schreibvorgänge über `cacheWrite`.
- Erwarten Sie bei wiederholten Durchläufen eine nahezu vollständige Wiederverwendung des Verlaufs, da die Cache-Steuerung von Anthropic den Cache-Haltepunkt im Verlauf der Unterhaltung fortschreibt.
- Baseline-Untergrenzen für stabile, Tool-, Bild- und MCP-artige Lanes sind harte Regressionsschranken.

### Live-Erwartungen für OpenAI

- Erwarten Sie nur `cacheRead`; `cacheWrite` bleibt bei Chat Completions `0`.
- Behandeln Sie die Cache-Wiederverwendung bei wiederholten Durchläufen als providerspezifisches Plateau, nicht als eine Anthropic-artige fortschreitende Wiederverwendung des vollständigen Verlaufs.
- Untergrenzen dienen nur der Überwachung (eine Unterschreitung wird als Warnung protokolliert und führt nicht zum Fehlschlagen des Tests) und werden aus dem beobachteten Live-Verhalten auf `gpt-5.4-mini` abgeleitet:

| Szenario             | Untergrenze für `cacheRead` | Untergrenze der Trefferrate |
| -------------------- | ----------------: | -------------: |
| Stabiler Präfix        |             4,608 |           0.90 |
| Tool-Transkript      |             4,096 |           0.85 |
| Bildtranskript     |             3,840 |           0.82 |
| MCP-artiges Transkript |             4,096 |           0.85 |

Die zuletzt beobachteten Baseline-Werte (aus `live-cache-regression-baseline.ts`) lagen bei: stabiler Präfix `cacheRead=4864`, Trefferrate `0.966`; Tool-Transkript `cacheRead=4608`, Trefferrate `0.896`; Bildtranskript `cacheRead=4864`, Trefferrate `0.954`; MCP-artiges Transkript `cacheRead=4608`, Trefferrate `0.891`.

Warum sich die Assertions unterscheiden: Anthropic stellt explizite Cache-Haltepunkte und eine fortschreitende Wiederverwendung des Unterhaltungsverlaufs bereit, während der effektiv wiederverwendbare Präfix von OpenAI im Live-Datenverkehr bereits vor dem vollständigen Prompt ein Plateau erreichen kann. Der Vergleich beider Provider anhand eines einzigen providerübergreifenden prozentualen Schwellenwerts führt zu falschen Regressionen.

## `diagnostics.cacheTrace`-Konfiguration

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # standardmäßig true
    includePrompt: false # standardmäßig true
    includeSystem: false # standardmäßig true
```

Standardwerte:

| Schlüssel               | Standardwert                                      |
| ----------------- | -------------------------------------------- |
| `filePath`        | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl` |
| `includeMessages` | `true`                                       |
| `includePrompt`   | `true`                                       |
| `includeSystem`   | `true`                                       |

### Umgebungsumschalter (einmaliges Debugging)

| Variable                             | Auswirkung                               |
| ------------------------------------ | ------------------------------------ |
| `OPENCLAW_CACHE_TRACE=1`             | Aktiviert die Cache-Ablaufverfolgung                |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | Überschreibt den Ausgabepfad                |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | Schaltet die Erfassung der vollständigen Nachrichten-Payload um |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | Schaltet die Erfassung des Prompt-Texts um          |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | Schaltet die Erfassung des System-Prompts um        |

### Zu prüfende Daten

- Cache-Ablaufverfolgungsereignisse liegen im JSONL-Format mit abgestuften Snapshots wie `session:loaded`, `prompt:before`, `stream:context` und `session:after` vor.
- Die Auswirkungen der Cache-Token pro Durchlauf sind in den normalen Nutzungsoberflächen sichtbar: `cacheRead` und `cacheWrite` werden in `/usage tokens`, `/status`, Zusammenfassungen der Sitzungsnutzung und benutzerdefinierten `messages.usageTemplate`-Layouts angezeigt.
- Bei Anthropic sind bei aktiver Zwischenspeicherung sowohl `cacheRead` als auch `cacheWrite` zu erwarten.
- Bei OpenAI ist bei Cache-Treffern `cacheRead` zu erwarten; `cacheWrite` wird nur bei Responses-API-Payloads ausgefüllt, die diesen Wert enthalten (siehe [OpenAI](#openai-direct-api) weiter oben).
- OpenAI gibt außerdem Header für Ablaufverfolgung und Ratenbegrenzung wie `x-request-id`, `openai-processing-ms` und `x-ratelimit-*` zurück; verwenden Sie diese für die Anfrageverfolgung, die Erfassung von Cache-Treffern sollte jedoch weiterhin aus der Nutzungs-Payload und nicht aus den Headern stammen.

## Schnelle Fehlerbehebung

- **Hoher `cacheWrite`-Wert bei den meisten Durchläufen**: Prüfen Sie, ob der System-Prompt veränderliche Eingaben enthält; vergewissern Sie sich, dass das Modell bzw. der Provider Ihre Cache-Einstellungen unterstützt.
- **Hoher `cacheWrite`-Wert bei Anthropic**: Dies bedeutet häufig, dass der Cache-Haltepunkt auf Inhalten liegt, die sich bei jeder Anfrage ändern.
- **Niedriger OpenAI-`cacheRead`-Wert**: Stellen Sie sicher, dass sich der stabile Präfix am Anfang befindet, der wiederholte Präfix mindestens 1024 Token umfasst und derselbe `prompt_cache_key` für Durchläufe wiederverwendet wird, die sich einen Cache teilen sollen.
- **Keine Wirkung von `cacheRetention`**: Vergewissern Sie sich, dass der Modellschlüssel mit `agents.defaults.models["provider/model"]` übereinstimmt.
- **Bedrock-Nova-Anfragen mit Cache-Einstellungen**: Erwartetes Verhalten – diese führen zur Laufzeit zu keiner Cache-Aufbewahrung.

Zugehörige Dokumentation:

- [Anthropic](/de/providers/anthropic)
- [Token-Nutzung und Kosten](/de/reference/token-use)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
- [Referenz zur Gateway-Konfiguration](/de/gateway/configuration-reference)

## Verwandte Themen

- [Token-Nutzung und Kosten](/de/reference/token-use)
- [API-Nutzung und Kosten](/de/reference/api-usage-costs)
