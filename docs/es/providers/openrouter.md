---
read_when:
    - Quieres una sola clave de API para muchos LLMs
    - Quieres ejecutar modelos a través de OpenRouter en OpenClaw
summary: Usa la API unificada de OpenRouter para acceder a muchos modelos en OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-12T23:32:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9083c30b9e9846a9d4ef071c350576d4c3083475f4108871eabbef0b9bb9a368
    source_path: providers/openrouter.md
    workflow: 15
---

# OpenRouter

OpenRouter proporciona una **API unificada** que enruta solicitudes a muchos modelos detrás de un único
endpoint y una única clave de API. Es compatible con OpenAI, así que la mayoría de los SDK de OpenAI funcionan cambiando la URL base.

## Primeros pasos

<Steps>
  <Step title="Obtén tu clave de API">
    Crea una clave de API en [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Ejecuta el onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Opcional) Cambia a un modelo específico">
    El onboarding usa `openrouter/auto` de forma predeterminada. Elige más tarde un modelo concreto:

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
Las referencias de modelos siguen el patrón `openrouter/<provider>/<model>`. Para la lista completa de
proveedores y modelos disponibles, consulta [/concepts/model-providers](/es/concepts/model-providers).
</Note>

## Autenticación y encabezados

OpenRouter usa internamente un token Bearer con tu clave de API.

En solicitudes reales de OpenRouter (`https://openrouter.ai/api/v1`), OpenClaw también añade
los encabezados de atribución de app documentados por OpenRouter:

| Header                    | Value                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Si rediriges el proveedor OpenRouter a algún otro proxy o URL base, OpenClaw
**no** inyecta esos encabezados específicos de OpenRouter ni marcadores de caché de Anthropic.
</Warning>

## Notas avanzadas

<AccordionGroup>
  <Accordion title="Marcadores de caché de Anthropic">
    En rutas verificadas de OpenRouter, las referencias de modelos Anthropic conservan los
    marcadores `cache_control` específicos de OpenRouter que OpenClaw usa para
    mejorar la reutilización de la caché de prompts en bloques de prompts del sistema/desarrollador.
  </Accordion>

  <Accordion title="Inyección de thinking / reasoning">
    En rutas compatibles que no sean `auto`, OpenClaw asigna el nivel de thinking seleccionado a
    cargas útiles de reasoning del proxy de OpenRouter. Las sugerencias de modelo no compatibles y
    `openrouter/auto` omiten esa inyección de reasoning.
  </Accordion>

  <Accordion title="Conformación de solicitudes solo para OpenAI">
    OpenRouter sigue ejecutándose a través de la ruta compatible con OpenAI de estilo proxy, por lo que
    la conformación nativa de solicitudes solo de OpenAI, como `serviceTier`, `store` de Responses,
    cargas útiles de compatibilidad de reasoning de OpenAI y sugerencias de caché de prompts, no se reenvía.
  </Accordion>

  <Accordion title="Rutas respaldadas por Gemini">
    Las referencias de OpenRouter respaldadas por Gemini permanecen en la ruta proxy-Gemini: OpenClaw mantiene
    allí la sanitización de thought-signature de Gemini, pero no habilita la validación nativa de
    repetición de Gemini ni las reescrituras de bootstrap.
  </Accordion>

  <Accordion title="Metadatos de enrutamiento del proveedor">
    Si pasas el enrutamiento del proveedor OpenRouter en los parámetros del modelo, OpenClaw lo reenvía
    como metadatos de enrutamiento de OpenRouter antes de que se ejecuten los envoltorios compartidos de stream.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración para agentes, modelos y proveedores.
  </Card>
</CardGroup>
