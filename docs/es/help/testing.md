---
read_when:
    - Ejecutar pruebas localmente o en CI
    - Añadir pruebas de regresión para errores de modelos/proveedores
    - Depuración del comportamiento de Gateway + agente
summary: 'Kit de pruebas: suites unitarias, e2e y live, ejecutores de Docker y qué cubre cada prueba'
title: Pruebas
x-i18n:
    generated_at: "2026-05-05T01:47:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d051bf6a01f6caf7755ad1d7107f21ae2d440b55a65bb7f18ee4a81f5f0e3b2
    source_path: help/testing.md
    workflow: 16
---

OpenClaw tiene tres suites de Vitest (unitaria/integración, e2e, en vivo) y un pequeño conjunto
de ejecutores de Docker. Este documento es una guía de "cómo probamos":

- Qué cubre cada suite (y qué deliberadamente _no_ cubre).
- Qué comandos ejecutar para flujos de trabajo comunes (local, antes de hacer push, depuración).
- Cómo las pruebas en vivo descubren credenciales y seleccionan modelos/proveedores.
- Cómo agregar regresiones para problemas reales de modelos/proveedores.

<Note>
**La pila de QA (qa-lab, qa-channel, carriles de transporte en vivo)** se documenta por separado:

- [Resumen de QA](/es/concepts/qa-e2e-automation) — arquitectura, superficie de comandos, creación de escenarios.
- [QA de matriz](/es/concepts/qa-matrix) — referencia para `pnpm openclaw qa matrix`.
- [Canal de QA](/es/channels/qa-channel) — el plugin de transporte sintético usado por escenarios respaldados por el repo.

