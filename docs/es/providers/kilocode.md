---
read_when:
    - Quieres una sola API key para muchos LLMs
    - Quieres ejecutar modelos mediante Kilo Gateway en OpenClaw
summary: Usa la API unificada de Kilo Gateway para acceder a muchos modelos en OpenClaw
title: Kilocode
x-i18n:
    generated_at: "2026-04-12T23:31:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32946f2187f3933115341cbe81006718b10583abc4deea7440b5e56366025f4a
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gateway proporciona una **API unificada** que enruta solicitudes a muchos modelos detrás de un solo
endpoint y una sola API key. Es compatible con OpenAI, por lo que la mayoría de los SDK de OpenAI funcionan cambiando la URL base.

| Propiedad | Valor                              |
| --------- | ---------------------------------- |
| Proveedor | `kilocode`                         |
| Autenticación | `KILOCODE_API_KEY`            |
| API       | Compatible con OpenAI              |
| URL base  | `https://api.kilo.ai/api/gateway/` |

## Primeros pasos

<Steps>
  <Step title="Crea una cuenta">
    Ve a [app.kilo.ai](https://app.kilo.ai), inicia sesión o crea una cuenta, luego navega a API Keys y genera una nueva clave.
  </Step>
  <Step title="Ejecuta el onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    O establece la variable de entorno directamente:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Verifica que el modelo esté disponible">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Modelo predeterminado

El modelo predeterminado es `kilocode/kilo/auto`, un
modelo de enrutamiento inteligente propiedad del proveedor y administrado por Kilo Gateway.

<Note>
OpenClaw trata `kilocode/kilo/auto` como la referencia predeterminada estable, pero no
publica una asignación respaldada por el código fuente entre tarea y modelo subyacente para esa ruta. El enrutamiento
subyacente exacto detrás de `kilocode/kilo/auto` pertenece a Kilo Gateway, no está
codificado de forma rígida en OpenClaw.
</Note>

## Modelos disponibles

OpenClaw detecta dinámicamente los modelos disponibles desde Kilo Gateway al iniciarse. Usa
`/models kilocode` para ver la lista completa de modelos disponibles con tu cuenta.

Cualquier modelo disponible en el gateway puede usarse con el prefijo `kilocode/`:

| Referencia del modelo                  | Notas                              |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | Predeterminado — enrutamiento inteligente |
| `kilocode/anthropic/claude-sonnet-4`   | Anthropic a través de Kilo         |
| `kilocode/openai/gpt-5.4`              | OpenAI a través de Kilo            |
| `kilocode/google/gemini-3-pro-preview` | Google a través de Kilo            |
| ...y muchos más                        | Usa `/models kilocode` para listarlos todos |

<Tip>
Al iniciarse, OpenClaw consulta `GET https://api.kilo.ai/api/gateway/models` y combina
los modelos detectados antes del catálogo estático de respaldo. El respaldo integrado siempre
incluye `kilocode/kilo/auto` (`Kilo Auto`) con `input: ["text", "image"]`,
`reasoning: true`, `contextWindow: 1000000` y `maxTokens: 128000`.
</Tip>

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

<AccordionGroup>
  <Accordion title="Transporte y compatibilidad">
    Kilo Gateway está documentado en el código fuente como compatible con OpenRouter, por lo que permanece en
    la ruta de estilo proxy compatible con OpenAI en lugar de usar el formato nativo de solicitudes de OpenAI.

    - Las referencias de Kilo respaldadas por Gemini permanecen en la ruta proxy-Gemini, por lo que OpenClaw mantiene
      allí el saneamiento de thought-signature de Gemini sin habilitar la validación nativa de reproducción de Gemini
      ni reescrituras de arranque.
    - Kilo Gateway usa internamente un token Bearer con tu API key.

  </Accordion>

  <Accordion title="Wrapper de streaming y razonamiento">
    El wrapper de streaming compartido de Kilo agrega el encabezado de la aplicación del proveedor y normaliza
    las cargas útiles de razonamiento del proxy para referencias concretas de modelo compatibles.

    <Warning>
    `kilocode/kilo/auto` y otras sugerencias de proxy no compatibles con razonamiento omiten la inyección
    de razonamiento. Si necesitas compatibilidad con razonamiento, usa una referencia concreta de modelo como
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Solución de problemas">
    - Si la detección de modelos falla al iniciar, OpenClaw recurre al catálogo estático integrado que contiene `kilocode/kilo/auto`.
    - Confirma que tu API key sea válida y que tu cuenta de Kilo tenga habilitados los modelos deseados.
    - Cuando el Gateway se ejecuta como daemon, asegúrate de que `KILOCODE_API_KEY` esté disponible para ese proceso (por ejemplo en `~/.openclaw/.env` o mediante `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración de OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Panel de Kilo Gateway, API keys y administración de cuentas.
  </Card>
</CardGroup>
