---
read_when:
    - Você quer usar o Vercel AI Gateway com o OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da opção de autenticação da CLI
summary: Configuração do Vercel AI Gateway (autenticação + seleção de modelo)
title: Gateway de IA da Vercel
x-i18n:
    generated_at: "2026-07-12T00:19:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1e4776604491900a914e75caebfd7e27a81e9f859213f5bd5b25582a923d92a
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

O [Vercel AI Gateway](https://vercel.com/ai-gateway) fornece uma API unificada para
acessar centenas de modelos por meio de um único endpoint.

| Propriedade       | Valor                                  |
| ----------------- | -------------------------------------- |
| Provedor          | `vercel-ai-gateway`                    |
| Pacote            | `@openclaw/vercel-ai-gateway-provider` |
| Autenticação      | `AI_GATEWAY_API_KEY`                   |
| API               | Compatível com Anthropic Messages      |
| URL base          | `https://ai-gateway.vercel.sh`         |
| Catálogo de modelos | Descoberto automaticamente via `/v1/models` |

<Tip>
O OpenClaw descobre automaticamente o catálogo `/v1/models` do Gateway, portanto tanto o
comando de chat `/models vercel-ai-gateway` quanto
`openclaw models list --provider vercel-ai-gateway` incluem referências atuais de modelos,
como `vercel-ai-gateway/openai/gpt-5.5` e
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Primeiros passos

<Steps>
  <Step title="Instalar o plugin">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="Definir a chave da API">
    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```
  </Step>
  <Step title="Definir um modelo padrão">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    }
    ```
  </Step>
  <Step title="Verificar se o modelo está disponível">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Exemplo não interativo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Forma abreviada do ID do modelo

O OpenClaw normaliza referências abreviadas de modelos Claude em tempo de execução:

| Entrada abreviada                    | Referência normalizada do modelo               |
| ------------------------------------ | ---------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Use qualquer uma das formas em sua configuração; o OpenClaw resolve automaticamente
a referência canônica `anthropic/...`.
</Tip>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Variável de ambiente para processos daemon">
    Se o Gateway do OpenClaw for executado como daemon (launchd/systemd), certifique-se de que
    `AI_GATEWAY_API_KEY` esteja disponível para esse processo.

    <Warning>
    Uma chave exportada somente em um shell interativo não ficará visível para um
    daemon launchd/systemd, a menos que esse ambiente seja importado explicitamente. Defina
    a chave em `~/.openclaw/.env` ou por meio de `env.shellEnv` para garantir que o processo
    do Gateway possa lê-la.
    </Warning>

  </Accordion>

  <Accordion title="Roteamento de provedores">
    O Vercel AI Gateway encaminha cada solicitação ao provedor upstream indicado no
    prefixo da referência do modelo. Por exemplo, `vercel-ai-gateway/anthropic/claude-opus-4.6`
    é encaminhado pela Anthropic, `vercel-ai-gateway/openai/gpt-5.5` é encaminhado pela
    OpenAI e `vercel-ai-gateway/moonshotai/kimi-k2.6` é encaminhado pela
    MoonshotAI. Uma única `AI_GATEWAY_API_KEY` autentica todos os provedores upstream.
  </Accordion>
  <Accordion title="Níveis de raciocínio">
    As opções de `/think` seguem o prefixo do modelo upstream quando o OpenClaw o
    reconhece. `vercel-ai-gateway/anthropic/...` usa o perfil de raciocínio do Claude,
    incluindo o padrão adaptativo para modelos Claude 4.6. Referências confiáveis
    `vercel-ai-gateway/openai/...` (`gpt-5.2` e posteriores, além de variantes do Codex
    até `gpt-5.1-codex`) disponibilizam `/think xhigh`. Outras referências com namespace
    mantêm os níveis de raciocínio padrão, a menos que os metadados do catálogo
    indiquem níveis adicionais.
  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Como escolher provedores, referências de modelos e o comportamento de failover.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Solução geral de problemas e perguntas frequentes.
  </Card>
</CardGroup>
