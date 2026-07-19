---
read_when:
    - Necesita saber desde qué subruta del SDK importar.
    - Quieres una referencia de todos los métodos de registro de OpenClawPluginApi
    - Está buscando una exportación específica del SDK
sidebarTitle: Plugin SDK overview
summary: Mapa de importaciones, referencia de la API de registro y arquitectura del SDK
title: Descripción general del SDK de plugins
x-i18n:
    generated_at: "2026-07-19T02:02:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 783bafd34098e5d77aab8e574b6518f5df91ba622c9736aef8addff4914f3a9f
    source_path: plugins/sdk-overview.md
    workflow: 16
---

El SDK de plugins es el contrato tipado entre los plugins y el núcleo. Esta página es la
referencia de **qué importar** y **qué se puede registrar**.

<Note>
  Esta página está dirigida a autores de plugins que usan `openclaw/plugin-sdk/*` dentro de
  OpenClaw. Para aplicaciones externas, scripts, paneles, tareas de CI y extensiones de IDE
  que quieran ejecutar agentes mediante el Gateway, use en su lugar
  [Integraciones del Gateway para aplicaciones externas](/es/gateway/external-apps).
</Note>

<Tip>
¿Busca una guía práctica? Comience con [Creación de plugins](/es/plugins/building-plugins). Use [Plugins de canal](/es/plugins/sdk-channel-plugins) para canales, [Plugins de proveedor](/es/plugins/sdk-provider-plugins) para proveedores de modelos, [Plugins de backend de CLI](/es/plugins/cli-backend-plugins) para backends locales de CLI de IA, [Plugins de entorno de ejecución de agentes](/es/plugins/sdk-agent-harness) para ejecutores nativos de agentes y [Hooks de plugins](/es/plugins/hooks) para hooks de herramientas o del ciclo de vida.
</Tip>

## Convención de importación

Importe siempre desde una subruta específica:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subruta es un módulo pequeño y autónomo. Esto agiliza el inicio y
evita problemas de dependencias circulares. Para los auxiliares de entrada y compilación específicos de canales,
prefiera `openclaw/plugin-sdk/channel-core`; reserve `openclaw/plugin-sdk/core` para
la superficie general más amplia y los auxiliares compartidos, como
`buildChannelConfigSchema`.

Para la configuración de canales, publique el esquema JSON propiedad del canal mediante
`openclaw.plugin.json#channelConfigs`. La subruta `plugin-sdk/channel-config-schema`
se utiliza para primitivas de esquema compartidas y el constructor genérico. Los plugins
incluidos con OpenClaw usan `plugin-sdk/bundled-channel-config-schema` para los esquemas
conservados de canales incluidos. Las exportaciones de compatibilidad obsoletas permanecen en
`plugin-sdk/channel-config-schema-legacy`; ninguna de las dos subrutas de esquemas incluidos es un
patrón para plugins nuevos.

