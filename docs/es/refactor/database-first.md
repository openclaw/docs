---
read_when:
    - Mover datos de tiempo de ejecución, caché, transcripciones, estado de tareas o archivos temporales de OpenClaw a SQLite
    - Diseñar migraciones de doctor desde archivos JSON o JSONL
    - Cambiar el comportamiento de copias de seguridad, restauración, VFS o almacenamiento de workers
    - Eliminación de bloqueos de sesión, purga, truncamiento o rutas de compatibilidad con JSON
summary: Plan de migración para hacer de SQLite la capa principal de estado durable y caché, manteniendo la configuración respaldada por archivos
title: Refactorización del estado con prioridad en la base de datos
x-i18n:
    generated_at: "2026-07-01T20:12:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 566e6aacfaa6aff0db2d1d143ef313d0ce97b82428152bc8940856e317a149ff
    source_path: refactor/database-first.md
    workflow: 16
---

# Refactorización del estado con prioridad de base de datos

## Decisión

Usar un diseño SQLite de dos niveles:

- Base de datos global: `~/.openclaw/state/openclaw.sqlite`
- Base de datos del agente: una base de datos SQLite por agente para el espacio
  de trabajo, la transcripción, el VFS, los artefactos y el estado grande en
  tiempo de ejecución propiedad del agente
- La configuración sigue respaldada por archivos: `openclaw.json` permanece
  fuera de la base de datos. Los perfiles de autenticación en tiempo de ejecución
  se trasladan a SQLite; los archivos de credenciales de proveedores externos o
  de la CLI siguen gestionados por su propietario fuera de la base de datos de
  OpenClaw.

La base de datos global es la base de datos del plano de control. Es propietaria
del descubrimiento de agentes, el estado compartido del Gateway, el
emparejamiento, el estado de dispositivos/nodos, los libros mayores de tareas y
flujos, el estado de Plugin, el estado en tiempo de ejecución del planificador,
los metadatos de copias de seguridad y el estado de migración.

La base de datos del agente es la base de datos del plano de datos. Es
propietaria de los metadatos de sesión del agente, el flujo de eventos de la
transcripción, el espacio de trabajo VFS o espacio de nombres temporal, los
artefactos de herramientas, los artefactos de ejecución y los datos de caché
locales del agente que se pueden buscar e indexar.

Esto proporciona una vista global duradera sin obligar a que los espacios de
trabajo grandes de agentes, las transcripciones y los datos binarios temporales
entren en el carril compartido de escritura del Gateway.

## Contrato estricto

Esta migración tiene una única forma canónica en tiempo de ejecución:

- Las filas de sesión persisten solo metadatos de sesión. No deben persistir
  `transcriptLocator`, rutas de archivos de transcripción, rutas JSONL hermanas,
  rutas de bloqueo, metadatos de poda ni punteros de compatibilidad de la era de
  archivos.
- La identidad de transcripción siempre es identidad SQLite: `{agentId, sessionId}`
  más metadatos de tema opcionales cuando el protocolo los necesita.
- `sqlite-transcript://...` no es una identidad de tiempo de ejecución ni de
  protocolo. El código nuevo no debe derivar, persistir, pasar, analizar ni
  migrar localizadores de transcripción. El entorno de ejecución y las pruebas
  no deben contener pseudolocalizadores en absoluto; la documentación puede
  mencionar la cadena solo para prohibirla.
- Los `sessions.json` heredados, JSONL de transcripciones, `.jsonl.lock`, poda,
  truncamiento y lógica antigua de rutas de sesión pertenecen solo a la ruta de
  migración/importación de doctor.
- Los alias heredados de configuración de sesión pertenecen solo a la migración
  de doctor. El entorno de ejecución no interpreta `session.idleMinutes`,
  `session.resetByType.dm` ni alias de sesión principal entre agentes
  `agent:main:*` para otro agente configurado.
- La identidad de enrutamiento de sesión es estado relacional tipado. Las rutas
  activas de tiempo de ejecución y de interfaz deben leer `sessions.session_scope`,
  `sessions.account_id`, `sessions.primary_conversation_id`, `conversations` y
  `session_conversations`; no deben analizar `session_key` ni extraer identidad
  de proveedor de `session_entries.entry_json`, salvo como sombra de
  compatibilidad mientras se eliminan sitios de llamada antiguos.
- Los marcadores de mensaje directo a nivel de canal, como `dm` frente a
  `direct`, son vocabulario de enrutamiento, no localizadores de transcripción
  ni identificadores de compatibilidad del almacén de archivos.
- La configuración heredada de manejadores de hooks pertenece solo a superficies
  de advertencia/migración de doctor. El entorno de ejecución no debe cargar
  `hooks.internal.handlers`; los hooks se ejecutan únicamente mediante
  directorios de hooks descubiertos y metadatos `HOOK.md`.
- El arranque del entorno de ejecución, las rutas activas de respuesta,
  Compaction, restablecimiento, recuperación, diagnósticos, TTS, hooks de
  memoria, subagentes, enrutamiento de comandos de Plugin, límites de protocolo
  y hooks deben pasar `{agentId, sessionId}` por el entorno de ejecución.
- Las pruebas deben sembrar y comprobar filas de transcripción SQLite mediante
  `{agentId, sessionId}`. Las pruebas que solo demuestran el reenvío de rutas
  JSONL, la preservación de localizadores proporcionados por el llamador o la
  compatibilidad con archivos de transcripción deben eliminarse, salvo que cubran
  importación de doctor, materialización de soporte/depuración sin sesión o la
  forma del protocolo.
- `runEmbeddedPiAgent(...)`, las ejecuciones de workers preparadas y el intento
  embebido interno no deben aceptar localizadores de transcripción. Abren el
  gestor de transcripciones SQLite por `{agentId, sessionId}` y pasan ese gestor
  a la sesión de agente compatible con PI internalizada, para que los llamadores
  obsoletos no puedan hacer que el ejecutor escriba transcripciones JSON/JSONL.
- Los diagnósticos del ejecutor deben almacenar registros de trazas de
  runtime/caché/carga útil en SQLite. Los diagnósticos en tiempo de ejecución no
  deben exponer controles de anulación de archivos JSONL ni ayudantes genéricos
  de exportación de transcripciones JSONL; las exportaciones visibles para el
  usuario pueden materializar artefactos explícitos desde filas de base de datos
  sin devolver nombres de archivo al entorno de ejecución.
- El registro sin procesar de flujos usa `OPENCLAW_RAW_STREAM=1` más filas de
  diagnósticos SQLite. El contrato antiguo de pi-mono `PI_RAW_STREAM`,
  `PI_RAW_STREAM_PATH` y el registrador de archivos `raw-openai-completions.jsonl`
  no forma parte del entorno de ejecución ni de las pruebas de OpenClaw.
- La indexación de memoria QMD no debe exportar transcripciones SQLite a archivos
  markdown. QMD indexa solo archivos de memoria configurados; la búsqueda de
  transcripciones de sesión sigue respaldada por SQLite.
- La subruta del SDK de QMD es solo para QMD en código nuevo. Los ayudantes de
  indexación de transcripciones de sesión SQLite viven en
  `memory-core-host-engine-session-transcripts`; cualquier reexportación de QMD
  es solo compatibilidad y no debe usarse en código de tiempo de ejecución.
- Los índices de memoria integrados viven en la base de datos del agente
  propietario. La configuración en tiempo de ejecución y los contratos resueltos
  en tiempo de ejecución no deben exponer `memorySearch.store.path`; doctor
  elimina esa clave de configuración heredada y el código actual pasa
  internamente el `databasePath` del agente.

El trabajo de implementación debe seguir eliminando código hasta que estas
afirmaciones sean verdaderas sin excepciones fuera de los límites de
doctor/importación/exportación/depuración.

## Estado objetivo y progreso

### Objetivo estricto

- Una base de datos SQLite global es propietaria del estado del plano de control:
  `state/openclaw.sqlite`.
- Una base de datos SQLite por agente es propietaria del estado del plano de
  datos:
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- La configuración sigue respaldada por archivos. `openclaw.json` no forma parte
  de esta refactorización de base de datos.
- Los archivos heredados son solo entradas de migración de doctor.
- El entorno de ejecución nunca escribe ni lee JSONL de sesiones o
  transcripciones como estado activo.

### Estados objetivo

- `not-started`: el código de tiempo de ejecución de la era de archivos todavía
  escribe estado activo.
- `migrating`: el código de doctor/importación puede mover datos de archivos a
  SQLite.
- `dual-read`: puente temporal que lee tanto SQLite como archivos heredados.
  Este estado está prohibido para esta refactorización salvo que se documente
  explícitamente como solo de doctor.
- `sqlite-runtime`: el entorno de ejecución lee y escribe solo SQLite.
- `clean`: se eliminan las API y pruebas heredadas del entorno de ejecución, y
  la guarda evita regresiones.
- `done`: la documentación, las pruebas, las copias de seguridad, la migración
  de doctor y las comprobaciones de cambios demuestran el estado limpio.

### Estado actual

- Sesiones: `clean` para el entorno de ejecución. Las filas de sesión viven en
  la base de datos por agente, las API en tiempo de ejecución usan
  `{agentId, sessionId}` o `{agentId, sessionKey}`, y `sessions.json` es una
  entrada heredada solo de doctor.
- Transcripciones: `clean` para el entorno de ejecución. Los eventos de
  transcripción, identidades, snapshots y eventos de trayectoria en tiempo de
  ejecución viven en la base de datos por agente. El entorno de ejecución ya no
  acepta localizadores de transcripción ni rutas de transcripciones JSONL.
- Ejecutador PI embebido: `clean`. Las ejecuciones PI embebidas, los workers
  preparados, Compaction y los bucles de reintento usan el alcance de sesión
  SQLite y rechazan identificadores de transcripción obsoletos.
- Cron: `clean` para el entorno de ejecución. El entorno de ejecución usa
  `cron_jobs` y `cron_run_logs`; las pruebas de tiempo de ejecución usan nombres
  SQLite `storeKey`, y las rutas de Cron de la era de archivos permanecen solo en
  pruebas de migración heredada de doctor.
- Registro de tareas: `clean`. Las filas de tiempo de ejecución de tareas y Task
  Flow viven en `state/openclaw.sqlite`; se eliminaron los importadores SQLite
  sidecar no publicados.
- Estado de Plugin: `clean`. Las filas de estado/blob de Plugin viven en la base
  de datos global compartida; los ayudantes SQLite sidecar antiguos de estado de
  Plugin están protegidos contra su uso.
- Memoria: `sqlite-runtime` para la memoria integrada y la indexación de
  transcripciones de sesión. Las tablas de índice de memoria viven en la base de
  datos por agente, el estado de memoria de Plugin usa filas compartidas de
  estado de Plugin, y los archivos de memoria heredados son entradas de migración
  de doctor o contenido del espacio de trabajo del usuario.
- Copia de seguridad: `sqlite-runtime`. Las etapas de copia de seguridad
  compactan snapshots SQLite, omiten sidecars WAL/SHM activos, verifican la
  integridad de SQLite y registran ejecuciones de copia de seguridad en la base
  de datos global.
- Migración de doctor: `migrating`, intencionalmente. Doctor importa JSON, JSONL
  y almacenes sidecar retirados heredados a SQLite, registra ejecuciones/fuentes
  de migración y elimina las fuentes correctas.
- Scripts E2E: `clean` para la cobertura en tiempo de ejecución. La siembra MCP
  de Docker escribe filas SQLite. El script Docker de contexto de tiempo de
  ejecución crea JSONL heredado solo dentro de la semilla de migración de doctor
  y nombra explícitamente la ruta heredada del índice de sesiones.

### Trabajo restante

- [x] Renombrar las variables de almacén en pruebas de tiempo de ejecución de
      Cron para que dejen de usar `storePath` salvo que sean entradas heredadas
      de doctor.
      Archivos: `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`.
      Prueba: `pnpm check:database-first-legacy-stores`; `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`.
- [x] Eliminar o renombrar mocks obsoletos de pruebas de exportación de la era
      de archivos.
      Archivo: `src/auto-reply/reply/commands-export-test-mocks.ts`.
      Prueba: `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`.
- [x] Hacer que la semilla JSONL heredada de Docker runtime-context sea
      obviamente solo de doctor.
      Archivo: `scripts/e2e/session-runtime-context-docker-client.ts`.
      Prueba: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` muestra solo
      `seedBrokenLegacySessionForDoctorMigration`.
- [x] Mantener los tipos generados de Kysely alineados después de cualquier
      cambio de esquema.
      Archivos: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      Prueba: no hay cambio de esquema en esta pasada; `pnpm db:kysely:check`;
      `pnpm lint:kysely`.
- [x] Volver a ejecutar pruebas focalizadas para almacenes, comandos y scripts
      tocados.
      Prueba: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`.
- [x] Antes de declarar `done`, ejecutar la puerta de cambios o una prueba
      amplia remota.
      Prueba: `pnpm check:changed --timed -- <changed extension paths>` pasó en
      la ejecución Hetzner Crabbox `run_3f1cabf6b25c` después de la configuración
      temporal de Node 24/pnpm y el enrutamiento explícito de rutas para el
      espacio de trabajo sincronizado sin `.git`.

### No regresar

- Sin localizadores de transcripción.
- Sin archivos de sesión activos.
- Sin fixtures de prueba JSONL falsos, salvo pruebas de migración heredada de
  doctor.
- Sin acceso SQLite sin procesar donde se espera Kysely.
- Sin nuevas migraciones de base de datos heredadas. Este diseño no se ha
  publicado; mantener la versión de esquema en `1` salvo que haya una razón
  fuerte.

## Supuestos de lectura de código

No hay decisiones de producto de seguimiento que bloqueen este plan. La
implementación debe proceder con estos supuestos:

- Use `node:sqlite` directamente y exige el runtime de Node 22+ para esta ruta de
  almacenamiento.
- Mantén exactamente un archivo de configuración normal. No muevas la configuración, los manifiestos de plugins
  ni los espacios de trabajo Git a SQLite en esta refactorización.
- Los archivos de compatibilidad en runtime no son necesarios. Los archivos JSON y JSONL heredados son
  solo entradas de migración. Los sidecars SQLite locales de la rama nunca se publicaron y se
  eliminan en lugar de importarse.
- `openclaw doctor --fix` es responsable del paso de migración de archivos heredados a base de datos.
  El arranque del runtime y `openclaw migrate` no deben llevar rutas heredadas de
  actualización de base de datos de OpenClaw.
- La compatibilidad de credenciales sigue la misma regla: las credenciales de runtime viven en
  SQLite. Los archivos antiguos `auth-profiles.json`, `auth.json` por agente y
  `credentials/oauth.json` compartidos son entradas de migración de doctor y luego se eliminan
  después de importarse.
- El estado generado del catálogo de modelos está respaldado por la base de datos. El código de runtime no debe escribir
  `agents/<agentId>/agent/models.json`; los archivos `models.json` existentes son entradas heredadas de
  doctor y se eliminan después de importarse a `agent_model_catalogs`.
- El runtime no debe migrar, normalizar ni tender puentes para localizadores de transcripciones. La identidad activa de
  transcripción es `{agentId, sessionId}` en SQLite. Las rutas de archivos son
  solo entradas heredadas de doctor, y `sqlite-transcript://...` debe desaparecer de las
  superficies de runtime, protocolo, hook y plugin en lugar de tratarse como un
  identificador de frontera.
- Las lecturas de transcripciones SQLite en runtime no ejecutan migraciones antiguas de forma de entrada JSONL ni
  reescriben transcripciones completas por compatibilidad. La normalización de entradas heredadas permanece en
  utilidades explícitas de doctor/importación. Doctor normaliza los archivos de transcripción JSONL heredados
  antes de insertar filas SQLite; las filas actuales de runtime ya se escriben en el
  esquema actual de transcripciones. La exportación de trayectoria/sesión lee esas filas tal cual
  y no debe realizar migraciones heredadas en tiempo de exportación.
- Los helpers heredados de análisis/migración de transcripciones JSONL son solo para doctor. El código de
  formato de transcripción en runtime construye únicamente el contexto actual de transcripción SQLite; doctor
  es responsable de las actualizaciones de entradas JSONL antiguas antes de insertar filas.
- Se eliminó el helper antiguo de streaming de transcripciones JSONL propiedad del runtime. El código de
  importación de doctor es responsable de las lecturas explícitas de archivos heredados; el historial de sesiones de runtime lee
  filas SQLite.
- Los enlaces del servidor de la app de Codex usan el `sessionId` de OpenClaw como la clave
  canónica en el espacio de nombres de estado del plugin Codex. `sessionKey` es metadato para
  enrutamiento/visualización y no debe reemplazar el id durable de sesión ni resucitar
  la identidad de archivo de transcripción.
- Los motores de contexto reciben directamente el contrato actual de runtime. El registro
  no debe envolver motores con shims de reintento que eliminen `sessionKey`,
  `transcriptScope` o `prompt`; los motores que no puedan aceptar los parámetros actuales
  con prioridad de base de datos deben fallar de forma ruidosa en lugar de tener un puente.
- La salida de copia de seguridad debe seguir siendo un archivo de archivado. El contenido de la base de datos debe entrar
  en ese archivo como instantáneas SQLite compactas, no como sidecars WAL vivos sin procesar.
- La búsqueda de transcripciones es útil, pero no es obligatoria para el primer recorte
  con prioridad de base de datos. Diseña el esquema para que FTS pueda agregarse más adelante.
- La ejecución de workers debe seguir siendo experimental detrás de la configuración mientras se estabiliza la frontera de
  base de datos.

## Hallazgos de lectura de código

