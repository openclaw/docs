---
read_when:
    - Traslado de datos de tiempo de ejecución, caché, transcripciones, estado de tareas o archivos temporales de OpenClaw a SQLite
    - Diseñar migraciones de doctor desde archivos JSON o JSONL
    - Cambiar el comportamiento de copia de seguridad, restauración, VFS o almacenamiento de worker
    - Eliminación de bloqueos de sesión, poda, truncamiento o rutas de compatibilidad JSON
summary: Plan de migración para convertir SQLite en la capa principal de estado duradero y caché, manteniendo la configuración respaldada por archivos
title: Reestructuración de estado con prioridad en la base de datos
x-i18n:
    generated_at: "2026-06-27T12:47:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54995a9f43f740e7cc3ac3e0a4b69d73ddba6b2c30731193ab7ce3aa1dfc9d94
    source_path: refactor/database-first.md
    workflow: 16
---

# Refactorización de estado con prioridad de base de datos

## Decisión

Usar un diseño SQLite de dos niveles:

- Base de datos global: `~/.openclaw/state/openclaw.sqlite`
- Base de datos de agente: una base de datos SQLite por agente para el espacio de trabajo propiedad del agente,
  transcripción, VFS, artefacto y estado de runtime grande por agente
- La configuración sigue respaldada por archivos: `openclaw.json` permanece fuera de la
  base de datos. Los perfiles de autenticación de runtime se mueven a SQLite; los archivos de credenciales
  de proveedores externos o de CLI siguen gestionados por su propietario fuera de la base de datos de OpenClaw.

La base de datos global es la base de datos del plano de control. Es propietaria del descubrimiento de agentes,
el estado compartido del gateway, el emparejamiento, el estado de dispositivo/nodo, los libros mayores de tareas y flujos, el estado de plugins,
el estado de runtime del planificador, los metadatos de copias de seguridad y el estado de migración.

La base de datos del agente es la base de datos del plano de datos. Es propietaria de los metadatos de sesión
del agente, el flujo de eventos de transcripción, el espacio de trabajo VFS o espacio de nombres temporal, los artefactos de herramientas,
los artefactos de ejecuciones y los datos de caché locales del agente que se pueden buscar e indexar.

Esto ofrece una vista global duradera sin forzar grandes espacios de trabajo de agentes,
transcripciones y datos binarios temporales a entrar en el carril de escritura compartido del gateway.

## Contrato estricto

Esta migración tiene una única forma canónica de runtime:

- Las filas de sesión solo persisten metadatos de sesión. No deben persistir
  `transcriptLocator`, rutas de archivos de transcripción, rutas JSONL hermanas, rutas de bloqueo,
  metadatos de poda ni punteros de compatibilidad de la era de archivos.
- La identidad de transcripción siempre es identidad SQLite: `{agentId, sessionId}` más
  metadatos de tema opcionales cuando el protocolo los necesite.
- `sqlite-transcript://...` no es una identidad de runtime ni de protocolo. El código nuevo no debe
  derivar, persistir, pasar, analizar ni migrar localizadores de transcripción. El runtime y
  las pruebas no deberían contener pseudolocalizadores en absoluto; la documentación puede mencionar la cadena
  solo para prohibirla.
- Los `sessions.json` heredados, JSONL de transcripciones, `.jsonl.lock`, poda, truncamiento
  y lógica antigua de rutas de sesión pertenecen solo a la ruta de migración/importación de doctor.
- Los alias heredados de configuración de sesión pertenecen solo a la migración de doctor. El runtime no
  interpreta `session.idleMinutes`, `session.resetByType.dm` ni
  alias de sesión principal `agent:main:*` entre agentes para otro agente configurado.
- La identidad de enrutamiento de sesión es estado relacional tipado. Las rutas activas de runtime y UI
  deberían leer `sessions.session_scope`, `sessions.account_id`,
  `sessions.primary_conversation_id`, `conversations` y
  `session_conversations`; no deben analizar `session_key` ni extraer
  `session_entries.entry_json` para identidad de proveedor, excepto como sombra de compatibilidad
  mientras se eliminan los sitios de llamada antiguos.
- Los marcadores de mensajes directos a nivel de canal, como `dm` frente a `direct`, son vocabulario
  de enrutamiento, no localizadores de transcripción ni manejadores de compatibilidad de almacén de archivos.
- La configuración heredada de manejadores de hooks pertenece solo a las superficies de advertencia/migración de doctor.
  El runtime no debe cargar `hooks.internal.handlers`; los hooks se ejecutan únicamente mediante directorios
  de hooks descubiertos y metadatos `HOOK.md`.
- El arranque del runtime, las rutas activas de respuesta, compaction, reinicio, recuperación, diagnósticos,
  TTS, hooks de memoria, subagentes, enrutamiento de comandos de plugin, límites de protocolo y
  hooks deben pasar `{agentId, sessionId}` por el runtime.
- Las pruebas deberían sembrar y comprobar filas de transcripción SQLite mediante
  `{agentId, sessionId}`. Las pruebas que solo prueban el reenvío de rutas JSONL,
  la preservación de localizadores suministrados por el llamador o la compatibilidad con archivos de transcripción deberían
  eliminarse, salvo que cubran importación de doctor, materialización de soporte/depuración
  no relacionada con sesiones o forma de protocolo.
- `runEmbeddedPiAgent(...)`, las ejecuciones de workers preparados y el intento embebido interno
  no deben aceptar localizadores de transcripción. Abren el gestor de transcripciones SQLite
  mediante `{agentId, sessionId}` y pasan ese gestor a la sesión de agente compatible con PI
  internalizada, para que llamadores obsoletos no puedan hacer que el runner escriba
  transcripciones JSON/JSONL.
- Los diagnósticos del runner deben almacenar registros de trazas de runtime/caché/carga útil en SQLite.
  Los diagnósticos de runtime no deben exponer controles de anulación de archivo JSONL ni ayudantes genéricos
  de exportación JSONL de transcripciones; las exportaciones orientadas al usuario pueden materializar artefactos explícitos
  desde filas de la base de datos sin devolver nombres de archivo al runtime.
- El registro de flujos sin procesar usa `OPENCLAW_RAW_STREAM=1` más filas de diagnósticos SQLite.
  El contrato antiguo de pi-mono `PI_RAW_STREAM`, `PI_RAW_STREAM_PATH` y
  el registrador de archivos `raw-openai-completions.jsonl` no forma parte del runtime ni de las pruebas de OpenClaw.
- La indexación de memoria QMD no debe exportar transcripciones SQLite a archivos markdown.
  QMD indexa solo archivos de memoria configurados; la búsqueda de transcripciones de sesión sigue
  respaldada por SQLite.
- La subruta SDK de QMD es solo para QMD en código nuevo. Los ayudantes de indexación de transcripciones
  de sesión SQLite viven en `memory-core-host-engine-session-transcripts`; cualquier
  reexportación de QMD es solo compatibilidad y el código de runtime no debe usarla.
- Los índices de memoria incorporados viven en la base de datos del agente propietario. La configuración de runtime y
  los contratos de runtime resueltos no deben exponer `memorySearch.store.path`; doctor
  elimina esa clave de configuración heredada y el código actual pasa internamente el
  `databasePath` del agente.

El trabajo de implementación debería seguir eliminando código hasta que estas afirmaciones sean verdaderas
sin excepciones fuera de los límites de doctor/importación/exportación/depuración.

## Estado objetivo y progreso

### Objetivo estricto

- Una base de datos SQLite global es propietaria del estado del plano de control:
  `state/openclaw.sqlite`.
- Una base de datos SQLite por agente es propietaria del estado del plano de datos:
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- La configuración sigue respaldada por archivos. `openclaw.json` no forma parte de esta refactorización
  de base de datos.
- Los archivos heredados son solo entradas de migración de doctor.
- El runtime nunca escribe ni lee JSONL de sesiones o transcripciones como estado activo.

### Estados objetivo

- `not-started`: el código de runtime de la era de archivos todavía escribe estado activo.
- `migrating`: el código de doctor/importación puede mover datos de archivos a SQLite.
- `dual-read`: puente temporal que lee tanto SQLite como archivos heredados. Este estado
  está prohibido para esta refactorización salvo que se documente explícitamente como
  exclusivo de doctor.
- `sqlite-runtime`: el runtime lee y escribe solo SQLite.
- `clean`: las API y pruebas heredadas de runtime se eliminan, y la guarda evita
  regresiones.
- `done`: la documentación, las pruebas, la copia de seguridad, la migración de doctor y las comprobaciones de cambios prueban el
  estado limpio.

### Estado actual

- Sesiones: `clean` para runtime. Las filas de sesión viven en la base de datos por agente,
  las API de runtime usan `{agentId, sessionId}` o `{agentId, sessionKey}`, y
  `sessions.json` es una entrada heredada solo de doctor.
- Transcripciones: `clean` para runtime. Los eventos, identidades, snapshots
  y eventos de runtime de trayectoria de transcripciones viven en la base de datos por agente. El runtime ya no
  acepta localizadores de transcripción ni rutas JSONL de transcripción.
- Runner embebido PI: `clean`. Las ejecuciones embebidas PI, los workers preparados, compaction
  y los bucles de reintento usan el alcance de sesión SQLite y rechazan manejadores de transcripción obsoletos.
- Cron: `clean` para runtime. El runtime usa `cron_jobs` y `cron_run_logs`;
  las pruebas de runtime usan nomenclatura `storeKey` de SQLite, y las rutas cron de la era de archivos permanecen
  solo en pruebas de migración heredada de doctor.
- Registro de tareas: `clean`. Las filas de runtime de tareas y Task Flow viven en
  `state/openclaw.sqlite`; los importadores SQLite laterales no publicados se eliminaron.
- Estado de Plugin: `clean`. Las filas de estado/blob de Plugin viven en la base de datos global
  compartida; los ayudantes antiguos de SQLite lateral de estado de plugin están protegidos contra uso.
- Memoria: `sqlite-runtime` para memoria incorporada e indexación de transcripciones de sesión.
  Las tablas de índices de memoria viven en la base de datos por agente, el estado de memoria de plugins usa
  filas compartidas de estado de plugin, y los archivos de memoria heredados son entradas de migración de doctor
  o contenido del espacio de trabajo del usuario.
- Copia de seguridad: `sqlite-runtime`. Las etapas de copia de seguridad compactan snapshots SQLite, omiten archivos laterales
  WAL/SHM vivos, verifican la integridad de SQLite y registran ejecuciones de copia de seguridad en la
  base de datos global.
- Migración de doctor: `migrating`, intencionalmente. Doctor importa JSON,
  JSONL y almacenes laterales retirados heredados a SQLite, registra ejecuciones/fuentes de migración
  y elimina fuentes exitosas.
- Scripts E2E: `clean` para cobertura de runtime. La siembra Docker MCP escribe filas SQLite.
  El script Docker de contexto de runtime crea JSONL heredado solo dentro de la
  semilla de migración de doctor y nombra explícitamente la ruta del índice de sesión heredado.

### Trabajo restante

- [x] Renombrar variables de almacén en pruebas de runtime de cron que se alejen de `storePath`, salvo
      que sean entradas heredadas de doctor.
      Archivos: `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`.
      Prueba: `pnpm check:database-first-legacy-stores`; `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`.
- [x] Eliminar o renombrar mocks de pruebas de exportación obsoletos de la era de archivos.
      Archivo: `src/auto-reply/reply/commands-export-test-mocks.ts`.
      Prueba: `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`.
- [x] Hacer que la semilla JSONL heredada de Docker runtime-context sea obviamente solo de doctor.
      Archivo: `scripts/e2e/session-runtime-context-docker-client.ts`.
      Prueba: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` muestra solo
      `seedBrokenLegacySessionForDoctorMigration`.
- [x] Mantener alineados los tipos generados por Kysely después de cualquier cambio de esquema.
      Archivos: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      Prueba: no hubo cambio de esquema en esta pasada; `pnpm db:kysely:check`;
      `pnpm lint:kysely`.
- [x] Volver a ejecutar pruebas enfocadas para almacenes, comandos y scripts tocados.
      Prueba: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`.
- [x] Antes de declarar `done`, ejecutar la puerta de cambios o una prueba amplia remota.
      Prueba: `pnpm check:changed --timed -- <changed extension paths>` pasó en
      la ejecución de Hetzner Crabbox `run_3f1cabf6b25c` después de configurar temporalmente Node 24/pnpm y
      enrutamiento explícito de rutas para el espacio de trabajo sincronizado sin `.git`.

### No provocar regresiones

- Sin localizadores de transcripción.
- Sin archivos de sesión activos.
- Sin fixtures de prueba JSONL falsos excepto pruebas de migración heredada de doctor.
- Sin acceso SQLite sin procesar donde se espera Kysely.
- Sin nuevas migraciones de base de datos heredadas. Este diseño no se ha publicado; mantener la versión de esquema
  en `1` salvo que haya una razón sólida.

## Suposiciones de lectura de código

No hay decisiones de producto de seguimiento que bloqueen este plan. La implementación debería
proceder con estas suposiciones:

- Usa `node:sqlite` directamente y exige el entorno de ejecución Node 22+ para esta ruta
  de almacenamiento.
- Mantén exactamente un archivo de configuración normal. No muevas la configuración, los manifiestos de plugins
  ni los espacios de trabajo de Git a SQLite en esta refactorización.
- No se requieren archivos de compatibilidad en tiempo de ejecución. Los archivos JSON y JSONL heredados son
  solo entradas de migración. Los sidecars SQLite locales de la rama nunca se publicaron y se
  eliminan en lugar de importarse.
- `openclaw doctor --fix` es responsable del paso de migración heredado de archivo a base de datos.
  El inicio en tiempo de ejecución y `openclaw migrate` no deben cargar rutas heredadas de
  actualización de bases de datos de OpenClaw.
- La compatibilidad de credenciales sigue la misma regla: las credenciales en tiempo de ejecución viven en
  SQLite. Los archivos antiguos `auth-profiles.json`, `auth.json` por agente y
  `credentials/oauth.json` compartido son entradas de migración de doctor, y luego se eliminan
  tras la importación.
- El estado generado del catálogo de modelos está respaldado por la base de datos. El código en tiempo de ejecución no debe escribir
  `agents/<agentId>/agent/models.json`; los archivos `models.json` existentes son entradas heredadas
  de doctor y se eliminan tras importarse en `agent_model_catalogs`.
- El tiempo de ejecución no debe migrar, normalizar ni enlazar localizadores de transcripciones. La identidad
  activa de transcripción es `{agentId, sessionId}` en SQLite. Las rutas de archivo son
  solo entradas heredadas de doctor, y `sqlite-transcript://...` debe desaparecer de las superficies
  de tiempo de ejecución, protocolo, hook y plugin en lugar de tratarse como un
  identificador de límite.
- Las lecturas de transcripciones SQLite en tiempo de ejecución no ejecutan migraciones antiguas de forma de entradas JSONL ni
  reescriben transcripciones completas por compatibilidad. La normalización de entradas heredadas permanece en
  utilidades explícitas de doctor/importación. Doctor normaliza los archivos heredados de transcripciones JSONL
  antes de insertar filas SQLite; las filas actuales de tiempo de ejecución ya se escriben en
  el esquema de transcripción actual. La exportación de trayectorias/sesiones
  lee esas filas tal cual y no debe realizar migraciones heredadas durante la exportación.
- Los helpers heredados de análisis/migración de transcripciones JSONL son solo para doctor. El código de
  formato de transcripción en tiempo de ejecución construye únicamente el contexto actual de transcripción SQLite; doctor
  se encarga de las actualizaciones de entradas JSONL antiguas antes de insertar filas.
- El antiguo helper de streaming de transcripciones JSONL propiedad del tiempo de ejecución se eliminó. El código de
  importación de doctor se encarga de las lecturas explícitas de archivos heredados; las lecturas del historial de sesiones
  en tiempo de ejecución leen filas SQLite.
- Los bindings del app-server de Codex usan el `sessionId` de OpenClaw como la clave canónica
  en el espacio de nombres de estado del plugin Codex. `sessionKey` es metadato para
  enrutamiento/visualización y no debe reemplazar el id de sesión duradero ni resucitar
  la identidad de archivo de transcripción.
- Los motores de contexto reciben directamente el contrato actual en tiempo de ejecución. El registro
  no debe envolver motores con shims de reintento que eliminen `sessionKey`,
  `transcriptScope` o `prompt`; los motores que no puedan aceptar los parámetros actuales
  basados primero en base de datos deben fallar de forma explícita en lugar de enlazarse.
- La salida de copia de seguridad debe seguir siendo un único archivo de archivo comprimido. El contenido de la base de datos debe entrar
  en ese archivo como snapshots SQLite compactos, no como sidecars WAL vivos sin procesar.
- La búsqueda de transcripciones es útil, pero no es necesaria para el primer
  corte basado primero en base de datos. Diseña el esquema para que FTS pueda añadirse más adelante.
- La ejecución de workers debe permanecer experimental detrás de ajustes mientras se estabiliza el límite de
  base de datos.

## Hallazgos de lectura de código

La rama actual ya ha superado la etapa de prueba de concepto. La base de datos
compartida existe, `node:sqlite` de Node está conectado mediante un pequeño helper de tiempo de ejecución, y
los almacenes anteriores ahora escriben en `state/openclaw.sqlite` o en la base de datos
`openclaw-agent.sqlite` correspondiente.

El trabajo restante no es elegir SQLite; es mantener limpio el nuevo límite
y eliminar cualquier interfaz con forma de compatibilidad que todavía parezca el antiguo
mundo de archivos:

- `storePath` de sesión ya no es una identidad en tiempo de ejecución, forma de fixture de pruebas ni
  campo de payload de estado. Las pruebas de tiempo de ejecución y bridge ya no contienen el
  nombre de contrato `storePath`; el código de doctor/migración posee ese vocabulario heredado.
