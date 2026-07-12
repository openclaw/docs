---
read_when:
    - Você quer usar a Cerebras com o OpenClaw
    - Você precisa da variável de ambiente da chave da API da Cerebras ou da opção de autenticação da CLI
summary: Configuração da Cerebras (autenticação + seleção de modelo)
title: Cerebras
x-i18n:
    generated_at: "2026-07-12T00:16:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fca8110d345c796f0481ebf1a8d85c2cc9630b8bd55db8d4bf60772151b35b37
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) fornece inferência de alta velocidade compatível com a OpenAI em hardware de inferência personalizado. O Plugin inclui um catálogo estático de quatro modelos (sem descoberta em tempo real).

| Propriedade                 | Valor                                                     |
| --------------------------- | --------------------------------------------------------- |
| ID do provedor              | `cerebras`                                                |
| Plugin                      | pacote externo oficial (`@openclaw/cerebras-provider`)    |
| Variável de ambiente de autenticação | `CEREBRAS_API_KEY`                              |
| Opção de integração inicial | `--auth-choice cerebras-api-key`                          |
| Opção direta da CLI         | `--cerebras-api-key <key>`                                |
| API                         | compatível com a OpenAI (`openai-completions`)            |
| URL base                    | `https://api.cerebras.ai/v1`                              |
| Modelo padrão               | `cerebras/zai-glm-4.7`                                    |

## Instalar o Plugin

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## Primeiros passos

<Steps>
  <Step title="Obter uma chave de API">
    Crie uma chave de API no [console do Cerebras Cloud](https://cloud.cerebras.ai).
  </Step>
  <Step title="Executar a integração inicial">
    <CodeGroup>

```bash Integração inicial
openclaw onboard --auth-choice cerebras-api-key
```

```bash Opção direta
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Somente variável de ambiente
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Verificar se os modelos estão disponíveis">
    ```bash
    openclaw models list --provider cerebras
    ```

    Lista todos os quatro modelos estáticos. Se `CEREBRAS_API_KEY` não puder ser resolvida, `openclaw models status --json` informará a credencial ausente em `auth.unusableProfiles`.

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

Todos os quatro modelos compartilham uma janela de contexto de 128 mil tokens e um limite máximo de saída de 8.192 tokens.

| Referência do modelo                      | Nome                 | Raciocínio | Observações                                      |
| ----------------------------------------- | -------------------- | ---------- | ------------------------------------------------ |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | sim        | Modelo padrão; modelo de raciocínio em prévia    |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | sim        | Modelo de raciocínio para produção               |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | não        | Modelo sem raciocínio em prévia                   |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | não        | Modelo para produção com foco em velocidade      |

<Warning>
A Cerebras classifica `zai-glm-4.7` e `qwen-3-235b-a22b-instruct-2507` como modelos em prévia, e a descontinuação de `llama3.1-8b` e `qwen-3-235b-a22b-instruct-2507` está documentada para 27 de maio de 2026. Consulte a [página de modelos compatíveis](https://inference-docs.cerebras.ai/models/overview) da Cerebras antes de depender deles para cargas de trabalho de produção.
</Warning>

## Configuração manual

A maioria das configurações precisa apenas da chave de API. Use uma configuração explícita em `models.providers.cerebras` para substituir os metadados dos modelos ou executar com `mode: "merge"` em conjunto com o catálogo estático:

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
Se o Gateway for executado como um daemon (launchd, systemd, Docker), verifique se `CEREBRAS_API_KEY` está disponível para esse processo — por exemplo, em `~/.openclaw/.env` ou por meio de `env.shellEnv`. Uma chave exportada apenas em um shell interativo não estará disponível para um serviço gerenciado, a menos que o ambiente seja importado separadamente.
</Note>

## Relacionados

<CardGroup cols={2}>
  <Card title="Provedores de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="Modos de pensamento" href="/pt-BR/tools/thinking" icon="brain">
    Níveis de esforço de raciocínio para os dois modelos da Cerebras com capacidade de raciocínio.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/config-agents#agent-defaults" icon="gear">
    Padrões dos agentes e configuração de modelos.
  </Card>
  <Card title="Perguntas frequentes sobre modelos" href="/pt-BR/help/faq-models" icon="circle-question">
    Perfis de autenticação, troca de modelos e resolução de erros de "nenhum perfil".
  </Card>
</CardGroup>
