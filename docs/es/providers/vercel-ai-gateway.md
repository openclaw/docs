---
read_when:
    - Quieres usar Vercel AI Gateway con OpenClaw
    - Necesitas la variable de entorno de la clave de API o la opción de autenticación de la CLI
summary: Configuración de Vercel AI Gateway (autenticación + selección de modelo)
title: Gateway de IA de Vercel
x-i18n:
    generated_at: "2026-07-05T11:39:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1e4776604491900a914e75caebfd7e27a81e9f859213f5bd5b25582a923d92a
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

El [Vercel AI Gateway](https://vercel.com/ai-gateway) proporciona una API unificada para
acceder a cientos de modelos a través de un único endpoint.

| Propiedad     | Valor                                  |
| ------------- | -------------------------------------- |
| Proveedor     | `vercel-ai-gateway`                    |
| Paquete       | `@openclaw/vercel-ai-gateway-provider` |
| Autenticación | `AI_GATEWAY_API_KEY`                   |
| API           | Compatible con Anthropic Messages      |
| URL base      | `https://ai-gateway.vercel.sh`         |
| Catálogo de modelos | Descubierto automáticamente mediante `/v1/models` |

<Tip>
OpenClaw descubre automáticamente el catálogo `/v1/models` del Gateway, por lo que tanto el
comando de chat `/models vercel-ai-gateway` como
`openclaw models list --provider vercel-ai-gateway` incluyen refs de modelos actuales
como `vercel-ai-gateway/openai/gpt-5.5` y
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Primeros pasos

<Steps>
  <Step title="Instala el plugin">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="Configura la clave de API">
    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```
  </Step>
  <Step title="Configura un modelo predeterminado">
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

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Forma abreviada del ID de modelo

OpenClaw normaliza las refs de modelo abreviadas de Claude en tiempo de ejecución:

| Entrada abreviada                   | Ref de modelo normalizada                      |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Usa cualquiera de las dos formas en tu configuración; OpenClaw resuelve automáticamente
la ref canónica `anthropic/...`.
</Tip>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Variable de entorno para procesos daemon">
    Si el OpenClaw Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que
    `AI_GATEWAY_API_KEY` esté disponible para ese proceso.

    <Warning>
    Una clave exportada solo en una shell interactiva no será visible para un
    daemon launchd/systemd a menos que ese entorno se importe explícitamente. Configura
    la clave en `~/.openclaw/.env` o mediante `env.shellEnv` para garantizar que el proceso del gateway
    pueda leerla.
    </Warning>

  </Accordion>

  <Accordion title="Enrutamiento del proveedor">
    Vercel AI Gateway enruta cada solicitud al proveedor upstream nombrado en el
    prefijo de la ref de modelo. Por ejemplo, `vercel-ai-gateway/anthropic/claude-opus-4.6`
    se enruta a través de Anthropic, `vercel-ai-gateway/openai/gpt-5.5` se enruta a través de
    OpenAI, y `vercel-ai-gateway/moonshotai/kimi-k2.6` se enruta a través de
    MoonshotAI. Una única `AI_GATEWAY_API_KEY` autentica todos los proveedores upstream.
  </Accordion>
  <Accordion title="Niveles de pensamiento">
    Las opciones de `/think` siguen el prefijo del modelo upstream cuando OpenClaw lo reconoce.
    `vercel-ai-gateway/anthropic/...` usa el perfil de pensamiento de Claude,
    incluido el valor predeterminado adaptativo para los modelos Claude 4.6. Las refs de confianza
    `vercel-ai-gateway/openai/...` (`gpt-5.2` y posteriores, además de las variantes de Codex
    hasta `gpt-5.1-codex`) exponen `/think xhigh`. Otras refs con espacio de nombres
    conservan los niveles de razonamiento estándar a menos que los metadatos de su catálogo
    declaren más.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, refs de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Solución general de problemas y preguntas frecuentes.
  </Card>
</CardGroup>
