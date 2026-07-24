---
read_when:
    - Sie möchten die Websuche ohne API-Schlüssel verwenden
    - Sie möchten die kostenpflichtige Search API von Parallel
    - Sie möchten informationsreiche Auszüge, die nach ihrer Effizienz für den LLM-Kontext eingestuft sind
summary: Parallele Suche -- LLM-optimierte, kompakte Auszüge aus Webquellen
title: Parallele Suche
x-i18n:
    generated_at: "2026-07-24T05:02:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: eff693f286015b287bbdacf44f11ff6f07f2f7d2605ef6f09259e7402b40515e
    source_path: tools/parallel-search.md
    workflow: 16
---

Das Parallel-Plugin stellt zwei [Parallel](https://parallel.ai/) `web_search`
Provider bereit, die beide nach Rangfolge sortierte, für LLMs optimierte Auszüge aus einem
für KI-Agenten erstellten Webindex zurückgeben:

| Provider               | id              | Auth                                                                                       |
| ---------------------- | --------------- | ------------------------------------------------------------------------------------------ |
| Parallel Search (kostenlos) | `parallel-free` | Keine – Parallels kostenloser [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) |
| Parallel Search        | `parallel`      | `PARALLEL_API_KEY` – kostenpflichtige Search API, höhere Ratenlimits und Zieloptimierung   |

Setzen Sie `tools.web.search.provider` auf `parallel-free` oder `parallel`, um
einen Provider explizit auszuwählen; keiner wird automatisch erkannt.

<Note>
  Direkte OpenAI-Responses-Modelle (`api: "openai-responses"`, Provider
  `openai`, offizielle API-Basis-URL) verwenden automatisch die gehostete native
  Websuche von OpenAI, wenn `tools.web.search.provider` nicht gesetzt, leer,
  `"auto"` oder `"openai"` ist – daher umgehen sie Parallel standardmäßig.
  Setzen Sie `tools.web.search.provider` auf `parallel-free` oder `parallel`, um sie
  stattdessen über Parallel zu leiten. Siehe [Übersicht zur Websuche](/de/tools/web).
</Note>

## Plugin installieren

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## API-Schlüssel (kostenpflichtiger Provider)

`parallel-free` benötigt keinen Schlüssel, muss aber dennoch explizit ausgewählt werden. Der
kostenpflichtige Provider `parallel` benötigt einen API-Schlüssel:

<Steps>
  <Step title="Konto erstellen">
    Registrieren Sie sich unter [platform.parallel.ai](https://platform.parallel.ai) und
    generieren Sie in Ihrem Dashboard einen API-Schlüssel.
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
        // hier gezeigten kostenpflichtigen API-gestützten Provider.
        provider: "parallel",
      },
    },
  },
}
```

**Alternative über die Umgebung:** Setzen Sie `PARALLEL_API_KEY` in der
Gateway-Umgebung. Bei einer Gateway-Installation tragen Sie ihn in `~/.openclaw/.env` ein.

## Basis-URL überschreiben

Gilt nur für den kostenpflichtigen Provider `parallel`; `parallel-free` verwendet immer
`https://search.parallel.ai/mcp` und ignoriert diese Einstellung.

Setzen Sie `plugins.entries.parallel.config.webSearch.baseUrl`, um kostenpflichtige
Anfragen über einen kompatiblen Proxy oder alternativen Endpunkt zu leiten (zum Beispiel das
Cloudflare AI Gateway). OpenClaw normalisiert reine Hosts, indem
`https://` vorangestellt wird, und hängt `/v1/search` an, sofern der Pfad nicht bereits damit endet. Der
aufgelöste Endpunkt ist Teil des Such-Cache-Schlüssels, sodass Ergebnisse verschiedener
Endpunkte niemals gemeinsam verwendet werden.

## Tool-Parameter

