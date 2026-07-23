---
read_when:
    - Ve la advertencia OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Aparece la advertencia OPENCLAW_EXTENSION_API_DEPRECATED
    - Usaste api.registerEmbeddedExtensionFactory antes de OpenClaw 2026.4.25
    - Está actualizando un plugin a la arquitectura moderna de plugins
    - Mantiene un plugin externo de OpenClaw
sidebarTitle: Migrate to SDK
summary: Migra de la capa heredada de compatibilidad con versiones anteriores al SDK moderno de plugins
title: Migración del SDK de Plugin
x-i18n:
    generated_at: "2026-07-22T20:05:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 81ea0665078587a699b362cde6510fdcaa1d3ac238ebda73866fd5b6eb3a8edb
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw sustituyó una amplia capa de compatibilidad con versiones anteriores por una arquitectura moderna de plugins
construida a partir de importaciones pequeñas y específicas. Si su plugin es anterior a ese
cambio, esta guía permite adaptarlo a los contratos actuales.

## Qué cambió

Varias superficies de importación excesivamente abiertas permitían anteriormente que los plugins accedieran a casi cualquier cosa
desde un único punto de entrada:

- **`openclaw/plugin-sdk`** y **`openclaw/plugin-sdk/compat`**: reexportaban
  decenas de funciones auxiliares mientras se desarrollaba el SDK específico. Ambas raíces se han
  eliminado; importe en su lugar una subruta documentada.
- **`openclaw/plugin-sdk/infra-runtime`**: un módulo de reexportación amplio que combinaba eventos del
  sistema, estado de Heartbeat, colas de entrega, funciones auxiliares de obtención/proxy, funciones auxiliares de archivos,
  tipos de aprobación y utilidades no relacionadas.
- **`openclaw/plugin-sdk/config-runtime`**: un módulo de reexportación amplio de configuración conservado
  únicamente durante su ventana de compatibilidad posterior; se han eliminado las funciones auxiliares directas
  de carga/escritura en tiempo de ejecución.
- **`openclaw/extension-api`**: un puente eliminado que proporcionaba a los plugins acceso directo
  a funciones auxiliares del host, como el ejecutor de agentes integrado.
