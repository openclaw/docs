---
read_when:
    - Vuoi usare Grok per `web_search`
    - Hai bisogno di un `XAI_API_KEY` per la ricerca web
summary: Ricerca web di Grok tramite risposte xAI basate sul web
title: Ricerca Grok
x-i18n:
    generated_at: "2026-04-05T14:06:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae2343012eebbe75d3ecdde3cb4470415c3275b694d0339bc26c46675a652054
    source_path: tools/grok-search.md
    workflow: 15
---

# Ricerca Grok

OpenClaw supporta Grok come provider `web_search`, usando risposte xAI basate sul web
per produrre risposte sintetizzate dall'IA supportate da risultati di ricerca in tempo reale
con citazioni.

Lo stesso `XAI_API_KEY` può anche alimentare lo strumento integrato `x_search` per la ricerca di post su X
(ex Twitter). Se memorizzi la chiave in
`plugins.entries.xai.config.webSearch.apiKey`, OpenClaw ora la riutilizza come
fallback anche per il provider di modelli xAI incluso.

Per metriche a livello di post su X come repost, risposte, segnalibri o visualizzazioni, preferisci
`x_search` con l'URL esatto del post o l'ID dello status invece di una query di ricerca
generica.

## Onboarding e configurazione

Se scegli **Grok** durante:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw può mostrare un passaggio di follow-up separato per abilitare `x_search` con lo stesso
`XAI_API_KEY`. Questo follow-up:

- appare solo dopo aver scelto Grok per `web_search`
- non è una scelta separata di primo livello per il provider di ricerca web
- può facoltativamente impostare il modello `x_search` durante lo stesso flusso

Se lo salti, puoi abilitare o modificare `x_search` più tardi nella configurazione.

## Ottieni una chiave API

<Steps>
  <Step title="Crea una chiave">
    Ottieni una chiave API da [xAI](https://console.x.ai/).
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
            apiKey: "xai-...", // optional if XAI_API_KEY is set
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

**Alternativa con variabile d'ambiente:** imposta `XAI_API_KEY` nell'ambiente del Gateway.
Per un'installazione del gateway, inseriscila in `~/.openclaw/.env`.

## Come funziona

Grok usa risposte xAI basate sul web per sintetizzare risposte con
citazioni inline, in modo simile all'approccio di grounding di Google Search di Gemini.

## Parametri supportati

La ricerca Grok supporta `query`.

`count` è accettato per compatibilità con `web_search` condiviso, ma Grok restituisce comunque
una risposta sintetizzata con citazioni invece di un elenco di N risultati.

I filtri specifici del provider non sono attualmente supportati.

## Correlati

- [Panoramica di Ricerca Web](/tools/web) -- tutti i provider e il rilevamento automatico
- [x_search in Ricerca Web](/tools/web#x_search) -- ricerca X di prima classe tramite xAI
- [Ricerca Gemini](/tools/gemini-search) -- risposte sintetizzate dall'IA tramite grounding Google
