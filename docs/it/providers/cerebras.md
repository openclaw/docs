---
read_when:
    - Vuoi usare Cerebras con OpenClaw
    - È necessaria la variabile d'ambiente della chiave API Cerebras oppure la scelta di autenticazione CLI
summary: Configurazione di Cerebras (autenticazione + selezione del modello)
title: Cerebras
x-i18n:
    generated_at: "2026-06-27T18:05:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd21756ac521c7b60ca6d3dfbef8665574dca52d1a25e6293169b24f4af6273e
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) fornisce inferenza ad alta velocità compatibile con OpenAI su hardware di inferenza personalizzato. Il Plugin del provider Cerebras include un catalogo statico di quattro modelli.

| Proprietà       | Valore                                   |
| --------------- | ---------------------------------------- |
| ID provider     | `cerebras`                               |
| Plugin          | pacchetto esterno ufficiale              |
| Variabile env auth | `CEREBRAS_API_KEY`                    |
| Flag di onboarding | `--auth-choice cerebras-api-key`      |
| Flag CLI diretto | `--cerebras-api-key <key>`              |
| API             | compatibile con OpenAI (`openai-completions`) |
| URL di base     | `https://api.cerebras.ai/v1`             |
| Modello predefinito | `cerebras/zai-glm-4.7`               |

## Installa il Plugin

Installa il Plugin ufficiale, quindi riavvia Gateway:

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## Per iniziare

<Steps>
  <Step title="Get an API key">
    Crea una chiave API nella [Console Cloud di Cerebras](https://cloud.cerebras.ai).
  </Step>
  <Step title="Run onboarding">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice cerebras-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Env only
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Verify models are available">
    ```bash
    openclaw models list --provider cerebras
    ```

    L'elenco dovrebbe includere tutti e quattro i modelli statici. Se `CEREBRAS_API_KEY` non viene risolto, `openclaw models status --json` segnala la credenziale mancante in `auth.unusableProfiles`.

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

OpenClaw include un catalogo statico Cerebras che rispecchia l'endpoint pubblico compatibile con OpenAI. Tutti e quattro i modelli condividono un contesto da 128k e 8.192 token di output massimi.

| Riferimento modello                      | Nome                 | Ragionamento | Note                                  |
| ----------------------------------------- | -------------------- | ------------ | ------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | sì           | Modello predefinito; modello di ragionamento in anteprima |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | sì           | Modello di ragionamento di produzione |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | no           | Modello senza ragionamento in anteprima |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | no           | Modello di produzione ottimizzato per la velocità |

<Warning>
  Cerebras contrassegna `zai-glm-4.7` e `qwen-3-235b-a22b-instruct-2507` come modelli in anteprima, e `llama3.1-8b` più `qwen-3-235b-a22b-instruct-2507` sono documentati per la deprecazione il 27 maggio 2026. Controlla la pagina dei modelli supportati di Cerebras prima di fare affidamento su di essi per carichi di lavoro di produzione.
</Warning>

## Configurazione manuale

Il Plugin di solito significa che ti serve solo la chiave API. Usa la configurazione esplicita `models.providers.cerebras` quando vuoi sovrascrivere i metadati del modello o eseguire in `mode: "merge"` rispetto al catalogo statico:

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
  Se Gateway viene eseguito come daemon (launchd, systemd, Docker), assicurati che `CEREBRAS_API_KEY` sia disponibile per quel processo, ad esempio in `~/.openclaw/.env` o tramite `env.shellEnv`. Una chiave esportata solo in una shell interattiva non aiuterà un servizio gestito a meno che l'env non venga importato separatamente.
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Model providers" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti modello e comportamento di failover.
  </Card>
  <Card title="Thinking modes" href="/it/tools/thinking" icon="brain">
    Livelli di impegno di ragionamento per i due modelli Cerebras con capacità di ragionamento.
  </Card>
  <Card title="Configuration reference" href="/it/gateway/config-agents#agent-defaults" icon="gear">
    Impostazioni predefinite degli agenti e configurazione dei modelli.
  </Card>
  <Card title="Models FAQ" href="/it/help/faq-models" icon="circle-question">
    Profili di auth, cambio di modelli e risoluzione degli errori "no profile".
  </Card>
</CardGroup>
