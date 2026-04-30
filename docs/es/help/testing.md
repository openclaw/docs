---
read_when:
    - Ejecución de pruebas localmente o en CI
    - Añadir pruebas de regresión para errores de modelos/proveedores
    - Depuración del Gateway + comportamiento del agente
summary: 'Kit de pruebas: suites unitarias/e2e/en vivo, ejecutores de Docker y qué cubre cada prueba'
title: Pruebas
x-i18n:
    generated_at: "2026-04-30T18:38:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 470a96c6b47c2708950d05adc4a4efba5fe290f0675a131e2888d2d0032d5953
    source_path: help/testing.md
    workflow: 16
---

OpenClaw tiene tres conjuntos de pruebas Vitest (unitarias/integración, e2e, en vivo) y un pequeño conjunto
de ejecutores Docker. Este documento es una guía de "cómo probamos":

- Qué cubre cada conjunto de pruebas (y qué deliberadamente _no_ cubre).
- Qué comandos ejecutar para flujos de trabajo comunes (local, antes de push, depuración).
- Cómo las pruebas en vivo descubren credenciales y seleccionan modelos/proveedores.
- Cómo añadir regresiones para problemas reales de modelos/proveedores.

<Note>
**La pila de QA (qa-lab, qa-channel, lanes de transporte en vivo)** se documenta por separado:

- [Resumen de QA](/es/concepts/qa-e2e-automation) — arquitectura, superficie de comandos, creación de escenarios.
- [QA de matriz](/es/concepts/qa-matrix) — referencia para `pnpm openclaw qa matrix`.
- [Canal de QA](/es/channels/qa-channel) — el Plugin de transporte sintético usado por escenarios respaldados por el repo.

