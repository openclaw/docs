---
read_when:
    - Vuoi utilizzare Grok per web_search
    - Vuoi usare OAuth di xAI o una XAI_API_KEY per la ricerca sul web
summary: Ricerca web di Grok tramite risposte di xAI basate sul web
title: Ricerca Grok
x-i18n:
    generated_at: "2026-07-12T07:37:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e39edd660d0ffe8be066ae81317810da691a7dbd8c59a74222a59145cff5c77
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw supporta Grok come provider di `web_search`, utilizzando risposte xAI basate sul web per produrre risposte sintetizzate dall'IA, supportate da risultati di ricerca in tempo reale con citazioni.

La ricerca web di Grok preferisce un accesso OAuth xAI esistente, quando disponibile. Se non esiste alcun profilo OAuth, la stessa chiave API xAI alimenta anche lo strumento integrato `x_search` per la ricerca di post su X (in precedenza Twitter) e lo strumento `code_execution`. Archiviare la chiave in `plugins.entries.xai.config.webSearch.apiKey` consente inoltre a OpenClaw di riutilizzarla come opzione di riserva per il provider di modelli xAI incluso.

Per le metriche X a livello di singolo post (ripubblicazioni, risposte, segnalibri, visualizzazioni), usa [`x_search`](/it/tools/web#x_search) con l'URL esatto del post o l'ID dello stato, anziché una query di ricerca generica.

## Onboarding e configurazione

Scegliendo **Grok** durante `openclaw onboard` o `openclaw configure --section
web`, OpenClaw può riutilizzare un profilo OAuth xAI esistente senza richiedere una chiave separata per la ricerca web. In assenza di OAuth, passa alla configurazione tramite chiave API xAI.

OpenClaw propone quindi un passaggio successivo per abilitare `x_search` con la stessa credenziale xAI. Questo passaggio:

- viene visualizzato solo dopo aver scelto Grok per `web_search`
- non costituisce una scelta separata di provider di ricerca web di primo livello
- può facoltativamente impostare il modello `x_search` nello stesso flusso

Saltalo per abilitare o modificare `x_search` successivamente nella configurazione.

## Accedere o ottenere una chiave API

<Steps>
  <Step title="Usare OAuth xAI">
    Se hai già effettuato l'accesso con xAI durante l'onboarding o l'autenticazione del modello, scegli Grok come provider di `web_search`. Non è richiesta alcuna chiave API separata:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="Usare una chiave API come opzione di riserva">
    Ottieni una chiave API da [xAI](https://console.x.ai/) quando OAuth non è disponibile o desideri intenzionalmente una configurazione della ricerca web basata su chiave.
  </Step>
  <Step title="Archiviare la chiave">
    Imposta `XAI_API_KEY` nell'ambiente del Gateway oppure esegui la configurazione tramite:

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
            apiKey: "xai-...", // facoltativa se sono disponibili OAuth xAI o XAI_API_KEY
            baseUrl: "https://api.x.ai/v1", // sostituzione facoltativa del proxy o dell'URL di base dell'API Responses
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

**Credenziali alternative:** `openclaw models auth login --provider xai
--method oauth`, `XAI_API_KEY` nell'ambiente del Gateway oppure
`plugins.entries.xai.config.webSearch.apiKey`. Per un'installazione del Gateway, inserisci le variabili d'ambiente in `~/.openclaw/.env`.

## Come funziona

Grok utilizza risposte xAI basate sul web per sintetizzare risposte con citazioni in linea, in modo simile all'approccio di Gemini basato su Google Search.

## Parametri supportati

La ricerca Grok supporta `query`. `count` è accettato per la compatibilità con `web_search` condivisa, ma Grok restituisce sempre una singola risposta sintetizzata con citazioni anziché un elenco di N risultati. I filtri specifici del provider non sono supportati.

Grok utilizza per impostazione predefinita un timeout di 60 secondi, perché le ricerche xAI basate sul web tramite Responses possono richiedere più tempo rispetto al valore predefinito condiviso di `web_search`. Puoi sostituirlo con `tools.web.search.timeoutSeconds`.

## Sostituzioni dell'URL di base

Imposta `plugins.entries.xai.config.webSearch.baseUrl` per instradare la ricerca web di Grok attraverso un proxy dell'operatore o un endpoint Responses compatibile con xAI. OpenClaw invia richieste POST a `<baseUrl>/responses` dopo aver rimosso le barre finali. `x_search` utilizza come opzione di riserva lo stesso `webSearch.baseUrl`, a meno che non sia impostato `plugins.entries.xai.config.xSearch.baseUrl`.

## Contenuti correlati

- [Panoramica della ricerca web](/it/tools/web) -- tutti i provider e il rilevamento automatico
- [x_search nella ricerca web](/it/tools/web#x_search) -- ricerca X nativa tramite xAI
- [Ricerca Gemini](/it/tools/gemini-search) -- risposte sintetizzate dall'IA tramite Google grounding
