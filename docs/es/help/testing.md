---
read_when:
    - Ejecución de pruebas localmente o en CI
    - Añadir pruebas de regresión para errores de modelo/proveedor
    - Depuración del comportamiento de Gateway + agente
summary: 'Kit de pruebas: suites unitarias/e2e/en vivo, ejecutores Docker y qué cubre cada prueba'
title: Pruebas
x-i18n:
    generated_at: "2026-05-02T05:28:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9778143e73683fde493e9652f20b8301455b53adbe6c70e997f5af2f54b3fe6b
    source_path: help/testing.md
    workflow: 16
---

OpenClaw tiene tres suites de Vitest (unitarias/integración, E2E, en vivo) y un conjunto pequeño
de ejecutores de Docker. Este documento es una guía de "cómo probamos":

- Qué cubre cada suite (y qué deliberadamente _no_ cubre).
- Qué comandos ejecutar para flujos de trabajo comunes (local, antes de enviar cambios, depuración).
- Cómo las pruebas en vivo descubren credenciales y seleccionan modelos/proveedores.
- Cómo agregar regresiones para problemas reales de modelos/proveedores.

<Note>
**La pila de QA (qa-lab, qa-channel, carriles de transporte en vivo)** se documenta por separado:

- [Descripción general de QA](/es/concepts/qa-e2e-automation) — arquitectura, superficie de comandos, creación de escenarios.
- [QA Matrix](/es/concepts/qa-matrix) — referencia para `pnpm openclaw qa matrix`.
- [Canal de QA](/es/channels/qa-channel) — el Plugin de transporte sintético usado por escenarios respaldados por el repositorio.

