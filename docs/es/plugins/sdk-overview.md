---
read_when:
    - Necesita saber desde qué subruta del SDK importar
    - Se necesita una referencia de todos los métodos de registro de OpenClawPluginApi
    - Está buscando una exportación específica del SDK
sidebarTitle: Plugin SDK overview
summary: Mapa de importaciones, referencia de la API de registro y arquitectura del SDK
title: Descripción general del SDK de plugins
x-i18n:
    generated_at: "2026-07-22T10:42:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7d2bd239115399f412b7e4900980d21a22ef13554818d5b0be30330b42ce21a0
    source_path: plugins/sdk-overview.md
    workflow: 16
---

El SDK de plugins es el contrato tipado entre los plugins y el núcleo. Esta página es la
referencia sobre **qué importar** y **qué se puede registrar**.

<Note>
  Esta página está dirigida a autores de plugins que usan `openclaw/plugin-sdk/*` dentro de
  OpenClaw. Para aplicaciones externas, scripts, paneles, trabajos de CI y extensiones de IDE
  que quieran ejecutar agentes mediante el Gateway, use en su lugar
  [Integraciones del Gateway para aplicaciones externas](/es/gateway/external-apps).
</Note>

<Tip>
¿Busca una guía práctica? Comience con [Creación de plugins](/es/plugins/building-plugins). Use [Plugins de canal](/es/plugins/sdk-channel-plugins) para canales, [Plugins de proveedor](/es/plugins/sdk-provider-plugins) para proveedores de modelos, [Plugins de backend de CLI](/es/plugins/cli-backend-plugins) para backends locales de CLI de IA, [Plugins de entorno de agentes](/es/plugins/sdk-agent-harness) para ejecutores de agentes nativos y [Hooks de plugins](/es/plugins/hooks) para hooks de herramientas o del ciclo de vida.
</Tip>

## Convención de importación

Importe siempre desde una subruta específica:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subruta es un módulo pequeño y autónomo. Esto agiliza el inicio y
evita problemas de dependencias circulares. Para los asistentes de entrada y compilación específicos del canal,
se recomienda `openclaw/plugin-sdk/channel-core`; reserve `openclaw/plugin-sdk/core` para
la superficie general más amplia y los asistentes compartidos, como
`buildChannelConfigSchema`.

Para la configuración del canal, publique el esquema JSON propiedad del canal mediante
`openclaw.plugin.json#channelConfigs`. La subruta `plugin-sdk/channel-config-schema`
está destinada a las primitivas de esquema compartidas y al generador genérico. Los
plugins incluidos con OpenClaw usan `plugin-sdk/bundled-channel-config-schema` para los esquemas
conservados de los canales incluidos. Esa subruta de esquemas incluidos no es un patrón para
plugins nuevos.

