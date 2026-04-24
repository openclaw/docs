---
read_when:
    - Ejecutar pruebas localmente o en CI
    - Agregar pruebas de regresión para errores de modelo/proveedor
    - Depurar el comportamiento de Gateway y del agente
summary: 'Kit de pruebas: suites unitarias/e2e/en vivo, ejecutores de Docker y qué cubre cada prueba'
title: Pruebas
x-i18n:
    generated_at: "2026-04-24T08:58:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c88325e0edb49437e7faa2eaf730eb3be59054d8c4bb86e56a42bc39a29a2b1
    source_path: help/testing.md
    workflow: 15
---

OpenClaw tiene tres suites de Vitest (unitaria/integración, e2e, en vivo) y un pequeño conjunto
de ejecutores de Docker. Este documento es una guía de "cómo probamos":

- Qué cubre cada suite (y qué deliberadamente _no_ cubre).
- Qué comandos ejecutar para flujos de trabajo comunes (local, antes de hacer push, depuración).
- Cómo las pruebas en vivo detectan credenciales y seleccionan modelos/proveedores.
- Cómo agregar regresiones para problemas reales de modelos/proveedores.

## Inicio rápido

La mayoría de los días:

- Puerta de validación completa (se espera antes de hacer push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Ejecución local más rápida de la suite completa en una máquina con recursos suficientes: `pnpm test:max`
- Bucle directo de observación de Vitest: `pnpm test:watch`
- La selección directa por archivo ahora también enruta rutas de extensiones/canales: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefiera primero ejecuciones dirigidas cuando esté iterando sobre un único fallo.
- Sitio de QA respaldado por Docker: `pnpm qa:lab:up`
- Ruta de QA respaldada por VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Cuando modifica pruebas o desea confianza adicional:

- Puerta de cobertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Al depurar proveedores/modelos reales (requiere credenciales reales):

- Suite en vivo (modelos + sondas de herramientas/imágenes de Gateway): `pnpm test:live`
- Apuntar a un único archivo en vivo en silencio: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Barrido de modelos en vivo con Docker: `pnpm test:docker:live-models`
  - Cada modelo seleccionado ahora ejecuta un turno de texto más una pequeña sonda
    de estilo de lectura de archivos. Los modelos cuyos metadatos anuncian entrada
    `image` también ejecutan un pequeño turno de imagen.
    Desactive las sondas adicionales con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` al aislar fallos de proveedores.
  - Cobertura de CI: la comprobación diaria `OpenClaw Scheduled Live And E2E Checks` y la comprobación manual
    `OpenClaw Release Checks` llaman ambas al flujo de trabajo reutilizable de pruebas en vivo/E2E con
    `include_live_suites: true`, que incluye trabajos separados de matriz de modelos en vivo con Docker
    fragmentados por proveedor.
  - Para repeticiones enfocadas en CI, despache `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` y `live_models_only: true`.
  - Agregue nuevos secretos de proveedor de alta señal a `scripts/ci-hydrate-live-auth.sh`
    además de `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` y sus
    invocadores programados/de versión.
- Prueba de humo nativa de chat enlazado de Codex: `pnpm test:docker:live-codex-bind`
  - Ejecuta una ruta en vivo de Docker contra la ruta del servidor de aplicaciones de Codex, enlaza un
    DM sintético de Slack con `/codex bind`, ejercita `/codex fast` y
    `/codex permissions`, luego verifica que una respuesta simple y un adjunto de imagen
    se enrutan a través del enlace nativo del Plugin en lugar de ACP.
- Prueba de humo de costo de Moonshot/Kimi: con `MOONSHOT_API_KEY` configurada, ejecute
  `openclaw models list --provider moonshot --json`, luego ejecute un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  aislado contra `moonshot/kimi-k2.6`. Verifique que el JSON informe Moonshot/K2.6 y que la
  transcripción del asistente almacene `usage.cost` normalizado.

Consejo: cuando solo necesita un caso con fallo, prefiera restringir las pruebas en vivo mediante las variables de entorno de lista de permitidos descritas a continuación.

## Ejecutores específicos de QA

Estos comandos están junto a las suites principales de pruebas cuando necesita realismo de qa-lab:

CI ejecuta QA Lab en flujos de trabajo dedicados. `Parity gate` se ejecuta en PR coincidentes y
desde despacho manual con proveedores simulados. `QA-Lab - All Lanes` se ejecuta cada noche en
`main` y desde despacho manual con la puerta de paridad simulada, la ruta en vivo de Matrix y la
ruta en vivo de Telegram administrada por Convex como trabajos en paralelo. `OpenClaw Release Checks`
ejecuta las mismas rutas antes de la aprobación de la versión.

- `pnpm openclaw qa suite`
  - Ejecuta escenarios de QA respaldados por el repositorio directamente en el host.
  - Ejecuta varios escenarios seleccionados en paralelo de forma predeterminada con workers
    de Gateway aislados. `qa-channel` usa por defecto concurrencia 4 (limitada por la
    cantidad de escenarios seleccionados). Use `--concurrency <count>` para ajustar la cantidad
    de workers, o `--concurrency 1` para la ruta serial anterior.
  - Sale con un valor distinto de cero cuando falla cualquier escenario. Use `--allow-failures` cuando
    quiera artefactos sin un código de salida de fallo.
  - Admite modos de proveedor `live-frontier`, `mock-openai` y `aimock`.
    `aimock` inicia un servidor de proveedor local respaldado por AIMock para cobertura experimental
    de fixtures y simulación de protocolos sin reemplazar la ruta `mock-openai`
    con reconocimiento de escenarios.
- `pnpm openclaw qa suite --runner multipass`
  - Ejecuta la misma suite de QA dentro de una VM Linux desechable de Multipass.
  - Mantiene el mismo comportamiento de selección de escenarios que `qa suite` en el host.
  - Reutiliza las mismas opciones de selección de proveedor/modelo que `qa suite`.
  - Las ejecuciones en vivo reenvían las entradas de autenticación de QA compatibles que son prácticas para el invitado:
    claves de proveedor basadas en entorno, la ruta de configuración del proveedor en vivo de QA y `CODEX_HOME`
    cuando está presente.
  - Los directorios de salida deben permanecer bajo la raíz del repositorio para que el invitado pueda volver a escribir a través
    del espacio de trabajo montado.
  - Escribe el informe y resumen normales de QA, además de los registros de Multipass, en
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia el sitio de QA respaldado por Docker para trabajo de QA de estilo operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Compila un tarball npm a partir del checkout actual, lo instala globalmente en
    Docker, ejecuta una incorporación no interactiva con clave de API de OpenAI, configura Telegram
    de forma predeterminada, verifica que habilitar el plugin instala dependencias de tiempo de ejecución bajo demanda, ejecuta doctor, y ejecuta un turno de agente local contra un endpoint simulado de OpenAI.
  - Use `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para ejecutar la misma
    ruta de instalación empaquetada con Discord.
- `pnpm test:docker:npm-telegram-live`
  - Instala un paquete publicado de OpenClaw en Docker, ejecuta la incorporación
    de paquete instalado, configura Telegram a través de la CLI instalada y luego reutiliza
    la ruta de QA en vivo de Telegram con ese paquete instalado como Gateway SUT.
  - Usa `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` de forma predeterminada.
  - Usa las mismas credenciales de entorno de Telegram o la misma fuente de credenciales de Convex que
    `pnpm openclaw qa telegram`. Para automatización de CI/versiones, configure
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` junto con
    `OPENCLAW_QA_CONVEX_SITE_URL` y el secreto del rol. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` y un secreto de rol de Convex están presentes en CI,
    el envoltorio de Docker selecciona Convex automáticamente.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` reemplaza el valor compartido
    `OPENCLAW_QA_CREDENTIAL_ROLE` solo para esta ruta.
  - GitHub Actions expone esta ruta como el flujo de trabajo manual de mantenedor
    `NPM Telegram Beta E2E`. No se ejecuta al fusionar. El flujo de trabajo usa el
    entorno `qa-live-shared` y arrendamientos de credenciales de CI de Convex.
- `pnpm test:docker:bundled-channel-deps`
  - Empaqueta e instala la compilación actual de OpenClaw en Docker, inicia el Gateway
    con OpenAI configurado y luego habilita canales/Plugins incluidos mediante ediciones de configuración.
  - Verifica que el descubrimiento de la configuración deja ausentes las dependencias de tiempo de ejecución
    de Plugins sin configurar, que la primera ejecución configurada de Gateway o doctor instala bajo demanda las dependencias de tiempo de ejecución de cada Plugin incluido, y que un segundo reinicio no reinstala dependencias que ya fueron activadas.
  - También instala una versión base npm antigua conocida, habilita Telegram antes de ejecutar
    `openclaw update --tag <candidate>`, y verifica que el doctor posterior a la actualización del candidato repara las dependencias de tiempo de ejecución del canal incluido sin una reparación postinstall del lado del arnés.
- `pnpm openclaw qa aimock`
  - Inicia solo el servidor de proveedor local AIMock para pruebas de humo directas del protocolo.
- `pnpm openclaw qa matrix`
  - Ejecuta la ruta de QA en vivo de Matrix contra un homeserver Tuwunel desechable respaldado por Docker.
  - Este host de QA hoy es solo para repositorio/desarrollo. Las instalaciones empaquetadas de OpenClaw no incluyen
    `qa-lab`, por lo que no exponen `openclaw qa`.
  - Los checkouts del repositorio cargan el ejecutor incluido directamente; no se necesita un paso separado de instalación del Plugin.
  - Aprovisiona tres usuarios temporales de Matrix (`driver`, `sut`, `observer`) más una sala privada, luego inicia un proceso hijo del gateway de QA con el Plugin real de Matrix como transporte SUT.
  - Usa la imagen estable fijada de Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1` de forma predeterminada. Reemplácela con `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` cuando necesite probar otra imagen.
  - Matrix no expone banderas compartidas de fuente de credenciales porque la ruta aprovisiona usuarios desechables localmente.
  - Escribe un informe de QA de Matrix, un resumen, un artefacto de eventos observados y un registro combinado de salida estándar/error estándar en `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Ejecuta la ruta de QA en vivo de Telegram contra un grupo privado real usando los tokens del bot conductor y del bot SUT del entorno.
  - Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. El ID del grupo debe ser el ID numérico del chat de Telegram.
  - Admite `--credential-source convex` para credenciales compartidas agrupadas. Use el modo de entorno de forma predeterminada, o configure `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por arrendamientos agrupados.
  - Sale con un valor distinto de cero cuando falla cualquier escenario. Use `--allow-failures` cuando
    quiera artefactos sin un código de salida de fallo.
  - Requiere dos bots distintos en el mismo grupo privado, y el bot SUT debe exponer un nombre de usuario de Telegram.
  - Para una observación estable entre bots, habilite el modo Bot-to-Bot Communication en `@BotFather` para ambos bots y asegúrese de que el bot conductor pueda observar el tráfico de bots del grupo.
  - Escribe un informe de QA de Telegram, un resumen y un artefacto de mensajes observados en `.artifacts/qa-e2e/...`. Los escenarios con respuestas incluyen RTT desde la solicitud de envío del conductor hasta la respuesta observada del SUT.

Las rutas de transporte en vivo comparten un contrato estándar para que los nuevos transportes no diverjan:

`qa-channel` sigue siendo la suite amplia de QA sintética y no forma parte de la matriz de cobertura de transporte en vivo.

| Ruta     | Canary | Bloqueo por mención | Bloqueo de lista de permitidos | Respuesta de nivel superior | Reanudación tras reinicio | Seguimiento en hilo | Aislamiento de hilo | Observación de reacciones | Comando help |
| -------- | ------ | ------------------- | ------------------------------ | --------------------------- | ------------------------- | ------------------- | ------------------- | ------------------------- | ------------- |
| Matrix   | x      | x                   | x                              | x                           | x                         | x                   | x                   | x                         |               |
| Telegram | x      |                     |                                |                             |                           |                     |                     |                           | x            |

### Credenciales compartidas de Telegram mediante Convex (v1)

Cuando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
`openclaw qa telegram`, qa-lab adquiere un arrendamiento exclusivo de un grupo respaldado por Convex, envía heartbeats
para ese arrendamiento mientras la ruta está en ejecución y libera el arrendamiento al finalizar.

Andamiaje de referencia del proyecto Convex:

- `qa/convex-credential-broker/`

Variables de entorno requeridas:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por ejemplo `https://your-deployment.convex.site`)
- Un secreto para el rol seleccionado:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Selección del rol de credencial:
  - CLI: `--credential-role maintainer|ci`
  - Valor predeterminado del entorno: `OPENCLAW_QA_CREDENTIAL_ROLE` (usa `ci` de forma predeterminada en CI, `maintainer` en caso contrario)

