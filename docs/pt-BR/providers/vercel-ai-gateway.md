---
read_when:
    - Você quer usar o Vercel AI Gateway com o OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da escolha de autenticação da CLI
summary: Configuração do Vercel AI Gateway (autenticação + seleção de modelo)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-22T04:27:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11c0f764d4c35633d0fbfc189bae0fc451dc799002fc1a6d0c84fc73842bbe31
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

# Vercel AI Gateway

O [Vercel AI Gateway](https://vercel.com/ai-gateway) fornece uma API unificada para
acessar centenas de modelos por um único endpoint.

| Propriedade   | Valor                            |
| ------------- | -------------------------------- |
| Provedor      | `vercel-ai-gateway`              |
| Autenticação  | `AI_GATEWAY_API_KEY`             |
| API           | compatível com Anthropic Messages |
| Catálogo de modelos | descoberto automaticamente via `/v1/models` |

<Tip>
O OpenClaw descobre automaticamente o catálogo `/v1/models` do Gateway, então
`/models vercel-ai-gateway` inclui referências atuais de modelo, como
`vercel-ai-gateway/openai/gpt-5.4` e
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
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
    Adicione o modelo à sua configuração do OpenClaw:

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

Para configurações com script ou CI, passe todos os valores na linha de comando:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Abreviação de ID de modelo

O OpenClaw aceita referências abreviadas de modelo Claude do Vercel e as normaliza em
runtime:

| Entrada abreviada                  | Referência normalizada de modelo              |
| ---------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Você pode usar tanto a forma abreviada quanto a referência completa de modelo na sua
configuração. O OpenClaw resolve automaticamente a forma canônica.
</Tip>

## Observações avançadas

<AccordionGroup>
  <Accordion title="Variável de ambiente para processos daemon">
    Se o Gateway do OpenClaw for executado como daemon (launchd/systemd), certifique-se de que
    `AI_GATEWAY_API_KEY` esteja disponível para esse processo.

    <Warning>
    Uma chave definida apenas em `~/.profile` não ficará visível para um
    daemon launchd/systemd, a menos que esse ambiente seja importado explicitamente. Defina a chave em
    `~/.openclaw/.env` ou via `env.shellEnv` para garantir que o processo do gateway consiga
    lê-la.
    </Warning>

  </Accordion>

  <Accordion title="Roteamento de provedor">
    O Vercel AI Gateway roteia solicitações para o provedor upstream com base no prefixo da
    referência de modelo. Por exemplo, `vercel-ai-gateway/anthropic/claude-opus-4.6` é roteado
    por Anthropic, enquanto `vercel-ai-gateway/openai/gpt-5.4` é roteado por
    OpenAI e `vercel-ai-gateway/moonshotai/kimi-k2.6` é roteado por
    MoonshotAI. Sua única `AI_GATEWAY_API_KEY` cuida da autenticação para todos os
    provedores upstream.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Solução geral de problemas e FAQ.
  </Card>
</CardGroup>
