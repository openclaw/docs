---
read_when:
    - Ejecución de pruebas localmente o en CI
    - Agregar regresiones para errores de modelo/proveedor
    - Depuración del comportamiento de Gateway + agente
summary: 'Kit de pruebas: suites unitarias/e2e/en vivo, ejecutores de Docker y qué cubre cada prueba'
title: Pruebas
x-i18n:
    generated_at: "2026-04-21T05:15:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef5bf36f969a6334efd2e8373a0c8002f9e6461af53c4ff630b38ad8e37f73de
    source_path: help/testing.md
    workflow: 15
---

# Pruebas

OpenClaw tiene tres suites de Vitest (unitaria/integración, e2e, en vivo) y un pequeño conjunto de ejecutores de Docker.

Este documento es una guía de “cómo probamos”:

- Qué cubre cada suite (y qué deliberadamente _no_ cubre)
- Qué comandos ejecutar para flujos de trabajo comunes (local, antes de hacer push, depuración)
- Cómo las pruebas en vivo descubren credenciales y seleccionan modelos/proveedores
- Cómo agregar regresiones para problemas reales de modelos/proveedores

## Inicio rápido

La mayoría de los días:

- Puerta completa (esperada antes de hacer push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Ejecución local más rápida de la suite completa en una máquina holgada: `pnpm test:max`
- Bucle directo de vigilancia de Vitest: `pnpm test:watch`
- El direccionamiento directo por archivo ahora también enruta rutas de extensiones/canales: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefiere primero ejecuciones dirigidas cuando estés iterando sobre un único fallo.
- Sitio de QA respaldado por Docker: `pnpm qa:lab:up`
- Carril de QA respaldado por VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Cuando tocas pruebas o quieres mayor confianza:

- Puerta de cobertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Al depurar proveedores/modelos reales (requiere credenciales reales):

- Suite en vivo (modelos + sondeos de herramientas/imágenes de gateway): `pnpm test:live`
- Apuntar silenciosamente a un solo archivo en vivo: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Prueba rápida de costo Moonshot/Kimi: con `MOONSHOT_API_KEY` establecido, ejecuta
  `openclaw models list --provider moonshot --json`, luego ejecuta un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  aislado contra `moonshot/kimi-k2.6`. Verifica que el JSON informe Moonshot/K2.6 y que la
  transcripción del asistente almacene `usage.cost` normalizado.

Consejo: cuando solo necesitas un caso fallido, prefiere reducir las pruebas en vivo mediante las variables de entorno de lista de permitidos descritas abajo.

## Ejecutores específicos de QA

Estos comandos viven junto a las suites de prueba principales cuando necesitas realismo de qa-lab:

- `pnpm openclaw qa suite`
  - Ejecuta escenarios de QA respaldados por el repositorio directamente en el host.
  - Ejecuta múltiples escenarios seleccionados en paralelo de forma predeterminada con workers de
    gateway aislados. `qa-channel` usa por defecto concurrencia 4 (limitada por la
    cantidad de escenarios seleccionados). Usa `--concurrency <count>` para ajustar la
    cantidad de workers, o `--concurrency 1` para el carril serial anterior.
  - Sale con código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
    quieras artefactos sin un código de salida fallido.
  - Admite modos de proveedor `live-frontier`, `mock-openai` y `aimock`.
    `aimock` inicia un servidor local de proveedor respaldado por AIMock para cobertura experimental
    de fixtures y simulación de protocolos sin reemplazar el carril `mock-openai`
    orientado a escenarios.
- `pnpm openclaw qa suite --runner multipass`
  - Ejecuta la misma suite de QA dentro de una VM Linux Multipass desechable.
  - Mantiene el mismo comportamiento de selección de escenarios que `qa suite` en el host.
  - Reutiliza las mismas opciones de selección de proveedor/modelo que `qa suite`.
  - Las ejecuciones en vivo reenvían las entradas de autenticación de QA compatibles que son prácticas para el guest:
    claves de proveedor basadas en entorno, la ruta de configuración del proveedor en vivo de QA, y `CODEX_HOME`
    cuando está presente.
  - Los directorios de salida deben permanecer bajo la raíz del repositorio para que el guest pueda escribir de vuelta a través
    del espacio de trabajo montado.
  - Escribe el informe y resumen normales de QA más los registros de Multipass bajo
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia el sitio de QA respaldado por Docker para trabajo de QA estilo operador.
- `pnpm openclaw qa aimock`
  - Inicia solo el servidor local del proveedor AIMock para pruebas rápidas directas
    del protocolo.
- `pnpm openclaw qa matrix`
  - Ejecuta el carril de QA en vivo de Matrix contra un homeserver Tuwunel desechable respaldado por Docker.
  - Este host de QA hoy es solo para repo/desarrollo. Las instalaciones empaquetadas de OpenClaw no incluyen
    `qa-lab`, por lo que no exponen `openclaw qa`.
  - Los checkouts del repositorio cargan el ejecutor incluido directamente; no se necesita un paso separado
    de instalación del plugin.
  - Aprovisiona tres usuarios temporales de Matrix (`driver`, `sut`, `observer`) más una sala privada, y luego inicia un gateway hijo de QA con el plugin real de Matrix como transporte SUT.
  - Usa de forma predeterminada la imagen estable fijada de Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Sobrescríbela con `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` cuando necesites probar una imagen diferente.
  - Matrix no expone opciones compartidas de origen de credenciales porque el carril aprovisiona usuarios desechables localmente.
  - Escribe un informe de QA de Matrix, resumen, artefacto de eventos observados y registro combinado de stdout/stderr bajo `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Ejecuta el carril de QA en vivo de Telegram contra un grupo privado real usando los tokens del bot driver y del bot SUT desde el entorno.
  - Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. El id del grupo debe ser el id numérico del chat de Telegram.
  - Admite `--credential-source convex` para credenciales compartidas agrupadas. Usa el modo de entorno por defecto, o establece `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por concesiones agrupadas.
  - Sale con código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
    quieras artefactos sin un código de salida fallido.
  - Requiere dos bots distintos en el mismo grupo privado, con el bot SUT exponiendo un nombre de usuario de Telegram.
  - Para una observación estable entre bots, habilita Bot-to-Bot Communication Mode en `@BotFather` para ambos bots y asegúrate de que el bot driver pueda observar el tráfico de bots del grupo.
  - Escribe un informe de QA de Telegram, resumen y artefacto de mensajes observados bajo `.artifacts/qa-e2e/...`.

Los carriles de transporte en vivo comparten un contrato estándar para que los nuevos transportes no se desvíen:

`qa-channel` sigue siendo la amplia suite sintética de QA y no forma parte de la matriz de cobertura de transporte en vivo.

| Carril   | Canary | Filtro por mención | Bloqueo por lista de permitidos | Respuesta de nivel superior | Reanudación tras reinicio | Seguimiento de hilo | Aislamiento de hilo | Observación de reacciones | Comando de ayuda |
| -------- | ------ | ------------------ | ------------------------------- | --------------------------- | ------------------------- | ------------------- | ------------------- | ------------------------- | ---------------- |
| Matrix   | x      | x                  | x                               | x                           | x                         | x                   | x                   | x                         |                  |
| Telegram | x      |                    |                                 |                             |                           |                     |                     |                           | x                |

### Credenciales compartidas de Telegram mediante Convex (v1)

Cuando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
`openclaw qa telegram`, QA lab adquiere una concesión exclusiva de un grupo respaldado por Convex, mantiene
esa concesión con Heartbeat mientras el carril está en ejecución y libera la concesión al apagarse.

Andamiaje de referencia del proyecto Convex:

- `qa/convex-credential-broker/`

Variables de entorno requeridas:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por ejemplo `https://your-deployment.convex.site`)
- Un secreto para el rol seleccionado:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Selección del rol de credencial:
  - CLI: `--credential-role maintainer|ci`
  - Predeterminado por entorno: `OPENCLAW_QA_CREDENTIAL_ROLE` (usa `ci` por defecto en CI, `maintainer` en caso contrario)

