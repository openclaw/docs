---
read_when:
    - Ejecutar pruebas localmente o en CI
    - Añadir regresiones para errores de modelo/proveedor
    - Depurar el comportamiento de gateway + agente
summary: 'Kit de pruebas: suites unit/e2e/live, ejecutores de Docker y qué cubre cada prueba'
title: Pruebas
x-i18n:
    generated_at: "2026-04-24T05:33:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b3aa0a785daa5d43dfd2b352cf8c3013c408231c000ff40852bac534211ec54
    source_path: help/testing.md
    workflow: 15
---

OpenClaw tiene tres suites de Vitest (unit/integration, e2e, live) y un pequeño conjunto
de ejecutores de Docker. Este documento es una guía de "cómo probamos":

- Qué cubre cada suite (y qué deliberadamente _no_ cubre).
- Qué comandos ejecutar para flujos comunes (local, antes de push, depuración).
- Cómo las pruebas live descubren credenciales y seleccionan modelos/proveedores.
- Cómo añadir regresiones para problemas reales de modelos/proveedores.

## Inicio rápido

La mayoría de los días:

- Filtro completo (esperado antes de push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Ejecución local más rápida de la suite completa en una máquina holgada: `pnpm test:max`
- Bucle directo de watch de Vitest: `pnpm test:watch`
- El direccionamiento directo de archivos ahora también enruta rutas de extensiones/canales: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefiere primero ejecuciones dirigidas cuando estés iterando sobre un único fallo.
- Sitio QA respaldado por Docker: `pnpm qa:lab:up`
- Vía QA respaldada por VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Cuando tocas pruebas o quieres confianza adicional:

- Filtro de cobertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Cuando depuras proveedores/modelos reales (requiere credenciales reales):

- Suite live (modelos + comprobaciones de herramientas/imágenes del gateway): `pnpm test:live`
- Dirigir silenciosamente un único archivo live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Barrido live de modelos en Docker: `pnpm test:docker:live-models`
  - Cada modelo seleccionado ahora ejecuta un turno de texto más una pequeña comprobación de estilo lectura de archivos.
    Los modelos cuyos metadatos anuncian entrada `image` también ejecutan un pequeño turno de imagen.
    Desactiva las comprobaciones extra con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` cuando estés aislando fallos del proveedor.
  - Cobertura en CI: la comprobación diaria `OpenClaw Scheduled Live And E2E Checks` y la comprobación manual
    `OpenClaw Release Checks` llaman al flujo reutilizable live/E2E con
    `include_live_suites: true`, lo que incluye trabajos separados de matriz live en Docker
    fragmentados por proveedor.
  - Para reejecuciones enfocadas de CI, despacha `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` y `live_models_only: true`.
  - Añade nuevos secretos de proveedor de alta señal a `scripts/ci-hydrate-live-auth.sh`
    junto con `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` y sus
    llamadores programados/de liberación.
- Prueba rápida nativa de chat vinculado de Codex: `pnpm test:docker:live-codex-bind`
  - Ejecuta una vía live en Docker contra la ruta del servidor de aplicación de Codex, vincula un
    mensaje directo sintético de Slack con `/codex bind`, ejercita `/codex fast` y
    `/codex permissions`, y luego verifica que una respuesta simple y un adjunto
    de imagen se enrutan a través de la vinculación nativa del Plugin en lugar de ACP.
- Prueba rápida de coste Moonshot/Kimi: con `MOONSHOT_API_KEY` establecido, ejecuta
  `openclaw models list --provider moonshot --json`, luego ejecuta un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  aislado contra `moonshot/kimi-k2.6`. Verifica que el JSON informe Moonshot/K2.6 y que la
  transcripción del asistente almacene `usage.cost` normalizado.

Consejo: cuando solo necesites un caso fallido, prefiere acotar las pruebas live mediante las variables de entorno de lista de permitidos descritas más abajo.

## Ejecutores específicos de QA

Estos comandos están junto a las suites principales de pruebas cuando necesitas realismo de QA-lab:

CI ejecuta QA Lab en flujos de trabajo dedicados. `Parity gate` se ejecuta en PR coincidentes y
desde despacho manual con proveedores simulados. `QA-Lab - All Lanes` se ejecuta cada noche en
`main` y desde despacho manual con el filtro de paridad simulado, la vía live de Matrix y
la vía live de Telegram gestionada por Convex como trabajos paralelos. `OpenClaw Release Checks`
ejecuta las mismas vías antes de la aprobación de liberación.

- `pnpm openclaw qa suite`
  - Ejecuta escenarios QA respaldados por el repositorio directamente en el host.
  - Ejecuta varios escenarios seleccionados en paralelo de forma predeterminada con workers
    aislados de gateway. `qa-channel` usa por defecto concurrencia 4 (limitada por la
    cantidad de escenarios seleccionados). Usa `--concurrency <count>` para ajustar la cantidad
    de workers, o `--concurrency 1` para la vía serial anterior.
  - Sale con código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
    quieras artefactos sin una salida fallida.
  - Admite modos de proveedor `live-frontier`, `mock-openai` y `aimock`.
    `aimock` inicia un servidor local de proveedor respaldado por AIMock para cobertura experimental
    de fixtures y simulación de protocolos sin reemplazar la vía `mock-openai`
    consciente de escenarios.
- `pnpm openclaw qa suite --runner multipass`
  - Ejecuta la misma suite QA dentro de una VM Linux desechable de Multipass.
  - Conserva el mismo comportamiento de selección de escenarios que `qa suite` en el host.
  - Reutiliza los mismos indicadores de selección de proveedor/modelo que `qa suite`.
  - Las ejecuciones live reenvían las entradas de autenticación QA compatibles que son prácticas para el invitado:
    claves de proveedor basadas en entorno, la ruta de configuración del proveedor live de QA y `CODEX_HOME`
    cuando está presente.
  - Los directorios de salida deben permanecer bajo la raíz del repositorio para que el invitado pueda escribir de vuelta a través
    del espacio de trabajo montado.
  - Escribe el informe QA + resumen normales más logs de Multipass en
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia el sitio QA respaldado por Docker para trabajo QA de estilo operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Construye un tarball npm a partir del checkout actual, lo instala globalmente en
    Docker, ejecuta una incorporación no interactiva con clave API de OpenAI, configura Telegram
    de forma predeterminada, verifica que al habilitar el Plugin se instalan dependencias de tiempo de ejecución bajo demanda, ejecuta doctor y ejecuta un turno local de agente contra un endpoint OpenAI simulado.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para ejecutar la misma vía
    de instalación empaquetada con Discord.
- `pnpm test:docker:npm-telegram-live`
  - Instala un paquete publicado de OpenClaw en Docker, ejecuta incorporación de paquete instalado,
    configura Telegram mediante la CLI instalada y luego reutiliza la vía QA live de Telegram con ese paquete instalado como Gateway SUT.
  - Usa por defecto `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Usa las mismas credenciales de entorno de Telegram o la misma fuente de credenciales Convex que
    `pnpm openclaw qa telegram`.
- `pnpm test:docker:bundled-channel-deps`
  - Empaqueta e instala la compilación actual de OpenClaw en Docker, inicia el Gateway
    con OpenAI configurado y luego habilita canales/Plugins incluidos mediante ediciones de configuración.
  - Verifica que el descubrimiento de setup deja ausentes las dependencias de tiempo de ejecución
    de Plugins no configuradas, que la primera ejecución configurada del Gateway o doctor instala bajo demanda las dependencias de tiempo de ejecución de cada Plugin incluido, y que un segundo reinicio no reinstala dependencias que ya se habían activado.
  - También instala una referencia npm antigua conocida, habilita Telegram antes de ejecutar
    `openclaw update --tag <candidate>`, y verifica que las reparaciones doctor posteriores a la actualización del candidato reparan las dependencias de tiempo de ejecución del canal incluido sin una reparación postinstall del lado del harness.
- `pnpm openclaw qa aimock`
  - Inicia solo el servidor local de proveedor AIMock para pruebas rápidas directas de protocolo.
- `pnpm openclaw qa matrix`
  - Ejecuta la vía QA live de Matrix contra un homeserver Tuwunel desechable respaldado por Docker.
  - Este host QA hoy es solo de repositorio/desarrollo. Las instalaciones empaquetadas de OpenClaw no incluyen
    `qa-lab`, por lo que no exponen `openclaw qa`.
  - Los checkouts del repositorio cargan el ejecutor incluido directamente; no hace falta un paso separado de instalación del Plugin.
  - Aprovisiona tres usuarios temporales de Matrix (`driver`, `sut`, `observer`) más una sala privada, y luego inicia un proceso hijo de gateway QA con el Plugin real de Matrix como transporte SUT.
  - Usa por defecto la imagen estable fijada de Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Sobrescríbela con `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` cuando necesites probar una imagen diferente.
  - Matrix no expone indicadores compartidos de fuente de credenciales porque la vía aprovisiona usuarios desechables localmente.
  - Escribe un informe QA de Matrix, resumen, artefacto de eventos observados y log combinado stdout/stderr en `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Ejecuta la vía QA live de Telegram contra un grupo privado real usando los tokens del bot driver y del bot SUT desde el entorno.
  - Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. El id de grupo debe ser el id numérico del chat de Telegram.
  - Admite `--credential-source convex` para credenciales compartidas agrupadas. Usa modo entorno por defecto, o establece `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por concesiones agrupadas.
  - Sale con código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
    quieras artefactos sin una salida fallida.
  - Requiere dos bots distintos en el mismo grupo privado, con el bot SUT exponiendo un nombre de usuario de Telegram.
  - Para observación estable entre bots, habilita Bot-to-Bot Communication Mode en `@BotFather` para ambos bots y asegúrate de que el bot driver pueda observar tráfico de bots del grupo.
  - Escribe un informe QA de Telegram, un resumen y un artefacto de mensajes observados en `.artifacts/qa-e2e/...`. Los escenarios de respuesta incluyen RTT desde la solicitud de envío del driver hasta la respuesta observada del SUT.

Las vías de transporte live comparten un contrato estándar para que los transportes nuevos no diverjan:

`qa-channel` sigue siendo la amplia suite sintética de QA y no forma parte de la matriz de cobertura de transporte live.

| Vía      | Canary | Filtrado por mención | Bloqueo de lista de permitidos | Respuesta de nivel superior | Reanudación tras reinicio | Seguimiento de hilo | Aislamiento de hilo | Observación de reacciones | Comando help |
| -------- | ------ | -------------------- | ------------------------------ | --------------------------- | ------------------------- | ------------------- | ------------------- | ------------------------- | ------------ |
| Matrix   | x      | x                    | x                              | x                           | x                         | x                   | x                   | x                         |              |
| Telegram | x      |                      |                                |                             |                           |                     |                     |                           | x            |

### Credenciales compartidas de Telegram mediante Convex (v1)

Cuando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
`openclaw qa telegram`, QA lab adquiere una concesión exclusiva de un grupo respaldado por Convex, envía heartbeat
de esa concesión mientras la vía se está ejecutando y libera la concesión al apagarse.

Andamiaje de proyecto Convex de referencia:

- `qa/convex-credential-broker/`

Variables de entorno obligatorias:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por ejemplo `https://your-deployment.convex.site`)
- Un secreto para el rol seleccionado:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Selección del rol de credencial:
  - CLI: `--credential-role maintainer|ci`
  - Valor predeterminado en entorno: `OPENCLAW_QA_CREDENTIAL_ROLE` (usa por defecto `ci` en CI, `maintainer` en caso contrario)

