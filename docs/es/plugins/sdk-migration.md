---
read_when:
    - Aparece la advertencia OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Se muestra la advertencia OPENCLAW_EXTENSION_API_DEPRECATED
    - Usó api.registerEmbeddedExtensionFactory antes de OpenClaw 2026.4.25
    - Está actualizando un plugin a la arquitectura moderna de plugins
    - Mantiene un plugin externo de OpenClaw
sidebarTitle: Migrate to SDK
summary: Migra de la capa heredada de compatibilidad con versiones anteriores al SDK de plugins moderno
title: Migración del SDK de plugins
x-i18n:
    generated_at: "2026-07-22T10:45:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d7604638f2954714c887f963d0155ee13cbb6d4ff74cdf3664fa4dc4ab2c5a77
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw sustituyó una amplia capa de compatibilidad con versiones anteriores por una arquitectura moderna de plugins
construida a partir de importaciones pequeñas y específicas. Si su plugin es anterior a ese
cambio, esta guía permite adaptarlo a los contratos actuales.

## Qué cambió

Varias superficies de importación muy abiertas permitían antes que los plugins accedieran a casi cualquier elemento
desde un único punto de entrada:

- **`openclaw/plugin-sdk`** y **`openclaw/plugin-sdk/compat`**: reexportaban
  decenas de utilidades mientras se desarrollaba el SDK específico. Ambas raíces se han
  eliminado; importe en su lugar una subruta documentada.
- **`openclaw/plugin-sdk/infra-runtime`**: un módulo de reexportación amplio que combinaba eventos
  del sistema, estado de Heartbeat, colas de entrega, utilidades de obtención/proxy, utilidades de archivos,
  tipos de aprobación y utilidades no relacionadas.
- **`openclaw/plugin-sdk/config-runtime`**: un módulo de reexportación amplio de configuración conservado
  únicamente durante su posterior período de compatibilidad; las utilidades directas de carga/escritura en tiempo de ejecución
  se han eliminado.
- **`openclaw/extension-api`**: un puente eliminado que proporcionaba a los plugins acceso directo
  a utilidades del lado del host, como el ejecutor de agentes integrado.
