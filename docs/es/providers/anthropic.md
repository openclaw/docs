---
read_when:
    - Quieres usar modelos de Anthropic en OpenClaw
summary: Usar Anthropic Claude mediante claves de API o Claude CLI en OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-07-05T11:34:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95930cec942ae6a57221cdca7db88a82a69e1670fd49e9726bba9850303aa9a6
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic crea la familia de modelos **Claude**. OpenClaw admite dos rutas de autenticación:

- **Clave de API** - acceso directo a la API de Anthropic con facturación basada en uso (modelos `anthropic/*`)
- **Claude CLI** - reutiliza un inicio de sesión existente de Claude Code en el mismo host

<Warning>
El backend de Claude CLI de OpenClaw ejecuta la CLI de Claude Code instalada en
modo de impresión no interactivo (`claude -p`). La documentación actual de Claude Code de Anthropic
describe ese modo como uso de Agent SDK/programático. La actualización de soporte de Anthropic del 15 de junio de 2026
pausó el cambio anunciado de facturación separada para Agent SDK: Claude
Agent SDK, `claude -p` y el uso de aplicaciones de terceros siguen consumiendo los límites de uso
de una suscripción con sesión iniciada, y el crédito mensual de Agent SDK anunciado anteriormente
no está disponible mientras Anthropic revisa ese plan.

Claude Code interactivo sigue consumiendo los límites del plan Claude con sesión iniciada.
La autenticación con clave de API es facturación directa de pago por uso y no depende de ese plan.
Para hosts de Gateway de larga duración, automatización compartida y gasto de producción predecible,
usa una clave de API de Anthropic.

Los artículos de soporte actuales de Anthropic pueden cambiar este comportamiento sin una
versión de OpenClaw:

- [Referencia de Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [Usar Claude Agent SDK con tu plan Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
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

  <Tab title="Claude CLI">
    **Ideal para:** reutilizar un inicio de sesión existente de Claude CLI sin una clave de API separada.

    <Steps>
      <Step title="Asegúrate de que Claude CLI esté instalado y con sesión iniciada">
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

        OpenClaw detecta y reutiliza las credenciales existentes de Claude CLI.
      </Step>
      <Step title="Verifica que el modelo esté disponible">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Los detalles de configuración y ejecución del backend de Claude CLI están en [Backends de CLI](/es/gateway/cli-backends).
    </Note>

    <Warning>
    La reutilización de Claude CLI espera que el proceso de OpenClaw se ejecute en el mismo host que el
    inicio de sesión de Claude CLI. Las instalaciones con Docker pueden persistir el home de un contenedor e iniciar sesión en
    Claude Code allí; consulta
    [Backend de Claude CLI en Docker](/es/install/docker#claude-cli-backend-in-docker).
    Otras instalaciones de contenedores como [Podman](/es/install/podman) no montan el
    `~/.claude` del host en la configuración ni en la ejecución; usa una clave de API de Anthropic allí, o elige
    un proveedor con OAuth gestionado por OpenClaw como
    [OpenAI Codex](/es/providers/openai).
    </Warning>

    ### Ejemplo de configuración

    Prefiere la referencia canónica del modelo de Anthropic más una sobrescritura de runtime de CLI:

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
    `anthropic/*` y colocar el backend de ejecución en la política de runtime de proveedor/modelo.

    ### Facturación y `claude -p`

    OpenClaw usa la ruta no interactiva `claude -p` de Claude Code para ejecuciones de Claude CLI.
    Anthropic actualmente trata esa ruta como uso de Agent SDK/programático:

    - La actualización de soporte de Anthropic del 15 de junio de 2026 pausó el plan de crédito
      separado de Agent SDK anunciado anteriormente.
    - Claude Agent SDK de plan de suscripción, `claude -p` y el uso de aplicaciones de terceros
      siguen consumiendo los límites de uso de la suscripción con sesión iniciada.
    - El crédito mensual de Agent SDK anunciado anteriormente no está disponible mientras
      Anthropic revisa ese plan.
    - Los inicios de sesión de Console/clave de API usan facturación de API de pago por uso y no reciben
      el crédito de Agent SDK de la suscripción.

    Consulta el [artículo del plan de Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    de Anthropic para el aviso de pausa, y los artículos del plan de Claude Code para el comportamiento de suscripción de
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    y
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    Anthropic puede cambiar la facturación y el comportamiento de límites de tasa de Claude Code sin una
    versión de OpenClaw. Comprueba `claude auth status`, `/status` y
    la documentación enlazada de Anthropic cuando importe la previsibilidad de la facturación.

    <Tip>
    Para automatización de producción compartida, usa una clave de API de Anthropic en lugar de
    Claude CLI. OpenClaw también admite opciones de estilo suscripción de
    [OpenAI Codex](/es/providers/openai), [Qwen Cloud](/es/providers/qwen),
    [MiniMax](/es/providers/minimax) y [Z.AI / GLM](/es/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Valores predeterminados de pensamiento (Claude Fable 5, 4.8 y 4.6)

`anthropic/claude-fable-5` siempre usa pensamiento adaptativo y el valor predeterminado es esfuerzo `high`.
Anthropic no permite desactivar el pensamiento para este modelo, por lo que
`/think off` y `/think minimal` se asignan a esfuerzo `low` en su lugar. OpenClaw también
omite valores de temperatura personalizados para solicitudes de Fable 5, ya que Anthropic rechaza
una sobrescritura de temperatura en cualquier solicitud con pensamiento habilitado.

Claude Opus 4.8 mantiene el pensamiento desactivado por defecto en OpenClaw. Cuando habilitas explícitamente
el pensamiento adaptativo con `/think high|xhigh|max`, OpenClaw envía
los valores de esfuerzo de Opus 4.8 de Anthropic; los modelos Claude 4.6 (Opus 4.6 y Sonnet 4.6)
usan `adaptive` por defecto.

Sobrescribe por mensaje con `/think:<level>` o en los parámetros del modelo:

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

## Fallback de rechazo de seguridad (Claude Fable 5)

<Warning>
Usar Claude Fable 5 también implica usar Claude Opus 4.8. Fable 5 se distribuye con
clasificadores de seguridad que pueden rechazar una solicitud, y la recuperación sancionada por Anthropic
es hacer que `claude-opus-4-8` sirva ese turno. OpenClaw opta por esto
automáticamente para solicitudes directas con clave de API, por lo que algunos turnos de Fable se responden
y facturan como Claude Opus 4.8. Si tu política o presupuesto no puede aceptar
turnos servidos por Opus, no selecciones `anthropic/claude-fable-5`.
</Warning>

### Por qué existe esto

Los clasificadores de Fable 5 devuelven `stop_reason: "refusal"` en solicitudes de dominios
restringidos, y también producen falsos positivos en trabajos adyacentes benignos (herramientas de seguridad,
ciencias de la vida, o incluso pedir al modelo que reproduzca su razonamiento sin procesar).
Sin un fallback, el turno muere con un error aunque
otro modelo Claude lo serviría sin problema: el propio mensaje de rechazo de Anthropic
indica a los integradores de API que configuren un modelo de fallback.

### Cómo funciona

1. Para cada solicitud directa con clave de API a `anthropic/claude-fable-5`, OpenClaw
   envía la suscripción al fallback del lado del servidor de Anthropic: el encabezado beta
   `server-side-fallback-2026-06-01` más
   `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8 es el único
   destino de fallback que Anthropic permite para Fable 5.
2. Solo una denegación del clasificador de seguridad activa el fallback. Los límites de tasa,
   las sobrecargas y los errores de servidor se comportan exactamente como antes y pasan por
   el [failover de modelo](/es/concepts/model-failover) normal de OpenClaw.
3. El rescate ocurre dentro de la misma llamada. Una denegación antes de cualquier salida es
   invisible salvo por la latencia; toda la respuesta proviene de Opus 4.8. En una
   denegación a mitad de stream, el texto parcial se conserva como prefijo desde el que continúa el modelo de fallback,
   mientras que el razonamiento y las llamadas de herramientas del modelo denegado
   se descartan según las reglas de reproducción de Anthropic (no deben repetirse ni
   ejecutarse).
4. Si Claude Opus 4.8 también rechaza, el turno muestra el rechazo como un
   error, exactamente igual que antes de esta función.

El fallback ocurre a nivel de la API de Anthropic, por lo que `claude-opus-4-8` no
necesita estar en tu lista de modelos configurados ni en la cadena de fallback: una clave de API
capaz de Fable siempre puede servir Opus.

### Observabilidad y facturación

- Un turno servido por fallback registra un diagnóstico `provider_fallback` en el
  mensaje del asistente que nombra `fromModel` y `toModel`, y el
  `responseModel` del mensaje informa `claude-opus-4-8`.
- Anthropic factura por intento: una denegación antes de la salida es gratis, y el rescate
  se factura a tarifas de Claude Opus 4.8 (actualmente la mitad de las tarifas de Fable 5). La
  estimación de costo por turno de OpenClaw valora los turnos servidos por fallback a tarifas de Opus para coincidir.
- Una denegación a mitad de stream además factura el parcial de Fable ya transmitido
  en el lado de Anthropic; esa porción se informa en el uso por intento de la API,
  pero no se incorpora a la estimación por turno de OpenClaw.

### Alcance

Se aplica a `anthropic/claude-fable-5` con autenticación de clave de API contra
`api.anthropic.com`. OAuth (reutilización de suscripción de Claude CLI), URLs base de proxy,
Bedrock, Vertex y solicitudes de Foundry no cambian y siguen mostrando
rechazos como errores allí.

Verificado en vivo: un prompt benigno que pide a Fable 5 reproducir su cadena de pensamiento
sin procesar se rechaza con `category: "reasoning_extraction"` cuando se envía sin
fallbacks, y el mismo prompt a través de OpenClaw devuelve una respuesta normal servida por Opus
con el diagnóstico `provider_fallback` adjunto.

Consulta la [guía de rechazos y fallback](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
de Anthropic para el comportamiento subyacente.

## Caché de prompts

OpenClaw admite la función de caché de prompts de Anthropic para autenticación con clave de API.

| Valor               | Duración de caché | Descripción                                      |
| ------------------- | ----------------- | ------------------------------------------------ |
| `"short"` (default) | 5 minutos         | Se aplica automáticamente para autenticación con clave de API |
| `"long"`            | 1 hora            | Caché extendida                                  |
| `"none"`            | Sin caché         | Desactiva la caché de prompts                    |

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
  <Accordion title="Sobrescrituras de caché por agente">
    Usa parámetros a nivel de modelo como base, luego sobrescribe agentes específicos mediante `agents.list[].params`:

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
    2. `agents.list[].params` (`id` coincidente, sobrescribe por clave)

    Esto permite que un agente conserve una caché de larga duración mientras otro agente en el mismo modelo deshabilita el almacenamiento en caché para tráfico en ráfagas o con poca reutilización.

  </Accordion>

  <Accordion title="Notas de Claude en Bedrock">
    - Los modelos Claude de Anthropic en Bedrock (`amazon-bedrock/*anthropic.claude*`) aceptan el paso directo de `cacheRetention` cuando está configurado.
    - Los modelos de Bedrock que no son de Anthropic se fuerzan a `cacheRetention: "none"` en tiempo de ejecución.
    - Los valores predeterminados inteligentes de clave de API también siembran `cacheRetention: "short"` para las referencias de Claude en Bedrock cuando no se establece ningún valor explícito.

  </Accordion>
</AccordionGroup>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Modo rápido">
    El interruptor compartido `/fast` de OpenClaw establece el campo `service_tier` de Anthropic para tráfico directo con clave de API hacia `api.anthropic.com`.

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
    - Solo se aplica a solicitudes directas a `api.anthropic.com` realizadas con una clave de API. Las solicitudes con OAuth/token de suscripción y las rutas proxy nunca reciben un campo `service_tier`.
    - Los parámetros explícitos `serviceTier` o `service_tier` sobrescriben `/fast` cuando ambos están definidos.
    - En cuentas sin capacidad de Priority Tier, `service_tier: "auto"` puede resolverse como `standard`.

    </Note>

  </Accordion>

  <Accordion title="Comprensión de medios (imagen y PDF)">
    El Plugin de Anthropic incluido registra la comprensión de imágenes y PDF. OpenClaw
    resuelve automáticamente las capacidades de medios a partir de la autenticación de Anthropic configurada; no
    se necesita configuración adicional.

    | Propiedad       | Valor                 |
    | --------------- | --------------------- |
    | Modelo predeterminado | `claude-opus-4-8`     |
    | Entrada compatible | Imágenes, documentos PDF |

    Cuando se adjunta una imagen o un PDF a una conversación, OpenClaw lo
    enruta automáticamente a través del proveedor de comprensión de medios de Anthropic.

  </Accordion>

  <Accordion title="Ventana de contexto de 1M">
    La ventana de contexto de 1M de Anthropic está GA en modelos Claude 4.x con pensamiento
    adaptativo: Opus 4.8, Opus 4.7, Opus 4.6 y Sonnet 4.6. OpenClaw dimensiona esos
    modelos en 1.048.576 tokens automáticamente, sin necesitar `params.context1m`:

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
    los modelos Claude antiguos no compatibles permanecen en su ventana de contexto normal.

    `params.context1m: true` se comporta de la misma manera para el backend de Claude CLI
    (`claude-cli/*`): los modelos Opus y Sonnet aptos con capacidad GA ya reciben la
    ventana de 1M automáticamente, por lo que el parámetro también es opcional allí.

    <Warning>
    Requiere acceso de contexto largo en tu credencial de Anthropic. La autenticación con OAuth/token de suscripción conserva sus encabezados beta requeridos de Anthropic, pero OpenClaw elimina el encabezado beta de 1M retirado si permanece en una configuración antigua.
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
    La autenticación con token de Anthropic expira y puede revocarse. Para nuevas configuraciones, usa una clave de API de Anthropic en su lugar.
  </Accordion>

  <Accordion title='No se encontró ninguna clave de API para el proveedor "anthropic"'>
    La autenticación de Anthropic es **por agente**; los agentes nuevos no heredan las claves del agente principal. Vuelve a ejecutar la incorporación para ese agente (o configura una clave de API en el host del gateway), luego verifica con `openclaw models status`.
  </Accordion>

  <Accordion title='No se encontraron credenciales para el perfil "anthropic:default"'>
    Ejecuta `openclaw models status` para ver qué perfil de autenticación está activo. Vuelve a ejecutar la incorporación o configura una clave de API para esa ruta de perfil.
  </Accordion>

  <Accordion title="No hay ningún perfil de autenticación disponible (todos en enfriamiento)">
    Revisa `openclaw models status --json` para `auth.unusableProfiles`. Los enfriamientos por límite de tasa de Anthropic pueden estar acotados por modelo, por lo que un modelo Anthropic hermano aún puede ser utilizable. Agrega otro perfil de Anthropic o espera a que termine el enfriamiento.
  </Accordion>
</AccordionGroup>

<Note>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [Preguntas frecuentes](/es/help/faq).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Backends de CLI" href="/es/gateway/cli-backends" icon="terminal">
    Configuración del backend de Claude CLI y detalles de tiempo de ejecución.
  </Card>
  <Card title="Almacenamiento en caché de prompts" href="/es/reference/prompt-caching" icon="database">
    Cómo funciona el almacenamiento en caché de prompts entre proveedores.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
