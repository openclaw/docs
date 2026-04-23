---
read_when:
    - Ejecutar pruebas localmente o en CI
    - Añadir regresiones para errores de modelo/proveedor
    - Depurar el comportamiento del Gateway y del agente
summary: 'Kit de pruebas: suites unit/e2e/live, ejecutores Docker y qué cubre cada prueba'
title: Pruebas
x-i18n:
    generated_at: "2026-04-23T14:03:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe0e9bdea78cba7e512358d2e4d428da04a2071188e74af2d5419d2c85eafe15
    source_path: help/testing.md
    workflow: 15
---

# Pruebas

OpenClaw tiene tres suites de Vitest (unit/integration, e2e, live) y un pequeño conjunto de ejecutores Docker.

Este documento es una guía de “cómo probamos”:

- Qué cubre cada suite (y qué deliberadamente _no_ cubre)
- Qué comandos ejecutar para flujos de trabajo comunes (local, antes de push, depuración)
- Cómo las pruebas live descubren credenciales y seleccionan modelos/proveedores
- Cómo añadir regresiones para problemas reales de modelos/proveedores

## Inicio rápido

La mayoría de los días:

- Compuerta completa (esperada antes de hacer push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Ejecución local más rápida de la suite completa en una máquina holgada: `pnpm test:max`
- Bucle directo de watch de Vitest: `pnpm test:watch`
- La selección directa de archivos ahora también enruta rutas de extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefiera primero ejecuciones dirigidas cuando esté iterando sobre un único fallo.
- Sitio de QA respaldado por Docker: `pnpm qa:lab:up`
- Carril de QA respaldado por VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Cuando toca pruebas o quiere más confianza:

- Compuerta de cobertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Al depurar proveedores/modelos reales (requiere credenciales reales):

- Suite live (modelos + sondeos de herramientas/imágenes del Gateway): `pnpm test:live`
- Apuntar silenciosamente a un archivo live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Barrido live de modelos en Docker: `pnpm test:docker:live-models`
  - Cobertura de CI: `OpenClaw Scheduled Live And E2E Checks` diaria y
    `OpenClaw Release Checks` manual llaman al flujo reusable de live/E2E con
    `include_live_suites: true`, que incluye trabajos de matriz Docker live separados
    fragmentados por proveedor.
  - Para reejecuciones de CI enfocadas, lance `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` y `live_models_only: true`.
  - Añada nuevos secretos de proveedor de alta señal a `scripts/ci-hydrate-live-auth.sh`
    más `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` y sus
    llamadores programados/de release.
- Smoke de coste de Moonshot/Kimi: con `MOONSHOT_API_KEY` configurada, ejecute
  `openclaw models list --provider moonshot --json`, luego ejecute un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  aislado contra `moonshot/kimi-k2.6`. Verifique que el JSON informe Moonshot/K2.6 y la
  transcripción del asistente almacene `usage.cost` normalizado.

Consejo: cuando solo necesite un caso fallido, prefiera acotar las pruebas live mediante las variables de entorno de allowlist descritas más abajo.

## Ejecutores específicos de QA

Estos comandos están junto a las suites de prueba principales cuando necesita realismo de QA-lab:

CI ejecuta QA Lab en flujos dedicados. `Parity gate` se ejecuta en PR coincidentes y
desde lanzamiento manual con proveedores mock. `QA-Lab - All Lanes` se ejecuta cada noche en
`main` y desde lanzamiento manual con la compuerta de paridad mock, carril Matrix live y
carril Telegram live gestionado por Convex como trabajos en paralelo. `OpenClaw Release Checks`
ejecuta los mismos carriles antes de la aprobación de release.

- `pnpm openclaw qa suite`
  - Ejecuta escenarios de QA respaldados por el repositorio directamente en el host.
  - Ejecuta en paralelo varios escenarios seleccionados de forma predeterminada con workers
    de Gateway aislados. `qa-channel` usa por defecto concurrencia 4 (limitada por el
    número de escenarios seleccionado). Use `--concurrency <count>` para ajustar el número
    de workers, o `--concurrency 1` para el antiguo carril serie.
  - Sale con código distinto de cero cuando falla cualquier escenario. Use `--allow-failures` cuando
    quiera artefactos sin un código de salida fallido.
  - Admite modos de proveedor `live-frontier`, `mock-openai` y `aimock`.
    `aimock` inicia un servidor de proveedor local respaldado por AIMock para cobertura experimental
    de fixtures y mocks de protocolo sin sustituir el carril `mock-openai`
    orientado a escenarios.
- `pnpm openclaw qa suite --runner multipass`
  - Ejecuta la misma suite de QA dentro de una VM Linux Multipass desechable.
  - Mantiene el mismo comportamiento de selección de escenarios que `qa suite` en el host.
  - Reutiliza los mismos indicadores de selección de proveedor/modelo que `qa suite`.
  - Las ejecuciones live reenvían las entradas de autenticación de QA compatibles que son prácticas para el invitado:
    claves de proveedor basadas en env, la ruta de configuración de proveedor live de QA y `CODEX_HOME`
    cuando está presente.
  - Los directorios de salida deben permanecer bajo la raíz del repositorio para que el invitado pueda escribir de vuelta a través
    del espacio de trabajo montado.
  - Escribe el informe + resumen normales de QA más los registros de Multipass en
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia el sitio de QA respaldado por Docker para trabajo de QA estilo operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Construye un tarball npm a partir del checkout actual, lo instala globalmente en
    Docker, ejecuta onboarding no interactivo con clave de API de OpenAI, configura Telegram
    de forma predeterminada, verifica que habilitar el plugin instala dependencias de tiempo de ejecución bajo demanda,
    ejecuta doctor y ejecuta un turno de agente local contra un endpoint mock de OpenAI.
  - Use `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para ejecutar el mismo carril de instalación empaquetada
    con Discord.
- `pnpm test:docker:bundled-channel-deps`
  - Empaqueta e instala la compilación actual de OpenClaw en Docker, inicia el Gateway
    con OpenAI configurado y luego habilita channel/plugins incluidos mediante ediciones de configuración.
  - Verifica que el descubrimiento de setup deje ausentes las dependencias de tiempo de ejecución del plugin no configurado,
    que la primera ejecución configurada de Gateway o doctor instale bajo demanda las dependencias de tiempo de ejecución
    de cada plugin incluido, y que un segundo reinicio no reinstale dependencias
    que ya estaban activadas.
  - También instala una base npm antigua conocida, habilita Telegram antes de ejecutar
    `openclaw update --tag <candidate>`, y verifica que el
    doctor posterior a la actualización del candidato repara las dependencias de tiempo de ejecución del channel incluido sin una
    reparación postinstall desde el harness.
- `pnpm openclaw qa aimock`
  - Inicia solo el servidor de proveedor local AIMock para pruebas smoke directas de protocolo.
- `pnpm openclaw qa matrix`
  - Ejecuta el carril de QA live de Matrix contra un homeserver Tuwunel desechable respaldado por Docker.
  - Este host de QA hoy es solo para repositorio/desarrollo. Las instalaciones empaquetadas de OpenClaw no incluyen
    `qa-lab`, por lo que no exponen `openclaw qa`.
  - Los checkouts del repositorio cargan directamente el runner incluido; no se necesita un paso
    separado de instalación de plugin.
  - Aprovisiona tres usuarios temporales de Matrix (`driver`, `sut`, `observer`) más una sala privada, luego inicia un proceso hijo de gateway de QA con el plugin real de Matrix como transporte SUT.
  - Usa por defecto la imagen estable fijada de Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Sobrescriba con `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` cuando necesite probar una imagen distinta.
  - Matrix no expone indicadores compartidos de fuente de credenciales porque el carril aprovisiona usuarios desechables localmente.
  - Escribe un informe de QA de Matrix, un resumen, un artefacto de eventos observados y un registro combinado de salida stdout/stderr en `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Ejecuta el carril de QA live de Telegram contra un grupo privado real usando los tokens de bot de driver y SUT desde env.
  - Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. El id del grupo debe ser el id numérico del chat de Telegram.
  - Admite `--credential-source convex` para credenciales compartidas agrupadas. Use el modo env de forma predeterminada, o configure `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por arrendamientos agrupados.
  - Sale con código distinto de cero cuando falla cualquier escenario. Use `--allow-failures` cuando
    quiera artefactos sin un código de salida fallido.
  - Requiere dos bots distintos en el mismo grupo privado, con el bot SUT exponiendo un nombre de usuario de Telegram.
  - Para una observación estable entre bots, habilite el modo Bot-to-Bot Communication Mode en `@BotFather` para ambos bots y asegúrese de que el bot driver pueda observar tráfico de bots del grupo.
  - Escribe un informe de QA de Telegram, un resumen y un artefacto de mensajes observados en `.artifacts/qa-e2e/...`. Los escenarios de respuesta incluyen RTT desde la solicitud de envío del driver hasta la respuesta observada del SUT.

Los carriles de transporte live comparten un contrato estándar para que los nuevos transportes no diverjan:

`qa-channel` sigue siendo la suite amplia de QA sintética y no forma parte de la matriz de cobertura de transporte live.

| Carril   | Canary | Puerta por mención | Bloqueo de allowlist | Respuesta de nivel superior | Reanudar tras reinicio | Seguimiento de hilo | Aislamiento de hilo | Observación de reacciones | Comando help |
| -------- | ------ | ------------------ | -------------------- | --------------------------- | ---------------------- | ------------------- | ------------------- | ------------------------- | ------------ |
| Matrix   | x      | x                  | x                    | x                           | x                      | x                   | x                   | x                         |              |
| Telegram | x      |                    |                      |                             |                        |                     |                     |                           | x            |

### Credenciales compartidas de Telegram mediante Convex (v1)

Cuando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
`openclaw qa telegram`, QA lab adquiere un arrendamiento exclusivo de un pool respaldado por Convex, envía heartbeat
de ese arrendamiento mientras el carril está en ejecución y libera el arrendamiento al cerrarse.

Scaffold de proyecto Convex de referencia:

- `qa/convex-credential-broker/`

Variables de entorno obligatorias:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por ejemplo `https://your-deployment.convex.site`)
- Un secreto para el rol seleccionado:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Selección del rol de credencial:
  - CLI: `--credential-role maintainer|ci`
  - Valor predeterminado de env: `OPENCLAW_QA_CREDENTIAL_ROLE` (usa `ci` por defecto en CI, `maintainer` en caso contrario)

Variables de entorno opcionales:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predeterminado `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predeterminado `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predeterminado `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predeterminado `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predeterminado `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de trazado opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs Convex `http://` de loopback para desarrollo solo local.

`OPENCLAW_QA_CONVEX_SITE_URL` debe usar `https://` en operación normal.

Los comandos de administración de maintainer (añadir/eliminar/listar pools) requieren
específicamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Ayudantes CLI para maintainers:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Use `--json` para salida legible por máquinas en scripts y utilidades de CI.

Contrato de endpoint predeterminado (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
  - Protección de arrendamiento activo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo secreto de maintainer)
  - Solicitud: `{ kind?, status?, includePayload?, limit? }`
  - Éxito: `{ status: "ok", credentials, count }`

Forma de la carga útil para el tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` debe ser una cadena de id numérico de chat de Telegram.
- `admin/add` valida esta forma para `kind: "telegram"` y rechaza cargas útiles mal formadas.

### Añadir un canal a QA

Añadir un canal al sistema de QA en Markdown requiere exactamente dos cosas:

1. Un adaptador de transporte para el canal.
2. Un paquete de escenarios que ejerza el contrato del canal.

No añada una nueva raíz de comandos de QA de nivel superior cuando el host compartido `qa-lab` pueda
ser el propietario del flujo.

`qa-lab` es propietario de la mecánica compartida del host:

- la raíz de comandos `openclaw qa`
- el inicio y apagado de la suite
- la concurrencia de workers
- la escritura de artefactos
- la generación de informes
- la ejecución de escenarios
- los alias de compatibilidad para escenarios antiguos de `qa-channel`

Los plugins de runner son propietarios del contrato de transporte:

- cómo se monta `openclaw qa <runner>` bajo la raíz compartida `qa`
- cómo se configura el Gateway para ese transporte
- cómo se comprueba la disponibilidad
- cómo se inyectan eventos entrantes
- cómo se observan mensajes salientes
- cómo se exponen las transcripciones y el estado de transporte normalizado
- cómo se ejecutan acciones respaldadas por transporte
- cómo se maneja el restablecimiento o limpieza específicos del transporte

El umbral mínimo de adopción para un nuevo canal es:

1. Mantener `qa-lab` como propietario de la raíz compartida `qa`.
2. Implementar el runner de transporte en la interfaz compartida de host `qa-lab`.
3. Mantener la mecánica específica del transporte dentro del plugin de runner o del harness del plugin.
4. Montar el runner como `openclaw qa <runner>` en lugar de registrar una raíz de comandos competidora.
   Los plugins de runner deben declarar `qaRunners` en `openclaw.plugin.json` y exportar un array `qaRunnerCliRegistrations` correspondiente desde `runtime-api.ts`.
   Mantenga `runtime-api.ts` ligero; la ejecución diferida de CLI y runner debe permanecer detrás de entrypoints separados.
5. Crear o adaptar escenarios Markdown bajo los directorios temáticos `qa/scenarios/`.
6. Usar los ayudantes genéricos de escenarios para los nuevos escenarios.
7. Mantener funcionando los alias de compatibilidad existentes, salvo que el repositorio esté realizando una migración intencional.

La regla de decisión es estricta:

- Si el comportamiento puede expresarse una vez en `qa-lab`, póngalo en `qa-lab`.
- Si el comportamiento depende de un transporte de canal, manténgalo en ese plugin de runner o harness del plugin.
- Si un escenario necesita una nueva capacidad que más de un canal puede usar, añada un ayudante genérico en lugar de una rama específica de canal en `suite.ts`.
- Si un comportamiento solo tiene sentido para un transporte, mantenga el escenario específico del transporte y hágalo explícito en el contrato del escenario.

Los nombres preferidos de ayudantes genéricos para nuevos escenarios son:

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

El trabajo en nuevos canales debe usar los nombres genéricos de ayudantes.
Los alias de compatibilidad existen para evitar una migración de tipo flag day, no como el modelo para
crear nuevos escenarios.

## Suites de prueba (qué se ejecuta dónde)

Piense en las suites como “realismo creciente” (y creciente inestabilidad/coste):

### Unit / integration (predeterminada)

- Comando: `pnpm test`
- Configuración: las ejecuciones no dirigidas usan el conjunto fragmentado `vitest.full-*.config.ts` y pueden expandir fragmentos multiproyecto en configuraciones por proyecto para programación en paralelo
- Archivos: inventarios core/unit en `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` y las pruebas Node permitidas de `ui` cubiertas por `vitest.unit.config.ts`
- Alcance:
  - Pruebas unitarias puras
  - Pruebas de integración en proceso (autenticación de Gateway, enrutamiento, herramientas, análisis, configuración)
  - Regresiones deterministas para errores conocidos
- Expectativas:
  - Se ejecuta en CI
  - No requiere claves reales
  - Debe ser rápida y estable
- Nota sobre proyectos:
  - `pnpm test` no dirigido ahora ejecuta doce configuraciones fragmentadas más pequeñas (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) en lugar de un único proceso gigante del proyecto raíz nativo. Esto reduce el RSS máximo en máquinas cargadas y evita que el trabajo de auto-reply/extensions ahogue suites no relacionadas.
  - `pnpm test --watch` sigue usando el grafo de proyecto raíz nativo `vitest.config.ts`, porque un bucle watch multifragmento no es práctico.
  - `pnpm test`, `pnpm test:watch` y `pnpm test:perf:imports` enrutan primero destinos explícitos de archivo/directorio por carriles acotados, así que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar el coste completo de inicio del proyecto raíz.
  - `pnpm test:changed` expande rutas git modificadas en los mismos carriles acotados cuando la diferencia solo toca archivos de código fuente/prueba enrutable; las ediciones de config/setup siguen recurriendo a la reejecución amplia del proyecto raíz.
  - `pnpm check:changed` es la compuerta local inteligente normal para trabajo acotado. Clasifica la diferencia en core, pruebas core, extensions, pruebas de extension, apps, docs, metadatos de release y tooling, y luego ejecuta los carriles coincidentes de typecheck/lint/test. Los cambios del Plugin SDK público y del contrato de plugin incluyen validación de extensions porque las extensions dependen de esos contratos centrales. Los incrementos de versión que solo afectan metadatos de release ejecutan comprobaciones dirigidas de versión/configuración/dependencia raíz en lugar de la suite completa, con una protección que rechaza cambios de paquete fuera del campo de versión de nivel superior.
  - Las pruebas unitarias ligeras de importación de agentes, comandos, plugins, ayudantes de auto-reply, `plugin-sdk` y áreas similares de utilidad pura se enrutan por el carril `unit-fast`, que omite `test/setup-openclaw-runtime.ts`; los archivos con mucho estado/entorno de ejecución permanecen en los carriles existentes.
  - Los archivos fuente de ayudantes seleccionados de `plugin-sdk` y `commands` también asignan las ejecuciones en modo changed a pruebas hermanas explícitas en esos carriles ligeros, de modo que las ediciones de ayudantes evitan reejecutar la suite pesada completa para ese directorio.
  - `auto-reply` ahora tiene tres cubos dedicados: ayudantes core de nivel superior, pruebas de integración `reply.*` de nivel superior y el subárbol `src/auto-reply/reply/**`. Esto mantiene el trabajo más pesado del harness de respuestas fuera de las pruebas baratas de estado/fragmento/token.
- Nota sobre el runner integrado:
  - Cuando cambie entradas de descubrimiento de herramientas de mensajes o el contexto de ejecución de Compaction,
    mantenga ambos niveles de cobertura.
  - Añada regresiones centradas en ayudantes para límites puros de enrutamiento/normalización.
  - Mantenga también sanas las suites de integración del runner integrado:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` y
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Esas suites verifican que los IDs acotados y el comportamiento de Compaction siguen fluyendo
    por las rutas reales `run.ts` / `compact.ts`; las pruebas solo de ayudantes no son un
    sustituto suficiente de esas rutas de integración.
- Nota sobre el pool:
  - La configuración base de Vitest ahora usa `threads` de forma predeterminada.
  - La configuración compartida de Vitest también fija `isolate: false` y usa el runner no aislado en los proyectos raíz, e2e y live.
  - El carril UI raíz mantiene su configuración y optimizador de `jsdom`, pero ahora también se ejecuta sobre el runner compartido no aislado.
  - Cada fragmento de `pnpm test` hereda los mismos valores predeterminados `threads` + `isolate: false` de la configuración compartida de Vitest.
  - El lanzador compartido `scripts/run-vitest.mjs` ahora también añade `--no-maglev` de forma predeterminada para los procesos Node hijo de Vitest, para reducir el churn de compilación de V8 durante ejecuciones locales grandes. Configure `OPENCLAW_VITEST_ENABLE_MAGLEV=1` si necesita comparar con el comportamiento estándar de V8.
- Nota sobre iteración local rápida:
  - `pnpm changed:lanes` muestra qué carriles arquitectónicos activa una diferencia.
  - El hook de pre-commit ejecuta `pnpm check:changed --staged` después de format/lint sobre lo preparado, así que los commits solo de core no pagan el coste de pruebas de extension a menos que toquen contratos públicos orientados a extensions. Los commits solo de metadatos de release permanecen en el carril dirigido de versión/configuración/dependencia raíz.
  - Si el conjunto exacto de cambios preparados ya fue validado con compuertas equivalentes o más fuertes, use `scripts/committer --fast "<message>" <files...>` para omitir solo la reejecución del hook de alcance cambiado. El format/lint preparado sigue ejecutándose. Mencione las compuertas completadas en su handoff. Esto también es aceptable después de que un fallo aislado e inestable del hook se reejecute y pase con prueba acotada.
  - `pnpm test:changed` enruta por carriles acotados cuando las rutas cambiadas se asignan limpiamente a una suite menor.
  - `pnpm test:max` y `pnpm test:changed:max` mantienen el mismo comportamiento de enrutamiento, solo con un límite de workers más alto.
  - El autoescalado local de workers ahora es intencionadamente conservador y también retrocede cuando la carga media del host ya es alta, por lo que varias ejecuciones concurrentes de Vitest causan menos daño de forma predeterminada.
  - La configuración base de Vitest marca los archivos de proyectos/configuración como `forceRerunTriggers` para que las reejecuciones en modo changed sigan siendo correctas cuando cambie el cableado de pruebas.
  - La configuración mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado en hosts compatibles; configure `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si quiere una ubicación explícita de caché para perfilado directo.
- Nota sobre depuración de rendimiento:
  - `pnpm test:perf:imports` habilita el informe de duración de importación de Vitest más la salida de desglose de importaciones.
  - `pnpm test:perf:imports:changed` acota la misma vista de perfilado a los archivos modificados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compara `test:changed` enrutado contra la ruta nativa del proyecto raíz para esa diferencia confirmada e imprime tiempo total y RSS máximo de macOS.
- `pnpm test:perf:changed:bench -- --worktree` evalúa el árbol de trabajo sucio actual enrutarando la lista de archivos modificados por `scripts/test-projects.mjs` y la configuración raíz de Vitest.
  - `pnpm test:perf:profile:main` escribe un perfil de CPU del hilo principal para la sobrecarga de inicio y transformación de Vitest/Vite.
  - `pnpm test:perf:profile:runner` escribe perfiles de CPU+heap del runner para la suite unitaria con el paralelismo por archivo deshabilitado.

### Stability (Gateway)

- Comando: `pnpm test:stability:gateway`
- Configuración: `vitest.gateway.config.ts`, forzada a un worker
- Alcance:
  - Inicia un Gateway real de loopback con diagnósticos habilitados de forma predeterminada
  - Conduce mensajes sintéticos del gateway, memoria y churn de cargas grandes por la ruta de eventos diagnósticos
  - Consulta `diagnostics.stability` mediante el RPC WS del Gateway
  - Cubre ayudantes de persistencia del paquete de estabilidad de diagnósticos
  - Afirma que el registrador permanece acotado, que las muestras sintéticas de RSS se mantienen bajo el presupuesto de presión y que las profundidades de cola por sesión vuelven a cero
- Expectativas:
  - Seguro para CI y sin claves
  - Carril acotado para seguimiento de regresiones de estabilidad, no un sustituto de la suite completa de Gateway

### E2E (smoke de Gateway)

- Comando: `pnpm test:e2e`
- Configuración: `vitest.e2e.config.ts`
- Archivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` y pruebas E2E de plugins incluidos bajo `extensions/`
- Valores predeterminados de entorno de ejecución:
  - Usa `threads` de Vitest con `isolate: false`, en consonancia con el resto del repositorio.
  - Usa workers adaptativos (CI: hasta 2, local: 1 de forma predeterminada).
  - Se ejecuta en modo silencioso de forma predeterminada para reducir la sobrecarga de E/S de consola.
- Sobrescrituras útiles:
  - `OPENCLAW_E2E_WORKERS=<n>` para forzar el número de workers (máximo 16).
  - `OPENCLAW_E2E_VERBOSE=1` para volver a habilitar salida de consola detallada.
- Alcance:
  - Comportamiento end-to-end de varias instancias de gateway
  - Superficies WebSocket/HTTP, emparejamiento de Node y redes más pesadas
- Expectativas:
  - Se ejecuta en CI (cuando está habilitado en la canalización)
  - No requiere claves reales
  - Más piezas móviles que las pruebas unitarias (puede ser más lento)

### E2E: smoke del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Archivo: `extensions/openshell/src/backend.e2e.test.ts`
- Alcance:
  - Inicia un Gateway aislado de OpenShell en el host mediante Docker
  - Crea un sandbox a partir de un Dockerfile local temporal
  - Ejerce el backend OpenShell de OpenClaw sobre `sandbox ssh-config` real + ejecución SSH
  - Verifica el comportamiento del sistema de archivos canónico remoto mediante el puente fs del sandbox
- Expectativas:
  - Solo opt-in; no forma parte de la ejecución predeterminada de `pnpm test:e2e`
  - Requiere un CLI local `openshell` más un daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` aislados, luego destruye el Gateway y el sandbox de prueba
- Sobrescrituras útiles:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar la prueba al ejecutar manualmente la suite e2e más amplia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apuntar a un binario CLI no predeterminado o a un script wrapper

### Live (proveedores reales + modelos reales)

- Comando: `pnpm test:live`
- Configuración: `vitest.live.config.ts`
- Archivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` y pruebas live de plugins incluidos bajo `extensions/`
- Predeterminado: **habilitado** por `pnpm test:live` (configura `OPENCLAW_LIVE_TEST=1`)
- Alcance:
  - “¿Este proveedor/modelo realmente funciona _hoy_ con credenciales reales?”
  - Detectar cambios de formato del proveedor, peculiaridades de llamadas de herramientas, problemas de autenticación y comportamiento de límites de tasa
- Expectativas:
  - No es estable en CI por diseño (redes reales, políticas reales de proveedores, cuotas, caídas)
  - Cuesta dinero / consume límites de tasa
  - Prefiera ejecutar subconjuntos acotados en lugar de “todo”
- Las ejecuciones live cargan `~/.profile` para recoger claves API faltantes.
- De forma predeterminada, las ejecuciones live siguen aislando `HOME` y copian material de config/auth a un home temporal de prueba para que los fixtures unitarios no puedan mutar su `~/.openclaw` real.
- Configure `OPENCLAW_LIVE_USE_REAL_HOME=1` solo cuando necesite intencionadamente que las pruebas live usen su directorio home real.
- `pnpm test:live` ahora usa por defecto un modo más silencioso: mantiene la salida de progreso `[live] ...`, pero suprime el aviso extra de `~/.profile` y silencia los registros de arranque del Gateway/el ruido de Bonjour. Configure `OPENCLAW_LIVE_TEST_QUIET=0` si quiere recuperar los registros completos de inicio.
- Rotación de claves API (específica por proveedor): configure `*_API_KEYS` con formato coma/punto y coma o `*_API_KEY_1`, `*_API_KEY_2` (por ejemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) o sobrescritura por live mediante `OPENCLAW_LIVE_*_KEY`; las pruebas reintentan ante respuestas de límite de tasa.
- Salida de progreso/Heartbeat:
  - Las suites live ahora emiten líneas de progreso a stderr para que las llamadas largas al proveedor muestren actividad visible incluso cuando la captura de consola de Vitest está en silencio.
  - `vitest.live.config.ts` deshabilita la interceptación de consola de Vitest para que las líneas de progreso del proveedor/Gateway se transmitan inmediatamente durante las ejecuciones live.
  - Ajuste los Heartbeat de modelos directos con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste los Heartbeat de Gateway/sondeo con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## ¿Qué suite debo ejecutar?

Use esta tabla de decisión:

- Editando lógica/pruebas: ejecute `pnpm test` (y `pnpm test:coverage` si cambió mucho)
- Tocando redes del Gateway / protocolo WS / emparejamiento: añada `pnpm test:e2e`
- Depurando “mi bot está caído” / fallos específicos de proveedor / llamadas de herramientas: ejecute un `pnpm test:live` acotado

## Live: barrido de capacidades de Android Node

- Prueba: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **cada comando anunciado actualmente** por un Android Node conectado y afirmar el comportamiento del contrato del comando.
- Alcance:
  - Configuración previa/manual (la suite no instala/ejecuta/empareja la app).
  - Validación comando por comando de `node.invoke` del gateway para el Android Node seleccionado.
- Configuración previa obligatoria:
  - App de Android ya conectada + emparejada con el Gateway.
  - App mantenida en primer plano.
  - Permisos/consentimiento de captura concedidos para las capacidades que espera que pasen.
- Sobrescrituras opcionales de destino:
  - `OPENCLAW_ANDROID_NODE_ID` o `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalles completos de configuración de Android: [App de Android](/es/platforms/android)

## Live: smoke de modelos (claves de perfil)

Las pruebas live están divididas en dos capas para poder aislar fallos:

- “Modelo directo” nos dice si el proveedor/modelo puede responder en absoluto con la clave dada.
- “Gateway smoke” nos dice si todo el pipeline gateway+agent funciona para ese modelo (sesiones, historial, herramientas, política de sandbox, etc.).

### Capa 1: completado directo de modelo (sin Gateway)

- Prueba: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar modelos descubiertos
  - Usar `getApiKeyForModel` para seleccionar modelos para los que tiene credenciales
  - Ejecutar una pequeña finalización por modelo (y regresiones dirigidas cuando sea necesario)
- Cómo habilitar:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invoca Vitest directamente)
- Configure `OPENCLAW_LIVE_MODELS=modern` (o `all`, alias de modern) para ejecutar realmente esta suite; en caso contrario se omite para mantener `pnpm test:live` enfocado en smoke del Gateway
- Cómo seleccionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` para ejecutar la allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` es un alias de la allowlist moderna
  - o `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist separada por comas)
  - Los barridos modern/all usan por defecto un límite curado de alta señal; configure `OPENCLAW_LIVE_MAX_MODELS=0` para un barrido moderno exhaustivo o un número positivo para un límite menor.
- Cómo seleccionar proveedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist separada por comas)
- De dónde vienen las claves:
  - Predeterminado: almacén de perfiles y respaldos de entorno
  - Configure `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para exigir **solo** el almacén de perfiles
- Por qué existe:
  - Separa “la API del proveedor está rota / la clave es inválida” de “el pipeline del agente Gateway está roto”
  - Contiene regresiones pequeñas y aisladas (ejemplo: flujos de repetición de razonamiento de OpenAI Responses/Codex Responses + tool-call)

### Capa 2: smoke de Gateway + agente dev (lo que realmente hace "@openclaw")

- Prueba: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Levantar un Gateway en proceso
  - Crear/parchear una sesión `agent:dev:*` (sobrescritura de modelo por ejecución)
  - Iterar modelos-con-claves y afirmar:
    - respuesta “significativa” (sin herramientas)
    - una invocación real de herramienta funciona (sondeo de read)
    - sondeos opcionales de herramienta extra (sondeo exec+read)
    - las rutas de regresión de OpenAI (solo tool-call → seguimiento) siguen funcionando
- Detalles de los sondeos (para que pueda explicar fallos rápidamente):
  - sondeo `read`: la prueba escribe un archivo nonce en el espacio de trabajo y pide al agente que lo `read` y devuelva el nonce.
  - sondeo `exec+read`: la prueba pide al agente que escriba un nonce con `exec` en un archivo temporal y luego lo `read`.
  - sondeo de imagen: la prueba adjunta un PNG generado (gato + código aleatorio) y espera que el modelo devuelva `cat <CODE>`.
  - Referencia de implementación: `src/gateway/gateway-models.profiles.live.test.ts` y `src/gateway/live-image-probe.ts`.
- Cómo habilitar:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invoca Vitest directamente)
- Cómo seleccionar modelos:
  - Predeterminado: allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` es un alias de la allowlist moderna
  - O configure `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (o lista separada por comas) para acotar
  - Los barridos de Gateway modern/all usan por defecto un límite curado de alta señal; configure `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para un barrido moderno exhaustivo o un número positivo para un límite menor.
- Cómo seleccionar proveedores (evitar “todo OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist separada por comas)
- Los sondeos de herramienta + imagen siempre están activados en esta prueba live:
  - sondeo `read` + sondeo `exec+read` (estrés de herramientas)
  - el sondeo de imagen se ejecuta cuando el modelo anuncia compatibilidad con entrada de imagen
  - Flujo (alto nivel):
    - La prueba genera un PNG pequeño con “CAT” + código aleatorio (`src/gateway/live-image-probe.ts`)
    - Lo envía mediante `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway analiza los adjuntos en `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - El agente integrado reenvía un mensaje de usuario multimodal al modelo
    - Afirmación: la respuesta contiene `cat` + el código (tolerancia OCR: se permiten errores menores)

Consejo: para ver qué puede probar en su máquina (y los IDs exactos `provider/model`), ejecute:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke del backend CLI (Claude, Codex, Gemini u otros CLI locales)

- Prueba: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar el pipeline Gateway + agent usando un backend CLI local, sin tocar su configuración predeterminada.
- Los valores predeterminados de smoke específicos del backend viven con la definición `cli-backend.ts` de la extension propietaria.
- Habilitar:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invoca Vitest directamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Predeterminados:
  - Proveedor/modelo predeterminado: `claude-cli/claude-sonnet-4-6`
  - El comportamiento de comando/args/imagen proviene de los metadatos del plugin propietario del backend CLI.
- Sobrescrituras (opcionales):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar un adjunto de imagen real (las rutas se inyectan en el prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para pasar rutas de archivo de imagen como args de CLI en lugar de inyección en el prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (o `"list"`) para controlar cómo se pasan los args de imagen cuando `IMAGE_ARG` está configurado.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar un segundo turno y validar el flujo de reanudación.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` para deshabilitar el sondeo predeterminado de continuidad en la misma sesión Claude Sonnet -> Opus (configure `1` para forzarlo cuando el modelo seleccionado admita un destino de cambio).

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

- El runner Docker vive en `scripts/test-live-cli-backend-docker.sh`.
- Ejecuta el smoke live del backend CLI dentro de la imagen Docker del repositorio como usuario no root `node`.
- Resuelve los metadatos de smoke del CLI desde la extension propietaria y luego instala el paquete CLI de Linux coincidente (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) en un prefijo con escritura y caché en `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (predeterminado: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` requiere OAuth portátil de suscripción de Claude Code mediante `~/.claude/.credentials.json` con `claudeAiOauth.subscriptionType` o `CLAUDE_CODE_OAUTH_TOKEN` de `claude setup-token`. Primero demuestra `claude -p` directo en Docker, luego ejecuta dos turnos del backend CLI de Gateway sin conservar variables de entorno de clave API de Anthropic. Este carril de suscripción deshabilita por defecto los sondeos de Claude MCP/tool y de imagen porque Claude actualmente enruta el uso de apps de terceros mediante facturación de uso extra en lugar de los límites normales del plan de suscripción.
- El smoke live del backend CLI ahora ejerce el mismo flujo end-to-end para Claude, Codex y Gemini: turno de texto, turno de clasificación de imagen y luego llamada a la herramienta MCP `cron` verificada mediante el CLI del gateway.
- El smoke predeterminado de Claude también parchea la sesión de Sonnet a Opus y verifica que la sesión reanudada aún recuerde una nota anterior.

## Live: smoke de vínculo ACP (`/acp spawn ... --bind here`)

- Prueba: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar el flujo real de vínculo de conversación ACP con un agente ACP live:
  - enviar `/acp spawn <agent> --bind here`
  - vincular en su sitio una conversación sintética de canal de mensajes
  - enviar un seguimiento normal en esa misma conversación
  - verificar que el seguimiento llega a la transcripción de la sesión ACP vinculada
- Habilitar:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Predeterminados:
  - Agentes ACP en Docker: `claude,codex,gemini`
  - Agente ACP para `pnpm test:live ...` directo: `claude`
  - Canal sintético: contexto de conversación tipo mensaje directo de Slack
  - Backend ACP: `acpx`
- Sobrescrituras:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- Notas:
  - Este carril usa la superficie `chat.send` del gateway con campos de ruta de origen sintéticos solo para administradores, de modo que las pruebas puedan adjuntar contexto de canal de mensajes sin fingir una entrega externa.
  - Cuando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` no está configurado, la prueba usa el registro integrado de agentes del plugin `acpx` incluido para el agente de harness ACP seleccionado.

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

Recetas Docker de un solo agente:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Notas de Docker:

- El runner Docker vive en `scripts/test-live-acp-bind-docker.sh`.
- De forma predeterminada, ejecuta el smoke de vínculo ACP contra todos los agentes CLI live compatibles en secuencia: `claude`, `codex` y luego `gemini`.
- Use `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` o `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` para acotar la matriz.
- Carga `~/.profile`, prepara en el contenedor el material de autenticación CLI correspondiente, instala `acpx` en un prefijo npm escribible y luego instala el CLI live solicitado (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) si falta.
- Dentro de Docker, el runner configura `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` para que acpx mantenga disponibles para el CLI hijo del harness las variables de entorno del proveedor provenientes del perfil cargado.

## Live: smoke del harness app-server de Codex

- Objetivo: validar el harness de Codex propiedad del plugin mediante el método normal `agent`
  del gateway:
  - cargar el plugin incluido `codex`
  - seleccionar `OPENCLAW_AGENT_RUNTIME=codex`
  - enviar un primer turno de agente del gateway a `codex/gpt-5.4`
  - enviar un segundo turno a la misma sesión de OpenClaw y verificar que el hilo del app-server
    puede reanudarse
  - ejecutar `/codex status` y `/codex models` a través de la misma ruta de comando
    del gateway
  - opcionalmente ejecutar dos sondeos de shell escalados revisados por Guardian: un comando
    benigno que debería aprobarse y una carga falsa de secreto que debería denegarse
    para que el agente vuelva a preguntar
- Prueba: `src/gateway/gateway-codex-harness.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modelo predeterminado: `codex/gpt-5.4`
- Sondeo opcional de imagen: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sondeo opcional de MCP/tool: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Sondeo opcional de Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- El smoke configura `OPENCLAW_AGENT_HARNESS_FALLBACK=none` para que un harness roto de Codex
  no pueda pasar recurriendo silenciosamente a PI.
- Autenticación: `OPENAI_API_KEY` desde el shell/perfil, más opcionalmente
  `~/.codex/auth.json` y `~/.codex/config.toml` copiados

Receta local:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Receta Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Notas de Docker:

- El runner Docker vive en `scripts/test-live-codex-harness-docker.sh`.
- Carga el `~/.profile` montado, pasa `OPENAI_API_KEY`, copia archivos de autenticación del CLI de Codex cuando están presentes, instala `@openai/codex` en un prefijo npm escribible montado, prepara el árbol fuente y luego ejecuta solo la prueba live del harness de Codex.
- Docker habilita por defecto los sondeos de imagen, MCP/tool y Guardian. Configure
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` o
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` o
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` cuando necesite una
  ejecución de depuración más acotada.
- Docker también exporta `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, en consonancia con la
  configuración de la prueba live, para que el respaldo a `openai-codex/*` o PI no pueda ocultar una regresión del harness de Codex.

### Recetas live recomendadas

Las allowlists acotadas y explícitas son las más rápidas y menos inestables:

- Modelo único, directo (sin Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modelo único, smoke de Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Llamada de herramientas en varios proveedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Enfoque en Google (clave API de Gemini + Antigravity):
  - Gemini (clave API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Notas:

- `google/...` usa la API de Gemini (clave API).
- `google-antigravity/...` usa el puente OAuth de Antigravity (endpoint de agente estilo Cloud Code Assist).
- `google-gemini-cli/...` usa el CLI local de Gemini en su máquina (autenticación separada + peculiaridades de herramientas).
- API de Gemini frente a CLI de Gemini:
  - API: OpenClaw llama a la API hospedada de Gemini de Google por HTTP (autenticación por clave API / perfil); esto es lo que la mayoría de los usuarios entiende por “Gemini”.
  - CLI: OpenClaw ejecuta un binario local `gemini`; tiene su propia autenticación y puede comportarse de forma distinta (streaming/soporte de herramientas/desfase de versión).

## Live: matriz de modelos (qué cubrimos)

No existe una “lista de modelos de CI” fija (live es opt-in), pero estos son los modelos **recomendados** para cubrir regularmente en una máquina de desarrollo con claves.

### Conjunto smoke moderno (llamada de herramientas + imagen)

Esta es la ejecución de “modelos comunes” que esperamos mantener funcionando:

- OpenAI (no Codex): `openai/gpt-5.4` (opcional: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (o `anthropic/claude-sonnet-4-6`)
- Google (API de Gemini): `google/gemini-3.1-pro-preview` y `google/gemini-3-flash-preview` (evite modelos Gemini 2.x más antiguos)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` y `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Ejecute smoke de Gateway con herramientas + imagen:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Base: llamada de herramientas (Read + Exec opcional)

Elija al menos uno por familia de proveedor:

- OpenAI: `openai/gpt-5.4` (o `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (o `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (o `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Cobertura adicional opcional (deseable):

- xAI: `xai/grok-4` (o la última disponible)
- Mistral: `mistral/`… (elija un modelo compatible con “tools” que tenga habilitado)
- Cerebras: `cerebras/`… (si tiene acceso)
- LM Studio: `lmstudio/`… (local; la llamada de herramientas depende del modo API)

### Visión: envío de imagen (adjunto → mensaje multimodal)

Incluya al menos un modelo compatible con imagen en `OPENCLAW_LIVE_GATEWAY_MODELS` (variantes compatibles con visión de Claude/Gemini/OpenAI, etc.) para ejercer el sondeo de imagen.

### Agregadores / gateways alternativos

Si tiene claves habilitadas, también admitimos pruebas mediante:

- OpenRouter: `openrouter/...` (cientos de modelos; use `openclaw models scan` para encontrar candidatos compatibles con tools+image)
- OpenCode: `opencode/...` para Zen y `opencode-go/...` para Go (autenticación mediante `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Más proveedores que puede incluir en la matriz live (si tiene credenciales/configuración):

- Incluidos: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Mediante `models.providers` (endpoints personalizados): `minimax` (cloud/API), más cualquier proxy compatible con OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, etc.)

Consejo: no intente codificar “todos los modelos” en la documentación. La lista autorizada es lo que devuelva `discoverModels(...)` en su máquina + las claves disponibles.

## Credenciales (nunca haga commit)

Las pruebas live descubren credenciales igual que la CLI. Implicaciones prácticas:

- Si la CLI funciona, las pruebas live deberían encontrar las mismas claves.
- Si una prueba live dice “no creds”, depúrela igual que depuraría `openclaw models list` / selección de modelo.

- Perfiles de autenticación por agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (esto es lo que significan las “profile keys” en las pruebas live)
- Configuración: `~/.openclaw/openclaw.json` (o `OPENCLAW_CONFIG_PATH`)
- Directorio de estado heredado: `~/.openclaw/credentials/` (se copia al home live preparado cuando está presente, pero no es el almacén principal de claves de perfil)
- Las ejecuciones live locales copian por defecto la configuración activa, los archivos `auth-profiles.json` por agente, `credentials/` heredado y los directorios compatibles de autenticación CLI externa a un home temporal de prueba; los homes live preparados omiten `workspace/` y `sandboxes/`, y se eliminan las sobrescrituras de ruta `agents.*.workspace` / `agentDir` para que los sondeos no toquen el espacio de trabajo real del host.

Si quiere depender de claves de entorno (p. ej., exportadas en `~/.profile`), ejecute pruebas locales después de `source ~/.profile`, o use los runners Docker de abajo (pueden montar `~/.profile` en el contenedor).

## Live de Deepgram (transcripción de audio)

- Prueba: `extensions/deepgram/audio.live.test.ts`
- Habilitar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Live de plan de coding de BytePlus

- Prueba: `extensions/byteplus/live.test.ts`
- Habilitar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Sobrescritura opcional de modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live de medios de flujo de trabajo de ComfyUI

- Prueba: `extensions/comfy/comfy.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Alcance:
  - Ejerce las rutas incluidas de imagen, video y `music_generate` de comfy
  - Omite cada capacidad salvo que `models.providers.comfy.<capability>` esté configurado
  - Útil después de cambiar el envío de flujo de trabajo de comfy, el sondeo, las descargas o el registro del plugin

## Live de generación de imágenes

- Prueba: `test/image-generation.runtime.live.test.ts`
- Comando: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Alcance:
  - Enumera cada plugin de proveedor de generación de imágenes registrado
  - Carga variables de entorno faltantes del proveedor desde su shell de inicio de sesión (`~/.profile`) antes de sondear
  - Usa por defecto claves API live/env antes que perfiles de autenticación almacenados, para que claves de prueba obsoletas en `auth-profiles.json` no oculten credenciales reales del shell
  - Omite proveedores sin autenticación/perfil/modelo utilizable
  - Ejecuta las variantes estándar de generación de imágenes mediante la capacidad compartida de tiempo de ejecución:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Proveedores incluidos cubiertos actualmente:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `vydra`
  - `xai`
- Acotado opcional:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- Comportamiento opcional de autenticación:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar autenticación del almacén de perfiles e ignorar sobrescrituras solo por env

## Live de generación de música

- Prueba: `extensions/music-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Alcance:
  - Ejerce la ruta compartida incluida de proveedor de generación de música
  - Actualmente cubre Google y MiniMax
  - Carga variables de entorno del proveedor desde su shell de inicio de sesión (`~/.profile`) antes de sondear
  - Usa por defecto claves API live/env antes que perfiles de autenticación almacenados, para que claves de prueba obsoletas en `auth-profiles.json` no oculten credenciales reales del shell
  - Omite proveedores sin autenticación/perfil/modelo utilizable
  - Ejecuta ambos modos declarados de tiempo de ejecución cuando están disponibles:
    - `generate` con entrada solo de prompt
    - `edit` cuando el proveedor declara `capabilities.edit.enabled`
  - Cobertura actual del carril compartido:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: archivo live de Comfy separado, no este barrido compartido
- Acotado opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportamiento opcional de autenticación:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar autenticación del almacén de perfiles e ignorar sobrescrituras solo por env

## Live de generación de video

- Prueba: `extensions/video-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Alcance:
  - Ejerce la ruta compartida incluida de proveedor de generación de video
  - Usa por defecto la ruta smoke segura para release: proveedores no FAL, una solicitud de texto a video por proveedor, prompt de langosta de un segundo y un límite de operación por proveedor de `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` de forma predeterminada)
  - Omite FAL de forma predeterminada porque la latencia de cola del proveedor puede dominar el tiempo de release; pase `--video-providers fal` o `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` para ejecutarlo explícitamente
  - Carga variables de entorno del proveedor desde su shell de inicio de sesión (`~/.profile`) antes de sondear
  - Usa por defecto claves API live/env antes que perfiles de autenticación almacenados, para que claves de prueba obsoletas en `auth-profiles.json` no oculten credenciales reales del shell
  - Omite proveedores sin autenticación/perfil/modelo utilizable
  - Ejecuta solo `generate` de forma predeterminada
  - Configure `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para ejecutar también modos de transformación declarados cuando estén disponibles:
    - `imageToVideo` cuando el proveedor declara `capabilities.imageToVideo.enabled` y el proveedor/modelo seleccionado acepta entrada de imagen local respaldada por buffer en el barrido compartido
    - `videoToVideo` cuando el proveedor declara `capabilities.videoToVideo.enabled` y el proveedor/modelo seleccionado acepta entrada de video local respaldada por buffer en el barrido compartido
  - Proveedores `imageToVideo` actualmente declarados pero omitidos en el barrido compartido:
    - `vydra` porque `veo3` incluido es solo texto y `kling` incluido requiere una URL de imagen remota
  - Cobertura específica del proveedor Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ese archivo ejecuta `veo3` de texto a video más un carril `kling` que usa por defecto un fixture de URL de imagen remota
  - Cobertura live actual de `videoToVideo`:
    - solo `runway` cuando el modelo seleccionado es `runway/gen4_aleph`
  - Proveedores `videoToVideo` actualmente declarados pero omitidos en el barrido compartido:
    - `alibaba`, `qwen`, `xai` porque esas rutas actualmente requieren URLs de referencia remotas `http(s)` / MP4
    - `google` porque el carril actual compartido Gemini/Veo usa entrada local respaldada por buffer y esa ruta no se acepta en el barrido compartido
    - `openai` porque el carril compartido actual no garantiza acceso específico de organización a video inpaint/remix
- Acotado opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` para incluir cada proveedor en el barrido predeterminado, incluido FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` para reducir el límite de operación de cada proveedor en una ejecución smoke agresiva
- Comportamiento opcional de autenticación:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar autenticación del almacén de perfiles e ignorar sobrescrituras solo por env

## Harness live de medios

- Comando: `pnpm test:live:media`
- Propósito:
  - Ejecuta las suites live compartidas de imagen, música y video mediante un único entrypoint nativo del repositorio
  - Carga automáticamente variables de entorno faltantes del proveedor desde `~/.profile`
  - Acota automáticamente cada suite a proveedores que actualmente tienen autenticación utilizable de forma predeterminada
  - Reutiliza `scripts/test-live.mjs`, por lo que el comportamiento de Heartbeat y modo silencioso sigue siendo coherente
- Ejemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Ejecutores Docker (comprobaciones opcionales de “funciona en Linux”)

Estos ejecutores Docker se dividen en dos grupos:

- Ejecutores live-model: `test:docker:live-models` y `test:docker:live-gateway` ejecutan solo su archivo live coincidente de claves de perfil dentro de la imagen Docker del repositorio (`src/agents/models.profiles.live.test.ts` y `src/gateway/gateway-models.profiles.live.test.ts`), montando su directorio local de configuración y espacio de trabajo (y cargando `~/.profile` si está montado). Los entrypoints locales correspondientes son `test:live:models-profiles` y `test:live:gateway-profiles`.
- Los ejecutores Docker live usan por defecto un límite smoke menor para que un barrido Docker completo siga siendo práctico:
  `test:docker:live-models` usa por defecto `OPENCLAW_LIVE_MAX_MODELS=12`, y
  `test:docker:live-gateway` usa por defecto `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` y
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sobrescriba esas variables de entorno cuando
  quiera explícitamente un escaneo exhaustivo más amplio.
- `test:docker:all` construye una vez la imagen Docker live mediante `test:docker:live-build`, luego la reutiliza para los dos carriles Docker live. También construye una imagen compartida `scripts/e2e/Dockerfile` mediante `test:docker:e2e-build` y la reutiliza para los ejecutores smoke E2E en contenedor que ejercen la app compilada.
- Ejecutores smoke en contenedor: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` y `test:docker:config-reload` arrancan uno o más contenedores reales y verifican rutas de integración de nivel superior.

Los ejecutores Docker de live-model también montan solo los homes de autenticación CLI necesarios (o todos los compatibles cuando la ejecución no está acotada), luego los copian al home del contenedor antes de la ejecución para que el OAuth del CLI externo pueda refrescar tokens sin mutar el almacén de autenticación del host:

- Modelos directos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de vínculo ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Smoke del backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke del harness app-server de Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live de Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Asistente de onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke de onboarding/canal/agente con tarball npm: `pnpm test:docker:npm-onboard-channel-agent` instala globalmente en Docker el tarball empaquetado de OpenClaw, configura OpenAI mediante onboarding con referencia env más Telegram de forma predeterminada, verifica que habilitar el plugin instala sus dependencias de tiempo de ejecución bajo demanda, ejecuta doctor y ejecuta un turno de agente mock de OpenAI. Reutilice un tarball ya compilado con `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omita la recompilación del host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` o cambie de canal con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Redes de Gateway (dos contenedores, autenticación WS + estado): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Regresión mínima de razonamiento OpenAI Responses `web_search`: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) ejecuta un servidor OpenAI mock a través del Gateway, verifica que `web_search` eleva `reasoning.effort` de `minimal` a `low`, luego fuerza el rechazo del esquema del proveedor y comprueba que el detalle sin procesar aparece en los registros del Gateway.
- Puente de canal MCP (Gateway inicializado + puente stdio + smoke de marcos de notificación raw Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Herramientas MCP del paquete Pi (servidor MCP stdio real + smoke de permitir/denegar del perfil Pi integrado): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Limpieza MCP de Cron/subagente (Gateway real + desmontaje del hijo MCP stdio tras ejecuciones aisladas de Cron y subagente de una sola vez): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke de instalación + alias `/plugin` + semántica de reinicio del paquete Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
- Smoke sin cambios de actualización de plugin: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke de metadatos de recarga de configuración: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Dependencias de tiempo de ejecución de plugins incluidos: `pnpm test:docker:bundled-channel-deps` construye por defecto una imagen pequeña de runner Docker, compila y empaqueta OpenClaw una vez en el host y luego monta ese tarball en cada escenario de instalación Linux. Reutilice la imagen con `OPENCLAW_SKIP_DOCKER_BUILD=1`, omita la recompilación del host tras una build local reciente con `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` o apunte a un tarball existente con `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Acote las dependencias de tiempo de ejecución de plugins incluidos mientras itera deshabilitando escenarios no relacionados, por ejemplo:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Para precompilar y reutilizar manualmente la imagen compartida de la app compilada:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Las sobrescrituras de imagen específicas de la suite, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, siguen teniendo prioridad cuando están configuradas. Cuando `OPENCLAW_SKIP_DOCKER_BUILD=1` apunta a una imagen compartida remota, los scripts la descargan si aún no está en local. Las pruebas Docker de QR y del instalador mantienen sus propios Dockerfiles porque validan el comportamiento de paquete/instalación en lugar del tiempo de ejecución compartido de la app compilada.

Los ejecutores Docker de live-model también montan el checkout actual en solo lectura y
lo preparan en un workdir temporal dentro del contenedor. Esto mantiene ligera la imagen de tiempo de ejecución
mientras sigue ejecutando Vitest contra su fuente/configuración local exacta.
El paso de preparación omite cachés locales grandes y salidas de compilación de apps como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` y directorios `.build` locales de app o
salidas de Gradle para que las ejecuciones Docker live no gasten minutos copiando
artefactos específicos de la máquina.
También configuran `OPENCLAW_SKIP_CHANNELS=1` para que los sondeos live del gateway no inicien
workers reales de canales de Telegram/Discord/etc. dentro del contenedor.
`test:docker:live-models` sigue ejecutando `pnpm test:live`, así que pase también
`OPENCLAW_LIVE_GATEWAY_*` cuando necesite acotar o excluir cobertura live del gateway
de ese carril Docker.
`test:docker:openwebui` es un smoke de compatibilidad de nivel superior: inicia un
contenedor gateway de OpenClaw con los endpoints HTTP compatibles con OpenAI habilitados,
inicia un contenedor fijado de Open WebUI contra ese gateway, inicia sesión a través de
Open WebUI, verifica que `/api/models` expone `openclaw/default`, luego envía una
solicitud real de chat a través del proxy `/api/chat/completions` de Open WebUI.
La primera ejecución puede ser notablemente más lenta porque Docker puede necesitar descargar la
imagen de Open WebUI y Open WebUI puede necesitar completar su propia configuración de arranque en frío.
Este carril espera una clave de modelo live utilizable, y `OPENCLAW_PROFILE_FILE`
(`~/.profile` de forma predeterminada) es la forma principal de proporcionarla en ejecuciones Dockerizadas.
Las ejecuciones correctas imprimen una pequeña carga JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` es intencionadamente determinista y no necesita una
cuenta real de Telegram, Discord ni iMessage. Inicia un contenedor Gateway
inicializado, arranca un segundo contenedor que ejecuta `openclaw mcp serve` y luego
verifica descubrimiento de conversación enrutada, lecturas de transcripción, metadatos de adjuntos,
comportamiento de cola de eventos live, enrutamiento de envío saliente y notificaciones estilo Claude de canal +
permisos sobre el puente stdio MCP real. La comprobación de notificaciones
inspecciona directamente los marcos stdio MCP sin procesar, de modo que el smoke valida lo que
el puente realmente emite, no solo lo que una SDK cliente concreta resulte mostrar.
`test:docker:pi-bundle-mcp-tools` es determinista y no necesita una clave de modelo live.
Construye la imagen Docker del repositorio, inicia un servidor real de sondeo MCP stdio
dentro del contenedor, materializa ese servidor a través del entorno de ejecución MCP
incluido de Pi, ejecuta la herramienta y luego verifica que `coding` y `messaging` mantienen
las herramientas `bundle-mcp` mientras que `minimal` y `tools.deny: ["bundle-mcp"]` las filtran.
`test:docker:cron-mcp-cleanup` es determinista y no necesita una clave de modelo live.
Inicia un Gateway inicializado con un servidor real de sondeo MCP stdio, ejecuta un
turno aislado de Cron y un turno hijo puntual de `/subagents spawn`, y luego verifica
que el proceso hijo MCP sale después de cada ejecución.

Smoke manual de ACP en lenguaje natural para hilos (no CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantenga este script para flujos de trabajo de regresión/depuración. Puede volver a ser necesario para la validación del enrutamiento de hilos ACP, así que no lo elimine.

Variables de entorno útiles:

- `OPENCLAW_CONFIG_DIR=...` (predeterminado: `~/.openclaw`) montado en `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predeterminado: `~/.openclaw/workspace`) montado en `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predeterminado: `~/.profile`) montado en `/home/node/.profile` y cargado antes de ejecutar las pruebas
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar solo variables de entorno cargadas desde `OPENCLAW_PROFILE_FILE`, usando directorios temporales de configuración/espacio de trabajo y sin montajes externos de autenticación CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predeterminado: `~/.cache/openclaw/docker-cli-tools`) montado en `/home/node/.npm-global` para instalaciones CLI en caché dentro de Docker
- Los directorios/archivos externos de autenticación CLI bajo `$HOME` se montan en solo lectura bajo `/host-auth...`, luego se copian a `/home/node/...` antes de iniciar las pruebas
  - Directorios predeterminados: `.minimax`
  - Archivos predeterminados: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Las ejecuciones acotadas por proveedor montan solo los directorios/archivos necesarios inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sobrescriba manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o una lista separada por comas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para acotar la ejecución
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar proveedores dentro del contenedor
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar una imagen existente `openclaw:local-live` en reejecuciones que no necesiten recompilación
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para asegurarse de que las credenciales provienen del almacén de perfiles (no de env)
- `OPENCLAW_OPENWEBUI_MODEL=...` para elegir el modelo expuesto por el gateway para el smoke de Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para sobrescribir el prompt de comprobación de nonce usado por el smoke de Open WebUI
- `OPENWEBUI_IMAGE=...` para sobrescribir la etiqueta fijada de imagen de Open WebUI

## Comprobación rápida de la documentación

Ejecute las comprobaciones de documentación después de editar docs: `pnpm check:docs`.
Ejecute la validación completa de anclas de Mintlify cuando también necesite comprobaciones de encabezados dentro de la página: `pnpm docs:check-links:anchors`.

## Regresión sin conexión (segura para CI)

Estas son regresiones de “pipeline real” sin proveedores reales:

- Llamada de herramientas del Gateway (OpenAI mock, gateway real + bucle de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Asistente del Gateway (WS `wizard.start`/`wizard.next`, escritura aplicada de config + auth): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evaluaciones de fiabilidad de agentes (Skills)

Ya tenemos algunas pruebas seguras para CI que se comportan como “evaluaciones de fiabilidad de agentes”:

- Llamada de herramientas mock mediante el gateway real + bucle de agente (`src/gateway/gateway.test.ts`).
- Flujos end-to-end del asistente que validan el cableado de sesión y los efectos de configuración (`src/gateway/gateway.test.ts`).

Lo que aún falta para Skills (consulte [Skills](/es/tools/skills)):

- **Toma de decisiones:** cuando los Skills se enumeran en el prompt, ¿el agente elige el Skill correcto (o evita los irrelevantes)?
- **Cumplimiento:** ¿el agente lee `SKILL.md` antes de usarlo y sigue los pasos/args requeridos?
- **Contratos de flujo de trabajo:** escenarios de varios turnos que afirmen orden de herramientas, arrastre del historial de sesión y límites de sandbox.

Las futuras evaluaciones deberían seguir siendo deterministas primero:

- Un runner de escenarios que use proveedores mock para afirmar llamadas de herramientas + orden, lecturas de archivos Skill y cableado de sesión.
- Un pequeño conjunto de escenarios centrados en Skills (usar frente a evitar, compuertas, prompt injection).
- Evaluaciones live opcionales (opt-in, controladas por env) solo después de que la suite segura para CI esté en su sitio.

## Pruebas de contrato (forma de plugin y canal)

Las pruebas de contrato verifican que cada plugin y canal registrado se ajusta a su
contrato de interfaz. Iteran sobre todos los plugins descubiertos y ejecutan una suite de
afirmaciones de forma y comportamiento. El carril unitario predeterminado `pnpm test`
omite intencionadamente estos archivos compartidos de interfaz y smoke; ejecute
explícitamente los comandos de contrato cuando toque superficies compartidas de canal o proveedor.

### Comandos

- Todos los contratos: `pnpm test:contracts`
- Solo contratos de canal: `pnpm test:contracts:channels`
- Solo contratos de proveedor: `pnpm test:contracts:plugins`

### Contratos de canal

Ubicados en `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma básica del plugin (id, nombre, capacidades)
- **setup** - Contrato del asistente de configuración
- **session-binding** - Comportamiento de vínculo de sesión
- **outbound-payload** - Estructura de la carga útil del mensaje
- **inbound** - Manejo de mensajes entrantes
- **actions** - Manejadores de acciones del canal
- **threading** - Manejo de ID de hilo
- **directory** - API de directorio/lista
- **group-policy** - Aplicación de la política de grupo

### Contratos de estado del proveedor

Ubicados en `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondeos de estado del canal
- **registry** - Forma del registro de plugins

### Contratos de proveedor

Ubicados en `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato de flujo de autenticación
- **auth-choice** - Elección/selección de autenticación
- **catalog** - API de catálogo de modelos
- **discovery** - Descubrimiento de plugin
- **loader** - Carga de plugin
- **runtime** - Entorno de ejecución del proveedor
- **shape** - Forma/interfaz del plugin
- **wizard** - Asistente de configuración

### Cuándo ejecutarlas

- Después de cambiar exportaciones o subrutas del plugin-sdk
- Después de añadir o modificar un plugin de canal o proveedor
- Después de refactorizar el registro o descubrimiento de plugins

Las pruebas de contrato se ejecutan en CI y no requieren claves API reales.

## Añadir regresiones (guía)

Cuando corrija un problema de proveedor/modelo descubierto en live:

- Añada una regresión segura para CI si es posible (proveedor mock/stub, o capture la transformación exacta de forma de solicitud)
- Si es inherentemente solo live (límites de tasa, políticas de autenticación), mantenga la prueba live acotada y opt-in mediante variables de entorno
- Prefiera apuntar a la capa más pequeña que detecte el error:
  - error de conversión/repetición de solicitud del proveedor → prueba de modelos directos
  - error del pipeline de sesión/historial/herramientas del gateway → smoke live del gateway o prueba mock del gateway segura para CI
- Protección para recorrido de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un destino de muestra por clase SecretRef a partir de metadatos del registro (`listSecretTargetRegistryEntries()`), luego afirma que se rechazan los ids de ejecución de segmentos de recorrido.
  - Si añade una nueva familia de destinos SecretRef `includeInPlan` en `src/secrets/target-registry-data.ts`, actualice `classifyTargetClass` en esa prueba. La prueba falla intencionadamente en ids de destino no clasificados para que las nuevas clases no puedan omitirse silenciosamente.
