---
read_when:
    - Ejecutar pruebas localmente o en CI
    - Agregar regresiones para errores de modelo/proveedor
    - Depurar el comportamiento de Gateway + agent
summary: 'Kit de pruebas: suites unitarias/e2e/live, ejecutores de Docker y qué cubre cada prueba'
title: Pruebas
x-i18n:
    generated_at: "2026-04-20T05:21:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88457038e2e2c7940d0348762d0ece187111a8c61fa9bad54b39eade4217ddbc
    source_path: help/testing.md
    workflow: 15
---

# Pruebas

OpenClaw tiene tres suites de Vitest (unitarias/integración, e2e, live) y un pequeño conjunto de ejecutores de Docker.

Este documento es una guía de “cómo probamos”:

- Qué cubre cada suite (y qué _deliberadamente_ no cubre)
- Qué comandos ejecutar para flujos de trabajo comunes (local, antes de hacer push, depuración)
- Cómo las pruebas live detectan credenciales y seleccionan modelos/proveedores
- Cómo agregar regresiones para problemas reales de modelos/proveedores

## Inicio rápido

La mayoría de los días:

- Puerta completa (esperada antes de hacer push): `pnpm build && pnpm check && pnpm test`
- Ejecución local más rápida de la suite completa en una máquina con buena capacidad: `pnpm test:max`
- Bucle directo de observación de Vitest: `pnpm test:watch`
- El direccionamiento directo de archivos ahora también enruta rutas de extensiones/canales: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefiere primero las ejecuciones dirigidas cuando estés iterando sobre un único fallo.
- Sitio de QA respaldado por Docker: `pnpm qa:lab:up`
- Carril de QA respaldado por VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Cuando tocas pruebas o quieres más confianza:

- Puerta de cobertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Al depurar proveedores/modelos reales (requiere credenciales reales):

- Suite live (sondas de modelos + herramientas/imágenes de Gateway): `pnpm test:live`
- Ejecutar un archivo live silenciosamente: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Consejo: cuando solo necesites un caso fallido, prefiere acotar las pruebas live mediante las variables de entorno de allowlist descritas abajo.

## Ejecutores específicos de QA

Estos comandos se usan junto a las suites de prueba principales cuando necesitas el realismo de qa-lab:

- `pnpm openclaw qa suite`
  - Ejecuta directamente en el host escenarios de QA respaldados por el repositorio.
  - Ejecuta varios escenarios seleccionados en paralelo de forma predeterminada con workers aislados de Gateway. `qa-channel` usa por defecto concurrencia 4 (limitada por la cantidad de escenarios seleccionados). Usa `--concurrency <count>` para ajustar la cantidad de workers, o `--concurrency 1` para el carril serial anterior.
  - Sale con un código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando quieras artefactos sin un código de salida fallido.
  - Admite los modos de proveedor `live-frontier`, `mock-openai` y `aimock`.
    `aimock` inicia un servidor local de proveedor respaldado por AIMock para cobertura experimental de fixtures y simulaciones de protocolo, sin reemplazar el carril `mock-openai` orientado a escenarios.
- `pnpm openclaw qa suite --runner multipass`
  - Ejecuta la misma suite de QA dentro de una VM Linux desechable de Multipass.
  - Mantiene el mismo comportamiento de selección de escenarios que `qa suite` en el host.
  - Reutiliza las mismas opciones de selección de proveedor/modelo que `qa suite`.
  - Las ejecuciones live reenvían las entradas de autenticación de QA compatibles que son prácticas para el invitado:
    claves de proveedor basadas en env, la ruta de configuración del proveedor live de QA y `CODEX_HOME` cuando está presente.
  - Los directorios de salida deben permanecer bajo la raíz del repositorio para que el invitado pueda escribir de vuelta a través del espacio de trabajo montado.
  - Escribe el informe y resumen normales de QA, además de los logs de Multipass, en `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia el sitio de QA respaldado por Docker para trabajo de QA de estilo operador.
- `pnpm openclaw qa aimock`
  - Inicia solo el servidor local de proveedor AIMock para pruebas directas de humo del protocolo.
- `pnpm openclaw qa matrix`
  - Ejecuta el carril live de QA de Matrix contra un homeserver Tuwunel desechable respaldado por Docker.
  - Este host de QA hoy es solo para repositorio/desarrollo. Las instalaciones empaquetadas de OpenClaw no incluyen `qa-lab`, por lo que no exponen `openclaw qa`.
  - Los checkouts del repositorio cargan directamente el ejecutor integrado; no se necesita un paso separado de instalación de Plugin.
  - Aprovisiona tres usuarios temporales de Matrix (`driver`, `sut`, `observer`) más una sala privada, y luego inicia un proceso hijo de Gateway de QA con el Plugin real de Matrix como transporte SUT.
  - Usa por defecto la imagen estable fijada de Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Sobrescribe con `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` cuando necesites probar una imagen distinta.
  - Matrix no expone opciones compartidas de fuentes de credenciales porque el carril aprovisiona usuarios desechables localmente.
  - Escribe un informe de QA de Matrix, resumen, artefacto de eventos observados y un log combinado de stdout/stderr en `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Ejecuta el carril live de QA de Telegram contra un grupo privado real usando los tokens de bot de driver y SUT desde env.
  - Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. El id del grupo debe ser el id numérico del chat de Telegram.
  - Admite `--credential-source convex` para credenciales compartidas agrupadas. Usa el modo env de forma predeterminada, o establece `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases agrupados.
  - Sale con un código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando quieras artefactos sin un código de salida fallido.
  - Requiere dos bots distintos en el mismo grupo privado, con el bot SUT exponiendo un nombre de usuario de Telegram.
  - Para una observación estable entre bots, habilita el modo de comunicación bot a bot en `@BotFather` para ambos bots y asegúrate de que el bot driver pueda observar el tráfico de bots del grupo.
  - Escribe un informe de QA de Telegram, resumen y artefacto de mensajes observados en `.artifacts/qa-e2e/...`.

Los carriles de transporte live comparten un contrato estándar para que los nuevos transportes no se desvíen:

`qa-channel` sigue siendo la suite amplia de QA sintética y no forma parte de la matriz de cobertura de transporte live.

| Carril   | Canary | Mención obligatoria | Bloqueo de allowlist | Respuesta de nivel superior | Reanudación tras reinicio | Seguimiento en hilo | Aislamiento de hilo | Observación de reacciones | Comando de ayuda |
| -------- | ------ | ------------------- | -------------------- | --------------------------- | ------------------------- | ------------------- | ------------------- | ------------------------- | ---------------- |
| Matrix   | x      | x                   | x                    | x                           | x                         | x                   | x                   | x                         |                  |
| Telegram | x      |                     |                      |                             |                           |                     |                     |                           | x                |

### Credenciales compartidas de Telegram mediante Convex (v1)

Cuando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
`openclaw qa telegram`, QA lab adquiere un lease exclusivo de un pool respaldado por Convex, envía Heartbeat de ese lease mientras el carril está en ejecución y libera el lease al finalizar.

Referencia del andamiaje del proyecto Convex:

- `qa/convex-credential-broker/`

Variables de entorno obligatorias:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por ejemplo `https://your-deployment.convex.site`)
- Un secreto para el rol seleccionado:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Selección del rol de credencial:
  - CLI: `--credential-role maintainer|ci`
  - Valor predeterminado en env: `OPENCLAW_QA_CREDENTIAL_ROLE` (usa `ci` por defecto en CI y `maintainer` en cualquier otro caso)

