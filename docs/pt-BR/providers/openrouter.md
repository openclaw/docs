---
read_when:
    - Você quer uma única chave de API para muitos LLMs
    - Você quer executar modelos via OpenRouter no OpenClaw
summary: Use a API unificada do OpenRouter para acessar muitos modelos no OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-12T23:32:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9083c30b9e9846a9d4ef071c350576d4c3083475f4108871eabbef0b9bb9a368
    source_path: providers/openrouter.md
    workflow: 15
---

# OpenRouter

O OpenRouter fornece uma **API unificada** que encaminha solicitações para muitos modelos por trás de um único
endpoint e uma única chave de API. Ele é compatível com OpenAI, então a maioria dos SDKs da OpenAI funciona trocando a URL base.

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
providers e modelos disponíveis, consulte [/concepts/model-providers](/pt-BR/concepts/model-providers).
</Note>

## Autenticação e headers

O OpenRouter usa um token Bearer com sua chave de API internamente.

Em solicitações reais ao OpenRouter (`https://openrouter.ai/api/v1`), o OpenClaw também adiciona
os headers documentados de atribuição de app do OpenRouter:

| Header                    | Valor                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Se você redirecionar o provider OpenRouter para algum outro proxy ou URL base, o OpenClaw
**não** injeta esses headers específicos do OpenRouter nem marcadores de cache do Anthropic.
</Warning>

## Observações avançadas

<AccordionGroup>
  <Accordion title="Marcadores de cache do Anthropic">
    Em rotas OpenRouter verificadas, referências de modelo do Anthropic mantêm os
    marcadores `cache_control` específicos do Anthropic no OpenRouter que o OpenClaw usa para
    melhor reutilização do cache de prompt em blocos de prompt do sistema/desenvolvedor.
  </Accordion>

  <Accordion title="Injeção de thinking / raciocínio">
    Em rotas compatíveis que não são `auto`, o OpenClaw mapeia o nível de thinking selecionado para
    payloads de raciocínio de proxy do OpenRouter. Dicas de modelos não compatíveis e
    `openrouter/auto` pulam essa injeção de raciocínio.
  </Accordion>

  <Accordion title="Modelagem de solicitação exclusiva da OpenAI">
    O OpenRouter ainda funciona pelo caminho em estilo proxy compatível com OpenAI, então
    modelagens de solicitação exclusivas nativas da OpenAI, como `serviceTier`, `store` do Responses,
    payloads de compatibilidade de raciocínio da OpenAI e dicas de cache de prompt não são encaminhadas.
  </Accordion>

  <Accordion title="Rotas com Gemini por trás">
    Referências OpenRouter com Gemini por trás permanecem no caminho proxy-Gemini: o OpenClaw mantém
    ali a sanitização de thought-signature do Gemini, mas não habilita validação nativa de
    replay do Gemini nem reescritas de bootstrap.
  </Accordion>

  <Accordion title="Metadados de roteamento de provider">
    Se você passar roteamento de provider do OpenRouter em parâmetros do modelo, o OpenClaw encaminha
    isso como metadados de roteamento do OpenRouter antes de os wrappers de stream compartilhados serem executados.
  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de providers, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração para agentes, modelos e providers.
  </Card>
</CardGroup>
