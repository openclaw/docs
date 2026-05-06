---
read_when:
    - Você quer usar Cerebras com o OpenClaw
    - Você precisa da variável de ambiente da chave de API da Cerebras ou da opção de autenticação da CLI
summary: Configuração do Cerebras (autenticação + seleção de modelo)
title: Cerebras
x-i18n:
    generated_at: "2026-05-06T09:09:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ba12fcc214ac756111a94f16ec619d26dc01ee2acc1eaef013fcb70bf752610
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) fornece inferência de alta velocidade compatível com OpenAI em hardware de inferência personalizado. OpenClaw inclui um plugin de provedor Cerebras incluído com um catálogo estático de quatro modelos.

| Propriedade              | Valor                                    |
| ------------------------ | ---------------------------------------- |
| ID do provedor           | `cerebras`                               |
| Plugin                   | incluído, `enabledByDefault: true`       |
| Var. de env de auth      | `CEREBRAS_API_KEY`                       |
| Flag de onboarding       | `--auth-choice cerebras-api-key`         |
| Flag direta da CLI       | `--cerebras-api-key <key>`               |
| API                      | compatível com OpenAI (`openai-completions`) |
| URL base                 | `https://api.cerebras.ai/v1`             |
| Modelo padrão            | `cerebras/zai-glm-4.7`                   |

## Primeiros passos

<Steps>
  <Step title="Obtenha uma chave de API">
    Crie uma chave de API no [Cerebras Cloud Console](https://cloud.cerebras.ai).
  </Step>
  <Step title="Execute o onboarding">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice cerebras-api-key
```

```bash Flag direta
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Somente env
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Verifique se os modelos estão disponíveis">
    ```bash
    openclaw models list --provider cerebras
    ```

    A lista deve incluir todos os quatro modelos incluídos. Se `CEREBRAS_API_KEY` não for resolvida, `openclaw models status --json` relata a credencial ausente em `auth.unusableProfiles`.

  </Step>
</Steps>

## Configuração não interativa

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## Catálogo integrado

OpenClaw vem com um catálogo estático da Cerebras que espelha o endpoint público compatível com OpenAI. Todos os quatro modelos compartilham um contexto de 128k e 8.192 tokens de saída máximos.

| Ref. do modelo                            | Nome                 | Raciocínio | Observações                            |
| ----------------------------------------- | -------------------- | ---------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | sim        | Modelo padrão; modelo de raciocínio em prévia |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | sim        | Modelo de raciocínio de produção       |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | não        | Modelo em prévia sem raciocínio        |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | não        | Modelo de produção focado em velocidade |

<Warning>
  A Cerebras marca `zai-glm-4.7` e `qwen-3-235b-a22b-instruct-2507` como modelos em prévia, e `llama3.1-8b` mais `qwen-3-235b-a22b-instruct-2507` estão documentados para descontinuação em 27 de maio de 2026. Consulte a página de modelos compatíveis da Cerebras antes de depender deles para workloads de produção.
</Warning>

## Configuração manual

O plugin incluído geralmente significa que você só precisa da chave de API. Use a configuração explícita `models.providers.cerebras` quando quiser substituir metadados de modelo ou executar em `mode: "merge"` contra o catálogo estático:

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
  Se o Gateway for executado como daemon (launchd, systemd, Docker), garanta que `CEREBRAS_API_KEY` esteja disponível para esse processo — por exemplo, em `~/.openclaw/.env` ou por meio de `env.shellEnv`. Uma chave presente apenas em `~/.profile` não ajudará um serviço gerenciado, a menos que o env seja importado separadamente.
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Provedores de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs. de modelo e comportamento de failover.
  </Card>
  <Card title="Modos de pensamento" href="/pt-BR/tools/thinking" icon="brain">
    Níveis de esforço de raciocínio para os dois modelos Cerebras com capacidade de raciocínio.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/config-agents#agent-defaults" icon="gear">
    Padrões de agente e configuração de modelo.
  </Card>
  <Card title="FAQ de modelos" href="/pt-BR/help/faq-models" icon="circle-question">
    Perfis de autenticação, troca de modelos e resolução de erros de "no profile".
  </Card>
</CardGroup>
