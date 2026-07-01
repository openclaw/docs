---
read_when:
    - Sie möchten die Prompt-Token-Kosten durch Cache-Beibehaltung senken
    - Sie benötigen Cache-Verhalten pro Agent in Multi-Agent-Setups
    - Sie stimmen Heartbeat und Cache-TTL-Bereinigung gemeinsam ab
summary: Prompt-Caching-Regler, Zusammenführungsreihenfolge, Provider-Verhalten und Tuning-Muster
title: Prompt-Caching
x-i18n:
    generated_at: "2026-07-01T18:11:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3189cc734bbee14236e6303aca99aca512732989ffd01612ae635608a2471e60
    source_path: reference/prompt-caching.md
    workflow: 16
---

Prompt-Caching bedeutet, dass der Modell-Provider unveränderte Prompt-Präfixe (meist System-/Developer-Anweisungen und anderen stabilen Kontext) über Turns hinweg wiederverwenden kann, statt sie jedes Mal neu zu verarbeiten. OpenClaw normalisiert die Provider-Nutzung zu `cacheRead` und `cacheWrite`, wenn die Upstream-API diese Zähler direkt bereitstellt.

Statusoberflächen können Cache-Zähler außerdem aus dem neuesten Nutzungslog des Transkripts wiederherstellen, wenn sie im Live-Sitzungs-Snapshot fehlen, sodass `/status` auch nach teilweisem Verlust von Sitzungsmetadaten weiterhin eine Cache-Zeile anzeigen kann. Vorhandene Live-Cache-Werte ungleich null haben weiterhin Vorrang vor Fallback-Werten aus dem Transkript.

Warum das wichtig ist: niedrigere Token-Kosten, schnellere Antworten und besser vorhersehbare Leistung für lange laufende Sitzungen. Ohne Caching verursachen wiederholte Prompts bei jedem Turn die vollen Prompt-Kosten, selbst wenn sich der größte Teil der Eingabe nicht geändert hat.

Die folgenden Abschnitte behandeln jede Cache-bezogene Stellschraube, die Prompt-Wiederverwendung und Token-Kosten beeinflusst.

Provider-Referenzen:

- Anthropic Prompt-Caching: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI Prompt-Caching: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API-Header und Request-IDs: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic Request-IDs und Fehler: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Wichtigste Stellschrauben

### `cacheRetention` (globaler Standardwert, Modell und pro Agent)

Legen Sie Cache-Aufbewahrung als globalen Standardwert für alle Modelle fest:

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

Reihenfolge der Config-Zusammenführung:

1. `agents.defaults.params` (globaler Standardwert — gilt für alle Modelle)
2. `agents.defaults.models["provider/model"].params` (Überschreibung pro Modell)
3. `agents.list[].params` (passende Agent-ID; überschreibt nach Schlüssel)

### `contextPruning.mode: "cache-ttl"`

Beschneidet alten Tool-Ergebnis-Kontext nach Cache-TTL-Fenstern, damit Anfragen nach Leerlaufphasen keine übergroße Historie erneut cachen.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Das vollständige Verhalten finden Sie unter [Sitzungsbeschneidung](/de/concepts/session-pruning).

### Heartbeat warm halten

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
- Bei Anthropic API-Key-Auth-Profilen setzt OpenClaw `cacheRetention: "short"` für Anthropic-Modellreferenzen, wenn kein Wert angegeben ist.
- Native Anthropic-Messages-Antworten stellen sowohl `cache_read_input_tokens` als auch `cache_creation_input_tokens` bereit, sodass OpenClaw sowohl `cacheRead` als auch `cacheWrite` anzeigen kann.
- Für native Anthropic-Anfragen wird `cacheRetention: "short"` dem standardmäßigen 5-Minuten-Ephemeral-Cache zugeordnet, und `cacheRetention: "long"` führt nur auf direkten `api.anthropic.com`-Hosts ein Upgrade auf die 1-Stunden-TTL durch.

### OpenAI (direkte API)

