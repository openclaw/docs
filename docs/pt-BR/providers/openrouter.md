---
read_when:
    - Você quer uma única chave de API para vários LLMs
    - Você quer executar modelos via OpenRouter no OpenClaw
    - Você quer usar o OpenRouter para geração de imagens
    - Você quer usar o OpenRouter para geração de vídeo
summary: Use a API unificada do OpenRouter para acessar muitos modelos no OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-02T21:03:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: e98b8b540265b6d11681390c02cb68312f33625bf223823a2dbca17e877c0422
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter fornece uma **API unificada** que roteia solicitações para muitos modelos por trás de um único
endpoint e chave de API. Ele é compatível com OpenAI, então a maioria dos SDKs da OpenAI funciona ao trocar a URL base.

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
As referências de modelo seguem o padrão `openrouter/<provider>/<model>`. Para a lista completa de
provedores e modelos disponíveis, consulte [/concepts/model-providers](/pt-BR/concepts/model-providers).
</Note>

Exemplos de fallback incluídos:

| Referência de modelo             | Observações                           |
| --------------------------------- | ------------------------------------- |
| `openrouter/auto`                 | Roteamento automático do OpenRouter   |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 via MoonshotAI              |

## Geração de imagens

OpenRouter também pode fornecer suporte para a ferramenta `image_generate`. Use um modelo de imagem do OpenRouter em `agents.defaults.imageGenerationModel`:

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

OpenClaw envia solicitações de imagem para a API de imagens de conclusões de chat do OpenRouter com `modalities: ["image", "text"]`. Modelos de imagem Gemini recebem dicas compatíveis de `aspectRatio` e `resolution` por meio do `image_config` do OpenRouter. Use `agents.defaults.imageGenerationModel.timeoutMs` para modelos de imagem do OpenRouter mais lentos; o parâmetro `timeoutMs` por chamada da ferramenta `image_generate` ainda prevalece.

## Geração de vídeos

OpenRouter também pode fornecer suporte para a ferramenta `video_generate` por meio de sua API assíncrona `/videos`. Use um modelo de vídeo do OpenRouter em `agents.defaults.videoGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openrouter/google/veo-3.1-fast",
      },
    },
  },
}
```

OpenClaw envia tarefas de texto para vídeo e imagem para vídeo ao OpenRouter, consulta
o `polling_url` retornado e baixa o vídeo concluído a partir dos
`unsigned_urls` do OpenRouter ou do endpoint documentado de conteúdo da tarefa.
Imagens de referência são enviadas como imagens de primeiro/último quadro por padrão; imagens
marcadas com `reference_image` são enviadas como referências de entrada do OpenRouter. O
padrão incluído `google/veo-3.1-fast` anuncia as durações de 4/6/8
segundos atualmente compatíveis, resoluções `720P`/`1080P` e proporções de aspecto
`16:9`/`9:16`. Vídeo para vídeo não é registrado para OpenRouter porque a API
upstream de geração de vídeo atualmente aceita texto e referências de imagem.

## Texto para fala

OpenRouter também pode ser usado como provedor de TTS por meio de seu endpoint
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
`models.providers.openrouter.apiKey` e depois `OPENROUTER_API_KEY`.

## Autenticação e cabeçalhos

OpenRouter usa internamente um token Bearer com sua chave de API.

Em solicitações reais ao OpenRouter (`https://openrouter.ai/api/v1`), OpenClaw também adiciona
os cabeçalhos documentados de atribuição de app do OpenRouter:

| Cabeçalho                 | Valor                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Se você redirecionar o provedor OpenRouter para outro proxy ou URL base, OpenClaw
**não** injeta esses cabeçalhos específicos do OpenRouter nem marcadores de cache da Anthropic.
</Warning>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Marcadores de cache da Anthropic">
    Em rotas verificadas do OpenRouter, referências de modelo Anthropic mantêm os
    marcadores `cache_control` específicos da Anthropic no OpenRouter que o OpenClaw usa para
    melhorar a reutilização do cache de prompts em blocos de prompt de sistema/desenvolvedor.
  </Accordion>

  <Accordion title="Preenchimento inicial de raciocínio da Anthropic">
    Em rotas verificadas do OpenRouter, referências de modelo Anthropic com raciocínio ativado
    removem turnos finais de preenchimento inicial do assistente antes que a solicitação chegue ao OpenRouter,
    atendendo ao requisito da Anthropic de que conversas com raciocínio terminem com um turno do usuário.
  </Accordion>

  <Accordion title="Injeção de pensamento / raciocínio">
    Em rotas não `auto` compatíveis, OpenClaw mapeia o nível de pensamento selecionado para
    payloads de raciocínio do proxy OpenRouter. Dicas de modelo não compatíveis e
    `openrouter/auto` ignoram essa injeção de raciocínio. Hunter Alpha também ignora
    raciocínio via proxy para referências de modelo configuradas obsoletas porque OpenRouter poderia
    retornar texto da resposta final em campos de raciocínio para essa rota desativada.
  </Accordion>

  <Accordion title="Reprodução de raciocínio do DeepSeek V4">
    Em rotas verificadas do OpenRouter, `openrouter/deepseek/deepseek-v4-flash` e
    `openrouter/deepseek/deepseek-v4-pro` preenchem `reasoning_content` ausente em
    turnos de assistente reproduzidos para que conversas de pensamento/ferramentas mantenham o
    formato de acompanhamento exigido pelo DeepSeek V4.
  </Accordion>

  <Accordion title="Formatação de solicitação exclusiva da OpenAI">
    OpenRouter ainda passa pelo caminho compatível com OpenAI em estilo proxy, então
    formatações de solicitação nativas e exclusivas da OpenAI, como `serviceTier`, `store` de Responses,
    payloads compatíveis com raciocínio da OpenAI e dicas de cache de prompt não são encaminhadas.
  </Accordion>

  <Accordion title="Rotas com suporte Gemini">
    Referências OpenRouter com suporte Gemini permanecem no caminho proxy-Gemini: OpenClaw mantém
    a higienização de assinaturas de pensamento do Gemini ali, mas não ativa a validação de reprodução
    nativa do Gemini nem reescritas de bootstrap.
  </Accordion>

  <Accordion title="Metadados de roteamento de provedor">
    Se você passar roteamento de provedor do OpenRouter em parâmetros de modelo, OpenClaw o encaminha
    como metadados de roteamento do OpenRouter antes que os wrappers de stream compartilhados sejam executados.
  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração para agentes, modelos e provedores.
  </Card>
</CardGroup>
