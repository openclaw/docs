---
read_when:
    - Você quer modelos Xiaomi MiMo no OpenClaw
    - Você precisa configurar `XIAOMI_API_KEY`
summary: Use modelos Xiaomi MiMo com o OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-25T13:55:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7781973c3a1d14101cdb0a8d1affe3fd076a968552ed2a8630a91a8947daeb3a
    source_path: providers/xiaomi.md
    workflow: 15
---

Xiaomi MiMo é a plataforma de API para modelos **MiMo**. O OpenClaw usa o endpoint
compatível com OpenAI da Xiaomi com autenticação por chave de API.

| Propriedade | Valor                           |
| ----------- | ------------------------------- |
| Provedor    | `xiaomi`                        |
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

## Catálogo incluído

| Model ref              | Entrada      | Contexto  | Saída máx. | Raciocínio | Observações   |
| ---------------------- | ------------ | --------- | ---------- | ---------- | ------------- |
| `xiaomi/mimo-v2-flash` | texto        | 262.144   | 8.192      | Não        | Modelo padrão |
| `xiaomi/mimo-v2-pro`   | texto        | 1.048.576 | 32.000     | Sim        | Contexto amplo |
| `xiaomi/mimo-v2-omni`  | texto, imagem | 262.144  | 32.000     | Sim        | Multimodal    |

<Tip>
O model ref padrão é `xiaomi/mimo-v2-flash`. O provedor é injetado automaticamente quando `XIAOMI_API_KEY` está definido ou existe um perfil de autenticação.
</Tip>

## Texto para fala

O Plugin incluído `xiaomi` também registra Xiaomi MiMo como provedor de fala para
`messages.tts`. Ele chama o contrato TTS de chat-completions da Xiaomi com o texto como
mensagem `assistant` e orientação opcional de estilo como mensagem `user`.

| Propriedade | Valor                                    |
| ----------- | ---------------------------------------- |
| Id de TTS   | `xiaomi` (alias `mimo`)                  |
| Autenticação | `XIAOMI_API_KEY`                        |
| API         | `POST /v1/chat/completions` com `audio` |
| Padrão      | `mimo-v2.5-tts`, voz `mimo_default`     |
| Saída       | MP3 por padrão; WAV quando configurado  |

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "Tom brilhante, natural e conversacional.",
        },
      },
    },
  },
}
```

As vozes incluídas compatíveis incluem `mimo_default`, `default_zh`, `default_en`,
`Mia`, `Chloe`, `Milo` e `Dean`. `mimo-v2-tts` é compatível com contas TTS
MiMo mais antigas; o padrão usa o modelo TTS atual MiMo-V2.5. Para destinos de
nota de voz, como Feishu e Telegram, o OpenClaw transcodifica a saída da Xiaomi para Opus
48kHz com `ffmpeg` antes da entrega.

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
    O provedor `xiaomi` é injetado automaticamente quando `XIAOMI_API_KEY` está definido no seu ambiente ou existe um perfil de autenticação. Você não precisa configurar o provedor manualmente, a menos que queira substituir metadados do modelo ou a URL base.
  </Accordion>

  <Accordion title="Detalhes do modelo">
    - **mimo-v2-flash** — leve e rápido, ideal para tarefas gerais de texto. Sem suporte a raciocínio.
    - **mimo-v2-pro** — oferece suporte a raciocínio com janela de contexto de 1M tokens para cargas de trabalho com documentos longos.
    - **mimo-v2-omni** — modelo multimodal com raciocínio habilitado que aceita entradas de texto e imagem.

    <Note>
    Todos os modelos usam o prefixo `xiaomi/` (por exemplo `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="Solução de problemas">
    - Se os modelos não aparecerem, confirme que `XIAOMI_API_KEY` está definido e é válido.
    - Quando o Gateway é executado como daemon, garanta que a chave esteja disponível para esse processo (por exemplo em `~/.openclaw/.env` ou via configuração `env.shellEnv`).

    <Warning>
    Chaves definidas apenas no seu shell interativo não ficam visíveis para processos de gateway gerenciados por daemon. Use `~/.openclaw/.env` ou a configuração `env.shellEnv` para disponibilidade persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolhendo provedores, model refs e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração do OpenClaw.
  </Card>
  <Card title="Console Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Painel do Xiaomi MiMo e gerenciamento de chaves de API.
  </Card>
</CardGroup>
