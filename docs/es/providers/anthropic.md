---
read_when:
    - Quieres usar modelos de Anthropic en OpenClaw
summary: Usa Anthropic Claude mediante claves de API o Claude CLI en OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-06-27T12:33:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 299bb8661bb894c57ca7a60f350494d22f6b726061ffcb70df053c40a3f842b0
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic crea la familia de modelos **Claude**. OpenClaw admite dos rutas de autenticación:

- **Clave de API** — acceso directo a la API de Anthropic con facturación basada en uso (modelos `anthropic/*`)
- **Claude CLI** — reutiliza un inicio de sesión existente de Claude Code en el mismo host

<Warning>
El backend Claude CLI de OpenClaw ejecuta la CLI de Claude Code instalada en
modo de impresión no interactivo. La documentación actual de Claude Code de Anthropic describe
`claude -p` como uso programático/de Agent SDK. A partir del 15 de junio de 2026, Anthropic
dice que el uso de `claude -p` con plan de suscripción ya no consume los límites normales del plan
Claude; primero consume un crédito mensual separado de Agent SDK y luego
créditos de uso a tarifas estándar de API cuando esos créditos están habilitados.

Claude Code interactivo sigue consumiendo los límites del plan Claude con sesión iniciada. La autenticación con
clave de API sigue siendo facturación directa de API de pago por uso. Para hosts de Gateway de larga duración,
automatización compartida y gasto de producción predecible, usa una clave de API de Anthropic.

Documentación pública actual de Anthropic:

- [Referencia de la CLI de Claude Code](https://code.claude.com/docs/en/cli-usage)
- [Usar Claude Agent SDK con tu plan Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Usar Claude Code con tu plan Pro o Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Usar Claude Code con tu plan Team o Enterprise](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Gestionar los costos de Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## Primeros pasos

<Tabs>
  <Tab title="API key">
    **Ideal para:** acceso estándar a la API y facturación basada en uso.

    <Steps>
      <Step title="Get your API key">
        Crea una clave de API en la [Consola de Anthropic](https://console.anthropic.com/).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        O pasa la clave directamente:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Ejemplo de configuración

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Ideal para:** reutilizar un inicio de sesión existente de Claude CLI sin una clave de API separada.

    <Steps>
      <Step title="Ensure Claude CLI is installed and logged in">
        Verifica con:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw detecta y reutiliza las credenciales existentes de Claude CLI.
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Los detalles de configuración y tiempo de ejecución del backend Claude CLI están en [Backends de CLI](/es/gateway/cli-backends).
    </Note>

    <Warning>
    La reutilización de Claude CLI espera que el proceso de OpenClaw se ejecute en el mismo host que el
    inicio de sesión de Claude CLI. Las instalaciones de Docker pueden conservar el directorio de inicio de un contenedor e iniciar sesión en
    Claude Code allí; consulta
    [Backend Claude CLI en Docker](/es/install/docker#claude-cli-backend-in-docker).
    Otras instalaciones en contenedores, como [Podman](/es/install/podman), no montan el
    `~/.claude` del host en la configuración ni en el tiempo de ejecución; usa allí una clave de API de Anthropic o elige
    un proveedor con OAuth gestionado por OpenClaw, como
    [OpenAI Codex](/es/providers/openai).
    </Warning>

    ### Ejemplo de configuración

    Prefiere la referencia canónica del modelo de Anthropic más una anulación de runtime de CLI:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    Las referencias de modelo heredadas `claude-cli/claude-opus-4-7` siguen funcionando por
    compatibilidad, pero la configuración nueva debe mantener la selección de proveedor/modelo como
    `anthropic/*` y colocar el backend de ejecución en la política de runtime de proveedor/modelo.

    ### Facturación y `claude -p`

    OpenClaw usa la ruta no interactiva `claude -p` de Claude Code para las ejecuciones de Claude CLI.
    Anthropic actualmente trata esa ruta como uso programático/de Agent SDK:

    - Hasta el 15 de junio de 2026, el manejo del plan de suscripción sigue las reglas activas de
      Claude Code de Anthropic para la cuenta con sesión iniciada.
    - A partir del 15 de junio de 2026, el uso de `claude -p` con plan de suscripción consume primero el
      crédito mensual de Agent SDK del usuario y luego créditos de uso a tarifas estándar de
      API si los créditos de uso están habilitados.
    - Los inicios de sesión de consola/clave de API usan facturación de API de pago por uso y no reciben
      el crédito de Agent SDK de suscripción.

    Anthropic puede cambiar el comportamiento de facturación y límites de tasa de Claude Code sin una
    versión de OpenClaw. Revisa `claude auth status`, `/status` y
    la documentación enlazada de Anthropic cuando la previsibilidad de la facturación sea importante.

    <Tip>
    Para automatización de producción compartida, usa una clave de API de Anthropic en lugar de
    Claude CLI. OpenClaw también admite opciones de estilo suscripción de
    [OpenAI Codex](/es/providers/openai), [Qwen Cloud](/es/providers/qwen),
    [MiniMax](/es/providers/minimax) y [Z.AI / GLM](/es/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Valores predeterminados de pensamiento (Claude Fable 5, 4.8 y 4.6)

`anthropic/claude-fable-5` siempre usa pensamiento adaptativo y tiene `high`
como esfuerzo predeterminado. Debido a que Anthropic no permite deshabilitar el pensamiento para este modelo,
`/think off` y `/think minimal` usan esfuerzo `low`. OpenClaw también omite valores de
temperatura personalizados para solicitudes de Fable 5.

Claude Opus 4.8 mantiene el pensamiento desactivado de forma predeterminada en OpenClaw. Cuando habilitas explícitamente el pensamiento adaptativo con `/think high|xhigh|max`, OpenClaw envía los valores de esfuerzo Opus 4.8 de Anthropic; los modelos Claude 4.6 usan `adaptive` de forma predeterminada.

Anula por mensaje con `/think:<level>` o en los parámetros del modelo:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
Documentación relacionada de Anthropic:
- [Pensamiento adaptativo](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Pensamiento extendido](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Almacenamiento en caché de prompts

OpenClaw admite la función de almacenamiento en caché de prompts de Anthropic para autenticación con clave de API.

| Valor                  | Duración de caché | Descripción                                            |
| ---------------------- | ----------------- | ------------------------------------------------------ |
| `"short"` (predeterminado) | 5 minutos         | Se aplica automáticamente para autenticación con clave de API |
| `"long"`               | 1 hora            | Caché extendida                                       |
| `"none"`               | Sin caché         | Deshabilita el almacenamiento en caché de prompts      |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Per-agent cache overrides">
    Usa parámetros a nivel de modelo como base y luego anula agentes específicos mediante `agents.list[].params`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Orden de combinación de configuración:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (`id` coincidente, anula por clave)

    Esto permite que un agente mantenga una caché de larga duración mientras otro agente en el mismo modelo deshabilita el almacenamiento en caché para tráfico con ráfagas o poca reutilización.

  </Accordion>

  <Accordion title="Bedrock Claude notes">
    - Los modelos Anthropic Claude en Bedrock (`amazon-bedrock/*anthropic.claude*`) aceptan el paso directo de `cacheRetention` cuando está configurado.
    - Los modelos de Bedrock que no son de Anthropic se fuerzan a `cacheRetention: "none"` en tiempo de ejecución.
    - Los valores predeterminados inteligentes de clave de API también inicializan `cacheRetention: "short"` para referencias de Claude en Bedrock cuando no se define ningún valor explícito.

  </Accordion>
</AccordionGroup>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Fast mode">
    El interruptor compartido `/fast` de OpenClaw admite tráfico directo de Anthropic (clave de API y OAuth hacia `api.anthropic.com`).

    | Comando | Se asigna a |
    |---------|-------------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - Solo se inyecta para solicitudes directas a `api.anthropic.com`. Las rutas de proxy dejan `service_tier` sin cambios.
    - Los parámetros explícitos `serviceTier` o `service_tier` anulan `/fast` cuando ambos están definidos.
    - En cuentas sin capacidad de Priority Tier, `service_tier: "auto"` puede resolverse a `standard`.

    </Note>

  </Accordion>

  <Accordion title="Media understanding (image and PDF)">
    El Plugin Anthropic incluido registra comprensión de imágenes y PDF. OpenClaw
    resuelve automáticamente las capacidades multimedia a partir de la autenticación Anthropic configurada; no se necesita
    configuración adicional.

    | Propiedad       | Valor                 |
    | --------------- | --------------------- |
    | Modelo predeterminado | `claude-opus-4-8`     |
    | Entrada admitida | Imágenes, documentos PDF |

    Cuando se adjunta una imagen o un PDF a una conversación, OpenClaw lo enruta automáticamente
    a través del proveedor de comprensión multimedia de Anthropic.

  </Accordion>

  <Accordion title="1M context window">
    La ventana de contexto de 1M de Anthropic está disponible en modelos Claude 4.x con capacidad GA,
    como Opus 4.8, Opus 4.7, Opus 4.6 y Sonnet 4.6. OpenClaw dimensiona esos modelos a
    1M automáticamente:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    Las configuraciones anteriores pueden conservar `params.context1m: true`, pero OpenClaw ya no envía
    el encabezado beta retirado `context-1m-2025-08-07`. Las entradas de configuración `anthropicBeta` anteriores
    con ese valor se ignoran durante la resolución de encabezados de solicitud, y
    los modelos Claude antiguos no compatibles permanecen en su ventana de contexto normal.

    `params.context1m: true` también se aplica al backend Claude CLI
    (`claude-cli/*`) para modelos Opus y Sonnet elegibles con capacidad GA, preservando
    la ventana de contexto de runtime de esas sesiones de CLI para que coincida con el comportamiento de
    API directa.

    <Warning>
    Requiere acceso de contexto largo en tu credencial de Anthropic. La autenticación con token OAuth/suscripción conserva sus encabezados beta de Anthropic requeridos, pero OpenClaw elimina el encabezado beta 1M retirado si permanece en una configuración anterior.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M context">
    `anthropic/claude-opus-4-8` y su variante `claude-cli` tienen una ventana de contexto
    de 1M de forma predeterminada; no se necesita `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Solución de problemas

<AccordionGroup>
  <Accordion title="401 errors / token suddenly invalid">
    La autenticación con token de Anthropic caduca y puede revocarse. Para configuraciones nuevas, usa una clave de API de Anthropic en su lugar.
  </Accordion>

  <Accordion title='No se encontró ninguna clave de API para el proveedor "anthropic"'>
    La autenticación de Anthropic es **por agente**: los agentes nuevos no heredan las claves del agente principal. Vuelve a ejecutar la incorporación para ese agente (o configura una clave de API en el host del Gateway) y luego verifica con `openclaw models status`.
  </Accordion>

  <Accordion title='No se encontraron credenciales para el perfil "anthropic:default"'>
    Ejecuta `openclaw models status` para ver qué perfil de autenticación está activo. Vuelve a ejecutar la incorporación o configura una clave de API para esa ruta de perfil.
  </Accordion>

  <Accordion title="No hay ningún perfil de autenticación disponible (todos en periodo de espera)">
    Revisa `openclaw models status --json` para ver `auth.unusableProfiles`. Los periodos de espera por límite de tasa de Anthropic pueden estar limitados al modelo, por lo que un modelo hermano de Anthropic aún podría ser utilizable. Añade otro perfil de Anthropic o espera a que termine el periodo de espera.
  </Accordion>
</AccordionGroup>

<Note>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [Preguntas frecuentes](/es/help/faq).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Backends de CLI" href="/es/gateway/cli-backends" icon="terminal">
    Configuración del backend de Claude CLI y detalles de ejecución.
  </Card>
  <Card title="Caché de prompts" href="/es/reference/prompt-caching" icon="database">
    Cómo funciona la caché de prompts entre proveedores.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
