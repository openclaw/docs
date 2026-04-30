---
read_when:
    - Ejecutar pruebas localmente o en CI
    - Agregar pruebas de regresión para errores de modelo/proveedor
    - Depuración del comportamiento de Gateway + agente
summary: 'Kit de pruebas: suites unitarias/e2e/en vivo, ejecutores de Docker y qué cubre cada prueba'
title: Pruebas
x-i18n:
    generated_at: "2026-04-30T05:46:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7b506350f11431195cb55c84cb10e99efb5f43b934079528b982627024d1ffc
    source_path: help/testing.md
    workflow: 16
---

OpenClaw tiene tres suites de Vitest (unitaria/integración, e2e, en vivo) y un pequeño conjunto
de ejecutores Docker. Este documento es una guía de "cómo probamos":

- Qué cubre cada suite (y qué _no_ cubre deliberadamente).
- Qué comandos ejecutar para flujos de trabajo comunes (local, antes de enviar cambios, depuración).
- Cómo las pruebas en vivo descubren credenciales y seleccionan modelos/proveedores.
- Cómo agregar regresiones para problemas reales de modelos/proveedores.

<Note>
**La pila de QA (qa-lab, qa-channel, carriles de transporte en vivo)** se documenta por separado:

- [Resumen de QA](/es/concepts/qa-e2e-automation) — arquitectura, superficie de comandos, autoría de escenarios.
- [QA de matriz](/es/concepts/qa-matrix) — referencia para `pnpm openclaw qa matrix`.
- [Canal de QA](/es/channels/qa-channel) — el Plugin de transporte sintético usado por escenarios respaldados por el repositorio.