- Las escrituras de sesión ya no pasan por la antigua cola en proceso `store-writer.ts`.
  Las escrituras de parches SQLite usan detección de conflictos y reintentos acotados en su lugar.
- El descubrimiento de rutas heredadas aún tiene usos válidos de migración, pero el código en tiempo de ejecución debe
  dejar de tratar `sessions.json` y los archivos JSONL de transcripciones como posibles destinos de escritura.
- Las tablas propiedad del agente viven en bases de datos SQLite por agente. La base de datos global conserva
  filas de registro/plano de control; la identidad de transcripción es `{agentId, sessionId}` en
  las filas de transcripción por agente. El código en tiempo de ejecución no debe persistir rutas de archivos de
  transcripciones ni migrar localizadores de transcripciones.
- Doctor ya importa varios archivos heredados. La limpieza consiste en convertirlo en una
  única implementación de migración explícita que doctor llame, con un informe de migración duradero.

No hay preguntas de producto adicionales que bloqueen la implementación.

## Forma actual del código

La rama ya tiene una base SQLite compartida real:

- El piso de runtime ahora es Node 22+: `package.json`, la guarda de runtime de la CLI,
  los valores predeterminados del instalador, el localizador de runtime de macOS, CI y la documentación
  pública de instalación coinciden. Se elimina la antigua lane de compatibilidad con Node 22.
- `src/state/openclaw-state-db.ts` abre `openclaw.sqlite`, establece WAL,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON` y aplica
  el módulo de esquema generado derivado de
  `src/state/openclaw-state-schema.sql`.
- Los tipos de tabla de Kysely y los módulos de esquema de runtime se generan a partir de bases de datos
  SQLite desechables creadas desde los archivos `.sql` confirmados; el código de runtime ya no
  mantiene cadenas de esquema copiadas y pegadas para bases de datos globales, por agente o de
  captura de proxy.
- Los almacenes de runtime derivan los tipos de filas seleccionadas e insertadas de esas interfaces
  `DB` generadas de Kysely en lugar de replicar manualmente las formas de filas SQLite. El SQL sin procesar
  sigue limitado a la aplicación de esquemas, pragmas y DDL exclusivo de migraciones.
- Los esquemas SQLite se contraen a `user_version = 1` porque este diseño de base de datos
  aún no se ha publicado. Los abridores de runtime crean solo el esquema actual;
  la importación de archivo a base de datos permanece en el código de doctor, y se han eliminado
  los helpers de actualización de base de datos locales de la rama.
- La propiedad relacional se aplica donde el límite de propiedad es canónico:
  las filas de migración de origen se propagan en cascada desde `migration_runs`, el estado de entrega de tareas
  se propaga en cascada desde `task_runs`, y las filas de identidad de transcripción se propagan en cascada desde
  eventos de transcripción.
- Las tablas compartidas actuales incluyen `agent_databases`,
  `auth_profile_stores`, `auth_profile_state`,
  `plugin_state_entries`, `plugin_blob_entries`, `media_blobs`,
  `skill_uploads`, `capture_sessions`, `capture_events`, `capture_blobs`,
  `sandbox_registry_entries`, `cron_run_logs`, `cron_jobs`, `commitments`,
  `delivery_queue_entries`, `model_capability_cache`,
  `workspace_setup_state`, `native_hook_relay_bridges`,
  `current_conversation_bindings`, `plugin_binding_approvals`,
  `tui_last_sessions`, `acp_sessions`, `acp_replay_sessions`,
  `acp_replay_events`, `task_runs`, `task_delivery_state`, `flow_runs`,
  `subagent_runs`, `migration_runs` y `backup_runs`.
- El estado arbitrario propiedad del plugin no obtiene tablas tipadas propiedad del host. Los
  plugins instalados usan `plugin_state_entries` para payloads JSON versionados y
  `plugin_blob_entries` para bytes, con propiedad de namespace/clave, limpieza TTL,
  copia de seguridad y registros de migración de plugin. El estado de orquestación de plugins propiedad del host
  todavía puede tener tablas tipadas cuando el host posee el contrato de consulta, como
  `plugin_binding_approvals`.
- Las migraciones de plugin son migraciones de datos sobre namespaces propiedad del plugin, no migraciones
  de esquema del host. Un plugin puede migrar sus propias entradas versionadas de estado/blob
  mediante un proveedor de migración, y el host registra el estado de origen/ejecución en el
  libro mayor normal de migraciones. Las nuevas instalaciones de plugins no requieren cambiar
  `openclaw-state-schema.sql` a menos que el propio host esté asumiendo la propiedad de un
  nuevo contrato entre plugins.
- `src/state/openclaw-agent-db.ts` abre
  `agents/<agentId>/agent/openclaw-agent.sqlite`, registra la base de datos en la
  base de datos global y posee las tablas locales del agente para sesión, transcripción, VFS, artefactos, caché
  e índice de memoria. El descubrimiento de runtime compartido ahora lee el registro
  `agent_databases` tipado y generado en lugar de volver a implementar esa consulta en cada
  sitio de llamada.
- Las bases de datos globales y por agente registran una fila `schema_meta` con el rol de la base de datos,
  la versión del esquema, marcas de tiempo e id del agente para bases de datos de agente. El diseño aún
  permanece en `user_version = 1` porque este esquema SQLite no se ha publicado todavía.
- La identidad de sesión por agente ahora tiene una tabla raíz canónica `sessions` con clave
  `session_id`, con `session_key`, `session_scope`, `account_id`,
  `primary_conversation_id`, marcas de tiempo, campos de visualización, metadatos de modelo,
  id de harness y enlace padre/spawn como columnas consultables. `session_routes`
  es el índice único de ruta activa desde `session_key` hasta el `session_id` actual,
  por lo que una clave de ruta puede moverse a una sesión durable nueva sin hacer que las lecturas
  calientes elijan entre filas duplicadas de `sessions.session_key`. El antiguo
  payload con forma de compatibilidad `session_entries.entry_json` cuelga de la raíz durable
  `session_id` mediante clave externa; ya no es la única representación a nivel de esquema
  de una sesión.
- La identidad de conversación externa por agente también es relacional:
  `conversations` almacena la identidad normalizada de proveedor/cuenta/conversación, y
  `session_conversations` vincula una sesión de OpenClaw con una o más conversaciones
  externas. Esto cubre sesiones DM compartidas principales donde varios pares pueden
  mapearse intencionalmente a una sesión sin mentir en `session_key`. SQLite también
  aplica unicidad para la identidad natural del proveedor, de modo que la misma tupla
  canal/cuenta/tipo/par/hilo no pueda bifurcarse entre ids de conversación.
  Los pares directos compartidos principales se vinculan con un rol `participant`, por lo que una
  sesión de OpenClaw puede representar varios pares DM externos sin degradar
  pares anteriores a filas relacionadas vagas. `sessions.primary_conversation_id` todavía
  apunta al destino de entrega tipado actual. Las columnas cerradas de enrutamiento/estado
  se aplican con restricciones SQLite `CHECK` en lugar de depender solo de
  uniones de TypeScript.
  La proyección de sesión de runtime limpia las sombras de enrutamiento de compatibilidad de
  `session_entries.entry_json` antes de aplicar columnas tipadas de sesión/conversación,
  por lo que los payloads JSON obsoletos no pueden resucitar destinos de entrega.
  El enrutamiento de anuncios de subagentes igualmente requiere el contexto de entrega tipado de SQLite;
  ya no recurre a campos de ruta de compatibilidad `SessionEntry`.
  La herencia de entrega explícita de `chat.send` de Gateway lee el contexto de entrega tipado
  de SQLite en lugar de los campos de compatibilidad `origin`/`last*`.
  `tools.effective` igualmente deriva el contexto de proveedor/cuenta/hilo de filas tipadas
  de entrega/enrutamiento SQLite, no de sombras obsoletas `last*` de entradas de sesión.
  El contexto de prompt de eventos del sistema reconstruye campos de canal/to/cuenta/hilo desde
  campos de entrega tipados en lugar de sombras `origin`.
  El helper compartido `deliveryContextFromSession` y el mapper de sesión a conversación
  ahora ignoran `SessionEntry.origin` por completo; solo los campos de entrega tipados
  y las filas relacionales de conversación pueden crear identidad de ruta caliente.
  La normalización de entradas de sesión de runtime elimina `origin` antes de persistir o
  proyectar `entry_json`, y las escrituras de metadatos entrantes escriben campos tipados
  de canal/chat más filas relacionales de conversación en lugar de crear nuevas sombras
  de origen.
- Los eventos de transcripción, snapshots de transcripción y eventos de runtime de trayectoria ahora
  referencian la raíz canónica `sessions` por agente y se propagan en cascada al eliminar la sesión.
  Las filas de identidad/idempotencia de transcripción siguen propagándose en cascada desde la
  fila exacta del evento de transcripción.
- Los índices de memory-core ahora usan tablas explícitas de base de datos de agente
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks` y
  `memory_embedding_cache`, con `memory_index_state` rastreando cambios de revisión.
  Los índices laterales opcionales FTS/vector se nombran `memory_index_chunks_fts` y
  `memory_index_chunks_vec` en lugar de tablas genéricas `meta`, `files`, `chunks`,
  `chunks_fts` o `chunks_vec`. Los nombres canónicos conservan la forma actual
  de fila de ruta/origen y la compatibilidad de embeddings serializados. Estas tablas
  son caché derivada/de búsqueda, no almacenamiento canónico de transcripciones; pueden
  eliminarse y reconstruirse desde archivos de workspace de memoria y fuentes configuradas.
  Abrir un índice de memoria con nombres genéricos publicado migra sus metadatos, fuentes,
  chunks y caché de embeddings a las tablas canónicas; las tablas derivadas FTS/vector
  se reconstruyen con sus nombres canónicos.
- El estado de recuperación de ejecuciones de subagentes ahora vive en filas compartidas tipadas
  `subagent_runs` con claves indexadas de sesión hija, solicitante y controladora. El antiguo
  archivo `subagents/runs.json` es solo entrada de migración de doctor.
- Los bindings de conversación actual ahora viven en filas compartidas tipadas
  `current_conversation_bindings` con clave por id de conversación normalizado, con
  columnas de agente/sesión destino, tipo de conversación, estado, expiración y metadatos
  almacenados como columnas relacionales en lugar de un registro de binding opaco duplicado.
  La clave de binding durable incluye el tipo de conversación normalizado para que las
  referencias direct/group/channel no colisionen, y SQLite rechaza valores inválidos de tipo/estado
  de binding. El antiguo
  archivo `bindings/current-conversations.json` es solo entrada de migración de doctor.
- La recuperación de la cola de entrega ahora superpone columnas tipadas de cola para canal, destino,
  cuenta, sesión, reintento, error, envío de plataforma y estado de recuperación sobre el
  JSON de replay. `entry_json` conserva los payloads de replay, hooks y payload
  de formato, pero las columnas tipadas son autoritativas para el enrutamiento/estado caliente de cola.
- Los punteros de restauración de la última sesión de TUI ahora viven en filas compartidas tipadas
  `tui_last_sessions` con clave por el alcance hasheado de conexión/sesión TUI.
  El antiguo archivo JSON de TUI es solo entrada de migración de doctor.
- Las preferencias predeterminadas de TTS ahora viven en filas SQLite de estado de plugin compartidas con clave bajo el
  plugin `speech-core`. El antiguo archivo `settings/tts.json` es solo entrada de migración
  de doctor; el runtime ya no lee ni escribe archivos JSON de preferencias TTS, y el
  resolvedor de ruta heredado vive en el módulo de migración de doctor.
- Los metadatos de destino de secretos ahora hablan de almacenes en lugar de fingir que cada
  destino de credenciales es un archivo de configuración. `openclaw.json` sigue siendo el almacén de configuración;
  los destinos de perfil de autenticación usan filas SQLite tipadas `auth_profile_stores` con
  credenciales con forma de proveedor conservadas como payloads JSON.
- La auditoría de secretos ya no escanea archivos retirados `auth.json` por agente. Doctor posee
  la advertencia, importación y eliminación de ese archivo heredado.
- Los helpers heredados de rutas de perfiles de autenticación ahora viven en código heredado de doctor. Los helpers
  de rutas de perfiles de autenticación del core exponen identidad y ubicaciones de visualización del almacén de autenticación SQLite,
  no rutas de runtime `auth-profiles.json` ni `auth-state.json`.
- Los módulos de runtime de recuperación de ejecuciones de subagentes y caché de capacidades de modelos de OpenRouter
  ahora mantienen los lectores/escritores de snapshots SQLite separados de los helpers de importación JSON heredados
  exclusivos de doctor. Las capacidades de OpenRouter usan las filas tipadas genéricas
  `model_capability_cache` bajo `provider_id = "openrouter"` en lugar de
  un blob de caché opaco o una tabla del host específica del proveedor. El `taskName` de ejecución de subagente
  se almacena en la columna tipada `subagent_runs.task_name`; la copia
  `payload_json` es datos de replay/depuración, no la fuente de campos calientes de visualización o
  búsqueda.
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` implementa un VFS SQLite
  sobre la tabla `vfs_entries` de la base de datos del agente. Las lecturas de directorio, exportaciones
  recursivas, eliminaciones y renombrados usan rangos de prefijo indexados `(namespace, path)`
  en lugar de escanear un namespace completo o depender de coincidencias de ruta con `LIKE`.
- `src/agents/runtime-worker.entry.ts` crea VFS SQLite por ejecución, artefacto de herramienta,
  artefacto de ejecución y almacenes de caché con alcance para workers.
- Los marcadores de finalización del arranque del workspace ahora viven en filas compartidas tipadas
  `workspace_setup_state` con clave por ruta de workspace resuelta en lugar de
  `.openclaw/workspace-state.json`; el runtime ya no lee ni reescribe el
  marcador heredado de workspace, y las API helper ya no pasan una ruta falsa
  `.openclaw/setup-state` solo para derivar identidad de almacenamiento.
- Las aprobaciones de exec ahora viven en la fila singleton tipada compartida SQLite
  `exec_approvals_config`. Doctor importa el `~/.openclaw/exec-approvals.json` heredado;
  las escrituras de runtime ya no crean, reescriben ni reportan ese archivo como su ubicación
  de almacén activo. El companion de macOS lee y escribe la misma fila de tabla
  `state/openclaw.sqlite`; conserva solo el socket de prompt Unix en disco
  porque eso es IPC, no estado durable de runtime.
- Los módulos de runtime de identidad de dispositivo, autenticación de dispositivo y arranque ahora mantienen sus
  lectores/escritores de snapshots SQLite separados de los helpers de importación JSON heredados exclusivos de doctor.
  La identidad de dispositivo usa filas tipadas `device_identities` y los tokens de autenticación de dispositivo
  usan filas tipadas `device_auth_tokens`. Las escrituras de autenticación de dispositivo reconcilian filas
  por dispositivo/rol en lugar de truncar la tabla de tokens, y el runtime ya no
  enruta actualizaciones de token único mediante el antiguo adaptador de almacén completo. El heredado
  Las cargas útiles JSON de versión 1 existen solo como formas de importación/exportación de doctor.
- La caché de intercambio de tokens de GitHub Copilot usa la tabla compartida de estado de plugins de SQLite
  bajo `github-copilot/token-cache/default`. Es estado de caché propiedad del proveedor,
  por lo que intencionadamente no añade una tabla de esquema del host.
- La Compaction de GitHub Copilot ya no escribe archivos complementarios de espacio de trabajo `openclaw-compaction-*.json`.
  El arnés llama al RPC de Compaction de historial del SDK para la sesión
  rastreada del SDK, y OpenClaw mantiene el estado duradero de sesión/transcripción en
  SQLite en lugar de archivos marcadores de compatibilidad.
- El runtime compartido de Swift (`OpenClawKit`) usa las mismas filas de
  `state/openclaw.sqlite` para la identidad del dispositivo y la autenticación del dispositivo. Los ayudantes de la app de macOS
  importan los ayudantes compartidos de SQLite en lugar de poseer una segunda ruta JSON o
  SQLite. Un `identity/device.json` heredado restante bloquea la creación de identidad
  hasta que doctor lo importa a SQLite, coincidiendo con la puerta de inicio de TypeScript y Android.
- La identidad de dispositivo de Android usa el mismo material de claves compatible con TypeScript
  almacenado en filas tipadas de `state/openclaw.sqlite#table/device_identities`. Nunca
  lee ni escribe `openclaw/identity/device.json`; un archivo heredado restante bloquea
  el inicio hasta que doctor lo importa a SQLite.
- Los tokens de autenticación de dispositivo en caché de Android también usan filas tipadas de
  `state/openclaw.sqlite#table/device_auth_tokens` y comparten la misma semántica de tokens
  de versión 1 que TypeScript y Swift. El runtime ya no lee claves de compatibilidad `SecurePrefs`
  `gateway.deviceToken*`; esas pertenecen solo a la lógica de migración/doctor.
- El historial de paquetes recientes de notificaciones de Android usa filas tipadas de
  `android_notification_recent_packages`. El runtime ya no migra ni
  lee las antiguas claves CSV de SharedPreferences.
- La creación de identidad de dispositivo falla de forma cerrada cuando existe un `identity/device.json`
  heredado, cuando la fila de identidad de SQLite no es válida o cuando no se puede abrir el almacén
  de identidades de SQLite. Doctor importa y elimina ese archivo primero, de modo que el inicio
  del runtime no puede rotar silenciosamente la identidad de emparejamiento antes de la migración.
- La selección de identidad de dispositivo es una clave de fila de SQLite, no un localizador de archivo JSON. Las pruebas
  y los ayudantes de Gateway pasan claves de identidad explícitas; solo la migración de doctor y la
  puerta de inicio de fallo cerrado conocen el nombre de archivo retirado `identity/device.json`.
- La compatibilidad de restablecimiento de sesión ahora vive en la migración de configuración de doctor:
  `session.idleMinutes` se mueve a `session.reset.idleMinutes`,
  `session.resetByType.dm` se mueve a `session.resetByType.direct`, y la
  política de restablecimiento del runtime solo lee claves de restablecimiento canónicas.
