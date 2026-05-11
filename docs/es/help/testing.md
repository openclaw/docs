---
read_when:
    - Ejecutar pruebas localmente o en CI
    - Agregar pruebas de regresión para errores de modelos/proveedores
    - Depuración del comportamiento de Gateway y del agente
summary: 'Kit de pruebas: conjuntos de pruebas unitarias/e2e/en vivo, ejecutores de Docker y qué cubre cada prueba'
title: Pruebas
x-i18n:
    generated_at: "2026-05-11T20:39:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfc73e8b86188dbc58a92f36a90b9fb4d59ac4cce2c60e0bd81aca662a524561
    source_path: help/testing.md
    workflow: 16
---

OpenClaw tiene tres suites de Vitest (unitarias/integración, e2e, live) y un conjunto pequeño
de ejecutores Docker. Este documento es una guía de "cómo probamos":

- Qué cubre cada suite (y qué deliberadamente _no_ cubre).
- Qué comandos ejecutar para flujos de trabajo comunes (local, pre-push, depuración).
- Cómo las pruebas live descubren credenciales y seleccionan modelos/proveedores.
- Cómo agregar regresiones para problemas reales de modelos/proveedores.

<Note>
**La pila de QA (qa-lab, qa-channel, carriles de transporte live)** se documenta por separado:

- [Descripción general de QA](/es/concepts/qa-e2e-automation) - arquitectura, superficie de comandos, creación de escenarios.
- [QA Matrix](/es/concepts/qa-matrix) - referencia para `pnpm openclaw qa matrix`.
- [Canal de QA](/es/channels/qa-channel) - el Plugin de transporte sintético usado por escenarios respaldados por el repositorio.

