---
read_when:
    - Ejecutar pruebas localmente o en CI
    - Añadir regresiones para errores de modelo/proveedor
    - Depuración del comportamiento del gateway y del agente
summary: 'Kit de pruebas: suites unitarias/e2e/en vivo, ejecutores de Docker y qué cubre cada prueba'
title: Pruebas
x-i18n:
    generated_at: "2026-07-05T11:22:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d214989b949abec4c41701154e295d9da50a7e3bdae26e5e1835b78b2c0cf345
    source_path: help/testing.md
    workflow: 16
---

OpenClaw tiene tres suites de Vitest (unitarias/integración, e2e, en vivo) además de ejecutores de Docker. Esta página cubre qué abarca cada suite, qué comando ejecutar para un flujo de trabajo determinado, cómo las pruebas en vivo descubren credenciales y cómo agregar regresiones para errores reales de proveedor/modelo.

<Note>
**El stack de QA (qa-lab, qa-channel, carriles de transporte en vivo)** está documentado por separado:

- [Resumen de QA](/es/concepts/qa-e2e-automation) - arquitectura, superficie de comandos, creación de escenarios.
- [QA Matrix](/es/concepts/qa-matrix) - referencia para `pnpm openclaw qa matrix`.
- [Cuadro de madurez](/es/maturity/scorecard) - cómo la evidencia de QA de versiones respalda las decisiones de estabilidad y LTS.
- [Canal de QA](/es/channels/qa-channel) - el plugin de transporte sintético usado por escenarios respaldados por el repositorio.

