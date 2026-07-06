---
read_when:
    - Quieres usar modelos de Anthropic en OpenClaw
summary: Usa Anthropic Claude mediante claves de API o Claude CLI en OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-07-06T21:53:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c19e88b2461e5d98a02044867625a2d508821a4ab43aeb3e10a7a493efbcca22
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic crea la familia de modelos **Claude**. OpenClaw admite dos rutas de autenticación:

- **Clave de API**: acceso directo a la API de Anthropic con facturación basada en uso (modelos `anthropic/*`)
- **Claude CLI**: reutiliza un inicio de sesión existente de Claude Code en el mismo host

## Seguimiento de uso y costos

OpenClaw detecta la credencial de Anthropic disponible y selecciona la superficie de uso correspondiente:

- Las credenciales de suscripción/configuración de Claude muestran ventanas de cuota y un presupuesto opcional de uso adicional.
- `ANTHROPIC_ADMIN_KEY` o `ANTHROPIC_ADMIN_API_KEY` muestra 30 días de costos de organización informados por el proveedor y uso de la Messages API en **Uso** de Control UI, incluidos gasto diario, totales de tokens/caché, modelos principales y categorías de costo.
- Una credencial `sk-ant-admin...` almacenada en el perfil del proveedor Anthropic se detecta automáticamente como una clave de Admin API.

