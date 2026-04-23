---
read_when:
    - Vuoi usare Volcano Engine o i modelli Doubao con OpenClaw
    - Hai bisogno della configurazione della chiave API Volcengine
summary: Configurazione di Volcano Engine (modelli Doubao, endpoint generali + di coding)
title: Volcano Engine (Doubao)
x-i18n:
    generated_at: "2026-04-23T08:35:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d803e965699bedf06cc7ea4e902ffc92e4a168be012224e845820069fd67acc
    source_path: providers/volcengine.md
    workflow: 15
---

# Volcano Engine (Doubao)

Il provider Volcano Engine fornisce accesso ai modelli Doubao e ai modelli di terze parti
ospitati su Volcano Engine, con endpoint separati per carichi di lavoro generali e
di coding.

| Dettaglio | Valore                                              |
| --------- | --------------------------------------------------- |
| Provider  | `volcengine` (generale) + `volcengine-plan` (coding) |
| Auth      | `VOLCANO_ENGINE_API_KEY`                            |
| API       | Compatibile con OpenAI                              |

## Per iniziare

<Steps>
  <Step title="Imposta la chiave API">
    Esegui l'onboarding interattivo:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Questo registra sia il provider generale (`volcengine`) sia quello di coding (`volcengine-plan`) a partire da una singola chiave API.

  </Step>
  <Step title="Imposta un modello predefinito">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="Verifica che il modello sia disponibile">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Per la configurazione non interattiva (CI, scripting), passa direttamente la chiave:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Provider ed endpoint

| Provider          | Endpoint                                  | Caso d'uso       |
| ----------------- | ----------------------------------------- | ---------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Modelli generali |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Modelli di coding |

<Note>
Entrambi i provider vengono configurati a partire da una singola chiave API. La configurazione li registra entrambi automaticamente.
</Note>

## Modelli disponibili

<Tabs>
  <Tab title="Generale (volcengine)">
    | Riferimento modello                            | Nome                            | Input       | Contesto |
    | ---------------------------------------------- | ------------------------------- | ----------- | -------- |
    | `volcengine/doubao-seed-1-8-251228`            | Doubao Seed 1.8                 | text, image | 256,000  |
    | `volcengine/doubao-seed-code-preview-251028`   | doubao-seed-code-preview-251028 | text, image | 256,000  |
    | `volcengine/kimi-k2-5-260127`                  | Kimi K2.5                       | text, image | 256,000  |
    | `volcengine/glm-4-7-251222`                    | GLM 4.7                         | text, image | 200,000  |
    | `volcengine/deepseek-v3-2-251201`              | DeepSeek V3.2                   | text, image | 128,000  |
  </Tab>
  <Tab title="Coding (volcengine-plan)">
    | Riferimento modello                                 | Nome                     | Input | Contesto |
    | --------------------------------------------------- | ------------------------ | ----- | -------- |
    | `volcengine-plan/ark-code-latest`                   | Ark Coding Plan          | text  | 256,000  |
    | `volcengine-plan/doubao-seed-code`                  | Doubao Seed Code         | text  | 256,000  |
    | `volcengine-plan/glm-4.7`                           | GLM 4.7 Coding           | text  | 200,000  |
    | `volcengine-plan/kimi-k2-thinking`                  | Kimi K2 Thinking         | text  | 256,000  |
    | `volcengine-plan/kimi-k2.5`                         | Kimi K2.5 Coding         | text  | 256,000  |
    | `volcengine-plan/doubao-seed-code-preview-251028`   | Doubao Seed Code Preview | text  | 256,000  |
  </Tab>
</Tabs>

## Note avanzate

<AccordionGroup>
  <Accordion title="Modello predefinito dopo l'onboarding">
    `openclaw onboard --auth-choice volcengine-api-key` attualmente imposta
    `volcengine-plan/ark-code-latest` come modello predefinito registrando al tempo stesso
    il catalogo generale `volcengine`.
  </Accordion>

  <Accordion title="Comportamento di fallback del selettore di modelli">
    Durante onboarding/configurazione della selezione dei modelli, la scelta auth Volcengine preferisce
    sia le righe `volcengine/*` sia quelle `volcengine-plan/*`. Se quei modelli non sono ancora
    caricati, OpenClaw usa come fallback il catalogo non filtrato invece di mostrare un
    selettore limitato al provider vuoto.
  </Accordion>

  <Accordion title="Variabili d'ambiente per processi daemon">
    Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che
    `VOLCANO_ENGINE_API_KEY` sia disponibile per quel processo (per esempio in
    `~/.openclaw/.env` o tramite `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Quando esegui OpenClaw come servizio in background, le variabili d'ambiente impostate nella tua
shell interattiva non vengono ereditate automaticamente. Vedi la nota sul daemon sopra.
</Warning>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti ai modelli e comportamento di failover.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration" icon="gear">
    Riferimento completo della configurazione per agenti, modelli e provider.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Problemi comuni e passaggi di debug.
  </Card>
  <Card title="FAQ" href="/it/help/faq" icon="circle-question">
    Domande frequenti sulla configurazione di OpenClaw.
  </Card>
</CardGroup>
