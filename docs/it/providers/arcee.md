---
read_when:
    - Vuoi usare Arcee AI con OpenClaw
    - È necessaria la variabile d'ambiente della chiave API o la scelta di autenticazione della CLI
summary: Configurazione di Arcee AI (autenticazione + selezione del modello)
title: Arcee AI
x-i18n:
    generated_at: "2026-07-12T07:26:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe519393db3cf39f1b14b8121603b6f667102ac8c122fb6560d9b73a6ee6b0a3
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) fornisce la famiglia Trinity di modelli mixture-of-experts tramite un'API compatibile con OpenAI. Tutti i modelli Trinity sono distribuiti con licenza Apache 2.0. Arcee è un plugin ufficiale di OpenClaw, non incluso nel core, quindi deve essere installato prima della configurazione iniziale.

Accedi ai modelli Arcee direttamente tramite la piattaforma Arcee oppure tramite [OpenRouter](/it/providers/openrouter).

| Proprietà | Valore                                                                                |
| --------- | ------------------------------------------------------------------------------------- |
| Provider  | `arcee`                                                                               |
| Autenticazione | `ARCEEAI_API_KEY` (diretta) o `OPENROUTER_API_KEY` (tramite OpenRouter)          |
| API       | Compatibile con OpenAI                                                               |
| URL di base | `https://api.arcee.ai/api/v1` (diretta) o `https://openrouter.ai/api/v1` (OpenRouter) |

## Installare il plugin

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

## Per iniziare

<Tabs>
  <Tab title="Direttamente (piattaforma Arcee)">
    <Steps>
      <Step title="Ottenere una chiave API">
        Crea una chiave API su [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Eseguire la configurazione iniziale">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Impostare un modello predefinito">
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
      <Step title="Ottenere una chiave API">
        Crea una chiave API su [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="Eseguire la configurazione iniziale">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Impostare un modello predefinito">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        Gli stessi riferimenti ai modelli funzionano sia per le configurazioni dirette sia per quelle tramite OpenRouter.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configurazione non interattiva

<Tabs>
  <Tab title="Direttamente (piattaforma Arcee)">
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

| Riferimento del modello        | Nome                   | Input | Contesto | Output massimo | Costo (input/output per 1 mln) | Strumenti | Note                                      |
| ------------------------------ | ---------------------- | ----- | -------- | -------------- | ------------------------------ | --------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | testo | 256K     | 80K            | $0.25 / $0.90                  | No        | Modello predefinito; ragionamento esteso  |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | testo | 128K     | 16K            | $0.25 / $1.00                  | Sì        | Uso generico; 400 mld di parametri, 13 mld attivi |
| `arcee/trinity-mini`           | Trinity Mini 26B       | testo | 128K     | 80K            | $0.045 / $0.15                 | Sì        | Veloce ed economico; chiamata di funzioni |

<Tip>
La configurazione predefinita della procedura iniziale imposta `arcee/trinity-large-thinking` come modello predefinito.
</Tip>

## Funzionalità supportate

| Funzionalità                                      | Supporto                                     |
| ------------------------------------------------- | -------------------------------------------- |
| Streaming                                         | Sì                                           |
| Uso degli strumenti / chiamata di funzioni        | Sì (Trinity Mini, Trinity Large Preview)     |
| Output strutturato (modalità JSON e schema JSON)   | Sì                                           |
| Ragionamento esteso                               | Sì (Trinity Large Thinking; strumenti disabilitati) |

<AccordionGroup>
  <Accordion title="Nota sull'ambiente">
    Se il Gateway viene eseguito come demone (launchd/systemd), assicurati che `ARCEEAI_API_KEY`
    (o `OPENROUTER_API_KEY`) sia disponibile per tale processo, ad esempio in
    `~/.openclaw/.env` o tramite `env.shellEnv`.
  </Accordion>

  <Accordion title="Instradamento tramite OpenRouter">
    Quando utilizzi i modelli Arcee tramite OpenRouter, si applicano gli stessi riferimenti ai modelli `arcee/*`.
    OpenClaw esegue l'instradamento in modo trasparente in base alla scelta di autenticazione. Consulta la
    [documentazione del provider OpenRouter](/it/providers/openrouter) per i dettagli di configurazione
    specifici di OpenRouter.
  </Accordion>
</AccordionGroup>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/it/providers/openrouter" icon="shuffle">
    Accedi ai modelli Arcee e a molti altri tramite un'unica chiave API.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
</CardGroup>
