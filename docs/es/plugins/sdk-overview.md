---
read_when:
    - Necesita saber desde qué subruta del SDK importar.
    - Quiere una referencia de todos los métodos de registro de OpenClawPluginApi
    - Está buscando una exportación específica del SDK
sidebarTitle: Plugin SDK overview
summary: Mapa de importaciones, referencia de la API de registro y arquitectura del SDK
title: Descripción general del SDK de plugins
x-i18n:
    generated_at: "2026-07-21T09:06:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 353bcfa9a9ece30677601db275b9db9716a91a1ad33c335a8b11580a262e7d62
    source_path: plugins/sdk-overview.md
    workflow: 16
---

El SDK de plugins es el contrato tipado entre los plugins y el núcleo. Esta página es la
referencia sobre **qué importar** y **qué se puede registrar**.

<Note>
  Esta página está dirigida a autores de plugins que usan `openclaw/plugin-sdk/*` dentro de
  OpenClaw. Para aplicaciones externas, scripts, paneles, tareas de CI y extensiones de IDE
  que quieran ejecutar agentes mediante el Gateway, use en su lugar
  [Integraciones del Gateway para aplicaciones externas](/es/gateway/external-apps).
</Note>

<Tip>
¿Busca una guía práctica? Comience con [Creación de plugins](/es/plugins/building-plugins). Use [Plugins de canal](/es/plugins/sdk-channel-plugins) para canales, [Plugins de proveedor](/es/plugins/sdk-provider-plugins) para proveedores de modelos, [Plugins de backend de CLI](/es/plugins/cli-backend-plugins) para backends locales de CLI de IA, [Plugins de entorno de ejecución de agentes](/es/plugins/sdk-agent-harness) para ejecutores de agentes nativos y [Hooks de plugins](/es/plugins/hooks) para hooks de herramientas o del ciclo de vida.
</Tip>

## Convención de importación

Importe siempre desde una subruta específica:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subruta es un módulo pequeño y autónomo. Esto agiliza el inicio y
evita problemas de dependencias circulares. Para los asistentes de entrada/compilación
específicos de cada canal, prefiera `openclaw/plugin-sdk/channel-core`; reserve `openclaw/plugin-sdk/core` para
la superficie general más amplia y los asistentes compartidos, como
`buildChannelConfigSchema`.

Para la configuración de canales, publique el esquema JSON propiedad del canal mediante
`openclaw.plugin.json#channelConfigs`. La subruta `plugin-sdk/channel-config-schema`
está destinada a primitivas de esquema compartidas y al generador genérico. Los plugins
incluidos con OpenClaw usan `plugin-sdk/bundled-channel-config-schema` para los esquemas conservados
de los canales incluidos. Esa subruta de esquemas incluidos no es un patrón para plugins
nuevos.

