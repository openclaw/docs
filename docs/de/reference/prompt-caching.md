---
read_when:
    - Sie möchten die Kosten für Prompt-Tokens mit Cache Retention senken
    - Sie benötigen pro Agent unterschiedliches Cache-Verhalten in Multi-Agent-Setups
    - Sie optimieren Heartbeat und `cache-ttl`-Pruning gemeinsam
summary: Prompt-Caching-Schalter, Merge-Reihenfolge, Provider-Verhalten und Tuning-Muster
title: Prompt Caching
x-i18n:
    generated_at: "2026-04-25T13:56:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f3d1a5751ca0cab4c5b83c8933ec732b58c60d430e00c24ae9a75036aa0a6a3
    source_path: reference/prompt-caching.md
    workflow: 15
---

Prompt Caching bedeutet, dass der Modell-Provider unveränderte Prompt-Präfixe (meist System-/Entwickleranweisungen und anderen stabilen Kontext) über mehrere Züge hinweg wiederverwenden kann, statt sie jedes Mal erneut zu verarbeiten. OpenClaw normalisiert die Provider-Nutzung zu `cacheRead` und `cacheWrite`, wenn die Upstream-API diese Zähler direkt bereitstellt.

Status-Oberflächen können Cache-Zähler außerdem aus dem neuesten Nutzungseintrag im Transkriptprotokoll wiederherstellen, wenn sie im Live-Sitzungs-Snapshot fehlen, sodass `/status` auch nach teilweisem Verlust von Sitzungsmetadaten weiterhin eine Cache-Zeile anzeigen kann. Bereits vorhandene, von null verschiedene Live-Cache-Werte haben weiterhin Vorrang vor Fallback-Werten aus dem Transkript.

Warum das wichtig ist: geringere Token-Kosten, schnellere Antworten und besser vorhersagbare Leistung bei lang laufenden Sitzungen. Ohne Caching zahlen wiederholte Prompts bei jedem Zug die vollen Prompt-Kosten, selbst wenn sich der größte Teil der Eingabe nicht geändert hat.

Die folgenden Abschnitte behandeln alle cachebezogenen Schalter, die Wiederverwendung von Prompts und Token-Kosten beeinflussen.

Provider-Referenzen:

- Anthropic Prompt Caching: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI Prompt Caching: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI-API-Header und Request-IDs: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic Request-IDs und Fehler: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Primäre Schalter

### `cacheRetention` (globaler Standard, Modell und pro Agent)

Cache Retention als globalen Standard für alle Modelle setzen:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Pro Modell überschreiben:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Überschreibung pro Agent:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Reihenfolge des Konfigurations-Merge:

1. `agents.defaults.params` (globaler Standard — gilt für alle Modelle)
2. `agents.defaults.models["provider/model"].params` (Überschreibung pro Modell)
3. `agents.list[].params` (passende Agenten-ID; überschreibt nach Schlüssel)

### `contextPruning.mode: "cache-ttl"`

Beschneidet alten Tool-Ergebnis-Kontext nach Cache-TTL-Fenstern, damit Anfragen nach Leerlauf keinen übergroßen Verlauf erneut cachen.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Siehe [Session Pruning](/de/concepts/session-pruning) für das vollständige Verhalten.

### Heartbeat keep-warm

Heartbeat kann Cache-Fenster warm halten und wiederholte Cache-Schreibvorgänge nach Leerlaufphasen reduzieren.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat pro Agent wird unter `agents.list[].heartbeat` unterstützt.

## Provider-Verhalten

### Anthropic (direkte API)

- `cacheRetention` wird unterstützt.
- Bei Anthropic-Auth-Profilen mit API-Key setzt OpenClaw standardmäßig `cacheRetention: "short"` für Anthropic-Modellreferenzen, wenn es nicht gesetzt ist.
- Native Anthropic-Messages-Antworten liefern sowohl `cache_read_input_tokens` als auch `cache_creation_input_tokens`, sodass OpenClaw sowohl `cacheRead` als auch `cacheWrite` anzeigen kann.
- Bei nativen Anthropic-Anfragen entspricht `cacheRetention: "short"` dem standardmäßigen ephemeren 5-Minuten-Cache, und `cacheRetention: "long"` hebt dies nur auf direkten Hosts von `api.anthropic.com` auf die 1-Stunden-TTL an.

