---
read_when:
    - Vuoi usare Gemini per `web_search`
    - Hai bisogno di un `GEMINI_API_KEY`
    - Vuoi il grounding di Google Search
summary: Ricerca web Gemini con grounding di Google Search
title: Ricerca Gemini
x-i18n:
    generated_at: "2026-04-05T14:06:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42644176baca6b4b041142541618f6f68361d410d6f425cc4104cd88d9f7c480
    source_path: tools/gemini-search.md
    workflow: 15
---

# Ricerca Gemini

OpenClaw supporta i modelli Gemini con
[grounding di Google Search](https://ai.google.dev/gemini-api/docs/grounding) integrato,
che restituisce risposte sintetizzate dall'IA supportate da risultati live di Google Search con
citazioni.

## Ottenere una chiave API

<Steps>
  <Step title="Creare una chiave">
    Vai a [Google AI Studio](https://aistudio.google.com/apikey) e crea una
    chiave API.
  </Step>
  <Step title="Memorizzare la chiave">
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
            apiKey: "AIza...", // facoltativo se GEMINI_API_KEY è impostato
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

**Alternativa con variabile d'ambiente:** imposta `GEMINI_API_KEY` nell'ambiente del Gateway.
Per un'installazione del gateway, inseriscilo in `~/.openclaw/.env`.

## Come funziona

A differenza dei provider di ricerca tradizionali che restituiscono un elenco di link e snippet,
Gemini usa il grounding di Google Search per produrre risposte sintetizzate dall'IA con
citazioni inline. I risultati includono sia la risposta sintetizzata sia gli URL
delle fonti.

- Gli URL di citazione dal grounding Gemini vengono risolti automaticamente dagli URL
  di reindirizzamento Google agli URL diretti.
- La risoluzione dei reindirizzamenti usa il percorso di protezione SSRF (controlli HEAD + redirect +
  validazione http/https) prima di restituire l'URL finale della citazione.
- La risoluzione dei reindirizzamenti usa i valori predefiniti SSRF rigorosi, quindi i reindirizzamenti verso
  target privati/interni vengono bloccati.

## Parametri supportati

La ricerca Gemini supporta `query`.

`count` è accettato per compatibilità con `web_search` condiviso, ma il grounding Gemini
restituisce comunque una singola risposta sintetizzata con citazioni anziché un elenco
di N risultati.

I filtri specifici del provider come `country`, `language`, `freshness` e
`domain_filter` non sono supportati.

## Selezione del modello

Il modello predefinito è `gemini-2.5-flash` (rapido e conveniente). Qualsiasi modello Gemini
che supporta il grounding può essere usato tramite
`plugins.entries.google.config.webSearch.model`.

## Correlati

- [Panoramica della ricerca web](/tools/web) -- tutti i provider e il rilevamento automatico
- [Brave Search](/tools/brave-search) -- risultati strutturati con snippet
- [Perplexity Search](/tools/perplexity-search) -- risultati strutturati + estrazione del contenuto