<Warning>
  No importe interfaces prácticas asociadas a marcas de proveedores o canales (por ejemplo,
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Los plugins incluidos combinan subrutas genéricas del SDK dentro de sus propios módulos de exportación
  `api.ts` / `runtime-api.ts`; los consumidores del núcleo deben usar esos módulos de exportación
  locales del plugin o añadir un contrato genérico y limitado del SDK cuando una necesidad sea realmente
  común a varios canales.

Un pequeño conjunto de interfaces auxiliares de plugins incluidos sigue apareciendo en el mapa de exportaciones
generado cuando tiene un uso registrado por parte de sus propietarios. Solo existe para el mantenimiento
de los plugins incluidos y no constituye una ruta de importación recomendada para nuevos plugins
de terceros.

`openclaw/plugin-sdk/discord` y `openclaw/plugin-sdk/telegram-account` también se
mantienen como interfaces de compatibilidad obsoletas para usos registrados por sus propietarios. No
copie esas rutas de importación en plugins nuevos; use en su lugar asistentes de entorno de ejecución
inyectados y subrutas genéricas del SDK de canales.
</Warning>

## Referencia de subrutas

El SDK de plugins se presenta como un conjunto de subrutas específicas agrupadas por área (entrada
del plugin, canal, proveedor, autenticación, entorno de ejecución, capacidad, memoria y asistentes
reservados para plugins incluidos). Para consultar el catálogo completo, agrupado y con enlaces, consulte
[Subrutas del SDK de plugins](/es/plugins/sdk-subpaths).

El inventario de puntos de entrada del compilador se encuentra en
`scripts/lib/plugin-sdk-entrypoints.json`; las exportaciones públicas tipadas excluyen las
subrutas internas enumeradas en
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Las entradas de producción
de esa lista conservan exportaciones de entorno de ejecución del host solo para JavaScript destinadas a plugins oficiales
publicados por separado, mientras que las entradas exclusivas de pruebas permanecen sin exportar. Ejecute
`pnpm plugin-sdk:surface` para auditar el número de exportaciones públicas. Las
subrutas públicas obsoletas que tienen suficiente antigüedad y no se utilizan en el código de producción de las extensiones incluidas
se registran en `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; los módulos de exportación
amplios y obsoletos se registran en
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API de registro

La función de retorno `register(api)` recibe un objeto `OpenClawPluginApi` con estos
métodos:

Los plugins que proporcionan una superficie externa de chat de equipo para una sesión pueden registrar
el único proveedor para todo el proceso exportado por
`openclaw/plugin-sdk/session-discussion`. Su método `info({ sessionKey })`
indica si una conversación no está disponible, está lista para abrirse o ya está abierta;
`open({ sessionKey })` crea o resuelve la conversación y devuelve sus URL
incrustada y externa. Registrar otro proveedor sustituye al proveedor actual.

### Registro de capacidades

| Método                                           | Qué registra                                                                       |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | Inferencia de texto (LLM)                                                          |
| `api.registerWorkerProvider(...)`                | Arrendamientos del ciclo de vida de trabajadores en la nube                        |
| `api.registerModelCatalogProvider(...)`          | Filas del catálogo de modelos para generación de texto y contenido multimedia      |
| `api.registerAgentHarness(...)`                  | Ejecutor de agentes nativo [experimental](/es/plugins/sdk-agent-harness) (Codex, Copilot) |
| `api.registerCliBackend(...)`                    | Backend local de inferencia mediante CLI                                           |
| `api.registerChannel(...)`                       | Canal de mensajería                                                                |
| `api.registerEmbeddingProvider(...)`             | Proveedor reutilizable de incrustaciones vectoriales                               |
| `api.registerSpeechProvider(...)`                | Síntesis de texto a voz / STT                                                      |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcripción en tiempo real mediante streaming                                    |
| `api.registerRealtimeVoiceProvider(...)`         | Sesiones de voz dúplex en tiempo real                                              |
| `api.registerMediaUnderstandingProvider(...)`    | Análisis de imágenes, audio y vídeo                                                |
| `api.registerTranscriptSourceProvider(...)`      | Fuente de transcripciones de reuniones en directo o importadas                     |
| `api.registerImageGenerationProvider(...)`       | Generación de imágenes                                                             |
| `api.registerMusicGenerationProvider(...)`       | Generación de música                                                               |
| `api.registerVideoGenerationProvider(...)`       | Generación de vídeo                                                                |
| `api.registerWebFetchProvider(...)`              | Proveedor de obtención / extracción web                                            |
| `api.registerWebSearchProvider(...)`             | Búsqueda web                                                                       |
| `api.registerCompactionProvider(...)`            | Backend conectable de compactación de transcripciones                              |

Los proveedores de trabajadores también deben declarar su identificador en `contracts.workerProviders`.
El núcleo conserva la intención duradera antes de `provision(profile, operationId)`. Los proveedores validan la configuración antes de la asignación externa y lanzan `WorkerProviderError` cuando se rechaza permanentemente un perfil. `provision` debe adoptar el mismo arrendamiento cuando se repite el identificador de la operación.
El núcleo conserva con el arrendamiento la configuración validada del perfil y proporciona esa instantánea a `destroy({ leaseId, profile })`, que debe ser idempotente, y a `inspect({ leaseId, profile })`, que devuelve `active`, `destroyed` o `unknown`. Esto permite a los proveedores encaminar las llamadas del ciclo de vida después de reiniciar el Gateway o eliminar un perfil con nombre. Los endpoints SSH usan un `SecretRef` para `keyRef`, nunca material de claves en línea, e incluyen un `hostKey` de la salida de aprovisionamiento de confianza exactamente como `algorithm base64`, sin nombre de host ni comentario. El núcleo fija `hostKey` y nunca confía en una clave de la primera conexión. Un proveedor que emita un `keyRef` dinámico puede implementar `resolveSshIdentity({ leaseId, profile, keyRef })`; cuando está presente, ese solucionador es autoritativo, mientras que los proveedores que no lo tienen usan el solucionador genérico de secretos configurado.
Los proveedores con arrendamientos renovables también pueden implementar `renew(leaseId)`.
`inspect` debe lanzar una excepción ante fallos transitorios o indeterminados; devuelva `unknown` únicamente cuando exista una ausencia autoritativa. El núcleo marca como huérfano un registro local activo o interpreta la ausencia como la finalización del desmontaje después de una solicitud de destrucción persistida.

Los proveedores de incrustaciones registrados con `api.registerEmbeddingProvider(...)` también deben
figurar en `contracts.embeddingProviders` en el manifiesto del plugin. Esta
es la superficie genérica de incrustaciones para generar vectores reutilizables. La búsqueda en
memoria puede utilizar esta superficie genérica de proveedores. La antigua interfaz
`api.registerMemoryEmbeddingProvider(...)` y
`contracts.memoryEmbeddingProviders` se mantiene como compatibilidad obsoleta mientras
migran los proveedores existentes específicos de memoria.

Los proveedores específicos de memoria que todavía exponen un `batchEmbed(...)` en tiempo de ejecución permanecen en
el contrato existente de procesamiento por lotes por archivo, salvo que su entorno de ejecución establezca explícitamente
`sourceWideBatchEmbed: true`. Esta activación permite que el host de memoria envíe fragmentos de
varios archivos de memoria modificados y fuentes habilitadas en una sola llamada a `batchEmbed(...)`,
hasta los límites de lote del host. Los adaptadores de lotes que cargan archivos de solicitudes JSONL deben
dividir las tareas del proveedor antes de alcanzar tanto su límite de tamaño de carga como su límite de cantidad
de solicitudes. El proveedor debe devolver una incrustación por cada fragmento de entrada y en el mismo orden que
`batch.chunks`; omita la opción cuando el proveedor espere lotes locales por archivo o
no pueda conservar el orden de entrada en una tarea más amplia que abarque toda la fuente.

### Herramientas y comandos

Use [`defineToolPlugin`](/es/plugins/tool-plugins) para plugins sencillos que solo contengan herramientas
con nombres de herramienta fijos. Use `api.registerTool(...)` directamente para plugins mixtos
o para registrar herramientas de forma completamente dinámica.

| Método                                 | Qué registra                                                                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerTool(tool, opts?)`        | Herramienta del agente (obligatoria o `{ optional: true }`)                                                                              |
| `api.registerCommand(def)`             | Comando personalizado (omite el LLM)                                                                                                       |
| `api.registerNodeHostCommand(command)` | Comando gestionado por `openclaw node run`; los metadatos opcionales `agentTool` pueden mostrarlo como herramienta visible para el agente mientras el nodo esté conectado |

Los comandos de plugins pueden establecer `agentPromptGuidance` cuando el agente necesite una indicación breve
de enrutamiento propia del comando. Mantenga ese texto centrado en el propio comando; no añada
políticas específicas del proveedor o del plugin a los generadores de prompts del núcleo.

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
de `openclaw_main`. Omita `surfaces` cuando la orientación se aplique intencionadamente a todas las superficies. No
pase un arreglo `surfaces` vacío; se rechaza para evitar que una pérdida accidental de ámbito
convierta el texto en un prompt global.

Las instrucciones para desarrolladores del servidor de aplicaciones nativo de Codex son más estrictas que las de otras superficies de
prompts: solo se promueve a ese nivel de mayor prioridad la orientación cuyo ámbito se haya establecido explícitamente en `codex_app_server`.
Las cadenas de orientación heredadas y la orientación estructurada sin ámbito siguen disponibles
para superficies de prompts que no sean de Codex por motivos de compatibilidad.

Los comandos del host Node se ejecutan en el host Node conectado, no dentro del
proceso del Gateway. Si `agentTool` está presente, el Node publica un descriptor tras una
conexión correcta con el Gateway; el Gateway lo expone a las ejecuciones del agente solo mientras ese
Node esté conectado y únicamente si el `command` del descriptor está en la superficie de
comandos aprobados del Node. Establezca `agentTool.defaultPlatforms` para incluir un
comando no peligroso en la lista de permitidos predeterminada de comandos del Node; de lo contrario, se requiere
`gateway.nodes.allowCommands` explícito o una política de invocación del Node. `agentTool.name`
debe ser seguro para el proveedor: debe comenzar con una letra, usar únicamente letras, dígitos,
guiones bajos o guiones, y no superar los 64 caracteres. Las herramientas del Node respaldadas por MCP
pueden establecer metadatos `agentTool.mcp` para que las superficies del catálogo y de búsqueda de herramientas muestren
la identidad remota del servidor o la herramienta MCP, pero la ejecución sigue pasando por el
comando anunciado del Node.

### Infraestructura

| Método                                          | Qué registra                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------ |
| `api.registerHook(events, handler, opts?)`      | Enlace de evento                                                         |
| `api.registerHttpRoute(params)`                 | Endpoint HTTP del Gateway                                                |
| `api.registerGatewayMethod(name, handler)`      | Método RPC del Gateway                                                   |
| `api.registerGatewayDiscoveryService(service)`  | Anunciante de detección local del Gateway                                |
| `api.registerCli(registrar, opts?)`             | Subcomando de la CLI                                                     |
| `api.registerNodeCliFeature(registrar, opts?)`  | CLI de función del Node bajo `openclaw nodes`                                |
| `api.registerService(service)`                  | Servicio en segundo plano                                                |
| `api.registerInteractiveHandler(registration)`  | Controlador interactivo                                                  |
| `api.registerAgentToolResultMiddleware(...)`    | Middleware de resultados de herramientas en tiempo de ejecución          |
| `api.registerMemoryPromptSupplement(builder)`   | Sección aditiva del prompt relacionada con la memoria                    |
| `api.registerMemoryPromptPreparation(prepare)`  | Preparación asíncrona de una sección del prompt relacionada con la memoria |
| `api.registerMemoryCorpusSupplement(adapter)`   | Corpus aditivo de búsqueda y lectura de memoria                          |
| `api.registerHostedMediaResolver(resolver)`     | Resolutor de URL de medios alojados de tipo navegador                    |
| `api.registerMcpServerConnectionResolver(...)`  | Transporte MCP por solicitante (`url`/`headers`) para un nombre de servidor estático |
| `api.registerTextTransforms(transforms)`        | Reescrituras de texto de compatibilidad de prompts y mensajes propiedad del Plugin |
| `api.registerConfigMigration(migrate)`          | Migración ligera de configuración ejecutada antes de cargar el entorno de ejecución del Plugin |
| `api.registerMigrationProvider(provider)`       | Importador de `openclaw migrate`                                        |
| `api.registerAutoEnableProbe(probe)`            | Sondeo de configuración que puede habilitar automáticamente este Plugin |
| `api.registerReload(registration)`              | Política de prefijos de configuración de reinicio/en caliente/sin operación para gestionar recargas |
| `api.registerNodeHostCommand(command)`          | Controlador de comandos expuesto a Nodes emparejados                     |
| `api.registerNodeInvokePolicy(policy)`          | Política de lista de permitidos/aprobación para comandos invocados por Nodes |
| `api.registerSecurityAuditCollector(collector)` | Recopilador de hallazgos para `openclaw security audit`                       |

#### Trabajo de Webhook posterior a la confirmación

Las rutas de Webhook que confirman una solicitud antes de que finalice el procesamiento deben trasladar
ese trabajo desacoplado a su propia raíz de admisión supervisada:

```typescript
import { runDetachedWebhookWork } from "openclaw/plugin-sdk/webhook-request-guards";

void runDetachedWebhookWork(() => processWebhookEvent(event)).catch((error) => {
  runtime.error?.(`falló el envío del webhook: ${String(error)}`);
});
```

Llame a `runDetachedWebhookWork(...)` de forma síncrona mientras la solicitud HTTP siga
admitida. El auxiliar reserva de inmediato una raíz independiente y, a continuación, inicia la
función de retorno en la siguiente microtarea para que el controlador de solicitudes pueda escribir primero su
confirmación. La promesa devuelta adopta el resultado de la función de retorno; las entidades que realizan la llamada
siguen siendo responsables de gestionar el rechazo. Esto mantiene aceptado el trabajo de la cola posterior a la confirmación y hace
que los drenajes por reinicio o suspensión esperen a que termine. Los controladores que esperan a que finalice todo el procesamiento
antes de devolver el resultado no necesitan este auxiliar.

#### Conexiones MCP con ámbito de solicitante

Mantenga estática la **identidad** del servidor MCP (nombre y filtro de herramientas) en `mcp.servers` o en un
manifiesto de paquete. De manera opcional, registre un resolutor de conexión para que cada
solicitante de mensajes de confianza obtenga su propio transporte:

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

- El contexto del resolutor contiene únicamente la identidad de confianza del host (`requesterSenderId`,
  con `agentAccountId` / `messageChannel` opcionales). Los campos de confianza futuros (por
  ejemplo, el contexto de usuario de Cron/subagente) pueden añadirse de forma aditiva.
- Un Plugin posee un nombre de servidor: un
  `registerMcpServerConnectionResolver` duplicado para el mismo `serverName` procedente de otro
  Plugin se rechaza con un diagnóstico de error (prevalece el primer registro), por lo que
  la propiedad de la conexión nunca depende del orden de carga de los Plugins.
- Los nombres de las herramientas se derivan del conjunto completo de servidores declarados, por lo que una resolución parcial
  nunca cambia los nombres seguros de los servidores entre solicitantes o turnos. El núcleo no
  verifica que los distintos endpoints de los solicitantes proporcionen esquemas de herramientas idénticos; un
  resolutor debe dirigir a todos los solicitantes al mismo servicio lógico, o los
  esquemas de herramientas (y la estabilidad de la caché del prompt) divergirán según el solicitante.
- Las ejecuciones sin un `requesterSenderId` de confianza (Cron, subagente, Heartbeat, Gateway
  público) nunca materializan servidores con ámbito de solicitante. No existe ninguna
  conexión alternativa compartida.
- `resolve` tiene un límite de 10 segundos por servidor; si se agota el tiempo de espera o se produce una excepción, se omite ese
  servidor durante la ejecución sin que falle el MCP estático.
- Las conexiones resueltas se vuelven a validar como máximo cada 5 minutos por solicitante:
  la rotación reconstruye el transporte con credenciales nuevas, y un resultado `null`
  lo revoca (el entorno de ejecución en caché se elimina incluso en mitad de la sesión). Por lo tanto, una credencial
  revocada o rotada puede seguir utilizándose durante un máximo de 5 minutos.
- Los `headers` resueltos nunca se registran ni se conservan; el núcleo solo mantiene un resumen con clave
  efímero en memoria (HMAC local del proceso) para detectar la rotación de credenciales y
  registra los valores de credenciales resueltos de encabezados/URL en el registro de
  ocultación de registros y capturas de depuración.
- Los servidores con ámbito de solicitante no generan vistas de aplicaciones MCP: una vista sobrevive a la
  ejecución autenticada del solicitante y el límite de vistas del Gateway no contiene la identidad del
  solicitante, por lo que las vistas previas de las aplicaciones permanecen cerradas de forma segura para estos servidores. Los resultados de las herramientas
  no se ven afectados.
- Los servidores estáticos sin resolutor conservan el ciclo de vida existente con ámbito de sesión.
- **Regla de entrega del entorno:** los servidores con ámbito de solicitante nunca entran en la configuración
  del cliente MCP nativo del entorno (hilo de Codex `mcp_servers`, CLI `-c mcp_servers=…` ni ninguna
  otra proyección MCP compartida durante la sesión). En su lugar, los entornos los entregan como
  herramientas con ámbito de ejecución:
  - Ejecutor integrado: entorno de ejecución MCP de sesión + herramientas del paquete (estáticas + con ámbito).
  - Servidor de aplicaciones de Codex: herramientas dinámicas mediante
    `materializeRequesterScopedMcpToolsForHarnessRun` (solo con ámbito; los servidores
    estáticos permanecen en el cliente MCP nativo de Codex).
- Las **especificaciones** de las herramientas con ámbito permanecen estables durante la sesión tras la primera resolución correcta en
  esa sesión, por lo que los entornos con hilos compartidos (Codex) no rotan los hilos cuando
  cambia el remitente. Antes de que se resuelva ningún solicitante, no se anuncia ninguna especificación con ámbito.
- Los solicitantes no autenticados en un entorno con hilos compartidos siguen viendo las herramientas con ámbito
  anunciadas; al llamar a una, se devuelve un error claro de herramienta no conectada para ese
  solicitante. OpenClaw nunca recurre a las credenciales de otro solicitante.

Los generadores de complementos de prompts de memoria reciben el contexto opcional `agentId`,
`agentSessionKey` y `sandboxed`. Las llamadas `search`
y `get` del complemento del corpus de memoria reciben el contexto opcional `agentId` y `sandboxed`. Los Plugins con
almacenamiento propiedad del agente deben resolver ese almacenamiento en cada llamada en lugar de
capturar una ruta global durante el registro. Si se requiere un id. de agente, pero
falta en una operación multiagente, se debe aplicar un cierre seguro en lugar de elegir un
agente arbitrario.

Use `registerMemoryPromptPreparation(...)` cuando el texto del prompt dependa del estado asíncrono
del Plugin. La función de retorno se ejecuta una vez antes de cada prompt completo del agente y recibe
el mismo contexto de herramientas, agente, sesión y entorno aislado que los generadores síncronos de
prompts de memoria. Valide la instancia actual propietaria del almacenamiento antes de cargar el estado
persistente y, a continuación, devuelva únicamente las líneas correspondientes a esa ejecución. OpenClaw inmoviliza esas líneas y
entrega el resultado inmutable al ensamblado síncrono del prompt. Mantenga la persistencia,
la sustitución atómica y la eliminación al retirar al propietario dentro del Plugin propietario; no
sondee ni lea archivos desde un generador de prompts.

Los controladores interactivos de Telegram pueden devolver `{ submitText }` para dirigir el texto a través de
la ruta normal de entrada del agente de Telegram después de que el controlador finalice correctamente. OpenClaw conserva
el botón de devolución de llamada cuando la política de entrada omite el texto o falla el procesamiento, para que
el usuario pueda volver a intentarlo después de que cambie la condición de bloqueo. Este campo de resultado es
específico de Telegram; los demás canales mantienen sus propios contratos de resultados interactivos.

### Enlaces del host para Plugins de flujo de trabajo

Los enlaces del host son los puntos de integración del SDK para los Plugins que necesitan participar en el ciclo de vida
del host en lugar de limitarse a añadir un proveedor, canal o herramienta. Son
contratos genéricos; el modo Plan puede utilizarlos, al igual que los flujos de trabajo de aprobación,
las puertas de políticas del espacio de trabajo, los monitores en segundo plano, los asistentes de configuración y los Plugins
complementarios de interfaz de usuario.

| Método                                                                               | Contrato que controla                                                                                                                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Estado de sesión propiedad del Plugin, compatible con JSON y proyectado mediante sesiones del Gateway                                                                             |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Contexto duradero de ejecución exactamente una vez, inyectado en el siguiente turno del agente para una sesión                                                                             |
| `api.registerTrustedToolPolicy(...)`                                                 | Política de herramientas de confianza previa al Plugin, controlada por el manifiesto, que puede bloquear o reescribir parámetros de herramientas                                                                        |
| `api.registerToolMetadata(...)`                                                      | Metadatos de visualización del catálogo de herramientas sin cambiar la implementación de la herramienta                                                                                     |
| `api.registerCommand(...)`                                                           | Comandos de Plugin con ámbito definido; los resultados de los comandos pueden establecer `continueAgent: true` o `suppressReply: true`; los comandos nativos de Discord admiten `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Descriptores de contribución a la interfaz de control para superficies de sesión, herramienta, ejecución, configuración o pestaña                                                                      |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Retrollamadas de limpieza para recursos de tiempo de ejecución propiedad del Plugin en rutas de restablecimiento, eliminación o recarga                                                                          |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Suscripciones a eventos saneados para el estado y los monitores del flujo de trabajo                                                                                              |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Estado temporal del Plugin por ejecución, eliminado durante el ciclo de vida terminal de la ejecución                                                                                             |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Metadatos de limpieza para trabajos del programador propiedad del Plugin; no programa trabajo ni crea registros de tareas                                                            |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Entrega de archivos adjuntos mediada por el host y exclusiva de plugins incluidos, hacia la ruta de sesión saliente directa activa                                                            |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Turnos de sesión programados respaldados por Cron y exclusivos de plugins incluidos, además de limpieza basada en etiquetas                                                                                    |
| `api.session.controls.registerSessionAction(...)`                                    | Acciones de sesión tipadas que los clientes pueden enviar mediante el Gateway                                                                                             |

Un descriptor `surface: "tab"` añade una pestaña a la barra lateral de la interfaz de control. Los descriptores de pestañas de los
plugins activos se anuncian a los clientes del panel en el saludo del gateway
(`controlUiTabs`), por lo que la pestaña solo aparece mientras el Plugin está habilitado.
Los plugins incluidos pueden proporcionar una vista de panel de primera clase para su pestaña; otros
plugins pueden establecer `path` en una ruta HTTP del Plugin (véase
`api.registerHttpRoute(...)`) que el panel representa en un marco aislado.
`icon` es una sugerencia de nombre de icono del panel, `group` selecciona la sección de la barra lateral
(`control` o `agent`), `order` ordena las pestañas de plugins y `requiredScopes`
oculta la pestaña para las conexiones que carezcan de esos ámbitos de operador:

Para una pestaña externa protegida por el gateway, registre el descriptor `path` en una
ruta HTTP `auth: "gateway"` del mismo Plugin. Tras el arranque autenticado, el navegador obtiene una
concesión HttpOnly de corta duración, limitada a ese Plugin y a la raíz de la ruta, para que el
marco aislado pueda cargarse sin copiar el token de portador del Gateway en su URL
ni en JavaScript. El elemento principal autenticado renueva la concesión mientras la pestaña externa
está activa y antes de montarla después de una navegación o de reanudar el navegador. También
comprueba la concesión desde el mismo entorno aislado opaco antes del montaje, por lo que los modos de
privacidad del navegador que bloquean la cookie producen un cierre seguro con un panel no disponible.
La concesión del marco acepta únicamente `GET` y `HEAD` y siempre incluye
`operator.read`; `requiredScopes` controla la visibilidad de la pestaña, pero nunca amplía la
concesión de la cookie. Las mutaciones permanecen en superficies principales autenticadas explícitamente mediante el Gateway o
en superficies de portador. Las pestañas externas requieren HTTPS/Tailscale Serve o un
origen de bucle invertido de confianza para el navegador; HTTP sin cifrar en un host de la LAN muestra el
error de contexto seguro en lugar de montar un panel que no puede autenticarse.
El bloqueo total de cookies de terceros también hace que las pestañas protegidas por el gateway no estén disponibles.
Como ocurre con todas las superficies nativas de plugins, el marco permanece dentro del
límite de confianza del Plugin instalado; OpenClaw no considera los plugins instalados
principales de seguridad del navegador aislados entre sí.
Las concesiones de cookies usan el límite del nombre de host del navegador, no el límite de sus puertos. No
aloje conjuntamente servicios que no confíen entre sí en el nombre de host del Gateway, ni siquiera en otros
puertos.
Las pestañas respaldadas por autenticación gestionada por el Plugin conservan su comportamiento directo de iframe y no
solicitan ni requieren esta concesión del Gateway.

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "Registro",
  description: "Su día como una cronología, creada a partir de capturas de pantalla.",
  icon: "sun",
  group: "control",
  requiredScopes: ["operator.write"],
});
```

Use los espacios de nombres agrupados para el código nuevo de plugins:

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
obsoletos para los plugins existentes. No añada código nuevo de plugins que invoque directamente
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` o
`api.unscheduleSessionTurnsByTag`.

`scheduleSessionTurn(...)` es una utilidad limitada a la sesión sobre el
programador Cron del Gateway. Cron controla la temporización y crea el registro de tarea en segundo plano cuando se
ejecuta el turno; el SDK de Plugin solo restringe la sesión de destino, la
nomenclatura propiedad del Plugin y la limpieza. Use `api.runtime.tasks.managedFlows` dentro del turno
programado cuando el propio trabajo necesite un estado duradero de flujo de tareas de varios pasos.

Los contratos dividen la autoridad de forma intencionada:

- Los plugins externos pueden controlar extensiones de sesión, descriptores de interfaz, comandos, metadatos de
  herramientas, inyecciones para el siguiente turno y hooks normales.
- Las políticas de herramientas de confianza se ejecutan antes que los hooks `before_tool_call`
  normales y cuentan con la confianza del host. Las políticas incluidas se ejecutan primero; las políticas de plugins instalados requieren
  habilitación explícita, además de sus identificadores locales en
  `contracts.trustedToolPolicies`, y se ejecutan después según el orden de carga de los plugins. Los identificadores de políticas
  se limitan al Plugin que los registra.
- La propiedad de comandos reservados es exclusiva de los plugins incluidos. Los plugins externos deben usar sus
  propios nombres de comandos o alias.
- `allowPromptInjection=false` deshabilita los hooks que modifican prompts, incluidos
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`
  y `enqueueNextTurnInjection`.

Ejemplos de consumidores que no son de Plan:

| Arquetipo de Plugin             | Hooks utilizados                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Flujo de trabajo de aprobación            | Extensión de sesión, continuación de comandos, inyección para el siguiente turno, descriptor de interfaz                                                            |
| Puerta de políticas de presupuesto o espacio de trabajo | Política de herramientas de confianza, metadatos de herramientas, proyección de sesión                                                                                 |
| Monitor del ciclo de vida en segundo plano | Limpieza del ciclo de vida del tiempo de ejecución, suscripción a eventos del agente, propiedad y limpieza del programador de sesiones, contribución al prompt de Heartbeat, descriptor de interfaz |
| Asistente de configuración o incorporación   | Extensión de sesión, comandos con ámbito definido, descriptor de la interfaz de control                                                                              |

<Note>
  Los espacios de nombres administrativos reservados del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) siempre permanecen `operator.admin`, incluso si un Plugin intenta asignar un
  ámbito de método del gateway más limitado. Se recomienda usar prefijos específicos del Plugin para los
  métodos propiedad del Plugin.
