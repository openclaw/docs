---
read_when:
    - Ejecutar pruebas localmente o en CI
    - Agregar pruebas de regresión para errores de modelo/proveedor
    - Depuración del comportamiento del Gateway y del agente
summary: 'Kit de pruebas: suites unitarias/e2e/en vivo, runners de Docker y lo que cubre cada prueba'
title: Pruebas
x-i18n:
    generated_at: "2026-07-06T21:50:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7ecac8598f07ecc41f150e0112d6e9d5eb9941494dd66df308dc1ec0a5fc364a
    source_path: help/testing.md
    workflow: 16
---

OpenClaw tiene tres suites de Vitest (unitarias/integración, e2e, live) más ejecutores Docker. Esta página cubre qué abarca cada suite, qué comando ejecutar para un flujo de trabajo determinado, cómo las pruebas live descubren credenciales y cómo agregar regresiones para bugs reales de proveedores/modelos.

<Note>
**La pila de QA (qa-lab, qa-channel, carriles de transporte live)** se documenta por separado:

- [Resumen de QA](/es/concepts/qa-e2e-automation) - arquitectura, superficie de comandos, creación de escenarios.
- [QA de matriz](/es/concepts/qa-matrix) - referencia para `pnpm openclaw qa matrix`.
- [Cuadro de mando de madurez](/es/maturity/scorecard) - cómo la evidencia de QA de release respalda decisiones de estabilidad y LTS.
- [Canal QA](/es/channels/qa-channel) - el plugin de transporte sintético usado por escenarios respaldados por el repositorio.