Esta página cubre las suites de pruebas regulares y los ejecutores de Docker/Parallels. [Ejecutores específicos de QA](#qa-specific-runners) más abajo enumera las invocaciones `qa` concretas y remite a las referencias anteriores.
</Note>

## Inicio rápido

La mayoría de los días:

- Puerta completa (esperada antes de push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Ejecución local más rápida de la suite completa en una máquina con recursos: `pnpm test:max`
- Bucle directo de observación de Vitest: `pnpm test:watch`
- El direccionamiento directo de archivos también enruta rutas de plugin/canal: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefiere primero ejecuciones focalizadas al iterar sobre un solo fallo.
- Sitio de QA respaldado por Docker: `pnpm qa:lab:up`
- Carril de QA respaldado por VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Cuando toques pruebas o quieras confianza adicional:

- Puerta de cobertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

## Directorios temporales de pruebas

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

`useAutoCleanupTempDirTracker(afterEach)` no expone intencionalmente ningún método de limpieza manual: Vitest es dueño de la limpieza después de cada prueba. Los helpers antiguos de nivel inferior (`makeTempDir`, `cleanupTempDirs`, `createTempDirTracker`) todavía existen para pruebas que no han migrado; evita usarlos en código nuevo y evita nuevas llamadas directas a `fs.mkdtemp*`, salvo que una prueba verifique explícitamente el comportamiento crudo de temp-dir. Cuando realmente se necesite un directorio temporal directo, agrega un comentario de permiso auditable con una razón:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` informa nuevas creaciones directas de temp-dir y nuevo uso manual del helper compartido en líneas agregadas del diff, sin bloquear estilos de limpieza existentes. Sigue la misma clasificación de rutas de prueba que `scripts/changed-lanes.mjs` y omite la implementación del helper compartido en sí. `check:changed` ejecuta este informe para rutas de prueba modificadas como una señal de CI solo de advertencia (anotaciones de advertencia de GitHub, no fallos).

## Flujos de trabajo en vivo y Docker/Parallels

Al depurar proveedores/modelos reales (requiere credenciales reales):

- Suite en vivo (modelos + pruebas de Gateway con herramientas/imágenes): `pnpm test:live`
- Apuntar silenciosamente a un archivo en vivo: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Informes de rendimiento en runtime: despacha `OpenClaw Performance` con
  `live_openai_candidate=true` para un turno real de agente `openai/gpt-5.5` o
  `deep_profile=true` para artefactos de CPU/heap/traza de Kova. Las ejecuciones diarias programadas
  publican artefactos de carril mock-provider, deep-profile y GPT 5.5 en
  `openclaw/clawgrit-reports` cuando `CLAWGRIT_REPORTS_TOKEN` está configurado. El
  informe mock-provider también incluye arranque de gateway a nivel de fuente, memoria,
  presión de plugins, bucle repetido hello-loop de modelo falso y números de inicio de CLI.
- Barrido de modelos en vivo con Docker: `pnpm test:docker:live-models`
  - Cada modelo seleccionado ejecuta un turno de texto más una pequeña prueba de estilo lectura de archivo.
    Los modelos cuyos metadatos anuncian entrada `image` también ejecutan un pequeño turno de imagen.
    Desactiva las pruebas adicionales con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` al aislar fallos de proveedor.
  - Cobertura de CI: tanto `OpenClaw Scheduled Live And E2E Checks` diario como
    `OpenClaw Release Checks` manual llaman al flujo reutilizable live/E2E con
    `include_live_suites: true`, que incluye jobs de matriz de modelos en vivo con Docker
    fragmentados por proveedor.
  - Para reejecuciones focalizadas de CI, despacha `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` y `live_models_only: true`.
  - Agrega nuevos secretos de proveedor de alta señal a `scripts/ci-hydrate-live-auth.sh`
    más `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` y sus
    llamadores programados/de release.
- Smoke de chat vinculado nativo de Codex: `pnpm test:docker:live-codex-bind`
  - Ejecuta un carril en vivo de Docker contra la ruta app-server de Codex, vincula un
    DM sintético de Slack con `/codex bind`, ejercita `/codex fast` y
    `/codex permissions`, y luego verifica una respuesta simple y una ruta de adjunto de imagen
    a través del enlace nativo del plugin en lugar de ACP.
- Smoke del harness app-server de Codex: `pnpm test:docker:live-codex-harness`
  - Ejecuta turnos de agente de gateway a través del harness app-server de Codex propiedad del plugin,
    verifica `/codex status` y `/codex models`, y por defecto
    ejercita pruebas de imagen, cron MCP, subagente y Guardian. Desactiva la
    prueba de subagente con `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` al
    aislar otros fallos. Para una comprobación focalizada de subagente, desactiva las
    otras pruebas:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Esto sale después de la prueba de subagente salvo que
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` esté configurado.
- Smoke de instalación bajo demanda de Codex: `pnpm test:docker:codex-on-demand`
  - Instala el tarball empaquetado de OpenClaw en Docker, ejecuta onboarding con clave de API de OpenAI
    y verifica que el plugin de Codex más la dependencia `@openai/codex`
    se descargaron bajo demanda en la raíz del proyecto npm administrado.
- Smoke de dependencia de herramienta de plugin en vivo: `pnpm test:docker:live-plugin-tool`
  - Empaqueta un plugin fixture con una dependencia real `slugify`, lo instala
    mediante `npm-pack:`, verifica la dependencia bajo la raíz del proyecto npm
    administrado y luego pide a un modelo OpenAI en vivo que llame a la herramienta del plugin y
    devuelva el slug oculto.
- Smoke del comando de rescate de Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Comprobación opt-in de doble seguridad para la superficie del comando de rescate del canal de mensajes.
    Ejercita `/crestodian status`, pone en cola un cambio persistente de modelo,
    responde `/crestodian yes` y verifica la ruta de escritura de auditoría/configuración.
- Smoke Docker del planificador de Crestodian: `pnpm test:docker:crestodian-planner`
  - Ejecuta Crestodian en un contenedor sin configuración con una CLI falsa de Claude en
    `PATH` y verifica que el fallback difuso del planificador se traduzca en una
    escritura de configuración tipada y auditada.
- Smoke Docker de primera ejecución de Crestodian: `pnpm test:docker:crestodian-first-run`
  - Parte de un directorio de estado de OpenClaw vacío, verifica el entrypoint moderno de onboard
    de Crestodian, aplica escrituras de configuración/modelo/agente/plugin de Discord +
    SecretRef, valida la configuración y verifica entradas de auditoría. La misma
    ruta de configuración Ring 0 también está cubierta en QA Lab por
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de costo Moonshot/Kimi: con `MOONSHOT_API_KEY` configurado, ejecuta
  `openclaw models list --provider moonshot --json`; luego ejecuta un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  aislado contra `moonshot/kimi-k2.6`. Verifica que el JSON informe Moonshot/K2.6 y que la
  transcripción del asistente almacene `usage.cost` normalizado.

<Tip>
Cuando solo necesites un caso fallido, prefiere acotar las pruebas en vivo mediante las variables de entorno de allowlist descritas abajo.
</Tip>

## Ejecutores específicos de QA

Estos comandos acompañan a las suites de pruebas principales cuando necesitas realismo de QA-lab.

CI ejecuta QA Lab en flujos de trabajo dedicados. La paridad agentic está anidada bajo
`QA-Lab - All Lanes` y validación de release, no como un flujo de trabajo de PR independiente.
La validación amplia debe usar `Full Release Validation` con
`rerun_group=qa-parity` o el grupo de QA de release-checks. Las comprobaciones de release
estables/predeterminadas mantienen el soak exhaustivo live/Docker detrás de `run_release_soak=true`; el
perfil `full` fuerza soak. `QA-Lab - All Lanes` se ejecuta cada noche en `main` y
desde despacho manual con el carril de paridad mock, el carril live Matrix,
el carril live Telegram administrado por Convex y el carril live Discord administrado por Convex como
jobs paralelos. QA programado y release checks pasan Matrix `--profile fast`
explícitamente, mientras que la entrada predeterminada de la CLI Matrix y el flujo manual sigue siendo
`all`; el despacho manual puede fragmentar `all` en jobs `transport`, `media`,
`e2ee-smoke`, `e2ee-deep` y `e2ee-cli`. `OpenClaw Release Checks` ejecuta
paridad más los carriles rápidos de Matrix y Telegram antes de la aprobación del release, usando
`mock-openai/gpt-5.5` para comprobaciones de transporte de release, de modo que permanezcan deterministas
y eviten el arranque normal del plugin de proveedor. Estos gateways de transporte en vivo
desactivan la búsqueda de memoria; el comportamiento de memoria sigue cubierto por las suites de paridad de QA.

Los shards de medios en vivo de release completo usan
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, que ya tiene
`ffmpeg` y `ffprobe`. Los shards Docker de modelo/backend en vivo usan la imagen compartida
`ghcr.io/openclaw/openclaw-live-test:<sha>` construida una vez por commit
seleccionado, y luego la descargan con `OPENCLAW_SKIP_DOCKER_BUILD=1` en lugar de reconstruirla
dentro de cada shard.

- `pnpm openclaw qa suite`
  - Ejecuta escenarios de QA respaldados por el repositorio directamente en el host.
  - Escribe artefactos de nivel superior `qa-evidence.json`, `qa-suite-summary.json` y
    `qa-suite-report.md` para el conjunto de escenarios seleccionado, incluidas
    selecciones de escenarios de flujo mixto, Vitest y Playwright.
  - Cuando lo despacha `pnpm openclaw qa run --qa-profile <profile>`, inserta
    el scorecard del perfil de taxonomía seleccionado en el mismo `qa-evidence.json`.
    `smoke-ci` escribe evidencia reducida (`evidenceMode: "slim"`, sin
    `execution` por entrada). `release` cubre el segmento seleccionado de preparación
    para lanzamiento; `all` selecciona todas las categorías de madurez activas y apunta
    a despachos explícitos del flujo de trabajo QA Profile Evidence cuando se necesita
    un artefacto de scorecard completo.
  - Ejecuta varios escenarios seleccionados en paralelo de forma predeterminada con
    workers de gateway aislados. `qa-channel` usa concurrencia 4 de forma predeterminada
    (limitada por el recuento de escenarios seleccionado). Usa `--concurrency <count>` para ajustar
    el recuento de workers, o `--concurrency 1` para la vía serial anterior.
  - Sale con código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` para
    obtener artefactos sin un código de salida fallido.
  - Admite los modos de proveedor `live-frontier`, `mock-openai` y `aimock`.
    `aimock` inicia un servidor de proveedor local respaldado por AIMock para cobertura experimental
    de fixtures y simulación de protocolo sin reemplazar la vía `mock-openai`
    consciente de escenarios.
- `pnpm openclaw qa coverage --match <query>`
  - Busca en IDs de escenarios, títulos, superficies, IDs de cobertura, refs de docs, refs de código,
    plugins y requisitos de proveedor, y luego imprime los destinos de suite
    coincidentes.
  - Usa esto antes de una ejecución de QA Lab cuando conoces el comportamiento tocado o la ruta de archivo,
    pero no el escenario más pequeño. Solo es orientativo: aun así elige prueba mock,
    live, Multipass, Matrix o de transporte según el comportamiento que se esté
    cambiando.
- `pnpm test:plugins:kitchen-sink-live`
  - Ejecuta la batería live del Plugin OpenAI Kitchen Sink a través de QA Lab.
    Instala el paquete externo Kitchen Sink, verifica el inventario de superficie
    del SDK de plugin, sondea `/healthz` y `/readyz`, registra evidencia de
    CPU/RSS del Gateway, ejecuta un turno live de OpenAI y comprueba diagnósticos
    adversariales. Requiere autenticación live de OpenAI, como `OPENAI_API_KEY`. En
    sesiones Testbox hidratadas, carga automáticamente el perfil de autenticación live
    de Testbox cuando el helper `openclaw-testbox-env` está presente.
- `pnpm test:gateway:cpu-scenarios`
  - Ejecuta el banco de arranque del gateway más un pequeño paquete de escenarios mock de QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) y escribe un resumen combinado de observación de CPU
    en `.artifacts/gateway-cpu-scenarios/`.
  - Marca solo observaciones sostenidas de CPU caliente de forma predeterminada (`--cpu-core-warn`,
    predeterminado `0.9`; `--hot-wall-warn-ms`, predeterminado `30000`), por lo que las ráfagas
    cortas de arranque se registran como métricas sin parecerse a la regresión de
    gateway fijado durante minutos.
  - Se ejecuta contra artefactos `dist` compilados; ejecuta una compilación primero cuando la copia de trabajo
    aún no tenga salida de runtime reciente.
- `pnpm openclaw qa suite --runner multipass`
  - Ejecuta la misma suite de QA dentro de una VM Linux desechable de Multipass, manteniendo
    las mismas flags de selección de escenarios y proveedor/modelo que `qa suite`.
  - Las ejecuciones live reenvían las entradas de autenticación de QA prácticas para el invitado:
    claves de proveedor basadas en env, la ruta de configuración de proveedor live de QA y
    `CODEX_HOME` cuando está presente.
  - Los directorios de salida deben permanecer bajo la raíz del repositorio para que el invitado pueda escribir de vuelta
    a través del workspace montado.
  - Escribe el informe y resumen normales de QA más los logs de Multipass en
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia el sitio de QA respaldado por Docker para trabajo de QA con estilo de operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Compila un tarball npm desde la copia de trabajo actual, lo instala globalmente en
    Docker, ejecuta onboarding no interactivo con clave de API de OpenAI, configura
    Telegram de forma predeterminada, verifica que el runtime del plugin empaquetado carga sin
    reparación de dependencias al arrancar, ejecuta doctor y ejecuta un turno de agente local
    contra un endpoint de OpenAI simulado.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para ejecutar la misma vía de instalación empaquetada
    con Discord.
- `pnpm test:docker:session-runtime-context`
  - Ejecuta un smoke determinista en Docker de la app compilada para transcripciones de contexto de runtime
    incrustado. Verifica que el contexto de runtime oculto de OpenClaw persiste como un
    mensaje personalizado no visible en lugar de filtrarse al turno visible del usuario,
    luego siembra un JSONL de sesión rota afectada y verifica que
    `openclaw doctor --fix` lo reescribe a la rama activa con una copia de seguridad.
- `pnpm test:docker:npm-telegram-live`
  - Instala un candidato de paquete OpenClaw en Docker, ejecuta onboarding de paquete instalado,
    configura Telegram a través de la CLI instalada y luego reutiliza
    la vía live de QA de Telegram con ese paquete instalado como Gateway SUT.
  - El wrapper monta solo el código fuente del harness `qa-lab` desde la copia de trabajo;
    el paquete instalado es dueño de `dist`, `openclaw/plugin-sdk` y del runtime
    de plugins incluidos, por lo que la vía no mezcla plugins de la copia de trabajo actual
    en el paquete bajo prueba.
  - Usa `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` de forma predeterminada; define
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` o
    `OPENCLAW_CURRENT_PACKAGE_TGZ` para probar un tarball local resuelto en lugar
    de instalar desde el registro.
  - Emite temporización RTT repetida en `qa-evidence.json` de forma predeterminada con
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Sobrescribe
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` o
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` para ajustar la ejecución.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` acepta una lista separada por comas de
    IDs de comprobaciones de QA de Telegram para muestrear; cuando no está definido, la comprobación
    predeterminada compatible con RTT es `telegram-mentioned-message-reply`.
  - Usa las mismas credenciales env de Telegram o la fuente de credenciales Convex que
    `pnpm openclaw qa telegram`. Para automatización de CI/lanzamiento, define
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` junto con
    `OPENCLAW_QA_CONVEX_SITE_URL` y un secreto de rol. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` y un secreto de rol Convex están presentes en
    CI, el wrapper de Docker selecciona Convex automáticamente.
  - El wrapper valida el env de credenciales de Telegram o Convex en el host
    antes del trabajo de compilación/instalación de Docker. Define
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` solo cuando
    depures deliberadamente la configuración previa a credenciales.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sobrescribe
    el `OPENCLAW_QA_CREDENTIAL_ROLE` compartido solo para esta vía. Cuando se seleccionan
    credenciales Convex y no se define ningún rol, el wrapper usa `ci` en CI
    y `maintainer` fuera de CI.
  - GitHub Actions expone esta vía como el flujo de trabajo manual de maintainer
    `NPM Telegram Beta E2E`. No se ejecuta al fusionar. El flujo de trabajo usa el
    entorno `qa-live-shared` y leases de credenciales CI de Convex.
- GitHub Actions también expone `Package Acceptance` para prueba de producto en ejecución lateral
  contra un paquete candidato. Acepta una ref de Git, spec npm publicada,
  URL HTTPS de tarball más SHA-256, política de URL confiable o artefacto tarball
  de otra ejecución (`source=ref|npm|url|trusted-url|artifact`), sube el
  `openclaw-current.tgz` normalizado como `package-under-test` y luego ejecuta el
  planificador Docker E2E existente con perfiles de vía `smoke`, `package`, `product`, `full`
  o `custom`. Define `telegram_mode=mock-openai` o
  `live-frontier` para ejecutar el flujo de trabajo de QA de Telegram contra el mismo
  artefacto `package-under-test`.
  - Prueba de producto de la beta más reciente:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- La prueba de URL exacta de tarball requiere un digest y usa la política de seguridad de URL pública:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Los mirrors empresariales/privados de tarball usan una política explícita de fuente confiable:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` lee `.github/package-trusted-sources.json` desde la ref confiable del flujo de trabajo y no acepta credenciales de URL ni una omisión de red privada mediante entrada de flujo de trabajo. Si la política nombrada declara autenticación bearer, configura el secreto fijo `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- La prueba con artefacto descarga un artefacto tarball desde otra ejecución de Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Empaqueta e instala la compilación actual de OpenClaw en Docker, inicia el
    Gateway con OpenAI configurado y luego habilita los canales/plugins incluidos mediante
    ediciones de configuración.
  - Verifica que el descubrimiento de setup deje ausentes los plugins descargables no configurados,
    que la primera reparación doctor configurada instale explícitamente cada
    plugin descargable faltante y que un segundo reinicio no ejecute
    reparación de dependencias oculta.
  - También instala una base npm anterior conocida, habilita Telegram antes de
    ejecutar `openclaw update --tag <candidate>` y verifica que el
    doctor posterior a la actualización del candidato limpia restos de dependencias de plugins heredados
    sin una reparación postinstall del lado del harness.
- `pnpm test:parallels:npm-update`
  - Ejecuta el smoke nativo de actualización de instalación empaquetada en invitados de Parallels.
    Cada plataforma seleccionada instala primero el paquete base solicitado,
    luego ejecuta el comando `openclaw update` instalado en el mismo invitado y
    verifica la versión instalada, el estado de actualización, la preparación del gateway y
    un turno de agente local.
  - Usa `--platform macos`, `--platform windows` o `--platform linux`
    mientras iteras sobre un invitado. Usa `--json` para la ruta del artefacto de resumen
    y el estado por vía.
  - La vía OpenAI usa `openai/gpt-5.5` para la prueba live de turno de agente de forma
    predeterminada. Pasa `--model <provider/model>` o define
    `OPENCLAW_PARALLELS_OPENAI_MODEL` para validar otro modelo de OpenAI.
  - Envuelve ejecuciones locales largas en un timeout de host para que los bloqueos del transporte
    de Parallels no consuman el resto de la ventana de pruebas:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - El script escribe logs de vías anidados en
    `/tmp/openclaw-parallels-npm-update.*`. Inspecciona `windows-update.log`,
    `macos-update.log` o `linux-update.log` antes de asumir que el wrapper externo
    está colgado.
  - La actualización de Windows puede pasar de 10 a 15 minutos en doctor posterior a la actualización y
    trabajo de actualización de paquetes en un invitado frío; eso sigue siendo saludable cuando el
    log de depuración npm anidado está avanzando.
  - No ejecutes este wrapper agregado en paralelo con vías smoke individuales de Parallels
    macOS, Windows o Linux. Comparten estado de VM y pueden
    colisionar en la restauración de snapshots, el servicio de paquetes o el estado de gateway del invitado.
  - La prueba posterior a la actualización ejecuta la superficie normal de plugins incluidos porque
    las fachadas de capacidad como voz, generación de imágenes y comprensión de medios
    cargan a través de APIs de runtime incluidas incluso cuando el turno de agente
    en sí solo comprueba una respuesta de texto simple.

- `pnpm openclaw qa aimock`
  - Inicia solo el servidor local del proveedor AIMock para pruebas de humo
    directas del protocolo.
- `pnpm openclaw qa matrix`
  - Ejecuta el carril de QA en vivo de Matrix contra un servidor doméstico
    Tuwunel desechable respaldado por Docker. Solo checkout de código fuente:
    las instalaciones empaquetadas no incluyen `qa-lab`.
  - CLI completa, catálogo de perfiles/escenarios, variables de entorno y
    diseño de artefactos: [QA de Matrix](/es/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Ejecuta el carril de QA en vivo de Telegram contra un grupo privado real
    usando los tokens del bot controlador y del bot SUT desde el entorno.
  - Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. El id del grupo debe ser el id
    numérico del chat de Telegram.
  - Admite `--credential-source convex` para credenciales compartidas agrupadas.
    Usa el modo env de forma predeterminada, o define
    `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases agrupados.
  - Los valores predeterminados cubren canary, puerta de menciones,
    direccionamiento de comandos, `/status`, respuestas mencionadas de bot a
    bot y respuestas a comandos nativos centrales. Los valores predeterminados
    de `mock-openai` también cubren regresiones deterministas de cadena de
    respuestas y streaming de mensaje final de Telegram. Usa `--list-scenarios`
    para sondeos opcionales como `session_status`.
  - Sale con código distinto de cero cuando falla cualquier escenario. Usa
    `--allow-failures` para artefactos sin un código de salida fallido.
  - Requiere dos bots distintos en el mismo grupo privado, con el bot SUT
    exponiendo un nombre de usuario de Telegram.
  - Para una observación estable de bot a bot, habilita Bot-to-Bot Communication Mode
    en `@BotFather` para ambos bots y asegúrate de que el bot controlador pueda
    observar el tráfico de bots del grupo.
  - Escribe un informe de QA de Telegram, un resumen y `qa-evidence.json` en
    `.artifacts/qa-e2e/...`. Los escenarios con respuesta incluyen RTT desde
    la solicitud de envío del controlador hasta la respuesta observada del SUT.

`Mantis Telegram Live` es el contenedor de evidencia de PR alrededor de este
carril. Ejecuta la referencia candidata con credenciales de Telegram arrendadas
por Convex, renderiza el paquete de informe/evidencia de QA redactado en un
navegador de escritorio de Crabbox, graba evidencia MP4, genera un GIF recortado
por movimiento, sube el paquete de artefactos y publica evidencia inline en el
PR mediante la Mantis GitHub App cuando `pr_number` está definido. Los
maintainers pueden iniciarlo desde la interfaz de Actions mediante
`Mantis Scenario` (`scenario_id: telegram-live`) o directamente desde un
comentario de pull request:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` es el contenedor agentic nativo de Telegram Desktop
antes/después para prueba visual de PR. Inícialo desde la interfaz de Actions
con `instructions` libres, mediante `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) o desde un comentario de PR:

```text
@openclaw-mantis telegram desktop proof
```

El agente Mantis lee el PR, decide qué comportamiento visible en Telegram prueba
el cambio, ejecuta el carril de prueba de Telegram Desktop con usuario real en
Crabbox en las referencias base y candidata, itera hasta que los GIF nativos son
útiles, escribe un manifiesto `motionPreview` pareado y publica la misma tabla
de GIF de 2 columnas mediante la Mantis GitHub App cuando `pr_number` está
definido.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Arrienda o reutiliza un escritorio Linux de Crabbox, instala Telegram
    Desktop nativo, configura OpenClaw con un token de bot SUT de Telegram
    arrendado, inicia el gateway y graba evidencia de captura de pantalla/MP4
    desde el escritorio VNC visible.
  - Usa `--credential-source convex` de forma predeterminada para que los
    workflows solo necesiten el secreto del broker de Convex. Usa
    `--credential-source env` con las mismas variables
    `OPENCLAW_QA_TELEGRAM_*` que `pnpm openclaw qa telegram`.
  - Telegram Desktop aún necesita un inicio de sesión/perfil de usuario. El
    token de bot configura solo OpenClaw. Usa
    `--telegram-profile-archive-env <name>` para un archivo de perfil `.tgz`
    en base64, o usa `--keep-lease` e inicia sesión manualmente mediante VNC
    una vez.
  - Escribe `mantis-telegram-desktop-builder-report.md`,
    `mantis-telegram-desktop-builder-summary.json`,
    `telegram-desktop-builder.png` y `telegram-desktop-builder.mp4` en el
    directorio de salida.

Los carriles de transporte en vivo comparten un contrato estándar para que los
nuevos transportes no diverjan; la matriz de cobertura por carril vive en
[Resumen de QA - Cobertura de transporte en vivo](/es/concepts/qa-e2e-automation#live-transport-coverage).
`qa-channel` es la suite sintética amplia y no forma parte de esa matriz.

### Credenciales compartidas de Telegram mediante Convex (v1)

Cuando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)
está habilitado para QA de transporte en vivo, QA lab adquiere un lease exclusivo
de un pool respaldado por Convex, envía heartbeats para ese lease mientras el
carril se está ejecutando y libera el lease al apagarse. El nombre de la sección
es anterior al soporte de Discord, Slack y WhatsApp; el contrato de lease se
comparte entre tipos.

Andamiaje del proyecto de referencia de Convex: `qa/convex-credential-broker/`

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
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de seguimiento opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URL de Convex `http://` de local loopback solo para desarrollo local.

`OPENCLAW_QA_CONVEX_SITE_URL` debe usar `https://` en funcionamiento normal.

Los comandos de administración de maintainer (agregar/quitar/listar pool)
requieren específicamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Ayudantes de CLI para maintainers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `doctor` antes de ejecuciones en vivo para comprobar la URL del sitio
Convex, secretos del broker, prefijo del endpoint, timeout HTTP y alcance de
admin/list sin imprimir valores secretos. Usa `--json` para salida legible por
máquina en scripts y utilidades de CI.