</Note>

<Accordion title="Cuándo usar middleware de resultados de herramientas">
  Los plugins incluidos y los plugins instalados habilitados explícitamente con contratos
  de manifiesto coincidentes pueden usar `api.registerAgentToolResultMiddleware(...)` cuando
  necesiten reescribir el resultado de una herramienta después de la ejecución y antes de que el tiempo de ejecución
  devuelva ese resultado al modelo. Esta es la interfaz de confianza e independiente del tiempo de ejecución
  para reductores de salida asíncronos como tokenjuice.

Los plugins deben declarar `contracts.agentToolResultMiddleware` para cada tiempo de ejecución
de destino, por ejemplo, `["openclaw", "codex"]`. Los plugins instalados sin ese
contrato, o sin habilitación explícita, no pueden registrar este middleware; mantenga
los hooks normales de plugins de OpenClaw para trabajos que no necesiten procesar el resultado de la herramienta
antes de devolverlo al modelo. Se ha eliminado la antigua
ruta de registro de fábricas de extensiones exclusiva del ejecutor integrado.
</Accordion>

### Registro de detección del Gateway

`api.registerGatewayDiscoveryService(...)` permite que un Plugin anuncie el
Gateway activo en un transporte de detección local como mDNS/Bonjour. OpenClaw llama al
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