- **`api.registerEmbeddedExtensionFactory(...)`**: un enlace eliminado exclusivo del ejecutor integrado
  que observaba eventos del ejecutor integrado como `tool_result`. Use en su lugar
  middleware de resultados de herramientas del agente (consulte [Migrar extensiones de resultados de herramientas integradas
  a middleware](#how-to-migrate)).

Se han eliminado el SDK raíz, el módulo de reexportación de compatibilidad, el puente de extensiones y la fábrica de extensiones integradas.
`infra-runtime` y `config-runtime` se mantienen únicamente durante sus
períodos posteriores registrados por separado; los plugins nuevos deben usar subrutas específicas.

<Warning>
  Los plugins que importan las superficies raíz, de compatibilidad o de extensión eliminadas ya no
  se cargan. Siga las correspondencias que aparecen a continuación antes de actualizar.
</Warning>

OpenClaw no elimina ni reinterpreta el comportamiento documentado de los plugins en el mismo
cambio que introduce un reemplazo. Los cambios incompatibles en los contratos pasan primero por un
adaptador de compatibilidad, diagnósticos, documentación y un período de obsolescencia. Esto
se aplica a las importaciones del SDK, los campos del manifiesto, las API de configuración, los enlaces y el comportamiento
de registro en tiempo de ejecución.

### Motivos

- **Inicio lento**: importar una utilidad cargaba decenas de módulos no relacionados.
- **Dependencias circulares**: las reexportaciones amplias facilitaban la
  creación de ciclos de importación.
- **Superficie de API poco clara**: no había forma de distinguir las exportaciones estables de las internas.

Cada `openclaw/plugin-sdk/<subpath>` es ahora un módulo pequeño y autónomo con
un contrato documentado.

También se han eliminado las antiguas interfaces prácticas de proveedores para canales incluidos:
los accesos directos a utilidades con la marca del canal eran comodidades privadas del monorrepositorio, no
contratos estables para plugins. Use en su lugar subrutas genéricas y específicas del SDK. Dentro del
espacio de trabajo de plugins incluidos, mantenga las utilidades propiedad del proveedor en los propios
`api.ts` o `runtime-api.ts` de ese plugin:

- Anthropic mantiene las utilidades de flujo específicas de Claude en su propia interfaz `api.ts` /
  `contract-api.ts`.
- OpenAI mantiene los constructores de proveedores, las utilidades de modelos predeterminados y los constructores
  de proveedores en tiempo real en su propio `api.ts`.
- OpenRouter mantiene el constructor de proveedores y las utilidades de incorporación/configuración en su propio
  `api.ts`.

## Política de compatibilidad

El trabajo de compatibilidad para plugins externos sigue este orden:

1. Añadir el contrato nuevo.
2. Mantener el comportamiento anterior conectado mediante un adaptador de compatibilidad.
3. Emitir un diagnóstico o una advertencia que indique la ruta anterior y su reemplazo.
4. Cubrir ambas rutas en las pruebas.
5. Documentar la obsolescencia y la ruta de migración.
6. Eliminar únicamente después del período de migración anunciado, normalmente en una versión
   principal.

Si un campo del manifiesto sigue siendo aceptado, continúe usándolo hasta que la documentación y
los diagnósticos indiquen lo contrario. El código nuevo debe preferir el reemplazo documentado;
los plugins existentes no deben dejar de funcionar durante versiones secundarias ordinarias.

### Compatibilidad de campos de entrada de configuración de canales

`ChannelSetupInput` conserva ahora de forma permanente únicamente el contenedor de configuración común a todos los canales
con tipado. Los campos específicos de cada canal permanecen tipados en un nivel de compatibilidad
obsoleto para que los plugins externos existentes sigan compilando mientras sus autores trasladan esos
campos a tipos de entrada de configuración locales del plugin.

OpenClaw no publica versiones principales. Una revisión del registro realizada el 2026-07-22 inspeccionó
426 plugins de canales publicados fuera del árbol y eliminó 21 campos sin lectores.
Los 22 campos conservados tienen cada uno un lector publicado conocido. Cada campo adicional se
elimina en cuanto ningún plugin publicado lo lee; el conjunto conservado se reduce a medida que
los autores de plugins migran a tipos de entrada de configuración locales del plugin.

La misma revisión eliminó 23 claves heredadas de promoción de adaptadores no declaradas sin
dependientes publicados. Se mantienen seis claves comunes y la clave exclusiva de configuración `rooms`.
Ese conjunto también se reduce a medida que los plugins publicados declaran `singleAccountKeysToMove`.

El tipo compartido no tiene una signatura de índice. Las claves propiedad del plugin aún pueden estar presentes
en los objetos de entrada en tiempo de ejecución; declárelas en una intersección local del plugin o
restrínjalas mediante el esquema de configuración del plugin propietario.

| `code`                                  | `owner`   | `replacement`                                                                                    | Condición de eliminación                                               |
| --------------------------------------- | --------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `plugin-sdk-channel-setup-input-fields` | `channel` | Intersecar `ChannelSetupInput` con un tipo local del plugin que declare los campos del canal propietario | Eliminar un campo cuando la revisión del registro de plugins publicados no encuentre ningún lector |

El nivel heredado de promoción de adaptadores no declarados sigue la misma política basada en
lectores. Declare `singleAccountKeysToMove`, incluido un arreglo vacío cuando el
plugin no necesite claves de promoción adicionales, para poder retirar la alternativa compartida clave
por clave.

Este es únicamente un registro de compatibilidad de código fuente/tipos. No tiene ningún adaptador en tiempo de ejecución ni
entrada en el registro de compatibilidad porque los objetos de entrada de configuración en tiempo de ejecución y el comportamiento de
configuración no han cambiado.

Audite la cola de migración actual con `pnpm plugins:boundary-report`:

| Indicador                                               | Efecto                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--summary` (o `pnpm plugins:boundary-report:summary`) | Recuentos compactos en lugar de detalles completos.                            |
| `--json`                                                | Informe legible por máquinas.                                                  |
| `--owner <id>`                                          | Filtrar por un plugin o propietario de compatibilidad.                         |
| `--fail-on-cross-owner`                                 | Salir con un código distinto de cero ante importaciones reservadas del SDK entre propietarios. |
| `--fail-on-eligible-compat`                             | Salir con un código distinto de cero cuando haya pasado la fecha `removeAfter` de un registro de compatibilidad obsoleto. |
| `--fail-on-unclassified-unused-reserved`                | Salir con un código distinto de cero ante adaptadores reservados del SDK sin usar. |

`pnpm plugins:boundary-report:ci` se ejecuta con los tres indicadores de fallo. Cada
registro de compatibilidad tiene una fecha `removeAfter` explícita (no una vaga «próxima
versión principal»): el informe agrupa los registros obsoletos por esa fecha, cuenta
las referencias locales en código/documentación, muestra las importaciones reservadas del SDK entre propietarios y
resume el puente privado del SDK del host de memoria. Las subrutas reservadas del SDK deben tener
un uso registrado por parte del propietario; las exportaciones reservadas sin usar deben eliminarse del
SDK público.

## Cómo migrar

<Steps>
  <Step title="Migrar las utilidades de carga/escritura de configuración en tiempo de ejecución">
    Los plugins incluidos deben dejar de llamar directamente a `api.runtime.config.loadConfig()` y
    `api.runtime.config.writeConfigFile(...)`. Es preferible usar la configuración ya
    proporcionada a la ruta de llamada activa. Los controladores de larga duración que necesiten la
    instantánea actual del proceso pueden usar `api.runtime.config.current()`. Las herramientas de agente
    de larga duración deben leer `ctx.getRuntimeConfig()` dentro de `execute` para que una herramienta
    creada antes de una escritura de configuración siga viendo la configuración actualizada.

    Las escrituras de configuración pasan por la utilidad transaccional con una política explícita
    posterior a la escritura:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Use `afterWrite: { mode: "restart", reason: "..." }` cuando el cambio necesite
    un reinicio limpio del Gateway, y `afterWrite: { mode: "none", reason: "..." }`
    únicamente cuando quien realiza la llamada sea responsable del seguimiento y suprima deliberadamente el
    planificador de recarga. Los resultados de la mutación incluyen un resumen `followUp` con tipado para
    pruebas y registros; el Gateway sigue siendo responsable de aplicar o
    programar el reinicio.

    `loadConfig` y `writeConfigFile` se han eliminado del entorno de ejecución de
    plugins. Los plugins incluidos y el código del entorno de ejecución del repositorio están protegidos por
    `pnpm check:deprecated-api-usage` y
    `pnpm check:no-runtime-action-load-config`: el nuevo uso en plugins de producción
    falla directamente, las escrituras directas de configuración fallan, los métodos del servidor del Gateway deben usar
    la instantánea del entorno de ejecución de la solicitud, las utilidades de envío/acción/cliente de canales en tiempo de ejecución
    deben recibir la configuración desde su límite, y los módulos de larga duración del entorno de ejecución
    no permiten ninguna llamada ambiental a `loadConfig()`.

    El código nuevo de plugins debe evitar el módulo de reexportación amplio `openclaw/plugin-sdk/config-runtime`.
    Use la subruta específica correspondiente:

    | Necesidad | Importación |
    | --- | --- |
    | Tipos de configuración como `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Búsqueda de configuración en la entrada del plugin | `api.pluginConfig` |
    | Combinación de configuración | Lógica local del plugin en el límite de configuración |
    | Lecturas de la instantánea actual del entorno de ejecución | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Escrituras de configuración | `openclaw/plugin-sdk/config-mutation` |
    | Utilidades del almacén de sesiones | `openclaw/plugin-sdk/session-store-runtime` |
    | Configuración de tablas Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Utilidades en tiempo de ejecución de políticas de grupos | `openclaw/plugin-sdk/runtime-group-policy` |
    | Resolución de entradas secretas | `openclaw/plugin-sdk/secret-input-runtime` |
    | Sustituciones de modelos/sesiones | `openclaw/plugin-sdk/model-session-runtime` |

    Los plugins incluidos y sus pruebas están protegidos mediante análisis contra el módulo de reexportación
    amplio, para que las importaciones y las simulaciones permanezcan limitadas al comportamiento que necesitan. El
    módulo de reexportación sigue existiendo para la compatibilidad externa, pero el código nuevo no debe
    depender de él.

  </Step>

  <Step title="Migrar las extensiones de resultados de herramientas integradas a middleware">
    Los plugins incluidos deben sustituir los controladores de resultados de herramientas
    `api.registerEmbeddedExtensionFactory(...)` exclusivos del ejecutor integrado por
    middleware independiente del entorno de ejecución:

    ```typescript
    // Herramientas del entorno de ejecución de OpenClaw y herramientas dinámicas del entorno de ejecución de Codex (el resultado puede
    // transformarse). Los resultados de herramientas nativas de Codex también se retransmiten para su observación,
    // pero su salida transformada nunca llega al modelo: el contrato del enlace
    // PostToolUse de Codex no puede sustituir la respuesta de una herramienta nativa.
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

    Los plugins instalados también pueden registrar middleware de resultados de herramientas cuando esté explícitamente
    habilitado y todos los entornos de ejecución de destino estén declarados en
    `contracts.agentToolResultMiddleware`. Los registros de middleware instalados
    no declarados se rechazan.

  </Step>

  <Step title="Migrar los controladores nativos de aprobación a hechos de capacidad">
    Los plugins de canales con capacidad de aprobación exponen el comportamiento nativo de aprobación mediante
    `approvalCapability.nativeRuntime` junto con el registro compartido de contexto
    del entorno de ejecución:

    - Reemplace `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`.
    - Quite la autenticación y la entrega específicas de aprobaciones del cableado heredado de `plugin.auth` /
      `plugin.approvals` y páselas a `approvalCapability`.
    - `ChannelPlugin.approvals` se ha eliminado del contrato público
      de plugins de canal; mueva los campos de entrega, nativos y de renderización a
      `approvalCapability`.
    - `plugin.auth` se mantiene únicamente para los flujos de inicio y cierre de sesión del canal; el núcleo ya no
      lee allí los hooks de autenticación de aprobaciones.
    - Registre los objetos de tiempo de ejecución propiedad del canal (clientes, tokens y aplicaciones Bolt)
      mediante `openclaw/plugin-sdk/channel-runtime-context`.
    - No envíe avisos de redireccionamiento propiedad del plugin desde controladores de aprobación nativos;
      el núcleo controla los avisos de envío a otro destino a partir de los resultados reales de entrega.
    - Al pasar `channelRuntime` a `createChannelManager(...)`, proporcione una
      superficie `createPluginRuntime().channel` real; los stubs parciales se
      rechazan.

    Consulte [Plugins de canal](/es/plugins/sdk-channel-plugins) para ver la disposición actual
    de las capacidades de aprobación.

  </Step>

  <Step title="Auditar el comportamiento alternativo del contenedor de Windows">
    Si el plugin utiliza `openclaw/plugin-sdk/windows-spawn`, los contenedores de Windows
    `.cmd`/`.bat` no resueltos ahora producen un fallo cerrado, salvo que se pase explícitamente
    `allowShellFallback: true`:

    ```typescript
    // Antes
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Después
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Establezca esto únicamente para llamadores de compatibilidad de confianza que
      // acepten intencionadamente una alternativa mediada por el shell.
      allowShellFallback: true,
    });
    ```

    Si el llamador no depende intencionadamente de la alternativa del shell, no establezca
    `allowShellFallback` y gestione en su lugar el error generado.

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
    // Antes (capa obsoleta de compatibilidad con versiones anteriores)
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

    Para los auxiliares del lado del host, utilice el tiempo de ejecución del plugin inyectado en lugar de
    realizar una importación directa:

    ```typescript
    // Antes (puente extension-api obsoleto)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // Después (tiempo de ejecución inyectado)
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

  <Step title="Reemplazar importaciones generales de infra-runtime">
    `openclaw/plugin-sdk/infra-runtime` aún existe por motivos de compatibilidad
    externa, pero el código nuevo debe importar la superficie específica que realmente
    necesita:

    | Necesidad | Importación |
    | --- | --- |
    | Auxiliares de la cola de eventos del sistema | `openclaw/plugin-sdk/system-event-runtime` |
    | Auxiliares de activación, eventos y visibilidad de Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Vaciado de la cola de entregas pendientes | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetría de actividad del canal | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Cachés de desduplicación en memoria y respaldadas por almacenamiento persistente | `openclaw/plugin-sdk/dedupe-runtime` |
    | Auxiliares seguros de rutas de archivos y medios locales | `openclaw/plugin-sdk/file-access-runtime` |
    | Obtención con reconocimiento del despachador | `openclaw/plugin-sdk/runtime-fetch` |
    | Auxiliares de obtención mediante proxy y protegida | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipos de políticas del despachador de SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipos de solicitud y resolución de aprobaciones | `openclaw/plugin-sdk/approval-runtime` |
    | Auxiliares de cargas útiles de respuesta y comandos de aprobación | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Auxiliares de formato de errores | `openclaw/plugin-sdk/error-runtime` |
    | Esperas de disponibilidad del transporte | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Auxiliares de tokens seguros | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concurrencia limitada de tareas asíncronas | `openclaw/plugin-sdk/concurrency-runtime` |
    | Aserciones de valores obligatorios para invariantes demostrables | `openclaw/plugin-sdk/expect-runtime` |
    | Coerción numérica | `openclaw/plugin-sdk/number-runtime` |
    | Bloqueo asíncrono local del proceso | `openclaw/plugin-sdk/async-lock-runtime` |
    | Bloqueos de archivos | `openclaw/plugin-sdk/file-lock` |

    Los plugins incluidos están protegidos mediante análisis frente a `infra-runtime`, por lo que el código del repositorio
    no puede volver a utilizar el barrel general.

  </Step>

  <Step title="Migrar los auxiliares de rutas de canal">
    El código nuevo de rutas de canal utiliza `openclaw/plugin-sdk/channel-route`. Los nombres
    anteriores de claves de ruta se mantienen como alias de compatibilidad:

    | Auxiliar anterior | Auxiliar moderno |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |

    Los auxiliares modernos de rutas normalizan `{ channel, to, accountId, threadId }`
    de manera coherente en aprobaciones nativas, supresión de respuestas, desduplicación
    de entrada, entrega mediante cron y enrutamiento de sesiones.

    No añada usos nuevos de `ChannelMessagingAdapter.parseExplicitTarget` ni
    `resolveChannelRouteTargetWithParser(...)` desde
    `plugin-sdk/channel-route`; están obsoletos y se mantienen únicamente para plugins
    antiguos. Los plugins de canal nuevos deben utilizar
    `messaging.targetResolver.resolveTarget(...)` para normalizar el identificador
    de destino y como alternativa cuando no se encuentre el directorio,
    `messaging.inferTargetChatType(...)` cuando el núcleo necesite anticipadamente un tipo de par,
    y `messaging.resolveOutboundSessionRoute(...)` para la identidad nativa
    de sesión e hilo del proveedor.

  </Step>

  <Step title="Compilar y probar">
    ```bash
    pnpm build
    pnpm test my-plugin/
    ```
  </Step>