### OpenAI (direkte API)

- Prompt Caching erfolgt bei unterstützten neueren Modellen automatisch. OpenClaw muss keine blockbezogenen Cache-Marker einfügen.
- OpenClaw verwendet `prompt_cache_key`, um Cache-Routing über Züge hinweg stabil zu halten, und verwendet `prompt_cache_retention: "24h"` nur dann, wenn `cacheRetention: "long"` auf direkten OpenAI-Hosts ausgewählt ist.
- OpenAI-kompatible Completions-Provider erhalten `prompt_cache_key` nur dann, wenn ihre Modellkonfiguration explizit `compat.supportsPromptCacheKey: true` setzt; `cacheRetention: "none"` unterdrückt es weiterhin.
- OpenAI gibt gecachte Prompt-Tokens über `usage.prompt_tokens_details.cached_tokens` zurück (oder `input_tokens_details.cached_tokens` bei Responses-API-Ereignissen). OpenClaw ordnet dies `cacheRead` zu.
- OpenAI stellt keinen separaten Zähler für Cache-Schreibtokens bereit, daher bleibt `cacheWrite` auf OpenAI-Pfaden `0`, auch wenn der Provider gerade einen Cache aufwärmt.
- OpenAI liefert nützliche Tracing- und Rate-Limit-Header wie `x-request-id`, `openai-processing-ms` und `x-ratelimit-*`, aber die Erfassung von Cache-Treffern sollte aus der Usage-Payload stammen, nicht aus Headern.
- In der Praxis verhält sich OpenAI oft eher wie ein Initial-Prefix-Cache statt wie eine vollständige gleitende Wiederverwendung des Verlaufs im Stil von Anthropic. Stabile lange Präfixe können in aktuellen Live-Probes bei etwa `4864` gecachten Tokens landen, während tool-lastige oder MCP-artige Transkripte oft selbst bei exakten Wiederholungen bei ungefähr `4608` gecachten Tokens plateauieren.

### Anthropic Vertex

- Anthropic-Modelle auf Vertex AI (`anthropic-vertex/*`) unterstützen `cacheRetention` auf dieselbe Weise wie direktes Anthropic.
- `cacheRetention: "long"` entspricht auf Vertex-AI-Endpunkten der echten 1-Stunden-TTL des Prompt-Cache.
- Die standardmäßige Cache Retention für `anthropic-vertex` entspricht den Standards von direktem Anthropic.
- Vertex-Anfragen werden über boundary-aware Cache-Shaping geroutet, sodass die Wiederverwendung des Cache mit dem übereinstimmt, was die Provider tatsächlich empfangen.

### Amazon Bedrock

- Anthropic-Claude-Modellreferenzen (`amazon-bedrock/*anthropic.claude*`) unterstützen explizites Durchreichen von `cacheRetention`.
- Nicht-Anthropic-Bedrock-Modelle werden zur Laufzeit zu `cacheRetention: "none"` gezwungen.

### OpenRouter-Modelle

Für Modellreferenzen `openrouter/anthropic/*` fügt OpenClaw Anthropic-
`cache_control` auf Blöcken mit System-/Entwickler-Prompts ein, um die Wiederverwendung des Prompt-Cache nur dann zu verbessern, wenn die Anfrage weiterhin auf eine verifizierte OpenRouter-Route zielt
(`openrouter` auf seinem Standard-Endpunkt oder auf einen beliebigen Provider/eine beliebige Base-URL, die
zu `openrouter.ai` aufgelöst wird).

Für Modellreferenzen `openrouter/deepseek/*`, `openrouter/moonshot*/*` und `openrouter/zai/*` ist `contextPruning.mode: "cache-ttl"` erlaubt, weil OpenRouter providerseitiges Prompt Caching automatisch verarbeitet. OpenClaw fügt in diese Anfragen keine Anthropic-
`cache_control`-Marker ein.