Variables de entorno opcionales:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predeterminado `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predeterminado `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predeterminado `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predeterminado `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predeterminado `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de rastreo opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs de Convex con `http://` en loopback para desarrollo únicamente local.

`OPENCLAW_QA_CONVEX_SITE_URL` debe usar `https://` en operación normal.

Los comandos administrativos de mantenedor (agregar/eliminar/listar del pool) requieren específicamente
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helpers de CLI para mantenedores:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `--json` para salida legible por máquina en scripts y utilidades de CI.

Contrato predeterminado del endpoint (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Solicitud: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Correcto: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Agotado/reintentable: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Solicitud: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Correcto: `{ status: "ok" }` (o `2xx` vacío)
- `POST /release`
  - Solicitud: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Correcto: `{ status: "ok" }` (o `2xx` vacío)
- `POST /admin/add` (solo secreto de maintainer)
  - Solicitud: `{ kind, actorId, payload, note?, status? }`
  - Correcto: `{ status: "ok", credential }`
- `POST /admin/remove` (solo secreto de maintainer)
  - Solicitud: `{ credentialId, actorId }`
  - Correcto: `{ status: "ok", changed, credential }`
  - Protección de lease activo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo secreto de maintainer)
  - Solicitud: `{ kind?, status?, includePayload?, limit? }`
  - Correcto: `{ status: "ok", credentials, count }`

