---
read_when:
    - Vuoi usare Cerebras con OpenClaw
    - È necessaria la variabile d'ambiente della chiave API di Cerebras oppure l'opzione di autenticazione CLI
summary: Configurazione di Cerebras (autenticazione + selezione del modello)
title: Cerebras
x-i18n:
    generated_at: "2026-04-30T09:07:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96f94b23e55340414633ff48e352623907ee36dd2715e5ab053a93c86df1b49a
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) fornisce inferenza ad alta velocità compatibile con OpenAI.

| Proprietà | Valore                      |
| -------- | ---------------------------- |
| Fornitore | `cerebras`                   |
| Autenticazione | `CEREBRAS_API_KEY`           |
| API      | Compatibile con OpenAI            |
| URL di base | `https://api.cerebras.ai/v1` |

## Per iniziare

<Steps>
  <Step title="Ottieni una chiave API">
    Crea una chiave API nella [Cerebras Cloud Console](https://cloud.cerebras.ai).
  </Step>
  <Step title="Esegui l'onboarding">
    ```bash
    openclaw onboard --auth-choice cerebras-api-key
    ```
  </Step>
  <Step title="Verifica che i modelli siano disponibili">
    ```bash
    openclaw models list --provider cerebras
    ```
  </Step>
</Steps>

### Configurazione non interattiva

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## Catalogo integrato

OpenClaw include un catalogo Cerebras statico per l'endpoint pubblico compatibile con OpenAI:

| Riferimento modello                     | Nome                 | Note                                  |
| ----------------------------------------- | -------------------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | Modello predefinito; modello di ragionamento in anteprima |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | Modello di ragionamento per produzione             |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | Modello senza ragionamento in anteprima            |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | Modello per produzione ottimizzato per la velocità         |

<Warning>
Cerebras contrassegna `zai-glm-4.7` e `qwen-3-235b-a22b-instruct-2507` come modelli in anteprima, e `llama3.1-8b` / `qwen-3-235b-a22b-instruct-2507` sono documentati per la deprecazione il 27 maggio 2026. Controlla la pagina dei modelli supportati di Cerebras prima di usarli in produzione.
</Warning>

## Configurazione manuale

Il Plugin incluso di solito significa che ti serve solo la chiave API. Usa una configurazione
`models.providers.cerebras` esplicita quando vuoi sovrascrivere i metadati del modello:

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
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
Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che `CEREBRAS_API_KEY`
sia disponibile per quel processo, ad esempio in `~/.openclaw/.env` o tramite
`env.shellEnv`.
</Note>
