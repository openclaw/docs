---
read_when:
    - Sie möchten die Prompt-Token-Kosten durch Cache-Aufbewahrung reduzieren
    - Sie benötigen in Multi-Agent-Setups ein Cache-Verhalten pro Agent.
    - Sie stimmen Heartbeat und die Bereinigung anhand der Cache-TTL gemeinsam ab.
summary: Optionen für Prompt-Caching, Zusammenführungsreihenfolge, Provider-Verhalten und Optimierungsmuster
title: Prompt-Caching
x-i18n:
    generated_at: "2026-07-12T02:07:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f3e6ba31517a598f22cfdbe04da746a756feadc7c4c376efaa4779cbf05b31
    source_path: reference/prompt-caching.md
    workflow: 16
---

Prompt-Caching ermöglicht es einem Modell-Provider, ein unverändertes Prompt-Präfix (System-/Entwickleranweisungen, Tool-Definitionen und anderen stabilen Kontext) über mehrere Durchläufe hinweg wiederzuverwenden, anstatt es bei jeder Anfrage erneut zu verarbeiten. Dies senkt die Token-Kosten und die Latenz bei lang laufenden Sitzungen mit wiederholtem Kontext.

OpenClaw normalisiert die Nutzungsdaten von Providern überall dort zu `cacheRead` und `cacheWrite`, wo die vorgelagerte API diese Zähler bereitstellt. Nutzungszusammenfassungen (`/status` und ähnliche) greifen auf den letzten Nutzungseintrag im Transkript zurück, wenn der aktuelle Sitzungssnapshot keine Cache-Zähler enthält; ein aktueller Wert ungleich null hat stets Vorrang vor dem Ersatzwert.

Provider-Referenzen:

- [Prompt-Caching von Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Prompt-Caching von OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching)

## Primäre Einstellungen

### `cacheRetention`

Werte: `"none" | "short" | "long"`. Konfigurierbar als globale Standardeinstellung, pro Modell und pro Agent.

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

Zusammenführungsreihenfolge (spätere Werte haben Vorrang):

1. `agents.defaults.params` – globale Standardeinstellung für alle Modelle
2. `agents.defaults.models["provider/model"].params` – Überschreibung pro Modell
3. `agents.list[].params` – Überschreibung pro Agent, abgeglichen anhand der Agent-ID

Quelle: `src/agents/embedded-agent-runner/extra-params.ts` (`resolveExtraParams`).

### `contextPruning.mode: "cache-ttl"`

Entfernt alten Tool-Ergebniskontext, nachdem das Cache-TTL-Zeitfenster abgelaufen ist, sodass eine Anfrage nach einer Leerlaufphase keinen übergroßen Verlauf erneut im Cache ablegt.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Das vollständige Verhalten finden Sie unter [Sitzungsbereinigung](/de/concepts/session-pruning).

### Cache durch Heartbeat warm halten

Heartbeat kann Cache-Zeitfenster warm halten und wiederholte Cache-Schreibvorgänge nach Leerlaufphasen reduzieren. Dies ist global (`agents.defaults.heartbeat`) oder pro Agent (`agents.list[].heartbeat`) konfigurierbar.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## Provider-Verhalten

### Anthropic (direkte API und Vertex AI)

