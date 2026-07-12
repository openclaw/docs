---
read_when:
    - Quieres usar modelos de Anthropic en OpenClaw
    - Quieres explorar sesiones de Claude CLI o Claude Desktop en computadoras emparejadas
summary: Usa Anthropic Claude mediante claves de API o la CLI de Claude en OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-07-12T14:47:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f15c88c33120f64d0c1c64b291380f4b8824c13262ba0b2a57662003cfb26adc
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic desarrolla la familia de modelos **Claude**. OpenClaw admite dos métodos de autenticación:

- **Clave de API**: acceso directo a la API de Anthropic con facturación basada en el uso (modelos `anthropic/*`)
- **Claude CLI**: reutiliza un inicio de sesión existente de Claude Code en el mismo host

## Seguimiento del uso y los costes

OpenClaw detecta la credencial de Anthropic disponible y selecciona la interfaz de uso correspondiente:

- Las credenciales de suscripción/configuración de Claude muestran los períodos de cuota y el presupuesto opcional para uso adicional.
- `ANTHROPIC_ADMIN_KEY` o `ANTHROPIC_ADMIN_API_KEY` muestra 30 días de costes de la organización declarados por el proveedor y del uso de la API Messages en **Uso** de la interfaz de control, incluidos el gasto diario, los totales de tokens/caché, los modelos principales y las categorías de costes.
- Una credencial `sk-ant-admin...` almacenada en el perfil del proveedor Anthropic se detecta automáticamente como una clave de la API Admin.

