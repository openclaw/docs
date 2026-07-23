---
read_when:
    - Migración de los datos de ejecución, la caché, las transcripciones, el estado de las tareas o los archivos temporales de OpenClaw a SQLite
    - Diseño de migraciones de doctor desde archivos JSON o JSONL heredados
    - Cambio del comportamiento de copia de seguridad, restauración, VFS o almacenamiento de workers
    - Eliminación de bloqueos de sesión, depuración, truncamiento o rutas de compatibilidad con JSON
summary: Plan de migración para convertir SQLite en la capa principal de estado duradero y caché, manteniendo la configuración respaldada por archivos
title: Refactorización del estado centrada en la base de datos
x-i18n:
    generated_at: "2026-07-22T20:05:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7d1d34b57f56926004cdf963b6c7b3e8d0344df8f287b1e5d1deec12b1916485
    source_path: refactor/database-first.md
    workflow: 16
---

# Refactorización del estado con la base de datos como prioridad

## Decisión

Usar una disposición SQLite de dos niveles:

- Base de datos global: `~/.openclaw/state/openclaw.sqlite`
- Base de datos del agente: una base de datos SQLite por agente para el espacio de trabajo,
  la transcripción, el VFS, los artefactos y el estado de ejecución voluminoso propiedad del agente
- La configuración continúa respaldada por archivos: `openclaw.json` permanece fuera de la
  base de datos. Los perfiles de autenticación de ejecución pasan a SQLite; los archivos de
  credenciales de proveedores externos o de la CLI permanecen fuera de la base de datos de OpenClaw
  y bajo la gestión de sus propietarios.

La base de datos global es la base de datos del plano de control. Es responsable del descubrimiento
de agentes, el estado compartido del Gateway, el emparejamiento, el estado de dispositivos/nodos,
los registros de tareas y flujos, el estado de los plugins, el estado de ejecución del planificador,
los metadatos de copias de seguridad y el estado de las migraciones.

La base de datos del agente es la base de datos del plano de datos. Es responsable de los metadatos
de sesión del agente, el flujo de eventos de transcripción, el espacio de trabajo VFS o espacio de
nombres temporal, los artefactos de herramientas, los artefactos de ejecución y los datos de caché
locales del agente que admiten búsquedas e indexación.

Esto proporciona una vista global duradera sin obligar a introducir espacios de trabajo voluminosos
de agentes, transcripciones y datos binarios temporales en el canal compartido de escritura del Gateway.

## Contrato estricto

Esta migración tiene una única forma canónica de ejecución:

- Las filas de sesión solo conservan metadatos de sesión. No deben conservar
  `transcriptLocator`, rutas de archivos de transcripción, rutas JSONL relacionadas, rutas de bloqueo,
  metadatos de depuración ni punteros de compatibilidad de la época de los archivos.
- La identidad de la transcripción siempre es una identidad de SQLite: `{agentId, sessionId}` más
  metadatos opcionales del tema cuando el protocolo los necesite.
- `sqlite-transcript://...` no es una identidad de ejecución ni de protocolo. El código nuevo no debe
  derivar, conservar, pasar, analizar ni migrar localizadores de transcripciones. La ejecución y
  las pruebas no deben contener ningún seudolocalizador; la documentación puede mencionar la cadena
  únicamente para prohibirla.
- Los elementos heredados `sessions.json`, el JSONL de transcripciones, `.jsonl.lock`, la depuración, el truncamiento
  y la lógica antigua de rutas de sesión pertenecen únicamente a la ruta de migración/importación de doctor.
- Los alias heredados de configuración de sesiones pertenecen únicamente a la migración de doctor. La ejecución
  no interpreta `session.idleMinutes`, `session.resetByType.dm` ni
  alias de sesión principal `agent:main:*` entre agentes para otro agente configurado.
- La identidad de enrutamiento de sesiones es un estado relacional tipado. Las rutas activas de ejecución y de la interfaz
  deben leer `sessions.session_scope`, `sessions.account_id`,
  `sessions.primary_conversation_id`, `conversations` y
  `session_conversations`; no deben analizar `session_key` ni extraer
  de `session_entries.entry_json` la identidad del proveedor, salvo como representación
  de compatibilidad mientras se eliminan los sitios de llamada antiguos.
- Los marcadores de mensajes directos a nivel de canal, como `dm` frente a `direct`, son vocabulario
  de enrutamiento, no localizadores de transcripciones ni identificadores de compatibilidad del almacén de archivos.
- La configuración heredada de controladores de hooks pertenece únicamente a las superficies de advertencia/migración de doctor.
  La ejecución no debe cargar `hooks.internal.handlers`; los hooks se ejecutan únicamente mediante los directorios
  de hooks descubiertos y los metadatos `HOOK.md`.
- El inicio de la ejecución, las rutas activas de respuesta, Compaction, el restablecimiento, la recuperación, los diagnósticos,
  TTS, los hooks de memoria, los subagentes, el enrutamiento de comandos de plugins, los límites del protocolo y
  los hooks deben pasar `{agentId, sessionId}` a través de la ejecución.
- Las pruebas deben inicializar y verificar las filas de transcripciones SQLite mediante
  `{agentId, sessionId}`. Deben eliminarse las pruebas que solo demuestren el reenvío de rutas JSONL,
  la conservación de localizadores proporcionados por el llamador o la compatibilidad con archivos de transcripción,
  salvo que cubran la importación de doctor, la materialización de soporte/depuración ajena a las sesiones
  o la forma del protocolo.
- `runEmbeddedPiAgent(...)`, las ejecuciones preparadas de workers y el intento
  integrado interno no deben aceptar localizadores de transcripciones. Abren el gestor de transcripciones SQLite
  mediante `{agentId, sessionId}` y pasan ese gestor a la sesión de agente compatible con PI
  internalizada, de modo que los llamadores obsoletos no puedan hacer que el ejecutor escriba
  transcripciones JSON/JSONL.
- Los diagnósticos del ejecutor deben almacenar los registros de seguimiento de ejecución/caché/carga útil en SQLite.
  Los diagnósticos de ejecución no deben exponer controles de sustitución de archivos JSONL ni ayudantes genéricos
  para exportar transcripciones JSONL; las exportaciones visibles para el usuario pueden materializar artefactos
  explícitos a partir de filas de la base de datos sin volver a introducir nombres de archivos en la ejecución.
- El registro del flujo sin procesar usa `OPENCLAW_RAW_STREAM=1` junto con filas de diagnóstico SQLite.
  El antiguo contrato de registro en archivos de pi-mono `PI_RAW_STREAM`, `PI_RAW_STREAM_PATH` y
  `raw-openai-completions.jsonl` no forma parte de la ejecución ni de las pruebas de OpenClaw.
- La indexación de memoria de QMD no debe exportar transcripciones SQLite a archivos Markdown.
  QMD solo indexa los archivos de memoria configurados; la búsqueda en transcripciones de sesiones continúa
  respaldada por SQLite.
- La subruta del SDK de QMD es exclusiva de QMD para el código nuevo. Los ayudantes de indexación
  de transcripciones de sesiones SQLite residen en `memory-core-host-engine-session-transcripts`; cualquier
  reexportación de QMD es solo de compatibilidad y el código de ejecución no debe usarla.
- Los índices de memoria integrados residen en la base de datos del agente propietario. La configuración de ejecución y
  los contratos de ejecución resueltos no deben exponer `memorySearch.store.path`; doctor
  elimina esa clave de configuración heredada y el código actual pasa internamente la
  `databasePath` del agente.

El trabajo de implementación debe seguir eliminando código hasta que estas afirmaciones sean ciertas
sin excepciones fuera de los límites de doctor/importación/exportación/depuración.

## Estado objetivo y progreso

### Objetivo estricto

- Una base de datos SQLite global es responsable del estado del plano de control:
  `state/openclaw.sqlite`.
- Una base de datos SQLite por agente es responsable del estado del plano de datos:
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- La configuración continúa respaldada por archivos. `openclaw.json` no forma parte de esta
  refactorización de la base de datos.
- Los archivos heredados son únicamente entradas de migración de doctor.
- La ejecución nunca escribe ni lee archivos JSONL de sesiones o transcripciones como estado activo.

### Estados objetivo

- `not-started`: el código de ejecución de la época de los archivos todavía escribe estado activo.
- `migrating`: el código de doctor/importación puede trasladar datos de archivos a SQLite.
- `dual-read`: un puente temporal lee tanto SQLite como archivos heredados. Este estado
  está prohibido para esta refactorización salvo que esté documentado explícitamente como
  exclusivo de doctor.
- `sqlite-runtime`: la ejecución solo lee y escribe SQLite.
- `clean`: se eliminan las API de ejecución y las pruebas heredadas, y la protección evita
  regresiones.
- `done`: la documentación, las pruebas, las copias de seguridad, la migración de doctor y las comprobaciones de cambios demuestran
  el estado limpio.

### Estado actual

- Sesiones: `clean` para la ejecución. Las filas de sesión residen en la base de datos por agente,
  las API de ejecución usan `{agentId, sessionId}` o `{agentId, sessionKey}`, y
  `sessions.json` es una entrada heredada exclusiva de doctor.
- Transcripciones: `clean` para la ejecución. Los eventos, las identidades, las instantáneas
  y los eventos de ejecución de trayectorias de las transcripciones residen en la base de datos por agente. La ejecución ya no
  acepta localizadores de transcripciones ni rutas de transcripciones JSONL.
- Ejecutor PI integrado: `clean`. Las ejecuciones PI integradas, los workers preparados, Compaction
  y los bucles de reintentos usan el ámbito de sesión SQLite y rechazan identificadores de transcripciones obsoletos.
- Cron: `clean` para la ejecución. La ejecución usa `cron_jobs` y `task_runs` propiedad de Cron;
  las pruebas de ejecución usan nombres SQLite `storeKey`, y las rutas de Cron de la época de los archivos permanecen
  únicamente en las pruebas heredadas de migración de doctor.
- Registro de tareas: `clean`. Las filas de ejecución de tareas y TaskFlow residen en
  `state/openclaw.sqlite`; se han eliminado los importadores SQLite auxiliares que no llegaron a publicarse.
- Estado de los plugins: `clean`. Las filas de estado/blob de los plugins residen en la base de datos global
  compartida; existen protecciones contra los antiguos ayudantes SQLite auxiliares del estado de los plugins.
- Memoria: `sqlite-runtime` para la memoria integrada y la indexación de transcripciones de sesiones.
  Las tablas de índices de memoria residen en la base de datos por agente, el estado de memoria de los plugins usa
  filas compartidas del estado de los plugins, y los archivos de memoria heredados son entradas de migración de doctor
  o contenido del espacio de trabajo del usuario.
- Copia de seguridad: `sqlite-runtime`. La copia de seguridad prepara instantáneas SQLite compactas, omite los archivos auxiliares
  WAL/SHM activos, verifica la integridad de SQLite y registra las ejecuciones de copias de seguridad en la
  base de datos global.
- Configuración del espacio de trabajo: `sqlite-runtime`. La finalización de la configuración, las certificaciones del espacio de trabajo
  y los hashes de arranque generados residen en tablas SQLite compartidas y tipadas. La ejecución
  no lee ni escribe el JSON retirado del espacio de trabajo ni los archivos auxiliares `.attested`;
  doctor es responsable de su importación validada y su eliminación verificada.
- Migración de doctor: `migrating`, de forma intencionada. Doctor importa archivos JSON,
  JSONL y almacenes auxiliares retirados en SQLite, registra las ejecuciones/fuentes de migración
  y elimina las fuentes migradas correctamente.
- Aprobaciones de ejecución: `file-runtime`. TypeScript y macOS todavía leen y escriben el
  `exec-approvals.json` del directorio de estado activo; el esquema reservado
  `exec_approvals_config` aún no tiene un propietario de ejecución. Una transición futura debe
  añadir la importación de doctor en el mismo estado y trasladar ambas ejecuciones conjuntamente.
- Scripts E2E: `clean` para la cobertura de ejecución. La inicialización de Docker MCP escribe filas SQLite.
  El script Docker de contexto de ejecución crea archivos JSONL heredados únicamente dentro de la
  inicialización de migración de doctor y nombra explícitamente la ruta heredada del índice de sesiones.

### Trabajo restante

- [x] Cambiar el nombre de las variables del almacén de pruebas de ejecución de Cron para que no usen `storePath`, salvo que
      sean entradas heredadas de doctor.
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
- [x] Hacer que la inicialización JSONL heredada del contexto de ejecución de Docker sea inequívocamente exclusiva de doctor.
      Archivo: `scripts/e2e/session-runtime-context-docker-client.ts`.
      Prueba: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` muestra únicamente
      `seedBrokenLegacySessionForDoctorMigration`.
- [x] Mantener alineados los tipos generados por Kysely después de cualquier cambio de esquema.
      Archivos: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      Prueba: no hubo cambios de esquema en esta iteración; `pnpm db:kysely:check`;
      `pnpm lint:kysely`.
- [x] Volver a ejecutar las pruebas específicas de los almacenes, comandos y scripts modificados.
      Prueba: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-session.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`.
- [x] Antes de declarar `done`, ejecutar la comprobación de cambios o una prueba amplia remota.
      Prueba: `pnpm check:changed --timed -- <changed extension paths>` se completó correctamente en
      la ejecución `run_3f1cabf6b25c` de Hetzner Crabbox después de la configuración temporal de Node 24/pnpm y
      del enrutamiento explícito de rutas para el espacio de trabajo sincronizado sin `.git`.

### No introducir regresiones

- Ningún localizador de transcripciones.
- Ningún archivo de sesión activo.
- Ningún fixture de prueba JSONL ficticio salvo en las pruebas heredadas de migración de doctor.
- Ningún acceso directo a SQLite donde se espere Kysely.
- Ninguna nueva migración de base de datos de la época de los archivos. El esquema global permanece en la versión `1`.
  El esquema publicado por agente de la versión `1` tiene una única migración de ejecución acotada a la
  versión `2` para identidades estables de fuentes de memoria.

## Suposiciones derivadas de la lectura del código

No hay decisiones de producto posteriores que bloqueen este plan. La implementación debe
continuar con estas suposiciones:

- Usar `node:sqlite` directamente y requerir un entorno de ejecución de Node seguro frente al restablecimiento de WAL
  (22.22.3+, 24.15+ o 25.9+) para esta ruta de almacenamiento.
- Mantener exactamente un archivo de configuración normal. No trasladar la configuración, los manifiestos de plugins
  ni los espacios de trabajo de Git a SQLite en esta refactorización.
- No se requieren archivos de compatibilidad en tiempo de ejecución. Los archivos JSON y JSONL heredados son
  únicamente entradas de migración. Los archivos auxiliares de SQLite locales de la rama nunca se publicaron y se
  eliminan en lugar de importarse.
- `openclaw doctor --fix` es responsable de la migración de archivos heredados a la base de datos. El inicio del entorno de ejecución
  solo es responsable de actualizaciones acotadas entre versiones publicadas del esquema de SQLite;
  no debe importar estados de la era de los archivos.
- La compatibilidad de las credenciales sigue la misma regla: las credenciales en tiempo de ejecución se almacenan en
  SQLite. Los archivos antiguos `auth-profiles.json`, los `auth.json` por agente y los
  `credentials/oauth.json` compartidos son entradas de migración de doctor y después se eliminan
  tras la importación.
- El estado generado del catálogo de modelos está respaldado por la base de datos. El código en tiempo de ejecución no debe escribir
  `agents/<agentId>/agent/models.json`; los archivos `models.json` existentes son entradas heredadas
  de doctor y se eliminan tras importarlos a `agent_model_catalogs`.
- El entorno de ejecución no debe migrar, normalizar ni crear puentes para los localizadores de transcripciones. La identidad de la
  transcripción activa es `{agentId, sessionId}` en SQLite. Las rutas de archivo son
  únicamente entradas heredadas de doctor, y `sqlite-transcript://...` debe desaparecer de
  las superficies del entorno de ejecución, el protocolo, los hooks y los plugins, en lugar de tratarse como un
  identificador de frontera.
- Las lecturas de transcripciones de SQLite en tiempo de ejecución no ejecutan migraciones antiguas de la estructura de entradas JSONL ni
  reescriben transcripciones completas por compatibilidad. La normalización de entradas heredadas permanece en
  utilidades explícitas de doctor/importación. Doctor normaliza los archivos de transcripción JSONL heredados
  antes de insertar filas en SQLite; las filas actuales del entorno de ejecución
  ya se escriben con el esquema actual de transcripciones. La exportación de trayectorias/sesiones
  lee esas filas tal cual y no debe realizar migraciones heredadas durante la exportación.
- Los auxiliares heredados de análisis/migración de transcripciones JSONL son exclusivos de doctor. El código de formato de
  transcripciones en tiempo de ejecución solo crea el contexto actual de transcripciones de SQLite; doctor
  se encarga de actualizar las entradas JSONL antiguas antes de insertar las filas.
- Se eliminó el antiguo auxiliar de transmisión de transcripciones JSONL gestionado por el entorno de ejecución. El código de
  importación de doctor se encarga de las lecturas explícitas de archivos heredados; el historial de sesiones en tiempo de ejecución lee
  filas de SQLite.
- Los enlaces del servidor de aplicaciones de Codex usan el `sessionId` de OpenClaw como clave canónica
  en el espacio de nombres de estado del plugin de Codex. `sessionKey` son metadatos para
  el enrutamiento y la visualización, y no deben reemplazar el id. de sesión persistente ni resucitar
  la identidad basada en archivos de transcripción.
- Los motores de contexto reciben directamente el contrato actual del entorno de ejecución. El registro
  no debe envolver los motores con adaptadores de reintento que eliminen `sessionKey`,
  `transcriptScope` o `prompt`; los motores que no puedan aceptar los parámetros actuales
  que priorizan la base de datos deben fallar de forma explícita en lugar de conectarse mediante un puente.
- El resultado de la copia de seguridad debe seguir siendo un único archivo comprimido. El contenido de la base de datos debe incorporarse
  a ese archivo como instantáneas compactas de SQLite, no como archivos auxiliares WAL activos sin procesar.
- La búsqueda de transcripciones es útil, pero no es obligatoria para la primera versión que prioriza la base de datos.
  Diseñar el esquema de modo que se pueda añadir FTS más adelante.
- La ejecución de workers debe seguir siendo experimental y permanecer tras opciones de configuración mientras se estabiliza la frontera
  de la base de datos.

## Hallazgos de la lectura del código

La rama actual ya ha superado la fase de prueba de concepto. La base de datos
compartida existe, `node:sqlite` de Node está conectado mediante un pequeño auxiliar del entorno de ejecución y
los antiguos almacenes ahora escriben en `state/openclaw.sqlite` o en la base de datos
`openclaw-agent.sqlite` correspondiente.

El trabajo restante no consiste en elegir SQLite, sino en mantener limpia la nueva frontera
y eliminar cualquier interfaz con forma de compatibilidad que aún se parezca al antiguo
mundo de los archivos:

- El `storePath` de sesión ya no es una identidad en tiempo de ejecución, una estructura de accesorio de prueba ni
  un campo de la carga útil de estado. Las pruebas del entorno de ejecución y del puente ya no contienen
  el nombre de contrato `storePath`; el código de doctor/migración es responsable de ese vocabulario heredado.
- Las escrituras de sesión ya no pasan por la antigua cola `store-writer.ts`
  dentro del proceso. Las escrituras de parches de SQLite se preparan fuera de la transacción y después usan una transacción breve
  y síncrona de validación/aplicación con detección explícita de conflictos.
- La detección de rutas heredadas aún tiene usos válidos para la migración, pero el código en tiempo de ejecución debe
  dejar de tratar `sessions.json` y los archivos JSONL de transcripciones como posibles destinos de
  escritura.
- Las tablas propiedad de los agentes se almacenan en bases de datos SQLite por agente. La base de datos global conserva
  las filas del registro/plano de control; la identidad de la transcripción es `{agentId, sessionId}` en
  las filas de transcripciones por agente. El código en tiempo de ejecución no debe conservar rutas de archivos de transcripción
  ni migrar localizadores de transcripciones.
- Doctor ya importa varios archivos heredados. La limpieza consiste en convertir esto en una
  única implementación explícita de migración invocada por doctor, con un informe de migración
  persistente.

No hay más preguntas de producto que bloqueen la implementación.

## Estructura actual del código

La rama ya cuenta con una base SQLite compartida real:

- La versión mínima del entorno de ejecución ahora requiere una compilación de Node segura para el restablecimiento de WAL: 22.22.3+,
  24.15+ o 25.9+. `package.json`, la protección del entorno de ejecución de la CLI, los valores predeterminados del instalador,
  el localizador del entorno de ejecución de macOS, la CI y la documentación pública de instalación coinciden.
