---
read_when:
    - Vuoi i modelli Z.AI / GLM in OpenClaw
    - Hai bisogno di una semplice configurazione di `ZAI_API_KEY`
summary: Usa Z.AI (modelli GLM) con OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-07-12T07:27:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab29149da39cbf82fe041ea5932a860c461320e14bf26f83f69060d7ae0ae00a
    source_path: providers/zai.md
    workflow: 16
---

Z.AI è la piattaforma API per i modelli **GLM**. Fornisce API REST per GLM e
utilizza chiavi API per l'autenticazione. Crea la tua chiave API nella console Z.AI.
OpenClaw utilizza il provider `zai` con una chiave API Z.AI.

| Proprietà      | Valore                                       |
| -------------- | -------------------------------------------- |
| Provider       | `zai`                                        |
| Pacchetto      | `@openclaw/zai-provider`                     |
| Autenticazione | `ZAI_API_KEY` (alias precedente: `Z_AI_API_KEY`) |
| API            | Completamenti chat Z.AI (autenticazione Bearer) |

## Modelli GLM

GLM è una famiglia di modelli, non un provider separato. In OpenClaw, i modelli GLM
utilizzano riferimenti come `zai/glm-5.2`: provider `zai`, ID modello `glm-5.2`.

## Guida introduttiva

