---
read_when:
    - Sie möchten Prompt-Token-Kosten durch Cache-Erhaltung senken
    - Sie benötigen agentenspezifisches Cache-Verhalten in Multi-Agent-Setups
    - Sie stimmen Heartbeat und Cache-TTL-Bereinigung gemeinsam ab
summary: Prompt-Caching-Einstellungen, Zusammenführungsreihenfolge, Provider-Verhalten und Tuning-Muster
title: Prompt-Caching
x-i18n:
    generated_at: "2026-07-01T07:58:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dbbc46d5f726ae5e9b3bb51af0d271e49df768bc93de6e13b4c87519f0fca5c3
    source_path: reference/prompt-caching.md
    workflow: 16
---

Prompt-Caching bedeutet, dass der Modell-Provider unveränderte Prompt-Präfixe (meist System-/Developer-Anweisungen und anderen stabilen Kontext) über Turns hinweg wiederverwenden kann, statt sie jedes Mal neu zu verarbeiten. OpenClaw normalisiert die Provider-Nutzung zu `cacheRead` und `cacheWrite`, wenn die Upstream-API diese Zähler direkt bereitstellt.

Status-Oberflächen können Cache-Zähler auch aus dem neuesten Transkript-
Nutzungsprotokoll wiederherstellen, wenn sie im Live-Session-Snapshot fehlen, sodass `/status` nach teilweisem Verlust von Session-Metadaten weiterhin
eine Cache-Zeile anzeigen kann. Vorhandene nicht null Live-
Cache-Werte haben weiterhin Vorrang vor Transkript-Fallback-Werten.

Warum das wichtig ist: niedrigere Token-Kosten, schnellere Antworten und vorhersagbarere Performance für langlebige Sessions. Ohne Caching zahlen wiederholte Prompts bei jedem Turn die vollen Prompt-Kosten, selbst wenn sich der größte Teil der Eingabe nicht geändert hat.

Die folgenden Abschnitte behandeln jede cachebezogene Stellschraube, die Prompt-Wiederverwendung und Token-Kosten beeinflusst.

Provider-Referenzen:

- Anthropic-Prompt-Caching: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI-Prompt-Caching: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI-API-Header und Request-IDs: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic-Request-IDs und Fehler: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Primäre Stellschrauben

### `cacheRetention` (globaler Standardwert, Modell und pro Agent)

Legen Sie die Cache-Aufbewahrung als globalen Standardwert für alle Modelle fest:

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

Reihenfolge der Konfigurationszusammenführung:

1. `agents.defaults.params` (globaler Standardwert — gilt für alle Modelle)
2. `agents.defaults.models["provider/model"].params` (Überschreibung pro Modell)
3. `agents.list[].params` (passende Agent-ID; überschreibt nach Schlüssel)

### `contextPruning.mode: "cache-ttl"`

Beschneidet alten Tool-Ergebnis-Kontext nach Cache-TTL-Fenstern, damit Anfragen nach Leerlauf keine übergroße Historie erneut cachen.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Vollständiges Verhalten siehe [Session-Beschneidung](/de/concepts/session-pruning).

### Heartbeat zum Warmhalten

Heartbeat kann Cache-Fenster warmhalten und wiederholte Cache-Schreibvorgänge nach Leerlaufphasen reduzieren.

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
- Bei Anthropic-API-Key-Auth-Profilen setzt OpenClaw `cacheRetention: "short"` für Anthropic-Modellreferenzen, wenn es nicht festgelegt ist.
- Native Anthropic-Messages-Antworten stellen sowohl `cache_read_input_tokens` als auch `cache_creation_input_tokens` bereit, sodass OpenClaw sowohl `cacheRead` als auch `cacheWrite` anzeigen kann.
- Bei nativen Anthropic-Anfragen wird `cacheRetention: "short"` dem standardmäßigen flüchtigen 5-Minuten-Cache zugeordnet, und `cacheRetention: "long"` führt nur auf direkten `api.anthropic.com`-Hosts zu einem Upgrade auf die 1-Stunden-TTL.

### OpenAI (direkte API)

