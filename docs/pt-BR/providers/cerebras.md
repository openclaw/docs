---
read_when:
    - Você quer usar o Cerebras com o OpenClaw
    - Você precisa da variável de ambiente da chave da API da Cerebras ou da opção de autenticação da CLI
summary: Configuração do Cerebras (autenticação + seleção de modelo)
title: Cerebras
x-i18n:
    generated_at: "2026-04-30T10:03:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96f94b23e55340414633ff48e352623907ee36dd2715e5ab053a93c86df1b49a
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) fornece inferência de alta velocidade compatível com OpenAI.

| Propriedade | Valor                        |
| -------- | ---------------------------- |
| Provedor | `cerebras`                   |
| Autenticação     | `CEREBRAS_API_KEY`           |
| API      | Compatível com OpenAI            |
| URL base | `https://api.cerebras.ai/v1` |

## Primeiros passos

<Steps>
  <Step title="Get an API key">
    Crie uma chave de API no [Cerebras Cloud Console](https://cloud.cerebras.ai).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice cerebras-api-key
    ```
  </Step>
  <Step title="Verify models are available">
    ```bash
    openclaw models list --provider cerebras
    ```
  </Step>
</Steps>

### Configuração não interativa

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## Catálogo integrado

O OpenClaw inclui um catálogo estático da Cerebras para o endpoint público compatível com OpenAI:

| Ref. do modelo                                 | Nome                 | Observações                                  |
| ----------------------------------------- | -------------------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | Modelo padrão; modelo de raciocínio em prévia |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | Modelo de raciocínio de produção             |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | Modelo sem raciocínio em prévia            |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | Modelo de produção com foco em velocidade         |

<Warning>
A Cerebras marca `zai-glm-4.7` e `qwen-3-235b-a22b-instruct-2507` como modelos em prévia, e `llama3.1-8b` / `qwen-3-235b-a22b-instruct-2507` estão documentados para descontinuação em 27 de maio de 2026. Verifique a página de modelos compatíveis da Cerebras antes de depender deles em produção.
</Warning>

## Configuração manual

O Plugin incluído normalmente significa que você só precisa da chave de API. Use a configuração explícita de
`models.providers.cerebras` quando quiser substituir os metadados do modelo:

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
Se o Gateway for executado como um daemon (launchd/systemd), garanta que `CEREBRAS_API_KEY`
esteja disponível para esse processo, por exemplo em `~/.openclaw/.env` ou por meio de
`env.shellEnv`.
</Note>
