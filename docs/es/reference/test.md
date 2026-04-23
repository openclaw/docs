---
read_when:
    - Ejecutar o corregir pruebas
summary: Cómo ejecutar pruebas localmente (vitest) y cuándo usar los modos force/coverage
title: Pruebas
x-i18n:
    generated_at: "2026-04-23T14:08:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0bcecb0868b3b68361e5ef78afc3170f2a481771bda8f7d54200b1d778d044a
    source_path: reference/test.md
    workflow: 15
---

# Pruebas

- Kit completo de pruebas (suites, live, Docker): [Testing](/es/help/testing)

- `pnpm test:force`: mata cualquier proceso gateway persistente que esté ocupando el puerto de control predeterminado, luego ejecuta la suite completa de Vitest con un puerto de gateway aislado para que las pruebas del servidor no choquen con una instancia en ejecución. Úsalo cuando una ejecución previa del gateway haya dejado ocupado el puerto 18789.
- `pnpm test:coverage`: ejecuta la suite unitaria con cobertura V8 (mediante `vitest.unit.config.ts`). Esto es una puerta de cobertura unitaria sobre archivos cargados, no cobertura de todo el repositorio sobre todos los archivos. Los umbrales son 70 % de líneas/funciones/sentencias y 55 % de ramas. Como `coverage.all` es false, la puerta mide los archivos cargados por la suite de cobertura unitaria en lugar de tratar cada archivo fuente de carril dividido como no cubierto.
- `pnpm test:coverage:changed`: ejecuta cobertura unitaria solo para los archivos modificados desde `origin/main`.
- `pnpm test:changed`: expande las rutas git modificadas en carriles Vitest con alcance acotado cuando el diff solo toca archivos fuente/de prueba enrutables. Los cambios de configuración/setup siguen recurriendo a la ejecución nativa de proyectos raíz para que las ediciones de cableado vuelvan a ejecutarse de forma amplia cuando haga falta.
- `pnpm changed:lanes`: muestra los carriles arquitectónicos activados por el diff frente a `origin/main`.
- `pnpm check:changed`: ejecuta la puerta inteligente de cambios para el diff frente a `origin/main`. Ejecuta trabajo del núcleo con carriles de pruebas del núcleo, trabajo de extensiones con carriles de pruebas de extensiones, trabajo solo de pruebas solo con typecheck/pruebas de pruebas, amplía cambios del Plugin SDK público o del contrato de plugin a validación de extensiones y mantiene los incrementos de versión solo de metadatos de versión en comprobaciones dirigidas de versión/configuración/dependencias raíz.
- `pnpm test`: enruta destinos explícitos de archivo/directorio a través de carriles Vitest acotados. Las ejecuciones sin objetivo usan grupos de fragmentos fijos y se expanden a configuraciones hoja para ejecución paralela local; el grupo de extensiones siempre se expande a configuraciones de fragmentos por extensión en lugar de un único proceso gigante de proyecto raíz.
- Las ejecuciones completas y de fragmentos de extensiones actualizan los datos locales de tiempos en `.artifacts/vitest-shard-timings.json`; las ejecuciones posteriores usan esos tiempos para equilibrar fragmentos lentos y rápidos. Establece `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar el artefacto local de tiempos.
- Algunos archivos de prueba de `plugin-sdk` y `commands` ahora se enrutan por carriles ligeros dedicados que conservan solo `test/setup.ts`, dejando los casos pesados de runtime en sus carriles existentes.
- Algunos archivos fuente auxiliares de `plugin-sdk` y `commands` también hacen que `pnpm test:changed` apunte a pruebas hermanas explícitas en esos carriles ligeros, para que pequeñas ediciones de helpers eviten volver a ejecutar suites pesadas respaldadas por runtime.
- `auto-reply` ahora también se divide en tres configuraciones dedicadas (`core`, `top-level`, `reply`) para que el harness de respuesta no domine las pruebas más ligeras de estado/token/helpers de nivel superior.
- La configuración base de Vitest usa ahora por defecto `pool: "threads"` e `isolate: false`, con el runner compartido no aislado habilitado en todas las configuraciones del repositorio.
- `pnpm test:channels` ejecuta `vitest.channels.config.ts`.
- `pnpm test:extensions` y `pnpm test extensions` ejecutan todos los fragmentos de extensiones/plugins. Las extensiones de canales pesados y OpenAI se ejecutan como fragmentos dedicados; otros grupos de extensiones siguen agrupados. Usa `pnpm test extensions/<id>` para un carril de un Plugin incluido.
- `pnpm test:perf:imports`: habilita informes de duración de importación + desglose de importaciones de Vitest, sin dejar de usar enrutamiento de carriles acotados para destinos explícitos de archivo/directorio.
- `pnpm test:perf:imports:changed`: el mismo perfilado de importaciones, pero solo para archivos modificados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compara la ruta de modo changed enrutada con la ejecución nativa de proyectos raíz para el mismo diff git confirmado.
- `pnpm test:perf:changed:bench -- --worktree` compara el conjunto actual de cambios del worktree sin confirmar antes.
- `pnpm test:perf:profile:main`: escribe un perfil de CPU para el hilo principal de Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: escribe perfiles de CPU + heap para el runner unitario (`.artifacts/vitest-runner-profile`).
- Integración de Gateway: activación opcional mediante `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: ejecuta pruebas smoke end-to-end del gateway (emparejamiento multiinstancia WS/HTTP/nodo). Usa por defecto `threads` + `isolate: false` con workers adaptativos en `vitest.e2e.config.ts`; ajústalo con `OPENCLAW_E2E_WORKERS=<n>` y establece `OPENCLAW_E2E_VERBOSE=1` para registros detallados.
- `pnpm test:live`: ejecuta pruebas live de proveedores (minimax/zai). Requiere claves API y `LIVE=1` (o `*_LIVE_TEST=1` específico del proveedor) para dejar de omitirlas.
- `pnpm test:docker:all`: compila una vez la imagen compartida de pruebas live y la imagen Docker E2E, luego ejecuta los carriles smoke de Docker con `OPENCLAW_SKIP_DOCKER_BUILD=1` con concurrencia 4 de forma predeterminada. Ajústalo con `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>`. El runner deja de programar nuevos carriles agrupados tras el primer fallo salvo que se establezca `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, y cada carril tiene un tiempo límite de 120 minutos modificable con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Los carriles sensibles al arranque o al proveedor se ejecutan en exclusiva después del grupo paralelo. Los registros por carril se escriben en `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:openwebui`: inicia OpenClaw + Open WebUI en Docker, inicia sesión a través de Open WebUI, comprueba `/api/models` y luego ejecuta un chat real con proxy a través de `/api/chat/completions`. Requiere una clave de modelo live utilizable (por ejemplo OpenAI en `~/.profile`), descarga una imagen externa de Open WebUI y no se espera que sea estable en CI como las suites normales unitarias/e2e.
- `pnpm test:docker:mcp-channels`: inicia un contenedor Gateway inicializado y un segundo contenedor cliente que lanza `openclaw mcp serve`, luego verifica detección de conversación enrutada, lecturas de transcripción, metadatos de adjuntos, comportamiento de la cola de eventos live, enrutamiento de envíos salientes y notificaciones de canal + permisos al estilo Claude sobre el puente stdio real. La aserción de notificación de Claude lee directamente las tramas MCP stdio sin procesar para que el smoke refleje lo que realmente emite el puente.

## Puerta local de PR

Para comprobaciones locales de aterrizaje/puerta de PR, ejecuta:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` falla de forma intermitente en un host cargado, vuelve a ejecutarlo una vez antes de tratarlo como regresión, y luego aísla con `pnpm test <path/to/test>`. Para hosts con memoria limitada, usa:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark de latencia de modelo (claves locales)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Variables de entorno opcionales: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt predeterminado: “Reply with a single word: ok. No punctuation or extra text.”

