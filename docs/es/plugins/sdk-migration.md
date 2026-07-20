---
read_when:
    - Aparece la advertencia OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Aparece la advertencia OPENCLAW_EXTENSION_API_DEPRECATED
    - Usó `api.registerEmbeddedExtensionFactory` antes de OpenClaw 2026.4.25
    - Está actualizando un plugin a la arquitectura moderna de plugins
    - Mantiene un plugin externo de OpenClaw
sidebarTitle: Migrate to SDK
summary: Migra de la capa heredada de compatibilidad con versiones anteriores al SDK moderno de plugins
title: Migración del SDK de plugins
x-i18n:
    generated_at: "2026-07-20T00:55:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: af65ffc5b71e5e2bfd3e54e6cfe80fd02a058dfa33646994386ab08ad583fbb0
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw sustituyó una amplia capa de compatibilidad con versiones anteriores por una
arquitectura moderna de plugins basada en importaciones pequeñas y específicas. Si su plugin es anterior a ese
cambio, esta guía permite adaptarlo a los contratos actuales.

## Qué cambió

Varias superficies de importación excesivamente abiertas permitían anteriormente que los plugins accedieran a casi cualquier elemento
desde un único punto de entrada:

- **`openclaw/plugin-sdk`** y **`openclaw/plugin-sdk/compat`**: reexportaban
  decenas de utilidades mientras se desarrollaba el SDK específico. Ambas raíces se han
  eliminado; importe en su lugar una subruta documentada.
- **`openclaw/plugin-sdk/infra-runtime`**: un barrel amplio que combinaba eventos del
  sistema, estado de Heartbeat, colas de entrega, utilidades de obtención/proxy, utilidades de archivos,
  tipos de aprobación y utilidades no relacionadas.
- **`openclaw/plugin-sdk/config-runtime`**: un barrel de configuración amplio que se conservó
  únicamente durante su posterior periodo de compatibilidad; se han eliminado las utilidades directas de
  carga/escritura en tiempo de ejecución.
- **`openclaw/extension-api`**: un puente eliminado que proporcionaba a los plugins acceso directo
  a utilidades del host, como el ejecutor de agentes integrado.
