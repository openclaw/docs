---
read_when:
    - Vuoi un provider di ricerca web che non richieda alcuna chiave API
    - Vuoi usare DuckDuckGo per web_search
    - Vuoi un provider di ricerca senza chiave selezionato esplicitamente
summary: Ricerca web DuckDuckGo -- provider senza chiave (sperimentale, basato su HTML)
title: Ricerca DuckDuckGo
x-i18n:
    generated_at: "2026-07-12T07:36:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84e90532de276dcb3f73c67015dffe5f5a62be673e44a19053b2b1dfcb0986ac
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw supporta DuckDuckGo come provider `web_search` **senza chiave**. Non sono richiesti né una chiave API né un account.

<Warning>
  DuckDuckGo è un'integrazione **sperimentale e non ufficiale** che estrae dati dalle pagine HTML di ricerca senza JavaScript di DuckDuckGo, anziché utilizzare un'API ufficiale. Sono possibili malfunzionamenti occasionali dovuti a pagine di verifica anti-bot o a modifiche dell'HTML.
</Warning>

## Configurazione

DuckDuckGo non viene mai selezionato automaticamente, poiché il rilevamento automatico considera solo i provider con credenziali utilizzabili. Impostalo esplicitamente:

<Steps>
  <Step title="Configura">
    ```bash
    openclaw configure --section web
    # Seleziona "duckduckgo" come provider
    ```
  </Step>
</Steps>

## Configurazione

Imposta il provider direttamente nella configurazione:

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

Impostazioni facoltative a livello di Plugin per la regione e SafeSearch:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // Codice regione di DuckDuckGo
            safeSearch: "moderate", // "strict", "moderate" oppure "off"
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
Numero di risultati da restituire (1-10).
</ParamField>

<ParamField path="region" type="string">
Codice regione di DuckDuckGo (ad es. `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Livello di SafeSearch.
</ParamField>

I parametri dello strumento `region` e `safeSearch` sostituiscono, per ogni singola query, i valori di configurazione del Plugin indicati sopra.

## Note

- **Nessuna chiave API** -- funziona non appena DuckDuckGo viene selezionato come provider `web_search`.
- **Sperimentale** -- estrae dati dalle pagine HTML di ricerca senza JavaScript di DuckDuckGo e non utilizza un'API o un SDK ufficiale. I risultati dipendono dalla struttura delle pagine, che può cambiare senza preavviso.
- **Rischio di verifiche anti-bot** -- DuckDuckGo potrebbe mostrare CAPTCHA o bloccare le richieste in caso di utilizzo intenso o automatizzato.
- **Solo selezione esplicita** -- il rilevamento automatico di OpenClaw considera solo i provider con credenziali utilizzabili, pertanto un provider senza chiave come DuckDuckGo non viene mai scelto automaticamente; devi impostare `provider: "duckduckgo"`.
- **Il valore predefinito di SafeSearch è `moderate`** quando non è configurato.

<Tip>
  Per l'uso in produzione, valuta [Brave Search](/it/tools/brave-search), che offre un piano gratuito, oppure un altro provider basato su API.
</Tip>

## Contenuti correlati

- [Panoramica della ricerca web](/it/tools/web) -- tutti i provider e il rilevamento automatico
- [Brave Search](/it/tools/brave-search) -- risultati strutturati con piano gratuito
- [Exa Search](/it/tools/exa-search) -- ricerca neurale con estrazione dei contenuti