Variables de entorno opcionales:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predeterminado `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predeterminado `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predeterminado `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predeterminado `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predeterminado `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de rastreo opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URL Convex `http://` de loopback para desarrollo solo local.

`OPENCLAW_QA_CONVEX_SITE_URL` debe usar `https://` en funcionamiento normal.

Los comandos administrativos de mantenimiento (añadir/eliminar/listar del grupo) requieren
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` específicamente.

Ayudantes CLI para mantenedores:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `--json` para salida legible por máquina en scripts y utilidades de CI.

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
  - Protección de concesión activa: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo secreto de maintainer)
  - Solicitud: `{ kind?, status?, includePayload?, limit? }`
  - Éxito: `{ status: "ok", credentials, count }`

Forma de la carga para el tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` debe ser una cadena numérica con el id del chat de Telegram.
- `admin/add` valida esta forma para `kind: "telegram"` y rechaza cargas mal formadas.

### Añadir un canal a QA

Añadir un canal al sistema QA en Markdown requiere exactamente dos cosas:

1. Un adaptador de transporte para el canal.
2. Un paquete de escenarios que ejercite el contrato del canal.

No añadas una nueva raíz de comando QA de nivel superior cuando el host compartido `qa-lab` puede
gestionar el flujo.

`qa-lab` gestiona la mecánica compartida del host:

