---
read_when:
    - |-
      Vuoi una singola chiave API per molti LLM@endsection to=final code```
      Vuoi una singola chiave API per molti LLM
      ```
    - Hai bisogno di indicazioni per la configurazione di Baidu Qianfan
summary: Usa l’API unificata di Qianfan per accedere a molti modelli in OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-04-24T08:58:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 727236394f6581f5bdb2f557092c31ff7904e4a80b06f8adc07a1c51dcfb2ff1
    source_path: providers/qianfan.md
    workflow: 15
---

Qianfan è la piattaforma MaaS di Baidu e fornisce una **API unificata** che instrada le richieste a molti modelli dietro un unico
endpoint e una singola chiave API. È OpenAI-compatible, quindi la maggior parte degli SDK OpenAI funziona cambiando il base URL.

| Proprietà | Valore                            |
| --------- | --------------------------------- |
| Provider  | `qianfan`                         |
| Auth      | `QIANFAN_API_KEY`                 |
| API       | OpenAI-compatible                 |
| Base URL  | `https://qianfan.baidubce.com/v2` |

## Per iniziare

<Steps>
  <Step title="Crea un account Baidu Cloud">
    Registrati oppure accedi alla [Console Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey) e assicurati di avere l’accesso API Qianfan abilitato.
  </Step>
  <Step title="Genera una chiave API">
    Crea una nuova applicazione oppure selezionane una esistente, quindi genera una chiave API. Il formato della chiave è `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Esegui l’onboarding">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="Verifica che il modello sia disponibile">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Catalogo integrato

| Riferimento modello                 | Input       | Contesto | Output max | Ragionamento | Note              |
| ----------------------------------- | ----------- | -------- | ---------- | ------------- | ----------------- |
| `qianfan/deepseek-v3.2`             | text        | 98,304   | 32,768     | Sì            | Modello predefinito |
| `qianfan/ernie-5.0-thinking-preview`| text, image | 119,000  | 64,000     | Sì            | Multimodale       |

<Tip>
Il riferimento modello incluso predefinito è `qianfan/deepseek-v3.2`. Devi sostituire `models.providers.qianfan` solo quando ti serve un base URL personalizzato o metadati del modello personalizzati.
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
  <Accordion title="Trasporto e compatibilità">
    Qianfan usa il percorso di trasporto OpenAI-compatible, non la formattazione nativa delle richieste OpenAI. Questo significa che le funzionalità standard degli SDK OpenAI funzionano, ma i parametri specifici del provider potrebbero non essere inoltrati.
  </Accordion>

  <Accordion title="Catalogo e override">
    Il catalogo incluso attualmente include `deepseek-v3.2` e `ernie-5.0-thinking-preview`. Aggiungi o sostituisci `models.providers.qianfan` solo quando ti serve un base URL personalizzato o metadati del modello personalizzati.

    <Note>
    I riferimenti dei modelli usano il prefisso `qianfan/` (per esempio `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Risoluzione dei problemi">
    - Assicurati che la tua chiave API inizi con `bce-v3/ALTAK-` e che l’accesso API Qianfan sia abilitato nella console Baidu Cloud.
    - Se i modelli non sono elencati, conferma che il tuo account abbia il servizio Qianfan attivato.
    - Il base URL predefinito è `https://qianfan.baidubce.com/v2`. Modificalo solo se usi un endpoint o un proxy personalizzato.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scegliere provider, riferimenti modello e comportamento di failover.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo della configurazione di OpenClaw.
  </Card>
  <Card title="Configurazione agente" href="/it/concepts/agent" icon="robot">
    Configurare i valori predefiniti dell’agente e le assegnazioni dei modelli.
  </Card>
  <Card title="Documentazione API Qianfan" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Documentazione ufficiale dell’API Qianfan.
  </Card>
</CardGroup>
