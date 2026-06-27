---
read_when:
    - Você quer uma única chave de API para muitos LLMs
    - Você quer executar modelos via Kilo Gateway no OpenClaw
summary: Use a API unificada do Kilo Gateway para acessar muitos modelos no OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-06-27T18:04:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be06295295b63ce9b9d00d6f3d73e132c805237fde056eac4619616bf992e803
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

## Instalar Plugin

Instale o Plugin oficial e reinicie o Gateway:

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## Introdução

<Steps>
  <Step title="Create an account">
    Acesse [app.kilo.ai](https://app.kilo.ai), entre ou crie uma conta, navegue até API Keys e gere uma nova chave.
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
gerenciado pelo provedor e administrado pelo Kilo Gateway.

<Note>
O OpenClaw trata `kilocode/kilo/auto` como a ref padrão estável, mas não
publica um mapeamento de tarefa para modelo upstream respaldado por fonte para essa rota. O roteamento
upstream exato por trás de `kilocode/kilo/auto` pertence ao Kilo Gateway, não
é codificado diretamente no OpenClaw.
</Note>

## Catálogo integrado

O OpenClaw descobre dinamicamente os modelos disponíveis no Kilo Gateway na inicialização. Use
`/models kilocode` para ver a lista completa de modelos disponíveis com sua conta.

Qualquer modelo disponível no Gateway pode ser usado com o prefixo `kilocode/`:

| Ref do modelo                                | Observações                              |
| ---------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                     | Padrão — roteamento inteligente            |
| `kilocode/anthropic/claude-sonnet-4`     | Anthropic via Kilo                 |
| `kilocode/openai/gpt-5.5`                | OpenAI via Kilo                    |
| `kilocode/google/gemini-3.1-pro-preview` | Google via Kilo                    |
| ...e muitos outros                         | Use `/models kilocode` para listar todos |

<Tip>
Na inicialização, o OpenClaw consulta `GET https://api.kilo.ai/api/gateway/models` e mescla
os modelos descobertos antes do catálogo de fallback estático. O fallback estático sempre
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
    caminho compatível com OpenAI no estilo proxy, em vez da formatação nativa de solicitações da OpenAI.

    - As refs Kilo baseadas em Gemini permanecem no caminho proxy-Gemini, então o OpenClaw mantém
      a sanitização de assinaturas de pensamento do Gemini ali, sem habilitar a validação nativa de repetição do Gemini
      ou reescritas de bootstrap.
    - O Kilo Gateway usa um token Bearer com sua chave de API internamente.

  </Accordion>

  <Accordion title="Stream wrapper and reasoning">
    O wrapper de stream compartilhado do Kilo adiciona o cabeçalho do aplicativo do provedor e normaliza
    payloads de reasoning do proxy para refs de modelos concretos compatíveis.

    <Warning>
    `kilocode/kilo/auto` e outras dicas sem suporte a reasoning por proxy pulam a injeção de reasoning.
    Se você precisar de suporte a reasoning, use uma ref de modelo concreta, como
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Troubleshooting">
    - Se a descoberta de modelos falhar na inicialização, o OpenClaw volta para o catálogo estático que contém `kilocode/kilo/auto`.
    - Confirme se sua chave de API é válida e se sua conta Kilo tem os modelos desejados habilitados.
    - Quando o Gateway é executado como daemon, garanta que `KILOCODE_API_KEY` esteja disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Model selection" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelos e comportamento de failover.
  </Card>
  <Card title="Configuration reference" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração do OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Painel do Kilo Gateway, chaves de API e gerenciamento de conta.
  </Card>
</CardGroup>
