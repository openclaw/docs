---
read_when:
    - Vuoi usare modelli Z.AI / GLM in OpenClaw
    - Ti serve una semplice configurazione con ZAI_API_KEY
summary: Usa Z.AI (modelli GLM) con OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-24T08:59:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2095be914fa9861c8aad2cb1e2ebe78f6e29183bf041a191205626820d3b71df
    source_path: providers/zai.md
    workflow: 15
---

Z.AI è la piattaforma API per i modelli **GLM**. Fornisce API REST per GLM e usa chiavi API
per l'autenticazione. Crea la tua chiave API nella console Z.AI. OpenClaw usa il provider `zai`
con una chiave API Z.AI.

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- API: Z.AI Chat Completions (autenticazione Bearer)

## Per iniziare

<Tabs>
  <Tab title="Rilevamento automatico dell'endpoint">
    **Ideale per:** la maggior parte degli utenti. OpenClaw rileva l'endpoint Z.AI corrispondente dalla chiave e applica automaticamente il base URL corretto.

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
    **Ideale per:** utenti che vogliono forzare una specifica superficie API Coding Plan o generale.

    <Steps>
      <Step title="Scegli l'opzione di onboarding corretta">
        ```bash
        # Coding Plan Global (consigliato per utenti Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (regione Cina)
        openclaw onboard --auth-choice zai-coding-cn

        # API generale
        openclaw onboard --auth-choice zai-global

        # API generale CN (regione Cina)
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

| Riferimento modello | Note |
| -------------------- | ------------- |
| `zai/glm-5.1` | Modello predefinito |
| `zai/glm-5` | |
| `zai/glm-5-turbo` | |
| `zai/glm-5v-turbo` | |
| `zai/glm-4.7` | |
| `zai/glm-4.7-flash` | |
| `zai/glm-4.7-flashx` | |
| `zai/glm-4.6` | |
| `zai/glm-4.6v` | |
| `zai/glm-4.5` | |
| `zai/glm-4.5-air` | |
| `zai/glm-4.5-flash` | |
| `zai/glm-4.5v` | |

<Tip>
I modelli GLM sono disponibili come `zai/<model>` (esempio: `zai/glm-5`). Il riferimento del modello incluso predefinito è `zai/glm-5.1`.
</Tip>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Forward-resolving di modelli GLM-5 sconosciuti">
    Gli id `glm-5*` sconosciuti continuano a essere risolti in avanti sul percorso del provider incluso
    sintetizzando metadati posseduti dal provider dal template `glm-4.7` quando l'id
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

  <Accordion title="Comprensione delle immagini">
    Il Plugin Z.AI incluso registra la comprensione delle immagini.

    | Proprietà | Valore |
    | ------------- | ----------- |
    | Modello | `glm-4.6v` |

    La comprensione delle immagini viene risolta automaticamente dall'autenticazione Z.AI configurata — non
    è necessaria alcuna configurazione aggiuntiva.

  </Accordion>

  <Accordion title="Dettagli dell'autenticazione">
    - Z.AI usa autenticazione Bearer con la tua chiave API.
    - La scelta di onboarding `zai-api-key` rileva automaticamente l'endpoint Z.AI corrispondente dal prefisso della chiave.
    - Usa le scelte regionali esplicite (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) quando vuoi forzare una specifica superficie API.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Famiglia di modelli GLM" href="/it/providers/glm" icon="microchip">
    Panoramica della famiglia di modelli GLM.
  </Card>
  <Card title="Model selection" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti ai modelli e comportamento di failover.
  </Card>
</CardGroup>
