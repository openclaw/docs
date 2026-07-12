---
read_when:
    - Sie möchten die Websuche ohne API-Schlüssel verwenden
    - Sie möchten die kostenpflichtige Search API von Parallel.
    - Sie möchten kompakte Auszüge, die nach ihrer Effizienz für den LLM-Kontext bewertet sind
summary: Parallele Suche – LLM-optimierte, informationsdichte Auszüge aus Webquellen
title: Parallele Suche
x-i18n:
    generated_at: "2026-07-12T02:17:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eff693f286015b287bbdacf44f11ff6f07f2f7d2605ef6f09259e7402b40515e
    source_path: tools/parallel-search.md
    workflow: 16
---

Das Parallel-Plugin stellt zwei `web_search`-Provider von [Parallel](https://parallel.ai/) bereit. Beide liefern bewertete, für LLMs optimierte Auszüge aus einem für KI-Agenten erstellten Webindex:

| Provider                       | id              | Authentifizierung                                                                                  |
| ------------------------------ | --------------- | -------------------------------------------------------------------------------------------------- |
| Parallel-Suche (kostenlos)     | `parallel-free` | Keine – Parallels kostenloser [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) |
| Parallel-Suche                 | `parallel`      | `PARALLEL_API_KEY` – kostenpflichtige Search API, höhere Ratenlimits und Zieloptimierung           |

Setzen Sie `tools.web.search.provider` auf `parallel-free` oder `parallel`, um einen Provider explizit auszuwählen; keiner von beiden wird automatisch erkannt.

<Note>
  Direkte OpenAI-Responses-Modelle (`api: "openai-responses"`, Provider
  `openai`, offizielle API-Basis-URL) verwenden automatisch die von OpenAI
  gehostete native Websuche, wenn `tools.web.search.provider` nicht gesetzt,
  leer, `"auto"` oder `"openai"` ist – daher umgehen sie Parallel
  standardmäßig. Setzen Sie `tools.web.search.provider` auf `parallel-free`
  oder `parallel`, um sie stattdessen über Parallel zu leiten. Siehe
  [Übersicht zur Websuche](/de/tools/web).
</Note>

## Plugin installieren

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## API-Schlüssel (kostenpflichtiger Provider)

`parallel-free` benötigt keinen Schlüssel, muss aber dennoch explizit ausgewählt werden. Der kostenpflichtige Provider `parallel` benötigt einen API-Schlüssel:

<Steps>
  <Step title="Konto erstellen">
    Registrieren Sie sich unter [platform.parallel.ai](https://platform.parallel.ai) und
    erzeugen Sie über Ihr Dashboard einen API-Schlüssel.
  </Step>
  <Step title="Schlüssel speichern">
    Setzen Sie `PARALLEL_API_KEY` in der Gateway-Umgebung oder konfigurieren Sie ihn über:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Konfiguration

```json5
{
  plugins: {
    entries: {
      parallel: {
        config: {
          webSearch: {
            apiKey: "par-...", // optional, wenn PARALLEL_API_KEY gesetzt ist
            baseUrl: "https://api.parallel.ai", // optional; OpenClaw hängt /v1/search an
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // "parallel-free" für den kostenlosen Search MCP oder "parallel" für den
        // hier dargestellten kostenpflichtigen, API-gestützten Provider.
        provider: "parallel",
      },
    },
  },
}
```

**Alternative über die Umgebung:** Setzen Sie `PARALLEL_API_KEY` in der Gateway-Umgebung. Bei einer Gateway-Installation tragen Sie ihn in `~/.openclaw/.env` ein.

## Basis-URL überschreiben

Gilt nur für den kostenpflichtigen Provider `parallel`; `parallel-free` verwendet immer `https://search.parallel.ai/mcp` und ignoriert diese Einstellung.

Setzen Sie `plugins.entries.parallel.config.webSearch.baseUrl`, um kostenpflichtige Anfragen über einen kompatiblen Proxy oder einen alternativen Endpunkt zu leiten (beispielsweise das Cloudflare AI Gateway). OpenClaw normalisiert reine Hostnamen, indem es `https://` voranstellt, und hängt `/v1/search` an, sofern der Pfad nicht bereits damit endet. Der aufgelöste Endpunkt ist Teil des Such-Cache-Schlüssels, sodass Ergebnisse verschiedener Endpunkte niemals gemeinsam verwendet werden.

## Tool-Parameter

Beide Provider stellen das native Suchschema von Parallel bereit, damit das Modell ein natürlichsprachiges Ziel sowie einige kurze Suchanfragen mit Schlüsselwörtern angibt – die Kombination, die Parallel für optimale Ergebnisse [empfiehlt](https://docs.parallel.ai/search/best-practices).

<ParamField path="objective" type="string" required>
Natürlichsprachige Beschreibung der zugrunde liegenden Frage oder des Ziels (maximal 5.000 Zeichen). Sollte in sich geschlossen sein.
</ParamField>

<ParamField path="search_queries" type="string[]" required>
Prägnante Suchanfragen mit Schlüsselwörtern, jeweils 3–6 Wörter (1–5 Einträge, jeweils maximal 200 Zeichen). Geben Sie für optimale Ergebnisse 2–3 unterschiedliche Suchanfragen an.
</ParamField>

<ParamField path="count" type="number">
Anzahl der zurückzugebenden Ergebnisse (1–40).
</ParamField>

<ParamField path="session_id" type="string">
Optionale Parallel-Sitzungs-ID aus `sessionId` eines vorherigen Ergebnisses. Übergeben Sie sie bei Folgesuchen innerhalb derselben Aufgabe, damit Parallel zusammengehörige Aufrufe gruppiert und nachfolgende Ergebnisse verbessert. Maximal 1.000 Zeichen bei `parallel`; der kostenlose Search MCP `parallel-free` begrenzt sie auf 100. Eine ID, die den Grenzwert überschreitet, wird verworfen (kostenpflichtig) oder durch eine neu erzeugte ersetzt (kostenlos).
</ParamField>

<ParamField path="client_model" type="string">
Optionale Kennung des Modells, das den Aufruf ausführt (z. B. `claude-opus-4-7`, `gpt-5.6-sol`), maximal 100 Zeichen. Dadurch kann Parallel die Standardeinstellungen an die Fähigkeiten Ihres Modells anpassen. Übergeben Sie den exakten Slug des aktiven Modells; kürzen Sie ihn nicht auf einen Familienalias.
</ParamField>

## Hinweise

- Parallel bewertet und komprimiert Ergebnisse im Hinblick auf ihren Nutzen für die Schlussfolgerungen von LLMs, nicht für menschliche Klicks; erwarten Sie daher dichte Auszüge pro Ergebnis statt vollständiger Seiteninhalte.
- Ergebnisauszüge werden als Array `excerpts` zurückgegeben und außerdem für die Kompatibilität mit dem generischen `web_search`-Vertrag in `description` zusammengeführt.
- Beide Provider geben eine `session_id` zurück; OpenClaw stellt sie als `sessionId` in der Tool-Nutzlast bereit, damit Aufrufer Folgesuchen gruppieren können. Eine von Parallel erzeugte Sitzungs-ID, die nicht vom Aufrufer angegeben wurde, wird aus dem Cache-Eintrag ausgeschlossen, da voneinander unabhängige Aufgaben mit identischen Suchanfragen sie nicht übernehmen sollten.
- `searchId`, `warnings` und `usage` von Parallel werden, sofern vorhanden, unverändert weitergegeben.
- OpenClaw übermittelt Parallel stets eine aufgelöste Ergebnisanzahl als `advanced_settings.max_results` (`parallel`) oder wendet `count` nach der Antwort von Parallel mit fester Größe clientseitig an (`parallel-free`). Das Argument `count` des Aufrufers hat Vorrang, danach folgt `tools.web.search.maxResults`; andernfalls gilt der generische Standardwert von OpenClaw für `web_search` (5) – der eigene API-Standardwert von Parallel ist 10.
- Ergebnisse werden standardmäßig 15 Minuten zwischengespeichert (`cacheTtlMinutes`).
- `parallel-free` erzeugt über seinen MCP-Handshake für jeden Aufruf eine neue `session_id`, wenn der Aufrufer keine angibt; `parallel` lässt sie in diesem Fall nicht gesetzt.

## Verwandte Themen

- [Übersicht zur Websuche](/de/tools/web) – alle Provider und automatische Erkennung
- [Exa-Suche](/de/tools/exa-search) – neuronale Suche mit Inhaltsextraktion
- [Perplexity-Suche](/de/tools/perplexity-search) – strukturierte Ergebnisse mit Domainfilterung
