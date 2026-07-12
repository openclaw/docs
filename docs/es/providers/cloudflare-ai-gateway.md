---
read_when:
    - Quieres usar Cloudflare AI Gateway con OpenClaw
    - Necesitas el ID de la cuenta, el ID del Gateway o la variable de entorno de la clave de API.
summary: Configuración de Cloudflare AI Gateway (autenticación + selección de modelo)
title: Gateway de IA de Cloudflare
x-i18n:
    generated_at: "2026-07-11T23:25:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02c7785616e7aee645bb3fc41ef6a3585e1f2f9d886fab1a06231e497effd045
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

[Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) se sitúa delante de las API de los proveedores y añade análisis, almacenamiento en caché y controles. Para Anthropic, OpenClaw utiliza la API Messages de Anthropic a través del endpoint de tu Gateway.

| Propiedad          | Valor                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| Proveedor          | `cloudflare-ai-gateway`                                                                            |
| Plugin             | paquete externo oficial (`@openclaw/cloudflare-ai-gateway-provider`)                               |
| URL base           | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`                          |
| Modelo predeterminado | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                       |
| Clave de API       | `CLOUDFLARE_AI_GATEWAY_API_KEY` (tu clave de API del proveedor para solicitudes mediante el Gateway) |

<Note>
Para los modelos de Anthropic enrutados mediante Cloudflare AI Gateway, utiliza tu **clave de API de Anthropic** como clave del proveedor.
</Note>

Cuando el razonamiento está habilitado para los modelos de Anthropic Messages, OpenClaw elimina los turnos finales de precarga del asistente antes de enviar la carga útil mediante Cloudflare AI Gateway. Anthropic rechaza la precarga de respuestas con razonamiento ampliado, mientras que la precarga ordinaria sin razonamiento sigue estando disponible.

## Instalar el Plugin

Instala el Plugin oficial y, después, reinicia el Gateway:

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## Primeros pasos

<Steps>
  <Step title="Configurar la clave de API del proveedor y los datos del Gateway">
    Ejecuta la incorporación y elige la opción de autenticación de Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Se te solicitarán el ID de tu cuenta, el ID del Gateway y la clave de API.

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
  <Step title="Verificar que el modelo esté disponible">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## Ejemplo no interactivo

Para configuraciones mediante scripts o de CI, pasa todos los valores en la línea de comandos:

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
    Si habilitaste la autenticación del Gateway en Cloudflare, añade el encabezado `cf-aig-authorization`. Esto se requiere **además de** la clave de API de tu proveedor.

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
    El encabezado `cf-aig-authorization` autentica con el propio Gateway de Cloudflare, mientras que la clave de API del proveedor (por ejemplo, tu clave de Anthropic) autentica con el proveedor ascendente.
    </Tip>

  </Accordion>

  <Accordion title="Nota sobre el entorno">
    Si el Gateway se ejecuta como demonio (launchd/systemd), asegúrate de que `CLOUDFLARE_AI_GATEWAY_API_KEY` esté disponible para ese proceso.

    <Warning>
    Una clave exportada únicamente en un shell interactivo no estará disponible para un demonio de launchd/systemd, a menos que ese entorno también se importe allí. Configura la clave en `~/.openclaw/.env` o mediante `env.shellEnv` para garantizar que el proceso del Gateway pueda leerla.
    </Warning>

  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Cómo elegir proveedores, referencias de modelos y el comportamiento de conmutación por error.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Solución general de problemas y preguntas frecuentes.
  </Card>
</CardGroup>
