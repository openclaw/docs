---
read_when:
    - Quieres una sola clave API para muchos LLMs
    - Quieres ejecutar modelos mediante Kilo Gateway en OpenClaw
summary: Usar la API unificada de Kilo Gateway para acceder a muchos modelos en OpenClaw
title: Kilocode
x-i18n:
    generated_at: "2026-04-24T05:44:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa3c29e7b39b1dfb049444c7ef2759555bb3f94479622d58fa2aa8fd6389d01f
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gateway proporciona una **API unificada** que enruta solicitudes a muchos modelos detrás de un único
endpoint y una sola clave API. Es compatible con OpenAI, así que la mayoría de los SDK de OpenAI funcionan cambiando la URL base.

| Propiedad | Valor |
| -------- | ---------------------------------- |
| Proveedor | `kilocode` |
| Autenticación | `KILOCODE_API_KEY` |
| API | Compatible con OpenAI |
| URL base | `https://api.kilo.ai/api/gateway/` |

## Primeros pasos

<Steps>
  <Step title="Crear una cuenta">
    Ve a [app.kilo.ai](https://app.kilo.ai), inicia sesión o crea una cuenta, luego navega a API Keys y genera una nueva clave.
  </Step>
  <Step title="Ejecutar la incorporación">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    O establece la variable de entorno directamente:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Verificar que el modelo está disponible">
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
publica una asignación respaldada por fuente entre tarea y modelo upstream para esa ruta. El enrutamiento
upstream exacto detrás de `kilocode/kilo/auto` pertenece a Kilo Gateway, no está
codificado de forma fija en OpenClaw.
</Note>

## Catálogo integrado

OpenClaw descubre dinámicamente los modelos disponibles desde Kilo Gateway al iniciar. Usa
`/models kilocode` para ver la lista completa de modelos disponibles con tu cuenta.

Cualquier modelo disponible en el gateway puede usarse con el prefijo `kilocode/`:

| Referencia de modelo | Notas |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto` | Predeterminado — enrutamiento inteligente |
| `kilocode/anthropic/claude-sonnet-4` | Anthropic mediante Kilo |
| `kilocode/openai/gpt-5.5` | OpenAI mediante Kilo |
| `kilocode/google/gemini-3-pro-preview` | Google mediante Kilo |
| ...y muchos más | Usa `/models kilocode` para listarlos todos |

<Tip>
Durante el inicio, OpenClaw consulta `GET https://api.kilo.ai/api/gateway/models` y fusiona
los modelos descubiertos antes del catálogo estático alternativo. El fallback incluido siempre
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
    Kilo Gateway está documentado en la fuente como compatible con OpenRouter, por lo que permanece en
    la ruta estilo proxy compatible con OpenAI en lugar de usar la forma nativa de solicitudes de OpenAI.

    - Las referencias Kilo respaldadas por Gemini permanecen en la ruta proxy-Gemini, por lo que OpenClaw mantiene
      allí el saneamiento de thought signatures de Gemini sin habilitar la validación nativa
      de repetición de Gemini ni reescrituras de bootstrap.
    - Kilo Gateway usa internamente un token Bearer con tu clave API.

  </Accordion>

  <Accordion title="Wrapper de stream y razonamiento">
    El wrapper de stream compartido de Kilo agrega el encabezado de la app del proveedor y normaliza
    las cargas útiles de razonamiento por proxy para referencias concretas de modelos compatibles.

    <Warning>
    `kilocode/kilo/auto` y otras sugerencias sin compatibilidad de razonamiento por proxy omiten la inyección de razonamiento. Si necesitas compatibilidad con razonamiento, usa una referencia concreta de modelo como
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Solución de problemas">
    - Si el descubrimiento de modelos falla al inicio, OpenClaw vuelve al catálogo estático incluido que contiene `kilocode/kilo/auto`.
    - Confirma que tu clave API sea válida y que tu cuenta de Kilo tenga habilitados los modelos deseados.
    - Cuando Gateway se ejecuta como daemon, asegúrate de que `KILOCODE_API_KEY` esté disponible para ese proceso (por ejemplo en `~/.openclaw/.env` o mediante `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración de OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Panel de Kilo Gateway, claves API y gestión de cuenta.
  </Card>
</CardGroup>