Beide Provider stellen das native Suchformat von Parallel bereit, sodass das Modell ein
natürlichsprachliches Ziel sowie einige kurze Schlüsselwort-Suchanfragen angibt – die Kombination,
die Parallel für optimale Ergebnisse
[empfiehlt](https://docs.parallel.ai/search/best-practices).

<ParamField path="objective" type="string" required>
Natürlichsprachliche Beschreibung der zugrunde liegenden Frage oder des Ziels (maximal 5000
Zeichen). Sollte eigenständig verständlich sein.
</ParamField>

<ParamField path="search_queries" type="string[]" required>
Prägnante Schlüsselwort-Suchanfragen mit jeweils 3-6 Wörtern (1-5 Einträge, jeweils maximal 200
Zeichen). Geben Sie für optimale Ergebnisse 2-3 unterschiedliche Suchanfragen an.
</ParamField>

<ParamField path="count" type="number">
Anzahl der zurückzugebenden Ergebnisse (1-40).
</ParamField>

<ParamField path="session_id" type="string">
Optionale Parallel-Sitzungs-ID aus `sessionId` eines vorherigen Ergebnisses. Übergeben Sie sie bei
Folgesuchen innerhalb derselben Aufgabe, damit Parallel zusammengehörige Aufrufe gruppiert und
nachfolgende Ergebnisse verbessert. Maximal 1000 Zeichen bei `parallel`; der kostenlose
`parallel-free` Search MCP begrenzt sie auf 100. Eine ID über dem Limit wird verworfen
(kostenpflichtig) oder durch eine neue ersetzt (kostenlos).
</ParamField>

<ParamField path="client_model" type="string">
Optionale Kennung des Modells, das den Aufruf durchführt (z. B. `claude-opus-4-7`,
`gpt-5.6-sol`), maximal 100 Zeichen. Damit kann Parallel die Standardeinstellungen an die
Fähigkeiten Ihres Modells anpassen. Übergeben Sie den exakten Slug des aktiven Modells; kürzen Sie
ihn nicht auf einen Familienalias.
</ParamField>

## Hinweise

- Parallel ordnet und komprimiert Ergebnisse nach ihrem Nutzen für die Schlussfolgerung durch LLMs, nicht für
  menschliche Klicks; erwarten Sie daher pro Ergebnis kompakte, informationsreiche Auszüge statt vollständiger
  Seiteninhalte.
- Ergebnisauszüge werden als Array `excerpts` zurückgegeben und außerdem
  zur Kompatibilität mit dem generischen Vertrag `web_search` in
  `description` zusammengefügt.
- Beide Provider geben eine `session_id` zurück; OpenClaw stellt sie im
  Tool-Payload als `sessionId` bereit, damit Aufrufer Folgesuchen gruppieren können. Eine
  von Parallel generierte Sitzungs-ID (die der Aufrufer nicht bereitgestellt hat) wird aus
  dem Cache-Eintrag ausgeschlossen, da nicht zusammengehörige Aufgaben mit identischen Suchanfragen
  sie nicht übernehmen sollten.
- `searchId`, `warnings` und `usage` von Parallel werden weitergegeben, wenn
  sie vorhanden sind.
- OpenClaw leitet eine aufgelöste Ergebnisanzahl stets als
  `advanced_settings.max_results` an Parallel weiter (`parallel`) oder wendet `count`
  nach Parallels Antwort mit fester Größe clientseitig an (`parallel-free`). Das
  Argument `count` des Aufrufers hat Vorrang, danach `tools.web.search.maxResults`, andernfalls
  gilt der generische OpenClaw-Standardwert `web_search` (5) – Parallels eigener API-Standardwert
  ist 10.
- Ergebnisse werden standardmäßig 15 Minuten lang zwischengespeichert (`cacheTtlMinutes`).
- `parallel-free` erzeugt über seinen MCP-Handshake pro Aufruf eine neue `session_id`,
  wenn der Aufrufer keine bereitstellt; `parallel` lässt sie in diesem
  Fall nicht gesetzt.

## Verwandte Themen

- [Übersicht zur Websuche](/de/tools/web) – alle Provider und automatische Erkennung
- [Exa-Suche](/de/tools/exa-search) – neuronale Suche mit Inhaltsextraktion
- [Perplexity Search](/de/tools/perplexity-search) – strukturierte Ergebnisse mit Domainfilterung
