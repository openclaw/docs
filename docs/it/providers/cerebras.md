---
read_when:
    - Vuoi utilizzare Cerebras con OpenClaw
    - È necessaria la variabile d'ambiente della chiave API di Cerebras oppure l'opzione di autenticazione della CLI
summary: Configurazione di Cerebras (autenticazione + selezione del modello)
title: Cerebras
x-i18n:
    generated_at: "2026-07-12T07:23:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fca8110d345c796f0481ebf1a8d85c2cc9630b8bd55db8d4bf60772151b35b37
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) fornisce inferenza ad alta velocità compatibile con OpenAI su hardware di inferenza personalizzato. Il Plugin include un catalogo statico di quattro modelli (senza rilevamento in tempo reale).

| Proprietà                     | Valore                                                    |
| ----------------------------- | --------------------------------------------------------- |
| ID del provider               | `cerebras`                                                |
| Plugin                        | pacchetto esterno ufficiale (`@openclaw/cerebras-provider`) |
| Variabile d'ambiente di autenticazione | `CEREBRAS_API_KEY`                              |
| Flag di configurazione iniziale | `--auth-choice cerebras-api-key`                        |
| Flag CLI diretto              | `--cerebras-api-key <key>`                                |
| API                           | compatibile con OpenAI (`openai-completions`)             |
| URL di base                   | `https://api.cerebras.ai/v1`                              |
| Modello predefinito           | `cerebras/zai-glm-4.7`                                    |

## Installare il Plugin

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## Introduzione

<Steps>
  <Step title="Ottenere una chiave API">
    Crea una chiave API nella [console Cerebras Cloud](https://cloud.cerebras.ai).
  </Step>
  <Step title="Eseguire la configurazione iniziale">
    <CodeGroup>

```bash Configurazione iniziale
openclaw onboard --auth-choice cerebras-api-key
```

```bash Flag diretto
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Solo variabile d'ambiente
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Verificare che i modelli siano disponibili">
    ```bash
    openclaw models list --provider cerebras
    ```

    Elenca tutti e quattro i modelli statici. Se `CEREBRAS_API_KEY` non viene risolta, `openclaw models status --json` segnala la credenziale mancante in `auth.unusableProfiles`.

  </Step>
</Steps>

## Configurazione non interattiva

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## Catalogo integrato

Tutti e quattro i modelli condividono una finestra di contesto da 128.000 token e un limite massimo di 8.192 token di output.

| Riferimento del modello                   | Nome                 | Ragionamento | Note                                       |
| ----------------------------------------- | -------------------- | ------------ | ------------------------------------------ |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | sì           | Modello predefinito; modello di ragionamento in anteprima |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | sì           | Modello di ragionamento per la produzione  |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | no           | Modello senza ragionamento in anteprima    |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | no           | Modello per la produzione ottimizzato per la velocità |

<Warning>
Cerebras contrassegna `zai-glm-4.7` e `qwen-3-235b-a22b-instruct-2507` come modelli in anteprima; inoltre, per `llama3.1-8b` e `qwen-3-235b-a22b-instruct-2507` è documentata la dismissione il 27 maggio 2026. Consulta la [pagina dei modelli supportati](https://inference-docs.cerebras.ai/models/overview) di Cerebras prima di utilizzarli per carichi di lavoro di produzione.
</Warning>

## Configurazione manuale

Per la maggior parte delle configurazioni è necessaria solo la chiave API. Usa una configurazione esplicita di `models.providers.cerebras` per sovrascrivere i metadati dei modelli o per operare con `mode: "merge"` insieme al catalogo statico:

```json5
{
  env: { CEREBRAS_API_KEY: "csk-..." },
  agents: {
    defaults: {
      model: { primary: "cerebras/zai-glm-4.7" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "Z.ai GLM 4.7" },
          { id: "gpt-oss-120b", name: "GPT OSS 120B" },
        ],
      },
    },
  },
}
```

<Note>
Se il Gateway viene eseguito come daemon (launchd, systemd, Docker), assicurati che `CEREBRAS_API_KEY` sia disponibile per tale processo, ad esempio in `~/.openclaw/.env` o tramite `env.shellEnv`. Una chiave esportata soltanto in una shell interattiva non sarà disponibile per un servizio gestito, a meno che l'ambiente non venga importato separatamente.
</Note>

## Argomenti correlati

<CardGroup cols={2}>
  <Card title="Provider di modelli" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Modalità di ragionamento" href="/it/tools/thinking" icon="brain">
    Livelli di impegno di ragionamento per i due modelli Cerebras dotati di capacità di ragionamento.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/config-agents#agent-defaults" icon="gear">
    Impostazioni predefinite degli agenti e configurazione dei modelli.
  </Card>
  <Card title="Domande frequenti sui modelli" href="/it/help/faq-models" icon="circle-question">
    Profili di autenticazione, cambio dei modelli e risoluzione degli errori "nessun profilo".
  </Card>
</CardGroup>