</Steps>

## Referencia de rutas de importación

El mapa público de exportaciones del paquete es la fuente de referencia para las subrutas
importables del SDK. Utilice las guías temáticas del SDK enlazadas desde la [descripción general del SDK](/es/plugins/sdk-overview)
y prefiera la subruta pública documentada más específica. El inventario del compilador de
`scripts/lib/plugin-sdk-entrypoints.json` también contiene entradas privadas locales utilizadas
para compilar plugins incluidos; su presencia allí no las convierte en exportaciones públicas del paquete.

Esta tabla es el subconjunto habitual de migración, no toda la superficie del SDK. El
inventario de puntos de entrada del compilador se encuentra en `scripts/lib/plugin-sdk-entrypoints.json`;
las exportaciones del paquete se generan a partir del subconjunto público.

Las interfaces auxiliares reservadas para plugins incluidos se han retirado del mapa público
de exportaciones del SDK, salvo las fachadas de compatibilidad documentadas explícitamente, como el
shim obsoleto `plugin-sdk/discord`, que se conserva para plugins externos que todavía
importan directamente el paquete publicado `@openclaw/discord`. Los auxiliares específicos
de cada propietario residen dentro del paquete del plugin correspondiente; el comportamiento compartido del host pasa
por contratos genéricos del SDK, como `plugin-sdk/gateway-runtime`,
`plugin-sdk/security-runtime` y la API del plugin inyectada.

