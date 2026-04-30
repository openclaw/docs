---
read_when:
    - Vuoi i modelli Z.AI / GLM in OpenClaw
    - È necessaria una semplice configurazione di ZAI_API_KEY
summary: Usare Z.AI (modelli GLM) con OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-30T09:10:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0192797b9e023065a384b0428830e73877a5088d2c40c2190d5322273294607d
    source_path: providers/zai.md
    workflow: 16
---

Z.AI è la piattaforma API per i modelli **GLM**. Fornisce API REST per GLM e usa chiavi API
per l'autenticazione. Crea la tua chiave API nella console Z.AI. OpenClaw usa il provider `zai`
con una chiave API Z.AI.

- Provider: `zai`
- Autenticazione: `ZAI_API_KEY`
- API: Chat Completions Z.AI (autenticazione Bearer)

## Primi passi

<Tabs>
  <Tab title="Endpoint rilevato automaticamente">
    **Ideale per:** la maggior parte degli utenti. OpenClaw rileva l'endpoint Z.AI corrispondente dalla chiave e applica automaticamente l'URL di base corretto.

    <Steps>
      <Step title="Esegui l'onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Imposta un modello predefinito">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Endpoint regionale esplicito">
    **Ideale per:** utenti che vogliono forzare uno specifico Coding Plan o una superficie API generale.

    <Steps>
      <Step title="Scegli l'opzione di onboarding corretta">
        ```bash
        # Coding Plan Global (recommended for Coding Plan users)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (China region)
        openclaw onboard --auth-choice zai-coding-cn

        # General API
        openclaw onboard --auth-choice zai-global

        # General API CN (China region)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Imposta un modello predefinito">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Catalogo integrato

OpenClaw attualmente inizializza il provider `zai` incluso con:

| Riferimento modello  | Note                |
| -------------------- | ------------------- |
| `zai/glm-5.1`        | Modello predefinito |
| `zai/glm-5`          |                     |
| `zai/glm-5-turbo`    |                     |
| `zai/glm-5v-turbo`   |                     |
| `zai/glm-4.7`        |                     |
| `zai/glm-4.7-flash`  |                     |
| `zai/glm-4.7-flashx` |                     |
| `zai/glm-4.6`        |                     |
| `zai/glm-4.6v`       |                     |
| `zai/glm-4.5`        |                     |
| `zai/glm-4.5-air`    |                     |
| `zai/glm-4.5-flash`  |                     |
| `zai/glm-4.5v`       |                     |

<Tip>
I modelli GLM sono disponibili come `zai/<model>` (esempio: `zai/glm-5`). Il riferimento del modello incluso predefinito è `zai/glm-5.1`.
</Tip>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Risoluzione in avanti di modelli GLM-5 sconosciuti">
    Gli ID `glm-5*` sconosciuti continuano a risolversi in avanti nel percorso del provider incluso
    sintetizzando metadati di proprietà del provider dal template `glm-4.7` quando l'ID
    corrisponde alla forma attuale della famiglia GLM-5.
  </Accordion>

  <Accordion title="Streaming delle chiamate agli strumenti">
    `tool_stream` è abilitato per impostazione predefinita per lo streaming delle chiamate agli strumenti di Z.AI. Per disabilitarlo:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Thinking e thinking preservato">
    Il thinking di Z.AI segue i controlli `/think` di OpenClaw. Con thinking disattivato,
    OpenClaw invia `thinking: { type: "disabled" }` per evitare risposte che
    spendono il budget di output su `reasoning_content` prima del testo visibile.

    Il thinking preservato è opt-in perché Z.AI richiede la riproduzione dell'intero
    `reasoning_content` storico, aumentando i token del prompt. Abilitalo
    per modello:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.1": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    Quando è abilitato e thinking è attivo, OpenClaw invia
    `thinking: { type: "enabled", clear_thinking: false }` e riproduce il
    `reasoning_content` precedente per la stessa trascrizione compatibile con OpenAI.

    Gli utenti avanzati possono comunque sovrascrivere il payload esatto del provider con
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Comprensione delle immagini">
    Il Plugin Z.AI incluso registra la comprensione delle immagini.

    | Proprietà | Valore      |
    | --------- | ----------- |
    | Modello   | `glm-4.6v`  |

    La comprensione delle immagini viene risolta automaticamente dall'autenticazione Z.AI configurata: non è necessaria
    alcuna configurazione aggiuntiva.

  </Accordion>

  <Accordion title="Dettagli di autenticazione">
    - Z.AI usa l'autenticazione Bearer con la tua chiave API.
    - L'opzione di onboarding `zai-api-key` rileva automaticamente l'endpoint Z.AI corrispondente dal prefisso della chiave.
    - Usa le opzioni regionali esplicite (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) quando vuoi forzare una specifica superficie API.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Famiglia di modelli GLM" href="/it/providers/glm" icon="microchip">
    Panoramica della famiglia di modelli GLM.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti dei modelli e del comportamento di failover.
  </Card>
</CardGroup>