- **`api.registerEmbeddedExtensionFactory(...)`**: un hook eliminado exclusivo del ejecutor
  integrado que observaba eventos de este, como `tool_result`. Use en su lugar middleware
  de resultados de herramientas del agente (consulte [Migrar las extensiones de resultados de herramientas integradas
  a middleware](#how-to-migrate)).

Se han eliminado el SDK raíz, el barrel de compatibilidad, el puente de extensiones y la fábrica de extensiones
integradas. `infra-runtime` y `config-runtime` permanecen únicamente durante sus
periodos posteriores registrados por separado; los plugins nuevos deben usar subrutas específicas.

<Warning>
  Los plugins que importan las superficies raíz, de compatibilidad o de extensión eliminadas ya no
  se cargan. Siga las correspondencias siguientes antes de actualizar.
</Warning>

OpenClaw no elimina ni reinterpreta el comportamiento documentado de los plugins en el mismo
cambio que introduce un reemplazo. Los cambios incompatibles de contrato pasan primero por un
adaptador de compatibilidad, diagnósticos, documentación y un periodo de obsolescencia. Esto
se aplica a las importaciones del SDK, los campos del manifiesto, las API de configuración, los hooks y el comportamiento
de registro en tiempo de ejecución.

### Motivos

- **Inicio lento**: importar una utilidad cargaba decenas de módulos no relacionados.
- **Dependencias circulares**: las reexportaciones amplias facilitaban la creación de
  ciclos de importación.
- **Superficie de API poco clara**: no había forma de distinguir las exportaciones estables de las internas.

Cada `openclaw/plugin-sdk/<subpath>` es ahora un módulo pequeño e independiente con
un contrato documentado.

También se han eliminado las antiguas interfaces prácticas de proveedores para los canales incluidos:
los atajos de utilidades asociados a canales eran recursos privados del monorepositorio, no
contratos estables para plugins. Use en su lugar subrutas genéricas y específicas del SDK. Dentro del
espacio de trabajo de plugins incluidos, mantenga las utilidades propiedad del proveedor en el
`api.ts` o `runtime-api.ts` del propio plugin:

- Anthropic mantiene las utilidades de transmisión específicas de Claude en su propia interfaz `api.ts` /
  `contract-api.ts`.
- OpenAI mantiene los constructores de proveedores, las utilidades del modelo predeterminado y los constructores de proveedores
  en tiempo real en su propio `api.ts`.
- OpenRouter mantiene el constructor del proveedor y las utilidades de incorporación/configuración en su propio
  `api.ts`.

## Política de compatibilidad

El trabajo de compatibilidad con plugins externos sigue este orden:

1. Añadir el contrato nuevo.
2. Mantener el comportamiento anterior conectado mediante un adaptador de compatibilidad.
3. Emitir un diagnóstico o una advertencia que indique la ruta anterior y su reemplazo.
4. Cubrir ambas rutas en las pruebas.
5. Documentar la obsolescencia y la ruta de migración.
6. Eliminar únicamente después del periodo de migración anunciado, normalmente en una versión
   principal.

Si todavía se acepta un campo del manifiesto, continúe usándolo hasta que la documentación y
los diagnósticos indiquen lo contrario. El código nuevo debe preferir el reemplazo documentado;
los plugins existentes no deben dejar de funcionar durante las versiones secundarias ordinarias.

Audite la cola de migración actual con `pnpm plugins:boundary-report`:

| Indicador                                               | Efecto                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--summary` (o `pnpm plugins:boundary-report:summary`) | Recuentos compactos en lugar de información completa.                          |
| `--json`                                                | Informe legible por máquina.                                                   |
| `--owner <id>`                                          | Filtra por un plugin o propietario de compatibilidad.                          |
| `--fail-on-cross-owner`                                 | Finaliza con un código distinto de cero si hay importaciones reservadas del SDK entre propietarios. |
| `--fail-on-eligible-compat`                             | Finaliza con un código distinto de cero cuando ha pasado la fecha `removeAfter` de un registro de compatibilidad obsoleto. |
| `--fail-on-unclassified-unused-reserved`                | Finaliza con un código distinto de cero si hay shims reservados del SDK sin usar. |

`pnpm plugins:boundary-report:ci` se ejecuta con los tres indicadores de fallo. Cada
registro de compatibilidad tiene una fecha `removeAfter` explícita (no un impreciso «próxima
versión principal»): el informe agrupa los registros obsoletos por esa fecha, cuenta
las referencias locales en el código y la documentación, muestra las importaciones reservadas del SDK entre propietarios y
resume el puente privado del SDK con el host de memoria. Las subrutas reservadas del SDK deben tener
un uso registrado por parte del propietario; las exportaciones reservadas sin usar deben eliminarse del SDK
público.

## Cómo migrar

<Steps>
  <Step title="Migrar las utilidades de carga y escritura de configuración en tiempo de ejecución">
    Los plugins incluidos deben dejar de invocar directamente `api.runtime.config.loadConfig()` y
    `api.runtime.config.writeConfigFile(...)`. Es preferible usar la configuración que ya se
    proporciona a la ruta de llamada activa. Los controladores de larga duración que necesiten la
    instantánea actual del proceso pueden usar `api.runtime.config.current()`. Las herramientas de agente
    de larga duración deben leer `ctx.getRuntimeConfig()` dentro de `execute` para que una herramienta
    creada antes de escribir una configuración siga viendo la configuración actualizada.

    Las escrituras de configuración pasan por la utilidad transaccional con una política
    explícita posterior a la escritura:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Use `afterWrite: { mode: "restart", reason: "..." }` cuando el cambio requiera
    un reinicio limpio del Gateway, y `afterWrite: { mode: "none", reason: "..." }`
    únicamente cuando el invocador sea responsable del seguimiento y suprima deliberadamente el
    planificador de recarga. Los resultados de la mutación incluyen un resumen `followUp` tipado para
    las pruebas y los registros; el Gateway sigue siendo responsable de aplicar o
    programar el reinicio.

    `loadConfig` y `writeConfigFile` se han eliminado del tiempo de ejecución de
    plugins. Los plugins incluidos y el código de tiempo de ejecución del repositorio están protegidos por
    `pnpm check:deprecated-api-usage` y
    `pnpm check:no-runtime-action-load-config`: el nuevo uso en producción por parte de plugins
    falla de inmediato, las escrituras directas de configuración fallan, los métodos del servidor del Gateway deben usar
    la instantánea de tiempo de ejecución de la solicitud, las utilidades de envío/acción/cliente de canales en tiempo de ejecución
    deben recibir la configuración desde su límite, y los módulos de tiempo de ejecución de larga duración
    no permiten ninguna llamada ambiental a `loadConfig()`.

    El código nuevo de plugins debe evitar el barrel amplio `openclaw/plugin-sdk/config-runtime`.
    Use la subruta específica para cada tarea:

    | Necesidad | Importación |
    | --- | --- |
    | Tipos de configuración como `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Búsqueda de configuración en la entrada del plugin | `api.pluginConfig` |
    | Combinación de configuraciones | Lógica local del plugin en el límite de configuración |
    | Lecturas de la instantánea actual de tiempo de ejecución | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Escrituras de configuración | `openclaw/plugin-sdk/config-mutation` |
    | Utilidades del almacén de sesiones | `openclaw/plugin-sdk/session-store-runtime` |
    | Configuración de tablas Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Utilidades de tiempo de ejecución de políticas de grupo | `openclaw/plugin-sdk/runtime-group-policy` |
    | Resolución de entradas secretas | `openclaw/plugin-sdk/secret-input-runtime` |
    | Sustituciones de modelos/sesiones | `openclaw/plugin-sdk/model-session-runtime` |

    Los plugins incluidos y sus pruebas están protegidos mediante un escáner contra el barrel
    amplio, de modo que las importaciones y los simulacros permanezcan circunscritos al comportamiento que necesitan. El
    barrel sigue existiendo para la compatibilidad externa, pero el código nuevo no debe
    depender de él.

  </Step>

  <Step title="Migrar las extensiones de resultados de herramientas integradas a middleware">
    Los plugins incluidos deben reemplazar los controladores de resultados de herramientas
    `api.registerEmbeddedExtensionFactory(...)`, exclusivos del ejecutor integrado, por
    middleware independiente del tiempo de ejecución:

    ```typescript
    // Herramientas del tiempo de ejecución de OpenClaw y herramientas dinámicas del tiempo de ejecución de Codex (el resultado puede
    // transformarse). Los resultados de herramientas nativas de Codex también se retransmiten para su observación,
    // pero su salida transformada nunca llega al modelo: el contrato del hook
    // PostToolUse de Codex no puede reemplazar una respuesta de herramienta nativa.
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Actualice al mismo tiempo el manifiesto del plugin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Los plugins instalados también pueden registrar middleware de resultados de herramientas cuando esté
    habilitado explícitamente y todos los tiempos de ejecución objetivo estén declarados en
    `contracts.agentToolResultMiddleware`. Se rechazan los registros de middleware
    instalado no declarado.

  </Step>

  <Step title="Migrar los controladores de aprobación nativos a hechos de capacidad">
    Los plugins de canales con capacidad de aprobación exponen el comportamiento de aprobación nativo mediante
    `approvalCapability.nativeRuntime` junto con el registro compartido de contexto
    de tiempo de ejecución:

    - Reemplace `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`.
    - Traslade la autenticación/entrega específica de aprobaciones del cableado antiguo `plugin.auth` /
      `plugin.approvals` a `approvalCapability`.
    - `ChannelPlugin.approvals` se ha eliminado del contrato público
      de plugins de canales; traslade los campos de entrega/nativos/renderizado a
      `approvalCapability`.
    - `plugin.auth` permanece únicamente para los flujos de inicio/cierre de sesión del canal; el núcleo ya no
      lee allí los hooks de autenticación de aprobaciones.
    - Registre los objetos de tiempo de ejecución propiedad del canal (clientes, tokens, aplicaciones Bolt)
      mediante `openclaw/plugin-sdk/channel-runtime-context`.
    - No envíe avisos de redireccionamiento propiedad del plugin desde los controladores de aprobación nativos;
      el núcleo es responsable de los avisos de redireccionamiento a otro lugar a partir de los resultados reales de entrega.
    - Al pasar `channelRuntime` a `createChannelManager(...)`, proporcione una
      superficie `createPluginRuntime().channel` real; se rechazan los
      stubs parciales.

    Consulte [Plugins de canales](/es/plugins/sdk-channel-plugins) para conocer la disposición actual
    de las capacidades de aprobación.

  </Step>

  <Step title="Auditar el comportamiento de respaldo de los wrappers de Windows">
    Si su plugin usa `openclaw/plugin-sdk/windows-spawn`, los wrappers de Windows
    `.cmd`/`.bat` no resueltos ahora fallan de forma cerrada, a menos que se pase explícitamente
    `allowShellFallback: true`:

    ```typescript
    // Antes
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Después
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Establezca esto únicamente para invocadores de compatibilidad de confianza que acepten
      // deliberadamente el respaldo mediado por el shell.
      allowShellFallback: true,
    });
    ```

    Si el invocador no depende deliberadamente del respaldo del shell, no establezca
    `allowShellFallback` y gestione en su lugar el error lanzado.

  </Step>

  <Step title="Buscar importaciones obsoletas">
    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```
  </Step>

  <Step title="Reemplazar por importaciones específicas">
    Cada exportación de la superficie anterior corresponde a una ruta de importación moderna específica:

    ```typescript
    // Antes (capa de compatibilidad con versiones anteriores obsoleta)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Después (importaciones modernas específicas)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Para los auxiliares del lado del host, se debe usar el entorno de ejecución
    del plugin inyectado en lugar de importarlos directamente:

    ```typescript
    // Antes (puente extension-api obsoleto)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // Después (entorno de ejecución inyectado)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Se aplica el mismo patrón a otros auxiliares de puentes heredados:

    | Importación anterior | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | auxiliares del almacén de sesiones | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Sustituir las importaciones generales de infra-runtime">
    `openclaw/plugin-sdk/infra-runtime` sigue existiendo por compatibilidad
    externa, pero el código nuevo debe importar la superficie específica que
    realmente necesita:

    | Necesidad | Importación |
    | --- | --- |
    | Auxiliares de la cola de eventos del sistema | `openclaw/plugin-sdk/system-event-runtime` |
    | Auxiliares de activación, eventos y visibilidad de Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Vaciado de la cola de entregas pendientes | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetría de actividad del canal | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Cachés de deduplicación en memoria y con respaldo persistente | `openclaw/plugin-sdk/dedupe-runtime` |
    | Auxiliares seguros para rutas de archivos locales y contenido multimedia | `openclaw/plugin-sdk/file-access-runtime` |
    | Obtención compatible con el distribuidor | `openclaw/plugin-sdk/runtime-fetch` |
    | Auxiliares de obtención mediante proxy y con protecciones | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipos de políticas del distribuidor contra SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipos de solicitud y resolución de aprobaciones | `openclaw/plugin-sdk/approval-runtime` |
    | Auxiliares de comandos y carga útil de respuesta a aprobaciones | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Auxiliares de formato de errores | `openclaw/plugin-sdk/error-runtime` |
    | Esperas de disponibilidad del transporte | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Auxiliares para tokens seguros | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concurrencia limitada de tareas asíncronas | `openclaw/plugin-sdk/concurrency-runtime` |
    | Aserciones de valores obligatorios para invariantes demostrables | `openclaw/plugin-sdk/expect-runtime` |
    | Coerción numérica | `openclaw/plugin-sdk/number-runtime` |
    | Bloqueo asíncrono local del proceso | `openclaw/plugin-sdk/async-lock-runtime` |
    | Bloqueos de archivos | `openclaw/plugin-sdk/file-lock` |

    Los plugins incluidos están protegidos mediante un escáner contra
    `infra-runtime`, por lo que el código del repositorio no puede volver
    a utilizar este barril general.

  </Step>

  <Step title="Migrar los auxiliares de rutas de canales">
    El código nuevo de rutas de canales utiliza `openclaw/plugin-sdk/channel-route`. Los nombres
    anteriores de claves de ruta se mantienen como alias de compatibilidad:

    | Auxiliar anterior | Auxiliar moderno |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |

    Los auxiliares modernos de rutas normalizan `{ channel, to, accountId, threadId }`
    de forma coherente en las aprobaciones nativas, la supresión de respuestas,
    la deduplicación entrante, la entrega de Cron y el enrutamiento de sesiones.

    No se deben añadir nuevos usos de `ChannelMessagingAdapter.parseExplicitTarget` ni
    `resolveChannelRouteTargetWithParser(...)` desde
    `plugin-sdk/channel-route`; están obsoletos y solo se mantienen para plugins
    antiguos. Los plugins nuevos de canales deben usar
    `messaging.targetResolver.resolveTarget(...)` para normalizar el identificador de destino
    y recurrir a una alternativa cuando no se encuentre en el directorio,
    `messaging.inferTargetChatType(...)` cuando el núcleo necesite determinar anticipadamente
    el tipo de par, y `messaging.resolveOutboundSessionRoute(...)` para la identidad
    nativa del proveedor de sesiones e hilos.

  </Step>

  <Step title="Compilar y probar">
    ```bash
    pnpm build
    pnpm test my-plugin/
    ```
  </Step>