<Warning>
  No importe interfaces auxiliares identificadas con marcas de proveedores o canales (por ejemplo,
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Los plugins incluidos componen subrutas genéricas del SDK dentro de sus propios módulos de barril `api.ts` /
  `runtime-api.ts`; los consumidores del núcleo deben usar esos módulos de barril
  locales del plugin o añadir un contrato genérico y específico del SDK cuando una necesidad sea realmente
  común a varios canales.

Un pequeño conjunto de interfaces auxiliares para plugins incluidos sigue apareciendo en el mapa de exportaciones
generado cuando existe un uso registrado por parte del propietario. Solo existen para el
mantenimiento de plugins incluidos y no se recomiendan como rutas de importación para nuevos
plugins de terceros.

`openclaw/plugin-sdk/discord` y `openclaw/plugin-sdk/telegram-account` también se
conservan como fachadas de compatibilidad obsoletas para usos registrados por parte del propietario. No
copie esas rutas de importación en plugins nuevos; use en su lugar auxiliares de entorno de ejecución
inyectados y subrutas genéricas del SDK de canales.
</Warning>

## Referencia de subrutas

El SDK de plugins se ofrece como un conjunto de subrutas específicas agrupadas por área (entrada del
plugin, canal, proveedor, autenticación, entorno de ejecución, capacidad, memoria y auxiliares reservados
para plugins incluidos). Para consultar el catálogo completo, agrupado y con enlaces, consulte
[Subrutas del SDK de plugins](/es/plugins/sdk-subpaths).

El inventario de puntos de entrada del compilador se encuentra en
`scripts/lib/plugin-sdk-entrypoints.json`; las exportaciones del paquete se generan a partir
del subconjunto público tras excluir las subrutas internas y de pruebas locales del repositorio enumeradas en
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Ejecute
`pnpm plugin-sdk:surface` para auditar la cantidad de exportaciones públicas. Las subrutas públicas
obsoletas con suficiente antigüedad y sin uso en el código de producción de las extensiones incluidas se
registran en `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; los módulos de barril amplios
de reexportaciones obsoletas se registran en
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API de registro

La función de devolución `register(api)` recibe un objeto `OpenClawPluginApi` con estos
métodos:

### Registro de capacidades

| Método                                           | Qué registra                                                                       |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | Inferencia de texto (LLM)                                                          |
| `api.registerWorkerProvider(...)`                | Concesiones de ciclo de vida para trabajadores en la nube                          |
| `api.registerModelCatalogProvider(...)`          | Filas del catálogo de modelos para generación de texto y contenido multimedia      |
| `api.registerAgentHarness(...)`                  | Ejecutor nativo de agentes [experimental](/es/plugins/sdk-agent-harness) (Codex, Copilot) |
| `api.registerCliBackend(...)`                    | Backend local de inferencia mediante CLI                                           |
| `api.registerChannel(...)`                       | Canal de mensajería                                                                |
| `api.registerEmbeddingProvider(...)`             | Proveedor reutilizable de incrustaciones vectoriales                               |
| `api.registerSpeechProvider(...)`                | Síntesis de texto a voz / STT                                                      |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcripción en tiempo real por streaming                                         |
| `api.registerRealtimeVoiceProvider(...)`         | Sesiones de voz bidireccionales en tiempo real                                     |
| `api.registerMediaUnderstandingProvider(...)`    | Análisis de imágenes, audio y vídeo                                                 |
| `api.registerTranscriptSourceProvider(...)`      | Fuente de transcripciones de reuniones en directo o importadas                     |
| `api.registerImageGenerationProvider(...)`       | Generación de imágenes                                                             |
| `api.registerMusicGenerationProvider(...)`       | Generación de música                                                               |
| `api.registerVideoGenerationProvider(...)`       | Generación de vídeo                                                                |
| `api.registerWebFetchProvider(...)`              | Proveedor de obtención y extracción de contenido web                               |
| `api.registerWebSearchProvider(...)`             | Búsqueda web                                                                       |
| `api.registerCompactionProvider(...)`            | Backend conectable de compactación de transcripciones                              |

Los proveedores de trabajadores también deben declarar su identificador en `contracts.workerProviders`.
El núcleo conserva la intención duradera antes de `provision(profile, operationId)`. Los proveedores validan la configuración antes de la asignación externa y lanzan `WorkerProviderError` para el rechazo permanente de un perfil. `provision` debe adoptar la misma concesión cuando se repita el identificador de la operación.
El núcleo conserva la configuración validada del perfil junto con la concesión y proporciona esa instantánea a `destroy({ leaseId, profile })`, que debe ser idempotente, y a `inspect({ leaseId, profile })`, que devuelve `active`, `destroyed` o `unknown`. Esto permite que los proveedores enruten las llamadas del ciclo de vida tras reiniciar un Gateway o eliminar un perfil con nombre. Los puntos de conexión SSH usan un `SecretRef` para `keyRef`, nunca material de claves insertado directamente, e incluyen un `hostKey` procedente de la salida de aprovisionamiento de confianza exactamente como `algorithm base64`, sin nombre de host ni comentario. El núcleo fija `hostKey` y nunca confía en una clave recibida durante la primera conexión. Un proveedor que emita dinámicamente un `keyRef` puede implementar `resolveSshIdentity({ leaseId, profile, keyRef })`; cuando está presente, ese resolutor es la autoridad, mientras que los proveedores que no lo tengan usan el resolutor genérico de secretos configurado.
Los proveedores con concesiones renovables también pueden implementar `renew(leaseId)`.
`inspect` debe lanzar una excepción ante fallos transitorios o indeterminados; devuelva `unknown` únicamente ante una ausencia confirmada. El núcleo marca como huérfano un registro local activo o considera la ausencia como la finalización del desmontaje después de una solicitud de destrucción persistida.

Los proveedores de incrustaciones registrados con `api.registerEmbeddingProvider(...)` también deben
figurar en `contracts.embeddingProviders` en el manifiesto del plugin. Esta
es la superficie genérica de incrustaciones para la generación reutilizable de vectores. La búsqueda en
memoria puede consumir esta superficie genérica del proveedor. La interfaz anterior
`api.registerMemoryEmbeddingProvider(...)` y
`contracts.memoryEmbeddingProviders` se conserva como compatibilidad obsoleta mientras
migran los proveedores existentes específicos de memoria.

Los proveedores específicos de memoria que aún exponen un `batchEmbed(...)` del entorno de ejecución permanecen en
el contrato existente de procesamiento por lotes por archivo, salvo que su entorno de ejecución establezca explícitamente
`sourceWideBatchEmbed: true`. Esta activación permite que el host de memoria envíe fragmentos de
varios archivos de memoria modificados y fuentes habilitadas en una sola llamada a `batchEmbed(...)`,
hasta los límites de lotes del host. Los adaptadores de lotes que carguen archivos de solicitudes JSONL deben
dividir las tareas del proveedor antes de alcanzar tanto el límite del tamaño de carga como el límite
de cantidad de solicitudes. El proveedor debe devolver una incrustación por cada fragmento de entrada y en el mismo orden que
`batch.chunks`; omita el indicador cuando el proveedor espere lotes locales de cada archivo o
no pueda conservar el orden de entrada en una tarea más amplia que abarque toda la fuente.

### Herramientas y comandos

Use [`defineToolPlugin`](/es/plugins/tool-plugins) para plugins sencillos que solo contienen herramientas
con nombres de herramientas fijos. Use `api.registerTool(...)` directamente para plugins mixtos
o para registrar herramientas de forma completamente dinámica.

| Método                                 | Qué registra                                                                                                                           |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerTool(tool, opts?)`        | Herramienta del agente (obligatoria o `{ optional: true }`)                                                                            |
| `api.registerCommand(def)`             | Comando personalizado (omite el LLM)                                                                                                    |
| `api.registerNodeHostCommand(command)` | Comando gestionado por `openclaw node run`; los metadatos opcionales `agentTool` pueden exponerlo como una herramienta visible para el agente mientras el Node está conectado |

Los comandos de plugins pueden establecer `agentPromptGuidance` cuando el agente necesita una indicación breve
de enrutamiento propiedad del comando. Mantenga ese texto centrado en el propio comando; no añada
políticas específicas de proveedores o plugins a los constructores de prompts del núcleo.

Las entradas de orientación pueden ser cadenas heredadas, que se aplican a todas las superficies de prompts, o
entradas estructuradas:

```ts
agentPromptGuidance: [
  "Indicación global del comando.",
  { text: "Mostrar esto solo en el prompt principal de OpenClaw.", surfaces: ["openclaw_main"] },
];
```

Los elementos estructurados `surfaces` pueden incluir `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` o `subagent`. `pi_main` sigue siendo un alias obsoleto
de `openclaw_main`. Omita `surfaces` para indicar deliberadamente una orientación aplicable a todas las superficies. No
pase un array `surfaces` vacío; se rechaza para evitar que una pérdida accidental del ámbito
convierta el texto en un prompt global.

Las instrucciones para desarrolladores del servidor de aplicaciones nativo de Codex son más estrictas que las de otras superficies de
prompts: solo la orientación cuyo ámbito se limite explícitamente a `codex_app_server` se promueve a
ese nivel de mayor prioridad. La orientación mediante cadenas heredadas y la orientación estructurada sin ámbito
siguen disponibles para las superficies de prompts ajenas a Codex por compatibilidad.

Los comandos del host Node se ejecutan en el host Node conectado, no dentro del proceso del
Gateway. Si `agentTool` está presente, el Node publica un descriptor tras conectarse
correctamente al Gateway; el Gateway lo expone a las ejecuciones de agentes únicamente mientras ese
Node esté conectado y solo si el valor `command` del descriptor está en la superficie de comandos
aprobada del Node. Establezca `agentTool.defaultPlatforms` para incluir un
comando no peligroso en la lista predeterminada de comandos permitidos del Node; de lo contrario, exija
un `gateway.nodes.allowCommands` explícito o una política de invocación del Node. `agentTool.name`
debe ser seguro para los proveedores: debe comenzar por una letra, usar solo letras, dígitos,
guiones bajos o guiones, y no superar los 64 caracteres. Las herramientas del Node respaldadas por MCP
pueden establecer metadatos `agentTool.mcp` para que las superficies de catálogo y búsqueda de herramientas muestren
la identidad del servidor o de la herramienta MCP remotos, pero la ejecución sigue realizándose mediante el
comando anunciado del Node.

### Infraestructura

| Método                                          | Qué registra                                                      |
| ----------------------------------------------- | ---------------------------------------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook de evento                                                             |
| `api.registerHttpRoute(params)`                 | Endpoint HTTP del Gateway                                                  |
| `api.registerGatewayMethod(name, handler)`      | Método RPC del Gateway                                                     |
| `api.registerGatewayDiscoveryService(service)`  | Anunciante de detección del Gateway local                                     |
| `api.registerCli(registrar, opts?)`             | Subcomando de la CLI                                                         |
| `api.registerNodeCliFeature(registrar, opts?)`  | CLI de funciones de Node bajo `openclaw nodes`                                |
| `api.registerService(service)`                  | Servicio en segundo plano                                                     |
| `api.registerInteractiveHandler(registration)`  | Controlador interactivo                                                    |
| `api.registerAgentToolResultMiddleware(...)`    | Middleware de resultados de herramientas en tiempo de ejecución                                         |
| `api.registerMemoryPromptSupplement(builder)`   | Sección aditiva del prompt relacionada con la memoria                                |
| `api.registerMemoryPromptPreparation(prepare)`  | Preparación asíncrona de una sección del prompt relacionada con la memoria                 |
| `api.registerMemoryCorpusSupplement(adapter)`   | Corpus aditivo de búsqueda/lectura de memoria                                     |
| `api.registerHostedMediaResolver(resolver)`     | Resolutor de URL de medios alojados con estilo de navegador                           |
| `api.registerMcpServerConnectionResolver(...)`  | Transporte MCP por solicitante (`url`/`headers`) para un nombre de servidor estático |
| `api.registerTextTransforms(transforms)`        | Reescrituras de texto de compatibilidad de prompts/mensajes propiedad del Plugin                |
| `api.registerConfigMigration(migrate)`          | Migración ligera de configuración ejecutada antes de cargar el entorno de ejecución del Plugin           |
| `api.registerMigrationProvider(provider)`       | Importador de `openclaw migrate`                                        |
| `api.registerAutoEnableProbe(probe)`            | Sondeo de configuración que puede habilitar automáticamente este Plugin                          |
| `api.registerReload(registration)`              | Política de prefijos de configuración de reinicio/recarga en caliente/sin operación para gestionar la recarga              |
| `api.registerNodeHostCommand(command)`          | Controlador de comandos expuesto a los nodos emparejados                                |
| `api.registerNodeInvokePolicy(policy)`          | Política de lista de permitidos/aprobación para comandos invocados por nodos                    |
| `api.registerSecurityAuditCollector(collector)` | Recopilador de hallazgos para `openclaw security audit`                       |

#### Trabajo del Webhook posterior a la confirmación

Las rutas de Webhook que confirman una solicitud antes de que finalice el procesamiento deben trasladar
ese trabajo independiente a su propia raíz de admisión con seguimiento:

```typescript
import { runDetachedWebhookWork } from "openclaw/plugin-sdk/webhook-request-guards";

void runDetachedWebhookWork(() => processWebhookEvent(event)).catch((error) => {
  runtime.error?.(`falló el despacho del webhook: ${String(error)}`);
});
```

Llame a `runDetachedWebhookWork(...)` de forma síncrona mientras la solicitud HTTP siga
admitida. El auxiliar reserva inmediatamente una raíz independiente y, después, inicia el
callback en la siguiente microtarea para que el controlador de solicitudes pueda escribir primero su
confirmación. La promesa devuelta adopta el resultado del callback; los llamadores
siguen siendo responsables de gestionar los rechazos. Esto mantiene aceptado el trabajo de la cola posterior a la confirmación y hace
que los drenajes por reinicio o suspensión esperen a que termine. Los controladores que esperan a que finalice todo el procesamiento
antes de devolver el resultado no necesitan este auxiliar.

#### Conexiones MCP limitadas al solicitante

Mantenga estática la **identidad** del servidor MCP (nombre, filtro de herramientas) en `mcp.servers` o en un
manifiesto de paquete. Opcionalmente, registre un resolutor de conexiones para que cada solicitante
de mensajes de confianza obtenga su propio transporte:

```ts
api.registerMcpServerConnectionResolver({
  serverName: "user-email",
  resolve: async (ctx) => {
    // ctx.requesterSenderId es de confianza para el host; nunca invente aquí la identidad del remitente.
    const token = await lookupUserToken(ctx.requesterSenderId);
    if (!token) {
      return null; // omitir este servidor en la ejecución actual
    }
    return {
      url: "https://mcp.example.com/email",
      headers: { Authorization: `Bearer ${token}` },
    };
  },
});
```

Notas del contrato:

- El contexto del resolutor solo contiene identidad de confianza del host (`requesterSenderId`,
  con `agentAccountId` / `messageChannel` opcionales). En el futuro pueden añadirse de forma aditiva otros campos de confianza (por
  ejemplo, contexto de usuario de cron/subagente).
- Un Plugin es propietario de un nombre de servidor: un
  `registerMcpServerConnectionResolver` duplicado para el mismo `serverName` procedente de otro
  Plugin se rechaza con un diagnóstico de error (prevalece el primer registro), por lo que
  la propiedad de la conexión nunca depende del orden de carga de los Plugins.
- Los nombres de las herramientas se derivan del conjunto completo de servidores declarados, por lo que una resolución parcial
  nunca cambia los nombres seguros de los servidores entre solicitantes o turnos. El núcleo no
  verifica que los distintos endpoints de los solicitantes proporcionen esquemas de herramientas idénticos; un
  resolutor debe dirigir a todos los solicitantes al mismo servicio lógico, o los
  esquemas de herramientas (y la estabilidad de la caché del prompt) divergirán por solicitante.
- Las ejecuciones sin un `requesterSenderId` de confianza (cron, subagente, Heartbeat, Gateway
  público) nunca materializan servidores limitados al solicitante. No existe ninguna
  conexión alternativa compartida.
- `resolve` tiene un límite de 10 segundos por servidor; un tiempo de espera agotado o una excepción omite ese
  servidor en la ejecución sin provocar un error en el MCP estático.
- Las conexiones resueltas se vuelven a validar como máximo cada 5 minutos por solicitante:
  la rotación reconstruye el transporte con credenciales nuevas, y un resultado `null`
  las revoca (el entorno de ejecución almacenado en caché se elimina incluso a mitad de la sesión). Por tanto, una credencial revocada o
  rotada puede seguir en uso durante un máximo de 5 minutos.
- Los `headers` resueltos nunca se registran ni se conservan; el núcleo solo mantiene un resumen indexado
  efímero en memoria (HMAC local al proceso) para detectar la rotación de credenciales, y
  registra los valores resueltos de credenciales de encabezados/URL en el registro de
  censura de registros/capturas de depuración.
- Los servidores limitados al solicitante no generan vistas de aplicaciones MCP: una vista sobrevive a la
  ejecución autenticada del solicitante y el límite de vistas del Gateway no dispone de identidad del
  solicitante, por lo que las vistas previas de aplicaciones permanecen cerradas ante fallos para estos servidores. Los resultados de las herramientas
  no se ven afectados.
- Los servidores estáticos sin resolutor mantienen el ciclo de vida existente limitado a la sesión.
- **Regla de entrega del arnés:** los servidores limitados al solicitante nunca entran en la
  configuración del cliente MCP nativa del arnés (hilo de Codex `mcp_servers`, CLI `-c mcp_servers=…` ni ninguna
  otra proyección MCP compartida por la sesión). En su lugar, los arneses los entregan como herramientas
  limitadas a la ejecución:
  - Ejecutor integrado: entorno de ejecución MCP de la sesión + herramientas del paquete (estáticas + limitadas).
  - Servidor de aplicaciones de Codex: herramientas dinámicas mediante
    `materializeRequesterScopedMcpToolsForHarnessRun` (solo limitadas;
    los servidores estáticos permanecen en el cliente MCP nativo de Codex).
- Las **especificaciones** de herramientas limitadas permanecen estables durante la sesión después de la primera resolución correcta en
  esa sesión, por lo que los arneses de hilos compartidos (Codex) no rotan los hilos cuando
  cambian los remitentes. Antes de que algún solicitante se resuelva, no se anuncia ninguna especificación limitada.
- Los solicitantes no autenticados en un arnés de hilos compartidos siguen viendo las herramientas
  limitadas anunciadas; al llamar a una, se devuelve un error claro de herramienta no conectada para ese
  solicitante. OpenClaw nunca recurre a las credenciales de otro solicitante.

Los generadores de suplementos de prompts de memoria reciben contexto opcional `agentId`,
`agentSessionKey` y `sandboxed`. Las llamadas `search`
y `get` de suplementos del corpus de memoria reciben contexto opcional `agentId` y `sandboxed`. Los Plugins con
almacenamiento propiedad del agente deben resolver ese almacenamiento en cada llamada en lugar de
capturar una ruta global durante el registro. Si se requiere un identificador de agente, pero
falta en una operación multiagente, cierre ante fallos en lugar de elegir un
agente arbitrario.

Use `registerMemoryPromptPreparation(...)` cuando el texto del prompt dependa del estado asíncrono
del Plugin. El callback se ejecuta una vez antes de cada prompt completo del agente y recibe
el mismo contexto de herramientas, agente, sesión y sandbox que los generadores síncronos de prompts de
memoria. Valide la instancia actual propietaria del almacenamiento antes de cargar el estado
conservado y, después, devuelva solo las líneas correspondientes a esa ejecución. OpenClaw inmoviliza esas líneas y
entrega el resultado inmutable al ensamblaje síncrono del prompt. Mantenga la persistencia,
el reemplazo atómico y la eliminación al retirar al propietario dentro del Plugin propietario; no
consulte ni lea archivos desde un generador de prompts.

Los controladores interactivos de Telegram pueden devolver `{ submitText }` para dirigir el texto a través
de la ruta normal de entrada al agente de Telegram una vez que el controlador finalice correctamente. OpenClaw conserva
el botón del callback cuando la política de entrada omite el texto o falla el procesamiento, de modo que
el usuario pueda volver a intentarlo cuando cambie la condición de bloqueo. Este campo de resultado es
específico de Telegram; los demás canales mantienen sus propios contratos de resultados interactivos.

### Hooks del host para Plugins de flujo de trabajo

Los hooks del host son las interfaces del SDK para los Plugins que deben participar en el ciclo de vida del host
en lugar de limitarse a añadir un proveedor, canal o herramienta. Son
contratos genéricos; el Modo de planificación puede utilizarlos, pero también los flujos de trabajo de aprobación,
las puertas de políticas del espacio de trabajo, los monitores en segundo plano, los asistentes de configuración y los Plugins complementarios
de la interfaz de usuario.

| Método                                                                               | Contrato del que es responsable                                                                                                                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Estado de sesión propiedad del Plugin, compatible con JSON y proyectado mediante sesiones del Gateway                                                                             |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Contexto duradero y de ejecución exactamente una vez que se inyecta en el siguiente turno del agente para una sesión                                                                             |
| `api.registerTrustedToolPolicy(...)`                                                 | Política de herramientas de confianza, previa al Plugin y controlada por el manifiesto, que puede bloquear o reescribir parámetros de herramientas                                                                        |
| `api.registerToolMetadata(...)`                                                      | Metadatos de visualización del catálogo de herramientas sin cambiar la implementación de la herramienta                                                                                     |
| `api.registerCommand(...)`                                                           | Comandos de Plugin con ámbito; los resultados de comandos pueden establecer `continueAgent: true` o `suppressReply: true`; los comandos nativos de Discord admiten `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Descriptores de contribución a la interfaz de control para superficies de sesión, herramienta, ejecución, ajustes o pestañas                                                                      |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Retrollamadas de limpieza para recursos de tiempo de ejecución propiedad del Plugin en rutas de restablecimiento, eliminación o recarga                                                                          |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Suscripciones a eventos saneados para el estado y los monitores del flujo de trabajo                                                                                              |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Estado temporal del Plugin por ejecución que se borra en el ciclo de vida terminal de la ejecución                                                                                             |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Metadatos de limpieza para trabajos del programador propiedad del Plugin; no programa trabajo ni crea registros de tareas                                                            |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Entrega de archivos adjuntos mediada por el host y exclusiva de Plugins integrados a la ruta activa de sesión de salida directa                                                            |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Turnos de sesión programados y respaldados por Cron, exclusivos de Plugins integrados, además de limpieza basada en etiquetas                                                                                    |
| `api.session.controls.registerSessionAction(...)`                                    | Acciones de sesión tipadas que los clientes pueden enviar mediante el Gateway                                                                                             |

Un descriptor `surface: "tab"` añade una pestaña a la barra lateral de la interfaz de control. Los descriptores de pestañas de los
Plugins activos se anuncian a los clientes del panel en el saludo del Gateway
(`controlUiTabs`), por lo que la pestaña solo aparece mientras el Plugin está habilitado.
Los Plugins integrados pueden incluir una vista de panel de primera clase para su pestaña; otros
Plugins pueden establecer `path` en una ruta HTTP del Plugin (consulte
`api.registerHttpRoute(...)`) que el panel representa en un marco aislado.
`icon` es una sugerencia de nombre de icono para el panel, `group` selecciona la sección de la barra lateral
(`control` o `agent`), `order` ordena las pestañas de Plugins y `requiredScopes`
oculta la pestaña para las conexiones que carecen de esos ámbitos de operador:

Para una pestaña externa protegida por el Gateway, registre el descriptor `path` bajo una
ruta HTTP `auth: "gateway"` del mismo Plugin. Tras la inicialización autenticada, el navegador obtiene una
concesión de corta duración y HttpOnly limitada a ese Plugin y a la raíz de la ruta, para que el
marco aislado pueda cargarse sin copiar el token de portador del Gateway en su URL
ni en JavaScript. El elemento principal autenticado renueva la concesión mientras la pestaña externa
está activa y antes de montarla tras la navegación o la reanudación del navegador. También
comprueba la concesión desde el mismo entorno aislado opaco antes de montarla, por lo que los modos de
privacidad del navegador que bloquean la cookie producen un cierre seguro con un panel no disponible.
La concesión del marco solo acepta `GET` y `HEAD` y siempre incluye
`operator.read`; `requiredScopes` controla la visibilidad de la pestaña, pero nunca amplía la
concesión de la cookie. Las mutaciones permanecen en superficies principales autenticadas explícitamente por el Gateway o
en superficies de portador. Las pestañas externas requieren HTTPS/Tailscale Serve o un
origen de bucle invertido de confianza para el navegador; HTTP sin cifrar en un host de LAN muestra el
error de contexto seguro en lugar de montar un panel que no puede autenticarse.
El bloqueo completo de cookies de terceros también hace que las pestañas protegidas por el Gateway no estén disponibles.
Como ocurre con todas las superficies nativas de Plugins, el marco permanece dentro del límite de confianza
del Plugin instalado; OpenClaw no trata los Plugins instalados como principales de seguridad
del navegador aislados entre sí.
Las concesiones de cookies utilizan el límite del nombre de host del navegador, no el límite de su puerto. No
aloje conjuntamente servicios que no confíen entre sí en el nombre de host del Gateway, ni siquiera en otros
puertos.
Las pestañas respaldadas por autenticación gestionada por el Plugin conservan su comportamiento directo de iframe y no
solicitan ni requieren esta concesión del Gateway.

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "Diario",
  description: "Tu día como una cronología, creada a partir de capturas de pantalla.",
  icon: "sun",
  group: "control",
  requiredScopes: ["operator.write"],
});
```

Utilice los espacios de nombres agrupados para el código nuevo de Plugins:

- `api.session.state.registerSessionExtension(...)`
- `api.session.workflow.enqueueNextTurnInjection(...)`
- `api.session.workflow.registerSessionSchedulerJob(...)`
- `api.session.workflow.sendSessionAttachment(...)`
- `api.session.workflow.scheduleSessionTurn(...)`
- `api.session.workflow.unscheduleSessionTurnsByTag(...)`
- `api.session.controls.registerSessionAction(...)`
- `api.session.controls.registerControlUiDescriptor(...)`
- `api.agent.events.registerAgentEventSubscription(...)`
- `api.agent.events.emitAgentEvent(...)`
- `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`
- `api.lifecycle.registerRuntimeLifecycle(...)`

Los métodos planos equivalentes siguen disponibles como alias de compatibilidad
obsoletos para los Plugins existentes. No añada código nuevo de Plugins que invoque directamente
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` ni
`api.unscheduleSessionTurnsByTag`.

`scheduleSessionTurn(...)` es una utilidad limitada a la sesión sobre el
programador Cron del Gateway. Cron controla la temporización y crea el registro de tarea en segundo plano cuando se
ejecuta el turno; el SDK de Plugins solo restringe la sesión de destino, la
nomenclatura propiedad del Plugin y la limpieza. Utilice `api.runtime.tasks.managedFlows` dentro del turno
programado cuando el trabajo en sí necesite un estado TaskFlow duradero de varios pasos.

Los contratos separan la autoridad intencionadamente:

- Los Plugins externos pueden controlar extensiones de sesión, descriptores de interfaz, comandos, metadatos de
  herramientas, inyecciones en el siguiente turno y enlaces normales.
- Las políticas de herramientas de confianza se ejecutan antes que los enlaces `before_tool_call`
  ordinarios y cuentan con la confianza del host. Las políticas integradas se ejecutan primero; las políticas de Plugins instalados requieren
  habilitación explícita junto con sus identificadores locales en
  `contracts.trustedToolPolicies` y se ejecutan después en el orden de carga de los Plugins. Los identificadores de políticas
  están limitados al Plugin que los registra.
- La propiedad de comandos reservados es exclusiva de los Plugins integrados. Los Plugins externos deben utilizar sus
  propios nombres de comandos o alias.
- `allowPromptInjection=false` deshabilita los enlaces que modifican instrucciones, incluidos
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  los campos de instrucciones de `before_agent_start` heredado y
  `enqueueNextTurnInjection`.

Ejemplos de consumidores que no son de Plan:

| Arquetipo de Plugin             | Enlaces utilizados                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Flujo de trabajo de aprobación            | Extensión de sesión, continuación de comandos, inyección en el siguiente turno, descriptor de interfaz                                                            |
| Puerta de políticas de presupuesto/espacio de trabajo | Política de herramientas de confianza, metadatos de herramientas, proyección de sesión                                                                                 |
| Monitor del ciclo de vida en segundo plano | Limpieza del ciclo de vida del tiempo de ejecución, suscripción a eventos del agente, propiedad/limpieza del programador de sesiones, contribución a las instrucciones de Heartbeat, descriptor de interfaz |
| Asistente de configuración o incorporación   | Extensión de sesión, comandos con ámbito, descriptor de la interfaz de control                                                                              |

<Note>
  Los espacios de nombres administrativos reservados del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) siempre permanecen como `operator.admin`, aunque un Plugin intente asignar un
  ámbito de método del Gateway más restringido. Se recomienda utilizar prefijos específicos del Plugin para los
  métodos propiedad del Plugin.
</Note>

<Accordion title="Cuándo utilizar middleware de resultados de herramientas">
  Los Plugins integrados y los Plugins instalados habilitados explícitamente con contratos de manifiesto
  coincidentes pueden utilizar `api.registerAgentToolResultMiddleware(...)` cuando
  necesiten reescribir el resultado de una herramienta después de la ejecución y antes de que el tiempo de ejecución
  devuelva ese resultado al modelo. Esta es la interfaz de confianza neutral respecto al tiempo de ejecución
  para reductores de salida asíncronos como tokenjuice.

Los Plugins deben declarar `contracts.agentToolResultMiddleware` para cada tiempo de ejecución
de destino, por ejemplo, `["openclaw", "codex"]`. Los Plugins instalados sin ese
contrato, o sin habilitación explícita, no pueden registrar este middleware; mantenga
los enlaces normales de Plugins de OpenClaw para trabajos que no necesiten la temporización de resultados
de herramientas previa al modelo. Se ha eliminado la antigua
ruta de registro de fábricas de extensiones exclusiva del ejecutor integrado.
</Accordion>

### Registro de detección del Gateway

`api.registerGatewayDiscoveryService(...)` permite que un Plugin anuncie el
Gateway activo en un transporte de detección local, como mDNS/Bonjour. OpenClaw llama al
servicio durante el inicio del Gateway cuando la detección local está habilitada, pasa los
puertos actuales del Gateway y datos de sugerencias TXT no secretos, y llama al controlador
`stop` devuelto durante el apagado del Gateway.

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

Los Plugins de detección del Gateway no deben tratar los valores TXT anunciados como secretos ni como
autenticación. La detección es una sugerencia de enrutamiento; la autenticación del Gateway y la fijación de TLS siguen
controlando la confianza.

### Metadatos de registro de la CLI

`api.registerCli(registrar, opts?)` acepta dos tipos de metadatos de comandos:

- `commands`: nombres de comandos explícitos propiedad del registrador
- `descriptors`: descriptores de comandos en tiempo de análisis utilizados para la ayuda de la CLI,
  el enrutamiento y el registro diferido de la CLI del Plugin
- `parentPath`: ruta opcional del comando principal para grupos de comandos anidados, como
  `["nodes"]`

Para las funciones de Nodes emparejados, se recomienda
`api.registerNodeCliFeature(registrar, opts?)`. Es un pequeño contenedor alrededor de
`api.registerCli(..., { parentPath: ["nodes"] })` y hace explícitos los comandos como
`openclaw nodes canvas` como funciones de Node propiedad del Plugin.

Si se desea que un comando de Plugin permanezca con carga diferida en la ruta normal de la CLI raíz,
proporcione `descriptors` que cubran cada raíz de comando de nivel superior expuesta por ese
registrador.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Gestionar cuentas, verificación, dispositivos y estado del perfil de Matrix",
        hasSubcommands: true,
      },
    ],
  },
);
```

Los comandos anidados reciben el comando principal resuelto como `program`:

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerNodesCanvasCommands } = await import("./src/cli.js");
    registerNodesCanvasCommands(program);
  },
  {
    parentPath: ["nodes"],
    descriptors: [
      {
        name: "canvas",
        description: "Capturar o renderizar contenido del lienzo desde un nodo emparejado",
        hasSubcommands: true,
      },
    ],
  },
);
```

Use `commands` por sí solo únicamente cuando no necesite el registro diferido de la CLI raíz.
Esa ruta de compatibilidad inmediata sigue siendo compatible, pero no instala
marcadores de posición respaldados por descriptores para la carga diferida durante el análisis.

### Registro del backend de la CLI

`api.registerCliBackend(...)` permite que un plugin controle la configuración predeterminada de un backend
local de CLI de IA, como `claude-cli` o `my-cli`.

- El `id` del backend se convierte en el prefijo del proveedor en referencias de modelo como `my-cli/gpt-5`.
- El `config` del backend usa la misma estructura que `agents.defaults.cliBackends.<id>`.
- La configuración del usuario sigue teniendo prioridad. OpenClaw combina `agents.defaults.cliBackends.<id>` sobre el valor
  predeterminado del plugin antes de ejecutar la CLI.
- Use `normalizeConfig` cuando un backend necesite reescrituras de compatibilidad después de la combinación
  (por ejemplo, para normalizar estructuras antiguas de indicadores).
- Use `resolveExecutionArgs` para las reescrituras de argv con alcance de solicitud que correspondan
  al dialecto de la CLI, como asignar los niveles de razonamiento de OpenClaw a un indicador
  de esfuerzo nativo. El hook recibe `ctx.executionMode`; use `"side-question"` para añadir
  indicadores de aislamiento nativos del backend en llamadas efímeras a `/btw`. Si esos indicadores
  desactivan de forma fiable las herramientas nativas de una CLI que, de otro modo, estarían siempre activas, declare
  también `sideQuestionToolMode: "disabled"`.
- Use `prepareExecution` para el entorno de inicio controlado por el backend o para puentes temporales
  de autenticación/configuración. Su `ctx.contextTokenBudget` es el límite efectivo de tokens
  seleccionado para la ejecución, de modo que los backends con compactación nativa puedan ajustar su
  propio umbral sin ramificaciones del núcleo específicas del proveedor.
- Los backends que puedan desactivar todas las herramientas nativas para una ejecución específica pueden declarar
  `nativeToolMode: "selectable"`. Las llamadas restringidas pasan una tupla
  `ctx.toolAvailability.native` vacía junto con una lista de permitidos de MCP exacta y aislada del host;
  `resolveExecutionArgs` debe aplicar ambas en el argv final, ya sea nuevo o de reanudación.
  OpenClaw aplica un cierre seguro si el backend no puede hacerlo.

Para consultar una guía integral de creación, véase
[plugins de backend de la CLI](/es/plugins/cli-backend-plugins).

### Ranuras exclusivas

| Método                                     | Lo que registra                                                                                                                                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motor de contexto (uno activo a la vez). Las devoluciones de llamada del ciclo de vida reciben `runtimeSettings` cuando el host puede proporcionar diagnósticos de modelo/proveedor/modo; los motores estrictos más antiguos se reintentan sin esa clave. |
| `api.registerMemoryCapability(capability)` | Capacidad de memoria unificada                                                                                                                                                                          |
| `api.registerMemoryPromptSection(builder)` | Generador de la sección de memoria del prompt                                                                                                                                                                      |
| `api.registerMemoryFlushPlan(resolver)`    | Solucionador del plan de vaciado de memoria                                                                                                                                                                         |
| `api.registerMemoryRuntime(runtime)`       | Adaptador del entorno de ejecución de memoria                                                                                                                                                                             |

### Adaptadores de embeddings de memoria obsoletos

| Método                                         | Lo que registra                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embeddings de memoria para el plugin activo |

- `registerMemoryCapability` es la API exclusiva preferida del plugin de memoria.
- `registerMemoryCapability` también puede exponer `publicArtifacts.listArtifacts(...)`
  para que los plugins complementarios puedan consumir artefactos de memoria exportados mediante
  `openclaw/plugin-sdk/memory-host-core`, en lugar de acceder a la estructura privada de un
  plugin de memoria específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` y
  `registerMemoryRuntime` son API exclusivas del plugin de memoria compatibles con sistemas heredados.
