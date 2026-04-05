---
read_when:
    - Vuoi un provider di ricerca web self-hosted
    - Vuoi usare SearXNG per `web_search`
    - Hai bisogno di un'opzione di ricerca orientata alla privacy o isolata dalla rete
summary: Ricerca web SearXNG -- provider meta-search self-hosted senza chiave
title: Ricerca SearXNG
x-i18n:
    generated_at: "2026-04-05T14:07:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a8fc7f890b7595d17c5ef8aede9b84bb2459f30a53d5d87c4e7423e1ac83ca5
    source_path: tools/searxng-search.md
    workflow: 15
---

# Ricerca SearXNG

OpenClaw supporta [SearXNG](https://docs.searxng.org/) come provider `web_search` **self-hosted e senza chiave**. SearXNG è un meta-motore di ricerca open source
che aggrega risultati da Google, Bing, DuckDuckGo e altre fonti.

Vantaggi:

- **Gratuito e illimitato** -- non richiede chiavi API né abbonamenti commerciali
- **Privacy / isolamento dalla rete** -- le query non escono mai dalla tua rete
- **Funziona ovunque** -- nessuna restrizione regionale delle API di ricerca commerciali

## Configurazione

<Steps>
  <Step title="Esegui un'istanza SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Oppure usa qualsiasi distribuzione SearXNG esistente a cui hai accesso. Consulta la
    [documentazione di SearXNG](https://docs.searxng.org/) per una configurazione di produzione.

  </Step>
  <Step title="Configura">
    ```bash
    openclaw configure --section web
    # Seleziona "searxng" come provider
    ```

    Oppure imposta la variabile d'ambiente e lascia che il rilevamento automatico la trovi:

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## Configurazione

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

Impostazioni a livello di plugin per l'istanza SearXNG:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // facoltativo
            language: "en", // facoltativo
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
- `http://` è accettato solo per host affidabili su rete privata o loopback
- gli host SearXNG pubblici devono usare `https://`

## Variabile d'ambiente

Imposta `SEARXNG_BASE_URL` come alternativa alla configurazione:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Quando `SEARXNG_BASE_URL` è impostata e non è configurato alcun provider esplicito, il rilevamento automatico
seleziona automaticamente SearXNG (alla priorità più bassa -- qualsiasi provider supportato da API con una
chiave ha priorità).

## Riferimento della configurazione del plugin

| Campo        | Descrizione                                                        |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | URL di base della tua istanza SearXNG (obbligatorio)               |
| `categories` | Categorie separate da virgole come `general`, `news` o `science`   |
| `language`   | Codice lingua per i risultati come `en`, `de` o `fr`               |

## Note

- **API JSON** -- usa l'endpoint nativo `format=json` di SearXNG, non l'estrazione da HTML
- **Nessuna chiave API** -- funziona subito con qualsiasi istanza SearXNG
- **Validazione dell'URL di base** -- `baseUrl` deve essere un URL `http://` o `https://`
  valido; gli host pubblici devono usare `https://`
- **Ordine di rilevamento automatico** -- SearXNG viene controllato per ultimo (ordine 200) nel
  rilevamento automatico. I provider supportati da API con chiavi configurate vengono eseguiti per primi, poi
  DuckDuckGo (ordine 100), poi Ollama Web Search (ordine 110)
- **Self-hosted** -- controlli l'istanza, le query e i motori di ricerca upstream
- **Categories** usa `general` come valore predefinito quando non è configurato

<Tip>
  Per far funzionare l'API JSON di SearXNG, assicurati che la tua istanza SearXNG abbia il formato `json`
  abilitato nel suo `settings.yml` sotto `search.formats`.
</Tip>

## Correlati

- [Panoramica di Web Search](/tools/web) -- tutti i provider e il rilevamento automatico
- [DuckDuckGo Search](/tools/duckduckgo-search) -- un altro fallback senza chiave
- [Brave Search](/tools/brave-search) -- risultati strutturati con livello gratuito