- `src/state/openclaw-state-db.ts` abre `openclaw.sqlite`, configura WAL,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON` y aplica
  el módulo de esquema generado derivado de
  `src/state/openclaw-state-schema.sql`.
- Los tipos de tabla de Kysely y los módulos de esquema del entorno de ejecución se generan a partir de bases de datos
  SQLite descartables creadas desde los archivos `.sql` confirmados; el código del entorno de ejecución ya no
  mantiene cadenas de esquema copiadas y pegadas para las bases de datos globales, por agente o de
  captura del proxy.
- Los almacenes del entorno de ejecución derivan los tipos de fila seleccionados e insertados de esas interfaces
  `DB` generadas de Kysely, en lugar de reproducir manualmente las formas de fila de SQLite. El SQL sin procesar
  sigue limitado a la aplicación del esquema, las pragmas y el DDL exclusivo de migraciones.
- El esquema global de SQLite permanece en `user_version = 1`. El esquema por agente
  está en la versión `2`; su función de apertura migra atómicamente la clave de fuente de memoria de la versión publicada `1`
  a una identidad entera estable. La importación de archivos a la base de datos
  permanece en el código de Doctor.
- La propiedad relacional se aplica donde el límite de propiedad es canónico:
  las filas de migración de fuentes se eliminan en cascada desde `migration_runs`, el estado de entrega de tareas
  se elimina en cascada desde `task_runs` y las filas de identidad de transcripciones se eliminan en cascada desde
  los eventos de transcripción.
- Las tablas compartidas actuales incluyen `agent_databases`,
  `auth_profile_stores`, `auth_profile_state`,
  `plugin_state_entries`, `plugin_blob_entries`, `media_blobs`,
  `skill_uploads`, `capture_sessions`, `capture_events`, `capture_blobs`,
  `sandbox_registry_entries`, `cron_jobs`, `commitments`,
  `delivery_queue_entries`, `model_capability_cache`,
  `workspace_setup_state`, `workspace_path_aliases`, `workspace_attestations`,
  `workspace_generated_bootstrap_hashes`, `native_hook_relay_bridges`,
  `current_conversation_bindings`, `plugin_binding_approvals`,
  `tui_last_sessions`, `acp_sessions`, `acp_replay_sessions`,
  `acp_replay_events`, `task_runs`, `task_delivery_state`, `flow_runs`,
  `subagent_runs`, `migration_runs` y `backup_runs`.
- El estado arbitrario propiedad de plugins no recibe tablas tipadas propiedad del host. Los
  plugins instalados usan `plugin_state_entries` para cargas útiles JSON versionadas y
  `plugin_blob_entries` para bytes, con propiedad de espacio de nombres/clave, limpieza por TTL,
  copia de seguridad y registros de migración de plugins. El estado de orquestación de plugins propiedad del host aún puede
  tener tablas tipadas cuando el host posee el contrato de consulta, como
  `plugin_binding_approvals`.
- Las migraciones de plugins son migraciones de datos sobre espacios de nombres propiedad de plugins, no migraciones
  del esquema del host. Un plugin puede migrar sus propias entradas de estado/blob versionadas
  mediante un proveedor de migración, y el host registra el estado de la fuente/ejecución en el
  libro mayor de migraciones normal. Las nuevas instalaciones de plugins no requieren cambiar
  `openclaw-state-schema.sql`, salvo que el propio host asuma la propiedad de un
  nuevo contrato entre plugins.
- `src/state/openclaw-agent-db.ts` abre
  `agents/<agentId>/agent/openclaw-agent.sqlite`, registra la base de datos en la
  base de datos global y posee las tablas locales del agente para sesiones, transcripciones, VFS, artefactos, caché
  e índice de memoria. El descubrimiento compartido del entorno de ejecución ahora consulta el registro
  `agent_databases` con tipos generados, en lugar de volver a implementar esa consulta en cada
  punto de llamada.
- Las bases de datos globales y por agente registran una fila `schema_meta` con el rol de la base de datos,
  la versión del esquema, marcas de tiempo y el identificador del agente para las bases de datos de agentes. La base de datos global
  permanece en `user_version = 1`; las bases de datos por agente usan la versión `2` después de la migración acotada
  de la identidad de fuente de memoria.
- La identidad de sesión por agente ahora tiene una tabla raíz canónica `sessions` cuya clave es
  `session_id`, con `session_key`, `session_scope`, `account_id`,
  `primary_conversation_id`, marcas de tiempo, campos de visualización, metadatos del modelo,
  identificador del arnés y vínculos de elemento primario/generación como columnas consultables. `session_routes`
  es el índice único de ruta activa desde `session_key` hasta la
  `session_id` actual, por lo que una clave de ruta puede pasar a una nueva sesión duradera sin
  hacer que las lecturas frecuentes tengan que elegir entre filas `sessions.session_key` duplicadas. La antigua
  carga útil con forma de compatibilidad `session_entries.entry_json` depende de la
  raíz duradera `session_id` mediante una clave externa; ya no es la única
  representación de una sesión en el nivel del esquema.
- La identidad de conversaciones externas por agente también es relacional:
  `conversations` almacena la identidad normalizada del proveedor/cuenta/conversación, y
  `session_conversations` vincula una sesión de OpenClaw con una o varias conversaciones
  externas. Esto cubre las sesiones de mensajes directos principales compartidas en las que varios pares pueden
  asignarse intencionadamente a una sesión sin introducir información falsa en `session_key`. SQLite también
  exige la unicidad de la identidad natural del proveedor, de modo que la misma tupla
  canal/cuenta/tipo/par/hilo no pueda bifurcarse entre distintos identificadores de conversación.
  Los pares directos principales compartidos se vinculan con un rol `participant`, de modo que una
  sesión de OpenClaw pueda representar varios pares externos de mensajes directos sin relegar
  los pares anteriores a filas relacionadas imprecisas. `sessions.primary_conversation_id` todavía
  apunta al destino de entrega tipado actual. Las columnas cerradas de enrutamiento/estado
  se aplican mediante restricciones `CHECK` de SQLite, en lugar de depender únicamente de
  uniones de TypeScript.
  La proyección de sesiones del entorno de ejecución borra las sombras de enrutamiento de compatibilidad de
  `session_entries.entry_json` antes de aplicar las columnas tipadas de sesión/conversación,
  para que las cargas útiles JSON obsoletas no puedan reactivar destinos de entrega.
  El enrutamiento de anuncios de subagentes también requiere el contexto de entrega tipado de SQLite;
  ya no recurre a los campos de ruta de compatibilidad `SessionEntry`.
  La herencia de entrega explícita `chat.send` del Gateway consulta el contexto de entrega tipado de SQLite
  en lugar de los campos de compatibilidad `origin`/`last*`.
  `tools.effective` también deriva el contexto de proveedor/cuenta/hilo de las filas tipadas
  de entrega/enrutamiento de SQLite, no de sombras obsoletas de entradas de sesión `last*`.
  El contexto de indicaciones de eventos del sistema reconstruye los campos de canal/destino/cuenta/hilo a partir de
  campos de entrega tipados, en lugar de sombras `origin`.
  La función auxiliar compartida `deliveryContextFromSession` y el asignador de sesiones a conversaciones
  ahora ignoran por completo `SessionEntry.origin`; solo los campos de entrega tipados
  y las filas relacionales de conversaciones pueden crear una identidad activa de ruta.
  La normalización de entradas de sesión del entorno de ejecución elimina `origin` antes de conservar o
  proyectar `entry_json`, y los metadatos entrantes escriben campos tipados de canal/chat
  y filas relacionales de conversaciones, en lugar de crear nuevas sombras de origen.
- Los eventos de transcripción, las instantáneas de transcripción y los eventos del entorno de ejecución de trayectorias ahora
  hacen referencia a la raíz canónica por agente `sessions` y se eliminan en cascada al borrar la sesión.
  Las filas de identidad/idempotencia de transcripciones siguen eliminándose en cascada desde la
  fila exacta del evento de transcripción.
- Los índices de memory-core ahora usan tablas explícitas de la base de datos del agente
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks` y
  `memory_embedding_cache`, con `memory_index_state` para controlar los cambios de revisión.
  Los índices laterales opcionales FTS/vector se denominan `memory_index_chunks_fts` y
  `memory_index_chunks_vec`, en lugar de las tablas genéricas `meta`, `files`, `chunks`,
  `chunks_fts` o `chunks_vec`. Los nombres canónicos conservan la forma actual
  de las filas de ruta/fuente y la compatibilidad de incrustaciones serializadas. Estas tablas
  son una caché derivada/de búsqueda, no el almacenamiento canónico de transcripciones; pueden
  eliminarse y reconstruirse a partir de los archivos del espacio de trabajo de memoria y las fuentes configuradas.
  Al abrir un índice de memoria publicado con nombres genéricos, sus metadatos, fuentes,
  fragmentos y caché de incrustaciones se migran a las tablas canónicas; las tablas derivadas
  FTS/vector se reconstruyen con sus nombres canónicos.
- El estado de recuperación de ejecuciones de subagentes ahora reside en filas compartidas tipadas `subagent_runs`
  con claves indexadas de sesión secundaria, solicitante y controladora. El antiguo archivo
  `subagents/runs.json` solo sirve como entrada de limpieza para Doctor. Sus entradas de ejecución son
  un estado de recuperación transitorio, por lo que Doctor registra el comprobante de retirada y
  descarta el archivo sin importarlo. Dado que un archivo no puede demostrar si
  sus entradas están activas u obsoletas después de depurar las filas de SQLite, los operadores
  deben dejar que las ejecuciones activas de la era de archivos concluyan antes de actualizar a través de este límite.
- Las vinculaciones actuales de conversaciones ahora residen en filas compartidas tipadas
  `current_conversation_bindings`, cuya clave es el identificador normalizado de la conversación, con
  columnas de agente/sesión de destino, tipo de conversación, estado, vencimiento y metadatos
  almacenados como columnas relacionales, en lugar de un registro de vinculación opaco duplicado.
  La clave de vinculación duradera incluye el tipo normalizado de conversación para que
  las referencias directas/de grupo/de canal no puedan entrar en conflicto, y SQLite rechaza valores no válidos
  de tipo/estado de vinculación. El antiguo archivo
  `bindings/current-conversations.json` solo sirve como entrada de migración para Doctor.
- La recuperación de la cola de entrega ahora superpone sobre el JSON de reproducción columnas tipadas de cola
  para canal, destino, cuenta, sesión, reintento, error, envío de plataforma y estado de recuperación.
  `entry_json` conserva las cargas útiles de reproducción, los hooks y la carga útil de formato,
  pero las columnas tipadas son la fuente autoritativa para el enrutamiento/estado activo de la cola.
- Los punteros de restauración de la última sesión de la TUI ahora residen en filas compartidas tipadas
  `tui_last_sessions`, cuya clave es el hash del ámbito de conexión/sesión de la TUI.
  El entorno de ejecución solo lee y escribe en SQLite, actualiza o inserta atómicamente cada ámbito y
  excluye las sesiones de Heartbeat. `openclaw doctor --fix` valida estrictamente el
  antiguo archivo JSON de la TUI, conserva las filas más recientes de SQLite, verifica el resultado canónico
  y elimina el archivo heredado sin cambios, en lugar de dejar un archivo de respaldo.
- Los hashes de despliegue de comandos de Discord ahora residen en el almacén SQLite compartido
  de estado de plugins. El entorno de ejecución solo lee y escribe claves exactas delimitadas por aplicación. Doctor
  elimina el archivo heredado reconstruible `discord/command-deploy-cache.json`
  sin importarlo, para que el siguiente inicio realice una única conciliación canónica.
- Las preferencias predeterminadas de TTS ahora residen en filas SQLite compartidas de estado de plugins, bajo la clave del
  plugin `speech-core`. El antiguo archivo `settings/tts.json` solo sirve como entrada de migración
  para Doctor; el entorno de ejecución ya no lee ni escribe archivos JSON de preferencias de TTS, y el
  solucionador de rutas heredadas reside en el módulo de migración de Doctor.
- Los metadatos de destinos de secretos ahora se refieren a almacenes, en lugar de fingir que cada
  destino de credenciales es un archivo de configuración. `openclaw.json` sigue siendo el almacén de configuración;
  los destinos de perfiles de autenticación usan filas SQLite tipadas `auth_profile_stores`, con
  credenciales adaptadas al proveedor conservadas como cargas útiles JSON.
- La auditoría de secretos ya no analiza los archivos retirados por agente `auth.json`. Doctor se encarga de
  advertir sobre ese archivo heredado, importarlo y eliminarlo.
- Las funciones auxiliares de rutas de perfiles de autenticación heredados ahora residen en el código heredado de Doctor. Las funciones auxiliares
  principales de rutas de perfiles de autenticación exponen la identidad del almacén de autenticación SQLite y las ubicaciones de visualización,
  no las rutas del entorno de ejecución `auth-profiles.json` o `auth-state.json`.