Variables de entorno opcionales:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predeterminado `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predeterminado `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predeterminado `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predeterminado `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predeterminado `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de rastreo opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs Convex `http://` de loopback para desarrollo solo local.

`OPENCLAW_QA_CONVEX_SITE_URL` debe usar `https://` en funcionamiento normal.

Los comandos administrativos de mantenimiento (agregar/eliminar/listar del grupo) requieren
específicamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Ayudantes de CLI para mantenimiento:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `--json` para salida legible por máquina en scripts y utilidades de CI.

Contrato predeterminado del endpoint (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Solicitud: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Éxito: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Agotado/reintentable: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Solicitud: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Éxito: `{ status: "ok" }` (o `2xx` vacío)
- `POST /release`
  - Solicitud: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Éxito: `{ status: "ok" }` (o `2xx` vacío)
- `POST /admin/add` (solo secreto de maintainer)
  - Solicitud: `{ kind, actorId, payload, note?, status? }`
  - Éxito: `{ status: "ok", credential }`
- `POST /admin/remove` (solo secreto de maintainer)
  - Solicitud: `{ credentialId, actorId }`
  - Éxito: `{ status: "ok", changed, credential }`
  - Protección de concesión activa: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo secreto de maintainer)
  - Solicitud: `{ kind?, status?, includePayload?, limit? }`
  - Éxito: `{ status: "ok", credentials, count }`

