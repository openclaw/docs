---
read_when:
    - Vuoi usare Fireworks con OpenClaw
    - È necessaria la variabile d'ambiente della chiave API Fireworks oppure l'ID del modello predefinito
    - Stai eseguendo il debug del comportamento di Kimi con ragionamento disattivato su Fireworks
summary: Configurazione di Fireworks (autenticazione + selezione del modello)
title: Fuochi d'artificio
x-i18n:
    generated_at: "2026-06-27T18:07:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7413ec9ea192921ce9b9ec51da5b0b9ff1030feeef192afbefc938ed200e192e
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) espone modelli open-weight e instradati tramite un'API compatibile con OpenAI. Installa il plugin ufficiale del provider Fireworks per usare due modelli Kimi pre-catalogati e qualsiasi modello Fireworks o id di router in fase di esecuzione.

| Proprietà       | Valore                                                 |
| --------------- | ------------------------------------------------------ |
| Id provider     | `fireworks` (alias: `fireworks-ai`)                    |
| Pacchetto       | `@openclaw/fireworks-provider`                         |
| Variabile env auth | `FIREWORKS_API_KEY`                                 |
| Flag di onboarding | `--auth-choice fireworks-api-key`                   |
| Flag CLI diretto | `--fireworks-api-key <key>`                           |
| API             | compatibile con OpenAI (`openai-completions`)          |
| URL base        | `https://api.fireworks.ai/inference/v1`                |
| Modello predefinito | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Alias predefinito | `Kimi K2.5 Turbo`                                    |

## Per iniziare

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Set the Fireworks API key">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice fireworks-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Env only
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    L'onboarding archivia la chiave associandola al provider `fireworks` nei tuoi profili di autenticazione e imposta il router Kimi K2.5 Turbo **Fire Pass** come modello predefinito.

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider fireworks
    ```

    L'elenco dovrebbe includere `Kimi K2.6` e `Kimi K2.5 Turbo (Fire Pass)`. Se `FIREWORKS_API_KEY` non viene risolto, `openclaw models status --json` segnala la credenziale mancante in `auth.unusableProfiles`.

  </Step>
</Steps>

## Configurazione non interattiva

Per installazioni con script o CI, passa tutto dalla riga di comando:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catalogo integrato

| Rif. modello                                           | Nome                        | Input        | Contesto | Output max | Thinking             |
| ------------------------------------------------------ | --------------------------- | ------------ | -------- | ---------- | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | testo + immagine | 262,144 | 262,144    | Disattivato forzatamente |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | testo + immagine | 256,000 | 256,000    | Disattivato forzatamente (predefinito) |

<Note>
  OpenClaw forza tutti i modelli Kimi di Fireworks su `thinking: off` perché Fireworks rifiuta i parametri di thinking Kimi in produzione. L'instradamento dello stesso modello direttamente tramite [Moonshot](/it/providers/moonshot) preserva l'output di ragionamento Kimi. Consulta le [modalità di thinking](/it/tools/thinking) per passare da un provider all'altro.
</Note>

## Id modello Fireworks personalizzati

OpenClaw accetta qualsiasi modello Fireworks o id di router in fase di esecuzione. Usa l'id esatto mostrato da Fireworks e anteponi `fireworks/`. La risoluzione dinamica clona il template Fire Pass (input testo + immagine, API compatibile con OpenAI, costo predefinito zero) e disabilita automaticamente il thinking quando l'id corrisponde al pattern Kimi. Gli id dinamici GLM sono contrassegnati come solo testo, a meno che tu non configuri una voce modello personalizzata con input immagine.

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
  <Accordion title="How model id prefixing works">
    Ogni riferimento modello Fireworks in OpenClaw inizia con `fireworks/`, seguito dall'id esatto o dal percorso router della piattaforma Fireworks. Per esempio:

    - Modello router: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Modello diretto: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw rimuove il prefisso `fireworks/` quando costruisce la richiesta API e invia il percorso restante all'endpoint Fireworks come campo `model` compatibile con OpenAI.

  </Accordion>

  <Accordion title="Why thinking is forced off for Kimi">
    Fireworks K2.6 restituisce un 400 se la richiesta contiene parametri `reasoning_*`, anche se Kimi supporta il thinking tramite l'API proprietaria di Moonshot. La policy del provider (`extensions/fireworks/thinking-policy.ts`) pubblicizza solo il livello di thinking `off` per gli id modello Kimi, quindi gli switch manuali `/think` e le superfici di policy del provider restano allineati al contratto di runtime.

    Per usare il ragionamento Kimi end-to-end, configura il [provider Moonshot](/it/providers/moonshot) e instrada lo stesso modello tramite quello.

  </Accordion>

  <Accordion title="Environment availability for the daemon">
    Se il Gateway viene eseguito come servizio gestito (launchd, systemd, Docker), la chiave Fireworks deve essere visibile a quel processo, non solo alla tua shell interattiva.

    <Warning>
      Una chiave esportata solo in una shell interattiva non sarà utile a un daemon launchd o systemd, a meno che quell'ambiente non venga importato anche lì. Imposta la chiave in `~/.openclaw/.env` o tramite `env.shellEnv` per renderla leggibile dal processo gateway.
    </Warning>

    Su macOS, `openclaw gateway install` collega già `~/.openclaw/.env` al file di ambiente del LaunchAgent. Riesegui l'installazione (o `openclaw doctor --fix`) dopo aver ruotato la chiave.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Model providers" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, riferimenti modello e comportamento di failover.
  </Card>
  <Card title="Thinking modes" href="/it/tools/thinking" icon="brain">
    Livelli `/think`, policy dei provider e instradamento di modelli capaci di ragionamento.
  </Card>
  <Card title="Moonshot" href="/it/providers/moonshot" icon="moon">
    Esegui Kimi con output di thinking nativo tramite l'API proprietaria di Moonshot.
  </Card>
  <Card title="Troubleshooting" href="/it/help/troubleshooting" icon="wrench">
    Risoluzione dei problemi generale e FAQ.
  </Card>
</CardGroup>