- la raíz de comando `openclaw qa`
- el inicio y apagado de la suite
- la concurrencia de workers
- la escritura de artefactos
- la generación de informes
- la ejecución de escenarios
- alias de compatibilidad para escenarios antiguos de `qa-channel`

Los Plugins de ejecutor gestionan el contrato de transporte:

- cómo se monta `openclaw qa <runner>` bajo la raíz compartida `qa`
- cómo se configura el gateway para ese transporte
- cómo se comprueba la preparación
- cómo se inyectan eventos entrantes
- cómo se observan mensajes salientes
- cómo se exponen las transcripciones y el estado normalizado del transporte
- cómo se ejecutan acciones respaldadas por transporte
- cómo se gestiona el restablecimiento o limpieza específicos del transporte

El nivel mínimo de adopción para un nuevo canal es:

1. Mantener `qa-lab` como propietario de la raíz compartida `qa`.
2. Implementar el ejecutor de transporte en la interfaz compartida del host `qa-lab`.
3. Mantener la mecánica específica del transporte dentro del Plugin del ejecutor o del harness del canal.
4. Montar el ejecutor como `openclaw qa <runner>` en lugar de registrar una raíz de comando competidora.
   Los Plugins de ejecutor deben declarar `qaRunners` en `openclaw.plugin.json` y exportar un array `qaRunnerCliRegistrations` coincidente desde `runtime-api.ts`.
   Mantén `runtime-api.ts` ligero; la CLI perezosa y la ejecución del ejecutor deben permanecer detrás de entrypoints separados.
5. Crear o adaptar escenarios Markdown bajo los directorios temáticos `qa/scenarios/`.
6. Usar los ayudantes genéricos de escenarios para escenarios nuevos.
7. Mantener funcionando los alias de compatibilidad existentes salvo que el repositorio esté haciendo una migración intencionada.

La regla de decisión es estricta:

- Si el comportamiento puede expresarse una sola vez en `qa-lab`, colócalo en `qa-lab`.
- Si el comportamiento depende de un transporte de un solo canal, mantenlo en ese Plugin de ejecutor o en el harness del Plugin.
- Si un escenario necesita una capacidad nueva que más de un canal puede usar, añade un ayudante genérico en lugar de una rama específica del canal en `suite.ts`.
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

Siguen disponibles alias de compatibilidad para escenarios existentes, incluidos:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

El trabajo en canales nuevos debe usar los nombres genéricos de ayudantes.
Los alias de compatibilidad existen para evitar una migración en un solo día, no como modelo para
la creación de escenarios nuevos.

## Suites de prueba (qué se ejecuta y dónde)

Piensa en las suites como “realismo creciente” (y mayor inestabilidad/coste):

### Unit / integration (predeterminada)

- Comando: `pnpm test`
- Configuración: las ejecuciones no dirigidas usan el conjunto fragmentado `vitest.full-*.config.ts` y pueden expandir fragmentos de varios proyectos a configuraciones por proyecto para programación en paralelo
- Archivos: inventarios core/unit bajo `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` y las pruebas Node de `ui` incluidas en la lista permitida cubiertas por `vitest.unit.config.ts`
- Alcance:
  - Pruebas unitarias puras
  - Pruebas de integración en proceso (autenticación del gateway, enrutamiento, herramientas, análisis, configuración)
  - Regresiones deterministas para errores conocidos