- **`api.registerEmbeddedExtensionFactory(...)`**: un enlace eliminado exclusivo del ejecutor
  integrado que observaba eventos de este, como `tool_result`. Utilice en su lugar
  middleware de resultados de herramientas del agente (consulte [Migrar extensiones de resultados de herramientas integradas
  a middleware](#how-to-migrate)).

Se han eliminado el SDK raíz, el módulo de reexportación de compatibilidad, el puente de extensiones y la fábrica de extensiones
integradas. `infra-runtime` y `config-runtime` permanecen únicamente durante sus
ventanas posteriores registradas por separado; los plugins nuevos deben utilizar subrutas específicas.

<Warning>
  Los plugins que importan las superficies raíz, de compatibilidad o de extensiones eliminadas ya no
  se cargan. Siga las correspondencias siguientes antes de actualizar.
</Warning>

OpenClaw no elimina ni reinterpreta el comportamiento documentado de los plugins en el mismo
cambio que introduce un reemplazo. Los cambios incompatibles de contratos pasan primero por
un adaptador de compatibilidad, diagnósticos, documentación y una ventana de desuso. Esto
se aplica a las importaciones del SDK, los campos del manifiesto, las API de configuración, los enlaces y el comportamiento
de registro en tiempo de ejecución.

### Motivos

- **Inicio lento**: importar una función auxiliar cargaba decenas de módulos no relacionados.
- **Dependencias circulares**: las reexportaciones amplias facilitaban la creación
  de ciclos de importación.
- **Superficie de API poco clara**: no había forma de distinguir las exportaciones estables de las internas.

Cada `openclaw/plugin-sdk/<subpath>` es ahora un módulo pequeño y autónomo con
un contrato documentado.

También se han eliminado las antiguas interfaces auxiliares de proveedores para canales incluidos:
los accesos directos a funciones auxiliares vinculados a canales eran utilidades privadas del monorrepositorio, no
contratos estables para plugins. Utilice en su lugar subrutas genéricas y específicas del SDK. Dentro del
espacio de trabajo de plugins incluidos, mantenga las funciones auxiliares propiedad del proveedor en el
`api.ts` o `runtime-api.ts` del propio plugin:

- Anthropic mantiene las funciones auxiliares de flujo específicas de Claude en su propia interfaz `api.ts` /
  `contract-api.ts`.
- OpenAI mantiene los constructores de proveedores, las funciones auxiliares del modelo predeterminado y los constructores
  de proveedores en tiempo real en su propio `api.ts`.
- OpenRouter mantiene el constructor de proveedores y las funciones auxiliares de incorporación/configuración en su propio
  `api.ts`.

## Política de compatibilidad

El trabajo de compatibilidad de plugins externos sigue este orden:

1. Añadir el contrato nuevo.
2. Mantener el comportamiento anterior conectado mediante un adaptador de compatibilidad.
3. Emitir un diagnóstico o una advertencia que indique la ruta anterior y su reemplazo.
4. Cubrir ambas rutas en las pruebas.
5. Documentar el desuso y la ruta de migración.
6. Eliminar únicamente después de la ventana de migración anunciada, normalmente en una versión
   principal.

Si todavía se acepta un campo del manifiesto, continúe utilizándolo hasta que la documentación y
los diagnósticos indiquen lo contrario. El código nuevo debe preferir el reemplazo documentado;
los plugins existentes no deben dejar de funcionar durante versiones secundarias ordinarias.

### Compatibilidad de campos de entrada de configuración de canales

`ChannelSetupInput` ahora mantiene tipado permanentemente solo el contenedor de configuración
común a todos los canales. Los campos específicos de cada canal permanecen tipados en un nivel de compatibilidad
obsoleto para que los plugins externos existentes sigan compilando mientras sus autores trasladan esos
campos a tipos de entrada de configuración locales del plugin.

OpenClaw no publica versiones principales. Una revisión del registro realizada el 2026-07-22 inspeccionó
426 plugins de canales publicados fuera del árbol y eliminó 21 campos sin lectores.
Cada uno de los 22 campos conservados tiene un lector publicado conocido. Cada campo adicional se
elimina en cuanto ningún plugin publicado lo lee; el conjunto conservado se reduce a medida que
los autores migran a tipos de entrada de configuración locales del plugin.

La misma revisión eliminó 23 claves heredadas de promoción de adaptadores no declarados sin
dependientes publicados. Se mantienen seis claves comunes y la clave `rooms`, exclusiva de la configuración.
Ese conjunto también se reduce a medida que los plugins publicados declaran `singleAccountKeysToMove`.

El tipo compartido no tiene firma de índice. Las claves propiedad del plugin pueden seguir presentes
en los objetos de entrada en tiempo de ejecución; declárelas en una intersección local del plugin o
restrínjalas mediante el esquema de configuración del plugin propietario.

| `code`                                  | `owner`   | `replacement`                                                                                    | Condición de eliminación                                               |
| --------------------------------------- | --------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `plugin-sdk-channel-setup-input-fields` | `channel` | Intersecar `ChannelSetupInput` con un tipo local del plugin que declare los campos del canal propietario | Eliminar un campo cuando la revisión del registro de plugins publicados no encuentre ningún lector |

El nivel heredado de promoción de adaptadores no declarados sigue la misma política
basada en lectores. Declare `singleAccountKeysToMove`, incluido un arreglo vacío cuando el
plugin no necesite claves de promoción adicionales, para poder retirar la alternativa compartida una
clave a la vez.

#### Verificación de lectores

1. Recorra por páginas `https://clawhub.ai/api/v1/packages?family=code-plugin&limit=100` con cada `nextCursor` y conserve los paquetes cuyos `categories` incluyan `channels`.
2. Añada candidatos de npm desde `npm search --json --searchlimit=1000 "openclaw channel plugin"`. Añada candidatos disponibles solo como código fuente mediante búsquedas de código en GitHub de `openclaw/plugin-sdk/channel-setup`, `openclaw/plugin-sdk/setup` y `openclaw/plugin-sdk/core`.
3. Determine la última versión publicada de cada candidato. Ejecute `npm pack <package>@<version> --json --pack-destination <temp-dir>`, desempaquételo e inspeccione el JavaScript y las declaraciones distribuidos en `dist` para detectar lecturas directas o desestructuradas de campos. Descargue el artefacto de ClawHub cuando un paquete no tenga una versión en npm.
4. Registre el paquete, la versión, el campo o la clave de promoción y el archivo coincidente. Un campo o una clave solo puede eliminarse cuando ningún artefacto publicado de plugin lo lea. Mantenga sincronizados con la revisión los nombres de los lectores en los comentarios del código situados junto a las listas de campos y claves conservados.

Este es únicamente un registro de compatibilidad de código fuente/tipos. No tiene adaptador en tiempo de ejecución ni
entrada en el registro de compatibilidad porque los objetos de entrada de configuración y el comportamiento
de configuración en tiempo de ejecución no han cambiado.

Audite la cola de migración actual con `pnpm plugins:boundary-report`:

| Indicador                                               | Efecto                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--summary` (o `pnpm plugins:boundary-report:summary`) | Recuentos compactos en lugar de detalles completos.                            |
| `--json`                                                | Informe legible por máquinas.                                                  |
| `--owner <id>`                                          | Filtrar por un plugin o propietario de compatibilidad.                         |
| `--fail-on-cross-owner`                                 | Finalizar con un código distinto de cero ante importaciones reservadas del SDK entre propietarios. |
| `--fail-on-eligible-compat`                             | Finalizar con un código distinto de cero cuando haya pasado la fecha `removeAfter` de un registro de compatibilidad obsoleto. |
| `--fail-on-unclassified-unused-reserved`                | Finalizar con un código distinto de cero ante adaptadores reservados del SDK sin usar. |

`pnpm plugins:boundary-report:ci` se ejecuta con los tres indicadores de fallo. Cada
registro de compatibilidad tiene una fecha `removeAfter` explícita (no una vaga «próxima
versión principal»): el informe agrupa los registros obsoletos por esa fecha, contabiliza
las referencias locales de código/documentación, muestra las importaciones reservadas del SDK entre propietarios y
resume el puente privado del SDK del host de memoria. Las subrutas reservadas del SDK deben tener
un uso registrado por parte de su propietario; las exportaciones reservadas sin usar deben eliminarse del SDK
público.

## Cómo migrar

<Steps>
  <Step title="Migrar las funciones auxiliares de carga/escritura de la configuración en tiempo de ejecución">
    Los plugins incluidos deben dejar de llamar directamente a `api.runtime.config.loadConfig()` y
    `api.runtime.config.writeConfigFile(...)`. Es preferible utilizar la configuración ya
    proporcionada a la ruta de llamada activa. Los controladores de larga duración que necesiten la
    instantánea actual del proceso pueden utilizar `api.runtime.config.current()`. Las herramientas de agente
    de larga duración deben leer `ctx.getRuntimeConfig()` dentro de `execute` para que una herramienta
    creada antes de escribir una configuración siga viendo la configuración actualizada.

    Las escrituras de configuración pasan por la función auxiliar transaccional con una política explícita
    posterior a la escritura:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Utilice `afterWrite: { mode: "restart", reason: "..." }` cuando el cambio necesite
    un reinicio limpio del Gateway, y `afterWrite: { mode: "none", reason: "..." }`
    solo cuando el invocador sea responsable del seguimiento y suprima deliberadamente el
    planificador de recarga. Los resultados de la mutación incluyen un resumen `followUp` tipado para
    pruebas y registro; el Gateway sigue siendo responsable de aplicar o
    programar el reinicio.

    `loadConfig` y `writeConfigFile` se han eliminado del tiempo de ejecución de plugins.
    Los plugins incluidos y el código en tiempo de ejecución del repositorio están protegidos mediante
    `pnpm check:deprecated-api-usage` y
    `pnpm check:no-runtime-action-load-config`: el nuevo uso en plugins de producción
    falla por completo, las escrituras directas de configuración fallan, los métodos del servidor Gateway deben utilizar
    la instantánea en tiempo de ejecución de la solicitud, las funciones auxiliares de envío/acción/cliente de canales en tiempo de ejecución
    deben recibir la configuración desde su límite y los módulos de larga duración en tiempo de ejecución
    no permiten ninguna llamada ambiental a `loadConfig()`.

    El código nuevo de plugins debe evitar el módulo de reexportación amplio `openclaw/plugin-sdk/config-runtime`.
    Utilice la subruta específica para cada tarea:

    | Necesidad | Importación |
    | --- | --- |
    | Tipos de configuración como `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Búsqueda de configuración en la entrada del plugin | `api.pluginConfig` |
    | Combinación de configuraciones | Lógica local del plugin en el límite de configuración |
    | Lecturas de la instantánea actual en tiempo de ejecución | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Escrituras de configuración | `openclaw/plugin-sdk/config-mutation` |
    | Funciones auxiliares del almacén de sesiones | `openclaw/plugin-sdk/session-store-runtime` |
    | Configuración de tablas Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Funciones auxiliares de políticas de grupos en tiempo de ejecución | `openclaw/plugin-sdk/runtime-group-policy` |
    | Resolución de entradas secretas | `openclaw/plugin-sdk/secret-input-runtime` |
    | Sustituciones de modelo/sesión | `openclaw/plugin-sdk/model-session-runtime` |

    Los plugins incluidos y sus pruebas están protegidos mediante escáneres contra el módulo de reexportación
    amplio para que las importaciones y los simulacros permanezcan limitados al comportamiento que necesitan. El
    módulo de reexportación sigue existiendo para la compatibilidad externa, pero el código nuevo no debe
    depender de él.

  </Step>

  <Step title="Migrar extensiones de resultados de herramientas integradas a middleware">
    Los plugins incluidos deben reemplazar los controladores de resultados de herramientas
    `api.registerEmbeddedExtensionFactory(...)`, exclusivos del ejecutor integrado, por
    middleware independiente del tiempo de ejecución:

    ```typescript
    // Herramientas en tiempo de ejecución de OpenClaw y herramientas dinámicas en tiempo de ejecución de Codex (el resultado puede
    // transformarse). Los resultados de herramientas nativas de Codex también se retransmiten para su observación,
    // pero su salida transformada nunca llega al modelo: el contrato del enlace
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

    Los plugins instalados también pueden registrar middleware de resultados de herramientas cuando se habilita
    explícitamente y cada runtime de destino se declara en
    `contracts.agentToolResultMiddleware`. Se rechazan los registros de middleware
    instalado no declarado.

  </Step>

  <Step title="Migrar los controladores nativos de aprobación a datos de capacidades">
    Los plugins de canal con capacidad de aprobación exponen el comportamiento nativo de aprobación mediante
    `approvalCapability.nativeRuntime` junto con el registro compartido de contexto del
    runtime:

    - Sustituya `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`.
    - Traslade la autenticación y la entrega específicas de aprobaciones fuera del cableado heredado de `plugin.auth` /
      `plugin.approvals` y a `approvalCapability`.
    - `ChannelPlugin.approvals` se ha eliminado del contrato público
      de plugins de canal; traslade los campos de entrega, nativos y de renderizado a
      `approvalCapability`.
    - `plugin.auth` se mantiene únicamente para los flujos de inicio y cierre de sesión del canal; el núcleo ya no
      lee allí los hooks de autenticación de aprobaciones.
    - Registre los objetos del runtime propiedad del canal (clientes, tokens, aplicaciones Bolt)
      mediante `openclaw/plugin-sdk/channel-runtime-context`.
    - No envíe avisos de redireccionamiento propiedad del plugin desde controladores nativos de aprobación;
      el núcleo gestiona los avisos de enrutamiento a otro lugar a partir de los resultados reales de entrega.
    - Al pasar `channelRuntime` a `createChannelManager(...)`, proporcione una
      superficie `createPluginRuntime().channel` real; se rechazan los
      stubs parciales.

    Consulte [Plugins de canal](/es/plugins/sdk-channel-plugins) para ver la disposición actual
    de las capacidades de aprobación.

  </Step>

  <Step title="Auditar el comportamiento alternativo de los wrappers de Windows">
    Si el plugin utiliza `openclaw/plugin-sdk/windows-spawn`, los wrappers de Windows
    `.cmd`/`.bat` no resueltos ahora bloquean de forma segura, salvo que se pase explícitamente
    `allowShellFallback: true`:

    ```typescript
    // Antes
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Después
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Establezca esto únicamente para llamadores de compatibilidad de confianza que acepten
      // intencionadamente una alternativa mediada por el shell.
      allowShellFallback: true,
    });
    ```

    Si el llamador no depende intencionadamente de la alternativa mediante shell, no establezca
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

  <Step title="Sustituirlas por importaciones específicas">
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

    Para los auxiliares del lado del host, utilice el runtime del plugin inyectado en lugar de
    importarlos directamente:

    ```typescript
    // Antes (puente extension-api obsoleto)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // Después (runtime inyectado)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    El mismo patrón se aplica a otros auxiliares del puente heredado:

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
    `openclaw/plugin-sdk/infra-runtime` sigue existiendo para la
    compatibilidad externa, pero el código nuevo debe importar la superficie específica que realmente
    necesite:

    | Necesidad | Importación |
    | --- | --- |
    | Auxiliares de la cola de eventos del sistema | `openclaw/plugin-sdk/system-event-runtime` |
    | Auxiliares de activación, eventos y visibilidad de Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Vaciado de la cola de entregas pendientes | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetría de actividad del canal | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Cachés de deduplicación en memoria y respaldadas por almacenamiento persistente | `openclaw/plugin-sdk/dedupe-runtime` |
    | Auxiliares seguros para rutas de archivos locales y medios | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch compatible con dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Auxiliares de proxy y fetch protegido | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipos de políticas del dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipos de solicitud y resolución de aprobaciones | `openclaw/plugin-sdk/approval-runtime` |
    | Auxiliares de comandos y carga útil de respuestas de aprobación | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Auxiliares de formato de errores | `openclaw/plugin-sdk/error-runtime` |
    | Esperas de disponibilidad del transporte | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Auxiliares de tokens seguros | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concurrencia limitada de tareas asíncronas | `openclaw/plugin-sdk/concurrency-runtime` |
    | Aserciones de valores obligatorios para invariantes demostrables | `openclaw/plugin-sdk/expect-runtime` |
    | Coerción numérica | `openclaw/plugin-sdk/number-runtime` |
    | Bloqueo asíncrono local del proceso | `openclaw/plugin-sdk/async-lock-runtime` |
    | Bloqueos de archivos | `openclaw/plugin-sdk/file-lock` |

    Los plugins incluidos están protegidos mediante análisis contra `infra-runtime`, por lo que el código del repositorio
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
    de forma coherente en las aprobaciones nativas, la supresión de respuestas, la deduplicación de entradas,
    la entrega de cron y el enrutamiento de sesiones.

    No añada usos nuevos de `ChannelMessagingAdapter.parseExplicitTarget` ni
    `resolveChannelRouteTargetWithParser(...)` desde
    `plugin-sdk/channel-route`; están obsoletos y se mantienen únicamente para plugins
    antiguos. Los plugins de canal nuevos deben utilizar
    `messaging.targetResolver.resolveTarget(...)` para normalizar el identificador de destino
    y como alternativa cuando no se encuentra en el directorio,
    `messaging.inferTargetChatType(...)` cuando el núcleo necesita determinar pronto el tipo de par,
    y `messaging.resolveOutboundSessionRoute(...)` para la identidad de sesiones
    e hilos nativa del proveedor.

  </Step>

  <Step title="Compilar y probar">
    ```bash
    pnpm build
    pnpm test my-plugin/
    ```
  </Step>
