---
read_when:
    - Vuoi usare Grok per web_search
    - È necessaria una XAI_API_KEY per la ricerca web
summary: Ricerca web Grok tramite risposte xAI basate sul web
title: Ricerca Grok
x-i18n:
    generated_at: "2026-05-02T08:35:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7238be2b488ba285c948065f5c1deff21898409aa11bdaa9ec893274d0eadd4a
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw supporta Grok come provider `web_search`, usando risposte xAI basate sul web per produrre risposte sintetizzate dall'IA supportate da risultati di ricerca in tempo reale con citazioni.

La stessa `XAI_API_KEY` può anche alimentare lo strumento integrato `x_search` per la ricerca di post su X (precedentemente Twitter). Se archivi la chiave in `plugins.entries.xai.config.webSearch.apiKey`, OpenClaw ora la riutilizza anche come fallback per il provider di modelli xAI incluso.

Per le metriche X a livello di post, come repost, risposte, segnalibri o visualizzazioni, preferisci `x_search` con l'URL esatto del post o l'ID dello stato invece di una query di ricerca ampia.

## Onboarding e configurazione

Se scegli **Grok** durante:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw può mostrare un passaggio successivo separato per abilitare `x_search` con la stessa `XAI_API_KEY`. Questo passaggio successivo:

- appare solo dopo aver scelto Grok per `web_search`
- non è una scelta separata di provider di ricerca web di primo livello
- può facoltativamente impostare il modello `x_search` durante lo stesso flusso

Se lo salti, puoi abilitare o modificare `x_search` in seguito nella configurazione.

## Ottieni una chiave API

<Steps>
  <Step title="Crea una chiave">
    Ottieni una chiave API da [xAI](https://console.x.ai/).
  </Step>
  <Step title="Salva la chiave">
    Imposta `XAI_API_KEY` nell'ambiente del Gateway, oppure configura tramite:

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
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional Responses API proxy/base URL override
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**Alternativa con ambiente:** imposta `XAI_API_KEY` nell'ambiente del Gateway.
Per un'installazione del gateway, inseriscila in `~/.openclaw/.env`.

## Come funziona

Grok usa risposte xAI basate sul web per sintetizzare risposte con citazioni in linea, in modo simile all'approccio di grounding di Google Search di Gemini.

## Parametri supportati

La ricerca Grok supporta `query`.

`count` è accettato per la compatibilità condivisa di `web_search`, ma Grok restituisce comunque una singola risposta sintetizzata con citazioni invece di un elenco di N risultati.

I filtri specifici del provider non sono attualmente supportati.

Grok usa un timeout predefinito specifico del provider di 60 secondi perché le ricerche xAI Responses basate sul web possono richiedere più tempo rispetto al valore predefinito condiviso di `web_search`. Imposta `tools.web.search.timeoutSeconds` per sovrascriverlo.

## Override dell'URL di base

Imposta `plugins.entries.xai.config.webSearch.baseUrl` quando la ricerca web Grok deve passare attraverso un proxy dell'operatore o un endpoint Responses compatibile con xAI. OpenClaw invia richieste POST a `<baseUrl>/responses` dopo aver rimosso le barre finali. `x_search` usa lo stesso fallback `webSearch.baseUrl` a meno che non sia impostato `plugins.entries.xai.config.xSearch.baseUrl`.

## Correlati

- [Panoramica di Web Search](/it/tools/web) -- tutti i provider e il rilevamento automatico
- [`x_search` in Web Search](/it/tools/web#x_search) -- ricerca X di prima classe tramite xAI
- [Gemini Search](/it/tools/gemini-search) -- risposte sintetizzate dall'IA tramite grounding Google
