---
read_when:
    - Quieres usar los modelos de Anthropic en OpenClaw
summary: Usa Anthropic Claude mediante claves de API o Claude CLI en OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-06-28T20:44:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48a2792e464175b3ebe6acd92606c20231fd31940f56e2432bb45657eb0a68d7
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic crea la familia de modelos **Claude**. OpenClaw admite dos rutas de autenticación:

- **Clave de API** — acceso directo a la API de Anthropic con facturación basada en uso (modelos `anthropic/*`)
- **CLI de Claude** — reutiliza una sesión existente de Claude Code en el mismo host

<Warning>
El backend de CLI de Claude de OpenClaw ejecuta la CLI instalada de Claude Code en
modo de impresión no interactivo. La documentación actual de Claude Code de Anthropic describe
`claude -p` como uso de Agent SDK/programático. La actualización de soporte de Anthropic del 15 de junio de 2026
pausó el cambio anunciado en la facturación de Agent SDK. Por ahora, Anthropic dice que
el uso de Claude Agent SDK, `claude -p` y aplicaciones de terceros todavía consume los
límites de uso de una suscripción. El crédito mensual de Agent SDK anunciado anteriormente
no está disponible mientras Anthropic revisa ese plan.

Claude Code interactivo todavía consume los límites del plan de Claude con sesión iniciada. La autenticación con
clave de API sigue siendo facturación directa de API de pago por uso. Para hosts de Gateway de larga duración,
automatización compartida y gasto de producción predecible, usa una clave de API de Anthropic.

Consulta los artículos de soporte actuales de Anthropic antes de depender del comportamiento de
facturación de suscripción:

- [Referencia de la CLI de Claude Code](https://code.claude.com/docs/en/cli-usage)
- [Usar Claude Agent SDK con tu plan de Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Usar Claude Code con tu plan Pro o Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Usar Claude Code con tu plan Team o Enterprise](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Gestionar los costos de Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## Primeros pasos

<Tabs>
  <Tab title="Clave de API">
    **Ideal para:** acceso estándar a la API y facturación basada en uso.

    <Steps>
      <Step title="Obtén tu clave de API">
        Crea una clave de API en la [Consola de Anthropic](https://console.anthropic.com/).
      </Step>
      <Step title="Ejecuta la incorporación">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        O pasa la clave directamente:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Verifica que el modelo esté disponible">
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

  <Tab title="CLI de Claude">
    **Ideal para:** reutilizar una sesión existente de la CLI de Claude sin una clave de API separada.

    <Steps>
      <Step title="Asegúrate de que la CLI de Claude esté instalada y con sesión iniciada">
        Verifica con:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Ejecuta la incorporación">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw detecta y reutiliza las credenciales existentes de la CLI de Claude.
      </Step>
      <Step title="Verifica que el modelo esté disponible">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Los detalles de configuración y ejecución del backend de CLI de Claude están en [Backends de CLI](/es/gateway/cli-backends).
    </Note>

    <Warning>
    La reutilización de la CLI de Claude espera que el proceso de OpenClaw se ejecute en el mismo host que la
    sesión de la CLI de Claude. Las instalaciones con Docker pueden persistir un home de contenedor e iniciar sesión en
    Claude Code allí; consulta
    [backend de CLI de Claude en Docker](/es/install/docker#claude-cli-backend-in-docker).
    Otras instalaciones en contenedores como [Podman](/es/install/podman) no montan el
    `~/.claude` del host durante la configuración ni en tiempo de ejecución; usa allí una clave de API de Anthropic o elige
    un proveedor con OAuth gestionado por OpenClaw, como
    [OpenAI Codex](/es/providers/openai).
    </Warning>

    ### Ejemplo de configuración

    Prefiere la referencia de modelo canónica de Anthropic más una anulación de runtime de CLI:

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

    Las referencias de modelo heredadas `claude-cli/claude-opus-4-7` todavía funcionan por
    compatibilidad, pero la configuración nueva debe mantener la selección de proveedor/modelo como
    `anthropic/*` y colocar el backend de ejecución en la política de runtime de proveedor/modelo.

    ### Facturación y `claude -p`

    OpenClaw usa la ruta no interactiva `claude -p` de Claude Code para las ejecuciones de la CLI de Claude.
    Anthropic actualmente trata esa ruta como uso de Agent SDK/programático:

    - La actualización de soporte de Anthropic del 15 de junio de 2026 pausó el plan de crédito separado de Agent SDK anunciado anteriormente.
    - Por ahora, el uso de Claude Agent SDK con plan de suscripción, `claude -p` y aplicaciones de terceros
      todavía consume los límites de uso de la suscripción con sesión iniciada.
    - El crédito mensual de Agent SDK anunciado anteriormente no está disponible mientras
      Anthropic revisa ese plan.
    - Los inicios de sesión de Consola/clave de API usan facturación de API de pago por uso y no reciben
      el crédito de Agent SDK de la suscripción.

    Consulta el [artículo del plan de Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    de Anthropic para ver el aviso de pausa, y los artículos del plan de Claude Code para el comportamiento de suscripción de
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    y
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    Anthropic puede cambiar el comportamiento de facturación y límites de tasa de Claude Code sin una
    versión de OpenClaw. Consulta `claude auth status`, `/status` y
    la documentación enlazada de Anthropic cuando la previsibilidad de facturación sea importante.

    <Tip>
    Para automatización de producción compartida, usa una clave de API de Anthropic en lugar de
    la CLI de Claude. OpenClaw también admite opciones de estilo suscripción de
    [OpenAI Codex](/es/providers/openai), [Qwen Cloud](/es/providers/qwen),
    [MiniMax](/es/providers/minimax) y [Z.AI / GLM](/es/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Valores predeterminados de razonamiento (Claude Fable 5, 4.8 y 4.6)

`anthropic/claude-fable-5` siempre usa razonamiento adaptativo y tiene como valor predeterminado el esfuerzo `high`.
Como Anthropic no permite desactivar el razonamiento para este modelo,
`/think off` y `/think minimal` usan esfuerzo `low`. OpenClaw también omite valores personalizados de
temperatura para solicitudes de Fable 5.

Claude Opus 4.8 mantiene el razonamiento desactivado de forma predeterminada en OpenClaw. Cuando habilitas explícitamente el razonamiento adaptativo con `/think high|xhigh|max`, OpenClaw envía los valores de esfuerzo de Opus 4.8 de Anthropic; los modelos Claude 4.6 usan `adaptive` de forma predeterminada.

Anula por mensaje con `/think:<level>` o en parámetros del modelo:

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
- [Razonamiento adaptativo](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Razonamiento extendido](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Caché de prompts

OpenClaw admite la función de caché de prompts de Anthropic para la autenticación con clave de API.

| Valor               | Duración de caché | Descripción                            |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (predeterminado) | 5 minutos      | Se aplica automáticamente para autenticación con clave de API |
| `"long"`            | 1 hora         | Caché extendida                         |
| `"none"`            | Sin caché     | Desactiva la caché de prompts                 |

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
  <Accordion title="Anulaciones de caché por agente">
    Usa parámetros de nivel de modelo como base y luego anula agentes específicos mediante `agents.list[].params`:

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
    2. `agents.list[].params` (coincide con `id`, anula por clave)

    Esto permite que un agente mantenga una caché de larga duración mientras otro agente en el mismo modelo desactiva la caché para tráfico irregular o de baja reutilización.

  </Accordion>

  <Accordion title="Notas de Claude en Bedrock">
    - Los modelos Anthropic Claude en Bedrock (`amazon-bedrock/*anthropic.claude*`) aceptan el paso directo de `cacheRetention` cuando se configura.
    - Los modelos de Bedrock que no son de Anthropic se fuerzan a `cacheRetention: "none"` en tiempo de ejecución.
    - Los valores predeterminados inteligentes de clave de API también inicializan `cacheRetention: "short"` para referencias de Claude en Bedrock cuando no se establece un valor explícito.

  </Accordion>
</AccordionGroup>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Modo rápido">
    El conmutador compartido `/fast` de OpenClaw admite tráfico directo de Anthropic (clave de API y OAuth hacia `api.anthropic.com`).

    | Comando | Se asigna a |
    |---------|---------|
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
    - Solo se inyecta para solicitudes directas a `api.anthropic.com`. Las rutas proxy dejan `service_tier` sin cambios.
    - Los parámetros explícitos `serviceTier` o `service_tier` anulan `/fast` cuando ambos están establecidos.
    - En cuentas sin capacidad de Priority Tier, `service_tier: "auto"` puede resolverse como `standard`.

    </Note>

  </Accordion>

  <Accordion title="Comprensión multimedia (imagen y PDF)">
    El Plugin de Anthropic incluido registra comprensión de imágenes y PDF. OpenClaw
    resuelve automáticamente las capacidades multimedia desde la autenticación de Anthropic configurada; no se necesita
    configuración adicional.

    | Propiedad        | Valor                 |
    | --------------- | --------------------- |
    | Modelo predeterminado   | `claude-opus-4-8`     |
    | Entrada admitida | Imágenes, documentos PDF |

    Cuando se adjunta una imagen o un PDF a una conversación, OpenClaw lo enruta automáticamente
    mediante el proveedor de comprensión multimedia de Anthropic.

  </Accordion>

  <Accordion title="Ventana de contexto de 1M">
    La ventana de contexto de 1M de Anthropic está disponible en modelos Claude 4.x aptos para GA,
    como Opus 4.8, Opus 4.7, Opus 4.6 y Sonnet 4.6. OpenClaw dimensiona esos modelos en
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

    Las configuraciones anteriores pueden mantener `params.context1m: true`, pero OpenClaw ya no envía
    el encabezado beta retirado `context-1m-2025-08-07`. Las entradas antiguas de configuración `anthropicBeta`
    con ese valor se ignoran durante la resolución de encabezados de solicitud y
    los modelos Claude más antiguos no admitidos permanecen en su ventana de contexto normal.

    `params.context1m: true` también se aplica al backend de CLI de Claude
    (`claude-cli/*`) para modelos Opus y Sonnet aptos para GA, preservando
    la ventana de contexto en runtime para esas sesiones de CLI para que coincida con el comportamiento de API directa.

    <Warning>
    Requiere acceso de contexto largo en tu credencial de Anthropic. La autenticación con token OAuth/suscripción mantiene sus encabezados beta requeridos de Anthropic, pero OpenClaw elimina el encabezado beta retirado de 1M si permanece en una configuración anterior.
    </Warning>

  </Accordion>

  <Accordion title="contexto de 1M de Claude Opus 4.8">
    `anthropic/claude-opus-4-8` y su variante `claude-cli` tienen una ventana de
    contexto de 1M de forma predeterminada; no se necesita `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Solución de problemas

<AccordionGroup>
  <Accordion title="Errores 401 / token repentinamente no válido">
    La autenticación con token de Anthropic caduca y puede revocarse. Para nuevas configuraciones, usa una clave de API de Anthropic en su lugar.
  </Accordion>

  <Accordion title='No se encontró ninguna clave de API para el proveedor "anthropic"'>
    La autenticación de Anthropic es **por agente**: los agentes nuevos no heredan las claves del agente principal. Vuelve a ejecutar la incorporación para ese agente (o configura una clave de API en el host de Gateway) y luego verifica con `openclaw models status`.
  </Accordion>

  <Accordion title='No se encontraron credenciales para el perfil "anthropic:default"'>
    Ejecuta `openclaw models status` para ver qué perfil de autenticación está activo. Vuelve a ejecutar la incorporación o configura una clave de API para esa ruta de perfil.
  </Accordion>

  <Accordion title="No hay perfil de autenticación disponible (todos en enfriamiento)">
    Revisa `openclaw models status --json` para ver `auth.unusableProfiles`. Los enfriamientos por límite de tasa de Anthropic pueden estar acotados al modelo, por lo que un modelo Anthropic relacionado aún podría ser utilizable. Agrega otro perfil de Anthropic o espera a que termine el enfriamiento.
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
    Configuración del backend de Claude CLI y detalles de tiempo de ejecución.
  </Card>
  <Card title="Caché de prompts" href="/es/reference/prompt-caching" icon="database">
    Cómo funciona la caché de prompts entre proveedores.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