- Prompt-Caching erfolgt auf unterstützten aktuellen Modellen automatisch. OpenClaw muss keine Cache-Marker auf Blockebene einfügen.
- OpenClaw verwendet `prompt_cache_key`, um das Cache-Routing über Turns hinweg stabil zu halten. Direkte OpenAI-Hosts verwenden `prompt_cache_retention: "24h"`, wenn `cacheRetention: "long"` ausgewählt ist.
- OpenAI-kompatible Completions-Provider erhalten `prompt_cache_key` nur, wenn ihre Modell-Config explizit `compat.supportsPromptCacheKey: true` setzt. Weiterleitung mit langer Aufbewahrung ist eine separate Fähigkeit: Explizites `cacheRetention: "long"` sendet `prompt_cache_retention: "24h"` nur, wenn dieser Compat-Eintrag auch lange Cache-Aufbewahrung unterstützt. Provider wie Mistral können Cache-Schlüssel aktivieren und gleichzeitig `compat.supportsLongCacheRetention: false` setzen, um das Feld für lange Aufbewahrung zu unterdrücken. `cacheRetention: "none"` unterdrückt beide Felder.
- OpenAI-Antworten stellen gecachte Prompt-Token über `usage.prompt_tokens_details.cached_tokens` bereit (oder `input_tokens_details.cached_tokens` bei Responses-API-Events). OpenClaw ordnet dies `cacheRead` zu.
- Die Responses-Nutzung von GPT-5.6 kann außerdem `input_tokens_details.cache_write_tokens` bereitstellen. OpenClaw ordnet dies `cacheWrite` zu und bepreist es mit der Cache-Write-Rate des Modells; Responses, die das Feld auslassen, behalten `cacheWrite` bei `0`.
- OpenAI gibt nützliche Tracing- und Rate-Limit-Header wie `x-request-id`, `openai-processing-ms` und `x-ratelimit-*` zurück, aber die Cache-Hit-Abrechnung sollte aus der Nutzlast zur Nutzung stammen, nicht aus Headern.
- In der Praxis verhält sich OpenAI oft wie ein Initial-Präfix-Cache statt wie eine Anthropic-artige gleitende Wiederverwendung der gesamten Historie. Stabile lange Präfix-Text-Turns können in aktuellen Live-Probes nahe einem Plateau von `4864` gecachten Token landen, während tool-lastige oder MCP-artige Transkripte selbst bei exakten Wiederholungen oft nahe `4608` gecachten Token plateauieren.

### Anthropic Vertex

- Anthropic-Modelle auf Vertex AI (`anthropic-vertex/*`) unterstützen `cacheRetention` genauso wie direktes Anthropic.
- `cacheRetention: "long"` wird auf Vertex-AI-Endpunkten der tatsächlichen 1-Stunden-Prompt-Cache-TTL zugeordnet.
- Die standardmäßige Cache-Aufbewahrung für `anthropic-vertex` entspricht den direkten Anthropic-Standards.
- Vertex-Anfragen werden durch grenzbewusstes Cache-Shaping geleitet, damit Cache-Wiederverwendung an dem ausgerichtet bleibt, was Provider tatsächlich empfangen.

### Amazon Bedrock

- Anthropic-Claude-Modellreferenzen (`amazon-bedrock/*anthropic.claude*`) unterstützen explizites Durchreichen von `cacheRetention`.
- Nicht-Anthropic-Bedrock-Modelle werden zur Laufzeit auf `cacheRetention: "none"` gezwungen.

### OpenRouter-Modelle

Für Modellreferenzen vom Typ `openrouter/anthropic/*` fügt OpenClaw Anthropic-`cache_control` in System-/Developer-Prompt-Blöcke ein, um die Prompt-Cache-Wiederverwendung zu verbessern, jedoch nur, wenn die Anfrage weiterhin auf eine verifizierte OpenRouter-Route zielt (`openrouter` auf seinem Standardendpunkt oder jeder Provider/jede Base-URL, die zu `openrouter.ai` aufgelöst wird).

Für Modellreferenzen vom Typ `openrouter/deepseek/*`, `openrouter/moonshot*/*` und `openrouter/zai/*` ist `contextPruning.mode: "cache-ttl"` erlaubt, weil OpenRouter Provider-seitiges Prompt-Caching automatisch übernimmt. OpenClaw fügt in diese Anfragen keine Anthropic-`cache_control`-Marker ein.

