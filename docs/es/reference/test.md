---
read_when:
    - Ejecutar o corregir pruebas
summary: Cómo ejecutar pruebas localmente (`vitest`) y cuándo usar los modos force/coverage
title: Pruebas
x-i18n:
    generated_at: "2026-04-26T11:37:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24eb2d122c806237bd4b90dffbd293479763c11a42cfcd195e1aed59efc71a5b
    source_path: reference/test.md
    workflow: 15
---

- Kit completo de pruebas (suites, live, Docker): [Pruebas](/es/help/testing)

- `pnpm test:force`: Finaliza cualquier proceso Gateway persistente que esté reteniendo el puerto de control predeterminado y luego ejecuta la suite completa de Vitest con un puerto de Gateway aislado para que las pruebas del servidor no entren en conflicto con una instancia en ejecución. Usa esto cuando una ejecución previa de Gateway haya dejado ocupado el puerto 18789.
- `pnpm test:coverage`: Ejecuta la suite unitaria con cobertura V8 (mediante `vitest.unit.config.ts`). Esta es una puerta de cobertura unitaria de archivos cargados, no una cobertura de todos los archivos de todo el repositorio. Los umbrales son 70 % de líneas/funciones/declaraciones y 55 % de ramas. Como `coverage.all` es false, la puerta mide los archivos cargados por la suite de cobertura unitaria en lugar de tratar cada archivo fuente de carriles divididos como no cubierto.
- `pnpm test:coverage:changed`: Ejecuta cobertura unitaria solo para los archivos modificados desde `origin/main`.
- `pnpm test:changed`: expande las rutas de git modificadas en carriles de Vitest acotados cuando el diff solo toca archivos fuente/de prueba enrutables. Los cambios de configuración/preparación siguen recurriendo a la ejecución nativa de proyectos raíz para que las ediciones del cableado vuelvan a ejecutarse ampliamente cuando sea necesario.
- `pnpm test:changed:focused`: ejecución de pruebas modificadas para el bucle interno. Solo ejecuta objetivos precisos a partir de ediciones directas de pruebas, archivos `*.test.ts` hermanos, asignaciones explícitas de fuentes y el grafo local de importaciones. Los cambios amplios/de configuración/de paquetes se omiten en lugar de expandirse al fallback completo de pruebas modificadas.
- `pnpm changed:lanes`: muestra los carriles arquitectónicos activados por el diff frente a `origin/main`.
- `pnpm check:changed`: ejecuta la puerta inteligente de cambios para el diff frente a `origin/main`. Ejecuta el trabajo del núcleo con los carriles de pruebas del núcleo, el trabajo de extensiones con los carriles de pruebas de extensiones, el trabajo solo de pruebas con solo typecheck/pruebas de pruebas, expande los cambios públicos del Plugin SDK o del contrato de plugins a una pasada de validación de extensiones, y mantiene los incrementos de versión solo de metadatos de versión en verificaciones dirigidas de versión/configuración/dependencias raíz.
- `pnpm test`: enruta objetivos explícitos de archivo/directorio mediante carriles de Vitest acotados. Las ejecuciones sin objetivo usan grupos fijos de shards y se expanden a configuraciones hoja para ejecución paralela local; el grupo de extensiones siempre se expande a las configuraciones de shards por extensión en lugar de a un único proceso gigante de proyecto raíz.
- Las ejecuciones de shards completos, de extensiones y con patrón include actualizan los datos locales de temporización en `.artifacts/vitest-shard-timings.json`; las ejecuciones posteriores de configuración completa usan esas temporizaciones para equilibrar shards lentos y rápidos. Los shards de CI con patrón include añaden el nombre del shard a la clave de temporización, lo que mantiene visibles las temporizaciones de shards filtrados sin reemplazar los datos de temporización de configuración completa. Configura `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar el artefacto local de temporización.
- Los archivos de prueba seleccionados de `plugin-sdk` y `commands` ahora se enrutan mediante carriles ligeros dedicados que mantienen solo `test/setup.ts`, dejando los casos pesados en tiempo de ejecución en sus carriles existentes.
- Los archivos fuente con pruebas hermanas se asignan primero a esa prueba hermana antes de recurrir a globs de directorio más amplios. Las ediciones de ayudantes en `test/helpers/channels` y `test/helpers/plugins` usan un grafo local de importaciones para ejecutar las pruebas que importan en lugar de ejecutar ampliamente cada shard cuando la ruta de dependencia es precisa.
- `auto-reply` ahora también se divide en tres configuraciones dedicadas (`core`, `top-level`, `reply`) para que el arnés de reply no domine las pruebas más ligeras de estado/tokens/helpers de nivel superior.
- La configuración base de Vitest ahora usa por defecto `pool: "threads"` e `isolate: false`, con el ejecutor compartido no aislado habilitado en las configuraciones del repositorio.
- `pnpm test:channels` ejecuta `vitest.channels.config.ts`.
- `pnpm test:extensions` y `pnpm test extensions` ejecutan todos los shards de extensiones/plugins. Los plugins pesados de canales, el plugin del navegador y OpenAI se ejecutan como shards dedicados; otros grupos de plugins siguen agrupados. Usa `pnpm test extensions/<id>` para un carril de plugin empaquetado.
- `pnpm test:perf:imports`: habilita informes de duración de importación + desglose de importaciones de Vitest, mientras sigue usando el enrutamiento de carriles acotados para objetivos explícitos de archivo/directorio.
- `pnpm test:perf:imports:changed`: el mismo perfilado de importaciones, pero solo para archivos modificados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compara mediante benchmark la ruta enrutada del modo changed con la ejecución nativa de proyectos raíz para el mismo diff de git confirmado.
- `pnpm test:perf:changed:bench -- --worktree` compara mediante benchmark el conjunto de cambios del worktree actual sin confirmar primero.
- `pnpm test:perf:profile:main`: escribe un perfil de CPU para el hilo principal de Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: escribe perfiles de CPU + heap para el ejecutor unitario (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: ejecuta en serie cada configuración hoja de Vitest de la suite completa y escribe datos de duración agrupados más artefactos JSON/log por configuración. El agente Test Performance usa esto como línea base antes de intentar corregir pruebas lentas.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: compara informes agrupados después de un cambio centrado en rendimiento.
- Integración de Gateway: activación opcional mediante `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: Ejecuta pruebas smoke end-to-end de Gateway (emparejamiento WS/HTTP/node de múltiples instancias). Usa por defecto `threads` + `isolate: false` con workers adaptativos en `vitest.e2e.config.ts`; ajústalo con `OPENCLAW_E2E_WORKERS=<n>` y configura `OPENCLAW_E2E_VERBOSE=1` para registros detallados.
- `pnpm test:live`: Ejecuta pruebas live de proveedores (minimax/zai). Requiere claves API y `LIVE=1` (o `*_LIVE_TEST=1` específico del proveedor) para desomitirlas.
- `pnpm test:docker:all`: Compila una vez la imagen compartida de pruebas live y la imagen Docker E2E, y luego ejecuta los carriles smoke de Docker con `OPENCLAW_SKIP_DOCKER_BUILD=1` mediante un planificador ponderado. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` controla los slots de proceso y por defecto es 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` controla el grupo tail sensible al proveedor y por defecto es 10. Los límites de carriles pesados por defecto son `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` y `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; los límites por proveedor por defecto son un carril pesado por proveedor mediante `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` y `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Usa `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` para hosts más grandes. El inicio de carriles se escalona 2 segundos por defecto para evitar tormentas locales de creación del daemon Docker; sobrescríbelo con `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. El ejecutor realiza una verificación previa de Docker por defecto, limpia contenedores E2E obsoletos de OpenClaw, emite el estado de carriles activos cada 30 segundos, comparte cachés de herramientas CLI del proveedor entre carriles compatibles, reintenta una vez por defecto los fallos transitorios de proveedores live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) y almacena las temporizaciones de carriles en `.artifacts/docker-tests/lane-timings.json` para el orden de mayor duración primero en ejecuciones posteriores. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir el manifiesto de carriles sin ejecutar Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` para ajustar la salida de estado, o `OPENCLAW_DOCKER_ALL_TIMINGS=0` para desactivar la reutilización de temporizaciones. Usa `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` para solo carriles deterministas/locales o `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` para solo carriles de proveedor live; los alias de paquete son `pnpm test:docker:local:all` y `pnpm test:docker:live:all`. El modo solo live fusiona los carriles live principales y tail en un único grupo de mayor duración primero para que los buckets de proveedores puedan empaquetar juntos trabajo de Claude, Codex y Gemini. El ejecutor deja de programar nuevos carriles agrupados tras el primer fallo salvo que se configure `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, y cada carril tiene un tiempo de espera alternativo de 120 minutos que puede sobrescribirse con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; algunos carriles live/tail seleccionados usan límites por carril más ajustados. Los comandos de preparación Docker del backend CLI tienen su propio tiempo de espera mediante `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (180 por defecto). Los registros por carril se escriben en `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:browser-cdp-snapshot`: Compila un contenedor E2E de origen con Chromium, inicia CDP sin procesar más un Gateway aislado, ejecuta `browser doctor --deep` y verifica que las instantáneas de roles de CDP incluyan URL de enlaces, elementos clicables promovidos por cursor, refs de iframe y metadatos de frame.
- Las sondas Docker live del backend CLI pueden ejecutarse como carriles focalizados, por ejemplo `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` o `pnpm test:docker:live-cli-backend:codex:mcp`. Claude y Gemini tienen alias equivalentes `:resume` y `:mcp`.
- `pnpm test:docker:openwebui`: Inicia OpenClaw + Open WebUI en Docker, inicia sesión a través de Open WebUI, comprueba `/api/models` y luego ejecuta un chat real en proxy a través de `/api/chat/completions`. Requiere una clave de modelo live utilizable (por ejemplo OpenAI en `~/.profile`), descarga una imagen externa de Open WebUI y no se espera que sea estable en CI como las suites normales de unit/e2e.
- `pnpm test:docker:mcp-channels`: Inicia un contenedor Gateway presembrado y un segundo contenedor cliente que lanza `openclaw mcp serve`, y luego verifica descubrimiento de conversaciones enrutadas, lecturas de transcripciones, metadatos de adjuntos, comportamiento de colas de eventos live, enrutamiento de envío saliente y notificaciones de canal + permisos al estilo Claude sobre el puente stdio real. La aserción de notificación de Claude lee directamente los frames MCP stdio sin procesar para que la prueba smoke refleje lo que el puente realmente emite.

