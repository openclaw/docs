---
read_when:
    - Vuoi usare Arcee AI con OpenClaw
    - Serve la variabile d'ambiente della chiave API o la scelta di autenticazione della CLI
summary: Configurazione di Arcee AI (autenticazione + selezione del modello)
title: Arcee AI
x-i18n:
    generated_at: "2026-05-07T15:08:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c3775ac2783da0833988c68621bd81c73a3b3e8240c26b4c1b590c1e9df2a8f
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) fornisce accesso alla famiglia Trinity di modelli a miscela di esperti tramite un'API compatibile con OpenAI. Tutti i modelli Trinity sono concessi in licenza Apache 2.0.

I modelli Arcee AI possono essere usati direttamente tramite la piattaforma Arcee o tramite [OpenRouter](/it/providers/openrouter).

| Proprietà | Valore                                                                                |
| -------- | ------------------------------------------------------------------------------------- |
| Provider | `arcee`                                                                               |
| Autenticazione | `ARCEEAI_API_KEY` (diretta) o `OPENROUTER_API_KEY` (tramite OpenRouter)         |
| API      | Compatibile con OpenAI                                                               |
| URL base | `https://api.arcee.ai/api/v1` (diretta) o `https://openrouter.ai/api/v1` (OpenRouter) |

## Primi passi

<Tabs>
  <Tab title="Diretta (piattaforma Arcee)">
    <Steps>
      <Step title="Ottieni una chiave API">
        Crea una chiave API su [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Esegui l'onboarding">
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
      <Step title="Esegui l'onboarding">
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

        Gli stessi riferimenti ai modelli funzionano sia per le configurazioni dirette sia per quelle OpenRouter (ad esempio `arcee/trinity-large-thinking`).
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

OpenClaw attualmente distribuisce questo catalogo Arcee incluso:

| Riferimento modello             | Nome                   | Input | Contesto | Costo (input/output per 1M) | Note                                      |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text  | 256K    | $0.25 / $0.90        | Modello predefinito; ragionamento abilitato |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text  | 128K    | $0.25 / $1.00        | Uso generico; 400B parametri, 13B attivi  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text  | 128K    | $0.045 / $0.15       | Veloce e conveniente; chiamata di funzioni |

<Tip>
Il preset di onboarding imposta `arcee/trinity-large-thinking` come modello predefinito.
</Tip>

## Funzionalità supportate

| Funzionalità                                  | Supportata                                   |
| --------------------------------------------- | -------------------------------------------- |
| Streaming                                     | Sì                                           |
| Uso di strumenti / chiamata di funzioni       | Sì (Trinity Mini, Trinity Large Preview)     |
| Output strutturato (modalità JSON e schema JSON) | Sì                                        |
| Extended thinking                             | Sì (Trinity Large Thinking; strumenti disabilitati) |

<AccordionGroup>
  <Accordion title="Nota sull'ambiente">
    Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che `ARCEEAI_API_KEY`
    (o `OPENROUTER_API_KEY`) sia disponibile per quel processo (ad esempio in
    `~/.openclaw/.env` o tramite `env.shellEnv`).
  </Accordion>

  <Accordion title="Routing OpenRouter">
    Quando usi i modelli Arcee tramite OpenRouter, si applicano gli stessi riferimenti ai modelli `arcee/*`.
    OpenClaw gestisce il routing in modo trasparente in base alla tua scelta di autenticazione. Consulta la
    [documentazione del provider OpenRouter](/it/providers/openrouter) per i dettagli di configurazione
    specifici di OpenRouter.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/it/providers/openrouter" icon="shuffle">
    Accedi ai modelli Arcee e a molti altri tramite una singola chiave API.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
</CardGroup>