- Prompt-Caching erfolgt auf unterstützten aktuellen Modellen automatisch. OpenClaw muss keine Cache-Markierungen auf Blockebene injizieren.
- OpenClaw verwendet `prompt_cache_key`, um das Cache-Routing über Turns hinweg stabil zu halten. Direkte OpenAI-Hosts verwenden `prompt_cache_retention: "24h"`, wenn `cacheRetention: "long"` ausgewählt ist.
- OpenAI-kompatible Completions-Provider erhalten `prompt_cache_key` nur, wenn ihre Modellkonfiguration ausdrücklich `compat.supportsPromptCacheKey: true` festlegt. Weiterleitung mit langer Aufbewahrung ist eine separate Fähigkeit: Explizites `cacheRetention: "long"` sendet `prompt_cache_retention: "24h"` nur, wenn dieser Kompatibilitätseintrag auch lange Cache-Aufbewahrung unterstützt. Provider wie Mistral können Cache-Schlüssel aktivieren und zugleich `compat.supportsLongCacheRetention: false` setzen, um das Feld für lange Aufbewahrung zu unterdrücken. `cacheRetention: "none"` unterdrückt beide Felder.
- OpenAI-Antworten stellen gecachte Prompt-Token über `usage.prompt_tokens_details.cached_tokens` bereit (oder `input_tokens_details.cached_tokens` bei Responses-API-Ereignissen). OpenClaw ordnet dies `cacheRead` zu.
- GPT-5.6-Responses-Nutzung kann auch `input_tokens_details.cache_write_tokens` bereitstellen. OpenClaw ordnet dies `cacheWrite` zu und bepreist es zum Cache-Write-Tarif des Modells; Responses, die das Feld auslassen, behalten `cacheWrite` bei `0`.
- OpenAI gibt nützliche Tracing- und Rate-Limit-Header wie `x-request-id`, `openai-processing-ms` und `x-ratelimit-*` zurück, aber die Cache-Treffer-Abrechnung sollte aus der Nutzungsnutzlast stammen, nicht aus Headern.
- In der Praxis verhält sich OpenAI oft wie ein Initial-Präfix-Cache und nicht wie eine Anthropic-artige Wiederverwendung der beweglichen vollständigen Historie. Stabile Text-Turns mit langem Präfix können in aktuellen Live-Probes nahe einem Plateau von `4864` gecachten Token landen, während tool-lastige oder MCP-ähnliche Transkripte selbst bei exakten Wiederholungen oft nahe `4608` gecachten Token plateauieren.

### Anthropic Vertex

- Anthropic-Modelle auf Vertex AI (`anthropic-vertex/*`) unterstützen `cacheRetention` auf dieselbe Weise wie direktes Anthropic.
- `cacheRetention: "long"` wird auf Vertex-AI-Endpunkten der echten 1-Stunden-Prompt-Cache-TTL zugeordnet.
- Die Standard-Cache-Aufbewahrung für `anthropic-vertex` entspricht den direkten Anthropic-Standards.
- Vertex-Anfragen werden durch cachegrenzenbewusste Formung geleitet, sodass Cache-Wiederverwendung mit dem übereinstimmt, was Provider tatsächlich erhalten.

### Amazon Bedrock

- Anthropic-Claude-Modellreferenzen (`amazon-bedrock/*anthropic.claude*`) unterstützen explizite `cacheRetention`-Durchreichung.
- Nicht-Anthropic-Bedrock-Modelle werden zur Laufzeit auf `cacheRetention: "none"` gezwungen.

### OpenRouter-Modelle

Für `openrouter/anthropic/*`-Modellreferenzen injiziert OpenClaw Anthropic-
`cache_control` in System-/Developer-Prompt-Blöcke, um die Wiederverwendung des Prompt-Caches
nur dann zu verbessern, wenn die Anfrage weiterhin auf eine verifizierte OpenRouter-Route zielt
(`openrouter` auf seinem Standardendpunkt oder eine Provider-/Basis-URL, die zu
`openrouter.ai` aufgelöst wird).

Für `openrouter/deepseek/*`, `openrouter/moonshot*/*` und `openrouter/zai/*`-
Modellreferenzen ist `contextPruning.mode: "cache-ttl"` erlaubt, weil OpenRouter
Provider-seitiges Prompt-Caching automatisch handhabt. OpenClaw injiziert keine
Anthropic-`cache_control`-Markierungen in diese Anfragen.