<Warning>
  No importe interfaces auxiliares asociadas a proveedores o canales (por ejemplo,
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Los plugins incluidos combinan subrutas genéricas del SDK dentro de sus propios barrels `api.ts` /
  `runtime-api.ts`; los consumidores del núcleo deben usar esos barrels locales del plugin
  o añadir un contrato genérico y limitado del SDK cuando una necesidad sea realmente
  común a varios canales.

Un pequeño conjunto de interfaces auxiliares de plugins incluidos sigue apareciendo en el mapa de exportaciones
generado cuando tienen un uso registrado por parte de sus propietarios. Existen únicamente para el mantenimiento
de plugins incluidos y no son rutas de importación recomendadas para plugins nuevos
de terceros.

`openclaw/plugin-sdk/discord` y `openclaw/plugin-sdk/telegram-account` también se
conservan como fachadas de compatibilidad obsoletas para usos registrados por sus propietarios. No
copie esas rutas de importación en plugins nuevos; use en su lugar asistentes de entorno inyectados y
subrutas genéricas del SDK de canales.
</Warning>

## Referencia de subrutas

El SDK de plugins se expone como un conjunto de subrutas específicas agrupadas por área (entrada del
plugin, canal, proveedor, autenticación, entorno de ejecución, capacidad, memoria y asistentes
reservados para plugins incluidos). Para consultar el catálogo completo, agrupado y con enlaces, consulte
[Subrutas del SDK de plugins](/es/plugins/sdk-subpaths).

El inventario de puntos de entrada del compilador se encuentra en
`scripts/lib/plugin-sdk-entrypoints.json`; las exportaciones públicas tipadas excluyen las
subrutas internas enumeradas en
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Las entradas de producción
de esa lista conservan exportaciones del entorno del host únicamente en JavaScript para plugins oficiales
publicados por separado, mientras que las entradas exclusivas para pruebas no se exportan. Ejecute
`pnpm plugin-sdk:surface` para auditar el número de exportaciones públicas. Las subrutas públicas
obsoletas con suficiente antigüedad y sin uso en el código de producción de las extensiones incluidas se
registran en `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; los barrels amplios
y obsoletos de reexportación se registran en
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API de registro

La función de retorno `register(api)` recibe un objeto `OpenClawPluginApi` con estos
métodos:

Los plugins que proporcionan una superficie externa de chat de equipo para una sesión pueden registrar
el único proveedor para todo el proceso exportado por
`openclaw/plugin-sdk/session-discussion`. Su método `info({ sessionKey })`
indica si una conversación no está disponible, está lista para abrirse o ya está abierta;
`open({ sessionKey })` crea o resuelve la conversación y devuelve sus URL
de inserción y externas. Registrar otro proveedor reemplaza al proveedor actual.

### Registro de capacidades

| Método                                           | Qué registra                                                                 |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | Inferencia de texto (LLM)                                                              |
| `api.registerWorkerProvider(...)`                | Arrendamientos del ciclo de vida de trabajadores en la nube                                                     |
| `api.registerModelCatalogProvider(...)`          | Filas del catálogo de modelos para generación de texto y contenido multimedia                                  |
| `api.registerAgentHarness(...)`                  | Ejecutor de agentes nativo [experimental](/es/plugins/sdk-agent-harness) (Codex, Copilot) |
| `api.registerCliBackend(...)`                    | Backend local de inferencia mediante CLI                                                       |
| `api.registerChannel(...)`                       | Canal de mensajería                                                                 |
| `api.registerEmbeddingProvider(...)`             | Proveedor reutilizable de incrustaciones vectoriales                                                |
| `api.registerSpeechProvider(...)`                | Síntesis de texto a voz / STT                                                    |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcripción en tiempo real mediante streaming                                                  |
| `api.registerRealtimeVoiceProvider(...)`         | Sesiones de voz dúplex en tiempo real                                                    |
| `api.registerMediaUnderstandingProvider(...)`    | Análisis de imágenes, audio y vídeo                                                        |
| `api.registerTranscriptSourceProvider(...)`      | Fuente de transcripciones de reuniones en directo o importadas                                        |
| `api.registerImageGenerationProvider(...)`       | Generación de imágenes                                                                  |
| `api.registerMusicGenerationProvider(...)`       | Generación de música                                                                  |
| `api.registerVideoGenerationProvider(...)`       | Generación de vídeo                                                                  |
| `api.registerWebFetchProvider(...)`              | Proveedor de obtención y extracción de contenido web                                                       |
| `api.registerWebSearchProvider(...)`             | Búsqueda web                                                                        |
| `api.registerCompactionProvider(...)`            | Backend conectable de compactación de transcripciones                                           |

Los proveedores de trabajadores también deben declarar su identificador en `contracts.workerProviders`.
El núcleo conserva la intención duradera antes de `provision(profile, operationId)`. Los proveedores validan la configuración antes de la asignación externa y lanzan `WorkerProviderError` para el rechazo permanente del perfil. `provision` debe adoptar el mismo arrendamiento cuando se repita el identificador de la operación.
El núcleo conserva con el arrendamiento la configuración validada del perfil y proporciona esa instantánea a `destroy({ leaseId, profile })`, que debe ser idempotente, y a `inspect({ leaseId, profile })`, que devuelve `active`, `destroyed` o `unknown`. Esto permite que los proveedores enruten las llamadas del ciclo de vida después de reiniciar el Gateway o eliminar un perfil con nombre. Los puntos de conexión SSH usan un `SecretRef` para `keyRef`, nunca material de claves en línea, e incluyen un `hostKey` procedente de una salida de aprovisionamiento de confianza exactamente como `algorithm base64`, sin nombre de host ni comentario. El núcleo fija `hostKey` y nunca confía en una clave de la primera conexión. Un proveedor que genere un `keyRef` dinámico puede implementar `resolveSshIdentity({ leaseId, profile, keyRef })`; cuando está presente, ese resolutor es autoritativo, mientras que los proveedores que no lo tengan usan el resolutor genérico de secretos configurado.
Los proveedores con arrendamientos renovables también pueden implementar `renew(leaseId)`.
`inspect` debe lanzar un error ante fallos transitorios o indeterminados; devuelva `unknown` únicamente en caso de ausencia autoritativa. El núcleo marca un registro local activo como huérfano o trata la ausencia como la finalización de la eliminación tras una solicitud de destrucción conservada.

Los proveedores de incrustaciones registrados con `api.registerEmbeddingProvider(...)` también deben
figurar en `contracts.embeddingProviders` en el manifiesto del plugin. Esta
es la superficie genérica de incrustación para la generación de vectores reutilizables. La búsqueda en
memoria puede utilizar esta superficie genérica de proveedores. La interfaz anterior
`api.registerMemoryEmbeddingProvider(...)` y
`contracts.memoryEmbeddingProviders` es una compatibilidad obsoleta mientras
se migran los proveedores existentes específicos de memoria.

Los proveedores específicos de memoria que aún exponen un `batchEmbed(...)` en tiempo de ejecución conservan
el contrato existente de procesamiento por lotes por archivo, salvo que su entorno de ejecución establezca explícitamente
`sourceWideBatchEmbed: true`. Esta habilitación permite al host de memoria enviar fragmentos de
varios archivos de memoria modificados y fuentes habilitadas en una sola llamada `batchEmbed(...)`
hasta los límites de lote del host. Los adaptadores por lotes que cargan archivos de solicitud JSONL deben
dividir los trabajos del proveedor antes de alcanzar tanto el límite de tamaño de carga como el límite de cantidad
de solicitudes. El proveedor debe devolver una incrustación por cada fragmento de entrada en el mismo orden que
`batch.chunks`; omita la opción cuando el proveedor espere lotes locales del archivo o
no pueda conservar el orden de entrada en un trabajo más amplio que abarque toda la fuente.

### Herramientas y comandos

Use [`defineToolPlugin`](/es/plugins/tool-plugins) para plugins sencillos que solo proporcionan herramientas
con nombres de herramienta fijos. Use `api.registerTool(...)` directamente para plugins mixtos
o un registro de herramientas completamente dinámico.

| Método                                 | Qué registra                                                                                                                        |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerTool(tool, opts?)`        | Herramienta del agente (obligatoria o `{ optional: true }`)                                                                                            |
| `api.registerCommand(def)`             | Comando personalizado (omite el LLM)                                                                                                        |
| `api.registerNodeHostCommand(command)` | Comando gestionado por `openclaw node run`; los metadatos opcionales `agentTool` pueden exponerlo como herramienta visible para el agente mientras el Node está conectado |

Los comandos de plugins pueden establecer `agentPromptGuidance` cuando el agente necesite una indicación breve
de enrutamiento propiedad del comando. Mantenga ese texto centrado en el comando; no añada
políticas específicas de proveedores o plugins a los generadores de instrucciones principales del núcleo.

Las entradas de orientación pueden ser cadenas heredadas, que se aplican a todas las superficies de instrucciones, o
entradas estructuradas:

```ts
agentPromptGuidance: [
  "Indicación global del comando.",
  { text: "Mostrar esto solo en las instrucciones principales de OpenClaw.", surfaces: ["openclaw_main"] },
];
```

Las entradas estructuradas `surfaces` pueden incluir `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` o `subagent`. `pi_main` sigue siendo un alias obsoleto
de `openclaw_main`. Omita `surfaces` para aplicar deliberadamente la orientación a todas las superficies. No
pase un arreglo `surfaces` vacío; se rechaza para que una pérdida accidental del ámbito no se
convierta en texto global de las instrucciones.

Las instrucciones para desarrolladores del servidor de aplicaciones nativo de Codex son más estrictas que las de otras superficies
de instrucciones: solo la orientación cuyo ámbito se haya establecido explícitamente en `codex_app_server` se promueve a
ese nivel de mayor prioridad. La orientación en cadenas heredadas y la orientación estructurada sin ámbito
siguen estando disponibles para superficies de instrucciones ajenas a Codex por compatibilidad.

Los comandos del host Node se ejecutan en el host Node conectado, no dentro del
proceso del Gateway. Si `agentTool` está presente, el Node publica un descriptor después de una
conexión correcta al Gateway; el Gateway lo expone a las ejecuciones del agente solo mientras ese
Node esté conectado y únicamente si el `command` del descriptor forma parte de la superficie de comandos
aprobada del Node. Establezca `agentTool.defaultPlatforms` para incluir un
comando no peligroso en la lista de comandos permitidos predeterminada del Node; de lo contrario, exija
un `gateway.nodes.commands.allow` explícito o una política de invocación del Node. `agentTool.name`
debe ser seguro para el proveedor: debe comenzar con una letra, usar únicamente letras, dígitos,
guiones bajos o guiones y no superar los 64 caracteres. Las herramientas del Node respaldadas por MCP
pueden establecer metadatos de `agentTool.mcp` para que las superficies de catálogo y búsqueda de herramientas muestren
la identidad remota del servidor o la herramienta MCP, pero la ejecución sigue realizándose mediante el
comando anunciado del Node.

### Infraestructura

| Método                                          | Lo que registra                                                         |
| ----------------------------------------------- | ----------------------------------------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook de evento                                                          |
| `api.registerHttpRoute(params)`                 | Endpoint HTTP del Gateway                                               |
| `api.registerGatewayMethod(name, handler)`      | Método RPC del Gateway                                                  |
| `api.registerGatewayDiscoveryService(service)`  | Anunciante de detección local del Gateway                               |
| `api.registerCli(registrar, opts?)`             | Subcomando de la CLI                                                    |
| `api.registerNodeCliFeature(registrar, opts?)`  | CLI de funciones del Node en `openclaw nodes`                         |
| `api.registerService(service)`                  | Servicio en segundo plano                                               |
| `api.registerInteractiveHandler(registration)`  | Controlador interactivo                                                 |
| `api.registerAgentToolResultMiddleware(...)`    | Middleware de resultados de herramientas en tiempo de ejecución         |
| `api.registerMemoryPromptSupplement(builder)`   | Sección aditiva del prompt adyacente a la memoria                       |
| `api.registerMemoryPromptPreparation(prepare)`  | Preparación asíncrona de una sección del prompt adyacente a la memoria  |
| `api.registerMemoryCorpusSupplement(adapter)`   | Corpus aditivo de búsqueda y lectura de memoria                         |
| `api.registerHostedMediaResolver(resolver)`     | Resolutor de URL de contenido alojado de estilo navegador               |
| `api.registerMcpServerConnectionResolver(...)`  | Transporte MCP por solicitante (`url`/`headers`) para un nombre de servidor estático |
| `api.registerTextTransforms(transforms)`        | Reescrituras de texto de compatibilidad de prompts/mensajes propiedad del Plugin |
| `api.registerConfigMigration(migrate)`          | Migración ligera de configuración ejecutada antes de cargar el entorno de ejecución del Plugin |
| `api.registerMigrationProvider(provider)`       | Importador de `openclaw migrate`                                        |
| `api.registerAutoEnableProbe(probe)`            | Sondeo de configuración que puede habilitar automáticamente este Plugin |
| `api.registerReload(registration)`              | Política de prefijos de configuración de reinicio/recarga en caliente/sin operación para gestionar recargas |
| `api.registerNodeHostCommand(command)`          | Controlador de comandos expuesto a los Node emparejados                 |
| `api.registerNodeInvokePolicy(policy)`          | Política de lista de permitidos/aprobación para comandos invocados por el Node |
| `api.registerSecurityAuditCollector(collector)` | Recopilador de hallazgos para `openclaw security audit`                        |

#### Trabajo del webhook posterior a la confirmación

Las rutas de Webhook que confirman una solicitud antes de finalizar el procesamiento deben trasladar
ese trabajo desacoplado a su propia raíz de admisión con seguimiento:

```typescript
import { runDetachedWebhookWork } from "openclaw/plugin-sdk/webhook-request-guards";

void runDetachedWebhookWork(() => processWebhookEvent(event)).catch((error) => {
  runtime.error?.(`falló el despacho del webhook: ${String(error)}`);
});
```

Llame a `runDetachedWebhookWork(...)` de forma síncrona mientras la solicitud HTTP todavía esté
admitida. El auxiliar reserva inmediatamente una raíz independiente y, después, inicia el
callback en la siguiente microtarea para que el controlador de la solicitud pueda escribir primero su
confirmación. La promesa devuelta adopta el resultado del callback; los llamadores
siguen siendo responsables de gestionar los rechazos. Esto mantiene aceptado el trabajo de la cola posterior a la confirmación y hace que
los drenajes por reinicio o suspensión esperen a que termine. Los controladores que esperan a que finalice todo el procesamiento
antes de devolver el resultado no necesitan este auxiliar.

#### Conexiones MCP con ámbito de solicitante

Mantenga estática la **identidad** del servidor MCP (nombre, filtro de herramientas) en `mcp.servers` o en un
manifiesto de paquete. Opcionalmente, registre un resolutor de conexión para que cada
solicitante de mensajes de confianza obtenga su propio transporte:

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

- El contexto del resolutor solo contiene la identidad de confianza del host (`requesterSenderId`,
  con `agentAccountId` / `messageChannel` opcionales). Se podrán añadir de forma aditiva futuros campos de confianza (por
  ejemplo, el contexto de usuario de cron/subagente).
- Un Plugin posee un nombre de servidor: se rechaza con un diagnóstico de error un
  `registerMcpServerConnectionResolver` duplicado para el mismo `serverName` procedente de otro
  Plugin (prevalece el primer registro), por lo que
  la propiedad de la conexión nunca depende del orden de carga de los Plugins.
- Los nombres de las herramientas se derivan del conjunto completo de servidores declarados, de modo que la resolución parcial
  nunca modifica los nombres seguros de los servidores entre solicitantes o turnos. El núcleo no
  verifica que los distintos endpoints de los solicitantes proporcionen esquemas de herramientas idénticos; un
  resolutor debe dirigir a todos los solicitantes al mismo servicio lógico, o los
  esquemas de herramientas (y la estabilidad de la caché del prompt) divergirán según el solicitante.
- Las ejecuciones sin un `requesterSenderId` de confianza (cron, subagente, Heartbeat, Gateway
  público) nunca materializan servidores con ámbito de solicitante. No existe una
  conexión alternativa compartida.
- `resolve` está limitado a 10 segundos por servidor; un tiempo de espera agotado o una excepción omite ese
  servidor de la ejecución sin provocar un error en el MCP estático.
- Las conexiones resueltas se vuelven a validar como máximo cada 5 minutos por solicitante:
  la rotación reconstruye el transporte con credenciales nuevas, y un resultado `null`
  lo revoca (el entorno de ejecución almacenado en caché se elimina incluso durante una sesión). Por tanto, una credencial
  revocada o rotada puede seguir utilizándose durante un máximo de 5 minutos.
- Los `headers` resueltos nunca se registran ni persisten; el núcleo solo conserva un resumen con clave
  efímero en memoria (HMAC local del proceso) para detectar la rotación de credenciales y
  registra los valores de credenciales resueltos de cabeceras/URL en el registro de censura
  de logs/capturas de depuración.
- Los servidores con ámbito de solicitante no generan vistas de aplicaciones MCP: una vista perdura más que la
  ejecución autenticada del solicitante y el límite de vistas del Gateway no incluye la identidad del
  solicitante, por lo que las vistas previas de aplicaciones permanecen cerradas de forma segura para estos servidores. Los resultados de las herramientas
  no se ven afectados.
- Los servidores estáticos sin resolutor mantienen el ciclo de vida existente con ámbito de sesión.
- **Regla de entrega del arnés:** los servidores con ámbito de solicitante nunca entran en la
  configuración nativa del cliente MCP del arnés (hilo de Codex `mcp_servers`, CLI `-c mcp_servers=…` ni ninguna
  otra proyección MCP compartida por la sesión). En su lugar, los arneses los entregan como herramientas con ámbito
  de ejecución:
  - Ejecutor integrado: entorno de ejecución MCP de la sesión + herramientas del paquete (estáticas + con ámbito).
  - Servidor de aplicaciones de Codex: herramientas dinámicas mediante
    `materializeRequesterScopedMcpToolsForHarnessRun` (solo con ámbito; los servidores
    estáticos permanecen en el cliente MCP nativo de Codex).
- Las **especificaciones** de herramientas con ámbito permanecen estables durante la sesión después de la primera resolución correcta
  de esa sesión, por lo que los arneses con hilos compartidos (Codex) no rotan los hilos cuando
  cambian los remitentes. Antes de que se resuelva cualquier solicitante, no se anuncian especificaciones con ámbito.
- Los solicitantes no autenticados de un arnés con hilos compartidos siguen viendo las herramientas
  con ámbito anunciadas; al llamar a una, se devuelve un error claro de herramienta no conectada para ese
  solicitante. OpenClaw nunca recurre a las credenciales de otro solicitante.

Los constructores de complementos del prompt de memoria reciben contextos opcionales `agentId`,
`agentSessionKey` y `sandboxed`. Las llamadas de complemento del corpus de memoria `search`
y `get` reciben contextos opcionales `agentId` y `sandboxed`. Los Plugins con
almacenamiento propiedad del agente deben resolver dicho almacenamiento en cada llamada en lugar de
capturar una única ruta global durante el registro. Si se requiere un identificador de agente, pero
falta en una operación multiagente, se debe cerrar de forma segura en lugar de elegir un
agente arbitrario.

Use `registerMemoryPromptPreparation(...)` cuando el texto del prompt dependa del estado asíncrono
del Plugin. El callback se ejecuta una vez antes de cada prompt completo del agente y recibe
el mismo contexto de herramientas, agente, sesión y entorno aislado que los constructores síncronos del prompt de
memoria. Valide la instancia actual propietaria del almacenamiento antes de cargar el estado
persistente y devuelva únicamente las líneas correspondientes a esa ejecución. OpenClaw inmoviliza esas líneas y
entrega el resultado inmutable al ensamblado síncrono del prompt. Mantenga la persistencia,
el reemplazo atómico y la eliminación al retirar al propietario dentro del Plugin propietario; no
sondee ni lea archivos desde un constructor del prompt.

Los controladores interactivos de Telegram pueden devolver `{ submitText }` para dirigir el texto por
la ruta normal de entrada al agente de Telegram después de que el controlador se ejecute correctamente. OpenClaw conserva
el botón de callback cuando la política de entrada omite el texto o falla el procesamiento, para que
el usuario pueda reintentarlo después de que cambie la condición de bloqueo. Este campo de resultado es
específico de Telegram; los demás canales mantienen sus propios contratos de resultados interactivos.

### Hooks del host para Plugins de flujo de trabajo

Los hooks del host son las interfaces del SDK para los Plugins que deben participar en el ciclo de vida
del host en lugar de limitarse a añadir un proveedor, un canal o una herramienta. Son
contratos genéricos; el modo Plan puede utilizarlos, pero también los flujos de trabajo de aprobación,
las barreras de políticas del espacio de trabajo, los monitores en segundo plano, los asistentes de configuración y los Plugins
complementarios de la interfaz de usuario.

| Método                                                                               | Contrato que controla                                                                                                                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Estado de sesión propiedad del Plugin, compatible con JSON y proyectado mediante sesiones del Gateway                                                                             |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Contexto duradero de ejecución única inyectado en el siguiente turno del agente para una sesión                                                                             |
| `api.registerTrustedToolPolicy(...)`                                                 | Política de herramientas de confianza previa al Plugin, controlada por el manifiesto, que puede bloquear o reescribir parámetros de herramientas                                                                        |
| `api.registerToolMetadata(...)`                                                      | Metadatos de visualización del catálogo de herramientas sin cambiar la implementación de la herramienta                                                                                     |
| `api.registerCommand(...)`                                                           | Comandos de Plugin con ámbito limitado; los resultados de los comandos pueden establecer `continueAgent: true` o `suppressReply: true`; los comandos nativos de Discord admiten `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Descriptores de contribuciones a la interfaz de control para superficies de sesión, herramienta, ejecución, configuración o pestaña                                                                      |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Funciones de retorno de limpieza para recursos de ejecución propiedad del Plugin en rutas de restablecimiento, eliminación o recarga                                                                          |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Suscripciones a eventos saneados para el estado y los monitores del flujo de trabajo                                                                                              |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Estado temporal del Plugin por ejecución, borrado durante el ciclo de vida terminal de la ejecución                                                                                             |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Metadatos de limpieza para trabajos del planificador propiedad del Plugin; no programa trabajo ni crea registros de tareas                                                            |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Entrega de archivos adjuntos mediada por el host y exclusiva de Plugins incluidos a la ruta activa de sesión saliente directa                                                            |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Turnos de sesión programados respaldados por Cron y exclusivos de Plugins incluidos, además de limpieza basada en etiquetas                                                                                    |
| `api.session.controls.registerSessionAction(...)`                                    | Acciones de sesión tipadas que los clientes pueden enviar mediante el Gateway                                                                                             |

Un descriptor `surface: "tab"` añade una pestaña de la barra lateral a la interfaz de control. Los descriptores de pestañas de los
Plugins activos se anuncian a los clientes del panel en el saludo del gateway
(`controlUiTabs`), por lo que la pestaña aparece solo mientras el Plugin está habilitado.
Los Plugins incluidos pueden proporcionar una vista de panel de primera clase para su pestaña; otros
Plugins pueden establecer `path` en una ruta HTTP del Plugin (consulte
`api.registerHttpRoute(...)`) que el panel representa en un marco aislado.
`icon` es una sugerencia de nombre de icono del panel, `group` selecciona la sección de la barra lateral
(`control` o `agent`), `order` ordena las pestañas de Plugins y `requiredScopes`
oculta la pestaña en conexiones que carecen de esos ámbitos de operador:

Para una pestaña externa protegida por el gateway, registre el descriptor `path` bajo una
ruta HTTP `auth: "gateway"` del mismo Plugin. Tras la inicialización autenticada, el navegador obtiene una
concesión de corta duración y HttpOnly, limitada a ese Plugin y a la raíz de la ruta, para que el
marco aislado pueda cargarse sin copiar el token de portador del Gateway en su URL
ni en JavaScript. El elemento principal autenticado renueva la concesión mientras la pestaña externa
está activa y antes de montarla tras una navegación o reanudación del navegador. También
comprueba la concesión desde el mismo entorno aislado opaco antes del montaje, de modo que los
modos de privacidad del navegador que bloquean la cookie aplican un cierre seguro con un panel no disponible.
La concesión del marco solo acepta `GET` y `HEAD` y siempre incluye
`operator.read`; `requiredScopes` controla la visibilidad de la pestaña, pero nunca amplía la
concesión de la cookie. Las mutaciones permanecen en superficies principales autenticadas explícitamente por el Gateway o
en superficies de portador. Las pestañas externas requieren HTTPS/Tailscale Serve o un
origen de bucle invertido de confianza para el navegador; HTTP sin cifrar en un host de LAN muestra el
error de contexto seguro en lugar de montar un panel que no puede autenticarse.
El bloqueo completo de cookies de terceros también hace que las pestañas protegidas por el gateway no estén disponibles.
Como ocurre con todas las superficies nativas de Plugins, el marco permanece dentro del límite de confianza
del Plugin instalado; OpenClaw no trata los Plugins instalados como principales de seguridad
del navegador aislados entre sí.
Las concesiones de cookies utilizan el límite del nombre de host del navegador, no el límite de sus puertos. No
aloje conjuntamente servicios que no confíen entre sí en el nombre de host del Gateway, ni siquiera en otros
puertos.
Las pestañas respaldadas por autenticación gestionada por el Plugin conservan su comportamiento directo de iframe y no
solicitan ni requieren esta concesión del Gateway.

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "Registro",
  description: "El día como una cronología, creada a partir de capturas de pantalla.",
  icon: "sun",
  group: "control",
  requiredScopes: ["operator.write"],
});
```

Utilice los espacios de nombres agrupados para el nuevo código de Plugins:

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
obsoletos para los Plugins existentes. No añada nuevo código de Plugin que invoque directamente
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
nomenclatura propiedad del Plugin y la limpieza. Utilice `api.runtime.tasks.managedFlows` dentro del turno
programado cuando el trabajo necesite un estado duradero de Task Flow con varios pasos.

Los contratos dividen la autoridad intencionadamente:

- Los Plugins externos pueden controlar extensiones de sesión, descriptores de interfaz, comandos, metadatos de
  herramientas, inyecciones en el siguiente turno y enlaces normales.
- Las políticas de herramientas de confianza se ejecutan antes que los enlaces `before_tool_call` ordinarios y cuentan con la
  confianza del host. Las políticas incluidas se ejecutan primero; las políticas de Plugins instalados requieren
  habilitación explícita, además de sus identificadores locales en
  `contracts.trustedToolPolicies`, y se ejecutan después según el orden de carga de los Plugins. Los identificadores de las políticas
  están limitados al Plugin que los registra.
- La propiedad de comandos reservados es exclusiva de los Plugins incluidos. Los Plugins externos deben utilizar sus
  propios nombres de comandos o alias.
- `allowPromptInjection=false` deshabilita los enlaces que modifican el prompt, incluidos
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`
  y `enqueueNextTurnInjection`.

Ejemplos de consumidores que no usan Plan:

| Arquetipo de Plugin           | Enlaces utilizados                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Flujo de trabajo de aprobación | Extensión de sesión, continuación de comandos, inyección en el siguiente turno, descriptor de interfaz                                                            |
| Puerta de política de presupuesto/espacio de trabajo | Política de herramientas de confianza, metadatos de herramientas, proyección de sesión                                                                                 |
| Monitor del ciclo de vida en segundo plano | Limpieza del ciclo de vida de ejecución, suscripción a eventos del agente, propiedad/limpieza del planificador de sesiones, contribución al prompt de Heartbeat, descriptor de interfaz |
| Asistente de configuración o incorporación | Extensión de sesión, comandos con ámbito limitado, descriptor de la interfaz de control                                                                              |

<Note>
  Los espacios de nombres administrativos reservados del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) siempre permanecen `operator.admin`, aunque un Plugin intente asignar un
  ámbito de método del gateway más restringido. Se recomienda utilizar prefijos específicos del Plugin para los
  métodos propiedad del Plugin.
</Note>

<Accordion title="Cuándo utilizar middleware de resultados de herramientas">
  Los Plugins incluidos y los Plugins instalados habilitados explícitamente con contratos de
  manifiesto coincidentes pueden utilizar `api.registerAgentToolResultMiddleware(...)` cuando
  necesiten reescribir el resultado de una herramienta después de la ejecución y antes de que el entorno de ejecución
  devuelva ese resultado al modelo. Este es el punto de integración de confianza e independiente del entorno de ejecución
  para reductores de salida asíncronos como tokenjuice.

Los Plugins deben declarar `contracts.agentToolResultMiddleware` para cada entorno de ejecución
de destino, por ejemplo, `["openclaw", "codex"]`. Los Plugins instalados sin ese
contrato o sin habilitación explícita no pueden registrar este middleware; conserve
los enlaces normales de Plugins de OpenClaw para trabajos que no necesiten ejecutarse entre el resultado de la herramienta
y su entrega al modelo. Se ha eliminado la antigua ruta de registro de fábricas de extensiones
exclusiva del ejecutor integrado.
</Accordion>

### Registro de descubrimiento del Gateway

`api.registerGatewayDiscoveryService(...)` permite que un Plugin anuncie el
Gateway activo en un transporte de descubrimiento local como mDNS/Bonjour. OpenClaw llama al
servicio durante el inicio del Gateway cuando el descubrimiento local está habilitado, transmite los
puertos actuales del Gateway y datos de sugerencia TXT no secretos, y llama al controlador
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

Los Plugins de descubrimiento del Gateway no deben tratar los valores TXT anunciados como secretos ni como
autenticación. El descubrimiento es una sugerencia de enrutamiento; la autenticación del Gateway y la fijación de TLS siguen
controlando la confianza.

### Metadatos de registro de la CLI

`api.registerCli(registrar, opts?)` acepta dos tipos de metadatos de comandos:

- `commands`: nombres de comandos explícitos propiedad del registrador
- `descriptors`: descriptores de comandos durante el análisis utilizados para la ayuda de la CLI,
  el enrutamiento y el registro diferido de la CLI del Plugin
- `parentPath`: ruta opcional del comando principal para grupos de comandos anidados, como
  `["nodes"]`

Para funciones de nodos emparejados, se recomienda
`api.registerNodeCliFeature(registrar, opts?)`. Es un pequeño contenedor de
`api.registerCli(..., { parentPath: ["nodes"] })` y hace que comandos como
`openclaw nodes canvas` sean funciones de Node explícitamente propiedad del Plugin.

Para que un comando de Plugin permanezca con carga diferida en la ruta normal de la CLI raíz,
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

Use `commands` por sí solo únicamente cuando no se necesite el registro diferido de la CLI raíz.
Esa ruta de compatibilidad inmediata sigue siendo compatible, pero no instala
marcadores de posición respaldados por descriptores para la carga diferida durante el análisis.

### Registro de backends de CLI

`api.registerCliBackend(...)` permite que un plugin controle la configuración predeterminada de un backend
local de CLI de IA, como `claude-cli` o `my-cli`.

- El `id` del backend se convierte en el prefijo del proveedor en referencias de modelos como `my-cli/gpt-5`.
- El `config` del backend es el adaptador de comandos autoritativo: el comportamiento de argv, entorno,
  analizador, sesión, imágenes y fiabilidad reside en el código del plugin.
- Los usuarios seleccionan el backend mediante referencias de modelos o el `agentRuntime.id` con ámbito de modelo;
  `openclaw.json` no reescribe el adaptador.
- Use `normalizeConfig` cuando los campos estáticos registrados necesiten una fase de normalización
  que tenga en cuenta el entorno de ejecución.
- Use `resolveExecutionArgs` para reescrituras de argv con ámbito de solicitud que pertenezcan
  al dialecto de la CLI, como asignar los niveles de razonamiento de OpenClaw a una opción nativa
  de esfuerzo. El hook recibe `ctx.executionMode`; use `"side-question"` para añadir
  opciones de aislamiento nativas del backend a llamadas efímeras de `/btw`. Si esas opciones
  deshabilitan de forma fiable las herramientas nativas de una CLI que, de otro modo, las mantiene siempre activas, declare también
  `sideQuestionToolMode: "disabled"`.
- Use `prepareExecution` para el entorno de inicio controlado por el backend o para puentes
  temporales de autenticación/configuración. Su `ctx.contextTokenBudget` es el límite efectivo de tokens
  seleccionado para la ejecución, por lo que los backends con compactación nativa pueden alinear su
  propio umbral sin ramas del núcleo específicas del proveedor.
- Los backends que puedan deshabilitar todas las herramientas nativas para una ejecución concreta pueden declarar
  `nativeToolMode: "selectable"`. Las llamadas restringidas pasan una lista exacta de
  `ctx.toolAvailability.native` junto con una lista de permitidos de MCP exacta y aislada del host;
  `resolveExecutionArgs` debe aplicar ambas en el argv final, ya sea nuevo o de reanudación.
  Para aceptar límites del entorno de ejecución como `toolsAllow` de Cron, el backend también debe
  implementar `resolveRuntimeToolAvailability`; OpenClaw deshabilita todas las herramientas
  nativas y adopta un comportamiento de cierre seguro si el backend no puede traducir o aplicar el límite
  de MCP.

Para consultar una guía de creación integral, véase
[Plugins de backend de CLI](/es/plugins/cli-backend-plugins).

### Espacios exclusivos

| Método                                     | Qué registra                                                                                                                                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motor de contexto (solo uno activo a la vez). Las devoluciones de llamada del ciclo de vida reciben `runtimeSettings` cuando el host puede proporcionar diagnósticos de modelo/proveedor/modo; los motores estrictos antiguos vuelven a intentarse sin esa clave. |
| `api.registerMemoryCapability(capability)` | Capacidad de memoria unificada                                                                                                                                                                          |

### Adaptadores de embeddings de memoria obsoletos

| Método                                         | Qué registra                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embeddings de memoria para el plugin activo |

- `registerMemoryCapability` es la API exclusiva del plugin de memoria.
- `registerMemoryCapability` también puede exponer `publicArtifacts.listArtifacts(...)`
  para exportaciones administradas por el host. Los plugins complementarios que enumeran esos
  artefactos declarados siguen usando `listActiveMemoryPublicArtifacts(...)` de la fachada
  `openclaw/plugin-sdk/memory-host-core` conservada hasta que exista una API pública específica
  para consumidores; no deben acceder a la estructura privada de otro plugin.
- `MemoryFlushPlan.model` puede fijar el turno de vaciado a una referencia exacta de `provider/model`,
  como `ollama/qwen3:8b`, sin heredar la cadena de respaldo activa.
- `registerMemoryEmbeddingProvider` está obsoleto. Los nuevos proveedores de embeddings
  deben usar `api.registerEmbeddingProvider(...)` y
  `contracts.embeddingProviders`.
- Los proveedores existentes específicos de memoria siguen funcionando durante el periodo
  de migración, pero la inspección de plugins informa de ello como deuda de compatibilidad para
  los plugins no incluidos.

### Eventos y ciclo de vida

| Método                                       | Qué hace                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de ciclo de vida con tipos          |
| `api.onConversationBindingResolved(handler)` | Devolución de llamada de vinculación de conversaciones |

Véase [Hooks de plugins](/es/plugins/hooks) para consultar ejemplos, nombres habituales de hooks y semántica
de las protecciones.

### Semántica de las decisiones de hooks

`before_install` es un hook del ciclo de vida del entorno de ejecución del plugin, no la superficie de políticas
de instalación del operador. Use `security.installPolicy` cuando una decisión de permitir/bloquear deba
abarcar las rutas de instalación o actualización de la CLI y las respaldadas por Gateway.

- `before_tool_call`: devolver `{ block: true }` es definitivo. Cuando un controlador lo establece, se omiten los controladores de menor prioridad.
- `before_tool_call`: devolver `{ block: false }` se considera que no hay decisión (igual que omitir `block`), no una anulación.
- `before_install`: devolver `{ block: true }` es definitivo. Cuando un controlador lo establece, se omiten los controladores de menor prioridad.
- `before_install`: devolver `{ block: false }` se considera que no hay decisión (igual que omitir `block`), no una anulación.
- `reply_dispatch`: devolver `{ handled: true, ... }` es definitivo. Cuando un controlador asume el despacho, se omiten los controladores de menor prioridad y la ruta predeterminada de despacho del modelo.
- `message_sending`: devolver `{ cancel: true }` es definitivo. Cuando un controlador lo establece, se omiten los controladores de menor prioridad.
- `message_sending`: devolver `{ cancel: false }` se considera que no hay decisión (igual que omitir `cancel`), no una anulación.
- `message_received`: use el campo con tipos `threadId` cuando necesite enrutar hilos/temas entrantes. Reserve `metadata` para datos adicionales específicos del canal.
- `message_sending`: use los campos de enrutamiento con tipos `replyToId` / `threadId` antes de recurrir a `metadata`, específico del canal.
- `gateway_start`: use `ctx.config`, `ctx.workspaceDir` y `ctx.getCron?.()` para el estado de inicio controlado por Gateway en lugar de depender de hooks internos de `gateway:startup`. Cron puede seguir cargándose en este punto.
- `cron_reconciled`: reconstruya una proyección externa completa de Cron después del inicio o de una recarga del planificador. Incluye `reason` y el estado efectivo de `enabled`, incluido `enabled: false`, mientras que `ctx.getCron?.()` devuelve el planificador conciliado exacto. Pase `ctx.abortSignal` al trabajo de proyección duradera; se cancela cuando esa instantánea del planificador queda reemplazada o se cierra Gateway.
- `cron_changed`: observe los cambios del ciclo de vida de Cron controlados por Gateway. Los eventos `scheduled` y `removed` son indicaciones de conciliación posteriores a la confirmación, no un registro ordenado de cambios. El `event.nextRunAtMs` de un evento programado está ausente cuando la tarea no tiene una próxima activación; un evento eliminado sigue incluyendo la instantánea de la tarea eliminada.

Los planificadores de activación externos deben aplicar antirrebote o agrupar los eventos `cron_changed`,
y después volver a leer la vista duradera completa desde el último planificador capturado por
`cron_reconciled`. No adopte el planificador de un contexto `cron_changed`: una
indicación desvinculada de un planificador anterior puede solaparse con una recarga posterior.

Use `cron_reconciled` como desencadenador de instantáneas completas para el estado duradero cargado al
iniciarse Gateway o al sustituirse el planificador. No se reproduce durante una recarga en caliente
exclusiva del plugin. Los controladores de observación se ejecutan en paralelo y los
despachos sin espera pueden solaparse, por lo que los consumidores no deben depender del orden de finalización de los eventos.
Mantenga OpenClaw como fuente de verdad para las comprobaciones de vencimiento y la ejecución.

Para consultar un adaptador de ejecución única con sustitución duradera, reintentos/espera progresiva y cierre
ordenado, véase [Proyección externa segura de Cron](/es/plugins/hooks#safe-external-cron-projection).

### Campos del objeto de API

| Campo                    | Tipo                      | Descripción                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id. del plugin                                                                                   |
| `api.name`               | `string`                  | Nombre para mostrar                                                                                |
| `api.version`            | `string?`                 | Versión del plugin (opcional)                                                                   |
| `api.description`        | `string?`                 | Descripción del plugin (opcional)                                                               |
| `api.source`             | `string`                  | Ruta de origen del plugin                                                                          |
| `api.rootDir`            | `string?`                 | Directorio raíz del plugin (opcional)                                                            |
| `api.config`             | `OpenClawConfig`          | Instantánea de configuración actual (instantánea activa en memoria del entorno de ejecución cuando esté disponible)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuración específica del plugin de `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Ayudantes del entorno de ejecución](/es/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Registrador con ámbito (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carga actual; `"setup-runtime"` es la ventana ligera de inicio/configuración previa a la entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resuelve una ruta relativa a la raíz del plugin                                                        |

## Convención de módulos internos

Dentro del plugin, use archivos índice locales para las importaciones internas:

```text
my-plugin/
  api.ts            # Exportaciones públicas para consumidores externos
  runtime-api.ts    # Exportaciones del entorno de ejecución solo para uso interno
  index.ts          # Punto de entrada del plugin
  setup-entry.ts    # Entrada ligera solo para configuración (opcional)
```

<Warning>
  Nunca importe el propio plugin mediante `openclaw/plugin-sdk/<your-plugin>`
  desde el código de producción. Enrute las importaciones internas mediante `./api.ts` o
  `./runtime-api.ts`. La ruta del SDK es únicamente el contrato externo.
</Warning>

Las superficies públicas de plugins incluidos cargadas mediante fachadas (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` y archivos de entrada públicos similares) utilizan preferentemente la
instantánea de configuración del entorno de ejecución activo cuando OpenClaw ya está en ejecución. Si todavía no existe
ninguna instantánea del entorno de ejecución, recurren al archivo de configuración resuelto en el disco.
Las fachadas de plugins incluidos empaquetados deben cargarse mediante los cargadores de
fachadas de plugins de OpenClaw; las importaciones directas desde `dist/extensions/...` omiten las comprobaciones del manifiesto
y del componente auxiliar del entorno de ejecución que las instalaciones empaquetadas utilizan para el código propiedad del plugin.

Los plugins de proveedores pueden exponer un módulo de exportación de contrato local y limitado al plugin cuando un
componente auxiliar es deliberadamente específico del proveedor y todavía no corresponde a una subruta
de un SDK genérico. Ejemplos incluidos:

- **Anthropic**: interfaz pública `api.ts` / `contract-api.ts` para los componentes auxiliares
  del encabezado beta de Claude y del flujo `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` exporta constructores de proveedores,
  componentes auxiliares del modelo predeterminado y constructores de proveedores en tiempo real.
- **`@openclaw/openrouter-provider`**: `api.ts` exporta el constructor del proveedor
  junto con componentes auxiliares de incorporación y configuración.

<Warning>
  El código de producción de las extensiones también debe evitar las importaciones de `openclaw/plugin-sdk/<other-plugin>`.
  Si un componente auxiliar es realmente compartido, trasládelo a una subruta neutral del SDK,
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` u otra superficie
  orientada a capacidades, en lugar de acoplar dos plugins.
</Warning>

## Contenido relacionado

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
