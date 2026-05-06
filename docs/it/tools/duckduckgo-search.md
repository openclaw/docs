---
read_when:
    - Desideri un provider di ricerca web che non richieda una chiave API
    - Vuoi usare DuckDuckGo per web_search
    - Serve un meccanismo di ricerca di ripiego senza configurazione.
summary: Ricerca web DuckDuckGo -- provider di fallback senza chiave (sperimentale, basato su HTML)
title: Ricerca DuckDuckGo
x-i18n:
    generated_at: "2026-05-06T09:11:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89c23535730dc272b88e22d1dbeef61abd55a7968d9e57bdce20594df8a2c0f2
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw supporta DuckDuckGo come provider `web_search` **senza chiave**. Non sono richiesti una chiave API o un account.

<Warning>
  DuckDuckGo è un'integrazione **sperimentale, non ufficiale** che recupera risultati
  dalle pagine di ricerca non JavaScript di DuckDuckGo - non da un'API ufficiale. Sono possibili
  occasionali interruzioni dovute a pagine di verifica anti-bot o modifiche HTML.
</Warning>

## Configurazione

Non è necessaria alcuna chiave API - imposta semplicemente DuckDuckGo come provider:

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

Impostazioni opzionali a livello di plugin per area geografica e SafeSearch:

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
Risultati da restituire (1-10).
</ParamField>

<ParamField path="region" type="string">
Codice area geografica DuckDuckGo (ad es. `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Livello SafeSearch.
</ParamField>

Area geografica e SafeSearch possono essere impostati anche nella configurazione del plugin (vedi sopra) - i parametri dello strumento
sovrascrivono i valori di configurazione per ogni query.

## Note

- **Nessuna chiave API** - funziona subito, senza configurazione
- **Sperimentale** - raccoglie risultati dalle pagine HTML non JavaScript di ricerca
  di DuckDuckGo, non da un'API o SDK ufficiale
- **Rischio di verifica anti-bot** - DuckDuckGo può mostrare CAPTCHA o bloccare le richieste
  in caso di uso intenso o automatizzato
- **Parsing HTML** - i risultati dipendono dalla struttura della pagina, che può cambiare senza
  preavviso
- **Ordine di rilevamento automatico** - DuckDuckGo è il primo fallback senza chiave
  (ordine 100) nel rilevamento automatico. I provider basati su API con chiavi configurate vengono eseguiti
  per primi, poi Ollama Web Search (ordine 110), poi SearXNG (ordine 200)
- **SafeSearch ha come valore predefinito moderate** quando non è configurato

<Tip>
  Per l'uso in produzione, considera [Brave Search](/it/tools/brave-search) (piano gratuito
  disponibile) o un altro provider basato su API.
</Tip>

## Correlati

- [Panoramica Web Search](/it/tools/web) -- tutti i provider e il rilevamento automatico
- [Brave Search](/it/tools/brave-search) -- risultati strutturati con piano gratuito
- [Exa Search](/it/tools/exa-search) -- ricerca neurale con estrazione dei contenuti
