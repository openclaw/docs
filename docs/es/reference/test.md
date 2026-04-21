---
read_when:
    - Ejecutar o corregir pruebas
summary: Cómo ejecutar pruebas localmente (vitest) y cuándo usar los modos force/coverage
title: Pruebas
x-i18n:
    generated_at: "2026-04-21T05:19:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04bdcbc3a1121f4c460cd9060f581a49dfc6fa65c4b9ddb9c87db81c4a535166
    source_path: reference/test.md
    workflow: 15
---

# Pruebas

- Kit completo de pruebas (suites, live, Docker): [Testing](/es/help/testing)

- `pnpm test:force`: mata cualquier proceso residual del gateway que mantenga ocupado el puerto de control predeterminado, luego ejecuta toda la suite de Vitest con un puerto de gateway aislado para que las pruebas del servidor no entren en conflicto con una instancia en ejecución. Úsalo cuando una ejecución anterior del gateway haya dejado ocupado el puerto 18789.
- `pnpm test:coverage`: ejecuta la suite unitaria con cobertura V8 (mediante `vitest.unit.config.ts`). Esta es una puerta de cobertura unitaria de archivos cargados, no una cobertura de todos los archivos de todo el repositorio. Los umbrales son 70% de líneas/funciones/sentencias y 55% de ramas. Como `coverage.all` es false, la puerta mide los archivos cargados por la suite unitaria de cobertura en lugar de tratar cada archivo fuente de lanes divididos como no cubierto.
- `pnpm test:coverage:changed`: ejecuta cobertura unitaria solo para los archivos cambiados desde `origin/main`.
- `pnpm test:changed`: expande las rutas cambiadas en git a lanes de Vitest con alcance cuando el diff solo toca archivos de código fuente/pruebas enrutable. Los cambios de configuración/setup siguen recurriendo a la ejecución nativa de proyectos raíz para que los cambios de wiring se vuelvan a ejecutar ampliamente cuando sea necesario.
- `pnpm changed:lanes`: muestra los lanes arquitectónicos activados por el diff contra `origin/main`.
- `pnpm check:changed`: ejecuta la puerta inteligente de cambios para el diff contra `origin/main`. Ejecuta trabajo del core con lanes de pruebas del core, trabajo de extensiones con lanes de pruebas de extensiones, trabajo solo de pruebas con typecheck/pruebas solamente, y expande cambios del SDK público de Plugin o del contrato de plugins a validación de extensiones.
- `pnpm test`: enruta objetivos explícitos de archivo/directorio mediante lanes de Vitest con alcance. Las ejecuciones sin objetivo usan grupos de shards fijos y se expanden a configuraciones hoja para ejecución local en paralelo; el grupo de extensiones siempre se expande a las configuraciones shard por extensión/plugin en lugar de un único proceso gigante de proyecto raíz.
- Las ejecuciones completas y de shards de extensiones actualizan datos locales de tiempos en `.artifacts/vitest-shard-timings.json`; las ejecuciones posteriores usan esos tiempos para equilibrar shards lentos y rápidos. Establece `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar el artefacto local de tiempos.
- Algunos archivos de prueba `plugin-sdk` y `commands` ahora se enrutan mediante lanes ligeros dedicados que conservan solo `test/setup.ts`, dejando los casos pesados de runtime en sus lanes existentes.
- Algunos archivos fuente helper `plugin-sdk` y `commands` también hacen que `pnpm test:changed` se asigne a pruebas hermanas explícitas en esos lanes ligeros, para que pequeñas ediciones de helpers eviten volver a ejecutar las suites pesadas respaldadas por runtime.
- `auto-reply` ahora también se divide en tres configuraciones dedicadas (`core`, `top-level`, `reply`) para que el arnés de respuestas no domine las pruebas más ligeras de estado/token/helpers de nivel superior.
- La configuración base de Vitest ahora usa por defecto `pool: "threads"` e `isolate: false`, con el runner compartido no aislado habilitado en las configuraciones del repositorio.
- `pnpm test:channels` ejecuta `vitest.channels.config.ts`.
- `pnpm test:extensions` y `pnpm test extensions` ejecutan todos los shards de extensiones/plugins. Las extensiones de canales pesados y OpenAI se ejecutan como shards dedicados; otros grupos de extensiones permanecen agrupados. Usa `pnpm test extensions/<id>` para un lane de un Plugin integrado.
- `pnpm test:perf:imports`: habilita informes de duración de importación + desglose de importación de Vitest, mientras sigue usando enrutamiento por lanes con alcance para objetivos explícitos de archivo/directorio.
- `pnpm test:perf:imports:changed`: el mismo perfilado de importación, pero solo para archivos cambiados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compara el rendimiento de la ruta en modo changed enrutado frente a la ejecución nativa de proyectos raíz para el mismo diff git ya confirmado.
- `pnpm test:perf:changed:bench -- --worktree` compara el conjunto actual de cambios del worktree sin confirmar primero.
- `pnpm test:perf:profile:main`: escribe un perfil de CPU para el hilo principal de Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: escribe perfiles de CPU + heap para el runner unitario (`.artifacts/vitest-runner-profile`).
- Integración Gateway: habilitación opcional mediante `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: ejecuta pruebas smoke end-to-end del gateway (emparejamiento multiinstancia WS/HTTP/node). Usa por defecto `threads` + `isolate: false` con workers adaptativos en `vitest.e2e.config.ts`; ajusta con `OPENCLAW_E2E_WORKERS=<n>` y establece `OPENCLAW_E2E_VERBOSE=1` para registros detallados.
- `pnpm test:live`: ejecuta pruebas live de proveedores (minimax/zai). Requiere claves de API y `LIVE=1` (o `*_LIVE_TEST=1` específico del proveedor) para dejar de omitirlas.
- `pnpm test:docker:openwebui`: inicia OpenClaw + Open WebUI en Docker, inicia sesión a través de Open WebUI, comprueba `/api/models`, luego ejecuta un chat real con proxy a través de `/api/chat/completions`. Requiere una clave de modelo live utilizable (por ejemplo OpenAI en `~/.profile`), descarga una imagen externa de Open WebUI y no se espera que sea estable en CI como las suites unitarias/e2e normales.
- `pnpm test:docker:mcp-channels`: inicia un contenedor Gateway sembrado y un segundo contenedor cliente que lanza `openclaw mcp serve`, luego verifica descubrimiento de conversación enrutada, lectura de transcripts, metadatos de adjuntos, comportamiento de cola de eventos live, enrutamiento de envío saliente y notificaciones estilo Claude de canal + permisos sobre el puente stdio real. La aserción de notificación de Claude lee directamente los frames MCP raw de stdio para que la prueba smoke refleje lo que realmente emite el puente.

