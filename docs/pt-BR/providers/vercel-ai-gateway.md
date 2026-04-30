---
read_when:
    - Você quer usar o Vercel AI Gateway com o OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da opção de autenticação da CLI
summary: Configuração do Vercel AI Gateway (autenticação + seleção de modelo)
title: Gateway de IA da Vercel
x-i18n:
    generated_at: "2026-04-30T10:06:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3bbe498a04c2073020fcfbbe68cb506eca4c52c3274e4eca6ab7e6893fcfa56
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

O [Vercel AI Gateway](https://vercel.com/ai-gateway) fornece uma API unificada para
acessar centenas de modelos por meio de um único endpoint.

| Propriedade         | Valor                            |
| ------------------- | -------------------------------- |
| Provedor            | `vercel-ai-gateway`              |
| Autenticação        | `AI_GATEWAY_API_KEY`             |
| API                 | compatível com Anthropic Messages |
| Catálogo de modelos | Descoberto automaticamente via `/v1/models` |

<Tip>
O OpenClaw descobre automaticamente o catálogo `/v1/models` do Gateway, portanto
`/models vercel-ai-gateway` inclui refs de modelos atuais, como
`vercel-ai-gateway/openai/gpt-5.5` e
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

Para configurações com scripts ou em CI, passe todos os valores na linha de comando:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Abreviação de ID de modelo

O OpenClaw aceita refs abreviadas de modelos Claude da Vercel e as normaliza em
tempo de execução:

| Entrada abreviada                   | Ref de modelo normalizada                    |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Você pode usar a abreviação ou a ref de modelo totalmente qualificada na sua
configuração. O OpenClaw resolve a forma canônica automaticamente.
</Tip>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Variável de ambiente para processos daemon">
    Se o OpenClaw Gateway for executado como daemon (launchd/systemd), garanta que
    `AI_GATEWAY_API_KEY` esteja disponível para esse processo.

    <Warning>
    Uma chave definida apenas em `~/.profile` não ficará visível para um daemon
    launchd/systemd, a menos que esse ambiente seja importado explicitamente. Defina a chave em
    `~/.openclaw/.env` ou via `env.shellEnv` para garantir que o processo do gateway consiga
    lê-la.
    </Warning>

  </Accordion>

  <Accordion title="Roteamento de provedor">
    O Vercel AI Gateway roteia solicitações para o provedor upstream com base no prefixo
    da ref de modelo. Por exemplo, `vercel-ai-gateway/anthropic/claude-opus-4.6` roteia
    via Anthropic, enquanto `vercel-ai-gateway/openai/gpt-5.5` roteia via
    OpenAI e `vercel-ai-gateway/moonshotai/kimi-k2.6` roteia via
    MoonshotAI. Sua única `AI_GATEWAY_API_KEY` lida com a autenticação para todos
    os provedores upstream.
  </Accordion>
  <Accordion title="Níveis de pensamento">
    As opções de `/think` seguem prefixos de modelos upstream confiáveis quando o OpenClaw conhece
    o contrato do provedor upstream. `vercel-ai-gateway/anthropic/...` usa o
    perfil de pensamento do Claude, incluindo padrões adaptativos para modelos Claude 4.6.
    `vercel-ai-gateway/openai/gpt-5.4`, `gpt-5.5` e refs no estilo Codex expõem
    `/think xhigh` assim como os provedores diretos OpenAI/OpenAI Codex. Outras
    refs com namespace mantêm os níveis normais de raciocínio, a menos que os metadados
    do catálogo declarem mais.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Solução de problemas geral e FAQ.
  </Card>
</CardGroup>