</Steps>

## Referencia de rutas de importación

El mapa público de exportaciones del paquete es la fuente de verdad para las subrutas
importables del SDK. Utilice las guías temáticas del SDK enlazadas desde la [descripción general del SDK](/es/plugins/sdk-overview)
y prefiera la subruta pública documentada más específica. El inventario del compilador en
`scripts/lib/plugin-sdk-entrypoints.json` también contiene entradas locales privadas utilizadas
para compilar los plugins incluidos; su presencia allí no las convierte en exportaciones públicas del paquete.

Esta tabla contiene el subconjunto de migración común, no toda la superficie del SDK. El
inventario de puntos de entrada del compilador se encuentra en `scripts/lib/plugin-sdk-entrypoints.json`;
las exportaciones del paquete se generan a partir del subconjunto público.

Las interfaces auxiliares reservadas para plugins incluidos se han retirado del mapa público de
exportaciones del SDK, salvo las fachadas de compatibilidad documentadas explícitamente, como el
shim obsoleto `plugin-sdk/discord`, conservado para plugins externos que todavía
importan directamente el paquete publicado `@openclaw/discord`. Los auxiliares específicos
de cada propietario residen dentro del paquete del plugin propietario; el comportamiento compartido del host se canaliza
mediante contratos genéricos del SDK, como `plugin-sdk/gateway-runtime`,
`plugin-sdk/security-runtime` y la API inyectada del plugin.