- `MemoryFlushPlan.model` puede fijar el turno de vaciado a una referencia `provider/model`
  exacta, como `ollama/qwen3:8b`, sin heredar la cadena de alternativas activa.
- `registerMemoryEmbeddingProvider` está obsoleto. Los nuevos proveedores de embeddings
  deben usar `api.registerEmbeddingProvider(...)` y
  `contracts.embeddingProviders`.
- Los proveedores existentes específicos de memoria siguen funcionando durante el período
  de migración, pero la inspección de plugins lo señala como deuda de compatibilidad para
  los plugins no incluidos.

### Eventos y ciclo de vida

| Método                                       | Lo que hace                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de ciclo de vida con tipos          |
| `api.onConversationBindingResolved(handler)` | Devolución de llamada de vinculación de conversación |

Consulte [hooks de plugins](/es/plugins/hooks) para ver ejemplos, nombres habituales de hooks y la semántica
de las protecciones.

### Semántica de decisión de los hooks

`before_install` es un hook del ciclo de vida del entorno de ejecución del plugin, no la superficie de políticas
de instalación del operador. Use `security.installPolicy` cuando una decisión de permitir/bloquear deba
abarcar las rutas de instalación o actualización de la CLI y las respaldadas por el Gateway.

- `before_tool_call`: devolver `{ block: true }` es terminal. Una vez que cualquier controlador lo establece, se omiten los controladores de menor prioridad.
- `before_tool_call`: devolver `{ block: false }` se considera que no hay decisión (igual que omitir `block`), no una anulación.
- `before_install`: devolver `{ block: true }` es terminal. Una vez que cualquier controlador lo establece, se omiten los controladores de menor prioridad.
- `before_install`: devolver `{ block: false }` se considera que no hay decisión (igual que omitir `block`), no una anulación.
- `reply_dispatch`: devolver `{ handled: true, ... }` es terminal. Una vez que cualquier controlador reclama el envío, se omiten los controladores de menor prioridad y la ruta predeterminada de envío al modelo.
- `message_sending`: devolver `{ cancel: true }` es terminal. Una vez que cualquier controlador lo establece, se omiten los controladores de menor prioridad.
- `message_sending`: devolver `{ cancel: false }` se considera que no hay decisión (igual que omitir `cancel`), no una anulación.
- `message_received`: use el campo con tipos `threadId` cuando necesite enrutar hilos/temas entrantes. Reserve `metadata` para datos adicionales específicos del canal.
- `message_sending`: use los campos de enrutamiento con tipos `replyToId` / `threadId` antes de recurrir a `metadata`, que es específico del canal.
- `gateway_start`: use `ctx.config`, `ctx.workspaceDir` y `ctx.getCron?.()` para el estado de inicio controlado por el Gateway, en lugar de depender de hooks internos `gateway:startup`. Es posible que Cron aún se esté cargando en este punto.
- `cron_reconciled`: reconstruya una proyección externa completa de Cron después del inicio o de la recarga del planificador. Incluye `reason` y el estado efectivo de `enabled`, incluido `enabled: false`, mientras que `ctx.getCron?.()` devuelve el planificador conciliado exacto. Pase `ctx.abortSignal` al trabajo de proyección duradero; este se cancela cuando esa instantánea del planificador queda reemplazada o el Gateway se cierra.
- `cron_changed`: observe los cambios del ciclo de vida de Cron controlados por el Gateway. Los eventos `scheduled` y `removed` son indicios de conciliación posteriores a la confirmación, no un registro ordenado de cambios. El `event.nextRunAtMs` de un evento programado está ausente cuando el trabajo no tiene un próximo despertar; un evento eliminado aún contiene la instantánea del trabajo eliminado.

