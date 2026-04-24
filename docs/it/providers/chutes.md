---
read_when:
    - Vuoi usare Chutes con OpenClaw
    - Ti serve il percorso di configurazione OAuth o con chiave API
    - Vuoi il modello predefinito, gli alias o il comportamento di discovery
summary: Configurazione di Chutes (OAuth o chiave API, scoperta dei modelli, alias)
title: Chutes
x-i18n:
    generated_at: "2026-04-24T08:55:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4e5189cfe32affbd23cce6c626adacd90f435c0cfe4866e2c96ac8bd0312f23
    source_path: providers/chutes.md
    workflow: 15
---

[Chutes](https://chutes.ai) espone cataloghi di modelli open-source tramite un'API
compatibile con OpenAI. OpenClaw supporta sia OAuth via browser sia autenticazione diretta con chiave API
per il provider `chutes` incluso.

| Proprietà | Valore |
| -------- | ---------------------------- |
| Provider | `chutes` |
| API | Compatibile con OpenAI |
| Base URL | `https://llm.chutes.ai/v1` |
| Auth | OAuth o chiave API (vedi sotto) |

## Per iniziare

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Esegui il flusso di onboarding OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw avvia il flusso browser localmente, oppure mostra un flusso URL + incolla del redirect
        su host remoti/headless. I token OAuth si aggiornano automaticamente tramite i profili auth OpenClaw.
      </Step>
      <Step title="Verifica il modello predefinito">
        Dopo l'onboarding, il modello predefinito viene impostato su
        `chutes/zai-org/GLM-4.7-TEE` e il catalogo Chutes incluso viene
        registrato.
      </Step>
    </Steps>
  </Tab>
  <Tab title="Chiave API">
    <Steps>
      <Step title="Ottieni una chiave API">
        Crea una chiave in
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="Esegui il flusso di onboarding con chiave API">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="Verifica il modello predefinito">
        Dopo l'onboarding, il modello predefinito viene impostato su
        `chutes/zai-org/GLM-4.7-TEE` e il catalogo Chutes incluso viene
        registrato.
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
Entrambi i percorsi auth registrano il catalogo Chutes incluso e impostano il modello predefinito su
`chutes/zai-org/GLM-4.7-TEE`. Variabili d'ambiente runtime: `CHUTES_API_KEY`,
`CHUTES_OAUTH_TOKEN`.
</Note>

## Comportamento del discovery

Quando l'autenticazione Chutes è disponibile, OpenClaw interroga il catalogo Chutes con quella
credenziale e usa i modelli rilevati. Se il discovery fallisce, OpenClaw usa come fallback
un catalogo statico incluso così onboarding e avvio continuano comunque a funzionare.

## Alias predefiniti

OpenClaw registra tre alias di comodità per il catalogo Chutes incluso:

| Alias | Modello di destinazione |
| --------------- | ----------------------------------------------------- |
| `chutes-fast` | `chutes/zai-org/GLM-4.7-FP8` |
| `chutes-pro` | `chutes/deepseek-ai/DeepSeek-V3.2-TEE` |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Catalogo iniziale integrato

Il catalogo fallback incluso contiene gli attuali riferimenti Chutes:

| Riferimento modello |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE` |
| `chutes/zai-org/GLM-5-TEE` |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE` |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE` |
| `chutes/moonshotai/Kimi-K2.5-TEE` |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE` |
| `chutes/openai/gpt-oss-120b-TEE` |

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
  <Accordion title="Override OAuth">
    Puoi personalizzare il flusso OAuth con variabili d'ambiente facoltative:

    | Variabile | Scopo |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | ID client OAuth personalizzato |
    | `CHUTES_CLIENT_SECRET` | Segreto client OAuth personalizzato |
    | `CHUTES_OAUTH_REDIRECT_URI` | URI di redirect personalizzato |
    | `CHUTES_OAUTH_SCOPES` | Ambiti OAuth personalizzati |

    Vedi la [documentazione OAuth di Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
    per requisiti dell'app di redirect e assistenza.

  </Accordion>

  <Accordion title="Note">
    - Il discovery con chiave API e quello OAuth usano entrambi lo stesso id provider `chutes`.
    - I modelli Chutes vengono registrati come `chutes/<model-id>`.
    - Se il discovery fallisce all'avvio, viene usato automaticamente il catalogo statico incluso.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Model selection" href="/it/concepts/model-providers" icon="layers">
    Regole dei provider, riferimenti ai modelli e comportamento di failover.
  </Card>
  <Card title="Configuration reference" href="/it/gateway/configuration-reference" icon="gear">
    Schema completo della configurazione, incluse le impostazioni del provider.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Dashboard Chutes e documentazione API.
  </Card>
  <Card title="Chiavi API Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    Crea e gestisci chiavi API Chutes.
  </Card>
</CardGroup>
