---
read_when:
    - Ejecutar pruebas localmente o en CI
    - Agregar regresiones para errores de modelo/proveedor
    - Depurar el comportamiento de gateway + agente
summary: 'Kit de pruebas: suites unit/e2e/live, ejecutores Docker y qué cubre cada prueba'
title: Pruebas
x-i18n:
    generated_at: "2026-04-26T11:31:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 46c01493284511d99c37a18fc695cc0af19f87eb6d99eb2ef1beec331c290155
    source_path: help/testing.md
    workflow: 15
---

OpenClaw tiene tres suites de Vitest (unit/integration, e2e, live) y un pequeño conjunto
de ejecutores Docker. Este documento es una guía de "cómo probamos":

- Qué cubre cada suite (y qué deliberadamente _no_ cubre).
- Qué comandos ejecutar para flujos de trabajo comunes (local, antes de push, depuración).
- Cómo las pruebas live detectan credenciales y seleccionan modelos/proveedores.
- Cómo agregar regresiones para problemas reales de modelos/proveedores.

## Inicio rápido

La mayoría de los días:

- Puerta completa (se espera antes de push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Ejecución local más rápida de la suite completa en una máquina con recursos: `pnpm test:max`
- Bucle directo de watch de Vitest: `pnpm test:watch`
- La selección directa por archivo ahora también enruta rutas de extensiones/canales: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefiere primero ejecuciones dirigidas cuando estés iterando sobre un solo fallo.
- Sitio QA respaldado por Docker: `pnpm qa:lab:up`
- Canal QA respaldado por VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Cuando tocas pruebas o quieres más confianza:

- Puerta de cobertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Cuando depuras proveedores/modelos reales (requiere credenciales reales):

- Suite live (modelos + sondas de herramientas/imágenes del gateway): `pnpm test:live`
- Dirigir un archivo live en silencio: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Barrido live de modelos en Docker: `pnpm test:docker:live-models`
  - Cada modelo seleccionado ahora ejecuta un turno de texto más una pequeña sonda de estilo lectura de archivo.
    Los modelos cuyos metadatos anuncian entrada `image` también ejecutan un pequeño turno de imagen.
    Desactiva las sondas adicionales con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` cuando estés aislando fallos del proveedor.
  - Cobertura de CI: las comprobaciones diarias `OpenClaw Scheduled Live And E2E Checks` y las manuales
    `OpenClaw Release Checks` llaman ambas al flujo reutilizable live/E2E con
    `include_live_suites: true`, que incluye trabajos separados de matriz Docker live de modelos
    fragmentados por proveedor.
  - Para reejecuciones de CI centradas, despacha `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` y `live_models_only: true`.
  - Agrega nuevos secretos de proveedor de alta señal a `scripts/ci-hydrate-live-auth.sh`
    más `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` y sus
    llamadores programados/de lanzamiento.
- Smoke nativo de chat vinculado de Codex: `pnpm test:docker:live-codex-bind`
  - Ejecuta un canal live de Docker contra la ruta del servidor de aplicaciones Codex, vincula un DM sintético
    de Slack con `/codex bind`, ejercita `/codex fast` y
    `/codex permissions`, y luego verifica que una respuesta simple y un adjunto de imagen
    se enrutan a través de la vinculación nativa del Plugin en lugar de ACP.
- Smoke de harness del servidor de aplicaciones Codex: `pnpm test:docker:live-codex-harness`
  - Ejecuta turnos de agente del gateway a través del harness del servidor de aplicaciones Codex propiedad del Plugin,
    verifica `/codex status` y `/codex models`, y por defecto ejercita sondas de imagen,
    Cron MCP, subagente y Guardian. Desactiva la sonda de subagente con
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` cuando estés aislando otros fallos del servidor
    de aplicaciones Codex. Para una comprobación centrada de subagente, desactiva las otras sondas:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Esto termina después de la sonda de subagente salvo que
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` esté definido.
- Smoke del comando de rescate de Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Comprobación opcional de máxima seguridad para la superficie del comando de rescate
    del canal de mensajes. Ejercita `/crestodian status`, pone en cola un cambio persistente
    de modelo, responde `/crestodian yes` y verifica la ruta de auditoría/escritura de configuración.
- Smoke Docker del planificador de Crestodian: `pnpm test:docker:crestodian-planner`
  - Ejecuta Crestodian en un contenedor sin configuración con un Claude CLI falso en `PATH`
    y verifica que el respaldo difuso del planificador se traduzca en una escritura tipada
    de configuración auditada.
- Smoke Docker de primera ejecución de Crestodian: `pnpm test:docker:crestodian-first-run`
  - Comienza desde un directorio de estado vacío de OpenClaw, enruta `openclaw` sin argumentos a
    Crestodian, aplica escrituras de configuración para setup/model/agent/Plugin de Discord + SecretRef,
    valida la configuración y verifica las entradas de auditoría. La misma ruta de setup de Ring 0
    también está cubierta en QA Lab mediante
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de costo de Moonshot/Kimi: con `MOONSHOT_API_KEY` definido, ejecuta
  `openclaw models list --provider moonshot --json`, luego ejecuta un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  aislado contra `moonshot/kimi-k2.6`. Verifica que el JSON informe Moonshot/K2.6 y que la
  transcripción del asistente almacene `usage.cost` normalizado.

Consejo: cuando solo necesites un caso que falla, prefiere reducir las pruebas live mediante las variables de entorno de lista de permitidos descritas a continuación.

## Ejecutores específicos de QA

Estos comandos acompañan a las suites principales de prueba cuando necesitas realismo de QA-lab:

CI ejecuta QA Lab en flujos de trabajo dedicados. `Parity gate` se ejecuta en PRs que coinciden y
desde despacho manual con proveedores simulados. `QA-Lab - All Lanes` se ejecuta cada noche en
`main` y desde despacho manual con la puerta de paridad simulada, el canal live de Matrix y el
canal live de Telegram administrado por Convex como trabajos paralelos. `OpenClaw Release Checks`
ejecuta los mismos canales antes de la aprobación del lanzamiento.

- `pnpm openclaw qa suite`
  - Ejecuta escenarios QA respaldados por el repositorio directamente en el host.
  - Ejecuta múltiples escenarios seleccionados en paralelo de forma predeterminada con workers
    aislados de gateway. `qa-channel` usa por defecto concurrencia 4 (limitada por la
    cantidad de escenarios seleccionados). Usa `--concurrency <count>` para ajustar la cantidad
    de workers, o `--concurrency 1` para el canal serial anterior.
  - Termina con un código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
    quieras artefactos sin un código de salida fallido.
  - Admite modos de proveedor `live-frontier`, `mock-openai` y `aimock`.
    `aimock` inicia un servidor local de proveedor respaldado por AIMock para cobertura experimental
    de fixtures y simulación de protocolo sin reemplazar el canal `mock-openai`
    con reconocimiento de escenarios.
- `pnpm openclaw qa suite --runner multipass`
  - Ejecuta la misma suite QA dentro de una VM Linux Multipass desechable.
  - Conserva el mismo comportamiento de selección de escenarios que `qa suite` en el host.
  - Reutiliza las mismas opciones de selección de proveedor/modelo que `qa suite`.
  - Las ejecuciones live reenvían las entradas de autenticación QA compatibles que son prácticas para el invitado:
    claves de proveedor basadas en entorno, la ruta de configuración del proveedor live de QA y `CODEX_HOME`
    cuando esté presente.
  - Los directorios de salida deben permanecer bajo la raíz del repositorio para que el invitado pueda escribir de vuelta a través
    del espacio de trabajo montado.
  - Escribe el informe y resumen normales de QA más los registros de Multipass bajo
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia el sitio QA respaldado por Docker para trabajo de QA estilo operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Construye un tarball npm desde el checkout actual, lo instala globalmente en
    Docker, ejecuta la incorporación no interactiva con clave de API de OpenAI, configura Telegram
    de forma predeterminada, verifica que habilitar el Plugin instala dependencias de tiempo de ejecución a demanda,
    ejecuta doctor y ejecuta un turno local de agente contra un endpoint OpenAI simulado.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para ejecutar el mismo
    canal de instalación empaquetada con Discord.
- `pnpm test:docker:session-runtime-context`
  - Ejecuta un smoke determinista de Docker de app compilada para transcripciones de contexto
    de tiempo de ejecución integrado. Verifica que el contexto oculto de tiempo de ejecución de OpenClaw se conserve como un
    mensaje personalizado no visible en lugar de filtrarse al turno visible de la persona usuaria,
    luego inicializa un JSONL de sesión roto afectado y verifica que
    `openclaw doctor --fix` lo reescriba a la rama activa con una copia de seguridad.
- `pnpm test:docker:npm-telegram-live`
  - Instala un paquete publicado de OpenClaw en Docker, ejecuta incorporación
    de paquete instalado, configura Telegram mediante la CLI instalada y luego reutiliza el
    canal live de Telegram QA con ese paquete instalado como Gateway SUT.
  - Usa por defecto `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Usa las mismas credenciales de entorno de Telegram o la misma fuente de credenciales Convex que
    `pnpm openclaw qa telegram`. Para automatización de CI/lanzamiento, establece
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` más
    `OPENCLAW_QA_CONVEX_SITE_URL` y el secreto de rol. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` y un secreto de rol de Convex están presentes en CI,
    el wrapper de Docker selecciona Convex automáticamente.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` anula el
    `OPENCLAW_QA_CREDENTIAL_ROLE` compartido solo para este canal.
  - GitHub Actions expone este canal como el flujo de trabajo manual para mantenedores
    `NPM Telegram Beta E2E`. No se ejecuta al fusionar. El flujo de trabajo usa el
    entorno `qa-live-shared` y concesiones de credenciales CI de Convex.
- `pnpm test:docker:bundled-channel-deps`
  - Empaqueta e instala la compilación actual de OpenClaw en Docker, inicia el Gateway
    con OpenAI configurado y luego habilita canales/Plugins incluidos mediante ediciones
    de configuración.
  - Verifica que el descubrimiento del setup deja ausentes las dependencias de tiempo de ejecución del Plugin no configurado, que la primera ejecución configurada de Gateway o doctor instala a demanda las dependencias de tiempo de ejecución de cada Plugin incluido, y que un segundo reinicio no reinstala dependencias que ya fueron activadas.
  - También instala una línea base npm antigua conocida, habilita Telegram antes de ejecutar
    `openclaw update --tag <candidate>`, y verifica que el
    doctor posterior a la actualización del candidato repara las dependencias de tiempo de ejecución de canales incluidos sin una reparación postinstall del lado del harness.
- `pnpm test:parallels:npm-update`
  - Ejecuta el smoke nativo de actualización de instalación empaquetada en invitados de Parallels. Cada
    plataforma seleccionada primero instala el paquete base solicitado, luego ejecuta el comando
    `openclaw update` instalado en el mismo invitado y verifica la versión instalada,
    el estado de actualización, la preparación del gateway y un turno local de agente.
  - Usa `--platform macos`, `--platform windows` o `--platform linux` mientras
    iteras en un solo invitado. Usa `--json` para la ruta del artefacto de resumen y el estado por canal.
  - El canal OpenAI usa `openai/gpt-5.5` para la prueba live del turno de agente de forma predeterminada. Pasa `--model <provider/model>` o define
    `OPENCLAW_PARALLELS_OPENAI_MODEL` cuando estés validando deliberadamente otro modelo OpenAI.
  - Envuelve ejecuciones locales largas en un timeout del host para que los bloqueos del transporte de Parallels no consuman el resto de la ventana de pruebas:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - El script escribe registros anidados del canal bajo `/tmp/openclaw-parallels-npm-update.*`.
    Inspecciona `windows-update.log`, `macos-update.log` o `linux-update.log`
    antes de asumir que el wrapper externo está bloqueado.
  - La actualización de Windows puede tardar entre 10 y 15 minutos en doctor posterior a la actualización/reparación
    de dependencias de tiempo de ejecución en un invitado frío; eso sigue siendo saludable cuando el
    registro de depuración npm anidado está avanzando.
  - No ejecutes este wrapper agregado en paralelo con canales individuales de smoke de Parallels
    en macOS, Windows o Linux. Comparten estado de VM y pueden colisionar en la
    restauración de instantáneas, el servicio de paquetes o el estado del gateway del invitado.
  - La prueba posterior a la actualización ejecuta la superficie normal del Plugin incluido porque
    los facades de capacidad como voz, generación de imágenes y comprensión
    multimedia se cargan mediante APIs de tiempo de ejecución incluidas incluso cuando el turno
    del agente solo comprueba una respuesta de texto simple.

- `pnpm openclaw qa aimock`
  - Inicia solo el servidor local de proveedor AIMock para pruebas directas de protocolo smoke.
- `pnpm openclaw qa matrix`
  - Ejecuta el canal QA live de Matrix contra un homeserver Tuwunel desechable respaldado por Docker.
  - Este host QA hoy es solo para repositorio/desarrollo. Las instalaciones empaquetadas de OpenClaw no incluyen
    `qa-lab`, por lo que no exponen `openclaw qa`.
  - Los checkouts del repositorio cargan directamente el ejecutor incluido; no se necesita un paso separado
    de instalación de Plugin.
  - Aprovisiona tres usuarios temporales de Matrix (`driver`, `sut`, `observer`) más una sala privada, y luego inicia un proceso hijo QA de gateway con el Plugin real de Matrix como transporte SUT.
  - Usa la imagen estable fijada de Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1` por defecto. Anúlala con `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` cuando necesites probar otra imagen.
  - Matrix no expone indicadores compartidos de fuente de credenciales porque el canal aprovisiona usuarios desechables localmente.
  - Escribe un informe QA de Matrix, resumen, artefacto de eventos observados y registro combinado de stdout/stderr bajo `.artifacts/qa-e2e/...`.
  - Emite progreso por defecto y aplica un timeout estricto de ejecución con `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (predeterminado 30 minutos). La limpieza está acotada por `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` y los fallos incluyen el comando de recuperación `docker compose ... down --remove-orphans`.
- `pnpm openclaw qa telegram`
  - Ejecuta el canal QA live de Telegram contra un grupo privado real usando los tokens de bot de driver y SUT desde el entorno.
  - Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. El id del grupo debe ser el id numérico del chat de Telegram.
  - Admite `--credential-source convex` para credenciales agrupadas compartidas. Usa por defecto el modo entorno, o establece `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por concesiones agrupadas.
  - Termina con un código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando quieras artefactos sin un código de salida fallido.
  - Requiere dos bots distintos en el mismo grupo privado, con el bot SUT exponiendo un nombre de usuario de Telegram.
  - Para una observación estable bot a bot, habilita Bot-to-Bot Communication Mode en `@BotFather` para ambos bots y asegúrate de que el bot driver pueda observar tráfico de bots del grupo.
  - Escribe un informe QA de Telegram, resumen y artefacto de mensajes observados bajo `.artifacts/qa-e2e/...`. Los escenarios de respuesta incluyen RTT desde la solicitud de envío del driver hasta la respuesta observada del SUT.

Los canales de transporte live comparten un contrato estándar para que los nuevos transportes no diverjan:

`qa-channel` sigue siendo la amplia suite QA sintética y no forma parte de la matriz de cobertura de transporte live.

| Canal    | Canary | Filtrado por mención | Bloqueo por lista de permitidos | Respuesta de nivel superior | Reanudación tras reinicio | Seguimiento de hilo | Aislamiento de hilo | Observación de reacciones | Comando de ayuda |
| -------- | ------ | -------------------- | ------------------------------- | --------------------------- | ------------------------- | ------------------- | ------------------- | ------------------------- | ---------------- |
| Matrix   | x      | x                    | x                               | x                           | x                         | x                   | x                   | x                         |                  |
| Telegram | x      |                      |                                 |                             |                           |                     |                     |                           | x                |

### Credenciales compartidas de Telegram mediante Convex (v1)

Cuando se habilita `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) para
`openclaw qa telegram`, QA lab adquiere una concesión exclusiva de un grupo respaldado por Convex, mantiene
esa concesión mediante Heartbeat mientras el canal está en ejecución y la libera al apagarse.

Referencia de andamiaje del proyecto Convex:

- `qa/convex-credential-broker/`

Variables de entorno requeridas:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por ejemplo `https://your-deployment.convex.site`)
- Un secreto para el rol seleccionado:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Selección de rol de credencial:
  - CLI: `--credential-role maintainer|ci`
  - Valor predeterminado por entorno: `OPENCLAW_QA_CREDENTIAL_ROLE` (usa `ci` por defecto en CI, `maintainer` en caso contrario)

Variables de entorno opcionales:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predeterminado `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predeterminado `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predeterminado `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predeterminado `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predeterminado `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de seguimiento opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs Convex `http://` de loopback para desarrollo solo local.

`OPENCLAW_QA_CONVEX_SITE_URL` debe usar `https://` en operación normal.

Los comandos administrativos del mantenedor (agregar/quitar/listar del grupo) requieren
específicamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Ayudantes CLI para mantenedores:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `doctor` antes de ejecuciones live para comprobar la URL del sitio Convex, secretos del broker,
prefijo del endpoint, timeout HTTP y accesibilidad de admin/list sin imprimir
valores secretos. Usa `--json` para salida legible por máquina en scripts y utilidades de CI.

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
- `POST /admin/add` (solo secreto de mantenedor)
  - Solicitud: `{ kind, actorId, payload, note?, status? }`
  - Éxito: `{ status: "ok", credential }`
- `POST /admin/remove` (solo secreto de mantenedor)
  - Solicitud: `{ credentialId, actorId }`
  - Éxito: `{ status: "ok", changed, credential }`
  - Protección de concesión activa: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo secreto de mantenedor)
  - Solicitud: `{ kind?, status?, includePayload?, limit? }`
  - Éxito: `{ status: "ok", credentials, count }`

