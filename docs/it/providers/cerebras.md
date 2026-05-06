---
read_when:
    - Vuoi usare Cerebras con OpenClaw
    - È necessaria la variabile d'ambiente della chiave API di Cerebras oppure l'opzione di autenticazione CLI
summary: Configurazione di Cerebras (autenticazione + selezione del modello)
title: Cerebras
x-i18n:
    generated_at: "2026-05-06T09:04:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ba12fcc214ac756111a94f16ec619d26dc01ee2acc1eaef013fcb70bf752610
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) offre inferenza ad alta velocità compatibile con OpenAI su hardware di inferenza personalizzato. OpenClaw include un Plugin provider Cerebras integrato con un catalogo statico di quattro modelli.

| Proprietà       | Valore                                   |
| --------------- | ---------------------------------------- |
| ID provider     | `cerebras`                               |
| Plugin          | integrato, `enabledByDefault: true`      |
| Variabile env auth | `CEREBRAS_API_KEY`                    |
| Flag di onboarding | `--auth-choice cerebras-api-key`      |
| Flag CLI diretto | `--cerebras-api-key <key>`              |
| API             | compatibile con OpenAI (`openai-completions`) |
| URL di base     | `https://api.cerebras.ai/v1`             |
| Modello predefinito | `cerebras/zai-glm-4.7`               |

## Per iniziare

<Steps>
  <Step title="Ottieni una chiave API">
    Crea una chiave API nella [Cerebras Cloud Console](https://cloud.cerebras.ai).
  </Step>
  <Step title="Esegui l’onboarding">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice cerebras-api-key
```

```bash Flag diretto
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Solo env
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Verifica che i modelli siano disponibili">
    ```bash
    openclaw models list --provider cerebras
    ```

    L’elenco dovrebbe includere tutti e quattro i modelli integrati. Se `CEREBRAS_API_KEY` non viene risolto, `openclaw models status --json` segnala la credenziale mancante in `auth.unusableProfiles`.

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

OpenClaw include un catalogo Cerebras statico che rispecchia l’endpoint pubblico compatibile con OpenAI. Tutti e quattro i modelli condividono un contesto da 128k e 8.192 token di output massimo.

| Rif. modello                              | Nome                 | Ragionamento | Note                                  |
| ----------------------------------------- | -------------------- | ------------ | -------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | sì           | Modello predefinito; modello di ragionamento in anteprima |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | sì           | Modello di ragionamento di produzione |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | no           | Modello in anteprima senza ragionamento |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | no           | Modello di produzione ottimizzato per la velocità |

<Warning>
  Cerebras contrassegna `zai-glm-4.7` e `qwen-3-235b-a22b-instruct-2507` come modelli in anteprima, mentre `llama3.1-8b` e `qwen-3-235b-a22b-instruct-2507` sono documentati per la deprecazione il 27 maggio 2026. Controlla la pagina dei modelli supportati di Cerebras prima di usarli per carichi di lavoro di produzione.
</Warning>

## Configurazione manuale

Il Plugin integrato di solito significa che ti serve solo la chiave API. Usa la configurazione esplicita `models.providers.cerebras` quando vuoi sovrascrivere i metadati dei modelli o eseguire in `mode: "merge"` rispetto al catalogo statico:

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
  Se il Gateway viene eseguito come daemon (launchd, systemd, Docker), assicurati che `CEREBRAS_API_KEY` sia disponibile per quel processo, per esempio in `~/.openclaw/.env` o tramite `env.shellEnv`. Una chiave presente solo in `~/.profile` non aiuterà un servizio gestito, a meno che l’env non venga importato separatamente.
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Provider di modelli" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti dei modelli e comportamento di failover.
  </Card>
  <Card title="Modalità di pensiero" href="/it/tools/thinking" icon="brain">
    Livelli di impegno di ragionamento per i due modelli Cerebras con capacità di ragionamento.
  </Card>
  <Card title="Riferimento di configurazione" href="/it/gateway/config-agents#agent-defaults" icon="gear">
    Valori predefiniti degli agenti e configurazione dei modelli.
  </Card>
  <Card title="FAQ sui modelli" href="/it/help/faq-models" icon="circle-question">
    Profili auth, cambio dei modelli e risoluzione degli errori "no profile".
  </Card>
</CardGroup>
