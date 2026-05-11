---
read_when:
    - Quieres una única clave de API para varios LLM
    - Quieres ejecutar modelos a través de Kilo Gateway en OpenClaw
summary: Usa la API unificada de Kilo Gateway para acceder a muchos modelos en OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-05-11T20:50:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3de2d983a028082d0a897fdafa48ff1f2ad82f3aacec547763159db07adb00a2
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway proporciona una **API unificada** que enruta solicitudes a muchos modelos detrás de un único
endpoint y una clave de API. Es compatible con OpenAI, por lo que la mayoría de los SDK de OpenAI funcionan cambiando la URL base.

| Propiedad | Valor                              |
| -------- | ---------------------------------- |
| Proveedor | `kilocode`                         |
| Autenticación     | `KILOCODE_API_KEY`                 |
| API      | Compatible con OpenAI                  |
| URL base | `https://api.kilo.ai/api/gateway/` |

## Primeros pasos

<Steps>
  <Step title="Crear una cuenta">
    Ve a [app.kilo.ai](https://app.kilo.ai), inicia sesión o crea una cuenta, luego navega a API Keys y genera una clave nueva.
  </Step>
  <Step title="Ejecutar la incorporación">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    O configura directamente la variable de entorno:

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

## Modelo predeterminado

El modelo predeterminado es `kilocode/kilo/auto`, un modelo de enrutamiento inteligente
propiedad del proveedor y gestionado por Kilo Gateway.

<Note>
OpenClaw trata `kilocode/kilo/auto` como la referencia predeterminada estable, pero no
publica una asignación de tareas a modelos ascendentes respaldada por fuentes para esa ruta. El
enrutamiento ascendente exacto detrás de `kilocode/kilo/auto` pertenece a Kilo Gateway, no está
codificado de forma rígida en OpenClaw.
</Note>

## Catálogo integrado

OpenClaw descubre dinámicamente los modelos disponibles desde Kilo Gateway al iniciarse. Usa
`/models kilocode` para ver la lista completa de modelos disponibles con tu cuenta.

Cualquier modelo disponible en el Gateway se puede usar con el prefijo `kilocode/`:

| Referencia de modelo                                | Notas                              |
| ---------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                     | Predeterminado — enrutamiento inteligente            |
| `kilocode/anthropic/claude-sonnet-4`     | Anthropic mediante Kilo                 |
| `kilocode/openai/gpt-5.5`                | OpenAI mediante Kilo                    |
| `kilocode/google/gemini-3.1-pro-preview` | Google mediante Kilo                    |
| ...y muchos más                         | Usa `/models kilocode` para listar todos |

<Tip>
Al iniciarse, OpenClaw consulta `GET https://api.kilo.ai/api/gateway/models` y combina
los modelos descubiertos antes del catálogo de respaldo estático. El respaldo incluido siempre
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
    la ruta de estilo proxy compatible con OpenAI en lugar de usar el conformado nativo de solicitudes de OpenAI.

    - Las referencias de Kilo respaldadas por Gemini permanecen en la ruta proxy-Gemini, por lo que OpenClaw mantiene
      allí la depuración de firmas de pensamiento de Gemini sin habilitar la validación de reproducción nativa de Gemini
      ni las reescrituras de arranque.
    - Kilo Gateway usa internamente un token Bearer con tu clave de API.

  </Accordion>

  <Accordion title="Contenedor de stream y razonamiento">
    El contenedor de stream compartido de Kilo añade el encabezado de aplicación del proveedor y normaliza
    las cargas de razonamiento de proxy para las referencias de modelo concretas compatibles.

    <Warning>
    `kilocode/kilo/auto` y otras sugerencias no compatibles con razonamiento de proxy omiten la
    inyección de razonamiento. Si necesitas compatibilidad con razonamiento, usa una referencia de modelo concreta como
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Solución de problemas">
    - Si el descubrimiento de modelos falla al inicio, OpenClaw recurre al catálogo estático incluido que contiene `kilocode/kilo/auto`.
    - Confirma que tu clave de API sea válida y que tu cuenta de Kilo tenga habilitados los modelos deseados.
    - Cuando el Gateway se ejecuta como daemon, asegúrate de que `KILOCODE_API_KEY` esté disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración de OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Panel de Kilo Gateway, claves de API y gestión de cuenta.
  </Card>
</CardGroup>
