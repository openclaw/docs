---
read_when:
    - Você quer usar o Vercel AI Gateway com o OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da opção de autenticação da CLI
summary: Configuração do Vercel AI Gateway (autenticação + seleção de modelo)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-12T23:32:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48c206a645d7a62e201a35ae94232323c8570fdae63129231c38d363ea78a60b
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

# Vercel AI Gateway

O [Vercel AI Gateway](https://vercel.com/ai-gateway) fornece uma API unificada para
acessar centenas de modelos por meio de um único endpoint.

| Propriedade   | Valor                            |
| ------------- | -------------------------------- |
| Provider      | `vercel-ai-gateway`              |
| Autenticação  | `AI_GATEWAY_API_KEY`             |
| API           | Compatível com Anthropic Messages |
| Catálogo de modelos | Descoberto automaticamente via `/v1/models` |

<Tip>
O OpenClaw descobre automaticamente o catálogo `/v1/models` do Gateway, então
`/models vercel-ai-gateway` inclui referências de modelo atuais como
`vercel-ai-gateway/openai/gpt-5.4`.
</Tip>

## Primeiros passos

<Steps>
  <Step title="Defina a chave de API">
    Execute o onboarding e escolha a opção de autenticação do AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Defina um modelo padrão">
    Adicione o modelo à configuração do OpenClaw:

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
  <Step title="Verifique se o modelo está disponível">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Exemplo não interativo

Para configurações automatizadas ou de CI, passe todos os valores pela linha de comando:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Abreviação de ID de modelo

O OpenClaw aceita referências abreviadas de modelo Claude da Vercel e as normaliza em
runtime:

| Entrada abreviada                   | Referência de modelo normalizada               |
| ----------------------------------- | ---------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Você pode usar tanto a abreviação quanto a referência completa de modelo na sua
configuração. O OpenClaw resolve automaticamente a forma canônica.
</Tip>

## Observações avançadas

<AccordionGroup>
  <Accordion title="Variável de ambiente para processos daemon">
    Se o Gateway do OpenClaw for executado como daemon (launchd/systemd), garanta que
    `AI_GATEWAY_API_KEY` esteja disponível para esse processo.

    <Warning>
    Uma chave definida apenas em `~/.profile` não ficará visível para um daemon launchd/systemd
    a menos que esse ambiente seja importado explicitamente. Defina a chave em
    `~/.openclaw/.env` ou via `env.shellEnv` para garantir que o processo do gateway possa
    lê-la.
    </Warning>

  </Accordion>

  <Accordion title="Roteamento de provider">
    O Vercel AI Gateway encaminha solicitações para o provider upstream com base no prefixo da
    referência de modelo. Por exemplo, `vercel-ai-gateway/anthropic/claude-opus-4.6` é encaminhado
    via Anthropic, enquanto `vercel-ai-gateway/openai/gpt-5.4` é encaminhado via
    OpenAI. Sua única `AI_GATEWAY_API_KEY` cuida da autenticação para todos os
    providers upstream.
  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de providers, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Solução geral de problemas e perguntas frequentes.
  </Card>
</CardGroup>
