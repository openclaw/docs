---
read_when:
    - Quieres usar Vercel AI Gateway con OpenClaw
    - Necesitas la variable de entorno de la clave de API o la opción de autenticación de la CLI
summary: Configuración de Vercel AI Gateway (autenticación + selección de modelo)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-12T23:33:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48c206a645d7a62e201a35ae94232323c8570fdae63129231c38d363ea78a60b
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

# Vercel AI Gateway

[Vercel AI Gateway](https://vercel.com/ai-gateway) proporciona una API unificada para
acceder a cientos de modelos a través de un único endpoint.

| Property      | Value                            |
| ------------- | -------------------------------- |
| Proveedor     | `vercel-ai-gateway`              |
| Autenticación | `AI_GATEWAY_API_KEY`             |
| API           | Compatible con Anthropic Messages |
| Catálogo de modelos | Descubierto automáticamente mediante `/v1/models` |

<Tip>
OpenClaw descubre automáticamente el catálogo `/v1/models` de Gateway, por lo que
`/models vercel-ai-gateway` incluye referencias de modelo actuales como
`vercel-ai-gateway/openai/gpt-5.4`.
</Tip>

## Primeros pasos

<Steps>
  <Step title="Establecer la clave de API">
    Ejecuta onboarding y elige la opción de autenticación de AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Establecer un modelo predeterminado">
    Agrega el modelo a tu configuración de OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    }
    ```

  </Step>
  <Step title="Verificar que el modelo esté disponible">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Ejemplo no interactivo

Para configuraciones con scripts o CI, pasa todos los valores en la línea de comandos:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Forma abreviada de ID de modelo

OpenClaw acepta referencias abreviadas de modelos Claude de Vercel y las normaliza en
tiempo de ejecución:

| Entrada abreviada                  | Referencia de modelo normalizada          |
| ---------------------------------- | ----------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Puedes usar la forma abreviada o la referencia de modelo completamente calificada en tu
configuración. OpenClaw resuelve automáticamente la forma canónica.
</Tip>

## Notas avanzadas

<AccordionGroup>
  <Accordion title="Variable de entorno para procesos daemon">
    Si el Gateway de OpenClaw se ejecuta como daemon (launchd/systemd), asegúrate de que
    `AI_GATEWAY_API_KEY` esté disponible para ese proceso.

    <Warning>
    Una clave establecida solo en `~/.profile` no será visible para un daemon launchd/systemd
    a menos que ese entorno se importe explícitamente. Establece la clave en
    `~/.openclaw/.env` o mediante `env.shellEnv` para garantizar que el proceso de Gateway pueda
    leerla.
    </Warning>

  </Accordion>

  <Accordion title="Enrutamiento del proveedor">
    Vercel AI Gateway enruta las solicitudes al proveedor ascendente en función del prefijo de la
    referencia del modelo. Por ejemplo, `vercel-ai-gateway/anthropic/claude-opus-4.6` se enruta
    mediante Anthropic, mientras que `vercel-ai-gateway/openai/gpt-5.4` se enruta mediante
    OpenAI. Tu único `AI_GATEWAY_API_KEY` gestiona la autenticación para todos los
    proveedores ascendentes.
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
