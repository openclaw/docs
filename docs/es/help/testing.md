---
read_when:
    - Ejecución de pruebas localmente o en CI
    - Añadir pruebas de regresión para errores de modelo/proveedor
    - Depuración del comportamiento del Gateway + agente
summary: 'Kit de pruebas: suites unitarias, e2e y en vivo, ejecutores de Docker y lo que cubre cada prueba'
title: Pruebas
x-i18n:
    generated_at: "2026-05-06T05:38:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: eab32451166f7d0b372b618bb409606bf371f291a1fc848e3d3e717db43dc939
    source_path: help/testing.md
    workflow: 16
---

OpenClaw tiene tres suites de Vitest (unitaria/integración, e2e, en vivo) y un pequeño conjunto
de ejecutores Docker. Este documento es una guía de "cómo probamos":

- Qué cubre cada suite (y qué deliberadamente _no_ cubre).
- Qué comandos ejecutar para flujos de trabajo comunes (local, previo al push, depuración).
- Cómo las pruebas en vivo descubren credenciales y seleccionan modelos/proveedores.
- Cómo agregar regresiones para problemas reales de modelos/proveedores.

<Note>
**La pila de QA (qa-lab, qa-channel, carriles de transporte en vivo)** se documenta por separado:

- [Resumen de QA](/es/concepts/qa-e2e-automation) - arquitectura, superficie de comandos, creación de escenarios.
- [QA de matriz](/es/concepts/qa-matrix) - referencia para `pnpm openclaw qa matrix`.
- [Canal de QA](/es/channels/qa-channel) - el plugin de transporte sintético usado por escenarios respaldados por el repositorio.

