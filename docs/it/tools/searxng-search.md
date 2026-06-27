---
read_when:
    - Vuoi un provider di ricerca web self-hosted
    - Vuoi usare SearXNG per web_search
    - Ti serve un'opzione di ricerca attenta alla privacy o air-gapped
summary: Ricerca web SearXNG -- provider di meta-ricerca ospitato autonomamente, senza chiavi
title: Ricerca SearXNG
x-i18n:
    generated_at: "2026-06-27T18:23:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4bd00a20e45f71b7bd855a6588d5c829a0202839fc93ddcec1e255b7858ff183
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw supporta [SearXNG](https://docs.searxng.org/) come provider `web_search` **self-hosted,
senza chiave**. SearXNG è un motore di meta-ricerca open source
che aggrega risultati da Google, Bing, DuckDuckGo e altre fonti.

Vantaggi:

- **Gratuito e illimitato** -- non richiede chiave API né abbonamento commerciale
- **Privacy / air-gap** -- le query non lasciano mai la tua rete
- **Funziona ovunque** -- nessuna restrizione geografica sulle API di ricerca commerciali

## Configurazione

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/searxng-plugin
    ```
  </Step>
  <Step title="Run a SearXNG instance">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Oppure usa qualsiasi deployment SearXNG esistente a cui hai accesso. Consulta la
    [documentazione di SearXNG](https://docs.searxng.org/) per la configurazione in produzione.

  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    Oppure imposta la variabile d'ambiente e lascia che il rilevamento automatico la trovi:

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## Config

```json5
{
  tools: {
    web: {
      search: {
        provider: "searxng",
      },
    },
  },
}
```

Impostazioni a livello di Plugin per l'istanza SearXNG:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // optional
            language: "en", // optional
          },
        },
      },
    },
  },
}
```

Il campo `baseUrl` accetta anche oggetti SecretRef.

Regole di trasporto:

- `https://` funziona per host SearXNG pubblici o privati
- `http://` è accettato solo per host di rete privata attendibili o local loopback
- gli host SearXNG pubblici devono usare `https://`
- gli host privati/interni usano la protezione di rete self-hosted; gli host
  pubblici `https://` restano sulla protezione rigorosa per la ricerca web e non
  possono reindirizzare verso indirizzi privati

## Variabile d'ambiente

Imposta `SEARXNG_BASE_URL` come alternativa alla configurazione:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Quando `SEARXNG_BASE_URL` è impostata e non è configurato alcun provider esplicito, il rilevamento automatico
seleziona SearXNG automaticamente (alla priorità più bassa -- qualsiasi provider basato su API con una
chiave vince per primo).

## Riferimento alla configurazione del Plugin

| Campo        | Descrizione                                                        |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | URL di base della tua istanza SearXNG (obbligatorio)               |
| `categories` | Categorie separate da virgole, come `general`, `news` o `science`  |
| `language`   | Codice lingua per i risultati, come `en`, `de` o `fr`              |

## Note

- **API JSON** -- usa l'endpoint nativo `format=json` di SearXNG, non lo scraping HTML
- **URL dei risultati immagine** -- i risultati della categoria immagini includono `img_src` quando SearXNG
  restituisce un URL immagine diretto
- **Nessuna chiave API** -- funziona con qualsiasi istanza SearXNG senza configurazioni aggiuntive
- **Convalida dell'URL di base** -- `baseUrl` deve essere un URL `http://` o `https://`
  valido; gli host pubblici devono usare `https://`
- **Protezione di rete** -- gli endpoint SearXNG privati/interni optano per
  l'accesso alla rete privata; gli endpoint SearXNG pubblici `https://` mantengono una protezione SSRF
  rigorosa
- **Ordine del rilevamento automatico** -- SearXNG viene controllato dopo i provider basati su API
  con chiavi configurate (ordine 200). I provider senza chiave, come DuckDuckGo o
  Ollama Web Search, non vengono selezionati automaticamente senza una scelta esplicita del provider
- **Self-hosted** -- controlli l'istanza, le query e i motori di ricerca upstream
- **Categorie** usa `general` come valore predefinito quando non è configurato
- **Fallback di categoria** -- se una richiesta di categoria non `general` riesce ma
  restituisce zero risultati, OpenClaw riprova la stessa query una volta con `general`
  prima di restituire un insieme di risultati vuoto

<Tip>
  Affinché l'API JSON di SearXNG funzioni, assicurati che la tua istanza SearXNG abbia il formato `json`
  abilitato nel suo `settings.yml` sotto `search.formats`.
</Tip>

## Correlati

- [Panoramica di Web Search](/it/tools/web) -- tutti i provider e il rilevamento automatico
- [DuckDuckGo Search](/it/tools/duckduckgo-search) -- un altro provider senza chiave
- [Brave Search](/it/tools/brave-search) -- risultati strutturati con piano gratuito