## Puerta local de PR

Para comprobaciones locales de aterrizaje/puerta de PR, ejecuta:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` falla de forma intermitente en un host cargado, vuelve a ejecutarlo una vez antes de tratarlo como una regresión; luego aísla con `pnpm test <path/to/test>`. Para hosts con memoria limitada, usa:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Banco de latencia de modelos (claves locales)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Variables de entorno opcionales: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt predeterminado: “Reply with a single word: ok. No punctuation or extra text.”

Última ejecución (2025-12-31, 20 ejecuciones):

- mediana de minimax 1279ms (mín. 1114, máx. 2431)
- mediana de opus 2454ms (mín. 1224, máx. 3170)

## Banco de inicio de CLI

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

Presets:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: ambos presets

La salida incluye `sampleCount`, promedio, p50, p95, mín./máx., distribución de código de salida/señal y resúmenes de RSS máximo para cada comando. `--cpu-prof-dir` / `--heap-prof-dir` opcionales escriben perfiles V8 por ejecución para que la captura de tiempos y perfiles use el mismo arnés.

Convenciones de salida guardada:

- `pnpm test:startup:bench:smoke` escribe el artefacto smoke dirigido en `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` escribe el artefacto de la suite completa en `.artifacts/cli-startup-bench-all.json` usando `runs=5` y `warmup=1`
- `pnpm test:startup:bench:update` actualiza el fixture baseline versionado en `test/fixtures/cli-startup-bench.json` usando `runs=5` y `warmup=1`

Fixture versionado:

- `test/fixtures/cli-startup-bench.json`
- Actualízalo con `pnpm test:startup:bench:update`
- Compara los resultados actuales con el fixture usando `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker es opcional; esto solo es necesario para pruebas smoke de incorporación en contenedor.

Flujo completo de arranque en frío en un contenedor Linux limpio:

```bash
scripts/e2e/onboard-docker.sh
```

Este script maneja el asistente interactivo mediante un pseudo-tty, verifica archivos de configuración/workspace/sesión, luego inicia el gateway y ejecuta `openclaw health`.

## Smoke de importación QR (Docker)

Asegura que `qrcode-terminal` se carga en los runtimes de Node compatibles de Docker (Node 24 por defecto, Node 22 compatible):

```bash
pnpm test:docker:qr
```