- Expectativas:
  - Se ejecuta en CI
  - No requiere claves reales
  - Debe ser rápida y estable
    <AccordionGroup>
    <Accordion title="Proyectos, fragmentos y vías con alcance"> - Las ejecuciones no dirigidas de `pnpm test` ejecutan doce configuraciones de fragmentos más pequeños (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) en lugar de un único proceso raíz nativo gigante del proyecto. Esto reduce el RSS máximo en máquinas cargadas y evita que el trabajo de auto-reply/extensiones deje sin recursos a suites no relacionadas. - `pnpm test --watch` sigue usando el grafo nativo del proyecto raíz `vitest.config.ts`, porque un bucle watch de varios fragmentos no es práctico. - `pnpm test`, `pnpm test:watch` y `pnpm test:perf:imports` enrutan primero objetivos explícitos de archivo/directorio a través de vías con alcance, de modo que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar el coste de arranque completo del proyecto raíz. - `pnpm test:changed` expande las rutas git modificadas a las mismas vías con alcance cuando la diferencia solo toca archivos fuente/prueba enrutable; las ediciones de config/setup siguen recurriendo a la reejecución amplia del proyecto raíz. - `pnpm check:changed` es el filtro local inteligente normal para trabajo acotado. Clasifica la diferencia en core, pruebas de core, extensiones, pruebas de extensiones, apps, docs, metadatos de liberación y herramientas, y luego ejecuta las vías coincidentes de typecheck/lint/test. Los cambios de SDK público de Plugin y contrato de Plugin incluyen una pasada de validación de extensiones porque las extensiones dependen de esos contratos core. Los incrementos de versión solo en metadatos de liberación ejecutan comprobaciones dirigidas de versión/config/dependencias de raíz en lugar de la suite completa, con una protección que rechaza cambios de paquete fuera del campo de versión de nivel superior. - Las pruebas unitarias ligeras en importaciones de agentes, comandos, Plugins, ayudantes de auto-reply, `plugin-sdk` y áreas similares de utilidades puras se enrutan por la vía `unit-fast`, que omite `test/setup-openclaw-runtime.ts`; los archivos con mucho estado o pesados en tiempo de ejecución permanecen en las vías existentes. - Algunos archivos fuente auxiliares seleccionados de `plugin-sdk` y `commands` también asignan las ejecuciones en modo changed a pruebas hermanas explícitas en esas vías ligeras, para que editar ayudantes evite volver a ejecutar la suite pesada completa de ese directorio. - `auto-reply` tiene tres grupos dedicados: ayudantes core de nivel superior, pruebas de integración `reply.*` de nivel superior y el subárbol `src/auto-reply/reply/**`. Esto mantiene el trabajo más pesado del harness de reply fuera de las pruebas baratas de estado/fragmento/token.
    </Accordion>

      <Accordion title="Cobertura del ejecutor incrustado">
        - Cuando cambies entradas de descubrimiento de herramientas de mensajes o contexto de tiempo de ejecución de Compaction,
          mantén ambos niveles de cobertura.
        - Añade regresiones enfocadas de ayudantes para límites puros de enrutamiento y normalización.
        - Mantén sanas las suites de integración del ejecutor incrustado:
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
          `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` y
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
        - Esas suites verifican que los id limitados y el comportamiento de Compaction sigan
          fluyendo a través de las rutas reales `run.ts` / `compact.ts`; las pruebas solo de ayudantes
          no son un sustituto suficiente de esas rutas de integración.
      </Accordion>

      <Accordion title="Valores predeterminados del pool y aislamiento de Vitest">
        - La configuración base de Vitest usa por defecto `threads`.
        - La configuración compartida de Vitest fija `isolate: false` y usa el
          ejecutor no aislado en los proyectos raíz, configuraciones e2e y live.
        - La vía UI raíz conserva su configuración y optimizador `jsdom`, pero se ejecuta también en el
          ejecutor compartido no aislado.
        - Cada fragmento de `pnpm test` hereda los mismos valores predeterminados `threads` + `isolate: false`
          de la configuración compartida de Vitest.
        - `scripts/run-vitest.mjs` añade `--no-maglev` por defecto para los procesos Node hijo de Vitest con el fin de reducir la agitación de compilación de V8 durante grandes ejecuciones locales.
          Establece `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar frente al comportamiento estándar de V8.
      </Accordion>

      <Accordion title="Iteración local rápida">
        - `pnpm changed:lanes` muestra qué vías arquitectónicas activa una diferencia.
        - El hook pre-commit es solo de formato. Vuelve a preparar los archivos formateados y
          no ejecuta lint, typecheck ni pruebas.
        - Ejecuta `pnpm check:changed` explícitamente antes de la entrega o del push cuando
          necesites el filtro local inteligente. Los cambios en el SDK público de Plugin y en el contrato de Plugin
          incluyen una pasada de validación de extensiones.
        - `pnpm test:changed` enruta mediante vías con alcance cuando las rutas modificadas
          se asignan limpiamente a una suite más pequeña.
        - `pnpm test:max` y `pnpm test:changed:max` mantienen el mismo comportamiento de enrutamiento,
          solo que con un límite mayor de workers.
        - El autoescalado local de workers es intencionadamente conservador y retrocede
          cuando la media de carga del host ya es alta, para que varias ejecuciones concurrentes
          de Vitest hagan menos daño por defecto.
        - La configuración base de Vitest marca los proyectos/archivos de configuración como
          `forceRerunTriggers` para que las reejecuciones en modo changed sigan siendo correctas cuando
          cambie el cableado de pruebas.
        - La configuración mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado en
          hosts compatibles; establece `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si quieres
          una ubicación explícita de caché para perfiles directos.
      </Accordion>

      <Accordion title="Depuración de rendimiento">
        - `pnpm test:perf:imports` habilita informes de duración de importación de Vitest más
          salida de desglose de importaciones.
        - `pnpm test:perf:imports:changed` limita la misma vista de perfilado a
          archivos modificados desde `origin/main`.
        - Cuando una prueba caliente sigue gastando la mayor parte de su tiempo en importaciones de arranque,
          mantén las dependencias pesadas detrás de una interfaz local estrecha `*.runtime.ts` y
          simula esa interfaz directamente en lugar de hacer deep-import de ayudantes de tiempo de ejecución solo
          para pasarlos a través de `vi.mock(...)`.
        - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara `test:changed` enrutable
          con la ruta nativa del proyecto raíz de esa diferencia confirmada e imprime
          tiempo total más RSS máximo de macOS.
        - `pnpm test:perf:changed:bench -- --worktree` evalúa el árbol actual con cambios
          enroutando la lista de archivos modificados a través de
          `scripts/test-projects.mjs` y la configuración raíz de Vitest.
        - `pnpm test:perf:profile:main` escribe un perfil de CPU del hilo principal para
          sobrecarga de arranque y transformación de Vitest/Vite.
        - `pnpm test:perf:profile:runner` escribe perfiles de CPU+heap del ejecutor para la
          suite unitaria con el paralelismo de archivos desactivado.
      </Accordion>
    </AccordionGroup>

