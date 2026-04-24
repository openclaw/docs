---
read_when:
    - Você quer uma única chave de API para muitos LLMs
    - Você quer executar modelos via Kilo Gateway no OpenClaw
summary: Use a API unificada do Kilo Gateway para acessar muitos modelos no OpenClaw
title: Kilocode
x-i18n:
    generated_at: "2026-04-24T06:07:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa3c29e7b39b1dfb049444c7ef2759555bb3f94479622d58fa2aa8fd6389d01f
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gateway fornece uma **API unificada** que roteia solicitações para muitos modelos atrás de um único
endpoint e uma única chave de API. Ela é compatível com OpenAI, então a maioria dos SDKs OpenAI funciona trocando a base URL.

| Property | Value                              |
| -------- | ---------------------------------- |
| Provider | `kilocode`                         |
| Auth     | `KILOCODE_API_KEY`                 |
| API      | Compatível com OpenAI              |
| Base URL | `https://api.kilo.ai/api/gateway/` |

## Primeiros passos

<Steps>
  <Step title="Crie uma conta">
    Vá para [app.kilo.ai](https://app.kilo.ai), faça login ou crie uma conta, depois navegue até API Keys e gere uma nova chave.
  </Step>
  <Step title="Execute o onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Ou defina a variável de ambiente diretamente:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Verifique se o modelo está disponível">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Modelo padrão

O modelo padrão é `kilocode/kilo/auto`, um modelo de roteamento inteligente pertencente ao provedor
e gerenciado pelo Kilo Gateway.

<Note>
O OpenClaw trata `kilocode/kilo/auto` como a ref padrão estável, mas não
publica um mapeamento respaldado pela fonte de tarefa para modelo upstream para essa rota. O roteamento exato
upstream por trás de `kilocode/kilo/auto` pertence ao Kilo Gateway, não está
codificado rigidamente no OpenClaw.
</Note>

## Catálogo incluído

O OpenClaw descobre dinamicamente os modelos disponíveis do Kilo Gateway na inicialização. Use
`/models kilocode` para ver a lista completa de modelos disponíveis na sua conta.

Qualquer modelo disponível no gateway pode ser usado com o prefixo `kilocode/`:

| Model ref                              | Notes                               |
| -------------------------------------- | ----------------------------------- |
| `kilocode/kilo/auto`                   | Padrão — roteamento inteligente     |
| `kilocode/anthropic/claude-sonnet-4`   | Anthropic via Kilo                  |
| `kilocode/openai/gpt-5.5`              | OpenAI via Kilo                     |
| `kilocode/google/gemini-3-pro-preview` | Google via Kilo                     |
| ...and many more                       | Use `/models kilocode` para listar todos |

<Tip>
Na inicialização, o OpenClaw consulta `GET https://api.kilo.ai/api/gateway/models` e mescla
os modelos descobertos à frente do catálogo estático de fallback. O fallback incluído sempre
inclui `kilocode/kilo/auto` (`Kilo Auto`) com `input: ["text", "image"]`,
`reasoning: true`, `contextWindow: 1000000` e `maxTokens: 128000`.
</Tip>

## Exemplo de configuração

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Transporte e compatibilidade">
    O Kilo Gateway é documentado na fonte como compatível com OpenRouter, então ele permanece no
    caminho estilo proxy compatível com OpenAI em vez de modelagem nativa de requisição OpenAI.

    - Refs Kilo baseadas em Gemini permanecem no caminho proxy-Gemini, então o OpenClaw mantém
      a sanitização de assinatura de pensamento do Gemini ali sem ativar validação nativa de replay do Gemini
      nem reescritas de bootstrap.
    - O Kilo Gateway usa um token Bearer com sua chave de API internamente.

  </Accordion>

  <Accordion title="Wrapper de stream e raciocínio">
    O wrapper de stream compartilhado do Kilo adiciona o cabeçalho do aplicativo provedor e normaliza
    payloads de raciocínio de proxy para refs concretas de modelo compatíveis.

    <Warning>
    `kilocode/kilo/auto` e outras hints sem suporte a raciocínio por proxy ignoram a injeção de raciocínio.
    Se você precisar de suporte a raciocínio, use uma ref concreta de modelo, como
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Solução de problemas">
    - Se a descoberta de modelo falhar na inicialização, o OpenClaw recorre ao catálogo estático incluído que contém `kilocode/kilo/auto`.
    - Confirme que sua chave de API é válida e que sua conta Kilo tem os modelos desejados ativados.
    - Quando o Gateway é executado como daemon, garanta que `KILOCODE_API_KEY` esteja disponível para esse processo (por exemplo em `~/.openclaw/.env` ou via `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração do OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Dashboard do Kilo Gateway, chaves de API e gerenciamento de conta.
  </Card>
</CardGroup>
