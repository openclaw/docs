---
read_when:
    - Ejecutar o corregir pruebas
summary: Cómo ejecutar pruebas localmente (vitest) y cuándo usar los modos de forzado/cobertura
title: Pruebas
x-i18n:
    generated_at: "2026-05-05T05:24:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc31ab27a63607ec5134306a0129bd164e4235f26631da4f691f657adda70eed
    source_path: reference/test.md
    workflow: 16
---

- Kit completo de pruebas (conjuntos, en vivo, Docker): [Pruebas](/es/help/testing)
- Validación de actualizaciones y paquetes de Plugin: [Pruebas de actualizaciones y Plugins](/es/help/testing-updates-plugins)

- `pnpm test:force`: Mata cualquier proceso de Gateway persistente que retenga el puerto de control predeterminado y luego ejecuta la suite completa de Vitest con un puerto de Gateway aislado para que las pruebas del servidor no choquen con una instancia en ejecución. Usa esto cuando una ejecución previa del Gateway haya dejado ocupado el puerto 18789.
- `pnpm test:coverage`: Ejecuta la suite de unidad con cobertura de V8 (mediante `vitest.unit.config.ts`). Esta es una puerta de cobertura de unidad de archivos cargados, no una cobertura de todos los archivos de todo el repositorio. Los umbrales son 70% para líneas/funciones/instrucciones y 55% para ramas. Como `coverage.all` es false, la puerta mide los archivos cargados por la suite de cobertura de unidad en lugar de tratar cada archivo fuente de carril dividido como no cubierto.
- `pnpm test:coverage:changed`: Ejecuta cobertura de unidad solo para los archivos cambiados desde `origin/main`.
- `pnpm test:changed`: ejecución barata e inteligente de pruebas modificadas. Ejecuta objetivos precisos a partir de ediciones directas de pruebas, archivos hermanos `*.test.ts`, asignaciones explícitas de fuentes y el grafo de importaciones local. Los cambios amplios de configuración/paquete se omiten a menos que se asignen a pruebas precisas.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: ejecución amplia explícita de pruebas modificadas. Úsala cuando una edición de arnés/configuración/paquete de pruebas deba recurrir al comportamiento más amplio de pruebas modificadas de Vitest.
- `pnpm changed:lanes`: muestra los carriles arquitectónicos activados por el diff contra `origin/main`.
- `pnpm check:changed`: ejecuta la puerta inteligente de comprobación de cambios para el diff contra `origin/main`. Ejecuta typecheck, lint y comandos de guardia para los carriles arquitectónicos afectados, pero no ejecuta pruebas de Vitest. Usa `pnpm test:changed` o `pnpm test <target>` explícito para la prueba de tests.
- `pnpm test`: enruta objetivos explícitos de archivo/directorio mediante carriles de Vitest acotados. Las ejecuciones sin objetivo usan grupos de shards fijos y se expanden a configuraciones hoja para ejecución paralela local; el grupo de extensiones siempre se expande a las configuraciones de shard por extensión en lugar de un único proceso gigante de proyecto raíz.
- Las ejecuciones del wrapper de pruebas terminan con un breve resumen `[test] passed|failed|skipped ... in ...`. La propia línea de duración de Vitest queda como detalle por shard.
- Estado de pruebas compartido de OpenClaw: usa `src/test-utils/openclaw-test-state.ts` desde Vitest cuando una prueba necesita un `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture de configuración, espacio de trabajo, directorio de agente o almacén de perfiles de autenticación aislado.
- Helpers de E2E de proceso: usa `test/helpers/openclaw-test-instance.ts` cuando una prueba E2E de nivel de proceso de Vitest necesita un Gateway en ejecución, entorno de CLI, captura de logs y limpieza en un solo lugar.
- Helpers E2E de Docker/Bash: los carriles que cargan `scripts/lib/docker-e2e-image.sh` pueden pasar `docker_e2e_test_state_shell_b64 <label> <scenario>` al contenedor y decodificarlo con `scripts/lib/openclaw-e2e-instance.sh`; los scripts multi-home pueden pasar `docker_e2e_test_state_function_b64` y llamar a `openclaw_test_state_create <label> <scenario>` en cada flujo. Los llamadores de nivel inferior pueden usar `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` para un fragmento de shell dentro del contenedor, o `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` para un archivo de entorno del host que se puede cargar. El `--` antes de `create` evita que los runtimes de Node más nuevos traten `--env-file` como una bandera de Node. Los carriles Docker/Bash que lanzan un Gateway pueden cargar `scripts/lib/openclaw-e2e-instance.sh` dentro del contenedor para resolución de entrypoint, arranque simulado de OpenAI, lanzamiento en primer plano/segundo plano del Gateway, sondas de disponibilidad, exportación de entorno de estado, volcados de logs y limpieza de procesos.
- Las ejecuciones completas, de extensión y de shards con patrón de inclusión actualizan los datos locales de tiempos en `.artifacts/vitest-shard-timings.json`; las ejecuciones posteriores de configuración completa usan esos tiempos para equilibrar shards lentos y rápidos. Los shards de CI con patrón de inclusión anexan el nombre del shard a la clave de tiempos, lo que mantiene visibles los tiempos de shards filtrados sin reemplazar los datos de tiempos de configuración completa. Configura `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar el artefacto local de tiempos.
- Archivos de prueba seleccionados de `plugin-sdk` y `commands` ahora se enrutan por carriles ligeros dedicados que mantienen solo `test/setup.ts`, dejando los casos pesados en runtime en sus carriles existentes.
- Los archivos fuente con pruebas hermanas se asignan a ese hermano antes de recurrir a globs de directorio más amplios. Las ediciones de helpers bajo `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` y `src/plugins/contracts` usan un grafo de importaciones local para ejecutar las pruebas que importan, en lugar de ejecutar ampliamente cada shard cuando la ruta de dependencia es precisa.
- `auto-reply` ahora también se divide en tres configuraciones dedicadas (`core`, `top-level`, `reply`) para que el arnés de respuesta no domine las pruebas más ligeras de estado/token/helper de nivel superior.
- La configuración base de Vitest ahora usa por defecto `pool: "threads"` e `isolate: false`, con el runner compartido no aislado habilitado en todas las configuraciones del repositorio.
- `pnpm test:channels` ejecuta `vitest.channels.config.ts`.
- `pnpm test:extensions` y `pnpm test extensions` ejecutan todos los shards de extensión/Plugin. Los plugins de canal pesados, el Plugin del navegador y OpenAI se ejecutan como shards dedicados; otros grupos de plugins permanecen agrupados. Usa `pnpm test extensions/<id>` para un carril de un Plugin incluido.
- `pnpm test:perf:imports`: habilita informes de duración de importación + desglose de importaciones de Vitest, mientras sigue usando enrutamiento de carril acotado para objetivos explícitos de archivo/directorio.
- `pnpm test:perf:imports:changed`: el mismo perfilado de importaciones, pero solo para archivos cambiados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compara el rendimiento de la ruta enrutada de modo cambiado frente a la ejecución nativa de proyecto raíz para el mismo diff de git confirmado.
- `pnpm test:perf:changed:bench -- --worktree` compara el rendimiento del conjunto de cambios del worktree actual sin confirmar primero.
- `pnpm test:perf:profile:main`: escribe un perfil de CPU para el hilo principal de Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: escribe perfiles de CPU + heap para el runner de unidad (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: ejecuta serialmente cada configuración hoja de Vitest de la suite completa y escribe datos de duración agrupados más artefactos JSON/log por configuración. El Test Performance Agent usa esto como línea base antes de intentar corregir pruebas lentas.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: compara informes agrupados después de un cambio enfocado en rendimiento.
- Integración de Gateway: opt-in mediante `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: Ejecuta pruebas smoke end-to-end del Gateway (emparejamiento multi-instancia WS/HTTP/node). Usa por defecto `threads` + `isolate: false` con workers adaptativos en `vitest.e2e.config.ts`; ajusta con `OPENCLAW_E2E_WORKERS=<n>` y define `OPENCLAW_E2E_VERBOSE=1` para logs detallados.
- `pnpm test:live`: Ejecuta pruebas live de proveedores (minimax/zai). Requiere claves de API y `LIVE=1` (o `*_LIVE_TEST=1` específico del proveedor) para no omitirlas.
- `pnpm test:docker:all`: Construye la imagen compartida de pruebas live, empaqueta OpenClaw una vez como un tarball de npm, construye/reutiliza una imagen runner básica de Node/Git más una imagen funcional que instala ese tarball en `/app`, y luego ejecuta carriles smoke de Docker con `OPENCLAW_SKIP_DOCKER_BUILD=1` mediante un planificador ponderado. La imagen básica (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) se usa para carriles de instalador/actualización/dependencias de Plugin; esos carriles montan el tarball preconstruido en lugar de usar fuentes copiadas del repositorio. La imagen funcional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) se usa para carriles normales de funcionalidad de app construida. `scripts/package-openclaw-for-docker.mjs` es el único empaquetador local/CI y valida el tarball más `dist/postinstall-inventory.json` antes de que Docker lo consuma. Las definiciones de carriles de Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`; la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ejecuta el plan seleccionado. `node scripts/test-docker-all.mjs --plan-json` emite el plan de CI propiedad del planificador para carriles seleccionados, tipos de imagen, necesidades de paquete/imagen live, escenarios de estado y comprobaciones de credenciales sin construir ni ejecutar Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` controla los slots de proceso y por defecto es 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` controla el pool de cola sensible a proveedores y por defecto es 10. Los límites de carriles pesados por defecto son `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` y `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; los límites de proveedores por defecto son un carril pesado por proveedor mediante `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` y `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Usa `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` u `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` para hosts más grandes. Si un carril supera el peso efectivo o el límite de recursos en un host de baja paralelización, aún puede empezar desde un pool vacío y se ejecutará solo hasta que libere capacidad. Los inicios de carril se escalonan 2 segundos por defecto para evitar tormentas de creación del daemon local de Docker; sobrescribe con `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. El runner ejecuta preflights de Docker por defecto, limpia contenedores E2E obsoletos de OpenClaw, emite estado de carriles activos cada 30 segundos, comparte cachés de herramientas CLI de proveedor entre carriles compatibles, reintenta una vez por defecto los fallos transitorios de proveedores live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) y almacena tiempos de carriles en `.artifacts/docker-tests/lane-timings.json` para ordenación del más largo primero en ejecuciones posteriores. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir el manifiesto de carriles sin ejecutar Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` para ajustar la salida de estado, o `OPENCLAW_DOCKER_ALL_TIMINGS=0` para deshabilitar la reutilización de tiempos. Usa `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` solo para carriles deterministas/locales o `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` solo para carriles de proveedores live; los alias de paquete son `pnpm test:docker:local:all` y `pnpm test:docker:live:all`. El modo solo live fusiona los carriles live principal y de cola en un único pool de más largo primero para que los buckets de proveedor puedan empaquetar juntos el trabajo de Claude, Codex y Gemini. El runner deja de programar nuevos carriles en pool después del primer fallo a menos que `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` esté definido, y cada carril tiene un timeout de respaldo de 120 minutos que se puede sobrescribir con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; carriles live/de cola seleccionados usan límites por carril más estrictos. Los comandos de configuración Docker del backend CLI tienen su propio timeout mediante `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (predeterminado 180). Los logs por carril, `summary.json`, `failures.json` y los tiempos por fase se escriben bajo `.artifacts/docker-tests/<run-id>/`; usa `pnpm test:docker:timings <summary.json>` para inspeccionar carriles lentos y `pnpm test:docker:rerun <run-id|summary.json|failures.json>` para imprimir comandos baratos de reejecución dirigida.
- `pnpm test:docker:browser-cdp-snapshot`: Construye un contenedor E2E de fuentes respaldado por Chromium, inicia CDP sin procesar más un Gateway aislado, ejecuta `browser doctor --deep` y verifica que las instantáneas de roles de CDP incluyan URL de enlaces, clickables promovidos por cursor, refs de iframe y metadatos de frame.
- Las sondas Docker live de backend CLI se pueden ejecutar como carriles enfocados, por ejemplo `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` o `pnpm test:docker:live-cli-backend:codex:mcp`. Claude y Gemini tienen alias `:resume` y `:mcp` equivalentes.
- `pnpm test:docker:openwebui`: Inicia OpenClaw + Open WebUI dockerizados, inicia sesión mediante Open WebUI, comprueba `/api/models` y luego ejecuta un chat real proxificado mediante `/api/chat/completions`. Requiere una clave de modelo live utilizable (por ejemplo OpenAI en `~/.profile`), descarga una imagen externa de Open WebUI y no se espera que sea estable para CI como las suites normales unit/e2e.
- `pnpm test:docker:mcp-channels`: Inicia un contenedor de Gateway presembrado y un segundo contenedor cliente que lanza `openclaw mcp serve`, luego verifica el descubrimiento de conversaciones enrutadas, lecturas de transcripciones, metadatos de adjuntos, comportamiento de cola de eventos live, enrutamiento de envío saliente y notificaciones de canal + permisos estilo Claude sobre el puente stdio real. La aserción de notificación de Claude lee directamente los frames MCP stdio sin procesar para que el smoke refleje lo que el puente emite realmente.
- `pnpm test:docker:upgrade-survivor`: Instala el tarball empaquetado de OpenClaw sobre un fixture de usuario antiguo con estado sucio, ejecuta la actualización del paquete más `doctor` no interactivo sin claves de proveedor en vivo ni de canal, luego inicia un Gateway de loopback y comprueba que los agentes, la configuración de canales, las listas de permitidos de plugins, los archivos de espacio de trabajo/sesión, el estado obsoleto de dependencias de plugins heredados, el arranque y el estado RPC se conserven.
- `pnpm test:docker:published-upgrade-survivor`: Instala `openclaw@latest` de forma predeterminada, siembra archivos realistas de usuario existente sin claves de proveedor en vivo ni de canal, configura esa línea base con una receta integrada del comando `openclaw config set`, actualiza esa instalación publicada al tarball empaquetado de OpenClaw, ejecuta `doctor` no interactivo, escribe `.artifacts/upgrade-survivor/summary.json`, luego inicia un Gateway de loopback y comprueba que los intents configurados, los archivos de espacio de trabajo/sesión, la configuración obsoleta de plugins y el estado de dependencias heredadas, el arranque, `/healthz`, `/readyz` y el estado RPC se conserven o se reparen limpiamente. Sobrescribe una línea base con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, amplía una matriz local exacta con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` como `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, o agrega fixtures de escenarios con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; el conjunto `reported-issues` incluye `configured-plugin-installs` para verificar que los plugins externos de OpenClaw configurados se instalen automáticamente durante la actualización y `stale-source-plugin-shadow` para evitar que las sombras de plugins solo de origen rompan el arranque. Package Acceptance expone esos valores como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` y `published_upgrade_survivor_scenarios`, y resuelve tokens de línea base meta como `last-stable-4` o `all-since-2026.4.23` antes de entregar especificaciones exactas de paquete a los carriles de Docker.
- `pnpm test:docker:update-migration`: Ejecuta el arnés de supervivencia de actualización publicada en el escenario `plugin-deps-cleanup`, que requiere mucha limpieza, empezando en `openclaw@2026.4.23` de forma predeterminada. El flujo de trabajo separado `Update Migration` amplía este carril con `baselines=all-since-2026.4.23` para que cada paquete estable publicado desde `.23` en adelante se actualice al candidato y demuestre la limpieza de dependencias de plugins configurados fuera de Full Release CI.
- `pnpm test:docker:plugins`: Ejecuta pruebas de humo de instalación/actualización para ruta local, `file:`, paquetes del registro npm con dependencias elevadas, refs móviles de git, fixtures de ClawHub, actualizaciones del marketplace y habilitación/inspección del paquete de Claude.

## Control local de PR

Para las comprobaciones locales de integración/control de PR, ejecuta:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` falla de forma intermitente en un host cargado, vuelve a ejecutarlo una vez antes de tratarlo como una regresión y luego aíslalo con `pnpm test <path/to/test>`. Para hosts con memoria limitada, usa:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Banco de latencia de modelos (claves locales)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Entorno opcional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt predeterminado: “Responde con una sola palabra: ok. Sin puntuación ni texto adicional.”

Última ejecución (2025-12-31, 20 ejecuciones):

- minimax mediana 1279ms (mín. 1114, máx. 2431)
- opus mediana 2454ms (mín. 1224, máx. 3170)

## Banco de arranque de la CLI

Script: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

Uso:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case tasksJson --case tasksListJson --case tasksAuditJson --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Preajustes:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: ambos preajustes

La salida incluye `sampleCount`, promedio, p50, p95, mín./máx., distribución de códigos de salida/señales y resúmenes de RSS máximo para cada comando. Opcionalmente, `--cpu-prof-dir` / `--heap-prof-dir` escribe perfiles de V8 por ejecución para que la temporización y la captura de perfiles usen el mismo arnés.

Convenciones de salida guardada:

- `pnpm test:startup:bench:smoke` escribe el artefacto de smoke específico en `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` escribe el artefacto de la suite completa en `.artifacts/cli-startup-bench-all.json` usando `runs=5` y `warmup=1`
- `pnpm test:startup:bench:update` actualiza el fixture de línea base versionado en `test/fixtures/cli-startup-bench.json` usando `runs=5` y `warmup=1`

Fixture versionado:

- `test/fixtures/cli-startup-bench.json`
- Actualiza con `pnpm test:startup:bench:update`
- Compara los resultados actuales con el fixture usando `pnpm test:startup:bench:check`

## E2E de incorporación (Docker)

Docker es opcional; esto solo es necesario para las pruebas smoke de incorporación en contenedores.

Flujo completo de arranque en frío en un contenedor Linux limpio:

```bash
scripts/e2e/onboard-docker.sh
```

Este script controla el asistente interactivo mediante una pseudo-tty, verifica los archivos de configuración/espacio de trabajo/sesión, luego inicia el Gateway y ejecuta `openclaw health`.

## Smoke de importación QR (Docker)

Garantiza que el helper de runtime QR mantenido cargue bajo los runtimes Docker Node compatibles (Node 24 predeterminado, Node 22 compatible):

```bash
pnpm test:docker:qr
```

## Relacionado

- [Pruebas](/es/help/testing)
- [Pruebas live](/es/help/testing-live)
- [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins)
