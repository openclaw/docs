---
read_when:
    - Você quer modelos MiMo da Xiaomi no OpenClaw
    - Você precisa configurar `XIAOMI_API_KEY`
summary: Use modelos MiMo da Xiaomi com o OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-12T23:33:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: cd5a526764c796da7e1fff61301bc2ec618e1cf3857894ba2ef4b6dd9c4dc339
    source_path: providers/xiaomi.md
    workflow: 15
---

# Xiaomi MiMo

O Xiaomi MiMo é a plataforma de API para modelos **MiMo**. O OpenClaw usa o
endpoint compatível com OpenAI da Xiaomi com autenticação por chave de API.

| Propriedade | Valor                           |
| ----------- | ------------------------------- |
| Provider    | `xiaomi`                        |
| Autenticação | `XIAOMI_API_KEY`               |
| API         | Compatível com OpenAI           |
| URL base    | `https://api.xiaomimimo.com/v1` |

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

## Modelos disponíveis

| Referência de modelo    | Entrada     | Contexto  | Saída máx. | Raciocínio | Observações   |
| ----------------------- | ----------- | --------- | ---------- | ---------- | ------------- |
| `xiaomi/mimo-v2-flash`  | texto       | 262,144   | 8,192      | Não        | Modelo padrão |
| `xiaomi/mimo-v2-pro`    | texto       | 1,048,576 | 32,000     | Sim        | Contexto amplo |
| `xiaomi/mimo-v2-omni`   | texto, image | 262,144  | 32,000     | Sim        | Multimodal    |

<Tip>
A referência de modelo padrão é `xiaomi/mimo-v2-flash`. O provider é injetado automaticamente quando `XIAOMI_API_KEY` está definido ou quando existe um perfil de autenticação.
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
    O provider `xiaomi` é injetado automaticamente quando `XIAOMI_API_KEY` está definido no seu ambiente ou quando existe um perfil de autenticação. Você não precisa configurar manualmente o provider, a menos que queira substituir os metadados do modelo ou a URL base.
  </Accordion>

  <Accordion title="Detalhes do modelo">
    - **mimo-v2-flash** — leve e rápido, ideal para tarefas gerais de texto. Sem suporte a raciocínio.
    - **mimo-v2-pro** — oferece suporte a raciocínio com janela de contexto de 1M de tokens para cargas de trabalho com documentos longos.
    - **mimo-v2-omni** — modelo multimodal com raciocínio habilitado que aceita entradas de texto e imagem.

    <Note>
    Todos os modelos usam o prefixo `xiaomi/` (por exemplo `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="Solução de problemas">
    - Se os modelos não aparecerem, confirme que `XIAOMI_API_KEY` está definido e é válido.
    - Quando o Gateway é executado como daemon, garanta que a chave esteja disponível para esse processo (por exemplo em `~/.openclaw/.env` ou via `env.shellEnv`).

    <Warning>
    Chaves definidas apenas no seu shell interativo não ficam visíveis para processos de gateway gerenciados como daemon. Use `~/.openclaw/.env` ou a configuração `env.shellEnv` para disponibilidade persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de providers, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de configuração do OpenClaw.
  </Card>
  <Card title="Console Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Painel do Xiaomi MiMo e gerenciamento de chaves de API.
  </Card>
</CardGroup>