Der DeepSeek-Cache-Aufbau erfolgt nach bestem Bemühen und kann einige Sekunden dauern. Eine
unmittelbare Folgeanfrage kann weiterhin `cached_tokens: 0` anzeigen; prüfen Sie mit einer wiederholten
Anfrage mit gleichem Präfix nach kurzer Verzögerung und verwenden Sie `usage.prompt_tokens_details.cached_tokens`
als Cache-Treffer-Signal.

Wenn Sie das Modell auf eine beliebige OpenAI-kompatible Proxy-URL umstellen, beendet OpenClaw
das Injizieren dieser OpenRouter-spezifischen Anthropic-Cache-Markierungen.

### Andere Provider

Wenn der Provider diesen Cache-Modus nicht unterstützt, hat `cacheRetention` keine Wirkung.

### Direkte Google-Gemini-API

- Direkter Gemini-Transport (`api: "google-generative-ai"`) meldet Cache-Treffer
  über das Upstream-Feld `cachedContentTokenCount`; OpenClaw ordnet dies `cacheRead` zu.
- Wenn `cacheRetention` für ein direktes Gemini-Modell gesetzt ist, erstellt,
  wiederverwendet und aktualisiert OpenClaw automatisch `cachedContents`-Ressourcen für System-Prompts
  bei Google-AI-Studio-Läufen. Das bedeutet, dass Sie kein
  Cached-Content-Handle mehr manuell vorab erstellen müssen.
- Sie können weiterhin ein bereits vorhandenes Gemini-Cached-Content-Handle als
  `params.cachedContent` (oder Legacy-`params.cached_content`) für das konfigurierte
  Modell übergeben.
- Dies ist getrennt vom Prompt-Präfix-Caching von Anthropic/OpenAI. Für Gemini
  verwaltet OpenClaw eine Provider-native `cachedContents`-Ressource, statt
  Cache-Markierungen in die Anfrage zu injizieren.

### Gemini-CLI-Nutzung

- Die Ausgabe `stream-json` der Gemini-CLI kann Cache-Treffer über `stats.cached` ausgeben;
  OpenClaw ordnet dies `cacheRead` zu. Legacy-Überschreibungen mit `--output-format json` verwenden
  dieselbe Nutzungsnormalisierung.
- Wenn die CLI keinen direkten `stats.input`-Wert auslässt, leitet OpenClaw Eingabetoken
  aus `stats.input_tokens - stats.cached` ab.
- Dies ist nur Nutzungsnormalisierung. Es bedeutet nicht, dass OpenClaw
  Anthropic-/OpenAI-artige Prompt-Cache-Markierungen für die Gemini-CLI erstellt.

## System-Prompt-Cache-Grenze

OpenClaw teilt den System-Prompt in ein **stabiles Präfix** und ein **flüchtiges
Suffix**, getrennt durch eine interne Cache-Präfix-Grenze. Inhalte oberhalb der
Grenze (Tool-Definitionen, Skills-Metadaten, Workspace-Dateien und anderer
relativ statischer Kontext) werden so geordnet, dass sie über Turns hinweg byte-identisch bleiben.
Inhalte unterhalb der Grenze (zum Beispiel `HEARTBEAT.md`, Laufzeit-Zeitstempel und
andere Metadaten pro Turn) dürfen sich ändern, ohne das gecachte
Präfix zu invalidieren.

Wichtige Designentscheidungen:

- Stabile Projektkontextdateien des Workspace werden vor `HEARTBEAT.md` geordnet, damit
  Heartbeat-Änderungen das stabile Präfix nicht ungültig machen.
- Die Grenze wird über Anthropic-Familie, OpenAI-Familie, Google und
  CLI-Transportformung hinweg angewendet, sodass alle unterstützten Provider von derselben Präfix-
  Stabilität profitieren.
- Codex-Responses- und Anthropic-Vertex-Anfragen werden durch
  cachegrenzenbewusste Formung geleitet, sodass Cache-Wiederverwendung mit dem übereinstimmt, was Provider
  tatsächlich erhalten.
- System-Prompt-Fingerprints werden normalisiert (Whitespace, Zeilenenden,
  durch Hooks hinzugefügter Kontext, Reihenfolge von Laufzeitfähigkeiten), sodass semantisch unveränderte
  Prompts KV/Cache über Turns hinweg teilen.