Los plugins de detección del Gateway no deben tratar los valores TXT anunciados como secretos ni como
autenticación. La detección es una sugerencia de enrutamiento; la autenticación del Gateway y la fijación de TLS siguen
controlando la confianza.

### Metadatos de registro de la CLI

`api.registerCli(registrar, opts?)` acepta dos tipos de metadatos de comandos:

- `commands`: nombres de comandos explícitos propiedad del registrador
- `descriptors`: descriptores de comandos durante el análisis utilizados para la ayuda de la CLI,
  el enrutamiento y el registro diferido de la CLI del Plugin
- `parentPath`: ruta opcional del comando principal para grupos de comandos anidados, como
  `["nodes"]`

Para funciones de nodos emparejados, se recomienda usar
`api.registerNodeCliFeature(registrar, opts?)`. Es un pequeño contenedor alrededor de
`api.registerCli(..., { parentPath: ["nodes"] })` y hace explícitos comandos como
`openclaw nodes canvas` como funciones de Node propiedad del Plugin.

Si se desea que un comando de Plugin siga cargándose de forma diferida en la ruta normal de la CLI raíz,
proporcione `descriptors` que cubran todas las raíces de comandos de nivel superior expuestas por ese
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
        description: "Gestionar cuentas, verificaciones, dispositivos y estado del perfil de Matrix",
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

