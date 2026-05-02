---
read_when:
    - Ejecutar o corregir pruebas
summary: Cómo ejecutar pruebas localmente (vitest) y cuándo usar los modos force/coverage
title: Pruebas
x-i18n:
    generated_at: "2026-05-02T21:04:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a88599d079e1ca42d73d354b582d67dd85be40fc92eed5abe6dcef37dc21f4f
    source_path: reference/test.md
    workflow: 16
---

- Kit completo de pruebas (conjuntos, en vivo, Docker): [Pruebas](/es/help/testing)
- Validación de actualizaciones y paquetes de plugins: [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins)

- `pnpm test:force`: Mata cualquier proceso Gateway persistente que mantenga ocupado el puerto de control predeterminado y luego ejecuta la suite completa de Vitest con un puerto Gateway aislado para que las pruebas de servidor no colisionen con una instancia en ejecución. Úsalo cuando una ejecución anterior de Gateway haya dejado ocupado el puerto 18789.
- `pnpm test:coverage`: Ejecuta la suite unitaria con cobertura V8 (mediante `vitest.unit.config.ts`). Es una puerta de cobertura unitaria de archivos cargados, no cobertura de todos los archivos de todo el repositorio. Los umbrales son 70% de líneas/funciones/sentencias y 55% de ramas. Como `coverage.all` es false, la puerta mide los archivos cargados por la suite de cobertura unitaria en lugar de tratar cada archivo fuente de carril dividido como no cubierto.
- `pnpm test:coverage:changed`: Ejecuta cobertura unitaria solo para archivos cambiados desde `origin/main`.
- `pnpm test:changed`: ejecución barata e inteligente de pruebas cambiadas. Ejecuta objetivos precisos desde ediciones directas de pruebas, archivos hermanos `*.test.ts`, asignaciones explícitas de código fuente y el grafo de importaciones local. Los cambios amplios/de configuración/de paquete se omiten salvo que se asignen a pruebas precisas.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: ejecución amplia explícita de pruebas cambiadas. Úsalo cuando una edición del arnés/configuración/paquete de pruebas deba recurrir al comportamiento más amplio de pruebas cambiadas de Vitest.
- `pnpm changed:lanes`: muestra los carriles arquitectónicos activados por el diff contra `origin/main`.
- `pnpm check:changed`: ejecuta la puerta inteligente de comprobación de cambios para el diff contra `origin/main`. Ejecuta typecheck, lint y comandos de protección para los carriles arquitectónicos afectados, pero no ejecuta pruebas de Vitest. Usa `pnpm test:changed` o `pnpm test <target>` explícito para la prueba de verificación.
- `pnpm test`: enruta objetivos explícitos de archivo/directorio por carriles Vitest con alcance. Las ejecuciones sin objetivo usan grupos de shards fijos y se expanden a configuraciones hoja para ejecución paralela local; el grupo de extensiones siempre se expande a las configuraciones shard por extensión en lugar de un único proceso gigante de proyecto raíz.
- Las ejecuciones del wrapper de pruebas terminan con un breve resumen `[test] passed|failed|skipped ... in ...`. La línea de duración propia de Vitest queda como detalle por shard.
- Estado compartido de pruebas de OpenClaw: usa `src/test-utils/openclaw-test-state.ts` desde Vitest cuando una prueba necesita un `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture de configuración, espacio de trabajo, directorio de agente o almacén de perfiles de autenticación aislados.
- Helpers E2E de proceso: usa `test/helpers/openclaw-test-instance.ts` cuando una prueba E2E a nivel de proceso de Vitest necesita un Gateway en ejecución, entorno de CLI, captura de logs y limpieza en un solo lugar.
- Helpers E2E de Docker/Bash: los carriles que cargan `scripts/lib/docker-e2e-image.sh` pueden pasar `docker_e2e_test_state_shell_b64 <label> <scenario>` al contenedor y decodificarlo con `scripts/lib/openclaw-e2e-instance.sh`; los scripts multi-home pueden pasar `docker_e2e_test_state_function_b64` y llamar a `openclaw_test_state_create <label> <scenario>` en cada flujo. Los llamadores de nivel inferior pueden usar `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` para un fragmento de shell dentro del contenedor, o `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` para un archivo de entorno del host que se pueda cargar. El `--` antes de `create` evita que los runtimes de Node más recientes traten `--env-file` como una bandera de Node. Los carriles Docker/Bash que lanzan un Gateway pueden cargar `scripts/lib/openclaw-e2e-instance.sh` dentro del contenedor para resolución de entrypoint, arranque de mock de OpenAI, lanzamiento de Gateway en primer plano/segundo plano, sondeos de disponibilidad, exportación de entorno de estado, volcados de logs y limpieza de procesos.
- Las ejecuciones shard completas, de extensión y con patrón de inclusión actualizan los datos locales de tiempos en `.artifacts/vitest-shard-timings.json`; las ejecuciones posteriores de configuración completa usan esos tiempos para equilibrar shards lentos y rápidos. Los shards de CI con patrón de inclusión añaden el nombre del shard a la clave de tiempos, lo que mantiene visibles los tiempos de shards filtrados sin reemplazar los datos de tiempos de configuración completa. Define `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar el artefacto local de tiempos.
- Los archivos de prueba `plugin-sdk` y `commands` seleccionados ahora se enrutan por carriles ligeros dedicados que conservan solo `test/setup.ts`, dejando los casos pesados de runtime en sus carriles existentes.
- Los archivos fuente con pruebas hermanas se asignan a esa prueba hermana antes de recurrir a globs de directorio más amplios. Las ediciones de helpers bajo `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` y `src/plugins/contracts` usan un grafo de importaciones local para ejecutar pruebas importadoras en lugar de ejecutar ampliamente cada shard cuando la ruta de dependencia es precisa.
- `auto-reply` ahora también se divide en tres configuraciones dedicadas (`core`, `top-level`, `reply`) para que el arnés de respuesta no domine las pruebas más ligeras de estado/token/helper de nivel superior.
- La configuración base de Vitest ahora usa de forma predeterminada `pool: "threads"` e `isolate: false`, con el runner compartido no aislado habilitado en todas las configuraciones del repositorio.
- `pnpm test:channels` ejecuta `vitest.channels.config.ts`.
- `pnpm test:extensions` y `pnpm test extensions` ejecutan todos los shards de extensiones/Plugins. Los Plugins de canales pesados, el Plugin de navegador y OpenAI se ejecutan como shards dedicados; otros grupos de Plugins permanecen agrupados. Usa `pnpm test extensions/<id>` para un carril de un Plugin incluido.
- `pnpm test:perf:imports`: habilita informes de duración de importaciones y desglose de importaciones de Vitest, mientras sigue usando enrutamiento de carriles con alcance para objetivos explícitos de archivo/directorio.
- `pnpm test:perf:imports:changed`: el mismo perfilado de importaciones, pero solo para archivos cambiados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` mide el rendimiento de la ruta en modo de cambios enrutada frente a la ejecución nativa del proyecto raíz para el mismo diff de git confirmado.
- `pnpm test:perf:changed:bench -- --worktree` mide el rendimiento del conjunto de cambios del worktree actual sin confirmar primero.
- `pnpm test:perf:profile:main`: escribe un perfil de CPU para el hilo principal de Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: escribe perfiles de CPU y heap para el runner unitario (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: ejecuta serialmente cada configuración hoja de Vitest de la suite completa y escribe datos de duración agrupados más artefactos JSON/log por configuración. El Test Performance Agent usa esto como su línea base antes de intentar corregir pruebas lentas.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: compara informes agrupados después de un cambio centrado en rendimiento.
- Integración de Gateway: optar por incluirla mediante `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: Ejecuta pruebas smoke end-to-end de Gateway (emparejamiento multiinstancia WS/HTTP/node). Usa de forma predeterminada `threads` + `isolate: false` con workers adaptativos en `vitest.e2e.config.ts`; ajusta con `OPENCLAW_E2E_WORKERS=<n>` y define `OPENCLAW_E2E_VERBOSE=1` para logs detallados.
- `pnpm test:live`: Ejecuta pruebas live de proveedores (minimax/zai). Requiere claves de API y `LIVE=1` (o `*_LIVE_TEST=1` específico del proveedor) para dejar de omitirlas.
- `pnpm test:docker:all`: Construye la imagen compartida de pruebas live, empaqueta OpenClaw una vez como un tarball de npm, construye/reutiliza una imagen runner básica de Node/Git más una imagen funcional que instala ese tarball en `/app`, y luego ejecuta carriles smoke de Docker con `OPENCLAW_SKIP_DOCKER_BUILD=1` mediante un planificador ponderado. La imagen básica (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) se usa para carriles de instalador/actualización/dependencias de Plugin; esos carriles montan el tarball precompilado en lugar de usar fuentes copiadas del repositorio. La imagen funcional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) se usa para carriles normales de funcionalidad de la aplicación construida. `scripts/package-openclaw-for-docker.mjs` es el único empaquetador local/CI y valida el tarball más `dist/postinstall-inventory.json` antes de que Docker lo consuma. Las definiciones de carriles Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`; la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ejecuta el plan seleccionado. `node scripts/test-docker-all.mjs --plan-json` emite el plan de CI propiedad del planificador para carriles seleccionados, tipos de imagen, necesidades de paquete/imagen live, escenarios de estado y comprobaciones de credenciales sin construir ni ejecutar Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` controla los slots de proceso y usa 10 de forma predeterminada; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` controla el pool final sensible a proveedores y usa 10 de forma predeterminada. Los límites de carriles pesados usan de forma predeterminada `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` y `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; los límites de proveedores usan de forma predeterminada un carril pesado por proveedor mediante `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` y `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Usa `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` u `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` para hosts más grandes. Si un carril supera el límite efectivo de peso o recursos en un host con bajo paralelismo, aún puede iniciarse desde un pool vacío y se ejecutará solo hasta que libere capacidad. Los inicios de carril se escalonan 2 segundos de forma predeterminada para evitar tormentas locales de creación del daemon de Docker; sobrescribe con `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. El runner realiza preflight de Docker de forma predeterminada, limpia contenedores E2E de OpenClaw obsoletos, emite estado de carriles activos cada 30 segundos, comparte cachés de herramientas CLI de proveedores entre carriles compatibles, reintenta por defecto una vez los fallos transitorios de proveedores live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) y almacena tiempos de carriles en `.artifacts/docker-tests/lane-timings.json` para ordenación de más largo a más corto en ejecuciones posteriores. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir el manifiesto de carriles sin ejecutar Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` para ajustar la salida de estado, u `OPENCLAW_DOCKER_ALL_TIMINGS=0` para deshabilitar la reutilización de tiempos. Usa `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` solo para carriles deterministas/locales o `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` solo para carriles de proveedores live; los alias de paquete son `pnpm test:docker:local:all` y `pnpm test:docker:live:all`. El modo solo live fusiona los carriles live principales y finales en un único pool de más largo a más corto para que los buckets de proveedores puedan empaquetar juntos el trabajo de Claude, Codex y Gemini. El runner deja de planificar carriles agrupados nuevos tras el primer fallo salvo que se defina `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, y cada carril tiene un timeout de reserva de 120 minutos que se puede sobrescribir con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; los carriles live/finales seleccionados usan límites por carril más estrictos. Los comandos de configuración Docker del backend de CLI tienen su propio timeout mediante `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (predeterminado 180). Los logs por carril, `summary.json`, `failures.json` y los tiempos de fase se escriben bajo `.artifacts/docker-tests/<run-id>/`; usa `pnpm test:docker:timings <summary.json>` para inspeccionar carriles lentos y `pnpm test:docker:rerun <run-id|summary.json|failures.json>` para imprimir comandos baratos de reejecución dirigida.
- `pnpm test:docker:browser-cdp-snapshot`: Construye un contenedor E2E de código fuente respaldado por Chromium, inicia CDP sin procesar más un Gateway aislado, ejecuta `browser doctor --deep` y verifica que las instantáneas de roles de CDP incluyan URL de enlaces, elementos clicables promovidos por cursor, refs de iframe y metadatos de frame.
- Las sondas Docker live del backend de CLI se pueden ejecutar como carriles enfocados, por ejemplo `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` o `pnpm test:docker:live-cli-backend:codex:mcp`. Claude y Gemini tienen alias `:resume` y `:mcp` correspondientes.
- `pnpm test:docker:openwebui`: Inicia OpenClaw + Open WebUI dockerizados, inicia sesión mediante Open WebUI, comprueba `/api/models` y luego ejecuta un chat real proxificado mediante `/api/chat/completions`. Requiere una clave de modelo live utilizable (por ejemplo OpenAI en `~/.profile`), descarga una imagen externa de Open WebUI y no se espera que sea estable en CI como las suites unitarias/e2e normales.
- `pnpm test:docker:mcp-channels`: Inicia un contenedor Gateway precargado y un segundo contenedor cliente que genera `openclaw mcp serve`, luego verifica descubrimiento de conversaciones enrutadas, lecturas de transcripción, metadatos de adjuntos, comportamiento de cola de eventos live, enrutamiento de envío saliente y notificaciones de canal + permisos estilo Claude sobre el puente stdio real. La aserción de notificación de Claude lee directamente los frames MCP stdio sin procesar para que el smoke refleje lo que el puente emite realmente.
- `pnpm test:docker:upgrade-survivor`: Instala el tarball empaquetado de OpenClaw sobre un fixture sucio de usuario antiguo, ejecuta la actualización del paquete y `doctor` no interactivo sin claves de proveedores o canales en vivo, luego inicia un Gateway de loopback y comprueba que sobrevivan los agentes, la configuración de canales, las listas de permitidos de plugins, los archivos de espacio de trabajo/sesión, el estado obsoleto de dependencias heredadas de plugins, el inicio y el estado RPC.
- `pnpm test:docker:published-upgrade-survivor`: Instala `openclaw@latest` de forma predeterminada, siembra archivos realistas de usuario existente sin claves de proveedores o canales en vivo, configura esa línea base con una receta integrada de comando `openclaw config set`, actualiza esa instalación publicada al tarball empaquetado de OpenClaw, ejecuta `doctor` no interactivo, escribe `.artifacts/upgrade-survivor/summary.json`, luego inicia un Gateway de loopback y comprueba que los intents configurados, los archivos de espacio de trabajo/sesión, la configuración obsoleta de plugins y el estado de dependencias heredadas, el inicio, `/healthz`, `/readyz` y el estado RPC sobrevivan o se reparen limpiamente. Sobrescribe una línea base con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, expande una matriz exacta con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` como `all-since-2026.4.23`, o añade fixtures de escenario con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; el conjunto `reported-issues` incluye `configured-plugin-installs` para verificar que los plugins externos de OpenClaw configurados se instalen automáticamente durante la actualización. Package Acceptance expone esos valores como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` y `published_upgrade_survivor_scenarios`.
- `pnpm test:docker:update-migration`: Ejecuta el arnés de supervivencia de actualización publicada en el escenario con mucha limpieza `plugin-deps-cleanup`, comenzando en `openclaw@2026.4.23` de forma predeterminada. El flujo de trabajo separado `Update Migration` expande este carril con `baselines=all-since-2026.4.23` para que cada paquete estable publicado desde `.23` en adelante se actualice al candidato y demuestre la limpieza de dependencias de plugins configurados fuera de Full Release CI.
- `pnpm test:docker:plugins`: Ejecuta una prueba smoke de instalación/actualización para ruta local, `file:`, paquetes del registro npm con dependencias elevadas, referencias móviles de git, fixtures de ClawHub, actualizaciones de marketplace y habilitación/inspección de paquetes Claude.

## Puerta local de PR

Para las comprobaciones locales de aterrizaje/puerta de PR, ejecuta:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` falla de forma intermitente en un host cargado, vuelve a ejecutarlo una vez antes de tratarlo como una regresión, y luego aíslalo con `pnpm test <path/to/test>`. Para hosts con memoria limitada, usa:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Banco de latencia de modelos (claves locales)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Entorno opcional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt predeterminado: “Responde con una sola palabra: ok. Sin puntuación ni texto adicional.”

