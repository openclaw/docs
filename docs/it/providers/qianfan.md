---
read_when:
    - Vuoi un’unica chiave API per molti LLM
    - Ti serve una guida alla configurazione di Baidu Qianfan
summary: Usa l'API unificata di Qianfan per accedere a molti modelli in OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-04-30T09:09:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6adfbad6c18bf2bcf93d9c56c51591c862ebb751ffd8183015fa2fc9566ce0af
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan è la piattaforma MaaS di Baidu, che fornisce una **API unificata** che instrada le richieste a molti modelli dietro un unico
endpoint e una chiave API. È compatibile con OpenAI, quindi la maggior parte degli SDK OpenAI funziona cambiando l’URL di base.

| Proprietà | Valore                            |
| -------- | --------------------------------- |
| Provider | `qianfan`                         |
| Autenticazione | `QIANFAN_API_KEY`                 |
| API      | Compatibile con OpenAI                 |
| URL di base | `https://qianfan.baidubce.com/v2` |

## Per iniziare

<Steps>
  <Step title="Crea un account Baidu Cloud">
    Registrati o accedi alla [Console Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey) e assicurati di avere l’accesso all’API Qianfan abilitato.
  </Step>
  <Step title="Genera una chiave API">
    Crea una nuova applicazione o selezionane una esistente, quindi genera una chiave API. Il formato della chiave è `bce-v3/ALTAK-...`.
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

| Riferimento modello                  | Input       | Contesto | Output massimo | Ragionamento | Note          |
| ------------------------------------ | ----------- | ------- | ---------- | --------- | ------------- |
| `qianfan/deepseek-v3.2`              | testo       | 98,304  | 32,768     | Sì        | Modello predefinito |
| `qianfan/ernie-5.0-thinking-preview` | testo, immagine | 119,000 | 64,000     | Sì        | Multimodale   |

<Tip>
Il riferimento del modello integrato predefinito è `qianfan/deepseek-v3.2`. Devi sovrascrivere `models.providers.qianfan` solo quando ti serve un URL di base personalizzato o metadati del modello.
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
    Qianfan viene eseguito tramite il percorso di trasporto compatibile con OpenAI, non tramite la formattazione nativa delle richieste OpenAI. Ciò significa che le funzionalità standard degli SDK OpenAI funzionano, ma i parametri specifici del provider potrebbero non essere inoltrati.
  </Accordion>

  <Accordion title="Catalogo e sovrascritture">
    Il catalogo integrato include attualmente `deepseek-v3.2` e `ernie-5.0-thinking-preview`. Aggiungi o sovrascrivi `models.providers.qianfan` solo quando ti serve un URL di base personalizzato o metadati del modello.

    <Note>
    I riferimenti dei modelli usano il prefisso `qianfan/` (per esempio `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Risoluzione dei problemi">
    - Assicurati che la tua chiave API inizi con `bce-v3/ALTAK-` e che abbia l’accesso all’API Qianfan abilitato nella console Baidu Cloud.
    - Se i modelli non sono elencati, verifica che il servizio Qianfan sia attivato per il tuo account.
    - L’URL di base predefinito è `https://qianfan.baidubce.com/v2`. Modificalo solo se usi un endpoint personalizzato o un proxy.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti dei modelli e comportamento di failover.
  </Card>
  <Card title="Riferimento di configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo della configurazione di OpenClaw.
  </Card>
  <Card title="Configurazione dell’agente" href="/it/concepts/agent" icon="robot">
    Configurazione dei valori predefiniti degli agenti e delle assegnazioni dei modelli.
  </Card>
  <Card title="Documentazione dell’API Qianfan" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Documentazione ufficiale dell’API Qianfan.
  </Card>
</CardGroup>
