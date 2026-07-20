---
read_when:
    - Debe saber desde qué subruta del SDK realizar la importación.
    - Se necesita una referencia de todos los métodos de registro de OpenClawPluginApi
    - Está buscando una exportación específica del SDK
sidebarTitle: Plugin SDK overview
summary: Mapa de importaciones, referencia de la API de registro y arquitectura del SDK
title: Descripción general del SDK de plugins
x-i18n:
    generated_at: "2026-07-20T00:52:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 75fd5dc3cfb7b7594e2fd3d5f577e3e6ff16146d34621f80edc88147acb5f762
    source_path: plugins/sdk-overview.md
    workflow: 16
---

El SDK de plugins es el contrato tipado entre los plugins y el núcleo. Esta página es la
referencia de **qué importar** y **qué se puede registrar**.

<Note>
  Esta página está destinada a autores de plugins que usan `openclaw/plugin-sdk/*` dentro de
  OpenClaw. Para aplicaciones externas, scripts, paneles, trabajos de CI y extensiones de IDE
  que quieran ejecutar agentes mediante el Gateway, use en su lugar
  [Integraciones del Gateway para aplicaciones externas](/es/gateway/external-apps).
</Note>

<Tip>
¿Busca más bien una guía práctica? Empiece por [Crear plugins](/es/plugins/building-plugins). Use [Plugins de canal](/es/plugins/sdk-channel-plugins) para canales, [Plugins de proveedor](/es/plugins/sdk-provider-plugins) para proveedores de modelos, [Plugins de backend de CLI](/es/plugins/cli-backend-plugins) para backends locales de CLI de IA, [Plugins de entorno de ejecución de agentes](/es/plugins/sdk-agent-harness) para ejecutores nativos de agentes y [Hooks de plugins](/es/plugins/hooks) para hooks de herramientas o del ciclo de vida.
</Tip>

## Convención de importación

Importe siempre desde una subruta específica:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subruta es un módulo pequeño y autocontenido. Esto agiliza el inicio y
evita problemas de dependencias circulares. Para los auxiliares de entrada/compilación específicos de canales,
prefiera `openclaw/plugin-sdk/channel-core`; reserve `openclaw/plugin-sdk/core` para
la superficie general más amplia y los auxiliares compartidos, como
`buildChannelConfigSchema`.

Para la configuración de canales, publique el esquema JSON propiedad del canal mediante
`openclaw.plugin.json#channelConfigs`. La subruta `plugin-sdk/channel-config-schema`
está destinada a primitivas de esquema compartidas y al constructor genérico. Los
plugins incluidos de OpenClaw usan `plugin-sdk/bundled-channel-config-schema` para los esquemas
conservados de canales incluidos. Esa subruta de esquemas incluidos no es un patrón para nuevos
plugins.

