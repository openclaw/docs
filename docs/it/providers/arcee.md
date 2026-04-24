---
read_when:
    - Vuoi usare Arcee AI con OpenClaw
    - Hai bisogno della variabile d’ambiente della chiave API o della scelta di autenticazione CLI
summary: Configurazione di Arcee AI (autenticazione + selezione del modello)
title: Arcee AI
x-i18n:
    generated_at: "2026-04-24T08:55:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54989e1706901fedc8a0c816ca7ee7f877fa4b973697540dd90cb9182420043f
    source_path: providers/arcee.md
    workflow: 15
---

[Arcee AI](https://arcee.ai) fornisce accesso alla famiglia di modelli mixture-of-experts Trinity tramite un’API OpenAI-compatible. Tutti i modelli Trinity sono rilasciati con licenza Apache 2.0.

I modelli Arcee AI possono essere utilizzati direttamente tramite la piattaforma Arcee oppure tramite [OpenRouter](/it/providers/openrouter).

| Proprietà | Valore                                                                                 |
| --------- | -------------------------------------------------------------------------------------- |
| Provider  | `arcee`                                                                                |
| Auth      | `ARCEEAI_API_KEY` (diretta) oppure `OPENROUTER_API_KEY` (tramite OpenRouter)          |
| API       | OpenAI-compatible                                                                      |
| Base URL  | `https://api.arcee.ai/api/v1` (diretta) oppure `https://openrouter.ai/api/v1` (OpenRouter) |

## Per iniziare

<Tabs>
  <Tab title="Diretta (piattaforma Arcee)">
    <Steps>
      <Step title="Ottieni una chiave API">
        Crea una chiave API su [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Esegui l’onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Imposta un modello predefinito">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Tramite OpenRouter">
    <Steps>
      <Step title="Ottieni una chiave API">
        Crea una chiave API su [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="Esegui l’onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Imposta un modello predefinito">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        Gli stessi riferimenti modello funzionano sia per configurazioni dirette sia tramite OpenRouter (per esempio `arcee/trinity-large-thinking`).
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configurazione non interattiva

<Tabs>
  <Tab title="Diretta (piattaforma Arcee)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="Tramite OpenRouter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## Catalogo integrato

OpenClaw attualmente include questo catalogo Arcee integrato:

| Riferimento modello            | Nome                   | Input | Contesto | Costo (in/out per 1M) | Note                                      |
| ------------------------------ | ---------------------- | ----- | -------- | --------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text  | 256K     | $0.25 / $0.90         | Modello predefinito; ragionamento abilitato |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text  | 128K     | $0.25 / $1.00         | Uso generale; 400B parametri, 13B attivi  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text  | 128K     | $0.045 / $0.15        | Veloce ed efficiente nei costi; function calling |

<Tip>
Il preset di onboarding imposta `arcee/trinity-large-thinking` come modello predefinito.
</Tip>

## Funzionalità supportate

| Funzionalità                                  | Supportata                   |
| --------------------------------------------- | ---------------------------- |
| Streaming                                     | Sì                           |
| Uso di strumenti / function calling           | Sì                           |
| Output strutturato (modalità JSON e schema JSON) | Sì                        |
| Pensiero esteso                               | Sì (Trinity Large Thinking)  |

<AccordionGroup>
  <Accordion title="Nota sull’ambiente">
    Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che `ARCEEAI_API_KEY`
    (oppure `OPENROUTER_API_KEY`) sia disponibile per quel processo (per esempio in
    `~/.openclaw/.env` oppure tramite `env.shellEnv`).
  </Accordion>

  <Accordion title="Instradamento OpenRouter">
    Quando usi modelli Arcee tramite OpenRouter, si applicano gli stessi riferimenti modello `arcee/*`.
    OpenClaw gestisce l’instradamento in modo trasparente in base alla tua scelta di autenticazione. Vedi la
    [documentazione del provider OpenRouter](/it/providers/openrouter) per i dettagli di configurazione specifici di OpenRouter.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/it/providers/openrouter" icon="shuffle">
    Accedi ai modelli Arcee e a molti altri tramite una singola chiave API.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scegliere provider, riferimenti modello e comportamento di failover.
  </Card>
</CardGroup>
