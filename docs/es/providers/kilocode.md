---
read_when:
    - Quieres una sola clave de API para muchos LLMs
    - Quieres ejecutar modelos mediante Kilo Gateway en OpenClaw
summary: Usa la API unificada de Kilo Gateway para acceder a muchos modelos en OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-07-05T11:40:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2108e1bb5b2430f42bf9e798da1d5e40448f05d396ab1710a0d6708961960756
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway enruta solicitudes a muchos modelos detrás de un único endpoint compatible con OpenAI y una clave de API.

| Propiedad | Valor                              |
| -------- | ---------------------------------- |
| Proveedor | `kilocode`                         |
| Autenticación | `KILOCODE_API_KEY`                 |
| API      | compatible con OpenAI                  |
| URL base | `https://api.kilo.ai/api/gateway/` |

## Instalar Plugin

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## Configuración

<Steps>
  <Step title="Create an account">
    Ve a [app.kilo.ai](https://app.kilo.ai), inicia sesión o crea una cuenta y, luego, genera una clave de API.
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    O configura directamente la variable de entorno:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Modelo predeterminado y catálogo

El modelo predeterminado es `kilocode/kilo/auto`, un modelo de enrutamiento inteligente propiedad del proveedor. OpenClaw no
publica una asignación de tarea a modelo ascendente para él; el enrutamiento detrás de `kilo/auto` es propiedad de Kilo Gateway.

Al iniciarse, OpenClaw consulta `GET https://api.kilo.ai/api/gateway/models` y fusiona los modelos descubiertos
antes de un catálogo alternativo estático. El catálogo alternativo estático contiene solo `kilocode/kilo/auto` (`Kilo Auto`,
`input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000`, `maxTokens: 128000`).

Cualquier modelo en el Gateway se puede direccionar como `kilocode/<upstream-id>` (por ejemplo
`kilocode/anthropic/claude-sonnet-4`, `kilocode/openai/gpt-5.5`). Ejecuta `/models kilocode` u
`openclaw models list --provider kilocode` para ver la lista completa descubierta.

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

## Notas de comportamiento

<AccordionGroup>
  <Accordion title="Transport and compatibility">
    Kilo Gateway es compatible con OpenRouter, por lo que usa la ruta de solicitud compatible con OpenAI de estilo proxy
    en lugar del formato de solicitud nativo de OpenAI (sin `store`, sin payload de esfuerzo de razonamiento de OpenAI).

    - Las referencias de Kilo respaldadas por Gemini permanecen en la ruta proxy-Gemini: OpenClaw depura allí las
      firmas de pensamiento de Gemini, pero no habilita la validación de reproducción nativa de Gemini ni las reescrituras de arranque.
    - Las solicitudes usan un token Bearer construido a partir de tu clave de API.

  </Accordion>

  <Accordion title="Stream wrapper and reasoning">
    El envoltorio de transmisión de Kilo agrega un encabezado de solicitud `X-KILOCODE-FEATURE` (predeterminado: `openclaw`;
    se puede sobrescribir con la variable de entorno `KILOCODE_FEATURE`) y normaliza los payloads de esfuerzo de razonamiento para
    los modelos que lo admiten.

    <Warning>
    Las referencias `kilocode/kilo/auto` y `x-ai/*` omiten la inyección de esfuerzo de razonamiento. Usa una referencia de modelo concreta
    como `kilocode/anthropic/claude-sonnet-4` si necesitas compatibilidad con razonamiento.
    </Warning>

  </Accordion>

  <Accordion title="Troubleshooting">
    - Si el descubrimiento de modelos falla al iniciarse, OpenClaw recurre al catálogo estático que contiene `kilocode/kilo/auto`.
    - Confirma que tu clave de API sea válida y que tu cuenta de Kilo tenga habilitados los modelos deseados.
    - Cuando Gateway se ejecuta como daemon, asegúrate de que `KILOCODE_API_KEY` esté disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Configuration reference" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración de OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Panel de Kilo Gateway, claves de API y administración de cuentas.
  </Card>
</CardGroup>