Forma de payload para el tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` debe ser una cadena con el id numérico del chat de Telegram.
- `admin/add` valida esta forma para `kind: "telegram"` y rechaza payloads mal formados.

### Agregar un canal a QA

Agregar un canal al sistema de QA en Markdown requiere exactamente dos cosas:

1. Un adaptador de transporte para el canal.
2. Un paquete de escenarios que ejercite el contrato del canal.

No agregues una nueva raíz de comandos de QA de nivel superior cuando el host compartido `qa-lab` pueda encargarse del flujo.

`qa-lab` es responsable de la mecánica compartida del host:

- la raíz de comandos `openclaw qa`
- el arranque y desmontaje de la suite
- la concurrencia de workers
- la escritura de artefactos
- la generación de informes
- la ejecución de escenarios
- los alias de compatibilidad para escenarios antiguos de `qa-channel`

Los Plugins de ejecutores son responsables del contrato de transporte:

- cómo se monta `openclaw qa <runner>` bajo la raíz compartida `qa`
- cómo se configura Gateway para ese transporte
- cómo se comprueba la preparación
- cómo se inyectan eventos entrantes
- cómo se observan los mensajes salientes
- cómo se exponen las transcripciones y el estado de transporte normalizado
- cómo se ejecutan las acciones respaldadas por transporte
- cómo se maneja el restablecimiento o limpieza específicos del transporte

El umbral mínimo de adopción para un nuevo canal es:

1. Mantener `qa-lab` como propietario de la raíz compartida `qa`.
2. Implementar el ejecutor de transporte sobre la interfaz compartida del host `qa-lab`.
3. Mantener la mecánica específica del transporte dentro del Plugin del ejecutor o del arnés del canal.
4. Montar el ejecutor como `openclaw qa <runner>` en lugar de registrar una raíz de comandos competidora.
   Los Plugins de ejecutores deben declarar `qaRunners` en `openclaw.plugin.json` y exportar una matriz coincidente `qaRunnerCliRegistrations` desde `runtime-api.ts`.
   Mantén `runtime-api.ts` ligero; la ejecución diferida de CLI y del ejecutor debe permanecer detrás de puntos de entrada separados.
5. Crear o adaptar escenarios Markdown bajo los directorios temáticos `qa/scenarios/`.
6. Usar los helpers genéricos de escenarios para los nuevos escenarios.
7. Mantener en funcionamiento los alias de compatibilidad existentes salvo que el repositorio esté realizando una migración intencional.

La regla de decisión es estricta:

- Si el comportamiento puede expresarse una sola vez en `qa-lab`, colócalo en `qa-lab`.
- Si el comportamiento depende de un único transporte de canal, mantenlo en ese Plugin de ejecutor o arnés del Plugin.
- Si un escenario necesita una nueva capacidad que pueda usar más de un canal, agrega un helper genérico en lugar de una rama específica de canal en `suite.ts`.
- Si un comportamiento solo tiene sentido para un transporte, mantén el escenario específico del transporte y hazlo explícito en el contrato del escenario.

Los nombres preferidos de helpers genéricos para nuevos escenarios son:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Los alias de compatibilidad siguen disponibles para escenarios existentes, incluidos:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

El trabajo en nuevos canales debe usar los nombres genéricos de los helpers.
Los alias de compatibilidad existen para evitar una migración de tipo flag day, no como modelo para redactar escenarios nuevos.

## Suites de prueba (qué se ejecuta y dónde)

Piensa en las suites como de “realismo creciente” (y también de mayor inestabilidad/costo):

### Unitarias / integración (predeterminada)

- Comando: `pnpm test`
- Configuración: diez ejecuciones secuenciales de shards (`vitest.full-*.config.ts`) sobre los proyectos de Vitest acotados existentes
- Archivos: inventarios core/unit en `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` y las pruebas de node en `ui` incluidas en allowlist cubiertas por `vitest.unit.config.ts`
- Alcance:
  - Pruebas unitarias puras
  - Pruebas de integración en proceso (autenticación de gateway, enrutamiento, herramientas, análisis, configuración)
  - Regresiones deterministas para errores conocidos
- Expectativas:
  - Se ejecuta en CI
  - No requiere claves reales
  - Debe ser rápida y estable
- Nota sobre proyectos:
  - `pnpm test` sin objetivos ahora ejecuta once configuraciones de shards más pequeñas (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) en lugar de un único proceso gigante del proyecto raíz nativo. Esto reduce el RSS máximo en máquinas cargadas y evita que el trabajo de auto-reply/extensiones bloquee suites no relacionadas.
  - `pnpm test --watch` sigue usando el grafo de proyectos raíz nativo de `vitest.config.ts`, porque un bucle watch con múltiples shards no es práctico.
  - `pnpm test`, `pnpm test:watch` y `pnpm test:perf:imports` enrutan primero los objetivos explícitos de archivo/directorio por carriles acotados, de modo que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar el costo completo de arranque del proyecto raíz.
  - `pnpm test:changed` expande las rutas git modificadas a esos mismos carriles acotados cuando el diff solo toca archivos de origen/prueba enrutable; las ediciones de configuración/preparación siguen recurriendo a la reejecución amplia del proyecto raíz.
  - Las pruebas unitarias ligeras de importación de agents, commands, plugins, helpers de auto-reply, `plugin-sdk` y áreas utilitarias similares se enrutan por el carril `unit-fast`, que omite `test/setup-openclaw-runtime.ts`; los archivos con estado o con runtime más pesado permanecen en los carriles existentes.
  - Algunos archivos helper de origen de `plugin-sdk` y `commands` también asignan las ejecuciones en modo changed a pruebas hermanas explícitas en esos carriles ligeros, de modo que editar helpers evita volver a ejecutar la suite pesada completa de ese directorio.
  - `auto-reply` ahora tiene tres buckets dedicados: helpers core de nivel superior, pruebas de integración `reply.*` de nivel superior y el subárbol `src/auto-reply/reply/**`. Esto mantiene el trabajo más pesado del arnés de reply fuera de las pruebas baratas de estado/chunk/token.
- Nota sobre el ejecutor integrado:
  - Cuando cambies entradas de descubrimiento de herramientas de mensajes o el contexto de runtime de Compaction,
    mantén ambos niveles de cobertura.
  - Agrega regresiones enfocadas de helpers para límites puros de enrutamiento/normalización.
  - Mantén también saludables las suites de integración del ejecutor integrado:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` y
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Esas suites verifican que los ids acotados y el comportamiento de Compaction sigan fluyendo
    por las rutas reales `run.ts` / `compact.ts`; las pruebas solo de helpers no son un
    sustituto suficiente de esas rutas de integración.
- Nota sobre el pool:
  - La configuración base de Vitest ahora usa `threads` de forma predeterminada.
  - La configuración compartida de Vitest también fija `isolate: false` y usa el ejecutor no aislado en los proyectos raíz, e2e y live.
  - El carril raíz de UI mantiene su configuración `jsdom` y su optimizador, pero ahora también se ejecuta en el ejecutor compartido no aislado.
  - Cada shard de `pnpm test` hereda los mismos valores predeterminados `threads` + `isolate: false` de la configuración compartida de Vitest.
  - El iniciador compartido `scripts/run-vitest.mjs` ahora también agrega `--no-maglev` de forma predeterminada para los procesos hijo de Node de Vitest para reducir el churn de compilación de V8 durante ejecuciones locales grandes. Establece `OPENCLAW_VITEST_ENABLE_MAGLEV=1` si necesitas compararlo con el comportamiento estándar de V8.
- Nota sobre iteración local rápida:
  - `pnpm test:changed` enruta por carriles acotados cuando las rutas modificadas se asignan limpiamente a una suite más pequeña.
  - `pnpm test:max` y `pnpm test:changed:max` mantienen el mismo comportamiento de enrutamiento, solo con un límite mayor de workers.
  - El autoescalado local de workers ahora es intencionalmente conservador y también reduce intensidad cuando la carga promedio del host ya es alta, de modo que múltiples ejecuciones concurrentes de Vitest hagan menos daño de forma predeterminada.
  - La configuración base de Vitest marca los archivos de proyecto/configuración como `forceRerunTriggers` para que las reejecuciones en modo changed sigan siendo correctas cuando cambia el cableado de pruebas.
  - La configuración mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado en hosts compatibles; establece `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si quieres una ubicación de caché explícita para perfilado directo.
- Nota sobre depuración de rendimiento:
  - `pnpm test:perf:imports` habilita los informes de duración de importación de Vitest más la salida de desglose de importaciones.
  - `pnpm test:perf:imports:changed` limita esa misma vista de perfilado a los archivos modificados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compara `test:changed` enrutado con la ruta nativa del proyecto raíz para ese diff confirmado e imprime tiempo total más RSS máximo de macOS.
- `pnpm test:perf:changed:bench -- --worktree` evalúa el árbol de trabajo actual con cambios, enrutando la lista de archivos modificados a través de `scripts/test-projects.mjs` y la configuración raíz de Vitest.
  - `pnpm test:perf:profile:main` escribe un perfil de CPU del hilo principal para la sobrecarga de inicio y transformación de Vitest/Vite.
  - `pnpm test:perf:profile:runner` escribe perfiles de CPU+heap del ejecutor para la suite unitaria con el paralelismo de archivos deshabilitado.

### E2E (prueba de humo de Gateway)

- Comando: `pnpm test:e2e`
- Configuración: `vitest.e2e.config.ts`
- Archivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Valores predeterminados de runtime:
  - Usa `threads` de Vitest con `isolate: false`, igual que el resto del repositorio.
  - Usa workers adaptativos (CI: hasta 2, local: 1 de forma predeterminada).
  - Se ejecuta en modo silencioso de forma predeterminada para reducir la sobrecarga de E/S de consola.
- Sobrescrituras útiles:
  - `OPENCLAW_E2E_WORKERS=<n>` para forzar la cantidad de workers (máximo 16).
  - `OPENCLAW_E2E_VERBOSE=1` para volver a habilitar la salida detallada en consola.
- Alcance:
  - Comportamiento end-to-end de Gateway con múltiples instancias
  - Superficies WebSocket/HTTP, emparejamiento de nodos y redes más pesadas
- Expectativas:
  - Se ejecuta en CI (cuando está habilitado en la canalización)
  - No requiere claves reales
  - Tiene más partes móviles que las pruebas unitarias (puede ser más lento)

### E2E: prueba de humo del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Archivo: `test/openshell-sandbox.e2e.test.ts`
- Alcance:
  - Inicia un Gateway OpenShell aislado en el host mediante Docker
  - Crea un sandbox a partir de un Dockerfile local temporal
  - Ejercita el backend OpenShell de OpenClaw mediante `sandbox ssh-config` + ejecución SSH reales
  - Verifica el comportamiento canónico remoto del sistema de archivos a través del puente fs del sandbox
- Expectativas:
  - Solo opt-in; no forma parte de la ejecución predeterminada de `pnpm test:e2e`
  - Requiere un CLI local `openshell` y un daemon de Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` aislados y luego destruye el Gateway y el sandbox de prueba
- Sobrescrituras útiles:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar la prueba al ejecutar manualmente la suite e2e más amplia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apuntar a un binario CLI no predeterminado o a un script envoltorio

### Live (proveedores reales + modelos reales)

- Comando: `pnpm test:live`
- Configuración: `vitest.live.config.ts`
- Archivos: `src/**/*.live.test.ts`
- Predeterminado: **habilitado** por `pnpm test:live` (establece `OPENCLAW_LIVE_TEST=1`)
- Alcance:
  - “¿Este proveedor/modelo realmente funciona _hoy_ con credenciales reales?”
  - Detectar cambios de formato del proveedor, particularidades de llamadas a herramientas, problemas de autenticación y comportamiento de límites de tasa
- Expectativas:
  - Por diseño no es estable en CI (redes reales, políticas reales de proveedores, cuotas, interrupciones)
  - Cuesta dinero / consume límites de tasa
  - Se prefiere ejecutar subconjuntos acotados en lugar de “todo”
- Las ejecuciones live obtienen `~/.profile` para recoger claves de API faltantes.
- De forma predeterminada, las ejecuciones live siguen aislando `HOME` y copiando material de configuración/autenticación a un home temporal de prueba para que los fixtures unitarios no puedan mutar tu `~/.openclaw` real.
- Establece `OPENCLAW_LIVE_USE_REAL_HOME=1` solo cuando necesites intencionalmente que las pruebas live usen tu directorio home real.
- `pnpm test:live` ahora usa de forma predeterminada un modo más silencioso: mantiene la salida de progreso `[live] ...`, pero suprime el aviso adicional de `~/.profile` y silencia los logs de arranque de Gateway/el ruido de Bonjour. Establece `OPENCLAW_LIVE_TEST_QUIET=0` si quieres volver a ver los logs completos de inicio.
- Rotación de claves de API (específica por proveedor): establece `*_API_KEYS` con formato de comas/punto y coma o `*_API_KEY_1`, `*_API_KEY_2` (por ejemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) o una sobrescritura por live mediante `OPENCLAW_LIVE_*_KEY`; las pruebas reintentan ante respuestas de límite de tasa.
- Salida de progreso/Heartbeat:
  - Las suites live ahora emiten líneas de progreso a stderr para que las llamadas largas a proveedores sean visiblemente activas incluso cuando la captura de consola de Vitest está en modo silencioso.
  - `vitest.live.config.ts` deshabilita la interceptación de consola de Vitest para que las líneas de progreso del proveedor/Gateway se transmitan de inmediato durante las ejecuciones live.
  - Ajusta los Heartbeat de modelo directo con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajusta los Heartbeat de Gateway/sonda con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## ¿Qué suite debería ejecutar?

Usa esta tabla de decisión:

- Si editas lógica/pruebas: ejecuta `pnpm test` (y `pnpm test:coverage` si cambiaste mucho)
- Si tocas redes de Gateway / protocolo WS / emparejamiento: añade `pnpm test:e2e`
- Si depuras “mi bot está caído” / fallos específicos de proveedor / llamadas a herramientas: ejecuta un `pnpm test:live` acotado

## Live: barrido de capacidades de Node Android

- Prueba: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **cada comando anunciado actualmente** por un Node Android conectado y verificar el comportamiento del contrato del comando.
- Alcance:
  - Configuración previa/manual (la suite no instala/ejecuta/empareja la app).
  - Validación `node.invoke` de Gateway comando por comando para el Node Android seleccionado.
- Configuración previa obligatoria:
  - App Android ya conectada y emparejada con el Gateway.
  - App mantenida en primer plano.
  - Permisos/consentimiento de captura concedidos para las capacidades que esperas que pasen.
- Sobrescrituras opcionales del objetivo:
  - `OPENCLAW_ANDROID_NODE_ID` o `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalles completos de configuración de Android: [App Android](/es/platforms/android)

