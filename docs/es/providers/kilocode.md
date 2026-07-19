---
read_when:
    - Se necesita una sola clave de API para muchos LLMs
    - Se desea ejecutar modelos mediante Kilo Gateway en OpenClaw
summary: Usa la API unificada de Kilo Gateway para acceder a muchos modelos en OpenClaw
title: Gateway de Kilo
x-i18n:
    generated_at: "2026-07-19T02:08:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0246a1a77f4265168b213e0167360e1cd89dc2ca864997f08cae5331037f9e89
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway enruta solicitudes a numerosos modelos mediante un único endpoint compatible con OpenAI y una clave de API.

| Propiedad | Valor                              |
| -------- | ---------------------------------- |
| Proveedor | `kilocode`                         |
| Autenticación     | `KILOCODE_API_KEY`                 |
| API      | Compatible con OpenAI                  |
| URL base | `https://api.kilo.ai/api/gateway/` |

## Instalar el plugin

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## Configuración

<Steps>
  <Step title="Crear una cuenta">
    Vaya a [app.kilo.ai](https://app.kilo.ai), inicie sesión o cree una cuenta y, a continuación, genere una clave de API.
  </Step>
  <Step title="Ejecutar la incorporación">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    También puede configurar directamente la variable de entorno:

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

El modelo predeterminado es `kilocode/kilo-auto/balanced`, el nivel equilibrado de enrutamiento inteligente de Kilo Gateway.
OpenClaw no publica para este una correspondencia entre tareas y modelos ascendentes; el enrutamiento detrás de
`kilo-auto/balanced` es responsabilidad de Kilo Gateway.

Al iniciarse, OpenClaw consulta `GET https://api.kilo.ai/api/gateway/models` y combina los modelos detectados
antes de un catálogo de respaldo estático. El respaldo estático solo contiene
`kilocode/kilo-auto/balanced` (`Auto Balanced`, `input: ["text", "image"]`, `reasoning: true`,
`contextWindow: 1000000`, `maxTokens: 65536`).

Se puede acceder a cualquier modelo del Gateway como `kilocode/<upstream-id>` (por ejemplo,
`kilocode/anthropic/claude-sonnet-4`, `kilocode/openai/gpt-5.5`). Ejecute `/models kilocode` o
`openclaw models list --provider kilocode` para ver la lista completa de modelos detectados.

## Ejemplo de configuración

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo-auto/balanced" },
    },
  },
}
```

## Notas de comportamiento

<AccordionGroup>
  <Accordion title="Transporte y compatibilidad">
    Kilo Gateway es compatible con OpenRouter, por lo que utiliza la ruta de solicitudes compatible con OpenAI
    de tipo proxy, en lugar del formato de solicitudes nativo de OpenAI (sin `store`, sin carga útil de esfuerzo de razonamiento de OpenAI).

    - Las referencias de Kilo respaldadas por Gemini permanecen en la ruta proxy de Gemini: OpenClaw sanea allí las firmas
      de pensamiento de Gemini, pero no habilita la validación de reproducción nativa de Gemini ni las reescrituras de inicialización.
    - Las solicitudes utilizan un token Bearer creado a partir de la clave de API.

  </Accordion>

  <Accordion title="Contenedor de flujo y razonamiento">
    El contenedor de flujo de Kilo añade un encabezado de solicitud `X-KILOCODE-FEATURE` (valor predeterminado: `openclaw`;
    se puede sustituir mediante la variable de entorno `KILOCODE_FEATURE`) y normaliza las cargas útiles de esfuerzo de razonamiento para
    los modelos que lo admiten.

    <Warning>
    Las referencias `kilocode/kilo-auto/balanced` y `x-ai/*` omiten la inyección del esfuerzo de razonamiento. Utilice una referencia
    de modelo concreta, como `kilocode/anthropic/claude-sonnet-4`, si necesita compatibilidad con el razonamiento.
    </Warning>

  </Accordion>

  <Accordion title="Solución de problemas">
    - Si la detección de modelos falla durante el inicio, OpenClaw recurre al catálogo estático que contiene `kilocode/kilo-auto/balanced`.
    - Confirme que la clave de API sea válida y que la cuenta de Kilo tenga habilitados los modelos deseados.
    - Cuando Gateway se ejecuta como demonio, asegúrese de que `KILOCODE_API_KEY` esté disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración de OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Panel de Kilo Gateway, claves de API y gestión de la cuenta.
  </Card>
</CardGroup>
