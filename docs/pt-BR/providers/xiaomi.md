---
read_when:
    - Você quer modelos Xiaomi MiMo no OpenClaw
    - Você precisa ter XIAOMI_API_KEY configurada
summary: Use modelos Xiaomi MiMo com o OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-05-06T09:12:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7bb33bf107cb44414b0f3a6140d60fdfecb3b7154c3197e7cbed982d9a6450b
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo é a plataforma de API para os modelos **MiMo**. O OpenClaw inclui um Plugin `xiaomi` integrado que registra tanto um provedor de chat compatível com OpenAI quanto um provedor de fala (TTS) usando a mesma `XIAOMI_API_KEY`.

| Propriedade        | Valor                                    |
| --------------- | ---------------------------------------- |
| ID do provedor     | `xiaomi`                                 |
| Plugin          | integrado, `enabledByDefault: true`        |
| Variável de ambiente de autenticação    | `XIAOMI_API_KEY`                         |
| Flag de onboarding | `--auth-choice xiaomi-api-key`           |
| Flag direta da CLI | `--xiaomi-api-key <key>`                 |
| Contratos       | conclusões de chat + `speechProviders`     |
| API             | compatível com OpenAI (`openai-completions`) |
| URL base        | `https://api.xiaomimimo.com/v1`          |
| Modelo padrão   | `xiaomi/mimo-v2-flash`                   |
| Padrão de TTS     | `mimo-v2.5-tts`, voz `mimo_default`    |

## Primeiros passos

<Steps>
  <Step title="Obtenha uma chave de API">
    Crie uma chave de API no [console do Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys).
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

## Catálogo integrado

| Referência do modelo              | Entrada       | Contexto   | Saída máxima | Raciocínio | Observações         |
| ---------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | texto        | 262,144   | 8,192      | Não        | Modelo padrão |
| `xiaomi/mimo-v2-pro`   | texto        | 1,048,576 | 32,000     | Sim       | Contexto grande |
| `xiaomi/mimo-v2-omni`  | texto, imagem | 262,144   | 32,000     | Sim       | Multimodal    |

<Tip>
A referência do modelo padrão é `xiaomi/mimo-v2-flash`. O provedor é injetado automaticamente quando `XIAOMI_API_KEY` está definida ou quando existe um perfil de autenticação.
</Tip>

## Texto para fala

O Plugin `xiaomi` integrado também registra o Xiaomi MiMo como provedor de fala para
`messages.tts`. Ele chama o contrato TTS de conclusões de chat da Xiaomi com o texto como
uma mensagem `assistant` e orientações de estilo opcionais como uma mensagem `user`.

| Propriedade | Valor                                    |
| -------- | ---------------------------------------- |
| ID de TTS   | `xiaomi` (alias `mimo`)                  |
| Autenticação     | `XIAOMI_API_KEY`                         |
| API      | `POST /v1/chat/completions` com `audio` |
| Padrão  | `mimo-v2.5-tts`, voz `mimo_default`    |
| Saída   | MP3 por padrão; WAV quando configurado      |

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
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

As vozes integradas compatíveis incluem `mimo_default`, `default_zh`, `default_en`,
`Mia`, `Chloe`, `Milo` e `Dean`. `mimo-v2-tts` é compatível com contas TTS mais antigas do MiMo;
o padrão usa o modelo TTS MiMo-V2.5 atual. Para destinos de notas de voz
como Feishu e Telegram, o OpenClaw transcodifica a saída da Xiaomi para Opus a 48 kHz
com `ffmpeg` antes da entrega.

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
    O provedor `xiaomi` é injetado automaticamente quando `XIAOMI_API_KEY` está definida no seu ambiente ou quando existe um perfil de autenticação. Você não precisa configurar manualmente o provedor, a menos que queira substituir metadados de modelo ou a URL base.
  </Accordion>

  <Accordion title="Detalhes do modelo">
    - **mimo-v2-flash** — leve e rápido, ideal para tarefas de texto de uso geral. Sem suporte a raciocínio.
    - **mimo-v2-pro** — oferece suporte a raciocínio com uma janela de contexto de 1M tokens para cargas de trabalho com documentos longos.
    - **mimo-v2-omni** — modelo multimodal com raciocínio habilitado que aceita entradas de texto e imagem.

    <Note>
    Todos os modelos usam o prefixo `xiaomi/` (por exemplo, `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="Solução de problemas">
    - Se os modelos não aparecerem, confirme que `XIAOMI_API_KEY` está definida e é válida.
    - Quando o Gateway é executado como daemon, garanta que a chave esteja disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via `env.shellEnv`).

    <Warning>
    Chaves definidas apenas no seu shell interativo não são visíveis para processos de gateway gerenciados por daemon. Use a configuração `~/.openclaw/.env` ou `env.shellEnv` para disponibilidade persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração do OpenClaw.
  </Card>
  <Card title="Console do Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Painel do Xiaomi MiMo e gerenciamento de chaves de API.
  </Card>
</CardGroup>