Forma de la carga útil para el tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` debe ser una cadena de id numérico de chat de Telegram.
- `admin/add` valida esta forma para `kind: "telegram"` y rechaza cargas útiles mal formadas.

### Agregar un canal a QA

Agregar un canal al sistema de QA en Markdown requiere exactamente dos cosas:

1. Un adaptador de transporte para el canal.
2. Un paquete de escenarios que ejercite el contrato del canal.

No agregues una nueva raíz de comando de QA de nivel superior cuando el host compartido `qa-lab` pueda
ser dueño del flujo.

`qa-lab` es dueño de la mecánica compartida del host:

- la raíz del comando `openclaw qa`
- el arranque y desmontaje de la suite
- la concurrencia de workers
- la escritura de artefactos
- la generación de informes
- la ejecución de escenarios
- alias de compatibilidad para escenarios antiguos de `qa-channel`

Los plugins de ejecutores son dueños del contrato de transporte:

- cómo se monta `openclaw qa <runner>` bajo la raíz compartida `qa`
- cómo se configura el gateway para ese transporte
- cómo se comprueba la preparación
- cómo se inyectan eventos entrantes
- cómo se observan los mensajes salientes
- cómo se exponen las transcripciones y el estado de transporte normalizado
- cómo se ejecutan las acciones respaldadas por transporte
- cómo se gestiona el restablecimiento o limpieza específicos del transporte

La barra mínima de adopción para un canal nuevo es:

1. Mantener `qa-lab` como dueño de la raíz compartida `qa`.
2. Implementar el ejecutor de transporte sobre la costura compartida del host `qa-lab`.
3. Mantener la mecánica específica del transporte dentro del plugin del ejecutor o del arnés del canal.
4. Montar el ejecutor como `openclaw qa <runner>` en lugar de registrar una raíz de comando competidora.
   Los plugins de ejecutores deben declarar `qaRunners` en `openclaw.plugin.json` y exportar un arreglo coincidente `qaRunnerCliRegistrations` desde `runtime-api.ts`.
   Mantén `runtime-api.ts` liviano; la ejecución diferida de CLI y del ejecutor debe permanecer detrás de puntos de entrada separados.
5. Crear o adaptar escenarios en Markdown bajo los directorios temáticos de `qa/scenarios/`.
6. Usar los ayudantes genéricos de escenarios para los escenarios nuevos.
7. Mantener funcionando los alias de compatibilidad existentes, a menos que el repositorio esté haciendo una migración intencional.

La regla de decisión es estricta:

- Si un comportamiento puede expresarse una vez en `qa-lab`, colócalo en `qa-lab`.
- Si un comportamiento depende de un solo transporte de canal, mantenlo en ese plugin de ejecutor o arnés del plugin.
- Si un escenario necesita una nueva capacidad que más de un canal pueda usar, agrega un ayudante genérico en lugar de una rama específica de canal en `suite.ts`.
- Si un comportamiento solo tiene sentido para un transporte, mantén el escenario específico de ese transporte y deja eso explícito en el contrato del escenario.

Los nombres preferidos de ayudantes genéricos para escenarios nuevos son:

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

Los alias de compatibilidad siguen disponibles para los escenarios existentes, incluidos:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

El trabajo en canales nuevos debe usar los nombres genéricos de los helpers.
Los alias de compatibilidad existen para evitar una migración de tipo flag day, no como modelo para
la creación de escenarios nuevos.

## Suites de prueba (qué se ejecuta y dónde)

Piensa en las suites como “realismo creciente” (y también creciente fragilidad/costo):

### Unitaria / integración (predeterminada)

- Comando: `pnpm test`
- Configuración: diez ejecuciones secuenciales por fragmentos (`vitest.full-*.config.ts`) sobre los proyectos Vitest acotados existentes
- Archivos: inventarios core/unit bajo `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts`, y las pruebas Node permitidas de `ui` cubiertas por `vitest.unit.config.ts`
- Alcance:
  - Pruebas unitarias puras
  - Pruebas de integración en proceso (autenticación de gateway, enrutamiento, herramientas, análisis, configuración)
  - Regresiones deterministas para errores conocidos
- Expectativas:
  - Se ejecuta en CI
  - No requiere claves reales
  - Debe ser rápida y estable
- Nota sobre proyectos:
  - `pnpm test` sin objetivos ahora ejecuta once configuraciones de fragmentos más pequeñas (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) en lugar de un proceso gigante del proyecto raíz nativo. Esto reduce el RSS máximo en máquinas cargadas y evita que el trabajo de auto-reply/extensiones deje sin recursos a suites no relacionadas.
  - `pnpm test --watch` sigue usando el grafo nativo de proyectos raíz `vitest.config.ts`, porque un bucle de vigilancia multishard no es práctico.
  - `pnpm test`, `pnpm test:watch` y `pnpm test:perf:imports` enrutan primero objetivos explícitos de archivo/directorio a través de carriles acotados, por lo que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar el costo completo de arranque del proyecto raíz.
  - `pnpm test:changed` expande rutas git modificadas a los mismos carriles acotados cuando el diff solo toca archivos fuente/de prueba enrutable; las ediciones de configuración/setup siguen recurriendo a la reejecución amplia del proyecto raíz.
  - `pnpm check:changed` es la puerta local inteligente normal para trabajo acotado. Clasifica el diff en core, pruebas core, extensiones, pruebas de extensiones, apps, docs y tooling, y luego ejecuta los carriles coincidentes de typecheck/lint/prueba. Los cambios en SDK público de Plugin y contratos de plugins incluyen validación de extensiones porque las extensiones dependen de esos contratos core.
  - Las pruebas unitarias ligeras en importación de agentes, comandos, plugins, helpers de auto-reply, `plugin-sdk` y áreas utilitarias puras similares se enrutan por el carril `unit-fast`, que omite `test/setup-openclaw-runtime.ts`; los archivos con estado o más pesados en tiempo de ejecución permanecen en los carriles existentes.
  - Algunos archivos fuente helper seleccionados de `plugin-sdk` y `commands` también asignan ejecuciones en modo changed a pruebas hermanas explícitas en esos carriles ligeros, para que las ediciones de helpers eviten reejecutar la suite pesada completa de ese directorio.
  - `auto-reply` ahora tiene tres bloques dedicados: helpers core de nivel superior, pruebas de integración `reply.*` de nivel superior y el subárbol `src/auto-reply/reply/**`. Esto mantiene el trabajo más pesado del arnés de respuestas fuera de las pruebas baratas de estado/chunk/token.
- Nota sobre el ejecutor integrado:
  - Cuando cambies entradas de descubrimiento de herramientas de mensajes o el contexto de tiempo de ejecución de Compaction,
    mantén ambos niveles de cobertura.
  - Agrega regresiones enfocadas en helpers para límites puros de enrutamiento/normalización.
  - Mantén también sanas las suites de integración del ejecutor integrado:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, y
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Esas suites verifican que los ids acotados y el comportamiento de Compaction sigan fluyendo
    por las rutas reales `run.ts` / `compact.ts`; las pruebas solo de helpers no son un
    sustituto suficiente para esas rutas de integración.
- Nota sobre el pool:
  - La configuración base de Vitest ahora usa `threads` por defecto.
  - La configuración compartida de Vitest también fija `isolate: false` y usa el ejecutor no aislado en los proyectos raíz, las configuraciones e2e y las configuraciones en vivo.
  - El carril raíz de UI mantiene su configuración `jsdom` y optimizador, pero ahora también se ejecuta en el ejecutor compartido no aislado.
  - Cada fragmento de `pnpm test` hereda los mismos valores predeterminados `threads` + `isolate: false` de la configuración compartida de Vitest.
  - El lanzador compartido `scripts/run-vitest.mjs` ahora también agrega `--no-maglev` por defecto para procesos Node hijo de Vitest para reducir el churn de compilación de V8 durante grandes ejecuciones locales. Establece `OPENCLAW_VITEST_ENABLE_MAGLEV=1` si necesitas comparar con el comportamiento estándar de V8.
- Nota sobre iteración local rápida:
  - `pnpm changed:lanes` muestra qué carriles arquitectónicos activa un diff.
  - El hook pre-commit ejecuta `pnpm check:changed --staged` después del formateo/lint del staging, por lo que los commits solo de core no pagan el costo de pruebas de extensiones salvo que toquen contratos públicos orientados a extensiones.
  - `pnpm test:changed` enruta por carriles acotados cuando las rutas modificadas se asignan limpiamente a una suite más pequeña.
  - `pnpm test:max` y `pnpm test:changed:max` mantienen el mismo comportamiento de enrutamiento, solo con un límite mayor de workers.
  - El autoescalado local de workers ahora es intencionadamente conservador y también retrocede cuando la carga promedio del host ya es alta, por lo que múltiples ejecuciones concurrentes de Vitest causan menos daño por defecto.
  - La configuración base de Vitest marca los archivos de proyectos/configuración como `forceRerunTriggers` para que las reejecuciones en modo changed sigan siendo correctas cuando cambia el cableado de pruebas.
  - La configuración mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado en hosts compatibles; establece `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si quieres una ubicación explícita de caché para perfilado directo.
- Nota de depuración de rendimiento:
  - `pnpm test:perf:imports` habilita informes de duración de importación de Vitest más salida de desglose de importaciones.
  - `pnpm test:perf:imports:changed` acota esa misma vista de perfilado a los archivos modificados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compara `test:changed` enrutado contra la ruta nativa del proyecto raíz para ese diff confirmado e imprime tiempo total más RSS máximo en macOS.
- `pnpm test:perf:changed:bench -- --worktree` hace benchmark del árbol sucio actual enrutando la lista de archivos modificados a través de `scripts/test-projects.mjs` y la configuración raíz de Vitest.
  - `pnpm test:perf:profile:main` escribe un perfil de CPU del hilo principal para el arranque de Vitest/Vite y la sobrecarga de transformación.
  - `pnpm test:perf:profile:runner` escribe perfiles de CPU+heap del ejecutor para la suite unitaria con el paralelismo por archivo deshabilitado.

### E2E (prueba rápida de gateway)

- Comando: `pnpm test:e2e`
- Configuración: `vitest.e2e.config.ts`
- Archivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Valores predeterminados del tiempo de ejecución:
  - Usa `threads` de Vitest con `isolate: false`, igual que el resto del repositorio.
  - Usa workers adaptativos (CI: hasta 2, local: 1 por defecto).
  - Se ejecuta en modo silencioso por defecto para reducir la sobrecarga de I/O de consola.
- Sobrescrituras útiles:
  - `OPENCLAW_E2E_WORKERS=<n>` para forzar la cantidad de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para volver a habilitar la salida detallada de consola.
- Alcance:
  - Comportamiento end-to-end de gateway con múltiples instancias
  - Superficies WebSocket/HTTP, emparejamiento de nodos y redes más pesadas
- Expectativas:
  - Se ejecuta en CI (cuando está habilitado en el pipeline)
  - No requiere claves reales
  - Tiene más piezas móviles que las pruebas unitarias (puede ser más lenta)

### E2E: prueba rápida del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Archivo: `test/openshell-sandbox.e2e.test.ts`
- Alcance:
  - Inicia un gateway OpenShell aislado en el host mediante Docker
  - Crea un sandbox a partir de un Dockerfile local temporal
  - Ejercita el backend OpenShell de OpenClaw sobre `sandbox ssh-config` + ejecución SSH reales
  - Verifica el comportamiento del sistema de archivos canónico remoto mediante el puente fs del sandbox
- Expectativas:
  - Solo opt-in; no forma parte de la ejecución predeterminada `pnpm test:e2e`
  - Requiere una CLI local `openshell` y un daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` aislados y luego destruye el gateway y sandbox de prueba
- Sobrescrituras útiles:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar la prueba al ejecutar manualmente la suite e2e más amplia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apuntar a un binario CLI no predeterminado o a un script wrapper

### En vivo (proveedores reales + modelos reales)

- Comando: `pnpm test:live`
- Configuración: `vitest.live.config.ts`
- Archivos: `src/**/*.live.test.ts`
- Predeterminado: **habilitado** por `pnpm test:live` (establece `OPENCLAW_LIVE_TEST=1`)
- Alcance:
  - “¿Este proveedor/modelo realmente funciona _hoy_ con credenciales reales?”
  - Detectar cambios de formato del proveedor, peculiaridades de uso de herramientas, problemas de autenticación y comportamiento de límites de tasa
- Expectativas:
  - No es estable en CI por diseño (redes reales, políticas reales del proveedor, cuotas, caídas)
  - Cuesta dinero / usa límites de tasa
  - Es preferible ejecutar subconjuntos acotados en lugar de “todo”
- Las ejecuciones en vivo obtienen `~/.profile` para recoger claves de API faltantes.
- Por defecto, las ejecuciones en vivo siguen aislando `HOME` y copian material de config/auth a un home temporal de prueba para que los fixtures unitarios no puedan mutar tu `~/.openclaw` real.
- Establece `OPENCLAW_LIVE_USE_REAL_HOME=1` solo cuando necesites intencionalmente que las pruebas en vivo usen tu directorio home real.
- `pnpm test:live` ahora usa por defecto un modo más silencioso: mantiene la salida de progreso `[live] ...`, pero suprime el aviso extra de `~/.profile` y silencia los registros de arranque del gateway y el ruido Bonjour. Establece `OPENCLAW_LIVE_TEST_QUIET=0` si quieres recuperar los registros completos de inicio.
- Rotación de claves de API (específica del proveedor): establece `*_API_KEYS` con formato de comas/punto y coma o `*_API_KEY_1`, `*_API_KEY_2` (por ejemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) o la sobrescritura por vivo `OPENCLAW_LIVE_*_KEY`; las pruebas reintentan ante respuestas de límite de tasa.
- Salida de progreso/Heartbeat:
  - Las suites en vivo ahora emiten líneas de progreso a stderr para que las llamadas largas al proveedor se vean activas incluso cuando la captura de consola de Vitest está en modo silencioso.
  - `vitest.live.config.ts` deshabilita la interceptación de consola de Vitest para que las líneas de progreso del proveedor/gateway se transmitan inmediatamente durante las ejecuciones en vivo.
  - Ajusta los Heartbeat de modelo directo con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajusta los Heartbeat de gateway/sondeo con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## ¿Qué suite debo ejecutar?

Usa esta tabla de decisión:

- Editar lógica/pruebas: ejecuta `pnpm test` (y `pnpm test:coverage` si cambiaste mucho)
- Tocar redes de gateway / protocolo WS / emparejamiento: agrega `pnpm test:e2e`
- Depurar “mi bot está caído” / fallos específicos del proveedor / llamadas de herramientas: ejecuta un `pnpm test:live` acotado

## En vivo: barrido de capacidades de nodos Android

- Prueba: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **cada comando anunciado actualmente** por un nodo Android conectado y afirmar el comportamiento del contrato del comando.
- Alcance:
  - Configuración previa/manual (la suite no instala/ejecuta/empareja la app).
  - Validación `node.invoke` del gateway comando por comando para el nodo Android seleccionado.
- Configuración previa requerida:
  - App Android ya conectada + emparejada con el gateway.
  - App mantenida en primer plano.
  - Permisos/consentimiento de captura concedidos para las capacidades que esperas que pasen.
- Sobrescrituras opcionales de destino:
  - `OPENCLAW_ANDROID_NODE_ID` o `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalles completos de configuración de Android: [App Android](/es/platforms/android)