Esta página cubre la ejecución de las suites de prueba regulares y los ejecutores Docker/Parallels. La sección de ejecutores específicos de QA a continuación ([ejecutores específicos de QA](#qa-specific-runners)) enumera las invocaciones `qa` concretas y remite a las referencias anteriores.
</Note>

## Inicio rápido

La mayoría de los días:

- Puerta completa (esperada antes de enviar cambios): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Ejecución más rápida de la suite completa local en una máquina con recursos: `pnpm test:max`
- Bucle directo de observación de Vitest: `pnpm test:watch`
- La selección directa de archivos ahora también enruta rutas de extensiones/canales: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefiere primero ejecuciones dirigidas cuando estás iterando sobre un único fallo.
- Sitio de QA respaldado por Docker: `pnpm qa:lab:up`
- Carril de QA respaldado por VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Cuando toques pruebas o quieras confianza adicional:

- Puerta de cobertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Cuando depures proveedores/modelos reales (requiere credenciales reales):

- Suite en vivo (modelos + sondas de herramienta/imagen del Gateway): `pnpm test:live`
- Seleccionar un archivo en vivo en silencio: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Barrido de modelos en vivo con Docker: `pnpm test:docker:live-models`
  - Cada modelo seleccionado ahora ejecuta un turno de texto más una pequeña sonda de estilo lectura de archivo.
    Los modelos cuyos metadatos anuncian entrada `image` también ejecutan un turno diminuto con imagen.
    Desactiva las sondas adicionales con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` al aislar fallos de proveedor.
  - Cobertura de CI: tanto `OpenClaw Scheduled Live And E2E Checks` diario como
    `OpenClaw Release Checks` manual llaman al flujo reutilizable de vivo/E2E con
    `include_live_suites: true`, que incluye trabajos separados de matriz de modelos
    en vivo con Docker, fragmentados por proveedor.
  - Para reejecuciones enfocadas de CI, despacha `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` y `live_models_only: true`.
  - Agrega nuevos secretos de proveedor de alta señal a `scripts/ci-hydrate-live-auth.sh`
    más `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` y sus
    llamadores programados/de lanzamiento.
- Prueba de humo de chat enlazado nativo de Codex: `pnpm test:docker:live-codex-bind`
  - Ejecuta un carril en vivo con Docker contra la ruta del servidor de aplicación de Codex, enlaza un DM
    sintético de Slack con `/codex bind`, ejercita `/codex fast` y
    `/codex permissions`, luego verifica que una respuesta simple y un adjunto de imagen
    se enruten por el enlace nativo del Plugin en lugar de ACP.
- Prueba de humo del arnés del servidor de aplicación de Codex: `pnpm test:docker:live-codex-harness`
  - Ejecuta turnos de agente del Gateway a través del arnés del servidor de aplicación de Codex propiedad del Plugin,
    verifica `/codex status` y `/codex models`, y por defecto ejercita sondas de imagen,
    MCP de cron, subagente y Guardian. Desactiva la sonda de subagente con
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` al aislar otros fallos del
    servidor de aplicación de Codex. Para una comprobación enfocada de subagente, desactiva las otras sondas:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Esto sale después de la sonda de subagente salvo que
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` esté definido.
- Prueba de humo del comando de rescate de Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Comprobación opcional de refuerzo para la superficie del comando de rescate del canal de mensajes.
    Ejercita `/crestodian status`, encola un cambio persistente de modelo,
    responde `/crestodian yes` y verifica la ruta de escritura de auditoría/configuración.
- Prueba de humo Docker del planificador de Crestodian: `pnpm test:docker:crestodian-planner`
  - Ejecuta Crestodian en un contenedor sin configuración con una Claude CLI falsa en `PATH`
    y verifica que la alternativa difusa del planificador se traduzca en una escritura
    tipada de configuración auditada.
- Prueba de humo Docker de primera ejecución de Crestodian: `pnpm test:docker:crestodian-first-run`
  - Parte de un directorio de estado de OpenClaw vacío, enruta `openclaw` sin argumentos a
    Crestodian, aplica escrituras de configuración/modelo/agente/Plugin de Discord + SecretRef,
    valida la configuración y verifica entradas de auditoría. La misma ruta de configuración de Ring 0
    también está cubierta en QA Lab por
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Prueba de humo de coste de Moonshot/Kimi: con `MOONSHOT_API_KEY` definido, ejecuta
  `openclaw models list --provider moonshot --json`, luego ejecuta un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  aislado contra `moonshot/kimi-k2.6`. Verifica que el JSON informe Moonshot/K2.6 y que la
  transcripción del asistente almacene `usage.cost` normalizado.

<Tip>
Cuando solo necesites un caso fallido, prefiere restringir las pruebas en vivo mediante las variables de entorno de lista de permitidos descritas abajo.
</Tip>

## Ejecutores específicos de QA

Estos comandos conviven con las suites de prueba principales cuando necesitas realismo de QA-lab:

CI ejecuta QA Lab en flujos dedicados. `Parity gate` se ejecuta en PRs coincidentes y
desde despacho manual con proveedores simulados. `QA-Lab - All Lanes` se ejecuta cada noche en
`main` y desde despacho manual con la puerta de paridad simulada, el carril Matrix en vivo,
el carril de Telegram en vivo gestionado por Convex y el carril de Discord en vivo gestionado por Convex como
trabajos paralelos. Las comprobaciones programadas de QA y de lanzamiento pasan Matrix `--profile fast`
explícitamente, mientras que la CLI de Matrix y la entrada predeterminada del flujo manual siguen siendo
`all`; el despacho manual puede fragmentar `all` en trabajos `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` y `e2ee-cli`. `OpenClaw Release Checks` ejecuta paridad más
los carriles rápidos de Matrix y Telegram antes de la aprobación del lanzamiento, usando
`mock-openai/gpt-5.5` para las comprobaciones de transporte de lanzamiento, de modo que permanezcan deterministas
y eviten el inicio normal del Plugin de proveedor. Estos gateways de transporte en vivo desactivan
la búsqueda de memoria; el comportamiento de memoria sigue cubierto por las suites de paridad de QA.

Los fragmentos completos de medios en vivo de lanzamiento usan
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, que ya tiene
`ffmpeg` y `ffprobe`. Los fragmentos de modelos/backends en vivo con Docker usan la imagen compartida
`ghcr.io/openclaw/openclaw-live-test:<sha>` construida una vez por commit seleccionado,
luego la descargan con `OPENCLAW_SKIP_DOCKER_BUILD=1` en lugar de reconstruirla
dentro de cada fragmento.

- `pnpm openclaw qa suite`
  - Ejecuta escenarios de QA respaldados por el repositorio directamente en el host.
  - Ejecuta múltiples escenarios seleccionados en paralelo por defecto con trabajadores
    de Gateway aislados. `qa-channel` usa concurrencia 4 por defecto (limitada por el
    recuento de escenarios seleccionados). Usa `--concurrency <count>` para ajustar el
    recuento de trabajadores, o `--concurrency 1` para el carril serial anterior.
  - Sale con código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
    quieras artefactos sin un código de salida fallido.
  - Admite modos de proveedor `live-frontier`, `mock-openai` y `aimock`.
    `aimock` inicia un servidor de proveedor local respaldado por AIMock para cobertura
    experimental de fixtures y simulación de protocolo sin reemplazar el carril
    `mock-openai` consciente de escenarios.
- `pnpm test:gateway:cpu-scenarios`
  - Ejecuta el banco de inicio del Gateway más un pequeño paquete de escenarios simulados de QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) y escribe un resumen combinado de observación de CPU
    bajo `.artifacts/gateway-cpu-scenarios/`.
  - Señala solo observaciones sostenidas de CPU caliente por defecto (`--cpu-core-warn`
    más `--hot-wall-warn-ms`), de modo que las ráfagas breves de inicio se registren como métricas
    sin parecerse a la regresión de Gateway fijado durante minutos.
  - Usa artefactos construidos de `dist`; ejecuta primero una compilación cuando el checkout no
    tenga ya salida de runtime reciente.
- `pnpm openclaw qa suite --runner multipass`
  - Ejecuta la misma suite de QA dentro de una VM Linux desechable de Multipass.
  - Mantiene el mismo comportamiento de selección de escenarios que `qa suite` en el host.
  - Reutiliza las mismas banderas de selección de proveedor/modelo que `qa suite`.
  - Las ejecuciones en vivo reenvían las entradas de autenticación de QA admitidas que son prácticas para el invitado:
    claves de proveedor basadas en env, la ruta de configuración de proveedor en vivo de QA y `CODEX_HOME`
    cuando está presente.
  - Los directorios de salida deben permanecer bajo la raíz del repositorio para que el invitado pueda escribir de vuelta a través
    del espacio de trabajo montado.
  - Escribe el informe + resumen normales de QA más registros de Multipass bajo
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia el sitio de QA respaldado por Docker para trabajo de QA de estilo operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Construye un tarball npm desde el checkout actual, lo instala globalmente en
    Docker, ejecuta onboarding no interactivo de clave de API de OpenAI, configura Telegram
    por defecto, verifica que habilitar el Plugin instale dependencias de runtime bajo
    demanda, ejecuta doctor y ejecuta un turno de agente local contra un endpoint de OpenAI
    simulado.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para ejecutar el mismo carril de instalación empaquetada
    con Discord.
- `pnpm test:docker:session-runtime-context`
  - Ejecuta una prueba de humo Docker determinista de la aplicación construida para transcripciones de contexto de runtime
    incrustado. Verifica que el contexto oculto de runtime de OpenClaw se persista como un
    mensaje personalizado no visible en lugar de filtrarse al turno visible del usuario,
    luego siembra una sesión JSONL rota afectada y verifica que
    `openclaw doctor --fix` la reescriba a la rama activa con una copia de seguridad.
- `pnpm test:docker:npm-telegram-live`
  - Instala un paquete candidato de OpenClaw en Docker, ejecuta onboarding de paquete instalado,
    configura Telegram a través de la CLI instalada, luego reutiliza el carril de QA de Telegram
    en vivo con ese paquete instalado como el Gateway SUT.
  - Por defecto usa `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; define
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` o
    `OPENCLAW_CURRENT_PACKAGE_TGZ` para probar un tarball local resuelto en lugar de
    instalar desde el registro.
  - Usa las mismas credenciales env de Telegram o fuente de credenciales Convex que
    `pnpm openclaw qa telegram`. Para automatización de CI/lanzamiento, define
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` más
    `OPENCLAW_QA_CONVEX_SITE_URL` y el secreto de rol. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` y un secreto de rol de Convex están presentes en CI,
    el wrapper Docker selecciona Convex automáticamente.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sobrescribe el
    `OPENCLAW_QA_CREDENTIAL_ROLE` compartido solo para este carril.
  - GitHub Actions expone este carril como el flujo manual de mantenedor
    `NPM Telegram Beta E2E`. No se ejecuta al fusionar. El flujo usa el entorno
    `qa-live-shared` y arrendamientos de credenciales CI de Convex.
- GitHub Actions también expone `Package Acceptance` para prueba de producto en ejecución lateral
  contra un paquete candidato. Acepta una ref de confianza, una especificación npm publicada,
  una URL HTTPS de tarball más SHA-256, o un artefacto tarball de otra ejecución, sube
  el `openclaw-current.tgz` normalizado como `package-under-test`, luego ejecuta el
  programador Docker E2E existente con perfiles de carril de humo, paquete, producto, completo o personalizado.
  Define `telegram_mode=mock-openai` o `live-frontier` para ejecutar el flujo de QA
  de Telegram contra el mismo artefacto `package-under-test`.
  - Prueba de producto de la beta más reciente:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- La prueba de URL exacta de tarball requiere un resumen:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- La prueba del artefacto descarga un artefacto tarball de otra ejecución de Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Empaqueta e instala la compilación actual de OpenClaw en Docker, inicia el Gateway
    con OpenAI configurado y luego habilita canales/plugins incluidos mediante ediciones
    de configuración.
  - Verifica que el descubrimiento de configuración deje ausentes las dependencias de runtime
    de plugins no configurados, que la primera ejecución configurada del Gateway o de doctor instale
    bajo demanda las dependencias de runtime de cada plugin incluido y que un segundo reinicio no
    reinstale dependencias que ya estaban activadas.
  - También instala una base de referencia npm anterior conocida, habilita Telegram antes de ejecutar
    `openclaw update --tag <candidate>` y verifica que el doctor posterior a la actualización del
    candidato repare las dependencias de runtime de canales incluidos sin una reparación postinstall
    del lado del arnés.
- `pnpm test:parallels:npm-update`
  - Ejecuta el smoke de actualización de instalación empaquetada nativa en invitados Parallels. Cada
    plataforma seleccionada instala primero el paquete base solicitado, luego ejecuta el comando
    `openclaw update` instalado en el mismo invitado y verifica la versión instalada, el estado de
    actualización, la preparación del gateway y un turno de agente local.
  - Usa `--platform macos`, `--platform windows` o `--platform linux` mientras
    iteras en un invitado. Usa `--json` para la ruta del artefacto de resumen y
    el estado por lane.
  - La lane de OpenAI usa `openai/gpt-5.5` para la prueba de turno de agente en vivo de
    forma predeterminada. Pasa `--model <provider/model>` o establece
    `OPENCLAW_PARALLELS_OPENAI_MODEL` cuando valides deliberadamente otro
    modelo de OpenAI.
  - Envuelve las ejecuciones locales largas en un timeout del host para que los bloqueos de transporte de Parallels no
    consuman el resto de la ventana de pruebas:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - El script escribe registros de lanes anidadas en `/tmp/openclaw-parallels-npm-update.*`.
    Inspecciona `windows-update.log`, `macos-update.log` o `linux-update.log`
    antes de asumir que el wrapper externo está colgado.
  - La actualización de Windows puede pasar de 10 a 15 minutos en la reparación de doctor/runtime
    y dependencias posterior a la actualización en un invitado frío; eso sigue siendo saludable cuando el registro
    de depuración npm anidado avanza.
  - No ejecutes este wrapper agregado en paralelo con lanes individuales de smoke de Parallels
    para macOS, Windows o Linux. Comparten estado de VM y pueden colisionar en
    la restauración de instantáneas, el servicio de paquetes o el estado del gateway invitado.
  - La prueba posterior a la actualización ejecuta la superficie normal de plugins incluidos porque
    fachadas de capacidades como voz, generación de imágenes y comprensión de medios
    se cargan mediante APIs de runtime incluidas, incluso cuando el turno del agente
    en sí solo verifica una respuesta de texto simple.

- `pnpm openclaw qa aimock`
  - Inicia solo el servidor local del proveedor AIMock para pruebas smoke directas
    del protocolo.
- `pnpm openclaw qa matrix`
  - Ejecuta la lane de QA en vivo de Matrix contra un homeserver Tuwunel desechable respaldado por Docker. Solo checkout de origen; las instalaciones empaquetadas no incluyen `qa-lab`.
  - CLI completa, catálogo de perfiles/escenarios, variables de entorno y diseño de artefactos: [QA de Matrix](/es/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Ejecuta la lane de QA en vivo de Telegram contra un grupo privado real usando los tokens de bot del controlador y del SUT desde el entorno.
  - Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. El id de grupo debe ser el id numérico de chat de Telegram.
  - Admite `--credential-source convex` para credenciales compartidas agrupadas. Usa el modo de entorno de forma predeterminada, o establece `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases agrupados.
  - Sale con código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
    quieras artefactos sin un código de salida fallido.
  - Requiere dos bots distintos en el mismo grupo privado, con el bot SUT exponiendo un nombre de usuario de Telegram.
  - Para una observación bot a bot estable, habilita el modo Bot-to-Bot Communication Mode en `@BotFather` para ambos bots y asegúrate de que el bot controlador pueda observar el tráfico de bots del grupo.
  - Escribe un informe de QA de Telegram, resumen y artefacto de mensajes observados en `.artifacts/qa-e2e/...`. Los escenarios de respuesta incluyen RTT desde la solicitud de envío del controlador hasta la respuesta SUT observada.

Las lanes de transporte en vivo comparten un contrato estándar para que los nuevos transportes no diverjan; la matriz de cobertura por lane está en [Vista general de QA → Cobertura de transportes en vivo](/es/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` es la suite sintética amplia y no forma parte de esa matriz.

### Credenciales compartidas de Telegram mediante Convex (v1)

Cuando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
`openclaw qa telegram`, el laboratorio de QA adquiere un lease exclusivo de un pool respaldado por Convex, envía heartbeats
para ese lease mientras se ejecuta la lane y libera el lease al apagar.

Scaffold del proyecto Convex de referencia:

- `qa/convex-credential-broker/`

Variables de entorno obligatorias:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por ejemplo `https://your-deployment.convex.site`)
- Un secreto para el rol seleccionado:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Selección del rol de credenciales:
  - CLI: `--credential-role maintainer|ci`
  - Valor predeterminado del entorno: `OPENCLAW_QA_CREDENTIAL_ROLE` (usa `ci` de forma predeterminada en CI, `maintainer` en caso contrario)

Variables de entorno opcionales:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predeterminado `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predeterminado `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predeterminado `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predeterminado `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predeterminado `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de rastreo opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URL Convex `http://` de loopback para desarrollo solo local.

`OPENCLAW_QA_CONVEX_SITE_URL` debe usar `https://` en la operación normal.

Los comandos de administración de maintainers (agregar/eliminar/listar pool) requieren
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` específicamente.

Ayudantes de CLI para maintainers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `doctor` antes de ejecuciones en vivo para comprobar la URL del sitio Convex, los secretos del broker,
el prefijo de endpoint, el timeout HTTP y la accesibilidad de admin/list sin imprimir
valores secretos. Usa `--json` para salida legible por máquina en scripts y utilidades
de CI.

Contrato de endpoint predeterminado (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Solicitud: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Correcto: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Agotado/reintetable: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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

Forma del payload para el tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` debe ser una cadena de id numérico de chat de Telegram.
- `admin/add` valida esta forma para `kind: "telegram"` y rechaza payloads mal formados.

### Agregar un canal a QA

Los nombres de arquitectura y de ayudantes de escenarios para nuevos adaptadores de canal están en [Vista general de QA → Agregar un canal](/es/concepts/qa-e2e-automation#adding-a-channel). El mínimo requerido: implementar el runner de transporte en la seam de host compartida `qa-lab`, declarar `qaRunners` en el manifiesto del plugin, montar como `openclaw qa <runner>` y crear escenarios en `qa/scenarios/`.

## Suites de pruebas (qué se ejecuta dónde)

Piensa en las suites como “realismo creciente” (y mayor inestabilidad/costo):

### Unitarias / integración (predeterminado)

- Comando: `pnpm test`
- Configuración: las ejecuciones sin objetivo usan el conjunto de shards `vitest.full-*.config.ts` y pueden expandir shards multiproyecto en configuraciones por proyecto para planificación paralela
- Archivos: inventarios core/unit en `src/**/*.test.ts`, `packages/**/*.test.ts` y `test/**/*.test.ts`; las pruebas unitarias de UI se ejecutan en el shard dedicado `unit-ui`
- Alcance:
  - Pruebas unitarias puras
  - Pruebas de integración en proceso (auth del gateway, enrutamiento, tooling, parsing, configuración)
  - Regresiones deterministas para errores conocidos
- Expectativas:
  - Se ejecuta en CI
  - No requiere claves reales
  - Debe ser rápida y estable
  - Las pruebas de resolver y cargador de superficie pública deben demostrar el comportamiento amplio de fallback de `api.js` y
    `runtime-api.js` con fixtures diminutas de plugins generados, no con
    APIs de origen de plugins incluidos reales. Las cargas reales de API de plugins pertenecen a
    suites de contrato/integración propiedad del plugin.

<AccordionGroup>
  <Accordion title="Proyectos, shards y lanes con alcance">

    - `pnpm test` no dirigido ejecuta doce configuraciones de fragmentos más pequeños (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) en lugar de un único proceso gigante nativo del proyecto raíz. Esto reduce el RSS máximo en máquinas cargadas y evita que el trabajo de auto-reply/extensiones deje sin recursos a suites no relacionadas.
    - `pnpm test --watch` sigue usando el grafo de proyectos nativo raíz `vitest.config.ts`, porque un bucle de observación con múltiples fragmentos no es práctico.
    - `pnpm test`, `pnpm test:watch` y `pnpm test:perf:imports` enrutan primero los objetivos explícitos de archivo/directorio por carriles con ámbito, de modo que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar el coste completo de arranque del proyecto raíz.
    - `pnpm test:changed` expande de forma predeterminada las rutas git modificadas en carriles con ámbito baratos: ediciones directas de pruebas, archivos hermanos `*.test.ts`, asignaciones explícitas de código fuente y dependientes del grafo de importaciones local. Las ediciones de config/setup/package no ejecutan pruebas de forma amplia salvo que uses explícitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` es la puerta normal de comprobación local inteligente para trabajo acotado. Clasifica el diff en core, pruebas de core, extensiones, pruebas de extensiones, apps, docs, metadatos de release, tooling de Docker en vivo y tooling; luego ejecuta los comandos correspondientes de typecheck, lint y guardia. No ejecuta pruebas Vitest; llama a `pnpm test:changed` o a `pnpm test <target>` explícito para aportar prueba de tests. Los incrementos de versión solo de metadatos de release ejecutan comprobaciones dirigidas de versión/config/dependencia raíz, con una guardia que rechaza cambios de paquete fuera del campo de versión de nivel superior.
    - Las ediciones del arnés Docker ACP en vivo ejecutan comprobaciones enfocadas: sintaxis shell para los scripts de autenticación de Docker en vivo y una simulación del planificador Docker en vivo. Los cambios de `package.json` se incluyen solo cuando el diff se limita a `scripts["test:docker:live-*"]`; las ediciones de dependencias, exportaciones, versiones y otras superficies de paquete siguen usando las guardias más amplias.
    - Las pruebas unitarias ligeras de importación de agentes, comandos, plugins, helpers de auto-reply, `plugin-sdk` y áreas similares de utilidades puras se enrutan por el carril `unit-fast`, que omite `test/setup-openclaw-runtime.ts`; los archivos con estado o pesados en runtime permanecen en los carriles existentes.
    - Algunos archivos fuente helper seleccionados de `plugin-sdk` y `commands` también asignan las ejecuciones en modo changed a pruebas hermanas explícitas en esos carriles ligeros, de modo que las ediciones de helpers evitan volver a ejecutar toda la suite pesada de ese directorio.
    - `auto-reply` tiene buckets dedicados para helpers de core de nivel superior, pruebas de integración `reply.*` de nivel superior y el subárbol `src/auto-reply/reply/**`. CI divide además el subárbol reply en fragmentos de agent-runner, dispatch y commands/state-routing para que un bucket pesado en importaciones no posea toda la cola de Node.
    - El CI normal de PR/main omite intencionalmente el barrido por lotes de extensiones y el fragmento `agentic-plugins` solo de release. Full Release Validation despacha el flujo hijo separado `Plugin Prerelease` para esas suites pesadas en plugins/extensiones en candidatos de release.

  </Accordion>

  <Accordion title="Cobertura del ejecutor embebido">

    - Cuando cambies entradas de descubrimiento de herramientas de mensaje o el
      contexto de ejecución de Compaction, conserva ambos niveles de cobertura.
    - Añade regresiones enfocadas de helpers para límites puros de enrutamiento
      y normalización.
    - Mantén saludables las suites de integración del ejecutor embebido:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` y
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Esas suites verifican que los ids con ámbito y el comportamiento de Compaction sigan fluyendo
      por las rutas reales `run.ts` / `compact.ts`; las pruebas solo de helpers
      no son un sustituto suficiente para esas rutas de integración.

  </Accordion>

  <Accordion title="Valores predeterminados de pool e aislamiento de Vitest">

    - La configuración base de Vitest usa `threads` de forma predeterminada.
    - La configuración compartida de Vitest fija `isolate: false` y usa el
      runner no aislado en los proyectos raíz, e2e y configuraciones live.
    - El carril UI raíz conserva su setup y optimizador `jsdom`, pero también
      se ejecuta en el runner compartido no aislado.
    - Cada fragmento de `pnpm test` hereda los mismos valores predeterminados
      `threads` + `isolate: false` de la configuración compartida de Vitest.
    - `scripts/run-vitest.mjs` añade `--no-maglev` de forma predeterminada para los procesos
      Node hijos de Vitest a fin de reducir la rotación de compilación de V8 durante ejecuciones locales grandes.
      Define `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar con el comportamiento V8 estándar.

  </Accordion>

  <Accordion title="Iteración local rápida">

    - `pnpm changed:lanes` muestra qué carriles arquitectónicos activa un diff.
    - El hook pre-commit solo formatea. Vuelve a preparar los archivos formateados y
      no ejecuta lint, typecheck ni pruebas.
    - Ejecuta `pnpm check:changed` explícitamente antes del traspaso o push cuando
      necesites la puerta de comprobación local inteligente.
    - `pnpm test:changed` se enruta de forma predeterminada por carriles con ámbito baratos. Usa
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el agente
      decida que una edición de arnés, config, paquete o contrato realmente necesita cobertura
      Vitest más amplia.
    - `pnpm test:max` y `pnpm test:changed:max` conservan el mismo comportamiento
      de enrutamiento, solo con un límite de workers más alto.
    - El autoescalado de workers locales es intencionalmente conservador y retrocede
      cuando la media de carga del host ya es alta, de modo que varias ejecuciones
      concurrentes de Vitest hagan menos daño de forma predeterminada.
    - La configuración base de Vitest marca los proyectos/archivos de configuración como
      `forceRerunTriggers` para que las reejecuciones en modo changed sigan siendo correctas cuando cambia
      el cableado de pruebas.
    - La configuración mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado en hosts
      compatibles; define `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si quieres
      una ubicación de caché explícita para perfilado directo.

  </Accordion>

  <Accordion title="Depuración de rendimiento">

    - `pnpm test:perf:imports` habilita el informe de duración de importaciones de Vitest más
      salida de desglose de importaciones.
    - `pnpm test:perf:imports:changed` limita la misma vista de perfilado a
      archivos cambiados desde `origin/main`.
    - Los datos de tiempos de fragmentos se escriben en `.artifacts/vitest-shard-timings.json`.
      Las ejecuciones de configuración completa usan la ruta de configuración como clave; los fragmentos de CI
      con patrón de inclusión añaden el nombre del fragmento para que los fragmentos filtrados puedan rastrearse
      por separado.
    - Cuando una prueba caliente todavía pasa la mayor parte de su tiempo en importaciones de arranque,
      mantén las dependencias pesadas detrás de una costura local estrecha `*.runtime.ts` y
      simula esa costura directamente en lugar de importar en profundidad helpers de runtime solo
      para pasarlos por `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara el
      `test:changed` enrutado contra la ruta nativa del proyecto raíz para ese diff
      confirmado e imprime el tiempo real más el RSS máximo en macOS.
    - `pnpm test:perf:changed:bench -- --worktree` mide el árbol sucio actual
      enrutando la lista de archivos cambiados por
      `scripts/test-projects.mjs` y la configuración raíz de Vitest.
    - `pnpm test:perf:profile:main` escribe un perfil de CPU del hilo principal para
      el arranque de Vitest/Vite y la sobrecarga de transformaciones.
    - `pnpm test:perf:profile:runner` escribe perfiles de CPU+heap del runner para la
      suite unitaria con paralelismo de archivos deshabilitado.

  </Accordion>
</AccordionGroup>

### Estabilidad (Gateway)

- Comando: `pnpm test:stability:gateway`
- Configuración: `vitest.gateway.config.ts`, forzada a un worker
- Alcance:
  - Inicia un Gateway real de loopback con diagnósticos habilitados de forma predeterminada
  - Conduce churn sintético de mensajes, memoria y cargas grandes de gateway por la ruta de eventos diagnósticos
  - Consulta `diagnostics.stability` sobre el RPC WS del Gateway
  - Cubre helpers de persistencia del paquete de estabilidad diagnóstica
  - Afirma que el registrador permanece acotado, que las muestras sintéticas de RSS se mantienen bajo el presupuesto de presión y que las profundidades de cola por sesión vuelven a cero
- Expectativas:
  - Seguro para CI y sin claves
  - Carril estrecho para seguimiento de regresiones de estabilidad, no sustituto de la suite completa de Gateway

### E2E (smoke de Gateway)

- Comando: `pnpm test:e2e`
- Configuración: `vitest.e2e.config.ts`
- Archivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` y pruebas E2E de plugins incluidos bajo `extensions/`
- Valores predeterminados de runtime:
  - Usa `threads` de Vitest con `isolate: false`, igual que el resto del repo.
  - Usa workers adaptativos (CI: hasta 2, local: 1 de forma predeterminada).
  - Se ejecuta en modo silencioso de forma predeterminada para reducir la sobrecarga de E/S de consola.
- Overrides útiles:
  - `OPENCLAW_E2E_WORKERS=<n>` para forzar la cantidad de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para volver a habilitar la salida verbosa de consola.
- Alcance:
  - Comportamiento end-to-end de gateway con múltiples instancias
  - Superficies WebSocket/HTTP, emparejamiento de nodos y networking más pesado
- Expectativas:
  - Se ejecuta en CI (cuando está habilitado en el pipeline)
  - No requiere claves reales
  - Más piezas móviles que las pruebas unitarias (puede ser más lento)

### E2E: smoke del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Archivo: `extensions/openshell/src/backend.e2e.test.ts`
- Alcance:
  - Inicia un gateway OpenShell aislado en el host mediante Docker
  - Crea un sandbox desde un Dockerfile local temporal
  - Ejercita el backend OpenShell de OpenClaw sobre `sandbox ssh-config` + exec SSH reales
  - Verifica el comportamiento remoto-canónico del sistema de archivos por el puente fs del sandbox
- Expectativas:
  - Solo opt-in; no forma parte de la ejecución predeterminada `pnpm test:e2e`
  - Requiere una CLI local `openshell` y un daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` aislados, luego destruye el gateway de prueba y el sandbox
- Overrides útiles:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar la prueba al ejecutar manualmente la suite e2e más amplia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apuntar a un binario CLI o script wrapper no predeterminado

### Live (proveedores reales + modelos reales)

- Comando: `pnpm test:live`
- Configuración: `vitest.live.config.ts`
- Archivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` y pruebas live de plugins incluidos bajo `extensions/`
- Predeterminado: **habilitado** por `pnpm test:live` (define `OPENCLAW_LIVE_TEST=1`)
- Alcance:
  - “¿Este proveedor/modelo funciona realmente _hoy_ con credenciales reales?”
  - Detectar cambios de formato del proveedor, particularidades de tool-calling, problemas de autenticación y comportamiento de límites de tasa
- Expectativas:
  - No es estable para CI por diseño (redes reales, políticas reales de proveedores, cuotas, interrupciones)
  - Cuesta dinero / usa límites de tasa
  - Prefiere ejecutar subconjuntos acotados en lugar de “todo”
- Las ejecuciones live cargan `~/.profile` para recoger claves API faltantes.
- De forma predeterminada, las ejecuciones live siguen aislando `HOME` y copian material de config/auth en un home de prueba temporal para que los fixtures unitarios no puedan mutar tu `~/.openclaw` real.
- Define `OPENCLAW_LIVE_USE_REAL_HOME=1` solo cuando necesites intencionalmente que las pruebas live usen tu directorio home real.
- `pnpm test:live` ahora usa de forma predeterminada un modo más silencioso: conserva la salida de progreso `[live] ...`, pero suprime el aviso extra de `~/.profile` y silencia los logs de arranque del gateway/ruido Bonjour. Define `OPENCLAW_LIVE_TEST_QUIET=0` si quieres recuperar los logs completos de arranque.
- Rotación de claves API (específica por proveedor): define `*_API_KEYS` con formato de comas/puntos y coma o `*_API_KEY_1`, `*_API_KEY_2` (por ejemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) o override por live mediante `OPENCLAW_LIVE_*_KEY`; las pruebas reintentan ante respuestas de límite de tasa.
- Salida de progreso/Heartbeat:
  - Las suites live ahora emiten líneas de progreso a stderr para que las llamadas largas a proveedores sean visiblemente activas incluso cuando la captura de consola de Vitest está silenciosa.
  - `vitest.live.config.ts` deshabilita la intercepción de consola de Vitest para que las líneas de progreso de proveedor/gateway se transmitan inmediatamente durante las ejecuciones live.
  - Ajusta los Heartbeats de direct-model con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajusta los Heartbeats de gateway/probe con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## ¿Qué suite debería ejecutar?

Usa esta tabla de decisión:

- Lógica/pruebas de edición: ejecuta `pnpm test` (y `pnpm test:coverage` si cambiaste mucho)
- Si tocas redes del Gateway / protocolo WS / emparejamiento: agrega `pnpm test:e2e`
- Para depurar “mi bot está caído” / fallos específicos del proveedor / llamadas a herramientas: ejecuta un `pnpm test:live` acotado

## Pruebas en vivo (con acceso a la red)

Para la matriz de modelos en vivo, pruebas rápidas del backend de CLI, pruebas rápidas de ACP, arnés de servidor de aplicaciones de Codex y todas las pruebas en vivo de proveedores de medios (Deepgram, BytePlus, ComfyUI, imagen, música, video, arnés de medios), además del manejo de credenciales para ejecuciones en vivo, consulta [Pruebas: suites en vivo](/es/help/testing-live).

## Ejecutores Docker (comprobaciones opcionales de "funciona en Linux")

Estos ejecutores Docker se dividen en dos grupos:

- Ejecutores de modelos en vivo: `test:docker:live-models` y `test:docker:live-gateway` ejecutan solo su archivo en vivo correspondiente de clave de perfil dentro de la imagen Docker del repositorio (`src/agents/models.profiles.live.test.ts` y `src/gateway/gateway-models.profiles.live.test.ts`), montando tu directorio de configuración local y el espacio de trabajo (y cargando `~/.profile` si está montado). Los puntos de entrada locales correspondientes son `test:live:models-profiles` y `test:live:gateway-profiles`.
- Los ejecutores Docker en vivo usan por defecto un límite de prueba rápida más pequeño para que una revisión completa de Docker siga siendo práctica:
  `test:docker:live-models` usa por defecto `OPENCLAW_LIVE_MAX_MODELS=12`, y
  `test:docker:live-gateway` usa por defecto `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` y
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sobrescribe esas variables de entorno cuando
  quieras explícitamente el escaneo exhaustivo más amplio.
- `test:docker:all` construye la imagen Docker en vivo una vez mediante `test:docker:live-build`, empaqueta OpenClaw una vez como tarball npm mediante `scripts/package-openclaw-for-docker.mjs` y luego construye/reutiliza dos imágenes `scripts/e2e/Dockerfile`. La imagen básica es solo el ejecutor Node/Git para carriles de instalación/actualización/dependencias de Plugin; esos carriles montan el tarball preconstruido. La imagen funcional instala el mismo tarball en `/app` para carriles de funcionalidad de la aplicación construida. Las definiciones de carriles Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`; la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ejecuta el plan seleccionado. El agregado usa un planificador local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla los espacios de proceso, mientras que los límites de recursos evitan que los carriles pesados en vivo, de instalación npm y multiservicio se inicien todos a la vez. Si un solo carril es más pesado que los límites activos, el planificador aun así puede iniciarlo cuando el grupo está vacío y luego mantenerlo ejecutándose solo hasta que vuelva a haber capacidad disponible. Los valores predeterminados son 10 espacios, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` y `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajusta `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` solo cuando el host Docker tenga más margen. El ejecutor realiza una comprobación previa de Docker por defecto, elimina contenedores E2E obsoletos de OpenClaw, imprime el estado cada 30 segundos, guarda los tiempos de carriles correctos en `.artifacts/docker-tests/lane-timings.json` y usa esos tiempos para iniciar primero los carriles más largos en ejecuciones posteriores. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir el manifiesto de carriles ponderado sin construir ni ejecutar Docker, o `node scripts/test-docker-all.mjs --plan-json` para imprimir el plan de CI de los carriles seleccionados, las necesidades de paquete/imagen y las credenciales.
- `Package Acceptance` es la puerta de paquetes nativa de GitHub para "¿este tarball instalable funciona como producto?". Resuelve un paquete candidato desde `source=npm`, `source=ref`, `source=url` o `source=artifact`, lo sube como `package-under-test` y luego ejecuta los carriles Docker E2E reutilizables contra ese tarball exacto en lugar de volver a empaquetar la referencia seleccionada. `workflow_ref` selecciona los scripts de flujo de trabajo/arnés de confianza, mientras que `package_ref` selecciona el commit/rama/etiqueta de origen que se empaqueta cuando `source=ref`; esto permite que la lógica de aceptación actual valide commits de confianza más antiguos. Los perfiles se ordenan por amplitud: `smoke` es instalación/canal/agente rápido más Gateway/configuración, `package` es el contrato de paquete/actualización/Plugin y el reemplazo nativo predeterminado para la mayor parte de la cobertura de paquete/actualización de Parallels, `product` agrega canales MCP, limpieza de cron/subagente, búsqueda web de OpenAI y OpenWebUI, y `full` ejecuta los fragmentos Docker de la ruta de publicación con OpenWebUI. La validación de publicaciones ejecuta un delta de paquete personalizado (`bundled-channel-deps-compat plugins-offline`) más QA de paquete de Telegram porque los fragmentos Docker de la ruta de publicación ya cubren los carriles superpuestos de paquete/actualización/Plugin. Los comandos de reejecución Docker de GitHub dirigidos generados a partir de artefactos incluyen el artefacto de paquete anterior y entradas de imagen preparadas cuando están disponibles, para que los carriles fallidos puedan evitar reconstruir el paquete y las imágenes.
- Las comprobaciones de compilación y publicación ejecutan `scripts/check-cli-bootstrap-imports.mjs` después de tsdown. La guarda recorre el grafo construido estático desde `dist/entry.js` y `dist/cli/run-main.js` y falla si el arranque previo al despacho importa dependencias de paquete como Commander, interfaz de prompts, undici o logging antes del despacho de comandos; también mantiene el fragmento incluido de ejecución del Gateway dentro del presupuesto y rechaza importaciones estáticas de rutas conocidas de Gateway en frío. La prueba rápida de CLI empaquetado también cubre la ayuda raíz, ayuda de incorporación, ayuda de doctor, estado, esquema de configuración y un comando de lista de modelos.
- La compatibilidad heredada de Package Acceptance está limitada a `2026.4.25` (`2026.4.25-beta.*` incluido). Hasta ese corte, el arnés tolera solo brechas de metadatos de paquetes publicados: entradas omitidas de inventario privado de QA, falta de `gateway install --wrapper`, archivos de parche faltantes en el fixture git derivado del tarball, falta de `update.channel` persistido, ubicaciones heredadas de registros de instalación de Plugin, falta de persistencia de registros de instalación del marketplace y migración de metadatos de configuración durante `plugins update`. Para paquetes posteriores a `2026.4.25`, esas rutas son fallos estrictos.
- Ejecutores de pruebas rápidas de contenedor: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` y `test:docker:config-reload` arrancan uno o más contenedores reales y verifican rutas de integración de nivel superior.

Los ejecutores Docker de modelos en vivo también montan como bind solo los hogares de autenticación de CLI necesarios (o todos los admitidos cuando la ejecución no está acotada), y luego los copian al hogar del contenedor antes de la ejecución para que OAuth de CLI externa pueda refrescar tokens sin mutar el almacén de autenticación del host:

- Modelos directos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de enlace ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; cubre Claude, Codex y Gemini de forma predeterminada, con cobertura estricta de Droid/OpenCode mediante `pnpm test:docker:live-acp-bind:droid` y `pnpm test:docker:live-acp-bind:opencode`)
- Smoke de backend de CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke del arnés del servidor de la aplicación Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desarrollo: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke de observabilidad: `pnpm qa:otel:smoke` es una vía privada de QA con checkout de código fuente. Intencionalmente no forma parte de las vías de publicación Docker de paquetes porque el tarball npm omite QA Lab.
- Smoke en vivo de Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Asistente de incorporación (TTY, andamiaje completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke de incorporación/canal/agente con tarball npm: `pnpm test:docker:npm-onboard-channel-agent` instala globalmente en Docker el tarball empaquetado de OpenClaw, configura OpenAI mediante incorporación con referencia de entorno y Telegram de forma predeterminada, verifica que doctor repare las dependencias de tiempo de ejecución del Plugin activado y ejecuta un turno de agente OpenAI simulado. Reutiliza un tarball precompilado con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la reconstrucción del host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, o cambia de canal con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke de cambio de canal de actualización: `pnpm test:docker:update-channel-switch` instala globalmente en Docker el tarball empaquetado de OpenClaw, cambia del paquete `stable` a git `dev`, verifica que el canal persistido y el Plugin funcionen después de la actualización, luego vuelve al paquete `stable` y comprueba el estado de actualización.
- Smoke de contexto de tiempo de ejecución de sesión: `pnpm test:docker:session-runtime-context` verifica la persistencia oculta de la transcripción de contexto de tiempo de ejecución y la reparación por doctor de ramas duplicadas afectadas de reescritura de prompts.
- Smoke de instalación global con Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empaqueta el árbol actual, lo instala con `bun install -g` en un home aislado y verifica que `openclaw infer image providers --json` devuelva proveedores de imágenes incluidos en lugar de quedarse colgado. Reutiliza un tarball precompilado con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la compilación del host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, o copia `dist/` desde una imagen Docker compilada con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker del instalador: `bash scripts/test-install-sh-docker.sh` comparte una caché npm entre sus contenedores root, update y direct-npm. El smoke de actualización usa de forma predeterminada npm `latest` como línea base estable antes de actualizar al tarball candidato. Sobrescríbelo con `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localmente, o con la entrada `update_baseline_version` del flujo de trabajo Install Smoke en GitHub. Las comprobaciones del instalador sin root mantienen una caché npm aislada para que las entradas de caché propiedad de root no oculten el comportamiento de instalación local de usuario. Define `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar la caché root/update/direct-npm en nuevas ejecuciones locales.
- Install Smoke CI omite la actualización global direct-npm duplicada con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; ejecuta el script localmente sin ese entorno cuando se necesite cobertura directa de `npm install -g`.
- Smoke de CLI de eliminación de workspace compartido de agentes: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila la imagen raíz de Dockerfile de forma predeterminada, prepara dos agentes con un workspace en un home de contenedor aislado, ejecuta `agents delete --json` y verifica JSON válido y el comportamiento de conservación del workspace. Reutiliza la imagen install-smoke con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Redes del Gateway (dos contenedores, autenticación WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoke de instantánea CDP de navegador: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila la imagen E2E desde código fuente más una capa de Chromium, inicia Chromium con CDP sin procesar, ejecuta `browser doctor --deep` y verifica que las instantáneas de roles CDP cubran URL de enlaces, elementos clicables promovidos por cursor, referencias de iframe y metadatos de frame.
- Regresión de razonamiento mínimo de OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) ejecuta un servidor OpenAI simulado a través del Gateway, verifica que `web_search` eleve `reasoning.effort` de `minimal` a `low`, luego fuerza el rechazo del esquema del proveedor y comprueba que el detalle sin procesar aparezca en los registros del Gateway.
- Puente de canales MCP (Gateway preparado + puente stdio + smoke de frames de notificación sin procesar de Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Herramientas MCP del paquete Pi (servidor MCP stdio real + smoke de permitir/denegar con perfil Pi integrado): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Limpieza MCP de Cron/subagente (Gateway real + desmontaje de hijo MCP stdio después de ejecuciones aisladas de cron y subagente de una sola vez): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke de instalación, instalación/desinstalación kitchen-sink de ClawHub, actualizaciones de marketplace y habilitación/inspección del paquete de Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Define `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para omitir el bloque ClawHub, o sobrescribe el par predeterminado paquete/tiempo de ejecución kitchen-sink con `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` y `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sin `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, la prueba usa un servidor local hermético de fixture ClawHub.
- Smoke de actualización de Plugin sin cambios: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke de metadatos de recarga de configuración: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Dependencias de tiempo de ejecución de Plugin incluido: `pnpm test:docker:bundled-channel-deps` compila de forma predeterminada una imagen pequeña de ejecutor Docker, compila y empaqueta OpenClaw una vez en el host, y luego monta ese tarball en cada escenario de instalación Linux. Reutiliza la imagen con `OPENCLAW_SKIP_DOCKER_BUILD=1`, omite la reconstrucción del host después de una compilación local reciente con `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, o apunta a un tarball existente con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. El agregado Docker completo y los fragmentos de bundled-channel de la ruta de publicación preempaquetan este tarball una vez, luego dividen las comprobaciones de canales incluidos en vías independientes, incluidas vías de actualización separadas para Telegram, Discord, Slack, Feishu, memory-lancedb y ACPX. Los fragmentos de publicación dividen smokes de canales, destinos de actualización y contratos de configuración/tiempo de ejecución en `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` y `bundled-channels-contracts`; el fragmento agregado `bundled-channels` sigue disponible para nuevas ejecuciones manuales. El flujo de trabajo de publicación también divide fragmentos del instalador de proveedores y fragmentos de instalación/desinstalación de Plugins incluidos; los fragmentos heredados `package-update`, `plugins-runtime` y `plugins-integrations` siguen siendo alias agregados para nuevas ejecuciones manuales. Usa `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` para acotar la matriz de canales al ejecutar directamente la vía incluida, o `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` para acotar el escenario de actualización. Las ejecuciones Docker por escenario usan de forma predeterminada `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; el escenario de actualización con varios destinos usa de forma predeterminada `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. La vía también verifica que `channels.<id>.enabled=false` y `plugins.entries.<id>.enabled=false` supriman la reparación de dependencias de tiempo de ejecución por doctor.
- Acota las dependencias de tiempo de ejecución de Plugin incluido mientras iteras desactivando escenarios no relacionados, por ejemplo:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Para precompilar y reutilizar manualmente la imagen funcional compartida:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Las sobrescrituras de imagen específicas de la suite, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, siguen teniendo prioridad cuando están definidas. Cuando `OPENCLAW_SKIP_DOCKER_BUILD=1` apunta a una imagen compartida remota, los scripts la descargan si todavía no existe localmente. Las pruebas Docker de QR e instalador conservan sus propios Dockerfiles porque validan el comportamiento de paquete/instalación en lugar del tiempo de ejecución compartido de la aplicación compilada.

Los ejecutores Docker de modelos en vivo también montan con bind el checkout actual en modo solo lectura y
lo preparan en un directorio de trabajo temporal dentro del contenedor. Esto mantiene ligera la imagen de tiempo de ejecución
mientras sigue ejecutando Vitest contra tu código fuente/configuración local exacta.
El paso de preparación omite cachés grandes solo locales y salidas de compilación de aplicaciones, como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` y directorios de salida `.build` locales de aplicaciones o de
Gradle, para que las ejecuciones Docker en vivo no pasen minutos copiando
artefactos específicos de la máquina.
También definen `OPENCLAW_SKIP_CHANNELS=1` para que las sondas en vivo del Gateway no inicien
workers de canales reales de Telegram/Discord/etc. dentro del contenedor.
`test:docker:live-models` sigue ejecutando `pnpm test:live`, así que transmite también
`OPENCLAW_LIVE_GATEWAY_*` cuando necesites acotar o excluir la cobertura en vivo del Gateway
de esa vía Docker.
`test:docker:openwebui` es un smoke de compatibilidad de nivel superior: inicia un
contenedor de gateway OpenClaw con los endpoints HTTP compatibles con OpenAI habilitados,
inicia un contenedor Open WebUI fijado contra ese Gateway, inicia sesión a través de
Open WebUI, verifica que `/api/models` exponga `openclaw/default` y luego envía una
solicitud de chat real a través del proxy `/api/chat/completions` de Open WebUI.
La primera ejecución puede ser notablemente más lenta porque Docker puede necesitar descargar la
imagen de Open WebUI y Open WebUI puede necesitar terminar su propia configuración de arranque en frío.
Esta vía espera una clave de modelo en vivo utilizable, y `OPENCLAW_PROFILE_FILE`
(`~/.profile` de forma predeterminada) es la forma principal de proporcionarla en ejecuciones Dockerizadas.
Las ejecuciones correctas imprimen una pequeña carga JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` es intencionalmente determinista y no necesita una
cuenta real de Telegram, Discord ni iMessage. Arranca un contenedor Gateway preparado,
inicia un segundo contenedor que genera `openclaw mcp serve`, luego
verifica el descubrimiento de conversaciones enrutadas, lecturas de transcripción, metadatos de adjuntos,
comportamiento de cola de eventos en vivo, enrutamiento de envíos salientes y notificaciones de canal +
permisos estilo Claude sobre el puente MCP stdio real. La comprobación de notificaciones
inspecciona directamente los frames MCP stdio sin procesar, de modo que el smoke valida lo que el
puente realmente emite, no solo lo que un SDK de cliente específico expone por casualidad.
`test:docker:pi-bundle-mcp-tools` es determinista y no necesita una clave de modelo en vivo.
Compila la imagen Docker del repo, inicia un servidor de sondeo MCP stdio real
dentro del contenedor, materializa ese servidor mediante el tiempo de ejecución MCP del paquete Pi
integrado, ejecuta la herramienta y luego verifica que `coding` y `messaging` conserven
las herramientas `bundle-mcp` mientras `minimal` y `tools.deny: ["bundle-mcp"]` las filtran.
`test:docker:cron-mcp-cleanup` es determinista y no necesita una clave de modelo en vivo.
Inicia un Gateway preparado con un servidor de sondeo MCP stdio real, ejecuta un
turno de cron aislado y un turno hijo de una sola vez con `/subagents spawn`, luego verifica
que el proceso hijo MCP termine después de cada ejecución.

Smoke manual de hilo ACP en lenguaje natural (no CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conserva este script para flujos de trabajo de regresión/depuración. Puede volver a ser necesario para la validación del enrutamiento de hilos ACP, así que no lo elimines.

Variables de entorno útiles:

- `OPENCLAW_CONFIG_DIR=...` (predeterminado: `~/.openclaw`) montado en `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predeterminado: `~/.openclaw/workspace`) montado en `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predeterminado: `~/.profile`) montado en `/home/node/.profile` y cargado antes de ejecutar las pruebas
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar solo las variables de entorno cargadas desde `OPENCLAW_PROFILE_FILE`, usando directorios temporales de configuración/espacio de trabajo y sin montajes externos de autenticación de CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predeterminado: `~/.cache/openclaw/docker-cli-tools`) montado en `/home/node/.npm-global` para instalaciones de CLI en caché dentro de Docker
- Los directorios/archivos de autenticación de CLI externos bajo `$HOME` se montan en modo de solo lectura bajo `/host-auth...`, y luego se copian en `/home/node/...` antes de que empiecen las pruebas
  - Directorios predeterminados: `.minimax`
  - Archivos predeterminados: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Las ejecuciones restringidas por proveedor montan solo los directorios/archivos necesarios inferidos desde `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sobrescribe manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o una lista separada por comas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para restringir la ejecución
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar proveedores dentro del contenedor
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar una imagen `openclaw:local-live` existente en repeticiones que no necesitan recompilación
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para asegurar que las credenciales provengan del almacén de perfiles (no del entorno)
- `OPENCLAW_OPENWEBUI_MODEL=...` para elegir el modelo expuesto por el gateway para la prueba de humo de Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para sobrescribir el prompt de verificación de nonce usado por la prueba de humo de Open WebUI
- `OPENWEBUI_IMAGE=...` para sobrescribir la etiqueta fijada de la imagen Open WebUI

## Comprobación de sanidad de docs

Ejecuta las comprobaciones de docs después de editar documentación: `pnpm check:docs`.
Ejecuta la validación completa de anchors de Mintlify cuando también necesites comprobaciones de encabezados dentro de página: `pnpm docs:check-links:anchors`.

## Regresión offline (segura para CI)

Estas son regresiones de “pipeline real” sin proveedores reales:

- Invocación de herramientas del Gateway (OpenAI simulado, gateway real + bucle de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Asistente del Gateway (WS `wizard.start`/`wizard.next`, escribe configuración + autenticación aplicada): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evals de confiabilidad de agentes (Skills)

Ya tenemos algunas pruebas seguras para CI que se comportan como “evals de confiabilidad de agentes”:

- Invocación de herramientas simulada a través del gateway real + bucle de agente (`src/gateway/gateway.test.ts`).
- Flujos de asistente end-to-end que validan el cableado de sesión y los efectos de configuración (`src/gateway/gateway.test.ts`).

Lo que aún falta para Skills (consulta [Skills](/es/tools/skills)):

- **Toma de decisiones:** cuando las Skills aparecen en el prompt, ¿el agente elige la Skill correcta (o evita las irrelevantes)?
- **Cumplimiento:** ¿el agente lee `SKILL.md` antes de usarla y sigue los pasos/args requeridos?
- **Contratos de flujo de trabajo:** escenarios multironda que afirman el orden de herramientas, el traspaso del historial de sesión y los límites del sandbox.

Las evals futuras deben priorizar el determinismo:

- Un ejecutor de escenarios que use proveedores simulados para afirmar llamadas a herramientas + orden, lecturas de archivos de Skills y cableado de sesión.
- Un pequeño conjunto de escenarios centrados en Skills (usar frente a evitar, compuertas, inyección de prompt).
- Evals en vivo opcionales (opt-in, controladas por env) solo después de que el conjunto seguro para CI esté listo.

## Pruebas de contrato (forma de plugin y canal)

Las pruebas de contrato verifican que cada plugin y canal registrado cumpla su
contrato de interfaz. Iteran sobre todos los plugins descubiertos y ejecutan una
suite de afirmaciones de forma y comportamiento. El carril unitario predeterminado
de `pnpm test` omite intencionalmente estos archivos compartidos de seams y humo;
ejecuta los comandos de contrato explícitamente cuando toques superficies compartidas
de canal o proveedor.

### Comandos

- Todos los contratos: `pnpm test:contracts`
- Solo contratos de canal: `pnpm test:contracts:channels`
- Solo contratos de proveedor: `pnpm test:contracts:plugins`

### Contratos de canal

Ubicados en `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma básica del plugin (id, nombre, capacidades)
- **setup** - Contrato del asistente de configuración
- **session-binding** - Comportamiento de vinculación de sesión
- **outbound-payload** - Estructura de payload de mensaje
- **inbound** - Manejo de mensajes entrantes
- **actions** - Manejadores de acciones de canal
- **threading** - Manejo de ID de hilo
- **directory** - API de directorio/lista
- **group-policy** - Aplicación de la política de grupo

### Contratos de estado de proveedor

Ubicados en `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondas de estado de canal
- **registry** - Forma del registro de plugins

### Contratos de proveedor

Ubicados en `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato de flujo de autenticación
- **auth-choice** - Elección/selección de autenticación
- **catalog** - API de catálogo de modelos
- **discovery** - Descubrimiento de plugins
- **loader** - Carga de plugins
- **runtime** - Runtime de proveedor
- **shape** - Forma/interfaz del plugin
- **wizard** - Asistente de configuración

### Cuándo ejecutarlas

- Después de cambiar exports o subpaths de plugin-sdk
- Después de añadir o modificar un canal o plugin de proveedor
- Después de refactorizar el registro o descubrimiento de plugins

Las pruebas de contrato se ejecutan en CI y no requieren claves de API reales.

## Añadir regresiones (guía)

Cuando corrijas un problema de proveedor/modelo descubierto en vivo:

- Añade una regresión segura para CI si es posible (proveedor simulado/stub, o captura la transformación exacta de la forma de la solicitud)
- Si es inherentemente solo en vivo (límites de tasa, políticas de autenticación), mantén la prueba en vivo restringida y opt-in mediante variables de entorno
- Prefiere apuntar a la capa más pequeña que detecte el bug:
  - bug de conversión/replay de solicitud del proveedor → prueba directa de modelos
  - bug de sesión/historial/pipeline de herramientas del gateway → humo en vivo del gateway o prueba simulada del gateway segura para CI
- Barrera de protección de recorrido de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un destino muestreado por clase SecretRef desde los metadatos del registro (`listSecretTargetRegistryEntries()`), y luego afirma que los ids exec con segmentos de recorrido son rechazados.
  - Si añades una nueva familia de destinos SecretRef `includeInPlan` en `src/secrets/target-registry-data.ts`, actualiza `classifyTargetClass` en esa prueba. La prueba falla intencionalmente con ids de destino no clasificados para que las clases nuevas no puedan omitirse silenciosamente.

## Relacionado

- [Pruebas en vivo](/es/help/testing-live)
- [CI](/es/ci)
