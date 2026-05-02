---
read_when:
    - Ejecutar pruebas localmente o en CI
    - Añadir pruebas de regresión para errores de modelo/proveedor
    - Depuración del comportamiento del Gateway y del agente
summary: 'Kit de pruebas: suites unitarias, e2e y en vivo, ejecutores de Docker y qué cubre cada prueba'
title: Pruebas
x-i18n:
    generated_at: "2026-05-02T20:50:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: a5bfbd2ea78b05ca23e97318943e0043645814d2aa4ccb7540a2bf7c601d0d09
    source_path: help/testing.md
    workflow: 16
---

OpenClaw tiene tres conjuntos de pruebas de Vitest (unitarias/integración, e2e, en vivo) y un pequeño conjunto
de ejecutores de Docker. Este documento es una guía de "cómo probamos":

- Qué cubre cada conjunto de pruebas (y qué _no_ cubre deliberadamente).
- Qué comandos ejecutar para flujos de trabajo comunes (local, antes de push, depuración).
- Cómo las pruebas en vivo descubren credenciales y seleccionan modelos/proveedores.
- Cómo agregar regresiones para problemas reales de modelos/proveedores.

<Note>
**La pila de QA (qa-lab, qa-channel, carriles de transporte en vivo)** se documenta por separado:

- [Resumen de QA](/es/concepts/qa-e2e-automation) — arquitectura, superficie de comandos, creación de escenarios.
- [QA Matrix](/es/concepts/qa-matrix) — referencia para `pnpm openclaw qa matrix`.
- [Canal de QA](/es/channels/qa-channel) — el Plugin de transporte sintético usado por escenarios respaldados por el repositorio.