Los planificadores de activación externos deben aplicar antirrebote o combinar los eventos `cron_changed`,
y después volver a leer la vista duradera completa desde el último planificador capturado por
`cron_reconciled`. No adopte el planificador de un contexto `cron_changed`: un
indicio desvinculado de un planificador anterior puede solaparse con una recarga posterior.

Use `cron_reconciled` como desencadenante de instantánea completa para el estado duradero cargado durante
el inicio del Gateway o el reemplazo del planificador. No se reproduce en una recarga en caliente
exclusiva del plugin. Los controladores de observación se ejecutan en paralelo y los
envíos sin espera pueden solaparse, por lo que los consumidores no deben depender del orden de finalización de los eventos.
Mantenga OpenClaw como fuente de verdad para las comprobaciones de vencimiento y la ejecución.

Para consultar un adaptador de ejecución única con reemplazo duradero, reintentos/espera incremental y cierre
limpio, véase [Proyección externa segura de Cron](/es/plugins/hooks#safe-external-cron-projection).

### Campos del objeto de la API

| Campo                    | Tipo                      | Descripción                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Identificador del plugin                                                                                   |
| `api.name`               | `string`                  | Nombre para mostrar                                                                                |
| `api.version`            | `string?`                 | Versión del plugin (opcional)                                                                   |
| `api.description`        | `string?`                 | Descripción del plugin (opcional)                                                               |
| `api.source`             | `string`                  | Ruta de origen del plugin                                                                          |
| `api.rootDir`            | `string?`                 | Directorio raíz del plugin (opcional)                                                            |
| `api.config`             | `OpenClawConfig`          | Instantánea de configuración actual (instantánea activa del entorno de ejecución en memoria cuando está disponible)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuración específica del plugin procedente de `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Utilidades del entorno de ejecución](/es/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Registrador con ámbito (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carga actual; `"setup-runtime"` es la ventana ligera de inicio/configuración previa a la entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resuelve la ruta relativa a la raíz del plugin                                                        |

## Convención de módulos internos

Dentro del plugin, use archivos de barril locales para las importaciones internas:

```text
my-plugin/
  api.ts            # Exportaciones públicas para consumidores externos
  runtime-api.ts    # Exportaciones de tiempo de ejecución solo para uso interno
  index.ts          # Punto de entrada del plugin
  setup-entry.ts    # Entrada ligera solo para configuración (opcional)
```

<Warning>
  Nunca importe su propio plugin mediante `openclaw/plugin-sdk/<your-plugin>`
  desde el código de producción. Encamine las importaciones internas mediante `./api.ts` o
  `./runtime-api.ts`. La ruta del SDK es únicamente el contrato externo.
</Warning>

Las superficies públicas de plugins incluidos cargadas mediante fachadas (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` y archivos de entrada públicos similares) priorizan la
instantánea de configuración activa del entorno de ejecución cuando OpenClaw ya está en ejecución. Si todavía no existe
ninguna instantánea del entorno de ejecución, recurren al archivo de configuración resuelto en el disco.
Las fachadas de plugins incluidos empaquetados deben cargarse mediante los cargadores de fachadas
de plugins de OpenClaw; las importaciones directas desde `dist/extensions/...` omiten las comprobaciones
del manifiesto y del complemento del entorno de ejecución que las instalaciones empaquetadas utilizan para el código propiedad del plugin.