La rama actual ya ha superado la etapa de prueba de concepto. La base de datos compartida
existe, Node `node:sqlite` está conectado mediante un pequeño helper de runtime, y los
almacenes anteriores ahora escriben en `state/openclaw.sqlite` o en la base de datos
`openclaw-agent.sqlite` propietaria.

El trabajo restante no consiste en elegir SQLite; consiste en mantener limpia la nueva frontera
y eliminar cualquier interfaz con forma de compatibilidad que todavía parezca el viejo
mundo de archivos:

- El `storePath` de sesión ya no es una identidad de runtime, forma de fixture de prueba ni
  campo de carga de estado. Las pruebas de runtime y de puente ya no contienen el
  nombre de contrato `storePath`; el código de doctor/migración es responsable de ese vocabulario heredado.
- Las escrituras de sesión ya no pasan por la antigua cola en proceso `store-writer.ts`.
  Las escrituras de parches SQLite usan detección de conflictos y reintentos acotados en su lugar.
- El descubrimiento de rutas heredadas todavía tiene usos válidos de migración, pero el código de runtime debe
  dejar de tratar `sessions.json` y los archivos JSONL de transcripción como posibles destinos de escritura.
- Las tablas propiedad del agente viven en bases de datos SQLite por agente. La base de datos global mantiene
  filas de registro/plano de control; la identidad de transcripción es `{agentId, sessionId}` en
  las filas de transcripción por agente. El código de runtime no debe persistir rutas de archivos de
  transcripción ni migrar localizadores de transcripciones.
- Doctor ya importa varios archivos heredados. La limpieza consiste en convertir eso en una
  única implementación explícita de migración que doctor llame, con un informe de migración durable.

Ninguna pregunta adicional de producto bloquea la implementación.

## Forma actual del código

La rama ya tiene una base SQLite compartida real:

- El mínimo de runtime ahora es Node 22+: `package.json`, la guarda de runtime de la CLI,
  los valores predeterminados del instalador, el localizador de runtime de macOS, CI y la documentación
  pública de instalación coinciden. Se eliminó la antigua vía de compatibilidad con Node 22.
  Las cargas JSON de versión 1 existen solo como formas de importación/exportación de doctor.
- La caché de intercambio de token de GitHub Copilot usa la tabla compartida de estado de Plugin de SQLite
  bajo `github-copilot/token-cache/default`. Es estado de caché propiedad del proveedor,
  por lo que intencionalmente no añade una tabla de esquema del host.
- La Compaction de GitHub Copilot ya no escribe archivos auxiliares de espacio de trabajo `openclaw-compaction-*.json`.
  El arnés llama al RPC de Compaction del historial del SDK para la
  sesión del SDK rastreada, y OpenClaw mantiene el estado duradero de sesión/transcripción en
  SQLite en lugar de archivos marcadores de compatibilidad.
- El entorno de ejecución Swift compartido (`OpenClawKit`) usa las mismas
  filas de `state/openclaw.sqlite` para la identidad del dispositivo y la autenticación del dispositivo. Los ayudantes de la app de macOS
  importan los ayudantes SQLite compartidos en lugar de poseer una segunda ruta JSON o
  SQLite. Un `identity/device.json` heredado restante bloquea la creación de identidad
  hasta que doctor lo importe en SQLite, coincidiendo con la puerta de inicio de TypeScript y Android.
- La identidad del dispositivo de Android usa el mismo material de claves compatible con TypeScript
  almacenado en filas tipadas de `state/openclaw.sqlite#table/device_identities`. Nunca
  lee ni escribe `openclaw/identity/device.json`; un archivo heredado restante bloquea
  el inicio hasta que doctor lo importe en SQLite.
- Los tokens de autenticación de dispositivo en caché de Android también usan filas tipadas de
  `state/openclaw.sqlite#table/device_auth_tokens` y comparten la misma
  semántica de token de versión 1 que TypeScript y Swift. El entorno de ejecución ya no lee las claves de compatibilidad
  `gateway.deviceToken*` de `SecurePrefs`; esas pertenecen solo a la lógica de migración/doctor.
- El historial de paquetes recientes de notificaciones de Android usa filas tipadas de
  `android_notification_recent_packages`. El entorno de ejecución ya no migra ni
  lee las antiguas claves CSV de SharedPreferences.
- La creación de identidad del dispositivo falla de forma cerrada cuando existe el `identity/device.json`
  heredado, cuando la fila de identidad de SQLite no es válida, o cuando el almacén de identidad
  de SQLite no se puede abrir. Doctor importa y elimina ese archivo primero, por lo que el
  inicio del entorno de ejecución no puede rotar silenciosamente la identidad de emparejamiento antes de la migración.
- La selección de identidad del dispositivo es una clave de fila SQLite, no un localizador de archivo JSON. Las pruebas
  y los ayudantes de Gateway pasan claves de identidad explícitas; solo la migración de doctor y la
  puerta de inicio con fallo cerrado conocen el nombre de archivo retirado `identity/device.json`.
- La compatibilidad de restablecimiento de sesión ahora vive en la migración de configuración de doctor:
  `session.idleMinutes` se mueve a `session.reset.idleMinutes`,
  `session.resetByType.dm` se mueve a `session.resetByType.direct`, y la
  política de restablecimiento del entorno de ejecución solo lee claves de restablecimiento canónicas.
- La compatibilidad de configuración heredada ahora vive bajo `src/commands/doctor/`. La validación normal de
  `readConfigFileSnapshot()` no importa detectores heredados de doctor
  ni anota problemas heredados; `runDoctorConfigPreflight()` añade esos problemas para la
  reparación/informe de doctor. El flujo de configuración de doctor importa
  `src/commands/doctor/legacy-config.ts`, y la reparación de id de perfil OAuth antiguo vive
  bajo
  `src/commands/doctor/legacy/oauth-profile-ids.ts`.
- Los comandos que no son doctor no ejecutan automáticamente la reparación de configuración heredada. Por ejemplo,
  `openclaw update --channel` ahora falla con configuración heredada no válida y pide al
  usuario que ejecute doctor, en lugar de importar silenciosamente código de migración de doctor.
- Web push, APNs, activación por voz, comprobaciones de actualización y salud de configuración ahora usan tablas SQLite compartidas tipadas
  para suscripciones, claves VAPID, registros de Node, filas de disparador,
  filas de enrutamiento, estado de notificación de actualización y entradas de salud de configuración en lugar de
  blobs JSON completos y opacos. Las escrituras de instantáneas de Web push y APNs ahora reconcilian
  suscripciones/registros por clave primaria en lugar de vaciar sus tablas;
  la salud de configuración hace lo mismo por ruta de configuración.
  Sus módulos de entorno de ejecución mantienen lectores/escritores de instantáneas SQLite separados de
  los ayudantes de importación JSON heredados exclusivos de doctor.
- La configuración de host de Node ahora usa una fila singleton tipada en la base de datos SQLite compartida;
  doctor importa el antiguo archivo `node.json` antes del uso normal del entorno de ejecución.
- El emparejamiento de dispositivo/Node, el emparejamiento de canales, las listas de permitidos de canales y el estado de arranque
  ahora usan filas SQLite tipadas en lugar de blobs JSON completos y opacos. Las aprobaciones de vinculación de Plugin
  y el estado de trabajos Cron siguen la misma división: los módulos del entorno de ejecución exponen
  operaciones respaldadas por SQLite y ayudantes de instantáneas neutrales, y el emparejamiento/arranque
  más las escrituras de instantáneas de aprobación de vinculación de Plugin reconcilian filas por clave primaria
  en lugar de truncar tablas, mientras doctor importa/elimina los antiguos archivos JSON mediante
  módulos `src/commands/doctor/legacy/*`.
- Los registros de Plugins instalados ahora viven en el índice SQLite de Plugins instalados.
  La lectura/escritura de configuración del entorno de ejecución ya no migra ni preserva datos de configuración autorada antiguos de
  `plugins.installs`; doctor importa esa forma de configuración heredada
  a SQLite antes del uso normal del entorno de ejecución.
- Las instantáneas de recuperación de credenciales de QQBot ahora viven en el estado de Plugin de SQLite bajo
  `qqbot/credential-backups`. El entorno de ejecución ya no escribe
  `qqbot/data/credential-backup*.json`; el contrato de doctor de QQBot importa y
  archiva esos archivos de copia de seguridad heredados desde el directorio de estado activo.
- La planificación de recarga de Gateway compara instantáneas del índice SQLite de Plugins instalados bajo
  un espacio de nombres de diff interno `installedPluginIndex.installRecords.*`. Las decisiones de recarga del entorno de ejecución
  ya no envuelven esas filas en objetos de configuración `plugins.installs` falsos.
- La actualización de credenciales de cuenta con nombre de Matrix ya no ocurre durante las lecturas del entorno de ejecución.
  Doctor posee el cambio de nombre del antiguo `credentials/matrix/credentials.json`
  de nivel superior cuando se puede resolver una cuenta Matrix única/predeterminada.
- Los módulos de entorno de ejecución de emparejamiento central y Cron ya no exportan constructores de rutas JSON heredadas.
  Los módulos heredados propiedad de doctor construyen rutas de origen `pending.json`, `paired.json`,
  `bootstrap.json` y `cron/jobs.json` solo para pruebas de importación y
  migración. La normalización heredada de forma de trabajos Cron y la importación de registro de ejecuciones de Cron
  viven bajo `src/commands/doctor/legacy/cron*.ts`.
- `src/commands/doctor/legacy/runtime-state.ts` importa archivos de estado JSON heredados,
  incluida la configuración de host de Node, a SQLite desde doctor. Los nuevos importadores de archivos heredados
  permanecen bajo `src/commands/doctor/legacy/`.
- `src/commands/doctor/state-migrations.ts` importa las transcripciones heredadas `sessions.json` y
  `*.jsonl` directamente a SQLite y elimina las fuentes exitosas. Ya
  no prepara transcripciones heredadas raíz mediante
  `agents/<agentId>/sessions/*.jsonl` ni crea un destino JSONL canónico antes de
  la importación.
- Las comprobaciones de doctor de integridad de estado ya no escanean directorios de sesión heredados ni
  ofrecen eliminación de JSONL huérfanos. Los archivos de transcripción heredados son entradas de migración
  únicamente, y el paso de migración posee la importación más la eliminación de origen.
- La importación del registro sandbox heredado vive bajo
  `src/commands/doctor/legacy/sandbox-registry.ts`; las lecturas y escrituras del registro sandbox activo siguen siendo solo SQLite.
- La reparación heredada de salud/importación de transcripciones de sesión vive bajo
  `src/commands/doctor/legacy/session-transcript-health.ts`; los módulos de comandos del entorno de ejecución
  ya no llevan análisis de transcripciones JSONL ni código de reparación de rama activa.

Aspectos destacados de consolidación/eliminación completados:

- El estado del Plugin ahora usa la base de datos compartida `state/openclaw.sqlite`. El antiguo importador sidecar local de rama `plugin-state/state.sqlite` se eliminó porque ese diseño de SQLite nunca se publicó. Los helpers de sondeo/prueba informan el `databasePath` compartido en lugar de exponer una ruta SQLite específica del estado del plugin.
- Las tablas de runtime de tareas y Task Flow ahora viven en la base de datos compartida `state/openclaw.sqlite` en lugar de `tasks/runs.sqlite` y `tasks/flows/registry.sqlite`; los antiguos importadores sidecar se eliminaron por la misma razón de diseño no publicado.
- `src/config/sessions/store.ts` ya no necesita `storePath` para metadatos entrantes, actualizaciones de ruta ni lecturas de actualizado-en. La persistencia de comandos, la limpieza de sesiones de la CLI, la profundidad de subagentes, las anulaciones de autenticación y la identidad de sesión de transcripción usan API de filas de agente/sesión. Las escrituras se aplican como parches de filas SQLite con reintento de conflicto optimista.
- La resolución de destino de sesión ahora expone destinos de base de datos por agente, no rutas heredadas de `sessions.json`. El Gateway compartido, los metadatos ACP, la reparación de rutas de doctor y `openclaw sessions` enumeran `agent_databases` más los agentes configurados.
- El enrutamiento de sesiones del Gateway ahora usa `resolveGatewaySessionDatabaseTarget`; el destino devuelto lleva `databasePath` y claves candidatas de fila SQLite en lugar de una ruta heredada de archivo de almacén de sesiones.
- Los tipos de runtime de sesión de canal ahora exponen `{agentId, sessionKey}` para lecturas de actualizado-en, metadatos entrantes y actualizaciones de última ruta. El antiguo tipo de compatibilidad `saveSessionStore(storePath, store)` desapareció.
- Las superficies de runtime de Plugin, API de extensión y barrel `config/sessions` ahora guían el código de plugin hacia helpers de filas de sesión respaldados por SQLite. Las exportaciones de compatibilidad de la biblioteca raíz (`loadSessionStore`, `saveSessionStore`, `resolveStorePath`) permanecen como shims obsoletos para consumidores existentes. El antiguo helper `resolveLegacySessionStorePath` desapareció; la construcción de rutas heredadas de `sessions.json` ahora es local a migraciones y fixtures de prueba.
- `src/config/sessions/session-entries.sqlite.ts` ahora almacena entradas canónicas de sesión en la base de datos por agente y tiene soporte de lectura/upsert/delete patch a nivel de fila. Runtime upsert/patch/delete ya no escanea variantes de mayúsculas/minúsculas ni poda claves de alias heredadas; doctor es dueño de la canonicalización. El helper independiente de importación JSON desapareció, y la migración fusiona upserts de filas más nuevas en lugar de reemplazar toda la tabla de sesiones. Los helpers públicos de lectura/listado/carga proyectan metadatos de sesiones calientes desde filas tipadas `sessions` y `conversations`; `entry_json` es una sombra de compatibilidad/depuración y puede estar obsoleta o ser inválida sin perder la identidad de sesión tipada ni el contexto de entrega.
- `src/config/sessions/delivery-info.ts` ahora resuelve el contexto de entrega desde las filas tipadas por agente `sessions` + `conversations` + `session_conversations`. Ya no reconstruye la identidad de entrega de runtime desde `session_entries.entry_json`; una fila tipada de conversación faltante es un problema de migración/reparación de doctor, no un fallback de runtime.
- Las decisiones de restablecimiento de sesión almacenada ahora prefieren los metadatos tipados `sessions.session_scope`, `sessions.chat_type` y `sessions.channel`. El análisis de `sessionKey` permanece solo para sufijos explícitos de hilo/tema en destinos de comando; la clasificación de grupo frente a directo ya no proviene de la forma de la clave.
- La clasificación de la visualización de lista/estado de sesiones ahora usa metadatos tipados de chat y el tipo de sesión del Gateway. Ya no trata subcadenas `:group:` o `:channel:` dentro de `session_key` como verdad durable de grupo/directo.
- La selección de política de respuesta silenciosa ahora usa solo tipo explícito de conversación o metadatos de superficie. Ya no infiere la política de directo/grupo a partir de subcadenas de `session_key`.
- La resolución del modelo de visualización de sesión ahora recibe el id de agente desde el destino de base de datos SQLite de sesión en lugar de separarlo desde `session_key`.
- La hidratación del destino de anuncio de agente a agente ahora usa solo `deliveryContext` tipado de `sessions.list`. Ya no recupera enrutamiento de canal/cuenta/hilo desde `origin` heredado, campos `last*` reflejados ni la forma de `session_key`.
- El rechazo de destino de hilo de `sessions_send` ahora lee metadatos tipados de enrutamiento SQLite. Ya no rechaza ni acepta destinos analizando sufijos de hilo desde la clave de destino.
- La validación de política de herramientas con alcance de grupo ahora lee enrutamiento tipado de conversación SQLite para la sesión actual o generada. Ya no confía en la identidad de grupo/canal decodificando `sessionKey`; los ids de grupo proporcionados por el llamador se descartan cuando ninguna fila tipada de sesión los avala.
- La coincidencia de anulación de modelo de canal ahora usa metadatos explícitos de grupo y conversación principal. Ya no decodifica ids de conversación principal desde `parentSessionKey`.
- La herencia de anulación de modelo almacenado ahora requiere una clave de sesión principal explícita desde el contexto tipado de sesión. Ya no deriva anulaciones principales desde sufijos `:thread:` o `:topic:` en `sessionKey`.
- El antiguo wrapper de información de hilo de sesión y el analizador de hilos de plugins cargados desaparecieron; ningún código de runtime importa `config/sessions/thread-info`.
- El helper de conversación de canal ya no expone puentes de análisis de claves completas de sesión. Core aún normaliza ids sin procesar de conversación propiedad del proveedor mediante `resolveSessionConversation(...)`, pero no reconstruye datos de ruta desde `sessionKey`.
- La entrega de finalización, la política de envío y el mantenimiento de tareas ya no derivan el tipo de chat desde la forma de `session_key`. El antiguo analizador de claves de tipo de chat se eliminó; estas rutas requieren metadatos tipados de sesión, contexto tipado de entrega o vocabulario explícito de destino de entrega.
- La lista/estado de sesiones, los diagnósticos, el enlace de cuenta de aprobación, el filtrado de Heartbeat de TUI y los resúmenes de uso ya no extraen de `SessionEntry.origin` enrutamiento de proveedor/cuenta/hilo/visualización. Las únicas lecturas restantes de runtime de `origin` son conceptos que no son de sesión u objetos de entrega del turno actual.
- La búsqueda de conversación nativa de solicitud de aprobación ahora lee filas tipadas de enrutamiento de sesión por agente. Ya no analiza la identidad de conversación de canal/grupo/hilo desde `sessionKey`; los metadatos tipados faltantes son un problema de migración/reparación.
- Las cargas de eventos de sesión cambiada/chat/sesión del Gateway ya no repiten `SessionEntry.origin` ni sombras de ruta `last*`; los clientes reciben `channel`, `chatType` y `deliveryContext` tipados.
- La resolución de entrega de Heartbeat ahora puede recibir directamente el `deliveryContext` tipado de SQLite, y el runtime de Heartbeat pasa la fila de entrega de sesión por agente en lugar de depender de sombras de compatibilidad `session_entries` para el enrutamiento actual.
- La resolución de destino de entrega de agente aislado de Cron también hidrata su ruta actual desde la fila tipada de entrega de sesión por agente antes de recurrir a la carga de entrada de compatibilidad.
- La resolución de origen de anuncio de subagente ahora pasa el contexto tipado de entrega de la sesión solicitante por `loadRequesterSessionEntry` y prefiere esa fila sobre sombras de compatibilidad `last*`/`deliveryContext`.
- Las actualizaciones de metadatos de sesión entrante ahora se fusionan primero contra la fila tipada de entrega por agente; los antiguos campos de entrega `SessionEntry` son solo el fallback cuando no existe una fila tipada de conversación.
- La extracción de entrega de reinicio/actualización ahora deja que el `threadId` tipado de entrega SQLite prevalezca sobre fragmentos de tema/hilo analizados desde `sessionKey`; el análisis es solo un fallback para claves heredadas con forma de hilo.
- Los ids de canal de contexto de agente de hook ahora prefieren la identidad tipada de conversación SQLite y luego los metadatos explícitos de mensaje. Ya no analizan fragmentos de proveedor/grupo/canal desde `sessionKey`.
- La herencia de ruta externa de `chat.send` del Gateway ahora lee metadatos tipados de enrutamiento de sesión SQLite en lugar de inferir alcance de canal/directo/grupo desde partes de `sessionKey`. Las sesiones con alcance de canal heredan solo cuando el canal tipado de sesión y el tipo de chat coinciden con el contexto de entrega almacenado; las sesiones principales compartidas mantienen su regla más estricta de CLI/sin metadatos de cliente.
- La reactivación del sentinela de reinicio y el enrutamiento de continuación ahora leen filas tipadas SQLite de entrega/enrutamiento antes de encolar reactivaciones de Heartbeat o continuaciones enrutadas de turnos de agente. Ya no reconstruye el contexto de entrega desde la sombra JSON de entrada de sesión.
- La resolución de contexto de `tools.effective` del Gateway ahora lee filas tipadas SQLite de entrega/enrutamiento para entradas de proveedor, cuenta, destino, hilo y modo de respuesta. Ya no recupera esos campos calientes de enrutamiento desde sombras de origen obsoletas de `session_entries.entry_json`.
- El enrutamiento de consulta de voz en tiempo real ahora resuelve la entrega principal/de llamada desde filas tipadas SQLite de sesión por agente. Ya no recurre a sombras de compatibilidad `SessionEntry.deliveryContext` al elegir la ruta de mensaje del agente integrado.
- El relé de Heartbeat de generación ACP y el enrutamiento de flujo principal ahora leen la entrega principal desde filas tipadas SQLite de sesión. Ya no reconstruyen el contexto de entrega principal desde sombras de compatibilidad de entradas de sesión.
- La preservación de ruta de entrega de sesión ahora sigue metadatos tipados de chat y columnas persistidas de entrega. Ya no extrae pistas de canal, marcadores de directo/principal ni forma de hilo desde `sessionKey`; las rutas internas de webchat solo heredan un destino externo cuando SQLite ya tiene identidad de entrega tipada/persistida para la sesión.
- La extracción genérica de entrega de sesión ahora lee solo la fila exacta tipada SQLite de entrega de sesión. Ya no analiza sufijos de hilo/tema ni hace fallback desde una clave con forma de hilo hacia una clave base de sesión.
- El despacho de respuesta, la recuperación del sentinela de reinicio y el enrutamiento de consulta de voz en tiempo real ahora usan filas exactas tipadas SQLite de sesión/conversación para el enrutamiento de hilos. Ya no recuperan ids de hilo ni contexto de entrega de sesión base analizando claves de sesión con forma de hilo.
- La limitación del historial de PI integrado ahora usa la proyección tipada de enrutamiento de sesión SQLite (`sessions` + `conversations` primaria) para proveedor, tipo de chat e identidad del par. Ya no analiza proveedor, DM, grupo ni forma de hilo desde `sessionKey`.
- La inferencia de entrega de herramientas de Cron ahora usa solo entrega explícita o el contexto tipado de entrega actual. Ya no decodifica destinos de canal, par, cuenta ni hilo desde `agentSessionKey`.
- Las filas de sesión de runtime ya no llevan el antiguo alias de ruta `lastProvider`. Los helpers y las pruebas usan campos tipados `lastChannel` y `deliveryContext`; la migración de doctor es el único lugar que debe traducir alias de ruta antiguos o sombras `origin` persistidas.
- Los eventos de transcripción, las filas VFS y las filas de artefactos de herramienta ahora escriben en la base de datos por agente. La tabla global no publicada de mapeo de archivos de transcripción desapareció; doctor registra rutas de origen heredadas en filas de migración durables en su lugar.
- La búsqueda de transcripción de runtime ya no escanea offsets de bytes JSONL ni sondea archivos de transcripción heredados. Las rutas de chat/medios/historial del Gateway leen filas de transcripción desde SQLite; JSONL de sesión ahora es solo una entrada heredada de doctor, no un estado de runtime ni un formato de exportación.
- Las relaciones de principal y rama de transcripción usan metadatos estructurados `parentTranscriptScope: {agentId, sessionId}` en encabezados de transcripción SQLite, no cadenas localizadoras tipo ruta `agent-db:...transcript_events...`.
- El contrato del gestor de transcripciones ya no expone constructores persistidos implícitos `create(cwd)` ni `continueRecent(cwd)`. Los gestores de transcripciones persistidas se abren con un alcance explícito `{agentId, sessionId}`; solo los gestores en memoria permanecen sin alcance para pruebas y transformaciones puras de transcripción.
- Las API de almacén de transcripciones de runtime resuelven alcance SQLite, no rutas del sistema de archivos. El antiguo helper `resolve...ForPath` y las opciones de escritura `transcriptPath` sin usar desaparecieron de los llamadores de runtime.
- La resolución de sesiones de runtime ahora usa `{agentId, sessionId}` y no debe derivar cadenas `sqlite-transcript://<agent>/<session>` para límites externos. Las rutas absolutas heredadas JSONL son solo entradas de migración de doctor.
- Los registros de puente directo de relé de hook nativo ahora viven en filas compartidas tipadas `native_hook_relay_bridges` con clave por id de relé. Runtime ya no escribe un registro JSON en `/tmp` ni registros genéricos opacos para esos registros de puente de corta duración.
- `runEmbeddedPiAgent(...)` ya no tiene un parámetro localizador de transcripción.
  Los descriptores de worker preparados también omiten localizadores de transcripción. El estado de sesión en runtime
  y las ejecuciones de seguimiento en cola llevan `{agentId, sessionId}` en lugar de
  identificadores de transcripción derivados.
