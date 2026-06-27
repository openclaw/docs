---
read_when:
    - Vuoi usare Gemini per web_search
    - È necessaria una GEMINI_API_KEY o models.providers.google.apiKey
    - Vuoi il grounding di Google Search
summary: Ricerca web Gemini con ancoraggio a Google Search
title: Ricerca Gemini
x-i18n:
    generated_at: "2026-06-27T18:20:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8bbebd5689daaa63c817ff17eac70e197999a3e1ecbb198249eb567e5ba0fc5f
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw supporta i modelli Gemini con
[grounding di Google Search](https://ai.google.dev/gemini-api/docs/grounding)
integrato, che restituisce risposte sintetizzate dall'AI supportate da risultati
live di Google Search con citazioni.

## Ottieni una chiave API

<Steps>
  <Step title="Crea una chiave">
    Vai a [Google AI Studio](https://aistudio.google.com/apikey) e crea una
    chiave API.
  </Step>
  <Step title="Archivia la chiave">
    Imposta `GEMINI_API_KEY` nell'ambiente del Gateway, riutilizza
    `models.providers.google.apiKey`, oppure configura una chiave dedicata per la ricerca web tramite:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Configurazione

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // optional; falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash", // default
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**Precedenza delle credenziali:** la ricerca web Gemini usa prima
`plugins.entries.google.config.webSearch.apiKey`, poi `GEMINI_API_KEY`,
poi `models.providers.google.apiKey`. Per gli URL base, il valore dedicato
`plugins.entries.google.config.webSearch.baseUrl` ha la precedenza su
`models.providers.google.baseUrl`.

Per un'installazione gateway, inserisci le chiavi di ambiente in `~/.openclaw/.env`.

## Come funziona

A differenza dei provider di ricerca tradizionali che restituiscono un elenco di link e snippet,
Gemini usa il grounding di Google Search per produrre risposte sintetizzate dall'AI con
citazioni inline. I risultati includono sia la risposta sintetizzata sia gli URL di origine.

- Gli URL delle citazioni dal grounding Gemini vengono risolti automaticamente dagli URL di
  reindirizzamento di Google agli URL diretti.
- La risoluzione dei reindirizzamenti usa il percorso di protezione SSRF (HEAD + controlli dei reindirizzamenti +
  convalida http/https) prima di restituire l'URL finale della citazione.
- La risoluzione dei reindirizzamenti usa impostazioni predefinite SSRF rigorose, quindi i reindirizzamenti verso
  destinazioni private/interne vengono bloccati.

## Parametri supportati

La ricerca Gemini supporta `query`, `freshness`, `date_after` e `date_before`.

`count` è accettato per la compatibilità condivisa di `web_search`, ma il grounding Gemini
restituisce comunque una sola risposta sintetizzata con citazioni invece di un elenco
di N risultati.

`freshness` accetta `day`, `week`, `month`, `year` e le scorciatoie condivise
`pd`, `pw`, `pm` e `py`. `day`/`pd` aggiunge un'istruzione di recenza alla query Gemini
invece di un intervallo rigido di 24 ore. `week`, `month`, `year` e gli intervalli espliciti
`date_after`/`date_before` impostano `timeRangeFilter` del grounding Gemini Google Search.
`country`, `language` e `domain_filter` non sono supportati.

## Selezione del modello

Il modello predefinito è `gemini-2.5-flash` (rapido ed economicamente conveniente). Qualsiasi modello Gemini
che supporta il grounding può essere usato tramite
`plugins.entries.google.config.webSearch.model`.

## Override dell'URL base

Imposta `plugins.entries.google.config.webSearch.baseUrl` quando la ricerca web Gemini
deve passare attraverso un proxy dell'operatore o un endpoint personalizzato compatibile con Gemini. Se
non è impostato, la ricerca web Gemini riutilizza `models.providers.google.baseUrl`. Un semplice valore
`https://generativelanguage.googleapis.com` viene normalizzato in
`https://generativelanguage.googleapis.com/v1beta`; i percorsi proxy personalizzati vengono mantenuti
come forniti dopo aver rimosso le barre finali.

## Correlati

- [Panoramica di Web Search](/it/tools/web) -- tutti i provider e il rilevamento automatico
- [Brave Search](/it/tools/brave-search) -- risultati strutturati con snippet
- [Perplexity Search](/it/tools/perplexity-search) -- risultati strutturati + estrazione dei contenuti