Forma de la carga útil para el tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` debe ser una cadena numérica de id de chat de Telegram.
- `admin/add` valida esta forma para `kind: "telegram"` y rechaza cargas útiles mal formadas.

### Agregar un canal a QA

Agregar un canal al sistema QA en markdown requiere exactamente dos cosas:

1. Un adaptador de transporte para el canal.
2. Un paquete de escenarios que ejercite el contrato del canal.

No agregues una nueva raíz de comando QA de nivel superior cuando el host compartido `qa-lab` pueda encargarse del flujo.

`qa-lab` es responsable de la mecánica compartida del host:

- la raíz del comando `openclaw qa`
- inicio y desmontaje de la suite
- concurrencia de workers
- escritura de artefactos
- generación de informes
- ejecución de escenarios
- alias de compatibilidad para escenarios antiguos de `qa-channel`

Los Plugins ejecutores son responsables del contrato de transporte:

- cómo se monta `openclaw qa <runner>` bajo la raíz compartida `qa`
- cómo se configura el gateway para ese transporte
- cómo se comprueba la preparación
- cómo se inyectan eventos entrantes
- cómo se observan mensajes salientes
- cómo se exponen transcripciones y estado de transporte normalizado
- cómo se ejecutan acciones respaldadas por transporte
- cómo se gestiona el restablecimiento o limpieza específicos del transporte

La barrera mínima de adopción para un nuevo canal es:

1. Mantener `qa-lab` como propietario de la raíz compartida `qa`.
2. Implementar el ejecutor de transporte en la interfaz del host compartido `qa-lab`.
3. Mantener la mecánica específica del transporte dentro del Plugin ejecutor o del harness del canal.
4. Montar el ejecutor como `openclaw qa <runner>` en lugar de registrar una raíz de comando competidora.
   Los Plugins ejecutores deben declarar `qaRunners` en `openclaw.plugin.json` y exportar una matriz `qaRunnerCliRegistrations` correspondiente desde `runtime-api.ts`.
   Mantén `runtime-api.ts` liviano; la CLI perezosa y la ejecución del runner deben quedar detrás de entrypoints separados.
5. Crear o adaptar escenarios markdown bajo los directorios temáticos `qa/scenarios/`.
6. Usar los ayudantes genéricos de escenarios para nuevos escenarios.
7. Mantener funcionando los alias de compatibilidad existentes salvo que el repositorio esté haciendo una migración intencional.

La regla de decisión es estricta:

- Si el comportamiento puede expresarse una vez en `qa-lab`, colócalo en `qa-lab`.
- Si el comportamiento depende de un transporte de canal, mantenlo en ese Plugin ejecutor o harness del Plugin.
- Si un escenario necesita una nueva capacidad que más de un canal pueda usar, agrega un ayudante genérico en lugar de una rama específica de canal en `suite.ts`.
- Si un comportamiento solo tiene sentido para un transporte, mantén el escenario específico del transporte y hazlo explícito en el contrato del escenario.

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

El trabajo en nuevos canales debe usar los nombres genéricos de los ayudantes.
Los alias de compatibilidad existen para evitar una migración tipo flag day, no como modelo para
la creación de nuevos escenarios.

## Suites de prueba (qué se ejecuta y dónde)

Piensa en las suites como “realismo creciente” (y también creciente fragilidad/costo):

### Unit / integration (predeterminado)

- Comando: `pnpm test`
- Configuración: las ejecuciones no dirigidas usan el conjunto fragmentado `vitest.full-*.config.ts` y pueden expandir fragmentos multiproyecto en configuraciones por proyecto para programación paralela
- Archivos: inventarios core/unit bajo `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` y las pruebas node permitidas de `ui` cubiertas por `vitest.unit.config.ts`
- Alcance:
  - Pruebas unitarias puras
  - Pruebas de integración en proceso (autenticación de gateway, enrutamiento, herramientas, análisis, configuración)
  - Regresiones deterministas para errores conocidos
- Expectativas:
  - Se ejecuta en CI
  - No requiere claves reales
  - Debe ser rápida y estable

<AccordionGroup>
  <Accordion title="Proyectos, fragmentos y canales con alcance">

    - `pnpm test` no dirigido ejecuta doce configuraciones de fragmentos más pequeños (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) en lugar de un único proceso gigante del proyecto raíz nativo. Esto reduce el RSS máximo en máquinas cargadas y evita que el trabajo de auto-reply/extensiones bloquee suites no relacionadas.
    - `pnpm test --watch` sigue usando el grafo de proyectos raíz nativo de `vitest.config.ts`, porque un bucle watch con múltiples fragmentos no es práctico.
    - `pnpm test`, `pnpm test:watch` y `pnpm test:perf:imports` enrutan primero objetivos explícitos de archivo/directorio a través de canales con alcance, así que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar el costo total de inicio del proyecto raíz.
    - `pnpm test:changed` expande rutas git modificadas a los mismos canales con alcance cuando el diff solo toca archivos fuente/de prueba enroutables; las ediciones de configuración/setup siguen recurriendo a la reejecución amplia del proyecto raíz.
    - `pnpm check:changed` es la puerta local inteligente normal para trabajo acotado. Clasifica el diff en core, pruebas de core, extensiones, pruebas de extensiones, apps, docs, metadatos de lanzamiento, herramientas Docker live y tooling, y luego ejecuta los canales de typecheck/lint/test correspondientes. Los cambios en el SDK público de Plugin y en contratos de plugins incluyen una pasada de validación de extensiones porque las extensiones dependen de esos contratos del core. Los incrementos de versión solo en metadatos de lanzamiento ejecutan verificaciones dirigidas de versión/configuración/dependencias raíz en lugar de la suite completa, con una protección que rechaza cambios de paquete fuera del campo de versión de nivel superior.
    - Las ediciones del harness Docker live de ACP ejecutan una puerta local enfocada: sintaxis de shell para los scripts de autenticación live Docker, simulación en seco del programador live Docker, pruebas unitarias de vinculación ACP y las pruebas de la extensión ACPX. Los cambios en `package.json` se incluyen solo cuando el diff está limitado a `scripts["test:docker:live-*"]`; los cambios de dependencias, exports, versión y otras superficies del paquete siguen usando las protecciones más amplias.
    - Las pruebas unitarias ligeras en imports desde agentes, comandos, plugins, ayudantes de auto-reply, `plugin-sdk` y áreas similares de utilidades puras se enrutan por el canal `unit-fast`, que omite `test/setup-openclaw-runtime.ts`; los archivos con estado o tiempo de ejecución pesado permanecen en los canales existentes.
    - Algunos archivos fuente auxiliares seleccionados de `plugin-sdk` y `commands` también asignan ejecuciones en modo changed a pruebas hermanas explícitas en esos canales ligeros, de modo que las ediciones de helpers evitan reejecutar toda la suite pesada de ese directorio.
    - `auto-reply` tiene grupos dedicados para helpers principales de nivel superior del core, pruebas de integración `reply.*` de nivel superior y el subárbol `src/auto-reply/reply/**`. CI divide además el subárbol reply en fragmentos de agent-runner, dispatch y commands/state-routing para que un grupo pesado en imports no se adueñe de toda la cola final de Node.

  </Accordion>

  <Accordion title="Cobertura del ejecutor integrado">

    - Cuando cambies entradas de descubrimiento de herramientas de mensajes o el contexto de tiempo de ejecución de Compaction, mantén ambos niveles de cobertura.
    - Agrega regresiones enfocadas de helpers para límites puros de enrutamiento y normalización.
    - Mantén saludables las suites de integración del ejecutor integrado:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` y
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Esas suites verifican que los ids con alcance y el comportamiento de Compaction sigan fluyendo por las rutas reales de `run.ts` / `compact.ts`; las pruebas solo de helpers no son un sustituto suficiente para esas rutas de integración.

  </Accordion>

  <Accordion title="Valores predeterminados del pool y aislamiento de Vitest">

    - La configuración base de Vitest usa por defecto `threads`.
    - La configuración compartida de Vitest fija `isolate: false` y usa el ejecutor no aislado en los proyectos raíz, e2e y live.
    - El canal UI raíz conserva su configuración y optimizador `jsdom`, pero también se ejecuta en el ejecutor compartido no aislado.
    - Cada fragmento de `pnpm test` hereda los mismos valores predeterminados `threads` + `isolate: false` de la configuración compartida de Vitest.
    - `scripts/run-vitest.mjs` agrega `--no-maglev` por defecto a los procesos Node hijo de Vitest para reducir el churn de compilación V8 durante grandes ejecuciones locales.
      Establece `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar con el comportamiento V8 estándar.

  </Accordion>

  <Accordion title="Iteración local rápida">

    - `pnpm changed:lanes` muestra qué canales arquitectónicos activa un diff.
    - El hook pre-commit es solo de formato. Vuelve a stagear archivos formateados y no ejecuta lint, typecheck ni pruebas.
    - Ejecuta `pnpm check:changed` explícitamente antes de entregar o hacer push cuando necesites la puerta local inteligente. Los cambios en el SDK público de Plugin y contratos de plugins incluyen una pasada de validación de extensiones.
    - `pnpm test:changed` enruta a través de canales con alcance cuando las rutas modificadas se asignan limpiamente a una suite más pequeña.
    - `pnpm test:max` y `pnpm test:changed:max` mantienen el mismo comportamiento de enrutamiento, solo que con un límite más alto de workers.
    - El autoescalado local de workers es intencionalmente conservador y reduce intensidad cuando la carga media del host ya es alta, por lo que múltiples ejecuciones concurrentes de Vitest causan menos daño por defecto.
    - La configuración base de Vitest marca los archivos de proyectos/configuración como `forceRerunTriggers` para que las reejecuciones en modo changed sigan siendo correctas cuando cambie el cableado de pruebas.
    - La configuración mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado en hosts compatibles; establece `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si quieres una ubicación explícita de caché para perfilado directo.

  </Accordion>

  <Accordion title="Depuración de rendimiento">

    - `pnpm test:perf:imports` habilita informes de duración de imports de Vitest más salida detallada de desglose de imports.
    - `pnpm test:perf:imports:changed` acota la misma vista de perfilado a archivos modificados desde `origin/main`.
    - Los datos de temporización de fragmentos se escriben en `.artifacts/vitest-shard-timings.json`.
      Las ejecuciones de configuración completa usan la ruta de configuración como clave; los fragmentos CI con patrón include agregan el nombre del fragmento para que los fragmentos filtrados puedan rastrearse por separado.
    - Cuando una prueba caliente sigue gastando la mayor parte del tiempo en imports de arranque, mantén las dependencias pesadas detrás de una interfaz local estrecha `*.runtime.ts` y simula esa interfaz directamente en lugar de hacer deep-import de helpers de tiempo de ejecución solo para pasarlos mediante `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara el `test:changed` enrutado con la ruta nativa del proyecto raíz para ese diff confirmado e imprime tiempo total y RSS máximo de macOS.
    - `pnpm test:perf:changed:bench -- --worktree` compara el árbol de trabajo actual sin confirmar enroutando la lista de archivos modificados a través de `scripts/test-projects.mjs` y la configuración raíz de Vitest.
    - `pnpm test:perf:profile:main` escribe un perfil CPU del hilo principal para el arranque de Vitest/Vite y la sobrecarga de transformaciones.
    - `pnpm test:perf:profile:runner` escribe perfiles CPU+heap del ejecutor para la suite unitaria con el paralelismo por archivo desactivado.

  </Accordion>
</AccordionGroup>

### Estabilidad (gateway)

- Comando: `pnpm test:stability:gateway`
- Configuración: `vitest.gateway.config.ts`, forzado a un worker
- Alcance:
  - Inicia un Gateway real en loopback con diagnóstico habilitado por defecto
  - Conduce mensajes sintéticos de gateway, memoria y churn de cargas útiles grandes por la ruta de eventos de diagnóstico
  - Consulta `diagnostics.stability` mediante RPC WS del Gateway
  - Cubre ayudantes de persistencia del paquete de estabilidad de diagnóstico
  - Verifica que el registrador permanezca acotado, que las muestras sintéticas de RSS se mantengan por debajo del presupuesto de presión y que la profundidad de cola por sesión vuelva a cero
- Expectativas:
  - Seguro para CI y sin claves
  - Canal estrecho para seguimiento de regresiones de estabilidad, no un sustituto de la suite completa de Gateway

### E2E (smoke de gateway)

- Comando: `pnpm test:e2e`
- Configuración: `vitest.e2e.config.ts`
- Archivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` y pruebas E2E de Plugins incluidos bajo `extensions/`
- Valores predeterminados del tiempo de ejecución:
  - Usa `threads` de Vitest con `isolate: false`, igual que el resto del repositorio.
  - Usa workers adaptativos (CI: hasta 2, local: 1 por defecto).
  - Se ejecuta en modo silencioso por defecto para reducir la sobrecarga de I/O en consola.
- Anulaciones útiles:
  - `OPENCLAW_E2E_WORKERS=<n>` para forzar la cantidad de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para volver a habilitar salida detallada en consola.
- Alcance:
  - Comportamiento end-to-end de gateway en varias instancias
  - Superficies WebSocket/HTTP, emparejamiento de nodes y redes más pesadas
- Expectativas:
  - Se ejecuta en CI (cuando está habilitado en la canalización)
  - No requiere claves reales
  - Tiene más partes móviles que las pruebas unitarias (puede ser más lenta)

### E2E: smoke del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Archivo: `extensions/openshell/src/backend.e2e.test.ts`
- Alcance:
  - Inicia un gateway OpenShell aislado en el host mediante Docker
  - Crea un sandbox a partir de un Dockerfile local temporal
  - Ejercita el backend OpenShell de OpenClaw sobre `sandbox ssh-config` real + ejecución SSH
  - Verifica el comportamiento canónico remoto del sistema de archivos a través del puente fs del sandbox
- Expectativas:
  - Solo opcional; no forma parte de la ejecución predeterminada `pnpm test:e2e`
  - Requiere un CLI local `openshell` más un daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` aislados y luego destruye el gateway y sandbox de prueba
- Anulaciones útiles:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar la prueba al ejecutar manualmente la suite e2e más amplia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apuntar a un binario CLI no predeterminado o a un script wrapper

### Live (proveedores reales + modelos reales)

- Comando: `pnpm test:live`
- Configuración: `vitest.live.config.ts`
- Archivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` y pruebas live de Plugins incluidos bajo `extensions/`
- Predeterminado: **habilitado** por `pnpm test:live` (establece `OPENCLAW_LIVE_TEST=1`)
- Alcance:
  - “¿Este proveedor/modelo realmente funciona _hoy_ con credenciales reales?”
  - Captura cambios de formato del proveedor, particularidades de tool calling, problemas de autenticación y comportamiento de límites de tasa
- Expectativas:
  - No es estable para CI por diseño (redes reales, políticas reales del proveedor, cuotas, caídas)
  - Cuesta dinero / consume límites de tasa
  - Prefiere ejecutar subconjuntos acotados en lugar de “todo”
- Las ejecuciones live cargan `~/.profile` para recoger claves de API faltantes.
- Por defecto, las ejecuciones live siguen aislando `HOME` y copian material de configuración/autenticación a un hogar temporal de prueba para que los fixtures unitarios no muten tu `~/.openclaw` real.
- Establece `OPENCLAW_LIVE_USE_REAL_HOME=1` solo cuando necesites intencionalmente que las pruebas live usen tu directorio home real.
- `pnpm test:live` ahora usa por defecto un modo más silencioso: mantiene la salida de progreso `[live] ...`, pero suprime el aviso adicional de `~/.profile` y silencia los registros de arranque del gateway/chatter de Bonjour. Establece `OPENCLAW_LIVE_TEST_QUIET=0` si quieres recuperar los registros completos de inicio.
- Rotación de claves de API (específica por proveedor): establece `*_API_KEYS` con formato coma/punto y coma o `*_API_KEY_1`, `*_API_KEY_2` (por ejemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) o una anulación por live mediante `OPENCLAW_LIVE_*_KEY`; las pruebas reintentan ante respuestas de límite de tasa.
- Salida de progreso/heartbeat:
  - Las suites live ahora emiten líneas de progreso a stderr para que las llamadas largas al proveedor se vean activas incluso cuando la captura de consola de Vitest está en modo silencioso.
  - `vitest.live.config.ts` desactiva la interceptación de consola de Vitest para que las líneas de progreso de proveedor/gateway se transmitan inmediatamente durante las ejecuciones live.
  - Ajusta los heartbeats de modelo directo con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajusta los heartbeats de gateway/sonda con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## ¿Qué suite debo ejecutar?

Usa esta tabla de decisión:

- Editando lógica/pruebas: ejecuta `pnpm test` (y `pnpm test:coverage` si cambiaste mucho)
- Tocando redes de gateway / protocolo WS / emparejamiento: agrega `pnpm test:e2e`
- Depurando “mi bot no funciona” / fallos específicos del proveedor / tool calling: ejecuta un `pnpm test:live` acotado

## Pruebas live (que tocan la red)

Para la matriz live de modelos, los smoke de backend de CLI, los smoke de ACP, el harness
del servidor de aplicaciones Codex y todas las pruebas live de proveedores multimedia
(Deepgram, BytePlus, ComfyUI, imagen, música, video, harness multimedia), además del
manejo de credenciales para ejecuciones live, consulta
[Pruebas — suites live](/es/help/testing-live).

## Ejecutores Docker (comprobaciones opcionales de "funciona en Linux")

Estos ejecutores Docker se dividen en dos grupos:

- Ejecutores live de modelos: `test:docker:live-models` y `test:docker:live-gateway` ejecutan solo su archivo live correspondiente de clave de perfil dentro de la imagen Docker del repositorio (`src/agents/models.profiles.live.test.ts` y `src/gateway/gateway-models.profiles.live.test.ts`), montando tu directorio local de configuración y el espacio de trabajo (y cargando `~/.profile` si está montado). Los entrypoints locales correspondientes son `test:live:models-profiles` y `test:live:gateway-profiles`.
- Los ejecutores Docker live usan por defecto un límite smoke más pequeño para que un barrido Docker completo siga siendo práctico:
  `test:docker:live-models` usa por defecto `OPENCLAW_LIVE_MAX_MODELS=12`, y
  `test:docker:live-gateway` usa por defecto `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` y
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Anula esas variables de entorno cuando
  explícitamente quieras el escaneo exhaustivo más grande.
- `test:docker:all` construye una vez la imagen Docker live mediante `test:docker:live-build`, y luego la reutiliza para los canales Docker live. También construye una imagen compartida `scripts/e2e/Dockerfile` mediante `test:docker:e2e-build` y la reutiliza para los ejecutores smoke E2E en contenedor que ejercitan la app compilada. El agregado usa un programador local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla los espacios de proceso, mientras que los límites de recursos evitan que canales pesados live, de instalación npm y multiservicio arranquen todos a la vez. Los valores predeterminados son 10 espacios, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` y `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajusta `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` solo cuando el host Docker tenga más margen. El ejecutor realiza por defecto una comprobación previa de Docker, elimina contenedores E2E obsoletos de OpenClaw, imprime estado cada 30 segundos, almacena los tiempos correctos de los canales en `.artifacts/docker-tests/lane-timings.json` y usa esos tiempos para iniciar primero los canales más largos en ejecuciones posteriores. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir el manifiesto ponderado de canales sin construir ni ejecutar Docker.
- Ejecutores smoke de contenedor: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` y `test:docker:config-reload` arrancan uno o más contenedores reales y verifican rutas de integración de nivel superior.

Los ejecutores Docker live de modelos también montan mediante bind solo los homes de autenticación CLI necesarios (o todos los compatibles cuando la ejecución no está acotada), luego los copian al home del contenedor antes de la ejecución para que OAuth de CLI externo pueda refrescar tokens sin mutar el almacén de autenticación del host:

- Modelos directos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de vinculación ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; cubre Claude, Codex y Gemini por defecto, con cobertura estricta de Droid/OpenCode mediante `pnpm test:docker:live-acp-bind:droid` y `pnpm test:docker:live-acp-bind:opencode`)
- Smoke de backend de CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke del harness del servidor de aplicaciones Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desarrollo: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live de Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Asistente de incorporación (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke de incorporación/canal/agente con tarball npm: `pnpm test:docker:npm-onboard-channel-agent` instala globalmente en Docker el tarball empaquetado de OpenClaw, configura OpenAI mediante incorporación con referencia de entorno más Telegram por defecto, verifica que doctor repare dependencias de tiempo de ejecución activadas del Plugin y ejecuta un turno de agente OpenAI simulado. Reutiliza un tarball preconstruido con `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la reconstrucción del host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, o cambia de canal con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke de cambio de canal de actualización: `pnpm test:docker:update-channel-switch` instala globalmente en Docker el tarball empaquetado de OpenClaw, cambia de paquete `stable` a git `dev`, verifica el canal persistido y el funcionamiento del Plugin tras la actualización, luego vuelve a cambiar a paquete `stable` y comprueba el estado de actualización.
- Smoke de contexto de tiempo de ejecución de sesión: `pnpm test:docker:session-runtime-context` verifica la persistencia oculta de transcripciones del contexto de tiempo de ejecución más la reparación por doctor de ramas afectadas de reescritura duplicada de prompt.
- Smoke de instalación global con Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empaqueta el árbol actual, lo instala con `bun install -g` en un home aislado y verifica que `openclaw infer image providers --json` devuelva proveedores de imagen incluidos en lugar de quedarse colgado. Reutiliza un tarball preconstruido con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la compilación del host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, o copia `dist/` desde una imagen Docker ya construida con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker del instalador: `bash scripts/test-install-sh-docker.sh` comparte una sola caché npm entre sus contenedores root, update y direct-npm. El smoke de actualización usa por defecto npm `latest` como línea base estable antes de actualizar al tarball candidato. Las comprobaciones del instalador no root mantienen una caché npm aislada para que entradas de caché propiedad de root no oculten el comportamiento de instalación local del usuario. Establece `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar la caché root/update/direct-npm entre reejecuciones locales.
- Install Smoke CI omite la actualización global duplicada de direct-npm con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; ejecuta el script localmente sin esa variable si necesitas cobertura de `npm install -g` directo.
- Smoke de CLI para eliminar espacio de trabajo compartido de agentes: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) construye por defecto la imagen raíz del Dockerfile, inicializa dos agentes con un espacio de trabajo en un home aislado del contenedor, ejecuta `agents delete --json` y verifica JSON válido más el comportamiento de conservación del espacio de trabajo. Reutiliza la imagen install-smoke con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Redes del gateway (dos contenedores, autenticación WS + salud): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoke de instantánea CDP del navegador: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) construye la imagen fuente E2E más una capa Chromium, inicia Chromium con CDP sin procesar, ejecuta `browser doctor --deep` y verifica que las instantáneas del rol CDP cubran URLs de enlaces, elementos clicables promovidos por cursor, refs de iframe y metadatos de frame.
- Regresión mínima de razonamiento `web_search` de OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) ejecuta un servidor OpenAI simulado a través de Gateway, verifica que `web_search` eleve `reasoning.effort` de `minimal` a `low`, luego fuerza el rechazo del esquema del proveedor y comprueba que el detalle sin procesar aparezca en los registros del Gateway.
- Puente de canal MCP (Gateway inicializado + puente stdio + smoke sin procesar de frame de notificación Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Herramientas MCP del paquete Pi (servidor MCP stdio real + smoke allow/deny del perfil Pi integrado): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Limpieza MCP de cron/subagente (Gateway real + desmontaje de proceso hijo MCP stdio tras ejecuciones aisladas de cron y subagente de una sola vez): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke de instalación, instalación/desinstalación de ClawHub, actualizaciones del marketplace y habilitar/inspeccionar paquetes Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Establece `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para omitir el bloque live de ClawHub, o anula el paquete predeterminado con `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` y `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`.
- Smoke sin cambios de actualización de Plugin: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke de metadatos de recarga de configuración: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Dependencias de tiempo de ejecución de Plugins incluidos: `pnpm test:docker:bundled-channel-deps` construye por defecto una pequeña imagen de ejecutor Docker, construye y empaqueta OpenClaw una sola vez en el host y luego monta ese tarball en cada escenario de instalación Linux. Reutiliza la imagen con `OPENCLAW_SKIP_DOCKER_BUILD=1`, omite la reconstrucción del host después de una compilación local reciente con `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, o apunta a un tarball existente con `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. El agregado Docker completo preempaqueta este tarball una vez y luego fragmenta las comprobaciones de canales incluidos en canales independientes, incluidos canales de actualización separados para Telegram, Discord, Slack, Feishu, memory-lancedb y ACPX. Usa `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` para acotar la matriz de canales al ejecutar directamente el canal incluido, o `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` para acotar el escenario de actualización. El canal también verifica que `channels.<id>.enabled=false` y `plugins.entries.<id>.enabled=false` supriman la reparación doctor/dependencias de tiempo de ejecución.
- Acota las dependencias de tiempo de ejecución de Plugins incluidos mientras iteras desactivando escenarios no relacionados, por ejemplo:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Para preconstruir y reutilizar manualmente la imagen compartida de app compilada:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Las anulaciones de imagen específicas de suite, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, siguen teniendo prioridad cuando están definidas. Cuando `OPENCLAW_SKIP_DOCKER_BUILD=1` apunta a una imagen remota compartida, los scripts la descargan si aún no está disponible localmente. Las pruebas Docker de QR e instalador conservan sus propios Dockerfiles porque validan el comportamiento de paquete/instalación en lugar del tiempo de ejecución compartido de la app compilada.

Los ejecutores Docker live de modelos también montan el checkout actual en modo solo lectura y lo
preparan en un directorio de trabajo temporal dentro del contenedor. Esto mantiene ligera la imagen
de tiempo de ejecución y aun así ejecuta Vitest contra tu código/configuración local exacta.
El paso de preparación omite cachés grandes solo locales y salidas de compilación de apps como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` y directorios locales de `.build` o
salida de Gradle, para que las ejecuciones Docker live no pasen minutos copiando
artefactos específicos de la máquina.
También establecen `OPENCLAW_SKIP_CHANNELS=1` para que las sondas live del gateway no inicien
workers reales de canales Telegram/Discord/etc. dentro del contenedor.
`test:docker:live-models` sigue ejecutando `pnpm test:live`, así que propaga también
`OPENCLAW_LIVE_GATEWAY_*` cuando necesites acotar o excluir la cobertura live del gateway de ese canal Docker.
`test:docker:openwebui` es un smoke de compatibilidad de nivel superior: inicia un
contenedor gateway de OpenClaw con los endpoints HTTP compatibles con OpenAI habilitados,
inicia un contenedor fijo de Open WebUI contra ese gateway, inicia sesión a través de
Open WebUI, verifica que `/api/models` exponga `openclaw/default`, y luego envía una
solicitud de chat real a través del proxy `/api/chat/completions` de Open WebUI.
La primera ejecución puede ser notablemente más lenta porque Docker puede necesitar descargar la
imagen de Open WebUI y Open WebUI puede necesitar completar su propia configuración de arranque en frío.
Este canal espera una clave live de modelo utilizable, y `OPENCLAW_PROFILE_FILE`
(`~/.profile` por defecto) es la forma principal de proporcionarla en ejecuciones Dockerizadas.
Las ejecuciones correctas imprimen una pequeña carga JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` es intencionalmente determinista y no necesita una
cuenta real de Telegram, Discord o iMessage. Inicia un contenedor Gateway inicializado,
arranca un segundo contenedor que ejecuta `openclaw mcp serve`, y luego
verifica descubrimiento de conversación enrutada, lecturas de transcripción, metadatos de adjuntos,
comportamiento de cola de eventos live, enrutamiento de envíos salientes y notificaciones estilo Claude de canal +
permisos sobre el puente stdio MCP real. La comprobación de notificaciones
inspecciona directamente los frames stdio MCP sin procesar, de modo que el smoke valida lo que el
puente realmente emite, no solo lo que un SDK cliente específico expone.
`test:docker:pi-bundle-mcp-tools` es determinista y no necesita una clave live
de modelo. Construye la imagen Docker del repositorio, inicia un servidor real de sonda MCP stdio
dentro del contenedor, materializa ese servidor mediante el tiempo de ejecución MCP del paquete Pi integrado,
ejecuta la herramienta y luego verifica que `coding` y `messaging` mantengan
herramientas `bundle-mcp` mientras `minimal` y `tools.deny: ["bundle-mcp"]` las filtran.
`test:docker:cron-mcp-cleanup` es determinista y no necesita una clave live de modelo.
Inicia un Gateway inicializado con un servidor real de sonda MCP stdio, ejecuta un
turno aislado de cron y un turno hijo de una sola vez `/subagents spawn`, y luego verifica
que el proceso hijo MCP se cierre después de cada ejecución.

Smoke manual ACP de hilo en lenguaje natural (no CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conserva este script para flujos de trabajo de regresión/depuración. Puede volver a ser necesario para validar el enrutamiento de hilos ACP, así que no lo elimines.

Variables de entorno útiles:

- `OPENCLAW_CONFIG_DIR=...` (predeterminado: `~/.openclaw`) montado en `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predeterminado: `~/.openclaw/workspace`) montado en `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predeterminado: `~/.profile`) montado en `/home/node/.profile` y cargado antes de ejecutar pruebas
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar solo variables de entorno cargadas desde `OPENCLAW_PROFILE_FILE`, usando directorios temporales de configuración/espacio de trabajo y sin montajes externos de autenticación CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predeterminado: `~/.cache/openclaw/docker-cli-tools`) montado en `/home/node/.npm-global` para instalaciones CLI en caché dentro de Docker
- Los directorios/archivos externos de autenticación CLI bajo `$HOME` se montan en solo lectura bajo `/host-auth...`, y luego se copian a `/home/node/...` antes de iniciar las pruebas
  - Directorios predeterminados: `.minimax`
  - Archivos predeterminados: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Las ejecuciones acotadas por proveedor montan solo los directorios/archivos necesarios inferidos a partir de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Anúlalo manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o una lista separada por comas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para acotar la ejecución
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar proveedores dentro del contenedor
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar una imagen existente `openclaw:local-live` en reejecuciones que no necesiten reconstrucción
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para asegurar que las credenciales provengan del almacén de perfiles (no del entorno)
- `OPENCLAW_OPENWEBUI_MODEL=...` para elegir el modelo expuesto por el gateway para el smoke de Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para anular el prompt de verificación nonce usado por el smoke de Open WebUI
- `OPENWEBUI_IMAGE=...` para anular la etiqueta fija de imagen de Open WebUI

## Verificación de docs

Ejecuta comprobaciones de docs después de editar documentación: `pnpm check:docs`.
Ejecuta la validación completa de anclas de Mintlify cuando también necesites comprobar encabezados dentro de la página: `pnpm docs:check-links:anchors`.

## Regresión offline (segura para CI)

Estas son regresiones de “canalización real” sin proveedores reales:

- Tool calling de Gateway (OpenAI simulado, gateway real + bucle de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Asistente de Gateway (WS `wizard.start`/`wizard.next`, escribe config + auth obligatoria): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evaluaciones de fiabilidad del agente (Skills)

Ya tenemos algunas pruebas seguras para CI que se comportan como “evaluaciones de fiabilidad del agente”:

- Tool calling simulado a través del gateway real + bucle de agente (`src/gateway/gateway.test.ts`).
- Flujos end-to-end del asistente que validan cableado de sesión y efectos de configuración (`src/gateway/gateway.test.ts`).

Lo que todavía falta para Skills (consulta [Skills](/es/tools/skills)):

- **Toma de decisiones:** cuando las Skills aparecen en el prompt, ¿el agente elige la skill correcta (o evita las irrelevantes)?
- **Cumplimiento:** ¿el agente lee `SKILL.md` antes de usarla y sigue los pasos/args requeridos?
- **Contratos de flujo de trabajo:** escenarios de varios turnos que verifiquen orden de herramientas, arrastre del historial de sesión y límites del sandbox.

Las futuras evaluaciones deben seguir siendo primero deterministas:

- Un ejecutor de escenarios usando proveedores simulados para verificar llamadas de herramientas + orden, lecturas de archivos de skill y cableado de sesión.
- Una pequeña suite de escenarios centrados en Skills (usar vs evitar, filtrado, prompt injection).
- Evaluaciones live opcionales (opt-in, protegidas por variables de entorno) solo después de que la suite segura para CI ya exista.

## Pruebas de contrato (forma de Plugin y canal)

Las pruebas de contrato verifican que cada Plugin y canal registrado cumpla con su
contrato de interfaz. Iteran sobre todos los Plugins detectados y ejecutan una suite de
verificaciones de forma y comportamiento. El canal unitario predeterminado `pnpm test`
omite intencionalmente estos archivos compartidos de interfaz y smoke; ejecuta los comandos
de contrato explícitamente cuando toques superficies compartidas de canal o proveedor.

### Comandos

- Todos los contratos: `pnpm test:contracts`
- Solo contratos de canales: `pnpm test:contracts:channels`
- Solo contratos de proveedores: `pnpm test:contracts:plugins`

### Contratos de canales

Ubicados en `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma básica del Plugin (id, nombre, capacidades)
- **setup** - Contrato del asistente de configuración
- **session-binding** - Comportamiento de vinculación de sesión
- **outbound-payload** - Estructura de la carga útil del mensaje
- **inbound** - Manejo de mensajes entrantes
- **actions** - Manejadores de acciones del canal
- **threading** - Manejo de id de hilo
- **directory** - API de directorio/listado
- **group-policy** - Aplicación de la política de grupo

### Contratos de estado de proveedores

Ubicados en `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondas de estado del canal
- **registry** - Forma del registro de Plugins

### Contratos de proveedores

Ubicados en `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato de flujo de autenticación
- **auth-choice** - Elección/selección de autenticación
- **catalog** - API de catálogo de modelos
- **discovery** - Descubrimiento de Plugins
- **loader** - Carga de Plugins
- **runtime** - Tiempo de ejecución del proveedor
- **shape** - Forma/interfaz del Plugin
- **wizard** - Asistente de configuración

### Cuándo ejecutarlas

- Después de cambiar exports o subrutas de plugin-sdk
- Después de agregar o modificar un Plugin de canal o proveedor
- Después de refactorizar el registro o descubrimiento de Plugins

Las pruebas de contrato se ejecutan en CI y no requieren claves API reales.

## Agregar regresiones (guía)

Cuando corrijas un problema de proveedor/modelo descubierto en live:

- Agrega una regresión segura para CI si es posible (simula/stub del proveedor, o captura la transformación exacta de la forma de la solicitud)
- Si es inherentemente solo live (límites de tasa, políticas de autenticación), mantén la prueba live acotada y opt-in mediante variables de entorno
- Prefiere apuntar a la capa más pequeña que capture el error:
  - error de conversión/repetición de solicitud del proveedor → prueba directa de modelos
  - error de sesión/historial/bucle de herramientas del gateway → smoke live del gateway o prueba simulada segura para CI del gateway
- Protección contra recorrido de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un objetivo de muestra por clase SecretRef a partir de metadatos del registro (`listSecretTargetRegistryEntries()`), y luego verifica que se rechacen ids exec con segmentos de recorrido.
  - Si agregas una nueva familia de objetivos SecretRef `includeInPlan` en `src/secrets/target-registry-data.ts`, actualiza `classifyTargetClass` en esa prueba. La prueba falla intencionalmente con ids objetivo no clasificados para que las nuevas clases no puedan omitirse silenciosamente.

## Relacionado

- [Pruebas live](/es/help/testing-live)
- [CI](/es/ci)
