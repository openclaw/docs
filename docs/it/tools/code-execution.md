---
read_when:
    - Vuoi abilitare o configurare code_execution
    - Vuoi l'analisi remota senza accesso alla shell locale
    - Vuoi combinare x_search o web_search con l'analisi Python remota
summary: 'code_execution: esegui analisi Python remota in sandbox con xAI'
title: Esecuzione del codice
x-i18n:
    generated_at: "2026-06-27T18:18:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d510d0d2b41deab527d456e675a23ef80ac3b55b5f01906ba2c43d90e4452e36
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` esegue analisi Python remote in sandbox sull'API Responses di xAI. È registrato dal Plugin `xai` incluso (nel contratto `tools`) e inoltra le richieste allo stesso endpoint `https://api.x.ai/v1/responses` usato da `x_search`.

| Proprietà          | Valore                                                                            |
| ------------------ | --------------------------------------------------------------------------------- |
| Nome strumento     | `code_execution`                                                                  |
| Plugin provider    | `xai` (incluso, `enabledByDefault: true`)                                         |
| Autenticazione     | profilo di autenticazione xAI, `XAI_API_KEY` o `plugins.entries.xai.config.webSearch.apiKey` |
| Modello predefinito | `grok-4-1-fast`                                                                  |
| Timeout predefinito | 30 secondi                                                                       |
| `maxTurns` predefinito | non impostato (xAI applica il proprio limite interno)                        |

Questo è diverso da [`exec`](/it/tools/exec) locale:

- `exec` esegue comandi shell sulla tua macchina o sul nodo associato.
- `code_execution` esegue Python nel sandbox remoto di xAI.

Usa `code_execution` per:

- Calcoli.
- Tabulazione.
- Statistiche rapide.
- Analisi in stile grafico.
- Analizzare dati restituiti da `x_search` o `web_search`.

**Non** usarlo quando ti servono file locali, la tua shell, il tuo repository o dispositivi associati. Usa [`exec`](/it/tools/exec) per quello.

## Configurazione

<Steps>
  <Step title="Fornisci credenziali xAI">
    Accedi con Grok OAuth usando un abbonamento SuperGrok o X Premium idoneo,
    oppure memorizza una chiave API. xAI OAuth usa la verifica con codice dispositivo,
    quindi funziona da host remoti senza callback localhost. OAuth funziona per
    `code_execution` e `x_search`; `XAI_API_KEY` o la configurazione web-search del Plugin
    possono anche alimentare Grok `web_search`.

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Durante una nuova installazione, le stesse opzioni di autenticazione sono disponibili
    nell'onboarding:

    ```bash
    openclaw onboard --install-daemon
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    Oppure usa una chiave API:

    ```bash
    openclaw models auth login --provider xai --method api-key
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
    `code_execution` è disponibile quando sono disponibili credenziali xAI. Imposta
    `plugins.entries.xai.config.codeExecution.enabled` su `false` per disabilitarlo,
    oppure usa lo stesso blocco per configurare modello e timeout.

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

  <Step title="Riavvia il Gateway">
    ```bash
    openclaw gateway restart
    ```

    `code_execution` compare nell'elenco degli strumenti dell'agente dopo che il Plugin xAI si registra di nuovo con `enabled: true`.

  </Step>
</Steps>

## Come usarlo

Chiedi in modo naturale e rendi esplicito l'intento dell'analisi:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

Lo strumento accetta internamente un singolo parametro `task`, quindi l'agente deve inviare la richiesta di analisi completa e gli eventuali dati inline in un unico prompt.

## Errori

Quando lo strumento viene eseguito senza autenticazione, restituisce un errore strutturato `missing_xai_api_key` che indica il profilo di autenticazione, la variabile d'ambiente e le opzioni di configurazione. L'errore è JSON, non un'eccezione lanciata, quindi l'agente può autocorreggersi:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Limiti

- Questa è esecuzione remota xAI, non esecuzione di processi locali.
- Tratta i risultati come analisi effimera, non come una sessione notebook persistente.
- Non presumere l'accesso a file locali o al tuo workspace.
- Per dati X aggiornati, usa prima [`x_search`](/it/tools/web#x_search) e passa il risultato a `code_execution`.

## Correlati

<CardGroup cols={2}>
  <Card title="Strumento Exec" href="/it/tools/exec" icon="terminal">
    Esecuzione shell locale sulla tua macchina o sul nodo associato.
  </Card>
  <Card title="Approvazioni Exec" href="/it/tools/exec-approvals" icon="shield">
    Criteri di consenso/rifiuto per l'esecuzione shell.
  </Card>
  <Card title="Strumenti Web" href="/it/tools/web" icon="globe">
    `web_search`, `x_search` e `web_fetch`.
  </Card>
  <Card title="Provider xAI" href="/it/providers/xai" icon="microchip">
    Modelli Grok, ricerca web/X e configurazione dell'esecuzione di codice.
  </Card>
</CardGroup>
