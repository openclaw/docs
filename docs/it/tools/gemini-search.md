---
read_when:
    - Vuoi usare Gemini per web_search
    - È necessaria una GEMINI_API_KEY o models.providers.google.apiKey
    - Vuoi l'ancoraggio tramite Google Search
summary: Ricerca web di Gemini con ancoraggio tramite Google Search
title: Ricerca Gemini
x-i18n:
    generated_at: "2026-05-02T08:35:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 015d77fef123b1fd99d43eb6472bb8c672585328e17735d1fa0ead387cd2066a
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw supporta i modelli Gemini con
[grounding di Google Search](https://ai.google.dev/gemini-api/docs/grounding) integrato,
che restituisce risposte sintetizzate dall'IA basate su risultati live di Google Search con
citazioni.

## Ottieni una chiave API

<Steps>
  <Step title="Crea una chiave">
    Vai su [Google AI Studio](https://aistudio.google.com/apikey) e crea una
    chiave API.
  </Step>
  <Step title="Archivia la chiave">
    Imposta `GEMINI_API_KEY` nell'ambiente del Gateway, riutilizza
    `models.providers.google.apiKey` oppure configura una chiave dedicata per la ricerca web tramite:

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
quindi `models.providers.google.apiKey`. Per gli URL di base, il valore dedicato
`plugins.entries.google.config.webSearch.baseUrl` ha la precedenza su
`models.providers.google.baseUrl`.

Per un'installazione del gateway, inserisci le chiavi env in `~/.openclaw/.env`.

## Come funziona

A differenza dei provider di ricerca tradizionali che restituiscono un elenco di link e snippet,
Gemini usa il grounding di Google Search per produrre risposte sintetizzate dall'IA con
citazioni inline. I risultati includono sia la risposta sintetizzata sia gli URL
delle fonti.

- Gli URL delle citazioni dal grounding di Gemini vengono risolti automaticamente dagli URL di
  reindirizzamento di Google agli URL diretti.
- La risoluzione dei reindirizzamenti usa il percorso di protezione SSRF (HEAD + controlli dei reindirizzamenti +
  convalida http/https) prima di restituire l'URL finale della citazione.
- La risoluzione dei reindirizzamenti usa impostazioni predefinite SSRF rigorose, quindi i reindirizzamenti verso
  destinazioni private/interne vengono bloccati.

## Parametri supportati

La ricerca Gemini supporta `query`, `freshness`, `date_after` e `date_before`.

`count` è accettato per la compatibilità condivisa con `web_search`, ma il grounding di Gemini
restituisce comunque una singola risposta sintetizzata con citazioni anziché un elenco
di N risultati.

`freshness` accetta `day`, `week`, `month`, `year` e le scorciatoie condivise
`pd`, `pw`, `pm` e `py`. OpenClaw converte questi valori, o un intervallo esplicito
`date_after`/`date_before`, nel
`timeRangeFilter` del grounding di Google Search di Gemini. `country`, `language` e `domain_filter` non sono supportati.

## Selezione del modello

Il modello predefinito è `gemini-2.5-flash` (veloce ed economico). Qualsiasi modello Gemini
che supporta il grounding può essere usato tramite
`plugins.entries.google.config.webSearch.model`.

## Override dell'URL di base

Imposta `plugins.entries.google.config.webSearch.baseUrl` quando la ricerca web Gemini
deve passare attraverso un proxy dell'operatore o un endpoint personalizzato compatibile con Gemini. Se
non è impostato, la ricerca web Gemini riutilizza `models.providers.google.baseUrl`. Un valore semplice
`https://generativelanguage.googleapis.com` viene normalizzato in
`https://generativelanguage.googleapis.com/v1beta`; i percorsi proxy personalizzati vengono mantenuti
come forniti dopo la rimozione degli slash finali.

## Correlati

- [Panoramica di Web Search](/it/tools/web) -- tutti i provider e il rilevamento automatico
- [Brave Search](/it/tools/brave-search) -- risultati strutturati con snippet
- [Perplexity Search](/it/tools/perplexity-search) -- risultati strutturati + estrazione dei contenuti
