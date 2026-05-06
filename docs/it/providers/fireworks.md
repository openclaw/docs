---
read_when:
    - Vuoi usare Fireworks con OpenClaw
    - È necessaria la variabile d’ambiente per la chiave API Fireworks o l’ID del modello predefinito
    - Stai eseguendo il debug del comportamento thinking-off di Kimi su Fireworks
summary: Configurazione di Fireworks (autenticazione + selezione del modello)
title: Fuochi d'artificio
x-i18n:
    generated_at: "2026-05-06T09:05:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a7dcaf6c7e1c004436213e67bc2262992ee1307cdaa5c290225345782f4cbfa
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) espone modelli open-weight e instradati tramite un'API compatibile con OpenAI. OpenClaw include un provider Plugin Fireworks in bundle fornito con due modelli Kimi pre-catalogati e accetta qualsiasi modello Fireworks o id router a runtime.

| Proprietà       | Valore                                                 |
| --------------- | ------------------------------------------------------ |
| Id provider     | `fireworks` (alias: `fireworks-ai`)                    |
| Plugin          | in bundle, `enabledByDefault: true`                    |
| Var env auth    | `FIREWORKS_API_KEY`                                    |
| Flag onboarding | `--auth-choice fireworks-api-key`                      |
| Flag CLI diretto | `--fireworks-api-key <key>`                           |
| API             | compatibile con OpenAI (`openai-completions`)          |
| URL base        | `https://api.fireworks.ai/inference/v1`                |
| Modello predefinito | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Alias predefinito | `Kimi K2.5 Turbo`                                    |

## Per iniziare

<Steps>
  <Step title="Imposta la chiave API Fireworks">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice fireworks-api-key
```

```bash Flag diretto
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Solo env
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    L'onboarding memorizza la chiave per il provider `fireworks` nei tuoi profili di autenticazione e imposta il router **Fire Pass** Kimi K2.5 Turbo come modello predefinito.

  </Step>
  <Step title="Verifica che il modello sia disponibile">
    ```bash
    openclaw models list --provider fireworks
    ```

    L'elenco dovrebbe includere `Kimi K2.6` e `Kimi K2.5 Turbo (Fire Pass)`. Se `FIREWORKS_API_KEY` non viene risolta, `openclaw models status --json` segnala la credenziale mancante in `auth.unusableProfiles`.

  </Step>
</Steps>

## Configurazione non interattiva

Per installazioni tramite script o CI, passa tutto dalla riga di comando:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catalogo integrato

| Rif modello                                            | Nome                        | Input        | Contesto | Output max | Thinking             |
| ------------------------------------------------------ | --------------------------- | ------------ | -------- | ---------- | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | testo + immagine | 262,144 | 262,144    | Forzato su off       |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | testo + immagine | 256,000 | 256,000    | Forzato su off (predefinito) |

<Note>
  OpenClaw imposta tutti i modelli Fireworks Kimi su `thinking: off` perché Fireworks rifiuta i parametri di thinking Kimi in produzione. Instradare lo stesso modello direttamente tramite [Moonshot](/it/providers/moonshot) preserva l'output di ragionamento di Kimi. Consulta le [modalità di thinking](/it/tools/thinking) per passare da un provider all'altro.
</Note>

## Id modello Fireworks personalizzati

OpenClaw accetta qualsiasi modello Fireworks o id router a runtime. Usa l'id esatto mostrato da Fireworks e anteponi `fireworks/`. La risoluzione dinamica clona il template Fire Pass (input testo + immagine, API compatibile con OpenAI, costo predefinito zero) e disabilita automaticamente il thinking quando l'id corrisponde al pattern Kimi.

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
  <Accordion title="Come funziona il prefisso degli id modello">
    Ogni riferimento a un modello Fireworks in OpenClaw inizia con `fireworks/` seguito dall'id esatto o dal percorso router della piattaforma Fireworks. Per esempio:

    - Modello router: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Modello diretto: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw rimuove il prefisso `fireworks/` quando costruisce la richiesta API e invia il percorso restante all'endpoint Fireworks come campo `model` compatibile con OpenAI.

  </Accordion>

  <Accordion title="Perché il thinking è forzato su off per Kimi">
    Fireworks K2.6 restituisce un 400 se la richiesta contiene parametri `reasoning_*`, anche se Kimi supporta il thinking tramite l'API propria di Moonshot. La policy in bundle (`extensions/fireworks/thinking-policy.ts`) dichiara solo il livello di thinking `off` per gli id modello Kimi, così gli switch manuali `/think` e le superfici delle policy provider restano allineati al contratto di runtime.

    Per usare il ragionamento Kimi end-to-end, configura il [provider Moonshot](/it/providers/moonshot) e instrada lo stesso modello tramite esso.

  </Accordion>

  <Accordion title="Disponibilità dell'ambiente per il daemon">
    Se il Gateway viene eseguito come servizio gestito (launchd, systemd, Docker), la chiave Fireworks deve essere visibile a quel processo, non solo alla tua shell interattiva.

    <Warning>
      Una chiave presente solo in `~/.profile` non aiuterà un daemon launchd o systemd a meno che quell'ambiente non venga importato anche lì. Imposta la chiave in `~/.openclaw/.env` o tramite `env.shellEnv` per renderla leggibile dal processo del gateway.
    </Warning>

    Su macOS, `openclaw gateway install` collega già `~/.openclaw/.env` al file ambiente del LaunchAgent. Riesegui l'installazione (o `openclaw doctor --fix`) dopo aver ruotato la chiave.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Provider di modelli" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti ai modelli e comportamento di failover.
  </Card>
  <Card title="Modalità di thinking" href="/it/tools/thinking" icon="brain">
    Livelli `/think`, policy provider e instradamento di modelli capaci di ragionamento.
  </Card>
  <Card title="Moonshot" href="/it/providers/moonshot" icon="moon">
    Esegui Kimi con output di thinking nativo tramite l'API propria di Moonshot.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Risoluzione generale dei problemi e FAQ.
  </Card>
</CardGroup>
