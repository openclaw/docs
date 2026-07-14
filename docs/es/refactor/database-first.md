---
read_when:
    - Migración de los datos de ejecución, la caché, las transcripciones, el estado de las tareas o los archivos temporales de OpenClaw a SQLite
    - Diseño de migraciones de doctor desde archivos JSON o JSONL heredados
    - Cambiar el comportamiento de las copias de seguridad, la restauración, el VFS o el almacenamiento de los workers
    - Eliminación de bloqueos de sesión, depuración, truncamiento o rutas de compatibilidad con JSON
summary: Plan de migración para convertir SQLite en la capa principal de estado persistente y caché, manteniendo la configuración respaldada por archivos
title: Refactorización del estado centrada en la base de datos
x-i18n:
    generated_at: "2026-07-14T14:04:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 006d0c07d9960018f7ed47888776be022ab851b813166e90e28a81c0196ffc9f
    source_path: refactor/database-first.md
    workflow: 16
---

# Refactorización del estado con la base de datos como prioridad

## Decisión

Usar una disposición de SQLite de dos niveles:

- Base de datos global: `~/.openclaw/state/openclaw.sqlite`
- Base de datos del agente: una base de datos SQLite por agente para el espacio de trabajo,
  la transcripción, el VFS, los artefactos y el estado de ejecución de gran tamaño propiedad del agente
- La configuración permanece respaldada por archivos: `openclaw.json` permanece fuera de la
  base de datos. Los perfiles de autenticación de ejecución se trasladan a SQLite; los archivos de
  credenciales de proveedores externos o de la CLI permanecen fuera de la base de datos de OpenClaw
  y siguen bajo la gestión de sus propietarios.

La base de datos global es la base de datos del plano de control. Es responsable del descubrimiento de agentes,
el estado compartido del Gateway, el emparejamiento, el estado de dispositivos y nodos, los registros de tareas
y flujos, el estado de los plugins, el estado de ejecución del programador, los metadatos de las copias de seguridad
y el estado de las migraciones.

La base de datos del agente es la base de datos del plano de datos. Es responsable de los metadatos de sesión
del agente, el flujo de eventos de transcripción, el espacio de trabajo VFS o el espacio de nombres temporal,
los artefactos de herramientas, los artefactos de ejecución y los datos de caché locales del agente que pueden
buscarse e indexarse.

Esto proporciona una vista global duradera sin obligar a que los espacios de trabajo de gran tamaño de los agentes,
las transcripciones y los datos binarios temporales entren en la vía de escritura compartida del Gateway.

## Contrato estricto

Esta migración tiene una única forma canónica de ejecución:

- Las filas de sesión solo conservan los metadatos de sesión. No deben conservar
  `transcriptLocator`, rutas de archivos de transcripción, rutas JSONL relacionadas, rutas de bloqueo,
  metadatos de depuración ni punteros de compatibilidad de la época de los archivos.
- La identidad de la transcripción siempre es una identidad de SQLite: `{agentId, sessionId}` más
  metadatos opcionales del tema cuando el protocolo los necesite.
- `sqlite-transcript://...` no es una identidad de ejecución ni de protocolo. El código nuevo no debe
  derivar, conservar, pasar, analizar ni migrar localizadores de transcripciones. El código de ejecución y
  las pruebas no deben contener ningún seudolocalizador; la documentación puede mencionar la cadena
  únicamente para prohibirla.
- Los elementos heredados `sessions.json`, el JSONL de transcripciones, `.jsonl.lock`, la depuración, el truncamiento
  y la lógica antigua de rutas de sesión solo pertenecen a la ruta de migración o importación de doctor.
- Los alias heredados de configuración de sesión solo pertenecen a la migración de doctor. El código de ejecución
  no interpreta `session.idleMinutes`, `session.resetByType.dm` ni
  alias entre agentes de la sesión principal `agent:main:*` para otro agente configurado.
- La identidad de enrutamiento de la sesión es un estado relacional tipado. Las rutas de ejecución críticas y de la interfaz
  de usuario deben leer `sessions.session_scope`, `sessions.account_id`,
  `sessions.primary_conversation_id`, `conversations` y
  `session_conversations`; no deben analizar `session_key` ni extraer de
  `session_entries.entry_json` la identidad del proveedor, salvo como reflejo de compatibilidad
  mientras se eliminan los puntos de llamada antiguos.
- Los marcadores de mensajes directos a nivel de canal, como `dm` frente a `direct`, son
  vocabulario de enrutamiento, no localizadores de transcripciones ni identificadores de compatibilidad
  con el almacenamiento en archivos.
- La configuración heredada de controladores de hooks solo pertenece a las superficies de advertencia o migración de doctor.
  El código de ejecución no debe cargar `hooks.internal.handlers`; los hooks se ejecutan únicamente mediante los
  directorios de hooks descubiertos y los metadatos `HOOK.md`.
- El inicio de la ejecución, las rutas críticas de respuesta, Compaction, el restablecimiento, la recuperación, los diagnósticos,
  TTS, los hooks de memoria, los subagentes, el enrutamiento de comandos de plugins, los límites del protocolo y
  los hooks deben pasar `{agentId, sessionId}` por el entorno de ejecución.
- Las pruebas deben introducir y comprobar filas de transcripción de SQLite mediante
  `{agentId, sessionId}`. Deben eliminarse las pruebas que solo demuestren el reenvío de rutas JSONL,
  la conservación de localizadores proporcionados por quien realiza la llamada o la compatibilidad con archivos de transcripción,
  salvo que cubran la importación de doctor, la materialización de material de asistencia o depuración
  ajeno a las sesiones, o la forma del protocolo.
- `runEmbeddedPiAgent(...)`, las ejecuciones preparadas de trabajadores y el intento
  integrado interno no deben aceptar localizadores de transcripciones. Abren el gestor de transcripciones
  de SQLite mediante `{agentId, sessionId}` y pasan ese gestor a la sesión de agente
  compatible con PI internalizada, para que los puntos de llamada obsoletos no puedan hacer que el ejecutor escriba
  transcripciones JSON/JSONL.
- Los diagnósticos del ejecutor deben almacenar los registros de seguimiento de ejecución, caché y carga útil en SQLite.
  Los diagnósticos de ejecución no deben exponer opciones para sustituir archivos JSONL ni ayudantes genéricos
  para exportar transcripciones a JSONL; las exportaciones destinadas al usuario pueden materializar artefactos explícitos
  a partir de las filas de la base de datos sin devolver nombres de archivos al entorno de ejecución.
- El registro sin procesar de flujos usa `OPENCLAW_RAW_STREAM=1` junto con filas de diagnóstico de SQLite.
  El antiguo contrato de registro de archivos de pi-mono `PI_RAW_STREAM`, `PI_RAW_STREAM_PATH` y
  `raw-openai-completions.jsonl` no forma parte del entorno de ejecución ni de las pruebas de OpenClaw.
- La indexación de memoria de QMD no debe exportar las transcripciones de SQLite a archivos Markdown.
  QMD solo indexa los archivos de memoria configurados; la búsqueda en las transcripciones de sesiones permanece
  respaldada por SQLite.
- La subruta del SDK de QMD es exclusiva de QMD para el código nuevo. Los ayudantes de indexación de
  transcripciones de sesiones de SQLite residen en `memory-core-host-engine-session-transcripts`; cualquier
  reexportación de QMD solo existe por compatibilidad y el código de ejecución no debe utilizarla.
- Los índices de memoria integrados residen en la base de datos del agente propietario. La configuración de ejecución y
  los contratos de ejecución resueltos no deben exponer `memorySearch.store.path`; doctor
  elimina esa clave de configuración heredada y el código actual pasa internamente
  el `databasePath` del agente.

El trabajo de implementación debe seguir eliminando código hasta que estas afirmaciones sean ciertas
sin excepciones fuera de los límites de doctor, importación, exportación y depuración.

## Estado objetivo y progreso

### Objetivo estricto

- Una base de datos SQLite global es responsable del estado del plano de control:
  `state/openclaw.sqlite`.
- Una base de datos SQLite por agente es responsable del estado del plano de datos:
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- La configuración permanece respaldada por archivos. `openclaw.json` no forma parte de esta
  refactorización de la base de datos.
- Los archivos heredados son únicamente entradas para la migración de doctor.
- El entorno de ejecución nunca escribe ni lee archivos JSONL de sesiones o transcripciones como estado activo.

### Estados objetivo

- `not-started`: el código de ejecución de la época de los archivos todavía escribe estado activo.
- `migrating`: el código de doctor o importación puede trasladar datos de archivos a SQLite.
- `dual-read`: un puente temporal lee tanto SQLite como los archivos heredados. Este estado
  está prohibido en esta refactorización, salvo que se documente explícitamente como
  exclusivo de doctor.
- `sqlite-runtime`: el entorno de ejecución solo lee y escribe en SQLite.
- `clean`: se eliminan las API y las pruebas heredadas del entorno de ejecución, y la protección evita
  las regresiones.
- `done`: la documentación, las pruebas, las copias de seguridad, la migración de doctor y las comprobaciones de cambios demuestran
  el estado limpio.

### Estado actual

- Sesiones: `clean` para la ejecución. Las filas de sesión residen en la base de datos de cada agente,
  las API de ejecución usan `{agentId, sessionId}` o `{agentId, sessionKey}`, y
  `sessions.json` es una entrada heredada exclusiva de doctor.
- Transcripciones: `clean` para la ejecución. Los eventos, identidades, instantáneas
  y eventos de trayectoria en tiempo de ejecución de las transcripciones residen en la base de datos de cada agente. El entorno de ejecución ya no
  acepta localizadores de transcripciones ni rutas de transcripciones JSONL.
- Ejecutor PI integrado: `clean`. Las ejecuciones integradas de PI, los trabajadores preparados, Compaction
  y los bucles de reintento usan el ámbito de sesión de SQLite y rechazan identificadores obsoletos de transcripciones.
- Cron: `clean` para la ejecución. El entorno de ejecución usa `cron_jobs` y `task_runs`, propiedad de Cron;
  las pruebas de ejecución usan la nomenclatura `storeKey` de SQLite, y las rutas de Cron de la época de los archivos permanecen
  únicamente en las pruebas de migración heredada de doctor.
- Registro de tareas: `clean`. Las filas de ejecución de tareas y TaskFlow residen en
  `state/openclaw.sqlite`; se han eliminado los importadores de SQLite auxiliares que nunca se publicaron.
- Estado de plugins: `clean`. Las filas de estado y blobs de plugins residen en la base de datos global
  compartida; existen protecciones contra los antiguos ayudantes de SQLite auxiliares para el estado de plugins.
- Memoria: `sqlite-runtime` para la memoria integrada y la indexación de transcripciones de sesiones.
  Las tablas de índices de memoria residen en la base de datos de cada agente, el estado de memoria de los plugins usa
  filas compartidas del estado de plugins, y los archivos de memoria heredados son entradas para la migración de doctor
  o contenido del espacio de trabajo del usuario.
- Copia de seguridad: `sqlite-runtime`. El proceso de copia de seguridad prepara instantáneas compactas de SQLite, omite los
  archivos auxiliares WAL/SHM activos, verifica la integridad de SQLite y registra las ejecuciones de copia de seguridad en la
  base de datos global.
- Migración de doctor: `migrating`, intencionadamente. Doctor importa archivos JSON
  y JSONL heredados, y almacenes auxiliares retirados, a SQLite; registra las ejecuciones y fuentes de migración,
  y elimina las fuentes migradas correctamente.
- Scripts E2E: `clean` para la cobertura de ejecución. La preparación de Docker MCP escribe filas
  de SQLite. El script de Docker del contexto de ejecución crea JSONL heredado solo dentro de la
  preparación de la migración de doctor y nombra explícitamente la ruta heredada del índice de sesiones.

### Trabajo restante

- [x] Cambiar el nombre de las variables de almacén de las pruebas de ejecución de Cron que aún usen `storePath`, salvo
      que sean entradas heredadas de doctor.
      Archivos: `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`.
      Prueba: `pnpm check:database-first-legacy-stores`; `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`.
- [x] Eliminar o cambiar el nombre de los mocks obsoletos de pruebas de exportación de la época de los archivos.
      Archivo: `src/auto-reply/reply/commands-export-test-mocks.ts`.
      Prueba: `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`.
- [x] Hacer que la preparación del JSONL heredado del contexto de ejecución de Docker sea claramente exclusiva de doctor.
      Archivo: `scripts/e2e/session-runtime-context-docker-client.ts`.
      Prueba: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` muestra únicamente
      `seedBrokenLegacySessionForDoctorMigration`.
- [x] Mantener alineados los tipos generados por Kysely después de cualquier cambio de esquema.
      Archivos: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      Prueba: no hubo cambios de esquema en esta iteración; `pnpm db:kysely:check`;
      `pnpm lint:kysely`.
- [x] Volver a ejecutar las pruebas específicas de los almacenes, comandos y scripts afectados.
      Prueba: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`.
- [x] Antes de declarar `done`, ejecutar la puerta de cambios o una prueba amplia remota.
      Prueba: `pnpm check:changed --timed -- <changed extension paths>` se completó correctamente en
      la ejecución de Hetzner Crabbox `run_3f1cabf6b25c`, después de la configuración temporal de Node 24/pnpm y
      el enrutamiento explícito de rutas para el espacio de trabajo sincronizado sin `.git`.

### No introducir regresiones

- Ningún localizador de transcripciones.
- Ningún archivo de sesión activo.
- Ningún accesorio de prueba JSONL simulado, salvo en las pruebas de migración heredada de doctor.
- Ningún acceso directo a SQLite donde se espere Kysely.
- Ninguna migración nueva de la base de datos de la época de los archivos. El esquema global permanece en la versión `1`.
  El esquema publicado por agente de la versión `1` tiene una única migración acotada de ejecución a la
  versión `2` para identidades estables de fuentes de memoria.

## Supuestos derivados de la lectura del código

No hay decisiones de producto pendientes que bloqueen este plan. La implementación debe
continuar con estos supuestos:

- Usar `node:sqlite` directamente y exigir un entorno de ejecución Node seguro frente al restablecimiento de WAL
  (22.22.3+, 24.15+ o 25.9+) para esta ruta de almacenamiento.
- Mantener exactamente un archivo de configuración normal. No trasladar la configuración, los manifiestos de plugins
  ni los espacios de trabajo de Git a SQLite en esta refactorización.
- No se requieren archivos de compatibilidad en tiempo de ejecución. Los archivos JSON y JSONL heredados son
  únicamente entradas de migración. Los archivos auxiliares de SQLite locales de la rama nunca se publicaron y se
  eliminan en lugar de importarse.
- `openclaw doctor --fix` se encarga de la migración de archivos heredados a la base de datos. El inicio del entorno de ejecución
  solo se encarga de actualizaciones acotadas entre versiones publicadas del esquema de SQLite;
  no debe importar el estado de la época de los archivos.
- La compatibilidad de las credenciales sigue la misma regla: las credenciales del entorno de ejecución residen en
  SQLite. Los archivos antiguos `auth-profiles.json`, los archivos por agente `auth.json` y los archivos compartidos
  `credentials/oauth.json` son entradas de migración de doctor y se eliminan
  después de importarlos.
- El estado generado del catálogo de modelos se almacena en la base de datos. El código del entorno de ejecución no debe escribir
  `agents/<agentId>/agent/models.json`; los archivos `models.json` existentes son entradas heredadas
  de doctor y se eliminan después de importarlos en `agent_model_catalogs`.
- El entorno de ejecución no debe migrar, normalizar ni interconectar localizadores de transcripciones. La identidad de la
  transcripción activa es `{agentId, sessionId}` en SQLite. Las rutas de archivo son
  únicamente entradas heredadas de doctor, y `sqlite-transcript://...` debe desaparecer de
  las superficies del entorno de ejecución, el protocolo, los hooks y los plugins, en lugar de tratarse como un
  identificador de frontera.
- Las lecturas de transcripciones de SQLite en tiempo de ejecución no ejecutan migraciones antiguas de la estructura de entradas JSONL ni
  reescriben transcripciones completas por compatibilidad. La normalización de entradas heredadas permanece en
  utilidades explícitas de doctor/importación. Doctor normaliza los archivos heredados de transcripciones
  JSONL antes de insertar filas en SQLite; las filas actuales del entorno de ejecución
  ya se escriben con el esquema actual de transcripciones. La exportación de trayectorias/sesiones
  lee esas filas tal cual y no debe realizar migraciones heredadas durante la exportación.
- Los auxiliares de análisis/migración de transcripciones JSONL heredadas son exclusivos de doctor. El código de formato
  de transcripciones del entorno de ejecución solo crea el contexto actual de transcripciones de SQLite; doctor
  se encarga de actualizar las entradas JSONL antiguas antes de insertar las filas.
- Se eliminó el antiguo auxiliar de transmisión de transcripciones JSONL gestionado por el entorno de ejecución. El código
  de importación de doctor se encarga de las lecturas explícitas de archivos heredados; el historial de sesiones del entorno de ejecución lee
  filas de SQLite.
- Los enlaces del servidor de aplicaciones de Codex usan el `sessionId` de OpenClaw como clave
  canónica en el espacio de nombres del estado del plugin de Codex. `sessionKey` son metadatos para
  el enrutamiento y la visualización, y no deben sustituir el identificador persistente de sesión ni recuperar
  la identidad basada en archivos de transcripción.
- Los motores de contexto reciben directamente el contrato actual del entorno de ejecución. El registro
  no debe envolver los motores con adaptadores de reintento que eliminen `sessionKey`,
  `transcriptScope` o `prompt`; los motores que no puedan aceptar los parámetros actuales
  centrados en la base de datos deben fallar de forma explícita en lugar de interconectarse mediante adaptadores.
- La salida de la copia de seguridad debe seguir siendo un único archivo comprimido. El contenido de la base de datos debe incluirse
  en ese archivo como instantáneas compactas de SQLite, no como archivos auxiliares WAL activos sin procesar.
- La búsqueda de transcripciones es útil, pero no es necesaria para la primera versión centrada en la base de datos.
  Diseñar el esquema de modo que se pueda añadir FTS más adelante.
- La ejecución de workers debe seguir siendo experimental y permanecer detrás de opciones de configuración mientras se consolida la frontera
  de la base de datos.

## Hallazgos de la revisión del código

La rama actual ya ha superado la etapa de prueba de concepto. La base de datos
compartida existe, `node:sqlite` de Node está conectado mediante un pequeño auxiliar del entorno de ejecución y
los antiguos almacenes ahora escriben en `state/openclaw.sqlite` o en la base de datos
`openclaw-agent.sqlite` correspondiente.

El trabajo restante no consiste en elegir SQLite, sino en mantener limpia la nueva frontera
y eliminar cualquier interfaz orientada a la compatibilidad que todavía se parezca al antiguo
mundo basado en archivos:

- El `storePath` de sesión ya no es una identidad del entorno de ejecución, una estructura de datos de prueba ni
  un campo de la carga útil de estado. Las pruebas del entorno de ejecución y del puente ya no contienen el
  nombre de contrato `storePath`; el código de doctor/migración se encarga de ese vocabulario heredado.
- Las escrituras de sesión ya no pasan por la antigua cola `store-writer.ts`
  en proceso. Las escrituras de parches de SQLite se preparan fuera de la transacción y después usan una breve
  transacción síncrona de validación/aplicación con detección explícita de conflictos.
- El descubrimiento de rutas heredadas todavía tiene usos válidos para la migración, pero el código del entorno de ejecución debe
  dejar de tratar `sessions.json` y los archivos JSONL de transcripciones como posibles destinos de
  escritura.
- Las tablas pertenecientes a agentes residen en bases de datos SQLite por agente. La base de datos global conserva
  las filas del registro/plano de control; la identidad de la transcripción es `{agentId, sessionId}` en
  las filas de transcripciones por agente. El código del entorno de ejecución no debe conservar rutas de archivos de
  transcripciones ni migrar localizadores de transcripciones.
- Doctor ya importa varios archivos heredados. La limpieza consiste en convertirlo en una
  única implementación explícita de migración que doctor invoque, con un informe
  de migración persistente.

No hay más preguntas sobre el producto que bloqueen la implementación.

## Estructura actual del código

La rama ya cuenta con una base SQLite compartida real:

- La versión mínima del entorno de ejecución ahora requiere una compilación de Node segura para el restablecimiento de WAL: 22.22.3+,
  24.15+ o 25.9+. `package.json`, la protección del entorno de ejecución de la CLI, los valores predeterminados del instalador,
  el localizador del entorno de ejecución de macOS, la CI y la documentación pública de instalación están todos en consonancia.