Die DeepSeek-Cache-Erstellung erfolgt nach Best Effort und kann einige Sekunden dauern. Eine unmittelbare Folgeanfrage kann weiterhin `cached_tokens: 0` anzeigen; prüfen Sie mit einer wiederholten Anfrage mit demselben Präfix nach kurzer Verzögerung und verwenden Sie `usage.prompt_tokens_details.cached_tokens` als Cache-Hit-Signal.

Wenn Sie das Modell auf eine beliebige OpenAI-kompatible Proxy-URL umstellen, beendet OpenClaw das Einfügen dieser OpenRouter-spezifischen Anthropic-Cache-Marker.

### Andere Provider

Wenn der Provider diesen Cache-Modus nicht unterstützt, hat `cacheRetention` keine Wirkung.

### Direkte Google-Gemini-API

- Der direkte Gemini-Transport (`api: "google-generative-ai"`) meldet Cache-Hits über Upstream-`cachedContentTokenCount`; OpenClaw ordnet dies `cacheRead` zu.
- Wenn `cacheRetention` für ein direktes Gemini-Modell gesetzt ist, erstellt, wiederverwendet und aktualisiert OpenClaw automatisch `cachedContents`-Ressourcen für System-Prompts bei Google-AI-Studio-Läufen. Das bedeutet, dass Sie kein Cached-Content-Handle mehr manuell vorab erstellen müssen.
- Sie können weiterhin ein bereits vorhandenes Gemini-Cached-Content-Handle über `params.cachedContent` (oder veraltet `params.cached_content`) beim konfigurierten Modell durchreichen.
- Dies ist getrennt vom Anthropic/OpenAI-Prompt-Präfix-Caching. Für Gemini verwaltet OpenClaw eine Provider-native `cachedContents`-Ressource, statt Cache-Marker in die Anfrage einzufügen.

### Gemini-CLI-Nutzung

- Die Gemini-CLI-`stream-json`-Ausgabe kann Cache-Hits über `stats.cached` bereitstellen; OpenClaw ordnet dies `cacheRead` zu. Veraltete Overrides mit `--output-format json` verwenden dieselbe Nutzungsnormalisierung.
- Wenn die CLI keinen direkten Wert für `stats.input` ausgibt, leitet OpenClaw Eingabe-Token aus `stats.input_tokens - stats.cached` ab.
- Dies ist nur Nutzungsnormalisierung. Es bedeutet nicht, dass OpenClaw Anthropic/OpenAI-artige Prompt-Cache-Marker für die Gemini CLI erstellt.

## Cache-Grenze des System-Prompts

OpenClaw teilt den System-Prompt in ein **stabiles Präfix** und ein **volatiles Suffix**, getrennt durch eine interne Cache-Präfix-Grenze. Inhalte oberhalb der Grenze (Tool-Definitionen, Skills-Metadaten, Workspace-Dateien und anderer relativ statischer Kontext) werden so angeordnet, dass sie über Turns hinweg Byte-identisch bleiben. Inhalte unterhalb der Grenze (zum Beispiel `HEARTBEAT.md`, Laufzeit-Zeitstempel und andere Metadaten pro Turn) dürfen sich ändern, ohne das gecachte Präfix zu invalidieren.

Wichtige Designentscheidungen:

- Stabile Workspace-Projektkontextdateien werden vor `HEARTBEAT.md` angeordnet, damit Heartbeat-Änderungen das stabile Präfix nicht ungültig machen.
- Die Grenze wird über Anthropic-Familie, OpenAI-Familie, Google und CLI-Transport-Shaping hinweg angewendet, damit alle unterstützten Provider von derselben Präfixstabilität profitieren.
- Codex-Responses- und Anthropic-Vertex-Anfragen werden durch grenzbewusstes Cache-Shaping geleitet, damit Cache-Wiederverwendung an dem ausgerichtet bleibt, was Provider tatsächlich empfangen.
- System-Prompt-Fingerprints werden normalisiert (Leerraum, Zeilenenden, durch Hooks hinzugefügter Kontext, Reihenfolge der Laufzeitfähigkeiten), sodass semantisch unveränderte Prompts KV/Cache über Turns hinweg teilen.

