---
read_when:
    - Vuoi usare Grok per web_search
    - Vuoi usare xAI OAuth o una XAI_API_KEY per la ricerca web
summary: Ricerca web Grok tramite risposte xAI basate sul web
title: Ricerca Grok
x-i18n:
    generated_at: "2026-06-27T18:20:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d18866f12648c5c194112633f6e888711cab83628dcc06ac58cb7801841a73b
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw supporta Grok come provider `web_search`, usando risposte xAI basate sul web
per produrre risposte sintetizzate dall'AI supportate da risultati di ricerca live
con citazioni.

La ricerca web di Grok preferisce il tuo accesso OAuth xAI esistente quando è disponibile.
Se non esiste alcun profilo OAuth, la stessa chiave API xAI può anche alimentare lo strumento
`x_search` integrato per la ricerca di post su X (precedentemente Twitter) e lo strumento `code_execution`.
Se archivi la chiave in `plugins.entries.xai.config.webSearch.apiKey`,
OpenClaw la riutilizza anche come fallback per il provider di modelli xAI incluso.

Per metriche a livello di post X come repost, risposte, segnalibri o visualizzazioni, preferisci
`x_search` con l'URL esatto del post o l'ID di stato invece di una query di ricerca
generica.

## Onboarding e configurazione

Se scegli **Grok** durante:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw può usare un profilo OAuth xAI esistente senza richiedere una chiave
di ricerca web separata. Se OAuth non è disponibile, passa alla configurazione con chiave API xAI.
OpenClaw può anche mostrare un passaggio successivo separato per abilitare `x_search` con la
stessa credenziale xAI. Questo passaggio successivo:

- appare solo dopo che hai scelto Grok per `web_search`
- non è una scelta separata di provider di ricerca web di primo livello
- può facoltativamente impostare il modello `x_search` durante lo stesso flusso

Se lo salti, puoi abilitare o modificare `x_search` più tardi nella configurazione.

## Accedi o ottieni una chiave API

<Steps>
  <Step title="Usa OAuth xAI">
    Se hai già effettuato l'accesso con xAI durante l'onboarding o l'autenticazione del modello, scegli
    Grok come provider `web_search`. Non è richiesta alcuna chiave API separata:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="Usa un fallback con chiave API">
    Ottieni una chiave API da [xAI](https://console.x.ai/) quando OAuth non è disponibile
    o vuoi intenzionalmente una configurazione di ricerca web basata su chiave.
  </Step>
  <Step title="Archivia la chiave">
    Imposta `XAI_API_KEY` nell'ambiente Gateway, oppure configura tramite:

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
            apiKey: "xai-...", // optional if xAI OAuth or XAI_API_KEY is available
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

**Alternative per le credenziali:** accedi con `openclaw models auth login
--provider xai --method oauth`, imposta `XAI_API_KEY` nell'ambiente Gateway,
oppure archivia `plugins.entries.xai.config.webSearch.apiKey`. Per un'installazione Gateway,
inserisci le variabili d'ambiente in `~/.openclaw/.env`.

## Come funziona

Grok usa risposte xAI basate sul web per sintetizzare risposte con citazioni
inline, in modo simile all'approccio di grounding di Ricerca Google di Gemini.

## Parametri supportati

La ricerca Grok supporta `query`.

`count` è accettato per la compatibilità condivisa di `web_search`, ma Grok restituisce comunque
una singola risposta sintetizzata con citazioni anziché un elenco di N risultati.

I filtri specifici del provider non sono attualmente supportati.

Grok usa un timeout predefinito specifico del provider di 60 secondi perché le ricerche
xAI Responses basate sul web possono durare più a lungo del valore predefinito condiviso di `web_search`. Imposta
`tools.web.search.timeoutSeconds` per sovrascriverlo.

## Override dell'URL base

Imposta `plugins.entries.xai.config.webSearch.baseUrl` quando la ricerca web Grok deve
passare attraverso un proxy dell'operatore o un endpoint Responses compatibile con xAI. OpenClaw
invia richieste POST a `<baseUrl>/responses` dopo aver rimosso le barre finali. `x_search`
usa lo stesso fallback `webSearch.baseUrl` a meno che
`plugins.entries.xai.config.xSearch.baseUrl` non sia impostato.

## Correlati

- [Panoramica di Web Search](/it/tools/web) -- tutti i provider e il rilevamento automatico
- [x_search in Web Search](/it/tools/web#x_search) -- ricerca X di prima classe tramite xAI
- [Ricerca Gemini](/it/tools/gemini-search) -- risposte sintetizzate dall'AI tramite grounding di Google
