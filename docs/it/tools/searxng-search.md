---
read_when:
    - Vuoi un provider di ricerca web self-hosted
    - Vuoi usare SearXNG per web_search
    - Hai bisogno di un'opzione di ricerca incentrata sulla privacy o isolata dalla rete
summary: Ricerca web SearXNG -- provider di metaricerca self-hosted senza chiavi API
title: Ricerca SearXNG
x-i18n:
    generated_at: "2026-07-12T07:38:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cae8de9f8e2c8dd9cec615adb48da5c1fd7654bffe96c7afc1acea3effbcf1fc
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw supporta [SearXNG](https://docs.searxng.org/) come provider `web_search` **self-hosted,
senza chiavi**. SearXNG è un metamotore di ricerca open source
che aggrega risultati da Google, Bing, DuckDuckGo e altre fonti.

Vantaggi:

- **Gratuito e illimitato** -- non richiede chiavi API né abbonamenti commerciali
- **Privacy / isolamento dalla rete** -- le query non lasciano mai la tua rete
- **Funziona ovunque** -- nessuna restrizione geografica delle API di ricerca commerciali

## Configurazione

<Steps>
  <Step title="Installa il plugin">
    ```bash
    openclaw plugins install @openclaw/searxng-plugin
    ```
  </Step>
  <Step title="Esegui un'istanza SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    In alternativa, usa qualsiasi distribuzione SearXNG esistente a cui hai accesso. Consulta la
    [documentazione di SearXNG](https://docs.searxng.org/) per la configurazione in produzione.

  </Step>
  <Step title="Configura">
    ```bash
    openclaw configure --section web
    # Seleziona "searxng" come provider
    ```

    In alternativa, imposta la variabile d'ambiente e lascia che venga rilevata automaticamente:

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

`baseUrl` accetta anche un oggetto SecretRef (ad esempio `{ source: "env", id: "SEARXNG_BASE_URL" }`).

## Variabile d'ambiente

Imposta `SEARXNG_BASE_URL` in alternativa alla configurazione:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Ordine di risoluzione: stringa `baseUrl` configurata, quindi un SecretRef di ambiente inline in
`baseUrl`, infine `SEARXNG_BASE_URL`. Quando nessuno dei percorsi di configurazione è impostato e
`SEARXNG_BASE_URL` è presente senza un provider scelto esplicitamente, il rilevamento automatico
seleziona SearXNG.

## Riferimento per la configurazione del plugin

| Campo        | Descrizione                                                               |
| ------------ | ------------------------------------------------------------------------- |
| `baseUrl`    | URL di base dell'istanza SearXNG (obbligatorio)                           |
| `categories` | Categorie separate da virgole, come `general`, `news` o `science`         |
| `language`   | Codice della lingua per i risultati, come `en`, `de` o `fr`               |

La chiamata allo strumento `web_search` accetta anche `count` (1-10 risultati), `categories`
e `language` come sostituzioni specifiche per ciascuna chiamata.

## Note

- **API JSON** -- usa l'endpoint nativo `format=json` di SearXNG, non l'estrazione dall'HTML
- **URL dei risultati delle immagini** -- i risultati della categoria immagini includono `img_src` quando SearXNG
  restituisce un URL diretto dell'immagine
- **Nessuna chiave API** -- funziona immediatamente con qualsiasi istanza SearXNG
- **Convalida dell'URL di base** -- `baseUrl` deve essere un URL `http://` o `https://`
  valido
- **Protezione di rete** -- gli URL di base `http://` devono puntare a un host privato attendibile o
  local loopback (gli host pubblici devono usare `https://`); gli URL di base `https://` che
  vengono risolti in un indirizzo privato/interno ricevono la stessa autorizzazione self-hosted,
  mentre gli URL di base `https://` risolti pubblicamente mantengono una rigorosa protezione SSRF
- **Ordine di rilevamento automatico** -- SearXNG richiede un `baseUrl` configurato (ordine
  200 tra i provider che dispongono già delle credenziali richieste). I provider senza chiavi,
  come DuckDuckGo o Ollama Web Search, non prevalgono mai implicitamente nel rilevamento automatico;
  si attivano solo tramite una scelta esplicita di `provider`
- **Self-hosted** -- controlli l'istanza, le query e i motori di ricerca upstream
- **Categorie** -- il valore predefinito è `general` quando non sono configurate
- **Ripiego della categoria** -- se una richiesta per una categoria diversa da `general` riesce ma
  restituisce zero risultati, OpenClaw ripete una volta la stessa query con `general`
  prima di restituire un insieme di risultati vuoto
- **Memorizzazione nella cache dei risultati** -- le query identiche (stessa query, conteggio, categorie,
  lingua e URL di base) vengono memorizzate nella cache del processo per un breve TTL
- **Requisito di versione** -- il plugin dichiara `minHostVersion: >=2026.6.9`

<Tip>
  Affinché l'API JSON di SearXNG funzioni, assicurati che il formato `json`
  sia abilitato nel file `settings.yml` dell'istanza SearXNG, sotto `search.formats`.
</Tip>

## Contenuti correlati

- [Panoramica della ricerca web](/it/tools/web) -- tutti i provider e il rilevamento automatico
- [Ricerca DuckDuckGo](/it/tools/duckduckgo-search) -- un altro provider senza chiavi
- [Ricerca Brave](/it/tools/brave-search) -- risultati strutturati con piano gratuito
