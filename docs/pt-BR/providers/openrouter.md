---
read_when:
    - Você quer uma única chave de API para muitos LLMs
    - Você quer executar modelos via OpenRouter no OpenClaw
summary: Use a API unificada do OpenRouter para acessar muitos modelos no OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-22T04:27:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a8d1e6191d98e3f5284ebc77e0b8b855a04f3fbed09786d6125b622333ac807
    source_path: providers/openrouter.md
    workflow: 15
---

# OpenRouter

O OpenRouter fornece uma **API unificada** que roteia solicitações para muitos modelos por trás de um único
endpoint e de uma única chave de API. Ele é compatível com OpenAI, então a maioria dos SDKs de OpenAI funciona trocando a URL base.

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

| Referência de modelo                  | Observações                  |
| ------------------------------------- | ---------------------------- |
| `openrouter/auto`                     | Roteamento automático do OpenRouter |
| `openrouter/moonshotai/kimi-k2.6`     | Kimi K2.6 via MoonshotAI     |
| `openrouter/openrouter/healer-alpha`  | Rota OpenRouter Healer Alpha |
| `openrouter/openrouter/hunter-alpha`  | Rota OpenRouter Hunter Alpha |

## Autenticação e cabeçalhos

O OpenRouter usa um token Bearer com sua chave de API internamente.

Em solicitações reais ao OpenRouter (`https://openrouter.ai/api/v1`), o OpenClaw também adiciona
os cabeçalhos documentados de atribuição de app do OpenRouter:

| Cabeçalho                | Valor                 |
| ------------------------ | --------------------- |
| `HTTP-Referer`           | `https://openclaw.ai` |
| `X-OpenRouter-Title`     | `OpenClaw`            |
| `X-OpenRouter-Categories`| `cli-agent`           |

<Warning>
Se você redirecionar o provedor OpenRouter para algum outro proxy ou URL base, o OpenClaw
**não** injeta esses cabeçalhos específicos do OpenRouter nem marcadores de cache do Anthropic.
</Warning>

## Observações avançadas

<AccordionGroup>
  <Accordion title="Marcadores de cache do Anthropic">
    Em rotas OpenRouter verificadas, referências de modelo Anthropic mantêm os
    marcadores `cache_control` específicos do OpenRouter que o OpenClaw usa para
    melhor reutilização do cache de prompt em blocos de prompt de sistema/desenvolvedor.
  </Accordion>

  <Accordion title="Injeção de thinking / reasoning">
    Em rotas compatíveis que não sejam `auto`, o OpenClaw mapeia o nível de thinking selecionado para
    payloads de reasoning do proxy OpenRouter. Dicas de modelo não compatíveis e
    `openrouter/auto` ignoram essa injeção de reasoning.
  </Accordion>

  <Accordion title="Formatação de requisição apenas do OpenAI">
    O OpenRouter ainda passa pelo caminho compatível com OpenAI no estilo proxy, então
    formatações nativas de requisição apenas do OpenAI, como `serviceTier`, `store` do Responses,
    payloads de compatibilidade de reasoning do OpenAI e dicas de cache de prompt, não são encaminhadas.
  </Accordion>

  <Accordion title="Rotas com Gemini">
    Referências OpenRouter com backend Gemini permanecem no caminho proxy-Gemini: o OpenClaw mantém
    ali a sanitização de thought-signature do Gemini, mas não ativa validação nativa de replay do Gemini
    nem regravações de bootstrap.
  </Accordion>

  <Accordion title="Metadados de roteamento do provedor">
    Se você passar roteamento de provedor do OpenRouter em parâmetros de modelo, o OpenClaw os encaminha
    como metadados de roteamento do OpenRouter antes que os wrappers de stream compartilhados sejam executados.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração para agentes, modelos e provedores.
  </Card>
</CardGroup>