Contrato de endpoint predeterminado (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`).
Las solicitudes se autentican con un encabezado `Authorization: Bearer <role secret>`;
los cuerpos siguientes omiten ese encabezado:

- `POST /acquire`
  - Solicitud: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Éxito: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Agotado/reintentable: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Solicitud: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Éxito: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Solicitud: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Éxito: `{ status: "ok" }` (o `2xx` vacío)
- `POST /release`
  - Solicitud: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Éxito: `{ status: "ok" }` (o `2xx` vacío)
- `POST /admin/add` (solo secreto de maintainer)
  - Solicitud: `{ kind, actorId, payload, note?, status? }`
  - Éxito: `{ status: "ok", credential }`
- `POST /admin/remove` (solo secreto de maintainer)
  - Solicitud: `{ credentialId, actorId }`
  - Éxito: `{ status: "ok", changed, credential }`
  - Guarda de lease activo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo secreto de maintainer)
  - Solicitud: `{ kind?, status?, includePayload?, limit? }`
  - Éxito: `{ status: "ok", credentials, count }`

Forma de payload para el tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` debe ser una cadena de id numérico de chat de Telegram.
- `admin/add` valida esta forma para `kind: "telegram"` y rechaza payloads mal formados.

Forma de payload para el tipo de usuario real de Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` y `telegramApiId` deben ser cadenas numéricas.
- `tdlibArchiveSha256` y `desktopTdataArchiveSha256` deben ser cadenas hexadecimales SHA-256.
- `kind: "telegram-user"` está reservado para el workflow de prueba de Telegram Desktop de Mantis. Los carriles genéricos de QA Lab no deben adquirirlo.

Payloads multicanal validados por el broker:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Los carriles de Slack también pueden arrendar desde el pool, pero la validación
del payload de Slack actualmente vive en el runner de QA de Slack en lugar del
broker. Usa
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
para filas de Slack.

### Agregar un canal a QA

La arquitectura y los nombres de ayudantes de escenario para nuevos adaptadores
de canal viven en
[Resumen de QA - Agregar un canal](/es/concepts/qa-e2e-automation#adding-a-channel).
El listón mínimo: implementar el runner de transporte en la costura de host
compartida de `qa-lab`, declarar `qaRunners` en el manifiesto del plugin,
montar como `openclaw qa <runner>` y crear escenarios en `qa/scenarios/`.

## Suites de pruebas (qué se ejecuta dónde)

Piensa en las suites como “realismo creciente” (y mayor inestabilidad/coste).

### Unitarias / integración (predeterminado)

- Comando: `pnpm test`
- Configuración: las ejecuciones no dirigidas usan el conjunto de shards
  `vitest.full-*.config.ts` y pueden expandir shards multiproyecto en
  configuraciones por proyecto para planificación paralela
- Archivos: inventarios core/unit bajo `src/**/*.test.ts`,
  `packages/**/*.test.ts` y `test/**/*.test.ts`; las pruebas unitarias de UI
  se ejecutan en el shard dedicado `unit-ui`
- Alcance:
  - Pruebas unitarias puras
  - Pruebas de integración en proceso (autenticación de gateway, enrutamiento, tooling, parsing, configuración)
  - Regresiones deterministas para bugs conocidos
- Expectativas:
  - Se ejecuta en CI
  - No requiere claves reales
  - Debe ser rápido y estable
  - Las pruebas del resolvedor y del cargador de superficie pública deben
    probar el comportamiento de fallback amplio de `api.js` y `runtime-api.js`
    con fixtures diminutos de plugin generados, no APIs reales de código
    fuente de plugins incluidos. Las cargas de API de plugins reales pertenecen
    a suites de contrato/integración propiedad del plugin.

Política de dependencias nativas:

- Las instalaciones de prueba predeterminadas omiten las compilaciones
  opcionales nativas de opus de Discord. La voz de Discord usa `libopus-wasm`
  incluido, y `@discordjs/opus` permanece deshabilitado en `allowBuilds` para
  que las pruebas locales y los carriles de Testbox no compilen el addon
  nativo.
- Compara el rendimiento de opus nativo en el repo de benchmark de
  `libopus-wasm`, no en los bucles predeterminados de instalación/prueba de
  OpenClaw. No establezcas `@discordjs/opus` en `true` en el `allowBuilds`
  predeterminado; eso hace que bucles de instalación/prueba no relacionados
  compilen código nativo.

<AccordionGroup>
  <Accordion title="Proyectos, shards y carriles con alcance">

    - `pnpm test` sin objetivo ejecuta trece configuraciones de fragmentos más pequeñas (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-tooling`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) en lugar de un único proceso nativo gigante del proyecto raíz. Esto reduce el RSS máximo en máquinas cargadas y evita que el trabajo de auto-reply/Plugin prive de recursos a suites no relacionadas.
    - `pnpm test --watch` sigue usando el grafo de proyectos raíz nativo `vitest.config.ts`, porque un bucle de observación multifragmento no es práctico.
    - `pnpm test`, `pnpm test:watch` y `pnpm test:perf:imports` enrutan primero los objetivos explícitos de archivo/directorio por carriles con ámbito, de modo que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar el coste completo de arranque del proyecto raíz.
    - `pnpm test:changed` expande de forma predeterminada las rutas git cambiadas en carriles con ámbito baratos: ediciones directas de tests, archivos hermanos `*.test.ts`, asignaciones explícitas de código fuente y dependientes locales del grafo de importaciones. Las ediciones de config/setup/package no ejecutan tests de forma amplia salvo que uses explícitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` es la puerta normal de comprobación local inteligente para trabajo acotado. Clasifica el diff en core, tests de core, extensions, tests de extension, apps, docs, metadatos de release, tooling de Docker en vivo y tooling, y luego ejecuta los comandos de typecheck, lint y guard correspondientes. No ejecuta tests de Vitest; llama a `pnpm test:changed` o a un `pnpm test <target>` explícito para pruebas de test. Los incrementos de versión que solo afectan a metadatos de release ejecutan comprobaciones dirigidas de versión/config/dependencias raíz, con un guard que rechaza cambios de package fuera del campo de versión de nivel superior.
    - Las ediciones del harness ACP de Docker en vivo ejecutan comprobaciones enfocadas: sintaxis de shell para los scripts de autenticación de Docker en vivo y una ejecución en seco del scheduler de Docker en vivo. Los cambios de `package.json` se incluyen solo cuando el diff se limita a `scripts["test:docker:live-*"]`; las ediciones de dependencias, exports, versión y otras superficies de package siguen usando los guards más amplios.
    - Los tests unitarios ligeros en importaciones de agentes, comandos, plugins, helpers de auto-reply, `plugin-sdk` y áreas similares de utilidades puras se enrutan por el carril `unit-fast`, que omite `test/setup-openclaw-runtime.ts`; los archivos con estado o cargados de runtime permanecen en los carriles existentes.
    - Algunos archivos fuente helper de `plugin-sdk` y `commands` también asignan las ejecuciones en modo changed a tests hermanos explícitos en esos carriles ligeros, de modo que las ediciones de helpers evitan volver a ejecutar toda la suite pesada de ese directorio.
    - `auto-reply` tiene grupos dedicados para helpers de core de nivel superior, tests de integración `reply.*` de nivel superior y el subárbol `src/auto-reply/reply/**`. CI divide además el subárbol reply en fragmentos de agent-runner, dispatch y commands/state-routing para que un grupo pesado en importaciones no posea toda la cola de Node.
    - La CI normal de PR/main omite intencionadamente el barrido por lotes de Plugins incluidos y el fragmento `agentic-plugins` solo de release. Full Release Validation despacha el workflow hijo separado `Plugin Prerelease` para esas suites pesadas en Plugins en candidatos de release.

  </Accordion>

  <Accordion title="Cobertura del runner embebido">

    - Cuando cambies las entradas de descubrimiento de message-tool o el contexto
      de runtime de Compaction, mantén ambos niveles de cobertura.
    - Añade regresiones enfocadas de helpers para límites puros de enrutamiento
      y normalización.
    - Mantén saludables las suites de integración del runner embebido:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` y
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Esas suites verifican que los ids con ámbito y el comportamiento de Compaction sigan fluyendo
      por las rutas reales `run.ts` / `compact.ts`; los tests solo de helpers
      no son un sustituto suficiente para esas rutas de integración.

  </Accordion>

  <Accordion title="Valores predeterminados de pool y aislamiento de Vitest">

    - La config base de Vitest usa `threads` de forma predeterminada.
    - La config compartida de Vitest fija `isolate: false` y usa el
      runner no aislado en los proyectos raíz, e2e y configs en vivo.
    - El carril UI raíz conserva su setup y optimizador `jsdom`, pero también
      se ejecuta en el runner compartido no aislado.
    - Cada fragmento de `pnpm test` hereda los mismos valores predeterminados
      `threads` + `isolate: false` de la config compartida de Vitest.
    - `scripts/run-vitest.mjs` añade `--no-maglev` para los procesos Node hijos
      de Vitest de forma predeterminada para reducir el churn de compilación de V8 durante ejecuciones locales grandes.
      Define `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar con el comportamiento
      V8 estándar.
    - `scripts/run-vitest.mjs` termina las ejecuciones explícitas de Vitest sin watch
      tras 5 minutos sin salida por stdout ni stderr. Define
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` para desactivar el watchdog en
      una investigación intencionadamente silenciosa.

  </Accordion>

  <Accordion title="Iteración local rápida">

    - `pnpm changed:lanes` muestra qué carriles arquitectónicos activa un diff.
    - El hook de pre-commit solo formatea. Vuelve a preparar los archivos formateados
      y no ejecuta lint, typecheck ni tests.
    - Ejecuta `pnpm check:changed` explícitamente antes de entregar o hacer push cuando
      necesites la puerta de comprobación local inteligente.
    - `pnpm test:changed` se enruta por carriles con ámbito baratos de forma predeterminada. Usa
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el agente
      decida que una edición de harness, config, package o contrato realmente necesita
      cobertura Vitest más amplia.
    - `pnpm test:max` y `pnpm test:changed:max` conservan el mismo comportamiento
      de enrutamiento, solo con un límite de workers más alto.
    - El autoescalado de workers locales es intencionadamente conservador y reduce
      la carga cuando el promedio de carga del host ya es alto, por lo que varias
      ejecuciones simultáneas de Vitest causan menos daño de forma predeterminada.
    - La config base de Vitest marca los proyectos/archivos de config como
      `forceRerunTriggers` para que las reejecuciones en modo changed sigan siendo correctas cuando cambie el cableado de tests.
    - La config mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado en
      hosts compatibles; define `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`
      para una ubicación explícita de caché para perfilado directo.

  </Accordion>

  <Accordion title="Depuración de rendimiento">

    - `pnpm test:perf:imports` habilita el reporte de duración de importaciones de Vitest más
      salida de desglose de importaciones.
    - `pnpm test:perf:imports:changed` acota la misma vista de perfilado a
      los archivos cambiados desde `origin/main`.
    - Los datos de tiempos de fragmentos se escriben en `.artifacts/vitest-shard-timings.json`.
      Las ejecuciones de config completa usan la ruta de config como clave; los fragmentos CI
      con patrón de inclusión añaden el nombre del fragmento para que los fragmentos filtrados puedan rastrearse
      por separado.
    - Cuando un test caliente aún dedica la mayor parte de su tiempo a importaciones de arranque,
      mantén las dependencias pesadas detrás de una interfaz local estrecha `*.runtime.ts` y
      mockea esa interfaz directamente en lugar de importar profundamente helpers de runtime
      solo para pasarlos por `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara el
      `test:changed` enrutado con la ruta nativa del proyecto raíz para ese
      diff confirmado y muestra el tiempo de pared más el RSS máximo de macOS.
    - `pnpm test:perf:changed:bench -- --worktree` compara el árbol sucio
      actual enrutando la lista de archivos cambiados por
      `scripts/test-projects.mjs` y la config raíz de Vitest.
    - `pnpm test:perf:profile:main` escribe un perfil de CPU del hilo principal para
      el overhead de arranque y transformación de Vitest/Vite.
    - `pnpm test:perf:profile:runner` escribe perfiles de CPU+heap del runner para
      la suite unitaria con el paralelismo de archivos desactivado.

  </Accordion>
</AccordionGroup>

### Estabilidad (gateway)

- Comando: `pnpm test:stability:gateway`
- Config: `test/vitest/vitest.gateway.config.ts`, `test/vitest/vitest.logging.config.ts` y `test/vitest/vitest.infra.config.ts`, cada uno forzado a un worker
- Alcance:
  - Inicia un Gateway loopback real con diagnósticos habilitados de forma predeterminada
  - Impulsa churn sintético de mensajes de gateway, memoria y payloads grandes por la ruta de eventos de diagnóstico
  - Consulta `diagnostics.stability` sobre el RPC WS del Gateway
  - Cubre helpers de persistencia del bundle de estabilidad diagnóstica
  - Afirma que el recorder permanece acotado, las muestras RSS sintéticas se mantienen por debajo del presupuesto de presión y las profundidades de cola por sesión vuelven a cero
- Expectativas:
  - Seguro para CI y sin claves
  - Carril estrecho para seguimiento de regresiones de estabilidad, no sustituto de la suite completa de Gateway

### E2E (agregado del repo)

- Comando: `pnpm test:e2e`
- Alcance:
  - Ejecuta el carril E2E de smoke de gateway
  - Ejecuta el carril E2E de navegador con mocks de Control UI
- Expectativas:
  - Seguro para CI y sin claves
  - Requiere que Playwright Chromium esté instalado

### E2E (smoke de gateway)

- Comando: `pnpm test:e2e:gateway`
- Config: `test/vitest/vitest.e2e.config.ts`
- Archivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` y tests E2E de Plugins incluidos bajo `extensions/`
- Valores predeterminados de runtime:
  - Usa `threads` de Vitest con `isolate: false`, igual que el resto del repo.
  - Usa workers adaptativos (CI: hasta 2, local: 1 de forma predeterminada).
  - Se ejecuta en modo silencioso de forma predeterminada para reducir el overhead de E/S de consola.
- Overrides útiles:
  - `OPENCLAW_E2E_WORKERS=<n>` para forzar el número de workers (limitado a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para volver a habilitar salida detallada de consola.
- Alcance:
  - Comportamiento de extremo a extremo de gateway multiinstancia
  - Superficies WebSocket/HTTP, emparejamiento de nodos y networking más pesado
- Expectativas:
  - Se ejecuta en CI (cuando está habilitado en el pipeline)
  - No requiere claves reales
  - Más partes móviles que los tests unitarios (puede ser más lento)

### E2E (navegador con mocks de Control UI)

- Comando: `pnpm test:ui:e2e`
- Config: `test/vitest/vitest.ui-e2e.config.ts`
- Archivos: `ui/src/**/*.e2e.test.ts`
- Alcance:
  - Inicia la Control UI de Vite
  - Conduce una página Chromium real mediante Playwright
  - Sustituye el WebSocket del Gateway por mocks deterministas en el navegador
- Expectativas:
  - Se ejecuta en CI como parte de `pnpm test:e2e`
  - No requiere Gateway, agentes ni claves de proveedor reales
  - La dependencia de navegador debe estar presente (`pnpm --dir ui exec playwright install chromium`)

### E2E: smoke del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Archivo: `extensions/openshell/src/backend.e2e.test.ts`
- Alcance:
  - Reutiliza un gateway OpenShell local activo
  - Crea un sandbox desde un Dockerfile local temporal
  - Ejercita el backend OpenShell de OpenClaw sobre `sandbox ssh-config` + ejecución SSH reales
  - Verifica el comportamiento de filesystem canónico remoto mediante el puente fs del sandbox
- Expectativas:
  - Solo opt-in; no forma parte de la ejecución predeterminada de `pnpm test:e2e`
  - Requiere una CLI `openshell` local más un daemon Docker funcional
  - Requiere un gateway OpenShell local activo y su origen de config
  - Usa `HOME` / `XDG_CONFIG_HOME` aislados y luego destruye el sandbox de test
- Overrides útiles:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar el test al ejecutar manualmente la suite e2e más amplia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apuntar a un binario CLI no predeterminado o script wrapper
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` para exponer la config de gateway registrada al test aislado
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` para sobrescribir la IP del gateway Docker usada por la fixture de política del host

### En vivo (proveedores reales + modelos reales)

- Comando: `pnpm test:live`
- Configuración: `test/vitest/vitest.live.config.ts`
- Archivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` y pruebas en vivo de plugins incluidos bajo `extensions/`
- Valor predeterminado: **habilitado** por `pnpm test:live` (establece `OPENCLAW_LIVE_TEST=1`)
- Alcance:
  - "¿Este proveedor/modelo realmente funciona _hoy_ con credenciales reales?"
  - Detectar cambios de formato del proveedor, particularidades de invocación de herramientas, problemas de autenticación y comportamiento de límites de tasa