### Estabilidad (gateway)

- Comando: `pnpm test:stability:gateway`
- Configuración: `vitest.gateway.config.ts`, forzada a un worker
- Alcance:
  - Inicia un Gateway real de loopback con diagnósticos habilitados por defecto
  - Conduce cambios sintéticos de mensajes del gateway, memoria y cargas grandes a través de la ruta de eventos de diagnóstico
  - Consulta `diagnostics.stability` mediante el WS RPC del Gateway
  - Cubre ayudantes de persistencia del paquete de estabilidad diagnóstica
  - Afirma que el registrador permanece acotado, que las muestras sintéticas de RSS se mantienen por debajo del presupuesto de presión y que las profundidades de cola por sesión vuelven a cero
- Expectativas:
  - Segura para CI y sin claves
  - Vía estrecha para seguimiento de regresiones de estabilidad, no un sustituto de la suite completa de Gateway

### E2E (prueba rápida de gateway)

- Comando: `pnpm test:e2e`
- Configuración: `vitest.e2e.config.ts`
- Archivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` y pruebas E2E de Plugins incluidos bajo `extensions/`
- Valores predeterminados de tiempo de ejecución:
  - Usa Vitest `threads` con `isolate: false`, igual que el resto del repositorio.
  - Usa workers adaptativos (CI: hasta 2, local: 1 por defecto).
  - Se ejecuta en modo silencioso por defecto para reducir la sobrecarga de E/S en consola.
- Sobrescrituras útiles:
  - `OPENCLAW_E2E_WORKERS=<n>` para forzar la cantidad de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para volver a habilitar la salida detallada en consola.
- Alcance:
  - Comportamiento end-to-end de gateway con varias instancias
  - Superficies WebSocket/HTTP, vinculación de nodos y redes más pesadas
- Expectativas:
  - Se ejecuta en CI (cuando está habilitado en la canalización)
  - No requiere claves reales
  - Más partes móviles que las pruebas unitarias (puede ser más lenta)

### E2E: prueba rápida del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Archivo: `extensions/openshell/src/backend.e2e.test.ts`
- Alcance:
  - Inicia un gateway OpenShell aislado en el host mediante Docker
  - Crea un sandbox a partir de un Dockerfile local temporal
  - Ejercita el backend OpenShell de OpenClaw sobre `sandbox ssh-config` + ejecución SSH reales
  - Verifica el comportamiento canónico remoto del sistema de archivos mediante el puente fs del sandbox
- Expectativas:
  - Solo opt-in; no forma parte de la ejecución predeterminada de `pnpm test:e2e`
  - Requiere una CLI local `openshell` más un daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` aislados y luego destruye el gateway y sandbox de prueba
- Sobrescrituras útiles:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar la prueba al ejecutar manualmente la suite e2e más amplia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apuntar a una CLI binaria o script contenedor no predeterminados

### Live (proveedores reales + modelos reales)

