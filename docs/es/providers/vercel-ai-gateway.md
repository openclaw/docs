---
read_when:
    - Quieres usar Gateway de IA de Vercel con OpenClaw
    - Necesitas la variable de entorno de la clave API o la opción de autenticación de la CLI
summary: Configuración de Vercel AI Gateway (autenticación + selección de modelo)
title: Gateway de IA de Vercel
x-i18n:
    generated_at: "2026-04-24T05:46:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1fa1c3c6e44e40d7a1fc89d93ee268c19124b746d4644d58014157be7cceeb9
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) proporciona una API unificada para
acceder a cientos de modelos a través de un único endpoint.

| Property      | Value                            |
| ------------- | -------------------------------- |
| Provider      | `vercel-ai-gateway`              |
| Auth          | `AI_GATEWAY_API_KEY`             |
| API           | Compatible con Anthropic Messages |
| Model catalog | Detectado automáticamente mediante `/v1/models` |

<Tip>
OpenClaw detecta automáticamente el catálogo `/v1/models` del Gateway, así que
`/models vercel-ai-gateway` incluye referencias de modelos actuales como
`vercel-ai-gateway/openai/gpt-5.5` y
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Primeros pasos

<Steps>
  <Step title="Establece la clave API">
    Ejecuta la incorporación y elige la opción de autenticación de AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Establece un modelo predeterminado">
    Añade el modelo a tu configuración de OpenClaw:

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
  <Step title="Verifica que el modelo esté disponible">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Ejemplo no interactivo

Para configuraciones automatizadas o CI, pasa todos los valores en la línea de comandos:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Forma abreviada de ID de modelo

OpenClaw acepta referencias abreviadas de modelos Claude de Vercel y las normaliza en
tiempo de ejecución:

| Shorthand input                     | Normalized model ref                          |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Puedes usar la forma abreviada o la referencia completa del modelo en tu
configuración. OpenClaw resuelve automáticamente la forma canónica.
</Tip>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Variable de entorno para procesos daemon">
    Si OpenClaw Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que
    `AI_GATEWAY_API_KEY` esté disponible para ese proceso.

    <Warning>
    Una clave configurada solo en `~/.profile` no será visible para un daemon de launchd/systemd
    a menos que ese entorno se importe explícitamente. Configura la clave en
    `~/.openclaw/.env` o mediante `env.shellEnv` para asegurar que el proceso del gateway pueda
    leerla.
    </Warning>

  </Accordion>

  <Accordion title="Enrutamiento de proveedores">
    Vercel AI Gateway enruta las solicitudes al proveedor ascendente según el prefijo
    de la referencia del modelo. Por ejemplo, `vercel-ai-gateway/anthropic/claude-opus-4.6` se enruta
    a través de Anthropic, mientras que `vercel-ai-gateway/openai/gpt-5.5` se enruta a través de
    OpenAI y `vercel-ai-gateway/moonshotai/kimi-k2.6` se enruta a través de
    MoonshotAI. Tu única `AI_GATEWAY_API_KEY` gestiona la autenticación para todos los
    proveedores ascendentes.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Solución general de problemas y preguntas frecuentes.
  </Card>
</CardGroup>