<Warning>
  No importe interfaces auxiliares con marcas de proveedores o canales (por ejemplo,
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Los plugins incluidos componen subrutas genéricas del SDK dentro de sus propios archivos barril `api.ts` /
  `runtime-api.ts`; los consumidores del núcleo deben usar esos archivos barril locales del plugin
  o añadir un contrato genérico y limitado del SDK cuando una necesidad sea realmente
  común a varios canales.

Un pequeño conjunto de interfaces auxiliares para plugins incluidos sigue apareciendo en el mapa
de exportaciones generado cuando cuentan con un uso registrado por parte del propietario. Existen únicamente
para el mantenimiento de plugins incluidos y no se recomiendan como rutas de importación para nuevos
plugins de terceros.

`openclaw/plugin-sdk/discord` y `openclaw/plugin-sdk/telegram-account` también se
conservan como fachadas de compatibilidad obsoletas para el uso registrado por parte del propietario. No
copie esas rutas de importación en plugins nuevos; use en su lugar auxiliares de entorno de ejecución inyectados y
subrutas genéricas del SDK de canales.
</Warning>

## Referencia de subrutas

El SDK de plugins se ofrece como un conjunto de subrutas específicas agrupadas por área (entrada del
plugin, canal, proveedor, autenticación, entorno de ejecución, capacidad, memoria y auxiliares reservados
para plugins incluidos). Para consultar el catálogo completo, agrupado y con enlaces, consulte
[Subrutas del SDK de plugins](/es/plugins/sdk-subpaths).

El inventario de puntos de entrada del compilador se encuentra en
`scripts/lib/plugin-sdk-entrypoints.json`; las exportaciones del paquete se generan a partir
del subconjunto público después de excluir las subrutas de pruebas/internas locales del repositorio que figuran en
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Ejecute
`pnpm plugin-sdk:surface` para auditar el número de exportaciones públicas. Las subrutas públicas
obsoletas que tienen suficiente antigüedad y que no usa el código de producción de las extensiones incluidas se
registran en `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; los archivos barril amplios
de reexportación obsoletos se registran en
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API de registro

La devolución de llamada `register(api)` recibe un objeto `OpenClawPluginApi` con estos
métodos:

Los plugins que proporcionan una superficie externa de chat de equipo para una sesión pueden registrar
el único proveedor para todo el proceso exportado por
`openclaw/plugin-sdk/session-discussion`. Su método `info({ sessionKey })`
indica si una conversación no está disponible, está lista para abrirse o ya está abierta;
`open({ sessionKey })` crea o resuelve la conversación y devuelve sus URL
de inserción y externa. Registrar otro proveedor sustituye al proveedor actual.

### Registro de capacidades

| Método                                           | Qué registra                                                                 |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | Inferencia de texto (LLM)                                                              |
| `api.registerWorkerProvider(...)`                | Arrendamientos del ciclo de vida de trabajadores en la nube                                                     |
| `api.registerModelCatalogProvider(...)`          | Filas del catálogo de modelos para la generación de texto y contenido multimedia                                  |
| `api.registerAgentHarness(...)`                  | Ejecutor nativo de agentes [experimental](/es/plugins/sdk-agent-harness) (Codex, Copilot) |
| `api.registerCliBackend(...)`                    | Backend local de inferencia mediante CLI                                                       |
| `api.registerChannel(...)`                       | Canal de mensajería                                                                 |
| `api.registerEmbeddingProvider(...)`             | Proveedor reutilizable de incrustaciones vectoriales                                                |
| `api.registerSpeechProvider(...)`                | Síntesis de texto a voz / STT                                                    |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcripción en tiempo real mediante streaming                                                  |
| `api.registerRealtimeVoiceProvider(...)`         | Sesiones de voz dúplex en tiempo real                                                    |
| `api.registerMediaUnderstandingProvider(...)`    | Análisis de imágenes/audio/vídeo                                                        |
| `api.registerTranscriptSourceProvider(...)`      | Fuente de transcripciones de reuniones en directo o importadas                                        |
| `api.registerImageGenerationProvider(...)`       | Generación de imágenes                                                                  |
| `api.registerMusicGenerationProvider(...)`       | Generación de música                                                                  |
| `api.registerVideoGenerationProvider(...)`       | Generación de vídeo                                                                  |
| `api.registerWebFetchProvider(...)`              | Proveedor de obtención / extracción web                                                       |
| `api.registerWebSearchProvider(...)`             | Búsqueda web                                                                        |
| `api.registerCompactionProvider(...)`            | Backend conectable de compactación de transcripciones                                           |

Los proveedores de trabajadores también deben declarar su identificador en `contracts.workerProviders`.
El núcleo conserva la intención duradera antes de `provision(profile, operationId)`. Los proveedores validan la configuración antes de la asignación externa y lanzan `WorkerProviderError` para rechazar permanentemente un perfil. `provision` debe adoptar el mismo arrendamiento cuando se repita el identificador de operación.
El núcleo conserva con el arrendamiento la configuración validada del perfil y proporciona esa instantánea a `destroy({ leaseId, profile })`, que debe ser idempotente, y a `inspect({ leaseId, profile })`, que devuelve `active`, `destroyed` o `unknown`. Esto permite que los proveedores dirijan las llamadas del ciclo de vida después de reiniciar el Gateway o eliminar un perfil con nombre. Los puntos de conexión SSH usan un `SecretRef` para `keyRef`, nunca material de claves en línea, e incluyen un `hostKey` procedente de una salida de aprovisionamiento de confianza exactamente como `algorithm base64`, sin nombre de host ni comentario. El núcleo fija `hostKey` y nunca confía en una clave obtenida en la primera conexión. Un proveedor que genere un `keyRef` dinámico puede implementar `resolveSshIdentity({ leaseId, profile, keyRef })`; cuando está presente, ese solucionador tiene la autoridad, mientras que los proveedores que no lo tienen usan el solucionador genérico de secretos configurado.
Los proveedores con arrendamientos renovables también pueden implementar `renew(leaseId)`.
`inspect` debe lanzar una excepción ante fallos transitorios o indeterminados; devuelva `unknown` únicamente ante una ausencia confirmada. El núcleo marca como huérfano un registro local activo o considera la ausencia como la finalización del desmontaje después de una solicitud de destrucción persistida.

Los proveedores de incrustaciones registrados con `api.registerEmbeddingProvider(...)` también deben
figurar en `contracts.embeddingProviders` en el manifiesto del plugin. Esta
es la superficie genérica de incrustaciones para la generación reutilizable de vectores. La búsqueda en memoria
puede utilizar esta superficie genérica de proveedores. La interfaz anterior
`api.registerMemoryEmbeddingProvider(...)` y
`contracts.memoryEmbeddingProviders` es una compatibilidad obsoleta mientras
migran los proveedores existentes específicos de memoria.

Los proveedores específicos de memoria que todavía exponen un `batchEmbed(...)` del entorno de ejecución permanecen en
el contrato existente de procesamiento por lotes por archivo, salvo que su entorno de ejecución establezca explícitamente
`sourceWideBatchEmbed: true`. Esta opción permite que el host de memoria envíe fragmentos de
varios archivos de memoria modificados y fuentes habilitadas en una sola llamada `batchEmbed(...)`
hasta alcanzar los límites de lote del host. Los adaptadores de lotes que carguen archivos de solicitudes JSONL deben
dividir los trabajos del proveedor antes de alcanzar tanto el límite de tamaño de carga como el límite
de cantidad de solicitudes. El proveedor debe devolver una incrustación por cada fragmento de entrada en el mismo orden que
`batch.chunks`; omita la opción cuando el proveedor espere lotes locales por archivo o
no pueda conservar el orden de entrada en un trabajo más amplio que abarque varias fuentes.

### Herramientas y comandos

Use [`defineToolPlugin`](/es/plugins/tool-plugins) para plugins sencillos que solo contengan herramientas
con nombres de herramientas fijos. Use `api.registerTool(...)` directamente para plugins mixtos
o para el registro totalmente dinámico de herramientas.

| Método                                 | Qué registra                                                                                                                        |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerTool(tool, opts?)`        | Herramienta del agente (obligatoria o `{ optional: true }`)                                                                                            |
| `api.registerCommand(def)`             | Comando personalizado (omite el LLM)                                                                                                        |
| `api.registerNodeHostCommand(command)` | Comando gestionado por `openclaw node run`; los metadatos opcionales `agentTool` pueden exponerlo como una herramienta visible para el agente mientras el Node esté conectado |

Los comandos de los plugins pueden establecer `agentPromptGuidance` cuando el agente necesite una sugerencia breve
de enrutamiento propiedad del comando. Mantenga ese texto centrado en el propio comando; no añada
políticas específicas del proveedor o del plugin a los constructores de instrucciones del núcleo.

Las entradas de orientación pueden ser cadenas heredadas, que se aplican a todas las superficies de instrucciones, o
entradas estructuradas:

```ts
agentPromptGuidance: [
  "Sugerencia global del comando.",
  { text: "Mostrar esto únicamente en las instrucciones principales de OpenClaw.", surfaces: ["openclaw_main"] },
];
```

El valor estructurado `surfaces` puede incluir `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` o `subagent`. `pi_main` sigue siendo un alias obsoleto
de `openclaw_main`. Omita `surfaces` para aplicar deliberadamente la orientación a todas las superficies. No
proporcione un arreglo `surfaces` vacío; se rechaza para que una pérdida accidental de ámbito no
convierta el texto en instrucciones globales.

Las instrucciones para desarrolladores del servidor de aplicaciones nativo de Codex son más estrictas que las de otras superficies
de instrucciones: solo la orientación cuyo ámbito se haya establecido explícitamente en `codex_app_server` se eleva a
ese canal de mayor prioridad. La orientación en cadenas heredadas y la orientación estructurada sin ámbito
siguen disponibles para las superficies de instrucciones ajenas a Codex por motivos de compatibilidad.

Los comandos del host de Node se ejecutan en el host de Node conectado, no dentro del proceso del Gateway. Si `agentTool` está presente, el Node publica un descriptor después de conectarse correctamente al Gateway; el Gateway lo expone a las ejecuciones del agente solo mientras ese Node esté conectado y solo si el `command` del descriptor está en la superficie de comandos aprobada del Node. Establezca `agentTool.defaultPlatforms` para incluir un comando no peligroso en la lista de permitidos predeterminada de comandos del Node; de lo contrario, requiera un `gateway.nodes.allowCommands` explícito o una política de invocación del Node. `agentTool.name` debe ser seguro para el proveedor: debe comenzar con una letra, usar únicamente letras, dígitos, guiones bajos o guiones, y no superar los 64 caracteres. Las herramientas de Node respaldadas por MCP pueden establecer metadatos de `agentTool.mcp` para que las superficies de catálogo y búsqueda de herramientas puedan mostrar la identidad del servidor o la herramienta MCP remotos, pero la ejecución sigue realizándose mediante el comando de Node anunciado.

### Infraestructura

| Método                                          | Qué registra                                                      |
| ----------------------------------------------- | ---------------------------------------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Enlace de evento                                                             |
| `api.registerHttpRoute(params)`                 | Punto de conexión HTTP del Gateway                                                  |
| `api.registerGatewayMethod(name, handler)`      | Método RPC del Gateway                                                     |
| `api.registerGatewayDiscoveryService(service)`  | Anunciante de descubrimiento local del Gateway                                     |
| `api.registerCli(registrar, opts?)`             | Subcomando de la CLI                                                         |
| `api.registerNodeCliFeature(registrar, opts?)`  | CLI de funciones del Node en `openclaw nodes`                                |
| `api.registerService(service)`                  | Servicio en segundo plano                                                     |
| `api.registerInteractiveHandler(registration)`  | Controlador interactivo                                                    |
| `api.registerAgentToolResultMiddleware(...)`    | Middleware de resultados de herramientas en tiempo de ejecución                                         |
| `api.registerMemoryPromptSupplement(builder)`   | Sección aditiva de la instrucción adyacente a la memoria                                |
| `api.registerMemoryPromptPreparation(prepare)`  | Preparación asíncrona de una sección de la instrucción adyacente a la memoria                 |
| `api.registerMemoryCorpusSupplement(adapter)`   | Corpus aditivo de búsqueda y lectura de memoria                                     |
| `api.registerHostedMediaResolver(resolver)`     | Resolutor de URL de medios alojados al estilo de un navegador                           |
| `api.registerMcpServerConnectionResolver(...)`  | Transporte MCP por solicitante (`url`/`headers`) para un nombre de servidor estático |
| `api.registerTextTransforms(transforms)`        | Reescrituras de texto de compatibilidad de instrucciones y mensajes propiedad del Plugin                |
| `api.registerConfigMigration(migrate)`          | Migración ligera de configuración ejecutada antes de cargar el tiempo de ejecución del Plugin           |
| `api.registerMigrationProvider(provider)`       | Importador de `openclaw migrate`                                        |
| `api.registerAutoEnableProbe(probe)`            | Sondeo de configuración que puede habilitar automáticamente este Plugin                          |
| `api.registerReload(registration)`              | Política de prefijos de configuración de reinicio/en caliente/sin operación para gestionar la recarga              |
| `api.registerNodeHostCommand(command)`          | Controlador de comandos expuesto a los Nodes emparejados                                |
| `api.registerNodeInvokePolicy(policy)`          | Política de lista de permitidos/aprobación para comandos invocados por Nodes                    |
| `api.registerSecurityAuditCollector(collector)` | Recopilador de hallazgos para `openclaw security audit`                       |

#### Trabajo del Webhook posterior a la confirmación

Las rutas de Webhook que confirman una solicitud antes de que termine el procesamiento deben trasladar ese trabajo separado a su propia raíz de admisión con seguimiento:

```typescript
import { runDetachedWebhookWork } from "openclaw/plugin-sdk/webhook-request-guards";

void runDetachedWebhookWork(() => processWebhookEvent(event)).catch((error) => {
  runtime.error?.(`falló el envío del webhook: ${String(error)}`);
});
```

Llame a `runDetachedWebhookWork(...)` de forma síncrona mientras la solicitud HTTP siga admitida. El asistente reserva inmediatamente una raíz independiente y, a continuación, inicia la devolución de llamada en la siguiente microtarea para que el controlador de solicitudes pueda escribir primero su confirmación. La promesa devuelta adopta el resultado de la devolución de llamada; los llamadores siguen siendo responsables de gestionar los rechazos. Esto mantiene aceptado el trabajo en cola posterior a la confirmación y hace que los drenajes de reinicio o suspensión esperen a que termine. Los controladores que esperan a que finalice todo el procesamiento antes de regresar no necesitan este asistente.

#### Conexiones MCP con ámbito de solicitante

Mantenga estática la **identidad** del servidor MCP (nombre, filtro de herramientas) en `mcp.servers` o en un manifiesto de paquete. Opcionalmente, registre un resolutor de conexiones para que cada solicitante de mensajes de confianza obtenga su propio transporte:

```ts
api.registerMcpServerConnectionResolver({
  serverName: "user-email",
  resolve: async (ctx) => {
    // ctx.requesterSenderId es de confianza para el host; nunca invente aquí la identidad del remitente.
    const token = await lookupUserToken(ctx.requesterSenderId);
    if (!token) {
      return null; // omitir este servidor para la ejecución actual
    }
    return {
      url: "https://mcp.example.com/email",
      headers: { Authorization: `Bearer ${token}` },
    };
  },
});
```

Notas del contrato:

- El contexto del resolutor solo contiene identidad de confianza del host (`requesterSenderId`, `agentAccountId` / `messageChannel` opcionales). Los futuros campos de confianza (por ejemplo, el contexto de usuario de Cron/subagente) pueden añadirse de forma aditiva.
- Un Plugin posee un nombre de servidor: un `registerMcpServerConnectionResolver` duplicado para el mismo `serverName` procedente de otro Plugin se rechaza con un diagnóstico de error (prevalece el primer registro), por lo que la propiedad de la conexión nunca depende del orden de carga de los Plugins.
- Los nombres de las herramientas se derivan del conjunto completo de servidores declarados, por lo que una resolución parcial nunca cambia los nombres de servidor seguros entre solicitantes o turnos. El núcleo no verifica que los distintos puntos de conexión de los solicitantes proporcionen esquemas de herramientas idénticos; un resolutor debe dirigir a cada solicitante al mismo servicio lógico, o los esquemas de herramientas (y la estabilidad de la caché de instrucciones) divergirán para cada solicitante.
- Las ejecuciones sin un `requesterSenderId` de confianza (Cron, subagente, Heartbeat, Gateway público) nunca materializan servidores con ámbito de solicitante. No existe una conexión alternativa compartida.
- `resolve` está limitado a 10 segundos por servidor; un tiempo de espera agotado o una excepción omiten ese servidor durante la ejecución sin provocar un fallo del MCP estático.
- Las conexiones resueltas se vuelven a validar como máximo cada 5 minutos por solicitante: la rotación reconstruye el transporte con credenciales nuevas, y un resultado `null` lo revoca (el tiempo de ejecución almacenado en caché se elimina incluso en mitad de la sesión). Por lo tanto, una credencial revocada o rotada puede seguir utilizándose durante un máximo de 5 minutos.
- Los `headers` resueltos nunca se registran ni se conservan; el núcleo solo mantiene un resumen con clave efímero en memoria (HMAC local al proceso) para detectar la rotación de credenciales y registra los valores de credenciales resueltos de encabezados/URL en el registro de censura de capturas de depuración y registros.
- Los servidores con ámbito de solicitante no generan vistas de aplicaciones MCP: una vista perdura más que la ejecución autenticada del solicitante y el límite de la vista del Gateway no tiene identidad de solicitante, por lo que las vistas previas de aplicaciones permanecen cerradas de forma segura para estos servidores. Los resultados de las herramientas no se ven afectados.
- Los servidores estáticos sin resolutor conservan el ciclo de vida existente con ámbito de sesión.
- **Regla de entrega del arnés:** los servidores con ámbito de solicitante nunca entran en la configuración del cliente MCP nativa del arnés (subproceso `mcp_servers` de Codex, `-c mcp_servers=…` de la CLI o cualquier otra proyección MCP compartida por la sesión). En su lugar, los arneses los entregan como herramientas con ámbito de ejecución:
  - Ejecutor integrado: tiempo de ejecución MCP de la sesión + herramientas del paquete (estáticas + con ámbito).
  - Servidor de aplicaciones de Codex: herramientas dinámicas mediante `materializeRequesterScopedMcpToolsForHarnessRun` (solo con ámbito; los servidores estáticos permanecen en el cliente MCP nativo de Codex).
- Las **especificaciones** de las herramientas con ámbito permanecen estables durante la sesión después de la primera resolución correcta en esa sesión, por lo que los arneses con subprocesos compartidos (Codex) no rotan los subprocesos cuando cambian los remitentes. Antes de que se resuelva cualquier solicitante, no se anuncia ninguna especificación con ámbito.
- Los solicitantes no autenticados de un arnés con subprocesos compartidos siguen viendo las herramientas con ámbito anunciadas; al llamar a una, se devuelve un error claro de herramienta no conectada para ese solicitante. OpenClaw nunca recurre a las credenciales de otro solicitante.

Los generadores de suplementos de instrucciones de memoria reciben el contexto opcional `agentId`, `agentSessionKey` y `sandboxed`. Las llamadas `search` y `get` del suplemento del corpus de memoria reciben el contexto opcional `agentId` y `sandboxed`. Los Plugins con almacenamiento propiedad del agente deben resolver ese almacenamiento en cada llamada, en lugar de capturar una ruta global durante el registro. Si se requiere un identificador de agente, pero falta en una operación multiagente, se debe aplicar un cierre seguro en lugar de elegir un agente arbitrario.

Use `registerMemoryPromptPreparation(...)` cuando el texto de la instrucción dependa del estado asíncrono del Plugin. La devolución de llamada se ejecuta una vez antes de cada instrucción completa del agente y recibe el mismo contexto de herramientas, agente, sesión y entorno aislado que los generadores síncronos de instrucciones de memoria. Valide la instancia actual propietaria del almacenamiento antes de cargar el estado conservado y, a continuación, devuelva únicamente las líneas correspondientes a esa ejecución. OpenClaw inmoviliza esas líneas y entrega el resultado inmutable al ensamblado síncrono de la instrucción. Mantenga la persistencia, la sustitución atómica y la eliminación al quitar el propietario dentro del Plugin propietario; no sondee ni lea archivos desde un generador de instrucciones.

Los controladores interactivos de Telegram pueden devolver `{ submitText }` para dirigir el texto a través de la ruta normal de entrada al agente de Telegram después de que el controlador termine correctamente. OpenClaw conserva el botón de devolución de llamada cuando la política de entrada omite el texto o el procesamiento falla, para que el usuario pueda volver a intentarlo una vez que cambie la condición de bloqueo. Este campo de resultado es específico de Telegram; los demás canales conservan sus propios contratos de resultados interactivos.

### Enlaces del host para Plugins de flujo de trabajo

Los enlaces del host son los puntos de integración del SDK para los Plugins que necesitan participar en el ciclo de vida del host en lugar de limitarse a añadir un proveedor, canal o herramienta. Son contratos genéricos; el modo Plan puede utilizarlos, pero también pueden hacerlo los flujos de trabajo de aprobación, las barreras de políticas del espacio de trabajo, los monitores en segundo plano, los asistentes de configuración y los Plugins complementarios de la interfaz de usuario.

| Método                                                                               | Contrato del que es propietario                                                                                                                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Estado de sesión compatible con JSON y propiedad del Plugin, proyectado mediante sesiones del Gateway                                                                             |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Contexto duradero y de aplicación exactamente una vez, inyectado en el siguiente turno del agente para una sesión                                                                             |
| `api.registerTrustedToolPolicy(...)`                                                 | Política de herramientas de confianza previa al Plugin, controlada por el manifiesto, que puede bloquear o reescribir parámetros de herramientas                                                                        |
| `api.registerToolMetadata(...)`                                                      | Metadatos de visualización del catálogo de herramientas sin cambiar la implementación de la herramienta                                                                                     |
| `api.registerCommand(...)`                                                           | Comandos del Plugin con ámbito; los resultados de los comandos pueden establecer `continueAgent: true` o `suppressReply: true`; los comandos nativos de Discord admiten `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Descriptores de contribuciones a la interfaz de control para superficies de sesión, herramienta, ejecución, configuración o pestaña                                                                      |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Funciones de devolución de llamada de limpieza para recursos de ejecución propiedad del Plugin en rutas de restablecimiento, eliminación o recarga                                                                          |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Suscripciones a eventos saneados para el estado y los monitores del flujo de trabajo                                                                                              |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Estado temporal del Plugin por ejecución, borrado durante el ciclo de vida de finalización de la ejecución                                                                                             |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Metadatos de limpieza para trabajos del planificador propiedad del Plugin; no programa trabajo ni crea registros de tareas                                                            |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Entrega de archivos adjuntos, solo para Plugins integrados y mediada por el host, a la ruta activa de sesión saliente directa                                                            |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Turnos de sesión programados y respaldados por Cron, solo para Plugins integrados, además de limpieza basada en etiquetas                                                                                    |
| `api.session.controls.registerSessionAction(...)`                                    | Acciones de sesión tipadas que los clientes pueden enviar mediante el Gateway                                                                                             |

Un descriptor `surface: "tab"` añade una pestaña a la barra lateral de la interfaz de control. Los descriptores de pestañas de los
plugins activos se anuncian a los clientes del panel en el saludo del gateway
(`controlUiTabs`), por lo que la pestaña solo aparece mientras el Plugin está habilitado.
Los plugins integrados pueden incluir una vista de panel de primera clase para su pestaña; otros
plugins pueden establecer `path` en una ruta HTTP del Plugin (consulte
`api.registerHttpRoute(...)`) que el panel representa en un marco aislado.
`icon` es una sugerencia de nombre de icono del panel, `group` selecciona la sección de la barra lateral
(`control` o `agent`), `order` ordena las pestañas de Plugins y `requiredScopes`
oculta la pestaña de las conexiones que carezcan de esos ámbitos de operador:

Para una pestaña externa protegida por el gateway, registre el descriptor `path` bajo una
ruta HTTP `auth: "gateway"` del mismo Plugin. Tras la inicialización autenticada, el navegador obtiene una
concesión HttpOnly de corta duración, limitada a ese Plugin y a la raíz de la ruta, para que el
marco aislado pueda cargarse sin copiar el token de portador del Gateway en su URL
ni en JavaScript. El elemento principal autenticado renueva la concesión mientras la pestaña externa
está activa y antes de montarla tras la navegación o la reanudación del navegador. También
comprueba la concesión desde el mismo entorno aislado opaco antes del montaje, de modo que los
modos de privacidad del navegador que bloquean la cookie fallen de forma cerrada con un panel no disponible.
La concesión del marco solo acepta `GET` y `HEAD`, y siempre incluye
`operator.read`; `requiredScopes` controla la visibilidad de la pestaña, pero nunca amplía la
concesión de la cookie. Las mutaciones permanecen en superficies principales autenticadas explícitamente por el Gateway o
en superficies de portador. Las pestañas externas requieren HTTPS/Tailscale Serve o un
origen de bucle invertido en el que confíe el navegador; HTTP sin cifrar en un host de LAN muestra el
error de contexto seguro en lugar de montar un panel que no puede autenticarse.
El bloqueo completo de cookies de terceros también hace que las pestañas protegidas por el gateway no estén disponibles.
Como ocurre con todas las superficies nativas de Plugins, el marco permanece dentro del límite de confianza
del Plugin instalado; OpenClaw no trata los plugins instalados como entidades principales de seguridad
del navegador aisladas entre sí.
Las concesiones de cookies usan el límite del nombre de host del navegador, no el límite de su puerto. No
aloje conjuntamente servicios que no confíen entre sí en el nombre de host del Gateway, ni siquiera en otros
puertos.
Las pestañas respaldadas por autenticación administrada por el Plugin mantienen su comportamiento directo de iframe y no
solicitan ni requieren esta concesión del Gateway.

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "Registro",
  description: "Tu día como una línea temporal, creada a partir de capturas de pantalla.",
  icon: "sun",
  group: "control",
  requiredScopes: ["operator.write"],
});
```

Use los espacios de nombres agrupados para el código nuevo de Plugins:

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

Los métodos planos equivalentes siguen disponibles como alias de compatibilidad obsoletos
para los plugins existentes. No añada código nuevo de Plugins que invoque directamente
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` ni
`api.unscheduleSessionTurnsByTag`.

`scheduleSessionTurn(...)` es una utilidad práctica con ámbito de sesión sobre el planificador
Cron del Gateway. Cron controla la temporización y crea el registro de tarea en segundo plano cuando se
ejecuta el turno; el SDK de Plugins solo restringe la sesión de destino, la
nomenclatura propiedad del Plugin y la limpieza. Use `api.runtime.tasks.managedFlows` dentro del turno
programado cuando el propio trabajo necesite un estado duradero de Task Flow con varios pasos.

Los contratos dividen intencionadamente la autoridad:

- Los plugins externos pueden ser propietarios de extensiones de sesión, descriptores de interfaz, comandos, metadatos de
  herramientas, inyecciones para el siguiente turno y enlaces normales.
- Las políticas de herramientas de confianza se ejecutan antes que los enlaces `before_tool_call` ordinarios y son
  de confianza para el host. Las políticas integradas se ejecutan primero; las políticas de Plugins instalados requieren
  habilitación explícita y sus identificadores locales en
  `contracts.trustedToolPolicies`, y se ejecutan después en el orden de carga de los Plugins. Los identificadores de políticas
  se limitan al Plugin que los registra.
- La propiedad de comandos reservados es exclusiva de los Plugins integrados. Los plugins externos deben usar sus
  propios nombres de comando o alias.
- `allowPromptInjection=false` deshabilita los enlaces que modifican el prompt, incluidos
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`
  y `enqueueNextTurnInjection`.

Ejemplos de consumidores que no son de Plan:

| Arquetipo de Plugin             | Enlaces utilizados                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Flujo de trabajo de aprobación            | Extensión de sesión, continuación de comandos, inyección para el siguiente turno, descriptor de interfaz                                                            |
| Puerta de políticas de presupuesto/espacio de trabajo | Política de herramientas de confianza, metadatos de herramientas, proyección de sesión                                                                                 |
| Monitor del ciclo de vida en segundo plano | Limpieza del ciclo de vida de ejecución, suscripción a eventos del agente, propiedad/limpieza del planificador de sesiones, contribución al prompt de Heartbeat, descriptor de interfaz |
| Asistente de configuración o incorporación   | Extensión de sesión, comandos con ámbito, descriptor de la interfaz de control                                                                              |

<Note>
  Los espacios de nombres administrativos reservados del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) siempre permanecen como `operator.admin`, aunque un Plugin intente asignarles un
  ámbito de método del gateway más restringido. Se recomienda usar prefijos específicos del Plugin para los
  métodos propiedad del Plugin.