## Live: prueba de humo de modelos (claves de perfil)

Las pruebas live se dividen en dos capas para poder aislar fallos:

- “Modelo directo” nos dice si el proveedor/modelo puede responder en absoluto con la clave dada.
- “Prueba de humo de Gateway” nos dice si la canalización completa gateway+agent funciona para ese modelo (sesiones, historial, herramientas, política de sandbox, etc.).

### Capa 1: finalización directa del modelo (sin gateway)

- Prueba: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar los modelos detectados
  - Usar `getApiKeyForModel` para seleccionar los modelos para los que tienes credenciales
  - Ejecutar una pequeña finalización por modelo (y regresiones específicas cuando sea necesario)
- Cómo habilitar:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
- Establece `OPENCLAW_LIVE_MODELS=modern` (o `all`, alias de modern) para ejecutar realmente esta suite; de lo contrario, se omite para mantener `pnpm test:live` enfocado en la prueba de humo de Gateway
- Cómo seleccionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` para ejecutar la allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` es un alias de la allowlist moderna
  - o `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist separada por comas)
  - Los barridos modern/all usan por defecto un límite curado de alta señal; establece `OPENCLAW_LIVE_MAX_MODELS=0` para un barrido moderno exhaustivo o un número positivo para un límite menor.
- Cómo seleccionar proveedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist separada por comas)
- De dónde provienen las claves:
  - De forma predeterminada: almacén de perfiles y alternativas de env
  - Establece `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para exigir **solo el almacén de perfiles**
- Por qué existe esto:
  - Separa “la API del proveedor está rota / la clave no es válida” de “la canalización del agent de gateway está rota”
  - Contiene regresiones pequeñas y aisladas (ejemplo: flujos de repetición de razonamiento y llamadas a herramientas de OpenAI Responses/Codex Responses)

### Capa 2: prueba de humo de Gateway + agent dev (lo que realmente hace "@openclaw")

- Prueba: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Iniciar un Gateway en proceso
  - Crear/parchear una sesión `agent:dev:*` (sobrescritura de modelo por ejecución)
  - Iterar sobre modelos con claves y verificar:
    - respuesta “significativa” (sin herramientas)
    - que una invocación real de herramienta funcione (sonda de lectura)
    - sondas opcionales de herramientas adicionales (sonda exec+read)
    - que sigan funcionando las rutas de regresión de OpenAI (solo llamada a herramienta → seguimiento)
- Detalles de las sondas (para que puedas explicar fallos rápidamente):
  - sonda `read`: la prueba escribe un archivo nonce en el workspace y le pide al agent que lo `read` y devuelva el nonce.
  - sonda `exec+read`: la prueba le pide al agent que escriba mediante `exec` un nonce en un archivo temporal y luego lo lea de vuelta con `read`.
  - sonda de imagen: la prueba adjunta un PNG generado (cat + código aleatorio) y espera que el modelo devuelva `cat <CODE>`.
  - Referencia de implementación: `src/gateway/gateway-models.profiles.live.test.ts` y `src/gateway/live-image-probe.ts`.
- Cómo habilitar:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
- Cómo seleccionar modelos:
  - Predeterminado: allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` es un alias de la allowlist moderna
  - O establece `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (o una lista separada por comas) para acotar
  - Los barridos modern/all de gateway usan por defecto un límite curado de alta señal; establece `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para un barrido moderno exhaustivo o un número positivo para un límite menor.
- Cómo seleccionar proveedores (evita “OpenRouter para todo”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist separada por comas)
- Las sondas de herramienta + imagen siempre están activadas en esta prueba live:
  - sonda `read` + sonda `exec+read` (estrés de herramientas)
  - la sonda de imagen se ejecuta cuando el modelo anuncia compatibilidad con entrada de imagen
  - Flujo (alto nivel):
    - La prueba genera un PNG pequeño con “CAT” + código aleatorio (`src/gateway/live-image-probe.ts`)
    - Lo envía mediante `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway analiza los adjuntos en `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - El agent integrado reenvía un mensaje de usuario multimodal al modelo
    - Verificación: la respuesta contiene `cat` + el código (tolerancia OCR: se permiten errores menores)

Consejo: para ver qué puedes probar en tu máquina (y los ids exactos `provider/model`), ejecuta:

```bash
openclaw models list
openclaw models list --json
```

## Live: prueba de humo del backend CLI (Claude, Codex, Gemini u otros CLIs locales)

- Prueba: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar la canalización de Gateway + agent usando un backend CLI local, sin tocar tu configuración predeterminada.
- Los valores predeterminados de prueba de humo específicos del backend se encuentran en la definición `cli-backend.ts` de la extensión propietaria.
- Habilitar:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Valores predeterminados:
  - Proveedor/modelo predeterminado: `claude-cli/claude-sonnet-4-6`
  - El comportamiento de command/args/image proviene de los metadatos del Plugin propietario del backend CLI.
- Sobrescrituras (opcionales):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar un adjunto de imagen real (las rutas se inyectan en el prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para pasar rutas de archivos de imagen como argumentos de CLI en lugar de inyección en el prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (o `"list"`) para controlar cómo se pasan los argumentos de imagen cuando `IMAGE_ARG` está establecido.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar un segundo turno y validar el flujo de reanudación.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` para desactivar la sonda predeterminada de continuidad en la misma sesión de Claude Sonnet -> Opus (establece `1` para forzarla cuando el modelo seleccionado admita un destino de cambio).

