---
read_when:
    - Quieres usar Cloudflare AI Gateway con OpenClaw
    - Necesitas el ID de cuenta, el ID de Gateway o la variable de entorno de clave de API
summary: Configuración de Cloudflare AI Gateway (autenticación + selección de modelo)
title: Gateway de IA de Cloudflare
x-i18n:
    generated_at: "2026-06-27T12:35:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05678faa049349c610a9c7ea9d23958bf51927453cf6987fef397cd273f6556b
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway se sitúa delante de las API de proveedores y te permite añadir analíticas, almacenamiento en caché y controles. Para Anthropic, OpenClaw usa la API Anthropic Messages a través de tu endpoint de Gateway.

| Propiedad             | Valor                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------- |
| Proveedor             | `cloudflare-ai-gateway`                                                                  |
| URL base              | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Modelo predeterminado | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| Clave API             | `CLOUDFLARE_AI_GATEWAY_API_KEY` (tu clave API del proveedor para solicitudes a través del Gateway) |

<Note>
Para los modelos de Anthropic enrutados a través de Cloudflare AI Gateway, usa tu **clave API de Anthropic** como clave del proveedor.
</Note>

Cuando el razonamiento está habilitado para modelos Anthropic Messages, OpenClaw elimina los turnos finales de prerrelleno del asistente antes de enviar la carga a través de Cloudflare AI Gateway.
Anthropic rechaza el prerrelleno de respuestas con razonamiento extendido, mientras que el prerrelleno ordinario sin razonamiento sigue estando disponible.

## Instalar Plugin

Instala el Plugin oficial y luego reinicia Gateway:

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## Primeros pasos

<Steps>
  <Step title="Set the provider API key and Gateway details">
    Ejecuta la incorporación y elige la opción de autenticación de Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Esto solicita tu ID de cuenta, ID de gateway y clave API.

  </Step>
  <Step title="Set a default model">
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
  <Step title="Verify the model is available">
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
  <Accordion title="Authenticated gateways">
    Si habilitaste la autenticación de Gateway en Cloudflare, añade el encabezado `cf-aig-authorization`. Esto es **además de** tu clave API del proveedor.

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
    El encabezado `cf-aig-authorization` autentica con el propio Cloudflare Gateway, mientras que la clave API del proveedor (por ejemplo, tu clave de Anthropic) autentica con el proveedor ascendente.
    </Tip>

  </Accordion>

  <Accordion title="Environment note">
    Si Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que `CLOUDFLARE_AI_GATEWAY_API_KEY` esté disponible para ese proceso.

    <Warning>
    Una clave exportada solo en un shell interactivo no ayudará a un daemon launchd/systemd a menos que ese entorno también se importe allí. Define la clave en `~/.openclaw/.env` o mediante `env.shellEnv` para asegurarte de que el proceso de gateway pueda leerla.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Troubleshooting" href="/es/help/troubleshooting" icon="wrench">
    Solución general de problemas y preguntas frecuentes.
  </Card>
</CardGroup>
