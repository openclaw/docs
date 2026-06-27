---
read_when:
    - Vuoi un provider di ricerca web che non richieda alcuna chiave API
    - Vuoi usare DuckDuckGo per web_search
    - Vuoi un provider di ricerca senza chiave selezionato esplicitamente
summary: Ricerca web DuckDuckGo -- provider senza chiave (sperimentale, basato su HTML)
title: Ricerca DuckDuckGo
x-i18n:
    generated_at: "2026-06-27T18:19:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c042a3cd4fa6f37cb42b88930b5fe0122a561a810e275f26d9c1eb56502495a7
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw supporta DuckDuckGo come provider `web_search` **senza chiave**. Non sono richiesti
né una chiave API né un account.

<Warning>
  DuckDuckGo è un'integrazione **sperimentale e non ufficiale** che recupera risultati
  dalle pagine di ricerca non-JavaScript di DuckDuckGo, non da un'API ufficiale. Prevedi
  interruzioni occasionali dovute a pagine di bot-challenge o modifiche HTML.
</Warning>

## Configurazione

Non serve alcuna chiave API: imposta semplicemente DuckDuckGo come provider:

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

Impostazioni opzionali a livello di Plugin per regione e SafeSearch:

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
Codice regione DuckDuckGo (ad es. `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Livello SafeSearch.
</ParamField>

Regione e SafeSearch possono essere impostati anche nella configurazione del Plugin (vedi sopra): i parametri
dello strumento sovrascrivono i valori di configurazione per ogni query.

## Note

- **Nessuna chiave API**: funziona dopo aver selezionato DuckDuckGo come provider
  `web_search`
- **Sperimentale**: raccoglie risultati dalle pagine di ricerca HTML non-JavaScript
  di DuckDuckGo, non da un'API o SDK ufficiale
- **Rischio di bot-challenge**: DuckDuckGo può servire CAPTCHA o bloccare richieste
  in caso di uso intenso o automatizzato
- **Parsing HTML**: i risultati dipendono dalla struttura della pagina, che può cambiare senza
  preavviso
- **Selezione esplicita**: OpenClaw non sceglie DuckDuckGo automaticamente
  quando non è configurato alcun provider basato su API
- **SafeSearch predefinito su moderate** quando non configurato

<Tip>
  Per l'uso in produzione, considera [Brave Search](/it/tools/brave-search) (tier gratuito
  disponibile) o un altro provider basato su API.
</Tip>

## Correlati

- [Panoramica di Web Search](/it/tools/web) -- tutti i provider e il rilevamento automatico
- [Brave Search](/it/tools/brave-search) -- risultati strutturati con tier gratuito
- [Exa Search](/it/tools/exa-search) -- ricerca neurale con estrazione dei contenuti
