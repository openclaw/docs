---
read_when:
    - Você quer os modelos Xiaomi MiMo no OpenClaw
    - Você precisa configurar a autenticação do Xiaomi MiMo ou o Token Plan
summary: Use os modelos de pagamento conforme o uso e do Plano de Tokens do Xiaomi MiMo com o OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-07-12T15:35:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e6b91ead3e4a32a93bca7e02476b8de11137e8a5b5fa434bad8187bc1b204856
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo é a plataforma de API para os modelos **MiMo**. O plugin `xiaomi`
incluído (`enabledByDefault: true`, sem etapa de instalação) registra dois
provedores de texto, além de um provedor de fala (TTS):

- `xiaomi` - chaves com pagamento conforme o uso (`sk-...`)
- `xiaomi-token-plan` - chaves do Token Plan (`tp-...`) com predefinições de endpoints regionais

| Propriedade                    | Valor                                                                                                                                              |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| IDs dos provedores             | `xiaomi` (pagamento conforme o uso), `xiaomi-token-plan` (Token Plan)                                                                               |
| Variáveis de ambiente de autenticação | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                               |
| Flags de integração inicial    | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| Flags diretas da CLI           | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| API                            | conclusões de chat compatíveis com OpenAI (`openai-completions`)                                                                                   |
| Contrato de fala               | `speechProviders: ["xiaomi"]`                                                                                                                      |
| URLs base                      | Pagamento conforme o uso: `https://api.xiaomimimo.com/v1`; Token Plan: `token-plan-{cn,sgp,ams}.xiaomimimo.com/v1`                                |
| Modelos padrão                 | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| Padrão de TTS                  | `mimo-v2.5-tts`, voz `mimo_default`; modelo de design de voz `mimo-v2.5-tts-voicedesign`                                                           |

## Primeiros passos

<Steps>
  <Step title="Obtenha a chave correta">
    Crie uma chave com pagamento conforme o uso no [console do Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys) ou abra a página da sua assinatura do Token Plan e copie a URL base regional compatível com OpenAI, junto com a chave `tp-...` correspondente.
  </Step>

  <Step title="Execute a integração inicial">
    Pagamento conforme o uso:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    Ou forneça as chaves diretamente:

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

<Tip>
A integração inicial valida o formato da chave e avisa quando uma chave `tp-...` é inserida no fluxo de pagamento conforme o uso ou quando uma chave `sk-...` é inserida no fluxo do Token Plan.
</Tip>

## Catálogo de pagamento conforme o uso

| Referência do modelo    | Entrada       | Contexto  | Saída máxima | Raciocínio | Observações    |
| ----------------------- | ------------- | --------- | ------------ | ---------- | -------------- |
| `xiaomi/mimo-v2-flash`  | texto         | 262,144   | 8,192        | Não        | Modelo padrão  |
| `xiaomi/mimo-v2-pro`    | texto         | 1,048,576 | 32,000       | Sim        | Contexto amplo |
| `xiaomi/mimo-v2-omni`   | texto, imagem | 262,144   | 32,000       | Sim        | Multimodal     |

## Catálogo do Token Plan

Escolha a opção de autenticação do Token Plan que corresponda à URL base regional exibida na interface de assinatura da Xiaomi:

| Opção de autenticação    | URL base                                   |
| ------------------------ | ------------------------------------------ |
| `xiaomi-token-plan-cn`   | `https://token-plan-cn.xiaomimimo.com/v1`  |
| `xiaomi-token-plan-sgp`  | `https://token-plan-sgp.xiaomimimo.com/v1` |
| `xiaomi-token-plan-ams`  | `https://token-plan-ams.xiaomimimo.com/v1` |

| Referência do modelo               | Entrada       | Contexto  | Saída máxima | Raciocínio | Observações   |
| ---------------------------------- | ------------- | --------- | ------------ | ---------- | ------------- |
| `xiaomi-token-plan/mimo-v2.5-pro`  | texto         | 1,048,576 | 131,072      | Sim        | Modelo padrão |
| `xiaomi-token-plan/mimo-v2.5`      | texto, imagem | 1,048,576 | 131,072      | Sim        | Multimodal    |

`xiaomi-token-plan` precisa de uma URL base regional para ser resolvido. O
caminho compatível é uma opção de integração inicial do Token Plan incluída
ou um bloco de configuração explícito `models.providers.xiaomi-token-plan`
com `baseUrl` definido; o provedor não é oferecido sem uma dessas opções.

## Modelos de raciocínio

`mimo-v2-pro`, `mimo-v2-omni`, `mimo-v2.5` e `mimo-v2.5-pro` são compatíveis
com a [diretiva `/think` do OpenClaw](/pt-BR/tools/thinking), com os níveis `off`,
`minimal`, `low`, `medium`, `high`, `xhigh` e `max` (padrão: `high`).
`mimo-v2-flash` não oferece suporte a raciocínio.