Esta página cubre las suites de prueba regulares y los ejecutores Docker/Parallels. [Ejecutores específicos de QA](#qa-specific-runners) más abajo enumera las invocaciones `qa` concretas y vuelve a remitir a las referencias anteriores.
</Note>

## Inicio rápido

La mayoría de los días:

- Puerta completa (esperada antes de push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Ejecución local más rápida de la suite completa en una máquina holgada: `pnpm test:max`
- Bucle directo de observación de Vitest: `pnpm test:watch`
- El apuntado directo a archivos también enruta rutas de plugins/canales: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefiere ejecuciones dirigidas primero al iterar sobre un único fallo.
- Sitio de QA respaldado por Docker: `pnpm qa:lab:up`
- Carril de QA respaldado por VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Cuando toques pruebas o quieras confianza adicional:

- Puerta de cobertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

## Directorios temporales de prueba

Usa los helpers compartidos en `test/helpers/temp-dir.ts` para directorios temporales propiedad de las pruebas, de modo que la propiedad sea explícita y la limpieza permanezca en el ciclo de vida de la prueba:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` no expone intencionalmente ningún método de limpieza manual: Vitest posee la limpieza después de cada prueba. Los helpers antiguos de menor nivel (`makeTempDir`, `cleanupTempDirs`, `createTempDirTracker`) aún existen para pruebas que no han migrado; evita nuevos usos de ellos y evita nuevas llamadas desnudas a `fs.mkdtemp*`, salvo que una prueba esté verificando explícitamente el comportamiento bruto de temp-dir. Cuando se necesite genuinamente un directorio temporal desnudo, agrega un comentario de permiso auditable con un motivo:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` informa nuevas creaciones desnudas de temp-dir y nuevo uso manual de helpers compartidos en líneas agregadas del diff, sin bloquear estilos de limpieza existentes. Sigue la misma clasificación de rutas de prueba que `scripts/changed-lanes.mjs` y omite la propia implementación del helper compartido. `check:changed` ejecuta este informe para rutas de prueba cambiadas como una señal de CI solo de advertencia (anotaciones de advertencia de GitHub, no fallos).

## Flujos de trabajo live y Docker/Parallels

Al depurar proveedores/modelos reales (requiere credenciales reales):

- Suite live (modelos + sondeos de herramienta/imagen de Gateway): `pnpm test:live`
- Apuntar silenciosamente a un archivo live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Informes de rendimiento en runtime: despacha `OpenClaw Performance` con `live_openai_candidate=true` para un turno real de agente `openai/gpt-5.5` o `deep_profile=true` para artefactos de CPU/heap/traza de Kova. Las ejecuciones programadas diarias publican artefactos de carril de mock-provider, deep-profile y GPT 5.5 en `openclaw/clawgrit-reports` cuando `CLAWGRIT_REPORTS_TOKEN` está configurado. El informe de mock-provider también incluye números a nivel de fuente de arranque de gateway, memoria, presión de plugins, bucle hello repetido de modelo falso e inicio de CLI.
- Barrido de modelos live con Docker: `pnpm test:docker:live-models`
  - Cada modelo seleccionado ejecuta un turno de texto más un pequeño sondeo de estilo lectura de archivo. Los modelos cuyos metadatos anuncian entrada `image` también ejecutan un pequeño turno de imagen. Deshabilita los sondeos adicionales con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` u `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` al aislar fallos de proveedor.
  - Cobertura de CI: tanto `OpenClaw Scheduled Live And E2E Checks` diario como `OpenClaw Release Checks` manual llaman al flujo de trabajo live/E2E reutilizable con `include_live_suites: true`, que incluye trabajos de matriz de modelos live en Docker fragmentados por proveedor.
  - Para reejecuciones enfocadas de CI, despacha `OpenClaw Live And E2E Checks (Reusable)` con `include_live_suites: true` y `live_models_only: true`.
  - Agrega nuevos secretos de proveedor de alta señal a `scripts/ci-hydrate-live-auth.sh` más `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` y sus llamadores programados/de release.
- Smoke nativo de chat enlazado de Codex: `pnpm test:docker:live-codex-bind`
  - Ejecuta un carril live de Docker contra la ruta de app-server de Codex, enlaza un DM sintético de Slack con `/codex bind`, ejercita `/codex fast` y `/codex permissions`, luego verifica una respuesta simple y una ruta de adjunto de imagen a través del enlace de plugin nativo en lugar de ACP.
- Smoke del harness de app-server de Codex: `pnpm test:docker:live-codex-harness`
  - Ejecuta turnos de agente de gateway a través del harness de app-server de Codex propiedad del plugin, verifica `/codex status` y `/codex models`, y por defecto ejercita sondeos de imagen, cron MCP, sub-agente y Guardian. Deshabilita el sondeo de sub-agente con `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` al aislar otros fallos. Para una comprobación enfocada de sub-agente, deshabilita los otros sondeos:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Esto sale después del sondeo de sub-agente salvo que `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` esté establecido.
- Smoke de instalación bajo demanda de Codex: `pnpm test:docker:codex-on-demand`
  - Instala el tarball empaquetado de OpenClaw en Docker, ejecuta el onboarding con clave de API de OpenAI y verifica que el plugin de Codex más la dependencia `@openai/codex` se descargaron bajo demanda en la raíz del proyecto npm gestionado.
- Smoke de dependencia de herramienta de plugin live: `pnpm test:docker:live-plugin-tool`
  - Empaqueta un plugin fixture con una dependencia real `slugify`, lo instala mediante `npm-pack:`, verifica la dependencia bajo la raíz del proyecto npm gestionado, luego pide a un modelo live de OpenAI que llame a la herramienta del plugin y devuelva el slug oculto.
- Smoke del comando de rescate de Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Comprobación opcional de cinturón y tirantes para la superficie del comando de rescate del canal de mensajes. Ejercita `/crestodian status`, encola un cambio persistente de modelo, responde `/crestodian yes` y verifica la ruta de escritura de auditoría/configuración.
- Smoke Docker del planificador de Crestodian: `pnpm test:docker:crestodian-planner`
  - Ejecuta Crestodian en un contenedor sin configuración con una CLI falsa de Claude en `PATH` y verifica que el fallback del planificador difuso se traduzca en una escritura de configuración tipada auditada.
- Smoke Docker de primera ejecución de Crestodian: `pnpm test:docker:crestodian-first-run`
  - Parte de un directorio de estado de OpenClaw vacío, verifica el entrypoint moderno de onboard de Crestodian, aplica escrituras de setup/modelo/agente/plugin de Discord + SecretRef, valida la configuración y verifica entradas de auditoría. La misma ruta de setup Ring 0 también está cubierta en QA Lab por `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de costo de Moonshot/Kimi: con `MOONSHOT_API_KEY` establecido, ejecuta `openclaw models list --provider moonshot --json`, luego ejecuta un `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json` aislado contra `moonshot/kimi-k2.6`. Verifica que el JSON informe Moonshot/K2.6 y que la transcripción del asistente almacene `usage.cost` normalizado.

<Tip>
Cuando solo necesites un caso fallido, prefiere acotar las pruebas live mediante las variables de entorno de allowlist descritas abajo.
</Tip>

## Ejecutores específicos de QA

Estos comandos se ubican junto a las suites de prueba principales cuando necesitas realismo de QA-lab.

CI ejecuta QA Lab en flujos de trabajo dedicados. La paridad agéntica está anidada bajo `QA-Lab - All Lanes` y la validación de release, no como un flujo de trabajo de PR independiente. La validación amplia debe usar `Full Release Validation` con `rerun_group=qa-parity` o el grupo de QA de release-checks. Las comprobaciones de release estables/predeterminadas mantienen el soak live/Docker exhaustivo detrás de `run_release_soak=true`; el perfil `full` fuerza el soak. `QA-Lab - All Lanes` se ejecuta por la noche en `main` y desde despacho manual con el carril de paridad mock, el carril live de Matrix, el carril live de Telegram gestionado por Convex y el carril live de Discord gestionado por Convex como trabajos paralelos. QA programado y release checks pasan Matrix `--profile fast` explícitamente, mientras que el valor predeterminado de la CLI de Matrix y la entrada del flujo manual permanece en `all`; el despacho manual puede fragmentar `all` en trabajos `transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`. `OpenClaw Release Checks` ejecuta paridad más los carriles rápidos de Matrix y Telegram antes de la aprobación de release, usando `mock-openai/gpt-5.5` para comprobaciones de transporte de release, de modo que permanezcan deterministas y eviten el inicio normal de proveedor-plugin. Estos gateways de transporte live deshabilitan la búsqueda de memoria; el comportamiento de memoria sigue cubierto por las suites de paridad de QA.

Los shards de medios live de release completa usan `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, que ya tiene `ffmpeg` y `ffprobe`. Los shards de modelos/backends live de Docker usan la imagen compartida `ghcr.io/openclaw/openclaw-live-test:<sha>` construida una vez por commit seleccionado, y luego la extraen con `OPENCLAW_SKIP_DOCKER_BUILD=1` en lugar de reconstruir dentro de cada shard.

- `pnpm openclaw qa suite`
  - Ejecuta escenarios de QA respaldados por el repositorio directamente en el host.
  - Escribe artefactos de nivel superior `qa-evidence.json`, `qa-suite-summary.json` y
    `qa-suite-report.md` para el conjunto de escenarios seleccionado, incluidas
    selecciones de escenarios de flujo mixto, Vitest y Playwright.
  - Cuando lo despacha `pnpm openclaw qa run --qa-profile <profile>`, incrusta
    el scorecard del perfil de taxonomía seleccionado en el mismo `qa-evidence.json`.
    `smoke-ci` escribe evidencia reducida (`evidenceMode: "slim"`, sin
    `execution` por entrada). `release` cubre el segmento seleccionado de preparación
    para lanzamiento; `all` selecciona todas las categorías de madurez activas y
    apunta a despachos explícitos del workflow QA Profile Evidence cuando se necesita
    un artefacto de scorecard completo.
  - Ejecuta varios escenarios seleccionados en paralelo de forma predeterminada con
    workers de gateway aislados. `qa-channel` usa concurrencia 4 de forma predeterminada
    (limitada por el número de escenarios seleccionado). Usa `--concurrency <count>` para ajustar
    el número de workers, o `--concurrency 1` para la vía serial anterior.
  - Sale con código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` para
    artefactos sin un código de salida fallido.
  - Admite los modos de proveedor `live-frontier`, `mock-openai` y `aimock`.
    `aimock` inicia un servidor proveedor local respaldado por AIMock para cobertura
    experimental de fixtures y mocks de protocolo sin reemplazar la vía `mock-openai`
    consciente de escenarios.
- `pnpm openclaw qa coverage --match <query>`
  - Busca en IDs de escenarios, títulos, superficies, IDs de cobertura, referencias de docs, referencias
    de código, plugins y requisitos de proveedores, y luego imprime objetivos de suite
    coincidentes.
  - Usa esto antes de una ejecución de QA Lab cuando conoces el comportamiento tocado o la ruta
    del archivo, pero no el escenario más pequeño. Solo es orientativo: aun así elige prueba mock,
    live, Multipass, Matrix o de transporte según el comportamiento que se está
    cambiando.
- `pnpm test:plugins:kitchen-sink-live`
  - Ejecuta la batería live del plugin OpenAI Kitchen Sink mediante QA Lab.
    Instala el paquete externo Kitchen Sink, verifica el inventario de superficie
    del SDK de plugins, prueba `/healthz` y `/readyz`, registra evidencia de
    CPU/RSS del Gateway, ejecuta un turno live de OpenAI y comprueba diagnósticos
    adversariales. Requiere autenticación live de OpenAI como `OPENAI_API_KEY`. En
    sesiones Testbox hidratadas, carga automáticamente el perfil live-auth de Testbox
    cuando el helper `openclaw-testbox-env` está presente.
- `pnpm test:gateway:cpu-scenarios`
  - Ejecuta el bench de arranque del Gateway más un pequeño paquete de escenarios mock de QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) y escribe un resumen combinado de observaciones de CPU
    en `.artifacts/gateway-cpu-scenarios/`.
  - Marca solo observaciones sostenidas de CPU alta de forma predeterminada (`--cpu-core-warn`,
    valor predeterminado `0.9`; `--hot-wall-warn-ms`, valor predeterminado `30000`), por lo que los picos breves
    de arranque se registran como métricas sin parecerse a la regresión del Gateway
    fijado durante minutos.
  - Se ejecuta contra artefactos `dist` compilados; ejecuta primero una compilación cuando el checkout
    aún no tenga salida de runtime reciente.
- `pnpm openclaw qa suite --runner multipass`
  - Ejecuta la misma suite de QA dentro de una VM Linux desechable de Multipass, manteniendo
    las mismas flags de selección de escenarios y proveedor/modelo que `qa suite`.
  - Las ejecuciones live reenvían las entradas de autenticación de QA prácticas para el invitado:
    claves de proveedores basadas en env, la ruta de configuración del proveedor live de QA y
    `CODEX_HOME` cuando está presente.
  - Los directorios de salida deben permanecer bajo la raíz del repositorio para que el invitado pueda escribir
    de vuelta mediante el workspace montado.
  - Escribe el reporte y resumen normales de QA más logs de Multipass en
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia el sitio de QA respaldado por Docker para trabajo de QA estilo operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Compila un tarball npm desde el checkout actual, lo instala globalmente en
    Docker, ejecuta onboarding no interactivo con clave de API de OpenAI, configura
    Telegram de forma predeterminada, verifica que el runtime del plugin empaquetado cargue sin
    reparación de dependencias al iniciar, ejecuta doctor y ejecuta un turno de agente local
    contra un endpoint OpenAI simulado.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para ejecutar la misma vía de instalación empaquetada
    con Discord.
- `pnpm test:docker:session-runtime-context`
  - Ejecuta un smoke determinista de app compilada en Docker para transcripciones de contexto de runtime
    incrustado. Verifica que el contexto de runtime oculto de OpenClaw persista como un
    mensaje personalizado no visible en lugar de filtrarse al turno visible del usuario,
    luego siembra un JSONL de sesión roto afectado y verifica que
    `openclaw doctor --fix` lo reescriba a la rama activa con una copia de seguridad.
- `pnpm test:docker:npm-telegram-live`
  - Instala un candidato de paquete OpenClaw en Docker, ejecuta onboarding del paquete instalado,
    configura Telegram mediante la CLI instalada y luego reutiliza la vía live de QA de Telegram
    con ese paquete instalado como Gateway SUT.
  - El wrapper monta solo el código fuente del harness `qa-lab` desde el checkout;
    el paquete instalado posee `dist`, `openclaw/plugin-sdk` y el runtime de
    plugins incluidos, por lo que la vía no mezcla plugins del checkout actual en
    el paquete bajo prueba.
  - El valor predeterminado es `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; define
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` o
    `OPENCLAW_CURRENT_PACKAGE_TGZ` para probar un tarball local resuelto en lugar
    de instalar desde el registro.
  - Emite temporización RTT repetida en `qa-evidence.json` de forma predeterminada con
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Sobrescribe
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` o
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` para ajustar la ejecución.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` acepta una lista separada por comas de
    IDs de comprobación de QA de Telegram para muestrear; cuando no está definido, la comprobación
    predeterminada compatible con RTT es `telegram-mentioned-message-reply`.
  - Usa las mismas credenciales env de Telegram o fuente de credenciales Convex que
    `pnpm openclaw qa telegram`. Para automatización de CI/lanzamiento, define
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` más
    `OPENCLAW_QA_CONVEX_SITE_URL` y un secreto de rol. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` y un secreto de rol Convex están presentes en
    CI, el wrapper de Docker selecciona Convex automáticamente.
  - El wrapper valida env de credenciales de Telegram o Convex en el host
    antes del trabajo de build/install de Docker. Define
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` solo cuando
    depures deliberadamente la configuración previa a credenciales.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sobrescribe el
    `OPENCLAW_QA_CREDENTIAL_ROLE` compartido solo para esta vía. Cuando se seleccionan
    credenciales Convex y no se define ningún rol, el wrapper usa `ci` en CI
    y `maintainer` fuera de CI.
  - GitHub Actions expone esta vía como el workflow manual de mantenedores
    `NPM Telegram Beta E2E`. No se ejecuta en merge. El workflow usa el entorno
    `qa-live-shared` y leases de credenciales Convex CI.
- GitHub Actions también expone `Package Acceptance` para prueba de producto en ejecución lateral
  contra un paquete candidato. Acepta una referencia Git, especificación npm publicada,
  URL de tarball HTTPS más SHA-256, política de URL confiable o artefacto de tarball
  de otra ejecución (`source=ref|npm|url|trusted-url|artifact`), sube el
  `openclaw-current.tgz` normalizado como `package-under-test` y luego ejecuta el
  planificador Docker E2E existente con perfiles de vía `smoke`, `package`, `product`, `full`
  o `custom`. Define `telegram_mode=mock-openai` o
  `live-frontier` para ejecutar el workflow de QA de Telegram contra el mismo
  artefacto `package-under-test`.
  - Prueba de producto de la beta más reciente:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- La prueba con URL exacta de tarball requiere un digest y usa la política de seguridad de URL públicas:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Los espejos de tarball empresariales/privados usan una política explícita de fuente confiable:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` lee `.github/package-trusted-sources.json` desde la referencia confiable del workflow y no acepta credenciales de URL ni una omisión de red privada mediante entrada de workflow. Si la política nombrada declara autenticación bearer, configura el secreto fijo `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- La prueba con artefacto descarga un artefacto tarball de otra ejecución de Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Empaqueta e instala la build actual de OpenClaw en Docker, inicia el
    Gateway con OpenAI configurado y luego habilita canales/plugins incluidos mediante
    ediciones de configuración.
  - Verifica que el descubrimiento de configuración deje ausentes los plugins descargables
    no configurados, que la primera reparación configurada de doctor instale cada
    plugin descargable faltante explícitamente y que un segundo reinicio no ejecute
    reparación oculta de dependencias.
  - También instala una línea base npm anterior conocida, habilita Telegram antes
    de ejecutar `openclaw update --tag <candidate>` y verifica que el doctor
    posterior a la actualización del candidato limpie restos de dependencias de plugins heredados
    sin una reparación postinstall del lado del harness.
- `pnpm test:parallels:npm-update`
  - Ejecuta el smoke nativo de actualización de instalación empaquetada en invitados Parallels.
    Cada plataforma seleccionada primero instala el paquete de línea base solicitado,
    luego ejecuta el comando `openclaw update` instalado en el mismo invitado y
    verifica la versión instalada, el estado de actualización, la preparación del gateway y
    un turno de agente local.
  - Usa `--platform macos`, `--platform windows` o `--platform linux`
    mientras iteras en un invitado. Usa `--json` para la ruta del artefacto de resumen
    y el estado por vía.
  - La vía OpenAI usa `openai/gpt-5.5` para la prueba live de turno de agente de forma
    predeterminada. Pasa `--model <provider/model>` o define
    `OPENCLAW_PARALLELS_OPENAI_MODEL` para validar otro modelo OpenAI.
  - Envuelve ejecuciones locales largas en un timeout del host para que los bloqueos de transporte
    de Parallels no consuman el resto de la ventana de pruebas:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - El script escribe logs de vías anidadas en
    `/tmp/openclaw-parallels-npm-update.*`. Inspecciona `windows-update.log`,
    `macos-update.log` o `linux-update.log` antes de asumir que el wrapper externo
    está colgado.
  - La actualización de Windows puede tardar entre 10 y 15 minutos en doctor posterior a la actualización y
    trabajo de actualización de paquetes en un invitado frío; eso sigue siendo saludable cuando el
    log debug npm anidado avanza.
  - No ejecutes este wrapper agregado en paralelo con vías smoke individuales de Parallels
    macOS, Windows o Linux. Comparten estado de VM y pueden
    colisionar en la restauración de snapshots, el servicio de paquetes o el estado del gateway invitado.
  - La prueba posterior a la actualización ejecuta la superficie normal de plugins incluidos porque
    facades de capacidades como voz, generación de imágenes y comprensión de medios
    cargan mediante APIs de runtime incluidas aunque el turno del agente
    solo compruebe una respuesta de texto simple.

- `pnpm openclaw qa aimock`
  - Inicia solo el servidor proveedor local AIMock para pruebas de humo
    directas del protocolo.
- `pnpm openclaw qa matrix`
  - Ejecuta la vía de QA en vivo de Matrix contra un servidor doméstico Tuwunel
    desechable respaldado por Docker. Solo checkout de origen; las instalaciones
    empaquetadas no distribuyen `qa-lab`.
  - CLI completa, catálogo de perfiles/escenarios, variables de entorno y diseño de artefactos:
    [QA de Matrix](/es/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Ejecuta la vía de QA en vivo de Telegram contra un grupo privado real usando los
    tokens del bot controlador y del bot SUT desde el entorno.
  - Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. El id del grupo debe ser el id numérico
    del chat de Telegram.
  - Admite `--credential-source convex` para credenciales agrupadas compartidas.
    Usa el modo de entorno de forma predeterminada, o configura `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`
    para optar por concesiones agrupadas.
  - Los valores predeterminados cubren canary, control de menciones, direccionamiento de comandos, `/status`,
    respuestas mencionadas de bot a bot y respuestas de comandos nativos centrales.
    Los valores predeterminados de `mock-openai` también cubren regresiones deterministas de cadenas de respuesta y
    streaming del mensaje final de Telegram. Usa `--list-scenarios`
    para sondeos opcionales como `session_status`.
  - Sale con código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` para
    artefactos sin un código de salida fallido.
  - Requiere dos bots distintos en el mismo grupo privado, con el bot SUT
    exponiendo un nombre de usuario de Telegram.
  - Para una observación estable de bot a bot, habilita el modo de comunicación bot a bot
    en `@BotFather` para ambos bots y asegúrate de que el bot controlador pueda observar
    el tráfico de bots del grupo.
  - Escribe un informe de QA de Telegram, un resumen y `qa-evidence.json` en
    `.artifacts/qa-e2e/...`. Los escenarios con respuesta incluyen RTT desde la solicitud de envío
    del controlador hasta la respuesta SUT observada.

`Mantis Telegram Live` es el contenedor de evidencia de PR alrededor de esta vía. Ejecuta
la referencia candidata con credenciales de Telegram concedidas por Convex, renderiza el
paquete redactado de informe/evidencia de QA en un navegador de escritorio de Crabbox, graba evidencia MP4,
genera un GIF recortado por movimiento, sube el paquete de artefactos y
publica evidencia inline del PR mediante la aplicación de GitHub de Mantis cuando `pr_number` está
configurado. Los mantenedores pueden iniciarlo desde la UI de Actions mediante `Mantis Scenario`
(`scenario_id: telegram-live`) o directamente desde un comentario de pull request:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` es el contenedor agéntico nativo de Telegram Desktop
antes/después para prueba visual de PR. Inícialo desde la UI de Actions con
`instructions` de formato libre, mediante `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) o desde un comentario de PR:

```text
@openclaw-mantis telegram desktop proof
```

El agente Mantis lee el PR, decide qué comportamiento visible en Telegram prueba
el cambio, ejecuta la vía de prueba de Telegram Desktop con usuario real de Crabbox en
referencias base y candidatas, itera hasta que los GIF nativos sean útiles,
escribe un manifiesto `motionPreview` emparejado y publica la misma tabla GIF
de 2 columnas mediante la aplicación de GitHub de Mantis cuando `pr_number` está configurado.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Concede o reutiliza un escritorio Linux de Crabbox, instala Telegram
    Desktop nativo, configura OpenClaw con un token de bot SUT de Telegram concedido,
    inicia el Gateway y graba evidencia de captura de pantalla/MP4 desde el
    escritorio VNC visible.
  - Usa `--credential-source convex` de forma predeterminada para que los workflows solo necesiten el
    secreto del bróker de Convex. Usa `--credential-source env` con las mismas
    variables `OPENCLAW_QA_TELEGRAM_*` que `pnpm openclaw qa telegram`.
  - Telegram Desktop todavía necesita un inicio de sesión/perfil de usuario. El token de bot
    configura solo OpenClaw. Usa `--telegram-profile-archive-env <name>`
    para un archivo de perfil `.tgz` en base64, o usa `--keep-lease` e inicia sesión
    manualmente mediante VNC una vez.
  - Escribe `mantis-telegram-desktop-builder-report.md`,
    `mantis-telegram-desktop-builder-summary.json`,
    `telegram-desktop-builder.png` y `telegram-desktop-builder.mp4`
    en el directorio de salida.

Las vías de transporte en vivo comparten un contrato estándar para que los nuevos transportes no
diverjan; la matriz de cobertura por vía vive en
[resumen de QA - Cobertura de transporte en vivo](/es/concepts/qa-e2e-automation#live-transport-coverage).
`qa-channel` es el conjunto sintético amplio y no forma parte de esa matriz.

### Credenciales compartidas de Telegram mediante Convex (v1)

Cuando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)
está habilitado para QA de transporte en vivo, QA lab adquiere una concesión exclusiva de un
pool respaldado por Convex, envía heartbeats de esa concesión mientras la vía se ejecuta y
libera la concesión al cerrar. El nombre de la sección es anterior al soporte de Discord, Slack y
WhatsApp; el contrato de concesión se comparte entre tipos.

Andamiaje de referencia del proyecto Convex: `qa/convex-credential-broker/`

Variables de entorno requeridas:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por ejemplo `https://your-deployment.convex.site`)
- Un secreto para el rol seleccionado:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Selección de rol de credencial:
  - CLI: `--credential-role maintainer|ci`
  - Valor predeterminado de entorno: `OPENCLAW_QA_CREDENTIAL_ROLE` (usa `ci` de forma predeterminada en CI, `maintainer` en caso contrario)

Variables de entorno opcionales:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predeterminado `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predeterminado `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predeterminado `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predeterminado `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predeterminado `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de traza opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URL de Convex `http://` de loopback para desarrollo solo local.

`OPENCLAW_QA_CONVEX_SITE_URL` debe usar `https://` en funcionamiento normal.

Los comandos de administración de mantenedor (agregar/quitar/listar del pool) requieren
específicamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Ayudantes de CLI para mantenedores:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `doctor` antes de ejecuciones en vivo para comprobar la URL del sitio Convex, los secretos del bróker,
el prefijo de endpoint, el timeout HTTP y la accesibilidad de administración/listado sin imprimir
valores secretos. Usa `--json` para salida legible por máquinas en scripts y utilidades de CI.

Contrato de endpoint predeterminado (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`).
Las solicitudes se autentican con un encabezado `Authorization: Bearer <role secret>`;
los cuerpos siguientes omiten ese encabezado:

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
  - Guardia de concesión activa: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo secreto de mantenedor)
  - Solicitud: `{ kind?, status?, includePayload?, limit? }`
  - Correcto: `{ status: "ok", credentials, count }`

Forma de payload para el tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` debe ser una cadena de id numérico de chat de Telegram.
- `admin/add` valida esta forma para `kind: "telegram"` y rechaza payloads mal formados.

Forma de payload para el tipo de usuario real de Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` y `telegramApiId` deben ser cadenas numéricas.
- `tdlibArchiveSha256` y `desktopTdataArchiveSha256` deben ser cadenas hexadecimales SHA-256.
- `kind: "telegram-user"` está reservado para el workflow de prueba de Mantis Telegram Desktop. Las vías genéricas de QA Lab no deben adquirirlo.

Payloads multicanal validados por el bróker:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Las vías de Slack también pueden concederse desde el pool, pero la validación de payload de Slack
actualmente vive en el runner de QA de Slack en lugar del bróker. Usa
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
para filas de Slack.

### Agregar un canal a QA

La arquitectura y los nombres de ayudantes de escenarios para nuevos adaptadores de canal viven en
[resumen de QA - Agregar un canal](/es/concepts/qa-e2e-automation#adding-a-channel).
El umbral mínimo: implementar el runner de transporte en la costura compartida del host `qa-lab`,
agregar un `adapterFactory` para escenarios compartidos, declarar `qaRunners` en el
manifiesto del plugin, montar como `openclaw qa <runner>` y escribir escenarios en
`qa/scenarios/`.

## Suites de prueba (qué se ejecuta dónde)

Piensa en las suites como de "realismo creciente" (y mayor inestabilidad/costo).

### Unitarias / integración (predeterminado)

- Comando: `pnpm test`
- Configuración: las ejecuciones sin objetivo usan el conjunto de shards `vitest.full-*.config.ts` y pueden
  expandir shards multiproyecto en configuraciones por proyecto para planificación
  paralela
- Archivos: inventarios de núcleo/unitarias en `src/**/*.test.ts`,
  `packages/**/*.test.ts` y `test/**/*.test.ts`; las pruebas unitarias de UI se ejecutan en el
  shard dedicado `unit-ui`
- Alcance:
  - Pruebas unitarias puras
  - Pruebas de integración en proceso (autenticación de Gateway, enrutamiento, herramientas, parsing, configuración)
  - Regresiones deterministas para errores conocidos
- Expectativas:
  - Se ejecuta en CI
  - No requiere claves reales
  - Debe ser rápido y estable
  - Las pruebas del resolver y del cargador de superficie pública deben probar el comportamiento amplio de fallback de `api.js` y
    `runtime-api.js` con fixtures diminutos generados de plugin,
    no con APIs reales de origen de plugin incluido. Las cargas reales de API de plugin pertenecen a
    suites de contrato/integración propiedad del plugin.

Política de dependencias nativas:

- Las instalaciones de prueba predeterminadas omiten compilaciones opcionales nativas de opus de Discord. La voz de Discord
  usa `libopus-wasm` incluido, y `@discordjs/opus` permanece deshabilitado en
  `allowBuilds` para que las pruebas locales y las vías de Testbox no compilen el addon
  nativo.
- Compara el rendimiento de opus nativo en el repo de benchmark de `libopus-wasm`, no
  en los bucles predeterminados de instalación/prueba de OpenClaw. No configures `@discordjs/opus` como
  `true` en el `allowBuilds` predeterminado; eso hace que bucles no relacionados de instalación/prueba
  compilen código nativo.

<AccordionGroup>
  <Accordion title="Proyectos, shards y vías acotadas">

    - `pnpm test` sin destino ejecuta trece configuraciones de fragmentos más pequeñas (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-tooling`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) en lugar de un único proceso nativo gigante de proyecto raíz. Esto reduce el RSS máximo en máquinas cargadas y evita que el trabajo de auto-reply/Plugin deje sin recursos a suites no relacionadas.
    - `pnpm test --watch` sigue usando el grafo de proyectos raíz nativo de `vitest.config.ts`, porque un bucle de vigilancia con varios fragmentos no es práctico.
    - `pnpm test`, `pnpm test:watch` y `pnpm test:perf:imports` enrutan primero los destinos explícitos de archivo/directorio por carriles acotados, de modo que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar el coste completo de arranque del proyecto raíz.
    - `pnpm test:changed` expande por defecto las rutas de git modificadas en carriles acotados baratos: ediciones directas de pruebas, archivos `*.test.ts` hermanos, asignaciones explícitas de código fuente y dependientes locales del grafo de importaciones. Las ediciones de configuración/preparación/paquete no ejecutan pruebas amplias salvo que uses explícitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` es la puerta normal de comprobación local inteligente para trabajo acotado. Clasifica el diff en core, pruebas de core, extensions, pruebas de extensiones, apps, docs, metadatos de lanzamiento, herramientas Docker live y herramientas, y luego ejecuta los comandos de typecheck, lint y guard correspondientes. No ejecuta pruebas de Vitest; llama a `pnpm test:changed` o a un `pnpm test <target>` explícito para prueba de tests. Los incrementos de versión que solo tocan metadatos de lanzamiento ejecutan comprobaciones dirigidas de versión/configuración/dependencias raíz, con una guardia que rechaza cambios de paquete fuera del campo de versión de nivel superior.
    - Las ediciones del arnés ACP Docker live ejecutan comprobaciones enfocadas: sintaxis de shell para los scripts de autenticación Docker live y un ensayo sin ejecución del planificador Docker live. Los cambios de `package.json` se incluyen solo cuando el diff se limita a `scripts["test:docker:live-*"]`; las ediciones de dependencias, exports, versión y otras superficies de paquete siguen usando las guardias más amplias.
    - Las pruebas unitarias ligeras en importaciones de agentes, comandos, plugins, helpers de auto-reply, `plugin-sdk` y áreas similares de utilidades puras se enrutan por el carril `unit-fast`, que omite `test/setup-openclaw-runtime.ts`; los archivos con mucho estado o runtime permanecen en los carriles existentes.
    - Algunos archivos fuente auxiliares de `plugin-sdk` y `commands` también asignan las ejecuciones en modo cambiado a pruebas hermanas explícitas en esos carriles ligeros, de modo que las ediciones de helpers evitan volver a ejecutar toda la suite pesada de ese directorio.
    - `auto-reply` tiene buckets dedicados para helpers de core de nivel superior, pruebas de integración `reply.*` de nivel superior y el subárbol `src/auto-reply/reply/**`. CI divide además el subárbol de reply en fragmentos de agent-runner, dispatch y commands/state-routing para que un bucket pesado en importaciones no posea toda la cola de Node.
    - La CI normal de PR/main omite intencionadamente el barrido por lotes de plugins incluidos y el fragmento `agentic-plugins` exclusivo de lanzamientos. Full Release Validation despacha el flujo de trabajo hijo separado `Plugin Prerelease` para esas suites pesadas en plugins sobre candidatos de lanzamiento.

  </Accordion>

  <Accordion title="Cobertura del runner integrado">

    - Cuando cambies las entradas de descubrimiento de herramientas de mensajes o el contexto
      de runtime de Compaction, conserva ambos niveles de cobertura.
    - Añade regresiones enfocadas de helpers para los límites de enrutamiento y normalización
      puros.
    - Mantén saludables las suites de integración del runner integrado:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` y
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Esas suites verifican que los ids acotados y el comportamiento de Compaction sigan fluyendo
      por las rutas reales de `run.ts` / `compact.ts`; las pruebas solo de helpers
      no son un sustituto suficiente para esas rutas de integración.

  </Accordion>

  <Accordion title="Valores predeterminados de pool e aislamiento de Vitest">

    - La configuración base de Vitest usa `threads` por defecto.
    - La configuración compartida de Vitest fija `isolate: false` y usa el
      runner no aislado en los proyectos raíz, e2e y configuraciones live.
    - El carril UI raíz conserva su preparación `jsdom` y su optimizador, pero también se ejecuta en el
      runner compartido no aislado.
    - Cada fragmento de `pnpm test` hereda los mismos valores predeterminados `threads` + `isolate: false`
      de la configuración compartida de Vitest.
    - `scripts/run-vitest.mjs` añade `--no-maglev` por defecto para procesos Node
      hijos de Vitest con el fin de reducir la rotación de compilación de V8 durante ejecuciones locales grandes.
      Define `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar con el comportamiento V8
      estándar.
    - `scripts/run-vitest.mjs` termina las ejecuciones explícitas de Vitest sin watch
      después de 5 minutos sin salida por stdout ni stderr. Define
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` para desactivar el watchdog en
      una investigación intencionadamente silenciosa.

  </Accordion>

  <Accordion title="Iteración local rápida">

    - `pnpm changed:lanes` muestra qué carriles arquitectónicos activa un diff.
    - El hook de pre-commit solo formatea. Vuelve a preparar los archivos formateados
      y no ejecuta lint, typecheck ni pruebas.
    - Ejecuta `pnpm check:changed` explícitamente antes de entregar o hacer push cuando
      necesites la puerta de comprobación local inteligente.
    - `pnpm test:changed` se enruta por carriles acotados baratos por defecto. Usa
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el agente
      decida que una edición de arnés, configuración, paquete o contrato realmente necesita
      cobertura de Vitest más amplia.
    - `pnpm test:max` y `pnpm test:changed:max` conservan el mismo comportamiento de enrutamiento,
      solo con un límite de workers más alto.
    - El autoescalado de workers locales es intencionadamente conservador y retrocede
      cuando el promedio de carga del host ya es alto, por lo que varias ejecuciones concurrentes
      de Vitest causan menos daño por defecto.
    - La configuración base de Vitest marca los proyectos/archivos de configuración como
      `forceRerunTriggers` para que las reejecuciones en modo cambiado sigan siendo correctas cuando cambia
      el cableado de pruebas.
    - La configuración mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado en
      hosts compatibles; define `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`
      para una única ubicación de caché explícita para perfilado directo.

  </Accordion>

  <Accordion title="Depuración de rendimiento">

    - `pnpm test:perf:imports` habilita los informes de duración de importaciones de Vitest más
      la salida de desglose de importaciones.
    - `pnpm test:perf:imports:changed` acota la misma vista de perfilado a
      archivos modificados desde `origin/main`.
    - Los datos de tiempos de fragmentos se escriben en `.artifacts/vitest-shard-timings.json`.
      Las ejecuciones de configuración completa usan la ruta de configuración como clave; los fragmentos de CI
      con patrón de inclusión anexan el nombre del fragmento para que los fragmentos filtrados puedan rastrearse
      por separado.
    - Cuando una prueba caliente todavía pasa la mayor parte de su tiempo en importaciones de arranque,
      mantén las dependencias pesadas detrás de una interfaz local estrecha `*.runtime.ts` y
      mockea esa interfaz directamente en lugar de hacer deep-import de helpers de runtime
      solo para pasarlos por `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara el
      `test:changed` enrutado contra la ruta nativa de proyecto raíz para ese
      diff confirmado e imprime el tiempo de pared más el RSS máximo de macOS.
    - `pnpm test:perf:changed:bench -- --worktree` mide el árbol sucio actual
      enrutando la lista de archivos modificados por
      `scripts/test-projects.mjs` y la configuración raíz de Vitest.
    - `pnpm test:perf:profile:main` escribe un perfil de CPU del hilo principal para
      la sobrecarga de arranque y transformación de Vitest/Vite.
    - `pnpm test:perf:profile:runner` escribe perfiles de CPU+heap del runner para
      la suite unitaria con el paralelismo de archivos deshabilitado.

  </Accordion>
</AccordionGroup>

### Estabilidad (gateway)

- Comando: `pnpm test:stability:gateway`
- Configuración: `test/vitest/vitest.gateway.config.ts`, `test/vitest/vitest.logging.config.ts` y `test/vitest/vitest.infra.config.ts`, cada uno forzado a un worker
- Alcance:
  - Inicia un Gateway de loopback real con diagnósticos habilitados por defecto
  - Conduce rotación sintética de mensajes de gateway, memoria y cargas grandes por la ruta de eventos de diagnóstico
  - Consulta `diagnostics.stability` mediante el RPC WS del Gateway
  - Cubre helpers de persistencia del paquete de estabilidad de diagnóstico
  - Afirma que el recorder permanece acotado, que las muestras RSS sintéticas se mantienen por debajo del presupuesto de presión y que las profundidades de cola por sesión vuelven a cero
- Expectativas:
  - Seguro para CI y sin claves
  - Carril estrecho para seguimiento de regresiones de estabilidad, no un sustituto de la suite completa de Gateway

### E2E (agregado del repo)

- Comando: `pnpm test:e2e`
- Alcance:
  - Ejecuta el carril E2E de smoke del gateway
  - Ejecuta el carril E2E de navegador mockeado de Control UI
- Expectativas:
  - Seguro para CI y sin claves
  - Requiere que Playwright Chromium esté instalado

### E2E (smoke del gateway)

- Comando: `pnpm test:e2e:gateway`
- Configuración: `test/vitest/vitest.e2e.config.ts`
- Archivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` y pruebas E2E de plugins incluidos bajo `extensions/`
- Valores predeterminados de runtime:
  - Usa `threads` de Vitest con `isolate: false`, igual que el resto del repo.
  - Usa workers adaptativos (CI: hasta 2, local: 1 por defecto).
  - Se ejecuta en modo silencioso por defecto para reducir la sobrecarga de E/S de consola.
- Overrides útiles:
  - `OPENCLAW_E2E_WORKERS=<n>` para forzar el número de workers (limitado a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para volver a habilitar la salida de consola detallada.
- Alcance:
  - Comportamiento end-to-end de gateway multiinstancia
  - Superficies WebSocket/HTTP, emparejamiento de Node y redes más pesadas
- Expectativas:
  - Se ejecuta en CI (cuando está habilitado en la canalización)
  - No requiere claves reales
  - Más partes móviles que las pruebas unitarias (puede ser más lento)

### E2E (navegador mockeado de Control UI)

- Comando: `pnpm test:ui:e2e`
- Configuración: `test/vitest/vitest.ui-e2e.config.ts`
- Archivos: `ui/src/**/*.e2e.test.ts`
- Alcance:
  - Inicia la Control UI de Vite
  - Conduce una página real de Chromium mediante Playwright
  - Reemplaza el WebSocket del Gateway con mocks deterministas en el navegador
- Expectativas:
  - Se ejecuta en CI como parte de `pnpm test:e2e`
  - No requiere Gateway, agentes ni claves de proveedor reales
  - La dependencia del navegador debe estar presente (`pnpm --dir ui exec playwright install chromium`)

### E2E: smoke del backend de OpenShell

- Comando: `pnpm test:e2e:openshell`
- Archivo: `extensions/openshell/src/backend.e2e.test.ts`
- Alcance:
  - Reutiliza un gateway OpenShell local activo
  - Crea un sandbox a partir de un Dockerfile local temporal
  - Ejercita el backend OpenShell de OpenClaw mediante `sandbox ssh-config` real + ejecución SSH
  - Verifica el comportamiento de filesystem canónico remoto mediante el puente fs del sandbox
- Expectativas:
  - Solo opt-in; no forma parte de la ejecución predeterminada de `pnpm test:e2e`
  - Requiere una CLI `openshell` local y un daemon Docker funcional
  - Requiere un gateway OpenShell local activo y su fuente de configuración
  - Usa `HOME` / `XDG_CONFIG_HOME` aislados y luego destruye el sandbox de prueba
- Overrides útiles:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar la prueba al ejecutar manualmente la suite e2e más amplia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apuntar a un binario CLI no predeterminado o a un script wrapper
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` para exponer la configuración de gateway registrada a la prueba aislada
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` para sobrescribir la IP del gateway Docker usada por el fixture de política del host

### Live (proveedores reales + modelos reales)

- Comando: `pnpm test:live`
- Configuración: `test/vitest/vitest.live.config.ts`
- Archivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` y pruebas en vivo de plugins incluidos bajo `extensions/`
- Valor predeterminado: **habilitado** por `pnpm test:live` (establece `OPENCLAW_LIVE_TEST=1`)
- Alcance:
  - "¿Este proveedor/modelo funciona realmente _hoy_ con credenciales reales?"
  - Detectar cambios de formato de proveedores, peculiaridades de llamadas a herramientas, problemas de autenticación y comportamiento de límites de frecuencia
- Expectativas:
  - No está diseñado para ser estable en CI (redes reales, políticas reales de proveedores, cuotas, interrupciones)
  - Cuesta dinero / usa límites de frecuencia
  - Preferir ejecutar subconjuntos acotados en lugar de "todo"
- Las ejecuciones en vivo usan claves de API ya exportadas y perfiles de autenticación preparados.
- De forma predeterminada, las ejecuciones en vivo siguen aislando `HOME` y copian material de configuración/autenticación en un directorio home de prueba temporal para que los fixtures unitarios no puedan mutar tu `~/.openclaw` real.
- Establece `OPENCLAW_LIVE_USE_REAL_HOME=1` solo cuando necesites intencionadamente que las pruebas en vivo usen tu directorio home real.
- `pnpm test:live` usa de forma predeterminada un modo más silencioso: conserva la salida de progreso `[live] ...` y silencia los logs de arranque del Gateway/el ruido de Bonjour. Establece `OPENCLAW_LIVE_TEST_QUIET=0` si quieres recuperar todos los logs de inicio.
- Rotación de claves de API (específica por proveedor): establece `*_API_KEYS` con formato separado por comas/puntos y coma o `*_API_KEY_1`, `*_API_KEY_2` (por ejemplo, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) o una anulación por ejecución en vivo mediante `OPENCLAW_LIVE_*_KEY`; las pruebas reintentan ante respuestas de límite de frecuencia.
- Salida de progreso/Heartbeat:
  - Las suites en vivo emiten líneas de progreso a stderr para que las llamadas largas a proveedores sean visiblemente activas incluso cuando la captura de consola de Vitest está en silencio.
  - `test/vitest/vitest.live.config.ts` desactiva la intercepción de consola de Vitest para que las líneas de progreso de proveedor/Gateway se transmitan inmediatamente durante las ejecuciones en vivo.
  - Ajusta los Heartbeat de modelos directos con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajusta los Heartbeat de Gateway/sonda con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## ¿Qué suite debería ejecutar?

Usa esta tabla de decisión:

- Edición de lógica/pruebas: ejecuta `pnpm test` (y `pnpm test:coverage` si cambiaste mucho)
- Cambios en redes de Gateway / protocolo WS / emparejamiento: añade `pnpm test:e2e`
- Depuración de "mi bot está caído" / fallos específicos del proveedor / llamadas a herramientas: ejecuta un `pnpm test:live` acotado

## Pruebas en vivo (con acceso a la red)

Para la matriz de modelos en vivo, pruebas de humo de backend CLI, pruebas de humo ACP, arnés de servidor de aplicación de Codex y todas las pruebas en vivo de proveedores de medios (Deepgram, BytePlus, ComfyUI, imagen, música, video, arnés de medios), además del manejo de credenciales para ejecuciones en vivo

- consulta [Probar suites en vivo](/es/help/testing-live). Para la lista de verificación dedicada de actualización y
  validación de plugins, consulta
  [Probar actualizaciones y plugins](/es/help/testing-updates-plugins).

## Ejecutores Docker (comprobaciones opcionales de "funciona en Linux")

Estos ejecutores Docker se dividen en dos grupos:

- Ejecutores de modelos en vivo: `test:docker:live-models` y `test:docker:live-gateway` ejecutan solo su archivo en vivo de clave de perfil correspondiente dentro de la imagen Docker del repositorio (`src/agents/models.profiles.live.test.ts` y `src/gateway/gateway-models.profiles.live.test.ts`), montando tu directorio de configuración local, workspace y archivo env de perfil opcional. Los entrypoints locales correspondientes son `test:live:models-profiles` y `test:live:gateway-profiles`.
- Los ejecutores Docker en vivo conservan sus propios límites prácticos cuando hace falta:
  `test:docker:live-models` usa de forma predeterminada el conjunto seleccionado compatible de alta señal, y
  `test:docker:live-gateway` usa de forma predeterminada `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` y
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Establece `OPENCLAW_LIVE_MAX_MODELS`
  o las variables env de Gateway cuando quieras explícitamente un límite menor o un escaneo mayor.
- `test:docker:all` compila la imagen Docker en vivo una vez mediante `test:docker:live-build`, empaqueta OpenClaw una vez como tarball npm mediante `scripts/package-openclaw-for-docker.mjs` y luego compila/reutiliza dos imágenes `scripts/e2e/Dockerfile`. La imagen básica es solo el ejecutor Node/Git para carriles de instalación/actualización/dependencias de plugins; esos carriles montan el tarball precompilado. La imagen funcional instala el mismo tarball en `/app` para carriles de funcionalidad de la aplicación compilada. Las definiciones de carriles Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`; la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ejecuta el plan seleccionado. El agregado usa un planificador local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla los slots de procesos, mientras que los límites de recursos evitan que carriles pesados en vivo, de instalación npm y multiservicio comiencen todos a la vez. Si un solo carril es más pesado que los límites activos, el planificador aún puede iniciarlo cuando el pool está vacío y luego lo mantiene ejecutándose solo hasta que vuelva a haber capacidad disponible. Los valores predeterminados son 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` y `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajusta `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` u `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` (y otras anulaciones `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT`) solo cuando el host Docker tenga más margen. El ejecutor realiza una precomprobación de Docker de forma predeterminada, elimina contenedores E2E de OpenClaw obsoletos, imprime estado cada 30 segundos, almacena los tiempos de carriles exitosos en `.artifacts/docker-tests/lane-timings.json` y usa esos tiempos para iniciar primero los carriles más largos en ejecuciones posteriores. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir el manifiesto ponderado de carriles sin compilar ni ejecutar Docker, o `node scripts/test-docker-all.mjs --plan-json` para imprimir el plan de CI para los carriles seleccionados, necesidades de paquetes/imágenes y credenciales.
- `Package Acceptance` es la puerta de paquetes nativa de GitHub para "¿este tarball instalable funciona como producto?". Resuelve un paquete candidato de `source=npm`, `source=ref`, `source=url`, `source=trusted-url` o `source=artifact`, lo sube como `package-under-test` y luego ejecuta los carriles Docker E2E reutilizables contra ese tarball exacto en lugar de volver a empaquetar la ref seleccionada. Los perfiles están ordenados por amplitud: `smoke`, `package`, `product` y `full` (más `custom` para una lista explícita de carriles). Consulta [Probar actualizaciones y plugins](/es/help/testing-updates-plugins) para el contrato de paquete/actualización/plugin, la matriz de supervivencia de actualización publicada, los valores predeterminados de lanzamiento y el triaje de fallos.
- La compatibilidad heredada de Package Acceptance está limitada a `2026.4.25` (`2026.4.25-beta.*` incluido). Hasta ese punto de corte, el arnés tolera solo brechas de metadatos de paquetes publicados: entradas omitidas de inventario privado de QA, falta de `gateway install --wrapper`, falta de archivos patch en el fixture git derivado del tarball, falta de `update.channel` persistido, ubicaciones heredadas de registros de instalación de plugins, falta de persistencia de registros de instalación del marketplace y migración de metadatos de configuración durante `plugins update`. Para paquetes posteriores a `2026.4.25`, esas rutas son fallos estrictos.
- Ejecutores de humo de contenedores: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` y `test:docker:config-reload` arrancan uno o más contenedores reales y verifican rutas de integración de nivel superior.
- Los carriles E2E de Docker/Bash que instalan el tarball empaquetado de OpenClaw mediante `scripts/lib/openclaw-e2e-instance.sh` limitan `npm install` a `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (predeterminado `600s`; establece `0` para desactivar el wrapper durante la depuración).

Los ejecutores Docker de modelos en vivo también montan con bind solo los homes de autenticación de CLI necesarios
(o todos los compatibles cuando la ejecución no está acotada) y luego los copian en el
home del contenedor antes de la ejecución para que OAuth de CLI externas pueda refrescar tokens
sin mutar el almacén de autenticación del host:

- Modelos directos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Humo de bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; cubre Claude, Codex y Gemini de forma predeterminada, con cobertura estricta de Droid/OpenCode mediante `pnpm test:docker:live-acp-bind:droid` y `pnpm test:docker:live-acp-bind:opencode`)
- Humo de backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Humo de arnés de servidor de aplicación de Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desarrollo: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Pruebas de humo de observabilidad: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` y `pnpm qa:observability:smoke` son carriles privados de checkout de fuente de QA. Intencionadamente no forman parte de los carriles Docker de lanzamiento de paquete porque el tarball npm omite QA Lab.
- Humo en vivo de Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Asistente de incorporación (TTY, andamiaje completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Humo de incorporación/canal/agente de tarball npm: `pnpm test:docker:npm-onboard-channel-agent` instala globalmente el tarball empaquetado de OpenClaw en Docker, configura OpenAI mediante incorporación con ref de env más Telegram de forma predeterminada, ejecuta doctor y ejecuta un turno simulado de agente OpenAI. Reutiliza un tarball precompilado con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la recompilación del host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` o cambia de canal con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` o `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Smoke de recorrido de usuario de lanzamiento: `pnpm test:docker:release-user-journey` instala el tarball empaquetado de OpenClaw globalmente en un home de Docker limpio, ejecuta la incorporación, configura un proveedor OpenAI simulado, ejecuta un turno de agente, instala/desinstala Plugins externos, configura ClickClack contra un fixture local, verifica la mensajería saliente/entrante, reinicia Gateway y ejecuta doctor.
- Smoke de incorporación tipada de lanzamiento: `pnpm test:docker:release-typed-onboarding` instala el tarball empaquetado, conduce `openclaw onboard` mediante un TTY real, configura OpenAI como proveedor con referencia de entorno, verifica que no haya persistencia de claves sin procesar y ejecuta un turno de agente simulado.
- Smoke de medios/memoria de lanzamiento: `pnpm test:docker:release-media-memory` instala el tarball empaquetado, verifica la comprensión de imágenes desde un adjunto PNG, la salida de generación de imágenes compatible con OpenAI, la recuperación de búsqueda en memoria y la supervivencia de la recuperación tras reiniciar Gateway.
- Smoke de recorrido de usuario de actualización de lanzamiento: `pnpm test:docker:release-upgrade-user-journey` instala de forma predeterminada la línea base publicada más reciente anterior al tarball candidato, configura el estado de proveedor/Plugin/ClickClack en el paquete publicado, actualiza al tarball candidato y luego vuelve a ejecutar el recorrido principal de agente/Plugin/canal. Si no existe una línea base publicada anterior, reutiliza la versión candidata. Sobrescribe la línea base con `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Smoke de marketplace de Plugins de lanzamiento: `pnpm test:docker:release-plugin-marketplace` instala desde un marketplace de fixtures local, actualiza el Plugin instalado, lo desinstala y verifica que la CLI del Plugin desaparezca con los metadatos de instalación depurados.
- Smoke de instalación de Skills: `pnpm test:docker:skill-install` instala globalmente el tarball empaquetado de OpenClaw en Docker, desactiva las instalaciones de archivos subidos en la configuración, resuelve el slug actual de una skill viva de ClawHub desde la búsqueda, la instala con `openclaw skills install` y verifica la skill instalada junto con los metadatos de origen/bloqueo de `.clawhub`.
- Smoke de cambio de canal de actualización: `pnpm test:docker:update-channel-switch` instala globalmente el tarball empaquetado de OpenClaw en Docker, cambia del paquete `stable` a git `dev`, verifica el canal persistido y el trabajo posterior a la actualización del Plugin, luego vuelve al paquete `stable` y comprueba el estado de actualización.
- Smoke de supervivencia de actualización: `pnpm test:docker:upgrade-survivor` instala el tarball empaquetado de OpenClaw sobre un fixture sucio de usuario antiguo con agentes, configuración de canal, listas de permitidos de Plugins, estado obsoleto de dependencias de Plugins y archivos existentes de workspace/sesión. Ejecuta la actualización del paquete y doctor no interactivo sin proveedor vivo ni claves de canal, luego inicia un Gateway de loopback y comprueba la preservación de configuración/estado más los presupuestos de arranque/estado.
- Smoke de supervivencia de actualización publicada: `pnpm test:docker:published-upgrade-survivor` instala `openclaw@latest` de forma predeterminada, siembra archivos realistas de usuario existente, configura esa línea base con una receta de comandos integrada, valida la configuración resultante, actualiza esa instalación publicada al tarball candidato, ejecuta doctor no interactivo, escribe `.artifacts/upgrade-survivor/summary.json`, luego inicia un Gateway de loopback y comprueba los intents configurados, la preservación de estado, el arranque, `/healthz`, `/readyz` y los presupuestos de estado RPC. Sobrescribe una línea base con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, pide al programador agregado que expanda líneas base locales exactas con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` como `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, y expande fixtures con forma de issue con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` como `reported-issues`; el conjunto reported-issues incluye `configured-plugin-installs` para la reparación automática de instalaciones externas de Plugins de OpenClaw. Package Acceptance expone eso como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` y `published_upgrade_survivor_scenarios`, resuelve tokens de línea base meta como `last-stable-4` o `all-since-2026.4.23`, y Full Release Validation expande la puerta de paquete release-soak a `last-stable-4 2026.4.23 2026.5.2 2026.4.15` más `reported-issues`.
- Smoke de contexto de runtime de sesión: `pnpm test:docker:session-runtime-context` verifica la persistencia oculta de transcripciones de contexto de runtime más la reparación de doctor de ramas afectadas y duplicadas de reescritura de prompts.
- Smoke de instalación global con Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empaqueta el árbol actual, lo instala con `bun install -g` en un home aislado y verifica que `openclaw infer image providers --json` devuelva proveedores de imagen incluidos en el paquete en lugar de quedarse colgado. Reutiliza un tarball precompilado con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la build del host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, o copia `dist/` desde una imagen de Docker construida con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke de Docker del instalador: `bash scripts/test-install-sh-docker.sh` comparte una caché npm entre sus contenedores root, update y direct-npm. El smoke de update usa por defecto npm `latest` como línea base estable antes de actualizar al tarball candidato. Sobrescribe con `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localmente, o con la entrada `update_baseline_version` del workflow Install Smoke en GitHub. Las comprobaciones del instalador no root mantienen una caché npm aislada para que las entradas de caché propiedad de root no enmascaren el comportamiento de instalación local del usuario. Define `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar la caché root/update/direct-npm entre nuevas ejecuciones locales.
- Install Smoke CI omite la actualización global direct-npm duplicada con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; ejecuta el script localmente sin esa variable de entorno cuando se necesite cobertura directa de `npm install -g`.
- Smoke de CLI de eliminación de agentes en workspace compartido: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) construye de forma predeterminada la imagen del Dockerfile raíz, siembra dos agentes con un workspace en un home de contenedor aislado, ejecuta `agents delete --json` y verifica JSON válido más el comportamiento de workspace retenido. Reutiliza la imagen install-smoke con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Redes de Gateway (dos contenedores, autenticación WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoke de snapshot de CDP de navegador: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) construye la imagen E2E de fuente más una capa de Chromium, inicia Chromium con CDP sin procesar, ejecuta `browser doctor --deep` y verifica que los snapshots de roles de CDP cubran URLs de enlaces, elementos clicables promovidos por cursor, referencias de iframe y metadatos de frames.
- Regresión de razonamiento mínimo de web_search en OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) ejecuta un servidor OpenAI simulado mediante Gateway, verifica que `web_search` eleva `reasoning.effort` de `minimal` a `low`, luego fuerza el rechazo del esquema del proveedor y comprueba que el detalle sin procesar aparezca en los logs de Gateway.
- Puente de canal MCP (Gateway sembrado + puente stdio + smoke de frame de notificación Claude sin procesar): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Herramientas MCP del bundle de OpenClaw (servidor MCP stdio real + smoke de permitir/denegar perfil OpenClaw embebido): `pnpm test:docker:agent-bundle-mcp-tools` (script: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Limpieza de Cron/subagente MCP (Gateway real + desmontaje de hijo MCP stdio después de ejecuciones aisladas de cron y subagente de una sola vez): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke de instalación/actualización para ruta local, `file:`, registro npm con dependencias elevadas, metadatos malformados de paquete npm, refs móviles de git, kitchen-sink de ClawHub, actualizaciones de marketplace y habilitación/inspección de bundle de Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Define `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para omitir el bloque de ClawHub, o sobrescribe el par predeterminado de paquete/runtime kitchen-sink con `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` y `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sin `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, la prueba usa un servidor hermético de fixtures locales de ClawHub.
- Smoke de actualización sin cambios de Plugin: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke de matriz de ciclo de vida de Plugins: `pnpm test:docker:plugin-lifecycle-matrix` instala el tarball empaquetado de OpenClaw en un contenedor básico, instala un Plugin npm, alterna habilitar/deshabilitar, lo actualiza y degrada mediante un registro npm local, elimina el código instalado y luego verifica que la desinstalación siga eliminando el estado obsoleto mientras registra métricas RSS/CPU para cada fase del ciclo de vida.
- Smoke de metadatos de recarga de configuración: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` cubre smoke de instalación/actualización para ruta local, `file:`, registro npm con dependencias elevadas, refs móviles de git, fixtures de ClawHub, actualizaciones de marketplace y habilitación/inspección de bundle de Claude. `pnpm test:docker:plugin-update` cubre el comportamiento de actualización sin cambios para Plugins instalados. `pnpm test:docker:plugin-lifecycle-matrix` cubre instalación, habilitación, deshabilitación, actualización, degradación y desinstalación con código faltante de Plugins npm con seguimiento de recursos.

Para precompilar y reutilizar manualmente la imagen funcional compartida:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Las sobrescrituras de imagen específicas de suite, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, siguen prevaleciendo cuando están definidas. Cuando `OPENCLAW_SKIP_DOCKER_BUILD=1` apunta a una imagen compartida remota, los scripts la descargan si aún no está local. Las pruebas Docker de QR e instalador mantienen sus propios Dockerfiles porque validan el comportamiento de paquete/instalación en lugar del runtime de aplicación construida compartido.

Los runners Docker con modelo vivo también montan la checkout actual como solo lectura
y la preparan en un workdir temporal dentro del contenedor. Esto mantiene la
imagen de runtime liviana y, a la vez, ejecuta Vitest contra tu fuente/configuración
local exacta. El paso de preparación omite cachés grandes solo locales y salidas de build
de apps como `.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, y
directorios de salida `.build` o Gradle locales de apps para que las ejecuciones Docker vivas no
pasen minutos copiando artefactos específicos de la máquina. También definen
`OPENCLAW_SKIP_CHANNELS=1` para que las sondas vivas de Gateway no inicien workers
reales de canales de Telegram/Discord/etc. dentro del contenedor.
`test:docker:live-models` sigue ejecutando `pnpm test:live`, así que pasa también
`OPENCLAW_LIVE_GATEWAY_*` cuando necesites acotar o excluir la cobertura viva de Gateway
de ese carril Docker.

`test:docker:openwebui` es un smoke de compatibilidad de nivel superior: inicia un
contenedor de gateway de OpenClaw con los endpoints HTTP compatibles con OpenAI habilitados,
inicia un contenedor de Open WebUI fijado contra ese gateway, inicia sesión mediante
Open WebUI, verifica que `/api/models` exponga `openclaw/default` y luego envía una
solicitud real de chat mediante el proxy `/api/chat/completions` de Open WebUI. Define
`OPENWEBUI_SMOKE_MODE=models` para comprobaciones CI de ruta de lanzamiento que deben detenerse
tras el inicio de sesión en Open WebUI y el descubrimiento de modelos, sin esperar a una finalización
con modelo vivo. La primera ejecución puede ser notablemente más lenta porque Docker puede necesitar
descargar la imagen de Open WebUI y Open WebUI puede necesitar terminar su propia
configuración de arranque en frío. Este carril espera una clave utilizable de modelo vivo, proporcionada mediante
el entorno del proceso, perfiles de autenticación preparados o un
`OPENCLAW_PROFILE_FILE` explícito. Las ejecuciones correctas imprimen una pequeña carga JSON como
`{ "ok": true, "model": "openclaw/default", ... }`.

`test:docker:mcp-channels` es intencionalmente determinista y no necesita una
cuenta real de Telegram, Discord ni iMessage. Arranca un contenedor Gateway
sembrado, inicia un segundo contenedor que lanza `openclaw mcp serve` y luego
verifica el descubrimiento de conversaciones enrutadas, las lecturas de
transcripciones, los metadatos de adjuntos, el comportamiento de la cola de
eventos en vivo, el enrutamiento de envíos salientes y las notificaciones de
canal + permisos al estilo Claude sobre el puente MCP stdio real. La comprobación
de notificaciones inspecciona directamente los marcos MCP stdio sin procesar para
que la prueba smoke valide lo que el puente emite realmente, no solo lo que un SDK
de cliente específico expone por casualidad.

`test:docker:agent-bundle-mcp-tools` es determinista y no necesita una clave de
modelo en vivo. Compila la imagen Docker del repositorio, inicia un servidor de
sondeo MCP stdio real dentro del contenedor, materializa ese servidor mediante el
runtime MCP del bundle integrado de OpenClaw, ejecuta la herramienta y luego
verifica que `coding` y `messaging` conserven las herramientas `bundle-mcp`,
mientras que `minimal` y `tools.deny: ["bundle-mcp"]` las filtran.

`test:docker:cron-mcp-cleanup` es determinista y no necesita una clave de modelo
en vivo. Inicia un Gateway sembrado con un servidor de sondeo MCP stdio real,
ejecuta un turno cron aislado y un turno hijo único `sessions_spawn`, y luego
verifica que el proceso hijo MCP salga después de cada ejecución.

Prueba smoke manual de hilo ACP en lenguaje natural (no CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conserva este script para flujos de regresión/depuración. Puede volver a ser necesario para validar el enrutamiento de hilos ACP, así que no lo elimines.

Variables de entorno útiles:

- `OPENCLAW_CONFIG_DIR=...` (predeterminado: `~/.openclaw`) montado en `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predeterminado: `~/.openclaw/workspace`) montado en `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` montado y cargado antes de ejecutar las pruebas
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar solo variables de entorno cargadas desde `OPENCLAW_PROFILE_FILE`, usando directorios temporales de configuración/espacio de trabajo y sin montajes externos de autenticación de CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predeterminado: `~/.cache/openclaw/docker-cli-tools`, salvo que la ejecución ya use un directorio enlazado de CI/gestionado) montado en `/home/node/.npm-global` para instalaciones de CLI en caché dentro de Docker
- Los directorios/archivos de autenticación de CLI externos bajo `$HOME` se montan en modo solo lectura bajo `/host-auth...` y luego se copian en `/home/node/...` antes de que comiencen las pruebas
  - Directorios predeterminados (usados cuando la ejecución no está restringida a proveedores específicos): `.factory`, `.gemini`, `.minimax`
  - Archivos predeterminados: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Las ejecuciones restringidas a proveedores montan solo los directorios/archivos necesarios inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sobrescribe manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o una lista separada por comas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para restringir la ejecución
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar proveedores dentro del contenedor
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar una imagen `openclaw:local-live` existente en repeticiones que no necesitan recompilación
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para asegurar que las credenciales vengan del almacén de perfiles (no del entorno)
- `OPENCLAW_OPENWEBUI_MODEL=...` para elegir el modelo expuesto por el gateway para la prueba smoke de Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para sobrescribir el prompt de comprobación de nonce usado por la prueba smoke de Open WebUI
- `OPENWEBUI_IMAGE=...` para sobrescribir la etiqueta fijada de la imagen de Open WebUI

