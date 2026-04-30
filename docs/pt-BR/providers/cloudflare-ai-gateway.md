---
read_when:
    - Você quer usar o Cloudflare AI Gateway com o OpenClaw
    - Você precisa do ID da conta, do ID do Gateway ou da variável de ambiente da chave de API
summary: Configuração do Cloudflare AI Gateway (autenticação + seleção de modelo)
title: Gateway de IA da Cloudflare
x-i18n:
    generated_at: "2026-04-30T10:04:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7c567076a5b3fea0f09f44d772c0858aed2a4813f91f1cc9f87b0da39c2e5db
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway fica na frente das APIs dos provedores e permite adicionar análises, cache e controles. Para a Anthropic, o OpenClaw usa a API Anthropic Messages por meio do endpoint do seu Gateway.

| Propriedade   | Valor                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| Provedor      | `cloudflare-ai-gateway`                                                                  |
| URL base      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Modelo padrão | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| Chave de API  | `CLOUDFLARE_AI_GATEWAY_API_KEY` (sua chave de API do provedor para solicitações pelo Gateway) |

<Note>
Para modelos Anthropic roteados pelo Cloudflare AI Gateway, use sua **chave de API da Anthropic** como a chave do provedor.
</Note>

Quando o raciocínio está ativado para modelos Anthropic Messages, o OpenClaw remove turnos finais
de pré-preenchimento do assistente antes de enviar a carga útil pelo Cloudflare AI Gateway.
A Anthropic rejeita o pré-preenchimento de respostas com raciocínio estendido, enquanto o pré-preenchimento
comum sem raciocínio permanece disponível.

## Primeiros passos

<Steps>
  <Step title="Defina a chave de API do provedor e os detalhes do Gateway">
    Execute a integração inicial e escolha a opção de autenticação do Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Isso solicita seu ID da conta, ID do Gateway e chave de API.

  </Step>
  <Step title="Defina um modelo padrão">
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
  <Step title="Verifique se o modelo está disponível">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## Exemplo não interativo

Para configurações com script ou CI, passe todos os valores na linha de comando:

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
    Se você habilitou a autenticação do Gateway no Cloudflare, adicione o cabeçalho `cf-aig-authorization`. Isso é **além da** sua chave de API do provedor.

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
    O cabeçalho `cf-aig-authorization` autentica com o próprio Cloudflare Gateway, enquanto a chave de API do provedor (por exemplo, sua chave da Anthropic) autentica com o provedor upstream.
    </Tip>

  </Accordion>

  <Accordion title="Observação sobre o ambiente">
    Se o Gateway for executado como um daemon (launchd/systemd), garanta que `CLOUDFLARE_AI_GATEWAY_API_KEY` esteja disponível para esse processo.

    <Warning>
    Uma chave presente apenas em `~/.profile` não ajudará um daemon launchd/systemd, a menos que esse ambiente também seja importado ali. Defina a chave em `~/.openclaw/.env` ou via `env.shellEnv` para garantir que o processo do Gateway possa lê-la.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Solução de problemas geral e perguntas frequentes.
  </Card>
</CardGroup>