- Comando: `pnpm test:live`
- Configuración: `vitest.live.config.ts`
- Archivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` y pruebas live de Plugins incluidos bajo `extensions/`
- Predeterminado: **habilitado** por `pnpm test:live` (establece `OPENCLAW_LIVE_TEST=1`)
- Alcance:
  - “¿Este proveedor/modelo realmente funciona _hoy_ con credenciales reales?”
  - Detectar cambios de formato de proveedor, peculiaridades de llamadas a herramientas, problemas de autenticación y comportamiento de límites de tasa
- Expectativas:
  - No es estable para CI por diseño (redes reales, políticas reales de proveedores, cuotas, caídas)
  - Cuesta dinero / usa límites de tasa
  - Prefiere ejecutar subconjuntos acotados en lugar de “todo”
- Las ejecuciones live cargan `~/.profile` para recoger claves API faltantes.
- Por defecto, las ejecuciones live siguen aislando `HOME` y copian material de config/auth a un home temporal de prueba para que los fixtures unitarios no puedan modificar tu `~/.openclaw` real.
- Establece `OPENCLAW_LIVE_USE_REAL_HOME=1` solo cuando quieras intencionadamente que las pruebas live usen tu directorio home real.
- `pnpm test:live` ahora usa por defecto un modo más silencioso: mantiene la salida de progreso `[live] ...`, pero suprime el aviso extra de `~/.profile` y silencia los logs de arranque del gateway y el ruido de Bonjour. Establece `OPENCLAW_LIVE_TEST_QUIET=0` si quieres recuperar todos los logs de inicio.
- Rotación de claves API (específica del proveedor): establece `*_API_KEYS` con formato separado por comas/punto y coma o `*_API_KEY_1`, `*_API_KEY_2` (por ejemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) o sobrescritura por live mediante `OPENCLAW_LIVE_*_KEY`; las pruebas reintentan en respuestas por límite de tasa.
- Salida de progreso/heartbeat:
  - Las suites live ahora emiten líneas de progreso a stderr para que las llamadas largas al proveedor se vean activas incluso cuando la captura de consola de Vitest es silenciosa.
  - `vitest.live.config.ts` desactiva la interceptación de consola de Vitest para que las líneas de progreso del proveedor/gateway se transmitan inmediatamente durante las ejecuciones live.
  - Ajusta los heartbeat de modelo directo con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajusta los heartbeat de gateway/comprobación con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## ¿Qué suite debo ejecutar?

Usa esta tabla de decisión:

- Editar lógica/pruebas: ejecuta `pnpm test` (y `pnpm test:coverage` si cambiaste mucho)
- Tocar red del gateway / protocolo WS / vinculación: añade `pnpm test:e2e`
- Depurar “mi bot está caído” / fallos específicos de proveedor / llamadas a herramientas: ejecuta un `pnpm test:live` acotado

## Pruebas live (que tocan red)

Para la matriz live de modelos, pruebas rápidas de backend CLI, pruebas ACP,
harness del servidor de aplicación Codex y todas las pruebas live de proveedores multimedia (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness), además de la gestión de credenciales para ejecuciones live, consulta
[Pruebas — suites live](/es/help/testing-live).

## Ejecutores Docker (comprobaciones opcionales de "funciona en Linux")

Estos ejecutores Docker se dividen en dos grupos:

- Ejecutores live de modelos: `test:docker:live-models` y `test:docker:live-gateway` ejecutan solo su archivo live con clave de perfil coincidente dentro de la imagen Docker del repositorio (`src/agents/models.profiles.live.test.ts` y `src/gateway/gateway-models.profiles.live.test.ts`), montando tu directorio local de config y espacio de trabajo (y cargando `~/.profile` si está montado). Los entrypoints locales coincidentes son `test:live:models-profiles` y `test:live:gateway-profiles`.
- Los ejecutores Docker live usan por defecto un límite menor de prueba rápida para que un barrido completo en Docker siga siendo práctico:
  `test:docker:live-models` usa por defecto `OPENCLAW_LIVE_MAX_MODELS=12`, y
  `test:docker:live-gateway` usa por defecto `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` y
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sobrescribe esas variables de entorno cuando
  quieras explícitamente el barrido exhaustivo más grande.
- `test:docker:all` compila la imagen Docker live una vez mediante `test:docker:live-build`, luego la reutiliza para las dos vías Docker live. También compila una imagen compartida `scripts/e2e/Dockerfile` mediante `test:docker:e2e-build` y la reutiliza para los ejecutores de prueba rápida E2E en contenedor que ejercitan la app compilada.
- Ejecutores de prueba rápida en contenedor: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` y `test:docker:config-reload` arrancan uno o más contenedores reales y verifican rutas de integración de nivel superior.

Los ejecutores Docker de modelos live también montan solo los homes de autenticación CLI necesarios (o todos los compatibles cuando la ejecución no está acotada), y luego los copian al home del contenedor antes de la ejecución para que el OAuth de CLI externa pueda actualizar tokens sin modificar el almacén de autenticación del host:

- Modelos directos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Prueba rápida ACP bind: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Prueba rápida de backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Prueba rápida del harness del servidor de aplicación Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desarrollo: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Prueba rápida live de Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Asistente de incorporación (TTY, andamiaje completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Prueba rápida de incorporación/canal/agente con tarball npm: `pnpm test:docker:npm-onboard-channel-agent` instala globalmente en Docker el tarball empaquetado de OpenClaw, configura OpenAI mediante incorporación con referencia de entorno más Telegram por defecto, verifica que al habilitar el Plugin se instalan sus dependencias de tiempo de ejecución bajo demanda, ejecuta doctor y ejecuta un turno de agente OpenAI simulado. Reutiliza un tarball precompilado con `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la recompilación del host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, o cambia de canal con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Prueba rápida de instalación global con Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empaqueta el árbol actual, lo instala con `bun install -g` en un home aislado y verifica que `openclaw infer image providers --json` devuelve proveedores de imagen incluidos en lugar de quedarse colgado. Reutiliza un tarball precompilado con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la compilación del host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, o copia `dist/` desde una imagen Docker ya compilada con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Prueba rápida del instalador en Docker: `bash scripts/test-install-sh-docker.sh` comparte una caché npm entre sus contenedores root, update y direct-npm. La prueba de actualización usa por defecto npm `latest` como base estable antes de actualizar al tarball candidato. Las comprobaciones del instalador sin root mantienen una caché npm aislada para que las entradas de caché propiedad de root no oculten el comportamiento de instalación local del usuario. Establece `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar la caché root/update/direct-npm entre reejecuciones locales.
- El CI de prueba rápida de instalación omite la actualización global direct-npm duplicada con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; ejecuta el script localmente sin esa variable cuando necesites cobertura directa de `npm install -g`.
- Red del gateway (dos contenedores, autenticación WS + estado): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Regresión mínima de razonamiento con `web_search` de OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) ejecuta un servidor OpenAI simulado a través de Gateway, verifica que `web_search` eleva `reasoning.effort` de `minimal` a `low`, luego fuerza el rechazo del esquema del proveedor y comprueba que el detalle sin procesar aparece en los logs del Gateway.
- Puente de canal MCP (Gateway sembrado + puente stdio + prueba rápida de tramas de notificación Claude sin procesar): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Herramientas MCP del paquete Pi (servidor MCP stdio real + prueba rápida de permitir/denegar del perfil Pi incrustado): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Limpieza MCP de cron/subagente (Gateway real + desmontaje de hijo MCP stdio tras ejecuciones aisladas de cron y subagente puntual): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (prueba rápida de instalación + alias `/plugin` + semántica de reinicio de paquete Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
- Prueba rápida sin cambios de actualización de Plugin: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Prueba rápida de metadatos de recarga de configuración: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Dependencias de tiempo de ejecución de Plugins incluidos: `pnpm test:docker:bundled-channel-deps` construye por defecto una pequeña imagen de ejecutor Docker, compila y empaqueta OpenClaw una vez en el host y luego monta ese tarball en cada escenario de instalación Linux. Reutiliza la imagen con `OPENCLAW_SKIP_DOCKER_BUILD=1`, omite la recompilación del host tras una compilación local reciente con `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, o apunta a un tarball existente con `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Acota las dependencias de tiempo de ejecución de Plugins incluidos mientras iteras desactivando escenarios no relacionados, por ejemplo:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Para precompilar y reutilizar manualmente la imagen compartida de app compilada:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Las sobrescrituras de imagen específicas de la suite, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, siguen teniendo prioridad cuando están establecidas. Cuando `OPENCLAW_SKIP_DOCKER_BUILD=1` apunta a una imagen compartida remota, los scripts la descargan si aún no está en local. Las pruebas Docker de QR e instalador mantienen sus propios Dockerfiles porque validan el comportamiento de paquete/instalación en lugar del tiempo de ejecución compartido de la app compilada.

Los ejecutores Docker de modelos live también montan el checkout actual en modo de solo lectura y
lo preparan en un workdir temporal dentro del contenedor. Esto mantiene ligera la
imagen de tiempo de ejecución mientras sigue ejecutando Vitest contra tu fuente/configuración local exacta.
El paso de preparación omite cachés grandes solo locales y salidas de compilación de apps como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` y directorios de salida locales de app `.build` o
Gradle para que las ejecuciones live de Docker no pasen minutos copiando
artefactos específicos de la máquina.
También establecen `OPENCLAW_SKIP_CHANNELS=1` para que las comprobaciones live del gateway no inicien
workers reales de canales Telegram/Discord/etc. dentro del contenedor.
`test:docker:live-models` sigue ejecutando `pnpm test:live`, así que también debes pasar
`OPENCLAW_LIVE_GATEWAY_*` cuando necesites acotar o excluir cobertura
live del gateway en esa vía Docker.
`test:docker:openwebui` es una prueba rápida de compatibilidad de más alto nivel: inicia un
contenedor gateway de OpenClaw con los endpoints HTTP compatibles con OpenAI habilitados,
inicia un contenedor Open WebUI fijado contra ese gateway, inicia sesión a través de
Open WebUI, verifica que `/api/models` expone `openclaw/default`, y luego envía una
solicitud de chat real a través del proxy `/api/chat/completions` de Open WebUI.
La primera ejecución puede ser notablemente más lenta porque Docker puede necesitar descargar la
imagen de Open WebUI y Open WebUI puede necesitar completar su propio arranque en frío.
Esta vía espera una clave de modelo live utilizable, y `OPENCLAW_PROFILE_FILE`
(`~/.profile` por defecto) es la forma principal de proporcionarla en ejecuciones Dockerizadas.
Las ejecuciones correctas imprimen una pequeña carga JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` es intencionadamente determinista y no necesita una
cuenta real de Telegram, Discord o iMessage. Arranca un contenedor Gateway
sembrado, inicia un segundo contenedor que genera `openclaw mcp serve`, luego
verifica descubrimiento de conversaciones enrutadas, lecturas de transcripciones, metadatos de adjuntos,
comportamiento de cola de eventos live, enrutamiento de envío saliente y notificaciones de estilo Claude de canal +
permisos sobre el puente MCP stdio real. La comprobación de notificaciones
inspecciona directamente las tramas MCP stdio sin procesar para que la prueba rápida valide lo que
realmente emite el puente, no solo lo que una SDK concreta de cliente resulte mostrar.
`test:docker:pi-bundle-mcp-tools` es determinista y no necesita una
clave de modelo live. Compila la imagen Docker del repositorio, inicia un servidor real de prueba MCP stdio
dentro del contenedor, materializa ese servidor a través del tiempo de ejecución MCP del paquete Pi incrustado,
ejecuta la herramienta y luego verifica que `coding` y `messaging` conservan
las herramientas `bundle-mcp`, mientras que `minimal` y `tools.deny: ["bundle-mcp"]` las filtran.
`test:docker:cron-mcp-cleanup` es determinista y no necesita una clave de modelo live.
Inicia un Gateway sembrado con un servidor real de prueba MCP stdio, ejecuta un
turno cron aislado y un turno hijo puntual de `/subagents spawn`, y luego verifica
que el proceso hijo MCP salga después de cada ejecución.

Prueba manual ACP de hilo en lenguaje natural (no CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conserva este script para flujos de trabajo de regresión/depuración. Puede volver a ser necesario para validación del enrutamiento de hilos ACP, así que no lo elimines.

Variables de entorno útiles:

- `OPENCLAW_CONFIG_DIR=...` (predeterminado: `~/.openclaw`) montado en `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predeterminado: `~/.openclaw/workspace`) montado en `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predeterminado: `~/.profile`) montado en `/home/node/.profile` y cargado antes de ejecutar las pruebas
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar solo variables de entorno cargadas desde `OPENCLAW_PROFILE_FILE`, usando directorios temporales de config/workspace y sin montajes externos de autenticación CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predeterminado: `~/.cache/openclaw/docker-cli-tools`) montado en `/home/node/.npm-global` para instalaciones CLI en caché dentro de Docker
- Los directorios/archivos de autenticación CLI externa bajo `$HOME` se montan en modo de solo lectura bajo `/host-auth...`, y luego se copian a `/home/node/...` antes de iniciar las pruebas
  - Directorios predeterminados: `.minimax`
  - Archivos predeterminados: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Las ejecuciones acotadas por proveedor montan solo los directorios/archivos necesarios inferidos a partir de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sobrescribe manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o una lista separada por comas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para acotar la ejecución
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar proveedores dentro del contenedor
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar una imagen `openclaw:local-live` existente en reejecuciones que no necesitan recompilación
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para asegurarte de que las credenciales provienen del almacén del perfil (no del entorno)
- `OPENCLAW_OPENWEBUI_MODEL=...` para elegir el modelo expuesto por el gateway para la prueba rápida de Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para sobrescribir el prompt de comprobación de nonce usado por la prueba rápida de Open WebUI
- `OPENWEBUI_IMAGE=...` para sobrescribir la etiqueta fijada de imagen de Open WebUI

