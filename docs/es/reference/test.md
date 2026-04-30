---
read_when:
    - Ejecutar o corregir pruebas
summary: Cómo ejecutar pruebas localmente (vitest) y cuándo usar los modos de forzado/cobertura
title: Pruebas
x-i18n:
    generated_at: "2026-04-30T18:38:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 131f2bad3b2806d28394213cec38d632d106ddbf8ff04d06345ab8046fb8bcf2
    source_path: reference/test.md
    workflow: 16
---

- Kit completo de pruebas (suites, en vivo, Docker): [Pruebas](/es/help/testing)

- `pnpm test:force`: Finaliza cualquier proceso de Gateway persistente que esté ocupando el puerto de control predeterminado y luego ejecuta toda la suite de Vitest con un puerto de Gateway aislado para que las pruebas de servidor no colisionen con una instancia en ejecución. Usa esto cuando una ejecución anterior de Gateway haya dejado ocupado el puerto 18789.
- `pnpm test:coverage`: Ejecuta la suite unitaria con cobertura de V8 (mediante `vitest.unit.config.ts`). Esta es una puerta de cobertura unitaria de archivos cargados, no cobertura de todos los archivos de todo el repositorio. Los umbrales son 70% para líneas/funciones/instrucciones y 55% para ramas. Como `coverage.all` es false, la puerta mide los archivos cargados por la suite de cobertura unitaria en lugar de tratar cada archivo fuente de carril dividido como no cubierto.
- `pnpm test:coverage:changed`: Ejecuta cobertura unitaria solo para archivos cambiados desde `origin/main`.
- `pnpm test:changed`: ejecución barata e inteligente de pruebas cambiadas. Ejecuta objetivos precisos a partir de ediciones directas de pruebas, archivos hermanos `*.test.ts`, asignaciones explícitas de código fuente y el grafo de importación local. Los cambios amplios de configuración/paquetes se omiten salvo que se asignen a pruebas precisas.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: ejecución amplia explícita de pruebas cambiadas. Úsala cuando una edición del arnés de pruebas/configuración/paquete deba volver al comportamiento más amplio de pruebas cambiadas de Vitest.
- `pnpm changed:lanes`: muestra los carriles arquitectónicos activados por el diff contra `origin/main`.
- `pnpm check:changed`: ejecuta la puerta inteligente de comprobación de cambios para el diff contra `origin/main`. Ejecuta comandos de verificación de tipos, lint y guardas para los carriles arquitectónicos afectados, pero no ejecuta pruebas de Vitest. Usa `pnpm test:changed` o `pnpm test <target>` explícito como prueba de tests.
- `pnpm test`: enruta objetivos explícitos de archivo/directorio mediante carriles de Vitest con alcance. Las ejecuciones sin objetivo usan grupos de shards fijos y se expanden a configuraciones hoja para la ejecución paralela local; el grupo de extensiones siempre se expande a las configuraciones de shard por extensión en lugar de un único proceso gigante de proyecto raíz.
- Las ejecuciones del wrapper de pruebas terminan con un resumen breve `[test] passed|failed|skipped ... in ...`. La propia línea de duración de Vitest permanece como el detalle por shard.
- Estado compartido de pruebas de OpenClaw: usa `src/test-utils/openclaw-test-state.ts` desde Vitest cuando una prueba necesita un `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture de configuración, workspace, directorio de agente o almacén de perfiles de autenticación aislados.
- Helpers de E2E de proceso: usa `test/helpers/openclaw-test-instance.ts` cuando una prueba E2E a nivel de proceso de Vitest necesita un Gateway en ejecución, entorno de CLI, captura de logs y limpieza en un solo lugar.
- Helpers de E2E de Docker/Bash: los carriles que importan `scripts/lib/docker-e2e-image.sh` pueden pasar `docker_e2e_test_state_shell_b64 <label> <scenario>` al contenedor y decodificarlo con `scripts/lib/openclaw-e2e-instance.sh`; los scripts multi-home pueden pasar `docker_e2e_test_state_function_b64` y llamar a `openclaw_test_state_create <label> <scenario>` en cada flujo. Los llamadores de nivel inferior pueden usar `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` para un fragmento de shell dentro del contenedor, o `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` para un archivo de entorno del host que se pueda importar. El `--` antes de `create` evita que runtimes de Node más recientes traten `--env-file` como una flag de Node. Los carriles de Docker/Bash que inician un Gateway pueden importar `scripts/lib/openclaw-e2e-instance.sh` dentro del contenedor para resolución de entrypoint, arranque simulado de OpenAI, lanzamiento de Gateway en primer plano/segundo plano, sondas de disponibilidad, exportación de entorno de estado, volcados de logs y limpieza de procesos.
- Las ejecuciones de shards completas, de extensión y con patrón de inclusión actualizan datos locales de tiempos en `.artifacts/vitest-shard-timings.json`; las ejecuciones posteriores de configuración completa usan esos tiempos para equilibrar shards lentos y rápidos. Los shards de CI con patrón de inclusión añaden el nombre del shard a la clave de tiempo, lo que mantiene visibles los tiempos de shards filtrados sin reemplazar los datos de tiempo de configuración completa. Define `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar el artefacto local de tiempos.
- Los archivos de prueba seleccionados de `plugin-sdk` y `commands` ahora se enrutan por carriles ligeros dedicados que mantienen solo `test/setup.ts`, dejando los casos pesados de runtime en sus carriles existentes.
- Los archivos fuente con pruebas hermanas se asignan a esa prueba hermana antes de volver a globs de directorio más amplios. Las ediciones de helpers bajo `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` y `src/plugins/contracts` usan un grafo de importación local para ejecutar las pruebas que importan esos helpers en lugar de ejecutar ampliamente cada shard cuando la ruta de dependencia es precisa.
- `auto-reply` ahora también se divide en tres configuraciones dedicadas (`core`, `top-level`, `reply`) para que el arnés de respuestas no domine las pruebas más ligeras de estado/token/helpers de nivel superior.
- La configuración base de Vitest ahora usa por defecto `pool: "threads"` e `isolate: false`, con el runner compartido no aislado habilitado en todas las configuraciones del repositorio.
- `pnpm test:channels` ejecuta `vitest.channels.config.ts`.
- `pnpm test:extensions` y `pnpm test extensions` ejecutan todos los shards de extensiones/plugins. Los plugins de canal pesados, el Plugin de navegador y OpenAI se ejecutan como shards dedicados; otros grupos de plugins permanecen agrupados. Usa `pnpm test extensions/<id>` para un carril de Plugin incluido.
- `pnpm test:perf:imports`: habilita informes de duración de importación y desglose de importaciones de Vitest, mientras sigue usando enrutamiento por carriles con alcance para objetivos explícitos de archivo/directorio.
- `pnpm test:perf:imports:changed`: el mismo perfilado de importaciones, pero solo para archivos cambiados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compara el rendimiento de la ruta enrutada en modo cambiado frente a la ejecución nativa de proyecto raíz para el mismo diff de git confirmado.
- `pnpm test:perf:changed:bench -- --worktree` compara el conjunto de cambios actual del worktree sin confirmar primero.
- `pnpm test:perf:profile:main`: escribe un perfil de CPU para el hilo principal de Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: escribe perfiles de CPU y heap para el runner unitario (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: ejecuta serialmente cada configuración hoja de Vitest de la suite completa y escribe datos de duración agrupados junto con artefactos JSON/log por configuración. El Test Performance Agent usa esto como su línea base antes de intentar correcciones de pruebas lentas.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: compara informes agrupados después de un cambio enfocado en rendimiento.
- Integración de Gateway: opt-in mediante `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: Ejecuta pruebas smoke end-to-end de Gateway (emparejamiento multiinstancia WS/HTTP/node). Usa por defecto `threads` + `isolate: false` con workers adaptativos en `vitest.e2e.config.ts`; ajusta con `OPENCLAW_E2E_WORKERS=<n>` y define `OPENCLAW_E2E_VERBOSE=1` para logs detallados.
- `pnpm test:live`: Ejecuta pruebas live de proveedores (minimax/zai). Requiere claves API y `LIVE=1` (o `*_LIVE_TEST=1` específico del proveedor) para dejar de omitirse.
- `pnpm test:docker:all`: Construye la imagen compartida de pruebas live, empaqueta OpenClaw una vez como tarball de npm, construye/reutiliza una imagen runner básica de Node/Git más una imagen funcional que instala ese tarball en `/app`, y luego ejecuta carriles smoke de Docker con `OPENCLAW_SKIP_DOCKER_BUILD=1` mediante un planificador ponderado. La imagen básica (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) se usa para carriles de instalador/actualización/dependencias de plugins; esos carriles montan el tarball preconstruido en lugar de usar fuentes copiadas del repositorio. La imagen funcional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) se usa para carriles normales de funcionalidad de la app construida. `scripts/package-openclaw-for-docker.mjs` es el único empaquetador local/CI y valida el tarball junto con `dist/postinstall-inventory.json` antes de que Docker lo consuma. Las definiciones de carriles de Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`; la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ejecuta el plan seleccionado. `node scripts/test-docker-all.mjs --plan-json` emite el plan de CI propiedad del planificador para carriles seleccionados, tipos de imagen, necesidades de paquete/imagen live, escenarios de estado y comprobaciones de credenciales sin construir ni ejecutar Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` controla los slots de proceso y por defecto es 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` controla el pool de cola sensible a proveedores y por defecto es 10. Los límites de carriles pesados por defecto son `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` y `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; los límites de proveedores por defecto son un carril pesado por proveedor mediante `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` y `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Usa `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` u `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` para hosts más grandes. Si un carril supera el límite efectivo de peso o recursos en un host con poco paralelismo, aun así puede iniciar desde un pool vacío y se ejecutará solo hasta liberar capacidad. Los inicios de carriles se escalonan por defecto 2 segundos para evitar tormentas locales de creación del daemon de Docker; sobrescríbelo con `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. El runner hace preflight de Docker por defecto, limpia contenedores E2E obsoletos de OpenClaw, emite estado de carriles activos cada 30 segundos, comparte cachés de herramientas CLI de proveedores entre carriles compatibles, reintenta una vez por defecto los fallos transitorios de proveedores live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) y guarda tiempos de carril en `.artifacts/docker-tests/lane-timings.json` para ordenamiento de más largo a más corto en ejecuciones posteriores. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir el manifiesto de carriles sin ejecutar Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` para ajustar la salida de estado, u `OPENCLAW_DOCKER_ALL_TIMINGS=0` para deshabilitar la reutilización de tiempos. Usa `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` solo para carriles deterministas/locales o `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` solo para carriles de proveedor live; los alias de paquete son `pnpm test:docker:local:all` y `pnpm test:docker:live:all`. El modo solo live fusiona los carriles live principales y de cola en un único pool de más largo a más corto para que los buckets de proveedores puedan empaquetar juntos trabajos de Claude, Codex y Gemini. El runner deja de programar nuevos carriles agrupados tras el primer fallo salvo que se defina `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, y cada carril tiene un timeout fallback de 120 minutos que puede sobrescribirse con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; carriles live/de cola seleccionados usan límites por carril más estrictos. Los comandos de configuración Docker del backend CLI tienen su propio timeout mediante `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (predeterminado 180). Los logs por carril, `summary.json`, `failures.json` y tiempos de fase se escriben bajo `.artifacts/docker-tests/<run-id>/`; usa `pnpm test:docker:timings <summary.json>` para inspeccionar carriles lentos y `pnpm test:docker:rerun <run-id|summary.json|failures.json>` para imprimir comandos baratos de repetición dirigida.
- `pnpm test:docker:browser-cdp-snapshot`: Construye un contenedor E2E de código fuente respaldado por Chromium, inicia CDP sin procesar más un Gateway aislado, ejecuta `browser doctor --deep` y verifica que los snapshots de roles de CDP incluyan URLs de enlaces, elementos clicables promovidos por cursor, referencias de iframe y metadatos de frame.
- Las sondas Docker live de backend CLI se pueden ejecutar como carriles enfocados, por ejemplo `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` o `pnpm test:docker:live-cli-backend:codex:mcp`. Claude y Gemini tienen alias `:resume` y `:mcp` equivalentes.
- `pnpm test:docker:openwebui`: Inicia OpenClaw + Open WebUI en Docker, inicia sesión mediante Open WebUI, comprueba `/api/models` y luego ejecuta un chat real proxyficado mediante `/api/chat/completions`. Requiere una clave de modelo live utilizable (por ejemplo OpenAI en `~/.profile`), descarga una imagen externa de Open WebUI y no se espera que sea estable en CI como las suites normales unitarias/e2e.
- `pnpm test:docker:mcp-channels`: Inicia un contenedor de Gateway sembrado y un segundo contenedor cliente que genera `openclaw mcp serve`, luego verifica descubrimiento de conversaciones enrutadas, lecturas de transcripciones, metadatos de adjuntos, comportamiento de la cola de eventos live, enrutamiento de envíos salientes y notificaciones de canal + permisos estilo Claude sobre el puente stdio real. La aserción de notificación de Claude lee directamente los frames MCP stdio sin procesar para que el smoke refleje lo que el puente emite realmente.
- `pnpm test:docker:upgrade-survivor`: Instala el tarball empaquetado de OpenClaw sobre una fixture de usuario antiguo con cambios locales, ejecuta la actualización del paquete y el diagnóstico no interactivo sin claves de proveedor en vivo ni de canal, luego inicia un Gateway de loopback y comprueba que sobrevivan los agentes, la configuración de canales, las listas de permitidos de plugins, los archivos de espacio de trabajo/sesión, el estado obsoleto de dependencias de tiempo de ejecución de plugins, el inicio y el estado de RPC.

## Validación local de PR

Para las comprobaciones locales de integración/validación de PR, ejecuta:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` falla de forma intermitente en un host con mucha carga, vuelve a ejecutarlo una vez antes de tratarlo como una regresión; luego aísla el problema con `pnpm test <path/to/test>`. Para hosts con memoria limitada, usa:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Banco de latencia de modelos (claves locales)

Secuencia de comandos: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Variables de entorno opcionales: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt predeterminado: “Responde con una sola palabra: ok. Sin puntuación ni texto adicional.”

Última ejecución (2025-12-31, 20 ejecuciones):

- mediana de minimax 1279 ms (mín. 1114, máx. 2431)
- mediana de opus 2454 ms (mín. 1224, máx. 3170)

## Banco de arranque de la CLI

Secuencia de comandos: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

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

La salida incluye `sampleCount`, promedio, p50, p95, mín./máx., distribución de códigos de salida/señales y resúmenes de RSS máximo para cada comando. Las opciones `--cpu-prof-dir` / `--heap-prof-dir` escriben perfiles de V8 por ejecución para que la temporización y la captura de perfiles usen el mismo arnés.

Convenciones de salida guardada:

- `pnpm test:startup:bench:smoke` escribe el artefacto de smoke específico en `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` escribe el artefacto de la suite completa en `.artifacts/cli-startup-bench-all.json` usando `runs=5` y `warmup=1`
- `pnpm test:startup:bench:update` actualiza la fixture de referencia registrada en `test/fixtures/cli-startup-bench.json` usando `runs=5` y `warmup=1`

Fixture registrada:

- `test/fixtures/cli-startup-bench.json`
- Actualiza con `pnpm test:startup:bench:update`
- Compara los resultados actuales con la fixture usando `pnpm test:startup:bench:check`

## E2E de incorporación (Docker)

Docker es opcional; esto solo es necesario para pruebas smoke de incorporación en contenedores.

Flujo completo de arranque en frío en un contenedor Linux limpio:

```bash
scripts/e2e/onboard-docker.sh
```

Esta secuencia de comandos controla el asistente interactivo mediante una pseudo-tty, verifica los archivos de configuración/espacio de trabajo/sesión, luego inicia el Gateway y ejecuta `openclaw health`.

## Smoke de importación QR (Docker)

Garantiza que el helper de runtime QR mantenido cargue en los runtimes Node compatibles de Docker (Node 24 predeterminado, Node 22 compatible):

```bash
pnpm test:docker:qr
```

## Relacionado

- [Pruebas](/es/help/testing)
- [Pruebas en vivo](/es/help/testing-live)