</Note>

<Accordion title="Cuándo usar middleware de resultados de herramientas">
  Los plugins integrados y los plugins instalados habilitados explícitamente con contratos de
  manifiesto coincidentes pueden usar `api.registerAgentToolResultMiddleware(...)` cuando
  necesiten reescribir el resultado de una herramienta después de la ejecución y antes de que el entorno de ejecución
  devuelva ese resultado al modelo. Esta es la interfaz de confianza e independiente del entorno de ejecución
  para reductores de salida asíncronos como tokenjuice.

Los plugins deben declarar `contracts.agentToolResultMiddleware` para cada entorno de ejecución
de destino, por ejemplo, `["openclaw", "codex"]`. Los plugins instalados sin ese
contrato, o sin habilitación explícita, no pueden registrar este middleware; mantenga
los enlaces normales de Plugins de OpenClaw para el trabajo que no necesite ejecutarse sobre el resultado de la herramienta antes del modelo.
Se ha eliminado la antigua
ruta de registro de fábrica de extensiones exclusiva del ejecutor integrado.
</Accordion>

### Registro de detección del Gateway

`api.registerGatewayDiscoveryService(...)` permite que un Plugin anuncie el
Gateway activo en un transporte de detección local, como mDNS/Bonjour. OpenClaw llama al
servicio durante el inicio del Gateway cuando la detección local está habilitada, transmite los
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