Wenn Sie nach einer Konfigurations- oder Workspace-Änderung unerwartete `cacheWrite`-Spitzen sehen,
prüfen Sie, ob die Änderung oberhalb oder unterhalb der Cache-Grenze landet. Flüchtige
Inhalte unter die Grenze zu verschieben (oder sie zu stabilisieren), behebt das
Problem häufig.

## OpenClaw-Guards für Cache-Stabilität

OpenClaw hält außerdem mehrere cacheempfindliche Nutzlastformen deterministisch, bevor
die Anfrage den Provider erreicht:

- Bundle-MCP-Tool-Kataloge werden vor der Tool-
  Registrierung deterministisch sortiert, sodass Änderungen der `listTools()`-Reihenfolge den Tools-Block nicht verändern und
  Prompt-Cache-Präfixe nicht ungültig machen.
- Legacy-Sessions mit persistierten Bildblöcken behalten die **3 neuesten
  abgeschlossenen Turns** intakt; ältere bereits verarbeitete Bildblöcke können
  durch eine Markierung ersetzt werden, damit bildlastige Folgeanfragen nicht immer wieder große
  veraltete Nutzlasten senden.

## Tuning-Muster

### Gemischter Traffic (empfohlener Standard)

Behalten Sie eine langlebige Basis auf Ihrem Hauptagenten bei und deaktivieren Sie Caching auf burstartigen Benachrichtigungsagenten:

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

- Setzen Sie die Basis auf `cacheRetention: "short"`.
- Aktivieren Sie `contextPruning.mode: "cache-ttl"`.
- Halten Sie Heartbeat nur für Agenten, die von warmen Caches profitieren, unter Ihrer TTL.

## Cache-Diagnose

OpenClaw stellt dedizierte Cache-Trace-Diagnosen für eingebettete Agentenläufe bereit.

Für normale benutzerorientierte Diagnosen können `/status` und andere Nutzungszusammenfassungen
den neuesten Transkript-Nutzungseintrag als Fallback-Quelle für `cacheRead` /
`cacheWrite` verwenden, wenn der Live-Session-Eintrag diese Zähler nicht enthält.

## Live-Regressionstests

OpenClaw pflegt ein kombiniertes Live-Cache-Regressions-Gate für wiederholte Präfixe, Tool-Turns, Bild-Turns, MCP-ähnliche Tool-Transkripte und eine Anthropic-No-Cache-Kontrolle.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Führen Sie das schmale Live-Gate aus mit:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Die Baseline-Datei speichert die zuletzt beobachteten Live-Zahlen sowie die Provider-spezifischen Regressionsuntergrenzen, die vom Test verwendet werden.
Der Runner verwendet außerdem frische sitzungsspezifische IDs und Prompt-Namespaces pro Lauf, damit vorheriger Cache-Zustand die aktuelle Regressionsstichprobe nicht verfälscht.

Diese Tests verwenden bewusst nicht für alle Provider identische Erfolgskriterien.

### Anthropic-Live-Erwartungen

- Erwarten Sie explizite Warmup-Schreibvorgänge über `cacheWrite`.
- Erwarten Sie bei wiederholten Turns eine nahezu vollständige Wiederverwendung des Verlaufs, weil Anthropic Cache Control den Cache-Breakpoint durch die Unterhaltung voranschiebt.
- Aktuelle Live-Assertions verwenden weiterhin hohe Trefferquoten-Schwellenwerte für stabile, Tool- und Bildpfade.

### OpenAI-Live-Erwartungen

- Erwarten Sie nur `cacheRead`. `cacheWrite` bleibt `0`.
- Behandeln Sie die Cache-Wiederverwendung bei wiederholten Turns als Provider-spezifisches Plateau, nicht als Anthropic-artige bewegliche Wiederverwendung des vollständigen Verlaufs.
- Aktuelle Live-Assertions verwenden konservative Untergrenzen, die aus beobachtetem Live-Verhalten auf `gpt-5.4-mini` abgeleitet wurden:
  - stabiler Präfix: `cacheRead >= 4608`, Trefferquote `>= 0.90`
  - Tool-Transkript: `cacheRead >= 4096`, Trefferquote `>= 0.85`
  - Bild-Transkript: `cacheRead >= 3840`, Trefferquote `>= 0.82`
  - MCP-artiges Transkript: `cacheRead >= 4096`, Trefferquote `>= 0.85`