Variables de entorno opcionales:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (valor predeterminado `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (valor predeterminado `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (valor predeterminado `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (valor predeterminado `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (valor predeterminado `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (ID de rastreo opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs de Convex `http://` de loopback solo para desarrollo local.

`OPENCLAW_QA_CONVEX_SITE_URL` debe usar `https://` en funcionamiento normal.

Los comandos administrativos de mantenedor (agregar/quitar/listar grupos) requieren
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` específicamente.

Ayudantes de CLI para mantenedores:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Use `--json` para salida legible por máquina en scripts y utilidades de CI.

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
  - Protección de arrendamiento activo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo secreto de maintainer)
  - Solicitud: `{ kind?, status?, includePayload?, limit? }`
  - Éxito: `{ status: "ok", credentials, count }`

Forma de `payload` para el tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` debe ser una cadena con el id numérico del chat de Telegram.
- `admin/add` valida esta forma para `kind: "telegram"` y rechaza `payloads` mal formados.

### Agregar un canal a QA

Agregar un canal al sistema de QA en Markdown requiere exactamente dos cosas:

1. Un adaptador de transporte para el canal.
2. Un paquete de escenarios que ejercite el contrato del canal.

No agregue una nueva raíz de comando de QA de nivel superior cuando el host compartido `qa-lab` pueda
ser el propietario del flujo.

`qa-lab` es propietario de la mecánica compartida del host:

- la raíz de comando `openclaw qa`
- el arranque y desmontaje de la suite
- la concurrencia de workers
- la escritura de artefactos
- la generación de informes
- la ejecución de escenarios
- alias de compatibilidad para escenarios antiguos de `qa-channel`

Los Plugins de ejecutor son propietarios del contrato de transporte:

- cómo `openclaw qa <runner>` se monta bajo la raíz compartida `qa`
- cómo se configura el Gateway para ese transporte
- cómo se comprueba la preparación
- cómo se inyectan los eventos de entrada
- cómo se observan los mensajes salientes
- cómo se exponen las transcripciones y el estado de transporte normalizado
- cómo se ejecutan las acciones respaldadas por transporte
- cómo se maneja el restablecimiento o limpieza específicos del transporte

El umbral mínimo de adopción para un canal nuevo es:

1. Mantener `qa-lab` como propietario de la raíz compartida `qa`.
2. Implementar el ejecutor de transporte sobre la interfaz compartida del host `qa-lab`.
3. Mantener la mecánica específica del transporte dentro del Plugin de ejecutor o del arnés del canal.
4. Montar el ejecutor como `openclaw qa <runner>` en lugar de registrar una raíz de comando competidora.
   Los Plugins de ejecutor deben declarar `qaRunners` en `openclaw.plugin.json` y exportar una matriz `qaRunnerCliRegistrations` coincidente desde `runtime-api.ts`.
   Mantenga `runtime-api.ts` ligero; la CLI diferida y la ejecución del ejecutor deben permanecer detrás de puntos de entrada separados.
5. Crear o adaptar escenarios de Markdown bajo los directorios temáticos `qa/scenarios/`.
6. Usar los ayudantes de escenarios genéricos para escenarios nuevos.
7. Mantener en funcionamiento los alias de compatibilidad existentes, a menos que el repositorio esté realizando una migración intencionada.

La regla de decisión es estricta:

- Si el comportamiento puede expresarse una vez en `qa-lab`, colóquelo en `qa-lab`.
- Si el comportamiento depende de un transporte de canal, manténgalo en ese Plugin de ejecutor o arnés del Plugin.
- Si un escenario necesita una capacidad nueva que más de un canal puede usar, agregue un ayudante genérico en lugar de una rama específica del canal en `suite.ts`.
- Si un comportamiento solo tiene sentido para un transporte, mantenga el escenario específico del transporte y hágalo explícito en el contrato del escenario.

Los nombres de ayudantes genéricos preferidos para escenarios nuevos son:

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

El trabajo en canales nuevos debe usar los nombres de ayudantes genéricos.
Los alias de compatibilidad existen para evitar una migración total en un solo día, no como el modelo para
la creación de escenarios nuevos.

## Suites de pruebas (qué se ejecuta y dónde)

Piense en las suites como “realismo creciente” (y también mayor inestabilidad/costo):

### Unitaria / integración (predeterminada)

- Comando: `pnpm test`
- Configuración: las ejecuciones no dirigidas usan el conjunto de fragmentos `vitest.full-*.config.ts` y pueden expandir fragmentos multiproyecto en configuraciones por proyecto para programación en paralelo
- Archivos: inventarios de núcleo/unitarios en `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` y las pruebas Node de `ui` incluidas en la lista permitida cubiertas por `vitest.unit.config.ts`
- Alcance:
  - Pruebas unitarias puras
  - Pruebas de integración en proceso (autenticación de Gateway, enrutamiento, herramientas, análisis, configuración)
  - Regresiones deterministas para errores conocidos
- Expectativas:
  - Se ejecuta en CI
  - No requiere claves reales
  - Debe ser rápida y estable
    <AccordionGroup>
    <Accordion title="Proyectos, fragmentos y rutas acotadas"> - Las ejecuciones no dirigidas de `pnpm test` usan doce configuraciones de fragmentos más pequeñas (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) en lugar de un único proceso raíz nativo gigante. Esto reduce el RSS máximo en máquinas cargadas y evita que el trabajo de auto-reply/extensiones perjudique suites no relacionadas. - `pnpm test --watch` sigue usando el gráfico de proyectos raíz nativo de `vitest.config.ts`, porque un bucle de observación con múltiples fragmentos no es práctico. - `pnpm test`, `pnpm test:watch` y `pnpm test:perf:imports` enrutan primero los destinos explícitos de archivos/directorios mediante rutas acotadas, de modo que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar el costo completo de arranque del proyecto raíz. - `pnpm test:changed` expande las rutas git modificadas a esas mismas rutas acotadas cuando la diferencia solo toca archivos fuente/de prueba enrutable; las ediciones de configuración/preparación siguen recurriendo a la reejecución amplia del proyecto raíz. - `pnpm check:changed` es la puerta local inteligente normal para trabajo acotado. Clasifica la diferencia en núcleo, pruebas del núcleo, extensiones, pruebas de extensiones, aplicaciones, documentación, metadatos de versión y herramientas, y luego ejecuta las rutas correspondientes de typecheck/lint/test. Los cambios del SDK público de Plugin y del contrato de Plugin incluyen una pasada de validación de extensión porque las extensiones dependen de esos contratos del núcleo. Los aumentos de versión solo en metadatos de versión ejecutan comprobaciones dirigidas de versión/configuración/dependencias raíz en lugar de la suite completa, con una protección que rechaza cambios de paquetes fuera del campo de versión de nivel superior. - Las pruebas unitarias ligeras en importaciones de agentes, comandos, Plugins, ayudantes de auto-reply, `plugin-sdk` y áreas similares de utilidades puras pasan por la ruta `unit-fast`, que omite `test/setup-openclaw-runtime.ts`; los archivos con mucho estado o mucho tiempo de ejecución permanecen en las rutas existentes. - Los archivos fuente ayudantes seleccionados de `plugin-sdk` y `commands` también asignan las ejecuciones de modo cambiado a pruebas hermanas explícitas en esas rutas ligeras, de modo que las ediciones de ayudantes evitan volver a ejecutar toda la suite pesada para ese directorio. - `auto-reply` tiene tres bloques dedicados: ayudantes de nivel superior del núcleo, pruebas de integración `reply.*` de nivel superior y el subárbol `src/auto-reply/reply/**`. Esto mantiene el trabajo más pesado del arnés de respuesta fuera de las pruebas baratas de estado/chunk/token.
    </Accordion>

      <Accordion title="Cobertura del ejecutor integrado">
        - Cuando cambie entradas de descubrimiento de herramientas de mensajes o el
          contexto de tiempo de ejecución de Compaction, mantenga ambos niveles de cobertura.
        - Agregue regresiones de ayudantes enfocadas para límites puros de enrutamiento y normalización.
        - Mantenga sanas las suites de integración del ejecutor integrado:
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
          `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` y
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
        - Esas suites verifican que los ids acotados y el comportamiento de Compaction sigan
          fluyendo a través de las rutas reales `run.ts` / `compact.ts`; las pruebas solo de ayudantes
          no son un sustituto suficiente para esas rutas de integración.
      </Accordion>

      <Accordion title="Valores predeterminados del pool y aislamiento de Vitest">
        - La configuración base de Vitest usa `threads` de forma predeterminada.
        - La configuración compartida de Vitest fija `isolate: false` y usa el
          ejecutor no aislado en los proyectos raíz, e2e y en vivo.
        - La ruta raíz de UI mantiene su configuración y optimizador de `jsdom`, pero también se ejecuta en el
          ejecutor compartido no aislado.
        - Cada fragmento de `pnpm test` hereda los mismos valores predeterminados
          `threads` + `isolate: false` de la configuración compartida de Vitest.
        - `scripts/run-vitest.mjs` agrega `--no-maglev` para los procesos Node hijo de Vitest
          de forma predeterminada para reducir la rotación de compilación de V8 durante grandes ejecuciones locales.
          Configure `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar con el
          comportamiento estándar de V8.
      </Accordion>

      <Accordion title="Iteración local rápida">
        - `pnpm changed:lanes` muestra qué rutas arquitectónicas activa una diferencia.
        - El hook pre-commit es solo de formato. Vuelve a preparar los archivos formateados y
          no ejecuta lint, typecheck ni pruebas.
        - Ejecute `pnpm check:changed` explícitamente antes de entregar o hacer push cuando
          necesite la puerta local inteligente. Los cambios del SDK público de Plugin y del contrato de Plugin
          incluyen una pasada de validación de extensión.
        - `pnpm test:changed` enruta a través de rutas acotadas cuando las rutas modificadas
          se asignan limpiamente a una suite más pequeña.
        - `pnpm test:max` y `pnpm test:changed:max` mantienen el mismo comportamiento de enrutamiento,
          solo con un límite de workers más alto.
        - El escalado automático de workers locales es intencionadamente conservador y retrocede
          cuando la carga promedio del host ya es alta, por lo que múltiples ejecuciones concurrentes
          de Vitest hacen menos daño de forma predeterminada.
        - La configuración base de Vitest marca los proyectos/archivos de configuración como
          `forceRerunTriggers` para que las reejecuciones en modo cambiado sigan siendo correctas cuando cambia
          el cableado de pruebas.
        - La configuración mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado en
          hosts compatibles; configure `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si desea
          una ubicación de caché explícita para perfiles directos.
      </Accordion>

      <Accordion title="Depuración de rendimiento">
        - `pnpm test:perf:imports` habilita el informe de duración de importaciones de Vitest más
          la salida del desglose de importaciones.
        - `pnpm test:perf:imports:changed` limita la misma vista de perfilado a
          archivos modificados desde `origin/main`.
        - Cuando una prueba caliente sigue dedicando la mayor parte de su tiempo a importaciones de inicio,
          mantenga las dependencias pesadas detrás de una interfaz local estrecha `*.runtime.ts` y
          simule esa interfaz directamente en lugar de importar profundamente ayudantes de tiempo de ejecución solo
          para pasarlos a través de `vi.mock(...)`.
        - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara el
          `test:changed` enrutado con la ruta nativa del proyecto raíz para esa diferencia confirmada
          e imprime el tiempo total más el RSS máximo en macOS.
        - `pnpm test:perf:changed:bench -- --worktree` evalúa el árbol sucio actual
          enrutando la lista de archivos modificados a través de
          `scripts/test-projects.mjs` y la configuración raíz de Vitest.
        - `pnpm test:perf:profile:main` escribe un perfil de CPU del hilo principal para
          el costo de inicio y transformación de Vitest/Vite.
        - `pnpm test:perf:profile:runner` escribe perfiles de CPU+heap del ejecutor para la
          suite unitaria con el paralelismo de archivos deshabilitado.
      </Accordion>
    </AccordionGroup>

### Estabilidad (gateway)

- Comando: `pnpm test:stability:gateway`
- Configuración: `vitest.gateway.config.ts`, forzado a un worker
- Alcance:
  - Inicia un Gateway loopback real con diagnósticos habilitados de forma predeterminada
  - Impulsa rotación sintética de mensajes, memoria y cargas grandes del gateway a través de la ruta de eventos de diagnóstico
  - Consulta `diagnostics.stability` a través del RPC WS de Gateway
  - Cubre los ayudantes de persistencia del paquete de estabilidad de diagnóstico
  - Verifica que el registrador permanezca acotado, que las muestras sintéticas de RSS se mantengan por debajo del presupuesto de presión y que las profundidades de cola por sesión vuelvan a cero
- Expectativas:
  - Seguro para CI y sin claves
  - Ruta estrecha para seguimiento de regresiones de estabilidad, no un sustituto de la suite completa de Gateway

### E2E (prueba de humo de gateway)

- Comando: `pnpm test:e2e`
- Configuración: `vitest.e2e.config.ts`
- Archivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` y pruebas E2E de Plugins incluidos en `extensions/`
- Valores predeterminados de tiempo de ejecución:
  - Usa `threads` de Vitest con `isolate: false`, igual que el resto del repositorio.
  - Usa workers adaptativos (CI: hasta 2, local: 1 de forma predeterminada).
  - Se ejecuta en modo silencioso de forma predeterminada para reducir la sobrecarga de E/S de consola.
- Reemplazos útiles:
  - `OPENCLAW_E2E_WORKERS=<n>` para forzar la cantidad de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para volver a habilitar la salida detallada de consola.
- Alcance:
  - Comportamiento e2e de varias instancias de gateway
  - Superficies WebSocket/HTTP, emparejamiento de Nodes y redes más pesadas
- Expectativas:
  - Se ejecuta en CI (cuando está habilitado en la canalización)
  - No requiere claves reales
  - Tiene más piezas móviles que las pruebas unitarias (puede ser más lenta)

### E2E: prueba de humo del backend de OpenShell

- Comando: `pnpm test:e2e:openshell`
- Archivo: `extensions/openshell/src/backend.e2e.test.ts`
- Alcance:
  - Inicia un gateway OpenShell aislado en el host mediante Docker
  - Crea un sandbox a partir de un Dockerfile local temporal
  - Ejercita el backend OpenShell de OpenClaw sobre `sandbox ssh-config` + ejecución SSH reales
  - Verifica el comportamiento del sistema de archivos canónico remoto a través del puente fs del sandbox
- Expectativas:
  - Solo de participación voluntaria; no forma parte de la ejecución predeterminada de `pnpm test:e2e`
  - Requiere una CLI local `openshell` más un daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` aislados y luego destruye el gateway y el sandbox de prueba
- Reemplazos útiles:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar la prueba al ejecutar manualmente la suite e2e más amplia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apuntar a un binario CLI no predeterminado o a un script envoltorio

### En vivo (proveedores reales + modelos reales)

- Comando: `pnpm test:live`
- Configuración: `vitest.live.config.ts`
- Archivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` y pruebas en vivo de Plugins incluidos en `extensions/`
- Predeterminado: **habilitado** por `pnpm test:live` (establece `OPENCLAW_LIVE_TEST=1`)
- Alcance:
  - “¿Este proveedor/modelo realmente funciona _hoy_ con credenciales reales?”
  - Detecta cambios de formato del proveedor, peculiaridades de llamada de herramientas, problemas de autenticación y comportamiento de límites de tasa
- Expectativas:
  - No es estable para CI por diseño (redes reales, políticas reales de proveedores, cuotas, interrupciones)
  - Cuesta dinero / consume límites de tasa
  - Prefiera ejecutar subconjuntos acotados en lugar de “todo”
- Las ejecuciones en vivo obtienen `~/.profile` para recoger claves API faltantes.
- De forma predeterminada, las ejecuciones en vivo siguen aislando `HOME` y copian el material de configuración/autenticación a un directorio temporal de inicio de prueba para que los fixtures unitarios no puedan mutar su `~/.openclaw` real.
- Configure `OPENCLAW_LIVE_USE_REAL_HOME=1` solo cuando necesite intencionadamente que las pruebas en vivo usen su directorio home real.
- `pnpm test:live` ahora usa por defecto un modo más silencioso: mantiene la salida de progreso `[live] ...`, pero suprime el aviso adicional de `~/.profile` y silencia los registros de arranque de gateway/Bonjour. Configure `OPENCLAW_LIVE_TEST_QUIET=0` si quiere recuperar los registros de inicio completos.
- Rotación de claves API (específica por proveedor): configure `*_API_KEYS` con formato separado por comas/punto y coma o `*_API_KEY_1`, `*_API_KEY_2` (por ejemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) o un reemplazo por prueba en vivo mediante `OPENCLAW_LIVE_*_KEY`; las pruebas reintentan ante respuestas de límite de tasa.
- Salida de progreso/Heartbeat:
  - Las suites en vivo ahora emiten líneas de progreso a stderr para que las llamadas largas a proveedores se vean activas incluso cuando la captura de consola de Vitest está en modo silencioso.
  - `vitest.live.config.ts` deshabilita la interceptación de consola de Vitest para que las líneas de progreso del proveedor/gateway se transmitan inmediatamente durante las ejecuciones en vivo.
  - Ajuste los heartbeats de modelo directo con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste los heartbeats de gateway/probe con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## ¿Qué suite debo ejecutar?

Use esta tabla de decisión:

- Si edita lógica/pruebas: ejecute `pnpm test` (y `pnpm test:coverage` si cambió mucho)
- Si toca redes de gateway / protocolo WS / emparejamiento: agregue `pnpm test:e2e`
- Si depura “mi bot está caído” / fallos específicos del proveedor / llamada de herramientas: ejecute un `pnpm test:live` acotado

## Pruebas en vivo (que tocan la red)

Para la matriz de modelos en vivo, las pruebas de humo del backend de la CLI, las pruebas de humo de ACP, el arnés
del servidor de aplicaciones de Codex y todas las pruebas en vivo de proveedores multimedia (Deepgram, BytePlus, ComfyUI, imagen,
música, video, arnés multimedia), además del manejo de credenciales para ejecuciones en vivo, consulte
[Pruebas — suites en vivo](/es/help/testing-live).

## Ejecutores de Docker (comprobaciones opcionales de "funciona en Linux")

Estos ejecutores de Docker se dividen en dos grupos:

- Ejecutores de modelos en vivo: `test:docker:live-models` y `test:docker:live-gateway` ejecutan solo su archivo en vivo de clave de perfil coincidente dentro de la imagen Docker del repositorio (`src/agents/models.profiles.live.test.ts` y `src/gateway/gateway-models.profiles.live.test.ts`), montando su directorio local de configuración y espacio de trabajo (y obteniendo `~/.profile` si está montado). Los puntos de entrada locales coincidentes son `test:live:models-profiles` y `test:live:gateway-profiles`.
- Los ejecutores Docker en vivo usan por defecto un límite de humo más pequeño para que un barrido completo en Docker siga siendo práctico:
  `test:docker:live-models` usa de forma predeterminada `OPENCLAW_LIVE_MAX_MODELS=12`, y
  `test:docker:live-gateway` usa de forma predeterminada `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, y
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Reemplace esas variables de entorno cuando
  quiera explícitamente el análisis exhaustivo más amplio.
- `test:docker:all` compila una vez la imagen Docker en vivo mediante `test:docker:live-build`, luego la reutiliza para las dos rutas Docker en vivo. También compila una imagen compartida `scripts/e2e/Dockerfile` mediante `test:docker:e2e-build` y la reutiliza para los ejecutores de humo E2E en contenedor que ejercitan la aplicación compilada.
- Ejecutores de humo en contenedor: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` y `test:docker:config-reload` inician uno o más contenedores reales y verifican rutas de integración de nivel superior.

Los ejecutores Docker de modelos en vivo también montan solo los homes de autenticación de CLI necesarios (o todos los compatibles cuando la ejecución no está acotada), luego los copian al home del contenedor antes de la ejecución para que OAuth de CLI externa pueda actualizar tokens sin mutar el almacén de autenticación del host:

- Modelos directos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Prueba de humo de enlace ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Prueba de humo del backend de la CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Prueba de humo del arnés del servidor de aplicaciones de Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desarrollo: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Prueba de humo en vivo de Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Asistente de incorporación (TTY, andamiaje completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Prueba de humo de incorporación/canal/agente con tarball npm: `pnpm test:docker:npm-onboard-channel-agent` instala globalmente en Docker el tarball empaquetado de OpenClaw, configura OpenAI mediante incorporación por referencia de entorno más Telegram de forma predeterminada, verifica que doctor repara las dependencias de tiempo de ejecución activadas del Plugin y ejecuta un turno de agente simulado de OpenAI. Reutilice un tarball precompilado con `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omita la recompilación del host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, o cambie el canal con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Prueba de humo de instalación global con Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empaqueta el árbol actual, lo instala con `bun install -g` en un home aislado y verifica que `openclaw infer image providers --json` devuelve proveedores de imagen incluidos en lugar de quedarse colgado. Reutilice un tarball precompilado con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omita la compilación del host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, o copie `dist/` desde una imagen Docker compilada con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Prueba de humo del instalador en Docker: `bash scripts/test-install-sh-docker.sh` comparte una caché npm entre sus contenedores root, update y direct-npm. La prueba de humo de actualización usa por defecto npm `latest` como línea base estable antes de actualizar al tarball candidato. Las comprobaciones del instalador sin root mantienen una caché npm aislada para que las entradas de caché propiedad de root no enmascaren el comportamiento de instalación local del usuario. Configure `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar la caché root/update/direct-npm en reejecuciones locales.
- Install Smoke CI omite la actualización global directa duplicada de npm con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; ejecute el script localmente sin ese entorno cuando se necesite cobertura de `npm install -g` directo.
- Redes de Gateway (dos contenedores, autenticación WS + estado): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Regresión mínima de razonamiento de `web_search` de OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) ejecuta un servidor OpenAI simulado a través de Gateway, verifica que `web_search` eleva `reasoning.effort` de `minimal` a `low`, luego fuerza el rechazo del esquema del proveedor y comprueba que el detalle sin procesar aparece en los registros de Gateway.
- Puente de canal MCP (Gateway precargado + puente stdio + prueba de humo de tramas de notificación sin procesar de Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Herramientas MCP del paquete Pi (servidor MCP stdio real + prueba de humo de permitir/denegar del perfil Pi integrado): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Limpieza MCP de Cron/subagente (Gateway real + desmontaje del proceso hijo MCP stdio tras ejecuciones aisladas de cron y subagente de una sola vez): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (prueba de humo de instalación + alias `/plugin` + semántica de reinicio de Claude-bundle): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
- Prueba de humo de actualización de Plugin sin cambios: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Prueba de humo de metadatos de recarga de configuración: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Dependencias de tiempo de ejecución de Plugins incluidos: `pnpm test:docker:bundled-channel-deps` compila por defecto una pequeña imagen de ejecutor Docker, compila y empaqueta OpenClaw una vez en el host y luego monta ese tarball en cada escenario de instalación de Linux. Reutilice la imagen con `OPENCLAW_SKIP_DOCKER_BUILD=1`, omita la recompilación del host tras una compilación local reciente con `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, o apunte a un tarball existente con `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Limite las dependencias de tiempo de ejecución de Plugins incluidos mientras itera deshabilitando escenarios no relacionados, por ejemplo:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Para precompilar y reutilizar manualmente la imagen compartida de la aplicación compilada:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Los reemplazos de imagen específicos de la suite, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, siguen teniendo prioridad cuando se configuran. Cuando `OPENCLAW_SKIP_DOCKER_BUILD=1` apunta a una imagen remota compartida, los scripts la descargan si aún no está disponible localmente. Las pruebas Docker de QR e instalador mantienen sus propios Dockerfiles porque validan el comportamiento de empaquetado/instalación en lugar del tiempo de ejecución compartido de la aplicación compilada.

Los ejecutores Docker de modelos en vivo también montan el checkout actual en modo de solo lectura y
lo preparan en un directorio de trabajo temporal dentro del contenedor. Esto mantiene la
imagen de tiempo de ejecución ligera y, al mismo tiempo, ejecuta Vitest contra su código/configuración local exacta.
El paso de preparación omite grandes cachés solo locales y salidas de compilación de la aplicación como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` y directorios locales de `.build` o
salida de Gradle para que las ejecuciones en vivo en Docker no pasen minutos copiando
artefactos específicos de la máquina.
También configuran `OPENCLAW_SKIP_CHANNELS=1` para que las sondas en vivo de gateway no inicien
workers reales de canales de Telegram/Discord/etc. dentro del contenedor.
`test:docker:live-models` sigue ejecutando `pnpm test:live`, así que transfiera también
`OPENCLAW_LIVE_GATEWAY_*` cuando necesite limitar o excluir la cobertura en vivo
de gateway de esa ruta de Docker.
`test:docker:openwebui` es una prueba de humo de compatibilidad de nivel superior: inicia un
contenedor Gateway de OpenClaw con los endpoints HTTP compatibles con OpenAI habilitados,
inicia un contenedor fijado de Open WebUI contra ese gateway, inicia sesión a través de
Open WebUI, verifica que `/api/models` expone `openclaw/default` y luego envía una
solicitud de chat real a través del proxy `/api/chat/completions` de Open WebUI.
La primera ejecución puede ser notablemente más lenta porque Docker puede necesitar descargar la
imagen de Open WebUI y Open WebUI puede necesitar completar su propia configuración de inicio en frío.
Esta ruta espera una clave de modelo en vivo utilizable, y `OPENCLAW_PROFILE_FILE`
(`~/.profile` de forma predeterminada) es la forma principal de proporcionarla en ejecuciones con Docker.
Las ejecuciones correctas imprimen una pequeña carga JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` es intencionadamente determinista y no necesita una
cuenta real de Telegram, Discord o iMessage. Inicia un contenedor Gateway
precargado, inicia un segundo contenedor que lanza `openclaw mcp serve`, luego
verifica el descubrimiento de conversaciones enrutadas, lecturas de transcripciones, metadatos de adjuntos,
comportamiento de la cola de eventos en vivo, enrutamiento de envíos salientes y notificaciones de canales +
permisos de estilo Claude sobre el puente MCP stdio real. La comprobación de notificaciones
inspecciona directamente las tramas MCP stdio sin procesar para que la prueba de humo valide lo que
el puente realmente emite, no solo lo que una SDK cliente específica expone por casualidad.
`test:docker:pi-bundle-mcp-tools` es determinista y no necesita una clave de modelo
en vivo. Compila la imagen Docker del repositorio, inicia un servidor de sondeo MCP stdio real
dentro del contenedor, materializa ese servidor a través del tiempo de ejecución MCP
del paquete Pi integrado, ejecuta la herramienta y luego verifica que `coding` y `messaging` mantengan
las herramientas `bundle-mcp`, mientras que `minimal` y `tools.deny: ["bundle-mcp"]` las filtran.
`test:docker:cron-mcp-cleanup` es determinista y no necesita una clave de modelo
en vivo. Inicia un Gateway precargado con un servidor de sondeo MCP stdio real, ejecuta un
turno aislado de cron y un turno hijo puntual de `/subagents spawn`, y luego verifica
que el proceso hijo MCP salga después de cada ejecución.

Prueba manual de humo de hilo ACP en lenguaje simple (no CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantenga este script para flujos de trabajo de regresión/depuración. Puede volver a ser necesario para la validación del enrutamiento de hilos ACP, así que no lo elimine.

Variables de entorno útiles:

- `OPENCLAW_CONFIG_DIR=...` (predeterminado: `~/.openclaw`) montado en `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predeterminado: `~/.openclaw/workspace`) montado en `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predeterminado: `~/.profile`) montado en `/home/node/.profile` y cargado antes de ejecutar las pruebas
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar solo las variables de entorno cargadas desde `OPENCLAW_PROFILE_FILE`, usando directorios temporales de configuración/espacio de trabajo y sin montajes externos de autenticación de CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predeterminado: `~/.cache/openclaw/docker-cli-tools`) montado en `/home/node/.npm-global` para instalaciones de CLI en caché dentro de Docker
- Los directorios/archivos de autenticación de CLI externos bajo `$HOME` se montan en modo de solo lectura bajo `/host-auth...`, luego se copian a `/home/node/...` antes de iniciar las pruebas
  - Directorios predeterminados: `.minimax`
  - Archivos predeterminados: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Las ejecuciones limitadas por proveedor montan solo los directorios/archivos necesarios inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Reemplazo manual con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, o una lista separada por comas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para limitar la ejecución
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar proveedores dentro del contenedor
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar una imagen existente `openclaw:local-live` en reejecuciones que no necesiten recompilación
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantizar que las credenciales provengan del almacén de perfiles (no del entorno)
- `OPENCLAW_OPENWEBUI_MODEL=...` para elegir el modelo expuesto por el gateway para la prueba de humo de Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para reemplazar el prompt de comprobación de nonce usado por la prueba de humo de Open WebUI
- `OPENWEBUI_IMAGE=...` para reemplazar la etiqueta fijada de la imagen de Open WebUI

## Comprobación básica de documentación

Ejecute comprobaciones de documentación después de editar documentos: `pnpm check:docs`.
Ejecute la validación completa de anchors de Mintlify cuando también necesite comprobar encabezados dentro de la página: `pnpm docs:check-links:anchors`.

## Regresión sin conexión (segura para CI)

Estas son regresiones de “canalización real” sin proveedores reales:

- Llamada de herramientas de Gateway (OpenAI simulado, gateway real + bucle de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Asistente de Gateway (WS `wizard.start`/`wizard.next`, escribe configuración + autenticación aplicada): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evaluaciones de confiabilidad del agente (Skills)

Ya tenemos algunas pruebas seguras para CI que se comportan como “evaluaciones de confiabilidad del agente”:

- Llamada simulada de herramientas a través del bucle real de gateway + agente (`src/gateway/gateway.test.ts`).
- Flujos de asistente end-to-end que validan el cableado de sesión y los efectos de la configuración (`src/gateway/gateway.test.ts`).

Lo que todavía falta para Skills (consulte [Skills](/es/tools/skills)):

- **Toma de decisiones:** cuando los Skills aparecen en el prompt, ¿el agente elige el Skill correcto (o evita los irrelevantes)?
- **Cumplimiento:** ¿el agente lee `SKILL.md` antes de usarlo y sigue los pasos/argumentos requeridos?
- **Contratos de flujo de trabajo:** escenarios de varios turnos que verifican el orden de las herramientas, el arrastre del historial de sesión y los límites del sandbox.

Las evaluaciones futuras deben seguir siendo deterministas primero:

- Un ejecutor de escenarios que use proveedores simulados para verificar llamadas de herramientas + orden, lecturas de archivos de Skills y cableado de sesión.
- Un pequeño conjunto de escenarios centrados en Skills (usar vs evitar, compuertas, inyección de prompts).
- Evaluaciones en vivo opcionales (participación voluntaria, controladas por entorno) solo después de que la suite segura para CI esté implementada.

## Pruebas de contrato (forma de Plugin y canal)

Las pruebas de contrato verifican que cada Plugin y canal registrados cumplan su
contrato de interfaz. Iteran sobre todos los Plugins descubiertos y ejecutan un conjunto de
verificaciones de forma y comportamiento. La ruta unitaria predeterminada `pnpm test`
omite intencionadamente estos archivos compartidos de interfaz y pruebas de humo; ejecute los comandos de contrato explícitamente
cuando toque superficies compartidas de canal o proveedor.

### Comandos

- Todos los contratos: `pnpm test:contracts`
- Solo contratos de canales: `pnpm test:contracts:channels`
- Solo contratos de proveedores: `pnpm test:contracts:plugins`

### Contratos de canales

Ubicados en `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma básica del Plugin (id, nombre, capacidades)
- **setup** - Contrato del asistente de configuración
- **session-binding** - Comportamiento de vinculación de sesión
- **outbound-payload** - Estructura de carga del mensaje
- **inbound** - Manejo de mensajes entrantes
- **actions** - Manejadores de acciones del canal
- **threading** - Manejo del ID de hilo
- **directory** - API de directorio/lista
- **group-policy** - Aplicación de la política de grupo

### Contratos de estado del proveedor

Ubicados en `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondas de estado del canal
- **registry** - Forma del registro de Plugins

### Contratos de proveedores

Ubicados en `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato del flujo de autenticación
- **auth-choice** - Opción/selección de autenticación
- **catalog** - API del catálogo de modelos
- **discovery** - Descubrimiento de Plugins
- **loader** - Carga de Plugins
- **runtime** - Tiempo de ejecución del proveedor
- **shape** - Forma/interfaz del Plugin
- **wizard** - Asistente de configuración

### Cuándo ejecutarlas

- Después de cambiar exportaciones o subrutas de plugin-sdk
- Después de agregar o modificar un Plugin de canal o proveedor
- Después de refactorizar el registro o descubrimiento de Plugins

Las pruebas de contrato se ejecutan en CI y no requieren claves API reales.

## Agregar regresiones (guía)

Cuando corrija un problema de proveedor/modelo descubierto en vivo:

- Agregue una regresión segura para CI si es posible (proveedor simulado/stub, o capture la transformación exacta de la forma de la solicitud)
- Si es intrínsecamente solo en vivo (límites de tasa, políticas de autenticación), mantenga la prueba en vivo acotada y de participación voluntaria mediante variables de entorno
- Prefiera apuntar a la capa más pequeña que detecte el error:
  - error de conversión/repetición de solicitud del proveedor → prueba de modelos directos
  - error de sesión/historial/bucle de herramientas del gateway → prueba de humo en vivo del gateway o prueba simulada del gateway segura para CI
- Protección de recorrido de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un destino de muestra por clase de SecretRef a partir de los metadatos del registro (`listSecretTargetRegistryEntries()`), y luego verifica que se rechacen los ids de ejecución de segmentos de recorrido.
  - Si agrega una nueva familia de destinos SecretRef `includeInPlan` en `src/secrets/target-registry-data.ts`, actualice `classifyTargetClass` en esa prueba. La prueba falla intencionadamente con ids de destino sin clasificar para que las clases nuevas no puedan omitirse silenciosamente.

## Relacionado

- [Pruebas en vivo](/es/help/testing-live)
- [CI](/es/ci)
