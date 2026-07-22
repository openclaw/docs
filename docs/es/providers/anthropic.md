---
read_when:
    - Quieres usar modelos de Anthropic en OpenClaw
    - Se desea explorar las sesiones de Claude CLI o Claude Desktop en computadoras emparejadas
summary: Usa Anthropic Claude mediante claves de API o la CLI de Claude en OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-07-22T10:42:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7b044f4c0acb8e158cea7d6dc6fdac3763fc86f45d6c6bbbcc2256d42033f1b5
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic desarrolla la familia de modelos **Claude**. OpenClaw admite dos métodos de autenticación:

- **Clave de API** - acceso directo a la API de Anthropic con facturación basada en el uso (modelos `anthropic/*`)
- **CLI de Claude** - reutiliza un inicio de sesión existente de Claude Code en el mismo host

## Seguimiento del uso y los costes

OpenClaw detecta la credencial de Anthropic disponible y selecciona la interfaz de uso correspondiente:

- Las credenciales de suscripción/configuración de Claude muestran los períodos de cuota y el presupuesto opcional para uso adicional.
- `ANTHROPIC_ADMIN_KEY` o `ANTHROPIC_ADMIN_API_KEY` muestra 30 días de costes de la organización y uso de la API Messages notificados por el proveedor en **Uso** de la interfaz de control, incluidos el gasto diario, los totales de tokens/caché, los modelos principales y las categorías de costes.
- Una credencial `sk-ant-admin...` almacenada en el perfil del proveedor Anthropic se detecta automáticamente como clave de la API Admin.

