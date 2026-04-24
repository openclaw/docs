---
read_when:
    - Quieres usar Cloudflare AI Gateway con OpenClaw
    - Necesitas el ID de cuenta, el ID de gateway o la variable de entorno de clave API
summary: Configuración de Cloudflare AI Gateway (autenticación + selección de modelo)
title: Gateway de IA de Cloudflare
x-i18n:
    generated_at: "2026-04-24T05:44:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb10ef4bd92db88b2b3dac1773439ab2ba37916a72d1925995d74ef787fa1c8b
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

Cloudflare AI Gateway se sitúa delante de las API de proveedores y te permite añadir analíticas, almacenamiento en caché y controles. Para Anthropic, OpenClaw usa la API Anthropic Messages a través del endpoint de tu Gateway.

| Propiedad     | Valor                                                                                   |
| ------------- | --------------------------------------------------------------------------------------- |
| Proveedor     | `cloudflare-ai-gateway`                                                                 |
| URL base      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`             |
| Modelo predeterminado | `cloudflare-ai-gateway/claude-sonnet-4-6`                                       |
| Clave API     | `CLOUDFLARE_AI_GATEWAY_API_KEY` (tu clave API del proveedor para solicitudes a través del Gateway) |

<Note>
Para modelos de Anthropic enrutados a través de Cloudflare AI Gateway, usa tu **clave API de Anthropic** como clave del proveedor.
</Note>

## Primeros pasos

<Steps>
  <Step title="Establecer la clave API del proveedor y los detalles del Gateway">
    Ejecuta la incorporación y elige la opción de autenticación de Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Esto solicita tu ID de cuenta, ID de gateway y clave API.

  </Step>
  <Step title="Establecer un modelo predeterminado">
    Añade el modelo a tu configuración de OpenClaw:

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
  <Step title="Verificar que el modelo está disponible">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## Ejemplo no interactivo

Para configuraciones mediante scripts o CI, pasa todos los valores en la línea de comandos:

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
    Si habilitaste autenticación de Gateway en Cloudflare, añade la cabecera `cf-aig-authorization`. Esto es **además de** tu clave API del proveedor.

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
    La cabecera `cf-aig-authorization` autentica con el propio Gateway de Cloudflare, mientras que la clave API del proveedor (por ejemplo, tu clave de Anthropic) autentica con el proveedor ascendente.
    </Tip>

  </Accordion>

  <Accordion title="Nota sobre el entorno">
    Si Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que `CLOUDFLARE_AI_GATEWAY_API_KEY` esté disponible para ese proceso.

    <Warning>
    Una clave situada solo en `~/.profile` no ayudará a un daemon launchd/systemd a menos que ese entorno también se importe allí. Establece la clave en `~/.openclaw/.env` o mediante `env.shellEnv` para garantizar que el proceso gateway pueda leerla.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de failover.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Solución general de problemas y preguntas frecuentes.
  </Card>
</CardGroup>