Los plugins de detección del Gateway no deben tratar los valores TXT anunciados como secretos ni como
autenticación. La detección es una sugerencia de enrutamiento; la autenticación del Gateway y la fijación de TLS siguen
controlando la confianza.

### Metadatos de registro de la CLI

`api.registerCli(registrar, opts?)` acepta dos tipos de metadatos de comandos:

- `commands`: nombres explícitos de comandos propiedad del registrador
- `descriptors`: descriptores de comandos en tiempo de análisis utilizados para la ayuda de la CLI,
  el enrutamiento y el registro diferido de la CLI del Plugin
- `parentPath`: ruta opcional del comando principal para grupos de comandos anidados, como
  `["nodes"]`

Para las funciones de nodos emparejados, se recomienda
`api.registerNodeCliFeature(registrar, opts?)`. Es un pequeño contenedor alrededor de
`api.registerCli(..., { parentPath: ["nodes"] })` y hace que comandos como
`openclaw nodes canvas` sean funciones de nodo que pertenecen explícitamente al Plugin.

Si se desea que un comando de Plugin permanezca con carga diferida en la ruta normal de la CLI raíz,
proporcione `descriptors` que abarque todas las raíces de comandos de nivel superior expuestas por ese
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
        description: "Manage Matrix accounts, verification, devices, and profile state",
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
        description: "Capture or render canvas content from a paired node",
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