- `cacheRetention` wird für die Provider `anthropic` und `anthropic-vertex` sowie für Claude-Modelle auf `amazon-bedrock` und benutzerdefinierten, mit `anthropic-messages` kompatiblen Endpunkten unterstützt, wenn `cacheRetention` explizit festgelegt ist.
- Wenn kein Wert festgelegt ist, setzt OpenClaw für direkte Anthropic-Verbindungen standardmäßig `cacheRetention: "short"` (nur für die Provider `anthropic` und `anthropic-vertex`; andere Routen der Anthropic-Familie erfordern einen expliziten Wert).
- Native Antworten von Anthropic Messages stellen `cache_read_input_tokens` und `cache_creation_input_tokens` bereit, die `cacheRead` und `cacheWrite` zugeordnet werden.
- `cacheRetention: "short"` entspricht dem standardmäßigen flüchtigen 5-Minuten-Cache. `cacheRetention: "long"` fordert bei expliziter Festlegung eine TTL von 1 Stunde an (`cache_control: { type: "ephemeral", ttl: "1h" }`). Eine implizite oder umgebungsvariablengesteuerte lange Aufbewahrung (`OPENCLAW_CACHE_RETENTION=long` ohne explizites `cacheRetention`) wird nur auf Hosts von `api.anthropic.com` oder Vertex AI (`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`) auf die TTL von 1 Stunde angehoben; andere Hosts verwenden weiterhin den 5-Minuten-Cache.

Quelle: `src/agents/anthropic-payload-policy.ts` (`resolveAnthropicEphemeralCacheControl`, `isLongTtlEligibleEndpoint`).

### OpenAI (direkte API)

