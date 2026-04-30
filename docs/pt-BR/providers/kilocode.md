---
read_when:
    - Você quer uma única chave de API para vários LLMs
    - Você quer executar modelos via Kilo Gateway no OpenClaw
summary: Use a API unificada do Kilo Gateway para acessar vários modelos no OpenClaw
title: Kilocode
x-i18n:
    generated_at: "2026-04-30T10:04:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: c51012b94d4b720795356b67c8482ae7ee0b37d401689e923be0b7732d77c4aa
    source_path: providers/kilocode.md
    workflow: 16
---

# Kilo Gateway

O Kilo Gateway fornece uma **API unificada** que roteia solicitações para muitos modelos por trás de um único
endpoint e chave de API. Ele é compatível com OpenAI, então a maioria dos SDKs da OpenAI funciona ao trocar a URL base.

| Propriedade | Valor                              |
| -------- | ---------------------------------- |
| Provedor | `kilocode`                         |
| Autenticação     | `KILOCODE_API_KEY`                 |
| API      | Compatível com OpenAI                  |
| URL base | `https://api.kilo.ai/api/gateway/` |

## Primeiros passos

<Steps>
  <Step title="Criar uma conta">
    Acesse [app.kilo.ai](https://app.kilo.ai), faça login ou crie uma conta, depois navegue até API Keys e gere uma nova chave.
  </Step>
  <Step title="Executar onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Ou defina a variável de ambiente diretamente:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Verificar se o modelo está disponível">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Modelo padrão

O modelo padrão é `kilocode/kilo/auto`, um modelo de roteamento inteligente
gerenciado pelo provedor e mantido pelo Kilo Gateway.

<Note>
O OpenClaw trata `kilocode/kilo/auto` como a referência padrão estável, mas não
publica um mapeamento de tarefa para modelo upstream respaldado por fonte para essa rota. O roteamento
upstream exato por trás de `kilocode/kilo/auto` pertence ao Kilo Gateway, não é
codificado diretamente no OpenClaw.
</Note>

## Catálogo integrado

O OpenClaw descobre dinamicamente os modelos disponíveis no Kilo Gateway na inicialização. Use
`/models kilocode` para ver a lista completa de modelos disponíveis com sua conta.

Qualquer modelo disponível no Gateway pode ser usado com o prefixo `kilocode/`:

| Ref. do modelo                              | Observações                              |
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
  <Accordion title="Transporte e compatibilidade">
    O Kilo Gateway é documentado no código-fonte como compatível com OpenRouter, então ele permanece no
    caminho compatível com OpenAI no estilo proxy, em vez de usar a formatação nativa de solicitações da OpenAI.

    - Refs do Kilo baseadas em Gemini permanecem no caminho proxy-Gemini, então o OpenClaw mantém
      a sanitização de assinaturas de pensamento do Gemini ali sem habilitar a validação de replay
      nativa do Gemini nem reescritas de bootstrap.
    - O Kilo Gateway usa um token Bearer com sua chave de API nos bastidores.

  </Accordion>

  <Accordion title="Wrapper de stream e raciocínio">
    O wrapper de stream compartilhado do Kilo adiciona o cabeçalho do aplicativo do provedor e normaliza
    payloads de raciocínio de proxy para refs de modelos concretos compatíveis.

    <Warning>
    `kilocode/kilo/auto` e outras dicas sem suporte a raciocínio de proxy ignoram a injeção de raciocínio.
    Se você precisar de suporte a raciocínio, use uma ref de modelo concreta, como
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Solução de problemas">
    - Se a descoberta de modelos falhar na inicialização, o OpenClaw usará como fallback o catálogo estático incluído que contém `kilocode/kilo/auto`.
    - Confirme se sua chave de API é válida e se sua conta do Kilo tem os modelos desejados habilitados.
    - Quando o Gateway for executado como daemon, certifique-se de que `KILOCODE_API_KEY` esteja disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração do OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Painel do Kilo Gateway, chaves de API e gerenciamento de conta.
  </Card>
</CardGroup>