- El `id` del backend se convierte en el prefijo del proveedor en referencias de modelos como `my-cli/gpt-5`.
- El `config` del backend usa la misma estructura que `agents.defaults.cliBackends.<id>`.
- La configuración del usuario sigue teniendo prioridad. OpenClaw combina `agents.defaults.cliBackends.<id>` con el valor predeterminado
  del plugin antes de ejecutar la CLI.
- Use `normalizeConfig` cuando un backend necesite reescrituras de compatibilidad después de la combinación
  (por ejemplo, para normalizar estructuras antiguas de indicadores).
- Use `resolveExecutionArgs` para reescrituras de argv con ámbito de solicitud que pertenezcan
  al dialecto de la CLI, como asignar los niveles de razonamiento de OpenClaw a un indicador nativo
  de esfuerzo. El hook recibe `ctx.executionMode`; use `"side-question"` para añadir
  indicadores de aislamiento nativos del backend para llamadas efímeras de `/btw`. Si esos indicadores
  deshabilitan de forma fiable las herramientas nativas de una CLI que, de otro modo, las tendría siempre activadas, declare
  también `sideQuestionToolMode: "disabled"`.
- Use `prepareExecution` para el entorno de inicio controlado por el backend o para puentes temporales
  de autenticación/configuración. Su `ctx.contextTokenBudget` es el límite efectivo de tokens
  seleccionado para la ejecución, de modo que los backends con Compaction nativa puedan alinear su
  propio umbral sin ramas del núcleo específicas del proveedor.