Die Cache-Erstellung von DeepSeek ist Best-Effort und kann einige Sekunden dauern. Eine
unmittelbare Folgeanfrage kann weiterhin `cached_tokens: 0` anzeigen; verifizieren Sie mit einer wiederholten Anfrage mit demselben Präfix nach einer kurzen Verzögerung und verwenden Sie `usage.prompt_tokens_details.cached_tokens`
als Signal für einen Cache-Treffer.

Wenn Sie das Modell auf einen beliebigen OpenAI-kompatiblen Proxy-URL umleiten, hört OpenClaw
auf, diese OpenRouter-spezifischen Anthropic-Cache-Marker einzufügen.

### Andere Provider

Wenn der Provider diesen Cache-Modus nicht unterstützt, hat `cacheRetention` keine Wirkung.

### Google Gemini direkte API

- Direkter Gemini-Transport (`api: "google-generative-ai"`) meldet Cache-Treffer
  über `cachedContentTokenCount` des Upstream; OpenClaw ordnet dies `cacheRead` zu.
- Wenn `cacheRetention` für ein direktes Gemini-Modell gesetzt ist, erstellt,
  wiederverwendet und aktualisiert OpenClaw automatisch `cachedContents`-Ressourcen für Systemprompts
  bei Läufen mit Google AI Studio. Das bedeutet, dass Sie keinen
  Handle für bereits gecachte Inhalte mehr manuell vorerstellen müssen.
- Sie können weiterhin einen bestehenden Gemini-Handle für gecachte Inhalte über
  `params.cachedContent` (oder veraltet `params.cached_content`) für das konfigurierte
  Modell durchreichen.
- Dies ist getrennt vom Prompt-Prefix-Caching von Anthropic/OpenAI. Für Gemini
  verwaltet OpenClaw eine native `cachedContents`-Ressource des Providers, statt
  Cache-Marker in die Anfrage einzufügen.

### JSON-Usage von Gemini CLI

- JSON-Ausgabe von Gemini CLI kann Cache-Treffer ebenfalls über `stats.cached` anzeigen;
  OpenClaw ordnet dies `cacheRead` zu.
- Wenn die CLI keinen direkten `stats.input`-Wert liefert, leitet OpenClaw
  Eingabe-Tokens aus `stats.input_tokens - stats.cached` ab.
- Dies ist nur eine Normalisierung der Usage. Es bedeutet nicht, dass OpenClaw
  Prompt-Cache-Marker im Stil von Anthropic/OpenAI für Gemini CLI erstellt.

## Cache-Grenze des Systemprompts

OpenClaw teilt den Systemprompt in ein **stabiles Präfix** und ein **volatiles
Suffix**, getrennt durch eine interne Cache-Präfix-Grenze. Inhalt oberhalb der
Grenze (Tool-Definitionen, Skills-Metadaten, Workspace-Dateien und anderer
relativ statischer Kontext) wird so angeordnet, dass er über Züge hinweg byte-identisch bleibt.
Inhalt unterhalb der Grenze (zum Beispiel `HEARTBEAT.md`, Runtime-Timestamps und
andere Metadaten pro Zug) darf sich ändern, ohne das gecachte Präfix zu invalidieren.

Wichtige Designentscheidungen:

- Stabile Projektkontextdateien aus dem Workspace werden vor `HEARTBEAT.md` angeordnet, damit
  Änderungen durch Heartbeat das stabile Präfix nicht zerstören.
- Die Grenze wird über Cache-Shaping für die Anthropic-Familie, OpenAI-Familie, Google und
  CLI-Transporte angewendet, sodass alle unterstützten Provider von derselben Stabilität des Präfixes profitieren.
- Codex Responses und Anthropic-Vertex-Anfragen werden über
  boundary-aware Cache-Shaping geroutet, sodass die Wiederverwendung des Cache mit dem übereinstimmt, was Provider tatsächlich empfangen.
- Fingerprints von Systemprompts werden normalisiert (Whitespace, Zeilenenden,
  von Hooks hinzugefügter Kontext, Reihenfolge von Runtime-Fähigkeiten), sodass semantisch unveränderte
  Prompts KV/Cache über mehrere Züge hinweg teilen.

Wenn Sie nach einer Änderung an Konfiguration oder Workspace unerwartete `cacheWrite`-Spitzen sehen,
prüfen Sie, ob die Änderung oberhalb oder unterhalb der Cache-Grenze landet. Flüchtige Inhalte unter die Grenze zu verschieben (oder sie zu stabilisieren) löst das Problem oft.

