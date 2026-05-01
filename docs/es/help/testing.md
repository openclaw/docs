---
read_when:
    - Ejecutar pruebas localmente o en CI
    - Añadir pruebas de regresión para errores de modelo/proveedor
    - Depuración del comportamiento de Gateway + agente
summary: 'Kit de pruebas: suites unitarias/e2e/en vivo, ejecutores de Docker y qué cubre cada prueba'
title: Pruebas
x-i18n:
    generated_at: "2026-05-01T05:32:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c28e45c483169f528483f7a27265d89c34f3865eb56b51407639b566e117162
    source_path: help/testing.md
    workflow: 16
---

OpenClaw tiene tres suites de Vitest (unitaria/integración, e2e, live) y un pequeño conjunto
de ejecutores Docker. Este documento es una guía de "cómo probamos":

- Qué cubre cada suite (y qué deliberadamente _no_ cubre).
- Qué comandos ejecutar para flujos de trabajo comunes (local, antes de push, depuración).
- Cómo las pruebas live descubren credenciales y seleccionan modelos/proveedores.
- Cómo agregar regresiones para problemas reales de modelos/proveedores.

<Note>
**La pila de QA (qa-lab, qa-channel, carriles de transporte live)** está documentada por separado:

- [Resumen de QA](/es/concepts/qa-e2e-automation) — arquitectura, superficie de comandos, creación de escenarios.
- [QA Matrix](/es/concepts/qa-matrix) — referencia para `pnpm openclaw qa matrix`.
- [Canal de QA](/es/channels/qa-channel) — el Plugin de transporte sintético usado por escenarios respaldados por el repositorio.

