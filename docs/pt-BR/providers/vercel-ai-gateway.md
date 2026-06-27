---
read_when:
    - Você quer usar o Vercel AI Gateway com o OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da opção de autenticação da CLI
summary: Configuração do Vercel AI Gateway (autenticação + seleção de modelo)
title: Gateway de IA da Vercel
x-i18n:
    generated_at: "2026-06-27T18:07:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 27aeeeff28661839f3be55c60bf1b383b95af78e17abb77441ae4e81f58688ed
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
| API               | compatível com Anthropic Messages      |
| Catálogo de modelos | Descoberto automaticamente via `/v1/models` |

<Tip>
O OpenClaw descobre automaticamente o catálogo `/v1/models` do Gateway, então
`/models vercel-ai-gateway` inclui refs de modelo atuais, como
`vercel-ai-gateway/openai/gpt-5.5` e
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Primeiros passos

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="Set the API key">
    Execute o onboarding e escolha a opção de autenticação do AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Set a default model">
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
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Exemplo não interativo

Para configurações com scripts ou de CI, passe todos os valores na linha de comando:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Forma abreviada do ID do modelo

O OpenClaw aceita refs de modelo abreviadas do Vercel Claude e as normaliza em
tempo de execução:

| Entrada abreviada                   | Ref de modelo normalizada                    |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Você pode usar a forma abreviada ou a ref de modelo totalmente qualificada na sua
configuração. O OpenClaw resolve a forma canônica automaticamente.
</Tip>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Environment variable for daemon processes">
    Se o Gateway do OpenClaw for executado como um daemon (launchd/systemd), garanta que
    `AI_GATEWAY_API_KEY` esteja disponível para esse processo.

    <Warning>
    Uma chave exportada somente em um shell interativo não ficará visível para um
    daemon launchd/systemd, a menos que esse ambiente seja importado explicitamente. Defina
    a chave em `~/.openclaw/.env` ou via `env.shellEnv` para garantir que o processo do gateway
    possa lê-la.
    </Warning>

  </Accordion>

  <Accordion title="Provider routing">
    O Vercel AI Gateway roteia solicitações para o provedor upstream com base no prefixo
    da ref de modelo. Por exemplo, `vercel-ai-gateway/anthropic/claude-opus-4.6` roteia
    pelo Anthropic, enquanto `vercel-ai-gateway/openai/gpt-5.5` roteia pelo
    OpenAI e `vercel-ai-gateway/moonshotai/kimi-k2.6` roteia pelo
    MoonshotAI. Sua única `AI_GATEWAY_API_KEY` gerencia a autenticação para todos
    os provedores upstream.
  </Accordion>
  <Accordion title="Thinking levels">
    As opções de `/think` seguem prefixos confiáveis de modelos upstream quando o OpenClaw conhece
    o contrato do provedor upstream. `vercel-ai-gateway/anthropic/...` usa o
    perfil de raciocínio do Claude, incluindo padrões adaptativos para modelos Claude 4.6.
    `vercel-ai-gateway/openai/gpt-5.4`, `gpt-5.5` e refs no estilo Codex expõem
    `/think xhigh` assim como os provedores diretos OpenAI/OpenAI Codex. Outras
    refs com namespace mantêm os níveis normais de raciocínio, a menos que seus metadados
    de catálogo declarem mais.
  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Model selection" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Troubleshooting" href="/pt-BR/help/troubleshooting" icon="wrench">
    Solução de problemas gerais e perguntas frequentes.
  </Card>
</CardGroup>