## Schutzvorrichtungen von OpenClaw für Cache-Stabilität

OpenClaw hält außerdem mehrere cache-sensitive Payload-Formen deterministisch, bevor
die Anfrage den Provider erreicht:

- Kataloge von MCP-Tools in Bundles werden deterministisch sortiert, bevor
  Tools registriert werden, sodass Änderungen der Reihenfolge von `listTools()` den Tools-Block nicht verändern und keine Präfixe des Prompt-Cache ungültig machen.
- Legacy-Sitzungen mit persistierten Bildblöcken behalten die **3 neuesten
  abgeschlossenen Züge** intakt; ältere, bereits verarbeitete Bildblöcke können
  durch einen Marker ersetzt werden, damit bildlastige Folgeanfragen nicht weiterhin große
  veraltete Payloads erneut senden.

## Tuning-Muster

### Gemischter Verkehr (empfohlener Standard)

Behalten Sie eine langlebige Basis auf Ihrem Haupt-Agenten, deaktivieren Sie Caching auf burstigen Benachrichtigungs-Agenten:

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

- Setzen Sie als Basis `cacheRetention: "short"`.
- Aktivieren Sie `contextPruning.mode: "cache-ttl"`.
- Halten Sie Heartbeat nur für Agenten unterhalb Ihrer TTL, die von warmen Caches profitieren.

## Cache-Diagnostik

OpenClaw stellt dedizierte Diagnostik mit Cache-Trace für eingebettete Agentenläufe bereit.

Für normale, benutzerseitige Diagnostik können `/status` und andere Nutzungszusammenfassungen
den neuesten Usage-Eintrag des Transkripts als Fallback-Quelle für `cacheRead` /
`cacheWrite` verwenden, wenn der Live-Sitzungseintrag diese Zähler nicht hat.

## Live-Regressionstests

OpenClaw hält ein kombiniertes Live-Regression-Gate für Cache-Verhalten bei wiederholten Präfixen, Tool-Zügen, Bild-Zügen, MCP-artigen Tool-Transkripten und einer Anthropic-Kontrolle ohne Cache.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Führen Sie das schmale Live-Gate aus mit:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Die Baseline-Datei speichert die zuletzt beobachteten Live-Werte sowie die providerspezifischen Regressionsuntergrenzen, die vom Test verwendet werden.
Der Runner verwendet außerdem frische Sitzungs-IDs und Prompt-Namespaces pro Lauf, damit vorheriger Cache-Status die aktuelle Regressionsprobe nicht verfälscht.

Diese Tests verwenden absichtlich keine identischen Erfolgskriterien für alle Provider.

### Live-Erwartungen für Anthropic

- Erwarten Sie explizite Aufwärm-Schreibvorgänge über `cacheWrite`.
- Erwarten Sie bei wiederholten Zügen eine nahezu vollständige Wiederverwendung des Verlaufs, weil die Anthropic-Cache-Steuerung den Cache-Breakpoint durch die Konversation verschiebt.
- Aktuelle Live-Assertions verwenden weiterhin hohe Schwellenwerte für Trefferquoten bei stabilen, tool- und bildbasierten Pfaden.

### Live-Erwartungen für OpenAI

- Erwarten Sie nur `cacheRead`. `cacheWrite` bleibt `0`.
- Behandeln Sie die Cache-Wiederverwendung bei wiederholten Zügen als providerspezifisches Plateau, nicht als gleitende Wiederverwendung des vollständigen Verlaufs im Stil von Anthropic.
- Aktuelle Live-Assertions verwenden konservative Mindestwerte, die aus beobachtetem Live-Verhalten auf `gpt-5.4-mini` abgeleitet sind:
  - stabiles Präfix: `cacheRead >= 4608`, Trefferquote `>= 0.90`
  - Tool-Transkript: `cacheRead >= 4096`, Trefferquote `>= 0.85`
  - Bild-Transkript: `cacheRead >= 3840`, Trefferquote `>= 0.82`
  - MCP-artiges Transkript: `cacheRead >= 4096`, Trefferquote `>= 0.85`

