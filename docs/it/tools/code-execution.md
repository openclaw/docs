---
read_when:
    - Vuoi abilitare o configurare code_execution
    - Vuoi eseguire l'analisi da remoto senza accesso alla shell locale
    - Vuoi combinare x_search o web_search con l'analisi Python remota
summary: 'code_execution: esegui analisi Python remota in ambiente sandbox con xAI'
title: Esecuzione del codice
x-i18n:
    generated_at: "2026-07-12T07:36:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ab391daed9154f113535e6d241c45d5c08c22abdc012148a9f0f2ae5ec548b3
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` esegue analisi Python remote in sandbox tramite l'API Responses di xAI
(`https://api.x.ai/v1/responses`, lo stesso endpoint usato da `x_search`). Viene
registrato dal plugin `xai` incluso tramite il contratto `tools`.

<Warning>
  `code_execution` viene eseguito sui server di xAI. xAI addebita 5 USD ogni 1.000 chiamate allo strumento,
  oltre ai token di input e output del modello.
</Warning>

| Proprietà          | Valore                                                                            |
| ------------------ | --------------------------------------------------------------------------------- |
| Nome dello strumento | `code_execution`                                                                |
| Plugin del provider | `xai` (incluso, `enabledByDefault: true`)                                        |
| Autenticazione     | Profilo di autenticazione xAI, `XAI_API_KEY` o `plugins.entries.xai.config.webSearch.apiKey` |
| Modello predefinito | `grok-4.3`                                                                       |
| Timeout predefinito | 30 secondi                                                                       |
| `maxTurns` predefinito | non impostato (xAI applica il proprio limite interno)                         |

Usalo per calcoli, tabulazioni, statistiche rapide e analisi in stile grafico,
inclusi i dati restituiti da `x_search` o `web_search`. Non ha accesso ai file
locali, alla shell, al repository o ai dispositivi associati e non mantiene lo
stato tra le chiamate; considera quindi ogni chiamata un'analisi temporanea,
non una sessione di notebook. Per dati X aggiornati, esegui prima
[`x_search`](/it/tools/web#x_search) e passa il risultato come input.

Per l'esecuzione locale, usa invece [`exec`](/it/tools/exec).

## Configurazione

<Steps>
  <Step title="Fornisci le credenziali xAI">
    OAuth richiede un abbonamento SuperGrok o X Premium idoneo
    (con verifica tramite codice del dispositivo, quindi funziona da host remoti
    senza callback su localhost):

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Durante una nuova installazione, la stessa scelta è disponibile nella configurazione iniziale:

    ```bash
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

    Ognuno di questi tre metodi abilita anche `x_search` e `web_search` di Grok.

  </Step>

  <Step title="Abilita e configura code_execution">
    Se `enabled` viene omesso, `code_execution` è disponibile solo quando il
    provider del modello attivo è `xai` e le credenziali xAI vengono risolte.
    Per un modello attivo con un provider noto diverso da xAI, imposta
    `plugins.entries.xai.config.codeExecution.enabled` su `true` per abilitare
    esplicitamente l'uso tra provider. Se il provider del modello attivo è
    mancante o non risolto, lo strumento rimane nascosto. Imposta `enabled` su
    `false` per disabilitarlo per tutti i provider. Le credenziali xAI sono
    sempre obbligatorie.

    Usa lo stesso blocco per sostituire il modello, il limite di turni o il timeout:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true, // obbligatorio per un provider di modello noto diverso da xAI
                model: "grok-4.3", // sostituisce il modello predefinito di xAI per l'esecuzione del codice
                maxTurns: 2,            // limite facoltativo dei turni interni dello strumento
                timeoutSeconds: 30,     // timeout della richiesta (valore predefinito: 30)
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

    `code_execution` compare nell'elenco degli strumenti dell'agente quando il
    plugin xAI viene registrato nuovamente e i controlli precedenti relativi a
    provider, abilitazione e autenticazione vengono superati.

  </Step>
</Steps>

## Come usarlo

Rendi esplicito lo scopo dell'analisi; lo strumento accetta un unico parametro
`task`, quindi invia la richiesta completa e tutti i dati incorporati in un solo prompt:

```text
Usa code_execution per calcolare la media mobile a 7 giorni per questi numeri: ...
```

```text
Usa x_search per trovare i post che menzionano OpenClaw questa settimana, quindi usa code_execution per contarli per giorno.
```

```text
Usa web_search per raccogliere i dati più recenti dei benchmark di IA, quindi usa code_execution per confrontare le variazioni percentuali.
```

## Errori

Senza autenticazione, lo strumento restituisce un errore JSON strutturato
(non un'eccezione generata), consentendo all'agente di correggersi autonomamente:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution richiede le credenziali xAI. Esegui `openclaw onboard --auth-choice xai-oauth` per accedere con Grok, esegui `openclaw onboard --auth-choice xai-api-key`, imposta `XAI_API_KEY` nell'ambiente del Gateway oppure configura `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Strumento Exec" href="/it/tools/exec" icon="terminal">
    Esecuzione locale della shell sul computer o sul nodo associato.
  </Card>
  <Card title="Approvazioni Exec" href="/it/tools/exec-approvals" icon="shield">
    Criteri di autorizzazione o rifiuto per l'esecuzione della shell.
  </Card>
  <Card title="Strumenti web" href="/it/tools/web" icon="globe">
    `web_search`, `x_search` e `web_fetch`.
  </Card>
  <Card title="Provider xAI" href="/it/providers/xai" icon="microchip">
    Modelli Grok, ricerca web/X e configurazione dell'esecuzione del codice.
  </Card>
</CardGroup>