## En vivo: prueba rápida de modelos (claves de perfil)

Las pruebas en vivo se dividen en dos capas para poder aislar fallos:

- “Modelo directo” nos dice si el proveedor/modelo puede responder en absoluto con la clave dada.
- “Prueba rápida de gateway” nos dice si funciona el pipeline completo de gateway+agente para ese modelo (sesiones, historial, herramientas, política de sandbox, etc.).

### Capa 1: finalización directa del modelo (sin gateway)

- Prueba: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar los modelos descubiertos
  - Usar `getApiKeyForModel` para seleccionar modelos para los que tienes credenciales
  - Ejecutar una pequeña finalización por modelo (y regresiones dirigidas cuando sea necesario)
- Cómo habilitarla:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
- Establece `OPENCLAW_LIVE_MODELS=modern` (o `all`, alias de modern) para ejecutar realmente esta suite; de lo contrario se omite para mantener `pnpm test:live` enfocado en la prueba rápida de gateway
- Cómo seleccionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` para ejecutar la lista de permitidos moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` es un alias de la lista de permitidos moderna
  - o `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (lista de permitidos separada por comas)
  - Los barridos modern/all usan por defecto un límite curado de alta señal; establece `OPENCLAW_LIVE_MAX_MODELS=0` para un barrido moderno exhaustivo o un número positivo para un límite menor.
- Cómo seleccionar proveedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (lista de permitidos separada por comas)
- De dónde vienen las claves:
  - Por defecto: almacén de perfiles y respaldos del entorno
  - Establece `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar **solo el almacén de perfiles**
- Por qué existe esto:
  - Separa “la API del proveedor está rota / la clave no es válida” de “el pipeline de agente de gateway está roto”
  - Contiene regresiones pequeñas y aisladas (ejemplo: flujos de replay de razonamiento de OpenAI Responses/Codex Responses + llamadas de herramientas)

### Capa 2: prueba rápida de Gateway + agente dev (lo que realmente hace "@openclaw")

- Prueba: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Levantar un gateway en proceso
  - Crear/parchear una sesión `agent:dev:*` (sobrescritura de modelo por ejecución)
  - Iterar modelos-con-claves y afirmar:
    - respuesta “significativa” (sin herramientas)
    - que funciona una invocación real de herramienta (sondeo de lectura)
    - sondeos opcionales de herramientas adicionales (sondeo exec+read)
    - que las rutas de regresión de OpenAI (solo llamada de herramienta → seguimiento) sigan funcionando
- Detalles de los sondeos (para que puedas explicar fallos rápidamente):
  - Sondeo `read`: la prueba escribe un archivo nonce en el espacio de trabajo y le pide al agente que lo `read` y devuelva el nonce.
  - Sondeo `exec+read`: la prueba le pide al agente que escriba con `exec` un nonce en un archivo temporal y luego lo vuelva a `read`.
  - Sondeo de imagen: la prueba adjunta un PNG generado (gato + código aleatorizado) y espera que el modelo devuelva `cat <CODE>`.
  - Referencia de implementación: `src/gateway/gateway-models.profiles.live.test.ts` y `src/gateway/live-image-probe.ts`.
- Cómo habilitarla:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
- Cómo seleccionar modelos:
  - Predeterminado: lista de permitidos moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` es un alias de la lista de permitidos moderna
  - O establece `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (o lista separada por comas) para acotar
  - Los barridos de gateway modern/all usan por defecto un límite curado de alta señal; establece `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para un barrido moderno exhaustivo o un número positivo para un límite menor.
- Cómo seleccionar proveedores (evitar “todo OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (lista de permitidos separada por comas)
- Los sondeos de herramienta + imagen siempre están activados en esta prueba en vivo:
  - sondeo `read` + sondeo `exec+read` (estrés de herramientas)
  - el sondeo de imagen se ejecuta cuando el modelo anuncia compatibilidad con entrada de imagen
  - Flujo (alto nivel):
    - La prueba genera un PNG pequeño con “CAT” + código aleatorio (`src/gateway/live-image-probe.ts`)
    - Lo envía mediante `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway analiza los adjuntos en `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - El agente integrado reenvía un mensaje de usuario multimodal al modelo
    - Afirmación: la respuesta contiene `cat` + el código (tolerancia OCR: se permiten errores menores)

Consejo: para ver qué puedes probar en tu máquina (y los ids exactos `provider/model`), ejecuta:

```bash
openclaw models list
openclaw models list --json
```

## En vivo: prueba rápida del backend de CLI (Claude, Codex, Gemini u otras CLI locales)

- Prueba: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar el pipeline de Gateway + agente usando un backend local de CLI, sin tocar tu configuración predeterminada.
- Los valores predeterminados de prueba rápida específicos del backend viven con la definición `cli-backend.ts` de la extensión propietaria.
- Habilitar:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Predeterminados:
  - Proveedor/modelo predeterminado: `claude-cli/claude-sonnet-4-6`
  - El comportamiento de command/args/image proviene de los metadatos del plugin propietario del backend de CLI.
- Sobrescrituras (opcionales):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar un adjunto de imagen real (las rutas se inyectan en el prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para pasar rutas de archivos de imagen como argumentos de CLI en lugar de inyección en el prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (o `"list"`) para controlar cómo se pasan los argumentos de imagen cuando `IMAGE_ARG` está establecido.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar un segundo turno y validar el flujo de reanudación.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` para deshabilitar el sondeo predeterminado de continuidad en la misma sesión Claude Sonnet -> Opus (establece `1` para forzarlo cuando el modelo seleccionado admite un objetivo de cambio).