El historial de costos de Admin API proviene de la [API de uso y costos](https://platform.claude.com/docs/en/manage-claude/usage-cost-api) de Anthropic. Es la facturación real del proveedor, separada del costo estimado derivado de la sesión de OpenClaw.

<Warning>
El backend Claude CLI de OpenClaw ejecuta la CLI Claude Code instalada en
modo de impresión no interactivo (`claude -p`). La documentación actual de Claude Code de Anthropic
describe ese modo como uso del Agent SDK/programático. La actualización de soporte de Anthropic del 15 de junio de 2026
pausó el cambio anunciado de facturación separada del Agent SDK: Claude
Agent SDK, `claude -p` y el uso de aplicaciones de terceros siguen consumiendo los límites de uso de una
suscripción con sesión iniciada, y el crédito mensual del Agent SDK anunciado anteriormente
no está disponible mientras Anthropic revisa ese plan.

Claude Code interactivo sigue consumiendo los límites del plan Claude con sesión iniciada.
La autenticación con clave de API es facturación directa de pago por uso y no depende de ese plan.
Para hosts de Gateway de larga duración, automatización compartida y gasto de producción
predecible, usa una clave de API de Anthropic.

Los artículos de soporte actuales de Anthropic pueden cambiar este comportamiento sin una
versión nueva de OpenClaw:

- [Referencia de Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [Usar Claude Agent SDK con tu plan Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Usar Claude Code con tu plan Pro o Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Usar Claude Code con tu plan Team o Enterprise](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Administrar costos de Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## Primeros pasos

<Tabs>
  <Tab title="Clave de API">
    **Ideal para:** acceso estándar a la API y facturación basada en uso.

    <Steps>
      <Step title="Obtén tu clave de API">
        Crea una clave de API en la [Consola de Anthropic](https://console.anthropic.com/).
      </Step>
      <Step title="Ejecuta el onboarding">
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

  <Tab title="Claude CLI">
    **Ideal para:** reutilizar un inicio de sesión existente de Claude CLI sin una clave de API separada.

    <Steps>
      <Step title="Asegúrate de que Claude CLI esté instalado y con sesión iniciada">
        Verifica con:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Ejecuta el onboarding">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw detecta y reutiliza las credenciales existentes de Claude CLI.
      </Step>
      <Step title="Verifica que el modelo esté disponible">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Los detalles de configuración y runtime del backend Claude CLI están en [Backends de CLI](/es/gateway/cli-backends).
    </Note>

    <Warning>
    La reutilización de Claude CLI espera que el proceso de OpenClaw se ejecute en el mismo host que el
    inicio de sesión de Claude CLI. Las instalaciones con Docker pueden persistir un directorio de inicio del contenedor e iniciar sesión en
    Claude Code allí; consulta
    [backend Claude CLI en Docker](/es/install/docker#claude-cli-backend-in-docker).
    Otras instalaciones con contenedores, como [Podman](/es/install/podman), no montan el
    `~/.claude` del host en la configuración ni en runtime; usa allí una clave de API de Anthropic, o elige
    un proveedor con OAuth administrado por OpenClaw, como
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

    Las referencias de modelo heredadas `claude-cli/claude-opus-4-7` aún funcionan por
    compatibilidad, pero la configuración nueva debe mantener la selección de proveedor/modelo como
    `anthropic/*` y poner el backend de ejecución en la política de runtime de proveedor/modelo.

    ### Facturación y `claude -p`

    OpenClaw usa la ruta no interactiva `claude -p` de Claude Code para ejecuciones con Claude CLI.
    Anthropic trata actualmente esa ruta como uso del Agent SDK/programático:

    - La actualización de soporte de Anthropic del 15 de junio de 2026 pausó el plan de crédito
      separado del Agent SDK anunciado anteriormente.
    - Claude Agent SDK con plan de suscripción, `claude -p` y el uso de aplicaciones de terceros
      siguen consumiendo los límites de uso de la suscripción con sesión iniciada.
    - El crédito mensual del Agent SDK anunciado anteriormente no está disponible mientras
      Anthropic revisa ese plan.
    - Los inicios de sesión de consola/clave de API usan facturación de API de pago por uso y no reciben
      el crédito del Agent SDK de la suscripción.

    Consulta el [artículo del plan del Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    de Anthropic para ver el aviso de pausa, y los artículos del plan de Claude Code para el comportamiento de suscripción
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    y
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    Anthropic puede cambiar el comportamiento de facturación y límites de tasa de Claude Code sin una
    versión nueva de OpenClaw. Revisa `claude auth status`, `/status` y
    la documentación enlazada de Anthropic cuando importe la previsibilidad de la facturación.

    <Tip>
    Para automatización de producción compartida, usa una clave de API de Anthropic en lugar de
    Claude CLI. OpenClaw también admite opciones de estilo suscripción de
    [OpenAI Codex](/es/providers/openai), [Qwen Cloud](/es/providers/qwen),
    [MiniMax](/es/providers/minimax) y [Z.AI / GLM](/es/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Valores predeterminados de razonamiento (Claude Fable 5, 4.8 y 4.6)

`anthropic/claude-fable-5` siempre usa pensamiento adaptativo y tiene como valor predeterminado el esfuerzo `high`.
Anthropic no permite desactivar el pensamiento para este modelo, por lo que
`/think off` y `/think minimal` se asignan al esfuerzo `low` en su lugar. OpenClaw también
omite valores de temperatura personalizados en solicitudes a Fable 5, ya que Anthropic rechaza
una anulación de temperatura en cualquier solicitud con pensamiento habilitado.

Claude Opus 4.8 mantiene el pensamiento desactivado de forma predeterminada en OpenClaw. Cuando habilitas explícitamente
el pensamiento adaptativo con `/think high|xhigh|max`, OpenClaw envía
los valores de esfuerzo de Opus 4.8 de Anthropic; los modelos Claude 4.6 (Opus 4.6 y Sonnet 4.6)
tienen `adaptive` como valor predeterminado.

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

## Respaldo por rechazo de seguridad (Claude Fable 5)

<Warning>
Usar Claude Fable 5 implica usar también Claude Opus 4.8. Fable 5 se distribuye con
clasificadores de seguridad que pueden rechazar una solicitud, y la recuperación autorizada por Anthropic
es hacer que `claude-opus-4-8` atienda ese turno. OpenClaw opta por esto
automáticamente para solicitudes directas con clave de API, por lo que algunos turnos de Fable se responden
y facturan como Claude Opus 4.8. Si tu política o presupuesto no puede aceptar
turnos atendidos por Opus, no selecciones `anthropic/claude-fable-5`.
</Warning>

### Por qué existe esto

Los clasificadores de Fable 5 devuelven `stop_reason: "refusal"` en solicitudes en dominios
restringidos, y también generan falsos positivos en trabajo benigno adyacente (herramientas de
seguridad, ciencias de la vida o incluso pedir al modelo que reproduzca su razonamiento
sin procesar). Sin un respaldo, el turno termina con un error aunque
otro modelo Claude lo atendería sin problemas: el propio mensaje de rechazo de Anthropic
indica a los integradores de API que configuren un modelo de respaldo.

### Cómo funciona

1. Para cada solicitud directa con clave de API a `anthropic/claude-fable-5`, OpenClaw
   envía la activación de respaldo del lado del servidor de Anthropic: el encabezado beta
   `server-side-fallback-2026-06-01` más
   `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8 es el único
   destino de respaldo que Anthropic permite para Fable 5.
2. Solo un rechazo del clasificador de seguridad activa el respaldo. Los límites de tasa,
   las sobrecargas y los errores del servidor se comportan exactamente como antes y pasan por
   la [conmutación por error de modelo](/es/concepts/model-failover) normal de OpenClaw.
3. El rescate ocurre dentro de la misma llamada. Un rechazo antes de cualquier salida es
   invisible salvo por la latencia; toda la respuesta proviene de Opus 4.8. En un
   rechazo a mitad de stream, el texto parcial se conserva como prefijo desde el cual continúa
   el modelo de respaldo, mientras que el razonamiento y las llamadas a herramientas del modelo rechazado
   se descartan según las reglas de reproducción de Anthropic (no deben devolverse ni
   ejecutarse).
4. Si Claude Opus 4.8 también rechaza la solicitud, el turno expone el rechazo como un
   error, exactamente igual que antes de esta función.

El respaldo ocurre a nivel de la API de Anthropic, por lo que `claude-opus-4-8` no
necesita estar en tu lista de modelos configurados ni en tu cadena de respaldo: una clave de API
compatible con Fable siempre puede atender Opus.

### Observabilidad y facturación

- Un turno atendido por respaldo registra un diagnóstico `provider_fallback` en el
  mensaje del asistente que nombra `fromModel` y `toModel`, y el
  `responseModel` del mensaje informa `claude-opus-4-8`.
- Anthropic factura por intento: un rechazo antes de la salida es gratuito, y el rescate
  se factura a tarifas de Claude Opus 4.8 (actualmente la mitad de las tarifas de Fable 5). La
  estimación de costo por turno de OpenClaw valora los turnos atendidos por respaldo a tarifas de Opus para coincidir.
- Un rechazo a mitad de stream factura además el parcial de Fable ya emitido
  en el lado de Anthropic; esa porción se informa en el uso por intento de la API,
  pero no se incorpora a la estimación por turno de OpenClaw.

### Alcance

Se aplica a `anthropic/claude-fable-5` con autenticación por clave de API contra
`api.anthropic.com`. OAuth (reutilización de suscripción de Claude CLI), URL base de proxy,
Bedrock, Vertex y solicitudes de Foundry no cambian y allí siguen exponiendo
los rechazos como errores.

Verificado en vivo: un prompt benigno que pide a Fable 5 reproducir su cadena de
pensamiento sin procesar se rechaza con `category: "reasoning_extraction"` cuando se envía sin
respaldos, y el mismo prompt a través de OpenClaw devuelve una respuesta normal atendida por Opus
con el diagnóstico `provider_fallback` adjunto.

Consulta la [guía de rechazos y respaldo](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
de Anthropic para el comportamiento subyacente.

## Caché de prompts

OpenClaw admite la función de caché de prompts de Anthropic para autenticación con clave de API.

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

    Orden de fusión de configuración:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (coincide con `id`, anula por clave)

    Esto permite que un agente mantenga una caché de larga duración mientras otro agente en el mismo modelo desactiva la caché para tráfico en ráfagas o de baja reutilización.

  </Accordion>

  <Accordion title="Notas de Claude en Bedrock">
    - Los modelos Anthropic Claude en Bedrock (`amazon-bedrock/*anthropic.claude*`) aceptan el paso directo de `cacheRetention` cuando está configurado.
    - Los modelos Bedrock que no son de Anthropic se fuerzan a `cacheRetention: "none"` en tiempo de ejecución.
    - Los valores predeterminados inteligentes con clave de API también inicializan `cacheRetention: "short"` para referencias de Claude en Bedrock cuando no se define ningún valor explícito.

  </Accordion>
</AccordionGroup>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Modo rápido">
    El interruptor compartido `/fast` de OpenClaw define el campo `service_tier` de Anthropic para tráfico directo con clave de API hacia `api.anthropic.com`.

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
    - Solo se aplica a solicitudes directas a `api.anthropic.com` realizadas con una clave de API. Las solicitudes con OAuth/token de suscripción y las rutas de proxy nunca reciben un campo `service_tier`.
    - Los parámetros explícitos `serviceTier` o `service_tier` anulan `/fast` cuando ambos están definidos.
    - En cuentas sin capacidad de Priority Tier, `service_tier: "auto"` puede resolverse como `standard`.

    </Note>

  </Accordion>

  <Accordion title="Comprensión de medios (imagen y PDF)">
    El plugin Anthropic incluido registra la comprensión de imágenes y PDF. OpenClaw
    resuelve automáticamente las capacidades de medios desde la autenticación Anthropic configurada; no
    se necesita configuración adicional.

    | Propiedad        | Valor                 |
    | --------------- | --------------------- |
    | Modelo predeterminado   | `claude-opus-4-8`     |
    | Entrada admitida | Imágenes, documentos PDF |

    Cuando se adjunta una imagen o PDF a una conversación, OpenClaw automáticamente
    lo enruta a través del proveedor de comprensión de medios de Anthropic.

  </Accordion>

  <Accordion title="Ventana de contexto de 1M">
    La ventana de contexto de 1M de Anthropic está disponible de forma general en modelos Claude 4.x con pensamiento
    adaptativo: Opus 4.8, Opus 4.7, Opus 4.6 y Sonnet 4.6. OpenClaw dimensiona esos
    modelos en 1,048,576 tokens automáticamente, sin necesidad de `params.context1m`:

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

    Las configuraciones antiguas pueden conservar `params.context1m: true`; es un no-op inocuo para
    estos modelos y OpenClaw ya no envía el encabezado beta retirado
    `context-1m-2025-08-07` en ningún caso. Las entradas antiguas de configuración `anthropicBeta`
    con ese valor se descartan durante la resolución de encabezados de solicitud, y
    los modelos Claude antiguos no admitidos permanecen en su ventana de contexto normal.

    `params.context1m: true` se comporta igual para el backend Claude CLI
    (`claude-cli/*`): los modelos Opus y Sonnet elegibles con capacidad GA ya obtienen la
    ventana de 1M automáticamente, por lo que el parámetro también es opcional allí.

    <Warning>
    Requiere acceso de contexto largo en tu credencial Anthropic. La autenticación con OAuth/token de suscripción conserva sus encabezados beta de Anthropic requeridos, pero OpenClaw elimina el encabezado beta de 1M retirado si permanece en una configuración antigua.
    </Warning>

  </Accordion>

  <Accordion title="Contexto de 1M de Claude Opus 4.8">
    `anthropic/claude-opus-4-8` y su variante `claude-cli` tienen una ventana de contexto
    de 1M de forma predeterminada; no se necesita `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Solución de problemas

<AccordionGroup>
  <Accordion title="Errores 401 / token repentinamente inválido">
    La autenticación con token de Anthropic caduca y se puede revocar. Para configuraciones nuevas, usa una clave de API de Anthropic en su lugar.
  </Accordion>

  <Accordion title='No se encontró ninguna clave de API para el proveedor "anthropic"'>
    La autenticación Anthropic es **por agente**; los agentes nuevos no heredan las claves del agente principal. Vuelve a ejecutar la incorporación para ese agente (o configura una clave de API en el host del gateway), luego verifica con `openclaw models status`.
  </Accordion>

  <Accordion title='No se encontraron credenciales para el perfil "anthropic:default"'>
    Ejecuta `openclaw models status` para ver qué perfil de autenticación está activo. Vuelve a ejecutar la incorporación, o configura una clave de API para esa ruta de perfil.
  </Accordion>

  <Accordion title="No hay ningún perfil de autenticación disponible (todos en enfriamiento)">
    Revisa `openclaw models status --json` para `auth.unusableProfiles`. Los enfriamientos por límite de tasa de Anthropic pueden estar acotados al modelo, por lo que un modelo Anthropic hermano aún podría ser utilizable. Agrega otro perfil Anthropic o espera a que termine el enfriamiento.
  </Accordion>
</AccordionGroup>

<Note>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [FAQ](/es/help/faq).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Backends de CLI" href="/es/gateway/cli-backends" icon="terminal">
    Configuración del backend Claude CLI y detalles de tiempo de ejecución.
  </Card>
  <Card title="Caché de prompts" href="/es/reference/prompt-caching" icon="database">
    Cómo funciona la caché de prompts entre proveedores.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