Ejemplo:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Receta de Docker:

```bash
pnpm test:docker:live-cli-backend
```

Recetas de Docker para un solo proveedor:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Notas:

- El ejecutor de Docker se encuentra en `scripts/test-live-cli-backend-docker.sh`.
- Ejecuta la prueba de humo live del backend CLI dentro de la imagen Docker del repositorio como el usuario no root `node`.
- Resuelve los metadatos de prueba de humo del CLI desde la extensión propietaria y luego instala el paquete CLI de Linux correspondiente (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) en un prefijo escribible en caché en `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (predeterminado: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` requiere OAuth portátil de suscripción de Claude Code mediante `~/.claude/.credentials.json` con `claudeAiOauth.subscriptionType` o `CLAUDE_CODE_OAUTH_TOKEN` de `claude setup-token`. Primero demuestra `claude -p` directo en Docker y luego ejecuta dos turnos del backend CLI de Gateway sin preservar las variables de entorno de clave de API de Anthropic. Este carril de suscripción desactiva por defecto las sondas MCP/tool e imagen de Claude porque actualmente Claude enruta el uso de apps de terceros mediante facturación de uso adicional en lugar de los límites normales del plan de suscripción.
- La prueba de humo live del backend CLI ahora ejercita el mismo flujo end-to-end para Claude, Codex y Gemini: turno de texto, turno de clasificación de imagen y luego llamada a la herramienta MCP `cron` verificada a través del CLI de gateway.
- La prueba de humo predeterminada de Claude también parchea la sesión de Sonnet a Opus y verifica que la sesión reanudada siga recordando una nota anterior.

## Live: prueba de humo de enlace de ACP (`/acp spawn ... --bind here`)

- Prueba: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar el flujo real de conversation-bind de ACP con un agent ACP live:
  - enviar `/acp spawn <agent> --bind here`
  - enlazar in situ una conversación sintética de canal de mensajes
  - enviar un seguimiento normal en esa misma conversación
  - verificar que el seguimiento llegue en la transcripción de la sesión ACP enlazada
- Habilitar:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Valores predeterminados:
  - Agents ACP en Docker: `claude,codex,gemini`
  - Agent ACP para `pnpm test:live ...` directo: `claude`
  - Canal sintético: contexto de conversación estilo DM de Slack
  - Backend ACP: `acpx`
- Sobrescrituras:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Notas:
  - Este carril usa la superficie `chat.send` de gateway con campos sintéticos de ruta de origen solo para administradores para que las pruebas puedan adjuntar contexto de canal de mensajes sin fingir entrega externa.
  - Cuando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` no está establecido, la prueba usa el registro integrado de agents del Plugin `acpx` para el agent de arnés ACP seleccionado.

Ejemplo:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Receta de Docker:

```bash
pnpm test:docker:live-acp-bind
```

Recetas de Docker para un solo agent:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Notas de Docker:

- El ejecutor de Docker se encuentra en `scripts/test-live-acp-bind-docker.sh`.
- De forma predeterminada, ejecuta la prueba de humo de enlace ACP contra todos los agents CLI live compatibles en secuencia: `claude`, `codex` y luego `gemini`.
- Usa `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` o `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` para acotar la matriz.
- Obtiene `~/.profile`, prepara el material de autenticación del CLI correspondiente dentro del contenedor, instala `acpx` en un prefijo npm escribible y luego instala el CLI live solicitado (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) si falta.
- Dentro de Docker, el ejecutor establece `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` para que acpx mantenga disponibles para el CLI hijo del arnés las variables de entorno del proveedor obtenidas del perfil.

## Live: prueba de humo del arnés app-server de Codex

- Objetivo: validar el arnés Codex propiedad del Plugin mediante el método normal
  `agent` de gateway:
  - cargar el Plugin integrado `codex`
  - seleccionar `OPENCLAW_AGENT_RUNTIME=codex`
  - enviar un primer turno de gateway agent a `codex/gpt-5.4`
  - enviar un segundo turno a la misma sesión de OpenClaw y verificar que el hilo
    del app-server puede reanudarse
  - ejecutar `/codex status` y `/codex models` mediante la misma ruta de
    comandos de gateway
- Prueba: `src/gateway/gateway-codex-harness.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modelo predeterminado: `codex/gpt-5.4`
- Sonda de imagen opcional: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sonda opcional MCP/tool: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- La prueba de humo establece `OPENCLAW_AGENT_HARNESS_FALLBACK=none` para que un arnés Codex roto
  no pueda pasar recurriendo silenciosamente a PI.
- Auth: `OPENAI_API_KEY` desde el shell/perfil, más opcionalmente
  `~/.codex/auth.json` y `~/.codex/config.toml` copiados

Receta local:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Receta de Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Notas de Docker:

- El ejecutor de Docker se encuentra en `scripts/test-live-codex-harness-docker.sh`.
- Obtiene el `~/.profile` montado, pasa `OPENAI_API_KEY`, copia los archivos de autenticación
  del CLI de Codex cuando están presentes, instala `@openai/codex` en un prefijo npm
  montado y escribible, prepara el árbol de código fuente y luego ejecuta solo la prueba live del arnés de Codex.
