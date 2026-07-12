---
read_when:
    - Você quer usar o Cloudflare AI Gateway com o OpenClaw
    - Você precisa do ID da conta, do ID do Gateway ou da variável de ambiente da chave de API
summary: Configuração do Cloudflare AI Gateway (autenticação + seleção de modelo)
title: Gateway de IA da Cloudflare
x-i18n:
    generated_at: "2026-07-12T00:17:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02c7785616e7aee645bb3fc41ef6a3585e1f2f9d886fab1a06231e497effd045
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

[Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) fica na frente das APIs dos provedores e adiciona análises, cache e controles. Para a Anthropic, o OpenClaw usa a API Anthropic Messages por meio do endpoint do seu Gateway.

| Propriedade   | Valor                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| Provedor      | `cloudflare-ai-gateway`                                                                  |
| Plugin        | pacote externo oficial (`@openclaw/cloudflare-ai-gateway-provider`)                      |
| URL base      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Modelo padrão | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| Chave de API  | `CLOUDFLARE_AI_GATEWAY_API_KEY` (sua chave de API do provedor para solicitações por meio do Gateway) |

<Note>
Para modelos da Anthropic encaminhados pelo Cloudflare AI Gateway, use sua **chave de API da Anthropic** como chave do provedor.
</Note>

Quando o raciocínio está habilitado para modelos Anthropic Messages, o OpenClaw remove
os turnos finais de preenchimento prévio do assistente antes de enviar a carga por meio do Cloudflare AI Gateway.
A Anthropic rejeita o preenchimento prévio de respostas com raciocínio estendido, enquanto o preenchimento prévio
comum sem raciocínio continua disponível.

## Instalar o Plugin

Instale o Plugin oficial e reinicie o Gateway:

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## Primeiros passos

<Steps>
  <Step title="Defina a chave de API do provedor e os detalhes do Gateway">
    Execute a integração inicial e escolha a opção de autenticação do Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Isso solicita o ID da sua conta, o ID do Gateway e a chave de API.

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

Para configurações automatizadas ou de CI, passe todos os valores na linha de comando:

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
    Se você habilitou a autenticação do Gateway na Cloudflare, adicione o cabeçalho `cf-aig-authorization`. Isso é necessário **além da** chave de API do provedor.

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
    O cabeçalho `cf-aig-authorization` autentica no próprio Cloudflare Gateway, enquanto a chave de API do provedor (por exemplo, sua chave da Anthropic) autentica no provedor upstream.
    </Tip>

  </Accordion>

  <Accordion title="Observação sobre o ambiente">
    Se o Gateway for executado como daemon (launchd/systemd), verifique se `CLOUDFLARE_AI_GATEWAY_API_KEY` está disponível para esse processo.

    <Warning>
    Uma chave exportada somente em um shell interativo não estará disponível para um daemon launchd/systemd, a menos que esse ambiente também seja importado nele. Defina a chave em `~/.openclaw/.env` ou por meio de `env.shellEnv` para garantir que o processo do Gateway consiga lê-la.
    </Warning>

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