Esta página cubre la ejecución de los conjuntos de pruebas regulares y los ejecutores Docker/Parallels. La sección de ejecutores específicos de QA a continuación ([Ejecutores específicos de QA](#qa-specific-runners)) enumera las invocaciones `qa` concretas y remite a las referencias anteriores.
</Note>

## Inicio rápido

La mayoría de los días:

- Validación completa (esperada antes de push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Ejecución local más rápida de todo el conjunto en una máquina amplia: `pnpm test:max`
- Bucle directo de observación de Vitest: `pnpm test:watch`
- La selección directa de archivos ahora también enruta rutas de extensiones/canales: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefiere primero ejecuciones dirigidas cuando estés iterando sobre un único fallo.
- Sitio de QA respaldado por Docker: `pnpm qa:lab:up`
- Lane de QA respaldada por VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Cuando toques pruebas o quieras confianza adicional:

- Validación de cobertura: `pnpm test:coverage`
- Conjunto e2e: `pnpm test:e2e`

Al depurar proveedores/modelos reales (requiere credenciales reales):

- Conjunto en vivo (modelos + sondeos de herramienta/imagen de Gateway): `pnpm test:live`
- Seleccionar un archivo en vivo en silencio: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Barrido de modelos en vivo con Docker: `pnpm test:docker:live-models`
  - Cada modelo seleccionado ahora ejecuta un turno de texto más un pequeño sondeo de estilo lectura de archivo.
    Los modelos cuyos metadatos anuncian entrada `image` también ejecutan un turno diminuto de imagen.
    Desactiva los sondeos adicionales con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` al aislar fallos de proveedor.
  - Cobertura de CI: tanto `OpenClaw Scheduled Live And E2E Checks` diario como
    `OpenClaw Release Checks` manual llaman al flujo reutilizable en vivo/e2e con
    `include_live_suites: true`, lo que incluye trabajos de matriz de modelos
    en vivo de Docker separados y fragmentados por proveedor.
  - Para reejecuciones enfocadas de CI, despacha `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` y `live_models_only: true`.
  - Añade nuevos secretos de proveedor de alta señal a `scripts/ci-hydrate-live-auth.sh`
    más `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` y sus
    llamadores programados/de lanzamiento.
- Smoke nativo de chat vinculado de Codex: `pnpm test:docker:live-codex-bind`
  - Ejecuta una lane en vivo de Docker contra la ruta del servidor de aplicación de Codex, vincula un
    DM sintético de Slack con `/codex bind`, ejercita `/codex fast` y
    `/codex permissions`, y luego verifica que una respuesta simple y un adjunto de imagen
    se enruten por el enlace nativo del Plugin en vez de ACP.
- Smoke del arnés del servidor de aplicación de Codex: `pnpm test:docker:live-codex-harness`
  - Ejecuta turnos del agente de Gateway a través del arnés del servidor de aplicación de Codex propiedad del Plugin,
    verifica `/codex status` y `/codex models`, y por defecto ejercita sondeos de imagen,
    MCP de Cron, subagente y Guardian. Desactiva el sondeo de subagente con
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` al aislar otros fallos del
    servidor de aplicación de Codex. Para una comprobación enfocada del subagente, desactiva los otros sondeos:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Esto sale después del sondeo de subagente a menos que
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` esté establecido.
- Smoke del comando de rescate de Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Comprobación opcional de defensa adicional para la superficie del comando de rescate del canal de mensajes.
    Ejercita `/crestodian status`, encola un cambio persistente de modelo,
    responde `/crestodian yes` y verifica la ruta de escritura de auditoría/configuración.
- Smoke Docker del planificador de Crestodian: `pnpm test:docker:crestodian-planner`
  - Ejecuta Crestodian en un contenedor sin configuración con una CLI falsa de Claude en `PATH`
    y verifica que el respaldo del planificador difuso se traduzca en una escritura tipada
    de configuración auditada.
- Smoke Docker de primera ejecución de Crestodian: `pnpm test:docker:crestodian-first-run`
  - Parte de un directorio de estado vacío de OpenClaw, enruta `openclaw` sin argumentos a
    Crestodian, aplica escrituras de configuración/modelo/agente/Plugin de Discord + SecretRef,
    valida la configuración y verifica entradas de auditoría. La misma ruta de configuración Ring 0
    también está cubierta en QA Lab por
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de coste Moonshot/Kimi: con `MOONSHOT_API_KEY` establecido, ejecuta
  `openclaw models list --provider moonshot --json`, luego ejecuta un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  aislado contra `moonshot/kimi-k2.6`. Verifica que el JSON informe Moonshot/K2.6 y que la
  transcripción del asistente almacene `usage.cost` normalizado.

<Tip>
Cuando solo necesites un caso que falla, prefiere acotar las pruebas en vivo mediante las variables de entorno de lista de permitidos descritas abajo.
</Tip>

## Ejecutores específicos de QA

Estos comandos acompañan a los conjuntos de pruebas principales cuando necesitas realismo de QA Lab:

CI ejecuta QA Lab en flujos dedicados. `Parity gate` se ejecuta en PRs coincidentes y
desde despacho manual con proveedores simulados. `QA-Lab - All Lanes` se ejecuta cada noche en
`main` y desde despacho manual con la validación de paridad simulada, la lane de Matrix en vivo,
la lane de Telegram en vivo gestionada por Convex y la lane de Discord en vivo gestionada por Convex como
trabajos paralelos. Las comprobaciones programadas de QA y de lanzamiento pasan Matrix `--profile fast`
explícitamente, mientras que la CLI de Matrix y la entrada predeterminada del flujo manual siguen siendo
`all`; el despacho manual puede fragmentar `all` en trabajos `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` y `e2ee-cli`. `OpenClaw Release Checks` ejecuta paridad más
las lanes rápidas de Matrix y Telegram antes de la aprobación del lanzamiento, usando
`mock-openai/gpt-5.5` para comprobaciones de transporte de lanzamiento, de modo que sigan siendo deterministas
y eviten el inicio normal del Plugin de proveedor. Estos Gateways de transporte en vivo desactivan
la búsqueda de memoria; el comportamiento de memoria sigue cubierto por los conjuntos de paridad de QA.

Los fragmentos de medios en vivo de lanzamiento completo usan
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, que ya tiene
`ffmpeg` y `ffprobe`. Los fragmentos de modelos/backends en vivo de Docker usan la imagen compartida
`ghcr.io/openclaw/openclaw-live-test:<sha>` construida una vez por cada
commit seleccionado, luego la descargan con `OPENCLAW_SKIP_DOCKER_BUILD=1` en vez de reconstruirla
dentro de cada fragmento.

- `pnpm openclaw qa suite`
  - Ejecuta escenarios de QA respaldados por el repo directamente en el host.
  - Ejecuta varios escenarios seleccionados en paralelo por defecto con trabajadores
    de Gateway aislados. `qa-channel` usa concurrencia 4 por defecto (limitada por el
    recuento de escenarios seleccionados). Usa `--concurrency <count>` para ajustar el recuento
    de trabajadores, o `--concurrency 1` para la lane serial anterior.
  - Sale con código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
    quieras artefactos sin un código de salida fallido.
  - Admite modos de proveedor `live-frontier`, `mock-openai` y `aimock`.
    `aimock` inicia un servidor de proveedor local respaldado por AIMock para cobertura experimental
    de fixtures y simulación de protocolo sin reemplazar la lane `mock-openai`
    consciente del escenario.
- `pnpm test:gateway:cpu-scenarios`
  - Ejecuta el banco de inicio de Gateway más un pequeño paquete de escenarios simulados de QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) y escribe un resumen combinado de observaciones de CPU
    bajo `.artifacts/gateway-cpu-scenarios/`.
  - Marca solo observaciones de CPU caliente sostenida por defecto (`--cpu-core-warn`
    más `--hot-wall-warn-ms`), por lo que los estallidos breves de inicio se registran como métricas
    sin parecerse a la regresión de Gateway fijado durante minutos.
  - Usa artefactos `dist` construidos; ejecuta una build primero cuando el checkout no
    tenga ya salida de runtime fresca.
- `pnpm openclaw qa suite --runner multipass`
  - Ejecuta el mismo conjunto de QA dentro de una VM Linux desechable de Multipass.
  - Conserva el mismo comportamiento de selección de escenarios que `qa suite` en el host.
  - Reutiliza los mismos flags de selección de proveedor/modelo que `qa suite`.
  - Las ejecuciones en vivo reenvían las entradas de autenticación de QA admitidas que son prácticas para el invitado:
    claves de proveedor basadas en env, la ruta de configuración del proveedor en vivo de QA y `CODEX_HOME`
    cuando está presente.
  - Los directorios de salida deben permanecer bajo la raíz del repo para que el invitado pueda escribir de vuelta a través
    del espacio de trabajo montado.
  - Escribe el informe + resumen normal de QA más logs de Multipass bajo
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia el sitio de QA respaldado por Docker para trabajo de QA de estilo operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Construye un tarball npm desde el checkout actual, lo instala globalmente en
    Docker, ejecuta onboarding no interactivo con clave de API de OpenAI, configura Telegram
    por defecto, verifica que habilitar el Plugin instale dependencias de runtime
    bajo demanda, ejecuta doctor y ejecuta un turno de agente local contra un endpoint de OpenAI
    simulado.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para ejecutar la misma lane de instalación empaquetada
    con Discord.
- `pnpm test:docker:session-runtime-context`
  - Ejecuta un smoke Docker determinista de app construida para transcripciones de contexto de runtime
    incrustado. Verifica que el contexto oculto de runtime de OpenClaw se persista como un
    mensaje personalizado no visible en vez de filtrarse al turno visible del usuario,
    luego siembra un JSONL de sesión rota afectada y verifica que
    `openclaw doctor --fix` lo reescriba a la rama activa con una copia de seguridad.
- `pnpm test:docker:npm-telegram-live`
  - Instala un paquete candidato de OpenClaw en Docker, ejecuta onboarding de paquete instalado,
    configura Telegram mediante la CLI instalada y luego reutiliza la
    lane de QA de Telegram en vivo con ese paquete instalado como Gateway SUT.
  - Usa `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` por defecto; establece
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` o
    `OPENCLAW_CURRENT_PACKAGE_TGZ` para probar un tarball local resuelto en vez de
    instalar desde el registro.
  - Usa las mismas credenciales env de Telegram o fuente de credenciales Convex que
    `pnpm openclaw qa telegram`. Para automatización de CI/lanzamiento, establece
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` más
    `OPENCLAW_QA_CONVEX_SITE_URL` y el secreto de rol. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` y un secreto de rol de Convex están presentes en CI,
    el contenedor Docker selecciona Convex automáticamente.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sobrescribe el
    `OPENCLAW_QA_CREDENTIAL_ROLE` compartido solo para esta lane.
  - GitHub Actions expone esta lane como el flujo manual de mantenedor
    `NPM Telegram Beta E2E`. No se ejecuta al fusionar. El flujo usa el
    entorno `qa-live-shared` y arriendos de credenciales CI de Convex.
- GitHub Actions también expone `Package Acceptance` para prueba de producto en ejecución lateral
  contra un paquete candidato. Acepta una ref confiable, especificación npm publicada,
  URL HTTPS de tarball más SHA-256, o artefacto de tarball de otra ejecución, sube
  el `openclaw-current.tgz` normalizado como `package-under-test`, luego ejecuta el
  planificador Docker e2e existente con perfiles de lane smoke, paquete, producto, completo o personalizado.
  Establece `telegram_mode=mock-openai` o `live-frontier` para ejecutar el
  flujo de QA de Telegram contra el mismo artefacto `package-under-test`.
  - Prueba de producto de la beta más reciente:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- La prueba de URL exacta de tarball requiere un digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- La prueba de artefacto descarga un artefacto tarball desde otra ejecución de Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Empaqueta e instala la compilación actual de OpenClaw en Docker, inicia el Gateway
    con OpenAI configurado y luego habilita los canales/plugins incluidos mediante
    ediciones de configuración.
  - Verifica que el descubrimiento de configuración deje ausentes las dependencias
    de runtime de plugins no configuradas, que la primera ejecución configurada del Gateway
    o de doctor instale bajo demanda las dependencias de runtime de cada plugin
    incluido, y que un segundo reinicio no reinstale dependencias que ya fueron activadas.
  - También instala una línea base npm anterior conocida, habilita Telegram antes de ejecutar
    `openclaw update --tag <candidate>`, y verifica que el doctor posterior a la actualización
    del candidato repare las dependencias de runtime de canales incluidos sin una
    reparación postinstall del lado del harness.
- `pnpm test:parallels:npm-update`
  - Ejecuta el smoke de actualización de instalación empaquetada nativa en invitados Parallels. Cada
    plataforma seleccionada primero instala el paquete de línea base solicitado, luego ejecuta
    el comando `openclaw update` instalado en el mismo invitado y verifica la
    versión instalada, el estado de actualización, la disponibilidad del gateway y un turno de agente
    local.
  - Usa `--platform macos`, `--platform windows` o `--platform linux` mientras
    iteras en un invitado. Usa `--json` para la ruta del artefacto de resumen y
    el estado por carril.
  - El carril de OpenAI usa `openai/gpt-5.5` para la prueba de turno de agente en vivo de forma
    predeterminada. Pasa `--model <provider/model>` o define
    `OPENCLAW_PARALLELS_OPENAI_MODEL` cuando valides deliberadamente otro
    modelo de OpenAI.
  - Envuelve las ejecuciones locales largas en un timeout de host para que los bloqueos del transporte de Parallels no
    consuman el resto de la ventana de pruebas:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - El script escribe logs de carriles anidados en `/tmp/openclaw-parallels-npm-update.*`.
    Inspecciona `windows-update.log`, `macos-update.log` o `linux-update.log`
    antes de asumir que el wrapper externo está colgado.
  - La actualización de Windows puede pasar entre 10 y 15 minutos en la reparación de doctor/runtime
    posterior a la actualización en un invitado frío; eso sigue siendo saludable cuando el log
    de depuración npm anidado avanza.
  - No ejecutes este wrapper agregado en paralelo con carriles smoke individuales de Parallels
    para macOS, Windows o Linux. Comparten estado de VM y pueden colisionar en
    la restauración de snapshots, el servicio de paquetes o el estado del gateway invitado.
  - La prueba posterior a la actualización ejecuta la superficie normal de plugins incluidos porque
    las fachadas de capacidades como voz, generación de imágenes y comprensión
    de medios se cargan mediante APIs de runtime incluidas incluso cuando el turno
    de agente en sí solo comprueba una respuesta de texto simple.

- `pnpm openclaw qa aimock`
  - Inicia solo el servidor proveedor local AIMock para pruebas smoke directas
    del protocolo.
- `pnpm openclaw qa matrix`
  - Ejecuta el carril de QA en vivo de Matrix contra un homeserver Tuwunel desechable respaldado por Docker. Solo checkout de código fuente; las instalaciones empaquetadas no incluyen `qa-lab`.
  - CLI completa, catálogo de perfiles/escenarios, variables de entorno y disposición de artefactos: [QA de Matrix](/es/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Ejecuta el carril de QA en vivo de Telegram contra un grupo privado real usando los tokens del bot controlador y del bot SUT desde el entorno.
  - Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. El id de grupo debe ser el id numérico del chat de Telegram.
  - Admite `--credential-source convex` para credenciales compartidas agrupadas. Usa el modo env de forma predeterminada, o define `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases agrupados.
  - Sale con código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
    quieras artefactos sin un código de salida fallido.
  - Requiere dos bots distintos en el mismo grupo privado, con el bot SUT exponiendo un nombre de usuario de Telegram.
  - Para una observación estable de bot a bot, habilita Bot-to-Bot Communication Mode en `@BotFather` para ambos bots y asegúrate de que el bot controlador pueda observar el tráfico de bots del grupo.
  - Escribe un informe de QA de Telegram, un resumen y un artefacto de mensajes observados en `.artifacts/qa-e2e/...`. Los escenarios de respuesta incluyen RTT desde la solicitud de envío del controlador hasta la respuesta SUT observada.

Los carriles de transporte en vivo comparten un contrato estándar para que los transportes nuevos no diverjan; la matriz de cobertura por carril vive en [Resumen de QA → Cobertura de transporte en vivo](/es/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` es la suite sintética amplia y no forma parte de esa matriz.

### Credenciales compartidas de Telegram mediante Convex (v1)

Cuando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
`openclaw qa telegram`, QA lab adquiere un lease exclusivo desde un pool respaldado por Convex, envía heartbeats
para ese lease mientras el carril se ejecuta y libera el lease al apagarse.

Scaffold de referencia del proyecto Convex:

- `qa/convex-credential-broker/`

Variables de entorno requeridas:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por ejemplo `https://your-deployment.convex.site`)
- Un secreto para el rol seleccionado:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Selección de rol de credenciales:
  - CLI: `--credential-role maintainer|ci`
  - Valor predeterminado de entorno: `OPENCLAW_QA_CREDENTIAL_ROLE` (por defecto `ci` en CI, `maintainer` en caso contrario)

Variables de entorno opcionales:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predeterminado `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predeterminado `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predeterminado `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predeterminado `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predeterminado `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de traza opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs de Convex `http://` de local loopback para desarrollo solo local.

`OPENCLAW_QA_CONVEX_SITE_URL` debería usar `https://` en operación normal.

Los comandos de administración de mantenedor (agregar/eliminar/listar pool) requieren
específicamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Ayudantes de CLI para mantenedores:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `doctor` antes de ejecuciones en vivo para comprobar la URL del sitio Convex, los secretos del broker,
el prefijo de endpoint, el timeout HTTP y la disponibilidad de admin/list sin imprimir
valores secretos. Usa `--json` para salida legible por máquinas en scripts y utilidades
de CI.

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

Forma de payload para el tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` debe ser una cadena de id numérico de chat de Telegram.
- `admin/add` valida esta forma para `kind: "telegram"` y rechaza payloads malformados.

### Agregar un canal a QA

La arquitectura y los nombres de ayudantes de escenario para adaptadores de canal nuevos viven en [Resumen de QA → Agregar un canal](/es/concepts/qa-e2e-automation#adding-a-channel). El mínimo requerido: implementar el runner de transporte en la seam de host compartida `qa-lab`, declarar `qaRunners` en el manifiesto del plugin, montar como `openclaw qa <runner>` y crear escenarios en `qa/scenarios/`.

## Suites de prueba (qué se ejecuta dónde)

Piensa en las suites como “realismo creciente” (y mayor costo/inestabilidad):

### Unitarias / integración (predeterminado)

- Comando: `pnpm test`
- Configuración: las ejecuciones no dirigidas usan el conjunto de shards `vitest.full-*.config.ts` y pueden expandir shards multiproyecto en configuraciones por proyecto para la programación paralela
- Archivos: inventarios core/unit en `src/**/*.test.ts`, `packages/**/*.test.ts` y `test/**/*.test.ts`; las pruebas unitarias de UI se ejecutan en el shard dedicado `unit-ui`
- Alcance:
  - Pruebas unitarias puras
  - Pruebas de integración en proceso (autenticación de gateway, enrutamiento, tooling, análisis, configuración)
  - Regresiones deterministas para errores conocidos
- Expectativas:
  - Se ejecuta en CI
  - No requiere claves reales
  - Debería ser rápido y estable
  - Las pruebas de resolver y cargador de superficie pública deben probar el comportamiento amplio de fallback de `api.js` y
    `runtime-api.js` con fixtures de plugins diminutos generados, no con
    APIs fuente reales de plugins incluidos. Las cargas reales de API de plugins pertenecen a
    suites de contrato/integración propiedad del plugin.

<AccordionGroup>
  <Accordion title="Proyectos, shards y carriles con alcance">

    - `pnpm test` sin objetivo ejecuta doce configuraciones de fragmentos más pequeñas (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) en lugar de un único proceso gigante de proyecto raíz nativo. Esto reduce el RSS máximo en máquinas con carga y evita que el trabajo de auto-reply/extensiones deje sin recursos a suites no relacionadas.
    - `pnpm test --watch` sigue usando el grafo de proyectos raíz nativo de `vitest.config.ts`, porque un bucle de observación con varios fragmentos no es práctico.
    - `pnpm test`, `pnpm test:watch` y `pnpm test:perf:imports` enrutan primero los objetivos explícitos de archivo/directorio por carriles con alcance, así que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar el coste completo de arranque del proyecto raíz.
    - `pnpm test:changed` expande por defecto las rutas de git cambiadas en carriles con alcance baratos: ediciones directas de pruebas, archivos `*.test.ts` hermanos, asignaciones explícitas de código fuente y dependientes locales del grafo de importación. Las ediciones de configuración/preparación/paquetes no ejecutan pruebas amplias salvo que uses explícitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` es la puerta normal de comprobación local inteligente para trabajo acotado. Clasifica el diff en núcleo, pruebas del núcleo, extensiones, pruebas de extensiones, apps, documentación, metadatos de lanzamiento, herramientas live Docker y tooling, y luego ejecuta los comandos de typecheck, lint y guard correspondientes. No ejecuta pruebas de Vitest; llama a `pnpm test:changed` o a un `pnpm test <target>` explícito para prueba de tests. Los incrementos de versión solo de metadatos de lanzamiento ejecutan comprobaciones dirigidas de versión/configuración/dependencias raíz, con un guard que rechaza cambios de paquetes fuera del campo de versión de nivel superior.
    - Las ediciones del arnés live Docker ACP ejecutan comprobaciones enfocadas: sintaxis de shell para los scripts de autenticación live Docker y una simulación del planificador live Docker. Los cambios en `package.json` se incluyen solo cuando el diff se limita a `scripts["test:docker:live-*"]`; las ediciones de dependencias, exportaciones, versiones y otras superficies de paquete siguen usando los guards más amplios.
    - Las pruebas unitarias ligeras de importaciones de agentes, comandos, plugins, helpers de auto-reply, `plugin-sdk` y áreas similares de utilidades puras se enrutan por el carril `unit-fast`, que omite `test/setup-openclaw-runtime.ts`; los archivos con estado o pesados de runtime permanecen en los carriles existentes.
    - Algunos archivos fuente helper de `plugin-sdk` y `commands` también asignan las ejecuciones en modo cambiado a pruebas hermanas explícitas en esos carriles ligeros, así que las ediciones de helpers evitan volver a ejecutar toda la suite pesada de ese directorio.
    - `auto-reply` tiene buckets dedicados para helpers de núcleo de nivel superior, pruebas de integración `reply.*` de nivel superior y el subárbol `src/auto-reply/reply/**`. CI divide además el subárbol de respuestas en fragmentos de agent-runner, dispatch y commands/state-routing para que un bucket pesado en importaciones no posea toda la cola de Node.
    - La CI normal de PR/main omite intencionadamente el barrido por lotes de extensiones y el fragmento solo de lanzamiento `agentic-plugins`. Full Release Validation despacha el workflow hijo separado `Plugin Prerelease` para esas suites pesadas en plugins/extensiones en candidatos de lanzamiento.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Cuando cambies las entradas de descubrimiento de herramientas de mensajes o el contexto
      de runtime de compaction, mantén ambos niveles de cobertura.
    - Añade regresiones enfocadas de helpers para límites puros de enrutamiento y normalización.
    - Mantén sanas las suites de integración del runner embebido:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` y
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Esas suites verifican que los ids con alcance y el comportamiento de compaction sigan fluyendo
      por las rutas reales de `run.ts` / `compact.ts`; las pruebas solo de helpers no son
      un sustituto suficiente de esas rutas de integración.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - La configuración base de Vitest usa `threads` por defecto.
    - La configuración compartida de Vitest fija `isolate: false` y usa el
      runner no aislado en los proyectos raíz, e2e y configuraciones live.
    - El carril raíz de UI mantiene su configuración y optimizador de `jsdom`, pero también se ejecuta en el
      runner compartido no aislado.
    - Cada fragmento de `pnpm test` hereda los mismos valores por defecto de `threads` + `isolate: false`
      desde la configuración compartida de Vitest.
    - `scripts/run-vitest.mjs` añade `--no-maglev` por defecto para los procesos Node hijos
      de Vitest a fin de reducir la rotación de compilación de V8 durante grandes ejecuciones locales.
      Configura `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar contra el comportamiento estándar de V8.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` muestra qué carriles arquitectónicos activa un diff.
    - El hook de pre-commit solo da formato. Vuelve a preparar los archivos formateados y
      no ejecuta lint, typecheck ni pruebas.
    - Ejecuta `pnpm check:changed` explícitamente antes del handoff o push cuando
      necesites la puerta de comprobación local inteligente.
    - `pnpm test:changed` se enruta por carriles con alcance baratos por defecto. Usa
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el agente
      decida que una edición de arnés, configuración, paquete o contrato necesita de verdad una cobertura
      de Vitest más amplia.
    - `pnpm test:max` y `pnpm test:changed:max` mantienen el mismo comportamiento
      de enrutamiento, solo con un límite de workers más alto.
    - El autoescalado local de workers es intencionadamente conservador y retrocede
      cuando el promedio de carga del host ya es alto, así que varias ejecuciones simultáneas
      de Vitest causan menos daño por defecto.
    - La configuración base de Vitest marca los proyectos/archivos de configuración como
      `forceRerunTriggers` para que las reejecuciones en modo cambiado sigan siendo correctas cuando cambia el
      cableado de pruebas.
    - La configuración mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado en hosts compatibles;
      configura `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si quieres
      una ubicación de caché explícita para perfilado directo.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` habilita el reporte de duración de importaciones de Vitest más
      la salida de desglose de importaciones.
    - `pnpm test:perf:imports:changed` acota la misma vista de perfilado a
      archivos cambiados desde `origin/main`.
    - Los datos de tiempos de fragmentos se escriben en `.artifacts/vitest-shard-timings.json`.
      Las ejecuciones de configuración completa usan la ruta de configuración como clave; los fragmentos de CI
      con patrones de inclusión añaden el nombre del fragmento para que los fragmentos filtrados puedan rastrearse
      por separado.
    - Cuando una prueba caliente sigue dedicando la mayor parte de su tiempo a importaciones de arranque,
      mantén las dependencias pesadas detrás de una superficie local estrecha `*.runtime.ts` y
      simula esa superficie directamente en lugar de hacer importaciones profundas de helpers de runtime solo
      para pasarlos por `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara el
      `test:changed` enrutado contra la ruta nativa del proyecto raíz para ese diff confirmado
      e imprime el tiempo de reloj más el RSS máximo en macOS.
    - `pnpm test:perf:changed:bench -- --worktree` mide el árbol sucio actual
      enrutando la lista de archivos cambiados por
      `scripts/test-projects.mjs` y la configuración raíz de Vitest.
    - `pnpm test:perf:profile:main` escribe un perfil de CPU del hilo principal para
      el arranque de Vitest/Vite y el overhead de transformaciones.
    - `pnpm test:perf:profile:runner` escribe perfiles de CPU+heap del runner para la
      suite unitaria con el paralelismo de archivos deshabilitado.

  </Accordion>
</AccordionGroup>

### Estabilidad (gateway)

- Comando: `pnpm test:stability:gateway`
- Configuración: `vitest.gateway.config.ts`, forzada a un worker
- Alcance:
  - Inicia un Gateway de loopback real con diagnósticos habilitados por defecto
  - Impulsa rotación sintética de mensajes de gateway, memoria y cargas grandes por la ruta de eventos de diagnóstico
  - Consulta `diagnostics.stability` mediante el RPC WS del Gateway
  - Cubre helpers de persistencia del paquete de estabilidad de diagnósticos
  - Afirma que el grabador permanece acotado, que las muestras sintéticas de RSS se mantienen bajo el presupuesto de presión y que las profundidades de cola por sesión vuelven a cero
- Expectativas:
  - Seguro para CI y sin claves
  - Carril estrecho para seguimiento de regresiones de estabilidad, no un sustituto de la suite completa de Gateway

### E2E (smoke de gateway)

- Comando: `pnpm test:e2e`
- Configuración: `vitest.e2e.config.ts`
- Archivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` y pruebas E2E de plugins incluidos bajo `extensions/`
- Valores por defecto de runtime:
  - Usa `threads` de Vitest con `isolate: false`, igual que el resto del repositorio.
  - Usa workers adaptativos (CI: hasta 2, local: 1 por defecto).
  - Se ejecuta en modo silencioso por defecto para reducir el overhead de E/S de consola.
- Sobrescrituras útiles:
  - `OPENCLAW_E2E_WORKERS=<n>` para forzar la cantidad de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para volver a habilitar la salida de consola detallada.
- Alcance:
  - Comportamiento end-to-end de gateway multiinstancia
  - Superficies WebSocket/HTTP, emparejamiento de nodos y redes más pesadas
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
  - Ejercita el backend OpenShell de OpenClaw mediante `sandbox ssh-config` real + ejecución SSH
  - Verifica el comportamiento del sistema de archivos canónico remoto mediante el puente fs del sandbox
- Expectativas:
  - Solo opt-in; no forma parte de la ejecución por defecto de `pnpm test:e2e`
  - Requiere una CLI local `openshell` más un demonio Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` aislados y luego destruye el gateway de prueba y el sandbox
- Sobrescrituras útiles:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar la prueba al ejecutar manualmente la suite e2e más amplia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apuntar a un binario de CLI o script wrapper no predeterminado

### Live (proveedores reales + modelos reales)

- Comando: `pnpm test:live`
- Configuración: `vitest.live.config.ts`
- Archivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` y pruebas live de plugins incluidos bajo `extensions/`
- Predeterminado: **habilitado** por `pnpm test:live` (configura `OPENCLAW_LIVE_TEST=1`)
- Alcance:
  - “¿Este proveedor/modelo funciona realmente _hoy_ con credenciales reales?”
  - Detectar cambios de formato de proveedores, particularidades de llamada a herramientas, problemas de autenticación y comportamiento de límites de tasa
- Expectativas:
  - No es estable para CI por diseño (redes reales, políticas reales de proveedores, cuotas, interrupciones)
  - Cuesta dinero / usa límites de tasa
  - Prefiere ejecutar subconjuntos acotados en lugar de “todo”
- Las ejecuciones live cargan `~/.profile` para recoger claves de API faltantes.
- Por defecto, las ejecuciones live todavía aíslan `HOME` y copian material de configuración/autenticación a un home temporal de prueba para que las fixtures unitarias no puedan mutar tu `~/.openclaw` real.
- Configura `OPENCLAW_LIVE_USE_REAL_HOME=1` solo cuando necesites intencionadamente que las pruebas live usen tu directorio home real.
- `pnpm test:live` ahora usa por defecto un modo más silencioso: mantiene la salida de progreso `[live] ...`, pero suprime el aviso extra de `~/.profile` y silencia los logs de arranque del gateway/ruido de Bonjour. Configura `OPENCLAW_LIVE_TEST_QUIET=0` si quieres recuperar todos los logs de arranque.
- Rotación de claves de API (específica por proveedor): configura `*_API_KEYS` con formato de comas/punto y coma o `*_API_KEY_1`, `*_API_KEY_2` (por ejemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) o una sobrescritura por live mediante `OPENCLAW_LIVE_*_KEY`; las pruebas reintentan ante respuestas de límite de tasa.
- Salida de progreso/heartbeat:
  - Las suites live ahora emiten líneas de progreso a stderr para que las llamadas largas a proveedores se vean activas incluso cuando la captura de consola de Vitest está silenciosa.
  - `vitest.live.config.ts` deshabilita la interceptación de consola de Vitest para que las líneas de progreso de proveedor/gateway se transmitan inmediatamente durante las ejecuciones live.
  - Ajusta los heartbeats de modelo directo con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajusta los heartbeats de gateway/probe con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## ¿Qué suite debería ejecutar?

Usa esta tabla de decisión:

- Al editar lógica/pruebas: ejecuta `pnpm test` (y `pnpm test:coverage` si cambiaste mucho)
- Si tocas redes del Gateway / protocolo WS / emparejamiento: añade `pnpm test:e2e`
- Al depurar “mi bot está caído” / fallos específicos del proveedor / llamadas a herramientas: ejecuta un `pnpm test:live` acotado

## Pruebas en vivo (con acceso a la red)

Para la matriz de modelos en vivo, pruebas de humo del backend de la CLI, pruebas de humo de ACP, arnés de servidor de aplicaciones de Codex y todas las pruebas en vivo de proveedores de medios (Deepgram, BytePlus, ComfyUI, imagen, música, video, arnés de medios), además de la gestión de credenciales para ejecuciones en vivo, consulta [Pruebas: conjuntos en vivo](/es/help/testing-live).

## Ejecutores de Docker (comprobaciones opcionales de "funciona en Linux")

Estos ejecutores de Docker se dividen en dos grupos:

- Ejecutores de modelos en vivo: `test:docker:live-models` y `test:docker:live-gateway` ejecutan solo su archivo en vivo correspondiente de claves de perfil dentro de la imagen Docker del repositorio (`src/agents/models.profiles.live.test.ts` y `src/gateway/gateway-models.profiles.live.test.ts`), montando tu directorio de configuración local y el espacio de trabajo (y cargando `~/.profile` si está montado). Los puntos de entrada locales correspondientes son `test:live:models-profiles` y `test:live:gateway-profiles`.
- Los ejecutores en vivo de Docker usan de forma predeterminada un límite de prueba de humo más pequeño para que un barrido completo de Docker siga siendo práctico:
  `test:docker:live-models` usa de forma predeterminada `OPENCLAW_LIVE_MAX_MODELS=12`, y
  `test:docker:live-gateway` usa de forma predeterminada `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` y
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sobrescribe esas variables de entorno cuando quieras explícitamente el escaneo exhaustivo más amplio.
- `test:docker:all` compila la imagen Docker en vivo una vez mediante `test:docker:live-build`, empaqueta OpenClaw una vez como tarball de npm mediante `scripts/package-openclaw-for-docker.mjs` y luego compila/reutiliza dos imágenes de `scripts/e2e/Dockerfile`. La imagen básica es solo el ejecutor de Node/Git para rutas de instalación/actualización/dependencias de Plugin; esas rutas montan el tarball precompilado. La imagen funcional instala el mismo tarball en `/app` para rutas de funcionalidad de la aplicación compilada. Las definiciones de rutas de Docker están en `scripts/lib/docker-e2e-scenarios.mjs`; la lógica del planificador está en `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ejecuta el plan seleccionado. El agregado usa un planificador local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla los espacios de proceso, mientras que los límites de recursos evitan que las rutas pesadas en vivo, de instalación de npm y multiservicio arranquen todas a la vez. Si una sola ruta es más pesada que los límites activos, el planificador aún puede iniciarla cuando el grupo está vacío y luego la mantiene ejecutándose sola hasta que vuelva a haber capacidad disponible. Los valores predeterminados son 10 espacios, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` y `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajusta `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` u `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` solo cuando el host de Docker tenga más margen. El ejecutor realiza una comprobación previa de Docker de forma predeterminada, elimina contenedores E2E obsoletos de OpenClaw, imprime el estado cada 30 segundos, guarda los tiempos de rutas correctas en `.artifacts/docker-tests/lane-timings.json` y usa esos tiempos para iniciar primero las rutas más largas en ejecuciones posteriores. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir el manifiesto ponderado de rutas sin compilar ni ejecutar Docker, o `node scripts/test-docker-all.mjs --plan-json` para imprimir el plan de CI de las rutas seleccionadas, las necesidades de paquetes/imágenes y las credenciales.
- `Package Acceptance` es la puerta de paquetes nativa de GitHub para "¿este tarball instalable funciona como producto?" Resuelve un paquete candidato desde `source=npm`, `source=ref`, `source=url` o `source=artifact`, lo sube como `package-under-test` y luego ejecuta las rutas reutilizables de Docker E2E contra ese tarball exacto en vez de volver a empaquetar la referencia seleccionada. `workflow_ref` selecciona los scripts de flujo de trabajo/arnés confiables, mientras que `package_ref` selecciona el commit/rama/etiqueta de origen que se empaqueta cuando `source=ref`; esto permite que la lógica de aceptación actual valide commits confiables más antiguos. Los perfiles se ordenan por amplitud: `smoke` es instalación/canal/agente rápida más Gateway/configuración, `package` es el contrato de paquete/actualización/Plugin más el fixture de supervivencia a actualización sin clave y el reemplazo nativo predeterminado para la mayor parte de la cobertura de paquete/actualización de Parallels, `product` añade canales MCP, limpieza de Cron/subagentes, búsqueda web de OpenAI y OpenWebUI, y `full` ejecuta los fragmentos de Docker de la ruta de publicación con OpenWebUI. La validación de publicación ejecuta un delta de paquete personalizado (`bundled-channel-deps-compat plugins-offline`) más QA de paquete de Telegram porque los fragmentos de Docker de la ruta de publicación ya cubren las rutas superpuestas de paquete/actualización/Plugin. Los comandos de reejecución dirigida de Docker en GitHub generados a partir de artefactos incluyen el artefacto de paquete anterior y las entradas de imágenes preparadas cuando están disponibles, para que las rutas fallidas puedan evitar recompilar el paquete y las imágenes.
- Las comprobaciones de compilación y publicación ejecutan `scripts/check-cli-bootstrap-imports.mjs` después de tsdown. La guarda recorre el grafo compilado estático desde `dist/entry.js` y `dist/cli/run-main.js` y falla si el arranque previo al despacho importa dependencias de paquetes como Commander, interfaz de prompts, undici o registro antes del despacho del comando; también mantiene dentro del presupuesto el fragmento incluido de ejecución del Gateway y rechaza importaciones estáticas de rutas frías conocidas del Gateway. La prueba de humo de la CLI empaquetada también cubre ayuda raíz, ayuda de incorporación, ayuda de doctor, estado, esquema de configuración y un comando de lista de modelos.
- La compatibilidad heredada de Package Acceptance está limitada a `2026.4.25` (`2026.4.25-beta.*` incluido). Hasta ese límite, el arnés tolera solo brechas de metadatos de paquetes publicados: entradas privadas omitidas del inventario de QA, falta de `gateway install --wrapper`, falta de archivos de parche en el fixture git derivado del tarball, falta de `update.channel` persistido, ubicaciones heredadas de registros de instalación de plugins, falta de persistencia de registros de instalación del marketplace y migración de metadatos de configuración durante `plugins update`. Para paquetes posteriores a `2026.4.25`, esas rutas son fallos estrictos.
- Ejecutores de humo de contenedores: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` y `test:docker:config-reload` arrancan uno o más contenedores reales y verifican rutas de integración de nivel superior.

Los ejecutores Docker de modelos en vivo también montan con bind solo los directorios de autenticación de la CLI necesarios (o todos los admitidos cuando la ejecución no está acotada), y luego los copian al directorio home del contenedor antes de la ejecución para que el OAuth de CLI externas pueda renovar tokens sin mutar el almacén de autenticación del host:

- Modelos directos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Humo de enlace ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; cubre Claude, Codex y Gemini de forma predeterminada, con cobertura estricta de Droid/OpenCode mediante `pnpm test:docker:live-acp-bind:droid` y `pnpm test:docker:live-acp-bind:opencode`)
- Humo del backend de CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Humo del arnés del servidor de aplicaciones de Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desarrollo: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Humo de observabilidad: `pnpm qa:otel:smoke` es una ruta privada de QA para checkout de código fuente. Intencionadamente no forma parte de las rutas de lanzamiento de Docker del paquete porque el tarball de npm omite QA Lab.
- Humo en vivo de Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Asistente de incorporación (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Humo de incorporación/canal/agente del tarball de npm: `pnpm test:docker:npm-onboard-channel-agent` instala el tarball empaquetado de OpenClaw globalmente en Docker, configura OpenAI mediante incorporación con referencia de entorno y Telegram de forma predeterminada, verifica que doctor reparó las dependencias de runtime del plugin activado y ejecuta un turno de agente OpenAI simulado. Reutiliza un tarball precompilado con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la reconstrucción del host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` o cambia de canal con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Humo de cambio de canal de actualización: `pnpm test:docker:update-channel-switch` instala el tarball empaquetado de OpenClaw globalmente en Docker, cambia del paquete `stable` a git `dev`, verifica el canal persistido y el funcionamiento posterior a la actualización del plugin, luego vuelve al paquete `stable` y comprueba el estado de actualización.
- Humo de supervivencia de actualización: `pnpm test:docker:upgrade-survivor` instala el tarball empaquetado de OpenClaw sobre un fixture antiguo de usuario con cambios sin limpiar que contiene agentes, configuración de canal, listas de permitidos de plugins, estado obsoleto de dependencias de runtime de plugins y archivos de workspace/sesión existentes. Ejecuta la actualización de paquete y doctor no interactivo sin claves de proveedor ni canal en vivo, luego inicia un Gateway de local loopback y comprueba la preservación de configuración/estado y los presupuestos de inicio/estado.
- Humo de contexto de runtime de sesión: `pnpm test:docker:session-runtime-context` verifica la persistencia oculta de transcripciones de contexto de runtime, además de la reparación de doctor de ramas duplicadas afectadas de reescritura de prompts.
- Humo de instalación global de Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empaqueta el árbol actual, lo instala con `bun install -g` en un home aislado y verifica que `openclaw infer image providers --json` devuelva los proveedores de imagen incluidos en lugar de quedarse bloqueado. Reutiliza un tarball precompilado con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la compilación del host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` o copia `dist/` desde una imagen de Docker compilada con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Humo del instalador en Docker: `bash scripts/test-install-sh-docker.sh` comparte una caché de npm entre sus contenedores root, de actualización y direct-npm. El humo de actualización usa de forma predeterminada npm `latest` como baseline estable antes de actualizar al tarball candidato. Sobrescríbelo con `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localmente o con la entrada `update_baseline_version` del flujo de trabajo Install Smoke en GitHub. Las comprobaciones del instalador sin root mantienen una caché de npm aislada para que las entradas de caché propiedad de root no oculten el comportamiento de instalación local del usuario. Define `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar la caché root/update/direct-npm entre repeticiones locales.
- Install Smoke CI omite la actualización global direct-npm duplicada con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; ejecuta el script localmente sin esa variable de entorno cuando se necesite cobertura directa de `npm install -g`.
- Humo de CLI para eliminar workspace compartido de agentes: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila de forma predeterminada la imagen del Dockerfile raíz, siembra dos agentes con un workspace en un home de contenedor aislado, ejecuta `agents delete --json` y verifica JSON válido y el comportamiento de conservación del workspace. Reutiliza la imagen install-smoke con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Red de Gateway (dos contenedores, autenticación WS + salud): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Humo de snapshot CDP del navegador: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila la imagen E2E de origen más una capa de Chromium, inicia Chromium con CDP sin procesar, ejecuta `browser doctor --deep` y verifica que las snapshots de rol de CDP cubran URL de enlaces, elementos clicables promovidos por cursor, referencias de iframe y metadatos de frames.
- Regresión de razonamiento mínimo de OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) ejecuta un servidor OpenAI simulado a través de Gateway, verifica que `web_search` eleve `reasoning.effort` de `minimal` a `low`, luego fuerza el rechazo del esquema del proveedor y comprueba que el detalle sin procesar aparezca en los registros de Gateway.
- Puente de canal MCP (Gateway sembrado + puente stdio + humo de frame de notificación sin procesar de Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Herramientas MCP del bundle Pi (servidor MCP stdio real + humo de permitir/denegar del perfil Pi embebido): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Limpieza MCP de Cron/subagente (Gateway real + desmontaje de hijo MCP stdio tras ejecuciones aisladas de cron y subagente de una sola vez): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (humo de instalación, instalación/desinstalación integral de ClawHub, actualizaciones de marketplace y habilitación/inspección del bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Define `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para omitir el bloque ClawHub, o sobrescribe el par predeterminado paquete/runtime integral con `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` y `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sin `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, la prueba usa un servidor fixture local hermético de ClawHub.
- Humo de actualización de Plugin sin cambios: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Humo de metadatos de recarga de configuración: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Dependencias de runtime de plugins incluidos: `pnpm test:docker:bundled-channel-deps` compila de forma predeterminada una imagen pequeña de runner Docker, compila y empaqueta OpenClaw una vez en el host, y luego monta ese tarball en cada escenario de instalación de Linux. Reutiliza la imagen con `OPENCLAW_SKIP_DOCKER_BUILD=1`, omite la reconstrucción del host después de una compilación local reciente con `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` o apunta a un tarball existente con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. El agregado completo de Docker y los fragmentos bundled-channel de la ruta de lanzamiento preempaquetan este tarball una vez y luego dividen las comprobaciones de canales incluidos en rutas independientes, incluidas rutas de actualización separadas para Telegram, Discord, Slack, Feishu, memory-lancedb y ACPX. Los fragmentos de lanzamiento separan humos de canales, destinos de actualización y contratos de configuración/runtime en `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` y `bundled-channels-contracts`; el fragmento agregado `bundled-channels` sigue disponible para repeticiones manuales. El flujo de trabajo de lanzamiento también separa fragmentos del instalador de proveedores y fragmentos de instalación/desinstalación de plugins incluidos; los fragmentos heredados `package-update`, `plugins-runtime` y `plugins-integrations` siguen siendo alias agregados para repeticiones manuales. Usa `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` para acotar la matriz de canales al ejecutar directamente la ruta incluida, o `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` para acotar el escenario de actualización. Las ejecuciones Docker por escenario usan de forma predeterminada `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; el escenario de actualización multidestino usa de forma predeterminada `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. La ruta también verifica que `channels.<id>.enabled=false` y `plugins.entries.<id>.enabled=false` supriman la reparación de dependencias de runtime/doctor.
- Acota las dependencias de runtime de plugins incluidos durante la iteración deshabilitando escenarios no relacionados, por ejemplo:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Para precompilar y reutilizar manualmente la imagen funcional compartida:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Las sobrescrituras de imagen específicas de suite, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, siguen teniendo prioridad cuando están definidas. Cuando `OPENCLAW_SKIP_DOCKER_BUILD=1` apunta a una imagen remota compartida, los scripts la descargan si todavía no está local. Las pruebas Docker de QR e instalador conservan sus propios Dockerfiles porque validan el comportamiento del paquete/instalación en lugar del runtime de la aplicación compilada compartida.

Los ejecutores Docker de modelos en vivo también montan la copia de trabajo actual como de solo lectura y la preparan en un directorio de trabajo temporal dentro del contenedor. Esto mantiene ligera la imagen de ejecución, pero sigue ejecutando Vitest contra tu código fuente/configuración local exactos.
El paso de preparación omite cachés grandes solo locales y salidas de compilación de apps, como `.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, y directorios de salida `.build` locales de la app o de Gradle, para que las ejecuciones en vivo de Docker no pasen minutos copiando artefactos específicos de la máquina.
También establecen `OPENCLAW_SKIP_CHANNELS=1` para que los sondeos en vivo del Gateway no inicien workers de canales reales de Telegram/Discord/etc. dentro del contenedor.
`test:docker:live-models` sigue ejecutando `pnpm test:live`, así que pasa también `OPENCLAW_LIVE_GATEWAY_*` cuando necesites acotar o excluir la cobertura en vivo del Gateway de ese carril Docker.
`test:docker:openwebui` es una prueba de humo de compatibilidad de nivel superior: inicia un contenedor de Gateway de OpenClaw con los endpoints HTTP compatibles con OpenAI habilitados, inicia un contenedor fijado de Open WebUI contra ese Gateway, inicia sesión mediante Open WebUI, verifica que `/api/models` exponga `openclaw/default` y luego envía una solicitud de chat real mediante el proxy `/api/chat/completions` de Open WebUI.
La primera ejecución puede ser notablemente más lenta porque Docker puede necesitar descargar la imagen de Open WebUI y Open WebUI puede necesitar terminar su propia configuración de arranque en frío.
Este carril espera una clave de modelo en vivo utilizable, y `OPENCLAW_PROFILE_FILE`
(`~/.profile` de forma predeterminada) es la forma principal de proporcionarla en ejecuciones dockerizadas.
Las ejecuciones correctas imprimen una pequeña carga JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` es intencionalmente determinista y no necesita una cuenta real de Telegram, Discord ni iMessage. Arranca un contenedor de Gateway sembrado, inicia un segundo contenedor que genera `openclaw mcp serve` y luego verifica el descubrimiento de conversaciones enrutadas, las lecturas de transcripciones, los metadatos de adjuntos, el comportamiento de la cola de eventos en vivo, el enrutamiento de envío saliente y las notificaciones de canal + permisos de estilo Claude mediante el puente MCP stdio real. La comprobación de notificaciones inspecciona directamente los frames MCP stdio sin procesar para que la prueba de humo valide lo que el puente realmente emite, no solo lo que un SDK de cliente específico expone por casualidad.
`test:docker:pi-bundle-mcp-tools` es determinista y no necesita una clave de modelo en vivo. Compila la imagen Docker del repositorio, inicia un servidor de sondeo MCP stdio real dentro del contenedor, materializa ese servidor mediante el runtime MCP del paquete Pi integrado, ejecuta la herramienta y luego verifica que `coding` y `messaging` conserven las herramientas `bundle-mcp` mientras `minimal` y `tools.deny: ["bundle-mcp"]` las filtran.
`test:docker:cron-mcp-cleanup` es determinista y no necesita una clave de modelo en vivo. Inicia un Gateway sembrado con un servidor de sondeo MCP stdio real, ejecuta un turno de Cron aislado y un turno hijo puntual de `/subagents spawn`, y luego verifica que el proceso hijo MCP salga después de cada ejecución.

Prueba de humo manual ACP de hilo en lenguaje natural (no CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conserva este script para flujos de regresión/depuración. Puede volver a ser necesario para validar el enrutamiento de hilos ACP, así que no lo elimines.

Variables de entorno útiles:

- `OPENCLAW_CONFIG_DIR=...` (predeterminado: `~/.openclaw`) montado en `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predeterminado: `~/.openclaw/workspace`) montado en `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predeterminado: `~/.profile`) montado en `/home/node/.profile` y cargado antes de ejecutar las pruebas
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar solo variables de entorno cargadas desde `OPENCLAW_PROFILE_FILE`, usando directorios temporales de configuración/espacio de trabajo y sin montajes externos de autenticación CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predeterminado: `~/.cache/openclaw/docker-cli-tools`) montado en `/home/node/.npm-global` para instalaciones CLI en caché dentro de Docker
- Los directorios/archivos externos de autenticación CLI bajo `$HOME` se montan como de solo lectura en `/host-auth...` y luego se copian en `/home/node/...` antes de que empiecen las pruebas
  - Directorios predeterminados: `.minimax`
  - Archivos predeterminados: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Las ejecuciones acotadas por proveedor montan solo los directorios/archivos necesarios inferidos a partir de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sobrescribe manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o una lista separada por comas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para acotar la ejecución
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar proveedores dentro del contenedor
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar una imagen `openclaw:local-live` existente en repeticiones que no necesitan recompilación
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantizar que las credenciales provengan del almacén de perfiles (no del entorno)
- `OPENCLAW_OPENWEBUI_MODEL=...` para elegir el modelo expuesto por el Gateway para la prueba de humo de Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para sobrescribir el prompt de comprobación de nonce usado por la prueba de humo de Open WebUI
- `OPENWEBUI_IMAGE=...` para sobrescribir la etiqueta de imagen fijada de Open WebUI

## Cordura de docs

Ejecuta comprobaciones de docs después de editar docs: `pnpm check:docs`.
Ejecuta la validación completa de anchors de Mintlify cuando también necesites comprobaciones de encabezados dentro de la página: `pnpm docs:check-links:anchors`.

## Regresión sin conexión (segura para CI)

Estas son regresiones de “pipeline real” sin proveedores reales:

- Llamadas a herramientas del Gateway (OpenAI simulado, Gateway real + bucle de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Asistente del Gateway (WS `wizard.start`/`wizard.next`, escribe configuración + autenticación aplicada): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evals de fiabilidad de agentes (Skills)

Ya tenemos algunas pruebas seguras para CI que se comportan como “evals de fiabilidad de agentes”:

- Llamadas a herramientas simuladas mediante el Gateway real + bucle de agente (`src/gateway/gateway.test.ts`).
- Flujos de asistente de extremo a extremo que validan el cableado de sesión y los efectos de configuración (`src/gateway/gateway.test.ts`).

Lo que aún falta para Skills (consulta [Skills](/es/tools/skills)):

- **Toma de decisiones:** cuando las Skills se enumeran en el prompt, ¿el agente elige la Skill correcta (o evita las irrelevantes)?
- **Cumplimiento:** ¿el agente lee `SKILL.md` antes de usarla y sigue los pasos/argumentos requeridos?
- **Contratos de flujo de trabajo:** escenarios multi-turno que verifican el orden de herramientas, el traspaso del historial de sesión y los límites del sandbox.

Los evals futuros deben seguir siendo deterministas primero:

- Un ejecutor de escenarios que use proveedores simulados para verificar llamadas a herramientas + orden, lecturas de archivos de Skill y cableado de sesión.
- Una pequeña suite de escenarios centrados en Skills (usar frente a evitar, compuertas, inyección de prompt).
- Evals en vivo opcionales (opt-in, protegidos por entorno) solo después de que la suite segura para CI esté lista.

## Pruebas de contrato (forma de Plugin y canal)

Las pruebas de contrato verifican que cada Plugin y canal registrado cumpla su contrato de interfaz. Iteran sobre todos los Plugins descubiertos y ejecutan una suite de aserciones de forma y comportamiento. El carril unitario predeterminado de `pnpm test` omite intencionalmente estos archivos compartidos de seams y humo; ejecuta los comandos de contrato explícitamente cuando toques superficies compartidas de canal o proveedor.

### Comandos

- Todos los contratos: `pnpm test:contracts`
- Solo contratos de canal: `pnpm test:contracts:channels`
- Solo contratos de proveedor: `pnpm test:contracts:plugins`

### Contratos de canal

Ubicados en `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma básica de Plugin (id, nombre, capacidades)
- **setup** - Contrato del asistente de configuración
- **session-binding** - Comportamiento de vinculación de sesión
- **outbound-payload** - Estructura de carga de mensaje
- **inbound** - Manejo de mensajes entrantes
- **actions** - Manejadores de acciones de canal
- **threading** - Manejo de ID de hilo
- **directory** - API de directorio/lista
- **group-policy** - Aplicación de política de grupo

### Contratos de estado de proveedor

Ubicados en `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondeos de estado de canal
- **registry** - Forma del registro de Plugins

### Contratos de proveedor

Ubicados en `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato de flujo de autenticación
- **auth-choice** - Elección/selección de autenticación
- **catalog** - API de catálogo de modelos
- **discovery** - Descubrimiento de Plugins
- **loader** - Carga de Plugins
- **runtime** - Runtime de proveedor
- **shape** - Forma/interfaz de Plugin
- **wizard** - Asistente de configuración

### Cuándo ejecutar

- Después de cambiar exportaciones o subrutas de plugin-sdk
- Después de agregar o modificar un Plugin de canal o proveedor
- Después de refactorizar el registro o descubrimiento de Plugins

Las pruebas de contrato se ejecutan en CI y no requieren claves API reales.

## Agregar regresiones (guía)

Cuando corrijas un problema de proveedor/modelo descubierto en vivo:

- Agrega una regresión segura para CI si es posible (proveedor simulado/stub, o captura la transformación exacta de la forma de solicitud)
- Si es inherentemente solo en vivo (límites de tasa, políticas de autenticación), mantén la prueba en vivo acotada y opt-in mediante variables de entorno
- Prefiere apuntar a la capa más pequeña que detecte el bug:
  - bug de conversión/reproducción de solicitudes del proveedor → prueba directa de modelos
  - bug de pipeline de sesión/historial/herramientas del Gateway → prueba de humo en vivo del Gateway o prueba simulada segura para CI del Gateway
- Barrera de protección de recorrido de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un objetivo muestreado por clase de SecretRef a partir de los metadatos del registro (`listSecretTargetRegistryEntries()`), y luego afirma que se rechazan los ids de ejecución con segmentos de recorrido.
  - Si agregas una nueva familia de objetivos SecretRef `includeInPlan` en `src/secrets/target-registry-data.ts`, actualiza `classifyTargetClass` en esa prueba. La prueba falla intencionalmente con ids de objetivo no clasificados para que no se puedan omitir clases nuevas silenciosamente.

## Relacionado

- [Pruebas en vivo](/es/help/testing-live)
- [CI](/es/ci)