- `src/state/openclaw-state-db.ts` abre `openclaw.sqlite`, configura WAL,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON` y aplica
  el módulo de esquema generado derivado de
  `src/state/openclaw-state-schema.sql`.
- Los tipos de tabla de Kysely y los módulos de esquema del entorno de ejecución se generan a partir de bases de datos
  SQLite desechables creadas desde los archivos `.sql` confirmados; el código del entorno de ejecución ya no
  mantiene cadenas de esquema copiadas y pegadas para bases de datos globales, por agente o de
  captura de proxy.
- Los almacenes del entorno de ejecución derivan los tipos de fila seleccionados e insertados de esas interfaces
  `DB` generadas de Kysely, en lugar de replicar manualmente las estructuras de filas de SQLite. El SQL sin procesar
  sigue limitado a la aplicación de esquemas, pragmas y DDL exclusivo de migraciones.
- El esquema global de SQLite permanece en `user_version = 1`. El esquema por agente
  está en la versión `2`; su función de apertura migra atómicamente la clave de origen de memoria de la versión publicada `1`
  a una identidad entera estable. La importación de archivos a la base de datos
  permanece en el código de doctor.
- La propiedad relacional se aplica donde el límite de propiedad es canónico:
  las filas de migración de origen se eliminan en cascada desde `migration_runs`, el estado de entrega de tareas
  se elimina en cascada desde `task_runs` y las filas de identidad de transcripción se eliminan en cascada desde
  los eventos de transcripción.
- Las tablas compartidas actuales incluyen `agent_databases`,
  `auth_profile_stores`, `auth_profile_state`,
  `plugin_state_entries`, `plugin_blob_entries`, `media_blobs`,
  `skill_uploads`, `capture_sessions`, `capture_events`, `capture_blobs`,
  `sandbox_registry_entries`, `cron_jobs`, `commitments`,
  `delivery_queue_entries`, `model_capability_cache`,
  `workspace_setup_state`, `native_hook_relay_bridges`,
  `current_conversation_bindings`, `plugin_binding_approvals`,
  `tui_last_sessions`, `acp_sessions`, `acp_replay_sessions`,
  `acp_replay_events`, `task_runs`, `task_delivery_state`, `flow_runs`,
  `subagent_runs`, `migration_runs` y `backup_runs`.
- El estado arbitrario propiedad de los plugins no recibe tablas tipadas propiedad del host. Los plugins
  instalados usan `plugin_state_entries` para cargas útiles JSON con versiones y
  `plugin_blob_entries` para bytes, con propiedad de espacio de nombres/clave, limpieza por TTL,
  copias de seguridad y registros de migración de plugins. El estado de orquestación de plugins propiedad del host aún puede
  tener tablas tipadas cuando el host es propietario del contrato de consulta, como
  `plugin_binding_approvals`.
- Las migraciones de plugins son migraciones de datos sobre espacios de nombres propiedad de los plugins, no migraciones del
  esquema del host. Un plugin puede migrar sus propias entradas de estado/blob con versiones
  mediante un proveedor de migración, y el host registra el estado del origen/de la ejecución en el
  registro de migraciones normal. Las instalaciones de plugins nuevos no requieren cambiar
  `openclaw-state-schema.sql`, a menos que el propio host asuma la propiedad de un
  nuevo contrato entre plugins.
- `src/state/openclaw-agent-db.ts` abre
  `agents/<agentId>/agent/openclaw-agent.sqlite`, registra la base de datos en la
  base de datos global y posee las tablas locales del agente de sesión, transcripción, VFS, artefactos, caché
  e índice de memoria. El descubrimiento compartido del entorno de ejecución ahora lee el registro
  `agent_databases` con tipos generados, en lugar de volver a implementar esa consulta en cada
  punto de llamada.
- Las bases de datos globales y por agente registran una fila `schema_meta` con la función de la base de datos,
  la versión del esquema, las marcas de tiempo y el id. del agente para las bases de datos de agentes. La base de datos global
  permanece en `user_version = 1`; las bases de datos por agente usan la versión `2` tras la migración acotada
  de identidad de origen de memoria.
- La identidad de sesión por agente ahora tiene una tabla raíz canónica `sessions` con clave
  `session_id`, con `session_key`, `session_scope`, `account_id`,
  `primary_conversation_id`, marcas de tiempo, campos de visualización, metadatos del modelo,
  id. del arnés y vínculos de elemento principal/generación como columnas consultables. `session_routes`
  es el índice único de ruta activa desde `session_key` hasta la
  `session_id` actual, de modo que una clave de ruta puede trasladarse a una sesión duradera nueva sin
  hacer que las lecturas frecuentes elijan entre filas `sessions.session_key` duplicadas. La antigua
  carga útil `session_entries.entry_json` con formato de compatibilidad depende de la
  raíz duradera `session_id` mediante una clave externa; ya no es la única
  representación de una sesión en el nivel del esquema.
- La identidad de conversaciones externas por agente también es relacional:
  `conversations` almacena la identidad normalizada de proveedor/cuenta/conversación y
  `session_conversations` vincula una sesión de OpenClaw con una o más conversaciones
  externas. Esto cubre las sesiones de MD principales compartidas en las que varios pares pueden
  asignarse intencionadamente a una sesión sin falsear `session_key`. SQLite también
  impone la unicidad de la identidad natural del proveedor para que la misma tupla de
  canal/cuenta/tipo/par/hilo no pueda bifurcarse entre ids. de conversación.
  Los pares directos principales compartidos se vinculan con un rol `participant`, de modo que una
  sesión de OpenClaw puede representar varios pares de MD externos sin degradar
  los pares anteriores a filas relacionadas imprecisas. `sessions.primary_conversation_id` todavía
  apunta al destino de entrega tipado actual. Las columnas cerradas de enrutamiento/estado
  se aplican con restricciones `CHECK` de SQLite en lugar de depender únicamente de
  uniones de TypeScript.
  La proyección de sesiones del entorno de ejecución elimina las réplicas de enrutamiento de compatibilidad de
  `session_entries.entry_json` antes de aplicar las columnas tipadas de sesión/conversación,
  por lo que las cargas útiles JSON obsoletas no pueden reactivar destinos de entrega.
  Asimismo, el enrutamiento de anuncios de subagentes requiere el contexto de entrega tipado de SQLite;
  ya no recurre a los campos de ruta de compatibilidad `SessionEntry`.
  La herencia de entrega explícita `chat.send` del Gateway lee el contexto de entrega tipado de SQLite
  en lugar de los campos de compatibilidad `origin`/`last*`.
  Asimismo, `tools.effective` deriva el contexto de proveedor/cuenta/hilo de las filas tipadas
  de entrega/enrutamiento de SQLite, no de réplicas obsoletas de entrada de sesión `last*`.
  El contexto del prompt de eventos del sistema reconstruye los campos de canal/destino/cuenta/hilo a partir de
  campos de entrega tipados en lugar de réplicas `origin`.
  El asistente compartido `deliveryContextFromSession` y el asignador de sesión a conversación
  ahora ignoran `SessionEntry.origin` por completo; solo los campos de entrega tipados
  y las filas relacionales de conversación pueden crear una identidad de ruta activa.
  La normalización de entradas de sesión del entorno de ejecución elimina `origin` antes de conservar o
  proyectar `entry_json`, y los metadatos entrantes escriben campos tipados de canal/chat
  y filas relacionales de conversación en lugar de crear nuevas réplicas de origen.
- Los eventos de transcripción, las instantáneas de transcripción y los eventos de trayectoria del entorno de ejecución ahora
  hacen referencia a la raíz canónica por agente `sessions` y se eliminan en cascada al eliminar la sesión.
  Las filas de identidad/idempotencia de transcripción siguen eliminándose en cascada desde la
  fila exacta del evento de transcripción.
- Los índices de memory-core ahora usan tablas explícitas de bases de datos de agentes:
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks` y
  `memory_embedding_cache`, con `memory_index_state` para realizar el seguimiento de los cambios de revisión.
  Los índices secundarios opcionales de FTS/vectores se denominan `memory_index_chunks_fts` y
  `memory_index_chunks_vec` en lugar de las tablas genéricas `meta`, `files`, `chunks`,
  `chunks_fts` o `chunks_vec`. Los nombres canónicos conservan la estructura actual
  de filas de ruta/origen y la compatibilidad de incrustaciones serializadas. Estas tablas
  son una caché derivada/de búsqueda, no almacenamiento canónico de transcripciones; pueden
  eliminarse y reconstruirse a partir de los archivos del espacio de trabajo de memoria y los orígenes configurados.
  Al abrir un índice de memoria publicado con nombres genéricos, se migran sus metadatos, orígenes,
  fragmentos y caché de incrustaciones a las tablas canónicas; las tablas derivadas de FTS/vectores
  se reconstruyen con sus nombres canónicos.
- El estado de recuperación de ejecuciones de subagentes ahora reside en filas compartidas tipadas `subagent_runs`
  con claves indexadas de sesión secundaria, solicitante y controladora. El antiguo archivo
  `subagents/runs.json` solo es entrada de migración para doctor.
- Los enlaces de conversación actuales ahora residen en filas compartidas tipadas
  `current_conversation_bindings` con clave de id. de conversación normalizado, con
  columnas de agente/sesión de destino, tipo de conversación, estado, caducidad y metadatos
  almacenados como columnas relacionales en lugar de un registro de enlace opaco duplicado.
  La clave de enlace duradera incluye el tipo de conversación normalizado para que
  las referencias directas/de grupo/de canal no puedan entrar en conflicto, y SQLite rechaza valores no válidos de
  tipo/estado de enlace. El antiguo archivo
  `bindings/current-conversations.json` solo es entrada de migración para doctor.
- La recuperación de la cola de entrega ahora superpone columnas tipadas de la cola para canal, destino,
  cuenta, sesión, reintento, error, envío de plataforma y estado de recuperación sobre el
  JSON de reproducción. `entry_json` conserva las cargas útiles de reproducción, los hooks y la carga útil
  de formato, pero las columnas tipadas tienen autoridad para el enrutamiento/estado activo de la cola.
- Los punteros de restauración de la última sesión de la TUI ahora residen en filas compartidas tipadas
  `tui_last_sessions` con clave del ámbito con hash de conexión/sesión de la TUI.
  El antiguo archivo JSON de la TUI solo es entrada de migración para doctor.
- Las preferencias predeterminadas de TTS ahora residen en filas SQLite de estado compartido del plugin con clave bajo el
  plugin `speech-core`. El antiguo archivo `settings/tts.json` solo es entrada de migración
  para doctor; el entorno de ejecución ya no lee ni escribe archivos JSON de preferencias de TTS, y el
  solucionador de rutas heredado reside en el módulo de migración de doctor.
- Los metadatos de destino de secretos ahora hacen referencia a almacenes, en lugar de fingir que cada
  destino de credenciales es un archivo de configuración. `openclaw.json` sigue siendo el almacén de configuración;
  los destinos de perfiles de autenticación usan filas SQLite tipadas `auth_profile_stores` con
  credenciales estructuradas según el proveedor conservadas como cargas útiles JSON.
- La auditoría de secretos ya no examina los archivos por agente retirados `auth.json`. Doctor se encarga de
  advertir sobre ese archivo heredado, importarlo y eliminarlo.
- Los asistentes de rutas de perfiles de autenticación heredados ahora residen en el código heredado de doctor. Los asistentes de rutas
  de perfiles de autenticación del núcleo exponen la identidad del almacén de autenticación SQLite y las ubicaciones de visualización,
  no las rutas del entorno de ejecución `auth-profiles.json` o `auth-state.json`.
- Los módulos del entorno de ejecución para la recuperación de ejecuciones de subagentes y la caché de capacidades de modelos de OpenRouter
  ahora mantienen los lectores/escritores de instantáneas de SQLite separados de los asistentes de importación de JSON heredado
  exclusivos de doctor. Las capacidades de OpenRouter usan las filas genéricas tipadas
  `model_capability_cache` bajo `provider_id = "openrouter"`, en lugar de
  un único blob de caché opaco o una tabla del host específica del proveedor. La
  `taskName` de ejecución del subagente se almacena en la columna tipada `subagent_runs.task_name`; la
  copia `payload_json` son datos de reproducción/depuración, no el origen de los campos activos de visualización o
  búsqueda.
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` implementa un VFS de SQLite
  sobre la tabla `vfs_entries` de la base de datos del agente. Las lecturas de directorios, las
  exportaciones recursivas, las eliminaciones y los cambios de nombre usan rangos de prefijos indexados `(namespace, path)`
  en lugar de examinar todo un espacio de nombres o depender de la coincidencia de rutas `LIKE`.
- `src/agents/runtime-worker.entry.ts` crea almacenes SQLite por ejecución de VFS, artefactos de herramientas,
  artefactos de ejecución y caché con ámbito para los trabajadores.
- Los marcadores de finalización de la inicialización del espacio de trabajo ahora residen en filas compartidas tipadas
  `workspace_setup_state` con clave de ruta resuelta del espacio de trabajo, en lugar de
  `.openclaw/workspace-state.json`; el entorno de ejecución ya no lee ni reescribe el
  marcador heredado del espacio de trabajo, y las API auxiliares ya no pasan una ruta
  `.openclaw/setup-state` ficticia solo para derivar la identidad de almacenamiento.
- Las aprobaciones de ejecución ahora residen en la fila singleton tipada de SQLite compartida `exec_approvals_config`.
  Doctor importa el archivo heredado `~/.openclaw/exec-approvals.json`;
  las escrituras del entorno de ejecución ya no crean, reescriben ni notifican ese archivo como ubicación de su
  almacén activo. La aplicación complementaria de macOS lee y escribe la misma
  fila de la tabla `state/openclaw.sqlite`; solo conserva el socket de prompts de Unix en disco
  porque se trata de IPC, no de estado duradero del entorno de ejecución.
- Los módulos de identidad del dispositivo, autenticación del dispositivo y entorno de ejecución de arranque ahora mantienen sus lectores/escritores de instantáneas de SQLite separados de los auxiliares de importación de JSON heredado exclusivos de doctor. La identidad del dispositivo utiliza filas tipadas `device_identities` y los tokens de autenticación del dispositivo utilizan filas tipadas `device_auth_tokens`. Las escrituras de autenticación del dispositivo concilian las filas por dispositivo/rol en lugar de truncar la tabla de tokens, y el entorno de ejecución ya no encamina las actualizaciones de un solo token a través del antiguo adaptador de todo el almacén. Las cargas JSON heredadas de la versión 1 solo existen como formatos de importación/exportación de doctor.
- La caché de intercambio de tokens de GitHub Copilot utiliza la tabla compartida de estado de Plugin de SQLite bajo `github-copilot/token-cache/default`. Es un estado de caché propiedad del proveedor, por lo que intencionadamente no añade una tabla al esquema del host.
- La Compaction de GitHub Copilot ya no escribe archivos auxiliares de espacio de trabajo `openclaw-compaction-*.json`. El arnés llama al RPC de Compaction del historial del SDK para la sesión del SDK supervisada, y OpenClaw mantiene el estado duradero de la sesión/transcripción en SQLite en lugar de archivos marcadores de compatibilidad.
- El entorno de ejecución compartido de Swift (`OpenClawKit`) utiliza las mismas filas `state/openclaw.sqlite` para la identidad y la autenticación del dispositivo. Los auxiliares de la aplicación para macOS importan los auxiliares compartidos de SQLite en lugar de poseer una segunda ruta de JSON o SQLite. La presencia de un archivo heredado `identity/device.json` restante bloquea la creación de la identidad hasta que doctor lo importa a SQLite, de acuerdo con la barrera de inicio de TypeScript y Android.
- La identidad del dispositivo de Android utiliza el mismo material de claves compatible con TypeScript almacenado en filas tipadas `state/openclaw.sqlite#table/device_identities`. Nunca lee ni escribe `openclaw/identity/device.json`; la presencia de un archivo heredado restante bloquea el inicio hasta que doctor lo importa a SQLite.
- Los tokens de autenticación del dispositivo almacenados en caché en Android también utilizan filas tipadas `state/openclaw.sqlite#table/device_auth_tokens` y comparten la misma semántica de tokens de la versión 1 que TypeScript y Swift. El entorno de ejecución ya no lee las claves de compatibilidad `SecurePrefs` y `gateway.deviceToken*`; estas pertenecen únicamente a la lógica de migración/doctor.
- El historial de paquetes recientes de notificaciones de Android utiliza filas tipadas `android_notification_recent_packages`. El entorno de ejecución ya no migra ni lee las antiguas claves CSV de SharedPreferences.
- La creación de la identidad del dispositivo falla de forma cerrada cuando existe el archivo heredado `identity/device.json`, cuando la fila de identidad de SQLite no es válida o cuando no se puede abrir el almacén de identidades de SQLite. Doctor importa y elimina primero ese archivo, por lo que el inicio del entorno de ejecución no puede rotar silenciosamente la identidad de emparejamiento antes de la migración.
- La selección de la identidad del dispositivo es una clave de fila de SQLite, no un localizador de archivos JSON. Las pruebas y los auxiliares del Gateway pasan claves de identidad explícitas; solo la migración de doctor y la barrera de inicio con fallo cerrado conocen el nombre de archivo retirado `identity/device.json`.
- La compatibilidad con el restablecimiento de sesiones ahora reside en la migración de configuración de doctor: `session.idleMinutes` se traslada a `session.reset.idleMinutes`, `session.resetByType.dm` se traslada a `session.resetByType.direct`, y la política de restablecimiento del entorno de ejecución solo lee las claves de restablecimiento canónicas.
- La compatibilidad con la configuración heredada ahora reside bajo `src/commands/doctor/`. La validación normal de `readConfigFileSnapshot()` no importa detectores heredados de doctor ni anota problemas heredados; `runDoctorConfigPreflight()` añade esos problemas para que doctor los repare o notifique. El flujo de configuración de doctor importa `src/commands/doctor/legacy-config.ts`, y la reparación de identificadores de perfil OAuth antiguos reside bajo `src/commands/doctor/legacy/oauth-profile-ids.ts`.
- Los comandos distintos de doctor no ejecutan automáticamente la reparación de la configuración heredada. Por ejemplo, `openclaw update --channel` ahora falla ante una configuración heredada no válida y pide al usuario que ejecute doctor, en lugar de importar silenciosamente el código de migración de doctor.
- Las notificaciones push web, APNs, Voice Wake, las comprobaciones de actualizaciones y el estado de la configuración ahora utilizan tablas compartidas tipadas de SQLite para las suscripciones, las claves VAPID, los registros de nodos, las filas de activadores, las filas de enrutamiento, el estado de notificación de actualizaciones y las entradas de estado de la configuración, en lugar de blobs JSON opacos completos. Las escrituras de instantáneas de las notificaciones push web y APNs ahora concilian las suscripciones/los registros por clave primaria en lugar de vaciar sus tablas; el estado de la configuración hace lo mismo por ruta de configuración. Sus módulos del entorno de ejecución mantienen los lectores/escritores de instantáneas de SQLite separados de los auxiliares de importación de JSON heredado exclusivos de doctor.
- La configuración del host del Node ahora utiliza una fila singleton tipada en la base de datos compartida de SQLite; doctor importa el antiguo archivo `node.json` antes del uso normal del entorno de ejecución.
- El emparejamiento de dispositivos/nodos, el emparejamiento de canales, las listas de permitidos de canales y el estado de arranque ahora utilizan filas tipadas de SQLite en lugar de blobs JSON opacos completos. Las aprobaciones de vinculación de plugins y el estado de los trabajos de Cron siguen la misma separación: los módulos del entorno de ejecución exponen operaciones respaldadas por SQLite y auxiliares de instantáneas neutrales; las escrituras de instantáneas de emparejamiento/arranque y de aprobación de vinculaciones de plugins concilian las filas por clave primaria en lugar de truncar las tablas, mientras que doctor importa/elimina los antiguos archivos JSON mediante módulos `src/commands/doctor/legacy/*`.
- Los registros de plugins instalados ahora residen en el índice de plugins instalados de SQLite. La lectura/escritura de la configuración del entorno de ejecución ya no migra ni conserva los antiguos datos de configuración creada `plugins.installs`; doctor importa ese formato de configuración heredado a SQLite antes del uso normal del entorno de ejecución.
- Las instantáneas de recuperación de credenciales de QQBot ahora residen en el estado de Plugin de SQLite bajo `qqbot/credential-backups`. El entorno de ejecución ya no escribe `qqbot/data/credential-backup*.json`; el contrato de doctor de QQBot importa y archiva esos archivos de copia de seguridad heredados desde el directorio de estado activo.
- La planificación de la recarga del Gateway compara las instantáneas del índice de plugins instalados de SQLite bajo un espacio de nombres interno de diferencias `installedPluginIndex.installRecords.*`. Las decisiones de recarga del entorno de ejecución ya no envuelven esas filas en objetos de configuración `plugins.installs` ficticios.
- La actualización de credenciales de cuentas con nombre de Matrix ya no se produce durante las lecturas del entorno de ejecución. Doctor gestiona el antiguo cambio de nombre de `credentials/matrix/credentials.json` de nivel superior cuando se puede resolver una cuenta única/predeterminada de Matrix.
- Los módulos principales del entorno de ejecución de emparejamiento y Cron ya no utilizan generadores de rutas JSON heredadas. El auxiliar obsoleto del SDK para rutas de emparejamiento permanece únicamente como compatibilidad para la migración; la migración de estado de doctor gestiona sus lecturas e importaciones de archivos. Los módulos heredados propiedad de doctor construyen las rutas de origen `pending.json`, `paired.json`, `bootstrap.json` y `cron/jobs.json` únicamente para las pruebas de importación y la migración. La normalización del formato heredado de trabajos de Cron y la importación del historial JSONL residen bajo `src/commands/doctor/cron/`; la finalización del historial heredado de SQLite se ejecuta al abrir la base de datos de estado.
- `src/commands/doctor/legacy/runtime-state.ts` importa archivos de estado JSON heredados, incluida la configuración del host del Node, a SQLite desde doctor. Los nuevos importadores de archivos heredados permanecen bajo `src/commands/doctor/legacy/`.
- `src/commands/doctor/state-migrations.ts` importa las transcripciones heredadas `sessions.json` y `*.jsonl` directamente a SQLite y elimina los orígenes importados correctamente. Ya no prepara las transcripciones heredadas de la raíz mediante `agents/<agentId>/sessions/*.jsonl` ni crea un destino JSONL canónico antes de la importación.
- Las comprobaciones de doctor sobre la integridad del estado ya no examinan directorios de sesiones heredados ni ofrecen eliminar archivos JSONL huérfanos. Los archivos de transcripción heredados son únicamente entradas de migración, y el paso de migración gestiona tanto la importación como la eliminación del origen.
- La importación del registro heredado del entorno aislado reside bajo `src/commands/doctor/legacy/sandbox-registry.ts`; las lecturas y escrituras del registro activo del entorno aislado siguen realizándose exclusivamente en SQLite.
- La reparación de importación/estado de las transcripciones de sesiones heredadas reside bajo `src/commands/doctor/legacy/session-transcript-health.ts`; los módulos de comandos del entorno de ejecución ya no contienen análisis de transcripciones JSONL ni código de reparación de la rama activa.