- La Compaction integrada ahora toma el alcance de SQLite de `agentId` y `sessionId`.
  Los hooks de Compaction, las llamadas al motor de contexto, la delegación de CLI y las respuestas de protocolo
  no deben recibir identificadores derivados `sqlite-transcript://...`. El código de exportación/depuración
  puede materializar artefactos de usuario explícitos a partir de filas, pero no proporciona una
  ruta genérica de exportación JSONL de sesión ni vuelve a introducir nombres de archivo en la identidad
  de runtime.
- `/export-session` lee filas de transcripción desde SQLite y escribe solo la vista HTML
  independiente solicitada. El visor integrado ya no reconstruye ni
  descarga JSONL de sesión a partir de esas filas.
- La delegación del motor de contexto ya no analiza un localizador de transcripción para recuperar
  la identidad del agente. El contexto de runtime preparado lleva el `agentId` resuelto
  al adaptador integrado de Compaction.
- La reescritura de transcripciones y el truncado en vivo de resultados de herramientas ahora leen y persisten
  el estado de transcripción mediante `{agentId, sessionId}` y no derivan localizadores
  temporales para payloads de eventos de actualización de transcripción.
- La superficie del helper de estado de transcripción ya no tiene variantes basadas en localizador
  `readTranscriptState`, `replaceTranscriptStateEvents` ni
  `persistTranscriptStateMutation`. Los llamadores de runtime deben usar las API
  `{agentId, sessionId}`. La importación de Doctor lee archivos heredados mediante una ruta de archivo explícita
  y escribe filas de SQLite; no migra cadenas de localizador.
- El contrato del gestor de sesiones de runtime ya no expone `open(locator)`,
  `forkFrom(locator)` ni `setTranscriptLocator(...)`. Los gestores de sesiones
  persistidas se abren solo mediante `{agentId, sessionId}`; los helpers de listado/fork viven en
  API de sesión y checkpoint orientadas a filas, no en la fachada del gestor de transcripciones.
- Las API lectoras de transcripciones del Gateway priorizan el alcance. Toman
  `{agentId, sessionId}` y no aceptan un localizador de transcripción posicional que
  pudiera convertirse accidentalmente en identidad de runtime. El análisis de localizadores de transcripción
  activos desapareció; las rutas de origen heredadas solo las lee el código de importación de Doctor.
- Los eventos de actualización de transcripción también priorizan el alcance. `emitSessionTranscriptUpdate`
  ya no acepta una cadena de localizador sin más, y los escuchadores enrutan por
  `{agentId, sessionId}` sin analizar un identificador.
- La difusión de mensajes de sesión del Gateway resuelve claves de sesión desde el alcance de agente/sesión,
  no desde un localizador de transcripción. La caché/resolvedor antigua de clave de sesión desde localizador
  de transcripción desapareció.
- Los filtros SSE de historial de sesiones del Gateway filtran actualizaciones en vivo por alcance de agente/sesión. Ya no
  canonicaliza candidatos de localizador de transcripción, rutas reales ni identidades de transcripción
  con forma de archivo para decidir si un stream debe recibir una actualización.
- Los hooks de ciclo de vida de sesión ya no derivan ni exponen localizadores de transcripción en
  `session_end`. Los consumidores de hooks reciben `sessionId`, `sessionKey`, ids de siguiente sesión
  y contexto de agente; los archivos de transcripción no forman parte del contrato de ciclo de vida.
- Los hooks de restablecimiento tampoco derivan ni exponen localizadores de transcripción. El payload
  `before_reset` lleva mensajes recuperados de SQLite más el motivo del restablecimiento,
  mientras que la identidad de sesión permanece en el contexto del hook.
- El restablecimiento del harness de agente ya no acepta un localizador de transcripción. El envío del restablecimiento se
  delimita por `sessionId`/`sessionKey` más el motivo.
- Los tipos de sesión de extensión de agente ya no exponen `transcriptLocator`; las extensiones
  deben usar el contexto de sesión y las API de runtime en lugar de buscar una
  identidad de transcripción con forma de archivo.
- Los hooks de Compaction de Plugin ya no exponen localizadores de transcripción. El contexto del hook
  ya lleva la identidad de sesión, y las lecturas de transcripción deben pasar por API de SQLite
  conscientes del alcance en lugar de identificadores con forma de archivo.
- Los hooks `before_agent_finalize` ya no exponen `transcriptPath`, incluidos
  los payloads de relé de hooks nativos. Los hooks de finalización usan solo contexto de sesión.
- Las respuestas de restablecimiento del Gateway ya no sintetizan un localizador de transcripción en la
  entrada devuelta. El restablecimiento crea filas de transcripción en SQLite, devuelve la entrada de sesión
  limpia y deja el acceso a transcripciones a lectores conscientes del alcance.
- Los resultados de ejecución integrada y Compaction ya no exponen localizadores de transcripción para
  la contabilidad de sesión. La Compaction automática actualiza solo el `sessionId` activo,
  los contadores de Compaction y los metadatos de tokens.
- Los resultados de intentos integrados ya no devuelven `transcriptLocatorUsed`, y
  los resultados `compact()` del motor de contexto ya no devuelven localizadores de transcripción.
  Los bucles de reintento de runtime solo aceptan un `sessionId` sucesor.
- Los resultados de anexado de transcripción de espejo de entrega ya no devuelven localizadores de transcripción.
  Los llamadores reciben el `messageId` anexado; las señales de actualización de transcripción usan
  el alcance de SQLite.
- Los helpers de fork de sesión principal devuelven solo el `sessionId` bifurcado. La preparación de subagentes
  pasa el alcance de agente/sesión hijo a los motores.
- Los parámetros del runner de CLI y la resembrado de historial ya no aceptan localizadores de transcripción.
  Las lecturas de historial de CLI resuelven el alcance de la transcripción de SQLite desde `{agentId,
sessionId}` y el contexto de clave de sesión.
- Los fixtures de prueba de CLI y runner integrado ahora siembran y leen filas de transcripción de SQLite
  por id de sesión en lugar de fingir que las sesiones activas son archivos `*.jsonl` o
  pasar una cadena `sqlite-transcript://...` mediante parámetros de runtime.
- Los eventos de protección de resultados de herramienta de sesión se emiten desde un alcance de sesión conocido incluso cuando un
  gestor en memoria no tiene localizador derivado. Sus pruebas ya no simulan archivos de transcripción
  activos `/tmp/*.jsonl`.
- Los helpers BTW y de checkpoint de Compaction ahora leen y bifurcan filas de transcripción por
  alcance de SQLite. Los metadatos de checkpoint ahora almacenan solo ids de sesión e ids de hoja/entrada;
  los localizadores derivados ya no se escriben en payloads de checkpoint.
- La búsqueda de clave de transcripción del Gateway usa el alcance de transcripción de SQLite en los límites
  de protocolo y ya no obtiene rutas reales ni estadísticas de nombres de archivo de transcripción.
- La rotación automática de transcripción de Compaction escribe filas de transcripción sucesoras
  directamente mediante el almacén de transcripciones de SQLite. Las filas de sesión conservan solo la
  identidad de sesión sucesora, no una ruta JSONL durable ni un localizador persistido.
- La Compaction integrada del motor de contexto usa helpers de rotación de transcripción con nombre SQLite.
  Las pruebas de rotación ya no construyen rutas sucesoras JSONL ni
  modelan sesiones activas como archivos.
- La retención gestionada de imágenes salientes genera claves para su caché de mensajes de transcripción desde
  estadísticas de transcripción de SQLite en lugar de llamadas stat del sistema de archivos.
- Se eliminaron los bloqueos de sesión de runtime y la vía independiente de Doctor
  heredada `.jsonl.lock`.
- El barrel de runtime de Microsoft Teams y el SDK público de Plugin ya no reexportan
  el helper antiguo de bloqueo de archivos; las rutas de estado durable de Plugin están respaldadas por SQLite.
- Se eliminaron la poda de sesiones por antigüedad/cantidad y la limpieza explícita de sesiones.
  Doctor se encarga de la importación heredada; las sesiones obsoletas se restablecen o eliminan explícitamente.
- Las comprobaciones de integridad de Doctor ya no cuentan un archivo JSONL heredado como una transcripción activa
  válida para una fila de sesión de SQLite. La salud de transcripción activa es solo SQLite;
  los archivos JSONL heredados se informan como entradas de migración/limpieza de huérfanos.
- Doctor ya no trata `agents/<agent>/sessions/` como estado de runtime requerido.
  Solo escanea ese directorio cuando ya existe, como entrada de importación heredada
  o limpieza de huérfanos.
- `sessions.resolve` del Gateway, las rutas de parcheo/restablecimiento/compactación de sesión, la creación
  de subagentes, la cancelación rápida, los metadatos ACP, las sesiones aisladas por Heartbeat y el parcheo de TUI
  ya no migran ni podan claves de sesión heredadas como efecto secundario de
  trabajo normal de runtime.
- La resolución de sesión del comando CLI ahora devuelve el `agentId` propietario en lugar de un
  `storePath`, y ya no copia filas de sesión principal heredadas durante la resolución normal
  de `--to` o `--session-id`. La canonicalización de filas principales heredadas pertenece
  solo a Doctor.
- La resolución de profundidad de subagente en runtime ya no lee `sessions.json` ni almacenes de sesiones
  JSON5. Lee `session_entries` de SQLite por id de agente, y los metadatos heredados
  de profundidad/sesión solo pueden entrar por la ruta de importación de Doctor.
- Las anulaciones de sesión de perfil de autenticación persisten mediante upserts directos de filas
  `{agentId, sessionKey}` en lugar de cargar perezosamente un runtime de almacén de sesiones con forma de archivo.
- La compuerta detallada de respuesta automática y los helpers de actualización de sesión ahora leen/hacen upsert de filas de sesión de SQLite
  por identidad de sesión y ya no requieren una ruta de almacén heredado
  antes de tocar el estado persistido de filas.
- Los helpers de metadatos de sesión de ejecución de comandos ahora usan nombres y rutas de módulo orientados a entradas;
  se eliminó la antigua superficie del helper de comandos `session-store`.
- La siembra de cabecera de arranque y el endurecimiento manual de límites de Compaction ahora mutan
  filas de transcripción de SQLite directamente. Los llamadores de runtime pasan identidad de sesión, no
  rutas `.jsonl` escribibles.
- La repetición silenciosa de rotación de sesión copia turnos recientes de usuario/asistente por
  `{agentId, sessionId}` desde filas de transcripción de SQLite. Ya no acepta
  localizadores de transcripción de origen o destino.
- Las filas nuevas de sesión de runtime ya no almacenan localizadores de transcripción. Los llamadores usan
  `{agentId, sessionId}` directamente; los comandos de exportación/depuración pueden elegir nombres de archivo de salida
  cuando materializan filas.