Utilice la importación más específica que se ajuste a la tarea. Si no encuentra una exportación,
consulte el código fuente en `src/plugin-sdk/` o pregunte a los responsables qué contrato
genérico debe asumirla.

## Superficies de compatibilidad eliminadas

La revisión de julio de 2026 eliminó los barrels del SDK raíz y de compatibilidad, el puente de la API
de extensiones, los alias vencidos de subrutas del SDK, las subrutas del SDK sin uso y las exportaciones
públicas de módulos del SDK exclusivos de plugins incluidos. Los módulos exclusivos de plugins incluidos siguen estando disponibles
para sus propietarios en el repositorio mediante asignaciones privadas locales de compilación; no se pueden
importar desde el paquete publicado.

### Publicación global del proceso de proveedores de API

`registerApiProvider(...)` y `unregisterApiProviders(...)` se eliminaron de
`openclaw/plugin-sdk/llm`. Publicaban transportes de API en un estado global del
proceso, que los tiempos de ejecución de modelos controlados por el ciclo de vida debían copiar después en cada registro
preparado.

Los plugins de proveedores deben registrar proveedores de inferencia de texto mediante
`api.registerProvider(...)`. El código y las pruebas propiedad del host que construyan un
`ApiRegistry` deben registrarse directamente en ese registro para que la propiedad
y el desmontaje del proveedor queden limitados al tiempo de ejecución preparado.

### Barrel privado de pruebas

`openclaw/plugin-sdk/testing` era local del repositorio y estaba excluido de los artefactos
publicados del paquete, por lo que se eliminó antes de su fecha `removeAfter` del 2026-07-28. Las pruebas del repositorio
utilizan subrutas específicas como `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`,
`plugin-sdk/test-env` y `plugin-sdk/test-fixtures`.

