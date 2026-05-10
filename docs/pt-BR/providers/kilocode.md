---
read_when:
    - Você quer uma única chave de API para vários LLMs
    - Você quer executar modelos via Kilo Gateway no OpenClaw
summary: Use a API unificada do Kilo Gateway para acessar muitos modelos no OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-05-10T19:48:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3de2d983a028082d0a897fdafa48ff1f2ad82f3aacec547763159db07adb00a2
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway fornece uma **API unificada** que roteia solicitações para muitos modelos por trás de um único
endpoint e chave de API. Ela é compatível com OpenAI, então a maioria dos SDKs da OpenAI funciona ao trocar a URL base.

| Propriedade | Valor                              |
| -------- | ---------------------------------- |
| Provedor | `kilocode`                         |
| Autenticação     | `KILOCODE_API_KEY`                 |
| API      | Compatível com OpenAI                  |
| URL base | `https://api.kilo.ai/api/gateway/` |

## Primeiros passos

<Steps>
  <Step title="Crie uma conta">
    Acesse [app.kilo.ai](https://app.kilo.ai), entre ou crie uma conta, depois navegue até Chaves de API e gere uma nova chave.
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

O modelo padrão é `kilocode/kilo/auto`, um modelo de roteamento inteligente
pertencente ao provedor e gerenciado pelo Kilo Gateway.

<Note>
O OpenClaw trata `kilocode/kilo/auto` como a referência padrão estável, mas não
publica um mapeamento, respaldado por fonte, de tarefa para modelo upstream para essa rota. O roteamento
upstream exato por trás de `kilocode/kilo/auto` pertence ao Kilo Gateway, não
é codificado diretamente no OpenClaw.
</Note>

## Catálogo integrado

O OpenClaw descobre dinamicamente os modelos disponíveis no Kilo Gateway na inicialização. Use
`/models kilocode` para ver a lista completa de modelos disponíveis com sua conta.

Qualquer modelo disponível no Gateway pode ser usado com o prefixo `kilocode/`:

| Referência do modelo                                | Observações                              |
| ---------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                     | Padrão — roteamento inteligente            |
| `kilocode/anthropic/claude-sonnet-4`     | Anthropic via Kilo                 |
| `kilocode/openai/gpt-5.5`                | OpenAI via Kilo                    |
| `kilocode/google/gemini-3.1-pro-preview` | Google via Kilo                    |
| ...e muitos outros                         | Use `/models kilocode` para listar todos |

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
    caminho compatível com OpenAI em estilo de proxy, em vez de usar formatação nativa de solicitações da OpenAI.

    - Referências Kilo baseadas em Gemini permanecem no caminho proxy-Gemini, então o OpenClaw mantém
      a sanitização de assinaturas de pensamento do Gemini ali sem habilitar a validação nativa de replay do Gemini
      nem reescritas de bootstrap.
    - O Kilo Gateway usa um token Bearer com sua chave de API internamente.

  </Accordion>

  <Accordion title="Wrapper de stream e raciocínio">
    O wrapper de stream compartilhado do Kilo adiciona o cabeçalho do app do provedor e normaliza
    payloads de raciocínio de proxy para referências de modelos concretos compatíveis.

    <Warning>
    `kilocode/kilo/auto` e outras dicas sem suporte a raciocínio de proxy ignoram a injeção de raciocínio.
    Se você precisa de suporte a raciocínio, use uma referência de modelo concreta, como
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Solução de problemas">
    - Se a descoberta de modelos falhar na inicialização, o OpenClaw recorre ao catálogo estático incluído que contém `kilocode/kilo/auto`.
    - Confirme se sua chave de API é válida e se sua conta Kilo tem os modelos desejados habilitados.
    - Quando o Gateway roda como daemon, garanta que `KILOCODE_API_KEY` esteja disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração do OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Painel do Kilo Gateway, chaves de API e gerenciamento da conta.
  </Card>
</CardGroup>
