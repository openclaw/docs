---
read_when:
    - Ejecutar pruebas localmente o en CI
    - Añadir pruebas de regresión para errores de modelo/proveedor
    - Depuración del comportamiento de Gateway y del agente
summary: 'Kit de pruebas: conjuntos de pruebas unitarias/e2e/en vivo, ejecutores Docker y qué cubre cada prueba'
title: Pruebas
x-i18n:
    generated_at: "2026-05-03T21:34:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7fb57bee958c4e6243f02193a657d7b19ca633c7a27f70eac6b590931390671
    source_path: help/testing.md
    workflow: 16
---

OpenClaw tiene tres conjuntos de pruebas Vitest (unitarias/integración, e2e, en vivo) y un pequeño conjunto
de ejecutores de Docker. Este documento es una guía de "cómo probamos":

- Qué cubre cada conjunto (y qué deliberadamente _no_ cubre).
- Qué comandos ejecutar para flujos de trabajo comunes (local, antes de push, depuración).
- Cómo las pruebas en vivo descubren credenciales y seleccionan modelos/proveedores.
- Cómo agregar regresiones para problemas reales de modelos/proveedores.

<Note>
**La pila de QA (qa-lab, qa-channel, carriles de transporte en vivo)** está documentada por separado:

- [Resumen de QA](/es/concepts/qa-e2e-automation) — arquitectura, superficie de comandos, creación de escenarios.
- [QA de matriz](/es/concepts/qa-matrix) — referencia para `pnpm openclaw qa matrix`.
- [Canal de QA](/es/channels/qa-channel) — el Plugin de transporte sintético usado por escenarios respaldados por el repositorio.

