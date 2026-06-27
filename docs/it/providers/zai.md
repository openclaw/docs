---
read_when:
    - Vuoi i modelli Z.AI / GLM in OpenClaw
    - Ti serve una semplice configurazione di ZAI_API_KEY
summary: Usare Z.AI (modelli GLM) con OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-06-27T18:11:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a40675d3db518c090828bcc46c3bca348d1bed1027ba6b80228aa27773efd10f
    source_path: providers/zai.md
    workflow: 16
---

Z.AI è la piattaforma API per i modelli **GLM**. Fornisce API REST per GLM e
usa chiavi API per l'autenticazione. Crea la tua chiave API nella console Z.AI.
OpenClaw usa il provider `zai` con una chiave API Z.AI.

| Proprietà | Valore                                       |
| --------- | -------------------------------------------- |
| Provider  | `zai`                                        |
| Pacchetto | `@openclaw/zai-provider`                     |
| Autenticazione | `ZAI_API_KEY` (alias legacy: `Z_AI_API_KEY`) |
| API       | Z.AI Chat Completions (autenticazione Bearer) |

## Modelli GLM

GLM è una famiglia di modelli, non un provider separato. In OpenClaw, i modelli GLM usano
riferimenti come `zai/glm-5.2`: provider `zai`, ID modello `glm-5.2`.

## Guida introduttiva

Installa prima il Plugin del provider:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Rilevamento automatico dell'endpoint">
    **Ideale per:** la maggior parte degli utenti. OpenClaw verifica gli endpoint Z.AI supportati con la tua chiave API e applica automaticamente l'URL di base corretto.

    <Steps>
      <Step title="Esegui l'onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
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
    **Ideale per:** utenti che vogliono forzare uno specifico Coding Plan o una superficie API generale.

    <Steps>
      <Step title="Scegli l'opzione di onboarding corretta">
        ```bash
        # Coding Plan Global (consigliato per gli utenti del Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (regione Cina)
        openclaw onboard --auth-choice zai-coding-cn

        # API generale
        openclaw onboard --auth-choice zai-global

        # API generale CN (regione Cina)
        openclaw onboard --auth-choice zai-cn
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

## Esempio di configurazione

<Tip>
`zai-api-key` consente a OpenClaw di rilevare dalla chiave l'endpoint Z.AI corrispondente e
applicare automaticamente l'URL di base corretto. Usa le opzioni regionali esplicite quando
vuoi forzare uno specifico Coding Plan o una superficie API generale.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 uses the Coding Plan endpoint.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## Catalogo integrato

Il Plugin del provider `zai` distribuisce il suo catalogo nel manifesto del Plugin, quindi l'elenco
in sola lettura può mostrare le righe GLM note senza caricare il runtime del provider:

```bash
openclaw models list --all --provider zai
```

Il catalogo basato sul manifesto attualmente include:

| Riferimento modello  | Note                            |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | Predefinito del Coding Plan; contesto 1M |
| `zai/glm-5.1`        | Predefinito dell'API generale   |
| `zai/glm-5`          |                                 |
| `zai/glm-5-turbo`    |                                 |
| `zai/glm-5v-turbo`   |                                 |
| `zai/glm-4.7`        |                                 |
| `zai/glm-4.7-flash`  |                                 |
| `zai/glm-4.7-flashx` |                                 |
| `zai/glm-4.6`        |                                 |
| `zai/glm-4.6v`       |                                 |
| `zai/glm-4.5`        |                                 |
| `zai/glm-4.5-air`    |                                 |
| `zai/glm-4.5-flash`  |                                 |
| `zai/glm-4.5v`       |                                 |

<Tip>
I modelli GLM sono disponibili come `zai/<model>` (esempio: `zai/glm-5`).
</Tip>

<Tip>
GLM-5.2 supporta i livelli di thinking `off`, `low`, `high` e `max`. OpenClaw mappa
`low` e `high` sullo sforzo di ragionamento alto di Z.AI, e `max` sullo sforzo massimo.
</Tip>

<Note>
La configurazione del Coding Plan usa come predefinito `zai/glm-5.2`; la configurazione dell'API generale mantiene
`zai/glm-5.1`. Il rilevamento automatico dell'endpoint ripiega su `glm-5.1` o `glm-4.7`
quando il piano selezionato non espone GLM-5.2. Le versioni e la disponibilità di GLM
possono cambiare; esegui `openclaw models list --all --provider zai` per vedere il catalogo
noto alla tua versione installata.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Risoluzione in avanti dei modelli GLM-5 sconosciuti">
    Gli ID `glm-5*` sconosciuti continuano a risolversi in avanti sul percorso del provider
    sintetizzando metadati di proprietà del provider dal modello `glm-4.7` quando l'ID
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
    Il thinking di Z.AI segue i controlli `/think` di OpenClaw. Con il thinking disattivato,
    OpenClaw invia `thinking: { type: "disabled" }` per evitare risposte che
    consumano il budget di output in `reasoning_content` prima del testo visibile.

    Il thinking preservato è opt-in perché Z.AI richiede che l'intero
    `reasoning_content` storico venga riprodotto, aumentando i token del prompt. Abilitalo
    per modello:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.2": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    Quando è abilitato e il thinking è attivo, OpenClaw invia
    `thinking: { type: "enabled", clear_thinking: false }` e riproduce il precedente
    `reasoning_content` per la stessa trascrizione compatibile con OpenAI.

    Gli utenti avanzati possono comunque sovrascrivere il payload esatto del provider con
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Comprensione delle immagini">
    Il Plugin Z.AI registra la comprensione delle immagini.

    | Proprietà     | Valore      |
    | ------------- | ----------- |
    | Modello       | `glm-4.6v`  |

    La comprensione delle immagini viene risolta automaticamente dall'autenticazione Z.AI configurata: non
    è necessaria alcuna configurazione aggiuntiva.

  </Accordion>

  <Accordion title="Dettagli di autenticazione">
    - Z.AI usa l'autenticazione Bearer con la tua chiave API.
    - L'opzione di onboarding `zai-api-key` rileva automaticamente l'endpoint Z.AI corrispondente verificando gli endpoint supportati con la tua chiave.
    - Usa le opzioni regionali esplicite (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) quando vuoi forzare una specifica superficie API.
    - La variabile env legacy `Z_AI_API_KEY` è ancora accettata; OpenClaw la copia in `ZAI_API_KEY` all'avvio se `ZAI_API_KEY` non è impostata.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti modello e comportamento di failover.
  </Card>
  <Card title="Riferimento di configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Schema completo di configurazione di OpenClaw, incluse le impostazioni di provider e modello.
  </Card>
</CardGroup>