- Los backends que puedan deshabilitar todas las herramientas nativas para una ejecución específica pueden declarar
  `nativeToolMode: "selectable"`. Las llamadas restringidas pasan una tupla
  `ctx.toolAvailability.native` vacía junto con una lista de permitidos de MCP exacta y aislada del host;
  `resolveExecutionArgs` debe aplicar ambas condiciones al argv final de una ejecución nueva o reanudada.
  OpenClaw aplica un cierre seguro si el backend no puede hacerlo.

Para consultar una guía de creación integral, véase
[plugins de backend de la CLI](/es/plugins/cli-backend-plugins).

### Espacios exclusivos

| Método                                     | Qué registra                                                                                                                                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motor de contexto (uno activo a la vez). Las devoluciones de llamada del ciclo de vida reciben `runtimeSettings` cuando el host puede proporcionar diagnósticos de modelo/proveedor/modo; los motores estrictos antiguos se vuelven a intentar sin esa clave. |
| `api.registerMemoryCapability(capability)` | Capacidad de memoria unificada                                                                                                                                                                          |

### Adaptadores obsoletos de incrustación de memoria

| Método                                         | Qué registra                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de incrustación de memoria para el plugin activo |

- `registerMemoryCapability` es la API exclusiva del plugin de memoria.
- `registerMemoryCapability` también puede exponer `publicArtifacts.listArtifacts(...)`
  para exportaciones gestionadas por el host. Los plugins complementarios que enumeran esos
  artefactos declarados siguen usando `listActiveMemoryPublicArtifacts(...)` desde la fachada
  `openclaw/plugin-sdk/memory-host-core` conservada hasta que exista una API pública
  específica para consumidores; no deben acceder a la estructura privada de otro plugin.