- Los módulos del entorno de ejecución para la recuperación de ejecuciones de subagentes y la caché de capacidades de modelos de OpenRouter
  ahora mantienen los lectores/escritores de instantáneas SQLite separados de las funciones auxiliares de importación de JSON heredado
  exclusivas de Doctor. Las capacidades de OpenRouter usan las filas genéricas tipadas
  `model_capability_cache` bajo `provider_id = "openrouter"`, en lugar de
  una carga útil de caché opaca o una tabla del host específica del proveedor. El valor `taskName`
  de la ejecución de subagente se almacena en la columna tipada `subagent_runs.task_name`; la
  copia `payload_json` contiene datos de reproducción/depuración, no es la fuente de los campos activos de visualización o
  búsqueda.
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` implementa un VFS de SQLite
  sobre la tabla `vfs_entries` de la base de datos del agente. Las lecturas de directorios, exportaciones
  recursivas, eliminaciones y cambios de nombre usan intervalos de prefijos indexados `(namespace, path)`,
  en lugar de recorrer un espacio de nombres completo o depender de la coincidencia de rutas `LIKE`.
- `src/agents/runtime-worker.entry.ts` crea almacenes por ejecución de VFS de SQLite, artefactos de herramientas,
  artefactos de ejecución y caché con ámbito para los workers.
- La finalización de la inicialización del espacio de trabajo, la vigencia de la atestación y los hashes
  de inicialización generados ahora residen en filas compartidas con tipos `workspace_setup_state`,
  `workspace_path_aliases`, `workspace_attestations` y
  `workspace_generated_bootstrap_hashes`, cuyas claves se basan en la identidad canónica
  del espacio de trabajo. Los alias léxicos y de rutas reales persistentes mantienen estable la
  protección de espacios de trabajo desaparecidos después de que desaparezca un enlace simbólico configurado; los alias
  redirigidos producen un fallo seguro. El entorno de ejecución ya no lee ni escribe
  `openclaw-workspace-state.json`, `.openclaw/workspace-state.json`, `workspace-attestations/*.attested`
  del directorio de estado ni archivos auxiliares `<workspace>.attested`
  adyacentes. `openclaw doctor --fix` valida y reclama las fuentes heredadas,
  las importa en SQLite con recibos de migración, verifica las filas
  canónicas y solo entonces elimina los archivos reclamados.
- El esquema compartido reserva una fila singleton `exec_approvals_config`, pero la
  transición del entorno de ejecución sigue pendiente. TypeScript y la aplicación complementaria de macOS aún usan
  el archivo JSON con ámbito de estado y deben migrar juntos a SQLite.
- La identidad de dispositivo de TypeScript ahora usa filas con tipos `device_identities`, y
  la importación de JSON heredado exclusiva de Doctor se mantiene fuera del propietario del entorno de ejecución. La autenticación del dispositivo
  sigue respaldada por archivos a la espera de una migración coordinada del esquema y entre entornos de ejecución;
  `device_auth_tokens` permanece reservado para ese trabajo posterior.
- La caché de intercambio de tokens de GitHub Copilot usa la tabla compartida de estado de plugins de SQLite
  bajo `github-copilot/token-cache/default`. Es un estado de caché propiedad del proveedor,
  por lo que intencionadamente no añade una tabla al esquema del host.
- La Compaction de GitHub Copilot ya no escribe archivos auxiliares de espacio de trabajo
  `openclaw-compaction-*.json`. El arnés llama al RPC de Compaction del historial del SDK para la
  sesión del SDK que se está siguiendo, y OpenClaw mantiene el estado duradero de sesión y transcripción en
  SQLite en lugar de archivos marcadores de compatibilidad.
- El entorno de ejecución compartido de Swift (`OpenClawKit`) usa la misma
  estructura `state/openclaw.sqlite#table/device_identities` y las mismas claves de fila para la identidad
  del dispositivo. El propietario de la migración de Swift importa los archivos heredados de contenedores de Apple
  porque Doctor de TypeScript no puede acceder a esos contenedores. La autenticación de dispositivos de Swift
  sigue respaldada por archivos para el trabajo coordinado posterior sobre autenticación.
- La identidad del dispositivo Android y la autenticación de dispositivo almacenada en caché siguen siendo almacenes locales de la aplicación. Requieren
  una migración independiente propiedad de Android; las declaraciones de SQLite del host no
  describen el comportamiento actual de Android.
- El historial de paquetes recientes de notificaciones de Android usa filas con tipos
  `android_notification_recent_packages`. El entorno de ejecución ya no migra ni
  lee las antiguas claves CSV de SharedPreferences.
- La creación de la identidad del dispositivo produce un fallo seguro cuando existe el archivo heredado `identity/device.json`,
  cuando la fila de identidad de SQLite no es válida o cuando no se puede abrir el almacén de identidad
  de SQLite. Doctor importa y elimina primero ese archivo, por lo que el inicio del entorno de ejecución
  no puede rotar silenciosamente la identidad de emparejamiento antes de la migración.
- La selección de la identidad del dispositivo es una clave de fila de SQLite, no un localizador de archivos JSON. Las pruebas
  y los auxiliares del Gateway pasan claves de identidad explícitas; solo la migración de Doctor y la
  barrera de inicio con fallo seguro conocen el nombre de archivo retirado `identity/device.json`.
- La compatibilidad del restablecimiento de sesiones ahora reside en la migración de configuración de Doctor:
  `session.idleMinutes` se traslada a `session.reset.idleMinutes`,
  `session.resetByType.dm` se traslada a `session.resetByType.direct`, y la
  política de restablecimiento del entorno de ejecución solo lee claves de restablecimiento canónicas.
- La compatibilidad con la configuración heredada ahora reside bajo `src/commands/doctor/`. La validación
  normal de `readConfigFileSnapshot()` no importa detectores de elementos heredados de Doctor
  ni anota problemas heredados; `runDoctorConfigPreflight()` añade esos problemas para
  que Doctor los repare o informe sobre ellos. El flujo de configuración de Doctor importa
  `src/commands/doctor/legacy-config.ts`, y la reparación de identificadores de perfiles OAuth antiguos reside
  bajo
  `src/commands/doctor/legacy/oauth-profile-ids.ts`.
- Los comandos distintos de Doctor no ejecutan automáticamente la reparación de la configuración heredada. Por ejemplo,
  `openclaw update --channel` ahora falla ante una configuración heredada no válida y solicita al
  usuario que ejecute Doctor, en lugar de importar silenciosamente código de migración de Doctor.
- Web push, APNs, Voice Wake, las comprobaciones de actualizaciones y el estado de la configuración ahora usan tablas compartidas con tipos de SQLite
  para suscripciones, claves VAPID, registros de nodos, filas de activadores,
  filas de enrutamiento, estado de notificaciones de actualización y entradas de estado de configuración, en lugar de
  blobs JSON opacos completos. Las escrituras de Web Push y APNs solo realizan una inserción o actualización de la fila
  de clave primaria afectada; el estado de configuración se concilia por ruta de configuración. Sus módulos del entorno de ejecución
  permanecen separados de los auxiliares de importación de JSON heredado exclusivos de Doctor.
- El entorno de ejecución de APNs solo lee y escribe `apns_registrations`. La operación explícita
  `openclaw doctor --fix` importa estrictamente el elemento retirado
  `push/apns-registrations.json`, conserva las filas canónicas existentes, verifica
  la transacción, registra un recibo y elimina el JSON que contiene secretos.
  Los reintentos respaldados por recibos solo realizan la limpieza, mientras que
  `apns_registration_tombstones` cubren las invalidaciones anteriores a la primera reparación, para que
  las concesiones obsoletas del relé o los tokens de dispositivo no puedan reaparecer.
- La configuración del host del nodo ahora usa una fila singleton con tipos en la base de datos compartida de SQLite.
  El entorno de ejecución produce un fallo seguro mientras permanezcan el archivo antiguo `node.json` o una reclamación interrumpida;
  la operación explícita `openclaw doctor --fix` lo importa estrictamente y lo elimina
  antes del uso normal del entorno de ejecución.
- El emparejamiento de dispositivos y nodos, el emparejamiento de canales, las listas de permitidos de canales y el estado de inicialización
  ahora usan filas con tipos de SQLite en lugar de blobs JSON opacos completos. Las aprobaciones de vinculaciones de
  plugins y el estado de trabajos de Cron siguen la misma separación: los módulos del entorno de ejecución exponen
  operaciones respaldadas por SQLite y auxiliares neutrales de instantáneas; además, las escrituras de instantáneas de
  emparejamiento/inicialización y de aprobación de vinculaciones de plugins concilian las filas por clave primaria
  en lugar de truncar tablas, mientras Doctor importa y elimina los archivos JSON antiguos mediante
  módulos `src/commands/doctor/legacy/*`.
- Los registros de plugins instalados ahora residen en el índice de plugins instalados de SQLite.
  La lectura y escritura de la configuración del entorno de ejecución ya no migra ni conserva los antiguos
  datos de configuración creados de `plugins.installs`; Doctor importa esa estructura de configuración
  heredada en SQLite antes del uso normal del entorno de ejecución.
- Las instantáneas de recuperación de credenciales de QQBot ahora residen en el estado de plugins de SQLite bajo
  `qqbot/credential-backups`. El entorno de ejecución ya no escribe
  `qqbot/data/credential-backup*.json`; el contrato de Doctor de QQBot importa y
  archiva esos archivos de copia de seguridad heredados desde el directorio de estado activo.
- La planificación de recarga del Gateway compara instantáneas del índice de plugins instalados de SQLite bajo
  un espacio de nombres interno de diferencias `installedPluginIndex.installRecords.*`. Las decisiones de
  recarga del entorno de ejecución ya no envuelven esas filas en objetos de configuración `plugins.installs`
  falsos.
- Las credenciales de las cuentas de Matrix ahora residen en el estado de plugins de SQLite. El entorno de ejecución solo lee
  ese almacén canónico; Doctor importa, verifica y archiva los archivos retirados
  `credentials/matrix/credentials*.json` cuando se puede resolver su cuenta.
- Los módulos principales del entorno de ejecución de emparejamiento y Cron ya no usan constructores heredados de rutas JSON.
  El auxiliar obsoleto del SDK para rutas de emparejamiento se mantiene únicamente como compatibilidad de migración;
  la migración de estado de Doctor es propietaria de sus lecturas e importaciones de archivos. Los módulos heredados
  propiedad de Doctor construyen las rutas de origen `pending.json`, `paired.json`, `bootstrap.json` y
  `cron/jobs.json` únicamente para pruebas de importación y migración. La normalización de
  estructuras heredadas de trabajos de Cron y la importación del historial JSONL residen bajo
  `src/commands/doctor/cron/`; la finalización del historial heredado de SQLite se ejecuta al
  abrir la base de datos de estado.
- `src/commands/doctor/legacy/runtime-state.ts` importa desde Doctor archivos de estado
  JSON heredados, incluida la configuración del host del nodo, a SQLite. Los nuevos importadores de archivos
  heredados permanecen bajo `src/commands/doctor/legacy/`.
- `src/commands/doctor/state-migrations.ts` importa las transcripciones heredadas `sessions.json` y
  `*.jsonl` directamente en SQLite y elimina las fuentes importadas correctamente. Ya
  no prepara las transcripciones heredadas de la raíz mediante
  `agents/<agentId>/sessions/*.jsonl` ni crea un destino JSONL canónico antes de
  la importación.
- Las comprobaciones de Doctor sobre la integridad del estado ya no examinan directorios de sesiones heredados ni
  ofrecen la eliminación de archivos JSONL huérfanos. Los archivos de transcripción heredados son únicamente entradas
  de migración, y el paso de migración es responsable de la importación y de la eliminación de las fuentes.
- La importación del registro heredado del entorno aislado reside bajo
  `src/commands/doctor/legacy/sandbox-registry.ts`; las lecturas y escrituras activas del registro del entorno aislado
  siguen realizándose únicamente en SQLite.
- La reparación de estado e importación de transcripciones de sesiones heredadas reside bajo
  `src/commands/doctor/legacy/session-transcript-health.ts`; los módulos de comandos del entorno de ejecución
  ya no contienen análisis de transcripciones JSONL ni código de reparación de ramas activas.

Aspectos destacados de la consolidación/eliminación completadas:

- El estado del Plugin ahora usa la base de datos compartida `state/openclaw.sqlite`. El antiguo
  importador de archivo auxiliar `plugin-state/state.sqlite` local de la rama se eliminó porque
  ese diseño de SQLite nunca se publicó. Los auxiliares de sondeo/prueba informan de la
  `databasePath` compartida en lugar de exponer una ruta de SQLite específica del estado del Plugin.
- Las tablas de tiempo de ejecución de tareas y flujos de tareas ahora residen en la base de datos
  compartida `state/openclaw.sqlite` en lugar de `tasks/runs.sqlite` y
  `tasks/flows/registry.sqlite`; los antiguos importadores de archivos auxiliares se eliminaron por el
  mismo motivo de que el diseño no se publicó.
- `src/config/sessions/store.ts` ya no necesita `storePath` para los metadatos
  entrantes, las actualizaciones de rutas ni las lecturas de la fecha de actualización. La persistencia de comandos, la
  limpieza de sesiones de la CLI, la profundidad de los subagentes, las anulaciones de autenticación y la identidad
  de sesión de la transcripción usan las API de filas de agentes/sesiones. Las escrituras se aplican como parches de filas de SQLite
  con reintentos ante conflictos optimistas.
- La resolución del destino de sesión ahora expone destinos de base de datos por agente, no rutas
  `sessions.json` heredadas. El Gateway compartido, los metadatos de ACP, la reparación de rutas de doctor y
  `openclaw sessions` enumeran `agent_databases` junto con los agentes configurados.
- El enrutamiento de sesiones del Gateway ahora usa `resolveGatewaySessionDatabaseTarget`; el
  destino devuelto contiene `databasePath` y claves candidatas de filas de SQLite en lugar
  de una ruta de archivo heredada del almacén de sesiones.
- Los tipos de tiempo de ejecución de sesión de canales ahora exponen `{agentId, sessionKey}` para
  las lecturas de la fecha de actualización, los metadatos entrantes y las actualizaciones de la última ruta. El antiguo
  tipo de compatibilidad `saveSessionStore(storePath, store)` ya no existe.
- Las superficies de sesión del tiempo de ejecución de plugins, la API de extensiones y el SDK de plugins ahora exponen
  auxiliares de filas de sesión respaldados por SQLite en lugar de auxiliares de compatibilidad de
  archivos/almacenes completos de sesiones activas. Las exportaciones de compatibilidad de la biblioteca raíz siguen disponibles
  únicamente fuera del SDK de plugins para llamadores internos heredados y de migración. El antiguo
  auxiliar `resolveLegacySessionStorePath` ya no existe; la construcción de rutas heredadas `sessions.json`
  ahora es local de las migraciones y los accesorios de prueba.
- `src/config/sessions/session-entries.sqlite.ts` ahora almacena entradas de sesión
  canónicas en la base de datos por agente y admite parches de lectura/inserción o actualización/eliminación
  a nivel de fila. La inserción o actualización, los parches y la eliminación en tiempo de ejecución ya no buscan variantes de mayúsculas y minúsculas ni
  depuran claves de alias heredadas; doctor se encarga de la canonicalización. El
  auxiliar independiente de importación de JSON ya no existe, y las inserciones o actualizaciones combinadas de la migración conservan las filas más recientes
  en lugar de sustituir toda la tabla de sesiones. Los auxiliares públicos de lectura/listado/carga
  proyectan metadatos activos de sesión desde filas tipadas `sessions` y `conversations`;
  `entry_json` es una sombra de compatibilidad/depuración y puede estar obsoleta o no ser válida
  sin perder la identidad tipada de la sesión ni el contexto de entrega.
- `src/config/sessions/delivery-info.ts` ahora resuelve el contexto de entrega a partir de las
  filas tipadas por agente `sessions` + `conversations` + `session_conversations`.
  Ya no reconstruye la identidad de entrega en tiempo de ejecución a partir de
  `session_entries.entry_json`; la ausencia de una fila tipada de conversación es un problema de
  migración/reparación de doctor, no una alternativa en tiempo de ejecución.
- Las decisiones de restablecimiento de sesiones almacenadas ahora prefieren los metadatos tipados `sessions.session_scope`,
  `sessions.chat_type` y `sessions.channel`. El análisis de `sessionKey`
  se mantiene únicamente para sufijos explícitos de hilos/temas en destinos de comandos; la clasificación del
  restablecimiento como grupal o directo ya no se obtiene de la forma de la clave.
- La clasificación de visualización de listas/estados de sesiones ahora usa metadatos tipados de chat y
  el tipo de sesión del Gateway. Ya no trata las subcadenas `:group:` o `:channel:`
  dentro de `session_key` como una fuente duradera de verdad sobre si es grupal o directa.
- La selección de la política de respuesta silenciosa ahora usa únicamente el tipo explícito de conversación o los
  metadatos de la superficie. Ya no deduce la política directa/grupal a partir de
  subcadenas de `session_key`.
- La resolución del modelo de visualización de sesiones ahora recibe el id. del agente desde el destino de la
  base de datos de sesiones de SQLite en lugar de extraerlo dividiendo `session_key`.
- La hidratación del destino de anuncios entre agentes ahora usa únicamente `sessions.list`
  `deliveryContext` tipados. Ya no recupera el enrutamiento de canal/cuenta/hilo
  desde `origin` heredado, campos `last*` reflejados ni la forma de `session_key`.
- El rechazo de destinos de hilo de `sessions_send` ahora lee metadatos tipados de enrutamiento
  de SQLite. Ya no rechaza ni acepta destinos analizando sufijos de hilo
  en la clave de destino.
- La validación de políticas de herramientas con ámbito de grupo ahora lee el enrutamiento tipado de conversaciones
  de SQLite para la sesión actual o generada. Ya no confía en la identidad de grupo/canal
  decodificando `sessionKey`; los id. de grupo proporcionados por el llamador se descartan cuando
  ninguna fila tipada de sesión los avala.
- La coincidencia de anulaciones de modelos de canales ahora usa metadatos explícitos de la
  conversación grupal y principal. Ya no decodifica los id. de conversaciones principales desde
  `parentSessionKey`.
- La herencia de anulaciones de modelos almacenadas ahora requiere una clave explícita de sesión principal
  procedente del contexto tipado de sesión. Ya no deriva las anulaciones principales de
  los sufijos `:thread:` o `:topic:` de `sessionKey`.
- El antiguo contenedor de información de hilos de sesión y el analizador de hilos de plugins cargados ya no existen;
  ningún código de tiempo de ejecución importa `config/sessions/thread-info`.
- El auxiliar de conversaciones de canales ya no expone puentes de análisis de claves
  de sesión completas. El núcleo sigue normalizando los id. sin procesar de conversaciones propiedad del proveedor mediante
  `resolveSessionConversation(...)`, pero no reconstruye los datos de las rutas
  desde `sessionKey`.
- La entrega de finalizaciones, la política de envío y el mantenimiento de tareas ya no derivan el tipo de chat
  de la forma de `session_key`. El antiguo analizador de claves de tipo de chat se eliminó;
  estas rutas requieren metadatos tipados de sesión, contexto tipado de entrega o
  vocabulario explícito de destinos de entrega.
- Las listas/estados de sesiones, los diagnósticos, la vinculación de cuentas de aprobación, el filtrado de Heartbeat
  de la TUI y los resúmenes de uso ya no extraen de `SessionEntry.origin`
  información de enrutamiento de proveedor/cuenta/hilo/visualización. Las únicas lecturas restantes en tiempo de ejecución
  de `origin` corresponden a conceptos ajenos a las sesiones u objetos de entrega del turno actual.
- La búsqueda de conversaciones nativas para solicitudes de aprobación ahora lee filas tipadas de enrutamiento
  de sesiones por agente. Ya no analiza la identidad de conversación de canal/grupo/hilo
  desde `sessionKey`; la ausencia de metadatos tipados es un problema de migración/reparación.
- Las cargas útiles de eventos de cambio/chat/sesión de sesiones del Gateway ya no replican
  sombras de ruta `SessionEntry.origin` ni `last*`; los clientes reciben
  `channel`, `chatType` y `deliveryContext` tipados.
- La resolución de entrega de Heartbeat ahora puede recibir directamente el
  `deliveryContext` tipado de SQLite, y el tiempo de ejecución de Heartbeat pasa la fila de entrega
  de sesión por agente en lugar de depender de sombras de compatibilidad `session_entries`
  para el enrutamiento actual.
- La resolución del destino de entrega del agente aislado de Cron también hidrata su ruta
  actual desde la fila tipada de entrega de sesión por agente antes de recurrir a la
  carga útil de entrada de compatibilidad.
- La resolución del origen de anuncios de subagentes ahora transmite el contexto tipado de entrega
  de la sesión solicitante mediante `loadRequesterSessionEntry` y prefiere esa fila a las
  sombras de compatibilidad `last*`/`deliveryContext`.
- Las actualizaciones de metadatos de sesiones entrantes ahora se combinan primero con la fila tipada de
  entrega por agente; los antiguos campos de entrega `SessionEntry` son solo la alternativa
  cuando no existe ninguna fila tipada de conversación.
- La extracción de entrega de reinicio/actualización ahora da prioridad a la
  `threadId` de entrega tipada de SQLite sobre los fragmentos de tema/hilo analizados desde `sessionKey`; el análisis
  es solo una alternativa para claves heredadas con forma de hilo.
- Los id. de canal del contexto de agentes de hooks ahora prefieren la identidad tipada de conversación de SQLite
  y, después, los metadatos explícitos del mensaje. Ya no analizan fragmentos de proveedor/grupo/canal
  desde `sessionKey`.
- La herencia de rutas externas de `chat.send` del Gateway ahora lee metadatos tipados de enrutamiento de sesiones
  de SQLite en lugar de inferir el ámbito de canal/directo/grupo a partir de
  fragmentos de `sessionKey`. Las sesiones con ámbito de canal solo heredan cuando el canal
  tipado de la sesión y el tipo de chat coinciden con el contexto de entrega almacenado; las sesiones
  principales compartidas mantienen su regla más estricta de CLI/sin metadatos del cliente.
- La activación mediante el centinela de reinicio y el enrutamiento de continuaciones ahora leen las filas tipadas de
  entrega/enrutamiento de SQLite antes de poner en cola activaciones de Heartbeat o continuaciones
  enrutadas de turnos de agente. Ya no reconstruyen el contexto de entrega a partir de la
  sombra JSON de la entrada de sesión.
- La resolución de contexto de `tools.effective` del Gateway ahora lee filas tipadas de
  entrega/enrutamiento de SQLite para las entradas de proveedor, cuenta, destino, hilo y modo de
  respuesta. Ya no recupera esos campos activos de enrutamiento de sombras de origen
  `session_entries.entry_json` obsoletas.
- El enrutamiento de consultas de voz en tiempo real ahora resuelve la entrega principal/de llamada a partir de filas tipadas
  por agente de sesiones de SQLite. Ya no recurre a sombras de compatibilidad
  `SessionEntry.deliveryContext` al elegir la ruta de mensajes del agente
  integrado.
- La retransmisión de Heartbeat de generación de ACP y el enrutamiento del flujo principal ahora leen la entrega principal
  desde filas tipadas de sesiones de SQLite. Ya no reconstruyen el contexto de entrega
  principal a partir de sombras de compatibilidad de entradas de sesión.
- La conservación de rutas de entrega de sesiones ahora sigue metadatos tipados de chat y
  columnas de entrega persistentes. Ya no extrae indicios de canal, marcadores
  directos/principales ni la forma del hilo desde `sessionKey`; las rutas internas de chat web solo
  heredan un destino externo cuando SQLite ya contiene una identidad de entrega
  tipada/persistente para la sesión.
- La extracción genérica de entrega de sesiones ahora lee únicamente la fila tipada exacta de
  entrega de sesión de SQLite. Ya no analiza sufijos de hilo/tema ni recurre
  desde una clave con forma de hilo a una clave de sesión base.
- El despacho de respuestas, la recuperación del centinela de reinicio y el enrutamiento de consultas de voz en tiempo real
  ahora usan filas tipadas exactas de sesión/conversación de SQLite para el enrutamiento de hilos. Ya
  no recuperan id. de hilos ni el contexto de entrega de sesiones base analizando
  claves de sesión con forma de hilo.
- La limitación del historial de PI integrado ahora usa la proyección tipada de enrutamiento
  de sesiones de SQLite (`sessions` + `conversations` principal) para el proveedor, el tipo de chat
  y la identidad del par. Ya no analiza la forma del proveedor, mensaje directo, grupo o hilo
  a partir de `sessionKey`.
- La inferencia de entrega de la herramienta Cron ahora usa únicamente una entrega explícita o el contexto
  tipado de entrega actual. Ya no decodifica destinos de canal, par, cuenta o hilo
  desde `agentSessionKey`.
- Las filas de sesión en tiempo de ejecución ya no contienen el antiguo alias de ruta `lastProvider`.
  Los auxiliares y las pruebas usan los campos tipados `lastChannel` y `deliveryContext`;
  la migración de doctor es el único lugar que debe traducir alias de rutas antiguos
  o sombras `origin` persistentes.
- Los eventos de transcripción, las filas de VFS y las filas de artefactos de herramientas ahora se escriben en la base de datos
  por agente. La tabla global no publicada de asignación de archivos de transcripción ya no existe; doctor
  registra en su lugar las rutas de origen heredadas en filas duraderas de migración.
- La búsqueda de transcripciones en tiempo de ejecución ya no examina desplazamientos de bytes de JSONL ni sondea archivos
  de transcripciones heredados. Las rutas de chat/multimedia/historial del Gateway leen filas de transcripciones desde
  SQLite; el JSONL de sesiones ahora es solo una entrada heredada de doctor, no un estado
  de tiempo de ejecución ni un formato de exportación.
- Las relaciones principales y de ramificación de las transcripciones usan metadatos estructurados
  `parentTranscriptScope: {agentId, sessionId}` en las cabeceras de transcripciones de SQLite,
  no cadenas de localizador `agent-db:...transcript_events...` con forma de ruta.
- El contrato del administrador de transcripciones ya no expone constructores persistentes implícitos
  `create(cwd)` ni `continueRecent(cwd)`. Los administradores de transcripciones
  persistentes se abren con un ámbito `{agentId, sessionId}` explícito; solo
  los gestores en memoria siguen sin ámbito para las pruebas y las transformaciones puras de transcripciones.
- Las API del almacén de transcripciones en tiempo de ejecución resuelven el ámbito de SQLite, no rutas del sistema de archivos. El
  antiguo asistente `resolve...ForPath` y las opciones de escritura `transcriptPath` sin usar
  se han eliminado de los llamadores en tiempo de ejecución.
- La resolución de sesiones en tiempo de ejecución ahora usa `{agentId, sessionId}` y no debe derivar
  cadenas `sqlite-transcript://<agent>/<session>` para límites externos.
  Las rutas JSONL absolutas heredadas son únicamente entradas de migración para doctor.
- Los registros de puente directo del relé de hooks nativos ahora residen en filas compartidas
  tipadas `native_hook_relay_bridges` cuya clave es el id del relé. El tiempo de ejecución ya no escribe un
  registro JSON `/tmp` ni registros genéricos opacos para esos registros de puente
  de corta duración.
- `runEmbeddedPiAgent(...)` ya no tiene un parámetro localizador de transcripción.
  Los descriptores de workers preparados también omiten los localizadores de transcripción. El estado
  de sesión en tiempo de ejecución y las ejecuciones de seguimiento en cola llevan `{agentId, sessionId}` en lugar de
  identificadores de transcripción derivados.
- La Compaction integrada ahora toma el ámbito de SQLite de `agentId` y `sessionId`.
  Los hooks de Compaction, las llamadas al motor de contexto, la delegación de la CLI y las respuestas del protocolo
  no deben recibir identificadores `sqlite-transcript://...` derivados. El código de exportación/depuración
  puede materializar artefactos explícitos del usuario a partir de filas, pero no proporciona una
  ruta genérica de exportación JSONL de sesión ni vuelve a introducir nombres de archivos en la
  identidad en tiempo de ejecución.
- `/export-session` lee filas de transcripción de SQLite y escribe únicamente la vista
  HTML independiente solicitada. El visor integrado ya no reconstruye ni
  descarga el JSONL de sesión a partir de esas filas.
- La delegación del motor de contexto ya no analiza un localizador de transcripción para recuperar
  la identidad del agente. El contexto preparado en tiempo de ejecución lleva el `agentId` resuelto
  al adaptador de Compaction integrado.
- La reescritura de transcripciones y el truncamiento en directo de resultados de herramientas ahora leen y conservan
  el estado de la transcripción mediante `{agentId, sessionId}` y no derivan localizadores
  temporales para las cargas útiles de eventos de actualización de transcripciones.
- La superficie de asistentes del estado de transcripción ya no tiene variantes basadas en localizadores
  `readTranscriptState`, `replaceTranscriptStateEvents` ni
  `persistTranscriptStateMutation`. Los llamadores en tiempo de ejecución deben usar las
  API `{agentId, sessionId}`. La importación de doctor lee archivos heredados mediante una ruta de archivo
  explícita y escribe filas de SQLite; no migra cadenas de localizadores.
- El contrato del gestor de sesiones en tiempo de ejecución ya no expone `open(locator)`,
  `forkFrom(locator)` ni `setTranscriptLocator(...)`. Los gestores de sesiones
  persistentes se abren únicamente mediante `{agentId, sessionId}`; los asistentes de listado/bifurcación residen en
  API de sesiones y puntos de control orientadas a filas, en lugar de en la fachada del gestor
  de transcripciones.
- Las API del lector de transcripciones del Gateway priorizan el ámbito. Reciben
  `{agentId, sessionId}` y no aceptan un localizador de transcripción posicional que
  pudiera convertirse accidentalmente en identidad en tiempo de ejecución. Se ha eliminado el análisis de localizadores
  de transcripciones activas; el código de importación de doctor es el único que lee rutas de origen heredadas.
- Los eventos de actualización de transcripciones también priorizan el ámbito. `emitSessionTranscriptUpdate`
  ya no acepta una cadena de localizador sin procesar, y los receptores enrutan mediante
  `{agentId, sessionId}` sin analizar un identificador.
- La difusión de mensajes de sesión del Gateway resuelve las claves de sesión a partir del ámbito
  de agente/sesión, no de un localizador de transcripción. Se ha eliminado el antiguo
  solucionador/caché de claves de sesión a partir de localizadores de transcripción.
- Los filtros SSE del historial de sesiones del Gateway filtran las actualizaciones en directo por ámbito
  de agente/sesión. Ya no normalizan candidatos a localizador de transcripción, rutas reales
  ni identidades de transcripción con forma de archivo para decidir si un flujo debe recibir
  una actualización.
- Los hooks del ciclo de vida de sesión ya no derivan ni exponen localizadores de transcripción en
  `session_end`. Los consumidores de hooks reciben `sessionId`, `sessionKey`, ids de la
  sesión siguiente y contexto del agente; los archivos de transcripción no forman parte del contrato
  del ciclo de vida.
- Los hooks de restablecimiento tampoco derivan ni exponen localizadores de transcripción. La carga útil
  `before_reset` lleva los mensajes de SQLite recuperados junto con el motivo del restablecimiento,
  mientras que la identidad de sesión permanece en el contexto del hook.
- El restablecimiento del arnés del agente ya no acepta un localizador de transcripción. El envío del restablecimiento
  se delimita mediante `sessionId`/`sessionKey` más el motivo.
- Los tipos de sesión de extensiones del agente ya no exponen `transcriptLocator`; las extensiones
  deben usar el contexto de sesión y las API en tiempo de ejecución en lugar de recurrir a una
  identidad de transcripción con forma de archivo.
- Los hooks de Compaction de plugins ya no exponen localizadores de transcripción. El contexto del hook
  ya lleva la identidad de sesión, y las lecturas de transcripciones deben pasar por API de SQLite
  conscientes del ámbito, en lugar de por identificadores con forma de archivo.
- Los hooks `before_agent_finalize` ya no exponen `transcriptPath`, incluidas
  las cargas útiles del relé de hooks nativos. Los hooks de finalización usan únicamente el contexto de sesión.
- Las respuestas de restablecimiento del Gateway ya no sintetizan un localizador de transcripción en la
  entrada devuelta. El restablecimiento crea filas de transcripción de SQLite, devuelve la entrada
  de sesión limpia y deja el acceso a la transcripción en manos de lectores conscientes del ámbito.
- Los resultados de ejecuciones integradas y de Compaction ya no muestran localizadores de transcripción para
  la contabilidad de sesiones. La Compaction automática solo actualiza el `sessionId` activo,
  los contadores de Compaction y los metadatos de tokens.
- Los resultados de intentos integrados ya no devuelven `transcriptLocatorUsed`, y
  los resultados `compact()` del motor de contexto ya no devuelven localizadores de transcripción.
  Los bucles de reintento en tiempo de ejecución solo aceptan un `sessionId` sucesor.
- Los resultados de adición de transcripciones del espejo de entrega ya no devuelven localizadores de
  transcripción. Los llamadores reciben el `messageId` añadido; las señales de actualización de transcripciones usan
  el ámbito de SQLite.
- Los asistentes de bifurcación de sesiones principales devuelven únicamente el `sessionId` bifurcado. La preparación
  de subagentes pasa a los motores el ámbito de agente/sesión secundario.
- Los parámetros del ejecutor de la CLI y la reinicialización del historial ya no aceptan localizadores de transcripción.
  Las lecturas del historial de la CLI resuelven el ámbito de transcripción de SQLite a partir de `{agentId,
sessionId}` y del contexto de la clave de sesión.
- Los recursos de prueba de la CLI y del ejecutor integrado ahora inicializan y leen filas de transcripción de SQLite
  por id de sesión, en lugar de fingir que las sesiones activas son archivos `*.jsonl` o
  pasar una cadena `sqlite-transcript://...` mediante parámetros en tiempo de ejecución.
- Los eventos de protección de resultados de herramientas de sesión se emiten desde un ámbito de sesión conocido, incluso cuando un
  gestor en memoria no tiene un localizador derivado. Sus pruebas ya no simulan archivos de transcripción
  `/tmp/*.jsonl` activos.
- Los asistentes de BTW y puntos de control de Compaction ahora leen y bifurcan filas de transcripción por
  ámbito de SQLite. Los metadatos de los puntos de control ahora almacenan únicamente ids de sesión e ids
  de hoja/entrada; los localizadores derivados ya no se escriben en las cargas útiles de los puntos de control.
- La búsqueda de claves de transcripción del Gateway usa el ámbito de transcripción de SQLite en los límites
  del protocolo y ya no resuelve rutas reales ni consulta estadísticas de nombres de archivos de transcripción.
- La rotación automática de transcripciones de Compaction escribe las filas de transcripción sucesoras
  directamente mediante el almacén de transcripciones de SQLite. Las filas de sesión conservan únicamente la
  identidad de la sesión sucesora, no una ruta JSONL duradera ni un localizador persistente.
- La Compaction del motor de contexto integrado usa asistentes de rotación de transcripciones
  identificados mediante SQLite. Las pruebas de rotación ya no construyen rutas JSONL sucesoras ni
  modelan sesiones activas como archivos.
- La retención gestionada de imágenes salientes obtiene las claves de su caché de mensajes de transcripción de
  las estadísticas de transcripción de SQLite, en lugar de llamadas a estadísticas del sistema de archivos.
- Se han eliminado los bloqueos de sesiones en tiempo de ejecución y la vía independiente y heredada
  de doctor `.jsonl.lock`.
- El barrel de tiempo de ejecución de Microsoft Teams y el SDK público de plugins ya no reexportan
  el antiguo asistente de bloqueo de archivos; las rutas de estado duradero de los plugins están respaldadas por SQLite.
- Se han eliminado la depuración de sesiones por antigüedad/cantidad y la limpieza explícita de sesiones.
  Doctor es responsable de la importación heredada; las sesiones obsoletas se restablecen o eliminan explícitamente.
- Las comprobaciones de integridad de doctor ya no cuentan un archivo JSONL heredado como una transcripción
  activa válida para una fila de sesión de SQLite. El estado de las transcripciones activas depende únicamente de SQLite;
  los archivos JSONL heredados se notifican como entradas de migración/limpieza de huérfanos.
- Doctor ya no trata `agents/<agent>/sessions/` como estado obligatorio en tiempo de
  ejecución. Solo examina ese directorio cuando ya existe, como entrada de importación heredada
  o de limpieza de huérfanos.
- Las rutas de `sessions.resolve` del Gateway, parcheo/restablecimiento/Compaction de sesiones, creación
  de subagentes, cancelación rápida, metadatos de ACP, sesiones aisladas de Heartbeat y parcheo de la TUI
  ya no migran ni depuran claves de sesión heredadas como efecto secundario del
  trabajo normal en tiempo de ejecución.
- La resolución de sesiones de comandos de la CLI ahora devuelve el `agentId` propietario en lugar de un
  `storePath`, y ya no copia filas heredadas de la sesión principal durante la resolución normal
  de `--to` o `--session-id`. La normalización de filas principales heredadas corresponde
  únicamente a doctor.
- La resolución de profundidad de subagentes en tiempo de ejecución ya no lee `sessions.json` ni almacenes
  de sesiones JSON5. Lee `session_entries` de SQLite por id de agente, y los metadatos
  heredados de profundidad/sesión solo pueden entrar mediante la ruta de importación de doctor.
- Las anulaciones de sesión de perfiles de autenticación se conservan mediante upserts directos de filas
  `{agentId, sessionKey}`, en lugar de cargar de forma diferida un tiempo de ejecución de almacén de sesiones con forma de archivo.
- La activación detallada de respuestas automáticas y los asistentes de actualización de sesiones ahora leen/actualizan mediante upsert filas
  de sesión de SQLite por identidad de sesión y ya no requieren una ruta de almacén heredada
  antes de modificar el estado persistente de las filas.
- Los asistentes de metadatos de sesiones de ejecución de comandos ahora usan nombres y rutas de módulos
  orientados a entradas; se ha eliminado la antigua superficie de asistentes de comandos `session-store`.
- La inicialización de encabezados de arranque y el refuerzo de límites de Compaction manual ahora modifican
  directamente las filas de transcripción de SQLite. Los llamadores en tiempo de ejecución pasan la identidad de sesión, no
  rutas `.jsonl` con permiso de escritura.
- La reproducción silenciosa de la rotación de sesiones copia turnos recientes del usuario/asistente mediante
  `{agentId, sessionId}` desde filas de transcripción de SQLite. Ya no acepta
  localizadores de transcripción de origen ni de destino.
- Las filas de sesiones nuevas en tiempo de ejecución ya no almacenan localizadores de transcripción. Los llamadores usan
  `{agentId, sessionId}` directamente; los comandos de exportación/depuración pueden elegir nombres de archivos
  de salida al materializar las filas.
- El inicio de una nueva sesión de transcripción persistente ahora siempre abre filas de SQLite por
  ámbito. El gestor de sesiones ya no reutiliza una ruta o un localizador de transcripción anterior
  de la época de los archivos como identidad de la nueva sesión.
- Las sesiones de transcripción persistentes usan la API explícita
  `openTranscriptSessionManagerForSession({agentId, sessionId})`. Se han eliminado las
  antiguas fachadas estáticas `SessionManager.create/openForSession/list/forkFromSession` para que las pruebas y el código en tiempo de ejecución
  no puedan recrear accidentalmente el descubrimiento de sesiones de la época de los archivos.
- El tiempo de ejecución de los plugins ya no expone `api.runtime.agent.session.resolveTranscriptLocatorPath`;
  el código de los plugins usa asistentes de filas de SQLite y valores de ámbito.
- La superficie pública del SDK `session-store-runtime` ahora solo exporta asistentes de filas
  de sesión y filas de transcripción. Los asistentes específicos de esquema/ruta/transacción de SQLite
  residen en `sqlite-runtime`; los asistentes directos de apertura/cierre/restablecimiento siguen siendo locales
  únicamente para pruebas propias.
- Los clasificadores heredados de nombres de archivos de trayectorias/puntos de control `.jsonl` ahora residen en el
  módulo de archivos de sesión heredados de doctor. La validación de sesiones del núcleo ya no importa
  asistentes de artefactos de archivo para decidir los ids normales de sesiones de SQLite.
- Las ejecuciones bloqueantes de subagentes de Active Memory usan filas de transcripción de SQLite en lugar de
  crear archivos `session.jsonl` temporales o persistentes en el estado del plugin. Se ha
  eliminado la antigua opción `transcriptDir`.
- La generación puntual de slugs y las ejecuciones del planificador del agente del sistema usan filas de transcripción de SQLite
  en lugar de crear archivos `session.jsonl` temporales.
- `llm-task` ejecuciones auxiliares y la extracción de compromisos ocultos también usan filas de transcripción de SQLite,
  por lo que estas sesiones auxiliares exclusivas del modelo ya no crean
  archivos temporales de transcripción JSON/JSONL.
- `TranscriptSessionManager` ahora es únicamente un ámbito abierto de transcripción de SQLite.
  El código en tiempo de ejecución lo abre con `openTranscriptSessionManagerForSession({agentId,
sessionId})`; los flujos de creación, ramificación, continuación, listado y bifurcación residen en sus
  auxiliares propietarios de filas de SQLite, en lugar de fachadas estáticas de administración.
  El código de doctor/importación/depuración gestiona los archivos de origen heredados explícitos fuera del
  administrador de sesiones en tiempo de ejecución.
- Se eliminaron los métodos obsoletos de fachada `SessionManager.newSession()` y
  `SessionManager.createBranchedSession()`. Las sesiones nuevas
  y los descendientes de transcripciones se crean mediante su flujo de trabajo propietario de SQLite,
  en lugar de mutar un administrador ya abierto para convertirlo en otra
  sesión persistente.
- Las decisiones de bifurcación de la transcripción principal y la creación de bifurcaciones ya no aceptan
  `storePath` ni `sessionsDir`; usan el ámbito de transcripción de SQLite
  `{agentId, sessionId}` en lugar de metadatos retenidos de rutas del sistema de archivos.
- Memory-host ya no exporta auxiliares inoperantes de clasificación de transcripciones
  del directorio de sesiones; el filtrado de transcripciones ahora se deriva de los metadatos de filas de SQLite
  durante la construcción de entradas.
- Las pruebas de exportación de sesiones de Memory-host y QMD usan ámbitos de transcripción de SQLite. Las rutas
  `agents/<agentId>/sessions/*.jsonl` antiguas siguen cubiertas únicamente cuando una prueba
  demuestra intencionadamente la compatibilidad de doctor/importación/exportación.
- La inspección de sesiones sin procesar de QA-lab ahora usa `sessions.list` a través del Gateway,
  en lugar de leer `agents/qa/sessions/sessions.json`; los comentarios de MSteams
  se anexan directamente a las transcripciones de SQLite sin inventar una ruta JSONL.
- Los turnos entrantes compartidos de los canales ahora transportan `{agentId, sessionKey}` en lugar de un
  `storePath` heredado. Las rutas de registro de LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal,
  iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo,
  Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon,
  Twitch y QQBot ahora leen los metadatos de actualización y registran
  las filas de sesiones entrantes mediante la identidad de SQLite.
- Se elimina la persistencia del localizador de transcripciones de las filas de sesiones activas.
  `resolveSessionTranscriptTarget` devuelve `agentId`, `sessionId` y metadatos
  opcionales del tema; doctor es el único código que importa nombres de archivos de transcripciones
  heredadas.
- Los encabezados de transcripciones en tiempo de ejecución comienzan en la versión `1` de SQLite. Las actualizaciones de formatos JSONL V1/V2/V3
  antiguos residen únicamente en la importación de doctor y normalizan los encabezados importados a
  la versión actual de transcripciones de SQLite antes de almacenar las filas.
- La protección de prioridad de la base de datos ahora prohíbe `SessionManager.listAll` y
  `SessionManager.forkFromSession`; los flujos de trabajo de listado de sesiones y bifurcación/restauración
  deben permanecer en las API de SQLite basadas en filas/ámbitos.
- La protección también prohíbe los nombres de auxiliares heredados de análisis de JSONL de transcripciones/reparación de ramas activas
  fuera del código de doctor/importación, por lo que el tiempo de ejecución no puede desarrollar una segunda ruta heredada
  de migración de transcripciones.
- Las ejecuciones de PI integrado rechazan los identificadores de transcripción entrantes. Usan la identidad
  `{agentId, sessionId}` de SQLite antes de iniciar el worker y de nuevo antes de que el
  intento modifique el estado de la transcripción. Una entrada `/tmp/*.jsonl` obsoleta no puede seleccionar un
  destino de escritura en tiempo de ejecución.
- Los registros de seguimiento de caché, carga útil de Anthropic, flujo sin procesar y cronología de diagnósticos
  ahora se escriben en filas tipadas `diagnostic_events` de SQLite. Los paquetes de estabilidad del Gateway
  ahora se escriben en filas tipadas `diagnostic_stability_bundles` de SQLite. Se eliminan las antiguas rutas de sustitución JSONL
  `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`,
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE` y
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`, y la captura normal de estabilidad ya no escribe archivos
  `logs/stability/*.json`.
- La persistencia de Cron ahora concilia las filas `cron_jobs` de SQLite, en lugar de
  eliminar y volver a insertar toda la tabla de trabajos en cada guardado. Las escrituras de retorno del destino del Plugin
  actualizan directamente las filas de Cron coincidentes y mantienen el estado de Cron en tiempo de ejecución en
  la misma transacción de la base de datos de estado.
- Los llamadores de Cron en tiempo de ejecución ahora usan una clave estable del almacén de Cron de SQLite. Las rutas
  `cron.store` heredadas son únicamente entradas de importación de doctor; las rutas de Gateway de producción, mantenimiento de tareas,
  estado, historial de ejecuciones y escritura de retorno del destino de Telegram usan
  `resolveCronStoreKey` y ya no normalizan la clave como una ruta. El estado de Cron ahora
  informa de `storeKey` en lugar del antiguo campo `storePath` con formato de archivo.
- La carga y la programación de Cron en tiempo de ejecución ya no normalizan formatos heredados de trabajos persistentes,
  como `jobId`, `schedule.cron`, `atMs` numérico, valores booleanos en cadenas o
  la ausencia de `sessionTarget`. La importación heredada de doctor se encarga de esas reparaciones antes de insertar
  las filas en SQLite.
- La generación de ACP ya no resuelve ni persiste rutas de archivos JSONL de transcripciones. La configuración de generación
  y vinculación de hilos persiste directamente la fila de sesión de SQLite y conserva el
  id de sesión como identidad retenida de la transcripción.
- Las API de metadatos de sesiones de ACP ahora leen/listan/actualizan o insertan filas de SQLite por `agentId`
  y ya no exponen `storePath` como parte del contrato de entradas de sesiones de ACP.
- La contabilización del uso de sesiones y la agregación del uso del Gateway ahora resuelven las transcripciones
  únicamente mediante `{agentId, sessionId}`. La caché de costes/uso y los resúmenes de sesiones
  detectadas ya no sintetizan ni devuelven cadenas de localizadores de transcripciones.
- La anexión de chats del Gateway, la persistencia parcial por cancelación, `/sessions.send` y
  las escrituras multimedia de transcripciones del chat web se anexan directamente mediante el ámbito de transcripción
  de SQLite. El auxiliar de inyección de transcripciones del Gateway ya no acepta un
  parámetro `transcriptLocator`.
- La detección de transcripciones de SQLite ahora solo enumera ámbitos y estadísticas de transcripciones:
  `{agentId, sessionId, updatedAt, eventCount}`. Se eliminaron el auxiliar inactivo de compatibilidad
  `listSqliteSessionTranscriptLocators` y el campo por fila
  `locator`.
- El tiempo de ejecución de reparación de transcripciones ahora solo expone
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})`. Se elimina el antiguo
  auxiliar de reparación basado en localizadores; el código de doctor/depuración lee rutas explícitas
  de archivos de origen y nunca migra cadenas de localizadores.
- El tiempo de ejecución del registro de reproducción de ACP ahora almacena filas de reproducción por sesión en la base de datos
  de estado compartida de SQLite, en lugar de `acp/event-ledger.json`; doctor importa y
  elimina el archivo heredado.
- Los auxiliares de lectura de transcripciones del Gateway ahora residen en
  `src/gateway/session-transcript-readers.ts`, en lugar del antiguo nombre de módulo
  `session-utils.fs`. La comprobación del historial de reintentos alternativos recibe un nombre basado en
  el contenido de las transcripciones de SQLite, en lugar de la antigua superficie auxiliar de archivos.
- Los auxiliares de chat inyectado y Compaction del Gateway ahora pasan el ámbito de transcripción de SQLite
  por las API auxiliares internas, en lugar de denominar los valores como rutas de transcripciones o
  archivos de origen.
- La detección de continuación de arranque ahora comprueba las filas de transcripciones de SQLite mediante
  `hasCompletedBootstrapTranscriptTurn`; ya no expone un nombre de auxiliar
  con formato de archivo.
- Las pruebas del ejecutor integrado ahora usan la identidad de transcripción de SQLite, y abrir un nuevo
  administrador de transcripciones siempre requiere un `sessionId` explícito.
- Los auxiliares de indexación de memoria ahora usan terminología de transcripciones de SQLite de principio a fin:
  el host exporta `listSessionTranscriptScopesForAgent` y
  `sessionTranscriptKeyForScope`, la sincronización dirigida pone en cola `sessionTranscripts`,
  los resultados públicos de búsqueda de sesiones exponen rutas opacas `transcript:<agent>:<session>`,
  y la clave interna de origen de la base de datos es `session:<session>` bajo
  `source_kind='sessions'`, en lugar de una ruta de archivo ficticia.
- El auxiliar genérico de deduplicación persistente del SDK de plugins ya no expone opciones
  con formato de archivo. Los llamadores proporcionan claves de ámbito de SQLite y las filas de deduplicación duraderas residen en
  el estado compartido de los plugins.
- Los tokens de SSO de Microsoft Teams pasaron de archivos JSON bloqueados al estado de Plugin
  de SQLite. Doctor importa `msteams-sso-tokens.json`, reconstruye las claves canónicas de tokens
  de SSO a partir de las cargas útiles y elimina el archivo de origen. Los tokens de OAuth delegados permanecen
  en su límite privado existente de archivos de credenciales.
- El estado de la caché de sincronización de Matrix pasó de `bot-storage.json` al estado de Plugin
  de SQLite. Doctor importa las cargas útiles de sincronización heredadas, sin procesar o encapsuladas, y elimina el
  archivo de origen. Los clientes activos del adaptador de Matrix y de Matrix de QA Lab pasan un directorio raíz
  del almacén de sincronización de SQLite, no una ruta ficticia `sync-store.json` ni `bot-storage.json`.
- El estado de migración criptográfica heredada de Matrix pasó de
  `legacy-crypto-migration.json` al estado de Plugin de SQLite. Doctor importa el
  antiguo archivo de estado; las instantáneas de IndexedDB del SDK de Matrix pasaron de
  `crypto-idb-snapshot.json` a blobs de Plugin de SQLite. Las claves de recuperación y
  credenciales de Matrix son filas del estado de Plugin de SQLite; sus antiguos archivos JSON son únicamente entradas
  de migración de doctor.
- Los registros de actividad de Memory Wiki ahora usan el estado de Plugin de SQLite, en lugar de
  `.openclaw-wiki/log.jsonl`. El proveedor de migración de Memory Wiki importa los antiguos
  registros JSONL; el contenido Markdown de la wiki y de la bóveda del usuario permanece respaldado por archivos como
  contenido del espacio de trabajo.
- Memory Wiki ya no crea `.openclaw-wiki/state.json` ni el directorio sin uso
  `.openclaw-wiki/locks`. El proveedor de migración elimina esos archivos retirados
  de metadatos del Plugin si una bóveda antigua aún los contiene.
- Las entradas de auditoría del agente del sistema ahora usan el estado de Plugin de SQLite del núcleo, en lugar de
  `audit/crestodian.jsonl`. Doctor importa el registro de auditoría JSONL heredado y
  lo elimina tras una importación correcta.
- Las entradas de auditoría de escritura/observación de la configuración ahora usan el estado de Plugin de SQLite del núcleo, en lugar
  de `logs/config-audit.jsonl`. Doctor importa el registro de auditoría JSONL heredado y
  lo elimina tras una importación correcta.
- La aplicación complementaria de macOS ya no escribe archivos auxiliares locales de la aplicación `logs/config-audit.jsonl` ni
  `logs/config-health.json` al editar `openclaw.json`. El archivo de configuración
  permanece respaldado por archivos, las instantáneas de recuperación permanecen junto al archivo de configuración
  y el estado duradero de auditoría/salud de la configuración pertenece al almacén SQLite del Gateway.
- Las aprobaciones pendientes de rescate del agente del sistema ahora usan el estado de Plugin de SQLite del núcleo, en lugar
  de `crestodian/rescue-pending/*.json` o `openclaw/rescue-pending/*.json`.
  Estas capacidades de seguridad de corta duración nunca se importan; doctor descarta
  ambos directorios retirados para que una actualización no pueda reactivar una escritura obsoleta.
- El estado temporal de activación de Phone Control ahora usa el estado de Plugin de SQLite, en lugar de
  `plugins/phone-control/armed.json`. Doctor importa el archivo heredado de estado de activación
  en el espacio de nombres `phone-control/arm-state` y elimina el archivo.
- Doctor ya no repara transcripciones JSONL en el mismo archivo ni crea archivos JSONL
  de copia de seguridad. Importa la rama activa en SQLite y elimina el origen heredado.
- La búsqueda de transcripciones del enlace de memoria de sesiones usa lecturas de SQLite limitadas al ámbito
  `{agentId, sessionId}`. Su auxiliar ya no acepta ni deriva localizadores de transcripciones,
  lecturas de archivos heredados ni opciones de reescritura de archivos.
- Los enlaces de conversaciones del servidor de aplicaciones de Codex ahora indexan el estado de Plugin de SQLite mediante
  la clave de sesión de OpenClaw o un ámbito `{agentId, sessionId}` explícito. No deben
  conservar enlaces alternativos de rutas de transcripciones.
- Las lecturas del historial reflejado del servidor de aplicaciones de Codex usan únicamente el ámbito de transcripción de SQLite;
  no deben recuperar la identidad a partir de rutas de archivos de transcripciones.
- Las rutas de ordenación de roles y restablecimiento de Compaction ya no desvinculan archivos de transcripciones
  antiguos; el restablecimiento solo rota la fila de sesión de SQLite y la identidad de la transcripción.
- Las respuestas de restablecimiento y puntos de control del Gateway devuelven filas de sesiones limpias junto con ids
  de sesiones. Ya no sintetizan localizadores de transcripciones de SQLite para los clientes.
- Dreaming de memory-core ya no depura filas de sesiones comprobando si faltan
  archivos JSONL. La limpieza de subagentes se realiza mediante la API de sesiones en tiempo de ejecución, en lugar de
  comprobaciones de existencia en el sistema de archivos. Sus pruebas de ingesta de transcripciones insertan directamente filas de SQLite,
  en lugar de crear accesorios `agents/<id>/sessions` o marcadores de posición
  de localizadores.
- La indexación de transcripciones de memoria puede exponer `transcript:<agentId>:<sessionId>` como una
  ruta virtual de resultado de búsqueda para auxiliares de citas/lectura. El origen duradero del índice es
  relacional (`source_kind='sessions'`, `source_key='session:<sessionId>'`,
  `session_id=<sessionId>`), por lo que el valor no es un localizador de transcripción en tiempo de ejecución,
  no es una ruta del sistema de archivos y nunca debe volver a pasarse a las API de tiempo de ejecución de sesiones.
- El estado de memoria de doctor de Gateway lee los recuentos de recuperación a corto plazo y de señales de fase
  de las filas de estado del plugin en SQLite en lugar de `memory/.dreams/*.json`; la salida de la CLI y de
  doctor ahora identifica ese almacenamiento como un almacén SQLite, no como una ruta.
- El tiempo de ejecución de memory-core, el estado de la CLI, los métodos de doctor de Gateway y las fachadas del SDK
  del plugin ya no auditan ni archivan archivos `.dreams/session-corpus` heredados.
  Esos archivos son únicamente entradas de migración; doctor los importa a SQLite y
  elimina el origen después de la verificación. Las filas de evidencia de ingesta de sesiones activas
  ahora usan la ruta virtual de SQLite `memory/session-ingestion/<day>.txt`; el tiempo de ejecución
  nunca escribe ni deriva el estado de `.dreams/session-corpus`.
- Los artefactos públicos de memory-core exponen los eventos del host de SQLite como el artefacto JSON
  virtual `memory/events/memory-host-events.json`; ya no reutilizan la
  ruta de origen heredada `.dreams/events.jsonl`.
- Los registros de contenedores/navegadores del entorno aislado ahora usan la tabla SQLite
  compartida `sandbox_registry_entries` con columnas tipadas de sesión, imagen, marca de tiempo,
  backend/configuración y puerto del navegador. Doctor importa los archivos de registro JSON heredados,
  tanto monolíticos como fragmentados, y elimina los orígenes importados correctamente. Las lecturas en tiempo de ejecución usan
  las columnas tipadas de las filas como fuente de verdad; `entry_json` es solo una copia
  para reproducción/depuración.
- Los compromisos ahora usan una tabla compartida tipada `commitments` en lugar de un
  blob JSON de todo el almacén. El tiempo de ejecución usa consultas indexadas de ámbito, ventana de entrega, límite
  móvil, estado e intentos, además de transacciones SQLite síncronas;
  `record_json` es solo una copia para reproducción/depuración. La reparación explícita de doctor valida
  el archivo heredado `commitments.json` completo, conserva las filas más recientes de SQLite, verifica el
  resultado y solo entonces elimina el origen sin modificar. El tiempo de ejecución nunca lee ni
  escribe el archivo retirado.
- Las suscripciones de Web Push y la identidad VAPID generada ahora usan filas compartidas
  tipadas `web_push_subscriptions` y `web_push_vapid_keys`. El registro en tiempo de ejecución,
  la limpieza por caducidad y la generación de claves en el primer uso emplean transacciones SQLite
  a nivel de fila. La reparación explícita de Doctor valida ambos almacenes JSON retirados,
  los reclama antes de escribir en SQLite, los importa atómicamente, rechaza
  identidades VAPID en conflicto, verifica el resultado y solo entonces elimina las
  reclamaciones. Doctor mantiene el bloqueo de mantenimiento del directorio de estado durante toda la
  importación para que un Gateway anterior no pueda volver a crear los archivos retirados. El registro,
  la entrega, la eliminación y la resolución de claves fallan de forma cerrada hasta que Doctor resuelve
  los orígenes heredados pendientes o las reclamaciones interrumpidas.
- Las definiciones de tareas Cron, el estado de programación y el historial de ejecuciones ya no tienen
  lectores ni escritores JSON en tiempo de ejecución. El tiempo de ejecución usa filas `cron_jobs` con columnas tipadas de programación,
  carga útil, entrega, alerta de fallo, sesión, estado y estado de ejecución, además
  de detalles `task_runs` propiedad de Cron para diagnósticos, entrega, sesión/ejecución, modelo
  y totales de tokens. `job_json` es solo una copia para reproducción/depuración; `state_json` conserva
  diagnósticos de ejecución anidados que aún no tienen campos de consulta frecuentes, mientras el tiempo de ejecución
  rehidrata los campos de estado frecuentes desde columnas tipadas. Doctor importa
  los archivos heredados `jobs.json`, `jobs-state.json` y `runs/*.jsonl` y elimina
  los orígenes importados. Las escrituras de retorno de destinos del plugin actualizan las filas `cron_jobs`
  coincidentes en lugar de cargar y reemplazar todo el almacén de Cron.
- El inicio de Gateway ignora los marcadores heredados `notify: true` en la proyección
  de tiempo de ejecución. Doctor lee el valor sin procesar retirado `cron.webhook` únicamente al traducir
  esos marcadores en entregas explícitas de SQLite y después elimina la clave de configuración.
- Las colas de entrega saliente y de sesiones ahora almacenan el estado de la cola, el tipo de entrada,
  la clave de sesión, el canal, el destino, el id de cuenta, el número de reintentos, el último intento/error,
  el estado de recuperación y los marcadores de envío de la plataforma como columnas tipadas en la tabla compartida
  `delivery_queue_entries`. La recuperación en tiempo de ejecución lee esos campos frecuentes de
  las columnas tipadas, y las mutaciones de reintento/recuperación actualizan esas columnas directamente
  sin reescribir el JSON de reproducción. La carga útil JSON completa permanece únicamente como
  blob de reproducción/depuración para los cuerpos de los mensajes y otros datos de reproducción de acceso poco frecuente.
- Los registros de imágenes salientes administradas ahora usan filas compartidas tipadas
  `managed_outgoing_image_records`. El tiempo de ejecución solo lee columnas tipadas; la
  columna JSON es una copia para reproducción/depuración. Los bytes de las imágenes originales permanecen como
  artefactos de adjuntos con nombre en el directorio de medios administrados.
- Las preferencias del selector de modelos de Discord, los hashes de despliegue de comandos y las vinculaciones de hilos
  ahora usan el estado compartido del plugin en SQLite. Sus planes de importación de JSON heredado residen en la
  superficie de migración de configuración/doctor del plugin de Discord, no en el código de migración del núcleo.
- Los detectores de importación heredada de plugins usan módulos con nombres de doctor, como
  `doctor-legacy-state.ts` o `doctor-state-imports.ts`; los módulos normales de tiempo de ejecución
  de canales no deben importar detectores de JSON heredado.
- Los cursores de puesta al día y los marcadores de desduplicación entrante de BlueBubbles ahora usan el estado compartido
  del plugin en SQLite. Sus planes de importación de JSON heredado residen en la superficie de migración
  de configuración/doctor del plugin de BlueBubbles, no en el código de migración del núcleo.
- Los desplazamientos de actualizaciones de Telegram, las filas de caché de stickers, las filas de caché de mensajes enviados,
  las filas de caché de nombres de temas y las vinculaciones de hilos ahora usan el estado compartido del plugin
  en SQLite. Sus planes de importación de JSON heredado residen en la superficie de migración
  de configuración/doctor del plugin de Telegram, no en el código de migración del núcleo.
- Los cursores de puesta al día, las asignaciones de id cortos de respuesta y las filas de desduplicación de ecos enviados
  de iMessage ahora usan el estado compartido del plugin en SQLite. Los antiguos archivos `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` y `imessage/sent-echoes.jsonl` son
  únicamente entradas de doctor.
- Las filas de desduplicación de mensajes de Feishu ahora utilizan la desduplicación reclamable del núcleo
  (espacios de nombres `feishu.dedup.*` en el estado compartido del plugin en SQLite) en lugar de
  archivos `feishu/dedup/*.json` o el almacén manual retirado `dedup.*`, sin
  importación heredada porque la caché de protección contra reproducción se reconstruye después de la actualización.
- Las conversaciones, encuestas, búferes de cargas pendientes y aprendizajes de comentarios de
  Microsoft Teams ahora usan las tablas compartidas de estado/blobs del plugin en SQLite. La ruta de cargas pendientes
  usa `plugin_blob_entries` para que los búferes de medios se almacenen como BLOB de SQLite
  en lugar de JSON en base64. Los nombres de los auxiliares de tiempo de ejecución ahora usan terminología de SQLite/estado
  en lugar de terminología de almacén de archivos `*-fs`, y la antigua capa de compatibilidad `storePath` ya no existe
  en estos almacenes. Su plan de importación de JSON heredado reside en la superficie de migración
  de configuración/doctor del plugin de Microsoft Teams.
- Los medios salientes alojados de Zalo ahora usan `plugin_blob_entries` compartido de SQLite
  en lugar de archivos auxiliares temporales JSON/bin `openclaw-zalo-outbound-media`.
- El HTML y los metadatos del visor de diferencias ahora usan `plugin_blob_entries` compartido de SQLite
  en lugar de archivos temporales `meta.json`/`viewer.html`. El HTML del visor se almacena como un
  blob gzip y solo se conserva el hash del token de la URL. Las salidas PNG/PDF renderizadas
  siguen siendo materializaciones temporales porque la entrega por canal aún necesita una ruta de archivo;
  sus metadatos de caducidad pertenecen a SQLite, sin archivos auxiliares JSON.
- Los documentos administrados de Canvas ahora usan `plugin_blob_entries` compartido de SQLite en lugar
  de un directorio predeterminado `state/canvas/documents`. El host de Canvas sirve esos
  blobs directamente; solo se crean archivos locales para contenido explícito del operador `host.root`
  o para una materialización temporal cuando un lector de medios posterior
  requiere una ruta.
- Las decisiones de auditoría de File Transfer ahora usan `plugin_state_entries` compartido de SQLite
  en lugar del registro de tiempo de ejecución ilimitado `audit/file-transfer.jsonl`. Doctor
  importa el archivo de auditoría JSONL heredado al estado del plugin y elimina el origen
  después de una importación limpia.
- Los arrendamientos de procesos ACPX y la identidad de instancia de Gateway ahora usan el estado compartido del plugin
  en SQLite. Doctor importa el archivo heredado `gateway-instance-id` al estado del plugin
  y elimina el origen.
- Los scripts contenedores generados por ACPX y el directorio aislado de Codex son materializaciones
  temporales bajo la raíz temporal de OpenClaw, no estado duradero de OpenClaw. Los
  registros duraderos de tiempo de ejecución de ACPX son las filas de arrendamiento e instancia de Gateway en SQLite;
  la antigua superficie de configuración `stateDir` de ACPX se elimina porque ya no se escribe
  ningún estado de tiempo de ejecución allí.
- Los adjuntos multimedia de Gateway ahora usan la tabla compartida `media_blobs` de SQLite como
  almacén canónico de bytes. Las rutas locales devueltas a las superficies de compatibilidad
  de canales y entornos aislados son materializaciones temporales de la fila de la base de datos, no el
  almacén duradero de medios. Las listas de permitidos de medios en tiempo de ejecución ya no incluyen las raíces heredadas
  `$OPENCLAW_STATE_DIR/media` ni `media` del directorio de configuración; esos directorios son
  únicamente orígenes de importación de doctor.
- El completado del shell ya no escribe archivos de caché
  `$OPENCLAW_STATE_DIR/completions/*`. Las rutas de pruebas rápidas de instalación, doctor, actualización y versión usan
  salida de completado generada o carga desde el perfil en lugar de archivos duraderos de caché
  de completado.
- La preparación de cargas de Skills de Gateway ahora usa filas compartidas `skill_uploads` y
  `skill_upload_chunks`. Los fragmentos permanecen transaccionales individualmente durante
  la carga; después, la confirmación ensambla un único BLOB de archivo verificado y elimina las filas
  de fragmentos. El instalador solo recibe una ruta temporal al archivo materializado mientras
  se ejecuta una instalación. Doctor descarta el árbol retirado de preparación del sistema de archivos
  de una hora en lugar de importar cargas transitorias.
- Los adjuntos en línea de subagentes ya no se materializan bajo
  `.openclaw/attachments/*` del espacio de trabajo. La ruta de creación prepara entradas semilla del VFS de SQLite,
  las ejecuciones en línea siembran esas entradas en el espacio de nombres temporal de tiempo de ejecución por agente,
  y las herramientas respaldadas por disco superponen ese espacio temporal de SQLite para las rutas de adjuntos. Las
  antiguas columnas del registro de directorios de adjuntos de ejecuciones de subagentes y los enlaces de limpieza ya no existen.
- La hidratación de imágenes de la CLI ya no mantiene archivos de caché estables
  `openclaw-cli-images`. Los backends externos de la CLI siguen recibiendo rutas de archivos, pero esas rutas son
  materializaciones temporales por ejecución con limpieza.
- Los diagnósticos de seguimiento de caché, los diagnósticos de cargas útiles de Anthropic, los diagnósticos de flujos
  sin procesar del modelo, los eventos de la cronología de diagnósticos y los paquetes de estabilidad de Gateway ahora
  escriben filas de SQLite en lugar de archivos `logs/*.jsonl` o
  `logs/stability/*.json`.
  Se han eliminado las variables de entorno y las opciones de sobrescritura de rutas en tiempo de ejecución; los comandos de exportación/depuración
  pueden materializar archivos explícitamente a partir de las filas de la base de datos.
- La aplicación complementaria de macOS ya no tiene un escritor rotativo de `diagnostics.jsonl`. Los registros de la aplicación
  van al registro unificado, y los diagnósticos duraderos de Gateway permanecen respaldados por SQLite.
- La lista de registros del guardián de puertos de macOS ahora usa filas compartidas tipadas de SQLite
  `macos_port_guardian_records` en lugar de un archivo JSON de Application Support
  o un blob único opaco. Todos los perfiles de la aplicación de macOS usan la misma base de datos nativa
  global del host porque coordinan puertos locales de la máquina. Cada operación del libro mayor
  se bloquea mientras se ejecuta una copia anterior de la aplicación que escribe JSON. La migración se incorpora al
  protocolo estable de bloqueo de archivos del antiguo libro mayor solo para capturar una instantánea y posteriormente volver a validar el
  origen. Resuelve cada fila heredada a partir de datos reales del comando y del inicio del proceso
  sin mantener ese bloqueo; luego vuelve a leer las filas autoritativas de SQLite, aplica el
  plan, verifica cada recibo y elimina el origen. Los reintentos de eliminación vuelven a planificar
  las filas ausentes para que los recibos obsoletos retirados no puedan reaparecer. El bloqueo se mantiene
  durante poco tiempo para que no pueda dejar varado a un escritor anterior después de que SSH haya iniciado el proceso. La transición es
  intencionadamente unidireccional: el tiempo de ejecución estable nunca lee, proyecta ni escribe JSON,
  y la reversión a compilaciones que solo usan JSON no conserva los recibos más recientes de SQLite.
- Los bloqueos de instancia única de Gateway ahora usan filas compartidas tipadas de SQLite `state_leases` bajo
  el ámbito `gateway_locks` en lugar de archivos de bloqueo del directorio temporal. La documentación de solución de problemas
  de Fly y OAuth ahora remite al bloqueo de arrendamiento/actualización de autenticación de SQLite en lugar
  de la limpieza obsoleta de bloqueos de archivos.
- El estado del centinela de reinicio del Gateway ahora usa filas tipadas de SQLite compartido
  `gateway_restart_sentinel` en lugar de `restart-sentinel.json`; el entorno de ejecución
  lee el tipo, el estado, el enrutamiento, el mensaje, la continuación y las estadísticas del centinela desde
  columnas tipadas. Esas columnas son la fuente autoritativa; `payload_json` es solo una
  copia secundaria para reproducción y depuración. Las rutas de lectura, escritura y borrado del entorno de ejecución usan exclusivamente SQLite.
  Un módulo acotado de migración de estado se ejecuta durante el inicio y Doctor para importar un
  centinela posterior a una actualización anterior validado antes de la recuperación normal tras el reinicio, verificar
  la fila tipada y eliminar el archivo de origen. Ningún módulo del entorno de ejecución en estado estable
  lee, escribe ni limpia el archivo heredado.
- La intención de reinicio del Gateway y el estado de transferencia al supervisor ahora usan filas tipadas de
  SQLite compartido `gateway_restart_intent` y `gateway_restart_handoff` en lugar de los
  archivos auxiliares `gateway-restart-intent.json` y
  `gateway-supervisor-restart-handoff.json`.
- La coordinación de instancia única del Gateway ahora usa filas tipadas `state_leases` bajo
  `gateway_locks` en lugar de escribir archivos `gateway.<hash>.lock`. La fila de concesión
  contiene el propietario del bloqueo, la expiración, el Heartbeat y la carga útil de depuración; SQLite controla el
  límite atómico de adquisición y liberación. La opción retirada del directorio de bloqueo mediante archivos
  se eliminó; las pruebas usan directamente la identidad de la fila de SQLite.
- Se eliminó el antiguo auxiliar sin referencias de informes de uso de Cron que analizaba archivos `cron/runs/*.jsonl`.
  Los informes del historial de ejecuciones de Cron leen filas `task_runs` propiedad de Cron.
- La recuperación tras el reinicio de la sesión principal ahora detecta agentes candidatos mediante el
  registro de SQLite `agent_databases` en lugar de analizar directorios `agents/*/sessions`.
- La recuperación de sesiones dañadas de Gemini ahora elimina únicamente la fila de sesión de SQLite;
  ya no necesita una condición heredada `storePath` ni intenta desvincular una ruta
  derivada de transcripción JSONL.
- El manejo de sustituciones de rutas ahora trata los valores literales de entorno `undefined`/`null`
  como no definidos, lo que evita bases de datos `undefined/state/*.sqlite` accidentales en la raíz
  del repositorio durante las pruebas o las transferencias entre shells.
- Las huellas digitales del estado de la configuración ahora usan filas tipadas de SQLite compartido `config_health_entries`
  en lugar de `logs/config-health.json`, manteniendo el archivo de configuración normal como
  el único documento de configuración que no contiene credenciales. La aplicación complementaria de macOS conserva únicamente
  el estado de salud local del proceso y no vuelve a crear el antiguo archivo auxiliar JSON.
- El entorno de ejecución de perfiles de autenticación ya no importa ni escribe archivos JSON de credenciales. El
  almacén canónico de credenciales es SQLite; `auth-profiles.json`, el archivo por agente
  `auth.json` y el archivo compartido `credentials/oauth.json` son entradas de migración de Doctor
  que se eliminan después de la importación.
- Las pruebas de guardado y estado de perfiles de autenticación ahora comprueban directamente las tablas tipadas de autenticación de SQLite
  y solo usan nombres de archivo heredados de perfiles de autenticación como entradas de migración de Doctor.
- `openclaw secrets apply` depura únicamente el archivo de configuración, el archivo de entorno y el almacén
  de perfiles de autenticación de SQLite. Ya no contiene lógica de compatibilidad que edite
  el archivo por agente retirado `auth.json`; Doctor se encarga de importar y eliminar ese archivo.
- Los planes de migración de secretos de Hermes importan y aplican perfiles de claves de API directamente
  en el almacén de perfiles de autenticación de SQLite. Ya no escriben ni verifican
  `auth-profiles.json` como destino intermedio.
- La documentación de autenticación orientada al usuario ahora describe
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` en lugar de
  indicar a los usuarios que inspeccionen o copien `auth-profiles.json`; los nombres heredados de JSON
  de OAuth/autenticación solo siguen documentados como entradas de importación de Doctor.
- Las sesiones OAuth de MCP ahora usan filas versionadas `mcp_oauth_stores` en el almacén compartido
  `state/openclaw.sqlite`. Los objetos de token, registro de cliente y detección
  propiedad del SDK permanecen en una única carga útil JSON validada para que se conserven los campos de extensión
  de las dependencias, mientras que cada operación de lectura, modificación y escritura se confirma en una transacción breve
  de Kysely. Una concesión compartida de SQLite serializa la actualización, el inicio y el cierre de sesión;
  los transportes MCP integrados ya no permiten que el SDK de MCP actualice fuera de esa
  concesión. Doctor importa y elimina exclusivamente los almacenes retirados `mcp-oauth/*.json`
  con recibos de origen, y el entorno de ejecución no tiene alternativa basada en archivos.
- Los auxiliares de rutas de estado del núcleo ya no exponen el archivo retirado `credentials/oauth.json`.
  El nombre de archivo heredado es local a la ruta de importación de autenticación de Doctor.
- La documentación de instalación, seguridad, incorporación, autenticación de modelos y SecretRef ahora describe
  filas de perfiles de autenticación de SQLite y copias de seguridad o migraciones del estado completo en lugar de
  archivos JSON de perfiles de autenticación por agente.
- La detección de modelos de PI ahora pasa credenciales canónicas al almacenamiento de autenticación
  en memoria `pi-coding-agent`. Ya no crea, depura ni escribe el archivo
  por agente `auth.json` durante la detección.
- La configuración de activación y enrutamiento de Voice Wake ahora usa tablas tipadas de SQLite compartido
  en lugar de `settings/voicewake.json`, `settings/voicewake-routing.json` o
  filas genéricas opacas; Doctor importa los archivos JSON heredados y los elimina después de una
  migración correcta.
- El estado de comprobación de actualizaciones ahora usa una fila tipada compartida `update_check_state` en lugar de
  `update-check.json` o un blob genérico opaco; Doctor importa
  el archivo JSON heredado y lo elimina después de una migración correcta.
- El estado de salud de la configuración ahora usa filas tipadas compartidas `config_health_entries` en lugar
  de `logs/config-health.json` o un blob genérico opaco; Doctor
  importa el archivo JSON heredado y lo elimina después de una migración correcta.
- Las aprobaciones de vinculaciones de conversaciones de Plugin ahora usan filas tipadas
  `plugin_binding_approvals` en lugar de un estado compartido opaco de SQLite o
  `plugin-binding-approvals.json`; el archivo heredado es una entrada de migración de Doctor.
- Las vinculaciones genéricas de la conversación actual ahora almacenan filas tipadas
  `current_conversation_bindings` en lugar de reescribir
  `bindings/current-conversations.json`; Doctor importa el archivo JSON heredado y
  lo elimina después de una migración correcta.
- Los registros de sincronización de fuentes importadas de Memory Wiki ahora almacenan una fila de estado de Plugin de SQLite
  por clave de bóveda/fuente en lugar de reescribir `.openclaw-wiki/source-sync.json`;
  el proveedor de migración importa y elimina el registro JSON heredado.
- Los registros de ejecuciones de importación de ChatGPT de Memory Wiki ahora almacenan una fila de estado de Plugin de SQLite
  por identificador de bóveda/ejecución en lugar de escribir `.openclaw-wiki/import-runs/*.json`.
  Las instantáneas de reversión siguen siendo archivos explícitos de la bóveda hasta que el archivado
  de instantáneas de ejecuciones de importación se traslade al almacenamiento de blobs.
- Los resúmenes compilados de Memory Wiki ahora almacenan filas comprimidas de blobs de Plugin de SQLite
  en lugar de escribir `.openclaw-wiki/cache/agent-digest.json` y
  `.openclaw-wiki/cache/claims.jsonl`. La caché se puede reconstruir, por lo que Doctor
  elimina los archivos antiguos de caché sin importarlos.
- El seguimiento de instalaciones de Skills de ClawHub ahora almacena una fila de estado de Plugin de SQLite por
  espacio de trabajo/Skill en lugar de escribir o leer los archivos auxiliares `.clawhub/lock.json` y
  `.clawhub/origin.json` durante la ejecución. El código del entorno de ejecución usa objetos de estado
  de instalaciones registradas en lugar de abstracciones de archivo de bloqueo/origen con forma de archivo. Doctor
  importa los archivos auxiliares heredados de los espacios de trabajo configurados de los agentes y los elimina
  después de una importación limpia.
- El índice de Plugins instalados ahora lee y escribe la fila única tipada de SQLite compartido
  `installed_plugin_index` en lugar de `plugins/installs.json`; el
  archivo JSON heredado es únicamente una entrada de migración de Doctor y se elimina después de la importación.
- El auxiliar de rutas heredado `plugins/installs.json` ahora reside en el código heredado de Doctor.
  Los módulos del índice de Plugins del entorno de ejecución solo exponen opciones de persistencia
  respaldadas por SQLite, no una ruta de archivo JSON.
- El centinela de reinicio del Gateway, la intención de reinicio y el estado de transferencia al supervisor ahora usan
  filas tipadas de SQLite compartido (`gateway_restart_sentinel`,
  `gateway_restart_intent` y `gateway_restart_handoff`) en lugar de blobs genéricos
  opacos. El código de reinicio del entorno de ejecución no tiene ningún contrato de centinela, intención o transferencia
  con forma de archivo.
- La caché de sincronización, los metadatos de almacenamiento, las vinculaciones de hilos, los marcadores de desduplicación
  de entradas, el estado de espera de verificación de inicio, las instantáneas criptográficas de IndexedDB del SDK,
  las credenciales y las claves de recuperación de Matrix ahora usan tablas compartidas de estado/blobs de Plugin
  de SQLite. Las estructuras de rutas del entorno de ejecución ya no exponen una ruta de metadatos `storage-meta.json`;
  ese nombre de archivo es únicamente una entrada de migración heredada. Su plan de importación JSON heredado
  reside en la superficie de migración de configuración/Doctor del Plugin de Matrix. Los marcadores de
  desduplicación de entradas usan la desduplicación reclamable del núcleo (espacios de nombres `matrix.inbound-dedupe.*`
  en la base de datos de estado compartida); la migración de estado de Doctor de Matrix importa
  una vez las filas retiradas por raíz `inbound-dedupe` y `inbound-dedupe.json`;
  después, el entorno de ejecución solo lee el almacén de desduplicación reclamable.
- El inicio de Matrix ya no analiza, informa ni completa el estado heredado de archivos
  de Matrix. La detección de archivos de Matrix, la creación de instantáneas criptográficas heredadas, el estado de
  migración para restaurar claves de salas, la importación y la eliminación del origen son responsabilidad exclusiva de Doctor.
- Se eliminaron los módulos de exportación de migración del entorno de ejecución de Matrix. Los auxiliares de detección
  y modificación del estado o la criptografía heredados son importados directamente por Doctor de Matrix, en lugar de formar
  parte de la superficie de API del entorno de ejecución.
- Los marcadores de reutilización de instantáneas de migración de Matrix ahora residen en el estado de Plugin de SQLite
  en lugar de `matrix/migration-snapshot.json`; Doctor aún puede reutilizar el mismo
  archivo verificado previo a la migración sin escribir un archivo auxiliar de estado.
- Los cursores del bus y el estado de publicación del perfil de Nostr ahora usan el estado compartido de Plugin
  de SQLite. Su plan de importación JSON heredado reside en la superficie de migración de configuración/Doctor
  del Plugin de Nostr.
- Los interruptores de sesión de Active Memory ahora usan el estado compartido de Plugin de SQLite en lugar de
  `session-toggles.json`; al volver a activar la memoria, se elimina la fila en lugar de
  reescribir un objeto JSON.
- Las propuestas y los contadores de revisiones de Skill Workshop ahora usan el estado compartido de Plugin
  de SQLite en lugar de almacenes `skill-workshop/<workspace>.json` por espacio de trabajo. Cada
  propuesta es una fila independiente bajo `skill-workshop/proposals`, y el contador de
  revisiones es una fila independiente bajo `skill-workshop/reviews`.
- Las ejecuciones de subagentes revisores de Skill Workshop ahora usan el solucionador de transcripciones de sesión
  del entorno de ejecución en lugar de crear rutas auxiliares de sesión `skill-workshop/<sessionId>.json`.
- Las concesiones de procesos de ACPX ahora usan el estado compartido de Plugin de SQLite bajo
  `acpx/process-leases` en lugar de un registro de archivo completo `process-leases.json`.
  Cada concesión se almacena como una fila propia, lo que conserva la eliminación de procesos obsoletos
  durante el inicio sin una ruta de reescritura JSON en el entorno de ejecución.
- Los scripts contenedores de ACPX y el directorio personal aislado de Codex se generan en la
  raíz temporal de OpenClaw. Se vuelven a crear según sea necesario y no son entradas de copia de seguridad
  ni migración.
- La persistencia del registro de ejecuciones de subagentes usa filas tipadas compartidas `subagent_runs`. La
  antigua ruta `subagents/runs.json` ahora es únicamente una entrada de limpieza de Doctor. Doctor
  la reclama bajo el bloqueo de mantenimiento del estado, registra la decisión de descarte en
  SQLite y la elimina sin importar el estado transitorio de las ejecuciones. No queda ningún lector,
  escritor, caché ni alternativa JSON en el entorno de ejecución; la recuperación entre versiones de ejecuciones
  en curso almacenadas únicamente en archivos no se admite intencionalmente en este límite de retirada.
  Las pruebas del entorno de ejecución ya no crean accesorios `runs.json` no válidos o vacíos para comprobar
  el comportamiento del registro; insertan y leen directamente filas de SQLite.
- La copia de seguridad prepara el directorio de estado antes del archivado, copia los archivos que no son bases de datos,
  crea instantáneas de las bases de datos con `VACUUM INTO`, omite los archivos auxiliares WAL/SHM activos, registra
  los metadatos de las instantáneas en el manifiesto del archivo y registra
  las ejecuciones de copia de seguridad completadas en SQLite junto con el manifiesto del archivo. `openclaw backup
create` valida el archivo escrito de forma predeterminada; `--no-verify` es la
  ruta rápida explícita.
- `openclaw backup restore` valida el archivo antes de la extracción, reutiliza el
  manifiesto normalizado del verificador y restaura los recursos verificados del manifiesto en sus
  rutas de origen registradas. Requiere `--yes` para las escrituras y admite `--dry-run`
  para un plan de restauración.
- Se eliminó el antiguo filtro de rutas volátiles de la copia de seguridad. La copia de seguridad ya no necesita una
  lista de exclusión de tar en vivo para archivos JSON/JSONL heredados de sesiones o Cron, porque las instantáneas
  de SQLite se preparan antes de crear el archivo.
- La preparación básica de la configuración y del espacio de trabajo durante la incorporación ya no crea
  directorios `agents/<agentId>/sessions/`. Solo crea la configuración y el espacio de trabajo;
  las filas de sesión y de transcripción de SQLite se crean bajo demanda en la
  base de datos de cada agente.
- La reparación de permisos de seguridad ahora se aplica a las bases de datos SQLite
  global y de cada agente, además de a los archivos auxiliares WAL/SHM, en lugar de a `sessions.json` y a los archivos
  JSONL de transcripción.
- Los nombres de ejecución del registro del entorno aislado ahora describen directamente los tipos de registro de SQLite,
  en lugar de trasladar la terminología heredada del registro JSON al almacén activo.
- `openclaw reset --scope config+creds+sessions` elimina las bases de datos
  `openclaw-agent.sqlite` de cada agente junto con los archivos auxiliares WAL/SHM, no solo los directorios heredados
  `sessions/`.
- Los asistentes de sesiones agregadas del Gateway ahora usan nombres orientados a entradas:
  `loadCombinedSessionEntriesForGateway` devuelve `{ databasePath, entries }`.
  La antigua nomenclatura del almacén combinado se ha eliminado de los llamadores en tiempo de ejecución.
- La inicialización de canales MCP de Docker ahora escribe la fila de la sesión principal y los eventos de
  transcripción en la base de datos SQLite de cada agente, en lugar de crear
  `sessions.json` y una transcripción JSONL.
- El hook de memoria de sesión incluido ahora resuelve el contexto de la sesión anterior desde
  SQLite mediante `{agentId, sessionId}`. Ya no examina, almacena ni sintetiza
  rutas de transcripción ni directorios `workspace/sessions`.
- El hook de registro de comandos incluido ahora escribe filas de auditoría de comandos en la tabla
  compartida de SQLite `command_log_entries`, en lugar de añadirlas a
  `logs/commands.log`.
- Las listas de permitidos para el emparejamiento de canales ahora solo exponen asistentes de lectura y escritura respaldados por SQLite
  en tiempo de ejecución. El solucionador de rutas obsoleto del SDK de plugins se conserva por compatibilidad
  de migración; los lectores de archivos solo existen en el código de migración de estado de doctor.
- `migration_runs` registra las ejecuciones de migración del estado heredado con su estado,
  marcas de tiempo e informes JSON.
- `migration_sources` registra cada archivo heredado importado con su origen, hash, tamaño,
  cantidad de registros, tabla de destino, id. de ejecución, estado y estado de eliminación del origen.
- `backup_runs` registra las rutas de los archivos de copia de seguridad, el estado y los manifiestos JSON.
- El esquema global no conserva una tabla de registro `agents` sin usar. El descubrimiento de
  bases de datos de agentes es el registro canónico `agent_databases` hasta que el tiempo de ejecución
  disponga de un propietario real para los registros de agentes.
- La configuración generada del catálogo de modelos se almacena en filas globales tipadas de SQLite
  `agent_model_catalogs`, con claves por directorio de agente. Los llamadores en tiempo de ejecución usan
  `ensureOpenClawModelCatalog`; no existe una API de compatibilidad `models.json` en
  el código de tiempo de ejecución. La implementación escribe en SQLite y el registro PI integrado se
  hidrata desde esa carga almacenada sin crear un archivo `models.json`.
- La exportación opcional `memory.qmd.sessions` lee las filas de transcripción canónicas de
  la base de datos de cada agente y materializa Markdown saneado en el directorio principal de QMD
  como artefacto de entrada QMD explícito. Por tanto, las colecciones de sesiones QMD y las asignaciones
  de identidad de artefactos siguen formando parte del puente configurado con la herramienta externa;
  no constituyen un segundo almacén canónico de transcripciones.
- Los propios `index.sqlite` de QMD, la configuración YAML de colecciones y las descargas de modelos siguen siendo
  artefactos de la herramienta externa bajo `~/.openclaw/agents/<agentId>/qmd`; no se
  replican en `plugin_blob_entries`. La coordinación de QMD propiedad de OpenClaw
  prioriza la base de datos: los `state_leases` compartidos serializan las incrustaciones globalmente y los
  `state_leases` de cada agente serializan los procesos de escritura de colecciones, actualizaciones e incrustaciones. El tiempo de ejecución no crea
  archivos auxiliares de bloqueo de QMD.
- El plugin opcional `memory-lancedb` ya no crea
  `~/.openclaw/memory/lancedb` como almacén implícito administrado por OpenClaw. Es un
  backend externo de LanceDB y permanece deshabilitado hasta que el operador configure un
  `dbPath` explícito.
- `check:database-first-legacy-stores` rechaza el nuevo código fuente de tiempo de ejecución que empareja
  nombres de almacenes heredados con API de sistema de archivos orientadas a escritura. También rechaza el código
  fuente de tiempo de ejecución que vuelva a introducir los marcadores retirados del puente de transcripciones
  `transcriptLocator` o `sqlite-transcript://...`. El código de migración, doctor, importación
  y exportación explícita ajena a sesiones sigue estando permitido. Los nombres de contratos heredados más amplios,
  como `sessionFile`, `storePath` y las antiguas fachadas de la era de archivos `SessionManager`,
  aún tienen propietarios actuales y necesitan trabajo independiente en las protecciones de migración
  antes de poder convertirse en una comprobación preliminar obligatoria. La protección ahora también abarca
  los almacenes de tiempo de ejecución `cache/*.json`, los archivos auxiliares genéricos
  `thread-bindings.json`, el estado y los registros de ejecución JSON de Cron, el JSON de estado de la configuración,
  los archivos auxiliares de reinicio y bloqueo, la configuración de Voice Wake, las aprobaciones de vinculación de plugins,
  el índice JSON de plugins instalados, el JSONL de auditoría de File Transfer, los registros de actividad de
  Memory Wiki, el antiguo registro de texto incluido `command-logger` y las opciones de diagnóstico JSONL
  de flujo sin procesar de pi-mono. También prohíbe los antiguos nombres de módulos heredados de doctor en el nivel raíz,
  para que el código de compatibilidad permanezca bajo `src/commands/doctor/`. Los controladores de depuración de Android
  también usan logcat o salida en memoria, en lugar de preparar archivos de caché `camera_debug.log` o
  `debug_logs.txt`.

## Forma del esquema de destino

Mantenga los esquemas explícitos. El estado de ejecución propiedad del host utiliza tablas tipadas. El estado opaco propiedad de plugins utiliza `plugin_state_entries` / `plugin_blob_entries`; no existe una tabla `kv` genérica del host.

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
skill_upload_chunks(upload_id, byte_offset, size_bytes, chunk_blob)
web_push_subscriptions(endpoint_hash, subscription_id, endpoint, p256dh, auth, created_at_ms, updated_at_ms)
web_push_vapid_keys(key_id, public_key, private_key, subject, updated_at_ms)
apns_registrations(node_id, transport, token, relay_handle, send_grant, installation_id, relay_origin, topic, environment, distribution, token_debug_suffix, updated_at_ms)
apns_registration_tombstones(node_id, deleted_at_ms)
node_host_config(config_key, version, node_id, token, display_name, gateway_host, gateway_port, gateway_tls, gateway_tls_fingerprint, gateway_context_path, updated_at_ms)
device_identities(identity_key, device_id, public_key_pem, private_key_pem, created_at_ms, updated_at_ms)
device_auth_tokens(device_id, role, token, scopes_json, updated_at_ms)
macos_port_guardian_records(pid, port, command, mode, timestamp)
workspace_setup_state(workspace_key, workspace_path, version, bootstrap_seeded_at, setup_completed_at, updated_at)
workspace_path_aliases(alias_key, alias_path, workspace_key, workspace_path, updated_at_ms)
workspace_attestations(workspace_key, attested_at_ms, updated_at_ms)
workspace_generated_bootstrap_hashes(workspace_key, filename, sha256)
native_hook_relay_bridges(relay_id, pid, hostname, port, token, expires_at_ms, updated_at_ms)
model_capability_cache(provider_id, model_id, name, input_text, input_image, reasoning, supports_tools, context_window, max_tokens, cost_input, cost_output, cost_cache_read, cost_cache_write, updated_at_ms)
agent_model_catalogs(catalog_key, agent_dir, raw_json, updated_at)
managed_outgoing_image_records(attachment_id, session_key, agent_id, message_id, created_at, updated_at, retention_class, alt, original_media_id, original_media_subdir, original_content_type, original_width, original_height, original_size_bytes, original_filename, record_json, cleanup_pending)
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

En el futuro, la búsqueda puede añadir tablas FTS sin cambiar las tablas de eventos canónicas:

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

Los valores grandes deben utilizar columnas `blob`, no codificación como cadenas JSON. Mantenga `value_json` para datos estructurados pequeños que deban seguir siendo inspeccionables con herramientas SQLite simples.

`agent_databases` es el registro canónico de esta rama. No añada una tabla `agents` hasta que exista un propietario real de los registros de agentes; la configuración de los agentes permanece en `openclaw.json`.

## Forma de la migración de Doctor

Doctor debe invocar un único paso de migración explícito que pueda incluirse en informes y sea seguro volver a ejecutar:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` invoca la implementación de la migración de estado después de la comprobación preliminar habitual de la configuración y crea una copia de seguridad verificada antes de la importación. El inicio del entorno de ejecución y `openclaw migrate` no deben importar archivos de estado heredados de OpenClaw.

Propiedades de la migración:

- Una pasada de migración detecta todas las fuentes de archivos heredados y genera un plan
  antes de modificar nada.
- Doctor crea un archivo de copia de seguridad verificado previo a la migración antes de importar
  los archivos heredados.
- Las importaciones son idempotentes y se identifican mediante la ruta de origen, mtime, tamaño, hash y tabla
  de destino.
- Los archivos de origen importados correctamente se eliminan o archivan después de que se haya confirmado
  la base de datos de destino.
- Las importaciones fallidas dejan el origen intacto y registran una advertencia en
  `migration_runs`.
- El código del entorno de ejecución solo lee SQLite una vez que existe la migración.
- No se requiere ninguna ruta de reversión ni de exportación a archivos del entorno de ejecución.

## Inventario de migración

Mueva estos elementos a la base de datos global:

- Las escrituras del entorno de ejecución del registro de tareas ahora usan la base de datos compartida; se eliminó el importador de archivos auxiliares
  `tasks/runs.sqlite` no publicado. Los guardados de instantáneas realizan una inserción o actualización por id de tarea
  y eliminan únicamente las filas de tareas/entregas ausentes.
- Las escrituras del entorno de ejecución de Task Flow ahora usan la base de datos compartida; se eliminó el importador de archivos auxiliares
  `tasks/flows/registry.sqlite` no publicado. Los guardados de instantáneas
  realizan una inserción o actualización por id de flujo y eliminan únicamente las filas de flujos ausentes.
- Las escrituras del entorno de ejecución del estado de los plugins ahora usan la base de datos compartida; se eliminó el importador de archivos auxiliares
  `plugin-state/state.sqlite` no publicado.
- La búsqueda de memoria integrada ya no usa `memory/<agentId>.sqlite` de forma predeterminada; sus
  tablas de índice residen en la base de datos del agente propietario, y la habilitación explícita
  del archivo auxiliar `memorySearch.store.path` se ha retirado y trasladado a la migración de configuración
  de doctor.
- La reindexación de la memoria integrada restablece únicamente las tablas pertenecientes a la memoria en la base de datos del agente.
  No debe reemplazar todo el archivo SQLite, porque la misma base de datos contiene
  sesiones, transcripciones, filas de VFS, artefactos y cachés del entorno de ejecución.
- Registros de contenedores/navegadores del entorno aislado procedentes de JSON monolítico y fragmentado. Las escrituras del entorno de ejecución
  ahora usan la base de datos compartida; se mantiene la importación del JSON heredado.
- Las definiciones de trabajos Cron, el estado de las programaciones y el historial de ejecuciones ahora usan SQLite compartido;
  doctor importa/elimina los archivos heredados `jobs.json`, `jobs-state.json` y
  `cron/runs/*.jsonl`
- Identidad/autenticación de dispositivos, envío push, comprobación de actualizaciones, compromisos, caché de modelos de OpenRouter,
  índice de plugins instalados y vinculaciones del servidor de aplicaciones
- Los registros de emparejamiento de dispositivos/nodos y de arranque ahora usan tablas SQLite tipadas
- Los suscriptores a notificaciones de emparejamiento de dispositivos y los marcadores de solicitudes entregadas ahora usan la
  tabla compartida de estado de plugins de SQLite en lugar de `device-pair-notify.json`.
- Los registros de llamadas de voz ahora usan la tabla compartida de estado de plugins de SQLite bajo el
  espacio de nombres `voice-call` / `calls` en lugar de `calls.jsonl`; la CLI del plugin
  sigue y resume el historial de llamadas respaldado por SQLite.
- Las sesiones del Gateway de QQBot, los registros de usuarios conocidos y la caché de citas del índice de referencias ahora usan
  el estado de plugins de SQLite bajo los espacios de nombres `qqbot` (`gateway-sessions`,
  `known-users`, `ref-index`) en lugar de `session-*.json`, `known-users.json`
  y `ref-index.jsonl`. Esos archivos heredados son cachés y no se migran.
- Las preferencias del selector de modelos de Discord, los hashes de despliegue de comandos y las vinculaciones de hilos
  ahora usan el estado de plugins de SQLite bajo los espacios de nombres `discord`
  (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`)
  en lugar de `model-picker-preferences.json`, `command-deploy-cache.json` y
  `thread-bindings.json`; la migración de doctor/configuración de Discord importa y
  elimina los archivos heredados.
- Los cursores de puesta al día y los marcadores de desduplicación entrante de BlueBubbles ahora usan el estado de plugins
  de SQLite bajo los espacios de nombres `bluebubbles` (`catchup-cursors`, `inbound-dedupe`)
  en lugar de `bluebubbles/catchup/*.json` y
  `bluebubbles/inbound-dedupe/*.json`; la migración de doctor/configuración de BlueBubbles
  importa y elimina los archivos heredados.
- Los desplazamientos de actualizaciones, las entradas de caché de stickers, las entradas de caché de mensajes de cadenas de respuestas,
  las entradas de caché de mensajes enviados, las entradas de caché de nombres de temas y las vinculaciones de hilos de Telegram
  ahora usan el estado de plugins de SQLite bajo los espacios de nombres `telegram`
  (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`,
  `topic-names`, `thread-bindings`) en lugar de `update-offset-*.json`,
  `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json` y
  `thread-bindings-*.json`; la migración de doctor/configuración de Telegram importa y
  elimina los archivos heredados.
- Los cursores de puesta al día, las asignaciones de id cortos de respuestas y las filas de desduplicación de ecos enviados de iMessage
  ahora usan el estado de plugins de SQLite bajo los espacios de nombres `imessage` (`catchup-cursors`,
  `reply-cache`, `sent-echoes`) en lugar de `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` y `imessage/sent-echoes.jsonl`; la migración de
  doctor/configuración de iMessage importa y elimina los archivos heredados.
- Las conversaciones, encuestas, tokens de SSO y aprendizajes de comentarios de Microsoft Teams ahora
  usan espacios de nombres de estado de plugins de SQLite (`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`) en lugar de `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json` y `*.learnings.json`; la
  migración de doctor/configuración de Microsoft Teams importa y archiva los archivos heredados.
  Las cargas pendientes son una caché SQLite de corta duración y los archivos de caché JSON antiguos
  no se migran.
- La caché de sincronización, los metadatos de almacenamiento, las vinculaciones de hilos, los marcadores de desduplicación entrante,
  el estado de tiempo de espera de la verificación de inicio, las credenciales, las claves de recuperación y las instantáneas
  criptográficas de IndexedDB del SDK de Matrix ahora usan espacios de nombres de estado/blob de plugins de SQLite bajo
  `matrix` (`sync-store`, `storage-meta`, `thread-bindings`,
  `matrix.inbound-dedupe.*` mediante la desduplicación reclamable del núcleo,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`)
  en lugar de `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json` y `crypto-idb-snapshot.json`; la migración de doctor/configuración
  de Matrix importa y elimina esos archivos heredados (y las filas SQLite retiradas
  `inbound-dedupe` por raíz) de las raíces de almacenamiento de Matrix delimitadas por cuenta.
- Los cursores del bus y el estado de publicación de perfiles de Nostr ahora usan el estado de plugins de SQLite bajo
  los espacios de nombres `nostr` (`bus-state`, `profile-state`) en lugar de
  `bus-state-*.json` y `profile-state-*.json`; la migración de doctor/configuración
  de Nostr importa y elimina los archivos heredados.
- Los conmutadores de sesión de Active Memory ahora usan el estado de plugins de SQLite bajo
  `active-memory/session-toggles` en lugar de `session-toggles.json`.
- Las colas de propuestas y los contadores de revisión de Skill Workshop ahora usan el estado de plugins de SQLite
  bajo `skill-workshop/proposals` y `skill-workshop/reviews` en lugar de
  archivos `skill-workshop/<workspace>.json` por espacio de trabajo.
- Las colas de entrega saliente y de entrega de sesiones ahora comparten la tabla SQLite global
  `delivery_queue_entries` bajo nombres de cola separados
  (`outbound-delivery`, `session-delivery`) en lugar de los archivos persistentes
  `delivery-queue/*.json`, `delivery-queue/failed/*.json` y
  `session-delivery-queue/*.json`. El paso de estado heredado de doctor importa
  las filas pendientes y fallidas, elimina los marcadores obsoletos de entregas y borra los archivos
  JSON antiguos después de la importación. Los campos de enrutamiento en caliente y reintento son columnas tipadas; la
  carga útil JSON se conserva únicamente para reproducción/depuración.
- Los arrendamientos de procesos ACPX ahora usan el estado de plugins de SQLite bajo `acpx/process-leases`
  en lugar de `process-leases.json`.
- Metadatos de ejecuciones de copias de seguridad y migraciones

Mover estos elementos a las bases de datos de los agentes:

- Raíces de sesiones de agentes y cargas útiles de entradas de sesión con formato de compatibilidad. Completado para
  las escrituras del entorno de ejecución: los metadatos de sesión en caliente se pueden consultar en `sessions`, mientras que la
  carga útil completa `SessionEntry` con formato heredado permanece en `session_entries`.
- Eventos de transcripciones de agentes. Completado para las escrituras del entorno de ejecución.
- Puntos de control de Compaction e instantáneas de transcripciones. Completado para las escrituras del entorno de ejecución:
  las copias de transcripciones de los puntos de control son filas de transcripciones de SQLite y los metadatos de los puntos de control
  se registran en `transcript_snapshots`. Los auxiliares de puntos de control del Gateway
  ahora denominan estos valores instantáneas de transcripciones en lugar de archivos de origen.
- Espacios de nombres temporales/de espacios de trabajo del VFS de los agentes. Completado para las escrituras del VFS del entorno de ejecución.
- Cargas útiles de archivos adjuntos de subagentes. Completado para las escrituras del entorno de ejecución: son entradas
  iniciales del VFS de SQLite y nunca archivos persistentes del espacio de trabajo.
- Artefactos de herramientas. Completado para las escrituras del entorno de ejecución.
- Artefactos de ejecuciones. Completado para las escrituras del entorno de ejecución de trabajadores mediante la tabla
  `run_artifacts` por agente.
- Cachés locales del entorno de ejecución de los agentes. Completado para las escrituras de caché delimitadas al entorno de ejecución
  de trabajadores mediante la tabla `cache_entries` por agente. Las cachés de modelos de todo el Gateway permanecen en la
  base de datos global, salvo que pasen a ser específicas de un agente.
- Registros de flujos principales de ACP. Completado para las escrituras del entorno de ejecución.
- Sesiones del registro de reproducción de ACP. Completado para las escrituras del entorno de ejecución mediante
  `acp_replay_sessions` y `acp_replay_events`; el `acp/event-ledger.json` heredado
  permanece únicamente como entrada de doctor.
- Metadatos de sesiones de ACP. Completado para las escrituras del entorno de ejecución mediante `acp_sessions`; los bloques
  `entry.acp` heredados de `sessions.json` son únicamente entradas para la migración de doctor.
- Archivos auxiliares de trayectorias cuando no son archivos de exportación explícitos. Completado para las escrituras del entorno
  de ejecución: la captura de trayectorias escribe filas `trajectory_runtime_events` en la base de datos del agente
  y replica en SQLite los artefactos delimitados por ejecución. Los archivos auxiliares heredados son únicamente entradas de importación
  de doctor; la exportación puede materializar nuevas salidas JSONL de paquetes de soporte,
  pero no lee ni migra archivos auxiliares antiguos de trayectorias/transcripciones durante la ejecución.
  La captura de trayectorias del entorno de ejecución expone el ámbito de SQLite; los auxiliares de rutas JSONL están
  aislados para la exportación/depuración y no se vuelven a exportar desde el módulo del entorno de ejecución.
  Los metadatos de trayectorias del ejecutor integrado registran la identidad
  `{agentId, sessionId, sessionKey}` en lugar de conservar un localizador de transcripciones.

Mantener estos elementos respaldados por archivos por ahora:

- `openclaw.json`
- archivos de credenciales del proveedor o la CLI
- manifiestos de plugins/paquetes
- espacios de trabajo de usuarios y repositorios Git cuando se selecciona el modo de disco
- registros destinados al seguimiento por parte de operadores, salvo que se traslade una superficie de registro específica

## Plan de migración

### Fase 0: Fijar el límite

Hacer explícito el límite del estado persistente antes de mover más filas:

- Añadir una tabla `migration_runs` a la base de datos global.
  Completado para los informes de ejecución de migraciones de estado heredado.
- Añadir un único servicio de migración de estado, propiedad de doctor, para importar de archivos a la base de datos.
  Completado: `openclaw doctor --fix` usa la implementación de migración de estado heredado.
- Hacer que `plan` sea de solo lectura y que `apply` cree una copia de seguridad, importe, verifique y
  después elimine o ponga en cuarentena los archivos antiguos.
  Completado: doctor crea una copia de seguridad verificada previa a la migración, pasa la ruta de la copia de seguridad
  a `migration_runs` y reutiliza las rutas del importador y de eliminación.
- Añadir prohibiciones estáticas para que el nuevo código del entorno de ejecución no pueda escribir archivos de estado heredados,
  mientras que el código de migración y las pruebas aún puedan inicializarlos/leerlos.
  Completado para los almacenes heredados migrados actualmente; la protección también examina las pruebas
  anidadas en busca de contratos prohibidos de localizadores de transcripciones del entorno de ejecución.

### Fase 1: Completar el plano de control global

Mantener el estado de coordinación compartido en `state/openclaw.sqlite`:

- Agentes y registro de bases de datos de agentes
- Registros de tareas y Task Flow
- Estado de plugins
- Registro de contenedores/navegadores del entorno aislado
- Historial de ejecuciones de Cron/planificador
- Emparejamiento, dispositivos, envío push, comprobación de actualizaciones, TUI, cachés de OpenRouter/modelos y otro
  estado pequeño del entorno de ejecución delimitado al Gateway
- Metadatos de copias de seguridad y migraciones
- Bytes de archivos adjuntos multimedia del Gateway. Completado para las escrituras del entorno de ejecución; las rutas directas de archivos
  son materializaciones temporales para la compatibilidad con los remitentes de canales y la preparación
  del entorno aislado. Las listas de permitidos del entorno de ejecución aceptan rutas de materialización de SQLite, no raíces multimedia
  de estado/configuración heredadas. Doctor importa los archivos multimedia heredados en
  `media_blobs` y elimina los archivos de origen tras escribir correctamente las filas.
- Sesiones, eventos y blobs de cargas útiles de captura del proxy de depuración. Completado: las capturas residen
  en la base de datos de estado compartida y se abren mediante el arranque, el esquema,
  WAL y la configuración del tiempo de espera por ocupación de la base de datos de estado compartida. Los bytes de las cargas útiles se comprimen con gzip en
  `capture_blobs.data`; no existe una sustitución de la base de datos auxiliar del entorno de ejecución del proxy de depuración,
  un directorio de blobs ni un objetivo de esquema/generación de código exclusivo para capturas del proxy.
  La migración de doctor/inicio importa las filas `debug-proxy/capture.sqlite` publicadas
  y los blobs de cargas útiles referenciados, incluidas las sustituciones activas mediante variables de entorno de la base de datos/blob heredadas,
  y después archiva esos orígenes sin modificar los certificados de CA.

Esta fase también elimina de esos subsistemas los abridores duplicados de bases de datos auxiliares, los asistentes de permisos, la configuración de WAL, la depuración del sistema de archivos y los escritores de compatibilidad.

### Fase 2: Introducir bases de datos por agente

Crear una base de datos por agente y registrarla desde la base de datos global:

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

La fila global `agent_databases` almacena la ruta, la versión del esquema, la marca de tiempo de la última detección y metadatos básicos de tamaño e integridad. El código de ejecución solicita al registro la base de datos del agente en lugar de derivar directamente las rutas de archivo.

La base de datos del agente contiene:

- `sessions` como raíz canónica de la sesión, con `session_entries` como tabla de carga útil con formato de compatibilidad asociada a esa raíz y
  `session_routes` como búsqueda única de `session_key` activa
- `conversations` y `session_conversations` como identidad normalizada de enrutamiento del proveedor asociada a las sesiones
- `transcript_events`
- instantáneas de transcripciones y puntos de control de compactación. Completado para las escrituras en tiempo de ejecución.
- `vfs_entries`
- `tool_artifacts` y artefactos de ejecución
- filas de ejecución/caché locales del agente. Completado para las cachés con ámbito de trabajador.
- eventos del flujo principal de ACP
- eventos de ejecución de trayectorias cuando no sean artefactos de exportación explícitos

### Fase 3: Sustituir las API del almacén de sesiones

Completado para el tiempo de ejecución. La superficie del almacén de sesiones con formato de archivo no es un contrato de ejecución activo:

- El tiempo de ejecución ya no llama a `loadSessionStore(storePath)` ni trata `storePath` como identidad de sesión.
- Las operaciones de filas en tiempo de ejecución son `getSessionEntry`, `upsertSessionEntry`,
  `patchSessionEntry`, `deleteSessionEntry` y `listSessionEntries`.
- Los asistentes para reescribir almacenes completos, los escritores de archivos, las pruebas de colas, la depuración de alias y los parámetros de eliminación de claves heredadas se han eliminado del tiempo de ejecución.
- Las exportaciones de compatibilidad obsoletas del paquete raíz todavía adaptan las rutas canónicas
  `sessions.json` a las API de filas de SQLite.
- El análisis de `sessions.json` permanece únicamente en el código de migración/importación de doctor y en las pruebas de doctor.
- Las lecturas de reserva del ciclo de vida en tiempo de ejecución leen las cabeceras de transcripción de SQLite, no las primeras líneas de JSONL.

Seguir eliminando todo lo que reintroduzca parámetros de bloqueo de archivos, vocabulario de depuración/truncamiento como mantenimiento de archivos, identidad basada en rutas del almacén o pruebas cuya única aserción sea la persistencia en JSON.

### Fase 4: Trasladar transcripciones, flujos ACP, trayectorias y VFS

Hacer que todos los flujos de datos de los agentes sean nativos de la base de datos:

- Las escrituras anexadas de transcripciones pasan por una única transacción de SQLite que garantiza la cabecera de la sesión, comprueba la idempotencia de los mensajes, selecciona el extremo principal, inserta en `transcript_events` y registra metadatos de identidad consultables en
  `transcript_event_identities`. Completado para las adiciones directas de mensajes de transcripción y las adiciones persistidas normales de `TranscriptSessionManager`; las operaciones explícitas de ramas conservan su elección explícita del elemento principal y siguen escribiendo filas de SQLite sin derivar ningún localizador de archivos.
- Los registros del flujo principal de ACP pasan a ser filas, no archivos `.acp-stream.jsonl`. Completado.
- La configuración de generación de ACP ya no conserva rutas de transcripciones JSONL. Completado.
- La captura de trayectorias en tiempo de ejecución escribe directamente filas de eventos/artefactos. El comando explícito de soporte/exportación puede seguir produciendo artefactos JSONL de paquetes de soporte como formato de exportación, pero la exportación de sesiones no vuelve a crear el JSONL de la sesión. Completado.
- Los espacios de trabajo en disco permanecen en el disco cuando se configura el modo de disco.
- El espacio temporal de VFS y el modo experimental de espacio de trabajo exclusivo de VFS utilizan la base de datos del agente.

La migración importa una sola vez los archivos JSONL antiguos, registra recuentos/hashes en
`migration_runs` y elimina los archivos importados después de las comprobaciones de integridad.

### Fase 5: Copia de seguridad, restauración, Vacuum y verificación

Las copias de seguridad siguen siendo un único archivo comprimido:

- Crear un punto de control para cada base de datos global y de agente.
- Crear una instantánea de cada base de datos con la semántica de copia de seguridad de SQLite o `VACUUM INTO`.
- Archivar instantáneas compactas de bases de datos, la configuración, las credenciales externas y las exportaciones de espacios de trabajo solicitadas.
- Omitir los archivos activos sin procesar `*.sqlite-wal` y `*.sqlite-shm`.
- Verificar abriendo cada instantánea de base de datos y ejecutando `PRAGMA integrity_check`.
  `openclaw backup create` realiza esta verificación del archivo comprimido de forma predeterminada;
  `--no-verify` omite únicamente la pasada posterior a la escritura sobre el archivo comprimido, no la comprobación de integridad de la creación de la instantánea.
- La restauración vuelve a copiar las instantáneas en sus rutas de destino. Las bases de datos globales restauradas utilizan la versión `1`; las bases de datos por agente restauradas utilizan la versión `2`, y las instantáneas de la versión `1` se actualizan atómicamente al abrirse.

### Fase 6: Tiempo de ejecución de trabajadores

Mantener el modo de trabajador como experimental mientras se implementa la división de las bases de datos:

- Los trabajadores reciben el identificador del agente, el identificador de ejecución, el modo del sistema de archivos y la identidad del registro de la base de datos.
- Cada trabajador abre su propia conexión de SQLite.
- El proceso principal conserva la autoridad sobre la entrega del canal, las aprobaciones, la configuración y la cancelación.
- Comenzar con un trabajador por ejecución activa; añadir agrupación solo después de que el ciclo de vida y la propiedad de las conexiones de la base de datos sean estables.

### Fase 7: Eliminar el mundo antiguo

Completado para la gestión de sesiones en tiempo de ejecución. El mundo antiguo solo se permite como entrada explícita de doctor o como salida de soporte/exportación:

- No hay escrituras en tiempo de ejecución de `sessions.json`, JSONL de transcripciones, JSON del registro de entornos aislados, SQLite auxiliar de tareas ni SQLite auxiliar del estado de plugins.
- No hay depuración de archivos JSON/de sesiones, truncamiento de archivos de transcripciones, bloqueos de archivos de sesiones ni pruebas de sesiones con formato de bloqueo.
- No hay exportaciones de compatibilidad en tiempo de ejecución cuyo propósito sea mantener actualizados los archivos de sesiones antiguos.
- Las exportaciones de soporte explícitas siguen siendo formatos de archivo comprimido/materialización solicitados por el usuario y no deben reincorporar nombres de archivos a la identidad en tiempo de ejecución.

## Copia de seguridad y restauración

Las copias de seguridad deben ser un único archivo comprimido, pero la captura de bases de datos debe ser nativa de SQLite:

1. Detener la actividad de escritura de larga duración o establecer una breve barrera de copia de seguridad.
2. Ejecutar un punto de control para cada base de datos global y de agente.
3. Crear instantáneas de las bases de datos con `VACUUM INTO` en un directorio temporal de copia de seguridad.
   Los esquemas de plugins que requieran capacidades de SQLite definidas por su propietario deben producir un error seguro hasta que este proporcione un contrato de instantáneas seguro.
4. Archivar las instantáneas de las bases de datos, el archivo de configuración, el directorio de credenciales, los espacios de trabajo seleccionados y un manifiesto.
5. Verificar la estructura de archivo de cada instantánea de SQLite, abrir después las bases de datos canónicas de OpenClaw y ejecutar `PRAGMA integrity_check` junto con la validación de roles. Los esquemas dedicados de plugins permanecen opacos salvo que su propietario proporcione un verificador.
   `openclaw backup create` realiza esta operación de forma predeterminada; `--no-verify` sirve únicamente para omitir intencionadamente la pasada posterior a la escritura sobre el archivo comprimido.

No utilizar copias directas de los archivos activos `*.sqlite`, `*.sqlite-wal` y `*.sqlite-shm` como formato principal de copia de seguridad. El manifiesto del archivo comprimido debe registrar el rol de la base de datos, el identificador del agente, la versión del esquema, la ruta de origen, la ruta de la instantánea, el tamaño en bytes y el estado de integridad.

La restauración debe reconstruir la base de datos global y los archivos de bases de datos de los agentes a partir de las instantáneas del archivo comprimido. El esquema global permanece en la versión `1`; las instantáneas por agente de la versión `1` reciben la actualización limitada en tiempo de ejecución a la versión `2`. Doctor sigue siendo el único responsable de la importación de archivos a bases de datos. El comando de restauración valida primero el archivo comprimido y después sustituye cada recurso del manifiesto por la carga útil extraída y verificada.

## Plan de refactorización del tiempo de ejecución

1. Añadir API del registro de bases de datos.
   - Resolver las rutas de la base de datos global y de las bases de datos por agente.
   - Mantener el esquema global en `user_version = 1`. Las bases de datos por agente utilizan la versión `2`
     con una migración atómica desde la estructura de origen de memoria de la versión publicada `1`.
   - Añadir asistentes de cierre, punto de control e integridad utilizados por las pruebas, las copias de seguridad y doctor.

2. Consolidar los almacenes auxiliares de SQLite.
   - Trasladar las tablas de estado de plugins a la base de datos global. Completado para las escrituras en tiempo de ejecución; se ha eliminado el importador auxiliar heredado no publicado.
   - Trasladar las tablas del registro de tareas a la base de datos global. Completado para las escrituras en tiempo de ejecución; se ha eliminado el importador auxiliar heredado no publicado.
   - Trasladar las tablas de Task Flow a la base de datos global. Completado para las escrituras en tiempo de ejecución; se ha eliminado el importador auxiliar heredado no publicado.
   - Trasladar las tablas integradas de búsqueda en memoria a cada base de datos de agente. Completado; doctor elimina ahora `memorySearch.store.path` personalizado mediante la migración de la configuración.
     La reindexación completa se ejecuta in situ únicamente sobre las tablas de memoria; se han eliminado la antigua ruta de sustitución del archivo completo y el asistente de intercambio del índice auxiliar.
   - Eliminar de esos subsistemas los abridores duplicados de bases de datos, la configuración de WAL, los asistentes de permisos y las rutas de cierre.

3. Trasladar las tablas propiedad de los agentes a bases de datos por agente.
   - Crear la base de datos del agente bajo demanda mediante el registro de la base de datos global. Completado.
   - Trasladar las entradas de sesiones en tiempo de ejecución, los eventos de transcripciones, las filas de VFS y los artefactos de herramientas a las bases de datos de los agentes. Completado.
   - No migrar las entradas de sesiones, los eventos de transcripciones, las filas de VFS ni los artefactos de herramientas de la base de datos compartida local de una rama; esa estructura nunca se publicó. Conservar únicamente la importación heredada de archivos a bases de datos en doctor.

4. Sustituir las API del almacén de sesiones.
   - Eliminar `storePath` como identidad en tiempo de ejecución. Completado para el tiempo de ejecución y protegido por `check:database-first-legacy-stores`: los metadatos de sesiones, las actualizaciones de rutas, la persistencia de comandos, la limpieza de sesiones de la CLI, las vistas previas de razonamiento de Feishu, la persistencia del estado de transcripciones, la profundidad de subagentes, las anulaciones de sesiones de perfiles de autenticación, la lógica de bifurcación principal y la inspección de QA-lab ahora resuelven la base de datos a partir de claves canónicas de agente/sesión.
     Las respuestas de listas de sesiones de Gateway/TUI/UI/macOS ahora exponen `databasePath`
     en lugar del `path` heredado; las superficies de depuración de macOS muestran la base de datos por agente como estado de solo lectura en lugar de escribir la configuración `session.store`.
     `/status`, la exportación de trayectorias controlada por chat y los proxies de dependencias de la CLI ya no propagan rutas heredadas del almacén; la reserva del uso de transcripciones lee SQLite mediante la identidad de agente/sesión. Las pruebas del tiempo de ejecución y del puente ya no exponen
     `storePath`; las entradas de doctor/migración son propietarias de ese nombre de campo heredado.
     La carga combinada de sesiones de Gateway ya no tiene una rama especial en tiempo de ejecución para valores no basados en plantillas de `session.store`; agrega filas de SQLite por agente.
     Se eliminaron el flujo de doctor para bloqueos de sesiones heredados y su asistente de limpieza `.jsonl.lock`; ahora SQLite es el límite de concurrencia de las sesiones.
     Los puntos de llamada activos en tiempo de ejecución utilizan nombres de asistentes orientados a filas, como
     `resolveSessionRowEntry`; el antiguo alias de compatibilidad `resolveSessionStoreEntry`
     se ha eliminado de las exportaciones del tiempo de ejecución y del SDK de plugins.

- Utilizar operaciones de filas `{ agentId, sessionKey }`.
  Completado: `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`,
  `patchSessionEntry` y `listSessionEntries` son API que priorizan SQLite y no requieren una ruta del almacén de sesiones. El resumen de estado, el estado del agente local, el estado del sistema y el comando de listado `openclaw sessions` ahora leen directamente las filas por agente y muestran las rutas de las bases de datos SQLite por agente en lugar de rutas `sessions.json`.
- Sustituir la eliminación/inserción del almacén completo por `upsertSessionEntry`,
  `deleteSessionEntry`, `listSessionEntries` y consultas SQL de limpieza.
  Completado para el tiempo de ejecución: las rutas activas ahora utilizan API de filas y parches de filas con reintentos ante conflictos; los asistentes restantes para importar/sustituir almacenes completos se limitan al código de importación de migraciones y a las pruebas del backend de SQLite.
  - Eliminar `store-writer.ts` y las pruebas de colas de escritores. Completado.
  - Eliminar del tiempo de ejecución la depuración de claves heredadas y los parámetros de eliminación de alias de las inserciones o actualizaciones/parches de filas de sesiones. Completado.

5. Eliminar el comportamiento del registro JSON en tiempo de ejecución.
   - Hacer que las lecturas y escrituras del registro del entorno aislado usen exclusivamente SQLite. Hecho.
   - Importar JSON monolítico y fragmentado únicamente desde el paso de migración. Hecho.
   - Eliminar los bloqueos del registro fragmentado y las escrituras JSON. Hecho.

- Mantener una única tabla de registro tipada en lugar de almacenar las filas del registro como JSON genérico
  opaco si la estructura sigue siendo estado operativo de la ruta crítica. Hecho.

6. Eliminar la mutación de sesiones basada en bloqueos de archivos.
   - Hecho para la creación de bloqueos en tiempo de ejecución y las API de bloqueo en tiempo de ejecución.
   - Se ha eliminado la vía independiente de limpieza heredada `.jsonl.lock` de doctor.
   - La integridad del estado ya no tiene una ruta separada para depurar archivos
     de transcripción huérfanos; la migración de doctor importa/elimina las fuentes JSONL heredadas en un solo lugar.
   - La coordinación de la instancia única del Gateway utiliza filas tipadas de SQLite `state_leases` en
     `gateway_locks` y ya no expone un punto de integración de directorio de bloqueos de archivos.
   - La persistencia genérica de deduplicación del SDK de plugins ya no utiliza bloqueos de archivos ni archivos
     JSON; escribe filas de estado compartido de plugins en SQLite. Hecho.
   - La coordinación de QMD utiliza un arrendamiento compartido de SQLite para las incrustaciones y un arrendamiento
     de SQLite por agente para cada proceso de escritura de colecciones/actualizaciones/incrustaciones. El tiempo de ejecución ya no
     crea `qmd/embed.lock.lock` ni `agents/<agentId>/qmd-write.lock.lock`;
     Doctor elimina únicamente los archivos auxiliares retirados que están obsoletos con certeza. Hecho.

7. Hacer que los workers tengan en cuenta la base de datos.
   - Los workers abren sus propias conexiones SQLite.
   - El proceso principal es responsable de la entrega, las devoluciones de llamada de los canales y la configuración.
   - El worker recibe el id. del agente, el id. de ejecución, el modo del sistema de archivos y la identidad
     del registro de la base de datos, no identificadores activos.
   - `vfs-only` sigue siendo experimental y utiliza la base de datos del agente como raíz de
     almacenamiento.
   - Mantener inicialmente un worker por cada ejecución activa. La agrupación puede esperar hasta que la duración
     de las conexiones a la base de datos y el comportamiento de cancelación sean rutinarios.

8. Integración de copias de seguridad.
   - Hacer que las copias de seguridad creen instantáneas de las bases de datos globales, de agentes y de plugins con
     `VACUUM INTO`. Hecho para los archivos `*.sqlite` detectados bajo el recurso de estado;
     los esquemas de plugins que requieren capacidades no disponibles del propietario fallan de forma segura.
   - Añadir verificación de copias de seguridad para la integridad canónica de SQLite y la identidad del esquema,
     además de validación genérica de la estructura de archivos para instantáneas dedicadas de plugins. Hecho para
     la creación de copias de seguridad y la verificación predeterminada de archivos.
   - Registrar los metadatos de las ejecuciones de copias de seguridad en SQLite. Hecho mediante la tabla compartida `backup_runs`
     con la ruta del archivo, el estado y el JSON del manifiesto.
   - Añadir restauración desde instantáneas de archivos verificadas. Hecho: `openclaw backup
restore` valida antes de la extracción, utiliza el manifiesto normalizado
     del verificador, admite `--dry-run` y requiere `--yes` antes de sustituir
     las rutas de origen registradas.
   - Incluir la exportación de VFS/espacio de trabajo únicamente cuando se solicite; no exportar los
     datos internos de las sesiones como JSON o JSONL.

9. Eliminar las pruebas y el código obsoletos. Hecho para las superficies conocidas de sesión en tiempo de ejecución.

- Eliminar las pruebas que comprueban la creación en tiempo de ejecución de `sessions.json` o archivos de transcripción
  JSONL. Completado para el almacén de sesiones del núcleo, el chat, los eventos de transcripción del Gateway,
  la vista previa, el ciclo de vida, las actualizaciones de entradas de sesión de comandos, el restablecimiento/rastreo de respuestas automáticas y
  los fixtures de Dreaming de memory-core, el enrutamiento de destinos de aprobación, la reparación de transcripciones
  de sesiones, la reparación de permisos de seguridad, la exportación de trayectorias y la exportación de sesiones.
  Las pruebas de transcripciones de Active Memory ahora comprueban los ámbitos de SQLite y que no se creen
  archivos JSONL temporales ni persistentes.
  Se eliminó la antigua regresión de poda de transcripciones de Heartbeat porque
  el tiempo de ejecución ya no trunca las transcripciones JSONL.
  Las pruebas de la herramienta de listado de sesiones del agente ya no modelan las rutas heredadas `sessions.json`
  como la estructura de respuesta del Gateway; las pruebas de la aplicación, la interfaz de usuario y macOS usan `databasePath`.
  Las pruebas de uso de transcripciones de `/status` ahora insertan directamente filas de transcripción de SQLite
  en lugar de escribir archivos JSONL.
  Las pruebas del ciclo de vida de sesiones del Gateway ahora usan directamente ayudantes para insertar transcripciones en SQLite;
  la antigua estructura de fixture de archivo de sesión de una sola línea desapareció de la cobertura de restablecimiento
  y eliminación.
  `sessions.delete` ya no devuelve un campo `archived: []` de la época de los archivos; la eliminación
  solo informa del resultado de la mutación de filas. También desapareció la antigua opción `deleteTranscript`:
  eliminar una sesión quita la raíz canónica `sessions` y permite que
  SQLite elimine en cascada las filas de transcripción, instantáneas y trayectorias pertenecientes a la sesión, para que ningún
  invocador pueda dejar transcripciones huérfanas ni olvidar una rama de limpieza.
  Las pruebas de captura de trayectorias del motor de contexto ahora leen filas `trajectory_runtime_events`
  de una base de datos de agente aislada en lugar de leer
  `session.trajectory.jsonl`.
  Los scripts de inserción inicial de canales MCP de Docker ahora insertan directamente filas de SQLite. Las escrituras directas
  de `sessions.json` se limitan a los fixtures de doctor.
  La prueba E2E de Tool Search Gateway lee las evidencias de llamadas a herramientas de las filas de transcripción de SQLite
  en lugar de examinar archivos `agents/<agentId>/sessions/*.jsonl`.
  Los eventos del host de memory-core y las filas temporales del corpus de sesiones ahora residen en el estado compartido
  de plugins de SQLite; `events.jsonl` y `session-corpus/*.txt` son únicamente entradas heredadas
  para la migración de doctor. Las filas activas usan rutas virtuales `memory/session-ingestion/`,
  no `.dreams/session-corpus`. Se eliminaron el antiguo módulo de reparación de Dreaming de memory-core
  y sus pruebas de CLI/Gateway porque el tiempo de ejecución ya no
  se encarga de reparar el archivo de ficheros de ese corpus. Las pruebas del
  puente/artefacto público de memory-core ya no exponen `.dreams/events.jsonl`; usan
  el nombre del artefacto JSON virtual respaldado por SQLite.
  La documentación pública de pruebas del SDK/Codex ahora indica estado de sesión de SQLite en lugar de archivos
  de sesión, y el ejemplo de turno de canal ya no expone un argumento `storePath`.
  El estado de sincronización de Matrix ahora usa directamente el almacén de estado de plugins de SQLite. Los contratos activos
  de cliente/tiempo de ejecución pasan una raíz de almacenamiento de cuenta, no una ruta `bot-storage.json`,
  y doctor importa el `bot-storage.json` heredado en SQLite antes de eliminar
  el origen. Los escenarios destructivos y de reinicio de Matrix en QA Lab ahora modifican directamente la fila
  de sincronización de SQLite en lugar de crear o eliminar archivos `bot-storage.json` falsos, y
  el sustrato E2EE pasa una raíz del almacén de sincronización en lugar de una ruta
  `sync-store.json` falsa.
  La selección de la raíz de almacenamiento de Matrix ya no puntúa las raíces según archivos JSON heredados de sincronización/hilos;
  usa metadatos duraderos de la raíz junto con el estado criptográfico real.
  El conjunto de pruebas del backend de sesiones SQLite en tiempo de ejecución ya no fabrica un
  `sessions.json`; los fixtures de orígenes heredados ahora residen en las pruebas de doctor
  que los importan.
  Las pruebas de sesiones del Gateway ya no exponen un ayudante `createSessionStoreDir` ni
  una configuración de ruta temporal del almacén de sesiones sin usar; los directorios de fixtures son explícitos y la configuración
  directa de filas usa la nomenclatura de filas de sesión de SQLite.
  La cobertura del analizador del almacén de sesiones JSON5 exclusivo de doctor se trasladó de las pruebas de infraestructura
  a las pruebas de migración de doctor, por lo que los conjuntos de pruebas en tiempo de ejecución ya no se encargan del análisis
  de archivos de sesión heredados.
  Las pruebas de SSO/cargas pendientes en tiempo de ejecución de Microsoft Teams ya no incluyen fixtures
  ni analizadores de archivos auxiliares JSON; el análisis de tokens SSO heredados reside únicamente en el módulo
  de migración del plugin. Las pruebas de Telegram ya no insertan rutas falsas del almacén `/tmp/*.json`;
  restablecen directamente la caché de mensajes respaldada por SQLite. El ayudante genérico
  de estado de pruebas de OpenClaw ya no expone un escritor heredado `auth-profiles.json`;
  las pruebas de migración de autenticación de doctor administran ese fixture localmente.
  Las pruebas en tiempo de ejecución de punteros de última sesión de TUI, aprobaciones de ejecución, conmutadores de Active Memory,
  deduplicación/verificación de inicio de Matrix, sincronización de orígenes de Memory Wiki,
  vinculaciones de conversaciones actuales, autenticación de incorporación e importaciones de secretos de Hermes ya no
  generan archivos auxiliares antiguos ni comprueban la ausencia de nombres de archivo antiguos. Demuestran
  el comportamiento mediante filas de SQLite y API públicas del almacén; las pruebas de doctor/migración
  son el único lugar donde deben aparecer los nombres de archivo de origen heredados.
  Las pruebas en tiempo de ejecución de emparejamiento de dispositivos/nodos, allowFrom de canales, intenciones de reinicio,
  traspaso de reinicio, entradas de la cola de entrega de sesiones, estado de configuración, cachés de iMessage,
  trabajos de Cron, encabezados de transcripción de PI, registros de subagentes y archivos adjuntos
  de imágenes administradas tampoco crean ya archivos JSON/JSONL retirados únicamente para demostrar
  que se ignoran o no existen.
  La recuperación por desbordamiento de PI ya no tiene una alternativa de reescritura/truncamiento de SessionManager:
  el truncamiento de resultados de herramientas y las reescrituras de transcripciones del motor de contexto modifican
  las filas de transcripción de SQLite y después actualizan el estado activo del prompt desde la base de datos.
  Las adiciones persistentes de mensajes de SessionManager delegan en el ayudante atómico de adición
  de transcripciones de SQLite para la selección del elemento principal y la idempotencia. Las adiciones normales
  de metadatos/entradas personalizadas también seleccionan el elemento principal actual dentro de SQLite, para que
  las instancias obsoletas del administrador no reactiven las condiciones de carrera de la cadena de elementos principales anteriores a SQLite.
  La limpieza sintética de la cola de PI para las comprobaciones previas a mitad de turno y `sessions_yield` ahora
  recorta directamente el estado de transcripción de SQLite; se eliminaron el antiguo puente de eliminación
  de la cola de SessionManager y sus pruebas.
  La captura de puntos de control de Compaction también crea instantáneas únicamente desde SQLite; los invocadores ya no
  pasan un SessionManager activo como origen alternativo de la transcripción.
- Mantener las pruebas que insertan archivos heredados únicamente para la migración.
- Las comprobaciones basadas en archivos JSON se han sustituido por comprobaciones de filas SQL para las superficies activas
  del tiempo de ejecución.

- Añadir prohibiciones estáticas para las escrituras en tiempo de ejecución en rutas JSON heredadas de sesiones/caché.
  Completado para la protección del repositorio.

10. Hacer que el informe de migración sea auditable.
    - Registrar las ejecuciones de migración en SQLite con marcas de tiempo de inicio/finalización, rutas
      de origen, hashes de origen, recuentos, advertencias y ruta de la copia de seguridad.
      Completado: las ejecuciones de migración del estado heredado ahora conservan un informe `migration_runs`
      con el inventario de rutas/tablas de origen, el SHA-256 de los archivos de origen, tamaños,
      recuentos de registros, advertencias y la ruta de la copia de seguridad.
      Completado: las ejecuciones de migración del estado heredado también conservan filas `migration_sources`
      para la auditoría por origen y futuras decisiones de omisión/relleno retroactivo.
    - Hacer que la aplicación sea idempotente. Al volver a ejecutarla después de una importación parcial, debe
      omitir un origen ya importado o combinarlo mediante una clave estable.
      Completado: los índices de sesiones, las transcripciones, las colas de entrega, el estado
      de plugins, los libros de tareas y las filas globales de SQLite pertenecientes a agentes se importan mediante claves estables o
      semántica de actualización/inserción o reemplazo, por lo que las nuevas ejecuciones combinan los datos sin duplicar filas
      duraderas.
    - Las importaciones fallidas deben conservar el archivo de origen original en su ubicación.
      Completado: las importaciones de transcripciones fallidas ahora dejan el origen JSONL original en
      su ruta detectada, y `migration_sources` registra el origen como
      `warning` con `removed_source=0` para la siguiente ejecución de doctor.

## Reglas de rendimiento

- Una conexión por hilo/proceso es aceptable; no se deben compartir manejadores entre
  procesos de trabajo.
- Usar WAL, `foreign_keys=ON`, un tiempo de espera por ocupación de 5s y transacciones de escritura `BEGIN IMMEDIATE`
  breves. No superponer reintentos síncronos de bloqueo a la única
  espera por ocupación de SQLite.
- Mantener síncronos los ayudantes de transacciones de escritura hasta que una API de transacciones asíncrona
  añada una semántica explícita de exclusión mutua/contrapresión.
- Mantener pequeñas y transaccionales las escrituras de entrega al elemento principal.
- Evitar las reescrituras de todo el almacén; usar actualización/inserción o eliminación por filas.
- Añadir índices para las rutas de listado por agente, listado por sesión, fecha de actualización, id de ejecución y
  expiración antes de trasladar código crítico.
- Almacenar artefactos grandes, contenido multimedia y vectores como BLOB o filas BLOB fragmentadas, no como
  JSON en base64 ni de matrices numéricas.
- Mantener pequeñas y acotadas las entradas opacas del estado de plugins.
- Añadir limpieza SQL para TTL/expiración en lugar de poda del sistema de archivos.
  Completado para los almacenes en tiempo de ejecución propiedad de la base de datos: el contenido multimedia, el estado de plugins, los blobs de plugins,
  la deduplicación persistente y la caché de agentes expiran mediante filas de SQLite. La limpieza restante
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
- `openclaw-workspace-state.json`
- `workspace-state.json`
- `workspace-attestations/*.attested`
- hermano `<workspace>.attested`
- Matrix `credentials*.json` y `recovery-key.json`
- `cron/runs/*.jsonl`
- `cron/jobs.json`
- `jobs-state.json`
- `device-pair-notify.json`
- `devices/pending.json` / `devices/paired.json` / `devices/bootstrap.json`
  (retirados en 2026.7: el almacén de ejecución es `device_pairing_*` /
  `device_bootstrap_tokens` en la base de datos de estado compartida; los registros emparejados se importan al
  iniciar el Gateway, y se descartan las filas transitorias pendientes/de arranque)
- `nodes/pending.json` / `nodes/paired.json` (retirados en 2026.7: integrados en los registros de dispositivos emparejados al iniciar el Gateway)
- `identity/device.json`
- `identity/device-auth.json` (retirado; importación exclusiva de Doctor en `device_auth_tokens`)
- `push/web-push-subscriptions.json` (retirado; importación exclusiva de Doctor en `web_push_subscriptions`)
- `push/vapid-keys.json` (retirado; importación exclusiva de Doctor en `web_push_vapid_keys`)
- `push/apns-registrations.json` (retirado; importación exclusiva de Doctor en `apns_registrations`)
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
- `plugin-state/state.sqlite`
- archivos auxiliares de ejecución `openclaw-state.sqlite` ad hoc
- `tasks/runs.sqlite`
- `tasks/flows/registry.sqlite`
- `bindings/current-conversations.json`
- `restart-sentinel.json`
- `gateway-restart-intent.json`
- `gateway-supervisor-restart-handoff.json`
- `gateway.<hash>.lock`
- `qmd/embed.lock.lock`
- `agents/<agentId>/qmd-write.lock.lock`
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
- `openclaw/rescue-pending/*.json`
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
  fachadas de reemplazo de sesiones mutables
- `SessionManager.createBranchedSession(...)` y
  `TranscriptSessionManager.createBranchedSession(...)` fachadas de sesiones de rama

La prohibición debe permitir que las pruebas creen accesorios heredados y que el código de migración
lea, importe y elimine fuentes de archivos heredados. Las bases de datos SQLite auxiliares no publicadas siguen prohibidas
y no reciben permisos de importación de Doctor.

## Criterios de finalización

- Los datos de ejecución y las escrituras de caché se almacenan en la base de datos SQLite global o del agente.
- La ejecución ya no escribe índices de sesión, JSONL de transcripciones, JSON
  del registro del entorno aislado, SQLite auxiliar de tareas ni SQLite auxiliar del estado de plugins. Se eliminan los importadores
  no publicados de SQLite auxiliar de tareas y del estado de plugins.
- La importación de archivos heredados es exclusiva de Doctor.
- La copia de seguridad genera un único archivo con instantáneas SQLite compactas y una prueba de integridad.
- Los procesos de trabajo de agentes pueden ejecutarse con almacenamiento en disco, espacio temporal VFS o almacenamiento
  experimental exclusivamente VFS.
- La configuración y los archivos explícitos de credenciales siguen siendo los únicos archivos de control persistentes
  ajenos a la base de datos que se esperan.
- Las comprobaciones del repositorio impiden volver a introducir almacenes de archivos de ejecución heredados.