- Expectativas:
  - No es estable para CI por diseño (redes reales, políticas reales de proveedores, cuotas, interrupciones)
  - Cuesta dinero / usa límites de tasa
  - Prefiere ejecutar subconjuntos acotados en lugar de "todo"
- Las ejecuciones en vivo usan claves de API ya exportadas y perfiles de autenticación preparados.
- De forma predeterminada, las ejecuciones en vivo siguen aislando `HOME` y copian el material de configuración/autenticación en un directorio home de prueba temporal para que las fixtures unitarias no puedan mutar tu `~/.openclaw` real.
- Establece `OPENCLAW_LIVE_USE_REAL_HOME=1` solo cuando necesites intencionalmente que las pruebas en vivo usen tu directorio home real.
- `pnpm test:live` usa de forma predeterminada un modo más silencioso: conserva la salida de progreso `[live] ...` y silencia los registros de arranque del gateway/el ruido de Bonjour. Establece `OPENCLAW_LIVE_TEST_QUIET=0` si quieres recuperar los registros completos de inicio.
- Rotación de claves de API (específica del proveedor): establece `*_API_KEYS` con formato separado por comas/punto y coma o `*_API_KEY_1`, `*_API_KEY_2` (por ejemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) o una anulación por ejecución en vivo mediante `OPENCLAW_LIVE_*_KEY`; las pruebas reintentan ante respuestas de límite de tasa.
- Salida de progreso/Heartbeat:
  - Las suites en vivo emiten líneas de progreso a stderr para que las llamadas largas al proveedor se vean activas incluso cuando la captura de consola de Vitest está silenciosa.
  - `test/vitest/vitest.live.config.ts` deshabilita la interceptación de consola de Vitest para que las líneas de progreso del proveedor/Gateway se transmitan inmediatamente durante las ejecuciones en vivo.
  - Ajusta los Heartbeat de modelos directos con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajusta los Heartbeat de Gateway/sonda con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## ¿Qué suite debo ejecutar?

Usa esta tabla de decisión:

- Al editar lógica/pruebas: ejecuta `pnpm test` (y `pnpm test:coverage` si cambiaste mucho)
- Al tocar redes del Gateway / protocolo WS / emparejamiento: añade `pnpm test:e2e`
- Al depurar "mi bot está caído" / fallos específicos de proveedor / invocación de herramientas: ejecuta un `pnpm test:live` acotado

## Pruebas en vivo (que tocan la red)

Para la matriz de modelos en vivo, pruebas smoke del backend de la CLI, pruebas smoke de ACP, arnés
del servidor de aplicación de Codex y todas las pruebas en vivo de proveedores de medios (Deepgram, BytePlus, ComfyUI,
imagen, música, video, arnés de medios), además del manejo de credenciales para ejecuciones en vivo

