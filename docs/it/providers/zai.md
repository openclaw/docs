---
read_when:
    - Vuoi usare i modelli Z.AI / GLM in OpenClaw
    - È necessaria una semplice configurazione di ZAI_API_KEY
summary: Utilizzare Z.AI (modelli GLM) con OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-05-02T08:33:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 423fc2bc27c62352d9d9acd13c70aa2bc3804112dab25aa46505e844cb166c93
    source_path: providers/zai.md
    workflow: 16
---

Z.AI è la piattaforma API per i modelli **GLM**. Fornisce API REST per GLM e usa chiavi API
per l'autenticazione. Crea la tua chiave API nella console Z.AI. OpenClaw usa il provider `zai`
con una chiave API Z.AI.

- Provider: `zai`
- Autenticazione: `ZAI_API_KEY`
- API: Chat Completions Z.AI (autenticazione Bearer)

## Per iniziare

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
      <Step title="Verifica che il modello sia elencato">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Endpoint regionale esplicito">
    **Ideale per:** gli utenti che vogliono forzare uno specifico Coding Plan o una superficie API generale.

    <Steps>
      <Step title="Scegli l'opzione di onboarding corretta">
        ```bash
        # Coding Plan Global (consigliato per gli utenti di Coding Plan)
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
      <Step title="Verifica che il modello sia elencato">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Catalogo integrato

OpenClaw distribuisce il catalogo del provider `zai` in bundle nel manifest del plugin, quindi l'elenco
in sola lettura può mostrare le righe GLM note senza caricare il runtime del provider:

```bash
openclaw models list --all --provider zai
```

Il catalogo basato sul manifest attualmente include:

| Riferimento modello   | Note                |
| -------------------- | ------------- |
| `zai/glm-5.1`        | Modello predefinito |
| `zai/glm-5`          |               |
| `zai/glm-5-turbo`    |               |
| `zai/glm-5v-turbo`   |               |
| `zai/glm-4.7`        |               |
| `zai/glm-4.7-flash`  |               |
| `zai/glm-4.7-flashx` |               |
| `zai/glm-4.6`        |               |
| `zai/glm-4.6v`       |               |
| `zai/glm-4.5`        |               |
| `zai/glm-4.5-air`    |               |
| `zai/glm-4.5-flash`  |               |
| `zai/glm-4.5v`       |               |

<Tip>
I modelli GLM sono disponibili come `zai/<model>` (esempio: `zai/glm-5`). Il riferimento modello predefinito in bundle è `zai/glm-5.1`.
</Tip>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Risoluzione in avanti dei modelli GLM-5 sconosciuti">
    Gli id `glm-5*` sconosciuti continuano a risolversi in avanti sul percorso del provider in bundle
    sintetizzando metadati di proprietà del provider dal modello `glm-4.7` quando l'id
    corrisponde alla forma corrente della famiglia GLM-5.
  </Accordion>

  <Accordion title="Streaming delle chiamate agli strumenti">
    `tool_stream` è abilitato per impostazione predefinita per lo streaming delle chiamate agli strumenti Z.AI. Per disabilitarlo:

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

  <Accordion title="Ragionamento e ragionamento preservato">
    Il ragionamento Z.AI segue i controlli `/think` di OpenClaw. Con il ragionamento disattivato,
    OpenClaw invia `thinking: { type: "disabled" }` per evitare risposte che
    consumano il budget di output in `reasoning_content` prima del testo visibile.

    Il ragionamento preservato è facoltativo perché Z.AI richiede che l'intero storico
    `reasoning_content` venga riprodotto, aumentando i token del prompt. Abilitalo
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

    Quando è abilitato e il ragionamento è attivo, OpenClaw invia
    `thinking: { type: "enabled", clear_thinking: false }` e riproduce il precedente
    `reasoning_content` per la stessa trascrizione compatibile con OpenAI.

    Gli utenti avanzati possono comunque sovrascrivere il payload esatto del provider con
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Comprensione delle immagini">
    Il plugin Z.AI in bundle registra la comprensione delle immagini.

    | Proprietà     | Valore      |
    | ------------- | ----------- |
    | Modello       | `glm-4.6v`  |

    La comprensione delle immagini viene risolta automaticamente dall'autenticazione Z.AI configurata: non
    è necessaria alcuna configurazione aggiuntiva.

  </Accordion>

  <Accordion title="Dettagli di autenticazione">
    - Z.AI usa l'autenticazione Bearer con la tua chiave API.
    - L'opzione di onboarding `zai-api-key` rileva automaticamente l'endpoint Z.AI corrispondente dal prefisso della chiave.
    - Usa le opzioni regionali esplicite (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) quando vuoi forzare una superficie API specifica.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Famiglia di modelli GLM" href="/it/providers/glm" icon="microchip">
    Panoramica della famiglia di modelli GLM.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti modello e del comportamento di failover.
  </Card>
</CardGroup>