Esta página cubre la ejecución de las suites de pruebas regulares y los ejecutores Docker/Parallels. La sección de ejecutores específicos de QA a continuación ([Ejecutores específicos de QA](#qa-specific-runners)) enumera las invocaciones concretas de `qa` y remite a las referencias anteriores.
</Note>

## Inicio rápido

La mayoría de los días:

- Puerta completa (esperada antes de push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Ejecución local más rápida de la suite completa en una máquina con holgura: `pnpm test:max`
- Bucle directo de observación de Vitest: `pnpm test:watch`
- El direccionamiento directo a archivos ahora también enruta rutas de extensiones/canales: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefiere primero ejecuciones dirigidas cuando estés iterando sobre un único fallo.
- Sitio de QA respaldado por Docker: `pnpm qa:lab:up`
- Carril de QA respaldado por VM de Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Cuando toques pruebas o quieras más confianza:

- Puerta de cobertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Al depurar proveedores/modelos reales (requiere credenciales reales):

- Suite live (modelos + sondas de herramienta/imagen de Gateway): `pnpm test:live`
- Apuntar silenciosamente a un archivo live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Informes de rendimiento en tiempo de ejecución: despacha `OpenClaw Performance` con
  `live_gpt54=true` para un turno real de agente `openai/gpt-5.4` o
  `deep_profile=true` para artefactos de CPU/heap/traza de Kova. Las ejecuciones programadas diarias
  publican artefactos de carriles mock-provider, deep-profile y GPT 5.4 en
  `openclaw/clawgrit-reports` cuando `CLAWGRIT_REPORTS_TOKEN` está configurado. El
  informe mock-provider también incluye números a nivel de código fuente de arranque de Gateway, memoria,
  presión de Plugin, bucle repetido de saludo con modelo falso e inicio de CLI.
- Barrido live de modelos en Docker: `pnpm test:docker:live-models`
  - Cada modelo seleccionado ahora ejecuta un turno de texto más una pequeña sonda estilo lectura de archivo.
    Los modelos cuyos metadatos anuncian entrada `image` también ejecutan un turno diminuto de imagen.
    Desactiva las sondas adicionales con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` al aislar fallos de proveedor.
  - Cobertura de CI: tanto `OpenClaw Scheduled Live And E2E Checks` diario como
    `OpenClaw Release Checks` manual llaman al flujo reutilizable live/E2E con
    `include_live_suites: true`, que incluye trabajos separados de matriz de modelos live en Docker
    fragmentados por proveedor.
  - Para reejecuciones enfocadas en CI, despacha `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` y `live_models_only: true`.
  - Agrega nuevos secretos de proveedor de alta señal a `scripts/ci-hydrate-live-auth.sh`
    junto con `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` y sus
    llamadores programados/de lanzamiento.
- Smoke de chat enlazado nativo de Codex: `pnpm test:docker:live-codex-bind`
  - Ejecuta un carril live de Docker contra la ruta app-server de Codex, enlaza un DM sintético de
    Slack con `/codex bind`, ejercita `/codex fast` y
    `/codex permissions`, y luego verifica que una respuesta simple y un adjunto de imagen
    se enruten mediante el enlace nativo del Plugin en lugar de ACP.
- Smoke del arnés app-server de Codex: `pnpm test:docker:live-codex-harness`
  - Ejecuta turnos de agente de Gateway a través del arnés app-server de Codex propiedad del Plugin,
    verifica `/codex status` y `/codex models`, y por defecto ejercita sondas de imagen,
    MCP de Cron, subagente y Guardian. Desactiva la sonda de subagente con
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` al aislar otros fallos de app-server de Codex. Para una comprobación enfocada del subagente, desactiva las otras sondas:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Esto sale después de la sonda de subagente a menos que
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` esté establecido.
- Smoke de instalación bajo demanda de Codex: `pnpm test:docker:codex-on-demand`
  - Instala el tarball empaquetado de OpenClaw en Docker, ejecuta el onboarding con clave de API de OpenAI
    y verifica que el Plugin Codex más la dependencia `@openai/codex`
    se hayan descargado bajo demanda en la raíz npm administrada.
- Smoke live de dependencia de herramienta de Plugin: `pnpm test:docker:live-plugin-tool`
  - Empaqueta un Plugin de fixture con una dependencia real `slugify`, lo instala mediante
    `npm-pack:`, verifica la dependencia bajo la raíz npm administrada y luego pide a un
    modelo live de OpenAI que llame a la herramienta del Plugin y devuelva el slug oculto.
- Smoke del comando de rescate de Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Comprobación opt-in de cinturón y tirantes para la superficie del comando de rescate del canal de mensajes.
    Ejercita `/crestodian status`, encola un cambio persistente de modelo,
    responde `/crestodian yes` y verifica la ruta de escritura de auditoría/configuración.
- Smoke Docker del planificador de Crestodian: `pnpm test:docker:crestodian-planner`
  - Ejecuta Crestodian en un contenedor sin configuración con una CLI falsa de Claude en `PATH`
    y verifica que la alternativa del planificador difuso se traduzca en una escritura de configuración tipada
    auditada.
- Smoke Docker de primera ejecución de Crestodian: `pnpm test:docker:crestodian-first-run`
  - Parte de un directorio de estado vacío de OpenClaw, enruta `openclaw` desnudo a
    Crestodian, aplica escrituras de configuración/modelo/agente/Plugin de Discord + SecretRef,
    valida la configuración y verifica entradas de auditoría. La misma ruta de configuración Ring 0
    también está cubierta en QA Lab por
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de coste de Moonshot/Kimi: con `MOONSHOT_API_KEY` establecido, ejecuta
  `openclaw models list --provider moonshot --json`, luego ejecuta un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  aislado contra `moonshot/kimi-k2.6`. Verifica que el JSON informe Moonshot/K2.6 y que la
  transcripción del asistente almacene `usage.cost` normalizado.

<Tip>
Cuando solo necesites un caso fallido, prefiere acotar las pruebas live mediante las variables de entorno de lista de permitidos descritas a continuación.
</Tip>

## Ejecutores específicos de QA

Estos comandos están junto a las suites de pruebas principales cuando necesitas realismo de QA-lab:

CI ejecuta QA Lab en flujos de trabajo dedicados. La paridad agéntica está anidada bajo
`QA-Lab - All Lanes` y la validación de lanzamiento, no como un flujo de trabajo PR independiente.
La validación amplia debe usar `Full Release Validation` con
`rerun_group=qa-parity` o el grupo QA de release-checks. Las comprobaciones estables/predeterminadas de lanzamiento
mantienen el soak exhaustivo live/Docker detrás de `run_release_soak=true`; el perfil
`full` fuerza que el soak esté activado. `QA-Lab - All Lanes`
se ejecuta todas las noches en `main` y desde despacho manual con el carril de paridad mock, el carril live
Matrix, el carril live Telegram administrado por Convex y el carril live Discord administrado por Convex
como trabajos paralelos. Las comprobaciones programadas de QA y de lanzamiento pasan Matrix
`--profile fast` explícitamente, mientras que la CLI de Matrix y la entrada del flujo manual
siguen teniendo `all` como valor predeterminado; el despacho manual puede fragmentar `all` en trabajos
`transport`,
`media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`. `OpenClaw Release
Checks` ejecuta paridad más los carriles rápidos de Matrix y Telegram antes de la aprobación de lanzamiento,
usando `mock-openai/gpt-5.5` para las comprobaciones de transporte de lanzamiento, de modo que sigan siendo
deterministas y eviten el inicio normal del Plugin de proveedor. Estos Gateways de transporte live
desactivan la búsqueda de memoria; el comportamiento de memoria sigue cubierto por las suites de paridad de QA.

Los fragmentos live de medios de lanzamiento completo usan
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, que ya tiene
`ffmpeg` y `ffprobe`. Los fragmentos Docker live de modelo/backend usan la imagen compartida
`ghcr.io/openclaw/openclaw-live-test:<sha>` construida una vez por commit seleccionado,
y luego la descargan con `OPENCLAW_SKIP_DOCKER_BUILD=1` en lugar de reconstruirla
dentro de cada fragmento.

- `pnpm openclaw qa suite`
  - Ejecuta escenarios de QA respaldados por el repositorio directamente en el host.
  - Ejecuta varios escenarios seleccionados en paralelo de forma predeterminada con workers de
    gateway aislados. `qa-channel` usa concurrencia 4 de forma predeterminada (limitada por el
    número de escenarios seleccionados). Usa `--concurrency <count>` para ajustar el número de
    workers, o `--concurrency 1` para el carril serial anterior.
  - Sale con código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
    quieras artefactos sin un código de salida fallido.
  - Admite los modos de proveedor `live-frontier`, `mock-openai` y `aimock`.
    `aimock` inicia un servidor de proveedor local respaldado por AIMock para cobertura experimental
    de fixtures y mocks de protocolo sin reemplazar el carril `mock-openai`, que conoce los escenarios.
- `pnpm test:plugins:kitchen-sink-live`
  - Ejecuta el conjunto de pruebas en vivo del Plugin OpenAI Kitchen Sink mediante QA Lab. Instala
    el paquete externo Kitchen Sink, verifica el inventario de superficie del SDK de plugins,
    sondea `/healthz` y `/readyz`, registra evidencia de CPU/RSS del Gateway, ejecuta un turno en
    vivo de OpenAI y comprueba diagnósticos adversariales. Requiere autenticación en vivo de OpenAI
    como `OPENAI_API_KEY`. En sesiones hidratadas de Testbox, carga automáticamente el perfil de
    autenticación en vivo de Testbox cuando el helper `openclaw-testbox-env` está presente.
- `pnpm test:gateway:cpu-scenarios`
  - Ejecuta el banco de inicio del Gateway más un pequeño paquete de escenarios mock de QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) y escribe un resumen combinado de observación de CPU
    en `.artifacts/gateway-cpu-scenarios/`.
  - Marca solo observaciones sostenidas de CPU caliente de forma predeterminada (`--cpu-core-warn`
    más `--hot-wall-warn-ms`), por lo que las ráfagas breves de inicio se registran como métricas
    sin parecerse a la regresión de Gateway fijado durante minutos.
  - Usa artefactos compilados de `dist`; ejecuta primero una compilación cuando el checkout no tenga
    ya una salida de runtime reciente.
- `pnpm openclaw qa suite --runner multipass`
  - Ejecuta la misma suite de QA dentro de una VM Linux desechable de Multipass.
  - Mantiene el mismo comportamiento de selección de escenarios que `qa suite` en el host.
  - Reutiliza las mismas flags de selección de proveedor/modelo que `qa suite`.
  - Las ejecuciones en vivo reenvían las entradas de autenticación de QA admitidas que son prácticas para el invitado:
    claves de proveedor basadas en env, la ruta de configuración del proveedor en vivo de QA y `CODEX_HOME`
    cuando está presente.
  - Los directorios de salida deben permanecer bajo la raíz del repositorio para que el invitado pueda escribir de vuelta mediante
    el workspace montado.
  - Escribe el informe y resumen normales de QA más los logs de Multipass en
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia el sitio de QA respaldado por Docker para trabajo de QA de estilo operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Construye un tarball npm desde el checkout actual, lo instala globalmente en
    Docker, ejecuta onboarding no interactivo con clave de API de OpenAI, configura Telegram
    de forma predeterminada, verifica que el runtime del Plugin empaquetado cargue sin reparación
    de dependencias de inicio, ejecuta doctor y ejecuta un turno de agente local contra un
    endpoint OpenAI simulado.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para ejecutar el mismo carril de instalación empaquetada
    con Discord.
- `pnpm test:docker:session-runtime-context`
  - Ejecuta un smoke determinista de app compilada en Docker para transcripciones de contexto de runtime
    embebido. Verifica que el contexto de runtime oculto de OpenClaw se persista como un
    mensaje personalizado no visible en lugar de filtrarse en el turno visible del usuario,
    luego siembra un JSONL de sesión rota afectada y verifica que
    `openclaw doctor --fix` lo reescriba a la rama activa con una copia de seguridad.
- `pnpm test:docker:npm-telegram-live`
  - Instala un candidato de paquete OpenClaw en Docker, ejecuta onboarding de paquete instalado,
    configura Telegram mediante la CLI instalada y luego reutiliza el carril de QA en vivo de
    Telegram con ese paquete instalado como Gateway SUT.
  - El wrapper monta solo el código fuente del harness `qa-lab` desde el checkout; el
    paquete instalado es dueño de `dist`, `openclaw/plugin-sdk` y del runtime del Plugin
    incluido, de modo que el carril no mezcla plugins del checkout actual en el paquete
    bajo prueba.
  - El valor predeterminado es `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; define
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` o
    `OPENCLAW_CURRENT_PACKAGE_TGZ` para probar un tarball local resuelto en lugar de
    instalar desde el registro.
  - Usa las mismas credenciales env de Telegram o fuente de credenciales Convex que
    `pnpm openclaw qa telegram`. Para automatización de CI/release, define
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` más
    `OPENCLAW_QA_CONVEX_SITE_URL` y el secreto de rol. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` y un secreto de rol Convex están presentes en CI,
    el wrapper de Docker selecciona Convex automáticamente.
  - El wrapper valida el env de credenciales de Telegram o Convex en el host antes del
    trabajo de build/install de Docker. Define `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    solo cuando estés depurando deliberadamente la configuración previa a credenciales.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sobrescribe el valor compartido
    `OPENCLAW_QA_CREDENTIAL_ROLE` solo para este carril.
  - GitHub Actions expone este carril como el workflow manual de mantenedor
    `NPM Telegram Beta E2E`. No se ejecuta en merge. El workflow usa el entorno
    `qa-live-shared` y leases de credenciales CI de Convex.
- GitHub Actions también expone `Package Acceptance` para prueba de producto de ejecución lateral
  contra un paquete candidato. Acepta una ref de confianza, una spec npm publicada,
  una URL HTTPS de tarball más SHA-256, o un artefacto tarball de otra ejecución, sube
  el `openclaw-current.tgz` normalizado como `package-under-test`, y luego ejecuta el
  scheduler E2E de Docker existente con perfiles de carril smoke, package, product, full o custom.
  Define `telegram_mode=mock-openai` o `live-frontier` para ejecutar el workflow de QA de
  Telegram contra el mismo artefacto `package-under-test`.
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
  - Empaqueta e instala la build actual de OpenClaw en Docker, inicia el Gateway
    con OpenAI configurado y luego habilita canales/plugins incluidos mediante ediciones de config.
  - Verifica que el descubrimiento de configuración deje ausentes los plugins descargables no configurados,
    que la primera reparación configurada de doctor instale explícitamente cada Plugin descargable
    faltante y que un segundo reinicio no ejecute reparación oculta de dependencias.
  - También instala una baseline npm anterior conocida, habilita Telegram antes de ejecutar
    `openclaw update --tag <candidate>` y verifica que el doctor posterior a la actualización del
    candidato limpie restos de dependencias de plugins heredados sin una reparación postinstall
    del lado del harness.
- `pnpm test:parallels:npm-update`
  - Ejecuta el smoke nativo de actualización de instalación empaquetada en invitados de Parallels. Cada
    plataforma seleccionada instala primero el paquete baseline solicitado, luego ejecuta el comando
    `openclaw update` instalado en el mismo invitado y verifica la versión instalada, el estado de
    actualización, la disponibilidad del Gateway y un turno de agente local.
  - Usa `--platform macos`, `--platform windows` o `--platform linux` mientras
    iteras en un invitado. Usa `--json` para la ruta del artefacto de resumen y
    el estado por carril.
  - El carril de OpenAI usa `openai/gpt-5.5` para la prueba en vivo de turno de agente de forma
    predeterminada. Pasa `--model <provider/model>` o define
    `OPENCLAW_PARALLELS_OPENAI_MODEL` cuando valides deliberadamente otro
    modelo de OpenAI.
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
    actualización de paquetes en un invitado frío; eso sigue siendo saludable cuando el log de depuración
    npm anidado avanza.
  - No ejecutes este wrapper agregado en paralelo con carriles smoke individuales de Parallels
    macOS, Windows o Linux. Comparten estado de VM y pueden colisionar en la restauración de
    snapshots, el servicio de paquetes o el estado del Gateway del invitado.
  - La prueba posterior a la actualización ejecuta la superficie normal de Plugin incluido porque
    las fachadas de capacidades como voz, generación de imágenes y comprensión de medios
    se cargan mediante APIs de runtime incluidas incluso cuando el turno de agente en sí
    solo comprueba una respuesta de texto simple.

- `pnpm openclaw qa aimock`
  - Inicia solo el servidor local del proveedor AIMock para pruebas smoke directas de protocolo.
- `pnpm openclaw qa matrix`
  - Ejecuta el carril de QA en vivo de Matrix contra un homeserver Tuwunel desechable respaldado por Docker. Solo checkout de código fuente: las instalaciones empaquetadas no distribuyen `qa-lab`.
  - CLI completa, catálogo de perfiles/escenarios, variables env y diseño de artefactos: [QA de Matrix](/es/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Ejecuta el carril de QA en vivo de Telegram contra un grupo privado real usando los tokens del bot driver y SUT desde env.
  - Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. El id del grupo debe ser el id numérico del chat de Telegram.
  - Admite `--credential-source convex` para credenciales compartidas agrupadas. Usa el modo env de forma predeterminada, o define `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases agrupados.
  - Los valores predeterminados cubren canary, gating de menciones, direccionamiento de comandos, `/status`, respuestas mencionadas de bot a bot y respuestas de comandos nativos del core. Los valores predeterminados de `mock-openai` también cubren regresiones deterministas de cadena de respuesta y streaming de mensaje final de Telegram. Usa `--list-scenarios` para sondeos opcionales como `session_status`.
  - Sale con código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando quieras
    artefactos sin un código de salida fallido.
  - Requiere dos bots distintos en el mismo grupo privado, con el bot SUT exponiendo un nombre de usuario de Telegram.
  - Para una observación estable de bot a bot, habilita Bot-to-Bot Communication Mode en `@BotFather` para ambos bots y asegúrate de que el bot driver pueda observar el tráfico de bots del grupo.
  - Escribe un informe de QA de Telegram, un resumen y un artefacto de mensajes observados en `.artifacts/qa-e2e/...`. Los escenarios de respuesta incluyen RTT desde la solicitud de envío del driver hasta la respuesta SUT observada.

`Mantis Telegram Live` es el wrapper de evidencia de PR alrededor de este carril. Ejecuta la
ref candidata con credenciales de Telegram arrendadas por Convex, renderiza la transcripción
redactada de mensajes observados en un navegador de escritorio de Crabbox, graba evidencia MP4,
genera un GIF recortado por movimiento, sube el bundle de artefactos y publica evidencia de PR
inline mediante la GitHub App Mantis cuando `pr_number` está definido. Los mantenedores pueden
iniciarlo desde la UI de Actions mediante `Mantis Scenario` (`scenario_id:
telegram-live`) o directamente desde un comentario de pull request:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` es el wrapper agentic nativo de Telegram Desktop
antes/después para prueba visual de PR. Inícialo desde la UI de Actions con
`instructions` de forma libre, mediante `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`), o desde un comentario de PR:

```text
@Mantis telegram desktop proof
```

El agente Mantis lee la PR, decide qué comportamiento visible en Telegram prueba el
cambio, ejecuta la vía de prueba de Crabbox Telegram Desktop con usuario real en las refs
base y candidata, itera hasta que los GIF nativos sean útiles, escribe un manifiesto
`motionPreview` emparejado y publica la misma tabla de GIF de 2 columnas mediante la
Mantis GitHub App cuando `pr_number` está configurado.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Arrienda o reutiliza un escritorio Linux de Crabbox, instala Telegram Desktop nativo, configura OpenClaw con un token de bot SUT de Telegram arrendado, inicia el gateway y graba evidencia de capturas de pantalla/MP4 desde el escritorio VNC visible.
  - El valor predeterminado es `--credential-source convex`, de modo que los flujos de trabajo solo necesiten el secreto del bróker de Convex. Usa `--credential-source env` con las mismas variables `OPENCLAW_QA_TELEGRAM_*` que `pnpm openclaw qa telegram`.
  - Telegram Desktop todavía necesita un inicio de sesión/perfil de usuario. El token de bot solo configura OpenClaw. Usa `--telegram-profile-archive-env <name>` para un archivo de perfil `.tgz` en base64, o usa `--keep-lease` e inicia sesión manualmente mediante VNC una vez.
  - Escribe `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` y `telegram-desktop-builder.mp4` en el directorio de salida.

Las vías de transporte en vivo comparten un contrato estándar para que los transportes nuevos no diverjan; la matriz de cobertura por vía está en [Resumen de QA → Cobertura de transporte en vivo](/es/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` es la suite sintética amplia y no forma parte de esa matriz.

### Credenciales compartidas de Telegram mediante Convex (v1)

Cuando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
QA de transporte en vivo, QA lab adquiere un arriendo exclusivo de un pool respaldado por Convex, envía heartbeats para ese
arriendo mientras la vía está en ejecución y libera el arriendo al apagarse. El nombre de la sección es anterior
a la compatibilidad con Discord, Slack y WhatsApp; el contrato de arriendo se comparte entre tipos.

Andamiaje de referencia del proyecto Convex:

- `qa/convex-credential-broker/`

Variables de entorno requeridas:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por ejemplo `https://your-deployment.convex.site`)
- Un secreto para el rol seleccionado:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Selección de rol de credencial:
  - CLI: `--credential-role maintainer|ci`
  - Valor predeterminado de entorno: `OPENCLAW_QA_CREDENTIAL_ROLE` (predeterminado a `ci` en CI, `maintainer` en caso contrario)

Variables de entorno opcionales:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predeterminado `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predeterminado `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predeterminado `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predeterminado `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predeterminado `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de traza opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URL `http://` de Convex de loopback para desarrollo solo local.

`OPENCLAW_QA_CONVEX_SITE_URL` debe usar `https://` en operación normal.

Los comandos de administración de mantenedor (agregar/quitar/listar del pool) requieren
específicamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Ayudantes de CLI para mantenedores:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `doctor` antes de ejecuciones en vivo para comprobar la URL del sitio de Convex, los secretos del bróker,
el prefijo de endpoint, el tiempo de espera HTTP y la accesibilidad de administración/listado sin imprimir
valores secretos. Usa `--json` para salida legible por máquina en scripts y utilidades de CI.

Contrato de endpoint predeterminado (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Solicitud: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Correcto: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Agotado/reintentable: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Solicitud: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Correcto: `{ status: "ok", index, data }`
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
  - Guarda de arriendo activo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo secreto de mantenedor)
  - Solicitud: `{ kind?, status?, includePayload?, limit? }`
  - Correcto: `{ status: "ok", credentials, count }`

Forma de payload para el tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` debe ser una cadena numérica de id de chat de Telegram.
- `admin/add` valida esta forma para `kind: "telegram"` y rechaza payloads malformados.

Forma de payload para el tipo Telegram con usuario real:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` y `telegramApiId` deben ser cadenas numéricas.
- `tdlibArchiveSha256` y `desktopTdataArchiveSha256` deben ser cadenas hexadecimales SHA-256.
- `kind: "telegram-user"` representa una cuenta desechable de Telegram. Trata el arriendo como de toda la cuenta: el controlador CLI de TDLib y el testigo visual de Telegram Desktop se restauran desde el mismo payload, y solo un trabajo debe poseer el arriendo a la vez.

Restauración de arriendo de Telegram con usuario real:

```bash
tmp=$(mktemp -d /tmp/openclaw-telegram-user.XXXXXX)
node --import tsx scripts/e2e/telegram-user-credential.ts lease-restore \
  --user-driver-dir "$tmp/user-driver" \
  --desktop-workdir "$tmp/desktop" \
  --lease-file "$tmp/lease.json"
TELEGRAM_USER_DRIVER_STATE_DIR="$tmp/user-driver" \
  uv run ~/.codex/skills/custom/telegram-e2e-bot-to-bot/scripts/user-driver.py status --json
node --import tsx scripts/e2e/telegram-user-credential.ts release --lease-file "$tmp/lease.json"
```

Usa el perfil restaurado de Desktop con `Telegram -workdir "$tmp/desktop"` cuando se necesite una grabación visual. En entornos de operador locales, `scripts/e2e/telegram-user-credential.ts` lee `~/.codex/skills/custom/telegram-e2e-bot-to-bot/convex.local.env` de forma predeterminada si las variables de entorno del proceso no están presentes.

Sesión de Crabbox dirigida por agente:

```bash
pnpm qa:telegram-user:crabbox -- start \
  --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz \
  --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json \
  --text /status
pnpm qa:telegram-user:crabbox -- finish \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start` arrienda la credencial `telegram-user`, restaura la misma cuenta en
TDLib y Telegram Desktop en un escritorio Linux de Crabbox, inicia un Gateway
SUT simulado local desde el checkout actual, abre el chat visible de Telegram, inicia
la grabación del escritorio y escribe un `session.json` privado. Mientras la sesión esté
viva, un agente puede seguir probando hasta quedar satisfecho:

- `send --session <file> --text <message>` envía mediante el usuario real de TDLib y espera la respuesta del SUT.
- `run --session <file> -- <remote command>` ejecuta un comando arbitrario en Crabbox y guarda su salida, por ejemplo `bash -lc 'source /tmp/openclaw-telegram-user-crabbox/env.sh && python3 /tmp/openclaw-telegram-user-crabbox/user-driver.py transcript --limit 20 --json'`.
- `screenshot --session <file>` captura el escritorio visible actual.
- `status --session <file>` imprime el arriendo y el comando WebVNC.
- `finish --session <file>` detiene el grabador, captura artefactos de captura de pantalla/video/recorte por movimiento, libera la credencial de Convex, detiene los procesos SUT locales y detiene el arriendo de Crabbox salvo que se pase `--keep-box`.
- `publish --session <file> --pr <number>` publica un comentario de PR solo con GIF de forma predeterminada. Pasa `--full-artifacts` solo cuando se necesiten intencionalmente logs o artefactos JSON.

Para reproducciones visuales deterministas, pasa `--mock-response-file <path>` a `start`
o al atajo de un solo comando `probe`. El ejecutor usa de forma predeterminada una clase
estándar de Crabbox, grabación a 24 fps, vistas previas GIF de movimiento a 24 fps y un ancho de GIF
de 1920 px. Sobrescribe con `--class`, `--record-fps`, `--preview-fps` y
`--preview-width` solo cuando la prueba necesite configuraciones de captura diferentes.

Prueba de Crabbox de un solo comando:

```bash
pnpm qa:telegram-user:crabbox -- --text /status
```

El comando `probe` predeterminado es un atajo para un ciclo start/send/finish. Úsalo
para una comprobación rápida de `/status`. Usa los comandos de sesión para revisión de PR,
trabajo de reproducción de errores o cualquier caso en que el agente necesite minutos de experimentación
arbitraria antes de decidir que la prueba está completa. Usa `--id <cbx_...>` para
reutilizar un arriendo de escritorio ya preparado, `--keep-box` para mantener VNC abierto después de finish,
`--desktop-chat-title <name>` para elegir el chat visible y `--tdlib-url <tgz>`
cuando uses un archivo Linux `libtdjson.so` preconstruido en lugar de compilar TDLib en
una máquina nueva. El ejecutor verifica `--tdlib-url` con `--tdlib-sha256 <hex>` o,
de forma predeterminada, con un archivo hermano `<url>.sha256`.

Payloads multicanal validados por el bróker:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Las vías de Slack también pueden arrendar desde el pool, pero la validación de payload de Slack actualmente
vive en el ejecutor de QA de Slack en lugar de en el bróker. Usa
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
para filas de Slack.

### Agregar un canal a QA

La arquitectura y los nombres de ayudantes de escenario para adaptadores de canal nuevos están en [Resumen de QA → Agregar un canal](/es/concepts/qa-e2e-automation#adding-a-channel). El mínimo requerido: implementar el ejecutor de transporte sobre el seam de host compartido `qa-lab`, declarar `qaRunners` en el manifiesto del plugin, montar como `openclaw qa <runner>` y crear escenarios en `qa/scenarios/`.

## Suites de pruebas (qué se ejecuta dónde)

Piensa en las suites como “realismo creciente” (y mayor inestabilidad/costo):

### Unitarias / integración (predeterminado)

- Comando: `pnpm test`
- Configuración: las ejecuciones sin destino usan el conjunto de shards `vitest.full-*.config.ts` y pueden expandir shards multiproyecto en configuraciones por proyecto para programación paralela
- Archivos: inventarios core/unit en `src/**/*.test.ts`, `packages/**/*.test.ts` y `test/**/*.test.ts`; las pruebas unitarias de UI se ejecutan en el shard dedicado `unit-ui`
- Alcance:
  - Pruebas unitarias puras
  - Pruebas de integración en proceso (autenticación de Gateway, enrutamiento, herramientas, parsing, configuración)
  - Regresiones deterministas para errores conocidos
- Expectativas:
  - Se ejecuta en CI
  - No requiere claves reales
  - Debe ser rápida y estable
  - Las pruebas de resolución y del cargador de superficie pública deben demostrar el comportamiento amplio de fallback de `api.js` y
    `runtime-api.js` con fixtures de plugin mínimos generados, no con
    API de código fuente de plugins empaquetados reales. Las cargas de API de plugins reales pertenecen a
    suites de contrato/integración propiedad del plugin.

Política de dependencias nativas:

- Las instalaciones de prueba predeterminadas omiten las compilaciones nativas opcionales de opus para Discord. La recepción de voz de Discord usa el decodificador pure-JS `opusscript`, y `@discordjs/opus` permanece deshabilitado en `allowBuilds` para que las pruebas locales y los carriles de Testbox no compilen el addon nativo.
- Usa un carril dedicado de rendimiento de voz de Discord o uno en vivo si necesitas comparar intencionalmente una compilación nativa de opus. No establezcas `@discordjs/opus` en `true` en el `allowBuilds` predeterminado; eso hace que bucles de instalación/prueba no relacionados compilen código nativo.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - `pnpm test` sin objetivo ejecuta doce configuraciones de shards más pequeñas (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) en lugar de un único proceso gigante de proyecto raíz nativo. Esto reduce el RSS máximo en máquinas cargadas y evita que el trabajo de auto-reply/extensiones prive de recursos a suites no relacionadas.
    - `pnpm test --watch` todavía usa el grafo de proyectos raíz nativo de `vitest.config.ts`, porque un bucle de observación con múltiples shards no es práctico.
    - `pnpm test`, `pnpm test:watch` y `pnpm test:perf:imports` enrutan primero los objetivos explícitos de archivo/directorio por carriles con alcance, por lo que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar todo el costo de arranque del proyecto raíz.
    - `pnpm test:changed` expande las rutas git modificadas en carriles con alcance baratos de forma predeterminada: ediciones directas de pruebas, archivos `*.test.ts` hermanos, asignaciones explícitas de código fuente y dependientes locales del grafo de importación. Las ediciones de configuración/setup/paquete no ejecutan pruebas amplias salvo que uses explícitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` es la compuerta normal de comprobación local inteligente para trabajo acotado. Clasifica el diff en core, pruebas de core, extensiones, pruebas de extensiones, apps, documentación, metadatos de release, herramientas Docker en vivo y tooling, y luego ejecuta los comandos de typecheck, lint y guard correspondientes. No ejecuta pruebas Vitest; llama a `pnpm test:changed` o a `pnpm test <target>` explícito para la prueba de tests. Los cambios de versión que solo afectan metadatos de release ejecutan comprobaciones dirigidas de versión/configuración/dependencias raíz, con una guardia que rechaza cambios de paquete fuera del campo de versión de nivel superior.
    - Las ediciones del arnés Docker ACP en vivo ejecutan comprobaciones enfocadas: sintaxis shell para los scripts de autenticación Docker en vivo y un ensayo en seco del planificador Docker en vivo. Los cambios de `package.json` se incluyen solo cuando el diff se limita a `scripts["test:docker:live-*"]`; las ediciones de dependencias, exportaciones, versión y otras superficies de paquete siguen usando las guardias más amplias.
    - Las pruebas unitarias livianas en importaciones de agentes, comandos, plugins, helpers de auto-reply, `plugin-sdk` y áreas similares de utilidades puras se enrutan por el carril `unit-fast`, que omite `test/setup-openclaw-runtime.ts`; los archivos con estado o pesados en runtime permanecen en los carriles existentes.
    - Algunos archivos fuente de helpers de `plugin-sdk` y `commands` también asignan las ejecuciones en modo cambiado a pruebas hermanas explícitas en esos carriles livianos, para que las ediciones de helpers eviten volver a ejecutar la suite pesada completa de ese directorio.
    - `auto-reply` tiene buckets dedicados para helpers de core de nivel superior, pruebas de integración `reply.*` de nivel superior y el subárbol `src/auto-reply/reply/**`. CI divide además el subárbol de respuesta en shards de agent-runner, dispatch y commands/state-routing para que un bucket pesado en importaciones no sea dueño de toda la cola de Node.
    - CI normal de PR/main omite intencionalmente el barrido por lotes de extensiones y el shard solo de release `agentic-plugins`. Full Release Validation despacha el flujo de trabajo hijo separado `Plugin Prerelease` para esas suites pesadas en plugins/extensiones sobre candidatos de release.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Cuando cambies entradas de descubrimiento de herramientas de mensajes o contexto
      de runtime de Compaction, conserva ambos niveles de cobertura.
    - Agrega regresiones enfocadas de helpers para límites puros de enrutamiento
      y normalización.
    - Mantén sanas las suites de integración del runner embebido:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, y
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Esas suites verifican que los ids con alcance y el comportamiento de Compaction
      sigan fluyendo por las rutas reales `run.ts` / `compact.ts`; las pruebas
      solo de helpers no son un sustituto suficiente para esas rutas de integración.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - La configuración base de Vitest usa `threads` de forma predeterminada.
    - La configuración compartida de Vitest fija `isolate: false` y usa el
      runner no aislado en los proyectos raíz, e2e y configuraciones en vivo.
    - El carril UI raíz conserva su setup y optimizador de `jsdom`, pero también
      se ejecuta sobre el runner compartido no aislado.
    - Cada shard de `pnpm test` hereda los mismos valores predeterminados
      `threads` + `isolate: false` de la configuración compartida de Vitest.
    - `scripts/run-vitest.mjs` agrega `--no-maglev` de forma predeterminada
      para procesos Node hijos de Vitest, para reducir la rotación de compilación
      de V8 durante ejecuciones locales grandes. Establece
      `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar con el comportamiento
      estándar de V8.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` muestra qué carriles arquitectónicos activa un diff.
    - El hook de pre-commit solo formatea. Vuelve a preparar los archivos formateados y
      no ejecuta lint, typecheck ni pruebas.
    - Ejecuta `pnpm check:changed` explícitamente antes del traspaso o push cuando
      necesites la compuerta de comprobación local inteligente.
    - `pnpm test:changed` enruta por carriles con alcance baratos de forma predeterminada. Usa
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el agente
      decide que una edición de arnés, configuración, paquete o contrato realmente necesita
      cobertura Vitest más amplia.
    - `pnpm test:max` y `pnpm test:changed:max` conservan el mismo comportamiento
      de enrutamiento, solo con un límite de workers más alto.
    - El autoescalado de workers locales es intencionalmente conservador y reduce
      capacidad cuando el promedio de carga del host ya es alto, por lo que varias
      ejecuciones Vitest concurrentes hacen menos daño de forma predeterminada.
    - La configuración base de Vitest marca los proyectos/archivos de configuración como
      `forceRerunTriggers` para que las reejecuciones en modo cambiado sigan siendo correctas
      cuando cambia el cableado de pruebas.
    - La configuración mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado en hosts
      compatibles; establece `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si quieres
      una ubicación explícita de caché para perfilado directo.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` habilita el reporte de duración de importaciones de Vitest más
      la salida de desglose de importaciones.
    - `pnpm test:perf:imports:changed` limita la misma vista de perfilado a
      archivos cambiados desde `origin/main`.
    - Los datos de tiempos de shards se escriben en `.artifacts/vitest-shard-timings.json`.
      Las ejecuciones de configuración completa usan la ruta de configuración como clave; los shards de CI
      por patrón de inclusión agregan el nombre del shard para que los shards filtrados puedan rastrearse
      por separado.
    - Cuando una prueba caliente todavía pasa la mayor parte del tiempo en importaciones de arranque,
      mantén las dependencias pesadas detrás de una frontera local estrecha `*.runtime.ts` y
      mockea esa frontera directamente en lugar de hacer deep-import de helpers de runtime solo
      para pasarlos por `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara el
      `test:changed` enrutado con la ruta nativa del proyecto raíz para ese diff confirmado
      e imprime tiempo de pared más RSS máximo de macOS.
    - `pnpm test:perf:changed:bench -- --worktree` hace benchmark del árbol sucio
      actual enrutando la lista de archivos modificados por
      `scripts/test-projects.mjs` y la configuración raíz de Vitest.
    - `pnpm test:perf:profile:main` escribe un perfil de CPU del hilo principal para
      el overhead de arranque y transform de Vitest/Vite.
    - `pnpm test:perf:profile:runner` escribe perfiles de CPU+heap del runner para la
      suite unitaria con paralelismo por archivo deshabilitado.

  </Accordion>
</AccordionGroup>

### Estabilidad (gateway)

- Comando: `pnpm test:stability:gateway`
- Configuración: `vitest.gateway.config.ts`, forzado a un worker
- Alcance:
  - Inicia un Gateway real en loopback con diagnósticos habilitados de forma predeterminada
  - Impulsa churn sintético de mensajes de Gateway, memoria y payloads grandes por la ruta de eventos de diagnóstico
  - Consulta `diagnostics.stability` sobre el RPC WS del Gateway
  - Cubre helpers de persistencia del paquete de estabilidad de diagnóstico
  - Afirma que el recorder permanece acotado, las muestras RSS sintéticas se mantienen por debajo del presupuesto de presión y las profundidades de cola por sesión vuelven a cero
- Expectativas:
  - Seguro para CI y sin claves
  - Carril estrecho para seguimiento de regresiones de estabilidad, no un sustituto de la suite completa de Gateway

### E2E (smoke de gateway)

- Comando: `pnpm test:e2e`
- Configuración: `vitest.e2e.config.ts`
- Archivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` y pruebas E2E de plugins incluidos bajo `extensions/`
- Valores predeterminados de runtime:
  - Usa `threads` de Vitest con `isolate: false`, igual que el resto del repositorio.
  - Usa workers adaptativos (CI: hasta 2, local: 1 de forma predeterminada).
  - Se ejecuta en modo silencioso de forma predeterminada para reducir el overhead de E/S de consola.
- Overrides útiles:
  - `OPENCLAW_E2E_WORKERS=<n>` para forzar el recuento de workers (limitado a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para volver a habilitar la salida detallada de consola.
- Alcance:
  - Comportamiento end-to-end de Gateway multiinstancia
  - Superficies WebSocket/HTTP, emparejamiento de nodos y networking más pesado
- Expectativas:
  - Se ejecuta en CI (cuando está habilitado en la pipeline)
  - No requiere claves reales
  - Más piezas móviles que las pruebas unitarias (puede ser más lento)

### E2E: smoke del backend de OpenShell

- Comando: `pnpm test:e2e:openshell`
- Archivo: `extensions/openshell/src/backend.e2e.test.ts`
- Alcance:
  - Inicia un Gateway OpenShell aislado en el host mediante Docker
  - Crea un sandbox a partir de un Dockerfile local temporal
  - Ejercita el backend OpenShell de OpenClaw sobre `sandbox ssh-config` real + ejecución SSH
  - Verifica el comportamiento de sistema de archivos canónico remoto mediante el puente fs del sandbox
- Expectativas:
  - Solo opt-in; no forma parte de la ejecución predeterminada de `pnpm test:e2e`
  - Requiere una CLI local `openshell` más un daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` aislados y luego destruye el Gateway y sandbox de prueba
- Overrides útiles:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar la prueba al ejecutar manualmente la suite e2e más amplia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apuntar a un binario CLI o script wrapper no predeterminado

### En vivo (proveedores reales + modelos reales)

- Comando: `pnpm test:live`
- Configuración: `vitest.live.config.ts`
- Archivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` y pruebas live de plugins incluidos bajo `extensions/`
- Valor predeterminado: **habilitado** por `pnpm test:live` (establece `OPENCLAW_LIVE_TEST=1`)
- Alcance:
  - "¿Este proveedor/modelo realmente funciona _hoy_ con credenciales reales?"
  - Detectar cambios de formato del proveedor, particularidades de llamadas a herramientas, problemas de autenticación y comportamiento de límites de tasa
- Expectativas:
  - No es estable para CI por diseño (redes reales, políticas reales del proveedor, cuotas, interrupciones)
  - Cuesta dinero / usa límites de tasa
  - Prefiere ejecutar subconjuntos acotados en lugar de "todo"
- Las ejecuciones live cargan `~/.profile` para recoger claves de API faltantes.
- De forma predeterminada, las ejecuciones live todavía aíslan `HOME` y copian material de configuración/autenticación en un home de prueba temporal para que los fixtures unitarios no puedan modificar tu `~/.openclaw` real.
- Establece `OPENCLAW_LIVE_USE_REAL_HOME=1` solo cuando necesites intencionalmente que las pruebas live usen tu directorio home real.
- `pnpm test:live` ahora usa de forma predeterminada un modo más silencioso: mantiene la salida de progreso `[live] ...`, pero suprime el aviso adicional de `~/.profile` y silencia los logs de arranque del Gateway y el ruido de Bonjour. Establece `OPENCLAW_LIVE_TEST_QUIET=0` si quieres recuperar todos los logs de inicio.
- Rotación de claves de API (específica del proveedor): establece `*_API_KEYS` con formato de comas/punto y coma o `*_API_KEY_1`, `*_API_KEY_2` (por ejemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) o una anulación por live mediante `OPENCLAW_LIVE_*_KEY`; las pruebas reintentan ante respuestas de límite de tasa.
- Salida de progreso/Heartbeat:
  - Las suites live ahora emiten líneas de progreso a stderr para que las llamadas largas al proveedor se vean activas incluso cuando la captura de consola de Vitest esté silenciosa.
  - `vitest.live.config.ts` deshabilita la interceptación de consola de Vitest para que las líneas de progreso del proveedor/Gateway se transmitan inmediatamente durante las ejecuciones live.
  - Ajusta los heartbeats de modelo directo con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajusta los heartbeats de Gateway/sonda con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## ¿Qué suite debería ejecutar?

Usa esta tabla de decisión:

- Editar lógica/pruebas: ejecuta `pnpm test` (y `pnpm test:coverage` si cambiaste mucho)
- Tocar la red del Gateway / protocolo WS / emparejamiento: añade `pnpm test:e2e`
- Depurar "mi bot está caído" / fallos específicos del proveedor / llamadas a herramientas: ejecuta un `pnpm test:live` acotado

## Pruebas live (que tocan la red)

Para la matriz de modelos live, pruebas rápidas del backend de la CLI, pruebas rápidas de ACP, el
harness del servidor de apps de Codex y todas las pruebas live de proveedores de medios (Deepgram, BytePlus, ComfyUI, imagen,
música, vídeo, harness de medios), además del manejo de credenciales para ejecuciones live, consulta
[Probar suites live](/es/help/testing-live). Para la lista de comprobación dedicada de actualización y
validación de plugins, consulta
[Probar actualizaciones y plugins](/es/help/testing-updates-plugins).

## Runners de Docker (comprobaciones opcionales de "funciona en Linux")

Estos runners de Docker se dividen en dos grupos:

- Runners de modelos live: `test:docker:live-models` y `test:docker:live-gateway` ejecutan solo su archivo live de claves de perfil correspondiente dentro de la imagen Docker del repo (`src/agents/models.profiles.live.test.ts` y `src/gateway/gateway-models.profiles.live.test.ts`), montando tu directorio de configuración local y el workspace (y cargando `~/.profile` si está montado). Los puntos de entrada locales correspondientes son `test:live:models-profiles` y `test:live:gateway-profiles`.
- Los runners live de Docker usan de forma predeterminada un límite de smoke más pequeño para que un barrido completo de Docker siga siendo práctico:
  `test:docker:live-models` usa de forma predeterminada `OPENCLAW_LIVE_MAX_MODELS=12`, y
  `test:docker:live-gateway` usa de forma predeterminada `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` y
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Anula esas variables de entorno cuando
  quieras explícitamente el escaneo exhaustivo más grande.
- `test:docker:all` compila la imagen Docker live una vez mediante `test:docker:live-build`, empaqueta OpenClaw una vez como tarball de npm a través de `scripts/package-openclaw-for-docker.mjs` y luego compila/reutiliza dos imágenes de `scripts/e2e/Dockerfile`. La imagen básica es solo el runner de Node/Git para carriles de instalación/actualización/dependencias de plugins; esos carriles montan el tarball precompilado. La imagen funcional instala el mismo tarball en `/app` para carriles de funcionalidad de la app compilada. Las definiciones de carriles de Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`; la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ejecuta el plan seleccionado. El agregado usa un planificador local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla los slots de proceso, mientras que los límites de recursos evitan que los carriles pesados live, de instalación de npm y multiservicio arranquen todos a la vez. Si un único carril pesa más que los límites activos, el planificador aún puede iniciarlo cuando el pool está vacío y luego lo mantiene ejecutándose solo hasta que vuelva a haber capacidad disponible. Los valores predeterminados son 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` y `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajusta `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` u `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` solo cuando el host Docker tenga más margen. El runner realiza una comprobación previa de Docker de forma predeterminada, elimina contenedores E2E de OpenClaw obsoletos, imprime estado cada 30 segundos, almacena los tiempos de carriles correctos en `.artifacts/docker-tests/lane-timings.json` y usa esos tiempos para iniciar primero los carriles más largos en ejecuciones posteriores. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir el manifiesto ponderado de carriles sin compilar ni ejecutar Docker, o `node scripts/test-docker-all.mjs --plan-json` para imprimir el plan de CI de los carriles seleccionados, necesidades de paquete/imagen y credenciales.
- `Package Acceptance` es la puerta nativa de GitHub para paquetes sobre "¿este tarball instalable funciona como producto?". Resuelve un paquete candidato desde `source=npm`, `source=ref`, `source=url` o `source=artifact`, lo sube como `package-under-test` y luego ejecuta los carriles Docker E2E reutilizables contra ese tarball exacto en lugar de reempaquetar la ref seleccionada. Los perfiles están ordenados por amplitud: `smoke`, `package`, `product` y `full`. Consulta [Probar actualizaciones y plugins](/es/help/testing-updates-plugins) para el contrato de paquete/actualización/plugin, la matriz de supervivencia de actualización publicada, los valores predeterminados de release y la clasificación de fallos.
- Las comprobaciones de compilación y release ejecutan `scripts/check-cli-bootstrap-imports.mjs` después de tsdown. La guarda recorre el grafo compilado estático desde `dist/entry.js` y `dist/cli/run-main.js` y falla si el arranque previo al dispatch importa dependencias de paquete como Commander, interfaz de prompt, undici o logging antes del dispatch del comando; también mantiene el fragmento de ejecución del Gateway incluido bajo presupuesto y rechaza importaciones estáticas de rutas frías conocidas del Gateway. El smoke de CLI empaquetada también cubre la ayuda raíz, la ayuda de onboarding, la ayuda de doctor, estado, esquema de configuración y un comando de lista de modelos.
- La compatibilidad heredada de Package Acceptance está limitada a `2026.4.25` (`2026.4.25-beta.*` incluido). Hasta ese corte, el harness tolera solo brechas de metadatos de paquetes publicados: entradas omitidas del inventario privado de QA, falta de `gateway install --wrapper`, archivos de parche faltantes en el fixture git derivado del tarball, falta de `update.channel` persistido, ubicaciones heredadas de registros de instalación de plugins, falta de persistencia del registro de instalación del marketplace y migración de metadatos de configuración durante `plugins update`. Para paquetes posteriores a `2026.4.25`, esas rutas son fallos estrictos.
- Runners de smoke de contenedores: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` y `test:docker:config-reload` arrancan uno o más contenedores reales y verifican rutas de integración de nivel superior.

Los runners Docker de modelos live también montan mediante bind solo los homes de autenticación de CLI necesarios (o todos los compatibles cuando la ejecución no está acotada) y luego los copian al home del contenedor antes de la ejecución para que el OAuth de CLI externa pueda renovar tokens sin modificar el almacén de autenticación del host:

- Modelos directos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Prueba de humo de enlace ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; cubre Claude, Codex y Gemini de forma predeterminada, con cobertura estricta de Droid/OpenCode mediante `pnpm test:docker:live-acp-bind:droid` y `pnpm test:docker:live-acp-bind:opencode`)
- Prueba de humo del backend de CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Prueba de humo del harness de servidor de aplicación de Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desarrollo: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Prueba de humo de observabilidad: `pnpm qa:otel:smoke` es una ruta privada de QA con checkout del código fuente. Intencionalmente no forma parte de las rutas de versión Docker del paquete porque el tarball de npm omite QA Lab.
- Prueba de humo en vivo de Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Asistente de incorporación (TTY, andamiaje completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Prueba de humo de incorporación/canal/agente del tarball de npm: `pnpm test:docker:npm-onboard-channel-agent` instala globalmente el tarball empaquetado de OpenClaw en Docker, configura OpenAI mediante incorporación con referencia de env más Telegram de forma predeterminada, ejecuta doctor y ejecuta un turno de agente OpenAI simulado. Reutiliza un tarball precompilado con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la reconstrucción del host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` o cambia de canal con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` o `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Prueba de humo de instalación de Skills: `pnpm test:docker:skill-install` instala globalmente el tarball empaquetado de OpenClaw en Docker, desactiva las instalaciones de archivos subidos en la configuración, resuelve el slug actual de la Skill en vivo de ClawHub desde la búsqueda, la instala con `openclaw skills install` y verifica la Skill instalada más los metadatos de origen/bloqueo de `.clawhub`.
- Prueba de humo de cambio de canal de actualización: `pnpm test:docker:update-channel-switch` instala globalmente el tarball empaquetado de OpenClaw en Docker, cambia de paquete `stable` a git `dev`, verifica que el canal persistente y el trabajo posterior a la actualización del Plugin funcionen, luego vuelve al paquete `stable` y comprueba el estado de actualización.
- Prueba de humo de supervivencia de actualización: `pnpm test:docker:upgrade-survivor` instala el tarball empaquetado de OpenClaw sobre un fixture sucio de usuario antiguo con agentes, configuración de canal, allowlists de Plugin, estado obsoleto de dependencias de Plugin y archivos existentes de espacio de trabajo/sesión. Ejecuta la actualización del paquete más doctor no interactivo sin claves de proveedor ni canal en vivo, luego inicia un Gateway de local loopback y comprueba la preservación de configuración/estado más los presupuestos de inicio/estado.
- Prueba de humo de supervivencia de actualización publicada: `pnpm test:docker:published-upgrade-survivor` instala `openclaw@latest` de forma predeterminada, inicializa archivos realistas de usuario existente, configura esa línea base con una receta de comandos integrada, valida la configuración resultante, actualiza esa instalación publicada al tarball candidato, ejecuta doctor no interactivo, escribe `.artifacts/upgrade-survivor/summary.json`, luego inicia un Gateway de local loopback y comprueba intents configurados, preservación de estado, inicio, `/healthz`, `/readyz` y presupuestos de estado RPC. Sobrescribe una línea base con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, pide al planificador agregado expandir líneas base locales exactas con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` como `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, y expande fixtures con forma de incidencia con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` como `reported-issues`; el conjunto `reported-issues` incluye `configured-plugin-installs` para reparar automáticamente instalaciones externas de Plugin de OpenClaw. Package Acceptance expone esos valores como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` y `published_upgrade_survivor_scenarios`, resuelve tokens de metabase como `last-stable-4` o `all-since-2026.4.23`, y Full Release Validation expande la puerta de paquete de soak de versión a `last-stable-4 2026.4.23 2026.5.2 2026.4.15` más `reported-issues`.
- Prueba de humo de contexto de runtime de sesión: `pnpm test:docker:session-runtime-context` verifica la persistencia oculta de transcripción de contexto de runtime más la reparación por doctor de ramas duplicadas afectadas de reescritura de prompts.
- Prueba de humo de instalación global con Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empaqueta el árbol actual, lo instala con `bun install -g` en un home aislado y verifica que `openclaw infer image providers --json` devuelva proveedores de imagen incluidos en lugar de quedarse colgado. Reutiliza un tarball precompilado con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la compilación del host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` o copia `dist/` desde una imagen Docker compilada con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Prueba de humo Docker del instalador: `bash scripts/test-install-sh-docker.sh` comparte una caché de npm entre sus contenedores de root, actualización y npm directo. La prueba de humo de actualización usa de forma predeterminada npm `latest` como línea base estable antes de actualizar al tarball candidato. Sobrescribe con `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localmente, o con la entrada `update_baseline_version` del workflow Install Smoke en GitHub. Las comprobaciones de instalador no root mantienen una caché de npm aislada para que las entradas de caché propiedad de root no enmascaren el comportamiento de instalación local del usuario. Define `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar la caché de root/actualización/npm directo en nuevas ejecuciones locales.
- Install Smoke CI omite la actualización global duplicada de npm directo con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; ejecuta el script localmente sin esa env cuando se necesite cobertura directa de `npm install -g`.
- Prueba de humo de CLI para eliminación de espacio de trabajo compartido de agentes: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila la imagen Dockerfile raíz de forma predeterminada, inicializa dos agentes con un espacio de trabajo en un home de contenedor aislado, ejecuta `agents delete --json` y verifica JSON válido más el comportamiento de espacio de trabajo conservado. Reutiliza la imagen install-smoke con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Redes de Gateway (dos contenedores, autenticación WS + salud): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Prueba de humo de instantánea CDP del navegador: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila la imagen E2E de origen más una capa de Chromium, inicia Chromium con CDP sin procesar, ejecuta `browser doctor --deep` y verifica que las instantáneas de rol CDP cubran URL de enlaces, clicables promovidos por cursor, refs de iframe y metadatos de frame.
- Regresión de razonamiento mínimo de OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) ejecuta un servidor OpenAI simulado a través de Gateway, verifica que `web_search` eleve `reasoning.effort` de `minimal` a `low`, luego fuerza el rechazo del esquema del proveedor y comprueba que el detalle sin procesar aparezca en los registros de Gateway.
- Puente de canal MCP (Gateway inicializado + puente stdio + prueba de humo de frame de notificación sin procesar de Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Herramientas MCP del bundle de Pi (servidor MCP stdio real + prueba de humo allow/deny del perfil Pi embebido): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Limpieza MCP de Cron/subagente (Gateway real + teardown de hijo MCP stdio después de ejecuciones cron aisladas y subagente one-shot): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (prueba de humo de instalación/actualización para ruta local, `file:`, registro npm con dependencias hoisted, refs móviles de git, kitchen-sink de ClawHub, actualizaciones de marketplace y activación/inspección del bundle de Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Define `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para omitir el bloque de ClawHub, o sobrescribe el par predeterminado paquete/runtime kitchen-sink con `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` y `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sin `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, la prueba usa un servidor fixture local hermético de ClawHub.
- Prueba de humo de actualización sin cambios de Plugin: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Prueba de humo de matriz de ciclo de vida de Plugin: `pnpm test:docker:plugin-lifecycle-matrix` instala el tarball empaquetado de OpenClaw en un contenedor vacío, instala un Plugin de npm, alterna activar/desactivar, lo actualiza y degrada mediante un registro npm local, elimina el código instalado y luego verifica que la desinstalación aún elimine estado obsoleto mientras registra métricas de RSS/CPU para cada fase del ciclo de vida.
- Prueba de humo de metadatos de recarga de configuración: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` cubre la prueba de humo de instalación/actualización para ruta local, `file:`, registro npm con dependencias hoisted, refs móviles de git, fixtures de ClawHub, actualizaciones de marketplace y activación/inspección del bundle de Claude. `pnpm test:docker:plugin-update` cubre el comportamiento de actualización sin cambios para Plugins instalados. `pnpm test:docker:plugin-lifecycle-matrix` cubre instalación, activación, desactivación, actualización, degradación y desinstalación con código faltante de Plugin de npm con seguimiento de recursos.

Para precompilar y reutilizar manualmente la imagen funcional compartida:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Las sobrescrituras de imagen específicas de suite como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` siguen teniendo prioridad cuando se definen. Cuando `OPENCLAW_SKIP_DOCKER_BUILD=1` apunta a una imagen remota compartida, los scripts la descargan si aún no está local. Las pruebas Docker de QR e instalador mantienen sus propios Dockerfiles porque validan el comportamiento de paquete/instalación en lugar del runtime de aplicación compilada compartido.

Los ejecutores Docker de modelos en vivo también montan con bind el checkout actual en modo de solo lectura y
lo preparan en un directorio de trabajo temporal dentro del contenedor. Esto mantiene la imagen de runtime
ligera sin dejar de ejecutar Vitest contra tu fuente/configuración local exacta.
El paso de preparación omite cachés locales grandes y salidas de compilación de apps, como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, y directorios de salida `.build` locales de app o
Gradle, para que las ejecuciones en vivo de Docker no pasen minutos copiando
artefactos específicos de la máquina.
También establecen `OPENCLAW_SKIP_CHANNELS=1` para que las sondas en vivo del Gateway no inicien
workers de canales reales de Telegram/Discord/etc. dentro del contenedor.
`test:docker:live-models` todavía ejecuta `pnpm test:live`, así que pasa también
`OPENCLAW_LIVE_GATEWAY_*` cuando necesites acotar o excluir la cobertura en vivo del Gateway
de ese carril Docker.
`test:docker:openwebui` es un smoke de compatibilidad de nivel superior: inicia un
contenedor del Gateway de OpenClaw con los endpoints HTTP compatibles con OpenAI habilitados,
inicia un contenedor fijado de Open WebUI contra ese Gateway, inicia sesión mediante
Open WebUI, verifica que `/api/models` exponga `openclaw/default` y luego envía una
solicitud de chat real mediante el proxy `/api/chat/completions` de Open WebUI.
Establece `OPENWEBUI_SMOKE_MODE=models` para comprobaciones de CI de la ruta de release que deben detenerse
después del inicio de sesión en Open WebUI y el descubrimiento de modelos, sin esperar una finalización de modelo
en vivo.
La primera ejecución puede ser notablemente más lenta porque Docker puede necesitar descargar la
imagen de Open WebUI y Open WebUI puede necesitar terminar su propia configuración de arranque en frío.
Este carril espera una clave de modelo en vivo utilizable, y `OPENCLAW_PROFILE_FILE`
(`~/.profile` por defecto) es la forma principal de proporcionarla en ejecuciones dockerizadas.
Las ejecuciones correctas imprimen una pequeña carga JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` es intencionalmente determinista y no necesita una
cuenta real de Telegram, Discord ni iMessage. Arranca un contenedor de Gateway
sembrado, inicia un segundo contenedor que lanza `openclaw mcp serve` y luego
verifica el descubrimiento de conversaciones enrutadas, lecturas de transcripciones, metadatos de adjuntos,
comportamiento de la cola de eventos en vivo, enrutamiento de envíos salientes y notificaciones de canal +
permisos estilo Claude sobre el puente MCP stdio real. La comprobación de notificaciones
inspecciona directamente los frames MCP stdio sin procesar para que el smoke valide lo que el
puente emite realmente, no solo lo que un SDK de cliente específico expone.
`test:docker:pi-bundle-mcp-tools` es determinista y no necesita una clave de modelo
en vivo. Compila la imagen Docker del repo, inicia un servidor de sonda MCP stdio real
dentro del contenedor, materializa ese servidor mediante el runtime MCP del paquete Pi
embebido, ejecuta la herramienta y luego verifica que `coding` y `messaging` conserven
herramientas `bundle-mcp`, mientras que `minimal` y `tools.deny: ["bundle-mcp"]` las filtran.
`test:docker:cron-mcp-cleanup` es determinista y no necesita una clave de modelo en vivo.
Inicia un Gateway sembrado con un servidor de sonda MCP stdio real, ejecuta un
turno de Cron aislado y un turno hijo de una sola ejecución con `/subagents spawn`, y luego verifica
que el proceso hijo MCP salga después de cada ejecución.

Smoke manual de hilo ACP en lenguaje natural (no CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conserva este script para flujos de regresión/depuración. Puede volver a ser necesario para la validación del enrutamiento de hilos ACP, así que no lo elimines.

Variables de entorno útiles:

- `OPENCLAW_CONFIG_DIR=...` (predeterminado: `~/.openclaw`) montado en `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predeterminado: `~/.openclaw/workspace`) montado en `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predeterminado: `~/.profile`) montado en `/home/node/.profile` y cargado antes de ejecutar pruebas
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar solo variables de entorno cargadas desde `OPENCLAW_PROFILE_FILE`, usando directorios temporales de configuración/espacio de trabajo y sin montajes externos de auth de CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predeterminado: `~/.cache/openclaw/docker-cli-tools`) montado en `/home/node/.npm-global` para instalaciones de CLI en caché dentro de Docker
- Los directorios/archivos de auth de CLI externa bajo `$HOME` se montan en modo de solo lectura bajo `/host-auth...` y luego se copian en `/home/node/...` antes de que comiencen las pruebas
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
- `OPENWEBUI_IMAGE=...` para sobrescribir la etiqueta fijada de imagen de Open WebUI

## Sanidad de docs

Ejecuta comprobaciones de docs después de editar documentación: `pnpm check:docs`.
Ejecuta la validación completa de anchors de Mintlify cuando también necesites comprobaciones de encabezados dentro de la página: `pnpm docs:check-links:anchors`.

## Regresión sin conexión (segura para CI)

Estas son regresiones de "pipeline real" sin proveedores reales:

- Llamadas a herramientas del Gateway (OpenAI simulado, gateway real + bucle de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Asistente del Gateway (WS `wizard.start`/`wizard.next`, escribe configuración + auth aplicada): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evaluaciones de fiabilidad de agentes (Skills)

Ya tenemos algunas pruebas seguras para CI que se comportan como "evaluaciones de fiabilidad de agentes":

- Llamadas a herramientas simuladas mediante el Gateway real + bucle de agente (`src/gateway/gateway.test.ts`).
- Flujos de asistente de extremo a extremo que validan el cableado de sesión y los efectos de configuración (`src/gateway/gateway.test.ts`).

Lo que todavía falta para Skills (consulta [Skills](/es/tools/skills)):

- **Toma de decisiones:** cuando las Skills se enumeran en el prompt, ¿el agente elige la Skill correcta (o evita las irrelevantes)?
- **Cumplimiento:** ¿el agente lee `SKILL.md` antes de usarla y sigue los pasos/args requeridos?
- **Contratos de flujo de trabajo:** escenarios de varios turnos que afirman el orden de herramientas, el traspaso del historial de sesión y los límites del sandbox.

Las evaluaciones futuras deben seguir siendo deterministas primero:

- Un ejecutor de escenarios que use proveedores simulados para afirmar llamadas a herramientas + orden, lecturas de archivos de Skills y cableado de sesión.
- Una pequeña suite de escenarios centrados en Skills (usar frente a evitar, gating, inyección de prompt).
- Evaluaciones en vivo opcionales (opt-in, protegidas por entorno) solo después de que la suite segura para CI esté implementada.

## Pruebas de contrato (forma de plugin y canal)

Las pruebas de contrato verifican que cada plugin y canal registrado cumpla su
contrato de interfaz. Iteran sobre todos los plugins descubiertos y ejecutan una suite de
aserciones de forma y comportamiento. El carril unitario predeterminado `pnpm test`
omite intencionalmente estos archivos compartidos de seam y smoke; ejecuta explícitamente
los comandos de contrato cuando toques superficies compartidas de canal o proveedor.

### Comandos

- Todos los contratos: `pnpm test:contracts`
- Solo contratos de canal: `pnpm test:contracts:channels`
- Solo contratos de proveedor: `pnpm test:contracts:plugins`

### Contratos de canal

Ubicados en `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma básica del plugin (id, nombre, capacidades)
- **setup** - Contrato del asistente de configuración
- **session-binding** - Comportamiento de vinculación de sesión
- **outbound-payload** - Estructura de carga de mensaje
- **inbound** - Manejo de mensajes entrantes
- **actions** - Handlers de acciones de canal
- **threading** - Manejo de ID de hilo
- **directory** - API de directorio/lista
- **group-policy** - Aplicación de política de grupo

### Contratos de estado de proveedor

Ubicados en `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondas de estado de canal
- **registry** - Forma del registro de plugins

### Contratos de proveedor

Ubicados en `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato del flujo de auth
- **auth-choice** - Elección/selección de auth
- **catalog** - API de catálogo de modelos
- **discovery** - Descubrimiento de plugins
- **loader** - Carga de plugins
- **runtime** - Runtime del proveedor
- **shape** - Forma/interfaz del plugin
- **wizard** - Asistente de configuración

### Cuándo ejecutar

- Después de cambiar exportaciones o subrutas de plugin-sdk
- Después de agregar o modificar un canal o plugin de proveedor
- Después de refactorizar el registro o descubrimiento de plugins

Las pruebas de contrato se ejecutan en CI y no requieren claves API reales.

## Agregar regresiones (guía)

Cuando corrijas un problema de proveedor/modelo descubierto en vivo:

- Agrega una regresión segura para CI si es posible (proveedor mock/stub, o captura la transformación exacta de la forma de solicitud)
- Si es inherentemente solo en vivo (límites de tasa, políticas de auth), mantén la prueba en vivo acotada y opt-in mediante variables de entorno
- Prefiere apuntar a la capa más pequeña que detecte el bug:
  - bug de conversión/replay de solicitud de proveedor → prueba directa de modelos
  - bug de sesión/historial/pipeline de herramientas del Gateway → smoke en vivo del Gateway o prueba mock del Gateway segura para CI
- Barrera de protección de recorrido de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un destino muestreado por clase de SecretRef a partir de metadatos del registro (`listSecretTargetRegistryEntries()`) y luego afirma que se rechazan los ids de exec con segmento de recorrido.
  - Si agregas una nueva familia de destinos SecretRef `includeInPlan` en `src/secrets/target-registry-data.ts`, actualiza `classifyTargetClass` en esa prueba. La prueba falla intencionalmente con ids de destino sin clasificar para que las nuevas clases no puedan omitirse silenciosamente.

## Relacionado

- [Probar en vivo](/es/help/testing-live)
- [Probar actualizaciones y plugins](/es/help/testing-updates-plugins)
- [CI](/es/ci)