Esta página cubre la ejecución de las suites de pruebas regulares y los ejecutores de Docker/Parallels. La sección de ejecutores específicos de QA que aparece abajo ([ejecutores específicos de QA](#qa-specific-runners)) enumera las invocaciones concretas de `qa` y remite a las referencias anteriores.
</Note>

## Inicio rápido

La mayoría de los días:

- Puerta completa (esperada antes de enviar cambios): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Ejecución local más rápida de la suite completa en una máquina con recursos: `pnpm test:max`
- Bucle directo de observación de Vitest: `pnpm test:watch`
- La selección directa de archivos ahora también enruta rutas de extensiones/canales: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefiere primero ejecuciones dirigidas cuando estés iterando sobre un único fallo.
- Sitio de QA respaldado por Docker: `pnpm qa:lab:up`
- Carril de QA respaldado por VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Cuando toques pruebas o quieras más confianza:

- Puerta de cobertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Al depurar proveedores/modelos reales (requiere credenciales reales):

- Suite en vivo (modelos + sondeos de herramienta/imagen de Gateway): `pnpm test:live`
- Apuntar a un archivo en vivo de forma silenciosa: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Barrido de modelos en vivo con Docker: `pnpm test:docker:live-models`
  - Cada modelo seleccionado ahora ejecuta un turno de texto más un pequeño sondeo de estilo lectura de archivo.
    Los modelos cuyos metadatos anuncian entrada `image` también ejecutan un turno de imagen diminuto.
    Desactiva los sondeos adicionales con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` al aislar fallos de proveedor.
  - Cobertura de CI: `OpenClaw Scheduled Live And E2E Checks` diario y
    `OpenClaw Release Checks` manual llaman al flujo de trabajo reutilizable en vivo/E2E con
    `include_live_suites: true`, que incluye trabajos de matriz separados de modelos en vivo con Docker
    divididos por proveedor.
  - Para repeticiones enfocadas en CI, despacha `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` y `live_models_only: true`.
  - Agrega nuevos secretos de proveedor de alta señal a `scripts/ci-hydrate-live-auth.sh`
    más `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` y sus
    llamadores programados/de lanzamiento.
- Smoke nativo de chat enlazado de Codex: `pnpm test:docker:live-codex-bind`
  - Ejecuta un carril en vivo de Docker contra la ruta de servidor de aplicación de Codex, enlaza un DM sintético
    de Slack con `/codex bind`, ejercita `/codex fast` y
    `/codex permissions`, y luego verifica que una respuesta simple y un adjunto de imagen
    pasen por el enlace nativo del Plugin en lugar de ACP.
- Smoke del arnés de servidor de aplicación de Codex: `pnpm test:docker:live-codex-harness`
  - Ejecuta turnos de agente de Gateway mediante el arnés de servidor de aplicación de Codex propiedad del Plugin,
    verifica `/codex status` y `/codex models`, y por defecto ejercita sondeos de imagen,
    MCP de Cron, subagente y Guardian. Desactiva el sondeo de subagente con
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` al aislar otros fallos del
    servidor de aplicación de Codex. Para una comprobación enfocada de subagente, desactiva los otros sondeos:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Esto sale después del sondeo de subagente a menos que
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` esté configurado.
- Smoke del comando de rescate de Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Comprobación opcional de máxima prudencia para la superficie del comando de rescate de canal de mensajes.
    Ejercita `/crestodian status`, encola un cambio persistente de modelo,
    responde `/crestodian yes` y verifica la ruta de escritura de auditoría/configuración.
- Smoke de Docker del planificador de Crestodian: `pnpm test:docker:crestodian-planner`
  - Ejecuta Crestodian en un contenedor sin configuración con una CLI de Claude falsa en `PATH`
    y verifica que la reserva difusa del planificador se traduzca en una escritura tipada de configuración auditada.
- Smoke de Docker de primera ejecución de Crestodian: `pnpm test:docker:crestodian-first-run`
  - Parte de un directorio de estado de OpenClaw vacío, enruta `openclaw` básico a
    Crestodian, aplica escrituras de configuración/modelo/agente/Plugin de Discord + SecretRef,
    valida la configuración y verifica entradas de auditoría. La misma ruta de configuración Ring 0
    también está cubierta en QA Lab por
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de costo Moonshot/Kimi: con `MOONSHOT_API_KEY` configurado, ejecuta
  `openclaw models list --provider moonshot --json`, luego ejecuta un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  aislado contra `moonshot/kimi-k2.6`. Verifica que el JSON informe Moonshot/K2.6 y que la
  transcripción del asistente almacene `usage.cost` normalizado.

<Tip>
Cuando solo necesites un caso que falla, prefiere acotar las pruebas en vivo mediante las variables de entorno de lista de permitidos descritas abajo.
</Tip>

## Ejecutores específicos de QA

Estos comandos se ubican junto a las suites de pruebas principales cuando necesitas realismo de QA-lab:

CI ejecuta QA Lab en flujos de trabajo dedicados. `Parity gate` se ejecuta en PRs coincidentes y
desde despacho manual con proveedores simulados. `QA-Lab - All Lanes` se ejecuta cada noche en
`main` y desde despacho manual con la puerta de paridad simulada, el carril Matrix en vivo,
el carril de Telegram en vivo administrado por Convex y el carril de Discord en vivo administrado por Convex como
trabajos paralelos. Las comprobaciones de QA programadas y de lanzamiento pasan Matrix `--profile fast`
explícitamente, mientras que la CLI de Matrix y la entrada del flujo de trabajo manual siguen teniendo
`all` como valor predeterminado; el despacho manual puede dividir `all` en trabajos `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` y `e2ee-cli`. `OpenClaw Release Checks` ejecuta paridad más
los carriles rápidos de Matrix y Telegram antes de la aprobación de lanzamiento, usando
`mock-openai/gpt-5.5` para las comprobaciones de transporte de lanzamiento de modo que permanezcan deterministas
y eviten el arranque normal del Plugin de proveedor. Estos gateways de transporte en vivo desactivan
la búsqueda de memoria; el comportamiento de memoria sigue cubierto por las suites de paridad de QA.

Los fragmentos de medios en vivo de lanzamiento completo usan
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, que ya tiene
`ffmpeg` y `ffprobe`. Los fragmentos de modelos/backend en vivo de Docker usan la imagen compartida
`ghcr.io/openclaw/openclaw-live-test:<sha>` creada una vez por commit seleccionado,
y luego la descargan con `OPENCLAW_SKIP_DOCKER_BUILD=1` en lugar de reconstruirla
dentro de cada fragmento.

- `pnpm openclaw qa suite`
  - Ejecuta escenarios de QA respaldados por el repositorio directamente en el host.
  - Ejecuta varios escenarios seleccionados en paralelo por defecto con trabajadores de
    Gateway aislados. `qa-channel` usa concurrencia 4 por defecto (limitada por la
    cantidad de escenarios seleccionados). Usa `--concurrency <count>` para ajustar la cantidad de
    trabajadores, o `--concurrency 1` para el carril serial anterior.
  - Sale con código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
    quieras artefactos sin un código de salida fallido.
  - Admite modos de proveedor `live-frontier`, `mock-openai` y `aimock`.
    `aimock` inicia un servidor de proveedor local respaldado por AIMock para cobertura experimental
    de fixture y simulación de protocolo sin reemplazar el carril `mock-openai`
    consciente del escenario.
- `pnpm test:gateway:cpu-scenarios`
  - Ejecuta el banco de arranque del Gateway más un pequeño paquete de escenarios simulados de QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) y escribe un resumen combinado de observación de CPU
    bajo `.artifacts/gateway-cpu-scenarios/`.
  - Marca por defecto solo observaciones sostenidas de CPU caliente (`--cpu-core-warn`
    más `--hot-wall-warn-ms`), así que los picos breves de arranque se registran como métricas
    sin parecer la regresión de fijación del Gateway de varios minutos.
  - Usa artefactos construidos de `dist`; ejecuta una compilación primero cuando el checkout no
    tenga ya salida de runtime reciente.
- `pnpm openclaw qa suite --runner multipass`
  - Ejecuta la misma suite de QA dentro de una VM Linux descartable de Multipass.
  - Mantiene el mismo comportamiento de selección de escenarios que `qa suite` en el host.
  - Reutiliza las mismas banderas de selección de proveedor/modelo que `qa suite`.
  - Las ejecuciones en vivo reenvían las entradas de autenticación de QA admitidas que son prácticas para el invitado:
    claves de proveedor basadas en entorno, la ruta de configuración de proveedor en vivo de QA y `CODEX_HOME`
    cuando está presente.
  - Los directorios de salida deben permanecer bajo la raíz del repositorio para que el invitado pueda escribir de vuelta mediante
    el espacio de trabajo montado.
  - Escribe el informe + resumen normales de QA más los registros de Multipass bajo
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia el sitio de QA respaldado por Docker para trabajo de QA estilo operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Construye un tarball npm desde el checkout actual, lo instala globalmente en
    Docker, ejecuta onboarding no interactivo de clave de API de OpenAI, configura Telegram
    por defecto, verifica que el runtime del Plugin empaquetado cargue sin reparación de
    dependencias al arrancar, ejecuta doctor y ejecuta un turno de agente local contra un
    endpoint de OpenAI simulado.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para ejecutar el mismo carril de instalación empaquetada
    con Discord.
- `pnpm test:docker:session-runtime-context`
  - Ejecuta un smoke determinista de Docker de aplicación construida para transcripciones de contexto de runtime
    incrustado. Verifica que el contexto de runtime oculto de OpenClaw se persista como un
    mensaje personalizado no visible en lugar de filtrarse al turno visible del usuario,
    luego siembra un JSONL de sesión rota afectada y verifica que
    `openclaw doctor --fix` lo reescriba a la rama activa con una copia de seguridad.
- `pnpm test:docker:npm-telegram-live`
  - Instala un paquete candidato de OpenClaw en Docker, ejecuta onboarding de paquete instalado,
    configura Telegram mediante la CLI instalada, luego reutiliza el
    carril de QA de Telegram en vivo con ese paquete instalado como el Gateway SUT.
  - Usa por defecto `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; configura
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` o
    `OPENCLAW_CURRENT_PACKAGE_TGZ` para probar un tarball local resuelto en lugar de
    instalar desde el registro.
  - Usa las mismas credenciales de entorno de Telegram o fuente de credenciales de Convex que
    `pnpm openclaw qa telegram`. Para automatización de CI/lanzamiento, configura
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` más
    `OPENCLAW_QA_CONVEX_SITE_URL` y el secreto de rol. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` y un secreto de rol de Convex están presentes en CI,
    el wrapper de Docker selecciona Convex automáticamente.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sobrescribe el
    `OPENCLAW_QA_CREDENTIAL_ROLE` compartido solo para este carril.
  - GitHub Actions expone este carril como el flujo de trabajo manual de mantenedor
    `NPM Telegram Beta E2E`. No se ejecuta al fusionar. El flujo de trabajo usa el entorno
    `qa-live-shared` y leases de credenciales de CI de Convex.
- GitHub Actions también expone `Package Acceptance` para prueba de producto en ejecución lateral
  contra un paquete candidato. Acepta una ref de confianza, una especificación npm publicada,
  una URL HTTPS de tarball más SHA-256, o un artefacto tarball de otra ejecución, sube
  el `openclaw-current.tgz` normalizado como `package-under-test`, y luego ejecuta el
  planificador E2E de Docker existente con perfiles de carril smoke, package, product, full o custom.
  Configura `telegram_mode=mock-openai` o `live-frontier` para ejecutar el
  flujo de trabajo de QA de Telegram contra el mismo artefacto `package-under-test`.
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

- La prueba de artefacto descarga un artefacto tarball desde otra ejecución de Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Empaqueta e instala la compilación actual de OpenClaw en Docker, inicia el Gateway
    con OpenAI configurado y luego habilita los canales/plugins incluidos mediante ediciones
    de configuración.
  - Verifica que el descubrimiento de configuración deje ausentes los plugins descargables sin configurar,
    que la primera reparación configurada de doctor instale explícitamente cada Plugin descargable
    faltante y que un segundo reinicio no ejecute una reparación oculta de dependencias.
  - También instala una línea base npm anterior conocida, habilita Telegram antes de ejecutar
    `openclaw update --tag <candidate>` y verifica que el doctor posterior a la actualización
    del candidato limpie los restos heredados de dependencias de plugins sin una
    reparación postinstall del lado del arnés.
- `pnpm test:parallels:npm-update`
  - Ejecuta el smoke de actualización de instalación empaquetada nativa en invitados de Parallels. Cada
    plataforma seleccionada primero instala el paquete de línea base solicitado, luego ejecuta
    el comando `openclaw update` instalado en el mismo invitado y verifica la
    versión instalada, el estado de actualización, la preparación del Gateway y un turno de agente
    local.
  - Usa `--platform macos`, `--platform windows` o `--platform linux` mientras
    iteras en un invitado. Usa `--json` para la ruta del artefacto de resumen y
    el estado por lane.
  - El lane de OpenAI usa `openai/gpt-5.5` para la prueba de turno de agente en vivo de forma
    predeterminada. Pasa `--model <provider/model>` o establece
    `OPENCLAW_PARALLELS_OPENAI_MODEL` cuando valides deliberadamente otro
    modelo de OpenAI.
  - Envuelve las ejecuciones locales largas en un timeout del host para que los bloqueos de transporte
    de Parallels no consuman el resto de la ventana de pruebas:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - El script escribe registros de lane anidados en `/tmp/openclaw-parallels-npm-update.*`.
    Inspecciona `windows-update.log`, `macos-update.log` o `linux-update.log`
    antes de asumir que el contenedor externo está bloqueado.
  - La actualización de Windows puede pasar de 10 a 15 minutos en el doctor posterior a la actualización y en el trabajo de
    actualización de paquetes en un invitado frío; eso sigue siendo saludable cuando el registro de depuración npm
    anidado avanza.
  - No ejecutes este contenedor agregado en paralelo con lanes de smoke individuales de Parallels
    para macOS, Windows o Linux. Comparten el estado de la VM y pueden colisionar en
    la restauración de instantáneas, el servicio de paquetes o el estado del Gateway invitado.
  - La prueba posterior a la actualización ejecuta la superficie normal de plugins incluidos porque
    las fachadas de capacidad como habla, generación de imágenes y comprensión
    de medios se cargan a través de APIs de runtime incluidas aunque el turno de agente
    en sí solo compruebe una respuesta de texto simple.

- `pnpm openclaw qa aimock`
  - Inicia solo el servidor proveedor AIMock local para pruebas smoke directas del protocolo.
- `pnpm openclaw qa matrix`
  - Ejecuta el lane de QA en vivo de Matrix contra un homeserver Tuwunel desechable respaldado por Docker. Solo desde checkout de código fuente; las instalaciones empaquetadas no incluyen `qa-lab`.
  - CLI completa, catálogo de perfiles/escenarios, variables de entorno y disposición de artefactos: [QA de Matrix](/es/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Ejecuta el lane de QA en vivo de Telegram contra un grupo privado real usando los tokens de bot del controlador y del SUT desde el entorno.
  - Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. El id de grupo debe ser el id numérico del chat de Telegram.
  - Admite `--credential-source convex` para credenciales agrupadas compartidas. Usa el modo de entorno de forma predeterminada, o establece `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases agrupados.
  - Sale con código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
    quieras artefactos sin un código de salida de fallo.
  - Requiere dos bots distintos en el mismo grupo privado, con el bot SUT exponiendo un nombre de usuario de Telegram.
  - Para una observación estable de bot a bot, habilita Bot-to-Bot Communication Mode en `@BotFather` para ambos bots y asegúrate de que el bot controlador pueda observar el tráfico de bots del grupo.
  - Escribe un informe de QA de Telegram, un resumen y un artefacto de mensajes observados en `.artifacts/qa-e2e/...`. Los escenarios con respuesta incluyen RTT desde la solicitud de envío del controlador hasta la respuesta SUT observada.

Los lanes de transporte en vivo comparten un contrato estándar para que los transportes nuevos no se desvíen; la matriz de cobertura por lane vive en [descripción general de QA → Cobertura de transporte en vivo](/es/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` es la suite sintética amplia y no forma parte de esa matriz.

### Credenciales compartidas de Telegram mediante Convex (v1)

Cuando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
`openclaw qa telegram`, QA lab adquiere un lease exclusivo desde un pool respaldado por Convex, envía heartbeats
de ese lease mientras el lane se ejecuta y libera el lease al apagarse.

Andamiaje de referencia del proyecto Convex:

- `qa/convex-credential-broker/`

Variables de entorno requeridas:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por ejemplo `https://your-deployment.convex.site`)
- Un secreto para el rol seleccionado:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Selección de rol de credenciales:
  - CLI: `--credential-role maintainer|ci`
  - Valor predeterminado de entorno: `OPENCLAW_QA_CREDENTIAL_ROLE` (por defecto `ci` en CI, `maintainer` en otros casos)

Variables de entorno opcionales:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predeterminado `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predeterminado `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predeterminado `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predeterminado `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predeterminado `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de trazado opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs Convex `http://` de loopback para desarrollo solo local.

`OPENCLAW_QA_CONVEX_SITE_URL` debe usar `https://` en operación normal.

Los comandos de administración para mantenedores (agregar/quitar/listar en el pool) requieren
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` específicamente.

Helpers de CLI para mantenedores:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `doctor` antes de ejecuciones en vivo para comprobar la URL del sitio Convex, los secretos del broker,
el prefijo del endpoint, el timeout HTTP y la accesibilidad de admin/list sin imprimir
valores secretos. Usa `--json` para salida legible por máquina en scripts y utilidades
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

Forma del payload para tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` debe ser una cadena de id numérico de chat de Telegram.
- `admin/add` valida esta forma para `kind: "telegram"` y rechaza payloads mal formados.

### Agregar un canal a QA

La arquitectura y los nombres de helpers de escenarios para nuevos adaptadores de canal viven en [descripción general de QA → Agregar un canal](/es/concepts/qa-e2e-automation#adding-a-channel). El mínimo requerido: implementar el runner de transporte en el seam de host compartido de `qa-lab`, declarar `qaRunners` en el manifiesto del Plugin, montar como `openclaw qa <runner>` y crear escenarios en `qa/scenarios/`.

## Suites de prueba (qué se ejecuta dónde)

Piensa en las suites como “realismo creciente” (y mayor inestabilidad/costo):

### Unidad / integración (predeterminado)

- Comando: `pnpm test`
- Configuración: las ejecuciones no dirigidas usan el conjunto de shards `vitest.full-*.config.ts` y pueden expandir shards multiproyecto en configuraciones por proyecto para la planificación paralela
- Archivos: inventarios core/unit en `src/**/*.test.ts`, `packages/**/*.test.ts` y `test/**/*.test.ts`; las pruebas unitarias de UI se ejecutan en el shard dedicado `unit-ui`
- Alcance:
  - Pruebas unitarias puras
  - Pruebas de integración en proceso (autenticación de Gateway, enrutamiento, herramientas, análisis, configuración)
  - Regresiones deterministas para bugs conocidos
- Expectativas:
  - Se ejecuta en CI
  - No requiere claves reales
  - Debe ser rápido y estable
  - Las pruebas del resolver y del cargador de superficie pública deben probar el comportamiento de fallback amplio de `api.js` y
    `runtime-api.js` con fixtures de plugins mínimos generados, no con
    APIs reales de código fuente de plugins incluidos. Las cargas reales de API de plugins pertenecen a
    suites de contrato/integración propiedad del Plugin.

<AccordionGroup>
  <Accordion title="Proyectos, shards y lanes con alcance">

    - `pnpm test` sin objetivo ejecuta doce configuraciones de shards más pequeñas (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) en lugar de un único proceso gigante de proyecto raíz nativo. Esto reduce el RSS máximo en máquinas cargadas y evita que el trabajo de auto-reply/extensions deje sin recursos a suites no relacionadas.
    - `pnpm test --watch` sigue usando el grafo de proyectos raíz nativo de `vitest.config.ts`, porque un bucle de observación con varios shards no es práctico.
    - `pnpm test`, `pnpm test:watch` y `pnpm test:perf:imports` enrutan primero los objetivos explícitos de archivo/directorio por carriles con alcance, de modo que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar el costo de arranque completo del proyecto raíz.
    - `pnpm test:changed` expande las rutas git cambiadas a carriles con alcance baratos de forma predeterminada: ediciones directas de pruebas, archivos hermanos `*.test.ts`, asignaciones explícitas de código fuente y dependientes locales del grafo de importaciones. Las ediciones de configuración/setup/package no ejecutan pruebas amplias salvo que uses explícitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` es la puerta normal inteligente de comprobación local para trabajo acotado. Clasifica el diff en core, pruebas de core, extensions, pruebas de extension, apps, docs, metadatos de release, herramientas live Docker y herramientas, y luego ejecuta los comandos correspondientes de typecheck, lint y guard. No ejecuta pruebas Vitest; llama a `pnpm test:changed` o a `pnpm test <target>` explícito para obtener prueba de tests. Los incrementos de versión que solo afectan metadatos de release ejecutan comprobaciones dirigidas de versión/configuración/dependencia raíz, con una guarda que rechaza cambios de package fuera del campo de versión de nivel superior.
    - Las ediciones del arnés ACP live Docker ejecutan comprobaciones enfocadas: sintaxis de shell para los scripts de autenticación live Docker y una ejecución en seco del planificador live Docker. Los cambios en `package.json` se incluyen solo cuando el diff se limita a `scripts["test:docker:live-*"]`; las ediciones de dependencias, exports, versión y otras superficies de package siguen usando las guardas más amplias.
    - Las pruebas unitarias ligeras en importaciones de agentes, comandos, plugins, helpers de auto-reply, `plugin-sdk` y áreas similares de utilidades puras se enrutan por el carril `unit-fast`, que omite `test/setup-openclaw-runtime.ts`; los archivos con estado o pesados en runtime permanecen en los carriles existentes.
    - Algunos archivos fuente helper de `plugin-sdk` y `commands` también asignan las ejecuciones en modo changed a pruebas hermanas explícitas en esos carriles ligeros, de modo que las ediciones de helpers evitan volver a ejecutar toda la suite pesada de ese directorio.
    - `auto-reply` tiene buckets dedicados para helpers core de nivel superior, pruebas de integración `reply.*` de nivel superior y el subárbol `src/auto-reply/reply/**`. CI divide además el subárbol reply en shards de agent-runner, dispatch y commands/state-routing para que un bucket pesado en importaciones no posea toda la cola de Node.
    - La CI normal de PR/main omite intencionadamente el barrido por lotes de extensions y el shard `agentic-plugins` solo de release. Full Release Validation despacha el flujo de trabajo hijo separado `Plugin Prerelease` para esas suites pesadas en plugin/extensions en candidatos de release.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Cuando cambies entradas de descubrimiento de herramientas de mensajes o contexto de runtime de compaction, conserva ambos niveles de cobertura.
    - Añade regresiones enfocadas de helpers para límites puros de enrutamiento y normalización.
    - Mantén sanas las suites de integración del runner embebido:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` y
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Esas suites verifican que los ids con alcance y el comportamiento de compaction sigan fluyendo por las rutas reales `run.ts` / `compact.ts`; las pruebas solo de helpers no son un sustituto suficiente de esas rutas de integración.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - La configuración base de Vitest usa `threads` de forma predeterminada.
    - La configuración compartida de Vitest fija `isolate: false` y usa el runner no aislado en los proyectos raíz, e2e y configuraciones live.
    - El carril UI raíz conserva su setup y optimizador de `jsdom`, pero también se ejecuta en el runner compartido no aislado.
    - Cada shard de `pnpm test` hereda los mismos valores predeterminados `threads` + `isolate: false` desde la configuración compartida de Vitest.
    - `scripts/run-vitest.mjs` añade `--no-maglev` de forma predeterminada para procesos Node hijos de Vitest a fin de reducir la rotación de compilación de V8 durante grandes ejecuciones locales. Configura `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar con el comportamiento estándar de V8.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` muestra qué carriles arquitectónicos activa un diff.
    - El hook pre-commit solo formatea. Vuelve a preparar los archivos formateados y no ejecuta lint, typecheck ni pruebas.
    - Ejecuta `pnpm check:changed` explícitamente antes del handoff o push cuando necesites la puerta inteligente de comprobación local.
    - `pnpm test:changed` se enruta por carriles con alcance baratos de forma predeterminada. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el agente decida que una edición de arnés, configuración, package o contrato realmente necesita cobertura Vitest más amplia.
    - `pnpm test:max` y `pnpm test:changed:max` mantienen el mismo comportamiento de enrutamiento, solo con un límite de workers más alto.
    - El autoescalado de workers locales es intencionadamente conservador y retrocede cuando el promedio de carga del host ya es alto, por lo que varias ejecuciones concurrentes de Vitest hacen menos daño de forma predeterminada.
    - La configuración base de Vitest marca los proyectos/archivos de configuración como `forceRerunTriggers` para que las reevaluaciones en modo changed sigan siendo correctas cuando cambia el cableado de pruebas.
    - La configuración mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado en hosts compatibles; configura `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si quieres una ubicación de caché explícita para perfilado directo.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` habilita el reporte de duración de importaciones de Vitest más la salida de desglose de importaciones.
    - `pnpm test:perf:imports:changed` limita la misma vista de perfilado a archivos cambiados desde `origin/main`.
    - Los datos de tiempos de shards se escriben en `.artifacts/vitest-shard-timings.json`. Las ejecuciones de configuración completa usan la ruta de configuración como clave; los shards de CI con patrones de inclusión añaden el nombre del shard para que los shards filtrados puedan rastrearse por separado.
    - Cuando una prueba caliente todavía pasa la mayor parte del tiempo en importaciones de arranque, mantén las dependencias pesadas detrás de un seam local estrecho `*.runtime.ts` y simula ese seam directamente en lugar de hacer deep-import de helpers de runtime solo para pasarlos por `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara el `test:changed` enrutado contra la ruta nativa del proyecto raíz para ese diff confirmado e imprime tiempo de pared más RSS máximo en macOS.
    - `pnpm test:perf:changed:bench -- --worktree` mide el árbol sucio actual enrutando la lista de archivos cambiados por `scripts/test-projects.mjs` y la configuración raíz de Vitest.
    - `pnpm test:perf:profile:main` escribe un perfil de CPU del hilo principal para la sobrecarga de arranque y transformación de Vitest/Vite.
    - `pnpm test:perf:profile:runner` escribe perfiles de CPU+heap del runner para la suite unitaria con el paralelismo de archivos deshabilitado.

  </Accordion>
</AccordionGroup>

### Estabilidad (gateway)

- Comando: `pnpm test:stability:gateway`
- Configuración: `vitest.gateway.config.ts`, forzado a un worker
- Alcance:
  - Inicia un Gateway real de loopback con diagnósticos habilitados de forma predeterminada
  - Impulsa rotación sintética de mensajes gateway, memoria y cargas útiles grandes por la ruta de eventos de diagnóstico
  - Consulta `diagnostics.stability` mediante el RPC WS del Gateway
  - Cubre helpers de persistencia del paquete de estabilidad de diagnóstico
  - Afirma que el registrador permanece acotado, las muestras RSS sintéticas se mantienen por debajo del presupuesto de presión y las profundidades de cola por sesión vuelven a cero
- Expectativas:
  - Seguro para CI y sin claves
  - Carril estrecho para seguimiento de regresiones de estabilidad, no un sustituto de la suite completa de Gateway

### E2E (smoke de gateway)

- Comando: `pnpm test:e2e`
- Configuración: `vitest.e2e.config.ts`
- Archivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` y pruebas E2E de plugins incluidos bajo `extensions/`
- Valores predeterminados de runtime:
  - Usa `threads` de Vitest con `isolate: false`, coincidiendo con el resto del repo.
  - Usa workers adaptativos (CI: hasta 2, local: 1 de forma predeterminada).
  - Se ejecuta en modo silencioso de forma predeterminada para reducir la sobrecarga de E/S de consola.
- Overrides útiles:
  - `OPENCLAW_E2E_WORKERS=<n>` para forzar el número de workers (limitado a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para volver a habilitar la salida detallada de consola.
- Alcance:
  - Comportamiento end-to-end de gateway con múltiples instancias
  - Superficies WebSocket/HTTP, emparejamiento de nodos y redes más pesadas
- Expectativas:
  - Se ejecuta en CI (cuando está habilitado en el pipeline)
  - No requiere claves reales
  - Más partes móviles que las pruebas unitarias (puede ser más lento)

### E2E: smoke del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Archivo: `extensions/openshell/src/backend.e2e.test.ts`
- Alcance:
  - Inicia un gateway OpenShell aislado en el host mediante Docker
  - Crea un sandbox a partir de un Dockerfile local temporal
  - Ejercita el backend OpenShell de OpenClaw mediante `sandbox ssh-config` real + ejecución SSH
  - Verifica el comportamiento de sistema de archivos remoto-canónico mediante el puente fs del sandbox
- Expectativas:
  - Solo opt-in; no forma parte de la ejecución predeterminada de `pnpm test:e2e`
  - Requiere una CLI `openshell` local y un daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` aislados y luego destruye el gateway y el sandbox de prueba
- Overrides útiles:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar la prueba al ejecutar manualmente la suite e2e más amplia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apuntar a un binario CLI no predeterminado o script wrapper

### Live (proveedores reales + modelos reales)

- Comando: `pnpm test:live`
- Configuración: `vitest.live.config.ts`
- Archivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` y pruebas live de plugins incluidos bajo `extensions/`
- Predeterminado: **habilitado** por `pnpm test:live` (configura `OPENCLAW_LIVE_TEST=1`)
- Alcance:
  - “¿Este proveedor/modelo realmente funciona _hoy_ con credenciales reales?”
  - Detecta cambios de formato de proveedor, particularidades de llamadas a herramientas, problemas de autenticación y comportamiento de rate limit
- Expectativas:
  - No es estable para CI por diseño (redes reales, políticas de proveedores reales, cuotas, interrupciones)
  - Cuesta dinero / usa rate limits
  - Prefiere ejecutar subconjuntos acotados en lugar de “todo”
- Las ejecuciones live cargan `~/.profile` para recoger claves API faltantes.
- De forma predeterminada, las ejecuciones live aún aíslan `HOME` y copian material de configuración/autenticación a un home de prueba temporal para que los fixtures unitarios no puedan mutar tu `~/.openclaw` real.
- Configura `OPENCLAW_LIVE_USE_REAL_HOME=1` solo cuando necesites intencionadamente que las pruebas live usen tu directorio home real.
- `pnpm test:live` ahora usa de forma predeterminada un modo más silencioso: conserva la salida de progreso `[live] ...`, pero suprime el aviso adicional de `~/.profile` y silencia los logs de bootstrap del gateway/el ruido de Bonjour. Configura `OPENCLAW_LIVE_TEST_QUIET=0` si quieres recuperar todos los logs de arranque.
- Rotación de claves API (específica por proveedor): configura `*_API_KEYS` con formato de comas/punto y coma o `*_API_KEY_1`, `*_API_KEY_2` (por ejemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) o override por live mediante `OPENCLAW_LIVE_*_KEY`; las pruebas reintentan ante respuestas de rate limit.
- Salida de progreso/heartbeat:
  - Las suites live ahora emiten líneas de progreso a stderr para que las llamadas largas a proveedores sean visiblemente activas incluso cuando la captura de consola de Vitest está silenciosa.
  - `vitest.live.config.ts` deshabilita la interceptación de consola de Vitest para que las líneas de progreso de proveedor/gateway se transmitan inmediatamente durante ejecuciones live.
  - Ajusta los heartbeats de modelo directo con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajusta los heartbeats de gateway/probe con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## ¿Qué suite debería ejecutar?

Usa esta tabla de decisión:

- Editar lógica/pruebas: ejecuta `pnpm test` (y `pnpm test:coverage` si cambiaste mucho)
- Tocar redes del gateway / protocolo WS / emparejamiento: añade `pnpm test:e2e`
- Depurar “mi bot no funciona” / fallos específicos del proveedor / llamada a herramientas: ejecuta un `pnpm test:live` acotado

## Pruebas live (con acceso a red)

Para la matriz de modelos live, las pruebas de humo del backend de la CLI, las pruebas de humo de ACP, el arnés del app-server de Codex y todas las pruebas live de proveedores multimedia (Deepgram, BytePlus, ComfyUI, imagen, música, vídeo, arnés multimedia), además de la gestión de credenciales para ejecuciones live, consulta [Pruebas de suites live](/es/help/testing-live). Para la lista de verificación dedicada de actualización y validación de plugins, consulta [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins).

## Ejecutores de Docker (comprobaciones opcionales de “funciona en Linux”)

Estos ejecutores de Docker se dividen en dos grupos:

- Ejecutores de modelos live: `test:docker:live-models` y `test:docker:live-gateway` ejecutan solo su archivo live correspondiente de claves de perfil dentro de la imagen Docker del repositorio (`src/agents/models.profiles.live.test.ts` y `src/gateway/gateway-models.profiles.live.test.ts`), montando tu directorio de configuración local y el espacio de trabajo (y cargando `~/.profile` si está montado). Los puntos de entrada locales correspondientes son `test:live:models-profiles` y `test:live:gateway-profiles`.
- Los ejecutores live de Docker usan de forma predeterminada un límite de prueba de humo más pequeño para que una revisión completa de Docker siga siendo práctica:
  `test:docker:live-models` usa de forma predeterminada `OPENCLAW_LIVE_MAX_MODELS=12`, y
  `test:docker:live-gateway` usa de forma predeterminada `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` y
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sobrescribe esas variables de entorno cuando quieras explícitamente el escaneo exhaustivo más grande.
- `test:docker:all` construye la imagen Docker live una vez mediante `test:docker:live-build`, empaqueta OpenClaw una vez como tarball de npm mediante `scripts/package-openclaw-for-docker.mjs` y luego construye/reutiliza dos imágenes de `scripts/e2e/Dockerfile`. La imagen básica es solo el ejecutor Node/Git para carriles de instalación/actualización/dependencias de plugins; esos carriles montan el tarball precompilado. La imagen funcional instala el mismo tarball en `/app` para carriles de funcionalidad de la aplicación compilada. Las definiciones de carriles de Docker están en `scripts/lib/docker-e2e-scenarios.mjs`; la lógica del planificador está en `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ejecuta el plan seleccionado. El agregado usa un planificador local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla los espacios de proceso, mientras que los límites de recursos evitan que los carriles live pesados, de instalación npm y multiservicio empiecen todos a la vez. Si un solo carril pesa más que los límites activos, el planificador aún puede iniciarlo cuando el grupo está vacío y luego lo mantiene ejecutándose solo hasta que vuelva a haber capacidad disponible. Los valores predeterminados son 10 espacios, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` y `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajusta `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` solo cuando el host de Docker tenga más margen. El ejecutor realiza una comprobación previa de Docker de forma predeterminada, elimina contenedores E2E de OpenClaw obsoletos, imprime el estado cada 30 segundos, almacena los tiempos de carriles correctos en `.artifacts/docker-tests/lane-timings.json` y usa esos tiempos para iniciar primero los carriles más largos en ejecuciones posteriores. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir el manifiesto ponderado de carriles sin construir ni ejecutar Docker, o `node scripts/test-docker-all.mjs --plan-json` para imprimir el plan de CI de los carriles seleccionados, las necesidades de paquete/imagen y las credenciales.
- `Package Acceptance` es la puerta de paquetes nativa de GitHub para “¿este tarball instalable funciona como producto?”. Resuelve un paquete candidato desde `source=npm`, `source=ref`, `source=url` o `source=artifact`, lo sube como `package-under-test` y luego ejecuta los carriles E2E reutilizables de Docker contra ese tarball exacto en lugar de volver a empaquetar la referencia seleccionada. Los perfiles se ordenan por amplitud: `smoke`, `package`, `product` y `full`. Consulta [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins) para el contrato de paquete/actualización/plugin, la matriz de supervivencia de actualizaciones publicadas, los valores predeterminados de lanzamiento y el triaje de fallos.
- Las comprobaciones de compilación y lanzamiento ejecutan `scripts/check-cli-bootstrap-imports.mjs` después de tsdown. La protección recorre el grafo compilado estático desde `dist/entry.js` y `dist/cli/run-main.js` y falla si el arranque previo al despacho importa dependencias de paquete como Commander, interfaz de prompts, undici o logging antes del despacho de comandos; también mantiene dentro del presupuesto el fragmento empaquetado de ejecución del gateway y rechaza importaciones estáticas de rutas conocidas frías del gateway. La prueba de humo de la CLI empaquetada también cubre ayuda raíz, ayuda de incorporación, ayuda de doctor, estado, esquema de configuración y un comando de listado de modelos.
- La compatibilidad heredada de Package Acceptance está limitada a `2026.4.25` (`2026.4.25-beta.*` incluido). Hasta ese límite, el arnés tolera solo brechas de metadatos de paquetes publicados: entradas privadas omitidas del inventario de QA, falta de `gateway install --wrapper`, falta de archivos de parche en el fixture git derivado del tarball, falta de `update.channel` persistente, ubicaciones heredadas de registros de instalación de plugins, falta de persistencia de registros de instalación del marketplace y migración de metadatos de configuración durante `plugins update`. Para paquetes posteriores a `2026.4.25`, esas rutas son fallos estrictos.
- Ejecutores de humo de contenedores: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` y `test:docker:config-reload` arrancan uno o más contenedores reales y verifican rutas de integración de nivel superior.

Los ejecutores Docker de modelos live también montan mediante bind solo los homes de autenticación de CLI necesarios (o todos los compatibles cuando la ejecución no está acotada) y luego los copian al home del contenedor antes de la ejecución para que OAuth de CLI externa pueda refrescar tokens sin modificar el almacén de autenticación del host:

- Modelos directos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Prueba de humo de enlace ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; cubre Claude, Codex y Gemini de forma predeterminada, con cobertura estricta de Droid/OpenCode mediante `pnpm test:docker:live-acp-bind:droid` y `pnpm test:docker:live-acp-bind:opencode`)
- Prueba de humo del backend de la CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Prueba de humo del arnés del servidor de aplicación de Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desarrollo: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Prueba de humo de observabilidad: `pnpm qa:otel:smoke` es una vía privada de comprobación de código fuente de QA. Intencionalmente no forma parte de las vías de lanzamiento Docker del paquete porque el tarball de npm omite QA Lab.
- Prueba de humo en vivo de Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Asistente de incorporación (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Prueba de humo de incorporación/canal/agente del tarball de npm: `pnpm test:docker:npm-onboard-channel-agent` instala el tarball empaquetado de OpenClaw globalmente en Docker, configura OpenAI mediante incorporación con referencia de entorno más Telegram de forma predeterminada, ejecuta doctor y ejecuta un turno simulado de agente de OpenAI. Reutiliza un tarball ya creado con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la reconstrucción del host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` o cambia de canal con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Prueba de humo de cambio de canal de actualización: `pnpm test:docker:update-channel-switch` instala el tarball empaquetado de OpenClaw globalmente en Docker, cambia del paquete `stable` a git `dev`, verifica que el canal persistido y el plugin posterior a la actualización funcionen, luego vuelve al paquete `stable` y comprueba el estado de actualización.
- Prueba de humo de supervivencia de actualización: `pnpm test:docker:upgrade-survivor` instala el tarball empaquetado de OpenClaw sobre un fixture sucio de usuario antiguo con agentes, configuración de canal, listas de permitidos de plugins, estado obsoleto de dependencias de plugins y archivos existentes de workspace/sesión. Ejecuta una actualización de paquete más doctor no interactivo sin claves de proveedor en vivo ni de canal, luego inicia un Gateway de loopback y comprueba la preservación de configuración/estado más los presupuestos de inicio/estado.
- Prueba de humo publicada de supervivencia de actualización: `pnpm test:docker:published-upgrade-survivor` instala `openclaw@latest` de forma predeterminada, siembra archivos realistas de usuario existente, configura esa línea base con una receta de comandos integrada, valida la configuración resultante, actualiza esa instalación publicada al tarball candidato, ejecuta doctor no interactivo, escribe `.artifacts/upgrade-survivor/summary.json`, luego inicia un Gateway de loopback y comprueba intenciones configuradas, preservación de estado, inicio, `/healthz`, `/readyz` y presupuestos de estado RPC. Sobrescribe una línea base con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, pide al programador agregado que expanda líneas base exactas con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` y expande fixtures con forma de incidencia con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` como `reported-issues`; Package Acceptance expone esos valores como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` y `published_upgrade_survivor_scenarios`.
- Prueba de humo del contexto de ejecución de sesión: `pnpm test:docker:session-runtime-context` verifica la persistencia oculta del transcript del contexto de ejecución más la reparación con doctor de ramas duplicadas afectadas de reescritura de prompt.
- Prueba de humo de instalación global con Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empaqueta el árbol actual, lo instala con `bun install -g` en un home aislado y verifica que `openclaw infer image providers --json` devuelva proveedores de imagen integrados en vez de quedarse colgado. Reutiliza un tarball ya creado con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la compilación del host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` o copia `dist/` desde una imagen Docker compilada con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Prueba de humo Docker del instalador: `bash scripts/test-install-sh-docker.sh` comparte una caché de npm entre sus contenedores raíz, de actualización y direct-npm. La prueba de humo de actualización usa npm `latest` de forma predeterminada como línea base estable antes de actualizar al tarball candidato. Sobrescribe con `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localmente o con la entrada `update_baseline_version` del flujo de trabajo Install Smoke en GitHub. Las comprobaciones del instalador sin root mantienen una caché de npm aislada para que las entradas de caché propiedad de root no enmascaren el comportamiento de instalación local del usuario. Define `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar la caché root/update/direct-npm entre nuevas ejecuciones locales.
- Install Smoke CI omite la actualización global direct-npm duplicada con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; ejecuta el script localmente sin esa variable de entorno cuando se necesite cobertura directa de `npm install -g`.
- Prueba de humo de la CLI para eliminación de workspace compartido de agentes: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila de forma predeterminada la imagen del Dockerfile raíz, siembra dos agentes con un workspace en un home de contenedor aislado, ejecuta `agents delete --json` y verifica JSON válido más el comportamiento de workspace retenido. Reutiliza la imagen install-smoke con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Redes de Gateway (dos contenedores, autenticación WS + salud): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Prueba de humo de instantánea CDP del navegador: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila la imagen E2E de código fuente más una capa de Chromium, inicia Chromium con CDP sin procesar, ejecuta `browser doctor --deep` y verifica que las instantáneas de rol CDP cubran URL de enlaces, elementos clicables promovidos por cursor, referencias de iframe y metadatos de frame.
- Regresión de razonamiento mínimo de OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) ejecuta un servidor OpenAI simulado a través de Gateway, verifica que `web_search` eleve `reasoning.effort` de `minimal` a `low`, luego fuerza el rechazo del esquema del proveedor y comprueba que el detalle sin procesar aparezca en los registros de Gateway.
- Puente de canal MCP (Gateway sembrado + puente stdio + prueba de humo de frame de notificación sin procesar de Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Herramientas MCP del paquete Pi (servidor MCP stdio real + prueba de humo de permitir/denegar del perfil Pi integrado): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Limpieza MCP de Cron/subagente (Gateway real + cierre de proceso hijo MCP stdio después de ejecuciones aisladas de cron y subagente de un solo uso): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (prueba de humo de instalación/actualización para ruta local, `file:`, registro npm con dependencias elevadas, refs móviles de git, conjunto completo de ClawHub, actualizaciones de marketplace y activación/inspección del paquete Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Define `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para omitir el bloque de ClawHub, o sobrescribe el par predeterminado de paquete/runtime de conjunto completo con `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` y `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sin `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, la prueba usa un servidor de fixture local hermético de ClawHub.
- Prueba de humo de actualización sin cambios de Plugin: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Prueba de humo de metadatos de recarga de configuración: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` cubre pruebas de humo de instalación/actualización para ruta local, `file:`, registro npm con dependencias elevadas, refs móviles de git, fixtures de ClawHub, actualizaciones de marketplace y activación/inspección del paquete Claude. `pnpm test:docker:plugin-update` cubre el comportamiento de actualización sin cambios para plugins instalados.

Para precompilar y reutilizar manualmente la imagen funcional compartida:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Las sobrescrituras de imagen específicas de la suite, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, siguen teniendo prioridad cuando están definidas. Cuando `OPENCLAW_SKIP_DOCKER_BUILD=1` apunta a una imagen compartida remota, los scripts la descargan si aún no existe localmente. Las pruebas Docker de QR e instalador mantienen sus propios Dockerfiles porque validan el comportamiento de paquete/instalación en vez del runtime de aplicación compilado compartido.

Los ejecutores Docker de modelos en vivo también montan con enlace el checkout actual en modo solo lectura y
lo preparan en un directorio de trabajo temporal dentro del contenedor. Esto mantiene la imagen de runtime
ligera sin dejar de ejecutar Vitest contra tu código fuente/configuración local exactos.
El paso de preparación omite cachés locales grandes y salidas de compilación de apps como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` y directorios de salida `.build` locales de app o
Gradle para que las ejecuciones Docker en vivo no pasen minutos copiando
artefactos específicos de la máquina.
También definen `OPENCLAW_SKIP_CHANNELS=1` para que las pruebas en vivo de Gateway no inicien
workers de canales reales de Telegram/Discord/etc. dentro del contenedor.
`test:docker:live-models` aún ejecuta `pnpm test:live`, así que también pasa
`OPENCLAW_LIVE_GATEWAY_*` cuando necesites acotar o excluir la cobertura en vivo de Gateway
de esa vía Docker.
`test:docker:openwebui` es una prueba de humo de compatibilidad de mayor nivel: inicia un
contenedor de gateway de OpenClaw con los endpoints HTTP compatibles con OpenAI habilitados,
inicia un contenedor fijado de Open WebUI contra ese gateway, inicia sesión a través de
Open WebUI, verifica que `/api/models` exponga `openclaw/default`, luego envía una
solicitud de chat real a través del proxy `/api/chat/completions` de Open WebUI.
La primera ejecución puede ser sensiblemente más lenta porque Docker puede necesitar descargar la
imagen de Open WebUI y Open WebUI puede necesitar terminar su propia configuración de arranque en frío.
Esta vía espera una clave de modelo en vivo utilizable, y `OPENCLAW_PROFILE_FILE`
(`~/.profile` de forma predeterminada) es la forma principal de proporcionarla en ejecuciones Dockerizadas.
Las ejecuciones correctas imprimen una pequeña carga JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` es intencionalmente determinista y no necesita una
cuenta real de Telegram, Discord ni iMessage. Arranca un contenedor Gateway
sembrado, inicia un segundo contenedor que lanza `openclaw mcp serve`, luego
verifica el descubrimiento de conversaciones enrutadas, lecturas de transcript, metadatos de adjuntos,
comportamiento de cola de eventos en vivo, enrutamiento de envío saliente y notificaciones de canal +
permiso al estilo Claude sobre el puente MCP stdio real. La comprobación de notificaciones
inspecciona directamente los frames MCP stdio sin procesar para que la prueba de humo valide lo que el
puente emite realmente, no solo lo que un SDK de cliente específico exponga por casualidad.
`test:docker:pi-bundle-mcp-tools` es determinista y no necesita una clave de modelo en vivo.
Compila la imagen Docker del repositorio, inicia un servidor de prueba MCP stdio real
dentro del contenedor, materializa ese servidor a través del runtime MCP del paquete Pi integrado,
ejecuta la herramienta y luego verifica que `coding` y `messaging` conserven
las herramientas `bundle-mcp`, mientras que `minimal` y `tools.deny: ["bundle-mcp"]` las filtran.
`test:docker:cron-mcp-cleanup` es determinista y no necesita una clave de modelo en vivo.
Inicia un Gateway sembrado con un servidor de prueba MCP stdio real, ejecuta un
turno de cron aislado y un turno hijo de un solo uso de `/subagents spawn`, luego verifica
que el proceso hijo MCP salga después de cada ejecución.

Prueba de humo manual de hilo ACP en lenguaje natural (no CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantén este script para flujos de regresión/depuración. Puede volver a necesitarse para la validación de enrutamiento de hilos ACP, así que no lo elimines.

Variables de entorno útiles:

- `OPENCLAW_CONFIG_DIR=...` (predeterminado: `~/.openclaw`) montado en `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predeterminado: `~/.openclaw/workspace`) montado en `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predeterminado: `~/.profile`) montado en `/home/node/.profile` y cargado antes de ejecutar las pruebas
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar solo las variables de entorno cargadas desde `OPENCLAW_PROFILE_FILE`, usando directorios temporales de configuración/espacio de trabajo y sin montajes externos de autenticación de CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predeterminado: `~/.cache/openclaw/docker-cli-tools`) montado en `/home/node/.npm-global` para instalaciones de CLI en caché dentro de Docker
- Los directorios/archivos de autenticación de CLI externos bajo `$HOME` se montan en modo de solo lectura bajo `/host-auth...` y luego se copian en `/home/node/...` antes de que comiencen las pruebas
  - Directorios predeterminados: `.minimax`
  - Archivos predeterminados: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Las ejecuciones acotadas por proveedor montan solo los directorios/archivos necesarios inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sobrescribe manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o una lista separada por comas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para acotar la ejecución
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar proveedores dentro del contenedor
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar una imagen `openclaw:local-live` existente en repeticiones que no necesitan una reconstrucción
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantizar que las credenciales provengan del almacén de perfiles (no del entorno)
- `OPENCLAW_OPENWEBUI_MODEL=...` para elegir el modelo expuesto por el Gateway para el smoke de Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para sobrescribir el prompt de verificación de nonce usado por el smoke de Open WebUI
- `OPENWEBUI_IMAGE=...` para sobrescribir la etiqueta de imagen fijada de Open WebUI

## Sanidad de la documentación

Ejecuta las comprobaciones de documentación después de editar docs: `pnpm check:docs`.
Ejecuta la validación completa de anchors de Mintlify cuando también necesites comprobaciones de encabezados dentro de la página: `pnpm docs:check-links:anchors`.

## Regresión sin conexión (segura para CI)

Estas son regresiones de “pipeline real” sin proveedores reales:

- Llamadas a herramientas del Gateway (OpenAI simulado, Gateway real + bucle de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Asistente de Gateway (WS `wizard.start`/`wizard.next`, escribe configuración + autenticación aplicada): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evaluaciones de fiabilidad de agentes (Skills)

Ya tenemos algunas pruebas seguras para CI que se comportan como “evaluaciones de fiabilidad de agentes”:

- Llamadas a herramientas simuladas a través del Gateway real + bucle de agente (`src/gateway/gateway.test.ts`).
- Flujos de asistente de extremo a extremo que validan el cableado de sesión y los efectos de configuración (`src/gateway/gateway.test.ts`).

Lo que aún falta para Skills (consulta [Skills](/es/tools/skills)):

- **Toma de decisiones:** cuando Skills figuran en el prompt, ¿el agente elige la Skill correcta (o evita las irrelevantes)?
- **Cumplimiento:** ¿el agente lee `SKILL.md` antes de usarla y sigue los pasos/argumentos requeridos?
- **Contratos de flujo de trabajo:** escenarios de varios turnos que verifican el orden de herramientas, la continuidad del historial de sesión y los límites del sandbox.

Las evaluaciones futuras deben priorizar primero el determinismo:

- Un ejecutor de escenarios que use proveedores simulados para verificar llamadas a herramientas + orden, lecturas de archivos de Skill y cableado de sesión.
- Un pequeño conjunto de escenarios centrados en Skills (usar frente a evitar, compuertas, inyección de prompts).
- Evaluaciones en vivo opcionales (opt-in, controladas por variables de entorno) solo después de que el conjunto seguro para CI esté implementado.

## Pruebas de contrato (forma de Plugin y canal)

Las pruebas de contrato verifican que cada Plugin y canal registrado se ajuste a su contrato de interfaz. Iteran sobre todos los plugins descubiertos y ejecutan un conjunto de aserciones de forma y comportamiento. El carril unitario predeterminado de `pnpm test` omite intencionalmente estos archivos compartidos de smoke y de seam; ejecuta los comandos de contrato explícitamente cuando toques superficies compartidas de canal o proveedor.

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
- **actions** - Controladores de acciones de canal
- **threading** - Manejo de ID de hilo
- **directory** - API de directorio/lista
- **group-policy** - Aplicación de política de grupo

### Contratos de estado de proveedor

Ubicados en `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondas de estado de canal
- **registry** - Forma del registro de plugins

### Contratos de proveedor

Ubicados en `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato de flujo de autenticación
- **auth-choice** - Elección/selección de autenticación
- **catalog** - API de catálogo de modelos
- **discovery** - Descubrimiento de Plugin
- **loader** - Carga de Plugin
- **runtime** - Runtime de proveedor
- **shape** - Forma/interfaz de Plugin
- **wizard** - Asistente de configuración

### Cuándo ejecutarlas

- Después de cambiar exportaciones o subrutas de plugin-sdk
- Después de añadir o modificar un Plugin de canal o proveedor
- Después de refactorizar el registro o descubrimiento de plugins

Las pruebas de contrato se ejecutan en CI y no requieren claves de API reales.

## Añadir regresiones (guía)

Cuando corrijas un problema de proveedor/modelo descubierto en vivo:

- Añade una regresión segura para CI si es posible (proveedor simulado/stub, o captura la transformación exacta de la forma de la solicitud)
- Si es inherentemente solo en vivo (límites de tasa, políticas de autenticación), mantén la prueba en vivo acotada y opt-in mediante variables de entorno
- Prefiere apuntar a la capa más pequeña que detecte el bug:
  - bug de conversión/reproducción de solicitud de proveedor → prueba directa de modelos
  - bug de pipeline de sesión/historial/herramientas del Gateway → smoke en vivo del Gateway o prueba mock del Gateway segura para CI
- Barrera de protección de recorrido de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un objetivo muestreado por cada clase SecretRef a partir de metadatos de registro (`listSecretTargetRegistryEntries()`) y luego verifica que se rechacen los ids de ejecución con segmentos de recorrido.
  - Si añades una nueva familia de objetivos SecretRef con `includeInPlan` en `src/secrets/target-registry-data.ts`, actualiza `classifyTargetClass` en esa prueba. La prueba falla intencionalmente con ids de objetivo sin clasificar para que las clases nuevas no puedan omitirse silenciosamente.

## Relacionado

- [Pruebas en vivo](/es/help/testing-live)
- [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins)
- [CI](/es/ci)
