---
read_when:
    - Você quer uma única chave de API para muitos LLMs
    - Você quer executar modelos via OpenRouter no OpenClaw
    - Você quer usar o OpenRouter para geração de imagem
summary: Use a API unificada do OpenRouter para acessar muitos modelos no OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-25T13:54:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0dfbe92fbe229b3d0c22fa7997adc1906609bc3ee63c780b1f66f545d327f49
    source_path: providers/openrouter.md
    workflow: 15
---

O OpenRouter fornece uma **API unificada** que roteia requests para muitos modelos por trás de um único
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
  <Step title="(Opcional) Troque para um modelo específico">
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
providers e modelos disponíveis, consulte [/concepts/model-providers](/pt-BR/concepts/model-providers).
</Note>

Exemplos de fallback incluídos:

| Ref de modelo                        | Observações                    |
| ------------------------------------ | ------------------------------ |
| `openrouter/auto`                    | Roteamento automático do OpenRouter |
| `openrouter/moonshotai/kimi-k2.6`    | Kimi K2.6 via MoonshotAI       |
| `openrouter/openrouter/healer-alpha` | Rota OpenRouter Healer Alpha   |
| `openrouter/openrouter/hunter-alpha` | Rota OpenRouter Hunter Alpha   |

## Geração de imagem

O OpenRouter também pode servir de base para a ferramenta `image_generate`. Use um modelo de imagem do OpenRouter em `agents.defaults.imageGenerationModel`:

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

O OpenClaw envia requests de imagem para a API de imagem de chat completions do OpenRouter com `modalities: ["image", "text"]`. Modelos de imagem Gemini recebem dicas compatíveis de `aspectRatio` e `resolution` por meio de `image_config` do OpenRouter.

## Text-to-speech

O OpenRouter também pode ser usado como provider de TTS por meio do seu endpoint
compatível com OpenAI `/audio/speech`.

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

## Autenticação e cabeçalhos

O OpenRouter usa internamente um token Bearer com sua chave de API.

Em requests reais do OpenRouter (`https://openrouter.ai/api/v1`), o OpenClaw também adiciona
os cabeçalhos de atribuição de aplicativo documentados pelo OpenRouter:

| Cabeçalho                 | Valor                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Se você redirecionar o provider OpenRouter para algum outro proxy ou base URL, o OpenClaw
**não** injeta esses cabeçalhos específicos do OpenRouter nem marcadores de cache da Anthropic.
</Warning>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Marcadores de cache da Anthropic">
    Em rotas verificadas do OpenRouter, refs de modelo Anthropic mantêm os
    marcadores `cache_control` específicos da Anthropic no OpenRouter que o OpenClaw usa para
    melhor reutilização do cache de prompt em blocos de prompt de sistema/desenvolvedor.
  </Accordion>

  <Accordion title="Injeção de thinking / reasoning">
    Em rotas compatíveis não `auto`, o OpenClaw mapeia o nível de thinking selecionado para
    payloads de reasoning do proxy OpenRouter. Dicas de modelo não compatíveis e
    `openrouter/auto` ignoram essa injeção de reasoning.
  </Accordion>

  <Accordion title="Formatação de request exclusiva da OpenAI">
    O OpenRouter ainda passa pelo caminho no estilo proxy compatível com OpenAI, então
    formatação de request nativa exclusiva da OpenAI, como `serviceTier`, `store` de Responses,
    payloads de compatibilidade de reasoning da OpenAI e dicas de cache de prompt, não é encaminhada.
  </Accordion>

  <Accordion title="Rotas baseadas em Gemini">
    Refs do OpenRouter baseadas em Gemini permanecem no caminho proxy-Gemini: o OpenClaw mantém
    a sanitização de assinatura de pensamento do Gemini nesse caminho, mas não ativa validação nativa
    de replay do Gemini nem regravações de bootstrap.
  </Accordion>

  <Accordion title="Metadados de roteamento de provider">
    Se você passar roteamento de provider do OpenRouter em parâmetros de modelo, o OpenClaw o encaminhará
    como metadados de roteamento do OpenRouter antes que os wrappers de stream compartilhados sejam executados.
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