## Comprobación básica de documentación

Ejecuta comprobaciones de documentación después de editar documentación: `pnpm check:docs`.
Ejecuta la validación completa de anclas de Mintlify cuando también necesites comprobaciones de encabezados dentro de la página: `pnpm docs:check-links:anchors`.

## Regresión offline (segura para CI)

Estas son regresiones de “canalización real” sin proveedores reales:

- Llamadas a herramientas del gateway (OpenAI simulado, gateway real + bucle de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Asistente del gateway (WS `wizard.start`/`wizard.next`, escribe config + autenticación obligatoria): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evaluaciones de fiabilidad del agente (Skills)

Ya tenemos algunas pruebas seguras para CI que se comportan como “evaluaciones de fiabilidad del agente”:

- Llamadas a herramientas simuladas a través del bucle real gateway + agente (`src/gateway/gateway.test.ts`).
- Flujos de asistente end-to-end que validan cableado de sesión y efectos de configuración (`src/gateway/gateway.test.ts`).

Lo que aún falta para Skills (consulta [Skills](/es/tools/skills)):

- **Toma de decisiones:** cuando las Skills aparecen en el prompt, ¿elige el agente la Skill correcta (o evita las irrelevantes)?
- **Cumplimiento:** ¿lee el agente `SKILL.md` antes de usarla y sigue los pasos/args obligatorios?
- **Contratos de flujo de trabajo:** escenarios de varios turnos que afirman orden de herramientas, continuidad del historial de sesión y límites de sandbox.

Las evaluaciones futuras deben seguir siendo primero deterministas:

- Un ejecutor de escenarios que use proveedores simulados para afirmar llamadas a herramientas + orden, lecturas de archivos de Skills y cableado de sesiones.
- Una pequeña suite de escenarios enfocados en Skills (usar vs evitar, filtrado, inyección de prompts).
- Evaluaciones live opcionales (opt-in, limitadas por entorno) solo después de que exista la suite segura para CI.

## Pruebas de contrato (forma de Plugin y canal)

Las pruebas de contrato verifican que cada Plugin y canal registrado se ajusta a su
contrato de interfaz. Iteran sobre todos los Plugins descubiertos y ejecutan un conjunto de
afirmaciones de forma y comportamiento. La vía unitaria predeterminada `pnpm test`
omite intencionadamente estos archivos compartidos de interfaz y pruebas rápidas; ejecuta los comandos de contrato explícitamente
cuando toques superficies compartidas de canal o proveedor.

### Comandos

- Todos los contratos: `pnpm test:contracts`
- Solo contratos de canales: `pnpm test:contracts:channels`
- Solo contratos de proveedores: `pnpm test:contracts:plugins`

### Contratos de canal

Ubicados en `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma básica del Plugin (id, nombre, capacidades)
- **setup** - Contrato del asistente de configuración
- **session-binding** - Comportamiento de binding de sesión
- **outbound-payload** - Estructura de carga del mensaje
- **inbound** - Manejo de mensajes entrantes
- **actions** - Manejadores de acciones del canal
- **threading** - Manejo de id de hilo
- **directory** - API de directorio/lista
- **group-policy** - Aplicación de política de grupos

### Contratos de estado del proveedor

Ubicados en `src/plugins/contracts/*.contract.test.ts`.

- **status** - Comprobaciones de estado del canal
- **registry** - Forma del registro de Plugins

### Contratos de proveedor

Ubicados en `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato de flujo de autenticación
- **auth-choice** - Elección/selección de autenticación
- **catalog** - API de catálogo de modelos
- **discovery** - Descubrimiento de Plugins
- **loader** - Carga de Plugins
- **runtime** - Tiempo de ejecución del proveedor
- **shape** - Forma/interfaz del Plugin
- **wizard** - Asistente de configuración

### Cuándo ejecutarlos

- Después de cambiar exportaciones o subrutas de plugin-sdk
- Después de añadir o modificar un Plugin de canal o proveedor
- Después de refactorizar el registro o descubrimiento de Plugins

Las pruebas de contrato se ejecutan en CI y no requieren claves API reales.

## Añadir regresiones (guía)

Cuando corrijas un problema de proveedor/modelo descubierto en live:

- Añade una regresión segura para CI si es posible (simular/stub del proveedor, o capturar la transformación exacta de la forma de la solicitud)
- Si es inherentemente solo live (límites de tasa, políticas de autenticación), mantén la prueba live acotada y opt-in mediante variables de entorno
- Prefiere apuntar a la capa más pequeña que detecte el error:
  - error de conversión/repetición de solicitud del proveedor → prueba directa de modelos
  - error en el flujo de sesión/historial/herramientas del gateway → prueba rápida live del gateway o prueba simulada segura para CI del gateway
- Barrera de protección de recorrido SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un objetivo de muestra por clase SecretRef a partir de metadatos del registro (`listSecretTargetRegistryEntries()`), y luego afirma que se rechazan los id exec de segmento de recorrido.
  - Si añades una nueva familia objetivo SecretRef de `includeInPlan` en `src/secrets/target-registry-data.ts`, actualiza `classifyTargetClass` en esa prueba. La prueba falla intencionadamente con id de objetivo sin clasificar para que las clases nuevas no puedan omitirse silenciosamente.

## Relacionado

- [Pruebas live](/es/help/testing-live)
- [CI](/es/ci)