Utilice la importación más específica que corresponda a la tarea. Si no encuentra una exportación,
consulte el código fuente en `src/plugin-sdk/` o pregunte a los mantenedores qué contrato
genérico debe asumir su propiedad.

## Superficies de compatibilidad eliminadas

La revisión de julio de 2026 eliminó los barrels raíz del SDK y de compatibilidad, el puente de la API
de extensiones, los alias vencidos de subrutas del SDK, las subrutas del SDK sin uso y las exportaciones
públicas de módulos del SDK exclusivos de plugins incluidos. Los módulos exclusivos de plugins incluidos siguen disponibles para
sus propietarios del repositorio mediante asignaciones locales privadas de compilación; no se pueden
importar desde el paquete publicado.

### Publicación global del proceso de proveedores de API

`registerApiProvider(...)` y `unregisterApiProviders(...)` se eliminaron de
`openclaw/plugin-sdk/llm`. Publicaban transportes de API en el estado global del
proceso, que los runtimes de modelos gestionados por el ciclo de vida debían copiar después en cada registro
preparado.

Los plugins de proveedores deben registrar proveedores de inferencia de texto mediante
`api.registerProvider(...)`. El código y las pruebas propiedad del host que construyan un
`ApiRegistry` deben registrarse directamente en ese registro para que la propiedad
y la finalización del proveedor permanezcan limitadas al runtime preparado.

