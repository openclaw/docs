---
read_when:
    - Você quer modelos Xiaomi MiMo no OpenClaw
    - Você precisa configurar `XIAOMI_API_KEY`
summary: Use modelos Xiaomi MiMo com o OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-24T06:10:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae61547fa5864f0cd3e19465a8a7d6ff843f9534ab9c2dd39a86a3593cafaa8d
    source_path: providers/xiaomi.md
    workflow: 15
---

Xiaomi MiMo é a plataforma de API para modelos **MiMo**. O OpenClaw usa o
endpoint compatível com OpenAI da Xiaomi com autenticação por chave de API.

| Property | Value                           |
| -------- | ------------------------------- |
| Provider | `xiaomi`                        |
| Auth     | `XIAOMI_API_KEY`                |
| API      | Compatível com OpenAI           |
| Base URL | `https://api.xiaomimimo.com/v1` |

## Primeiros passos

<Steps>
  <Step title="Obtenha uma chave de API">
    Crie uma chave de API no [console Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys).
  </Step>
  <Step title="Execute o onboarding">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Ou passe a chave diretamente:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="Verifique se o modelo está disponível">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## Catálogo incluído

| Model ref              | Input       | Context   | Max output | Reasoning | Notes            |
| ---------------------- | ----------- | --------- | ---------- | --------- | ---------------- |
| `xiaomi/mimo-v2-flash` | text        | 262,144   | 8,192      | No        | Modelo padrão    |
| `xiaomi/mimo-v2-pro`   | text        | 1,048,576 | 32,000     | Yes       | Contexto grande  |
| `xiaomi/mimo-v2-omni`  | text, image | 262,144   | 32,000     | Yes       | Multimodal       |

<Tip>
A ref do modelo padrão é `xiaomi/mimo-v2-flash`. O provedor é injetado automaticamente quando `XIAOMI_API_KEY` está definido ou existe um perfil de autenticação.
</Tip>

## Exemplo de configuração

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Comportamento de injeção automática">
    O provedor `xiaomi` é injetado automaticamente quando `XIAOMI_API_KEY` está definido no seu ambiente ou existe um perfil de autenticação. Você não precisa configurar manualmente o provedor, a menos que queira substituir metadados de modelo ou a base URL.
  </Accordion>

  <Accordion title="Detalhes do modelo">
    - **mimo-v2-flash** — leve e rápido, ideal para tarefas gerais de texto. Sem suporte a raciocínio.
    - **mimo-v2-pro** — suporta raciocínio com uma janela de contexto de 1M tokens para cargas de trabalho com documentos longos.
    - **mimo-v2-omni** — modelo multimodal com raciocínio ativado que aceita entradas de texto e imagem.

    <Note>
    Todos os modelos usam o prefixo `xiaomi/` (por exemplo `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="Solução de problemas">
    - Se os modelos não aparecerem, confirme que `XIAOMI_API_KEY` está definido e válido.
    - Quando o Gateway é executado como daemon, garanta que a chave esteja disponível para esse processo (por exemplo em `~/.openclaw/.env` ou via `env.shellEnv`).

    <Warning>
    Chaves definidas apenas no seu shell interativo não ficam visíveis para processos de gateway gerenciados por daemon. Use `~/.openclaw/.env` ou a configuração `env.shellEnv` para disponibilidade persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração do OpenClaw.
  </Card>
  <Card title="Console Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Dashboard do Xiaomi MiMo e gerenciamento de chaves de API.
  </Card>
</CardGroup>