Esta página cubre la ejecución de las suites de prueba regulares y los ejecutores Docker/Parallels. La sección de ejecutores específicos de QA abajo ([Ejecutores específicos de QA](#qa-specific-runners)) enumera las invocaciones concretas de `qa` y remite a las referencias anteriores.
</Note>

## Inicio rápido

La mayoría de los días:

- Puerta completa (esperada antes de hacer push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Ejecución local más rápida de la suite completa en una máquina con holgura: `pnpm test:max`
- Bucle directo de observación de Vitest: `pnpm test:watch`
- La selección directa de archivos ahora también enruta rutas de extensiones/canales: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefiere primero ejecuciones dirigidas cuando estés iterando sobre un único fallo.
- Sitio de QA respaldado por Docker: `pnpm qa:lab:up`
- Carril de QA respaldado por VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Cuando toques pruebas o quieras confianza adicional:

- Puerta de cobertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Al depurar proveedores/modelos reales (requiere credenciales reales):

- Suite live (modelos + sondeos de herramienta/imagen de Gateway): `pnpm test:live`
- Apuntar a un archivo live en silencio: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Barrido de modelos live en Docker: `pnpm test:docker:live-models`
  - Cada modelo seleccionado ahora ejecuta un turno de texto más un pequeño sondeo de estilo lectura de archivo.
    Los modelos cuyos metadatos anuncian entrada `image` también ejecutan un turno de imagen diminuto.
    Desactiva los sondeos adicionales con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` u
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` al aislar fallos de proveedor.
  - Cobertura de CI: `OpenClaw Scheduled Live And E2E Checks` diario y
    `OpenClaw Release Checks` manual llaman ambos al flujo de trabajo live/E2E reutilizable con
    `include_live_suites: true`, que incluye jobs separados de matriz de modelos live en Docker
    fragmentados por proveedor.
  - Para reejecuciones enfocadas en CI, dispara `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` y `live_models_only: true`.
  - Agrega nuevos secretos de proveedor de alta señal a `scripts/ci-hydrate-live-auth.sh`
    junto con `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` y sus
    llamadores programados/de release.
- Smoke de chat vinculado nativo de Codex: `pnpm test:docker:live-codex-bind`
  - Ejecuta un carril live de Docker contra la ruta del servidor de app de Codex, vincula un DM sintético de
    Slack con `/codex bind`, ejercita `/codex fast` y
    `/codex permissions`, y luego verifica que una respuesta simple y un adjunto de imagen
    se enruten a través del enlace nativo del Plugin en lugar de ACP.
- Smoke del arnés del servidor de app de Codex: `pnpm test:docker:live-codex-harness`
  - Ejecuta turnos de agente de Gateway a través del arnés del servidor de app de Codex propiedad del Plugin,
    verifica `/codex status` y `/codex models`, y de forma predeterminada ejercita sondeos de imagen,
    MCP de Cron, subagente y Guardian. Desactiva el sondeo de subagente con
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` al aislar otros fallos del
    servidor de app de Codex. Para una comprobación enfocada del subagente, desactiva los otros sondeos:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Esto sale después del sondeo de subagente a menos que
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` esté configurado.
- Smoke del comando de rescate de Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Comprobación opcional de cinturón y tirantes para la superficie del comando de rescate de canal de mensajes.
    Ejercita `/crestodian status`, encola un cambio persistente de modelo,
    responde `/crestodian yes` y verifica la ruta de escritura de auditoría/configuración.
- Smoke Docker del planificador de Crestodian: `pnpm test:docker:crestodian-planner`
  - Ejecuta Crestodian en un contenedor sin configuración con una CLI falsa de Claude en `PATH`
    y verifica que el respaldo del planificador difuso se traduzca en una escritura de configuración tipada
    auditada.
- Smoke Docker de primera ejecución de Crestodian: `pnpm test:docker:crestodian-first-run`
  - Comienza desde un directorio de estado vacío de OpenClaw, enruta `openclaw` sin argumentos a
    Crestodian, aplica configuración/modelo/agente/Plugin de Discord + escrituras SecretRef,
    valida la configuración y verifica entradas de auditoría. La misma ruta de configuración Ring 0 también está
    cubierta en QA Lab por
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de coste Moonshot/Kimi: con `MOONSHOT_API_KEY` configurada, ejecuta
  `openclaw models list --provider moonshot --json`, luego ejecuta un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  aislado contra `moonshot/kimi-k2.6`. Verifica que el JSON reporte Moonshot/K2.6 y que la
  transcripción del asistente almacene `usage.cost` normalizado.

<Tip>
Cuando solo necesites un caso fallido, prefiere acotar las pruebas live mediante las variables de entorno de allowlist descritas abajo.
</Tip>

## Ejecutores específicos de QA

Estos comandos se ubican junto a las suites de prueba principales cuando necesitas realismo de QA-lab:

CI ejecuta QA Lab en flujos de trabajo dedicados. `Parity gate` se ejecuta en PRs coincidentes y
desde despacho manual con proveedores simulados. `QA-Lab - All Lanes` se ejecuta cada noche en
`main` y desde despacho manual con la puerta de paridad simulada, el carril live de Matrix,
el carril live de Telegram administrado por Convex y el carril live de Discord administrado por Convex como
jobs paralelos. QA programado y las comprobaciones de release pasan Matrix `--profile fast`
explícitamente, mientras que la CLI de Matrix y la entrada de flujo de trabajo manual siguen teniendo
`all` como valor predeterminado; el despacho manual puede fragmentar `all` en jobs `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` y `e2ee-cli`. `OpenClaw Release Checks` ejecuta paridad más
los carriles rápidos de Matrix y Telegram antes de la aprobación de release, usando
`mock-openai/gpt-5.5` para comprobaciones de transporte de release, de modo que permanezcan deterministas
y eviten el inicio normal del Plugin de proveedor. Estos Gateways de transporte live desactivan
la búsqueda de memoria; el comportamiento de memoria sigue cubierto por las suites de paridad de QA.

Los fragmentos live de medios para release completa usan
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, que ya tiene
`ffmpeg` y `ffprobe`. Los fragmentos Docker live de modelos/backend usan la imagen compartida
`ghcr.io/openclaw/openclaw-live-test:<sha>` construida una vez por commit seleccionado,
y luego la descargan con `OPENCLAW_SKIP_DOCKER_BUILD=1` en lugar de reconstruirla
dentro de cada fragmento.

- `pnpm openclaw qa suite`
  - Ejecuta escenarios de QA respaldados por el repositorio directamente en el host.
  - Ejecuta múltiples escenarios seleccionados en paralelo de forma predeterminada con workers de
    Gateway aislados. `qa-channel` usa concurrencia 4 por defecto (limitada por el
    conteo de escenarios seleccionados). Usa `--concurrency <count>` para ajustar el conteo de workers,
    o `--concurrency 1` para el carril serial anterior.
  - Sale con código distinto de cero cuando cualquier escenario falla. Usa `--allow-failures` cuando
    quieras artefactos sin un código de salida fallido.
  - Admite modos de proveedor `live-frontier`, `mock-openai` y `aimock`.
    `aimock` inicia un servidor de proveedor local respaldado por AIMock para cobertura experimental
    de fixtures y simulación de protocolo sin reemplazar el carril
    `mock-openai` consciente de escenarios.
- `pnpm test:gateway:cpu-scenarios`
  - Ejecuta el banco de arranque de Gateway más un pequeño paquete de escenarios simulados de QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) y escribe un resumen combinado de observaciones de CPU
    bajo `.artifacts/gateway-cpu-scenarios/`.
  - Marca solo observaciones sostenidas de CPU caliente de forma predeterminada (`--cpu-core-warn`
    más `--hot-wall-warn-ms`), de modo que las ráfagas breves de arranque se registren como métricas
    sin parecerse a la regresión de saturación de Gateway de varios minutos.
  - Usa artefactos `dist` construidos; ejecuta una compilación primero cuando el checkout no
    tenga ya salida de runtime reciente.
- `pnpm openclaw qa suite --runner multipass`
  - Ejecuta la misma suite de QA dentro de una VM Linux descartable de Multipass.
  - Mantiene el mismo comportamiento de selección de escenarios que `qa suite` en el host.
  - Reutiliza las mismas banderas de selección de proveedor/modelo que `qa suite`.
  - Las ejecuciones live reenvían las entradas de autenticación de QA admitidas que son prácticas para el invitado:
    claves de proveedor basadas en entorno, la ruta de configuración de proveedor live de QA y `CODEX_HOME`
    cuando está presente.
  - Los directorios de salida deben permanecer bajo la raíz del repositorio para que el invitado pueda escribir de vuelta a través
    del espacio de trabajo montado.
  - Escribe el reporte + resumen normales de QA más registros de Multipass bajo
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia el sitio de QA respaldado por Docker para trabajo de QA de estilo operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Construye un tarball npm desde el checkout actual, lo instala globalmente en
    Docker, ejecuta onboarding no interactivo de clave de API de OpenAI, configura Telegram
    de forma predeterminada, verifica que habilitar el Plugin instale dependencias de runtime bajo demanda,
    ejecuta doctor y ejecuta un turno de agente local contra un endpoint simulado de OpenAI.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para ejecutar el mismo carril de instalación empaquetada
    con Discord.
- `pnpm test:docker:session-runtime-context`
  - Ejecuta un smoke determinista de Docker de app construida para transcripciones de contexto de runtime embebido.
    Verifica que el contexto de runtime oculto de OpenClaw se persista como un mensaje personalizado
    no visible en lugar de filtrarse en el turno visible del usuario,
    luego siembra un JSONL de sesión rota afectada y verifica que
    `openclaw doctor --fix` lo reescriba a la rama activa con una copia de respaldo.
- `pnpm test:docker:npm-telegram-live`
  - Instala un candidato de paquete OpenClaw en Docker, ejecuta onboarding de paquete instalado,
    configura Telegram mediante la CLI instalada y luego reutiliza el
    carril live de QA de Telegram con ese paquete instalado como el Gateway SUT.
  - Usa por defecto `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; configura
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` o
    `OPENCLAW_CURRENT_PACKAGE_TGZ` para probar un tarball local resuelto en lugar de
    instalar desde el registro.
  - Usa las mismas credenciales de entorno de Telegram o fuente de credenciales de Convex que
    `pnpm openclaw qa telegram`. Para automatización de CI/release, configura
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` más
    `OPENCLAW_QA_CONVEX_SITE_URL` y el secreto de rol. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` y un secreto de rol de Convex están presentes en CI,
    el wrapper de Docker selecciona Convex automáticamente.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sobrescribe el
    `OPENCLAW_QA_CREDENTIAL_ROLE` compartido solo para este carril.
  - GitHub Actions expone este carril como el flujo de trabajo manual de mantenedor
    `NPM Telegram Beta E2E`. No se ejecuta al fusionar. El flujo de trabajo usa el entorno
    `qa-live-shared` y leases de credenciales CI de Convex.
- GitHub Actions también expone `Package Acceptance` para prueba de producto en ejecución lateral
  contra un paquete candidato. Acepta una ref confiable, una especificación npm publicada,
  una URL HTTPS de tarball más SHA-256, o un artefacto tarball de otra ejecución, sube
  el `openclaw-current.tgz` normalizado como `package-under-test`, y luego ejecuta el
  programador Docker E2E existente con perfiles de carril smoke, package, product, full o custom.
  Configura `telegram_mode=mock-openai` o `live-frontier` para ejecutar el
  flujo de trabajo de QA de Telegram contra el mismo artefacto `package-under-test`.
  - Prueba de producto beta más reciente:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- La prueba con URL exacta de tarball requiere un digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- La prueba de artefacto descarga un artefacto tarball de otra ejecución de Actions:

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
  - Verifica que la detección de configuración deje ausentes las dependencias de tiempo
    de ejecución de plugins sin configurar, que el primer Gateway configurado o la primera
    ejecución de doctor instale bajo demanda las dependencias de tiempo de ejecución de
    cada plugin incluido, y que un segundo reinicio no reinstale dependencias que ya se
    habían activado.
  - También instala una línea base npm anterior conocida, habilita Telegram antes de ejecutar
    `openclaw update --tag <candidate>`, y verifica que el doctor posterior a la actualización
    del candidato repare las dependencias de tiempo de ejecución de canales incluidos sin una
    reparación postinstall del lado del harness.
- `pnpm test:parallels:npm-update`
  - Ejecuta el smoke de actualización de instalación empaquetada nativa en invitados de Parallels. Cada
    plataforma seleccionada instala primero el paquete de línea base solicitado, luego ejecuta
    el comando `openclaw update` instalado en el mismo invitado y verifica la
    versión instalada, el estado de actualización, la preparación del Gateway y un turno de agente
    local.
  - Usa `--platform macos`, `--platform windows` o `--platform linux` mientras
    iteras sobre un invitado. Usa `--json` para la ruta del artefacto de resumen y
    el estado por lane.
  - La lane de OpenAI usa `openai/gpt-5.5` para la prueba en vivo del turno de agente por
    defecto. Pasa `--model <provider/model>` o define
    `OPENCLAW_PARALLELS_OPENAI_MODEL` cuando valides deliberadamente otro
    modelo de OpenAI.
  - Envuelve las ejecuciones locales largas en un timeout del host para que los bloqueos del transporte de Parallels no
    consuman el resto de la ventana de pruebas:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - El script escribe registros de lanes anidadas bajo `/tmp/openclaw-parallels-npm-update.*`.
    Inspecciona `windows-update.log`, `macos-update.log` o `linux-update.log`
    antes de asumir que el envoltorio externo está colgado.
  - La actualización de Windows puede pasar de 10 a 15 minutos en la reparación posterior a la actualización de doctor/dependencias
    de tiempo de ejecución en un invitado en frío; eso sigue siendo saludable cuando el registro
    de depuración npm anidado avanza.
  - No ejecutes este envoltorio agregado en paralelo con lanes smoke individuales de Parallels
    macOS, Windows o Linux. Comparten estado de VM y pueden colisionar en
    la restauración de instantáneas, el servicio de paquetes o el estado del Gateway del invitado.
  - La prueba posterior a la actualización ejecuta la superficie normal de plugins incluidos porque
    las fachadas de capacidad como voz, generación de imágenes y comprensión
    de medios se cargan mediante APIs de tiempo de ejecución incluidas incluso cuando el turno de agente
    en sí solo comprueba una respuesta de texto simple.

- `pnpm openclaw qa aimock`
  - Inicia solo el servidor proveedor AIMock local para pruebas smoke directas
    del protocolo.
- `pnpm openclaw qa matrix`
  - Ejecuta la lane QA en vivo de Matrix contra un homeserver Tuwunel desechable respaldado por Docker. Solo checkout de origen; las instalaciones empaquetadas no incluyen `qa-lab`.
  - CLI completa, catálogo de perfiles/escenarios, variables de entorno y diseño de artefactos: [QA de Matrix](/es/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Ejecuta la lane QA en vivo de Telegram contra un grupo privado real usando los tokens de bot del controlador y del SUT desde el entorno.
  - Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. El id del grupo debe ser el id numérico de chat de Telegram.
  - Admite `--credential-source convex` para credenciales agrupadas compartidas. Usa el modo de entorno por defecto, o define `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases agrupados.
  - Sale con código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
    quieras artefactos sin un código de salida fallido.
  - Requiere dos bots distintos en el mismo grupo privado, con el bot SUT exponiendo un nombre de usuario de Telegram.
  - Para una observación estable de bot a bot, habilita Bot-to-Bot Communication Mode en `@BotFather` para ambos bots y asegúrate de que el bot controlador pueda observar el tráfico de bots del grupo.
  - Escribe un informe QA de Telegram, un resumen y un artefacto de mensajes observados bajo `.artifacts/qa-e2e/...`. Los escenarios de respuesta incluyen RTT desde la solicitud de envío del controlador hasta la respuesta SUT observada.

Las lanes de transporte en vivo comparten un contrato estándar para que los transportes nuevos no se desvíen; la matriz de cobertura por lane vive en [Resumen de QA → Cobertura de transporte en vivo](/es/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` es la suite sintética amplia y no forma parte de esa matriz.

### Credenciales compartidas de Telegram mediante Convex (v1)

Cuando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
`openclaw qa telegram`, QA lab adquiere un lease exclusivo desde un pool respaldado por Convex, envía heartbeats
a ese lease mientras la lane se está ejecutando, y libera el lease al apagarse.

Andamiaje de referencia del proyecto Convex:

- `qa/convex-credential-broker/`

Variables de entorno requeridas:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por ejemplo `https://your-deployment.convex.site`)
- Un secreto para el rol seleccionado:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Selección del rol de credencial:
  - CLI: `--credential-role maintainer|ci`
  - Predeterminado de entorno: `OPENCLAW_QA_CREDENTIAL_ROLE` (por defecto `ci` en CI, `maintainer` en caso contrario)

Variables de entorno opcionales:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predeterminado `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predeterminado `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predeterminado `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predeterminado `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predeterminado `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de traza opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs Convex `http://` de loopback para desarrollo solo local.

`OPENCLAW_QA_CONVEX_SITE_URL` debe usar `https://` en operación normal.

Los comandos administrativos de mantenedor (añadir/eliminar/listar pool) requieren
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` específicamente.

Ayudantes CLI para mantenedores:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `doctor` antes de ejecuciones en vivo para comprobar la URL del sitio Convex, secretos del broker,
prefijo de endpoint, timeout HTTP y accesibilidad de admin/list sin imprimir
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
  - Protección de lease activo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo secreto de mantenedor)
  - Solicitud: `{ kind?, status?, includePayload?, limit? }`
  - Éxito: `{ status: "ok", credentials, count }`

Forma del payload para kind Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` debe ser una cadena de id numérico de chat de Telegram.
- `admin/add` valida esta forma para `kind: "telegram"` y rechaza payloads mal formados.

### Añadir un canal a QA

La arquitectura y los nombres de ayudantes de escenario para adaptadores de canal nuevos viven en [Resumen de QA → Añadir un canal](/es/concepts/qa-e2e-automation#adding-a-channel). El mínimo requerido: implementar el runner de transporte sobre la seam compartida de host `qa-lab`, declarar `qaRunners` en el manifiesto del plugin, montar como `openclaw qa <runner>` y crear escenarios bajo `qa/scenarios/`.

## Suites de pruebas (qué se ejecuta dónde)

Piensa en las suites como “realismo creciente” (y coste/inestabilidad crecientes):

### Unitarias / integración (predeterminado)

- Comando: `pnpm test`
- Configuración: las ejecuciones sin objetivo usan el conjunto de shards `vitest.full-*.config.ts` y pueden expandir shards multiproyecto a configuraciones por proyecto para la programación en paralelo
- Archivos: inventarios core/unit bajo `src/**/*.test.ts`, `packages/**/*.test.ts` y `test/**/*.test.ts`; las pruebas unitarias de UI se ejecutan en el shard dedicado `unit-ui`
- Alcance:
  - Pruebas unitarias puras
  - Pruebas de integración en proceso (autenticación de gateway, enrutamiento, herramientas, análisis, configuración)
  - Regresiones deterministas para bugs conocidos
- Expectativas:
  - Se ejecuta en CI
  - No requiere claves reales
  - Debe ser rápido y estable
  - Las pruebas del resolvedor y del cargador de superficie pública deben probar el comportamiento fallback amplio de `api.js` y
    `runtime-api.js` con fixtures mínimos de plugin generados, no con
    APIs de origen de plugins incluidos reales. Las cargas de API de plugins reales pertenecen a
    suites de contrato/integración propiedad del plugin.

<AccordionGroup>
  <Accordion title="Proyectos, shards y lanes con alcance">

    - `pnpm test` sin destino ejecuta doce configuraciones de fragmentos más pequeñas (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) en lugar de un único proceso nativo gigante de proyecto raíz. Esto reduce el RSS máximo en máquinas con carga y evita que el trabajo de auto-reply/extensiones prive de recursos a suites no relacionadas.
    - `pnpm test --watch` sigue usando el grafo de proyectos raíz nativo `vitest.config.ts`, porque un bucle de observación con varios fragmentos no es práctico.
    - `pnpm test`, `pnpm test:watch` y `pnpm test:perf:imports` enrutan primero los destinos explícitos de archivo/directorio por carriles con alcance, de modo que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar el coste completo de arranque del proyecto raíz.
    - `pnpm test:changed` expande las rutas de git cambiadas a carriles con alcance baratos de forma predeterminada: ediciones directas de pruebas, archivos hermanos `*.test.ts`, asignaciones explícitas de código fuente y dependientes del grafo de importación local. Las ediciones de configuración/preparación/paquete no ejecutan pruebas amplias salvo que uses explícitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` es la puerta normal e inteligente de comprobación local para trabajo acotado. Clasifica el diff en core, pruebas de core, extensiones, pruebas de extensiones, apps, docs, metadatos de release, herramientas live de Docker y tooling, y luego ejecuta los comandos de typecheck, lint y guard correspondientes. No ejecuta pruebas de Vitest; llama a `pnpm test:changed` o a `pnpm test <target>` explícito para obtener prueba de tests. Los incrementos de versión solo de metadatos de release ejecutan comprobaciones dirigidas de versión/config/dependencias raíz, con un guard que rechaza cambios de paquete fuera del campo de versión de nivel superior.
    - Las ediciones del arnés live de Docker ACP ejecutan comprobaciones enfocadas: sintaxis de shell para los scripts live de autenticación de Docker y una ejecución en seco del planificador live de Docker. Los cambios de `package.json` se incluyen solo cuando el diff se limita a `scripts["test:docker:live-*"]`; los cambios de dependencias, exportaciones, versión y otras superficies de paquete siguen usando los guards más amplios.
    - Las pruebas unitarias ligeras de importación de agentes, comandos, plugins, helpers de auto-reply, `plugin-sdk` y áreas similares de utilidades puras se enrutan por el carril `unit-fast`, que omite `test/setup-openclaw-runtime.ts`; los archivos con estado o pesados de runtime permanecen en los carriles existentes.
    - Algunos archivos fuente helper de `plugin-sdk` y `commands` también asignan las ejecuciones en modo changed a pruebas hermanas explícitas en esos carriles ligeros, por lo que las ediciones de helpers evitan volver a ejecutar toda la suite pesada de ese directorio.
    - `auto-reply` tiene buckets dedicados para helpers de core de nivel superior, pruebas de integración `reply.*` de nivel superior y el subárbol `src/auto-reply/reply/**`. CI además divide el subárbol de reply en fragmentos de agent-runner, dispatch y commands/state-routing para que un bucket pesado en importaciones no se quede con toda la cola de Node.
    - La CI normal de PR/main omite intencionalmente el barrido por lotes de extensiones y el fragmento solo de release `agentic-plugins`. Full Release Validation despacha el workflow hijo separado `Plugin Prerelease` para esas suites pesadas de plugins/extensiones en candidatos de release.

  </Accordion>

  <Accordion title="Cobertura del runner integrado">

    - Cuando cambies entradas de descubrimiento de herramientas de mensaje o el contexto de runtime de Compaction, conserva ambos niveles de cobertura.
    - Añade regresiones enfocadas de helpers para límites puros de enrutamiento y normalización.
    - Mantén saludables las suites de integración del runner integrado:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` y
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Esas suites verifican que los ids con alcance y el comportamiento de Compaction sigan fluyendo por las rutas reales `run.ts` / `compact.ts`; las pruebas solo de helpers no son un sustituto suficiente para esas rutas de integración.

  </Accordion>

  <Accordion title="Valores predeterminados de pool e aislamiento de Vitest">

    - La configuración base de Vitest usa `threads` de forma predeterminada.
    - La configuración compartida de Vitest fija `isolate: false` y usa el runner no aislado en los proyectos raíz, e2e y configuraciones live.
    - El carril de UI raíz conserva su preparación y optimizador de `jsdom`, pero también se ejecuta en el runner compartido no aislado.
    - Cada fragmento de `pnpm test` hereda los mismos valores predeterminados `threads` + `isolate: false` de la configuración compartida de Vitest.
    - `scripts/run-vitest.mjs` añade `--no-maglev` de forma predeterminada para los procesos Node hijos de Vitest a fin de reducir la rotación de compilación de V8 durante ejecuciones locales grandes. Define `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar con el comportamiento estándar de V8.

  </Accordion>

  <Accordion title="Iteración local rápida">

    - `pnpm changed:lanes` muestra qué carriles arquitectónicos activa un diff.
    - El hook de pre-commit solo aplica formato. Vuelve a poner en stage los archivos formateados y no ejecuta lint, typecheck ni pruebas.
    - Ejecuta `pnpm check:changed` explícitamente antes del handoff o push cuando necesites la puerta inteligente de comprobación local.
    - `pnpm test:changed` se enruta por carriles con alcance baratos de forma predeterminada. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el agente decida que una edición de arnés, configuración, paquete o contrato realmente necesita cobertura más amplia de Vitest.
    - `pnpm test:max` y `pnpm test:changed:max` mantienen el mismo comportamiento de enrutamiento, solo que con un límite de workers más alto.
    - El autoescalado de workers locales es intencionalmente conservador y retrocede cuando la carga media del host ya es alta, por lo que varias ejecuciones simultáneas de Vitest causan menos impacto de forma predeterminada.
    - La configuración base de Vitest marca los proyectos/archivos de configuración como `forceRerunTriggers` para que las repeticiones en modo changed sigan siendo correctas cuando cambie el cableado de pruebas.
    - La configuración mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado en hosts compatibles; define `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si quieres una ubicación explícita de caché para perfilado directo.

  </Accordion>

  <Accordion title="Depuración de rendimiento">

    - `pnpm test:perf:imports` habilita el informe de duración de importaciones de Vitest más la salida de desglose de importaciones.
    - `pnpm test:perf:imports:changed` acota la misma vista de perfilado a los archivos cambiados desde `origin/main`.
    - Los datos de tiempos de fragmentos se escriben en `.artifacts/vitest-shard-timings.json`. Las ejecuciones de configuración completa usan la ruta de configuración como clave; los fragmentos de CI con patrones de inclusión añaden el nombre del fragmento para que los fragmentos filtrados puedan rastrearse por separado.
    - Cuando una prueba caliente todavía dedica la mayor parte del tiempo a importaciones de arranque, mantén las dependencias pesadas detrás de una costura local estrecha `*.runtime.ts` y mockea esa costura directamente en lugar de hacer deep-import de helpers de runtime solo para pasarlos por `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara `test:changed` enrutado con la ruta nativa de proyecto raíz para ese diff confirmado y muestra tiempo de pared más RSS máximo en macOS.
    - `pnpm test:perf:changed:bench -- --worktree` mide el árbol actual con cambios sin confirmar enrutando la lista de archivos cambiados por `scripts/test-projects.mjs` y la configuración raíz de Vitest.
    - `pnpm test:perf:profile:main` escribe un perfil de CPU del hilo principal para el overhead de arranque y transformación de Vitest/Vite.
    - `pnpm test:perf:profile:runner` escribe perfiles de CPU+heap del runner para la suite unitaria con el paralelismo de archivos deshabilitado.

  </Accordion>
</AccordionGroup>

### Estabilidad (Gateway)

- Comando: `pnpm test:stability:gateway`
- Configuración: `vitest.gateway.config.ts`, forzada a un worker
- Alcance:
  - Inicia un Gateway real de local loopback con diagnósticos habilitados de forma predeterminada
  - Impulsa rotación sintética de mensajes de gateway, memoria y payloads grandes por la ruta de eventos de diagnóstico
  - Consulta `diagnostics.stability` sobre el RPC WS del Gateway
  - Cubre helpers de persistencia del paquete de estabilidad de diagnóstico
  - Afirma que el recorder permanece acotado, las muestras RSS sintéticas se mantienen por debajo del presupuesto de presión y las profundidades de cola por sesión vuelven a cero
- Expectativas:
  - Seguro para CI y sin claves
  - Carril estrecho para seguimiento de regresiones de estabilidad, no un sustituto de la suite completa de Gateway

### E2E (smoke de Gateway)

- Comando: `pnpm test:e2e`
- Configuración: `vitest.e2e.config.ts`
- Archivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` y pruebas E2E de plugins incluidos bajo `extensions/`
- Valores predeterminados de runtime:
  - Usa `threads` de Vitest con `isolate: false`, igual que el resto del repo.
  - Usa workers adaptativos (CI: hasta 2, local: 1 de forma predeterminada).
  - Se ejecuta en modo silencioso de forma predeterminada para reducir el overhead de E/S de consola.
- Overrides útiles:
  - `OPENCLAW_E2E_WORKERS=<n>` para forzar el número de workers (limitado a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para volver a habilitar la salida detallada de consola.
- Alcance:
  - Comportamiento end-to-end de Gateway multiinstancia
  - Superficies WebSocket/HTTP, emparejamiento de nodos y redes más pesadas
- Expectativas:
  - Se ejecuta en CI (cuando está habilitado en el pipeline)
  - No se requieren claves reales
  - Más partes móviles que las pruebas unitarias (puede ser más lento)

### E2E: smoke de backend de OpenShell

- Comando: `pnpm test:e2e:openshell`
- Archivo: `extensions/openshell/src/backend.e2e.test.ts`
- Alcance:
  - Inicia un Gateway de OpenShell aislado en el host mediante Docker
  - Crea un sandbox a partir de un Dockerfile local temporal
  - Ejercita el backend de OpenShell de OpenClaw sobre `sandbox ssh-config` real + exec por SSH
  - Verifica el comportamiento del sistema de archivos canónico remoto por el puente fs del sandbox
- Expectativas:
  - Solo opt-in; no forma parte de la ejecución predeterminada de `pnpm test:e2e`
  - Requiere una CLI local `openshell` y un daemon de Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` aislados y luego destruye el Gateway de prueba y el sandbox
- Overrides útiles:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar la prueba al ejecutar manualmente la suite e2e más amplia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apuntar a un binario de CLI no predeterminado o a un script wrapper

### Live (proveedores reales + modelos reales)

- Comando: `pnpm test:live`
- Configuración: `vitest.live.config.ts`
- Archivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` y pruebas live de plugins incluidos bajo `extensions/`
- Predeterminado: **habilitado** por `pnpm test:live` (define `OPENCLAW_LIVE_TEST=1`)
- Alcance:
  - “¿Este proveedor/modelo realmente funciona _hoy_ con credenciales reales?”
  - Detectar cambios de formato de proveedores, particularidades de tool-calling, problemas de autenticación y comportamiento de rate limit
- Expectativas:
  - No es estable para CI por diseño (redes reales, políticas reales de proveedores, cuotas, interrupciones)
  - Cuesta dinero / usa rate limits
  - Prefiere ejecutar subconjuntos acotados en lugar de “todo”
- Las ejecuciones live cargan `~/.profile` para recoger claves API faltantes.
- De forma predeterminada, las ejecuciones live siguen aislando `HOME` y copian material de config/auth a un home temporal de prueba para que los fixtures unitarios no puedan mutar tu `~/.openclaw` real.
- Define `OPENCLAW_LIVE_USE_REAL_HOME=1` solo cuando necesites intencionalmente que las pruebas live usen tu directorio home real.
- `pnpm test:live` ahora usa de forma predeterminada un modo más silencioso: conserva la salida de progreso `[live] ...`, pero suprime el aviso extra de `~/.profile` y silencia los logs de bootstrap de Gateway/chatter de Bonjour. Define `OPENCLAW_LIVE_TEST_QUIET=0` si quieres recuperar los logs completos de arranque.
- Rotación de claves API (específica por proveedor): define `*_API_KEYS` con formato de coma/punto y coma o `*_API_KEY_1`, `*_API_KEY_2` (por ejemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) o override por live mediante `OPENCLAW_LIVE_*_KEY`; las pruebas reintentan ante respuestas de rate limit.
- Salida de progreso/Heartbeat:
  - Las suites live ahora emiten líneas de progreso a stderr para que las llamadas largas a proveedores sean visiblemente activas incluso cuando la captura de consola de Vitest está en silencio.
  - `vitest.live.config.ts` deshabilita la interceptación de consola de Vitest para que las líneas de progreso de proveedor/Gateway se transmitan inmediatamente durante las ejecuciones live.
  - Ajusta los Heartbeats de modelos directos con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajusta los Heartbeats de Gateway/probe con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## ¿Qué suite debo ejecutar?

Usa esta tabla de decisión:

- Lógica/pruebas de edición: ejecuta `pnpm test` (y `pnpm test:coverage` si cambiaste mucho)
- Al tocar redes del Gateway / protocolo WS / emparejamiento: agrega `pnpm test:e2e`
- Al depurar “mi bot está caído” / fallos específicos de proveedor / llamadas a herramientas: ejecuta un `pnpm test:live` acotado

## Pruebas en vivo (con acceso a red)

Para la matriz de modelos en vivo, pruebas de humo del backend de CLI, pruebas de humo de ACP, arnés del servidor de aplicaciones de Codex y todas las pruebas en vivo de proveedores multimedia (Deepgram, BytePlus, ComfyUI, imagen, música, video, arnés multimedia), además del manejo de credenciales para ejecuciones en vivo, consulta [Pruebas: suites en vivo](/es/help/testing-live).

## Ejecutores Docker (comprobaciones opcionales de "funciona en Linux")

Estos ejecutores Docker se dividen en dos grupos:

- Ejecutores de modelos en vivo: `test:docker:live-models` y `test:docker:live-gateway` ejecutan solo su archivo en vivo correspondiente de clave de perfil dentro de la imagen Docker del repositorio (`src/agents/models.profiles.live.test.ts` y `src/gateway/gateway-models.profiles.live.test.ts`), montando tu directorio de configuración local y el workspace (y cargando `~/.profile` si está montado). Los puntos de entrada locales correspondientes son `test:live:models-profiles` y `test:live:gateway-profiles`.
- Los ejecutores Docker en vivo usan de forma predeterminada un límite de prueba de humo más pequeño para que un barrido Docker completo siga siendo práctico:
  `test:docker:live-models` usa de forma predeterminada `OPENCLAW_LIVE_MAX_MODELS=12`, y
  `test:docker:live-gateway` usa de forma predeterminada `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` y
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sobrescribe esas variables de entorno cuando
  quieras explícitamente el escaneo exhaustivo más grande.
- `test:docker:all` construye la imagen Docker en vivo una vez mediante `test:docker:live-build`, empaqueta OpenClaw una vez como tarball npm mediante `scripts/package-openclaw-for-docker.mjs` y luego construye/reutiliza dos imágenes de `scripts/e2e/Dockerfile`. La imagen básica es solo el ejecutor Node/Git para los carriles de instalación/actualización/dependencias de Plugin; esos carriles montan el tarball precompilado. La imagen funcional instala el mismo tarball en `/app` para los carriles de funcionalidad de la aplicación construida. Las definiciones de carriles Docker están en `scripts/lib/docker-e2e-scenarios.mjs`; la lógica del planificador está en `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ejecuta el plan seleccionado. El agregado usa un planificador local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla los slots de proceso, mientras que los límites de recursos evitan que carriles pesados en vivo, de instalación npm y multiservicio empiecen todos a la vez. Si un solo carril es más pesado que los límites activos, el planificador aún puede iniciarlo cuando el pool está vacío y luego mantenerlo ejecutándose solo hasta que vuelva a haber capacidad disponible. Los valores predeterminados son 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` y `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajusta `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` solo cuando el host Docker tenga más margen. El ejecutor realiza una comprobación previa de Docker de forma predeterminada, elimina contenedores E2E obsoletos de OpenClaw, imprime el estado cada 30 segundos, almacena los tiempos de carriles correctos en `.artifacts/docker-tests/lane-timings.json` y usa esos tiempos para iniciar primero los carriles más largos en ejecuciones posteriores. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir el manifiesto de carriles ponderado sin construir ni ejecutar Docker, o `node scripts/test-docker-all.mjs --plan-json` para imprimir el plan de CI de los carriles seleccionados, las necesidades de paquete/imagen y las credenciales.
- `Package Acceptance` es la puerta de paquete nativa de GitHub para "¿este tarball instalable funciona como producto?". Resuelve un paquete candidato desde `source=npm`, `source=ref`, `source=url` o `source=artifact`, lo sube como `package-under-test` y luego ejecuta los carriles Docker E2E reutilizables contra ese tarball exacto en lugar de volver a empaquetar la referencia seleccionada. `workflow_ref` selecciona los scripts de flujo de trabajo/arnés de confianza, mientras que `package_ref` selecciona el commit/rama/etiqueta de origen que se empaquetará cuando `source=ref`; esto permite que la lógica de aceptación actual valide commits antiguos de confianza. Los perfiles se ordenan por amplitud: `smoke` es una instalación/canal/agente rápida más Gateway/configuración, `package` es el contrato de paquete/actualización/Plugin más el fixture keyless upgrade-survivor, el carril de supervivencia de actualización de línea base publicada y el reemplazo nativo predeterminado para la mayor parte de la cobertura de paquete/actualización de Parallels, `product` agrega canales MCP, limpieza de Cron/subagente, búsqueda web de OpenAI y OpenWebUI, y `full` ejecuta los fragmentos Docker de la ruta de release con OpenWebUI. Para `published-upgrade-survivor`, Package Acceptance siempre usa `package-under-test` como candidato y `published_upgrade_survivor_baseline` como línea base publicada, con valor predeterminado `openclaw@latest`; divide una cobertura más amplia despachando múltiples ejecuciones con valores de línea base exactos. El carril publicado configura su línea base con una receta de comando `openclaw config set` integrada y luego registra los pasos de la receta en el resumen del carril. La validación de release ejecuta un delta de paquete personalizado (`bundled-channel-deps-compat plugins-offline`) más QA de paquete de Telegram porque los fragmentos Docker de la ruta de release ya cubren los carriles superpuestos de paquete/actualización/Plugin. Los comandos de reejecución Docker dirigidos de GitHub generados desde artefactos incluyen el artefacto de paquete anterior, las entradas de imagen preparadas y la línea base published upgrade-survivor cuando está disponible, para que los carriles fallidos puedan evitar reconstruir el paquete y las imágenes.
- Las comprobaciones de construcción y release ejecutan `scripts/check-cli-bootstrap-imports.mjs` después de tsdown. La guarda recorre el grafo construido estático desde `dist/entry.js` y `dist/cli/run-main.js` y falla si el arranque previo al despacho importa dependencias de paquete como Commander, interfaz de prompt, undici o logging antes del despacho del comando; también mantiene el fragmento de ejecución del Gateway empaquetado dentro del presupuesto y rechaza importaciones estáticas de rutas frías conocidas del Gateway. La prueba de humo de la CLI empaquetada también cubre la ayuda raíz, ayuda de onboarding, ayuda de doctor, estado, esquema de configuración y un comando de lista de modelos.
- La compatibilidad heredada de Package Acceptance está limitada a `2026.4.25` (`2026.4.25-beta.*` incluido). Hasta ese punto de corte, el arnés tolera solo brechas de metadatos de paquetes publicados: entradas omitidas de inventario QA privado, falta de `gateway install --wrapper`, archivos de parche faltantes en el fixture git derivado del tarball, falta de `update.channel` persistido, ubicaciones heredadas de registros de instalación de Plugin, falta de persistencia del registro de instalación del marketplace y migración de metadatos de configuración durante `plugins update`. Para paquetes posteriores a `2026.4.25`, esas rutas son fallos estrictos.
- Ejecutores de prueba de humo de contenedores: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` y `test:docker:config-reload` arrancan uno o más contenedores reales y verifican rutas de integración de mayor nivel.

Los ejecutores Docker de modelos en vivo también montan con bind mount solo los directorios de autenticación de CLI necesarios (o todos los admitidos cuando la ejecución no está acotada), y luego los copian al home del contenedor antes de la ejecución para que OAuth de CLI externas pueda actualizar tokens sin mutar el almacén de autenticación del host:

- Modelos directos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de enlace ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; cubre Claude, Codex y Gemini de forma predeterminada, con cobertura estricta de Droid/OpenCode mediante `pnpm test:docker:live-acp-bind:droid` y `pnpm test:docker:live-acp-bind:opencode`)
- Smoke de backend de CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke del arnés app-server de Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desarrollo: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke de observabilidad: `pnpm qa:otel:smoke` es un carril privado de QA para checkout de código fuente. Intencionadamente no forma parte de los carriles Docker de lanzamiento de paquetes porque el tarball de npm omite QA Lab.
- Smoke en vivo de Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Asistente de incorporación (TTY, andamiaje completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke de incorporación/canal/agente con tarball de npm: `pnpm test:docker:npm-onboard-channel-agent` instala el tarball empaquetado de OpenClaw globalmente en Docker, configura OpenAI mediante incorporación con referencia de env más Telegram de forma predeterminada, verifica que doctor repare las dependencias de runtime del Plugin activado y ejecuta un turno simulado de agente de OpenAI. Reutiliza un tarball precompilado con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la reconstrucción del host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` o cambia el canal con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke de cambio de canal de actualización: `pnpm test:docker:update-channel-switch` instala el tarball empaquetado de OpenClaw globalmente en Docker, cambia de paquete `stable` a git `dev`, verifica el canal persistido y que el Plugin funcione tras la actualización, luego vuelve a cambiar al paquete `stable` y comprueba el estado de actualización.
- Smoke de supervivencia de actualización: `pnpm test:docker:upgrade-survivor` instala el tarball empaquetado de OpenClaw sobre un fixture sucio de usuario antiguo con agentes, configuración de canal, listas de permisos de Plugin, estado obsoleto de dependencias de runtime de Plugin y archivos existentes de workspace/sesión. Ejecuta actualización de paquete más doctor no interactivo sin proveedor en vivo ni claves de canal, luego inicia un Gateway de loopback y comprueba la preservación de configuración/estado más los presupuestos de arranque/estado.
- Smoke de supervivencia de actualización publicada: `pnpm test:docker:published-upgrade-survivor` instala `openclaw@latest` de forma predeterminada, siembra archivos realistas de usuario existente, configura esa línea base con una receta de comandos integrada, valida la configuración resultante, actualiza esa instalación publicada al tarball candidato, ejecuta doctor no interactivo, escribe `.artifacts/upgrade-survivor/summary.json`, luego inicia un Gateway de loopback y comprueba intents configurados, preservación de estado, arranque y presupuestos de estado. Sobrescribe la línea base con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`; Package Acceptance expone el mismo valor como `published_upgrade_survivor_baseline`.
- Smoke de contexto de runtime de sesión: `pnpm test:docker:session-runtime-context` verifica la persistencia oculta de transcripción de contexto de runtime más la reparación por doctor de ramas duplicadas afectadas de prompt-rewrite.
- Smoke de instalación global con Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empaqueta el árbol actual, lo instala con `bun install -g` en un home aislado y verifica que `openclaw infer image providers --json` devuelva proveedores de imagen incluidos en lugar de colgarse. Reutiliza un tarball precompilado con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la compilación del host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` o copia `dist/` desde una imagen Docker compilada con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke de Docker para instalador: `bash scripts/test-install-sh-docker.sh` comparte una caché de npm entre sus contenedores root, update y direct-npm. El smoke de actualización usa por defecto npm `latest` como línea base estable antes de actualizar al tarball candidato. Sobrescríbelo con `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localmente, o con la entrada `update_baseline_version` del flujo Install Smoke en GitHub. Las comprobaciones del instalador sin root mantienen una caché de npm aislada para que las entradas de caché propiedad de root no oculten el comportamiento de instalación local del usuario. Define `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar la caché root/update/direct-npm en reejecciones locales.
- Install Smoke CI omite la actualización global direct-npm duplicada con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; ejecuta el script localmente sin esa env cuando se necesite cobertura directa de `npm install -g`.
- Smoke de CLI de eliminación de agentes en workspace compartido: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila por defecto la imagen Dockerfile raíz, siembra dos agentes con un workspace en un home de contenedor aislado, ejecuta `agents delete --json` y verifica JSON válido más el comportamiento de workspace retenido. Reutiliza la imagen install-smoke con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Red de Gateway (dos contenedores, autenticación WS + salud): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoke de instantánea CDP de navegador: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila la imagen E2E de código fuente más una capa de Chromium, inicia Chromium con CDP sin procesar, ejecuta `browser doctor --deep` y verifica que las instantáneas de roles CDP cubran URL de enlaces, elementos clicables promovidos por cursor, referencias de iframe y metadatos de frame.
- Regresión de razonamiento mínimo en OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) ejecuta un servidor OpenAI simulado a través de Gateway, verifica que `web_search` eleve `reasoning.effort` de `minimal` a `low`, luego fuerza el rechazo del esquema del proveedor y comprueba que el detalle sin procesar aparezca en los logs de Gateway.
- Puente de canal MCP (Gateway sembrado + puente stdio + smoke de frame de notificación sin procesar de Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Herramientas MCP del paquete Pi (servidor MCP stdio real + smoke de permitir/denegar de perfil Pi integrado): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Limpieza MCP de Cron/subagente (Gateway real + desmontaje de hijo MCP stdio tras ejecuciones aisladas de cron y subagente de una sola vez): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke de instalación, instalación/desinstalación kitchen-sink de ClawHub, actualizaciones de marketplace y habilitación/inspección de paquete Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Define `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para omitir el bloque de ClawHub, o sobrescribe el par paquete/runtime kitchen-sink predeterminado con `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` y `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sin `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, la prueba usa un servidor fixture local hermético de ClawHub.
- Smoke de actualización de Plugin sin cambios: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke de metadatos de recarga de configuración: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Dependencias de runtime de Plugin incluido: `pnpm test:docker:bundled-channel-deps` compila por defecto una imagen pequeña de runner Docker, compila y empaqueta OpenClaw una vez en el host, y luego monta ese tarball en cada escenario de instalación Linux. Reutiliza la imagen con `OPENCLAW_SKIP_DOCKER_BUILD=1`, omite la reconstrucción del host tras una compilación local reciente con `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` o apunta a un tarball existente con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. El agregado Docker completo y los fragmentos bundled-channel de la ruta de lanzamiento preempaquetan este tarball una vez y luego fragmentan las comprobaciones de canal incluido en carriles independientes, incluidos carriles de actualización separados para Telegram, Discord, Slack, Feishu, memory-lancedb y ACPX. Los fragmentos de lanzamiento dividen smokes de canal, destinos de actualización y contratos de setup/runtime en `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` y `bundled-channels-contracts`; el fragmento agregado `bundled-channels` sigue disponible para reejecciones manuales. El flujo de lanzamiento también divide fragmentos de instalador de proveedor y fragmentos de instalación/desinstalación de Plugin incluido; los fragmentos heredados `package-update`, `plugins-runtime` y `plugins-integrations` siguen siendo alias agregados para reejecciones manuales. Usa `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` para acotar la matriz de canales al ejecutar directamente el carril incluido, o `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` para acotar el escenario de actualización. Las ejecuciones Docker por escenario usan por defecto `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; el escenario de actualización multidestino usa por defecto `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. El carril también verifica que `channels.<id>.enabled=false` y `plugins.entries.<id>.enabled=false` supriman la reparación de dependencias doctor/runtime.
- Acota las dependencias de runtime de Plugin incluido al iterar desactivando escenarios no relacionados, por ejemplo:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Para precompilar y reutilizar manualmente la imagen funcional compartida:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Las sobrescrituras de imagen específicas de suite, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, siguen teniendo prioridad cuando se definen. Cuando `OPENCLAW_SKIP_DOCKER_BUILD=1` apunta a una imagen compartida remota, los scripts la descargan si aún no está local. Las pruebas Docker de QR e instalador conservan sus propios Dockerfiles porque validan el comportamiento de paquete/instalación en lugar del runtime de app compilada compartida.

Los ejecutores Docker de modelos en vivo también montan con bind el checkout actual como solo lectura y lo preparan en un directorio de trabajo temporal dentro del contenedor. Esto mantiene ligera la imagen de runtime sin dejar de ejecutar Vitest contra tu fuente/configuración local exacta. El paso de preparación omite cachés locales grandes y salidas de compilación de apps como `.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, y directorios de salida `.build` locales de app o de Gradle para que las ejecuciones Docker en vivo no pasen minutos copiando artefactos específicos de la máquina. También establecen `OPENCLAW_SKIP_CHANNELS=1` para que las pruebas en vivo del gateway no inicien workers reales de canales de Telegram/Discord/etc. dentro del contenedor. `test:docker:live-models` todavía ejecuta `pnpm test:live`, así que pasa también `OPENCLAW_LIVE_GATEWAY_*` cuando necesites acotar o excluir la cobertura en vivo del gateway de ese carril Docker. `test:docker:openwebui` es una prueba de compatibilidad de nivel superior: inicia un contenedor de gateway de OpenClaw con los endpoints HTTP compatibles con OpenAI habilitados, inicia un contenedor de Open WebUI fijado contra ese gateway, inicia sesión mediante Open WebUI, verifica que `/api/models` exponga `openclaw/default` y luego envía una solicitud de chat real mediante el proxy `/api/chat/completions` de Open WebUI. La primera ejecución puede ser notablemente más lenta porque Docker puede necesitar descargar la imagen de Open WebUI y Open WebUI puede necesitar terminar su propia configuración de arranque en frío. Este carril espera una clave de modelo en vivo usable, y `OPENCLAW_PROFILE_FILE` (`~/.profile` de forma predeterminada) es la forma principal de proporcionarla en ejecuciones dockerizadas. Las ejecuciones correctas imprimen una pequeña carga JSON como `{ "ok": true, "model": "openclaw/default", ... }`. `test:docker:mcp-channels` es intencionalmente determinista y no necesita una cuenta real de Telegram, Discord ni iMessage. Arranca un contenedor de Gateway precargado, inicia un segundo contenedor que lanza `openclaw mcp serve`, y luego verifica el descubrimiento de conversaciones enrutadas, lecturas de transcripciones, metadatos de adjuntos, comportamiento de la cola de eventos en vivo, enrutamiento de envío saliente y notificaciones de canal + permisos al estilo Claude sobre el puente MCP stdio real. La comprobación de notificaciones inspecciona directamente los frames MCP stdio sin procesar, por lo que la prueba valida lo que el puente emite realmente, no solo lo que una SDK de cliente específica acaba exponiendo. `test:docker:pi-bundle-mcp-tools` es determinista y no necesita una clave de modelo en vivo. Compila la imagen Docker del repo, inicia un servidor de prueba MCP stdio real dentro del contenedor, materializa ese servidor mediante el runtime MCP del paquete Pi integrado, ejecuta la herramienta y luego verifica que `coding` y `messaging` conserven las herramientas `bundle-mcp` mientras `minimal` y `tools.deny: ["bundle-mcp"]` las filtran. `test:docker:cron-mcp-cleanup` es determinista y no necesita una clave de modelo en vivo. Inicia un Gateway precargado con un servidor de prueba MCP stdio real, ejecuta un turno cron aislado y un turno hijo único de `/subagents spawn`, y luego verifica que el proceso hijo MCP salga después de cada ejecución.

Prueba manual de hilo ACP en lenguaje natural (no CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantén este script para flujos de regresión/depuración. Puede volver a necesitarse para validar el enrutamiento de hilos ACP, así que no lo elimines.

Variables de entorno útiles:

- `OPENCLAW_CONFIG_DIR=...` (predeterminado: `~/.openclaw`) montado en `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predeterminado: `~/.openclaw/workspace`) montado en `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predeterminado: `~/.profile`) montado en `/home/node/.profile` y cargado antes de ejecutar pruebas
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar solo variables de entorno cargadas desde `OPENCLAW_PROFILE_FILE`, usando directorios temporales de configuración/espacio de trabajo y sin montajes externos de autenticación de CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predeterminado: `~/.cache/openclaw/docker-cli-tools`) montado en `/home/node/.npm-global` para instalaciones de CLI en caché dentro de Docker
- Los directorios/archivos externos de autenticación de CLI bajo `$HOME` se montan como solo lectura bajo `/host-auth...`, y luego se copian en `/home/node/...` antes de que comiencen las pruebas
  - Directorios predeterminados: `.minimax`
  - Archivos predeterminados: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Las ejecuciones acotadas por proveedor montan solo los directorios/archivos necesarios inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sobrescribe manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, o una lista separada por comas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para acotar la ejecución
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar proveedores dentro del contenedor
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar una imagen `openclaw:local-live` existente en repeticiones que no necesitan una recompilación
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para asegurar que las credenciales provengan del almacén de perfiles (no del entorno)
- `OPENCLAW_OPENWEBUI_MODEL=...` para elegir el modelo expuesto por el gateway para la prueba de Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para sobrescribir el prompt de comprobación de nonce usado por la prueba de Open WebUI
- `OPENWEBUI_IMAGE=...` para sobrescribir la etiqueta fijada de la imagen de Open WebUI

## Saneamiento de docs

Ejecuta las comprobaciones de docs después de editar documentación: `pnpm check:docs`.
Ejecuta la validación completa de anclas de Mintlify cuando también necesites comprobaciones de encabezados dentro de la página: `pnpm docs:check-links:anchors`.

## Regresión sin conexión (apta para CI)

Estas son regresiones de “pipeline real” sin proveedores reales:

- Llamadas a herramientas del Gateway (OpenAI simulado, gateway real + bucle de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Asistente del Gateway (WS `wizard.start`/`wizard.next`, escribe configuración + autenticación aplicada): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evals de confiabilidad de agentes (skills)

Ya tenemos algunas pruebas aptas para CI que se comportan como “evals de confiabilidad de agentes”:

- Llamadas a herramientas simuladas mediante el gateway real + bucle de agente (`src/gateway/gateway.test.ts`).
- Flujos de asistente end-to-end que validan el cableado de sesión y los efectos de configuración (`src/gateway/gateway.test.ts`).

Lo que aún falta para Skills (ver [Skills](/es/tools/skills)):

- **Toma de decisiones:** cuando se listan skills en el prompt, ¿elige el agente la skill correcta (o evita las irrelevantes)?
- **Cumplimiento:** ¿lee el agente `SKILL.md` antes de usarla y sigue los pasos/argumentos requeridos?
- **Contratos de flujo de trabajo:** escenarios multi-turno que afirman el orden de herramientas, la continuidad del historial de sesión y los límites del sandbox.

Las evals futuras deben seguir siendo primero deterministas:

- Un ejecutor de escenarios que use proveedores simulados para afirmar llamadas a herramientas + orden, lecturas de archivos de skills y cableado de sesión.
- Una pequeña suite de escenarios centrados en skills (usar vs evitar, gating, inyección de prompt).
- Evals en vivo opcionales (opt-in, controladas por entorno) solo después de que exista la suite apta para CI.

## Pruebas de contrato (forma de plugin y canal)

Las pruebas de contrato verifican que cada plugin y canal registrado cumpla su contrato de interfaz. Iteran sobre todos los plugins descubiertos y ejecutan una suite de afirmaciones de forma y comportamiento. El carril unitario predeterminado de `pnpm test` omite intencionalmente estos archivos compartidos de seam y smoke; ejecuta explícitamente los comandos de contrato cuando toques superficies compartidas de canal o proveedor.

### Comandos

- Todos los contratos: `pnpm test:contracts`
- Solo contratos de canal: `pnpm test:contracts:channels`
- Solo contratos de proveedor: `pnpm test:contracts:plugins`

### Contratos de canal

Ubicados en `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma básica del plugin (id, nombre, capacidades)
- **setup** - Contrato del asistente de configuración
- **session-binding** - Comportamiento de vinculación de sesión
- **outbound-payload** - Estructura de la carga del mensaje
- **inbound** - Manejo de mensajes entrantes
- **actions** - Manejadores de acciones del canal
- **threading** - Manejo de ID de hilos
- **directory** - API de directorio/lista
- **group-policy** - Aplicación de políticas de grupo

### Contratos de estado de proveedor

Ubicados en `src/plugins/contracts/*.contract.test.ts`.

- **status** - Pruebas de estado de canal
- **registry** - Forma del registro de plugins

### Contratos de proveedor

Ubicados en `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato de flujo de autenticación
- **auth-choice** - Elección/selección de autenticación
- **catalog** - API de catálogo de modelos
- **discovery** - Descubrimiento de plugins
- **loader** - Carga de plugins
- **runtime** - Runtime del proveedor
- **shape** - Forma/interfaz del plugin
- **wizard** - Asistente de configuración

### Cuándo ejecutar

- Después de cambiar exports o subrutas de plugin-sdk
- Después de agregar o modificar un plugin de canal o proveedor
- Después de refactorizar el registro o descubrimiento de plugins

Las pruebas de contrato se ejecutan en CI y no requieren claves de API reales.

## Agregar regresiones (guía)

Cuando arregles un problema de proveedor/modelo descubierto en vivo:

- Agrega una regresión apta para CI si es posible (proveedor simulado/stub, o captura la transformación exacta de la forma de la solicitud)
- Si es inherentemente solo en vivo (límites de tasa, políticas de autenticación), mantén la prueba en vivo acotada y opt-in mediante variables de entorno
- Prefiere apuntar a la capa más pequeña que detecte el bug:
  - bug de conversión/reproducción de solicitud de proveedor → prueba directa de modelos
  - bug de sesión/historial/pipeline de herramientas del gateway → prueba smoke en vivo del gateway o prueba simulada del gateway apta para CI
- Barandilla de recorrido de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un objetivo muestreado por clase de SecretRef desde los metadatos del registro (`listSecretTargetRegistryEntries()`), y luego afirma que se rechazan los ids de ejecución con segmentos de recorrido.
  - Si agregas una nueva familia de objetivos SecretRef `includeInPlan` en `src/secrets/target-registry-data.ts`, actualiza `classifyTargetClass` en esa prueba. La prueba falla intencionalmente con ids de objetivo no clasificados para que las nuevas clases no puedan omitirse silenciosamente.

## Relacionado

- [Pruebas en vivo](/es/help/testing-live)
- [CI](/es/ci)
