---
read_when:
    - Vuoi usare Chutes con OpenClaw
    - È necessario il percorso di configurazione OAuth o della chiave API
    - Vuoi il modello predefinito, gli alias o il comportamento di rilevamento
summary: Configurazione di Chutes (OAuth o chiave API, rilevamento dei modelli, alias)
title: Chutes
x-i18n:
    generated_at: "2026-07-12T07:24:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dafa96c4a56b9d38d033b87cc077d359cb71adaf1ca41a0ab6b6cc77b66484a7
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) espone cataloghi di modelli open source tramite un'API
compatibile con OpenAI. OpenClaw supporta sia OAuth tramite browser sia l'autenticazione con chiave API.

| Proprietà             | Valore                                                  |
| --------------------- | ------------------------------------------------------- |
| Provider              | `chutes`                                                |
| Plugin                | pacchetto esterno ufficiale (`@openclaw/chutes-provider`) |
| API                   | compatibile con OpenAI                                  |
| URL di base           | `https://llm.chutes.ai/v1`                              |
| Autenticazione        | OAuth o chiave API (vedere sotto)                       |
| Variabili di ambiente | `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`                  |

`CHUTES_OAUTH_TOKEN` fornisce direttamente un token di accesso OAuth già ottenuto
(ad esempio nella CI), evitando il flusso interattivo tramite browser descritto di seguito.

## Installare il Plugin

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## Introduzione

Entrambi i percorsi impostano il modello predefinito su `chutes/zai-org/GLM-4.7-TEE` e registrano
il catalogo Chutes.

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Eseguire il flusso di configurazione iniziale OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw avvia localmente il flusso tramite browser oppure, sugli host remoti o senza interfaccia grafica,
        mostra un URL e richiede di incollare il reindirizzamento. I token OAuth vengono aggiornati automaticamente
        tramite i profili di autenticazione di OpenClaw.
      </Step>
    </Steps>
  </Tab>
  <Tab title="Chiave API">
    <Steps>
      <Step title="Ottenere una chiave API">
        Creare una chiave in
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="Eseguire il flusso di configurazione iniziale della chiave API">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Comportamento del rilevamento

Quando è disponibile l'autenticazione Chutes, OpenClaw interroga `GET /v1/models` con tali
credenziali e utilizza i modelli rilevati, memorizzandoli nella cache per 5 minuti per ogni
credenziale. In caso di chiave scaduta o non autorizzata (HTTP 401), OpenClaw riprova una volta
senza credenziali. Se il rilevamento continua a non restituire righe, non riesce o restituisce
qualsiasi altro stato diverso da 2xx, viene utilizzato come ripiego il catalogo statico incluso
(sia il rilevamento con chiave API sia quello con OAuth usano lo stesso percorso). Se il rilevamento
non riesce all'avvio, il catalogo statico viene utilizzato automaticamente.

## Alias predefiniti

OpenClaw registra tre pratici alias per il catalogo Chutes:

| Alias           | Modello di destinazione                                |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Catalogo iniziale integrato

Il catalogo di ripiego incluso contiene 47 modelli. Di seguito è riportato un campione rappresentativo dei riferimenti attuali:

| Riferimento del modello                               |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

Eseguire `openclaw models list --all --provider chutes` per visualizzare l'elenco completo.

## Esempio di configurazione

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Personalizzazioni OAuth">
    Personalizzare il flusso OAuth con variabili di ambiente facoltative:

    | Variabile | Scopo |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | ID client OAuth (richiesto se non impostato) |
    | `CHUTES_CLIENT_SECRET` | Segreto client OAuth |
    | `CHUTES_OAUTH_REDIRECT_URI` | URI di reindirizzamento (valore predefinito `http://127.0.0.1:1456/oauth-callback`) |
    | `CHUTES_OAUTH_SCOPES` | Ambiti separati da spazi (valore predefinito `openid profile chutes:invoke`) |

    Consultare la [documentazione OAuth di Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
    per i requisiti delle applicazioni di reindirizzamento e per ricevere assistenza.

  </Accordion>

  <Accordion title="Note">
    - I modelli Chutes vengono registrati come `chutes/<model-id>`.
    - Chutes non segnala l'utilizzo dei token durante lo streaming (`supportsUsageInStreaming: false`); i totali di utilizzo vengono comunque visualizzati al completamento del flusso.

  </Accordion>
</AccordionGroup>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Regole dei provider, riferimenti dei modelli e comportamento di failover.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Schema di configurazione completo, incluse le impostazioni dei provider.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Dashboard Chutes e documentazione dell'API.
  </Card>
  <Card title="Chiavi API di Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    Creare e gestire le chiavi API di Chutes.
  </Card>
</CardGroup>
