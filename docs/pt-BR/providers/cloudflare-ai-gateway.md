---
read_when:
    - Você quer usar o Cloudflare AI Gateway com OpenClaw
    - Você precisa do ID da conta, do ID do Gateway ou da variável de ambiente da chave de API
summary: Configuração do Cloudflare AI Gateway (auth + seleção de modelo)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-12T23:30:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12e9589fe74e6a6335370b9cf2361a464876a392a33f8317d7fd30c3f163b2e5
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

# Cloudflare AI Gateway

O Cloudflare AI Gateway fica na frente das APIs de provedores e permite adicionar análises, cache e controles. Para Anthropic, o OpenClaw usa a API Anthropic Messages por meio do endpoint do seu Gateway.

| Propriedade   | Valor                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| Provedor      | `cloudflare-ai-gateway`                                                                  |
| URL base      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Modelo padrão | `cloudflare-ai-gateway/claude-sonnet-4-5`                                                |
| Chave de API  | `CLOUDFLARE_AI_GATEWAY_API_KEY` (sua chave de API do provedor para solicitações pelo Gateway) |

<Note>
Para modelos da Anthropic roteados pelo Cloudflare AI Gateway, use sua **chave de API da Anthropic** como chave do provedor.
</Note>

## Primeiros passos

<Steps>
  <Step title="Defina a chave de API do provedor e os detalhes do Gateway">
    Execute o onboarding e escolha a opção de autenticação do Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Isso solicitará seu ID da conta, ID do Gateway e chave de API.

  </Step>
  <Step title="Defina um modelo padrão">
    Adicione o modelo à sua configuração do OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-5" },
        },
      },
    }
    ```

  </Step>
  <Step title="Verifique se o modelo está disponível">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## Exemplo não interativo

Para configurações por script ou CI, passe todos os valores pela linha de comando:

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
    Se você habilitou autenticação do Gateway no Cloudflare, adicione o header `cf-aig-authorization`. Isso é **além de** sua chave de API do provedor.

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
    O header `cf-aig-authorization` autentica no próprio Cloudflare Gateway, enquanto a chave de API do provedor (por exemplo, sua chave da Anthropic) autentica no provedor upstream.
    </Tip>

  </Accordion>

  <Accordion title="Observação sobre ambiente">
    Se o Gateway for executado como daemon (`launchd/systemd`), certifique-se de que `CLOUDFLARE_AI_GATEWAY_API_KEY` esteja disponível para esse processo.

    <Warning>
    Uma chave presente apenas em `~/.profile` não ajudará um daemon `launchd/systemd`, a menos que esse ambiente também seja importado ali. Defina a chave em `~/.openclaw/.env` ou via `env.shellEnv` para garantir que o processo do gateway consiga lê-la.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Solução geral de problemas e FAQ.
  </Card>
</CardGroup>