Los plugins de proveedores pueden exponer un módulo de exportación de contrato limitado y local al plugin cuando un
ayudante es intencionadamente específico del proveedor y aún no corresponde a una
subruta genérica del SDK. Ejemplos incluidos:

- **Anthropic**: interfaz pública `api.ts` / `contract-api.ts` para los
  ayudantes de encabezados beta de Claude y de transmisiones `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` exporta constructores de proveedores,
  ayudantes del modelo predeterminado y constructores de proveedores en tiempo real.
- **`@openclaw/openrouter-provider`**: `api.ts` exporta el constructor del proveedor
  junto con ayudantes de incorporación y configuración.

<Warning>
  El código de producción de las extensiones también debe evitar las importaciones de `openclaw/plugin-sdk/<other-plugin>`.
  Si un ayudante es realmente compartido, trasládelo a una subruta neutral del SDK,
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` u otra
  superficie orientada a capacidades, en lugar de acoplar dos plugins.
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Puntos de entrada" icon="door-open" href="/es/plugins/sdk-entrypoints">
    Opciones de `definePluginEntry` y `defineChannelPluginEntry`.
  </Card>
  <Card title="Ayudantes del entorno de ejecución" icon="gears" href="/es/plugins/sdk-runtime">
    Referencia completa del espacio de nombres `api.runtime`.
  </Card>
  <Card title="Configuración inicial y configuración" icon="sliders" href="/es/plugins/sdk-setup">
    Empaquetado, manifiestos y esquemas de configuración.
  </Card>
  <Card title="Pruebas" icon="vial" href="/es/plugins/sdk-testing">
    Utilidades de prueba y reglas de lint.
  </Card>
  <Card title="Migración del SDK" icon="arrows-turn-right" href="/es/plugins/sdk-migration">
    Migración desde superficies obsoletas.
  </Card>
  <Card title="Componentes internos del plugin" icon="diagram-project" href="/es/plugins/architecture">
    Arquitectura detallada y modelo de capacidades.
  </Card>
</CardGroup>