- `MemoryFlushPlan.model` puede fijar el turno de vaciado a una referencia `provider/model`
  exacta, como `ollama/qwen3:8b`, sin heredar la cadena de respaldo activa.
- `registerMemoryEmbeddingProvider` está obsoleto. Los nuevos proveedores de incrustaciones
  deben usar `api.registerEmbeddingProvider(...)` y
  `contracts.embeddingProviders`.
- Los proveedores existentes específicos de memoria siguen funcionando durante el período
  de migración, pero la inspección de plugins lo notifica como deuda de compatibilidad para
  los plugins no incluidos.

### Eventos y ciclo de vida

| Método                                       | Qué hace                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de ciclo de vida con tipos          |
| `api.onConversationBindingResolved(handler)` | Devolución de llamada para la vinculación de conversaciones |

Consulte [Hooks de plugins](/es/plugins/hooks) para ver ejemplos, nombres comunes de hooks y semántica
de las protecciones.

### Semántica de las decisiones de hooks

`before_install` es un hook del ciclo de vida del entorno de ejecución de plugins, no la superficie de políticas
de instalación del operador. Use `security.installPolicy` cuando una decisión de permitir/bloquear deba
abarcar las rutas de instalación o actualización de la CLI y las respaldadas por el Gateway.

- `before_tool_call`: devolver `{ block: true }` es definitivo. Una vez que cualquier controlador lo establece, se omiten los controladores de menor prioridad.
- `before_tool_call`: devolver `{ block: false }` se considera que no hay decisión (igual que omitir `block`), no una anulación.
- `before_install`: devolver `{ block: true }` es definitivo. Una vez que cualquier controlador lo establece, se omiten los controladores de menor prioridad.
- `before_install`: devolver `{ block: false }` se considera que no hay decisión (igual que omitir `block`), no una anulación.
- `reply_dispatch`: devolver `{ handled: true, ... }` es definitivo. Una vez que cualquier controlador asume el despacho, se omiten los controladores de menor prioridad y la ruta predeterminada de despacho del modelo.
- `message_sending`: devolver `{ cancel: true }` es definitivo. Una vez que cualquier controlador lo establece, se omiten los controladores de menor prioridad.
- `message_sending`: devolver `{ cancel: false }` se considera que no hay decisión (igual que omitir `cancel`), no una anulación.
- `message_received`: use el campo con tipos `threadId` cuando necesite el enrutamiento de hilos/temas entrantes. Reserve `metadata` para datos adicionales específicos del canal.
- `message_sending`: use los campos de enrutamiento con tipos `replyToId` / `threadId` antes de recurrir a `metadata`, específico del canal.
- `gateway_start`: use `ctx.config`, `ctx.workspaceDir` y `ctx.getCron?.()` para el estado de inicio controlado por el Gateway en lugar de depender de hooks internos `gateway:startup`. Cron aún puede estar cargándose en este punto.
- `cron_reconciled`: reconstruye una proyección externa completa de Cron después del inicio o de la recarga del planificador. Incluye `reason` y el estado efectivo de `enabled`, incluido `enabled: false`, mientras que `ctx.getCron?.()` devuelve el planificador conciliado exacto. Pase `ctx.abortSignal` al trabajo de proyección duradero; se cancela cuando esa instantánea del planificador queda reemplazada o se cierra el Gateway.
- `cron_changed`: observa los cambios del ciclo de vida de Cron controlados por el Gateway. Los eventos `scheduled` y `removed` son indicaciones de conciliación posteriores a la confirmación, no un registro ordenado de diferencias. El `event.nextRunAtMs` de un evento programado está ausente cuando el trabajo no tiene una próxima activación; un evento eliminado sigue incluyendo la instantánea del trabajo eliminado.