- Prompt-Caching erfolgt bei unterstützten aktuellen Modellen automatisch; OpenClaw fügt keine Cache-Markierungen auf Blockebene ein.
- OpenClaw sendet `prompt_cache_key`, damit das Cache-Routing über mehrere Durchläufe hinweg stabil bleibt. Direkte Hosts von `api.openai.com` erhalten diesen Wert automatisch. OpenAI-kompatible Proxys (oMLX, llama.cpp, benutzerdefinierte Endpunkte) müssen sich über `compat.supportsPromptCacheKey: true` in der Modellkonfiguration explizit dafür anmelden – bei einem Proxy wird dies niemals automatisch erkannt.
- `prompt_cache_retention: "24h"` wird nur hinzugefügt, wenn `cacheRetention: "long"` ausgewählt ist und der aufgelöste Endpunkt sowohl den Cache-Schlüssel als auch eine lange Aufbewahrung unterstützt (`compat.supportsLongCacheRetention`, standardmäßig `true`; die Kompatibilitätsprofile von Together AI und Cloudflare deaktivieren dies). `cacheRetention: "none"` unterdrückt beide Felder.
- Cache-Treffer werden über `usage.prompt_tokens_details.cached_tokens` (Chat Completions) oder `input_tokens_details.cached_tokens` (Responses API) bereitgestellt und `cacheRead` zugeordnet.
- Nutzdaten der Responses API können außerdem `input_tokens_details.cache_write_tokens` bereitstellen. Dieser Wert wird `cacheWrite` zugeordnet und mit dem Cache-Schreibpreis des Modells berechnet; bei Responses-Nutzdaten ohne dieses Feld bleibt `cacheWrite` auf `0`. Die Chat Completions API von OpenAI dokumentiert oder liefert keinen Zähler `cache_write_tokens`, OpenClaw liest dort jedoch weiterhin `prompt_tokens_details.cache_write_tokens` für OpenRouter-kompatible und DeepSeek-ähnliche Proxys aus, die eine separate Anzahl von Schreibvorgängen melden.
- In der Praxis verhält sich OpenAI eher wie ein Cache für anfängliche Präfixe als wie die gleitende Wiederverwendung des vollständigen Verlaufs bei Anthropic – siehe unten [Erwartungen an OpenAI im Live-Betrieb](#openai-live-expectations).

### Amazon Bedrock

- Anthropic-Claude-Modellreferenzen (`amazon-bedrock/*anthropic.claude*` sowie Präfixe für AWS-Systeminferenzprofile wie `us.`/`eu.`/`global.anthropic.claude*`) unterstützen die explizite Weitergabe von `cacheRetention`.
- Bedrock-Modelle, die nicht von Anthropic stammen (beispielsweise `amazon.nova-*`), werden zur Laufzeit ohne Cache-Aufbewahrung aufgelöst, unabhängig von einem konfigurierten `cacheRetention`-Wert.
- Undurchsichtige ARNs für Bedrock-Anwendungsinferenzprofile (Profil-IDs, die nicht `claude` enthalten) werden ebenfalls ohne Cache-Aufbewahrung aufgelöst, sofern `cacheRetention` nicht explizit festgelegt ist, da sich die Modellfamilie nicht allein aus der ARN ableiten lässt.

### OpenRouter

Für Modellreferenzen vom Typ `openrouter/anthropic/*` fügt OpenClaw Anthropic-`cache_control`-Markierungen in System-/Entwickler-Prompt-Blöcke ein, jedoch nur, wenn die Anfrage weiterhin an eine verifizierte OpenRouter-Route gerichtet ist (`openrouter` an seinem Standardendpunkt oder ein beliebiger Provider beziehungsweise eine beliebige Basis-URL, die zu `openrouter.ai` aufgelöst wird). Wenn das Modell auf eine beliebige OpenAI-kompatible Proxy-URL umgestellt wird, endet diese Einfügung.

`contextPruning.mode: "cache-ttl"` ist für Modellreferenzen vom Typ `openrouter/anthropic/*`, `openrouter/deepseek/*`, `openrouter/moonshot/*`, `openrouter/moonshotai/*` und `openrouter/zai/*` zulässig, da diese Routen das Provider-seitige Prompt-Caching ohne die von OpenClaw eingefügten Markierungen verarbeiten.

Quelle: `extensions/openrouter/index.ts` (`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`).

Der Cache-Aufbau für DeepSeek auf OpenRouter erfolgt nach bestem Bemühen und kann einige Sekunden dauern; eine unmittelbar folgende Anfrage kann daher weiterhin `cached_tokens: 0` anzeigen. Überprüfen Sie dies nach einer kurzen Verzögerung mit einer wiederholten Anfrage mit identischem Präfix und verwenden Sie `usage.prompt_tokens_details.cached_tokens` als Signal für einen Cache-Treffer.

### Google Gemini (direkte API)

- Der direkte Gemini-Transport (`api: "google-generative-ai"`) meldet Cache-Treffer über das vorgelagerte Feld `cachedContentTokenCount`, das `cacheRead` zugeordnet wird.
- Geeignete Modellfamilien: `gemini-2.5*` und `gemini-3*` (ausgenommen Live-/Vorschauvarianten außerhalb dieses Präfixabgleichs, beispielsweise `gemini-live-2.5-flash-preview`).
- Wenn `cacheRetention` für ein geeignetes Modell festgelegt ist, erstellt, verwendet und aktualisiert OpenClaw automatisch eine `cachedContents`-Ressource für den System-Prompt – ein manueller Handle für zwischengespeicherte Inhalte ist nicht erforderlich. Die TTL beträgt `300s` für `cacheRetention: "short"` und `3600s` für `"long"`.
- Sie können weiterhin einen vorhandenen Gemini-Handle für zwischengespeicherte Inhalte über `params.cachedContent` (oder das veraltete `params.cached_content`) übergeben; ein expliziter Handle überspringt den automatischen Cache-Verwaltungspfad vollständig.
- Dies unterscheidet sich vom Prompt-Präfix-Caching von Anthropic und OpenAI: OpenClaw verwaltet für Gemini eine Provider-native `cachedContents`-Ressource, anstatt eingebettete Cache-Markierungen einzufügen.

Quelle: `src/agents/embedded-agent-runner/google-prompt-cache.ts`.

### CLI-Harness-Provider (Claude Code, Gemini CLI)

CLI-Backends, die JSONL-Nutzungsereignisse ausgeben (`jsonlDialect: "claude-stream-json"` oder `"gemini-stream-json"`), durchlaufen einen gemeinsamen Nutzungsparser, der mehrere Varianten von Feldnamen erkennt, darunter einen einfachen Zähler `cached`, der `cacheRead` zugeordnet wird. Wenn die JSON-Nutzdaten der CLI kein direktes Feld für Eingabe-Token enthalten, leitet OpenClaw dieses als `input_tokens - cached` ab. Dies dient ausschließlich der Normalisierung der Nutzungsdaten – für diese CLI-gesteuerten Modelle werden dadurch keine Prompt-Cache-Markierungen nach Art von Anthropic oder OpenAI erstellt.

Quelle: `src/agents/cli-output.ts` (`toCliUsage`).

### Andere Provider

Wenn ein Provider keinen der oben genannten Cache-Modi unterstützt, hat `cacheRetention` keine Wirkung.

## Cache-Grenze des System-Prompts

OpenClaw teilt den System-Prompt an einer internen Cache-Präfixgrenze in ein **stabiles Präfix** und ein **veränderliches Suffix**. Inhalte oberhalb der Grenze (Tool-Definitionen, Metadaten zu Skills, Workspace-Dateien) werden so angeordnet, dass sie über mehrere Durchläufe hinweg byteidentisch bleiben. Inhalte unterhalb der Grenze (beispielsweise `HEARTBEAT.md`, Laufzeit-Zeitstempel und andere Metadaten pro Durchlauf) können sich ändern, ohne das zwischengespeicherte Präfix ungültig zu machen.

Wichtige Entwurfsentscheidungen:

- Stabile Projektkontextdateien des Workspace werden vor `HEARTBEAT.md` angeordnet, damit Heartbeat-Änderungen das stabile Präfix nicht ungültig machen.
- Die Grenze gilt für die Nutzdatengestaltung der Anthropic-Familie, OpenAI-Familie, Google und CLI-Transporte, sodass alle unterstützten Provider von derselben Präfixstabilität profitieren.
- Anfragen von Codex Responses und Anthropic Vertex werden durch eine grenzwertbewusste Cache-Gestaltung geleitet, sodass die Cache-Wiederverwendung mit den Daten übereinstimmt, die Provider tatsächlich empfangen.
- Fingerabdrücke von System-Prompts werden normalisiert (Leerraum, Zeilenenden, durch Hooks hinzugefügter Kontext und Reihenfolge der Laufzeitfunktionen), sodass semantisch unveränderte Prompts über mehrere Durchläufe hinweg denselben Cache verwenden.

Wenn Sie nach einer Konfigurations- oder Workspace-Änderung unerwartete Spitzen bei `cacheWrite` feststellen, prüfen Sie, ob die Änderung oberhalb oder unterhalb der Cache-Grenze liegt. Das Verschieben veränderlicher Inhalte unter die Grenze oder deren Stabilisierung behebt das Problem in der Regel.

## Schutzmechanismen für die Cache-Stabilität in OpenClaw

- Mitgelieferte MCP-Tool-Kataloge werden vor der Tool-Registrierung deterministisch sortiert (zuerst nach Servername, dann nach Tool-Name), sodass Änderungen an der Reihenfolge von `listTools()` den Tool-Block nicht verändern und Prompt-Cache-Präfixe nicht ungültig machen.
- Bei älteren Sitzungen mit dauerhaft gespeicherten Bildblöcken bleiben die **3 zuletzt abgeschlossenen Durchläufe** unverändert erhalten (gezählt werden alle abgeschlossenen Durchläufe, nicht nur diejenigen mit Bildern). Ältere, bereits verarbeitete Bildblöcke werden durch eine Textmarkierung ersetzt, damit bildlastige Folgeanfragen nicht wiederholt große veraltete Nutzdaten senden.

## Abstimmungsmuster

### Gemischter Datenverkehr (empfohlene Standardeinstellung)

Verwenden Sie für Ihren Haupt-Agent eine langlebige Basis und deaktivieren Sie das Caching für Agenten mit stoßartigem Benachrichtigungsverkehr:

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

### Kostenorientierte Basiskonfiguration

- Legen Sie für die Basiskonfiguration `cacheRetention: "short"` fest.
- Aktivieren Sie `contextPruning.mode: "cache-ttl"`.
- Halten Sie das Heartbeat-Intervall nur bei Agenten, die von warmen Caches profitieren, unterhalb Ihrer TTL.

## Live-Regressionstests

OpenClaw führt eine kombinierte Live-Regressionsprüfung für den Cache aus, die wiederholte Präfixe, Tool-Durchläufe, Bilddurchläufe, MCP-ähnliche Tool-Transkripte und eine Anthropic-Kontrollgruppe ohne Cache abdeckt.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

Führen Sie sie wie folgt aus:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Die Basisdatei speichert die zuletzt beobachteten Live-Werte sowie die Provider-spezifischen Regressionsuntergrenzen, gegen die der Test prüft. Jeder Durchlauf verwendet neue sitzungsspezifische IDs und Prompt-Namespaces, damit ein vorheriger Cache-Zustand die aktuelle Stichprobe nicht verfälscht. Anthropic und OpenAI verwenden unterschiedliche Durchsetzungsregeln: Wird eine Anthropic-Untergrenze unterschritten, gilt dies als harte Regression und der Test schlägt fehl; wird eine OpenAI-Untergrenze unterschritten, dient dies nur der Beobachtung und wird als Warnung aufgezeichnet, ohne dass der Durchlauf fehlschlägt. Es gibt keinen gemeinsamen, Provider-übergreifenden Schwellenwert.

### Erwartungen an Anthropic im Live-Betrieb

- Erwarten Sie explizite Aufwärm-Schreibvorgänge über `cacheWrite`.
- Erwarten Sie bei wiederholten Durchläufen eine nahezu vollständige Wiederverwendung des Verlaufs, da die Cache-Steuerung von Anthropic den Cache-Haltepunkt im Verlauf der Unterhaltung weiter verschiebt.
- Untergrenzen für stabile, Tool-, Bild- und MCP-ähnliche Pfade sind verbindliche Regressionsprüfungen.

### Erwartungen an OpenAI-Livebetrieb

- Erwarten Sie ausschließlich `cacheRead`; bei Chat Completions bleibt `cacheWrite` auf `0`.
- Betrachten Sie die Cache-Wiederverwendung bei wiederholten Durchläufen als Provider-spezifisches Plateau und nicht als eine sich verschiebende Wiederverwendung des vollständigen Verlaufs wie bei Anthropic.
- Untergrenzen dienen nur der Überwachung (eine Unterschreitung wird als Warnung protokolliert und führt nicht zum Fehlschlagen des Tests) und wurden aus dem beobachteten Liveverhalten von `gpt-5.4-mini` abgeleitet:

| Szenario                | `cacheRead`-Untergrenze | Trefferquoten-Untergrenze |
| ----------------------- | ----------------------: | ------------------------: |
| Stabiles Präfix         |                   4.608 |                      0,90 |
| Tool-Transkript         |                   4.096 |                      0,85 |
| Bildtranskript          |                   3.840 |                      0,82 |
| MCP-ähnliches Transkript |                  4.096 |                      0,85 |

Die zuletzt beobachteten Basiswerte (aus `live-cache-regression-baseline.ts`) lagen bei: stabiles Präfix `cacheRead=4864`, Trefferquote `0.966`; Tool-Transkript `cacheRead=4608`, Trefferquote `0.896`; Bildtranskript `cacheRead=4864`, Trefferquote `0.954`; MCP-ähnliches Transkript `cacheRead=4608`, Trefferquote `0.891`.

Warum sich die Prüfbedingungen unterscheiden: Anthropic stellt explizite Cache-Haltepunkte und eine sich verschiebende Wiederverwendung des Unterhaltungsverlaufs bereit, während das effektiv wiederverwendbare Präfix von OpenAI im Live-Datenverkehr bereits vor dem vollständigen Prompt ein Plateau erreichen kann. Werden beide Provider anhand eines einzigen providerübergreifenden prozentualen Schwellenwerts verglichen, entstehen fälschlicherweise gemeldete Regressionen.

## Konfiguration von `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # Standardwert: true
    includePrompt: false # Standardwert: true
    includeSystem: false # Standardwert: true
```

Standardwerte:

| Schlüssel          | Standardwert                                  |
| ------------------ | --------------------------------------------- |
| `filePath`         | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`  |
| `includeMessages`  | `true`                                        |
| `includePrompt`    | `true`                                        |
| `includeSystem`    | `true`                                        |

### Umgebungsvariablen für einmalige Fehlerdiagnosen

| Variable                             | Wirkung                                        |
| ------------------------------------ | ---------------------------------------------- |
| `OPENCLAW_CACHE_TRACE=1`             | Aktiviert die Cache-Ablaufverfolgung           |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | Überschreibt den Ausgabepfad                    |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | Schaltet die Erfassung vollständiger Nachrichteninhalte um |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | Schaltet die Erfassung des Prompt-Texts um      |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | Schaltet die Erfassung des System-Prompts um    |

### Was Sie untersuchen sollten

- Cache-Ablaufverfolgungsereignisse liegen als JSONL mit stufenweisen Momentaufnahmen wie `session:loaded`, `prompt:before`, `stream:context` und `session:after` vor.
- Die Auswirkung der Cache-Token je Durchlauf ist in den normalen Nutzungsansichten sichtbar: `cacheRead` und `cacheWrite` erscheinen in `/usage tokens`, `/status`, den Sitzungszusammenfassungen zur Nutzung und benutzerdefinierten `messages.usageTemplate`-Layouts.
- Bei Anthropic sind bei aktivem Caching sowohl `cacheRead` als auch `cacheWrite` zu erwarten.
- Bei OpenAI ist bei Cache-Treffern `cacheRead` zu erwarten; `cacheWrite` wird nur bei Nutzdaten der Responses API befüllt, die diesen Wert enthalten (siehe oben [OpenAI](#openai-direct-api)).
- OpenAI gibt außerdem Header für Ablaufverfolgung und Ratenbegrenzung wie `x-request-id`, `openai-processing-ms` und `x-ratelimit-*` zurück. Verwenden Sie diese zur Anfrageverfolgung; die Erfassung von Cache-Treffern sollte jedoch weiterhin aus den Nutzungsdaten und nicht aus den Headern stammen.

## Schnelle Fehlerbehebung

- **Hohes `cacheWrite` bei den meisten Durchläufen**: Prüfen Sie den System-Prompt auf veränderliche Eingaben und verifizieren Sie, dass das Modell bzw. der Provider Ihre Cache-Einstellungen unterstützt.
- **Hohes `cacheWrite` bei Anthropic**: Dies bedeutet häufig, dass der Cache-Haltepunkt auf Inhalten liegt, die sich bei jeder Anfrage ändern.
- **Niedriges `cacheRead` bei OpenAI**: Verifizieren Sie, dass sich das stabile Präfix am Anfang befindet, das wiederholte Präfix mindestens 1024 Token umfasst und derselbe `prompt_cache_key` für Durchläufe wiederverwendet wird, die einen Cache gemeinsam nutzen sollen.
- **Keine Wirkung von `cacheRetention`**: Vergewissern Sie sich, dass der Modellschlüssel mit `agents.defaults.models["provider/model"]` übereinstimmt.
- **Bedrock-Nova-Anfragen mit Cache-Einstellungen**: Erwartetes Verhalten – diese werden zur Laufzeit ohne Cache-Aufbewahrung aufgelöst.

Zugehörige Dokumentation:

- [Anthropic](/de/providers/anthropic)
- [Token-Nutzung und Kosten](/de/reference/token-use)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
- [Referenz zur Gateway-Konfiguration](/de/gateway/configuration-reference)

## Verwandte Themen

- [Token-Nutzung und Kosten](/de/reference/token-use)
- [API-Nutzung und Kosten](/de/reference/api-usage-costs)