Ejemplo:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Receta Docker:

```bash
pnpm test:docker:live-cli-backend
```

Recetas Docker de un solo proveedor:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Notas:

- El ejecutor de Docker vive en `scripts/test-live-cli-backend-docker.sh`.
- Ejecuta la prueba rápida en vivo del backend de CLI dentro de la imagen Docker del repositorio como el usuario no root `node`.
- Resuelve metadatos de la prueba rápida de CLI desde la extensión propietaria, luego instala el paquete Linux CLI coincidente (`@anthropic-ai/claude-code`, `@openai/codex`, o `@google/gemini-cli`) en un prefijo escribible en caché en `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (predeterminado: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` requiere OAuth portátil de suscripción de Claude Code mediante `~/.claude/.credentials.json` con `claudeAiOauth.subscriptionType` o `CLAUDE_CODE_OAUTH_TOKEN` desde `claude setup-token`. Primero demuestra `claude -p` directo en Docker, luego ejecuta dos turnos del backend de CLI de Gateway sin preservar variables de entorno de clave de API de Anthropic. Este carril de suscripción deshabilita por defecto los sondeos MCP/tool e imagen de Claude porque Claude actualmente enruta el uso de apps de terceros mediante facturación por uso adicional en lugar de los límites normales del plan de suscripción.
- La prueba rápida en vivo del backend de CLI ahora ejercita el mismo flujo end-to-end para Claude, Codex y Gemini: turno de texto, turno de clasificación de imagen y luego llamada de herramienta MCP `cron` verificada mediante la CLI del gateway.
- La prueba rápida predeterminada de Claude también parchea la sesión de Sonnet a Opus y verifica que la sesión reanudada aún recuerde una nota anterior.

## En vivo: prueba rápida de enlace ACP (`/acp spawn ... --bind here`)

- Prueba: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar el flujo real de enlace de conversación ACP con un agente ACP en vivo:
  - enviar `/acp spawn <agent> --bind here`
  - vincular en el lugar una conversación sintética de canal de mensajes
  - enviar un seguimiento normal en esa misma conversación
  - verificar que el seguimiento llegue a la transcripción de la sesión ACP vinculada
- Habilitar:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Predeterminados:
  - Agentes ACP en Docker: `claude,codex,gemini`
  - Agente ACP para `pnpm test:live ...` directo: `claude`
  - Canal sintético: contexto de conversación estilo DM de Slack
  - Backend ACP: `acpx`
- Sobrescrituras:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Notas:
  - Este carril usa la superficie `chat.send` del gateway con campos sintéticos de ruta de origen solo para administradores, para que las pruebas puedan adjuntar contexto de canal de mensajes sin fingir entrega externa.
  - Cuando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` no está establecido, la prueba usa el registro integrado de agentes del plugin `acpx` embebido para el agente de arnés ACP seleccionado.

Ejemplo:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Receta Docker:

```bash
pnpm test:docker:live-acp-bind
```

Recetas Docker de agente único:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Notas de Docker:

- El ejecutor de Docker vive en `scripts/test-live-acp-bind-docker.sh`.
- Por defecto, ejecuta la prueba rápida de enlace ACP contra todos los agentes CLI en vivo compatibles en secuencia: `claude`, `codex`, luego `gemini`.
- Usa `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` o `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` para acotar la matriz.
- Obtiene `~/.profile`, prepara el material de autenticación CLI coincidente dentro del contenedor, instala `acpx` en un prefijo npm escribible y luego instala la CLI en vivo solicitada (`@anthropic-ai/claude-code`, `@openai/codex`, o `@google/gemini-cli`) si falta.
- Dentro de Docker, el ejecutor establece `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` para que acpx mantenga disponibles para la CLI hija del arnés las variables de entorno del proveedor obtenidas del profile.

## En vivo: prueba rápida del arnés app-server de Codex

- Objetivo: validar el arnés de Codex propiedad del plugin mediante el método
  normal `agent` del gateway:
  - cargar el plugin incluido `codex`
  - seleccionar `OPENCLAW_AGENT_RUNTIME=codex`
  - enviar un primer turno de agente de gateway a `codex/gpt-5.4`
  - enviar un segundo turno a la misma sesión de OpenClaw y verificar que el hilo
    app-server pueda reanudarse
  - ejecutar `/codex status` y `/codex models` mediante la misma ruta de comando
    del gateway
- Prueba: `src/gateway/gateway-codex-harness.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modelo predeterminado: `codex/gpt-5.4`
- Sondeo de imagen opcional: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sondeo MCP/tool opcional: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- La prueba rápida establece `OPENCLAW_AGENT_HARNESS_FALLBACK=none` para que un arnés
  Codex roto no pueda pasar recurriendo silenciosamente a PI.
- Autenticación: `OPENAI_API_KEY` desde el shell/profile, más copia opcional de
  `~/.codex/auth.json` y `~/.codex/config.toml`

Receta local:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Receta Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Notas de Docker:

- El ejecutor de Docker vive en `scripts/test-live-codex-harness-docker.sh`.
- Obtiene el `~/.profile` montado, pasa `OPENAI_API_KEY`, copia archivos de autenticación de la CLI de Codex
  cuando están presentes, instala `@openai/codex` en un prefijo npm montado y escribible,
  prepara el árbol fuente y luego ejecuta solo la prueba en vivo del arnés de Codex.
