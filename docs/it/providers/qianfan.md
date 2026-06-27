---
read_when:
    - Vuoi una singola chiave API per molti LLM
    - Ti serve una guida alla configurazione di Baidu Qianfan
summary: Usa l'API unificata di Qianfan per accedere a molti modelli in OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-06-27T18:09:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8bc31970dc7fbc43819ec6d51f4bd0047b1acc5a03b23b656e617e3abd97475
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan è la piattaforma MaaS di Baidu, che fornisce un'**API unificata** che instrada le richieste a molti modelli dietro un singolo
endpoint e una chiave API. È compatibile con OpenAI, quindi la maggior parte degli SDK OpenAI funziona cambiando l'URL di base.

| Proprietà | Valore                            |
| -------- | --------------------------------- |
| Provider | `qianfan`                         |
| Autenticazione | `QIANFAN_API_KEY`          |
| API      | Compatibile con OpenAI            |
| URL di base | `https://qianfan.baidubce.com/v2` |

## Installa il plugin

Installa il plugin ufficiale, quindi riavvia Gateway:

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## Per iniziare

<Steps>
  <Step title="Create a Baidu Cloud account">
    Registrati o accedi alla [Console Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey) e assicurati di avere l'accesso all'API Qianfan abilitato.
  </Step>
  <Step title="Generate an API key">
    Crea una nuova applicazione o selezionane una esistente, quindi genera una chiave API. Il formato della chiave è `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Catalogo integrato

| Rif. modello                         | Input       | Contesto | Output massimo | Reasoning | Note          |
| ------------------------------------ | ----------- | ------- | ---------- | --------- | ------------- |
| `qianfan/deepseek-v3.2`              | testo       | 98,304  | 32,768     | Sì        | Modello predefinito |
| `qianfan/ernie-5.0-thinking-preview` | testo, immagine | 119,000 | 64,000     | Sì        | Multimodale   |

<Tip>
Il riferimento del modello predefinito è `qianfan/deepseek-v3.2`. Devi sovrascrivere `models.providers.qianfan` solo quando ti serve un URL di base personalizzato o metadati del modello personalizzati.
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

<AccordionGroup>
  <Accordion title="Transport and compatibility">
    Qianfan viene eseguito tramite il percorso di trasporto compatibile con OpenAI, non tramite la modellazione nativa delle richieste OpenAI. Questo significa che le funzionalità standard degli SDK OpenAI funzionano, ma i parametri specifici del provider potrebbero non essere inoltrati.
  </Accordion>

  <Accordion title="Catalog and overrides">
    Il catalogo statico attualmente include `deepseek-v3.2` e `ernie-5.0-thinking-preview`. Aggiungi o sovrascrivi `models.providers.qianfan` solo quando ti serve un URL di base personalizzato o metadati del modello personalizzati.

    <Note>
    I riferimenti dei modelli usano il prefisso `qianfan/` (ad esempio `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - Assicurati che la tua chiave API inizi con `bce-v3/ALTAK-` e che l'accesso all'API Qianfan sia abilitato nella console Baidu Cloud.
    - Se i modelli non sono elencati, verifica che il servizio Qianfan sia attivato sul tuo account.
    - L'URL di base predefinito è `https://qianfan.baidubce.com/v2`. Modificalo solo se usi un endpoint o un proxy personalizzato.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Model selection" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti dei modelli e del comportamento di failover.
  </Card>
  <Card title="Configuration reference" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo alla configurazione di OpenClaw.
  </Card>
  <Card title="Agent setup" href="/it/concepts/agent" icon="robot">
    Configurazione dei valori predefiniti degli agenti e delle assegnazioni dei modelli.
  </Card>
  <Card title="Qianfan API docs" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Documentazione ufficiale dell'API Qianfan.
  </Card>
</CardGroup>