## Conversão de texto em fala

O plugin `xiaomi` incluído também registra o Xiaomi MiMo como provedor de fala
para `messages.tts`. Ele chama o contrato de TTS de conclusões de chat da
Xiaomi com o texto como uma mensagem `assistant` e orientações opcionais de
estilo como uma mensagem `user`.

| Propriedade | Valor                                           |
| ----------- | ----------------------------------------------- |
| ID de TTS   | `xiaomi` (alias `mimo`)                         |
| Autenticação | `XIAOMI_API_KEY`                               |
| API         | `POST /v1/chat/completions` com `audio`         |
| Padrão      | `mimo-v2.5-tts`, voz `mimo_default`             |
| Saída       | MP3 por padrão; WAV quando configurado          |

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
          style: "Tom alegre, natural e conversacional.",
        },
      },
    },
  },
}
```

Vozes integradas: `mimo_default`, `default_zh`, `default_en`, `Mia`, `Chloe`,
`Milo`, `Dean`. Os modelos com vozes predefinidas (`mimo-v2.5-tts`,
`mimo-v2-tts`) usam `audio.voice`, portanto o OpenClaw envia `speakerVoice`
para esses modelos.

O modelo de design de voz `mimo-v2.5-tts-voicedesign` gera a voz a partir de
uma descrição de estilo em linguagem natural, em vez de usar um ID de voz
predefinido. Defina `style` como a descrição de voz desejada; o OpenClaw a
envia como a mensagem `user`, envia o texto falado como a mensagem `assistant`
e omite `audio.voice` para esse modelo.

```json5
{
  messages: {
    tts: {
      provider: "xiaomi",
      providers: {
        xiaomi: {
          model: "mimo-v2.5-tts-voicedesign",
          format: "wav",
          style: "Voz feminina calorosa e natural, com pronúncia clara.",
        },
      },
    },
  },
}
```

Para canais que solicitam um destino de síntese de mensagem de voz (Discord,
Feishu, Matrix, Telegram e WhatsApp), o OpenClaw transcodifica a saída da
Xiaomi para Opus mono de 48kHz com `ffmpeg` antes da entrega.

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

Os preços e as flags de compatibilidade vêm do manifesto do plugin incluído, portanto o exemplo de configuração omite `cost` e `compat` para evitar divergências em relação ao comportamento em tempo de execução.

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

Os preços vêm do manifesto incluído (os modelos do Token Plan incluem preços em níveis para leitura de cache), portanto o exemplo de configuração omite `cost`.

<AccordionGroup>
  <Accordion title="Comportamento de injeção automática">
    O provedor `xiaomi` é habilitado automaticamente quando `XIAOMI_API_KEY` está definido no seu ambiente ou existe um perfil de autenticação. `xiaomi-token-plan` precisa de uma URL base regional, portanto o caminho compatível é a opção de integração inicial do Token Plan incluída ou um bloco de configuração explícito `models.providers.xiaomi-token-plan`.
  </Accordion>

  <Accordion title="Detalhes dos modelos">
    - **mimo-v2-flash** - leve e rápido, ideal para tarefas gerais de texto. Sem suporte a raciocínio.
    - **mimo-v2-pro** - oferece suporte a raciocínio com uma janela de contexto de 1M tokens para cargas de trabalho com documentos longos.
    - **mimo-v2-omni** - modelo multimodal com raciocínio que aceita entradas de texto e imagem.
    - **mimo-v2.5-pro** - padrão do Token Plan com a pilha atual de raciocínio V2.5 da Xiaomi.
    - **mimo-v2.5** - rota multimodal V2.5 do Token Plan.

    <Note>
    Os modelos com pagamento conforme o uso utilizam o prefixo `xiaomi/`. Os modelos do Token Plan utilizam o prefixo `xiaomi-token-plan/`.
    </Note>

  </Accordion>

  <Accordion title="Solução de problemas">
    - Se os modelos não aparecerem, confirme se a variável de ambiente da chave relevante ou o perfil de autenticação está presente e é válido.
    - Para o Token Plan, confirme se a região escolhida na integração inicial corresponde à URL base da página de assinatura e se a chave começa com `tp-`.
    - Quando o Gateway é executado como daemon, verifique se a chave está disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou por meio de `env.shellEnv`).

    <Warning>
    As chaves definidas somente no shell interativo não ficam visíveis para processos do Gateway gerenciados como daemon. Use `~/.openclaw/.env` ou a configuração `env.shellEnv` para obter disponibilidade persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Como escolher provedores, referências de modelos e o comportamento de failover.
  </Card>
  <Card title="Níveis de raciocínio" href="/pt-BR/tools/thinking" icon="brain">
    Sintaxe da diretiva `/think` e mapeamento de níveis.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração do OpenClaw.
  </Card>
  <Card title="Console do Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Painel do Xiaomi MiMo e gerenciamento de chaves de API.
  </Card>
</CardGroup>