Última ejecución (2025-12-31, 20 ejecuciones):

- mediana de minimax 1279ms (mín. 1114, máx. 2431)
- mediana de opus 2454ms (mín. 1224, máx. 3170)

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

La salida incluye `sampleCount`, promedio, p50, p95, mín./máx., distribución de código de salida/señal y resúmenes de RSS máximo para cada comando. Las opciones opcionales `--cpu-prof-dir` / `--heap-prof-dir` escriben perfiles de V8 por ejecución para que la temporización y la captura de perfiles usen el mismo arnés.

Convenciones de salida guardada:

- `pnpm test:startup:bench:smoke` escribe el artefacto de prueba de humo dirigida en `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` escribe el artefacto de la suite completa en `.artifacts/cli-startup-bench-all.json` usando `runs=5` y `warmup=1`
- `pnpm test:startup:bench:update` actualiza el fixture de referencia versionado en `test/fixtures/cli-startup-bench.json` usando `runs=5` y `warmup=1`

Fixture versionado:

- `test/fixtures/cli-startup-bench.json`
- Actualiza con `pnpm test:startup:bench:update`
- Compara los resultados actuales con el fixture mediante `pnpm test:startup:bench:check`

## E2E de onboarding (Docker)

Docker es opcional; esto solo se necesita para pruebas de humo de onboarding en contenedores.

Flujo completo de arranque en frío en un contenedor Linux limpio:

```bash
scripts/e2e/onboard-docker.sh
```

Este script maneja el asistente interactivo mediante una pseudo-tty, verifica archivos de configuración/espacio de trabajo/sesión y luego inicia el Gateway y ejecuta `openclaw health`.

## Prueba de humo de importación QR (Docker)

Garantiza que el helper de runtime QR mantenido se cargue en los runtimes Docker Node compatibles (Node 24 predeterminado, Node 22 compatible):

```bash
pnpm test:docker:qr
```

## Relacionado

- [Pruebas](/es/help/testing)
- [Pruebas en vivo](/es/help/testing-live)
- [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins)