Esta página cubre la ejecución de las suites de pruebas regulares y los ejecutores Docker/Parallels. La sección de ejecutores específicos de QA que aparece abajo ([Ejecutores específicos de QA](#qa-specific-runners)) enumera las invocaciones concretas de `qa` y remite a las referencias anteriores.
</Note>

## Inicio rápido

La mayoría de los días:

- Puerta completa (esperada antes de hacer push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Ejecución local más rápida de la suite completa en una máquina amplia: `pnpm test:max`
- Bucle directo de vigilancia de Vitest: `pnpm test:watch`
- La selección directa de archivos ahora también enruta rutas de extensiones/canales: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefiere primero ejecuciones dirigidas cuando estés iterando sobre un solo fallo.
- Sitio de QA respaldado por Docker: `pnpm qa:lab:up`
- Carril de QA respaldado por VM de Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Cuando toques pruebas o quieras más confianza:

- Puerta de cobertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Al depurar proveedores/modelos reales (requiere credenciales reales):

- Suite en vivo (modelos + sondas de herramientas/imágenes del Gateway): `pnpm test:live`
- Apuntar a un archivo en vivo en silencio: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Informes de rendimiento en tiempo de ejecución: despacha `OpenClaw Performance` con
  `live_gpt54=true` para un turno real de agente `openai/gpt-5.4` o
  `deep_profile=true` para artefactos de CPU/heap/traza de Kova. Las ejecuciones programadas diarias
  publican artefactos de los carriles de proveedor simulado, perfil profundo y GPT 5.4 en
  `openclaw/clawgrit-reports` cuando `CLAWGRIT_REPORTS_TOKEN` está configurado. El
  informe del proveedor simulado también incluye arranque del Gateway a nivel de código fuente, memoria,
  presión de plugins, bucle repetido de saludo con modelo falso y cifras de inicio de CLI.
- Barrido de modelos en vivo con Docker: `pnpm test:docker:live-models`
  - Cada modelo seleccionado ahora ejecuta un turno de texto más una pequeña sonda estilo lectura de archivo.
    Los modelos cuyos metadatos anuncian entrada `image` también ejecutan un turno diminuto con imagen.
    Desactiva las sondas adicionales con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` al aislar fallos del proveedor.
  - Cobertura de CI: tanto `OpenClaw Scheduled Live And E2E Checks` diario como
    `OpenClaw Release Checks` manual llaman al flujo reutilizable en vivo/E2E con
    `include_live_suites: true`, lo que incluye trabajos separados de matriz de modelos
    en vivo con Docker fragmentados por proveedor.
  - Para repeticiones enfocadas en CI, despacha `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` y `live_models_only: true`.
  - Agrega nuevos secretos de proveedor de alta señal a `scripts/ci-hydrate-live-auth.sh`
    junto con `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` y sus
    llamadores programados/de lanzamiento.
- Smoke de chat enlazado nativo de Codex: `pnpm test:docker:live-codex-bind`
  - Ejecuta un carril en vivo de Docker contra la ruta del servidor de aplicaciones de Codex, enlaza un DM
    sintético de Slack con `/codex bind`, ejercita `/codex fast` y
    `/codex permissions`, luego verifica que una respuesta simple y un adjunto de imagen
    pasen por el enlace nativo del plugin en lugar de ACP.
- Smoke del arnés del servidor de aplicaciones de Codex: `pnpm test:docker:live-codex-harness`
  - Ejecuta turnos de agente de Gateway a través del arnés del servidor de aplicaciones de Codex propiedad del plugin,
    verifica `/codex status` y `/codex models`, y de forma predeterminada ejercita sondas de imagen,
    MCP de Cron, subagente y Guardian. Desactiva la sonda de subagente con
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` al aislar otros fallos del
    servidor de aplicaciones de Codex. Para una comprobación enfocada de subagente, desactiva las demás sondas:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Esto sale después de la sonda de subagente salvo que
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` esté configurado.
- Smoke del comando de rescate de Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Comprobación opcional de defensa en profundidad para la superficie del comando de rescate
    del canal de mensajes. Ejercita `/crestodian status`, pone en cola un cambio de modelo
    persistente, responde `/crestodian yes` y verifica la ruta de escritura de auditoría/configuración.
- Smoke Docker del planificador de Crestodian: `pnpm test:docker:crestodian-planner`
  - Ejecuta Crestodian en un contenedor sin configuración con una CLI de Claude falsa en `PATH`
    y verifica que el fallback del planificador difuso se traduzca en una escritura de
    configuración tipada auditada.
- Smoke Docker de primera ejecución de Crestodian: `pnpm test:docker:crestodian-first-run`
  - Parte de un directorio de estado de OpenClaw vacío, enruta `openclaw` sin argumentos a
    Crestodian, aplica escrituras de setup/modelo/agente/plugin de Discord + SecretRef,
    valida la configuración y verifica entradas de auditoría. La misma ruta de configuración Ring 0
    también está cubierta en QA Lab por
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de coste de Moonshot/Kimi: con `MOONSHOT_API_KEY` configurada, ejecuta
  `openclaw models list --provider moonshot --json`, luego ejecuta un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  aislado contra `moonshot/kimi-k2.6`. Verifica que el JSON informe Moonshot/K2.6 y que la
  transcripción del asistente almacene `usage.cost` normalizado.

<Tip>
Cuando solo necesitas un caso fallido, prefiere estrechar las pruebas en vivo mediante las variables de entorno de lista de permitidos descritas abajo.
</Tip>

## Ejecutores específicos de QA

Estos comandos se ubican junto a las suites de pruebas principales cuando necesitas realismo de QA Lab:

CI ejecuta QA Lab en flujos de trabajo dedicados. La paridad agéntica está anidada bajo
`QA-Lab - All Lanes` y la validación de lanzamiento, no como un flujo de trabajo independiente de PR.
La validación amplia debe usar `Full Release Validation` con
`rerun_group=qa-parity` o el grupo de QA de release-checks. Las comprobaciones de lanzamiento
estables/predeterminadas mantienen el soak en vivo/Docker exhaustivo detrás de `run_release_soak=true`; el
perfil `full` fuerza la activación del soak. `QA-Lab - All Lanes`
se ejecuta cada noche en `main` y desde despacho manual con el carril de paridad simulado, el carril de Matrix en vivo,
el carril de Telegram en vivo administrado por Convex y el carril de Discord
en vivo administrado por Convex como trabajos paralelos. QA programado y las comprobaciones de lanzamiento pasan
Matrix `--profile fast` explícitamente, mientras que la CLI de Matrix y la entrada del flujo de trabajo manual
mantienen `all` como valor predeterminado; el despacho manual puede fragmentar `all` en trabajos `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`. `OpenClaw Release
Checks` ejecuta paridad más los carriles rápidos de Matrix y Telegram antes de la aprobación de lanzamiento,
usando `mock-openai/gpt-5.5` para las comprobaciones de transporte de lanzamiento, de modo que se mantengan
deterministas y eviten el arranque normal de plugins de proveedor. Estos Gateways de transporte en vivo
desactivan la búsqueda de memoria; el comportamiento de memoria permanece cubierto por las suites de paridad de QA.

Los shards de medios en vivo del lanzamiento completo usan
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, que ya tiene
`ffmpeg` y `ffprobe`. Los shards de modelos/backends en vivo con Docker usan la imagen compartida
`ghcr.io/openclaw/openclaw-live-test:<sha>` compilada una vez por commit seleccionado,
luego la descargan con `OPENCLAW_SKIP_DOCKER_BUILD=1` en lugar de recompilar
dentro de cada shard.

- `pnpm openclaw qa suite`
  - Ejecuta escenarios de QA respaldados por el repositorio directamente en el host.
  - Ejecuta varios escenarios seleccionados en paralelo de forma predeterminada con workers de Gateway aislados. `qa-channel` usa de forma predeterminada una concurrencia de 4 (limitada por el número de escenarios seleccionados). Usa `--concurrency <count>` para ajustar el número de workers, o `--concurrency 1` para el carril serial anterior.
  - Sale con un código distinto de cero cuando cualquier escenario falla. Usa `--allow-failures` cuando quieras artefactos sin un código de salida fallido.
  - Admite los modos de proveedor `live-frontier`, `mock-openai` y `aimock`. `aimock` inicia un servidor de proveedor local respaldado por AIMock para cobertura experimental de fixtures y mocks de protocolo sin reemplazar el carril `mock-openai` consciente de los escenarios.
- `pnpm test:plugins:kitchen-sink-live`
  - Ejecuta la prueba intensiva en vivo del plugin OpenAI Kitchen Sink mediante QA Lab. Instala el paquete externo Kitchen Sink, verifica el inventario de la superficie del SDK de plugins, sondea `/healthz` y `/readyz`, registra evidencia de CPU/RSS del Gateway, ejecuta un turno en vivo de OpenAI y comprueba diagnósticos adversariales. Requiere autenticación en vivo de OpenAI, como `OPENAI_API_KEY`. En sesiones de Testbox hidratadas, carga automáticamente el perfil de autenticación en vivo de Testbox cuando el helper `openclaw-testbox-env` está presente.
- `pnpm test:gateway:cpu-scenarios`
  - Ejecuta el benchmark de inicio del Gateway más un pequeño paquete de escenarios mock de QA Lab (`channel-chat-baseline`, `memory-failure-fallback`, `gateway-restart-inflight-run`) y escribe un resumen combinado de observación de CPU bajo `.artifacts/gateway-cpu-scenarios/`.
  - Marca de forma predeterminada solo observaciones sostenidas de CPU alta (`--cpu-core-warn` más `--hot-wall-warn-ms`), por lo que las ráfagas breves de inicio se registran como métricas sin parecerse a la regresión de Gateway fijado durante minutos.
  - Usa artefactos construidos de `dist`; ejecuta primero una compilación cuando el checkout aún no tenga salida de runtime reciente.
- `pnpm openclaw qa suite --runner multipass`
  - Ejecuta el mismo conjunto de QA dentro de una VM Linux desechable de Multipass.
  - Mantiene el mismo comportamiento de selección de escenarios que `qa suite` en el host.
  - Reutiliza las mismas flags de selección de proveedor/modelo que `qa suite`.
  - Las ejecuciones en vivo reenvían las entradas de autenticación de QA admitidas que son prácticas para el invitado: claves de proveedor basadas en env, la ruta de configuración del proveedor en vivo de QA y `CODEX_HOME` cuando está presente.
  - Los directorios de salida deben permanecer bajo la raíz del repositorio para que el invitado pueda escribir de vuelta mediante el workspace montado.
  - Escribe el informe y el resumen normales de QA más los logs de Multipass bajo `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia el sitio de QA respaldado por Docker para trabajo de QA de estilo operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Construye un tarball npm desde el checkout actual, lo instala globalmente en Docker, ejecuta onboarding no interactivo con clave de API de OpenAI, configura Telegram de forma predeterminada, verifica que el runtime del plugin empaquetado cargue sin reparación de dependencias de inicio, ejecuta doctor y ejecuta un turno de agente local contra un endpoint mock de OpenAI.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para ejecutar el mismo carril de instalación empaquetada con Discord.
- `pnpm test:docker:session-runtime-context`
  - Ejecuta un smoke determinista de Docker de la app construida para transcripciones con contexto de runtime incrustado. Verifica que el contexto de runtime oculto de OpenClaw se persista como un mensaje personalizado que no se muestra en lugar de filtrarse al turno visible del usuario, luego siembra un JSONL de sesión rota afectada y verifica que `openclaw doctor --fix` lo reescriba a la rama activa con una copia de seguridad.
- `pnpm test:docker:npm-telegram-live`
  - Instala un candidato de paquete de OpenClaw en Docker, ejecuta onboarding del paquete instalado, configura Telegram mediante la CLI instalada y luego reutiliza el carril de QA en vivo de Telegram con ese paquete instalado como el Gateway del SUT.
  - Usa de forma predeterminada `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; define `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` o `OPENCLAW_CURRENT_PACKAGE_TGZ` para probar un tarball local resuelto en lugar de instalar desde el registro.
  - Usa las mismas credenciales env de Telegram o fuente de credenciales de Convex que `pnpm openclaw qa telegram`. Para automatización de CI/release, define `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` más `OPENCLAW_QA_CONVEX_SITE_URL` y el secreto de rol. Si `OPENCLAW_QA_CONVEX_SITE_URL` y un secreto de rol de Convex están presentes en CI, el wrapper selecciona Convex automáticamente.
  - El wrapper valida las credenciales env de Telegram o Convex en el host antes del trabajo de build/install de Docker. Define `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` solo cuando depures deliberadamente la configuración previa a las credenciales.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` anula el `OPENCLAW_QA_CREDENTIAL_ROLE` compartido solo para este carril.
  - GitHub Actions expone este carril como el workflow manual de maintainers `NPM Telegram Beta E2E`. No se ejecuta al fusionar. El workflow usa el entorno `qa-live-shared` y leases de credenciales de CI de Convex.
- GitHub Actions también expone `Package Acceptance` para prueba de producto en ejecución lateral contra un paquete candidato. Acepta un ref de confianza, una especificación npm publicada, una URL HTTPS de tarball más SHA-256, o un artefacto tarball de otra ejecución, sube el `openclaw-current.tgz` normalizado como `package-under-test` y luego ejecuta el planificador Docker E2E existente con perfiles de carril smoke, package, product, full o custom. Define `telegram_mode=mock-openai` o `live-frontier` para ejecutar el workflow de QA de Telegram contra el mismo artefacto `package-under-test`.
  - Prueba de producto de la beta más reciente:

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

- La prueba con artefacto descarga un artefacto tarball desde otra ejecución de Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Empaqueta e instala la build actual de OpenClaw en Docker, inicia el Gateway con OpenAI configurado y luego habilita canales/plugins incluidos mediante ediciones de configuración.
  - Verifica que el descubrimiento de configuración deje ausentes los plugins descargables no configurados, que la primera reparación configurada de doctor instale explícitamente cada plugin descargable faltante y que un segundo reinicio no ejecute reparación de dependencias oculta.
  - También instala una base npm anterior conocida, habilita Telegram antes de ejecutar `openclaw update --tag <candidate>` y verifica que el doctor posterior a la actualización del candidato limpie residuos de dependencias de plugins heredados sin una reparación postinstall del lado del harness.
- `pnpm test:parallels:npm-update`
  - Ejecuta el smoke nativo de actualización de instalación empaquetada en invitados de Parallels. Cada plataforma seleccionada instala primero el paquete base solicitado, luego ejecuta el comando `openclaw update` instalado en el mismo invitado y verifica la versión instalada, el estado de actualización, la preparación del Gateway y un turno de agente local.
  - Usa `--platform macos`, `--platform windows` o `--platform linux` mientras iteras en un invitado. Usa `--json` para la ruta del artefacto de resumen y el estado por carril.
  - El carril de OpenAI usa `openai/gpt-5.5` de forma predeterminada para la prueba de turno de agente en vivo. Pasa `--model <provider/model>` o define `OPENCLAW_PARALLELS_OPENAI_MODEL` cuando valides deliberadamente otro modelo de OpenAI.
  - Envuelve ejecuciones locales largas en un timeout del host para que los bloqueos de transporte de Parallels no consuman el resto de la ventana de pruebas:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - El script escribe logs de carril anidados bajo `/tmp/openclaw-parallels-npm-update.*`. Inspecciona `windows-update.log`, `macos-update.log` o `linux-update.log` antes de asumir que el wrapper externo está colgado.
  - La actualización de Windows puede pasar de 10 a 15 minutos en doctor posterior a la actualización y trabajo de actualización de paquetes en un invitado frío; eso sigue siendo saludable cuando el log de depuración npm anidado avanza.
  - No ejecutes este wrapper agregado en paralelo con carriles smoke individuales de macOS, Windows o Linux de Parallels. Comparten estado de VM y pueden colisionar en la restauración de snapshots, el servicio de paquetes o el estado del Gateway invitado.
  - La prueba posterior a la actualización ejecuta la superficie normal de plugins incluidos porque las fachadas de capacidad como voz, generación de imágenes y comprensión de medios se cargan mediante APIs de runtime incluidas incluso cuando el turno del agente en sí solo comprueba una respuesta de texto simple.

- `pnpm openclaw qa aimock`
  - Inicia solo el servidor de proveedor local AIMock para pruebas smoke directas de protocolo.
- `pnpm openclaw qa matrix`
  - Ejecuta el carril de QA en vivo de Matrix contra un homeserver Tuwunel desechable respaldado por Docker. Solo checkout de código fuente: las instalaciones empaquetadas no distribuyen `qa-lab`.
  - CLI completa, catálogo de perfiles/escenarios, env vars y disposición de artefactos: [QA de Matrix](/es/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Ejecuta el carril de QA en vivo de Telegram contra un grupo privado real usando los tokens de bot del driver y del SUT desde env.
  - Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. El id del grupo debe ser el id numérico del chat de Telegram.
  - Admite `--credential-source convex` para credenciales agrupadas compartidas. Usa el modo env de forma predeterminada, o define `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases agrupados.
  - Sale con un código distinto de cero cuando cualquier escenario falla. Usa `--allow-failures` cuando quieras artefactos sin un código de salida fallido.
  - Requiere dos bots distintos en el mismo grupo privado, con el bot SUT exponiendo un nombre de usuario de Telegram.
  - Para una observación estable de bot a bot, habilita Bot-to-Bot Communication Mode en `@BotFather` para ambos bots y asegúrate de que el bot driver pueda observar el tráfico de bots del grupo.
  - Escribe un informe de QA de Telegram, un resumen y un artefacto de mensajes observados bajo `.artifacts/qa-e2e/...`. Los escenarios de respuesta incluyen RTT desde la solicitud de envío del driver hasta la respuesta observada del SUT.

Los carriles de transporte en vivo comparten un contrato estándar para que los nuevos transportes no diverjan; la matriz de cobertura por carril vive en [resumen de QA → Cobertura de transporte en vivo](/es/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` es el conjunto sintético amplio y no forma parte de esa matriz.

### Credenciales compartidas de Telegram mediante Convex (v1)

Cuando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para `openclaw qa telegram`, QA lab adquiere un lease exclusivo de un pool respaldado por Convex, envía Heartbeat de ese lease mientras el carril se está ejecutando y libera el lease al apagar.

Scaffold de referencia del proyecto Convex:

- `qa/convex-credential-broker/`

Env vars obligatorias:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por ejemplo `https://your-deployment.convex.site`)
- Un secreto para el rol seleccionado:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Selección de rol de credenciales:
  - CLI: `--credential-role maintainer|ci`
  - Valor predeterminado de env: `OPENCLAW_QA_CREDENTIAL_ROLE` (por defecto `ci` en CI, `maintainer` en caso contrario)

Env vars opcionales:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predeterminado `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predeterminado `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predeterminado `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predeterminado `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predeterminado `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de traza opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs de Convex `http://` de loopback para desarrollo solo local.

`OPENCLAW_QA_CONVEX_SITE_URL` debe usar `https://` en operación normal.

Los comandos de administración para mantenedores (pool add/remove/list) requieren
específicamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Ayudantes de CLI para mantenedores:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `doctor` antes de ejecuciones en vivo para comprobar la URL del sitio Convex, los secretos del broker,
el prefijo del endpoint, el tiempo de espera HTTP y el alcance de admin/list sin imprimir
valores secretos. Usa `--json` para salida legible por máquinas en scripts y utilidades de CI.

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
  - Guarda de concesión activa: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo secreto de mantenedor)
  - Solicitud: `{ kind?, status?, includePayload?, limit? }`
  - Éxito: `{ status: "ok", credentials, count }`

Forma de la carga útil para el tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` debe ser una cadena de id de chat numérico de Telegram.
- `admin/add` valida esta forma para `kind: "telegram"` y rechaza cargas útiles mal formadas.

### Agregar un canal a QA

La arquitectura y los nombres de ayudantes de escenario para nuevos adaptadores de canal están en [descripción general de QA → Agregar un canal](/es/concepts/qa-e2e-automation#adding-a-channel). El mínimo requerido: implementar el ejecutor de transporte en la interfaz compartida del host `qa-lab`, declarar `qaRunners` en el manifiesto del plugin, montar como `openclaw qa <runner>` y escribir escenarios en `qa/scenarios/`.

## Suites de pruebas (qué se ejecuta dónde)

Piensa en las suites como "realismo creciente" (y costo/inestabilidad crecientes):

### Unitarias / integración (predeterminado)

- Comando: `pnpm test`
- Configuración: las ejecuciones sin objetivo usan el conjunto de fragmentos `vitest.full-*.config.ts` y pueden expandir fragmentos multiproyecto en configuraciones por proyecto para planificación paralela
- Archivos: inventarios core/unit bajo `src/**/*.test.ts`, `packages/**/*.test.ts` y `test/**/*.test.ts`; las pruebas unitarias de UI se ejecutan en el fragmento dedicado `unit-ui`
- Alcance:
  - Pruebas unitarias puras
  - Pruebas de integración en proceso (autenticación de Gateway, enrutamiento, herramientas, análisis, configuración)
  - Regresiones deterministas para errores conocidos
- Expectativas:
  - Se ejecuta en CI
  - No requiere claves reales
  - Debe ser rápido y estable
  - Las pruebas del resolvedor y del cargador de superficie pública deben demostrar el comportamiento amplio de fallback de `api.js` y
    `runtime-api.js` con fixtures de Plugin diminutos generados, no con
    APIs de origen reales de plugins incluidos. Las cargas de API de Plugin reales pertenecen a
    suites de contrato/integración propiedad del Plugin.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - `pnpm test` sin objetivo ejecuta doce configuraciones de fragmento más pequeñas (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) en lugar de un único proceso gigante de proyecto raíz nativo. Esto reduce el pico de RSS en máquinas cargadas y evita que el trabajo de auto-reply/extensión prive de recursos a suites no relacionadas.
    - `pnpm test --watch` sigue usando el grafo de proyectos raíz nativo `vitest.config.ts`, porque un ciclo de observación multifragmento no es práctico.
    - `pnpm test`, `pnpm test:watch` y `pnpm test:perf:imports` enrutan primero objetivos explícitos de archivo/directorio mediante carriles acotados, de modo que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar todo el costo de arranque del proyecto raíz.
    - `pnpm test:changed` expande rutas git modificadas a carriles acotados baratos de forma predeterminada: ediciones directas de pruebas, archivos hermanos `*.test.ts`, asignaciones explícitas de origen y dependientes locales del grafo de importación. Las ediciones de configuración/setup/package no ejecutan pruebas de forma amplia a menos que uses explícitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` es la compuerta normal de comprobación local inteligente para trabajo estrecho. Clasifica el diff en core, pruebas de core, extensiones, pruebas de extensión, apps, docs, metadatos de lanzamiento, herramientas Docker en vivo y tooling, y luego ejecuta los comandos de typecheck, lint y guardia correspondientes. No ejecuta pruebas Vitest; llama a `pnpm test:changed` o a `pnpm test <target>` explícito como prueba. Los aumentos de versión solo de metadatos de lanzamiento ejecutan comprobaciones dirigidas de versión/configuración/dependencias raíz, con una guardia que rechaza cambios de package fuera del campo de versión de nivel superior.
    - Las ediciones del arnés ACP de Docker en vivo ejecutan comprobaciones enfocadas: sintaxis de shell para los scripts de autenticación de Docker en vivo y una ejecución en seco del planificador Docker en vivo. Los cambios de `package.json` se incluyen solo cuando el diff se limita a `scripts["test:docker:live-*"]`; las ediciones de dependencias, exportaciones, versión y otras superficies de package siguen usando las guardias más amplias.
    - Las pruebas unitarias livianas en importación de agentes, comandos, plugins, ayudantes de auto-reply, `plugin-sdk` y áreas de utilidades puras similares se enrutan por el carril `unit-fast`, que omite `test/setup-openclaw-runtime.ts`; los archivos con estado o pesados en runtime permanecen en los carriles existentes.
    - Archivos de origen de ayudantes seleccionados de `plugin-sdk` y `commands` también asignan ejecuciones en modo changed a pruebas hermanas explícitas en esos carriles livianos, de modo que las ediciones de ayudantes evitan volver a ejecutar toda la suite pesada de ese directorio.
    - `auto-reply` tiene cubos dedicados para ayudantes core de nivel superior, pruebas de integración `reply.*` de nivel superior y el subárbol `src/auto-reply/reply/**`. CI además divide el subárbol reply en fragmentos de agent-runner, dispatch y commands/state-routing para que un cubo pesado en importaciones no posea toda la cola de Node.
    - CI normal de PR/main omite intencionalmente el barrido por lotes de extensiones y el fragmento `agentic-plugins` solo de lanzamiento. Full Release Validation despacha el flujo hijo separado `Plugin Prerelease` para esas suites pesadas en plugins/extensiones en candidatos de lanzamiento.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Cuando cambies entradas de descubrimiento de herramientas de mensajes o contexto de runtime de Compaction,
      conserva ambos niveles de cobertura.
    - Agrega regresiones enfocadas de ayudantes para límites puros de enrutamiento y normalización.
    - Mantén saludables las suites de integración del ejecutor integrado:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` y
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Esas suites verifican que los ids acotados y el comportamiento de Compaction sigan fluyendo
      por las rutas reales `run.ts` / `compact.ts`; las pruebas solo de ayudantes
      no son un sustituto suficiente para esas rutas de integración.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - La configuración base de Vitest usa `threads` de forma predeterminada.
    - La configuración compartida de Vitest fija `isolate: false` y usa el
      ejecutor no aislado en los proyectos raíz, e2e y configuraciones live.
    - El carril UI raíz conserva su setup y optimizador de `jsdom`, pero también se ejecuta en el
      ejecutor compartido no aislado.
    - Cada fragmento de `pnpm test` hereda los mismos valores predeterminados `threads` + `isolate: false`
      de la configuración compartida de Vitest.
    - `scripts/run-vitest.mjs` agrega `--no-maglev` para procesos Node hijos de Vitest
      de forma predeterminada para reducir el churn de compilación de V8 durante ejecuciones locales grandes.
      Establece `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar con el comportamiento estándar de V8.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` muestra qué carriles arquitectónicos activa un diff.
    - El hook de pre-commit solo formatea. Vuelve a preparar archivos formateados y
      no ejecuta lint, typecheck ni pruebas.
    - Ejecuta `pnpm check:changed` explícitamente antes de la entrega o push cuando
      necesites la compuerta de comprobación local inteligente.
    - `pnpm test:changed` se enruta por carriles acotados baratos de forma predeterminada. Usa
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el agente
      decida que una edición de arnés, configuración, package o contrato realmente necesita una
      cobertura Vitest más amplia.
    - `pnpm test:max` y `pnpm test:changed:max` mantienen el mismo comportamiento de enrutamiento,
      solo con un límite de workers más alto.
    - El autoescalado de workers locales es intencionalmente conservador y retrocede
      cuando el promedio de carga del host ya es alto, por lo que varias ejecuciones
      Vitest concurrentes causan menos daño de forma predeterminada.
    - La configuración base de Vitest marca los proyectos/archivos de configuración como
      `forceRerunTriggers` para que las reejecuciones en modo changed sigan siendo correctas cuando cambia el
      cableado de pruebas.
    - La configuración mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado en hosts compatibles;
      establece `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si quieres
      una ubicación de caché explícita para perfilado directo.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` habilita los informes de duración de importación de Vitest además de
      la salida de desglose de importaciones.
    - `pnpm test:perf:imports:changed` acota la misma vista de perfilado a
      archivos modificados desde `origin/main`.
    - Los datos de tiempos de fragmentos se escriben en `.artifacts/vitest-shard-timings.json`.
      Las ejecuciones de configuración completa usan la ruta de configuración como clave; los fragmentos de CI
      con patrón de inclusión agregan el nombre del fragmento para que los fragmentos filtrados puedan rastrearse
      por separado.
    - Cuando una prueba caliente sigue pasando la mayor parte del tiempo en importaciones de arranque,
      mantén las dependencias pesadas detrás de una interfaz local estrecha `*.runtime.ts` y
      simula esa interfaz directamente en lugar de importar profundamente ayudantes de runtime solo
      para pasarlos por `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara `test:changed`
      enrutado contra la ruta nativa de proyecto raíz para ese diff confirmado
      e imprime tiempo de reloj y RSS máximo de macOS.
    - `pnpm test:perf:changed:bench -- --worktree` mide el árbol sucio actual
      enrutando la lista de archivos modificados por
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
  - Impulsa rotación sintética de mensajes de Gateway, memoria y cargas útiles grandes por la ruta de eventos de diagnóstico
  - Consulta `diagnostics.stability` mediante el RPC WS de Gateway
  - Cubre ayudantes de persistencia del paquete de estabilidad diagnóstica
  - Afirma que el registrador permanece acotado, las muestras RSS sintéticas se mantienen por debajo del presupuesto de presión y las profundidades de cola por sesión vuelven a cero
- Expectativas:
  - Seguro para CI y sin claves
  - Carril estrecho para seguimiento de regresiones de estabilidad, no un sustituto de la suite completa de Gateway

### E2E (smoke de Gateway)

- Comando: `pnpm test:e2e`
- Configuración: `vitest.e2e.config.ts`
- Archivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` y pruebas E2E de Plugins incluidos en `extensions/`
- Valores predeterminados de runtime:
  - Usa `threads` de Vitest con `isolate: false`, coincidiendo con el resto del repositorio.
  - Usa workers adaptativos (CI: hasta 2, local: 1 de forma predeterminada).
  - Se ejecuta en modo silencioso de forma predeterminada para reducir la sobrecarga de E/S de consola.
- Sobrescrituras útiles:
  - `OPENCLAW_E2E_WORKERS=<n>` para forzar el recuento de workers (limitado a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para volver a habilitar la salida detallada de consola.
- Alcance:
  - Comportamiento end-to-end de Gateway multiinstancia
  - Superficies WebSocket/HTTP, emparejamiento de nodos y redes más pesadas
- Expectativas:
  - Se ejecuta en CI (cuando está habilitado en la pipeline)
  - No requiere claves reales
  - Más piezas móviles que las pruebas unitarias (puede ser más lento)

### E2E: smoke del backend de OpenShell

- Comando: `pnpm test:e2e:openshell`
- Archivo: `extensions/openshell/src/backend.e2e.test.ts`
- Alcance:
  - Inicia un Gateway OpenShell aislado en el host mediante Docker
  - Crea un sandbox desde un Dockerfile local temporal
  - Ejercita el backend OpenShell de OpenClaw sobre `sandbox ssh-config` real + ejecución SSH
  - Verifica el comportamiento de sistema de archivos canónico remoto mediante el puente fs del sandbox
- Expectativas:
  - Solo opt-in; no forma parte de la ejecución predeterminada de `pnpm test:e2e`
  - Requiere una CLI `openshell` local y un daemon de Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` aislados, y luego destruye el Gateway y el sandbox de prueba
- Sobrescrituras útiles:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar la prueba al ejecutar manualmente la suite e2e más amplia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apuntar a un binario CLI no predeterminado o a un script envoltorio

### Live (proveedores reales + modelos reales)

- Comando: `pnpm test:live`
- Configuración: `vitest.live.config.ts`
- Archivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` y pruebas live de Plugins incluidos en `extensions/`
- Valor predeterminado: **habilitado** por `pnpm test:live` (establece `OPENCLAW_LIVE_TEST=1`)
- Alcance:
  - "¿Este proveedor/modelo funciona realmente _hoy_ con credenciales reales?"
  - Detectar cambios de formato del proveedor, particularidades de tool-calling, problemas de autenticación y comportamiento de límites de tasa
- Expectativas:
  - No es estable para CI por diseño (redes reales, políticas reales de proveedores, cuotas, caídas)
  - Cuesta dinero / usa límites de tasa
  - Prefiere ejecutar subconjuntos acotados en lugar de "todo"
- Las ejecuciones live cargan `~/.profile` para recoger claves de API faltantes.
- De forma predeterminada, las ejecuciones live siguen aislando `HOME` y copian material de configuración/autenticación en un directorio home de prueba temporal para que los fixtures unitarios no puedan mutar tu `~/.openclaw` real.
- Establece `OPENCLAW_LIVE_USE_REAL_HOME=1` solo cuando necesites intencionalmente que las pruebas live usen tu directorio home real.
- `pnpm test:live` ahora usa de forma predeterminada un modo más silencioso: mantiene la salida de progreso `[live] ...`, pero suprime el aviso adicional de `~/.profile` y silencia los logs de arranque del Gateway/la actividad de Bonjour. Establece `OPENCLAW_LIVE_TEST_QUIET=0` si quieres recuperar todos los logs de inicio.
- Rotación de claves de API (específica por proveedor): establece `*_API_KEYS` con formato de comas/punto y coma o `*_API_KEY_1`, `*_API_KEY_2` (por ejemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) o una sobrescritura por prueba live mediante `OPENCLAW_LIVE_*_KEY`; las pruebas reintentan ante respuestas de límite de tasa.
- Salida de progreso/Heartbeat:
  - Las suites live ahora emiten líneas de progreso a stderr para que las llamadas largas a proveedores se vean activas incluso cuando la captura de consola de Vitest está silenciosa.
  - `vitest.live.config.ts` deshabilita la intercepción de consola de Vitest para que las líneas de progreso de proveedor/Gateway se transmitan inmediatamente durante las ejecuciones live.
  - Ajusta los Heartbeats de modelo directo con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajusta los Heartbeats de Gateway/sonda con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## ¿Qué suite debería ejecutar?

Usa esta tabla de decisión:

- Editar lógica/pruebas: ejecuta `pnpm test` (y `pnpm test:coverage` si cambiaste mucho)
- Tocar redes del Gateway / protocolo WS / emparejamiento: añade `pnpm test:e2e`
- Depurar "mi bot está caído" / fallos específicos de proveedor / tool calling: ejecuta un `pnpm test:live` acotado

## Pruebas live (que tocan la red)

Para la matriz de modelos live, smokes de backend CLI, smokes ACP, arnés de servidor de app Codex
y todas las pruebas live de proveedores de medios (Deepgram, BytePlus, ComfyUI, imagen,
música, vídeo, arnés de medios), además del manejo de credenciales para ejecuciones live, consulta
[Probar suites live](/es/help/testing-live). Para la lista de verificación dedicada de actualizaciones y
validación de Plugins, consulta
[Probar actualizaciones y Plugins](/es/help/testing-updates-plugins).

## Runners Docker (comprobaciones opcionales de "funciona en Linux")

Estos runners Docker se dividen en dos grupos:

- Runners de modelos live: `test:docker:live-models` y `test:docker:live-gateway` ejecutan solo su archivo live de claves de perfil coincidente dentro de la imagen Docker del repositorio (`src/agents/models.profiles.live.test.ts` y `src/gateway/gateway-models.profiles.live.test.ts`), montando tu directorio de configuración local y el workspace (y cargando `~/.profile` si está montado). Los puntos de entrada locales coincidentes son `test:live:models-profiles` y `test:live:gateway-profiles`.
- Los runners live de Docker usan de forma predeterminada un límite de smoke más pequeño para que un barrido Docker completo siga siendo práctico:
  `test:docker:live-models` usa de forma predeterminada `OPENCLAW_LIVE_MAX_MODELS=12`, y
  `test:docker:live-gateway` usa de forma predeterminada `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` y
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sobrescribe esas variables de entorno cuando
  quieras explícitamente el escaneo exhaustivo más grande.
- `test:docker:all` compila la imagen Docker live una vez mediante `test:docker:live-build`, empaqueta OpenClaw una vez como tarball npm mediante `scripts/package-openclaw-for-docker.mjs` y luego compila/reutiliza dos imágenes `scripts/e2e/Dockerfile`. La imagen base es solo el runner Node/Git para carriles de instalación/actualización/dependencias de Plugins; esos carriles montan el tarball precompilado. La imagen funcional instala el mismo tarball en `/app` para carriles de funcionalidad de la app compilada. Las definiciones de carriles Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`; la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ejecuta el plan seleccionado. El agregado usa un planificador local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla los slots de proceso, mientras que los límites de recursos evitan que todos los carriles pesados live, npm-install y multiservicio empiecen a la vez. Si un solo carril es más pesado que los límites activos, el planificador aún puede iniciarlo cuando el pool está vacío y luego lo mantiene ejecutándose solo hasta que vuelva a haber capacidad disponible. Los valores predeterminados son 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` y `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajusta `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` solo cuando el host Docker tenga más margen. El runner realiza un preflight de Docker de forma predeterminada, elimina contenedores OpenClaw E2E obsoletos, imprime estado cada 30 segundos, almacena los timings de carriles exitosos en `.artifacts/docker-tests/lane-timings.json` y usa esos timings para iniciar primero los carriles más largos en ejecuciones posteriores. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir el manifiesto de carriles ponderado sin compilar ni ejecutar Docker, o `node scripts/test-docker-all.mjs --plan-json` para imprimir el plan de CI de los carriles seleccionados, necesidades de paquete/imagen y credenciales.
- `Package Acceptance` es la compuerta de paquete nativa de GitHub para "¿este tarball instalable funciona como producto?" Resuelve un paquete candidato desde `source=npm`, `source=ref`, `source=url` o `source=artifact`, lo sube como `package-under-test` y luego ejecuta los carriles Docker E2E reutilizables contra ese tarball exacto en lugar de reempaquetar la ref seleccionada. Los perfiles están ordenados por amplitud: `smoke`, `package`, `product` y `full`. Consulta [Probar actualizaciones y Plugins](/es/help/testing-updates-plugins) para el contrato de paquete/actualización/Plugin, la matriz de supervivencia de actualización publicada, los valores predeterminados de release y el triaje de fallos.
- Las comprobaciones de compilación y release ejecutan `scripts/check-cli-bootstrap-imports.mjs` después de tsdown. La guarda recorre el grafo compilado estático desde `dist/entry.js` y `dist/cli/run-main.js` y falla si el arranque previo al despacho importa dependencias de paquete como Commander, interfaz de prompts, undici o logging antes del despacho de comandos; también mantiene el chunk de ejecución del Gateway incluido dentro del presupuesto y rechaza imports estáticos de rutas frías conocidas del Gateway. El smoke de CLI empaquetada también cubre ayuda raíz, ayuda de onboard, ayuda de doctor, estado, esquema de configuración y un comando de lista de modelos.
- La compatibilidad heredada de Package Acceptance está limitada a `2026.4.25` (`2026.4.25-beta.*` incluido). Hasta ese punto de corte, el arnés tolera solo brechas de metadatos de paquetes ya publicados: entradas privadas de inventario QA omitidas, `gateway install --wrapper` faltante, archivos de parche faltantes en el fixture git derivado del tarball, `update.channel` persistido faltante, ubicaciones heredadas de registros de instalación de Plugins, persistencia faltante de registros de instalación del marketplace y migración de metadatos de configuración durante `plugins update`. Para paquetes posteriores a `2026.4.25`, esas rutas son fallos estrictos.
- Runners smoke de contenedores: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` y `test:docker:config-reload` arrancan uno o más contenedores reales y verifican rutas de integración de nivel superior.

Los runners Docker de modelos live también montan con bind solo los directorios home de autenticación CLI necesarios (o todos los compatibles cuando la ejecución no está acotada), y luego los copian al home del contenedor antes de la ejecución para que OAuth de CLI externa pueda actualizar tokens sin mutar el almacén de autenticación del host:

- Modelos directos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Prueba smoke de vinculación ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; cubre Claude, Codex y Gemini de forma predeterminada, con cobertura estricta de Droid/OpenCode mediante `pnpm test:docker:live-acp-bind:droid` y `pnpm test:docker:live-acp-bind:opencode`)
- Prueba smoke del backend de CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Prueba smoke del arnés del servidor de app de Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desarrollo: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Prueba smoke de observabilidad: `pnpm qa:otel:smoke` es una vía privada de QA para checkout de código fuente. Intencionadamente no forma parte de las vías de lanzamiento Docker de paquete porque el tarball de npm omite QA Lab.
- Prueba smoke en vivo de Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Asistente de incorporación (TTY, andamiaje completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Prueba smoke de incorporación/canal/agente del tarball de npm: `pnpm test:docker:npm-onboard-channel-agent` instala globalmente en Docker el tarball empaquetado de OpenClaw, configura OpenAI mediante incorporación con referencia de entorno y Telegram de forma predeterminada, ejecuta doctor y ejecuta un turno de agente OpenAI simulado. Reutiliza un tarball precompilado con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la recompilación del host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, o cambia de canal con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` o `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Prueba smoke de cambio de canal de actualización: `pnpm test:docker:update-channel-switch` instala globalmente en Docker el tarball empaquetado de OpenClaw, cambia del paquete `stable` a git `dev`, verifica que el canal persistido y el Plugin posterior a la actualización funcionen, luego vuelve al paquete `stable` y comprueba el estado de actualización.
- Prueba smoke de supervivencia de actualización: `pnpm test:docker:upgrade-survivor` instala el tarball empaquetado de OpenClaw sobre un fixture sucio de usuario antiguo con agentes, configuración de canal, listas de permitidos de Plugin, estado obsoleto de dependencias de Plugin y archivos existentes de espacio de trabajo/sesión. Ejecuta actualización de paquete y doctor no interactivo sin claves de proveedor en vivo ni de canal, luego inicia un Gateway local loopback y comprueba la preservación de configuración/estado y los presupuestos de inicio/estado.
- Prueba smoke publicada de supervivencia de actualización: `pnpm test:docker:published-upgrade-survivor` instala `openclaw@latest` de forma predeterminada, siembra archivos realistas de usuario existente, configura esa línea base con una receta de comandos incorporada, valida la configuración resultante, actualiza esa instalación publicada al tarball candidato, ejecuta doctor no interactivo, escribe `.artifacts/upgrade-survivor/summary.json`, luego inicia un Gateway local loopback y comprueba los intents configurados, la preservación de estado, el inicio, `/healthz`, `/readyz` y los presupuestos de estado RPC. Sobrescribe una línea base con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, pide al planificador agregado que expanda líneas base locales exactas con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` como `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, y expande fixtures con forma de issue con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` como `reported-issues`; el conjunto reported-issues incluye `configured-plugin-installs` para la reparación automática de instalaciones externas de Plugin de OpenClaw. Package Acceptance expone esas opciones como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` y `published_upgrade_survivor_scenarios`, resuelve tokens de línea base meta como `last-stable-4` o `all-since-2026.4.23`, y Full Release Validation expande la puerta de paquete de remojo de lanzamiento a `last-stable-4 2026.4.23 2026.5.2 2026.4.15` más `reported-issues`.
- Prueba smoke de contexto de runtime de sesión: `pnpm test:docker:session-runtime-context` verifica la persistencia oculta del transcript de contexto de runtime más la reparación de doctor de las ramas duplicadas afectadas de reescritura de prompt.
- Prueba smoke de instalación global con Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empaqueta el árbol actual, lo instala con `bun install -g` en un home aislado y verifica que `openclaw infer image providers --json` devuelva proveedores de imagen empaquetados en vez de quedarse colgado. Reutiliza un tarball precompilado con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la compilación del host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, o copia `dist/` desde una imagen Docker compilada con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Prueba smoke del instalador en Docker: `bash scripts/test-install-sh-docker.sh` comparte una caché npm entre sus contenedores root, update y direct-npm. La prueba smoke de actualización usa por defecto npm `latest` como línea base stable antes de actualizar al tarball candidato. Sobrescribe con `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localmente, o con la entrada `update_baseline_version` del flujo Install Smoke en GitHub. Las comprobaciones del instalador sin root mantienen una caché npm aislada para que las entradas de caché propiedad de root no oculten el comportamiento de instalación local de usuario. Define `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar la caché root/update/direct-npm en nuevas ejecuciones locales.
- Install Smoke CI omite la actualización global direct-npm duplicada con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; ejecuta el script localmente sin esa variable de entorno cuando se necesite cobertura directa de `npm install -g`.
- Prueba smoke de CLI para eliminar espacios de trabajo compartidos de agentes: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila la imagen Dockerfile raíz de forma predeterminada, siembra dos agentes con un espacio de trabajo en un home de contenedor aislado, ejecuta `agents delete --json` y verifica JSON válido más el comportamiento de espacio de trabajo retenido. Reutiliza la imagen install-smoke con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Redes de Gateway (dos contenedores, autenticación WS + salud): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Prueba smoke de snapshot CDP de navegador: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila la imagen E2E de código fuente más una capa de Chromium, inicia Chromium con CDP bruto, ejecuta `browser doctor --deep` y verifica que los snapshots de rol de CDP cubran URL de enlaces, elementos clicables promovidos por cursor, referencias de iframe y metadatos de frame.
- Regresión de razonamiento mínimo de OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) ejecuta un servidor OpenAI simulado a través de Gateway, verifica que `web_search` eleve `reasoning.effort` de `minimal` a `low`, luego fuerza el rechazo del esquema del proveedor y comprueba que el detalle bruto aparezca en los registros de Gateway.
- Puente de canal MCP (Gateway sembrado + puente stdio + prueba smoke de frame de notificación Claude bruto): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Herramientas MCP del paquete Pi (servidor MCP stdio real + prueba smoke de permitir/denegar de perfil Pi integrado): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Limpieza MCP de Cron/subagente (Gateway real + desmontaje de hijo MCP stdio después de ejecuciones de Cron aislado y subagente de un solo disparo): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (prueba smoke de instalación/actualización para ruta local, `file:`, registro npm con dependencias elevadas, refs móviles de git, ClawHub kitchen-sink, actualizaciones de marketplace y habilitación/inspección de paquete Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Define `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para omitir el bloque de ClawHub, o sobrescribe el par predeterminado paquete/runtime kitchen-sink con `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` y `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sin `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, la prueba usa un servidor fixture local hermético de ClawHub.
- Prueba smoke de actualización de Plugin sin cambios: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Prueba smoke de matriz de ciclo de vida de Plugin: `pnpm test:docker:plugin-lifecycle-matrix` instala el tarball empaquetado de OpenClaw en un contenedor desnudo, instala un Plugin de npm, alterna habilitar/deshabilitar, lo actualiza y degrada mediante un registro npm local, elimina el código instalado, luego verifica que la desinstalación siga eliminando el estado obsoleto mientras registra métricas de RSS/CPU para cada fase del ciclo de vida.
- Prueba smoke de metadatos de recarga de configuración: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` cubre pruebas smoke de instalación/actualización para ruta local, `file:`, registro npm con dependencias elevadas, refs móviles de git, fixtures de ClawHub, actualizaciones de marketplace y habilitación/inspección de paquete Claude. `pnpm test:docker:plugin-update` cubre el comportamiento de actualización sin cambios para Plugins instalados. `pnpm test:docker:plugin-lifecycle-matrix` cubre la instalación, habilitación, deshabilitación, actualización, degradación y desinstalación con código faltante de Plugin npm con seguimiento de recursos.

Para precompilar y reutilizar manualmente la imagen funcional compartida:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Las sobrescrituras de imagen específicas de la suite, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, siguen prevaleciendo cuando se definen. Cuando `OPENCLAW_SKIP_DOCKER_BUILD=1` apunta a una imagen compartida remota, los scripts la descargan si aún no está local. Las pruebas Docker de QR e instalador conservan sus propios Dockerfiles porque validan el comportamiento de paquete/instalación en lugar del runtime de app compilada compartida.

Los runners de Docker para modelos en vivo también montan con bind mount el checkout actual como de solo lectura y
lo preparan en un directorio de trabajo temporal dentro del contenedor. Esto mantiene la imagen de runtime
ligera y, al mismo tiempo, ejecuta Vitest contra tu código fuente/configuración local exacta.
El paso de preparación omite cachés grandes solo locales y salidas de compilación de apps, como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, y directorios de salida `.build` locales de la app o
de Gradle, para que las ejecuciones live de Docker no pasen minutos copiando
artefactos específicos de la máquina.
También establecen `OPENCLAW_SKIP_CHANNELS=1` para que las pruebas live del gateway no inicien
workers de canales reales de Telegram/Discord/etc. dentro del contenedor.
`test:docker:live-models` todavía ejecuta `pnpm test:live`, así que pasa también
`OPENCLAW_LIVE_GATEWAY_*` cuando necesites acotar o excluir la cobertura live de gateway
de ese lane de Docker.
`test:docker:openwebui` es un smoke de compatibilidad de nivel superior: inicia un
contenedor de gateway de OpenClaw con los endpoints HTTP compatibles con OpenAI habilitados,
inicia un contenedor fijado de Open WebUI contra ese gateway, inicia sesión mediante
Open WebUI, verifica que `/api/models` exponga `openclaw/default` y luego envía una
solicitud de chat real a través del proxy `/api/chat/completions` de Open WebUI.
La primera ejecución puede ser notablemente más lenta porque Docker quizá tenga que descargar la
imagen de Open WebUI y Open WebUI quizá tenga que terminar su propia configuración de arranque en frío.
Este lane espera una clave de modelo live utilizable, y `OPENCLAW_PROFILE_FILE`
(`~/.profile` de forma predeterminada) es la forma principal de proporcionarla en ejecuciones dockerizadas.
Las ejecuciones correctas imprimen una pequeña carga JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` es intencionalmente determinista y no necesita una
cuenta real de Telegram, Discord ni iMessage. Arranca un contenedor Gateway
presembrado, inicia un segundo contenedor que lanza `openclaw mcp serve` y luego
verifica el descubrimiento de conversaciones enrutadas, lecturas de transcripciones, metadatos de adjuntos,
comportamiento de la cola de eventos live, enrutamiento de envío saliente y notificaciones de canal +
permisos al estilo Claude sobre el puente MCP stdio real. La verificación de notificaciones
inspecciona directamente los frames MCP stdio sin procesar, de modo que el smoke valida lo que
el puente realmente emite, no solo lo que un SDK de cliente específico llega a exponer.
`test:docker:pi-bundle-mcp-tools` es determinista y no necesita una clave de modelo live.
Compila la imagen Docker del repo, inicia un servidor de prueba MCP stdio real
dentro del contenedor, materializa ese servidor mediante el runtime MCP del bundle Pi
embebido, ejecuta la herramienta y luego verifica que `coding` y `messaging` conserven
las herramientas `bundle-mcp`, mientras que `minimal` y `tools.deny: ["bundle-mcp"]` las filtran.
`test:docker:cron-mcp-cleanup` es determinista y no necesita una clave de modelo live.
Inicia un Gateway presembrado con un servidor de prueba MCP stdio real, ejecuta un
turno de cron aislado y un turno hijo one-shot de `/subagents spawn`, y luego verifica
que el proceso hijo MCP salga después de cada ejecución.

Smoke manual de thread ACP en lenguaje natural (no CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conserva este script para flujos de regresión/depuración. Puede volver a necesitarse para validar el enrutamiento de threads ACP, así que no lo elimines.

Variables de entorno útiles:

- `OPENCLAW_CONFIG_DIR=...` (predeterminado: `~/.openclaw`) montado en `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predeterminado: `~/.openclaw/workspace`) montado en `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predeterminado: `~/.profile`) montado en `/home/node/.profile` y cargado antes de ejecutar pruebas
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar solo variables de entorno cargadas desde `OPENCLAW_PROFILE_FILE`, usando directorios temporales de configuración/espacio de trabajo y sin montajes externos de autenticación de CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predeterminado: `~/.cache/openclaw/docker-cli-tools`) montado en `/home/node/.npm-global` para instalaciones de CLI en caché dentro de Docker
- Los directorios/archivos de autenticación de CLI externos bajo `$HOME` se montan en modo solo lectura bajo `/host-auth...` y luego se copian en `/home/node/...` antes de que empiecen las pruebas
  - Directorios predeterminados: `.minimax`
  - Archivos predeterminados: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Las ejecuciones acotadas por proveedor montan solo los directorios/archivos necesarios inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sobrescribe manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o una lista separada por comas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para acotar la ejecución
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar proveedores dentro del contenedor
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar una imagen `openclaw:local-live` existente en repeticiones que no necesitan recompilación
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para asegurar que las credenciales provengan del almacén de perfiles (no del entorno)
- `OPENCLAW_OPENWEBUI_MODEL=...` para elegir el modelo expuesto por el gateway para el smoke de Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para sobrescribir el prompt de verificación de nonce usado por el smoke de Open WebUI
- `OPENWEBUI_IMAGE=...` para sobrescribir la etiqueta fijada de la imagen de Open WebUI

## Sanidad de docs

Ejecuta comprobaciones de docs después de editar documentación: `pnpm check:docs`.
Ejecuta la validación completa de anchors de Mintlify cuando también necesites comprobaciones de encabezados dentro de la página: `pnpm docs:check-links:anchors`.

## Regresión offline (segura para CI)

Estas son regresiones de "pipeline real" sin proveedores reales:

- Invocación de herramientas de Gateway (OpenAI simulado, gateway real + bucle de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Asistente de configuración de Gateway (WS `wizard.start`/`wizard.next`, escribe config + autenticación aplicada): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evals de confiabilidad de agente (skills)

Ya tenemos algunas pruebas seguras para CI que se comportan como "evals de confiabilidad de agente":

- Invocación de herramientas simulada mediante el Gateway real + bucle de agente (`src/gateway/gateway.test.ts`).
- Flujos de asistente de configuración end-to-end que validan el cableado de sesión y los efectos de config (`src/gateway/gateway.test.ts`).

Lo que aún falta para Skills (consulta [Skills](/es/tools/skills)):

- **Toma de decisiones:** cuando las Skills se listan en el prompt, ¿el agente elige la Skill correcta (o evita las irrelevantes)?
- **Cumplimiento:** ¿el agente lee `SKILL.md` antes de usarla y sigue los pasos/args requeridos?
- **Contratos de workflow:** escenarios multi-turno que afirman el orden de herramientas, el traspaso del historial de sesión y los límites del sandbox.

Las evals futuras deben mantenerse deterministas primero:

- Un runner de escenarios que use proveedores simulados para afirmar llamadas a herramientas + orden, lecturas de archivos de Skill y cableado de sesión.
- Una pequeña suite de escenarios centrados en Skills (usar frente a evitar, gating, inyección de prompts).
- Evals live opcionales (opt-in, gated por env) solo después de que la suite segura para CI esté lista.

## Pruebas de contrato (forma de plugin y canal)

Las pruebas de contrato verifican que cada plugin y canal registrado cumpla su
contrato de interfaz. Iteran sobre todos los plugins descubiertos y ejecutan una suite de
afirmaciones de forma y comportamiento. El lane unitario predeterminado de `pnpm test`
omite intencionalmente estos archivos compartidos de seams y smokes; ejecuta los comandos de contrato explícitamente
cuando toques superficies compartidas de canal o proveedor.

### Comandos

- Todos los contratos: `pnpm test:contracts`
- Solo contratos de canal: `pnpm test:contracts:channels`
- Solo contratos de proveedor: `pnpm test:contracts:plugins`

### Contratos de canal

Ubicados en `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma básica de plugin (id, nombre, capacidades)
- **setup** - Contrato del asistente de configuración
- **session-binding** - Comportamiento de vinculación de sesión
- **outbound-payload** - Estructura de payload de mensaje
- **inbound** - Manejo de mensajes entrantes
- **actions** - Handlers de acciones de canal
- **threading** - Manejo de ID de thread
- **directory** - API de directorio/lista
- **group-policy** - Aplicación de política de grupo

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
- **runtime** - Runtime de proveedor
- **shape** - Forma/interfaz de plugin
- **wizard** - Asistente de configuración

### Cuándo ejecutar

- Después de cambiar exports o subpaths de plugin-sdk
- Después de añadir o modificar un plugin de canal o proveedor
- Después de refactorizar el registro o descubrimiento de plugins

Las pruebas de contrato se ejecutan en CI y no requieren claves de API reales.

## Añadir regresiones (guía)

Cuando corrijas un problema de proveedor/modelo descubierto en live:

- Añade una regresión segura para CI si es posible (proveedor mock/stub, o captura la transformación exacta de la forma de solicitud)
- Si es inherentemente solo live (límites de tasa, políticas de autenticación), mantén la prueba live acotada y opt-in mediante variables de entorno
- Prefiere apuntar a la capa más pequeña que detecte el bug:
  - bug de conversión/replay de solicitud de proveedor → prueba directa de modelos
  - bug de pipeline de sesión/historial/herramientas de gateway → smoke live de gateway o prueba simulada de gateway segura para CI
- Guardrail de recorrido de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un target muestreado por cada clase de SecretRef desde los metadatos del registro (`listSecretTargetRegistryEntries()`), y luego afirma que se rechazan los ids de exec con segmentos de recorrido.
  - Si añades una nueva familia de targets SecretRef `includeInPlan` en `src/secrets/target-registry-data.ts`, actualiza `classifyTargetClass` en esa prueba. La prueba falla intencionalmente con ids de target sin clasificar para que las clases nuevas no puedan omitirse silenciosamente.

## Relacionado

- [Pruebas live](/es/help/testing-live)
- [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins)
- [CI](/es/ci)