Aspectos destacados de la consolidación/eliminación completadas:

- El estado del Plugin ahora usa la base de datos compartida `state/openclaw.sqlite`. El antiguo
  importador de archivos auxiliares `plugin-state/state.sqlite` local de la rama se eliminó porque
  ese diseño de SQLite nunca se publicó. Los auxiliares de sondeo/prueba informan de la
  base de datos compartida `databasePath` en lugar de exponer una ruta de SQLite específica del estado del Plugin.
- Las tablas de ejecución de tareas y flujos de tareas ahora residen en la base de datos compartida
  `state/openclaw.sqlite` en lugar de `tasks/runs.sqlite` y
  `tasks/flows/registry.sqlite`; los antiguos importadores de archivos auxiliares se eliminaron por el
  mismo motivo de que el diseño nunca se publicó.
- `src/config/sessions/store.ts` ya no necesita `storePath` para los metadatos
  entrantes, las actualizaciones de rutas ni las lecturas de la fecha de actualización. La persistencia de comandos, la
  limpieza de sesiones de la CLI, la profundidad de los subagentes, las anulaciones de autenticación y la identidad
  de sesión de la transcripción usan las API de filas de agente/sesión. Las escrituras se aplican como parches de filas de SQLite
  con reintentos ante conflictos optimistas.
- La resolución del destino de sesión ahora expone destinos de base de datos por agente, no rutas
  heredadas de `sessions.json`. El Gateway compartido, los metadatos de ACP, la reparación de rutas de doctor y
  `openclaw sessions` enumeran `agent_databases` además de los agentes configurados.
- El enrutamiento de sesiones del Gateway ahora usa `resolveGatewaySessionDatabaseTarget`; el
  destino devuelto incluye `databasePath` y claves candidatas de filas de SQLite en lugar
  de una ruta heredada al archivo del almacén de sesiones.
- Los tipos de ejecución de sesión de canal ahora exponen `{agentId, sessionKey}` para
  las lecturas de la fecha de actualización, los metadatos entrantes y las actualizaciones de la última ruta. El antiguo
  tipo de compatibilidad `saveSessionStore(storePath, store)` ya no existe.
- Las superficies de sesión de la ejecución de Plugins, la API de extensiones y el SDK de Plugins ahora exponen
  auxiliares de filas de sesión respaldados por SQLite en lugar de auxiliares de compatibilidad
  con archivos/almacenes completos de sesiones activas. Las exportaciones de compatibilidad de la biblioteca raíz siguen disponibles
  solo fuera del SDK de Plugins para llamadores internos heredados y de migración. El antiguo
  auxiliar `resolveLegacySessionStorePath` ya no existe; la construcción de rutas heredadas `sessions.json`
  ahora es local para las migraciones y los accesorios de prueba.
- `src/config/sessions/session-entries.sqlite.ts` ahora almacena entradas de sesión
  canónicas en la base de datos por agente y admite parches de lectura/inserción o actualización/eliminación
  a nivel de fila. La inserción o actualización, los parches y la eliminación durante la ejecución ya no buscan variantes de mayúsculas y minúsculas ni
  depuran claves de alias heredadas; doctor se encarga de la canonicalización. El
  auxiliar independiente de importación de JSON ya no existe, y la migración fusiona mediante inserción o actualización las filas más recientes
  en lugar de reemplazar toda la tabla de sesiones. Los auxiliares públicos de lectura/listado/carga
  proyectan metadatos activos de sesión desde filas tipadas `sessions` y `conversations`;
  `entry_json` es una copia de compatibilidad/depuración y puede estar obsoleta o no ser válida
  sin perder la identidad tipada de la sesión ni el contexto de entrega.
- `src/config/sessions/delivery-info.ts` ahora resuelve el contexto de entrega desde las
  filas tipadas por agente `sessions` + `conversations` + `session_conversations`.
  Ya no reconstruye la identidad de entrega durante la ejecución a partir de
  `session_entries.entry_json`; la ausencia de una fila tipada de conversación es un problema de
  migración/reparación de doctor, no una alternativa durante la ejecución.
- Las decisiones de restablecimiento de sesiones almacenadas ahora prefieren los metadatos tipados `sessions.session_scope`,
  `sessions.chat_type` y `sessions.channel`. El análisis de `sessionKey`
  se mantiene solo para sufijos explícitos de hilo/tema en destinos de comandos; la clasificación
  de restablecimiento como grupo o directo ya no procede de la forma de la clave.
- La clasificación de visualización del listado/estado de sesiones ahora usa metadatos tipados de chat y
  el tipo de sesión del Gateway. Ya no considera las subcadenas `:group:` o `:channel:`
  dentro de `session_key` como una indicación duradera de grupo o comunicación directa.
- La selección de la política de respuesta silenciosa ahora usa únicamente el tipo explícito de conversación o los metadatos
  de la superficie. Ya no deduce la política directa/de grupo a partir de
  subcadenas de `session_key`.
- La resolución del modelo de visualización de sesión ahora recibe el identificador del agente desde el destino
  de la base de datos de sesiones de SQLite, en lugar de extraerlo dividiendo `session_key`.
- La hidratación del destino de anuncios entre agentes ahora usa únicamente
  `deliveryContext` tipado de `sessions.list`. Ya no recupera el enrutamiento de canal/cuenta/hilo
  desde `origin` heredado, campos reflejados de `last*` ni la forma de `session_key`.
- El rechazo de destinos de hilo de `sessions_send` ahora lee metadatos tipados de enrutamiento
  de SQLite. Ya no rechaza ni acepta destinos analizando sufijos de hilo
  de la clave de destino.
- La validación de políticas de herramientas con ámbito de grupo ahora lee el enrutamiento tipado de conversaciones
  de SQLite para la sesión actual o iniciada. Ya no confía en la identidad de grupo/canal
  decodificando `sessionKey`; los identificadores de grupo proporcionados por el llamador se descartan cuando
  ninguna fila tipada de sesión los respalda.
- La coincidencia de anulaciones de modelo de canal ahora usa metadatos explícitos de conversación
  de grupo y principal. Ya no decodifica los identificadores de conversaciones principales desde
  `parentSessionKey`.
- La herencia de anulaciones de modelos almacenadas ahora requiere una clave explícita de sesión principal
  procedente del contexto tipado de la sesión. Ya no deriva las anulaciones principales de
  los sufijos `:thread:` o `:topic:` de `sessionKey`.
- El antiguo contenedor de información de hilos de sesión y el analizador de hilos de Plugins cargados ya no existen;
  ningún código de ejecución importa `config/sessions/thread-info`.
- El auxiliar de conversaciones de canal ya no expone puentes de análisis
  de claves completas de sesión. El núcleo sigue normalizando los identificadores sin procesar de conversaciones propiedad del proveedor mediante
  `resolveSessionConversation(...)`, pero no reconstruye datos de enrutamiento
  a partir de `sessionKey`.
- La entrega de finalizaciones, la política de envío y el mantenimiento de tareas ya no derivan el tipo
  de chat de la forma de `session_key`. El antiguo analizador de claves de tipo de chat se eliminó;
  estas rutas requieren metadatos tipados de sesión, contexto tipado de entrega o
  vocabulario explícito de destinos de entrega.
- El listado/estado de sesiones, los diagnósticos, la vinculación de cuentas para aprobaciones, el filtrado de
  Heartbeat de la TUI y los resúmenes de uso ya no extraen de `SessionEntry.origin`
  el enrutamiento de proveedor/cuenta/hilo/visualización. Las únicas lecturas restantes durante la ejecución
  de `origin` corresponden a conceptos ajenos a las sesiones u objetos de entrega del turno actual.
- La búsqueda de conversaciones nativas para solicitudes de aprobación ahora lee filas tipadas de enrutamiento de sesiones
  por agente. Ya no analiza la identidad de conversación de canal/grupo/hilo
  desde `sessionKey`; la ausencia de metadatos tipados es un problema de migración/reparación.
- Las cargas útiles de eventos de cambios de sesión/chat/sesión del Gateway ya no repiten las
  copias de rutas `SessionEntry.origin` o `last*`; los clientes reciben
  `channel`, `chatType` y `deliveryContext` tipados.
- La resolución de entrega de Heartbeat ahora puede recibir directamente el
  `deliveryContext` tipado de SQLite, y la ejecución de Heartbeat pasa la fila de entrega
  de sesión por agente en lugar de depender de copias de compatibilidad `session_entries`
  para el enrutamiento actual.
- La resolución del destino de entrega del agente aislado de Cron también hidrata su ruta
  actual desde la fila tipada de entrega de sesión por agente antes de recurrir a la
  carga útil de la entrada de compatibilidad.
- La resolución del origen de anuncios de subagentes ahora propaga el contexto tipado de entrega de la sesión
  solicitante a través de `loadRequesterSessionEntry` y prefiere esa fila a
  las copias de compatibilidad `last*`/`deliveryContext`.
- Las actualizaciones de metadatos de sesiones entrantes ahora se fusionan primero con la fila tipada
  de entrega por agente; los antiguos campos de entrega `SessionEntry` solo se usan como alternativa
  cuando no existe una fila tipada de conversación.
- La extracción de entrega de reinicio/actualización ahora da prioridad al
  `threadId` tipado de entrega de SQLite sobre los fragmentos de tema/hilo analizados desde `sessionKey`; el análisis
  solo se usa como alternativa para claves heredadas con forma de hilo.
- Los identificadores de canal del contexto del agente de los enlaces ahora prefieren la identidad tipada de conversación de SQLite
  y, después, los metadatos explícitos del mensaje. Ya no analizan fragmentos de proveedor/grupo/canal
  desde `sessionKey`.
- La herencia de rutas externas de `chat.send` del Gateway ahora lee metadatos tipados de enrutamiento de sesiones de SQLite
  en lugar de inferir el ámbito de canal/directo/grupo a partir de
  partes de `sessionKey`. Las sesiones con ámbito de canal solo heredan cuando el canal
  y el tipo de chat de la sesión tipada coinciden con el contexto de entrega almacenado; las sesiones
  principales compartidas mantienen su regla más estricta de CLI/sin metadatos del cliente.
- La activación mediante centinela de reinicio y el enrutamiento de continuaciones ahora leen filas tipadas de
  entrega/enrutamiento de SQLite antes de poner en cola activaciones de Heartbeat o continuaciones
  enrutadas de turnos del agente. Ya no reconstruyen el contexto de entrega desde la
  copia JSON de la entrada de sesión.
- La resolución del contexto de `tools.effective` del Gateway ahora lee filas tipadas de
  entrega/enrutamiento de SQLite para las entradas de proveedor, cuenta, destino, hilo y modo de respuesta.
  Ya no recupera esos campos activos de enrutamiento desde copias de origen
  `session_entries.entry_json` obsoletas.
- El enrutamiento de consultas de voz en tiempo real ahora resuelve la entrega principal/de llamada desde filas tipadas
  de sesión de SQLite por agente. Ya no recurre a copias de compatibilidad
  `SessionEntry.deliveryContext` al elegir la ruta de mensajes del agente
  integrado.
- El relé de Heartbeat de inicio de ACP y el enrutamiento del flujo principal ahora leen la entrega principal
  desde filas tipadas de sesión de SQLite. Ya no reconstruyen el contexto de entrega
  principal desde copias de compatibilidad de entradas de sesión.
- La conservación de la ruta de entrega de sesión ahora sigue los metadatos tipados de chat y las
  columnas de entrega persistentes. Ya no extrae indicios de canal, marcadores de
  comunicación directa/principal ni la forma del hilo de `sessionKey`; las rutas internas de chat web solo
  heredan un destino externo cuando SQLite ya contiene una identidad de entrega
  tipada/persistente para la sesión.
- La extracción genérica de entrega de sesión ahora solo lee la fila tipada exacta
  de entrega de sesión de SQLite. Ya no analiza sufijos de hilo/tema ni recurre
  de una clave con forma de hilo a una clave de sesión base.
- El envío de respuestas, la recuperación mediante centinela de reinicio y el enrutamiento de consultas de voz en tiempo real
  ahora usan filas tipadas exactas de sesión/conversación de SQLite para el enrutamiento de hilos. Ya
  no recuperan identificadores de hilo ni el contexto de entrega de la sesión base analizando
  claves de sesión con forma de hilo.
- La limitación del historial de PI integrado ahora usa la proyección tipada de enrutamiento
  de sesiones de SQLite (`sessions` + `conversations` principal) para el proveedor, el tipo de chat
  y la identidad del interlocutor. Ya no analiza la forma del proveedor, mensaje directo, grupo o hilo
  a partir de `sessionKey`.
- La inferencia de entrega de herramientas de Cron ahora usa únicamente una entrega explícita o el contexto tipado
  de entrega actual. Ya no decodifica destinos de canal, interlocutor, cuenta o hilo
  desde `agentSessionKey`.
- Las filas de sesión durante la ejecución ya no contienen el antiguo alias de ruta `lastProvider`.
  Los auxiliares y las pruebas usan los campos tipados `lastChannel` y `deliveryContext`;
  la migración de doctor es el único lugar que debe traducir alias de rutas antiguos
  o copias persistentes de `origin`.
- Los eventos de transcripción, las filas de VFS y las filas de artefactos de herramientas ahora se escriben en la base de datos
  por agente. La tabla global no publicada de asignación de archivos de transcripción ya no existe; doctor
  registra en su lugar las rutas de origen heredadas en filas de migración duraderas.
- La búsqueda de transcripciones durante la ejecución ya no examina desplazamientos de bytes de JSONL ni sondea archivos
  de transcripción heredados. Las rutas de chat/multimedia/historial del Gateway leen las filas de transcripción desde
  SQLite; el JSONL de sesión ahora solo es una entrada heredada de doctor, no un estado
  de ejecución ni un formato de exportación.
- Las relaciones principales y de ramificación de las transcripciones usan metadatos estructurados
  `parentTranscriptScope: {agentId, sessionId}` en los encabezados de transcripción de SQLite,
  no cadenas localizadoras `agent-db:...transcript_events...` similares a rutas.
- El contrato del gestor de transcripciones ya no expone constructores persistentes
  implícitos `create(cwd)` o `continueRecent(cwd)`. Los gestores de transcripciones
  persistentes se abren con un ámbito explícito `{agentId, sessionId}`; solo
  los gestores en memoria permanecen sin ámbito para las pruebas y las transformaciones puras de transcripciones.
- Las API del almacén de transcripciones en tiempo de ejecución resuelven el ámbito de SQLite, no rutas del sistema de archivos. El
  antiguo asistente `resolve...ForPath` y las opciones de escritura `transcriptPath` sin usar
  se han eliminado de los invocadores en tiempo de ejecución.
- La resolución de sesiones en tiempo de ejecución ahora usa `{agentId, sessionId}` y no debe derivar
  cadenas `sqlite-transcript://<agent>/<session>` para límites externos.
  Las rutas JSONL absolutas heredadas son únicamente entradas de migración para doctor.
- Los registros de puente directo del retransmisor de hooks nativos ahora residen en filas compartidas
  `native_hook_relay_bridges` tipadas y vinculadas por id de retransmisor. El tiempo de ejecución ya no escribe un
  registro JSON `/tmp` ni registros genéricos opacos para esos registros de puente
  de corta duración.
- `runEmbeddedPiAgent(...)` ya no tiene un parámetro localizador de transcripción.
  Los descriptores de trabajadores preparados también omiten los localizadores de transcripción. El estado de
  sesión en tiempo de ejecución y las ejecuciones de seguimiento en cola llevan `{agentId, sessionId}` en lugar de
  identificadores de transcripción derivados.
- La Compaction integrada ahora obtiene el ámbito de SQLite de `agentId` y `sessionId`.
  Los hooks de Compaction, las llamadas al motor de contexto, la delegación de la CLI y las respuestas del protocolo
  no deben recibir identificadores `sqlite-transcript://...` derivados. El código de exportación/depuración
  puede materializar artefactos de usuario explícitos a partir de las filas, pero no proporciona una
  ruta genérica de exportación JSONL de sesiones ni vuelve a introducir nombres de archivo en la identidad
  del tiempo de ejecución.
- `/export-session` lee filas de transcripción desde SQLite y escribe únicamente la vista
  HTML independiente solicitada. El visor integrado ya no reconstruye ni
  descarga el JSONL de la sesión a partir de esas filas.
- La delegación al motor de contexto ya no analiza un localizador de transcripción para recuperar
  la identidad del agente. El contexto preparado del tiempo de ejecución lleva el valor `agentId`
  resuelto al adaptador de Compaction integrado.
- La reescritura de transcripciones y el truncamiento en vivo de resultados de herramientas ahora leen y conservan
  el estado de la transcripción mediante `{agentId, sessionId}` y no derivan localizadores
  temporales para las cargas útiles de eventos de actualización de transcripciones.
- La superficie de asistentes del estado de transcripción ya no tiene variantes basadas en localizadores
  `readTranscriptState`, `replaceTranscriptStateEvents` ni
  `persistTranscriptStateMutation`. Los invocadores en tiempo de ejecución deben usar las
  API `{agentId, sessionId}`. La importación de doctor lee archivos heredados mediante una ruta de archivo
  explícita y escribe filas de SQLite; no migra cadenas de localizadores.
- El contrato del gestor de sesiones en tiempo de ejecución ya no expone `open(locator)`,
  `forkFrom(locator)` ni `setTranscriptLocator(...)`. Los gestores de sesiones
  persistentes se abren únicamente mediante `{agentId, sessionId}`; los asistentes para listar/bifurcar residen en
  las API de sesiones y puntos de control orientadas a filas, en lugar de en la fachada del gestor
  de transcripciones.
- Las API del lector de transcripciones del Gateway priorizan el ámbito. Reciben
  `{agentId, sessionId}` y no aceptan un localizador de transcripción posicional que
  pudiera convertirse accidentalmente en identidad del tiempo de ejecución. Se ha eliminado el análisis de localizadores
  de transcripciones activas; las rutas de origen heredadas solo las lee el código de importación de doctor.
- Los eventos de actualización de transcripciones también priorizan el ámbito. `emitSessionTranscriptUpdate`
  ya no acepta una cadena de localizador sin procesar, y los oyentes enrutan mediante
  `{agentId, sessionId}` sin analizar un identificador.
- La difusión de mensajes de sesión del Gateway resuelve las claves de sesión a partir del ámbito
  de agente/sesión, no de un localizador de transcripción. Se ha eliminado el antiguo
  solucionador/caché de claves de sesión basado en localizadores de transcripción.
- Los filtros SSE del historial de sesiones del Gateway filtran las actualizaciones en vivo por ámbito de agente/sesión. Ya no
  canonizan candidatos a localizadores de transcripción, rutas reales ni identidades de transcripción
  con forma de archivo para decidir si un flujo debe recibir una actualización.
- Los hooks del ciclo de vida de las sesiones ya no derivan ni exponen localizadores de transcripción en
  `session_end`. Los consumidores de hooks reciben `sessionId`, `sessionKey`, ids de la
  siguiente sesión y el contexto del agente; los archivos de transcripción no forman parte del contrato
  del ciclo de vida.
- Los hooks de restablecimiento tampoco derivan ni exponen localizadores de transcripción. La
  carga útil `before_reset` lleva los mensajes recuperados de SQLite junto con el motivo del
  restablecimiento, mientras que la identidad de la sesión permanece en el contexto del hook.
- El restablecimiento del arnés del agente ya no acepta un localizador de transcripción. El envío del restablecimiento
  queda delimitado por `sessionId`/`sessionKey` más el motivo.
- Los tipos de sesión de las extensiones del agente ya no exponen `transcriptLocator`; las extensiones
  deben usar el contexto de sesión y las API del tiempo de ejecución en lugar de recurrir a una
  identidad de transcripción con forma de archivo.
- Los hooks de Compaction de los plugins ya no exponen localizadores de transcripción. El contexto del hook
  ya lleva la identidad de la sesión, y las lecturas de transcripciones deben realizarse mediante API
  compatibles con el ámbito de SQLite en lugar de identificadores con forma de archivo.
- Los hooks `before_agent_finalize` ya no exponen `transcriptPath`, incluidas
  las cargas útiles del retransmisor de hooks nativos. Los hooks de finalización usan únicamente el contexto de sesión.
- Las respuestas de restablecimiento del Gateway ya no sintetizan un localizador de transcripción en la
  entrada devuelta. El restablecimiento crea filas de transcripción de SQLite, devuelve la entrada
  de sesión limpia y deja el acceso a las transcripciones en manos de lectores compatibles con el ámbito.
