---
read_when:
    - Vuoi usare Chutes con OpenClaw
    - Ti serve il percorso di configurazione OAuth o della chiave API
    - Vuoi il modello predefinito, gli alias o il comportamento di discovery
summary: Configurazione di Chutes (OAuth o chiave API, rilevamento dei modelli, alias)
title: Scivoli
x-i18n:
    generated_at: "2026-06-27T18:06:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f1898c568fd664303a8bb5c2e46228c75f9c217bec5a65e752d9c7e10b980bb
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) espone cataloghi di modelli open-source tramite un'API compatibile con
OpenAI. OpenClaw supporta sia OAuth via browser sia l'autenticazione diretta con chiave API
per il provider `chutes`.

| Proprietà | Valore                       |
| -------- | ---------------------------- |
| Provider | `chutes`                     |
| API      | Compatibile con OpenAI       |
| URL base | `https://llm.chutes.ai/v1`   |
| Autenticazione | OAuth o chiave API (vedi sotto) |

## Installa Plugin

Installa il Plugin ufficiale, quindi riavvia Gateway:

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## Per iniziare

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Esegui il flusso di onboarding OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw avvia il flusso del browser localmente oppure mostra un URL + un flusso
        di reindirizzamento con incolla su host remoti/headless. I token OAuth si aggiornano
        automaticamente tramite i profili di autenticazione di OpenClaw.
      </Step>
      <Step title="Verifica il modello predefinito">
        Dopo l'onboarding, il modello predefinito viene impostato su
        `chutes/zai-org/GLM-4.7-TEE` e il catalogo statico di Chutes viene
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
        `chutes/zai-org/GLM-4.7-TEE` e il catalogo statico di Chutes viene
        registrato.
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
Entrambi i percorsi di autenticazione registrano il catalogo statico di Chutes e impostano il modello predefinito su
`chutes/zai-org/GLM-4.7-TEE`. Variabili d'ambiente di runtime: `CHUTES_API_KEY`,
`CHUTES_OAUTH_TOKEN`.
</Note>

## Comportamento di discovery

Quando l'autenticazione Chutes è disponibile, OpenClaw interroga il catalogo Chutes con quelle
credenziali e usa i modelli rilevati. Se la discovery non riesce, OpenClaw ripiega
su un catalogo statico, così onboarding e avvio continuano a funzionare.

## Alias predefiniti

OpenClaw registra tre alias di comodità per il catalogo statico di Chutes:

| Alias           | Modello di destinazione                              |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Catalogo iniziale integrato

Il catalogo statico di fallback include i riferimenti Chutes attuali:

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
  <Accordion title="Override OAuth">
    Puoi personalizzare il flusso OAuth con variabili d'ambiente opzionali:

    | Variabile | Scopo |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | ID client OAuth personalizzato |
    | `CHUTES_CLIENT_SECRET` | Segreto client OAuth personalizzato |
    | `CHUTES_OAUTH_REDIRECT_URI` | URI di reindirizzamento personalizzato |
    | `CHUTES_OAUTH_SCOPES` | Ambiti OAuth personalizzati |

    Consulta la [documentazione OAuth di Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
    per i requisiti dell'app di reindirizzamento e assistenza.

  </Accordion>

  <Accordion title="Note">
    - La discovery con chiave API e OAuth usa lo stesso ID provider `chutes`.
    - I modelli Chutes sono registrati come `chutes/<model-id>`.
    - Se la discovery non riesce all'avvio, il catalogo statico viene usato automaticamente.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Regole dei provider, riferimenti dei modelli e comportamento di failover.
  </Card>
  <Card title="Riferimento di configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Schema di configurazione completo, incluse le impostazioni dei provider.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Dashboard Chutes e documentazione API.
  </Card>
  <Card title="Chiavi API Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    Crea e gestisci le chiavi API Chutes.
  </Card>
</CardGroup>