- La compatibilidad de configuración heredada ahora vive bajo `src/commands/doctor/`. La validación normal de
  `readConfigFileSnapshot()` no importa detectores heredados de doctor
  ni anota problemas heredados; `runDoctorConfigPreflight()` añade esos problemas para
  la reparación/informe de doctor. El flujo de configuración de doctor importa
  `src/commands/doctor/legacy-config.ts`, y la reparación antigua de id de perfil OAuth vive
  bajo
  `src/commands/doctor/legacy/oauth-profile-ids.ts`.
- Los comandos que no son doctor no ejecutan automáticamente la reparación de configuración heredada. Por ejemplo,
  `openclaw update --channel` ahora falla ante una configuración heredada no válida y pide al
  usuario que ejecute doctor, en lugar de importar silenciosamente código de migración de doctor.
- Web push, APNs, Voice Wake, las comprobaciones de actualización y la salud de configuración ahora usan tablas compartidas de SQLite
  tipadas para suscripciones, claves VAPID, registros de nodos, filas de disparadores,
  filas de enrutamiento, estado de notificación de actualizaciones y entradas de salud de configuración en lugar de
  blobs JSON opacos completos. Las escrituras de instantáneas de Web push y APNs ahora reconcilian
  suscripciones/registros por clave primaria en lugar de vaciar sus tablas;
  la salud de configuración hace lo mismo por ruta de configuración.
  Sus módulos de runtime mantienen los lectores/escritores de instantáneas de SQLite separados de
  los ayudantes de importación JSON heredados exclusivos de doctor.
- La configuración de host Node ahora usa una fila singleton tipada en la base de datos SQLite compartida;
  doctor importa el antiguo archivo `node.json` antes del uso normal del runtime.
- El emparejamiento de dispositivo/nodo, el emparejamiento de canales, las listas de permitidos de canales y el estado de arranque
  ahora usan filas SQLite tipadas en lugar de blobs JSON opacos completos. Las aprobaciones de enlace de Plugin
  y el estado de trabajos cron siguen la misma división: los módulos de runtime exponen
  operaciones respaldadas por SQLite y ayudantes neutrales de instantáneas, y las escrituras de instantáneas de emparejamiento/arranque
  más aprobación de enlace de plugins reconcilian filas por clave primaria
  en lugar de truncar tablas, mientras doctor importa/elimina los antiguos archivos JSON mediante
  módulos `src/commands/doctor/legacy/*`.
- Los registros de plugins instalados ahora viven en el índice de plugins instalados de SQLite.
  La lectura/escritura de configuración del runtime ya no migra ni preserva los antiguos
  datos de configuración creada `plugins.installs`; doctor importa esa forma de configuración
  heredada a SQLite antes del uso normal del runtime.
- Las instantáneas de recuperación de credenciales de QQBot ahora viven en el estado de plugins de SQLite bajo
  `qqbot/credential-backups`. El runtime ya no escribe
  `qqbot/data/credential-backup*.json`; doctor importa y elimina esos
  archivos de respaldo heredados con las otras entradas de estado de QQBot.
- La planificación de recarga de Gateway compara instantáneas del índice de plugins instalados de SQLite bajo
  un espacio de nombres de diferencias interno `installedPluginIndex.installRecords.*`. Las decisiones
  de recarga del runtime ya no envuelven esas filas en objetos de configuración falsos
  `plugins.installs`.
- La actualización de credenciales de cuentas nombradas de Matrix ya no ocurre durante las lecturas
  del runtime. Doctor posee el cambio de nombre del antiguo
  `credentials/matrix/credentials.json` de nivel superior cuando se puede resolver una cuenta Matrix única/predeterminada.
- Los módulos de runtime de emparejamiento central y cron ya no exportan constructores de rutas JSON
  heredadas. Los módulos heredados propiedad de doctor construyen rutas fuente de `pending.json`, `paired.json`,
  `bootstrap.json` y `cron/jobs.json` solo para pruebas de importación y
  migración. La normalización heredada de forma de trabajo cron y la importación de registros de ejecución de cron
  viven bajo `src/commands/doctor/legacy/cron*.ts`.
- `src/commands/doctor/legacy/runtime-state.ts` importa archivos de estado JSON
  heredados, incluida la configuración de host de nodo, a SQLite desde doctor. Los nuevos importadores de archivos heredados
  permanecen bajo `src/commands/doctor/legacy/`.
- `src/commands/doctor/state-migrations.ts` importa `sessions.json` heredado y
  transcripciones `*.jsonl` directamente a SQLite y elimina las fuentes correctas. Ya
  no prepara transcripciones heredadas raíz mediante
  `agents/<agentId>/sessions/*.jsonl` ni crea un destino JSONL canónico antes de
  la importación.
- Las comprobaciones de integridad de estado de doctor ya no escanean directorios de sesiones heredadas ni
  ofrecen eliminación de JSONL huérfanos. Los archivos de transcripción heredados son entradas de migración
  únicamente, y el paso de migración posee la importación más la eliminación de la fuente.
- La importación del registro de sandbox heredado vive bajo
  `src/commands/doctor/legacy/sandbox-registry.ts`; las lecturas y escrituras del registro de sandbox
  activo siguen siendo solo SQLite.
- La reparación heredada de salud/importación de transcripciones de sesión vive bajo
  `src/commands/doctor/legacy/session-transcript-health.ts`; los módulos de comandos de runtime
  ya no llevan análisis de transcripciones JSONL ni código de reparación de ramas activas.

Aspectos destacados de consolidación/eliminación completados:

- El estado de Plugin ahora usa la base de datos compartida `state/openclaw.sqlite`. El importador sidecar antiguo
  `plugin-state/state.sqlite` local de la rama se eliminó porque
  ese diseño de SQLite nunca se lanzó. Los helpers de sondeo/prueba informan el
  `databasePath` compartido en lugar de exponer una ruta SQLite específica de estado de Plugin.
  Los descriptores de worker preparados también omiten los localizadores de transcripción. El estado de sesión del tiempo de ejecución y las ejecuciones de seguimiento en cola llevan `{agentId, sessionId}` en lugar de identificadores de transcripción derivados.
- La compaction incrustada ahora toma el alcance de SQLite desde `agentId` y `sessionId`. Los hooks de compaction, las llamadas al motor de contexto, la delegación de CLI y las respuestas de protocolo no deben recibir identificadores derivados `sqlite-transcript://...`. El código de exportación/depuración puede materializar artefactos de usuario explícitos a partir de filas, pero no proporciona una ruta genérica de exportación JSONL de sesión ni vuelve a introducir nombres de archivo en la identidad del tiempo de ejecución.
- `/export-session` lee filas de transcripción desde SQLite y escribe únicamente la vista HTML independiente solicitada. El visor incrustado ya no reconstruye ni descarga JSONL de sesión a partir de esas filas.
- La delegación del motor de contexto ya no analiza un localizador de transcripción para recuperar la identidad del agente. El contexto de tiempo de ejecución preparado lleva el `agentId` resuelto al adaptador de compaction integrado.
- La reescritura de transcripciones y el truncamiento en vivo de resultados de herramientas ahora leen y persisten el estado de transcripción por `{agentId, sessionId}` y no derivan localizadores temporales para las cargas de eventos de actualización de transcripción.
- La superficie auxiliar de estado de transcripción ya no tiene variantes basadas en localizador de `readTranscriptState`, `replaceTranscriptStateEvents` ni `persistTranscriptStateMutation`. Los llamadores del tiempo de ejecución deben usar las API `{agentId, sessionId}`. La importación de doctor lee archivos heredados por ruta de archivo explícita y escribe filas de SQLite; no migra cadenas de localizador.
- El contrato del administrador de sesiones del tiempo de ejecución ya no expone `open(locator)`, `forkFrom(locator)` ni `setTranscriptLocator(...)`. Los administradores de sesiones persistidas se abren solo por `{agentId, sessionId}`; los auxiliares de listado/bifurcación viven en API de sesiones y puntos de control orientadas a filas en lugar de en la fachada del administrador de transcripciones.
- Las API lectoras de transcripción de Gateway son de alcance primero. Toman `{agentId, sessionId}` y no aceptan un localizador de transcripción posicional que podría convertirse accidentalmente en identidad de tiempo de ejecución. El análisis de localizadores de transcripción activos desapareció; las rutas de origen heredadas solo son leídas por el código de importación de doctor.
- Los eventos de actualización de transcripción también son de alcance primero. `emitSessionTranscriptUpdate` ya no acepta una cadena de localizador sin más, y los listeners enrutan por `{agentId, sessionId}` sin analizar un identificador.
- La difusión de mensajes de sesión de Gateway resuelve claves de sesión desde el alcance de agente/sesión, no desde un localizador de transcripción. El antiguo resolvedor/caché de clave de sesión a partir de localizador de transcripción desapareció.
- Los filtros SSE de historial de sesiones de Gateway filtran actualizaciones en vivo por alcance de agente/sesión. Ya no canonicalizan candidatos de localizador de transcripción, rutas reales ni identidades de transcripción con forma de archivo para decidir si un flujo debe recibir una actualización.
- Los hooks del ciclo de vida de sesión ya no derivan ni exponen localizadores de transcripción en `session_end`. Los consumidores de hooks reciben `sessionId`, `sessionKey`, ids de siguiente sesión y contexto de agente; los archivos de transcripción no forman parte del contrato de ciclo de vida.
- Los hooks de reinicio tampoco derivan ni exponen localizadores de transcripción. La carga de `before_reset` lleva mensajes de SQLite recuperados más el motivo del reinicio, mientras que la identidad de sesión permanece en el contexto del hook.
- El reinicio del arnés de agente ya no acepta un localizador de transcripción. El despacho de reinicio se acota por `sessionId`/`sessionKey` más el motivo.
- Los tipos de sesión de extensiones de agente ya no exponen `transcriptLocator`; las extensiones deben usar el contexto de sesión y las API de tiempo de ejecución en lugar de recurrir a una identidad de transcripción con forma de archivo.
- Los hooks de compaction de Plugin ya no exponen localizadores de transcripción. El contexto del hook ya lleva identidad de sesión, y las lecturas de transcripción deben pasar por API conscientes del alcance de SQLite en lugar de identificadores con forma de archivo.
- Los hooks `before_agent_finalize` ya no exponen `transcriptPath`, incluidas las cargas de retransmisión de hooks nativos. Los hooks de finalización usan solo contexto de sesión.
- Las respuestas de reinicio de Gateway ya no sintetizan un localizador de transcripción en la entrada devuelta. El reinicio crea filas de transcripción de SQLite, devuelve la entrada de sesión limpia y deja el acceso a la transcripción a lectores conscientes del alcance.
- Los resultados de ejecución incrustada y de compaction ya no muestran localizadores de transcripción para la contabilidad de sesión. La compaction automática actualiza solo el `sessionId` activo, los contadores de compaction y los metadatos de tokens.
- Los resultados de intento incrustado ya no devuelven `transcriptLocatorUsed`, y los resultados `compact()` del motor de contexto ya no devuelven localizadores de transcripción. Los bucles de reintento del tiempo de ejecución solo aceptan un `sessionId` sucesor.
- Los resultados de anexado de transcripción del espejo de entrega ya no devuelven localizadores de transcripción. Los llamadores reciben el `messageId` anexado; las señales de actualización de transcripción usan alcance de SQLite.
- Los auxiliares de bifurcación de sesión principal devuelven solo el `sessionId` bifurcado. La preparación de subagente pasa el alcance de agente/sesión hijo a los motores.
- Los parámetros del ejecutor de CLI y la resincronización del historial ya no aceptan localizadores de transcripción. Las lecturas de historial de CLI resuelven el alcance de transcripción de SQLite desde `{agentId, sessionId}` y el contexto de clave de sesión.
- Los fixtures de prueba de CLI y del ejecutor incrustado ahora siembran y leen filas de transcripción de SQLite por id de sesión en lugar de fingir que las sesiones activas son archivos `*.jsonl` o pasar una cadena `sqlite-transcript://...` por parámetros de tiempo de ejecución.
- Los eventos de guardia de resultados de herramientas de sesión se emiten desde un alcance de sesión conocido incluso cuando un administrador en memoria no tiene localizador derivado. Sus pruebas ya no simulan archivos de transcripción activos `/tmp/*.jsonl`.
- Los auxiliares BTW y de puntos de control de compaction ahora leen y bifurcan filas de transcripción por alcance de SQLite. Los metadatos de punto de control ahora almacenan solo ids de sesión e ids de hoja/entrada; los localizadores derivados ya no se escriben en las cargas de punto de control.
- La búsqueda de clave de transcripción de Gateway usa el alcance de transcripción de SQLite en los límites de protocolo y ya no resuelve rutas reales ni consulta stats de nombres de archivo de transcripción.
- La rotación automática de transcripciones por compaction escribe filas de transcripción sucesoras directamente mediante el almacén de transcripciones de SQLite. Las filas de sesión conservan solo la identidad de sesión sucesora, no una ruta JSONL duradera ni un localizador persistido.
- La compaction del motor de contexto incrustado usa auxiliares de rotación de transcripción nombrados por SQLite. Las pruebas de rotación ya no construyen rutas JSONL sucesoras ni modelan sesiones activas como archivos.
- La retención administrada de imágenes salientes indexa su caché de mensajes de transcripción desde stats de transcripción de SQLite en lugar de llamadas de stat del sistema de archivos.
- Se eliminaron los bloqueos de sesión del tiempo de ejecución y el carril independiente heredado de doctor para `.jsonl.lock`.
- El barrel de tiempo de ejecución de Microsoft Teams y el SDK público de Plugin ya no reexportan el antiguo auxiliar de bloqueo de archivos; las rutas de estado duradero de Plugin están respaldadas por SQLite.
- Se eliminaron la poda por antigüedad/cantidad de sesiones y la limpieza explícita de sesiones. Doctor posee la importación heredada; las sesiones obsoletas se reinician o eliminan explícitamente.
- Las comprobaciones de integridad de doctor ya no cuentan un archivo JSONL heredado como transcripción activa válida para una fila de sesión de SQLite. La salud de transcripción activa es solo de SQLite; los archivos JSONL heredados se informan como entradas de migración/limpieza de huérfanos.
- Doctor ya no trata `agents/<agent>/sessions/` como estado requerido del tiempo de ejecución. Solo escanea ese directorio cuando ya existe, como entrada heredada de importación o limpieza de huérfanos.
- `sessions.resolve` de Gateway, las rutas de parche/reinicio/compactación de sesión, la generación de subagentes, el aborto rápido, los metadatos ACP, las sesiones aisladas por Heartbeat y el parcheo de TUI ya no migran ni podan claves de sesión heredadas como efecto secundario del trabajo normal del tiempo de ejecución.
- La resolución de sesión de comandos de CLI ahora devuelve el `agentId` propietario en lugar de un `storePath`, y ya no copia filas heredadas de sesión principal durante la resolución normal de `--to` o `--session-id`. La canonicalización de filas principales heredadas pertenece solo a doctor.
- La resolución de profundidad de subagentes del tiempo de ejecución ya no lee `sessions.json` ni almacenes de sesión JSON5. Lee `session_entries` de SQLite por id de agente, y los metadatos heredados de profundidad/sesión solo pueden entrar por la ruta de importación de doctor.
- Las anulaciones de sesión de perfiles de autenticación persisten mediante upserts directos de filas `{agentId, sessionKey}` en lugar de cargar perezosamente un tiempo de ejecución de almacén de sesiones con forma de archivo.
- La compuerta detallada de respuesta automática y los auxiliares de actualización de sesión ahora leen/insertan o actualizan filas de sesión de SQLite por identidad de sesión y ya no requieren una ruta de almacén heredada antes de tocar el estado persistido de filas.
- Los auxiliares de metadatos de sesión de ejecución de comandos ahora usan nombres y rutas de módulo orientados a entradas; se eliminó la antigua superficie auxiliar de comandos `session-store`.
- La siembra de encabezados de arranque y el endurecimiento manual de límites de compaction ahora mutan filas de transcripción de SQLite directamente. Los llamadores del tiempo de ejecución pasan identidad de sesión, no rutas `.jsonl` escribibles.
- La repetición silenciosa de rotación de sesión copia turnos recientes de usuario/asistente por `{agentId, sessionId}` desde filas de transcripción de SQLite. Ya no acepta localizadores de transcripción de origen ni de destino.
- Las filas frescas de sesión del tiempo de ejecución ya no almacenan localizadores de transcripción. Los llamadores usan `{agentId, sessionId}` directamente; los comandos de exportación/depuración pueden elegir nombres de archivo de salida cuando materializan filas.
- Iniciar una nueva sesión de transcripción persistida ahora siempre abre filas de SQLite por alcance. El administrador de sesiones ya no reutiliza una ruta o localizador de transcripción anterior de la era de archivos como identidad de la nueva sesión.
- Las sesiones de transcripción persistidas usan la API explícita `openTranscriptSessionManagerForSession({agentId, sessionId})`. Las antiguas fachadas estáticas `SessionManager.create/openForSession/list/forkFromSession` desaparecieron para que las pruebas y el código de tiempo de ejecución no puedan recrear accidentalmente el descubrimiento de sesiones de la era de archivos.
- El tiempo de ejecución de Plugin ya no expone `api.runtime.agent.session.resolveTranscriptLocatorPath`; el código de Plugin usa auxiliares de filas de SQLite y valores de alcance.
- La superficie pública del SDK `session-store-runtime` ahora solo exporta auxiliares de filas de sesión y filas de transcripción. Los auxiliares enfocados de esquema/ruta/transacción de SQLite viven en `sqlite-runtime`; los auxiliares sin procesar de abrir/cerrar/reiniciar permanecen solo locales para pruebas propias.
- Los clasificadores heredados de nombres de archivo `.jsonl` de trayectoria/punto de control ahora viven en el módulo de doctor de archivos de sesión heredados. La validación central de sesiones ya no importa auxiliares de artefactos de archivo para decidir ids normales de sesión de SQLite.
- Las ejecuciones bloqueantes de subagentes de Active Memory usan filas de transcripción de SQLite en lugar de crear archivos `session.jsonl` temporales o persistidos bajo el estado de Plugin. Se eliminó la opción antigua `transcriptDir`.
- La generación puntual de slugs y las ejecuciones del planificador de Crestodian usan filas de transcripción de SQLite en lugar de crear archivos temporales `session.jsonl`.
- Las ejecuciones auxiliares de `llm-task` y la extracción oculta de compromisos también usan filas de transcripción de SQLite, por lo que estas sesiones auxiliares exclusivas del modelo ya no crean archivos temporales de transcripción JSON/JSONL.
- `TranscriptSessionManager` ahora es solo un alcance de transcripción de SQLite abierto. El código de tiempo de ejecución lo abre con `openTranscriptSessionManagerForSession({agentId, sessionId})`; los flujos de creación, rama, continuación, listado y bifurcación viven en sus auxiliares propietarios de filas de SQLite en lugar de en fachadas estáticas del administrador. El código de doctor/importación/depuración maneja archivos de origen heredados explícitos fuera del administrador de sesiones del tiempo de ejecución.
- Se eliminaron los métodos obsoletos de fachada `SessionManager.newSession()` y `SessionManager.createBranchedSession()`. Las nuevas sesiones y descendientes de transcripción son creados por su flujo de trabajo propietario de SQLite en lugar de mutar un administrador ya abierto en una sesión persistida diferente.
- Las decisiones de bifurcación de transcripción principal y la creación de bifurcaciones ya no aceptan `storePath` ni `sessionsDir`; usan el alcance de transcripción de SQLite `{agentId, sessionId}` en lugar de metadatos retenidos de rutas del sistema de archivos.
- Memory-host ya no exporta auxiliares no-op de clasificación de transcripciones de directorio de sesiones; el filtrado de transcripciones ahora se deriva de metadatos de filas de SQLite durante la construcción de entradas.
- Las pruebas de exportación de sesión de Memory-host y QMD usan alcances de transcripción de SQLite. Las rutas antiguas `agents/<agentId>/sessions/*.jsonl` siguen cubiertas solo cuando una prueba demuestra intencionalmente compatibilidad de doctor/importación/exportación.
- La inspección de sesiones sin procesar de QA-lab ahora usa `sessions.list` a través del Gateway
  en lugar de leer `agents/qa/sessions/sessions.json`; los comentarios de MSteams
  se anexan directamente a las transcripciones de SQLite sin fabricar una ruta JSONL.
