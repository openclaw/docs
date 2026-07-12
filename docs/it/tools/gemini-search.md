---
read_when:
    - Vuoi usare Gemini per web_search
    - È necessario impostare `GEMINI_API_KEY` oppure `models.providers.google.apiKey`
    - Vuoi il grounding di Google Search
summary: Ricerca web Gemini con grounding di Google Search
title: Ricerca Gemini
x-i18n:
    generated_at: "2026-07-12T07:33:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c7cb55fb185adfda01ab6b3c6434ab6e3ee31162733c752d4c81328bce9a6cd
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw supporta i modelli Gemini con la funzionalità integrata di
[grounding tramite Google Search](https://ai.google.dev/gemini-api/docs/grounding),
che restituisce risposte sintetizzate dall'IA basate sui risultati in tempo reale di Google Search e corredate
da citazioni.

## Ottenere una chiave API

<Steps>
  <Step title="Creare una chiave">
    Vai a [Google AI Studio](https://aistudio.google.com/apikey) e crea una
    chiave API.
  </Step>
  <Step title="Archiviare la chiave">
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
            apiKey: "AIza...", // facoltativo se è impostato GEMINI_API_KEY o models.providers.google.apiKey
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // facoltativo; in alternativa usa models.providers.google.baseUrl
            model: "gemini-2.5-flash", // valore predefinito
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

**Precedenza delle credenziali:** la ricerca web di Gemini usa prima
`plugins.entries.google.config.webSearch.apiKey`, poi `GEMINI_API_KEY`
e infine `models.providers.google.apiKey`. Per gli URL di base, il valore dedicato
`plugins.entries.google.config.webSearch.baseUrl` ha la precedenza su
`models.providers.google.baseUrl`.

Per un'installazione del Gateway, inserisci le chiavi di ambiente in `~/.openclaw/.env`.

## Funzionamento

A differenza dei provider di ricerca tradizionali, che restituiscono un elenco di link e frammenti,
Gemini usa il grounding tramite Google Search per produrre risposte sintetizzate dall'IA con
citazioni nel testo. I risultati includono sia la risposta sintetizzata sia gli URL
delle fonti.

- Gli URL delle citazioni provenienti dal grounding di Gemini vengono risolti automaticamente dagli URL di
  reindirizzamento di Google agli URL diretti tramite una richiesta HEAD attraverso il percorso di recupero
  di OpenClaw protetto da SSRF (gestione dei reindirizzamenti, convalida http/https).
- La risoluzione dei reindirizzamenti usa impostazioni SSRF predefinite rigorose, pertanto i reindirizzamenti verso
  destinazioni private/interne vengono bloccati.

## Parametri supportati

La ricerca Gemini supporta `query`, `freshness`, `date_after` e `date_before`.

`count` è accettato per la compatibilità con `web_search` condiviso, ma il grounding di Gemini
restituisce comunque una singola risposta sintetizzata con citazioni anziché un elenco
di N risultati.

`freshness` accetta `day`, `week`, `month`, `year` e le abbreviazioni condivise
`pd`, `pw`, `pm` e `py`. `day`/`pd` aggiunge un'istruzione relativa alla recenza alla query
Gemini invece di un intervallo rigido di 24 ore. `week`, `month`, `year` e gli intervalli espliciti
`date_after`/`date_before` impostano il
`timeRangeFilter` del grounding tramite Google Search di Gemini. `country`, `language` e `domain_filter` non sono supportati.

## Selezione del modello

Il modello predefinito è `gemini-2.5-flash` (veloce ed economico). È possibile usare qualsiasi modello Gemini
che supporti il grounding tramite
`plugins.entries.google.config.webSearch.model`.

## Sostituzioni dell'URL di base

Imposta `plugins.entries.google.config.webSearch.baseUrl` quando la ricerca web di Gemini
deve essere instradata tramite un proxy dell'operatore o un endpoint personalizzato compatibile con Gemini. Se
non è impostato, la ricerca web di Gemini riutilizza `models.providers.google.baseUrl`. Un semplice valore
`https://generativelanguage.googleapis.com` viene normalizzato in
`https://generativelanguage.googleapis.com/v1beta`; i percorsi dei proxy personalizzati vengono mantenuti
come forniti dopo la rimozione delle barre finali.

## Contenuti correlati

- [Panoramica della ricerca web](/it/tools/web) -- tutti i provider e rilevamento automatico
- [Brave Search](/it/tools/brave-search) -- risultati strutturati con frammenti
- [Perplexity Search](/it/tools/perplexity-search) -- risultati strutturati + estrazione dei contenuti