`api.registerCliBackend(...)` permite que un Plugin controle la configuración predeterminada de un backend
local de CLI de IA, como `claude-cli` o `my-cli`.

- El backend `id` se convierte en el prefijo del proveedor en referencias de modelos como `my-cli/gpt-5`.
- El backend `config` usa la misma estructura que `agents.defaults.cliBackends.<id>`.
- La configuración del usuario sigue teniendo prioridad. OpenClaw combina `agents.defaults.cliBackends.<id>` sobre el valor predeterminado
  del Plugin antes de ejecutar la CLI.
- Use `normalizeConfig` cuando un backend necesite reescrituras de compatibilidad después de la combinación
  (por ejemplo, para normalizar formatos antiguos de indicadores).
- Use `resolveExecutionArgs` para reescrituras de argv específicas de la solicitud que pertenezcan
  al dialecto de la CLI, como asignar los niveles de razonamiento de OpenClaw a un indicador
  de esfuerzo nativo. El hook recibe `ctx.executionMode`; use `"side-question"` para añadir
  indicadores de aislamiento nativos del backend para llamadas efímeras a `/btw`. Si esos indicadores
  desactivan de forma fiable las herramientas nativas de una CLI que, de otro modo, siempre estarían activas, declare
  también `sideQuestionToolMode: "disabled"`.
