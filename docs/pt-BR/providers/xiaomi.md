---
read_when:
    - Você quer modelos Xiaomi MiMo no OpenClaw
    - Você precisa de autenticação do Xiaomi MiMo ou configuração do Token Plan
summary: Use os modelos pré-pagos e de Plano de Tokens do Xiaomi MiMo com OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-06-27T18:07:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 171c4b95c6ff12d4b8d75747d35fcad19c6173d670a3af65fe0a286e04199751
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo é a plataforma de API para os modelos **MiMo**. O OpenClaw inclui um Plugin Xiaomi integrado com duas predefinições de provedor de texto:

- `xiaomi` para chaves de pagamento por uso (`sk-...`)
- `xiaomi-token-plan` para chaves do Token Plan (`tp-...`) com predefinições de endpoint regional

O mesmo Plugin também registra o provedor de fala (TTS) `xiaomi`.

| Propriedade              | Valor                                                                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| IDs de provedor          | `xiaomi` (pagamento por uso), `xiaomi-token-plan` (Token Plan)                                                                                     |
| Plugin                   | integrado, `enabledByDefault: true`                                                                                                                |
| Variáveis de env de auth | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                      |
| Flags de onboarding      | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| Flags diretas da CLI     | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| Contratos                | conclusões de chat + `speechProviders`                                                                                                             |
| API                      | compatível com OpenAI (`openai-completions`)                                                                                                       |
| URLs base                | Pagamento por uso: `https://api.xiaomimimo.com/v1`; predefinições do Token Plan: `token-plan-{cn,sgp,ams}...`                                      |
| Modelos padrão           | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| Padrão de TTS            | `mimo-v2.5-tts`, voz `mimo_default`; modelo de design de voz `mimo-v2.5-tts-voicedesign`                                                           |

## Primeiros passos

<Steps>
  <Step title="Obtenha a chave correta">
    Crie uma chave de pagamento por uso no [console do Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys), ou abra a página da sua assinatura do Token Plan e copie a URL base regional compatível com OpenAI junto com a chave `tp-...` correspondente.
  </Step>

  <Step title="Execute o onboarding">
    Pagamento por uso:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    Ou passe as chaves diretamente:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="Verifique se o modelo está disponível">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

## Catálogo de pagamento por uso

| Ref. do modelo          | Entrada        | Contexto  | Saída máx. | Raciocínio | Observações   |
| ----------------------- | -------------- | --------- | ---------- | ---------- | ------------- |
| `xiaomi/mimo-v2-flash`  | texto          | 262,144   | 8,192      | Não        | Modelo padrão |
| `xiaomi/mimo-v2-pro`    | texto          | 1,048,576 | 32,000     | Sim        | Contexto amplo |
| `xiaomi/mimo-v2-omni`   | texto, imagem  | 262,144   | 32,000     | Sim        | Multimodal    |

<Tip>
A ref. de modelo padrão é `xiaomi/mimo-v2-flash`. O provedor é injetado automaticamente quando `XIAOMI_API_KEY` está definida ou quando existe um perfil de autenticação.
</Tip>

## Catálogo do Token Plan

Escolha a opção de autenticação do Token Plan que corresponda à URL base regional exibida na UI de assinatura da Xiaomi:

- `xiaomi-token-plan-cn` -> `https://token-plan-cn.xiaomimimo.com/v1`
- `xiaomi-token-plan-sgp` -> `https://token-plan-sgp.xiaomimimo.com/v1`
- `xiaomi-token-plan-ams` -> `https://token-plan-ams.xiaomimimo.com/v1`

| Ref. do modelo                    | Entrada       | Contexto  | Saída máx. | Raciocínio | Observações   |
| --------------------------------- | ------------- | --------- | ---------- | ---------- | ------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | texto         | 1,048,576 | 131,072    | Sim        | Modelo padrão |
| `xiaomi-token-plan/mimo-v2.5`     | texto, imagem | 1,048,576 | 131,072    | Sim        | Multimodal    |

<Tip>
O onboarding do Token Plan valida o formato da chave e avisa quando uma chave `tp-...` é inserida no caminho de pagamento por uso, ou quando uma chave `sk-...` é inserida no caminho do Token Plan.
</Tip>

## Texto para fala

O Plugin `xiaomi` integrado também registra o Xiaomi MiMo como provedor de fala para
`messages.tts`. Ele chama o contrato de TTS de conclusões de chat da Xiaomi com o texto como
uma mensagem `assistant` e orientações opcionais de estilo como uma mensagem `user`.