Última ejecución (2025-12-31, 20 ejecuciones):

- minimax mediana 1279 ms (mín 1114, máx 2431)
- opus mediana 2454 ms (mín 1224, máx 3170)

## Benchmark de inicio de CLI

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

La salida incluye `sampleCount`, media, p50, p95, mín/máx, distribución de código de salida/señal y resúmenes de RSS máximo para cada comando. `--cpu-prof-dir` / `--heap-prof-dir` opcionales escriben perfiles V8 por ejecución para que la captura de tiempos y perfiles use el mismo harness.

Convenciones de salida guardada:

- `pnpm test:startup:bench:smoke` escribe el artefacto smoke dirigido en `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` escribe el artefacto de la suite completa en `.artifacts/cli-startup-bench-all.json` usando `runs=5` y `warmup=1`
- `pnpm test:startup:bench:update` actualiza la referencia base versionada en `test/fixtures/cli-startup-bench.json` usando `runs=5` y `warmup=1`

Referencia versionada:

- `test/fixtures/cli-startup-bench.json`
- Actualízala con `pnpm test:startup:bench:update`
- Compara los resultados actuales frente a la referencia con `pnpm test:startup:bench:check`

## E2E de onboarding (Docker)

Docker es opcional; esto solo es necesario para pruebas smoke de onboarding en contenedor.

Flujo completo de arranque en frío en un contenedor Linux limpio:

```bash
scripts/e2e/onboard-docker.sh
```

Este script controla el asistente interactivo mediante un pseudo-TTY, verifica archivos de configuración/espacio de trabajo/sesión, luego inicia el gateway y ejecuta `openclaw health`.

## Smoke de importación QR (Docker)

Garantiza que `qrcode-terminal` cargue bajo los runtimes Node de Docker compatibles (Node 24 predeterminado, Node 22 compatible):

```bash
pnpm test:docker:qr
```