- Use `prepareExecution` para el entorno de inicio controlado por el backend o para puentes
  temporales de autenticación/configuración. Su `ctx.contextTokenBudget` es el límite efectivo
  de tokens seleccionado para la ejecución, de modo que los backends con compactación nativa puedan alinear su
  propio umbral sin ramas del núcleo específicas del proveedor.
- Los backends que puedan desactivar todas las herramientas nativas para una ejecución específica pueden declarar
  `nativeToolMode: "selectable"`. Las llamadas restringidas pasan una tupla
  `ctx.toolAvailability.native` vacía junto con una lista de permitidos de MCP exacta y aislada del host;
  `resolveExecutionArgs` debe aplicar ambas en el argv final, ya sea nuevo o reanudado.
  OpenClaw aplica un cierre seguro si el backend no puede hacerlo.

Para consultar una guía de creación integral, consulte
[Plugins de backend de la CLI](/es/plugins/cli-backend-plugins).

### Espacios exclusivos

| Método                                     | Qué registra                                                                                                                                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motor de contexto (uno activo a la vez). Las devoluciones de llamada del ciclo de vida reciben `runtimeSettings` cuando el host puede proporcionar diagnósticos del modelo/proveedor/modo; los motores estrictos más antiguos se vuelven a intentar sin esa clave. |
| `api.registerMemoryCapability(capability)` | Capacidad de memoria unificada                                                                                                                                                                          |