| Propriedade | Valor                                    |
| ----------- | ---------------------------------------- |
| ID de TTS   | `xiaomi` (alias `mimo`)                  |
| Auth        | `XIAOMI_API_KEY`                         |
| API         | `POST /v1/chat/completions` com `audio`  |
| Padrão      | `mimo-v2.5-tts`, voz `mimo_default`      |
| Saída       | MP3 por padrão; WAV quando configurado   |

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
          speakerVoice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

As vozes integradas compatíveis incluem `mimo_default`, `default_zh`, `default_en`,
`Mia`, `Chloe`, `Milo` e `Dean`. Modelos de voz predefinida usam `audio.voice`, então
o OpenClaw envia `speakerVoice` para `mimo-v2.5-tts` e `mimo-v2-tts`.

O modelo de design de voz da Xiaomi, `mimo-v2.5-tts-voicedesign`, gera a voz
a partir de um prompt de estilo em linguagem natural em vez de um ID de voz predefinida. Configure
`style` com a descrição de voz desejada; o OpenClaw a envia como a mensagem `user`,
envia o texto falado como a mensagem `assistant` e omite
`audio.voice` para este modelo.

```json5
{
  messages: {
    tts: {
      provider: "xiaomi",
      providers: {
        xiaomi: {
          model: "mimo-v2.5-tts-voicedesign",
          format: "wav",
          style: "Warm, natural female voice with clear pronunciation.",
        },
      },
    },
  },
}
```

Para destinos de notas de voz como Feishu e Telegram, o OpenClaw transcodifica a
saída da Xiaomi para Opus a 48 kHz com `ffmpeg` antes da entrega.

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
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

Preços e flags de compatibilidade vêm do manifesto do Plugin integrado, então o exemplo de configuração omite `cost` e `compat` para evitar divergência em relação ao comportamento em runtime.

Token Plan:

```json5
{
  env: { XIAOMI_TOKEN_PLAN_API_KEY: "tp-your-key" },
  agents: { defaults: { model: { primary: "xiaomi-token-plan/mimo-v2.5-pro" } } },
  models: {
    mode: "merge",
    providers: {
      "xiaomi-token-plan": {
        baseUrl: "https://token-plan-sgp.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_TOKEN_PLAN_API_KEY",
        models: [
          {
            id: "mimo-v2.5-pro",
            name: "Xiaomi MiMo V2.5 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
          {
            id: "mimo-v2.5",
            name: "Xiaomi MiMo V2.5",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Os preços vêm do manifesto integrado (modelos do Token Plan incluem preços em camadas para leitura de cache), então o exemplo de configuração omite `cost`.

<AccordionGroup>
  <Accordion title="Comportamento de injeção automática">
    O provedor `xiaomi` é injetado automaticamente quando `XIAOMI_API_KEY` está definida no seu ambiente ou quando existe um perfil de autenticação. `xiaomi-token-plan` precisa de uma URL base regional, então o caminho compatível é a opção de onboarding do Token Plan integrado ou um bloco de configuração `models.providers.xiaomi-token-plan` explícito.
  </Accordion>

  <Accordion title="Detalhes dos modelos">
    - **mimo-v2-flash** — leve e rápido, ideal para tarefas de texto de uso geral. Sem suporte a raciocínio.
    - **mimo-v2-pro** — aceita raciocínio com uma janela de contexto de 1 milhão de tokens para cargas de trabalho com documentos longos.
    - **mimo-v2-omni** — modelo multimodal com raciocínio habilitado que aceita entradas de texto e imagem.
    - **mimo-v2.5-pro** — padrão do Token Plan com a pilha de raciocínio V2.5 atual da Xiaomi.
    - **mimo-v2.5** — rota V2.5 multimodal do Token Plan.

    <Note>
    Modelos de pagamento por uso usam o prefixo `xiaomi/`. Modelos do Token Plan usam o prefixo `xiaomi-token-plan/`.
    </Note>

  </Accordion>

  <Accordion title="Solução de problemas">
    - Se os modelos não aparecerem, confirme que a variável de env da chave relevante ou o perfil de autenticação está presente e válido.
    - Para o Token Plan, confirme que a região de onboarding escolhida corresponde à URL base da página de assinatura e que a chave começa com `tp-`.
    - Quando o Gateway roda como daemon, garanta que a chave esteja disponível para esse processo (por exemplo em `~/.openclaw/.env` ou via `env.shellEnv`).

    <Warning>
    Chaves definidas apenas no seu shell interativo não ficam visíveis para processos do Gateway gerenciados por daemon. Use `~/.openclaw/.env` ou a configuração `env.shellEnv` para disponibilidade persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs. de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração do OpenClaw.
  </Card>
  <Card title="Console do Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Painel do Xiaomi MiMo e gerenciamento de chaves de API.
  </Card>
</CardGroup>
