---
read_when:
    - Quieres usar Vercel AI Gateway con OpenClaw
    - Se necesita la variable de entorno de la clave de API o la opción de autenticación de CLI
summary: Configuración de Vercel AI Gateway (autenticación + selección de modelo)
title: Gateway de IA de Vercel
x-i18n:
    generated_at: "2026-04-30T05:59:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3bbe498a04c2073020fcfbbe68cb506eca4c52c3274e4eca6ab7e6893fcfa56
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

The [Vercel AI Gateway](https://vercel.com/ai-gateway) proporciona una API unificada para
acceder a cientos de modelos mediante un único endpoint.

| Propiedad     | Valor                            |
| ------------- | -------------------------------- |
| Proveedor     | `vercel-ai-gateway`              |
| Auth          | `AI_GATEWAY_API_KEY`             |
| API           | compatible con Anthropic Messages |
| Catálogo de modelos | Descubierto automáticamente mediante `/v1/models` |

<Tip>
OpenClaw descubre automáticamente el catálogo `/v1/models` del Gateway, por lo que
`/models vercel-ai-gateway` incluye referencias de modelos actuales como
`vercel-ai-gateway/openai/gpt-5.5` y
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Primeros pasos

<Steps>
  <Step title="Set the API key">
    Ejecuta la incorporación y elige la opción de autenticación de AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Set a default model">
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
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Ejemplo no interactivo

Para configuraciones con scripts o de CI, pasa todos los valores en la línea de comandos:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Forma abreviada del ID de modelo

OpenClaw acepta referencias abreviadas de modelos Claude de Vercel y las normaliza en
tiempo de ejecución:

| Entrada abreviada                   | Referencia de modelo normalizada                |
| ----------------------------------- | ----------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Puedes usar la forma abreviada o la referencia de modelo completamente calificada en tu
configuración. OpenClaw resuelve automáticamente la forma canónica.
</Tip>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Environment variable for daemon processes">
    Si el OpenClaw Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que
    `AI_GATEWAY_API_KEY` esté disponible para ese proceso.

    <Warning>
    Una clave configurada solo en `~/.profile` no será visible para un daemon
    launchd/systemd a menos que ese entorno se importe explícitamente. Configura la clave en
    `~/.openclaw/.env` o mediante `env.shellEnv` para garantizar que el proceso del Gateway pueda
    leerla.
    </Warning>

  </Accordion>

  <Accordion title="Provider routing">
    Vercel AI Gateway enruta las solicitudes al proveedor ascendente según el prefijo
    de la referencia de modelo. Por ejemplo, `vercel-ai-gateway/anthropic/claude-opus-4.6` se enruta
    mediante Anthropic, mientras que `vercel-ai-gateway/openai/gpt-5.5` se enruta mediante
    OpenAI y `vercel-ai-gateway/moonshotai/kimi-k2.6` se enruta mediante
    MoonshotAI. Tu única `AI_GATEWAY_API_KEY` gestiona la autenticación para todos
    los proveedores ascendentes.
  </Accordion>
  <Accordion title="Thinking levels">
    Las opciones de `/think` siguen prefijos de modelos ascendentes de confianza cuando OpenClaw conoce
    el contrato del proveedor ascendente. `vercel-ai-gateway/anthropic/...` usa el
    perfil de razonamiento de Claude, incluidos los valores predeterminados adaptativos para modelos Claude 4.6.
    `vercel-ai-gateway/openai/gpt-5.4`, `gpt-5.5` y las referencias de estilo Codex exponen
    `/think xhigh` igual que los proveedores directos OpenAI/OpenAI Codex. Otras
    referencias con espacio de nombres conservan los niveles normales de razonamiento, salvo que sus metadatos
    de catálogo declaren más.
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