Die frische kombinierte Live-Verifizierung vom 2026-04-04 ergab:

- stabiler Präfix: `cacheRead=4864`, Trefferquote `0.966`
- Tool-Transkript: `cacheRead=4608`, Trefferquote `0.896`
- Bild-Transkript: `cacheRead=4864`, Trefferquote `0.954`
- MCP-artiges Transkript: `cacheRead=4608`, Trefferquote `0.891`

Die jüngste lokale Wanduhrzeit für das kombinierte Gate lag bei etwa `88s`.

Warum sich die Assertions unterscheiden:

- Anthropic stellt explizite Cache-Breakpoints und eine bewegliche Wiederverwendung des Unterhaltungsverlaufs bereit.
- OpenAI Prompt Caching ist weiterhin empfindlich für exakte Präfixe, aber der effektiv wiederverwendbare Präfix im Live-Responses-Datenverkehr kann früher als der vollständige Prompt ein Plateau erreichen.
- Deshalb erzeugt der Vergleich von Anthropic und OpenAI anhand eines einzigen Provider-übergreifenden prozentualen Schwellenwerts falsche Regressionen.

### `diagnostics.cacheTrace`-Konfiguration

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # default true
    includePrompt: false # default true
    includeSystem: false # default true
```

Standardwerte:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Env-Schalter (einmaliges Debugging)

- `OPENCLAW_CACHE_TRACE=1` aktiviert Cache-Tracing.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` überschreibt den Ausgabepfad.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` schaltet die Erfassung vollständiger Nachrichten-Payloads um.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` schaltet die Erfassung von Prompt-Text um.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` schaltet die Erfassung des System-Prompts um.

### Was Sie prüfen sollten

- Cache-Trace-Ereignisse sind JSONL und enthalten gestufte Snapshots wie `session:loaded`, `prompt:before`, `stream:context` und `session:after`.
- Die Cache-Token-Auswirkung pro Turn ist in normalen Nutzungsoberflächen über `cacheRead` und `cacheWrite` sichtbar (zum Beispiel `/usage full` und Sitzungsnutzungszusammenfassungen).
- Erwarten Sie bei Anthropic sowohl `cacheRead` als auch `cacheWrite`, wenn Caching aktiv ist.
- Erwarten Sie bei OpenAI `cacheRead` bei Cache-Treffern. GPT-5.6 Responses kann außerdem `cacheWrite` melden, während Prompt-Segmente geschrieben werden; andere Responses-Payloads, die den Schreibzähler auslassen, belassen ihn bei `0`.
- Wenn Sie Request-Tracing benötigen, protokollieren Sie Request-IDs und Rate-Limit-Header getrennt von Cache-Metriken. Die aktuelle Cache-Trace-Ausgabe von OpenClaw ist auf Prompt-/Sitzungsform und normalisierte Token-Nutzung ausgerichtet, nicht auf rohe Provider-Response-Header.

## Schnelle Fehlerbehebung

- Hoher `cacheWrite` bei den meisten Turns: Prüfen Sie volatile System-Prompt-Eingaben und verifizieren Sie, dass Modell/Provider Ihre Cache-Einstellungen unterstützt.
- Hoher `cacheWrite` bei Anthropic: Bedeutet oft, dass der Cache-Breakpoint auf Inhalten landet, die sich bei jedem Request ändern.
- Niedriger OpenAI-`cacheRead`: Verifizieren Sie, dass der stabile Präfix am Anfang steht, der wiederholte Präfix mindestens 1024 Tokens umfasst und derselbe `prompt_cache_key` für Turns wiederverwendet wird, die einen Cache teilen sollten.
- Keine Wirkung von `cacheRetention`: Bestätigen Sie, dass der Modellschlüssel mit `agents.defaults.models["provider/model"]` übereinstimmt.
- Bedrock-Nova-/Mistral-Requests mit Cache-Einstellungen: erwartetes Runtime-Erzwingen auf `none`.

Verwandte Dokumente:

- [Anthropic](/de/providers/anthropic)
- [Token-Nutzung und Kosten](/de/reference/token-use)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
- [Gateway-Konfigurationsreferenz](/de/gateway/configuration-reference)

## Verwandt

- [Token-Nutzung und Kosten](/de/reference/token-use)
- [API-Nutzung und Kosten](/de/reference/api-usage-costs)