- Los resultados de las ejecuciones integradas y de Compaction ya no muestran localizadores de transcripción para
  la contabilidad de sesiones. La Compaction automática solo actualiza el `sessionId` activo,
  los contadores de Compaction y los metadatos de tokens.
- Los resultados de intentos integrados ya no devuelven `transcriptLocatorUsed`, y
  los resultados `compact()` del motor de contexto ya no devuelven localizadores de transcripción.
  Los bucles de reintento del tiempo de ejecución solo aceptan un `sessionId` sucesor.
- Los resultados de anexión de transcripciones del espejo de entrega ya no devuelven localizadores de
  transcripción. Los invocadores reciben el `messageId` anexado; las señales de actualización de transcripciones usan
  el ámbito de SQLite.
- Los asistentes de bifurcación de sesiones principales devuelven únicamente el `sessionId` bifurcado. La preparación
  de subagentes pasa el ámbito del agente/sesión secundarios a los motores.
- Los parámetros del ejecutor de la CLI y la reinicialización del historial ya no aceptan localizadores de transcripción.
  Las lecturas del historial de la CLI resuelven el ámbito de la transcripción de SQLite a partir de `{agentId,
sessionId}` y del contexto de la clave de sesión.
- Los elementos de prueba de la CLI y del ejecutor integrado ahora inicializan y leen filas de transcripción
  de SQLite por id de sesión, en lugar de simular que las sesiones activas son archivos `*.jsonl` o
  pasar una cadena `sqlite-transcript://...` mediante los parámetros del tiempo de ejecución.
- Los eventos de protección de resultados de herramientas de sesión se emiten desde el ámbito de sesión conocido incluso cuando un
  gestor en memoria no tiene un localizador derivado. Sus pruebas ya no simulan archivos
  de transcripción `/tmp/*.jsonl` activos.
- Los asistentes de BTW y de puntos de control de Compaction ahora leen y bifurcan filas de transcripción por
  ámbito de SQLite. Los metadatos de los puntos de control ahora almacenan únicamente ids de sesión e ids de
  hoja/entrada; los localizadores derivados ya no se escriben en las cargas útiles de los puntos de control.
- La búsqueda de claves de transcripción del Gateway usa el ámbito de transcripción de SQLite en los límites
  del protocolo y ya no obtiene rutas reales ni estadísticas de nombres de archivos de transcripción.
- La rotación automática de transcripciones de Compaction escribe las filas de transcripción sucesoras
  directamente mediante el almacén de transcripciones de SQLite. Las filas de sesión conservan únicamente la
  identidad de la sesión sucesora, no una ruta JSONL duradera ni un localizador persistente.
- La Compaction integrada del motor de contexto usa asistentes de rotación de transcripciones
  identificados por SQLite. Las pruebas de rotación ya no construyen rutas sucesoras JSONL ni
  modelan las sesiones activas como archivos.
- La retención gestionada de imágenes salientes crea las claves de su caché de mensajes de transcripción a partir de
  las estadísticas de transcripciones de SQLite, en lugar de llamadas de estadísticas del sistema de archivos.
- Se han eliminado los bloqueos de sesiones en tiempo de ejecución y el carril independiente heredado
  `.jsonl.lock` de doctor.
- El barrel del tiempo de ejecución de Microsoft Teams y el SDK público de plugins ya no reexportan
  el antiguo asistente de bloqueo de archivos; las rutas de estado duradero de los plugins están respaldadas por SQLite.
- Se han eliminado la depuración de sesiones por antigüedad/cantidad y la limpieza explícita de sesiones.
  Doctor se encarga de la importación heredada; las sesiones obsoletas se restablecen o eliminan explícitamente.
- Las comprobaciones de integridad de doctor ya no cuentan un archivo JSONL heredado como una transcripción
  activa válida para una fila de sesión de SQLite. El estado de las transcripciones activas depende únicamente de SQLite;
  los archivos JSONL heredados se notifican como entradas de migración/limpieza de elementos huérfanos.
- Doctor ya no trata `agents/<agent>/sessions/` como estado obligatorio del tiempo de
  ejecución. Solo examina ese directorio cuando ya existe, como entrada de importación
  heredada o de limpieza de elementos huérfanos.
- Las rutas `sessions.resolve` del Gateway y de parche/restablecimiento/Compaction de sesiones, la creación de
  subagentes, la interrupción rápida, los metadatos de ACP, las sesiones aisladas por Heartbeat y el parcheo de la TUI
  ya no migran ni depuran claves de sesión heredadas como efecto secundario del
  trabajo normal del tiempo de ejecución.
- La resolución de sesiones de comandos de la CLI ahora devuelve el `agentId` propietario en lugar de un
  `storePath`, y ya no copia filas heredadas de la sesión principal durante la resolución normal
  de `--to` o `--session-id`. La canonización de las filas principales heredadas
  corresponde únicamente a doctor.
- La resolución de profundidad de subagentes en tiempo de ejecución ya no lee `sessions.json` ni almacenes
  de sesiones JSON5. Lee `session_entries` de SQLite por id de agente, y los metadatos
  heredados de profundidad/sesión solo pueden entrar mediante la ruta de importación de doctor.
- Las sustituciones de sesión de perfiles de autenticación se conservan mediante upserts directos de filas
  `{agentId, sessionKey}`, en lugar de cargar de forma diferida un tiempo de ejecución de almacén de sesiones con forma de archivo.
- El control detallado de respuestas automáticas y los asistentes de actualización de sesiones ahora leen/actualizan mediante upsert filas
  de sesión de SQLite por identidad de sesión y ya no necesitan una ruta de almacén heredada
  antes de modificar el estado persistente de las filas.
- Los asistentes de metadatos de sesiones de ejecución de comandos ahora usan nombres y rutas de módulos
  orientados a entradas; se ha eliminado la antigua superficie de asistentes de comandos `session-store`.
- La inicialización de encabezados de arranque y el refuerzo de los límites de Compaction manual ahora modifican
  directamente las filas de transcripción de SQLite. Los invocadores en tiempo de ejecución pasan la identidad de sesión, no
  rutas `.jsonl` escribibles.
- La reproducción silenciosa de la rotación de sesiones copia los turnos recientes de usuario/asistente mediante
  `{agentId, sessionId}` desde filas de transcripción de SQLite. Ya no acepta
  localizadores de transcripción de origen o destino.
- Las filas nuevas de sesiones en tiempo de ejecución ya no almacenan localizadores de transcripción. Los invocadores usan
  `{agentId, sessionId}` directamente; los comandos de exportación/depuración pueden elegir nombres de archivo de
  salida cuando materializan las filas.
- Al iniciar una nueva sesión de transcripción persistente, ahora siempre se abren filas de SQLite por
  ámbito. El gestor de sesiones ya no reutiliza una ruta o un localizador de transcripción
  anterior de la era de los archivos como identidad de la nueva sesión.
- Las sesiones de transcripción persistentes usan la API explícita
  `openTranscriptSessionManagerForSession({agentId, sessionId})`. Las antiguas fachadas estáticas
  `SessionManager.create/openForSession/list/forkFromSession` se han eliminado para que las pruebas y el código del tiempo de ejecución
  no puedan recrear accidentalmente el descubrimiento de sesiones de la era de los archivos.
- El tiempo de ejecución de los plugins ya no expone `api.runtime.agent.session.resolveTranscriptLocatorPath`;
  el código de los plugins usa asistentes de filas de SQLite y valores de ámbito.
- La superficie pública del SDK `session-store-runtime` ahora solo exporta asistentes de filas
  de sesiones y filas de transcripciones. Los asistentes específicos de esquema/ruta/transacción de SQLite
  residen en `sqlite-runtime`; los asistentes sin procesar de apertura/cierre/restablecimiento siguen siendo locales
  únicamente para las pruebas propias.
- Los clasificadores heredados de nombres de archivo de trayectorias/puntos de control `.jsonl` ahora residen en el
  módulo de archivos de sesión heredados de doctor. La validación de sesiones del núcleo ya no importa
  asistentes de artefactos de archivo para decidir los ids normales de sesiones de SQLite.
- Las ejecuciones de subagentes bloqueantes de Active Memory usan filas de transcripción de SQLite en lugar de
  crear archivos `session.jsonl` temporales o persistentes en el estado del plugin. Se ha
  eliminado la antigua opción `transcriptDir`.
- La generación puntual de slugs y las ejecuciones del planificador Crestodian usan filas de transcripción de SQLite
  en lugar de crear archivos `session.jsonl` temporales.
- `llm-task` las ejecuciones auxiliares y la extracción de compromisos ocultos también usan filas de transcripción de SQLite, por lo que estas sesiones auxiliares exclusivas del modelo ya no crean archivos temporales de transcripción JSON/JSONL.
- `TranscriptSessionManager` ahora es únicamente un ámbito de transcripción SQLite abierto.
  El código en tiempo de ejecución lo abre con `openTranscriptSessionManagerForSession({agentId,
sessionId})`; los flujos de creación, ramificación, continuación, listado y bifurcación residen en sus
  auxiliares de filas SQLite propietarios, en lugar de fachadas estáticas del gestor.
  El código de Doctor/importación/depuración gestiona archivos de origen heredados explícitos fuera del
  gestor de sesiones en tiempo de ejecución.
- Se eliminaron los métodos obsoletos de fachada `SessionManager.newSession()` y
  `SessionManager.createBranchedSession()`. Las sesiones nuevas
  y los descendientes de transcripciones se crean mediante su flujo de trabajo SQLite propietario,
  en lugar de transformar un gestor ya abierto en una sesión persistente diferente.
- Las decisiones de bifurcación de transcripciones principales y la creación de bifurcaciones ya no aceptan
  `storePath` ni `sessionsDir`; usan el ámbito de transcripción
  SQLite `{agentId, sessionId}` en lugar de metadatos conservados de rutas del sistema de archivos.
- Memory-host ya no exporta auxiliares sin efecto para clasificar transcripciones
  por directorio de sesión; el filtrado de transcripciones ahora se deriva de los metadatos de filas
  SQLite durante la construcción de entradas.
- Las pruebas de exportación de sesiones de Memory-host y QMD usan ámbitos de transcripción SQLite. Las rutas
  `agents/<agentId>/sessions/*.jsonl` antiguas solo siguen cubiertas cuando una prueba
  demuestra intencionadamente la compatibilidad de Doctor/importación/exportación.
- La inspección de sesiones sin procesar de QA-lab ahora usa `sessions.list` a través del Gateway
  en lugar de leer `agents/qa/sessions/sessions.json`; los comentarios de MSteams
  se anexan directamente a las transcripciones SQLite sin inventar una ruta JSONL.
- Los turnos compartidos de canales entrantes ahora contienen `{agentId, sessionKey}` en lugar de un
  `storePath` heredado. Las rutas de registro de LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal,
  iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo,
  Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon,
  Twitch y QQBot ahora leen los metadatos de actualización y registran
  las filas de sesiones entrantes mediante la identidad SQLite.
- Se elimina la persistencia del localizador de transcripciones de las filas de sesiones activas.
  `resolveSessionTranscriptTarget` devuelve `agentId`, `sessionId` y metadatos
  opcionales del tema; Doctor es el único código que importa nombres de archivos de transcripciones
  heredadas.
- Los encabezados de transcripciones en tiempo de ejecución comienzan en la versión SQLite `1`. Las actualizaciones de formas JSONL V1/V2/V3
  antiguas solo residen en la importación de Doctor y normalizan los encabezados importados a
  la versión actual de transcripción SQLite antes de almacenar las filas.
- La protección de prioridad de base de datos ahora prohíbe `SessionManager.listAll` y
  `SessionManager.forkFromSession`; los flujos de listado de sesiones y bifurcación/restauración
  deben permanecer en las API SQLite de filas/ámbitos.
- La protección también prohíbe los nombres de auxiliares heredados para analizar JSONL de transcripciones y reparar ramas activas
  fuera del código de Doctor/importación, por lo que el tiempo de ejecución no puede desarrollar una segunda ruta heredada
  de migración de transcripciones.
- Las ejecuciones de PI integrado rechazan los identificadores de transcripción entrantes. Usan la identidad SQLite
  `{agentId, sessionId}` antes de iniciar el proceso de trabajo y de nuevo antes de que el
  intento acceda al estado de la transcripción. Una entrada `/tmp/*.jsonl` obsoleta no puede seleccionar un
  destino de escritura en tiempo de ejecución.
- Los registros de seguimiento de caché, carga útil de Anthropic, flujo sin procesar y cronología de diagnósticos
  ahora se escriben en filas SQLite `diagnostic_events` tipadas. Los paquetes de estabilidad del Gateway
  ahora se escriben en filas SQLite `diagnostic_stability_bundles` tipadas. Se eliminan las antiguas
  rutas de sobrescritura JSONL `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`,
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE` y
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`, y
  la captura normal de estabilidad ya no escribe archivos `logs/stability/*.json`.
- La persistencia de Cron ahora concilia filas SQLite `cron_jobs` en lugar de
  eliminar y volver a insertar toda la tabla de trabajos en cada guardado. Las escrituras posteriores de destinos de Plugin
  actualizan directamente las filas de Cron coincidentes y mantienen el estado de Cron en tiempo de ejecución en
  la misma transacción de la base de datos de estado.
- Los invocadores de Cron en tiempo de ejecución ahora usan una clave estable del almacén Cron de SQLite. Las rutas
  `cron.store` heredadas son únicamente entradas de importación de Doctor; las rutas de Gateway de producción, mantenimiento de tareas,
  estado, historial de ejecuciones y escritura posterior de destinos de Telegram usan
  `resolveCronStoreKey` y ya no normalizan la clave como ruta. El estado de Cron ahora
  informa de `storeKey` en lugar del antiguo campo con forma de archivo `storePath`.
- La carga y la planificación de Cron en tiempo de ejecución ya no normalizan formas de trabajos persistentes
  heredadas, como `jobId`, `schedule.cron`, valores numéricos de `atMs`, booleanos como cadenas o
  la ausencia de `sessionTarget`. La importación heredada de Doctor se encarga de esas reparaciones antes de insertar
  las filas en SQLite.
- La generación de ACP ya no resuelve ni conserva rutas de archivos JSONL de transcripciones. La configuración
  de generación y vinculación de hilos conserva directamente la fila de sesión SQLite y mantiene el
  identificador de sesión como identidad de transcripción conservada.
- Las API de metadatos de sesiones ACP ahora leen/listan/actualizan o insertan filas SQLite por `agentId` y
  ya no exponen `storePath` como parte del contrato de entrada de sesión ACP.
- La contabilización del uso de sesiones y la agregación de uso del Gateway ahora resuelven las transcripciones
  solo mediante `{agentId, sessionId}`. La caché de costes/uso y los resúmenes de sesiones
  descubiertas ya no sintetizan ni devuelven cadenas de localizadores de transcripciones.
- La anexión de chats del Gateway, la persistencia parcial al cancelar, `/sessions.send` y
  las escrituras de medios de webchat en transcripciones se anexan directamente mediante el ámbito de transcripción
  SQLite. El auxiliar de inyección de transcripciones del Gateway ya no acepta un
  parámetro `transcriptLocator`.
- El descubrimiento de transcripciones SQLite ahora solo enumera ámbitos y estadísticas de transcripciones:
  `{agentId, sessionId, updatedAt, eventCount}`. Se eliminaron
  el auxiliar de compatibilidad inactivo `listSqliteSessionTranscriptLocators` y el campo
  `locator` por fila.