Installa prima il Plugin del provider:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Rilevamento automatico dell'endpoint">
    **Ideale per:** la maggior parte degli utenti. OpenClaw verifica gli endpoint Z.AI supportati con la tua chiave API e applica automaticamente l'URL di base corretto.

    <Steps>
      <Step title="Esegui la configurazione iniziale">
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
    **Ideale per:** gli utenti che desiderano imporre un Coding Plan specifico o una determinata superficie API generale.

    <Steps>
      <Step title="Scegli l'opzione di configurazione iniziale corretta">
        ```bash
        # Coding Plan globale (consigliato per gli utenti di Coding Plan)
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

### Endpoint

| Opzione di configurazione iniziale | URL di base                                   | Modello predefinito |
| ---------------------------------- | --------------------------------------------- | ------------------- |
| `zai-global`                       | `https://api.z.ai/api/paas/v4`                | `glm-5.1`           |
| `zai-cn`                           | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`           |
| `zai-coding-global`                | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`           |
| `zai-coding-cn`                    | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`           |

`zai-api-key` rileva automaticamente uno di questi quattro endpoint provando la tua
chiave con l'API dei completamenti chat di ciascun endpoint, controllando gli endpoint
generali (`zai-global`, quindi `zai-cn`) prima degli endpoint Coding Plan
(`zai-coding-global`, quindi `zai-coding-cn`) e arrestandosi al primo endpoint che
accetta una richiesta. Usa un valore `--auth-choice` esplicito per imporre un endpoint
Coding Plan se la tua chiave funziona con entrambi.

## Esempio di configurazione

<Tip>
`zai-api-key` consente a OpenClaw di rilevare dalla chiave l'endpoint Z.AI corrispondente
e di applicare automaticamente l'URL di base corretto. Usa le opzioni regionali esplicite
quando desideri imporre un Coding Plan specifico o una determinata superficie API generale.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 utilizza l'endpoint Coding Plan.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## Catalogo integrato

Il Plugin del provider `zai` distribuisce il proprio catalogo nel manifesto del Plugin,
quindi l'elenco in sola lettura può mostrare le righe GLM note senza caricare il runtime
del provider:

```bash
openclaw models list --all --provider zai
```

Il catalogo basato sul manifesto include attualmente:

| Riferimento modello  | Note                                      |
| -------------------- | ----------------------------------------- |
| `zai/glm-5.2`        | Predefinito di Coding Plan; contesto di 1M |
| `zai/glm-5.1`        | Predefinito dell'API generale             |
| `zai/glm-5`          |                                           |
| `zai/glm-5-turbo`    |                                           |
| `zai/glm-5v-turbo`   |                                           |
| `zai/glm-4.7`        |                                           |
| `zai/glm-4.7-flash`  |                                           |
| `zai/glm-4.7-flashx` |                                           |
| `zai/glm-4.6`        |                                           |
| `zai/glm-4.6v`       |                                           |
| `zai/glm-4.5`        |                                           |
| `zai/glm-4.5-air`    |                                           |
| `zai/glm-4.5-flash`  |                                           |
| `zai/glm-4.5v`       |                                           |

<Tip>
I modelli GLM sono disponibili come `zai/<model>` (esempio: `zai/glm-5`).
</Tip>

<Note>
La configurazione di Coding Plan usa come valore predefinito `zai/glm-5.2`; la
configurazione dell'API generale mantiene `zai/glm-5.1`. Negli endpoint Coding Plan,
il rilevamento automatico ripiega su `glm-5.1` e quindi su `glm-4.7` quando la chiave
o il piano non rende disponibile GLM-5.2. Le versioni e la disponibilità di GLM possono
cambiare; esegui `openclaw models list --all --provider zai` per visualizzare il catalogo
noto alla versione installata.
</Note>

## Livelli di ragionamento

<Tabs>
  <Tab title="GLM-5.2">
    Intervallo completo: `off`, `low`, `high`, `max` (valore predefinito `off`). OpenClaw
    associa `low` e `high` al livello di ragionamento `high` di Z.AI e `max` al livello
    `max` di Z.AI, tramite `reasoning_effort` nel payload della richiesta.
  </Tab>
  <Tab title="Altri modelli GLM">
    Solo opzione binaria: `off` e `low` (visualizzato come `on` nei selettori), valore
    predefinito `off`. Impostando il ragionamento su `off` viene inviato
    `thinking: { type: "disabled" }`; qualsiasi altro livello lascia invariato il payload
    della richiesta (si applica il comportamento di ragionamento predefinito di Z.AI).
  </Tab>
</Tabs>

Impostare il ragionamento su `off` evita risposte che consumano il budget di output per
`reasoning_content` prima del testo visibile.

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Risoluzione futura dei modelli GLM-5 sconosciuti">
    Gli ID `glm-5*` sconosciuti vengono comunque risolti in modo prospettico nel percorso
    del provider, sintetizzando metadati di proprietà del provider dal modello
    `glm-4.7` quando l'ID corrisponde alla forma corrente della famiglia GLM-5.
  </Accordion>

  <Accordion title="Streaming delle chiamate agli strumenti">
    `tool_stream` è abilitato per impostazione predefinita per lo streaming delle chiamate
    agli strumenti di Z.AI. Per disabilitarlo:

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

  <Accordion title="Ragionamento conservato">
    La conservazione del ragionamento è opzionale perché Z.AI richiede di riprodurre
    l'intero `reasoning_content` storico, aumentando il numero di token del prompt.
    Abilitala per ogni modello:

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

    Quando è abilitata e il ragionamento è attivo, OpenClaw invia
    `thinking: { type: "enabled", clear_thinking: false }` e riproduce il
    `reasoning_content` precedente per la stessa trascrizione compatibile con OpenAI.
    La chiave del parametro in snake_case `preserve_thinking` funziona come alias.

    Gli utenti avanzati possono comunque sovrascrivere il payload esatto del provider
    con `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Comprensione delle immagini">
    Il Plugin Z.AI registra la comprensione delle immagini.

    | Proprietà | Valore      |
    | --------- | ----------- |
    | Modello   | `glm-4.6v`  |

    La comprensione delle immagini viene risolta automaticamente dall'autenticazione
    Z.AI configurata: non è necessaria alcuna configurazione aggiuntiva.

  </Accordion>

  <Accordion title="Dettagli sull'autenticazione">
    - Z.AI utilizza l'autenticazione Bearer con la tua chiave API.
    - L'opzione di configurazione iniziale `zai-api-key` rileva automaticamente l'endpoint Z.AI corrispondente provando gli endpoint supportati con la tua chiave.
    - Usa le opzioni regionali esplicite (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) quando desideri imporre una superficie API specifica.
    - La variabile di ambiente precedente `Z_AI_API_KEY` è ancora accettata; OpenClaw la copia in `ZAI_API_KEY` all'avvio se `ZAI_API_KEY` non è impostata.

  </Accordion>
</AccordionGroup>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Riferimento per la configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Schema di configurazione completo di OpenClaw, incluse le impostazioni di provider e modelli.
  </Card>
</CardGroup>