## Referencia de migración

Estas correspondencias abarcan tanto las superficies eliminadas en julio de 2026 como las deprecaciones activas
de ventanas posteriores. Una correspondencia sirve como guía de migración, no como prueba de que la superficie
anterior siga disponible; consulte el registro de compatibilidad y el calendario de eliminación
para conocer su estado actual.

<AccordionGroup>
  <Accordion title="Generadores de ayuda de command-auth -> command-status">
    **Anterior (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nuevo (`openclaw/plugin-sdk/command-status`)**: las mismas firmas, importadas
    desde la subruta más específica. Las reexportaciones de compatibilidad `command-auth`
    se han eliminado.

    ```typescript
    // Antes
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // Después
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Auxiliares de control de menciones -> resolveInboundMentionDecision">
    **Anterior**: `resolveMentionGating(params)` y
    `resolveMentionGatingWithBypass(params)` desde
    `openclaw/plugin-sdk/channel-inbound` o
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nuevo**: `resolveInboundMentionDecision({ facts, policy })`; un único objeto
    de decisión en lugar de dos formas de llamada separadas.

    Adoptado en Discord, iMessage, Matrix, MS Teams, QQBot, Signal,
    Telegram, WhatsApp y Zalo. El modelo de eventos `app_mention` propio de Slack no
    utiliza este auxiliar.

  </Accordion>

  <Accordion title="Shim de tiempo de ejecución del canal y auxiliares de acciones del canal">
    `openclaw/plugin-sdk/channel-runtime` se ha eliminado. Utilice
    `openclaw/plugin-sdk/channel-runtime-context` para registrar objetos de tiempo de
    ejecución.

    Los auxiliares de esquemas de mensajes nativos de `openclaw/plugin-sdk/channel-actions`
    se eliminaron junto con las exportaciones de canal de "actions" sin procesar. Exponga las capacidades
    mediante la superficie semántica `presentation`; los plugins de canal
    declaran lo que renderizan (tarjetas, botones y selectores), no qué nombres de
    acciones sin procesar aceptan.

  </Accordion>

  <Accordion title="Auxiliar tool() del proveedor de búsqueda web -> createTool() en el plugin">
    **Anterior**: fábrica `tool()` de `openclaw/plugin-sdk/provider-web-search`.

    **Nuevo**: implemente `createTool(...)` directamente en el plugin del proveedor.
    OpenClaw ya no necesita el auxiliar del SDK para registrar el contenedor de la herramienta.

  </Accordion>

  <Accordion title="Envoltorios de canal de texto sin formato -> BodyForAgent">
    **Anterior**: `api.runtime.channel.reply.formatInboundEnvelope(...)` (y el
    campo `channelEnvelope` de los objetos de mensajes entrantes) para crear un envoltorio
    plano de instrucciones en texto sin formato a partir de mensajes entrantes del canal.

    **Nuevo**: `BodyForAgent` más bloques estructurados de contexto del usuario. Los plugins de
    canal adjuntan metadatos de enrutamiento (hilo, tema, respuesta a y reacciones) como
    campos tipados, en lugar de concatenarlos en una cadena de instrucciones. El auxiliar
    `formatAgentEnvelope(...)` sigue siendo compatible con envoltorios sintetizados
    orientados al asistente, pero los envoltorios entrantes de texto sin formato están en proceso
    de retirada.

    Áreas afectadas: `inbound_claim`, `message_received` y cualquier plugin
    de canal personalizado que aplicara posprocesamiento al texto del envoltorio anterior.

  </Accordion>

  <Accordion title="Hook deactivate -> gateway_stop">
    **Anterior**: `api.on("deactivate", handler)`.

    **Nuevo**: `api.on("gateway_stop", handler)`. El mismo contrato de limpieza
    durante el apagado; solo cambia el nombre del hook.

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

    `deactivate` permanece conectado como un alias de compatibilidad obsoleto hasta que se
    elimine después del 2026-08-16.

  </Accordion>

  <Accordion title="Hook subagent_spawning -> vinculación de hilos del núcleo">
    **Anterior**: `api.on("subagent_spawning", handler)` devolvía
    `threadBindingReady` o `deliveryOrigin`.

    **Nuevo**: permitir que el núcleo prepare las vinculaciones de subagentes `thread: true` mediante el
    adaptador de vinculación de sesiones del canal. Usar `api.on("subagent_spawned", handler)`
    solo para la observación posterior al lanzamiento.

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
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` permanecen únicamente como
    superficies de compatibilidad obsoletas mientras migran los plugins externos; se eliminarán
    después del 2026-08-30.

  </Accordion>

  <Accordion title="Tipos de detección de proveedores -> tipos del catálogo de proveedores">
    Cuatro alias de tipos de detección son ahora envoltorios ligeros de los tipos de
    la era del catálogo:

    | Alias anterior                 | Tipo nuevo                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Se han eliminado los alias y el contenedor estático heredado `ProviderCapabilities`.
    Los plugins de proveedores
    deben usar hooks de proveedor explícitos, como `buildReplayPolicy`,
    `normalizeToolSchemas` y `wrapStreamFn`, en lugar de un objeto estático.

  </Accordion>

  <Accordion title="Hooks de política de razonamiento -> resolveThinkingProfile">
    **Anterior** (tres hooks independientes en `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` y
    `resolveDefaultThinkingLevel(ctx)`.

    **Nuevo**: un único `resolveThinkingProfile(ctx)` que devuelve un
    `ProviderThinkingProfile` con el `id` canónico, un `label` opcional y una
    lista de niveles clasificada. OpenClaw reduce automáticamente los valores
    almacenados obsoletos según el rango del perfil.

    El contexto incluye `provider`, `modelId`, el `reasoning` combinado opcional
    y los datos combinados opcionales del modelo `compat`. Los plugins de proveedores pueden usar esos
    datos del catálogo para exponer un perfil específico del modelo solo cuando el
    contrato de solicitud configurado lo admita.

    Implementar un hook en lugar de tres. Los hooks heredados se han eliminado.

  </Accordion>

  <Accordion title="Proveedores de autenticación externos -> contracts.externalAuthProviders">
    **Anterior**: implementar hooks de autenticación externos sin declarar el proveedor
    en el manifiesto del plugin.

    **Nuevo**: declarar `contracts.externalAuthProviders` en el manifiesto del plugin
    **e** implementar `resolveExternalAuthProfiles(...)`.

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

    **Nuevo**: reflejar la misma búsqueda de variables de entorno en `setup.providers[].envVars`
    dentro del manifiesto. Esto consolida los metadatos de entorno de configuración/estado en un solo lugar
    y evita iniciar el entorno de ejecución del plugin únicamente para responder consultas de variables de entorno.

    `providerAuthEnvVars` ya no se acepta.

  </Accordion>

  <Accordion title="Registro del plugin de memoria -> registerMemoryCapability">
    **Anterior**: tres llamadas independientes: `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`, `api.registerMemoryRuntime(...)`.

    **Nuevo**: una llamada en la API de estado de memoria:
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Las mismas ranuras, una única llamada de registro. Los asistentes adicionales de instrucciones y corpus
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) no se ven
    afectados.

  </Accordion>

  <Accordion title="API del proveedor de incrustaciones de memoria">
    **Anterior**: `api.registerMemoryEmbeddingProvider(...)` junto con
    `contracts.memoryEmbeddingProviders`.

    **Nuevo**: `api.registerEmbeddingProvider(...)` junto con
    `contracts.embeddingProviders`.

    El contrato genérico del proveedor de incrustaciones se puede reutilizar fuera de la memoria y es
    la vía compatible para los proveedores nuevos. La API de registro específica de memoria
    permanece conectada como compatibilidad obsoleta mientras migran los proveedores
    existentes. La inspección de plugins informa del uso no incluido como
    deuda de compatibilidad.

  </Accordion>

  <Accordion title="Resultados de envío de canal sin procesar -> OutboundDeliveryResult">
    **Anterior**: devolver `{ ok, messageId, error }` mediante
    `ChannelSendRawResult` y normalizarlo con
    `createRawChannelSendResultAdapter(...)`.

    **Nuevo**: devolver los campos `OutboundDeliveryResult` y adjuntar el canal con
    `createAttachedChannelResultAdapter(...)`. Los envíos fallidos deben lanzar una excepción
    en lugar de devolver una cadena de error. El tipo de resultado sin procesar permanece disponible hasta
    la próxima versión principal del SDK de plugins.

  </Accordion>

  <Accordion title="Cambio de nombre de los tipos de mensajes de sesión de subagentes">
    Aún se exportan dos alias de tipos heredados desde `src/plugins/runtime/types.ts`:

    | Anterior                           | Nuevo                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    El método del entorno de ejecución `readSession` está obsoleto en favor de
    `getSessionMessages`. La misma firma; el método anterior redirige la llamada al
    nuevo.

  </Accordion>

  <Accordion title="APIs eliminadas de archivos de sesión y transcripción">
    La migración de sesiones/transcripciones a SQLite elimina o marca como obsoletas las API orientadas a plugins
    que exponían almacenes `sessions.json` activos, rutas de transcripciones JSONL o listas
    de archivos de sesión. Los plugins del entorno de ejecución deben usar la identidad de sesión y los asistentes
    del entorno de ejecución del SDK en lugar de resolver o modificar archivos activos.

    | Superficie en migración | Sustitución |
    | ----------------- | ----------- |
    | `loadSessionStore(...)`, `updateSessionStore(...)` y `resolveSessionStoreEntry(...)` obsoletos | `getSessionEntry(...)`, `listSessionEntries(...)` y mutaciones de sesión a nivel de fila. |
    | `resolveSessionFilePath(...)` obsoleto | Identidad de sesión (`sessionKey`, `sessionId` y asistentes de destino del entorno de ejecución del SDK), además de métodos de Gateway que operan sobre la sesión actual. |
    | `saveSessionStore(...)` eliminado | API del entorno de ejecución de sesiones propiedad de Gateway; el código del plugin debe solicitar o modificar el estado de sesión mediante los asistentes documentados del entorno de ejecución/contexto, en lugar de escribir en el archivo del almacén activo. |
    | `resolveSessionTranscriptPathInDir(...)` y `resolveAndPersistSessionFile(...)` eliminados | Identidad de sesión y métodos de Gateway que operan sobre la sesión actual. |
    | `readLatestAssistantTextFromSessionTranscript(...)` | Lectores de transcripciones respaldados por identidad que expone el contexto actual del entorno de ejecución, o métodos de historial/sesión de Gateway cuando el plugin se encuentra fuera de la ruta propietaria de la transcripción. |
    | `SessionTranscriptUpdate.sessionFile` | `SessionTranscriptUpdate.target` con `agentId`, `sessionKey` y `sessionId`. |
    | Entradas de sincronización de memoria, como `sessionFiles` | Orígenes de transcripción/sesión respaldados por identidad y proporcionados por el host; no rastrear archivos JSONL activos para sesiones en vivo. |
    | Opciones del entorno de ejecución denominadas `transcriptPath` o `sessionFile` para sesiones activas | Objetos `sessionTarget`/de destino del entorno de ejecución que contienen una identidad de sesión independiente del almacenamiento. |

    Los archivos de transcripción JSONL heredados siguen siendo válidos como artefactos de importación, archivo, exportación y
    soporte. Ya no constituyen el contrato del entorno de ejecución en estado estable para
    las sesiones activas.

    Los plugins oficiales publicados con `v2026.7.1-beta.5` importaban los cuatro
    asistentes obsoletos anteriores. `openclaw/plugin-sdk/session-store-runtime` conserva
    exactamente ese puente hasta el 2026-10-12; los plugins nuevos deben usar las sustituciones.
    `resolveStorePath(...)` sigue siendo un asistente compatible del SDK y no forma parte de
    esta obsolescencia.

    `openclaw plugins inspect --all --runtime` informa de plugins no incluidos cuyos
    errores de carga o diagnósticos aún hacen referencia a estas API de archivos eliminadas. El barrido
    de avisos de `@openclaw/plugin-inspector` debe usar la versión `0.3.17` o
    una posterior, para que los análisis de paquetes externos también marquen los asistentes de sesión
    del almacén completo, los asistentes de rutas de archivos de sesión, los destinos de archivos de
    transcripción heredados y los asistentes de transcripción de bajo nivel antes del lanzamiento.

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **Anterior**: `runtime.tasks.flow` (singular) devolvía un descriptor de acceso
    de flujo de tareas en vivo.

    **Nuevo**: `runtime.tasks.managedFlows` mantiene el entorno de ejecución de mutaciones administradas de TaskFlow
    para los plugins que crean, actualizan, cancelan o ejecutan tareas secundarias desde un
    flujo. Usar `runtime.tasks.flows` cuando el plugin solo necesite
    lecturas basadas en DTO.

    ```typescript
    // Antes
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // Después
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

    Los alias heredados se eliminaron en julio de 2026.

  </Accordion>

  <Accordion title="Fábricas de extensiones integradas -> middleware de resultados de herramientas del agente">
    Se aborda en [Cómo migrar](#how-to-migrate) más arriba. Se incluye aquí para
    completar la información: la ruta `api.registerEmbeddedExtensionFactory(...)`, exclusiva del ejecutor integrado y ya eliminada,
    se sustituye por `api.registerAgentToolResultMiddleware(...)` con una lista explícita de entornos de ejecución
    en `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType -> OpenClawConfig">
    Se eliminó el alias `OpenClawSchemaType` del SDK raíz. Usar el nombre canónico
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
Las obsolescencias en el nivel de las extensiones (dentro de los plugins de canales/proveedores incluidos en
`extensions/`) se registran en sus propios puntos de entrada `api.ts` y `runtime-api.ts`.
No afectan a los contratos de plugins de terceros y no se enumeran
aquí. Si se consume directamente el punto de entrada local de un plugin incluido, deben leerse los
comentarios de obsolescencia de ese punto de entrada antes de actualizar.
</Note>

## Migración de Talk y voz en tiempo real

El código de voz en tiempo real, telefonía, reuniones y Talk en el navegador comparte un único controlador de
sesiones de Talk exportado por `openclaw/plugin-sdk/realtime-voice`. El
controlador es responsable del sobre común de eventos de Talk, el estado del turno activo, el estado de
captura, el estado del audio de salida, el historial de eventos recientes y el rechazo de turnos obsoletos.
Los plugins de proveedores son responsables de las sesiones en tiempo real específicas de cada proveedor. Los plugins de reuniones en el navegador
usan `openclaw/plugin-sdk/meeting-runtime` para los mecanismos de sesión, navegador, audio, host de nodos,
consulta al agente y llamada de voz, y después implementan `MeetingPlatformAdapter`
para las reglas de URL, los scripts del DOM, la asignación de acciones manuales, los subtítulos, la creación y los planes
de acceso telefónico. Las API REST de la plataforma, OAuth, los artefactos, los selectores y los nombres del protocolo permanecen en
el plugin. Los planes de permisos del navegador reciben la URL de reunión solicitada para que cada
plataforma pueda conceder únicamente sus orígenes compatibles exactos. Los entornos de ejecución de las sesiones también deben
normalizar el estado de actividad en vivo específico de la plataforma después de confirmar la salida del navegador;
los campos históricos de la transcripción pueden permanecer, pero la disponibilidad de subtítulos y audio no debe
seguir activa después de salir.

Todas las superficies incluidas se ejecutan en el controlador compartido: retransmisión del navegador,
transferencia de salas administradas, tiempo real de llamadas de voz, STT de transmisión de llamadas de voz, tiempo real de Google
Meet y pulsar para hablar nativo. Gateway anuncia un único canal de eventos de Talk en vivo
en `hello-ok.features.events`: `talk.event`.

El código nuevo no debe llamar directamente a `createTalkEventSequencer(...)`, salvo que
implemente un adaptador de bajo nivel o un accesorio de prueba. Usar el controlador compartido para que
los eventos limitados al turno no puedan emitirse sin un identificador de turno, las llamadas obsoletas a `turnEnd` /
`turnCancel` no puedan borrar un turno activo más reciente y los eventos del ciclo de vida
del audio de salida se mantengan coherentes entre la telefonía, las reuniones, la retransmisión del navegador,
la transferencia de salas administradas y los clientes nativos de Talk.

La forma de la API pública:

```typescript
// API de sesión de Talk propiedad del Gateway.
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

// API de sesión del proveedor propiedad del cliente.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

Las sesiones WebRTC/websocket del proveedor controladas por el navegador usan `talk.client.create`,
porque el navegador controla la negociación con el proveedor y el transporte multimedia, mientras que el
Gateway controla las credenciales, las instrucciones y la política de herramientas. `talk.session.*` es
la superficie común administrada por el Gateway para sesiones en tiempo real mediante gateway-relay, transcripción mediante gateway-relay
y sesiones STT/TTS nativas de salas administradas.

Las configuraciones heredadas que colocan selectores en tiempo real junto a `talk.provider` /
`talk.providers` deben repararse con `openclaw doctor --fix`; Talk en tiempo de ejecución
no reinterpreta la configuración del proveedor de voz/TTS como configuración del proveedor en tiempo real.

Las combinaciones compatibles con `talk.session.create` son deliberadamente pocas:

| Modo            | Transporte       | Cerebro           | Propietario              | Notas                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Audio bidireccional simultáneo del proveedor transmitido a través del Gateway; las llamadas a herramientas se enrutan mediante la herramienta agent-consult.           |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Solo STT por streaming; los invocadores envían audio de entrada y reciben eventos de transcripción.                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | Sala nativa/del cliente | Salas de tipo pulsar para hablar y walkie-talkie en las que el cliente controla la captura/reproducción y el Gateway controla el estado del turno. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Sala nativa/del cliente | Modo de sala solo para administradores destinado a superficies propias de confianza que ejecutan directamente acciones de herramientas del Gateway.                  |

Mapa de métodos para quienes migran desde las familias anteriores `talk.realtime.*` /
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
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Añade un fragmento de audio PCM en base64 a la sesión del proveedor propiedad de la misma conexión del Gateway.                                                                                                                             |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Inicia un turno de usuario en una sala administrada.                                                                                                                                                                                           |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Finaliza el turno activo después de validar que el turno no esté obsoleto.                                                                                                                                                                          |
| `talk.session.cancelTurn`       | todas las sesiones propiedad del Gateway                | Cancela el trabajo activo de captura/proveedor/agente/TTS correspondiente a un turno.                                                                                                                                                                 |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Detiene la salida de audio del asistente sin finalizar necesariamente el turno del usuario.                                                                                                                                                     |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Completa una llamada a una herramienta del proveedor después de cualquier finalización asíncrona expuesta por su puente; pasa `options.willContinue` para una salida provisional o, cuando sea compatible, `options.suppressResponse` para evitar otra respuesta del asistente. |
| `talk.session.steer`            | sesiones de Talk respaldadas por agentes                | Envía el control hablado `status`, `steer`, `cancel` o `followup` a la ejecución integrada activa resuelta desde la sesión de Talk.                                                                                                 |
| `talk.session.close`            | todas las sesiones unificadas                           | Detiene las sesiones de retransmisión o revoca el estado de la sala administrada y, a continuación, olvida el identificador de sesión unificado.                                                                                                                                     |

No introduzca casos especiales de proveedores o plataformas en el núcleo para que esto funcione.
El núcleo controla la semántica de las sesiones de Talk. Los plugins de proveedores controlan la configuración de sesiones de cada proveedor.
Voice-call y Google Meet controlan los adaptadores de telefonía/reuniones. El navegador y las aplicaciones
nativas controlan la experiencia de usuario de captura/reproducción del dispositivo.

## Cronología de eliminación

| Cuándo                                      | Qué sucede                                                                                                                                |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Ahora**                                   | Las superficies obsoletas capaces de emitir advertencias generan advertencias en tiempo de ejecución; las protecciones del repositorio rechazan importaciones obsoletas del SDK desde el núcleo y los plugins incluidos. |
| **Fecha `removeAfter` de cada registro de compatibilidad** | Esa superficie específica puede eliminarse; `pnpm plugins:boundary-report --fail-on-eligible-compat` hace que la Pipeline de CI falle una vez pasada la fecha.    |
| **Próxima versión principal**               | Se elimina cualquier superficie que aún no se haya migrado; los plugins que todavía las utilicen fallarán.                                                          |

Las subrutas públicas restantes del SDK que aparecen a continuación tienen plazos de eliminación respaldados por el registro.
Las filas del 30 de julio se eliminaron tras su barrido anticipado autorizado por los mantenedores:
se eliminaron las subrutas sin uso, se eliminaron los alias de compatibilidad anteriores y
los módulos exclusivos de los paquetes incluidos se degradaron a asignaciones de compilación locales privadas.

| `removeAfter` | Nivel                              | Subrutas del SDK                                                                                                                                                        |
| ------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2026-08-15`  | Obsolescencias de compatibilidad anteriores | `agent-config-primitives`, `channel-logging`, `channel-secret-runtime`, `channel-streaming`, `group-access`, `inbound-reply-dispatch`, `matrix`, `text-runtime`, `zod` |
| `2026-09-01`  | Obsolescencias de compatibilidad anteriores | `channel-lifecycle`, `channel-message`, `channel-reply-pipeline`, `config-runtime`, `infra-runtime`                                                                    |

Todos los plugins del núcleo ya se han migrado. Los plugins externos deben migrarse
antes de la próxima versión principal. Ejecute `pnpm plugins:boundary-report` para consultar qué
registros de compatibilidad vencerán antes para las superficies que utiliza el plugin.

## Supresión temporal de las advertencias

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esta es una vía de escape temporal, no una solución permanente.

## Contenido relacionado

- [Primeros pasos](/es/plugins/building-plugins) - cree su primer plugin
- [Descripción general del SDK](/es/plugins/sdk-overview) - referencia completa de importación de subrutas
- [Plugins de canales](/es/plugins/sdk-channel-plugins) - creación de plugins de canales
- [Plugins de proveedores](/es/plugins/sdk-provider-plugins) - creación de plugins de proveedores
- [Funcionamiento interno de los plugins](/es/plugins/architecture) - análisis detallado de la arquitectura
- [Manifiesto del plugin](/es/plugins/manifest) - referencia del esquema del manifiesto
