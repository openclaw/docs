---
read_when:
    - Vuoi usare Grok per `web_search`
    - Ti serve una `XAI_API_KEY` per la web search
summary: Web search Grok tramite risposte xAI basate sul web-grounding
title: Ricerca Grok
x-i18n:
    generated_at: "2026-04-24T09:06:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37e13e7210f0b008616e27ea08d38b4f1efe89d3c4f82a61aaac944a1e1dd0af
    source_path: tools/grok-search.md
    workflow: 15
---

OpenClaw supporta Grok come provider `web_search`, usando risposte xAI basate sul web-grounding
per produrre risposte sintetizzate dall'AI supportate da risultati di ricerca live
con citazioni.

La stessa `XAI_API_KEY` può alimentare anche lo strumento integrato `x_search` per la
ricerca di post su X (precedentemente Twitter). Se memorizzi la chiave sotto
`plugins.entries.xai.config.webSearch.apiKey`, OpenClaw ora la riusa come
fallback anche per il provider di modelli xAI integrato.

Per metriche a livello di post X come repost, risposte, bookmark o visualizzazioni, preferisci
`x_search` con l'URL esatto del post o l'ID dello status invece di una query di ricerca ampia.

## Onboarding e configurazione

Se scegli **Grok** durante:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw può mostrare un passaggio di follow-up separato per abilitare `x_search` con la stessa
`XAI_API_KEY`. Questo follow-up:

- appare solo dopo che scegli Grok per `web_search`
- non è una scelta separata di provider web-search di primo livello
- può facoltativamente impostare il modello `x_search` durante lo stesso flusso

Se lo salti, puoi abilitare o cambiare `x_search` più tardi nella configurazione.

## Ottieni una API key

<Steps>
  <Step title="Crea una chiave">
    Ottieni una API key da [xAI](https://console.x.ai/).
  </Step>
  <Step title="Memorizza la chiave">
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
            apiKey: "xai-...", // facoltativo se XAI_API_KEY è impostato
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

**Alternativa tramite ambiente:** imposta `XAI_API_KEY` nell'ambiente del Gateway.
Per un'installazione gateway, inseriscila in `~/.openclaw/.env`.

## Come funziona

Grok usa risposte xAI basate sul web-grounding per sintetizzare risposte con citazioni
inline, in modo simile all'approccio di grounding di Google Search di Gemini.

## Parametri supportati

La ricerca Grok supporta `query`.

`count` viene accettato per compatibilità con `web_search` condiviso, ma Grok
restituisce comunque una sola risposta sintetizzata con citazioni invece di un elenco di N risultati.

I filtri specifici del provider non sono attualmente supportati.

## Correlati

- [Panoramica Web Search](/it/tools/web) -- tutti i provider e auto-rilevamento
- [x_search in Web Search](/it/tools/web#x_search) -- ricerca X di prima classe tramite xAI
- [Gemini Search](/it/tools/gemini-search) -- risposte sintetizzate dall'AI tramite Google grounding
