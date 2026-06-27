---
read_when:
    - Você quer usar o Cloudflare AI Gateway com o OpenClaw
    - Você precisa do ID da conta, do ID do Gateway ou da variável de ambiente da chave de API
summary: Configuração do Cloudflare AI Gateway (autenticação + seleção de modelo)
title: Gateway de IA da Cloudflare
x-i18n:
    generated_at: "2026-06-27T18:02:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05678faa049349c610a9c7ea9d23958bf51927453cf6987fef397cd273f6556b
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

O Cloudflare AI Gateway fica na frente das APIs de provedores e permite adicionar análises, cache e controles. Para Anthropic, o OpenClaw usa a API Anthropic Messages por meio do endpoint do Gateway.

| Propriedade   | Valor                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| Provedor      | `cloudflare-ai-gateway`                                                                  |
| URL base      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Modelo padrão | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| Chave de API  | `CLOUDFLARE_AI_GATEWAY_API_KEY` (sua chave de API do provedor para solicitações pelo Gateway) |

<Note>
Para modelos Anthropic roteados pelo Cloudflare AI Gateway, use sua **chave de API da Anthropic** como a chave do provedor.
</Note>

Quando o pensamento está habilitado para modelos Anthropic Messages, o OpenClaw remove turnos finais
de preenchimento prévio do assistente antes de enviar a carga pelo Cloudflare AI Gateway.
A Anthropic rejeita o preenchimento prévio de respostas com pensamento estendido, enquanto o preenchimento prévio
comum sem pensamento continua disponível.

## Instalar Plugin

Instale o Plugin oficial e reinicie o Gateway:

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## Primeiros passos

<Steps>
  <Step title="Set the provider API key and Gateway details">
    Execute a integração inicial e escolha a opção de autenticação do Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Isso solicita o ID da sua conta, o ID do gateway e a chave de API.

  </Step>
  <Step title="Set a default model">
    Adicione o modelo à sua configuração do OpenClaw:

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
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## Exemplo não interativo

Para configurações com scripts ou CI, passe todos os valores na linha de comando:

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
  <Accordion title="Authenticated gateways">
    Se você habilitou a autenticação do Gateway na Cloudflare, adicione o cabeçalho `cf-aig-authorization`. Isso é **além da** sua chave de API do provedor.

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

  <Accordion title="Environment note">
    Se o Gateway for executado como daemon (launchd/systemd), confirme que `CLOUDFLARE_AI_GATEWAY_API_KEY` esteja disponível para esse processo.

    <Warning>
    Uma chave exportada apenas em um shell interativo não ajudará um daemon launchd/systemd, a menos que esse ambiente também seja importado nele. Defina a chave em `~/.openclaw/.env` ou via `env.shellEnv` para garantir que o processo do gateway consiga lê-la.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Troubleshooting" href="/pt-BR/help/troubleshooting" icon="wrench">
    Solução de problemas geral e perguntas frequentes.
  </Card>
</CardGroup>
