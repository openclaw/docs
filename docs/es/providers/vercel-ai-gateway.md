---
read_when:
    - Quieres usar Vercel AI Gateway con OpenClaw
    - Necesitas la variable de entorno de la clave de API o la opción de autenticación de la CLI
summary: Configuración de Vercel AI Gateway (autenticación + selección de modelo)
title: Gateway de IA de Vercel
x-i18n:
    generated_at: "2026-07-11T23:28:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1e4776604491900a914e75caebfd7e27a81e9f859213f5bd5b25582a923d92a
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

El [Vercel AI Gateway](https://vercel.com/ai-gateway) proporciona una API unificada para
acceder a cientos de modelos mediante un único endpoint.

| Propiedad           | Valor                                  |
| ------------------- | -------------------------------------- |
| Proveedor           | `vercel-ai-gateway`                    |
| Paquete             | `@openclaw/vercel-ai-gateway-provider` |
| Autenticación       | `AI_GATEWAY_API_KEY`                   |
| API                 | Compatible con Anthropic Messages      |
| URL base            | `https://ai-gateway.vercel.sh`         |
| Catálogo de modelos | Detectado automáticamente mediante `/v1/models` |

<Tip>
OpenClaw detecta automáticamente el catálogo `/v1/models` del Gateway, por lo que tanto el
comando de chat `/models vercel-ai-gateway` como
`openclaw models list --provider vercel-ai-gateway` incluyen referencias de modelos
actuales como `vercel-ai-gateway/openai/gpt-5.5` y
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Primeros pasos

<Steps>
  <Step title="Instalar el plugin">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="Configurar la clave de API">
    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```
  </Step>
  <Step title="Configurar un modelo predeterminado">
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

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Forma abreviada del ID de modelo

OpenClaw normaliza en tiempo de ejecución las referencias abreviadas de modelos Claude:

| Entrada abreviada                   | Referencia de modelo normalizada              |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Use cualquiera de las dos formas en su configuración; OpenClaw resuelve automáticamente
la referencia canónica `anthropic/...`.
</Tip>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Variable de entorno para procesos demonio">
    Si el Gateway de OpenClaw se ejecuta como demonio (launchd/systemd), asegúrese de que
    `AI_GATEWAY_API_KEY` esté disponible para ese proceso.

    <Warning>
    Una clave exportada únicamente en un shell interactivo no será visible para un
    demonio de launchd/systemd, a menos que ese entorno se importe explícitamente. Configure
    la clave en `~/.openclaw/.env` o mediante `env.shellEnv` para garantizar que el proceso
    del Gateway pueda leerla.
    </Warning>

  </Accordion>

  <Accordion title="Enrutamiento de proveedores">
    Vercel AI Gateway enruta cada solicitud al proveedor ascendente indicado en el
    prefijo de la referencia del modelo. Por ejemplo, `vercel-ai-gateway/anthropic/claude-opus-4.6`
    se enruta mediante Anthropic, `vercel-ai-gateway/openai/gpt-5.5` se enruta mediante
    OpenAI y `vercel-ai-gateway/moonshotai/kimi-k2.6` se enruta mediante
    MoonshotAI. Una sola `AI_GATEWAY_API_KEY` autentica a todos los proveedores ascendentes.
  </Accordion>
  <Accordion title="Niveles de razonamiento">
    Las opciones de `/think` siguen el prefijo del modelo ascendente cuando OpenClaw lo
    reconoce. `vercel-ai-gateway/anthropic/...` utiliza el perfil de razonamiento de Claude,
    incluido el valor adaptativo predeterminado para los modelos Claude 4.6. Las referencias
    de confianza `vercel-ai-gateway/openai/...` (`gpt-5.2` y posteriores, además de las
    variantes de Codex hasta `gpt-5.1-codex`) ofrecen `/think xhigh`. Las demás referencias
    con espacio de nombres mantienen los niveles de razonamiento estándar, salvo que los
    metadatos de su catálogo indiquen más.
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
