---
read_when:
    - Vuoi abilitare o configurare code_execution
    - Vuoi un'analisi remota senza accesso alla shell locale
    - Vuoi combinare x_search o web_search con l'analisi Python remota
summary: 'code_execution: esegui analisi Python remota in sandbox con xAI'
title: Esecuzione del codice
x-i18n:
    generated_at: "2026-05-06T09:11:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: a37e921c0016a32b01558c255bc05fcf24146f363a022da87feb94f3d6d48527
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` esegue analisi Python remote in sandbox sull'API Responses di xAI. Viene registrato dal Plugin `xai` incluso (sotto il contratto `tools`) e inoltra le richieste allo stesso endpoint `https://api.x.ai/v1/responses` usato da `x_search`.

| Proprietà           | Valore                                                         |
| ------------------ | -------------------------------------------------------------- |
| Nome dello strumento | `code_execution`                                               |
| Plugin provider    | `xai` (incluso, `enabledByDefault: true`)                      |
| Autenticazione      | `XAI_API_KEY` o `plugins.entries.xai.config.webSearch.apiKey` |
| Modello predefinito | `grok-4-1-fast`                                                |
| Timeout predefinito | 30 secondi                                                     |
| `maxTurns` predefinito | non impostato (xAI applica il proprio limite interno)       |

Questo è diverso da [`exec`](/it/tools/exec) locale:

- `exec` esegue comandi shell sulla tua macchina o sul Node associato.
- `code_execution` esegue Python nel sandbox remoto di xAI.

Usa `code_execution` per:

- Calcoli.
- Tabulazioni.
- Statistiche rapide.
- Analisi in stile grafico.
- Analizzare dati restituiti da `x_search` o `web_search`.

**Non** usarlo quando hai bisogno di file locali, della tua shell, del tuo repository o di dispositivi associati. Usa [`exec`](/it/tools/exec) per quello.

## Configurazione

<Steps>
  <Step title="Provide an xAI API key">
    Imposta `XAI_API_KEY` nell'ambiente del Gateway, oppure configura la chiave sotto il Plugin xAI in modo che la stessa credenziale copra `code_execution`, `x_search`, ricerca web e altri strumenti xAI:

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

  <Step title="Enable and tune code_execution">
    Lo strumento è regolato da `plugins.entries.xai.config.codeExecution.enabled`. Il valore predefinito è disattivato.

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast", // override the default xAI code-execution model
                maxTurns: 2,            // optional cap on internal tool turns
                timeoutSeconds: 30,     // request timeout (default: 30)
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    `code_execution` compare nell'elenco degli strumenti dell'agente dopo che il Plugin xAI si registra nuovamente con `enabled: true`.

  </Step>
</Steps>

## Come usarlo

Chiedi in modo naturale ed esplicita l'intento dell'analisi:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

Lo strumento accetta internamente un solo parametro `task`, quindi l'agente deve inviare la richiesta di analisi completa e tutti i dati inline in un unico prompt.

## Errori

Quando lo strumento viene eseguito senza autenticazione, restituisce un errore strutturato `missing_xai_api_key` che indica la variabile d'ambiente e il percorso di configurazione. L'errore è JSON, non un'eccezione lanciata, quindi l'agente può autocorreggersi:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs an xAI API key. Set XAI_API_KEY in the Gateway environment, or configure plugins.entries.xai.config.webSearch.apiKey.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Limiti

- Questa è esecuzione remota xAI, non esecuzione di processi locali.
- Tratta i risultati come analisi effimera, non come una sessione notebook persistente.
- Non presumere l'accesso ai file locali o al tuo workspace.
- Per dati X aggiornati, usa prima [`x_search`](/it/tools/web#x_search) e passa il risultato a `code_execution`.

## Correlati

<CardGroup cols={2}>
  <Card title="Exec tool" href="/it/tools/exec" icon="terminal">
    Esecuzione shell locale sulla tua macchina o sul Node associato.
  </Card>
  <Card title="Exec approvals" href="/it/tools/exec-approvals" icon="shield">
    Criterio di autorizzazione/rifiuto per l'esecuzione shell.
  </Card>
  <Card title="Web tools" href="/it/tools/web" icon="globe">
    `web_search`, `x_search` e `web_fetch`.
  </Card>
  <Card title="xAI provider" href="/it/providers/xai" icon="microchip">
    Modelli Grok, ricerca web/X e configurazione dell'esecuzione codice.
  </Card>
</CardGroup>