Esta página cubre la ejecución de los conjuntos de pruebas regulares y los ejecutores de Docker/Parallels. La sección de ejecutores específicos de QA más abajo ([ejecutores específicos de QA](#qa-specific-runners)) enumera las invocaciones concretas de `qa` y remite a las referencias anteriores.
</Note>

## Inicio rápido

La mayoría de los días:

- Puerta completa (esperada antes de push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Ejecución local más rápida del conjunto completo en una máquina amplia: `pnpm test:max`
- Bucle directo de observación de Vitest: `pnpm test:watch`
- El direccionamiento directo de archivos ahora también enruta rutas de extensión/canal: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefiere primero ejecuciones dirigidas cuando estés iterando sobre un único fallo.
- Sitio de QA respaldado por Docker: `pnpm qa:lab:up`
- Carril de QA respaldado por una VM de Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Cuando toques pruebas o quieras confianza adicional:

- Puerta de cobertura: `pnpm test:coverage`
- Conjunto e2e: `pnpm test:e2e`

Al depurar proveedores/modelos reales (requiere credenciales reales):

- Conjunto en vivo (modelos + sondeos de herramienta/imagen de Gateway): `pnpm test:live`
- Apuntar silenciosamente a un archivo en vivo: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Informes de rendimiento en tiempo de ejecución: despacha `OpenClaw Performance` con
  `live_gpt54=true` para un turno real de agente `openai/gpt-5.4` o
  `deep_profile=true` para artefactos de CPU/heap/trace de Kova. Las ejecuciones diarias programadas
  publican artefactos de carriles de proveedor simulado, perfil profundo y GPT 5.4 en
  `openclaw/clawgrit-reports` cuando `CLAWGRIT_REPORTS_TOKEN` está configurado. El
  informe de proveedor simulado también incluye arranque de Gateway a nivel de código fuente, memoria,
  presión de Plugin, bucle de saludos repetidos con modelo falso y números de arranque de CLI.
- Barrido de modelos en vivo con Docker: `pnpm test:docker:live-models`
  - Cada modelo seleccionado ahora ejecuta un turno de texto más un pequeño sondeo estilo lectura de archivo.
    Los modelos cuyos metadatos anuncian entrada de `image` también ejecutan un turno de imagen diminuto.
    Desactiva los sondeos adicionales con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` al aislar fallos de proveedor.
  - Cobertura de CI: tanto `OpenClaw Scheduled Live And E2E Checks` diario como
    `OpenClaw Release Checks` manual llaman al flujo de trabajo reutilizable de vivo/E2E con
    `include_live_suites: true`, lo que incluye trabajos separados de matriz de modelos en vivo con Docker
    fragmentados por proveedor.
  - Para repeticiones enfocadas de CI, despacha `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` y `live_models_only: true`.
  - Agrega nuevos secretos de proveedor de alta señal a `scripts/ci-hydrate-live-auth.sh`
    más `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` y sus
    llamadores programados/de lanzamiento.
- Smoke de chat enlazado nativo de Codex: `pnpm test:docker:live-codex-bind`
  - Ejecuta un carril en vivo de Docker contra la ruta app-server de Codex, enlaza un
    DM sintético de Slack con `/codex bind`, ejercita `/codex fast` y
    `/codex permissions`, luego verifica una respuesta simple y una ruta de adjunto de imagen
    a través del enlace nativo del Plugin en lugar de ACP.
- Smoke de arnés app-server de Codex: `pnpm test:docker:live-codex-harness`
  - Ejecuta turnos de agente de Gateway a través del arnés app-server de Codex propiedad del Plugin,
    verifica `/codex status` y `/codex models`, y por defecto ejercita sondeos de imagen,
    MCP de cron, subagente y Guardian. Desactiva el sondeo de subagente con
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` al aislar otros fallos de
    app-server de Codex. Para una comprobación enfocada de subagente, desactiva los otros sondeos:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Esto sale después del sondeo de subagente a menos que
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` esté establecido.
- Smoke del comando de rescate de Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Comprobación opcional con doble seguridad para la superficie del comando de rescate del canal de mensajes.
    Ejercita `/crestodian status`, encola un cambio persistente de modelo,
    responde `/crestodian yes` y verifica la ruta de escritura de auditoría/configuración.
- Smoke de Docker del planificador de Crestodian: `pnpm test:docker:crestodian-planner`
  - Ejecuta Crestodian en un contenedor sin configuración con una CLI falsa de Claude en `PATH`
    y verifica que el fallback difuso del planificador se traduzca en una escritura de configuración tipada auditada.
- Smoke de Docker de primera ejecución de Crestodian: `pnpm test:docker:crestodian-first-run`
  - Parte de un directorio de estado de OpenClaw vacío, enruta `openclaw` sin argumentos a
    Crestodian, aplica escrituras de configuración/modelo/agente/Plugin de Discord + SecretRef,
    valida la configuración y verifica entradas de auditoría. La misma ruta de configuración Ring 0 también
    está cubierta en QA Lab por
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de coste Moonshot/Kimi: con `MOONSHOT_API_KEY` establecido, ejecuta
  `openclaw models list --provider moonshot --json`, luego ejecuta un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  aislado contra `moonshot/kimi-k2.6`. Verifica que el JSON informe Moonshot/K2.6 y que la
  transcripción del asistente almacene `usage.cost` normalizado.

<Tip>
Cuando solo necesites un caso fallido, prefiere acotar las pruebas en vivo mediante las variables de entorno de lista de permitidos descritas abajo.
</Tip>

## Ejecutores específicos de QA

Estos comandos se sitúan junto a los conjuntos de pruebas principales cuando necesitas realismo de QA-lab:

CI ejecuta QA Lab en flujos de trabajo dedicados. La paridad agéntica está anidada bajo
`QA-Lab - All Lanes` y la validación de lanzamiento, no como un flujo de trabajo de PR independiente.
La validación amplia debe usar `Full Release Validation` con
`rerun_group=qa-parity` o el grupo de QA de comprobaciones de lanzamiento. `QA-Lab - All Lanes`
se ejecuta cada noche en `main` y desde despacho manual con el carril de paridad simulado, el carril
Matrix en vivo, el carril de Telegram en vivo gestionado por Convex y el carril de Discord en vivo
gestionado por Convex como trabajos paralelos. QA programado y las comprobaciones de lanzamiento pasan Matrix
`--profile fast` explícitamente, mientras que la CLI de Matrix y la entrada del flujo de trabajo manual
siguen predeterminadas a `all`; el despacho manual puede fragmentar `all` en trabajos `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`. `OpenClaw Release
Checks` ejecuta la paridad más los carriles rápidos de Matrix y Telegram antes de la aprobación
de lanzamiento, usando `mock-openai/gpt-5.5` para comprobaciones de transporte de lanzamiento para que permanezcan
deterministas y eviten el arranque normal del Plugin de proveedor. Estos Gateways de transporte en vivo
desactivan la búsqueda de memoria; el comportamiento de memoria sigue cubierto por los conjuntos de paridad de QA.

Los fragmentos de medios en vivo de lanzamiento completo usan
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, que ya tiene
`ffmpeg` y `ffprobe`. Los fragmentos de modelos/backends en vivo con Docker usan la imagen compartida
`ghcr.io/openclaw/openclaw-live-test:<sha>` construida una vez por commit seleccionado,
y luego la descargan con `OPENCLAW_SKIP_DOCKER_BUILD=1` en lugar de reconstruirla
dentro de cada fragmento.

- `pnpm openclaw qa suite`
  - Ejecuta escenarios de QA respaldados por el repositorio directamente en el host.
  - Ejecuta varios escenarios seleccionados en paralelo de forma predeterminada con workers
    de gateway aislados. `qa-channel` usa concurrencia 4 de forma predeterminada (limitada por el
    recuento de escenarios seleccionados). Usa `--concurrency <count>` para ajustar el recuento
    de workers, o `--concurrency 1` para la ruta serial anterior.
  - Sale con un código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
    quieras artefactos sin un código de salida de fallo.
  - Admite los modos de proveedor `live-frontier`, `mock-openai` y `aimock`.
    `aimock` inicia un servidor de proveedor local respaldado por AIMock para cobertura experimental
    de fixtures y mocks de protocolo sin reemplazar la ruta `mock-openai`
    con reconocimiento de escenarios.
- `pnpm test:gateway:cpu-scenarios`
  - Ejecuta el bench de inicio del gateway más un pequeño paquete de escenarios mock de QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) y escribe un resumen combinado de observación de CPU
    en `.artifacts/gateway-cpu-scenarios/`.
  - De forma predeterminada solo marca observaciones de CPU caliente sostenidas (`--cpu-core-warn`
    más `--hot-wall-warn-ms`), por lo que los picos breves de inicio se registran como métricas
    sin parecerse a la regresión de Gateway fijado durante minutos.
  - Usa artefactos compilados de `dist`; ejecuta primero una compilación cuando la copia de trabajo no
    tenga ya salida de runtime reciente.
- `pnpm openclaw qa suite --runner multipass`
  - Ejecuta la misma suite de QA dentro de una VM Linux desechable de Multipass.
  - Mantiene el mismo comportamiento de selección de escenarios que `qa suite` en el host.
  - Reutiliza las mismas flags de selección de proveedor/modelo que `qa suite`.
  - Las ejecuciones live reenvían las entradas de autenticación de QA admitidas que son prácticas para el invitado:
    claves de proveedor basadas en env, la ruta de configuración del proveedor live de QA y `CODEX_HOME`
    cuando está presente.
  - Los directorios de salida deben permanecer bajo la raíz del repositorio para que el invitado pueda escribir de vuelta a través
    del espacio de trabajo montado.
  - Escribe el informe + resumen normal de QA más logs de Multipass en
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia el sitio de QA respaldado por Docker para trabajo de QA de estilo operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Construye un tarball npm desde la copia de trabajo actual, lo instala globalmente en
    Docker, ejecuta onboarding no interactivo con clave de API de OpenAI, configura Telegram
    de forma predeterminada, verifica que el runtime del Plugin empaquetado carga sin reparación de
    dependencias de inicio, ejecuta doctor y ejecuta un turno de agente local contra un
    endpoint mock de OpenAI.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para ejecutar la misma ruta de instalación empaquetada
    con Discord.
- `pnpm test:docker:session-runtime-context`
  - Ejecuta una prueba smoke determinista en Docker de la app compilada para transcripciones de contexto de runtime
    incrustado. Verifica que el contexto de runtime oculto de OpenClaw se persista como un
    mensaje personalizado no visible en lugar de filtrarse al turno visible del usuario,
    luego siembra un JSONL de sesión rota afectada y verifica que
    `openclaw doctor --fix` lo reescribe a la rama activa con una copia de seguridad.
- `pnpm test:docker:npm-telegram-live`
  - Instala un paquete candidato de OpenClaw en Docker, ejecuta onboarding de paquete instalado,
    configura Telegram mediante la CLI instalada y luego reutiliza la
    ruta de QA live de Telegram con ese paquete instalado como Gateway SUT.
  - Usa `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` de forma predeterminada; configura
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` o
    `OPENCLAW_CURRENT_PACKAGE_TGZ` para probar un tarball local resuelto en lugar de
    instalar desde el registro.
  - Usa las mismas credenciales env de Telegram o fuente de credenciales Convex que
    `pnpm openclaw qa telegram`. Para automatización de CI/release, configura
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` más
    `OPENCLAW_QA_CONVEX_SITE_URL` y el secreto de rol. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` y un secreto de rol de Convex están presentes en CI,
    el wrapper de Docker selecciona Convex automáticamente.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sobrescribe el
    `OPENCLAW_QA_CREDENTIAL_ROLE` compartido solo para esta ruta.
  - GitHub Actions expone esta ruta como el workflow manual de mantenedor
    `NPM Telegram Beta E2E`. No se ejecuta al fusionar. El workflow usa el
    entorno `qa-live-shared` y leases de credenciales CI de Convex.
- GitHub Actions también expone `Package Acceptance` para prueba de producto en ejecución lateral
  contra un paquete candidato. Acepta una ref de confianza, spec npm publicada,
  URL HTTPS de tarball más SHA-256, o artefacto tarball de otra ejecución, sube
  el `openclaw-current.tgz` normalizado como `package-under-test`, y luego ejecuta el
  scheduler E2E de Docker existente con perfiles de ruta smoke, paquete, producto, completa o personalizada.
  Configura `telegram_mode=mock-openai` o `live-frontier` para ejecutar el
  workflow de QA de Telegram contra el mismo artefacto `package-under-test`.
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

- La prueba de artefacto descarga un artefacto tarball de otra ejecución de Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Empaqueta e instala la compilación actual de OpenClaw en Docker, inicia el Gateway
    con OpenAI configurado y luego habilita canales/plugins incluidos mediante ediciones de configuración.
  - Verifica que el descubrimiento de configuración deja ausentes los plugins descargables no configurados,
    que la primera reparación de doctor configurada instala explícitamente cada Plugin descargable
    faltante y que un segundo reinicio no ejecuta una reparación de dependencias oculta.
  - También instala una línea base npm anterior conocida, habilita Telegram antes de ejecutar
    `openclaw update --tag <candidate>` y verifica que el doctor posterior a la actualización
    del candidato limpia restos de dependencias de Plugin heredadas sin una
    reparación postinstall del lado del harness.
- `pnpm test:parallels:npm-update`
  - Ejecuta la prueba smoke nativa de actualización de instalación empaquetada en invitados Parallels. Cada
    plataforma seleccionada primero instala el paquete de línea base solicitado, luego ejecuta
    el comando `openclaw update` instalado en el mismo invitado y verifica la
    versión instalada, el estado de actualización, la disponibilidad del gateway y un turno de agente
    local.
  - Usa `--platform macos`, `--platform windows` o `--platform linux` mientras
    iteras en un invitado. Usa `--json` para la ruta del artefacto de resumen y
    el estado por ruta.
  - La ruta de OpenAI usa `openai/gpt-5.5` para la prueba live de turno de agente de forma
    predeterminada. Pasa `--model <provider/model>` o configura
    `OPENCLAW_PARALLELS_OPENAI_MODEL` cuando valides deliberadamente otro
    modelo de OpenAI.
  - Envuelve las ejecuciones locales largas en un timeout de host para que los bloqueos del transporte de Parallels no
    consuman el resto de la ventana de pruebas:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - El script escribe logs de ruta anidados en `/tmp/openclaw-parallels-npm-update.*`.
    Inspecciona `windows-update.log`, `macos-update.log` o `linux-update.log`
    antes de asumir que el wrapper externo está colgado.
  - La actualización de Windows puede pasar de 10 a 15 minutos en doctor posterior a la actualización y trabajo de
    actualización de paquetes en un invitado frío; eso sigue siendo saludable cuando el log de debug
    npm anidado avanza.
  - No ejecutes este wrapper agregado en paralelo con rutas smoke individuales de Parallels
    macOS, Windows o Linux. Comparten estado de VM y pueden colisionar en
    restauración de snapshot, servicio de paquetes o estado del Gateway del invitado.
  - La prueba posterior a la actualización ejecuta la superficie normal de Plugin incluido porque
    las fachadas de capacidades como voz, generación de imágenes y comprensión de medios
    se cargan mediante APIs de runtime incluidas incluso cuando el turno del agente
    en sí solo comprueba una respuesta de texto simple.

- `pnpm openclaw qa aimock`
  - Inicia solo el servidor local de proveedor AIMock para pruebas smoke directas
    de protocolo.
- `pnpm openclaw qa matrix`
  - Ejecuta la ruta de QA live de Matrix contra un homeserver Tuwunel desechable respaldado por Docker. Solo copia de trabajo de código fuente: las instalaciones empaquetadas no incluyen `qa-lab`.
  - CLI completa, catálogo de perfiles/escenarios, env vars y diseño de artefactos: [QA de Matrix](/es/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Ejecuta la ruta de QA live de Telegram contra un grupo privado real usando los tokens de bot del driver y del SUT desde env.
  - Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. El id del grupo debe ser el id numérico de chat de Telegram.
  - Admite `--credential-source convex` para credenciales compartidas en pool. Usa el modo env de forma predeterminada, o configura `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases en pool.
  - Sale con un código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
    quieras artefactos sin un código de salida de fallo.
  - Requiere dos bots distintos en el mismo grupo privado, con el bot SUT exponiendo un nombre de usuario de Telegram.
  - Para una observación estable de bot a bot, habilita Bot-to-Bot Communication Mode en `@BotFather` para ambos bots y asegúrate de que el bot driver pueda observar el tráfico de bots del grupo.
  - Escribe un informe de QA de Telegram, un resumen y un artefacto de mensajes observados en `.artifacts/qa-e2e/...`. Los escenarios de respuesta incluyen RTT desde la solicitud de envío del driver hasta la respuesta SUT observada.

Las rutas de transporte live comparten un contrato estándar para que los transportes nuevos no diverjan; la matriz de cobertura por ruta vive en [resumen de QA → Cobertura de transporte live](/es/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` es la suite sintética amplia y no forma parte de esa matriz.

### Credenciales compartidas de Telegram mediante Convex (v1)

Cuando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
`openclaw qa telegram`, el laboratorio de QA adquiere un lease exclusivo de un pool respaldado por Convex, envía Heartbeat
a ese lease mientras la vía se está ejecutando y libera el lease al apagarse.

Estructura base de proyecto Convex de referencia:

- `qa/convex-credential-broker/`

Variables de entorno obligatorias:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por ejemplo, `https://your-deployment.convex.site`)
- Un secreto para el rol seleccionado:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Selección de rol de credenciales:
  - CLI: `--credential-role maintainer|ci`
  - Valor predeterminado de entorno: `OPENCLAW_QA_CREDENTIAL_ROLE` (se establece de forma predeterminada en `ci` en CI; de lo contrario, en `maintainer`)

Variables de entorno opcionales:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predeterminado: `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predeterminado: `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predeterminado: `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predeterminado: `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predeterminado: `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de trazabilidad opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URL de Convex `http://` de loopback para desarrollo solo local.

`OPENCLAW_QA_CONVEX_SITE_URL` debe usar `https://` en funcionamiento normal.

Los comandos de administración para mantenedores (agregar/quitar/listar en el pool) requieren
específicamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Ayudantes de CLI para mantenedores:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Use `doctor` antes de las ejecuciones en vivo para comprobar la URL del sitio Convex, los secretos del broker,
el prefijo del endpoint, el tiempo de espera HTTP y la alcanzabilidad de administración/listado sin imprimir
valores secretos. Use `--json` para obtener una salida legible por máquina en scripts y utilidades de CI.

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

Forma del payload para el tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` debe ser una cadena de id de chat numérico de Telegram.
- `admin/add` valida esta forma para `kind: "telegram"` y rechaza payloads malformados.

### Agregar un canal a QA

La arquitectura y los nombres de los helpers de escenario para nuevos adaptadores de canal se encuentran en [Resumen de QA → Agregar un canal](/es/concepts/qa-e2e-automation#adding-a-channel). El mínimo requerido: implementar el ejecutor de transporte en el seam de host compartido `qa-lab`, declarar `qaRunners` en el manifiesto del plugin, montar como `openclaw qa <runner>` y crear escenarios en `qa/scenarios/`.

## Suites de pruebas (qué se ejecuta dónde)

Piensa en las suites como “realismo creciente” (y mayor inestabilidad/costo):

### Unidad / integración (predeterminado)

- Comando: `pnpm test`
- Configuración: las ejecuciones sin objetivo usan el conjunto de shards `vitest.full-*.config.ts` y pueden expandir shards multiproyecto en configuraciones por proyecto para la programación paralela
- Archivos: inventarios de core/unidad en `src/**/*.test.ts`, `packages/**/*.test.ts` y `test/**/*.test.ts`; las pruebas unitarias de UI se ejecutan en el shard dedicado `unit-ui`
- Alcance:
  - Pruebas unitarias puras
  - Pruebas de integración en proceso (autenticación del gateway, enrutamiento, tooling, análisis, configuración)
  - Regresiones deterministas para bugs conocidos
- Expectativas:
  - Se ejecuta en CI
  - No requiere claves reales
  - Debe ser rápido y estable
  - Las pruebas del resolver y del cargador de superficie pública deben demostrar el comportamiento amplio de fallback de `api.js` y
    `runtime-api.js` con fixtures generados de plugins diminutos, no con
    APIs de origen de plugins empaquetados reales. Las cargas reales de API de plugins pertenecen a
    suites de contrato/integración propiedad del plugin.

<AccordionGroup>
  <Accordion title="Proyectos, shards y lanes con alcance">

    - `pnpm test` sin objetivo ejecuta doce configuraciones de shard más pequeñas (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) en lugar de un único proceso gigante de proyecto raíz nativo. Esto reduce el RSS pico en máquinas cargadas y evita que el trabajo de auto-reply/extensiones deje sin recursos a suites no relacionadas.
    - `pnpm test --watch` aún usa el grafo de proyectos raíz nativo `vitest.config.ts`, porque un bucle watch multishard no es práctico.
    - `pnpm test`, `pnpm test:watch` y `pnpm test:perf:imports` enrutan primero objetivos explícitos de archivo/directorio por lanes con alcance, de modo que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar el costo completo de arranque del proyecto raíz.
    - `pnpm test:changed` expande rutas git cambiadas en lanes con alcance económicas de forma predeterminada: ediciones directas de pruebas, archivos `*.test.ts` hermanos, asignaciones explícitas de origen y dependientes locales del grafo de imports. Las ediciones de configuración/setup/paquete no ejecutan pruebas amplias a menos que uses explícitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` es la puerta normal de verificación local inteligente para trabajo acotado. Clasifica el diff en core, pruebas de core, extensiones, pruebas de extensiones, apps, docs, metadatos de release, tooling de Docker en vivo y tooling, luego ejecuta los comandos de typecheck, lint y guard correspondientes. No ejecuta pruebas Vitest; llama a `pnpm test:changed` o a `pnpm test <target>` explícito para la prueba de tests. Los incrementos de versión solo de metadatos de release ejecutan verificaciones dirigidas de versión/configuración/dependencias raíz, con una guarda que rechaza cambios de paquete fuera del campo de versión de nivel superior.
    - Las ediciones del harness de ACP de Docker en vivo ejecutan verificaciones enfocadas: sintaxis shell para los scripts de autenticación de Docker en vivo y una simulación en seco del programador de Docker en vivo. Los cambios de `package.json` se incluyen solo cuando el diff se limita a `scripts["test:docker:live-*"]`; las ediciones de dependencias, exportaciones, versión y otras superficies de paquete siguen usando las guardas más amplias.
    - Las pruebas unitarias ligeras en imports de agentes, comandos, plugins, helpers de auto-reply, `plugin-sdk` y áreas similares de utilidades puras se enrutan por la lane `unit-fast`, que omite `test/setup-openclaw-runtime.ts`; los archivos con estado o pesados en runtime permanecen en las lanes existentes.
    - Algunos archivos fuente helper de `plugin-sdk` y `commands` también asignan ejecuciones en modo cambiado a pruebas hermanas explícitas en esas lanes ligeras, para que las ediciones de helpers eviten volver a ejecutar la suite pesada completa de ese directorio.
    - `auto-reply` tiene buckets dedicados para helpers de core de nivel superior, pruebas de integración `reply.*` de nivel superior y el subárbol `src/auto-reply/reply/**`. CI divide además el subárbol de respuestas en shards de agent-runner, dispatch y commands/state-routing para que un bucket pesado en imports no posea toda la cola de Node.
    - La CI normal de PR/main omite intencionalmente el barrido por lotes de extensiones y el shard `agentic-plugins` solo de release. Full Release Validation despacha el workflow hijo separado `Plugin Prerelease` para esas suites intensivas en plugins/extensiones en candidatos de release.

  </Accordion>

  <Accordion title="Cobertura del ejecutor embebido">

    - Cuando cambies entradas de descubrimiento de message-tool o contexto de
      runtime de compaction, conserva ambos niveles de cobertura.
    - Agrega regresiones enfocadas de helpers para límites puros de enrutamiento
      y normalización.
    - Mantén sanas las suites de integración del ejecutor embebido:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` y
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Esas suites verifican que los ids con alcance y el comportamiento de compaction sigan fluyendo
      por las rutas reales `run.ts` / `compact.ts`; las pruebas solo de helpers
      no son un sustituto suficiente para esas rutas de integración.

  </Accordion>

  <Accordion title="Pool de Vitest y valores predeterminados de aislamiento">

    - La configuración base de Vitest usa `threads` de forma predeterminada.
    - La configuración compartida de Vitest fija `isolate: false` y usa el
      ejecutor no aislado en los proyectos raíz, e2e y configuraciones en vivo.
    - La lane raíz de UI conserva su setup y optimizador `jsdom`, pero también se ejecuta en el
      ejecutor compartido no aislado.
    - Cada shard de `pnpm test` hereda los mismos valores predeterminados `threads` + `isolate: false`
      de la configuración compartida de Vitest.
    - `scripts/run-vitest.mjs` agrega `--no-maglev` para procesos Node hijos de Vitest
      de forma predeterminada para reducir la rotación de compilación de V8 durante grandes ejecuciones locales.
      Define `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar contra el comportamiento estándar de V8.

  </Accordion>

  <Accordion title="Iteración local rápida">

    - `pnpm changed:lanes` muestra qué lanes arquitectónicas activa un diff.
    - El hook de pre-commit solo formatea. Vuelve a preparar archivos formateados y
      no ejecuta lint, typecheck ni pruebas.
    - Ejecuta `pnpm check:changed` explícitamente antes de la entrega o del push cuando
      necesites la puerta de verificación local inteligente.
    - `pnpm test:changed` enruta por lanes con alcance económicas de forma predeterminada. Usa
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el agente
      decida que una edición de harness, configuración, paquete o contrato realmente necesita cobertura
      de Vitest más amplia.
    - `pnpm test:max` y `pnpm test:changed:max` mantienen el mismo comportamiento de enrutamiento,
      solo con un límite de workers más alto.
    - El autoescalado de workers locales es intencionalmente conservador y retrocede
      cuando el promedio de carga del host ya es alto, para que múltiples ejecuciones
      concurrentes de Vitest causen menos impacto de forma predeterminada.
    - La configuración base de Vitest marca los proyectos/archivos de configuración como
      `forceRerunTriggers` para que las reejecuciones en modo cambiado sigan siendo correctas cuando cambia el
      cableado de pruebas.
    - La configuración mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado en hosts
      compatibles; define `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si quieres
      una ubicación de caché explícita para perfilado directo.

  </Accordion>

  <Accordion title="Depuración de rendimiento">

    - `pnpm test:perf:imports` habilita el reporte de duración de imports de Vitest más
      salida de desglose de imports.
    - `pnpm test:perf:imports:changed` acota la misma vista de perfilado a
      archivos cambiados desde `origin/main`.
    - Los datos de tiempos de shard se escriben en `.artifacts/vitest-shard-timings.json`.
      Las ejecuciones de configuración completa usan la ruta de configuración como clave; los shards de CI con patrón de inclusión
      agregan el nombre del shard para que los shards filtrados puedan rastrearse
      por separado.
    - Cuando una prueba caliente aún pasa la mayor parte de su tiempo en imports de arranque,
      mantén las dependencias pesadas detrás de un seam local estrecho `*.runtime.ts` y
      mockea ese seam directamente en lugar de importar profundamente helpers de runtime solo
      para pasarlos por `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara el
      `test:changed` enrutado contra la ruta nativa de proyecto raíz para ese
      diff confirmado e imprime tiempo real más RSS máximo de macOS.
    - `pnpm test:perf:changed:bench -- --worktree` mide el árbol sucio actual
      enrutando la lista de archivos cambiados por
      `scripts/test-projects.mjs` y la configuración raíz de Vitest.
    - `pnpm test:perf:profile:main` escribe un perfil de CPU del hilo principal para
      el arranque de Vitest/Vite y la sobrecarga de transformaciones.
    - `pnpm test:perf:profile:runner` escribe perfiles de CPU+heap del ejecutor para la
      suite unitaria con el paralelismo de archivos deshabilitado.

  </Accordion>
</AccordionGroup>

### Estabilidad (gateway)

- Comando: `pnpm test:stability:gateway`
- Configuración: `vitest.gateway.config.ts`, forzado a un worker
- Alcance:
  - Inicia un Gateway real de local loopback con diagnósticos habilitados de forma predeterminada
  - Impulsa churn sintético de mensajes de gateway, memoria y payloads grandes por la ruta de eventos de diagnóstico
  - Consulta `diagnostics.stability` por el RPC WS del Gateway
  - Cubre helpers de persistencia del paquete de estabilidad de diagnósticos
  - Afirma que el registrador permanece acotado, que las muestras RSS sintéticas se mantienen bajo el presupuesto de presión y que las profundidades de cola por sesión vuelven a cero
- Expectativas:
  - Seguro para CI y sin claves
  - Lane estrecha para seguimiento de regresiones de estabilidad, no un sustituto de la suite completa de Gateway

### E2E (smoke de gateway)

- Comando: `pnpm test:e2e`
- Configuración: `vitest.e2e.config.ts`
- Archivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` y pruebas E2E de plugins empaquetados en `extensions/`
- Valores predeterminados de runtime:
  - Usa `threads` de Vitest con `isolate: false`, coincidiendo con el resto del repo.
  - Usa workers adaptativos (CI: hasta 2, local: 1 de forma predeterminada).
  - Se ejecuta en modo silencioso de forma predeterminada para reducir la sobrecarga de E/S de consola.
- Overrides útiles:
  - `OPENCLAW_E2E_WORKERS=<n>` para forzar el número de workers (limitado a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para volver a habilitar la salida detallada de consola.
- Alcance:
  - Comportamiento end-to-end del gateway con múltiples instancias
  - Superficies WebSocket/HTTP, emparejamiento de nodos y redes más pesadas
- Expectativas:
  - Se ejecuta en CI (cuando está habilitado en el pipeline)
  - No requiere claves reales
  - Más piezas móviles que las pruebas unitarias (puede ser más lento)

### E2E: smoke del backend de OpenShell

- Comando: `pnpm test:e2e:openshell`
- Archivo: `extensions/openshell/src/backend.e2e.test.ts`
- Alcance:
  - Inicia un Gateway de OpenShell aislado en el host mediante Docker
  - Crea un sandbox desde un Dockerfile local temporal
  - Ejercita el backend OpenShell de OpenClaw sobre `sandbox ssh-config` real + ejecución SSH
  - Verifica el comportamiento del sistema de archivos canónico remoto mediante el puente fs del sandbox
- Expectativas:
  - Solo por activación explícita; no forma parte de la ejecución predeterminada de `pnpm test:e2e`
  - Requiere una CLI local de `openshell` y un daemon de Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` aislados y luego destruye el Gateway y el sandbox de prueba
- Sobrescrituras útiles:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar la prueba al ejecutar manualmente la suite e2e más amplia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apuntar a un binario de CLI no predeterminado o a un script contenedor

### Live (proveedores reales + modelos reales)

- Comando: `pnpm test:live`
- Configuración: `vitest.live.config.ts`
- Archivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` y pruebas live de Plugins incluidos en `extensions/`
- Valor predeterminado: **habilitado** por `pnpm test:live` (establece `OPENCLAW_LIVE_TEST=1`)
- Alcance:
  - “¿Este proveedor/modelo funciona realmente _hoy_ con credenciales reales?”
  - Detecta cambios de formato de proveedores, peculiaridades de llamadas a herramientas, problemas de autenticación y comportamiento de límites de tasa
- Expectativas:
  - No es estable para CI por diseño (redes reales, políticas reales de proveedores, cuotas, interrupciones)
  - Cuesta dinero / usa límites de tasa
  - Prefiere ejecutar subconjuntos acotados en lugar de “todo”
- Las ejecuciones live cargan `~/.profile` para recoger claves de API faltantes.
- De forma predeterminada, las ejecuciones live siguen aislando `HOME` y copian material de configuración/autenticación en un home de prueba temporal para que los fixtures unitarios no puedan modificar tu `~/.openclaw` real.
- Establece `OPENCLAW_LIVE_USE_REAL_HOME=1` solo cuando necesites intencionadamente que las pruebas live usen tu directorio home real.
- `pnpm test:live` ahora usa de forma predeterminada un modo más silencioso: conserva la salida de progreso `[live] ...`, pero suprime el aviso adicional de `~/.profile` y silencia los registros de arranque del Gateway y la charla de Bonjour. Establece `OPENCLAW_LIVE_TEST_QUIET=0` si quieres recuperar los registros completos de inicio.
- Rotación de claves de API (específica del proveedor): establece `*_API_KEYS` con formato de comas/punto y coma o `*_API_KEY_1`, `*_API_KEY_2` (por ejemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) o una sobrescritura por live mediante `OPENCLAW_LIVE_*_KEY`; las pruebas reintentan ante respuestas de límite de tasa.
- Salida de progreso/heartbeat:
  - Las suites live ahora emiten líneas de progreso a stderr para que las llamadas largas a proveedores estén visiblemente activas incluso cuando la captura de consola de Vitest esté silenciosa.
  - `vitest.live.config.ts` desactiva la interceptación de consola de Vitest para que las líneas de progreso del proveedor/Gateway se transmitan inmediatamente durante las ejecuciones live.
  - Ajusta los heartbeats de modelo directo con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajusta los heartbeats de Gateway/sonda con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## ¿Qué suite debo ejecutar?

Usa esta tabla de decisión:

- Al editar lógica/pruebas: ejecuta `pnpm test` (y `pnpm test:coverage` si cambiaste mucho)
- Al tocar redes del Gateway / protocolo WS / emparejamiento: añade `pnpm test:e2e`
- Al depurar “mi bot está caído” / fallos específicos de proveedor / llamadas a herramientas: ejecuta un `pnpm test:live` acotado

## Pruebas live (que tocan red)

Para la matriz de modelos live, pruebas de humo del backend CLI, pruebas de humo de ACP, arnés del servidor de aplicación de Codex
y todas las pruebas live de proveedores multimedia (Deepgram, BytePlus, ComfyUI, imagen,
música, video, arnés multimedia), además del manejo de credenciales para ejecuciones live, consulta
[Pruebas de suites live](/es/help/testing-live). Para la lista de verificación dedicada de actualización y
validación de Plugins, consulta
[Pruebas de actualizaciones y Plugins](/es/help/testing-updates-plugins).

## Runners de Docker (comprobaciones opcionales de "funciona en Linux")

Estos runners de Docker se dividen en dos grupos:

- Runners de modelos live: `test:docker:live-models` y `test:docker:live-gateway` ejecutan solo su archivo live de claves de perfil correspondiente dentro de la imagen Docker del repositorio (`src/agents/models.profiles.live.test.ts` y `src/gateway/gateway-models.profiles.live.test.ts`), montando tu directorio de configuración local y el workspace (y cargando `~/.profile` si está montado). Los puntos de entrada locales correspondientes son `test:live:models-profiles` y `test:live:gateway-profiles`.
- Los runners live de Docker usan de forma predeterminada un límite de humo más pequeño para que un barrido completo de Docker siga siendo práctico:
  `test:docker:live-models` usa de forma predeterminada `OPENCLAW_LIVE_MAX_MODELS=12`, y
  `test:docker:live-gateway` usa de forma predeterminada `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` y
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sobrescribe esas variables de entorno cuando
  quieras explícitamente el escaneo exhaustivo más grande.
- `test:docker:all` construye la imagen Docker live una vez mediante `test:docker:live-build`, empaqueta OpenClaw una vez como tarball npm mediante `scripts/package-openclaw-for-docker.mjs` y luego construye/reutiliza dos imágenes de `scripts/e2e/Dockerfile`. La imagen básica es solo el runner Node/Git para carriles de instalación/actualización/dependencias de Plugins; esos carriles montan el tarball precompilado. La imagen funcional instala el mismo tarball en `/app` para carriles de funcionalidad de aplicación construida. Las definiciones de carriles de Docker están en `scripts/lib/docker-e2e-scenarios.mjs`; la lógica del planificador está en `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ejecuta el plan seleccionado. El agregado usa un planificador local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla los slots de proceso, mientras que los límites de recursos impiden que los carriles pesados live, de instalación npm y multiservicio comiencen todos a la vez. Si un solo carril es más pesado que los límites activos, el planificador aún puede iniciarlo cuando el pool está vacío y luego lo mantiene ejecutándose solo hasta que vuelva a haber capacidad disponible. Los valores predeterminados son 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` y `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajusta `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` solo cuando el host de Docker tenga más margen. El runner realiza una precomprobación de Docker de forma predeterminada, elimina contenedores E2E de OpenClaw obsoletos, imprime el estado cada 30 segundos, almacena los tiempos de carriles exitosos en `.artifacts/docker-tests/lane-timings.json` y usa esos tiempos para iniciar primero los carriles más largos en ejecuciones posteriores. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir el manifiesto ponderado de carriles sin construir ni ejecutar Docker, o `node scripts/test-docker-all.mjs --plan-json` para imprimir el plan de CI de los carriles seleccionados, necesidades de paquetes/imágenes y credenciales.
- `Package Acceptance` es la compuerta de paquetes nativa de GitHub para "¿este tarball instalable funciona como producto?" Resuelve un paquete candidato desde `source=npm`, `source=ref`, `source=url` o `source=artifact`, lo sube como `package-under-test` y luego ejecuta los carriles Docker E2E reutilizables contra ese tarball exacto en lugar de volver a empaquetar la ref seleccionada. Los perfiles están ordenados por amplitud: `smoke`, `package`, `product` y `full`. Consulta [Pruebas de actualizaciones y Plugins](/es/help/testing-updates-plugins) para el contrato de paquete/actualización/Plugin, la matriz de supervivencia de actualizaciones publicadas, los valores predeterminados de release y el triaje de fallos.
- Las comprobaciones de build y release ejecutan `scripts/check-cli-bootstrap-imports.mjs` después de tsdown. La protección recorre el grafo construido estático desde `dist/entry.js` y `dist/cli/run-main.js` y falla si el arranque previo al dispatch importa dependencias de paquetes como Commander, interfaz de prompts, undici o logging antes del dispatch del comando; también mantiene el chunk incluido de ejecución del Gateway dentro del presupuesto y rechaza imports estáticos de rutas frías conocidas del Gateway. La prueba de humo de CLI empaquetada también cubre la ayuda raíz, la ayuda de onboard, la ayuda de doctor, status, el esquema de configuración y un comando de lista de modelos.
- La compatibilidad heredada de Package Acceptance está limitada a `2026.4.25` (`2026.4.25-beta.*` incluido). Hasta ese límite, el arnés tolera únicamente brechas de metadatos de paquetes ya publicados: entradas privadas omitidas del inventario de QA, falta de `gateway install --wrapper`, archivos de parche faltantes en el fixture git derivado del tarball, falta de `update.channel` persistido, ubicaciones heredadas de registros de instalación de Plugins, falta de persistencia de registros de instalación del marketplace y migración de metadatos de configuración durante `plugins update`. Para paquetes posteriores a `2026.4.25`, esas rutas son fallos estrictos.
- Runners de humo de contenedores: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` y `test:docker:config-reload` arrancan uno o más contenedores reales y verifican rutas de integración de mayor nivel.

Los runners Docker de modelos live también montan mediante bind solo los homes de autenticación de CLI necesarios (o todos los compatibles cuando la ejecución no está acotada), luego los copian al home del contenedor antes de la ejecución para que OAuth de CLI externas pueda refrescar tokens sin modificar el almacén de autenticación del host:

- Modelos directos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Prueba smoke de enlace ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; cubre Claude, Codex y Gemini de forma predeterminada, con cobertura estricta de Droid/OpenCode mediante `pnpm test:docker:live-acp-bind:droid` y `pnpm test:docker:live-acp-bind:opencode`)
- Prueba smoke del backend de CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Prueba smoke del harness del servidor de aplicaciones de Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desarrollo: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Prueba smoke de observabilidad: `pnpm qa:otel:smoke` es una línea privada de verificación de origen en checkout de QA. Intencionalmente no forma parte de las líneas de lanzamiento Docker de paquetes porque el tarball de npm omite QA Lab.
- Prueba smoke en vivo de Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Asistente de onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Prueba smoke de onboarding/canal/agente del tarball de npm: `pnpm test:docker:npm-onboard-channel-agent` instala globalmente el tarball empaquetado de OpenClaw en Docker, configura OpenAI mediante onboarding con referencia de entorno más Telegram de forma predeterminada, ejecuta doctor y ejecuta un turno de agente OpenAI simulado. Reutiliza un tarball precompilado con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la reconstrucción del host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` o cambia el canal con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Prueba smoke de cambio de canal de actualización: `pnpm test:docker:update-channel-switch` instala globalmente el tarball empaquetado de OpenClaw en Docker, cambia del paquete `stable` a git `dev`, verifica el canal persistido y el funcionamiento del Plugin posterior a la actualización, luego vuelve al paquete `stable` y comprueba el estado de actualización.
- Prueba smoke de supervivencia a actualizaciones: `pnpm test:docker:upgrade-survivor` instala el tarball empaquetado de OpenClaw sobre una fixture sucia de usuario antiguo con agentes, configuración de canal, allowlists de Plugin, estado obsoleto de dependencias de Plugin y archivos existentes de workspace/sesión. Ejecuta la actualización de paquete más doctor no interactivo sin proveedor en vivo ni claves de canal, luego inicia un Gateway de loopback y comprueba la preservación de configuración/estado además de presupuestos de inicio/estado.
- Prueba smoke publicada de supervivencia a actualizaciones: `pnpm test:docker:published-upgrade-survivor` instala `openclaw@latest` de forma predeterminada, siembra archivos realistas de usuario existente, configura esa baseline con una receta de comandos integrada, valida la configuración resultante, actualiza esa instalación publicada al tarball candidato, ejecuta doctor no interactivo, escribe `.artifacts/upgrade-survivor/summary.json`, luego inicia un Gateway de loopback y comprueba intents configurados, preservación de estado, inicio, `/healthz`, `/readyz` y presupuestos de estado RPC. Sobrescribe una baseline con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, pide al planificador agregado que expanda baselines exactas con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` como `all-since-2026.4.23`, y expande fixtures con forma de issues con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` como `reported-issues`; el conjunto reported-issues incluye `configured-plugin-installs` para la reparación automática de instalaciones externas de Plugin de OpenClaw. Package Acceptance expone esas opciones como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` y `published_upgrade_survivor_scenarios`.
- Prueba smoke de contexto de runtime de sesión: `pnpm test:docker:session-runtime-context` verifica la persistencia oculta de la transcripción del contexto de runtime más la reparación con doctor de ramas duplicadas afectadas de reescritura de prompts.
- Prueba smoke de instalación global con Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empaqueta el árbol actual, lo instala con `bun install -g` en un home aislado y verifica que `openclaw infer image providers --json` devuelva proveedores de imagen incluidos en lugar de quedarse bloqueado. Reutiliza un tarball precompilado con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la compilación del host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` o copia `dist/` desde una imagen Docker compilada con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Prueba smoke Docker del instalador: `bash scripts/test-install-sh-docker.sh` comparte una caché npm entre sus contenedores root, update y direct-npm. La prueba smoke de actualización usa de forma predeterminada npm `latest` como baseline estable antes de actualizar al tarball candidato. Sobrescribe con `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localmente o con la entrada `update_baseline_version` del workflow Install Smoke en GitHub. Las comprobaciones del instalador no root mantienen una caché npm aislada para que las entradas de caché propiedad de root no oculten el comportamiento de instalación local del usuario. Define `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar la caché root/update/direct-npm entre repeticiones locales.
- Install Smoke CI omite la actualización global direct-npm duplicada con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; ejecuta el script localmente sin esa variable de entorno cuando se necesite cobertura directa de `npm install -g`.
- Prueba smoke de CLI para eliminar agentes con workspace compartido: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila la imagen Dockerfile raíz de forma predeterminada, siembra dos agentes con un workspace en un home de contenedor aislado, ejecuta `agents delete --json` y verifica JSON válido además del comportamiento de workspace retenido. Reutiliza la imagen install-smoke con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Redes de Gateway (dos contenedores, autenticación WS + salud): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Prueba smoke de snapshot CDP del navegador: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila la imagen E2E de origen más una capa de Chromium, inicia Chromium con CDP sin procesar, ejecuta `browser doctor --deep` y verifica que los snapshots de roles CDP cubran URLs de enlaces, elementos clicables promovidos por cursor, referencias de iframe y metadatos de frames.
- Regresión de razonamiento mínimo de OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) ejecuta un servidor OpenAI simulado a través de Gateway, verifica que `web_search` eleve `reasoning.effort` de `minimal` a `low`, luego fuerza el rechazo del schema del proveedor y comprueba que el detalle sin procesar aparezca en los logs de Gateway.
- Puente de canales MCP (Gateway sembrado + puente stdio + prueba smoke de frame de notificación Claude sin procesar): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Herramientas MCP del paquete Pi (servidor MCP stdio real + prueba smoke de permitir/denegar del perfil Pi integrado): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Limpieza MCP de Cron/subagente (Gateway real + desmontaje de proceso hijo MCP stdio después de ejecuciones aisladas de cron y subagente de una sola vez): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (prueba smoke de instalación/actualización para ruta local, `file:`, registro npm con dependencias hoisted, refs móviles de git, kitchen-sink de ClawHub, actualizaciones del marketplace y habilitar/inspeccionar bundle de Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Define `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para omitir el bloque ClawHub, o sobrescribe el par package/runtime kitchen-sink predeterminado con `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` y `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sin `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, la prueba usa un servidor fixture local hermético de ClawHub.
- Prueba smoke de actualización sin cambios de Plugin: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Prueba smoke de metadatos de recarga de configuración: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` cubre la prueba smoke de instalación/actualización para ruta local, `file:`, registro npm con dependencias hoisted, refs móviles de git, fixtures de ClawHub, actualizaciones del marketplace y habilitar/inspeccionar bundle de Claude. `pnpm test:docker:plugin-update` cubre el comportamiento de actualización sin cambios para plugins instalados.

Para precompilar y reutilizar manualmente la imagen funcional compartida:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Las sobrescrituras de imagen específicas de suite, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, siguen teniendo prioridad cuando están definidas. Cuando `OPENCLAW_SKIP_DOCKER_BUILD=1` apunta a una imagen compartida remota, los scripts la descargan si todavía no está local. Las pruebas Docker de QR e instalador mantienen sus propios Dockerfiles porque validan el comportamiento de paquete/instalación en lugar del runtime compartido de la app compilada.

Los runners Docker de modelos en vivo también montan el checkout actual en modo solo lectura y
lo preparan en un workdir temporal dentro del contenedor. Esto mantiene ligera la imagen de runtime
sin dejar de ejecutar Vitest contra tu fuente/configuración local exacta.
El paso de preparación omite cachés locales grandes y salidas de compilación de apps como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` y directorios de salida `.build` o
Gradle locales de app para que las ejecuciones live de Docker no pasen minutos copiando
artefactos específicos de la máquina.
También definen `OPENCLAW_SKIP_CHANNELS=1` para que las sondas live de gateway no inicien
workers reales de canales Telegram/Discord/etc. dentro del contenedor.
`test:docker:live-models` aún ejecuta `pnpm test:live`, así que pasa también
`OPENCLAW_LIVE_GATEWAY_*` cuando necesites acotar o excluir cobertura live de gateway
de esa línea Docker.
`test:docker:openwebui` es una prueba smoke de compatibilidad de más alto nivel: inicia un
contenedor de gateway de OpenClaw con los endpoints HTTP compatibles con OpenAI habilitados,
inicia un contenedor fijado de Open WebUI contra ese gateway, inicia sesión a través de
Open WebUI, verifica que `/api/models` exponga `openclaw/default` y luego envía una
solicitud de chat real mediante el proxy `/api/chat/completions` de Open WebUI.
La primera ejecución puede ser notablemente más lenta porque Docker puede necesitar descargar la
imagen de Open WebUI y Open WebUI puede necesitar completar su propia configuración de arranque en frío.
Esta línea espera una clave de modelo en vivo utilizable, y `OPENCLAW_PROFILE_FILE`
(`~/.profile` de forma predeterminada) es la forma principal de proporcionarla en ejecuciones Dockerizadas.
Las ejecuciones correctas imprimen un pequeño payload JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` es intencionalmente determinista y no necesita una cuenta real de
Telegram, Discord ni iMessage. Arranca un contenedor de Gateway sembrado,
inicia un segundo contenedor que genera `openclaw mcp serve`, luego
verifica el descubrimiento de conversaciones enrutadas, lecturas de transcripciones, metadatos de adjuntos,
comportamiento de cola de eventos en vivo, enrutamiento de envíos salientes y notificaciones de canal +
permisos estilo Claude sobre el puente MCP stdio real. La comprobación de notificación
inspecciona directamente los frames MCP stdio sin procesar para que la prueba smoke valide lo que el
puente emite realmente, no solo lo que un SDK de cliente específico llegue a exponer.
`test:docker:pi-bundle-mcp-tools` es determinista y no necesita una clave de modelo en vivo.
Compila la imagen Docker del repo, inicia un servidor de prueba MCP stdio real
dentro del contenedor, materializa ese servidor mediante el runtime MCP del paquete Pi integrado,
ejecuta la herramienta y luego verifica que `coding` y `messaging` mantengan
herramientas `bundle-mcp` mientras `minimal` y `tools.deny: ["bundle-mcp"]` las filtran.
`test:docker:cron-mcp-cleanup` es determinista y no necesita una clave de modelo en vivo.
Inicia un Gateway sembrado con un servidor de prueba MCP stdio real, ejecuta un
turno Cron aislado y un turno hijo de una sola vez de `/subagents spawn`, luego verifica
que el proceso hijo MCP salga después de cada ejecución.

Prueba smoke manual de hilo ACP en lenguaje natural (no CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conserva este script para workflows de regresión/depuración. Puede volver a necesitarse para la validación de enrutamiento de hilos ACP, así que no lo elimines.

Variables de entorno útiles:

- `OPENCLAW_CONFIG_DIR=...` (predeterminado: `~/.openclaw`) montado en `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predeterminado: `~/.openclaw/workspace`) montado en `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predeterminado: `~/.profile`) montado en `/home/node/.profile` y cargado antes de ejecutar las pruebas
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar solo las variables de entorno cargadas desde `OPENCLAW_PROFILE_FILE`, usando directorios temporales de configuración/espacio de trabajo y sin montajes externos de autenticación de CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predeterminado: `~/.cache/openclaw/docker-cli-tools`) montado en `/home/node/.npm-global` para instalaciones de CLI en caché dentro de Docker
- Los directorios/archivos de autenticación de CLI externos bajo `$HOME` se montan como solo lectura bajo `/host-auth...` y luego se copian en `/home/node/...` antes de que comiencen las pruebas
  - Directorios predeterminados: `.minimax`
  - Archivos predeterminados: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Las ejecuciones reducidas por proveedor montan solo los directorios/archivos necesarios inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sobrescribe manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o una lista separada por comas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para limitar la ejecución
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar proveedores dentro del contenedor
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar una imagen `openclaw:local-live` existente en repeticiones que no necesitan una reconstrucción
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantizar que las credenciales provengan del almacén de perfiles (no del entorno)
- `OPENCLAW_OPENWEBUI_MODEL=...` para elegir el modelo expuesto por el Gateway para la prueba smoke de Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para sobrescribir el prompt de comprobación de nonce usado por la prueba smoke de Open WebUI
- `OPENWEBUI_IMAGE=...` para sobrescribir la etiqueta de imagen fijada de Open WebUI

## Comprobación de documentación

Ejecuta comprobaciones de documentación después de editar documentos: `pnpm check:docs`.
Ejecuta la validación completa de anclas de Mintlify cuando también necesites comprobaciones de encabezados dentro de la página: `pnpm docs:check-links:anchors`.

## Regresiones sin conexión (seguras para CI)

Estas son regresiones de “pipeline real” sin proveedores reales:

- Llamadas de herramientas del Gateway (OpenAI simulado, Gateway real + bucle de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Asistente del Gateway (WS `wizard.start`/`wizard.next`, escribe configuración + autenticación aplicada): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evaluaciones de fiabilidad del agente (Skills)

Ya tenemos algunas pruebas seguras para CI que se comportan como “evaluaciones de fiabilidad del agente”:

- Llamadas de herramientas simuladas a través del Gateway real + bucle de agente (`src/gateway/gateway.test.ts`).
- Flujos de asistente de extremo a extremo que validan el cableado de sesión y los efectos de configuración (`src/gateway/gateway.test.ts`).

Lo que aún falta para Skills (consulta [Skills](/es/tools/skills)):

- **Decisión:** cuando las Skills se enumeran en el prompt, ¿el agente elige la Skill correcta (o evita las irrelevantes)?
- **Cumplimiento:** ¿el agente lee `SKILL.md` antes de usarla y sigue los pasos/argumentos requeridos?
- **Contratos de flujo de trabajo:** escenarios de varios turnos que verifican el orden de herramientas, la transferencia del historial de sesión y los límites del sandbox.

Las evaluaciones futuras deben mantenerse deterministas primero:

- Un ejecutor de escenarios con proveedores simulados para verificar llamadas de herramientas + orden, lecturas de archivos de Skill y cableado de sesión.
- Una pequeña suite de escenarios centrados en Skills (usar frente a evitar, compuertas, inyección de prompts).
- Evaluaciones en vivo opcionales (opt-in, controladas por variables de entorno) solo después de que la suite segura para CI esté implementada.

## Pruebas de contrato (forma de Plugin y canal)

Las pruebas de contrato verifican que cada Plugin y canal registrado cumpla su
contrato de interfaz. Iteran sobre todos los Plugins descubiertos y ejecutan una suite de
aserciones de forma y comportamiento. La lane de unidad predeterminada de `pnpm test`
omite intencionalmente estos archivos compartidos de seams y smoke; ejecuta los comandos de contrato explícitamente
cuando toques superficies compartidas de canal o proveedor.

### Comandos

- Todos los contratos: `pnpm test:contracts`
- Solo contratos de canal: `pnpm test:contracts:channels`
- Solo contratos de proveedor: `pnpm test:contracts:plugins`

### Contratos de canal

Ubicados en `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma básica de Plugin (id, nombre, capacidades)
- **setup** - Contrato del asistente de configuración
- **session-binding** - Comportamiento de vinculación de sesión
- **outbound-payload** - Estructura de payload de mensaje
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
- Después de añadir o modificar un Plugin de canal o proveedor
- Después de refactorizar el registro o descubrimiento de Plugins

Las pruebas de contrato se ejecutan en CI y no requieren claves de API reales.

## Añadir regresiones (guía)

Cuando corrijas un problema de proveedor/modelo descubierto en vivo:

- Añade una regresión segura para CI si es posible (proveedor mock/stub, o captura la transformación exacta de forma de la solicitud)
- Si es inherentemente solo en vivo (límites de tasa, políticas de autenticación), mantén la prueba en vivo limitada y opt-in mediante variables de entorno
- Prefiere apuntar a la capa más pequeña que detecte el error:
  - error de conversión/reproducción de solicitud del proveedor → prueba directa de modelos
  - error de pipeline de sesión/historial/herramientas del Gateway → prueba smoke en vivo del Gateway o prueba simulada del Gateway segura para CI
- Barrera de recorrido de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un objetivo muestreado por clase de SecretRef a partir de metadatos del registro (`listSecretTargetRegistryEntries()`), y luego verifica que se rechacen los ids de ejecución con segmentos de recorrido.
  - Si añades una nueva familia de objetivos SecretRef `includeInPlan` en `src/secrets/target-registry-data.ts`, actualiza `classifyTargetClass` en esa prueba. La prueba falla intencionalmente ante ids de objetivo sin clasificar para que las clases nuevas no se omitan silenciosamente.

## Relacionado

- [Pruebas en vivo](/es/help/testing-live)
- [Pruebas de actualizaciones y Plugins](/es/help/testing-updates-plugins)
- [CI](/es/ci)
