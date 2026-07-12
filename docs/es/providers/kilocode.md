---
read_when:
    - Quieres una única clave de API para muchos LLM.
    - Quieres ejecutar modelos mediante Kilo Gateway en OpenClaw
summary: Usa la API unificada de Kilo Gateway para acceder a numerosos modelos en OpenClaw
title: Gateway de Kilo
x-i18n:
    generated_at: "2026-07-11T23:27:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2108e1bb5b2430f42bf9e798da1d5e40448f05d396ab1710a0d6708961960756
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway enruta solicitudes a muchos modelos mediante un único endpoint compatible con OpenAI y una única clave de API.

| Propiedad | Valor                              |
| --------- | ---------------------------------- |
| Proveedor | `kilocode`                         |
| Autenticación | `KILOCODE_API_KEY`             |
| API       | Compatible con OpenAI              |
| URL base  | `https://api.kilo.ai/api/gateway/` |

## Instalar el Plugin

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## Configuración

<Steps>
  <Step title="Crear una cuenta">
    Ve a [app.kilo.ai](https://app.kilo.ai), inicia sesión o crea una cuenta y, a continuación, genera una clave de API.
  </Step>
  <Step title="Ejecutar la incorporación">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    También puedes configurar directamente la variable de entorno:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Verificar que el modelo esté disponible">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Modelo predeterminado y catálogo

El modelo predeterminado es `kilocode/kilo/auto`, un modelo de enrutamiento inteligente administrado por el proveedor. OpenClaw no
publica una asignación de tareas a modelos ascendentes para este modelo; Kilo Gateway controla el enrutamiento de `kilo/auto`.

Al iniciarse, OpenClaw consulta `GET https://api.kilo.ai/api/gateway/models` y combina los modelos detectados
antes de un catálogo estático de respaldo. El catálogo estático de respaldo contiene únicamente `kilocode/kilo/auto` (`Kilo Auto`,
`input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000`, `maxTokens: 128000`).

Se puede acceder a cualquier modelo del Gateway como `kilocode/<upstream-id>` (por ejemplo,
`kilocode/anthropic/claude-sonnet-4`, `kilocode/openai/gpt-5.5`). Ejecuta `/models kilocode` o
`openclaw models list --provider kilocode` para ver la lista completa de modelos detectados.

## Ejemplo de configuración

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

## Notas sobre el comportamiento

<AccordionGroup>
  <Accordion title="Transporte y compatibilidad">
    Kilo Gateway es compatible con OpenRouter, por lo que utiliza la ruta de solicitudes de tipo proxy
    compatible con OpenAI, en lugar del formato de solicitudes nativo de OpenAI (sin `store` ni carga útil
    de esfuerzo de razonamiento de OpenAI).

    - Las referencias de Kilo respaldadas por Gemini permanecen en la ruta proxy de Gemini: OpenClaw depura
      allí las firmas de pensamiento de Gemini, pero no habilita la validación de reproducción nativa de Gemini
      ni las reescrituras de inicialización.
    - Las solicitudes utilizan un token Bearer generado a partir de tu clave de API.

  </Accordion>

  <Accordion title="Contenedor del flujo y razonamiento">
    El contenedor del flujo de Kilo añade un encabezado de solicitud `X-KILOCODE-FEATURE` (el valor predeterminado
    es `openclaw`; puedes sobrescribirlo con la variable de entorno `KILOCODE_FEATURE`) y normaliza las cargas útiles
    de esfuerzo de razonamiento para los modelos compatibles.

    <Warning>
    Las referencias `kilocode/kilo/auto` y `x-ai/*` omiten la inyección del esfuerzo de razonamiento. Usa una
    referencia de modelo concreta, como `kilocode/anthropic/claude-sonnet-4`, si necesitas compatibilidad con el razonamiento.
    </Warning>

  </Accordion>

  <Accordion title="Solución de problemas">
    - Si la detección de modelos falla durante el inicio, OpenClaw recurre al catálogo estático que contiene `kilocode/kilo/auto`.
    - Confirma que tu clave de API sea válida y que tu cuenta de Kilo tenga habilitados los modelos que deseas.
    - Cuando el Gateway se ejecute como demonio, asegúrate de que `KILOCODE_API_KEY` esté disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Cómo elegir proveedores, referencias de modelos y el comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración de OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Panel de Kilo Gateway, claves de API y administración de cuentas.
  </Card>
</CardGroup>
