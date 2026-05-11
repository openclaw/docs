---
read_when:
    - Vuoi abilitare o configurare code_execution
    - Vuoi un'analisi remota senza accesso alla shell locale
    - Vuoi combinare x_search o web_search con l'analisi Python remota
summary: 'code_execution: esegui analisi Python remota in sandbox con xAI'
title: Esecuzione di codice
x-i18n:
    generated_at: "2026-05-11T20:37:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76be496e459fac9c7f6b0324cceb884d3a693fd72d7541094d1bb64a4f1b7b8b
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` esegue analisi Python remote in sandbox sull'API Responses di xAI. È registrato dal plugin `xai` in bundle (sotto il contratto `tools`) e inoltra le richieste allo stesso endpoint `https://api.x.ai/v1/responses` usato da `x_search`.

| Proprietà          | Valore                                                                            |
| ------------------ | --------------------------------------------------------------------------------- |
| Nome dello strumento | `code_execution`                                                                |
| Plugin del provider | `xai` (in bundle, `enabledByDefault: true`)                                      |
| Autenticazione     | profilo di autenticazione xAI, `XAI_API_KEY`, o `plugins.entries.xai.config.webSearch.apiKey` |
| Modello predefinito | `grok-4-1-fast`                                                                 |
| Timeout predefinito | 30 secondi                                                                       |
| `maxTurns` predefinito | non impostato (xAI applica il proprio limite interno)                         |

È diverso da [`exec`](/it/tools/exec) locale:

- `exec` esegue comandi shell sulla tua macchina o sul node associato.
- `code_execution` esegue Python nel sandbox remoto di xAI.

Usa `code_execution` per:

- Calcoli.
- Tabulazione.
- Statistiche rapide.
- Analisi in stile grafico.
- Analizzare dati restituiti da `x_search` o `web_search`.

**Non** usarlo quando hai bisogno di file locali, della tua shell, del tuo repo o di dispositivi associati. Usa [`exec`](/it/tools/exec) per quello.

## Configurazione

<Steps>
  <Step title="Fornisci una chiave API xAI">
    Esegui `openclaw onboard --auth-choice xai-api-key` per `code_execution` e
    `x_search`, oppure imposta `XAI_API_KEY` / configura la chiave sotto il plugin xAI
    quando vuoi anche che la ricerca web Grok usi la stessa credenziale:

    ```bash
    export XAI_API_KEY=xai-...
    ```

    Oppure tramite configurazione:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              webSearch: {
                apiKey: "xai-...",
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Abilita e configura code_execution">
    Lo strumento è controllato da `plugins.entries.xai.config.codeExecution.enabled`. Il valore predefinito è disattivato.

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast", // sovrascrive il modello di esecuzione codice xAI predefinito
                maxTurns: 2,            // limite opzionale sui turni interni dello strumento
                timeoutSeconds: 30,     // timeout della richiesta (predefinito: 30)
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Riavvia il Gateway">
    ```bash
    openclaw gateway restart
    ```

    `code_execution` compare nell'elenco degli strumenti dell'agente dopo che il plugin xAI si registra di nuovo con `enabled: true`.

  </Step>
</Steps>

## Come usarlo

Chiedi in modo naturale e rendi esplicito l'obiettivo dell'analisi:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

Lo strumento accetta internamente un singolo parametro `task`, quindi l'agente deve inviare la richiesta di analisi completa e tutti i dati inline in un unico prompt.

## Errori

Quando lo strumento viene eseguito senza autenticazione, restituisce un errore strutturato `missing_xai_api_key` che punta al profilo di autenticazione, alla variabile di ambiente e alle opzioni di configurazione. L'errore è JSON, non un'eccezione generata, quindi l'agente può correggersi autonomamente:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs an xAI API key. Run openclaw onboard --auth-choice xai-api-key, set XAI_API_KEY in the Gateway environment, or configure plugins.entries.xai.config.webSearch.apiKey.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Limiti

- Questa è esecuzione remota xAI, non esecuzione di processi locali.
- Considera i risultati come analisi effimera, non come una sessione notebook persistente.
- Non presumere l'accesso a file locali o al tuo workspace.
- Per dati X aggiornati, usa prima [`x_search`](/it/tools/web#x_search) e passa il risultato a `code_execution`.

## Correlati

<CardGroup cols={2}>
  <Card title="Strumento exec" href="/it/tools/exec" icon="terminal">
    Esecuzione shell locale sulla tua macchina o sul node associato.
  </Card>
  <Card title="Approvazioni exec" href="/it/tools/exec-approvals" icon="shield">
    Criterio di autorizzazione/rifiuto per l'esecuzione shell.
  </Card>
  <Card title="Strumenti web" href="/it/tools/web" icon="globe">
    `web_search`, `x_search` e `web_fetch`.
  </Card>
  <Card title="Provider xAI" href="/it/providers/xai" icon="microchip">
    Modelli Grok, ricerca web/X e configurazione di esecuzione codice.
  </Card>
</CardGroup>
