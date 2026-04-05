---
read_when:
    - Vuoi un provider di ricerca web che non richieda alcuna chiave API
    - Vuoi usare DuckDuckGo per `web_search`
    - Hai bisogno di un fallback di ricerca a configurazione zero
summary: Ricerca web DuckDuckGo -- provider di fallback senza chiave (sperimentale, basato su HTML)
title: Ricerca DuckDuckGo
x-i18n:
    generated_at: "2026-04-05T14:06:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31f8e3883584534396c247c3d8069ea4c5b6399e0ff13a9dd0c8ee0c3da02096
    source_path: tools/duckduckgo-search.md
    workflow: 15
---

# Ricerca DuckDuckGo

OpenClaw supporta DuckDuckGo come provider `web_search` **senza chiave**. Non è richiesta alcuna chiave API né alcun account.

<Warning>
  DuckDuckGo è un'integrazione **sperimentale e non ufficiale** che estrae i risultati
  dalle pagine di ricerca non JavaScript di DuckDuckGo, non da un'API ufficiale. Aspettati
  occasionali rotture dovute a pagine di bot challenge o cambiamenti dell'HTML.
</Warning>

## Configurazione

Non serve alcuna chiave API: basta impostare DuckDuckGo come provider:

<Steps>
  <Step title="Configura">
    ```bash
    openclaw configure --section web
    # Seleziona "duckduckgo" come provider
    ```
  </Step>
</Steps>

## Configurazione

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
      },
    },
  },
}
```

Impostazioni facoltative a livello di plugin per regione e SafeSearch:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // Codice regione DuckDuckGo
            safeSearch: "moderate", // "strict", "moderate" oppure "off"
          },
        },
      },
    },
  },
}
```

## Parametri dello strumento

| Parametro    | Descrizione                                                  |
| ------------ | ------------------------------------------------------------ |
| `query`      | Query di ricerca (obbligatoria)                              |
| `count`      | Risultati da restituire (1-10, predefinito: 5)               |
| `region`     | Codice regione DuckDuckGo (ad es. `us-en`, `uk-en`, `de-de`) |
| `safeSearch` | Livello SafeSearch: `strict`, `moderate` (predefinito) o `off` |

Regione e SafeSearch possono anche essere impostati nella configurazione del plugin (vedi sopra): i parametri dello strumento sovrascrivono i valori di configurazione per ogni query.

## Note

- **Nessuna chiave API** — funziona subito, senza configurazione
- **Sperimentale** — raccoglie i risultati dalle pagine di ricerca HTML non JavaScript
  di DuckDuckGo, non da un'API o SDK ufficiale
- **Rischio di bot challenge** — DuckDuckGo può mostrare CAPTCHA o bloccare le richieste
  in caso di uso intenso o automatizzato
- **Parsing HTML** — i risultati dipendono dalla struttura della pagina, che può cambiare senza
  preavviso
- **Ordine di rilevamento automatico** — DuckDuckGo è il primo fallback senza chiave
  (ordine 100) nel rilevamento automatico. I provider supportati da API con chiavi configurate vengono eseguiti
  per primi, poi Ollama Web Search (ordine 110), poi SearXNG (ordine 200)
- **SafeSearch è predefinito su moderate** quando non configurato

<Tip>
  Per l'uso in produzione, prendi in considerazione [Brave Search](/tools/brave-search) (livello gratuito
  disponibile) o un altro provider supportato da API.
</Tip>

## Correlati

- [Panoramica di Web Search](/tools/web) -- tutti i provider e il rilevamento automatico
- [Brave Search](/tools/brave-search) -- risultati strutturati con livello gratuito
- [Exa Search](/tools/exa-search) -- ricerca neurale con estrazione dei contenuti