Esta página cubre la ejecución de los conjuntos de pruebas regulares y los ejecutores de Docker/Parallels. La sección de ejecutores específicos de QA más abajo ([ejecutores específicos de QA](#qa-specific-runners)) enumera las invocaciones concretas de `qa` y remite a las referencias anteriores.
</Note>

## Inicio rápido

La mayoría de los días:

- Puerta completa (esperada antes de push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Ejecución más rápida del conjunto completo local en una máquina amplia: `pnpm test:max`
- Bucle directo de observación de Vitest: `pnpm test:watch`
- El direccionamiento directo a archivos ahora también enruta rutas de extensiones/canales: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefiere primero ejecuciones dirigidas cuando estés iterando sobre un único fallo.
- Sitio de QA respaldado por Docker: `pnpm qa:lab:up`
- Carril de QA respaldado por VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Cuando toques pruebas o quieras confianza adicional:

- Puerta de cobertura: `pnpm test:coverage`
- Conjunto E2E: `pnpm test:e2e`

Cuando depures proveedores/modelos reales (requiere credenciales reales):

- Conjunto en vivo (modelos + sondeos de herramienta/imagen de Gateway): `pnpm test:live`
- Dirigir a un archivo en vivo en silencio: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Informes de rendimiento en tiempo de ejecución: despacha `OpenClaw Performance` con
  `live_gpt54=true` para un turno de agente real de `openai/gpt-5.4` o
  `deep_profile=true` para artefactos de CPU/heap/trace de Kova. Las ejecuciones programadas diarias
  publican artefactos de carriles de proveedor simulado, perfil profundo y GPT 5.4 en
  `openclaw/clawgrit-reports` cuando `CLAWGRIT_REPORTS_TOKEN` está configurado. El
  informe de proveedor simulado también incluye números a nivel de código fuente para arranque de Gateway, memoria,
  presión de Plugin, bucle hello repetido de modelo falso e inicio de CLI.
- Barrido de modelos en vivo con Docker: `pnpm test:docker:live-models`
  - Cada modelo seleccionado ahora ejecuta un turno de texto más un pequeño sondeo de estilo lectura de archivo.
    Los modelos cuyos metadatos anuncian entrada `image` también ejecutan un turno diminuto de imagen.
    Deshabilita los sondeos extra con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` al aislar fallos de proveedor.
  - Cobertura de CI: tanto `OpenClaw Scheduled Live And E2E Checks` diario como
    `OpenClaw Release Checks` manual llaman al flujo reutilizable en vivo/E2E con
    `include_live_suites: true`, lo que incluye trabajos separados de matriz de modelos en vivo de Docker
    fragmentados por proveedor.
  - Para repeticiones enfocadas de CI, despacha `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` y `live_models_only: true`.
  - Agrega nuevos secretos de proveedor de alta señal a `scripts/ci-hydrate-live-auth.sh`
    más `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` y sus
    llamadores programados/de release.
- Prueba de humo de chat enlazado nativo de Codex: `pnpm test:docker:live-codex-bind`
  - Ejecuta un carril en vivo de Docker contra la ruta del app-server de Codex, enlaza un DM sintético de
    Slack con `/codex bind`, ejercita `/codex fast` y
    `/codex permissions`, y luego verifica que una respuesta plana y un adjunto de imagen
    se enruten a través del enlace nativo del Plugin en lugar de ACP.
- Prueba de humo del arnés del app-server de Codex: `pnpm test:docker:live-codex-harness`
  - Ejecuta turnos de agente de Gateway a través del arnés del app-server de Codex propiedad del Plugin,
    verifica `/codex status` y `/codex models`, y de forma predeterminada ejercita sondeos de imagen,
    MCP de Cron, subagente y Guardian. Deshabilita el sondeo de subagente con
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` al aislar otros fallos del
    app-server de Codex. Para una comprobación enfocada de subagente, deshabilita los otros sondeos:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Esto sale después del sondeo de subagente a menos que
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` esté configurado.
- Prueba de humo del comando de rescate de Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Comprobación opt-in de cinturón y tirantes para la superficie del comando de rescate de canal de mensajes.
    Ejercita `/crestodian status`, encola un cambio persistente de modelo,
    responde `/crestodian yes` y verifica la ruta de escritura de auditoría/configuración.
- Prueba de humo de Docker del planificador de Crestodian: `pnpm test:docker:crestodian-planner`
  - Ejecuta Crestodian en un contenedor sin configuración con una CLI Claude falsa en `PATH`
    y verifica que la alternativa del planificador difuso se traduzca en una escritura auditada de configuración tipada.
- Prueba de humo de Docker de primera ejecución de Crestodian: `pnpm test:docker:crestodian-first-run`
  - Parte de un directorio de estado de OpenClaw vacío, enruta `openclaw` desnudo a
    Crestodian, aplica configuración/modelo/agente/Plugin de Discord + escrituras de SecretRef,
    valida la configuración y verifica entradas de auditoría. La misma ruta de configuración Ring 0
    también está cubierta en QA Lab por
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Prueba de humo de coste de Moonshot/Kimi: con `MOONSHOT_API_KEY` configurada, ejecuta
  `openclaw models list --provider moonshot --json`, luego ejecuta un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  aislado contra `moonshot/kimi-k2.6`. Verifica que el JSON informe Moonshot/K2.6 y que la
  transcripción del asistente almacene `usage.cost` normalizado.

<Tip>
Cuando solo necesites un caso que falla, prefiere acotar las pruebas en vivo mediante las variables de entorno de lista de permitidos descritas abajo.
</Tip>

## Ejecutores específicos de QA

Estos comandos se ubican junto a los conjuntos de pruebas principales cuando necesitas realismo de QA-lab:

CI ejecuta QA Lab en flujos de trabajo dedicados. La paridad agéntica está anidada bajo
`QA-Lab - All Lanes` y la validación de release, no como un flujo de PR independiente.
La validación amplia debe usar `Full Release Validation` con
`rerun_group=qa-parity` o el grupo de QA de comprobaciones de release. `QA-Lab - All Lanes`
se ejecuta cada noche en `main` y desde despacho manual con el carril de paridad simulado, el carril de Matrix en vivo, el carril de Telegram en vivo gestionado por Convex y el carril de Discord en vivo gestionado por Convex como trabajos paralelos. Las comprobaciones programadas de QA y release pasan Matrix
`--profile fast` explícitamente, mientras que la CLI de Matrix y la entrada del flujo manual
mantienen `all` como valor predeterminado; el despacho manual puede fragmentar `all` en trabajos
`transport`,
`media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`. `OpenClaw Release
Checks` ejecuta paridad más los carriles rápidos de Matrix y Telegram antes de la aprobación de release, usando `mock-openai/gpt-5.5` para comprobaciones de transporte de release para que se mantengan
deterministas y eviten el inicio normal del Plugin de proveedor. Estos gateways de transporte en vivo
deshabilitan la búsqueda de memoria; el comportamiento de memoria sigue cubierto por los conjuntos de paridad de QA.

Los fragmentos de medios en vivo de release completo usan
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, que ya tiene
`ffmpeg` y `ffprobe`. Los fragmentos de modelos/backends en vivo de Docker usan la imagen compartida
`ghcr.io/openclaw/openclaw-live-test:<sha>` creada una vez por commit seleccionado,
y luego la extraen con `OPENCLAW_SKIP_DOCKER_BUILD=1` en lugar de reconstruirla
dentro de cada fragmento.

- `pnpm openclaw qa suite`
  - Ejecuta escenarios de QA respaldados por el repositorio directamente en el host.
  - Ejecuta varios escenarios seleccionados en paralelo de forma predeterminada con workers de gateway aislados. `qa-channel` usa de forma predeterminada una concurrencia de 4 (limitada por el recuento de escenarios seleccionados). Usa `--concurrency <count>` para ajustar el recuento de workers, o `--concurrency 1` para el lane serial anterior.
  - Sale con un código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando quieras artefactos sin un código de salida fallido.
  - Admite los modos de proveedor `live-frontier`, `mock-openai` y `aimock`.
    `aimock` inicia un servidor de proveedor local respaldado por AIMock para cobertura experimental de fixtures y mocks de protocolo sin reemplazar el lane `mock-openai` consciente de escenarios.
- `pnpm test:gateway:cpu-scenarios`
  - Ejecuta el banco de arranque del gateway más un pequeño paquete de escenarios simulados de QA Lab (`channel-chat-baseline`, `memory-failure-fallback`, `gateway-restart-inflight-run`) y escribe un resumen combinado de observación de CPU en `.artifacts/gateway-cpu-scenarios/`.
  - Marca de forma predeterminada solo las observaciones sostenidas de CPU caliente (`--cpu-core-warn` más `--hot-wall-warn-ms`), de modo que las ráfagas breves de arranque se registran como métricas sin parecerse a la regresión de Gateway fijado durante minutos.
  - Usa artefactos `dist` compilados; ejecuta primero una compilación cuando el checkout todavía no tenga salida de runtime reciente.
- `pnpm openclaw qa suite --runner multipass`
  - Ejecuta la misma suite de QA dentro de una VM Linux desechable de Multipass.
  - Mantiene el mismo comportamiento de selección de escenarios que `qa suite` en el host.
  - Reutiliza las mismas flags de selección de proveedor/modelo que `qa suite`.
  - Las ejecuciones live reenvían las entradas de autenticación de QA admitidas que son prácticas para el invitado: claves de proveedor basadas en env, la ruta de configuración del proveedor live de QA y `CODEX_HOME` cuando está presente.
  - Los directorios de salida deben permanecer bajo la raíz del repositorio para que el invitado pueda escribir de vuelta mediante el workspace montado.
  - Escribe el informe y resumen normales de QA más los logs de Multipass en `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia el sitio de QA respaldado por Docker para trabajo de QA de estilo operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Construye un tarball npm desde el checkout actual, lo instala globalmente en Docker, ejecuta onboarding no interactivo con clave de API de OpenAI, configura Telegram de forma predeterminada, verifica que el runtime del Plugin empaquetado cargue sin reparación de dependencias al arranque, ejecuta doctor y ejecuta un turno de agente local contra un endpoint simulado de OpenAI.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para ejecutar el mismo lane de instalación empaquetada con Discord.
- `pnpm test:docker:session-runtime-context`
  - Ejecuta un smoke determinista de Docker con app compilada para transcripciones de contexto de runtime embebido. Verifica que el contexto de runtime oculto de OpenClaw se conserve como un mensaje personalizado no visible en lugar de filtrarse en el turno visible del usuario, luego siembra una sesión JSONL rota afectada y verifica que `openclaw doctor --fix` la reescriba a la rama activa con una copia de seguridad.
- `pnpm test:docker:npm-telegram-live`
  - Instala un paquete candidato de OpenClaw en Docker, ejecuta onboarding de paquete instalado, configura Telegram mediante la CLI instalada y luego reutiliza el lane live de QA de Telegram con ese paquete instalado como el Gateway SUT.
  - Usa de forma predeterminada `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; define `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` o `OPENCLAW_CURRENT_PACKAGE_TGZ` para probar un tarball local resuelto en lugar de instalar desde el registro.
  - Usa las mismas credenciales env de Telegram o la misma fuente de credenciales Convex que `pnpm openclaw qa telegram`. Para automatización de CI/release, define `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` más `OPENCLAW_QA_CONVEX_SITE_URL` y el secreto de rol. Si `OPENCLAW_QA_CONVEX_SITE_URL` y un secreto de rol de Convex están presentes en CI, el wrapper de Docker selecciona Convex automáticamente.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` reemplaza el `OPENCLAW_QA_CREDENTIAL_ROLE` compartido solo para este lane.
  - GitHub Actions expone este lane como el workflow manual de mantenedor `NPM Telegram Beta E2E`. No se ejecuta al fusionar. El workflow usa el entorno `qa-live-shared` y leases de credenciales CI de Convex.
- GitHub Actions también expone `Package Acceptance` para pruebas de producto de ejecución lateral contra un paquete candidato. Acepta una ref confiable, una especificación npm publicada, una URL HTTPS de tarball más SHA-256, o un artefacto tarball de otra ejecución, sube el `openclaw-current.tgz` normalizado como `package-under-test`, y luego ejecuta el scheduler existente de Docker E2E con perfiles de lane smoke, package, product, full o personalizados. Define `telegram_mode=mock-openai` o `live-frontier` para ejecutar el workflow de QA de Telegram contra el mismo artefacto `package-under-test`.
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

- La prueba con artefacto descarga un artefacto tarball de otra ejecución de Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Empaqueta e instala la compilación actual de OpenClaw en Docker, inicia el Gateway con OpenAI configurado y luego habilita canales/plugins incluidos mediante ediciones de configuración.
  - Verifica que la detección de configuración deje ausentes los plugins descargables no configurados, que la primera reparación configurada de doctor instale explícitamente cada Plugin descargable faltante y que un segundo reinicio no ejecute reparación oculta de dependencias.
  - También instala una línea base npm anterior conocida, habilita Telegram antes de ejecutar `openclaw update --tag <candidate>` y verifica que el doctor posterior a la actualización del candidato limpie restos de dependencias de plugins heredadas sin una reparación postinstall del lado del harness.
- `pnpm test:parallels:npm-update`
  - Ejecuta el smoke nativo de actualización de instalación empaquetada en invitados de Parallels. Cada plataforma seleccionada primero instala el paquete de línea base solicitado, luego ejecuta el comando instalado `openclaw update` en el mismo invitado y verifica la versión instalada, el estado de actualización, la preparación del gateway y un turno de agente local.
  - Usa `--platform macos`, `--platform windows` o `--platform linux` mientras iteras en un invitado. Usa `--json` para la ruta del artefacto de resumen y el estado por lane.
  - El lane de OpenAI usa `openai/gpt-5.5` de forma predeterminada para la prueba de turno de agente live. Pasa `--model <provider/model>` o define `OPENCLAW_PARALLELS_OPENAI_MODEL` cuando valides deliberadamente otro modelo de OpenAI.
  - Envuelve ejecuciones locales largas en un timeout del host para que los bloqueos de transporte de Parallels no consuman el resto de la ventana de pruebas:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - El script escribe logs de lanes anidados en `/tmp/openclaw-parallels-npm-update.*`.
    Inspecciona `windows-update.log`, `macos-update.log` o `linux-update.log` antes de asumir que el wrapper externo está colgado.
  - La actualización de Windows puede pasar de 10 a 15 minutos en doctor posterior a la actualización y trabajo de actualización de paquetes en un invitado frío; eso sigue siendo saludable cuando el log de depuración npm anidado avanza.
  - No ejecutes este wrapper agregado en paralelo con lanes de smoke individuales de Parallels macOS, Windows o Linux. Comparten estado de VM y pueden colisionar en la restauración de snapshots, el servicio de paquetes o el estado del Gateway del invitado.
  - La prueba posterior a la actualización ejecuta la superficie normal de plugins incluidos porque las fachadas de capacidades como voz, generación de imágenes y comprensión de medios se cargan mediante APIs de runtime incluidas aunque el propio turno de agente solo verifique una respuesta de texto simple.

- `pnpm openclaw qa aimock`
  - Inicia solo el servidor de proveedor local AIMock para pruebas smoke directas de protocolo.
- `pnpm openclaw qa matrix`
  - Ejecuta el lane live de QA de Matrix contra un homeserver Tuwunel desechable respaldado por Docker. Solo checkout de código fuente; las instalaciones empaquetadas no envían `qa-lab`.
  - CLI completa, catálogo de perfiles/escenarios, variables env y diseño de artefactos: [QA de Matrix](/es/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Ejecuta el lane live de QA de Telegram contra un grupo privado real usando los tokens de bot del driver y del SUT desde env.
  - Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. El id del grupo debe ser el id numérico de chat de Telegram.
  - Admite `--credential-source convex` para credenciales compartidas agrupadas. Usa el modo env de forma predeterminada, o define `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases agrupados.
  - Sale con un código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando quieras artefactos sin un código de salida fallido.
  - Requiere dos bots distintos en el mismo grupo privado, con el bot SUT exponiendo un nombre de usuario de Telegram.
  - Para una observación estable de bot a bot, habilita Bot-to-Bot Communication Mode en `@BotFather` para ambos bots y asegúrate de que el bot driver pueda observar el tráfico de bots del grupo.
  - Escribe un informe de QA de Telegram, un resumen y un artefacto de mensajes observados en `.artifacts/qa-e2e/...`. Los escenarios de respuesta incluyen RTT desde la solicitud de envío del driver hasta la respuesta observada del SUT.

Los lanes de transporte live comparten un contrato estándar para que los transportes nuevos no diverjan; la matriz de cobertura por lane vive en [Resumen de QA → Cobertura de transporte live](/es/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` es la suite sintética amplia y no forma parte de esa matriz.

### Credenciales compartidas de Telegram mediante Convex (v1)

Cuando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para `openclaw qa telegram`, el laboratorio de QA adquiere un lease exclusivo de un pool respaldado por Convex, envía heartbeats para ese lease mientras el lane se ejecuta y libera el lease al apagarse.

Scaffold de proyecto Convex de referencia:

- `qa/convex-credential-broker/`

Variables env requeridas:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por ejemplo `https://your-deployment.convex.site`)
- Un secreto para el rol seleccionado:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Selección de rol de credenciales:
  - CLI: `--credential-role maintainer|ci`
  - Valor predeterminado de env: `OPENCLAW_QA_CREDENTIAL_ROLE` (usa `ci` de forma predeterminada en CI, `maintainer` en caso contrario)

Variables env opcionales:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predeterminado `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predeterminado `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predeterminado `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predeterminado `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predeterminado `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de traza opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs Convex `http://` de loopback para desarrollo solo local.

`OPENCLAW_QA_CONVEX_SITE_URL` debe usar `https://` en operación normal.

Los comandos de administrador de mantenedor (agregar/eliminar/listar en el pool) requieren específicamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helpers de CLI para mantenedores:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `doctor` antes de las ejecuciones live para comprobar la URL del sitio Convex, los secretos del broker, el prefijo del endpoint, el timeout HTTP y la accesibilidad de admin/list sin imprimir valores secretos. Usa `--json` para salida legible por máquina en scripts y utilidades de CI.

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

Forma de payload para el tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` debe ser una cadena numérica de id de chat de Telegram.
- `admin/add` valida esta forma para `kind: "telegram"` y rechaza payloads malformados.

### Añadir un canal a QA

La arquitectura y los nombres de ayudantes de escenarios para nuevos adaptadores de canal viven en [descripción general de QA → Añadir un canal](/es/concepts/qa-e2e-automation#adding-a-channel). El mínimo requerido: implementar el runner de transporte en el seam compartido de host `qa-lab`, declarar `qaRunners` en el manifiesto del Plugin, montar como `openclaw qa <runner>` y crear escenarios en `qa/scenarios/`.

## Suites de pruebas (qué se ejecuta dónde)

Piensa en las suites como “realismo creciente” (y también fragilidad/costo crecientes):

### Unidad / integración (predeterminado)

- Comando: `pnpm test`
- Configuración: las ejecuciones sin objetivo usan el conjunto de shards `vitest.full-*.config.ts` y pueden expandir shards multiproyecto en configuraciones por proyecto para la planificación en paralelo
- Archivos: inventarios core/unit en `src/**/*.test.ts`, `packages/**/*.test.ts` y `test/**/*.test.ts`; las pruebas unitarias de UI se ejecutan en el shard dedicado `unit-ui`
- Alcance:
  - Pruebas unitarias puras
  - Pruebas de integración en proceso (autenticación de Gateway, enrutamiento, herramientas, análisis, configuración)
  - Regresiones deterministas para errores conocidos
- Expectativas:
  - Se ejecuta en CI
  - No requiere claves reales
  - Debe ser rápido y estable
  - Las pruebas del resolver y del cargador de superficie pública deben demostrar el comportamiento de fallback amplio de `api.js` y
    `runtime-api.js` con fixtures diminutos generados de Plugin, no con
    APIs reales de código fuente de Plugins incluidos. Las cargas de API reales de Plugins pertenecen a
    suites de contrato/integración propiedad del Plugin.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - `pnpm test` sin objetivo ejecuta doce configuraciones de shard más pequeñas (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) en lugar de un único proceso nativo gigante de proyecto raíz. Esto reduce el RSS máximo en máquinas cargadas y evita que el trabajo de auto-reply/extensión prive de recursos a suites no relacionadas.
    - `pnpm test --watch` sigue usando el grafo de proyecto raíz nativo `vitest.config.ts`, porque un bucle de observación multi-shard no es práctico.
    - `pnpm test`, `pnpm test:watch` y `pnpm test:perf:imports` enrutan primero los objetivos explícitos de archivo/directorio a través de lanes con alcance, de modo que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar el costo completo de arranque del proyecto raíz.
    - `pnpm test:changed` expande rutas git modificadas en lanes con alcance baratos de forma predeterminada: ediciones directas de pruebas, archivos hermanos `*.test.ts`, mapeos explícitos de fuente y dependientes locales del grafo de importación. Las ediciones de configuración/setup/paquete no ejecutan pruebas de forma amplia salvo que uses explícitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` es la puerta normal de comprobación local inteligente para trabajo estrecho. Clasifica el diff en core, pruebas de core, extensiones, pruebas de extensión, apps, docs, metadatos de release, tooling de Docker en vivo y tooling, y luego ejecuta los comandos correspondientes de comprobación de tipos, lint y guardas. No ejecuta pruebas de Vitest; llama a `pnpm test:changed` o a `pnpm test <target>` explícito para prueba de tests. Los bump de versión que solo afectan metadatos de release ejecutan comprobaciones dirigidas de versión/configuración/dependencias raíz, con una guarda que rechaza cambios de paquete fuera del campo de versión de nivel superior.
    - Las ediciones del harness de ACP de Docker en vivo ejecutan comprobaciones enfocadas: sintaxis de shell para los scripts de autenticación de Docker en vivo y un ensayo sin efectos del planificador de Docker en vivo. Los cambios de `package.json` se incluyen solo cuando el diff se limita a `scripts["test:docker:live-*"]`; las ediciones de dependencias, exports, versión y otras superficies de paquete siguen usando las guardas más amplias.
    - Las pruebas unitarias ligeras en importaciones de agentes, comandos, Plugins, ayudantes de auto-reply, `plugin-sdk` y áreas similares de utilidades puras se enrutan a través de la lane `unit-fast`, que omite `test/setup-openclaw-runtime.ts`; los archivos con estado o pesados de runtime permanecen en las lanes existentes.
    - Algunos archivos fuente auxiliares de `plugin-sdk` y `commands` también mapean ejecuciones en modo changed a pruebas hermanas explícitas en esas lanes ligeras, de modo que las ediciones de ayudantes evitan volver a ejecutar toda la suite pesada de ese directorio.
    - `auto-reply` tiene buckets dedicados para ayudantes core de nivel superior, pruebas de integración `reply.*` de nivel superior y el subárbol `src/auto-reply/reply/**`. CI divide además el subárbol reply en shards de agent-runner, dispatch y commands/state-routing para que un bucket pesado en importaciones no posea toda la cola de Node.
    - CI normal de PR/main omite intencionadamente el barrido por lotes de extensiones y el shard solo de release `agentic-plugins`. Full Release Validation despacha el workflow hijo separado `Plugin Prerelease` para esas suites pesadas en Plugins/extensiones sobre candidatos de release.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Cuando cambies entradas de descubrimiento de herramientas de mensaje o contexto de runtime de Compaction,
      conserva ambos niveles de cobertura.
    - Añade regresiones enfocadas de ayudantes para límites puros de enrutamiento y normalización.
    - Mantén sanas las suites de integración del runner embebido:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` y
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Esas suites verifican que los ids con alcance y el comportamiento de Compaction sigan fluyendo
      por las rutas reales `run.ts` / `compact.ts`; las pruebas solo de ayudantes
      no son un sustituto suficiente de esas rutas de integración.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - La configuración base de Vitest usa `threads` de forma predeterminada.
    - La configuración compartida de Vitest fija `isolate: false` y usa el
      runner no aislado en los proyectos raíz, e2e y configuraciones en vivo.
    - La lane de UI raíz mantiene su setup y optimizador `jsdom`, pero también se ejecuta en el
      runner compartido no aislado.
    - Cada shard de `pnpm test` hereda los mismos valores predeterminados `threads` + `isolate: false`
      de la configuración compartida de Vitest.
    - `scripts/run-vitest.mjs` añade `--no-maglev` para procesos Node hijos de Vitest
      de forma predeterminada para reducir el churn de compilación de V8 durante grandes ejecuciones locales.
      Define `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar con el comportamiento estándar de V8.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` muestra qué lanes arquitectónicas activa un diff.
    - El hook pre-commit solo formatea. Vuelve a preparar los archivos formateados y
      no ejecuta lint, comprobación de tipos ni pruebas.
    - Ejecuta `pnpm check:changed` explícitamente antes de la entrega o el push cuando
      necesites la puerta inteligente de comprobación local.
    - `pnpm test:changed` enruta por lanes con alcance baratas de forma predeterminada. Usa
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el agente
      decida que una edición de harness, configuración, paquete o contrato realmente necesita
      cobertura de Vitest más amplia.
    - `pnpm test:max` y `pnpm test:changed:max` conservan el mismo comportamiento de enrutamiento,
      solo con un límite de workers más alto.
    - El autoescalado local de workers es intencionadamente conservador y retrocede
      cuando el promedio de carga del host ya es alto, así que varias ejecuciones concurrentes
      de Vitest hacen menos daño de forma predeterminada.
    - La configuración base de Vitest marca los proyectos/archivos de configuración como
      `forceRerunTriggers` para que las reejecuciones en modo changed sigan siendo correctas cuando cambie el cableado de pruebas.
    - La configuración mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado en hosts compatibles;
      define `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si quieres
      una ubicación de caché explícita para perfilado directo.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` habilita el reporte de duración de importaciones de Vitest más
      salida de desglose de importaciones.
    - `pnpm test:perf:imports:changed` limita la misma vista de perfilado a
      archivos cambiados desde `origin/main`.
    - Los datos de tiempos de shards se escriben en `.artifacts/vitest-shard-timings.json`.
      Las ejecuciones de configuración completa usan la ruta de configuración como clave; los shards de CI
      con patrón de inclusión añaden el nombre del shard para que los shards filtrados puedan rastrearse
      por separado.
    - Cuando una prueba caliente todavía pasa la mayor parte del tiempo en importaciones de arranque,
      mantén las dependencias pesadas detrás de un seam local estrecho `*.runtime.ts` y
      simula ese seam directamente en lugar de importar en profundidad ayudantes de runtime solo
      para pasarlos por `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara el
      `test:changed` enrutado contra la ruta nativa de proyecto raíz para ese diff confirmado
      e imprime tiempo de reloj más RSS máximo en macOS.
    - `pnpm test:perf:changed:bench -- --worktree` mide el árbol sucio actual
      enrutando la lista de archivos modificados a través de
      `scripts/test-projects.mjs` y la configuración raíz de Vitest.
    - `pnpm test:perf:profile:main` escribe un perfil de CPU del hilo principal para
      el arranque de Vitest/Vite y la sobrecarga de transformación.
    - `pnpm test:perf:profile:runner` escribe perfiles de CPU+heap del runner para la
      suite unitaria con el paralelismo de archivos deshabilitado.

  </Accordion>
</AccordionGroup>

### Estabilidad (Gateway)

- Comando: `pnpm test:stability:gateway`
- Configuración: `vitest.gateway.config.ts`, forzado a un worker
- Alcance:
  - Inicia un Gateway real de loopback con diagnósticos habilitados de forma predeterminada
  - Impulsa churn sintético de mensajes de Gateway, memoria y payloads grandes a través de la ruta de eventos de diagnóstico
  - Consulta `diagnostics.stability` sobre el RPC WS del Gateway
  - Cubre ayudantes de persistencia del paquete de estabilidad de diagnóstico
  - Afirma que el grabador permanece acotado, las muestras RSS sintéticas se mantienen por debajo del presupuesto de presión y las profundidades de cola por sesión vuelven a cero
- Expectativas:
  - Seguro para CI y sin claves
  - Lane estrecha para seguimiento de regresiones de estabilidad, no sustituto de la suite completa de Gateway

### E2E (smoke de Gateway)

- Comando: `pnpm test:e2e`
- Configuración: `vitest.e2e.config.ts`
- Archivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` y pruebas E2E de Plugins incluidos en `extensions/`
- Valores predeterminados de runtime:
  - Usa `threads` de Vitest con `isolate: false`, igual que el resto del repo.
  - Usa workers adaptativos (CI: hasta 2, local: 1 de forma predeterminada).
  - Se ejecuta en modo silencioso de forma predeterminada para reducir la sobrecarga de E/S de consola.
- Overrides útiles:
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
  - Inicia un Gateway de OpenShell aislado en el host mediante Docker
  - Crea un sandbox desde un Dockerfile local temporal
  - Ejercita el backend OpenShell de OpenClaw mediante `sandbox ssh-config` real + ejecución SSH
  - Verifica el comportamiento del sistema de archivos canónico remoto a través del puente fs del sandbox
- Expectativas:
  - Solo por activación explícita; no forma parte de la ejecución predeterminada de `pnpm test:e2e`
  - Requiere una CLI local de `openshell` y un daemon de Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` aislados y luego destruye el Gateway y el sandbox de prueba
- Sobrescrituras útiles:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar la prueba al ejecutar manualmente el conjunto e2e más amplio
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apuntar a un binario de CLI no predeterminado o a un script envoltorio

### En vivo (proveedores reales + modelos reales)

- Comando: `pnpm test:live`
- Configuración: `vitest.live.config.ts`
- Archivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` y pruebas en vivo de plugins incluidos en `extensions/`
- Valor predeterminado: **habilitado** por `pnpm test:live` (establece `OPENCLAW_LIVE_TEST=1`)
- Alcance:
  - “¿Este proveedor/modelo realmente funciona _hoy_ con credenciales reales?”
  - Detectar cambios de formato de proveedores, particularidades de llamadas a herramientas, problemas de autenticación y comportamiento de límites de tasa
- Expectativas:
  - No es estable para CI por diseño (redes reales, políticas reales de proveedores, cuotas, interrupciones)
  - Cuesta dinero / usa límites de tasa
  - Prefiere ejecutar subconjuntos acotados en lugar de “todo”
- Las ejecuciones en vivo cargan `~/.profile` para recoger claves de API faltantes.
- De forma predeterminada, las ejecuciones en vivo siguen aislando `HOME` y copiando material de configuración/autenticación a un home temporal de prueba para que los fixtures unitarios no puedan mutar tu `~/.openclaw` real.
- Establece `OPENCLAW_LIVE_USE_REAL_HOME=1` solo cuando intencionalmente necesites que las pruebas en vivo usen tu directorio home real.
- `pnpm test:live` ahora usa de forma predeterminada un modo más silencioso: mantiene la salida de progreso `[live] ...`, pero suprime el aviso adicional de `~/.profile` y silencia los logs de arranque del Gateway y el ruido de Bonjour. Establece `OPENCLAW_LIVE_TEST_QUIET=0` si quieres recuperar todos los logs de inicio.
- Rotación de claves de API (específica por proveedor): establece `*_API_KEYS` con formato de coma/punto y coma o `*_API_KEY_1`, `*_API_KEY_2` (por ejemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) o una sobrescritura por ejecución en vivo mediante `OPENCLAW_LIVE_*_KEY`; las pruebas reintentan ante respuestas de límite de tasa.
- Salida de progreso/Heartbeat:
  - Los conjuntos en vivo ahora emiten líneas de progreso a stderr para que las llamadas largas a proveedores se vean activas incluso cuando la captura de consola de Vitest esté silenciosa.
  - `vitest.live.config.ts` deshabilita la interceptación de consola de Vitest para que las líneas de progreso de proveedores/Gateway se transmitan de inmediato durante las ejecuciones en vivo.
  - Ajusta los Heartbeats de modelo directo con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajusta los Heartbeats de Gateway/sonda con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## ¿Qué conjunto debo ejecutar?

Usa esta tabla de decisión:

- Al editar lógica/pruebas: ejecuta `pnpm test` (y `pnpm test:coverage` si cambiaste mucho)
- Al tocar redes del Gateway / protocolo WS / emparejamiento: agrega `pnpm test:e2e`
- Al depurar “mi bot está caído” / fallos específicos de proveedor / llamadas a herramientas: ejecuta un `pnpm test:live` acotado

## Pruebas en vivo (que tocan la red)

Para la matriz de modelos en vivo, smokes del backend de CLI, smokes de ACP, arnés del servidor de aplicaciones Codex y todas las pruebas en vivo de proveedores multimedia (Deepgram, BytePlus, ComfyUI, imagen, música, video, arnés multimedia), además del manejo de credenciales para ejecuciones en vivo, consulta [Pruebas de conjuntos en vivo](/es/help/testing-live). Para la lista de verificación dedicada de actualizaciones y validación de plugins, consulta [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins).

## Ejecutores Docker (comprobaciones opcionales de "funciona en Linux")

Estos ejecutores Docker se dividen en dos grupos:

- Ejecutores de modelos en vivo: `test:docker:live-models` y `test:docker:live-gateway` ejecutan solo su archivo en vivo de clave de perfil correspondiente dentro de la imagen Docker del repositorio (`src/agents/models.profiles.live.test.ts` y `src/gateway/gateway-models.profiles.live.test.ts`), montando tu directorio de configuración local y workspace (y cargando `~/.profile` si está montado). Los puntos de entrada locales correspondientes son `test:live:models-profiles` y `test:live:gateway-profiles`.
- Los ejecutores Docker en vivo usan de forma predeterminada un límite de smoke más pequeño para que un barrido completo en Docker siga siendo práctico:
  `test:docker:live-models` usa de forma predeterminada `OPENCLAW_LIVE_MAX_MODELS=12`, y
  `test:docker:live-gateway` usa de forma predeterminada `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` y
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sobrescribe esas variables de entorno cuando
  explícitamente quieras el escaneo exhaustivo más grande.
- `test:docker:all` construye la imagen Docker en vivo una vez mediante `test:docker:live-build`, empaqueta OpenClaw una vez como tarball de npm mediante `scripts/package-openclaw-for-docker.mjs`, y luego construye/reutiliza dos imágenes `scripts/e2e/Dockerfile`. La imagen básica es solo el ejecutor Node/Git para rutas de instalación/actualización/dependencias de plugins; esas rutas montan el tarball preconstruido. La imagen funcional instala el mismo tarball en `/app` para rutas de funcionalidad de la app construida. Las definiciones de rutas Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`; la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ejecuta el plan seleccionado. El agregado usa un planificador local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla los slots de proceso, mientras que los límites de recursos evitan que rutas pesadas en vivo, de instalación npm y multiservicio arranquen todas a la vez. Si una sola ruta es más pesada que los límites activos, el planificador aún puede iniciarla cuando el pool está vacío y luego mantenerla ejecutándose sola hasta que vuelva a haber capacidad disponible. Los valores predeterminados son 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` y `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajusta `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` u `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` solo cuando el host Docker tenga más margen. El ejecutor realiza una precomprobación de Docker de forma predeterminada, elimina contenedores OpenClaw E2E obsoletos, imprime estado cada 30 segundos, almacena los tiempos de rutas exitosas en `.artifacts/docker-tests/lane-timings.json` y usa esos tiempos para iniciar primero las rutas más largas en ejecuciones posteriores. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir el manifiesto de rutas ponderado sin construir ni ejecutar Docker, o `node scripts/test-docker-all.mjs --plan-json` para imprimir el plan de CI de las rutas seleccionadas, necesidades de paquete/imagen y credenciales.
- `Package Acceptance` es la puerta de paquete nativa de GitHub para "¿este tarball instalable funciona como producto?" Resuelve un paquete candidato desde `source=npm`, `source=ref`, `source=url` o `source=artifact`, lo sube como `package-under-test` y luego ejecuta las rutas Docker E2E reutilizables contra ese tarball exacto en lugar de volver a empaquetar la ref seleccionada. Los perfiles se ordenan por amplitud: `smoke`, `package`, `product` y `full`. Consulta [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins) para el contrato de paquete/actualización/plugin, la matriz de supervivencia de actualizaciones publicadas, los valores predeterminados de release y el triaje de fallos.
- Las comprobaciones de compilación y release ejecutan `scripts/check-cli-bootstrap-imports.mjs` después de tsdown. La guarda recorre el grafo construido estático desde `dist/entry.js` y `dist/cli/run-main.js` y falla si el inicio previo al despacho importa dependencias de paquete como Commander, prompt UI, undici o logging antes del despacho del comando; también mantiene el chunk de ejecución del Gateway incluido dentro del presupuesto y rechaza importaciones estáticas de rutas Gateway frías conocidas. El smoke de CLI empaquetada también cubre ayuda raíz, ayuda de onboarding, ayuda de doctor, estado, esquema de configuración y un comando de lista de modelos.
- La compatibilidad heredada de Package Acceptance está limitada a `2026.4.25` (`2026.4.25-beta.*` incluido). Hasta ese corte, el arnés tolera solo brechas de metadatos de paquetes enviados: entradas omitidas de inventario privado de QA, falta de `gateway install --wrapper`, falta de archivos de parche en el fixture git derivado del tarball, falta de `update.channel` persistido, ubicaciones heredadas de registros de instalación de plugins, falta de persistencia del registro de instalación de marketplace y migración de metadatos de configuración durante `plugins update`. Para paquetes posteriores a `2026.4.25`, esas rutas son fallos estrictos.
- Ejecutores de smoke de contenedor: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` y `test:docker:config-reload` arrancan uno o más contenedores reales y verifican rutas de integración de mayor nivel.

Los ejecutores Docker de modelos en vivo también montan con bind solo los homes de autenticación de CLI necesarios (o todos los admitidos cuando la ejecución no está acotada), luego los copian al home del contenedor antes de la ejecución para que el OAuth de CLI externa pueda actualizar tokens sin mutar el almacén de autenticación del host:

- Modelos directos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de enlace ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; cubre Claude, Codex y Gemini de forma predeterminada, con cobertura estricta de Droid/OpenCode mediante `pnpm test:docker:live-acp-bind:droid` y `pnpm test:docker:live-acp-bind:opencode`)
- Smoke del backend de CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke del arnés de app-server de Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desarrollo: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke de observabilidad: `pnpm qa:otel:smoke` es una lane privada de verificación de checkout de fuentes de QA. Intencionalmente no forma parte de las lanes de publicación Docker de paquetes porque el tarball de npm omite QA Lab.
- Smoke en vivo de Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Asistente de incorporación (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke de incorporación/canal/agente con tarball de npm: `pnpm test:docker:npm-onboard-channel-agent` instala globalmente en Docker el tarball empaquetado de OpenClaw, configura OpenAI mediante incorporación con referencia de entorno más Telegram de forma predeterminada, ejecuta doctor y ejecuta un turno de agente OpenAI simulado. Reutiliza un tarball precompilado con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la recompilación del host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, o cambia de canal con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke de cambio de canal de actualización: `pnpm test:docker:update-channel-switch` instala globalmente en Docker el tarball empaquetado de OpenClaw, cambia de paquete `stable` a git `dev`, verifica que el canal persistido y el Plugin posterior a la actualización funcionen, luego vuelve al paquete `stable` y comprueba el estado de actualización.
- Smoke de supervivencia de actualización: `pnpm test:docker:upgrade-survivor` instala el tarball empaquetado de OpenClaw sobre un fixture sucio de usuario antiguo con agentes, configuración de canal, listas de permitidos de Plugin, estado obsoleto de dependencias de Plugin y archivos existentes de workspace/sesión. Ejecuta una actualización de paquete más doctor no interactivo sin proveedor en vivo ni claves de canal, luego inicia un Gateway de loopback y comprueba la preservación de configuración/estado junto con presupuestos de arranque/estado.
- Smoke de supervivencia de actualización publicada: `pnpm test:docker:published-upgrade-survivor` instala `openclaw@latest` de forma predeterminada, siembra archivos realistas de usuario existente, configura esa línea base con una receta de comandos integrada, valida la configuración resultante, actualiza esa instalación publicada al tarball candidato, ejecuta doctor no interactivo, escribe `.artifacts/upgrade-survivor/summary.json`, luego inicia un Gateway de loopback y comprueba intents configurados, preservación de estado, arranque, `/healthz`, `/readyz` y presupuestos de estado RPC. Sobrescribe una línea base con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, pide al planificador agregado que expanda líneas base exactas con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` como `all-since-2026.4.23`, y expande fixtures con forma de issue con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` como `reported-issues`; el conjunto `reported-issues` incluye `configured-plugin-installs` para reparación automática de instalación de Plugin externo de OpenClaw. Package Acceptance expone estos como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` y `published_upgrade_survivor_scenarios`.
- Smoke de contexto de runtime de sesión: `pnpm test:docker:session-runtime-context` verifica la persistencia de transcripción del contexto de runtime oculto más la reparación de doctor de ramas duplicadas afectadas de reescritura de prompt.
- Smoke de instalación global con Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empaqueta el árbol actual, lo instala con `bun install -g` en un home aislado y verifica que `openclaw infer image providers --json` devuelva proveedores de imágenes incluidos en lugar de quedarse bloqueado. Reutiliza un tarball precompilado con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la compilación del host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, o copia `dist/` desde una imagen Docker compilada con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker del instalador: `bash scripts/test-install-sh-docker.sh` comparte una caché de npm entre sus contenedores root, update y direct-npm. El smoke de actualización usa de forma predeterminada npm `latest` como línea base estable antes de actualizar al tarball candidato. Sobrescribe con `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localmente, o con la entrada `update_baseline_version` del workflow Install Smoke en GitHub. Las comprobaciones del instalador sin root mantienen una caché de npm aislada para que las entradas de caché propiedad de root no oculten el comportamiento de instalación local del usuario. Define `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar la caché root/update/direct-npm en nuevas ejecuciones locales.
- Install Smoke CI omite la actualización global duplicada de direct-npm con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; ejecuta el script localmente sin esa env cuando se necesite cobertura directa de `npm install -g`.
- Smoke de CLI de eliminación de agentes en workspace compartido: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila de forma predeterminada la imagen del Dockerfile raíz, siembra dos agentes con un workspace en un home de contenedor aislado, ejecuta `agents delete --json` y verifica JSON válido más el comportamiento de workspace retenido. Reutiliza la imagen install-smoke con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Redes de Gateway (dos contenedores, autenticación WS + salud): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoke de snapshot CDP del navegador: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila la imagen E2E de fuentes más una capa Chromium, inicia Chromium con CDP sin procesar, ejecuta `browser doctor --deep` y verifica que los snapshots de rol CDP cubran URL de enlaces, clicables promovidos por cursor, referencias de iframe y metadatos de frame.
- Regresión de razonamiento mínimo de OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) ejecuta un servidor OpenAI simulado a través de Gateway, verifica que `web_search` eleve `reasoning.effort` de `minimal` a `low`, luego fuerza el rechazo del esquema del proveedor y comprueba que el detalle sin procesar aparezca en los logs de Gateway.
- Puente de canal MCP (Gateway sembrado + puente stdio + smoke de frame de notificación Claude sin procesar): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Herramientas MCP del paquete Pi (servidor MCP stdio real + smoke de permitir/denegar del perfil Pi embebido): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Limpieza de MCP de Cron/subagente (Gateway real + desmontaje de hijo MCP stdio tras ejecuciones aisladas de cron y subagente de una sola vez): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke de instalación/actualización para ruta local, `file:`, registro npm con dependencias elevadas, refs móviles de git, ClawHub kitchen-sink, actualizaciones de marketplace y activación/inspección de paquete Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Define `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para omitir el bloque de ClawHub, o sobrescribe el par predeterminado de paquete/runtime kitchen-sink con `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` y `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sin `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, la prueba usa un servidor hermético local de fixture ClawHub.
- Smoke de actualización sin cambios de Plugin: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke de matriz de ciclo de vida de Plugin: `pnpm test:docker:plugin-lifecycle-matrix` instala el tarball empaquetado de OpenClaw en un contenedor mínimo, instala un Plugin de npm, alterna activar/desactivar, lo actualiza y lo degrada mediante un registro npm local, elimina el código instalado y luego verifica que la desinstalación aún elimine estado obsoleto mientras registra métricas de RSS/CPU para cada fase del ciclo de vida.
- Smoke de metadatos de recarga de configuración: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` cubre smoke de instalación/actualización para ruta local, `file:`, registro npm con dependencias elevadas, refs móviles de git, fixtures de ClawHub, actualizaciones de marketplace y activación/inspección de paquete Claude. `pnpm test:docker:plugin-update` cubre el comportamiento de actualización sin cambios para Plugins instalados. `pnpm test:docker:plugin-lifecycle-matrix` cubre instalación, activación, desactivación, actualización, degradación y desinstalación con código faltante de Plugin de npm con seguimiento de recursos.

Para precompilar y reutilizar manualmente la imagen funcional compartida:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Las sobrescrituras de imagen específicas de suite, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, siguen teniendo prioridad cuando están definidas. Cuando `OPENCLAW_SKIP_DOCKER_BUILD=1` apunta a una imagen compartida remota, los scripts la descargan si aún no está local. Las pruebas Docker de QR e instalador conservan sus propios Dockerfiles porque validan el comportamiento de paquete/instalación en lugar del runtime de app compilada compartida.

Los ejecutores Docker de modelo en vivo también montan el checkout actual en modo de solo lectura y
lo preparan en un directorio de trabajo temporal dentro del contenedor. Esto mantiene ligera la imagen
de runtime y, aun así, ejecuta Vitest contra tu fuente/configuración local exacta.
El paso de preparación omite cachés grandes solo locales y salidas de compilación de apps, como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` y directorios de salida `.build` locales de la app o
de Gradle, para que las ejecuciones live de Docker no pasen minutos copiando artefactos
específicos de la máquina.
También establecen `OPENCLAW_SKIP_CHANNELS=1` para que las sondas live del Gateway no inicien
workers reales de canales Telegram/Discord/etc. dentro del contenedor.
`test:docker:live-models` sigue ejecutando `pnpm test:live`, así que pasa también
`OPENCLAW_LIVE_GATEWAY_*` cuando necesites acotar o excluir cobertura live del Gateway
de ese carril Docker.
`test:docker:openwebui` es un smoke de compatibilidad de nivel superior: inicia un
contenedor de Gateway de OpenClaw con los endpoints HTTP compatibles con OpenAI habilitados,
inicia un contenedor anclado de Open WebUI contra ese Gateway, inicia sesión mediante
Open WebUI, verifica que `/api/models` expone `openclaw/default` y luego envía una
solicitud de chat real a través del proxy `/api/chat/completions` de Open WebUI.
La primera ejecución puede ser perceptiblemente más lenta porque Docker quizá tenga que descargar la
imagen de Open WebUI y Open WebUI quizá tenga que terminar su propia configuración de arranque en frío.
Este carril espera una clave de modelo en vivo usable, y `OPENCLAW_PROFILE_FILE`
(`~/.profile` por defecto) es la forma principal de proporcionarla en ejecuciones Dockerizadas.
Las ejecuciones correctas imprimen una pequeña carga JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` es intencionalmente determinista y no necesita una
cuenta real de Telegram, Discord ni iMessage. Arranca un contenedor de Gateway
sembrado, inicia un segundo contenedor que genera `openclaw mcp serve` y luego
verifica el descubrimiento de conversaciones enrutadas, lecturas de transcripciones, metadatos de adjuntos,
comportamiento de la cola de eventos live, enrutamiento de envíos salientes y notificaciones de canal +
permisos al estilo Claude sobre el puente MCP stdio real. La comprobación de notificaciones
inspecciona directamente los frames MCP stdio sin procesar, de modo que el smoke valida lo que
el puente emite realmente, no solo lo que una SDK de cliente específica llegue a exponer.
`test:docker:pi-bundle-mcp-tools` es determinista y no necesita una clave de
modelo live. Compila la imagen Docker del repo, inicia un servidor de sonda MCP stdio real
dentro del contenedor, materializa ese servidor mediante el runtime MCP del bundle Pi
integrado, ejecuta la herramienta y luego verifica que `coding` y `messaging` conservan las
herramientas `bundle-mcp`, mientras que `minimal` y `tools.deny: ["bundle-mcp"]` las filtran.
`test:docker:cron-mcp-cleanup` es determinista y no necesita una clave de modelo
live. Inicia un Gateway sembrado con un servidor de sonda MCP stdio real, ejecuta un
turno de cron aislado y un turno hijo único de `/subagents spawn`, y luego verifica
que el proceso hijo MCP sale después de cada ejecución.

Smoke manual de hilo ACP en lenguaje natural (no CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conserva este script para flujos de regresión/depuración. Puede volver a ser necesario para la validación de enrutamiento de hilos ACP, así que no lo elimines.

Variables de entorno útiles:

- `OPENCLAW_CONFIG_DIR=...` (predeterminado: `~/.openclaw`) montado en `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predeterminado: `~/.openclaw/workspace`) montado en `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predeterminado: `~/.profile`) montado en `/home/node/.profile` y cargado antes de ejecutar las pruebas
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar solo variables de entorno cargadas desde `OPENCLAW_PROFILE_FILE`, usando directorios temporales de configuración/espacio de trabajo y sin montajes externos de autenticación de CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predeterminado: `~/.cache/openclaw/docker-cli-tools`) montado en `/home/node/.npm-global` para instalaciones de CLI en caché dentro de Docker
- Los directorios/archivos externos de autenticación de CLI bajo `$HOME` se montan en modo de solo lectura bajo `/host-auth...` y luego se copian en `/home/node/...` antes de iniciar las pruebas
  - Directorios predeterminados: `.minimax`
  - Archivos predeterminados: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Las ejecuciones acotadas por proveedor montan solo los directorios/archivos necesarios inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sobrescribe manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o una lista separada por comas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para acotar la ejecución
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar proveedores dentro del contenedor
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar una imagen `openclaw:local-live` existente en repeticiones que no necesitan recompilación
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantizar que las credenciales provengan del almacén de perfiles (no del entorno)
- `OPENCLAW_OPENWEBUI_MODEL=...` para elegir el modelo expuesto por el Gateway para el smoke de Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para sobrescribir el prompt de comprobación de nonce usado por el smoke de Open WebUI
- `OPENWEBUI_IMAGE=...` para sobrescribir la etiqueta de imagen anclada de Open WebUI

## Sanidad de la documentación

Ejecuta las comprobaciones de documentación después de editar docs: `pnpm check:docs`.
Ejecuta la validación completa de anclas de Mintlify cuando también necesites comprobaciones de encabezados dentro de página: `pnpm docs:check-links:anchors`.

## Regresión offline (segura para CI)

Estas son regresiones de “pipeline real” sin proveedores reales:

- Llamada a herramientas del Gateway (OpenAI simulado, Gateway real + bucle de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Asistente del Gateway (WS `wizard.start`/`wizard.next`, escribe config + autenticación aplicada): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evals de fiabilidad de agentes (Skills)

Ya tenemos algunas pruebas seguras para CI que se comportan como “evals de fiabilidad de agentes”:

- Llamada a herramientas simulada a través del Gateway real + bucle de agente (`src/gateway/gateway.test.ts`).
- Flujos de asistente de extremo a extremo que validan el cableado de sesión y los efectos de configuración (`src/gateway/gateway.test.ts`).

Lo que aún falta para Skills (ver [Skills](/es/tools/skills)):

- **Toma de decisiones:** cuando las Skills se listan en el prompt, ¿el agente elige la skill correcta (o evita las irrelevantes)?
- **Cumplimiento:** ¿el agente lee `SKILL.md` antes de usarla y sigue los pasos/argumentos requeridos?
- **Contratos de flujo de trabajo:** escenarios de varios turnos que verifican el orden de herramientas, la continuidad del historial de sesión y los límites del sandbox.

Las evals futuras deberían mantenerse deterministas primero:

- Un ejecutor de escenarios que use proveedores simulados para verificar llamadas a herramientas + orden, lecturas de archivos de Skills y cableado de sesión.
- Una pequeña suite de escenarios centrados en Skills (usar frente a evitar, puertas, inyección de prompts).
- Evals live opcionales (opt-in, protegidas por env) solo después de que la suite segura para CI esté implementada.

## Pruebas de contrato (forma de plugins y canales)

Las pruebas de contrato verifican que cada plugin y canal registrado cumpla su
contrato de interfaz. Iteran sobre todos los plugins descubiertos y ejecutan una suite de
aserciones de forma y comportamiento. El carril unitario predeterminado de `pnpm test`
omite intencionalmente estos archivos compartidos de smoke y seams; ejecuta explícitamente
los comandos de contrato cuando toques superficies compartidas de canal o proveedor.

### Comandos

- Todos los contratos: `pnpm test:contracts`
- Solo contratos de canales: `pnpm test:contracts:channels`
- Solo contratos de proveedores: `pnpm test:contracts:plugins`

### Contratos de canales

Ubicados en `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma básica del plugin (id, nombre, capacidades)
- **setup** - Contrato del asistente de configuración
- **session-binding** - Comportamiento de enlace de sesión
- **outbound-payload** - Estructura de payload de mensaje
- **inbound** - Manejo de mensajes entrantes
- **actions** - Handlers de acciones de canal
- **threading** - Manejo de ID de hilo
- **directory** - API de directorio/lista
- **group-policy** - Aplicación de política de grupo

### Contratos de estado de proveedores

Ubicados en `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondas de estado de canal
- **registry** - Forma del registro de plugins

### Contratos de proveedores

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
- Después de añadir o modificar un canal o plugin de proveedor
- Después de refactorizar el registro o descubrimiento de plugins

Las pruebas de contrato se ejecutan en CI y no requieren claves API reales.

## Añadir regresiones (guía)

Cuando corrijas un problema de proveedor/modelo descubierto en live:

- Añade una regresión segura para CI si es posible (proveedor mock/stub, o captura la transformación exacta de forma de solicitud)
- Si es inherentemente solo live (límites de tasa, políticas de autenticación), mantén la prueba live acotada y opt-in mediante variables de entorno
- Prefiere apuntar a la capa más pequeña que capture el bug:
  - bug de conversión/replay de solicitud del proveedor → prueba directa de modelos
  - bug de sesión/historial/pipeline de herramientas del Gateway → smoke live de Gateway o prueba mock de Gateway segura para CI
- Barandilla de recorrido de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un objetivo muestreado por clase de SecretRef desde metadatos del registro (`listSecretTargetRegistryEntries()`) y luego verifica que se rechazan los exec ids con segmentos de recorrido.
  - Si añades una nueva familia de objetivos SecretRef `includeInPlan` en `src/secrets/target-registry-data.ts`, actualiza `classifyTargetClass` en esa prueba. La prueba falla intencionalmente con ids de objetivo no clasificados para que no se puedan omitir silenciosamente nuevas clases.

## Relacionado

- [Pruebas live](/es/help/testing-live)
- [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins)
- [CI](/es/ci)