El historial de costes de la API Admin procede de la [API de uso y costes](https://platform.claude.com/docs/en/manage-claude/usage-cost-api) de Anthropic. Refleja la facturación real del proveedor y es independiente del coste estimado por OpenClaw a partir de las sesiones.

<Warning>
El backend de la CLI de Claude de OpenClaw ejecuta la CLI de Claude Code instalada en
modo de impresión no interactivo (`claude -p`). La documentación actual de Claude Code de Anthropic
describe ese modo como uso programático/del Agent SDK. La actualización de soporte de Anthropic del 15 de junio de 2026
suspendió el cambio de facturación independiente del Agent SDK anunciado: el uso de Claude
Agent SDK, `claude -p` y aplicaciones de terceros sigue consumiendo los límites de uso
de la suscripción con la que se haya iniciado sesión, y el crédito mensual del Agent SDK
anunciado anteriormente no está disponible mientras Anthropic revisa ese plan.

Claude Code interactivo también consume los límites del plan de Claude con el que se haya iniciado sesión.
La autenticación mediante clave de API usa facturación directa por uso y no depende de ese plan.
Para hosts de Gateway de larga duración, automatización compartida y gastos de producción
predecibles, utiliza una clave de API de Anthropic.

Los artículos de soporte actuales de Anthropic pueden cambiar este comportamiento sin una
versión nueva de OpenClaw:

- [Referencia de la CLI de Claude Code](https://code.claude.com/docs/en/cli-usage)
- [Usar Claude Agent SDK con un plan de Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Usar Claude Code con un plan Pro o Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Usar Claude Code con un plan Team o Enterprise](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Gestionar los costes de Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## Primeros pasos

<Tabs>
  <Tab title="Clave de API">
    **Recomendado para:** acceso estándar a la API y facturación basada en el uso.

    <Steps>
      <Step title="Obtener la clave de API">
        Crea una clave de API en la [consola de Anthropic](https://console.anthropic.com/).
      </Step>
      <Step title="Ejecutar la incorporación">
        ```bash
        openclaw onboard
        # elige: clave de API de Anthropic
        ```

        También puedes proporcionar la clave directamente:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Comprobar que el modelo está disponible">
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
    **Recomendado para:** reutilizar un inicio de sesión existente de la CLI de Claude sin una clave de API independiente.

    <Steps>
      <Step title="Asegurarse de que la CLI de Claude esté instalada y tenga una sesión iniciada">
        Compruébalo con:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Ejecutar la incorporación">
        ```bash
        openclaw onboard
        # elige: CLI de Claude
        ```

        OpenClaw detecta y reutiliza las credenciales existentes de la CLI de Claude.
      </Step>
      <Step title="Comprobar que el modelo está disponible">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Los detalles de configuración y ejecución del backend de la CLI de Claude se encuentran en [Backends de CLI](/es/gateway/cli-backends).
    </Note>

    <Warning>
    La reutilización de la CLI de Claude requiere que el proceso de OpenClaw se ejecute en el mismo host que el
    inicio de sesión de la CLI de Claude. Las instalaciones con Docker pueden conservar el directorio de inicio de un contenedor e iniciar sesión en
    Claude Code allí; consulta
    [Backend de la CLI de Claude en Docker](/es/install/docker#claude-cli-backend-in-docker).
    Otras instalaciones en contenedores, como [Podman](/es/install/podman), no montan el
    `~/.claude` del host durante la configuración ni la ejecución; utiliza allí una clave de API de Anthropic o elige
    un proveedor con OAuth gestionado por OpenClaw, como
    [OpenAI Codex](/es/providers/openai).
    </Warning>

    ### Obtener un token de configuración

    Ejecuta `claude setup-token` en cualquier máquina que tenga Claude Code instalado. Imprime
    un token de larga duración que comienza por `sk-ant-oat01-`.

    Durante la incorporación, pega el token en la aplicación para macOS eligiendo
    **Token de configuración de Anthropic** en **Conectar con una clave de API o un token**, o utiliza:

    ```bash
    openclaw models auth login --provider anthropic --method setup-token
    ```

    ### Ejemplo de configuración

    Es preferible usar la referencia canónica del modelo de Anthropic junto con una anulación del entorno de ejecución de la CLI:

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
    compatibilidad, pero las configuraciones nuevas deben mantener la selección de proveedor/modelo como
    `anthropic/*` y definir el backend de ejecución en la política del entorno de ejecución del proveedor/modelo.

    ### Facturación y `claude -p`

    OpenClaw utiliza la ruta no interactiva `claude -p` de Claude Code para las ejecuciones de la CLI de Claude.
    Actualmente, Anthropic trata esa ruta como uso programático/del Agent SDK:

    - La actualización de soporte de Anthropic del 15 de junio de 2026 suspendió el plan
      de créditos independientes para el Agent SDK anunciado anteriormente.
    - El uso de Claude Agent SDK, `claude -p` y aplicaciones de terceros con un plan de suscripción
      sigue consumiendo los límites de uso de la suscripción con la que se haya iniciado sesión.
    - El crédito mensual del Agent SDK anunciado anteriormente no está disponible mientras
      Anthropic revisa ese plan.
    - Los inicios de sesión mediante la consola/clave de API utilizan facturación de API por uso y no reciben
      el crédito del Agent SDK de la suscripción.

    Consulta el [artículo sobre el plan del Agent SDK
    de Anthropic](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    para obtener información sobre la suspensión, y los artículos sobre los planes de Claude Code para conocer el comportamiento
    de las suscripciones
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    y
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    Anthropic puede cambiar el comportamiento de la facturación y los límites de frecuencia de Claude Code sin una
    versión nueva de OpenClaw. Consulta `claude auth status`, `/status` y
    la documentación enlazada de Anthropic cuando sea importante que la facturación sea predecible.

    <Tip>
    Para la automatización de producción compartida, utiliza una clave de API de Anthropic en lugar de la
    CLI de Claude. OpenClaw también admite opciones basadas en suscripción de
    [OpenAI Codex](/es/providers/openai), [Qwen Cloud](/es/providers/qwen),
    [MiniMax](/es/providers/minimax) y [Z.AI / GLM](/es/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Sesiones de Claude entre distintos ordenadores

El Plugin de Anthropic incluido añade un grupo **Claude Code** a la barra lateral normal de
sesiones. Las filas se abren en el panel normal de chat. Detecta sesiones de Claude
Code no archivadas en el Gateway y en los hosts Node conectados:

- Las sesiones de la CLI de Claude proceden de registros válidos del índice de proyectos. Para las
  transcripciones no indexadas, un mecanismo alternativo acotado de metadatos reconoce sesiones interactivas
  simultáneas que no pertenecen a una cadena secundaria (`cli`) y sesiones de CLI sin interfaz del Agent SDK (`sdk-cli`) en
  `~/.claude/projects/`.
- Las sesiones de Claude Desktop utilizan el título de Desktop, la hora de actividad y el
  estado de archivo cuando sus metadatos apuntan al mismo ID de sesión de Claude Code.
- Una sesión exclusiva de la CLI no tiene indicador de archivo, por lo que permanece visible mientras
  exista su transcripción.

No se requiere ninguna configuración adicional de OpenClaw para la detección. El Plugin de Anthropic
está incluido y habilitado de forma predeterminada; un Node nativo de macOS anuncia los comandos de solo lectura
para sesiones de Claude cuando existe el directorio local `~/.claude/projects/`.
Aprueba la actualización del emparejamiento del Node cuando esos comandos aparezcan por primera vez.

La barra lateral agrupa las filas por su Gateway o por el host del Node emparejado y muestra la
página acotada más reciente de cada host en cuanto ese ordenador responde. Vuelve a efectuar la conciliación
tras los cambios de conectividad del host, cuando la página recupera el foco y, como máximo, cada
30 segundos mientras está visible, de modo que las sesiones de Claude creadas fuera de OpenClaw aparecen
sin necesidad de recargar. Cuando cambia un catálogo, se realiza una pasada de seguimiento más rápida. Utiliza **Cargar más
sesiones** debajo de un grupo del catálogo para añadir la página siguiente de cada host que tenga
más historial; las filas añadidas permanecen visibles y se vuelven a obtener con la misma profundidad
durante las actualizaciones. Los clientes del catálogo utilizan `sessions.catalog.list`; al abrir una fila se utiliza
`sessions.catalog.read`.

La toma de control del terminal resuelve `claude` desde el PATH del shell de inicio de sesión
del usuario del host propietario antes que desde el PATH del servicio/demonio. Esto mantiene las sesiones iniciadas desde la aplicación alineadas
con la CLI de Claude que obtiene el operador en un terminal normal.

Al seleccionar una fila, se lee primero la página más reciente de la transcripción. **Cargar elementos anteriores de la
transcripción** sigue un cursor de bytes opaco y lee otra sección acotada del
archivo JSONL en lugar de cargar todo el historial. Se conserva el contenido normal del usuario, del asistente,
de razonamiento, de llamadas a herramientas y de resultados de herramientas. Los elementos individuales
que superan el límite de seguridad del Node/Gateway se marcan claramente como truncados.

Para una fila `claude-cli` local del Gateway, al escribir en el compositor normal se llama a
`sessions.catalog.continue`. OpenClaw vuelve a resolver el registro del catálogo local,
crea o reutiliza una sesión nativa bloqueada al modelo, importa como máximo 200 elementos visibles
o 512 KiB y establece el enlace de la CLI de Claude. El primer turno se reanuda con
`--fork-session`; Claude asigna a la bifurcación un nuevo ID de sesión, por lo que los turnos posteriores utilizan
la bifurcación y la sesión de origen permanece intacta.

Un host Node sin interfaz también puede permitir que sus filas de la CLI de Claude continúen habilitando
la siguiente opción local del Node y reiniciando el host Node:

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

El Node anuncia `agent.cli.claude.run.v1` únicamente cuando la opción está habilitada
y se puede resolver su ejecutable local `claude`. OpenClaw vuelve a resolver el registro del catálogo
en ese Node, importa el mismo historial acotado y vincula la sesión adoptada
al Node y al directorio de trabajo indicado por el catálogo. Cada turno ejecuta el
proceso `claude -p` real del Node utilizando los archivos de Claude y el inicio de sesión de ese Node. La
política de aprobación de ejecución del Node sigue aplicándose; el Gateway no puede forzar esta activación.

La versión 1 de la continuación mediante Node solo permite una ejecución. Omite la configuración MCP de bucle invertido del Gateway y
los argumentos del Plugin de Skills del Gateway, no vuelve a inicializar a partir de una transcripción del Gateway y
rechaza archivos adjuntos e imágenes. Las filas de Claude Desktop siguen siendo de solo lectura. Los
Nodes de la aplicación nativa para macOS también siguen siendo de solo lectura hasta que la aplicación anuncie el comando de ejecución.

<Note>
Las sesiones de Claude de Nodes emparejados permanecen en modo de solo lectura, salvo que el Node sin interfaz anuncie explícitamente
`agent.cli.claude.run.v1`. OpenClaw nunca modifica los metadatos de Claude Desktop
ni archiva sesiones de Claude. La página requiere una conexión de operador
con permiso de escritura porque utiliza `node.invoke` autenticado; las operaciones de listado y lectura
siguen siendo de solo lectura incluso en un Node con continuación habilitada.
</Note>

Consulte [Nodos: sesiones y transcripciones de Claude](/es/nodes#claude-sessions-and-transcripts)
para conocer el comando de Node y el límite de seguridad.

## Valores predeterminados de razonamiento (Claude Sonnet 5, Mythos 5, Fable 5, 4.8 y 4.6)

`anthropic/claude-sonnet-5` utiliza razonamiento adaptativo con un nivel de esfuerzo `high` de forma predeterminada.
Utilice `/think off` para desactivar el razonamiento, o `/think xhigh|max` para los niveles
de esfuerzo nativos superiores del modelo. OpenClaw omite los presupuestos de razonamiento manual, los parámetros
de muestreo personalizados, los prefijos del asistente y Priority Tier para Sonnet 5 porque
Anthropic no admite esas funciones de solicitud en este modelo.
El catálogo utiliza los precios introductorios de entrada/salida de Anthropic de `$2/$10` hasta el
31 de agosto de 2026; los precios estándar de `$3/$15` comienzan el 1 de septiembre de 2026.

`anthropic/claude-fable-5` siempre utiliza razonamiento adaptativo y adopta de forma predeterminada un nivel de esfuerzo
`high`. Anthropic no permite desactivar el razonamiento en este modelo, por lo que
`/think off` y `/think minimal` se asignan en su lugar al nivel de esfuerzo `low`. OpenClaw también
omite los valores de temperatura personalizados en las solicitudes de Fable 5, ya que Anthropic rechaza
la modificación de la temperatura en cualquier solicitud con el razonamiento activado.

`anthropic/claude-mythos-5` es un modelo de acceso limitado con el mismo
contrato de razonamiento adaptativo siempre activo. OpenClaw utiliza `high` de forma predeterminada, asigna `/think off` y
`/think minimal` a `low` y omite los parámetros de muestreo seleccionados por el solicitante.
El catálogo publica su ventana de contexto de 1,000,000 tokens, el límite de salida
de 128,000 tokens, la entrada de imágenes y los precios de entrada/salida de `$10/$50`.

Claude Opus 4.8 mantiene el razonamiento desactivado de forma predeterminada en OpenClaw. Cuando se activa
explícitamente el razonamiento adaptativo con `/think high|xhigh|max`, OpenClaw envía
los valores de esfuerzo de Opus 4.8 de Anthropic; los modelos Claude 4.6 (Opus 4.6 y Sonnet 4.6)
utilizan `adaptive` de forma predeterminada.

Anule el valor por mensaje con `/think:<level>` o en los parámetros del modelo:

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
Utilizar Claude Fable 5 implica utilizar también Claude Opus 4.8. Fable 5 incluye
clasificadores de seguridad que pueden rechazar una solicitud, y la recuperación autorizada
por Anthropic consiste en hacer que `claude-opus-4-8` atienda ese turno. OpenClaw habilita esta opción
automáticamente para las solicitudes directas con clave de API, por lo que algunos turnos de Fable reciben
respuesta y se facturan como Claude Opus 4.8. Si la política o el presupuesto no permiten
turnos atendidos por Opus, no seleccione `anthropic/claude-fable-5`.
</Warning>

### Por qué existe

Los clasificadores de Fable 5 devuelven `stop_reason: "refusal"` para las solicitudes de ámbitos
restringidos y también producen falsos positivos en trabajos benignos relacionados (herramientas
de seguridad, ciencias biológicas o incluso solicitudes para que el modelo reproduzca su
razonamiento sin procesar). Sin una alternativa, el turno termina con un error aunque
otro modelo Claude podría atenderlo sin problemas; el propio mensaje de rechazo de Anthropic
indica a los integradores de la API que configuren un modelo alternativo.

### Cómo funciona

1. Para cada solicitud directa con clave de API a `anthropic/claude-fable-5`, OpenClaw
   envía la habilitación de la alternativa en el servidor de Anthropic: el encabezado beta
   `server-side-fallback-2026-06-01` junto con
   `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8 es el único
   destino alternativo que Anthropic permite para Fable 5.
2. Solo un rechazo del clasificador de seguridad activa la alternativa. Los límites de frecuencia,
   las sobrecargas y los errores del servidor se comportan exactamente igual que antes y pasan por
   la [conmutación por error de modelos](/es/concepts/model-failover) normal de OpenClaw.
3. La recuperación sucede dentro de la misma llamada. Un rechazo previo a cualquier salida es
   invisible salvo por la latencia; toda la respuesta procede de Opus 4.8. En caso de un
   rechazo a mitad de la transmisión, el texto parcial se conserva como prefijo desde el cual continúa
   el modelo alternativo, mientras que el razonamiento y las llamadas a herramientas del modelo que rechazó
   la solicitud se descartan conforme a las reglas de reproducción de Anthropic (no deben devolverse ni
   ejecutarse).
4. Si Claude Opus 4.8 también rechaza la solicitud, el turno muestra el rechazo como un
   error, exactamente igual que antes de esta función.

La alternativa se aplica en el nivel de la API de Anthropic, por lo que `claude-opus-4-8` no
necesita estar en la lista de modelos configurada ni en la cadena de alternativas: una clave de API
compatible con Fable siempre puede utilizar Opus.

### Observabilidad y facturación

- Un turno atendido por el modelo alternativo registra un diagnóstico `provider_fallback` en el
  mensaje del asistente que indica `fromModel` y `toModel`, y el
  `responseModel` del mensaje informa de `claude-opus-4-8`.
- Anthropic factura por intento: un rechazo previo a la salida es gratuito y la recuperación
  se factura según las tarifas de Claude Opus 4.8 (actualmente la mitad de las tarifas de Fable 5). La
  estimación de costes por turno de OpenClaw calcula los turnos atendidos por el modelo alternativo según las tarifas de Opus.
- Un rechazo a mitad de la transmisión factura además el fragmento de Fable ya transmitido
  por parte de Anthropic; esa parte se informa en el uso por intento de la API,
  pero no se incorpora a la estimación por turno de OpenClaw.

### Alcance

Se aplica a `anthropic/claude-fable-5` con autenticación mediante clave de API contra
`api.anthropic.com`. OAuth (reutilización de la suscripción de la CLI de Claude), las URL base de proxy,
las solicitudes de Bedrock, Vertex y Foundry no cambian y siguen mostrando
allí los rechazos como errores.

Verificación en vivo: una solicitud benigna que pide a Fable 5 que reproduzca su cadena
de pensamiento sin procesar se rechaza con `category: "reasoning_extraction"` cuando se envía sin
alternativas, mientras que la misma solicitud a través de OpenClaw devuelve una respuesta normal
atendida por Opus con el diagnóstico `provider_fallback` adjunto.

Consulte la [guía de rechazos y alternativas
de Anthropic](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
para conocer el comportamiento subyacente.

## Almacenamiento en caché de prompts

OpenClaw admite la función de almacenamiento en caché de prompts de Anthropic para la autenticación mediante clave de API.

| Valor               | Duración de la caché | Descripción                            |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (predeterminado) | 5 minutos      | Se aplica automáticamente a la autenticación mediante clave de API |
| `"long"`            | 1 hora         | Caché ampliada                         |
| `"none"`            | Sin caché     | Desactiva el almacenamiento en caché de prompts                 |

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
    Utilice los parámetros del modelo como referencia y, a continuación, anule agentes específicos mediante `agents.entries.*.params`:

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

    Orden de fusión de la configuración:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.entries.*.params` (si coincide con `id`, se sobrescribe por clave)

    Esto permite que un agente mantenga una caché de larga duración mientras otro agente que usa el mismo modelo desactiva el almacenamiento en caché para tráfico en ráfagas o con poca reutilización.

  </Accordion>

  <Accordion title="Notas sobre Claude en Bedrock">
    - Los modelos Claude de Anthropic en Bedrock (`amazon-bedrock/*anthropic.claude*`) aceptan el paso directo de `cacheRetention` cuando está configurado.
    - Los modelos de Bedrock que no son de Anthropic se fuerzan a `cacheRetention: "none"` durante la ejecución.
    - Los valores predeterminados inteligentes para claves de API también inicializan `cacheRetention: "short"` para las referencias de Claude en Bedrock cuando no se establece ningún valor explícito.

  </Accordion>
</AccordionGroup>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Modo rápido">
    El selector compartido `/fast` de OpenClaw establece el campo `service_tier` de Anthropic en `api.anthropic.com` para el tráfico directo con clave de API.

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
    - Solo se aplica a las solicitudes directas `api.anthropic.com` realizadas con una clave de API. Las solicitudes con OAuth o token de suscripción y las rutas de proxy nunca reciben un campo `service_tier`.
    - Los parámetros explícitos `serviceTier` o `service_tier` prevalecen sobre `/fast` cuando ambos están configurados.
    - En las cuentas sin capacidad de Priority Tier, `service_tier: "auto"` puede resolverse como `standard`.

    </Note>

  </Accordion>

  <Accordion title="Comprensión de contenido multimedia (imágenes y PDF)">
    El plugin de Anthropic incluido registra la comprensión de imágenes y PDF. OpenClaw
    determina automáticamente las capacidades multimedia a partir de la autenticación de Anthropic configurada;
    no se necesita ninguna configuración adicional.

    | Propiedad          | Valor                  |
    | ------------------ | ---------------------- |
    | Modelo predeterminado | `claude-opus-4-8`     |
    | Entrada compatible | Imágenes, documentos PDF |

    Cuando se adjunta una imagen o un PDF a una conversación, OpenClaw lo
    dirige automáticamente al proveedor de comprensión multimedia de Anthropic.

  </Accordion>

  <Accordion title="Ventana de contexto de 1M">
    Claude Sonnet 5, Mythos 5 y Fable 5 tienen una ventana de entrada de
    exactamente 1,000,000 tokens y admiten hasta 128,000 tokens de salida. La ventana
    de contexto de 1M de Anthropic también está disponible de forma general en los modelos Claude 4.x
    con pensamiento adaptativo: Opus 4.8, Opus 4.7, Opus 4.6 y Sonnet 4.6.
    OpenClaw dimensiona estos modelos automáticamente, sin necesidad de `params.context1m`:

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

    Las configuraciones anteriores pueden conservar `params.context1m: true`; es una operación
    inofensiva sin efecto para estos modelos y OpenClaw ya no envía el encabezado beta
    retirado `context-1m-2025-08-07` en ningún caso. Las entradas de configuración anteriores
    de `anthropicBeta` con ese valor se descartan durante la resolución de los
    encabezados de la solicitud, y los modelos Claude anteriores no compatibles mantienen
    su ventana de contexto normal.

    `params.context1m: true` se comporta del mismo modo para el backend de la CLI de Claude
    (`claude-cli/*`): los modelos Opus y Sonnet compatibles con la disponibilidad general
    ya obtienen automáticamente la ventana de 1M, por lo que el parámetro también es opcional allí.

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
    La autenticación mediante token de Anthropic caduca y puede revocarse. Para las configuraciones nuevas, utilice en su lugar una clave de API de Anthropic.
  </Accordion>

  <Accordion title='No se encontró ninguna clave de API para el proveedor "anthropic"'>
    La autenticación de Anthropic es **por agente**; los agentes nuevos no heredan las claves del agente principal. Vuelva a ejecutar la incorporación para ese agente (o configure una clave de API en el host del Gateway) y, a continuación, verifíquela con `openclaw models status`.
  </Accordion>

  <Accordion title='No se encontraron credenciales para el perfil "anthropic:default"'>
    Ejecute `openclaw models status` para consultar qué perfil de autenticación está activo. Vuelva a ejecutar la incorporación o configure una clave de API para la ruta de ese perfil.
  </Accordion>

  <Accordion title="No hay ningún perfil de autenticación disponible (todos están en período de espera)">
    Compruebe `openclaw models status --json` para `auth.unusableProfiles`. Los períodos de espera por límite de frecuencia de Anthropic pueden estar restringidos al modelo, por lo que otro modelo de Anthropic podría seguir estando disponible. Añada otro perfil de Anthropic o espere a que termine el período de espera.
  </Accordion>
</AccordionGroup>

<Note>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [Preguntas frecuentes](/es/help/faq).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Backends de CLI" href="/es/gateway/cli-backends" icon="terminal">
    Configuración del backend de Claude CLI y detalles del entorno de ejecución.
  </Card>
  <Card title="Almacenamiento en caché de prompts" href="/es/reference/prompt-caching" icon="database">
    Cómo funciona el almacenamiento en caché de prompts entre proveedores.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