</Steps>

## Referencia de rutas de importación

El mapa de exportaciones públicas del paquete es la fuente de verdad para las
subrutas importables del SDK. Se deben usar las guías temáticas del SDK
enlazadas desde la [descripción general del SDK](/es/plugins/sdk-overview) y
preferir la subruta pública documentada más específica. El inventario del
compilador en `scripts/lib/plugin-sdk-entrypoints.json` también contiene entradas locales privadas
utilizadas para compilar los plugins incluidos; su presencia allí no las
convierte en exportaciones públicas del paquete.

Esta tabla contiene el subconjunto habitual de migración, no toda la superficie
del SDK. El inventario de puntos de entrada del compilador se encuentra en
`scripts/lib/plugin-sdk-entrypoints.json`; las exportaciones del paquete se generan a partir del
subconjunto público.

Las interfaces auxiliares reservadas para plugins incluidos se han retirado del
mapa de exportaciones públicas del SDK, salvo las fachadas de compatibilidad
documentadas explícitamente, como el adaptador obsoleto
`plugin-sdk/discord`, que se conserva para plugins externos que aún importan
directamente el paquete publicado `@openclaw/discord`. Los auxiliares
específicos de un propietario residen dentro del paquete del plugin
correspondiente; el comportamiento compartido del host se canaliza mediante
contratos genéricos del SDK, como `plugin-sdk/gateway-runtime`,
`plugin-sdk/security-runtime` y la API del plugin inyectada.