Esta página cubre la ejecución de las suites de prueba regulares y los ejecutores de Docker/Parallels. La sección de ejecutores específicos de QA de abajo ([Ejecutores específicos de QA](#qa-specific-runners)) enumera las invocaciones `qa` concretas y vuelve a remitir a las referencias anteriores.
</Note>

## Inicio rápido

La mayoría de los días:

- Gate completo (esperado antes de hacer push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Ejecución local más rápida de la suite completa en una máquina con recursos holgados: `pnpm test:max`
- Bucle directo de observación de Vitest: `pnpm test:watch`
- El direccionamiento directo a archivos ahora también enruta rutas de extensión/canal: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefiere primero ejecuciones dirigidas cuando estés iterando sobre un único fallo.
- Sitio de QA respaldado por Docker: `pnpm qa:lab:up`
- Carril de QA respaldado por VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Cuando toques pruebas o quieras confianza extra:

- Gate de cobertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Al depurar proveedores/modelos reales (requiere credenciales reales):

- Suite en vivo (modelos + sondas de herramienta/imagen del Gateway): `pnpm test:live`
- Dirigir un archivo en vivo en silencio: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Informes de rendimiento en runtime: despacha `OpenClaw Performance` con
  `live_gpt54=true` para un turno real de agente `openai/gpt-5.4` o
  `deep_profile=true` para artefactos de CPU/heap/traza de Kova. Las ejecuciones programadas diarias
  publican artefactos de carriles de proveedor simulado, perfil profundo y GPT 5.4 en
  `openclaw/clawgrit-reports` cuando `CLAWGRIT_REPORTS_TOKEN` está configurado. El
  informe de proveedor simulado también incluye cifras a nivel de fuente del arranque del Gateway, memoria,
  presión de plugins, bucle hello repetido con modelo falso e inicio de la CLI.
- Barrido de modelos en vivo con Docker: `pnpm test:docker:live-models`
  - Cada modelo seleccionado ahora ejecuta un turno de texto más una pequeña sonda de estilo lectura de archivo.
    Los modelos cuyos metadatos anuncian entrada `image` también ejecutan un turno de imagen mínimo.
    Desactiva las sondas adicionales con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` al aislar fallos de proveedor.
  - Cobertura de CI: tanto `OpenClaw Scheduled Live And E2E Checks` diario como
    `OpenClaw Release Checks` manual llaman al flujo de trabajo reutilizable de en vivo/E2E con
    `include_live_suites: true`, lo que incluye trabajos separados de matriz de modelos en vivo con Docker
    particionados por proveedor.
  - Para repeticiones enfocadas de CI, despacha `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` y `live_models_only: true`.
  - Agrega nuevos secretos de proveedor de alta señal a `scripts/ci-hydrate-live-auth.sh`
    más `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` y sus
    invocadores programados/de release.
- Smoke de chat vinculado nativo de Codex: `pnpm test:docker:live-codex-bind`
  - Ejecuta un carril en vivo de Docker contra la ruta del servidor de app de Codex, vincula un DM sintético de
    Slack con `/codex bind`, ejercita `/codex fast` y
    `/codex permissions`, luego verifica una respuesta simple y un adjunto de imagen
    enrutados por el vínculo nativo del plugin en lugar de ACP.
- Smoke del arnés del servidor de app de Codex: `pnpm test:docker:live-codex-harness`
  - Ejecuta turnos de agente del Gateway a través del arnés del servidor de app de Codex propiedad del plugin,
    verifica `/codex status` y `/codex models`, y por defecto ejercita sondas de imagen,
    cron MCP, subagente y Guardian. Desactiva la sonda de subagente con
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` al aislar otros fallos del
    servidor de app de Codex. Para una comprobación enfocada de subagente, desactiva las otras sondas:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Esto sale después de la sonda de subagente a menos que
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` esté configurado.
- Smoke del comando de rescate de Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Comprobación opt-in de refuerzo para la superficie del comando de rescate del canal de mensajes.
    Ejercita `/crestodian status`, encola un cambio persistente de modelo,
    responde `/crestodian yes` y verifica la ruta de escritura de auditoría/configuración.
- Smoke de Docker del planificador de Crestodian: `pnpm test:docker:crestodian-planner`
  - Ejecuta Crestodian en un contenedor sin configuración con una CLI de Claude falsa en `PATH`
    y verifica que el fallback del planificador difuso se traduce en una escritura de configuración tipada auditada.
- Smoke de Docker de primera ejecución de Crestodian: `pnpm test:docker:crestodian-first-run`
  - Parte de un directorio de estado vacío de OpenClaw, enruta `openclaw` sin argumentos a
    Crestodian, aplica escrituras de configuración/modelo/agente/plugin de Discord + SecretRef,
    valida la configuración y verifica entradas de auditoría. La misma ruta de configuración Ring 0
    también está cubierta en QA Lab por
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de coste Moonshot/Kimi: con `MOONSHOT_API_KEY` configurada, ejecuta
  `openclaw models list --provider moonshot --json`, luego ejecuta un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  aislado contra `moonshot/kimi-k2.6`. Verifica que el JSON informe Moonshot/K2.6 y que la
  transcripción del asistente almacene `usage.cost` normalizado.

<Tip>
Cuando solo necesites un caso fallido, prefiere acotar las pruebas en vivo mediante las variables de entorno de lista de permitidos descritas abajo.
</Tip>

## Ejecutores específicos de QA

Estos comandos se sitúan junto a las suites de prueba principales cuando necesitas realismo de QA Lab:

CI ejecuta QA Lab en flujos de trabajo dedicados. La paridad agéntica está anidada bajo
`QA-Lab - All Lanes` y la validación de release, no en un flujo de trabajo de PR independiente.
La validación amplia debe usar `Full Release Validation` con
`rerun_group=qa-parity` o el grupo de QA de comprobaciones de release. Las comprobaciones de release
estables/predeterminadas mantienen el soak exhaustivo en vivo/Docker detrás de `run_release_soak=true`; el
perfil `full` fuerza la activación de soak. `QA-Lab - All Lanes`
se ejecuta cada noche en `main` y desde despacho manual con el carril de paridad simulado, el carril de Matrix en vivo,
el carril de Telegram en vivo gestionado por Convex y el carril de Discord en vivo gestionado por Convex
como trabajos paralelos. La QA programada y las comprobaciones de release pasan Matrix
`--profile fast` explícitamente, mientras que la entrada predeterminada de la CLI de Matrix y del flujo de trabajo manual
sigue siendo `all`; el despacho manual puede particionar `all` en trabajos `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`. `OpenClaw Release
Checks` ejecuta la paridad más los carriles rápidos de Matrix y Telegram antes de la aprobación de release,
usando `mock-openai/gpt-5.5` para las comprobaciones de transporte de release para que sigan
siendo deterministas y eviten el arranque normal del plugin de proveedor. Estos Gateways de transporte en vivo
desactivan la búsqueda de memoria; el comportamiento de memoria sigue cubierto por las suites de paridad de QA.

Los shards de medios en vivo de release completo usan
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, que ya tiene
`ffmpeg` y `ffprobe`. Los shards de modelos/backends en vivo con Docker usan la imagen compartida
`ghcr.io/openclaw/openclaw-live-test:<sha>` construida una vez por commit seleccionado,
luego la extraen con `OPENCLAW_SKIP_DOCKER_BUILD=1` en lugar de reconstruirla
dentro de cada shard.

- `pnpm openclaw qa suite`
  - Ejecuta escenarios de QA respaldados por el repositorio directamente en el host.
  - Ejecuta varios escenarios seleccionados en paralelo de forma predeterminada con workers de
    gateway aislados. `qa-channel` usa concurrencia 4 de forma predeterminada (limitada por el
    recuento de escenarios seleccionados). Usa `--concurrency <count>` para ajustar el recuento de
    workers, o `--concurrency 1` para el carril serial anterior.
  - Sale con código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
    quieras artefactos sin un código de salida fallido.
  - Admite los modos de proveedor `live-frontier`, `mock-openai` y `aimock`.
    `aimock` inicia un servidor de proveedor local respaldado por AIMock para cobertura experimental
    de fixtures y simulaciones de protocolo sin reemplazar el carril `mock-openai` consciente de escenarios.
- `pnpm test:plugins:kitchen-sink-live`
  - Ejecuta el desafío en vivo del Plugin OpenAI Kitchen Sink mediante QA Lab. Instala
    el paquete externo Kitchen Sink, verifica el inventario de superficie del SDK de plugin,
    sondea `/healthz` y `/readyz`, registra evidencia de CPU/RSS del Gateway, ejecuta
    un turno OpenAI en vivo y comprueba diagnósticos adversariales. Requiere autenticación
    OpenAI en vivo, como `OPENAI_API_KEY`. En sesiones Testbox hidratadas, obtiene
    automáticamente el perfil de autenticación en vivo de Testbox cuando el helper
    `openclaw-testbox-env` está presente.
- `pnpm test:gateway:cpu-scenarios`
  - Ejecuta el banco de arranque del Gateway más un pequeño paquete de escenarios simulados de QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) y escribe un resumen combinado de observación de CPU
    en `.artifacts/gateway-cpu-scenarios/`.
  - Marca solo observaciones sostenidas de CPU caliente de forma predeterminada (`--cpu-core-warn`
    más `--hot-wall-warn-ms`), por lo que las ráfagas breves de arranque se registran como métricas
    sin parecerse a la regresión de Gateway fijado durante minutos.
  - Usa artefactos construidos en `dist`; ejecuta una compilación primero cuando el checkout no
    tenga ya salida de runtime fresca.
- `pnpm openclaw qa suite --runner multipass`
  - Ejecuta el mismo conjunto de QA dentro de una VM Linux desechable de Multipass.
  - Mantiene el mismo comportamiento de selección de escenarios que `qa suite` en el host.
  - Reutiliza las mismas flags de selección de proveedor/modelo que `qa suite`.
  - Las ejecuciones en vivo reenvían las entradas de autenticación de QA admitidas que son prácticas para el invitado:
    claves de proveedor basadas en env, la ruta de configuración del proveedor en vivo de QA y `CODEX_HOME`
    cuando está presente.
  - Los directorios de salida deben permanecer bajo la raíz del repositorio para que el invitado pueda escribir de vuelta mediante
    el workspace montado.
  - Escribe el informe y el resumen normales de QA más los logs de Multipass en
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia el sitio de QA respaldado por Docker para trabajo de QA de estilo operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Construye un tarball npm desde el checkout actual, lo instala globalmente en
    Docker, ejecuta onboarding no interactivo con clave de API de OpenAI, configura Telegram
    de forma predeterminada, verifica que el runtime del plugin empaquetado cargue sin reparación
    de dependencias al arrancar, ejecuta doctor y ejecuta un turno de agente local contra un
    endpoint OpenAI simulado.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para ejecutar el mismo carril de instalación empaquetada
    con Discord.
- `pnpm test:docker:session-runtime-context`
  - Ejecuta un smoke determinista de app construida en Docker para transcripciones con contexto de runtime
    embebido. Verifica que el contexto de runtime oculto de OpenClaw se persista como un
    mensaje personalizado no visible en lugar de filtrarse al turno visible del usuario,
    luego siembra una sesión JSONL rota afectada y verifica que
    `openclaw doctor --fix` la reescriba a la rama activa con un respaldo.
- `pnpm test:docker:npm-telegram-live`
  - Instala un candidato de paquete OpenClaw en Docker, ejecuta onboarding de paquete instalado,
    configura Telegram mediante la CLI instalada y luego reutiliza el carril de QA de Telegram
    en vivo con ese paquete instalado como Gateway SUT.
  - Usa `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` de forma predeterminada; establece
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` o
    `OPENCLAW_CURRENT_PACKAGE_TGZ` para probar un tarball local resuelto en lugar de
    instalar desde el registro.
  - Usa las mismas credenciales env de Telegram o la fuente de credenciales Convex que
    `pnpm openclaw qa telegram`. Para automatización de CI/lanzamiento, establece
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` más
    `OPENCLAW_QA_CONVEX_SITE_URL` y el secreto de rol. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` y un secreto de rol Convex están presentes en CI,
    el wrapper de Docker selecciona Convex automáticamente.
  - El wrapper valida el env de credenciales de Telegram o Convex en el host antes del
    trabajo de build/install de Docker. Establece `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    solo cuando estés depurando deliberadamente la configuración previa a credenciales.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` anula el
    `OPENCLAW_QA_CREDENTIAL_ROLE` compartido solo para este carril.
  - GitHub Actions expone este carril como el workflow manual de mantenedor
    `NPM Telegram Beta E2E`. No se ejecuta al hacer merge. El workflow usa el
    entorno `qa-live-shared` y leases de credenciales CI de Convex.
- GitHub Actions también expone `Package Acceptance` para prueba de producto de ejecución lateral
  contra un paquete candidato. Acepta un ref confiable, una especificación npm publicada,
  URL de tarball HTTPS más SHA-256, o artefacto de tarball de otra ejecución, sube
  el `openclaw-current.tgz` normalizado como `package-under-test` y luego ejecuta el
  programador Docker E2E existente con perfiles de carril smoke, paquete, producto, completo o personalizado.
  Establece `telegram_mode=mock-openai` o `live-frontier` para ejecutar el
  workflow de QA de Telegram contra el mismo artefacto `package-under-test`.
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

- La prueba con artefacto descarga un artefacto de tarball de otra ejecución de Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Empaqueta e instala la build actual de OpenClaw en Docker, inicia el Gateway
    con OpenAI configurado y luego habilita canales/plugins incluidos mediante ediciones de config.
  - Verifica que el descubrimiento de setup deje ausentes los plugins descargables no configurados,
    que la primera reparación doctor configurada instale explícitamente cada
    plugin descargable faltante, y que un segundo reinicio no ejecute reparación
    oculta de dependencias.
  - También instala una base npm anterior conocida, habilita Telegram antes de ejecutar
    `openclaw update --tag <candidate>` y verifica que el doctor posterior a la actualización
    del candidato limpie restos de dependencias de plugins heredados sin una
    reparación postinstall del lado del harness.
- `pnpm test:parallels:npm-update`
  - Ejecuta el smoke nativo de actualización de instalación empaquetada en invitados Parallels. Cada
    plataforma seleccionada primero instala el paquete base solicitado, luego ejecuta el comando
    `openclaw update` instalado en el mismo invitado y verifica la versión instalada,
    el estado de actualización, la preparación del Gateway y un turno de agente local.
  - Usa `--platform macos`, `--platform windows` o `--platform linux` mientras
    iteras en un invitado. Usa `--json` para la ruta del artefacto de resumen y
    el estado por carril.
  - El carril OpenAI usa `openai/gpt-5.5` de forma predeterminada para la prueba
    de turno de agente en vivo. Pasa `--model <provider/model>` o establece
    `OPENCLAW_PARALLELS_OPENAI_MODEL` cuando valides deliberadamente otro
    modelo OpenAI.
  - Envuelve ejecuciones locales largas en un timeout del host para que los bloqueos de transporte de Parallels no puedan
    consumir el resto de la ventana de pruebas:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - El script escribe logs de carril anidados en `/tmp/openclaw-parallels-npm-update.*`.
    Inspecciona `windows-update.log`, `macos-update.log` o `linux-update.log`
    antes de asumir que el wrapper externo está colgado.
  - La actualización de Windows puede pasar de 10 a 15 minutos en doctor posterior a la actualización y trabajo de
    actualización de paquete en un invitado frío; eso sigue siendo saludable cuando el log
    debug de npm anidado avanza.
  - No ejecutes este wrapper agregado en paralelo con carriles smoke individuales de Parallels
    macOS, Windows o Linux. Comparten estado de VM y pueden colisionar en la
    restauración de snapshots, el servicio de paquetes o el estado del Gateway invitado.
  - La prueba posterior a la actualización ejecuta la superficie normal de plugins incluidos porque
    las fachadas de capacidades como voz, generación de imágenes y comprensión de medios
    se cargan mediante APIs de runtime incluidas incluso cuando el turno de agente
    solo comprueba una respuesta de texto simple.

- `pnpm openclaw qa aimock`
  - Inicia solo el servidor de proveedor AIMock local para pruebas smoke directas
    de protocolo.
- `pnpm openclaw qa matrix`
  - Ejecuta el carril de QA en vivo de Matrix contra un homeserver Tuwunel desechable respaldado por Docker. Solo checkout de código fuente: las instalaciones empaquetadas no incluyen `qa-lab`.
  - CLI completa, catálogo de perfiles/escenarios, variables env y diseño de artefactos: [QA de Matrix](/es/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Ejecuta el carril de QA en vivo de Telegram contra un grupo privado real usando los tokens de bot del driver y del SUT desde env.
  - Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. El id de grupo debe ser el id numérico del chat de Telegram.
  - Admite `--credential-source convex` para credenciales compartidas agrupadas. Usa el modo env de forma predeterminada, o establece `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases agrupados.
  - Sale con código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando quieras
    artefactos sin un código de salida fallido.
  - Requiere dos bots distintos en el mismo grupo privado, con el bot SUT exponiendo un nombre de usuario de Telegram.
  - Para una observación estable de bot a bot, habilita Bot-to-Bot Communication Mode en `@BotFather` para ambos bots y asegúrate de que el bot driver pueda observar el tráfico de bots del grupo.
  - Escribe un informe de QA de Telegram, un resumen y un artefacto de mensajes observados en `.artifacts/qa-e2e/...`. Los escenarios con respuesta incluyen RTT desde la solicitud de envío del driver hasta la respuesta SUT observada.

Los carriles de transporte en vivo comparten un contrato estándar para que los nuevos transportes no se desvíen; la matriz de cobertura por carril vive en [Resumen de QA → Cobertura de transporte en vivo](/es/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` es el conjunto sintético amplio y no forma parte de esa matriz.

### Credenciales compartidas de Telegram mediante Convex (v1)

Cuando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
`openclaw qa telegram`, QA lab adquiere un lease exclusivo desde un pool respaldado por Convex, envía heartbeats
a ese lease mientras el carril se ejecuta y libera el lease al cerrar.

Scaffold de referencia del proyecto Convex:

- `qa/convex-credential-broker/`

Variables env requeridas:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por ejemplo `https://your-deployment.convex.site`)
- Un secreto para el rol seleccionado:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Selección de rol de credenciales:
  - CLI: `--credential-role maintainer|ci`
  - Predeterminado env: `OPENCLAW_QA_CREDENTIAL_ROLE` (por defecto `ci` en CI, `maintainer` en otros casos)

Variables env opcionales:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predeterminado `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predeterminado `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predeterminado `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predeterminado `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predeterminado `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de traza opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URL Convex `http://` de loopback para desarrollo solo local.

`OPENCLAW_QA_CONVEX_SITE_URL` debe usar `https://` durante el funcionamiento normal.

Los comandos administrativos de mantenedor (pool add/remove/list) requieren
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` específicamente.

Ayudantes de CLI para mantenedores:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `doctor` antes de las ejecuciones en vivo para comprobar la URL del sitio de Convex, los secretos
del broker, el prefijo de endpoint, el tiempo de espera HTTP y la accesibilidad de admin/list sin imprimir
valores secretos. Usa `--json` para obtener salida legible por máquina en scripts y utilidades de CI.

Contrato predeterminado de endpoint (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
- `POST /admin/add` (solo secreto de mantenedor)
  - Solicitud: `{ kind, actorId, payload, note?, status? }`
  - Correcto: `{ status: "ok", credential }`
- `POST /admin/remove` (solo secreto de mantenedor)
  - Solicitud: `{ credentialId, actorId }`
  - Correcto: `{ status: "ok", changed, credential }`
  - Guarda de concesión activa: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo secreto de mantenedor)
  - Solicitud: `{ kind?, status?, includePayload?, limit? }`
  - Correcto: `{ status: "ok", credentials, count }`

Forma del payload para el tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` debe ser una cadena de id numérico de chat de Telegram.
- `admin/add` valida esta forma para `kind: "telegram"` y rechaza payloads mal formados.

### Agregar un canal a QA

La arquitectura y los nombres de ayudantes de escenario para nuevos adaptadores de canal están en [descripción general de QA → Agregar un canal](/es/concepts/qa-e2e-automation#adding-a-channel). El requisito mínimo: implementar el ejecutor de transporte en la interfaz compartida de host `qa-lab`, declarar `qaRunners` en el manifiesto del plugin, montar como `openclaw qa <runner>` y crear escenarios bajo `qa/scenarios/`.

## Suites de prueba (qué se ejecuta dónde)

Piensa en las suites como “realismo creciente” (y mayor inestabilidad/costo):

### Unitarias / integración (predeterminado)

- Comando: `pnpm test`
- Configuración: las ejecuciones sin objetivo usan el conjunto de shards `vitest.full-*.config.ts` y pueden expandir shards multiproyecto en configuraciones por proyecto para la planificación en paralelo
- Archivos: inventarios core/unit bajo `src/**/*.test.ts`, `packages/**/*.test.ts` y `test/**/*.test.ts`; las pruebas unitarias de UI se ejecutan en el shard dedicado `unit-ui`
- Alcance:
  - Pruebas unitarias puras
  - Pruebas de integración en proceso (autenticación del gateway, enrutamiento, herramientas, análisis, configuración)
  - Regresiones deterministas para errores conocidos
- Expectativas:
  - Se ejecuta en CI
  - No requiere claves reales
  - Debe ser rápida y estable
  - Las pruebas del resolvedor y del cargador de superficie pública deben demostrar el comportamiento de fallback amplio de `api.js` y
    `runtime-api.js` con fixtures de plugins diminutos generados, no con
    APIs reales de código fuente de plugins incluidos. Las cargas de API de plugins reales pertenecen a
    suites de contrato/integración propiedad del plugin.

<AccordionGroup>
  <Accordion title="Proyectos, shards y carriles con alcance">

    - `pnpm test` sin objetivo ejecuta doce configuraciones de fragmentos más pequeñas (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) en lugar de un único proceso gigante de proyecto raíz nativo. Esto reduce el RSS máximo en máquinas cargadas y evita que el trabajo de auto-reply/extensión deje sin recursos a suites no relacionadas.
    - `pnpm test --watch` sigue usando el grafo de proyecto raíz nativo de `vitest.config.ts`, porque un bucle de vigilancia con varios fragmentos no es práctico.
    - `pnpm test`, `pnpm test:watch` y `pnpm test:perf:imports` enrutan primero los objetivos explícitos de archivo/directorio por carriles con ámbito, de modo que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar el coste completo de arranque del proyecto raíz.
    - `pnpm test:changed` expande las rutas git cambiadas en carriles con ámbito baratos de forma predeterminada: ediciones directas de pruebas, archivos hermanos `*.test.ts`, asignaciones de código fuente explícitas y dependientes locales del grafo de importación. Las ediciones de configuración/setup/paquete no ejecutan pruebas de forma amplia a menos que uses explícitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` es la puerta normal de comprobación local inteligente para trabajo acotado. Clasifica el diff en core, pruebas de core, extensions, pruebas de extension, apps, docs, metadatos de release, herramientas live Docker y tooling, y después ejecuta los comandos de typecheck, lint y guard correspondientes. No ejecuta pruebas Vitest; llama a `pnpm test:changed` o a `pnpm test <target>` explícito para prueba de tests. Los incrementos de versión solo de metadatos de release ejecutan comprobaciones específicas de versión/config/dependencias raíz, con una guarda que rechaza cambios de paquete fuera del campo de versión de nivel superior.
    - Las ediciones del harness live Docker ACP ejecutan comprobaciones enfocadas: sintaxis shell para los scripts de autenticación live Docker y una ejecución de prueba del planificador live Docker. Los cambios de `package.json` solo se incluyen cuando el diff se limita a `scripts["test:docker:live-*"]`; las ediciones de dependencias, exportaciones, versión y otras superficies de paquete siguen usando las guardas más amplias.
    - Las pruebas unitarias ligeras en importaciones de agentes, comandos, plugins, helpers de auto-reply, `plugin-sdk` y áreas similares de utilidades puras se enrutan por el carril `unit-fast`, que omite `test/setup-openclaw-runtime.ts`; los archivos con estado o pesados en runtime se mantienen en los carriles existentes.
    - Algunos archivos fuente auxiliares de `plugin-sdk` y `commands` también asignan las ejecuciones en modo cambiado a pruebas hermanas explícitas en esos carriles ligeros, de modo que las ediciones de helpers evitan volver a ejecutar toda la suite pesada de ese directorio.
    - `auto-reply` tiene cubos dedicados para helpers core de nivel superior, pruebas de integración `reply.*` de nivel superior y el subárbol `src/auto-reply/reply/**`. CI además divide el subárbol reply en fragmentos de agent-runner, dispatch y commands/state-routing para que un cubo pesado en importaciones no posea toda la cola de Node.
    - La CI normal de PR/main omite intencionadamente el barrido por lotes de extensiones y el fragmento `agentic-plugins` solo de release. Full Release Validation despacha el flujo de trabajo hijo separado `Plugin Prerelease` para esas suites pesadas en plugins/extensiones en candidatos de release.

  </Accordion>

  <Accordion title="Cobertura del runner integrado">

    - Cuando cambies las entradas de descubrimiento de herramientas de mensaje o el contexto de runtime de compaction, mantén ambos niveles de cobertura.
    - Añade regresiones de helpers enfocadas para límites puros de enrutamiento y normalización.
    - Mantén saludables las suites de integración del runner integrado:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` y
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Esas suites verifican que los ids con ámbito y el comportamiento de compaction sigan fluyendo por las rutas reales `run.ts` / `compact.ts`; las pruebas solo de helpers no son un sustituto suficiente para esas rutas de integración.

  </Accordion>

  <Accordion title="Valores predeterminados de pool e aislamiento de Vitest">

    - La configuración base de Vitest usa `threads` de forma predeterminada.
    - La configuración compartida de Vitest fija `isolate: false` y usa el runner no aislado en los proyectos raíz, e2e y configuraciones live.
    - El carril UI raíz mantiene su setup y optimizador de `jsdom`, pero también se ejecuta en el runner compartido no aislado.
    - Cada fragmento de `pnpm test` hereda los mismos valores predeterminados `threads` + `isolate: false` de la configuración compartida de Vitest.
    - `scripts/run-vitest.mjs` añade `--no-maglev` de forma predeterminada para los procesos Node hijos de Vitest para reducir el trabajo repetido de compilación de V8 durante grandes ejecuciones locales. Define `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar con el comportamiento V8 estándar.

  </Accordion>

  <Accordion title="Iteración local rápida">

    - `pnpm changed:lanes` muestra qué carriles arquitectónicos activa un diff.
    - El hook pre-commit solo formatea. Vuelve a preparar archivos formateados y no ejecuta lint, typecheck ni tests.
    - Ejecuta `pnpm check:changed` explícitamente antes de handoff o push cuando necesites la puerta de comprobación local inteligente.
    - `pnpm test:changed` se enruta por carriles con ámbito baratos de forma predeterminada. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el agente decida que una edición de harness, configuración, paquete o contrato realmente necesita cobertura Vitest más amplia.
    - `pnpm test:max` y `pnpm test:changed:max` mantienen el mismo comportamiento de enrutamiento, solo con un límite mayor de workers.
    - El autoescalado local de workers es intencionadamente conservador y retrocede cuando el promedio de carga del host ya es alto, de modo que varias ejecuciones concurrentes de Vitest causen menos impacto de forma predeterminada.
    - La configuración base de Vitest marca los proyectos/archivos de configuración como `forceRerunTriggers` para que las repeticiones en modo cambiado sigan siendo correctas cuando cambie el cableado de tests.
    - La configuración mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado en hosts compatibles; define `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si quieres una ubicación de caché explícita para perfilado directo.

  </Accordion>

  <Accordion title="Depuración de rendimiento">

    - `pnpm test:perf:imports` habilita los informes de duración de importaciones de Vitest además de la salida de desglose de importaciones.
    - `pnpm test:perf:imports:changed` limita la misma vista de perfilado a los archivos cambiados desde `origin/main`.
    - Los datos de tiempos de fragmentos se escriben en `.artifacts/vitest-shard-timings.json`. Las ejecuciones de configuración completa usan la ruta de configuración como clave; los fragmentos de CI con patrones de inclusión añaden el nombre del fragmento para que los fragmentos filtrados puedan rastrearse por separado.
    - Cuando una prueba caliente todavía pasa la mayor parte del tiempo en importaciones de arranque, mantén las dependencias pesadas detrás de una costura local estrecha `*.runtime.ts` y mockea esa costura directamente en lugar de hacer importaciones profundas de helpers de runtime solo para pasarlos por `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara `test:changed` enrutado contra la ruta nativa de proyecto raíz para ese diff confirmado y muestra tiempo de pared además del RSS máximo de macOS.
    - `pnpm test:perf:changed:bench -- --worktree` mide el árbol sucio actual enrutando la lista de archivos cambiados por `scripts/test-projects.mjs` y la configuración raíz de Vitest.
    - `pnpm test:perf:profile:main` escribe un perfil de CPU del hilo principal para el overhead de arranque y transformación de Vitest/Vite.
    - `pnpm test:perf:profile:runner` escribe perfiles de CPU+heap del runner para la suite unitaria con el paralelismo de archivos deshabilitado.

  </Accordion>
</AccordionGroup>

### Estabilidad (gateway)

- Comando: `pnpm test:stability:gateway`
- Configuración: `vitest.gateway.config.ts`, forzada a un worker
- Alcance:
  - Inicia un Gateway real de loopback con diagnósticos habilitados de forma predeterminada
  - Impulsa actividad sintética de mensajes de gateway, memoria y cargas grandes por la ruta de eventos de diagnóstico
  - Consulta `diagnostics.stability` mediante el RPC WS del Gateway
  - Cubre helpers de persistencia de paquetes de estabilidad de diagnóstico
  - Comprueba que el recorder permanezca acotado, que las muestras sintéticas de RSS se mantengan por debajo del presupuesto de presión y que las profundidades de cola por sesión vuelvan a cero
- Expectativas:
  - Seguro para CI y sin claves
  - Carril estrecho para seguimiento de regresiones de estabilidad, no un sustituto de la suite completa de Gateway

### E2E (smoke de gateway)

- Comando: `pnpm test:e2e`
- Configuración: `vitest.e2e.config.ts`
- Archivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` y pruebas E2E de plugins incluidos en `extensions/`
- Valores predeterminados de runtime:
  - Usa `threads` de Vitest con `isolate: false`, igual que el resto del repositorio.
  - Usa workers adaptativos (CI: hasta 2, local: 1 de forma predeterminada).
  - Se ejecuta en modo silencioso de forma predeterminada para reducir la sobrecarga de E/S de consola.
- Overrides útiles:
  - `OPENCLAW_E2E_WORKERS=<n>` para forzar el recuento de workers (limitado a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para volver a habilitar la salida detallada de consola.
- Alcance:
  - Comportamiento integral de Gateway multiinstancia
  - Superficies WebSocket/HTTP, emparejamiento de nodos y redes más pesadas
- Expectativas:
  - Se ejecuta en CI (cuando está habilitado en el pipeline)
  - No requiere claves reales
  - Más piezas móviles que las pruebas unitarias (puede ser más lento)

### E2E: prueba smoke del backend de OpenShell

- Comando: `pnpm test:e2e:openshell`
- Archivo: `extensions/openshell/src/backend.e2e.test.ts`
- Alcance:
  - Inicia un Gateway de OpenShell aislado en el host mediante Docker
  - Crea un sandbox a partir de un Dockerfile local temporal
  - Ejercita el backend de OpenShell de OpenClaw mediante `sandbox ssh-config` real + ejecución SSH
  - Verifica el comportamiento del sistema de archivos canónico remoto a través del puente fs del sandbox
- Expectativas:
  - Solo con opt-in; no forma parte de la ejecución predeterminada de `pnpm test:e2e`
  - Requiere una CLI local `openshell` más un daemon de Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` aislados y luego destruye el Gateway y el sandbox de prueba
- Overrides útiles:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar la prueba al ejecutar manualmente la suite e2e más amplia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apuntar a un binario de CLI no predeterminado o a un script envoltorio

### En vivo (proveedores reales + modelos reales)

- Comando: `pnpm test:live`
- Configuración: `vitest.live.config.ts`
- Archivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` y pruebas en vivo de plugins incluidos en `extensions/`
- Valor predeterminado: **habilitado** por `pnpm test:live` (establece `OPENCLAW_LIVE_TEST=1`)
- Alcance:
  - “¿Este proveedor/modelo funciona realmente _hoy_ con credenciales reales?”
  - Detectar cambios de formato del proveedor, particularidades de llamadas a herramientas, problemas de autenticación y comportamiento de límites de tasa
- Expectativas:
  - No es estable para CI por diseño (redes reales, políticas reales de proveedores, cuotas, interrupciones)
  - Cuesta dinero / usa límites de tasa
  - Preferir ejecutar subconjuntos acotados en lugar de “todo”
- Las ejecuciones en vivo cargan `~/.profile` para recoger claves de API faltantes.
- De forma predeterminada, las ejecuciones en vivo siguen aislando `HOME` y copian material de configuración/autenticación a un home temporal de prueba para que los fixtures unitarios no puedan mutar tu `~/.openclaw` real.
- Establece `OPENCLAW_LIVE_USE_REAL_HOME=1` solo cuando necesites intencionalmente que las pruebas en vivo usen tu directorio home real.
- `pnpm test:live` ahora usa de forma predeterminada un modo más silencioso: conserva la salida de progreso `[live] ...`, pero suprime el aviso extra de `~/.profile` y silencia los logs de arranque del Gateway/charla de Bonjour. Establece `OPENCLAW_LIVE_TEST_QUIET=0` si quieres recuperar todos los logs de inicio.
- Rotación de claves de API (específica por proveedor): establece `*_API_KEYS` con formato de comas/punto y coma o `*_API_KEY_1`, `*_API_KEY_2` (por ejemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) o override por ejecución en vivo mediante `OPENCLAW_LIVE_*_KEY`; las pruebas reintentan ante respuestas de límite de tasa.
- Salida de progreso/Heartbeat:
  - Las suites en vivo ahora emiten líneas de progreso a stderr para que las llamadas largas a proveedores se vean activas incluso cuando la captura de consola de Vitest está silenciosa.
  - `vitest.live.config.ts` deshabilita la interceptación de consola de Vitest para que las líneas de progreso de proveedor/Gateway se transmitan inmediatamente durante las ejecuciones en vivo.
  - Ajusta los Heartbeats de modelo directo con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajusta los Heartbeats de Gateway/sonda con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## ¿Qué suite debería ejecutar?

Usa esta tabla de decisión:

- Al editar lógica/pruebas: ejecuta `pnpm test` (y `pnpm test:coverage` si cambiaste mucho)
- Al tocar redes del Gateway / protocolo WS / emparejamiento: agrega `pnpm test:e2e`
- Al depurar “mi bot está caído” / fallos específicos del proveedor / llamadas a herramientas: ejecuta un `pnpm test:live` acotado

## Pruebas en vivo (tocan red)

Para la matriz de modelos en vivo, pruebas smoke del backend CLI, pruebas smoke de ACP, arnés del servidor de la app Codex y todas las pruebas en vivo de proveedores multimedia (Deepgram, BytePlus, ComfyUI, imagen, música, video, arnés multimedia), además del manejo de credenciales para ejecuciones en vivo, consulta [Probar suites en vivo](/es/help/testing-live). Para la lista de verificación dedicada de actualización y validación de Plugin, consulta [Probar actualizaciones y plugins](/es/help/testing-updates-plugins).

## Runners de Docker (comprobaciones opcionales de "funciona en Linux")

Estos runners de Docker se dividen en dos grupos:

- Runners de modelos en vivo: `test:docker:live-models` y `test:docker:live-gateway` ejecutan solo su archivo en vivo correspondiente de claves de perfil dentro de la imagen Docker del repositorio (`src/agents/models.profiles.live.test.ts` y `src/gateway/gateway-models.profiles.live.test.ts`), montando tu directorio local de configuración y workspace (y cargando `~/.profile` si está montado). Los entrypoints locales correspondientes son `test:live:models-profiles` y `test:live:gateway-profiles`.
- Los runners en vivo de Docker usan de forma predeterminada un límite de smoke más pequeño para que un barrido completo de Docker siga siendo práctico:
  `test:docker:live-models` usa de forma predeterminada `OPENCLAW_LIVE_MAX_MODELS=12`, y
  `test:docker:live-gateway` usa de forma predeterminada `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` y
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sobrescribe esas variables de entorno cuando quieras explícitamente el escaneo exhaustivo más grande.
- `test:docker:all` construye la imagen Docker en vivo una vez mediante `test:docker:live-build`, empaqueta OpenClaw una vez como tarball npm mediante `scripts/package-openclaw-for-docker.mjs` y luego construye/reutiliza dos imágenes `scripts/e2e/Dockerfile`. La imagen básica es solo el runner Node/Git para lanes de instalación/actualización/dependencias de Plugin; esas lanes montan el tarball precompilado. La imagen funcional instala el mismo tarball en `/app` para lanes de funcionalidad de app compilada. Las definiciones de lanes de Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`; la lógica del planner vive en `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ejecuta el plan seleccionado. El agregado usa un scheduler local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla los slots de proceso, mientras que los límites de recursos evitan que las lanes pesadas en vivo, de instalación npm y multiservicio arranquen todas a la vez. Si una sola lane es más pesada que los límites activos, el scheduler aún puede iniciarla cuando el pool está vacío y luego la mantiene ejecutándose sola hasta que vuelva a haber capacidad disponible. Los valores predeterminados son 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` y `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajusta `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` solo cuando el host de Docker tenga más margen. El runner realiza una precomprobación de Docker de forma predeterminada, elimina contenedores E2E obsoletos de OpenClaw, imprime estado cada 30 segundos, almacena los tiempos de lanes exitosas en `.artifacts/docker-tests/lane-timings.json` y usa esos tiempos para iniciar primero las lanes más largas en ejecuciones posteriores. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir el manifiesto de lanes ponderadas sin construir ni ejecutar Docker, o `node scripts/test-docker-all.mjs --plan-json` para imprimir el plan de CI de las lanes seleccionadas, necesidades de paquete/imagen y credenciales.
- `Package Acceptance` es la puerta de paquetes nativa de GitHub para "¿este tarball instalable funciona como producto?" Resuelve un paquete candidato desde `source=npm`, `source=ref`, `source=url` o `source=artifact`, lo sube como `package-under-test` y luego ejecuta las lanes E2E reutilizables de Docker contra ese tarball exacto en lugar de volver a empaquetar la ref seleccionada. Los perfiles están ordenados por amplitud: `smoke`, `package`, `product` y `full`. Consulta [Probar actualizaciones y plugins](/es/help/testing-updates-plugins) para el contrato de paquete/actualización/Plugin, la matriz de supervivencia de actualizaciones publicadas, los valores predeterminados de release y la clasificación de fallos.
- Las comprobaciones de compilación y release ejecutan `scripts/check-cli-bootstrap-imports.mjs` después de tsdown. La protección recorre el grafo compilado estático desde `dist/entry.js` y `dist/cli/run-main.js` y falla si los imports de inicio previos al despacho importan dependencias de paquete como Commander, interfaz de prompts, undici o logging antes del despacho de comandos; también mantiene el chunk de ejecución del Gateway incluido bajo presupuesto y rechaza imports estáticos de rutas frías conocidas del Gateway. La prueba smoke de CLI empaquetada también cubre ayuda raíz, ayuda de onboard, ayuda de doctor, estado, esquema de configuración y un comando de lista de modelos.
- La compatibilidad heredada de Package Acceptance está limitada a `2026.4.25` (`2026.4.25-beta.*` incluido). Hasta ese corte, el arnés tolera solo huecos de metadatos de paquetes ya publicados: entradas omitidas de inventario privado de QA, falta de `gateway install --wrapper`, falta de archivos de parches en el fixture git derivado del tarball, falta de `update.channel` persistido, ubicaciones heredadas de registros de instalación de Plugin, falta de persistencia de registros de instalación de marketplace y migración de metadatos de configuración durante `plugins update`. Para paquetes posteriores a `2026.4.25`, esas rutas son fallos estrictos.
- Runners smoke de contenedor: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` y `test:docker:config-reload` arrancan uno o más contenedores reales y verifican rutas de integración de nivel superior.

Los runners Docker de modelos en vivo también montan con bind solo los homes de autenticación CLI necesarios (o todos los compatibles cuando la ejecución no está acotada) y luego los copian al home del contenedor antes de la ejecución para que el OAuth de CLI externa pueda actualizar tokens sin mutar el almacén de autenticación del host:

- Modelos directos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de vinculación ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; cubre Claude, Codex y Gemini de forma predeterminada, con cobertura estricta de Droid/OpenCode mediante `pnpm test:docker:live-acp-bind:droid` y `pnpm test:docker:live-acp-bind:opencode`)
- Smoke del backend de CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke del arnés del servidor de la aplicación Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desarrollo: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke de observabilidad: `pnpm qa:otel:smoke` es una vía privada de QA para checkout del código fuente. Intencionalmente no forma parte de las vías de lanzamiento Docker de paquetes porque el tarball de npm omite QA Lab.
- Smoke en vivo de Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Asistente de incorporación (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke de incorporación/canal/agente del tarball de npm: `pnpm test:docker:npm-onboard-channel-agent` instala globalmente el tarball empaquetado de OpenClaw en Docker, configura OpenAI mediante incorporación con referencia de entorno más Telegram de forma predeterminada, ejecuta doctor y ejecuta un turno simulado de agente OpenAI. Reutiliza un tarball precompilado con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la recompilación del host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, o cambia el canal con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` o `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Smoke de cambio de canal de actualización: `pnpm test:docker:update-channel-switch` instala globalmente el tarball empaquetado de OpenClaw en Docker, cambia de paquete `stable` a git `dev`, verifica que el canal persistido y el Plugin posterior a la actualización funcionen, luego vuelve al paquete `stable` y comprueba el estado de actualización.
- Smoke de supervivencia de actualización: `pnpm test:docker:upgrade-survivor` instala el tarball empaquetado de OpenClaw sobre una fixture sucia de usuario antiguo con agentes, configuración de canal, listas de permitidos de Plugin, estado obsoleto de dependencias de Plugin y archivos existentes de workspace/sesión. Ejecuta la actualización del paquete más doctor no interactivo sin proveedor en vivo ni claves de canal, luego inicia un Gateway de loopback y comprueba la preservación de configuración/estado más los presupuestos de inicio/estado.
- Smoke de supervivencia de actualización publicada: `pnpm test:docker:published-upgrade-survivor` instala `openclaw@latest` de forma predeterminada, siembra archivos realistas de usuario existente, configura esa línea base con una receta de comandos integrada, valida la configuración resultante, actualiza esa instalación publicada al tarball candidato, ejecuta doctor no interactivo, escribe `.artifacts/upgrade-survivor/summary.json`, luego inicia un Gateway de loopback y comprueba intents configurados, preservación de estado, inicio, `/healthz`, `/readyz` y presupuestos de estado RPC. Sobrescribe una línea base con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, pide al planificador agregado que expanda líneas base exactas con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` como `all-since-2026.4.23`, y expande fixtures con forma de issue con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` como `reported-issues`; el conjunto reported-issues incluye `configured-plugin-installs` para la reparación automática de instalación de Plugin externo de OpenClaw. Package Acceptance expone esto como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` y `published_upgrade_survivor_scenarios`; Full Release Validation usa la línea base latest predeterminada en la ruta bloqueante y se expande a all-since/reported-issues solo para `run_release_soak=true` o `release_profile=full`.
- Smoke de contexto de runtime de sesión: `pnpm test:docker:session-runtime-context` verifica la persistencia oculta del transcript de contexto de runtime más la reparación de doctor de las ramas duplicadas de reescritura de prompt afectadas.
- Smoke de instalación global con Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empaqueta el árbol actual, lo instala con `bun install -g` en un home aislado y verifica que `openclaw infer image providers --json` devuelva proveedores de imagen incluidos en lugar de quedarse colgado. Reutiliza un tarball precompilado con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la compilación del host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, o copia `dist/` desde una imagen Docker compilada con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker del instalador: `bash scripts/test-install-sh-docker.sh` comparte una caché de npm entre sus contenedores root, update y direct-npm. El smoke de actualización usa de forma predeterminada npm `latest` como línea base estable antes de actualizar al tarball candidato. Sobrescríbelo con `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localmente, o con la entrada `update_baseline_version` del workflow Install Smoke en GitHub. Las comprobaciones del instalador no root mantienen una caché de npm aislada para que las entradas de caché propiedad de root no oculten el comportamiento de instalación local del usuario. Define `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar la caché root/update/direct-npm en repeticiones locales.
- Install Smoke CI omite la actualización global direct-npm duplicada con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; ejecuta el script localmente sin esa variable de entorno cuando se necesite cobertura directa de `npm install -g`.
- Smoke de CLI para eliminación de workspace compartido de agentes: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila la imagen Dockerfile raíz de forma predeterminada, siembra dos agentes con un workspace en un home de contenedor aislado, ejecuta `agents delete --json` y verifica JSON válido más el comportamiento de workspace retenido. Reutiliza la imagen install-smoke con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Redes de Gateway (dos contenedores, autenticación WS + salud): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoke de instantánea CDP de navegador: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila la imagen E2E de código fuente más una capa de Chromium, inicia Chromium con CDP sin procesar, ejecuta `browser doctor --deep` y verifica que las instantáneas de rol CDP cubran URL de enlaces, elementos clicables promovidos por cursor, referencias de iframe y metadatos de frame.
- Regresión de razonamiento mínimo de OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) ejecuta un servidor OpenAI simulado a través de Gateway, verifica que `web_search` eleve `reasoning.effort` de `minimal` a `low`, luego fuerza el rechazo del schema del proveedor y comprueba que el detalle sin procesar aparezca en los logs de Gateway.
- Puente de canal MCP (Gateway sembrado + puente stdio + smoke de frame de notificación sin procesar de Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Herramientas MCP del paquete Pi (servidor MCP stdio real + smoke de allow/deny con perfil Pi embebido): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Limpieza MCP de Cron/subagente (Gateway real + cierre de hijo MCP stdio después de ejecuciones aisladas de cron y subagente de una sola vez): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke de instalación/actualización para ruta local, `file:`, registro npm con dependencias elevadas, refs móviles de git, kitchen-sink de ClawHub, actualizaciones de marketplace y habilitación/inspección de paquete Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Define `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para omitir el bloque de ClawHub, o sobrescribe el par predeterminado paquete/runtime kitchen-sink con `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` y `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sin `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, la prueba usa un servidor fixture local hermético de ClawHub.
- Smoke de actualización sin cambios de Plugin: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke de matriz de ciclo de vida de Plugin: `pnpm test:docker:plugin-lifecycle-matrix` instala el tarball empaquetado de OpenClaw en un contenedor básico, instala un Plugin de npm, alterna habilitar/deshabilitar, lo actualiza y degrada a través de un registro npm local, elimina el código instalado, luego verifica que la desinstalación aún elimine estado obsoleto mientras registra métricas de RSS/CPU para cada fase del ciclo de vida.
- Smoke de metadatos de recarga de configuración: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` cubre smoke de instalación/actualización para ruta local, `file:`, registro npm con dependencias elevadas, refs móviles de git, fixtures de ClawHub, actualizaciones de marketplace y habilitación/inspección de paquete Claude. `pnpm test:docker:plugin-update` cubre el comportamiento de actualización sin cambios para Plugins instalados. `pnpm test:docker:plugin-lifecycle-matrix` cubre instalación, habilitación, deshabilitación, actualización, degradación y desinstalación con código ausente de Plugin de npm con seguimiento de recursos.

Para precompilar y reutilizar manualmente la imagen funcional compartida:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Las sobrescrituras de imagen específicas de suite como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` siguen teniendo prioridad cuando se definen. Cuando `OPENCLAW_SKIP_DOCKER_BUILD=1` apunta a una imagen compartida remota, los scripts la descargan si aún no está local. Las pruebas Docker de QR e instalador mantienen sus propios Dockerfiles porque validan el comportamiento de paquete/instalación en lugar del runtime compartido de la aplicación compilada.

The live-model Docker runners also bind-mount the current checkout read-only and
stage it into a temporary workdir inside the container. This keeps the runtime
image slim while still running Vitest against your exact local source/config.
The staging step skips large local-only caches and app build outputs such as
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, and app-local `.build` or
Gradle output directories so Docker live runs do not spend minutes copying
machine-specific artifacts.
They also set `OPENCLAW_SKIP_CHANNELS=1` so gateway live probes do not start
real Telegram/Discord/etc. channel workers inside the container.
`test:docker:live-models` still runs `pnpm test:live`, so pass through
`OPENCLAW_LIVE_GATEWAY_*` as well when you need to narrow or exclude gateway
live coverage from that Docker lane.
`test:docker:openwebui` is a higher-level compatibility smoke: it starts an
OpenClaw gateway container with the OpenAI-compatible HTTP endpoints enabled,
starts a pinned Open WebUI container against that gateway, signs in through
Open WebUI, verifies `/api/models` exposes `openclaw/default`, then sends a
real chat request through Open WebUI's `/api/chat/completions` proxy.
The first run can be noticeably slower because Docker may need to pull the
Open WebUI image and Open WebUI may need to finish its own cold-start setup.
This lane expects a usable live model key, and `OPENCLAW_PROFILE_FILE`
(`~/.profile` by default) is the primary way to provide it in Dockerized runs.
Successful runs print a small JSON payload like `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` is intentionally deterministic and does not need a
real Telegram, Discord, or iMessage account. It boots a seeded Gateway
container, starts a second container that spawns `openclaw mcp serve`, then
verifies routed conversation discovery, transcript reads, attachment metadata,
live event queue behavior, outbound send routing, and Claude-style channel +
permission notifications over the real stdio MCP bridge. The notification check
inspects the raw stdio MCP frames directly so the smoke validates what the
bridge actually emits, not just what a specific client SDK happens to surface.
`test:docker:pi-bundle-mcp-tools` is deterministic and does not need a live
model key. It builds the repo Docker image, starts a real stdio MCP probe server
inside the container, materializes that server through the embedded Pi bundle
MCP runtime, executes the tool, then verifies `coding` and `messaging` keep
`bundle-mcp` tools while `minimal` and `tools.deny: ["bundle-mcp"]` filter them.
`test:docker:cron-mcp-cleanup` is deterministic and does not need a live model
key. It starts a seeded Gateway with a real stdio MCP probe server, runs an
isolated cron turn and a `/subagents spawn` one-shot child turn, then verifies
the MCP child process exits after each run.

Manual ACP plain-language thread smoke (not CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Keep this script for regression/debug workflows. It may be needed again for ACP thread routing validation, so do not delete it.

Useful env vars:

- `OPENCLAW_CONFIG_DIR=...` (default: `~/.openclaw`) mounted to `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (default: `~/.openclaw/workspace`) mounted to `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (default: `~/.profile`) mounted to `/home/node/.profile` and sourced before running tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` to verify only env vars sourced from `OPENCLAW_PROFILE_FILE`, using temporary config/workspace dirs and no external CLI auth mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (default: `~/.cache/openclaw/docker-cli-tools`) mounted to `/home/node/.npm-global` for cached CLI installs inside Docker
- External CLI auth dirs/files under `$HOME` are mounted read-only under `/host-auth...`, then copied into `/home/node/...` before tests start
  - Default dirs: `.minimax`
  - Default files: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Narrowed provider runs mount only the needed dirs/files inferred from `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Override manually with `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, or a comma list like `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` to narrow the run
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` to filter providers in-container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` to reuse an existing `openclaw:local-live` image for reruns that do not need a rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` to ensure creds come from the profile store (not env)
- `OPENCLAW_OPENWEBUI_MODEL=...` to choose the model exposed by the gateway for the Open WebUI smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...` to override the nonce-check prompt used by the Open WebUI smoke
- `OPENWEBUI_IMAGE=...` to override the pinned Open WebUI image tag

## Docs sanity

Run docs checks after doc edits: `pnpm check:docs`.
Run full Mintlify anchor validation when you need in-page heading checks too: `pnpm docs:check-links:anchors`.

## Offline regression (CI-safe)

These are “real pipeline” regressions without real providers:

- Gateway tool calling (mock OpenAI, real gateway + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, writes config + auth enforced): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent reliability evals (skills)

We already have a few CI-safe tests that behave like “agent reliability evals”:

- Mock tool-calling through the real gateway + agent loop (`src/gateway/gateway.test.ts`).
- End-to-end wizard flows that validate session wiring and config effects (`src/gateway/gateway.test.ts`).

What’s still missing for skills (see [Skills](/es/tools/skills)):

- **Decisioning:** when skills are listed in the prompt, does the agent pick the right skill (or avoid irrelevant ones)?
- **Compliance:** does the agent read `SKILL.md` before use and follow required steps/args?
- **Workflow contracts:** multi-turn scenarios that assert tool order, session history carryover, and sandbox boundaries.

Future evals should stay deterministic first:

- A scenario runner using mock providers to assert tool calls + order, skill file reads, and session wiring.
- A small suite of skill-focused scenarios (use vs avoid, gating, prompt injection).
- Optional live evals (opt-in, env-gated) only after the CI-safe suite is in place.

## Contract tests (plugin and channel shape)

Contract tests verify that every registered plugin and channel conforms to its
interface contract. They iterate over all discovered plugins and run a suite of
shape and behavior assertions. The default `pnpm test` unit lane intentionally
skips these shared seam and smoke files; run the contract commands explicitly
when you touch shared channel or provider surfaces.

### Commands

- All contracts: `pnpm test:contracts`
- Channel contracts only: `pnpm test:contracts:channels`
- Provider contracts only: `pnpm test:contracts:plugins`

### Channel contracts

Located in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Basic plugin shape (id, name, capabilities)
- **setup** - Setup wizard contract
- **session-binding** - Session binding behavior
- **outbound-payload** - Message payload structure
- **inbound** - Inbound message handling
- **actions** - Channel action handlers
- **threading** - Thread ID handling
- **directory** - Directory/roster API
- **group-policy** - Group policy enforcement

### Provider status contracts

Located in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Channel status probes
- **registry** - Plugin registry shape

### Provider contracts

Located in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Auth flow contract
- **auth-choice** - Auth choice/selection
- **catalog** - Model catalog API
- **discovery** - Plugin discovery
- **loader** - Plugin loading
- **runtime** - Provider runtime
- **shape** - Plugin shape/interface
- **wizard** - Setup wizard

### When to run

- After changing plugin-sdk exports or subpaths
- After adding or modifying a channel or provider plugin
- After refactoring plugin registration or discovery

Contract tests run in CI and do not require real API keys.

## Adding regressions (guidance)

When you fix a provider/model issue discovered in live:

- Add a CI-safe regression if possible (mock/stub provider, or capture the exact request-shape transformation)
- If it’s inherently live-only (rate limits, auth policies), keep the live test narrow and opt-in via env vars
- Prefer targeting the smallest layer that catches the bug:
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke or CI-safe gateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` derives one sampled target per SecretRef class from registry metadata (`listSecretTargetRegistryEntries()`), then asserts traversal-segment exec ids are rejected.
  - If you add a new `includeInPlan` SecretRef target family in `src/secrets/target-registry-data.ts`, update `classifyTargetClass` in that test. The test intentionally fails on unclassified target ids so new classes cannot be skipped silently.

## Related

- [Testing live](/es/help/testing-live)
- [Testing updates and plugins](/es/help/testing-updates-plugins)
- [CI](/es/ci)