## Comprobación de documentación

Ejecuta comprobaciones de documentación después de editar docs: `pnpm check:docs`.
Ejecuta la validación completa de anclas de Mintlify cuando también necesites comprobaciones de encabezados dentro de la página: `pnpm docs:check-links:anchors`.

## Regresión sin conexión (segura para CI)

Estas son regresiones de "pipeline real" sin proveedores reales:

- Llamadas a herramientas de Gateway (OpenAI simulado, gateway real + bucle de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Asistente de Gateway (WS `wizard.start`/`wizard.next`, escribe configuración + autenticación aplicada): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evaluaciones de fiabilidad del agente (Skills)

Ya tenemos algunas pruebas seguras para CI que se comportan como "evaluaciones de fiabilidad del agente":

- Llamadas a herramientas simuladas mediante el gateway real + bucle de agente (`src/gateway/gateway.test.ts`).
- Flujos de asistente de extremo a extremo que validan el cableado de sesión y los efectos de configuración (`src/gateway/gateway.test.ts`).

Lo que aún falta para Skills (consulta [Skills](/es/tools/skills)):

- **Toma de decisiones:** cuando las Skills aparecen en el prompt, ¿el agente elige la Skill correcta (o evita las irrelevantes)?
- **Cumplimiento:** ¿el agente lee `SKILL.md` antes de usarla y sigue los pasos/argumentos requeridos?
- **Contratos de flujo de trabajo:** escenarios de varios turnos que verifican el orden de herramientas, la conservación del historial de sesión y los límites del sandbox.

Las evaluaciones futuras deben seguir siendo deterministas primero:

- Un ejecutor de escenarios con proveedores simulados para verificar llamadas a herramientas + orden, lecturas de archivos de Skills y cableado de sesión.
- Una pequeña suite de escenarios centrados en Skills (usar frente a evitar, compuertas, inyección de prompt).
- Evaluaciones en vivo opcionales (opt-in, controladas por entorno) solo después de que la suite segura para CI esté lista.

## Pruebas de contrato (forma de Plugin y canal)

Las pruebas de contrato verifican que cada Plugin y canal registrado cumpla con
su contrato de interfaz. Iteran sobre todos los Plugins descubiertos y ejecutan
una suite de aserciones de forma y comportamiento. El carril unitario
predeterminado de `pnpm test` omite intencionalmente estos archivos smoke y de
seams compartidos; ejecuta los comandos de contrato explícitamente cuando toques
superficies compartidas de canal o proveedor.

### Comandos

- Todos los contratos: `pnpm test:contracts`
- Solo contratos de canal: `pnpm test:contracts:channels`
- Solo contratos de proveedor: `pnpm test:contracts:plugins`

### Contratos de canal

Ubicados en `src/channels/plugins/contracts/*.contract.test.ts`. Categorías
actuales de nivel superior:

- **channel-catalog** - metadatos de entradas del catálogo de canales empaquetados/registry
- **plugin** (respaldado por registry, fragmentado) - forma básica de registro de Plugin
- **surfaces-only** (respaldado por registry, fragmentado) - comprobaciones de forma por superficie para `actions`, `setup`, `status`, `outbound`, `messaging`, `threading`, `directory` y `gateway`
- **session-binding** (respaldado por registry) - comportamiento de enlace de sesión
- **outbound-payload** - estructura y normalización del payload de mensajes
- **group-policy** (fallback) - aplicación de la política de grupo predeterminada por canal
- **threading** (respaldado por registry, fragmentado) - manejo de ids de hilo
- **directory** (respaldado por registry, fragmentado) - API de directorio/lista
- **registry** y **plugins-core.\*** - registro de Plugins de canal, cargador e internos de autorización de escritura de configuración

Los helpers de arnés de captura de despacho entrante y payload saliente usados
por estas suites se exponen internamente mediante `src/plugin-sdk/channel-contract-testing.ts`
(excluido de npm, no es un subpath público del SDK); no existe un archivo
`inbound.contract.test.ts` independiente en este directorio.

### Contratos de proveedor

Ubicados en `src/plugins/contracts/*.contract.test.ts`. Las categorías actuales
incluyen:

- **shape** - forma del manifiesto del Plugin, API y exports de runtime
- **plugin-registration** (+ paralelo) - casos de registro de manifiesto
- **package-manifest** - requisitos del manifiesto de paquete
- **loader** - comportamiento de setup/teardown del cargador de Plugins
- **registry** - contenido y búsqueda del registro de contratos de Plugins
- **providers** - comportamiento compartido de proveedores entre proveedores empaquetados, además de proveedores de búsqueda web
- **auth-choice** - metadatos de elección de autenticación y comportamiento de setup
- **provider-catalog-deprecation** - metadatos de catálogo de proveedores obsoletos
- **wizard.choice-resolution**, **wizard.model-picker**, **wizard.setup-options** - contratos del asistente de setup de proveedores
- **embedding-provider**, **memory-embedding-provider**, **web-fetch-provider**, **tts** - contratos de proveedor específicos de capacidad
- **session-actions**, **session-attachments**, **session-entry-projection** - contratos de estado de sesión propiedad del Plugin
- **scheduled-turns** - metadatos de turnos programados del Plugin y límites de timestamp
- **host-hooks**, **run-context-lifecycle**, **runtime-import-side-effects**, **runtime-seams** - ciclo de vida de host/runtime del Plugin y contratos de límite de importación
- **extension-runtime-dependencies** - ubicación de dependencias de runtime para extensiones

### Cuándo ejecutar

- Después de cambiar exports o subpaths de plugin-sdk
- Después de agregar o modificar un Plugin de canal o proveedor
- Después de refactorizar el registro o descubrimiento de Plugins

Las pruebas de contrato se ejecutan en CI y no requieren claves API reales.

## Agregar regresiones (guía)

Cuando arregles un problema de proveedor/modelo descubierto en vivo:

- Agrega una regresión segura para CI si es posible (proveedor simulado/stub, o captura la transformación exacta de la forma de la solicitud)
- Si es inherentemente solo en vivo (límites de tasa, políticas de autenticación), mantén la prueba en vivo estrecha y opt-in mediante variables de entorno
- Prefiere apuntar a la capa más pequeña que detecte el bug:
  - bug de conversión/reproducción de solicitud de proveedor -> prueba directa de modelos
  - bug de pipeline de sesión/historial/herramientas de gateway -> prueba smoke en vivo de gateway o prueba mock de gateway segura para CI
- Barandilla de recorrido de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un destino muestreado por clase SecretRef a partir de metadatos del registro (`listSecretTargetRegistryEntries()`), y luego afirma que se rechazan los ids de exec con segmentos de recorrido.
  - Si agregas una nueva familia de destinos SecretRef `includeInPlan` en `src/secrets/target-registry-data.ts`, actualiza `classifyTargetClass` en esa prueba. La prueba falla intencionalmente con ids de destino no clasificados para que las nuevas clases no puedan omitirse en silencio.

## Relacionado

- [Pruebas en vivo](/es/help/testing-live)
- [Pruebas de actualizaciones y Plugins](/es/help/testing-updates-plugins)
- [CI](/es/ci)