- Iniciar una nueva sesión de transcripción persistida ahora siempre abre filas de SQLite por
  alcance. El gestor de sesiones ya no reutiliza una ruta o localizador de transcripción
  anterior de la era de archivos como identidad para la nueva sesión.
- Las sesiones de transcripción persistidas usan la API explícita
  `openTranscriptSessionManagerForSession({agentId, sessionId})`. Las antiguas
  fachadas estáticas `SessionManager.create/openForSession/list/forkFromSession` desaparecieron
  para que las pruebas y el código de runtime no puedan recrear accidentalmente el descubrimiento de sesiones
  de la era de archivos.
- El runtime de Plugin ya no expone `api.runtime.agent.session.resolveTranscriptLocatorPath`;
  el código de Plugin usa helpers de filas de SQLite y valores de alcance.
- La superficie pública del SDK `session-store-runtime` ahora solo exporta helpers de filas de sesión
  y filas de transcripción. Los helpers enfocados de esquema/ruta/transacción de SQLite
  viven en `sqlite-runtime`; los helpers sin procesar de abrir/cerrar/restablecer siguen siendo solo locales
  para pruebas de primera parte.
- Los clasificadores heredados de nombres de archivo `.jsonl` de trayectoria/checkpoint ahora viven en el
  módulo de archivos de sesión heredados de Doctor. La validación de sesiones del core ya no importa
  helpers de artefactos de archivo para decidir ids normales de sesión de SQLite.
- Las ejecuciones de subagente bloqueantes de Active Memory usan filas de transcripción de SQLite en lugar de
  crear archivos `session.jsonl` temporales o persistidos bajo estado de Plugin. La
  antigua opción `transcriptDir` se eliminó.
- La generación puntual de slugs y las ejecuciones del planificador Crestodian usan filas de transcripción de SQLite
  en lugar de crear archivos `session.jsonl` temporales.
- Las ejecuciones del helper `llm-task` y la extracción oculta de compromisos también usan filas de transcripción
  de SQLite, por lo que estas sesiones auxiliares solo de modelo ya no crean
  archivos temporales de transcripción JSON/JSONL.
- `TranscriptSessionManager` ahora es solo un alcance de transcripción de SQLite abierto.
  El código de runtime lo abre con `openTranscriptSessionManagerForSession({agentId,
sessionId})`; los flujos de creación, rama, continuación, listado y fork viven en sus
  helpers propietarios de filas de SQLite en lugar de en fachadas estáticas del gestor.
  El código de Doctor/importación/depuración maneja archivos fuente heredados explícitos fuera del
  gestor de sesiones de runtime.
- Se eliminaron los métodos obsoletos de fachada `SessionManager.newSession()` y
  `SessionManager.createBranchedSession()`. Las sesiones nuevas y los descendientes de transcripción
  se crean mediante su flujo de trabajo propietario de SQLite en lugar de mutar un gestor ya abierto
  en una sesión persistida diferente.
- Las decisiones de fork de transcripción principal y la creación de forks ya no aceptan
  `storePath` ni `sessionsDir`; usan el alcance de transcripción de SQLite `{agentId, sessionId}`
  en lugar de metadatos retenidos de ruta del sistema de archivos.
- Memory-host ya no exporta helpers no-op de clasificación de transcripciones de directorio de sesión;
  el filtrado de transcripciones ahora deriva de metadatos de filas de SQLite durante la construcción de entradas.
- Las pruebas de exportación de sesiones de Memory-host y QMD usan alcances de transcripción de SQLite. Las rutas antiguas
  `agents/<agentId>/sessions/*.jsonl` siguen cubiertas solo cuando una prueba
  demuestra intencionalmente compatibilidad de Doctor/importación/exportación.
- La inspección de sesión sin procesar de QA-lab ahora usa `sessions.list` a través del Gateway
  en lugar de leer `agents/qa/sessions/sessions.json`; los comentarios de MSteams
  se anexan directamente a transcripciones SQLite sin fabricar una ruta JSONL.
- Los turnos compartidos de canal entrante ahora llevan `{agentId, sessionKey}` en lugar de un
  `storePath` heredado. Las rutas de registro de LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal,
  iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo,
  Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon,
  Twitch y QQBot ahora leen metadatos updated-at y registran
  filas de sesión entrante mediante identidad SQLite.
- La persistencia del localizador de transcripciones se elimina de las filas de sesión activas.
  `resolveSessionTranscriptTarget` devuelve `agentId`, `sessionId` y metadatos
  de tema opcionales; doctor es el único código que importa nombres de archivos de transcripciones heredadas.
- Los encabezados de transcripción en tiempo de ejecución empiezan en la versión SQLite `1`. Las actualizaciones de formas JSONL V1/V2/V3
  antiguas viven solo en la importación de doctor y normalizan los encabezados importados a
  la versión actual de transcripción SQLite antes de almacenar las filas.
- La protección database-first ahora prohíbe `SessionManager.listAll` y
  `SessionManager.forkFromSession`; los flujos de listado de sesiones y fork/restauración
  deben permanecer en APIs SQLite por fila/con ámbito.
- La protección también prohíbe nombres heredados de helpers de análisis JSONL de transcripciones/reparación de rama activa
  fuera del código de doctor/importación, para que el tiempo de ejecución no pueda desarrollar una segunda ruta de migración
  de transcripciones heredadas.
- Las ejecuciones PI integradas rechazan manejadores de transcripción entrantes. Usan la identidad SQLite
  `{agentId, sessionId}` antes del lanzamiento del worker y de nuevo antes de que el
  intento toque el estado de transcripción. Una entrada obsoleta `/tmp/*.jsonl` no puede seleccionar un
  destino de escritura en tiempo de ejecución.
- Los registros de traza de caché, payload de Anthropic, stream sin procesar y cronología de diagnósticos
  ahora escriben en filas SQLite tipadas `diagnostic_events`. Los paquetes de estabilidad de Gateway
  ahora escriben en filas SQLite tipadas `diagnostic_stability_bundles`. Las antiguas
  rutas de override JSONL `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`,
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE` y
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` se eliminan, y
  la captura normal de estabilidad ya no escribe archivos `logs/stability/*.json`.
- La persistencia de Cron ahora reconcilia filas SQLite `cron_jobs` en lugar de
  eliminar/reinsertar toda la tabla de jobs en cada guardado. Las reescrituras de destino de Plugin
  actualizan directamente las filas de cron coincidentes y mantienen el estado de cron en tiempo de ejecución en
  la misma transacción de la base de datos de estado.
- Los llamadores de cron en tiempo de ejecución ahora usan una clave estable de almacén cron SQLite. Las rutas
  `cron.store` heredadas son solo entradas de importación de doctor; las rutas de gateway de producción,
  mantenimiento de tareas, estado, registro de ejecución y reescritura de destino de Telegram usan
  `resolveCronStoreKey` y ya no normalizan la ruta de la clave. El estado de Cron ahora
  informa `storeKey` en lugar del antiguo campo `storePath` con forma de archivo.
- La carga y programación de Cron en tiempo de ejecución ya no normaliza formas de job persistidas heredadas
  como `jobId`, `schedule.cron`, `atMs` numérico, booleanos de cadena o
  `sessionTarget` ausente. La importación heredada de doctor es propietaria de esas reparaciones antes de que las filas
  se inserten en SQLite.
- El spawn de ACP ya no resuelve ni persiste rutas de archivos JSONL de transcripción. La configuración de spawn
  y enlace de hilo persiste directamente la fila de sesión SQLite y mantiene el
  id de sesión como identidad de transcripción retenida.
- Las APIs de metadatos de sesión ACP ahora leen/listan/hacen upsert de filas SQLite por `agentId` y
  ya no exponen `storePath` como parte del contrato de entrada de sesión ACP.
- La contabilidad de uso de sesión y la agregación de uso de Gateway ahora resuelven transcripciones
  solo por `{agentId, sessionId}`. La caché de coste/uso y los resúmenes de sesiones descubiertas
  ya no sintetizan ni devuelven cadenas localizadoras de transcripciones.
- La anexión de chat de Gateway, la persistencia parcial de abortos, `/sessions.send` y
  las escrituras de transcripción de medios de webchat se anexan directamente mediante el ámbito de transcripción SQLite.
  El helper de inyección de transcripciones de Gateway ya no acepta un parámetro
  `transcriptLocator`.
- El descubrimiento de transcripciones SQLite ahora solo lista ámbitos y estadísticas de transcripción:
  `{agentId, sessionId, updatedAt, eventCount}`. El helper de compatibilidad muerto
  `listSqliteSessionTranscriptLocators` y el campo por fila
  `locator` desaparecieron.
