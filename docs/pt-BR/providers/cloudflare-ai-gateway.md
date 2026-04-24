---
read_when:
    - Você quer usar o Gateway de IA do Cloudflare com OpenClaw
    - Você precisa do ID da conta, ID do gateway ou variável de ambiente da chave de API
summary: Configuração do Cloudflare AI Gateway (autenticação + seleção de modelo)
title: Gateway de IA do Cloudflare
x-i18n:
    generated_at: "2026-04-24T06:06:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb10ef4bd92db88b2b3dac1773439ab2ba37916a72d1925995d74ef787fa1c8b
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

O Gateway de IA do Cloudflare fica na frente das APIs dos providers e permite adicionar analytics, cache e controles. Para Anthropic, o OpenClaw usa a Anthropic Messages API pelo endpoint do seu Gateway.

| Propriedade   | Valor                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| Provider      | `cloudflare-ai-gateway`                                                                  |
| Base URL      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`              |
| Modelo padrão | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| Chave de API  | `CLOUDFLARE_AI_GATEWAY_API_KEY` (sua chave de API do provider para solicitações pelo Gateway) |

<Note>
Para modelos Anthropic roteados pelo Gateway de IA do Cloudflare, use sua **chave de API da Anthropic** como chave do provider.
</Note>

## Primeiros passos

<Steps>
  <Step title="Definir a chave de API do provider e os detalhes do Gateway">
    Execute o onboarding e escolha a opção de autenticação do Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Isso solicita o ID da sua conta, o ID do gateway e a chave de API.

  </Step>
  <Step title="Definir um modelo padrão">
    Adicione o modelo à configuração do OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-6" },
        },
      },
    }
    ```

  </Step>
  <Step title="Verificar se o modelo está disponível">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## Exemplo não interativo

Para configurações por script ou CI, passe todos os valores na linha de comando:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## Configuração avançada

<AccordionGroup>
  <Accordion title="Gateways autenticados">
    Se você habilitou autenticação de Gateway no Cloudflare, adicione o header `cf-aig-authorization`. Isso é **além de** sua chave de API do provider.

    ```json5
    {
      models: {
        providers: {
          "cloudflare-ai-gateway": {
            headers: {
              "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
            },
          },
        },
      },
    }
    ```

    <Tip>
    O header `cf-aig-authorization` autentica no próprio Gateway do Cloudflare, enquanto a chave de API do provider (por exemplo, sua chave da Anthropic) autentica no provider upstream.
    </Tip>

  </Accordion>

  <Accordion title="Observação sobre ambiente">
    Se o Gateway estiver sendo executado como daemon (launchd/systemd), certifique-se de que `CLOUDFLARE_AI_GATEWAY_API_KEY` esteja disponível para esse processo.

    <Warning>
    Uma chave presente apenas em `~/.profile` não ajudará um daemon launchd/systemd, a menos que esse ambiente também seja importado ali. Defina a chave em `~/.openclaw/.env` ou por `env.shellEnv` para garantir que o processo do gateway possa lê-la.
    </Warning>

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