- Docker habilita por defecto las sondas de imagen y MCP/tool. Establece
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` o
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` cuando necesites una ejecución de depuración más acotada.
- Docker también exporta `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, igual que la configuración
  de la prueba live, para que el fallback a `openai-codex/*` o PI no pueda ocultar una regresión
  del arnés de Codex.

### Recetas live recomendadas

Las allowlists acotadas y explícitas son las más rápidas y menos inestables:

- Un solo modelo, directo (sin gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Un solo modelo, prueba de humo de gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Llamadas a herramientas en varios proveedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Enfoque en Google (clave API de Gemini + Antigravity):
  - Gemini (clave API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Notas:

- `google/...` usa la API de Gemini (clave API).
- `google-antigravity/...` usa el puente OAuth de Antigravity (endpoint de agent estilo Cloud Code Assist).
- `google-gemini-cli/...` usa el CLI local de Gemini en tu máquina (autenticación separada + particularidades de herramientas).
- API de Gemini frente a CLI de Gemini:
  - API: OpenClaw llama por HTTP a la API alojada de Gemini de Google (autenticación por clave API / perfil); esto es lo que la mayoría de los usuarios entiende por “Gemini”.
  - CLI: OpenClaw ejecuta un binario local `gemini`; tiene su propia autenticación y puede comportarse de forma diferente (streaming/compatibilidad de herramientas/desfase de versión).

## Live: matriz de modelos (qué cubrimos)

No hay una “lista fija de modelos de CI” (live es opt-in), pero estos son los modelos **recomendados** para cubrir regularmente en una máquina de desarrollo con claves.

### Conjunto moderno de prueba de humo (llamadas a herramientas + imagen)

Esta es la ejecución de “modelos comunes” que esperamos mantener funcional:

- OpenAI (no-Codex): `openai/gpt-5.4` (opcional: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (o `anthropic/claude-sonnet-4-6`)
- Google (API de Gemini): `google/gemini-3.1-pro-preview` y `google/gemini-3-flash-preview` (evita modelos Gemini 2.x más antiguos)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` y `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Ejecutar prueba de humo de gateway con herramientas + imagen:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Línea base: llamadas a herramientas (Read + Exec opcional)

Elige al menos uno por familia de proveedores:

- OpenAI: `openai/gpt-5.4` (o `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (o `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (o `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Cobertura adicional opcional (deseable):

- xAI: `xai/grok-4` (o la última disponible)
- Mistral: `mistral/`… (elige un modelo con capacidad de herramientas que tengas habilitado)
- Cerebras: `cerebras/`… (si tienes acceso)
- LM Studio: `lmstudio/`… (local; las llamadas a herramientas dependen del modo de API)

### Vision: envío de imagen (adjunto → mensaje multimodal)

Incluye al menos un modelo con capacidad de imagen en `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/variantes de OpenAI con capacidad de visión, etc.) para ejercitar la sonda de imagen.

### Agregadores / gateways alternativos

Si tienes claves habilitadas, también admitimos pruebas mediante:

- OpenRouter: `openrouter/...` (cientos de modelos; usa `openclaw models scan` para encontrar candidatos con capacidad de herramientas+imagen)
- OpenCode: `opencode/...` para Zen y `opencode-go/...` para Go (autenticación mediante `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Más proveedores que puedes incluir en la matriz live (si tienes credenciales/configuración):

- Integrados: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Mediante `models.providers` (endpoints personalizados): `minimax` (cloud/API), además de cualquier proxy compatible con OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, etc.)

Consejo: no intentes codificar de forma rígida “todos los modelos” en la documentación. La lista autorizada es lo que devuelva `discoverModels(...)` en tu máquina + las claves que estén disponibles.

## Credenciales (nunca las confirmes en el repositorio)

Las pruebas live detectan credenciales del mismo modo que el CLI. Implicaciones prácticas:

- Si el CLI funciona, las pruebas live deberían encontrar las mismas claves.
- Si una prueba live dice “sin credenciales”, depúralo del mismo modo que depurarías `openclaw models list` / selección de modelo.

- Perfiles de autenticación por agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (esto es lo que significa “claves de perfil” en las pruebas live)
- Configuración: `~/.openclaw/openclaw.json` (o `OPENCLAW_CONFIG_PATH`)
- Directorio de estado heredado: `~/.openclaw/credentials/` (se copia al home live preparado cuando está presente, pero no es el almacén principal de claves de perfil)
- Las ejecuciones live locales copian por defecto la configuración activa, los archivos `auth-profiles.json` por agent, el directorio heredado `credentials/` y los directorios de autenticación CLI externos compatibles a un home temporal de prueba; los homes live preparados omiten `workspace/` y `sandboxes/`, y se eliminan las sobrescrituras de ruta `agents.*.workspace` / `agentDir` para que las sondas no toquen tu workspace real del host.

Si quieres depender de claves en env (por ejemplo exportadas en tu `~/.profile`), ejecuta las pruebas locales después de `source ~/.profile`, o usa los ejecutores de Docker de abajo (pueden montar `~/.profile` dentro del contenedor).

## Live de Deepgram (transcripción de audio)

- Prueba: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Habilitar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Live del plan de codificación de BytePlus

- Prueba: `src/agents/byteplus.live.test.ts`
- Habilitar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Sobrescritura opcional de modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live de medios del flujo de trabajo de ComfyUI

- Prueba: `extensions/comfy/comfy.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Alcance:
  - Ejercita las rutas integradas de imagen, video y `music_generate` de comfy
  - Omite cada capacidad a menos que `models.providers.comfy.<capability>` esté configurado
  - Útil después de cambiar el envío de flujos de trabajo de comfy, el sondeo, las descargas o el registro del Plugin

## Live de generación de imágenes

- Prueba: `src/image-generation/runtime.live.test.ts`
- Comando: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Arnés: `pnpm test:live:media image`
- Alcance:
  - Enumera cada Plugin de proveedor de generación de imágenes registrado
  - Carga variables de entorno faltantes del proveedor desde tu shell de inicio de sesión (`~/.profile`) antes de sondear
  - Usa por defecto claves API live/env antes que perfiles de autenticación almacenados, para que claves de prueba obsoletas en `auth-profiles.json` no oculten credenciales reales del shell
  - Omite proveedores sin auth/perfil/modelo utilizable
  - Ejecuta las variantes estándar de generación de imágenes mediante la capacidad de runtime compartida:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Proveedores integrados cubiertos actualmente:
  - `openai`
  - `google`
- Acotación opcional:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Comportamiento opcional de autenticación:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar autenticación del almacén de perfiles e ignorar sobrescrituras solo de env

## Live de generación de música

- Prueba: `extensions/music-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Arnés: `pnpm test:live:media music`
- Alcance:
  - Ejercita la ruta compartida integrada de proveedor de generación de música
  - Actualmente cubre Google y MiniMax
  - Carga variables de entorno del proveedor desde tu shell de inicio de sesión (`~/.profile`) antes de sondear
  - Usa por defecto claves API live/env antes que perfiles de autenticación almacenados, para que claves de prueba obsoletas en `auth-profiles.json` no oculten credenciales reales del shell
  - Omite proveedores sin auth/perfil/modelo utilizable
  - Ejecuta ambos modos de runtime declarados cuando están disponibles:
    - `generate` con entrada solo de prompt
    - `edit` cuando el proveedor declara `capabilities.edit.enabled`
  - Cobertura actual del carril compartido:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: archivo live de Comfy separado, no este barrido compartido
- Acotación opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportamiento opcional de autenticación:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar autenticación del almacén de perfiles e ignorar sobrescrituras solo de env

## Live de generación de video

- Prueba: `extensions/video-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Arnés: `pnpm test:live:media video`
- Alcance:
  - Ejercita la ruta compartida integrada de proveedor de generación de video
  - Usa por defecto la ruta de prueba de humo segura para versiones: proveedores que no son FAL, una solicitud de texto a video por proveedor, prompt lobster de un segundo y un límite de operación por proveedor tomado de `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` de forma predeterminada)
  - Omite FAL de forma predeterminada porque la latencia de cola del lado del proveedor puede dominar el tiempo de publicación; pasa `--video-providers fal` o `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` para ejecutarlo explícitamente
  - Carga las variables de entorno del proveedor desde tu shell de inicio de sesión (`~/.profile`) antes de sondear
  - Usa por defecto claves API live/env antes que perfiles de autenticación almacenados, para que claves de prueba obsoletas en `auth-profiles.json` no oculten credenciales reales del shell
  - Omite proveedores sin auth/perfil/modelo utilizable
  - Ejecuta solo `generate` de forma predeterminada
  - Establece `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para ejecutar también los modos de transformación declarados cuando estén disponibles:
    - `imageToVideo` cuando el proveedor declara `capabilities.imageToVideo.enabled` y el proveedor/modelo seleccionado acepta entrada de imagen local respaldada por búfer en el barrido compartido
    - `videoToVideo` cuando el proveedor declara `capabilities.videoToVideo.enabled` y el proveedor/modelo seleccionado acepta entrada de video local respaldada por búfer en el barrido compartido
  - Proveedores `imageToVideo` actualmente declarados pero omitidos en el barrido compartido:
    - `vydra` porque el `veo3` integrado es solo de texto y el `kling` integrado requiere una URL remota de imagen
  - Cobertura específica de proveedor para Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ese archivo ejecuta `veo3` de texto a video más un carril `kling` que usa por defecto un fixture de URL remota de imagen
  - Cobertura live actual de `videoToVideo`:
    - solo `runway` cuando el modelo seleccionado es `runway/gen4_aleph`
  - Proveedores `videoToVideo` actualmente declarados pero omitidos en el barrido compartido:
    - `alibaba`, `qwen`, `xai` porque esas rutas actualmente requieren URLs de referencia remotas `http(s)` / MP4
    - `google` porque el carril compartido actual Gemini/Veo usa entrada local respaldada por búfer y esa ruta no se acepta en el barrido compartido
    - `openai` porque el carril compartido actual carece de garantías de acceso específicas de la organización para video inpaint/remix
- Acotación opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` para incluir todos los proveedores en el barrido predeterminado, incluido FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` para reducir el límite de operación de cada proveedor en una ejecución agresiva de prueba de humo
- Comportamiento opcional de autenticación:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar autenticación del almacén de perfiles e ignorar sobrescrituras solo de env

## Arnés live de medios

- Comando: `pnpm test:live:media`
- Propósito:
  - Ejecuta las suites live compartidas de imagen, música y video a través de un único punto de entrada nativo del repositorio
  - Carga automáticamente variables de entorno faltantes del proveedor desde `~/.profile`
  - Acota automáticamente cada suite a los proveedores que actualmente tienen auth utilizable de forma predeterminada
  - Reutiliza `scripts/test-live.mjs`, para que el comportamiento de Heartbeat y modo silencioso siga siendo coherente
- Ejemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Ejecutores de Docker (comprobaciones opcionales de “funciona en Linux”)

Estos ejecutores de Docker se dividen en dos grupos:

- Ejecutores live de modelos: `test:docker:live-models` y `test:docker:live-gateway` ejecutan solo su archivo live de claves de perfil correspondiente dentro de la imagen Docker del repositorio (`src/agents/models.profiles.live.test.ts` y `src/gateway/gateway-models.profiles.live.test.ts`), montando tu directorio de configuración local y workspace (y obteniendo `~/.profile` si está montado). Los puntos de entrada locales correspondientes son `test:live:models-profiles` y `test:live:gateway-profiles`.
- Los ejecutores live de Docker usan por defecto un límite de prueba de humo más pequeño para que un barrido completo en Docker siga siendo práctico:
  `test:docker:live-models` usa por defecto `OPENCLAW_LIVE_MAX_MODELS=12`, y
  `test:docker:live-gateway` usa por defecto `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` y
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sobrescribe esas variables de entorno cuando
  quieras explícitamente el barrido exhaustivo más grande.
- `test:docker:all` compila la imagen Docker live una vez mediante `test:docker:live-build` y luego la reutiliza para los dos carriles live de Docker.
- Ejecutores de prueba de humo de contenedores: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` y `test:docker:plugins` inician uno o más contenedores reales y verifican rutas de integración de nivel superior.

Los ejecutores live de modelos de Docker también montan por enlace solo los homes de autenticación CLI necesarios (o todos los compatibles cuando la ejecución no está acotada), luego los copian al home del contenedor antes de la ejecución para que OAuth del CLI externo pueda renovar tokens sin mutar el almacén de autenticación del host:

- Modelos directos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Prueba de humo de enlace ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Prueba de humo del backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Prueba de humo del arnés app-server de Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Prueba de humo live de Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Asistente de onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Redes de Gateway (dos contenedores, autenticación WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Puente de canal MCP (Gateway sembrado + puente stdio + prueba de humo de tramas de notificación Claude sin procesar): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (prueba de humo de instalación + alias `/plugin` + semántica de reinicio del paquete Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)

Los ejecutores live de modelos de Docker también montan por enlace la checkout actual en modo solo lectura y
la preparan en un workdir temporal dentro del contenedor. Esto mantiene la
imagen de runtime ligera y aun así ejecuta Vitest contra tu código fuente/configuración locales exactos.
El paso de preparación omite cachés grandes solo locales y salidas de compilación de apps como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` y directorios de salida locales de app `.build` o
Gradle para que las ejecuciones live de Docker no pasen minutos copiando
artefactos específicos de la máquina.
También establecen `OPENCLAW_SKIP_CHANNELS=1` para que las sondas live de gateway no inicien
workers reales de canales Telegram/Discord/etc. dentro del contenedor.
`test:docker:live-models` sigue ejecutando `pnpm test:live`, así que deja pasar
`OPENCLAW_LIVE_GATEWAY_*` también cuando necesites acotar o excluir la cobertura
live de gateway de ese carril de Docker.
`test:docker:openwebui` es una prueba de humo de compatibilidad de nivel superior: inicia un
contenedor de Gateway de OpenClaw con los endpoints HTTP compatibles con OpenAI habilitados,
inicia un contenedor fijado de Open WebUI contra ese gateway, inicia sesión mediante
Open WebUI, verifica que `/api/models` exponga `openclaw/default` y luego envía una
solicitud de chat real a través del proxy `/api/chat/completions` de Open WebUI.
La primera ejecución puede ser notablemente más lenta porque Docker puede necesitar descargar la
imagen de Open WebUI y Open WebUI puede necesitar completar su propia configuración de inicio en frío.
Este carril espera una clave de modelo live utilizable, y `OPENCLAW_PROFILE_FILE`
(`~/.profile` de forma predeterminada) es la forma principal de proporcionarla en ejecuciones Dockerizadas.
Las ejecuciones correctas imprimen una pequeña carga JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` es intencionalmente determinista y no necesita una
cuenta real de Telegram, Discord o iMessage. Inicia un contenedor de Gateway
sembrado, inicia un segundo contenedor que lanza `openclaw mcp serve` y luego
verifica descubrimiento de conversaciones enrutadas, lecturas de transcripciones, metadatos de adjuntos,
comportamiento de cola de eventos live, enrutamiento de envíos salientes y notificaciones de estilo Claude de canal +
permisos a través del puente MCP stdio real. La comprobación de notificaciones
inspecciona directamente las tramas MCP stdio sin procesar, de modo que la prueba de humo valida lo que el
puente realmente emite, no solo lo que una SDK específica del cliente exponga.

Prueba manual ACP de hilos en lenguaje natural (no CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conserva este script para flujos de trabajo de regresión/depuración. Puede volver a ser necesario para la validación de enrutamiento de hilos ACP, así que no lo elimines.

Variables de entorno útiles:

- `OPENCLAW_CONFIG_DIR=...` (predeterminado: `~/.openclaw`) montado en `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predeterminado: `~/.openclaw/workspace`) montado en `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predeterminado: `~/.profile`) montado en `/home/node/.profile` y obtenido antes de ejecutar las pruebas
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar solo variables de entorno obtenidas de `OPENCLAW_PROFILE_FILE`, usando directorios temporales de configuración/workspace y sin montajes externos de autenticación CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predeterminado: `~/.cache/openclaw/docker-cli-tools`) montado en `/home/node/.npm-global` para instalaciones CLI en caché dentro de Docker
- Directorios/archivos de autenticación CLI externos bajo `$HOME` se montan en modo solo lectura bajo `/host-auth...`, y luego se copian a `/home/node/...` antes de que comiencen las pruebas
  - Directorios predeterminados: `.minimax`
  - Archivos predeterminados: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Las ejecuciones acotadas por proveedor montan solo los directorios/archivos necesarios inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sobrescribe manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o una lista separada por comas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para acotar la ejecución
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar proveedores dentro del contenedor
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar una imagen existente `openclaw:local-live` en reejecuciones que no necesiten recompilar
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para asegurar que las credenciales provengan del almacén de perfiles (no de env)
- `OPENCLAW_OPENWEBUI_MODEL=...` para elegir el modelo expuesto por el gateway para la prueba de humo de Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para sobrescribir el prompt de verificación de nonce usado por la prueba de humo de Open WebUI
- `OPENWEBUI_IMAGE=...` para sobrescribir la etiqueta fijada de imagen de Open WebUI

## Verificación básica de documentación

Ejecuta las comprobaciones de documentación después de editar documentación: `pnpm check:docs`.
Ejecuta la validación completa de anchors de Mintlify cuando también necesites comprobaciones de encabezados en la página: `pnpm docs:check-links:anchors`.

## Regresión sin conexión (segura para CI)

Estas son regresiones de “canalización real” sin proveedores reales:

- Llamadas a herramientas de Gateway (OpenAI simulado, gateway real + bucle de agent): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Asistente de Gateway (WS `wizard.start`/`wizard.next`, escribe configuración + auth obligatoria): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evaluaciones de confiabilidad de agent (Skills)

Ya tenemos algunas pruebas seguras para CI que se comportan como “evaluaciones de confiabilidad de agent”:

- Llamadas simuladas a herramientas a través del gateway real + bucle de agent (`src/gateway/gateway.test.ts`).
- Flujos end-to-end del asistente que validan el cableado de sesión y los efectos de configuración (`src/gateway/gateway.test.ts`).

Lo que aún falta para Skills (ver [Skills](/es/tools/skills)):

- **Decisión:** cuando se enumeran Skills en el prompt, ¿el agent elige la Skill correcta (o evita las irrelevantes)?
- **Cumplimiento:** ¿el agent lee `SKILL.md` antes de usarla y sigue los pasos/args requeridos?
- **Contratos de flujo de trabajo:** escenarios de varios turnos que verifican el orden de herramientas, la persistencia del historial de sesión y los límites del sandbox.

Las futuras evaluaciones deben seguir siendo deterministas primero:

- Un ejecutor de escenarios que use proveedores simulados para verificar llamadas a herramientas + orden, lecturas de archivos de Skills y cableado de sesión.
- Una pequeña suite de escenarios centrados en Skills (usar vs evitar, compuertas, prompt injection).
- Evaluaciones live opcionales (opt-in, controladas por env) solo después de que la suite segura para CI esté implementada.

## Pruebas de contrato (forma de Plugin y canal)

Las pruebas de contrato verifican que cada Plugin y canal registrado se ajuste a su
contrato de interfaz. Iteran sobre todos los Plugins detectados y ejecutan un conjunto de
verificaciones de forma y comportamiento. El carril unitario predeterminado de `pnpm test`
omite intencionalmente estos archivos compartidos de interfaz y prueba de humo; ejecuta los comandos
de contrato explícitamente cuando toques superficies compartidas de canal o proveedor.

### Comandos

- Todos los contratos: `pnpm test:contracts`
- Solo contratos de canal: `pnpm test:contracts:channels`
- Solo contratos de proveedor: `pnpm test:contracts:plugins`

### Contratos de canal

Ubicados en `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma básica del Plugin (id, nombre, capacidades)
- **setup** - Contrato del asistente de configuración
- **session-binding** - Comportamiento de vinculación de sesión
- **outbound-payload** - Estructura de la carga de mensaje
- **inbound** - Manejo de mensajes entrantes
- **actions** - Controladores de acciones del canal
- **threading** - Manejo de id de hilo
- **directory** - API de directorio/lista
- **group-policy** - Aplicación de política de grupo

### Contratos de estado del proveedor

Ubicados en `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondas de estado del canal
- **registry** - Forma del registro de Plugins

### Contratos de proveedor

Ubicados en `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato de flujo de autenticación
- **auth-choice** - Elección/selección de autenticación
- **catalog** - API del catálogo de modelos
- **discovery** - Descubrimiento de Plugins
- **loader** - Carga de Plugins
- **runtime** - Runtime del proveedor
- **shape** - Forma/interfaz del Plugin
- **wizard** - Asistente de configuración

### Cuándo ejecutarlas

- Después de cambiar exportaciones o subrutas de plugin-sdk
- Después de agregar o modificar un Plugin de canal o proveedor
- Después de refactorizar el registro o descubrimiento de Plugins

Las pruebas de contrato se ejecutan en CI y no requieren claves de API reales.

## Agregar regresiones (guía)

Cuando corrijas un problema de proveedor/modelo detectado en live:

- Agrega una regresión segura para CI si es posible (proveedor simulado/stub, o captura la transformación exacta de la forma de la solicitud)
- Si es intrínsecamente solo live (límites de tasa, políticas de autenticación), mantén la prueba live acotada y opt-in mediante variables de entorno
- Prefiere apuntar a la capa más pequeña que detecte el error:
  - error de conversión/repetición de solicitudes del proveedor → prueba de modelos directos
  - error en la canalización de sesión/historial/herramientas de gateway → prueba de humo live de gateway o prueba segura para CI con simulación de gateway
- Protección para el recorrido de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un objetivo de muestra por clase de SecretRef a partir de metadatos del registro (`listSecretTargetRegistryEntries()`), y luego verifica que se rechacen ids exec de segmentos de recorrido.
  - Si agregas una nueva familia de objetivos SecretRef `includeInPlan` en `src/secrets/target-registry-data.ts`, actualiza `classifyTargetClass` en esa prueba. La prueba falla intencionalmente con ids de objetivo sin clasificar para que las nuevas clases no puedan omitirse silenciosamente.