Wenn Sie nach einer Config- oder Workspace-Änderung unerwartete `cacheWrite`-Spitzen sehen, prüfen Sie, ob die Änderung oberhalb oder unterhalb der Cache-Grenze landet. Volatile Inhalte unter die Grenze zu verschieben (oder sie zu stabilisieren) behebt das Problem häufig.

## OpenClaw-Guards für Cache-Stabilität

OpenClaw hält außerdem mehrere cache-sensitive Payload-Formen deterministisch, bevor die Anfrage den Provider erreicht:

- Bundle-MCP-Tool-Kataloge werden vor der Tool-Registrierung deterministisch sortiert, sodass Änderungen der `listTools()`-Reihenfolge den Tools-Block nicht verändern und Prompt-Cache-Präfixe nicht ungültig machen.
- Veraltete Sitzungen mit persistierten Bildblöcken behalten die **3 neuesten abgeschlossenen Turns** intakt; ältere bereits verarbeitete Bildblöcke können durch einen Marker ersetzt werden, damit bildlastige Folgeanfragen nicht ständig große veraltete Payloads erneut senden.

## Tuning-Muster

### Gemischter Traffic (empfohlener Standard)

Behalten Sie eine langlebige Baseline für Ihren Haupt-Agent bei und deaktivieren Sie Caching für stoßweise arbeitende Benachrichtigungs-Agents:

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

### Kostenorientierte Baseline

- Setzen Sie die Baseline `cacheRetention: "short"`.
- Aktivieren Sie `contextPruning.mode: "cache-ttl"`.
- Halten Sie Heartbeat nur für Agents unter Ihrer TTL, die von warmen Caches profitieren.

## Cache-Diagnose

OpenClaw stellt dedizierte Cache-Trace-Diagnosen für eingebettete Agent-Läufe bereit.

Für normale nutzerseitige Diagnosen können `/status` und andere Nutzungszusammenfassungen den neuesten Transkript-Nutzungseintrag als Fallback-Quelle für `cacheRead` / `cacheWrite` verwenden, wenn der Live-Sitzungseintrag diese Zähler nicht enthält.

## Live-Regressionstests

OpenClaw behält ein kombiniertes Live-Cache-Regressions-Gate für wiederholte Präfixe, Tool-Turns, Bild-Turns, MCP-artige Tool-Transkripte und eine Anthropic-No-Cache-Kontrolle bei.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Führen Sie das enge Live-Gate aus mit:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Die Baseline-Datei speichert die zuletzt beobachteten Live-Zahlen sowie die Provider-spezifischen Regressionsuntergrenzen, die vom Test verwendet werden.
Der Runner verwendet außerdem frische sitzungsbezogene IDs und Prompt-Namensräume pro Lauf, damit vorheriger Cache-Zustand die aktuelle Regressionsstichprobe nicht verfälscht.

Diese Tests verwenden absichtlich nicht für alle Provider identische Erfolgskriterien.

### Anthropic-Live-Erwartungen

- Erwarten Sie explizite Warmup-Schreibvorgänge über `cacheWrite`.
- Erwarten Sie bei wiederholten Turns nahezu vollständige Wiederverwendung des Verlaufs, weil Anthropic Cache Control den Cache-Breakpoint durch die Unterhaltung weiterführt.
- Aktuelle Live-Assertions verwenden weiterhin hohe Trefferquoten-Schwellenwerte für stabile, Tool- und Bildpfade.

### OpenAI-Live-Erwartungen

- Erwarten Sie nur `cacheRead`. `cacheWrite` bleibt `0`.
- Behandeln Sie die Cache-Wiederverwendung bei wiederholten Turns als Provider-spezifisches Plateau, nicht als bewegliche Wiederverwendung des vollständigen Verlaufs im Anthropic-Stil.
- Aktuelle Live-Assertions verwenden konservative Untergrenzen, die aus beobachtetem Live-Verhalten auf `gpt-5.4-mini` abgeleitet wurden:
  - stabiler Präfix: `cacheRead >= 4608`, Trefferquote `>= 0.90`
  - Tool-Transkript: `cacheRead >= 4096`, Trefferquote `>= 0.85`
  - Bild-Transkript: `cacheRead >= 3840`, Trefferquote `>= 0.82`
  - Transkript im MCP-Stil: `cacheRead >= 4096`, Trefferquote `>= 0.85`