- consulta [Pruebas de suites en vivo](/es/help/testing-live). Para la lista de comprobación dedicada de actualización y
  validación de plugins, consulta
  [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins).

## Ejecutores de Docker (comprobaciones opcionales de "funciona en Linux")

Estos ejecutores de Docker se dividen en dos grupos:

- Ejecutores de modelos en vivo: `test:docker:live-models` y `test:docker:live-gateway` ejecutan solo su archivo en vivo de claves de perfil correspondiente dentro de la imagen Docker del repositorio (`src/agents/models.profiles.live.test.ts` y `src/gateway/gateway-models.profiles.live.test.ts`), montando tu directorio de configuración local, el workspace y un archivo env de perfil opcional. Los puntos de entrada locales correspondientes son `test:live:models-profiles` y `test:live:gateway-profiles`.
- Los ejecutores en vivo de Docker mantienen sus propios límites prácticos cuando hace falta:
  `test:docker:live-models` usa de forma predeterminada el conjunto curado, compatible y de alta señal, y
  `test:docker:live-gateway` usa de forma predeterminada `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` y
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Establece `OPENCLAW_LIVE_MAX_MODELS`
  o las variables de entorno del Gateway cuando quieras explícitamente un límite menor o un escaneo más amplio.
- `test:docker:all` compila la imagen Docker en vivo una vez mediante `test:docker:live-build`, empaqueta OpenClaw una vez como tarball npm mediante `scripts/package-openclaw-for-docker.mjs`, y luego compila/reutiliza dos imágenes de `scripts/e2e/Dockerfile`. La imagen básica es solo el ejecutor Node/Git para carriles de instalación/actualización/dependencias de plugins; esos carriles montan el tarball precompilado. La imagen funcional instala el mismo tarball en `/app` para carriles de funcionalidad de la app compilada. Las definiciones de carriles Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`; la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ejecuta el plan seleccionado. El agregado usa un programador local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla los espacios de proceso, mientras que los límites de recursos evitan que los carriles pesados en vivo, de instalación npm y multiservicio arranquen todos a la vez. Si un solo carril pesa más que los límites activos, el programador aún puede iniciarlo cuando el pool está vacío y luego lo mantiene ejecutándose solo hasta que vuelva a haber capacidad disponible. Los valores predeterminados son 10 espacios, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` y `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajusta `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` (y otras anulaciones `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT`) solo cuando el host Docker tenga más margen. El ejecutor realiza una comprobación previa de Docker de forma predeterminada, elimina contenedores E2E obsoletos de OpenClaw, imprime estado cada 30 segundos, guarda los tiempos de carriles correctos en `.artifacts/docker-tests/lane-timings.json` y usa esos tiempos para iniciar primero los carriles más largos en ejecuciones posteriores. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir el manifiesto ponderado de carriles sin compilar ni ejecutar Docker, o `node scripts/test-docker-all.mjs --plan-json` para imprimir el plan de CI para los carriles seleccionados, necesidades de paquete/imagen y credenciales.
- `Aceptación de paquetes` es la puerta nativa de GitHub para paquetes: "¿este tarball instalable funciona como producto?". Resuelve un paquete candidato desde `source=npm`, `source=ref`, `source=url`, `source=trusted-url` o `source=artifact`, lo sube como `package-under-test` y luego ejecuta los carriles Docker E2E reutilizables contra ese tarball exacto en lugar de volver a empaquetar la ref seleccionada. Los perfiles se ordenan por amplitud: `smoke`, `package`, `product` y `full` (más `custom` para una lista explícita de carriles). Consulta [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins) para el contrato de paquete/actualización/plugin, la matriz de supervivencia de actualización publicada, los valores predeterminados de publicación y el triaje de fallos.
- Las comprobaciones de compilación y publicación ejecutan `scripts/check-cli-bootstrap-imports.mjs` después de tsdown. La guardia recorre el grafo compilado estático desde `dist/entry.js` y `dist/cli/run-main.js` y falla si ese grafo de arranque previo al despacho importa estáticamente cualquier paquete externo (Commander, interfaz de prompts, undici, logging y dependencias similares pesadas al inicio cuentan) antes del despacho de comandos; también limita el fragmento empaquetado de ejecución del Gateway a 70 KB y rechaza importaciones estáticas de rutas conocidas frías del Gateway (`control-ui-assets`, `diagnostic-stability-bundle`, `onboard-helpers`, `process-respawn`, `restart-sentinel`, `server-close`, `server-reload-handlers`) desde ese fragmento. `scripts/release-check.ts` prueba por separado la CLI empaquetada con smoke tests usando `--help`, `onboard --help`, `doctor --help`, `status --json --timeout 1`, `config schema` y `models list --provider openai`.
- La compatibilidad heredada de Aceptación de paquetes está limitada a `2026.4.25` (`2026.4.25-beta.*` incluido). Hasta ese corte, el arnés tolera solo brechas de metadatos de paquetes publicados: entradas omitidas de inventario QA privado, ausencia de `gateway install --wrapper`, archivos de parche ausentes en la fixture git derivada del tarball, ausencia de `update.channel` persistido, ubicaciones heredadas de registros de instalación de plugins, persistencia ausente del registro de instalación del marketplace y migración de metadatos de configuración durante `plugins update`. Para paquetes posteriores a `2026.4.25`, esas rutas son fallos estrictos.
- Ejecutores smoke de contenedor: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` y `test:docker:config-reload` arrancan uno o más contenedores reales y verifican rutas de integración de nivel superior.
- Los carriles E2E de Docker/Bash que instalan el tarball empaquetado de OpenClaw mediante `scripts/lib/openclaw-e2e-instance.sh` limitan `npm install` a `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (predeterminado `600s`; establece `0` para deshabilitar el wrapper al depurar).

Los ejecutores Docker de modelos en vivo también montan con bind solo los homes de autenticación de CLI necesarios
(o todos los compatibles cuando la ejecución no está acotada), y luego los copian al home del
contenedor antes de la ejecución para que OAuth de CLI externas pueda refrescar tokens
sin mutar el almacén de autenticación del host:

- Modelos directos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; cubre Claude, Codex y Gemini de forma predeterminada, con cobertura estricta de Droid/OpenCode mediante `pnpm test:docker:live-acp-bind:droid` y `pnpm test:docker:live-acp-bind:opencode`)
- Smoke de backend de CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke del arnés de servidor de aplicación de Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desarrollo: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smokes de observabilidad: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` y `pnpm qa:observability:smoke` son carriles privados de checkout de código fuente de QA. Intencionalmente no forman parte de los carriles Docker de publicación de paquetes porque el tarball npm omite QA Lab.
- Smoke en vivo de Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Asistente de incorporación (TTY, andamiaje completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke de incorporación/canal/agente con tarball npm: `pnpm test:docker:npm-onboard-channel-agent` instala globalmente el tarball empaquetado de OpenClaw en Docker, configura OpenAI mediante incorporación env-ref más Telegram de forma predeterminada, ejecuta doctor y ejecuta un turno de agente OpenAI simulado. Reutiliza un tarball precompilado con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la recompilación del host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` o cambia el canal con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` o `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Smoke del recorrido de usuario de release: `pnpm test:docker:release-user-journey` instala el tarball empaquetado de OpenClaw globalmente en un home limpio de Docker, ejecuta el onboarding, configura un proveedor de OpenAI simulado, ejecuta un turno de agente, instala/desinstala Plugins externos, configura ClickClack contra un fixture local, verifica la mensajería saliente/entrante, reinicia Gateway y ejecuta doctor.
- Smoke del onboarding tipado de release: `pnpm test:docker:release-typed-onboarding` instala el tarball empaquetado, conduce `openclaw onboard` a través de un TTY real, configura OpenAI como proveedor con referencia a env, verifica que no haya persistencia de claves sin procesar y ejecuta un turno de agente simulado.
- Smoke de medios/memoria de release: `pnpm test:docker:release-media-memory` instala el tarball empaquetado, verifica la comprensión de imágenes desde un adjunto PNG, la salida de generación de imágenes compatible con OpenAI, la recuperación de búsqueda de memoria y la supervivencia de la recuperación tras reiniciar Gateway.
- Smoke del recorrido de usuario de actualización de release: `pnpm test:docker:release-upgrade-user-journey` instala de forma predeterminada la línea base publicada más reciente anterior al tarball candidato, configura el estado de proveedor/Plugin/ClickClack en el paquete publicado, actualiza al tarball candidato y luego vuelve a ejecutar el recorrido central de agente/Plugin/canal. Si no existe una línea base publicada anterior, reutiliza la versión candidata. Sobrescribe la línea base con `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Smoke del marketplace de Plugins de release: `pnpm test:docker:release-plugin-marketplace` instala desde un marketplace de fixture local, actualiza el Plugin instalado, lo desinstala y verifica que la CLI del Plugin desaparezca con los metadatos de instalación depurados.
- Smoke de instalación de Skills: `pnpm test:docker:skill-install` instala el tarball empaquetado de OpenClaw globalmente en Docker, deshabilita las instalaciones de archivos subidos en la configuración, resuelve el slug actual de Skill de ClawHub en vivo desde la búsqueda, lo instala con `openclaw skills install` y verifica la Skill instalada junto con los metadatos de origen/bloqueo de `.clawhub`.
- Smoke de cambio de canal de actualización: `pnpm test:docker:update-channel-switch` instala el tarball empaquetado de OpenClaw globalmente en Docker, cambia del paquete `stable` a git `dev`, verifica el canal persistido y el funcionamiento posterior a la actualización del Plugin, luego vuelve al paquete `stable` y comprueba el estado de actualización.
- Smoke de supervivencia de actualización: `pnpm test:docker:upgrade-survivor` instala el tarball empaquetado de OpenClaw sobre un fixture sucio de usuario antiguo con agentes, configuración de canal, listas de permitidos de Plugins, estado obsoleto de dependencias de Plugins y archivos existentes de workspace/sesión. Ejecuta la actualización del paquete más doctor no interactivo sin proveedor en vivo ni claves de canal, luego inicia un Gateway de loopback y comprueba la preservación de configuración/estado junto con los presupuestos de arranque/estado.
- Smoke de supervivencia de actualización publicada: `pnpm test:docker:published-upgrade-survivor` instala `openclaw@latest` de forma predeterminada, siembra archivos realistas de usuario existente, configura esa línea base con una receta de comandos incorporada, valida la configuración resultante, actualiza esa instalación publicada al tarball candidato, ejecuta doctor no interactivo, escribe `.artifacts/upgrade-survivor/summary.json`, luego inicia un Gateway de loopback y comprueba intents configurados, preservación de estado, arranque, `/healthz`, `/readyz` y presupuestos de estado RPC. Sobrescribe una línea base con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, pide al programador agregado que expanda líneas base locales exactas con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` como `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, y expande fixtures con forma de issue con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` como `reported-issues`; el conjunto reported-issues incluye `configured-plugin-installs` para la reparación automática de instalaciones de Plugins externos de OpenClaw. Package Acceptance expone esos valores como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` y `published_upgrade_survivor_scenarios`, resuelve tokens de línea base meta como `last-stable-4` o `all-since-2026.4.23`, y Full Release Validation expande la puerta de paquete de release-soak a `last-stable-4 2026.4.23 2026.5.2 2026.4.15` más `reported-issues`.
- Smoke de contexto de runtime de sesión: `pnpm test:docker:session-runtime-context` verifica la persistencia oculta de la transcripción de contexto de runtime más la reparación por doctor de ramas duplicadas afectadas de reescritura de prompt.
- Smoke de instalación global con Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empaqueta el árbol actual, lo instala con `bun install -g` en un home aislado y verifica que `openclaw infer image providers --json` devuelva proveedores de imágenes incluidos en el bundle en lugar de quedarse colgado. Reutiliza un tarball precompilado con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la compilación del host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` o copia `dist/` desde una imagen Docker compilada con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke de Docker del instalador: `bash scripts/test-install-sh-docker.sh` comparte una caché npm entre sus contenedores root, update y direct-npm. El smoke de actualización usa de forma predeterminada npm `latest` como línea base stable antes de actualizar al tarball candidato. Sobrescribe con `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localmente, o con la entrada `update_baseline_version` del workflow Install Smoke en GitHub. Las comprobaciones del instalador no root mantienen una caché npm aislada para que las entradas de caché propiedad de root no enmascaren el comportamiento de instalación local del usuario. Define `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar la caché root/update/direct-npm entre nuevas ejecuciones locales.
- Install Smoke CI omite la actualización global direct-npm duplicada con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; ejecuta el script localmente sin esa variable de entorno cuando se necesite cobertura directa de `npm install -g`.
- Smoke de CLI de eliminación de workspace compartido de agentes: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila de forma predeterminada la imagen del Dockerfile raíz, siembra dos agentes con un workspace en un home de contenedor aislado, ejecuta `agents delete --json` y verifica JSON válido más el comportamiento de workspace retenido. Reutiliza la imagen install-smoke con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Redes de Gateway (dos contenedores, autenticación WS + salud): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoke de snapshot CDP del navegador: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila la imagen E2E de origen más una capa de Chromium, inicia Chromium con CDP sin procesar, ejecuta `browser doctor --deep` y verifica que los snapshots de roles CDP cubran URL de enlaces, elementos clicables promovidos por cursor, refs de iframe y metadatos de frame.
- Regresión de razonamiento mínimo de OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) ejecuta un servidor OpenAI simulado a través de Gateway, verifica que `web_search` eleve `reasoning.effort` de `minimal` a `low`, luego fuerza el rechazo del esquema del proveedor y comprueba que el detalle sin procesar aparezca en los logs de Gateway.
- Puente de canales MCP (Gateway sembrado + puente stdio + smoke de frame de notificación Claude sin procesar): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Herramientas MCP del bundle de OpenClaw (servidor MCP stdio real + smoke de allow/deny de perfil OpenClaw embebido): `pnpm test:docker:agent-bundle-mcp-tools` (script: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Limpieza MCP de Cron/subagente (Gateway real + desmontaje de hijo MCP stdio tras ejecuciones aisladas de cron y subagente de una sola vez): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke de instalación/actualización para ruta local, `file:`, registro npm con dependencias elevadas, metadatos de paquete npm malformados, refs móviles de git, kitchen-sink de ClawHub, actualizaciones de marketplace y habilitación/inspección de bundle de Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Define `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para omitir el bloque de ClawHub, o sobrescribe el par predeterminado de paquete/runtime kitchen-sink con `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` y `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sin `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, la prueba usa un servidor de fixture ClawHub local hermético.
- Smoke de actualización sin cambios de Plugin: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke de matriz de ciclo de vida de Plugins: `pnpm test:docker:plugin-lifecycle-matrix` instala el tarball empaquetado de OpenClaw en un contenedor vacío, instala un Plugin npm, alterna habilitar/deshabilitar, lo actualiza y degrada a través de un registro npm local, elimina el código instalado y luego verifica que la desinstalación siga eliminando estado obsoleto mientras registra métricas RSS/CPU para cada fase del ciclo de vida.
- Smoke de metadatos de recarga de configuración: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` cubre smoke de instalación/actualización para ruta local, `file:`, registro npm con dependencias elevadas, refs móviles de git, fixtures de ClawHub, actualizaciones de marketplace y habilitación/inspección de bundle de Claude. `pnpm test:docker:plugin-update` cubre el comportamiento de actualización sin cambios para Plugins instalados. `pnpm test:docker:plugin-lifecycle-matrix` cubre instalación, habilitación, deshabilitación, actualización, degradación y desinstalación con código ausente de Plugins npm con seguimiento de recursos.

Para precompilar y reutilizar manualmente la imagen funcional compartida:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Las sobrescrituras de imagen específicas de suite, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, siguen teniendo prioridad cuando están definidas. Cuando `OPENCLAW_SKIP_DOCKER_BUILD=1` apunta a una imagen compartida remota, los scripts la descargan si aún no está en local. Las pruebas QR y Docker del instalador mantienen sus propios Dockerfiles porque validan el comportamiento de paquete/instalación en lugar del runtime de la aplicación compilada compartida.

Los runners Docker con modelos en vivo también montan el checkout actual en modo solo lectura
y lo preparan en un workdir temporal dentro del contenedor. Esto mantiene ligera la
imagen de runtime mientras sigue ejecutando Vitest contra tu fuente/configuración
local exacta. El paso de preparación omite cachés grandes solo locales y salidas de
compilación de la app como `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` y
directorios `.build` locales de app o de salida Gradle para que las ejecuciones en vivo
de Docker no pasen minutos copiando artefactos específicos de la máquina. También definen
`OPENCLAW_SKIP_CHANNELS=1` para que las sondas en vivo de Gateway no inicien workers de canales reales de
Telegram/Discord/etc. dentro del contenedor.
`test:docker:live-models` sigue ejecutando `pnpm test:live`, así que pasa también
`OPENCLAW_LIVE_GATEWAY_*` cuando necesites acotar o excluir la cobertura en vivo de gateway
de esa lane Docker.

`test:docker:openwebui` es un smoke de compatibilidad de nivel superior: inicia un
contenedor de gateway OpenClaw con los endpoints HTTP compatibles con OpenAI habilitados,
inicia un contenedor Open WebUI fijado contra ese gateway, inicia sesión a través de
Open WebUI, verifica que `/api/models` exponga `openclaw/default` y luego envía una
solicitud de chat real a través del proxy `/api/chat/completions` de Open WebUI. Define
`OPENWEBUI_SMOKE_MODE=models` para comprobaciones de CI de ruta de release que deban detenerse
después del inicio de sesión en Open WebUI y el descubrimiento de modelos, sin esperar a que se complete un modelo
en vivo. La primera ejecución puede ser notablemente más lenta porque Docker quizá tenga que
descargar la imagen de Open WebUI y Open WebUI quizá tenga que terminar su propia
configuración de arranque en frío. Esta lane espera una clave de modelo en vivo utilizable, proporcionada a través
del entorno del proceso, perfiles de auth preparados o un
`OPENCLAW_PROFILE_FILE` explícito. Las ejecuciones correctas imprimen una pequeña carga JSON como
`{ "ok": true, "model": "openclaw/default", ... }`.

`test:docker:mcp-channels` es intencionalmente determinista y no necesita una
cuenta real de Telegram, Discord ni iMessage. Arranca un contenedor Gateway
con datos semilla, inicia un segundo contenedor que lanza `openclaw mcp serve`,
y luego verifica el descubrimiento de conversaciones enrutadas, lecturas de
transcripciones, metadatos de adjuntos, comportamiento de la cola de eventos
en vivo, enrutamiento de envíos salientes y notificaciones de canal + permisos
al estilo Claude sobre el puente MCP stdio real. La comprobación de
notificaciones inspecciona directamente los frames MCP stdio sin procesar para
que el smoke valide lo que realmente emite el puente, no solo lo que una SDK de
cliente específica alcanza a exponer.

`test:docker:agent-bundle-mcp-tools` es determinista y no necesita una clave de
modelo en vivo. Construye la imagen Docker del repositorio, inicia un servidor
de sondeo MCP stdio real dentro del contenedor, materializa ese servidor a
través del runtime MCP del paquete OpenClaw integrado, ejecuta la herramienta y
luego verifica que `coding` y `messaging` conserven las herramientas
`bundle-mcp`, mientras que `minimal` y `tools.deny: ["bundle-mcp"]` las filtran.

`test:docker:cron-mcp-cleanup` es determinista y no necesita una clave de modelo
en vivo. Inicia un Gateway con datos semilla con un servidor de sondeo MCP stdio
real, ejecuta un turno cron aislado y un turno hijo puntual `sessions_spawn`, y
luego verifica que el proceso hijo MCP salga después de cada ejecución.

Smoke manual de hilo ACP en lenguaje natural (no CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conserva este script para flujos de regresión/depuración. Puede volver a ser necesario para validar el enrutamiento de hilos ACP, así que no lo elimines.

Variables de entorno útiles:

- `OPENCLAW_CONFIG_DIR=...` (predeterminado: `~/.openclaw`) montado en `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predeterminado: `~/.openclaw/workspace`) montado en `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` montado y cargado antes de ejecutar las pruebas
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar solo variables de entorno cargadas desde `OPENCLAW_PROFILE_FILE`, usando directorios temporales de configuración/espacio de trabajo y sin montajes externos de autenticación de CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predeterminado: `~/.cache/openclaw/docker-cli-tools`, salvo que la ejecución ya use un directorio bind de CI/gestionado) montado en `/home/node/.npm-global` para instalaciones de CLI en caché dentro de Docker
- Los directorios/archivos externos de autenticación de CLI bajo `$HOME` se montan en modo solo lectura bajo `/host-auth...` y luego se copian en `/home/node/...` antes de que empiecen las pruebas
  - Directorios predeterminados (usados cuando la ejecución no está limitada a proveedores específicos): `.factory`, `.gemini`, `.minimax`
  - Archivos predeterminados: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Las ejecuciones limitadas por proveedor montan solo los directorios/archivos necesarios inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sobrescribe manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o una lista separada por comas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para limitar la ejecución
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar proveedores dentro del contenedor
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar una imagen `openclaw:local-live` existente en repeticiones que no necesitan reconstrucción
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantizar que las credenciales provengan del almacén de perfiles (no de env)
- `OPENCLAW_OPENWEBUI_MODEL=...` para elegir el modelo expuesto por el gateway para el smoke de Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para sobrescribir el prompt de comprobación de nonce usado por el smoke de Open WebUI
- `OPENWEBUI_IMAGE=...` para sobrescribir la etiqueta de imagen Open WebUI fijada

