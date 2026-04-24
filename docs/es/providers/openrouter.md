---
read_when:
    - Quieres una sola clave de API para muchos LLMs
    - Quieres ejecutar modelos mediante OpenRouter en OpenClaw
    - Quieres usar OpenRouter para generación de imágenes
summary: Usar la API unificada de OpenRouter para acceder a muchos modelos en OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-24T05:45:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7516910f67a8adfb107d07cadd73c34ddd110422ecb90278025d4d6344937aac
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter proporciona una **API unificada** que enruta solicitudes a muchos modelos detrás de un único
endpoint y una sola clave de API. Es compatible con OpenAI, así que la mayoría de los SDK de OpenAI funcionan cambiando la URL base.

## Primeros pasos

<Steps>
  <Step title="Obtén tu clave de API">
    Crea una clave de API en [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Ejecuta la incorporación">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Opcional) Cambia a un modelo específico">
    La incorporación usa por defecto `openrouter/auto`. Más adelante puedes elegir un modelo concreto:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## Ejemplo de configuración

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Referencias de modelos

<Note>
Las referencias de modelos siguen el patrón `openrouter/<provider>/<model>`. Para ver la lista completa de
proveedores y modelos disponibles, consulta [/concepts/model-providers](/es/concepts/model-providers).
</Note>

Ejemplos de alternativas incluidas:

| Referencia de modelo                  | Notas                            |
| ------------------------------------- | -------------------------------- |
| `openrouter/auto`                     | Enrutamiento automático de OpenRouter |
| `openrouter/moonshotai/kimi-k2.6`     | Kimi K2.6 mediante MoonshotAI    |
| `openrouter/openrouter/healer-alpha`  | Ruta OpenRouter Healer Alpha     |
| `openrouter/openrouter/hunter-alpha`  | Ruta OpenRouter Hunter Alpha     |

## Generación de imágenes

OpenRouter también puede respaldar la herramienta `image_generate`. Usa un modelo de imagen de OpenRouter en `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw envía las solicitudes de imagen a la API de imágenes de chat completions de OpenRouter con `modalities: ["image", "text"]`. Los modelos de imagen Gemini reciben indicaciones compatibles de `aspectRatio` y `resolution` mediante `image_config` de OpenRouter.

## Autenticación y encabezados

OpenRouter usa internamente un token Bearer con tu clave de API.

En solicitudes reales a OpenRouter (`https://openrouter.ai/api/v1`), OpenClaw también añade
los encabezados documentados de atribución de aplicación de OpenRouter:

| Encabezado                | Valor                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Si vuelves a apuntar el proveedor OpenRouter a otro proxy o URL base, OpenClaw
**no** inyecta esos encabezados específicos de OpenRouter ni marcadores de caché de Anthropic.
</Warning>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Marcadores de caché de Anthropic">
    En rutas OpenRouter verificadas, las referencias de modelos Anthropic mantienen
    los marcadores `cache_control` específicos de Anthropic para OpenRouter que OpenClaw usa para
    una mejor reutilización de la caché de prompts en bloques de prompt de sistema/desarrollador.
  </Accordion>

  <Accordion title="Inyección de thinking / reasoning">
    En rutas compatibles que no sean `auto`, OpenClaw asigna el nivel de thinking seleccionado a
    cargas útiles de razonamiento del proxy de OpenRouter. Las indicaciones de modelos no compatibles y
    `openrouter/auto` omiten esa inyección de razonamiento.
  </Accordion>

  <Accordion title="Ajuste de solicitudes exclusivo de OpenAI">
    OpenRouter sigue pasando por la ruta compatible con OpenAI de estilo proxy, por lo que
    el ajuste de solicitudes exclusivo de OpenAI nativo, como `serviceTier`, `store` de Responses,
    cargas útiles de compatibilidad de razonamiento de OpenAI e indicaciones de caché de prompt, no se reenvía.
  </Accordion>

  <Accordion title="Rutas respaldadas por Gemini">
    Las referencias OpenRouter respaldadas por Gemini permanecen en la ruta proxy-Gemini: OpenClaw conserva
    ahí la sanitización de firmas de pensamiento de Gemini, pero no habilita la validación nativa de repetición de Gemini ni reescrituras de arranque.
  </Accordion>

  <Accordion title="Metadatos de enrutamiento del proveedor">
    Si pasas enrutamiento de proveedor OpenRouter en los parámetros del modelo, OpenClaw lo reenvía
    como metadatos de enrutamiento de OpenRouter antes de que se ejecuten los envoltorios de flujo compartido.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de alternativas.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración para agentes, modelos y proveedores.
  </Card>
</CardGroup>
