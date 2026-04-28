---
read_when:
    - Você quer uma única chave de API para muitos LLMs
    - Você quer executar modelos via OpenRouter no OpenClaw
    - Você quer usar o OpenRouter para geração de imagens
summary: Use a API unificada do OpenRouter para acessar vários modelos no OpenClaw
title: OpenRouter
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-25T18:21:07Z"
  model: gpt-5.4
  provider: openai
  source_hash: 5396b0a022746cf3dfc90fa2d0974ffe9798af1ac790e93d13398a9e622eceff
  source_path: providers/openrouter.md
  workflow: 15
---

O OpenRouter fornece uma **API unificada** que roteia requisições para muitos modelos por trás de um único
endpoint e uma única chave de API. Ele é compatível com OpenAI, então a maioria dos SDKs da OpenAI funciona apenas trocando a base URL.

## Primeiros passos

<Steps>
  <Step title="Obtenha sua chave de API">
    Crie uma chave de API em [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Execute o onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Opcional) Mude para um modelo específico">
    O onboarding usa `openrouter/auto` por padrão. Escolha um modelo concreto depois:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## Exemplo de configuração

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Referências de modelo

<Note>
As refs de modelo seguem o padrão `openrouter/<provider>/<model>`. Para a lista completa de
provedores e modelos disponíveis, consulte [/concepts/model-providers](/pt-BR/concepts/model-providers).
</Note>

Exemplos integrados de fallback:

| Ref de modelo                        | Observações                  |
| ------------------------------------ | ---------------------------- |
| `openrouter/auto`                    | Roteamento automático do OpenRouter |
| `openrouter/moonshotai/kimi-k2.6`    | Kimi K2.6 via MoonshotAI     |
| `openrouter/openrouter/healer-alpha` | Rota OpenRouter Healer Alpha |
| `openrouter/openrouter/hunter-alpha` | Rota OpenRouter Hunter Alpha |

## Geração de imagem

O OpenRouter também pode servir de backend para a ferramenta `image_generate`. Use um modelo de imagem do OpenRouter em `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

O OpenClaw envia requisições de imagem para a API de imagem de chat completions do OpenRouter com `modalities: ["image", "text"]`. Modelos de imagem Gemini recebem hints compatíveis de `aspectRatio` e `resolution` por meio de `image_config` do OpenRouter. Use `agents.defaults.imageGenerationModel.timeoutMs` para modelos de imagem do OpenRouter mais lentos; o parâmetro `timeoutMs` por chamada da ferramenta `image_generate` ainda prevalece.

## Texto para fala

O OpenRouter também pode ser usado como provedor de TTS por meio de seu endpoint
`/audio/speech` compatível com OpenAI.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

Se `messages.tts.providers.openrouter.apiKey` for omitido, o TTS reutiliza
`models.providers.openrouter.apiKey` e, depois, `OPENROUTER_API_KEY`.

## Autenticação e headers

O OpenRouter usa um token Bearer com sua chave de API internamente.

Em requisições reais ao OpenRouter (`https://openrouter.ai/api/v1`), o OpenClaw também adiciona
os headers de atribuição de aplicativo documentados pelo OpenRouter:

| Header                    | Valor                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Se você redirecionar o provedor OpenRouter para algum outro proxy ou base URL, o OpenClaw
**não** injeta esses headers específicos do OpenRouter nem marcadores de cache da Anthropic.
</Warning>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Marcadores de cache da Anthropic">
    Em rotas OpenRouter verificadas, refs de modelo Anthropic mantêm os
    marcadores `cache_control` específicos do OpenRouter que o OpenClaw usa para
    melhor reutilização do cache de prompt em blocos de prompt de sistema/desenvolvedor.
  </Accordion>

  <Accordion title="Injeção de thinking / reasoning">
    Em rotas compatíveis não `auto`, o OpenClaw mapeia o nível de thinking selecionado para
    payloads de reasoning do proxy OpenRouter. Hints de modelo sem suporte e
    `openrouter/auto` ignoram essa injeção de reasoning.
  </Accordion>

  <Accordion title="Ajuste de requisição exclusivo do OpenAI">
    O OpenRouter ainda é executado pelo caminho compatível com OpenAI em estilo proxy, então
    ajustes nativos de requisição exclusivos do OpenAI, como `serviceTier`, `store` de Responses,
    payloads de compatibilidade de reasoning da OpenAI e hints de cache de prompt, não são encaminhados.
  </Accordion>

  <Accordion title="Rotas com backend Gemini">
    Refs OpenRouter com backend Gemini permanecem no caminho proxy-Gemini: o OpenClaw mantém
    a sanitização de thought-signature do Gemini ali, mas não ativa validação nativa de replay
    do Gemini nem reescritas de bootstrap.
  </Accordion>

  <Accordion title="Metadados de roteamento do provedor">
    Se você passar roteamento de provedor OpenRouter em parâmetros do modelo, o OpenClaw os encaminha
    como metadados de roteamento do OpenRouter antes de os wrappers compartilhados de stream serem executados.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Como escolher provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração para agentes, modelos e provedores.
  </Card>
</CardGroup>