## Sanidad de docs

Ejecuta comprobaciones de docs después de editar documentación: `pnpm check:docs`.
Ejecuta la validación completa de anchors de Mintlify cuando también necesites comprobaciones de encabezados dentro de la página: `pnpm docs:check-links:anchors`.

## Regresión offline (segura para CI)

Estas son regresiones de "pipeline real" sin proveedores reales:

- Llamadas a herramientas de Gateway (OpenAI simulado, gateway real + bucle de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Asistente de Gateway (WS `wizard.start`/`wizard.next`, escribe configuración + autenticación aplicada): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evals de fiabilidad de agentes (skills)

Ya tenemos algunas pruebas seguras para CI que se comportan como "evals de fiabilidad de agentes":

- Llamadas a herramientas simuladas a través del gateway real + bucle de agente (`src/gateway/gateway.test.ts`).
- Flujos de asistente de extremo a extremo que validan el cableado de sesión y los efectos de configuración (`src/gateway/gateway.test.ts`).

Lo que aún falta para Skills (consulta [Skills](/es/tools/skills)):

- **Toma de decisiones:** cuando las Skills se enumeran en el prompt, ¿el agente elige la Skill correcta (o evita las irrelevantes)?
- **Cumplimiento:** ¿el agente lee `SKILL.md` antes de usarla y sigue los pasos/args requeridos?
- **Contratos de flujo de trabajo:** escenarios multi-turno que afirmen el orden de herramientas, la conservación del historial de sesión y los límites de sandbox.

Las evals futuras deberían seguir siendo primero deterministas:

- Un ejecutor de escenarios que use proveedores simulados para afirmar llamadas a herramientas + orden, lecturas de archivos de skills y cableado de sesión.
- Un conjunto pequeño de escenarios centrados en skills (usar vs evitar, gating, inyección de prompts).
- Evals en vivo opcionales (opt-in, protegidas por env) solo después de tener la suite segura para CI.

## Pruebas de contrato (forma de plugin y canal)

Las pruebas de contrato verifican que cada plugin y canal registrado cumpla su
contrato de interfaz. Iteran sobre todos los plugins descubiertos y ejecutan una
suite de aserciones de forma y comportamiento. El carril unitario predeterminado
de `pnpm test` omite intencionalmente estos archivos compartidos de smoke y seam;
ejecuta los comandos de contrato explícitamente cuando toques superficies
compartidas de canal o proveedor.

### Comandos

- Todos los contratos: `pnpm test:contracts`
- Solo contratos de canal: `pnpm test:contracts:channels`
- Solo contratos de proveedor: `pnpm test:contracts:plugins`

### Contratos de canal

Ubicados en `src/channels/plugins/contracts/*.contract.test.ts`. Categorías
actuales de nivel superior:

- **channel-catalog** - metadatos de entrada de catálogo de canal empaquetado/registro
- **plugin** (respaldado por registro, fragmentado) - forma básica de registro de plugin
- **surfaces-only** (respaldado por registro, fragmentado) - comprobaciones de forma por superficie para `actions`, `setup`, `status`, `outbound`, `messaging`, `threading`, `directory` y `gateway`
- **session-binding** (respaldado por registro) - comportamiento de vinculación de sesión
- **outbound-payload** - estructura y normalización de payload de mensajes
- **group-policy** (fallback) - aplicación de la política de grupo predeterminada por canal
- **threading** (respaldado por registro, fragmentado) - gestión de id de hilo
- **directory** (respaldado por registro, fragmentado) - API de directorio/lista
- **registry** y **plugins-core.\*** - registro de plugins de canal, cargador e internos de autorización de escritura de configuración

Los helpers de harness de dispatch-capture entrante y outbound-payload usados por
estas suites se exponen internamente a través de `src/plugin-sdk/channel-contract-testing.ts`
(excluido de npm, no es un subpath público de la SDK); no hay ningún archivo
`inbound.contract.test.ts` independiente en este directorio.

### Contratos de proveedor

Ubicados en `src/plugins/contracts/*.contract.test.ts`. Las categorías actuales
incluyen:

- **shape** - forma del manifiesto del plugin, API y exportación de runtime
- **plugin-registration** (+ paralelo) - casos de registro de manifiesto
- **package-manifest** - requisitos del manifiesto de paquete
- **loader** - comportamiento de setup/teardown del cargador de plugins
- **registry** - contenidos y búsqueda del registro de contratos de plugins
- **providers** - comportamiento compartido de proveedores entre proveedores empaquetados, más proveedores de búsqueda web
- **auth-choice** - metadatos de elección de autenticación y comportamiento de setup
- **provider-catalog-deprecation** - metadatos obsoletos del catálogo de proveedores
- **wizard.choice-resolution**, **wizard.model-picker**, **wizard.setup-options** - contratos del asistente de setup de proveedor
- **embedding-provider**, **memory-embedding-provider**, **web-fetch-provider**, **tts** - contratos de proveedor específicos de capacidad
- **session-actions**, **session-attachments**, **session-entry-projection** - contratos de estado de sesión propiedad del plugin
- **scheduled-turns** - metadatos de turnos programados de plugin y límites de timestamp
- **host-hooks**, **run-context-lifecycle**, **runtime-import-side-effects**, **runtime-seams** - ciclo de vida de host/runtime de plugins y contratos de límite de importación
- **extension-runtime-dependencies** - ubicación de dependencias de runtime para extensiones

### Cuándo ejecutar

- Después de cambiar exports o subpaths de plugin-sdk
- Después de añadir o modificar un plugin de canal o proveedor
- Después de refactorizar el registro o descubrimiento de plugins

Las pruebas de contrato se ejecutan en CI y no requieren claves de API reales.

## Añadir regresiones (guía)

Cuando corrijas un problema de proveedor/modelo descubierto en vivo:

- Añade una regresión segura para CI si es posible (proveedor mock/stub, o captura la transformación exacta de la forma de la solicitud)
- Si es inherentemente solo en vivo (límites de tasa, políticas de autenticación), mantén la prueba en vivo acotada y opt-in mediante variables de entorno
- Prefiere apuntar a la capa más pequeña que capture el bug:
  - bug de conversión/reproducción de solicitud de proveedor -> prueba directa de modelos
  - bug de pipeline de sesión/historial/herramientas de gateway -> smoke en vivo de gateway o prueba mock de gateway segura para CI
- Guardrail de recorrido de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un objetivo muestreado por clase de SecretRef a partir de metadatos del registro (`listSecretTargetRegistryEntries()`), y luego afirma que los ids de exec con segmentos de recorrido se rechazan.
  - Si añades una nueva familia de objetivos SecretRef `includeInPlan` en `src/secrets/target-registry-data.ts`, actualiza `classifyTargetClass` en esa prueba. La prueba falla intencionalmente con ids de objetivo no clasificados para que las clases nuevas no se puedan omitir silenciosamente.

## Relacionado

- [Pruebas en vivo](/es/help/testing-live)
- [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins)
- [CI](/es/ci)