- Los turnos entrantes de canal compartido ahora llevan `{agentId, sessionKey}` en lugar de un
  `storePath` heredado. LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal,
  iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo,
  Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon,
  Twitch y QQBot ahora leen metadatos updated-at en las rutas de registro y registran
  filas de sesiones entrantes mediante la identidad de SQLite.
- La persistencia del localizador de transcripciones se elimina de las filas de sesión activas.
  `resolveSessionTranscriptTarget` devuelve `agentId`, `sessionId` y metadatos de tema
  opcionales; doctor es el único código que importa nombres de archivos de transcripción
  heredados.
- Los encabezados de transcripción en runtime empiezan en la versión `1` de SQLite. Las
  actualizaciones de formas JSONL V1/V2/V3 antiguas viven solo en la importación de doctor y
  normalizan los encabezados importados a la versión actual de transcripción de SQLite antes de
  almacenar las filas.
- La protección database-first ahora prohíbe `SessionManager.listAll` y
  `SessionManager.forkFromSession`; los flujos de listado de sesiones y fork/restore
  deben permanecer en las API SQLite por fila/con alcance.
- La protección también prohíbe nombres heredados de helpers de análisis de transcripciones
  JSONL/reparación de ramas activas fuera del código de doctor/importación, por lo que runtime
  no puede desarrollar una segunda ruta de migración de transcripciones heredadas.
- Las ejecuciones de PI embebidas rechazan identificadores de transcripción entrantes. Usan la identidad
  `{agentId, sessionId}` de SQLite antes de lanzar el worker y de nuevo antes de que el
  intento toque el estado de la transcripción. Una entrada obsoleta `/tmp/*.jsonl` no puede seleccionar un
  destino de escritura en runtime.
- Los registros de traza de caché, payload de Anthropic, flujo sin procesar y línea de tiempo de diagnósticos
  ahora se escriben en filas SQLite tipadas `diagnostic_events`. Los paquetes de estabilidad de Gateway
  ahora se escriben en filas SQLite tipadas `diagnostic_stability_bundles`. Se eliminan las
  rutas de sobrescritura JSONL antiguas `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`,
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE` y
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`, y la captura normal de estabilidad ya no escribe
  archivos `logs/stability/*.json`.
- La persistencia de Cron ahora reconcilia filas SQLite `cron_jobs` en lugar de
  eliminar/reinsertar toda la tabla de trabajos en cada guardado. Las escrituras de vuelta de destino de Plugin
  actualizan directamente las filas de cron coincidentes y mantienen el estado de cron de runtime en
  la misma transacción de base de datos de estado.
- Los llamadores de runtime de Cron ahora usan una clave estable de almacén cron de SQLite. Las rutas
  `cron.store` heredadas son solo entradas de importación de doctor; Gateway de producción, mantenimiento
  de tareas, estado, registro de ejecución y rutas de escritura de vuelta de destino de Telegram usan
  `resolveCronStoreKey` y ya no normalizan la clave como ruta. El estado de Cron ahora
  informa `storeKey` en lugar del antiguo campo `storePath` con forma de archivo.
- La carga y programación de runtime de Cron ya no normalizan formas de trabajo persistidas heredadas,
  como `jobId`, `schedule.cron`, `atMs` numérico, booleanos de cadena o
  `sessionTarget` ausente. La importación heredada de doctor posee esas reparaciones antes de que las filas
  se inserten en SQLite.
- El spawn de ACP ya no resuelve ni persiste rutas de archivos JSONL de transcripción. La configuración de
  spawn y enlace de hilo persiste directamente la fila de sesión SQLite y mantiene el
  id de sesión como la identidad de transcripción conservada.
- Las API de metadatos de sesión ACP ahora leen/listan/hacen upsert de filas SQLite por `agentId` y
  ya no exponen `storePath` como parte del contrato de entrada de sesión ACP.
- La contabilidad de uso de sesiones y la agregación de uso de Gateway ahora resuelven transcripciones
  solo por `{agentId, sessionId}`. La caché de costo/uso y los resúmenes de sesiones descubiertas
  ya no sintetizan ni devuelven cadenas de localizador de transcripción.
- El anexado de chat de Gateway, la persistencia parcial de abort, `/sessions.send` y
  las escrituras de transcripciones de medios de webchat se anexan directamente mediante el alcance de transcripción
  de SQLite. El helper de inyección de transcripciones de Gateway ya no acepta un
  parámetro `transcriptLocator`.
- El descubrimiento de transcripciones SQLite ahora lista únicamente alcances y estadísticas de transcripción:
  `{agentId, sessionId, updatedAt, eventCount}`. Desaparecieron el helper de compatibilidad
  muerto `listSqliteSessionTranscriptLocators` y el campo `locator` por fila.
