---
read_when:
    - Você quer usar o Vercel AI Gateway com o OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da opção de autenticação da CLI
summary: Configuração do Vercel AI Gateway (autenticação + seleção de modelo)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-24T06:09:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1fa1c3c6e44e40d7a1fc89d93ee268c19124b746d4644d58014157be7cceeb9
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

O [Vercel AI Gateway](https://vercel.com/ai-gateway) fornece uma API unificada para
acessar centenas de modelos por meio de um único endpoint.

| Propriedade   | Valor                            |
| ------------- | -------------------------------- |
| Provider      | `vercel-ai-gateway`              |
| Auth          | `AI_GATEWAY_API_KEY`             |
| API           | Compatível com Anthropic Messages |
| Catálogo de modelos | Descoberto automaticamente via `/v1/models` |

<Tip>
O OpenClaw descobre automaticamente o catálogo `/v1/models` do Gateway, então
`/models vercel-ai-gateway` inclui refs atuais de modelos como
`vercel-ai-gateway/openai/gpt-5.5` e
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Primeiros passos

<Steps>
  <Step title="Definir a chave de API">
    Execute o onboarding e escolha a opção de autenticação do AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Definir um modelo padrão">
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
  <Step title="Verificar se o modelo está disponível">
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

## Forma abreviada de ID de modelo

O OpenClaw aceita refs abreviadas de modelo Vercel Claude e as normaliza em
runtime:

| Entrada abreviada                    | Ref de modelo normalizada                     |
| ------------------------------------ | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6`  | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`         | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Você pode usar a forma abreviada ou a ref de modelo totalmente qualificada na sua
configuração. O OpenClaw resolve automaticamente a forma canônica.
</Tip>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Variável de ambiente para processos daemon">
    Se o Gateway do OpenClaw for executado como um daemon (launchd/systemd), garanta que
    `AI_GATEWAY_API_KEY` esteja disponível para esse processo.

    <Warning>
    Uma chave definida apenas em `~/.profile` não ficará visível para um daemon
    launchd/systemd, a menos que esse ambiente seja explicitamente importado. Defina a chave em
    `~/.openclaw/.env` ou via `env.shellEnv` para garantir que o processo do gateway consiga
    lê-la.
    </Warning>

  </Accordion>

  <Accordion title="Roteamento de provider">
    O Vercel AI Gateway roteia requisições para o provider upstream com base no prefixo da
    ref do modelo. Por exemplo, `vercel-ai-gateway/anthropic/claude-opus-4.6` roteia
    via Anthropic, enquanto `vercel-ai-gateway/openai/gpt-5.5` roteia via
    OpenAI e `vercel-ai-gateway/moonshotai/kimi-k2.6` roteia via
    MoonshotAI. Sua única `AI_GATEWAY_API_KEY` cuida da autenticação para todos os
    providers upstream.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de providers, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Solução de problemas geral e FAQ.
  </Card>
</CardGroup>
