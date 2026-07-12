---
read_when:
    - Vuoi utilizzare Meta con OpenClaw
    - È necessaria la variabile d'ambiente MODEL_API_KEY o la scelta di autenticazione della CLI
summary: Configurazione di Meta (autenticazione + selezione del modello muse-spark-1.1)
title: Meta
x-i18n:
    generated_at: "2026-07-12T07:25:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2ce7616d9abc14a2d15ee53ea7725d3e70059af1a38bb61dbfe5b3969106432
    source_path: providers/meta.md
    workflow: 16
---

La **Meta API** utilizza la **Responses API** compatibile con OpenAI (`POST /v1/responses`)
per il modello di ragionamento `muse-spark-1.1`. Il provider viene distribuito come Plugin
OpenClaw incluso.

| Proprietà                | Valore                             |
| ------------------------ | ---------------------------------- |
| ID provider              | `meta`                             |
| Plugin                   | provider incluso                   |
| Variabile d'ambiente di autenticazione | `MODEL_API_KEY`        |
| Flag di configurazione iniziale | `--auth-choice meta-api-key` |
| Flag CLI diretto         | `--meta-api-key <key>`             |
| API                      | Responses API (`openai-responses`) |
| URL di base              | `https://api.meta.ai/v1`           |
| Modello predefinito      | `meta/muse-spark-1.1`              |
| Ragionamento predefinito | `high` (`reasoning.effort`)        |

## Per iniziare

<Steps>
  <Step title="Imposta la chiave API">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice meta-api-key
```

```bash Direct flag
openclaw onboard --non-interactive --accept-risk \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

```bash Env only
export MODEL_API_KEY=<key>
```

    </CodeGroup>

  </Step>
  <Step title="Verifica che i modelli siano disponibili">
    ```bash
    openclaw models list --provider meta
    ```

    Elenca la voce statica del catalogo `muse-spark-1.1`. Se `MODEL_API_KEY` non viene risolta,
    `openclaw models status --json` segnala la credenziale mancante in
    `auth.unusableProfiles`.

  </Step>
</Steps>

## Configurazione non interattiva

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

## Catalogo integrato

| Riferimento modello      | Nome           | Ragionamento | Finestra di contesto | Output massimo |
| ------------------------ | -------------- | ------------ | -------------------- | -------------- |
| `meta/muse-spark-1.1`    | Muse Spark 1.1 | sì           | 1,048,576            | 131,072        |

Funzionalità:

- Input di testo e immagini
- Chiamata di strumenti e streaming
- Livello di ragionamento: `minimal`, `low`, `medium`, `high`, `xhigh` (predefinito: `high`)
- Riproduzione senza stato del ragionamento crittografato (`store: false`, `include: ["reasoning.encrypted_content"]`)

<Warning>
`muse-spark-1.1` non accetta `reasoning.effort: "none"`. OpenClaw associa
`--thinking off` a `minimal` per questo provider.
</Warning>

## Configurazione manuale

```json5
{
  env: { MODEL_API_KEY: "<key>" },
  agents: {
    defaults: {
      model: { primary: "meta/muse-spark-1.1" },
      models: {
        "meta/muse-spark-1.1": { alias: "Muse Spark 1.1" },
      },
    },
  },
}
```

<Note>
Se il Gateway viene eseguito come daemon (launchd, systemd, Docker), assicurati che
`MODEL_API_KEY` sia disponibile per tale processo, ad esempio in
`~/.openclaw/.env` o tramite `env.shellEnv`. Una chiave esportata soltanto in una
shell interattiva non sarà disponibile per un servizio gestito, a meno che l'ambiente
non venga importato separatamente.
</Note>

## Test rapido

```bash
export MODEL_API_KEY=<key>
pnpm test:live -- extensions/meta/meta.live.test.ts
```

I test in tempo reale utilizzano `muse-spark-1.1` con `POST /v1/responses`.

## Risorse correlate

<CardGroup cols={2}>
  <Card title="Provider di modelli" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Modalità di ragionamento" href="/it/tools/thinking" icon="brain">
    Livelli di ragionamento per muse-spark-1.1.
  </Card>
  <Card title="Riferimento per la configurazione" href="/it/gateway/config-agents#agent-defaults" icon="gear">
    Impostazioni predefinite dell'agente e configurazione del modello.
  </Card>
</CardGroup>