- El runtime de reparación de transcripciones ahora expone solo
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})`. Se elimina el helper
  de reparación basado en localizador; el código de doctor/debug lee rutas explícitas de archivos
  fuente y nunca migra cadenas de localizador.
- El runtime del libro mayor de replay de ACP ahora almacena filas de replay por sesión en la base de datos
  compartida de estado SQLite en lugar de `acp/event-ledger.json`; doctor importa y
  elimina el archivo heredado.
- Los helpers lectores de transcripciones de Gateway ahora viven en
  `src/gateway/session-transcript-readers.ts` en lugar del antiguo nombre de módulo
  `session-utils.fs`. La comprobación de historial de reintentos fallback se nombra por el
  contenido de transcripciones SQLite en lugar de la antigua superficie de helper de archivos.
- Los helpers de chat inyectado y Compaction de Gateway ahora pasan el alcance de transcripción SQLite
  mediante API auxiliares internas en lugar de nombrar valores como rutas de transcripción o
  archivos fuente.
- La detección de continuación de bootstrap ahora comprueba filas de transcripción SQLite mediante
  `hasCompletedBootstrapTranscriptTurn`; ya no expone un nombre de helper con forma de archivo.
- Las pruebas de embedded-runner ahora usan identidad de transcripción SQLite, y abrir un nuevo
  gestor de transcripciones siempre requiere un `sessionId` explícito.
- Los helpers de indexación de memoria ahora usan terminología de transcripción SQLite de extremo a extremo:
  el host exporta `listSessionTranscriptScopesForAgent` y
  `sessionTranscriptKeyForScope`, las colas de sincronización dirigida `sessionTranscripts`,
  los resultados públicos de búsqueda de sesiones exponen rutas opacas `transcript:<agent>:<session>`,
  y la clave interna de fuente de DB es `session:<session>` bajo
  `source_kind='sessions'` en lugar de una ruta de archivo falsa.
- El helper genérico de deduplicación persistente del SDK de Plugin ya no expone opciones con forma de archivo.
  Los llamadores proporcionan claves de alcance SQLite y las filas duraderas de deduplicación viven en
  el estado compartido de Plugin.
- Los tokens SSO de Microsoft Teams pasaron de archivos JSON bloqueados al estado de Plugin
  SQLite. Doctor importa `msteams-sso-tokens.json`, reconstruye las claves canónicas de tokens SSO
  a partir de payloads y elimina el archivo fuente. Los tokens OAuth delegados permanecen en
  su límite existente de archivos de credenciales privadas.
- El estado de caché de sincronización de Matrix pasó de `bot-storage.json` al estado de Plugin
  SQLite. Doctor importa payloads de sincronización heredados sin procesar o envueltos y elimina el
  archivo fuente. Los clientes activos de Matrix y QA Matrix pasan un directorio raíz de almacén
  de sincronización SQLite, no una ruta falsa `sync-store.json` o `bot-storage.json`.
- El estado de migración de criptografía heredada de Matrix pasó de
  `legacy-crypto-migration.json` al estado de Plugin SQLite. Doctor importa el
  archivo de estado antiguo; las instantáneas IndexedDB del SDK de Matrix pasaron de
  `crypto-idb-snapshot.json` a blobs de Plugin SQLite. Las claves de recuperación y
  credenciales de Matrix son filas de estado de Plugin SQLite; sus antiguos archivos JSON son solo
  entradas de migración de doctor.
- Los registros de actividad de Memory Wiki ahora usan estado de Plugin SQLite en lugar de
  `.openclaw-wiki/log.jsonl`. El proveedor de migración de Memory Wiki importa registros JSONL
  antiguos; el markdown de wiki y el contenido de la bóveda del usuario siguen respaldados por archivos como
  contenido del workspace.
- Memory Wiki ya no crea `.openclaw-wiki/state.json` ni el directorio
  `.openclaw-wiki/locks` sin usar. El proveedor de migración elimina esos archivos de metadatos
  de Plugin retirados si una bóveda anterior todavía los tiene.
- Las entradas de auditoría de Crestodian ahora usan estado de Plugin SQLite de core en lugar de
  `audit/crestodian.jsonl`. Doctor importa el registro de auditoría JSONL heredado y
  lo elimina después de una importación correcta.
- Las entradas de auditoría de escritura/observación de configuración ahora usan estado de Plugin SQLite de core
  en lugar de `logs/config-audit.jsonl`. Doctor importa el registro de auditoría JSONL heredado y
  lo elimina después de una importación correcta.
- El companion de macOS ya no escribe sidecars locales de la app `logs/config-audit.jsonl` ni
  `logs/config-health.json` mientras edita `openclaw.json`. El archivo de configuración
  sigue respaldado por archivos, las instantáneas de recuperación permanecen junto al archivo de configuración,
  y el estado duradero de auditoría/salud de configuración pertenece al almacén SQLite de Gateway.
- Las aprobaciones pendientes de rescate de Crestodian ahora usan estado de Plugin SQLite de core en lugar de
  `crestodian/rescue-pending/*.json`. Doctor importa los archivos heredados de aprobación pendiente
  y los elimina después de una importación correcta.
- El estado temporal de armado de Phone Control ahora usa estado de Plugin SQLite en lugar de
  `plugins/phone-control/armed.json`. Doctor importa el archivo heredado de estado armado en el
  espacio de nombres `phone-control/arm-state` y elimina el archivo.
- Doctor ya no repara transcripciones JSONL in situ ni crea archivos JSONL de respaldo.
  Importa la rama activa a SQLite y elimina la fuente heredada.
- La búsqueda de transcripciones del hook session-memory usa lecturas SQLite solo con alcance
  `{agentId, sessionId}`. Su helper ya no acepta ni deriva localizadores de transcripción,
  lecturas de archivos heredados ni opciones de reescritura de archivos.
- Los enlaces de conversaciones del app-server de Codex ahora indexan el estado de Plugin SQLite por
  clave de sesión de OpenClaw o alcance explícito `{agentId, sessionId}`. No deben
  conservar enlaces fallback de rutas de transcripción.
- Las lecturas de historial reflejado del app-server de Codex usan solo el alcance de transcripción SQLite;
  no deben recuperar identidad a partir de rutas de archivos de transcripción.
- Las rutas de ordenación de roles y restablecimiento de Compaction ya no desvinculan archivos de transcripción
  antiguos; el restablecimiento solo rota la fila de sesión SQLite y la identidad de transcripción.
- Las respuestas de restablecimiento y checkpoint de Gateway devuelven filas de sesión limpias más ids de sesión.
  Ya no sintetizan localizadores de transcripción SQLite para clientes.
- Dreaming de memory-core ya no poda filas de sesión comprobando archivos JSONL ausentes.
  La limpieza de subagentes pasa por la API de runtime de sesiones en lugar de
  comprobaciones de existencia en el sistema de archivos. Sus pruebas de ingesta de transcripciones siembran filas SQLite
  directamente en lugar de crear fixtures `agents/<id>/sessions` o marcadores de posición de localizador.
- La indexación de transcripciones de memoria puede exponer `transcript:<agentId>:<sessionId>` como una
  ruta virtual de resultado de búsqueda para helpers de citas/lectura. La fuente duradera del índice es
  relacional (`source_kind='sessions'`, `source_key='session:<sessionId>'`,
  `session_id=<sessionId>`), por lo que el valor no es un localizador de transcripción de runtime,
  no es una ruta del sistema de archivos y nunca debe pasarse de vuelta a las API de runtime de sesiones.
- El estado de memoria de doctor de Gateway lee los conteos de recuperación a corto plazo y phase-signal
  desde filas de estado de Plugin SQLite en lugar de `memory/.dreams/*.json`; la salida de CLI y
  doctor ahora etiqueta ese almacenamiento como un almacén SQLite, no como una ruta.
- El runtime de memory-core, el estado de CLI, los métodos de doctor de Gateway y las fachadas del SDK de Plugin
  ya no auditan ni archivan archivos heredados `.dreams/session-corpus`.
  Esos archivos son solo entradas de migración; doctor los importa a SQLite y
  elimina la fuente después de la verificación. Las filas de evidencia de ingesta de sesión activa
  ahora usan la ruta virtual SQLite `memory/session-ingestion/<day>.txt`; runtime
  nunca escribe ni deriva estado desde `.dreams/session-corpus`.
- Los artefactos públicos de memory-core exponen eventos de host SQLite como el artefacto JSON virtual
  `memory/events/memory-host-events.json`; ya no reutilizan la
  ruta fuente heredada `.dreams/events.jsonl`.
- Los registros de sandbox container/browser ahora usan la tabla SQLite compartida
  `sandbox_registry_entries` con columnas tipadas de sesión, imagen, marca de tiempo,
  backend/config y puerto de navegador. Doctor importa archivos de registro JSON heredados monolíticos y
  fragmentados y elimina las fuentes correctas. Las lecturas de runtime usan
  las columnas tipadas de fila como fuente de verdad; `entry_json` es solo una copia de replay/debug.
- Commitments ahora usa una tabla compartida tipada `commitments` en lugar de un
  blob JSON de todo el almacén. Los guardados de instantáneas hacen upsert por id de commitment y eliminan solo
  las filas ausentes en lugar de vaciar y reinsertar la tabla. Runtime carga
  commitments desde columnas tipadas de alcance, ventana de entrega, estado, intento y texto;
  `record_json` es solo una copia de replay/debug. Doctor importa el `commitments.json`
  heredado y lo elimina después de una importación correcta.
- Las definiciones de trabajos de Cron, el estado de programación y el historial de ejecuciones ya no tienen escritores
  ni lectores JSON en runtime. Runtime usa filas `cron_jobs` con programación tipada,
  columnas de carga útil, entrega, alerta de fallo, sesión, estado y estado de tiempo de ejecución, además de metadatos tipados de
  `cron_run_logs` para estado, resumen de diagnóstico, estado/error de entrega,
  sesión/ejecución, modelo y totales de tokens. `job_json` es solo una copia de reproducción/depuración; `state_json` conserva diagnósticos
  de tiempo de ejecución anidados que todavía no tienen campos de consulta frecuentes, mientras que el tiempo de ejecución
  rehidrata los campos frecuentes de estado desde columnas tipadas. Doctor importa
  los archivos heredados `jobs.json`, `jobs-state.json` y `runs/*.jsonl` y elimina
  las fuentes importadas. Las escrituras de vuelta de destinos de Plugin actualizan las filas `cron_jobs`
  coincidentes en lugar de cargar y reemplazar todo el almacén de cron.
- El arranque de Gateway ignora los marcadores heredados `notify: true` en la proyección
  de tiempo de ejecución. Doctor los traduce a entrega SQLite explícita cuando
  `cron.webhook` es válido, elimina los marcadores inertes cuando no está configurado y los conserva
  con una advertencia cuando el webhook configurado no es válido.
- Las colas de entrega saliente y de sesión ahora almacenan el estado de cola, el tipo de entrada,
  la clave de sesión, el canal, el destino, el id de cuenta, el número de reintentos, el último intento/error,
  el estado de recuperación y los marcadores de envío de plataforma como columnas tipadas en la tabla compartida
  `delivery_queue_entries`. La recuperación en tiempo de ejecución lee esos campos frecuentes desde
  las columnas tipadas, y las mutaciones de reintento/recuperación actualizan esas columnas directamente
  sin reescribir JSON de reproducción. La carga útil JSON completa permanece solo como el
  blob de reproducción/depuración para cuerpos de mensajes y otros datos fríos de reproducción.
- Los registros gestionados de imágenes salientes ahora usan filas compartidas tipadas
  `managed_outgoing_image_records`, con los bytes de medios todavía almacenados en
  `media_blobs`. El registro JSON permanece solo como copia de reproducción/depuración.
- Las preferencias del selector de modelos de Discord, los hashes de despliegue de comandos y las vinculaciones de hilos
  ahora usan estado compartido de Plugin en SQLite. Sus planes heredados de importación JSON viven en la
  superficie de configuración/doctor de migración del Plugin de Discord, no en el código de migración central.
- Los detectores de importación heredada de Plugin usan módulos nombrados por doctor, como
  `doctor-legacy-state.ts` o `doctor-state-imports.ts`; los módulos normales de tiempo de ejecución de canales
  no deben importar detectores JSON heredados.
- Los cursores de puesta al día de BlueBubbles y los marcadores de deduplicación entrante ahora usan estado compartido de Plugin en SQLite.
  Sus planes heredados de importación JSON viven en la superficie de configuración/doctor de migración del Plugin de BlueBubbles,
  no en el código de migración central.
- Los desplazamientos de actualización de Telegram, las filas de caché de stickers, las filas de caché de mensajes enviados,
  las filas de caché de nombres de temas y las vinculaciones de hilos ahora usan estado compartido de Plugin en SQLite.
  Sus planes heredados de importación JSON viven en la superficie de configuración/doctor de migración del Plugin de Telegram,
  no en el código de migración central.
- Los cursores de puesta al día de iMessage, las asignaciones de id corto de respuesta y las filas de deduplicación de ecos enviados
  ahora usan estado compartido de Plugin en SQLite. Los archivos antiguos `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` e `imessage/sent-echoes.jsonl` son
  solo entradas para doctor.
- Las filas de deduplicación de mensajes de Feishu ahora usan estado compartido de Plugin en SQLite en lugar de
  archivos `feishu/dedup/*.json`. Su plan heredado de importación JSON vive en la superficie
  de configuración/doctor de migración del Plugin de Feishu, no en el código de migración central.
- Las conversaciones, encuestas, búferes pendientes de carga y aprendizajes de comentarios de Microsoft Teams
  ahora usan tablas compartidas de estado/blob de Plugin en SQLite. La ruta de carga pendiente
  usa `plugin_blob_entries`, de modo que los búferes de medios se almacenan como BLOBs de SQLite
  en lugar de JSON base64. Los nombres de los helpers de tiempo de ejecución ahora usan nomenclatura SQLite/estado
  en lugar de nomenclatura de almacén de archivos `*-fs`, y el shim antiguo `storePath` desaparece
  de estos almacenes. Su plan heredado de importación JSON vive en la superficie de configuración/doctor de migración
  del Plugin de Microsoft Teams.
- Los medios salientes alojados de Zalo ahora usan `plugin_blob_entries` compartido de SQLite
  en lugar de sidecars temporales JSON/bin `openclaw-zalo-outbound-media`.
- El HTML y los metadatos del visor de diffs ahora usan `plugin_blob_entries` compartido de SQLite
  en lugar de archivos temporales `meta.json`/`viewer.html`. Las salidas PNG/PDF renderizadas permanecen
  como materializaciones temporales porque la entrega del canal todavía necesita una ruta de archivo.
- Los documentos gestionados de Canvas ahora usan `plugin_blob_entries` compartido de SQLite
  en lugar de un directorio predeterminado `state/canvas/documents`. El host de Canvas sirve esos
  blobs directamente; los archivos locales se crean solo para contenido explícito de operador `host.root`
  o materialización temporal cuando un lector de medios posterior
  requiere una ruta.
- Las decisiones de auditoría de File Transfer ahora usan `plugin_state_entries` compartido de SQLite
  en lugar del registro de tiempo de ejecución ilimitado `audit/file-transfer.jsonl`. Doctor
  importa el archivo de auditoría JSONL heredado al estado de Plugin y elimina la fuente
  después de una importación limpia.
- Las concesiones de procesos ACPX y la identidad de instancia de gateway ahora usan estado compartido de Plugin en SQLite.
  Doctor importa el archivo heredado `gateway-instance-id` al estado de Plugin
  y elimina la fuente.
- Los scripts contenedores generados por ACPX y el inicio aislado de Codex son materialización temporal
  bajo la raíz temporal de OpenClaw, no estado duradero de OpenClaw. Los
  registros duraderos de tiempo de ejecución ACPX son las filas SQLite de concesión e instancia de gateway;
  la superficie de configuración antigua `stateDir` de ACPX se elimina porque ya no se escribe
  ningún estado de tiempo de ejecución allí.
- Los adjuntos de medios de Gateway ahora usan la tabla compartida SQLite `media_blobs` como
  almacén canónico de bytes. Las rutas locales devueltas a las superficies de compatibilidad de canal y sandbox
  son materializaciones temporales de la fila de base de datos, no el almacén duradero de medios.
  Las listas de permitidos de medios en tiempo de ejecución ya no incluyen las raíces heredadas
  `$OPENCLAW_STATE_DIR/media` ni `media` del directorio de configuración; esos directorios son
  solo fuentes de importación de doctor.
- La finalización de shell ya no escribe archivos de caché `$OPENCLAW_STATE_DIR/completions/*`.
  Las rutas de smoke de instalación, doctor, actualización y release usan salida de finalización
  generada o carga desde perfil en lugar de archivos duraderos de caché de finalización.
- La preparación de cargas de Skills de Gateway ahora usa filas compartidas `skill_uploads`. Los metadatos
  de carga, las claves de idempotencia y los bytes del archivo viven en SQLite; el instalador
  solo recibe una ruta de archivo materializada temporal mientras se ejecuta una instalación.
- Los adjuntos en línea de subagentes ya no se materializan bajo
  `.openclaw/attachments/*` del espacio de trabajo. La ruta de creación prepara entradas semilla de VFS en SQLite,
  las ejecuciones en línea siembran esas entradas en el espacio de nombres scratch de tiempo de ejecución por agente,
  y las herramientas respaldadas por disco superponen ese scratch de SQLite para rutas de adjuntos. Las
  columnas antiguas de registro de directorio de adjuntos de ejecución de subagente y los hooks de limpieza desaparecen.
- La hidratación de imágenes de CLI ya no mantiene archivos estables de caché
  `openclaw-cli-images`. Los backends externos de CLI todavía reciben rutas de archivo, pero esas rutas son
  materializaciones temporales por ejecución con limpieza.
- Los diagnósticos de trazas de caché, diagnósticos de cargas útiles de Anthropic, diagnósticos de streams de modelo sin procesar,
  eventos de cronología de diagnóstico y paquetes de estabilidad de Gateway ahora
  escriben filas SQLite en lugar de archivos `logs/*.jsonl` o
  `logs/stability/*.json`.
  Se han eliminado las banderas y variables de entorno de anulación de rutas en tiempo de ejecución; los comandos de exportación/depuración
  pueden materializar archivos explícitamente desde filas de base de datos.
- El complemento de macOS ya no tiene un escritor rotativo `diagnostics.jsonl`. Los registros de la app
  van al registro unificado, y los diagnósticos duraderos de Gateway permanecen respaldados por SQLite.
- La lista de registros del guardián de puertos de macOS ahora usa filas compartidas tipadas de SQLite
  `macos_port_guardian_records` en lugar de un archivo JSON de Application Support
  o un blob singleton opaco.
- Los bloqueos singleton de Gateway ahora usan filas compartidas tipadas de SQLite `state_leases` bajo
  el ámbito `gateway_locks` en lugar de archivos de bloqueo en el directorio temporal. La documentación de solución de problemas
  de Fly y OAuth ahora apunta al bloqueo de concesión/actualización de autenticación en SQLite en lugar de la limpieza obsoleta de bloqueos de archivo.
- El estado centinela de reinicio de Gateway ahora usa filas compartidas tipadas de SQLite
  `gateway_restart_sentinel` en lugar de `restart-sentinel.json`; el tiempo de ejecución
  lee el tipo de centinela, estado, enrutamiento, mensaje, continuación y estadísticas desde
  columnas tipadas. `payload_json` es solo una copia de reproducción/depuración. El código de tiempo de ejecución limpia
  la fila SQLite directamente y ya no conserva la fontanería de limpieza de archivos.
- El estado de intención de reinicio de Gateway y traspaso del supervisor ahora usa filas compartidas tipadas de SQLite
  `gateway_restart_intent` y `gateway_restart_handoff` en lugar de sidecars
  `gateway-restart-intent.json` y
  `gateway-supervisor-restart-handoff.json`.
- La coordinación singleton de Gateway ahora usa filas tipadas `state_leases` bajo
  `gateway_locks` en lugar de escribir archivos `gateway.<hash>.lock`. La fila de concesión
  posee el propietario del bloqueo, la expiración, Heartbeat y la carga útil de depuración; SQLite posee el
  límite atómico de adquisición/liberación. La opción retirada de directorio de bloqueos de archivo
  desaparece; las pruebas usan directamente la identidad de fila SQLite.
- Se eliminó el antiguo helper no referenciado de informes de uso de cron que escaneaba archivos `cron/runs/*.jsonl`.
  Los informes de historial de ejecuciones Cron deben leer las filas tipadas de SQLite
  `cron_run_logs`.
- La recuperación de reinicio de sesión principal ahora descubre agentes candidatos mediante el
  registro SQLite `agent_databases` en lugar de escanear directorios `agents/*/sessions`.
- La recuperación de corrupción de sesión de Gemini ahora elimina solo la fila de sesión SQLite;
  ya no necesita una puerta heredada `storePath` ni intenta desvincular una ruta JSONL
  de transcripción derivada.
- El manejo de anulación de rutas ahora trata los valores literales de entorno `undefined`/`null`
  como no configurados, lo que evita bases de datos accidentales `undefined/state/*.sqlite`
  en la raíz del repo durante pruebas o traspasos de shell.
- Las huellas de salud de configuración ahora usan filas compartidas tipadas de SQLite `config_health_entries`
  en lugar de `logs/config-health.json`, manteniendo el archivo normal de configuración como
  el único documento de configuración que no es credencial. El complemento de macOS conserva solo
  estado de salud local al proceso y no recrea el antiguo sidecar JSON.
- El tiempo de ejecución de perfiles de autenticación ya no importa ni escribe archivos JSON de credenciales. El
  almacén canónico de credenciales es SQLite; `auth-profiles.json`, `auth.json`
  por agente y `credentials/oauth.json` compartido son entradas de migración de doctor
  que se eliminan después de la importación.
- Las pruebas de guardado/estado de perfiles de autenticación ahora verifican directamente las tablas tipadas de autenticación en SQLite
  y solo usan nombres de archivo heredados de perfiles de autenticación para entradas de migración de doctor.
- `openclaw secrets apply` depura únicamente el archivo de configuración, el archivo env y el almacén
  SQLite de perfiles de autenticación. Ya no conserva lógica de compatibilidad que edita
  el `auth.json` retirado por agente; doctor es responsable de importar y eliminar ese archivo.
- Los planes y aplicaciones de migración de secretos de Hermes importaron perfiles de clave API directamente
  al almacén SQLite de perfiles de autenticación. Ya no escribe ni verifica
  `auth-profiles.json` como destino intermedio.
- La documentación de autenticación orientada a usuarios ahora describe
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` en lugar de
  decir a los usuarios que inspeccionen o copien `auth-profiles.json`; los nombres heredados JSON
  de OAuth/autenticación permanecen documentados solo como entradas de importación de doctor.
- Los helpers centrales de rutas de estado ya no exponen el archivo retirado `credentials/oauth.json`.
  El nombre de archivo heredado es local a la ruta de importación de autenticación de doctor.
- La documentación de instalación, seguridad, onboarding, autenticación de modelos y SecretRef ahora describe
  filas SQLite de perfiles de autenticación y copia de seguridad/migración de todo el estado en lugar de
  archivos JSON de perfiles de autenticación por agente.
- El descubrimiento de modelos PI ahora pasa credenciales canónicas al almacenamiento de autenticación en memoria
  `pi-coding-agent`. Ya no crea, depura ni escribe
  `auth.json` por agente durante el descubrimiento.
- La configuración de activación y enrutamiento de Voice Wake ahora usa tablas compartidas tipadas de SQLite
  en lugar de `settings/voicewake.json`, `settings/voicewake-routing.json` o
  filas genéricas opacas; doctor importa los archivos JSON heredados y los elimina después de una
  migración correcta.
- El estado de comprobación de actualizaciones ahora usa una fila compartida tipada `update_check_state` en lugar de
  `update-check.json` o un blob genérico opaco; doctor importa
  el archivo JSON heredado y lo elimina después de una migración correcta.
- El estado de salud de configuración ahora usa filas compartidas tipadas `config_health_entries` en lugar
  de `logs/config-health.json` o un blob genérico opaco; doctor
  importa el archivo JSON heredado y lo elimina después de una migración correcta.
- Las aprobaciones de vinculación de conversaciones de Plugin ahora usan filas tipadas
  `plugin_binding_approvals` en lugar de estado compartido opaco de SQLite o
  `plugin-binding-approvals.json`; el archivo heredado es una entrada de migración de doctor.
- Los enlaces genéricos de conversación actual ahora almacenan filas tipadas de
  `current_conversation_bindings` en lugar de reescribir
  `bindings/current-conversations.json`; doctor importa el archivo JSON heredado y
  lo elimina después de una migración correcta.
- Los registros de sincronización de fuentes importadas de Memory Wiki ahora almacenan una fila de estado de Plugin en SQLite
  por clave de bóveda/fuente en lugar de reescribir `.openclaw-wiki/source-sync.json`;
  el proveedor de migración importa y elimina el registro JSON heredado.
- Los registros de ejecuciones de importación de ChatGPT de Memory Wiki ahora almacenan una fila de estado de Plugin en SQLite
  por id de bóveda/ejecución en lugar de escribir `.openclaw-wiki/import-runs/*.json`.
  Las instantáneas de reversión siguen siendo archivos explícitos de bóveda hasta que el archivado
  de instantáneas de ejecuciones de importación se mueva al almacenamiento de blobs.
- Los resúmenes compilados de Memory Wiki ahora almacenan filas de blobs de Plugin en SQLite en lugar de
  escribir `.openclaw-wiki/cache/agent-digest.json` y
  `.openclaw-wiki/cache/claims.jsonl`. El proveedor de migración importa los archivos de caché
  antiguos y elimina el directorio de caché cuando queda vacío.
- El seguimiento de instalaciones de Skills de ClawHub ahora almacena una fila de estado de Plugin en SQLite por
  espacio de trabajo/skill en lugar de escribir o leer archivos complementarios `.clawhub/lock.json` y
  `.clawhub/origin.json` en tiempo de ejecución. El código de tiempo de ejecución usa objetos de estado de instalación rastreada
  en lugar de abstracciones de lockfile/origen con forma de archivo. Doctor
  importa los archivos complementarios heredados desde los espacios de trabajo de agentes configurados y los elimina
  después de una importación limpia.
- El índice de Plugins instalados ahora lee y escribe la fila singleton tipada compartida de SQLite
  `installed_plugin_index` en lugar de `plugins/installs.json`; el
  archivo JSON heredado es solo una entrada de migración de doctor y se elimina después de la importación.
- El helper de ruta heredado `plugins/installs.json` ahora vive en el código heredado de doctor.
  Los módulos de índice de Plugins en tiempo de ejecución exponen solo opciones de persistencia respaldadas por SQLite,
  no una ruta de archivo JSON.
- El centinela de reinicio del Gateway, la intención de reinicio y el estado de traspaso del supervisor ahora usan
  filas tipadas compartidas de SQLite (`gateway_restart_sentinel`,
  `gateway_restart_intent` y `gateway_restart_handoff`) en lugar de blobs
  opacos genéricos. El código de reinicio en tiempo de ejecución no tiene contrato de centinela/intención/traspaso
  con forma de archivo.
- La caché de sincronización de Matrix, los metadatos de almacenamiento, los enlaces de hilos, los marcadores de deduplicación entrante,
  el estado de enfriamiento de verificación de inicio, las instantáneas criptográficas de IndexedDB del SDK,
  las credenciales y las claves de recuperación ahora usan tablas compartidas de estado/blob de Plugin en SQLite.
  Las estructuras de rutas en tiempo de ejecución ya no exponen una ruta de metadatos `storage-meta.json`;
  ese nombre de archivo es solo una entrada de migración heredada. Su plan de importación JSON heredado
  vive en la superficie de configuración/migración de doctor del Plugin Matrix.
- El inicio de Matrix ya no escanea, informa ni completa el estado de archivos heredados de Matrix.
  La detección de archivos de Matrix, la creación de instantáneas criptográficas heredadas, el estado de migración de restauración de claves de sala,
  la importación y la eliminación de fuentes son todos propiedad de doctor.
- Se eliminaron los barrels de migración en tiempo de ejecución de Matrix. Los helpers de detección
  y mutación de estado/criptografía heredados son importados directamente por Matrix doctor en lugar de formar
  parte de la superficie de API en tiempo de ejecución.
- Los marcadores de reutilización de instantáneas de migración de Matrix ahora viven en el estado de Plugin de SQLite
  en lugar de `matrix/migration-snapshot.json`; doctor todavía puede reutilizar el mismo
  archivo verificado previo a la migración sin escribir un archivo complementario de estado.
- Los cursores del bus de Nostr y el estado de publicación de perfiles ahora usan estado compartido de Plugin en SQLite.
  Su plan de importación JSON heredado vive en la superficie de configuración/migración de doctor
  del Plugin Nostr.
- Los conmutadores de sesión de Active Memory ahora usan estado compartido de Plugin en SQLite en lugar de
  `session-toggles.json`; volver a activar la memoria elimina la fila en lugar de
  reescribir un objeto JSON.
- Las propuestas y contadores de revisión de Skill Workshop ahora usan estado compartido de Plugin en SQLite
  en lugar de almacenes `skill-workshop/<workspace>.json` por espacio de trabajo. Cada
  propuesta es una fila separada bajo `skill-workshop/proposals`, y el contador de revisión
  es una fila separada bajo `skill-workshop/reviews`.
- Las ejecuciones de subagentes revisores de Skill Workshop ahora usan el resolver de transcripciones de sesión
  en tiempo de ejecución en lugar de crear rutas de sesión complementarias
  `skill-workshop/<sessionId>.json`.
- Los arrendamientos de procesos de ACPX ahora usan estado compartido de Plugin en SQLite bajo
  `acpx/process-leases` en lugar de un registro de archivo completo `process-leases.json`.
  Cada arrendamiento se almacena como su propia fila, lo que preserva la limpieza de procesos obsoletos al inicio
  sin una ruta de reescritura JSON en tiempo de ejecución.
- Los scripts envoltorio de ACPX y el home aislado de Codex se generan en la
  raíz temporal de OpenClaw. Se recrean según sea necesario y no son entradas de copia de seguridad ni
  de migración.
- La persistencia del registro de ejecuciones de subagentes usa filas compartidas tipadas `subagent_runs`. La
  antigua ruta `subagents/runs.json` ahora es solo una entrada de migración de doctor, y
  los nombres de helpers en tiempo de ejecución ya no describen la capa de estado como respaldada por disco.
  Las pruebas en tiempo de ejecución ya no crean fixtures `runs.json` inválidos o vacíos para demostrar
  el comportamiento del registro; siembran/leen filas de SQLite directamente.
- La copia de seguridad prepara el directorio de estado antes de archivar, copia archivos que no son bases de datos,
  toma instantáneas de bases de datos `*.sqlite` con `VACUUM INTO`, omite archivos complementarios WAL/SHM
  activos, registra metadatos de instantánea en el manifiesto del archivo y registra
  ejecuciones de copia de seguridad completadas en SQLite con el manifiesto del archivo. `openclaw backup
create` valida el archivo escrito de forma predeterminada; `--no-verify` es la
  ruta rápida explícita.
- `openclaw backup restore` valida el archivo antes de la extracción, reutiliza el
  manifiesto normalizado del verificador y restaura los activos del manifiesto verificado en sus
  rutas de origen registradas. Requiere `--yes` para escrituras y admite `--dry-run`
  para un plan de restauración.
- Se elimina el antiguo filtro de rutas volátiles de copia de seguridad. La copia de seguridad ya no necesita una
  lista de omisión de tar en vivo para archivos JSON/JSONL heredados de sesión o cron porque las instantáneas de SQLite
  se preparan antes de la creación del archivo.
- La preparación de espacios de trabajo en configuración simple y onboarding ya no crea
  directorios `agents/<agentId>/sessions/`. Solo crean config/espacio de trabajo;
  las filas de sesión de SQLite y las filas de transcripción se crean bajo demanda en la
  base de datos por agente.
- La reparación de permisos de seguridad ahora apunta a las bases de datos SQLite globales y por agente
  más los archivos complementarios WAL/SHM en lugar de `sessions.json` y archivos JSONL
  de transcripción.
- Los nombres en tiempo de ejecución del registro de sandbox ahora describen directamente tipos de registro de SQLite
  en lugar de llevar terminología heredada de registro JSON a través del almacén activo.
- `openclaw reset --scope config+creds+sessions` elimina bases de datos
  `openclaw-agent.sqlite` por agente más archivos complementarios WAL/SHM, no solo directorios
  `sessions/` heredados.
- Los helpers agregados de sesión del Gateway ahora usan nombres orientados a entradas:
  `loadCombinedSessionEntriesForGateway` devuelve `{ databasePath, entries }`.
  La antigua nomenclatura de almacén combinado se eliminó de los llamadores en tiempo de ejecución.
- La siembra del canal Docker MCP ahora escribe la fila de sesión principal y los eventos de transcripción
  en la base de datos SQLite por agente en lugar de crear
  `sessions.json` y una transcripción JSONL.
- El hook incluido de memoria de sesión ahora resuelve el contexto de sesión anterior desde
  SQLite por `{agentId, sessionId}`. Ya no escanea, almacena ni sintetiza
  rutas de transcripción ni directorios `workspace/sessions`.
- El hook incluido de registro de comandos ahora escribe filas de auditoría de comandos en la tabla compartida
  de SQLite `command_log_entries` en lugar de anexar a
  `logs/commands.log`.
- Las listas de permitidos de emparejamiento de canales ahora exponen solo helpers de lectura/escritura respaldados por SQLite
  en tiempo de ejecución y en el SDK de Plugins. El antiguo resolver de rutas `*-allowFrom.json` y
  el lector de archivos viven solo bajo el código heredado de importación de doctor.
- `migration_runs` registra ejecuciones de migración de estado heredado con estado,
  marcas de tiempo e informes JSON.
- `migration_sources` registra cada fuente de archivo heredado importada con hash, tamaño,
  cantidad de registros, tabla de destino, id de ejecución, estado y estado de eliminación de fuente.
- `backup_runs` registra rutas de archivos de copia de seguridad, estado y manifiestos JSON.
- El esquema global no mantiene una tabla de registro `agents` sin usar. El descubrimiento de
  bases de datos de agentes es el registro canónico `agent_databases` hasta que el tiempo de ejecución
  tenga un propietario real de registros de agentes.
- La config generada del catálogo de modelos se almacena en filas tipadas globales de SQLite
  `agent_model_catalogs` indexadas por directorio de agente. Los llamadores en tiempo de ejecución usan
  `ensureOpenClawModelCatalog`; no hay API de compatibilidad `models.json` en
  el código en tiempo de ejecución. La implementación escribe SQLite y el registro PI embebido se
  hidrata desde esa carga almacenada sin crear un archivo `models.json`.
- Se eliminaron la exportación Markdown de transcripciones de sesión QMD y la config `memory.qmd.sessions`.
  No hay colección de transcripciones QMD, ni ruta en tiempo de ejecución `qmd/sessions*`,
  ni puente de memoria de sesión respaldado por archivos.
- El runtime de memory-core importa helpers de indexación de transcripciones de SQLite desde
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts`, no desde la
  subruta del SDK QMD. La subruta QMD mantiene una reexportación de compatibilidad solo para
  llamadores externos hasta que una limpieza mayor del SDK pueda eliminarla.
- El `index.sqlite` propio de QMD ahora es una materialización temporal en tiempo de ejecución respaldada por la
  tabla principal de SQLite `plugin_blob_entries`. El tiempo de ejecución ya no crea un
  archivo complementario durable `~/.openclaw/agents/<agentId>/qmd`.
- El Plugin opcional `memory-lancedb` ya no crea
  `~/.openclaw/memory/lancedb` como un almacén implícito administrado por OpenClaw. Es un
  backend externo de LanceDB y permanece deshabilitado hasta que el operador configura un
  `dbPath` explícito.
- `check:database-first-legacy-stores` falla si una nueva fuente en tiempo de ejecución empareja
  nombres de almacenes heredados con APIs de sistema de archivos de estilo escritura. También falla si una fuente en tiempo de ejecución
  reintroduce los marcadores retirados del puente de transcripción
  `transcriptLocator` o `sqlite-transcript://...`. El código de migración, doctor, importación
  y exportación explícita no relacionada con sesiones sigue permitido. Nombres de contratos heredados
  más amplios como `sessionFile`, `storePath` y antiguas fachadas de la era de archivos
  `SessionManager` todavía tienen propietarios actuales y necesitan trabajo separado de guardia de migración
  antes de poder convertirse en una comprobación previa obligatoria. La guardia ahora también cubre
  almacenes `cache/*.json` en tiempo de ejecución, archivos complementarios genéricos
  `thread-bindings.json`, JSON de estado/registro de ejecuciones de cron, JSON de salud de config,
  archivos complementarios de reinicio y bloqueo, ajustes de Voice Wake, aprobaciones de enlaces de Plugins,
  JSON de índice de Plugins instalados, JSONL de auditoría de File Transfer, registros de actividad de Memory Wiki,
  el antiguo log de texto `command-logger` incluido y controles de diagnóstico JSONL de flujos sin procesar
  de pi-mono. También prohíbe antiguos nombres de módulos heredados de doctor en el nivel raíz para que
  el código de compatibilidad permanezca bajo `src/commands/doctor/`. Los handlers de depuración de Android
  también usan logcat/salida en memoria en lugar de preparar archivos de caché `camera_debug.log` o
  `debug_logs.txt`.

## Forma del esquema objetivo

Mantén los esquemas explícitos. El estado de runtime propiedad del host usa tablas tipadas. El estado opaco
propiedad del Plugin usa `plugin_state_entries` / `plugin_blob_entries`; no hay una tabla
genérica `kv` del host.

Base de datos global:

```text
state_leases(scope, lease_key, owner, expires_at, heartbeat_at, payload_json, created_at, updated_at)
exec_approvals_config(config_key, raw_json, socket_path, has_socket_token, default_security, default_ask, default_ask_fallback, auto_allow_skills, agent_count, allowlist_count, updated_at_ms)
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
agent_databases(agent_id, path, schema_version, last_seen_at, size_bytes)
task_runs(...)
task_delivery_state(...)
flow_runs(...)
subagent_runs(run_id, child_session_key, requester_session_key, controller_session_key, created_at, ended_at, cleanup_handled, payload_json)
current_conversation_bindings(binding_key, binding_id, target_agent_id, target_session_id, target_session_key, channel, account_id, conversation_kind, parent_conversation_id, conversation_id, target_kind, status, bound_at, expires_at, metadata_json, updated_at)
plugin_binding_approvals(plugin_root, channel, account_id, plugin_id, plugin_name, approved_at)
tui_last_sessions(scope_key, session_key, updated_at)
plugin_state_entries(plugin_id, namespace, entry_key, value_json, created_at, expires_at)
plugin_blob_entries(plugin_id, namespace, entry_key, metadata_json, blob, created_at, expires_at)
media_blobs(subdir, id, content_type, size_bytes, blob, created_at, updated_at)
skill_uploads(upload_id, kind, slug, force, size_bytes, sha256, actual_sha256, received_bytes, archive_blob, created_at, expires_at, committed, committed_at, idempotency_key_hash)
web_push_subscriptions(endpoint_hash, subscription_id, endpoint, p256dh, auth, created_at_ms, updated_at_ms)
web_push_vapid_keys(key_id, public_key, private_key, subject, updated_at_ms)
apns_registrations(node_id, transport, token, relay_handle, send_grant, installation_id, topic, environment, distribution, token_debug_suffix, updated_at_ms)
node_host_config(config_key, version, node_id, token, display_name, gateway_host, gateway_port, gateway_tls, gateway_tls_fingerprint, updated_at_ms)
device_identities(identity_key, device_id, public_key_pem, private_key_pem, created_at_ms, updated_at_ms)
device_auth_tokens(device_id, role, token, scopes_json, updated_at_ms)
macos_port_guardian_records(pid, port, command, mode, timestamp)
workspace_setup_state(workspace_key, workspace_path, version, bootstrap_seeded_at, setup_completed_at, updated_at)
native_hook_relay_bridges(relay_id, pid, hostname, port, token, expires_at_ms, updated_at_ms)
model_capability_cache(provider_id, model_id, name, input_text, input_image, reasoning, supports_tools, context_window, max_tokens, cost_input, cost_output, cost_cache_read, cost_cache_write, updated_at_ms)
agent_model_catalogs(catalog_key, agent_dir, raw_json, updated_at)
managed_outgoing_image_records(attachment_id, session_key, message_id, created_at, updated_at, retention_class, alt, original_media_id, original_media_subdir, original_content_type, original_width, original_height, original_size_bytes, original_filename, record_json)
gateway_restart_sentinel(sentinel_key, version, kind, status, ts, session_key, thread_id, delivery_channel, delivery_to, delivery_account_id, message, continuation_json, doctor_hint, stats_json, payload_json, updated_at_ms)
channel_pairing_requests(channel_key, account_id, request_id, code, created_at, last_seen_at, meta_json)
channel_pairing_allow_entries(channel_key, account_id, entry, sort_order, updated_at)
voicewake_triggers(config_key, position, trigger, updated_at_ms)
voicewake_routing_config(config_key, version, default_target_mode, default_target_agent_id, default_target_session_key, updated_at_ms)
voicewake_routing_routes(config_key, position, trigger, target_mode, target_agent_id, target_session_key, updated_at_ms)
update_check_state(state_key, last_checked_at, last_notified_version, last_notified_tag, last_available_version, last_available_tag, auto_install_id, auto_first_seen_version, auto_first_seen_tag, auto_first_seen_at, auto_last_attempt_version, auto_last_attempt_at, auto_last_success_version, auto_last_success_at, updated_at_ms)
config_health_entries(config_path, last_known_good_json, last_promoted_good_json, last_observed_suspicious_signature, updated_at_ms)
sandbox_registry_entries(registry_kind, container_name, session_key, backend_id, runtime_label, image, created_at_ms, last_used_at_ms, config_label_kind, config_hash, cdp_port, no_vnc_port, entry_json, updated_at)
cron_run_logs(store_key, job_id, seq, ts, status, error, summary, diagnostics_summary, delivery_status, delivery_error, delivered, session_id, session_key, run_id, run_at_ms, duration_ms, next_run_at_ms, model, provider, total_tokens, entry_json, created_at)
cron_jobs(store_key, job_id, name, description, enabled, delete_after_run, created_at_ms, agent_id, session_key, schedule_kind, schedule_expr, schedule_tz, every_ms, anchor_ms, at, stagger_ms, session_target, wake_mode, payload_kind, payload_message, payload_model, payload_fallbacks_json, payload_thinking, payload_timeout_seconds, payload_allow_unsafe_external_content, payload_external_content_source_json, payload_light_context, payload_tools_allow_json, delivery_mode, delivery_channel, delivery_to, delivery_thread_id, delivery_account_id, delivery_best_effort, failure_delivery_mode, failure_delivery_channel, failure_delivery_to, failure_delivery_account_id, failure_alert_disabled, failure_alert_after, failure_alert_channel, failure_alert_to, failure_alert_cooldown_ms, failure_alert_include_skipped, failure_alert_mode, failure_alert_account_id, next_run_at_ms, running_at_ms, last_run_at_ms, last_run_status, last_error, last_duration_ms, consecutive_errors, consecutive_skipped, schedule_error_count, last_delivery_status, last_delivery_error, last_delivered, last_failure_alert_at_ms, job_json, state_json, runtime_updated_at_ms, schedule_identity, sort_order, updated_at)
delivery_queue_entries(queue_name, id, status, entry_kind, session_key, channel, target, account_id, retry_count, last_attempt_at, last_error, recovery_state, platform_send_started_at, entry_json, enqueued_at, updated_at, failed_at)
commitments(id, agent_id, session_key, channel, account_id, recipient_id, thread_id, sender_id, kind, sensitivity, source, status, reason, suggested_text, dedupe_key, confidence, due_earliest_ms, due_latest_ms, due_timezone, source_message_id, source_run_id, created_at_ms, updated_at_ms, attempts, last_attempt_at_ms, sent_at_ms, dismissed_at_ms, snoozed_until_ms, expired_at_ms, record_json)
migration_runs(id, started_at, finished_at, status, report_json)
migration_sources(source_key, migration_kind, source_path, target_table, source_sha256, source_size_bytes, source_record_count, last_run_id, status, imported_at, removed_source, report_json)
backup_runs(id, created_at, archive_path, status, manifest_json)
```

Base de datos del agente:

```text
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
sessions(session_id, session_key, session_scope, created_at, updated_at, started_at, ended_at, status, chat_type, channel, account_id, primary_conversation_id, model_provider, model, agent_harness_id, parent_session_key, spawned_by, display_name)
conversations(conversation_id, channel, account_id, kind, peer_id, parent_conversation_id, thread_id, native_channel_id, native_direct_user_id, label, metadata_json, created_at, updated_at)
session_conversations(session_id, conversation_id, role, first_seen_at, last_seen_at)
session_routes(session_key, session_id, updated_at)
session_entries(session_id, session_key, entry_json, updated_at)
transcript_events(session_id, seq, event_json, created_at)
transcript_event_identities(session_id, event_id, seq, event_type, has_parent, parent_id, message_idempotency_key, created_at)
transcript_snapshots(session_id, snapshot_id, reason, event_count, created_at, metadata_json)
vfs_entries(namespace, path, kind, content_blob, metadata_json, updated_at)
tool_artifacts(run_id, artifact_id, kind, metadata_json, blob, created_at)
run_artifacts(run_id, path, kind, metadata_json, blob, created_at)
trajectory_runtime_events(session_id, run_id, seq, event_json, created_at)
memory_index_meta(key, value)
memory_index_sources(path, source, hash, mtime, size)
memory_index_chunks(id, path, source, start_line, end_line, hash, model, text, embedding, updated_at)
memory_embedding_cache(provider, model, provider_key, hash, embedding, dims, updated_at)
memory_index_state(id, revision)
cache_entries(scope, key, value_json, blob, expires_at, updated_at)
```

La búsqueda futura puede añadir tablas FTS sin cambiar las tablas canónicas de eventos:

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

Los valores grandes deben usar columnas `blob`, no codificación de cadenas JSON. Mantén
`value_json` para datos estructurados pequeños que deban seguir siendo inspeccionables con herramientas
SQLite simples.

`agent_databases` es el registro canónico para esta rama. No añadas una tabla
`agents` hasta que exista un propietario real de registros de agente; la configuración de agente permanece en
`openclaw.json`.

## Forma de la migración de Doctor

Doctor debe llamar a un único paso de migración explícito que se pueda reportar y sea seguro de
volver a ejecutar:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` invoca la implementación de migración de estado después de la
preverificación ordinaria de configuración y crea una copia de seguridad verificada antes de importar. El inicio del runtime
y `openclaw migrate` no deben importar archivos de estado heredados de OpenClaw.

Propiedades de la migración:

- Una pasada de migración descubre todos los orígenes de archivos heredados y produce un plan
  antes de mutar nada.
- Doctor crea un archivo de copia de seguridad verificado previo a la migración antes de importar
  archivos heredados.
- Las importaciones son idempotentes y se indexan por ruta de origen, mtime, tamaño, hash y tabla
  de destino.
- Los archivos de origen correctos se eliminan o archivan después de que la base de datos de destino haya
  confirmado.
- Las importaciones fallidas dejan el origen intacto y registran una advertencia en
  `migration_runs`.
- El código de runtime lee solo SQLite después de que exista la migración.
- No se requiere una ruta de degradación/exportación a archivos de runtime.

## Inventario de migración

Mueve estos a la base de datos global:

- Las escrituras en tiempo de ejecución del registro de tareas ahora usan la base de datos compartida; el importador sidecar no publicado
  `tasks/runs.sqlite` se eliminó. Los guardados de instantáneas hacen upsert por id de tarea
  y eliminan solo las filas de tarea/entrega que faltan.
- Las escrituras en tiempo de ejecución de TaskFlow ahora usan la base de datos compartida; el importador sidecar no publicado
  `tasks/flows/registry.sqlite` se eliminó. Los guardados de instantáneas
  hacen upsert por id de flujo y eliminan solo las filas de flujo que faltan.
- Las escrituras en tiempo de ejecución del estado de Plugin ahora usan la base de datos compartida; el importador sidecar no publicado
  `plugin-state/state.sqlite` se eliminó.
- La búsqueda de memoria integrada ya no usa de forma predeterminada `memory/<agentId>.sqlite`; sus
  tablas de índice viven en la base de datos del agente propietario, y la opción explícita
  `memorySearch.store.path` para sidecar se retiró a la migración de configuración de doctor.
- La reindexación de memoria integrada restablece solo las tablas propiedad de memoria en la base de datos del agente.
  No debe reemplazar todo el archivo SQLite, porque la misma base de datos posee
  sesiones, transcripciones, filas de VFS, artefactos y cachés de tiempo de ejecución.
- Registros de contenedores/navegadores sandbox desde JSON monolítico y fragmentado. Las escrituras en tiempo de ejecución
  ahora usan la base de datos compartida; la importación de JSON heredado permanece.
- Las definiciones de trabajos Cron, el estado de programación y el historial de ejecuciones ahora usan SQLite compartido;
  doctor importa/elimina los archivos heredados `jobs.json`, `jobs-state.json` y
  `cron/runs/*.jsonl`
- Identidad/autenticación de dispositivo, push, comprobación de actualizaciones, compromisos, caché de modelos de OpenRouter, índice de plugins instalados y vinculaciones del servidor de la aplicación
- Los registros de emparejamiento y bootstrap de dispositivo/nodo ahora usan tablas SQLite tipadas
- Los suscriptores de notificaciones de emparejamiento de dispositivos y los marcadores de solicitudes entregadas ahora usan la tabla compartida SQLite plugin-state en lugar de `device-pair-notify.json`.
- Los registros de llamadas de voz ahora usan la tabla compartida SQLite plugin-state bajo el espacio de nombres
  `voice-call` / `calls` en lugar de `calls.jsonl`; la CLI del plugin
  sigue y resume el historial de llamadas respaldado por SQLite.
- Las sesiones de gateway de QQBot, los registros de usuarios conocidos y la caché de citas ref-index ahora usan
  estado de plugin SQLite bajo espacios de nombres `qqbot` (`sessions`, `known-users`,
  `ref-index`) en lugar de `session-*.json`, `known-users.json` y
  `ref-index.jsonl`; la migración doctor/setup de QQBot importa y elimina los
  archivos heredados.
- Las preferencias del selector de modelos de Discord, los hashes de despliegue de comandos y las vinculaciones de hilos
  ahora usan estado de plugin SQLite bajo espacios de nombres `discord`
  (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`)
  en lugar de `model-picker-preferences.json`, `command-deploy-cache.json` y
  `thread-bindings.json`; la migración doctor/setup de Discord importa y
  elimina los archivos heredados.
- Los cursores de recuperación de BlueBubbles y los marcadores de deduplicación de entrada ahora usan estado de plugin SQLite
  bajo espacios de nombres `bluebubbles` (`catchup-cursors`, `inbound-dedupe`)
  en lugar de `bluebubbles/catchup/*.json` y
  `bluebubbles/inbound-dedupe/*.json`; la migración doctor/setup de BlueBubbles
  importa y elimina los archivos heredados.
- Los desplazamientos de actualización de Telegram, las entradas de caché de stickers, las entradas de caché de mensajes de cadena de respuestas,
  las entradas de caché de mensajes enviados, las entradas de caché de nombres de temas y las vinculaciones de hilos
  ahora usan estado de plugin SQLite bajo espacios de nombres `telegram`
  (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`,
  `topic-names`, `thread-bindings`) en lugar de `update-offset-*.json`,
  `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json` y
  `thread-bindings-*.json`; la migración doctor/setup de Telegram importa y
  elimina los archivos heredados.
- Los cursores de recuperación de iMessage, las asignaciones de ids cortos de respuesta y las filas de deduplicación de eco enviado
  ahora usan estado de plugin SQLite bajo espacios de nombres `imessage` (`catchup-cursors`,
  `reply-cache`, `sent-echoes`) en lugar de `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` y `imessage/sent-echoes.jsonl`; la migración
  doctor/setup de iMessage importa y elimina los archivos heredados.
- Las conversaciones, encuestas, tokens SSO y aprendizajes de retroalimentación de Microsoft Teams ahora
  usan espacios de nombres de estado de plugin SQLite (`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`) en lugar de `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json` y `*.learnings.json`; la
  migración doctor/setup de Microsoft Teams importa y archiva los archivos heredados.
  Las cargas pendientes son una caché SQLite de corta duración y los archivos JSON de caché antiguos
  no se migran.
- La caché de sincronización de Matrix, los metadatos de almacenamiento, las vinculaciones de hilos, los marcadores de deduplicación de entrada,
  el estado de enfriamiento de verificación de inicio, las credenciales, las claves de recuperación y las instantáneas criptográficas IndexedDB del SDK
  ahora usan espacios de nombres de blob/estado de plugin SQLite bajo
  `matrix` (`sync-store`, `storage-meta`, `thread-bindings`, `inbound-dedupe`,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`)
  en lugar de `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json` y `crypto-idb-snapshot.json`; la migración doctor/setup
  de Matrix importa y elimina esos archivos heredados desde las raíces de almacenamiento de Matrix con ámbito de cuenta.
- Los cursores del bus de Nostr y el estado de publicación del perfil ahora usan estado de plugin SQLite bajo
  espacios de nombres `nostr` (`bus-state`, `profile-state`) en lugar de
  `bus-state-*.json` y `profile-state-*.json`; la migración doctor/setup de Nostr
  importa y elimina los archivos heredados.
- Los conmutadores de sesión de Active Memory ahora usan estado de plugin SQLite bajo
  `active-memory/session-toggles` en lugar de `session-toggles.json`.
- Las colas de propuestas de Skill Workshop y los contadores de revisión ahora usan estado de plugin SQLite
  bajo `skill-workshop/proposals` y `skill-workshop/reviews` en lugar de
  archivos `skill-workshop/<workspace>.json` por espacio de trabajo.
- Las colas de entrega saliente y entrega de sesión ahora comparten la tabla SQLite global
  `delivery_queue_entries` bajo nombres de cola separados
  (`outbound-delivery`, `session-delivery`) en lugar de archivos duraderos
  `delivery-queue/*.json`, `delivery-queue/failed/*.json` y
  `session-delivery-queue/*.json`. El paso doctor legacy-state importa
  filas pendientes y fallidas, elimina marcadores de entregado obsoletos y borra los archivos
  JSON antiguos después de la importación. Los campos de enrutamiento activo y reintento son columnas tipadas; la
  carga útil JSON se conserva solo para reproducción/depuración.
- Los leases de procesos ACPX ahora usan estado de plugin SQLite bajo `acpx/process-leases`
  en lugar de `process-leases.json`.
- Metadatos de ejecuciones de copia de seguridad y migración

Mover estos elementos a bases de datos de agentes:

- Raíces de sesión de agente y cargas útiles de entradas de sesión con forma de compatibilidad. Hecho para
  escrituras en tiempo de ejecución: los metadatos activos de sesión se pueden consultar en `sessions`, mientras que la
  carga útil completa heredada `SessionEntry` permanece en `session_entries`.
- Eventos de transcripción de agente. Hecho para escrituras en tiempo de ejecución.
- Puntos de control de Compaction e instantáneas de transcripción. Hecho para escrituras en tiempo de ejecución:
  las copias de transcripción de puntos de control son filas de transcripción SQLite y los metadatos de puntos de control
  se registran en `transcript_snapshots`. Los helpers de puntos de control de Gateway
  ahora nombran estos valores como instantáneas de transcripción en lugar de archivos fuente.
- Espacios de nombres scratch/workspace de VFS de agente. Hecho para escrituras VFS en tiempo de ejecución.
- Cargas útiles de adjuntos de subagentes. Hecho para escrituras en tiempo de ejecución: son entradas semilla VFS SQLite
  y nunca archivos duraderos de espacio de trabajo.
- Artefactos de herramientas. Hecho para escrituras en tiempo de ejecución.
- Artefactos de ejecución. Hecho para escrituras en tiempo de ejecución de worker mediante la tabla por agente
  `run_artifacts`.
- Cachés de tiempo de ejecución locales de agente. Hecho para escrituras de caché con ámbito de tiempo de ejecución de worker mediante
  la tabla por agente `cache_entries`. Las cachés de modelos de ámbito Gateway permanecen en la
  base de datos global salvo que pasen a ser específicas de agente.
- Registros de flujos padre de ACP. Hecho para escrituras en tiempo de ejecución.
- Sesiones del libro mayor de reproducción de ACP. Hecho para escrituras en tiempo de ejecución mediante
  `acp_replay_sessions` y `acp_replay_events`; el `acp/event-ledger.json` heredado
  permanece solo como entrada de doctor.
- Metadatos de sesión de ACP. Hecho para escrituras en tiempo de ejecución mediante `acp_sessions`; los bloques
  `entry.acp` heredados en `sessions.json` son solo entrada de migración de doctor.
- Sidecars de trayectoria cuando no son archivos de exportación explícitos. Hecho para escrituras en tiempo de ejecución:
  la captura de trayectoria escribe filas `trajectory_runtime_events` en la base de datos del agente
  y refleja artefactos con ámbito de ejecución en SQLite. Los sidecars heredados son solo entradas
  de importación de doctor; la exportación puede materializar salidas JSONL nuevas de support-bundle
  pero no lee ni migra sidecars antiguos de trayectoria/transcripción en tiempo de ejecución.
  La captura de trayectoria en tiempo de ejecución expone ámbito SQLite; los helpers de ruta JSONL están
  aislados para exportación/depuración y no se reexportan desde el módulo de tiempo de ejecución.
  Los metadatos de trayectoria del runner embebido registran la identidad `{agentId, sessionId, sessionKey}`
  en lugar de persistir un localizador de transcripción.

Mantener estos respaldados por archivos por ahora:

- `openclaw.json`
- archivos de credenciales de proveedor o CLI
- manifiestos de plugin/paquete
- espacios de trabajo de usuario y repositorios Git cuando se selecciona el modo de disco
- registros destinados a seguimiento por operadores, salvo que se mueva una superficie de registro específica

## Plan de migración

### Fase 0: Congelar el límite

Hacer explícito el límite de estado duradero antes de mover más filas:

- Agregar una tabla `migration_runs` a la base de datos global.
  Hecho para informes de ejecución de migración de estado heredado.
- Agregar un único servicio de migración de estado de archivo a base de datos propiedad de doctor.
  Hecho: `openclaw doctor --fix` usa la implementación de migración de legacy-state.
- Hacer que `plan` sea de solo lectura y que `apply` cree una copia de seguridad, importe, verifique y
  luego elimine o ponga en cuarentena archivos antiguos.
  Hecho: doctor crea una copia de seguridad verificada previa a la migración, pasa la ruta de la copia de seguridad
  a `migration_runs` y reutiliza las rutas de importador/eliminación.
- Agregar prohibiciones estáticas para que el nuevo código en tiempo de ejecución no pueda escribir archivos de estado heredados mientras
  el código de migración y las pruebas aún pueden sembrarlos/leerlos.
  Hecho para los almacenes heredados migrados actualmente; la guarda también escanea pruebas anidadas
  en busca de contratos prohibidos de localizador de transcripción en tiempo de ejecución.

### Fase 1: Terminar el plano de control global

Mantener el estado de coordinación compartido en `state/openclaw.sqlite`:

- Agentes y registro de bases de datos de agentes
- Libros mayores de tareas y TaskFlow
- Estado de Plugin
- Registro de contenedores/navegadores sandbox
- Historial de ejecuciones de Cron/planificador
- Emparejamiento, dispositivo, push, comprobación de actualizaciones, TUI, cachés de OpenRouter/modelos y otro
  estado pequeño de tiempo de ejecución con ámbito de gateway
- Metadatos de copia de seguridad y migración
- Bytes de adjuntos multimedia de Gateway. Hecho para escrituras en tiempo de ejecución; las rutas directas de archivos
  son materializaciones temporales por compatibilidad con remitentes de canales y staging de sandbox.
  Las listas permitidas en tiempo de ejecución aceptan rutas de materialización SQLite, no raíces multimedia heredadas
  de estado/configuración. Doctor importa archivos multimedia heredados en
  `media_blobs` y elimina los archivos fuente tras escrituras de filas correctas.
- Sesiones de captura del proxy de depuración, eventos y blobs de carga útil. Hecho: las capturas viven
  en la base de datos de estado compartida y se abren mediante bootstrap, esquema,
  WAL y ajustes de busy-timeout de la base de datos de estado compartida. Los bytes de carga útil se comprimen con gzip en
  `capture_blobs.data`; no hay anulación de base de datos sidecar en tiempo de ejecución del proxy de depuración,
  directorio de blobs ni destino generado de esquema/codegen exclusivo de captura de proxy.
  La migración doctor/startup importa filas `debug-proxy/capture.sqlite` publicadas
  y blobs de carga útil referenciados, incluidas las anulaciones activas heredadas de entorno
  de DB/blob, y luego archiva esas fuentes dejando intactos los certificados CA.

Esta fase también elimina abridores sidecar duplicados, helpers de permisos, configuración WAL,
poda del sistema de archivos y escritores de compatibilidad de esos subsistemas.

### Fase 2: Introducir bases de datos por agente

Crear una base de datos por agente y registrarla desde la DB global:

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

La fila global `agent_databases` almacena la ruta, la versión de esquema, la marca de tiempo
de última vista y metadatos básicos de tamaño/integridad. El código en tiempo de ejecución solicita al registro la DB
del agente en lugar de derivar rutas de archivos directamente.

La DB del agente posee:

- `sessions` como la raíz de sesión canónica, con `session_entries` como la tabla de payload con forma de compatibilidad adjunta a esa raíz, y `session_routes` como la búsqueda única activa de `session_key`
- `conversations` y `session_conversations` como la identidad de enrutamiento de proveedor normalizada adjunta a las sesiones
- `transcript_events`
- instantáneas de transcripción y puntos de control de Compaction. Completado para escrituras de runtime.
- `vfs_entries`
- `tool_artifacts` y artefactos de ejecución
- filas de runtime/caché locales al agente. Completado para cachés con alcance de worker.
- eventos de flujo padre de ACP
- eventos de runtime de trayectoria cuando no son artefactos de exportación explícitos

### Fase 3: Reemplazar las API del almacén de sesiones

Completado para runtime. La superficie del almacén de sesiones con forma de archivo no es un contrato de runtime activo:

- Runtime ya no llama a `loadSessionStore(storePath)` ni trata `storePath` como identidad de sesión.
- Las operaciones de filas de runtime son `getSessionEntry`, `upsertSessionEntry`, `patchSessionEntry`, `deleteSessionEntry` y `listSessionEntries`.
- Los helpers de reescritura de almacén completo, escritores de archivos, pruebas de cola, poda de alias y parámetros de eliminación de claves heredadas ya no están en runtime.
- Las exportaciones de compatibilidad obsoletas del paquete raíz aún adaptan rutas canónicas de `sessions.json` a las API de filas de SQLite.
- El análisis de `sessions.json` permanece solo en código de migración/importación de doctor y pruebas de doctor.
- La reserva del ciclo de vida de runtime lee encabezados de transcripción de SQLite, no las primeras líneas de JSONL.

Sigue eliminando cualquier cosa que reintroduzca parámetros de bloqueo de archivo, vocabulario de poda/truncamiento como mantenimiento de archivos, identidad de ruta de almacén o pruebas cuya única afirmación sea la persistencia JSON.

### Fase 4: Mover transcripciones, flujos ACP, trayectorias y VFS

Haz que cada flujo de datos de agente sea nativo de base de datos:

- Las escrituras de agregado de transcripción pasan por una transacción SQLite que asegura el encabezado de sesión, comprueba la idempotencia del mensaje, selecciona la cola padre, inserta en `transcript_events` y registra metadatos de identidad consultables en `transcript_event_identities`. Completado para agregados directos de mensajes de transcripción y agregados normales persistidos de `TranscriptSessionManager`; las operaciones de rama explícitas conservan su elección explícita de padre y siguen escribiendo filas SQLite sin derivar ningún localizador de archivo.
- Los registros de flujo padre de ACP se convierten en filas, no en archivos `.acp-stream.jsonl`. Completado.
- La configuración de generación de ACP ya no persiste rutas JSONL de transcripción. Completado.
- La captura de trayectoria de runtime escribe filas/artefactos de eventos directamente. El comando explícito de soporte/exportación aún puede producir artefactos JSONL de paquete de soporte como formato de exportación, pero la exportación de sesión no recrea JSONL de sesión. Completado.
- Los espacios de trabajo en disco permanecen en disco cuando se configuran en modo disco.
- El borrador VFS y el modo experimental de espacio de trabajo solo VFS usan la base de datos del agente.

La migración importa los archivos JSONL antiguos una vez, registra conteos/hashes en `migration_runs` y elimina los archivos importados después de comprobaciones de integridad.

### Fase 5: Copia de seguridad, restauración, vacuum y verificación

Las copias de seguridad permanecen como un único archivo de archivo comprimido:

- Crear punto de control para cada base de datos global y de agente.
- Tomar instantánea de cada BD con semántica de copia de seguridad de SQLite o `VACUUM INTO`.
- Archivar instantáneas compactas de BD, configuración, credenciales externas y exportaciones de espacio de trabajo solicitadas.
- Omitir archivos live sin procesar `*.sqlite-wal` y `*.sqlite-shm`.
- Verificar abriendo cada instantánea de BD y ejecutando `PRAGMA integrity_check`.
  `openclaw backup create` realiza esta verificación de archivo comprimido de forma predeterminada;
  `--no-verify` omite solo la pasada posterior a la escritura del archivo comprimido, no la comprobación de integridad de creación de instantáneas.
- La restauración copia las instantáneas de vuelta a sus rutas de destino. Esta rama restablece el diseño SQLite no publicado a `user_version = 1`; los cambios futuros de esquema publicados pueden añadir migraciones explícitas cuando sean necesarias.

### Fase 6: Runtime de worker

Mantén el modo worker como experimental mientras aterriza la división de base de datos:

- Los workers reciben id de agente, id de ejecución, modo de sistema de archivos e identidad de registro de BD.
- Cada worker abre su propia conexión SQLite.
- El padre conserva la autoridad sobre entrega de canal, aprobaciones, configuración y cancelación.
- Empieza con un worker por ejecución activa; añade pooling solo después de que el ciclo de vida y la propiedad de conexiones de BD sean estables.

### Fase 7: Eliminar el mundo antiguo

Completado para la gestión de sesiones de runtime. El mundo antiguo solo se permite como entrada explícita de doctor o salida de soporte/exportación:

- Sin escrituras de runtime de `sessions.json`, JSONL de transcripción, JSON de registro de sandbox, SQLite sidecar de tareas ni SQLite sidecar de estado de Plugin.
- Sin poda de archivo JSON/sesión, truncamiento de transcripción de archivo, bloqueos de archivo de sesión ni pruebas de sesión con forma de bloqueo.
- Sin exportaciones de compatibilidad de runtime cuyo propósito sea mantener actualizados archivos de sesión antiguos.
- Las exportaciones explícitas de soporte permanecen como formatos de archivo/materialización solicitados por el usuario y no deben devolver nombres de archivo a la identidad de runtime.

## Copia de seguridad y restauración

Las copias de seguridad deberían ser un único archivo de archivo comprimido, pero la captura de base de datos debería ser nativa de SQLite:

1. Detén la actividad de escritura de larga duración o entra en una breve barrera de copia de seguridad.
2. Para cada base de datos global y de agente, ejecuta un punto de control.
3. Toma una instantánea de cada base de datos usando semántica de copia de seguridad de SQLite o `VACUUM INTO` hacia un directorio temporal de copia de seguridad.
4. Archiva las instantáneas de base de datos compactadas, el archivo de configuración, el directorio de credenciales, los espacios de trabajo seleccionados y un manifiesto.
5. Verifica el archivo comprimido abriendo cada instantánea SQLite incluida y ejecutando `PRAGMA integrity_check`.
   `openclaw backup create` lo hace de forma predeterminada; `--no-verify` es solo para omitir intencionalmente la pasada posterior a la escritura del archivo comprimido.

No dependas de copias live sin procesar de `*.sqlite`, `*.sqlite-wal` y `*.sqlite-shm` como formato principal de copia de seguridad. El manifiesto del archivo comprimido debería registrar rol de base de datos, id de agente, versión de esquema, ruta de origen, ruta de instantánea, tamaño en bytes y estado de integridad.

La restauración debería reconstruir la base de datos global y los archivos de base de datos de agente desde las instantáneas del archivo comprimido. Como el diseño SQLite aún no se ha publicado, esta refactorización conserva solo el esquema de versión 1 más la importación de archivo a base de datos de doctor. El comando de restauración valida primero el archivo comprimido y luego reemplaza cada recurso del manifiesto desde el payload extraído verificado.

## Plan de refactorización de runtime

1. Añadir API de registro de base de datos.
   - Resolver rutas de BD global y BD por agente.
   - Mantener los esquemas no publicados en `user_version = 1`; no añadir código ejecutor de migración de esquema hasta que un esquema publicado lo necesite.
   - Añadir helpers de cierre/punto de control/integridad usados por pruebas, copia de seguridad y doctor.

2. Colapsar almacenes SQLite sidecar.
   - Mover tablas de estado de Plugin a la base de datos global. Completado para escrituras de runtime; el importador sidecar heredado no publicado se eliminó.
   - Mover tablas de registro de tareas a la base de datos global. Completado para escrituras de runtime; el importador sidecar heredado no publicado se eliminó.
   - Mover tablas de Task Flow a la base de datos global. Completado para escrituras de runtime; el importador sidecar heredado no publicado se eliminó.
   - Mover tablas integradas de búsqueda de memoria a cada base de datos de agente. Completado; `memorySearch.store.path` personalizado explícito ahora es eliminado por la migración de configuración de doctor.
     La reindexación completa se ejecuta in situ solo contra tablas de memoria; la ruta antigua de intercambio de archivo completo y el helper de intercambio de índice sidecar se eliminaron.
   - Eliminar abridores de base de datos duplicados, configuración de WAL, helpers de permisos y rutas de cierre de esos subsistemas.

3. Mover tablas propiedad del agente a bases de datos por agente.
   - Crear BD de agente bajo demanda a través del registro de base de datos global. Completado.
   - Mover entradas de sesión de runtime, eventos de transcripción, filas VFS y artefactos de herramienta a BD de agente. Completado.
   - No migrar entradas de sesión, eventos de transcripción, filas VFS ni artefactos de herramienta locales a rama en BD compartida; ese diseño nunca se publicó. Conservar solo la importación heredada de archivo a base de datos en doctor.

4. Reemplazar las API del almacén de sesiones.
   - Eliminar `storePath` como identidad de runtime. Completado para runtime y protegido por `check:database-first-legacy-stores`: los metadatos de sesión, actualizaciones de ruta, persistencia de comandos, limpieza de sesiones de CLI, vistas previas de razonamiento de Feishu, persistencia de estado de transcripción, profundidad de subagente, anulaciones de sesión de perfil de autenticación, lógica de bifurcación padre y la inspección de QA-lab ahora resuelven la base de datos desde claves canónicas de agente/sesión.
     Las respuestas de lista de sesiones de Gateway/TUI/UI/macOS ahora exponen `databasePath` en lugar de `path` heredado; las superficies de depuración de macOS muestran la base de datos por agente como estado de solo lectura en lugar de escribir configuración `session.store`.
     `/status`, la exportación de trayectoria impulsada por chat y los proxies de dependencias de CLI ya no propagan rutas de almacén heredadas; la reserva de uso de transcripción lee SQLite por identidad de agente/sesión. Las pruebas de runtime y bridge ya no exponen `storePath`; las entradas de doctor/migración poseen ese nombre de campo heredado.
     La carga combinada de sesiones de Gateway ya no tiene una rama especial de runtime para valores no plantillados de `session.store`; agrega filas SQLite por agente.
     El carril heredado de doctor de bloqueo de sesión y su helper de limpieza `.jsonl.lock` se eliminaron; SQLite es ahora el límite de concurrencia de sesión.
     Los sitios de llamada calientes de runtime usan nombres de helpers orientados a filas como `resolveSessionRowEntry`; el alias de compatibilidad antiguo `resolveSessionStoreEntry` se eliminó de runtime y de las exportaciones del SDK de Plugin.

- Usar operaciones de fila `{ agentId, sessionKey }`.
  Completado: `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`, `patchSessionEntry` y `listSessionEntries` son API SQLite-first que no requieren una ruta de almacén de sesión. El resumen de estado, el estado de agente local, la salud y el comando de listado `openclaw sessions` ahora leen filas por agente directamente y muestran rutas de base de datos SQLite por agente en lugar de rutas `sessions.json`.
- Reemplazar la eliminación/inserción de almacén completo con `upsertSessionEntry`,
  `deleteSessionEntry`, `listSessionEntries` y consultas de limpieza SQL.
  Completado para runtime: las rutas calientes ahora usan API de filas y parches de fila con reintento por conflicto; los helpers restantes de importación/reemplazo de almacén completo se limitan a código de importación de migración y pruebas de backend SQLite.
  - Eliminar `store-writer.ts` y pruebas de cola de escritor. Completado.
  - Eliminar parámetros de poda de claves heredadas de runtime y eliminación de alias de upserts/parches de filas de sesión. Completado.

5. Eliminar comportamiento de registro JSON de runtime.
   - Hacer que las lecturas y escrituras del registro de sandbox sean solo SQLite. Completado.
   - Importar JSON monolítico y fragmentado solo desde el paso de migración. Completado.
   - Eliminar bloqueos de registro fragmentado y escrituras JSON. Completado.

- Mantener una tabla de registro tipada en lugar de almacenar filas de registro como JSON opaco genérico si la forma sigue siendo estado operativo de ruta caliente. Completado.

6. Eliminar mutación de sesión con forma de bloqueo de archivo.
   - Completado para creación de bloqueos de runtime y API de bloqueos de runtime.
   - El carril independiente de limpieza de doctor para `.jsonl.lock` heredado se eliminó.
   - `session.writeLock` es configuración heredada migrada por doctor, no un ajuste tipado de runtime.
   - La integridad de estado ya no tiene una ruta separada de poda de archivos de transcripción huérfanos; la migración de doctor importa/elimina fuentes JSONL heredadas en un solo lugar.
   - La coordinación singleton de Gateway usa filas SQLite tipadas `state_leases` bajo `gateway_locks` y ya no expone una interfaz de directorio de bloqueo de archivo.
   - La persistencia genérica de dedupe del SDK de Plugin ya no usa bloqueos de archivo ni archivos JSON; escribe filas SQLite compartidas de estado de Plugin. Completado.
   - La coordinación de incrustación QMD usa una concesión de estado SQLite en lugar de `qmd/embed.lock`. Completado.

7. Hacer que los workers sean conscientes de la base de datos.
   - Los workers abren sus propias conexiones SQLite.
   - El padre posee entrega, callbacks de canal y configuración.
   - El worker recibe id de agente, id de ejecución, modo de sistema de archivos e identidad de registro de BD, no handles live.
   - `vfs-only` permanece experimental y usa la base de datos del agente como su raíz de almacenamiento.
   - Mantener primero un worker por ejecución activa. El pooling puede esperar hasta que la vida útil de conexiones de BD y el comportamiento de cancelación sean rutinarios.

8. Integración de copias de seguridad.
   - Enseña a backup a crear instantáneas de las bases de datos globales y de agentes mediante SQLite backup o
     `VACUUM INTO`. Hecho para los archivos `*.sqlite` descubiertos bajo el recurso de estado.

- `sessions.json`
- `*.trajectory.jsonl` excepto salidas materializadas de paquetes de soporte
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- archivos de caché de runtime `cache/*.json`
- `agents/<agentId>/agent/auth.json`
- `agents/<agentId>/agent/models.json`
- `credentials/oauth.json`
- `github-copilot.token.json`
- `openrouter-models.json`
- `auth-profiles.json`
- `auth-state.json`
- `exec-approvals.json`
- `workspace-state.json`
- `credentials*.json` de Matrix y `recovery-key.json`
- `cron/runs/*.jsonl`
- `cron/jobs.json`
- `jobs-state.json`
- `device-pair-notify.json`
- `devices/pending.json`
- `devices/paired.json`
- `devices/bootstrap.json`
- `nodes/pending.json`
- `nodes/paired.json`
- `identity/device.json`
- `identity/device-auth.json`
- `push/web-push-subscriptions.json`
- `push/vapid-keys.json`
- `push/apns-registrations.json`
- `process-leases.json`
- `gateway-instance-id`
- `session-toggles.json`
- `.dreams/events.jsonl` de Memory-core
- `.dreams/session-corpus/` de Memory-core
- `.dreams/daily-ingestion.json` de Memory-core
- `.dreams/session-ingestion.json` de Memory-core
- `.dreams/short-term-recall.json` de Memory-core
- `.dreams/phase-signals.json` de Memory-core
- `.dreams/short-term-promotion.lock` de Memory-core
- `skill-workshop/<workspace>.json` de Skill Workshop
- `skill-workshop/skill-workshop-review-*.json` de Skill Workshop
- `bus-state-*.json` de Nostr
- `profile-state-*.json` de Nostr
- `calls.jsonl`
- `known-users.json`
- `ref-index.jsonl`
- `session-*.json` de QQBot
- `bluebubbles/catchup/*.json` de BlueBubbles
- `bluebubbles/inbound-dedupe/*.json` de BlueBubbles
- `update-offset-*.json` de Telegram
- `sticker-cache.json` de Telegram
- `*.telegram-messages.json` de Telegram
- `*.telegram-sent-messages.json` de Telegram
- `*.telegram-topic-names.json` de Telegram
- `thread-bindings-*.json` de Telegram
- `catchup/*.json` de iMessage
- `reply-cache.jsonl` de iMessage
- `sent-echoes.jsonl` de iMessage
- `msteams-conversations.json` de Microsoft Teams
- `msteams-polls.json` de Microsoft Teams
- `msteams-sso-tokens.json` de Microsoft Teams
- `*.learnings.json` de Microsoft Teams
- `bot-storage.json` de Matrix
- `sync-store.json` de Matrix
- `thread-bindings.json` de Matrix
- `inbound-dedupe.json` de Matrix
- `startup-verification.json` de Matrix
- `storage-meta.json` de Matrix
- `crypto-idb-snapshot.json` de Matrix
- `model-picker-preferences.json` de Discord
- `command-deploy-cache.json` de Discord
- archivos JSON de fragmentos del registro de sandbox
- archivos JSON del puente `/tmp` del relé de hooks nativos
- `plugin-state/state.sqlite`
- sidecars de runtime ad hoc `openclaw-state.sqlite`
- `tasks/runs.sqlite`
- `tasks/flows/registry.sqlite`
- `bindings/current-conversations.json`
- `restart-sentinel.json`
- `gateway-restart-intent.json`
- `gateway-supervisor-restart-handoff.json`
- `gateway.<hash>.lock`
- `qmd/embed.lock`
- `commands.log`
- `config-health.json`
- `port-guard.json`
- `settings/voicewake.json`
- `settings/voicewake-routing.json`
- `plugin-binding-approvals.json`
- `plugins/installs.json`
- `audit/file-transfer.jsonl`
- `audit/crestodian.jsonl`
- `crestodian/rescue-pending/*.json`
- `plugins/phone-control/armed.json`
- `.openclaw-wiki/log.jsonl` de Memory Wiki
- `.openclaw-wiki/state.json` de Memory Wiki
- `.openclaw-wiki/locks/` de Memory Wiki
- `.openclaw-wiki/source-sync.json` de Memory Wiki
- `.openclaw-wiki/import-runs/*.json` de Memory Wiki
- `.openclaw-wiki/cache/agent-digest.json` de Memory Wiki
- `.openclaw-wiki/cache/claims.jsonl` de Memory Wiki
- `.clawhub/lock.json` de ClawHub
- `.clawhub/origin.json` de ClawHub
- decoración de perfil de navegador `.openclaw-profile-decorated`
- abridores de sesión respaldados por archivos `SessionManager.open(...)`
- fachadas de listado de transcripciones `SessionManager.listAll(...)` y `TranscriptSessionManager.listAll(...)`
- fachadas de bifurcación de transcripciones `SessionManager.forkFromSession(...)` y `TranscriptSessionManager.forkFromSession(...)`
- fachadas de reemplazo de sesiones mutables `SessionManager.newSession(...)` y `TranscriptSessionManager.newSession(...)`
- fachadas de sesiones de rama `SessionManager.createBranchedSession(...)` y `TranscriptSessionManager.createBranchedSession(...)`

La prohibición debe permitir que las pruebas creen fixtures heredadas y que el código de migración
lea/importe/elimine fuentes de archivos heredadas. Los sidecars SQLite no publicados siguen prohibidos
y no reciben permisos de importación de doctor.

## Criterios de Finalización

- Las escrituras de datos y caché de runtime van a la base de datos SQLite global o del agente.
- El runtime ya no escribe índices de sesión, JSONL de transcripciones, JSON de registro de sandbox,
  SQLite de sidecar de tareas ni SQLite de sidecar de estado de Plugin. Los importadores SQLite de sidecar
  de tareas y estado de Plugin no publicados se eliminan.
- La importación de archivos heredados es solo para doctor.
- La copia de seguridad produce un único archivo con instantáneas SQLite compactas y prueba de integridad.
- Los workers de agente pueden ejecutarse con disco, scratch VFS o almacenamiento experimental solo VFS.
- Los archivos de configuración y credenciales explícitas siguen siendo los únicos archivos de control
  persistentes no basados en base de datos esperados.
- Las comprobaciones del repositorio impiden reintroducir almacenes de archivos de runtime heredados.