## Puerta local de PR

Para comprobaciones locales de aterrizaje/puerta de PR, ejecuta:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` falla de forma intermitente en un host cargado, vuelve a ejecutarlo una vez antes de tratarlo como una regresión, y luego aísla con `pnpm test <path/to/test>`. Para hosts con memoria limitada, usa:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark de latencia de modelos (claves locales)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Variables de entorno opcionales: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt predeterminado: “Reply with a single word: ok. No punctuation or extra text.”

Última ejecución (2025-12-31, 20 ejecuciones):

- minimax mediana 1279ms (mín 1114, máx 2431)
- opus mediana 2454ms (mín 1224, máx 3170)

## Benchmark de arranque de CLI

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
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Preajustes:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: ambos preajustes

La salida incluye `sampleCount`, media, p50, p95, mín/máx, distribución de códigos de salida/señales y resúmenes de RSS máximo para cada comando. `--cpu-prof-dir` / `--heap-prof-dir` opcionales escriben perfiles V8 por ejecución para que la medición de tiempo y la captura de perfiles usen el mismo arnés.

Convenciones de salida guardada:

- `pnpm test:startup:bench:smoke` escribe el artefacto smoke específico en `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` escribe el artefacto de la suite completa en `.artifacts/cli-startup-bench-all.json` usando `runs=5` y `warmup=1`
- `pnpm test:startup:bench:update` actualiza el fixture base versionado en `test/fixtures/cli-startup-bench.json` usando `runs=5` y `warmup=1`

Fixture versionado:

- `test/fixtures/cli-startup-bench.json`
- Actualízalo con `pnpm test:startup:bench:update`
- Compara los resultados actuales con el fixture mediante `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker es opcional; esto solo es necesario para pruebas smoke de onboarding en contenedores.

Flujo completo de arranque en frío en un contenedor Linux limpio:

```bash
scripts/e2e/onboard-docker.sh
```

Este script controla el asistente interactivo mediante una pseudo-TTY, verifica archivos de configuración/espacio de trabajo/sesión, luego inicia el Gateway y ejecuta `openclaw health`.

## Prueba smoke de importación de QR (Docker)

Garantiza que el helper de ejecución QR mantenido se cargue bajo los runtimes Node de Docker compatibles (Node 24 predeterminado, Node 22 compatible):

```bash
pnpm test:docker:qr
```

## Relacionado

- [Pruebas](/es/help/testing)
- [Pruebas live](/es/help/testing-live)