- El tiempo de ejecución de reparación de transcripciones ahora expone solo
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})`. El antiguo
  helper de reparación basado en localizador se elimina; el código de doctor/debug lee rutas explícitas
  de archivos fuente y nunca migra cadenas localizadoras.
- El tiempo de ejecución del ledger de replay ACP ahora almacena filas de replay por sesión en la base de datos
  de estado SQLite compartida en lugar de `acp/event-ledger.json`; doctor importa y
  elimina el archivo heredado.
- Los helpers lectores de transcripciones de Gateway ahora viven en
  `src/gateway/session-transcript-readers.ts` en lugar del antiguo
  nombre de módulo `session-utils.fs`. La verificación de historial de reintentos de fallback se nombra por
  contenido de transcripción SQLite en lugar de la antigua superficie de helper de archivos.
- Los helpers de chat inyectado y Compaction de Gateway ahora pasan el ámbito de transcripción SQLite
  mediante APIs internas de helper en lugar de nombrar valores como rutas de transcripción o
  archivos fuente.
- La detección de continuación de bootstrap ahora comprueba filas de transcripción SQLite mediante
  `hasCompletedBootstrapTranscriptTurn`; ya no expone un nombre de helper con forma de archivo.
- Las pruebas de runner integrado ahora usan identidad de transcripción SQLite, y abrir un nuevo
  gestor de transcripciones siempre requiere un `sessionId` explícito.
- Los helpers de indexación de memoria ahora usan terminología de transcripción SQLite de extremo a extremo:
  el host exporta `listSessionTranscriptScopesForAgent` y
  `sessionTranscriptKeyForScope`, las colas de sincronización dirigida `sessionTranscripts`,
  los hits públicos de búsqueda de sesión exponen rutas opacas `transcript:<agent>:<session>`,
  y la clave interna de origen de DB es `session:<session>` bajo
  `source_kind='sessions'` en lugar de una ruta de archivo falsa.
- El helper genérico de deduplicación persistente del SDK de Plugin ya no expone opciones
  con forma de archivo. Los llamadores proporcionan claves de ámbito SQLite y las filas duraderas de deduplicación viven en
  el estado compartido de Plugin.
- Los tokens SSO de Microsoft Teams se movieron de archivos JSON bloqueados al estado SQLite de Plugin.
  Doctor importa `msteams-sso-tokens.json`, reconstruye claves canónicas de tokens SSO
  a partir de payloads y elimina el archivo fuente. Los tokens OAuth delegados permanecen
  en su límite existente de archivo de credenciales privado.
- El estado de caché de sincronización de Matrix se movió de `bot-storage.json` al estado SQLite de Plugin.
  Doctor importa payloads de sincronización heredados sin procesar o envueltos y elimina el
  archivo fuente. Los clientes activos de Matrix y QA Matrix pasan un directorio raíz
  de almacén de sincronización SQLite, no una ruta falsa `sync-store.json` o `bot-storage.json`.
- El estado heredado de migración criptográfica de Matrix se movió de
  `legacy-crypto-migration.json` al estado SQLite de Plugin. Doctor importa el
  archivo de estado antiguo; las instantáneas IndexedDB del SDK de Matrix se movieron de
  `crypto-idb-snapshot.json` a blobs SQLite de Plugin. Las claves de recuperación y
  credenciales de Matrix son filas de estado SQLite de Plugin; sus antiguos archivos JSON son solo
  entradas de migración de doctor.
- Los registros de actividad de Memory Wiki ahora usan el estado SQLite de Plugin en lugar de
  `.openclaw-wiki/log.jsonl`. El proveedor de migración de Memory Wiki importa registros JSONL
  antiguos; el markdown de wiki y el contenido de bóveda de usuario siguen respaldados por archivos como
  contenido del espacio de trabajo.
- Memory Wiki ya no crea `.openclaw-wiki/state.json` ni el directorio
  `.openclaw-wiki/locks` sin usar. El proveedor de migración elimina esos archivos de metadatos
  de Plugin retirados si una bóveda antigua aún los tiene.
- Las entradas de auditoría de Crestodian ahora usan estado SQLite de Plugin del núcleo en lugar de
  `audit/crestodian.jsonl`. Doctor importa el registro de auditoría JSONL heredado y
  lo elimina tras una importación correcta.
- Las entradas de auditoría de escritura/observación de configuración ahora usan estado SQLite de Plugin del núcleo
  en lugar de `logs/config-audit.jsonl`. Doctor importa el registro de auditoría JSONL heredado y
  lo elimina tras una importación correcta.
- El compañero de macOS ya no escribe sidecars locales de app `logs/config-audit.jsonl` ni
  `logs/config-health.json` al editar `openclaw.json`. El archivo de configuración
  sigue respaldado por archivo, las instantáneas de recuperación permanecen junto al archivo de configuración,
  y el estado duradero de auditoría/salud de configuración pertenece al almacén SQLite de Gateway.
- Las aprobaciones pendientes de rescate de Crestodian ahora usan estado SQLite de Plugin del núcleo en lugar de
  `crestodian/rescue-pending/*.json`. Doctor importa archivos heredados de aprobación pendiente
  y los elimina tras una importación correcta.
- El estado temporal de armado de Phone Control ahora usa estado SQLite de Plugin en lugar de
  `plugins/phone-control/armed.json`. Doctor importa el archivo heredado de estado armado
  al espacio de nombres `phone-control/arm-state` y elimina el archivo.
- Doctor ya no repara transcripciones JSONL in situ ni crea archivos JSONL de respaldo.
  Importa la rama activa en SQLite y elimina la fuente heredada.
- La búsqueda de transcripciones del hook de memoria de sesión usa lecturas SQLite solo con ámbito
  `{agentId, sessionId}`. Su helper ya no acepta ni deriva localizadores de transcripciones,
  lecturas de archivos heredados ni opciones de reescritura de archivos.
- Los enlaces de conversación del servidor de app de Codex ahora indexan el estado SQLite de Plugin por
  clave de sesión de OpenClaw o ámbito explícito `{agentId, sessionId}`. No deben
  preservar enlaces de fallback de rutas de transcripción.
- Las lecturas de historial reflejado del servidor de app de Codex usan solo el ámbito de transcripción SQLite;
  no deben recuperar identidad desde rutas de archivos de transcripción.
- Las rutas de restablecimiento de orden de roles y Compaction ya no desvinculan archivos de transcripción
  antiguos; el restablecimiento solo rota la fila de sesión SQLite y la identidad de transcripción.
- Las respuestas de restablecimiento y checkpoint de Gateway devuelven filas de sesión limpias más ids de sesión.
  Ya no sintetizan localizadores de transcripción SQLite para clientes.
- Dreaming de memory-core ya no poda filas de sesión sondeando archivos JSONL ausentes.
  La limpieza de subagentes pasa por la API de tiempo de ejecución de sesiones en lugar de
  comprobaciones de existencia del sistema de archivos. Sus pruebas de ingesta de transcripciones siembran filas SQLite
  directamente en lugar de crear fixtures `agents/<id>/sessions` o marcadores de posición de localizador.
- La indexación de transcripciones de memoria puede exponer `transcript:<agentId>:<sessionId>` como una
  ruta virtual de hit de búsqueda para helpers de cita/lectura. La fuente de índice duradera es
  relacional (`source_kind='sessions'`, `source_key='session:<sessionId>'`,
  `session_id=<sessionId>`), por lo que el valor no es un localizador de transcripción en tiempo de ejecución,
  no es una ruta del sistema de archivos y nunca debe volver a pasarse a APIs de tiempo de ejecución de sesión.
- El estado de memoria de doctor de Gateway lee los recuentos de recuperación a corto plazo y señal de fase
  desde filas de estado SQLite de Plugin en lugar de `memory/.dreams/*.json`; la salida de CLI y
  doctor ahora etiqueta ese almacenamiento como un almacén SQLite, no como una ruta.
- El tiempo de ejecución de memory-core, el estado de CLI, los métodos doctor de Gateway y las fachadas del SDK de Plugin
  ya no auditan ni archivan archivos heredados `.dreams/session-corpus`.
  Esos archivos son solo entradas de migración; doctor los importa a SQLite y
  elimina la fuente tras la verificación. Las filas activas de evidencia de ingesta de sesión
  ahora usan la ruta SQLite virtual `memory/session-ingestion/<day>.txt`; el tiempo de ejecución
  nunca escribe ni deriva estado desde `.dreams/session-corpus`.
- Los artefactos públicos de memory-core exponen eventos de host SQLite como el artefacto JSON virtual
  `memory/events/memory-host-events.json`; ya no reutilizan la
  ruta fuente heredada `.dreams/events.jsonl`.
- Los registros de contenedor/navegador de sandbox ahora usan la tabla SQLite compartida
  `sandbox_registry_entries` con columnas tipadas de sesión, imagen, marca de tiempo,
  backend/configuración y puerto de navegador. Doctor importa archivos de registro JSON heredados monolíticos y
  fragmentados y elimina las fuentes correctas. Las lecturas en tiempo de ejecución usan
  las columnas tipadas de fila como fuente de verdad; `entry_json` es solo una copia de replay/debug.
- Los compromisos ahora usan una tabla compartida tipada `commitments` en lugar de un
  blob JSON de almacén completo. Los guardados de instantáneas hacen upsert por id de compromiso y eliminan solo
  las filas ausentes en lugar de vaciar y reinsertar la tabla. El tiempo de ejecución carga
  compromisos desde columnas tipadas de ámbito, ventana de entrega, estado, intento y texto;
  `record_json` es solo una copia de replay/debug. Doctor importa el `commitments.json`
  heredado y lo elimina tras una importación correcta.
- Las definiciones de jobs de Cron, el estado de programación y el historial de ejecución ya no tienen escritores
  ni lectores JSON en tiempo de ejecución. El tiempo de ejecución usa filas `cron_jobs` con programación tipada,
  payload, delivery, failure-alert, session, status y columnas runtime-state, además de metadatos tipados de
  `cron_run_logs` para estado, resumen de diagnósticos, estado/error de entrega,
  sesión/ejecución, modelo y totales de tokens. `job_json` es solo una copia de reproducción/depuración; `state_json` conserva diagnósticos
  de runtime anidados que aún no tienen campos de consulta activos, mientras que el runtime
  rehidrata los campos de estado activos desde columnas tipadas. Doctor importa
  archivos heredados `jobs.json`, `jobs-state.json` y `runs/*.jsonl` y elimina
  las fuentes importadas. Las escrituras de vuelta de objetivos de Plugin actualizan las filas `cron_jobs`
  coincidentes en lugar de cargar y reemplazar todo el almacén de cron.
- El inicio del Gateway ignora los marcadores heredados `notify: true` en la proyección
  del runtime. Doctor los traduce a una entrega SQLite explícita cuando
  `cron.webhook` es válido, elimina los marcadores inertes cuando no está configurado y los conserva
  con una advertencia cuando el Webhook configurado no es válido.
- Las colas de entrega saliente y de sesión ahora almacenan el estado de la cola, el tipo de entrada,
  la clave de sesión, el canal, el objetivo, el id de cuenta, el recuento de reintentos, el último intento/error,
  el estado de recuperación y los marcadores de envío de plataforma como columnas tipadas en la tabla compartida
  `delivery_queue_entries`. La recuperación del runtime lee esos campos activos desde
  las columnas tipadas, y las mutaciones de reintento/recuperación actualizan esas columnas directamente
  sin reescribir el JSON de reproducción. La carga útil JSON completa permanece solo como el
  blob de reproducción/depuración para cuerpos de mensajes y otros datos de reproducción fríos.
- Los registros administrados de imágenes salientes ahora usan filas compartidas tipadas
  `managed_outgoing_image_records`, con los bytes multimedia aún almacenados en
  `media_blobs`. El registro JSON permanece solo como una copia de reproducción/depuración.
- Las preferencias del selector de modelos de Discord, los hashes de despliegue de comandos y las vinculaciones de hilos
  ahora usan estado de Plugin SQLite compartido. Sus planes de importación JSON heredados viven en la
  superficie de configuración/doctor del Plugin de Discord, no en el código de migración del núcleo.
- Los detectores de importación heredada de Plugin usan módulos con nombre de doctor como
  `doctor-legacy-state.ts` o `doctor-state-imports.ts`; los módulos normales de runtime
  de canales no deben importar detectores de JSON heredado.
- Los cursores de catchup de BlueBubbles y los marcadores de deduplicación entrante ahora usan estado de Plugin SQLite
  compartido. Sus planes de importación JSON heredados viven en la superficie de
  configuración/doctor del Plugin de BlueBubbles, no en el código de migración del núcleo.
- Los offsets de actualización de Telegram, las filas de caché de stickers, las filas de caché de mensajes enviados,
  las filas de caché de nombres de temas y las vinculaciones de hilos ahora usan estado de Plugin SQLite
  compartido. Sus planes de importación JSON heredados viven en la superficie de
  configuración/doctor del Plugin de Telegram, no en el código de migración del núcleo.
- Los cursores de catchup de iMessage, las asignaciones de short-id de respuesta y las filas de deduplicación de ecos enviados
  ahora usan estado de Plugin SQLite compartido. Los archivos antiguos `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` y `imessage/sent-echoes.jsonl` son
  solo entradas de doctor.
- Las filas de deduplicación de mensajes de Feishu ahora usan estado de Plugin SQLite compartido en lugar de
  archivos `feishu/dedup/*.json`. Su plan de importación JSON heredado vive en la superficie de
  configuración/doctor del Plugin de Feishu, no en el código de migración del núcleo.
- Las conversaciones, encuestas, búferes de subida pendientes y aprendizajes de feedback de Microsoft Teams
  ahora usan tablas compartidas de estado/blob de Plugin SQLite. La ruta de subida pendiente
  usa `plugin_blob_entries`, de modo que los búferes multimedia se almacenan como BLOBs de SQLite
  en lugar de JSON base64. Los nombres de los helpers de runtime ahora usan nomenclatura de SQLite/estado
  en lugar de nomenclatura de almacén de archivos `*-fs`, y el antiguo shim `storePath` desaparece
  de estos almacenes. Su plan de importación JSON heredado vive en la superficie de
  configuración/doctor del Plugin de Microsoft Teams.
- Los medios salientes alojados de Zalo ahora usan `plugin_blob_entries` de SQLite compartido
  en lugar de sidecars temporales JSON/bin `openclaw-zalo-outbound-media`.
- El HTML y los metadatos del visor de diffs ahora usan `plugin_blob_entries` de SQLite compartido
  en lugar de archivos temporales `meta.json`/`viewer.html`. Las salidas PNG/PDF renderizadas siguen siendo
  materializaciones temporales porque la entrega de canales todavía necesita una ruta de archivo.
- Los documentos administrados de Canvas ahora usan `plugin_blob_entries` de SQLite compartido en lugar
  de un directorio predeterminado `state/canvas/documents`. El host de Canvas sirve esos
  blobs directamente; los archivos locales se crean solo para contenido de operador explícito `host.root`
  o materialización temporal cuando un lector multimedia descendente
  requiere una ruta.
- Las decisiones de auditoría de File Transfer ahora usan `plugin_state_entries` de SQLite compartido
  en lugar del log de runtime ilimitado `audit/file-transfer.jsonl`. Doctor
  importa el archivo de auditoría JSONL heredado en el estado de Plugin y elimina la fuente
  después de una importación limpia.
- Las concesiones de proceso ACPX y la identidad de instancia de Gateway ahora usan estado de Plugin SQLite compartido.
  Doctor importa el archivo heredado `gateway-instance-id` en el estado de Plugin
  y elimina la fuente.
- Los scripts de envoltorio generados por ACPX y el home aislado de Codex son materialización temporal
  bajo la raíz temporal de OpenClaw, no estado duradero de OpenClaw. Los
  registros duraderos del runtime ACPX son las filas SQLite de concesión e instancia de Gateway;
  la antigua superficie de configuración `stateDir` de ACPX se elimina porque ya no se escribe
  ningún estado de runtime allí.
- Los adjuntos multimedia del Gateway ahora usan la tabla SQLite compartida `media_blobs` como
  el almacén canónico de bytes. Las rutas locales devueltas a las superficies de compatibilidad
  de canal y sandbox son materializaciones temporales de la fila de base de datos, no el
  almacén multimedia duradero. Las allowlists multimedia del runtime ya no incluyen las raíces heredadas
  `$OPENCLAW_STATE_DIR/media` ni `media` del directorio de configuración; esos directorios son
  solo fuentes de importación de doctor.
- La finalización de shell ya no escribe archivos de caché `$OPENCLAW_STATE_DIR/completions/*`.
  Las rutas de instalación, doctor, actualización y smoke de release usan la salida de finalización
  generada o la carga desde el perfil en lugar de archivos duraderos de caché de finalización.
- La preparación de subida de Skills del Gateway ahora usa filas compartidas `skill_uploads`. Los metadatos
  de subida, las claves de idempotencia y los bytes de archivo viven en SQLite; el instalador
  solo recibe una ruta temporal de archivo materializado mientras se ejecuta una instalación.
- Los adjuntos inline de subagentes ya no se materializan bajo
  `.openclaw/attachments/*` del workspace. La ruta de spawn prepara entradas semilla de VFS SQLite,
  las ejecuciones inline siembran esas entradas en el namespace scratch de runtime por agente,
  y las herramientas respaldadas por disco superponen ese scratch SQLite para rutas de adjuntos. Las
  antiguas columnas de registro de attachment-dir de ejecuciones de subagente y los hooks de limpieza desaparecen.
- La hidratación de imágenes de CLI ya no mantiene archivos de caché estables `openclaw-cli-images`.
  Los backends externos de CLI todavía reciben rutas de archivo, pero esas rutas son
  materializaciones temporales por ejecución con limpieza.
- Los diagnósticos de cache-trace, los diagnósticos de cargas útiles de Anthropic, los diagnósticos de stream de modelo sin procesar,
  los eventos de timeline de diagnósticos y los bundles de estabilidad del Gateway ahora
  escriben filas SQLite en lugar de archivos `logs/*.jsonl` o
  `logs/stability/*.json`.
  Se han eliminado las flags y variables de entorno de sobrescritura de rutas de runtime; los comandos de exportación/depuración
  pueden materializar archivos explícitamente desde filas de base de datos.
- El companion de macOS ya no tiene un escritor rotativo `diagnostics.jsonl`. Los logs de la app
  van al logging unificado, y los diagnósticos duraderos del Gateway permanecen respaldados por SQLite.
- La lista de registros de port-guardian de macOS ahora usa filas tipadas compartidas de SQLite
  `macos_port_guardian_records` en lugar de un archivo JSON de Application Support
  o un blob singleton opaco.
- Los locks singleton del Gateway ahora usan filas tipadas compartidas de SQLite `state_leases` bajo
  el scope `gateway_locks` en lugar de archivos de lock en el directorio temporal. La documentación de solución
  de problemas de Fly y OAuth ahora apunta al lock de concesión/actualización de auth de SQLite en lugar
  de una limpieza obsoleta de file-lock.
- El estado sentinel de reinicio del Gateway ahora usa filas tipadas compartidas de SQLite
  `gateway_restart_sentinel` en lugar de `restart-sentinel.json`; el runtime
  lee el tipo de sentinel, estado, enrutamiento, mensaje, continuación y estadísticas desde
  columnas tipadas. `payload_json` es solo una copia de reproducción/depuración. El código de runtime limpia
  la fila SQLite directamente y ya no lleva plumbing de limpieza de archivos.
- El intento de reinicio del Gateway y el estado de handoff del supervisor ahora usan filas tipadas compartidas de SQLite
  `gateway_restart_intent` y `gateway_restart_handoff` en lugar de
  sidecars `gateway-restart-intent.json` y
  `gateway-supervisor-restart-handoff.json`.
- La coordinación singleton del Gateway ahora usa filas tipadas `state_leases` bajo
  `gateway_locks` en lugar de escribir archivos `gateway.<hash>.lock`. La fila de concesión
  posee el propietario del lock, la expiración, el Heartbeat y la carga útil de depuración; SQLite posee el
  límite atómico de adquisición/liberación. La opción retirada de directorio de file-lock
  desaparece; las pruebas usan directamente la identidad de la fila SQLite.
- Se eliminó el antiguo helper no referenciado de informes de uso de cron que escaneaba archivos `cron/runs/*.jsonl`.
  Los informes de historial de ejecuciones de cron deben leer las filas SQLite tipadas
  `cron_run_logs`.
- La recuperación de reinicio de sesión principal ahora descubre agentes candidatos mediante el
  registro SQLite `agent_databases` en lugar de escanear directorios `agents/*/sessions`.
- La recuperación de corrupción de sesión de Gemini ahora elimina solo la fila de sesión SQLite;
  ya no necesita una puerta heredada `storePath` ni intenta desvincular una ruta JSONL
  de transcripción derivada.
- El manejo de sobrescritura de rutas ahora trata los valores de entorno literales `undefined`/`null`
  como no configurados, lo que evita bases de datos accidentales en `undefined/state/*.sqlite`
  en la raíz del repo durante pruebas o handoffs de shell.
- Las huellas de salud de configuración ahora usan filas tipadas compartidas de SQLite `config_health_entries`
  en lugar de `logs/config-health.json`, manteniendo el archivo de configuración normal como
  el único documento de configuración que no contiene credenciales. El companion de macOS mantiene solo
  estado de salud local al proceso y no recrea el antiguo sidecar JSON.
- El runtime de perfiles de auth ya no importa ni escribe archivos JSON de credenciales. El
  almacén canónico de credenciales es SQLite; `auth-profiles.json`, `auth.json` por agente
  y `credentials/oauth.json` compartido son entradas de migración de doctor
  que se eliminan después de la importación.
- Las pruebas de guardado/estado de perfiles de auth ahora verifican directamente tablas de auth SQLite tipadas
  y solo usan nombres de archivo heredados de perfiles de auth para entradas de migración de doctor.
- `openclaw secrets apply` depura solo el archivo de configuración, el archivo de entorno y el almacén SQLite
  de perfiles de auth. Ya no lleva lógica de compatibilidad que edita
  el `auth.json` por agente retirado; doctor se encarga de importar y eliminar ese archivo.
- Los planes de migración de secretos de Hermes y las aplicaciones importan perfiles de clave API directamente
  en el almacén SQLite de perfiles de auth. Ya no escribe ni verifica
  `auth-profiles.json` como objetivo intermedio.
- La documentación de auth orientada a usuarios ahora describe
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` en lugar de
  indicar a los usuarios que inspeccionen o copien `auth-profiles.json`; los nombres JSON heredados de OAuth/auth
  permanecen documentados solo como entradas de importación de doctor.
- Los helpers de rutas de estado del núcleo ya no exponen el archivo retirado `credentials/oauth.json`.
  El nombre de archivo heredado es local a la ruta de importación de auth de doctor.
- La documentación de instalación, seguridad, onboarding, auth de modelos y SecretRef ahora describe
  filas SQLite de perfiles de auth y backup/migración de todo el estado en lugar de
  archivos JSON de perfiles de auth por agente.
- El descubrimiento de modelos PI ahora pasa credenciales canónicas al almacenamiento de auth
  `pi-coding-agent` en memoria. Ya no crea, depura ni escribe
  `auth.json` por agente durante el descubrimiento.
- La configuración de trigger y enrutamiento de Voice Wake ahora usa tablas tipadas compartidas de SQLite
  en lugar de `settings/voicewake.json`, `settings/voicewake-routing.json` o
  filas genéricas opacas; doctor importa los archivos JSON heredados y los elimina después de una
  migración correcta.
- El estado de comprobación de actualización ahora usa una fila compartida tipada `update_check_state` en lugar de
  `update-check.json` o un blob genérico opaco; doctor importa
  el archivo JSON heredado y lo elimina después de una migración correcta.
- El estado de salud de configuración ahora usa filas tipadas compartidas `config_health_entries` en lugar
  de `logs/config-health.json` o un blob genérico opaco; doctor
  importa el archivo JSON heredado y lo elimina después de una migración correcta.
- Las aprobaciones de vinculaciones de conversaciones de Plugin ahora usan filas tipadas
  `plugin_binding_approvals` en lugar de estado SQLite compartido opaco o
  `plugin-binding-approvals.json`; el archivo heredado es una entrada de migración de doctor.
- Los enlaces genéricos de conversación actual ahora almacenan filas tipadas
  `current_conversation_bindings` en lugar de reescribir
  `bindings/current-conversations.json`; doctor importa el archivo JSON heredado y
  lo elimina después de una migración correcta.
- Los registros de sincronización de fuentes importadas de Memory Wiki ahora almacenan una fila de estado de Plugin de SQLite
  por clave de bóveda/fuente en lugar de reescribir `.openclaw-wiki/source-sync.json`;
  el proveedor de migración importa y elimina el registro JSON heredado.
- Los registros de ejecución de importación de ChatGPT de Memory Wiki ahora almacenan una fila de estado de Plugin de SQLite
  por identificador de bóveda/ejecución en lugar de escribir `.openclaw-wiki/import-runs/*.json`.
  Las instantáneas de reversión siguen siendo archivos de bóveda explícitos hasta que el archivado
  de instantáneas de ejecución de importación se mueva al almacenamiento de blobs.
- Los resúmenes compilados de Memory Wiki ahora almacenan filas de blobs de Plugin de SQLite en lugar de
  escribir `.openclaw-wiki/cache/agent-digest.json` y
  `.openclaw-wiki/cache/claims.jsonl`. El proveedor de migración importa archivos de caché
  antiguos y elimina el directorio de caché cuando queda vacío.
- El seguimiento de instalación de Skills de ClawHub ahora almacena una fila de estado de Plugin de SQLite por
  espacio de trabajo/skill en lugar de escribir o leer archivos auxiliares `.clawhub/lock.json` y
  `.clawhub/origin.json` en tiempo de ejecución. El código de tiempo de ejecución usa objetos de estado
  de instalación rastreada en lugar de abstracciones de lockfile/origen con forma de archivo. Doctor
  importa los archivos auxiliares heredados desde los espacios de trabajo de agentes configurados y los elimina
  después de una importación limpia.
- El índice de Plugins instalados ahora lee y escribe la fila singleton tipada compartida de SQLite
  `installed_plugin_index` en lugar de `plugins/installs.json`; el
  archivo JSON heredado solo es una entrada de migración de doctor y se elimina después de la importación.
- El helper de ruta heredado de `plugins/installs.json` ahora vive en el código heredado de doctor.
  Los módulos de índice de Plugins de tiempo de ejecución solo exponen opciones de persistencia respaldadas por SQLite,
  no una ruta de archivo JSON.
- El centinela de reinicio de Gateway, la intención de reinicio y el estado de traspaso del supervisor ahora usan
  filas tipadas compartidas de SQLite (`gateway_restart_sentinel`,
  `gateway_restart_intent` y `gateway_restart_handoff`) en lugar de blobs
  opacos genéricos. El código de reinicio en tiempo de ejecución no tiene contrato de centinela/intención/traspaso
  con forma de archivo.
- La caché de sincronización de Matrix, los metadatos de almacenamiento, los enlaces de hilos, los marcadores de deduplicación
  entrante, el estado de cooldown de verificación de inicio, las instantáneas criptográficas de IndexedDB del SDK,
  las credenciales y las claves de recuperación ahora usan tablas compartidas de estado/blob de Plugin de SQLite.
  Las estructuras de rutas de tiempo de ejecución ya no exponen una ruta de metadatos `storage-meta.json`;
  ese nombre de archivo solo es una entrada de migración heredada. Su plan de importación de JSON heredado
  vive en la superficie de configuración/migración de doctor del Plugin de Matrix.
- El inicio de Matrix ya no escanea, informa ni completa el estado heredado de archivos de Matrix.
  La detección de archivos de Matrix, la creación de instantáneas criptográficas heredadas, el estado de migración
  de restauración de claves de sala, la importación y la eliminación de fuentes pertenecen por completo a doctor.
- Se eliminaron los barrels de migración en tiempo de ejecución de Matrix. Los helpers de detección
  y mutación de estado/cripto heredados son importados directamente por doctor de Matrix en lugar de formar
  parte de la superficie de API de tiempo de ejecución.
- Los marcadores de reutilización de instantáneas de migración de Matrix ahora viven en el estado de Plugin de SQLite
  en lugar de `matrix/migration-snapshot.json`; doctor todavía puede reutilizar el mismo
  archivo verificado previo a la migración sin escribir un archivo auxiliar de estado.
- Los cursores del bus de Nostr y el estado de publicación de perfiles ahora usan estado de Plugin compartido de SQLite.
  Su plan de importación de JSON heredado vive en la superficie de configuración/migración de doctor del Plugin de Nostr.
- Los toggles de sesión de Active Memory ahora usan estado de Plugin compartido de SQLite en lugar de
  `session-toggles.json`; volver a activar la memoria elimina la fila en lugar de
  reescribir un objeto JSON.
- Las propuestas y los contadores de revisión de Skill Workshop ahora usan estado de Plugin compartido de SQLite
  en lugar de almacenes por espacio de trabajo `skill-workshop/<workspace>.json`. Cada
  propuesta es una fila separada bajo `skill-workshop/proposals`, y el contador de revisión
  es una fila separada bajo `skill-workshop/reviews`.
- Las ejecuciones de subagentes revisores de Skill Workshop ahora usan el resolvedor de transcripciones de sesión
  de tiempo de ejecución en lugar de crear rutas de sesión auxiliares `skill-workshop/<sessionId>.json`.
- Los arrendamientos de procesos de ACPX ahora usan estado de Plugin compartido de SQLite bajo
  `acpx/process-leases` en lugar de un registro de archivo completo `process-leases.json`.
  Cada arrendamiento se almacena como su propia fila, lo que preserva la recolección de procesos obsoletos
  al inicio sin una ruta de reescritura JSON en tiempo de ejecución.
- Los scripts wrapper de ACPX y el home aislado de Codex se generan en la
  raíz temporal de OpenClaw. Se recrean según sea necesario y no son entradas de respaldo
  ni de migración.
- La persistencia del registro de ejecuciones de subagentes usa filas compartidas tipadas `subagent_runs`. La
  ruta antigua `subagents/runs.json` ahora solo es una entrada de migración de doctor, y
  los nombres de helpers de tiempo de ejecución ya no describen la capa de estado como respaldada por disco.
  Las pruebas de tiempo de ejecución ya no crean fixtures `runs.json` inválidos o vacíos para probar
  el comportamiento del registro; siembran/leen filas de SQLite directamente.
- Backup prepara el directorio de estado antes de archivar, copia archivos que no son de base de datos,
  toma instantáneas de bases de datos `*.sqlite` con `VACUUM INTO`, omite archivos auxiliares WAL/SHM
  vivos, registra metadatos de instantáneas en el manifiesto del archivo y registra
  ejecuciones de backup completadas en SQLite con el manifiesto del archivo. `openclaw backup
create` valida el archivo escrito de forma predeterminada; `--no-verify` es la
  ruta rápida explícita.
- `openclaw backup restore` valida el archivo antes de extraer, reutiliza el
  manifiesto normalizado del verificador y restaura los activos verificados del manifiesto a sus
  rutas de origen registradas. Requiere `--yes` para escrituras y admite `--dry-run`
  para un plan de restauración.
- Se elimina el filtro antiguo de rutas volátiles de backup. Backup ya no necesita una
  lista de omisión de live-tar para archivos JSON/JSONL heredados de sesiones o cron porque las instantáneas de SQLite
  se preparan antes de crear el archivo.
- La configuración simple y la preparación del espacio de trabajo durante el onboarding ya no crean
  directorios `agents/<agentId>/sessions/`. Solo crean config/espacio de trabajo;
  las filas de sesión de SQLite y las filas de transcripción se crean bajo demanda en la
  base de datos por agente.
- La reparación de permisos de seguridad ahora apunta a las bases de datos SQLite globales y por agente,
  además de los archivos auxiliares WAL/SHM, en lugar de `sessions.json` y archivos JSONL de transcripción.
- Los nombres de tiempo de ejecución del registro de sandbox ahora describen directamente los tipos de registro de SQLite
  en lugar de arrastrar terminología de registro JSON heredada por el almacén activo.
- `openclaw reset --scope config+creds+sessions` elimina las bases de datos
  `openclaw-agent.sqlite` por agente más los archivos auxiliares WAL/SHM, no solo los directorios
  heredados `sessions/`.
- Los helpers de sesión agregada de Gateway ahora usan nombres orientados a entradas:
  `loadCombinedSessionEntriesForGateway` devuelve `{ databasePath, entries }`.
  La nomenclatura antigua de almacén combinado se eliminó de los llamadores de tiempo de ejecución.
- La inicialización del canal MCP de Docker ahora escribe la fila de sesión principal y los eventos de transcripción
  en la base de datos SQLite por agente en lugar de crear
  `sessions.json` y una transcripción JSONL.
- El hook incluido de memoria de sesión ahora resuelve el contexto de sesiones anteriores desde
  SQLite mediante `{agentId, sessionId}`. Ya no escanea, almacena ni sintetiza
  rutas de transcripción ni directorios `workspace/sessions`.
- El hook incluido de registro de comandos ahora escribe filas de auditoría de comandos en la tabla compartida
  de SQLite `command_log_entries` en lugar de anexar a
  `logs/commands.log`.
- Las allowlists de emparejamiento de canales ahora exponen solo helpers de lectura/escritura respaldados por SQLite en
  tiempo de ejecución y en el SDK de Plugin. El resolvedor de ruta antiguo `*-allowFrom.json` y
  el lector de archivos viven solo bajo el código de importación heredada de doctor.
- `migration_runs` registra ejecuciones de migración de estado heredado con estado,
  marcas de tiempo e informes JSON.
- `migration_sources` registra cada fuente de archivo heredado importada con hash, tamaño,
  conteo de registros, tabla de destino, identificador de ejecución, estado y estado de eliminación de fuente.
- `backup_runs` registra rutas de archivos de backup, estado y manifiestos JSON.
- El esquema global no mantiene una tabla de registro `agents` sin usar. El descubrimiento
  de bases de datos de agentes es el registro canónico `agent_databases` hasta que el tiempo de ejecución
  tenga un propietario real de registros de agente.
- La config generada del catálogo de modelos se almacena en filas tipadas globales de SQLite
  `agent_model_catalogs` indexadas por directorio de agente. Los llamadores de tiempo de ejecución usan
  `ensureOpenClawModelCatalog`; no hay API de compatibilidad `models.json` en
  el código de tiempo de ejecución. La implementación escribe en SQLite y el registro integrado de PI se
  hidrata desde esa carga almacenada sin crear un archivo `models.json`.
- Se eliminaron la exportación Markdown de transcripciones de sesión de QMD y la config `memory.qmd.sessions`.
  No hay colección de transcripciones de QMD, ni ruta de tiempo de ejecución `qmd/sessions*`,
  ni puente de memoria de sesión respaldado por archivos.
- El tiempo de ejecución de memory-core importa helpers de indexación de transcripciones de SQLite desde
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts`, no desde la
  subruta del SDK de QMD. La subruta de QMD mantiene una reexportación de compatibilidad solo para
  llamadores externos hasta que una limpieza mayor del SDK pueda eliminarla.
- El `index.sqlite` propio de QMD ahora es una materialización temporal de tiempo de ejecución respaldada por la
  tabla principal de SQLite `plugin_blob_entries`. El tiempo de ejecución ya no crea un archivo auxiliar durable
  `~/.openclaw/agents/<agentId>/qmd`.
- El Plugin opcional `memory-lancedb` ya no crea
  `~/.openclaw/memory/lancedb` como un almacén implícito administrado por OpenClaw. Es un
  backend externo de LanceDB y permanece deshabilitado hasta que el operador configure una
  `dbPath` explícita.
- `check:database-first-legacy-stores` falla ante nuevo código fuente de tiempo de ejecución que empareja
  nombres de almacenes heredados con API de sistema de archivos de estilo escritura. También falla ante código fuente de tiempo de ejecución
  que reintroduce los marcadores retirados del puente de transcripciones
  `transcriptLocator` o `sqlite-transcript://...`. La migración, doctor, importación
  y el código explícito de exportación que no es de sesión siguen permitidos. Nombres más amplios de contratos heredados
  como `sessionFile`, `storePath` y las fachadas antiguas de la era de archivos de `SessionManager`
  todavía tienen propietarios actuales y necesitan trabajo separado de guardas de migración
  antes de poder convertirse en una comprobación previa obligatoria. La guarda ahora también cubre
  almacenes de tiempo de ejecución `cache/*.json`, archivos auxiliares genéricos
  `thread-bindings.json`, JSON de estado/log de ejecuciones de cron, JSON de salud de config,
  archivos auxiliares de reinicio y bloqueo, configuraciones de Voice Wake, aprobaciones de enlaces de Plugins,
  JSON del índice de Plugins instalados, JSONL de auditoría de File Transfer, logs de actividad de Memory Wiki,
  el antiguo log de texto incluido de `command-logger` y controles de diagnóstico JSONL de flujo sin procesar de pi-mono.
  También prohíbe nombres antiguos de módulos heredados de doctor en el nivel raíz para que
  el código de compatibilidad permanezca bajo `src/commands/doctor/`. Los handlers de depuración de Android
  también usan logcat/salida en memoria en lugar de preparar archivos de caché `camera_debug.log` o
  `debug_logs.txt`.

## Forma del esquema objetivo

Mantén los esquemas explícitos. El estado de tiempo de ejecución propiedad del host usa tablas tipadas. El
estado opaco propiedad de Plugin usa `plugin_state_entries` / `plugin_blob_entries`; no hay una tabla
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

La búsqueda futura puede añadir tablas FTS sin cambiar las tablas de eventos canónicas:

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

Los valores grandes deben usar columnas `blob`, no codificación de cadenas JSON. Mantén
`value_json` para datos estructurados pequeños que deban seguir siendo inspeccionables con herramientas
SQLite sencillas.

`agent_databases` es el registro canónico para esta rama. No añadas una tabla
`agents` hasta que exista un propietario real de registros de agentes; la configuración del agente permanece en
`openclaw.json`.

## Forma de migración de Doctor

Doctor debe llamar a un único paso de migración explícito que sea notificable y seguro de
volver a ejecutar:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` invoca la implementación de migración de estado después de la
precomprobación ordinaria de configuración y crea una copia de seguridad verificada antes de importar. El inicio del tiempo de ejecución
y `openclaw migrate` no deben importar archivos de estado heredados de OpenClaw.

Propiedades de la migración:

- Una pasada de migración descubre todas las fuentes de archivos heredados y produce un plan
  antes de modificar nada.
- Doctor crea un archivo de copia de seguridad verificado previo a la migración antes de importar
  archivos heredados.
- Las importaciones son idempotentes y se identifican por ruta de origen, mtime, tamaño, hash y tabla
  de destino.
- Los archivos de origen correctos se eliminan o archivan después de que la base de datos de destino haya
  confirmado la transacción.
- Las importaciones fallidas dejan el origen intacto y registran una advertencia en
  `migration_runs`.
- El código de tiempo de ejecución lee solo SQLite después de que exista la migración.
- No se requiere ninguna ruta de degradación/exportación a archivos de tiempo de ejecución.

## Inventario de migración

Mueve estos elementos a la base de datos global:

- Las escrituras en tiempo de ejecución del registro de tareas ahora usan la base de datos compartida; se eliminó el importador auxiliar no publicado `tasks/runs.sqlite`. Los guardados de instantáneas hacen inserción o actualización por id de tarea y eliminan solo las filas de tarea/entrega faltantes.
- Las escrituras en tiempo de ejecución de Task Flow ahora usan la base de datos compartida; se eliminó el importador auxiliar no publicado `tasks/flows/registry.sqlite`. Los guardados de instantáneas hacen inserción o actualización por id de flujo y eliminan solo las filas de flujo faltantes.
- Las escrituras en tiempo de ejecución del estado de Plugin ahora usan la base de datos compartida; se eliminó el importador auxiliar no publicado `plugin-state/state.sqlite`.
- La búsqueda de memoria integrada ya no usa `memory/<agentId>.sqlite` de forma predeterminada; sus tablas de índice residen en la base de datos del agente propietario, y la opción auxiliar explícita `memorySearch.store.path` se retiró a la migración de configuración de doctor.
- La reindexación de memoria integrada restablece solo las tablas propiedad de memoria en la base de datos del agente. No debe reemplazar todo el archivo SQLite, porque la misma base de datos posee sesiones, transcripciones, filas de VFS, artefactos y cachés en tiempo de ejecución.
- Registros de contenedores/navegadores de sandbox desde JSON monolítico y fragmentado. Las escrituras en tiempo de ejecución ahora usan la base de datos compartida; la importación de JSON heredado permanece.
- Las definiciones de trabajos Cron, el estado de programación y el historial de ejecuciones ahora usan SQLite compartido; doctor importa/elimina los archivos heredados `jobs.json`, `jobs-state.json` y `cron/runs/*.jsonl`.
- Identidad/autenticación del dispositivo, push, comprobación de actualizaciones, compromisos, caché de modelos de OpenRouter, índice de plugins instalados y enlaces del servidor de la aplicación
- Los registros de emparejamiento y arranque de dispositivo/nodo ahora usan tablas SQLite tipadas
- Los suscriptores de notificaciones de emparejamiento de dispositivos y los marcadores de solicitudes entregadas ahora usan la tabla plugin-state de SQLite compartida en lugar de `device-pair-notify.json`.
- Los registros de llamadas de voz ahora usan la tabla plugin-state de SQLite compartida bajo el espacio de nombres `voice-call` / `calls` en lugar de `calls.jsonl`; la CLI del Plugin sigue y resume el historial de llamadas respaldado por SQLite.
- Las sesiones de Gateway de QQBot, los registros de usuarios conocidos y la caché de citas ref-index ahora usan estado de Plugin SQLite bajo espacios de nombres `qqbot` (`gateway-sessions`, `known-users`, `ref-index`) en lugar de `session-*.json`, `known-users.json` y `ref-index.jsonl`. Esos archivos heredados son cachés y no se migran.
- Las preferencias del selector de modelos de Discord, los hashes de despliegue de comandos y los enlaces de hilos ahora usan estado de Plugin SQLite bajo espacios de nombres `discord` (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`) en lugar de `model-picker-preferences.json`, `command-deploy-cache.json` y `thread-bindings.json`; la migración de doctor/setup de Discord importa y elimina los archivos heredados.
- Los cursores de puesta al día de BlueBubbles y los marcadores de deduplicación entrante ahora usan estado de Plugin SQLite bajo espacios de nombres `bluebubbles` (`catchup-cursors`, `inbound-dedupe`) en lugar de `bluebubbles/catchup/*.json` y `bluebubbles/inbound-dedupe/*.json`; la migración de doctor/setup de BlueBubbles importa y elimina los archivos heredados.
- Los desplazamientos de actualización de Telegram, las entradas de caché de stickers, las entradas de caché de mensajes de cadena de respuestas, las entradas de caché de mensajes enviados, las entradas de caché de nombres de temas y los enlaces de hilos ahora usan estado de Plugin SQLite bajo espacios de nombres `telegram` (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`, `topic-names`, `thread-bindings`) en lugar de `update-offset-*.json`, `sticker-cache.json`, `*.telegram-messages.json`, `*.telegram-sent-messages.json`, `*.telegram-topic-names.json` y `thread-bindings-*.json`; la migración de doctor/setup de Telegram importa y elimina los archivos heredados.
- Los cursores de puesta al día de iMessage, las asignaciones de id corto de respuesta y las filas de deduplicación de eco enviado ahora usan estado de Plugin SQLite bajo espacios de nombres `imessage` (`catchup-cursors`, `reply-cache`, `sent-echoes`) en lugar de `imessage/catchup/*.json`, `imessage/reply-cache.jsonl` y `imessage/sent-echoes.jsonl`; la migración de doctor/setup de iMessage importa y elimina los archivos heredados.
- Las conversaciones, encuestas, tokens SSO y aprendizajes de comentarios de Microsoft Teams ahora usan espacios de nombres de estado de Plugin SQLite (`conversations`, `polls`, `sso-tokens`, `feedback-learnings`) en lugar de `msteams-conversations.json`, `msteams-polls.json`, `msteams-sso-tokens.json` y `*.learnings.json`; la migración de doctor/setup de Microsoft Teams importa y archiva los archivos heredados. Las cargas pendientes son una caché SQLite de corta duración y los archivos de caché JSON antiguos no se migran.
- La caché de sincronización de Matrix, los metadatos de almacenamiento, los enlaces de hilos, los marcadores de deduplicación entrante, el estado de enfriamiento de verificación de inicio, las credenciales, las claves de recuperación y las instantáneas criptográficas de SDK IndexedDB ahora usan espacios de nombres de estado/blob de Plugin SQLite bajo `matrix` (`sync-store`, `storage-meta`, `thread-bindings`, `inbound-dedupe`, `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`) en lugar de `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`, `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`, `recovery-key.json` y `crypto-idb-snapshot.json`; la migración de doctor/setup de Matrix importa y elimina esos archivos heredados de las raíces de almacenamiento de Matrix con alcance de cuenta.
- Los cursores del bus de Nostr y el estado de publicación de perfiles ahora usan estado de Plugin SQLite bajo espacios de nombres `nostr` (`bus-state`, `profile-state`) en lugar de `bus-state-*.json` y `profile-state-*.json`; la migración de doctor/setup de Nostr importa y elimina los archivos heredados.
- Los conmutadores de sesión de Active Memory ahora usan estado de Plugin SQLite bajo `active-memory/session-toggles` en lugar de `session-toggles.json`.
- Las colas de propuestas de Skill Workshop y los contadores de revisión ahora usan estado de Plugin SQLite bajo `skill-workshop/proposals` y `skill-workshop/reviews` en lugar de archivos `skill-workshop/<workspace>.json` por espacio de trabajo.
- Las colas de entrega saliente y entrega de sesión ahora comparten la tabla SQLite global `delivery_queue_entries` bajo nombres de cola separados (`outbound-delivery`, `session-delivery`) en lugar de archivos duraderos `delivery-queue/*.json`, `delivery-queue/failed/*.json` y `session-delivery-queue/*.json`. El paso legacy-state de doctor importa filas pendientes y fallidas, elimina marcadores obsoletos de entregadas y elimina los archivos JSON antiguos después de la importación. Los campos de enrutamiento en caliente y reintento son columnas tipadas; la carga útil JSON se conserva solo para reproducción/depuración.
- Los arrendamientos de procesos ACPX ahora usan estado de Plugin SQLite bajo `acpx/process-leases` en lugar de `process-leases.json`.
- Metadatos de ejecuciones de copia de seguridad y migración

Mover estos a bases de datos de agentes:

- Raíces de sesión de agente y cargas útiles de entradas de sesión con forma de compatibilidad. Hecho para escrituras en tiempo de ejecución: los metadatos de sesión activos se pueden consultar en `sessions`, mientras que la carga útil completa `SessionEntry` con forma heredada permanece en `session_entries`.
- Eventos de transcripción de agente. Hecho para escrituras en tiempo de ejecución.
- Puntos de control de Compaction e instantáneas de transcripción. Hecho para escrituras en tiempo de ejecución: las copias de transcripción de puntos de control son filas de transcripción SQLite y los metadatos de puntos de control se registran en `transcript_snapshots`. Los helpers de puntos de control de Gateway ahora nombran estos valores como instantáneas de transcripción en lugar de archivos de origen.
- Espacios de nombres scratch/workspace de VFS de agente. Hecho para escrituras VFS en tiempo de ejecución.
- Cargas útiles de adjuntos de subagentes. Hecho para escrituras en tiempo de ejecución: son entradas semilla VFS de SQLite y nunca archivos duraderos de workspace.
- Artefactos de herramientas. Hecho para escrituras en tiempo de ejecución.
- Artefactos de ejecución. Hecho para escrituras en tiempo de ejecución de worker mediante la tabla por agente `run_artifacts`.
- Cachés en tiempo de ejecución locales del agente. Hecho para escrituras de caché con alcance de tiempo de ejecución de worker mediante la tabla por agente `cache_entries`. Las cachés de modelos de alcance Gateway permanecen en la base de datos global a menos que pasen a ser específicas de agente.
- Registros de flujo principal de ACP. Hecho para escrituras en tiempo de ejecución.
- Sesiones del libro mayor de reproducción de ACP. Hecho para escrituras en tiempo de ejecución mediante `acp_replay_sessions` y `acp_replay_events`; el `acp/event-ledger.json` heredado permanece solo como entrada de doctor.
- Metadatos de sesión de ACP. Hecho para escrituras en tiempo de ejecución mediante `acp_sessions`; los bloques `entry.acp` heredados en `sessions.json` son solo entrada de migración de doctor.
- Archivos auxiliares de trayectorias cuando no son archivos de exportación explícitos. Hecho para escrituras en tiempo de ejecución: la captura de trayectoria escribe filas `trajectory_runtime_events` en la base de datos del agente y replica artefactos con alcance de ejecución en SQLite. Los archivos auxiliares heredados son solo entradas de importación de doctor; la exportación puede materializar salidas JSONL nuevas de paquetes de soporte, pero no lee ni migra archivos auxiliares antiguos de trayectoria/transcripción en tiempo de ejecución. La captura de trayectoria en tiempo de ejecución expone el alcance SQLite; los helpers de rutas JSONL están aislados para soporte de exportación/depuración y no se reexportan desde el módulo de tiempo de ejecución. Los metadatos de trayectoria del runner integrado registran la identidad `{agentId, sessionId, sessionKey}` en lugar de persistir un localizador de transcripción.

Mantener estos respaldados por archivos por ahora:

- `openclaw.json`
- archivos de credenciales de proveedor o CLI
- manifiestos de plugin/paquete
- workspaces de usuario y repositorios Git cuando se selecciona el modo de disco
- registros destinados a seguimiento por operadores, salvo que se mueva una superficie de registro específica

## Plan de migración

### Fase 0: Congelar el límite

Hacer explícito el límite de estado duradero antes de mover más filas:

- Agregar una tabla `migration_runs` a la base de datos global. Hecho para informes de ejecución de migración de estado heredado.
- Agregar un único servicio de migración de estado propiedad de doctor para importación de archivo a base de datos. Hecho: `openclaw doctor --fix` usa la implementación de migración legacy-state.
- Hacer que `plan` sea de solo lectura y que `apply` cree una copia de seguridad, importe, verifique y luego elimine o ponga en cuarentena los archivos antiguos. Hecho: doctor crea una copia de seguridad verificada previa a la migración, pasa la ruta de copia de seguridad a `migration_runs` y reutiliza las rutas de importador/eliminación.
- Agregar prohibiciones estáticas para que el nuevo código en tiempo de ejecución no pueda escribir archivos de estado heredados mientras el código de migración y las pruebas todavía puedan sembrarlos/leerlos. Hecho para los almacenes heredados migrados actualmente; el guard también analiza pruebas anidadas en busca de contratos prohibidos de localizador de transcripción en tiempo de ejecución.

### Fase 1: Terminar el plano de control global

Mantener el estado de coordinación compartido en `state/openclaw.sqlite`:

- Agentes y registro de bases de datos de agentes
- Libros mayores de tareas y Task Flow
- Estado de Plugin
- Registro de contenedores/navegadores de sandbox
- Historial de ejecuciones de Cron/programador
- Emparejamiento, dispositivo, push, comprobación de actualizaciones, TUI, OpenRouter/cachés de modelos y otro estado pequeño en tiempo de ejecución con alcance de Gateway
- Metadatos de copia de seguridad y migración
- Bytes de adjuntos multimedia de Gateway. Hecho para escrituras en tiempo de ejecución; las rutas de archivo directas son materializaciones temporales para compatibilidad con remitentes de canales y staging de sandbox. Las listas de permitidos en tiempo de ejecución aceptan rutas de materialización SQLite, no raíces multimedia heredadas de estado/configuración. Doctor importa archivos multimedia heredados en `media_blobs` y elimina los archivos de origen después de escrituras de filas correctas.
- Sesiones, eventos y blobs de carga útil de captura del proxy de depuración. Hecho: las capturas viven en la base de datos de estado compartida y se abren mediante el arranque, esquema, WAL y configuración de busy-timeout de la base de datos de estado compartida. Los bytes de carga útil se comprimen con gzip en `capture_blobs.data`; no hay anulación de base de datos auxiliar en tiempo de ejecución del proxy de depuración, directorio de blobs ni objetivo generado de esquema/codegen exclusivo de proxy-capture. La migración de doctor/inicio importa filas de `debug-proxy/capture.sqlite` publicado y blobs de carga útil referenciados, incluidas anulaciones activas de entorno de DB/blob heredadas, y luego archiva esas fuentes mientras deja intactos los certificados CA.

Esta fase también elimina aperturas duplicadas de archivos auxiliares, helpers de permisos, configuración de WAL, poda de sistema de archivos y escritores de compatibilidad de esos subsistemas.

### Fase 2: Introducir bases de datos por agente

Crear una base de datos por agente y registrarla desde la base de datos global:

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

La fila global `agent_databases` almacena la ruta, versión de esquema, marca de tiempo de última vista y metadatos básicos de tamaño/integridad. El código en tiempo de ejecución pide la base de datos del agente al registro en lugar de derivar rutas de archivos directamente.

La base de datos del agente posee:

- `sessions` como la raíz de sesión canónica, con `session_entries` como la tabla de carga útil con forma de compatibilidad adjunta a esa raíz, y
  `session_routes` como la búsqueda única de `session_key` activa
- `conversations` y `session_conversations` como la identidad de enrutamiento de proveedor normalizada
  adjunta a las sesiones
- `transcript_events`
- instantáneas de transcripción y puntos de control de Compaction. Hecho para escrituras de runtime.
- `vfs_entries`
- `tool_artifacts` y artefactos de ejecución
- filas locales del agente de runtime/caché. Hecho para cachés con ámbito de worker.
- eventos de flujo principal de ACP
- eventos de runtime de trayectoria cuando no son artefactos de exportación explícitos

### Fase 3: Reemplazar las API del almacén de sesiones

Hecho para runtime. La superficie del almacén de sesiones con forma de archivo no es un contrato de
runtime activo:

- El runtime ya no llama a `loadSessionStore(storePath)` ni trata `storePath` como
  identidad de sesión.
- Las operaciones de fila de runtime son `getSessionEntry`, `upsertSessionEntry`,
  `patchSessionEntry`, `deleteSessionEntry` y `listSessionEntries`.
- Los helpers de reescritura de almacén completo, escritores de archivos, pruebas de cola, poda de alias y
  parámetros de eliminación de claves heredadas ya no están en el runtime.
- Las exportaciones de compatibilidad obsoletas del paquete raíz aún adaptan rutas canónicas de
  `sessions.json` a las API de filas de SQLite.
- El análisis de `sessions.json` permanece solo en código de migración/importación de doctor y
  pruebas de doctor.
- La reserva del ciclo de vida del runtime lee encabezados de transcripción en SQLite, no las primeras
  líneas de JSONL.

Sigue eliminando cualquier cosa que reintroduzca parámetros de bloqueo de archivos,
vocabulario de poda/truncamiento como mantenimiento de archivos, identidad de ruta de almacén o pruebas
cuya única aserción sea la persistencia JSON.

### Fase 4: Mover transcripciones, flujos ACP, trayectorias y VFS

Haz que cada flujo de datos de agente sea nativo de base de datos:

- Las escrituras de anexado de transcripción pasan por una transacción SQLite que asegura el
  encabezado de sesión, verifica la idempotencia de mensajes, selecciona la cola principal, inserta
  en `transcript_events` y registra metadatos de identidad consultables en
  `transcript_event_identities`. Hecho para anexados directos de mensajes de transcripción y
  anexados normales persistidos de `TranscriptSessionManager`; las operaciones explícitas de rama
  conservan su elección explícita de padre y siguen escribiendo filas SQLite
  sin derivar ningún localizador de archivo.
- Los registros de flujo principal de ACP se convierten en filas, no en archivos `.acp-stream.jsonl`. Hecho.
- La configuración de generación de ACP ya no persiste rutas JSONL de transcripción. Hecho.
- La captura de trayectoria de runtime escribe filas/artefactos de eventos directamente. El comando explícito
  de soporte/exportación todavía puede producir artefactos JSONL de paquete de soporte como
  formato de exportación, pero la exportación de sesión no recrea JSONL de sesión. Hecho.
- Los espacios de trabajo en disco permanecen en disco cuando se configuran en modo disco.
- El scratch de VFS y el modo experimental de espacio de trabajo solo VFS usan la base de datos del agente.

La migración importa archivos JSONL antiguos una vez, registra conteos/hashes en
`migration_runs` y elimina los archivos importados después de las comprobaciones de integridad.

### Fase 5: Copia de seguridad, restauración, vacuum y verificación

Las copias de seguridad siguen siendo un solo archivo de archivo comprimido:

- Crear punto de control de cada base de datos global y de agente.
- Capturar cada DB con semántica de copia de seguridad de SQLite o `VACUUM INTO`.
- Archivar instantáneas compactas de DB, configuración, credenciales externas y exportaciones de
  espacio de trabajo solicitadas.
- Omitir archivos vivos sin procesar `*.sqlite-wal` y `*.sqlite-shm`.
- Verificar abriendo cada instantánea de DB y ejecutando `PRAGMA integrity_check`.
  `openclaw backup create` hace esta verificación de archivo comprimido de forma predeterminada;
  `--no-verify` omite solo la pasada posterior a la escritura del archivo comprimido, no la comprobación de integridad
  de creación de instantáneas.
- La restauración copia las instantáneas de vuelta a sus rutas de destino. Esta rama restablece el
  diseño SQLite no publicado a `user_version = 1`; los cambios futuros de esquema publicados
  pueden agregar migraciones explícitas cuando sean necesarias.

### Fase 6: Runtime de workers

Mantén el modo worker como experimental mientras aterriza la división de bases de datos:

- Los workers reciben id de agente, id de ejecución, modo de sistema de archivos e identidad del registro de DB.
- Cada worker abre su propia conexión SQLite.
- El padre conserva la autoridad de entrega de canales, aprobaciones, configuración y cancelación.
- Empieza con un worker por ejecución activa; agrega agrupación solo después de que el ciclo de vida y la propiedad de conexión de DB
  sean estables.

### Fase 7: Eliminar el mundo antiguo

Hecho para la gestión de sesiones de runtime. El mundo antiguo solo se permite como entrada explícita
de doctor o salida de soporte/exportación:

- Sin escrituras de runtime de `sessions.json`, JSONL de transcripción, JSON de registro de sandbox, SQLite
  sidecar de tareas ni SQLite sidecar de estado de Plugin.
- Sin poda de archivos JSON/sesión, truncamiento de transcripciones de archivo, bloqueos de archivos de sesión,
  ni pruebas de sesión con forma de bloqueo.
- Sin exportaciones de compatibilidad de runtime cuyo propósito sea mantener actualizados los archivos de sesión antiguos.
- Las exportaciones explícitas de soporte permanecen como formatos de archivo comprimido/materialización
  solicitados por el usuario y no deben devolver nombres de archivo a la identidad de runtime.

## Copia de seguridad y restauración

Las copias de seguridad deberían ser un solo archivo de archivo comprimido, pero la captura de base de datos debería ser
nativa de SQLite:

1. Detén la actividad de escritura de larga duración o entra en una breve barrera de copia de seguridad.
2. Para cada base de datos global y de agente, ejecuta un punto de control.
3. Captura cada base de datos usando semántica de copia de seguridad de SQLite o `VACUUM INTO` en un
   directorio temporal de copia de seguridad.
4. Archiva las instantáneas de base de datos compactadas, archivo de configuración, directorio de credenciales,
   espacios de trabajo seleccionados y un manifiesto.
5. Verifica el archivo comprimido abriendo cada instantánea SQLite incluida y ejecutando
   `PRAGMA integrity_check`.
   `openclaw backup create` hace esto de forma predeterminada; `--no-verify` es solo para
   omitir intencionalmente la pasada posterior a la escritura del archivo comprimido.

No dependas de copias vivas sin procesar de `*.sqlite`, `*.sqlite-wal` y `*.sqlite-shm` como
formato principal de copia de seguridad. El manifiesto del archivo comprimido debería registrar el rol de base de datos,
id de agente, versión de esquema, ruta de origen, ruta de instantánea, tamaño en bytes y estado de integridad.

La restauración debería reconstruir la base de datos global y los archivos de base de datos de agente desde las
instantáneas del archivo comprimido. Como el diseño SQLite aún no se ha publicado, esta refactorización
mantiene solo el esquema versión 1 más la importación de archivo a base de datos de doctor. El comando de restauración
valida primero el archivo comprimido y luego reemplaza cada recurso del manifiesto desde la carga útil extraída
verificada.

## Plan de refactorización de runtime

1. Agregar API de registro de base de datos.
   - Resolver rutas de DB global y DB por agente.
   - Mantener los esquemas no publicados en `user_version = 1`; no agregar código ejecutor de migraciones de esquema
     hasta que un esquema publicado lo necesite.
   - Agregar helpers de cierre/punto de control/integridad usados por pruebas, copia de seguridad y doctor.

2. Colapsar almacenes SQLite sidecar.
   - Mover tablas de estado de Plugin a la base de datos global. Hecho para escrituras de runtime;
     el importador sidecar heredado no publicado se eliminó.
   - Mover tablas de registro de tareas a la base de datos global. Hecho para escrituras de runtime;
     el importador sidecar heredado no publicado se eliminó.
   - Mover tablas de Task Flow a la base de datos global. Hecho para escrituras de runtime;
     el importador sidecar heredado no publicado se eliminó.
   - Mover tablas integradas de búsqueda de memoria a cada base de datos de agente. Hecho; el
     `memorySearch.store.path` personalizado explícito ahora se elimina mediante migración de configuración de doctor.
     La reindexación completa se ejecuta en su lugar solo contra tablas de memoria; la antigua ruta de intercambio de archivo completo
     y el helper de intercambio de índice sidecar se eliminaron.
   - Eliminar abridores de base de datos duplicados, configuración WAL, helpers de permisos y
     rutas de cierre de esos subsistemas.

3. Mover tablas propiedad del agente a bases de datos por agente.
   - Crear DB de agente bajo demanda mediante el registro de base de datos global. Hecho.
   - Mover entradas de sesión de runtime, eventos de transcripción, filas VFS y
     artefactos de herramienta a DB de agente. Hecho.
   - No migrar entradas de sesión de DB compartida locales de rama, eventos de transcripción,
     filas VFS ni artefactos de herramienta; ese diseño nunca se publicó. Mantener solo la importación heredada
     de archivo a base de datos en doctor.

4. Reemplazar las API del almacén de sesiones.
   - Eliminar `storePath` como identidad de runtime. Hecho para runtime y protegido
     por `check:database-first-legacy-stores`: metadatos de sesión, actualizaciones de ruta,
     persistencia de comandos, limpieza de sesiones CLI, vistas previas de razonamiento de Feishu,
     persistencia de estado de transcripción, profundidad de subagente, anulaciones de sesión de perfil de autenticación,
     lógica de bifurcación de padre e inspección de QA-lab ahora resuelven la
     base de datos desde claves canónicas de agente/sesión.
     Las respuestas de lista de sesiones de Gateway/TUI/UI/macOS ahora exponen `databasePath`
     en lugar del `path` heredado; las superficies de depuración de macOS muestran la base de datos por agente
     como estado de solo lectura en lugar de escribir configuración `session.store`.
     `/status`, la exportación de trayectoria impulsada por chat y los proxies de dependencia CLI ya no
     propagan rutas de almacén heredadas; la reserva de uso de transcripción lee
     SQLite por identidad de agente/sesión. Las pruebas de runtime y bridge ya no exponen
     `storePath`; las entradas de doctor/migración son dueñas de ese nombre de campo heredado.
     La carga combinada de sesiones de Gateway ya no tiene una rama especial de runtime para
     valores `session.store` no basados en plantilla; agrega filas SQLite por agente.
     El carril de doctor de bloqueo de sesión heredado y su helper de limpieza `.jsonl.lock`
     se eliminaron; SQLite es ahora el límite de concurrencia de sesión.
     Los puntos de llamada calientes de runtime usan nombres de helpers orientados a filas como
     `resolveSessionRowEntry`; el antiguo alias de compatibilidad `resolveSessionStoreEntry`
     se eliminó del runtime y de las exportaciones del SDK de Plugin.

- Usar operaciones de fila `{ agentId, sessionKey }`.
  Hecho: `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`,
  `patchSessionEntry` y `listSessionEntries` son API primero SQLite que no
  requieren una ruta de almacén de sesión. El resumen de estado, estado de agente local, salud
  y el comando de listado `openclaw sessions` ahora leen filas por agente directamente
  y muestran rutas de base de datos SQLite por agente en lugar de rutas `sessions.json`.
- Reemplazar eliminación/inserción de almacén completo con `upsertSessionEntry`,
  `deleteSessionEntry`, `listSessionEntries` y consultas SQL de limpieza.
  Hecho para runtime: las rutas calientes ahora usan API de filas y parches de fila con reintento por conflicto;
  los helpers restantes de importación/reemplazo de almacén completo se limitan al código de importación de migración
  y pruebas del backend SQLite.
  - Eliminar `store-writer.ts` y pruebas de cola de escritor. Hecho.
  - Eliminar la poda de claves heredadas de runtime y parámetros de eliminación de alias de los upserts/parches
    de filas de sesión. Hecho.

5. Eliminar comportamiento de registro JSON de runtime.
   - Hacer que las lecturas y escrituras del registro de sandbox sean solo SQLite. Hecho.
   - Importar JSON monolítico y fragmentado solo desde el paso de migración. Hecho.
   - Eliminar bloqueos de registro fragmentado y escrituras JSON. Hecho.

- Mantener una tabla de registro tipada en lugar de almacenar filas de registro como JSON genérico
  opaco si la forma sigue siendo estado operativo de ruta caliente. Hecho.

6. Eliminar mutación de sesión con forma de bloqueo de archivo.
   - Hecho para creación de bloqueos de runtime y API de bloqueo de runtime.
   - El carril independiente de limpieza de doctor para `.jsonl.lock` heredado se eliminó.
   - `session.writeLock` es configuración heredada migrada por doctor, no un ajuste tipado de runtime.
   - La integridad de estado ya no tiene una ruta separada de poda de archivos de transcripción huérfanos;
     la migración de doctor importa/elimina fuentes JSONL heredadas en un solo lugar.
   - La coordinación de singleton de Gateway usa filas SQLite tipadas `state_leases` bajo
     `gateway_locks` y ya no expone una superficie de directorio de bloqueo de archivos.
   - La persistencia genérica de deduplicación del SDK de Plugin ya no usa bloqueos de archivos ni archivos JSON;
     escribe filas SQLite compartidas de estado de Plugin. Hecho.
   - La coordinación de incrustación QMD usa un lease de estado SQLite en lugar de
     `qmd/embed.lock`. Hecho.

7. Hacer que los workers conozcan la base de datos.
   - Los workers abren sus propias conexiones SQLite.
   - El padre posee entrega, callbacks de canal y configuración.
   - El worker recibe id de agente, id de ejecución, modo de sistema de archivos e identidad del registro de DB,
     no handles vivos.
   - `vfs-only` sigue siendo experimental y usa la base de datos del agente como su raíz de almacenamiento.
   - Mantener primero un worker por ejecución activa. La agrupación puede esperar hasta que la vida útil de conexión de DB
     y el comportamiento de cancelación sean rutinarios.

8. Integración de copias de seguridad.
   - Enseñar a la copia de seguridad a capturar bases de datos globales y de agentes mediante copia de seguridad de SQLite o
     `VACUUM INTO`. Hecho para los archivos `*.sqlite` descubiertos bajo el recurso de estado.
   - Añadir verificación de copias de seguridad para la integridad de SQLite y la versión del esquema. Hecho para
     la creación de copias de seguridad y las comprobaciones de integridad de verificación del archivo predeterminado.
   - Registrar metadatos de ejecución de copias de seguridad en SQLite. Hecho mediante la tabla compartida `backup_runs`
     con ruta de archivo, estado y JSON de manifiesto.
   - Añadir restauración desde instantáneas de archivo verificadas. Hecho: `openclaw backup
restore` valida antes de la extracción, usa el manifiesto normalizado del verificador,
     admite `--dry-run` y requiere `--yes` antes de reemplazar
     las rutas de origen registradas.
   - Incluir exportación de VFS/espacio de trabajo solo cuando se solicite; no exportar elementos internos de sesión
     como JSON o JSONL.

9. Eliminar pruebas y código obsoletos. Hecho para las superficies conocidas de sesión en tiempo de ejecución.

- Eliminar pruebas que afirman la creación en tiempo de ejecución de archivos `sessions.json` o de transcripción
  JSONL. Hecho para el almacén central de sesiones, chat, eventos de transcripción de Gateway,
  vista previa, ciclo de vida, actualizaciones de entrada de sesión de comandos, restablecimiento/traza de respuesta automática y
  accesorios de Dreaming de memory-core, enrutamiento de destino de aprobación, reparación de transcripción de sesión,
  reparación de permisos de seguridad, exportación de trayectoria y exportación de sesión.
  Las pruebas de transcripción de Active Memory ahora afirman ámbitos de SQLite y que no se crean archivos JSONL
  temporales ni persistidos.
  La antigua regresión de poda de transcripción de Heartbeat se eliminó porque
  el tiempo de ejecución ya no trunca transcripciones JSONL.
  Las pruebas de la herramienta de lista de sesiones de agente ya no modelan rutas heredadas `sessions.json`
  como la forma de respuesta del Gateway; las pruebas de app/UI/macOS usan `databasePath`.
  Las pruebas de uso de transcripción de `/status` ahora siembran filas de transcripción de SQLite directamente
  en lugar de escribir archivos JSONL.
  Las pruebas de ciclo de vida de sesiones de Gateway ahora usan directamente asistentes de siembra de transcripciones
  de SQLite; la antigua forma de accesorio de archivo de sesión de una sola línea desapareció de la cobertura de restablecimiento
  y eliminación.
  `sessions.delete` ya no devuelve un campo de la era de archivos `archived: []`; la eliminación
  informa solo el resultado de mutación de filas. La antigua opción `deleteTranscript` también
  desapareció: eliminar una sesión elimina la raíz canónica `sessions` y permite que
  SQLite elimine en cascada las filas de transcripción, instantánea y trayectoria propiedad de la sesión, por lo que ningún
  llamador puede dejar transcripciones huérfanas ni olvidar una rama de limpieza.
  Las pruebas de captura de trayectoria de context-engine ahora leen filas `trajectory_runtime_events`
  desde una base de datos de agente aislada en lugar de leer
  `session.trajectory.jsonl`.
  Los scripts de siembra del canal Docker MCP ahora siembran filas de SQLite directamente. Las escrituras directas
  de `sessions.json` se limitan a accesorios de doctor.
  Tool Search Gateway E2E lee evidencia de llamadas de herramientas desde filas de transcripción de SQLite
  en lugar de escanear archivos `agents/<agentId>/sessions/*.jsonl`.
  Los eventos de host de memory-core y las filas temporales de corpus de sesión ahora viven en el estado de Plugin
  compartido de SQLite; `events.jsonl` y `session-corpus/*.txt` son solo entradas heredadas
  de migración de doctor. Las filas activas usan rutas virtuales `memory/session-ingestion/`,
  no `.dreams/session-corpus`. El antiguo módulo de reparación de Dreaming de memory-core
  y sus pruebas de CLI/Gateway se eliminaron porque el tiempo de ejecución ya no
  posee la reparación del archivo de archivos para ese corpus. Las pruebas de puente/artefacto público de memory-core
  ya no exponen `.dreams/events.jsonl`; usan el nombre de artefacto JSON virtual respaldado por SQLite.
  La documentación pública de pruebas de SDK/Codex ahora dice estado de sesión de SQLite en lugar de archivos de sesión,
  y el ejemplo de turno de canal ya no expone un argumento `storePath`.
  El estado de sincronización de Matrix ahora usa directamente el almacén de estado de Plugin de SQLite. Los contratos activos
  de cliente/tiempo de ejecución pasan una raíz de almacenamiento de cuenta, no una ruta `bot-storage.json`,
  y doctor importa el `bot-storage.json` heredado a SQLite antes de eliminar
  el origen. Los escenarios de QA de reinicio/destrucción de Matrix ahora mutan directamente la fila de sincronización de SQLite
  en lugar de crear o eliminar archivos `bot-storage.json` falsos, y
  el sustrato E2EE pasa una raíz de almacén de sincronización en lugar de una ruta falsa
  `sync-store.json`.
  La selección de raíz de almacenamiento de Matrix ya no puntúa raíces por archivos JSON heredados de sincronización/hilo;
  usa metadatos de raíz duraderos más estado criptográfico real.
  El conjunto de pruebas del backend de sesiones SQLite en tiempo de ejecución ya no fabrica un
  `sessions.json`; los accesorios de origen heredados ahora viven en las pruebas de doctor
  que los importan.
  Las pruebas de sesión de Gateway ya no exponen un asistente `createSessionStoreDir` ni
  configuración de ruta temporal de almacén de sesiones sin usar; los directorios de accesorios son explícitos, y la configuración directa
  de filas usa nombres de filas de sesión de SQLite.
  La cobertura del analizador de almacén de sesiones JSON5 solo para doctor salió de las pruebas de infraestructura y
  pasó a las pruebas de migración de doctor, por lo que los conjuntos de pruebas de tiempo de ejecución ya no poseen el análisis heredado
  de archivos de sesión.
  Las pruebas de SSO/carga pendiente en tiempo de ejecución de Microsoft Teams ya no llevan accesorios ni analizadores
  laterales JSON; el análisis heredado de token SSO vive solo en el módulo de migración
  del Plugin. Las pruebas de Telegram ya no siembran rutas falsas de almacén `/tmp/*.json`;
  restablecen directamente la caché de mensajes respaldada por SQLite. El asistente genérico
  de estado de prueba de OpenClaw ya no expone un escritor heredado `auth-profiles.json`;
  las pruebas de migración de autenticación de doctor poseen ese accesorio localmente.
  Las pruebas en tiempo de ejecución para punteros de última sesión de TUI, aprobaciones de ejecución, alternadores de Active Memory,
  verificación de deduplicación/arranque de Matrix, sincronización de fuente de Memory Wiki,
  enlaces de conversación actual, autenticación de incorporación e importaciones de secretos de Hermes ya
  no fabrican archivos laterales antiguos ni afirman que los nombres de archivo antiguos estén ausentes. Prueban
  el comportamiento mediante filas de SQLite y API públicas de almacén; las pruebas de doctor/migración
  son el único lugar al que pertenecen los nombres de archivo de origen heredados.
  Las pruebas en tiempo de ejecución para emparejamiento de dispositivo/nodo, allowFrom de canal, intenciones de reinicio,
  traspaso de reinicio, entradas de cola de entrega de sesiones, salud de configuración, cachés de iMessage,
  trabajos Cron, encabezados de transcripción de PI, registros de subagentes y adjuntos de imagen gestionados
  también ya no crean archivos JSON/JSONL retirados solo para probar
  que se ignoran o están ausentes.
  La recuperación de desbordamiento de PI ya no tiene una reserva de reescritura/truncamiento de SessionManager:
  el truncamiento de resultados de herramientas y las reescrituras de transcripción de context-engine mutan
  filas de transcripción de SQLite y luego actualizan el estado de prompt activo desde la base de datos.
  Las adiciones persistidas de mensajes de SessionManager delegan al asistente atómico de adición de transcripción de SQLite
  para la selección de padre y la idempotencia. Las adiciones normales de metadatos/entradas personalizadas
  también seleccionan el padre actual dentro de SQLite, por lo que
  las instancias obsoletas de gestor no resucitan carreras de cadena de padres previas a SQLite.
  La limpieza sintética de cola de PI para precomprobaciones de mitad de turno y `sessions_yield` ahora
  recorta directamente el estado de transcripción de SQLite; el antiguo puente de eliminación de cola de SessionManager
  y sus pruebas se eliminaron.
  La captura de puntos de control de Compaction también crea instantáneas solo desde SQLite; los llamadores ya
  no pasan un SessionManager vivo como fuente de transcripción alternativa.
- Mantener pruebas que siembran archivos heredados solo para migración.
- La prueba de archivos JSON se ha reemplazado por prueba de filas SQL para superficies activas de tiempo de ejecución.

- Añadir prohibiciones estáticas para escrituras en tiempo de ejecución a rutas JSON heredadas de sesión/caché.
  Hecho para la protección del repositorio.

10. Hacer que el informe de migración sea auditable.
    - Registrar ejecuciones de migración en SQLite con marcas de tiempo de inicio/finalización, rutas de origen, hashes de origen, conteos, advertencias y ruta de copia de seguridad.
      Hecho: las ejecuciones de migración de estado heredado ahora persisten un informe `migration_runs`
      con inventario de rutas/tablas de origen, SHA-256 de archivo de origen, tamaños,
      conteos de registros, advertencias y ruta de copia de seguridad.
      Hecho: las ejecuciones de migración de estado heredado también persisten filas `migration_sources`
      para auditoría a nivel de origen y futuras decisiones de omisión/rellenado.
    - Hacer que la aplicación sea idempotente. Volver a ejecutar después de una importación parcial debe
      omitir un origen ya importado o fusionar por clave estable.
      Hecho: índices de sesión, transcripciones, colas de entrega, estado de Plugin, libros mayores de tareas
      y filas globales de SQLite propiedad de agentes se importan mediante claves estables o
      semánticas de upsert/reemplazo, por lo que las repeticiones fusionan sin duplicar filas
      duraderas.
    - Las importaciones fallidas deben conservar el archivo de origen original en su lugar.
      Hecho: las importaciones fallidas de transcripción ahora dejan el origen JSONL original en
      su ruta detectada, y `migration_sources` registra el origen como
      `warning` con `removed_source=0` para la siguiente ejecución de doctor.

## Reglas de rendimiento

- Una conexión por hilo/proceso está bien; no compartir handles entre
  workers.
- Usar WAL, `foreign_keys=ON`, un tiempo de espera ocupado de 30 s y transacciones de escritura `BEGIN IMMEDIATE`
  cortas.
- Mantener síncronos los asistentes de transacciones de escritura a menos que/hasta que una API de transacciones asíncronas
  añada semánticas explícitas de mutex/backpressure.
- Mantener pequeñas y transaccionales las escrituras de entrega de padres.
- Evitar reescrituras de almacén completo; usar upsert/delete a nivel de fila.
- Añadir índices para rutas de listar por agente, listar por sesión, actualizado en, id de ejecución y
  expiración antes de mover código caliente.
- Almacenar artefactos grandes, medios y vectores como BLOBs o filas BLOB fragmentadas, no
  como JSON base64 o de arreglos numéricos.
- Mantener pequeñas y delimitadas las entradas opacas de estado de Plugin.
- Añadir limpieza SQL para TTL/expiración en lugar de poda del sistema de archivos.
  Hecho para almacenes de tiempo de ejecución propiedad de la base de datos: medios, estado de Plugin, blobs de Plugin,
  deduplicación persistente y caché de agente expiran todos mediante filas de SQLite. La limpieza restante
  del sistema de archivos se limita a materializaciones temporales o comandos explícitos
  de eliminación.

## Prohibiciones estáticas

Añadir una comprobación de repositorio que falle nuevas escrituras en tiempo de ejecución a rutas de estado heredadas:

- `sessions.json`
