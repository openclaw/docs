---
read_when:
    - Quieres usar Cloudflare AI Gateway con OpenClaw
    - Necesitas el ID de cuenta, el ID de Gateway o la variable de entorno de la clave de API
summary: Configuración de Cloudflare AI Gateway (autenticación + selección de modelo)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-12T23:30:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12e9589fe74e6a6335370b9cf2361a464876a392a33f8317d7fd30c3f163b2e5
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

# Cloudflare AI Gateway

Cloudflare AI Gateway se sitúa delante de las API de proveedores y te permite añadir analíticas, caché y controles. Para Anthropic, OpenClaw usa la API de mensajes de Anthropic a través del endpoint de tu Gateway.

| Property      | Value                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| Proveedor     | `cloudflare-ai-gateway`                                                                  |
| URL base      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Modelo predeterminado | `cloudflare-ai-gateway/claude-sonnet-4-5`                                                |
| Clave de API  | `CLOUDFLARE_AI_GATEWAY_API_KEY` (tu clave de API del proveedor para solicitudes a través del Gateway) |

<Note>
Para modelos de Anthropic enrutados a través de Cloudflare AI Gateway, usa tu **clave de API de Anthropic** como clave del proveedor.
</Note>

## Primeros pasos

<Steps>
  <Step title="Establecer la clave de API del proveedor y los detalles de Gateway">
    Ejecuta onboarding y elige la opción de autenticación de Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Esto solicita tu ID de cuenta, ID de Gateway y clave de API.

  </Step>
  <Step title="Establecer un modelo predeterminado">
    Agrega el modelo a tu configuración de OpenClaw:

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
  <Step title="Verificar que el modelo esté disponible">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## Ejemplo no interactivo

Para configuraciones con scripts o CI, pasa todos los valores en la línea de comandos:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Gateways autenticados">
    Si habilitaste la autenticación de Gateway en Cloudflare, agrega el encabezado `cf-aig-authorization`. Esto es **además de** tu clave de API del proveedor.

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
    El encabezado `cf-aig-authorization` autentica con el propio Cloudflare Gateway, mientras que la clave de API del proveedor (por ejemplo, tu clave de Anthropic) autentica con el proveedor ascendente.
    </Tip>

  </Accordion>

  <Accordion title="Nota sobre el entorno">
    Si Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que `CLOUDFLARE_AI_GATEWAY_API_KEY` esté disponible para ese proceso.

    <Warning>
    Una clave presente solo en `~/.profile` no ayudará a un daemon launchd/systemd a menos que ese entorno también se importe allí. Establece la clave en `~/.openclaw/.env` o mediante `env.shellEnv` para garantizar que el proceso de Gateway pueda leerla.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Solución general de problemas y preguntas frecuentes.
  </Card>
</CardGroup>