### Adaptadores obsoletos de embeddings de memoria

| Método                                         | Qué registra                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embeddings de memoria para el Plugin activo |

- `registerMemoryCapability` es la API exclusiva del Plugin de memoria.
- `registerMemoryCapability` también puede exponer `publicArtifacts.listArtifacts(...)`
  para exportaciones gestionadas por el host. Los Plugins complementarios que enumeran esos
  artefactos declarados siguen usando `listActiveMemoryPublicArtifacts(...)` desde la fachada
  `openclaw/plugin-sdk/memory-host-core` conservada hasta que exista una API pública específica
  para consumidores; no deben acceder a la estructura privada de otro Plugin.
- `MemoryFlushPlan.model` puede fijar el turno de vaciado a una referencia `provider/model`
  exacta, como `ollama/qwen3:8b`, sin heredar la cadena de respaldo activa.
- `registerMemoryEmbeddingProvider` está obsoleto. Los nuevos proveedores de embeddings
  deben usar `api.registerEmbeddingProvider(...)` y
  `contracts.embeddingProviders`.
- Los proveedores existentes específicos de memoria siguen funcionando durante el período
  de migración, pero la inspección de Plugins informa de ello como deuda de compatibilidad para
  los Plugins no incluidos.

### Eventos y ciclo de vida

| Método                                       | Qué hace                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de ciclo de vida tipado          |
| `api.onConversationBindingResolved(handler)` | Devolución de llamada de vinculación de conversaciones |

Consulte [Hooks de Plugins](/es/plugins/hooks) para ver ejemplos, nombres habituales de hooks y
semántica de las protecciones.

### Semántica de decisión de los hooks

`before_install` es un hook del ciclo de vida del entorno de ejecución del Plugin, no la superficie de políticas
de instalación del operador. Use `security.installPolicy` cuando una decisión de permitir/bloquear deba
abarcar las rutas de instalación o actualización de la CLI y las respaldadas por el Gateway.

- `before_tool_call`: devolver `{ block: true }` es terminal. Cuando cualquier controlador lo establece, se omiten los controladores de menor prioridad.
- `before_tool_call`: devolver `{ block: false }` se considera que no hay decisión (igual que omitir `block`), no una anulación.
- `before_install`: devolver `{ block: true }` es terminal. Cuando cualquier controlador lo establece, se omiten los controladores de menor prioridad.
- `before_install`: devolver `{ block: false }` se considera que no hay decisión (igual que omitir `block`), no una anulación.
- `reply_dispatch`: devolver `{ handled: true, ... }` es terminal. Cuando cualquier controlador reclama el despacho, se omiten los controladores de menor prioridad y la ruta predeterminada de despacho del modelo.
- `message_sending`: devolver `{ cancel: true }` es terminal. Cuando cualquier controlador lo establece, se omiten los controladores de menor prioridad.
- `message_sending`: devolver `{ cancel: false }` se considera que no hay decisión (igual que omitir `cancel`), no una anulación.
- `message_received`: use el campo tipado `threadId` cuando necesite el enrutamiento de hilos/temas entrantes. Mantenga `metadata` para datos adicionales específicos del canal.
- `message_sending`: use los campos de enrutamiento tipados `replyToId` / `threadId` antes de recurrir a `metadata`, específico del canal.
- `gateway_start`: use `ctx.config`, `ctx.workspaceDir` y `ctx.getCron?.()` para el estado de inicio controlado por el Gateway, en lugar de depender de hooks internos `gateway:startup`. Cron podría seguir cargándose en este punto.
- `cron_reconciled`: reconstruya una proyección externa completa de Cron después del inicio o de la recarga del planificador. Incluye `reason` y el estado efectivo de `enabled`, incluido `enabled: false`, mientras que `ctx.getCron?.()` devuelve el planificador conciliado exacto. Pase `ctx.abortSignal` al trabajo de proyección duradero; se interrumpe cuando esa instantánea del planificador queda reemplazada o se cierra el Gateway.
- `cron_changed`: observe los cambios del ciclo de vida de Cron controlados por el Gateway. Los eventos `scheduled` y `removed` son indicaciones de conciliación posteriores a la confirmación, no un registro ordenado de cambios. El `event.nextRunAtMs` de un evento programado está ausente cuando el trabajo no tiene una próxima activación; un evento eliminado sigue incluyendo la instantánea del trabajo eliminado.

