---
read_when:
    - Ejecutar o corregir pruebas
summary: Cómo ejecutar pruebas localmente (vitest) y cuándo usar los modos force/coverage
title: Pruebas
x-i18n:
    generated_at: "2026-04-24T05:49:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: df4ad5808ddbc06c704c9bcf9f780b06f9be94ac213ed22e79d880dedcaa6d3b
    source_path: reference/test.md
    workflow: 15
---

- Kit completo de pruebas (suites, live, Docker): [Pruebas](/es/help/testing)

- `pnpm test:force`: elimina cualquier proceso residual de gateway que mantenga ocupado el puerto de control predeterminado y luego ejecuta la suite completa de Vitest con un puerto de gateway aislado para que las pruebas del servidor no entren en conflicto con una instancia en ejecución. Úsalo cuando una ejecución previa del gateway haya dejado ocupado el puerto 18789.
- `pnpm test:coverage`: ejecuta la suite unitaria con cobertura V8 (mediante `vitest.unit.config.ts`). Este es un filtro de cobertura unitaria de archivos cargados, no cobertura de todos los archivos de todo el repositorio. Los umbrales son 70% para líneas/funciones/instrucciones y 55% para ramas. Como `coverage.all` es false, el filtro mide los archivos cargados por la suite de cobertura unitaria en lugar de tratar como no cubiertos todos los archivos fuente de las vías divididas.
- `pnpm test:coverage:changed`: ejecuta cobertura unitaria solo para los archivos modificados desde `origin/main`.
- `pnpm test:changed`: expande las rutas git modificadas a vías de Vitest con alcance cuando la diferencia solo toca archivos fuente/prueba enroutables. Los cambios de config/setup siguen recurriendo a la ejecución nativa de proyectos raíz para que las ediciones de cableado vuelvan a ejecutar ampliamente cuando sea necesario.
- `pnpm changed:lanes`: muestra las vías arquitectónicas activadas por la diferencia respecto a `origin/main`.
- `pnpm check:changed`: ejecuta el filtro inteligente de cambios para la diferencia respecto a `origin/main`. Ejecuta el trabajo core con vías de pruebas core, el trabajo de extensiones con vías de pruebas de extensiones, el trabajo solo de pruebas con solo typecheck/pruebas de test, expande cambios del SDK público de Plugin o del contrato de Plugin a una pasada de validación de extensiones y mantiene los incrementos de versión solo en metadatos de lanzamiento en comprobaciones dirigidas de versión/config/dependencias raíz.
- `pnpm test`: enruta objetivos explícitos de archivo/directorio a través de vías de Vitest con alcance. Las ejecuciones no dirigidas usan grupos fijos de fragmentos y se expanden a configuraciones hoja para ejecución paralela local; el grupo de extensiones siempre se expande a configuraciones fragmentadas por extensión en lugar de un único proceso gigante del proyecto raíz.
- Las ejecuciones completas y fragmentadas de extensiones actualizan datos locales de tiempos en `.artifacts/vitest-shard-timings.json`; las ejecuciones posteriores usan esos tiempos para equilibrar fragmentos lentos y rápidos. Establece `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar el artefacto local de tiempos.
- Los archivos de prueba seleccionados de `plugin-sdk` y `commands` ahora se enrutan a través de vías ligeras dedicadas que solo mantienen `test/setup.ts`, dejando los casos pesados en tiempo de ejecución en sus vías existentes.
- Los archivos fuente auxiliares seleccionados de `plugin-sdk` y `commands` también asignan `pnpm test:changed` a pruebas hermanas explícitas en esas vías ligeras, de modo que pequeñas ediciones en ayudantes evitan volver a ejecutar las suites pesadas respaldadas por tiempo de ejecución.
- `auto-reply` ahora también se divide en tres configuraciones dedicadas (`core`, `top-level`, `reply`) para que el harness de reply no domine las pruebas más ligeras de estado/token/ayudantes de nivel superior.
- La configuración base de Vitest ahora usa por defecto `pool: "threads"` e `isolate: false`, con el ejecutor compartido no aislado habilitado en las configuraciones del repositorio.
- `pnpm test:channels` ejecuta `vitest.channels.config.ts`.
- `pnpm test:extensions` y `pnpm test extensions` ejecutan todos los fragmentos de extensiones/Plugins. Los Plugins pesados de canales, el Plugin de navegador y OpenAI se ejecutan como fragmentos dedicados; otros grupos de Plugins permanecen agrupados. Usa `pnpm test extensions/<id>` para una sola vía de Plugin incluido.
- `pnpm test:perf:imports`: habilita informes de duración de importaciones + desglose de importaciones de Vitest, mientras sigue usando el enrutamiento por vías con alcance para objetivos explícitos de archivo/directorio.
- `pnpm test:perf:imports:changed`: el mismo perfilado de importaciones, pero solo para archivos modificados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` evalúa la ruta routed changed-mode frente a la ejecución nativa del proyecto raíz para la misma diferencia git confirmada.
- `pnpm test:perf:changed:bench -- --worktree` evalúa el conjunto de cambios del árbol de trabajo actual sin necesidad de confirmar primero.
- `pnpm test:perf:profile:main`: escribe un perfil de CPU para el hilo principal de Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: escribe perfiles de CPU + heap para el ejecutor unitario (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: ejecuta serialmente cada configuración hoja de Vitest de la suite completa y escribe datos agrupados de duración más artefactos JSON/log por configuración. El Test Performance Agent usa esto como línea base antes de intentar correcciones de pruebas lentas.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: compara informes agrupados después de un cambio centrado en rendimiento.
- Integración de Gateway: opt-in mediante `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: ejecuta pruebas rápidas end-to-end del gateway (varias instancias, WS/HTTP/vinculación de nodos). Usa por defecto `threads` + `isolate: false` con workers adaptativos en `vitest.e2e.config.ts`; ajústalos con `OPENCLAW_E2E_WORKERS=<n>` y establece `OPENCLAW_E2E_VERBOSE=1` para logs detallados.
- `pnpm test:live`: ejecuta pruebas live de proveedores (minimax/zai). Requiere claves API y `LIVE=1` (o `*_LIVE_TEST=1` específico del proveedor) para desomitir.
- `pnpm test:docker:all`: compila una vez la imagen compartida de pruebas live y la imagen Docker E2E, luego ejecuta las vías de prueba rápida Docker con `OPENCLAW_SKIP_DOCKER_BUILD=1` con concurrencia 8 por defecto. Ajusta el grupo principal con `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` y el grupo de cola sensible a proveedores con `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>`; ambos usan 8 por defecto. El ejecutor deja de programar nuevas vías agrupadas tras el primer fallo salvo que se establezca `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, y cada vía tiene un tiempo de espera de 120 minutos sobrescribible con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Los logs por vía se escriben bajo `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:openwebui`: inicia OpenClaw + Open WebUI en Docker, inicia sesión a través de Open WebUI, comprueba `/api/models` y luego ejecuta un chat real proxy a través de `/api/chat/completions`. Requiere una clave usable de modelo live (por ejemplo OpenAI en `~/.profile`), descarga una imagen externa de Open WebUI y no se espera que sea tan estable para CI como las suites normales unitarias/e2e.
- `pnpm test:docker:mcp-channels`: inicia un contenedor Gateway sembrado y un segundo contenedor cliente que genera `openclaw mcp serve`, luego verifica descubrimiento de conversaciones enrutadas, lecturas de transcripciones, metadatos de adjuntos, comportamiento de cola de eventos live, enrutamiento de envío saliente y notificaciones de estilo Claude de canal + permisos sobre el puente stdio real. La comprobación de notificaciones Claude lee directamente las tramas MCP stdio sin procesar para que la prueba rápida refleje lo que realmente emite el puente.

## Filtro local de PR

Para comprobaciones locales de aterrizaje/filtro de PR, ejecuta:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` falla de forma inestable en un host cargado, vuelve a ejecutarlo una vez antes de tratarlo como regresión y luego aíslalo con `pnpm test <path/to/test>`. Para hosts con memoria limitada, usa:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Evaluación de latencia de modelos (claves locales)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Entorno opcional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt predeterminado: “Reply with a single word: ok. No punctuation or extra text.”

Última ejecución (2025-12-31, 20 ejecuciones):

- minimax mediana 1279ms (mín 1114, máx 2431)
- opus mediana 2454ms (mín 1224, máx 3170)

## Evaluación de arranque de CLI

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

Ajustes predefinidos:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: ambos ajustes predefinidos

La salida incluye `sampleCount`, avg, p50, p95, min/max, distribución de código de salida/señal y resúmenes de RSS máximo para cada comando. `--cpu-prof-dir` / `--heap-prof-dir` opcionales escriben perfiles V8 por ejecución para que tiempo y captura de perfiles usen el mismo harness.

Convenciones de salida guardada:

- `pnpm test:startup:bench:smoke` escribe el artefacto de prueba rápida dirigido en `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` escribe el artefacto de la suite completa en `.artifacts/cli-startup-bench-all.json` usando `runs=5` y `warmup=1`
- `pnpm test:startup:bench:update` actualiza el fixture de línea base versionado en `test/fixtures/cli-startup-bench.json` usando `runs=5` y `warmup=1`

Fixture versionado:

- `test/fixtures/cli-startup-bench.json`
- Actualízalo con `pnpm test:startup:bench:update`
- Compara los resultados actuales con el fixture mediante `pnpm test:startup:bench:check`

## Incorporación E2E (Docker)

Docker es opcional; esto solo hace falta para pruebas rápidas de incorporación en contenedor.

Flujo completo de arranque en frío en un contenedor Linux limpio:

```bash
scripts/e2e/onboard-docker.sh
```

Este script dirige el asistente interactivo mediante un pseudo-tty, verifica archivos de config/workspace/session, luego inicia el gateway y ejecuta `openclaw health`.

## Prueba rápida de importación QR (Docker)

Garantiza que el ayudante de tiempo de ejecución QR mantenido cargue bajo los runtimes Node de Docker compatibles (Node 24 por defecto, Node 22 compatible):

```bash
pnpm test:docker:qr
```

## Relacionado

- [Pruebas](/es/help/testing)
- [Pruebas live](/es/help/testing-live)
