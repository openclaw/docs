---
read_when:
    - Quieres usar Cloudflare AI Gateway con OpenClaw
    - Necesitas el ID de cuenta, el ID de Gateway o la variable de entorno de clave de API
summary: Configuración de Cloudflare AI Gateway (autenticación + selección de modelo)
title: gateway de IA de Cloudflare
x-i18n:
    generated_at: "2026-07-05T11:35:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02c7785616e7aee645bb3fc41ef6a3585e1f2f9d886fab1a06231e497effd045
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

[Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) se sitúa delante de las API de proveedores y añade análisis, caché y controles. Para Anthropic, OpenClaw usa la API Anthropic Messages mediante tu endpoint de Gateway.

| Propiedad             | Valor                                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| Proveedor             | `cloudflare-ai-gateway`                                                                                    |
| Plugin                | paquete externo oficial (`@openclaw/cloudflare-ai-gateway-provider`)                                       |
| URL base              | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`                                 |
| Modelo predeterminado | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                                  |
| Clave de API          | `CLOUDFLARE_AI_GATEWAY_API_KEY` (tu clave de API de proveedor para solicitudes mediante el Gateway)        |

<Note>
Para los modelos de Anthropic enrutados mediante Cloudflare AI Gateway, usa tu **clave de API de Anthropic** como clave del proveedor.
</Note>

Cuando el razonamiento está activado para modelos Anthropic Messages, OpenClaw elimina los turnos finales
de precarga del asistente antes de enviar la carga útil mediante Cloudflare AI Gateway.
Anthropic rechaza la precarga de respuestas con razonamiento extendido, mientras que la precarga
ordinaria sin razonamiento sigue disponible.

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

    Esto solicita tu ID de cuenta, ID de Gateway y clave de API.

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
    Si activaste la autenticación de Gateway en Cloudflare, añade el encabezado `cf-aig-authorization`. Esto es **adicional a** tu clave de API del proveedor.

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
    El encabezado `cf-aig-authorization` se autentica con el Gateway de Cloudflare, mientras que la clave de API del proveedor (por ejemplo, tu clave de Anthropic) se autentica con el proveedor upstream.
    </Tip>

  </Accordion>

  <Accordion title="Environment note">
    Si Gateway se ejecuta como demonio (launchd/systemd), asegúrate de que `CLOUDFLARE_AI_GATEWAY_API_KEY` esté disponible para ese proceso.

    <Warning>
    Una clave exportada solo en un shell interactivo no ayudará a un demonio launchd/systemd a menos que ese entorno también se importe allí. Define la clave en `~/.openclaw/.env` o mediante `env.shellEnv` para garantizar que el proceso de Gateway pueda leerla.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Troubleshooting" href="/es/help/troubleshooting" icon="wrench">
    Resolución general de problemas y preguntas frecuentes.
  </Card>
</CardGroup>