Frische kombinierte Live-Verifizierung vom 2026-04-04 ergab:

- stabiles Präfix: `cacheRead=4864`, Trefferquote `0.966`
- Tool-Transkript: `cacheRead=4608`, Trefferquote `0.896`
- Bild-Transkript: `cacheRead=4864`, Trefferquote `0.954`
- MCP-artiges Transkript: `cacheRead=4608`, Trefferquote `0.891`

Die jüngste lokale Wall-Clock-Zeit für das kombinierte Gate lag bei etwa `88s`.

Warum sich die Assertions unterscheiden:

- Anthropic stellt explizite Cache-Breakpoints und eine gleitende Wiederverwendung des Gesprächsverlaufs bereit.
- OpenAI Prompt Caching bleibt weiterhin empfindlich gegenüber exakten Präfixen, aber das effektiv wiederverwendbare Präfix im Live-Responses-Verkehr kann früher plateauieren als der vollständige Prompt.
- Deshalb führen Vergleiche von Anthropic und OpenAI mit einem einzigen providerübergreifenden Prozent-Schwellenwert zu falschen Regressionen.

### Konfiguration `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # Standard true
    includePrompt: false # Standard true
    includeSystem: false # Standard true
```

Standardwerte:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Env-Toggles (einmaliges Debugging)

- `OPENCLAW_CACHE_TRACE=1` aktiviert Cache-Trace.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` überschreibt den Ausgabepfad.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` schaltet die Erfassung vollständiger Nachrichten-Payloads um.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` schaltet die Erfassung des Prompt-Textes um.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` schaltet die Erfassung des Systemprompts um.

### Was geprüft werden sollte

- Cache-Trace-Ereignisse sind JSONL und enthalten stufenweise Snapshots wie `session:loaded`, `prompt:before`, `stream:context` und `session:after`.
- Die Auswirkung von Cache-Tokens pro Zug ist in normalen Nutzungsoberflächen über `cacheRead` und `cacheWrite` sichtbar (zum Beispiel `/usage full` und Nutzungszusammenfassungen von Sitzungen).
- Bei Anthropic sind bei aktivem Caching sowohl `cacheRead` als auch `cacheWrite` zu erwarten.
- Bei OpenAI ist bei Cache-Treffern `cacheRead` zu erwarten, während `cacheWrite` `0` bleibt; OpenAI veröffentlicht kein separates Feld für Cache-Schreibtokens.
- Wenn Sie Request-Tracing benötigen, protokollieren Sie Request-IDs und Rate-Limit-Header getrennt von Cache-Metriken. Die aktuelle Ausgabe von Cache-Trace in OpenClaw konzentriert sich auf Form von Prompt/Sitzung und normalisierte Token-Nutzung statt auf rohe Header von Provider-Antworten.

## Schnelle Fehlerbehebung

- Hohes `cacheWrite` bei den meisten Zügen: auf volatile Eingaben im Systemprompt prüfen und verifizieren, dass Modell/Provider Ihre Cache-Einstellungen unterstützt.
- Hohes `cacheWrite` bei Anthropic: bedeutet oft, dass der Cache-Breakpoint auf Inhalt landet, der sich bei jeder Anfrage ändert.
- Niedriges `cacheRead` bei OpenAI: verifizieren, dass das stabile Präfix am Anfang steht, das wiederholte Präfix mindestens 1024 Tokens umfasst und derselbe `prompt_cache_key` für Züge wiederverwendet wird, die einen Cache teilen sollen.
- Keine Wirkung von `cacheRetention`: bestätigen, dass der Modellschlüssel mit `agents.defaults.models["provider/model"]` übereinstimmt.
- Bedrock-Nova-/Mistral-Anfragen mit Cache-Einstellungen: erwartete Laufzeit-Erzwingung auf `none`.

Verwandte Dokumente:

- [Anthropic](/de/providers/anthropic)
- [Token use and costs](/de/reference/token-use)
- [Session pruning](/de/concepts/session-pruning)
- [Gateway configuration reference](/de/gateway/configuration-reference)

## Verwandt

- [Token use and costs](/de/reference/token-use)
- [API usage and costs](/de/reference/api-usage-costs)
