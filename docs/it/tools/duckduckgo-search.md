---
read_when:
    - Vuoi un provider di ricerca web che non richieda chiave API
    - Vuoi usare DuckDuckGo per web_search
    - Hai bisogno di un fallback di ricerca a configurazione zero
summary: Ricerca web DuckDuckGo -- provider di fallback senza chiave (sperimentale, basato su HTML)
title: Ricerca DuckDuckGo
x-i18n:
    generated_at: "2026-04-24T09:05:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6828830079b0bee1321f0971ec120ae98bc72ab040ad3a0fe30fe89217ed0722
    source_path: tools/duckduckgo-search.md
    workflow: 15
---

OpenClaw supporta DuckDuckGo come provider `web_search` **senza chiave**. Non è
richiesta alcuna chiave API né alcun account.

<Warning>
  DuckDuckGo è un'integrazione **sperimentale e non ufficiale** che recupera i risultati
  dalle pagine di ricerca non-JavaScript di DuckDuckGo, non da un'API ufficiale. Aspettati
  rotture occasionali dovute a pagine di bot-challenge o cambiamenti HTML.
</Warning>

## Configurazione

Nessuna chiave API necessaria — basta impostare DuckDuckGo come provider:

<Steps>
  <Step title="Configura">
    ```bash
    openclaw configure --section web
    # Select "duckduckgo" as the provider
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

Impostazioni facoltative a livello Plugin per regione e SafeSearch:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo region code
            safeSearch: "moderate", // "strict", "moderate", or "off"
          },
        },
      },
    },
  },
}
```

## Parametri dello strumento

<ParamField path="query" type="string" required>
Query di ricerca.
</ParamField>

<ParamField path="count" type="number" default="5">
Risultati da restituire (1–10).
</ParamField>

<ParamField path="region" type="string">
Codice regione DuckDuckGo (ad esempio `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Livello SafeSearch.
</ParamField>

Regione e SafeSearch possono anche essere impostati nella configurazione del Plugin (vedi sopra) — i
parametri dello strumento sovrascrivono i valori della configurazione per singola query.

## Note

- **Nessuna chiave API** — funziona subito, configurazione zero
- **Sperimentale** — raccoglie risultati dalle pagine HTML di ricerca non-JavaScript di DuckDuckGo, non da un'API o SDK ufficiale
- **Rischio bot-challenge** — DuckDuckGo può servire CAPTCHA o bloccare richieste
  in caso di uso intenso o automatizzato
- **Parsing HTML** — i risultati dipendono dalla struttura della pagina, che può cambiare senza
  preavviso
- **Ordine di auto-rilevamento** — DuckDuckGo è il primo fallback senza chiave
  (ordine 100) nell'auto-rilevamento. I provider supportati da API con chiavi configurate vengono eseguiti
  per primi, poi Ollama Web Search (ordine 110), poi SearXNG (ordine 200)
- **SafeSearch usa come predefinito moderate** quando non è configurato

<Tip>
  Per l'uso in produzione, valuta [Brave Search](/it/tools/brave-search) (con livello
  gratuito disponibile) o un altro provider supportato da API.
</Tip>

## Correlati

- [Panoramica Web Search](/it/tools/web) -- tutti i provider e l'auto-rilevamento
- [Brave Search](/it/tools/brave-search) -- risultati strutturati con livello gratuito
- [Exa Search](/it/tools/exa-search) -- ricerca neurale con estrazione del contenuto