Los planificadores externos de activaciones deben aplicar antirrebote o agrupar los eventos `cron_changed`
y, después, volver a leer la vista duradera completa desde el planificador capturado por última vez por
`cron_reconciled`. No adopte el planificador de un contexto `cron_changed`: una
indicación desvinculada de un planificador anterior puede solaparse con una recarga posterior.

Use `cron_reconciled` como activador de instantánea completa para el estado duradero cargado durante
el inicio del Gateway o la sustitución del planificador. No se reproduce en una recarga en caliente
exclusiva del plugin. Los controladores de observación se ejecutan en paralelo y los
despachos sin espera pueden solaparse, por lo que los consumidores no deben depender del orden de finalización de los eventos.
Mantenga OpenClaw como fuente de verdad para las comprobaciones de vencimiento y la ejecución.

Para consultar un adaptador de ejecución única con sustitución duradera, reintentos/espera incremental y un
apagado limpio, véase [Proyección externa segura de Cron](/es/plugins/hooks#safe-external-cron-projection).

### Campos del objeto de API

| Campo                    | Tipo                      | Descripción                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id. del plugin                                                                                   |
| `api.name`               | `string`                  | Nombre para mostrar                                                                                |
| `api.version`            | `string?`                 | Versión del plugin (opcional)                                                                   |
| `api.description`        | `string?`                 | Descripción del plugin (opcional)                                                               |
| `api.source`             | `string`                  | Ruta de origen del plugin                                                                          |
| `api.rootDir`            | `string?`                 | Directorio raíz del plugin (opcional)                                                            |
| `api.config`             | `OpenClawConfig`          | Instantánea de configuración actual (instantánea activa en memoria del entorno de ejecución, cuando esté disponible)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuración específica del plugin procedente de `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Asistentes del entorno de ejecución](/es/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Registrador con ámbito (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carga actual; `"setup-runtime"` es el período ligero de inicio/configuración anterior a la entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resuelve una ruta relativa a la raíz del plugin                                                        |

## Convención de módulos internos

Dentro del plugin, use archivos de barril locales para las importaciones internas:

```text
my-plugin/
  api.ts            # Exportaciones públicas para consumidores externos
  runtime-api.ts    # Exportaciones del entorno de ejecución únicamente internas
  index.ts          # Punto de entrada del plugin
  setup-entry.ts    # Entrada ligera solo para configuración (opcional)
```

<Warning>
  Nunca importe su propio plugin mediante `openclaw/plugin-sdk/<your-plugin>`
  desde código de producción. Enrute las importaciones internas mediante `./api.ts` o
  `./runtime-api.ts`. La ruta del SDK es únicamente el contrato externo.
</Warning>

Las superficies públicas de plugins incluidos cargadas mediante fachadas (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` y archivos de entrada públicos similares) prefieren la
instantánea de configuración del entorno de ejecución activo cuando OpenClaw ya está en ejecución. Si todavía no existe ninguna
instantánea del entorno de ejecución, recurren al archivo de configuración resuelto en el disco.
Las fachadas de plugins incluidos empaquetados deben cargarse mediante los cargadores de
fachadas de plugins de OpenClaw; las importaciones directas desde `dist/extensions/...` omiten las comprobaciones del manifiesto
y del componente auxiliar del entorno de ejecución que las instalaciones empaquetadas utilizan para el código propiedad del plugin.

Los plugins de proveedores pueden exponer un módulo de exportación de contrato local del plugin y limitado cuando un
asistente es deliberadamente específico del proveedor y todavía no corresponde incluirlo en una
subruta genérica del SDK. Ejemplos incluidos:

- **Anthropic**: interfaz pública `api.ts` / `contract-api.ts` para los
  asistentes del encabezado beta de Claude y del flujo `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` exporta constructores de proveedores,
  asistentes de modelos predeterminados y constructores de proveedores en tiempo real.
- **`@openclaw/openrouter-provider`**: `api.ts` exporta el constructor de proveedores
  junto con los asistentes de incorporación y configuración.

<Warning>
  El código de producción de las extensiones también debe evitar las importaciones de `openclaw/plugin-sdk/<other-plugin>`.
  Si un asistente se comparte realmente, promuévalo a una subruta neutral del SDK,
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` u otra
  superficie orientada a capacidades, en lugar de acoplar dos plugins.
</Warning>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Puntos de entrada" icon="door-open" href="/es/plugins/sdk-entrypoints">
    Opciones de `definePluginEntry` y `defineChannelPluginEntry`.
  </Card>
  <Card title="Asistentes del entorno de ejecución" icon="gears" href="/es/plugins/sdk-runtime">
    Referencia completa del espacio de nombres `api.runtime`.
  </Card>
  <Card title="Instalación y configuración" icon="sliders" href="/es/plugins/sdk-setup">
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