Se debe usar la importación más específica que corresponda a la tarea. Si no se
encuentra una exportación, se puede consultar el código fuente en
`src/plugin-sdk/` o preguntar a los mantenedores qué contrato genérico debe
hacerse cargo de ella.

## Superficies de compatibilidad eliminadas

La revisión de julio de 2026 eliminó los barriles raíz y de compatibilidad del
SDK, el puente de la API de extensiones, los alias vencidos de subrutas del SDK,
las subrutas del SDK sin uso y las exportaciones públicas de módulos del SDK
exclusivos de los plugins incluidos. Los módulos exclusivos de los plugins
incluidos siguen estando disponibles para sus propietarios dentro del
repositorio mediante asignaciones de compilación locales privadas; no pueden
importarse desde el paquete publicado.

### Publicación global del proceso de proveedores de API

`registerApiProvider(...)` y `unregisterApiProviders(...)` se eliminaron de
`openclaw/plugin-sdk/llm`. Publicaban transportes de API en el estado global del
proceso, que los entornos de ejecución de modelos gestionados por su ciclo de
vida debían copiar después en cada registro preparado.

Los plugins de proveedores deben registrar los proveedores de inferencia de
texto mediante `api.registerProvider(...)`. El código y las pruebas propiedad del host
que construyan un `ApiRegistry` deben registrarse directamente en ese
registro, para que la propiedad y el cierre del proveedor permanezcan limitados
al entorno de ejecución preparado.

### Barril privado de pruebas

`openclaw/plugin-sdk/testing` era local del repositorio y estaba excluido de los
artefactos distribuidos del paquete, por lo que se eliminó antes de su fecha
`removeAfter` del 2026-07-28. Las pruebas del repositorio utilizan
subrutas específicas como `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`,
`plugin-sdk/test-env` y `plugin-sdk/test-fixtures`.

## Referencia de migración

Estas correspondencias abarcan tanto las superficies eliminadas en julio de
2026 como las obsolescencias activas de ventanas posteriores. Una
correspondencia ofrece orientación para la migración, pero no demuestra que la
superficie anterior siga disponible; se deben consultar el registro de
compatibilidad y el calendario de eliminación para conocer su estado actual.

