---
read_when:
    - Quieres usar DeepSeek con OpenClaw
    - Necesitas la variable de entorno de la clave de API o la opción de autenticación de la CLI
summary: Configuración de DeepSeek (autenticación + selección de modelo)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-30T16:29:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fbc7bd4de14000eaa5c42b17eb8c9312321ed02ac1667e60774ead3f1749eb4
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) proporciona potentes modelos de IA con una API compatible con OpenAI.

| Propiedad | Valor                      |
| -------- | -------------------------- |
| Proveedor | `deepseek`                 |
| Autenticación     | `DEEPSEEK_API_KEY`         |
| API      | compatible con OpenAI          |
| URL base | `https://api.deepseek.com` |

## Primeros pasos

<Steps>
  <Step title="Get your API key">
    Crea una clave de API en [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Esto solicitará tu clave de API y establecerá `deepseek/deepseek-v4-flash` como modelo predeterminado.

  </Step>
  <Step title="Verify models are available">
    ```bash
    openclaw models list --provider deepseek
    ```

    Para inspeccionar el catálogo estático incluido sin requerir un Gateway en ejecución,
    usa:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Non-interactive setup">
    Para instalaciones con scripts o sin interfaz, pasa todas las marcas directamente:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Si el Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que `DEEPSEEK_API_KEY`
esté disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante
`env.shellEnv`).
</Warning>

## Catálogo integrado

| Referencia de modelo                    | Nombre              | Entrada | Contexto   | Salida máxima | Notas                                      |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | texto  | 1,000,000 | 384,000    | Modelo predeterminado; superficie V4 con capacidad de pensamiento |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | texto  | 1,000,000 | 384,000    | Superficie V4 con capacidad de pensamiento                |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | texto  | 131,072   | 8,192      | Superficie DeepSeek V3.2 sin pensamiento         |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | texto  | 131,072   | 65,536     | Superficie V3.2 con razonamiento habilitado             |

<Tip>
Los modelos V4 admiten el control `thinking` de DeepSeek. OpenClaw también reproduce
`reasoning_content` de DeepSeek en turnos de seguimiento para que las sesiones de pensamiento con llamadas a herramientas
puedan continuar.
Usa `/think xhigh` o `/think max` con modelos DeepSeek V4 para solicitar el
`reasoning_effort` máximo de DeepSeek.
</Tip>

## Pensamiento y herramientas

Las sesiones de pensamiento de DeepSeek V4 tienen un contrato de reproducción más estricto que la mayoría de los
proveedores compatibles con OpenAI: después de que un turno con pensamiento habilitado usa herramientas, DeepSeek
espera que los mensajes del asistente reproducidos de ese turno incluyan
`reasoning_content` en las solicitudes de seguimiento. OpenClaw maneja esto dentro del
Plugin de DeepSeek, por lo que el uso normal de herramientas de varios turnos funciona con
`deepseek/deepseek-v4-flash` y `deepseek/deepseek-v4-pro`.

Si cambias una sesión existente de otro proveedor compatible con OpenAI a un
modelo DeepSeek V4, es posible que los turnos anteriores de llamadas a herramientas del asistente no tengan
`reasoning_content` nativo de DeepSeek. OpenClaw completa ese campo faltante en los mensajes
del asistente reproducidos para solicitudes de pensamiento de DeepSeek V4, de modo que el proveedor pueda aceptar
el historial sin requerir `/new`.

Cuando el pensamiento está deshabilitado en OpenClaw (incluida la selección **None** en la interfaz),
OpenClaw envía a DeepSeek `thinking: { type: "disabled" }` y elimina el
`reasoning_content` reproducido del historial saliente. Esto mantiene las sesiones con pensamiento deshabilitado
en la ruta sin pensamiento de DeepSeek.

Usa `deepseek/deepseek-v4-flash` para la ruta rápida predeterminada. Usa
`deepseek/deepseek-v4-pro` cuando quieras el modelo V4 más potente y puedas aceptar
mayor costo o latencia.

## Pruebas en vivo

La suite directa de modelos en vivo incluye DeepSeek V4 en el conjunto de modelos moderno. Para
ejecutar solo las comprobaciones de modelos directos de DeepSeek V4:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Esa comprobación en vivo verifica que ambos modelos V4 puedan completar solicitudes y que los turnos de seguimiento
de pensamiento/herramientas conserven la carga de reproducción que DeepSeek requiere.

## Ejemplo de configuración

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## Relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Configuration reference" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración para agentes, modelos y proveedores.
  </Card>
</CardGroup>
