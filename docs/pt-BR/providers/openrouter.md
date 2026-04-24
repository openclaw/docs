---
read_when:
    - Você quer uma única chave de API para muitos LLMs
    - Você quer executar modelos via OpenRouter no OpenClaw
    - Você quer usar o OpenRouter para geração de imagem
summary: Usar a API unificada do OpenRouter para acessar muitos modelos no OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-24T06:08:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7516910f67a8adfb107d07cadd73c34ddd110422ecb90278025d4d6344937aac
    source_path: providers/openrouter.md
    workflow: 15
---

O OpenRouter fornece uma **API unificada** que roteia requisições para muitos modelos por trás de um único
endpoint e uma única chave de API. Ele é compatível com OpenAI, então a maioria dos SDKs OpenAI funciona trocando a base URL.

## Primeiros passos

<Steps>
  <Step title="Obter sua chave de API">
    Crie uma chave de API em [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Executar o onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Opcional) Mudar para um modelo específico">
    O onboarding usa por padrão `openrouter/auto`. Escolha depois um modelo concreto:

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

## Refs de modelo

<Note>
As refs de modelo seguem o padrão `openrouter/<provider>/<model>`. Para a lista completa de
providers e modelos disponíveis, consulte [/concepts/model-providers](/pt-BR/concepts/model-providers).
</Note>

Exemplos integrados de fallback:

| Ref do modelo                        | Observações                    |
| ------------------------------------ | ------------------------------ |
| `openrouter/auto`                    | Roteamento automático OpenRouter |
| `openrouter/moonshotai/kimi-k2.6`    | Kimi K2.6 via MoonshotAI       |
| `openrouter/openrouter/healer-alpha` | Rota OpenRouter Healer Alpha   |
| `openrouter/openrouter/hunter-alpha` | Rota OpenRouter Hunter Alpha   |

## Geração de imagem

O OpenRouter também pode servir de backend para a tool `image_generate`. Use um modelo de imagem do OpenRouter em `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

O OpenClaw envia requisições de imagem para a API de imagem de chat completions do OpenRouter com `modalities: ["image", "text"]`. Modelos de imagem Gemini recebem hints compatíveis de `aspectRatio` e `resolution` por meio de `image_config` do OpenRouter.

## Autenticação e cabeçalhos

O OpenRouter usa um token Bearer com sua chave de API por baixo dos panos.

Em requisições reais ao OpenRouter (`https://openrouter.ai/api/v1`), o OpenClaw também adiciona
os cabeçalhos documentados de atribuição de app do OpenRouter:

| Cabeçalho                | Valor                 |
| ------------------------ | --------------------- |
| `HTTP-Referer`           | `https://openclaw.ai` |
| `X-OpenRouter-Title`     | `OpenClaw`            |
| `X-OpenRouter-Categories`| `cli-agent`           |

<Warning>
Se você redirecionar o provider OpenRouter para algum outro proxy ou base URL, o OpenClaw
**não** injeta esses cabeçalhos específicos do OpenRouter nem marcadores de cache da Anthropic.
</Warning>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Marcadores de cache da Anthropic">
    Em rotas OpenRouter verificadas, refs de modelo Anthropic mantêm os
    marcadores `cache_control` específicos do OpenRouter que o OpenClaw usa para
    melhor reutilização do cache de prompt em blocos de prompt system/developer.
  </Accordion>

  <Accordion title="Injeção de thinking / reasoning">
    Em rotas não `auto` compatíveis, o OpenClaw mapeia o nível selecionado de thinking para
    payloads de reasoning do proxy OpenRouter. Hints de modelo não compatíveis e
    `openrouter/auto` ignoram essa injeção de reasoning.
  </Accordion>

  <Accordion title="Formatação de requisição apenas para OpenAI">
    O OpenRouter ainda passa pelo caminho compatível com OpenAI em estilo proxy, então
    formatação nativa de requisição apenas para OpenAI, como `serviceTier`, `store` do Responses,
    payloads de compatibilidade de reasoning da OpenAI e hints de cache de prompt, não é encaminhada.
  </Accordion>

  <Accordion title="Rotas com backend Gemini">
    Refs OpenRouter com backend Gemini permanecem no caminho proxy-Gemini: o OpenClaw mantém
    a higienização da assinatura de thought do Gemini ali, mas não habilita validação de replay nativa do Gemini nem reescritas de bootstrap.
  </Accordion>

  <Accordion title="Metadados de roteamento de provider">
    Se você passar roteamento de provider do OpenRouter em params de modelo, o OpenClaw o encaminha
    como metadados de roteamento do OpenRouter antes da execução dos wrappers de stream compartilhados.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de providers, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração para agentes, modelos e providers.
  </Card>
</CardGroup>