<AccordionGroup>
  <Accordion title="Generadores de ayuda de command-auth -> command-status">
    **Anterior (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nuevo (`openclaw/plugin-sdk/command-status`)**: las mismas firmas, importadas
    desde la subruta más específica. Se han eliminado las reexportaciones de
    compatibilidad de `command-auth`.

    ```typescript
    // Antes
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // Después
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Auxiliares de filtrado de menciones -> resolveInboundMentionDecision">
    **Anterior**: `resolveMentionGating(params)` y
    `resolveMentionGatingWithBypass(params)` de
    `openclaw/plugin-sdk/channel-inbound` o
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nuevo**: `resolveInboundMentionDecision({ facts, policy })`; un único objeto
    de decisión en lugar de dos formas de llamada separadas.

    Adoptado en Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal,
    Telegram, WhatsApp y Zalo. El modelo de eventos `app_mention` propio
    de Slack no utiliza este auxiliar.

  </Accordion>

  <Accordion title="Adaptador del entorno de ejecución de canales y auxiliares de acciones de canales">
    `openclaw/plugin-sdk/channel-runtime` se ha eliminado. Se debe usar
    `openclaw/plugin-sdk/channel-runtime-context` para registrar objetos del entorno
    de ejecución.

    Los auxiliares del esquema nativo de mensajes de `openclaw/plugin-sdk/channel-actions`
    se eliminaron junto con las exportaciones de acciones sin procesar de los
    canales. En su lugar, se deben exponer las capacidades mediante la
    superficie semántica `presentation`: los plugins de canales declaran
    qué representan (tarjetas, botones y selectores), no qué nombres de
    acciones sin procesar aceptan.

  </Accordion>

  <Accordion title="Auxiliar tool() del proveedor de búsqueda web -> createTool() en el plugin">
    **Anterior**: fábrica `tool()` de `openclaw/plugin-sdk/provider-web-search`.

    **Nuevo**: implementar `createTool(...)` directamente en el plugin del
    proveedor. OpenClaw ya no necesita el auxiliar del SDK para registrar el
    contenedor de la herramienta.

  </Accordion>

  <Accordion title="Envoltorios de canales en texto sin formato -> BodyForAgent">
    **Anterior**: `api.runtime.channel.reply.formatInboundEnvelope(...)` (y el campo
    `channelEnvelope` de los objetos de mensajes entrantes) para crear un
    envoltorio plano de instrucciones en texto sin formato a partir de mensajes
    entrantes de canales.

    **Nuevo**: `BodyForAgent` junto con bloques estructurados de contexto
    del usuario. Los plugins de canales adjuntan los metadatos de enrutamiento
    (hilo, tema, respuesta y reacciones) como campos tipados, en lugar de
    concatenarlos en una cadena de instrucciones. El auxiliar
    `formatAgentEnvelope(...)` sigue siendo compatible con los envoltorios sintetizados
    orientados al asistente, pero los envoltorios entrantes en texto sin formato
    se están retirando.

    Áreas afectadas: `inbound_claim`, `message_received` y cualquier plugin
    de canal personalizado que procesara posteriormente el texto del envoltorio
    anterior.

  </Accordion>

  <Accordion title="Enlace deactivate -> gateway_stop">
    **Anterior**: `api.on("deactivate", handler)`.

    **Nuevo**: `api.on("gateway_stop", handler)`. El contrato de limpieza
    durante el apagado es el mismo; solo cambia el nombre del enlace.

    ```typescript
    // Antes
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // Después
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` sigue conectado como alias de compatibilidad obsoleto hasta
    que se elimine después del 2026-08-16.

  </Accordion>

  <Accordion title="Enlace subagent_spawning -> vinculación de hilos del núcleo">
    **Anterior**: `api.on("subagent_spawning", handler)` devolvía
    `threadBindingReady` o `deliveryOrigin`.

    **Nuevo**: permitir que el núcleo prepare las vinculaciones de subagentes
    `thread: true` mediante el adaptador de vinculación de sesiones del
    canal. Se debe usar `api.on("subagent_spawned", handler)` únicamente para la observación
    posterior al inicio.

    ```typescript
    // Antes
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // Después
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`, `PluginHookSubagentSpawningEvent`,
    `PluginHookSubagentSpawningResult` y
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` se mantienen únicamente como
    superficies de compatibilidad obsoletas mientras migran los plugins
    externos; se eliminarán después del 2026-08-30.

  </Accordion>

  <Accordion title="Tipos de descubrimiento de proveedores -> tipos del catálogo de proveedores">
    Cuatro alias de tipos de descubrimiento son ahora contenedores ligeros de
    los tipos de la era del catálogo:

    | Alias anterior            | Tipo nuevo                |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Se han eliminado los alias y el contenedor estático heredado
    `ProviderCapabilities`. Los plugins de proveedores deben usar enlaces
    explícitos del proveedor, como `buildReplayPolicy`,
    `normalizeToolSchemas` y `wrapStreamFn`, en lugar de un objeto estático.

  </Accordion>

  <Accordion title="Enlaces de políticas de razonamiento -> resolveThinkingProfile">
    **Anterior** (tres enlaces independientes en `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` y
    `resolveDefaultThinkingLevel(ctx)`.

    **Nuevo**: un único `resolveThinkingProfile(ctx)` que devuelve un
    `ProviderThinkingProfile` con el `id` canónico, el `label` opcional y una
    lista de niveles ordenada por rango. OpenClaw reduce automáticamente los valores
    almacenados obsoletos según el rango del perfil.

    El contexto incluye `provider`, `modelId`, el `reasoning` combinado opcional
    y datos combinados opcionales del modelo en `compat`. Los plugins de proveedor pueden usar esos
    datos del catálogo para exponer un perfil específico del modelo solo cuando el contrato
    de solicitud configurado lo admita.

    Implemente un enlace en lugar de tres. Los enlaces heredados se han eliminado.

  </Accordion>

  <Accordion title="Proveedores de autenticación externos -> contracts.externalAuthProviders">
    **Anterior**: implementar enlaces de autenticación externa sin declarar el proveedor
    en el manifiesto del plugin.

    **Nuevo**: declare `contracts.externalAuthProviders` en el manifiesto del plugin
    **e** implemente `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Búsqueda de variables de entorno del proveedor -> setup.providers[].envVars">
    Campo de manifiesto **anterior**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nuevo**: replique la misma búsqueda de variables de entorno en `setup.providers[].envVars`
    en el manifiesto. Esto consolida los metadatos de entorno de configuración/estado en un solo lugar
    y evita iniciar el entorno de ejecución del plugin solo para responder a búsquedas de variables de entorno.

    `providerAuthEnvVars` ya no se acepta.

  </Accordion>

  <Accordion title="Registro del plugin de memoria -> registerMemoryCapability">
    **Anterior**: tres llamadas independientes: `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`, `api.registerMemoryRuntime(...)`.

    **Nuevo**: una llamada en la API del estado de memoria:
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Las mismas ranuras, una única llamada de registro. Los asistentes aditivos de indicaciones y corpus
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) no se
    ven afectados.

  </Accordion>

  <Accordion title="API del proveedor de incrustaciones de memoria">
    **Anterior**: `api.registerMemoryEmbeddingProvider(...)` más
    `contracts.memoryEmbeddingProviders`.

    **Nuevo**: `api.registerEmbeddingProvider(...)` más
    `contracts.embeddingProviders`.

    El contrato genérico del proveedor de incrustaciones se puede reutilizar fuera de la memoria y es
    la vía admitida para los proveedores nuevos. La API de registro específica de memoria
    se mantiene conectada como compatibilidad obsoleta mientras los proveedores existentes
    migran. La inspección de plugins informa del uso no incluido como deuda de
    compatibilidad.

  </Accordion>

  <Accordion title="Resultados de envío sin procesar del canal -> OutboundDeliveryResult">
    **Anterior**: devolver `{ ok, messageId, error }` mediante
    `ChannelSendRawResult` y normalizarlo con
    `createRawChannelSendResultAdapter(...)`.

    **Nuevo**: devuelva los campos de `OutboundDeliveryResult` y adjunte el canal con
    `createAttachedChannelResultAdapter(...)`. Los envíos fallidos deben generar una excepción
    en lugar de devolver una cadena de error. El tipo de resultado sin procesar seguirá disponible hasta
    la próxima versión principal del SDK de plugins.

  </Accordion>

  <Accordion title="Cambio de nombre de los tipos de mensajes de sesión de subagentes">
    Dos alias de tipo heredados que aún se exportan desde `src/plugins/runtime/types.ts`:

    | Anterior                      | Nuevo                           |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    El método de entorno de ejecución `readSession` está obsoleto en favor de
    `getSessionMessages`. La misma firma; el método anterior redirige la llamada al
    nuevo.

  </Accordion>

  <Accordion title="API eliminadas de archivos de sesión y transcripción">
    La transición de sesiones/transcripciones a SQLite elimina o marca como obsoletas las API orientadas a plugins
    que exponían almacenes `sessions.json` activos, rutas de transcripciones JSONL o listas
    de archivos de sesión. Los plugins de entorno de ejecución deben usar la identidad de sesión y los asistentes del entorno de ejecución
    del SDK en lugar de resolver o modificar archivos activos.

    | Superficie que se debe migrar | Sustitución |
    | ----------------- | ----------- |
    | `loadSessionStore(...)`, `updateSessionStore(...)` y `resolveSessionStoreEntry(...)` obsoletos | `getSessionEntry(...)`, `listSessionEntries(...)` y modificaciones de sesión a nivel de fila. |
    | `resolveSessionFilePath(...)` obsoleto | Identidad de sesión (`sessionKey`, `sessionId` y asistentes de destino del entorno de ejecución del SDK), además de métodos de Gateway que operan en la sesión actual. |
    | `saveSessionStore(...)` eliminado | API del entorno de ejecución de sesiones administradas por Gateway; el código del plugin debe solicitar o modificar el estado de sesión mediante los asistentes documentados del entorno de ejecución/contexto en lugar de escribir en el archivo de almacenamiento activo. |
    | `resolveSessionTranscriptPathInDir(...)` y `resolveAndPersistSessionFile(...)` eliminados | Identidad de sesión y métodos de Gateway que operan en la sesión actual. |
    | `readLatestAssistantTextFromSessionTranscript(...)` | Lectores de transcripciones respaldados por identidad expuestos por el contexto actual del entorno de ejecución, o métodos de historial/sesión de Gateway cuando el plugin se encuentra fuera de la ruta propietaria de la transcripción. |
    | `SessionTranscriptUpdate.sessionFile` | `SessionTranscriptUpdate.target` con `agentId`, `sessionKey` y `sessionId`. |
    | Entradas de sincronización de memoria como `sessionFiles` | Fuentes de transcripciones/sesiones respaldadas por identidad y proporcionadas por el host; no rastree archivos JSONL activos para sesiones en curso. |
    | Opciones del entorno de ejecución denominadas `transcriptPath` o `sessionFile` para sesiones activas | Objetos `sessionTarget`/de destino del entorno de ejecución que contienen una identidad de sesión independiente del almacenamiento. |

    Los archivos de transcripción JSONL heredados siguen siendo válidos como artefactos de importación, archivo, exportación y
    soporte. Ya no constituyen el contrato permanente del entorno de ejecución para
    las sesiones activas.

    Los plugins oficiales publicados con `v2026.7.1-beta.5` importaban los cuatro
    asistentes obsoletos anteriores. `openclaw/plugin-sdk/session-store-runtime` conserva
    exactamente ese puente hasta 2026-10-12; los plugins nuevos deben usar las sustituciones.
    `resolveStorePath(...)` sigue siendo un asistente del SDK compatible y no forma parte de
    esta obsolescencia.

    `openclaw plugins inspect --all --runtime` informa de los plugins no incluidos cuyos
    errores de carga o diagnósticos aún hacen referencia a estas API de archivos eliminadas. El
    análisis de avisos `@openclaw/plugin-inspector` debe usar la versión `0.3.17` o
    una posterior para que los análisis de paquetes externos también marquen los asistentes de sesión de almacén completo,
    los asistentes de rutas de archivos de sesión, los destinos de archivos de transcripción heredados y los asistentes
    de transcripción de bajo nivel antes de la publicación.

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **Anterior**: `runtime.tasks.flow` (singular) devolvía un descriptor activo
    de TaskFlow.

    **Nuevo**: `runtime.tasks.managedFlows` conserva el entorno de ejecución de modificación administrada de TaskFlow
    para los plugins que crean, actualizan, cancelan o ejecutan tareas secundarias desde un
    flujo. Use `runtime.tasks.flows` cuando el plugin solo necesite
    lecturas basadas en DTO.

    ```typescript
    // Antes
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // Después
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

    Los alias heredados se eliminaron en julio de 2026.

  </Accordion>

  <Accordion title="Factorías de extensiones integradas -> middleware de resultados de herramientas del agente">
    Se explica en [Cómo migrar](#how-to-migrate) más arriba. Se incluye aquí para
    completar la información: la ruta `api.registerEmbeddedExtensionFactory(...)` eliminada y exclusiva del ejecutor
    integrado se sustituye por `api.registerAgentToolResultMiddleware(...)` con una lista explícita de entornos de ejecución
    en `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType -> OpenClawConfig">
    Se eliminó el alias `OpenClawSchemaType` del SDK raíz. Use el nombre canónico
    `OpenClawConfig`.

    ```typescript
    // Antes
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // Después
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Las obsolescencias a nivel de extensión (dentro de los plugins de canal/proveedor incluidos en
`extensions/`) se registran en sus propios módulos de exportación `api.ts` y `runtime-api.ts`.
No afectan a los contratos de plugins de terceros y no se enumeran
aquí. Si se utiliza directamente el módulo de exportación local de un plugin incluido, consulte los
comentarios de obsolescencia de dicho módulo antes de actualizar.
</Note>

## Migración de Talk y voz en tiempo real

El código de voz en tiempo real, telefonía, reuniones y Talk en el navegador comparte un único controlador de
sesiones de Talk exportado por `openclaw/plugin-sdk/realtime-voice`. El
controlador administra el sobre común de eventos de Talk, el estado del turno activo, el estado de
captura, el estado del audio de salida, el historial de eventos recientes y el rechazo de turnos obsoletos.
Los plugins de proveedor administran las sesiones en tiempo real específicas de cada proveedor. Los plugins de reuniones
en el navegador usan `openclaw/plugin-sdk/meeting-runtime` para la mecánica de sesión, navegador, audio, host de Node,
consulta al agente y llamadas de voz, y luego implementan `MeetingPlatformAdapter`
para las reglas de URL, los scripts del DOM, la asignación de acciones manuales, los subtítulos, la creación y los planes
de acceso telefónico. Las API REST de la plataforma, OAuth, los artefactos, los selectores y los nombres del protocolo permanecen en
el plugin. Los planes de permisos del navegador reciben la URL solicitada de la reunión para que cada
plataforma pueda conceder únicamente sus orígenes compatibles exactos. Los entornos de ejecución de sesión también deben
normalizar el estado activo específico de la plataforma tras confirmar la salida del navegador;
los campos históricos de la transcripción pueden conservarse, pero la disponibilidad de subtítulos y audio no debe
permanecer activa después de salir.

Todas las superficies incluidas se ejecutan en el controlador compartido: retransmisión del navegador,
transferencia a sala administrada, llamadas de voz en tiempo real, STT de transmisión de llamadas de voz, Google
Meet en tiempo real y pulsar para hablar nativo. Gateway anuncia un único canal activo de eventos de Talk
en `hello-ok.features.events`: `talk.event`.

El código nuevo no debe llamar directamente a `createTalkEventSequencer(...)`, salvo que
implemente un adaptador de bajo nivel o un accesorio de prueba. Use el controlador compartido para que
no puedan emitirse eventos limitados al turno sin un identificador de turno, las llamadas obsoletas a `turnEnd` /
`turnCancel` no puedan borrar un turno activo más reciente y los eventos del ciclo de vida
del audio de salida se mantengan coherentes entre telefonía, reuniones, retransmisión del navegador,
transferencia a sala administrada y clientes nativos de Talk.

La forma de la API pública:

```typescript
// API de sesión de Talk administrada por Gateway.
await gateway.request("talk.session.create", {
  mode: "realtime",
  transport: "gateway-relay",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.session.appendAudio", { sessionId, audioBase64 });
await gateway.request("talk.session.cancelOutput", { sessionId, reason: "barge-in" });
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "working" },
  options: { willContinue: true },
});
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "already_delivered" },
  options: { suppressResponse: true },
});
await gateway.request("talk.session.submitToolResult", { sessionId, callId, result });
await gateway.request("talk.session.close", { sessionId });

// API de sesión del proveedor administrada por el cliente.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

Las sesiones WebRTC/websocket del proveedor administradas por el navegador usan `talk.client.create`,
porque el navegador administra la negociación con el proveedor y el transporte multimedia, mientras que
Gateway administra las credenciales, las instrucciones y la política de herramientas. `talk.session.*` es
la superficie común administrada por Gateway para las sesiones en tiempo real mediante retransmisión de Gateway, la
transcripción mediante retransmisión de Gateway y las sesiones STT/TTS nativas de salas administradas.

Las configuraciones heredadas que colocan selectores en tiempo real junto a `talk.provider` /
`talk.providers` deben repararse con `openclaw doctor --fix`; Talk en el entorno de ejecución
no reinterpreta la configuración del proveedor de voz/TTS como configuración del proveedor en tiempo real.

Las combinaciones compatibles con `talk.session.create` se han reducido intencionadamente:

| Modo            | Transporte       | Cerebro           | Responsable              | Notas                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Audio bidireccional del proveedor transmitido a través del Gateway; las llamadas a herramientas se enrutan mediante la herramienta de consulta al agente.           |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Solo STT en streaming; los llamantes envían audio de entrada y reciben eventos de transcripción.                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | Sala nativa/del cliente | Salas de pulsar para hablar y estilo walkie-talkie donde el cliente controla la captura/reproducción y el Gateway controla el estado del turno. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Sala nativa/del cliente | Modo de sala exclusivo para administradores destinado a superficies propias de confianza que ejecutan directamente acciones de herramientas del Gateway.                  |

Mapa de métodos para quienes migren desde las familias anteriores `talk.realtime.*` /
`talk.transcription.*` / `talk.handoff.*` (todas eliminadas):

| Anterior                         | Nuevo                                                    |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` o `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

El vocabulario de control unificado también es deliberadamente limitado:

| Método                          | Se aplica a                                             | Contrato                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Añade un fragmento de audio PCM en base64 a la sesión del proveedor que pertenece a la misma conexión del Gateway.                                                                                                                             |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Inicia un turno de usuario en una sala administrada.                                                                                                                                                                                           |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Finaliza el turno activo después de validar que no esté obsoleto.                                                                                                                                                                          |
| `talk.session.cancelTurn`       | todas las sesiones controladas por el Gateway           | Cancela las tareas activas de captura, proveedor, agente y TTS de un turno.                                                                                                                                                                 |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Detiene la salida de audio del asistente sin finalizar necesariamente el turno del usuario.                                                                                                                                                     |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Completa una llamada a una herramienta del proveedor después de cualquier finalización asíncrona expuesta por su puente; pasa `options.willContinue` para la salida provisional o, cuando sea compatible, `options.suppressResponse` para evitar otra respuesta del asistente. |
| `talk.session.steer`            | sesiones de Talk respaldadas por un agente              | Envía el control hablado `status`, `steer`, `cancel` o `followup` a la ejecución integrada activa resuelta desde la sesión de Talk.                                                                                                 |
| `talk.session.close`            | todas las sesiones unificadas                           | Detiene las sesiones de retransmisión o revoca el estado de la sala administrada y, después, olvida el identificador de sesión unificada.                                                                                                                                     |

No se deben introducir casos especiales de proveedores o plataformas en el núcleo para que esto funcione.
El núcleo controla la semántica de las sesiones de Talk. Los plugins de proveedores controlan la configuración de las sesiones de cada proveedor.
Voice-call y Google Meet controlan los adaptadores de telefonía y reuniones. El navegador y las aplicaciones
nativas controlan la experiencia de usuario de captura y reproducción del dispositivo.

## Cronología de eliminación

| Cuándo                                      | Qué sucede                                                                                                                               |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Ahora**                                   | Las superficies obsoletas que admiten advertencias emiten avisos en tiempo de ejecución; las protecciones del repositorio rechazan importaciones obsoletas del SDK desde el núcleo y los plugins incluidos. |
| **Fecha `removeAfter` de cada registro de compatibilidad** | Esa superficie específica pasa a ser apta para su eliminación; `pnpm plugins:boundary-report --fail-on-eligible-compat` hace que la Pipeline de CI falle una vez transcurrida la fecha.    |
| **Próxima versión principal**               | Se elimina cualquier superficie que aún no se haya migrado; los plugins que sigan utilizándola fallarán.                                                          |

Las subrutas públicas restantes del SDK que aparecen a continuación tienen plazos de eliminación respaldados por el registro.
Las filas del 30 de julio se eliminaron después de su revisión anticipada autorizada por los responsables:
se eliminaron las subrutas sin uso, se eliminaron los alias de compatibilidad anteriores y
los módulos exclusivos de los elementos incluidos se degradaron a asignaciones de compilación locales y privadas.

| `removeAfter` | Nivel                              | Subrutas del SDK                                                                                                                                                       |
| ------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2026-08-15`  | Obsolescencias de compatibilidad anteriores | `agent-config-primitives`, `channel-logging`, `channel-secret-runtime`, `channel-streaming`, `group-access`, `inbound-reply-dispatch`, `matrix`, `text-runtime`, `zod` |
| `2026-09-01`  | Obsolescencias de compatibilidad anteriores | `channel-lifecycle`, `channel-message`, `channel-reply-pipeline`, `config-runtime`, `infra-runtime`                                                                    |

Todos los plugins del núcleo ya se han migrado. Los plugins externos deben migrarse
antes de la próxima versión principal. Ejecuta `pnpm plugins:boundary-report` para consultar qué
registros de compatibilidad vencen antes para las superficies que utiliza tu plugin.

## Supresión temporal de las advertencias

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esta es una vía de escape temporal, no una solución permanente.

## Temas relacionados

- [Primeros pasos](/es/plugins/building-plugins) - crea tu primer plugin
- [Descripción general del SDK](/es/plugins/sdk-overview) - referencia completa de importación de subrutas
- [Plugins de canales](/es/plugins/sdk-channel-plugins) - creación de plugins de canales
- [Plugins de proveedores](/es/plugins/sdk-provider-plugins) - creación de plugins de proveedores
- [Aspectos internos de los plugins](/es/plugins/architecture) - análisis detallado de la arquitectura
- [Manifiesto del plugin](/es/plugins/manifest) - referencia del esquema del manifiesto