### Barrel privado de pruebas

`openclaw/plugin-sdk/testing` era local del repositorio y estaba excluido de los artefactos
publicados del paquete, por lo que se eliminó antes de su fecha `removeAfter` del 2026-07-28. Las pruebas del repositorio
utilizan subrutas específicas como `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`,
`plugin-sdk/test-env` y `plugin-sdk/test-fixtures`.

## Referencia de migración

Estas correspondencias abarcan tanto las superficies eliminadas en julio de 2026 como las
obsolescencias activas de periodos posteriores. Una correspondencia es una guía de migración, no una prueba de que la
superficie anterior siga disponible; consulte el registro de compatibilidad y el calendario de
eliminaciones para conocer el estado actual.

<AccordionGroup>
  <Accordion title="Generadores de ayuda de command-auth -> command-status">
    **Anterior (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nuevo (`openclaw/plugin-sdk/command-status`)**: las mismas firmas, importadas
    desde la subruta más específica. Se han eliminado las reexportaciones de compatibilidad de `command-auth`.

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

    **Nuevo**: `resolveInboundMentionDecision({ facts, policy })`; un objeto de
    decisión en lugar de dos formas de llamada separadas.

    Adoptado en Discord, iMessage, Matrix, MS Teams, QQBot, Signal,
    Telegram, WhatsApp y Zalo. El modelo de eventos `app_mention` propio de Slack no
    utiliza este auxiliar.

  </Accordion>

  <Accordion title="Shim del runtime de canal y auxiliares de acciones de canal">
    `openclaw/plugin-sdk/channel-runtime` se ha eliminado. Utilice
    `openclaw/plugin-sdk/channel-runtime-context` para registrar objetos del
    runtime.

    Los auxiliares del esquema de mensajes nativos en `openclaw/plugin-sdk/channel-actions`
    se eliminaron junto con las exportaciones de canal de "actions" sin procesar. Exponga las capacidades
    mediante la superficie semántica `presentation`; los plugins de canal
    declaran lo que renderizan (tarjetas, botones, selectores) en lugar de qué nombres de
    acciones sin procesar aceptan.

  </Accordion>

  <Accordion title="Auxiliar tool() del proveedor de búsqueda web -> createTool() en el plugin">
    **Anterior**: fábrica `tool()` desde `openclaw/plugin-sdk/provider-web-search`.

    **Nuevo**: implemente `createTool(...)` directamente en el plugin del proveedor.
    OpenClaw ya no necesita el auxiliar del SDK para registrar el wrapper de la herramienta.

  </Accordion>

  <Accordion title="Sobres de canal de texto sin formato -> BodyForAgent">
    **Anterior**: `api.runtime.channel.reply.formatInboundEnvelope(...)` (y el
    campo `channelEnvelope` en los objetos de mensajes entrantes) para crear un sobre
    plano de prompt en texto sin formato a partir de mensajes entrantes del canal.

    **Nuevo**: `BodyForAgent` junto con bloques estructurados de contexto del usuario. Los plugins de
    canal adjuntan metadatos de enrutamiento (hilo, tema, respuesta a, reacciones) como
    campos tipados en lugar de concatenarlos en una cadena de prompt. El
    auxiliar `formatAgentEnvelope(...)` sigue siendo compatible para sobres sintetizados
    orientados al asistente, pero los sobres entrantes de texto sin formato están en proceso de
    eliminación.

    Áreas afectadas: `inbound_claim`, `message_received` y cualquier plugin
    de canal personalizado que posprocesara el texto del sobre anterior.

  </Accordion>

  <Accordion title="hook deactivate -> gateway_stop">
    **Anterior**: `api.on("deactivate", handler)`.

    **Nuevo**: `api.on("gateway_stop", handler)`. El mismo contrato de limpieza durante
    el apagado; solo cambia el nombre del hook.

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

    `deactivate` sigue conectado como alias de compatibilidad obsoleto hasta que se
    elimine después de 2026-08-16.

  </Accordion>

  <Accordion title="hook subagent_spawning -> vinculación de hilos del núcleo">
    **Anterior**: `api.on("subagent_spawning", handler)` devolvía
    `threadBindingReady` o `deliveryOrigin`.

    **Nuevo**: permita que el núcleo prepare las vinculaciones de subagentes `thread: true` mediante el
    adaptador de vinculación de sesiones del canal. Use `api.on("subagent_spawned", handler)`
    solo para la observación posterior al inicio.

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
    después de 2026-08-30.

  </Accordion>

  <Accordion title="Tipos de descubrimiento de proveedores -> tipos del catálogo de proveedores">
    Cuatro alias de tipos de descubrimiento son ahora envoltorios ligeros de los
    tipos de la era del catálogo:

    | Alias anterior            | Tipo nuevo                |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Se han eliminado los alias y el contenedor estático heredado `ProviderCapabilities`.
    Los plugins de proveedores
    deben usar hooks explícitos de proveedores, como `buildReplayPolicy`,
    `normalizeToolSchemas` y `wrapStreamFn`, en lugar de un objeto estático.

  </Accordion>

  <Accordion title="Hooks de política de razonamiento -> resolveThinkingProfile">
    **Anterior** (tres hooks distintos en `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` y
    `resolveDefaultThinkingLevel(ctx)`.

    **Nuevo**: un único `resolveThinkingProfile(ctx)` que devuelve un
    `ProviderThinkingProfile` con el `id` canónico, un `label` opcional y una
    lista ordenada de niveles. OpenClaw degrada automáticamente los valores
    almacenados obsoletos según el rango del perfil.

    El contexto incluye `provider`, `modelId`, un `reasoning` combinado opcional
    y datos combinados opcionales del modelo `compat`. Los plugins de proveedores pueden usar esos
    datos del catálogo para exponer un perfil específico del modelo solo cuando el
    contrato de solicitud configurado lo admita.

    Implemente un hook en lugar de tres. Se han eliminado los hooks heredados.

  </Accordion>

  <Accordion title="Proveedores de autenticación externos -> contracts.externalAuthProviders">
    **Anterior**: se implementaban hooks de autenticación externa sin declarar el proveedor
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
    dentro del manifiesto. Esto consolida los metadatos de entorno de configuración y estado en un solo lugar
    y evita iniciar el entorno de ejecución del plugin solo para responder consultas de variables de entorno.

    `providerAuthEnvVars` ya no se acepta.

  </Accordion>

  <Accordion title="Registro del plugin de memoria -> registerMemoryCapability">
    **Anterior**: tres llamadas distintas: `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)` y `api.registerMemoryRuntime(...)`.

    **Nuevo**: una llamada en la API de estado de memoria:
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

    El contrato genérico del proveedor de incrustaciones puede reutilizarse fuera de la memoria y es
    la vía admitida para los proveedores nuevos. La API de registro específica de memoria
    permanece conectada como compatibilidad obsoleta mientras migran los proveedores
    existentes. La inspección de plugins informa del uso no incluido como deuda de
    compatibilidad.

  </Accordion>

  <Accordion title="Resultados de envío de canal sin procesar -> OutboundDeliveryResult">
    **Anterior**: se devolvía `{ ok, messageId, error }` mediante
    `ChannelSendRawResult` y se normalizaba con
    `createRawChannelSendResultAdapter(...)`.

    **Nuevo**: devuelva los campos de `OutboundDeliveryResult` y adjunte el canal con
    `createAttachedChannelResultAdapter(...)`. Los envíos fallidos deben generar una excepción en lugar
    de devolver una cadena de error. El tipo de resultado sin procesar seguirá disponible hasta
    la próxima versión principal del SDK de plugins.

  </Accordion>

  <Accordion title="Tipos de mensajes de sesión de subagentes renombrados">
    Todavía se exportan dos alias de tipos heredados desde `src/plugins/runtime/types.ts`:

    | Anterior                      | Nuevo                           |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    El método del entorno de ejecución `readSession` está obsoleto en favor de
    `getSessionMessages`. La firma es la misma; el método anterior delega en el
    nuevo.

  </Accordion>

  <Accordion title="API eliminadas de archivos de sesión y transcripción">
    El cambio de sesiones y transcripciones a SQLite elimina o declara obsoletas las API orientadas a plugins
    que exponían almacenes `sessions.json` activos, rutas de transcripciones JSONL o listas
    de archivos de sesión. Los plugins del entorno de ejecución deben usar la identidad de sesión y los asistentes
    del entorno de ejecución del SDK en lugar de resolver o modificar archivos activos.

    | Superficie en migración | Reemplazo |
    | ----------------- | ----------- |
    | `loadSessionStore(...)`, `updateSessionStore(...)` y `resolveSessionStoreEntry(...)` obsoletos | `getSessionEntry(...)`, `listSessionEntries(...)` y mutaciones de sesión a nivel de fila. |
    | `resolveSessionFilePath(...)` obsoleto | Identidad de sesión (`sessionKey`, `sessionId` y asistentes de destino del entorno de ejecución del SDK), además de métodos del Gateway que operan sobre la sesión actual. |
    | `saveSessionStore(...)` eliminado | API del entorno de ejecución de sesiones propiedad del Gateway; el código del plugin debe solicitar o modificar el estado de sesión mediante asistentes documentados del entorno de ejecución o del contexto, en lugar de escribir en el archivo del almacén activo. |
    | `resolveSessionTranscriptPathInDir(...)` y `resolveAndPersistSessionFile(...)` eliminados | Identidad de sesión y métodos del Gateway que operan sobre la sesión actual. |
    | `readLatestAssistantTextFromSessionTranscript(...)` | Lectores de transcripciones respaldados por identidad que expone el contexto actual del entorno de ejecución, o métodos de historial y sesión del Gateway cuando el plugin se encuentra fuera de la ruta propietaria de la transcripción. |
    | `SessionTranscriptUpdate.sessionFile` | `SessionTranscriptUpdate.target` con `agentId`, `sessionKey` y `sessionId`. |
    | Entradas de sincronización de memoria como `sessionFiles` | Fuentes de transcripción y sesión respaldadas por identidad que proporciona el host; no rastree archivos JSONL activos de sesiones en curso. |
    | Opciones del entorno de ejecución denominadas `transcriptPath` o `sessionFile` para sesiones activas | Objetos de destino `sessionTarget`/del entorno de ejecución que contienen una identidad de sesión independiente del almacenamiento. |

    Los archivos de transcripción JSONL heredados siguen siendo válidos como artefactos de importación, archivo, exportación y
    soporte. Ya no son el contrato estable del entorno de ejecución para
    las sesiones activas.

    Los plugins oficiales publicados con `v2026.7.1-beta.5` importaban los cuatro
    asistentes obsoletos anteriores. `openclaw/plugin-sdk/session-store-runtime` mantiene
    ese puente exacto hasta 2026-10-12; los plugins nuevos deben usar los reemplazos.
    `resolveStorePath(...)` sigue siendo un asistente compatible del SDK y no forma parte de
    esta obsolescencia.

    `openclaw plugins inspect --all --runtime` informa de los plugins no incluidos cuyos
    errores de carga o diagnósticos todavía hacen referencia a estas API de archivos eliminadas. El
    análisis de avisos `@openclaw/plugin-inspector` debe usar la versión `0.3.17` o
    una posterior para que los análisis de paquetes externos también marquen los asistentes de sesión de almacén completo,
    los asistentes de rutas de archivos de sesión, los destinos de archivos de transcripción heredados y los asistentes
    de transcripción de bajo nivel antes del lanzamiento.

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **Anterior**: `runtime.tasks.flow` (singular) devolvía un descriptor
    activo de TaskFlow.

    **Nuevo**: `runtime.tasks.managedFlows` conserva el entorno de ejecución de mutación
    administrada de TaskFlow para los plugins que crean, actualizan, cancelan o ejecutan tareas secundarias desde un
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
    Se trata en [Cómo migrar](#how-to-migrate) más arriba. Se incluye aquí para
    completar la información: la ruta `api.registerEmbeddedExtensionFactory(...)`, eliminada y exclusiva
    del ejecutor integrado, se sustituye por
    `api.registerAgentToolResultMiddleware(...)` con una lista explícita de entornos de ejecución
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
Las obsolescencias a nivel de extensión (dentro de los plugins de canal o proveedor incluidos en
`extensions/`) se registran en sus propios puntos de exportación `api.ts` y `runtime-api.ts`.
No afectan a los contratos de plugins de terceros y no se enumeran
aquí. Si se consume directamente el punto de exportación local de un plugin incluido, deben leerse los
comentarios de obsolescencia de ese punto antes de actualizar.
</Note>

## Migración de Talk y voz en tiempo real

El código de voz en tiempo real, telefonía, reuniones y Talk en el navegador comparte un único controlador
de sesiones de Talk exportado por `openclaw/plugin-sdk/realtime-voice`. El
controlador gestiona el sobre común de eventos de Talk, el estado del turno activo, el estado de captura,
el estado del audio de salida, el historial reciente de eventos y el rechazo de turnos obsoletos.
Los plugins de proveedores gestionan las sesiones en tiempo real específicas del proveedor. Los plugins de reuniones
en el navegador usan `openclaw/plugin-sdk/meeting-runtime` para la mecánica de sesiones, navegador, audio, host de Node,
consulta al agente y llamadas de voz, y después implementan `MeetingPlatformAdapter`
para las reglas de URL, los scripts del DOM, la asignación de acciones manuales, los subtítulos, la creación y los planes
de acceso telefónico. Las API REST de la plataforma, OAuth, los artefactos, los selectores y los nombres del protocolo permanecen en
el plugin. Los planes de permisos del navegador reciben la URL de reunión solicitada para que cada
plataforma pueda conceder acceso únicamente a sus orígenes compatibles exactos. Los entornos de ejecución de sesión también deben
normalizar el estado de actividad específico de la plataforma después de confirmar la salida del navegador;
los campos históricos de la transcripción pueden permanecer, pero la disponibilidad de subtítulos y audio no debe
seguir activa después de salir.

Todas las superficies incluidas se ejecutan en el controlador compartido: el relé del navegador,
la transferencia a salas administradas, las llamadas de voz en tiempo real, el STT de transmisión de llamadas de voz, Google
Meet en tiempo real y la función nativa de pulsar para hablar. El Gateway anuncia un único canal de eventos
de Talk en directo en `hello-ok.features.events`: `talk.event`.

El código nuevo no debe llamar a `createTalkEventSequencer(...)` directamente, salvo que
implemente un adaptador de bajo nivel o un fixture de prueba. Use el controlador compartido para que
los eventos con alcance de turno no puedan emitirse sin un identificador de turno, las llamadas obsoletas a `turnEnd` /
`turnCancel` no puedan borrar un turno activo más reciente y los eventos del
ciclo de vida del audio de salida permanezcan coherentes en telefonía, reuniones, retransmisión del navegador,
transferencia de salas gestionadas y clientes nativos de Talk.

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

Las sesiones WebRTC/websocket del proveedor propiedad del navegador usan `talk.client.create`,
porque el navegador controla la negociación con el proveedor y el transporte multimedia, mientras que el
Gateway controla las credenciales, las instrucciones y la política de herramientas. `talk.session.*` es
la superficie común gestionada por el Gateway para tiempo real mediante retransmisión del Gateway,
transcripción mediante retransmisión del Gateway y sesiones nativas de STT/TTS en salas gestionadas.

Las configuraciones heredadas que sitúan selectores de tiempo real junto a `talk.provider` /
`talk.providers` deben repararse con `openclaw doctor --fix`; Talk en tiempo de ejecución
no reinterpreta la configuración del proveedor de voz/TTS como configuración del proveedor de tiempo real.

Las combinaciones admitidas de `talk.session.create` son intencionadamente limitadas:

| Modo            | Transporte       | Cerebro           | Propietario              | Notas                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Audio bidireccional simultáneo del proveedor retransmitido a través del Gateway; las llamadas a herramientas se enrutan mediante la herramienta agent-consult.           |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Solo STT por streaming; los llamantes envían audio de entrada y reciben eventos de transcripción.                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | Sala nativa/del cliente | Salas con estilo de pulsar para hablar y walkie-talkie, donde el cliente controla la captura/reproducción y el Gateway controla el estado del turno. |
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
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Inicia un turno de usuario en una sala gestionada.                                                                                                                                                                                           |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Finaliza el turno activo después de validar que no sea obsoleto.                                                                                                                                                                          |
| `talk.session.cancelTurn`       | todas las sesiones propiedad del Gateway                | Cancela el trabajo activo de captura/proveedor/agente/TTS de un turno.                                                                                                                                                                 |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Detiene la salida de audio del asistente sin finalizar necesariamente el turno del usuario.                                                                                                                                                     |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Completa una llamada a una herramienta del proveedor después de cualquier finalización asíncrona expuesta por su puente; pase `options.willContinue` para una salida provisional o, cuando se admita, `options.suppressResponse` para evitar otra respuesta del asistente. |
| `talk.session.steer`            | sesiones de Talk respaldadas por un agente               | Envía un control hablado `status`, `steer`, `cancel` o `followup` a la ejecución integrada activa resuelta desde la sesión de Talk.                                                                                                 |
| `talk.session.close`            | todas las sesiones unificadas                           | Detiene las sesiones de retransmisión o revoca el estado de la sala gestionada y, después, olvida el identificador de sesión unificado.                                                                                                                                     |

No introduzca casos especiales de proveedores o plataformas en el núcleo para que esto funcione.
El núcleo controla la semántica de las sesiones de Talk. Los plugins de proveedores controlan la configuración de las sesiones de cada proveedor.
Voice-call y Google Meet controlan los adaptadores de telefonía/reuniones. El navegador y las aplicaciones
nativas controlan la experiencia de captura/reproducción del dispositivo.

## Cronología de eliminación

| Cuándo                                      | Qué sucede                                                                                                                               |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Ahora**                                   | Las superficies obsoletas que admiten advertencias emiten advertencias en tiempo de ejecución; las protecciones del repositorio rechazan las importaciones obsoletas del SDK desde el núcleo y los plugins incluidos. |
| **Fecha `removeAfter` de cada registro de compatibilidad** | Esa superficie específica puede eliminarse; `pnpm plugins:boundary-report --fail-on-eligible-compat` hace fallar la CI cuando pasa la fecha.    |
| **Próxima versión principal**               | Se elimina cualquier superficie que aún no se haya migrado; los plugins que todavía las utilicen fallarán.                                                          |

Las subrutas públicas restantes del SDK que aparecen a continuación tienen plazos de eliminación respaldados por el registro.
Las filas del 30 de julio se eliminaron después de su revisión anticipada autorizada por los mantenedores:
se eliminaron las subrutas sin uso y los alias de compatibilidad anteriores, y
los módulos exclusivos del paquete incluido se relegaron a asignaciones de compilación locales privadas.

| `removeAfter` | Nivel                              | Subrutas del SDK                                                                                                                                                        |
| ------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2026-08-15`  | Obsolescencias de compatibilidad anteriores | `agent-config-primitives`, `channel-logging`, `channel-secret-runtime`, `channel-streaming`, `group-access`, `inbound-reply-dispatch`, `matrix`, `text-runtime`, `zod` |
| `2026-09-01`  | Obsolescencias de compatibilidad anteriores | `channel-lifecycle`, `channel-message`, `channel-reply-pipeline`, `config-runtime`, `infra-runtime`                                                                    |

Todos los plugins del núcleo ya se han migrado. Los plugins externos deben migrarse
antes de la próxima versión principal. Ejecute `pnpm plugins:boundary-report` para consultar qué
registros de compatibilidad vencerán antes para las superficies que utiliza su plugin.

## Supresión temporal de las advertencias

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esta es una vía de escape temporal, no una solución permanente.

## Contenido relacionado

- [Primeros pasos](/es/plugins/building-plugins) - cree su primer plugin
- [Descripción general del SDK](/es/plugins/sdk-overview) - referencia completa de importación de subrutas
- [Plugins de canal](/es/plugins/sdk-channel-plugins) - creación de plugins de canal
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) - creación de plugins de proveedor
- [Funcionamiento interno de los plugins](/es/plugins/architecture) - análisis detallado de la arquitectura
- [Manifiesto del plugin](/es/plugins/manifest) - referencia del esquema del manifiesto
