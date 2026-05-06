---
read_when:
    - Você quer uma única chave de API para vários LLMs
    - Você quer executar modelos via Kilo Gateway no OpenClaw
summary: Use a API unificada do Kilo Gateway para acessar vários modelos no OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-05-06T17:59:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6105f5aafa0a36de2b140909e8dd21234aa8284259367a49c67d7040eaa0a93c
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway fornece uma **API unificada** que roteia solicitações para muitos modelos por trás de um único
endpoint e uma única chave de API. Ela é compatível com OpenAI, então a maioria dos SDKs da OpenAI funciona ao trocar a URL base.

| Propriedade | Valor                              |
| -------- | ---------------------------------- |
| Provedor | `kilocode`                         |
| Autenticação     | `KILOCODE_API_KEY`                 |
| API      | Compatível com OpenAI                  |
| URL base | `https://api.kilo.ai/api/gateway/` |

## Primeiros passos

<Steps>
  <Step title="Create an account">
    Acesse [app.kilo.ai](https://app.kilo.ai), entre ou crie uma conta, depois navegue até API Keys e gere uma nova chave.
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Ou defina a variável de ambiente diretamente:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Modelo padrão

O modelo padrão é `kilocode/kilo/auto`, um modelo de roteamento inteligente
pertencente ao provedor e gerenciado pelo Kilo Gateway.

<Note>
O OpenClaw trata `kilocode/kilo/auto` como a ref padrão estável, mas não
publica um mapeamento, respaldado por fonte, de tarefa para modelo upstream para essa rota. O roteamento
upstream exato por trás de `kilocode/kilo/auto` pertence ao Kilo Gateway, não é
codificado diretamente no OpenClaw.
</Note>

## Catálogo integrado

O OpenClaw descobre dinamicamente os modelos disponíveis no Kilo Gateway na inicialização. Use
`/models kilocode` para ver a lista completa de modelos disponíveis com sua conta.

Qualquer modelo disponível no gateway pode ser usado com o prefixo `kilocode/`:

| Ref do modelo                              | Observações                              |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | Padrão — roteamento inteligente            |
| `kilocode/anthropic/claude-sonnet-4`   | Anthropic via Kilo                 |
| `kilocode/openai/gpt-5.5`              | OpenAI via Kilo                    |
| `kilocode/google/gemini-3-pro-preview` | Google via Kilo                    |
| ...e muitos outros                       | Use `/models kilocode` para listar todos |

<Tip>
Na inicialização, o OpenClaw consulta `GET https://api.kilo.ai/api/gateway/models` e mescla
os modelos descobertos antes do catálogo estático de fallback. O fallback incluído sempre
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
  <Accordion title="Transport and compatibility">
    O Kilo Gateway é documentado no código-fonte como compatível com OpenRouter, então permanece no
    caminho compatível com OpenAI em estilo proxy, em vez de usar a formatação nativa de solicitações da OpenAI.

    - Refs do Kilo baseadas em Gemini permanecem no caminho proxy-Gemini, então o OpenClaw mantém
      a sanitização de assinatura de pensamento do Gemini ali, sem habilitar a validação nativa de repetição do Gemini
      nem reescritas de bootstrap.
    - O Kilo Gateway usa um token Bearer com sua chave de API por baixo.

  </Accordion>

  <Accordion title="Stream wrapper and reasoning">
    O wrapper de stream compartilhado do Kilo adiciona o cabeçalho do aplicativo do provedor e normaliza
    payloads de raciocínio do proxy para refs de modelos concretos compatíveis.

    <Warning>
    `kilocode/kilo/auto` e outras dicas sem suporte a raciocínio de proxy ignoram a injeção de raciocínio.
    Se você precisa de suporte a raciocínio, use uma ref de modelo concreto, como
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Troubleshooting">
    - Se a descoberta de modelos falhar na inicialização, o OpenClaw usa como fallback o catálogo estático incluído que contém `kilocode/kilo/auto`.
    - Confirme se sua chave de API é válida e se sua conta Kilo tem os modelos desejados habilitados.
    - Quando o Gateway é executado como daemon, garanta que `KILOCODE_API_KEY` esteja disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Configuration reference" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração do OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Painel do Kilo Gateway, chaves de API e gerenciamento de conta.
  </Card>
</CardGroup>
