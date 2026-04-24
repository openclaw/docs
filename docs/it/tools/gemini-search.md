---
read_when:
    - Vuoi usare Gemini per web_search
    - Hai bisogno di `GEMINI_API_KEY`
    - Vuoi il grounding di Google Search
summary: Ricerca web Gemini con grounding di Google Search
title: Ricerca Gemini
x-i18n:
    generated_at: "2026-04-24T09:05:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0778ae326e23ea1bb719fdc694b2accc5a6651e08658a695d4d70e20fc5943a4
    source_path: tools/gemini-search.md
    workflow: 15
---

OpenClaw supporta i modelli Gemini con [grounding di Google Search](https://ai.google.dev/gemini-api/docs/grounding) integrato,
che restituisce risposte sintetizzate dall'AI supportate da risultati live di Google Search con
citazioni.

## Ottieni una chiave API

<Steps>
  <Step title="Crea una chiave">
    Vai su [Google AI Studio](https://aistudio.google.com/apikey) e crea una
    chiave API.
  </Step>
  <Step title="Memorizza la chiave">
    Imposta `GEMINI_API_KEY` nell'ambiente del Gateway, oppure configura tramite:

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
            apiKey: "AIza...", // facoltativa se GEMINI_API_KEY è impostata
            model: "gemini-2.5-flash", // predefinito
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

**Alternativa tramite ambiente:** imposta `GEMINI_API_KEY` nell'ambiente del Gateway.
Per un'installazione gateway, inseriscila in `~/.openclaw/.env`.

## Come funziona

A differenza dei provider di ricerca tradizionali che restituiscono un elenco di link e snippet,
Gemini usa il grounding di Google Search per produrre risposte sintetizzate dall'AI con
citazioni inline. I risultati includono sia la risposta sintetizzata sia gli URL delle fonti.

- Gli URL di citazione dal grounding Gemini vengono automaticamente risolti dagli URL di redirect di Google a URL diretti.
- La risoluzione dei redirect usa il percorso di protezione SSRF (controlli HEAD + redirect +
  validazione http/https) prima di restituire l'URL finale della citazione.
- La risoluzione dei redirect usa i predefiniti rigidi SSRF, quindi i redirect verso
  destinazioni private/interne vengono bloccati.

## Parametri supportati

La ricerca Gemini supporta `query`.

`count` è accettato per compatibilità con `web_search` condiviso, ma il grounding Gemini
restituisce comunque una sola risposta sintetizzata con citazioni invece di un elenco
di N risultati.

I filtri specifici del provider come `country`, `language`, `freshness` e
`domain_filter` non sono supportati.

## Selezione del modello

Il modello predefinito è `gemini-2.5-flash` (veloce ed economico). Qualsiasi modello Gemini
che supporti il grounding può essere usato tramite
`plugins.entries.google.config.webSearch.model`.

## Correlati

- [Panoramica della ricerca web](/it/tools/web) -- tutti i provider e il rilevamento automatico
- [Brave Search](/it/tools/brave-search) -- risultati strutturati con snippet
- [Perplexity Search](/it/tools/perplexity-search) -- risultati strutturati + estrazione dei contenuti