El historial de costes de la API Admin procede de la [API de uso y costes](https://platform.claude.com/docs/en/manage-claude/usage-cost-api) de Anthropic. Representa la facturación real del proveedor, independiente del coste estimado por OpenClaw a partir de las sesiones.

<Warning>
El backend de Claude CLI de OpenClaw ejecuta la CLI de Claude Code instalada en
modo de impresión no interactivo (`claude -p`). La documentación actual de Claude Code
de Anthropic describe ese modo como uso programático/del SDK de agentes. La
actualización de soporte de Anthropic del 15 de junio de 2026 pausó el cambio de
facturación independiente anunciado para el SDK de agentes: el SDK de agentes de
Claude, `claude -p` y el uso de aplicaciones de terceros siguen consumiendo los
límites de uso de la suscripción con la sesión iniciada, y el crédito mensual del
SDK de agentes anunciado anteriormente no está disponible mientras Anthropic
revisa ese plan.

Claude Code interactivo sigue consumiendo los límites del plan de Claude con la
sesión iniciada. La autenticación mediante clave de API se factura directamente
según el uso y no depende de ese plan. Para hosts del Gateway de larga duración,
automatización compartida y gastos de producción previsibles, use una clave de
API de Anthropic.

Los artículos de soporte actuales de Anthropic pueden cambiar este comportamiento
sin una versión nueva de OpenClaw:

- [Referencia de Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [Usar el SDK de agentes de Claude con su plan de Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Usar Claude Code con su plan Pro o Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Usar Claude Code con su plan Team o Enterprise](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Gestionar los costes de Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## Primeros pasos

<Tabs>
  <Tab title="Clave de API">
    **Opción idónea para:** acceso estándar a la API y facturación basada en el uso.

    <Steps>
      <Step title="Obtenga su clave de API">
        Cree una clave de API en la [consola de Anthropic](https://console.anthropic.com/).
      </Step>
      <Step title="Ejecute la incorporación">
        ```bash
        openclaw onboard
        # elija: clave de API de Anthropic
        ```

        O proporcione la clave directamente:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Compruebe que el modelo esté disponible">
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
    **Opción idónea para:** reutilizar un inicio de sesión existente de Claude CLI sin una clave de API independiente.

    <Steps>
      <Step title="Asegúrese de que Claude CLI esté instalada y tenga una sesión iniciada">
        Compruébelo con:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Ejecute la incorporación">
        ```bash
        openclaw onboard
        # elija: Claude CLI
        ```

        OpenClaw detecta y reutiliza las credenciales existentes de Claude CLI.
      </Step>
      <Step title="Compruebe que el modelo esté disponible">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Los detalles de configuración y ejecución del backend de Claude CLI se encuentran en [Backends de CLI](/es/gateway/cli-backends).
    </Note>

    <Warning>
    La reutilización de Claude CLI requiere que el proceso de OpenClaw se ejecute
    en el mismo host que el inicio de sesión de Claude CLI. Las instalaciones con
    Docker pueden conservar el directorio personal de un contenedor e iniciar allí
    una sesión en Claude Code; consulte
    [Backend de Claude CLI en Docker](/es/install/docker#claude-cli-backend-in-docker).
    Otras instalaciones en contenedores, como [Podman](/es/install/podman), no montan
    `~/.claude` del host durante la configuración ni la ejecución; use allí una
    clave de API de Anthropic o elija un proveedor con OAuth gestionado por
    OpenClaw, como [OpenAI Codex](/es/providers/openai).
    </Warning>

    ### Ejemplo de configuración

    Es preferible usar la referencia de modelo canónica de Anthropic junto con una sustitución de ejecución de CLI:

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

    Las referencias de modelo antiguas `claude-cli/claude-opus-4-7` siguen
    funcionando por compatibilidad, pero las configuraciones nuevas deben mantener
    la selección del proveedor/modelo como `anthropic/*` y especificar el backend
    de ejecución en la política de ejecución del proveedor/modelo.

    ### Facturación y `claude -p`

    OpenClaw usa la ruta no interactiva `claude -p` de Claude Code para las
    ejecuciones de Claude CLI. Anthropic trata actualmente esa ruta como uso
    programático/del SDK de agentes:

    - La actualización de soporte de Anthropic del 15 de junio de 2026 pausó el
      plan de créditos independientes del SDK de agentes anunciado anteriormente.
    - El uso del SDK de agentes de Claude incluido en el plan de suscripción, de
      `claude -p` y de aplicaciones de terceros sigue consumiendo los límites de
      uso de la suscripción con la sesión iniciada.
    - El crédito mensual del SDK de agentes anunciado anteriormente no está
      disponible mientras Anthropic revisa ese plan.
    - Los inicios de sesión mediante la consola/clave de API usan facturación de
      API según el uso y no reciben el crédito del SDK de agentes de la suscripción.

    Consulte el [artículo sobre el plan del SDK de
    agentes](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    de Anthropic para ver el aviso de pausa, así como los artículos sobre los planes
    de Claude Code para conocer el comportamiento de las suscripciones
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    y
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    Anthropic puede cambiar la facturación y el comportamiento de los límites de
    velocidad de Claude Code sin una versión nueva de OpenClaw. Compruebe
    `claude auth status`, `/status` y la documentación enlazada de Anthropic cuando
    sea importante que la facturación sea previsible.

    <Tip>
    Para la automatización compartida en producción, use una clave de API de
    Anthropic en lugar de Claude CLI. OpenClaw también admite opciones de tipo
    suscripción de [OpenAI Codex](/es/providers/openai), [Qwen Cloud](/es/providers/qwen),
    [MiniMax](/es/providers/minimax) y [Z.AI / GLM](/es/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Sesiones de Claude entre distintos equipos

El plugin de Anthropic incluido añade un grupo **Claude Code** a la barra lateral
normal de sesiones. Las filas se abren en el panel normal de chat. Detecta las
sesiones no archivadas de Claude Code en el Gateway y en los hosts Node conectados:

- Las sesiones de Claude CLI proceden de registros válidos del índice de proyectos
  y de archivos JSONL actuales cuyo prefijo limitado de metadatos identifica una
  sesión `sdk-cli` que no es una cadena secundaria en `~/.claude/projects/`.
- Las sesiones de Claude Desktop usan el título de Desktop, la hora de actividad y
  el estado de archivo cuando sus metadatos apuntan al mismo ID de sesión de
  Claude Code.
- Una sesión que solo pertenece a la CLI no tiene indicador de archivo, por lo que
  permanece visible mientras esté presente su transcripción.

No se requiere ninguna configuración adicional de OpenClaw. El plugin de Anthropic
está incluido y habilitado de forma predeterminada; un Node nativo de macOS anuncia
los comandos de sesión de Claude de solo lectura cuando existe el directorio local
`~/.claude/projects/`. Apruebe la actualización de emparejamiento del Node cuando
esos comandos aparezcan por primera vez.

La barra lateral comienza con la página limitada más reciente de cada host y se
actualiza con la cadencia normal de 30 segundos. Use **Cargar más sesiones** bajo
un grupo del catálogo para añadir la página siguiente de cada host que tenga más
historial; las filas añadidas permanecen visibles y se vuelven a obtener hasta la
misma profundidad en cada actualización. Los clientes del catálogo usan
`sessions.catalog.list`; al abrir una fila se usa `sessions.catalog.read`.

Al seleccionar una fila, se lee primero la página más reciente de la transcripción.
**Cargar elementos anteriores de la transcripción** sigue un cursor de bytes opaco
y lee otra sección limitada del archivo JSONL en lugar de cargar todo el historial.
Se conserva el contenido normal del usuario, del asistente, del razonamiento, de
las llamadas a herramientas y de los resultados de herramientas. Los elementos
individuales que superan el límite de seguridad del Node/Gateway se marcan
claramente como truncados.

Para una fila `claude-cli` local al Gateway, escribir en el editor normal llama a
`sessions.catalog.continue`. OpenClaw vuelve a resolver el registro local del
catálogo, crea o reutiliza una sesión nativa vinculada al modelo, importa como
máximo 200 elementos visibles o 512 KiB e inicializa la vinculación de Claude CLI.
El primer turno se reanuda con `--fork-session`; Claude asigna a la bifurcación un
nuevo ID de sesión, por lo que los turnos posteriores usan la bifurcación y la
sesión de origen permanece intacta. Las filas de Claude Desktop y de los Node
emparejados son de solo lectura.

<Note>
Las sesiones de Claude en Node emparejados son de solo lectura. OpenClaw no
modifica los metadatos de Claude Desktop, no archiva sesiones de Claude ni inicia
un segundo ejecutor en el equipo propietario. La página requiere una conexión de
operador con ámbito de escritura porque usa el transporte autenticado
`node.invoke`, aunque ambos comandos de Claude para Node son de solo lectura.
</Note>

Consulte [Node: sesiones y transcripciones de Claude](/es/nodes#claude-sessions-and-transcripts)
para conocer el comando de Node y el límite de seguridad.

## Valores predeterminados de razonamiento (Claude Sonnet 5, Mythos 5, Fable 5, 4.8 y 4.6)

`anthropic/claude-sonnet-5` usa razonamiento adaptativo con un esfuerzo `high` de
forma predeterminada. Use `/think off` para desactivar el razonamiento o
`/think xhigh|max` para usar los niveles de esfuerzo nativos superiores del
modelo. OpenClaw omite los presupuestos manuales de razonamiento, los parámetros
de muestreo personalizados, los prefijos del asistente y Priority Tier para
Sonnet 5 porque Anthropic no admite esas características de solicitud en este
modelo. El catálogo usa los precios introductorios de entrada/salida de `$2/$10`
de Anthropic hasta el 31 de agosto de 2026; los precios estándar de `$3/$15`
comienzan el 1 de septiembre de 2026.

`anthropic/claude-fable-5` usa siempre razonamiento adaptativo y establece de forma
predeterminada el esfuerzo `high`. Anthropic no permite desactivar el razonamiento
en este modelo, por lo que `/think off` y `/think minimal` se asignan en su lugar
al esfuerzo `low`. OpenClaw también omite los valores de temperatura personalizados
en las solicitudes de Fable 5, ya que Anthropic rechaza una sustitución de la
temperatura en cualquier solicitud que tenga activado el razonamiento.

`anthropic/claude-mythos-5` es un modelo de acceso limitado con el mismo contrato
de razonamiento adaptativo siempre activo. OpenClaw establece de forma
predeterminada `high`, asigna `/think off` y `/think minimal` a `low` y omite los
parámetros de muestreo seleccionados por quien realiza la llamada.
El catálogo publica su ventana de contexto de 1,000,000 tokens, su límite de
salida de 128,000 tokens, la entrada de imágenes y sus precios de entrada/salida
de `$10/$50`.

Claude Opus 4.8 mantiene el razonamiento desactivado de forma predeterminada en
OpenClaw. Al activar explícitamente el razonamiento adaptativo con
`/think high|xhigh|max`, OpenClaw envía los valores de esfuerzo de Opus 4.8 de
Anthropic; los modelos Claude 4.6 (Opus 4.6 y Sonnet 4.6) usan `adaptive` de forma
predeterminada.

Sustitúyalo en cada mensaje con `/think:<level>` o en los parámetros del modelo:

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
- [Razonamiento ampliado](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Alternativa ante rechazos de seguridad (Claude Fable 5)

<Warning>
Usar Claude Fable 5 también implica usar Claude Opus 4.8. Fable 5 incluye
clasificadores de seguridad que pueden rechazar una solicitud, y la recuperación
autorizada por Anthropic consiste en hacer que `claude-opus-4-8` atienda ese turno. OpenClaw habilita esta
opción automáticamente para las solicitudes directas con clave de API, por lo que algunos turnos de Fable reciben
respuesta y se facturan como Claude Opus 4.8. Si su política o presupuesto no permiten
turnos atendidos por Opus, no seleccione `anthropic/claude-fable-5`.
</Warning>

### Por qué existe esto

Los clasificadores de Fable 5 devuelven `stop_reason: "refusal"` en solicitudes de dominios
restringidos y también generan falsos positivos en trabajos benignos relacionados (herramientas
de seguridad, ciencias biológicas o incluso pedir al modelo que reproduzca su razonamiento
sin procesar). Sin un modelo alternativo, el turno termina con un error aunque
otro modelo Claude pudiera atenderlo sin problemas; el propio mensaje de rechazo de Anthropic
indica a los integradores de la API que configuren un modelo alternativo.

### Cómo funciona

1. Para cada solicitud directa con clave de API a `anthropic/claude-fable-5`, OpenClaw
   envía la activación del modelo alternativo del lado del servidor de Anthropic: el encabezado beta
   `server-side-fallback-2026-06-01` junto con
   `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8 es el único
   destino alternativo que Anthropic permite para Fable 5.
2. Solo un rechazo del clasificador de seguridad activa el modelo alternativo. Los límites de frecuencia,
   las sobrecargas y los errores del servidor se comportan exactamente igual que antes y pasan por
   la [conmutación por error de modelos](/es/concepts/model-failover) normal de OpenClaw.
3. La recuperación se produce dentro de la misma llamada. Un rechazo anterior a cualquier salida es
   invisible, salvo por la latencia; la respuesta completa procede de Opus 4.8. En caso de
   rechazo a mitad de la transmisión, el texto parcial se conserva como prefijo desde el que continúa
   el modelo alternativo, mientras que el razonamiento y las llamadas a herramientas del modelo que rechazó
   la solicitud se descartan de acuerdo con las reglas de reproducción de Anthropic (no deben devolverse
   ni ejecutarse).
4. Si Claude Opus 4.8 también rechaza la solicitud, el turno presenta el rechazo como un
   error, exactamente igual que antes de esta función.

El modelo alternativo se activa en el nivel de la API de Anthropic, por lo que `claude-opus-4-8` no
necesita estar en la lista de modelos configurados ni en la cadena de modelos alternativos; una clave
de API compatible con Fable siempre puede usar Opus.

### Observabilidad y facturación

- Un turno atendido por el modelo alternativo registra un diagnóstico `provider_fallback` en el
  mensaje del asistente que indica `fromModel` y `toModel`, y el campo
  `responseModel` del mensaje informa `claude-opus-4-8`.
- Anthropic factura por intento: un rechazo anterior a la salida es gratuito y la recuperación
  se factura según las tarifas de Claude Opus 4.8 (actualmente, la mitad de las tarifas de Fable 5). La
  estimación de costes por turno de OpenClaw calcula los turnos atendidos por el modelo alternativo según las tarifas de Opus.
- Un rechazo a mitad de la transmisión también factura, por parte de Anthropic, la salida parcial de Fable
  ya transmitida; esa parte se indica en el uso por intento de la API,
  pero no se incluye en la estimación por turno de OpenClaw.

### Alcance

Se aplica a `anthropic/claude-fable-5` con autenticación mediante clave de API contra
`api.anthropic.com`. Las solicitudes mediante OAuth (reutilización de la suscripción de Claude CLI), URLs base de proxy,
Bedrock, Vertex y Foundry no cambian y siguen presentando allí
los rechazos como errores.

Verificado en vivo: una solicitud benigna que pide a Fable 5 reproducir su cadena de
pensamiento sin procesar se rechaza con `category: "reasoning_extraction"` cuando se envía sin
modelos alternativos, mientras que la misma solicitud mediante OpenClaw devuelve una respuesta normal
atendida por Opus con el diagnóstico `provider_fallback` adjunto.

Consulte la [guía de rechazos y modelos alternativos
de Anthropic](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
para conocer el comportamiento subyacente.

## Almacenamiento en caché de prompts

OpenClaw admite la función de almacenamiento en caché de prompts de Anthropic para la autenticación mediante clave de API.

| Valor                 | Duración de la caché | Descripción                                       |
| --------------------- | -------------------- | ------------------------------------------------- |
| `"short"` (predeterminado) | 5 minutos            | Se aplica automáticamente a la autenticación mediante clave de API |
| `"long"`              | 1 hora               | Caché ampliada                                    |
| `"none"`              | Sin caché            | Desactiva el almacenamiento en caché de prompts   |

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
  <Accordion title="Invalidaciones de caché por agente">
    Use los parámetros del modelo como base y, después, invalídelos para agentes específicos mediante `agents.list[].params`:

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

    Orden de combinación de la configuración:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (con `id` coincidente, invalida por clave)

    Esto permite que un agente conserve una caché de larga duración mientras otro agente que utiliza el mismo modelo desactiva la caché para tráfico en ráfagas o con poca reutilización.

  </Accordion>

  <Accordion title="Notas sobre Claude en Bedrock">
    - Los modelos Anthropic Claude en Bedrock (`amazon-bedrock/*anthropic.claude*`) aceptan la transferencia de `cacheRetention` cuando está configurado.
    - En los modelos de Bedrock que no son de Anthropic, se fuerza `cacheRetention: "none"` durante la ejecución.
    - Los valores predeterminados inteligentes para claves de API también establecen inicialmente `cacheRetention: "short"` para las referencias de Claude en Bedrock cuando no se define ningún valor explícito.

  </Accordion>
</AccordionGroup>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Modo rápido">
    El selector compartido `/fast` de OpenClaw establece el campo `service_tier` de Anthropic para el tráfico directo con clave de API a `api.anthropic.com`.

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
    - Solo se aplica a solicitudes directas a `api.anthropic.com` realizadas con una clave de API. Las solicitudes mediante OAuth/token de suscripción y las rutas de proxy nunca reciben un campo `service_tier`.
    - Los parámetros explícitos `serviceTier` o `service_tier` invalidan `/fast` cuando se establecen ambos.
    - En cuentas sin capacidad de Priority Tier, `service_tier: "auto"` puede resolverse como `standard`.

    </Note>

  </Accordion>

  <Accordion title="Comprensión multimedia (imágenes y PDF)">
    El plugin de Anthropic incluido registra la comprensión de imágenes y PDF. OpenClaw
    resuelve automáticamente las capacidades multimedia a partir de la autenticación de Anthropic configurada; no
    se necesita ninguna configuración adicional.

    | Propiedad          | Valor                 |
    | ------------------ | --------------------- |
    | Modelo predeterminado | `claude-opus-4-8`     |
    | Entrada compatible | Imágenes, documentos PDF |

    Cuando se adjunta una imagen o un PDF a una conversación, OpenClaw lo
    dirige automáticamente mediante el proveedor de comprensión multimedia de Anthropic.

  </Accordion>

  <Accordion title="Ventana de contexto de 1M">
    Claude Sonnet 5, Mythos 5 y Fable 5 tienen una ventana de entrada exacta de
    1,000,000 tokens y admiten hasta 128,000 tokens de salida. La ventana de contexto
    de 1M de Anthropic también está disponible de forma general en los modelos Claude 4.x con pensamiento adaptativo: Opus 4.8,
    Opus 4.7, Opus 4.6 y Sonnet 4.6. OpenClaw dimensiona estos modelos
    automáticamente, sin necesidad de `params.context1m`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-5": {},
            "anthropic/claude-mythos-5": {},
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    Las configuraciones anteriores pueden conservar `params.context1m: true`; es una operación inofensiva sin efecto para
    estos modelos y OpenClaw ya no envía el encabezado beta retirado
    `context-1m-2025-08-07` en ningún caso. Las entradas de configuración `anthropicBeta` anteriores
    con ese valor se eliminan durante la resolución de encabezados de la solicitud, y
    los modelos Claude anteriores no compatibles mantienen su ventana de contexto normal.

    `params.context1m: true` se comporta del mismo modo con el backend de Claude CLI
    (`claude-cli/*`): los modelos Opus y Sonnet compatibles y aptos para disponibilidad general ya reciben
    automáticamente la ventana de 1M, por lo que el parámetro también es opcional allí.

    <Warning>
    Requiere acceso a contexto largo en la credencial de Anthropic. La autenticación mediante OAuth/token de suscripción conserva los encabezados beta de Anthropic necesarios, pero OpenClaw elimina el encabezado beta de 1M retirado si permanece en una configuración anterior.
    </Warning>

  </Accordion>

  <Accordion title="Contexto de 1M de Claude Opus 4.8">
    `anthropic/claude-opus-4-8` y su variante `claude-cli` tienen una ventana de contexto
    de 1M de forma predeterminada; no se necesita `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Solución de problemas

<AccordionGroup>
  <Accordion title="Errores 401 / token repentinamente no válido">
    La autenticación mediante token de Anthropic caduca y puede revocarse. Para configuraciones nuevas, utilice en su lugar una clave de API de Anthropic.
  </Accordion>

  <Accordion title='No se encontró ninguna clave de API para el proveedor "anthropic"'>
    La autenticación de Anthropic es **por agente**; los agentes nuevos no heredan las claves del agente principal. Vuelva a ejecutar la incorporación para ese agente (o configure una clave de API en el host del Gateway) y, después, verifique con `openclaw models status`.
  </Accordion>

  <Accordion title='No se encontraron credenciales para el perfil "anthropic:default"'>
    Ejecute `openclaw models status` para ver qué perfil de autenticación está activo. Vuelva a ejecutar la incorporación o configure una clave de API para la ruta de ese perfil.
  </Accordion>

  <Accordion title="No hay ningún perfil de autenticación disponible (todos están en período de espera)">
    Consulte `openclaw models status --json` para ver `auth.unusableProfiles`. Los períodos de espera por límites de frecuencia de Anthropic pueden estar restringidos a un modelo, por lo que es posible que otro modelo de Anthropic siga estando disponible. Añada otro perfil de Anthropic o espere a que termine el período de espera.
  </Accordion>
</AccordionGroup>

<Note>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [Preguntas frecuentes](/es/help/faq).
</Note>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Backends de CLI" href="/es/gateway/cli-backends" icon="terminal">
    Configuración del backend de Claude CLI y detalles de ejecución.
  </Card>
  <Card title="Almacenamiento en caché de prompts" href="/es/reference/prompt-caching" icon="database">
    Cómo funciona el almacenamiento en caché de prompts entre proveedores.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