- Docker habilita por defecto los sondeos de imagen y MCP/tool. Establece
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` o
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` cuando necesites una ejecución de depuración más acotada.
- Docker también exporta `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, igual que la configuración
  de la prueba en vivo, para que el respaldo `openai-codex/*` o PI no pueda ocultar una
  regresión del arnés de Codex.

### Recetas recomendadas para pruebas en vivo

Las listas de permitidos acotadas y explícitas son las más rápidas y las menos frágiles:

- Un solo modelo, directo (sin gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Un solo modelo, prueba rápida de gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Llamada de herramientas en varios proveedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Enfoque en Google (clave API de Gemini + Antigravity):
  - Gemini (clave API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Notas:

- `google/...` usa la API de Gemini (clave API).
- `google-antigravity/...` usa el puente OAuth de Antigravity (endpoint de agente estilo Cloud Code Assist).
- `google-gemini-cli/...` usa la CLI local de Gemini en tu máquina (autenticación separada + peculiaridades de herramientas).
- API de Gemini frente a CLI de Gemini:
  - API: OpenClaw llama a la API alojada de Gemini de Google por HTTP (autenticación con clave API / perfil); esto es lo que la mayoría de los usuarios quiere decir con “Gemini”.
  - CLI: OpenClaw ejecuta una binaria local `gemini`; tiene su propia autenticación y puede comportarse de forma diferente (streaming/compatibilidad con herramientas/desfase de versión).

## En vivo: matriz de modelos (qué cubrimos)

No hay una “lista fija de modelos de CI” (en vivo es opt-in), pero estos son los modelos **recomendados** para cubrir regularmente en una máquina de desarrollo con claves.

### Conjunto moderno de pruebas rápidas (llamada de herramientas + imagen)

Esta es la ejecución de “modelos comunes” que esperamos mantener funcional:

- OpenAI (no Codex): `openai/gpt-5.4` (opcional: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (o `anthropic/claude-sonnet-4-6`)
- Google (API de Gemini): `google/gemini-3.1-pro-preview` y `google/gemini-3-flash-preview` (evita modelos Gemini 2.x antiguos)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` y `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Ejecuta la prueba rápida de gateway con herramientas + imagen:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Línea base: llamada de herramientas (Read + Exec opcional)

Elige al menos uno por familia de proveedor:

- OpenAI: `openai/gpt-5.4` (o `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (o `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (o `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Cobertura adicional opcional (deseable):

- xAI: `xai/grok-4` (o la última disponible)
- Mistral: `mistral/`… (elige un modelo con capacidad de “tools” que tengas habilitado)
- Cerebras: `cerebras/`… (si tienes acceso)
- LM Studio: `lmstudio/`… (local; la llamada de herramientas depende del modo API)

### Visión: envío de imagen (adjunto → mensaje multimodal)

Incluye al menos un modelo con capacidad de imagen en `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/variantes de OpenAI con capacidad de visión, etc.) para ejercitar el sondeo de imagen.

### Agregadores / gateways alternativos

Si tienes claves habilitadas, también admitimos pruebas mediante:

- OpenRouter: `openrouter/...` (cientos de modelos; usa `openclaw models scan` para encontrar candidatos con capacidad de herramientas+imagen)
- OpenCode: `opencode/...` para Zen y `opencode-go/...` para Go (autenticación mediante `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Más proveedores que puedes incluir en la matriz en vivo (si tienes credenciales/configuración):

- Integrados: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Mediante `models.providers` (endpoints personalizados): `minimax` (nube/API), además de cualquier proxy compatible con OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, etc.)

Consejo: no intentes codificar “todos los modelos” en la documentación. La lista autorizada es lo que devuelva `discoverModels(...)` en tu máquina + las claves que estén disponibles.

## Credenciales (nunca las confirmes)

Las pruebas en vivo descubren credenciales de la misma manera que la CLI. Implicaciones prácticas:

- Si la CLI funciona, las pruebas en vivo deberían encontrar las mismas claves.
- Si una prueba en vivo dice “sin credenciales”, depúralo de la misma manera que depurarías `openclaw models list` / la selección de modelos.

- Perfiles de autenticación por agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (a esto se refieren las “claves de perfil” en las pruebas en vivo)
- Configuración: `~/.openclaw/openclaw.json` (o `OPENCLAW_CONFIG_PATH`)
- Directorio de estado heredado: `~/.openclaw/credentials/` (se copia al home preparado para pruebas en vivo cuando está presente, pero no al almacén principal de claves de perfil)
- Las ejecuciones locales en vivo copian por defecto al home temporal de prueba la configuración activa, los archivos `auth-profiles.json` por agente, `credentials/` heredado y los directorios de autenticación CLI externos compatibles; los homes preparados para pruebas en vivo omiten `workspace/` y `sandboxes/`, y se eliminan las sobrescrituras de ruta `agents.*.workspace` / `agentDir` para que los sondeos no toquen tu espacio de trabajo real del host.

Si quieres depender de claves del entorno (por ejemplo, exportadas en tu `~/.profile`), ejecuta las pruebas locales después de `source ~/.profile`, o usa los ejecutores de Docker de abajo (pueden montar `~/.profile` en el contenedor).

## Deepgram en vivo (transcripción de audio)

- Prueba: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Habilitar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Plan de codificación BytePlus en vivo

- Prueba: `src/agents/byteplus.live.test.ts`
- Habilitar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Sobrescritura opcional de modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Multimedia del flujo de trabajo ComfyUI en vivo

- Prueba: `extensions/comfy/comfy.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Alcance:
  - Ejercita las rutas incluidas de imagen, video y `music_generate` de comfy
  - Omite cada capacidad a menos que `models.providers.comfy.<capability>` esté configurado
  - Útil después de cambiar el envío de flujos de trabajo de comfy, el polling, las descargas o el registro del plugin

## Generación de imágenes en vivo

- Prueba: `src/image-generation/runtime.live.test.ts`
- Comando: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Arnés: `pnpm test:live:media image`
- Alcance:
  - Enumera cada plugin proveedor de generación de imágenes registrado
  - Carga variables de entorno faltantes del proveedor desde tu shell de inicio de sesión (`~/.profile`) antes de sondear
  - Usa por defecto claves API en vivo/del entorno antes que perfiles de autenticación almacenados, para que claves de prueba obsoletas en `auth-profiles.json` no oculten credenciales reales del shell
  - Omite proveedores sin autenticación/perfil/modelo utilizable
  - Ejecuta las variantes estándar de generación de imágenes mediante la capacidad compartida de tiempo de ejecución:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Proveedores incluidos cubiertos actualmente:
  - `openai`
  - `google`
- Acotación opcional:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Comportamiento opcional de autenticación:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar autenticación del almacén de perfiles e ignorar sobrescrituras solo del entorno

## Generación de música en vivo

- Prueba: `extensions/music-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Arnés: `pnpm test:live:media music`
- Alcance:
  - Ejercita la ruta compartida incluida del proveedor de generación de música
  - Actualmente cubre Google y MiniMax
  - Carga variables de entorno del proveedor desde tu shell de inicio de sesión (`~/.profile`) antes de sondear
  - Usa por defecto claves API en vivo/del entorno antes que perfiles de autenticación almacenados, para que claves de prueba obsoletas en `auth-profiles.json` no oculten credenciales reales del shell
  - Omite proveedores sin autenticación/perfil/modelo utilizable
  - Ejecuta ambos modos de tiempo de ejecución declarados cuando están disponibles:
    - `generate` con entrada solo de prompt
    - `edit` cuando el proveedor declara `capabilities.edit.enabled`
  - Cobertura actual del carril compartido:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: archivo en vivo separado de Comfy, no este barrido compartido
- Acotación opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportamiento opcional de autenticación:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar autenticación del almacén de perfiles e ignorar sobrescrituras solo del entorno

## Generación de video en vivo

- Prueba: `extensions/video-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Arnés: `pnpm test:live:media video`
- Alcance:
  - Ejercita la ruta compartida incluida del proveedor de generación de video
  - Usa por defecto la ruta de prueba rápida segura para lanzamiento: proveedores que no son FAL, una solicitud de texto a video por proveedor, prompt de langosta de un segundo y un límite de operación por proveedor tomado de `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` de forma predeterminada)
  - Omite FAL de forma predeterminada porque la latencia de cola del lado del proveedor puede dominar el tiempo de lanzamiento; pasa `--video-providers fal` o `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` para ejecutarlo explícitamente
  - Carga variables de entorno del proveedor desde tu shell de inicio de sesión (`~/.profile`) antes de sondear
  - Usa por defecto claves API en vivo/del entorno antes que perfiles de autenticación almacenados, para que claves de prueba obsoletas en `auth-profiles.json` no oculten credenciales reales del shell
  - Omite proveedores sin autenticación/perfil/modelo utilizable
  - Ejecuta solo `generate` de forma predeterminada
  - Establece `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para ejecutar también modos de transformación declarados cuando estén disponibles:
    - `imageToVideo` cuando el proveedor declara `capabilities.imageToVideo.enabled` y el proveedor/modelo seleccionado acepta entrada local de imagen respaldada por buffer en el barrido compartido
    - `videoToVideo` cuando el proveedor declara `capabilities.videoToVideo.enabled` y el proveedor/modelo seleccionado acepta entrada local de video respaldada por buffer en el barrido compartido
  - Proveedores `imageToVideo` actualmente declarados pero omitidos en el barrido compartido:
    - `vydra` porque el `veo3` incluido es solo texto y el `kling` incluido requiere una URL remota de imagen
  - Cobertura específica del proveedor Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ese archivo ejecuta `veo3` de texto a video más un carril `kling` que usa por defecto un fixture de URL remota de imagen
  - Cobertura actual en vivo de `videoToVideo`:
    - solo `runway` cuando el modelo seleccionado es `runway/gen4_aleph`
  - Proveedores `videoToVideo` actualmente declarados pero omitidos en el barrido compartido:
    - `alibaba`, `qwen`, `xai` porque esas rutas actualmente requieren URLs remotas de referencia `http(s)` / MP4
    - `google` porque el carril compartido actual de Gemini/Veo usa entrada local respaldada por buffer y esa ruta no se acepta en el barrido compartido
    - `openai` porque el carril compartido actual no garantiza acceso específico de organización a video inpaint/remix
- Acotación opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` para incluir todos los proveedores en el barrido predeterminado, incluido FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` para reducir el límite de operación de cada proveedor en una prueba rápida agresiva
- Comportamiento opcional de autenticación:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar autenticación del almacén de perfiles e ignorar sobrescrituras solo del entorno

## Arnés multimedia en vivo

- Comando: `pnpm test:live:media`
- Propósito:
  - Ejecuta las suites compartidas en vivo de imagen, música y video mediante un único punto de entrada nativo del repositorio
  - Carga automáticamente variables de entorno faltantes del proveedor desde `~/.profile`
  - Acota automáticamente cada suite a proveedores que actualmente tienen autenticación utilizable por defecto
  - Reutiliza `scripts/test-live.mjs`, por lo que el comportamiento de Heartbeat y modo silencioso se mantiene consistente
- Ejemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Ejecutores de Docker (comprobaciones opcionales de “funciona en Linux”)

Estos ejecutores de Docker se dividen en dos grupos:

- Ejecutores de modelos en vivo: `test:docker:live-models` y `test:docker:live-gateway` ejecutan solo su archivo correspondiente de pruebas en vivo con claves de perfil dentro de la imagen Docker del repositorio (`src/agents/models.profiles.live.test.ts` y `src/gateway/gateway-models.profiles.live.test.ts`), montando tu directorio local de configuración y espacio de trabajo (y obteniendo `~/.profile` si está montado). Los puntos de entrada locales correspondientes son `test:live:models-profiles` y `test:live:gateway-profiles`.
- Los ejecutores Docker en vivo usan por defecto un límite menor de prueba rápida para que un barrido completo en Docker siga siendo práctico:
  `test:docker:live-models` usa por defecto `OPENCLAW_LIVE_MAX_MODELS=12`, y
  `test:docker:live-gateway` usa por defecto `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, y
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sobrescribe esas variables de entorno cuando
  explícitamente quieras el escaneo exhaustivo más grande.
- `test:docker:all` construye una vez la imagen Docker en vivo mediante `test:docker:live-build`, luego la reutiliza para los dos carriles Docker en vivo.
- Ejecutores de prueba rápida de contenedor: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` y `test:docker:plugins` arrancan uno o más contenedores reales y verifican rutas de integración de más alto nivel.

Los ejecutores Docker de modelos en vivo también montan por enlace solo los homes de autenticación CLI necesarios (o todos los compatibles cuando la ejecución no está acotada), luego los copian al home del contenedor antes de la ejecución para que OAuth de CLI externa pueda refrescar tokens sin mutar el almacén de autenticación del host:

- Modelos directos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Prueba rápida de enlace ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Prueba rápida del backend de CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Prueba rápida del arnés app-server de Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Prueba rápida en vivo de Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Asistente de onboarding (TTY, andamiaje completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Redes de Gateway (dos contenedores, autenticación WS + estado): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Puente de canal MCP (Gateway con seed + puente stdio + prueba rápida de frame de notificación Claude sin procesar): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (prueba rápida de instalación + alias `/plugin` + semántica de reinicio del paquete Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)

Los ejecutores Docker de modelos en vivo también montan por enlace el checkout actual en modo solo lectura y
lo preparan en un directorio de trabajo temporal dentro del contenedor. Esto mantiene delgada la
imagen de tiempo de ejecución mientras sigue ejecutando Vitest contra tu fuente/configuración local exacta.
El paso de preparación omite grandes cachés solo locales y salidas de compilación de apps como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, y directorios locales de `.build` de apps o
salida de Gradle para que las ejecuciones en vivo en Docker no pasen minutos copiando
artefactos específicos de la máquina.
También establecen `OPENCLAW_SKIP_CHANNELS=1` para que los sondeos en vivo del gateway no inicien
workers reales de canales Telegram/Discord/etc. dentro del contenedor.
`test:docker:live-models` sigue ejecutando `pnpm test:live`, así que pasa también
`OPENCLAW_LIVE_GATEWAY_*` cuando necesites acotar o excluir la cobertura en vivo de gateway
de ese carril Docker.
`test:docker:openwebui` es una prueba rápida de compatibilidad de nivel superior: inicia un
contenedor de gateway OpenClaw con los endpoints HTTP compatibles con OpenAI habilitados,
inicia un contenedor fijado de Open WebUI contra ese gateway, inicia sesión mediante
Open WebUI, verifica que `/api/models` expone `openclaw/default`, luego envía una
solicitud real de chat mediante el proxy `/api/chat/completions` de Open WebUI.
La primera ejecución puede ser notablemente más lenta porque Docker puede necesitar descargar la
imagen de Open WebUI y Open WebUI puede necesitar completar su propia configuración en frío.
Este carril espera una clave de modelo en vivo utilizable, y `OPENCLAW_PROFILE_FILE`
(`~/.profile` de forma predeterminada) es la forma principal de proporcionarla en ejecuciones dockerizadas.
Las ejecuciones exitosas imprimen una pequeña carga útil JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` es intencionalmente determinista y no necesita una
cuenta real de Telegram, Discord o iMessage. Arranca un contenedor Gateway
con seed, inicia un segundo contenedor que ejecuta `openclaw mcp serve`, luego
verifica descubrimiento de conversaciones enrutadas, lecturas de transcripción, metadatos de adjuntos,
comportamiento de cola de eventos en vivo, enrutamiento de envíos salientes y notificaciones
de canal + permisos estilo Claude sobre el puente MCP stdio real. La comprobación de notificación
inspecciona directamente los frames MCP stdio sin procesar, de modo que la prueba rápida valida lo que el
puente realmente emite, no solo lo que una SDK cliente concreta expone por casualidad.

Prueba manual ACP de hilo en lenguaje natural (no CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conserva este script para flujos de trabajo de regresión/depuración. Puede volver a ser necesario para la validación del enrutamiento de hilos ACP, así que no lo elimines.

Variables de entorno útiles:

- `OPENCLAW_CONFIG_DIR=...` (predeterminado: `~/.openclaw`) montado en `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predeterminado: `~/.openclaw/workspace`) montado en `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predeterminado: `~/.profile`) montado en `/home/node/.profile` y obtenido antes de ejecutar pruebas
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar solo variables de entorno obtenidas de `OPENCLAW_PROFILE_FILE`, usando directorios temporales de config/workspace y sin montajes externos de autenticación CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predeterminado: `~/.cache/openclaw/docker-cli-tools`) montado en `/home/node/.npm-global` para instalaciones CLI en caché dentro de Docker
- Directorios/archivos externos de autenticación CLI bajo `$HOME` se montan en solo lectura bajo `/host-auth...`, luego se copian a `/home/node/...` antes de que empiecen las pruebas
  - Directorios predeterminados: `.minimax`
  - Archivos predeterminados: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Las ejecuciones acotadas por proveedor montan solo los directorios/archivos necesarios inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sobrescríbelo manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, o una lista separada por comas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para acotar la ejecución
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar proveedores dentro del contenedor
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar una imagen existente `openclaw:local-live` en reejecuciones que no necesitan recompilación
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para asegurar que las credenciales vengan del almacén de perfiles (no del entorno)
- `OPENCLAW_OPENWEBUI_MODEL=...` para elegir el modelo expuesto por el gateway para la prueba rápida de Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para sobrescribir el prompt de comprobación de nonce usado por la prueba rápida de Open WebUI
- `OPENWEBUI_IMAGE=...` para sobrescribir la etiqueta fijada de la imagen de Open WebUI

## Comprobación de documentación

Ejecuta comprobaciones de documentación después de editar docs: `pnpm check:docs`.
Ejecuta la validación completa de anclas de Mintlify cuando también necesites comprobaciones de encabezados dentro de la página: `pnpm docs:check-links:anchors`.

## Regresión sin conexión (segura para CI)

Estas son regresiones de “pipeline real” sin proveedores reales:

- Llamada de herramientas de Gateway (OpenAI simulado, gateway real + bucle de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Asistente de Gateway (WS `wizard.start`/`wizard.next`, escribe config + autenticación exigida): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evaluaciones de fiabilidad del agente (Skills)

Ya tenemos algunas pruebas seguras para CI que se comportan como “evaluaciones de fiabilidad del agente”:

- Llamada simulada de herramientas a través del gateway real + bucle de agente (`src/gateway/gateway.test.ts`).
- Flujos end-to-end del asistente que validan el cableado de la sesión y los efectos de configuración (`src/gateway/gateway.test.ts`).

Qué sigue faltando para Skills (consulta [Skills](/es/tools/skills)):

- **Toma de decisiones:** cuando Skills aparecen en el prompt, ¿el agente elige la Skill correcta (o evita las irrelevantes)?
- **Cumplimiento:** ¿el agente lee `SKILL.md` antes de usarla y sigue los pasos/args requeridos?
- **Contratos de flujo de trabajo:** escenarios de varios turnos que afirman el orden de herramientas, la continuidad del historial de sesión y los límites del sandbox.

Las evaluaciones futuras deben seguir siendo deterministas primero:

- Un ejecutor de escenarios que use proveedores simulados para afirmar llamadas de herramientas + orden, lecturas de archivos de Skills y cableado de sesión.
- Una pequeña suite de escenarios centrados en Skills (usar vs evitar, gating, inyección de prompt).
- Evaluaciones en vivo opcionales (opt-in, restringidas por entorno) solo después de que la suite segura para CI esté implementada.

## Pruebas de contrato (forma de plugins y canales)

Las pruebas de contrato verifican que cada plugin y canal registrado se ajuste a su
contrato de interfaz. Iteran sobre todos los plugins descubiertos y ejecutan una suite de
afirmaciones de forma y comportamiento. El carril unitario predeterminado `pnpm test`
omite intencionalmente estos archivos compartidos de costura y prueba rápida; ejecuta los comandos de contrato explícitamente
cuando toques superficies compartidas de canales o proveedores.

### Comandos

- Todos los contratos: `pnpm test:contracts`
- Solo contratos de canales: `pnpm test:contracts:channels`
- Solo contratos de proveedores: `pnpm test:contracts:plugins`

### Contratos de canales

Ubicados en `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma básica del plugin (id, nombre, capacidades)
- **setup** - Contrato del asistente de configuración
- **session-binding** - Comportamiento de vinculación de sesión
- **outbound-payload** - Estructura de la carga útil del mensaje
- **inbound** - Manejo de mensajes entrantes
- **actions** - Manejadores de acciones del canal
- **threading** - Manejo del ID de hilo
- **directory** - API de directorio/listado
- **group-policy** - Aplicación de políticas de grupo

### Contratos de estado del proveedor

Ubicados en `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondeos de estado del canal
- **registry** - Forma del registro de plugins

### Contratos de proveedores

Ubicados en `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato del flujo de autenticación
- **auth-choice** - Elección/selección de autenticación
- **catalog** - API del catálogo de modelos
- **discovery** - Descubrimiento de plugins
- **loader** - Carga de plugins
- **runtime** - Tiempo de ejecución del proveedor
- **shape** - Forma/interfaz del plugin
- **wizard** - Asistente de configuración

### Cuándo ejecutarlas

- Después de cambiar exportaciones o subrutas de plugin-sdk
- Después de agregar o modificar un plugin de canal o proveedor
- Después de refactorizar el registro o descubrimiento de plugins

Las pruebas de contrato se ejecutan en CI y no requieren claves API reales.

## Agregar regresiones (orientación)

Cuando corrijas un problema de proveedor/modelo descubierto en vivo:

- Agrega una regresión segura para CI si es posible (proveedor simulado/stub, o captura la transformación exacta de la forma de la solicitud)
- Si es inherentemente solo en vivo (límites de tasa, políticas de autenticación), mantén la prueba en vivo acotada y opt-in mediante variables de entorno
- Prefiere apuntar a la capa más pequeña que detecte el error:
  - error de conversión/replay de solicitud del proveedor → prueba de modelos directos
  - error del pipeline de sesión/historial/herramientas de gateway → prueba rápida en vivo de gateway o prueba segura para CI con simulación de gateway
- Barandilla de recorrido de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un destino de muestra por clase SecretRef a partir de los metadatos del registro (`listSecretTargetRegistryEntries()`), luego afirma que se rechacen los ids exec de segmentos de recorrido.
  - Si agregas una nueva familia de destinos SecretRef `includeInPlan` en `src/secrets/target-registry-data.ts`, actualiza `classifyTargetClass` en esa prueba. La prueba falla intencionalmente con ids de destino no clasificados para que las clases nuevas no puedan omitirse silenciosamente.
