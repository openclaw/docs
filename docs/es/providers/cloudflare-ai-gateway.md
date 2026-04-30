---
read_when:
    - Quieres usar Cloudflare AI Gateway con OpenClaw
    - Necesitas el ID de cuenta, el ID de Gateway o la variable de entorno de clave de API
summary: Configuración de Cloudflare AI Gateway (autenticación + selección de modelo)
title: Gateway de IA de Cloudflare
x-i18n:
    generated_at: "2026-04-30T05:56:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7c567076a5b3fea0f09f44d772c0858aed2a4813f91f1cc9f87b0da39c2e5db
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway se sitúa delante de las API de proveedores y te permite añadir análisis, almacenamiento en caché y controles. Para Anthropic, OpenClaw usa la Anthropic Messages API a través de tu endpoint de Gateway.

| Propiedad        | Valor                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------- |
| Proveedor        | `cloudflare-ai-gateway`                                                                  |
| URL base         | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Modelo predeterminado | `cloudflare-ai-gateway/claude-sonnet-4-6`                                           |
| Clave de API     | `CLOUDFLARE_AI_GATEWAY_API_KEY` (tu clave de API de proveedor para solicitudes a través del Gateway) |

<Note>
Para los modelos de Anthropic enrutados a través de Cloudflare AI Gateway, usa tu **clave de API de Anthropic** como clave del proveedor.
</Note>

Cuando el razonamiento está habilitado para los modelos Anthropic Messages, OpenClaw elimina los turnos finales
de prellenado del asistente antes de enviar la carga útil a través de Cloudflare AI Gateway.
Anthropic rechaza el prellenado de respuestas con razonamiento extendido, mientras que el prellenado ordinario
sin razonamiento sigue estando disponible.

## Primeros pasos

<Steps>
  <Step title="Configurar la clave de API del proveedor y los detalles del Gateway">
    Ejecuta la incorporación y elige la opción de autenticación de Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Esto solicita tu ID de cuenta, ID de Gateway y clave de API.

  </Step>
  <Step title="Configurar un modelo predeterminado">
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

Para configuraciones con scripts o de CI, pasa todos los valores en la línea de comandos:

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
    Si habilitaste la autenticación de Gateway en Cloudflare, añade el encabezado `cf-aig-authorization`. Esto es **además de** tu clave de API del proveedor.

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
    El encabezado `cf-aig-authorization` autentica con el Gateway de Cloudflare en sí, mientras que la clave de API del proveedor (por ejemplo, tu clave de Anthropic) autentica con el proveedor ascendente.
    </Tip>

  </Accordion>

  <Accordion title="Nota sobre el entorno">
    Si el Gateway se ejecuta como un demonio (launchd/systemd), asegúrate de que `CLOUDFLARE_AI_GATEWAY_API_KEY` esté disponible para ese proceso.

    <Warning>
    Una clave que solo esté en `~/.profile` no ayudará a un demonio launchd/systemd a menos que ese entorno también se importe allí. Configura la clave en `~/.openclaw/.env` o mediante `env.shellEnv` para asegurarte de que el proceso del gateway pueda leerla.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Solución general de problemas y preguntas frecuentes.
  </Card>
</CardGroup>
