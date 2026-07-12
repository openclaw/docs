---
read_when:
    - Vuoi usare Fireworks con OpenClaw
    - È necessaria la variabile d’ambiente della chiave API di Fireworks oppure l’ID del modello predefinito
    - Stai eseguendo il debug del comportamento di Kimi con la modalità di ragionamento disattivata su Fireworks
summary: Configurazione di Fireworks (autenticazione + selezione del modello)
title: Fuochi d'artificio
x-i18n:
    generated_at: "2026-07-12T07:27:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15feed0730ec65d943f103824468490be6616478ece80bedfeb9ad8137506180
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) espone modelli open-weight e instradati tramite un'API compatibile con OpenAI. Installa il Plugin provider ufficiale di Fireworks per usare due modelli Kimi già inclusi nel catalogo e qualsiasi modello o id router di Fireworks durante l'esecuzione.

| Proprietà                    | Valore                                                 |
| ---------------------------- | ------------------------------------------------------ |
| Id provider                  | `fireworks` (alias: `fireworks-ai`)                    |
| Pacchetto                    | `@openclaw/fireworks-provider`                         |
| Variabile di ambiente di autenticazione | `FIREWORKS_API_KEY`                         |
| Flag di configurazione iniziale | `--auth-choice fireworks-api-key`                   |
| Flag CLI diretto             | `--fireworks-api-key <key>`                            |
| API                          | Compatibile con OpenAI (`openai-completions`)          |
| URL di base                  | `https://api.fireworks.ai/inference/v1`                |
| Modello predefinito          | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Alias predefinito            | `Kimi K2.5 Turbo`                                      |

## Per iniziare

<Steps>
  <Step title="Installa il Plugin">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Imposta la chiave API di Fireworks">
    <CodeGroup>

```bash Configurazione iniziale
openclaw onboard --auth-choice fireworks-api-key
```

```bash Flag diretto
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Solo variabile di ambiente
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    La configurazione iniziale memorizza la chiave per il provider `fireworks` nei profili di autenticazione e imposta il router Kimi K2.5 Turbo **Fire Pass** come modello predefinito.

  </Step>
  <Step title="Verifica che il modello sia disponibile">
    ```bash
    openclaw models list --provider fireworks
    ```

    L'elenco dovrebbe includere `Kimi K2.6` e `Kimi K2.5 Turbo (Fire Pass)`. Se `FIREWORKS_API_KEY` non viene risolta, `openclaw models status --json` segnala la credenziale mancante in `auth.unusableProfiles`.

  </Step>
</Steps>

## Configurazione non interattiva

Per le installazioni tramite script o CI, passa tutti i parametri dalla riga di comando:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catalogo integrato

| Riferimento del modello                               | Nome                        | Input          | Contesto | Output massimo | Ragionamento                  |
| ----------------------------------------------------- | --------------------------- | -------------- | -------- | -------------- | ----------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | testo + immagine | 262.144  | 262.144        | Disattivato obbligatoriamente |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | testo + immagine | 256.000  | 256.000        | Disattivato obbligatoriamente (predefinito) |

<Note>
  OpenClaw imposta tutti i modelli Kimi di Fireworks su `thinking: off`, perché Kimi su Fireworks può esporre la catena di pensiero nella risposta visibile, a meno che la richiesta non disabiliti esplicitamente il ragionamento. Instradando direttamente lo stesso modello tramite [Moonshot](/it/providers/moonshot), l'output di ragionamento di Kimi viene mantenuto. Consulta le [modalità di ragionamento](/it/tools/thinking) per passare da un provider all'altro.
</Note>

## Id di modelli Fireworks personalizzati

OpenClaw accetta durante l'esecuzione qualsiasi id di modello o router di Fireworks. Usa l'id esatto mostrato da Fireworks e anteponi `fireworks/`. La risoluzione dinamica clona il modello di riferimento Fire Pass (input di testo e immagini, API compatibile con OpenAI, costo predefinito pari a zero) e disabilita automaticamente il ragionamento quando l'id corrisponde al modello Kimi. Gli id GLM dinamici vengono contrassegnati come di solo testo, a meno che non configuri una voce di modello personalizzata con input di immagini.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/models/<your-model-id>",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Funzionamento del prefisso degli id dei modelli">
    Ogni riferimento a un modello Fireworks in OpenClaw inizia con `fireworks/`, seguito dall'id esatto o dal percorso del router nella piattaforma Fireworks. Ad esempio:

    - Modello router: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Modello diretto: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw rimuove il prefisso `fireworks/` durante la costruzione della richiesta API e invia il percorso rimanente all'endpoint Fireworks come campo `model` compatibile con OpenAI.

  </Accordion>

  <Accordion title="Perché il ragionamento viene disattivato obbligatoriamente per Kimi">
    Fireworks fornisce Kimi senza un canale di ragionamento separato, pertanto la catena di pensiero può apparire nel flusso `content` visibile. In ogni richiesta Kimi di Fireworks, OpenClaw invia `thinking: { type: "disabled" }` e rimuove `reasoning`, `reasoning_effort` e `reasoningEffort` dal payload (`extensions/fireworks/stream.ts`). La policy del provider (`extensions/fireworks/thinking-policy.ts`) espone solo il livello di ragionamento `off` per gli id dei modelli Kimi, affinché i cambi manuali tramite `/think` e le interfacce della policy del provider rimangano coerenti con il contratto di runtime.

    Per usare il ragionamento di Kimi end-to-end, configura il [provider Moonshot](/it/providers/moonshot) e instrada lo stesso modello tramite esso.

  </Accordion>

  <Accordion title="Disponibilità dell'ambiente per il daemon">
    Se il Gateway viene eseguito come servizio gestito (launchd, systemd, Docker), la chiave Fireworks deve essere visibile a tale processo, non soltanto alla shell interattiva.

    <Warning>
      Una chiave esportata soltanto in una shell interattiva non sarà disponibile a un daemon launchd o systemd, a meno che l'ambiente non venga importato anche lì. Imposta la chiave in `~/.openclaw/.env` o tramite `env.shellEnv` per renderla leggibile dal processo Gateway.
    </Warning>

    OpenClaw carica `~/.openclaw/.env` insieme alla configurazione, quindi le chiavi memorizzate in tale file raggiungono i servizi Gateway gestiti su ogni piattaforma. Riavvia il Gateway (oppure esegui nuovamente `openclaw doctor --fix`) dopo aver sostituito la chiave.

  </Accordion>
</AccordionGroup>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Provider di modelli" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Modalità di ragionamento" href="/it/tools/thinking" icon="brain">
    Livelli di `/think`, policy dei provider e instradamento dei modelli con capacità di ragionamento.
  </Card>
  <Card title="Moonshot" href="/it/providers/moonshot" icon="moon">
    Esegui Kimi con l'output di ragionamento nativo tramite l'API di Moonshot.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Risoluzione generale dei problemi e domande frequenti.
  </Card>
</CardGroup>
