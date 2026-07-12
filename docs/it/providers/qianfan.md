---
read_when:
    - Vuoi un'unica chiave API per molti LLM
    - Hai bisogno di indicazioni per la configurazione di Baidu Qianfan
summary: Usa l'API unificata di Qianfan per accedere a numerosi modelli in OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-07-12T07:26:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31387a53ee4472e2d20ae939ea75cea0d6f6367501becd56a8654fd97fdf0804
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan è la piattaforma MaaS di Baidu: un'API unificata e compatibile con OpenAI che instrada le richieste a numerosi modelli tramite un unico endpoint e una sola chiave API. OpenClaw la distribuisce come Plugin esterno ufficiale `@openclaw/qianfan-provider`.

| Proprietà          | Valore                                   |
| ------------------ | ---------------------------------------- |
| Provider           | `qianfan`                                |
| Autenticazione     | `QIANFAN_API_KEY`                        |
| API                | Compatibile con OpenAI (`openai-completions`) |
| URL di base        | `https://qianfan.baidubce.com/v2`        |
| Modello predefinito | `qianfan/deepseek-v3.2`                 |

## Installare il Plugin

Installa il Plugin ufficiale, quindi riavvia il Gateway:

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## Guida introduttiva

<Steps>
  <Step title="Creare un account Baidu Cloud">
    Registrati o accedi alla [console Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey) e assicurati che l'accesso all'API Qianfan sia abilitato.
  </Step>
  <Step title="Generare una chiave API">
    Crea una nuova applicazione o selezionane una esistente, quindi genera una chiave API. Le chiavi Baidu Cloud utilizzano il formato `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Eseguire la configurazione iniziale">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```

    Le esecuzioni non interattive leggono la chiave da `--qianfan-api-key <key>` o
    `QIANFAN_API_KEY`. La configurazione iniziale scrive la configurazione del provider, aggiunge
    l'alias `QIANFAN` per il modello predefinito e imposta `qianfan/deepseek-v3.2`
    come modello predefinito quando non ne è configurato alcuno.

  </Step>
  <Step title="Verificare che il modello sia disponibile">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Catalogo integrato

| Riferimento del modello              | Input             | Contesto | Output massimo | Ragionamento | Note                  |
| ------------------------------------ | ----------------- | -------- | -------------- | ------------- | --------------------- |
| `qianfan/deepseek-v3.2`              | testo             | 98,304   | 32,768         | Sì            | Modello predefinito   |
| `qianfan/ernie-5.0-thinking-preview` | testo, immagine   | 119,000  | 64,000         | Sì            | Multimodale           |

Il catalogo è statico; non è disponibile il rilevamento dei modelli in tempo reale.

<Tip>
Devi sovrascrivere `models.providers.qianfan` solo se ti occorrono un URL di base personalizzato o metadati del modello personalizzati.
</Tip>

## Esempio di configurazione

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

<Note>
I riferimenti dei modelli utilizzano il prefisso `qianfan/` (ad esempio `qianfan/deepseek-v3.2`).
</Note>

<AccordionGroup>
  <Accordion title="Trasporto e compatibilità">
    Qianfan utilizza il percorso di trasporto compatibile con OpenAI, non la struttura nativa delle richieste OpenAI. Le funzionalità standard dell'SDK OpenAI sono supportate, ma i parametri specifici del provider potrebbero non essere inoltrati.
  </Accordion>

  <Accordion title="Risoluzione dei problemi">
    - Assicurati che la chiave API inizi con `bce-v3/ALTAK-` e che l'accesso all'API Qianfan sia abilitato nella console Baidu Cloud.
    - Se i modelli non sono elencati, verifica che il servizio Qianfan sia attivato per il tuo account.
    - Modifica l'URL di base solo se utilizzi un endpoint personalizzato o un proxy.

  </Accordion>
</AccordionGroup>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti dei modelli e del comportamento di failover.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo della configurazione di OpenClaw.
  </Card>
  <Card title="Configurazione dell'agente" href="/it/concepts/agent" icon="robot">
    Configurazione delle impostazioni predefinite degli agenti e delle assegnazioni dei modelli.
  </Card>
  <Card title="Documentazione dell'API Qianfan" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Documentazione ufficiale dell'API Qianfan.
  </Card>
</CardGroup>