- El tiempo de ejecución de reparación de transcripciones ahora solo expone
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})`. Se elimina el antiguo
  auxiliar de reparación basado en localizadores; el código de Doctor/depuración lee rutas explícitas
  de archivos de origen y nunca migra cadenas de localizadores.
- El tiempo de ejecución del registro de reproducción de ACP ahora almacena filas de reproducción por sesión en la base de datos
  de estado SQLite compartida en lugar de `acp/event-ledger.json`; Doctor importa y
  elimina el archivo heredado.
- Los auxiliares de lectura de transcripciones del Gateway ahora residen en
  `src/gateway/session-transcript-readers.ts` en lugar del antiguo nombre de módulo
  `session-utils.fs`. La comprobación del historial de reintentos alternativos recibe un nombre basado en
  el contenido de transcripciones SQLite, en lugar de la antigua superficie de auxiliares de archivos.
- Los auxiliares de chat inyectado y Compaction del Gateway ahora transmiten el ámbito de transcripción SQLite
  mediante API auxiliares internas en lugar de denominar a los valores rutas de transcripciones o
  archivos de origen.
- La detección de continuación de arranque ahora comprueba las filas de transcripciones SQLite mediante
  `hasCompletedBootstrapTranscriptTurn`; ya no expone un nombre de auxiliar
  con forma de archivo.
- Las pruebas del ejecutor integrado ahora usan la identidad de transcripción SQLite, y abrir un nuevo
  gestor de transcripciones siempre requiere un `sessionId` explícito.
- Los auxiliares de indexación de memoria ahora usan terminología de transcripciones SQLite de principio a fin:
  el host exporta `listSessionTranscriptScopesForAgent` y
  `sessionTranscriptKeyForScope`, la sincronización dirigida pone en cola `sessionTranscripts`,
  los resultados públicos de búsqueda de sesiones exponen rutas opacas `transcript:<agent>:<session>`,
  y la clave interna de origen de la base de datos es `session:<session>` bajo
  `source_kind='sessions'` en lugar de una ruta de archivo ficticia.
- El auxiliar genérico de deduplicación persistente del SDK de Plugin ya no expone opciones con forma de archivo.
  Los invocadores proporcionan claves de ámbito SQLite y las filas duraderas de deduplicación residen en
  el estado compartido del Plugin.
- Los tokens SSO de Microsoft Teams se trasladaron de archivos JSON bloqueados al estado SQLite del Plugin.
  Doctor importa `msteams-sso-tokens.json`, reconstruye las claves canónicas de tokens SSO
  a partir de las cargas útiles y elimina el archivo de origen. Los tokens OAuth delegados permanecen
  en su límite privado existente de archivos de credenciales.
- El estado de la caché de sincronización de Matrix se trasladó de `bot-storage.json` al estado SQLite del Plugin.
  Doctor importa cargas útiles heredadas de sincronización, sin procesar o encapsuladas, y elimina el
  archivo de origen. Los clientes activos de Matrix y QA Matrix proporcionan un directorio raíz del almacén
  de sincronización SQLite, no una ruta ficticia `sync-store.json` ni `bot-storage.json`.
- El estado de migración criptográfica heredada de Matrix se trasladó de
  `legacy-crypto-migration.json` al estado SQLite del Plugin. Doctor importa el
  archivo de estado antiguo; las instantáneas IndexedDB del SDK de Matrix se trasladaron de
  `crypto-idb-snapshot.json` a blobs SQLite del Plugin. Las claves de recuperación y
  las credenciales de Matrix son filas del estado SQLite del Plugin; sus antiguos archivos JSON son únicamente
  entradas de migración de Doctor.
- Los registros de actividad de Memory Wiki ahora usan el estado SQLite del Plugin en lugar de
  `.openclaw-wiki/log.jsonl`. El proveedor de migración de Memory Wiki importa los
  registros JSONL antiguos; el Markdown de la wiki y el contenido del almacén del usuario siguen respaldados
  por archivos como contenido del espacio de trabajo.
- Memory Wiki ya no crea `.openclaw-wiki/state.json` ni el directorio sin uso
  `.openclaw-wiki/locks`. El proveedor de migración elimina esos archivos retirados
  de metadatos del Plugin si un almacén antiguo aún los contiene.
- Las entradas de auditoría de Crestodian ahora usan el estado SQLite central del Plugin en lugar de
  `audit/crestodian.jsonl`. Doctor importa el registro de auditoría JSONL heredado y
  lo elimina tras una importación correcta.
- Las entradas de auditoría de escritura/observación de configuración ahora usan el estado SQLite central del Plugin en lugar
  de `logs/config-audit.jsonl`. Doctor importa el registro de auditoría JSONL heredado y
  lo elimina tras una importación correcta.
- La aplicación complementaria de macOS ya no escribe archivos auxiliares locales de la aplicación `logs/config-audit.jsonl` ni
  `logs/config-health.json` al editar `openclaw.json`. El archivo de configuración
  sigue respaldado por archivos, las instantáneas de recuperación permanecen junto al archivo de configuración
  y el estado duradero de auditoría/salud de la configuración pertenece al almacén SQLite del Gateway.
- Las aprobaciones pendientes de rescate de Crestodian ahora usan el estado SQLite central del Plugin en lugar
  de `crestodian/rescue-pending/*.json`. Doctor importa los archivos heredados de aprobaciones pendientes
  y los elimina tras una importación correcta.
- El estado temporal de activación de Phone Control ahora usa el estado SQLite del Plugin en lugar de
  `plugins/phone-control/armed.json`. Doctor importa el archivo heredado de estado activado
  en el espacio de nombres `phone-control/arm-state` y elimina el archivo.
- Doctor ya no repara transcripciones JSONL en el mismo lugar ni crea archivos JSONL
  de copia de seguridad. Importa la rama activa en SQLite y elimina el origen heredado.
- La búsqueda de transcripciones del enlace de memoria de sesión usa lecturas SQLite exclusivas del ámbito
  `{agentId, sessionId}`. Su auxiliar ya no acepta ni deriva localizadores de transcripciones,
  lecturas de archivos heredados ni opciones de reescritura de archivos.
- Las vinculaciones de conversaciones del servidor de aplicaciones de Codex ahora identifican el estado SQLite del Plugin mediante
  la clave de sesión de OpenClaw o un ámbito `{agentId, sessionId}` explícito. No deben
  conservar vinculaciones alternativas basadas en rutas de transcripciones.
- Las lecturas del historial reflejado del servidor de aplicaciones de Codex usan únicamente el ámbito de transcripción SQLite;
  no deben recuperar la identidad a partir de rutas de archivos de transcripciones.
- Las rutas de ordenación de roles y restablecimiento de Compaction ya no desvinculan archivos antiguos de transcripciones;
  el restablecimiento solo rota la fila de sesión SQLite y la identidad de transcripción.
- Las respuestas de restablecimiento y puntos de control del Gateway devuelven filas de sesiones limpias junto con los identificadores
  de sesión. Ya no sintetizan localizadores de transcripciones SQLite para los clientes.
- Dreaming de memory-core ya no depura filas de sesiones comprobando la ausencia de
  archivos JSONL. La limpieza de subagentes se realiza mediante la API de sesiones en tiempo de ejecución en lugar de
  comprobaciones de existencia en el sistema de archivos. Sus pruebas de ingesta de transcripciones insertan filas SQLite
  directamente en lugar de crear accesorios `agents/<id>/sessions` o marcadores de posición
  de localizadores.
- La indexación de transcripciones de memoria puede exponer `transcript:<agentId>:<sessionId>` como una
  ruta virtual de resultado de búsqueda para auxiliares de citas/lectura. El origen duradero del índice es
  relacional (`source_kind='sessions'`, `source_key='session:<sessionId>'`,
  `session_id=<sessionId>`), por lo que el valor no es un localizador de transcripciones en tiempo de ejecución,
  no es una ruta del sistema de archivos y nunca debe devolverse a las API de tiempo de ejecución de sesiones.
- El estado de memoria de doctor del Gateway lee los recuentos de recuperación a corto plazo y señales de fase
  desde filas de estado del Plugin en SQLite en lugar de `memory/.dreams/*.json`; la salida de la CLI y
  de doctor ahora identifica ese almacenamiento como un almacén SQLite, no como una ruta.
- El tiempo de ejecución de memory-core, el estado de la CLI, los métodos de doctor del Gateway y las
  fachadas del SDK de Plugin ya no auditan ni archivan archivos `.dreams/session-corpus`
  heredados. Esos archivos son únicamente entradas de migración; doctor los importa en SQLite y
  elimina el origen tras la verificación. Las filas de evidencia de ingesta de sesiones activas
  ahora usan la ruta virtual de SQLite `memory/session-ingestion/<day>.txt`; el tiempo de ejecución
  nunca escribe ni deriva estado de `.dreams/session-corpus`.
- Los artefactos públicos de memory-core exponen los eventos del host SQLite como el artefacto JSON
  virtual `memory/events/memory-host-events.json`; ya no reutilizan la
  ruta de origen heredada `.dreams/events.jsonl`.
- Los registros de contenedores/navegadores del entorno aislado ahora usan la tabla SQLite compartida
  `sandbox_registry_entries` con columnas tipadas de sesión, imagen, marca de tiempo,
  backend/configuración y puerto del navegador. Doctor importa los archivos de registro JSON
  monolíticos y fragmentados heredados y elimina los orígenes importados correctamente. Las lecturas del tiempo de ejecución usan
  las columnas tipadas de las filas como fuente de verdad; `entry_json` es solo una copia
  para reproducción/depuración.
- Los compromisos ahora usan una tabla compartida tipada `commitments` en lugar de un
  blob JSON de todo el almacén. Los guardados de instantáneas realizan una inserción o actualización por id. de compromiso y eliminan solo
  las filas ausentes, en lugar de vaciar y volver a insertar la tabla. El tiempo de ejecución carga
  los compromisos desde columnas tipadas de ámbito, ventana de entrega, estado, intento y texto;
  `record_json` es solo una copia para reproducción/depuración. Doctor importa el archivo heredado
  `commitments.json` y lo elimina después de una importación correcta.
- Las definiciones de trabajos Cron, el estado de las programaciones y el historial de ejecuciones ya no tienen
  lectores ni escritores JSON en tiempo de ejecución. El tiempo de ejecución usa filas `cron_jobs` con columnas tipadas de programación,
  carga útil, entrega, alerta de fallo, sesión, estado y estado de ejecución, además del
  detalle `task_runs` propiedad de Cron para diagnósticos, entrega, sesión/ejecución, modelo
  y totales de tokens. `job_json` es solo una copia para reproducción/depuración; `state_json` conserva
  diagnósticos anidados de tiempo de ejecución que aún no tienen campos de consulta frecuente, mientras que el tiempo de ejecución
  rehidrata los campos de estado frecuentes desde columnas tipadas. Doctor importa
  los archivos heredados `jobs.json`, `jobs-state.json` y `runs/*.jsonl` y elimina
  los orígenes importados. Las escrituras de retorno de destinos de Plugin actualizan las filas `cron_jobs`
  coincidentes en lugar de cargar y reemplazar todo el almacén de Cron.
- El inicio del Gateway ignora los marcadores heredados `notify: true` en la proyección
  de tiempo de ejecución. Doctor los convierte en entrega explícita de SQLite cuando
  `cron.webhook` es válido, elimina los marcadores inertes cuando no está establecido y los conserva
  con una advertencia cuando el webhook configurado no es válido.
- Las colas de entrega saliente y de sesiones ahora almacenan el estado de la cola, el tipo de entrada,
  la clave de sesión, el canal, el destino, el id. de cuenta, el número de reintentos, el último intento/error,
  el estado de recuperación y los marcadores de envío de la plataforma como columnas tipadas en la tabla compartida
  `delivery_queue_entries`. La recuperación en tiempo de ejecución lee esos campos frecuentes desde
  las columnas tipadas, y las mutaciones de reintento/recuperación actualizan esas columnas directamente
  sin reescribir el JSON de reproducción. La carga útil JSON completa permanece solo como
  blob de reproducción/depuración para cuerpos de mensajes y otros datos de reproducción de acceso poco frecuente.
- Los registros administrados de imágenes salientes ahora usan filas compartidas tipadas
  `managed_outgoing_image_records`, mientras los bytes de medios siguen almacenados en
  `media_blobs`. El registro JSON permanece solo como copia para reproducción/depuración.
- Las preferencias del selector de modelos de Discord, los hashes de despliegue de comandos y las vinculaciones de hilos
  ahora usan el estado compartido del Plugin en SQLite. Sus planes de importación JSON heredados residen en la
  superficie de migración de configuración/doctor del Plugin de Discord, no en el código de migración central.
- Los detectores de importación heredada de Plugin usan módulos designados para doctor, como
  `doctor-legacy-state.ts` o `doctor-state-imports.ts`; los módulos normales de tiempo de ejecución
  del canal no deben importar detectores de JSON heredado.
- Los cursores de puesta al día y los marcadores de desduplicación entrante de BlueBubbles ahora usan el estado compartido
  del Plugin en SQLite. Sus planes de importación JSON heredados residen en la superficie de migración
  de configuración/doctor del Plugin de BlueBubbles, no en el código de migración central.
- Los desplazamientos de actualizaciones, las filas de caché de adhesivos, las filas de caché de mensajes enviados,
  las filas de caché de nombres de temas y las vinculaciones de hilos de Telegram ahora usan el estado compartido del
  Plugin en SQLite. Sus planes de importación JSON heredados residen en la superficie de migración
  de configuración/doctor del Plugin de Telegram, no en el código de migración central.
- Los cursores de puesta al día, las asignaciones de id. cortos de respuesta y las filas de desduplicación de eco enviado
  de iMessage ahora usan el estado compartido del Plugin en SQLite. Los antiguos archivos `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` y `imessage/sent-echoes.jsonl` son
  únicamente entradas de doctor.
- Las filas de desduplicación de mensajes de Feishu ahora usan la desduplicación reclamable del núcleo
  (espacios de nombres `feishu.dedup.*` en el estado compartido del Plugin en SQLite) en lugar de
  archivos `feishu/dedup/*.json` o el almacén manual retirado `dedup.*`, sin
  importación heredada porque la caché de protección contra reproducciones se reconstruye tras la actualización.
- Las conversaciones, encuestas, búferes de cargas pendientes y aprendizajes de comentarios de
  Microsoft Teams ahora usan tablas compartidas de estado/blob del Plugin en SQLite. La ruta de cargas pendientes
  usa `plugin_blob_entries` para que los búferes de medios se almacenen como BLOB de SQLite
  en lugar de JSON base64. Los nombres de los auxiliares de tiempo de ejecución ahora usan terminología de SQLite/estado
  en lugar de terminología de almacén de archivos `*-fs`, y el antiguo adaptador `storePath` ya no forma parte
  de estos almacenes. Su plan de importación JSON heredado reside en la superficie de migración
  de configuración/doctor del Plugin de Microsoft Teams.
- Los medios salientes alojados de Zalo ahora usan `plugin_blob_entries` compartido de SQLite
  en lugar de archivos auxiliares temporales JSON/bin `openclaw-zalo-outbound-media`.
- El HTML y los metadatos del visor de diferencias ahora usan `plugin_blob_entries` compartido de SQLite
  en lugar de archivos temporales `meta.json`/`viewer.html`. Las salidas PNG/PDF renderizadas siguen siendo
  materializaciones temporales porque la entrega del canal aún necesita una ruta de archivo.
- Los documentos administrados de Canvas ahora usan `plugin_blob_entries` compartido de SQLite en lugar
  de un directorio predeterminado `state/canvas/documents`. El host de Canvas sirve esos
  blobs directamente; solo se crean archivos locales para contenido explícito del operador `host.root`
  o para una materialización temporal cuando un lector de medios posterior
  requiere una ruta.
- Las decisiones de auditoría de File Transfer ahora usan `plugin_state_entries` compartido de SQLite
  en lugar del registro ilimitado de tiempo de ejecución `audit/file-transfer.jsonl`. Doctor
  importa el archivo de auditoría JSONL heredado al estado del Plugin y elimina el origen
  tras una importación limpia.
- Los arrendamientos de procesos ACPX y la identidad de instancia del Gateway ahora usan el estado compartido del Plugin
  en SQLite. Doctor importa el archivo heredado `gateway-instance-id` al estado del Plugin
  y elimina el origen.
- Los scripts contenedores generados por ACPX y el directorio raíz aislado de Codex son materializaciones
  temporales bajo la raíz temporal de OpenClaw, no estado duradero de OpenClaw. Los
  registros duraderos del tiempo de ejecución de ACPX son las filas SQLite de arrendamiento e instancia del Gateway;
  la antigua superficie de configuración `stateDir` de ACPX se elimina porque ya no se escribe estado de tiempo de ejecución
  allí.
- Los archivos adjuntos multimedia del Gateway ahora usan la tabla compartida de SQLite `media_blobs` como
  almacén canónico de bytes. Las rutas locales devueltas a las superficies de compatibilidad
  del canal y el entorno aislado son materializaciones temporales de la fila de la base de datos, no el
  almacén duradero de medios. Las listas de permitidos de medios en tiempo de ejecución ya no incluyen las raíces heredadas
  `$OPENCLAW_STATE_DIR/media` ni `media` del directorio de configuración; esos directorios son
  únicamente orígenes de importación de doctor.
- El completado del shell ya no escribe archivos de caché
  `$OPENCLAW_STATE_DIR/completions/*`. Las rutas de prueba rápida de instalación, doctor, actualización y lanzamiento usan
  la salida de completado generada o la carga desde el perfil en lugar de archivos duraderos de caché
  de completado.
- El área de preparación de cargas de Skills del Gateway ahora usa filas compartidas `skill_uploads`. Los
  metadatos de carga, las claves de idempotencia y los bytes del archivo comprimido residen en SQLite; el instalador
  solo recibe una ruta temporal materializada del archivo comprimido mientras se ejecuta una
  instalación.
- Los archivos adjuntos en línea de subagentes ya no se materializan en
  `.openclaw/attachments/*` del espacio de trabajo. La ruta de creación prepara entradas semilla del VFS de SQLite,
  las ejecuciones en línea incorporan esas entradas en el espacio de nombres temporal de tiempo de ejecución por agente,
  y las herramientas respaldadas por disco superponen ese espacio temporal de SQLite para las rutas de archivos adjuntos. Las
  antiguas columnas del registro de directorios de archivos adjuntos de ejecuciones de subagentes y los enlaces de limpieza ya no existen.
- La hidratación de imágenes de la CLI ya no mantiene archivos de caché estables
  `openclaw-cli-images`. Los backends externos de la CLI siguen recibiendo rutas de archivo, pero esas rutas son
  materializaciones temporales por ejecución con limpieza.
- Los diagnósticos de seguimiento de caché, los diagnósticos de cargas útiles de Anthropic, los diagnósticos de flujos
  sin procesar del modelo, los eventos de la cronología de diagnósticos y los paquetes de estabilidad del Gateway ahora
  escriben filas de SQLite en lugar de archivos `logs/*.jsonl` o
  `logs/stability/*.json`.
  Se han eliminado las opciones y variables de entorno de anulación de rutas en tiempo de ejecución; los comandos
  de exportación/depuración pueden materializar archivos explícitamente desde las filas de la base de datos.
- La aplicación complementaria de macOS ya no tiene un escritor rotativo de `diagnostics.jsonl`. Los registros de la
  aplicación se envían al registro unificado y los diagnósticos duraderos del Gateway permanecen respaldados por SQLite.
- La lista de registros del guardián de puertos de macOS ahora usa filas compartidas tipadas de SQLite
  `macos_port_guardian_records` en lugar de un archivo JSON de Application Support
  o un blob singleton opaco.
- Los bloqueos singleton del Gateway ahora usan filas compartidas tipadas de SQLite `state_leases` bajo
  el ámbito `gateway_locks` en lugar de archivos de bloqueo del directorio temporal. La documentación de
  solución de problemas de Fly y OAuth ahora apunta al bloqueo de actualización de autenticación/arrendamiento de SQLite en lugar
  de a la limpieza obsoleta de bloqueos de archivo.
- El estado del centinela de reinicio del Gateway ahora usa filas compartidas tipadas de SQLite
  `gateway_restart_sentinel` en lugar de `restart-sentinel.json`; el tiempo de ejecución
  lee el tipo, el estado, el enrutamiento, el mensaje, la continuación y las estadísticas del centinela desde
  columnas tipadas. `payload_json` es solo una copia para reproducción/depuración. El código de tiempo de ejecución borra
  directamente la fila de SQLite y ya no contiene infraestructura de limpieza de archivos.
- La intención de reinicio y el estado de transferencia al supervisor del Gateway ahora usan filas compartidas
  tipadas de SQLite `gateway_restart_intent` y `gateway_restart_handoff` en lugar de los archivos auxiliares
  `gateway-restart-intent.json` y
  `gateway-supervisor-restart-handoff.json`.
- La coordinación singleton del Gateway ahora usa filas tipadas `state_leases` bajo
  `gateway_locks` en lugar de escribir archivos `gateway.<hash>.lock`. La fila de arrendamiento
  contiene el propietario del bloqueo, el vencimiento, el Heartbeat y la carga útil de depuración; SQLite controla el
  límite atómico de adquisición/liberación. La opción retirada de directorio de bloqueos de archivo
  ya no existe; las pruebas usan directamente la identidad de la fila de SQLite.
- Se eliminó el antiguo auxiliar sin referencias de informes de uso de Cron que examinaba archivos
  `cron/runs/*.jsonl`. Los informes del historial de ejecuciones de Cron leen filas `task_runs` propiedad de Cron.
- La recuperación tras reinicios de la sesión principal ahora descubre agentes candidatos mediante el
  registro SQLite `agent_databases` en lugar de examinar directorios `agents/*/sessions`.
- La recuperación tras corrupción de sesiones de Gemini ahora elimina solo la fila de sesión de SQLite;
  ya no necesita una condición heredada `storePath` ni intenta desvincular una ruta
  JSONL de transcripción derivada.
- El manejo de anulaciones de rutas ahora trata los valores literales de entorno `undefined`/`null`
  como no establecidos, lo que evita bases de datos `undefined/state/*.sqlite` accidentales en la raíz del repositorio
  durante pruebas o transferencias del shell.
- Las huellas digitales del estado de la configuración ahora usan filas compartidas tipadas de SQLite `config_health_entries`
  en lugar de `logs/config-health.json`, manteniendo el archivo de configuración normal como
  el único documento de configuración sin credenciales. La aplicación complementaria de macOS conserva solo
  el estado de salud local del proceso y no vuelve a crear el antiguo archivo auxiliar JSON.
- El entorno de ejecución de perfiles de autenticación ya no importa ni escribe archivos JSON de credenciales. El
  almacén de credenciales canónico es SQLite; `auth-profiles.json`, el
  `auth.json` por agente y el `credentials/oauth.json` compartido son entradas de migración de doctor
  que se eliminan después de la importación.
- Las pruebas de guardado y estado de perfiles de autenticación ahora verifican directamente las tablas de autenticación tipadas de SQLite
  y solo usan nombres de archivo de perfiles de autenticación heredados como entradas de migración de doctor.
- `openclaw secrets apply` depura únicamente el archivo de configuración, el archivo de entorno y el almacén
  de perfiles de autenticación de SQLite. Ya no incluye lógica de compatibilidad que modifica
  el `auth.json` por agente retirado; doctor se encarga de importar y eliminar ese archivo.
- Los planes de migración de secretos de Hermes importan y aplican perfiles de claves de API directamente
  en el almacén de perfiles de autenticación de SQLite. Ya no escriben ni verifican
  `auth-profiles.json` como destino intermedio.
- La documentación de autenticación destinada a los usuarios ahora describe
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` en lugar de
  indicarles que inspeccionen o copien `auth-profiles.json`; los nombres JSON heredados de OAuth/autenticación
  solo permanecen documentados como entradas de importación de doctor.
- Los auxiliares de rutas de estado del núcleo ya no exponen el archivo
  `credentials/oauth.json` retirado. El nombre de archivo heredado es local a la ruta de importación de autenticación de doctor.
- La documentación de instalación, seguridad, incorporación, autenticación de modelos y SecretRef ahora describe
  filas de perfiles de autenticación de SQLite y copias de seguridad/migraciones de todo el estado en lugar de
  archivos JSON de perfiles de autenticación por agente.
- La detección de modelos de PI ahora pasa las credenciales canónicas al almacenamiento de autenticación
  `pi-coding-agent` en memoria. Ya no crea, depura ni escribe
  `auth.json` por agente durante la detección.
- La configuración de activación y enrutamiento de Voice Wake ahora usa tablas SQLite compartidas tipadas
  en lugar de `settings/voicewake.json`, `settings/voicewake-routing.json` o
  filas genéricas opacas; doctor importa los archivos JSON heredados y los elimina después de una
  migración correcta.
- El estado de comprobación de actualizaciones ahora usa una fila compartida tipada `update_check_state` en lugar de
  `update-check.json` o un blob genérico opaco; doctor importa
  el archivo JSON heredado y lo elimina después de una migración correcta.
- El estado de mantenimiento de la configuración ahora usa filas compartidas tipadas `config_health_entries` en lugar
  de `logs/config-health.json` o un blob genérico opaco; doctor
  importa el archivo JSON heredado y lo elimina después de una migración correcta.
- Las aprobaciones de vinculaciones de conversaciones de plugins ahora usan filas tipadas
  `plugin_binding_approvals` en lugar de estado SQLite compartido opaco o
  `plugin-binding-approvals.json`; el archivo heredado es una entrada de migración de doctor.
- Las vinculaciones genéricas de conversaciones actuales ahora almacenan filas tipadas
  `current_conversation_bindings` en lugar de reescribir
  `bindings/current-conversations.json`; doctor importa el archivo JSON heredado y
  lo elimina después de una migración correcta.
- Los registros de sincronización de fuentes importadas de Memory Wiki ahora almacenan una fila de estado de plugin de SQLite
  por clave de bóveda/fuente en lugar de reescribir `.openclaw-wiki/source-sync.json`;
  el proveedor de migración importa y elimina el registro JSON heredado.
- Los registros de ejecuciones de importación de ChatGPT de Memory Wiki ahora almacenan una fila de estado de plugin de SQLite
  por identificador de bóveda/ejecución en lugar de escribir `.openclaw-wiki/import-runs/*.json`.
  Las instantáneas de reversión permanecen como archivos explícitos de la bóveda hasta que el archivado
  de instantáneas de ejecuciones de importación se traslade al almacenamiento de blobs.
- Los resúmenes compilados de Memory Wiki ahora almacenan filas de blobs de plugin de SQLite en lugar de
  escribir `.openclaw-wiki/cache/agent-digest.json` y
  `.openclaw-wiki/cache/claims.jsonl`. El proveedor de migración importa los archivos de caché
  antiguos y elimina el directorio de caché cuando queda vacío.
- El seguimiento de instalaciones de Skills de ClawHub ahora almacena una fila de estado de plugin de SQLite por
  espacio de trabajo/Skill en lugar de escribir o leer los archivos auxiliares `.clawhub/lock.json` y
  `.clawhub/origin.json` durante la ejecución. El código de ejecución usa objetos de estado
  de instalaciones rastreadas en lugar de abstracciones de archivo de bloqueo/origen con forma de archivo. Doctor
  importa los archivos auxiliares heredados de los espacios de trabajo de agentes configurados y los elimina
  después de una importación limpia.
- El índice de plugins instalados ahora lee y escribe la fila singleton compartida tipada
  `installed_plugin_index` de SQLite en lugar de `plugins/installs.json`; el
  archivo JSON heredado es únicamente una entrada de migración de doctor y se elimina después de la importación.
- El auxiliar de la ruta heredada `plugins/installs.json` ahora reside en el código heredado
  de doctor. Los módulos del índice de plugins en tiempo de ejecución solo exponen opciones de persistencia
  respaldadas por SQLite, no una ruta de archivo JSON.
- El indicador de reinicio del Gateway, la intención de reinicio y el estado de transferencia al supervisor ahora usan
  filas SQLite compartidas tipadas (`gateway_restart_sentinel`,
  `gateway_restart_intent` y `gateway_restart_handoff`) en lugar de blobs genéricos
  opacos. El código de reinicio en tiempo de ejecución no tiene ningún contrato de indicador/intención/transferencia
  con forma de archivo.
- La caché de sincronización de Matrix, los metadatos de almacenamiento, las vinculaciones de hilos, los marcadores de desduplicación
  de entrada, el estado de espera de verificación de inicio, las instantáneas criptográficas de IndexedDB del SDK,
  las credenciales y las claves de recuperación ahora usan tablas compartidas de estado/blobs de plugins
  de SQLite. Las estructuras de rutas en tiempo de ejecución ya no exponen una ruta de metadatos `storage-meta.json`;
  ese nombre de archivo es únicamente una entrada de migración heredada. Su plan de importación de JSON heredado
  reside en la superficie de migración de configuración/doctor del plugin de Matrix. Los marcadores de
  desduplicación de entrada usan la desduplicación reclamable del núcleo (espacios de nombres `matrix.inbound-dedupe.*`
  en la base de datos de estado compartido); la migración de estado de doctor de Matrix importa
  una sola vez las filas `inbound-dedupe` por raíz retiradas y `inbound-dedupe.json`,
  y después el entorno de ejecución solo lee el almacén de desduplicación reclamable.
- El inicio de Matrix ya no examina, informa ni completa el estado de archivos heredados
  de Matrix. La detección de archivos de Matrix, la creación de instantáneas criptográficas heredadas, el estado
  de migración de restauración de claves de salas, la importación y la eliminación de las fuentes son responsabilidad exclusiva de doctor.
- Se eliminaron los barrels de migración del entorno de ejecución de Matrix. Los auxiliares de detección
  y modificación de estado/criptografía heredados son importados directamente por doctor de Matrix en lugar de formar
  parte de la superficie de la API en tiempo de ejecución.
- Los marcadores de reutilización de instantáneas de migración de Matrix ahora residen en el estado de plugin de SQLite
  en lugar de `matrix/migration-snapshot.json`; doctor aún puede reutilizar el mismo
  archivo verificado anterior a la migración sin escribir un archivo de estado auxiliar.
- Los cursores del bus de Nostr y el estado de publicación de perfiles ahora usan el estado compartido de plugins
  de SQLite. Su plan de importación de JSON heredado reside en la superficie de migración
  de configuración/doctor del plugin de Nostr.
- Los conmutadores de sesión de Active Memory ahora usan el estado compartido de plugins de SQLite en lugar de
  `session-toggles.json`; volver a activar la memoria elimina la fila en lugar de
  reescribir un objeto JSON.
- Las propuestas y los contadores de revisión de Skill Workshop ahora usan el estado compartido de plugins de SQLite
  en lugar de almacenes `skill-workshop/<workspace>.json` por espacio de trabajo. Cada
  propuesta es una fila independiente bajo `skill-workshop/proposals`, y el contador de
  revisiones es una fila independiente bajo `skill-workshop/reviews`.
- Las ejecuciones del subagente revisor de Skill Workshop ahora usan el solucionador de transcripciones
  de sesiones del entorno de ejecución en lugar de crear rutas de sesión auxiliares `skill-workshop/<sessionId>.json`.
- Los arrendamientos de procesos de ACPX ahora usan el estado compartido de plugins de SQLite bajo
  `acpx/process-leases` en lugar de un registro de archivo completo `process-leases.json`.
  Cada arrendamiento se almacena como su propia fila, lo que preserva la eliminación de procesos obsoletos
  durante el inicio sin una ruta de reescritura de JSON en tiempo de ejecución.
- Los scripts contenedores de ACPX y el directorio principal aislado de Codex se generan en la
  raíz temporal de OpenClaw. Se vuelven a crear según sea necesario y no son entradas de copia de seguridad
  ni de migración.
- La persistencia del registro de ejecuciones de subagentes usa filas compartidas tipadas `subagent_runs`. La
  antigua ruta `subagents/runs.json` ahora es únicamente una entrada de migración de doctor, y
  los nombres de los auxiliares del entorno de ejecución ya no describen la capa de estado como respaldada por disco.
  Las pruebas del entorno de ejecución ya no crean accesorios `runs.json` no válidos o vacíos para demostrar
  el comportamiento del registro; inicializan y leen directamente filas de SQLite.
- La copia de seguridad prepara el directorio de estado antes de archivarlo, copia los archivos que no son de base de datos,
  crea instantáneas de las bases de datos con `VACUUM INTO`, omite los archivos auxiliares WAL/SHM activos, registra
  los metadatos de las instantáneas en el manifiesto del archivo y registra
  las ejecuciones de copia de seguridad completadas en SQLite junto con el manifiesto del archivo. `openclaw backup
create` valida de forma predeterminada el archivo escrito; `--no-verify` es la
  ruta rápida explícita.
- `openclaw backup restore` valida el archivo antes de la extracción, reutiliza el
  manifiesto normalizado del verificador y restaura los recursos verificados del manifiesto en sus
  rutas de origen registradas. Requiere `--yes` para realizar escrituras y admite `--dry-run`
  para un plan de restauración.
- Se eliminó el antiguo filtro de rutas volátiles de las copias de seguridad. La copia de seguridad ya no necesita una
  lista de omisión de tar en vivo para archivos JSON/JSONL heredados de sesiones o Cron porque las instantáneas de SQLite
  se preparan antes de crear el archivo.
- La preparación del espacio de trabajo durante la configuración básica y la incorporación ya no crea
  directorios `agents/<agentId>/sessions/`. Solo crea la configuración/el espacio de trabajo;
  las filas de sesiones de SQLite y las filas de transcripciones se crean bajo demanda en la
  base de datos por agente.
- La reparación de permisos de seguridad ahora se dirige a las bases de datos SQLite globales y por agente,
  además de los archivos auxiliares WAL/SHM, en lugar de `sessions.json` y los archivos JSONL
  de transcripciones.
- Los nombres del registro del entorno de ejecución del entorno aislado ahora describen directamente los tipos de registro de SQLite
  en lugar de conservar la terminología heredada de registros JSON en el almacén activo.
- `openclaw reset --scope config+creds+sessions` elimina las bases de datos
  `openclaw-agent.sqlite` por agente junto con los archivos auxiliares WAL/SHM, no solo los directorios
  `sessions/` heredados.
- Los auxiliares de sesiones agregadas del Gateway ahora usan nombres orientados a entradas:
  `loadCombinedSessionEntriesForGateway` devuelve `{ databasePath, entries }`.
  La antigua nomenclatura de almacén combinado se ha eliminado de los llamadores del entorno de ejecución.
- La inicialización del canal MCP de Docker ahora escribe la fila de sesión principal y los eventos
  de transcripción en la base de datos SQLite por agente en lugar de crear
  `sessions.json` y una transcripción JSONL.
- El hook de memoria de sesiones incluido ahora resuelve el contexto de la sesión anterior desde
  SQLite mediante `{agentId, sessionId}`. Ya no examina, almacena ni sintetiza
  rutas de transcripciones ni directorios `workspace/sessions`.
- El hook de registro de comandos incluido ahora escribe filas de auditoría de comandos en la tabla compartida
  `command_log_entries` de SQLite en lugar de añadirlas a
  `logs/commands.log`.
- Las listas de permitidos para el emparejamiento de canales ahora solo exponen auxiliares de lectura/escritura respaldados por SQLite
  en tiempo de ejecución. El solucionador de rutas obsoleto del SDK de plugins se mantiene por compatibilidad
  con la migración; los lectores de archivos solo residen en el código de migración de estado de doctor.
- `migration_runs` registra las ejecuciones de migración de estado heredado con estado,
  marcas de tiempo e informes JSON.
- `migration_sources` registra cada fuente de archivo heredado importada con hash, tamaño,
  número de registros, tabla de destino, identificador de ejecución, estado y estado de eliminación de la fuente.
- `backup_runs` registra las rutas de los archivos de copia de seguridad, el estado y los manifiestos JSON.
- El esquema global no conserva una tabla de registro `agents` sin usar. La detección
  de bases de datos de agentes es el registro `agent_databases` canónico hasta que el entorno de ejecución
  tenga un propietario real de los registros de agentes.
- La configuración generada del catálogo de modelos se almacena en filas globales tipadas
  `agent_model_catalogs` de SQLite, indexadas por directorio de agente. Los llamadores del entorno de ejecución usan
  `ensureOpenClawModelCatalog`; no existe una API de compatibilidad `models.json` en
  el código del entorno de ejecución. La implementación escribe en SQLite y el registro de PI integrado se
  hidrata desde esa carga útil almacenada sin crear un archivo `models.json`.
- Se eliminaron la exportación Markdown de transcripciones de sesiones de QMD y la configuración `memory.qmd.sessions`.
  No existe ninguna recopilación de transcripciones de QMD, ninguna ruta del entorno de ejecución `qmd/sessions*`
  ni ningún puente de memoria de sesiones respaldado por archivos.
- El entorno de ejecución de memory-core importa los auxiliares de indexación de transcripciones de SQLite desde
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts`, no desde la
  subruta del SDK de QMD. La subruta de QMD conserva una reexportación de compatibilidad únicamente para
  llamadores externos hasta que una limpieza importante del SDK permita eliminarlo.
- El propio `index.sqlite` de QMD ahora es una materialización temporal en tiempo de ejecución respaldada por la
  tabla principal `plugin_blob_entries` de SQLite. El tiempo de ejecución ya no crea un archivo auxiliar
  `~/.openclaw/agents/<agentId>/qmd` duradero.
- El Plugin opcional `memory-lancedb` ya no crea
  `~/.openclaw/memory/lancedb` como un almacén implícito administrado por OpenClaw. Es un
  backend externo de LanceDB y permanece deshabilitado hasta que el operador configura un
  `dbPath` explícito.
- `check:database-first-legacy-stores` rechaza el nuevo código fuente de tiempo de ejecución que combina
  nombres de almacenes heredados con API de sistema de archivos orientadas a escritura. También rechaza el código fuente de tiempo de ejecución
  que vuelve a introducir los marcadores retirados del puente de transcripciones
  `transcriptLocator` o `sqlite-transcript://...`. El código de migración, doctor, importación
  y exportación explícita ajena a sesiones sigue estando permitido. Los nombres de contratos heredados más amplios,
  como `sessionFile`, `storePath` y las antiguas fachadas de la era de archivos `SessionManager`,
  todavía tienen responsables actuales y requieren un trabajo independiente de protección de migraciones
  antes de poder convertirse en una comprobación previa obligatoria. La protección ahora también abarca
  los almacenes de tiempo de ejecución `cache/*.json`, los archivos auxiliares genéricos
  `thread-bindings.json`, el estado de Cron y el registro de ejecuciones en JSON, el JSON de estado de la configuración,
  los archivos auxiliares de reinicio y bloqueo, la configuración de Voice Wake, las aprobaciones de vinculación de plugins,
  el JSON del índice de plugins instalados, el JSONL de auditoría de File Transfer, los registros de actividad de
  Memory Wiki, el antiguo registro de texto `command-logger` incluido y las opciones de diagnóstico JSONL
  de flujos sin procesar de pi-mono. También prohíbe los antiguos nombres de módulos heredados de doctor en el nivel raíz para que
  el código de compatibilidad permanezca en `src/commands/doctor/`. Los controladores de depuración de Android
  también usan logcat o salida en memoria en lugar de preparar archivos de caché `camera_debug.log` o
  `debug_logs.txt`.

## Forma del esquema de destino

Mantenga los esquemas explícitos. El estado de ejecución propiedad del host utiliza tablas tipadas. El estado
opaco propiedad de los plugins utiliza `plugin_state_entries` / `plugin_blob_entries`; no existe una
tabla `kv` genérica del host.

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
memory_index_sources(id, path, source, hash, mtime, size)
memory_index_chunks(id, path, source, start_line, end_line, hash, model, text, embedding, updated_at)
memory_embedding_cache(provider, model, provider_key, hash, embedding, dims, updated_at)
memory_index_state(id, revision)
cache_entries(scope, key, value_json, blob, expires_at, updated_at)
```

`memory_index_sources.id` es la clave primaria entera estable; `(path, source)` sigue siendo única.

En el futuro, la búsqueda puede añadir tablas FTS sin cambiar las tablas canónicas de eventos:

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

Los valores grandes deben utilizar columnas `blob`, no codificación como cadenas JSON. Mantenga
`value_json` para datos estructurados pequeños que deban seguir siendo inspeccionables con herramientas
SQLite sencillas.

`agent_databases` es el registro canónico para esta rama. No añada una
tabla `agents` hasta que exista un propietario real de los registros de agentes; la configuración de los agentes permanece en
`openclaw.json`.

## Forma de la migración de Doctor

Doctor debe llamar a un único paso de migración explícito que permita generar informes y sea seguro
volver a ejecutar:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` invoca la implementación de la migración de estado después de
la comprobación previa ordinaria de la configuración y crea una copia de seguridad verificada antes de la importación. El inicio
del entorno de ejecución y `openclaw migrate` no deben importar archivos de estado heredados de OpenClaw.

Propiedades de la migración:

- Una pasada de migración detecta todas las fuentes de archivos heredados y genera un plan
  antes de modificar nada.
- Doctor crea un archivo de copia de seguridad verificado previo a la migración antes de importar
  los archivos heredados.
- Las importaciones son idempotentes y se identifican mediante la ruta de origen, la hora de modificación, el tamaño, el hash y la tabla
  de destino.
- Los archivos de origen importados correctamente se eliminan o archivan después de que se haya confirmado
  la base de datos de destino.
- Las importaciones fallidas dejan el origen intacto y registran una advertencia en
  `migration_runs`.
- El código del entorno de ejecución solo lee SQLite una vez que existe la migración.
- No se requiere ninguna ruta de reversión ni de exportación a archivos del entorno de ejecución.

## Inventario de migración

Traslade estos elementos a la base de datos global:

- Las escrituras en tiempo de ejecución del registro de tareas ahora usan la base de datos compartida; se ha eliminado el importador de archivos auxiliares
  `tasks/runs.sqlite` no publicado. Los guardados de instantáneas insertan o actualizan por identificador de tarea
  y eliminan únicamente las filas de tareas/entregas ausentes.
- Las escrituras en tiempo de ejecución de Task Flow ahora usan la base de datos compartida; se ha eliminado el importador de archivos auxiliares
  `tasks/flows/registry.sqlite` no publicado. Los guardados de instantáneas
  insertan o actualizan por identificador de flujo y eliminan únicamente las filas de flujos ausentes.
- Las escrituras en tiempo de ejecución del estado del Plugin ahora usan la base de datos compartida; se ha eliminado el importador de archivos auxiliares
  `plugin-state/state.sqlite` no publicado.
- La búsqueda de memoria integrada ya no usa `memory/<agentId>.sqlite` de forma predeterminada; sus
  tablas de índice residen en la base de datos del agente propietario, y la activación explícita
  del archivo auxiliar `memorySearch.store.path` se ha trasladado a la migración de configuración
  de doctor.
- La reindexación de la memoria integrada restablece únicamente las tablas propiedad de la memoria en la base de datos del agente.
  No debe sustituir todo el archivo SQLite, porque la misma base de datos contiene
  sesiones, transcripciones, filas de VFS, artefactos y cachés de tiempo de ejecución.
- Registros de contenedores/navegadores del entorno aislado procedentes de JSON monolítico y fragmentado. Las escrituras en tiempo de ejecución
  ahora usan la base de datos compartida; se mantiene la importación de JSON heredado.
- Las definiciones de trabajos de Cron, el estado de la programación y el historial de ejecuciones ahora usan SQLite compartido;
  doctor importa/elimina los archivos heredados `jobs.json`, `jobs-state.json` y
  `cron/runs/*.jsonl`
- Identidad/autenticación del dispositivo, push, comprobación de actualizaciones, compromisos, caché de modelos
  de OpenRouter, índice de plugins instalados y enlaces del servidor de aplicaciones
- Los registros de emparejamiento y arranque de dispositivos/nodos ahora usan tablas SQLite tipadas
- Los suscriptores de notificaciones de emparejamiento de dispositivos y los marcadores de solicitudes entregadas ahora usan la
  tabla compartida de estado de plugins de SQLite en lugar de `device-pair-notify.json`.
- Los registros de llamadas de voz ahora usan la tabla compartida de estado de plugins de SQLite bajo el
  espacio de nombres `voice-call` / `calls` en lugar de `calls.jsonl`; la CLI del plugin
  sigue y resume el historial de llamadas respaldado por SQLite.
- Las sesiones del Gateway de QQBot, los registros de usuarios conocidos y la caché de citas del índice de referencias ahora usan
  el estado de plugins de SQLite bajo los espacios de nombres `qqbot` (`gateway-sessions`,
  `known-users`, `ref-index`) en lugar de `session-*.json`, `known-users.json`
  y `ref-index.jsonl`. Esos archivos heredados son cachés y no se migran.
- Las preferencias del selector de modelos de Discord, los hashes de despliegue de comandos y los enlaces de hilos
  ahora usan el estado de plugins de SQLite bajo los espacios de nombres `discord`
  (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`)
  en lugar de `model-picker-preferences.json`, `command-deploy-cache.json` y
  `thread-bindings.json`; la migración de doctor/configuración de Discord importa y
  elimina los archivos heredados.
- Los cursores de puesta al día y los marcadores de deduplicación de entrada de BlueBubbles ahora usan el estado de plugins
  de SQLite bajo los espacios de nombres `bluebubbles` (`catchup-cursors`, `inbound-dedupe`)
  en lugar de `bluebubbles/catchup/*.json` y
  `bluebubbles/inbound-dedupe/*.json`; la migración de doctor/configuración de BlueBubbles
  importa y elimina los archivos heredados.
- Los desplazamientos de actualizaciones, las entradas de la caché de stickers, las entradas de la caché de mensajes de cadenas de respuestas,
  las entradas de la caché de mensajes enviados, las entradas de la caché de nombres de temas y los enlaces de hilos de Telegram
  ahora usan el estado de plugins de SQLite bajo los espacios de nombres `telegram`
  (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`,
  `topic-names`, `thread-bindings`) en lugar de `update-offset-*.json`,
  `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json` y
  `thread-bindings-*.json`; la migración de doctor/configuración de Telegram importa y
  elimina los archivos heredados.
- Los cursores de puesta al día, las asignaciones de identificadores cortos de respuestas y las filas de deduplicación de ecos enviados de iMessage
  ahora usan el estado de plugins de SQLite bajo los espacios de nombres `imessage` (`catchup-cursors`,
  `reply-cache`, `sent-echoes`) en lugar de `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` y `imessage/sent-echoes.jsonl`; la migración de
  doctor/configuración de iMessage importa y elimina los archivos heredados.
- Las conversaciones, encuestas, tokens de SSO y aprendizajes de comentarios de Microsoft Teams ahora
  usan espacios de nombres de estado de plugins de SQLite (`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`) en lugar de `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json` y `*.learnings.json`; la migración de
  doctor/configuración de Microsoft Teams importa y archiva los archivos heredados.
  Las cargas pendientes son una caché de SQLite de corta duración y los archivos de caché JSON antiguos
  no se migran.
- La caché de sincronización, los metadatos de almacenamiento, los enlaces de hilos, los marcadores de deduplicación de entrada,
  el estado del tiempo de espera de verificación de inicio, las credenciales, las claves de recuperación y las instantáneas criptográficas
  de IndexedDB del SDK de Matrix ahora usan espacios de nombres de estado/blobs de plugins de SQLite bajo
  `matrix` (`sync-store`, `storage-meta`, `thread-bindings`,
  `matrix.inbound-dedupe.*` mediante la deduplicación reclamable del núcleo,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`)
  en lugar de `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json` y `crypto-idb-snapshot.json`; la migración de doctor/configuración
  de Matrix importa y elimina esos archivos heredados (y las filas SQLite retiradas
  `inbound-dedupe` por raíz) de las raíces de almacenamiento de Matrix con ámbito de cuenta.
- Los cursores del bus y el estado de publicación del perfil de Nostr ahora usan el estado de plugins de SQLite bajo
  los espacios de nombres `nostr` (`bus-state`, `profile-state`) en lugar de
  `bus-state-*.json` y `profile-state-*.json`; la migración de doctor/configuración
  de Nostr importa y elimina los archivos heredados.
- Los conmutadores de sesión de Active Memory ahora usan el estado de plugins de SQLite bajo
  `active-memory/session-toggles` en lugar de `session-toggles.json`.
- Las colas de propuestas y los contadores de revisiones de Skill Workshop ahora usan el estado de plugins de SQLite
  bajo `skill-workshop/proposals` y `skill-workshop/reviews` en lugar de
  archivos `skill-workshop/<workspace>.json` por espacio de trabajo.
- Las colas de entrega saliente y de entrega de sesiones ahora comparten la tabla global de SQLite
  `delivery_queue_entries` bajo nombres de cola separados
  (`outbound-delivery`, `session-delivery`) en lugar de los archivos persistentes
  `delivery-queue/*.json`, `delivery-queue/failed/*.json` y
  `session-delivery-queue/*.json`. El paso de estado heredado de doctor importa
  las filas pendientes y fallidas, elimina los marcadores de entrega obsoletos y borra los archivos
  JSON antiguos tras la importación. Los campos de enrutamiento en caliente y reintento son columnas tipadas; la
  carga útil JSON se conserva únicamente para reproducción/depuración.
- Las concesiones de procesos ACPX ahora usan el estado de plugins de SQLite bajo `acpx/process-leases`
  en lugar de `process-leases.json`.
- Metadatos de ejecuciones de copias de seguridad y migraciones

Trasladar estos elementos a las bases de datos de los agentes:

- Raíces de sesiones de agentes y cargas útiles de entradas de sesión con formato de compatibilidad. Completado para
  las escrituras en tiempo de ejecución: los metadatos activos de sesión se pueden consultar en `sessions`, mientras que la
  carga útil completa heredada `SessionEntry` permanece en `session_entries`.
- Eventos de transcripciones de agentes. Completado para las escrituras en tiempo de ejecución.
- Puntos de control de Compaction e instantáneas de transcripciones. Completado para las escrituras en tiempo de ejecución:
  las copias de transcripciones de los puntos de control son filas de transcripciones de SQLite y los metadatos de los puntos de control
  se registran en `transcript_snapshots`. Los auxiliares de puntos de control del Gateway
  ahora denominan estos valores instantáneas de transcripciones en lugar de archivos de origen.
- Espacios de nombres de trabajo temporal/espacio de trabajo de VFS de agentes. Completado para las escrituras de VFS en tiempo de ejecución.
- Cargas útiles de archivos adjuntos de subagentes. Completado para las escrituras en tiempo de ejecución: son entradas iniciales de VFS
  de SQLite y nunca archivos persistentes del espacio de trabajo.
- Artefactos de herramientas. Completado para las escrituras en tiempo de ejecución.
- Artefactos de ejecuciones. Completado para las escrituras en tiempo de ejecución de los trabajadores mediante la tabla por agente
  `run_artifacts`.
- Cachés de tiempo de ejecución locales del agente. Completado para las escrituras de caché con ámbito de tiempo de ejecución del trabajador mediante
  la tabla por agente `cache_entries`. Las cachés de modelos de todo el Gateway permanecen en la
  base de datos global salvo que pasen a ser específicas de un agente.
- Registros de flujos principales de ACP. Completado para las escrituras en tiempo de ejecución.
- Sesiones del registro de reproducción de ACP. Completado para las escrituras en tiempo de ejecución mediante
  `acp_replay_sessions` y `acp_replay_events`; el archivo heredado `acp/event-ledger.json`
  permanece únicamente como entrada para doctor.
- Metadatos de sesiones de ACP. Completado para las escrituras en tiempo de ejecución mediante `acp_sessions`; los bloques heredados
  `entry.acp` en `sessions.json` son únicamente entradas para la migración de doctor.
- Archivos auxiliares de trayectorias cuando no son archivos de exportación explícitos. Completado para las escrituras en tiempo de ejecución:
  la captura de trayectorias escribe filas `trajectory_runtime_events` en la base de datos del agente
  y replica en SQLite los artefactos con ámbito de ejecución. Los archivos auxiliares heredados son únicamente entradas
  para la importación de doctor; la exportación puede materializar nuevas salidas JSONL de paquetes de soporte,
  pero no lee ni migra antiguos archivos auxiliares de trayectorias/transcripciones en tiempo de ejecución.
  La captura de trayectorias en tiempo de ejecución expone el ámbito de SQLite; los auxiliares de rutas JSONL están
  aislados para la compatibilidad de exportación/depuración y no se vuelven a exportar desde el módulo de tiempo de ejecución.
  Los metadatos de trayectorias del ejecutor integrado registran la identidad
  `{agentId, sessionId, sessionKey}` en lugar de conservar un localizador de transcripciones.

Mantener estos elementos respaldados por archivos por ahora:

- `openclaw.json`
- archivos de credenciales del proveedor o de la CLI
- manifiestos de plugins/paquetes
- espacios de trabajo de usuarios y repositorios Git cuando se selecciona el modo de disco
- registros destinados al seguimiento por parte del operador, salvo que se traslade una superficie de registro específica

## Plan de migración

### Fase 0: Fijar el límite

Hacer explícito el límite del estado persistente antes de trasladar más filas:

- Añadir una tabla `migration_runs` a la base de datos global.
  Completado para los informes de ejecución de migraciones de estado heredado.
- Añadir un único servicio de migración de estado, propiedad de doctor, para la importación de archivos a la base de datos.
  Completado: `openclaw doctor --fix` usa la implementación de migración de estado heredado.
- Hacer que `plan` sea de solo lectura y que `apply` cree una copia de seguridad, importe, verifique y
  después elimine o ponga en cuarentena los archivos antiguos.
  Completado: doctor crea una copia de seguridad verificada previa a la migración, pasa la ruta de la copia de seguridad
  a `migration_runs` y reutiliza las rutas de importación/eliminación.
- Añadir prohibiciones estáticas para que el nuevo código de tiempo de ejecución no pueda escribir archivos de estado heredados, mientras
  el código de migración y las pruebas aún pueden inicializarlos/leerlos.
  Completado para los almacenes heredados migrados actualmente; la protección también examina las pruebas
  anidadas en busca de contratos prohibidos de localizadores de transcripciones en tiempo de ejecución.

### Fase 1: Completar el plano de control global

Mantener el estado de coordinación compartido en `state/openclaw.sqlite`:

- Agentes y registro de bases de datos de agentes
- Registros de tareas y Task Flow
- Estado de plugins
- Registro de contenedores/navegadores del entorno aislado
- Historial de ejecuciones de Cron/planificador
- Emparejamiento, dispositivo, push, comprobación de actualizaciones, TUI, cachés de OpenRouter/modelos y otros
  estados de tiempo de ejecución pequeños con ámbito del Gateway
- Metadatos de copias de seguridad y migraciones
- Bytes de archivos adjuntos multimedia del Gateway. Completado para las escrituras en tiempo de ejecución; las rutas directas de archivos
  son materializaciones temporales para mantener la compatibilidad con los remitentes de canales y la preparación
  del entorno aislado. Las listas de permitidos en tiempo de ejecución aceptan rutas de materialización de SQLite, no raíces multimedia heredadas
  de estado/configuración. Doctor importa los archivos multimedia heredados a
  `media_blobs` y elimina los archivos de origen tras escribir correctamente las filas.
- Sesiones, eventos y blobs de cargas útiles de captura del proxy de depuración. Completado: las capturas residen
  en la base de datos de estado compartida y se abren mediante el arranque, el esquema,
  WAL y la configuración de tiempo de espera por ocupación de dicha base de datos. Los bytes de las cargas útiles se comprimen con gzip en
  `capture_blobs.data`; no existe ninguna sustitución de la base de datos auxiliar del proxy de depuración en tiempo de ejecución,
  directorio de blobs ni destino de esquema generado/generación de código exclusivo para capturas del proxy.
  La migración de doctor/inicio importa las filas publicadas `debug-proxy/capture.sqlite`
  y los blobs de cargas útiles referenciados, incluidas las sustituciones activas del entorno de la base de datos/blobs heredados,
  y después archiva esas fuentes mientras conserva intactos los certificados de la CA.

Esta fase también elimina de esos subsistemas las aperturas duplicadas de bases auxiliares, los asistentes de permisos, la configuración de WAL, la depuración del sistema de archivos y los escritores de compatibilidad.

### Fase 2: Introducir bases de datos por agente

Crear una base de datos por agente y registrarla desde la base de datos global:

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

La fila global `agent_databases` almacena la ruta, la versión del esquema, la marca de tiempo del último acceso y metadatos básicos de tamaño e integridad. El código en tiempo de ejecución solicita la base de datos del agente al registro en lugar de derivar directamente las rutas de archivo.

La base de datos del agente contiene:

- `sessions` como raíz canónica de la sesión, con `session_entries` como tabla de carga útil con formato de compatibilidad asociada a esa raíz, y
  `session_routes` como búsqueda activa única de `session_key`
- `conversations` y `session_conversations` como identidad normalizada de enrutamiento del proveedor asociada a las sesiones
- `transcript_events`
- instantáneas de transcripciones y puntos de control de Compaction. Completado para las escrituras en tiempo de ejecución.
- `vfs_entries`
- `tool_artifacts` y artefactos de ejecución
- filas locales del agente para tiempo de ejecución/caché. Completado para las cachés con ámbito de trabajador.
- eventos del flujo principal de ACP
- eventos de trayectoria en tiempo de ejecución cuando no sean artefactos de exportación explícitos

### Fase 3: Sustituir las API del almacén de sesiones

Completado para el tiempo de ejecución. La superficie del almacén de sesiones con formato de archivo no es un contrato activo de tiempo de ejecución:

- El tiempo de ejecución ya no llama a `loadSessionStore(storePath)` ni trata `storePath` como identidad de sesión.
- Las operaciones de filas en tiempo de ejecución son `getSessionEntry`, `upsertSessionEntry`,
  `patchSessionEntry`, `deleteSessionEntry` y `listSessionEntries`.
- Los asistentes para reescribir todo el almacén, los escritores de archivos, las pruebas de colas, la depuración de alias y los parámetros para eliminar claves heredadas se han eliminado del tiempo de ejecución.
- Las exportaciones de compatibilidad obsoletas del paquete raíz aún adaptan las rutas canónicas `sessions.json` a las API de filas de SQLite.
- El análisis de `sessions.json` permanece únicamente en el código de migración/importación de doctor y en las pruebas de doctor.
- La lectura alternativa del ciclo de vida en tiempo de ejecución lee las cabeceras de las transcripciones de SQLite, no las primeras líneas de JSONL.

Seguir eliminando todo lo que reintroduzca parámetros de bloqueo de archivos, vocabulario de depuración/truncamiento como mantenimiento de archivos, identidad basada en rutas del almacén o pruebas cuya única aserción sea la persistencia en JSON.

### Fase 4: Trasladar transcripciones, flujos ACP, trayectorias y VFS

Hacer que cada flujo de datos de agente sea nativo de la base de datos:

- Las escrituras de adición a transcripciones pasan por una única transacción de SQLite que garantiza la cabecera de la sesión, comprueba la idempotencia del mensaje, selecciona el extremo principal, inserta en `transcript_events` y registra metadatos de identidad consultables en `transcript_event_identities`. Completado para las adiciones directas de mensajes a transcripciones y las adiciones persistidas normales de `TranscriptSessionManager`; las operaciones explícitas de ramas conservan su selección explícita del elemento principal y siguen escribiendo filas de SQLite sin derivar ningún localizador de archivo.
- Los registros del flujo principal de ACP pasan a ser filas, no archivos `.acp-stream.jsonl`. Completado.
- La configuración de creación de ACP ya no conserva rutas JSONL de transcripciones. Completado.
- La captura de trayectorias en tiempo de ejecución escribe directamente filas de eventos/artefactos. El comando explícito de soporte/exportación aún puede producir artefactos JSONL de paquetes de soporte como formato de exportación, pero la exportación de sesiones no vuelve a crear JSONL de sesiones. Completado.
- Los espacios de trabajo en disco permanecen en el disco cuando se configura el modo de disco.
- El espacio temporal de VFS y el modo experimental de espacio de trabajo exclusivo de VFS utilizan la base de datos del agente.

La migración importa una sola vez los archivos JSONL antiguos, registra recuentos/hashes en `migration_runs` y elimina los archivos importados después de las comprobaciones de integridad.

### Fase 5: Copia de seguridad, restauración, Vacuum y verificación

Las copias de seguridad siguen siendo un único archivo:

- Crear un punto de control de cada base de datos global y de agente.
- Crear una instantánea de cada base de datos con la semántica de copia de seguridad de SQLite o `VACUUM INTO`.
- Archivar instantáneas compactas de las bases de datos, la configuración, las credenciales externas y las exportaciones solicitadas de espacios de trabajo.
- Omitir los archivos activos sin procesar `*.sqlite-wal` y `*.sqlite-shm`.
- Verificar abriendo cada instantánea de base de datos y ejecutando `PRAGMA integrity_check`.
  `openclaw backup create` realiza esta verificación del archivo de forma predeterminada;
  `--no-verify` omite únicamente la pasada posterior a la escritura del archivo, no la comprobación de integridad al crear la instantánea.
- La restauración vuelve a copiar las instantáneas en sus rutas de destino. Las bases de datos globales restauradas utilizan la versión `1`; las bases de datos por agente restauradas utilizan la versión `2`, y las instantáneas de la versión `1` se actualizan de forma atómica al abrirse.

### Fase 6: Tiempo de ejecución de trabajadores

Mantener el modo de trabajador como experimental mientras se implementa la división de las bases de datos:

- Los trabajadores reciben el identificador del agente, el identificador de ejecución, el modo del sistema de archivos y la identidad del registro de bases de datos.
- Cada trabajador abre su propia conexión de SQLite.
- El elemento principal conserva la autoridad sobre la entrega al canal, las aprobaciones, la configuración y la cancelación.
- Comenzar con un trabajador por ejecución activa; añadir agrupación únicamente cuando el ciclo de vida y la propiedad de las conexiones a la base de datos sean estables.

### Fase 7: Eliminar el sistema antiguo

Completado para la gestión de sesiones en tiempo de ejecución. El sistema antiguo solo se permite como entrada explícita de doctor o como salida de soporte/exportación:

- Ninguna escritura en tiempo de ejecución de `sessions.json`, JSONL de transcripciones, JSON del registro del entorno aislado, SQLite auxiliar de tareas ni SQLite auxiliar de estado de plugins.
- Ninguna depuración de archivos JSON/de sesión, truncamiento de transcripciones en archivos, bloqueo de archivos de sesión ni pruebas de sesión basadas en bloqueos.
- Ninguna exportación de compatibilidad en tiempo de ejecución cuyo propósito sea mantener actualizados los archivos de sesión antiguos.
- Las exportaciones explícitas de soporte siguen siendo formatos de archivo/materialización solicitados por el usuario y no deben devolver nombres de archivo a la identidad en tiempo de ejecución.

## Copia de seguridad y restauración

Las copias de seguridad deben ser un único archivo, pero la captura de las bases de datos debe ser nativa de SQLite:

1. Detener la actividad de escritura de larga duración o establecer una breve barrera de copia de seguridad.
2. Ejecutar un punto de control para cada base de datos global y de agente.
3. Crear instantáneas de las bases de datos con `VACUUM INTO` en un directorio temporal de copia de seguridad.
   Los esquemas de plugins que requieran capacidades de SQLite definidas por su propietario se cierran de forma segura hasta que este proporcione un contrato seguro de instantáneas.
4. Archivar las instantáneas de las bases de datos, el archivo de configuración, el directorio de credenciales, los espacios de trabajo seleccionados y un manifiesto.
5. Verificar la estructura de archivo de cada instantánea de SQLite; después, abrir las bases de datos canónicas de OpenClaw y ejecutar `PRAGMA integrity_check`, además de validar la función.
   Los esquemas dedicados de plugins permanecen opacos salvo que su propietario proporcione un verificador.
   `openclaw backup create` realiza esta operación de forma predeterminada; `--no-verify` sirve únicamente para omitir intencionadamente la pasada posterior a la escritura del archivo.

No usar copias directas de los archivos activos `*.sqlite`, `*.sqlite-wal` y `*.sqlite-shm` como formato principal de copia de seguridad. El manifiesto del archivo debe registrar la función de la base de datos, el identificador del agente, la versión del esquema, la ruta de origen, la ruta de la instantánea, el tamaño en bytes y el estado de integridad.

La restauración debe reconstruir la base de datos global y los archivos de bases de datos de agentes a partir de las instantáneas del archivo. El esquema global permanece en la versión `1`; las instantáneas por agente de la versión `1` reciben la actualización acotada en tiempo de ejecución a la versión `2`. Doctor sigue siendo el único responsable de la importación de archivos a bases de datos. El comando de restauración valida primero el archivo y después sustituye cada recurso del manifiesto por la carga útil extraída y verificada.

## Plan de refactorización del tiempo de ejecución

1. Añadir API del registro de bases de datos.
   - Resolver las rutas de la base de datos global y de las bases de datos por agente.
   - Mantener el esquema global en `user_version = 1`. Las bases de datos por agente utilizan la versión `2`
     con una migración atómica desde la estructura de origen de memoria de la versión publicada `1`.
   - Añadir asistentes de cierre, puntos de control e integridad utilizados por las pruebas, las copias de seguridad y doctor.

2. Consolidar los almacenes SQLite auxiliares.
   - Trasladar las tablas de estado de plugins a la base de datos global. Completado para las escrituras en tiempo de ejecución; se ha eliminado el importador heredado no publicado de la base auxiliar.
   - Trasladar las tablas del registro de tareas a la base de datos global. Completado para las escrituras en tiempo de ejecución; se ha eliminado el importador heredado no publicado de la base auxiliar.
   - Trasladar las tablas de Task Flow a la base de datos global. Completado para las escrituras en tiempo de ejecución; se ha eliminado el importador heredado no publicado de la base auxiliar.
   - Trasladar las tablas integradas de búsqueda en memoria a cada base de datos de agente. Completado; ahora doctor elimina explícitamente `memorySearch.store.path` mediante la migración de configuración.
     La reindexación completa se ejecuta localmente únicamente sobre las tablas de memoria; se han eliminado la antigua ruta de intercambio de archivos completos y el asistente de intercambio del índice auxiliar.
   - Eliminar de esos subsistemas las aperturas duplicadas de bases de datos, la configuración de WAL, los asistentes de permisos y las rutas de cierre.

3. Trasladar las tablas propiedad del agente a bases de datos por agente.
   - Crear la base de datos del agente bajo demanda mediante el registro de la base de datos global. Completado.
   - Trasladar las entradas de sesiones en tiempo de ejecución, los eventos de transcripciones, las filas de VFS y los artefactos de herramientas a las bases de datos de agentes. Completado.
   - No migrar las entradas de sesiones de la base de datos compartida local de la rama, los eventos de transcripciones, las filas de VFS ni los artefactos de herramientas; esa disposición nunca se publicó. Conservar únicamente la importación heredada de archivos a bases de datos en doctor.

4. Sustituir las API del almacén de sesiones.
   - Eliminar `storePath` como identidad en tiempo de ejecución. Completado para el tiempo de ejecución y protegido por `check:database-first-legacy-stores`: los metadatos de sesiones, las actualizaciones de rutas, la persistencia de comandos, la limpieza de sesiones de la CLI, las vistas previas de razonamiento de Feishu, la persistencia del estado de transcripciones, la profundidad de subagentes, las sustituciones del perfil de autenticación de la sesión, la lógica de bifurcación del elemento principal y la inspección del laboratorio de control de calidad ahora resuelven la base de datos mediante claves canónicas de agente/sesión.
     Las respuestas de listas de sesiones de Gateway/TUI/UI/macOS ahora exponen `databasePath` en lugar del valor heredado `path`; las superficies de depuración de macOS muestran la base de datos por agente como estado de solo lectura en lugar de escribir la configuración `session.store`.
     `/status`, la exportación de trayectorias iniciada desde el chat y los proxies de dependencias de la CLI ya no propagan rutas heredadas del almacén; la lectura alternativa del uso de transcripciones lee SQLite mediante la identidad del agente/sesión. Las pruebas de tiempo de ejecución y de puente ya no exponen `storePath`; las entradas de doctor/migración son las responsables de ese nombre de campo heredado.
     La carga combinada de sesiones de Gateway ya no tiene una rama especial de tiempo de ejecución para valores `session.store` sin plantilla; agrega las filas de SQLite por agente.
     Se eliminaron el flujo heredado de doctor para bloqueos de sesión y su asistente de limpieza `.jsonl.lock`; SQLite es ahora el límite de concurrencia de las sesiones.
     Los puntos de llamada críticos en tiempo de ejecución utilizan nombres de asistentes orientados a filas, como `resolveSessionRowEntry`; el antiguo alias de compatibilidad `resolveSessionStoreEntry` se ha eliminado de las exportaciones de tiempo de ejecución y del SDK de plugins.

- Utilizar operaciones de filas `{ agentId, sessionKey }`.
  Completado: `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`,
  `patchSessionEntry` y `listSessionEntries` son API que priorizan SQLite y no requieren una ruta del almacén de sesiones. El resumen de estado, el estado local del agente, la supervisión y el comando de listado `openclaw sessions` ahora leen directamente las filas por agente y muestran las rutas de las bases de datos SQLite por agente en lugar de las rutas `sessions.json`.
- Sustituir la eliminación/inserción de todo el almacén por `upsertSessionEntry`,
  `deleteSessionEntry`, `listSessionEntries` y consultas SQL de limpieza.
  Completado para el tiempo de ejecución: las rutas críticas ahora utilizan API de filas y parches de filas con reintentos ante conflictos; los asistentes restantes de importación/sustitución de todo el almacén se limitan al código de importación de migraciones y a las pruebas del backend de SQLite.
  - Eliminar `store-writer.ts` y las pruebas de la cola de escritura. Completado.
  - Eliminar del tiempo de ejecución la depuración de claves heredadas y los parámetros de eliminación de alias de las inserciones o actualizaciones/parches de filas de sesiones. Completado.

5. Eliminar el comportamiento del registro JSON en tiempo de ejecución.
   - Hacer que las lecturas y escrituras del registro del sandbox usen exclusivamente SQLite. Hecho.
   - Importar JSON monolítico y fragmentado únicamente desde el paso de migración. Hecho.
   - Eliminar los bloqueos del registro fragmentado y las escrituras JSON. Hecho.

- Mantener una única tabla de registro tipada en lugar de almacenar las filas del registro como JSON
  opaco genérico si la estructura sigue siendo estado operativo de la ruta crítica. Hecho.

6. Eliminar la mutación de sesiones basada en bloqueos de archivos.
   - Hecho para la creación de bloqueos en tiempo de ejecución y las API de bloqueo en tiempo de ejecución.
   - Se eliminó la vía independiente de limpieza heredada de doctor `.jsonl.lock`.
   - `session.writeLock` es configuración heredada migrada por doctor, no un ajuste tipado de tiempo de
     ejecución.
   - La integridad del estado ya no tiene una ruta independiente para depurar archivos
     de transcripción huérfanos; la migración de doctor importa/elimina las fuentes JSONL heredadas en un único lugar.
   - La coordinación de la instancia única del Gateway usa filas SQLite tipadas `state_leases` bajo
     `gateway_locks` y ya no expone una interfaz de directorio de bloqueos de archivos.
   - La persistencia genérica de deduplicación del SDK de plugins ya no usa bloqueos de archivos ni archivos
     JSON; escribe filas de estado de plugins en SQLite compartido. Hecho.
   - La coordinación de incrustación de QMD usa un arrendamiento de estado de SQLite en lugar de
     `qmd/embed.lock`. Hecho.

7. Hacer que los procesos de trabajo sean conscientes de la base de datos.
   - Los procesos de trabajo abren sus propias conexiones SQLite.
   - El proceso principal controla la entrega, las devoluciones de llamada de los canales y la configuración.
   - El proceso de trabajo recibe el id. del agente, el id. de ejecución, el modo del sistema de archivos y la identidad
     del registro de la BD, no identificadores activos.
   - `vfs-only` sigue siendo experimental y usa la base de datos del agente como raíz de
     almacenamiento.
   - Mantener inicialmente un proceso de trabajo por ejecución activa. La agrupación puede esperar hasta que la duración
     de las conexiones de la BD y el comportamiento de cancelación sean predecibles.

8. Integración de copias de seguridad.
   - Enseñar al sistema de copias de seguridad a crear instantáneas de las bases de datos globales, de agentes y de plugins con
     `VACUUM INTO`. Hecho para los archivos `*.sqlite` detectados en el recurso de estado;
     los esquemas de plugins que requieren capacidades no disponibles del propietario producen un fallo seguro.
   - Añadir verificación de copias de seguridad para la integridad canónica de SQLite y la identidad del esquema,
     además de validación genérica de la estructura de archivos para instantáneas dedicadas de plugins. Hecho para
     la creación de copias de seguridad y la verificación predeterminada de archivos.
   - Registrar los metadatos de ejecución de las copias de seguridad en SQLite. Hecho mediante la tabla compartida `backup_runs`
     con la ruta del archivo, el estado y el JSON del manifiesto.
   - Añadir restauración desde instantáneas de archivos verificadas. Hecho: `openclaw backup
restore` valida antes de la extracción, usa el manifiesto normalizado
     del verificador, admite `--dry-run` y requiere `--yes` antes de sustituir
     las rutas de origen registradas.
   - Incluir la exportación de VFS/espacio de trabajo solo cuando se solicite; no exportar los
     componentes internos de las sesiones como JSON o JSONL.

9. Eliminar las pruebas y el código obsoletos. Hecho para las superficies conocidas de sesiones en tiempo de ejecución.

- Eliminar las pruebas que afirman la creación en tiempo de ejecución de `sessions.json` o archivos
  de transcripción JSONL. Hecho para el almacén principal de sesiones, el chat, los eventos de transcripción del Gateway,
  la vista previa, el ciclo de vida, las actualizaciones de entradas de sesión de comandos, el restablecimiento/rastreo de respuestas automáticas y
  los accesorios de Dreaming de memory-core, el enrutamiento de destinos de aprobación, la reparación de transcripciones
  de sesiones, la reparación de permisos de seguridad, la exportación de trayectorias y la exportación de sesiones.
  Las pruebas de transcripciones de Active Memory ahora comprueban ámbitos de SQLite y que no se creen
  archivos JSONL temporales ni persistentes.
  Se eliminó la antigua regresión de depuración de transcripciones de Heartbeat porque
  el tiempo de ejecución ya no trunca las transcripciones JSONL.
  Las pruebas de la herramienta de listado de sesiones de agentes ya no modelan rutas heredadas `sessions.json`
  como estructura de respuesta del Gateway; las pruebas de aplicaciones/interfaz de usuario/macOS usan `databasePath`.
  Las pruebas de uso de transcripciones de `/status` ahora insertan directamente filas de transcripción de SQLite
  en lugar de escribir archivos JSONL.
  Las pruebas del ciclo de vida de sesiones del Gateway ahora usan directamente auxiliares para insertar transcripciones
  en SQLite; la antigua estructura de accesorio de archivo de sesión de una sola línea desapareció de la cobertura de
  restablecimiento y eliminación.
  `sessions.delete` ya no devuelve un campo `archived: []` de la era de los archivos; la eliminación
  solo informa del resultado de la mutación de filas. También desapareció la antigua opción `deleteTranscript`:
  eliminar una sesión elimina la raíz canónica `sessions` y permite que
  SQLite elimine en cascada las filas de transcripciones, instantáneas y trayectorias pertenecientes a la sesión, para que ningún
  llamador pueda dejar transcripciones huérfanas ni olvidar una rama de limpieza.
  Las pruebas de captura de trayectorias del motor de contexto ahora leen filas `trajectory_runtime_events`
  de una base de datos de agente aislada en lugar de leer
  `session.trajectory.jsonl`.
  Los scripts de inicialización de canales MCP de Docker ahora insertan directamente filas de SQLite. Las escrituras directas en
  `sessions.json` se limitan a los accesorios de doctor.
  La prueba E2E de Tool Search Gateway lee la evidencia de llamadas a herramientas de las filas de transcripción de SQLite
  en lugar de examinar archivos `agents/<agentId>/sessions/*.jsonl`.
  Los eventos del host y las filas temporales del corpus de sesiones de memory-core ahora residen en el estado
  compartido de plugins de SQLite; `events.jsonl` y `session-corpus/*.txt` son únicamente
  entradas de migración heredadas de doctor. Las filas activas usan rutas virtuales `memory/session-ingestion/`,
  no `.dreams/session-corpus`. Se eliminaron el antiguo módulo de reparación de Dreaming
  de memory-core y sus pruebas de CLI/Gateway porque el tiempo de ejecución ya
  no controla la reparación de archivos para ese corpus. Las pruebas de
  puente/artefactos públicos de memory-core ya no exponen `.dreams/events.jsonl`;
  usan el nombre de artefacto JSON virtual respaldado por SQLite.
  La documentación pública de pruebas del SDK/Codex ahora indica estado de sesión de SQLite en lugar de archivos
  de sesión, y el ejemplo de turno de canal ya no expone un argumento `storePath`.
  El estado de sincronización de Matrix ahora usa directamente el almacén de estado de plugins de SQLite. Los contratos
  activos de cliente/tiempo de ejecución pasan una raíz de almacenamiento de cuenta, no una ruta `bot-storage.json`,
  y doctor importa `bot-storage.json` heredado en SQLite antes de eliminar
  el origen. Los escenarios destructivos y de reinicio de Matrix en control de calidad ahora modifican directamente la fila de sincronización
  de SQLite en lugar de crear o eliminar archivos `bot-storage.json` falsos, y
  el sustrato E2EE pasa una raíz de almacén de sincronización en lugar de una ruta
  `sync-store.json` falsa.
  La selección de la raíz de almacenamiento de Matrix ya no puntúa las raíces según archivos JSON heredados de sincronización/hilos;
  usa metadatos de raíz duraderos junto con el estado criptográfico real.
  El conjunto de pruebas del backend de sesiones SQLite en tiempo de ejecución ya no fabrica un
  `sessions.json`; los accesorios de fuentes heredadas ahora residen en las pruebas
  de doctor que los importan.
  Las pruebas de sesiones del Gateway ya no exponen un auxiliar `createSessionStoreDir` ni
  una configuración sin uso de rutas temporales del almacén de sesiones; los directorios de accesorios son explícitos y la configuración
  directa de filas usa la nomenclatura de filas de sesión de SQLite.
  La cobertura del analizador del almacén de sesiones JSON5 exclusivo de doctor se trasladó de las pruebas de infraestructura
  a las pruebas de migración de doctor, de modo que los conjuntos de pruebas en tiempo de ejecución ya no controlan el análisis
  de archivos de sesión heredados.
  Las pruebas de SSO/cargas pendientes en tiempo de ejecución de Microsoft Teams ya no incluyen accesorios
  ni analizadores de archivos auxiliares JSON; el análisis de tokens SSO heredados solo reside en el módulo
  de migración del Plugin. Las pruebas de Telegram ya no insertan rutas de almacén `/tmp/*.json`
  falsas; restablecen directamente la caché de mensajes respaldada por SQLite. El auxiliar genérico
  de estado de pruebas de OpenClaw ya no expone un escritor `auth-profiles.json`
  heredado; las pruebas de migración de autenticación de doctor controlan ese accesorio localmente.
  Las pruebas en tiempo de ejecución de los punteros de última sesión de la TUI, las aprobaciones de ejecución, los conmutadores de Active Memory,
  la verificación de deduplicación/inicio de Matrix, la sincronización de fuentes de Memory Wiki,
  los enlaces de la conversación actual, la autenticación de incorporación y las importaciones de secretos de Hermes ya no
  generan archivos auxiliares antiguos ni comprueban que no existan nombres de archivo antiguos. Demuestran
  el comportamiento mediante filas de SQLite y API públicas de almacenamiento; las pruebas de doctor/migración
  son el único lugar al que pertenecen los nombres de archivo de origen heredados.
  Las pruebas en tiempo de ejecución del emparejamiento de dispositivos/nodos, allowFrom de canales, las intenciones de reinicio,
  la transferencia del reinicio, las entradas de la cola de entrega de sesiones, el estado de la configuración, las cachés de iMessage,
  los trabajos de Cron, los encabezados de transcripciones de PI, los registros de subagentes y los archivos adjuntos de imágenes
  administrados tampoco crean ya archivos JSON/JSONL retirados únicamente para demostrar
  que se ignoran o que no existen.
  La recuperación ante desbordamiento de PI ya no tiene una reserva de reescritura/truncamiento de SessionManager:
  el truncamiento de resultados de herramientas y las reescrituras de transcripciones del motor de contexto modifican
  las filas de transcripción de SQLite y luego actualizan el estado activo del prompt desde la base de datos.
  Las adiciones persistentes de mensajes de SessionManager delegan en el auxiliar de adición atómica
  de transcripciones de SQLite para seleccionar el elemento principal y garantizar la idempotencia. Las adiciones normales
  de metadatos/entradas personalizadas también seleccionan el elemento principal actual dentro de SQLite, de modo que
  las instancias obsoletas del gestor no reintroduzcan las condiciones de carrera de la cadena principal anteriores a SQLite.
  La limpieza sintética del final de PI para las comprobaciones previas a mitad del turno y `sessions_yield` ahora
  recorta directamente el estado de transcripción de SQLite; se eliminaron el antiguo puente de eliminación del final
  de SessionManager y sus pruebas.
  La captura de puntos de control de Compaction también toma instantáneas exclusivamente desde SQLite; los llamadores ya
  no pasan un SessionManager activo como fuente de transcripción alternativa.
- Mantener las pruebas que insertan archivos heredados únicamente para la migración.
- La comprobación mediante archivos JSON se sustituyó por la comprobación mediante filas SQL para las superficies activas
  de tiempo de ejecución.

- Añadir prohibiciones estáticas para las escrituras en tiempo de ejecución en rutas JSON heredadas de sesiones/cachés.
  Hecho para la protección del repositorio.

10. Hacer auditable el informe de migración.
    - Registrar las ejecuciones de migración en SQLite con marcas de tiempo de inicio/finalización, rutas
      de origen, hashes de origen, recuentos, advertencias y ruta de la copia de seguridad.
      Hecho: las ejecuciones de migración del estado heredado ahora conservan un informe `migration_runs`
      con el inventario de rutas/tablas de origen, el SHA-256 de los archivos de origen, los tamaños,
      los recuentos de registros, las advertencias y la ruta de la copia de seguridad.
      Hecho: las ejecuciones de migración del estado heredado también conservan filas `migration_sources`
      para la auditoría a nivel de origen y futuras decisiones de omisión/relleno retroactivo.
    - Hacer que la aplicación sea idempotente. Al volver a ejecutar tras una importación parcial, se debe
      omitir una fuente ya importada o combinarla mediante una clave estable.
      Hecho: los índices de sesiones, las transcripciones, las colas de entrega, el estado de los plugins, los libros
      de tareas y las filas globales de SQLite pertenecientes a agentes se importan mediante claves estables o
      semántica de inserción o actualización/sustitución, por lo que las nuevas ejecuciones combinan los datos sin duplicar
      filas duraderas.
    - Las importaciones fallidas deben conservar el archivo de origen original.
      Hecho: las importaciones fallidas de transcripciones ahora dejan la fuente JSONL original en
      su ruta detectada, y `migration_sources` registra la fuente como
      `warning` con `removed_source=0` para la siguiente ejecución de doctor.

## Reglas de rendimiento

- Una conexión por hilo/proceso es adecuada; no compartir identificadores entre
  procesos de trabajo.
- Usar WAL, `foreign_keys=ON`, un tiempo de espera por ocupación de 5s y transacciones de escritura `BEGIN IMMEDIATE`
  breves. No añadir reintentos síncronos de bloqueo sobre la única espera
  por ocupación de SQLite.
- Mantener síncronos los auxiliares de transacciones de escritura, salvo que/hasta que una API de transacciones asíncronas
  añada semántica explícita de exclusión mutua/control de contrapresión.
- Mantener pequeñas y transaccionales las escrituras de entrega del proceso principal.
- Evitar reescrituras de almacenes completos; usar inserción o actualización/eliminación a nivel de fila.
- Añadir índices para las rutas de listado por agente, listado por sesión, fecha de actualización, id. de ejecución y
  caducidad antes de trasladar código de la ruta crítica.
- Almacenar artefactos grandes, contenido multimedia y vectores como BLOB o filas BLOB fragmentadas, no
  como JSON en base64 o de matrices numéricas.
- Mantener pequeñas y acotadas las entradas opacas de estado de plugins.
- Añadir limpieza SQL para TTL/caducidad en lugar de depuración del sistema de archivos.
  Hecho para los almacenes en tiempo de ejecución controlados por la base de datos: el contenido multimedia, el estado de los plugins, los blobs de plugins,
  la deduplicación persistente y la caché de agentes caducan mediante filas de SQLite. La limpieza restante
  del sistema de archivos se limita a materializaciones temporales o comandos explícitos
  de eliminación.

## Prohibiciones estáticas

Añadir una comprobación del repositorio que rechace nuevas escrituras en tiempo de ejecución en rutas de estado heredadas:

- `sessions.json`
- `*.trajectory.jsonl` excepto las salidas materializadas de paquetes de soporte
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- `cache/*.json` archivos de caché de ejecución
- `agents/<agentId>/agent/auth.json`
- `agents/<agentId>/agent/models.json`
- `credentials/oauth.json`
- `github-copilot.token.json`
- `openrouter-models.json`
- `auth-profiles.json`
- `auth-state.json`
- `exec-approvals.json`
- `workspace-state.json`
- Matrix `credentials*.json` y `recovery-key.json`
- `cron/runs/*.jsonl`
- `cron/jobs.json`
- `jobs-state.json`
- `device-pair-notify.json`
- `devices/pending.json` / `devices/paired.json` / `devices/bootstrap.json`
  (retirado en 2026.7: el almacén de ejecución es `device_pairing_*` /
  `device_bootstrap_tokens` en la base de datos de estado compartida; los registros emparejados se importan al
  iniciar el Gateway y se descartan las filas transitorias pendientes/de arranque)
- `nodes/pending.json` / `nodes/paired.json` (retirado en 2026.7: integrado en los registros de dispositivos emparejados al iniciar el Gateway)
- `identity/device.json`
- `identity/device-auth.json`
- `push/web-push-subscriptions.json`
- `push/vapid-keys.json`
- `push/apns-registrations.json`
- `process-leases.json`
- `gateway-instance-id`
- `session-toggles.json`
- Memory-core `.dreams/events.jsonl`
- Memory-core `.dreams/session-corpus/`
- Memory-core `.dreams/daily-ingestion.json`
- Memory-core `.dreams/session-ingestion.json`
- Memory-core `.dreams/short-term-recall.json`
- Memory-core `.dreams/phase-signals.json`
- Memory-core `.dreams/short-term-promotion.lock`
- Taller de Skills `skill-workshop/<workspace>.json`
- Taller de Skills `skill-workshop/skill-workshop-review-*.json`
- Nostr `bus-state-*.json`
- Nostr `profile-state-*.json`
- `calls.jsonl`
- `known-users.json`
- `ref-index.jsonl`
- QQBot `session-*.json`
- BlueBubbles `bluebubbles/catchup/*.json`
- BlueBubbles `bluebubbles/inbound-dedupe/*.json`
- Telegram `update-offset-*.json`
- Telegram `sticker-cache.json`
- Telegram `*.telegram-messages.json`
- Telegram `*.telegram-sent-messages.json`
- Telegram `*.telegram-topic-names.json`
- Telegram `thread-bindings-*.json`
- iMessage `catchup/*.json`
- iMessage `reply-cache.jsonl`
- iMessage `sent-echoes.jsonl`
- Microsoft Teams `msteams-conversations.json`
- Microsoft Teams `msteams-polls.json`
- Microsoft Teams `msteams-sso-tokens.json`
- Microsoft Teams `*.learnings.json`
- Matrix `bot-storage.json`
- Matrix `sync-store.json`
- Matrix `thread-bindings.json`
- Matrix `inbound-dedupe.json`
- Matrix `startup-verification.json`
- Matrix `storage-meta.json`
- Matrix `crypto-idb-snapshot.json`
- Discord `model-picker-preferences.json`
- Discord `command-deploy-cache.json`
- archivos JSON de fragmentos del registro del entorno aislado
- archivos JSON del puente `/tmp` del relé de enlaces nativos
- `plugin-state/state.sqlite`
- archivos auxiliares de ejecución `openclaw-state.sqlite` ad hoc
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
- Wiki de memoria `.openclaw-wiki/log.jsonl`
- Wiki de memoria `.openclaw-wiki/state.json`
- Wiki de memoria `.openclaw-wiki/locks/`
- Wiki de memoria `.openclaw-wiki/source-sync.json`
- Wiki de memoria `.openclaw-wiki/import-runs/*.json`
- Wiki de memoria `.openclaw-wiki/cache/agent-digest.json`
- Wiki de memoria `.openclaw-wiki/cache/claims.jsonl`
- ClawHub `.clawhub/lock.json`
- ClawHub `.clawhub/origin.json`
- Decoración del perfil del navegador `.openclaw-profile-decorated`
- `SessionManager.open(...)` abridores de sesiones respaldados por archivos
- `SessionManager.listAll(...)` y `TranscriptSessionManager.listAll(...)`
  fachadas de listado de transcripciones
- `SessionManager.forkFromSession(...)` y
  `TranscriptSessionManager.forkFromSession(...)` fachadas de bifurcación de transcripciones
- `SessionManager.newSession(...)` y `TranscriptSessionManager.newSession(...)`
  fachadas de sustitución de sesiones mutables
- `SessionManager.createBranchedSession(...)` y
  `TranscriptSessionManager.createBranchedSession(...)` fachadas de sesiones de rama

La prohibición debe permitir que las pruebas creen accesorios heredados y que el código de migración
lea, importe y elimine fuentes de archivos heredadas. Los archivos auxiliares SQLite no publicados siguen prohibidos
y no reciben permisos de importación mediante doctor.

## Criterios de finalización

- Las escrituras de datos y caché de ejecución se dirigen a la base de datos SQLite global o del agente.
- La ejecución ya no escribe índices de sesiones, JSONL de transcripciones ni archivos JSON
  de registro del entorno aislado, SQLite auxiliar de tareas o SQLite auxiliar de estado de plugins. Se eliminan los importadores SQLite auxiliares
  no publicados de tareas y estado de plugins.
- La importación de archivos heredados se realiza únicamente mediante doctor.
- La copia de seguridad produce un único archivo con instantáneas SQLite compactas y una prueba de integridad.
- Los procesos de trabajo de agentes pueden ejecutarse con almacenamiento en disco, almacenamiento temporal de VFS o almacenamiento
  experimental únicamente en VFS.
- La configuración y los archivos explícitos de credenciales siguen siendo los únicos archivos de control persistentes
  ajenos a la base de datos que se esperan.
- Las comprobaciones del repositorio impiden que se reintroduzcan almacenes de archivos de ejecución heredados.