Frische kombinierte Live-Verifikation am 2026-04-04 ergab:

- stabiler Präfix: `cacheRead=4864`, Trefferquote `0.966`
- Tool-Transkript: `cacheRead=4608`, Trefferquote `0.896`
- Bild-Transkript: `cacheRead=4864`, Trefferquote `0.954`
- Transkript im MCP-Stil: `cacheRead=4608`, Trefferquote `0.891`

Die jüngste lokale Wanduhrzeit für das kombinierte Gate lag bei etwa `88s`.

Warum sich die Assertions unterscheiden:

- Anthropic stellt explizite Cache-Breakpoints und bewegliche Wiederverwendung des Unterhaltungsverlaufs bereit.
- OpenAI Prompt Caching reagiert weiterhin empfindlich auf exakte Präfixe, aber der effektiv wiederverwendbare Präfix im Live-Responses-Traffic kann früher ein Plateau erreichen als der vollständige Prompt.
- Deshalb erzeugt der Vergleich von Anthropic und OpenAI über einen einzigen providerübergreifenden Prozent-Schwellenwert falsche Regressionen.

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

### Umgebungsvariablen-Schalter (einmaliges Debugging)

- `OPENCLAW_CACHE_TRACE=1` aktiviert Cache-Tracing.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` überschreibt den Ausgabepfad.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` schaltet die Erfassung vollständiger Nachrichten-Payloads um.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` schaltet die Erfassung von Prompt-Text um.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` schaltet die Erfassung des System-Prompts um.

### Was zu prüfen ist

- Cache-Trace-Ereignisse sind JSONL und enthalten gestufte Snapshots wie `session:loaded`, `prompt:before`, `stream:context` und `session:after`.
- Die Auswirkung der Cache-Token pro Turn ist in normalen Nutzungsoberflächen über `cacheRead` und `cacheWrite` sichtbar (zum Beispiel `/usage tokens`, `/status`, Sitzungsnutzungszusammenfassungen und benutzerdefinierte `messages.usageTemplate`-Layouts).
- Für Anthropic erwarten Sie sowohl `cacheRead` als auch `cacheWrite`, wenn Caching aktiv ist.
- Für OpenAI erwarten Sie `cacheRead` bei Cache-Treffern. GPT-5.6 Responses kann außerdem `cacheWrite` melden, während Prompt-Segmente geschrieben werden; andere Responses-Payloads, die den Schreibzähler auslassen, belassen ihn bei `0`.
- Wenn Sie Request-Tracing benötigen, protokollieren Sie Request-IDs und Rate-Limit-Header getrennt von Cache-Metriken. Die aktuelle Cache-Trace-Ausgabe von OpenClaw konzentriert sich auf Prompt-/Sitzungsform und normalisierte Token-Nutzung statt auf rohe Provider-Response-Header.

## Schnelle Fehlerbehebung

- Hoher `cacheWrite` bei den meisten Turns: Prüfen Sie volatile System-Prompt-Eingaben und verifizieren Sie, dass Modell/Provider Ihre Cache-Einstellungen unterstützt.
- Hoher `cacheWrite` bei Anthropic: Bedeutet oft, dass der Cache-Breakpoint auf Inhalt landet, der sich bei jeder Anfrage ändert.
- Niedriger OpenAI-`cacheRead`: Verifizieren Sie, dass der stabile Präfix vorne steht, der wiederholte Präfix mindestens 1024 Token umfasst und derselbe `prompt_cache_key` für Turns wiederverwendet wird, die einen Cache teilen sollen.
- Keine Auswirkung von `cacheRetention`: Bestätigen Sie, dass der Modellschlüssel zu `agents.defaults.models["provider/model"]` passt.
- Bedrock Nova/Mistral-Anfragen mit Cache-Einstellungen: erwartete Laufzeit-Erzwingung auf `none`.

Verwandte Dokumentation:

- [Anthropic](/de/providers/anthropic)
- [Token-Nutzung und Kosten](/de/reference/token-use)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
- [Gateway-Konfigurationsreferenz](/de/gateway/configuration-reference)

## Verwandt

- [Token-Nutzung und Kosten](/de/reference/token-use)
- [API-Nutzung und Kosten](/de/reference/api-usage-costs)