Los planificadores de activación externos deben aplicar antirrebote o agrupar los eventos `cron_changed`,
y después volver a leer la vista duradera completa desde el último planificador capturado por
`cron_reconciled`. No adopte el planificador de un contexto `cron_changed`: una
indicación desvinculada de un planificador anterior puede solaparse con una recarga posterior.

Use `cron_reconciled` como desencadenador de instantáneas completas para el estado duradero cargado durante
el inicio del Gateway o el reemplazo del planificador. No se reproduce en una recarga en caliente
exclusiva del Plugin. Los controladores de observación se ejecutan en paralelo y los
despachos que no esperan respuesta pueden solaparse, por lo que los consumidores no deben depender del orden de finalización de los eventos.
Mantenga OpenClaw como fuente de verdad para las comprobaciones de vencimiento y la ejecución.

Para consultar un adaptador de ejecución única con reemplazo duradero, reintentos/espera incremental y cierre
limpio, consulte [Proyección externa segura de Cron](/es/plugins/hooks#safe-external-cron-projection).

### Campos del objeto API

| Campo                    | Tipo                      | Descripción                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id. del Plugin                                                                                   |
| `api.name`               | `string`                  | Nombre para mostrar                                                                                |
| `api.version`            | `string?`                 | Versión del Plugin (opcional)                                                                   |
| `api.description`        | `string?`                 | Descripción del Plugin (opcional)                                                               |
| `api.source`             | `string`                  | Ruta de origen del Plugin                                                                          |
| `api.rootDir`            | `string?`                 | Directorio raíz del Plugin (opcional)                                                            |
| `api.config`             | `OpenClawConfig`          | Instantánea actual de la configuración (instantánea activa en memoria del entorno de ejecución cuando esté disponible)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuración específica del Plugin procedente de `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Ayudantes del entorno de ejecución](/es/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Registrador con ámbito (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carga actual; `"setup-runtime"` es la ventana ligera de inicio/configuración previa a la entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resuelve una ruta relativa a la raíz del Plugin                                                        |

## Convención de módulos internos

Dentro del Plugin, use archivos de barril locales para las importaciones internas:

```text
my-plugin/
  api.ts            # Exportaciones públicas para consumidores externos
  runtime-api.ts    # Exportaciones del entorno de ejecución solo para uso interno
  index.ts          # Punto de entrada del Plugin
  setup-entry.ts    # Entrada ligera solo para configuración (opcional)
```

<Warning>
  Nunca importe el propio Plugin mediante `openclaw/plugin-sdk/<your-plugin>`
  desde el código de producción. Encamine las importaciones internas mediante `./api.ts` o
  `./runtime-api.ts`. La ruta del SDK es únicamente el contrato externo.
</Warning>

Las superficies públicas de plugins incluidos cargadas mediante fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` y archivos de entrada públicos similares) prefieren la
instantánea activa de la configuración del entorno de ejecución cuando OpenClaw ya está en ejecución. Si aún no existe ninguna
instantánea del entorno de ejecución, recurren al archivo de configuración resuelto en el disco.
Las fachadas de plugins incluidos empaquetados deben cargarse mediante los cargadores de fachadas de
plugins de OpenClaw; las importaciones directas desde `dist/extensions/...` omiten las comprobaciones del manifiesto
y del componente auxiliar del entorno de ejecución que las instalaciones empaquetadas utilizan para el código propiedad del plugin.

Los plugins de proveedores pueden exponer un módulo de exportación de contrato local del plugin y de alcance limitado cuando un
componente auxiliar es intencionadamente específico del proveedor y aún no corresponde a una
subruta genérica del SDK. Ejemplos incluidos:

- **Anthropic**: interfaz pública `api.ts` / `contract-api.ts` para los
  componentes auxiliares del encabezado beta de Claude y del flujo `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` exporta constructores de proveedores,
  componentes auxiliares del modelo predeterminado y constructores de proveedores en tiempo real.
- **`@openclaw/openrouter-provider`**: `api.ts` exporta el constructor de proveedores
  junto con componentes auxiliares de incorporación y configuración.

<Warning>
  El código de producción de las extensiones también debe evitar las importaciones de `openclaw/plugin-sdk/<other-plugin>`.
  Si un componente auxiliar es realmente compartido, trasládelo a una subruta neutral del SDK,
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` u otra
  superficie orientada a capacidades, en lugar de acoplar dos plugins.
</Warning>

## Temas relacionados

<CardGroup cols={2}>
  <Card title="Puntos de entrada" icon="door-open" href="/es/plugins/sdk-entrypoints">
    Opciones de `definePluginEntry` y `defineChannelPluginEntry`.
  </Card>
  <Card title="Componentes auxiliares del entorno de ejecución" icon="gears" href="/es/plugins/sdk-runtime">
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
  <Card title="Aspectos internos de los plugins" icon="diagram-project" href="/es/plugins/architecture">
    Arquitectura detallada y modelo de capacidades.
  </Card>
</CardGroup>
