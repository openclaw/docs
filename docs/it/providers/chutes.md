---
read_when:
    - Vuoi usare Chutes con OpenClaw
    - Ti serve il percorso di configurazione OAuth o della chiave API
    - Vuoi il modello predefinito, gli alias o il comportamento di rilevamento
summary: Configurazione di Chutes (OAuth o chiave API, scoperta dei modelli, alias)
title: Chutes
x-i18n:
    generated_at: "2026-04-30T09:08:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52e2c767604ff50cc7fe1a5fcfac03c35345facf2225e80f62476bbc3852199a
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) espone cataloghi di modelli open-source tramite un'API
compatibile con OpenAI. OpenClaw supporta sia OAuth via browser sia
l'autenticazione diretta con chiave API per il provider `chutes` incluso.

| Proprietà | Valore                       |
| --------- | ---------------------------- |
| Provider  | `chutes`                     |
| API       | compatibile con OpenAI       |
| URL base  | `https://llm.chutes.ai/v1`   |
| Auth      | OAuth o chiave API (vedi sotto) |

## Per iniziare

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Run the OAuth onboarding flow">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw avvia il flusso nel browser localmente oppure mostra un flusso con
        URL + incolla del reindirizzamento sugli host remoti/headless. I token OAuth
        vengono aggiornati automaticamente tramite i profili di autenticazione di OpenClaw.
      </Step>
      <Step title="Verify the default model">
        Dopo l'onboarding, il modello predefinito viene impostato su
        `chutes/zai-org/GLM-4.7-TEE` e il catalogo Chutes incluso viene
        registrato.
      </Step>
    </Steps>
  </Tab>
  <Tab title="API key">
    <Steps>
      <Step title="Get an API key">
        Crea una chiave su
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="Run the API key onboarding flow">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="Verify the default model">
        Dopo l'onboarding, il modello predefinito viene impostato su
        `chutes/zai-org/GLM-4.7-TEE` e il catalogo Chutes incluso viene
        registrato.
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
Entrambi i percorsi di autenticazione registrano il catalogo Chutes incluso e impostano il modello predefinito su
`chutes/zai-org/GLM-4.7-TEE`. Variabili d'ambiente di runtime: `CHUTES_API_KEY`,
`CHUTES_OAUTH_TOKEN`.
</Note>

## Comportamento di rilevamento

Quando l'autenticazione Chutes è disponibile, OpenClaw interroga il catalogo Chutes con quelle
credenziali e usa i modelli rilevati. Se il rilevamento non riesce, OpenClaw
ripiega su un catalogo statico incluso, così onboarding e avvio continuano a funzionare.

## Alias predefiniti

OpenClaw registra tre alias pratici per il catalogo Chutes incluso:

| Alias           | Modello di destinazione                                |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Catalogo iniziale integrato

Il catalogo di fallback incluso comprende i riferimenti Chutes correnti:

| Riferimento modello                                  |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

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
  <Accordion title="OAuth overrides">
    Puoi personalizzare il flusso OAuth con variabili d'ambiente facoltative:

    | Variabile | Scopo |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | ID client OAuth personalizzato |
    | `CHUTES_CLIENT_SECRET` | Segreto client OAuth personalizzato |
    | `CHUTES_OAUTH_REDIRECT_URI` | URI di reindirizzamento personalizzato |
    | `CHUTES_OAUTH_SCOPES` | Scope OAuth personalizzati |

    Consulta la [documentazione OAuth di Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
    per i requisiti dell'app di reindirizzamento e assistenza.

  </Accordion>

  <Accordion title="Notes">
    - Il rilevamento con chiave API e OAuth usa lo stesso ID provider `chutes`.
    - I modelli Chutes sono registrati come `chutes/<model-id>`.
    - Se il rilevamento fallisce all'avvio, il catalogo statico incluso viene usato automaticamente.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Model selection" href="/it/concepts/model-providers" icon="layers">
    Regole del provider, riferimenti dei modelli e comportamento di failover.
  </Card>
  <Card title="Configuration reference" href="/it/gateway/configuration-reference" icon="gear">
    Schema di configurazione completo, incluse le impostazioni del provider.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Dashboard Chutes e documentazione API.
  </Card>
  <Card title="Chutes API keys" href="https://chutes.ai/settings/api-keys" icon="key">
    Crea e gestisci le chiavi API Chutes.
  </Card>
</CardGroup>
